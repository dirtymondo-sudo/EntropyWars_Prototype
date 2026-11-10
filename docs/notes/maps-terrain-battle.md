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

## THE SHIP UNDER WAY — the Spaceship deck is a starship flying through space (2026-10-05, token 20261005-spaceship-01-cors)

R2 files: data.js, three-renderer.js. Repo: index.html (token), docs.

mondo: "why is the spaceship deck / battle map like a landscape? it needs to be a spaceship, similar to the flying dutchman map
but flying through space". WHY: since E8 the Spaceship's PvP map is the 8×8 arena cut of THE DECK (`site_prebuilt_derelict_deck`,
an HQ_AREA_SPECS terrain room), and a fight on a terrain room draws the room "to the fog": the open terrain room's OUTER GROUND
(the plate run on past its edge, rising into low hills under the fog) — a landscape — while hqFieldLayout dropped the Δ's
starship (`near: 'derelict'`) and its `motion`. The Dutchman never had this: its rooms are seas, so it kept its Δ.

- **THE HULL** (three-renderer.js `_hqBuildHull`, called from `_hqBuildTerrain` when `terrain.float.hull` is set; data.js
  hqAreaRoom now passes an area spec's `float`): the deck is a FLOATING ground (no outer ground) and under it hangs a starship
  in room metres — the skirt down the field's own rim to a belly plate, a 0.75 m bulwark on the rim (cut at every door on a
  wall), the fuselage lofted along +x (bow east, stern west: the motion's axis), three engine bells with plumes astern, a nacelle
  on a pylon each side, the bridge on the nose with lit windows and a mast, light strips, blinking running lights. One merged
  mesh per material (~8 draws + 5 sprites). Group `hqHull`, `_ew_hqPart: 'underside'` (the battle radius keeps it). Keys on
  the spec: `float: { hull: { depth, beam, height, stern, nose } }`.
- **THE VOYAGE** (data.js hqAreaSky `voyage` → `shell.sky.voyage` = the site's env.motion): the walk lays the sky's far roster
  along the travel band and streams it past (three-renderer.js `_hqBuildSky` / `_hqTickSky`, own rng — still rooms unchanged),
  the nebula flows (uSkyFlow), 36 dust streaks race by beside the hull. In a fight, hqFieldLayout `voyage` keeps the site's
  `motion` + far roster (`scenery: 'wreckage'`) for an open terrain field (the arena and the story encounters on the deck), so
  the room stands still and the space streams past, faster every round — the Dutchman's rule. `_hqBuildRoomInBattle` does not
  hand the walk's sky over on top of it; `_hzPlaceStream` / the motes keep clear of the room's hull (`_hqBattleRoomKeepLat`).
- The arena window is unchanged (the float changes no height): hqArenaUpgrade still fits (checked headlessly). No relay needed:
  the guest reads the same layout and state.round drives the speed.
- Checked: the Spaceship Arena TDM and the walk on the deck in WebGL (scratch Playwright, no errors). WebGPU could not run in
  the sandbox's Chromium (three 0.186's texture-view `swizzle` is unsupported there — every frame throws with or without this
  change); the hull uses only Phong / additive Basic / Sprite / CanvasTexture, all already on the WebGPU path.

## THE ROOF OVER THE CITY (2026-10-05) — the Vatican observatory
mondo: "why is the vatican observatory a landscape? it should be like the top of the vatican building looking out over
vatican/italian city." The observatory (data.js `site_prebuilt_vatican_observatory`) was an open terrain room: its field ran on
past the parapet as outer ground to the fog, and its own 8×8 Δ played on the site's plain (rim city + hills).
- **The walk + its field fights**: `terrain.float: { roof: { depth: 30, lower: 7, cityR: 125 } }` — a floating field (no outer
  ground) and three-renderer.js `_hqBuildRooftop` → `_vrRoofCity` under it (called from `_hqBuildTerrain` beside the hull, so
  `_hqBuildRoomInBattle` gets it too). Built in metres in a frame (u, ox/oy/oz): THE TOWER under the terrace (cornice, one row of
  tall windows), THE BASILICA's body round its foot `lower` m down (flat travertine roof, cornice, window rows, the façade's giant
  columns on the south, angel statues along its top), THE DOME (vatican_dome GLB, 44 m) off the roof to the west, THE PIAZZA south
  of the façade (paving ellipse, obelisk, two colonnade arms of greek columns), THE CITY on the street `depth` m down (Italian
  building 1/2, a church in ~6 % of the cells, on a jittered 26 m grid out to cityR, kept off the body and the piazza) and a
  cobbled ground disc out under the fog. Each GLB = one InstancedMesh per piece (`_vrInstances`, Lambert + a self-lit lift; the
  cache's geometry flagged `_ew_shared`); nothing drawn until the file lands. Windows: dark glass panes, ~20 % lit warm (opaque
  Basic, no additive). Shell: `fogD: 0.013` (hqVaticanShell's new option) and `heightFog: { floor: -30, h: 9, amount: 0.3 }`
  (the mist lies in the streets, not on the terrace).
- **The room's Δ board**: a room may carry `deltaEnv` (merged over its area Δ env by data.js `_mfAreaDeltaEnv`); the observatory's
  is `{ near: 'vatican_roof', world: { kind: 'void', root: false } }` — `_NR_BUILDERS.vatican_roof` lays a marble apron with a
  parapet round the 8×8 and runs `_vrRoofCity` under it (u = ts / 1.75).
- The Vatican's PvP arena is cut from the basilica (HQ_ARENA_RULES.picks), so no re-bake was needed. Visual only: the guest
  builds the same scenery from data (no relay).

## THE DRAPED MARKERS (2026-10-13, mondo)
"All tile highlights need to work the same as move highlights for following the surface of the map, not perfectly
straight squares that the terrain clips through." three-renderer.js `_drapedTileMesh(x, y, frac, mat, yOff)` builds any
tile marker from the move tiles' own `_buildDrapeGeo` (natural landform, bevel swell, stairs, field ground, skin line)
placed by `_drapedTileY` (tileTopY + yOff + roof lift + field lift; `_makeHlTile` uses the same). Now draped: the hover
cursor + the selected tile (`_buildCursorMesh`; a sub-floor pick under a roof stays a flat plane at its own floor), the
underfoot decal, spawn-zone washes, zone fills, standing-door lane decals, the terrain paint ghost (rim via
`_drapeRimGeo`). New tile markers should use `_drapedTileMesh`, never a flat PlaneGeometry.
Round 2 (same day, mondo: "and zones from spells too or anything else that paints a square on the map"): spell zone
washes + rim lines/halos (`_drapeEdgeRibbonGeo`: a ribbon along one tile edge riding the drape's edge heights), zone
icons, delayed-attack danger cells, spider webs, warp runes, trap sigils, and the nexus/spawn zone wash + rim + halo.
Textured decals pass `{ tex: true }` (drape v is flipped vs a laid PlaneGeometry; `uvRot` turns it). The nexus pieces
stay pooled: `_nxDrapeGeo` keeps one geometry per (tile, piece) and rewrites its vertices in place on a rebuild.
Cliff skirts and curtains stay vertical planes.

## THE SOLID WALL — no move tiles on a field's wall tops (2026-10-14, mondo, token 20261014-wallmove-01-cors)
mondo (Technoticlan Arena, Mech): "move highlights will show up over stuff but it wont let me actually move there and clicking
it does nothing, so it just needs to not show up. Happens on walls and stuff".
- Cause: a field / arena cell the room's wall or rock fills ('#' in `field.cells`, `tops` null) goes onto the board as a column
  `rockTile` levels tall (HQ_FIELD_RULES rockMin 3 / rockPad 2, "so no rock is ever climbed"). The engine still listed its top as
  a walkable surface, so any route that reached it (a raised neighbour, a jump, a flyer) lit a move tile up there. The room draws
  no floor on a wall top, so the pick ray passes through to another cell and the click does nothing.
- Measured in the sandbox on Technoticlan Arena (every walkable start, jump 1-4): 2,498 move tiles landed on rock cells before,
  0 after; every remaining tile still has a path (findMovePath) and passes unitCanTraverse. A screen sweep of that arena found
  every rock top unpickable and every other on-screen surface pickable.
- Fix: battle.js `fieldCellRock(x, y)` (beside fieldCellFixed, same field lookup: the encounter's field, else the arena's) and
  map.js `unitCanTraverse` refuses it, so move / jump ranges, paths, the AI and previews all agree. Map geometry untouched.

## THE SKY SEAM (2026-10-14)
mondo: "there is a seam in the sky that has been there since the very beginning ... right down the middle of the sky
from the view of when the camera looks up at the zodiac signs." ROOT CAUSE: `_envDomeFS` (and its TSL twin, 'sky dome')
reads every fbm layer (nebula n1/n2/n3, colour mix mxA/mxB, milky-way bandTex, storm cloud, day clouds) and the star grid
by `az = atan(rd.x, rd.z)`, which jumps from +PI to -PI at -Z. -Z is exactly the zodiac prime slot (`getSkyShot('zodiac')`,
yaw 0), so the zodiac shot looked straight at a hard vertical line. FIX: `fbmW(p, per, nd.x)` cross-fades the last 18 deg
before the wrap (nd.x -0.8..-1) into the noise one full turn on (p + per), so -PI meets +PI with the same value (C1, and
variance-normalised about the fbm mean 0.484 so the band keeps its contrast); the star grid uses floor(sc*1.9) cells per
half turn so the wrap lands on a cell edge. The rest of the sky is unchanged. Checked with a standalone render of the
shader (before/after) on WebGL and a WebGPU battle shot at the zodiac view. The zenith pinch (all azimuths meet at
straight up) is untouched.

## THE LIQUIDS LIKE MINECRAFT (2026-10-15, mondo: "How is there a cube of poison and its not spreading ... make sure spells
are changing the terrain of the block on the ground, not placing a liquid block on top")
Causes: (1) a liquid repainted the TOP VOXEL of a raised column (a crate, a cliff top) and the column renderer drew that voxel
as a liquid cube with liquid walls; (2) only terrainCreate registered its liquid as a SPRING — leaveTerrain (Miasma, Tidal
Slam, lines, dashes), the timed paints (Tidewater, Goo) and the snow-wall melt were settled pools, which never spread on level
ground; (3) a monument's hidden collision voxels (the Dutchman's mainmast) took the paint, so a source hung at the mast top
with waterfalls down every side; (4) applyTerrainDeform raised a liquid tile by stacking LIQUID blocks, and dug one by removing
the liquid block (Tidal Slam's "leaves deep water" dug its own water away); (5) the level overflow slab stood ~0.7 of a block
over the floor, higher than its source; (6) the true ground (field battles) drew no runoff at all.
Fixes: map.js `setTerrainSpringAt` (every mid-fight liquid paint is a spring), `setTerrainAt` refuses a liquid on a
`_monumentTiles` cell (returns false), `liquidBedTerrainAt`; flow entries carry `s` (the level poured from) and `sp` (began at a
spring). battle.js deform: raise under a pool = its bed terrain (dry, spring dropped), dig under a pool keeps the pool on the new
top. three-renderer.js: a liquid run on solid ground keeps the ground's faces and wears the liquid on top only; flow surface =
source surface − drop per tile (a level halo is a 0.05 film, a ledge landing ~0.6 thick); `_fieldSkinBuild` sheets spring
runoff cells (kill: EW_NO_FIELD_RUNOFF). online.js: liquidSprings replaced wholesale in the state-sync.
Spread numbers unchanged: springs overflow 1 tile on level ground, 3 per terrace downhill (lava 2), reset per ledge.
Follow-up (same day, mondo: "i want to be able to fill a meteor crater with a flood spell"): Great Flood (`elevationFlood`) is
the one liquid that goes ON TOP. `computeElevationFloodTiles` returns `contained`; when a basin holds the pour, each tile gets
water blocks stacked from its floor up to the waterline (deep where 2+ deep), units in the bowl lift to the surface. Open ground
and chasms keep the old paint. Every other liquid spell changes the ground tile's surface and then flows.
Flicker fix (same day, mondo: "there is flickering with the water tiles from spells now"): the level-overflow film was 0.05 of a
level, under the bevelled tile top's organic swell (BEVEL.amp × tile ≈ ±7 px), so the ground poked through it in shimmering
patches. `_flowFilmMin` = max(0.05 level, (BEVEL.amp + 0.045) × tile, 0.3 level on natural-terrain maps) floors every flow-slab
corner and a film's waterfall start. The true ground's fluid skin materials get polygonOffset (−2/−4).

## THE SHORE BLEND + THE SMOOTH SHORE (2026-10-15, mondo: blend deep water into water, soften + bevel shorelines, no jagged water edges)
- **Spell liquids on the true ground** (`_fieldSkinBuild`, the arenas + exploration battles): every liquid body is ONE mesh
  (`_liqBlendGeo`, 6×6 verts per cell) whose vertex alpha is the body's coverage of a ±`LIQ_SHORE_H` (0.4 tile) window, eased:
  soft shore that spills ~0.2 tile onto ground at the same level, outer corners round off, inner corners fill. A neighbour that
  is a wall / drop counts as covered (the water runs whole to it). Deep water joins the shallow body (`_liqBodyKey`) and draws a
  second sheet over it (`_liqBlendMat(key, over)`, renderOrder 3, polygonOffset −3/−8), alpha × the deep cells' coverage over
  ±`LIQ_DEEP_H` (0.55). Materials: `_buildFluidTopMat` + vertexColors/transparent/depthWrite false (WebGPU reads the vertex alpha
  through NodeMaterial's own vertexColor path). Which cells are liquid never changes.
- **Tile boards** (voxel maps): `_liqBoardBlendBuild` lays the same two sheets only along deep↔shallow lines (`noFringe`: the
  box shores stay as they are), rebuilt with the terrain.
- **Room water** (`_hqWaterGeoms`, the walk + the field round a battle): where the sheet stopped over ground LOWER than its
  surface (past the carved bank) the whole-cell quads printed 0.5 m stair-steps. Each node now has a signed reach (owned → +,
  ground over the surface → +, dry low ground → `din + bank` clamped −0.1…−0.4) and mixed cells are clipped by marching squares.
  Off: `window.EW_HQ_WATER_STEPS`. Cave grid rooms (`_hqBuildCave`) keep their square pits.
  2026-10-16 (mondo: the Haunted House pond was still jagged): ground AT the water line (a flat lawn with the pool's `y` 0)
  counted as "ground over the surface" and kept whole cells, but the sheet lies 0.4 px over it — only ground > y + 0.05 m
  hides the sheet now. A sweep of every room (axis-aligned sheet edges over lower/level ground) went 72 → 0 on the Haunted
  grounds, and to 0 or to straight-channel edges only on the rest.
- Kill-switch for both blends: `window.EW_NO_SHORE_BLEND`.
- 2026-10-17 THE DRAPE (mondo, Moon Arena under a Hurricane: "the edge blending ... instead doing on individual tiles"): the
  field sheets were FLAT at each cell's one top, so on rolling true ground (craters, slopes, dug bowls) the ground rose through
  the body in jagged triangles, and a neighbour a third of a level off read as a wall, so shores stopped on square cell edges.
  `_liqBlendGeo` takes `o.ground` (the highlights' `_fieldGroundSampleAt`, memoised across builds by `_liqDrapeSampler`, keyed on
  the room + the dig plan + the cell top): the sheet lies on the ground under every vertex (read at every other vertex, the rest
  averaged) + `HL_FIELD_LIFT`; a neighbour is a fringe when the ground runs on across the shared edge (a slope), a hard edge only
  where it breaks. The board's own edge fades the sheet out over `LIQ_EDGE_FADE` (0.45 tile) instead of a cut line. Rebuild
  cost on a flooded 12×12 moon board stayed ~40 ms (sandbox CPU) after the first build.
- 2026-10-18 THE DRAPE ON THE DRY SKINS (mondo, Skinwalker Ranch arena on WebGPU: ice with "weird edge blending and flickering
  ... needs the same fix the liquids had"): the dry skins (`_fieldSkinBuild` → `_fieldPatchGeo`: ice, sand, scorch, rubble …
  a spell or storm laid on the true ground) were still flat per cell, so the rolling ground cut through the ice in dark
  triangles and shimmered where it met the sheet, and shores stopped on square edges. `_fieldPatchGeo` takes `o.ground` too:
  same vertex drape + `HL_FIELD_LIFT`, the same slope-is-a-fringe test, the same board-edge fade. Not on a climbing run (THE
  RISE lifts it with its strata) or a monument cell (THE WALL TOPS: the ground read there is the stone's top). Strata tops and
  the tile-board Δ patches pass no ground and are unchanged. Checked in headless Chromium, WebGL + WebGPU (SwiftShader),
  Skinwalker Ranch 12×12 arena with 37 cells painted ice.

## THE PLATES OVER THE WATER (2026-10-16, mondo: "the water coming from rain or hurricanes is not allowing tile highlights to show up on top of them")
- Cause: PR #216's blended liquid sheets (`_liqBlendMat`: transparent, depthWrite false) drew at renderOrder 2 / 3, after every
  tile plate / cursor / zone wash (renderOrder 0, also transparent, no depth write), so the water was painted over them on
  every spell or weather liquid on the true ground (the arenas, exploration fights) and along deep↔shallow lines on boards.
- Fix: three-renderer.js `LIQ_BLEND_ORDER = -2` (shallow; the deep sheet over it -1) for the field skins' liquid bodies and
  `_liqBoardBlendBuild`. Opaque water (the room's own, flow slabs, EW_NO_SHORE_BLEND skins) is unchanged.
- Follow-up (same day, mondo: "ice is covering up tile highlights"): every DRY ground sheet with a see-through fringe
  (`_fieldPatchFadeMat`: the field skins a spell or storm lays — ice, desert, grass, scorch, rubble —, the field's raised /
  dug strata patch, a tile board's `_deltaPatchBuild`) drew at renderOrder 1 (strata 0), after or among the plates. Now
  `GROUND_SHEET_ORDER = -3`: dry sheets, then liquids (-2 / -1), then every tile plate (0).
- Follow-up 2 (2026-10-23, mondo: "frozen/ice tiles are covering up tile highlights or making them hard to see"): the order
  was right, the CONTRAST was not: a plate is a see-through wash with a white-hot outline, so on white-blue ice it was pale
  on pale (repro: Skinwalker Ranch Arena, 21 cells `setTerrainAt(x,y,'ice')`, move mode; water / desert / scorch read fine).
  three-renderer.js THE PLATES ON THE ICE: `_hlBackOne` (run from `_syncHlGhosts` each frame) gives every highlight-shader
  mesh in highlightGroup on a cell whose `getTerrainAt` matches `_HL_BACK_TERRAIN` (ice / snow / frost / frozen / igloo /
  glacier) a BACKING child: same geometry + shader, colour = plate colour × `HL_BACK_SHADE` (0.3), no outline, full fill,
  opacity `HL_BACK_K` (0.55) × the plate's live opacity ratio (focus dim, range pulse), renderOrder plate − 0.5. No x-ray
  twin, no pick, the weather tint is skipped. Switch `window.EW_NO_HL_BACKING = true`. Seen on the same board, not touched:
  painted ice on a raised cell (8,11 there) drapes the ground under the rise, and the edge fringe hangs down the board's front step.

## DAY AND NIGHT OUTDOORS (2026-10-17, mondo: "wood like the fairy forest and bohemian grove etc to still have day and night cycles, for battle and exploration. any outdoor area should have visible day and night. indoor areas should still have it mechanically")
- Cause: since ZONES_PLAN Z0 cut THE LAND no zone had `clock: true`, so data.js `hqRoomClock` returned null for every room and nothing showed the hour.
- Exploration: `hqRoomClock` now puts EVERY open shell with a sky on the clock (a site behind a door, the pool / garden), except interior parts and `HQ_WORLD_CLOCK.still` (Atlantis abyss, Agartha, Hollow Earth, Looking-Glass garden + sea, Singularity, Saturn, Moon, the spaceship deck, Heaven's stair + gate: no sun and night of their own). `lock` is empty (the Strip, Dutchman, haunted grounds, observatory were pinned at night). New `dayLook` rows for the other night-authored rooms. map.js `_hqClockNightIn` reads the live hour in rooms off the clock too (indoor fights start at the hour's half — mechanical only).
- Battle, field fights (arenas, crystal fights, encounters): three-renderer.js THE BATTLE'S DAY AND NIGHT — `_fieldCycleArm` (in `_fieldGroundDress`) builds a day row (13:00, or the held hour in a story fight) and a night row (01:00 / held hour) with `_hqClockVals`; `_fieldCycleTick` eases over FIELD_CYCLE_SEC (2.5 s) to `getCurrentCyclePhase()` (state.round, so the online guest matches): ThreePost field light (key, hemi), lamp masts, scene fog colour; `_updateEnvironment` drives the dome's uSkyDay / clouds / tint / horizon haze from it. Canonical halves aim the key at the dome's fixed painted sun / moon. Shadows re-draw at most every 150 ms while easing.
- Battle, boards with no room (moving Δ, full site maps): `_battleSiteDayLook` gives a night-authored sky the site's day on day rounds (lights already flip via ThreePost presets).
- Kill switch: `window.EW_NO_BATTLE_CYCLE = true`. Console: `hqClockSet(h)` in exploration.

## THE CELESTIAL EVENTS LOOK (2026-10-17, mondo: "make the celestial events look more realistic and badass. Right now the red moon is the only one that looks close")
- Blood Moon: unchanged (red 3D moon, swollen, red wash).
- Black Sun = a total solar eclipse, three-renderer.js `_envDomeFS` "THE TOTAL SOLAR ECLIPSE" block (+ the TSL port in `reg(_envDomeFS(), 'sky dome')`). Drawn AFTER the day sky and the map tint (display space), so neither washes it: eclipse twilight + a sunset glow on every horizon, black disc (sunR × 1.6), streaming corona (fbm on the angle, stretched along the sun's equator), pink chromosphere + prominences, Venus + Jupiter, and the diamond ring for the first ~3 s after the reveal (`uEvAge` = seconds since `_skyEvShownAt`, set by `playSkyEventReveal` or the 9 s fallback). The 3D moon hides (it IS the disc); the day sky is cut (`dayK × (1 − bsun)`).
- Lunar Eclipse = the Earth's umbra on the moon: `_updateLunCard` puts a camera-facing card just in front of the 3D moon, MultiplyBlending + premultipliedAlpha (works on WebGL and WebGPU), painted from a 128 px canvas by `_lunUmbraPaint` = the shader's `lunUmbra` (copper inside, turquoise fringe, grey penumbra, bright cap upper right). The shadow slides on over 3.2 s after the reveal (canvas repainted only then). Moon brightened to 1.7 and swollen ×1.4 under it; the sun sets; the day sky mostly cut. Keep `lunUmbra` (GLSL), its TSL twin and `_lunUmbraPaint` in step.
- Screens: /mnt/project-files/celestial-events/. In SwiftShader the sky ramps slowly (per-frame easing), wait ~20 s before judging a WebGPU shot.

## THE INTRO DOOR ON THE ROOM'S FLOOR (2026-10-17, mondo: "on a lot of the arena maps the door that the units walk through to start the game is clipping almost halfway through the floor")
- Cause: three-renderer.js `_introBuildDoor` stood the crossing at the zone's ENGINE level × the level step. Arenas are drawn on the room's TRUE GROUND (real tops in metres), so past the board's edge the floor sat 0.2–1.2 tiles above the door on Giza, Heaven, Stonehenge, Shasta, Atlantis, Hollow Earth, Fairy Forest, Bohemian Grove, D.U.M.B., North Pole, Singularity, Saturn (measured in headless Chromium by raycasting the room under each door).
- Fix: `_introDoorFloorY` (no kit + a live true-ground field only): the zone's real top, and on a terrain room `hqTerrainFeet(info, x, z, null)` sampled 3×3 across the door's footprint (a sample past the compiled floor's edge, e.g. Fairy Forest's south door on the outer bank, raycasts the drawn `hqRoom:` group instead: `_introRoomGroundY`); highest sample, capped at lowest + 0.35 tile (the 0.42-tile dais still meets a slope's low side), never under the centre sample. The door, the dais and the walkers' off-board path nodes (`zB`) all use it; battle.js's door shot reads `zB` too.
- Probe used: a scratch Playwright run wrapping `ThreeRenderer.introCineStart` and raycasting `ThreeRenderer.hq.dev.scene()` under each `introCrossings` child (jsdelivr is blocked in the sandbox: serve the npm tarballs locally).

## WATER + LAVA = STONE, RAIN PUTS OUT THE GROUND FIRE (2026-10-18)
mondo: "when water and lava mix i want them to make rock like in mincraft ... hellmouth ... lava lands on water tiles" +
"same if it rains on lava" + "a thunderstorm started, yet there is still tiles on fire" + "fire spells should still work in
the rain im just talking about grass tiles being on fire".
- New terrain `stone` (data.js TERRAIN_RULES, moveCost 1, rocks_5 sheet via sprites.js TERRAIN_SPRITES, ent_slate tint).
- map.js `lavaWaterMixOf(cur, terrain)`: setTerrainAt turns lava-on-water and water/ice-on-lava into stone (one combat-log line
  per cast); setTerrainSpringAt only registers a spring when the liquid really landed. Great Flood's old obsidian quench is stone.
  lineBeamPlan's simulated paint and the terrain ghost colour use the same rule.
- battle.js triggerTerrainSpellReaction: a water/ice-element hit on lava hardens it.
- state.js `rainOnTheBoard`: a soaks weather (Thunderstorm, Hurricane, Blood Rain) puts out every burning tile under its rain as
  it forms (fires lit later still burn), and hardens the fight's lava (state.paintedFrom says it wasn't lava) on forming and
  every round end. The map's own lava stays. Root cause of the fire bug: tickBurningTiles never asked about rain.

## THE LOOKING-GLASS CHESS COURT (2026-10-20, mondo: "i want all of those voxel maps remade as new maps ... built with the tools in the map editor ... designed with square tiles in mind ... make them look good")
- The Looking-Glass's online map is no longer its voxel Δ: it is THE BOARD in `site_prebuilt_lookingglass_garden` (HQ_AREA_SPECS.prebuilt_lookingglass), grown to 12 × 12 battle squares (x −10.5..10.5, z −1.75..19.25, centre (0, 8.75)). Picks 12/11/10/9 are all windows on that board (HQ_ARENA_RULES.picks*), so `prebuilt_lookingglass_delta` + 9/10/11 cuts fight on it with the garden drawn round it.
- Pieces = HQ_TREE_KINDS `chess_<piece>[_dark]` (h in squares): terrain `tree` features, so they block their cell on THE FIELD lattice (walker bumps, battle LOS/height) and the editor lists them under "Chess pieces". three-renderer.js `_hqChessStatue` turns the old `_hzChessPiece` lathe profiles into marble statues on a plinth (shared materials). Black set north half (P2), white set the 180° twin south (P1), kept to columns 0..3 / 8..11 so the 5v5 middle houses fit every size.
- The garden: lawn grass_2 + marble walks, a walk ring a square wide round the board, braziers on its corners, giant king/queen pairs at the fountain (north) and the south gate.
- Terrain compile forces a `board` feature's whole square (plus a square margin) open in the hedge maze (was only the plateau core, which put a hedge on row 0).
- bake-arenas.js THE BOARD IS THE ARENA: a terrain room with a `board` feature of n ≥ S only cuts windows inside that board.
- The voxel board stays: HQ_ARENA_RULES.voxelKeep lists sites whose old voxel Δ is re-registered as `<site>_<W>x<W>_delta` ("<Site> Δ · voxel", VS CPU pickable, not in the PvP pool). Looking-Glass left HQ_ARENA_RULES.keep.
- Screens: /mnt/project-files/new-maps/lookingglass/ (before_* = voxel board + old garden, after_* = new arena + garden).

## THE BERMUDA ISLAND (2026-10-20, mondo: "Literally just an island in the ocean ... that y2k beach aesthetic")
- New room `site_prebuilt_bermuda_island` (data.js, its own block before THE HARBOUR): an 84 m sea room (hqSeaShell, look HQ_ROOM_LOOKS.island) with a lagoon plateau, a sand island (plateau r 14 × rz 21, floor `desert`), two granite shelves one level up (rocks_5 paint), boulder hills drawn by asteroid props, palms, a wooden pier with tiki torches, beach umbrellas/loungers/lifeguard chair, rowboat, buoys, coral + fish scatters in the sea.
- bake-arenas.js picks: 12×12 @ 18,18 (symmetric under 180°), 9 @ 19,18, 10 @ 20,18, 11 @ 19,17. The arena takes `prebuilt_bermuda_delta` ("The Bermuda Triangle Arena"), so Bermuda joins the online pool and its crystal fights this island. The old voxel board stays via HQ_ARENA_RULES.voxelKeep as `prebuilt_bermuda_8x8_delta`.
- `terrain.sea.field: true` (hqFieldRoomOk / hqFieldTerrainInfo): a sea room may host THE FIELD; ground deeper than wadeMax under the sea is not standable, shallows are wade cells, deep sea is a `deep_water` hazard. Without the flag a sea room is still refused.
- Palms: HQ_TREE_KINDS `palm` = `kit:Meshy_AI_palm_tree_0910054114_texture.glb` (three-renderer foliage `kit:` prefix → DOOR_HQ.assets.models; the manifest's .opt.glb loads in its place). The old sea room's three bare trees are now palms.
- Screens: /mnt/project-files/new-maps/bermuda/ (before_* = the voxel board, after_* = the island).

## THE HELL WALKWAYS (2026-10-20, mondo: "i imagine hell being more like high platforms and walkways with pits of lava deep below that you can actually fall into")
- Hell's map is no longer its voxel Δ: it is `site_prebuilt_hell_walkways` (`arenaRoom: true` — bake-arenas.js scans a room wearing it before the site's entry part), a 42 m closed cavern behind a new door in THE PIT's alcove (pit east wall z 13.4, y 1.75 ↔ walkways south wall, the south shelf). Built only from editor pieces: one lava `pool` (r 27, sheet 0.3) under rock `plateau` walkways at 7.5 m, four 1.4 m daises (one battle level, the walker's jump), `bridge`s (the two middle ones railed, the side planks open), the plan's `solid` discs as rock pillars (look 'rock', wallH 13; `minIsland: 1.2` so a one-square pillar is kept), braziers / cave torches / chains / skulls / the demon statue on the two shelves. Light: shell h 18, five invisible roof lamps (`strips: false`) in the lake's orange over the walkways + mood.ambient 1.3 (0.34 left the tops black in battle). `terrain.res: 0.25` keeps the tier edges on the squares (0.5 smeared a 1.75 m dais into a slope); every walkway plateau is 0.15 m proud of its squares so a corner square stands whole.
- The 12 × 12 window (ox 6, oz 6) is drawn in the room's comment; pick in HQ_ARENA_RULES.picks.prebuilt_hell (`pits` + `pitTile` -4 ride the pick: the cell digit stops at -1). `prebuilt_hell_delta` keeps every old slot (match select, crystal fight, the training rotation) and is in the online pool like every arena; the voxel board is `prebuilt_hell_8x8_delta` "Hell Δ · voxel" (voxelKeep).
- THE LAVA PITS: `terrain.pits: { levels }` → hqFieldRasterTerrain stands each lava hazard cell under the floor `levels` deep (≤ base−1) with `c.pit` (the bake's bookkeeping; hqFieldBuild / hqArenaEntry still write `entry.pits`, nothing in the fight reads it). The depth is ALL a pit is: a body pushed off a walkway drops 4 levels and the game's own rules take it (applyFallDamage — a liquid landing negates the impact; lava's endTurn burn stacks; walking/climbing by the normal height rules). An insta-kill pit rule shipped in #371/#373 and was REMOVED the same day (mondo 10-20: "we already have rules for lava and fall damage, why would you add new rules?"). Never add a map-specific death or movement rule; a map gets its danger from geometry + existing terrain.
- Screens: /mnt/project-files/new-maps/hell/ (before_* = voxel Δ, after_* = the walkways).

## THE CLASH TEMPLE (2026-10-20, mondo: "i want all of those voxel maps remade as new maps ... Even the training room and holo sim ... built with the tools in the map editor ... square tiles in mind ... Dont delete these voxel maps")
- Clash's stage (`clash_stage`, every Clash match, ranked and friendly rooms included) is a 10×10 cut of its OWN editor room
  `DOOR_HQ.rooms.clash_temple` (THE TEMPLE), not a widened Göbekli space: a sanctuary on a 10 m mesa (rocks_5 cliffs, ledges) in a
  meadow bowl ringed by terrain ridges (16-26 m) with three distant peaks. The court = a `board` row of sanctuary / bricks_1 flagstones,
  one per tile, sunk a 0.74 m step inside the stylobate; 18 greek_column props + four plain `bridge` slabs (the entablature); north a
  built stone flight (`terrain.stairs: 'stone'`, side cobblestone_2) to the shrine terrace (altar, candle ring, trilithon, obelisks,
  statues, back wall); south the gate trilithon and the processional stair down the cliff. Ten braziers are the room's first ten props
  (the battle lights only the first 10: court corners, colonnade sides, shrine, gate).
- `HQ_CLASH_STAGE` (data.js, after hqArenaRegisterAll) holds the room, the formation (P1 x 3, P2 x 6, rows 3..6) and the baked
  `pick` (`node bake-arenas.js clash_stage`, between `<CLASH PICK>` markers; rerun after the room changes). hqArenaEntry/hqArenaUpgrade
  take `opts.formation` in place of the arena house (no nexus, no Cube). The layout's env is the room's own sky.
- The old voxel board stays as `clash_stage_voxel` ("Temple · voxel"): PREBUILT_MAPS + its layout, GAME_MODES, MS_MAP_LIST, and
  MULTIPLAYER_MODES.clash.compatibleMaps (VS CPU match select under Clash). Online (online.js `_friendlyGetCompatibleMaps`, server
  ranked) deals only `clash_stage`. Not done via HQ_ARENA_RULES.voxelKeep: that list re-registers `<site>_delta` boards, and the Clash
  stage is not a site Δ.

## THE GALLEON — the new Flying Dutchman (2026-10-20, mondo: remake the voxel maps as editor rooms)
- The deck is an editor room: data.js `HQ_AREA_SPECS.prebuilt_revenge` (59.5 × 24.5 m, every edge on the 1.75 m square
  lines). Waist at 0, quarterdeck + forecastle plateaus at +1.5, poop at +3.0, built wood stairs (`model 'wood'`), bulwarks
  as room walls with gun ports (sill + lintel), a starboard gangway gap for the bay door, masts/capstan/helm as `trees`
  (they block their squares; the renderer skips the tree model for `_HQ_SHIP_TREES` and draws them itself).
- `float.hull.kind: 'galleon'` → three-renderer.js `_hqBuildGalleon`: the lofted hull (sheer from the plate's rim
  heights), wales, gun-deck ports (some lit), stern gallery + name plate, beakhead, bowsprit, three rigs (`hqGalleonMast`,
  each its own occlusion piece, `_ew_occEye`: fades when the camera is within 2 squares of it), sails from `_hqSailTex`,
  ratlines/stays as one LineSegments, wake foam scrolled by the voyage (`_hq.galleonWake`). One mesh per material.
- `voyage: true` + `sea.field: true`: the room keeps the site's motion + far roster in battle; the sea sheet runs
  `outer.m` 320 m (a float plate builds no outer ground, so `outer.m` only sizes the sea). The sea sheet never receives
  shadows (`_hqShadowFlags`): its edge past the shadow map drew a pale box round the ship.
- Look: `HQ_ROOM_LOOKS.galleon` (dream, light tint — the faded print greyed it), fogD 0.007, the day row in
  HQ_WORLD_CLOCK.dayLook is a clear sea day. It rides the world clock (day + night both checked).
- Arenas (bake-arenas.js): 12 = the waist, teams at the port/starboard bulwarks; 9 = quarterdeck + poop; 10 and 11 cut too.
  The old voxel Δ stays in VS CPU as "The Flying Dutchman Δ · voxel" (`HQ_ARENA_RULES.voxelKeep`).
- Screenshots: /mnt/project-files/new-maps/dutchman/ (before_* = the voxel board, after_* = the new room).

## THE TRAINING ROOM (2026-10-20, mondo: "i want all of those voxel maps remade as new maps. Even the training room and holo sim")
- `prebuilt_training` (every tutorial lesson on it + its VS CPU slot) is the 8 × 8 cut of its OWN editor room
  `DOOR_HQ.rooms.training_hall` (data.js, its own block after Room 64's `training` room): a 31.5 m gym hall, concrete walls with an
  oxblood dado, the mats a `board` of urban:RubberNonSlip5a / 1a squares (one per tile) with red/yellow tape marks round them, six rows of
  bleachers (tier `wall` rows with InstancedMesh seats) on the west, a steel mezzanine (`bridge` + `ramp` stairs model 'steel' + pipe
  rail) on the east over lockers, columns, banners, clock, observation windows, a roller shutter, eight ceiling lamps.
- Registered through THE OWN ARENAS (`HQ_ARENA_RULES.own.prebuilt_training`, `node bake-arenas.js --own prebuilt_training`;
  docs/notes/editor.md): the old voxel board stays as `prebuilt_training_voxel` ("Training Room · voxel", VS CPU match select).
- Tutorial fixes found walking the lessons on it: map.js autoGenerateSpawnZones no longer moves a lesson's pinned units onto the
  spawn rows (the bug was already on main: every lesson started on the rows), and ui.js `_tutPoll` passes a vessel's turn on a
  THEIR TURN step when a Press refund left it up (the step allows no action, so the lesson stood still). No game rule changed.
- Draw calls: the room's scenery ~230-500 per frame by pose (the voxel board's scenery was ~3300). Text tape marks cost a call each, so the
  marks are plain lines.
- Screens: /mnt/project-files/new-maps/training/ (before_* = voxel board, after_* = the hall, tut_* = lessons on it).

## THE PAINTED SKIES (2026-10-24)
mondo painted 80s/90s anime watercolour skies and uploaded them to R2 `Assets/skies/`: `woods_*` and `disaster_city_*`, each
`_day` / `_night` (4096 × 1024 RGB, 360° strip, horizon at the bottom row, straight overhead at the top), `_silhouette`
(4096 × 512 RGBA, tree line / skyline standing on the horizon = 45°) and a half-size `_low` copy of each. Spec he was given:
the "Painted watercolor skies" doc (claude.ai/artifact/DZ2xiJhEmPTYb6YiRwzddH).
- data.js `HQ_PAINTED_SKIES` (base, silH, rows `{ key: { label, sites } }`) + `hqPaintedSky(id, low)`: a room id, a
  `field:<room>:…` fight or a board / arena id → `{ key, day, night, sil, silH }`; an interior (no `shell.open` / sky) → null.
  A room can also name a row with `shell.sky.paint: '<key>'`. Rows today: woods = prebuilt_fairy_forest; disaster_city =
  prebuilt_downtown + prebuilt_stadium (the Sewers' rooms are closed, so unpainted). A new zone = one row + his files.
- three-renderer.js THE PAINTED SKIES (`_paintSky*`, beside `_initEnvironment`): `_paintSkyTick(id, snap)` from `_hqTickSky`
  (+ `_hqBuildSky`, so the HQ load card waits for the sheets) and `_updateEnvironment` (activeGameMode). Loads through the
  game's `textureLoader` (ledger / gate / retry), `flipY = false` (the bitmaps flip at the decode on Chromium; with no flip
  every path agrees, the shader reads v = 1 − altitude), no mips (a mip chain draws a line down the wrap), `_low` on
  EW_PERF_LOW, sheets of a place you left disposed. Uniforms uPaintDay / uPaintNight / uPaintSil / uPaintAmt / uPaintSilOn /
  uPaintSilH on `_envUni`. The three sampler uniforms MUST start as three different textures (`_paintSkyBlank`): the WebGPU
  twin (`_ewPT`) binds per first-seen texture, and three nulls (one shared stand-in) drew the day sheet for all three.
- `_envDomeFS` THE PAINTED SKY block (and the TSL twin, keep in step): after the day sky, before dusk; day ↔ night by
  smoothstep(uDayNight); silhouette dimmed ×(0.17, 0.20, 0.32) at night; the game's sun (day), moon and stars (night,
  only where the painting is dark) drawn over the sky but behind the silhouette; blood moon / lunar eclipse / storm / snow /
  sand / blood rain wash it; the map tint is skipped (× 1 − uPaintAmt); dusk, the Black Sun block and the horizon fog still apply.
- Kill-switch / before-shots: `window.EW_NO_PAINTED_SKY = true` (read live). Debug: `window._ewPaintSky()`.
- Online: nothing on state, nothing relayed; both seats resolve the same board id.
- The far roster (floating bodies, lone doors) and landmarks still hang in front of the painting (not removed).
- Proof: /mnt/project-files/painted-skies/ (walk before/after day + night for both zones, WebGPU day/night, a battle looking up).

### THE SKY SETS (2026-10-24, mondo: "Let's try adding these skies instead")
- His four 1024 × 512 PNG sets on R2 `Assets/skies/1024x512/<Name> Sky/<Name>_Sky-<Blue|Night|Sunset>_0N-1024x512.png`
  (Bumpy, Cloudy, Wispy, Fading; N = 1..4). Same strip layout as the paintings (horizon bottom row, zenith top), so the
  shader reads them the same way; each wraps seamlessly and goes `rep` = 2 times round (1024 px for 360° would stretch
  the clouds 2× wide next to 512 px for 90° up).
- data.js `HQ_PAINTED_SKIES.sets` + a row's `set`: woods = wispy, disaster_city = fading. Bumpy and Cloudy are in `names`
  but on no row (one word on a row swaps them in). Dropping `set` brings back the row's own `<key>_day/_night` paintings,
  which stay on R2 and in data. The row's silhouette stays on (`noSil: true` drops it).
- Blue = day, Night = night (crossfade by uDayNight as before), Sunset = the clock's dawn/dusk triangle (uDusk, 0..1,
  peaks mid-dawn 6:15 and mid-dusk 19:15). With a Sunset sheet the clock's warm horizon band is skipped (× 1 −
  uPaintAmt·uPaintDuskOn). A fight has uDusk 0, so battles show Blue / Night only.
- Number N per room: the row's open rooms in DOOR_HQ order take 1, 2, 3, 4 (clearing 1, redwoods 2, ritual 3; streets 1,
  harbour 2, stadium bowl 3); a board with no room takes 1. All three times use the same N.
- New uniforms: uPaintDusk (own blank DataTexture: the WebGPU sampler gotcha), uPaintDuskOn, uPaintRep. No `_low` copies
  exist, so low power loads the same PNGs (≈ 0.4-0.8 MB each, 4 per room).
- Shot harness note: with draw-on-demand the sky tick only runs on drawn frames, so a live flip needs `ph draw always`.
- Proof: /mnt/project-files/painted-skies/sets/.

### THE FAR FOG ON THE SILHOUETTES (2026-10-24, mondo: "the treeline and skyline dont react to the fog like far away objects do")
- The silhouette strip takes the scene's FogExp2 as if it stood at the room's far edge: half the field's longer side + the
  outer ground (`terrain.outer.m` or HQ_OUTER_M 54 m); a board with no room: 20 m + 54 m. Amount = 1 − e^−(density ·
  distance)² (FogExp2's own curve), colour = the live scene fog's (the clock's fog colour too). Uniform uPaintSilFog
  (rgb, a), GLSL + TSL. Only the silhouette: the painted sky keeps the dome's own horizon band.
- Walk: `_hqPaintFog(H)` = the dry fog × the Fog Density setting (_ewFogShape().m), 0 when Scene Fog is off (the same scaling
  _hqFogHold applies at the draw). Fight: the battle scene.fog as is (Scene Fog / Fog Density already in it), px per metre
  = _fieldGroundState.s in a field fight, else tileSize / 1.75.
- At factory density the woods (0.03/m, 73 m) and downtown (0.016/m, 166 m) silhouettes are ~99% fog, like the far 3D
  buildings and trees; Fog Density 0.3× leaves about half; Scene Fog off leaves them crisp. Debug: `_ewPaintSky().silFog`.
- Proof: /mnt/project-files/painted-skies/sets/far_fog_*.jpg.

### SWITCHED OFF (2026-10-25, mondo: "not really a fan of the skies that were added, i cant really tell when its day or night. Can we go back to how it was before, no water color stuff")
- data.js `HQ_PAINTED_SKIES.on: false`: `hqPaintedSky` returns null for every id, so `_paintSkyTick` keeps uPaintAmt 0 and
  every zone (walk + fights) draws the shader's own day / night dome again, exactly the pre-#481 sky (every painted-sky
  shader path is gated on uPaintAmt). The rows, the sets, the renderer code and his files on R2 stay; `on: true` brings
  them back. Proof: /mnt/project-files/painted-skies/off/.

## THE SQUARE-GRID FIT (2026-10-26, mondo: "redesign the maps with the square grid in mind ... a ramp will overlap weirdly between 2 tiles, when it could easily just take up the width of one or 2 and sit nicely in the grid")
- The audit of every map: /mnt/project-files/grid-fit/GRID_FIT_AUDIT.md (per room: pieces off THE FIELD's 1.75 m lines, split
  squares in the arena windows), the groups: GROUPS_AND_BRIEF.md. Voxel boards were already on whole tiles.
- Group 1 done (this pass): North Pole, Heaven (gate + stair), Antarctica, Olympus, Agartha. Only numbers moved: no row added
  or removed, no asset changed. Each space / plateau edge on a square line (hqFieldLattice), each ramp / bridge / deck / hall a
  whole number of squares wide and centred on its squares, round tops sized to whole squares (r = n·0.875) centred on a cell
  or a line by parity, ramp ends on the edge of the top they meet (a field-drawn ramp keeps its old overlap under the top),
  never more than 1.25× steeper. Ladders, rails, wall faces, handrails and props riding a moved edge / rim / deck moved with it.
- THE PROUD TOPS: the room's heightfield is drawn at 0.5 m with a bevel, so a top whose rim lies exactly on a square line
  loses its edge squares (the field reads 3×3 samples per square). Field-drawn pieces may stand 0.15-0.45 m proud of their
  squares (rect w/d += 2p, round r += p, ramp w += 2p), chosen per piece by the most standable squares. A plateau that ran
  past its plan room's wall keeps running past it (else a ditch along the wall).
- Checked per room against origin/main: 0 traps, every door pad joined, no new invisible walls, standable field squares
  up (Heaven stair 331 → 397, its flights now reached), arenas re-baked at 12 / 9 / 10 / 11.
- Tools (scratch, not in the repo): /mnt/project-files/grid-fit/tools/ (snap.js, proud.js, verify.js, grid.js, tops.js,
  audit.js, README.md).
- Group 5 (2026-10-26): Football Stadium bowl, Cyberpunk / Strip / Downtown streets, Flying Dutchman deck, Training Room,
  Hell walkways, Clash Temple. Same rules (numbers only). Calls: the stadium rows keep two rows per square (row lines sit on
  quarter offsets by design) and the room is now 84 × 133 so the bowl, concourse and facade sit on lines; the Hell walkways'
  0.15 m proud lip kept; the Dutchman masts / capstan / helm stay on their z 0 line (each holds two squares); the Strip upper
  deck runs to the lattice edge (x 49, else a pocket by the wall); the Clash gate stair is two squares (3.5 m, was 5 m).
  Proud tops on plateaus only: ramps stay exactly 1 or 2 squares wide. Arenas re-baked pinned to their old spots
  (HQ_ARENA_RULES.within, temporarily, in a scratch copy); Stadium 9/11 and Dutchman 9 moved 1-3 squares (the old window no
  longer fits); Hell now has a 10 × 10 cut.
- CITY ROOMS: a city's lots are laid along street faces with ONE seeded rnd() (gen.kind 'city'), so moving a path, a ramp, a
  rail or a plateau edge near a lot can shift the RNG and re-lay buildings citywide (the Downtown parking deck + car ramp re-laid
  ~170 of 211 lots). Diff the room's `hqTerrainInfo(id).lots` against main after every city edit. Downtown's car ramp / deck
  were first left where they were for that reason; mondo then picked "fit them, re-lay the city" (2026-10-26, follow-up PR):
  deck x 17.5..29.75 / z −21..−8.75, car ramp two squares on z −14, west landing 6 × 6 squares, overpass ends 0.7 m inside.
  Downtown now lays 207 buildings (was 211); nothing placed stands inside one; its old 12 × 12 spot is built over, so all four
  sizes re-baked to the best open-ground windows.
## THE LIQUIDS (2026-10-26, mondo: "use these to differentiate between the different liquids ... keep water and lava as is")

mondo uploaded 48 liquid sheets to R2 `Assets/Sprites/terrain/liquids/` (`Liquid_<Blue|Brown|Green|Purple|Red>_01..08-128x128.png`,
`Liquid_Yellow_1..8-128x128.png`, no zero pad on Yellow). Every liquid terrain that isn't water or lava now wears its own:

| terrain | label | sheet |
|---|---|---|
| poison | Poison Bog (PSN) | Liquid_Green_02 (toxic green) |
| poison_bog | Poison Bog (PBG) | Liquid_Green_08 (olive bog) |
| purple_bog | Purple Bog | Liquid_Purple_07 |
| swamp | Black Ooze | Liquid_Blue_06, darkened `#4a4a4a` (TERRAIN_BASE_TINT) |
| oil | Oil Slick | Liquid_Brown_02 (swirls), darkened `#7a7a7a` |
| blood | Blood Pool | Liquid_Red_05 |

- sprites.js TERRAIN_SPRITES names the sheet; three-renderer.js `_LIQUID_STYLES` rows carry `sheet: true` (base = the key itself,
  tint white), and `_getFluidTex` scrolls the liquid's own sheet in BOTH wave layers (waves_1 would wash it pale). The waves
  multiply the key's TERRAIN_BASE_TINT too. Water, deep water, lava: untouched. Rules: untouched.
- purple_bog.png never existed on R2 (404), so the purple bog had no flat sheet before this.
- healing_spring keeps its own bespoke art (a spring with flowers; not in the fluid pipeline).
- EDITOR: all 48 sheets are `urban:Liquid_<Colour>_<NN>` (sprites.js LIQUID_SHEETS → URBAN_TEXTURES, family `Liquids`), so the
  texture picker (+ SHEET, any texture field) lists them; POOL / STREAM's Liquid dropdown offers every liquid terrain. The old
  voxel map editor has a Liquids tab (blood newly paintable: appended to map.js ME_TERRAIN_IDS + data.js MF_TID, id 161).
- Screens: /mnt/project-files/liquids/.

## THE SHIP — the Spaceship Arena redone (2026-10-28, mondo: "it just looks like a big slab slapped on top of a spaceship ... give the spaceship wings and have the spawn zones be in each wing ... The maps dont have to be square. There can be gaps and pathways")
- Room `site_prebuilt_derelict_deck` (HQ_AREA_SPECS.prebuilt_derelict) is now a SHIP-SHAPED deck, bow east: a hull spine, two swept
  wings with boarding booms, two engine pods at the stern, a raised bridge (stern deck + bow bridge, steel stairs the full hull
  width) and two hull breaches. Drawn as a square-cell plan through the new data.js helper `hqDeckPlan(rows, o)` ('.' void,
  'o' deck, '1' raised one level, 'w' crate block; greedy rectangles → plateaus 0.35 m proud of their square lines). Every
  edge sits on a 1.75 m battle-square line, so the stepped outline IS the grid.
- Gaps = the EXISTING void (`terrain.void {lip, fall}`, hqAreaRoom passes `A.void` through): under the deck is open space →
  `cloud_gap` cells in battle (impassable, flyers cross, slides stop short, walker falls back). `base: 2.5` so the drop from
  the 3.2 deck to the void threshold is only 0.7 m — with base 0 the edge samples read as slopes and edge cells dropped out.
- The underside is `_hqBuildStarship` (three-renderer.js, `float.hull.kind: 'starship'`): belly + sides follow the deck's own
  void outline (same midpoint test as the field mesh), keel, stern bells, wing pods, plumes, lit rim strips, window glow,
  running lights. No new rules, no new assets.
- SPAWNS (mondo's first option): one team per wing. `HQ_ARENA_RULES.within.prebuilt_derelict` pins every size to the hull
  centre (-3.5, 0), so rows 0 / S-1 land on the port / starboard wings and the nexus on the hull. Picks re-baked with the
  site arg (merges, keeps other sites): 12 @10,8 · 11 @11,8 · 10 @11,9 · 9 @12,9 (main: 12 @12,10 · 11 @13,10 · 10 @0,10 · 9 @8,16).
- Moved/dropped (flagged): airlock tower gone (airlock door at deck level, end of the port boom), bay door on the starboard
  boom, tape on the bridge roof, scatters dropped, droid NPC dropped (its line named the tower), '426' painted on each wing.

## THE BIG SQUARES — the Strip on 3.5 m squares (2026-10-28, mondo: "what if every unit stood on a 3x3 area ... it would still be a 12x12 in terms of gameplay and movement ... let's just try this idea with one map" → "okay yeah let's try that on the strip")
Token 20261028-stripsq-01-cors. R2: data.js, three-renderer.js, battle.js, three-vfx-effects.js. Repo: bake-arenas.js, index.html.
Shots: /mnt/project-files/strip-squares/ (strip_squares_before_after.jpg, online_host_left_guest_right.jpg).
- **The rule**: data.js `HQ_ARENA_RULES.squareM = { prebuilt_strip: 3.5 }` (2× the battle tile). Every size of the Strip's arena
  (12 / 11 / 10 / 9) is cut from the Strip street room on a lattice of 3.5 m squares: same square count, same rules, same moves,
  each square covers 4× the ground. `hqArenaSquareM(site)`; the pick carries `sq: 3.5` → `entry.arena.sq` → hqArenaUpgrade rasters
  and builds the field with `{ cell: sq }`. Every other board stays 1.75 m (no `sq` = the battle tile).
- **The lattice per square size**: `hqFieldTerrainInfo(roomId, cellM)` / `hqFieldLattice(roomId, feet, cellM)` /
  `hqFieldRaster(…, { cell })` / `hqFieldBuild(…, { cell })` — a terrain room only (the Strip is one); the 1.75 m lattice stays on
  `room._fieldTerrain`, a bigger one is cached in `room._fieldTerrainBy[C]`. A battle LEVEL stays 1.75 m of the room (THE TIER RULE).
- **bake-arenas.js** cuts a `squareM` site on its own lattice and prints the grid; rerun `node bake-arenas.js prebuilt_strip` and
  `--size 9 / 10 / 11` after the Strip room or its square changes. Lots unchanged (hqTerrainInfo lots sha 4489c2b3 on main and here);
  every pick rebuilt through hqArenaUpgrade headlessly matches its bake.
- **Drawing it** (three-renderer.js): the room was already hung at ts / C per metre (`_hqBattleRoomMatrix`), so at C = 3.5 the street,
  the cars and the props stay real size. THE BODY SCALE: `UNIT_SPRITE_SIZE_RATIO` is now a var, `_bodyScaleLatch()` at activate sets it
  to 1.75 / C (0.5 on the Strip; 1 again at deactivate) — the units, their plates / floats / held gun, the Cube, turrets + summons,
  graves + bone piles are body-sized. `ThreeRenderer.bodyScale()` is read by three-vfx-effects.js `unitZBoost` (the torso every bolt /
  beam aims at) and battle.js `_cineSizeK` (the cinematic boom's clamp is in bodies). The true ground's level step (`_fieldGround`
  elev) WAS 1.75 m of the room on big squares (a dig / a raise / a flyer's clearance); since THE FULL BLOCK (2026-11-10, below) a dig /
  a raise steps one whole square and only the flyer's clearance (`airElev`) stays 1.75 m. A walk runs at the body's own pace (per-square
  time ÷ the body scale).
- **The camera** (battle.js `_framingBodyK`): every automatic framing built from "N visible rows" (`computeZoomForVisibleTiles`,
  `_zoomForVisibleTilesAtTilt` — the default / turn / rest zooms, the auto-zoom floor) frames N × 1.75 m of ground, so the units fill the
  screen as on any board and the bigger squares read as room between them. Untouched: the hand zoom, the full-map overview, the Move /
  aim fits (they frame the reach in squares), the close-ups (they already frame the body).
- **Not scaled** (tile-sized as before — they mark squares or areas): tile highlights, the AoE / spell VFX sizes, blood decals,
  the jump arcs between levels (the Strip's board is flat). Online: nothing new is relayed — host and guest read the same pick.

### 2× EVERYWHERE (2026-10-28, mondo: "2x everywhere, use multiple threads so they dont turn out bad")
- PR #638: `HQ_ARENA_RULES.squareDefault: 3.5` — every site is CUT on 3.5 m squares unless `squareM` names its own (`site: 1.75` keeps
  the battle tile). Only bake-arenas.js reads it; a live pick plays on its own `sq` (1.75 without one), so a map changes only when re-cut.
- bake-arenas.js: a site with no window at its square KEEPS THE PICK IT HAD ("KEEPS ITS OLD PICK"), full bake or named sites — a bake
  never drops a board. Grow the room, then re-cut that site at every size (`--size 9/10/11` + 12; `--json` + `--apply <file> <sites>`
  runs the sizes in parallel, ~5 min each).
- Re-cut on 3.5 m at all four sizes: Strip (PR #634), Downtown, Cyberpunk, Camelot, Stadium, Area 51, Fairy Forest (Fairy Forest
  gained an 11×11 it never had). Area 51's FLIGHT LINE went 64 → 72 m deep (plate + the gate road / taxiway / yard lane to the new walls)
  so its 11×11 fits. Other sites are split across threads by the coordinator (1.5×-fit seven, A-H, I-Z, own boards/Clash/encounters).

### THE GROWN ROOMS — the 1.5×-fit seven (2026-10-28, same ask)
- Grown 2× (the whole LAYOUT ×2 about the room centre, so a room built on 1.75 m squares lands on 3.5 m squares square for square):
  Stonehenge's henge, Mars's Cydonia, the Moon's Mare, the Vatican's basilica + catacombs, Bohemian Grove's grove, the D.U.M.B.'s motor
  pool + Sub-Level 7 + dream lab, Bermuda's island. Each grown room on 3.5 m squares matches its old room on 1.75 m in 93–99% of cells
  (the rest: props and lips that stayed real size). All seven sites re-cut at 12 / 11 / 10 / 9 on 3.5 m, none kept an old pick.
- What grew: every position, the room's w / d, the layout's sizes (plateaus, spaces, halls, paths, ramps, bridges, decks, ridges, dips,
  hills, pools, scatter / grove areas), big blends (edge ≥ 1), block walls (t ≥ 1), banks, runners, the generator's lengths + open
  circles, noise.scale, a paint grid's res / origin, outer.m, spawn / plaza (+ plazaR) / plate / markers / doors along their walls /
  counters / npc spots / cast spots / link doors / findSpots / light shafts. What stayed: EVERY HEIGHT (a level is still 1.75 m — THE TIER
  RULE), small lips, thin walls, tree trunks, prop sizes, angles, counts, seeds. So tall solid pieces (the sarsens, rock banks) are as
  tall as before on twice the footprint (flagged to mondo).
- Climbs keep their offset from the face they lean on. Props on a square centre scale; an off-centre prop near one follows it (a desk
  with its terminal, radio and chair stays one real-size set); the rest cluster. Bermuda's four granite boulders grew with the board
  (hill + rock span ×2: one blocked 3.5 m square each, as before at 1.75).
- Mars, the Moon and the Grove were GENERATED plans (gen.kind 'rooms', not scale-invariant): FROZEN first (hqPlanFreeze — the same
  clearings and paths as hand rows, gen { kind: 'plan', keep: true }), then scaled. The Grove's tree wall: treeGap 2.5, depth 3,
  maxTrees 330 (the plan look's trunk line round a 2× boundary; was 88 + 17 trees).
- THE D.U.M.B. zone (HQ_WORLD.zones.dumb): Sub-Level 7 and the four labs re-placed so every door pair stays 0.2 m apart and facing
  (hqWorldValidate ok). HQ_ROOM_HOLES re-baked for the grown rooms (bake-holes.js) — the old rows were in the old squares.
- Tool (not in the repo): /mnt/project-files/big-squares/tools/ (scale-room.js, cmp.js, zonefix.js, README).
- SIDE ROOMS DOUBLED (2026-10-28, for the exploration fights' 3.5 m squares — a room fights on them when its biggest walkable region
  holds 36 of them, data.js hqFieldSquareFor): Camelot dungeon, Downtown cells + workings, Fairy Forest deadman's / redwoods / ritual
  grown ×2 in plan (every x z w d r x0..z1, pts pair, door / prop / NPC / spawn / plate spot and tape; heights, faces, mounts, tunnels
  and prop colliders unchanged) — the same layout on 3.5 m squares as before on 1.75 m (one region each, 72-415 big squares). The
  woods' `rooms` gen spells its clearings out (rMin/rMax ×2, perArea 420) and takes `gen.corridor` (new, the trail widths, ×2).
  HQ_WORLD underworld: cells at (166, -18), workings at (282, 74) — still on the sewers' walls, no overlap (hqWorldValidate ok); the
  workings' oubliette drift moved to z -2 to meet the sewers' seam. Gaps re-baked (bake-holes.js).
- SITES A-H ×2 (2026-10-28, thread "Upscale remaining maps A-H to 2× squares"): Agartha, Antarctica, Atlantis temple, Babel, CERN,
  the Derelict (the PR #627 ship, deck plan C 3.5), Giza, Göbekli tell, the Haunted grounds, Heaven stair + gate, Hell walkways and the
  Hollow Earth's inner sun grown ×2 in plan, `res` ×2 with them, so the old 1.75 m lattice = the new 3.5 m lattice cell for cell (93-100%
  the same "in" cells; compile times unchanged). Rails / climbs / the shell plate keep their place on a feature edge (2·edge + offset),
  real-size props keep a 0.35 m edge tolerance, an arc rail round a prop keeps its r. Gallery, Hell's pit, the ley lines and the abyss
  already hold 36+ big squares and stay as they were.
  - `gen.unit` (new, data.js `_hqTGenerate` 'rooms'): the plan's own lengths (rMin/rMax, perArea, the corridor widths, the corridor-
    count breaks) × unit, so a `rooms` plan scaled ×2 lays out the same rooms. `gen.corridor` (another thread's) wins over unit.
  - Heaven's stair: its return-guarantee rescue ramps are walker physics (jump / climb per node), not scale-free — the cloud layout
    shifted a little. Its TOP LANDING runs 2 m further north (d 14.35) so it meets the gate door's landing (pads stay 3.2 m deep, so a
    doubled gap cut the gate off — the plan then carved 24 corridors and filled the west clouds). Heaven gate sits at res 0.5
    (res 1 took 15 s and 52 rescues). Check any grown room with a raised door: every door pad must still reach every other.
  - Side rooms grown for the 36-square exploration fights: derelict airlock ×3, bridge ×2, hold ×2; haunted attic ×3.5, cellar ×2.5,
    hall ×2, nursery ×3, upstairs ×2.5; hollow earth adit / blast / mouth / oubliette / vent ×2 (cave gen.cell 2.8). HQ_WORLD `under`
    field doubled (240 × 200) with the hollow parts' absorbs; the derelict's world frames re-docked (deck 612 / 665.2, hold 600 / 570.8,
    bridge 600 / 544.6; hqWorldValidate ok).
  - Arenas re-cut on 3.5 m at every size, each site on the same room as before. `HQ_ARENA_RULES.within.prebuilt_haunted` (grounds,
    r 999): the grown cellar / upstairs passed the open-ground rule first and would have taken the grounds' board.
- SITES I-Z GROWN ×2 (2026-10-28, `grow-room.js`): Lodge, Looking-Glass, North Pole, Olympus, Revenge, Saturn, Shasta,
  Singularity, Skinwalker, Technoticlan — each arena room ×2 in plan (rooms stamped `grown: 2`), entry/link doors, marker
  (Skinwalker's HQ_AREA_MARKERS) and find spots moved with it (hqWorldValidate ok); heights, faces, ladders and prop sizes unchanged.
  Furniture keeps its group: a prop within 1.3 m of another moves as one cluster, a prop hugging a wall keeps its wall gap, a prop
  on a table rides its support. Procedural `rooms` gens (Looking-Glass, Saturn, Shasta, Singularity, Skinwalker) take `gen.grow: 2`:
  the plan is drawn at the old size then scaled, so the seeded layout is the same rooms and corridors, twice as big. grow-room.js
  compares the grown room's lattice on 3.5 m to the old one on 1.75 m (90-99% squares identical; the rest are real-size edges —
  thin walls/screens/blends no longer fill a whole square) and refuses a room already stamped `grown`.
  All ten re-cut at 12/9/10/11 on 3.5 m (Olympus still has no 11×11, as before); gaps re-baked.
- I-Z SIDE ROOMS (exploration fights on 3.5 m): Looking-Glass waiting, Revenge gundeck + hold ×2; Revenge cabin ×2.5 (×2 left its
  region at 30 big squares, under 36); Looking-Glass sea: ONLY the fight island grew (×2, its stones pushed out the same distance) —
  the jump gaps between the stepping stones are unchanged, because doubling them would make the crossing un-jumpable (30 → 56).

## 2× EVERYWHERE — exploration fights, the Clash Temple, the Training Room, the Holo Sim (2026-10-28, mondo: "2x everywhere, use multiple threads so they dont turn out bad")
Token 20261028-sq2xfield-01-cors. R2: data.js, map.js. Repo: bake-arenas.js, index.html. Shots: /mnt/project-files/2x-squares-special/.
- **Exploration fights** (data.js `hqFieldFrame`): an encounter fights on `HQ_FIELD_RULES.squareM` (3.5 m) — `hqFieldSquareFor(roomId)` reads
  the room's lattice at that square (`hqFieldLattice(id, true, 3.5)`) and takes it when its biggest 4-connected region of walkable squares
  is at least `squareMinWalk` (36); else the room fights on the battle tile until it is grown, and switches by itself once it is. A room's
  own `fieldSquareM` forces its square. `max` 24 / `min` 6 stay in squares, so a room fights on its whole lattice of big squares (the
  Skinwalker corn fields: 16 × 12 at 3.5 m, was a 24 × 24 crop at 1.75 m). map.js `_hqFieldRegister` passes the frame's `cell` to
  hqFieldRegister. Box rooms read a lattice of any square (`hqFieldBoxInfo(roomId, feet, cellM)`, cached on `room._fieldBoxBy`). A cave grid
  stays on the battle tile. Check a room:
  `node -e "const sb=require('./load-data.js').loadGameData({quiet:true}); for (const id of process.argv.slice(1)) console.log(id, sb.hqFieldSquareFor(id))" <roomId…>`
- **The rooms grown 2×** (the plan doubled, the heights kept in battle levels, the props their real size at their doubled places):
  the Holo Sim (`facility_holosim`, 63 m; terrain `tile` / ceilTile / wallTile 3.5 so a holo plate is a square), the Training Room
  (`training_hall`, 63 m; the mats' `board` cell 3.5), the Clash Temple (`clash_temple`, 192 m; the court's `board` cell 3.5). Their boards:
  `node bake-arenas.js --own prebuilt_holosim prebuilt_training` and `node bake-arenas.js clash_stage` — both now cut on
  `hqArenaSquareM(id)` (squareM / squareDefault) and write `sq` into the pick. The Holo Sim's and Training Room's 8 × 8 cells are the same
  as before (the risers, the pylons, the flat mats the lessons pin); the Temple's 10 × 10 court is flat flagstones as before.
- **THE GAPS** (HQ_ROOM_HOLES) are baked on the old room's 1.75 m squares: rerun `node bake-holes.js <roomId>` after growing a room (the Holo
  Sim's old gaps landed on the new board's corners until it was rerun).
- **Not changed**: the voxel boards (the full-site voxel maps, the area Δ 8 × 8s, every "· voxel" board) — reported to mondo, waiting on his call.

## THE DOOR AT BODY SIZE + THE SHEET SIZE QUESTION (2026-11-03, mondo: "did that stretch the terrain textures to cover a 2x2 instead of 1x1? ... the door model that the characters walk out of at the start of a match is too big for them now")
- The match intro's crossing door (three-renderer.js `_introBuildDoor`) is built in battle tiles (leaf 1.35 tiles tall). On 3.5 m squares the
  bodies are half a tile (UNIT_SPRITE_SIZE_RATIO 0.5), so the door stood twice their size. `_introBuildDoor(…, bodyK)`: the match intro
  passes UNIT_SPRITE_SIZE_RATIO and the door proper (frame, leaf, seal, case line) is scaled by it about its foot; where it stands
  (doorOut, tiles) and the walk path are unchanged. The main-menu door passes nothing (1). Online: both clients build it locally.
- The terrain sheets did NOT stretch: a terrain room's floor / cliff / path sheets are laid in metres (HQ_TERRAIN_RULES.tile 1.75 m per
  sheet, triplanar `uTriTM`), so a grown room on 3.5 m squares shows a 2 × 2 of sprites in each square (probe: 0.5 squares per sheet on
  Stonehenge / Skinwalker). Board marks (`k: 'board'` chess courts) tile at the same 1.75 m. Holo Sim is the exception (tile 3.5).
  mondo picked "one sprite per square" from side-by-sides (/mnt/project-files/terrain-sheet-size/). three-renderer.js `_hqSheetM(info)`
  = max(info.tile, room.fieldSquareM || HQ_FIELD_RULES.squareM): `_hqBuildTerrain`'s TS (the field's UVs + info._TM, the triplanar
  floor / cliff / path / paint, and the wall boxes' _nrBoxUV). TM stays info.tile × U: it is ALSO the model scale (_nrKit ts, trees, traffic,
  hulls) — doubling it doubled every tree (Codex review on PR #840). The water sheets keep TM too.
  the board marks' `tl` (chess courts: one sprite per court cell) and `_fieldPatchRep` (spell skins / strata) all read it, in fights
  AND exploration (the room is one mesh). No lattice read (hqFieldSquareFor takes seconds on a big room; all 82 terrain rooms pass it
  at 3.5 today). A room that someday fights on 1.75 m would still draw 3.5 m sheets: give it `fieldSquareM: 1.75`. Box-room floors,
  walls and the city sprite buildings are unchanged. Kill-switch `window.EW_SHEET_REAL_SIZE = true` (back to 1.75 m sheets).

## THE OPEN SKY SHOT (2026-10-29, mondo: "maybe temporarily fade the celing out for sky and celestial events")
- 10-28 playtest: the Pisces zodiac crane on Hell Arena (site_prebuilt_hell_walkways, a true-ground room) went black. Checked in a
  browser: the kept ceiling was ALREADY faded there (the sky-gaze lift puts the eye over it, `_fieldGroundTick` op 0.03); the room's
  own fog (FogExp2 0x1a0604) swallowed the wheel and the stars. Density 0 at the same camera = the wheel reads.
- three-renderer.js `setSkyShotOpen(on, ms)` + `_skyOpenTick` (after `_fieldCycleTick` in the frame): k eases 0 → 1 → 0; the
  true-ground ceiling's opacity × (1 − k) (`_fieldGroundTick`), and scene fog density (linear: near/far ÷), the height fog
  (`_EW_HFOG.z`) and the dome band (`_envUni.uFogAmount`) × (1 − k). Thinned, never removed (no recompile). Each value is
  tracked: a writer that changes it mid-shot becomes the value it returns to; at k 0 the exact values are put back.
- state.js `playSkyCinematic`: open over the crane up (upMs), close over the crane down (downMs), and `finish()` closes too (the
  safety net). Runs wherever the cinematic runs (the guest plays it from the announcement relay), nothing new relayed.
- Harness note: `_updateZodiacWheel` eases `sg.act` per FRAME (× 0.14), so at the harness's ~3 fps the wheel stays dim through a
  live cinematic; prove the look with a held camera at `getSkyShot('zodiac')` instead. Proof: /mnt/project-files/sky-shot-ceiling/.

## THE CLIFF LINE + THE FALLS (2026-10-30, mondo, VS CPU on his editor room 10: "block up with hard sheer edge, liquid doesnt flow over the edge, and it draws the nexus perimeter on the cliff side")
- Cause: on the true ground every drape reads the room's ground under each vertex (up to HL_FIELD_MAX_DY = 1 tile off the cell's
  top). A cell beside a sheer face (a hard-edged BLOCK UP, a dig's wall) read the face's foot (or its top) past the edge, so a zone's
  rim bent down the cliff and a spell pool's sheet hung tongues down it; and the true ground drew no waterfall at all (only tile
  boards had the WATERFALL COLUMNS), so the liquid never visibly went over the edge.
- three-renderer.js `_drapeCliffCut(h, S, step)`: a vertex steeper than DRAPE_CLIFF_RISE (1.2 rise/run, past the walker's maxSlope
  1.0) from its neighbour toward the cell's centre holds that neighbour's height. Used by `_buildDrapeGeo` (every move / spell / AoE
  plate and every zone wash: flat on the walkable top), `_liqBlendGeo` and `_fieldPatchGeo` (the sheet also fades out past the
  edge). Off: window.EW_NO_CLIFF_CUT.
- `_fieldFallBuild` (from `_fieldSkinBuild`): for each liquid cell (painted pool or spring runoff) beside a same-liquid cell more
  than half a level below across a sheer break, a falling sheet stands where the ground breaks on the line between their middles,
  from the top sheet to the lower one (plus a lip when the edge lies inside the lower cell); its texture scrolls via
  `_waterfallTexList` (the field branch of rebuildTerrain now disposes the old clones). It only draws where the rules' runoff
  (map.js getLiquidFlowAt) already put liquid below. Off: window.EW_NO_FIELD_FALLS. Renderer only; the guest derives it from the
  synced terrain + springs.
- Same day, mondo: "it doesnt look like the other liquid at all, you just made it a plain sprite? its not even the same color".
  The fall was a plain Lambert sheet of the liquid's base sprite (no waves, caustics, tint or alpha). It now uses the SAME
  material as the sheet above it (`_liqBlendMat(key)`, the cell's body key), normals up so the light reads the same, one sheet tile
  per square, both windings (the shared material is front-side), and `_fieldFallTick` scrolls the fall's own UVs down the face
  (from `_updateFluidWaves`; the shared material is never touched). No texture clones any more.

## THE ROOFS — climbable buildings + rocks (2026-11-01, mondo on Cyberpunk City Arena: "i want to be able to climb the building just like i can climb terrain"; "enter building"/"take lift" are dead code, remove them)
- Existing Jump + Climb rules only (PR #365/#718): no new rule. A roof is just a tall tile.
- data.js THE ROOFS (`HQ_FIELD_ROOF_RULES`, `hqFieldRoofOf`, `hqFieldRoofsApply`): in a site-room raster, a rock ('#') cell
  whose centre sits on a CITY LOT (gen.kind 'city', solidMass, ≥50% of its samples on one lot) becomes a real tile at
  that lot's top (`hqTerrainSolidTop`, base + storeys×3.4 m), tier by the usual step (uncapped to level 20, not tierMax 3).
  A flat rise mass (all samples within 1.2 m) becomes a tile at its height. Called from hqFieldBuild AND hqArenaUpgrade,
  so arenas and exploration fights both get it. field.fixed marks roof cells 'R' (`fieldCellRoof`, battle.js) and the
  spawn-zone ripple (map.js `_clearSpawnZoneTiles`) no longer lowers them. Kill switch: `window.EW_HQ_NO_ROOFS = true`.
- NOT made climbable: non-city solidMass "walls"/halls (Giza, Olympus, Antarctica, Agartha, North Pole, DUMB, CERN…)
  and trees — those stay rock (flagged to mondo).
- Red squares on rock that stays rock: the field now carries `rockTops` (the rock's real top), and three-renderer.js
  `_fieldGroundTop` puts the square there instead of floating at the rock's level column.
- Drawn roof vs engine roof: the renderer records each lot's drawn stand height (`_hqLotStand`, sprite buildings via
  `_nrSpriteBuilding` `onRoof`), and `_fieldGround` draws roof tiles/units at THAT height. Engine height (climb faces)
  still comes from the data storeys, so a tall sprite building can look taller than the climb it costs (flagged).
- Removed (dead): battle Enter Building / building crush / emerge, `_insideBuildingId` everywhere, the Take Lift pusher,
  the voxel boards' `roofWalkable` exclusions (their 2×2 roofs are now climbable like any tall tile). The HQ
  exploration elevator ('lift' kind) is NOT the battle lift and stays.
- Proof (Playwright, Cyberpunk City Arena): Goblin (jump 2) offered CLIMB onto C12 roof (rise 4), hung, round 2
  "pulls up onto the ledge at C12", standing on the drawn roof. Shots in /mnt/project-files/roof-climb/.

## THE CRYSTAL SHEET (2026-11-02, mondo: "replace all crystal.png terrain in the game with liquid_blue_1 or liquid_blue_5, but not as liquids with a noise layer, just as solid textures")

crystal.png is out of the game (it stays in the bucket, unreferenced). Every place that wore it now wears one of mondo's blue
liquid sheets (R2 `Assets/Sprites/terrain/liquids/`) as a PLAIN SOLID texture: `crystal` is not a `_LIQUID_STYLES` row, so
there is no flow, no wave/noise layer, no caustics, and the Crystal Formation's rules (move 1, vision +1, MP regen, the
crystal-vein detonation) are untouched.

| place | sheet |
|---|---|
| sprites.js TERRAIN_SPRITES.crystal: the Crystal Formation tile (battle boards, voxel maps, HQ rooms with `floor/wall/dado/path/cliff: 'crystal'`, editor + voxel-editor swatches, terrain-column VFX) | Liquid_Blue_05 |
| everything that reads the `crystal` key through _hzTex / K.mat: _hzCrystalShards (horizon/field shard clusters), the armillary crystal nucleus, the Fairy Forest toadstool + glass fallbacks, the accretion rim's leaning shards | Liquid_Blue_05 (follows the key) |
| ~~three-renderer.js `_getCrystalTexture`: the cone clusters on crystal tiles~~ | gone, see THE CRYSTAL MODELS below |
| battle.js loading-screen preload list | Liquid_Blue_05 in place of crystal.png |

Not changed (never used crystal.png): the HQ `crystal_cluster` proc prop (untextured phong), the craftShards 'crystal' kind
(untextured), the per-map `tints.crystal` colours, the Meshy crystal shard/ball GLBs.

## THE ONE PIXEL GRID (2026-11-07, mondo on Mount Shasta, Firefox ?ew_gpu=webgpu, close camera: "why are there mixels/blurriness on the grass? It's pixel art, it should not look like this")

**UNDONE 2026-11-08 (mondo: "can you undo the original grass fix you did then? it still looks ugly").** The PR #1040 game code was reverted:
the 8 sheets load their original 1024 px files again (no ewPixelSheetUrl / TERRAIN_PIXEL_SHEETS), _hzTex/_hqTex magnify LINEAR again, and
_ewGpuNoMipsUnlessSampled is gone. Token 20261108-softgrass-01-cors. THE ONE PIXEL DENSITY (1 sheet per square everywhere, PR #1042)
stays. The px/ bakes stay in the bucket unused, and bake-pixel-sheet.py --size/--keep stay as tooling. Do not re-apply this without asking him.

Three causes, all fixed. Token 20261107-pixelgrid-02-cors. R2: sprites.js, three-renderer.js + 8 new sheets. Proof: /mnt/project-files/pixel-grid/.
- **The sheets**: 8 terrain sheets were never 128 px pixel tiles. grass_2 (Mount Shasta's base), dirt, cave_floor, deep_water, obsidian,
  forest_2, cloud_2, lava are 1024 x 1024 paintings made to LOOK like pixel art: soft anti-aliased "pixels" of mixed sizes (11,000-
  194,000 colours; the real pixel tiles have 24 on a hard 128 grid). That is the rounded-corner blobs + mixels in his shot. Each is
  baked once by `bake-pixel-sheet.py --size 128 --keep 4 --sharpen 80` (box-average 8x8 -> 1 texel, wrap-safe light sharpen, 24-colour
  median cut with 4 colours kept for the worst-fitting texels so the cave gems / dirt sprigs survive, then 4 k-means steps so nothing
  drifts in hue) to R2 `Assets/world/terrain/px/<same name>.png` (sha e319bb41 grass_2, 3e5d9940 dirt, c167c782 cave_floor, 5ff0ec8a
  deep_water, eb097928 obsidian, 94588d40 forest_2, 6d340200 cloud_2, 475fe3e0 lava). Same picture, same mean brightness (cloud_2 0.922
  -> 0.920, so TERRAIN_WHITE_SHEETS' 0.71 still fits; it is keyed by basename, which is unchanged). Originals untouched in the bucket.
  sprites.js `TERRAIN_PIXEL_SHEETS` + `ewPixelSheetUrl(url)`: TERRAIN_SPRITES rows point at px/, and three-renderer.js textureLoader.load
  sends ANY load of terrain/<one of the 8> to px/ (the fluid tops' `base + key + '.png'`, the spell pieces' _sigTerrainTex, _deployMat,
  the foliage leaves). Kill switch: `window.EW_SOFT_SHEETS = true` before load. Not touched: hud.js UI Maker stage CSS background
  (grass_2 as a 2D backdrop); the liquid sheets (liquids keep their noise look); sand.png (3,870 colours, his ambientCG pick).
- **The linear magnification**: the 11-05 crystal note said every board tile goes through getTexture (Nearest). Wrong for the HQ engine:
  every site board's field (_hqTerrainMat: floor / cliff / path / painted sheets), walls and buildings read `_hzTex`, and HQ rooms read
  `_hqTex`, both magFilter LINEAR + trilinear mips (written for far scenery buzz). Up close every texel was bilinear-smeared into its
  neighbours. Both are magFilter Nearest now; minification stays trilinear + anisotropy (no buzz at distance). Kill switch `?ew_softmag=1`.
  (On WebGPU three only enables anisotropy when all three filters are linear, so far grazing ground there has no aniso now.)
- **The WebGPU mips**: three 0.186.1's node renderer builds a mip chain for every texture with generateMipmaps = true (three's default)
  and its WebGPU sampler cannot say "no mips" (minFilter Nearest -> mipmapFilter 'nearest', lodMaxClamp 32), so on WebGPU every
  Nearest/Nearest sheet (getTexture boards, fluids, props) was drawn from its box-blurred half/quarter copies wherever minified: blur +
  blocks 2x/4x/8x across one floor. WebGL never samples mips for a Nearest/Linear minFilter. `_ewGpuNoMipsUnlessSampled(r)` (init) makes
  `r._textures.needsMipmaps` false for a Nearest/Linear minFilter texture with no uploaded mips (not render targets / framebuffer
  textures): one level, exactly as WebGL draws it. Kill switch `?ew_pixmips=1`. Checked on headless WebGPU (swiftshader): patch active,
  Nearest sheets mipLevelCount 1, the field (LinearMipmapLinear) 8. Headless WebGPU screenshots come out black (canvas not captured), so
  the on-screen proof is the WebGL2 run.

## THE ONE PIXEL DENSITY (2026-11-08, mondo on Mount Shasta: "there is not consistent pixel density. Why is this wooden bridge look way more crisper than the grass and the dirt?" + "is it from stretching the terrain to fit over 4 squares instead of 1? Maybe it should just go back to 1")

Answer: the grass is NOT stretched. The field (`_hqTerrainMat`, triplanar `uTriTM = TS`) measures exactly 1 sheet per 3.5 m square
(the one-sprite-per-square rule, PR #840). PR #840 moved only the field. Every other piece of the HQ engine board kept tiling by
`TM = info.tile*U` (the 1.75 m MODEL tile), so decks, bridges, water, walls, door surrounds and the kit buildings drew 2x2 sheets per
square (small trims finer still): 2x the texels per metre of the grass beside them = "crisper". Token 20261108-onedensity-01-cors.
- **GOTCHA: TM vs TS.** TM (= tile, 1.75 m) is the size scale for models / pieces. TS (= `_hqSheetM(info)*U`, the 3.5 m square) is
  the ONLY sheet scale. Never tile a terrain sheet by TM.
- Fixed at source: `_hqWaterGeoms(... TS ...)` + `_hqGridWaterBuild(... TS)` (were TM); `_nrKit(ctx)` takes `ctx.sheet` (UV scale)
  apart from `ctx.ts` (size), and the cave kit, the terrain kit and the proc kit pass the square.
- **The one density pass** `_hqOneDensity(root, TS)`: every non-triplanar mesh whose map is an `Assets/world/terrain/` sheet with
  Repeat wrap (textureLoader.load stamps `tex._ew_src`; `_hqTex` dependants copy it) has its median sheets-per-unit measured per
  geometry group (array materials by materialIndex) and its UVs scaled so it is 1/TS (skips |k-1| < 3 %, instanced, skinned,
  alphaTest leaves, `_ew_wuvOwner`; a geometry shared with another mesh is cloned first). Runs at the end of `_hqBuildTerrain` and,
  via `_hqOneDensityRoom()`, over shellGroup + doorGroup + propGroup after `_hqBuildClimbs` (battle path, stage step, `_hqEnter`).
  Kill switch `window.EW_SHEET_ANY_DENSITY = true`.
- Audit (texels per world unit per mesh, WebGL2 headless): Shasta, Giza, Camelot, Cyberpunk: every terrain-sheet surface 1.00
  (water 0.99 / 0.985) - was 2.0 on decks, bridge, water, walls, door surround, city roofs. Proof (bridge before/after):
  /mnt/project-files/pixel-grid/bridge_density_before_after.jpg.
- NOT covered: GLB props (their own textures / atlases, UVs can't be retiled), tree-model leaves, the horizon sea (`_hzTileUV`,
  already 1 per square via HZ_TEX_DENSITY 0.5).

## THE CRISP CRYSTAL SHEET (2026-11-05, mondo: "figure out why the blue liquid texture you replaced the crystal texture with (crystal terrain, not the crystals) is so blurry. All pixel sprite 128x128 terrain tiles are supposed to have the same pixel density")

- **Cause**: not the sampling (CORRECTED 11-07, THE ONE PIXEL GRID: the HQ engine's boards used _hzTex, linear-magnified). The crystal tile goes through the same getTexture path as every board tile (NearestFilter, one
  sheet per 3.5 m square). Liquid_Blue_05 is 128x128 too, but it is a smooth painting: 6,314 colours and soft gradients
  (mean neighbour step 7) where the pixel tiles (moon, moon_3, grass, rocks_5, ice) are 24 colours with hard texel edges
  (step 18-22). Same pixel count, but its detail is wider than one texel, so it read as a smear next to them.
- **Fix**: `terrain/crystal_blue.png` (R2, sha 778e51e8) = Liquid_Blue_05 baked by `bake-pixel-sheet.py` (repo tooling):
  unsharp on a 3x3 wrap (stays seamless) + 24-colour median-cut palette, no dither. Same picture, same 128 px grid, crisp
  texels. sprites.js TERRAIN_SPRITES.crystal + battle.js loading-screen preload point at it; every `crystal` _hzTex user
  follows the key. Liquid_Blue_05 itself is untouched (LIQUID_SHEETS / editor still wear it).
- Not touched: the other 47 liquid sheets are just as soft, but they are liquids (flow + noise layer). dirt.png, lava.png and
  obsidian.png on R2 are 1024x1024 photo sheets, not 128 px pixel tiles. Both are open questions for mondo.
- Proof: /mnt/project-files/crystal-crisp/.

## THE STREET FURNITURE — the city props on their lines (2026-11-02, mondo: "in disaster city and the strip and cyberpunk city etc, there are a lot of street lamps and signs and poles etc that are just placed really wrong or in the middle of a street ... BENCHES (another one that is really misplaced) ... Remember that every map was rebuilt to make sense on the square grid" + "really define the difference between the road and the sidewalks")
Token 20261102-streetfurn-03-cors. R2: data.js, three-renderer.js. Shots: /mnt/project-files/street-furniture/.
- **The cause**: a city room's `scatter` rows (bins, hydrants, signposts, benches, plants, cones, barrels, manholes, machines) fell on a
  RANDOM sidewalk spot with a RANDOM heading (the old kerb rule only kept them in the band by the building line, and a street that runs
  to the shell's edge or a square's open circle let them into the road); `street_drain` (the manhole decal) stood on the sidewalks; the
  street lamps walked every street every 14 m with no check for the other streets (lamps in the middle of junctions); the race gates'
  orange posts (the "yellow poles") stood at the lap's width, so on a lap leg that crosses another street they stood in that street.
- **The rule** (data.js `HQ_CITY_FURNITURE`, read in hqTerrainCompile after the trees): a city row of a kind the table names stands on a
  BAND of its street — `kerb` (just inside the kerb stones: bins, hydrants, signposts, a vendor), `back` (against the building line:
  benches, plants, boxes, machines), `gutter` (in the road by the kerb: cones in rows of three, barrels), `lane` (a lane's middle: the
  manholes) — at spots on the squares' lines (an axis-aligned street's spots at whole multiples of 1.75 m), never in another street's
  road, never on a crossing's landing (`cross` 4.2 m past another road's edge), never on a plaza (`gen.open`), facing the road (`face:
  'road'`) or laid with it (`'along'`). The seeded pick is among the band's spots, so the layout is fixed per room. A row with its own
  area keeps its area; a square's furniture (plants, benches, bins, machines) never lands in a street's road, while debris (the
  collapse's rubble / cones / cinder blocks, the quay's freight: `debris: true` or a road band) stays where it fell, in the road too. info.lamps = the lamps: a
  CORNER POST at each corner of every square crossing, then the kerb line every 14 m (alternating sides, on a 3.5 m line, sliding to
  the next line off a crossing / a door / a parked car), nearest the room's middle first (cap 44). three-renderer.js draws info.lamps
  (the old walk stays for a survey without it); the speed signs and the road's own manholes keep clear of the lamps, the scatter, the
  props, the plazas and the junction corners; the race gates' posts stand on the KERB of the street the lap runs on and a gate slides
  off any bend / junction / plaza / door (the lap's own crossing width is unchanged).
- **The road and the sidewalk**: the pavement sheet is cut by the streets' own lines (three-renderer.js THE ROAD'S EDGE: never on a
  road, a sharp edge on the kerb line; open asphalt between streets — lots, squares — stays asphalt: a first try that laid a full
  sidewalk along every road edge painted pavement over stop lines in the Strip and was dropped); Downtown and the Strip's asphalt a shade darker (`floorTint`; Cyberpunk's dark
  slate sidewalks already read against its asphalt). The kerb's height (0.12 m) and every walk rule are unchanged.
- **Hand moves** (the placed props): parked cars on the sidewalks put in the lanes by the kerb (Downtown high street + waterfront,
  Cyberpunk back street + lower cross), the Strip lane works out of the lane, Cyberpunk's vending machines / pachinko machines / market
  fire out of the roads, Downtown's church-square trees off the church lane and the high street's kerb, two dock trees out of the cross
  street's east leg, a planter under each traffic-island tree at the plaza.
- **Checked**: lots unchanged (hqTerrainInfo lots sha Strip 6f6c2466, Downtown 91447f34, Cyberpunk 076f8adf = main); every arena
  pick's raster (12 / 9 / 10 / 11, all three sites) identical to main; no prop of a named kind in a road it does not belong to.

## THE CRYSTAL MODELS (2026-11-02, mondo: "those crystal cones that appear everywhere, i think they look really bad and i dont want them ... use the meshy glb crystal shards ... definitely get rid of these ones from everywhere in the game")

Every crystal cluster that was a fan of textured 5-sided cones is now built from the Meshy crystal GLBs in R2 `Assets/misc/`
(the same files the spells throw: `Meshy_AI_crystal_shard_1027232226_texture.glb` = one tall spike,
`Meshy_AI_crystal_shards_1027232219_texture.glb` = a ground cluster; both have `.opt.glb` copies in ASSET_MANIFEST).
One helper, three-renderer.js `_crystalModel(kind, h, o)` ('shard' | 'shards', height in world units, o.yaw, o.tilt,
o.cosmetic = no raycast/shadows, o.matPick), wraps `_miscModelInstance` (async, no stand-in).

| place | was | now |
|---|---|---|
| `_buildCrystalCluster3D`: the decorations on ~40% of crystal tiles (every board) | 3-5 violet cones | the shards cluster (0.32-0.52 tile tall), half the time a lone shard beside it; cosmetic |
| `_hzCrystalShards`: horizon/far-roster crystal clusters, the `crystal` board monument (`M.mon('crystal', …)`), floating-island crowns, the near kits' crystal spires | 3-6 big cones + an additive glow pool | a big shards cluster at the heart + 2-4 lone shards round it; the glow pool is dropped (it would have given the async monument fit a bogus box) |
| `_NR_BUILDERS.singularity`: the shards leaning out round the slab | `K.mat('crystal')` cones | lone shards, same lean + the same small violet lamps |
| HQ proc `crystal_cluster` (the crystals on the SE floor) | 5 phong cones | shards cluster + one tall shard (room's `_hqPropMatPick`); the soft glow sprite kept |

Not touched (not crystal cones): the frost door's ice spikes, the ice-finisher frost crystals on a body, the blood-sigil spikes,
the octahedron gems (beacon crystal, armillary nucleus, the gold gem), the craftShards debris that flies when crystal detonates.
`_getCrystalTexture` is gone. Proof shots: /mnt/project-files/crystal-blue/cones_*.

## THE GEMS (2026-11-02, mondo: "i still feel like those crystals arent looking good, probably bc youre reusing the same crystal bunch mesh and it looks repetitive/unrealistic ... Need different colors, different shapes/geometry, different crystals; ruby, diamond, sapphire, emerald, quartz, lapis lazuli, amethyst, etc. I think crystal guardian might already have some models for these possibly?")

**What R2 has**: two crystal meshes only, the Meshy `crystal_shard` (one spike) and `crystal_shards` (a ground cluster) in
`Assets/misc/` (+ `crystal_ball`, a weapon). Crystal Guardian has its body model only; its gem spells (THE GEM SPELLS,
three-vfx-effects.js `_cg*`) tint the same shard. No gem pack, no per-gem models. Both bakes are pale (shard ~#c4d7e7, cluster
teal ~#99bab9), so the bake × a gem colour keeps the Meshy fractures inside the colour.

**How it works** (three-renderer.js, beside `_crystalModel`):
- `_GEMS` = 13 gems: ruby, sapphire, emerald, amethyst, diamond, quartz, rose (quartz), smoky (quartz), citrine, topaz, aquamarine,
  garnet, lapis. Each row: colour, inner glow (emissive), specular + shininess (Phong sparkle; lapis is matte), its growth `forms`,
  girth range `w`. `_gemMatPick(gem)` = one shared Phong per gem + bake (`_ew_shared`, never disposed by a board rebuild).
- `_crystalModel(kind, h, o)` gained `o.gem` (the gem's material) and `o.widen` ([x, z] girth; the fitted height stays).
- `_gemCluster(rnd, h, gem, o)` builds one growth from the SHARD (and, for `bed`, the cluster pressed flat): `druse` = 4-7 points
  fanning out of one root, `points` = 2-4 long near-upright prisms, `chunk` = 1-3 squat half-sunk stones, `bed` = the flat cluster
  with points through it. Every piece has its own height, girth, lean, heading and spin. `o.form` forces, `o.max` caps the pieces.
- Board crystal tiles (`_buildCrystalCluster3D`): VEINS: tiles in the same 3×3 patch share a gem (offset/seed from the board's
  size + mapEnv.tint, which the guest mirrors, so both sides see the same gems), 22% of tiles another gem; max 5 pieces a tile.
- `_hzCrystalShards` (horizon, the `crystal` monument, island crowns, the near kits' spires): one gem per outcrop, a big growth at
  the heart + 2-4 smaller ones round it (a quarter another gem).
- Singularity rim: each leaning shard amethyst / quartz / smoky / diamond with its own girth (the violet lamps kept).
- HQ proc `crystal_cluster`: a gem per prop (seeded), its glow sprite in the gem's colour.
- `_hzGeode`: the octahedra inside are gone; the lining is druses / points of one gem (amethyst most often, else quartz,
  citrine, smoky), the glow core in its colour.
Looks only: no rule, terrain or element reads the gem. The Crystal Guardian spells are untouched.

**For truly different geometry** (a diamond octahedron, a hexagonal emerald, a lapis boulder…) R2 needs new Meshy files; the
forms above are the most the two meshes give. Proof shots: /mnt/project-files/crystal-gems/.

## THE SQUARE WATER — natural water on the squares with the spell water's soft shore (2026-11-02, mondo: "Can we make the natural water on the maps look and behave more like the water that covers tiles caused from spells and rain? ... rough edges or it looks like you were trying to make them round while only make straight right angle cuts ... place and design the rivers and ponds and lakes etc in such a way that it snaps/works with the square grid ... this does not include the deep/ocean, atlantis")
- data.js `HQ_FLUID_GRID_RULES` + `hqFluidGrid` / `hqFluidGridDin` / `hqFluidGridCover`: every room `pool` / `stream` row (water, deep
  water, and any editor liquid but lava) is laid on the 3.5 m squares every fight plays on since 2× EVERYWHERE (the 1.75 m battle tile
  fits it too: 2 × 2). A pool square = its outline GROWN BY HALF ITS BANK covers ≥ half of it (the old sheet ran out over the bank, so
  the ponds keep the size they were drawn at — first try used the bare outline and every pond shrank visibly) OR its centre is inside
  the outline (the old battle read, so no water square was lost). A stream = `round(w / 3.5)` squares wide (≥ 1; w + bank put Shasta's
  stream on its arena's spawn tiles), the AUTHORED centreline walked square by square (a diagonal step adds the side square, never a
  corner-only joint). Skipped: lava (`skipKeys`), Atlantis (`skipSites`), drowned rooms (`sea.under`), cave grids,
  a row with `round: true` (escape hatch, no row uses it). The sea rooms swim in `terrain.sea` and are untouched.
- One shape for everything: the fluid's `gq` (plain data, crosses the survey worker). The signed distance is exact past `win` (0.4 of
  a square = LIQ_SHORE_H) and the squares' COVERAGE of a ± win window inside it (the spell sheets' `_liqCover`), so outer corners
  round and inner corners fill. The carve's bank now runs INSIDE the squares (ground at the squares' edge = the ground), so the water
  you see is the squares' water; `hqTerrainFluidAt` (battle cells, wade, feet) reads the same shape.
- three-renderer.js `_hqGridWaterBuild`: one see-through sheet per body (water + deep water at one height), 12×12 verts per square
  (a square wholly under water = one quad), alpha = the coverage eased like `_liqBlendGeo` × `GRID_WATER_DEPTH_FADE` (the water's
  depth over the ground, ±0.12 m: the shore melts into the bank / noise instead of a cut line), deep water a second sheet (coverage over
  LIQ_DEEP_H). Same materials as spell water (`_liqBlendMat`), same order (LIQ_BLEND_ORDER: tile plates draw on top). The old flood
  outline (`_hqWaterOwners` / `_hqWaterGeoms`) still draws lava. `window.EW_HQ_WATER_STEPS` = the old whole-cell quads for everything.
- Arenas: every pick cut from a water room was re-rastered AT ITS OWN WINDOW (no re-search) and its house tiles re-checked; changed
  cells written back: Heaven 12 (the rift's rim cliff cells are cloud floor, the rift a little wider), Hollow Earth 12/9/10/11 (the
  inner-sun lakes a square bigger at the edge), Bohemian Grove 10/11 (lake edge), Fairy Forest 10/11 (the brook joined). Bohemian
  Grove 12 had its grown lake on a spawn tile, so `node bake-arenas.js prebuilt_bohemian_grove` re-cut it: 11,9 → 10,9 (one square
  west). Every other pick identical. Fairy Forest's own 20×20 board fails its house check on main too (not touched).
- Not changed: the voxel Δ boards (their water is tile boxes, the same as a spell's water there).
- PASS 2 (same day, from the after shots): with half the bank the small ponds came out as a plus of five squares (Shasta's pool, the
  Haunted pond) and a dark ring showed round every pond (the carved bank seen through the fading rim). Now a pool's outline is grown
  by its WHOLE bank (Shasta = 3 × 3, Haunted = 5 × 5 with round corners), and under the fading rim (cover < 0.78, 0.56 × win in) the
  ground sits a hand (0.15 m) under the surface; the bank starts past that. Arenas re-read again: Heaven 12 (4 squares of the
  healing pool's plateau one level lower), Hollow Earth 12/10/11 (a lake square or two), Bohemian Grove 12 (one lake square), Fairy
  Forest 10/11 (one corner square by the brook now rock: the island's slope flips on any change there). Hollow Earth 9 had a lake
  square on a house tile, so `node bake-arenas.js prebuilt_hollow_earth --size 9` re-cut it: 14,18 → 16,17 (no water on it now).
- PASS 3 (same day, mondo on the Shasta pool shot: "again, what is up with these serrated edges? Is it the way the terrain is being
  deformed?"). Yes, two things: (1) pass 2's 0.15 m drop in a 0.8 m band under the fading rim was sampled by the ≈0.5 m field as
  a saw, and its slope shaded dark round every pond; (2) the sheet was LEVEL, so wherever the ground's own noise rose a hair over
  the surface the ground cut it on a jagged line. Now: THE SHALLOW RIM — inside the squares, ground at or over the surface eases
  down to 0.1 m under it across the whole shore window (1.4 m: a slope the field draws smooth), and the bank proper starts past
  that window, under full cover (deep water keeps its bank at the edge, so its rim squares stay deep); THE LAID SHORE —
  three-renderer.js `_hqGridWaterBuild` lays the sheet ON the ground (+0.15 m) wherever the ground stands up to
  `HQ_FLUID_GRID_RULES.layH` (0.2 m) over the surface and fades it out past that (a deck, a walk, an island, a wall stay dry;
  0.5 drew the water over the footbridges), so the fade is the only edge; 24 verts a side on a shore square (12 showed steps on an
  inside corner). `hqTerrainFluidAt` and the field raster's wet read use the same layH rule, so the drawn water = the wet squares.
  The snapped squares now hold water to their edge even where they reach past a channel's drawn banks (the sewer walks).
  Arenas re-read again (all house tiles ok); against pass 2 only Heaven 12 (the healing pool's plateau squares), Cyberpunk 12
  (heights of the street by the canal, and the rock tiles that follow them) and Fairy Forest 10/11 (two brook-side squares) changed.
- THE SUNK SURFACE (same day, mondo: "honestly i kinda liked when liquids were shown as slightly lower than the ground, it helped
  contrast bodies of water from terrain. but that was with the voxel maps, can we do something similar in the current maps?"):
  `HQ_FLUID_GRID_RULES.inset` = 0.3 m (the voxel boards' WATER_TOP_INSET 0.18 × the 1.75 m tile). hqTerrainCompile's `fluidY(f)`
  sinks every square water's surface by it (the fluid row's `y`, so the sheet, the wet read, the wade and the battle cell's sheet
  all follow), and the shallow rim and the bed sink with it (depth unchanged: wading reads the same). The ground round the water is
  untouched, so the shore is a 0.4 m smooth step down over the 1.4 m shore window. Arenas re-read (levels only: Heaven 12,
  Cyberpunk 12, Antarctica 12/9, Fairy Forest 10/11).
  0.3 → 0.5 m (mondo: "i think it needs to be a little bigger (the drop)"). Hollow Earth's inner-sun floor then read a level over
  its sunk lakes on the 12 and 9 boards' house tiles, so `bake-arenas.js prebuilt_hollow_earth` (+ `--size 9`) re-cut them:
  12 17,15 → 18,18; 9 16,17 → 17,17. The other picks re-read in place (levels only).

## THE STORM ZONE SHEET (2026-11-03, mondo: "replace this weird looking cloud with a lightning bolt from everywhere in the game")
- `storm` (Storm Zone terrain, also Saturn's cliff + storm-wall key) never had a TERRAIN_SPRITES row, so every path fell back
  to the legacy `_terrainSvg` doodle (a faint smudge + one yellow bolt). On opaque walls/tiles it read as a black blob
  stamped with bolts (Saturn arena walls).
- Now `storm` wears `terrain/fog.png` (a grey pixel cloud sheet, no bolts) and `TERRAIN_BASE_TINT.storm = '#a4b0cc'`
  cools it to slate on the board / near kit. (fog_wall, the other key on fog.png, is dead code per mondo 11-03.)
- Same day, mondo: "yes i want the cloud thick gone too". `cloud_thick`'s own sheet (grey storm cloud with white lightning
  forks) is no longer used: the key wears `terrain/cloud_2.png` (the painted puffy cloud). Map tints still colour it.
  HQ room wall paths (_hzTex direct) skip the base tint: there it is the plain grey cloud under the room's tints.
- Before/after: /mnt/project-files/storm-zone/saturn_storm_walls_before_after.jpg. No rule changed.

## THE CONE MOUNTAINS GONE (2026-11-03)
mondo (Antarctica Arena screenshot): "can we please get rid of these mountains in the game, they look terrible". They were the
room landmark kinds `peak` / `mountain` (three-renderer.js `_hqLandmarkBuilders`): a 12-sided ConeGeometry rock cone, shoulder
cones and a white cone for snow, hung on the battle's 82 m disc, so in a wide room (Antarctica 140 × 112 m, Mars, the Clash temple
192 × 192) they stood right behind the arena walls. Placements removed from data.js: Shasta (HQ_WOODS_LANDMARKS, 5 woods rooms;
HQ_RANCH_LANDMARKS), the Range (hqAirbaseShell, 2 rooms), THE TRANSANTARCTICS (prebuilt_antarctica), OLYMPUS MONS (prebuilt_mars),
clash_temple's three. Both builders deleted; the editor's sky-mark list lost both kinds (its "add mark" adds a `tower`). THE ROCKS'
asteroid GLBs stretched into a massif were tried first and looked like giant blobs, so nothing replaces them. MODEL_LIST.md §8
records it and asks for a real far-range model. The battle rims' `_nrPeaks` / `_WD_RIM.peaks` are rocks since 2026-09-16 (untouched).

## GÖBEKLI TEPE ARENA REMADE (2026-11-03, mondo: "why are there t-pillars on top of these walls? get rid of the walls. Also there is a harsh boundary at the edge of the map ... the terrain texture that has the glyphs ... should only be for ancient structures, not for the ground")
- WHY THE PILLARS WERE ON THE WALLS: ENCLOSURE E (the arena's place in `site_prebuilt_gobekli_tell`) had ten lesser T-pillars "set
  in the ring wall" like the real dig's pillars, which are built into their enclosure walls. A prop stands on the ground under its
  foot (three-renderer.js `_hqCaveTop` → `hqTerrainFeet`), and a wall row IS that ground, so every one stood on the 1.8 m wall's top.
- The six ring-wall rows round E are gone; the ten pillars stand on the ledge round the pit. In enclosures A-D, six ring pillars
  whose foot was inside or touching a wall row moved clear (rim inside the wall, or the sunk floor 8.2 m out where the chord is tight).
- THE GLYPHS: the tell's `cliff` (the plan's mass + cut faces) was `rock_wall_1` (the glyph sheet), so the whole unexcavated mound
  wore it. Now `dirt_4`; the glyph stone stays on built pieces (wall rows, bastions, benches, built stairs keyed `rock_wall_1`).
- THE HARD EDGE: the room ends 28 m east of the board; the outer ground past it wears the floor sheet, the mound the cliff sheet —
  a straight line. New opt-in `terrain.outer: { sheet: 'solid' }` (three-renderer.js `_hqBuildOuterGround`, THE MASS RUNS ON):
  where the edge is the plan's mass in the cliff sheet, the outer ground carries that sheet on. Only the tell asks for it.
- THE GAPS: bake-holes had punched pits into the bastions' corners (squares under a block the walker cannot climb) and into the
  terrace nook inside each bastion's L — black squares and `cloud_gap` cells in the 12 × 12 and 11 × 11. `hqTerrainSealedSquares`:
  a wall row a whole square thick keeps its floor (A BLOCK IS GROUND), and an `HQ_ARENA_RULES.within` place keeps every square
  (THE ARENA'S PLACE IS GROUND). Only the tell's row was re-baked (now none); other rooms change only when re-baked.
- `within.prebuilt_gobekli.r` 6 → 2.5: with the wall gone the wider search shifted the 12 × 12 a square west onto the ledge (lost
  the half-turn symmetry); 2.5 keeps every size on its designed window. All four sizes re-baked: same windows, no gap cells.
## THE NEW HEAVEN + THE FLAT FILL (2026-11-03, mondo: "on the heave map, what is up with those platforms and how they have ugly cutouts underneath them? Use this concept art to make a new heaven map")

**The cutouts (cause).** A `float: true` plateau (a hanging cloud) cut a RING of whole 0.5 m ground quads out of the field round its
edge (three-renderer.js field build, `underFloat`): its flank, but also the flat ground round its foot and the flat rim of its top.
The round puff underside never covered the square-stepped hole, so the sky dome's lower half (the mood's fog colour, green on
"Haunted Green") showed straight through the world under every floating cloud.

**THE FLAT FILL** (three-renderer.js, after the tiles): `underFloat` now answers 0 drawn / 1 a float plateau's ring / 2 cut (the
void, a float flight's run). Each ring quad with no corner on a void room's open sky is drawn back FLAT at its lowest corner in
the field's own material (mesh `hq:field:flatfill`): the ground round the foot stays ground, the slope under the hanging cloud is
laid flat. Every float-plateau room gets it. Left as it was: the
void rooms' open sky. Shot: /mnt/project-files/heaven-map/cutouts_before_after.jpg (Heaven Stairway 9×9).

**THE GROUND UNDER** (2026-11-03, second pass; mondo pinned the first fill's shot: "what are these jagged edges", "wtf is this",
"what is this gap"). Three leftovers of the first fill: the whole run under a FLOAT STAIR was still a hole (the jagged edge), the
fill sat at each quad's lowest corner so it cracked against ground that had been raised after sampling (Heaven Stairway's
generated mass: H is moved by the plan pass after `hFinal`), and the ground nodes round a flank still read the flank's slope and
hollow (the cliff sheet + dark AO: a stepped dark band round every cloud). Now data.js compiles `info.GD`, the LIFT the floating
plateaus and floating flights add at each node (`hFinal` with vs without them, `skipFloats`; non-void rooms with floats only).
three-renderer.js takes the ground under = H − GD (`GHa`): a flat ring quad stays where it is, a quad across the flank and every
quad under a float flight's run (underFloat → 3) lie on that ground with the cliff blend and AO dropped, and a ground node next
to a float reads its slope + AO on the ground. Shots: /mnt/project-files/heaven-map/cutouts_fixed_v2.jpg.
Left as the room has it: Heaven Stairway's generated mass pokes through the round cloud at (17.5, 10.5) (its own nodes at 4.4 m).

**THE OPEN SKY** (three-renderer.js prop placement): in a void room a prop over open sky, or any prop authored at `y` ≤ −0.5,
hangs at its own `y` (height from the room floor). Before, it was lifted onto the cut ground's level (the base), so the heaven
cloud sea at y −4 stood ON the board and buried it. Only the heaven gate room has such props (checked with load-data.js).

**The room** `site_prebuilt_heaven_gate` (THE CLOUD FIELDS) is rebuilt from mondo's concept art (top-down 12×12): the gate
platform (pearly gate, two angel statues) north, the round SUN in the middle (lavender disc, gold rings + rays as terrain marks),
two side terraces (angel, column, harp; no potted plants, mondo 11-03: "potted plants in heaven?"), the big bottom platform with the grand stair, cloud paths between them, a castle on
each corner island, balustrades on every edge over the sky. New helper `hqSkyPlan(rows, o)` (data.js, after hqDeckPlan) turns a
character plan (one char per 3.5 m battle square, `.` = open sky) into float plateaus (proud 0.45 m past the square onto sky or
same-height floors), cloud-path polylines and balustrade rails (`HQ_STAIR_PACK.railings` balusters_d, `block: false`).
- Board rules unchanged: the void squares are the existing `cloud_gap` (Open Sky); floors are marble_light, paths cloud_2 (both
  plain passable cost 1). The gate + bottom platforms are 3.7 (0.5 m up, still battle level 0: spawn rows and the nexus must be
  one level, so the concept's raised end platforms are three broad marble steps, not a full tier).
- Exactly 48 open-sky squares = HQ_ARENA_RULES.wallMax (the walled cut's cap): the plan's side terraces are 3×4 and the gate /
  bottom rows 8 wide to get there. `HQ_ARENA_RULES.within.prebuilt_heaven` pins the cut to the sun; `node bake-arenas.js
  prebuilt_heaven` → @0,0 walled, solid 48. The 9/10/11 boards stay on the Heaven Stairway room (no 9/11 fits the new plan).
- Every platform has `under: 'cloud'` (a cloud body + puffs, `_hqBuildFloats`), not the void room's default stepped rock.
- Cloud sea: 40 white_cloud 8-11 m under the board + a bank of 12 round it (THE OPEN SKY hangs them).
- Castles: McSteeg's Castle and Fort Builder Pack (`Castles_and_Forts.glb` → R2 `Assets/misc/`, catalogue rows castle_tower /
  castle_tower_top / castle_cone / castle_gate / castle_wall via `#node`; `_hqModelUrl` now keeps a misc row's `node`). Credited
  in EW_CREDITS + list-models.js. No Meshy.
- Removed from the old room (the concept has none of them): the rift + plank, stepping clouds, pillar of light, lookout, the two
  healing pools, the fountain stand-in, park benches, the priest + angel NPCs. The seraphim stays (on the NW castle island, off
  the board: an NPC spot blocks its square). No banners (only a code stand-in exists).
- Shots: /mnt/project-files/heaven-map/.
- SAME DAY, second pass (mondo: "the t-pillars are still standing on top of the walls"): the four pit pillars (the two great ones, the
  two lesser) each had a DRAWN battle-stone wall row (5.45 m / 3.15 m glyph blocks) and stood on its top. Those rows are `ghost: true`
  now (never drawn; still the walker's and the fight's, so the boards are unchanged) and the props carry `floor: true` — new prop flag
  (three-renderer.js `_hqPlaceProps`, THE FLOOR UNDER IT): stand on the field's own ground (hqTerrainHeight), never a wall row's top.
- SAME DAY, third pass, THE SIZE (mondo: "the pillars look small, they are supposed to the space of one square and be like 2 or 3
  squares tall"): every pillar of enclosure E is one 3.5 m square wide and 6.6-8.4 m tall (the two great 8.4, the pit's lesser 7.0, the
  rim 6.6-7.4). The four pit pillars sit on square centres (3×5, 8×6, 2×8, 9×3, half-turn symmetric) and their ghost stones are one
  square each (h = the pillar's), so the boards bake those squares at level 3. The Meshy t_pillar.glb is 0.6 as wide as tall, so
  `fit: 'height'` made an 8.4 m pillar 5 m wide: a t_pillar placement's new `w` (metres, the head's width) stretches it in plan to `w`
  (its depth kept in the model's own proportion, 0.514·w) and keeps it `h` tall (three-renderer.js t_pillar proc, THE ONE SQUARE).
  Rows without `w` keep the plain height fit. Proof: a VS CPU battle on the arena, with the model queue drained.

## THE CODED SHAPES OUT (2026-11-03, mondo, answering the "Coded shapes worth replacing" proposal: "All of the ones i said to replace and already have replacements ready, i want you to completely delete from the game and the code")
Round 1 (three-renderer.js; the procedural builders deleted, the same names now place a model, so every map / roster / near setting / monument that named them gets the model):
- `_hzRover` = the Meshy mars_rover (`_hzDoorKitGLB`), the Mars + Moon settings and the `rover` monument. The Mars setting's `fallback: _hzRover` went (it would recurse).
- `_hzToadstool` = the Meshy fae cap (`mushroom`); `_hzFairyRing` = 8-10 small Meshy toadstools (`mushroom2`), each its own model, in a ring under the kept will-o-wisps.
- `_hzCenser` = the Meshy censer (R2 Assets/props/censer.glb) stood on the ground, ember glow inside (the smoke ball went).
- `_hzBrazier` = the Meshy standing torch (decor `cave_torch`) 2 tiles tall + a glow over the basket (mondo preferred it to the Meshy brazier).
- `_hzLighthouse` = the Meshy decor lighthouse + its lamp glow. `_hzSeaIsland` (the cone island) deleted: the sea roster's islands are the palm isle; `_hzPalmIsleFar` lost its fallback.
- the `whale` weenie = the ocean pack's Whale.fbx (turned 180°, like the catalogue's ocean_whale), not the humpback; the coded body deleted (pack off = no whale).
- the `bergs` rim = the ocean pack's rocks (Rock, Rock1-3, Rock6-7) tinted ice, widened at random (pack off = no bergs).
- `_hzFloatingIsland` deleted outright (rosters: the band goes to the next row, a last row's threshold moved to 1.00), the `island` monument + its 2 map placements + the editor entry gone.
- NO SWELLS: `_WD_RIM.hills` + `.dunes` deleted (10 data.js rim rows dropped, the craters rim no longer adds hills), and the 8 ground `_nrMounds` calls (stonehenge, giza, antarctica, skinwalker, gobekli ×2, northpole, downtown); the 3 cloud-bank calls (heaven, olympus, saturn) stay.
- `_hzMiscKit(key, { url })` places any model URL (decor, props, ocean pack) the misc way. list-models.js reads `_HQ_DECOR_GLB.x`, `_oceanUrl('X')` and url-placed props in §8b.
- Headless check recipe that works: scratch patched copy exporting the builders + `window.EW_NO_OPT_ASSETS = true` + a 30 s wait (decor/props are meshopt, FBX streams slowly).
Round 2 (the same day, the rest of his answers):
- THE CASTLE (`_hqLandmarkBuilders.castle`, the sky castle reuses it and keeps its cloud bank): built from the castle pack
  (`Castles_and_Forts.glb#<node>`), every piece placed on its own, height-fit at k = 6 × s: Wall_2x4 east/west/back curtain, Wall_2x2 +
  Gate_2x4 + Wall_2x2 front, four Tower_Mid corner towers, a Tower_Doorway + Tower_Mid keep, each tower capped with Tower_top_1 +
  Roof_Cone. The code walls / drums / cones are deleted.
- THE RUINS RIM (`_WD_RIM.ruins`): ONE castle pack ruined piece per stop (Wall_2x4_ruined, Wall_2x2_ruined, Tower_mid_hollow_ruined),
  facing the board ± a little, `low: 'skip'`. No clusters called one thing (mondo).
- `_hzGreekRuin`: the standing columns are the Meshy `greekcol` (height-fit to the code column), the base + the beam stay code (mondo
  likes the shape); the broken stubs are gone (an rng() call keeps the seed).
- `_hzZiggurat`: the shrine on top is a cube. `_hzStairway` + the sky `stairway` landmark: one-square treads.
- `_hzMonolith`: 1.8-2.9 tiles wide, half as deep (it was a thin slab), the purple rune deleted.
- `colossus` renamed `fallen_column` / `_hzFallenColumn` everywhere (data.js maps + MF_DELTA_SOLID_MONS, map.js _MON_COLLISION + the
  editor + the infernal theme label): it is a column lying on the floor, not a colossus. Same shape, same collision.
- `_hzFleshMound`: a heap of the Halloween pack body parts (`_hwUrl('Body_part_0N')`, the gore spells' pack), 60-76 parts, each placed
  on its own on a dome; every 8th is a limb laid flat. Pack off = nothing drawn. The code blobs, eyes and teeth are deleted.
- `_hzGreyTube` (the specimen tank monument) = the Molten Maps sci-fi pack Cryo_Tube_ON (CC0), R2 `Assets/misc/molten_cryo_tube.glb`
  (the monument fit stretches it toward its 3-square stamp as it did the code tank).
- Catalogue procs swapped to pack pieces and their code deleted (bake-pack-pieces.py jobs, R2 Assets/misc/, zipped by hand):
  `hand_dryer` / `range_hood` / `kitchen_range` / `sink_row` = DINER pack (Hand_dryer, cooker_hood, Stove griddle, Washbasin);
  `urinal` = BurgerPiz urinary; `toilet_stall` = Gas station stall (two partitions + door + toilet); `shower_stall` = House pack shower;
  `iso_tank` = Molten Maps sleeper casket (R2 `Assets/misc/molten_sleeper_casket.glb`, kept 1.3 m tall like the old pod: Antarctica stands it on 1.3 m ghost blocks; the catalogue `light` went with the proc: file
  rows draw no point light, only the glow). The kitchen range's burner glow went (it is a griddle).
- KEPT as code: the `castle_wall` spell monument (1 square wide, 2 high: the pack has no piece that shape).
Round 2b (the same day, the Meshy concepts mondo OK'd: concepts + models in project files meshy/coded-out/, R2 Assets/decor/, in
_HQ_DECOR_GLB so MODEL_LIST lists them; the GLBs go in the sync zip by hand):
- `_hzObelisk` = Meshy granite obelisk (ember glow kept on the point). `_hzGateway` (+ the `arch` / `gateway` monuments) = Meshy curved
  stone arch (the box piers, lintel and broken variant deleted). `_hzGreekRuin` columns = the new Meshy `greek_column` (not greekcol).
- `_hzEffigy` = Meshy bier + Meshy wrapped figure on it (two models). `_hzWindmill` = Meshy windpump tower + the wheel as its own
  model on a hub at 0.92 H, 0.13 H out on +x, turning: `_horizonFloaters` entries now take `spinX` (rotation.x per frame).
- procs: `grow_lamp` = Meshy LED panel (catalogue h 0.17, flush to the ceiling; glow + light kept), `submarine` = Meshy yellow sub
  (nose turned to +z, 7 m, the headlamp glows kept; the screw no longer turns), `_hqLavaLampBuild` = Meshy chrome base + cap (table
  and floor sets) with the glass + wax still drawn (the floor lamp's glass is a straight tube now, to match its base).
## THE OPEN SUMMIT + THE OPEN ICE (2026-11-03, mondo: "why are mount olympus and antartica built like dungeons with walls? That doesnt make any sense for those maps")
- Cause: LEVEL_DESIGN_PLAN L6 (2026-09-30) turned both site rooms into `gen: { kind: 'plan', look: 'walls' }` layouts (5.5 m marble /
  5 m ice walls round every court, yard and hall; the sealed mass between them baked to pits by bake-holes.js), and every arena size
  was cut from those walled courts.
- Fix (whole room, easier than carving a hole in the plan): HQ_AREA_SPECS.prebuilt_olympus / prebuilt_antarctica lost the walls
  plan and every `space` / `hall` row (a room with `space`/`hall` rows and no `gen` still gets a walls plan — data.js
  hqTerrainCompile's planGen fallback, so both had to go). Every plateau, stair, climb, pool, deck, rail, prop and NPC stayed.
  HQ_ROOM_HOLES rows re-baked (0 gaps now). Olympus keeps `outer.lift -26` (the summit is a marble crown with the mountain falling away).
- Olympus THE COURT OF THE TWELVE (the board, x -21..21, z -10.5..31.5, `HQ_ARENA_RULES.within` (0, 10.5) r 2.6 for every size):
  twelve greek_column props (h 5, `floor: true`) in two rows of six at x ±12.25 on square centres, each on a one-square ghost wall
  (h 5 → level 3, the Göbekli pillar rule), and two 1.2 m marble plinths at the far corners. The lower court's stair moved to its
  north lip (the west court), the first two stepping clouds moved west off the board, the fountain went to (0, 35) south of the
  board, the riser and a brazier moved off it, the scatter rows got their own areas (with the walls gone they landed on the board).
  Olympus now has an 11×11 cut too (none fitted the walled room).
- Antarctica THE STATION YARD (the board, x -21..21, z 10.5..52.5, `within` (0, 31.5) r 2.6): two 1.4 m ice pressure ridges
  (three squares each, level 1), two 3.0 m metal containers (two squares each, level 2), two iso_tank fuel tanks on one-square ghost
  blocks (1.3 m), two flood masts off the corners. THE CREVASSE stream now runs wall to wall (x -71..71) so the plank is still the
  only way north. The signpost, lesson sign, laundry cart, riser and the yeti NPC moved off the board; scatter rows got areas.
- Both boards are half-turn symmetric about their centre and keep the house lanes (spawn / egress / nexus) clear at 12, 11, 10, 9.
  Existing rules only: levels, ghost blocks, deep water. bake-arenas.js reports them as walled cuts (the level-3 / level-2 blocks).
- Audit of the other boards + the exploration rooms still built as walled plans: /mnt/project-files/battle-map-audit/.

Round 3 (the same day): the `tower` landmark (the downtown weenie) wears urban pack facade sheets (GlassWindowTall1a,
GlassWindowSquare1a, GlassWindowTall4a) sized by the landmark world UVs (6 m a sheet), the mast plain steel; no flat colours. The
city rim needed nothing: its map-builder buildings have had the prism bands since PR #843 (checked on screen 11-03).
Round 4, THE PACK BUILDINGS (the same day; mondo saw the city rim and kept it: "they look fine, but i also like the buildings you
showed me in building pack 1, so incorporate those into the game like in disaster city and the map editor"): the ten shop blocks of
Elbolilloduro's Buildings pack (CC0, 126-548 tris each, photo sheets) are cut one by one by bake-pack-pieces.py (`bld_00..09`,
R2 Assets/misc/ebd_buildings_bld_NN.glb + a front picture .png for the editor, added to the zip by hand; copies in project files
asset-packs/coded-out-round4/). data.js HQ_PACK_BUILDINGS = each one's metres (w along the shop front at +Z, d, h, roof = the slab
inside the parapet, measured in Blender). Where they go:
- THE CITY LOTS: a plan's or a district's `packP` = the share of the runs along a street face that try a pack building first (its own
  width, else 90 % / 80 %), as deep as the block lets it, never under 70 % of its own depth (three-renderer.js _hqPackBuildingModel
  fits the width, the height follows at one scale, the depth is fitted to the lot). Its own seeded draw (`prnd`), so plans without
  packP lay exactly what they laid. A pack lot carries `pack`, `packH` (the solid top + the walk's roof) and never grows or shrinks
  for an alley; its fronts are skipped (the model has its own shop fronts). Disaster City's OLD TOWN district has packP 0.6: 7 blocks
  (6 different) on its streets. The FINANCIAL blocks are too shallow (8-11 m deep) for any of them. The arena pick (19,15) and the 9 /
  10 / 11 cuts were rebaked and did not move.
- THE EDITOR: a BUILDING's Look list (`bldKey`) has a PACK BUILDINGS group at the top; a texbuilding row whose key is one of them is
  drawn as that model in its box (_hqBuildTexPacks), solid (no inside), its walls the parapet's height and its roof the model's own at
  the box's width (data.js hqTexBuildingRows). Storeys does nothing to it.
- Probe gotcha: in the headless city probe the model queue never started these files (the queue holds on some sheet in swiftshader);
  `--flags=EW_NO_MODEL_QUEUE` loads them. Shots: Old Town street fronts + two editor rows in Skinwalker fields, all upright, fronts
  to the street.

Round 5, THE TOWN RIM HOUSES (the same day; mondo OK'd the split: "yeah that sounds good"): Area 51 and Skinwalker's town rims stand
one whole Trailer Park trailer per stop, Haunted's one Abandoned House pack exterior per stop. Babel keeps the code mud-brick houses
until he OKs Meshy concepts for it.
- three-renderer.js `_HZ_TOWN_MODELS` { trailers: 6 files, 15.1 m long; abandoned: 1 file, 36.3 m wide, sunk 3.5 m (its stilts) }; a
  data.js town rim spec with `models: '<key>'` places one model per stop (fit 'span' at m x 0.96-1.04, front turned to the board +-0.25
  rad, low 'skip'); without `models` the old _nrHouse code draws (Babel only now). Delete that code branch once Babel has models.
- bake-pack-pieces.py: F 'trailerscene' (Trailer_Park.fbx) + 'abandonedhouse' (Abandoned_House.fbx). A node `{near, pad, keep}` cuts a
  REGION: every mesh whose centre lies in the named node's box (+pad m) and whose name matches keep (the trailers stand in one scene
  with no parent per trailer). A trailing `!` on a node name takes that node without its children. Files: R2 Assets/misc/
  ebd_trailerscene_trailer_0..5.glb, ebd_abandonedhouse_house.glb (zipped by hand).
- FOUND: a site battle draws NO world rim at all. Every rim site has an HQ_ARENA_RULES pick, the arena drops env.near, so
  `_nrLastKit` is null and `_worldBuild` returns early; the site's own room stands round the board instead. These rim swaps show only
  where a rim still builds. Asked mondo whether the pack houses should also stand in the site rooms.
- mondo 13:28: "none of those, i think the rims are just dead code from the voxel boards right? obviouslyy they need to go into the
  site rooms". True: a VS-CPU / online fight at a site is its arena cut with nothing round it, and no site keeps a Δ board, so the
  world rim never draws. THE TOWN HOUSES are ROOM PROPS now (data.js DOOR_HQ.catalogue trailer_home_1..6 + abandoned_house, real
  size, `rect` blockers): Area 51's flight line 4 trailers on the desert past its open edge (north, clear of the gate road; one west),
  the Skinwalker fields 3 trailers in the corn's clearings, the Haunted grounds 3 Abandoned Houses past the pines (west, east, south),
  side on. Every spot is clear of all four arena sizes (12/11/10/9), the tracks, the doors, the props and the natives (a scratch plan
  search over hqFieldLattice cells). three-renderer.js _hqCaveTop: a prop past an open field's edge stands on THE OUTER GROUND
  (`_hq.outer.yAt`), never the edge height carried out. The house GLB is re-cut (bake-pack-pieces.py job option `cut`: 2.5 m of its
  3.5 m basement dropped) and sinks its last metre (`hover: -1`), so no stilts show on the outer ground's slope.
- THE RIMS OUT (14:05, mondo: "Yes please delete the rim code since nothing is using it"): three-renderer.js _WD_RIM keeps only
  `peaks` + `spires` (the kept voxel boards draw them: Hell Δ · voxel spires+peaks, Göbekli Tepe Δ · voxel peaks; checked in a VS CPU
  match: Göbekli's world mats 10); trees / town / city / bergs / ruins / pyramids / craters builders, _HZ_TOWN_MODELS and
  _wdCraterLathe deleted, and every data.js EW_MAP_META `rim` entry of those kinds (25 entries; an emptied `rim` key goes). The planet
  world's carved craters (`world.craters`) are not the rim and stay. Asked him whether peaks + spires go too.
- 11-05, mondo: "delete the rims": peaks + spires gone too (Hell Δ · voxel and Göbekli Tepe Δ · voxel lose their rock rings; their
  ground, root, wall and haze stay). three-renderer.js has no _WD_RIM / _wdRing any more; data.js has no `rim` on any map row.
- 11-05, THE BABEL HOUSES (mondo OK'd the four Meshy mud-brick concepts B1-B4: "you have my okay"): Meshy image-to-3D (meshy-t2.5,
  ~12.9k tris, one 2k JPEG each) → R2 `Assets/world/props/meshy/meshy_babel_house_{small,stair,yard,row}.glb` (sha 16470172 /
  01292a1a / df1ecf89 / 6a6fad36). DOOR_HQ.catalogue `babel_house_small|stair|yard|row` (base 'misc' → the asset map sends it to
  world/props/meshy), spans 7 / 7 / 8.5 / 12.4 m, block. site_prebuilt_babel_tower props: eight houses, each placed one by one
  (south quarter: stair −16,−90 · small 24,−84 · row 14,−104 f180 · yard 78,−100 f270; north quarter: small −58,54 f270 · row −44,78
  f180 · yard −40,98 · stair −78,90 f90), clear of the arena windows, paths, doors and other props, fronts to the paths. Checked on
  screen (city probe). PROBE NOTE: the headless Chromium dies building the Babel room with every GLB on (with or without these
  houses); a 404 for every other .glb/.obj in the probe's route let it shoot the houses.

## THE CHESS POSITIONS (2026-11-03, the Looking-Glass)
mondo: "for the looking glass, the chess board needs to be an 8x8 (the game board stays 12x12) and i want the map to load one of these
3 actual chess positions at random. As you can see the chess pieces carve out the lanes of the map" (his picture: 01 Forward Cover,
02 Central Screen, 03 Open Junction; each team on four edge squares).
- data.js `HQ_LG_CHESS` (above HQ_AREA_SPECS): the three positions as FEN-style rows (north = black = P2), `cur` = the one standing.
  The garden's `board` feature is 8 × 8 (x −14..14, z 3.5..31.5) in the middle of the unchanged 12 × 12 window (ox 11, oz 14,
  3.5 m squares): the window's squares 2..9; the two lawn rings round it hold the spawns (rows 0 / 11, x 4..7) as before.
- The pieces are `...hqLgChessFeatures()` chess trees (existing rule: solid on their square). A piece not in every position has
  `chessPos`; only the current position's stand: hqFieldTerrainInfo (`trees` filtered, its cache keyed `chess`), _hqFieldTreeAt,
  and three-renderer.js treeOne (`_hqChessVar`, hidden + off the walker's blockers; `ThreeRenderer.chessPosSync`). The three differ
  only by one white bishop (c4 / d3 / e2).
- The roll: hqLgChessRoll(mapId) at the launch (map.js _msArenaGate once per confirm, the labs' launch). A new position calls
  hqArenaRoomChanged (the field is re-rastered, ~0.1 s, no survey). The field's `build` stamp keys the renderer's room read
  (_hqBattleRoom / _fieldGround) so a re-raster of the same window is read again.
- Online: the HOST rolls once per match in _onlineArenaGo (NET._chessRolledFor, cleared per match / rematch); `arena-check` carries
  `chess`, the room signature ends `|chess<k>`, so a guest on another position is asked again and stands the host's (hqLgChessSet).
- The garden around it is unchanged (a plateau + the board's `clear: 7` apron keep the plan's forced area and the scatter exactly
  as with the 12 × 12 board — checked: same scatter + trees). Picks: the 12 re-rastered by hand (all 117 open squares reach both
  spawn rows); the 9 / 10 / 11 re-baked (`bake-arenas.js --size N prebuilt_lookingglass`): no smaller window fits the house on the
  8 × 8 (the back ranks sit on the egress rows), so they are other lawn windows of the garden (the 11 takes the board's west files).

## THE OPEN VILLAGE (2026-11-03, North Pole, after THE OPEN SUMMIT + THE OPEN ICE)
mondo's audit ask (Olympus/Antarctica "built like dungeons with walls"): the audit found the North Pole village built the same way
(L6 `gen: {kind:'plan', look:'walls'}`, 4.5 m wood_planks walls, black pits). Fixed the whole room:
- the gen line and every `space` / `hall` row removed (the planGen fallback rebuilds the walls plan while any remain);
- the ramp to the walkway off the sledge yard keeps its own railings now (`rails: false` was for the hall's walls);
- THE BAY GATE: two 3 m wood_planks posts at x ±3.9, z 28..32 carry the hall's two wreaths;
- the hearth is the fireplace way's own chimney breast at the deck's west edge (a wall row past the room edge x −64 is clipped by
  the heightfield, so none was added);
- THE COTTAGES: the Christmas pack's `xmas_house` (was editor-palette only), h 6.0, `floor: true`, on 3 × 3 ghost blocks
  (`x0 = x1, z0 = z1, t 10.2` — a wall row's ends are round, t 9 gave a plus shape) at (−43.75, 15.75) and its 180° twin (−12.25, 12.25);
- two `sleigh`s and two snowmen on one-square ghost blocks (h 1.3, level 1), 180° twins round the board centre (−28, 14);
- HQ_ARENA_RULES.within.prebuilt_northpole (−28, 14, r 2.6) pins every size between the workshop deck and the plaza; all four re-baked.
The 2 × 2 gap on the walkway (HQ_ROOM_HOLES, i 15..16, j 1..2) was there before and stays.
Still walled (battle + exploration), not changed: Giza, Agartha, Technoticlan, Babel.

## THE OPEN PLATEAU / TOWN / TEMPLE CITY / CRYSTAL CITY (2026-11-03, after THE OPEN VILLAGE)
mondo: "go ahead and get rid of Giza, Agartha, Technoticlan, and Babel's walled courts". Same fix as Olympus / Antarctica / North
Pole, whole rooms (exploration + every board): the L6 `gen: {kind:'plan', look:'walls'}` line and every `space` / `hall` row gone
(the planGen fallback rebuilds the walls while any remain), their L6 layout comments dropped, HQ_ROOM_HOLES rows gone (bake-holes).
Each site is pinned with HQ_ARENA_RULES.within and all four sizes re-baked; the cover is existing rules only (levels, ghost blocks):
- GIZA (site_prebuilt_giza_plateau): the sand in front of the sphinx, the raised causeway down its west side, the sphinx's rump in
  a corner; within (17.5, 77, r 2.6). Four fallen casing blocks (bricks_1 wall rows, 1.4 m) and two obelisks on ghost blocks, 180°
  twins about (17.5, 77). The 2-row causeway crossing (14, 59.5) was tried first: a 9×9's house/nexus rows always land on it.
  Anubis moved (34, 60) → (37, 64) off an obelisk. A wall row's round end reaching the causeway lifts it a level: keep 1.4 m off.
- BABEL (site_prebuilt_babel_tower): the square between the tower's foot and the barn door; within (0, 70, r 2.6). Four brick
  houses (point wall rows `x0 = x1, z0 = z1, t 7`, 3 m: crisp brick boxes, level 2; plateaus drew as rounded loaves) and two brick stacks (1.4 m), 180° twins about (0, 70).
- TECHNOTICLAN (prebuilt_technoticlan): THE BALL COURT and the plaza east of it; within (−38.5, 38.5, r 10) — r 10 because the
  ball court's walls fill a 9×9's house rows, so the 9×9 sits east of the court. Two altar platforms (3.5 × 7, 1.4 m). The causeway
  stair keeps its own railings (`rails: false` was for the hall's walls). A `block: true` prop (a brazier) on a platform corner
  made four squares rock (`tree`): no props on the platforms.
- AGARTHA (prebuilt_agartha): THE PLAZA (the fountain, the two garden rings); within (0, 14, r 2.6). Two marble low walls
  (1.4 m), four crystal clusters and four greek columns on ghost blocks, 180° twins about (0, 14), placed for the 9×9 too.

## THE TWO SANDS (2026-11-03)
mondo asked for a new sand "the same way you found another gold texture", picked option A off
`/mnt/project-files/sand-texture/sand_texture_options.png` (ambientCG Ground097, CC0, dune ripples), then: "you need to
differentiate between beach sand and desert sand in the game through color/tint".
- `desert` stays ONE terrain key (every rule unchanged). sprites.js TERRAIN_SPRITES.desert = R2 `Assets/Sprites/terrain/sand.png`
  (Ground097 baked at 128 px in the desert's warm gold, mean ~0.57). The beach sheet `terrain/sand_beach.png` = the same ripples in
  pale cream (mean ~0.73, under the white-sheet line so daylight keeps the ripples). Both baked by
  `/mnt/project-files/sand-texture/grade.py` (contrast ×3-4 + normal-map relief + AO: raw ambientCG sand is flat at 128 px).
  Repo copies in `Assets/Sprites/terrain/` (zipped by hand). desert.png stays in the bucket, unreferenced.
- A BEACH (sprites.js SAND_BEACH): a battle board whose id starts with one of `SAND_BEACH.maps` (Bermuda family, Atlantis abyss,
  Downtown harbour), or a room on a sea shell (data.js hqSeaShell / hqAbyssShell carry `sand: 'beach'`; a room's
  `terrain.sand` / `shell.sand` works too). three-renderer.js `_ewSandBeach` / `_ewSandUrl` / `_ewSandPart` swap the sheet in
  getTerrainTexture, _hzTex, _hqTex and fold '@beach' into their cache keys + _tintKeyPart (board materials). Online: reads
  activeGameMode / the room, which host and guest share.
- The beach colours: Bermuda boards' tints.desert, the sea shell's floor/apron colour and the Bermuda horizon kit went
  #e8d8a8 → #f2ead6 (paler) so the beach reads cream, not yellow. Giza / Babel / the desert boards keep their tints.
- The sand spells' (`_sigTerrainTex`) and the deployable stone's 'desert.png' loads read sand.png.
- GIZA UNTINTED (2026-11-03, mondo: "hate the giza tint, just make it the default tint"): the Giza boards' tints.desert
  (#e8cf8f full board, #e6d4a0 the arenas) are gone and the Giza site room's floor/apron colour is white, so Giza's sand is
  the desert-gold sheet as drawn. The Giza horizon pyramids keep their own colour (0xd6c39a).

## THE OPEN SKY (2026-11-03, mondo: flyers fly over outdoor walls)
mondo: "a flyer should absolutely be able to fly over a rock or a street sign. That wall fix was probably intended for rooms
that have a ceiling ... i shouldnt be able to just fly over the wall of a hallway, because it is implied that the wall goes up
to the ceiling. Where as an outdoor map like cyberpunk does not need that, bc it is outside and there is no ceiling".
- data.js `hqFieldSkyApply(R)` (after `hqFieldRoofsApply`, in `hqFieldBuild` and the arena re-raster): on a TERRAIN field of a
  room with `shell.open`, every square that stays rock gets the drawn top `hqFieldSkyTopOf` (room metres): the ground's highest
  sample, a city lot's top under ANY share of the square (a building's edge), a solidMass wall's top, a custom map wall / tall
  piece's top (`hqFieldSolidCell` now returns `top` with `out`). Its column is that tall (`hqFieldRoofTier`, uncapped) and it is
  marked `c.sky`. Entry: `field.sky` ('1' rows) + `field.skyTops`.
- Stays the tall column: a tree anywhere in the square (no height known), a tree-bank mass, a gap (`hole`), a square past the
  room's edge (no src), every square of a room with a ceiling, every box / cave field. Kill-switch `window.EW_NO_OPEN_SKY`.
- battle.js `fieldCellSky(x, y)`; map.js `unitCanTraverse`: a rock cell passes only for a flyer at a z over the column (or,
  with no z, an airborne flyer). `fieldCellRock` is unchanged, so walking, climbing, jumping, teleport / escape landings and
  `canOccupy*` still refuse it; `canChangeAltitude('descend')` refuses a Land over it ("Nowhere to land here.").
- three-renderer.js `_fieldSurfaceY`: over a sky square the flyer hovers its clearance over `skyTops` (marks keep `rockTops`).
- Cyberpunk arena: all 5 rock squares are sky (3.7 m, 10.3 m x2, 6.9 m building edges; 2.7 m the slope crest at 9,5).
  Proof: videos/units/fixes/FLYER_OVER_BUILDING_EDGE_CYBERPUNK_1080p30.mp4.

## THE SOLID WALL HOLDS — no smashing through a field's rock (2026-11-07, forced movement log check)
Seen in a VS CPU match on Mount Shasta Arena: Grapple Arm pulled a Golem into a cliff and the log said "💥 Golem smashes a
hole clean through the stone wall — debris everywhere!", then "🎱 Golem slams into the cliff face and rebounds!".
- Cause: every cliff on that arena is a field rock cell (`fieldCellRock`, THE SOLID WALL above). A heavy/colossal body's
  crash-through (`_tryCrashThrough` → `_breachWindowCheck`) still removed the hidden column's voxels at body height, but the cell
  stays a rock nobody stands on (canOccupy refuses it), so resolveForcedSlide's re-check fell through to the slam. The drawn rock
  never changed either; only the invisible column got a hole.
- Fix (battle.js): `_breachWindowCheck` answers false on a field rock cell, so no crash, no charge breach and no beam bore there,
  and the forecast agrees (it showed the body stepping into the rock before). The body slams it.
- Same pass: the slam line only says "and rebounds" when the slide really bounces back. A pull into a point (Grapple Arm, Lure,
  Telekinetic Slam, Black Hole) is pinned, and the throw's last allowed bounce just stops, so those read "🎱 X slams into Y!".
- Proof (real menus, WebGL2, staged with `_ewShotRecApi.place` + a copied spell row):
  /mnt/project-files/playtest-mechanics-20261107/solid-wall-smash/ (before: Haymaker on a Yeti; after: Telekinetic Slam on a
  Juggernaut, column 0-8 intact, no crash line).

## THE FULL BLOCK — Build / dig step a whole square on big squares (2026-11-10, three-renderer.js)
mondo: "Build only builds half a tile up now, and there are some maps where it looks like there are raised tiles but they are only
half a tile up." Reproduced (Bohemian Grove Arena, WebGL2 headless): a Build block's top stood 0.496 square over its neighbour.
- Cause: not a regression of the drape (PR #1071). Since THE BIG SQUARES (10-28) `_fieldGround` halved the strata step on 3.5 m
  squares (`elev *= 1.75 / C`: "a level is still the room's 1.75 m"), so every dig / raise was half a cube.
- Fix: `G.elev` = one whole square on every board (raise +1.000, two blocks +2.000, dig −1.000 measured through tileTopY); the
  strata columns, the deform plan, mounds, skins and liquids all read `G.elev`, so they follow. `G.airElev` keeps the old 1.75 m
  step for a flyer's clearance only (`_fieldGroundTopAt`'s "in the air over the cell"): bodies did not grow with the squares.
  Renderer only, no rule changed, both online seats draw it the same. Kill-switch `window.EW_HALF_BLOCK = true` (before a battle).
- NOT fixed here, the maps' own ledges: a room's natural level is its real height (THE TIER RULE: level 1 from 1.2 m, +1 per 1.75 m),
  drawn at room scale. Survey of every 12×12 arena (scratch script: hqArenaUpgrade + field.tops vs levels): level 1 stands
  1.1-2.2 m = 0.32-0.63 of a 3.5 m square on ~30 maps (Giza 28 squares, Revenge 52, Gobekli 30, Technoticlan 28, Saturn 29,
  Bermuda 26, Moon 23 ...), level 2 ≈ 3 m = 0.86, level 3 ≈ 4-5 m. Making those full squares = doubling the terrain heights in each
  room (grow-room.js grew the plan only, "every height stayed") + THE TIER RULE at the square's scale so the levels stay the same.
  Asked mondo (thread "Fix Build raising tiles only half a step").

## THE FULL LEDGES — a room's own metres per level, ledges a whole square tall (2026-11-10, data.js)
mondo after the Giza pilot shot: "looks good, go ahead and fix all of the maps that need it".
- **The rule**: `terrain.levelM: 3.5` on a room → `hqFieldLevelRules(roomId)` gives THE TIER RULE a 3.5 m step for that room
  (hqFieldRasterTerrain's ground / deck / sheet tiers, hqFieldRoofTier for roofs and open-sky tops, hqFieldSolidEdges' wall heights).
  tierMin stays 1.2 m. Bands: level 1 = 1.2-4.7 m, level 2 = 4.7-8.2 m, level 3 = 8.2 m up. A room without `levelM` is untouched.
- **Switching a room** (hand work, per room): `levelM: 3.5`, then every visible ledge at 3.5 / 7 / 10.5 m for level 1 / 2 / 3
  (plateaus, cover-block walls, stair `h0`/`h1`, rail `y` / pts y, decks; ghost walls under props the same, they are invisible so
  only the level matters; a bridge over walked ground is forced to ground + 2, draw it 7 m up). A terrace edge must sit ON a square
  line: with a 3.5 m cliff a square holding a strip of the terrace turns unwalkable (Giza's 9 m causeways became 7 m). Stairs keep a
  run of one square or more (walker slope limit 1.0). Then compare the board (scratch `board.js <map>`: level:height per square) and
  the whole room lattice (`reach.js <room>`, DATA_FILE=<main copy> for the before) and re-cut the picks at 12 / 9 / 10 / 11.
- **Giza** (`site_prebuilt_giza_plateau`): causeway terraces + west arm + pier 1.8 → 3.5 m, their stairs, the handrails, the four
  cover blocks 1.4 → 3.5 m. Board: same squares and levels at all four sizes; the two obelisk tops read level 2 (were 3). Room-wide:
  the pyramids' 3.5 m steps read 1 / 2 / 3 (were 2 / 3 / 3), walkable squares unchanged, 0 traps. Not looked at in exploration on
  screen (stairs are twice as steep).
- **THE WALK RULES OF A FULL-LEDGE ROOM** (same day, second PR): `hqTerrainRulesFor(room)` scales HQ_TERRAIN_RULES `maxSlope`, `cliffFrom`
  and `cliffTo` by levelM / 1.75 for a `levelM` room (hqTerrainAdopt + hqTerrainCompile). So a twice-as-tall cliff or stair stands
  exactly where the old one did: a terrace edge NO LONGER has to sit on a square line and a stair keeps its authored run. Giza's
  causeways are back at their authored 9 m; its obelisk ghosts 5.0 → 8.4 m (level 3 again). Giza's 12 board gains one walkable corner
  square (11,0); every other size is the original board.
- **Gobekli** (`site_prebuilt_gobekli_tell`): the pit 1.75 → 3.5 m deep (plateaus, stair h0, pedestals −3.2), 12 corner blocks + 2
  benches 3.5 m, lesser pillar ghosts 8.4 m, braziers y 3.5. **Hell** (`site_prebuilt_hell_walkways`): the four daises 8.9 → 11 m
  (floor 7.5). Both: boards cell-for-cell the original at 12 / 9 / 10 / 11, so the picks were NOT re-cut.
- **Never re-cut the picks when the boards compare identical** (scratch `cmp.js <site…>` with DATA_BEFORE=<old data.js>): a re-bake can
  move the window (it moved Gobekli's 9×9). Re-cut only when cmp shows changed cells.
- **Holo Sim** (`facility_holosim`, third PR): every `holo` block a cube (risers 3.5 m, pylons 7 m, terraces 3.5 / 7 / 10.5 / 14 m), gallery
  + its racks and consoles 10.5 m, emitter orbs y 14, the hall 10.5 → 17.5 m. Board identical, own pick untouched.
- **Nothing to raise**: Hollow Earth (its level squares are a 0.3 m deck and the real-size `riser_1` prop), Heaven, Lookingglass.
- **Who switches what** (three map-polish threads were re-laying every board the same day): first third (agartha … downtown) does its
  own 12 in its re-lay; this thread takes the other 24 after each polish merge. Tools: /mnt/project-files/build-full-block/tools.


## THE BATTLE MAP POLISH, first third (2026-11-10, mondo: "make improvements to all of the battle maps (12x12) ... replacing a terrain texture, redesigning the layout, making the map look more realistic, replacing or adding better props, removing props ... AAA presentation and polish")
Three threads share the 35 site arenas by site id: this one has agartha, antarctica, area51, atlantis, babel, bermuda, bohemian_grove,
camelot, cern, cyberpunk, derelict, downtown. Before / after shots: /mnt/project-files/battle-map-polish/first-third/.
- **WHAT A BOARD'S MIDDLE CAN HOLD (read before laying any board out)**: all four sizes (12 / 11 / 10 / 9) are cut from the same
  squares, and each size's house (spawn rows, egress rows, the nexus, and the APRON one square round the spawn rows) must fit. On the 12's
  grid that leaves: columns 4..7 flat on rows 0..3 and 8..11 and on the nexus rows; columns 3 and 8 at most ONE level on rows 0..3 and
  7..11 (an apron takes one level); two levels or more only on columns 0..2 and 9..11, or columns 3 / 8 on rows 4..6. A bake that prints
  "KEEPS ITS OLD PICK" for a size means the layout broke that size's house: fix the layout, never ship the stale pick. Scratch tool
  that prints the house of every size on the 12 grid: battle-map-polish/first-third/tools/cons.js.
- **THE CLEAR BOARD**: a scatter row's `off: [x0, z0, x1, z1]` (data.js hqTerrainCompile) drops the pieces that would land in that
  rectangle; every other piece of the row stays where it stood (the piece is dropped, not re-rolled). Use it for the board's rectangle:
  a loose stone on a fight square reads as cover and blocks nothing.
- **THE GREAT CRYSTALS**: `crystal_cluster` reads its row's `h` (three-renderer.js proc; 1.4 m without one). The 1.4 m gem was a speck
  on a 3.5 m square.
- **garden_ring**: its stones sat 6 mm over the floor and the floor showed through in patches from a battle camera; 3 cm now.
- **HQ_AREA_SPECS rows take `levelM`** (hqAreaRoom passes it to the room's terrain).
- **Agartha** (THE PLAZA, same window x -21..21, z -7..35): the old board had its 12 cover squares on the two edges and nothing in the
  middle six columns; two 14 m garden rings (hedges units walked through), the fountain, two benches, a riser and two signs stood on
  fight squares. Now, alike from both spawn rows and both flanks: a gate of two 5.5 m columns before each spawn row, four 4.5 m crystals
  round the nexus, a 2 m crystal on each flank lane, a 2 x 2 marble dais on the west and east edges with a column at each end. The
  fountain (and its rail) stands north of the board, the garden rings, benches, riser and signs south of it; nothing was deleted except
  the four scattered pieces that had landed on the board. THE FULL LEDGES: levelM 3.5, every terrace of the room at 3.5 / 7 m (was 1.6 /
  2.4 / 3.0 / 3.6 / 6.2), the adit passage door y 2.4 -> 3.5; walkable squares of the room unchanged, 0 traps. Not walked in exploration
  on screen.
