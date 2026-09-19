# FINISHER_PLAN.md — the over-the-top capstones of Entropy Wars

*Started 2026-09-18. The active plan for the finisher spells: what shipped,
the rules every finisher follows, the catalogue of the rest, and where they
live on the tree. Append to §7 on every finisher session.*

## 0. The brief (the user, 2026-09-18)

> Implement more crazy finisher spells that only a JRPG like Entropy Wars can
> do. Super over the top and dramatic and unrealistic. Throwing someone at the
> moon and then blowing the moon up. Throwing someone into the sun as it
> supernovas. A meteor storm. Massive explosion pyrotechnics. Pyramids
> descending from the sky and shooting laser beams. Volcanic eruption of lava.
> Huge tsunami from off the map floods the map. Sword slash that cuts the
> entire map in half, causes a trench. Portals opening in the sky and hordes
> of demons flying through. Crash a plane or two into the map. A ridiculous
> impossible ricochet shot that bounces off of a bunch of walls in the map and
> hits the target. Telekinetic powers lift up sky elements or landscape
> elements from the map directly and slam them into the target.

And the rule that came with it: **on a Δ map, raised terrain that means a
pillar or a wall is a Meshy 3D object** — a rock, a stone, a pillar, a column
— never a raised block.

## 1. The rules

**THE RULE CHANGED 2026-09-19 (the user): a finisher is NOT a capstone — it
is the full gauge's OTHER VERB.** "Instead of the finishers replacing the
capstones they should just be an alternative to the Entropy Strike. So the
player can choose to do a single target attack with one player or they can
choose to do a team attack on the entire enemy team. But yes that means we
will need completely unique finishers for every playable unit." So:

