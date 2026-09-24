# Notes: models-assets

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). Model batches, kits, model queue, asset store, matte bake.
Append new notes for this system at the end of this file.

## THE MISC KIT + MODEL_INDEX.md (the moving-maps model batch) — added 2026-09-12
28 Meshy GLBs the user uploaded to R2 `Assets/misc/` now stand on the
three travellers, the wheel / rise maps, D.U.M.B., the Cannonball spell
and Room 247. **`MODEL_INDEX.md` is THE register of every 3D model family
(kind · bucket · loader · every place it stands) — update it in the same
delivery as any model change; misc-models.test.js checks the batch is
named in full.** Renderer: `_MISC_GLB` (three-renderer.js) holds the
filenames (the facing of each measured off contact sheets is in its
comment) and **`_hzMiscKit(key, { tiles | metres, fit, yaw / tilt / roll
(pre-turn the MODEL so the caller's rotation.y keeps its meaning), hang
(top at y = 0), sink, lift (the bake as emissive — night / space maps),
cast, foot (collision disc in metres for the site room), low: 'skip'
(pure scenery skipped under EW_PERF_LOW), fallback })`** places one.
GLB-first builders keep their names with a `…Proc` fallback:
`_hzTrilithon`, `_hzBabelCrane`, `_hzBlastDoor` (= the bank vault; the
`blastdoor` monument too), `_hzGhostShip`; `_hzSaucerLanded` is Area 51's
craft on its gear (the flying `_hzSaucer` stays the horizon's). Settings:
the Dutchman (rail cannon ×8 `yaw π/2` outboard, the helm, the anchor, the
chest, yard lanterns, the towed rowboat, two kraken arms off the port
quarter), the Derelict (nacelles `yaw π`, the mast dish, the docked escape
pod, the torn plate at the breach, a dead astronaut adrift, the docking
collar), the Looking-Glass (teapot, cups, caterpillar, flamingo, the open
watch on the rim), Stonehenge (the standing-stone bluestones). Rosters
`sea` / `wreckage` / `wonder` carry `_hz*Far` GLB rows (kraken, shark,
palm isle, pod, astronaut, docking ring, hanging watch, teapot, cups,
flamingo, caterpillar-on-mushroom). three-vfx-effects.js `_WPN_MODELS.
cannon` (misc-bucket `url`, `tweak ry π`) is the Cannonball's gun,
GLB-first in `_sigCannonShot3D` (the carriage materials are made only on
the procedural path). `DOOR_HQ.catalogue` entries may carry **`base:
'misc'`** (`_hqModelUrl`) — the two pocket watches in the clock room.
Wish-list (still procedural): the Staunton set, a galleon hull with a
figurehead, card soldiers, a cryo tube. Measure a new GLB before wiring
(PLAYTEST_NOTES "Rigged 3D unit models" has the parser; a Playwright
contact sheet with an AxesHelper settles the facing in one look).

## THE DOOR-KIT BATCH + THE SURROUND (the frame fits the leaf) — 2026-09-14, local delivery
Fifteen files the user uploaded to R2 `Assets/door/models/` (MODEL_INDEX
§3b): eight AUTHORED doors (not Meshy — real scales, several meshes,
filenames WITH SPACES: `_hqModelUrl` encodes them) and seven props. **The
leaves** (data.js catalogue `leaf_beige_wood` / `_white_wood` / `_coffee`
— one model, three finishes, edge-on `yaw: 90`, hinge right; `leaf_wooden`
— 11 MB, its own frame, hinge left; `leaf_birch_glass` / `_orange_glass` —
`yaw: 180`, hinge left; `leaf_window_large` / `_window_medium` /
`leaf_entrance` — 2× life size, fitted) hang on nine doors: the Haunted
House, Shasta, the Vatican, the North Pole, Area 51 and Downtown
thresholds, the Barbershop (+ its way out), Reception, Bay 7. The hinge
sides were read off the GLBs' hinge / handle NODES (scratch tooling;
`node --check` only — the swing is unseen, RULE #1c). **THE SURROUND**:
three-renderer.js `_hqDoorSurround(ow, oh, cat, mat)` (right before
`_hqBuildDoors`) stands a wall-textured plate in the recess in front of
the black beyond, CUT TO THE LEAF'S SHAPE — catalogue `shape: 'circle'` +
`hole` (the disc's share of the opening: `leaf_vault` 0.64 — a round door
proud of a dark square plate, the plate now hides behind the wall;
`leaf_bulkhead` 0.96), `shape: 'arch'` + `arch` (the cap's share of the
height: `leaf_portcullis` 0.42, `leaf_hell_arch` 0.34), else the opening
inset 1.5 % (a stop, never a black sliver). The leaf fit is edge to edge
now (`frame: true` leaves overlap the jambs by a few cm; a bare leaf stops
1 cm short; the 8 cm of black over every leaf is gone). Measure a new
leaf's silhouette before giving it a shape (PLAYTEST_NOTES has the
scratch rasteriser recipe under "THE DOOR-KIT BATCH"). **The props**:
`computer_chair_blue` / `_grey` (16 MB each — the hall's conference table
+ cubicles, IT, Records, the Clock Room, Medical), `security_camera`
(wall, `mount` 2.55: the hall over Reception + the vault, IT, the
Interrogation Room; Downtown's `_hzSecurityCam` head is GLB-first over
the box), `utility_box` (URBAN settings through `_nrProp` +
`_hzDoorKitGLB`: Cyberpunk, the Strip, Downtown, Nuketown, the Stadium —
the site rooms inherit them, `foot` 0.45 blocks the walker),
`asteroid_a` / `asteroid_b` (`_hzAsteroidFar` in the `space` + `wreckage`
rosters, GLB-first over `_hzAsteroid`; the celestial site rooms' skies
too). `_hzDoorKitGLB` grew `unlit` / `lift` / `low: 'skip'` / `fit`.
None of the seven prop GLBs is in the repo — their `h` / `span` are
targets; if one lands wrong, that field is the edit. `npm test` runs
`door-kit-batch.test.js`. UNSEEN LIVE (RULE #1c): every new leaf's face
and swing, the camera's authored facing (a photo camera would want a desk,
not a wall), the chairs' scale, the asteroids' size against the planets.

