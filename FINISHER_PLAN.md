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
| 9 | Telekinesis lifts the landscape — **BUILT 2026-09-19 as the telepath's EXECUTION (`mindOverMatter`, delivery 4; VFX-only, no holes)** | telepath · **Migraine** (`raceMindCrush`, damage) → **Mind over Matter** | the tiles around the CASTER (r 1) tear out of the board — the VFX clones each column as a cube in its own tile sheet (`_loadCachedTex(TERRAIN_SPRITES[key])`), they rise, hover in a ring round the caster's head, then slam into the target one after another; the board keeps the holes | new `deformAt: 'caster'` + `terrainDeform: { centerDelta: 0, edgeDelta: -1 }` on a damage row (today a damage row's deform lands at the target) | M |
| 10 | Volcanic eruption | golem · **Quake** (`raceQuake`, barrage) → **Eruption** | the target tile rises three (`terrainDeform: { centerDelta: 3, edgeDelta: 1 }` — positive deforms already work), lava paints the ring (`paintTerrain: { terrain: 'lava', radius: 1, rounds: 3 }` — the timed-terrain plumbing exists), a lava fountain (flame-hot columns + rock-debris + `_sigAsteroidDrop3D` lava bombs on the 5×5), the world's stability dips (`_wd.stab`) | none — every flag exists | S |
| 11 | The tsunami from off the map | mermaid · **Great Flood** (`raceFlood`, terrainCreate `elevationFlood` 12) | `_sigTsunami3D` (exists for the atlantean's line) as a BOARD-WIDE wave: it rises past the board's edge on the caster's side, rolls the whole board over ~1.6 s and leaves the basin fill behind; `cineFlyBy` from the edge, the storm sky (`uFogAmount`) for the beat | none — the flood is the existing basin fill; the VFX reads the board's width | S |
| 12 | Massive explosion pyrotechnics | barbarella · **Space Disco** (`raceSpaceDisco`, barrage) → the finale | a barrage of aerial shells launched from the caster over the zone, chrysanthemum / peony / willow bursts (billboard rings of ember colours), the finale of twenty at once, a whiteout, the mirror-ball light on every unit | none (barrage) | S |
| 13 | Orbital strike | men in black · **Classified Weapon** (`raceClassifiedWeapon`, damage) | the `dish` misc GLB unfolds in orbit (a tiny satellite high over the board), a targeting reticle walks onto the target, a column of light from the sky (`_LT` skyHeight 900 + a laser column), the REDACTED insert (`cineInsert('▇▇▇▇', 'terminal')`) | none | S |
| 14 | The kaiju grows | kaiju · **Atomic Breath** (`raceAtomicBreath`, line) | the kaiju's model scales to 4× over the wind-up (a unit-scale tween through `ThreeAnim`), the breath rig at `breathScale` 2.2 + `firestorm`, the camera cranes up to keep the head in frame | a `castScale` field read by the cast clip's start (three-renderer.js) | M |
| 15 | The black hole eats the board | voidweaver · **Black Hole** (`sharedBlackHole`, aoePull) | `_sigBlackHole3D` (exists) + the zone's loose things spiral in: the units' sprites / models tween into the hole and back out (a `throwArc` with `carry`), monuments and objects in the radius are lifted as clones, the world's stability crashes for the beat | none | S |
| 16 | The Megazord | super sentai · **Megazord Blast** (`sentaiMegazordBlast`, aoe) | five vehicles of the kit (`_VEHICLE_KIT` through the renderer's misc cache) fly in from five sides and lock together into a standing silhouette over the caster, its chest cannon fires the beam down onto the zone; the Sentai insert | none | M |
| 17 | The plane, part two | honda civic · **Vehicular Manslaughter** (`raceMissileBarrage`, aoe) | the Sedan itself (the car GLB) drives off the board's edge, launches, tumbles across the zone and lands on the target — a stunt jump, the horn, the airbag; then the car stands wrecked on the tile (`crashed_car` misc GLB as a one-round deployable) | a cosmetic deployable (`state._deployedObjects` row with `decor: true`) | M |
| 18 | Ego Death / the trip | shaman · **Bad Trip** ⇄ **Ego Death** | already bespoke (`_sigBadTrip3D`, `_sigEgoDeath3D`) — leave | — | — |

**THE FORGE (2026-09-19)**: every finisher is SEEN before it is bought — the party builder's TECHNIQUES circuit ends in THE FINISHER strip (the ☠ row under the root), and its ▶ PREVIEW plays the execution on the stage. A finisher is not done until its `_FIN_STAGE[sig]` script exists (§7, delivery 3).

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

- **2026-09-20 — SIX MORE EXECUTIONS in roster order (delivery 12).** The
  next six `FINISHERS` rows with `sig: null` in `AVAILABLE_RACES` order are
  BUILT (sixty-four of 99; 35 remain): goatman **Baphomet's Rite**
  (`baphometsRite` / `_sigBaphometsRite3D` — the inverted pentagram burns
  in round the victim, five black candles rise and light, seven hooded
  chanters stand up out of the ground (SOLVE · ET COAGULA), the horned,
  torch-crowned goat rises three tiles tall behind them with one arm up
  and one down, the body is lifted off the sigil and taken by a column of
  black-red fire; the candles snuff one by one), halfdemon **Half
  Measures** (`halfMeasures` / `_sigHalfMeasures3D` — the caster's
  stand-in splits into a pale human half that steps aside and turns its
  back and a crimson other half that grows horns and a wing, lunges, a
  six-slash flurry at a rising cadence the director shares, the body
  hauled overhead and slammed through the ground into a fire pit, the
  halves walk back and rejoin — the real model is faded out for the beat
  like Orbital Drop's), mermaid **The Wave** (`theWave` / `_sigTheWave3D` —
  the tide slides in from the rim beyond the victim, the mermaid sings on a
  `_finRockBody` rock, a LOFTED CURLING WAVE WALL (a hand-built
  BufferGeometry with vertex colours deep → light → foam, nine tiles tall,
  twelve wide) rises at the rim and rolls in with spray tearing off its
  lip, crashes on the tile, the board under a hand of water that drains
  back and leaves a puddle and one shell), nephilim **The Watchers'
  Verdict** (`watchersVerdict` / `_sigWatchersVerdict3D` — a dark dome, TWO
  HUNDRED EYES on one InstancedMesh (`_finEyeTex`, a cached canvas almond)
  opening in sequence on a hemisphere round the victim, every plane turned
  on the body by `Matrix4.lookAt`; on the gaze 200 light threads
  (LineSegments) converge on the head; the verdict = six `_LT().bolt`s out
  of six eyes, then every eye shuts at once), vampire **The Drain**
  (`theDrain` / `_sigTheDrain3D` — a bent cape the size of the night unfurls
  from behind the caster and leans over the board with its crimson lining
  up, eighty bats on one InstancedMesh spiral in tighter and bite, a wine
  glass forms round the victim and fills red from the foot as the body
  pales and shrinks, the glass is lifted on a pivot whose local +X points
  at the caster and tipped, the wine drains, the glass shatters into
  fourteen shards, the cape closes and the bats scatter), voidweaver
  **Event Horizon** (`eventHorizon` / `_sigEventHorizon3D` — a violet seed
  from the hand hangs over the victim and opens into a true black sphere
  (a plain non-transparent black material — the one thing that emits
  nothing) in a photon ring under two counter-tilted accretion discs, the
  sky dark; the body becomes a `_finChain` of 26 beads on a corkscrew from
  the feet to the horizon, each thinner, swallowed head first, the 5×5's
  loose light streaking in; the horizon collapses to a point and lets one
  flash out — the director's `strike` freezes on the `invert` grade and
  fires the ring / flash / slam 180 ms later through `c.at`, on the
  collapse). Each = a director in battle.js `_FIN_DIRECTORS` (the DELIVERY
  12 block; the wave's `strikeMs` 4600), the signature in "THE FINISHER
  PASS 2" (the DELIVERY 12 block; `_sigRunOwned` + `_fxDelay`, called inside
  the relayed cinematic — RULE #2), a `_FIN_STAGE[sig]` script for the
  forge (the beats as fractions of the stage's hit time), a row in
  finishers.test.js's BUILT + SIG_FN tables. Smoke-tested in a stub-THREE
  harness (every tick of every signature at 16 ms, no NaN in any
  position / scale / opacity / spawn; not a render). Files: data.js,
  battle.js, three-vfx-effects.js, index.html (`20260920-finishers-12-cors`),
  finishers.test.js, CLAUDE.md, this plan. Not playtested (RULE #1c): the
  goat's silhouette against the chanters, the two halves' split read on a
  sprite vessel (the real model is faded for the beat), the wave's vertex
  colours and its lip under the board's light (a wall that reads flat wants
  `wmat` swapped to a Lambert), the eyes' scale on the dome and the 200
  threads' brightness, the cape's fold over the board and the pivot's tilt
  direction (`pivot.rotation.z` sign is the edit if the glass tips away from
  the caster), the black sphere against a dark map, and the six camera
  paths on the real board. NEXT: the rows in roster order — cosmic wraith,
  superhero, general, droid, antihero, conspiracy theorist.

- **2026-09-20 — SIX MORE EXECUTIONS in roster order (delivery 11).** The
  next six rows of `FINISHERS` after the machine elves, each a director
  (battle.js `_FIN_DIRECTORS`, the DELIVERY 11 block) + a signature
  (three-vfx-effects.js "THE FINISHER PASS 2", the DELIVERY 11 block) + a
  stage script (`_FIN_STAGE[sig]`): cyclops **Nobody** (`nobody` — a cave
  mouth heaves up behind the giant with one great eye in its dark, THE
  ROCK over the lintel (the misc asteroid through `_finRockBody`, a tile
  and a half across) is lifted and brought down on the victim ONCE (the
  body flattens, the eye blinks), lifted higher and brought down again
  (the hit), the rock settles where the tile was, the cave sinks, the
  card asks WHO and answers NOBODY; reverse OTS → sky watch → fall follow
  → face cam on the eye → sky watch → a slower fall follow → god shot),
  cyborg **Orbital Drop** (`orbitalDrop` — the cyborg's steel stand-in
  with a jetpack lifts off the caster's tile on a blue exhaust column
  while the real model fades, a satellite card + a red DESIGNATOR (reticle,
  ticks, a laser down from orbit, a dot) settle on the victim, then
  RE-ENTRY: a `_finRockBody` meteor in a plasma shell on an ember trail
  straight down the column, the crater ring + fireball, the shell cracks
  off and the cyborg stands in the crater as the real model fades back;
  face cam on the thrusters → sky watch → god shot from orbit → sky watch
  → a long fall follow → crane; the altimeter inserts), demon prince
  **Dark Dominion** (`darkDominion` — a crimson portal torus + black disc
  opens overhead with `_LT().bolt` lightning crawling across it and the
  Vatican batch's `demon_statue` (else a horned mask) hanging at its rim,
  fourteen winged bodies dive on the victim one after another (each a
  shock ring + a dark burst, the body knocked lower), wheel away and climb
  back, and the last carries the body UP into the disc and the ring snaps
  shut on the hit; sky watch → witness cam → a face-cam dive at half speed
  → crane up with the last → sky watch on the snap), demon princess
  **Lullaby** (`lullaby` — the tile becomes a black cradle on rockers
  with the body in it, two clawed hands out of the ground rock it slower
  and slower, a mobile of skulls turns, ♪ notes drift up, five candles
  gutter out as a black dome closes down, the rocking stops, the ground
  opens and the cradle drops in (the hit), a small stone stands up
  reading zzz; face cam under slowly closing EYELIDS → a slow side dolly
  → witness cam → god shot), dreameater **Devoured** (`devoured` — the
  victim sleeps standing up, a hue-drifting dream bubble with a little
  house / tree / moon / stars rises over the head, two jaws of teeth open
  round it and take it in three bites (a burst of its colour each), then
  turn on the sleeper for three bites from the crown down (the body
  shortens a step each), the last the hit, the pillow is what is left;
  face cam → dolly zoom on the bubble → witness cam on the jaws → a
  half-speed face cam → god shot), fallen angel **The Fall** (`theFall` —
  a column of light on the tile, the body carried ten tiles up past
  `white_cloud` clones (else puffs) toward the `pearly_gate` (else posts
  and a bar) in a halo, feathers of light drifting down, then the light
  snaps off, two black wings open and burn, and the body tumbles the long
  way down on a trail that goes white → black beside an altimeter sprite
  (9 000 → 0 FT; `_finTextTex` swapped on the sprite), the crater, black
  feathers settling; face cam → a 6-tile crane up → sky watch on the
  gates → a 1.7 s fall follow under two slow-mo steps → god shot).
  Fifty-eight built of 99. Smoke-tested in a stub-THREE harness (every
  tick of every signature on three placements, the hit ring fires in
  each; no rendered frame — RULE #1c). Not playtested: the cave's read
  behind the caster (its crag stands `max(2.6 tiles, L + 1.2)` back), the
  rock's scale off the asteroid GLB, the exhaust column's height against
  the dome, the designator's laser from 16 tiles up, the portal's height
  (6.5 tiles) against the sky watch, the demon_statue's scale at the rim
  (`ts * 1.4` is the edit), the crib's scale and the hands' reach, the
  jaws' teeth rings from the witness cam, the gate GLB's facing on the
  halo, the altimeter's legibility during the fall, every director's
  camera path on the real board. NEXT: the rows in roster order —
  goatman, halfdemon, mermaid, nephilim, vampire, voidweaver.

- **2026-09-20 — SIX MORE EXECUTIONS in roster order (delivery 10).** The
  next six rows of `FINISHERS` after the mantid, each a director (battle.js
  `_FIN_DIRECTORS`, the DELIVERY 10 block) + a signature (three-vfx-effects.js
  "THE FINISHER PASS 2", the DELIVERY 10 block) + a stage script
  (`_FIN_STAGE[sig]`): antperson **The Colony** (`theColony` — an ANTHILL
  rises beside the tile (a cone with a dark hole in its crown), eighty ants
  pour out of it in a column that widens into a black TIDE under the victim's
  feet, then CLIMB the body (beads riding its surface) until it is black to
  the crown and shudders; the hit: the body comes apart into SIX PIECES,
  each hoisted on the tide and carried back to the hill in a column, each
  dropping into the hole in turn; the tide drains, the hill sinks; witness cam
  on the hill → god shot on the tide → face cam on the climb → the freeze on
  `sepia` → a crane with the column → a low reverse; 🐜 THE COLONY HAS BEEN
  NOTIFIED · A MILLION SMALL PROBLEMS · EVERY ONE ACCOUNTED FOR. · IN
  PIECES.), mothman **The Bridge** (`theBridge` — two RED EYES open high on
  the caster's side and hold on the victim (blinking, out of step with the
  tower lamps); the SILVER BRIDGE builds itself along the line under the
  victim — two towers, nine plank segments lifting the victim's own segment
  two and a half tiles up, the eyebar chain drooping between the towers, a
  ⚠ THE BRIDGE IS NOT SAFE card the victim ignores; one eyebar SNAPS at the
  near tower (a spark, the chain whips), the segments drop in sequence from
  that tower toward the victim, each into a splash, the victim's segment
  last (the hit), the eyes close; reverse OTS on the eyes → god shot on the
  build → face cam on the span → a crane on the snap → fall follow with the
  deck → the freeze on `crimson` → a low reverse; 👁 👁 · POINT PLEASANT ·
  DEC 15 1967 · ⚠ THE WARNING NOBODY HEEDS · EYEBAR 330 · NOBODY HEEDED.),
  siren **The Last Verse** (`theLastVerse` — THE SEA comes in: a dark sheet
  floods the board beyond the victim and stops at the tile's edge with a
  foam line; THREE ROCKS stand up out of it (`_finRockBody` — the asteroid
  GLBs when they are in); THE SONG: seven note-cards leave the caster's tile
  and circle the victim's head, its eyes go glassy, and it WALKS off its
  tile, into the shallows to the waist, up onto the middle rock; THE LAST
  VERSE: a WAVE the height of a tower rises behind the rocks, curls, and
  comes down (the hit) — foam over everything, the rocks bare, the victim
  gone; the sea and the rocks draw back down; god shot on the sea → reverse
  OTS on the song → a side dolly on the walk → sky watch on the wave → the
  freeze on `cool` → a crane on the ebb → a low reverse; 🎵 THE ROCKS ARE
  RIGHT THERE · ♪ COME CLOSER · THE LAST VERSE · THE SEA GETS ITS OWN.),
  scarecrow **A Murder** (`aMurder` — ONE CROW (a black bead, two flapping
  wing-planes, a yellow eye) lands on the victim's head; then fifty-six
  come in from every direction on a widening spiral and LAND one after
  another until the victim is a black feathered heap to twice its height;
  a stillness, a CAW, and they lift AS ONE (the hit) in a spiral up and away
  over the caster — the tile is empty, fourteen black feathers drift down;
  face cam on the first crow → sky watch on the county → a side dolly round
  the heap → witness cam on the stillness → the freeze on `desat` → a crane
  with the flock → a low reverse; 🐦‍⬛ ONE · A MURDER · …OF CROWS · CAW. ·
  AS ONE.), glitch **Corrupted Save** (`corruptedSave` — the victim's TEXTURE
  goes missing (the magenta-and-black checker of a missing asset on a
  canvas, flickering in), then the MODEL (a cyan wireframe over it, sixteen
  magenta / cyan triangles drifting off-grid), then a FLOPPY DISK the size of
  a table drops beside the tile (a shutter, a label, a progress bar whose
  card ticks up and sticks blinking at 99 %), then the TILE goes missing (a
  black square in a hollow pink outline, the body sinking a little, pink /
  cyan pixels flickering), then the hit: FILE NOT FOUND, the body deleted in
  a spray of twenty-six magenta / cyan / black blocks, a 404 card rising;
  the tile comes back, the disk does not; face cam on the texture → a dolly
  zoom on the tearing model → god shot on the disk → witness cam on the
  missing tile → the freeze on `hue` → a low reverse; 💾 TEXTURE: MISSING ·
  MODEL: MISSING · SAVING… DO NOT POWER OFF · TILE: MISSING · 99% · FILE NOT
  FOUND · THE MEMORY OF THEM: MISSING — the first finisher on the `terminal`
  insert kind), machine elves **The Dose** (`theDose` — THE CHAMBER: the
  library's kaleidoscope dome + two hue-cycling rings round the tile; SIX
  ELVES — an octahedron core in a ring in a crown of spikes, every part
  scaling and turning out of step, the colours cycling, a glyph-card
  chattering over each (∞ ✶ ◈ ⟡ ☉ ✧) — orbit in closer; THE GIFT: a wireframe
  icosahedron inside a wire dodecahedron turning on every axis GROWS
  twenty-six-fold until it fills the sky over the board under an EVERYTHING
  AT ONCE card while the body cycles through every colour and stretches
  thin; the hit: the object is gone, a rainbow burst, eighteen prismatic
  shards fall on the tile; the elves wave and rise away; god shot on the
  chamber → a side dolly round the elves → face cam on the gift → a dolly
  zoom on the growth → the freeze on `hue` → sky watch on the wave → a low
  reverse; 🌈 FIVE MINUTES · …OF FOREVER · THEY ARE SO GLAD YOU CAME · A GIFT
  · EVERYTHING AT ONCE · NOT BUILT FOR EVERYTHING.). Every signature owns ONE
  group through `_sigRunOwned`, every timer is `_fxDelay`, every text card a
  Sprite, and each is called INSIDE the relayed cinematic (never
  `fireGeometry`, RULE #2). finishers.test.js's BUILT + SIG_FN tables carry
  the six (15 / 15); each signature was ticked end to end in a stub-THREE
  sandbox (every frame of its whole `ms`, on a real line and on a
  zero-length one; not a render). FIFTY-ONE of 99 are built; 48 remain (the
  next six in roster order: cyclops · cyborg · demon prince · demon princess
  · dreameater · fallen angel). UNSEEN LIVE (RULE #1c): the ants' bead size
  against a real rig (`ts * 0.028` is the edit) and the tide's read on a
  bright sheet, the bridge's span past the board's rim on a corner tile (the
  towers hang in the air — `SPAN` is the edit) and the victim's lift against
  the real model, the sea sheet's edge against the board's own water, the
  asteroid rocks' scale as sea stacks, the crows' flap rate, the checker's
  read on the stand-in capsule (the real rig keeps its own material — the
  checker is a second shell), the 99 % card's blink, the gift's final scale
  against the dome (26× is the edit), the six camera paths on the real
  board.
- **2026-09-20 — SIX MORE EXECUTIONS in roster order (delivery 9).** The
  next six rows of `FINISHERS` after the annunaki, each a director (battle.js
  `_FIN_DIRECTORS`, the DELIVERY 9 block) + a signature (three-vfx-effects.js
  "THE FINISHER PASS 2", the DELIVERY 9 block) + a stage script
  (`_FIN_STAGE[sig]`): skinwalker **Wearing You** (`wearingYou` — a RING OF
  EYES opens in the dark round the tile (fourteen yellow pairs at every
  height, blinking out of step), THE STALKER lopes in from the caster's side
  on all fours on a trail of void-mist and STANDS UP nose to nose with the
  victim under a flickering sliver of mirror, THE PEEL: the victim's FACE (a
  pale glow at head height) detaches and drifts across to the stalker's head
  on a trail of shadow while the victim stretches and goes glassy; the hit
  collapses the victim into a SKIN — a flat dark sheet that flutters up off
  the tile and away — and the stalker, wearing the face, takes the victim's
  colour and lopes back the way it came while the eyes go out one by one;
  witness cam → reverse OTS on the lope → face cam nose to nose → a dolly
  zoom on the peel → the freeze on `hue` → a crane with the skin → a low
  reverse; 👁 👁 👁 · HELLO. · IT HAS YOUR FACE NOW · THERE IS ONE MORE OF
  THEM.), werewolf **Full Moon** (`fullMoon` — THE MOON (the misc cache's
  moon GLB, a grey sphere while it streams, seven tiles across) drops out of
  the sky to hang just over the board with a silver glow and a moonbeam
  cone on the tile; THE HOWL: three rings of sound leave the caster's tile
  and the moon pulses to each; then the change IN REVERSE — twenty dark
  spikes of fur bristle out of the body, shed as debris, the body pales and
  shrinks to a man, then smaller — and on the hit the moon goes BLOOD RED for
  a breath (the GLB's own materials tinted through userData), a red ring, a
  heap of clothes on the tile; the moon lifts away silver; sky watch on the
  drop → reverse OTS on the howl → face cam + a dolly zoom on the change →
  the freeze on `crimson` → a sky watch on the blood moon → a low reverse),
  gargoyle **Petrified** (`petrified` — THE STONE: the victim greys over,
  nine cracks web across it, dust falls, a plinth appears; a CATHEDRAL rises
  out of the ground beside the tile (a 5.5-tile tower, a pitched roof, four
  pinnacles, a rose window, a parapet with two stone gargoyles crouched on
  its corners); a LIVE gargoyle swoops off the roof with beating wings, grips
  the statue and carries it up in an arc onto the parapet's front, lands
  beside it and folds its wings; a PIGEON lands on the statue's head; the
  statue TIPS, falls the whole height (the pigeon leaves in a burst of
  petals) and SHATTERS on the tile into six ballistic chunks + rock debris +
  dust; the cathedral sinks back; face cam on the stone → god shot on the
  rising cathedral → a crane with the lift → a sky watch from below → fall
  follow → the freeze on `bone` → a low reverse; 🗿 STONE · A CATHEDRAL, FOR
  ONE · 🕊 · OOPS · SOME ASSEMBLY REQUIRED.), djinn **Three Wishes**
  (`threeWishes` — a brass LAMP (body, spout, handle, lid, foot) drops onto
  the tile beside the victim and bounces; violet smoke pours out of the
  spout and gathers into a column with two golden eyes and a grin in it;
  WISH ONE "I WISH I WERE RICH" — a snap of gold sparks at the eyes, forty-
  eight coins rain out of the sky until the victim is buried in a growing
  mound; WISH TWO "I WISH I COULD FLY" — the mound bursts and the victim is
  flung eight tiles straight up, spinning, on a trail of sparkles; WISH
  THREE "I WISH IT WOULD STOP" — it stops, mid-air, a ⏸ beside it; then the
  spout SUCKS: the victim spirals down into the lamp stretched thin on a
  vortex of void-mist; the lid snaps shut (the hit), the lamp rattles, the
  eyes close, the lamp floats away; crane on the landing → god shot on the
  coins → sky watch on the fling → face cam on the pause → fall follow into
  the spout → the freeze on `sepia` → a low reverse; WISH I / II / III ·
  GRANTED. · LITERALLY. · NO REFUNDS.), catgirl **Nine Lives** (`nineLives`
  — NINE PERCHES rise round the tile in a climbing spiral on their own posts
  (the table · the counter · the shelf · the roof · the ledge · the balcony ·
  the tower · the cliff · THE MOON, a glowing pale sphere, highest); a small
  black CAT with green eyes, ears and a tail sits on the first; the victim is
  set on it, the PAW swipes, the victim is knocked off and tumbles to the
  tile with a puff, the LIVES card over the tile (one Sprite whose texture
  is swapped per knock) ticks 9 → 8, it blinks up onto the next perch and
  the cat hops after it — nine times, each fall longer; the ninth from the
  moon is the whole height and the victim flattens on the tile (the hit,
  the card reads 0 in red); the cat washes a paw; the perches sink; god
  shot on the spiral → a side dolly round it through the knocks → a sky
  watch on the moon → fall follow on the ninth → the freeze on `hue` → face
  cam on the flat → a low reverse; the eight counts stamped on the beat),
  mantid **The Praying** (`thePraying` — a MANTIS the size of a building
  (abdomen, thorax, a triangular head with two glowing compound eyes and
  antennae, mandibles, four walking legs, two spiked raptorial forelegs on
  shoulder / elbow / wrist pivots) steps in from beyond the victim in three
  footfalls (a shake and a dust ring each), FOLDS its arms before its face
  (the prayer), BOWS its head over the tile as the body pitches forward and
  drops, the mandibles open over the victim (a fall of green mist) — and
  close (the hit): the victim's top half goes into the head, the bottom half
  stands a beat and topples; the head lifts, a foreleg wipes across the
  face, the mantis walks back out; reverse OTS over the caster on the step
  in → a sky watch up at it → witness cam on the prayer → face cam under
  the head → the freeze on `cool` → a crane on the wipe → a low reverse; IT
  IS THE SIZE OF A BUILDING · SAY GRACE · AMEN. · BLESS THIS MEAL · THE
  OTHER HALF IS STILL STANDING.). Every signature owns ONE group through
  `_sigRunOwned`, every timer is `_fxDelay`, every text card a Sprite, and
  each is called INSIDE the relayed cinematic (never `fireGeometry`, RULE
  #2). finishers.test.js's BUILT + SIG_FN tables carry the six (15 / 15);
  each signature was ticked end to end in a stub-THREE sandbox (every frame
  of its whole `ms`; not a render). FORTY-FIVE of 99 are built; 54 remain
  (the next six in roster order: antperson · mothman · siren · scarecrow ·
  glitch · machine elves). UNSEEN LIVE (RULE #1c): the ring of eyes against
  a bright map, the face sprite's read on the real rig, the moon GLB's size
  against the dome and its red tint through the GLB's own materials, the
  cathedral's scale beside a real unit and the perch's alignment over the
  tile, the lamp's spout-tip frame after the lamp's yaw (the suck aims at
  `spoutTip` rotated by `lamp.rotation.y`), the coins' fall against the
  mound, the nine perches' spiral against the board's edge (a perch past
  the rim hangs in the air), the mantis's head reaching the victim on the
  bow (the pitch + drop numbers in `pose` / the bow block are the edits),
  the six camera paths on the real board.
- **2026-09-20 — SIX MORE EXECUTIONS in roster order (delivery 8).** The
  next six rows of `FINISHERS` after the demon, each a director (battle.js
  `_FIN_DIRECTORS`, the DELIVERY 8 block) + a signature (three-vfx-effects.js
  "THE FINISHER PASS 2", the DELIVERY 8 block) + a stage script
  (`_FIN_STAGE[sig]`): succubus **Kiss of Death** (`kissOfDeath` — a DANCE
  FLOOR unrolls under the tile (a dark disc, twelve pink floor lamps that
  chase on the beat), a MIRROR BALL comes down on its wire throwing
  sparkles, two rose spotlights sweep in and cross, a magenta DANCER steps in
  from the caster's side and the two CIRCLE each other for the chorus, THE
  DIP (the victim tilted back over the dancer's arm, a ♥ over them), THE
  KISS (a pink burst) and the victim goes out LIKE A CANDLE — the body
  drains to soot, a wisp climbs off it and hangs as a HEART-SHAPED SMOKE RING
  (forty puffs on the heart curve drifting up together), the dancer bows,
  the lamps go down one by one; crane → a side dolly round the dancers →
  face cam on the dip → the freeze on `hue` → a crane up with the ring → a
  low reverse; ♪ LAST DANCE · MAY I? · OUT LIKE A CANDLE), skeleton **Bone
  Rattle** (`boneRattle` — TWENTY-TWO SKELETONS pop out of the ground in two
  rings (skull · spine · three ribs · arms on pivots · legs, a dust burst and
  a hop each), RATTLE for one chorus (a bob on the beat, the skulls tilt, the
  arms swing, a ♪ SPOOKY · SCARY ♪ card), on the cue every right arm swings
  up level and POINTS at the tile at once (a lean-in, a glow at the
  fingertip, sparkles converging); the hit BONES the victim — it bleaches,
  drops into a nine-piece bone pile — and the chorus sinks back into the
  ground; god shot → a side dolly along the chorus line → reverse OTS on
  the point → face cam → the freeze on `bone` → a low reverse), mech
  **Ordnance** (`ordnance` — six POD DOORS hinge open off the caster's
  shoulders and back (a red-lit interior each), three TARGET RINGS tighten
  on the tile under a LOCK 30 / 30 card, and thirty MISSILES leave in
  staggered volleys, each on its own bezier through a randomly high apex
  with a wobble, a smoke trail and a glow off every one, a muzzle flash per
  launch, and land in a rolling sequence of fireballs — the last and biggest
  timed to the hit — a smoking crater disc left on the tile; reverse OTS on
  the pods → sky watch on the volley → fall follow down with it → the
  freeze on `heat` → god shot on the crater → a low reverse; `> hardpoints:
  6/6 OPEN` terminal, ▣ LOCK, ALL OF IT), ghost **Possessed Photo**
  (`possessedPhoto` — a camera FLASH from the caster's side and THE
  PHOTOGRAPH hangs over the tile facing the caster (a white-bordered print
  that DEVELOPS from sepia to the picture: the victim's silhouette standing
  in it), then behind it a pale TALLER figure fades in with a hand on the
  victim's shoulder (two black eyes), the print shivers, and it BURNS FROM
  THE MIDDLE — a black hole with an ember rim eats it outward, flames
  climbing off the rim (spawned on the print's own tilted plane through
  `localToWorld`), the ghost turns its head as the print goes, and the
  victim on the tile fades out with it; reverse OTS on the flash → a square
  face cam on the print → a dolly zoom as the figure appears → the freeze
  on `sepia` → a low reverse; 📸 SMILE, DEVELOPING… clock, WHO IS THAT
  BEHIND YOU), zombie **The Pile-On** (`pileOn` — FORTY green silhouettes
  come up over the board's edge from every direction nine tiles out (arms
  out, each on its own gait, a lean and a sway), shamble in to a ring round
  the tile, then DOGPILE: the ring collapses inward into a three-tier
  heaving MOUND over the victim (the top tier kicking), a BRAAAINS card, the
  hit inside the pile (a dark burst, a stain), then the horde peels off in
  every direction — every third one carrying a PIECE held out in front —
  and shambles back over the edge; a wide god shot on the horde → a witness
  cam on the ring closing → a crane over the mound → the freeze on
  `crimson` → a god shot on the exodus → a low reverse), annunaki **Pyramid
  Scheme** (`pyramidScheme` — THREE INVERTED PYRAMIDS (four-sided cones tip
  down, a gold band, a CAPSTONE sphere at each tip, an 👁 on every face)
  descend out of the sky over the tile in a triangle turning slowly, the
  capstones CHARGE (a gold glow swells, sparkles stream in, a gold triangle
  lights on the ground joining them, AS ABOVE / SO BELOW), three LASERS
  (a gold cone + a white core each) leave the tips and converge on the
  tile, the tile under them rising as a translucent green GLASS slab, the
  victim bleaching flat; the hit flares the beams, the slab cracks and
  stands there smoking, the pyramids rise away spinning; sky watch → god
  shot on the triangle → face cam on the beams → the freeze on `whiteout` →
  a low reverse → a sky watch on the exit; `> yield: GLASS` terminal).
  Thirty-nine built of 99. Smoke-tested in a stub-THREE harness (every tick
  of every signature at the directors' timings and at bare defaults, every
  spawn coordinate and object position finite — no rendered frame, RULE
  #1c); finishers.test.js (15) + `npm run test:quick` green. Not playtested:
  the dance floor's lamps against the board's own light, the dancer's
  circling radius (`R = ts * 0.55`) against a rigged victim, the heart
  ring's read (`scl = ts * 0.045`), the skeletons' scale (`skullGeo` ts ×
  0.1) and whether twenty-two read as a chorus, the point's arm angle
  (`-Math.PI / 2` on `pivR`), the missiles' apex heights (`ts × 3.5–7.5`)
  under the sky watch and the trail's density (a spawn every 70 ms per
  missile — `M.lastSm`), the print's size (`PW = ts * 3.2`) and its facing
  (`photo.rotation.y` — a print that faces away wants the sign flipped),
  the ghost figure's legibility, the horde's shamble speed (linear over
  ~2 s from nine tiles) and the mound's read, the pyramids' hover height
  (`HOV = ts * 6.2`) and ring (`RING = ts * 3.2`) against the camera, the
  beams' `lookAt` + `rotateX` alignment (a beam that lies flat wants the
  axis fix), the glass slab's tint, the six camera paths. NEXT: the rows
  in roster order — skinwalker, werewolf, gargoyle, djinn, catgirl, mantid.

- **2026-09-20 — SIX MORE EXECUTIONS in roster order (delivery 7).** The
  next six rows of `FINISHERS` after the reptilian, each a director (battle.js
  `_FIN_DIRECTORS`, the DELIVERY 7 block) + a signature (three-vfx-effects.js
  "THE FINISHER PASS 2", the DELIVERY 7 block) + a stage script
  (`_FIN_STAGE[sig]`): robot **Compactor** (`compactor` — two WALLS OF STEEL
  rise nine tiles out either side of the victim on the perpendicular of the
  caster → victim line (rail beds, a piston behind each, warning stripe,
  rust ribs), close on hydraulic rails with sparks off the runners while the
  silhouette is ground flatter, meet, a PRESS PLATE drops on the seam, the
  walls part and a CUBE with a stencilled serial (UNIT 1 → CUBE 1) stands on
  the tile; god shot → a side dolly down the walls' travel → face cam → the
  freeze → a low reverse; `> compactor: ARMED` terminal, ⚠ STAND CLEAR),
  android **Factory Reset** (`factoryReset` — a ⏻ hologram over the victim,
  the body powers down (the tint drains, a flicker), then THE PARTS DIAGRAM:
  six labelled parts (head · torso · arms · legs) drift out to an exploded
  view on a wireframe grid with leader lines and [01]…[06] cards, a
  RESTORING DEFAULTS progress card counts 0 → 100 %, the parts fly up into a
  CRATE (THIS SIDE UP · FRAGILE) that drops onto the tile with a bounce; face
  cam → crane → god shot on the diagram → fall follow → a low reverse), angel
  **The Rapture, Party of One** (`rapture` — a cloud ring parts over the
  tile, a brass TRUMPET sounds out of it, a column of gold light stands down,
  feathers drift, the silhouette rises slowly turning with its arms out
  toward an IRIS of white light — which SHUTS on it (a … clock insert),
  holds, re-opens RED, a dark HAND comes down through it and takes the body
  back up, the iris snaps shut and one scorched feather tumbles down onto
  the tile; face cam → a crane rising with the body → sky watch → the
  freeze on `crimson` → fall follow with the feather → a low reverse),
  seraphim **Be Not Afraid** (`beNotAfraid` — THREE RINGS WITHIN RINGS
  (gold tori with a fire halo each) come down over the victim turning on
  three axes, fourteen EYES a ring (a white ball, a dark iris), and on the
  gaze beat every eye turns to the tile at once, a GREAT EYE opens at the
  hub (its lid rolls back), its light stands down on the body until it is
  bleached white; sky watch → face cam → a blink + a dolly zoom on the
  gaze → the freeze on `whiteout` → a low reverse; BE NOT AFRAID scripture),
  orb of light **Into the Sun** (`intoTheSun` — a SUN the size of the
  board rises off the far edge beyond the victim (a photosphere, a BackSide
  chromosphere, a corona sprite, five prominence loops off the limb), the
  silhouette is FLUNG down the line on a long arc into it (an ember trail,
  a flare on the photosphere), the sun COLLAPSES for a held breath (shrinks
  to a cinder, the … clock) and goes NOVA — a white shell out to thirty
  tiles, two shock rings, starfire raining, the board bleached to the rim
  (`sizeTiles` = the span); crane on the caster → sky watch on the sunrise
  → a wide god shot on the throw → the freeze → a low reverse), demon **The
  Contract** (`contract` — a CONTRACT the size of the sky unrolls off two
  black rollers over the tile (a canvas parchment: the terms, the fine
  print, a line for the name), a QUILL comes down and signs the VICTIM'S
  NAME in fire along the line (a spark trail; `unitDisplayName` rides the
  `name` opt), the red seal lands, then THE PIT opens under the body (a
  black disc, embers), four CHAINS climb out of it and spiral round the
  body, drag it down, the pit slams shut and the contract burns from the
  foot up; reverse OTS → sky watch on the unroll → face cam on the
  signature → fall follow to the pit → the freeze on `crimson` → a low
  reverse; `> status: BINDING` terminal, PAID IN FULL). Thirty-three built
  of 99. Smoke-tested in a stub-THREE harness (every tick of every
  signature at the directors' timings and at bare defaults, every spawn
  coordinate finite — no rendered frame, RULE #1c); finishers.test.js (15)
  + `npm run test:quick` green. Not playtested: the walls' rotation about
  the perpendicular (`wg.rotation.y = -atan2(pz, px)` — a wall that lands
  edge-on to the camera wants the sign flipped), the walls' scale (`W` /
  `H` / `FAR` in `_sigCompactor3D`) against the board, the press plate's
  drop, the parts diagram's radius (`R = ts * 1.9`) under the god shot, the
  crate's read, the cloud ring's height (`CLOUD = ts * 9`) in the crane
  and whether the trumpet reads as one, the hand's fingers, the rings'
  spin rate on the gaze, the eyes' `lookAt` (each ring group turns under
  them — a lag is expected), the sun's radius (`R = ts * 7.5` at `D = ts *
  16`) against the horizon and the sky dome, the nova shell's size, the
  parchment's legibility at `PW = ts * 6` under the sky watch, the quill's
  travel across the sheet's tilt, the chains' wrap, the six camera paths.
  NEXT: the rows in roster order — succubus, skeleton, mech, ghost,
  zombie, annunaki.

- **2026-09-20 — SIX MORE EXECUTIONS in roster order (delivery 6).** The
  next six rows of `FINISHERS` after the fairy, each a director (battle.js
  `_FIN_DIRECTORS`, the DELIVERY 6 block) + a signature (three-vfx-effects.js
  "THE FINISHER PASS 2", the DELIVERY 6 block) + a stage script
  (`_FIN_STAGE[sig]`): martian **Ack Ack Ack** (`ackAckAck` — a War-of-the-
  Worlds TRIPOD seven tiles tall steps in from beyond the victim along the
  line, a shake and a dust burst per footfall, a red eye under the hood; the
  heat ray leaves the hood aimed two tiles wide, sweeps onto the tile and
  holds (embers off the ground); on the hit the silhouette is a SKELETON
  (a bone capsule in rib rings, a skull) that topples and crumbles while the
  tripod lifts away; sky watch → face cam → a side dolly down the ray → the
  freeze → a low reverse; ULLA… signals), nordic **Ascension Denied**
  (`ascensionDenied` — a column of white light sixteen tiles tall, three
  halos climbing it, the body lifted nine tiles turning slowly; the light
  STUTTERS (the pause, a `…` clock insert), NOT THIS ONE, the beam snaps
  off, the body kicks UP then comes down from orbit tumbling on a re-entry
  trail of flame and smoke and craters the tile (a dark disc, rock debris,
  the fireball); face cam → a long crane rising with the body → sky watch →
  `cineFallFollow` → the freeze → a low reverse), grey **The Probe**
  (`theProbe` — the saucer through `_sigBuildUFO` (the misc-bucket hull
  when cached) swoops in across the frame and hovers, the green tractor
  beam takes the body up turning and lays it FLAT on a TABLE that
  materialises under the hull with a lamp cone, a probe arm jabs three
  times out of the hull (a flash, sparks and a kick each), then the beam
  cuts and the body drops in THREE PIECES stacked legs · head · torso;
  the saucer shoots off after; sky watch → god shot → crane → side dolly →
  fall follow → a low reverse; the terminal insert `> subject acquired`),
  bigfoot **Blurry Footage** (`blurryFootage` — a treeline of the misc
  bucket's pines (else cones on trunks) rises beyond the victim, a ● REC
  card with the frame counter hangs flickering, VOID-MIST GRAIN drifts across
  the frame, and a hulking black figure with swinging arms walks out of the
  trees in slow steps (a shake + dust each), through the tile (the
  silhouette is flung) and on past the lens; the grade is `desat dim
  vignette`, the camera is a WITNESS shot with hand-held jolts (`c.kick`
  every 420 ms) into a linear side dolly, slow-mo to the freeze on `desat`,
  FRAME 352 as a glitch insert), shadow entity **Sleep Paralysis**
  (`sleepParalysis` — a black BackSide dome closes round the tile (the
  lights go out), a bed with the body laid flat under a lamp that FLICKERS
  five times, a flat black figure with two white eyes in the corner that
  stands closer and taller after every dark beat, 3:33 AM in red over the
  bed, the grin (a half torus) as it stands over the bed, the lamp bursts
  in sparks and the body goes under the bed; the camera is a face cam
  under THE EYELIDS at 0.55 (a blink per flicker), a dolly-zoom on the last
  beat, the freeze on `crimson`, a low reverse), reptilian **The
  Unmasking** (`unmasking` — at the CASTER a green shell splits into six
  petals in a shower of scale sprites, a 26-segment serpent coils up out of
  the tile head-first (the segments follow a TRAIL of the head's positions,
  `_finChain`), a ● LIVE · BREAKING NEWS card rides beside the head, the
  lunge down the line with the jaws (two half-cones) opening, the snap takes
  the silhouette whole, a BULGE travels back down the body, the serpent
  slides home and fades; reverse OTS → a crane on the caster → a side
  dolly down the line → the freeze → a god shot; ON AIR terminal insert).
  One shared helper joined the block: `_finChain(n, r0, r1, mat)` (a
  tapering chain of spheres). Twenty-seven built of 99. Smoke-tested in a
  stub-THREE harness (every tick of every signature, every spawn finite —
  no rendered frame, RULE #1c); finishers.test.js (15) + `npm run
  test:quick` green. Not playtested: the tripod's scale (`H` / `legR` in
  `_sigAckAckAck3D`) against a low camera and its walk-in from beyond the
  rim, the heat ray's read under `crimson`, the beam's height (`BH`) in
  the sky watch, the re-entry trail's density, the saucer's hover against
  the crane, the table's height (`HOV * 0.62`) in frame, the three pieces'
  read, the pines' scale from the misc cache (`ts * 2.2–3.0`), the grain's
  cost (three `void-mist` spawns per 40 ms), the figure's flat plane under
  the face cam (it is a plane — a camera off its axis sees an edge), the
  dome's radius (`ts * 7`) against the reverse shot (a camera outside it
  sees a black ball — the director keeps the lens inside), the serpent's
  jaw geometry, the six camera paths. NEXT: the rows in roster order —
  robot, android, angel, seraphim, orb of light, demon.

- **2026-09-20 — SIX MORE EXECUTIONS in roster order (delivery 5).** The
  next six rows of `FINISHERS` after the telepath, each a director (battle.js
  `_FIN_DIRECTORS`) + a signature (three-vfx-effects.js "THE FINISHER PASS
  2", the DELIVERY 5 block) + a stage script (`_FIN_STAGE[sig]`): marksman
  **Danger Close** (`dangerClose` — the board goes to GRID (a wireframe
  lattice over the victim's 7×7 with the grid reference stamped over it), a
  red laser designator from the marksman's eye paints the tile, a reticle
  closes on it, ONE shell drops straight out of the sky on a smoke trail and
  the tile goes up in a fireball, dust column, debris; god shot → the sniper
  POV down the line (`cineSniperPov`, released before the fall) → sky watch →
  the freeze → a crane over the crater; the terminal insert `> fire mission`),
  priest **Excommunicated** (`excommunicated` — a cathedral RISES round the
  victim on the 3×3: walls with lancet windows, two towers whose bells swing
  and toll (a ring per toll), a rose window, a spire with a cross; the doors
  slam shut, then the whole cathedral lifts into the sky in a column of light,
  shrinking to a point with the victim inside; face cam → a slow crane → a god
  shot → the freeze → a sky watch), wizard **Abracadabra** (`abracadabra` — a
  top hat the size of a house drops over the victim, a wand the length of the
  line taps the crown three times (stars), the hat lifts on nothing (smoke and
  doves out of the brim), the victim reappears sixteen tiles up and comes down
  the hard way, TA-DA!; god shot → reverse OTS → a face cam of the empty tile
  → sky watch → the freeze), fortune teller **The Tower** (`theTower` — a
  tarot card the size of a building lowers over the victim back up, flips to
  XVI · THE TOWER (canvas faces), burns away, a crenellated stone tower rises
  in its place, lightning out of the sky strikes the crown (`_LT().bolt`, six
  bolts), the crown blows off, two figures fall, the tower splits and topples
  in halves; sky watch → a dolly-zoom face cam → a crane → the freeze → a slow
  side dolly), giant **Fee Fi Fo Fum** (`feeFiFoFum` — a hand the size of a
  house comes down, the fingers close and lift the body to the sky where a
  lidded EYE examines it (it blinks), two millstones roll in from off the map,
  the hand lets go over the hopper, the top stone grinds round in a spray of
  flour and a loaf rolls out; sky watch → face cam → crane → a low side dolly
  → the freeze → a crane; FEE · FI · FO · FUM stamps), fairy **The
  Changeling** (`changeling` — a ring of toadstools (the misc cache's two
  mushroom GLBs, else caps), twelve dancing lights, a sun and a moon chasing
  each other over the tile faster and faster, a clock over the ring running
  its hands forward, the silhouette greying, stooping and shrinking on a
  stick, the ring closing with a flash on a pile of dust — 100 YEARS; god shot
  → a crane under the hue grade → a dolly-zoom face cam → the freeze → a low
  reverse). Two shared helpers in the block: `_finBodyMesh` (the dark
  stand-in capsule), `_finTextSprite` (a camera-facing text card — a Sprite,
  the section's rule) and `_finFireball` (embers + smoke + a core).
  Twenty-one built of 99. Smoke-tested in a stub-THREE harness (every tick of
  every signature runs — no rendered frame, RULE #1c); finishers.test.js (15)
  + `npm run test:quick` green. Not playtested: the grid's read against the
  real board sheet, the shell's fall against a low camera, the cathedral's
  scale on a 3×3 (the walls are 3.0 tiles — `W` / `D` / `H` in
  `_sigExcommunicated3D` are the edits), the hat's brim against neighbouring
  units, the card faces' legibility (`_finTextTex` at 384 × 640), the bolts'
  colour under the whiteout, the hand's read from below, the mushroom GLBs'
  scale (`ts * 0.7`), the six camera paths — `cineSniperPov` inside a
  finisher is a first (it is released by hand before the sky watch). NEXT:
  the rows in roster order — martian, nordic, grey, bigfoot, shadow entity,
  reptilian.

- **2026-09-19 — SIX MORE EXECUTIONS in roster order (delivery 4).** The
  next six rows of `FINISHERS` after the Haymaker / Boot Hill / Shrink Ray,
  each a director (battle.js `_FIN_DIRECTORS`) + a signature
  (three-vfx-effects.js "THE FINISHER PASS 2") + a stage script
  (`_FIN_STAGE[sig]`): pirate **Keelhauled** (`keelhaul` — the misc cache's
  ghost-ship wreck (else planks, a black sail, the ☠ flag) sails through the
  sky along the caster→victim line, the rope from the bow hooks the
  silhouette, it is dragged forward UNDER the keel with spray, comes out
  astern and is slammed onto the tile; sky watch → slow-mo face cam → a
  fly-by along the line at half speed → the freeze → a god shot),
  swordfighter **A Thousand Cuts** (`thousandCuts` — eight afterimages blink
  round the victim, slash planes at a cadence that rises to a blur, a tally
  sprite counting to 1000 (forty cached textures), the sheath click lands
  every cut at once and the victim's column comes apart into slabs; face
  cam → a side dolly with speedlines at half speed → the freeze → a low
  reverse), knight **The Joust** (`joust` — a lance the length of the line
  materialises at the knight, a caparisoned charger of boxes under a banner
  thunders in from off the map behind the caster, the tip takes the victim
  and carries the body to the far edge and flings it; reverse OTS → a side
  dolly down the line with speedlines → the freeze → a fly-by), shaman **The
  Trip** (`theTrip` — a fairy ring of eight mushrooms grows round the
  victim, a breathing dome of hue-cycling wireframe rings, fourteen
  eye-motes spiralling in, the library's kaleidoscope + fractal tunnel on the
  tile, the victim folds inside out up the tunnel and the ring pops in a
  spectrum burst; a dolly-zoom face cam under the hue + invert grade → a
  crane → the freeze on INVERT → a god shot), men in black **Neuralyzer**
  (`neuralyzer` — the pen rises, the cone of light + a screen-wide white
  flash straight to camera behind THE EYELIDS, the victim's last five
  seconds rewind out of them (ghost frames stepping backward + the library's
  time rewind), then the black sedan (the cadillac clone darkened, else a
  black box on wheels) drives in along the perpendicular, the body drops
  into the boot, the lid slams, it drives off; reverse OTS → eyelids + blink
  → a side dolly → a god shot; the terminal insert `> memory --wipe`),
  telepath **Mind over Matter** (`mindOverMatter` — the eight tiles round the
  CASTER tear out of the board as columns in their own terrain sheet
  (`getTerrainAt` → `TERRAIN_SPRITES`, else the boulder sheet), rise, orbit
  the caster's head and slam into the victim one after another, the last
  and largest on the hit — VFX-only, the board keeps every tile; face cam →
  a god shot over the caster → a side dolly at half speed → the freeze).
  Fifteen built of 99. Smoke-tested in a stub-THREE harness (every tick of
  every signature runs; no rendered frame — RULE #1c). Not playtested: the
  ship's scale and heading off the wreck GLB (`glb.rotation.y` in
  `_sigKeelhaul3D` is the edit if the bow lands backward), the tally
  sprite's size, the charger's read against the knight's own model, the
  mushrooms' colours under the hue grade, the sedan's darkened materials,
  the tile columns' sheets, every director's camera path on the real board,
  `cineCrane` / `cineDollyZoom` / `cineEyelids` under a finisher (first use
  in one). NEXT: the rows in roster order — marksman, priest, wizard,
  fortune teller, giant, fairy.

- **2026-09-19 — THE FINISHER ON THE CIRCUIT + three more executions
  (delivery 3).** The user: "would still like to see the finishers and
  their animations in the party builder in the spell tree somewhere." The
  forge's TECHNIQUES circuit carries THE FINISHER STRIP under the root's
  bus (party-builder.js `PB_FIN_KEY` 'FIN' / `pbFinisherDef(race)` = data.js
  `getFinisherDefForRace` / `finStrip()` in `SpellTreePanel` / `FinisherPanel`
  under the lanes / `pbPreviewFinisher`; root ↓ walks to it, ENTER · SPACE ·
  ▶ · hover preview it) — the race's execution, its type colour, BESPOKE or
  TYPED EXECUTION, never a slot. The preview = three-renderer.js
  `EWCharViewer.previewFinisher(def)` (the `ultimate` charged-cast chain
  timed so its strike frame lands on the hit, the frame pulled wide and
  tall) + three-vfx-effects.js `VFX3D.stage.finisher(def, o)` → `_FIN_STAGE
  [sig]` (the director's VFX beats on the stage frame — the hero at (0,0),
  the dummy at (3,0)) or `_FIN_STAGE_TYPE[type]` (the six apocalypse
  directors' beats on one victim). RULE: a new bespoke finisher = the
  director + the signature + a `_FIN_STAGE[sig]` script (finishers.test.js
  insists). Three more BUILT: homosapien **The Haymaker** (`haymaker` —
  the fist winds up, the body goes round the world on a great ring and
  comes back into the fist), cowboy **Boot Hill** (`bootHill` — the rope
  from the sky, the yank, the coffin with the name plate, the lid, the
  cross, the tumbleweed), mad scientist **Shrink Ray** (`shrinkRay` — the
  ring beam, the shrink, SIZE: 1/40, the ACME anvil, the spring). Nine
  built of 99. Not playtested (RULE #1c): the strip's height on the
  circuit at the small breakpoints, the stage frame's pull-out against the
  monitor, each stage script's timing against the charged cast's strike
  frame, the fist's facing down the punch line (`fistPivot.rotation.y` is
  the edit), the coffin lid's swing, the anvil's silhouette, the three
  directors' camera paths on the real board. NEXT: the rows in roster
  order, three or six a delivery, each with its stage script.

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

- **2026-09-20 — the door agent (rev 3 of the race).** ONE bespoke execution
  with the race's rework: **OPEN HOUSE** (`openHouse` / `_sigOpenHouse3D` —
  six catalogue-leaf doors round the victim shot there from the door gun, the
  agent's body in and out of them on an accelerating cadence the director
  shares, every door open at once, the far door takes the victim, the slam).
  The director is the first to use the door section's rigs; the signature
  lives in "THE DOOR AGENT'S DOORS" (its groups through `_sigRunOwned`, its
  timers through `_fxDelay` like the pass-2 section). 52 of 99 built. Files:
  data.js, battle.js, three-vfx-effects.js, finishers.test.js, this plan,
  DOOR_RACE_DESIGN.md. Not playtested (RULE #1c) — the ring's radius (1.45
  tiles) against a crowded flank, the god shot's tilt over six doors, the
  body's lunge read at 110 ms, the take through the far door.
