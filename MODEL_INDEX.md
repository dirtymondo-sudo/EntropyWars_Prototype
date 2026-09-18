# MODEL INDEX — what 3D art stands where

The one register of every 3D model family in Entropy Wars: what it is
(a Meshy bake, a rigged library model, an OBJ, procedural three.js
geometry, a billboard), where it lives on R2, which loader owns it, and
every place it stands — a map's near SETTING, a far ROSTER, an on-board
MONUMENT, a SPELL, a HEADQUARTERS room. Keep it current: a model that
stands in a new place gets a new column tick here in the same delivery
(misc-models.test.js insists the moving-maps batch is named in full).

Started 2026-09-12 with the moving-maps batch (28 Meshy GLBs the user
uploaded to `Assets/misc/`). Everything older is catalogued from the code
as it stood that day.

## 1. Kinds (the legend)

| kind | what it is | where the material rule lives |
| --- | --- | --- |
| **Meshy GLB** | a Meshy `*_texture.glb`: one static mesh, baked texture, unit-normalised and centred | `_miscModelInstance` fits it (height or span), `_hzMiscUnlitPick` (horizon: unlit, fog off) / `_hzPropLitPick` (board: Lambert) / `_hzPropLitLiftPick` (Lambert + the bake as emissive) |
| **Rigged GLB** | a Meshy `..._Character_output.glb` (24-joint rig) — units, the cast, the HQ avatar | sprites.js `RACE_MODELS_3D` / `DOOR_CAST_MODELS`, animated from the shared UAL / MAL libraries (CLAUDE.md "Wiring up a 3D character") |
| **OBJ** | an authored OBJ + textures | `_loadMiscModel(url, false)` — the eyeball, the street lamp |
| **procedural** | three.js primitives / lathes / lofts wearing the terrain sprite sheets (`_hzGeoMat`, `K.mat`) | the `_hz*` builders, the `_nr*` kit, `_hzChessPiece`, `_nrLoft` |
| **billboard** | a sprite or a canvas texture on a plane (glow cores, text signs, playing cards) | `_hzGlowSprite`, `_hzTextTex`, `_nrSign` |
| **2D sheet** | the unit sprite sheets (the vessels without a rigged model) | sprites.js atlases |

## 2. Loaders and buckets (who owns which folder)

| loader | bucket | keyed by | used for |
| --- | --- | --- | --- |
| `_MISC_GLB` → `_hzMiscGLB` (unlit) / `_hzPropGLB` (lit) / **`_hzMiscKit`** (lit, fitted, turned, hung, footed — the 2026-09-12 helper) | `Assets/misc/` | short key → filename | scenery, settings, monuments |
| `_WPN_MODELS` → `_wpnInstance` (three-vfx-effects.js) | `Assets/weapons/` (+ absolute `url` for misc-bucket props) | key → file, `axis`, `tweak` | spell props (guns, blades, the UFO, **the cannon**) |
| `DOOR_HQ.catalogue` → `_hqModelUrl` | `Assets/door/models/` (+ **`base: 'misc'`** → `Assets/misc/`) | key → file, `h`/`span`, `foot`, `wall`, `leaf` | the building's props, leaves, held items |
| `_hzDoorKitGLB` | the catalogue above | catalogue key | a D.O.O.R.-kit prop on a battle board / in a site room (the rover, the lander, the palms) |
| `RACE_MODELS_3D` (`_mkUAL` / `_mk3d`) | `Assets/Sprites/Races/<race>/` | race → gendered rig | units on the board, the forge stage, the HQ avatar |
| `DOOR_CAST_MODELS` (`_mkCast`) | `Assets/Sprites/Races/maincharacters/` | cast id → rig | the story's characters in the building |
| `_loadMiscModel(..., false)` | `Assets/misc/<folder>/` | absolute path | the OBJ landmarks |

Rules: one filename lives in ONE table (a renamed upload is a one-line
fix). A model that also has a procedural stand-in is **GLB-first with the
procedural as `fallback`** (loader missing, or `low: 'skip'` under
`EW_PERF_LOW` for pure scenery — on-board cover never skips). Measure a
new GLB before wiring it (bbox + a contact sheet; the facing is noted in
the `_MISC_GLB` comment) and turn it with the kit's `yaw` so the caller's
own `rotation.y` keeps meaning "which way it faces".

## 3. THE MOVING-MAPS BATCH (Assets/misc/, 2026-09-12)

All 28 are unit-normalised single-mesh Meshy bakes (~4–10 MB each, three
embedded images). Columns: S = a map's near setting (`_NR_BUILDERS`), R =
a far roster (`_hzThemeRoster`), M = an on-board monument (`_monBuilders`),
V = a spell (`_WPN_MODELS`), H = the headquarters (`DOOR_HQ.catalogue`).