## THE MODEL QUEUE — the 507 MB hall, measured and ordered (2026-09-20, local delivery)
The user: "still having issues with the loading textures … the whole game … the door frame doesn't
even load in the main menu." MEASURED on the LIVE host (a Playwright probe against the real CDN,
every request logged): entering the hall pulled **507 MB in 533 requests** — ~110 GLBs of 5–9 MB fired
in ONE burst at t = 3 s (60 props, the cast, THE POPULATION's 13 roaming natives' rigs at 7–9 MB
each — the 2026-09-19 addition), all sharing one HTTP/2 pipe, so the walker's own rig landed at
**109 s**, a 20 KB terrain PNG took 16 s, and the building stood black for a minute; the menu warmed
the whole room behind its own door leaf; a battle's models queued behind the same flood. "Everything
at once" was never fast — it was everything arriving together at the end. RULES now: (1) three-
renderer.js **`_scheduleModelLoad` is ONE priority queue** (`_mqJobs` / `_mqPump`, `MODEL_MAX_INFLIGHT`
4): priority 0 = THE RIG LANE (`_rigLaneMark` — the walker's model + libraries; NEVER waits for a
slot), 1 = the scene on screen (props, doors, units), 2 = a warm / the population's extras (`bg` /
`_bgLoadDepth`); `_bgPromote(url)` lifts a queued bg file the scene asks for; a job frees its slot on
`done()` or the 90 s safety timer; `EW_NO_MODEL_QUEUE` = the old burst (`EW_MODEL_LANES` /
`EW_NO_RIG_LANE` are gone); the phone keeps its serial queue. (2) map.js `_hqWarmArrivalSoon` warms
the WALKER'S RIG ONLY from the menu (`avatarOnly`); Play warms the room. Measured with the fix
substituted on the live host: the rig at 21 s (was 109), the terrain sheets in 2–4 s (was 16), the
population last. STILL THE USER'S: the volume — the hall's furniture is ~300 MB of GLB and the
population ~100 MB per room on a cold cache; `gltf-transform optimize` (WebP, 1024 px) would cut it
5–10×, and the population's draw (`HQ_POPULATION_RULES` `hqMul` / `perM2`) is the other edit.
mobile-performance.test.js pins the queue; load-diet.test.js the avatar-only menu warm.

