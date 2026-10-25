# Notes: spells-vfx

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). Spell VFX/timing, spell camera, finishers + EXECUTIONS, spell director.
Append new notes for this system at the end of this file.

## THE STRIKE FRAME (animation ↔ VFX timing) — added 2026-09-09
Every action slot in sprites.js `UAL_SLOTS` carries **`strikeAt`** — the
SOURCE-clip second on which the hit / release / bloom lands (read off frame
contact sheets of every library clip; the table is in PLAYTEST_NOTES "THE
STRIKE FRAME") — and optionally **`trim: [from, to]`** (bake only that window;
strikeAt stays in source seconds). The renderer answers
`ThreeAnim.castStrikeMs(unit, kind)` / `attackStrikeMs` (−1 = no library
clip); battle.js starts the clip that many ms BEFORE the launch / impact it
scheduled (`_releaseCastSprite` trades the source hold for it, doAttack's
`_attackStrikeLeadMs`), and the forge preview fires its burst on the same
frame (`_cvStrikeMs`). Adding / retuning a clip = set `strikeAt` (and `trim`)
in UAL_SLOTS — never a per-site delay. `classifySpellAnimKind` routes
`kind: 'dash'` / `'tackle'` BY KIND (castDash / castTackle) before the text
rules. `rigged_animations/` (repo, 218 MB, NOT an upload set) holds the
libraries + the Meshy exports; **`node anim-sheets.js`** renders a contact
sheet of every clip so Claude can LOOK at an animation before wiring it
(needs `npm i --no-save playwright three@0.128.0`; that is not a playtest).
`npm test` runs `anim-strike.test.js` (the table ↔ the GLBs ↔ the consumers).

## Adversarial continuation — 2026-09-10: shared VFX helper cleanup (local delivery)

Shock ring and speed burst helpers now dispose instance resources if `_sigRun` refuses registration; do not move this disposal into `_sigRun` without auditing callers that already own refusal cleanup. Flame scene switches detach groups before material disposal, preserving cached box geometry. Host and guest use the same helpers; relay payloads are unchanged. See ENTROPY_WARS_ADVERSARIAL_REVIEW_PLAN.md for the current continuation and EFFECT_CALLBACK_INVENTORY.md for remaining work. 13 focused tests pass (8 fail before fixes); full local suite 445 pass, 2 existing failures, 2 skips; syntax 85/85 clean. Complete-file delivery is ENTROPY_WARS_SHARED_HELPER_FIXES.zip; deployment and browser acceptance are unverified.

## Adversarial continuation — 2026-09-11: `_sigRun` refusal sweep (local delivery)

`_sigDisposeGroup` is the ONE disposal rule for a signature group (skip `_ew_shared` geometry, dispose materials incl. arrays, never textures) — `_sigRun`'s `finish` and `_sigRunOwned` both use it. A helper that builds a fresh group and does not read the entry back MUST call `_sigRunOwned`; a helper that checks the entry and cleans up itself keeps `_sigRun` (never both — that double-disposes). `sig-refusal-cleanup.test.js` fails on any `_sigRun(` call whose entry is ignored. Test harnesses that stub `_sigRun` must stub `_sigRunOwned` too (descent-lifetime.test.js does). `_wpnLoad` / `_loadCachedTex` are cache-only loaders with application lifetime — keep them outside `_fxCancelDelays`. Full local suite 464 / 462 pass / 2 skips; syntax 88/88. Delivery zip `ENTROPY_WARS_SIG_REFUSAL_FIXES.zip`; not deployed.

## Adversarial continuation — 2026-09-10 (America/Chicago): ritual emissions (local delivery)

After the preceding entry labeled 2026-09-11, refreshed the full main archive at `ccbdde65b0ca8636ef45a0ab29d1f9af059443f9`. Candle embers and burning-cross licks now use `_fxDelay`, so they retire with the originating battle/preview even after partial emission or a fresh cast. Keep `_sigRunOwned` geometry/refusal cleanup and cache-only loaders unchanged. New production-helper tests: 16 pass, nine fail on unchanged source; full package test command via bundled Node: 479 pass, zero fail, two skips; syntax 89/89. `ENTROPY_WARS_RITUAL_EMISSION_FIXES.zip` contains complete files; not deployed or browser-playtested. Continue with sleigh frost wake and stand-sword dissolve motes, then remaining bespoke timers and VFX-04; see the review plan and inventory.

## Adversarial continuation — 2026-09-10: sleigh/stand-sword emissions (local delivery)

Sleigh frost wake and stand-sword dissolve motes now use `_fxDelay`. Keep `_sigRunOwned` geometry cleanup and application cache warmup unchanged. Thirteen new checks pass (five fail before); full suite 492 pass, zero fail, two skips; syntax 90/90. Complete files: ENTROPY_WARS_SLEIGH_SWORD_FIXES.zip. Not deployed or browser-playtested. Next: slash-combo dissolve motes and jaws terminal mist, then remaining bespoke timers and VFX-04.

## Adversarial continuation — 2026-09-10: slash-combo/jaws emissions (local delivery)

Slash-combo dissolve motes and jaws terminal mist now use `_fxDelay`. Preserve `_sigRunOwned` cleanup and cache warmup. Fifteen checks pass (six cancellation regressions fail before); full suite 507 pass, zero fail, two skips; syntax 91/91. Complete files: ENTROPY_WARS_SLASH_JAWS_FIXES.zip. Not deployed or browser-playtested. Next audit `_sigCannonShot3D` detached-ball disposal ownership; its timer cleans up resources and must not simply be canceled. Then continue remaining emissions and VFX-04.

## Adversarial continuation — 2026-09-10: cannon and four emission helpers (local delivery)

Cannon carriage and ball now share an identity-transform `_sigRunOwned` group, retaining independent carriage recoil/world-space flight while disposing together on finish, refusal or retirement. No detached-ball cleanup timer remains. Tesla arcs, storm impact, judgment pillar and staggered music-note creation use `_fxDelay`; preserve geometry owners and cache warmup. 27 checks pass (15 fail before); full suite 534 pass, zero fail, two skips; syntax 92/92. Complete files: ENTROPY_WARS_CANNON_EMISSION_FIXES.zip. Not deployed or browser-playtested. Next: whiteout second ring, rune sphere and remaining bespoke callbacks, then VFX-04. See the plan's top entry for evidence limits.

## Adversarial continuation — 2026-09-10: whiteout/seal/gas (local delivery)

Whiteout second ring, Spear Prison finisher and Gas Cloud puffs now use `_fxDelay`. Rune Sphere returns `_sigRunOwned` so refusal disposes its instance resources; its entry/null API and cached glyph texture are preserved. 24 checks pass (11 fail before); full suite 558 pass, zero fail, two existing skips; syntax 93/93. Complete files: ENTROPY_WARS_WHITEOUT_SEAL_GAS_FIXES.zip. Not deployed or browser-playtested. Next: Aurora Curtain and Spiral Beam refusal paths (returning `_sigRun` alone is not cleanup), then Bad Trip staggered skull emissions and VFX-04. See the review plan's top entry for evidence limits.

## Adversarial continuation — 2026-09-10: Aurora Curtain/Spiral Beam/Bad Trip (local delivery)

Aurora Curtain and Spiral Beam return `_sigRunOwned` to dispose refused allocations while preserving entry/null results and shared textures. Bad Trip delayed skulls use `_fxDelay`; its first skull remains immediate. 16 new checks pass (six fail before); full suite 574 pass, zero fail, two existing skips; syntax 94/94. ENTROPY_WARS_CONTINUED_VFX_FIXES.zip includes these three fixes plus the preceding four whiteout/seal/gas fixes and both test files (40 new checks total). Not deployed or browser-playtested. Next: Magic Circle, Magic Orb and Light Pillar refusal paths, then remaining return-only consumers and Psychosis timers; VFX-04 remains open. See the review plan's top entry for evidence limits.

## Adversarial continuation — 2026-09-11: magic helper ownership (local delivery)

Fresh complete main archive `2042f1062c480cf68d3d2ec70d6061f88d39df94`. Magic Circle, Magic Orb and Light Pillar return `_sigRunOwned` for refusal disposal. `_sigDisposeGroup` retains engine-shared Sprite geometry (`isSprite`) as well as `_ew_shared` geometry, while disposing instance materials and keeping cached textures. Preserve this rule when fixing remaining return-only consumers. 21 new tests pass (15 fail before); 12 supplemental real Three.js r128 object checks pass. Full suite 618 pass, zero fail, two existing skips; syntax 99/99. Complete files: ENTROPY_WARS_MAGIC_OWNERSHIP_FIXES.zip. Not deployed or browser-playtested. Next: Crescent Slash and Orb Burst, then six remaining return-only helpers; Psychosis has no direct timer in current source, so inspect its downstream helpers and subsequent Ego Death emissions. See the review plan's top entry for evidence limits.

## Adversarial continuation — 2026-09-11: Crescent Slash / Orb Burst (local delivery)

Refreshed full main archive `4f9e0fdcbd1fffa970b62a1127be7739f7e85169`; prior magic-ownership fixes are present in the repository. Crescent Slash and Orb Burst now return `_sigRunOwned`. Keep the slash main material's private smear-texture disposer (the echo shares that texture), Orb Burst's preallocation cap guard, and cached sphere/plane plus Sprite geometry retention. 22 focused checks pass (four fail before; 18 controls pass before/after). Full suite 640 pass, zero fail, two existing skips; syntax 100/100. ENTROPY_WARS_CRESCENT_ORB_FIXES.zip contains complete files. Not deployed or browser-playtested. Next: Neon Grid, Fractal Tunnel, Kaleidoscope, Spectrum Burst, Prism Refraction and Stat Rings, then downstream Psychosis/Ego Death ownership and VFX-04. See the review plan's top entry for evidence limits.

## Adversarial continuation — 2026-09-11: remaining six helper owners (local delivery)

Main still `4f9e0fdcbd1fffa970b62a1127be7739f7e85169`; continued cumulatively from local Crescent Slash/Orb Burst edits. Neon Grid, Fractal Tunnel, Kaleidoscope, Spectrum Burst, Prism Refraction and Stat Rings now return `_sigRunOwned`. No return-only `_sigRun` sites remain. `_sigDisposeGroup` deduplicates instance materials within each cleanup and reads `userData.wireMat` to retain ownership when wireframe edge construction yields no meshes. Bars/joints share one material; all current wireframe callers allocate per-effect materials. Keep cached texture, shared geometry and Sprite policies unchanged. 51 new tests pass with doubles AND real Three.js r128 objects; 27 fail before in both modes. Full suite 691 pass / 0 fail / 2 skips, syntax 101/101. ENTROPY_WARS_SIX_HELPER_FIXES.zip supersedes the Crescent/Orb zip and includes both tests and all eight helper fixes plus material ownership correction. Not deployed or browser-playtested. Next: downstream Psychosis and Ego Death emission ownership, then VFX-04; the semantic audit remains partial.

### 2026-09-11 — Ego Death / Time Rewind lifetime ownership

Main 8bc3bf594b79786a059c0dee77d008fdeec0270d includes the preceding six-helper package. Two Ego Death and four Time Rewind direct timer sites now use _fxDelay; delayed calls recheck spell-category and suppression gates. Preserve normal timings and particle-budget independence. 14 focused checks pass (eight fail before); full suite 705 pass / 0 fail / 2 skips; syntax 102/102. ENTROPY_WARS_EGO_REWIND_FIXES.zip contains complete files, not deployed or browser-tested. Next: Merkaba and following signature timer ownership, then VFX-04. See the review plan top entry for evidence limits.

### 2026-09-11 — adversarial Phase 6 spell dispatch (local delivery)

Pinned main: `82906801a763c0ce5fe943bdde48980d60ee7776`. AI stamp:
`v4.3-2026-09-12-spell-routing`. Hit a Lick (`steal`) and Purify
(`cleanseArea`) had scorer and target-picker branches nested under
`utility`, so normal spell selection skipped them. Both now dispatch at
kind level; missing targets score zero. Existing values and all execution,
resource, failed-action and online contracts are preserved.

`ai-spell-routing.test.js` executes production dispatch/candidate/executor
functions with canonical data and controlled board, damage and engine-call
doubles: 13 pass, 10 fail on the pinned baseline, three controls pass on both.
The champion source guard now requires direct dispatch and null guards.
Full suite: 720 total, 718 passed, zero failed, two existing skips. No browser
playtest, simulation, actual doSpell-effects validation or deployment.

`check-ai-spell-dispatch.js` inventories 501 canonical spells / 65 kinds.
It does not prove every utility ID or executor works. Remaining direct
scorer/picker gaps: guard/Trick Room. Prism self-casts have scorers and
no-target admission but no target coordinates for the generic executor;
inspect mirror ownership as well. Wide Plasma Cannon/Tsunami still use
spine-only AI geometry. The review plan contains evidence and the exact
next task: prism self-cast contract, then wide-beam direction/footprint.

Complete files: ai.js → R2, index.html → Render (shared token
`20260912-ai-spell-routing-01-cors`); tests, tooling and docs → repository.

### 2026-09-11 — Phase 6 prism self-cast contract (local delivery)

Baseline main: `043dede2ada453c7ccc9d022438988107eeba64a`; relevant Git blobs verified. AI stamp `v4.4-2026-09-12-prism-selfcast`.
Pulse Lattice and Tune Frequency return the caster as their target, supplying coordinates to ordinary execution and Simul conversion. Removed their no-target exemptions. Keep player-wide mirror ownership: `ownerUnitId` is only the placement-cap owner; the lattice intentionally aggregates `owner === unit.player`.
Canonical Tune costs 75 MP, so its score 12 is rejected under default MP weight; trained weight 0.1 admits it. Preserve this distinction when assessing reachability. Frequency-aware valuation remains open.
Twelve new production AI/real network checks pass; six fail on baseline. Full package script via bundled Node: 732 total, 730 pass, zero fail, two skips. Syntax 105/105. `doSpell` is doubled; no gameplay, simulation or live multiplayer acceptance. Simul conversion was source-reviewed.
Complete delivery: ENTROPY_WARS_PHASE6_PRISM_FIXES.zip. ai.js → R2; index.html → Render (`20260912-prism-selfcast-01-cors`); tests/docs → repository. Not deployed. Exact next task: wide-beam footprint/direction correspondence for Plasma Cannon and Tsunami, then guard/Trick Room and Tune valuation, then mode-aware endgame evaluation. See review plan for evidence limits.

### 2026-09-11 — Phase 6 wide-beam direction/footprint (local delivery)

Baseline main `3a00af7735cb8e96681bc1c771841794c85cb368`; relevant Git blobs verified. AI stamp `v4.5-2026-09-12-wide-beams`. Plasma Cannon/Tsunami side lanes now follow the spine's reach, engine width/diagonal offsets and side-cell passability. Shared AI footprint drives full-direction scoring, target discovery, hypothetical movement and cast-time re-aim. Return aligned aim coordinates plus a victim ID for Simul; never aim directly at an off-spine victim. Movement charges MP once and uses destination elevation. Shared narrow-beam direction valuation also uses total spell value; no tuning weights or online fields changed.
28 production AI/engine-footprint/Simul checks pass; 26 fail before. Full package script via bundled Node: 760 total, 758 passed, zero failed, two skips. Syntax 106/106. Damage, board and doSpell boundaries are doubled; no browser, simulation, performance or live multiplayer acceptance. Destructive wall-boring prediction and existing Simul null-re-aim fallback remain open; see the review plan for scope and evidence.
Complete delivery: ENTROPY_WARS_PHASE6_WIDE_BEAM_FIXES.zip. ai.js → R2; index.html → Render (`20260912-wide-beams-01-cors`); test and docs → repository only. Not deployed. Exact next task: AI-04b guard/Trick Room and Tune valuation, then AI-06 endgame evaluation. Phase 6 remains open; VFX work stays deferred.

### 2026-09-11 — Phase 6 utility contracts / Trick Room reset (local delivery)

Pinned main `844c4ba424963f301a0dd24e952f2ce08cc5838a`; nine relevant Git blobs verified. Added initial `_trickRoomRounds: 0` and clear it in the four match/roster data reset blocks in battle.js. An old cast can no longer reverse the next match's opening order through these blocks. Actual Blitz duration/order and host scalar serialization are preserved. No AI weights or relay changes; ai.js remains unchanged.
12 new focused checks pass; five fail before, seven controls pass before/after. Runs actual reset blocks/order builder/host serializer with controlled boundaries, not complete UI/map reset routes. Full suite via bundled Node: 772 total, 770 passed, zero failed, two existing skips. Syntax 108/108. No browser, simulation or deployment.
The utility diagnostic confirms null Chivalry/Trick Room targets, Simul comparator ignoring reversal, constant Tune scores and Pulse scoring independent of frequency despite distinct engine damage/effects. See the latest review entry for detailed contracts, evidence limits and residuals. Simul duration does reach common end-of-round upkeep; do not describe it as never decrementing. Chivalry transfers a raw hit to the guardian, not shield HP. Tune must compare the next frequency against the current one; Pulse/crossing/burn effects share the frequency.
Complete package: ENTROPY_WARS_PHASE6_TRICK_ROOM_RESET.zip. battle.js and state.js → R2; index.html → Render (`20260912-trick-room-reset-01-cors`); tests/diagnostic/docs → repository. Next: Chivalry legal-target/net-transfer scoring, Trick Room Simul/effective-speed contract and mode-aware scoring, then coupled Tune/Pulse valuation and AI-06. Phase 6 stays open; VFX stays deferred.

### 2026-09-11 — Phase 6 Chivalry landing prerequisite (local delivery)

Latest main `99ff7c86f82113cc46fa2aee6f3c43ca16cd0356` refreshed and changed files Git-blob-verified, including the new online snapshot-cycle regression. Preserved the current ID-only damage-source/safe-serialization fix. Chivalry interception now uses nearestWalkableZ at the ward's elevation and canOccupy3D before assigning x/y/z. It skips blocked or missing surfaces; if no adjacent landing exists, the existing in-place interception remains. No AI scores, weights, stamp, damage formula or new network fields changed.
19 new focused checks pass; 12 fail before, seven controls pass both. Tests execute actual interception/early immunity and landing predicates with board queries controlled, stopping before final damage arithmetic and rendering. Full suite: 794 total, 792 passed, zero failed, two existing skips. Syntax 110/110, 12 inline entry scripts clean, import map valid. No browser/simulation/deployment or live guest acceptance.
Complete package: ENTROPY_WARS_PHASE6_CHIVALRY_LANDING.zip. battle.js → R2; index.html → Render (`20260912-chivalry-landing-01-cors`); test and docs → repository. AI-04b scoring remains the exact next task: legal allies, corrected landing, guardian-specific net loss and kill risk, pledge replacement, ordinary/Simul execution. Interception runs before ward immunity checks; preserve that distinction in prediction. See review plan AI-04b-L2 for limitations. Phase 6 remains open and VFX deferred.

### 2026-09-12 — Phase 6 deadline and Simul correctness (local delivery)

Main tree `3aeb17bbc68def72faa5885617f921ee93c621cc` verified unchanged before/after. AI stamp `v4.6-2026-09-12-match-deadline`. AI urgency follows the actual clock/mode round cap, uses inclusive remaining rounds, distinguishes unlimited play/sudden death and no longer fabricates numerical advantage. Final-quarter/final-tenth thresholds remain an initial heuristic; lead/trail decisions are not implemented by this input fix.
Simul identity-tracked beams with no current target use one committed-resource whiff instead of casting at stale coordinates. Explicit tile shots remain unchanged. Simul resolution snapshots effective SPD once, preserving plan priority and initiative ties; logs use the same snapshot. Trick Room reversal remains open because its counter decrements at common order building: it needs round ownership, not a naive positive-counter comparator.
23 added regressions (20 fail before, three controls pass), focused 51/51; full suite 815 pass, zero fail, two skips (817 total); JS syntax 112/112 plus 12 inline scripts and import-map JSON. Controlled production function tests, not browser/simulation/live multiplayer acceptance. No deployment.
Complete package `ENTROPY_WARS_PHASE6_DEADLINE_SIMUL.zip`: ai.js and battle.js → R2; index.html → Render, token `20260912-ai-deadline-simul-01-cors`; tests, diagnostic and documents → repository. See latest review tracker for remaining Chivalry, Trick Room, frequency valuation and endgame/breach batches plus acceptance gates. Next: Chivalry net-interception scoring. Preserve unuploaded delivery on refresh.

## THE CAPSTONE PASS + THE CHARGED CAST — added 2026-09-13
**Why Charged_Spell_Cast was rare**: sprites.js `UAL_SLOTS.castAOE` was
the only slot on the clip and `classifySpellAnimKind` reached it only for
`/horde|stampede/` and the terrain-raise words — every other big magic
EVENT played the one-arm bolt push (`castMagic`). Now: **`castUltimate`**
(same clip, ts 1.6 → 1.69 s, `strikeAt` 1.90 = the arms-to-the-sky beat)
+ `_castChainFor('ultimate')` → `['castUltimate','castAOE','castMagic',
'cast']` (three-renderer.js); `classifySpellAnimKind` returns
**`'ultimate'` for every CAPSTONE** (`_isCapstoneSpellForAnim` → data.js
`isCapstoneSpellId`, `tier: 'III'` when data.js is absent) unless it is a
weapon / adjacent physical strike, a gun, a move kind or a single-target
heal; and **`'aoe'` for every big magical event** (aoeRadius ≥ 2,
barrage / aoePull / delayed / summon / storm / zone / terrainCreate /
healAll / warCry kinds, a line with `lineWidth` ≥ 2). Fixed on the way:
`/arrow/` caught MARROWstorm (now `/(^|[^m])arrow/`), quake / tremor
slam, the horde rule promotes a capstone. **`isCapstoneSpellId(id)` /
`capstoneSpellIds()`** (data.js, on `window`): ring 3 of
`buildTreeRingIndex` — the r4★ of every RACE_TREE / CLASS_TREE pillar,
both alternates of a twin capstone, Nuke included (it sits on no lower
ring); cached, `applyTreeRingCosts` drops the cache.
**THE VFX** (three-vfx-effects.js "THE CAPSTONE PASS" section, right
after the pass-3 END marker): `_isCapstoneSpell(id, def)` →
`_stageWeight` promotes every capstone to the **`ultimate`** staging tier
and `_stageBurst` adds **THE CAPSTONE BLOOM** (`_sigCapstoneBloom3D`: a
sigil disc + a thin light column in the archetype's colours — the shared
"this is an ultimate" stamp on top of the spell's own recipe; damage
bursts only). Bespoke signatures: **`_sigTsunami3D`** (the beam def flag
`beamTsunami` — `_fireBeamMapped` routes it like breath / boomerang; a
lofted curling WAVE WALL `lineWidth` lanes wide rises behind the caster,
rolls the spine, washes every lane tile, crashes on the last tile and
recedes — Tsunami was a byte-copy of Water Pulse), the breath rig's
**`breathScale` / `inhale` / `firestorm`** (Dragonfire = the INFERNO at
1.7× with `_sigFirestorm3D` at the far end; Dragon Breath r1 keeps a
plain `raceDragonBreath_beam`; Atomic Breath / Hellmouth grew),
`_sigFaeRing3D` (the ring of toadstool lights; `EFFECTS[x].geom3D: true`
on an aoe def makes `fire('aoe')` run the registry beside the recipe —
the aoe intent never reached it before), `_sigCataclysmMark3D` (`:mark`,
the burning crown) + `_sigCataclysmDecree3D` (fires from the descent
pipeline at detonation), `_sigDrainingEmbrace3D` (the crimson wings),
`_sigCrusade3D` (the cross of light). Registry entries are written with
`Object.assign(_spell3DGeometry, {…})` — party-builder.test.js counts
`_spell3DGeometry[` reads. Data-only recipes gave the HITCHHIKERS their
own look (Glitter Bomb, Snowball Volley, Artillery Strike, Terror Pounce,
Hallelujah, Dragon Breath) and every theme-fallback capstone an identity
(Supernova, Singularity, Marrowstorm, Eternal Slumber, Baphomet's Rite,
Fire for Effect, Indomitable Will, Awakening, Overtinker, Colossal Crush,
Sasquatch Smash, Crusade). RULE #2: everything rides `fire()` /
`fireGeometry` — and **online.js now relays `fireGeometry`** through the
`vfx3d-x` sibling wrapper (`fireGeometry: [[1, 2]]`), so every `:mark` /
`:dash` / end-of-round apparition reaches the guest (they were host-only).
`npm test` runs `capstone-vfx.test.js`: the capstone set, the slot + chain
+ classify rules, the hooks, **no capstone shares an effect id with a
sibling on its pillar**, every capstone has an identity (a map row, a
geometry, a CINE_SEQUENCES director, or a kind whose travel is the
signature). Smoke-tested headlessly with real three r128 (a scratch
harness; not a playtest) — the LOOK is unseen: eyeball Tsunami, Dragonfire,
Fae Ring, Cataclysm Decree, Draining Embrace, Crusade live first.

## THE DIRECTOR'S PASS — the spell camera (2026-09-13, local delivery)
Three things in battle.js's SPELL CINEMATICS block + playDetonationCinematic.
**THE BOARD-AWARE RIG (the beam edge bug)**: a beam ending at the rim put
the reel's end-cap pivot 0.8 tiles PAST the victim and the eye 2.6 beyond;
off the board `_camGroundPx` answered 0, so on a raised board the rig's
flat floor sat under the map and the frame was the strata. Now
`window._camGroundPx` clamps every lookup to the nearest edge tile,
`_cineTpsAnchor(pos, unit, { liftPx })` clamps the pivot's ground read
(`_cineClampTile`) and takes an explicit pivot height, `_cineEdgeRoom(x,
y)` = tiles inside the rim (negative past it), `cineEndCapReverse` keeps
its pivot on the victim's tile and becomes THE HIGH REVERSE (shorter boom,
craned down) when there is no room past the rim, `cineSideDolly` scores
both perpendiculars by where the EYE lands and takes the inside one, and
`_cineYawTowardBoard(center, yaw, boom)` turns any strike-tile yaw whose
eye would hang over the apron. Any new shot near the rim reads those.
**THE SNIPER KIT** (`CINE_SEQUENCES._sniperKit` — headshot / precisionShot
/ deadEye / kneecapShot / railgun): `cineSniperPov(caster, target, { fov,
zoomMs, squint })` = FIRST PERSON — ThreeCamera's `cam._fpEye` branch
(Strike Mode's rig) with the shooter's model hidden (`window._ewFpHideUid`),
the gaze slope-aimed down the line, the lens zooming by FOV
(`_cineFovTween`, the dolly-zoom's base/restore) and THE EYELIDS
(`cineEyelids(ms, { amt, closeMs })` / `cineEyelidsBlink` /
`cineEyelidsClear`; styles-cinematic.css `.cine-eyelids`) closing to a
slit round a reticle; the shot blinks them, `_cineFpRelease()` hands the
eye back (the sequence, `camera._apply`'s rig auto-release via
`_cineFpOwned`, and `_cineReleaseAllFx` all call it), then the bullet cam
and a freeze on the victim. Never over Strike Mode (`_shooterCamOwns`).
**THE FLYOVER STRIKE** (Nuke / Artillery Strike are DELAYED spells — the
cast is a mark, the camera is `playDetonationCinematic` at the end of the
round): `VFX.getDescentFlyover(id)` says a craft flies it in → `cineFlyBy`
(level lens at 3.2 tiles over the strike tile, span 11 — the VFX flies its
craft ACROSS THE SCREEN, now on the horizon line: `fo.ndcY` 0.1 in the
three flyover defs) → `cineFlyByTrack` (the VFX publishes its real path in
`window._ewDescentCine`; the frame pans at 0.35× its speed) → `cineFallFollow`
(`_cineTweenLift` rides the pivot from the jet's altitude to the tile,
easeIn, tilt 90 → 56; the warhead now DROPS FROM THE JET — `fromZ` in
`_fireDescent`, and the three flyovers are retimed `delayMs` = telegraph −
duration/2 so the craft is overhead at the release) → the blast reverse +
the Nuke's whiteout / bone-desat. Meteor-class delayed strikes (no craft)
get `cineSkyWatch` (look UP into the airspace at the release, pitch DOWN
with the fall); cast-time descent spells with no director get the same
through `_cineApplyFamily`'s sky-fall branch (`shotOpts.descentCam`, now
relayed). RULE #2: online.js wraps `window.playDetonationCinematic` (relay
`det-cine`, guest fog-gated) and carries `descentCam`. `npm test` runs
`spell-camera.test.js`. **`node playtest_spellcam.js`** (repo tooling, see
PLAYTEST_NOTES "THE SPELL CAMERA PROBE") casts any spell between two
teleported units offline and samples the rig; `FREEZE_AT` photographs a
beat. Unseen live: the jet under the level lens, the eyelids' paper feel.

