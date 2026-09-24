# Notes: maps-terrain-battle

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). Battle maps, moving maps, horizon, planets, sky.
Append new notes for this system at the end of this file.

## MAP SETTINGS (near scenery) — added 2026-09-06
Every Δ board is dressed like the Training Room: a NEAR builder builds the
board's immediate surroundings (apron/plateau, moats, walls, buildings, trees,
props) in three-renderer.js `_NR_BUILDERS` ("MAP SETTINGS" block, right before
`_HZ_NEAR_BUILDERS`), keyed by `near: '<key>'` on the map's EW_MAP_META row
(data.js; folded into the Δ preset env → `state.mapEnv.near`). The far
floating roster (`env.scenery`) is untouched. Use the `_nr*` kit (apron,
moat, wall ring, room, blocks, trees, fence, lamps, props…) — never new
files. Enclosures opt into the line-of-sight fade with `occ:true`. Screenshot
any board with `NODE_USE_ENV_PROXY=1 node playtest_maps.js <map…>` (repo
tooling; see PLAYTEST_NOTES "MAP SETTINGS"). Kill-switch:
`window.EW_NO_FACILITY_SCENERY`.

## THE MAP-BUILDER BUILDINGS IN THE LANDSCAPE + THE FOLIAGE EVERYWHERE — 2026-09-14
The editor's **building_1..8** sprites stand in the urban landscapes as
prisms: three-renderer.js **`_nrSpriteBuilding(K, key, x, z, o)`** (right
after `_nrHouse`) = the board's own `_buildBuildingPrism` look — four faces
wearing the sprite between its alpha trim (ui.js `_alphaScanSprite`, async:
the prism is rebuilt through `_nrPending` kind `spr` when the scan lands), a
dark core, a brick roof at the sprite's roof line, **`stack`** storeys for a
tower (whole-sprite storey blocks — never RepeatWrapping, the sprites are
NPOT), `roofKit` mast + beacon from 3 storeys; **`_nrSpriteBlocks(K, o)`**
walks the `_nrBlocks` street (lots, alleys, gates, `only`, the neon signs)
with those prisms. Readers: `_NR_BUILDERS.cyberpunk` / `.strip` / `.downtown`
(the procedural `_nrBlocks` neon boxes are gone there — `_nrBlocks` itself
stays for anyone else) and the world rim's **`city`** kind (`_WD_RIM.city`:
every `city` rim row — Cyberpunk, the Stadium, the Strip, Downtown — is the
map-builder buildings stacked to `h`; `proc: true` on the row = the old
boxes; `keys` = another set). **THE FOLIAGE EVERYWHERE**: `_WD_RIM.trees`
plants `_nrTree` (the foliage OBJs — Tree_* / DeadTree_*; `h` tiles, else
1.5 × the old `s`) instead of `_nrTreeProc` — the Haunted House's rim was
the procedural trunk + sphere; the HQ site board's own trees
(`_hqBuildSiteBoard`) are `_nrTree` on a bare `_nrKit` instead of a trunk +
sphere; Bohemian Grove's redwoods are tall `_nrTree`s. Late fills join the
world haze through **`K._wdFog`** (set in `_worldBuild`) → `_nrInjectWorld`
(the foliage swap and the trim rebuild both call it — a material made after
`_worldBuild`'s traversal is otherwise unfogged and undissolved). The HQ
loop polls `_nrPollPending` UNCONDITIONALLY now (the board's trees swap
without a setting). `npm test` runs `landscape-buildings.test.js`. Unseen
live (RULE #1c): the prisms' scale against the board's own buildings, the
trim landing (a flash from untrimmed to trimmed), the rim tree count on
the Haunted House (48 + 58 OBJ clones).

## MOVING MAPS — the setting travels (2026-09-12, rev 2 the same day)
Three sites whose WORLD streams past the board, faster every round —
**Room 1717 · THE FLYING DUTCHMAN** (`prebuilt_revenge` — the id stays,
the label / names / site file / cast lines were renamed from Queen Anne's
Revenge in rev 2; Hollow bay: the main deck of the ghost ship, bow to +X,
a wood-and-deep-water bed, the sea racing past into a storm), **Room 426 ·
THE DERELICT** (`prebuilt_derelict`, Celestial: the DORSAL DECK of a dead
starship, void under hull plate, the wreckage field streaming by as it
swings in close to the SUN) and **Room E4 · THE LOOKING-GLASS**
(`prebuilt_lookingglass`, Diplomatic: a marble chessboard flying through a
void of unfinished shapes, the Cheshire MOON swinging in close). Heaven
drifts too (a gentle one). **Rev 2 added four more movers**: Stonehenge
and Area 51 WHEEL (the far roster + the dome turn about the board), the
Tower of Babel RISES (the world streams down past a climbing board), Hell
SINKS (`dir: -1`). The board itself NEVER moves (every rule, pick and
camera is untouched); the ENVIRONMENT does. One row does it all:
`env.motion` on the EW_MAP_META row (data.js) — `{ kind: sea|space|void|
drift|wheel|rise, axis: 'x' (the streaming kinds), dir: ±1 (rise), speed
(tiles/s at round 1 — for `wheel` tiles/s along the ring at the roster's
radius, so the dome and the roster turn as one), ramp (per round), max
(multiplier cap), sea + seaDepth (the moat sheet streams), sky (dome
cloud/nebula flow; the yaw on a wheel; the lift on a rise), storm: { from,
to } (overcast builds between those rounds), orbit: { body: sun|moon,
period (tiles travelled), near 0..1 } (a close pass that SWELLS the sun /
moon), ambience (an audio.js bed) }`. Rev 2 PACE: the three travellers run
3–3.6 tiles/s at round 1 with a 5–5.5× cap (15+ tiles/s by round 17) —
motion-maps.test.js insists on ≥ 3 / ≥ 5; tune `speed` / `ramp` / `max`
on the row. three-renderer.js **MOTION** block (right before
`_buildHorizonScenery`): `_motionTick` (distance, eased speed = speed ×
min(max, 1 + ramp·(round−1)) — reads `state.round`, which SYNCS to the
guest, so online both seats see one speed with nothing relayed, RULE #2;
`_motion.ang` / `skyYaw` on a wheel, `skyLift` on a rise),
`_hzPlaceStream` (streaming kinds: the far roster laid along the travel
band and WRAPPED instead of the ring; wheel / rise: placed ON the ring and
then turned about the board / streamed up a vertical band by
`_motionPlace` — `e.mode`; rows may carry a sixth field `'sea'` = on the
water / `'door'`), `_motionBuildMotes` (spray / dust streaks stretched by
the speed; sparks orbiting on a wheel, vertical streaks on a rise),
`_motionAnimate` (streams, sheets, wake textures, motes — from
`_animateFloaters`). Sky: `uSkyFlow` / `uSunNear` / `uMoonNear` /
`uSkyYaw` (rotates `rd` about Y — the whole dome wheels, sun and moon
included) / `uSkyLift` (the cloud fbm's second axis) on `_envUni`; the
dome swells the sun / moon, the 3D moon mesh scales with it, the map tint
gilds near the sun; `_hqTickSky` zeroes them all — the building is still.
Sea: `_nrMoat({ stream: true })` registers the sheet in `_motionSheets`
(slides one tile and wraps — seamless), the caustic web follows through
`_fluidFlowUniform` / `uFluidFlow` (reset by `_hqTickMoat`).
**THE HULLS (rev 2)**: `_nrLoft(rings, ts, { open, capStart, capEnd })`
is the one lofting helper (R rings of N points → an indexed surface, UVs
in tiles, DoubleSide it); `_nrShipPlan(K, { hb, sternX, prowX })` the
deck plan of a ship (a rounded transom, a clipper bow), `_nrPlanRing` /
`_nrPlanDeck` its rings and deck. The Dutchman is that plan lofted to a
keel with tumblehome + a rounded bilge, two wales, the deck cut to the
plan, a BULWARK ribbon following the sheer with the gangways open at the
spawn lanes, stanchions and `_nrTorch` TORCHES in brackets on every third
post (the game's torch model, `_torchRegisterFlame` entries wearing
`_ew_nr` so `_buildHorizonScenery` prunes them with the setting, point
lights on eight + the prow torch, reach 2.4× a floor torch's), the
sterncastle lofted off the stern of the plan (transom windows, the name).
The Derelict is a FUSELAGE of rounded-box sections along X (a blunt stern
with three burning engine bells + plumes, the widest section under the
board, a drooping nose), the deck plate = the deep apron on its back with
a lip, nacelles on pylons, the bridge forward, flank light strips, running
lights, a breach with sparking cables. **`_ew_occSkip`** on a mesh exempts
it from the line-of-sight fade (`_occComputeBlockers` skips the hit): the
hull / fuselage / deck the board rides on carry it — their closed back
lies under every tile, so the jittered rays below a subject's feet hit it
from any angle and the whole ship faded out. Hull materials carry a
STRONG self-lit `lift` (0.4–0.55): a plain Lambert side face is black
under a night sky / in space. Both hulls are battle-only (`!HQ`) — the
site room keeps its quay. **THE PIECES (rev 2)**: the Looking-Glass's
cover is six chess MONUMENT kinds `chess_pawn / knight / rook / bishop /
queen / king` — 1×1 tile boxes in map.js `_MON_GRID` (pawn + knight 2
high, the rest 3: they block the way AND the sight like any block) mirrored
in three-renderer.js `_MON_GRID` and delta-maps.test.js, allowed on Δ
boards by `MF_DELTA_SOLID_MONS`, placed by the forge's `M.pieceSym(kind,
x, y, h)` (the authored one dark = P2's half, the twin light), built by
`_hzChessMon(kind)` (the `_hzChessPiece` lathe, slimmer via its new
`rMul`, on a plinth that fills the tile so the horizontal-first fit leaves
the piece slim; lit Lambert). Monument builders now receive `(rng, mon)`
in the battle AND the site room — `mon.dark` is the only reader so far.
The editor catalogue lists them. Three far rosters (`sea` · `wreckage` ·
`wonder`) and three settings (`_NR_BUILDERS.revenge` / `.derelict` /
`.lookingglass`; `_hzChessPiece` is the lathe both the rim and the roster
use; a setting must skip its wake / rigging / hull under `K.hq`). Cost:
uniform writes + one position write per streaming body per frame.
Kill-switch `window.EW_NO_MAP_MOTION`; `EW_PERF_LOW` halves the motes;
readout `ThreeRenderer.motion()` (now with `angleDeg` / `skyYaw` /
`skyLift` / `dir`). The Δ FORGE takes a per-board bed (`cfg.strata` /
`underTop` on `_mfDeltaNew`, recorded as `entry.bed`). Adding a moving
map = the 7.10 checklist + an `env.motion` row (+ a roster if none fits);
a wheel / rise needs NO new roster (the map's own turns / streams).
`npm test` runs `motion-maps.test.js`. **Screenshot them** with
`NODE_USE_ENV_PROXY=1 POSES=far,side,bow node playtest_maps.js
prebuilt_revenge prebuilt_derelict` (the tool was re-pointed at the CRT
match-select in rev 2 and launches through the selection mirrors;
`PROBE_EVAL='<js expr>'` prints any page value, e.g. `ThreeRenderer.
motion()`; see PLAYTEST_NOTES "MOVING MAPS rev 2"). First things to
eyeball: the pace at round 1 and the cap, the Dutchman's env light (rev 2
lifted the tint a notch — she is still a dark map), the wheel's rate on
Area 51.

## THE SPACESHIP (was THE DERELICT) + THE CARGO STACK + MOVING MAPS rev 3 — 2026-09-13
`prebuilt_derelict` (the id, the `near: 'derelict'` key and every builder
name STAY) is labelled **Spaceship** everywhere the player reads it: the
meta row, both forge builders, the race home-site table, Room 426's sign.
The deck is plain brushed **`aluminium`** (base / deltaPad / the doorway
tiles / finishSpawns / the site room's floor + apron, tint `#8e98a2`) —
the `metal_3` grate was too busy for a floor; the bulkhead stubs stay
gunmetal. The fuselage (three-renderer.js `_NR_BUILDERS.derelict`) wears
the same sheet at a coarse repeat (`HULL_UV` 0.7 × HZ_TEX_DENSITY → one
texture per ~3 tiles: grain, not tiles), FRAME RIBS at every other
station (thin dark `_nrLoft` bands proud of the skin, `_ew_occSkip`) and
four flank hatches — plain with a little texture; swap the key in the two
`K.mat('aluminium'` / `_hzTex('aluminium')` sites if the sheet reads
wrong live. **THE CARGO STACK** replaces the specimen tanks on this map
only: monument kind `cargo` (three-renderer.js `_hzCargo` — three strapped
freight crates on a pallet, corner frames, a hazard band, a status lamp;
authored at exactly 1 × 3 tiles), a GRID monument `[1, 1, 3]` in map.js /
three-renderer.js `_MON_GRID` + delta-maps.test.js (a full-height wall,
the same collision the tank had), in `MF_DELTA_SOLID_MONS`, in the editor
catalogue (📦 Cargo Stack). `greytube` is untouched for Area 51 / D.U.M.B.
**Rev 3 pace**: the travellers run 5 / 6 / 5 tiles/s at round 1 with a 7×
cap (Dutchman `ramp` 0.4, Spaceship 0.45, Looking-Glass 0.4); Stonehenge
2.4 / Area 51 4.0 (wheel), Hell 1.6 / Babel 1.8 (rise), caps 5–6; Heaven's
drift unchanged. motion-maps.test.js insists on ≥ 5 / ≥ 7. Screenshotted
offline (every CDN is egress-blocked in this sandbox: a scratch variant of
playtest_maps.js served three / React / MeshLine / socket.io from
node_modules and the scripts from the repo — geometry only, no textures):
the ribs, the hatches and the stacks render, zero page errors,
`ThreeRenderer.motion()` eased to 5.3 tiles/s at round 1. The textures
themselves are UNSEEN — the user eyeballs the sheet live.

## THE CRATER FIX + THE WADE (the roofed-over crater) — 2026-09-13
Two "my unit is under the floor" bugs, one delivery. **BATTLE**: THE
WORLD's ground disc (`_worldBuild`, `world:ground`; the moat maps'
`world:liquid` disc too) was a FULL circle 2.5 px under the base tile
tops, spanning under the whole board — so every tile dug below the base
(Meteor's `terrainDeform`, the Build dig, Flat Earth) was ROOFED OVER: the
engine had the crater, the unit dropped into it, the eye saw a flat board
with the unit under it. Now `_wdIslandDisc(K, R, ts)` = the disc with the
BOARD FOOTPRINT (`K.BX0..BX1 × BZ0..BZ1`, grown 2 % of a tile) cut out
(a `THREE.Shape` with a hole; the board's own voxel columns fill that
footprint to y 0 and their faces are the crater's walls; the apron covers
the seam). RULE: nothing of the world / a setting may lie under the tiles
inside the footprint — a crater must always open onto the columns' own
faces. world-ground.test.js fails on a `CircleGeometry` under the island.
**HQ**: `_hqSurface` dropped the walker to a walkable LIQUID cell's BED
(a lake: −1.75 m; deep: −3.5 m) under the sheet drawn at −0.3 m — the
walker vanished under the water. Now a fluid cell (the moat included) is
WADED at `HQ_WADE_M` (0.55 m — thigh-deep, always visible); a dry pit (a
trench) is still a drop to its floor. doorhq.test.js guards it.

## THE WORLD — grounded ↔ floating (the horizon pass) — added 2026-09-13
Every Δ board used to end at its square apron in the sky. Now a map's
**`env.world`** row (data.js EW_MAP_META, all 32 launch maps; the doc
comment above the table lists the fields) continues the SETTING to the
horizon and lets ENTROPY take it apart — three-renderer.js **THE WORLD**
block (right before `_buildHorizonScenery`): `_worldBuild(nearCtx)` runs
at every `scene.add(_horizonGroup)` site AFTER the near builder (it reads
`_nrLastKit`, which `_nrApron` / `_nrMoat` now stamp with `tex / color /
skirt / skirtColor / moatPad / moatDepth`) and builds into `_horizonGroup`
(**never give that group a `renderOrder`** — a Group's order buckets its
children before the dome, whose depthTest is off, and the sky paints over
them; that cost an hour). Pieces: **the ground** (`kind: 'plain'`, a disc
in the apron's sheet 2.5 units under the apron top; a moat map gets a
LIQUID disc under its sheet first and the land from the SHORE = apron +
pad outward with a BANK; `sea: true` = the liquid to the horizon), **the
haze** (`_wdInject` = a Lambert `onBeforeCompile` chain: radial fog
toward the dome's own `uFogColor` from `fogR0` (shore + 3) to `r` (56
tiles), tagged `_ew_hzNear` so `_applyHorizonFog`'s altitude fog leaves
it alone), **the rim** (`_WD_RIM` builders on `_wdRing` circles — peaks
(`mesa`, `snow`) / hills / dunes / trees (`_nrTreeProc`, never the OBJ
swap) / town (`_nrHouse`) / city (+ glow sprites in `_wd.extras`) /
spires / bergs / ruins / pyramids / craters; `K._wdMinD` = the shore + 2
keeps every one out of the lake; a peak's radius is ≤ 0.3 × its ring
radius — fatter and they carpet the ground), **the wall** (`kind:
'cavern'` + `wall`, a ruffled cylinder fading UP into the haze, `mode
1`), **the root** (`_wdBuildRoot`: a superellipse lathe under the apron
in the skirt's sheet darkened ×0.62 + stalactites, `root: false` under a
hull; on a moat map the island is its SHEET, so the root spans apron +
pad and hangs from `moatY` — the player's eye never goes under the tile
tops (three-camera.js FLAT FLOOR), so it is seen at grazing angles only). **THE
DISSOLVE**: `_wd.stab` (1 grounded → 0 adrift) eased in `_worldTick`
(called in `_updateEnvironment` right after the horizon build, i.e.
after `_applyDomeFog`): the world beyond `uWdKeep` is `discard`ed per
fragment with an fbm edge that burns in the gauge's violet, veins crack
the ground inside it, the root grows down, and the dome's fog is driven
to FULL at / below the horizon (`uFogAmount → 1`, `uFogTop → fogTop`,
band = top — the retro filter's fog too) while the ground holds, so the
ground's far edge and the sky are one colour. Target = `mode`
(`ThreeRenderer.getWorldMode / setWorldMode`, localStorage
`ew_world_mode`, `window.EW_WORLD_MODE`): **entropy** (default — 1 − the
fuller team's `state.entropyGauge`, cracking from 12 %, adrift at 96 %,
reforms after the strike resets it; the gauge SYNCS, nothing relayed,
RULE #2) · **grounded** · **floating**; `kind: 'void'` (Heaven, the
Spaceship, the Looking-Glass) never grounds, `kind: 'room'` (D.U.M.B.,
CERN, Backrooms) is inert. Settings row "World" (map.js
`_buildWorldModeHTML`, pause menu + main-menu Display). Dev:
`window.EW_WORLD_STAB = 0..1` pins it exactly; `ThreeRenderer.world()`
reads stab / keep / the fog uniforms; `hq.dev.renderer()` = the WebGL
renderer for shader diagnostics. The wheel-zoom floor is **0.3** now
(state.js ×3; the world runs out at 56 tiles). `npm test` runs
`world-ground.test.js`. Screenshots: `node playtest_world.js <map…>`
(repo tooling; CLEAN=1 = no retro filter; POSES / STABS / EXPERIMENTS /
PROBE_EVAL — see PLAYTEST_NOTES "THE WORLD") — every CDN is blocked
here, so it serves the repo scripts, node_modules copies of three /
React / socket.io / MeshLine and GENERATED stand-in textures coloured by
file name; the real sheets are unseen — eyeball live first.

## THE PLANETS + THE ONE TINT + THE STREET (the visual pass) — 2026-09-16, local delivery
The user: "I don't get the impression I'm on a planet — a little curve to
the edges; the mounds that are supposed to be craters are upside down;
Saturn doesn't look like Saturn; the 8×8 surface looks different from the
landscape; mountain textures are stretched; the urban street sheet has a
direction." **THE PLANET** (`env.world.kind: 'planet'` on Mars / the Moon /
Saturn, data.js): THE WORLD's ground IS the near apron — the builder's
`_nrApron(K, { planet: true, … })` builds NO box, and three-renderer.js
**`_wdBuildPlanet`** (right before `_wdIslandDisc`; `_wdPlanetProfile` is
the height + colour function) lays ONE surface from the board's edge to the
horizon: a flat COLLAR round the board's square (`rb`), the flat ISLAND to
the apron zone's corners (`ri` = half·√2; never dissolved, the root hangs
under it, round), then the FAR RING falling on a parabola (`curve` = tiles
of drop at the horizon radius — the edge of the map curves off like a ball;
dissolved + hazed like any world). **CRATERS ARE CARVED, NEVER STOOD**: the
builder registers them (`_nrCrater(K, x, z, rTiles, { depth, rim })` /
`_nrCraterField(K, { n, r: [min, max] })` → `_nrLastKit.craters`; refused
on the collar, in a lane, on a `K.keepOut` prop or over another crater;
`K.inCrater` keeps the mounds / rocks out), the row's `craters: { n, r, d0,
depth, rim }` scatters the far field, and the mesh carries them (a
parabolic bowl, a raised rim, the floor in shade). `_WD_RIM.craters` on a
non-planet is a lathe bowl now (`_wdCraterLathe`) — the torus is gone, and
so are the `_nrMounds` on the planets. Rim builders read `c.yAt(x, z)` so
peaks / hills stand ON the curve. **SATURN**: `bands: [[tiles, hex], …]`
(latitudes are concentric round the pole) and `hex: { w, color, amt }` (the
storm, at the builder's `hexR` = the island's edge + 3 tiles) are VERTEX
COLOURS on the deck; the builder stands six wispy storm WALLS on the
hexagon's edges and THE RINGS (`_hzSaturnRingTex`: C · B · Cassini · A ·
Encke · F on one canvas, `_hzRadialUV`, a 40–122-tile annulus tilted 0.2
rad + a dark shade sheet under it — the deck hides the near half, the far
half arcs low over the horizon; a steeper tilt puts the arc above the
frame at the game's pitch, measured). **THE ONE TINT** (`K.mat`): the
board's per-terrain tint (`state.terrainTints` / `HQ.tints`) is applied
ONLY when a builder passed no colour of its own — every builder that
passed the Δ's own hex was tinted TWICE (0.78² = 0.61), which is why the
apron never matched the board; and `_nrApron`'s TOP face is a plain
Lambert like the tiles (`lift` 0 — the 22% emissive lift stays on skirts
and walls). The planets' ground is the board's OWN sheet + tint (Mars
`moon_2` × #c88a5a, the Moon `moon` × #c8ccd8). **THE CONE UVs**:
`_nrConeUV(geo, r, h, ts, dens)` — u round the base's PERIMETER, v up the
slant; the old `r / ts` stretched every peak / spire / pyramid (near and
rim) ~6× sideways. **THE STREET**: sprites.js `urban_street` → the concrete
sheet, darkened by **`TERRAIN_BASE_TINT`** (`_evBaseTint`, multiplied BEFORE
any map tint in `_evTintMat`, `K.mat` and `_hqMat`) — direction-free
asphalt for every street; the old `urban_street.png` stays in the bucket
unreferenced; `road` is untouched (a dirt road on the fantasy maps).
world-ground.test.js knows the kind and guards the planets. Screenshotted
offline with `CLEAN=1 POSES=wide,far,horizon,vfar node playtest_world.js
prebuilt_mars prebuilt_moon prebuilt_saturn` (stand-in textures: the
curve, the bowls, the hexagon and the rings are verified; the SHEETS are
not — RULE #1c). Unseen live: the real regolith sheets in the bowls, the
concrete-as-asphalt tone (`TERRAIN_BASE_TINT.urban_street` is the edit),
the ring's brightness against the real sky.

## THE DAY SKY — areas that are sunny and blue (2026-09-21, local delivery)
The user: "downtown's buildings look lit for daytime but the sky is still purple / dark;
definitely need areas that are sunny and blue." ROOT CAUSE: the dome shader (three-renderer.js
`_envDomeFS`) was only ever a DEEP-SPACE gradient — `night: 0` merely lightened the purple, and a
day row's pale `tint` washed it grey; no blue sky existed anywhere. NOW: `env.day: 1` on an
EW_MAP_META row (or a shell's `sky`) lays a real daylight atmosphere over the tone-mapped cosmic
backdrop — a blue zenith to a pale horizon, a grey-blue below the horizon line, the same sun as a
disc + a warm glow, cumulus from the fbm at `env.clouds` (0 clear … 1 overcast; a storm weather is
a full overcast, an overcast greys the blue), still washed by `tint` / `tintAmt` (a warm tint = a
desert noon). The day YIELDS to the night cycle in a battle (`dayK = uSkyDay × (1 − night × 0.9)`)
and to a sky event. Uniforms `uSkyDay` / `uSkyClouds` on `_envUni` (`_ENV_COMMON`), eased by the
battle's `_updateEnvironment` (`_envSmooth.mapDay / mapClouds`), written by the HQ's `_hqTickSky`
from the room's sky row. THE DAY ROWS: Downtown (retinted sky blue, the city shell's plain day
literal matches — hq-city diffs them), the Stadium (now a daylight game — was a night tint),
Shasta, Giza, Heaven, Babel, Olympus, Antarctica (overcast), the Vatican, Göbekli Tepe, the Flat
Lands (overcast), Bermuda; every hand-copied shell sky of those rows (hqDivineShell,
hqVaticanShell's day, the castle in the sky, the ley plateau / tell / tower, hqSeaShell, Room 8,
the garden) carries `day` too — `day-sky.test.js` fails naming a room that wears a daylight row's
tint without its day. The night rows (Cyberpunk, the Strip, Camelot, Hell, the Moon, Area 51,
the Haunted House…) and the void / cavern rows are untouched. Adding a sunny place = `day: 1,
clouds: n` on its row (a generated area copies it through `hqAreaSky`). The menu biomes stay dusk.
Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): the blue's saturation under each map's
tint (`tintAmt` is the edit), the cloud density, the sun's glow at the game's pitch.

## THE FLOATERS · THE HALF WELL · THE ALLEYS (2026-09-22, local delivery)
The user's three: "floating objects on the Looking Glass, Mars, Technoticlan; the wells are too big; gaps between
buildings that look like alleys but have invisible walls — make them alleys or close them". **THE TIER HEIGHT**
(three-renderer.js `_hqPlaceProps`): in a room with ground (a terrain field, a cave grid) a floor prop's `y` was ADDED to
the ground under it, while every D3 spec (and the natives, the doors, the tests) author `y` as a HEIGHT FROM THE FLOOR —
the sarcophagus at `y: 3.0` on the 3.0 m priest house stood at 6 m; a census (a scratch over every terrain room) counted
344 such props. THE RULE: a floor prop's `y` ≥ 1 (or ≤ −0.5, a sunk cellar) lands at **max(the ground, y)** — on its tier
when it stands on one (a tier's edge blend reads low), where it hangs when it hangs; a small `y` (< 1) is still the lift
over whatever ground is there (a terminal on a cabinet on a terrace, a sheet of paper on a hill). Never add a prop's `y`
to a tier's height again. Also THE HEDGE WALK (the Garden): the span's west end stood 0.7 m off the White Queen's tower
over its edge blend (a bridge's ends stand 0.8 m INSIDE their tiers — `x0` −15.7). **THE HALF WELL**:
`_hqWayBuilders.well` builds at `WS` 0.5 (every metre × WS), `ancient_well` h 1.15 / foot 0.42, `wooden_bucket` h 0.16,
`ways.well` w 0.8 / h 0.5. **THE ALLEYS** (data.js `_hqTGenerate`, the city branch after THE OVERLAP SWEEP;
`HQ_TERRAIN_GEN.city` `alleyMinW` 2.0 (the solver's floor — an alley centred between two grid rows must still hold a cell
past the 0.3 m solid pad) · `alleySlitW` 1.0 · `alleyMaxW` 6.5 · `alleyMinD` 4 · `alleyMaxD` 30): every run of a street face no
lot covers is judged by its WIDTH — 2.0..6.5 m between two buildings is CARVED OPEN along the face's normal, cell by
cell, until it reaches open ground (a THROUGH alley) or a lot / a tier / the shell (a dead end, kept only ≥ 4 m deep —
THE BOUNDARY WALLS hoard its end, THE INFILL never packs it, its sides are the buildings' own walls and take fronts); a
gap of 1.0..2.0 m — THE SLIT the eye reads as an alley — is WIDENED into one by a neighbour stepping back (never under its
district's `lotMinW`) when the march proves the alley goes somewhere, else CLOSED by growing a neighbour lot across it (never
into another lot, never past its `lotW`, its front corners kept on the face line); EVERY carve is PROVED by the solver itself
(`_hqTReachGrid` from the mouth to 1.2 m in and to the far end on the carved mask) and un-carved + closed when it fails; no
hoarding is ever laid across or beside an alley's corridor (`inAlley` in both wall passes — a dead end's END keeps its); what
stays is a slit under
`fenceMinRun` **0.4** (the street-face pass samples every 0.25 m now — a 1 m slit was one sample under the old 1.2 and
got NOTHING: that was the invisible wall) and wears the hoarding; the yard-wall pass never fences a PASSAGE (open mask
within 2.6 m behind — a hoarding on a pocket's mouth stranded a drop-in); the boundary trace keeps its own
`boundaryMinRun` 1.2 (a shorter corner sliver penned four cells on the Strip). The mask's distance is rebuilt after the
carve; readouts `info.alleys` / `info.gen.alleys` / `info.gen.alleyRuns` (`alleys · widened · closed · closedFail · yards · shallow ·
lone · unwalked`), `node check-terrain.js <room>` prints `alleys n`. Measured: Downtown 2 alleys, the Grid 4, the Strip 1 (most
gaps are slits under a metre, closed or hoarded); all three solve from every door with nothing trapped. `gen.alleys: false` keeps the old faces. Tests:
hq-city.test.js THE ALLEYS (heavy), hq-areas.test.js THE TIER HEIGHT, misc-batch-0922's well pins. UNSEEN LIVE (RULE
#1c): the props on their tiers in every area, the well at half size against the walker, the alleys' mouths between the
prisms (the hoarding at a dead end, the fronts on the sides), the slits' hoardings.

## THE MAP FIXES — THE POP WRAPPER · THE PORTAL PER DOOR · THE GEOGRAPHY (2026-09-23, local delivery)
The user: "in the close-up area maps all of the location names are overlapping and I can only click on the
middle node; the cavern is right in between the estate and the woods." **THE POP WRAPPER** (the bug): the reveal's
`.hq-map-n.reveal.pop` animated `transform` on the node's `<g>`, and a CSS transform OVERRIDES an SVG element's
`transform` attribute — every popped node collapsed onto the sheet's origin for good (`animation-fill-mode: both`),
every label over every other, the topmost the only one under the pointer. map.js `_hqMapSvg` / the world sheet wrap
a node's contents in an inner `<g class="hq-map-nb">` and styles-base.css plays the pop on THAT (`.hq-map-n.reveal.pop
> .hq-map-nb`). RULE: never animate `transform` on an element that carries a `transform` attribute. **THE AREA SHEET**:
`_hqMapLabelPlan` shows a part's name at the fit on a place's own sheet (`M.area` set — the collision boxes alone
decide; the whole map keeps its zoom ladder); `_hqAreaModel` makes a PORTAL PER DOOR — a room outside the place is a
small exit node BESIDE EACH ROOM of the place that opens onto it (the same room id on every copy, `key` = `<out>@<via>`
for the layout + `data-mapkey` for the label plan; an edge between two outside rooms is never drawn); `_hqAreaLayout`
hangs a portal as a LEAF of the radial tree off the first room reached (its own slice of the circle, weight 0.75), the
ring is 1.7 units, and an edge carries its own ends (`e.ax / ay / bx / by` — `_hqMapSvg` reads them before the node's).
**THE GEOGRAPHY** (data.js `HQ_WORLD_L.slots`): the SURFACE north of the building (the kingdom at twelve, the woods +
Shasta + Agartha north-west with the estate, the grove and the lodge below them on the west, the divine stair and the
astral realm north-east, the city east), the UNDERGROUND south (the cavern due south-west with the ley lines west of it
and the D.U.M.B. east, the underworld under the city, the deep off the coast, the space route beyond it, the bases and
the ice along the bottom) — nothing on the woods ⇄ estate line. Screenshotted offline (the test harness's SVG under
headless chromium — no animation, no label plan); hq-map.test.js green. UNSEEN LIVE (RULE #1c): the pop landing in
place, the plan's offsets on the crowded sheets, the octilinear lines over the new slots.