0. **A finisher is an EXECUTION.** ONE unit, ONE visible enemy, ~3× the
   strike's per-enemy slice (data.js `FINISHER_RULES`), the finisher's type
   judged by the chart (always one of the race's own types → STAB rides), 1
   AP + the WHOLE gauge (the gauge refills; the finisher comes back with
   it). Every race has a row in data.js `FINISHERS` (name · glyph · type ·
   tagline · desc · `sig`): `sig` names a BESPOKE director
   (battle.js `_FIN_DIRECTORS[sig]`) + VFX signature; `sig: null` = the
   race's finisher is DESIGNED (the row is the brief) and plays the TYPED
   EXECUTION of its type meanwhile (`FINISHER_TYPE_DEFAULTS`, the six
   apocalypse directors on one victim). The pipeline is battle.js
   `doFinisher` → `_finPlayCinematic` (the shared skeleton: the banner in
   the type theme with the FINISHER kicker, the executioner's single live
   pane + name slam, the director's charge / cam / stage / strike /
   resolve on FIXED timings, camera.save → restore) — never doSpell, never
   the tree, never the stock two-beat action shot. Online: the
   `doFinisher` engine game-action + the `finisher-cine` relay (the guest
   replays the same director with no applyHit). AI: ai.js
   `scoreFinisher` (a kill candidate per victim the execution would kill,
   the best non-kill otherwise, scored against the strike's own row).
   Simul: the `finisher` plan step. HUD: the ☠ row leads the ⚛ picker →
   the victim list. **Building a race's finisher = set `sig` on its row,
   a director in `_FIN_DIRECTORS` (chargeMs / strikeMs / resolveMs +
   siren · charge · cam · stage · strike · resolve), a signature in
   three-vfx-effects.js "THE FINISHER PASS 2" (one group through
   `_sigRunOwned`, timers through `_fxDelay`, exported), a row in
   finishers.test.js's BUILT table.** The capstone reworks below (§2, §3)
   stay what they are — spells on the tree — and are still worth doing for
   the races whose capstone IS the spectacle; but the finisher brief now
   lands in `FINISHERS` first.

1. **(superseded by rule 0 for new work) A capstone rework is a capstone.** It lives on ring 4★ of the race's tree
   (`RACE_TREE`, data.js), where `isCapstoneSpellId` already promotes it to
   the `ultimate` staging tier, the charged cast clip, the capstone bloom and
   the ~4.3 s two-beat shot. A race may carry TWO options on the node (a twin:
   `[a, b]` — the user does not mind; at most two, so a branch is eight spells
   at most), and `isTreeLoadoutLegal`'s one-capstone rule already keeps a unit
   to one of them. Prefer REWORKING the capstone in place (the id stays, saves
   keep working, the AI's kind scoring keeps working); add a twin only when
   the old capstone is worth keeping as a build (the general's Nuke ⇄ a plane
   crash).
2. **(built 2026-09-19 as rule 0 — no round gate, the gauge is the gate) The round-10 alternative to the Entropy Strike was NOT the first pass.** It
   would be a mode-level feature (a `FINISHER` row in the ⚛ picker, its own
   game-action + relay, AI scoring for a once-a-match verb, a Simul plan step)
   — twice the surface of a capstone rework for the same spectacle. Revisit
   it as "THE FINAL ROUND" once a dozen finishers exist on the tree; §4 has
   the sketch.
3. **One pipeline per finisher, in this order:** the data row (numbers,
   flags, `desc`) → the engine (only when a NEW flag or kind is needed; reuse
   `terrainDeform`, `paintTerrain`, `groundsFlyers`, `pushDistance`,
   `elevationFlood`, `skyThrow`, `delayed`, `aoePull` first) → the VFX
   signature in three-vfx-effects.js "THE FINISHER PASS" (every group through
   `_sigRunOwned`, every timer through `_fxDelay`, the rock bodies through
   `_finRockBody`) → the director in battle.js `CINE_SEQUENCES` (the shot
   grammar: `cineSkyWatch` / `cineFlyBy` / `cineFallFollow` / `cineSideDolly`
   / `cineFreezeFrame` / `cineSlowMo` / `cineInsert` / `VoidStage`) → the
   RULE #2 check (what does the guest see? — everything must ride `fire()` /
   `fireGeometry` / a relayed global; a helper called from inside a relayed
   global is NEVER also fired through `fireGeometry`, or the guest gets it
   twice) → a row in `finishers.test.js` → the CLAUDE.md line.
4. **The camera sells it — and a director OWNS it.** Every finisher gets a director; a director that composes its own shots calls `cineOwnShot(sequenceId)` (battle.js, 2026-09-19) so the stock two-beat shot's later beats (the cut to the victim, the drift, the VFX retargets) are skipped under it — the sky watch / fly-by used to be yanked back to a shoulder close-up mid-move (the user: "they look better with the action camera off"). High Noon and To the Moon own their shots now; a finisher verb (rule 0) never runs the stock shot at all. The beats that
   read: the sky watch for anything that falls or flies, a freeze-frame +
   whiteout on the impossible moment, a half-speed clock on the travel, the
   hard slam back to full speed on the hit. Keep the whole thing under ~5 s
   of real time; an ultimate's two-beat shot already gives ~4.3 s.
5. **Models before particles.** A thing the brief names (a moon, a sun, a
   pyramid, a plane, a saucer, a rock) is a GLB: `_WPN_MODELS` (the VFX file's
   own loader, `_wpnInstance`), or the renderer's misc cache through
   `ThreeRenderer.getMiscModelClone(key, size, 'center')`. A procedural
   fallback always stands in until the file streams — a finisher never
   plays empty on a cold cache.
6. **The board is the stage.** Read the live board for the choreography
   (the trick shot plans its bounces off `state.boardHeights`, the terrain
   and `state._monumentTiles`); change the board only through the engine's
   own flags so the guest's board matches.

## 2. Shipped (2026-09-18, delivery 1)

| # | Race · spell | What it is now | Engine | VFX | Director |
|---|---|---|---|---|---|
| 1 | cyborg · **To the Moon** (`raceRocketToss`) | the throw goes seven tiles into the sky, the moon drops into the apex, the body hits it, the moon shatters, seven pieces rain on the landing | `moonshot`, `moonArcTiles`, `carryHeight` 6 (skyThrow unchanged); three-renderer.js `startThrowArcTween` takes `arcPx` | `_sigMoonshot3D` (called inside `playSkyThrowFx`) | `raceRocketToss`: sky watch, freeze + whiteout on the crack, slow-mo, the fall |
| 2 | mothman · **Prophecy of Disaster** | a 5×5 mark; at the end of the round a METEOR STORM — two dozen asteroid GLBs, streakers across the sky, the big one on the centre | `aoeRadius` 2, `groundsFlyers` | `raceProphecyOfDisaster_descent` (`storm: true`) → `_sigMeteorStorm3D` | the descent grammar's `cineSkyWatch` (`playDetonationCinematic`) |
| 3 | cowboy · **High Noon** | the bullet ricochets 3–5 times off raised ground, walls, monuments and the board's rim before it hits — through any cover | `ignoresLineOfSight`, `travelMs` 1500 (the action camera honours a row's travel time), range 6 | `_sigTrickShot3D` on the bolt intent (the revolver rig still fires it) | `raceHighNoon`: the clock, the slam, a high wide `cineFlyBy` at half speed, the slam on the hit |

Also in delivery 1 — **THE SPELL-MADE MONUMENTS**: Rampart (three standing
stones), Walls of Camelot (crenellated castle-wall segments), Gothic Rampart
(cathedral wall) and Ziggurat Protocol (stepped blocks) stand real pieces
(`monument: { kind }` on the row → map.js `placeSpellMonument`) instead of
raising blocks; **THE ROCKS**: every thrown / falling rock (Boulder Hurl,
Stone Throw, Stonefall, the Meteor) is the D.O.O.R. kit's asteroid GLB.

## 3. The catalogue — the rest of the brief, in the order to build

Effort: S = VFX + director on an existing kind (a day's delivery of ~3);
M = one new engine flag or a two-click / multi-phase cast; L = a new kind or
a board-wide engine change. "Home" = the capstone it reworks (id kept).

| # | Brief | Home (race · spell, kind) | The design | Engine | Effort |
|---|---|---|---|---|---|
| 4 | Thrown into the sun as it supernovas | orb of light · **Supernova** (`raceSupernova`, aoe) | the `star` misc GLB descends over the zone as a sun the size of the 3×3, everyone inside is pulled up into it (`aoePull` + `groundsFlyers`), then it goes nova: `_sigSupernova3D` (exists) at 3× + a whiteout that holds a full beat, a bone-desat grade, the ground scorched (`leaveTerrain: 'scorched'`) | kind aoe → `aoePull` with `pullToCenter`, `liftVictims: true` (new: the pulled units ride a short `throwArc` up into the sun before the damage) | M |
| 5 | Pyramids descend and shoot lasers | annunaki · **Star Decree** (`raceStarDecree`, delayed) | three inverted pyramids (procedural `_hzModelPyramid`'s look rebuilt in the VFX file, tinted gold) lower out of the sky over the 3×3 at the detonation, hover, their capstones charge, three beams converge on the centre and sweep the zone (`_LT().strikeFromSky` for the crackle + a laser column each), the ground glassed | the descent def (`descentMs` 1800) + a `geom` hook; no engine change | S |
| 6 | The slash that cuts the map in half | king arthur · **Excalibur Strike** (`raceExcaliburStrike`, damage) | after the hit, THE WORLD CLEAVE: a line through the target perpendicular to the caster→target direction, edge to edge — every tile drops 2 (a trench, `chasm` where the base was 0), enemies on the line take half damage and Stagger; `_sigExcalibur3D` grows to a ten-tile blade sweeping the line, a wall of light, the board splits (the voxel version redraws the faces) | new `cleave: { deform: -2, dmgMult: 0.5, status }` on a damage row → battle.js `_runPostEffects` applies `applyTerrainDeform` per tile of `getLinePoints` across the whole board (`isObjectiveTile` / monuments / spawn tiles stand) | L |
| 7 | Portals in the sky, hordes of demons | demon prince · **Dark Dominion** (`raceDarkDominion`, aoe) | a portal ring opens overhead (the Shadow Realm palette), a horde of winged bodies pours through in a spiral (the `_sigUFOFleet3D` formation with the `demon_statue` misc GLB on wings, or a new demon sprite) and dives on every enemy in the zone one after another (per-enemy camera beats like the Entropy Strike directors), then the portal snaps shut | none (aoe) — the VFX takes `hitTiles` from the intent | M (the horde bodies) |
| 8 | Crash a plane or two | general · **Nuke** ⇄ NEW twin **Air Support Gone Wrong** (`raceAirCrash`, aoe, tech) — the general keeps the Nuke as a build | the F-22 GLB comes in on the flyover grammar (`descent.flyover` exists), clips the target tile and CRASHES: the jet tumbles down the missile-drop path (`_sigMissileDrop3D` with the `jet` GLB, tumbling), a fuel fireball, wreckage on three tiles (`paintTerrain: 'scorched'`), a second plane for the twin's r4★ cost | a new race ability row + the tree twin; the descent def's `crash: true` swaps the warhead for the jet | M |
| 9 | Telekinesis lifts the landscape | telepath · **Migraine** (`raceMindCrush`, damage) → **Mind over Matter** | the tiles around the CASTER (r 1) tear out of the board — the VFX clones each column as a cube in its own tile sheet (`_loadCachedTex(TERRAIN_SPRITES[key])`), they rise, hover in a ring round the caster's head, then slam into the target one after another; the board keeps the holes | new `deformAt: 'caster'` + `terrainDeform: { centerDelta: 0, edgeDelta: -1 }` on a damage row (today a damage row's deform lands at the target) | M |
| 10 | Volcanic eruption | golem · **Quake** (`raceQuake`, barrage) → **Eruption** | the target tile rises three (`terrainDeform: { centerDelta: 3, edgeDelta: 1 }` — positive deforms already work), lava paints the ring (`paintTerrain: { terrain: 'lava', radius: 1, rounds: 3 }` — the timed-terrain plumbing exists), a lava fountain (flame-hot columns + rock-debris + `_sigAsteroidDrop3D` lava bombs on the 5×5), the world's stability dips (`_wd.stab`) | none — every flag exists | S |
| 11 | The tsunami from off the map | mermaid · **Great Flood** (`raceFlood`, terrainCreate `elevationFlood` 12) | `_sigTsunami3D` (exists for the atlantean's line) as a BOARD-WIDE wave: it rises past the board's edge on the caster's side, rolls the whole board over ~1.6 s and leaves the basin fill behind; `cineFlyBy` from the edge, the storm sky (`uFogAmount`) for the beat | none — the flood is the existing basin fill; the VFX reads the board's width | S |
| 12 | Massive explosion pyrotechnics | barbarella · **Space Disco** (`raceSpaceDisco`, barrage) → the finale | a barrage of aerial shells launched from the caster over the zone, chrysanthemum / peony / willow bursts (billboard rings of ember colours), the finale of twenty at once, a whiteout, the mirror-ball light on every unit | none (barrage) | S |
| 13 | Orbital strike | men in black · **Classified Weapon** (`raceClassifiedWeapon`, damage) | the `dish` misc GLB unfolds in orbit (a tiny satellite high over the board), a targeting reticle walks onto the target, a column of light from the sky (`_LT` skyHeight 900 + a laser column), the REDACTED insert (`cineInsert('▇▇▇▇', 'terminal')`) | none | S |
| 14 | The kaiju grows | kaiju · **Atomic Breath** (`raceAtomicBreath`, line) | the kaiju's model scales to 4× over the wind-up (a unit-scale tween through `ThreeAnim`), the breath rig at `breathScale` 2.2 + `firestorm`, the camera cranes up to keep the head in frame | a `castScale` field read by the cast clip's start (three-renderer.js) | M |
| 15 | The black hole eats the board | voidweaver · **Black Hole** (`sharedBlackHole`, aoePull) | `_sigBlackHole3D` (exists) + the zone's loose things spiral in: the units' sprites / models tween into the hole and back out (a `throwArc` with `carry`), monuments and objects in the radius are lifted as clones, the world's stability crashes for the beat | none | S |
| 16 | The Megazord | super sentai · **Megazord Blast** (`sentaiMegazordBlast`, aoe) | five vehicles of the kit (`_VEHICLE_KIT` through the renderer's misc cache) fly in from five sides and lock together into a standing silhouette over the caster, its chest cannon fires the beam down onto the zone; the Sentai insert | none | M |
| 17 | The plane, part two | honda civic · **Vehicular Manslaughter** (`raceMissileBarrage`, aoe) | the Sedan itself (the car GLB) drives off the board's edge, launches, tumbles across the zone and lands on the target — a stunt jump, the horn, the airbag; then the car stands wrecked on the tile (`crashed_car` misc GLB as a one-round deployable) | a cosmetic deployable (`state._deployedObjects` row with `decor: true`) | M |
| 18 | Ego Death / the trip | shaman · **Bad Trip** ⇄ **Ego Death** | already bespoke (`_sigBadTrip3D`, `_sigEgoDeath3D`) — leave | — | — |

Sequencing: 5 · 10 · 11 · 12 · 13 · 15 first (S — six finishers in two
deliveries with no engine change), then 4 · 7 · 8 · 9 · 14 · 16 · 17 (M),
then 6 (L). Every delivery = three finishers + the test + the doc line.

### 3b. The raised-terrain rule, the rest of it

Done: Rampart · Walls of Camelot · Gothic Rampart · Ziggurat Protocol.
Left: **Sacred Geometry** (occulus, `crystal` terrain, no raise) could stand
`crystal` monuments (`_hzCrystalShards` exists — a `[1, 1, 2]` grid row and
`monument: { kind: 'crystal_shard' }`); the Build action's `placeBlock` /
`buildStructure` kinds stay blocks (they are the player's own masonry).
Every OTHER `terrainDeform` in the library is negative (a crater, a trench)
— nothing else raises a block.

## 4. THE FINAL ROUND — BUILT 2026-09-19 as THE EXECUTIONS (rule 0); the sketch below is history

- `FINISHER_RULES = { round: 10, apCost: 3, once: true }` (data.js).
- The ⚛ ENTROPY picker (hud.js `_hrlgEntropyBlades`) grows a FINISHER row
  per unit whose race has a `finisher` id; the verb is a game-action
  `doFinisher(unit, targetX, targetY)` wrapped in online.js like
  `doEntropyStrike` (host validates the round and the once-per-match flag on
  `state._finishersUsed[unit.id]`, which SYNCS).
- Execution = `doSpell` with the finisher's row (free of MP, the AP cost
  above), so every kind, VFX and director above is reused unchanged.
- AI: `scoreEntropyStrike`'s sibling (`scoreFinisher`) — the same candidate
  shape with `finisher: id`; Simul plan steps carry it.
- Why later: it doubles the surface (a picker, a game-action, an AI scorer,
  a Simul step, a tutorial line, the imitation observer) for spectacle the
  tree already delivers.

## 5. The delivery checklist (per finisher)

1. The row (name · desc in the house voice · numbers unchanged unless the
   design says why).
2. `npm test` green: capstone-vfx.test.js (the identity + the sibling rule),
   content-schema (the ring tiers), finishers.test.js (a row per finisher).
3. The relay question answered in the code comment: what the guest sees.
4. `node --check` on every edited file; the `?v=` token bumped; the zip.
5. UNSEEN LIVE noted in CLAUDE.md (RULE #1c) — the user eyeballs the beat.

## 6. Assets that would lift it (Meshy wish-list)

A cracked moon (two halves), a sun with a corona, a stepped pyramid with a
capstone gem, a passenger jet, a winged demon (rigged, flying), a satellite,
a volcano cone, a sea wave crest, an aerial shell, a wrecked car (the city
batch has one — `crashed_car`), a crenellated castle-wall segment (the wall
spells), a ziggurat tier block, a gothic buttress.

## 7. Log

- **2026-09-19 — THE EXECUTIONS (delivery 2).** The finisher is the
  gauge's other verb (rule 0): data.js `FINISHER_RULES` +
  `FINISHER_TYPE_DEFAULTS` + `FINISHERS` (a designed row for ALL 99
  races), battle.js `doFinisher` / `_finPlayCinematic` /
  `_FIN_DIRECTORS` (six typed + six bespoke), the camera ownership
  (`cineOwnShot`), hud.js (the ☠ row + the victim list), ui.js (the
  gate), online.js (the action + the `finisher-cine` relay), ai.js
  (`scoreFinisher`), the Simul step, three-vfx-effects.js "THE FINISHER
  PASS 2" (WORLD CLEAVE · THE WEIGHING · THE NAUGHTY LIST · HIT AND RUN ·
  THE STOMP · SEGFAULT), finishers.test.js (+7). THE BUILT SIX: king
  arthur · anubis · santa clause · honda civic · kaiju · ai. Not
  playtested (RULE #1c): the executioner's pane, every director's camera
  path against the real board, the scales' read, the car's facing off the
  misc cache (a nose that lands backward is the `car.rotation.y` in
  `_sigHitAndRun3D`), the foot's scale, the wireframe cage on a sprite
  vessel, the typed executions' strike beats on one victim. NEXT: the
  other 93 — take the rows in `FINISHERS` in roster order, six a
  delivery; the ones whose capstone already IS the beat (To the Moon,
  Meteor Storm, the Trick Shot, Bad Trip / Ego Death, the Tsunami, the
  Firestorm) can lift their signature straight into a director.

- **2026-09-18 — delivery 1.** THE SPELL-MADE MONUMENTS + THE ROCKS + three
  finishers (TO THE MOON, METEOR STORM, THE TRICK SHOT). Files: data.js,
  battle.js, map.js, three-renderer.js, three-vfx-effects.js, index.html,
  delta-maps.test.js, finishers.test.js, MODEL_INDEX.md, CLAUDE.md, this
  plan. Not playtested (RULE #1c) — the moon's size against the sky, the
  storm's density, the ricochet's legibility at half speed and every
  monument's scale in its tile box are the user's to eyeball first.