| key | file | facing | S | R | M | V | H | stands as |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cannon` | Meshy_AI_iron_canon_0912231022_texture.glb | muzzle −X | Dutchman ×8 (the rail guns, `yaw π/2` then turned outboard); THE GUN DECK ×4 (`DOOR_HQ.catalogue.ship_cannon`, rev 19) | | | **Cannonball** (`_sigCannonShot3D`, `tweak ry π`) | | the same gun on the deck and in the pirate's hand |
| `wheel` | Meshy_AI_a_ship_s_wheel_0912230950_texture.glb | face +Z | Dutchman (the helm on the quarterdeck, turned to +X) | | | | | |
| `anchor` | Meshy_AI_ship_anchor_0912231033_texture.glb | face +Z | Dutchman (catted on the starboard bow); THE HOLD (`ship_anchor`, rev 19) | | | | | |
| `lantern` | Meshy_AI_a_hanging_lantern_0912231043_texture.glb | hangs | Dutchman (a lantern at each end of every lower yard, `hang`, warm halo under it; in the site room too); below decks from the beams (`ship_lantern`, ceil + light, rev 19) | | | | | |
| `rowboat` | Meshy_AI_a_rowboat_0912231059_texture.glb | bow −X | Dutchman (the ship's boat towed astern on the sea, `yaw π`, bobs, a tow line) | | | | | |
| `chest` | Meshy_AI_pirate_treasure_chest_0912231220_texture.glb | lock +Z | Dutchman (open on the deck at the starboard-bow corner; room too); the gun deck, the cabin, the hold (`sea_chest`, rev 19) | | | | | |
| `tentacle` / `tentacle2` | Meshy_AI_a_kraken_tentacle_0912231121_texture.glb / Meshy_AI_a_kraken_tentacle_2_0912231110_texture.glb | rises | Dutchman (two arms out of the sea off the port quarter, `sink`, on the swell) | **sea** (`_hzKrakenFar`) | | | | |
| `wreck` | Meshy_AI_a_ghost_ship_wreck_0912231131_texture.glb | bow −X | | **sea** (`_hzGhostShip` is GLB-first; `_hzGhostShipProc` fallback) | | | | |
| `shark` | Meshy_AI_shark_0912231236_texture.glb | nose +Z | | **sea** (`_hzSharkFar`, half under) | | | | |
| `palmisle` | Meshy_AI_a_tiny_island_with_palm_tree_0912231720_texture.glb | — | | **sea** (`_hzPalmIsleFar`, sand at the waterline) | | | | |
| `nacelle` | Meshy_AI_an_engine_nacelle_0912231313_texture.glb | bell +X | Spaceship ×2 (the pylons astern, `yaw π` = bell aft; glow disc + plume kept) | | | | | |
| `dish` | Meshy_AI_a_satellite_dish_0912231301_texture.glb | face +Z | Spaceship (on the bridge mast, `yaw π/2`, `tilt −0.75`) | | | | | |
| `escapepod` | Meshy_AI_an_escape_pod_0912231249_texture.glb | window +Z | Spaceship (docked on the aft port strip; room too) | **wreckage** (`_hzEscapePodFar`) | | | | |
| `hullplate` | Meshy_AI_a_torn_hull_plate_with_wiring_0912231409_texture.glb | wires +Z | Spaceship (peeled off the breach, `tilt 0.55`) | **wreckage** (half of `_hzHullChunk`) | | | | |
| `astronaut` | Meshy_AI_dead_astronaut_0912231349_texture.glb | upright | Spaceship (adrift off the breach, laid over, slow tumble) | **wreckage** (`_hzAstronautFar`) | | | | |
| `dockring` | Meshy_AI_a_spaceship_docking_ring_0912231400_texture.glb | face +Z | Spaceship (the collar on the port flank amidships) | **wreckage** (`_hzDockRingFar`) | | | | |
| `teapot` | Meshy_AI_teapot_0912231417_texture.glb | spout +X | Looking-Glass (the tea party on the rim, `yaw −π/2`) | **wonder** (`_hzTeapotFar`) | | | | |
| `teacups` | Meshy_AI_stacked_teacups_0912231425_texture.glb | — | Looking-Glass | **wonder** (`_hzTeacupsFar`; the lathe cup is the fallback) | | | | |
| `caterpillar` | Meshy_AI_caterpillar_0912231445_texture.glb | — | Looking-Glass | **wonder** (`_hzCaterpillarFar` — on the mushroom GLB's cap) | | | | |
| `flamingo` | Meshy_AI_a_flamingo_0912231434_texture.glb | faces −Z | Looking-Glass (the croquet flamingo, `yaw π`) | **wonder** (`_hzFlamingoFar`) | | | | |
| `watch` | Meshy_AI_a_pocket_watch_0912231541_texture.glb | lies open, face up | Looking-Glass (open at the king's feet) | | | | **Room 247** clock room, on the tanker desk (`pocket_watch`) | |
| `watch_hang` | Meshy_AI_a_pocket_watch_hanging_0912231556_texture.glb | face +Z, hangs | | **wonder** (`_hzPocketWatchFar`, the White Rabbit's) | | | **Room 247** north wall (`pocket_watch_hung`) | |
| `trilithon` | Meshy_AI_trilithon_0912231457_texture.glb | opening ±Z | Stonehenge ×2 (`_hzTrilithon` is GLB-first) | | `trilithon` (`_hzTrilithon`) | | | `_hzTrilithonProc` fallback |
| `standingstone` | Meshy_AI_a_standing_stone_0912231506_texture.glb | — · **THE ROCKS** (2026-09-16): the tall one — `_hzRock({ kind: 'stone' })` stands it as a stalagmite / spire in the cavern's tint (`_nrSpires`, `_WD_RIM.spires`) | Stonehenge (the bluestones — a broken outer horseshoe, each its own height) | | | | | |
| `crane` | Meshy_AI_a_scaffold_crane_0912231516_texture.glb | jib −X | Babel ×2 (`_hzBabelCrane` is GLB-first, `yaw π/2` = jib over the board) | | `babelcrane` (`_hzBabelCrane`) | | | `_hzBabelCraneProc` fallback |
| `saucer_lg` | Meshy_AI_flying_saucer_with_landing_gear_0912231529_texture.glb | — | Area 51 (`_hzSaucerLanded` on the rig; under-glow + dome lamp kept) | | | | | the craft IN FLIGHT stays `_hzSaucer` (procedural) in the orbs / space rosters; the abducting craft is the Triangle UFO (§4) |
| `vault` | Meshy_AI_a_bank_vault_0912231605_texture.glb | door +Z | D.U.M.B. ×2 (`_hzBlastDoor` is GLB-first — the chokes at both ends) | | `blastdoor` (`_hzBlastDoor`: D.U.M.B. + CERN placements in data.js) | | | `_hzBlastDoorProc` fallback |

Still procedural on those maps (no upload yet — the wish-list): the
Dutchman's hull with a figurehead (`_nrLoft` off `_nrShipPlan`), the
Staunton chess set (`_hzChessPiece` lathes on the rim, `_hzChessMon`
monuments on the board, `_hzChessPieceFar`), the card soldiers
(`_hzTextTex` billboards), a cryo tube, a sea serpent.

## 3a. THE DOOR AGENT'S DOORS ON THE BOARD (2026-09-14 rev 2)

Every `leaf_*` in `DOOR_HQ.catalogue` (§6 and §3b) can now stand ON A
BATTLE TILE: the DOOR agent's persistent door (three-renderer.js
`_buildDoor3D` → `_doorLeafFor()` = the map's own threshold leaf, else
`leaf_hollow_core`, via `_miscModelInstance` + `_hqPropMatPick`) and the
race's seven spell recipes (three-vfx-effects.js "THE DOOR AGENT'S DOORS",
the same file loaded through `_wpnLoad` as `door:<leafKey>`, axis `y`,
the catalogue `yaw` baked as the tweak). No new file: the leaf a map's
threshold names in `DOOR_HQ.thresholds[mapId].leaf` is the leaf its
battles wear — change the threshold, the agent's doors follow.

## 3b. THE DOOR-KIT BATCH (Assets/door/models/, 2026-09-13)

Fifteen files the user uploaded to the D.O.O.R. kit folder: eight
AUTHORED doors (not Meshy — real scales, several meshes, big textures,
filenames with spaces; `_hqModelUrl` encodes them) and seven props. All
of them are `DOOR_HQ.catalogue` entries (data.js); the props reach the
boards through `_hzDoorKitGLB`, which since this batch takes `unlit` /
`lift` / `low: 'skip'` / `fit` like `_hzMiscKit`. Columns as in §3.

| key | file | facing / notes | S | R | H | stands as |
| --- | --- | --- | --- | --- | --- | --- |
| `leaf_beige_wood` | BEIGE WOODEN DOOR.glb | edge-on (`yaw` 90), hinge right | | | North Pole threshold (1225) | |
| `leaf_white_wood` | WHITE WOODEN DOOR.glb | same model, white | | | Vatican threshold (888 — "painted white by decree") | |
| `leaf_coffee` | Coffee door.glb | same model, coffee | | | Shasta threshold (14179, the cabin) | |
| `leaf_wooden` | Wooden Door.glb | 11 MB; its own frame; edge-on, hinge left | | | the Haunted House threshold (13) | |
| `leaf_birch_glass` | BIRCH DOOR WITH GLASS IN THE MIDDLE.glb | faces −Z (`yaw` 180), hinge left | | | Occam's Barbershop (105°) + its way out | |
| `leaf_orange_glass` | ORANGE DOOR WITH GLASS IN THE MIDDLE.glb | same model, orange | | | Bay 7 · URBAN (180°, mezzanine) + the ring's copies | |
| `leaf_window_large` | DOOR WITH LARGE WINDOW.glb | 2× life size (fitted), hinge left | | | Reception (120°) | |
| `leaf_window_medium` | DOOR WITH MEDIUM WINDOW.glb | same, medium light | | | Area 51 threshold (51, the hangar man-door) | |
| `leaf_entrance` | ENTRANCE DOOR.glb | hinge left | | | Downtown threshold (1954, the lobby) | |
| `computer_chair_blue` / `computer_chair_grey` | computer_chair_blue.glb / computer_chair_grey.glb | 16 MB each | | | the hall (the conference table ×4, the cubicles ×2), IT ×2, Records, the Clock Room, Medical | |
| `security_camera` | camera_01_cc0_clip_ready_v1.glb | wall prop, `mount` 2.55 | Downtown (`_hzSecurityCam`'s head, GLB-first over the box head; the `securitycam` monument too) | | the hall (over Reception, over the vault), IT, the Interrogation Room | |
| `utility_box` | utility_box_01_cc0_clip_ready_v1.glb | 1.35 m, foot 0.45 | Cyberpunk ×2 · the Strip ×2 · Downtown ×2 · Nuketown · the Stadium ×2 (`_nrProp` + `_hzDoorKitGLB`; the site rooms inherit them) | | | |
| `asteroid_a` / `asteroid_b` | asteroid_1.glb / asteroid_2.glb | unlit, tumbling in the sky; **THE ROCKS** (2026-09-16): lit + TINTED on the ground | **THE ROCKS** — every mountain / mesa / spire the settings and THE WORLD's rim used to raise as a cone (`_hzRock`: `_nrPeaks`, `_nrSpires`, `_WD_RIM.peaks` (a mesa = the boulder squashed flat), `_WD_RIM.spires`; a tinted Lambert in the map's colour + the standing stone for the spires; the jostled dodecahedron is the fallback) | **space** (Mars, the Moon, Saturn, the Singularity) + **wreckage** (the Spaceship) via `_hzAsteroidFar` — `_hzAsteroid` (the procedural rock) is the fallback | the celestial site rooms' skies (same roster); the planet rooms' rims (the same `_hzRock`) | |
| `door_gun` | **Meshy_AI__0916054803_texture.glb** (`base: 'misc'` — Assets/misc/, 2026-09-18 rev 5; repo root) | **THE DOOR GUN**: the user's SECOND model (rev 5, 2026-09-18) — MEASURED off the vertex profile along X: 1.0 long on X · 0.744 tall · 0.30 wide, 8.3k tris, the GRIP at +X (its bottom y −0.37 over x 0.2..0.4), the flared muzzle dish at −X — the OPPOSITE of the first gun (grip −X), so `HQ_PORTAL_RULES.gun.turn` 180 pre-turns the instance in every holder + the viewmodel (the ONE field if a future gun lands backward); `muzzle` [0.5, 0.11, 0]; `span` 0.62 m. The FIRST gun, Meshy_AI_a_retro_gun_that_shoo_0916054449_texture.glb (Assets/door/models/, repo `doors/`: 1.0 × 0.615 × 0.325, grip −X), stays in the bucket unreferenced | every **Door Agent**'s right hand, every battle (sprites.js `hold` → three-renderer.js `_unitAttachHeld`); the placements are SHOTS from it (`_sigDoorGunShot3D`, `raceDoorGun:shot`) | | the officer's right hand while the gun is DRAWN (`_hqGunAttach`; the laser sight, the shot, the recall leave its muzzle) | repo `doors/` |

The frame fits the leaf since this batch: a leaf may carry `shape:
'circle'` (+ `hole`, the disc's share of the opening — the vault 0.64,
the bulkhead 0.96) or `shape: 'arch'` (+ `arch`, the cap's share of the
height — the portcullis 0.42, the hell door 0.34); three-renderer.js
`_hqDoorSurround` cuts a wall-textured plate to it behind the leaf
(rect leaves get the opening inset 1.5 % — a stop, not a black gap).

## 3c. THE VEHICLE BATCH (Assets/misc/, 2026-09-15)

Nine Meshy vehicles the user uploaded to the shared misc bucket. Every
one reaches a board through ONE call, three-renderer.js `_hzVehicle(kind,
o)` — the kit table `_VEHICLE_KIT` holds each one's length in metres
(`m`, fitted along the model's longest axis), the pre-turn that puts its
NOSE at +Z (`yaw` — UNMEASURED: the CDN is unreachable from the sandbox;
a nose that lands backward is `yaw: Math.PI` there, sideways ±π/2 — one
field), the collision foot the walkable site room reads, and the
procedural stand-in's box (`_hzVehicleProc`, the EW_PERF_LOW / no-loader
fallback). The emergency vehicles wear a red-blue beacon pulse on the
board. The ones that fit under a 2.8 m ceiling are also `DOOR_HQ.catalogue`
rows (`base: 'misc'`, `vehicle: true` — the booth in Room P1 counts them).
Columns as in §3.

| key | file | facing | S | H | stands as |
| --- | --- | --- | --- | --- | --- |
| `suv` | Meshy_AI_a_black_SUV_0915195508_texture.glb | lies along X, nose −X (`yaw: π/2` → +Z since 2026-09-16; unmeasured — a nose that lands backward is `-π/2` on its kit row / `turn: -90` on its catalogue row) | Downtown (the east kerb) | P1 (`car_suv`, the agents') | the black SUV nobody claims |
| `cadillac` | Meshy_AI_a_black_cadillac_0915195323_texture.glb | lies along X, nose −X (`yaw: π/2` → +Z since 2026-09-16; unmeasured — a nose that lands backward is `-π/2` on its kit row / `turn: -90` on its catalogue row) | Nuketown (the east house's drive), the Strip (cruising the north road) | P1 (`car_cadillac`, the executive's) | |
| `copcar` | Meshy_AI_a_cop_car_0915195443_texture.glb | lies along X, nose −X (`yaw: π/2` → +Z since 2026-09-16; unmeasured — a nose that lands backward is `-π/2` on its kit row / `turn: -90` on its catalogue row) | Cyberpunk (across the north road), the Strip (the chapel's kerb), Downtown (the south barriers) | P1 (`car_cop`) | beacon |
| `cybercar` | Meshy_AI_a_cyberpunk_car_0915195427_texture.glb | lies along X, nose −X (`yaw: π/2` → +Z since 2026-09-16; unmeasured — a nose that lands backward is `-π/2` on its kit row / `turn: -90` on its catalogue row) | Cyberpunk ×2 (kerbside, west + east) | (`car_cyber`, catalogued — no room parks it yet) | |
| `firetruck` | Meshy_AI_a_fire_truck_0915195407_texture.glb | lies along X, nose −X (`yaw: π/2` → +Z since 2026-09-16; unmeasured — a nose that lands backward is `-π/2` on its kit row / `turn: -90` on its catalogue row) | Downtown (across the north road — THE EVACUATION) | (`fire_truck`, 3.4 m — waits on a room with the headroom) | beacon |
| `schoolbus` | Meshy_AI_a_school_bus_0915195620_texture.glb | lies along X, nose −X (`yaw: π/2` → +Z since 2026-09-16; unmeasured — a nose that lands backward is `-π/2` on its kit row / `turn: -90` on its catalogue row) | Nuketown (the south verge — the two yellow boxes are gone), the Stadium (the team bus, south wall) | (`school_bus`, catalogued) | |
| `ambulance` | Meshy_AI_an_ambulance_0915195334_texture.glb | lies along X, nose −X (`yaw: π/2` → +Z since 2026-09-16; unmeasured — a nose that lands backward is `-π/2` on its kit row / `turn: -90` on its catalogue row) | the Stadium (the south end zone), Downtown (the south barriers) | P1 (`car_ambulance`, Medical's) | beacon |
| `subway_front` | Meshy_AI_a_subway_train_front_0915195457_texture.glb | lies along X, nose −X (the batch's `yaw: π/2` turns it to +Z — 2026-09-16, unmeasured; a nose that lands backward is `-π/2`); the way rig turns it −X, the doorway at x 0 is the rear door) | — | THE TRAIN (`_hqWayBuilders.train`): the tunnel's track, Cyberpunk's north wall | the `train` way's lead car |
| `subway_cart` | Meshy_AI_a_subway_train_cart_0915195417_texture.glb | lies along X, nose −X (`yaw: π/2` → +Z since 2026-09-16; unmeasured — a nose that lands backward is `-π/2` on its kit row / `turn: -90` on its catalogue row) | — | THE TRAIN: the trailing cart (the tunnel's track only — a street platform stands the front car alone) | |

## 3d. THE SKATEBOARD (Assets/misc/, 2026-09-15 — SKATEBOARDING, HQ plan 9.8)

One Meshy GLB the user uploaded to the shared misc bucket and the repo root:
THE DECK under the rider. Measured off the JSON chunk: one mesh, no
skeleton, 1.0 long along X, 0.29 wide (Z), 0.17 tall (Y) with the wheels
down — a unit-length board. It is loaded ONCE per visit as a child of the
walker's own group (three-renderer.js `_hqRideDeckBuild`: `_miscModelInstance`
fitted by SPAN to 0.84 m, pre-turned π/2 so its length runs along the
rider's +Z, over a procedural stand-in that hides when the file lands),
rolled on a kickflip, spun with the body on a 180, flipped with it on a
front flip. It is never a room prop and never on a board; the deck FIND in
Room 26 (`find_deck`, shown only while `HQ_SKATE_RULES.free` is off) is the
stand-in leaning on its tail. Columns as in §3.

| key | file | facing | S | H | stands as |
| --- | --- | --- | --- | --- | --- |
| `skateboard` | Meshy_AI_a_skateboard_0915212313_texture.glb | length along X (measured); the rider's frame turns it to +Z | — | under the walker's feet while riding (B) | THE DECK |

## 3e. THE WOODS BATCH (Assets/misc/, 2026-09-17 — THE TERRAIN ROOMS)

Fourteen Meshy props the user uploaded for the woods, the cave and their
kin. Every one is in `_MISC_GLB` (three-renderer.js, the near settings
through `_hzMiscKit`) AND in `DOOR_HQ.catalogue` with `base: 'misc'`
(the building's props; the terrain rooms' `scatter` rows). The two trees
with holes in them are SEAMS: `DOOR_HQ.ways.hollowtree` / `.deadtree`
(three-renderer.js `_hqTreeWay`: the catalogue GLB with its hole to +Z,
a procedural trunk until it lands). Facings are UNMEASURED — a hole that
faces the wrong way is the catalogue row's `rot`; a wrong height is its
`h` / `span`. Columns as in §3.

| `_MISC_GLB` key | catalogue key | file | S | H | stands as |
| --- | --- | --- | --- | --- | --- |
| `hollow_tree` | `hollow_tree` | Meshy_AI_a_tree_with_a_hole_0916235727_texture.glb | Fairy Forest (north apron, the way in) | THE HOLLOW TREE way: the forest's back door ⇄ the clearing's south wall | the door to the woods |
| `dead_hollow` | `hollow_dead_tree` | Meshy_AI_a_dead_tree_with_a_dark_hole_0916235739_texture.glb | Haunted House (north apron) | THE DEAD TREE way: the pasture's garden gate ⇄ the house; the ritual ground ⇄ the Looking-Glass | the dead tree's dark hole |
| `fern` | `fern` | Meshy_AI_a_fern_0916235806_texture.glb | Fairy Forest ×10 | every woods room (scatter) | undergrowth |
| `stump` | `stump` | Meshy_AI_a_stump_0916235717_texture.glb | Fairy Forest, Haunted House | the clearing, the redwoods, the pasture (scatter) | a stump (a blocker) |
| `fallen_log` | `fallen_log` | Meshy_AI_a_fallen_log_0916235700_texture.glb | Fairy Forest, Skinwalker Ranch | the clearing, the redwoods (scatter) | a log across the floor |
| `dead_snag` | `dead_snag` | Meshy_AI_a_dead_snag_0916235650_texture.glb | Haunted House | the trail's top tier, the pasture | a dead trunk |
| `pine` | `pine` | Meshy_AI_a_pine_with_canopy_0916235640_texture.glb | | the mountain trail (scatter) | a pine |
| `campfire` | `campfire` | Meshy_AI_a_campfire_ring_0916235856_texture.glb | | the clearing (glow + light) | somebody's fire |
| `signpost` | `signpost` | Meshy_AI_a_blank_wooden_signpost_0916235832_texture.glb | Skinwalker Ranch | the clearing's crossroads | the signpost |
| `footbridge` | `footbridge` | Meshy_AI_a_plank_footbridge_0916235844_texture.glb | | (catalogued; the decks are drawn planks today — stand it on a `deck` with `y`) | a plank bridge |
| `menhir` | `menhir` / `cave_stone` (knee-high) | Meshy_AI_a_standing_stone_0916235906_texture.glb | | the ritual ground ×6, the cavern; the cave's rubble (scatter) | a standing stone |
| `brick_arch` | `brick_arch` | Meshy_AI_a_brick_arch_section_0916235939_texture.glb | | (catalogued, unplaced) | a brick arch |
| `culvert` | `culvert_mouth` | Meshy_AI_a_culvert_mouth_0916235929_texture.glb | | the clearing's crag (the storm drain's mouth) | a culvert |
| `drain_grate` | `drain_grate` | Meshy_AI_a_storm_drain_grate_0916235918_texture.glb | | Dead Man's Cave ×2 (wall, mount 0.4) | a grate |

## 3f. THE DIVINE STAIR (2026-09-17 — complex candidate #4) — what stands there, and the wishlist

No new file. The four parts (the Vatican's catacombs, Hell's pit, Heaven's
stairway and cloud fields — DOOR_HQ_BUILD_PLAN §9) are dressed from the
catalogue as it stands; ONE catalogue row was added on an EXISTING file:

| catalogue key | file (already in `_MISC_GLB`) | stands as |
| --- | --- | --- |
| `greek_column` | Meshy_AI_greek_column_0727195651_texture.glb (`greekcol`, the board monument) | the columns at the stairway's foot / landings / gate, the dais and the way in of the fields (h 3.6, block) — the same-thing rule (§9) |

Stand-ins in use (the aesthetic is the deliverable — these are the rows to
replace when the models exist): `cell_bars` for the loculi, low `marble`
walls for the sarcophagus rows, a brick pinnacle for THE SKULL STACK,
`ship_lantern` for the crypt's hanging lights, `candle_ring` / `wall_torch`
/ `cave_torch` for every flame, `menhir` for tombstones and basalt spikes,
`stone_altar` + `lectern` for the chapel and the book, `wall_chains` +
`stocks` for the colossus's chains, `leaf_hotel` on a marble wall for THE
GATE, `fountain` + `park_bench` + `potted_plant` in the clouds.

THE WISHLIST (Meshy, unit-normalised; a row = `base: 'misc'` + `h`/`span`
+ `foot`/`block`, then a prop line — nothing in the renderer):
1. **skull wall / ossuary panel** (wall prop, `mount` 0) — the loculi.
2. **skull pile** (floor, ~1.2 m) — THE SKULL STACK's crown; the tape sits on it.
3. **stone sarcophagus** (~2.2 × 0.9 m, block) — the tomb rows.
4. **candelabra** / **bone chandelier** (`ceil`, a `light`) — the crypt.
5. **confessional booth** (~2.4 m, block) — the catacombs' tape's home.
6. **angel statue** (~2.6 m) and **pearly gate** (a double gate, ~4 m) — the dais; the hotel door stays the LEAF.
7. **harp** and **cloud puff** (a soft prop, `foot` 0) — the fields.
8. **chained colossus / demon statue** (~3.5 m) — THE PLINTH.
9. **brazier** (a `light`) and a **broken column** — the pit and the fields.
10. **bone-and-obsidian stair segment** — if the flights are to be modelled rather than drawn treads.

## 3g. THE VATICAN BATCH (Assets/misc/, 2026-09-17 — THE DIVINE STAIR expanded)

Twenty-four Meshy props the user uploaded for the Vatican, the catacombs, the
pit and the clouds. Every one is in `_MISC_GLB` (three-renderer.js) AND in
`DOOR_HQ.catalogue` with `base: 'misc'` (the building's props; the terrain
rooms' `scatter` rows). THE TELESCOPE is a SEAM: `DOOR_HQ.ways.telescope`
(three-renderer.js `_hqWayBuilders.telescope`: the catalogue GLB
`brass_telescope` over a procedural tube on a tripod; the Observatorium's
`telescope` PROC keeps its key). Facings are UNMEASURED — a backward front
is the catalogue row's `rot` / `front`; a wrong height is its `h` / `span`.
A `rect` row (the pews, the church building) is placed at face 0 / 180 only.
Columns as in §3.

| `_MISC_GLB` key | catalogue key | file | S | H | stands as |
| --- | --- | --- | --- | --- | --- |
| `church_pew` | `church_pew` | Meshy_AI_church_pew_0917035915_texture.glb | | the basilica ×8 (the back rows) | a pew |
| `catholic_pew` | `catholic_pew` | Meshy_AI_catholic_church_pew_0917035928_texture.glb | | the basilica ×6 (the front rows) | a pew |
| `church_podium` | `church_podium` | Meshy_AI_church_podium_0917035658_texture.glb | | the chancel | the pulpit |
| `royal_throne` | `royal_throne` | Meshy_AI_royal_throne_0917035803_texture.glb | | the chancel (`front: 'back'` — measured on landing) | the cathedra |
| `wooden_cross` | `wooden_cross` | Meshy_AI_wooden_cross_0917035711_texture.glb | | the basilica's north wall (mount 2.6), the catacombs' chapel (mount 1.0) | the cross |
| `stained_glass` | `stained_glass` | Meshy_AI_stained_glass_window_0917035453_texture.glb | | the basilica ×6 (wall, mount 5.5, a glow) | a window |
| `holy_carpet` / `holy_tapestry` | `holy_carpet` | Meshy_AI_ornate_holy_carpet_0917035624_texture.glb | | THE BASILICA: four TAPESTRIES on the walls (`holy_tapestry`, the same file as a wall row — the GLB stands upright, h 5, mount 3.2; 2026-09-18); the floor row `holy_carpet` is catalogued and unused | the carpet, hung |
| `confessional` | `confessional_booth` | Meshy_AI_confessional_booth_0917035307_texture.glb | | the basilica's side aisles ×2, the catacombs (THE CONFESSIONAL) | a booth |
| `church_wall` | `church_wall` | Meshy_AI_catholic_church_wall_0917035726_texture.glb | | the chancel screens ×2 (wall, mount 0) | a screen |
| `church_building` | `church_building` | Meshy_AI_catholic_church_building_0917035753_texture.glb | | the cortile's terrace (the façade, rect 20 × 6) | the basilica's front |
| `italian_building` | `italian_building` | Meshy_AI_Italian_building_0917035900_texture.glb | | the cortile's east wing | the palace |
| `italian_building_2` | `italian_building_2` | Meshy_AI_Italian_building_2_0917035828_texture.glb | | the cortile's west wing | the palace |
| `ancient_walkway` | `ancient_walkway` | Meshy_AI_ancient_walkway_0917035609_texture.glb | | the cortile ×3 (foot 0) | the cloister's arcade |
| `library_shelf` | `library_shelf` | Meshy_AI_a_library_shelf_0917035552_texture.glb | | the archive ×5 (wall) + scatter ×5 | a case |
| `library_shelf_full` | `library_shelf_full` | Meshy_AI_library_shelf_full_of_books_0917035645_texture.glb | | the archive's gallery ×2 + scatter ×7 | a full case |
| `catacomb_wall` | `catacomb_wall` | Meshy_AI_catacomb_wall_0917035320_texture.glb | | the catacombs ×3 (wall, mount 0) | the bone walls |
| `sarcophagus` | `sarcophagus` | Meshy_AI_stone_sarcophagus_0917035255_texture.glb | | the catacombs ×4 (on the two low tomb rows) | a tomb |
| `skull_pile` | `skull_pile` | Meshy_AI_skull_pile_0917035243_texture.glb | | the catacombs ×3 (round THE SKULL STACK), the pit ×2 | the bones |
| `demon_statue` | `demon_statue` | Meshy_AI_demon_statue_0917040101_texture.glb | | the pit (chained beside THE PLINTH) | the colossus |
| `brazier` | `brazier` | Meshy_AI_brazier_0917035429_texture.glb | | every part of the complex (a `light` + a glow) | the flame |
| `angel_statue` | `angel_statue` | Meshy_AI_angel_statue_0917035332_texture.glb | | the basilica, the cortile, the stairway ×3, the fields ×2, the dome | an angel |
| `pearly_gate` | `pearly_gate` | Meshy_AI_pearly_gate_0917035350_texture.glb | | the cloud fields' dais, standing open in the gap of the pearly walls (foot 0; `leaf_hotel` stays the door) | THE GATE |
| `white_cloud` | `white_cloud` | Meshy_AI_white_cloud_0917035538_texture.glb | | the stairway ×6 + the fields ×4 hung in the air (`y`, foot 0), scatter on the cloud floors | a cloud |
| `telescope` | `brass_telescope` | Meshy_AI_telescope_0917035520_texture.glb | | THE TELESCOPE way in the observatory (`_hqWayBuilders.telescope`) | the seam to the stair |

## 3h. DISASTER CITY (2026-09-17 — complex candidate #1) — what stands there, and the wishlist for the second pass

No new file. THE STREETS and THE MALL (DOOR_HQ_BUILD_PLAN §9, 2026-09-17) are
dressed from the buckets as they stand:

| family | file(s) | stands as |
| --- | --- | --- |
| the map-builder buildings | `building_1..8` sprites (OBJECT_SPRITES) | every LOT of the streets' `city` plan wears one as a prism (`_nrSpriteBuilding` on the podium, 1–4 storeys; a `low` lot is a flat roof with its AC unit and tank) — `_hqBuildCityLots` |
| THE VEHICLE BATCH (§3c) | suv · cadillac · copcar · ambulance · firetruck · schoolbus | NPC TRAFFIC on the ring road (both ways) and the avenues (`_hqBuildTraffic` / `_hqTickTraffic`); the parked cars are the catalogue rows `car_cop` / `car_suv` / `car_cadillac` / `car_ambulance` on the parking lanes |
| the street lamp OBJ (§4) | streetlamp/Street Lamp.obj | every street of the plan, alternating kerbs every 14 m (`_hqBuildStreetLamps`) |
| the kit (§6 / §6b) | `slot_machine` (the arcade's cabinets), `concrete_pillar` + `cave_stone` + `brazier` (THE COLLAPSE), `trash_bin` / `park_bench` / `signpost` / `potted_plant` / `coffee_table` / `office_chair` / `notice_board` / `quarter_pipe` / `railing_1m` / `riser_*` | the streets and the mall |

Procedural, in three-renderer.js: the FRONTS (`'window'` = the ground floor's
windows, door, awning, a shop sign on some; `'store'` = the mall's storefront:
a lit sign band with a name from `_HQ_STORE_NAMES`, the glass, the mullion, the
door, a shutter half down on every third), THE CIRCUIT's START / FINISH banner
and its checkpoint posts, THE TIME MACHINE (`_hqWayBuilders.timemachine`: the
brass cage on its dais, the console with the dial and lever, THE DISC behind it),
THE GUTTER (`_hqWayBuilders.gutter`: the kerb inlet with its slot, the grate in
the road). Stand-ins in use: the prisms are FLAT sprites on a concrete podium
(the podium is the plan's rise in the cliff sheet; the façade planes cover it),
`slot_machine` for arcade cabinets, `coffee_table` + `office_chair` for the food
court, `notice_board` for the mall directory, `potted_plant` for the atrium's
palms.

THE WISHLIST (Meshy, unit-normalised; a row = `base: 'misc'` + `h`/`span` +
`foot`/`block`, then a prop line or a `scatter` row — nothing in the renderer;
the first four would replace procedural pieces and need one hook each):
1. **a low-poly city block** — a 2–4-storey brick building with a storefront, an office tower, a parking garage (3 files): the lots would stand REAL buildings instead of sprite prisms (`_hqBuildCityLots`: a `kit` per lot key).
2. **a storefront unit** (glass front, sign band, ~7 × 4 m) and **a rolling shutter** — the mall's fronts (`'store'`) as a model.
3. **a time machine** (the user's own — a Wells cage, a phone box, a DeLorean; the cage is the stand-in) — `_hqWayBuilders.timemachine` swaps the stand-in like the telescope did.
4. **a storm inlet / manhole cover** — the gutter's kerb box.
5. **an escalator** (~7 m run, static is fine) — THE MEZZANINE's; the stairs stay the walker's treads.
6. **a mall fountain**, **a food-court table set** (a round table + four chairs), **a directory kiosk** (YOU ARE HERE), **a planter with a palm**, **an arcade cabinet** (a real one; two or three finishes), **a mall bench**.
7. **traffic lights**, **a fire hydrant**, **a bus shelter**, **a newspaper box**, **a mailbox**, **a hot-dog cart**, **police barricades** and **a road cone** — the kerbs.
8. **a crashed car** and **a fallen street lamp** — THE COLLAPSE; **scaffolding** and **a water tower + rooftop AC units** — the roofs.
9. **a subway entrance canopy** (the stair head with the sign) — the metro stair on the streets; **a stadium gate / turnstile bank** — Gate C.
10. **a delivery truck** and **a taxi** — two more kinds for the traffic (`_VEHICLE_KIT` rows).

## 3i. THE CITY BATCH (Assets/misc/, 2026-09-17 — DISASTER CITY's second pass + CYBERPUNK CITY)

Nineteen Meshy GLBs the user uploaded to R2 `Assets/misc/` (`_MISC_GLB` keys;
the catalogue rows read the same files, `base: 'misc'` — the same-thing rule).
Four are in the repo and were MEASURED (`node` bounds + a three r128 render
with an AxesHelper); the rest are TARGETS (unseen — RULE #1c). The bin is the
OUTDOOR one (the kerbs), the trash bin the INDOOR one (the mall, the casino);
the Vatican dome is for OUTSIDE the Vatican (the setting, the cortile's sky).

| key | file | measured / target | stands as |
| --- | --- | --- | --- |
| `city_bin` | Meshy_AI_a_city_bin_0917065144_texture.glb | target h 1.05 | catalogue `city_bin` — the streets' and the grid's kerb scatter, THE ROOFTOP / THE BILLBOARD ROOF |
| `city_trash_bin` | Meshy_AI_a_city_trash_bin_0917065157_texture.glb | target h 0.9 | catalogue `mall_bin` — the mall's scatter + the food court |
| `taxi` | Meshy_AI_a_city_taxi_0917065634_texture.glb | target m 4.8 | `_VEHICLE_KIT.taxi` (the traffic on both cities' loops and boulevards); catalogue `car_taxi` parked on the grid |
| `truck` | Meshy_AI_a_truck_0917065131_texture.glb | target m 8.0 | `_VEHICLE_KIT.truck` (the traffic); catalogue `car_truck` |
| `crashed_car` / `crashed_car_2` | Meshy_AI_a_crashed_car_0917065033_texture.glb / Meshy_AI_a_crashed_car_2_0917065052_texture.glb | MEASURED 1.0 × 0.36 × 0.45, nose −X → `turn: 90` | catalogue rows — THE COLLAPSE (two), the chicane, the grid's boulevard |
| `time_machine` | Meshy_AI_a_retro_time_machine_0917064610_texture.glb | target h 2.4, `rot: 90` (the opening at −X assumed) | catalogue `time_machine` — the `timemachine` way's model over the brass cage (the supply closet ⇄ the noodle bar) |
| `road_straight` | Meshy_AI_a_straight_city_road_0917064651_texture.glb | MEASURED 1 × 1 square, the dashes along Z, kerbs on the X sides | `_hqBuildRoadTiles`: a tile every street width along every segment of a sidewalked `city` plan, fitted by span to the street's width, squashed to a kerb (scale.y 0.3) |
| `road_turn` | Meshy_AI_a_road_turn_quarter_0917065230_texture.glb | MEASURED 1 × 1, a quarter circle joining two adjacent edges | `_hqBuildRoadTiles`: on every right-angle vertex |
| `street_drain` | Meshy_AI_a_round_street_drain__0917064638_texture.glb | target span 1.3 | catalogue `street_drain` — the `gutter` way's grate (GLB over the bars), manholes scattered on both cities' roads |
| `escalator` | Meshy_AI_an_escalator_0917064623_texture.glb | MEASURED 0.53 × 0.72 × 1.0, rising toward −Z; fitted h 4.6 → a 6.4 m run | catalogue `escalator` — the mall's mezzanine (`face: 270`, top at +x; `foot` 0: the terrain ramp under it is the walker's treads) |
| `bus_shelter` | Meshy_AI_bus_shelter_0917064913_texture.glb | target span 3.8, `turn: 90` (the opening −X assumed) | catalogue `bus_shelter` — two per city on the avenue's / boulevard's sidewalks, the opening to the road |
| `cinder_block` | Meshy_AI_cinder_block_0917064959_texture.glb | target span 0.4 | catalogue — THE COLLAPSE's scatter |
| `fire_hydrant` | Meshy_AI_fire_hydrant_0917064858_texture.glb | target h 0.8 | catalogue — the kerb scatter, both cities |
| `storefront` | Meshy_AI_storefront_0917064551_texture.glb | target span = the front's length (≤ 8), `yaw π/2` (front −X assumed) | `_hqBuildCityLots`: a LOW street lot's ground floor (over the procedural windows once it lands) |
| `storefront_unit` | Meshy_AI_storefront_unit_0917064533_texture.glb | target span = the unit's length, `yaw π/2` | `_hqBuildCityLots`: the mall's store units (over the procedural glass / mullion / door / shutter once it lands; the sign band stays) |
| `vatican_dome` | Meshy_AI_the_Vatican_dome_0917061915_texture.glb | target 3.6 tiles tall × the setting's `s` 1.6 | `_hzBasilicaDome` GLB-first (the Vatican setting behind the board, the `basilicadome` monument; `_hzBasilicaDomeProc` the stand-in) + `_hqLandmarkBuilders.dome` |
| `traffic_barrel` / `traffic_cone` | Meshy_AI_traffic_barrel_0917064936_texture.glb / Meshy_AI_traffic_cone_0917064925_texture.glb | targets h 1.0 / 0.7 | catalogue — THE COLLAPSE, the chicane, the grid's boulevard wreck |

Facings to eyeball first: the time machine's opening, the bus shelter's open
side, the storefronts' fronts (all three assumed −X → the `rot` / `turn` /
`yaw` on their rows are the one-field edits), the escalator's direction, the
quarter tile's curve at each corner of the ring road (`_hqBuildRoadTiles`'s
corner rule assumes the road joins the tile's +X and +Z edges).

## 3j. THE URBAN PACK (Assets/Sprites/terrain/urban/, 2026-09-17) — sheets, not models
320 tileables at 128 px = one battle tile (1.75 m): concrete / plaster / stucco / corrugated walls, curtain glass
(square · tall · factory · residential, Broken + -Glow sets), window decals, half doors, floor tiles (generic ·
marble · subway), ceiling tiles, subway grills, trusses, non-slip rubber, the manhole, the signs. sprites.js
`URBAN_TEXTURES` / `URBAN_TEX_FAMILIES`; the key `urban:<Name>` anywhere a sheet is named. Worn by: Disaster
City's streets (asphalt / pavement / yards, the hoardings, the road plates, the manholes), THE TEXTURED BUILDINGS
(`_hqTexBuilding`), the grid at night (the -Glow twins), the platform, the lobby, the casino, the chapel, the mall,
the closet, the noodle bar. Not yet: D.U.M.B. (ConcreteStriped / MetalTruss / the DANGER plates), CERN (the
subway grills, the caution plates), Area 51 (the corrugated hangars, the PROHIBITED plates), the Δ boards' own
urban terrain sheets — the key is the edit, the family list above is the menu.

## 3k. D.U.M.B. (2026-09-17 — complex candidate #5) — what stands there, and the wishlist

No new file. The seven parts (DOOR_HQ_BUILD_PLAN §9, 2026-09-17) are dressed from the kit as it stands:

| family | file(s) | stands as |
| --- | --- | --- |
| the kit (§6 / §6b) | `track_bed` ×4 + `train_car` (the tram, lit), `car_suv` / `car_cop`, `quarter_pipe`, `railing_1m`, `traffic_barrel` / `traffic_cone`, `cardboard_boxes`, `paper_sheet` | THE MOTOR POOL |
| the kit | `monitor_stack` ×2, `steel_table` + `crt_terminal`, `computer_chair_grey`, `observation_window` ×2 (free-standing on the deck's face), `warning_tape`, `radiation_sign`, `security_camera`, `bare_bulb` | SUB-LEVEL 7 |
| the kit | `cot` ×4, `eeg_rack` ×4, `iso_tank` ×2, `dream_screen` ×2, `floating_orb` (THE OBJECT), `chalkboard`, `wall_clock`, `coffee_mug` / `stapler` (the spoons) | DREAM RESEARCH |
| the kit | `iso_tank` ×6 (the vats), `door_furnace` (free-standing), `garbage_chute`, `door_xray`, `evac_button`, `manila_folders` | CLONE RESEARCH |
| the kit | `conference_table` ×2, `computer_chair_grey` ×7, `rotary_phone` ×2, `dream_screen` ×3 + `monitor_stack` ×2 (THE BIG BOARD), `world_clocks`, `nameplate`, `water_cooler` | THE WAR ROOM |
| the kit + §3g | `false_window` ×3, `curved_couch`, `rug_round`, `coffee_table` + `tube_tv`, `royal_throne`, `retro_speakers` / `retro_radio`, `mini_fridge` / `round_fridge`, `pool_lounger` ×2 + `pool_umbrella`, `library_shelf_full` ×3 (the racks), `keypad`, `potted_plant` | THE BUNKER |
| the kit | `floating_orb` (THE BEAM), `server_rack` ×6, `monitor_stack`, `steel_table` ×3 + `crt_terminal` ×3, `radiation_sign` ×2, `evac_button`, `traffic_barrel` ×2, `fire_extinguisher` | CERN · THE RING |
| THE URBAN PACK (§3j) | `ConcreteStriped` 1b/1c/1d/1e/2a..2e (walls, the plan's traced walls, floors), `MetalCorrugatedPainted` 1a/2a/3a/4a (dados, the vats' walls), `RubberNonSlip` 1a/2a/3a/4a/5a (floors, lanes), `TileSubway` 1a/1d (the ward), `TileGeneric` 1a/2a/2b/4a/4c, `TileMarble` 1a/1b/1d + `PlasterWallPainted1c` + `PlasterWallStucco1a` (the bunker), `FibreCeilingTile` 1b/2a + `MetalSubwayGrill` 1a/2a (ceilings) | every shell and every field (`hqBunkerShell`) |

Procedural, in three-renderer.js: THE PLAN WALLS (`info.planWalls` through `drawWall` — the mask's boundary as
wall boxes in the plan's sheet), THE STRIP LIGHTS (`_hqBuildHallsLights`: an emissive tube + a glow every 6.5 m
down every corridor and hall). Stand-ins in use: `iso_tank` for the clone vats (a pod, lid ajar), `train_car` for
the tram, `floating_orb` for THE OBJECT and THE BEAM, `library_shelf_full` for wine racks, `dream_screen` /
`monitor_stack` for THE BIG BOARD, `false_window` for the bunker's screens, `observation_window` for the
chambers' glass.

THE WISHLIST (Meshy, unit-normalised; a row = `base: 'misc'` + `h`/`span` + `foot`/`block`, then a prop line —
nothing in the renderer unless noted):
1. **a clone vat** (a glass cylinder on a base with a figure in it, lit; two states: full / drained) — the six `iso_tank`s.
2. **a tram car** (a monorail / people-mover car with open doors, ~9 m) and **a tram rail section** — the motor pool's `train_car` + `track_bed`.
3. **a Portal test-chamber kit**: a heavy panel wall tile (1.75 m), a round chamber door, a catwalk section with rails, a floor button — the chambers' walls are the pack's concrete today; a catwalk GLB would replace the `deck` planks (`_hqBuildTerrain` decks: a `kit` per deck).
4. **a big situation board** (a curved wall screen, ~9 × 3 m, with a world map) — THE BIG BOARD (three screens + two racks today).
5. **a round war-room table** with inset lamps, **a red phone**.
6. **a bunker window** (a wall-mounted screen framed as a picture window, lit) — the `false_window` proc.
7. **a wine rack**, **a panic-room door** (a vault leaf on a hinge — `leaf_vault` stands in), **a home cinema seat**.
8. **a particle detector** (a barrel of layered rings, ~6 m across, on a cradle) and **a beamline pipe section** (a blue tube on stands, 2 m) — THE BEAM (the orb) and the ring's floor.
9. **a sleep pod** (a capsule bed with a canopy) and **an EEG cap on a stand** — the ward.
10. **a spoon** (bent), **a Zener card deck**, **a Faraday cage** — the range.
11. **a bulkhead door with a wheel** — the freight lift's leaf (`leaf_bulkhead` stands in) and the ring's blast door.

## 3l. CAMELOT CASTLE (2026-09-18 — complex candidate #2) — what stands there, and the wishlist

No new file. The five parts (DOOR_HQ_BUILD_PLAN §9, 2026-09-18) are dressed from the kit as it stands:

| family | file(s) | stands as |
| --- | --- | --- |
| the kit + §3e / §3g | `brazier` ×4, `stocks`, `signpost`, `sea_chest`, `cave_torch`, `campfire`, `railing_1m` ×2, the plan's thicket (`_nrTree`) | THE OUTER WARD |
| the kit + §3g | `royal_throne`, `brazier` ×2, `stained_glass`, `holy_tapestry` ×2, `wall_torch` ×4, `candle_ring`, `lectern`, `sea_chest`, `railing_1m` | THE GREAT HALL |
| the kit + §3g | `brazier` ×3, `wall_torch` ×4 (free-standing on the plan walls), `stocks`, `lectern`, `library_shelf`, `sea_chest`, `railing_1m` | THE KEEP |
| the kit + §3g | `floating_orb` (THE ORB), `crystal_cluster` ×2, `cave_torch` ×4, `lectern`, `library_shelf`, `sea_chest`, `stocks`, `sarcophagus`, `skull_pile` / `cave_stone` (the scatter), `railing_1m` | MERLIN'S UNDERCROFT |
| the kit + §3g | `fountain`, `brazier` ×4, `brick_arch`, `demon_statue` ×2 (the gargoyles), `white_cloud` ×6 + the scatter, `sea_chest`, `signpost`, `railing_1m` | THE CASTLE IN THE SKY |

Procedural, in three-renderer.js (`_hqProcBuilders`, the castle's own kit — 2026-09-18): **`round_table`** (an oak disc with no
head on a stone pedestal, twelve high-backed chairs), **`banner`** (a heraldic cloth on an iron rod — a wall proc, the field's
colour turning per instance), **`armour_stand`** (a knight's plate on a post with its shield), **`sword_stone`** (the anvil on its
boulder, the blade upright, a light in the steel). The landmark **`skycastle`** (`_hqLandmarkBuilders`) = the `castle` builder
hung on its own cloud isle (THE CASTLE IN THE SKY over the ward); the ward's terrain walls in `castle_wall` are THE CURTAIN WALL.

THE WISHLIST (Meshy, unit-normalised; a row = `base: 'misc'` + `h`/`span` + `foot`/`block`, then a prop line — nothing in the
renderer unless noted):
1. **a round table with twelve chairs** (oak, a sword slot at the centre) — the `round_table` proc.
2. **a knight's armour on a stand**, **a heraldic banner** (two or three fields), **a weapon rack** — the `armour_stand` / `banner` procs.
3. **the sword in the stone** (a boulder, an anvil, the blade) — the `sword_stone` proc.
4. **a portcullis** (a raised iron grate on a frame, ~4 m) — the gatehouse gap wears nothing today; **a drawbridge** (a plank
   deck with chains, ~9 × 4 m) — the `deck` planks.
5. **a stone gargoyle** — the `demon_statue` stands in on the keep in the air.
6. **a wizard's workbench** (retorts, a skull, a candle) and **a crystal ball on a stand** — the `floating_orb` is THE ORB.
7. **a wooden trestle table + benches** — the hall's `wall` bench row.
8. **a castle wall section with battlements** (crenellated, ~4 m) and **a round tower** — the terrain `wall` rows and the plateau
   towers today (a battlement GLB would ride the wall tops like the hoardings ride the yard walls: `_hqHoardingSigns`'s pattern).

## 3m. THE UNDERWORLD (2026-09-18 — complex candidate #3, THE TUNNELS / THE DUNGEONS) — what stands there, and the wishlist

No new file. The four parts (DOOR_HQ_BUILD_PLAN §9, 2026-09-18) are dressed from the kit as it stands:

| family | file(s) | stands as |
| --- | --- | --- |
| the kit + §3e / §3i | `drain_grate` ×2, `pipe_run` ×3, `graffiti_wall` ×3, `traffic_barrel` ×2, `warning_tape`, `quarter_pipe`, `railing_1m` ×2, `bare_bulb` ×6, `cinder_block` / `cave_stone` (the scatter) | THE SEWERS |
| the kit (§6b) | `train_car` ×2 + `track_bed` ×2 (THE DEPOT), `departures_board`, `tube_map`, `turnstile` ×2, `park_bench` ×2 (THE GHOST STATION), `quarter_pipe`, `riser_1`, `railing_1m`, `bare_bulb` ×7 | THE RUNNING TUNNELS |
| the kit | `cell_bars` ×6 (free-standing at the cell mouths), `cot` ×7, `wall_chains`, `steel_table` + `crt_terminal` + `desk_lamp`, `filing_cabinet` ×2, `clipboard`, `breaker_panel`, `security_camera`, `railing_1m`, `bare_bulb` ×6 | THE HOLDING CELLS |
| the kit + §3e / §3g | `cave_torch` ×4, `brazier`, `skull_pile`, `signpost`, `drain_grate`, `pipe_run` ×2, `railing_1m`, `cave_stone` / `cinder_block` (the scatter) | THE OLD WORKINGS |

Procedural, in data.js only: the culverts' channels (`stream`), the cistern's plank (`deck`), the rails (`wall` rows at 0.14 m),
the outfall shaft / the gantry / the stack / the chimney (`plateau` pinnacles), the traced plan walls in `bricks_2` /
`urban:ConcreteStriped1d` / `urban:PlasterWallPainted2c`.

THE WISHLIST (Meshy, unit-normalised; a row = `base: 'misc'` + `h`/`span` + `foot`/`block`, then a prop line — nothing in the
renderer unless noted):
1. **a sewer pipe section** (a ~2 m brick or concrete culvert ring, open both ends, ~2.4 m across) — today the culverts are the plan's walls;
   a ring at every culvert mouth would make the transitions read.
2. **a manhole ladder + shaft** (rungs on a wall, a ring at the top, ~4 m) — THE OUTFALL SHAFT's face and THE PUMPING STATION's way down;
   with it a `manhole` way kind (a street's own way down — the renderer's `_hqWayBuilders`).
3. **a pump** (a cast-iron pump on a plinth with a wheel valve, ~1.6 m) and **a valve wheel on a pipe** — THE PUMP ROOM and THE PUMP LEDGE
   wear `pipe_run` today.
4. **a subway track section** (two rails on sleepers on ballast, ~4 m) and **a third-rail cover** — the rails are 0.14 m `wall` rows; a track
   GLB laid along the loop's straights would replace them (a placer along a polyline, like the road tiles: renderer work).
5. **a signal gantry** (a lattice mast with two lamp heads, ~5 m) — THE SIGNAL GANTRY is a plateau pinnacle.
6. **a subway maintenance cart** (a flat trolley on rail wheels) and **a spool of cable** — THE DEPOT's dressing.
7. **a cell door with bars** (a hinged barred door in a frame, ~2.2 m) — the `cell_bars` proc stands free at the mouths; a door leaf
   (`leaf: true`) would let the cells be DOORS (a `gen.rooms` row with a door — data + the halls generator).
8. **a police desk** (a tall booking counter with a lamp) and **a bench with a ring** (the drunk tank's) — THE BOOKING COUNTER is a wall row.
9. **a mine cart on rails** and **a mine timber set** (two posts and a cap) — THE OLD WORKINGS' dressing along the boards.
10. **a hand pump with a bucket** — THE WELL, FROM UNDER's tape stands on the chimney; the bucket would stand under it.

## 3n. THE DEEP (2026-09-18 — complex candidate #8, THE OPEN SEA · THE ABYSS · THE TEMPLE) — what stands there, and the wishlist

No new file. The three parts (DOOR_HQ_BUILD_PLAN §9, 2026-09-18) are dressed from the kit and from PROCS
(`DOOR_HQ.catalogue` rows with `proc:` → three-renderer.js `_hqProcBuilders`, the "THE DEEP" block) until the
second pass brings the models. Every new catalogue key, in one place:

| key | what it is today | stands as |
| --- | --- | --- |
| `skiff` | a proc: the misc `rowboat` GLB (`Meshy_AI_a_rowboat_0912231059_texture.glb`, its length along X, turned to +Z) under a procedural mast, boom and sail (a stand-in hull until it lands) | THE SKIFF at the jetty's end on the open sea — `vehicle: 'boat'`, `float: true` (E boards it, `hq.board`) |
| `submarine` | a proc: a brass hull, a conning tower and hatch, a screw that turns, lit portholes, two lamps with light cones | THE BATHYSCAPHE moored off THE STATION in the abyss — `vehicle: 'sub'`, `hover: 1.2` |
| `lighthouse` | a proc: a tapered white-and-red tower on a rock plinth, the gallery, the lantern room, a BEAM that turns (a ticker) | on THE LIGHTHOUSE ROCK of the cay — the sea's near weenie; the hard tape stands on the rock |
| `sea_buoy` | a proc: a red can on a float, a caged lamp that blinks | the ring of four round THE MAELSTROM — `float: true` |
| `ship_wreck` | the misc `wreck` file (`Meshy_AI_a_ghost_ship_wreck_0912231131_texture.glb`) as a catalogue row (span 16) — the same-thing rule (§9) | on THE WRECK ISLET (the sea); THE DUTCHMAN BELOW by the west wall of the abyss, her hatch beside her |
| `kelp` | a proc: two crossed tapered fronds on ONE material per room that sways in the vertex shader (`_hqKelpMat`) | THE KELP FOREST (the abyss, 70), the kelp off the sandbar (the sea, 18 — `scatter … sea: true`) |
| `coral_brain` | a proc: a squashed lumpy icosahedron in a warm coral | the reef's shallows, the abyss floor |
| `coral_fan` | a proc: a lacy fan of ribs on a stalk, swaying | the reef, the abyss's coral field |
| `coral_tube` | a proc: a cluster of open tubes | the abyss floor |
| `anemone` | a proc: a ring of soft tentacles that breathe | the abyss floor (24) |
| `giant_clam` | a proc: two fluted shells open on a pearl | the abyss floor (6) |
| `sea_vent` | a proc: a black smoker with a glow in the vent and smoke sprites rising (a `light`) | THE TRENCH (3) |
| `fish_school` | a proc: forty fish on one InstancedMesh looping a lazy figure (a ticker) | the abyss (5), the open sea (3) |
| `temple_dome` | a proc: a marble dome on a ring of columns, lit from within (a `light`) | over THE TEMPLE STEPS' vault door in the abyss — the abyss's near weenie |

Also standing here from the kit as it was: `greek_column` (the colonnade, both Atlantis parts), `sarcophagus`, `skull_pile`, `sea_chest`,
`ship_anchor`, `ship_cannon` ×2 (the wreck's), `crystal_cluster` ×7 (the drowned road's lamps, the temple's), `brazier` ×4, `royal_throne`,
`stained_glass` ×4, `holy_tapestry`, `railing_1m`, `campfire`, `signpost`, `folding_chair`, `cardboard_box`, `wet_floor_sign`,
`paper_sheet`, `cave_stone` / `fallen_log` / `menhir` (the scatter). The far weenies are LANDMARKS (no file): `waterspout` on the sea's
sky, `whale` on the abyss's (`_hqLandmarkBuilders`). The whirlpool and the upwelling are WAY builders (`_hqWayBuilders`), no file.

THE WISHLIST (Meshy, unit-normalised; a row = `base: 'misc'` + `h`/`span` + `foot`/`block`, then a prop line — the proc rows above are
the ones to replace: give the row a `file` and drop the `proc`, nothing in the renderer unless noted):
1. **a sailing skiff** (a small open boat WITH a mast and a furled or set sail, ~4.8 m, the bow at −X like every measured piece) — replaces
   the `skiff` proc's hull + sail; the helm's seat and the vehicle registration read the catalogue row, not the mesh.
2. **a bathyscaphe / a small submarine** (a brass-and-rivets or a research sub with a viewport and two lamps, ~6.5 m) — replaces the
   `submarine` proc; the lamp positions are the proc's, so a model's own lamps would want the two cones re-hung (renderer: one edit).
3. **coral, three or four kinds** (a brain coral ~1 m, a fan coral ~1.6 m, a tube / a staghorn cluster ~1.2 m, a table coral) — the
   procs are simple solids; one Meshy set would carry the reef.
4. **kelp / seaweed** (a tall frond ~4.5 m, thin — it will still sway only if built as the proc's planes; a GLB frond is static unless the
   renderer skins it: mark it `kelp: true` and the sway shader could be applied to its material — one edit).
5. **an anemone** and **a giant clam** (small: 0.5 / 0.7 m).
6. **a black smoker** (a hydrothermal vent chimney, ~2.4 m, dark rock) — the trench's.
7. **a fish** (one small fish, ~0.3 m, low-poly — the school is an InstancedMesh: a GLB's geometry would be taken ONCE for all forty:
   renderer, one edit) and **a shark** (the misc `shark` file exists on the horizon rosters already — a room-scale prop row would swim
   it through the abyss on a ticker: one proc line).
8. **a whale** (~40 m, dark) — the `whale` landmark is boxes and spheres; the sky builder would take a GLB through `_hzMiscKit`.
9. **a sunken statue / an Atlantean head** (~5 m, weathered marble) and **a drowned archway** (a broken marble arch, ~4 m) — THE
   DROWNED ROAD's ruins are columns; these would make the city read.
10. **a lighthouse** (a full tower ~11 m, white and red, a lantern room) — the proc is bands and a beam; the beam would want re-hanging
    at the model's lantern height (renderer: one number).
11. **a channel buoy** (red, ~2.2 m) and **a mooring post with a rope**.
12. **a treasure pile** (coins and cups spilling from a chest — the `sea_chest` is closed) and **a diver's helmet** (brass, ~0.4 m).
13. **an open shipwreck section** (a hull broken open so the walker can swim INTO it — the `wreck` file is a closed hull) — the second
    pass's set-piece: a room-scale prop with `rect: false` and no foot, its interior a swim.
14. **a waterspout / a storm cloud** would not help: a landmark is better procedural (it turns); a **Flight 19 Avenger wreck** on the
    reef WOULD (a ~12 m propeller aircraft, broken) — the Triangle's own story on the sea floor.

## 4. The older `Assets/misc/` models (`_MISC_GLB` + the OBJ landmarks)

| key | file | kind | stands as |
| --- | --- | --- | --- |
| `moon` | Meshy_AI_moon_realistic_0727195427_texture.glb | Meshy | the sky's moon (`_updateSkyMoon`); Meteor's rock via `getMiscModelClone('moon')` |
| `earth` / `jupiter` / `saturn` / `alien` | Meshy_AI_planet_earth_realist / jupiter_realistic / saturn_realistic / alien_planet_realis_…_texture.glb | Meshy | `_hzModelPlanet` (crystals / orbs / space / wreckage / cosmic rosters) |
| `star` | Meshy_AI_star_realistic_0727195402_texture.glb | Meshy | `_hzModelStar` |
| `solar` | Meshy_AI_solar_system_realist_0727195437_texture.glb | Meshy | `_hzModelSolarSystem` (rare) |
| `ufo` | Meshy_AI_Triangle_UFO_0727195842_texture.glb | Meshy | `_hzModelCraft` (patrol) AND the gameplay saucer (`_sigBuildUFO` via `_WPN_MODELS.ufo`) — the SAME craft that abducts you |
| `spaceship` | Meshy_AI_spaceship_0727195825_texture.glb | Meshy | `_hzModelCraft` |
| `clock` / `gclock` | Meshy_AI_analog_clock_realist / grandfather_clock_re_…_texture.glb | Meshy | `_hzModelClock` (divine / dark / wonder / cosmic rosters) |
| `dumpster` / `greekcol` / `mushroom` / `mushroom2` / `obelisk3d` | Meshy_AI_dumpster / greek_column / mushroom / mushroom_realistic / obelisk_…_texture.glb | Meshy | grid-snapped MONUMENTS (`_MON_GRID`, collision in map.js); `_hzMushroomFar` in the wonder roster (+ the caterpillar) |
| Pyramid | Pyramid/Pyramid.glb + Textures/TextureBake.png | GLB (authored) | `_hzModelPyramid` (pyramids / cosmic rosters; `pyramid` monument); **MARS** (2026-09-16): the Cydonia pyramid off the far corner of the setting, tinted the regolith's red (`_hzModelPyramid(rng, { h, color, lift, cap: false })`), the site room inherits it |
| eyeball | eyeball/eyeball.obj + textures/Eye_D.jpg | OBJ | `_hzModelEyeball` (orbs / eyes / space rosters) |
| street lamp | streetlamp/Street Lamp.obj | OBJ | `_buildLampPostObj` (Entropy-Vale lamp posts), `_nrLamps` |

## 5. Spell props — `_WPN_MODELS` (`Assets/weapons/`, three-vfx-effects.js)

All Meshy; `axis` = the normalised long axis, `tweak` = the baked flip.
revolver · pistol · plasma · football · arrow · cauldron · crystalBall ·
jet · sword (Excalibur, the iai, the stand-sword) · bullet · missile ·
shotgun · sniper · fist · sleigh · femur · ulna · skull · candle ·
candleLine · candleRing · tarot · tarot2 · tarotDeck · cross · **ufo**
(misc bucket) · **cannon** (misc bucket, 2026-09-12) · **asteroid** /
**asteroid2** (THE FINISHER PASS, 2026-09-18 — the D.O.O.R. kit's
`asteroid_1.glb` / `asteroid_2.glb` from `Assets/door/models/`, `axis: 'y'`:
THE ROCKS — every thrown / falling rock is one of them through
`_finRockBody`: the boulder projectile (Boulder Hurl, Stone Throw,
Stonefall), the Meteor's body, the METEOR STORM, the moon's debris; the
jostled icosahedron is the cold-cache fallback). The moon in TO THE MOON
is the renderer's `moon` misc GLB through `ThreeRenderer.getMiscModelClone`
(`_sigMoonshot3D`; a rock-sheet sphere until it streams). The sleigh and the
master sword ALSO stand on boards from the same files (`_hzSleigh`,
`_hzExcalibur` — North Pole, Camelot): one file, two loaders, one look.

## 6. The headquarters kit — `DOOR_HQ.catalogue` (`Assets/door/models/`)

116 Meshy GLBs (desk kit, furniture, wall pieces, the vehicles, the
plants, the held items), 18 procedural entries (`proc:` builders in
`_hqProcBuilders`), 41 door leaves (32 Meshy + the nine authored doors
of §3b), and the seven authored props of §3b. Since 2026-09-12 an entry may carry
`base: 'misc'` to read a shared misc-bucket file (the two pocket
watches). Three kit props ALSO stand on battle boards through
`_hzDoorKitGLB`: `mars_rover` (Mars), `lunar_lander` (the Moon),
`palm_tree` (Atlantis) — battle and site room alike, never doubled as
room props.

**THE FLYING DUTCHMAN COMPLEX (9.2 stage 3, 2026-09-15 rev 19)** — four catalogue rows read the SHARED misc bucket (`base: 'misc'`, the same files `_MISC_GLB` names): `ship_cannon` (the gun deck's four guns, muzzle −X at face 0), `sea_chest` (the shot locker, the captain's chest, the hold's two), `ship_anchor` (the spare in the hold), `ship_lantern` (`ceil` + a warm `light`, hung from the beams on every deck). Nothing new on R2.

## 6b. THE EXPLORATION FLOORS (Phase 8, 2026-09-14) — what stands on the new floors
Everything on G · B · B2 · 3 is the D.O.O.R. kit (§6) or a `DOOR_HQ.catalogue`
PROC (44 new builders in three-renderer.js `Object.assign(_hqProcBuilders,
{…})`: car_panel · shaft_window · concrete_pillar · parking_bay ·
parked_car · garage_ramp · roller_shutter · kitchen_range · range_hood ·
pot_rack · meat_hook · washer · dryer · laundry_cart · flicker_tube ·
bare_bulb · boiler · cell_bars · wall_chains · stocks · wall_torch ·
candle_ring · ritual_circle · stone_altar · floor_stain · floating_orb ·
chalkboard · lectern · riser_1/2/3 · school_desk · toilet_stall · urinal ·
sink_row · hand_dryer · locker_bench · shower_stall · lap_pool ·
lifeguard_chair · garden_ring · fountain · park_bench · garden_tree) — a
user GLB replaces any of them by giving its catalogue row a `file`
(§9, the same-thing rule). Two families are RE-HOMED, not new:
- **THE SEDAN** (the honda civic race GLB, `Assets/Sprites/Races/
  hondacivic/…1990s_sedan…`, rigged race model used static): the main
  menu's parked car (`_menuBuildSedan`) AND the garage's five `parked_car`
  procs (`getRace3DModel('honda civic', 'male')`, fit 1.42 m, five tints).
- **THE FOLIAGE OBJs** (Tree_1 / Tree_3 / Tree_6 via `_nrTree`): the
  garden's six `garden_tree` procs, on a bare `_nrKit` like the site
  boards' trees.
Wish-list for these floors (plan §8.5): a hooded robe, a second car, a
washer / dryer, a range, a toilet + stall, a sink row, a crystal orb, a
pool ladder + starting block, a lifeguard chair, a park bench, a fountain,
iron bars, a bracketed torch; hedge / raised-floor / gym-rubber / wet-
concrete / frost textures.

## 7. Rigged models

95 race rigs in sprites.js `RACE_MODELS_3D` (per race and gender; the
UAL / MAL animation libraries retarget onto every one) and 16 cast rigs
in `DOOR_CAST_MODELS`. The HQ avatar is the Player rig or the most-played
vessel (`hqAvatarPref`). Not catalogued per file here — the race table is
the register.

## 8. Procedural families (the `_hz*` builders — no file)

- **THE SPELL-MADE MONUMENTS** (`_monBuilders`, 2026-09-18 — what the wall
  spells stand instead of raised blocks, 1×1×2 grid boxes in `_MON_GRID`,
  placed live by map.js `placeSpellMonument`): `menhir` (Rampart — the
  woods batch's standing-stone GLB, `_hzPropMenhirProc` the slab fallback),
  `castle_wall` (Walls of Camelot — `_hzCastleWallSeg`, procedural
  crenellated masonry in the castle sheet), `gothic_wall` (Gothic Rampart —
  the Vatican batch's `church_wall` GLB, `_hzGothicWallSegProc` the
  pinnacled fallback), `ziggurat_block` (Ziggurat Protocol — a stepped
  sandstone block with a glyph band). Wish-list: a crenellated castle-wall
  segment GLB (1 × 2 tiles, merlons), a ziggurat tier block, a gothic
  buttress — measure, `_hzMiscKit`-first, keep the keys.
- **Monuments** (`_monBuilders`, on-board cover): pyramid_cone, ziggurat,
  arch/gateway, obelisk, stairway, monolith, greek, crystal, rings,
  colossus, island, flag, rover (fallback), goldgate, lightpillar,
  fluorescent, exitsign, lenticular, brazier, holoboard, jumbotron,
  tablet, biodome, saucer, whalebones, windmill, innersun, toadstool,
  fairyring, holopyramid, geode, basilicadome, censer, effigy, tpillar,
  greytube, beamring, securitycam, candycane, woodcross, skull,
  fleshmound, tome, igloo, rosewindow, door, chess_* (six). GLB-first
  now: trilithon, babelcrane, blastdoor (+ the misc props of §4).
- **Settings** (`_NR_BUILDERS`, one per map): shasta, stonehenge, giza,
  nuketown, heaven, hell, cyberpunk, camelot, stadium, atlantis, babel,
  olympus, mars, area51, antarctica, skinwalker, hollow_earth,
  fairy_forest, moon, technoticlan, agartha, vatican, bohemian_grove,
  gobekli, dumb, cern, backrooms, northpole, flatlands, revenge
  (the Dutchman), derelict, lookingglass.
- **Far rosters** (`_hzThemeRoster`): divine, infernal, ruins, pyramids,
  crystals, orbs, eyes, islands, city, space, dark, sea, wreckage,
  wonder, holosim + the cosmic default.
- **Billboards**: `_hzGlowSprite` / `_hzGlowCore` haloes, `_hzTextTex`
  signs and playing cards, `_nrStreakTex` wakes.

### 8b. AREA 51's procs (2026-09-18) — `saucer_rig` (HANGAR 18: the tripod cradle, the lens, the dome, the tarp, four floodlights — the near weenie; a real saucer GLB with a tarp would replace it: measure it, `base: 'misc'`, keep the key) and `flood_mast` (THE FLIGHT LINE's floodlights — an outdoor terrain room lights itself). Wish-list: a tarped saucer, a floodlight mast, a control tower, a padded-cell wall tile (the `wall_padding` proc stands free on the plan walls).

## 9. The same-thing rule (one model per thing, everywhere it appears)

| the thing | the model | where |
| --- | --- | --- |
| the alien saucer in flight / abducting | Triangle UFO (`ufo`) | orbs / space rosters, the UFO spells |
| the saucer on the ground | `saucer_lg` | Area 51 |
| a cannon | `cannon` | the Dutchman's rails, the Cannonball spell, THE GUN DECK below decks (`ship_cannon`) |
| a sea chest / an anchor / a hanging lantern | `chest` / `anchor` / `lantern` | the Dutchman's deck and quay; below decks as `sea_chest` / `ship_anchor` / `ship_lantern` (rev 19) |
| the master sword | Meshy_AI_master_sword | Excalibur's rock (Camelot), every sword effect |
| the sleigh | Meshy_AI_Golden_Red_Sleigh | the North Pole board, the sleigh spell |
| a vault / blast door | `vault` | D.U.M.B. chokes, the `blastdoor` monument (D.U.M.B., CERN) |
| a trilithon | `trilithon` | Stonehenge's setting, the `trilithon` monument |
| a crane | `crane` | Babel's setting, the `babelcrane` monument |
| a pocket watch | `watch` / `watch_hang` | the Looking-Glass (rim + roster), Room 247 |
| the moon | `moon` | the sky, the Meteor rock |
| the mushroom | `mushroom` | the board monument, the wonder roster (+ caterpillar) |
| the D.O.O.R. leaf of a site | `DOOR_HQ.thresholds[map].leaf` | the building's door, the crossing cinematic, the lone doors in every roster, the main menu |
| a security camera | `security_camera` | the hall / IT / the Interrogation Room walls, Downtown's pole camera + the `securitycam` monument |
| a street utility box | `utility_box` | every URBAN setting (Cyberpunk, the Strip, Downtown, Nuketown, the Stadium) |
| an asteroid | `asteroid_a` / `asteroid_b` | the `space` + `wreckage` rosters (`_hzAsteroidFar`) |
| a car / a truck / a bus | `_VEHICLE_KIT` (§3c: `suv` · `cadillac` · `copcar` · `cybercar` · `firetruck` · `schoolbus` · `ambulance`) | the URBAN settings through `_hzVehicle`, Room P1 through the catalogue's `car_*` rows — never a procedural box where the kit has the vehicle |
| the subway train | `subway_front` + `subway_cart` | ONLY the `train` way rig (`_hqWayBuilders.train`) — the tunnel's `train_car` proc is retired; never a second train as a prop |
| the leaves in THE WORKS (Room 1000's belt + gripper + pallet, Room −1's furnace, Room ½'s vine, Room ?'s shelf) | `_HQ_WORKS_LEAVES` — 16 plain catalogue `leaf_*` rows (coffee · beige / white wood · shabby · suburban · closet · barn · stable · hotel · motel · birch / orange glass · medium window · entrance · bathroom · glass) | `_hqWorksLeaf` (2026-09-16) clones the door kit's own files fitted to the proc's slot; `_hqMiniDoor` is the hidden stand-in — never a procedural panel where the kit has the door |
