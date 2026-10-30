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
  elev) is 1.75 m of the room on big squares (a dig / a raise / a flyer's clearance). A walk runs at the body's own pace (per-square
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