## THE ASSET STORE + THE EXTRAS ARRIVE + THE FIELD NOTES EVERYWHERE (2026-09-20, local delivery)
The user: "why are there loading screens between every single little door … why does it have to
re-download everything again? does it not check if it already has some of the things cached? what
is the point of having cache if nothing ever stays loaded … the loading screens need the field
notes like the loading screen before battle." READ OFF THE CODE (the CDN is unreachable from the
sandbox — nothing measured live this session): (1) the game NEVER HAD A CACHE OF ITS OWN — the
in-memory caches (`_hqTexCache` / `_hzTexCache` / `_miscModelCache` / `_unitGlbCache`) live for one
page load, and under them sat only the browser's HTTP cache: a few hundred MB in total, an entry
over ~1/8 of that never stored (a 16 MB chair), everything LRU-evicted by the next room's 100–500 MB
of GLB, a dashboard-uploaded object without cache-control re-validated on a guess — so every reload
and every room past the second pulled from the CDN like the first time; (2) THE LOAD GATE (the
same day) waits for EVERY file the room asks for, and the POPULATION (2–6 rigs × 5–9 MB, a NEW draw
per room) was the bulk of it — a walk into a room not yet visited this session became a full card
after `HQ_WALK_BLINK_MS`; a re-visit in the same session is a memory hit and stays a blink. THREE
RULES NOW. **THE ASSET STORE** (three-renderer.js, the block after the ledger): every file the
renderer's loaders fetch goes through CACHE STORAGE (`caches.open('ew-assets-v1')` — a per-origin
store the browser sizes in GB, alive across reloads and deploys) — `_asFetch(url, { rec, priority })`
= a hit off the disk (marks `rec.cached`) or ONE fetch + PUT; `_asGltf` (GLTFLoader.parse off the
bytes), `_asObj` (OBJLoader.parse off the text), `_texFetch`'s store path (a blob URL into the img);
readers: `_loadUnitGLB`, `_loadMiscModel`, `_loadFoliageModel`, `textureLoader.load` (every sheet),
and the VFX file's `_wpnLoad` / `_loadCachedTex` through `ThreeRenderer.assetGltf / assetTexture`.
The index (localStorage `ew_asset_index`: url → last use, bytes) evicts the least recently used past
`AS_CAP_BYTES` (1.5 GB); `navigator.storage.persist()` is asked once. Unavailable (an insecure
context, file://, no Cache API, `EW_NO_ASSET_STORE`) → the loaders take their old direct paths byte
for byte (the harnesses stub `_asAvailable` false). Dev: `window._ewAssetStore.stats()` (hits /
misses / puts / bytes) / `.clear()`. The load card reads `loading <room> · 12 / 48 files · 30 from
the store` (`G.progress().cached`). A new loader anywhere = `_asGltf` / `_asObj` / the renderer's
`textureLoader.load` — never a bare `new THREE.GLTFLoader().load` again. **THE EXTRAS ARRIVE**: a
ledger record filed while `_bgLoadDepth > 0` (the population's extras) is BACKGROUND (`rec.bg`) —
no gate counts it (`adoptLive` neither); the scene asking for the same file promotes it (`_alJoin`).
`_hqSpawnRounds` step 2: a rig the caches hold stands in the room at once; a rig still to stream
spawns ON LANDING at a random unlocked DOOR, `arriving: true`, the leaf swinging (the traveller's own
entrance) — guarded by `_hq === H`, so a room left mid-stream spawns nothing. The room is complete
without them; a person walking in through a door later is a scene event, not a missing asset.
**THE FIELD NOTES EVERYWHERE**: battle.js `window._lsHintPool()` (a fresh shuffle of `LS_HINTS` +
the memos / canon notices; the battle card uses it too) + `window.LS_HINT_CYCLE_MS`; the HQ card
(`#hqLoadHint`, index.html — the battle's `.ls-hint` markup; CSS in styles-base.css beside
`.hq-load.walk`) rotates map.js `_hqLoadNotesPool(roomId, roomDef)` = the ROOM'S OWN notes first
(its `desc` under its number, the SITE FILE of its site) then the pool, driven from
`_hqLoadProgressStart`'s rAF tick (`_hqLoadSetHint`); the walk-blink shows none. `npm test` runs
`asset-store.test.js`. STILL THE USER'S: the volume (the hall ~300 MB of GLB; `gltf-transform
optimize` at 1024 px WebP is 5–10×) — the store makes the SECOND visit free, never the first. UNSEEN
LIVE (RULE #1c): the store on Safari / iOS (Cache Storage under ITP may be purged after 7 days of
no use), the first cold-cache card's count, the arrivals' timing through the doors, the notes'
legibility on the card.

## THE 2026-09-21 BATCH — POLICE OFFICER · JELLYFISH · CULT LEADER (three races on Meshy "Running" exports), THE CULT MEMBERS, RACE MODEL SKINS, the catgirl's new rig (2026-09-21, local delivery)
**THE RIG RULE**: Meshy stopped shipping `_Character_output.glb`; an `_Animation_<Clip>.glb` export WITH SKIN is the
same rigged mesh (28 joints, JOINTS_0 / WEIGHTS_0, textures embedded — measure the JSON chunk before wiring) plus one
baked clip, so it IS the base — `_mkUAL(folder, prefix, { model: '<the export's URL>' })` (the male sniper's Idle_5
export was the first). **THE RACES** (data.js: `RACE_PROFILES` · `AVAILABLE_RACES` (102) · `RACE_DEFAULT_JOBS` ·
`RACE_CLASS` · `RACE_BASE_STATS` (in the 249–275 band, `npm run grades`) · `RACE_PHYSIQUE` · `RACE_ABILITIES` ·
`RACE_TREE` · `RACE_PASSIVES` · `EW_RACE_BIOMES` · `CAMPAIGN_RACE_PRICES` · `CUSTOMS_OVERRIDES` · `POINT_OF_ENTRY` ·
`FINISHERS` · the Heat Death tier; sprites.js: `RACE_PATH_RULES` · `RACE_SPRITE_GENDERS` · `_HOMOSAPIEN_RACE_JOB_MAP` ·
`RACE_MODELS_3D` · `RACE_SPRITES`; server.js `AVAILABLE_RACES`; battle.js `BASIC_ATTACK_RACE_KINDS`; party-builder /
ui.js lore + `RACE_TRAITS`; check-grades role rows; map.js + check-grades `SKY_RACES` (the jellyfish flies)):
**police officer** (Gunslinger · ranged · TIME · human · Downtown; Nightstick → Taser ⇄ Pepper Spray → Cuffed →
Lockdown★, `pointBlank`), **jellyfish** (Black Mage · caster · CHAOS · anomaly + alien · the Bermuda Triangle; Sting →
Bloom ⇄ Drift → Nematocyst Net → Immortal Cycle★ (selfHeal 50 % + cleanse 2), `thermalRegen` + the wing), **cult
leader** (Harbinger · support · CHAOS · human + unholy · Bohemian Grove; Sermon → The Kool-Aid ⇄ Tithe → Indoctrinate
(`possess`) → The Gathering★ (`summonUnit` key `cultist` — three-renderer.js `_buildSummon3D`'s procedural robed
figure), `unquietMind`). Plain kinds only, family VFX aliases in the 2026-09-21 block of three-vfx-effects.js (after
the door agent's), **the finishers DESIGNED with `sig: null`** (the typed execution plays; a director + signature +
stage script is the next pass — FINISHER_PLAN rule 0). Not starters (THE ROSTER LOCK: earned). **RACE MODEL SKINS**
(sprites.js `RACE_MODEL_SKINS` → `getRaceModelSkin(race, gender, { site, seed })` / `raceModelSkinGenders`; the ONE
read is three-renderer.js `_hqSpawnCharacter`'s hook after the def resolves — never the walker, the cast or a creator
look; the board keeps `RACE_MODELS_3D`'s one model per gender): `sites[mapId][gender]` = the rig a native wears in
THAT site's rooms (the two CYBERPUNK officers in `prebuilt_cyberpunk` only — the user's rule; the female exists there
alone, the population's `genderOf` reads the site skins), `alts[gender]` = seeded stand-ins (the fat white officer
beside the black one). Never list a skin under `RACE_MODELS_3D` (its keys ARE the playable genders). **THE CULT
MEMBERS** are CAST, never a race: `DOOR_CAST_MODELS.cult1–5` (`_mkCast` with an explicit `model`, R2
`Races/cultmember/`) + `DOOR_CAST.cult1–5` in `site_prebuilt_bohemian_grove_grove` (three on the mound round the owl's
altar at y 2.6, two on the stage at y 1.4; lines the user's, A15); doorhq.test.js counts 20 cast models. A cast spot
with no `y` stands on a terrain room's GROUND now (`_hqSpawnPopulation` passes `undefined`, not 0). **THE CATGIRL**
wears `Races/catgirl/female/Meshy_AI_catgirl_Running.glb` through the library alone (the old per-character clips were
exported from the OLD rig — cross-character playback warps). door-race.test.js's server pin is membership, not the
list's last entry. `npm test` runs `new-races.test.js`. Ship data.js to R2 AND Render (server.js reads it). UNSEEN
LIVE (RULE #1c): every rig's scale + facing (`heightRatio`), the jellyfish on the swim loops, the cyberpunk cops on
the Grid, the robes on the mound and the stage, the procedural cultist, the catgirl under her old flavour clips.

## THE 2026-09-22 BATCH — wells · benches · vendors · armour · beds · tents · the console · the tapes · the posts + THE KICKABLE BOXES + THE DECK FLICKER (2026-09-22, local delivery)
Seventeen Meshy models the user uploaded to R2 `Assets/misc/` (MODEL_INDEX §3q has the table and every home). **THE RULE**: a model is ONE
`DOOR_HQ.catalogue` row (`base: 'misc'`; the F22 wears `base: 'weapons'` — `_hqModelUrl` reads the spell-prop bucket now, the same file the
Air Support spell flies) and a `_MISC_GLB` register row; a PROC that stood for the thing keeps its key and hangs the file over its own
geometry through three-renderer.js **`_hqCatGlb(key, U, { h, fit, hide, onDone, turn })`** (the row by key, the placer's material pick,
the stand-in pieces in `hide` go invisible when the file lands — the telescope's rule made one helper). Wired: **every well** (`_hqWayBuilders
.well` — `ancient_well` over the stone head + frame, `wooden_bucket` riding the rope; the shaft, its light and the glow stay), **every bench**
(`park_bench` + `locker_bench` → `city_bench`), the `fortune_tent` (→ `fortune_teller_tent`; the ball / glow / sign stay), the `retro_console`
(→ `retro_control_panel`; the catalogue's glow + light stay), the `find_tape` (→ `vhs_tape`; the sparkle stays), a `vhs_player` on every
`tape_shelf`, and the BOARD's traffic light (`_buildTrafficLight3D` → `_hzMiscKit('yellow_pole')` fitted to the pole's height; the mast arm
and the head stay). Placed: `hospital_bed` ×2 in Room 1111's ward (doorhq's cot pins read the bed), `royal_bed` in the keep's solar,
`dorm_bed` ×2 in its guardroom, `couples_bed` on the bunker's loft, `camping_tent` ×3 at the grove's camp + a `carnival_tent` on its lawn,
`field_goal_post` ×2 on the Bowl's goal lines, `military_tank` ×2 in Area 51's pens + the `fighter_jet` on Runway 33 (every room re-solved
with `node check-terrain.js`, nothing traps), and `hot_dog_stand` as a **scatter row** in the three street cities (`r0: 0.9` — the kerb
rule puts a vendor on a sidewalk off the run-ups; measured: every one on a kerb, zero run-up offenders). **THE KICKABLE BOXES**:
`HQ_KICKABLE.keys` grew `cardboard_boxes` (the stack) + `wooden_bucket`, `maxFoot` 0.35 → 0.6 — every cardboard box in the game rolls.
**THE DECK FLICKER**: a terrain `deck` is WRITTEN INTO the field, so its plank slab's top sat exactly on the field's triangles and z-fought
(the cavern's plank, the rope bridge); the slab (and a cave-grid bridge cell) rides 2.5 cm over its data height now — the bridge layer's
rule; the feet read the data rule, never the mesh. `npm test` runs `misc-batch-0922.test.js`. Ship data.js to R2 AND Render. UNSEEN LIVE
(RULE #1c): every facing / scale (`turn` / `h` / `span` are the one-field edits — the tank's and the jet's noses, the well's bucket line,
the bench's back, the pole's mast-arm join), the hospital bed's seat height (`seat` 0.6), the hot dog stands' landing on the kerbs.

## THE 2026-09-22 MODEL BATCH — THE POPSTAR + eleven rigs (2026-09-22, local delivery)
Twelve Meshy uploads wired in sprites.js `RACE_MODELS_3D` on the 2026-09-21 rig rule (MODEL_INDEX §7b has the
table): the **POPSTAR** (a NEW race), the djinn + the politician REPLACED (the old bases retired, unreferenced in
the bucket), the demon / robot / superhero's SECOND GENDER, and the FIRST rig of six sprite-only races (ai · ice
queen · juggernaut · symbiote · antihero · shadow entity) — a race that gains a rig is 3D-READY (`isUnitUnlocked`
reads `race3DGenders`), so those six are playable on the forge wall from this build. **THE POPSTAR** (data.js
every race table ×15 — the last new-race checklist; sprites.js ×5: the harbinger sheet in 2D, `Dance_Loop` idle;
server.js `AVAILABLE_RACES` 103 — `npm run test:parity`; battle.js `BASIC_ATTACK_RACE_KINDS` magic; ui.js /
party-builder.js lore + trait; check-grades role row): Harbinger · support · human + anomaly · SPACE · the
Football Stadium's native (biomes stadium / urban / neon_city); Mic Drop → Encore! ⇄ Stage Dive → Spotlight →
Stadium Show★ (plain kinds — `damage` / `encore` (her own row on the Harbinger job spell's kind) / `tackle` /
`debuff` with `statStageBoost { def: −1, mdef: −1 }` / `aoe` r2 + charm 1; family aliases in three-vfx-effects.js's
2026-09-22 block); the passive **`showMustGoOn`** (a new `PASSIVE_DEFS` row on the `immuneStatus` hook — silence;
priced 2 in check-grades); the execution **FAREWELL TOUR** (`farewellTour` / `_sigFarewellTour3D` /
`_FIN_STAGE.farewellTour` — FINISHER_PLAN §7 delivery 18; the catalogue is 103 of 103, `sig: null` still never
exists). Not a starter (THE ROSTER LOCK). `npm test` runs `model-batch-0922.test.js`. Ship data.js to R2 AND
Render (server.js reads it). UNSEEN LIVE (RULE #1c): every rig's scale + facing (`heightRatio` / `yawOffset` are
the one-field edits), the dance idle on the board, the female robot on the male loops, the finisher's stands
against the rim.

## THE MATTE BAKE — the forge's stage wears every Meshy bake unlit-matte (the glossy politician / cop) — 2026-09-23, local delivery
The user: "Meshy's lit mode makes the models look glossy; the politician and the cop in the party builder have that
shininess." MEASURED off the exports in the repo (the JSON chunk): every Meshy `_Animation_<Clip>_withSkin.glb` — the
2026-09-21 RIG RULE's base for the politician, the cop, the popstar, the djinn, the six first rigs, the catgirl — carries NO
`metallicFactor` (glTF's default is **1.0 = fully metallic**), a `roughnessFactor` as low as 0.41, `emissiveFactor [1,1,1]`
over the SAME bake as its emissive texture (that IS Meshy's unlit look) and a ×2 `KHR_materials_specular`. THE BOARD AND THE
HQ NEVER SAW IT: `_attachUnitModel` swaps every unit material to Lambert (map only) — the one place the raw PBR material
survived was **`EWCharViewer`** (the forge's stage, the barbershop / intake creator's `HeroViewer3D`), which keeps Meshy's
material on purpose for the close-up; under three's GLTFLoader a metalness-1 body has no diffuse lobe and the stage's three
lights paint tight highlights over the emissive bake — chrome. NOW: three-renderer.js **`_cvMatteBake(mat)`** (before
`_cvEnsure`; `CV_BAKE_ROUGHNESS` 0.92 · `CV_BAKE_EMISSIVE` 0.5) is the ONE rule for a PBR material on the stage — metalness 0,
roughness ≥ 0.92, the bake's self-glow capped at 0.5 (a white emissive with NO map = a pure white glow → off), clearcoat /
specular tamed, no envMap — ALWAYS on a viewer-owned copy (the mount's traverse clones every Standard / Physical material
now, not only a map that needed the sRGB flip; `_cvClearModel` disposes them). `window.EW_CV_LIT_BAKES = true` keeps the
export as authored. The misc / door-kit / prop paths were already Lambert (`_hzMiscKit` picks, `_hqPropMatPick`). Unseen
live (RULE #1c): the stage's tone against the old — `CV_BAKE_EMISSIVE` is the edit if a bake reads too dark (raise) or flat
(lower); the creator base's own shells set their roughness after this and are untouched.

## THE ONE MODEL (2026-09-24) — spells draw the world's Meshy models
mondo: "i dont want one spell with a generated sword and one with a meshy sword". The crossover
table is SPELL_DIRECTOR_PLAN.md §12; MODEL_INDEX.md §9 rows updated. Shipped:
- **Every summoned sword** is the weapons-bucket master sword: `_sigSwordMeshy` (glow shell,
  hologram mode, `ghost(mat)` afterimages) is tried first by `_sigBuildSword`; `opts.procedural`
  forces the old blade (also the fallback while the GLB loads).
- **Air Support** flies the F-22 (`_finJetMeshy`, falls back to `_finJet`) and drops the missile GLB.
- **Drive-By** rolls the HQ's Cadillac: renderer export `ThreeRenderer.vehicle(kind, o)` →
  `_hzVehicle`; `SPELL_MAP.raceDriveBy.ride = 'cadillac'`, fired from battle.js's dash branch as
  `fire('ride', …, {fromX,fromY,toX,toY,durMs,holdMs})` (all on online.js's relay whitelist).
  `_WPN_DRIP_MISC` warms the kit vehicles at match start.
- **Astral realm eyes** wear the esoteric sky's `eyeball/eyeball.obj` (`_hzEyeballPick()` is the
  shared material rule, it flags the cornea); the gaze is found at load from the cornea bbox, so
  the OBJ's authored facing does not matter. `window.EW_PROC_EYES = true` (or EW_PERF_LOW) keeps
  the procedural eye.
- Open: `cross` vs `wooden_cross` are duplicate files — pick one before either is reused.