## THE BOW ON EVERY ARROW (2026-09-14, local delivery)
Every arrow attack draws the bow (three-vfx-effects.js `_sigBowShot3D`)
and plays the archery clip (sprites.js `castArrow`): **`_SIG_BOW_FOR`**
now names all seven arrow spells (Bomb / Fire / Poison / Splitting /
Piercing / Green Arrow / Arrow Volley — never `knifeThrow`, which only
shares `_bolt_arrow`), read through **`_sigBowShotFor(spellId, params)`**
(`params.bow` = the basic attack's flag). Three paths reach it: the bolt
intent (`_fireBoltMapped`, as before), the BEAM intent (`_fireBeamMapped`
— Piercing Arrow looses down the lane to its last tile; guarded with
`typeof` because mapped-effect-lifetime.test.js sandboxes that function
without the helper) and **`fireBoltDirect`** (battle.js
`playBasicAttackShot` passes `bow: true` for an arrow-kind attacker —
Robin Hood's quick shot; the flag rides the delivery, so the `basic-shot`
relay needs nothing new). Arrow Volley got a `_BOLT_WIRING` row so the
aoe's travel projectile fires the first shaft (bow + tracer) before the
`raceArrowRain` geometry rains. sprites.js `classifySpellAnimKind` judges
the ARROW rule BEFORE the throw rule (Bomb Arrow read as a lob). **The
arrow GLB comes in tip-backward** like the guns — `_WPN_MODELS.arrow`
wears `tweak: { ry: Math.PI }` (the bow's loose and the volley's plunge
both take the same instance, so one flip fixes both). Unseen live (RULE
#1c): the flipped arrow's head at the string and in the dirt.

## 2026-09-14 — adversarial Phase 6: endgame policy and Nexus membership (local delivery)

Refreshed full main at `58483d42e0693e9c2aca6dd385792e7f9effb475`. `ai.js` now reads TDM/Simul team kill-score lead against the real deadline: preserve a lead through increased exposure cost and reduced pursuit; seek needed kills or break ties through bounded pursuit/kill premiums. These are initial heuristics, not measured optimal play. Simul gets the TDM kill-mode bonus and `_aiPlanCandidates` now uses final `rankCandidates` in Simul only; it previously bypassed danger scoring. Other planner consumers keep their prior contract.

Nexus channel scoring now calls the production `GAME.getNexusAtUnit` query, respecting roaming precedence, tile footprints and authored elevation. It no longer picks a nearby unrelated zone or duplicates overlapping zone promises; roaming-only states work. Airborne landing projection and macro route selection remain unvalidated. No new synchronized fields or relays: vision values are ephemeral; host-driven actions still execute through existing paths.

Two new test files: `ai-endgame-policy.test.js`, `ai-nexus-membership.test.js`, 36 passing checks (30 fail unchanged AI; six controls pass). Full suite/syntax results and limitations are in `ADVERSARIAL_20260914_VALIDATION.txt`. `check-ai-breach-review.js` records the still-open destructive-beam forecast mismatch using controlled production walk/footprint functions. Dispatch inventory: 508 spells / 71 kinds, no missing direct routes; not proof of tactical coverage. No browser test, full-match simulation, deployment, commit or push. See the latest adversarial plan entry for evidence and exact next task.

Delivery: `ENTROPY_WARS_PHASE6_ENDGAME_NEXUS.zip`; ai.js → R2, index.html → Render (`20260914-ai-endgame-nexus-01-cors`), other files → repository. Preserve newer repository work on future refreshes. Phase 6 stays open for beam breach, Arena immediate-win/denial precedence, reserves/door scenarios, timing and authorized observed play.

## 2026-09-14 — Phase 6 prerequisite: door LOS and production breach evidence

Fixed `doorBlocksSightBetween` skipping the first interior tile: production `getLinePoints` excludes the source. Start at index 0; exclude only the endpoint so doors remain targetable. The existing door test now uses the actual map helper instead of a source-inclusive mock. New door LOS tests exercise the real map/AI/line-walk boundary, eight directions and both seats. 22 new tests pass (18 fail on unchanged battle.js); full suite 1,095 passed, zero failures, four skips; syntax 142/142. No new state/relays, no live test or deployment.

`check-ai-breach-terrain.js` adds production voxel/door evidence. In the controlled raised-column fixtures the LOS blocker can precede the current beam cell, but the engine attempts to breach that current cell; the original simplified successful-removal probe is not full voxel evidence. A last-hit enemy door removes its pair and permits continuation, which the static AI footprint misses. The pure forecast and Arena precedence remain open; see AI-05e/f/g in the adversarial tracker for evidence and exact next work. Water settling and several non-door destruction effects remain doubled in this probe; it stops before unit damage/aftermath.

Complete package: `ENTROPY_WARS_PHASE6_DOOR_LOS.zip`. battle.js to R2, index.html to Render (`20260914-door-los-boundary-01-cors`), other files repository-only. Preserve the existing AI version; no AI runtime edit in this batch.

## 2026-09-14 — Phase 6: actual-obstruction beam boring

Baseline main `ed196c9e9ae1f47be0d870befd373f045adc4585`, including the prior door fix. Implemented locally: map LOS optionally reports the first terrain/object obstruction; beam resolution checks occupancy and breaches that column, then reruns LOS before continuing. This fixes failing to bore the earlier wall and breaking later innocent columns, while respecting hardness, the body window, retained upper blocks and two-bore cap. No new persistent state or relay fields. AI prediction remains unchanged and is the next task (including mid-cast door-pair removal).

30 new production-boundary tests pass; 27 fail on unchanged map/battle source. Full suite: 1,129 total, 1,125 passed, zero failures, four skips. Tests stop before damage/aftermath and double water settling/destruction side effects; no browser, live guest or match acceptance. See AI-05f's latest adversarial entry and BORE_VALIDATION.txt for scope/evidence. Deliver ENTROPY_WARS_PHASE6_BEAM_BORE.zip: map.js/battle.js to R2, index.html to Render (20260914-beam-bore-obstruction-01-cors), remaining files to repository; sync runtime files too. Not committed, pushed or deployed.

## 2026-09-14 — Phase 6: read-only destructive beam forecast

Baseline main `d34afac086cacd043d6a39f8d35937020ebef4d9` includes the previous actual-obstruction beam fix. New `GAME.getLineForecast` applies hypothetical wall/tree/door changes to private copied rows/columns and door records, using existing map LOS and breach-window queries with an optional board view. AI scoring/direction selection use this footprint, including two-bore limits, body height, occupancy, hardness, retained lintels, door-pair destruction, terrain painting and final-board wide lanes. No live-state swap or side-effect callbacks; hypothetical caster movement replaces old occupancy. AI stamp `v4.9-2026-09-14-beam-forecast`.

71 new checks pass; unchanged AI fails 48 with 23 controls passing. Full suite: 1,200 total, 1,196 passed, zero failures, four skips. Actual production footprint/terrain/door boundaries, plus controlled scorer/picker and frozen-input checks. Not full damage/aftermath or browser acceptance. Explosion, fatal building collapse and possible flooding yield only a conservative prefix with uncertainty; their full prediction remains open. No serialized fields/relays, commit, push or deployment. See the latest adversarial entry and FORECAST_VALIDATION.txt for exact scope.

Deliver `ENTROPY_WARS_PHASE6_BEAM_FORECAST.zip`: ai.js/battle.js/map.js to R2; index.html to Render (`20260914-ai-beam-forecast-01-cors`); remaining files to repository. Sync runtime/entry files to repo too. Next: Arena immediate-win/legal-denial precedence and reserves-aware wipeout; retain AI-05 complex aftermath and Phase 6 scenario/timing/observed acceptance as open.

## 2026-09-14 — Phase 6 continuation: Arena Key scan priority

Retained the preceding beam forecast and corrected Inspect selection: shared `getInspectFootprint` now drives both actual Key collection and AI known-Key valuation. Registry-backed held counts/current `getKeysToWin` replace stale counters. A projected winning revealed-Key scan precedes ordinary attacks, danger/kill overrides, Easy random picks and automatic reserve retreat; other Key pickups receive initial collection/one-away denial value. No hidden-Key or hidden-bomb oracle. Engine inspect geometry and online host execution are unchanged; no new synchronized fields.

21 new checks pass (13 fail with preceding AI, eight controls pass), including actual `doInspect`/`checkWin` victories for both seats and sudden death. Combined with 71 beam checks: 92 new tests; full suite 1,221 total, 1,217 passed, zero failures, four skips. Rendering/rewards/timers are doubled; no full-turn browser/guest acceptance. Hidden bomb/aftermath interruptions can invalidate projected Key wins. Cube terminal forecasts, carrier denial, move-then-inspect and home-team/reserves wipeout remain open; `checkWinConditionOnly` still needs its current-player/home-player discrepancy audited against `checkWin`.

Combined complete delivery `ENTROPY_WARS_PHASE6_BEAM_AND_KEY_AI.zip` supersedes this task's beam-only ZIP. ai.js/battle.js/map.js → R2; index.html → Render (`20260914-ai-beam-key-priority-01-cors`); remaining files → repository; sync runtime/entry files too. AI stamp `v4.10-2026-09-14-arena-key-priority`. No commit, push or deployment. See latest adversarial entry and ARENA_KEY_VALIDATION.txt.

## 2026-09-14 — Phase 6 continuation: Cube finish and wipeout consistency

Shared `getCubeAttackDamage` preserves actual Cube damage order and RNG execution, and supplies minimum/neutral/maximum forecasts to AI. Supported direct attacks that finish the Cube even on the minimum roll gain the existing objective priority. AP/status, surface-height range, LOS, fog and occupied-column checks gate it. Private unit copies absorb stat/level caches. Remote/telescope/terrain-face and spell/multi-hit finishes remain outside this conservative query.

`getTeamWipeoutCount` now supplies both actual winner and early-stop readers: home player, dead/dying and living reserves (including promised replacements). Early stop no longer treats possession as a wipeout, agrees with the final reader's both-empty case and handles FFA without bypassing clock expiry. Key/Cube priority avoids already-terminal home-team boards.

26 new tests pass (nine fail prior AI/early-win source, 17 controls pass); all 26 pass with the original pre-extraction Cube attack body too. Full suite: 1,247 total, 1,243 passed, zero failures, four skips. This task adds 118 checks across all three batches. Syntax: 146/146. Re-read the unchanged three_ways tutorial and updated its early-win hash and added watches for the extracted wipeout/Cube helpers in data.js. Stats/range/LOS/rewards/rendering/timers are controlled in Cube tests; no browser/live guest/full-match or full-candidate timing acceptance.

FINAL delivery: `ENTROPY_WARS_PHASE6_BEAM_ARENA_OBJECTIVES.zip`, containing all beam, Key, Cube and wipeout changes. R2: ai.js/battle.js/map.js/data.js; Render: index.html (`20260914-ai-beam-arena-objectives-01-cors`); remaining files: repository. Sync runtime/entry files too. AI stamp `v4.11-2026-09-14-arena-cube-priority`. This supersedes interim package scopes in earlier entries. No commit, push or deployment. Next: carrier denial, move-then-inspect, residual scenarios/timing and authorized observations; Phase 6 remains open.

## THE FINISHER PASS, delivery 1 — TO THE MOON · METEOR STORM · THE TRICK SHOT + THE SPELL-MADE MONUMENTS + THE ROCKS (2026-09-18, local delivery)
**`FINISHER_PLAN.md` is THE doc for the over-the-top capstones** — the rules (§1: a
finisher is a capstone, reworked in place or a ring-4 twin (≤ 2 per node, 8 per
branch); the round-10 Entropy alternative is deferred, §4 has the sketch), the
catalogue of the rest of the user's brief with home spells / engine needs / effort
(§3), the checklist (§5). Read it before touching a capstone. **THE SPELL-MADE
MONUMENTS** (the user's rule: raised terrain that means a wall or a pillar is a
Meshy piece): a `terrainCreate` row with `monument: { kind }` (data.js: `rampart`
→ `menhir`, `raceShieldWall` → `castle_wall`, `raceGothicRampart` →
`gothic_wall`, `raceZigguratProtocol` → `ziggurat_block`) stands ONE real
monument per affected tile through map.js **`placeSpellMonument(mon)`** (the ONE
live placer: appends to `state.monuments` — synced —, stamps the kind's
`_MON_GRID` box into the voxel + column grids, records the floor in
`state._monumentTiles`, syncs the column; refused on a wall / objective /
non-walkable object / another monument / a living unit — the damage still
lands, the stone does not) and never raises the ground (`terrainDeform` stays on
the row for the ghost preview only). The four kinds are `[1, 1, 2]` grid rows in
map.js + three-renderer.js `_MON_GRID`, delta-maps.test.js's mirror,
`MF_DELTA_SOLID_MONS` and the editor catalogue; builders `_hzPropMenhir`
(the woods `menhir` GLB), `_hzCastleWallSeg` (procedural crenellated masonry in
the castle sheet — a wall piece is authored along X, the placer's `rot` = 0 for a
horizontal line / 90 vertical), `_hzGothicWallSeg` (the Vatican `church_wall`
GLB), `_hzZigguratBlock` (a stepped sandstone block); `_buildMonumentObj` fits
each into its tile box. Adding a wall spell = `monument: { kind }` + a grid row
in the three tables + a builder. **THE ROCKS**: `_WPN_MODELS.asteroid` /
`.asteroid2` (the D.O.O.R. kit's `asteroid_1/2.glb`, `axis: 'y'`) through
**`_finRockBody(diam, { key, glbOnly })`** — the boulder projectile (Boulder
Hurl, Stone Throw, Stonefall — added to `_BOULDER_SPELL_IDS`), the Meteor's body
(`_spawnMeteorSphere3D`: asteroid → moon → icosahedron), the storm, the moon's
debris; warmed 3.5 s after load. **THE THREE**: (1) cyborg `raceRocketToss` =
**To the Moon** (`moonshot`, `moonArcTiles` 7, `carryHeight` 6): battle.js
`playSkyThrowFx` flings 1.9 s with `arcPx` (three-renderer.js
`startThrowArcTween`'s new opt — the bump above the carry line), publishes
`window._ewMoonshot` and calls **`ThreeVFXEffects.sigMoonshot3D`** INSIDE the
relayed function (never through `fireGeometry` — the guest would get the moon
twice): the `moon` misc GLB (`getMiscModelClone`) drops into the fling's apex,
the body hits it at half the fling, whiteout, 18 shards, seven `_sigAsteroidDrop3D`
pieces onto the landing's 5×5; director `CINE_SEQUENCES.raceRocketToss` = sky
watch on the apex column, freeze + slow-mo on the crack (the throw's own
`_cineRetargetShot` yields to it). (2) mothman `raceProphecyOfDisaster` =
**METEOR STORM** (`aoeRadius` 2, `groundsFlyers`): `EFFECTS['raceProphecyOf
Disaster_descent']` (`storm: true`, descentMs 1600) → `_fireDescent` runs
**`_sigMeteorStorm3D`** — ONE `_sigRunOwned` group for every body (the cap is
20 live groups), n = 10 + 6r rocks on random tiles across the first 62 % of the
fall, streakers across the sky, THE BIG ONE on the centre timed to the descent's
impact, a landing beat per rock (a light `raceProphecyOfDisaster_tile` per
tile); the camera is the descent grammar's `cineSkyWatch`. (3) cowboy
`raceHighNoon` = **THE TRICK SHOT** (`ignoresLineOfSight`, `travelMs` 1500,
range 6, no `projectileOverride`): battle.js `executeSpellAnimation` hands a
row's `travelMs` to the action camera (`playCinematicAttack` honours it and the
bolt's flyMs reads it back); `_fireBoltMapped` hands High Noon to
**`_sigTrickShot3D`** after the revolver rig — the path is planned off the LIVE
board (raised tiles higher than either end, `wall` / `mountain`, `state.
_monumentTiles`, never a unit; the board's rim past the edge fills in on a flat
map), 3–5 bounces, the legs share the travel by length, steel sparks per bounce,
the tracer cools behind the head; director `raceHighNoon` = the clock, the slam,
a high wide `cineFlyBy` at half speed, the slam on the hit. RULE #2: all three
ride relays that exist (the throw FX, the descent intent, the bolt intent); the
guest's ricochet plans its own bounces (cosmetic). `npm test` runs
`finishers.test.js`. UNSEEN LIVE (RULE #1c): all of it — the moon's size and its
fall into frame, the shards' spread, the storm's density and the big one's
timing against the damage tick, the ricochet's read at half speed (a bounce off
the rim on a flat map), every monument's scale in its 1×1×2 box (the menhir GLB
fitted to a full tile wide may read chunky — `_MON_GRID` and the builders'
widths are the edits), the church_wall GLB's facing as a wall piece.

## THE FINISHERS — THE EXECUTIONS (the gauge's other verb) + THE CAMERA A DIRECTOR OWNS (2026-09-19, local delivery)
The user: "instead of the finishers replacing the capstones they should be an alternative to the Entropy Strike — a
single-target attack with one unit, or a team attack on the entire enemy team; completely unique finishers for every
playable unit; the cinematic camera is supposed to enhance, not ruin". **FINISHER_PLAN.md rule 0 is the spec** — read
it before touching a finisher. A FULL GAUGE buys either the ENTROPY STRIKE (unchanged) or a FINISHER: ONE unit executes
ONE visible enemy for ~3× the strike's slice (data.js `FINISHER_RULES`), typed by the chart (one of the race's own
types → STAB), 1 AP + the whole gauge. **THE CATALOGUE** data.js `FINISHERS[race]` = a row for ALL 99 races (`name ·
glyph · type · tagline · desc · sig · built`); `sig` names a BESPOKE director + signature, `sig: null` = designed, not
built — it plays the TYPED EXECUTION (`FINISHER_TYPE_DEFAULTS`, battle.js `_finTypedDirector` = the six apocalypse
directors on one victim). Read it ONLY through battle.js `getFinisherFor(unit)`. **THE ENGINE** (battle.js, the block
after `_EWS_DIRECTORS`): `canUseFinisher` / `getFinisherTargets` (= the strike's: every visible enemy) /
`getFinisherDamage` / `getFinisherForecast(unit, target)` (`dmg · kill · weak · resist`) / `getFinisherBestTarget` /
**`doFinisher(unit, targetId)`** (drains the gauge, `state._finisherCount`, spends all AP, Simul-queues as
`{ type: 'finisher', targetId }`) → **`_finPlayCinematic(unit, target, hooks)`** = the shared skeleton (the ⚛ banner in
the type's theme with a FINISHER kicker — `_ewsShowBanner` takes `opts` now —, ONE live pane on the executioner + the
name slam, the director's `charge` → `cam` + `stage` at CHARGE −120 → `strike` (damage lands) → `resolve`, on FIXED
`chargeMs / strikeMs / resolveMs`; `camera.save` → `restore` — it NEVER runs the stock two-beat action shot).
`_FIN_DIRECTORS[sig]` hooks: `siren · charge · cam · stage · strike · resolve` on the strike's ctx + `target · hitAt ·
shot · dive · slow · freeze · fade · enterVoid`. **THE BUILT SIX**: king arthur WORLD CLEAVE (`_sigWorldCleave3D`, the
sword falls, the blade sweeps, a wall of light + a fissure edge to edge), anubis THE WEIGHING (`_sigWeighing3D`, the
scales, the heart vs the feather, Ammit's jaws), santa clause THE NAUGHTY LIST (`_sigNaughtyList3D`, the scroll with
the name, coal, the house-sized present, the bow last), honda civic HIT AND RUN (`_sigHitAndRun3D`, a misc-cache car
off the map, the ramp, the tumble, the airbag), kaiju THE STOMP (`_sigKaijuStomp3D`, the shadow first, then the foot),
ai SEGFAULT (`_sigSegfault3D`, the scan, the cage, the voxel deletion + `cineUnitFade`). three-vfx-effects.js "THE
FINISHER PASS 2" (one group through `_sigRunOwned`, timers through `_fxDelay`, called INSIDE the relayed cinematic —
never through `fireGeometry`). **HUD**: the ☠ row LEADS the ⚛ picker (hud.js `_hrlgEntropyBlades`, forecast on the
best victim) → `chooseActionMenu('finisherTargets')` → `_hrlgFinisherTargetBlades` (face, HP, ≈−dmg, KILL) →
`doFinisher`; ui.js gates the view like the entropy one. **RULE #2**: online.js wraps `doFinisher` (engine
game-action, `targetId`) and `_finPlayCinematic` (relay `finisher-cine`; the guest replays with no applyHit, muted).
**AI**: ai.js `scoreFinisher` (a candidate per victim the execution KILLS + the best non-kill, `_noDanger`), the
executor case, `_candMatchesHuman` / `_candDesc`; battle.js's Simul conversion / label / resolver know the step.
**THE CAMERA A DIRECTOR OWNS**: battle.js `cineOwnShot(sequenceId)` — the stock action shot's beat 2 (the cut to the
victim) and every `_cineRetargetShot` are skipped for an owned sequence; High Noon owns its shot from the clock, To
the Moon from the fling (the stock cut used to yank the fly-by / sky watch back to a shoulder close-up — why the
capstone finishers read better with the action camera off). A new bespoke director that composes its own shots MUST
call it. Adding a finisher = set `sig` on the race's row + a director + a signature + the BUILT table in
finishers.test.js (14 tests). Unseen live (RULE #1c): all of it — FINISHER_PLAN §7 lists what to eyeball first.

## THE FINISHER ON THE CIRCUIT + THREE MORE EXECUTIONS (FINISHER_PLAN delivery 3) — 2026-09-19, local delivery
The user: "would still like to see the finishers and their animations in the party builder in the
spell tree somewhere." The forge's TECHNIQUES circuit ends in **THE FINISHER STRIP** (party-builder.js
`SpellTreePanel` → `finStrip()`, `.pb-fin` under the root's bus): ONE ☠ row — the race's execution off
data.js `FINISHERS` through **`pbFinisherDef(race)`** (= `getFinisherDefForRace`, the ONE read), in its
TYPE colour, BESPOKE (a pulsing ring) or TYPED EXECUTION (dashed); its node key is **`PB_FIN_KEY`**
('FIN'; `treeStepKey`: root ↓ = the strip, ↑ = the root), `pbTechInfo(..., finisher)` answers `st8:
'finisher'`, `TechniquePanel` hands it to **`FinisherPanel`** (type · name · tagline · brief · the price
chips · ▶ PREVIEW), and **`pbPreviewFinisher`** (hover debounced, click / ENTER / SPACE / ▶ at once) →
three-renderer.js **`EWCharViewer.previewFinisher(def)`** = the CHARGED CAST (`_castChainFor
('ultimate')`; `_cvSpellChain` takes `opts.chain` now) timed so its strike frame lands on the hit, the
frame pulled wide + tall, and **`VFX3D.stage.finisher(def, o)`** (three-vfx-effects.js, the FINISHER
PASS 2 section: `_FIN_STAGE[sig]` = the director's VFX beats on the stage frame — the hero at (0,0),
the dummy at (3,0), `P.at` = `_fxDelay`; `_FIN_STAGE_TYPE[type]` = the six apocalypse directors' beats on
one victim; `finisherTiming` = its clock). Never a slot, never a loadout write, never the relayed
`VFX3D.fire` (RULE #2). **RULE: a bespoke finisher = the director + the signature + a `_FIN_STAGE[sig]`
script** — finishers.test.js insists on all three. THREE MORE BUILT (nine of 99): homosapien **The
Haymaker** (`haymaker` / `_sigHaymaker3D` — the fist winds up, the body laps the world on a great
ring, back into the fist), cowboy **Boot Hill** (`bootHill` / `_sigBootHill3D` — the rope from the sky,
the coffin with the name plate, the lid, the cross, the tumbleweed), mad scientist **Shrink Ray**
(`shrinkRay` / `_sigShrinkRay3D` — the ring beam, the shrink, SIZE: 1/40, the ACME anvil). `npm test`
runs finishers.test.js (THE FORGE test). UNSEEN LIVE (RULE #1c): the strip under the lanes at the small
breakpoints, the wide stage frame on the monitor, each script's timing against the strike frame, the
fist's facing (`fistPivot.rotation.y`), the lid's swing, the anvil's read, the three directors' camera
paths on the real board.

## SIX MORE EXECUTIONS — Keelhauled · A Thousand Cuts · The Joust · The Trip · Neuralyzer · Mind over Matter (FINISHER_PLAN delivery 4) — 2026-09-19, local delivery
The next six `FINISHERS` rows in roster order are BUILT (fifteen of 99): pirate
`keelhaul` (`_sigKeelhaul3D` — the misc cache's `wreck` GLB sails the sky along
the line, the hook, the drag under the keel, the slam), swordfighter
`thousandCuts` (`_sigThousandCuts3D` — afterimages, slash planes at a rising
cadence, a tally SPRITE to 1000, the column into slabs), knight `joust`
(`_sigJoust3D` — a procedural charger + a lance the length of the line, the
carry to the far edge), shaman `theTrip` (`_sigTheTrip3D` — the fairy ring,
the breathing wireframe dome, the eye-motes, the library's kaleidoscope +
fractal tunnel + spectrum burst, the fold), men in black `neuralyzer`
(`_sigNeuralyzer3D` — the pen, the flash, the rewind, the darkened `cadillac`
clone that takes the body in its boot), telepath `mindOverMatter`
(`_sigMindOverMatter3D` — the eight tiles round the CASTER lifted as columns
in their own sheet via `getTerrainAt` / `TERRAIN_SPRITES`, orbited, slammed
one by one — VFX-only, the board keeps every tile). Each = a director in
battle.js `_FIN_DIRECTORS` (the first finishers to use `cineCrane`,
`cineDollyZoom` and `cineEyelids`), the signature in "THE FINISHER PASS 2"
(`_sigRunOwned` + `_fxDelay`, called inside the relayed cinematic — RULE #2),
a `_FIN_STAGE[sig]` script for the forge, a row in finishers.test.js's BUILT
table. RULE learnt: a text plane that must face the camera in that section is
a `THREE.Sprite` (`_sigDisposeGroup` keeps Sprite geometry; there is no camera
accessor in the VFX file). Smoke-tested in a scratch stub-THREE harness (every
tick of every signature; not a render). UNSEEN LIVE (RULE #1c): FINISHER_PLAN
§7's delivery-4 entry lists what to eyeball first — the wreck's heading, the
tally's size, the charger, the sedan's tint, the tile sheets, the six camera
paths.

## SIX MORE EXECUTIONS — Danger Close · Excommunicated · Abracadabra · The Tower · Fee Fi Fo Fum · The Changeling (FINISHER_PLAN delivery 5) — 2026-09-20, local delivery
The next six `FINISHERS` rows in roster order are BUILT (twenty-one of 99):
marksman `dangerClose` (`_sigDangerClose3D` — the grid lattice + the grid
reference, the laser designator, the reticle, ONE shell straight down, the
fireball; the director is the first finisher to use `cineSniperPov`, released
by hand before the sky watch), priest `excommunicated` (`_sigExcommunicated3D`
— the cathedral rises on the 3×3, the bells toll, the doors slam, the whole
thing lifts into the sky with the victim inside), wizard `abracadabra`
(`_sigAbracadabra3D` — the house-sized top hat, the wand's three taps, the
lift on nothing, the reappearance sixteen tiles up), fortune teller
`theTower` (`_sigTheTower3D` — the building-sized card flips to XVI, burns,
a stone tower rises, six `_LT().bolt` strikes, the crown, the two figures,
the split), giant `feeFiFoFum` (`_sigFeeFiFoFum3D` — the hand, the grab, the
blinking eye, the two millstones rolling in, the flour, the loaf), fairy
`changeling` (`_sigChangeling3D` — the toadstool ring off the misc
`mushroom` / `mushroom2` clones, the dancing lights, the sun-and-moon
time-lapse, the clock, the ageing silhouette, 100 YEARS). Three shared
helpers joined the section: `_finBodyMesh` (the dark stand-in capsule),
`_finTextSprite` (a camera-facing text card — a Sprite, the section's rule),
`_finFireball`. Each = a director in battle.js `_FIN_DIRECTORS`, the signature
in "THE FINISHER PASS 2" (the DELIVERY 5 block; `_sigRunOwned` + `_fxDelay`,
called inside the relayed cinematic — RULE #2), a `_FIN_STAGE[sig]` script for
the forge, a row in finishers.test.js's BUILT table. Smoke-tested in a stub
THREE harness (every tick; not a render). UNSEEN LIVE (RULE #1c):
FINISHER_PLAN §7's delivery-5 entry lists what to eyeball first.

## SIX MORE EXECUTIONS — Ack Ack Ack · Ascension Denied · The Probe · Blurry Footage · Sleep Paralysis · The Unmasking (FINISHER_PLAN delivery 6) — 2026-09-20, local delivery
The next six `FINISHERS` rows in roster order are BUILT (twenty-seven of 99):
martian `ackAckAck` (`_sigAckAckAck3D` — the seven-tile TRIPOD walks in along
the line, the heat ray sweeps onto the tile, the skeleton topples), nordic
`ascensionDenied` (`_sigAscensionDenied3D` — the column of light, the lift,
the stutter, the drop from orbit on a re-entry trail, the crater), grey
`theProbe` (`_sigTheProbe3D` — `_sigBuildUFO`'s saucer, the tractor beam,
the table, three jabs, the body back in three pieces in the wrong order),
bigfoot `blurryFootage` (`_sigBlurryFootage3D` — the pine treeline, the ● REC
card, the grain, the thing that walks through the tile; a witness shot with
hand-held kicks), shadow entity `sleepParalysis` (`_sigSleepParalysis3D` — the
black dome, the bed, the flickering lamp, the figure in the corner closer
each time, 3:33 AM, the grin; a face cam under the eyelids), reptilian
`unmasking` (`_sigUnmasking3D` — the skin peels at the caster, a 26-segment
serpent on a head trail (`_finChain`), the lunge, the swallow, the bulge, a
● LIVE card). Each = a director in battle.js `_FIN_DIRECTORS` (the DELIVERY 6
block), the signature in "THE FINISHER PASS 2" (the DELIVERY 6 block;
`_sigRunOwned` + `_fxDelay`, called inside the relayed cinematic — RULE #2),
a `_FIN_STAGE[sig]` script for the forge, a row in finishers.test.js's BUILT
table. Smoke-tested in a stub-THREE harness (every tick; not a render).
UNSEEN LIVE (RULE #1c): FINISHER_PLAN §7's delivery-6 entry lists what to
eyeball first — the tripod's scale, the dome's radius against the reverse
shot, the flat figure off-axis, the pines' scale, the serpent's jaws.

## SIX MORE EXECUTIONS — The Colony · The Bridge · The Last Verse · A Murder · Corrupted Save · The Dose (FINISHER_PLAN delivery 10) — 2026-09-20, local delivery
The next six `FINISHERS` rows in roster order are BUILT (fifty-one of 99; 48
remain): antperson `theColony` (`_sigTheColony3D` — the anthill, eighty
ants in a column that becomes a tide, the climb, the body carried back to
the hole in six pieces), mothman `theBridge` (`_sigTheBridge3D` — the red
eyes, the Silver Bridge building itself under the victim, the eyebar snap,
the segments into the river, the victim's last), siren `theLastVerse`
(`_sigTheLastVerse3D` — the sea comes in, three `_finRockBody` rocks stand
up, the note-cards, the walk into the water, the tower-high wave), scarecrow
`aMurder` (`_sigAMurder3D` — one crow, then fifty-six, the heap, the CAW,
the flock lifting as one), glitch `corruptedSave` (`_sigCorruptedSave3D` —
the missing-texture checker on a canvas, the wireframe + drifting
triangles, the floppy stuck at 99 %, the missing tile, FILE NOT FOUND, 404;
the first director on the `terminal` insert kind), machine elves `theDose`
(`_sigTheDose3D` — the kaleidoscope chamber, six self-transforming elves
with glyph-cards, the hyper-object growing to fill the sky, the rainbow
burst, the shards). Each = a director in battle.js `_FIN_DIRECTORS` (the
DELIVERY 10 block), the signature in "THE FINISHER PASS 2" (the DELIVERY 10
block; `_sigRunOwned` + `_fxDelay`, called inside the relayed cinematic —
RULE #2), a `_FIN_STAGE[sig]` script for the forge, a row in
finishers.test.js's BUILT table. Smoke-tested in a stub-THREE harness (every
tick; not a render). UNSEEN LIVE (RULE #1c): FINISHER_PLAN §7's delivery-10
entry lists what to eyeball first — the ants' size, the bridge past the rim,
the sea's edge, the crows' flap, the checker's read, the gift's final scale.

## SIX MORE EXECUTIONS — Wearing You · Full Moon · Petrified · Three Wishes · Nine Lives · The Praying (FINISHER_PLAN delivery 9) — 2026-09-20, local delivery
The next six `FINISHERS` rows in roster order are BUILT (forty-five of 99; 54
remain): skinwalker `wearingYou` (`_sigWearingYou3D` — the ring of eyes, the
stalker's lope on all fours, the mirror, the FACE peeled off the victim and
worn, the skin fluttering away), werewolf `fullMoon` (`_sigFullMoon3D` — the
misc `moon` GLB drops to hang over the board, the howl's rings, the change in
reverse (fur → man → smaller → a heap of clothes), the BLOOD MOON on the hit —
the GLB's materials tinted through `userData._finBase`), gargoyle `petrified`
(`_sigPetrified3D` — the stone + cracks + plinth, a CATHEDRAL rising beside the
tile with two stone gargoyles on its parapet, a live one that carries the
statue up, the pigeon, the tip and the shatter into ballistic chunks), djinn
`threeWishes` (`_sigThreeWishes3D` — the brass lamp, the smoke face, the coin
rain into a mound, the fling, the ⏸, the spiral into the spout, the lid),
catgirl `nineLives` (`_sigNineLives3D` — nine perches on a climbing spiral
ending at THE MOON, the cat, nine knocks with a LIVES card whose texture is
swapped per knock, the flat landing), mantid `thePraying` (`_sigThePraying3D`
— a building-sized mantis on jointed forelegs steps in, prays, bows, bites the
victim in half; the top half goes into the head, the bottom topples). Each = a
director in battle.js `_FIN_DIRECTORS` (the DELIVERY 9 block), the signature
in "THE FINISHER PASS 2" (the DELIVERY 9 block; `_sigRunOwned` + `_fxDelay`,
called inside the relayed cinematic — RULE #2), a `_FIN_STAGE[sig]` script for
the forge, a row in finishers.test.js's BUILT table. Smoke-tested in a
stub-THREE harness (every tick of every signature; not a render). UNSEEN LIVE
(RULE #1c): FINISHER_PLAN §7's delivery-9 entry lists what to eyeball first —
the moon's size, the cathedral's perch over the tile, the lamp's spout frame,
the perches against the rim, the mantis's head reaching the bow.

## SIX MORE EXECUTIONS — Compactor · Factory Reset · The Rapture, Party of One · Be Not Afraid · Into the Sun · The Contract (FINISHER_PLAN delivery 7) — 2026-09-20, local delivery
The next six `FINISHERS` rows in roster order are BUILT (thirty-three of 99):
robot `compactor` (`_sigCompactor3D` — two steel walls on hydraulic rails
close on the victim along the PERPENDICULAR of the caster → victim line,
the press plate, the serial-stamped cube), android `factoryReset`
(`_sigFactoryReset3D` — the ⏻ power-down, the exploded PARTS DIAGRAM with
leader lines and a progress card, the THIS SIDE UP crate), angel `rapture`
(`_sigRapture3D` — the cloud ring, the trumpet, the gold column, the iris
that shuts and re-opens RED, the hand, the one scorched feather), seraphim
`beNotAfraid` (`_sigBeNotAfraid3D` — three rings within rings on three
axes with fourteen eyes a ring that all turn to the victim on the gaze
beat, the great eye's lid, the bleach), orb of light `intoTheSun`
(`_sigIntoTheSun3D` — a board-sized sun off the far edge, the fling down
the line, the collapse, the NOVA shell out to thirty tiles; the resolve's
whiteout is `sizeTiles: max(8, c.span)` — the whole board), demon
`contract` (`_sigContract3D` — a sky-sized parchment off two rollers
(`_finTextTex` with a `bg`), the quill signing the victim's own name in
fire, the seal, the pit, four `_finChain` chains, the burn). Each = a
director in battle.js `_FIN_DIRECTORS` (the DELIVERY 7 block), the
signature in "THE FINISHER PASS 2" (the DELIVERY 7 block; `_sigRunOwned` +
`_fxDelay`, called inside the relayed cinematic — RULE #2), a
`_FIN_STAGE[sig]` script for the forge, a row in finishers.test.js's BUILT
table. RULE learnt: a signature that spawns particles beside a moving piece
adds the piece's group-local offset to `tilePx`'s x / y directly — the
board's world units ARE its pixels (`c.x + px * gap`), never a tile
conversion. Smoke-tested in a stub-THREE harness (every tick; not a
render). UNSEEN LIVE (RULE #1c): FINISHER_PLAN §7's delivery-7 entry lists
what to eyeball first — the walls' facing, the sun's radius against the
dome, the parchment's legibility, the eyes' lag, the six camera paths.

## SIX MORE EXECUTIONS — Nobody · Orbital Drop · Dark Dominion · Lullaby · Devoured · The Fall (FINISHER_PLAN delivery 11) — 2026-09-20, local delivery
The next six `FINISHERS` rows in roster order are BUILT (fifty-eight of 99; 41
remain): cyclops `nobody` (`_sigNobody3D` — the cave mouth heaves up behind
the giant with one eye in its dark, THE ROCK over the lintel (the misc
asteroid via `_finRockBody`) comes down on the victim ONCE, is lifted
higher, comes down again on the hit; WHO DID THIS → NOBODY), cyborg
`orbitalDrop` (`_sigOrbitalDrop3D` — the jetpack stand-in lifts off the
caster's tile on an exhaust column while the real model fades (`c.fade`),
the satellite card + the red DESIGNATOR on the victim, RE-ENTRY as a
`_finRockBody` meteor in a plasma shell, the crater, the cyborg standing in
it as the model fades back), demon prince `darkDominion`
(`_sigDarkDominion3D` — the crimson portal torus overhead with
`_LT().bolt` lightning and the `demon_statue` clone at its rim, fourteen
winged bodies diving one after another, the last carries the body up into
the disc and the ring snaps shut), demon princess `lullaby` (`_sigLullaby3D`
— the black cradle on rockers, the clawed hands rocking it slower, the skull
mobile, the notes, five candles guttering under a closing dark dome, the
ground opens under the crib, a stone reads zzz; the director's face cam
sits under slowly closing `cineEyelids`), dreameater `devoured`
(`_sigDevoured3D` — the dream bubble with the little scene inside, two
jaws of teeth take it in three bites, then the sleeper in three from the
crown down, the pillow is what is left), fallen angel `theFall`
(`_sigTheFall3D` — the column of light, the body carried ten tiles up past
`white_cloud` clones to the `pearly_gate` clone in a halo, the light snaps
off, black wings burn, the long tumble down beside an altimeter sprite whose
`_finTextTex` is swapped per step, the crater, black feathers). Each = a
director in battle.js `_FIN_DIRECTORS` (the DELIVERY 11 block), the
signature in "THE FINISHER PASS 2" (the DELIVERY 11 block; `_sigRunOwned` +
`_fxDelay`, called inside the relayed cinematic — RULE #2), a
`_FIN_STAGE[sig]` script for the forge, a row in finishers.test.js's BUILT
table. Smoke-tested in a stub-THREE harness (every tick; not a render).
UNSEEN LIVE (RULE #1c): FINISHER_PLAN §7's delivery-11 entry lists what to
eyeball first — the cave behind the caster, the rock's scale, the exhaust
column, the portal's height, the crib, the jaws, the gate's facing, the
altimeter.

## SIX MORE EXECUTIONS — Baphomet's Rite · Half Measures · The Wave · The Watchers' Verdict · The Drain · Event Horizon (FINISHER_PLAN delivery 12) — 2026-09-20, local delivery
The next six `FINISHERS` rows in roster order are BUILT (sixty-four of 99; 35
remain): goatman `baphometsRite` (`_sigBaphometsRite3D` — the inverted
pentagram burns in, five black candles rise and light, seven hooded chanters
stand up out of the ground, the horned torch-crowned goat rises behind the
victim AS ABOVE / SO BELOW, the body lifted off the sigil into a column of
black-red fire, the candles snuffed one by one), halfdemon `halfMeasures`
(`_sigHalfMeasures3D` — the stand-in splits: the pale human half steps aside
and turns its back, the crimson other half grows horns + a wing, lunges, a
six-slash flurry at a rising cadence, the body slammed through the ground into
a fire pit, the halves walk back and rejoin; the real model is faded for the
beat), mermaid `theWave` (`_sigTheWave3D` — the tide in from the rim, the
mermaid on a rock singing, a LOFTED CURLING WAVE WALL — a hand-built
BufferGeometry, vertex colours deep → light → foam, nine tiles tall — rolls in
with spray off its lip and crashes on the tile; the water drains back off the
edge and leaves a puddle and a shell), nephilim `watchersVerdict`
(`_sigWatchersVerdict3D` — a dark dome, TWO HUNDRED EYES on one InstancedMesh
(`_finEyeTex`, a cached canvas almond) opening in sequence, each turned on the
victim by `Matrix4.lookAt`; 200 light threads converge on the gaze; six
`_LT().bolt`s out of six eyes, then every eye shuts at once), vampire
`theDrain` (`_sigTheDrain3D` — the bent cape the size of the night leaning
over the board lining-up, eighty bats on one InstancedMesh spiralling in and
biting, a wine glass round the victim filling red from the foot as the body
pales and shrinks, lifted on a pivot whose local +X is the caster and tipped,
drained, shattered into fourteen shards, the cape closing), voidweaver
`eventHorizon` (`_sigEventHorizon3D` — a violet seed from the hand opens into a
true black sphere in a photon ring under two accretion discs, the body a
`_finChain` of 26 beads on a corkscrew into the horizon swallowed head first,
the collapse to a point, ONE flash out — the director's `strike` freezes on the
`invert` grade and fires its ring / flash / slam 180 ms later through `c.at`).
Each = a director in battle.js `_FIN_DIRECTORS` (the DELIVERY 12 block), the
signature in "THE FINISHER PASS 2" (the DELIVERY 12 block; `_sigRunOwned` +
`_fxDelay`, called inside the relayed cinematic — RULE #2), a `_FIN_STAGE[sig]`
script for the forge, a row in finishers.test.js's BUILT table. Smoke-tested
in a stub-THREE harness (every tick; not a render). UNSEEN LIVE (RULE #1c):
FINISHER_PLAN §7's delivery-12 entry lists what to eyeball first — the goat's
silhouette, the split on a sprite vessel, the wave wall's colours under the
board's light, the eyes' scale on the dome, the glass's tilt direction, the
black sphere on a dark map, the six camera paths.

## SIX MORE EXECUTIONS — Heat Death · Up, Up and Away · Air Support · Decommissioned · No Mercy · Wake Up, Sheeple (FINISHER_PLAN delivery 13) — 2026-09-20, local delivery
The next six `FINISHERS` rows in roster order are BUILT (seventy of 99; 29
remain): cosmic wraith `heatDeath` (`_sigHeatDeath3D` — a dome of 360 stars
(Points) that recede and go out one by one to the universe's clock card, frost
and ice crystals climbing the body, the temperature card to 0 K, THE LAST STAR
guttering out on the hit, the body into sixteen frozen shards; the director's
dolly zoom recedes with the expansion), superhero `upUpAndAway`
(`_sigUpUpAndAway3D` — the caped stand-in streaks in, scoops the body, climbs
fourteen tiles through the clouds to THE CURVE OF THE EARTH (a globe + an
atmosphere rim under a black sky at the apex), lets go — the fall beside a
speed card to TERMINAL · 53 m/s, the crater, the one-knee landing; the real
model faded for the beat), general `airSupport` (`_sigAirSupport3D` — two
procedural jets (`_finJet`) low along the line on contrails, the lead's one
bomb a beat EARLY (SPLASH · ONE), the wingman coughing smoke and crashing on
the tile anyway = the hit, the tail fin in the wreck, the ejection seat under
a chute; the first finisher on `cineFlyBy`), droid `decommissioned`
(`_sigDecommissioned3D` — the conveyor out to a rising incinerator, the crate
folding shut, the arm's OBSOLETE stamp + the name-and-barcode label, the roll
into the furnace mouth, the door, the receipt END OF LIFE), antihero `noMercy`
(`_sigNoMercy3D` — the walk up, THE FRAME CUTS TO BLACK (an opaque dome + the
director's `cineEyelids`), closed-caption cards [WET SOUNDS] … [A ZIPPER] with
red spatter on the black while nine sound beats play in the dark, the lights
back on the antihero wiping their hands, a chalk outline, a body bag),
conspiracy theorist `wakeUpSheeple` (`_sigWakeUpSheeple3D` — pushpins at the
board's four corners + two edges (`state.boardHeights`; six tiles out on the
stage), RED STRING from every pin to the victim's head, cards flying in along
them, a corkboard rising behind the victim, the strings reeling the body in,
the two cork leaves snapping shut like a bear trap, IT WAS YOU ALL ALONG).
Each = a director in battle.js `_FIN_DIRECTORS` (the DELIVERY 13 block), the
signature in "THE FINISHER PASS 2" (the DELIVERY 13 block; `_sigRunOwned` +
`_fxDelay`, called inside the relayed cinematic — RULE #2), a `_FIN_STAGE[sig]`
script for the forge, a row in finishers.test.js's BUILT table. Smoke-tested
in a stub-THREE harness (every tick; not a render — it caught Heat Death
zeroing the stars' colours on tick one, fixed). UNSEEN LIVE (RULE #1c):
FINISHER_PLAN §7's delivery-13 entry lists what to eyeball first — the star
dome, the globe's scale from the apex, the jets' heading, the belt past the
rim, the black dome under the eyelids, the pins on a raised corner.

## EIGHT MORE EXECUTIONS — Cataclysm Decree · Prophecy Fulfilled · The Motion Carries · Poseidon's Wrath · Extinction Event · Hoard · Grave Robbery · Garden Variety (FINISHER_PLAN delivery 14) — 2026-09-20, local delivery
The next eight `FINISHERS` rows in roster order are BUILT (seventy-eight of 99;
21 remain): overlord `byOrderOf` (`_sigByOrderOf3D` — THE DECREE unrolls in
the sky on two rollers (`_finScroll`, a new shared helper: a parchment plane
wearing a `_finTextTex` card, `unroll(k)` / `setText`), the wax seal, the
red-black dome with a rift at its zenith, six lesser `_finRockBody` comets
round the tile then THE COMET out of the zenith), chosen one
`prophecyFulfilled` (`_sigProphecyFulfilled3D` — the scroll rises between
them and is written a line per beat, the caster's halo, THE STAR down a
column of light, …SHALL FALL., the body to motes), politician `motionCarries`
(`_sigMotionCarries3D` — the empty benches, fourteen AYE ballots stacking on
the podium, the tally card, THE GAVEL the size of a building down on the
hit, the body flattened, EXPELLED), atlantean `poseidonsWrath`
(`_sigPoseidonsWrath3D` — the sea to the knees behind a foam wave, THE
TRIDENT up through the floor lifting the body with lightning on the shaft,
the whirlpool drain), dinosaur `extinctionEvent` (`_sigExtinctionEvent3D` —
ferns, dusk, AIMED AT ONE UNIT, the dot that grows into the kit's rock on a
shallow entry line, the seven-tile impact, the ferns flattened, the ash, a
fossil plate), dragon `hoard` (`_sigHoard3D` — THE FULL SIZE: a
`_finChain` neck to a horned head, two wings, the inhale, a cone of fire
onto the body, the ash cone, forty coins into a heap, the neck curled over
it), ghoul `graveRobbery` (`_sigGraveRobbery3D` — the pit, the drop, the
ghoul stand-in shovelling in beats, the hand pulled back under, the
headstone cut with the name and TODAY'S date, the wreath, the crow), gnome
`gardenVariety` (`_sigGardenVariety3D` — painted ceramic, the lawn / fence /
flowers / the kit's mushrooms / a birdbath, THE LAWNMOWER through the gap
and the ornament, the shards, MULCHED). Each = a director in battle.js
`_FIN_DIRECTORS` (the DELIVERY 14 block), the signature in "THE FINISHER
PASS 2" (the DELIVERY 14 block; `_sigRunOwned` + `_fxDelay`, called inside
the relayed cinematic — RULE #2), a `_FIN_STAGE[sig]` script for the forge,
a row in finishers.test.js's BUILT + SIG_FN tables. Smoke-tested in a
stub-THREE harness (every tick from four placements, the caster on the
victim's tile included; not a render). UNSEEN LIVE (RULE #1c):
FINISHER_PLAN §7's delivery-14 entry lists what to eyeball first — the
decree's size, the comets' fall, the gavel from the crane, the flood's edge
on a raised board, the asteroid's heading, the dragon's silhouette, the
headstone's text, the mower's lane, the eight camera paths.

## EIGHT MORE EXECUTIONS — Release the Kraken · Nessie Surfaces · Avalanche · Space Disco · Assimilated · Eruption · Flash Frozen · Through the Wall (FINISHER_PLAN delivery 15) — 2026-09-20, local delivery
The next eight `FINISHERS` rows in roster order are BUILT (eighty-six of 99;
13 remain): kraken `releaseTheKraken` (`_sigReleaseTheKraken3D` — the sea
round the tile, eight arms up through it (the misc `tentacle` clones over
chain arms), the lift, THE BEAK out of the centre, the ink), loch ness
monster `nessieSurfaces` (`_sigNessieSurfaces3D` — the loch, three humps,
the neck under the tile, the flash, THE PHOTO (`_finPhotoTex`) out of the
water, the whip down), yeti `avalanche` (`_sigAvalanche3D` — the mountain
rises beyond the victim, the cap cracks, a wedge of masses races the line
and STOPS on the tile, the mound, the flag), barbarella `spaceDisco`
(`_sigSpaceDisco3D` — the moon-sized mirror ball on a cable, the dance
floor, four sweeping spots, the shells one by one then twelve at once, the
cable snaps, the ball on the one seat; the spawner has no delay — a shell's
burst is a `pending` row a later tick spends), black goo `assimilated`
(`_sigAssimilated3D` — the pools, the tendrils, the shell, the body taken
apart, nine goo figures wearing THE FACE (`_finMaskTex`)), golem `eruption`
(`_sigEruption3D` — the tile rises into a cone, the cracks, the column, the
`_finRockBody` lava bombs, the ash, the body into the crater, NO.), ice queen
`flashFrozen` (`_sigFlashFrozen3D` — the block, the pedestal, the velvet
rope, three lamps for the director's three cuts, the fingertip, the shards),
juggernaut `throughTheWall` (`_sigThroughTheWall3D` — eight brick walls
(`_finBrickTex`) along the line, the stand-in's accelerating charge through
every one, the body carried through the four ahead, the last wall's hole).
Each = a director in battle.js `_FIN_DIRECTORS` (the DELIVERY 15 block), the
signature in "THE FINISHER PASS 2" (the DELIVERY 15 block; `_sigRunOwned` +
`_fxDelay`, called inside the relayed cinematic — RULE #2), a
`_FIN_STAGE[sig]` script for the forge, a row in finishers.test.js's BUILT +
SIG_FN tables. Smoke-tested in a stub-THREE harness (every tick from four
placements; not a render). UNSEEN LIVE (RULE #1c): FINISHER_PLAN §7's
delivery-15 entry lists what to eyeball first — the tentacle GLBs' lean, the
mountain's distance, the ball's size, the cone under the real model, the
walls' spacing on a short line, the eight camera paths.

## THE LAST THIRTEEN — Spirit Bomb · Top of the Tower · The Labyrinth · Recruited · Sacred Geometry · The Hail Mary · Split the Arrow · Megazord · Bonded · Valhalla · Observed · Drive-By · Ruler (FINISHER_PLAN delivery 16) — 2026-09-21, local delivery
THE CATALOGUE IS COMPLETE: every one of the 99 `FINISHERS` rows wears a
bespoke `sig` + `built: true`; `sig: null` no longer exists in data.js
(the typed execution stays as the fallback for an unknown race). The last
thirteen in roster order: ki fighter `spiritBomb` (`_sigSpiritBomb3D` —
sixteen threads from the horizon into one ball over the caster, grown to
3.6 tiles, thrown down the line, compressed to a point on the hit), king
kong `topOfTheTower` (`_sigTopOfTheTower3D` — a ten-tile lit skyscraper
beside the tile, the ape's climb with the body, three `_finBiplane`s, one
swatted, the drop from the top), minotaur `theLabyrinth`
(`_sigTheLabyrinth3D` — a 7 × 7 stone maze from a fixed plan, the body
runs a waypoint route, the walls drop and the bull is behind it), necromancer
`recruited` (`_sigRecruited3D` — the bolt, the fall, the headstone, the
body stands back up green-eyed under YOU START MONDAY and shambles off the
board; `resolveMs` 3200), occulus `sacredGeometry` (`_sigSacredGeometry3D`
— a 4D tesseract projected down over the tile, a Metatron cube on the
ground, four folds, a point), quarterback `hailMary` (`_sigHailMary3D` —
yard lines to an end zone nine tiles out, the spiral, the catch, the
spike), robinhood `splitTheArrow` (`_sigSplitTheArrow3D` — the target,
three arrows each splitting the last, the fourth splits the body into two
half cylinders), super sentai `megazord` (`_sigMegazord3D` — five vehicles
lock into a six-tile silhouette behind the caster, the chest beam), symbiote
`bonded` (`_sigBonded3D` — the suit leaves the host as a blob swarm, wraps
the victim with `_finVenomTex`, comes home bigger), valkraye `valhalla`
(`_sigValhalla3D` — a `_finHorse` with wings down a spiral, Bifrost's six
bands up, the bolt, the burning fall), watcher `observed` (`_sigObserved3D`
— a seven-tile `_finEyeTex` eye between two lids, seven flickering copies,
a standing-wave ring, the collapse one by one), gangster `driveBy`
(`_sigDriveBy3D` — the cadillac clone on the lane beside the victim, a round
every 110 ms from four windows, casings, the chalk outline), nun `theRuler`
(`_sigTheRuler3D` — an eight-tile `_finRulerTex` ruler, three raps, up
edge-on and down, snapped in two, a halo). Each = a director in battle.js
`_FIN_DIRECTORS` (the DELIVERY 16 block), the signature in "THE FINISHER PASS
2" (the DELIVERY 16 block; `_sigRunOwned` + `_fxDelay`, called inside the
relayed cinematic — RULE #2), a `_FIN_STAGE[sig]` script for the forge, a row
in finishers.test.js's BUILT + SIG_FN tables. Smoke-tested in a stub-THREE
harness (every tick from four placements; the stage scripts' timers; not a
render). UNSEEN LIVE (RULE #1c): FINISHER_PLAN §7's delivery-16 entry lists
what to eyeball first — the ball's radius, the tower's height, the maze
cells, the tesseract at the game's pitch, the zord's scale, the cadillac's
yaw, the ruler's overhang, the thirteen camera paths.

## THE 2026-09-21 BATCH'S EXECUTIONS — Book 'Em · The Bloom · Ascension Day (FINISHER_PLAN delivery 17) + the jellyfish WALKS + no gun idle (2026-09-21, local delivery)
The three races that landed the same day with `sig: null` are BUILT — the catalogue is
102 of 102 and `sig: null` no longer exists in data.js `FINISHERS`: police officer
`bookEm` (`_sigBookEm3D` — THE CRUISER (the misc `copcar` clone, else a box) up the lane
beside the victim with the bar strobing red / blue and a spot on the tile, the officer
steps out, the rights card, the CUFFS with a glint, the walk to the rear door, the body
into the back; the hit is the DOOR SLAM; the cruiser leaves the board, an evidence tent
and a CITATION № 1954 flutter down; BOOKED), jellyfish `theBloom` (`_sigTheBloom3D` —
THE SEA COMES UP over the tile as a translucent column with caustic rings, 44 glowing
bells on rising spirals arrive one, then a dozen, then a bloom while the counter climbs
ONE OF US → A THOUSAND OF US and the swarm closes on the body; the hit is every bell
flashing at once; the water DRAINS and a wet PRINT is what is left), cult leader
`ascensionDay` (`_sigAscensionDay3D` — nine candles light one by one, THE FAMILY files in
from beyond the victim in a single line and takes the ring, the leader's CUP is passed
hand to hand round the circle and drunk; the hit is the COLUMN OF LIGHT — the body goes
up in motes, every robe steps back, and ONE MORE ROBE grows on the tile). Each = a
director in battle.js `_FIN_DIRECTORS` (the DELIVERY 17 block), the signature in "THE
FINISHER PASS 2" (the DELIVERY 17 block; `_sigRunOwned` + `_fxDelay`, called inside the
relayed cinematic — RULE #2), a `_FIN_STAGE[sig]` script for the forge, a row in
finishers.test.js's BUILT + SIG_FN tables (new-races.test.js now pins BUILT, not
designed). Smoke-tested in a stub-THREE harness (every tick from four placements; not a
render). **THE TWO CLIP RULES** (sprites.js): the jellyfish WALKS — its `Swim_Idle_Loop`
/ `Swim_Fwd_Loop` overrides are gone, the library's ordinary loops play (the user: "a
walking animation, not swimming"); and NO GUN-POSE IDLE — the four `Pistol_Idle_Loop`
idle overrides on the police officer + his three skins are gone (the 2026-08-09 rule
"nobody mimes holding a gun at rest" holds for every ranged race; the gun comes up for
the shot through castRanged). UNSEEN LIVE (RULE #1c): FINISHER_PLAN §7's delivery-17
entry lists what to eyeball first — the cruiser's yaw, the door's hinge on the real GLB,
the bells' size, the column's opacity, the file's spacing, the three camera paths.

## ⛓ THE CHAIN REACTION — one arrival resolver, every board object fires on contact (2026-09-21, local delivery)
The user: "if I place a bomb and a couple turns later displace a unit or ground a flyer on it, it should
explode right then; if that knocks them into a tornado, the tornado should fling them immediately; if
they land in a debuff zone I placed two rounds ago they get the debuff on the spot — modular, a chain
reaction, a Rube Goldberg machine, predictable." ROOT CAUSE: the board's reactions were split by HOW
the body arrived — the walk (`finishMoveAt`) read bombs / traps / mines / goo / fire / water; the shove
(`_applyKnockbackHazard`, called by every slide / pull / push) read only the liquids and the hidden
traps; a grounded flyer, a teleport, a swap, a dash, a throw and a drag read NOTHING; debuff zones and
the tornado bit only at the END OF THE ROUND. NOW: battle.js **`resolveTileArrival(unit, { via,
fxDelayMs })`** (the block "THE CHAIN REACTION", right before `_applyKnockbackHazard`; on `window` and
`GAME`) is THE ONE ARRIVAL RESOLVER, in ONE fixed order — **A THE SKY** (an airborne body meets only a
super-gravity field → `forceGroundUnit` re-enters on the deck; else it glides over everything) · **B THE
GROUND** (`_chainGround`: water soaks, lava / deep water bite on a shove — a walk keeps the terrain's
end-of-turn rule —, a burning tile burns, goo coats) · **C THE PICKUPS** (pixie dust, debris) · **D THE
FUSES** (`_chainFuses`: an enemy BOMB detonates, a hidden TRAP springs, a deployed `detonateOnStep`
mine fires) · **E THE ZONES** (`_chainZones`: every enemy debuff zone the tile lies in applies its
statuses NOW — under the nameplate through `applyStatusPayload` —, once per zone per round
(`unit._zoneEntryStamps`, a plain id → round map; the end-of-round tick still refreshes); the friendly
smoke cloak re-reads) · **F THE VORTEX** (`_chainVortex`: an active tornado / hurricane whose tiles
hold the body shreds it and FLINGS it now — `applyBlowback` × `displaceTiles` from the eye with
`noChain`, then `playVortexFlingFx` (relayed) — once per storm per round (`unit._vortexStamps`; state.js
`processHomingWeather` writes the same stamp before its own pushes and chains its landing)) · **G THE
RUNE** (a warp rune teleports; the landing re-enters). Every step re-reads `unit.x / y` and bails once
the body died or another step moved it; a reaction that moves a body calls the resolver again at
depth + 1 (`CHAIN_RULES.maxDepth` 8 — "the chain reaction runs out"); a nested landing floats
`⛓ CHAIN ×n`; the top of the chain logs the count, runs ONE `checkWin`, one render. **THE CALLERS**:
`finishMoveAt` (`via: 'move'` — its inline bomb / trap / mine / goo / fire / water / pixie / smoke /
gravity blocks are GONE; `getPathPickupEvent` still STOPS a walk on a bomb / trap; the objectives —
Keys, the Nexus tick, wards — stay walk-only in `completeMoveAlongPath`, a shoved body never claims
them), `_applyKnockbackHazard(unit, opts)` = the resolver with `via: 'displaced'` (every slide / pull /
magnet / ice slide / flood site keeps calling it), `resolveForcedSlide`'s tail hands the tween as
`fxDelayMs` (a bomb's blast VFX waits for the slide to land the body — `detonateBomb(bomb, text,
{ fxDelayMs })`; state never waits), `forceGroundUnit` (`'grounded'`), the teleport (`'teleport'` /
`'self'`; a grounded body's z is the destination's surface now), the swap (both), the escape, the
dash (the landing + the knocked-aside occupant), the sky throw (the landing + the collision push, both
inside `_applyThrowLanding`), the slam / dive strikers, the grapple's reel-in, the charges, the carry,
`_tetherFollow` (`'dragged'`), the descent knock-aside, and state.js `applyBlowback` (`'blown'`, both
landings; `opts.noChain` for a caller mid-fling). RULES: (1) a new "body lands on a tile" site calls
`resolveTileArrival` — never re-read `state.bombs` / `state.traps` / `_deployedObjects` /
`_activeZones` / the weather at a landing; (2) a new board OBJECT = a step in the resolver (the order
is the contract); (3) a reaction that MOVES a body re-enters the resolver at its landing and stamps
itself per round when it can fire again (the zone's / the vortex's rule); (4) RULE #2: host-only engine
work, the stamps are plain data, the VFX it fires ride their own relays. NOT built: the AI's foresight
(ai.js scores a push by the landing's terrain only — it does not see the bomb / zone / vortex the
target lands in; `_chainZonesAt` / `_chainVortexAt` are the reads a forecast would use), a push
preview that marks the object under the landing tile, a walk that stops at a zone or a vortex en
route (only the LANDING tile reacts). `npm test` runs `chain-reaction.test.js` (the resolver in a vm:
bomb → blast → tornado → fling → zone; the stamps; the sky; the cap; the owner rule; every site
source-guarded). UNSEEN LIVE (RULE #1c): the blast timed to the slide's landing, the fling arc taking
over a rig mid-shove, the ⛓ float's stacking, the zone's status badge landing under the nameplate on
contact.

## THE NEW-RACE VFX PASS — police officer · jellyfish · cult leader · popstar get their own kit, and the battle shows it (2026-09-22, local delivery)
The user: "I can see VFX in the party builder but not during actual battle; even those are too generic." WHY (read off the
code): the 2026-09-21/22 batch shipped on FAMILY ALIASES (`Object.assign({}, SPELL_MAP['<other race>'])`) and five of the
twenty never drew a thing in a battle — the alias carried the wrong INTENT for the row's KIND (the Taser copied a deploy's
`aura`, a damage row fires `impact`; Bloom copied a buff's `aura`, an aoe row fires `aoe`; Lockdown and Stadium Show copied
Shockwave Clap's `beam` + `impact`, and `resolveTravel` routes an aoe wearing a beam key to the BEAM handler) — and four
KIND BRANCHES in battle.js never fired a mapping at all (encore fired nothing; the debuff branch fired only the generic
corruption aura; the charge's strike fired nothing; so Encore! / the Kool-Aid / Spotlight / Stage Dive were invisible on
the board). The forge's stage fires every mapped intent at once, which is why the builder showed more than the board.
**THE RULE PER KIND** (battle.js `resolveTravel` + the kind branches): damage r≤2 physical → strikeLeap → `impact` · damage
magic → `bolt` (+ `impact` on landing) · aoe → `aoe` (a def with `impactTileEffect` + `impactCenterEffect` + `aoeRadius`) ·
warCry / selfHeal / summonUnit / encore → `aura` · debuff / steal / possess / tackle → `impact` · teleport → `teleport`.
**AN AURA DEF'S LOOK IS ITS `impactCenterEffect`** — `_fireAura` spawns the pillar, the geometry and the per-tile / centre
bursts and NEVER a def's bare `layers` (the Harbinger job's `encore_aura` had worn bare layers since it was authored and
drew nothing; it is `{ aoeRadius: 0, impactCenterEffect: 'encore_center' }` now). A candle is a `fire-glow` sprite — a
floor-anchored `flame` layer summons the ray-marched VOLUMETRIC fire per tile. **THE BLOCK**: three-vfx-effects.js "THE
NEW-RACE VFX PASS" (right after the door agent's geometry registry): twenty bespoke recipes (`race<Police|Jelly|Cult|Pop>*`
+ the bolts `_bolt_taser` / `_bolt_sting` / `_bolt_mic`), and eighteen 3D SIGNATURES registered under the spell ids —
`_sigBatonSwing3D` (the swing + the badge strobe) · `_sigTaserWires3D` (two crackling wires from the hand) ·
`_sigSprayCone3D` (the can's cone over the 3×3) · `_sigCuffs3D` · `_sigLockdown3D` (barricades rise on the rim, POLICE LINE
tape between them, the strobe bar, the cold spot) · `_sigStingTendril3D` · `_sigJellyBloom3D` (bells on spirals) ·
`_sigNematocystNet3D` (threads drop and cinch) · `_sigImmortalCycle3D` (the bell collapses to a polyp and grows back) ·
`_sigSermon3D` (candles on the ring, the word in dark rings) · `_sigKoolAid3D` (the cup pours) · `_sigTithe3D` (the plate,
the coins) · `_sigIndoctrinate3D` (the hood comes down) · `_sigGathering3D` (a member steps out of a dark doorway) ·
`_sigMicDrop3D` (the mic falls and bounces, a sonic ring per contact) · `_sigEncore3D` (the spot, the notes, the confetti,
the word) · `_sigStageDive3D` (the crowd's hands pass the body along) · `_sigStadiumShow3D` (the rig rises over the 5×5,
the beams sweep, twelve pyro jets in sequence, confetti over all); Spotlight reuses `_sigSpotlight3D`. The registry runs
from fire()'s impact / aoe / aura intents (the caster rides `params.fromX / fromY` where the site gives it, `_sigCasterPos`
else) — RULE #2 by construction. **battle.js**: the encore branch fires `aura`; the debuff branch fires the row's own
`impact` when mapped (the generic aura is the fallback); `_runChargeToTargetSpell` fires `impact` on arrival (every tackle /
charge row with a recipe shows now — Sky Tackle too). **THE POPSTAR'S SHEET**: `Races/popstar/popstar_female.png` is her
single-file 2D sheet (`_SINGLE_FILE_RACES`, `RACE_PATH_RULES` folder `popstar`, `RACE_SPRITES`) and stands in for the
portrait (`RACE_PORTRAITS.popstar.female`) — the user's call, for now. `npm test` runs `new-race-vfx.test.js` — its SMOKE
loads the real VFX file on a stub THREE with fake timers, fires every intent of every row and pumps a virtual clock through
every signature's life (no tick error, particles spawned, every group off the scene); reuse that harness for any VFX pass.
UNSEEN LIVE (RULE #1c): every look — the scale of the barricades / the rig / the mic on the board, the wires' sag, the
cup's pour, the confetti's fall, the taser bolt in flight, the bells' pulse, the two colours of the strobe.

## THE ELEMENT BOX + THE ELEMENT PRESS + THE TYPED BOMB (2026-09-23, local delivery)
The user's four. **THE ELEMENT BOX**: ONE two-row read of a unit's elemental affinities wherever its stats
show — the six COMBAT elements' icons over the unit's REACTION to each (data.js `ELEM_REACTION_UI`: `–`
neutral · `!` weak (the press's green) · `▼` resist · `∅` immune · `♥` absorb · `?` unknown). data.js (the
block after `unitElementAffinity`): **`elemAffinityKnown(race, el, opts)`** is THE ONE READ of the knowledge
rule — a vessel on your roster (`isUnitOwned`), a seat of THE PARTY (`hqPartyRecordRaw`), roster scope 'all'
(Online / Practice / the range), the viewer's LOCAL ledger (localStorage `ew_elem_seen_v1`) or the MATCH's
synced **`state._elemSeen`** (`{ 'race|el': 1 }`; state.js literal; synced by default — the guest's box reads
the host's hits, RULE #2); `opts.own` / `opts.all` force it; dev `window.EW_ELEM_KNOW_ALL`. **`elemSeenMark
(race, el)`** is THE ONE WRITE (battle.js `applyDamageToUnit` files every combat-element hit on both ledgers
— a burn tick counts; `startMatch` resets the field, `finalizeMatch` folds it — `elemSeenFold`); `elemAffinityBox
(race, opts)` = the six-cell model (`{ el, tier | null, known, sym, color, tip }` — an unknown cell never
leaks its tier), **`elemAffinityBoxHtml(race, { own, seen, all, size: sm|md|lg, label })`** the innerHTML
form. Readers: hud.js `_hrlgElemBox` (under `_hrlgQuickStats` — the clicked unit's readout returns a
Fragment now), the INFO card (`.ins-affin` holds the box; the old pills are gone), the codex / shop dossier
(`_codexBuildElementAffinity`: the box + the KNOWN tiers' rows + "n of 6 unknown"), the forge's
`PbElementRing` (the box; the ring markup is the no-helper fallback), the pause menu's party sheet
(`.hq-pp-elem`, `own: true`). CSS: styles-base.css "THE ELEMENT BOX" (`.ew-elem-box` / `-row` / `-cell` /
`-el` / `-rx.<tier>`; sizes). A new stat surface = one `elemAffinityBoxHtml` / `elemAffinityBox` call — never
draw an affinity any other way. **THE ELEMENT PRESS** (ELEMENTAL_TYPES_PLAN decision #5 REVERSED): battle.js
`_pressOutcomeForHit` ADDS the TYPE tier (+1 / −1 / 0, the SPELL's own type vs the target — the caster's types
only ever add STAB; `_collectPressHit` reads `opts.spellType`, a typeless basic attack the attacker's) and the
ELEMENT tier (`elemPressTier`: weak +1 · resist −1 · immune / absorb −2), clamped to ±1: a super effective
element presses a neutral spell, an ineffective type under a super effective element is neutral (and vice
versa), an immune / absorbed element never presses whatever the type; `_collectPressHit` records `elemAff`
off `opts.spellElement`, the combo press reads `getSpellElement(combo)`. **THE TYPED BOMB**: `detonateBomb`
was `applyDamageToUnit` with no source and no type — no matchup ever applied. It is a TYPED BLAST now: the
bomb record files the row's `spellType` (Place Bomb = tech) + `spellElement`; the blast passes them with the
placer as `sourceUnit` (the credit, STAB, the press collector on a contact bomb) and **`opts.noAtkBonus`**
(a new applyDamageToUnit opt: the placer's live ATK bonuses never ride a placed object's blast). `npm test`
runs `elements-press.test.js`. Ship data.js to R2 AND Render (server.js reads it). UNSEEN LIVE (RULE #1c): the
box under the Horologe's stats at the identity column's width, the ? cells' read, the codex row, the forge's
STATS column, the tech callout on a bomb blast, the +2 AP off a fire spell on a yeti.

## THE SPELL DIRECTOR — every spell directed, one owner per shot (SPELL_DIRECTOR_PLAN.md, Phase 1) — 2026-09-23, local delivery
**`SPELL_DIRECTOR_PLAN.md` is THE doc for spell presentation from now on.**
It holds:
- the measured diagnosis;
- the fever-dream look bible;
- the architecture;
- phases 1–7: the director, the body, the fever, the dual techs, the
  capstones, the juice, the new clips;
- THE 30 ANIMATIONS the user will create, and how to export them so they
  drop into a `MAL3_Sniper.glb`.

Read it before touching a spell's camera, clip or VFX, and append to its §10
every session. `SPELL_CINEMATICS.md` stays the catalogue of the 87 bespoke
sequences.

**THE RULE: every cast is run by exactly ONE director** (battle.js
`_cinePlaySpellSequence`), whichever rig it takes:
- the offensive two-beat (`_playCineActionShot`);
- the SELF hero shot (`_playSelfCastHeroShot`, `rig: 'self'`, the aura pop at
  640 ms is the payoff frame);
- the SUPPORT gift shot (`_playSupportCineShot`, `rig: 'support'`).

Before this the self and support rigs never consulted the director table.
The families for every non-offensive kind, and ~20 bespoke sequences (Howl,
Trick Room, Chivalry, Wish Granted, Reassemble, Eject, Awakening…), could
never play. The families that did run cut twice, 0–30 ms after the stock
beat 2.

Resolution order:
1. `SPELL_DIRECTOR_ROWS[id].family` (a per-spell remap);
2. `CINE_SEQUENCES[id]` (bespoke);
3. `SPELL_FAMILY_DIRECTORS[CINE_FAMILY_BY_KIND[kind]]`.

EVERY kind maps to a family; the five new ones are `deploy`, `summon`,
`control`, `transform` and `world`. `SpellDirector.resolve(id)` is never
null, and `spell-director.test.js` walks all 519 spells.

**OWNERSHIP is two permissions:**
- `cineOwnShot(seq)` (explicit): the stock beats yield AND VFX retargets are
  blocked. It also clears a lazy claim's retarget permission.
- `_cineClaimShot(seq)` (THE LAZY CLAIM): made by `_cineBeatMove` /
  `_cineHardCut` when a director is directing (`_cineDirecting`, set by
  `_cineAt` beats and around a bespoke sequence's synchronous call). The
  stock beats yield; retargets are kept.
- A family director owns at t = 0 (`c.own()`) and calls `c.allowRetargets()`
  only where the hero part moves (strike · dash · sky · displace · multiHit
  · an aoe that knocks back).
- The stock beat 2 is a callable on every rig: `camera._cineStockHit = { seq,
  run }`. A director replays it with `c.stockHit()`. Its timer waits
  `CINE_CLAIM_GRACE_MS` (40) past the cut, so a director beat on the cut
  frame claims first.

**Rules for new directors:**
- schedule with `c.at(ms, fn, label)`: a beat past the shot's window is
  DROPPED (`keep` only for the descent clock);
- ONE hard cut per beat (the harness fails two within 50 ms);
- pass `c.raw(ms)` to a kit shot that wraps its own duration in `actionMs()`
  (cineGodShot / cineGlamCam / cineLowTile); `c.left(ms)` is scaled;
- a new camera helper goes through `_cineBeatMove` / `_cineHardCut`, never
  a bare `camera.moveTo`, or the lazy claim cannot see it.

**`SPELL_DIRECTOR_ROWS`** (data, battle.js) is the per-spell tuning surface:
`family`, `payoff` (a CINE_SHOTS name), `grade` / `gradeMs`, `insert
[text, kind, ms]`, `void` (a palette), `slow [scale, ms]`, `freeze`,
`flavourAt`. `anim` / `vfx` are reserved for Phases 2 / 3. The test checks
every field and every id.

**Readout:** `window.SpellDirector.log` (the last 40 casts: director, rig,
owned / claimed, the beats that fired; `@late` = dropped). Read it FIRST on
any "the camera did something weird" report.

**Kill-switch:** `window.EW_DISABLE_SPELL_DIRECTOR = true` restores the
pre-director layering exactly (`_cineApplyFamilyLegacy`).

**RULE #2:** `_spellFocusCamera` returns the resolved `spellId`, and
online.js's `spell-focus-cam` relay reads it off the result.

**Tooling:**
- `node check-spell-presentation.js [--json] [--list <bucket>]` — THE
  CENSUS: directors, the clip spread, VFX identity, bare capstones.
- `playtest_spellcam.js` — `LEGACY=1` (the A/B), `CAST_AT=x,y` (a self /
  ally cast), a `DIRECTOR` line, and it defaults to the Stadium Δ (Nuketown
  is retired).

**NOT touched:** the CHARGE rig (`animateDashActionCamera`), the finishers,
the Entropy Strike, the combos (Phase 4).

**UNSEEN LIVE (RULE #1c):** the family directors' look with real art (the
plan's §10 entry lists the edits).

## THE NEW CLIPS — MAL3, twenty cast verbs, travelling clips, the victim's reactions (SPELL_DIRECTOR_PLAN Phase 8) — 2026-09-25, local delivery

**The library.** mondo's 31 new Meshy clips (exported from the male sniper,
some named `mage_soell_cast_N` — the "spell" typo is the real file name) are
consolidated into `Assets/Models/MAL3_Sniper.glb` (2.0 MB, animation-only,
`node build_mal2.js <dir> MAL3_Sniper.glb MAL1_Sniper.glb`; the repo copy is
`rigged_animations/Assets_Models_MAL3_Sniper.glb`). It is library **index 4**
in sprites.js `EW_ANIM_LIB_URLS`. Every new slot is `defer: true` (baked one
per idle tick after the load bake), so a cast in the first seconds plays the
old fallback slot.

**Contact sheets, not file names.** `node anim-sheets.js --dir=<clips>
[--follow]` renders every clip as a frame strip plus the hips path
(`--follow` keeps a travelling body in frame). The findings (source seconds)
are in each UAL_SLOTS row's comment: e.g. `mage_soell_cast_2` spins, raises
both arms at 1.0 and drives both hands to the ground at 1.35 (castSkyward),
`Headache_Relief` holds the temples then releases at 2.85 (castPsychic),
`Skill_03` is a leaping spin into a pointing lunge (castCurse).

**The verbs** (sprites.js `SPELL_ANIM_VERBS`, chains in three-renderer.js
`_castChainFor`): roar, skyward, hurl, nova, rise, curse, psychic, smash,
sweep, jab, rally, slash, doubleSlash, roundhouse, plus the travel verbs
thrust, upSlash, leapSlash, leapPunch, flyKick. The old `call` / `push`
verbs lead with castSkyward / castShove now. The census's most-played clip
is 7 % of spells (the cap is 15 %).

**Travelling clips (`travel: true`).** Five clips move the body themselves:
Thrust_Slash and Charged_Upward_Slash lunge out and come home; Jumping_Punch
(4.1 hips-heights) and Rising_Flying_Kick (2.8) leap one way; Sword_Judgment
jumps in place and walks forward late. The bake pins them in the ground
plane (like pinXZ) and records the source hips' progress along the clip's
own main direction as a 0→1 curve (`_libTravelCurve`, kept on the ACTION as
`_ew_travel` because r128's clip.clone() drops userData). `back` = the
curve ends near 0 (a lunge).
- `ThreeAnim.clipTravel(unit, tx, ty, opts)` (`startClipTravelTween`) waits
  for the travel one-shot to start, then moves the unit group along the
  curve sampled from the action's own time — board distance, animator's
  timing. No clip within `waitMs` → a plain eased move. It ends on the
  unit's rest spot. `opts`: fromX/fromY/fromZ, toZ, stopShort, targetId,
  oneWay, waitMs, fallbackMs.
- `ThreeAnim.castTravels(unit, kind)` → `{back, slot}` or null: the slot a
  cast of that kind would play right now. battle.js `_castClipTravel(unit,
  spell)` adds the strike ms.
- battle.js: the **strikeLeap** travel handler rides a `back` clip instead
  of the board leap (stopShort 0.62, the hit on the launch = the strike
  frame); **leapStrike** rides a one-way clip onto its landing tile instead
  of the throw arc, the hit at max(launch, strikeMs); a **charge**
  (`_runChargeToTargetSpell`) with a one-way clip releases the clip on the
  chase cut (`_releaseCastSprite(unit, windup + strikeMs)`) and lands the
  hit on its strike frame; other charges sprint on RunFast (`charge: true`
  → the renderer's `runCharge` want).
- online.js relays `clip-travel` (primitives, fog-gated like
  `strike-leap`) and the `charge` flag on `displace-anim`.

**The victim.** applyDamageToUnit picks the flinch for an ordinary physical
hit: from range `hitShot` (Gunshot_Reaction), up close under 30 damage
`hitSlap` (Slap_Reaction). A heavy (crit / super effective / ≥ 40) physical
killing blow from an adjacent source sets `state._deathStyleById[id] =
'launch'` (a plain id→string map; it rides state-sync), and the death tween
plays `hitLaunch` (BeHit_FlyUp) instead of the knock-down. `dodge` is now
MAL3 Stand_Dodge (the UAL roll is the fallback).

**Unused from the batch:** Archery_Shot_2 (a static hold), Archery_Shot_3,
Dive_Down_and_Land (starts ~5 high: no spell drops from that height yet),
Kung_Fu_Punch (7 s and drifting), Climb_Up_Rope / Fast_Ladder_Climb (for the
HQ climb, not wired).

**mondo's mapping (sent after the upload; follow-up delivery
ENTROPY_WARS_NEW_CLIPS_2, token 20260925-new-clips-02-cors):** castSkyward is
now mage_soell_cast_6 (Summon_Skyward), castRise is Skill_01 (Power_Up_Flex,
the roar's clip too), mage_soell_cast_2 is castKinetic (Telekinesis_Throw:
new `kinetic` verb — kinetic hurls, gravity wells, black holes),
mage_soell_cast_4 is castDrain (Drain_Pull: new `drain` verb — the life
drains left `channel`), `earth` (walls, ramparts, fissures) plays the
Charged_Spell_Cast push (Earth_Raise), beams lead with MAL1 mage_soell_cast_3
(castMagic — Beam_Channel), `nova` lost its clip (castAOE), tree chops lead
with castSmash (Heavy_Hammer_Swing), and a LIGHTNING hit plays hitShot
(Gunshot_Reaction = Electrocuted). The CI red after the first upload: the
GLB landed at the repo root, not rigged_animations/ — anim-strike.test.js
now finds a library in either place and skips one that is absent.

**Two old bugs found in the live check (both fixed here):**
- The kept-rig rebuild (every entry is rebuilt after a walk / spell and
  reuses the cached rig) dropped `_ew_libBaked` / `_ew_def`, so
  `castStrikeMs` answered -1 after a unit's first action and every clip
  went back to starting at the launch — the Phase 1-7 strike-frame timing
  only held for a unit's first move. The flags now ride the rig record.
- `startDisplaceTween` used `ts` without declaring it: every vault (a
  charge's leap, a slide between levels, a tackle carrying a flyer) threw
  and the slide never played.

**Live check (playtest_clips.js, a paused Playwright clock stepped 50 ms
at a time):** Valkyrie Spear — Thrust_Slash binds, the body lunges to 0.62
short of the victim, the hit lands on clip time 0.65 (the strike frame),
the body walks home with no pop. Sky Tackle over 3 tiles — the flying kick
carries the body onto the landing tile and the hit lands on clip time 0.50,
the moment it arrives. Both curves are measured from the clip's first frame
(Thrust_Slash opens a step off its rest pose), and a one-way clip's curve
reaches 1 ON its strike frame (the kick connects at half its glide).

**Tests:** new-clips.test.js (slot table → bake → tween → battle → relay,
plus the curve maths); spell-body.test.js (a verb's fallbacks need SOME eager
slot now); anim-strike.test.js pins the MAL3 clip names and durations.

## THE 3D LINE's VFX + FRACTAL STITCH — 2026-09-25, local delivery (token 20260925-bugfix-02-cors)
battle.js fires `beam` with `fromZ` (caster level) + `tx/ty/tz` (the aimed body). three-vfx-effects.js
`_fireBeamMapped` turns them into world points (`_worldTorsoAtLevel(tx, ty, level)`: the renderer's own surface
for the unit AT that level, so a flyer over a grounded unit is its own body) and extrapolates caster → aim to the
last cell; `_spawnLaserBeam3D` takes `opts.startW / opts.endW`, the muzzle / terminus / lights (`_crBeamExtras`
`o.mz / o.iz`) follow, and a beam ending in the air drops its ground ring and burn groove. The generic damage
`beam` travel passes `fromZ/tz` too. **Fractal Stitch** = `EFFECTS.raceFractalStitch_beam` (`beamZigzag`) →
`_sigFractalStitch3D`: one thin lit laser segment per hop (caster → each victim's body in line order → the end),
95 ms apart, arcane palette, the last hop shakes; no backdrop. battle.js sends `beamPath` [{x, y, z}]; online.js
relays it with z. The special renderers (breath, tsunami, boomerang, gatling, sword wave, bow) are unchanged.

## THE LOOK — the per-spell animation pick (2026-09-26, Spell Library Phase 2, token 20260926-spell-library-03-cors)
Three row fields pick the caster's clip, read FIRST by sprites.js `classifySpellAnimKind` (skipped by
`opts.rulesOnly` / `opts.noPick`): `animVerb` (a `SPELL_ANIM_KINDS` entry = a `_castChainFor` kind; an unknown verb is
ignored), `animSlot` (a raw `UAL_SLOTS` slot; the kind string becomes `'slot:<slot>/<autoKind>'`), `animClip:
{ name, lib }` (an unwired library clip → `'slot:clip:<name>/<autoKind>'`). Only the KIND STRING travels
(`state._castAnimKind`), so three-renderer.js `_castChainFor` decodes `slot:` to `[slot, ...chain(autoKind)]` — an
unknown slot simply falls down the chain (`_maybeStartModelAnim` walks it). `'clip:<name>'` is a SYNTHETIC slot:
data.js `stampSpellSchema()` (boot + every editor apply) calls sprites.js `registerSpellAnimClips(defs)`, which
writes `{ clip, lib, defer: true }` into `_UAL_CLIPS` and every per-race `libClips` copy; the bake key ignores
`clip:` keys so a late registration never re-bakes a model — `_libBakeSlotNow(modelEntry, def, slot, cb)` bakes the
one slot on demand (the board's cast site warms it through `_castClipWarm` before the play; the viewer through
`EWCharViewer.playClip(name, lib)`), and `_libDeferCbs` listeners now stay alive after the deferred queue drains so
every live rig wires the late clip. `clip:` slots play once like casts. `animStrikeMs` overrides the strike lead
in battle.js (`_releaseCastSprite`'s hold and `_castClipTravel`) and the viewer's `_cvStrikeMs`. Dev reads:
`ThreeRenderer.devLibClips(cb)` (every library's raw clip list), `ThreeRenderer.castChainFor(kind)`,
`EWCharViewer.slotInfo(slot)` (clip · lib · ts · trim · strikeAt · strikeMs · playedMs · travel · baked),
`EWCharViewer.libClips(cb)`; sprites.js exports `UAL_SLOTS`, `SPELL_ANIM_KINDS`, `EW_ANIM_LIB_URLS`,
`spellAnimLibName(i)`. check-spell-presentation.js reads the pick through the same classifier (a `slot:` kind
leads with its slot; a `clip:X` slot reports clip X). Online: the pick is a def field on the caster's def and both
peers classify locally — nothing to relay. Test: spell-anim-pick.test.js.

## THE MASK on the board (2026-09-26, Spell Library Phase 2)
`aoeMask` (`[[dx,dy],…]`, ±3, fixed on the board) wins over every radius / shape field at the engine sites of
SPELL_LIBRARY_PLAN.md §6.1: battle.js `_spellMaskOf` / `_spellMaskTiles` / `_spellAoeReach` (above
`getSpellAoeArea`; the reach = the mask's Chebyshev bound, else the radius fields — rings, cameras, terrain deform
and the real-time converter size by it), `getSpellAoeArea` / `getCrossArea` first line (so doSpell aoe / cross, the
glow tiles, `_selfNovaHasTarget`, `findAoeCastCenterForTarget` — which now also runs the centre picker for a HOLLOW
mask —, `_findSelfNovaApproachTile` inherit it), `_spellGlowTiles` (a generic first branch, so bombs / zones /
cleanse / aoePull / delayed light the mask), `previewSpellRange`, `_focusPlatesForAction` / `_focusPlatesForImpact`,
cleanseArea, aoePull, aoeShield, zoneDebuff / zoneHeal (the zone stores `aoeMask`; `_zoneTiles` / `_zoneCovers`
serve the round tick, gravity, smoke concealment and the chain zones), terrainCreate `squareFlood`, teleport
`aoeOnArrival`, skySlam and leapStrike splash loops, delayed strikes (`_delayedSpells` carries `aoeMask`; state.js
`_detonateDelayedSpell` reads it), deployed objects and `_newBomb` (`aoeMask` on the object; `detonateDeployedObject`
/ `detonateBomb` read it). three-vfx-effects.js `_maskTileOffsets` overrides the tile offsets of `_fireAoeMapped`,
`_fireDescent` and `_fireAura` from `params.aoeMask` (battle passes it) or the def. ai.js `getSpellAoeAreaAI` /
`_crossFootprintAI` / `_aoeTilesAI` / `_aoeSplashTestAI`; hud.js `_hrlgSpellShape` (X, ring, diamond, round now draw
their true cells), the rack's ring aim, `crossArmHits`; party-builder.js `pbAoeTiles` and map.js `_hqAoeTilesHtml`
draw the mask; data.js `_mfEffectiveTargets` prices it by tile count, `describeSpell` names the shape ("in a ring
area"), `stampSpellSchema` stamps `_aoeBound`. Test: aoe-mask.test.js. Everything rides the state snapshot as plain
data — never a function or a unit object on a zone / delayed / deployed entry.

## THE FREE `spell` (2026-09-26 bugfix, token 20260926-bugfix-03-cors)
Phase 2's `animStrikeMs` read `spell` inside battle.js `_releaseCastSprite(unit, holdMs)`, which has no `spell`. Every 3D cast released by the camera's source-hold threw a ReferenceError inside `_execAction` / the AI's `safeAction`: the VFX played, no damage landed, the AP was refunded and the AI stalled. `triggerCastAnim` now stores the row's strike ms in `state._castAnimStrikeMs[unitId]` and the release reads that. Test: spell-anim-pick.test.js runs both functions in a sandbox. The same sweep (eslint no-undef over the game scripts) fixed `getSpellPower` (never existed) in the teleport arrival blast and ui.js's bare `_hlCellMap` on keyboard Enter.

## THE COMBAT CLARITY PASS (2026-10-01, token 20261001-clarity-01-cors)
mondo: range and damage tiles were the same red; Eject / Nimble Dodge showed no landing; Gravity Well's preview was wrong; damage estimates were "nowhere close".
- **One forecast.** battle.js `forecastSpellPlan(caster, spell, x, y, z, {castFrom})` reads a cast the way doSpell resolves it (same targets, raw damage at mid / min / max of the roll, same hit options, same movement) and returns `{ handled, hits:[{unit,dmg,min,max,lethal,blocked,heal,tags}], moves:[{unit,fromX,fromY,x,y,mode}], tiles, byId }`. Each hit goes through `forecastHitOnUnit`, which is applyDamageToUnit's early-outs + `_hitDamageMath(live=false)`: the math block was extracted out of applyDamageToUnit, and every side effect in it is gated on `live`. `forecastBasicAttack` is the doAttack roll. Bodies are moved for the read and put back. Kinds not in `_FORECAST_KINDS` return `handled:false` and the old estimators answer.
- **Shared pickers.** doSpell and the preview call the same functions: `spellPowerOf`, `escapeLandingTile`, `chargeLandingTile`, `rallyPullPlan`, `dashShovePlan`. `resolveForcedSlide({simulate:true})` now records `simSlams` (wall/unit crash damage) and the bowling-pin `chain`.
- **UI.** ui.js `forecastOnUnit` feeds `predictDamageToUnit`, `_estimateSpellDamage`, `getPreviewEffect`, and `getPendingDamagePreview`. `getPendingDamagePreview` now returns `all`, so every nameplate the cast reaches blinks. The armed intent badges are `_renderForecastBadges` (−dmg with min–max, LETHAL, IMMUNE/ABSORBS, SLAM/ANCHORED/GROUNDED). `drawForecastMoves(plan, caster, overlay)` draws one arrow, hologram and landing plate per moved body. It is used by the armed preview ('spellLanding'), the quick-menu hover ('actionPlanShove', cast from the move tile) and the move-then-cast approach ('spellApproachShove').
- **Fixes.** Gravity Well / aoePull: one step toward the AoE centre; the hud fallback used to pull 3 toward the caster. Escape now shows its landing. Dash lands ON the tile; it used to be shown beside the target. Line footprints use `lineSpellHeadingTo` + `lineBeamPlan`. The bomb blast is the mask or radius 1, not blastRadius. The line kinds' 8 lanes now paint as reach.
- **Palette** (`window.EW_PREVIEW`):
  - reach is an amber lattice (0xffa040, fill ~0.12);
  - hit is a crimson solid plate (0xff2a2a, fill ~0.78) with the new static `uInset` inner frame (shader dial, no motion);
  - the caster's own move is blue;
  - any other moved body is purple.
  Focus dim is 0.28 (was 0.4) while 'aoe' / 'actionPlanAoe' / 'spellApproachTarget' / 'telegraph' is up. 'attack enemy' candidates and the actionPlanRange / spellRangeElem / infoRange overlays dim too.

## THE FRAME GUARD — the action camera never loses a body (2026-10-05)
mondo: "the action cam completely misses the target" (Call of the Deep on a flyer; widespread: AoEs, flyers, casters and
targets at different heights, AoEs hitting units other than the clicked one). Root causes found:
- Inside the TPS cine rig (`camera._cineTps`) the pivot is `ground under camera._tpsSubject + camera._tpsHeadLift`
  (three-camera.js sync). **`elevZ` passed to `_cineBeatMove` / `_cineHardCut` is IGNORED there** — every "lean the focal
  toward the caster's height" in the action shots was dead code. Height in the rig = `_tpsHeadLift` (or `liftPx`).
- Many callers pass a bare `{x, y}` tile as the target (terrainCreate = Call of the Deep, zones, sky drops). `_unitElevZ`
  of a bare tile is the ground, so every beat framed the floor under a flyer.
- The AoE wide cut fitted frameTiles only (no heights, enemies only, and only when the caller passed them).
- Director primitives anchor at tiles with ground lifts (`cineLowTile` liftPx 0.4 tile, god shots, side dollies...).
The fix:
- **three-camera.js `_frameGuardSolve`**: while `camera._frameGuard` is set, after the beat's eye/look target is composed
  and before damping, it finds the smallest slide (screen right/up) + dolly back (bisection; all constraints linear) that
  puts every guarded point inside the letterbox (|ndc x| ≤ 0.86, |ndc y| ≤ 0.70), eye kept over the rig floor; a gaze
  that can't (looking up, floor-bound) is levelled to a gentle down-look first. Already-framed shots are untouched.
  `ThreeCamera.frameGuardState()` = what it did last frame.
- **battle.js `_cineArmFrameGuard`** (after `_cineHardCut`): phases — `cast` (the caster, chest→crown, until the cut),
  `travel` (nothing: bullet rides / sky watches keep their freedom), `hit` (every hit unit, shins→HP bar top, from
  max(cut, impact − 280 ms) to the shot end), `all` (tactical pan: caster + hits). Points are the RENDERED bodies
  (`ThreeRenderer.getUnitWorldPos`, new). Hit list = cast-commit forecast (`_cineNoteCast` now runs `forecastSpellPlan`
  at doSpell's commit, first shot of the cast only) + the shot's target/extraTargets/frameTiles + **every unit a
  damage/heal/status number pops on during the shot** (`_cineGuardNoteHit`, called from the floating-text layer).
  Armed in the offensive shot (both branches), support rig, self hero shot, dash cam and detonation cinematic.
  The stock pair reverse cut + OTS drift set `keepCaster`.
- `playOffensiveActionCamera` resolves a bare tile with a visible unit on it to that unit (before anything else).
- The AoE wide cut frames all hit units with their real heights (pivot `liftPx` at the group's vertical middle).
- The pair reverse cut leans the TPS pivot (not elevZ) toward the caster's height; `cineLowTile` rises to a raised body.
- Online: `opts.frameUnitIds` (written back by the host) rides the `offensive` camera event; the guest's live hits come
  off the relayed floating numbers. Probe: `_ewFrameGuard()` in the console.

## THE MOVING LAVA (2026-10-05)
mondo: "the lava is not moving like the water or the poison tiles are". Cause: `_buildFluidTopMat` gave water and the
tinted bogs the caustic web / glints / swell on the shared fluid clock, but lava only the two scrolling wave sheets (sheet 1
is lava.png scrolled over lava.png, barely visible). On WebGPU the sheet offsets were per-object uniforms, which a static
render bundle never refreshes, so lava in a bundled room stood still. Fix: lava gets its own world-space flow on the clock
(`_EW_LAVA_GLSL` + the `D.lava` branch of `_ewNodeFluid`: warped glowing channels, crust, pulse, emissive), and the node
twin scrolls every liquid's sheets from `U.ftime` × `_FLUID_DRIFT_3D` instead of the per-object offset uniform.
Covers map lava (tile boxes, HQ room sheets) and spell lava (the field skins).

## THE STANDING STONES + THE SHOT CLOCK (2026-10-07, mondo)
- Rampart (and every `monument` wall spell) lifts units: `placeSpellMonument(mon, { liftUnits: true })` (map.js) no
  longer refuses a tile with a unit on it; the piece stands and the unit rides up to its top (`unit:moved` emitted).
  Objective tiles take a piece too (mondo: "we can change the terrain on objectives"); solid props, `wall` tiles and
  existing monuments still refuse. `canPlaceSpellMonumentAt(kind, x, y, rot,
  liftUnits)` is the same check; battle.js `predictTerrainSpellChanges` uses it so the terrain ghost shows only the
  pieces the cast will really stand (the "preview said 4, got 3" report: a unit on the 4th tile was skipped).
- Field battles: `_fieldStrataBuild` reads a monument tile at its recorded floor (`state._monumentTiles`), so the
  invisible collision voxels no longer draw a raised block with cliff-faced sides under the stone. `_buildMonumentObj`
  stands the piece on the field cell's real top.
- The `cliff` terrain key draws rocks_5.png (sprites.js); cliff.png is unreferenced. mondo: removed everywhere.
- THE SHOT CLOCK (battle.js `_spellFocusLastShot`): a kind branch that only calls `_spellFocusCamera` (Prism Mirror,
  field bombs, runes…) finished at the 600 ms floor while the support shot + deploy director were still moving the
  camera; the soft reset's pull-back settle saw the camera busy and gave up, leaving the view parked low on the target
  tile. doSpell now holds finishAction until that shot's `totalMs`.
- Tree chop (doAttack's tree branch) costs 1 AP (`spendAP(unit, 1)`), no longer ends the turn. A choppable tree under
  the cursor glows (three-renderer.js THE TREE HOVER: emissive lift on that tree's own materials, restored on leave).
- THE EARTHWORK (later 2026-10-07, mondo: "go back to it just raising the terrain like a cube"): Rampart drops its
  `monument` (menhir) and raises the ground again (`terrainType: 'mountain'`, `terrainDeform` centerDelta 2). Units on
  the line ride up (applyTerrainDeform), objective tiles raise too (only `fieldCellFixed` refuses), the line length is
  still `_terrainSpellTileCount`. Field battles: `_fieldStrataBuild` faces a raised cell a spell repainted with its new
  terrain's sheet (`paintedSide`: Rampart = mountain stone, Snow Fort = ice), not the room bed. Walls of Camelot and
  Pyramid Protocol keep their brick / sandstone monument GLBs. The Rampart hit's rising spikes (`_capSpikes`) are now
  textured (`o.tex`, default rocks_1; Rampart passes mountain).

## THE ACTION PREVIEW MOTION (2026-10-13, token 20261013-actprev-01-cors)
mondo: "when i hover over jump towards or move towards, i wanna see the character preview actually walking to that
tile, it can be on a loop ... for a dash spell i wanna see the preview be an actual dash".
- three-renderer.js `showGhostUnit(..., { motion })`: the hologram PERFORMS the action on a loop instead of standing
  on the landing tile. `motion = { wps, kind, apexY, castSpell, attack, faceTo, afterTag }`; `wps` are the route
  arrow's tile waypoints (an `apex: true` waypoint makes `[a, apex, b]` one jump; a walk leg that climbs/drops more
  than 0.6 tile hops). Kinds: walk / fly / dash (runCharge) / leap (jump arc) / blink (cast, vanish, appear) /
  shove (hit clip, no turn). `castSpell` / `attack` play the board's own cast / attack chain on arrival.
- Model ghosts get their own AnimationMixer on the clone, fed the live unit's wired slot clips (`_ghostSlotClip`);
  the old bone-sync to the live idle is off for a motion ghost. Sprite ghosts slide on the same timeline.
- One shared loop clock (`_ghostMotionT0`, period = the longest ghost) keeps a cast's bodies in step; `afterTag`
  starts a body once that ghost has arrived (shoves wait on the caster). The ring + warning badge stay on the landing.
- Wired: battle.js move/jump/takeoff/move-towards hover, spell approach (walks then casts), approach shove, sky-throw
  landing; hud.js tile-menu Move Towards, chained Move Towards, move-then-cast/attack, shove guess; ui.js
  `drawForecastMoves` (plan.spell picks dash / leap / blink / shove) and `_showDisplaceGhost`. Viewer-local hover UI,
  nothing relayed (guest runs its own hover).

## THE SIGHT LINE + THE BODY FRAME (2026-10-14, token 20261014-sightline-01-cors)
mondo: spell shots sat "just low enough that i can see through the ground" (not underground) into the empty space under
the stage; and "units just not being centered framed for their spell animations, especially tall and short units".
- Cause 1: the TPS cine rig's only floor is a flat plane at the subject's footing. A low lens behind a caster put its
  sight line through raised columns (a step, a ledge, the platform at its back) or parked the eye inside one; the
  occlusion fade then ghosted the WHOLE column down to the board's base, so the frame looked through the ground.
- Fix (three-camera.js `_sightLineFloor`, cinematic TPS only, not Strike Mode): the eye cranes up until it sits
  `clear` over the solid ground under it AND the line to the subject's body (pivot ground + 0.6 × lift) clears the solid
  ground on the way (samples every ⅓ tile from 25 % out). Capped at 3.5 tiles of lift. A craned eye aims through the
  pivot; the frame guard inherits the raised floor and its slide is re-checked against the ground. Ground = battle.js
  `window._camSolidGroundPx` (first solid run from the base; bridges/ceilings/upper storeys over an air gap are not
  ground — the canopy cutaway owns those).
- three-renderer.js `_occHitFadeable`: a terrain column fades only when it rises past the subject's BODY CENTRE, not
  just its feet (a shin-high step stays solid ground instead of opening a hole to the void).
- Cause 2: every unit pivoted at its SHOULDER (0.8 × height) on a boom in tiles. Now `_cineTpsAnchor` pivots a unit at
  `CINE_BODY_LIFT` (0.58) × its height (faceCam passes `liftFrac` 0.92 for the head) and sets `camera._tpsSizeK`
  (`_cineSizeK` = height / tile, clamped 0.7–2.4); ThreeCamera multiplies the cine boom by it. Bare-tile and
  `liftPx` anchors keep K = 1.
- Only syntax-checked; not seen in game. Tunables: CINE_BODY_LIFT, the K clamp, SIGHT_MAX_LIFT_TILES.

## THE LOWEST LENS (2026-10-15, token 20261015-lowlens-01-cors)
mondo: Call of the Deep "goes low and i can see under the map, it does it at the very end". Measured with
playtest_spellcam.js (stadium, caster 6,7 → target 8,7): the capstone's pay beat (`cineLowTile` at the flooded tile,
pivot 0.4 tile, tilt 88) held the eye 0.5 tile over the floor looking level, half a tile UNDER the board's raised tops
(lowest eye vs board top −0.50 tiles), for the beat and the ~1 s hold after it. three-camera.js: a cine TPS eye never
sits lower than `CINE_MIN_EYE_TILES` (1.15) over its subject's ground, and THE SIGHT LINE also runs to every body the
frame guard holds (each pair's middle), not only the pivot. After: eye 1.15 tiles up, gaze 15° down, lowest eye +0.15
over the board top. (The probe needs today's three/addons served from npm copies: jsdelivr is blocked in the sandbox,
and its menu steps reach battle through window.applyPartyBuild + window.startMatch once ThreeRenderer loads.)

## THE SPLIT PANES (2026-10-16, token 20261016-splitpanes-01-cors)
mondo: "the entropy strike will show the same unit in the split screen instead of the different units on my team ... check
the combo attacks for the same bug". WebGPU only (`?ew_gpu=webgpu`); WebGL drew every pane right. Cause: THE RENDER
BUNDLES (W6). The battle room's holders are bundle groups, and a bundle replayed inside a split-screen pane drew another
pane's camera view: the strike's top quarters repeated the bottom ones, the combo's two halves showed the same caster.
Fix (three-renderer.js): `_ssRenderFrame` sets `renderer._ew_paneRender` while its panes draw, and `_ewBunSetup`'s
`_projectObject` draws bundle groups the classic way under it (as it already did for `_ew_sideRender`). Checked on real
WebGPU in the sandbox (stadium, krampus / nephilim / zombie / annunaki): before, combo = nephilim twice, strike = top
row copies bottom row; after, every pane frames its own unit; WebGL unchanged. Off (`?ew_bundles=0`) also fixes it.

## THE DEATH CLOSE-UP (2026-10-17)
mondo: "can we make the camera more closeup and centered on a unit when they die to see their death animation? and if
multiple units die like a double or triple kill then make it split screen like the combo attacks and entropy strikes."
- map.js `defeatUnit` → battle.js `playDeathCloseup(unit)` (after `ThreeAnim.death`). It opens the combo / Entropy Strike
  split rig (`ThreeSplitscreen.show(..., { owner: 'death', death: true })`) on the dying unit ~90 ms after the killing
  hit (so deaths of one hit open together). Every later death while the shot is up joins as its own pane (2 = halves,
  3 = thirds, 4 = quarters, max 4) with the combo pane chrome (`_ssqShowChrome`, muted: frame + name + race). One pane
  = no chrome, and the combat numbers stay up, projected through the pane camera (`_ssFloatCam`).
- The shot holds while any of its bodies still has a death tween (`ThreeAnim.isDying`, rigged = MODEL_DEATH_MS 1600
  on the warped clock), min 1.1 s, cap 4.5 s after the last death. `_waitForAnimationsThen` and the stall watchdog
  wait on `_deathCamLive()`, so the turn moves on after the body is down.
- Pane framing (`_ssRenderFrame`, `p.death`): eye 0.58→0.74 of the body height, aim 0.55→0.33 following the fall
  (launch deaths keep the aim and add 0.6 tile of room), plus a sight-line floor over every column between lens and body.
  A death pane keeps tracking after `dead` flips at 800 ms, until the body dissolves. The stand-off scales with the
  body height (0.6x-1.9x of a standard unit), so a gnome gets a tight shot and big winged bodies still fit.
- Graves / bone piles now wait for the death tween too (they used to pop in at 800 ms under a rigged body whose clip
  still had 800 ms to run). `ThreeSplitscreen.extend(ms)` re-arms the rig's self-kill each tick while the shot holds.
- Skipped: Strike real-time, no-visuals sims, camera off, a 2D cinematic up, during an execution (`_dcFinisherUntil`, the
  finisher IS the kill shot), and per unit when `_shouldCameraFollowUnit` says no (fog / concealment). A combo's own
  panes are waited on (≤1.5 s); a combo / Entropy Strike that takes the screen ends the death shot.
- Online: online.js wraps `playDeathCloseup` → relay `death-cam {unitId, style}`; the guest starts the death tween +
  slow-mo itself (it never ran defeatUnit, so before this its units just vanished) and runs the shot under its own fog.
- `startDeathTween` ignores a second call for a unit already falling. Kill switch: `window.EW_NO_DEATH_CAM = true`.

## THE DEATH HANDOFF (2026-10-18, token 20261018-deathglide-01-cors)
mondo: "after the death animation the camera should move from the dead body to the next position/action in one
continuous motion, not cut back abruptly to a wide shot". The close-up was a split-screen pane camera; hiding it showed
the battle camera wherever it had been parked (the attack's shot or the board view), a hard cut.
- battle.js `_dcEnd` hides the rig with `ThreeSplitscreen.hide({ handoff: { easeS, crane, pane: 0 } })` (`DC_HANDOFF`:
  1.1 s × actionMs, bow 0.12, lookLead 1.15, follow 0.22). three-renderer.js `_ssHandoff` seeds `ThreeCamera.seedPose`
  with pane 0's last eye, gaze and lens (new seed field `wy` = an absolute world eye height), so the first board frame is
  the close-up's last frame and THE SWOOP glides to whatever the battle camera is aiming at, read live (the next unit's
  turn pan, the rest of a spell). A lost shot (a combo / Entropy Strike took the screen) does not hand off.
- three-camera.js: crane `follow` (s) = the swoop lands on a damped copy of the ideal, so a target that snaps mid-glide
  bends the move instead of jerking it; THE LEVEL HORIZON: world up while a swoop runs (the tilt/yaw up vector rolled the
  seeded frame onto its side), the same vector once the gaze is the board's own.
- Viewer-local: the guest runs its own close-up from the `death-cam` relay, so it hands off the same way. Old cut:
  `window.EW_DEATH_CAM_CUT = true`.
- Sandbox check: the camera drawn each frame (ThreePost.render / renderPanes wrapped) had 0.00 tiles between the last pane
  frame and the first board frame, lens 32 tweening to 45, then a smooth pull-back to the next unit (seed stretched ×12 to
  see it at SwiftShader's ~1 fps).

## THE CLOSE-UP LOOK (2026-10-18, token 20261018-closelook-01-cors)
mondo asked why the death close-up looked crisper. It was the render path: `_ssRenderFrame` drew every pane through
`ThreePost.renderDirect` (the scene and a bare tone map), so the close-ups had no models' pixelation, no tilt shift, dither,
colour depth, mood grade, grain, CRT, vignette, AA or AO. On the node renderer they were also tone-mapped where the battle
frame is not. mondo: "i want it to match the rest of the battle ... it would get confusing having the closeups use
different settings".
- three-post.js `renderPanes(list, aim, mainCam)`: ONE pane (death, key) = the battle camera borrows the pane pose
  (`_camBorrow`/`_camGiveBack`) and `render()` draws a normal battle frame (same pipelines, AO, render objects, no new
  node pipeline). SEVERAL panes = each pane draws into its rect of a full-size half-float atlas (stencil kept for the
  team outlines), and the chain runs once on a quad of it in front of the borrowed camera (`_paneMode.composite`: model
  mask drawn per pane rect, `_ew_sideRender` so the quad's scene isn't the frame). The node atlas quad has flipped uvs.
- DoF band snaps to the screen centre (each pane aims at its subject); four-up widens the band to reach both rows.
- The bare scissored draw is kept only when there is no chain (post off, perf lens post off, chain loading) or
  `window.EW_BARE_PANES = true`.
- Sandbox checked WebGL (pmndrs) and WebGPU (node chain, pipelines stayed 1) with 1, 2 and 4 panes.

## THE TURN HANDOFF (2026-10-18, token 20261018-deathpace-01-cors)
mondo: "there is a pause after a death, like the camera will just stay on my unit while nothing happens before moving on
to the next unit's turn ... the closeup death animation fights the normal spell animation ... other spells where it feels
like there is empty space at the end". Watched in real VS-CPU battles with a timing probe (every _waitForAnimationsThen
poll logged with the gate holding it): after a kill the turn sat on (1) the death close-up until the body had FULLY
dissolved + 160 ms, then (2) on the decor tails, spell particles still fading, hit flashes, damage numbers and the
dissolving body (hasActiveAnims counted _floatTweens / _hitFxTweens / _deathTweens), then (3) a 160 ms settle, then (4) a
second wait in _continueBlitzWithUnit that hit the same tails again. The revealed main camera (the spell's last beat, or
the caster's overhead restore when AP is left) just sat there through (2)-(4).
- three-renderer.js: `hasBlockingAnims()` (walks, displacement, jumps, strikes, clip travel, projectiles, tethers) and
  `hasDecorAnims()` (numbers, impact fx, death dissolve); `deathTweenProgress(uid)` / `ThreeAnim.deathProgress(uid)`
  (0..1, -1 = not dying). hasActiveAnims is unchanged for other callers.
- battle.js `_waitForAnimationsThen` + `GAME.boardBusy`: blocking things hold as before; decor (`_decorLive`: hit/heal
  flash, hasDecorAnims, non-zone particles) may hold only `DECOR_TAIL_MS` 250 more (`_decorTailHolds`, one shared clock
  so the second wait does not restart it), then keeps fading while the next turn starts / the menu returns. Right after a
  death close-up there is no decor tail and no 160 ms settle (the close-up ends on its own beat). boardBusy now also
  holds the menu during the close-up (`_deathCamLive`), since the death dissolve no longer does.
- Death close-up: holds until every body is DOWN (`_DC_DOWN_T` 0.72 of its death tween, a rigged body lands at ~0.55
  and then fades), min 1.1 s, cap 4.5 s, then a 100 ms beat (was full dissolve + 160 ms). The dissolve finishes on the
  board view.
- Sandbox note: SwiftShader draws ~2 fps here, so absolute times in the probe are inflated (the VFX clock clamps dt to
  50 ms, the anim clock to 250 ms; the probe served un-clamped copies). The gate ORDER is what proves it.

## THE BODY ON THE FLOOR + THE CLOSE-UP LENS + THE KEY CLOSE-UP (2026-10-18, token 20261018-closeups-01-cors)
mondo, after THE TURN HANDOFF: "now the game cuts too fast away from the death animation, i want to see them laying on the
ground at least for half a second. also how closeup the death camera is, is how all closeup the camera should be for all
spells that have a closeup. also want a similar camera closeup for the finding a key animation".
- Body on the floor (three-renderer.js startDeathTween): a rigged death lasts its own knock-down clip (the death or
  hitLaunch action's clip length at its wired timeScale, clamped 450-2200 ms; else 880 ms), then the body lies still
  MODEL_DEATH_LIE_MS 650, then dissolves over MODEL_DEATH_FADE_MS 650 (tw.fadeAtMs). `deathShotDone(uid)` /
  `ThreeAnim.deathShotDone` = the dissolve has started. battle.js `_dcStillFalling` holds the death close-up until that
  is true for every body (min 1.1 s, cap 4.5 s, then a 100 ms beat), so the shot cuts as the body starts to fade.
- Close-up lens (battle.js): `CLOSEUP_LENS` {fov 32, dist0 2.6, dist1 1.85 tiles} is the death close-up's lens; the dual
  tech panes, the Entropy Strike team panes and the executioner cut-in now use it too, with `bodyScale` (stand-off by
  body height, as the death pane). The main rig's close-up beats use `CINE_CLOSEUP_DIST_TILES` (~1.54 tiles: the lens's
  mid-dolly distance × tan(16°)/tan(22.5°), same body size on screen through the 45° main lens, still × _cineSizeK):
  CINE_FACE_DIST_TILES (cast beat, self-cast hero shot, give beat, brace beat, lowHero), CINE_HIT_DIST_TILES (victim
  beat; pair shots still fit both), cineFaceCam, cineGlamCam. Wide framings keep their numbers: the over-the-shoulder
  cast two-shot (CINE_OTS_CAST_DIST_TILES 2.8), the 'sky' cast (2.8 + 1.6), the multi-victim wide (CINE_HIT_WIDE_TILES
  3.2), the charge chase (3.2 + 0.8). The frame guard still widens any shot whose bodies would not fit.
- Key close-up (battle.js `_playKeyCloseup`, from playKeySecuredFx, so the guest gets it off the 'key-fx' relay under
  its own fog): one full-screen ThreeSplitscreen pane, owner 'key', the close-up lens, `key: true` framing (frame height
  max(body, 1.3 tiles) so the key hovering at 1.05 tiles is in shot, lens a touch low looking up), for 2.15 s (the key's
  rise + hold). Turn loop, boardBusy and the watchdog wait on `_keyCamLive()`; a death that lands meanwhile takes the
  screen (_dcOpen treats 'key' like its own). Kill switch `EW_NO_KEY_CAM`.

## THE BANE FORECAST (2026-10-17, token 20261017-baneproj-01-cors)
mondo: "banes need to have a damage projection just like spells". battle.js `forecastBanePlan(thrower, itemKey, target,
{ castFrom })` reads a thrown bane (and the Entropy Grenade, which rides the bane throw) the doItem way through
forecastHitOnUnit: baseDmg + baneDmg on a type match (no roll), magic, no mark bonus, the bane's own `typeEffect`; the
grenade's splash hits every other body in the blast (allies and the thrower too, own team with no source). Same plan shape
as forecastSpellPlan; `baneForecastSpell(itemKey)` is the stand-in spell (kind 'bane') the UI reads. ui.js forecastOnUnit
routes kind 'bane' to it, so the HP-bar slice (getPendingDamagePreview, armed + quick-menu hover), the hover HUD
(getPreviewEffect), the board badges + crimson plates (updateAoePreview → _updateBanePreview, `baneThrowTarget` = doItem's
column pick + reach) and the hud.js item target drum / enemy quick menu bane rows all show the real number. Badges judge
SUPER EFFECTIVE from the bane's type (h.superEff), never the thrower's. `window._ewBaneThrowUntil` holds the preview off
while a throw animates (host doItem + guest online.js wrapper). Browser-checked: Tech Bane and grenade previews matched
the real HP lost exactly.
## THE RISE (2026-10-17, mondo: "it feels like the wall just instantly snaps there. its supposed to rise out of the ground smoothly")
Cause: terrain spells (Rampart's `terrainDeform`, battle.js `applyTerrainDeform`) change the height in one step and the
next `rebuildTerrain` drew the new block at full height; there was no tween. Fix (three-renderer.js, render-side only, so
host and guest both see it from the height change itself; RULE #2 needs no relay): `_riseDetect` (start of
`rebuildTerrain`) compares each cell's height to the last build; cells that came up (in battle, at most max(24, a third
of the board), so map loads and big reshapes don't animate) get a rise record `{id, lv, t0, dur 650 ms}`, eased out. The
rising parts start sunk by their new levels and climb back: tile boards move each new tile mesh (`_ew_riseBaseY`, kept
out of the merged terrain while it moves) and `_deltaPatchBuild` rising patches; field arenas build `_fieldStrataBuild`
tops/faces and `_fieldSkinBuild` painted sheets of rising cells into their own groups (faces of static neighbours use the
old heights so nothing pokes up early). `_riseTick` (every frame) moves them; a unit standing on a rising cell rides up
(`unitSurfaceY` subtracts the sink; units mid-walk/jump/strike are left alone). Lowered cells snap as before. Checked in
the sandbox: Fairy Forest arena (WebGL + WebGPU) and Göbekli Tepe tile board (WebGL), unit riding the wall. Off:
`window.EW_NO_TERRAIN_RISE = true`; `window.EW_RISE_MS` sets the duration.

### THE NUMBER IS THE HERO (2026-10-17, mondo: tags covered the damage number; corner total easy to miss)
- three-renderer.js `_layoutFloatTexts` runs every frame on the showing pops (screen space). Numbers (`_buildFloatTextCanvas`
  isNumber → `c._ewHero`) are placed first, newest keeps its spot, older ones cascade up; word tags (WEAK!, HIGH GROUND!,
  BACKSTAB!, SUPER EFFECTIVE!, every `label` kind) are lifted until their ink clears every number in their column, always
  ABOVE it. Lifts snap up, ease down. Collision uses the ink box (`c._ewMarginX/Top/Bot`), not the padded canvas.
- Numbers never wait; tags wait `FLOAT_TAG_LEAD_MS` (110, warp clock, so they land after the hitstop releases the number)
  plus the per-tile stagger. Numbers ×1.12 on screen and live ×1.25; tags ×0.8 (levelup/laststd/nexus/achieve keep full size).
  Floor: number ink ≥ 6.5% of screen height, tags ≥ 2.7%, number ≤ 15% (`FLOAT_MIN_*` / `FLOAT_MAX_HERO_H`).
- battle.js `_hitReadDress3D`: the CRIT stamp sits on the number's top-right shoulder (it used to cover the last digit).
- Action-cam TOTAL DMG (battle.js `AC_TALLY_HOLD_MS` 1400 per hit, `AC_TALLY_LINGER_MS` 1400 (was 1700; turn clock stays hidden until it fades) after the bars leave via
  `.dmg-linger`; settle pulse `.land`). CSS: bigger figure on a dark plate, label above. online.js: the guest rolls its own
  corner total from relayed `-N` hit pops (data.hit / dmgAmt) and `+N` heal pops.

### THE TRUE STRIKE AREA (2026-10-18, mondo: "tsunami only shows a single line for its damage even though it does damage to more tiles than that, please fix it and any other spells like it")
- Cause: battle.js `lineBeamPlan` returned only the spine `cells`; every preview (ui.js getSpellAoeFootprint, the cast glow
  `_spellGlowTiles`, forecastSpellPlan `plan.tiles` → hud quick menu) painted those, while `_applyLineDamage` also sweeps the
  side lanes (`getLineSpellLaneOffsets`). Now `lineBeamPlan` also returns `laneCells` + `tiles` (spine + lanes, deduped) and
  every preview paints `tiles`. Affects Tsunami (3 wide), Empty the Clip (3), Plasma Cannon (2). Browser-checked in the Spell
  Lab: live showed row 4 only while the dummy on row 3 took 294; fixed shows all 3 rows.
- battle.js `spellStrikeTiles(unit, spell, tx, ty)` = the hit tiles of kinds whose area is neither the aim tile nor a plain
  shape, read with the doSpell branch's rules: barrage (combatDist reach: a radius-1 nova is the full 3×3, not a plus;
  wet-only novae only the wet tiles), a dash that hurts (path, or Giant Stride's dashSweep swath), leapStrike/skySlam
  shockwave (Seismic Leap), teleport aoeOnArrival (Void Rush). Used by the aim footprint, the glow and plan.tiles.
- ui.js showSelfCastAoePreview: self-centred aoePull (Crowd Surge / Round Up drew nothing) and zoneDebuff/zoneHeal/aoeShield
  (Exhaust Cloud, Iron Dome: squares, the wash drew a diamond) use the true footprint. Glow: bomb = 3×3 (detonateBomb).
- hud.js quick menu paints `plan.tiles` whenever the forecast hits more than one tile. Drive-By's afterShot victim gets a plate.
- **How to apply:** a new multi-tile hit rule in doSpell needs its tiles in spellStrikeTiles (or lineBeamPlan for beams).

## THE GAME HAS THE BOARD — no tile highlights while the game plays out (2026-10-18, battle.js + three-renderer.js)
mondo: "when the game is taking over and user input does nothing, i do not want the attack range highlights to show on
hover ... i dont want to see any tile highlights during a spell animation, except for the gold anticipation highlight, but
even that should be gone right as the spell actually hits, i shouldnt still be seeing it during a death animation".
- battle.js `isGamePlayingOut()`: action executing, walk, a unit the viewer does not control acting (CPU / online
  opponent / autoPlayers; skipped in simul, strike RT, lockstep), cinematic, death / key close-up, a dying unit.
- three-renderer.js `_syncTakeoverHighlights()` (renderFrame, after `_syncSelectedTileMarker`): while playing out (above,
  or a walk/strike/projectile/shove/jump tween, or a live action glow) every highlightGroup child hides except
  `_ew_overlay` actionGlow / zone / weather. While the hover is not the player's (that, camera auto-move, centre banner,
  `_hoverCursorSuppressed`) and until a real mouse move / wheel (`_hoverWaitMove` latch), the cursor, the selected-tile
  brackets, the `enemyRange` wash and the unit hover ring hide. Visibility only (`_ew_ctlHid`), nothing relayed.
- Action glow: no actor (caster) tile any more; `actionGlowBurst` ends the glow (80 ms fade, no white-hot flash, no
  afterglow); a burst with no live glow lights nothing.
- Browser-proved (headless VS-CPU, mouse parked on units, frame sampler on highlightGroup): main showed the hovered
  unit's ring + range wash during the CPU turn, and range tiles, AoE, cursor, white caster tile and the gold glow through
  the death close-up; after: zero stray highlights in CPU turn / move / killing spell, hover back after a real move.

## THE TARGET STAYS — whole-screen spell layers never hide the target (2026-10-18)
mondo: "for spells whose vfx change the whole screen like lump of coal there shouldnt ever be a time where the target
becomes invisible and i just see nothing at all on the screen. the target is the main priority for a damage spell
animation ... lump of coal doesnt even need one, its just supposed to be santa clause throwing a lump of coal".
- Cause (browser-proved): VoidStage's `.void-veil` was one solid sheet of the palette at opacity 1 for the bloom in
  (~0.5 s) and out (~0.5 s) — a flat black frame on abyss / shadow / hearth / starfield. And `cineVoidEnter` hid every
  scene child but unitGroup + lights: the spell itself (projectileGroup, hitFxGroup, floatTextGroup, the fxBatch
  particles, every three-vfx-effects group) and the `unitLights` group vanished for the whole void.
- Lump of Coal: its `_voidBeat('hearth')` sequence is gone (the strike family shoots it); sprites.js SPELL_ANIM_VERBS
  `throw` += raceLumpOfCoal (castThrow OverhandThrow — Santa's basic-attack throw). The `hearth` palette stays (unused).
- The veil is a quarter-res 2D `<canvas>` now (same gradient), with a soft hole cut around every actor's body
  (battle.js `_cineBodyHoles` ← three-renderer.js `ThreeRenderer.unitScreenBox(uid)` = body centre + drawn height in
  client px), redrawn every frame while up (`_veilRun`), so the face cam cutting in under it keeps the target clear.
- `cineVoidEnter` keeps: projectileGroup, hitFxGroup, floatTextGroup, _laserBeamGroup, `_ew_fxBatch`, `_ew_fxPool`
  (three-vfx.js sprite/world/quad/glob pools + the quarks root), anything stamped `_ew_vfxAt` in the last 6 s
  (three-vfx-effects.js `_vfxAdd(parent, obj)` wraps every `scene.add`; three-lightning.js bolts) and light-only
  subtrees (`_voidLightsOnly`). Older effects (a burning tile, a zone) still leave with the world.
- Whiteout grade + the kill pop (`.acam-flash.pop`): white AROUND the target — `_cineStampFocusHole()` writes
  `--cine-hole-x/-y/-rx/-ry` on #game-viewport (CSS radial gradient, clear core). `_sigScreenFlash` (three-vfx-effects)
  reads `window._cineFocusScreen()` the same way. Focus = the unit on the cast's aimed tile (`_cineCastCtx.tx/ty`), then
  the forecast hits, then the unit under `camera._tpsSubject` (the guest path); none → the frame centre.

## THE SIDE LANE + THE HOVER SINK — beam height (2026-10-20, token 20261020-beamh-01-cors)
mondo: Plasma Cannon from a caster on a raised block at a flyer about the same height fired "at like a high angle
pointed up ... it needs to take the heights of both the caster and the target into account". Cause: Plasma Cannon is
2 wide; a flyer in its SIDE lane left the spine tile empty, so `_worldTorsoAtLevel(tx, ty, tz)` fell back to the raw
level — the flyer's logic z, 0.65 of a tile over where the renderer draws it (`_flyVisualY` hover sink). Block 1 high,
flyer 2 over the ground one tile out: 45° up (browser probe), now 19° = caster torso → the flyer's drawn torso.
Fix: battle.js passes `ax/ay` (the aimed body's tile; online.js relays them) and `_fireBeamMapped` takes the aim
height from that body; `_worldTorsoAtLevel`'s no-body fallback applies the same hover sink (1.35 floor, −0.65) to a
level in the air. Covers every 3D-line beam (spine aims were already body-to-body) and Fractal Stitch's air end point.

## THE GORE — blood + four ways to die (2026-10-20)
mondo: "make it more realistic and brutal and over the top like a mortal kombat finisher. and when a character dies
there should be lots of blood. Is there more than one death animation that can be used to spice things up?"
- DEATH CLIPS: the five library GLBs hold four clips that end on the floor: MAL1 `Dead` (the old `death` slot),
  MAL3 `BeHit_FlyUp` (`hitLaunch`, already the heavy close-up kill), UAL2 `Hit_Knockback` (new slot `deathKnock`,
  flung flat on the back, ts 0.75) and UAL1 `Death01` (new slot `deathCollapse`, knees go, ts 1.3). Both new slots
  are `defer` (baked after load); an unbaked slot falls back to Dead. MAL3 `Gunshot_Reaction` / `Slap_Reaction` and
  MAL1 `Fall3` do not end down (or start in the air) — not deaths. The per-character Meshy `Knock_Down` spares only
  play on their own rig, so they stay unwired.
- The pick: battle.js lethal hit → `state._deathStyleById[id]` = 'launch' (physical, adjacent, heavy, as before),
  else random 'knock' / 'collapse' / 'dead' (ranged physical weights knock ×2). Rides state-sync + the death-cam
  relay. three-renderer.js `_deathSlotFor(entry, style)` maps it (the 'death' state, startDeathTween's land time).
  `_wireSlot` treats every slot starting with 'death' as one-shot.
- BLOOD (three-vfx-effects.js `fireBlood`, rewritten): battle.js passes `fromX/fromY` (attacker tile) + `unitId`.
  Exit spray thrown AWAY from the attacker (±43°), gouts, a little back-spatter at the attacker, mist, chunks on
  crits, a splat (+ directional `blood-spatter` marks on big hits) under the body. Every glob carries
  `floorAt/onLand` (three-vfx.js): it ends where it hits the floor (tileZ per tile, cached per effect; off-board
  never lands) and leaves a splat there sized by the drop — the floor keeps the spray pattern 9 s (kills 15 s),
  `opHold` keeps it full strength till the last quarter. Kill = the finisher: burst + gouts + dark gibs, a 4-wave
  geyser from the head, an ARTERIAL PUMP (16 beats × 150 ms, weakening) read off the dying rig's own neck bone
  (`ThreeRenderer.unitBoneWorld` → `ThreeVFX.worldToVfx`; no rig = the tile, the wound sinking), spatter thrown
  along the blow, and a pool spreading under the hips (`sizeEaseOut`) once the body is down. A lethal DoT tick
  gets the kill blood too (no aim). EW_PERF_LOW thins counts ×0.55.
- PERF: batched mode draws the globs through 4 InstancedMeshes (one per lumpy variant, `_globFlush` in
  `_batchFlush`, instanceColor + the aEwOp opacity hook, `_ewNode fxop` for WebGPU) — pool 256 (was 64 plain
  meshes = 64 draws). EW_NO_FX_BATCH keeps the old 64 meshes. Particle records = 512 + 256 (the stains live in the
  world pool); stains are `decor`: a full pool recycles them first.

## THE FALL FROM THE AIR — midair deaths (2026-10-22)
mondo: "if a unit dies in the air their blood splat stays floating in the air, please fix. Consider a separate death
animation and blood for units that die in the air since they would have to fall to the ground too". Display only: no
fall damage, no rule, no sound.
- The floating splat: three-vfx-effects.js fireBlood put every floor mark (the splat under the body, the spatter, the
  kill's pool) at `unitSurfaceZ`, the BODY's height: a flyer's / Levitating unit's hover, a climber on the face. That
  also floated the marks of every plain hit on a flyer. Now the wound stays at the body and the floor marks go on the
  floor: `unitGroundZ` (ThreeRenderer.unitGroundY = the surface the unit would stand on if set down, the floor of its
  own air pocket); a mark that lands on another tile uses that tile's floor (the stainer's floorAt). The no-rig pump
  sinks to the floor, not the hover.
- The fall: three-renderer.js `_deathFallArm` (from startDeathTween, or the first frame no walk / jump / throw / strike
  / clip-travel tween carries the body) compares the body's drawn height with the floor under it; more than 0.15 tile
  up = an AIR DEATH (`tw.fall`): the `fall` slot (MAL1 Fall3, the flail the knock-offs play) while gravity drops it
  (ease-in, AIR_DEATH.g 8.5 tiles/s², 320-1100 ms; a climber slides off the face to its tile centre), then on the floor
  the crumple `deathCollapse` (UAL1 Death01, the knees go; Dead while that slot is unbaked) whatever style battle.js
  picked, then the usual lie + dissolve. The tween's fadeAtMs / durationMs move by the drop, so the death close-up
  (which follows the group) rides the fall down and holds until the body has lain on the floor. Sprite units drop the
  same way, then flash and shrink where they landed.
- The blood where it lands: on touchdown the renderer calls ThreeVFXEffects.fireBloodLand(uid, x, groundY, z): a
  splash thrown low all round (heavier along the blow), the impact splat, spatter flung out from it, and the kill's
  pool spreading under the hips 450 ms later. fireBlood's own pool skips an air death (`ThreeRenderer.deathFallOf`).
  The landing splash only follows real kill blood (`_bloodKillAt`, set by the killing_blow fireBlood), so whatever
  gates the gore gates it too.
- Online: nothing new is relayed. The guest's own renderer runs the death tween (death-cam relay / state-sync), sees
  the same body height over the same floor and drops it the same way; its landing splash follows its fog-gated
  fireBlood replay. Kill switch: window.EW_NO_AIR_DEATH (the old in-place death; the floor-mark fix stays).

## THE GRAVES HOLD STILL (2026-10-21, token 20261021-graves-01-cors)
mondo: "gravestones and the bone stack dont show consistently or will disappear and then reappear within the same turn".
Display only; who gets a grave, where, and what raises/loots it are unchanged.
- Cause 1, the fog gate: graves were deployables keyed to their tile with no owner, so `_applyFogVisibility` showed them
  only while the tile sat in live vision. Vision is LOS over the whole board and is recomputed every time a unit moves,
  the blitz turn passes (a Blind/Jammed unit's solo vision), or the intro's all-tiles view ends, so graves blinked in and
  out. With the fog grid hidden (Video setting) there is no fog box to explain it. Repro (SwiftShader, Proving Grounds
  VS CPU, fog on): an enemy bone pile went shown -> hidden -> shown inside round 1; after the fix it shows once and stays.
  Now: your OWN fallen carry `_ew_depOwner` (always shown, like your own deployables); enemy remains carry
  `_ew_graveKey` ('<viewer>|<id>|<x>,<y>') and stay shown once that viewer's fog pass has seen the tile (`_graveSeen`,
  renderer-local, nothing synced; pruned in `rebuildDeployables` when the grave is gone: respawn, raised, new match).
  An enemy that dies out of sight still leaves no visible pile until you see the tile.
- Cause 2, the bone GLBs: a pile built before femur/ulna/skull streamed in is an empty marker (NO STAND-INS), and the
  load only flipped `_objectsDirty`, which rebuilds objects, never deployables, so the pile stayed empty until some other
  deployable changed. The load callback now clears `_lastDeployableSerial`, and `_buildBonePile3D` asks for all three
  files up front (a skull already cached by the unholy-wastes horizon skull used to skip the femur/ulna requests).
- The deployable serial also hashes `_dyingX/_dyingY` (the tile the grave is built on) and the grave/bones look per
  viewer (a hot-seat viewer swap now rebuilds it).
- Online: the guest runs its own fog pass, so its memory is its own; no relay or state field needed.

## THE WALL SPELLS' TILE COUNT (2026-10-21, mondo: "The combat log reading 0 tiles converted is a bug i already brought up about the ice queen ... find it, it is clearly a bug that exists")
- The hands-on playtest logged `Homosapien uses Pyramid Protocol! Converted 0 tiles to mountain.` while the blocks went
  up. Cause: battle.js terrainCreate, a `monument` row (Pyramid Protocol, Walls of Camelot) returns from
  `_paintSpellTile` before painting, so `convertedTiles` is always empty and the cast line (which still read
  `convertedTiles.length` for monuments after PR #385) always said 0. Reproduced in a browser on Mount Shasta Arena.
- Fix: for a monument row the cast line is written by the placer block, after `placeSpellMonument`, and counts the
  footprint tiles a piece of this wall's kind stands on (a recast on a standing wall still says 3, like ice recast to
  ice since PR #385). Ground spells (Flash Freeze, Permafrost, floods) keep the PR #385 count. Log order: the cast line
  now comes after the fire / reaction lines for a wall spell, right before the "🪨 N pieces of wall stand" line.
- Flash Freeze swept again in the browser (Mount Shasta, Haunted, North Pole arenas: fresh tiles, recasts, water,
  cliffs, three ways of passing the aim height): every count matched the board. Its 10-20 zero was the already-ice
  case PR #385 fixed.

## THE G-O SIGNATURES (2026-10-23, mondo: "think of each race as its own JRPG or Dark Souls boss" — the VFX pass on PR #433's families)
- Every race spell from Gargoyle to Overlord (ids `go*`) plus the four moved into race families (Fee Fi Fo Fum
  `raceTitanStep`, Atomic Breath, Labyrinth Roar, Excalibur Strike) has its own look: one block in three-vfx-effects.js,
  "THE G-O SIGNATURES", above THE SHEET WARM. All procedural (MeshBasic / Sprite / Line materials, the canvas glow + text
  sheets, the particle sheet), so both renderers draw it; no new art, no sound, no full-screen layer (the only flashes are
  `_sigScreenFlash`, which leaves the hole round the target). Spell rules untouched: the SPELL_MAP rows only pick tracers.
- How each look is reached (read off a real cast per kind):
  - `_GO_SIG[id]` — drawn on the staging `burst` beat (`_fireStage` → `_goStage`), which every kind fires at the real
    impact. The caster tile comes from the windup beat (`_goCast`), so a teleport / charge still aims from where it began.
  - `_GO_LAND[id]` — ranged spells with a bolt row (`_go_bolt_<id>`, `goBolt: true`, `boltGeometry`): the look draws where
    the bolt lands (`_goLandFn` in `_spell3DGeometry`), so random-target extra shots (Things That Go Bump, The Whole House
    Shakes, Stack Overflow, Every Eye at Once) each get one. A spell in both tables draws once per tile: `_goClaim` lets the
    first of burst / bolt own the tile for 3 s.
  - `_GO_THROWN[id]` — the bolt carries a real object (hatchet, atlatl spear, devil's coal, the gauntlet, the Noisy
    Cricket's gun + blast, the gem spray, the ghost's flying furniture, the eye-stalk eyes): `_goBolt`, hooked in
    `_fireBoltMapped` after High Noon. Skipped on `hideGunRig` and when the caster's tile is fogged.
  - `_GO_BEAM[id]` — line spells, hooked in `_fireBeamMapped` before the boomerang/breath branches: Rainspout, Tripod Sweep
    and Antimagic Gaze return 'own' (the look replaces the laser); Atomic Breath's hook charges the kaiju's dorsal plates
    and falls through to its breath cone.
  - aoe kinds get a `_go_aoe_<id>` row (a faint themed tile wash) in place of the generic aoe() burst; One Shot, One Kill
    keeps its bullet sprite and draws on its impact; Labyrinth Roar's aura geometry is now the maze floor + nostril steam
    + its old sonic rings. Excalibur Strike keeps `_sigExcalibur3D` (already Arthur's own sword).
- Fog (RULE #2): online.js relays fire(), and the guest's own fire() draws every look. A caster the viewer can't see is
  never drawn from: `_goCasterFor` falls back to the target's own tile (no direction or position leaks); thrown objects
  don't fly out of a fogged tile. online.js now relays `hideGunRig` too, so the guest also skips the gun / bow /
  thrown prop on a shot the host fog-clamped (Codex review on PR #445).
- Probe: `node --check`, then all 85 spells cast back to back in Chromium (SwiftShader) with no `[VFX] G-O` / `[SIG3D]`
  errors; before/after stills on WebGL in /mnt/project-files/g-o-vfx/. Real WebGPU (`?ew_gpu=webgpu`) booted and cast
  12 of them with no VFX errors, but headless SwiftShader WebGPU draws a black canvas (same on main), so the WebGPU
  renderer's stills were taken on its WebGL2 backend (`?ew_gpu=webgl2`, same node materials).
- Follow-up (same day, coordinator: redo the spells that went off camera): 27 spells had only had their beats fired in
  the first stills run. Seven were the probe's fault (the range-2 spells were aimed 3 tiles out; Grotesque Dive and Out
  of the Loch need the caster above the target, the existing leap rule), and 20 came after the gnome's Lawn Ornament
  left the caster in Stoneform. Reshot with the units staged on screen (leaps from the stadium's raised 0-1 columns).
- Solid props are no longer flat cut-outs: `_goM` marks its material `goSolid`, and `_goAdd` bakes a fixed light into
  vertex colours (`_goBake`: top lit, sides and underside darker). Still MeshBasic, so both renderers draw it the same.
- Underfoot's sole is now a hairy foot (an extruded footprint, five toes, a furred shin) and it fades to see-through
  160 ms after it lands, so the hit and the numbers under it show. Giant's Hand has a rounded palm, capsule fingers and
  a wrist; Clay Crush's slabs are rounded clay; Emet's plates are clay coils; Tissue Sample's probe and vial and the
  Cordyceps stalks are bigger so they read at board zoom.
- Real WebGPU does run here (team memory sandbox-webgpu): with the Vulkan / SwiftShader adapter flags and the
  `createView` swizzle strip it drew the whole battle with no device loss. Ten of the reshot spells have before/after
  stills on it in /mnt/project-files/g-o-vfx/webgpu-real/; that run is what showed Giant's Hand's wrist as a log end,
  so the forearm now runs up and back out of shot.

## THE A-F SIGNATURE VFX PASS (2026-10-23, mondo: "are we good to go ahead and start on the vfx pass?")
- Scope: the 66 A-F race signature spells (`sig*`, PR #432) and the 11 PR #423 spells (`race*`: Open Vein, Arterial
  Spray, Conduction, Thornlash, Overgrowth, Crosswind, Eye of the Storm, Mudslide, Tailwind, Far Sight, Rustle).
  Visuals only, no data.js row changed. G-O (`go*`) and P-Z (`pz*`) had their own threads on the same file.
- Where: three-vfx-effects.js, one block after `_crTagShards();` (search "THE A-F SIGNATURE VFX PASS"): the `_AF`
  palette, `_af*` helpers + canvas textures, an EFFECTS recipe for every row (tile / center / bolt / burst), the
  SPELL_MAP rows, a `_af*3D` piece per spell and one `Object.assign(_spell3DGeometry, …)` registry at the end.
- Which hook each kind fires (read off a browser probe of all 77 casts): damage → bolt + impact; physical r≤2,
  chargeToTarget, tackle, debuff → impact; aoe/cross → aoe (_fireAoeMapped already runs the piece with (tx, ty, aoeRadius): do NOT also set `geom3D: true`, fire() would build it twice);
  warCry/buff/self barrage/zoneDebuff → aura (its look = impactCenterEffect, piece gets (tx, ty, aoeRadius));
  line/linePush → beam; damage via a bolt def → the piece runs on arrival only with `boltGeometry: true` (no impact intent follows a bolt; the six-gun has its own `_bolt_af_bullet`); a chain hop def with `sigChainGeom` runs it on the first body (Twisted Wish), and a chain with nobody to jump to calls `<id>:solo` from battle.js; lifeDrain → drainHop + impact; terrainCreate → bolt + impact (do NOT map `wall`); pull → pull.
- Two new doors in three-vfx-effects.js: fire('pull') runs the registry like impact; a beam def with `sigLine` runs
  the piece with (fromX, fromY, hitTiles, params) before the laser, and `sigLineOwns` makes it the whole travel (the
  piece lands the per-tile recipe itself — Forged Thunderbolt, Crosswind, Mudslide).
- Kinds that fired nothing get visual-only doors in battle.js through `_sigVfxGeom(key, x, y, r, extra)` →
  fireGeometry (relayed by online.js, fog-gated on the guest): `<id>:swap` (Fireman's Carry, Infernal Waltz),
  `<id>:throw` (Fifty Times), `<id>:deploy` OWNER ONLY (Jack-in-the-Box, Hologram: a trap / decoy must not give itself
  away), `<id>:detonate` (detonateDeployedObject), `<id>:mark` OWNER ONLY (Orbital Strike, Extinction Event at cast)
  and `<id>:view` (Far Sight, falls back to the tarot card). A delayed row's end-of-round blast runs its plain id
  (state.js gives 1100 ms of arming before it lands). Pull now passes fromX/fromY; Rustle joins the lasso tether regex.
- Multi-hit rows (Six-Shooter, Thousand Stings, Piledriver, Organ, Engulf, Last Dance, Devour, Interrogation,
  Overrun) build their big piece once per cast (`_afOnce`), the small recipe on every hit.
- Fog: `_afFogHides` (same test as the G-O block): a caster the viewer can't see is never drawn at or from — `_afCaster`
  aims from the west of the target instead, caster-side pieces (six-gun, lure stalk, grapple steam, Last Light, the
  circlet, the tether radio rings, the love-ray laser) skip, owned lines land only their visible tile recipes, a swap
  skips a fogged spot, Soul Harvest's souls just rise.
- Nothing full-screen; big sprites stay additive and modest so the caster, target, hit and number read.
- Checked: all 77 cast in a browser sweep (no errors); 35 pieces shot close-up on WebGL, the WebGPU renderer's WebGL2
  backend and (12) real WebGPU; sheets in /mnt/project-files/signature-vfx-af/. The sandbox draws ~1 frame a second, so
  a `_sigRun` piece (opacity ramps from 0) gets one or two ticks before it ends: shoot with the clock slowed (a probe-only
  copy dividing `performance.now() - t0` by 10-20) and frame it with `playOffensiveActionCamera(caster, target)`.

## THE P-Z SIGNATURE VFX — each P-Z race's own spells get their own look (2026-10-23, mondo: "are we good to go ahead and start on the vfx pass?" after PR #429's families)
- three-vfx-effects.js, block after END THE CAPSTONES ("THE P-Z SIGNATURE VFX"). Every `pz*` row plus Heat Vision
  (raceLaserBeam, the superhero's since PR #429) has its own EFFECTS recipe and a 3D signature in `_PZ_SIGS`.
  Visuals only: no data.js row, rule, range, status or timing changed.
- THE HOOK, in fire() right after the def lookup: a def with `pzSig` runs `_PZ_SIGS[pzSig](params, spellId, intent,
  def)`; `pzOwn: true` returns after it (the signature owns the bolt / line travel: the coal, the vial, the pencil, the
  darts, the record, the trunk, the tendrils, the eye beams). `pzOwnTether` on a pull def: battle.js asks
  `ThreeVFXEffects.ownsPullTether(id)` and skips the rope / vine tether (the tongue, the field lines, the voice draw the
  line and follow the dragged body via ThreeRenderer.getUnitWorldPos). Quickdraw = geometry key `pzQuickdraw:dash`.
  Justice Is Served keeps the bullet bolt + revolver rig (`_SIG_GUN_FOR`) and adds the gavel (not owned).
- Per race: seraphim (live coal + tongs, six-winged seraph over three fire pillars), succubus (rose drain tube, the
  heart that breaks), skeleton (vertebra spines, the clock that strikes twelve + waltzing skulls), shadow entity (the
  hat man behind the victim, shadow people in the corner), reptilian (forked tongue, the mask peels off), skinwalker
  (whisper line + hex sigil, antlered skull + the peeled-off outline), siren (drowned ship's wheel, breaker on a reef),
  robot (horseshoe magnet + field lines, hydraulic hazard plates), swordfighter (hairline cut that opens red, 26 cuts
  in the air), shaman (hide drum + smoke spiral, robed elders that sweep in), telepath (TV-snow head, rings + vein
  sphere that bursts), priest (vial + gold cross, sign of the cross + light shaft + feathers), police (searchlights,
  light bar, laser dots, chalk ring; slam + cuffs + crack), popstar (ring of press cameras, gold record + equalizer),
  sharkman (jaws in a blood cloud, fin circling then two bites), sidekick (comic "!" burst + floor chevrons, comic
  hit bursts), tree person (roots into the soil, a whole tree falling down the lane), sheriff (WANTED poster nailed in
  the air + gold crosshair, gavel), starfish (tube feet, a five-armed starfish that curls and squeezes), professor
  (paper with a red X torn in two, a spear-size pencil + flying exam sheets), wizard (counter-sigil shatters the rune
  disc, curving arcane darts), superhero (a small sun that flares, twin heat-vision beams + scorch), yeti (blizzard
  rings + ice crystals, snow drift burst + icicles), santa (snow globe dome that frosts and breaks, chimney that
  blows apart in soot), symbiote (three writhing tendrils, goo strands + white eyes), valkraye (golden chain ring,
  Bifröst road + sweeping wings), watcher (the eye that opens + gold rays to seen enemies, the eye + light lance).
- Fog / RULE #2: everything rides fire() / fireGeometry() (relayed). Caster-side props (tongs, magnet, drum, mask,
  slit eyes, the Watcher's eye, the hero's sun, the sidekick's burst, the roots, the yeti's rings) draw only when the
  viewer sees the caster's tile (`_pzSeen` → window._isTileVisibleToViewer); the Watcher's rays only reach enemies the
  viewer can see. Basic materials only (MeshBasic / Sprite / LineBasic) so WebGPU draws the same.
- Big multi-hit signatures run once per cast (`_pzOnce`); per-hit pieces count hits (`_pzCount`).
- Screenshots: the cloud browser renders about 1 frame a second, so real-time shots miss every effect; the shots were
  taken on Playwright's fake clock (page.clock.install + fastForward per frame). Before/after on WebGL and WebGPU in
  /mnt/project-files/pz-vfx/.

## THE 2026-10-25 BATCH SIGNATURE VFX (chef, eagleman, flesheater, mime, mummy, swamp monster, undead)
The 21 signature spells of the seven races added 10-25 (PR #504 mm*/sm*/ud*, PR #505 nr*) each got their own look.
Visuals only, no rule changes, no new art (canvas textures + R2 terrain sprites). Code: three-vfx-effects.js block
"THE 2026-10-25 BATCH SIGNATURE VFX" right after the P-Z block, same hook (`pzSig` / `pzOwn` / `_pzDef`), helpers `_nb*`.
- Routes (which intent fires, probed in the browser): melee / physical r<=2 damage + debuffs = impact; magic r2/r3 damage
  = bolt (Flambé, Linen Bind, Embalm are pzOwn: the sig flies the bolt and spawns its own land); lifeDrain = impact +
  drainHop (Gnash, Eaten Alive); AoE = aoe (Curse of the Tomb, Swamp Gas, Death Rattle); single heal = aura on the ally
  (Taste Test, from battle.js _executeAllySpellAnimation).
- Stoop Dive (chargeToTarget) is mapped BOTH ways: the charge-first path (_runChargeToTargetSpell) fires impact, a cast
  from an adjacent tile fires bolt. Both are pzOwn.
- The impact intent arrives with the damage number, so melee pieces (pan, talons, jaws, punch, mud hand, claw) hit
  within ~100 ms of it. Marks/jaws/gloves offset toward the lens (`_nbCamDir`) so the body's depth doesn't hide them.
  Caster-side props (Flambé match, Eagle Eye glint) gate on `_pzSeen` (fog). No screen flashes anywhere.
- Proof: Spell Lab ✦ CAST for 20 spells; Taste Test can't be cast in the Lab (no ally), proved in a VS CPU match healing
  a hurt ally. Capture rig froze performance.now() at set delays after the intent. Stills: /mnt/project-files/new-races-vfx/.

## THE NATURE PASS (2026-10-25, mondo: "Can we make badass impressive vfx for nature spells like vines and stuff?")
Real vines, roots, thorns, leaves and flowers for the Nature Magic + Agriculture plant spells, plus the two new Nature
Magic rows (Vine Whip, Wrath of the Wild — rules in champions-combat.md "THE NATURE PASS"). Code: three-vfx-effects.js
block "THE NATURE PASS" just before THE SHEET WARM, helpers `_nv*`, same hook as the P-Z / 10-25 passes (`pzSig`).
- THE KIT: `_nvVine(parent, pts, o)` = a tapered TubeGeometry (`_nvTube` narrows each ring toward the tip) that grows along
  its curve with setDrawRange; thorns (cones) and leaves (canvas leaf planes) pop out as the growth passes them; optional
  sap-glow tip. `grow(k0, k1)` shows the stretch k0..k1 (k1 falling = pulls back from the tip, k0 rising = from the base).
  Roots wear R2 terrain/wood.png (`_nvBarkMat`), vines a canvas skin; light baked into vertex colours (`_nvBake`).
  Canvases: vine skin, leech skin, leaf, flower (pink / white / gold), druid sigil, torn-ground rupture.
- Routes (probed in the Spell Lab): Vine Whip = `pull` (pzOwnTether: it draws the line, battle.js skips the rope; the coil
  rides the dragged body via `_pzTrack(uid)`). Thornlash / Wrath / Leech Seed / Healing Seed = `bolt` (pzOwn). A pzOwn bolt
  skips _fireBoltMapped, which is what lands a bolt spell's impact recipe, so `_nvLand` lands the impact def (layers + its
  pzSig) at flyMs. Overgrowth / Entangling Roots / Bumper Crop = `aoe` (tiles from `_nvAoeTiles` = _buildTileOffsets +
  the cast's mask). Rejuvenation = `aura` on the caster (self-cast). Into the Green = `teleport` (pzOwn).
- Wrath of the Wild: the roots rise during the bolt's flight and crash at flyMs+50, so the crash lands with the number.
  If an impact ever fires without the bolt, `nvWrathHit` grows the roots itself (crash 300 ms late).
- THE TARGET STAYS: big roots/arches stand round or BEHIND the body (the side away from the lens, `_nbCamDir`; Wrath's
  roots between lens and body come down at the feet, thinner); coils are thin; no screen flash.
- Fog / RULE #2: everything rides fire() (relayed). Caster-end pieces gate on `_pzSeen`: Vine Whip's hand (a fogged
  caster's vine comes out of the ground at the sight line), Thornlash's racing brambles and Wrath's fissures (per tile),
  Into the Green's two thickets, Rejuvenation's runs to allies.
- Generic nature: `_THEME_MAP.nature` (leaf / vine-green) — nature had borrowed poison's bubbles. Staging got a `nature`
  archetype + grade (green, leaf motes, `noOrb: true` = no expanding orb shell on heavy nature hits; the roots are the hit).
  Without the archetype the staging fell through to the spellType (anomaly = pink dome).
- Old looks replaced: Thornlash's A-F brambles (`_afThornlash3D`, registry entry deleted), Overgrowth's A-F tile recipe,
  Into the Green's borrowed raceEject. Healing Seed keeps its heal aura recipe (+ a sapling), Leech Seed keeps its p3 impact
  recipe + capture cine (+ purple creepers that latch on). Trunk Throw and Herbal Remedy keep their own looks.
- Proof: Spell Lab ✦ CAST per spell, the capture rig freezes performance.now() at set delays after the intent.
  Stills: /mnt/project-files/nature-vfx/.
## THE EARTH PASS (2026-10-25, mondo: "can you do a similar thread on each element, giving them a consistent look or making them easily identifiable and making sure there's a nice amount of spells for each")
Every spell tagged earth (data.js `element: 'earth'`, 37 + Rockslide) shares one language. Code: three-vfx-effects.js block
"THE EARTH PASS" just before THE NATURE PASS, helpers `_ea*` (it borrows the nature kit's `_nvVine` / `_nvBake` / `_nvLeaves`).
- THE HOOK: `_fireStage` is wrapped (`_eaFireStage0`) so the windup / burst beats every spell kind fires run `_eaStage` after
  the stock beat — no SPELL_MAP row needed, the guest gets it off the relayed fire(). `_stageArchetype` is wrapped too: every
  earth spell stages as the new `earth` archetype (ochre, rock-debris motes, heavyLand dust skirt, noOrb) except dash /
  leapStrike / charge (kinetic slash stays) and the support kinds (gold aura stays). An explicit SPELL_STAGE_MAP / vfxArchetype
  override still wins; Calcify's override now says earth. `_THEME_MAP.earth` / `_ELEMENT_THEME.earth` = the generic fallback.
- THE TELL (windup, caster tile, only if the viewer sees it): amber fault lines open under the feet (`_eaCrackAt`, canvas
  `ea-crack` dark + `ea-crack-core` over-bright glow); a ranged spell lifts 4-7 rocks_5 stones round the knees (the ones
  between the lens and the caster hang low) that fly at the target on the release; a body spell (range <= 1, self-centred,
  dash kinds, self casts) kicks pebbles up instead.
- THE MARK (burst, `_eaMark`): fault lines on every struck tile (the windup's footprint tiles), stone spikes BEHIND the body
  (`_nbCamDir`, leaning out), stone shards, dust, a warm light; weight scales it (spikes 3/5/6/8, a shock ring on heavy+).
  No spikes when the spell's own look breaks the floor (`_EA_OWN`, the capstones' `_CAP_SIGS`) or it pushes / pulls the body;
  support kinds get the tell only.
- Stone: rocks_5 lifted with a colour over 1 (`[2.35, 2.0, 1.62]`, MeshBasic multiplies it into the dark sheet) = warm ochre
  grey; sand spells (id/name has sand / tomb) wear desert.png. Light baked into vertex colours (WebGPU draws the same).
- Own looks (`_EA_SIG`, burst): Tremor Stomp + Timber Stomp (a ring of stones heaves out from the caster), Ground Slam (two
  rings + a crater), Fissure (a molten seam races down the tiles, slabs slide into the gap the spell cuts, embers + lava light),
  Sandstone Tomb (sand swirl + five sandstone slabs: three tall behind, two low at the front corners), Quicksand (turning sand
  whirlpool, rings and grains drawn in), Petrify (three rings of grey spikes grow up the legs to the waist, then break),
  Rockslide (`_EA_CHARGE` raises a cliff behind the victim on the windup — `_eaCliff` holds until the burst calls crash();
  boulders tumble round the body, bounce, roll off). Earthen Grasp = `pull` `eaGrasp_pull` (pzOwnTether, battle.js skips the
  rope): five stone fingers ride the dragged body (`_pzTrack(uid)`), a ridge of stones heaves up behind it, the caster's fault
  line runs out to it. Timber Stomp borrows Tremor Stomp's tile dust row. Everything else keeps its own look + the language.
- Kill-switch: `window.EW_DISABLE_EARTH_PASS = true`.
- Proof: Spell Lab, the harness clock frozen at set delays after CAST. Stills: /mnt/project-files/earth-vfx/.



## THE ICE PASS (2026-10-25, mondo: "do a similar thread on each element, giving them a consistent look or making them easily identifiable and making sure there's a nice amount of spells for each")
Every ice-element spell now reads as ICE at a glance: a six-armed frost sigil on the ground, faceted crystal clusters that
grow and shatter, frost ferns, white glints and ice shards. Two new Ice Magic rows (Hailstorm, Glacier Break; rules in
champions-combat.md "THE ICE PASS"). Code: three-vfx-effects.js block "THE ICE PASS" right after END THE NATURE PASS,
helpers `_iv*`, same `pzSig` hook as the P-Z / nature passes.
- THE KIT: `_ivCrystalGeo` = a lathe crystal, flat facets (non-indexed), light baked into vertex colours (`_ivBake`), white
  additive edge lines + an additive back-face halo so the ice reads bright on any map; skin = R2 terrain/ice.png.
  `_ivRing` = a ring of crystals with lens-aware heights (crystals on the camera side stay short, `_nbCamDir`) so the
  victim stays visible. `_ivShards` = flat-shaded tetra shards with gravity + one bounce. `_ivDecal` = sigil / frost /
  crack canvases laid on the tile (renderOrder 160/161, above the team ground ring). `_ivMist`, `_ivGlints`.
- Signatures (8): Ice Spear (a real ice lance flies; ankle-grip crystals + frost on hit; the old iceSpear travel removed
  for it), Shatter (crystal shell round the target blows out at 210 ms), Flash Freeze + Permafrost (on their `wall`
  intent: crystals erupt per frozen tile, staggered like the tile conversion), Summon Blizzard (sigil + snow column),
  Diamond Dust (falling diamonds over the cross-diamond tiles), Hailstorm (hail crystals drop on every tile of the 3×3),
  Glacier Break (a crack races from the caster to the target, then great spikes tear up ROUND the body and shatter;
  impact is deduped so the bolt and impact never double it).
- THE ICE STAMP: every other ice spell (Frozen Punch, Freeze Breath, Absolute Zero, Snowball Volley, Grave Chill, Cold
  Spot, White Christmas, Blizzard Present, Avalanche Strike, Sleigh Dash, Ice Slide…) keeps its own look and gets the stamp
  on the staging `burst` beat: sigil + frost + a ring of 4+rank crystals that shatter (`_ivStamp`, rank = spell weight).
- Staging: the `ice` archetype now has `noOrb: true`, `glyph: false`, `iceSigil: true` — the windup draws the frost sigil
  and a growing gem toward the target (`_ivWindup`) instead of the glass orb, and the target telegraph drops its orb on ice.
  Non-physical ice rows whose kind fell to the rig/mind archetype are pinned to `ice` in SPELL_STAGE_MAP.
- Fog / RULE #2: all of it rides fire() intents (bolt / impact / wall / aoe / burst / windup), so the guest sees it.
  Glacier Break's racing crack is fog-gated per tile (`_pzSeen`).
- No screen flash, no full-screen layer: crystals stand round or behind the body, never over the number.
- Proof: Spell Lab ✦ CAST, capture rig freezes performance.now() + setTimeout at set delays after `burst`.
  Stills: /mnt/project-files/ice-vfx/ (ice_pass_overview.jpg). Console clean over every ice spell.

## THE FIRE PASS (2026-10-25, mondo: "do a similar thread on each element, giving them a consistent look or making them easily identifiable")
One fire look everywhere, plus signatures for the Fire Magic family and its two new rows (Flamethrower, Inferno — rules in
champions-combat.md "THE FIRE PASS"). Code: three-vfx-effects.js block "THE FIRE PASS" right after END THE NATURE PASS,
helpers `_fp*`, hooked from `_fireStage` (`_fpStage`) + the `pzSig` hook.
- THE FIRE MARK (`_fpMark`, on the staging BURST beat): every fire-element damage spell (`element: 'fire'`, `type: 'damage'`,
  any family / kind) scorches each tile it hits (char decal + glowing cracks + firelight), licks flame tongues up round the
  body (camera-facing additive planes, depth-tested; TALL on the side away from the lens, short in front, so body + number
  read), a second lower wave as the first blows out, embers and smoke. The tiles are the windup's footprint (`params.tiles`,
  cached by glowKey) — a line / aoe burns every tile it covers; a self-centred blast skips the caster's tile. One `_sigRun`
  per mark (the signature cap is 20), density drops past 3 / 9 tiles, 25 tiles max.
- THE CAST (`_fpWindup`, windup beat): fire-element MAGIC casts light a ring of small flames round the caster's feet and a
  fire gathering in the hand toward the target, embers drawn in. Physical fire (arrows, cannon, punches) skips it.
- The `fire` staging archetype is `noOrb` now: no glass orb on a fire cast / heavy hit; a heavy+ fire-archetype magic hit
  throws a ring of flame out across the ground instead (`bloom`; fire-named spells with no element get only that ring).
- Palette: kaiju atomic fire (raceAtomicBreath, goNuclearPulse) wears the same shapes in BLUE (`_FP_ATOMIC`). Skipped
  (`_FP_SKIP`): Lump of Coal (mondo: just Santa throwing coal), Morning Star (vfxElement light). Delayed artillery (Nuclear
  Option, Fire for Effect, Extinction Event) has no burst beat at cast, so it keeps its own landing.
- Signatures: Fireball = `bolt` pzOwn (a roiling ball: white heart, halo, six flame tongues streaming back, flame + smoke
  tail; `_fpBurst` at flyMs). Combust = `bolt` pzOwn (a heat thread, then `_fpCombust` at flyMs: a fire circle under the
  feet and a pillar of tall tongues at the back, embers fountaining off the top). Wall of Fire = the old wall recipe +
  pzSig `fpWallOfFire` (a 3D curtain ignites tile by tile along the wall, parts round a body standing in it, sits a little
  behind it from the lens). Flamethrower = `beam` pzOwn (a cone of crossed flame planes down the line from the hand + a
  stream of swelling fire blobs, smoke off the end). Inferno = `aoe` pzOwn (the fire circle burns out to the blast edge, a
  ring of fire races out, a firestorm spirals round the caster in a clear middle). Meteor keeps its rock + gets the mark.
- Fog / RULE #2: everything rides fire() / the staging beats (relayed; `tiles` is on the relay list); every mark tile and
  every caster-side piece gates on `_pzSeen`. No screen flash.
- Proof: Spell Lab ✦ CAST, capture rig freezes performance.now() at set delays after an intent. Stills: /mnt/project-files/fire-vfx/.

## THE PSYCHIC PASS (2026-10-25, mondo: "the nature spells look great now, can you do a similar thread on each element, giving them a consistent look or making them easily identifiable")
One look for every psychic spell (data.js element 'psychic', or vfxElement 'psychic' on a row with no element — 66 rows).
Code: three-vfx-effects.js block "THE PSYCHIC PASS", right after the TELEPATH P-Z signatures; helpers `_ps*`.
- THE SHARED LANGUAGE: the wind-up beat opens THE THIRD EYE over the caster's head (eye sprite with a black pupil,
  normal blend; brainwave rings ripple off the head; motes pulled into the eye; shuts at holdMs). Where the spell lands,
  THE MIND RINGS: three brainwave rings close round the head (hostile) or rise off it (a buff / shield / heal kind on an
  ally) and a small eye blinks over it. An aoe lays THE MIND SIGIL (eye in the triangle) first, rings on each body in it
  (enemies of the caster for a hostile cast, its allies for a buff). Utility rows with no damage (doors, teleports,
  Far Sight) get the eye only.
- HOOKS (no shared line touched): `fire`, `_stageArchetype` and `_beamColorFor` are closure bindings reassigned in the
  block (the export at the bottom reads `fire` after it runs). The rings key off the first LANDING intent (impact, bolt
  at flyMs, beam hitTiles, aoe/descent, pull with uid, chain, aura); the staging `burst` is only the fallback for a row
  that fired none (Psychosis's burst came ~1 s after its impact, so burst can't be the clock). One ring set per tile per
  700 ms. `_PS_OWN` = rows whose own signature draws the rings.
- COLOUR: `_THEME_MAP.psychic` / `_ELEMENT_THEME.psychic` (was 'anomaly'), `_BEAM_COLORS.psychic` wins over the row's
  spellType (alien rows had green beams), staging archetypes `psychic` / `psychicAid` (buff grammar) / `psychicHex`
  (debuff grammar), all `noOrb` (no glass orb on heavy hits), grades to match. A row with another vfxElement (Ascension
  Day = light), a vfxArchetype, a non-mind SPELL_STAGE_MAP archetype, or a heal stage keeps its own.
- SIGNATURES (Psychic Abilities family): Kinetic Hurl (bolt, pzOwn: rings race out, THE GRIP — three gyre rings — rides
  the thrown body, crash ring where it stops); Telekinetic Slam (pull, pzOwnTether: a beam out of the third eye, rings
  reel along it, grip + slam; battle.js skips the rope); Psychic Beam (beam, layered: `_psLance` pink lance + rings + mind
  rings on every body hit); Migraine (bolt, pzOwn: rings clamp the head, light cracks, three throbs, snap open); Mind
  Shatter (bolt, pzOwn: sigil, a great eye over the 3×3, the old `_sigMindShatter3D` cage on the centre, a glass shell that
  bursts into shards on every other enemy in it); Telepathic Link (aura, pzOwn: a thread from the third eye to each ally's
  head, an eye + rising rings on each); Mind Blank (new row; bolt, pzOwn: rings close, the eye goes white and shuts, a flat
  line, the rings hush out). pzOwn bolts land their impact recipe through the nature pass's `_nvLand`.
- Untouched looks (they get the shared eye + rings on top): every race signature (pz / sig / go / nr / door rows),
  Psychosis's brain, Psychic Barrier's dome, Far Sight's view.
- Proof: Spell Lab, the capture rig freezes performance.now() at set delays after an intent. Telepathic Link's threads
  were drawn by firing its aura with the dummy counted on the caster's side for one call (the Lab has no ally).
  Stills: /mnt/project-files/psychic-vfx/.

## THE METAL PASS (2026-10-25, mondo: "the nature spells look great now, can you do a similar thread on each element, giving them a consistent look or making them easily identifiable")
Metal rides 72 rows over 40-odd races (guns, blades, chains, hooks, machines), each with its own look already, so metal's
identity is a STAMP every metal cast wears on top of its own look. Code: three-vfx-effects.js block "THE METAL PASS" just
before THE NATURE PASS, helpers `_mtl*`. No rule or data change; no new rows (the spread was already healthy: 21 T1,
11 T2, 22 T3, 15 T4, setups and finishers on every tier).
- THE COG (`_mtlCog`): the ⚙ of the element badge, a brushed-steel gear (canvas, normal blend) + a lit rim (additive) on
  the ground that RATCHETS a tooth at a time. Small under the caster for the windup, under the target at the burst
  (as wide as an aoe's reach, `_mtlAoeR`). renderOrder 162/163 so it reads over the capstone sigil disc.
- THE HIT (`_mtlHit`, ONE signature run per hit, the 20-run cap counts runs): grinder sparks as real 3D streaks
  (additive rods along their velocity, stretched by speed, spawned on the lens side of the body, skip once off the floor),
  steel shards (R2 metal.png triangular plates, heavy+ only) that tumble, land and spark, and a small chrome glint star on
  the body's edge. Pool sprites were too small to read in stills, which is why the sparks are meshes.
- Hooks: `_fireStage` → `_mtlStage` (windup cog, burst stamp; a non-hostile cast — glowHostile 0 — gets cog + glint only);
  fire() impact intent → `_mtlSpit`; the bolt landing in the bolt tick → `_mtlSpit` (bolts never fire an impact intent),
  so every bullet / knife / hatchet that lands spits sparks. Throttled per tile (110 ms).
- Generic metal: `_THEME_MAP.metal`, `_ELEMENT_THEME.metal = 'metal'`, `_STAGE_ARCHETYPES.metal` (steel, noOrb, steel-spark
  motes) + `_STAGE_GRADES.metal` — metal used to stage as 'tech' (cyan plasma, read as lightning). All set from the
  METAL PASS block, not the tables, to keep sibling element threads' merges clean. Railgun keeps its own tech override.
- Fog / RULE #2: everything rides fire() (relayed); each end draws only where the viewer sees that tile (`_pzSeen`).
- THE TARGET STAYS: cog on the floor, small streaks flying off the body, glint at the edge (0.34-0.46 tile); no screen
  layer. Proof: Spell Lab casts frozen 200 ms after the burst; stills in /mnt/project-files/metal-vfx/.
- Seen while counting (NOT changed, flagged to mondo): Lockdown (T4) applies Rooted + Slowed, Cuffed (T3) applies Rooted,
  Dead Eye (T3) Marked, Shrink Ray (T3) Minimized — tier 3-4 rows that apply a status (none of them self-combo).

## THE WIND PASS (2026-10-25, mondo: "can you do a similar thread on each element, giving them a consistent look or making them easily identifiable")
Every wind-element spell (39 of them, data.js `element: 'wind'`) reads as wind; Wind Control's own spells get full looks,
plus the two new rows (Squall, Tornado — rules in champions-combat.md "THE WIND PASS"). Code: three-vfx-effects.js block
"THE WIND PASS" right after THE 2026-10-25 BATCH SIGNATURES, helpers `_wd*`, same `pzSig` hook as the P-Z / nature passes.
- THE KIT: `_wdRibbon(parent, pts, o)` = a flat strip along a curve wearing the streak canvas (`_wdStreakTex`: air lines,
  long fading tail, bright head), white-mint normal blend + an additive mint glow twin on the same geometry. A gust is a
  WINDOW sliding along it: `set(k0, k1)` = draw range + the streak's UVs stretched over that stretch (`_wdRun` runs it
  once). `op(v)` sets both materials. Widths ×1.7 inside the helper so the air reads at battle-camera distance. The
  ground sigil is `_wdSwirl` (four tapering spiral arms, glow twin child, opacity setter drives both).
- THE MARK (every wind spell, data-driven, so a new wind row gets it free): `_wdStage` rides `_fireStage` (the relayed
  windup / burst beats). Windup = `_wdGather` (two bands coil in round the caster, a small swirl under the feet; skipped
  for a delayed mark). Burst on a damage spell = `_wdMark` (three bands whip up round the body, the swirl spins out;
  an area adds four flat bands on the rim). `_WD_BURST` lists the spells whose own look owns the hit (false) or a
  custom burst (Updraft). Utility wind spells (Smoke Screen, Mist Form, Sprint…) carry the cast gather only.
- Routes (probed in the Spell Lab): Squall / Tornado = `bolt` (pzOwn; the hit lands on its own timer at flyMs). Gale /
  Crosswind = `beam` (pzOwn; route from `_wdRoute`, the same walk as _fireBeamMapped). Eye of the Storm / Vortex Slam =
  `aoe` (pzOwn; tiles from `_nvAoeTiles`). Tailwind = `aura` (pzSig on a copy of raceTailwind_aura, its tile recipe
  stays). Updraft has no intent: its column rides the burst beat.
- The looks: Squall = a spinning crescent blade of air, then grit whirling round the head (Blind). Gale = bands of air race
  down the lane, dust kicked up where the front passes. Crosswind = sand-laden bands crossing the lane in an X, a grit
  cloud left at head height. Tornado = a little whirl skims to the target and stands up into a twister (seven bands up a
  widening funnel, stone chips and dust going round), then lifts away. Eye of the Storm = a cyclone wall on the area's
  rim closing on a calm middle. Vortex Slam = bands spiral down out of the sky and slam flat into a ground gust ring
  (it wore the WATER whirlpool's tile recipe before). Updraft = a rising column. Tailwind = streamers running past the
  squad.
- Generic wind (no SPELL_MAP row) had borrowed the human theme (beige dust): `_THEME_MAP.wind`, `_ELEMENT_THEME.wind`,
  `_STAGE_ARCHETYPES.wind` (white-mint, crescents, `noOrb`) and `_STAGE_GRADES.wind` are set in the block (not inline in
  the tables, so the sibling element passes don't collide on those lines). SPELL_STAGE_MAP puts Gale, Crosswind, Eye,
  Squall, Tornado and Wing Attack on the wind archetype (their kinds sent them to kinetic / grapple).
- Old looks replaced: Crosswind's A-F flat ribbons (`_afCrosswind3D`) and Eye's A-F turning rings (`_afStorm3D`) — registry
  entries deleted; Vortex Slam's whirlpool tiles. Kept: Wing Attack's own aoe, Dust Devil's twister, Summon Sandstorm,
  the race signatures (Talon Rake, Stoop Dive, Ride to Valhalla, Host-Fetter, Twisted Wish), the arrows / balls / kicks —
  each now carries the wind gather + mark on top.
- Fog / RULE #2: everything rides fire() (relayed). The gather and the bolt flights draw only where the viewer sees the
  caster's tile; the lane gust starts at the first tile the viewer can see; the hit, the dust and the twister only on seen
  tiles. THE TARGET STAYS: no screen flash; the bands are thin and see-through, the twister narrows at the body.
- Proof: Spell Lab ✦ CAST per spell, capture rig freezes performance.now() at set delays after the intent. Stills:
  /mnt/project-files/wind-vfx/.
## THE WATER PASS (2026-10-25, mondo: "the nature spells look great now, can you do a similar thread on each element, giving them a consistent look or making them easily identifiable and making sure there's a nice amount of spells for each")
Every water spell (data.js `element: 'water'`, 39 with the two new rows) now reads as water. Code: three-vfx-effects.js
block "THE WATER PASS" after THE NATURE PASS, helpers `_wv*`, same hook as the P-Z / nature passes (`pzSig` / `pzOwn`).
- THE WATER STAGING (the look every water spell shares): `_STAGE_ARCHETYPES.water` + `_STAGE_GRADES.water` (blue,
  droplet motes, `noOrb`, `water: true`). `_stageArchetype` gives element 'water' the water archetype over the movement
  kinds (kinetic / grapple / rig / skyfall / mind: pushes, pulls, terrain spells); heals, buffs and hexes keep their own
  grammar. Before it, water spells staged as their kind or spellType (pink anomaly orbs + trip on heavies, gold grapple
  rings, purple rig glyphs). SPELL_STAGE_MAP.raceFlood went 'arcane' → 'water'.
  - Windup (magic casts): `_wvGather` — a wobbling ball of water with the water skin at the caster, droplets streaming
    in, a ring wheeling round it; bursts into spray at 72 % of holdMs (as the spell leaves the hand). Gated on `_pzSeen`.
  - Burst: `_wvMark` — THE WATER MARK on the target: a see-through crown sleeve with white tips at the feet, droplets
    thrown in arcs, two ripple rings and a dark wet patch. Every water hit ends on it, sized by the stage weight.
- THE KIT: canvases (water skin with a caustic net, wave face deep→white foam band, crown, ripple rings, whirlpool
  spiral); `_wvStream` = the `_nvVine` tube in the water skin; `_wvRunWave` = a curling sheet (`_WV_PROFILE`: back slope,
  crest, lip hanging forward) run down a lane, following the board height and hidden over tiles the viewer can't see;
  `_wvRingWave` = the same profile on a LatheGeometry; `_wvVortex` = spinning spiral disc + inner disc + a rim of water;
  `_wvGeyser` = an open column, skin running up, a foam cap throwing spray; `_wvDrip` = a soaked body dripping. The water
  skins share one clock (`_wvFlow`).
- Signatures (routes probed in the Spell Lab): Water Jet / Spout = `bolt` (pzOwn, Spout arcs high) + `impact` (drip);
  Maelstrom = `bolt` (whirlpool opens + 3 thin coils rise during the flight) + `impact` (coils close, a column rises
  BEHIND the body); Whirlpool (raceRiptide) = `aoe`; Water Pulse (sharedTidalSurge) = `beam` (the wave, waist high, 1 lane,
  see-through; it replaced the flat wave-1 sprite beam); Tidal Slam = `aoe` (ring wave out of the caster's feet); Call of the
  Deep = `wall` (dark whirl, black-water spikes behind the body, bubbles); Depth Charge = `aoe` (geysers per tile, the
  middle first, behind a body on an occupied tile); Poseidon's Wrath = `impact` (three columns behind the body like a
  trident's prongs, gold glints); Great Flood = NEW `wall` mapping (ring wave over the basin, a surge of spray on each
  flooded tile; the mapping makes battle.js skip its flat playAoeRing); Temporal Tide = its zone recipe + slow ripples
  and a lazy whirl (`wvTide`). Whirlpool / Tidal Slam / Depth Charge / Poseidon's Wrath / Call of the Deep replaced the
  generic `_water_impact_*` / halo-ring sprite recipes they wore.
- Untouched looks (they still get the water staging + mark): Tsunami (its own wall, _sigTsunami3D), the jellyfish, mermaid, siren, loch ness, starfish, deep sea
  fish, swamp monster, pirate, firefighter, gargoyle, priest, annunaki, atlantean signature spells, Constrict / Eightfold
  Lash / Tentacle Lash, Fluoride Water.
- THE TARGET STAYS: no screen flash of its own; crown low and see-through; columns / spikes / prongs stand on the far
  side of the body from the lens (`_nbCamDir`); coils thin.
- Proof: Spell Lab ✦ CAST per spell, performance.now() frozen at set delays after the cast. Stills: /mnt/project-files/water-vfx/.

## THE SONIC PASS (2026-10-25, mondo: "the nature spells look great now, can you do a similar thread on each element, giving them a consistent look or making them easily identifiable")
Every sonic-element spell (28 rows + Screech / Sonic Boom, rules in champions-combat.md "THE SONIC PASS") reads as sound
in one violet language. Code: three-vfx-effects.js block "THE SONIC PASS" right after END THE NATURE PASS, helpers `_sn*`.
- THE KIT: `_snRing` (a canvas ring over a dark ink rim, so it reads on a bright floor; `_snJagTex` = the thin zigzag of
  a LOUD sound), `_snCone` (rings leave A, travel to B and grow: the cone a voice makes), `_snRipple` (flat floor rings),
  `_snHum` (three rings round the body that shiver, can track a dragged body), `_snEq` (a crown of LED level meters
  BEHIND the body, one mesh per meter, the level = draw range). Pieces return tick(el); `_snRun` runs them in one
  _sigRunOwned. `_snLean` leans a lane's rings toward the lens: rings aimed straight down a lane that runs across the
  screen were edge-on slivers.
- THE STAMP (`_snStage`, called from _fireStage): the windup / burst staging beats fire for EVERY spell from its data,
  so all sonic rows get it with no per-spell wiring, on top of their own looks. Windup = rings out of the caster's mouth
  toward the target (a shout: hum + floor ring). Burst = rings through the body from the caster's side, floor + body
  hum, the meter on heavy / ultimate; self-origin rows (barrage, aoeOriginSelf, warCry) shout from the caster's tile.
  `_SN_FLAVOUR` per row: sung (notes), gentle (slow smooth rings), roar (jagged), discord (clash pink, broken notes).
- Generic sonic: `_THEME_MAP.sonic`, `_ELEMENT_THEME.sonic = 'sonic'` (was anomaly), `_STAGE_ARCHETYPES.sonic` (violet,
  noOrb, no glyph), `_STAGE_GRADES.sonic`, `_BEAM_COLORS.sonic`. `_stageArchetype` gives a sonic row 'sonic' whatever its
  kind, except support kinds (`_SN_SUPPORT_ARCH`: buffs stay gold aura, stat-downs stay the violet hex). Sonic
  Boomerang's SPELL_STAGE_MAP archetype kinetic → sonic (its grade kept).
- Own looks (routes probed in the Spell Lab): Discordance impact = two clashing jagged ring stacks (was the generic dark
  debuff); Siren Song = `pull` with pzOwnTether, a stream of rings + notes mouth → body for the whole drag (was the
  plain rope); Lullaby keeps its impact + slow rings settle over the head; Sonic Breaker beam (pzOwn, was a plain light
  band) and Shockwave Clap beam (its band kept) = `_snLane`: a ring tunnel down the whole reach + a jagged floor ripple
  per tile it crosses. A line beam sends fromX/fromY + dx/dy + range (no sx/sy). Crack the Whip / Screech / Sonic Boom /
  Requiem's per-target bolt = `snWave_bolt` (pzOwn: rings fly the path, `_nvLand` lands the impact recipe); Requiem's
  bolt was `_bolt_bullet`. Impacts: Crack the Whip + Screech = `snCrack` (a jagged ring snaps at head height), Sonic Boom
  = `snBoom` (jagged rings on three tilts + a floor slam). Barrage rows (Meow, Requiem, Shiver, Bellow) fire no
  aoe/impact intent: the stamp is their look.
- THE TARGET STAYS: thin rings, the meter behind the body, no screen flash. Fog / RULE #2: everything rides fire() /
  the staging beats (relayed); caster-end pieces gate on `_pzSeen(caster)`, hit pieces on `_pzSeen(hit)`; Siren
  Song's fogged siren sings from the sight line. MeshBasic / Sprite only.
- Proof: Spell Lab ✦ CAST per spell, capture rig froze performance.now() at set delays after the intent. Stills:
  /mnt/project-files/sonic-vfx/.

## THE POISON PASS (2026-10-25, mondo: "do a similar thread on each element, giving them a consistent look or making them easily identifiable")
Every poison-element spell lands the same mark: THE VENOM POOL. Code: three-vfx-effects.js block "THE POISON PASS", right
after THE NATURE PASS, helpers `_pv*`, same hook as the P-Z / nature passes (`pzSig` / `pzOwn`) plus its own `pvOwn`.
- THE MARK (`_pvSpill`): a lobed puddle of glowing venom with a violet rim (canvas `pv-pool`) spreads under each hit tile,
  bubbles (`pv-bubble` sprites) swell and pop (ring + droplets) again and again while it holds, fumes (violet smoke-soft +
  green poison-mist) curl off the FAR rim (`_nbCamDir`, never in front of the body), venom drips off a body standing on it.
  The black goo / ooze rows (`_pvIsGoo`: Goo status, ooze / blackoil / thebond families) lay it in black oil.
- WHERE IT RIDES: `_pvAuto` is called from fire() (impact / aoe / aura for self-origin barrages / beam = the line's tiles /
  chain / wall / pull = where the body lands, by `uid`, 420 ms later) and from the bolt pipeline's landing (`boltLand`), so
  spells with their own looks (bites, bees, tongue, gas, drains) keep them and gain the pool. Only element 'poison' rows of
  type damage / debuff. `_pvGate`: one pool per tile per 700 ms (multi-hits, bolt + impact). A def with `pvOwn` lays its own.
- THE HAZARD RING (`pv-sigil`): the three-lobed hazard mark inside a ring of drips and bubbles — Miasma (whole area) and
  Venom Burst (under the victim).
- Signatures: Miasma = `aoe` (ring, pools wave out over the 5x5, flat floor fog, plumes off the far edge); Rot = `impact`
  (rot patch, green veins via `_nvVine`, circling flies, pool 260 ms late); Acid Flask = `bolt` pzOwn (a lathe-glass flask
  lobbed end over end) + `impact` (glass, splash, steam, pool); Corrosive Splash = its old aoe recipe + globs raining onto
  each tile; Tendril Whip = `impact` (three symbiote tendrils behind the body); Venom Spit = `bolt` pzOwn (venom glob) +
  `impact` splat; Venom Burst = `bolt` pzOwn (dart) — the ring opens and the pool boils during the flight, six lathe venom
  jets erupt at flyMs+30 (the ones on the lens side, decided at the eruption, stay low and thin). Vivisection and Cadaver
  Claws got an empty `pvSeal_impact` mapping so the pool lands (Cadaver Claws keeps its G-O burst look).
- RULE #2: all via fire() (relayed) and the bolt landing the guest flies itself; every pool / glob / jet gates on `_pzSeen`.
- Proof: Spell Lab ✦ CAST + a capture rig that freezes performance.now() a set time after the first intent. Casts back to
  back with less than ~10 s between them sometimes come out in a wide "select a target" frame; space them out.
  Stills: /mnt/project-files/poison-vfx/ (before_after, new_spells, the_mark_on_other_spells + single frames).
