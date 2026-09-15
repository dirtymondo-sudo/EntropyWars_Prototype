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
| `standingstone` | Meshy_AI_a_standing_stone_0912231506_texture.glb | — | Stonehenge (the bluestones — a broken outer horseshoe, each its own height) | | | | | |
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
| `asteroid_a` / `asteroid_b` | asteroid_1.glb / asteroid_2.glb | unlit, tumbling | | **space** (Mars, the Moon, Saturn, the Singularity) + **wreckage** (the Spaceship) via `_hzAsteroidFar` — `_hzAsteroid` (the procedural rock) is the fallback | the celestial site rooms' skies (same roster) | |

The frame fits the leaf since this batch: a leaf may carry `shape:
'circle'` (+ `hole`, the disc's share of the opening — the vault 0.64,
the bulkhead 0.96) or `shape: 'arch'` (+ `arch`, the cap's share of the
height — the portcullis 0.42, the hell door 0.34); three-renderer.js
`_hqDoorSurround` cuts a wall-textured plate to it behind the leaf
(rect leaves get the opening inset 1.5 % — a stop, not a black gap).

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
| Pyramid | Pyramid/Pyramid.glb + Textures/TextureBake.png | GLB (authored) | `_hzModelPyramid` (pyramids / cosmic rosters; `pyramid` monument) |
| eyeball | eyeball/eyeball.obj + textures/Eye_D.jpg | OBJ | `_hzModelEyeball` (orbs / eyes / space rosters) |
| street lamp | streetlamp/Street Lamp.obj | OBJ | `_buildLampPostObj` (Entropy-Vale lamp posts), `_nrLamps` |

## 5. Spell props — `_WPN_MODELS` (`Assets/weapons/`, three-vfx-effects.js)

All Meshy; `axis` = the normalised long axis, `tweak` = the baked flip.
revolver · pistol · plasma · football · arrow · cauldron · crystalBall ·
jet · sword (Excalibur, the iai, the stand-sword) · bullet · missile ·
shotgun · sniper · fist · sleigh · femur · ulna · skull · candle ·
candleLine · candleRing · tarot · tarot2 · tarotDeck · cross · **ufo**
(misc bucket) · **cannon** (misc bucket, 2026-09-12). The sleigh and the
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
