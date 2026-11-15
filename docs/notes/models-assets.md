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

## THE ASSETS — compressed models, the manifest, the cap by quota, DOWNLOAD THIS PLACE (2026-09-27, OPEN_WORLD_PLAN Phase 9, zip open-world 12)
Full log: OPEN_WORLD_PLAN.md §12 "PHASE 9". The short of it:
- **To compress**: `npm i --no-save @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer sharp`
  (add `three@0.128.0` for `--check`), then `npm run optimize -- <folder> --check`. Output `<name>.opt.glb` beside each
  GLB. Textures → WebP at their own size (cap `--size`, default 2048); geometry lossless (reorder + EXT_meshopt_compression).
  NEVER quantize for this game: three r128 reads normalized-int attributes raw on the CPU (raycasts, bounds, CPU skinning).
- **To switch it on**: upload the .opt.glb files beside their originals (`npm run deploy -- --assets <folder> --prefix
  <bucket folder>/` or by hand), `npm run manifest -- <bucket mirror>` (or `<folder> --prefix … --merge`), `npm run deploy`.
- **The game** (three-renderer.js THE ASSET STORE): `_asResolve` (manifest-listed sibling → loaded instead; falls back to the
  original on a failure; `window.EW_NO_OPT_ASSETS` = originals), `_asNetUrl` (`?h=<sha>`), `_asStale` (a stored copy under an
  old sha is refetched), `_asWireMeshopt` (every GLTFLoader gets MeshoptDecoder), `_asCapFor` / `_asQuotaRead`,
  `hq.warmZone` / `hq.zoneState`, the settings group "The World on Disk" (map.js `_buildWorldDiskHTML`). Test: asset-store.test.js.

## THE LOD LEVELS + THE NEAR FIRST + THE FAR SHELLS (2026-09-27, OPEN_WORLD_PLAN Phase 10, zip open-world 13)
Full log: OPEN_WORLD_PLAN.md §12 "PHASE 10". The short of it:
- **To bake levels**: the Phase 9 deps, then `npm run optimize -- <folder> --lod --check`. A PROP GLB (no skin, no morph, no
  clip, ≥ 3,000 triangles) gets `<name>.lod1.glb` (~25 % of the triangles) and `<name>.lod2.glb` (~6 %): welded, simplified
  with meshoptimizer, meshopt-compressed (no quantize), NO textures (the game draws a level with the full file's own
  materials). The meshes keep their names and order; `--check` proves it with three r128. Upload beside the originals,
  `npm run manifest`, deploy. Measured: a Meshy door frame 6,592 → 1,690 → 636 triangles in 70 KB / 35 KB files.
- **The game** (three-renderer.js): `_lodUrls` (the manifest's levels), `_lodAttach` (the full file's load queues its levels on
  the background lane), `_lodPair` (order + name + attributes, else refused), `_hqLodTick` (by screen size: HQ_STAGE_RULES
  `lodScreen` [0.12, 0.04] of the viewport height, `lodHys` band; a batch of the instance pass by its nearest copy; a prop
  under `cullM` culled below `lodCull` by switching its layer 0 off), `_hqLodReset` (the swap, the leave, the hand-over).
  `ThreeRenderer.hq.lod()`; off `window.EW_NO_LOD`.
- **The near first**: `_mqSpotAdd` (every misc-model instance names its spot), `_mqDistances` / `_mqCmp` (inside a lane the file
  nearest the walker starts first; the phone's one-at-a-time queue too). Off `window.EW_NO_NEAR_FIRST`.
- **The far shells**: data.js `hqFarParts` / `hqFarShell` / `hqFarColor`, three-renderer.js `_hqFarTick` (HQ_WORLD_RULES `farHaze`,
  `farMinM`, `farMax`, `farTris`), map.js `farWarm` (the survey compiles a far part behind everything). `ThreeRenderer.hq.far()`;
  off `window.EW_HQ_NO_FAR`. Test for all three: hq-lod.test.js.

## THE METRO PACK (2026-10-04, mondo's upload)
- R2 `Assets/Metro_PSX/Models/Metro.glb` (4.2 MB, the whole PSX metro kit in ONE file; the .dae/.fbx beside it are unused) +
  `Assets/Metro_PSX/Textures/` (the same sheets, loose).
- THE SPLIT is at load time, no baked per-piece files: a catalogue row `base: 'metro', file: 'Metro.glb', node: '<node>[,<node>…]'`
  loads `<url>#<nodes>`; three-renderer.js `_loadMiscModel` fetches the file once (cached under its plain url) and `_miscPiece`
  clones the named nodes with their place in the file baked in (a composite like the car keeps its layout). Node names are
  GLTFLoader's sanitised ones (`seats.001` → `seats001`; the matcher sanitises both sides). The room warm and the disk store
  see the plain file url. Glass (glTF transmission, no sheet) becomes a faint see-through tint in `_hqPropMatPick`.
- Every piece faces −Z in the file → rows carry `turn: 180`. Rows (data.js HQ_CATALOGUE_METRO, editor group "Metro"):
  metro_bench (Chair), metro_bin, metro_vending, metro_ticket_machine, metro_gate, metro_map, metro_poster_1..8, metro_light,
  metro_column, metro_car (shell + seats + rails + doors + glass, 16.3 m), metro_car_open (minus the −X flank's middle door pair).
- Unused pieces in the file: the station shells St / St_01..03, Stairs (the lower landing), Estruc, Frame, Door_A.
- Textures: sprites.js adds `urban:MetroTiles / MetroFloor / MetroTactile / MetroWallTile / MetroWhiteTile / MetroConcrete /
  MetroRails / MetroMetal` (family MetroPSX). The `track_bed` proc wears MetroRails (one plane, the sleepers painted; the 49
  sleeper boxes are gone), `platform_edge` the tactile sheet.
- THE TRAIN way: on a FREE end (THE TUNNEL, Downtown's platform, Cyberpunk's station) one metro car (_HQ_METRO_TRAIN), sunk
  0.98 m so its floor is level with the platform, the middle door pair = the way's sliding leaves wearing the file's `Door`
  piece. A wall end keeps the Meshy front car. Streets' freight siding + the tram keep `subway_cart`.
- Dressed: `tunnel` (HQ), `site_prebuilt_downtown_subway`, the running tunnels' depot (two metro_car) + ghost station.
- Kill-switch: `window.EW_NO_METRO_PACK = true` (the old train, ballast and tactile strip; the placed rows still draw).
- FIX 1 (2026-10-04, mondo: "i dont see them in the game at all. and why not use the stairs?"):
  - CAUSE: the model queue. `_hqLeave` cleared `_mqSpots`, so the LEFT room's unstarted scene jobs (props, door leaves, NPC rigs)
    read as "no spot" (d −1) and sorted to the head of the scene lane, ahead of every spotted prop of the new room. One room
    change stacked ~70 files in front of Metro.glb (probe: 0 pieces after 100 s). `_mqDemoteQueued` (called in `_hqLeave`) now
    drops them to the background lane; a request from the new room promotes its file back (`_bgPromote`). Probe after: all filled.
  - THE STAIRS: rows `metro_stairs` (Stairs_01, the kit's straight flight: 10.4 m run, 5.7 m rise, treads only) and
    `metro_stair_rail` (Railing, the U balustrade, editor only). A passage key `model: '<catalogue key>'` (three-renderer.js
    `_hqPassageWay`) lays that flight over the box treads, stretched to w × len × |rise|·len; the treads hide once it lands.
    `lift` = a self-lit floor under the tube's sheets (an unlit tube reads black); `trim` overrides the hall arch's sheet.
  - The platform's `street` door and the streets' `metro` door are now `stairway` passages (no door): up at rise 0.55, down at
    −0.55, len 10, MetroWallTile walls, MetroConcrete arch. Moved off the platform's stair mouth: the column, the camera, the
    two rails (cut).

## THE MANHOLE, THE SAFETY SIGNS, DEAD MAN'S CAVE'S MOUTH (2026-10-05, mondo)
- The Meshy round street drain GLB is gone everywhere. Catalogue `street_drain` is now `proc: 'manhole'` (the urban pack's
  `DecalManholeCover` sheet laid flat, three-renderer.js `_hqManholeDisc`); the `gutter` way lays the same cover over its
  grate (the bars hidden). The road markings' manholes were already the sheet.
- THE SAFETY SIGNS: data.js `HQ_SAFETY_SIGNS` (sets of urban Sign* sheets + a per-room `{ set, n }`); three-renderer.js
  `_hqBuildSafetySigns` hangs them after the decals: a terrain room on its field's walls (plan walls on their open face), a
  closed box room on its shell walls; never within `doorM` of a door / passage mouth, by the spawn, or over a prop; seeded by
  the room id. Rooms: the D.U.M.B. parts, CERN, Area 51 hangar + ward, the spaceship's four parts, the sewers, the running
  tunnels, the subway, the cells, Dead Man's Cave, the Antarctic station, HQ tunnel / garage / boiler / server. Kill-switch
  `window.EW_HQ_NO_SAFETY_SIGNS`. A hand-placed sign: catalogue-free proc `safety_sign` (`p.sign` = sheet or family).
  Blank sheets (SignCaution1a, SignDanger1a, SignHazard1a) are never picked.
- DEAD MAN'S CAVE: the clearing's `deadmans` door passage is `mouth: 'culvert_mouth'` (Meshy_AI_a_culvert_mouth, the
  concrete pipe with the half grate): `_hqPassageWay` stands the pipe as the whole tube (no box tube, no rock outcrop),
  9.5 m across, its centre 2.2 m up so the grate hangs over the walker's head, grate end into the dark; lane w 2.4.

## THE WOODS' CULVERTS AT THE END OF A STREAM (2026-10-05, mondo)
- mondo: the Redwood Trail still had a block tube for its sewer entrance, and the drain mouths should sit at the end of a stream the
  way trails lead to the other areas. Both Woods mouths into DEAD MAN'S CAVE are now the `culvert_mouth` GLB with `water: true`:
  the Clearing's `deadmans` (a new stream arm off THE STREAM runs east into it; the crag path stops at the stream, the sightline
  tree moved to 18.4, 12.9 off the arm) and the Redwood Trail's `culvert` (moved to x −3, where THE CREEK meets the north wall).
- three-renderer.js `_hqPassWater`: a passage with a modelled mouth and `water: true` runs the room's stream surface on into the bore
  (the room's fluid material, the room water's height less 4 cm, as wide as the bore at that height, 0.7 m back into the room).
- data.js `hqTerrainDoorY`: a pad in a wadeable water stream has its sill at the wader's feet (surface − wade), not the bed, so the
  pipe's floor meets the walker. Also nudged: Downtown streets' docks gutter (−0.9 → −0.55), the sewers' Strip link (−0.9 → −0.85).

## THE STAIRS PACK (2026-10-05, thread "stairs, railings and verticality")
mondo: "implement these stairs and railings into the game more ... No procedural stairs, only use from these stairs and the metro
stairs ... figure out their dimensions and how to make them work and fit in the game ... Make sure all stairs are walkable and
railings are grindable. I should be able to grind down stairs too, especially ones with railing like the escalator."
- Files (R2): `Assets/stairs/stairs_railings.glb` (31 MB sample sheet, feet, untextured greys + a blue BLEND glass; every family laid
  out on one floor, labels are geometry too), `Assets/stairs/stairs.glb` (one textured steel-grating flight with handrails, metres),
  the metro kit's `Stairs_01` node (Metro.glb). Catalogue: data.js `HQ_STAIR_PACK` (each piece = a box in its file + measured
  risers `n`/`r`/`g`/`face`, railings `b`/`P`/`t`/`top`), `HQ_STAIR_KINDS` (a kind = flight + railing + tread/side sheets),
  `HQ_STAIR_RULES` (riser 0.18 m, rail defaults `balusters_b` / low `pipe`).
- Fitting (three-renderer.js `_sp*`, before `_hqSlopePrismGeo`): a piece is cut out once into a triangle soup (`_spSoup`, by box
  centroid; a mesh outside the box is skipped by its bounds), then SLICE-REPEAT: flights cut at mid-tread into foot / one middle
  step / head, the middle repeated to round(rise / 0.18) risers, the pitch line scaled to rise × run (points within a riser of it
  scale, handrails and stringer depth keep their own offset), outer `band` keeps its thickness across; railings cut at posts, bays
  repeated, sheared down slopes (posts plumb) or bent round arcs; the escalator cut inside its incline (`cut`), one step repeated.
  The walker's smooth slope passes through every riser's middle. One merged mesh per (piece, role) per room.
- Walkable: the field keeps the smooth slope (the walker); every non-float stair ramp is now in `info.builts`, its field cut away,
  its wedge drawn sunk half a riser under the slope as the flight's mass, the pack flight over it.
- Grindable: compile pushes `info.railings` (drawn) + a grind per run (sloped y0→y1, arcs with centre cx/cz, chained prev/next) +
  ghost walls (blockT 0.12) unless `block:false` (model-less rows stay grind-only). Flights wear their kind's railing both sides
  (`rails: false|'l'|'r'`), the grating its own handrails (grinds only), escalators a 3-piece handrail grind each side. The grind
  pulls the rider down a slope (`_hqTickRideStep`, 0.55 g × slope); labels HANDRAIL GRIND / ESCALATOR GRIND.
- Mall escalators: the pack's (30°, 2 m wide; rows shortened to run = rise / tan 30°). Meshy escalator + fallback steps deleted.
- Editor: STAIRS tools take a `Stairs (the pack)` kind (`model` on the row); ADD list Railing / Curved railing with a `model`.
- Kill-switch: `window.EW_NO_STAIRS_PACK` (wedges only, no railings drawn). Perf: ornate railings are heavy (two_rail 2.7k tris/m,
  post_rail 3.4k/m); defaults use light ones (balusters_b 0.18k/m, bars_curb 0.37k/m, glass 0.09k/m, ranch 0.06k/m).
- Rooms redone with stairs/levels: running list in docs/notes/areas-complexes.md "STAIRS PASS".

## THE REAL COLLISION (2026-10-06, thread "mesh collision")
mondo: "when i add a building in the editor, it raises the terrain underneath it and places the building on top ... The collisions
seem to work fine for the cardboard boxes and traffic cones, so why can you not do the same for buildings? Or stairs? ... i fall
right off [stairs / bridges] if i am not walking completely straight down the center ... Why do some of the buildings in downtown
not have roofs?"
- MESH COLLIDERS (three-renderer.js `HQ_MC`, `_mcFor` / `_mcBuild` / `_mcFeet` / `_mcSolid` / `_mcTopUnder`): every placed floor
  prop that blocked (catalogue `foot`/`rect`) and every other standing model ≥ 0.8 m across and 0.3 m tall gets a collider from its
  own triangles once its GLB (or proc) is in: 0.25 m columns over its footprint, each the solid spans [y0, y1] its geometry fills
  (sampled every 0.15 m, gaps under 0.3 m merged). Walker: the highest span top within a step (0.62) whose column leaves 1.75 m
  headroom is the floor; a span in the body disc above max(feet, the feet before the move) + step and under the head is a wall
  (so you walk off an edge from up top, and are stopped by a facade from below). Jumps land on span tops (`_hqBlockerFloor`), the
  airborne body never enters a span, line of sight passes arches. Built off a queue 5 ms per 16 ms tick, cached per model + fit
  (copies share it), the catalogue footprint standing in until it lands; the NPC lattice re-reads the cells under it.
  Never: wall / ceiling / flipped / kickable / tabletop props, laid rugs, skate ramps and rails, vehicles, the compiler's scatter.
  Opt-out per row or catalogue entry: `mesh: false`. Kill-switch: `window.EW_HQ_NO_MESH_COLLISION`. `EW_HQ_DEBUG` logs each build.
- THE EXACT SURFACES (data.js `_hqTExactList` / `_hqTExactTop`, `info.exact`): the 0.5 m field blended a ramp's last 0.35 m each side
  inside its own width, so a 3 m flight walked as ~1.7 m. Every pack stair flight, every field `deck` and every `bld` plateau is read
  exactly now (hqTerrainHeight / hqTerrainSlope), edge to edge of what is drawn.
- TEXTURED BUILDINGS: the editor's BUILDING (`texbuilding`) was a PLATEAU the building's height plus ghost walls, and the renderer
  stood the building on the field under its middle — the plateau's top — while the roof quads faced DOWN (culled from above). Now:
  ghost walls + a hidden roof bridge slab (`hide: true`), the field untouched, the building on the lowest ground under it (rows
  without `y`: `texbOf`, lifted in hqTerrainCompile; `hqTexBuildingGround`). Roof and parapet tops wound to face up — this was the
  downtown buildings without roofs (every textured lot in every city).
- BUILDING TIERS: a `plateau` wearing `bld: { style }` is drawn as a flat-roofed textured building at its own height (`h`, cells
  stretched; no parapet), its field rise starting `HQ_BLD_INSET` (0.6 m) inside the walls, the walk on its exact box. Converted:
  Cyberpunk's seven STACKS + the billboard roof, Downtown's rooftop / east yards / warehouse roofs, the Strip's marquee, motel,
  centre, laundry roofs. Decks with car ramps (parking deck, valet deck, skyway) and fire-escape landings stay field tiers.

## THE JOINED FLIGHTS (2026-10-06, mondo: "almost every stairs or ramp in the game has gaps on the sides / not connected at the edges. exploration and battle maps")
- Cause: three-renderer.js `_hqBuildTerrain` cut the field away round every stair flight (the floating steps' rule: cell centres
  within w/2 + 0.8 m, from half a cell before the foot) and round every escalator, but the wedge under a flight is only its own width
  (0.96 w when the pack draws it). So every flight had a ~1 m hole down to nothing along both sides, in every room and every battle room
  drawn round a board.
- Fix: nothing is cut for flights or escalators any more (floats and the void still are). data.js hqTerrainCompile writes
  `info.drawH` (node → drawn height) for every node under a flight: the lower of H, the wedge's sunk top less a margin, and the ground
  the flight stands on (the field with every flight and escalator skipped — `skipFlights` in hBefore — at the node or just outside the
  flight's nearer side, whichever is higher). `info.drawXZ` moves nodes within 0.75 of a cell of a side onto that side (2 cm in), so a
  tier's face meets the flight at its edge. The walker still reads H / info.exact. `info.flightLo` (lowest ground under a flight) takes
  the wedge and cheeks down to it (≤ 4 m under its low end), so no slit opens under a flank where the floor dips.

## THE CHRISTMAS PACK (2026-10-24, mondo's upload)
R2 `Assets/christmas/models/` + `textures/` (55 sheets, mostly 256 px). `Christmas.dae` and `Christmas.fbx` are the same kit (62
nodes, Z-up, metres); the game reads the `.dae` with three's ColladaLoader (index.html importmap → `THREE.ColladaLoader`).
`Roads.*` (snowy road tiles) and the rigged `SantaClaus.fbx` / `SantaClaus_B.fbx` are unused (the Santa rigs are mondo's call).
- Load: three-renderer.js `_asDae` (texture paths in the file are absolute `C:/Users/...`: a LoadingManager maps every image to
  `textures/<basename>`), `_xmasPackMats` (linear maps, alphaTest 0.5, cards double-sided). Pieces are cut at load like the metro
  pack: catalogue `base: 'xmas', node: '<names>'` → URL `Christmas.dae#node,node`. Kill-switch `window.EW_NO_XMAS_PACK`.
- Catalogue: data.js `HQ_CATALOGUE_XMAS` (tree, snowmen, gifts, wreaths, stockings, garlands, food, cocoa, punch, flan, champagne,
  foil tray, house/Santa palette-only). Editor palette group "Christmas". Trees: HQ_TREE_KINDS `xmas_pine*` / `xmas_snow_pine*`
  (`'xmas:<node>'` foliage keys).
- Placed: North Pole village forest + groves (the pack's snowy pines), plaza tree + gifts, the hearth (wreath, bell garland,
  stockings, cocoa + gingerbread on the mantel, mallets), snowmen, gift stack, bay-hall wreaths; cafeteria counter/table food
  (dropped in after_hours) + after-hours champagne. Wall-flagged rows add `mount` on top of y, so placed wall rows use `mount: 0`.
- Spells: three-vfx-effects.js `_xmasPiece` → `ThreeRenderer.xmasClone` (unlit copy, scaled by height or `fit: 'span'`, null while
  the file streams; `_spellLibWarm` warms `_XMAS_SPELL_NODES`). Blizzard Present + The Naughty List finisher use the pack's red
  gift (procedural box stays as the stream fallback); Milk and Cookies (`_stageSupportBurst`) sets the cookies + cocoa (no tray: mondo dropped it 10-24)
  down beside the caster. Lump of Coal untouched (rule: just Santa throwing coal).

## THE FOUR NEW LOOKS (2026-10-25)
mondo's new Meshy models + 2D sprites replace four existing looks (no rule, stat or spell change):
- Shadow Entity (male) → `Races/shadowentity/male/Meshy_AI_shadowperson_Walking.glb` + `shadowperson.png`
  (the female keeps `Races/shadowentity/female/shadowentity_female.png`; she has no 3D model).
- Tree Person → `Races/treeperson/Meshy_AI_treeperson_Running.glb` + `Races/treeperson/treeperson.png`.
- Female Marksman (sniper) → `Races/Homosapien/Female/sniper/Meshy_AI_sniper_female_Running.glb` + `sniper_female.png`.
- Female Men in Black → the Spy (labelFemale 'Intel Spy' → 'Spy', a James Bond spy): `Races/spy/Meshy_AI_spy_female_Running.glb`
  + `Races/spy/spy_female.png`. She moved from per-character `_mk3d` clips to the shared library (`_mkUAL`), whose castRanged is the
  same trimmed quick-draw.
Sprites: `_CHARACTER_SPRITES` / `_CHARACTER_SPRITES_GENDERED` + `RACE_SPRITES` (sprites.js). The 128px face portraits
(`character_portraits/female/glowie.png`, `.../sniper.png`) were left as they are.

## THE SERAPHIM RINGS (2026-10-26)
mondo's ring-of-eyes model (`Races/seraphim/Meshy_AI_a_circular_ring_of_ey_1026083741_texture.glb`, boneless, 1 mesh,
upright ring 1 across, hole radius 0.296) is the Seraphim's 3D body: "two of them rotate around each other like a
biblically accurate angel", rings separating on attacks, the single eyeball as an option. No stat / spell / rule change.
- New hook: a RACE_MODELS_3D def's `procRig` names a builder in three-renderer.js `_PROC_RIGS` ("THE PROCEDURAL RIGS").
  `_loadUnitGLB` runs it ONCE on the cached root and stores its keyframe clips as `procClips`; the board wires them as
  ordinary slots (idle / walk / cast / castMagic / castRanged / castMelee / castAOE / castUltimate / castSupport /
  castHeal / hit / death), so every cast chain, hit flinch and death runs through the usual mixer machinery. The party
  builder dock and the character viewer play them too.
- `seraphRings`: ring B = the same mesh at 0.54 nested in A's hole on a gimbal (turns with A, tumbles on A's cross axis),
  hovering 0.14 above the floor. Idle 8 s loop, walk 2 s loop. Attacks/magic/ranged: B flies out through the hole toward
  the target while A wheels in its own plane. AOE/ultimate/support/heal: B leaves through the hole and rises to a flat
  spinning halo over the crown. Melee kinds: the whole wheel somersaults forward. Death: the wheels lie down level and drop.
  Moves out of A's plane go through the hole with A face-on, so the wheels never clip.
- The core eye is `ThreeRenderer.astralEye` (the sky's eyeball OBJ, no lids) in the `ewSerEye` group, scaled to nothing
  except during attacks/spells/death; while open it turns to look at the board camera (`_procRigEyeTrack`; from behind
  the OBJ is a black back). It wears its own 512 px copy of Eye_D per drawing surface (`_procEyeTex`: board / dock /
  viewer, via astralEye's new `tex` option): with the shared `_miscTex` sheet the eye drew solid black on the board once
  the party builder had drawn it too. It is added after the x-ray/outline twins, so it has none.
- Both genders wear the rings: the 3D-only roster rule (`getAvailableGendersForRace`) drops a gender with no model.

## THE ANIMALS (2026-10-27, mondo: "Also added these animals, use them where appropriate, try to maximize their use. Lion for ringmaster, etc")
R2 `Assets/animals/`: Cow, PSX_lion, Wolf1 (KTX2 sheets), butterfly, cat, chichen, crow, dog, girafe, ladybug, rabbit (`bats/` is the
vampire thread's). three-renderer.js THE ANIMALS block (`_ANIMALS` table, after `_xmasUrl`): each file's facing (`yaw`, `rx` for the
ladybug, authored upright), its clip slot map, and for files with no clips a small procedural motion (`proc`: cat breathe, chicken peck,
ladybug crawl, butterfly flutter); the crow's wings (bones wing_l/wing_r) are spread + flapped by `flap(on)`. Loads go through the rig
cache (`_loadUnitGLB`), so clips are kept; `_animalBuild(key, size, {fit})` returns `{group, ctl}` (`ctl.play(slot, {once, then})`).
Exports `ThreeRenderer.animalClone / animalReady / warmAnimals`. Kill-switch `window.EW_NO_ANIMALS = true`.
- crow + rabbit live in `Assets/animals/crow_and_rabbit/` beside their `atlas.png` (mondo moved them there 10-27; the old
  `Assets/animals/crow.glb` / `rabbit.glb` are 404). The files still name `../textures/atlas.png`, so `_ANIMALS[k].atlas` puts the
  sheet on them in `_animalMat` (nearest filter, like the file's sampler); `bare` is the colour only if that sheet fails.
- Follow-up (10-27, after the on-screen check): Crack the Whip is a bolt spell, which never fires the `impact` intent, so its
  geometry rides the staging `burst` beat (`_GEOM_ON_BURST` in three-vfx-effects.js; relayed like every fire()). A summon's bite
  bumps `turret._bites` (battle.js, looks only; rides the snapshot) so the drawn animal plays its attack clip even when it needn't
  turn. The dog's own `attack1` clip rears up and rolls over, so the dog's bite is its `jump` pounce. Crow Storm's crows are
  0.42 tile long and wheel at 0.5-1.3 tiles (smaller ones over the camera were unreadable). Editor thumbnails: propPreview's
  onDone could land inside the call for a cached file, before `inst` was set (every model already placed in the open room
  showed the plain glyph); it now calls back on the next tick.
- Summons (`_SUMMON_ANIMALS`): hound = dog, wolf (Wolf Pack + Spirit Animal) = wolf (dog if the wolf fails), hawk = crow (flying).
  Run clip across a move, turn + attack clip when facingAngle changes, hit clip when hurt. Drone / blob keep the box dog (the
  elephant is mondo's elephant since 10-27, below).
- Spells (three-vfx-effects.js `_animal`): Crack the Whip = the lion bounds in beside the ringmaster (`_spell3DGeometry.raceCrackTheWhip`);
  Crow Storm / Scare Off add real crows (`_fx3Crows`); A Murder + Grave Robbery crows use crow.glb (the bead crow is the fallback).
- Catalogue: `HQ_CATALOGUE_ANIMALS` (data.js, all `mesh: false`; cow/lion/giraffe block with a rect), palette group "Animals".
- Decor (outside every arena window): THE ESTATE corn fields (cows, hens, dog, crows), Fairy Forest clearing (rabbits, crows, a wolf),
  the glade (butterflies, ladybugs on the stumps, rabbits), the carnival (lion, giraffe), the garden (butterflies, cat), the
  Looking-Glass (rabbit by the tea table, cat). The placer group is `_ew_noInstance` (no batch takes a moving body).
## THE ELEPHANT (2026-10-27, mondo: "now i added an elephant for the ringmaster and whatever else")
R2 `Assets/animals/elephant/elephant-3d.fbx` + `elephant-3d.png` (2048², the FBX's RelativeFilename, so FBXLoader fetches it beside
the file). Rigged (42 bones, one 57k-vertex skinned mesh), head at +Z, clips `Amature|IDLE` / `WALK` / `RUN` (+ three 0.03 s
junk clips). No strike clip.
- Loading: `_loadUnitGLB` hands an `.fbx` url to `_asFbxRig` (= `_asFbx` with `raw: true`: no ocean bake, the file as it is, its
  lights/cameras out) in a GLTF's shape, so the rig cache, `_animalBuild` and the misc loader's animal branch take it unchanged.
  `clipFor` also matches a clip by the name after its `|`. The summon needs the FBXLoader (else the box dog).
- `_ANIMALS.elephant` (`rear: true`): its `attack` slot is procedural: it rears up on its hind feet (pivot at the heels, ~29°),
  holds, and stamps down over 1.1 s (`ctl.rearT`, in the body group), over whatever clip plays.
- Users: the Ringmaster's Elephant summon (`_SUMMON_ANIMALS.elephant`, 1.35 tiles long: the RUN clip across its walk, the rear
  on each strike, both from the turret state, so host and guest draw the same); the catalogue row `elephant` (h 2.7 m, blocks,
  group Animals); the carnival (x −4, z −6.2, face 90, by the high striker). Proof sheet: /mnt/project-files/elephant-proof/.
## THE BATS (2026-10-27)
mondo uploaded three bats to R2 `Assets/animals/bats/`: `bat_black` / `bat_brown` / `bat_grey` `.obj` + `.mtl` + sheets
("use them for the vampire and vampire spells (replace the sprite bats and make custom animations ... unless these files
already have animations too, then use both)"). The files carry NO animation (OBJ has no rig or clips), so the motion is ours.
- The kit (three-renderer.js "THE BATS", `_batKitLoad` / `_batKitBuild`): each OBJ is one 181-face mesh, wings spread
  along X, head +Y, face +Z. The `.mtl` names materials but has no `map_Kd`: the sheet is `<material>_texture.png`
  (`batbrownbody` → `batbrown_texture.png`). The three bats' 11 sheets are packed into one 1024² canvas atlas (a row per
  bat, a 256 px cell per material) so a bat is one mesh with one Lambert material (linear, like the prop sheets).
- The flap is BAKED: `BAT_FLAP_FRAMES` (8) poses per bat, wings hinged at the shoulder and again at the wrist (tips lag),
  turned to flight posture (head +Z, back up, 1-unit wingspan). A flock picks a pose per bat per frame from its flap phase
  (CPU only, so WebGL and WebGPU draw it alike). `_batFlock(n, o)` / `ThreeRenderer.batFlock`: `set(i, x, y, z, yaw,
  pitch, roll, size, phase)` then `flush()`; `o.inst` = one InstancedMesh per bat+pose (big flocks), else a mesh per bat.
- Users: the vampire's bat form (`_buildBatSwarmGroup`: 8 bats on the old sprite orbits, heading along the circle,
  banked; one shared material so hit flash / spent grey / self-glow cover all; the swarm is empty while the kit streams
  and the units rebuild when it lands), the spells (spells-vfx.md "THE BATS"), the editor rows `bat_black` / `bat_brown`
  / `bat_grey` (`proc: 'bat_<kind>'`, data.js `HQ_CATALOGUE_BATS`, palette group Nature, the file's own pose, 0.45 m
  span). A failed kit keeps the sprite bats everywhere. Kill-switch `window.EW_NO_3D_BATS`.
## THE EAGLE (2026-10-27)
mondo uploaded R2 `Assets/animals/eagle.fbx` (33 MB) and `eagle.glb` (49 MB): "Use eagle for the hawk and whatever else makes sense
and add some eagle animations to the president's spells like patriotic and stuff". BOTH files are the same ZIP export (Meshy-style:
base.obj, base.fbx, base_basic_pbr/shaded .fbx, the .glb one also has base_basic_pbr.glb + base_basic_shaded.glb, 2048² PBR sheets),
so no loader reads either. The model: a bald eagle, wings raised in a V (flight pose), head +Z, 30.8k triangles, NO rig, NO clips.
- `eagle_rigged.glb` (upload to R2 `Assets/animals/`): base_basic_pbr.glb baked by `bake-eagle.mjs` (project files
  `animals-eagle/`, @gltf-transform + meshoptimizer): simplified to 9.2k triangles, colour sheet only (1024² JPEG), a 7-bone rig
  (body, shoulder/wrist L+R, tail, head; weights by distance along the wing from the shoulder) and five clips: `glide` (idle),
  `flap` (fly), `strike` (rear back, wings flared, talons forward, one beat), `dive` (wings swept back, nose down), `hit`. ~0.5 MB.
- `_ANIMALS.eagle` (three-renderer.js): clips idle=glide, fly=flap, attack=strike, dive, hit. `ctl.flap(on)` plays a file's own
  `fly` clip when it has one (the crow keeps its bone beat); a one-shot on a flyer ends back on `fly`.
- Hawk summon (`_SUMMON_ANIMALS.hawk`): the eagle (len 0.7 tiles, hovering 0.85 tiles), `alt: 'crow'` while the file is missing.
- Spells (three-vfx-effects.js THE EAGLE, `_eagleStage` on the relayed `_fireStage` beats): Rally Command + Iron Bulwark (politician
  caster only) = it comes in from camera-left, screams (strike flare) over the president on the shout, glides round the allies,
  leaves right; Executive Order (politician only) = in over the caster, stoops on the 3×3, flares talons-first, climbs out;
  Eagle Eye (eagleman) = circles low (1.1 tiles up, 0.85 round) over the marked enemy inside the close-up, looks down, leaves; The Motion Carries finisher = circles the chamber.
  `_eagleFlight(F, from, legs)` = a Catmull-Rom path, each leg its own ms + clip, heading along the path, banking into turns.
- Editor: `HQ_CATALOGUE_ANIMALS.eagle` (2 m span, `hover: 6`, `swim: { r: 5, v: 4 }`): an animal row's `swim` now circles it
  (`_oceanSwimRing`), so the eagle soars over its spot gliding.
## THE BUNNY GIRL SPRITE (2026-10-27)
mondo uploaded `Races/bunnygirl/bunnygirl.png` (64×128): "please wire it up and zoom in on her face for the portrait".
- sprites.js `_CHARACTER_SPRITES_GENDERED['bunny girl'].female` + `RACE_SPRITES['bunny girl']` point at it (both were
  catgirl's borrowed sheet). Her board body stays the GLB.
- No portrait art, so her portrait is the UI Maker face cut from the sprite (hud.js EWFaces). The auto aim lands on her
  ears, so hud.js `FACE_AIMS` (new, keyed by the path under Sprites/) ships her aim { x 0.492, y 0.289, s 0.203 }: it
  stands in as that sprite's auto aim (a viewer's own aim still beats it; Auto aim goes back to it). Add a row there
  for any other sprite the auto aim misses.

## THE OCEAN PACK (2026-10-27, mondo's Assets/oceanic upload)
mondo: "uploaded these models to r2 bucket /Assets/oceanic. Maximize their use in the oceanic areas and maps like the deep,
atlantis, bermuda triangle, pirate ship, etc. Utilize the shark with sharkman spells and different fish with atlantean spells,
etc. Make them usable in the map editor."
- 48 FBX files (flat colours, no textures). index.html imports three/addons FBXLoader. three-renderer.js `_asFbx` parses
  through the asset store, `_oceanBake` poses the rig a quarter into its clip and bakes a STATIC copy (static batch,
  instancing, `root.clone(true)` all keep working) and keeps the rig as `root._ewRig = {src, clips}` for the movers.
  `_oceanClipPick` skips the re-exported "Armature.001|…" duplicates (they drag the fish ~755 units off its spot).
- Catalogue: data.js `HQ_CATALOGUE_OCEAN`, 49 rows (`base: 'ocean'`, Seal twice: swimming + resting), palette group
  "Ocean". `turn: 180` on the files whose nose is at −Z (Whale, Hammerhead, StingRay, Turtle, Seal, Penguin, Lobster,
  ClownFish, Dory, Tuna, Eel guessed). Row keys: `hover` (metres above the floor), `anim` (clip name, '*' = all,
  false = still), `swim {r, v, bob, dir}` (circles r squares at v squares/s). A prop row can override any of them.
- Rigs per room visit are capped (`_OCEAN_RIG_MAX` 36), none under EW_PERF_LOW or `window.EW_OCEAN_STILL`; past the cap a
  creature is the baked still copy. Kill-switch for the whole pack: `window.EW_NO_OCEAN_PACK = true`.
- Rooms dressed: Atlantis abyss (The Deep), Atlantis temple (oracle pool), Bermuda sea + island (all off the 12×12),
  Downtown harbour slipway, the pirate ship deck (sharks + dolphins in the sea). The fish_school proc now draws real fish
  (one species per school, instanced), the abyss whale landmark is the Whale2 file. Not dressed: Antarctica, the Looking
  Glass sea. None of the props block inside arena windows, so no arena re-bake.
- Spells: see spells-vfx.md "THE OCEAN PACK". MISSING_MODELS.md: no entry is a sea creature, nothing marked.
- THE ON-SCREEN CHECK (2026-10-27, follow-up PR; shots in /mnt/project-files/ocean-proof/). The outdoor sea and the temple
  pool are OPAQUE, so anything under the surface is invisible: a swimmer authored under water (`y <= -0.5` + swim) now
  swims at that height in a terrain room (`placeOne`, `pcy` branch) and the sea life got `hover` so backs and fins break
  the surface. Bermuda's reef coral/weed rows (poles through the water) and the reef/lagoon fish (never visible) were
  REMOVED; crabs/starfish/conches/sand dollars moved onto dry sand. Eel nose is +Z (no turn; tail-swing measured),
  BrownFish needed `turn: 180`. Flat-colour files get a 0.3 self-lift (`_hqPropMatPick`) or they read black in The Deep.
  Rig budget 44 (64 since the underwater pass) with weed capped at 8 of it (`_oceanRigTake`), or the abyss weed took every rig and the eels stood still.
  fish_school (catalogue `surf`): a SEA scatter's school (`sea: true`, carried through the scatter compile) is placed on the
  sea surface and skims it (0.03-0.13 m + a 0.07 bob) — it floated 0.8-2.4 m over the harbour. Non-sea schools unchanged.
  The Bermuda reef/lagoon rows removed above were all added by PR #577 itself (none existed before).
- UNDER THE SURFACE (2026-10-27, mondo: "what about actually in the water like swimming underwater to atlantis? and atlantis?"):
  the route is Bermuda open sea → swim (or skiff) into THE MAELSTROM at (22,-28) → the abyss upwelling (40,-30) → the drowned
  road → the temple vault door (also the Dutchman hold hatch → the abyss wreck). No new mechanic. The Bermuda sea floor a diver
  crosses (jetty end → the hole) got `sea: true` scatters of ocean coral/weed/anemones/foot-0 rocks/shells and swimmers at an
  exact depth (`y` ≤ −0.5, `hover: 0`): sharks round the hole, manta, turtles, tuna, reef fish, an eel/squid/octopus/lobster in
  the hole, three schools (`y` the floor's: a non-sea school swims 0.8-2.4 m over it). The abyss got anemones, two weed stands by
  the steps' stair, weed, shells and a shark/manta/hammerhead/turtles/tuna/reef fish/five schools along the upwelling → road →
  spawn → steps. Rig budget 44 → 64; a rig farther than `_OCEAN_RIG_FAR` (45 m) from the camera skips its mixer.
  BUG FIXED: `_hqTickSwim` read an undeclared `LW` on every SURFACE-swim frame (since the file's first history) — the frame threw,
  the swimmer froze on screen and never reached the maelstrom; diving (C) skipped the read. Now `LW = !sea.under`.
  BUG FIXED: SeaWeed.fbx carries a 1000-intensity point light; the RIGGED clone (SkeletonUtils of the raw file) kept it, so the
  swaying weed lit the abyss floor white (and stole the room's light cap). `_oceanBake` now strips lights/cameras from the rig.
- THE JELLYFISH + THE ANGLERFISH (2026-10-27, mondo's second Assets/oceanic upload: "added these jellyfish, use them for the
  jellyfish spells and add them underwater and the angler fish too"): seven GLBs (Jellyfish_Moon_Jelly / _Box_Jelly / _Bioluminescent
  / _Pulsing_Frames, Anglerfish_Lure_Lit / _Lure_Dim / _Jaws_Open), ~0.3-0.5 units, no sheets, see-through BLEND bells and emissive
  lures / halos (KHR_materials_emissive_strength); only Pulsing_Frames has a clip (a scale pulse on its bell node, 0.375 s).
  three-renderer.js `_isOceanGlb` / `_oceanGlbPrep` (in `_loadMiscModel`'s onLoad): every material flagged `_ewFlat` + `_ewGlb`,
  `_ewGlow` = emissive × strength (capped 2.5); a file with clips gets `_ewRig = { src: the GLB root, clips }` (the GLB is its own
  static copy). `_hqPropMatPick` keeps the glow as the Lambert's emissive and turns depthWrite off on a see-through bell;
  `_oceanClone` keeps the file's alpha (`mat.userData._ewOp`, multiplied in the spells' `_oceanFade`) and glow. `_oceanUrl` takes a
  name ending `.glb` as is. The ocean pack kill-switch (EW_NO_OCEAN_PACK) covers them.
  Catalogue rows (Ocean group, 56 now): ocean_moon_jelly, ocean_moon_jelly_pulsing (anim 'PulseAction'), ocean_box_jelly,
  ocean_bioluminescent_jelly (all drift a 0.8-0.9 m circle at 0.12-0.15 m/s and bob), ocean_anglerfish (Lure_Lit, swims),
  ocean_anglerfish_dim (swims), ocean_anglerfish_jaws (still). Anglerfish nose is +X in the files: `turn: -90`.
  Placed: Bermuda sea (the swim down from the jetty end to THE HOLE: 9 jellies under the surface, 4 more over the hole, lit + dim
  anglerfish down in the hole) and the Atlantis abyss (8 jellies up THE UPWELLING, 11 along the road / steps / station / kelp,
  anglerfish in THE TRENCH (lit, dim ×2, jaws), by the wreck (lit, jaws), along the road (lit, dim)). Not in the temple: its air
  pocket is dry and the oracle pool is opaque. Shots: /mnt/project-files/jelly-angler-proof/. Spell uses: spells-vfx.md
  "THE JELLYFISH MODELS".

## THE HORSES (2026-10-27, mondo: "Added some horses too, use them for some of the cowboy and knight spells and whatever else makes sense")
R2 `Assets/animals/horses/Horse_glb.glb` (29-joint rig; clips Idle, Idle_2, Pose, Trot, Gallop; nose at +Z) + `textures/`
(White/Brown/Black_Horse_Tex.png, Brown/Black_Mane_Tex.png, saddle_tex.png). Looks only, no rule changed.
- `_ANIMALS` rows `horse` (white, the file's own sheets), `horse_brown`, `horse_black`: one file, the coat = `skin` + `tex`
  (material name → sheet: White_Horse, Mane). `_animalMat` caches per material + coat; `_animalSkinSrc` hands a room's matPick a
  copy of the source material wearing the coat (the pick reads the SOURCE sheet, so without it every room horse was white).
  `_hqModelUrl` puts the coat on the url as `#<skin>`; `_animalKeyOfUrl` reads it back. The three keys share ONE root, so
  `_miscModelInstance` takes the key from its own url, never `root._ew_animalKey` (last writer wins). Editor thumbnails key the
  coat (`thumbStoreKey`) and wait for the coat sheets (`_animalSkinReady`).
- THE MOUNT (three-renderer.js "THE HORSES — A UNIT IN THE SADDLE", before `_updateUnitModels`): `_updateUnitMount` puts a horse
  under a unit while `unit._mounted` names a status the unit still has (Saddle Up: battle.js sets it on the buff when the spell row
  has `mount: true`, clearStatus drops it; units ride the snapshot, so the guest sees it) or while a riding cast's window is open
  (`ThreeRenderer.mountUnit(uid, {key, ms})`, called by three-vfx-effects.js `_rideWindup` on the relayed windup beat; the window
  stretches while the unit's walk / dash / strike tweens run). The horse gallops in, the rider plays hqSit in the saddle, the wrap
  is lifted by `_ew_baseY`, the name plate by `_mountLift`; it gallops off ahead when the window ends. Coat: knights / King Arthur /
  valkyrie white, cowboy / sheriff brown, anyone else hashed from the id (`_mountKeyFor`).
- Riding casts (`_RIDE_CASTS`): guardSlash (Brave Charge), raceRideBy, raceLance, raceSaddleUp, pzRideToValhalla; cowboys only:
  raceLasso, raceRustle, raceRoundUp. Finishers: the Joust's box horse is the real white horse at a gallop once it lands (box
  pieces hidden; the box stays while the file streams); Ride to Valhalla's winged horse is the real horse with the plane wings.
- Decor: Camelot ward 3 horses by the tilt yard (outside every arena window), Skinwalker fields 3 horses west of the arena union
  (x < -17.5). `_warmSummonModels` warms the horse with the dog/wolf/crow/lion (~0.5 MB more on a battle load).

- THE STRADDLE (10-27, mondo: "is there not a sitting or straddling animation that can be used for when a unit sits on the
  horses?"): no library has one (UAL1/UAL2/MAL1-3 checked: only the chair Sitting_* clips and Driving_Loop). `_mountStraddle`
  turns the chair sit astride after the mixer: each thigh tips down (`_STRADDLE.pitch`) and out round the barrel (`spread`), the
  shin keeps its bend (`shin`), axes from the hips (any rig: LeftUpLeg / thigh_l names), weighted by the sit's crossfade. The
  clip's pose is put back before the next mixer step (`_straddleUndo`). Kill-switch `window.EW_NO_STRADDLE = true`.

## THE MODELS CHECK (2026-10-27, mondo: "there is already a UFO model ... a bomb model ... What other models do I need now?")
Spells moved onto models the game already has (looks only, no rule changed):
- **Probe** already flew the Triangle UFO GLB (`_sigBuildUFO` → `_WPN_MODELS.ufo`, warmed by the spell library); the
  custom-animation doc's "hand-built saucer" line was wrong. Nothing changed.
- **Deneuralizer** (`_FX2_BURST.raceDeneuralizer`): the agent holds up the HQ desk pen (catalogue `pen`, the Neuralyzer
  finisher's pen) pointed at the victim's face; the white flash goes off at its tip. No pen while the file streams.
- **Throne of Ashes** (`_afThrone3D`): Camelot's great-hall `royal_throne` (registered through `_crCatKey('royal_throne','y')`
  so `warmSpellLibrary` loads it) rises out of the floor 0.8 tile behind the prince on the far side from the lens, seat to
  the lens, 1.6 tiles tall (shorter hid behind the demon's wings), tinted scorched; the hellfire ring is unchanged.
- **Shambling Horde** (`_shamblingHordeRunners`): six of the zombie race's own rigged model sprint across the area on its
  baked `run` slot, the front row crossing the centre on the trample beat. New renderer export
  `ThreeRenderer.raceActor(race, height, o)` = a skinned clone of a race's loaded unit GLB playing a library slot
  ({ group, mats, tick(dt), fade(f) }, null until the file + bake are in).
- Not in the game anywhere (checked code, catalogue, Christmas/metro packs): a knife or dagger (only the flat
  `proj_knife.png` sprite), a bomb FILE (Plant Bomb's bomb is the hand-built `_makeBombProp`; the jets' `missile` GLB is the
  only bomb-like file), a sack, rope, microphone, trumpet, piano.
## THE SPEAR (2026-10-27, mondo: "added a spear, utilize it where it is needed for spells and such")
R2 `Assets/weapons/spear/Spear.fbx` (5.7 MB; one mesh, 34k verts, its sheets packed IN the file: Image_0 diffuse, Image_2
normal) + `Spear.png` (the same diffuse atlas, 2048², not read: the packed copy is). 2 m long, the TIP UP (+Y) in the file, the
blade flat on X. Looks only, no rule changed.
- Loading: ONE cache entry under its url (three-renderer.js `_SPEAR_URL`). `_oneFileGltf` (assetGltf, the spell props) now reads
  an FBX through `_asFbx` in a GLTF's shape; `_oceanMat` keeps a source sheet (`map`) when the file has one (the ocean pack has
  none, so nothing changes there); the misc loader's FBX branch needs only FBXLoader outside Assets/oceanic (EW_NO_OCEAN_PACK stays
  the ocean's own switch). `_hqModelUrl` keeps a `base: 'weapons'` row's sub folder ('spear/Spear.fbx').
- Spells (three-vfx-effects.js `_WPN_MODELS.spear`, `_spearBody(len)`: tip on +Z, middle at the origin, every mesh `userData.op`
  so the kits' fades reach it; null while it streams = the old build):
  - Valkyrie Spear: the spear drops out of the sky point first and plants through the target in `_VS_DROP` (220 ms; the fn's
    `hitMs`, so the number lands on the plant), the FX-1 seal (light shaft, circle, sparks) goes off on the plant.
  - Atlatl (`_goSpear`): the thrown and the planted spear.
  - The Joust: the lance is the spear stretched along its line to the board's length (the vamplate cone kept).
  - Valhalla finisher: the Valkyrie's spear on the horse.
  - The divine holy spears (`_sigSpearPrison3D(..., { model: true })` in the divine P recipe): `_sigBuildSpear` builds the model,
    tip down at the origin, the glint cone kept. Shadow Bind / Knights of Round / the old Ice Spear prison keep their spectral
    builds (shadow, golden blades, ice).
  - Lance + Ride to Valhalla: `_RIDE_CASTS` rows carry `lance: true` → `mountUnit(uid, {..., lance})` → `_updateUnitMount`
    couches `_spearClone(ts * 2)` on the wrap under the rider's right arm (`_MOUNT_LANCE` = len / x / y / z / dip / across);
    shown only while the rider is up, dropped with the cast window (a Saddle Up buff keeps the horse, not the lance), disposed
    with the horse. Rides the relayed windup beat like the horse, so the guest sees it.
- Catalogue: `spear` (HQ_CATALOGUE_WEAPONS, palette group "Spell props"), stood on its butt, h 2.0. Placed: two in the Camelot
  keep's guardroom beside the armour stands (x ±7.2, z 7.875); not in any arena window (Camelot's arenas are cut from the ward).

## THE INSTRUMENTS (2026-10-27)
mondo: "also added these instruments, use them where appropriate. Harp for the angels, guitar and tambourine for the hippies,
maybe some viling for requiem, etc. Maximize the use of these in the game, both in spells and exploration areas as props. Add
them to the editor". Files on R2: `Assets/instruments/` GuitarV1, MaracasV1, TamburinV1 (.glb + .fbx; the game uses the .glb)
and `Assets/instruments/orchestral/` Cello, Cello_bow, Drum, Harp, SeedPod, Violin, Violin_bow, Whistle (.glb + png).
- THE POSE: the orchestral files are a showroom scene (each node carries a placement offset/rotation/scale). three-renderer.js
  `_instrPrep(root, url)` clears every node transform below the root and turns the meshes inside one pivot by `_INSTR_POSE[stem]`
  so every instrument stands upright with its face (strings / skin) to +Z. It runs in BOTH loaders that fill
  `_miscModelCache` (`_loadMiscModel` and the spells' `_oneFileGltf`) BEFORE `_ew_bbox` is measured, and once per root
  (`root._ew_instr`). Gotcha found on screen: when the spells' warm loaded a file first, the rooms got the showroom box (drum
  0.47 m tall and sunk, `lay` tambourine standing) — prep in both loaders fixed it. Exported as `ThreeRenderer.instrumentPrep`.
- THE EDITOR: data.js `HQ_CATALOGUE_INSTRUMENTS` (15 rows, `base: 'instruments'`, foot 0 so nothing blocks; `_lying` rows use
  `lay`), palette group "Instruments", folder `Assets/instruments/`; `_hqModelUrl` maps the base.
- THE ROOMS (each row commented `THE INSTRUMENTS (2026-10-27)`; all outside the arena windows, none blocking): Heaven gate
  (3 harps), Olympus summit (2 harps + drum), Camelot hall (harp, drum, violin + bow, whistle on the round table), carnival
  (drum on the top riser, tambourine + maracas on the benches), Shasta slopes (hippie camp: drum, guitar, tambourine, seed
  pod), Stonehenge henge (drum + seed pod, a hippie guitar/tambourine/maracas spot), fairy forest glade (harp + whistle),
  stadium bowl (two drums + guitar on the stage), haunted hall (cello + bow, violin on the table), strip chapel (guitar),
  revenge cabin (violin + bow, whistle on the sea chest), recwing (guitar, tambourine), Vatican basilica (2 harps, cello + bow).
- THE SPELLS (three-vfx-effects.js "THE INSTRUMENTS", looks only, no sound): `ins_*` rows in `_WPN_MODELS` (warmed with the
  rest). `_insStage` hangs off `_fireStage` (windup/burst/finish beats are already relayed, so the guest sees the same band);
  fog gate `_pzSeen`. The instruments float beside the caster on the camera side and play (strum / pluck / shake / beat /
  bow / blow) with ♪ notes. Race-wide: every angel cast = harp, hippie = guitar + tambourine, shaman = drum + seed pod.
  Spells: Requiem (violin at the caster, violin + cello + violin ring on the hit), Discordance (violin screech), Anthem (`warCry`, drum),
  Lullaby / Siren Song / Lure of the Deep (harp), Encore (tambourine + maracas), Stadium Show (guitar, two drums on the hit),
  Chart Topper (guitar), Infernal Waltz (violin), Last Dance (violin + cello, stops at the burst), Whistle (the whistle),
  Contact High (maracas), Mantra / Ayahuasca Retreat (seed pod). Finishers: Rapture (harp), The Trip (guitar + tambourine),
  Lullaby (harp, dark), Farewell Tour (guitar + drum on the tour stage). Kill-switch `window.EW_NO_INSTRUMENTS = true`.
- NOT covered (no model): microphone (Mic Drop), trumpet (Last Trumpet), piano (Things That Go Bump) — listed in
  spell-vfx-audit/fix/MISSING_MODELS.md.

## THE OCCULUS WINGS (2026-10-27, mondo: "Assets/misc/wings.glb ... combine them with the eyeball to make the 3d occulus with custom animations ... Custom spell animations for the occulus like the seraphim. And add the wings to the character creator too.")
- The file: Blender export, one `AngelWings` node (y −0.1) holding `Wing_L` (+X) and `Wing_R` (−X), each a separate static mesh
  pivoting on its own origin at the shoulder (tilted ±11.4° about Z), 67k verts / 118k tris EACH (237k for the pair), one
  feather PNG + COLOR_0 vertex colours (off-white), ~8.8 MB. No bones, no clips. Heavy: an optimized bake would need his upload.
- THE OCCULUS: sprites.js RACE_MODELS_3D `occulus.male` = that file, `procRig: 'occulusWings'`, heightRatio 0.85 (physique
  1.50 m), male only like its sprite. Having a model makes it 3D-READY, so it is now playable like every modelled race.
  three-renderer.js `_PROC_RIGS.occulusWings` puts each wing on its own hinge (`ewOccWingL` / `ewOccWingR`), hangs the
  Seraphim's core eye holder (`ewSerEye`, `userData.eyeR` = OCC_EYE_R 1.0 file units, ~0.5 m) between the roots and adds
  `ewOccGaze` (its scale.x is a 0..1 channel the clips drive). `_procRigEyeTrack`: the eye watches the viewer at rest and
  swings onto the unit's facing (its target) while a clip holds the gaze up.
- THE CLIPS: `_OCC_POSES` = a pose function of u per slot, sampled at 30 fps by `_occClip` (fields: body x y z rx ry rz,
  each wing's beat / raise / twist, eye swell, gaze). Every cast fits the board's 1.4 s one-shot cap (_maybeStartModelAnim).
  idle (3 beats, right wing a beat behind), walk, cast = bolt (rear up, one downbeat), castChannel = the stare (wings lock
  wide and shiver, eye swells, the body creeps in: Psychic Beam, Death Gaze, Baleful Gaze, Antimagic Gaze), castPsychic =
  the body wheels a full turn round the eye (Hypnotic Pulse, Telepathic Link), castLantern = rise and sweep the stare
  (Omni-Vision, Every Eye at Once), castGuard = both wings wrap the eye (Pupil Shield), castAOE / castUltimate = cocoon then
  burst (ultimate spins inside), castSupport / castHeal, castCurse = the right wing alone points, castDrain = three pulls,
  castKinetic (= castHurl, castSkyward) = wings high then the throw, castMelee = right wing scythes, left follows, hit,
  death = tips onto its back, wings flat, eye staring up. sprites.js SPELL_ANIM_VERBS: `goAntimagicGaze` → channel,
  `goEyeStalks` → lantern (both unique to the Occulus; display only).
- THE SHADER FIX: `_ewVColorEmissiveHook` wrote `*= vColor` under USE_COLOR; three r186 declares vColor vec4 there, so any
  swapped unit material with vertex colours failed to compile on WebGL (the wings drew nothing, only the x-ray twin). Now
  `.rgb` in both branches. Creator shells / hair go through the same hook.
- THE CREATOR PART: sprites.js `EW_WINGS_STYLES` (none / feathered), `wings` enum + `wingsColor` (default #f2f2f2),
  `getWingsStyleUrl`, warmed by getCharacterAppearanceAssets; party-builder.js ACCESSORIES row "Wings" + "Wing colour".
  three-renderer.js `_createAppearanceRig` setWings / buildWings: a plain Mesh per wing (shared cached geometry, no
  skinning) on its own hinge, the pair a child of the chest bone (Spine02) with matrix boneInverse × bindMatrix × the
  placement (upper back, a wing 0.6 of the body's height); tick() beats each wing slowly, the right a touch behind.
- Proof: /mnt/project-files/occulus-wings/ (party builder, board idle, the stare, the spin, the creator, every clip sheet).
- THE SINGLE WINGS (2026-10-27, mondo: "I added angel wings with a much smaller poly count, can you use these wings instead
  for the character creator. For the occulus, use these bat wings instead of angel wings. The dragon wings are for dragon spell
  maybe if it makes sense. All of them are a single wing so you'll have to duplciate and mirror"). R2 `Assets/misc/wings/`:
  `Meshy_AI_one_{angel,bat,dragon}_wing_*_texture.glb`, one mesh each (~16k tris, 3 jpg maps, ~4-8 MB, no bones). The shoulder
  end: angel +X, bat +X, dragon −X (measured; three-renderer.js `EW_WING_FILES.root`). `_ewWingPair(root, rootEnd)` clones the
  mesh into the old wings.glb frame (LEFT wing: shoulder on the origin = the middle of the root end, reaching +X, 4.3 long =
  EW_WING_LEN), the RIGHT = its x-mirror with re-wound triangles; the pair is cached on the source root's userData.
  `ThreeRenderer.getWingPair(kind)` = the pair or null while it streams (warms it).
  - Occulus: sprites.js model = the bat wing; `occulusWings` takes a one-mesh file through the pair (hinge lift OCC_BAT_LIFT
    0.3); the two-mesh path (Wing_L / Wing_R) is kept.
  - Creator: EW_WINGS_URL = the angel wing (Feathered); buildWings uses the pair when the file has no Wing_L / Wing_R, the
    source normal map, hinge lift CC_ANGEL_LIFT 0.35.
  - Dragon: Hoard (`_sigHoard3D`, the dragon's finisher) swaps its two drawn triangle wings for the real pair (4 tiles a wing,
    swept back 0.35) as soon as the file is in; `_wpnDrip` warms `wing:dragon` when a dragon is on the board. Wing Attack and
    the other dragon spells are shared with other races, so they stay as they were.
  - The old `Assets/misc/wings.glb` is no longer loaded by anything.

## THE INSECTS (2026-10-27, mondo: "added these insects, bees and ants for bee queen and antperson, maybe butterflies for fairy and nature spells")
- Files: R2 `Assets/animals/insects/`, 19 small GLBs (50-435 KB), flat colours, no sheets, head at +X (measured by the eye
  material). Flyers: the wings are their own nodes, one clip `<File>_Flap` (rotation only). Ants, grasshoppers, caterpillar,
  chrysalis, anthill: no clips. `Bee_Wing_Flap_Frames` / `Moth_Wing_Flap_Frames` = the honeybee / hawk moth at another wing rest
  angle; `Grasshopper_Mid_Jump` = the green one in the air.
- three-renderer.js `_ANIMALS` (THE INSECTS rows, after the elephant): `yaw: -PI/2`; `speed` = the flap clip's rate (bees 2.5-3x);
  new `proc` motions in `_animalCtl.tick`: buzz (bees, hawk moth), scurry (ants), hop (grasshoppers), leap (mid-jump); every proc
  now stops when a spell sets `ctl.still`; `ctl.wander` shrinks buzz (the Brood drone keeps its facing).
- Summon: `_SUMMON_ANIMALS.drone` = the bumblebee (Brood was the box dog).
- Spells (three-vfx-effects.js THE INSECTS, before THE EAGLE): The Swarm (32 bees), A Thousand Stings (a bee behind each sting),
  Overrun (36 ants), The Colony finisher (anthill + queen + ants, every 4th with a leaf) / the bee queen's finisher on the same stage (bees + the old cone; the
  stage passes `bees` by finisher id, the battle by the caster's race). The old dots / cone stay only while a file streams. On the relayed `burst` beat
  (`_BUG_ON_BURST` in fire(); Swarm Signal on the windup, `_BUG_ON_WINDUP`): Fae Ring + Fairy Dust (butterflies), Healing Seed / Rejuvenation / Herbal Remedy / Overgrowth /
  Orchid Disguise / Take Root (butterflies lift off), Bumper Crop + Crop Circle (grasshoppers hop out, the mid-jump file in the air),
  Dread Aura (moths round the mothman), Swarm Signal (ants run in; bees when the caster is the bee queen), Tunnel Network (ants
  out of the far mouth). Fog: nothing on a tile the viewer cannot see. Warm: `_spellLibWarm` loads `_BUG_KEYS`.
- Editor: data.js HQ_CATALOGUE_ANIMALS, 19 rows (Animals group), `span` metres at storybook size (bees 0.12-0.14, ants 0.1-0.16,
  butterflies/moths 0.15-0.2, grasshoppers 0.18; true size was invisible in a room), flyers `hover`. The caterpillar row is
  `caterpillar_bug` (`caterpillar` = the older Meshy misc prop; a catalogue key already taken is skipped silently).
- GOTCHA: room props hand materials to the room's pick (`_hqPropMatPick`), which drew the sheetless flat colours WHITE; `_animalBuild`
  now keeps its own `_animalMat` for an `A.lift` (insect) material with no map.
- Decor (beside the earlier animals, outside the arena squares): HQ garden (bees, butterflies, caterpillar, chrysalis), the fairy
  forest clearing (anthill + ants by the rabbits, moths under the trees), Skinwalker fields' ranch (grasshoppers in the herd's
  grass, an anthill the hens peck round, ant queen, bumblebee), the fairy forest glade full site (butterflies, luna moth, bee,
  grasshopper).
## THE TRAPS PACK (2026-10-27, mondo: "added a traps folder, use the bear trap for the trap spell and there's a tomb and sarcophogus tht can be used for mummy or anubis spells. idk if there's a spike trap spell but there is that too")
- R2 `Assets/traps/`: 21 GLBs (bear trap base + jaw, chains draped/straight, wooden coffin + lid, iron maiden + two doors,
  spike pit, pressure plate, sarcophagus + lid, trap hole + dart + spear, trip wire + broken) + ONE sheet
  `color_swatches_purple.png`. The GLBs carry no texture: three-renderer.js `_trapsMat` is ONE shared Lambert (sheet,
  flipY false, nearest, no mips, a 0.3 emissive self-lift: the dark rust/iron went black in a torch-lit cell). The `-colonly` /
  `-convcolonly` files are collision shells: unused. Kill-switch `window.EW_NO_TRAPS_PACK = true`.
- `_trapsBuild(kind, o)` assembles the two/three-part sets in their shared space and returns `set(t)` (0 open .. 1 shut):
  bear (two jaws hinged at y 0.06, the second turned 180°), maiden (doors pivot at x +0.5 / -0.6), coffin / sarcophagus (lid
  at y 0.5 / 0.96, open = slid off + tipped), dart / spear (rises out of the hole). Room / editor props: `_trapsProp` from the
  `trap_*` procs; spells: `_trapsClone(kind, size, o)` (own materials for fading, `o.lift`, `o.fit`), exported as
  `ThreeRenderer.trapsClone` / `warmTrapsModels`.
- data.js `HQ_CATALOGUE_TRAPS`: 10 assembled rows (trap_bear_open/shut, trap_iron_maiden(_open), trap_coffin(_open),
  trap_sarcophagus(_open), trap_dart_hole, trap_spear_hole) + 18 single-file rows (`base: 'traps'`) = the editor's "Traps" group
  (28 tiles, all thumbnails proven in the editor; the picture waits for the sheet + the set's files).
- Rooms: Merlin's undercroft cells (open iron maiden in cell 1, a sprung bear trap in cell 2, a shut maiden in cell 3, chains on
  the back walls, a broken trip wire in the passage, the ossuary passage's pressure plate between two dart holes) and the Vatican
  catacombs (an open wooden coffin at the tombs' end). Dressing only: none blocks a way, none springs, neither room hosts an arena.
- Spike trap: no spell is a spike trap (Snare's internal trapType 'spike' is a wire snare: it got the bear trap). Pit_Trap_Spikes
  is an editor tile only.
- Spell looks: docs/notes/spells-vfx.md "THE TRAPS PACK".

## THE UNICORN (2026-10-27, mondo: "use a white horse, the unicorn horn, and the angel wings to make a new unicorn character with custom animations for it spells")
- New race `unicorn` (data.js, every race table; server.js AVAILABLE_RACES; map.js SKY_RACES + ui.js codex sky list, like
  every winged race). Kit from existing families only: signature family `unicorn` (Horn Light T1 blinds, Healing Horn T2
  heal + Regen, Unicorn Charge T3 charge, x1.5 vs Blind, applies nothing) + healingmagic, light, horns, angelic. Excludes
  Soothe (a hand), the choir passive (a voice), Merkaba (as for the angel). Passive Pure Horn = immuneStatus poison.
  Finisher Horn of Light borrows the angel's `rapture` staging (trumpet caption swapped). Healer on the class medians.
- THE BODY: sprites.js RACE_MODELS_3D `unicorn.male` = `Assets/animals/horses/Horse_glb.glb#unicorn` (the '#unicorn' keeps
  the rig cache's assembly apart from THE HORSES' plain horse, which mounts and rooms load by the bare url), `procRig:
  'unicornWings'`, heightRatio 1.3 (the box reaches the wing tips), basicAttackKind 'melee' (the gore).
- three-renderer.js THE UNICORN (before `_PROC_RIGS`): `_uniBuild` takes the saddle + bridle meshes off, puts mondo's single
  angel wing (`Assets/misc/wings/Meshy_AI_one_angel_wing_1027074635_texture.glb`, the shoulder at file +X 0.40/0.17/0.07, the
  tip out to −X) on the chest bone twice: a mount per side (the left mount's scale.x = −1 = the mirror) and a hinge the clips
  turn (`ewUniWingR` / `ewUniWingL`, one track drives both mirror-true). Clips: idle / walk / run = the horse's own Idle /
  Trot / Gallop + wing tracks; every cast kind = `_UNI_POSES` (fields in the comment: body pitch/roll/drop, chest/neck/head,
  each leg, tail, wings), sampled at 30 fps into bone quaternions as model-frame turns (local = Pw⁻¹·D·Pw·rest). Slot aliases
  at the end of `_uniBuild` (no hands: throws/claws/punches = the gore; stomps = castAOE; curses/drains/sights = castChannel).
- NEW HOOK: a `_PROC_RIGS` builder may carry `.deps` (urls): `_loadUnitGLB` loads them first (`_procRigDeps`, null on a fail)
  and calls `builder(root, gltf.animations, deps)`. The Seraphim / Occulus builders ignore the extra args.
- THE HORN (follow-up, same day): mondo's `Assets/animals/horses/Meshy_AI_unicorn_horn_1027075634_texture.glb` (one
  straight horn, base at −Y, tip at +Y, 0.95 tall) is `deps[1]`; `_uniBuild` mounts it on the head bone (`ewUniHornMount` /
  `ewUniHorn`) at UNI_HORN_AT (the forehead, model frame), UNI_HORN_LEN 0.55 long, tipped UNI_HORN_TILT 0.9 rad forward,
  so every pose that moves the head carries it.
- Sprite / portrait: mondo's `Races/unicorn/unicorn.png` (128², facing left) in _CHARACTER_SPRITES + RACE_SPRITES +
  _SINGLE_FILE_RACES. No portrait art: the HUD face is cut from the sprite, aimed by hud.js FACE_AIMS
  `Races/unicorn/unicorn.png` (the head is top-left; the wing pulled the auto aim off it).

## THE SPACE PROPS (2026-10-27)
mondo uploaded three props to R2 Assets/misc/: `Meshy_AI_satellite_realistic_1027103629_texture.glb`,
`Meshy_AI_space_shuttle_realis_1027103636_texture.glb`, `Meshy_AI_international_space_s_1027103646_texture.glb`.
- three-renderer.js `_MISC_GLB`: `satellite`, `space_shuttle`, `space_station`. Measured orientation: satellite panels along X,
  dish up (+Y); shuttle stands on its tail, nose +Y, orbiter's back to +Z; station truss along Z, flat.
- mondo's "lunar rover" meant the LUNAR LANDER (`lunar_lander`, Assets/door/models, catalogue file; corrected the same day,
  the Mars rover was the first pick). `_SPELL_CAT_KEYS` lets
  `getMiscModelClone` / `_warmMiscModels` load a catalogue key by its `_hqModelUrl` (no copy in misc).
- The "spaceship debris with wires hanging out" is the existing torn hull plate (`hullplate`, Assets/misc).
- `_SPELL_MISC_KEYS` (three-vfx-effects.js) warms all five on the loading card (~42 MB together).
- VEHICLE MOUNTS: `_MOUNT_VEHICLES = { mars_rover: { h, seat, z }, lunar_lander: { ..., fly, stand, hop, bell } }`; `mountUnit(uid, {vehicle})` builds the mount
  from the prop (`_vehicleMountBuild`), no straddle pose, a rumble while it drives. `fly`: comes down from above, hops
  `hop` tiles up while the body travels with the descent engine burning (an additive cone under the bell), lifts off after;
  `stand`: the rider stands on the porch (+Z) on idle instead of the chair sit. Lunar Lander flies it via `_RIDE_CASTS`.
- Map editor: HQ_CATALOGUE_MISC `satellite` (Sky and space), `space_shuttle` (Vehicles, block), `space_station` (Sky and space).

## FRANKENSTEIN (2026-10-28, mondo: "here's a frankenstein rigged model to use for mad scientist's creation spell, please wire it up")

- File: R2 `Assets/Sprites/Races/Homosapien/Male/engineer/Meshy_AI_fankenstein_Running.glb` (the typo is the bucket's name). A Meshy
  "Running" export: standard Meshy biped rig (Hips…), 14k verts, 1.7 m, three 2k JPEG sheets (7.4 MB), ONE clip `Running` (0.63 s, in place).
- sprites.js `DOOR_CAST_MODELS.frankenstein` (`_mkCast`, heightRatio 1.15, lib idle = UAL2 `Zombie_Idle_Loop`, walk = `Zombie_Walk_Fwd_Loop`).
  Being a cast row it is in the editor's PEOPLE tab ("The cast") — an npcSpot `{ cast: 'frankenstein' }` stands it, zombie sway.
- The Mad Scientist's Summon Creation (summonDef key `creation`) wears it: three-renderer.js `_SUMMON_ANIMALS.creation = { cast: 'frankenstein' }`
  runs through `_summonAnimal3D` like the hound (run the gap, turn + strike per `_bites`, flinch when hurt; host and guest rebuild from the same
  turret state). `_castCreatureBuild` = the cast rig in the animals' ctl shape: run = its own `Running`; idle / walk / attack (castSlam, else
  castPunch) / hit = the shared library bake; with the library off or failed: procedural on the body group (breath over the run's first frame,
  a lunge, a recoil). Lambert over the bake like `_attachUnitModel`. Warmed with the spell library (`_warmSummonModels`).
- The old re-dressed abomination (zombie build + bolts) stays only for the kill-switches (EW_DISABLE_3D_UNITS / EW_DISABLE_CAST).
- Looks only: no rule touched. Proof shots: /mnt/project-files/frankenstein/.

## THE NEW PROPS (2026-10-28, mondo: "added some more of your requested models in /weapons and /misc, please implement them into the game and the corresponding spells")

21 Meshy props (each ~5-10k tris, three textures, no rig) from the missing-models list (spell-vfx-audit/fix/MISSING_MODELS.md):
R2 `Assets/weapons/Meshy_AI_<name>_<id>_texture.glb` = dynamite, grenade, landmine, shield, throwing_knife; R2 `Assets/misc/` = bible,
black_blob, burlap_sack, crystal_shard, crystal_shards, ejection_seat, frog, giant_foot, microphone, rope, sandbags, syringe, tesla_coil,
tongs, trumpet, voodoo_doll. Raw (the compression pass is on hold); the spell-library warm on the battle loading card pulls them all.
- three-vfx-effects.js `_WPN_MODELS` rows (keys: dynamite grenade landmine shield throwingKnife bible blackBlob sack crystalShard crystalShards
  ejectionSeat frog giantFoot mic rope sandbags syringe teslaCoil tongs trumpet voodooDoll). Measured facings: syringe needle −X, tongs jaws −X,
  trumpet bell −X (all three `axis: 'z'` + `tweak.ry = π` → the business end on +Z); dynamite along X (fuse +X); knife upright tip +Y; frog,
  ejection seat, voodoo doll face +Z; giant foot toes +Z; shield face/boss +Z; bible / landmine / rope coil / crystal cluster lie flat.
  `_npInst(key, len, op)` = an instance for an effect (null while the file streams: every look keeps its old build until then).
- Where each one is: Underfoot = the giant foot (lands at 700 ms = its hitMs); Into the Sack = the burlap sack beside the target; Bipod =
  sandbags in front; Eject = the ejection seat under the body; Mic Drop = the microphone; The Last Trumpet = the trumpet; Live Coal = tongs
  carrying the coal; Needle Work = the syringe, needle down; Voodoo = the doll on the red thread's middle; Polymorph = a frog hops out of the
  poof (look only, nobody transforms); Hogtie = rope coils for the loops; Shardstorm = crystal points; Crystal Coffin = crystal walls +
  the cluster at the feet (no depth write, the friend shows); every spectral shield (`_sigBuildShield`: Shield Bash, Plot Armor, Oath of
  Valor, fortify…) = the round shield; Shield Bash (raceShieldBash) now runs `_sigShieldBash3D` on its burst; Monster Serum = the syringe
  into the ally on the burst; Bible Study casts (families 'biblestudy') = the bible held up beside the caster on the windup (`_npStage`).
- three-renderer.js: `_PROJ_MODELS['proj-knife']` (every knife throw), `'proj-dynamite'` (data.js raceDynamite, was 'proj-bomb'),
  `'proj-handgrenade'` (raceEMPGrenade, was the tech bolt sprite); `tumble` = end-over-end turns/s. Deploys: `_npDeployProp` →
  Tesla Trap = the tesla coil (built coil while streaming), Scrap Mine = the landmine (red marker while streaming); a deploy builder that
  returns null falls back to the marker. Mitosis's Blob = the black blob (`_summonBlob3D`: breathes, hops the gap, lunges on a bite,
  squashes when hurt; was the box dog). sprites.js throw regex gained `dynamite` so Dynamite keeps its throw clip.
- MATTE: all 21 exports are metallicFactor 1 over a metallicRoughness bake → near-black on the stage (no env map). They carry
  `matte: true` in `_WPN_MODELS` (the weapon loader runs `ThreeRenderer.matteBake` = `_cvMatteBake` on the cached root) and the
  deploy props bake on first use. Older weapon rows are untouched.
- Proof shots: /mnt/project-files/new-props/.

## THE HALLOWEEN PACK (2026-10-29, thread "Add a trick or treat candy spell")
mondo's upload: R2 `Assets/halloween/models/halloween.fbx` (712 KB, ONE binary FBX kit, centimetres, ~120 named meshes),
its sheets loose in `Assets/halloween/textures/` (256 px PNG/JPG; the FBX names them by C:\ paths), the rigged characters
apart in `Assets/halloween/characters/` (Character.fbx, Character_Ghost.fbx, Character_Witch.fbx — not used by this loader).
- Nodes worth knowing: `Candy_Bowl` (+ child `Candy_Bowl_S`, the heap of sweets — picking the bowl brings it), the trick-or-treat
  pails `Candy_Container` (pumpkin) / `_01` (black) / `_02` (pink) each with a `_D_` candy lid child, loose sweets `Sweets` …
  `Sweets_22` (wrapped candies, bars, lollipops, candy apples, candy corn), `Pumpkin*` (+ `00x` lids), `Coffin`, `Coffin_01`,
  `Coffin_Top`, `Coffin_Top_01`, `Coffin002`, `Body`, `Body_01`, `Body001`, `Body_01001`, `Body_part*`, headstones `Stone*`,
  `Shovel`, `Scarecrow*`, `Candle*`, `Tree*`, `Fence*`, `Wall*`, `Spiderweb*`, `Farmland*`, `Straw*`, `Bricks*`.
- Loader (three-renderer.js, same shape as the Christmas pack): `_R2_HW`, `_hwPackOn()` (kill-switch `window.EW_NO_HALLOWEEN_PACK`),
  `_hwUrl(node)` = `<file>#<node>` through the misc loader (_asFbx parses ONCE, _miscPiece cuts). `_hwSheetManager` gives every
  texture an EMPTY Texture that remembers its sheet (`userData._hwSheet`); a cut piece fetches only its own sheets
  (`_hwSheetsLoad`) and lands after they have (a sheet that 404s = plain white, never black). `_hwPackMats`: Lambert on the sheet,
  linear, alphaTest 0.5, webs / tree leaf cards two-sided, the file's lights + cameras out.
- Catalogue rows: `base: 'halloween', node: '<name>'` (file defaults to halloween.fbx).
- Spells: `ThreeRenderer.halloweenClone(node, target, align, o)` (unlit clone, `g.userData.mats` to fade, null while streaming)
  and `ThreeRenderer.warmHalloweenModels(nodes)` (three-vfx-effects.js warms `_HW_SPELL_NODES` on the loading card).
- Used by: Jack o' Lantern's Trick or Treat (see spells-vfx.md) and THE PUMPKINS (spells-vfx.md: every Jack o' Lantern cast, his bolts, Up the Apple Tree, Devil's Coal, his Meteor, his finisher; the Pumpkin* lanterns + lids and whole pumpkins). A battle fetches the FBX + only Candy_Bowl.png, Sweets.png,
  Sweets_01.png (~350 KB) for it.
- Used by: the dead races' gory spells — the ten `Body_part*` pieces (heads, arm, leg, heart, meat, guts; sheets
  Body_parts.png / Body_parts_01.png), see spells-vfx.md "THE SEVERED PARTS".
- THE HALLOWEEN GRAVES (2026-10-29, mondo: "There are gravestones that we can use for when a character dies, replacing the current
  one"): a fallen ALLY's grave (three-renderer.js `_buildGravestone3D`, also the editor's `gravestone` prop) is one of the six upright
  headstones `Stone` (round-top slab) / `Stone_01` (plain cross) / `_02` (Celtic cross) / `_03` (tall carved stone) / `_04` / `_05`
  (stepped stones), `_GRAVE_HW_STONES[seed % 6]` (a team's ids 'p-0'..'p-3' get four different stones; the rng's first draw clumped
  them), real height in metres of the 1.75 m tile (0.72-1.26 m), the pack's own lit Lambert sheets (marked `_ew_shared` so a grave
  rebuild never disposes them), flowers kept. Empty marker while it streams (the landing resets the deployable serial + objects);
  the old procedural slab only with the pack off or its file failed. Enemy remains stay the bone pile; the PR #393 rules (own fallen
  always shown, enemy bones stay once seen) and online are unchanged (each screen builds from state.units, the stone comes from
  the unit id, so both screens agree). three-vfx-effects.js `_HW_GRAVE_NODES` warms the six on the loading card (6 sheets, ~690 KB).
  The tomb plots `Stone_06`-`_08` (1.8-2 m long) are not used: wider than a tile. Proof: /mnt/project-files/halloween-graves/.
## THE MALE GHOST (2026-10-29, mondo: "there is character_ghost that i want to be used for the male ghost, i dont know if it's rigged or compatabile with our movement animation library")
- Source: R2 `Assets/halloween/characters/Character_Ghost.fbx` (83 KB, binary FBX, the Halloween pack) + `Assets/halloween/textures/Ghost.png`
  (256 px sheet). A kid in a bedsheet costume: sheet with eye holes, orange gloves, black trousers, white shoes, 1,893 verts.
- RIGGED: one SkinnedMesh on a 20-bone armature (+ the exporter's empty root bone), no clips. Its OWN bone names (Spine, Neck,
  Head, L_/R_Shoulder (= upper arm), _Forearm, _Hand, _Hand_01/_02, L_/R_Leg, _Leg_01, _Foot), NO hips bone (the spine is the
  root and the legs hang from it), centimetres under a x100 armature, facing -Z. So NOT compatible as uploaded: the library
  retarget (three-renderer.js _ANIMLIB_MAP) looks bones up by the Meshy names and needs `Hips`.
- Baked offline (script: /mnt/project-files/halloween-ghost/bake-ghost.mjs; three FBXLoader -> GLTFExporter -> gltf-transform):
  bones renamed to the Meshy names (L_Shoulder -> LeftArm, L_Leg -> LeftUpLeg, L_Leg_01 -> LeftLeg, Neck -> neck, fingers ->
  LeftHandIndex1/LeftHandThumb1 ...), a new `Hips` bone added at the spine root with the legs moved under it (the ghost's Spine
  keeps the torso, neck and arms and takes the library's chest rotation), turned 180 deg to face +Z, scaled to metres, UVs flipped
  (FBX bottom-up -> glTF top-down; skipping this put the black trouser texels on the sheet), the sheet embedded.
  Result `Assets/halloween/characters/Character_Ghost.glb` (205 KB) + `Assets/opt/3f4926ad_Character_Ghost.opt.glb` (111 KB,
  KTX2 + meshopt via optimize-assets.js --ktx2 --flat), both in the repo ASSET_MANIFEST.json (files + alt).
- Wiring: sprites.js RACE_MODELS_3D.ghost.male = _mkUAL(..., { model: <that GLB>, heightRatio 1.0, basicAttackKind 'magic' })
  (the female's settings). The male ghost becomes playable (3D-only roster rule). No stats/rules change.
- Proof (VS CPU 4v4, harness): Party Builder idle, move (run cycle), basic attack (magic cast), hit + death collapse:
  /mnt/project-files/halloween-ghost/male_ghost_on_screen.jpg.
## THE SHOVEL DIG (2026-10-29, mondo: "There's a shovel that can be used to make a dig animation for the dig action")
Looks only: the Build dig's rules, cost, reach and timing are unchanged. The Halloween pack's `Shovel` piece (halloween.fbx,
textures/Shovel.png 49 KB; nothing new to upload).
- battle.js doBuildAction: digging a BLOCK plays the basic-attack clip as kind `'dig'` (a tree keeps `'chop'`, the hammer swing);
  triggerAttackAnim also stamps the target tile (`tx`/`ty`) on `state._attackAnimDir` (rides state-sync with the kind).
- three-renderer.js "THE SHOVEL DIG" (`_DIG`, `_digStart` / `_digPose` / `_digYaw`): chain `['castReap', 'castSmash', …]`
  (no library has a shovel clip; Farm_Harvest's stoop-and-yank is the body). After the mixer: the shovel is placed in world
  space from the right hand (`grip` = where on the shaft), aimed at the bite point (`reach` × height ahead of the hips, `sink`
  under the dug tile's top), the left arm turned onto the D-grip by a two-bone reach (`_digReach`, any rig with Left
  Arm/ForeArm/Hand + Hips bones); the blade's first frame under the surface throws a spray of the tile's dirt (soil tinted a
  third toward EW_TERRAIN_COLORS); from `lift` the blade carries a clod, flicked off to the right at `loose`, lands and
  crumbles; the shovel shrinks away from `away`. The body turns to the dug tile while it digs (looks only, like THE KNOCK).
  The one-shot is held until the clip's end (the 1.4 s board cap cut it mid-yank). Pieces live in `hitFxGroup` (the unit
  layer is emptied and DISPOSED on every board rebuild). Shovel warmed once the first rigged body ticks.
- No hand bones / sprite body / castReap not baked yet / pack streaming = the old swing, no shovel. Kill-switch
  `window.EW_NO_SHOVEL_DIG`.
- Proof (harness, VS CPU + a 2-seat friendly room, the guest's own Popstar digging): /mnt/project-files/shovel-dig/.
- Harness gotchas found: `ph draw always` makes frames slower than battle.js's 350 ms attackAnimIds window, so a dig can be
  missed (use draw demand); the camera's `up` is tilted, so a capture camera must set up (0,1,0) before lookAt.


## THE CHESS SET (2026-10-29, mondo: "added a chess set to be used on the looking glass")
- R2 `Assets/chess/Low Poly Chess Set.fbx`: ONE binary FBX, the board (`Low_Poly_Chessboard`, 0.6 file units) + 32 pieces
  (`Low_Poly_<White|Black>_<Pawn|Rook|Knight|Bishop|Queen|King>[001…]`), flat colours (pure #000 black), no sheets, Z-up, white at +Z
  facing −Z. Its unused "Red/Yellow Glow" second material leaves the pieces as material arrays with NO groups (three draws nothing):
  _chessPrep gives them their one material; the board's ~800 colour runs become 2.
- COMPRESSED like the R3 pass: FBX → GLB (same nodes/names/transforms, lossless weld, scratch converter) → optimize-assets.js --flat
  → `Assets/opt/66fecd94_Low_Poly_Chess_Set.opt.glb` (1.15 MB → 0.58 MB); ASSET_MANIFEST.json `alt` maps the FBX to it. three-renderer.js
  `_asChess`: the alt copy when listed (GLTFLoader + meshopt), else / on failure the FBX (proved both in the harness: opt 404 → FBX 200).
- SHARED LOADER (PR #678): `ThreeRenderer.chessClone(node, target, o)` / `chessPiece(piece, dark, target, cb, o)` / `chessNode` /
  `chessNodes()` / `chessSetOn()` / `warmChessSet()`; base on y 0, centred, front to +Z (white turned 180°), shared Lambert materials
  (`o.ownMats` clones). `_loadMiscModel` opts.onFail (file or piece never comes). Kill-switch `window.EW_NO_CHESS_SET` = the lathe.
- THE LOOKING-GLASS (PR 2): `_chessFill` puts mondo's piece wherever the marble lathe stood: the garden board statues + the off-board
  giants (`_hqChessStatue`, plinth grown under the base, never wider than 0.9 of a walk tile / 1.8 tiles for the giants), the voxel Δ
  monuments (`_hzChessMon`, felt sized to the base), the rim pieces (`_NR_BUILDERS.lookingglass`) and the drifting far pieces
  (`_hzChessPieceFar`). The lathe is the fallback only. Statue collision = the piece's own triangles (`_mcFor` once it lands; the
  0.72 cylinder until then). The squat rook/bishop/knight stand a little shorter than their lathe twins (width cap); HQ_TREE_KINDS h
  (the cover rule) is unchanged.
- data.js HQ_CATALOGUE_CHESS (palette group "Chess set"): `chess_set_game` (the board + all 32 on their squares) and `chess_board`.
  Placed: a game on a `tulip_table` with two `teal_chair`s by the board's west walk (−27.5, 10.5).
- Proof shots: /mnt/project-files/chess-set/.

## THE SWAY — spring bones on a Meshy model (2026-11-01, the superhero's cape, the first test)
mondo: clothes and accessories that "sway and swing with their movements and collide with their body" (plan:
https://claude.ai/artifact/RKFPXXHKcruZtWtR9xSQHr ; renders of every model in /mnt/project-files/character-models-plan/).
Every Meshy character is ONE fused shell (all 161 checked: 1 mesh, no morphs, no face/cape bones) — a cape is weighted
to the legs and splits with each stride. The test, on `superhero` male:
- **bake-sway.py** (repo tool, Python + numpy + pillow; the cloud Blender venv has them) finds the part by its
  texture colour + where it sits (preset `superhero-cape`: red, behind the body, off the arms/legs, 0.15–1.42 m), cuts
  the 163 triangles that webbed it to the belt / boot backs below 1.2 m, adds 5 chains × 6 joints `ewsway_c<col>_<j>`
  hung on `Spine` and re-weights the 1,552 cape vertices onto them (fading in from the body's own weights over the
  top 14 cm). Edits the GLB directly, not through a Blender re-export, so the rig's names / rest / inverse binds the
  library retarget relies on stay byte for byte. Output `Races/superhero/male/Meshy_AI_a_superhero_Running_sway.glb`
  (+ `Assets/opt/4be949d9_…_sway.opt.glb`, KTX2, in ASSET_MANIFEST alt).
- **three-renderer.js THE SWAY** (`_swayScan` at load marks the root `userData.ewSway`; `_swayTick(cloneRoot, dt, opts)`
  after the mixer; `_swayAuto(obj, dt)` for stages that hand over their own model): per bone inertia (1 − drag),
  a pull back to its baked direction in the parent's frame (stiffness), gravity, then pushed out of capsules round
  Hips→neck (0.34 × length), thighs (0.27) and shins (0.20); a bone turns at most 70° (the first) / 30° (the rest)
  off its baked direction — no folds. All forces scale with the bone's world length, so any model scale works.
  State in a WeakMap (never userData: clones copy userData as JSON). Wired: the board (`entry._ew_sway`, kept on the
  rig record so a rebuilt entry keeps it), the unit viewer, the HQ cast loop, the idle dock loop, the line-up members.
  Cosmetic + local: each screen runs its own, nothing relayed (RULE #2: the guest sees the same cape motion from its
  own renderer). `window.EW_DISABLE_SWAY = true` = off (the cape hangs rigid from the back). Per-race tuning:
  sprites.js def `sway: { stiffness 1.6, gravity 0.9, drag 0.42, rad 0.018, maxRoot 70, maxBend 30, caps }`.
- Offline proof (three r186 + the GLB in a bare page, NOT the game): before = the cape rides the legs; after = it
  streams behind at board run speed (8 m/s), sweeps round on a turn, falls back when he stops —
  /mnt/project-files/character-models-plan/superhero_cape_sway_before_after.png.
- Other clones (ghost trails, animals, the portrait float) don't tick it: there the cape hangs rigid from the back.

## THE MPFB BODIES — MakeHuman base bodies for the modular characters (2026-11-01, first step)
mondo 11-01: base bodies + face expressions from MPFB2 (MakeHuman for Blender, CC0 assets), NOT Quaternius; Claude runs
Blender headless in the cloud. Plan + parts list: Claude Doc https://claude.ai/artifact/RKFPXXHKcruZtWtR9xSQHr.
- **bake-mpfb.py** (repo tooling, Python 3.13 + `pip install bpy==5.2.3`, MPFB2 from `git clone
  https://github.com/makehumancommunity/mpfb2`): `python3 -I bake-mpfb.py --mpfb <checkout> --out charactercreation/mpfb`.
  Installs MPFB2 into Blender's user extension repo and enables it headless (no UI, no GPU), then per body:
  MakeHuman macros → baked basis → MPFB `game_engine` rig + its weights → 12 face shape keys → every helper cut
  except eyeballs / teeth / tongue → bones renamed to the Meshy names (Hips, Spine02, Spine01, Spine, neck, Head,
  LeftShoulder…LeftToeBase; three-renderer.js _ANIMLIB_MAP column 1), Root dropped (its weights → Hips), fingers kept
  (30 bones the library doesn't drive) → a 1024² skin texture (linear filtered: nearest showed the brows as stair steps) painted from 3D (skin, lips masked by the mouth-eversion target's
  motion — mondo 11-01: the pucker mask read as smeared lipstick, brows anti-aliased + tapered, eyes by angle off the eye's forward axis, teeth, tongue, plain dark underwear) → GLB.
- **charactercreation/mpfb/mpfb_<body>.glb**: male, female, heavy (brute), thin (long-limbed), short. Each ~1 MB,
  13.9k verts / 27.7k tris (the creator's Meshy bases are 30.5k), 52 bones, one material, single-sided. Heights as
  built: 1.86 / 1.59 / 2.42 / 2.40 / 1.34 m (the game scales to `heightRatio` anyway). Facing +Z like Meshy.
- **Morph targets** (names in the GLB mesh extras.targetNames): blinkLeft, blinkRight, jawOpen, smile, frown, pucker,
  press, wide, browDownLeft, browDownRight, browInnerUpLeft, browInnerUpRight — MakeHuman expression units
  (targets/expression/units/caucasian). The visemes01/02 + faceunits01 (ARKit) packs and MakeHuman's stock skins,
  eyes, eyebrows, hair and clothes (.mhclo, fit any MPFB body) are separate downloads from files.makehumancommunity.org,
  which the 11-01 thread's network could not reach — next step once it can.
- NOT WIRED into the game yet (mondo: add alongside, don't replace without his OK). R2 path when they are:
  Assets/Models/charactercreation/mpfb/. A def is `_mkUAL('', '', { model: <url>, heightRatio: … })`.
- 11-01 in-game check (cloud, R2 blocked that session): the real game JS with the bodies swapped onto every race
  and a STAND-IN Meshy-named test library (3 synthetic clips keyed on the creator's Meshy base skeleton, routed over
  the UAL/MAL urls) — the renderer's own _libBakeClips baked it onto the MPFB rig and the clip played. The real
  UAL/MAL clips still need one look on the live CDN.

- **THE STOCK LOOK (11-01, thread "Test MPFB2 bodies in the game")**: `--packs <dir>` (bake-mpfb.py downloads + unzips
  makehuman_system_assets, faceunits01, visemes02 there when missing; all CC0) swaps the procedural paint for MakeHuman's
  stock look, after mondo said the painted lips read as smeared lipstick and the brows were jagged. Per body (KITS):
  a stock skin (young_caucasian_male / young_caucasian_female / young_african_male / young_asian_male /
  middleage_caucasian_male), its eyebrow + eyelash + eye-colour proxies DRAWN INTO the skin sheet (each .mhclo vertex is
  tied to 3 base-mesh vertices, so it lands on the body UVs; 4x supersampled, no extra mesh), and stock hair (short02,
  ponytail01, short04, short03, short01) as a second skinned mesh: 512 px PNG, glTF alphaMode MASK 0.5, double-sided,
  mesh extras ew_noTwin (the game does not read that yet; checked in the game: the stencil-masked team outline wraps the
  hair fine). Skin = 1024 px JPEG. Morphs = ARKit's 52 face units + 15 Oculus visemes (viseme_aa, viseme_PP ...), loaded
  on the full mesh so eyeLook* turns the eyeballs; they replace the 12 expression units (no `--packs` = the old bake).
  ~2.5-2.9 MB per body (morphs 1.2 MB sparse). Weak-PC note: three builds one morph texture per geometry
  (verts x 67 x 16 B, ~16 MB GPU) the first time a morph influence is non-zero; trim the set if that bites.
  charactercreation/mpfb/CREDITS.json = every asset used per body (author, licence, source) for the credits screen.
- 11-01 REAL in-game check (live CDN, real UAL/MAL library): mpfb_male on the male Fortune Teller (def swapped in memory
  only): party builder, team lineup, idle, walk and Tarot Draw cast on the board all play retargeted with no errors;
  all five bodies in the team lineup. Sheet: project files mpfb2-bodies/in-game/mpfb_in_game.jpg. Still not wired.
- 11-01 IN THE CHARACTER CREATOR (mondo: "put these bodies in the character creator, and make the height slider work"):
  sprites.js EW_MPFB_BODIES (id, label, gender, ratio: male 1.0, female 0.94, heavy 1.08, thin 1.04, short 0.82) + the
  appearance enum `body` ('classic' | mpfb_*; default + RANDOMIZE = classic). getCharacterAppearanceModel: an MPFB body
  = its GLB (EW_CHARACTER_ASSET_BASE/mpfb/<id>.glb, R2 Assets/Models/charactercreation/mpfb/) as is, heightRatio =
  ratio x the Height slider; the race keeps its hold + basic-attack kind; no creator rig (no clothes/hair/colours on it).
  party-builder.js CreatorControls BODY row = MALE / FEMALE (classic) + the five MPFB buttons; on an MPFB body only the
  Height slider shows plus a note (the other controls dress the classic bases, so they hide instead of doing nothing).
  three-renderer.js: the creator stage re-fits an MPFB body on a height change (v.fitM/v.fitBB, no reload); the board's
  rig cache key + the HQ walker's appearance include mpfbBody defs; getCharacterAppearanceAssets warms nothing for one.
  Online: unit.appearance already syncs and the guest resolves it through the same function. Checked in the game:
  DOOR Agent slot, MPFB male + female, Height 85% vs 115% on the stage, the team lineup draws the 115% body tall.
- 11-01 ALL MAKEHUMAN ASSET PACKS downloaded (64 zips, 3.3 GB, 940 assets: 590 CC0 + 350 CC-BY) to project files
  mhpacks/ (not the repo, not R2). charactercreation/mpfb/ASSET_PACKS_CATALOGUE.json = per asset: type, author, licence,
  original author, source page, zip. Any CC-BY asset baked into a body MUST land in that body's CREDITS.json (the bake
  does it via `credit`) for the credits screen mondo OK'd.
- 11-01 THE CREATOR AROUND THE MPFB BODIES, step 1 (mondo: "base the character creator around these models ... carry over
  what we can"): the MPFB bases are creatorBase now, so _createAppearanceRig dresses them with every existing garment,
  layer, accessory, hair style, wing and body/face slider. `part.stock` (mesh `mpfb_*`): the body keeps its stock skin map
  untinted and its head stays on the body (no painted face shell; paintSkin is skipped); the baked `mpfb_*_hair` mesh is
  never a target and hides while the rig is on (the creator hair replaces it). THE BODY MAP `TW`: garment lines are classic
  height fractions; on an MPFB body t is remapped piecewise through the ankle / knee / hip / shoulder joints (MPFB hip
  joint 0.54 vs 0.507) and every t<->y in the rig goes through TW.f / TW.i (identity on the classic bases). MPFB finger
  bones (index_01_l ...) count as ARM (the A-pose hands hang by the hips: the coat's lathe ran out to them). An MPFB
  coat's hips-held band is narrowed to the back quarter (hipsBack `narrow`). Creator UI on an MPFB body hides only the
  face-paint controls (eye size, brows, eye/lip colour, facial hair, skin tone). Known: a long coat over a skirt/gown still
  shows the under-layer through the tail at the lifted thigh in the wide idle stance; a coat over trousers has specks.
  Next: MakeHuman hair + clothes from the packs as picks, skin/eye/brow picks, MPFB as the creator default.
- 11-01 THE PACK HAIR (creator step 2): `python3 -I bake-mpfb.py --mpfb /tmp/mpfb2 --packs /tmp/mhpacks --hair-styles all`
  bakes every MakeHuman community hair (makehuman_system_assets 10 + hair01 25 + hair02 21 + hair03 14 = 70; 35 CC0,
  35 CC-BY; hair packs downloaded into <packs>/hair0N when missing) fitted by MPFB onto the MPFB male, into
  charactercreation/hair/mh/mh_<name>.glb (R2 Assets/Models/charactercreation/hair/mh/) + hair_styles.json (label,
  pack, author, licence, source, tris). Same shape as the classic pack: one mesh + its PNG (512, alpha MASK), no skin.
  extras.ewHairRef = the MPFB male's skull box measured the way fitHair measures one (t >= 0.955 / 0.9 in the rig's
  classic t, the 1.03 / 1.04 / +3 mm margins taken out), read by buildHair, so on MPFB a style sits where MakeHuman put
  it and on the classic bases it is fitted like the pack. sprites.js EW_MH_HAIR_STYLES (ids mh_*, appended to
  EW_HAIR_STYLES, no server fallback); the creator lists them in their own "MakeHuman hair" row; the hair colour
  picker tints them. CREDITS.json creator_hair = all 70. Heavy ones: curly01 120k tris / 5.6 MB, short_side_do 99k,
  anime 91k. Long styles ride the Head bone rigidly (as the classic long styles do).
- 11-01 THE PACK HAIR COLOUR (mondo: "some hairstyles ... dont change color when i pick a color, or itll only change a
  secondary color and the hair stays black or dark brown"). Cause: the pack textures are painted in their own colours and
  ~35 of the 70 are near-black (opaque-pixel mean: Hair 14 0.00, Afro 01 0.03, Micky afro 0.05, Double mh braid 0.05,
  Alpha 7 curly 0.06, Reverse french braid bun 0.06, Hair 01 0.07, French braid variation 0.07, Braid 01 0.08,
  Chinesebob / Curly 01 / Long 01 (punkduck) 0.09, Lara 0.09, Junglebook 0.09, Alpha 7 long 2 0.11, Short 01 0.11 ...
  everything under 0.30 was clamped); _ccHairTexture's grey mask lifts by x2.4 at most, so they stayed a dark grey and
  every tint came out black. three-renderer.js _ccPackHairTexture (pack styles only; the classic 14 keep
  _ccHairTexture): each texture's own 2nd..98th percentile luminance OF THE TEXELS ITS TRIANGLES USE (rasterized; a braid's
  unused black backdrop or Hair 13's red square must not set the range) stretched to 0..1, bent (gamma) to a 0.75 mean,
  floor 0.45 (0.12 / 0.32 left black smudges on a blonde Double mh braid); a texture with no range (Hair 05 / 12 / 13 / 14 are flat paint) = flat 0.86. THE SECOND HAIR COLOUR:
  12 styles carry a separate piece painted its own colour (sprites.js `accent: true`: Hair 11 yellow clip, Hair 13 red,
  Hair 17, 50s updo, Braided rows beads, Island princess flower + shells, Keylth red tie, Lady hippy black band, Lara
  teal tie, Reverse french braid bun purple ribbon, Hair bun brown red scrunchie, Blond with headband polka band).
  _ccHairAccent finds them per style: UV islands (union-find over the index) whose texture colour is > 22 (Lab, L at half
  weight) from the vertex-weighted median island colour; their triangles are drawn into a texel mask that gets its own
  levels. appearance.hairAccent 'own' (default: the piece keeps its painted colours, vertex colour white) | 'tint'
  (grey + appearance.hairColor2). Builder: "Second hair colour" row under Hair colour, only on an accent style. No new
  files; the GLBs are unchanged.
- 11-01 THE PACK CLOTHES (creator step 3, plan row 11): `python3 -I bake-mpfb.py --mpfb /tmp/mpfb2 --packs /tmp/mhpacks
  --wear all` (packs downloaded into <packs>/<pack>/ when missing; ~45 min) fits EVERY MakeHuman community garment
  (makehuman_system_assets clothes + the 38 clothing packs: 476 = 190 CC0 + 286 CC-BY; tops 42, bottoms 25, skirts 20,
  dresses 56, suits 60, shoes 65, hats 41, glasses 15, masks 13, gloves 9, underwear 62, equipment 29, body parts 39 =
  horns, antlers, tails, wings, beards, nails) with MPFB onto all five bodies (game_engine rig, MPFB's own weights) into
  charactercreation/wear/mhw_<name>.glb (R2 Assets/Models/charactercreation/wear/) + wear.json (label, cat, pack, z,
  author, licence, source, tris, kb). THE COMPACT LAYOUT (write_wear_glb, read only by three-renderer.js buildWear):
  POSITION = the male fit, _D_<BODY> = each other body's offset (int16, ewWear.dq = 1/8 mm), _N int8 normal, _J/_W uint8
  bone slots (names in extras.ewWear.bones, bound by name to the body's skeleton), uint16 indices, the texture at 512
  (PNG + alpha MASK when see-through, else JPEG); garments over 16k tris are simplified by meshoptimizer (pip install
  meshoptimizer; borders locked, sloppy for the many-part M1 helmet). 162 MB in all, median ~250 KB.
  THE BASE INDEX: the bodies now carry _BASE_INDEX (every vertex's hm08 index; three: geometry.attributes._base_index),
  and a worn garment's delete_verts hide the body triangles under it (rig `wearHide`, applied once the garment loaded).
  Runtime: appearance.wear = list of ids (sprites.js EW_MH_WEAR [id, label, cat, z] generated from wear.json between the
  EW_MH_WEAR:BEGIN/END markers; normalizeWearList keeps one per category except underwear/equipment/bodyparts);
  `setWear`/`buildWear`/`wearMask`/`dropWear` in _createAppearanceRig, MPFB bodies only (part.stock); renderOrder by
  MakeHuman z_depth; warmed by _ccWarmAssets (getCharacterAppearanceAssets().wear). Creator: CLOTHES > "MakeHuman
  clothes" (category buttons, toggle tiles, TAKE ALL OFF), shown on an MPFB body; the coded garments stay and can be worn
  with them. ASSET_MANIFEST.json lists every wear GLB + the five rebaked bodies, so a rebake reaches players (?h=sha).
  CREDITS.json creator_wear = all 476. Known: heeled shoes float/clip (MakeHuman poses the foot for heels; we don't);
  two garments in one area (a tee under a suit) z-fight; the coded briefs show under a pack skirt (pick other bottoms);
  pack clothes don't follow the body sliders yet (plan row 3b: the sliders themselves don't shape the body yet).
  Sheets: project files mpfb2-bodies/in-game/pack_wear_*.jpg.
- 11-01 THE BODY SLIDERS (plan row 11b; mondo 08:13 "none of the body sliders in the creator work ... a slider for bust
  size too"). Finding: the rig never moved the skin for chest / waist / hips / head / jaw / nose / cheeks (the values were
  saved and in the shape key, nothing read them) and Build only scaled the cloth frame's axes; Height does scale the model
  (checked by mouse in the creator, classic + MPFB). Now `shapeBody` (three-renderer.js, before anything is cut from P):
  MPFB bodies = MakeHuman's own targets, `python3 -I bake-mpfb.py --mpfb /tmp/mpfb2 --shapes` -> mpfb/mpfb_shapes.glb
  (622 KB, sparse: POSITION = offsets in metres, _I = hm08 index, extras.ewShapes [slider, +/-, first, count]; build =
  torso/hip/neck/limb scale-horiz+depth, chest = measure-bust-circ, bust = the young female max/min cup, waist / hips =
  measure circ, head = head-scale-horiz, jaw = chin-width, nose = nose-volume, cheeks = l/r-cheek-volume), applied by
  _BASE_INDEX x slider (SHAPE_GAIN; build x0.75). Classic bases = shaped in the q frame (`shapeRig`: each vertex's limb +
  radial; build = girth round every limb axis, chest / waist / hips bands, bust two front lobes, head / jaw x round the
  head centre, nose tip + cheeks round CC_FACE landmarks). New `bust` slider (EW_APPEARANCE_LIMITS, creator "Bust").
  Coded garments + hair follow (cut from the shaped skin); pack clothes follow through `wearFollow` (each garment vertex
  rides its nearest body vertex's offset, 3 cm grid). Bones never move. The cloth frame's axes no longer scale with
  Build. Shots: project files mpfb2-bodies/in-game/sliders_*.jpg.
- 11-01 THE HAIR SWAY (plan row 11c; mondo 08:13 "add spring bones to it ... like you did for the capes so they are more
  realistic and flowy"). three-renderer.js `swayHair(part)` runs at the end of `fitHair` for every creator hair (pack +
  classic styles) whose lowest strand hangs more than 3 cm below the jaw; shorter hair stays rigid on the Head bone. It
  grows 7 chains round the back and sides (0.38pi..1.62pi from the face, 5 joints each, from ear height down the median of
  each sector's strands), bones `ewsway_c<90+col>_<j>` parented to Head, and rebinds the hair SkinnedMesh to a new
  skeleton (body bones + chains): each vertex weighs the two nearest chains by angle and its segment by height, faded in
  over 3 cm below the ear; the face side stays on the head. The rig tick runs the shared THE SWAY spring solver
  (`_swayTick(root, dt, HAIR_SWAY, true)`; HAIR_SWAY = stiffness 2.4, gravity 0.9, drag 0.38, its own smaller torso / leg
  capsules so long hair rests down the back). `dropSway` removes the chains when the hair changes. Visual only, each
  client runs it itself (nothing to relay). Shot: project files mpfb2-bodies/in-game/hair_sway_rest_vs_turning.jpg.
- 11-01 THE LOOKS (plan row 13, creator step 4): skin / eye / brow / lash picks for the MPFB bodies. `python3 -I
  bake-mpfb.py --mpfb /tmp/mpfb2 --packs /tmp/mhpacks --looks charactercreation/mpfb/looks` (about 2 min) writes layers
  of MakeHuman's hm08 UV sheet, which all five bodies share (the bake moves the eyeballs to the same corner on each):
  skin_<id>.jpg (78: system skins + skins01-03, 1024 px; toon01 has no texture, skipped), eyes_<id>.png (9 system eye
  colours on the low-poly eyeball proxy, inside the eyeball islands), eyebrow_<id>.png (12 system + 14 eyebrows01 mesh
  brows drawn as dark strands), eyelash_<id>.png (4 + 5), look_fixed_<body>.png (that body's teeth, tongue and painted
  underwear) + looks.json. The PNGs are straight alpha cropped to their box. All CC0; credits in CREDITS.json
  creator_looks. sprites.js EW_MH_LOOKS (generated between EW_MH_LOOKS:BEGIN/END) + appearance enums mhSkin / mhEyes /
  mhBrows / mhLashes ('own' = the body's KITS entry; RANDOMIZE sets 'own'); getMhLookLayers(a) gives [url, box] in draw
  order, null when every pick is own. three-renderer.js `setLook` puts them together on a 1024 canvas (skin, eyes,
  brows, lashes, fixed) and wears it as the body's map with the stock map's flipY / colour space; all own = the stock
  sheet. The kit composite matches the stock sheet (mean diff 1.3/255, JPEG noise). Creator: "MakeHuman skin and face"
  (SKIN / EYES / BROWS / LASHES tabs, "Body's own" first). Shot: project files mpfb2-bodies/in-game/looks_skins_eyes_brows.jpg.
- 11-01 THE MPFB DEFAULT + THE CREDITS (plan row 14, creator step 5). party-builder.js: CREATE APPEARANCE, RANDOM and RESET
  start on the MPFB body of the slot's gender (`mpfbDefaultBody`), the officer intake starts on mpfb_male, RANDOMIZE keeps
  the body picked (randomCharacterAppearance itself still returns classic, so saved looks without a body stay classic).
  The creator's CREDITS section ("MAKEHUMAN CREDITS") fetches charactercreation/mpfb/CREDITS.json (sprites.js
  getMhCreditsUrl, by its manifest sha through three-renderer.js window.ewAssetNetUrl) and lists every author with licence,
  source link and assets, CC-BY first. Shot: project files mpfb2-bodies/in-game/creator_credits.jpg.
- 11-01 THE CLASSIC MPFB BODIES (plan row 14b; mondo: "i like the old bodies, but i like the skin texture of the new bodies ... i
  also want the head of the new bodies on the old bodies since they have the mouths and blinking"). `python3 -I
  bake-mpfb-classic.py` (pip bpy for mathutils' BVH + numpy; a few seconds; no MPFB checkout) writes
  charactercreation/mpfb/mpfb_classic_<male|female>.glb from mpfb_<g>.glb + the classic Meshy base: per-bone affines onto the
  classic skeleton (torso scale about the hip centre, limb segments rotate + stretch joint to joint, hands / feet rigid with
  uniform scale, head uniform scale x0.894 male / x1.057 female with its crown on the classic crown) through MPFB's weights,
  then 8 rounds of nearest-surface pull (same facing, smoothed coarse to fine over the welded mesh) faded out by the
  Head / hand / foot weights; the classic normals are carried over (barycentric) where the pull is full. Fit: median 1.2 mm,
  99% within 4-5 cm only at the hands / heels (MPFB's own). Joints follow their bone's affine (rest rotations turned), inverse
  binds rebuilt, sparse morphs x the head scale. `_FIT_D` (VEC3) = body minus the MPFB body it came from + mesh extras
  ewFit {from}: three-renderer.js buildWear takes that body's garment fit and moves each garment vertex by the offset of the
  body vertex nearest it in the source frame (part.fitBase). sprites.js EW_MPFB_BODIES rows mpfb_classic_male / female
  (ratio 1.0 = the classic bases' height; `kit` = the looks / fixed layer, `mpfbKitOf`). Checked in the creator (local
  files, live CDN for the rest): both load, dress (coded + pack clothes), no errors.
- 11-01 THE CHEST (plan row 14c): appearance.mhChest 'band' | 'nipples' | 'smooth' (sprites.js EW_MH_CHEST: the band rect of
  the female fixed layer + the two nipple spots of the hm08 sheet). getMhLookLayers gives the fixed layer a third entry (the
  rect left out; setLook clips it out with an even-odd path) and `layers.smooth`; setLook `smoothChest` covers each spot with
  the skin 34 px above + 30 px toward the sternum, averaged, feathered round (r 24). Creator: "Chest" row under the MakeHuman
  skin and face picks, female MPFB bodies only. The game still drives no face morphs (blinks, mouths) on any body.
- 11-02 THE NO UNDERWEAR (plan row 14e; mondo: "remove the black underwear from the mpfb body and mpfb classic body, it is
  messing up some of the other clothes"): the dark (58,60,70) briefs / boxer shorts / chest band bake-mpfb.py painted were
  in TWO places: each body's skin sheet (image 0 of mpfb_<body>.glb, a 1024 JPEG) and looks/look_fixed_<body>.png (the
  layer setLook paints over any picked skin). Cleaned in place, no rebake: per body, mask = pixels nearer the underwear
  colour than the stock skin there (looks/skin_<kit skin>.jpg, the same hm08 sheet), cut to the parts joined to the big
  bands (lashes left alone), +3 px for the JPEG edge, filled with the stock skin with a 2 px feather; re-encoded with the
  sheet's own JPEG tables; the GLB's bufferViews repacked round the new image. The fixed layers keep teeth + tongue only.
  bake-mpfb.py UNDERWEAR is all () now. ASSET_MANIFEST.json shas updated (the bodies load as ?h=<sha>). sprites.js:
  mhChest 'band' dropped (enum nipples | smooth, a saved 'band' reads as nipples); getMhLookLayers no longer cuts the band
  rect and only composes for 'smooth'; the creator's Chest row is Nipples / No nipples.
- 11-01 THE CLASSIC JOINTS (plan row 14d; mondo 10:28: "the shoulders and wrists/hands got messed up for the mpfb classic male and
  female"): the first bake put the joints on the CLASSIC skeleton's spots, which sit elsewhere inside the limb than MPFB's, so
  MPFB's weights bent the shoulder round the wrong pivot (a fold) and the wrist pinched. bake-mpfb-classic.py step 2b: each
  joint moves by the mean move of the skin its bone + its parent own near it (Gaussian, r 5 cm, 9 cm on the spine) and turns
  as the line to its main child turned; the hands / feet are re-seated rigidly on the wrists / ankles found the same way from
  the forearm / shin skin; limb segments start at the uniform height ratio across (not the torso's width ratio).
- 11-01 THE IDLE FACE (plan row 21b; mondo: "yes lets add the idle blinking and movements"): _createAppearanceRig keeps 16 of
  an MPFB body's ARKit shapes (FACE_IDLE_KEYS: blinks, eyeLook*, browInnerUp / browOuterUp*, mouthSmile*, jawOpen) as
  `part.faceMorph` (the body geometry is rebuilt without morphs); `faceMorphWrite` puts them on the rebuilt body (base vertices,
  appended cut vertices 0) after each writeGeometry; the rig tick runs `faceIdle`: blink 70/40/120 ms every 2-6 s (15 % double),
  a glance every 1-4 s (saccade ~80 ms, a wide one may blink), brow drift + a lift every 7-17 s, a faint smile coming and going,
  jaw 2-3.5 % breathing. Each screen runs its own (cosmetic; not relayed). window.EW_DISABLE_FACE_IDLE = true turns it off.
  Shot: project files mpfb2-bodies/in-game/idle_face_frames.png.

## THE BLENDER COAT — a garment modelled in cloud Blender, not a shell off the skin (2026-11-01, character-models-plan row 12 pilot)

mondo 11-01: "building the clothes the packs dont have ... I'd like to see how one of those turns out and then id wanna
replace the classic clothes with the new way you make them in blender." The pilot is the trench coat. The classic coded
clothes are NOT replaced yet: he decides after the before/after shots (/mnt/project-files/blender-clothes/).

- **Tool:** `python3 -I bake-garment.py --mpfb /tmp/mpfb2 [--out charactercreation/wear] [--views dir]` (~1 min, bpy +
  MPFB2 as for bake-mpfb.py; `--views` writes body+coat GLBs per body for an offline look). Output
  `charactercreation/wear/ewb_trench.glb` (~566 KB, 15.4K tris) in the pack clothes' compact layout (POSITION = male,
  `_D_<BODY>` int16 offsets, `_N`, `_J`/`_W`) plus `_G` (baked shade -> vertex colour). R2 path
  `Assets/Models/charactercreation/wear/ewb_trench.glb`, listed in ASSET_MANIFEST.json.
- **How it is built (pattern pieces):** one wrap-around sheet (84 columns over 425°) whose rows follow the body's convex
  hull + ease (it bridges the hollows instead of hugging them), the outer front crossing over the under one (outer +6 mm,
  under -3 mm where covered), a V from two crossing edge functions, then sewn-on pieces: facings, lapels, collar, belt +
  buckle + tail, 6 buttons, epaulettes, pocket flaps, cuff facings + straps. Sleeves = rings along a rounded arm path.
  Below the hips the skirt flares 5 cm with soft cosine folds.
- **Every body:** built once per MPFB body through a warp into the male's frame, so all five share one topology (the
  `_D_` offsets). MPFB's own MakeClothes matching was tried first and crumpled the skirt on female/heavy.
- **Weights:** inverse-distance from the 6 nearest skin verts of its own part (torso + legs + the shoulder caps above
  the armpit for the body pieces; that arm for a sleeve). Below the hip joints (ramping in over 12 cm) the skirt hangs:
  pelvis 0.1 + thigh 0.9, the thigh picked by WHERE THE CLOTH HANGS (smoothstep ±8 cm at x = 0), so the crossed fronts
  move with the leg under them. What failed in the creator's wide idle stance: pelvis-only at the hips (legs poked
  through), thigh by panel (fronts split into flaps), the hang starting at the belt (the female belly folded in).
- **Hidden skin:** skin verts covered along the normal + any 2 of 4 tilts within 7 cm (above the belt + 3 cm, or on the
  arms). The coded tee on those triangles goes too, which is what stops it showing at the collar and armholes.
- **Game side:** sprites.js `EW_OUTER_STYLES` `btrench` "Trench coat (Blender)", `EW_MESH_OUTERS` + `getOuterMeshUrl`;
  three-renderer.js `CC_MESH_OUTER` (on the old Meshy MALE/FEMALE bodies the pick falls back to the coded trench),
  setWear loads it as `got['@outer']`, `buildWear` (`uv:'m'` -> x `CC_MESH_UV` 0.95, `_g` -> vertex colour),
  `paintMeshOuter` (the Outer fabric / tint / print). The classic MPFB bodies and the body sliders move it by body
  offsets AVERAGED over the skin within 5 cm (`nearSet`), not the one nearest vertex: two layers 5 mm apart picked
  different vertices and tore through each other on the classic body. Online: appearance already syncs; nothing new.
- **Next (row 12 / 4d):** the list thread builds the rest from this script; sway bones for coat tails come later.

## THE BLENDER CAPES — 4d batch 1: capes and cloaks built in cloud Blender (2026-11-01, character-models-plan row 12)

- **Tool:** `python3 -I bake-clothes.py --mpfb /tmp/mpfb2 [--out charactercreation/wear] [--only king,hero] [--views dir]
  [--tiles dir]` (~1 min for all 8). It imports bake-garment.py (the pilot: make_human, body_frame, warp/unwarp, Mesh,
  Surf, shade, hidden_skin, skin_weights, sleeve) and adds its own builders. R2 tiles it embeds (fur, fur_2, fur_3,
  leaves_3 from Assets/Sprites/terrain/) are fetched once into `--tiles` (urllib needs a User-Agent).
- **The capes (8):** `ewb_cape_{king,overlord,hero,sea,knight,hooded,leaf,fur}.glb` (160-265 KB). A cape is a sheet of
  columns across the back from one front edge round to the other (`e_top` / `e_bot` = how far round the front it
  reaches at the shoulders / the hem), its rows by arc length from the neckline over the shoulders to the hem, laid on
  THE FIELD: the body's convex hull + ease round an axis that follows the back above 1.36 m and hangs straight below,
  every angle below `hang` falling from the widest row above (+ flare), the shoulder tips rounded (`round_sh`) so no
  box corner shows. Then turned edges (hem + fronts) and extras: fur mantle / fur hem (a bumpy tube with the R2 fur
  tile), gold or silver clasp + chain, sea brooches, a stand collar (overlord), the hood lying down (hooded), loose leaf
  tabs (leaf), an edge-trim band (knight), a ragged hem (leaf).
- **Accents:** the GLB has one primitive per accent: primitive 0 = the cape cloth (painted by the Cape layer's fabric /
  tint / print like any layer), the rest (gold, silver, fur) keep their own material (and embedded JPEG tile). `own:true`
  (leaf, fur cloak) = the cloth keeps its own tile and the creator offers only a tint.
- **The sway:** `ewWear.sway = {parent:'Spine', chains:[[vertex index top→hem]...]}`, 7-9 chains across the back.
  three-renderer.js `wearChains` hangs `ewsway_c<100+>_<j>` bones on the parent at those vertices (after the body
  offset / classic reshape, so the joints sit where THIS body wears it); the cape's weights below the anchor row name
  `sw<chain>_<joint>` (blended between the two nearest chains, fading in over 10 cm). tick() swings them on CAPE_SWAY
  (pushed out of the hips-neck / thigh / shin capsules); THE SWAY's `colMin/colMax` keeps hair (90+) and capes (100+)
  on their own springs. `window.EW_DISABLE_SWAY = true` keeps them still. Cosmetic + local (nothing relayed).
- **The classic MPFB bodies:** a cape's hem hangs far from the legs, so the nearest-vertex reshape gave neighbouring
  hem vertices different legs' offsets and it tore; `ewWear.fitSmooth: 24` smooths the reshape offset over the cape's
  own surface (24 passes of neighbour averaging) before it is added. (Outer coats use the pilot's `nearSet` instead.)
- **Game side:** sprites.js `EW_CAPE_STYLES` (`bcape_<name>`, `look` = the colour + fabric a pick starts at),
  `getCapeMeshUrl`, `appearance.cape` + `capeFabric / capeColor / capePattern / capeColor2` (EW_APPEARANCE_LAYERS row
  `cape`, mesh only); party-builder.js "Cape" row after Outer layer (MPFB bodies only). three-renderer.js setWear loads
  it as `got['@cape']`, the layer's tile lives on `part.capeHold` (no coded shell), paintMeshOuter paints any
  `w.layer`. Online: appearance already syncs; nothing new.

- **THE DRAPE (2026-11-05, mondo: "fix all of the capes too, they are all fucked up and dont connect to the body properly,
  they are way too wide"):** every cape rebaked (`--only king,overlord,hero,sea,knight,hooded,leaf,fur`). Causes, all in
  `cape_sheet` / `Field`: (1) each top row was the convex hull of a 2-4 cm SLAB, and at the cape's fixed top heights
  (1.535-1.585 m) that slab already held the shoulder tops (the MPFB male's shoulder rises from the tip at 1.54 to the neck
  at 1.58 in 4 cm), so off the back centre the neckline lay out on the shoulder tips with a gap all round the neck;
  (2) `armx` 0.22 left the deltoid out, the cape cut through it and the shirt's shoulder came out through the cape (even
  standing still); (3) the cape over the shoulder rode only the collarbone / spine, so the shirt (on the arm) came through
  it when the arms came down from the bind pose; (4) the hang fell straight down from the shoulder tips (a box). Fixes:
  `drape` = above the hang height a row is the hull of EVERYTHING above it (thin bands, accumulated from the top: cloth laid
  over the body), so the rows lie on the shoulder slope; THE NECKLINE (`neck`, default on) = each column starts where that
  drape first stands `neck_gap` (2 cm) off the bare neck (the field's top row), never lower than the old `top` curve (the
  back of the neck falls straight into the back), capped at `top` + `neck_up`; `armx` 0.30 above `arm_z` 1.44 (the whole
  shoulder cap), `sh_ease` +3 mm over the shoulders, `round_sh` only below `sh_top` 1.50; `side_in` 0.25 m/m = below the
  shoulders the sides fall in toward the body (the back keeps its flare); THE SHOULDER CAP in `cape_weights` = above
  1.42-1.48 m the cloth takes the skin's own weights there, the upper arm's share included. The coats are untouched.
  Shots: /mnt/project-files/capes-fit/.

## THE BLENDER COATS — 4d batch 2: the long coats (2026-11-01, character-models-plan row 12)

- **Tool:** the same `bake-clothes.py` (COATS catalogue; `--only duster,tailcoat`). Each coat = the pilot's sheet with the
  cut as options (`coat_sheet`): `front` double / single / open (a gap) / closed (to the neck), `zb` the break, `hem`,
  `flare` + `back_flare`, `ease` / `waist_ease` / `skirt_ease`, `cut` (the tailcoat: the fronts cut away from the waist,
  the tails narrowing to the hem), `vent` (the back centre split below the waist: faces removed, the halves parted).
  Details: facings, lapels (notch / peak), collars (fold / stand / tall / popped / big), gold edge trim, belt + buckle,
  buttons (accent material), pockets (flap / patch / chest), epaulettes, cuffs (facing / strap / deep turned-back with
  buttons). Sleeves = the pilot's tubes; ring counts fixed so every body keeps one topology.
- **The coats (9):** `ewb_{duster,pirate,leather,longcoat,greatcoat,overcoat,frock,tailcoat,labcoat}.glb` (530-680 KB).
  Outer layer picks `b<key>` (sprites.js `EW_BLENDER_COATS`, `look` = the colour + fabric a pick starts at, applied by
  party-builder ccLayer on pick); three-renderer.js `CC_MESH_OUTER` gives each a coded twin for the classic Meshy bases.
- **Weights:** the pilot's `skin_weights` (THE HANG below the hips); the tailcoat's tails also hang on 4 sway chains
  (parent Hips), each tail on its own two (`split_phi`), fading in 10 cm under the waist.
- **The classic body / the sliders:** a long skirt hangs far off the legs, where `nearSet` finds no skin within 5 cm and
  takes the one nearest vertex, so the crossed fronts / facings 5-9 mm apart took different legs' offsets and showed
  through each other. `ewWear.fitSpatial: 8` = `spaceSmooth`: the offset field averaged 8 times over the garment's own
  vertices within 2.5 cm (any layer), for the classic reshape AND the body sliders (`w.ss` in wearFollow).
- **Gotcha:** a closed front's edge column gave the collar a zero normal -> NaN vertices -> the GLB failed to load (and
  the NaN broke hidden_skin + shade). The collar now falls back to out-from-the-axis; bake_coat asserts finite vertices.
- **Known:** on MPFB heavy a few specks of the coded shirt show at the shoulder tops / the belly under any Blender coat
  (the pilot trench too): hidden skin stops at the waist because it hides EVERY shell on those triangles (the
  trousers too).

## THE BLENDER ROBES — 4d batch 3 (2026-11-01, character-models-plan row 12)

- Same tool and path as THE BLENDER COATS (COATS catalogue, Outer layer picks): `ewb_{cassock,habit,cultrobe,anunnaki,
  succubus,raggedrobe}.glb` (600-700 KB). Ankle hems, wide sleeves = a large `cuff_ease` (the sleeve tube widens to
  the cuff), sashes / cords = `belt_on` with `belt_w` / `belt_t` and `buckle: False`, `ragged` = a torn hem (each
  column's bottom rows gathered up to its own tear height), a white Roman / habit collar = `collar_accent` on an
  `extra_accents` material. The nun's veil is NOT here (it stays with 4b).
- **Weights fix (all coats):** a button / belt / buckle below the hip joints took the body's skin weights while the skirt
  under it hangs from the thighs, so in a stride the cassock's skirt buttons smeared off the cloth. Each such solid
  piece (Garment.solids, recorded by disc()) now takes ONE set of weights: the nearest sheet vertex to its centre.

## THE BLENDER UNIFORMS — 4d batch 4a (2026-11-01, character-models-plan row 12)

- Same tool / path (COATS catalogue, Outer layer picks): `ewb_{police,general,turnout,riot,chef,gi,jersey}.glb`
  (385-550 KB). New options: `sleeve_rings` (a short / 3-4 sleeve = the first n of the sleeve's 28 rings), `pads`
  (shoulder pads: the shoulder rows pushed out at the sides), `bands` (stripes / plates round the body at waist + dz,
  over the outermost layer: coat_band), `sleeve_bands` (two-ring stripes n rings from the cuff), `badge`, `ribbons`,
  `sash_tails` (the gi's knot ends), `chest2` pockets, `front: 'open'` + `gap: 0` = a pullover (the jersey's V).
- **Hem height:** a hip-length top must end AT the crotch line (~0.91-0.93 m in the male frame): lower, the hem's centre
  (weighted half to each thigh) hangs down between the legs in the creator's wide stance.

### THE BLENDER TIGHT CLOTHES (2026-11-01, row 12 batch 4b; bake-clothes.py TIGHT)
- Football pants (`ewb_footballpants`, Bottoms), Wrestling singlet (`ewb_singlet`, Suits), Luchador mask (`ewb_luchador`, Masks):
  MakeHuman-clothes picks (sprites.js `EW_MH_WEAR.push` after the generated list), MPFB bodies + the two classic ones.
- Built FROM the body: hips + legs = each slab's convex hull + ease (`Legs`), cut at x = 0 into a left / right outer arc between the
  front / back seams; below the crotch each leg is its own tube (the crotch row's inner line = the gusset). The hips' last row and
  the legs' first are welded (one normal: no crease). Stripes are taken off the garment's own rows (halfway round the outer arc).
- The singlet's top = THE NECKLINE: each column's own top height (scoop front + back, deep armholes) by angle round the body; the
  front rises over a bust by how far the chest stands out past the breastbone on that body (0 on the male bodies, 7 cm on the
  female). Straps = rays over the shoulder in the planes x = +-0.098.
- The mask = rays from a capsule (a cylinder up the neck, a dome over the crown) onto the head + neck skin, dilated (thin ears),
  then TIGHTENED (a radius never more than 1.2 mm under its neighbours' mean: the fabric bridges the eye sockets, nose sides,
  under the chin). Eye / mouth holes = quads cut on the male build (the same on every body), edge vertices snapped onto ovals
  round the MakeHuman eye / lips helpers; trims + the crown stripe are overlaid bands.
- Weights = each body's own skin under the garment (6 nearest), averaged over the five. The skin hidden is PER BODY:
  `ewWear.delBy[<body>]` (three-renderer.js buildWear reads it; a classic body reads the body it was reshaped from), eroded so a
  skin triangle is dropped only when all its neighbours are covered (the game drops a triangle when ANY corner is listed).
- Paint: `ewWear.layer` = 'bottom' (pants) / 'top' (singlet) -> paintMeshOuter paints them with that layer's fabric / colour / print
  (setFabric repaints any wear on the layer when its tile lands). The mask keeps its file colours.
- Known: the MPFB female's painted bra shows at the singlet's armholes / back scoop; a speck of the coded Briefs at the front of the
  singlet on the classic male; hair draws over the mask.

## THE BLENDER COSTUMES — 4d batch 5a (2026-11-01, character-models-plan row 12)
- Same path as THE BLENDER COATS (bake-clothes.py COATS, Outer layer picks `b<key>` -> `ewb_<key>.glb`, EW_BLENDER_COATS `look`,
  CC_MESH_OUTER twin on a classic Meshy base): Santa coat (white fur trim down the front + hem, fur collar + turned cuffs, black
  belt, gold buckle), Robin Hood tunic (dagged hem, leather belt), Knight tabard (cap sleeves, back vent, red cross, gold hem
  only), Krampus fur coat (its own R2 `fur` tile, `own`: the layer colour only tints it; crossed leather harness, ragged hem),
  Fringe jacket (suede fringe rows on the chest yoke and the hem), Scarecrow tunic (sewn-on patches, rope belt, torn hem),
  Tattered shirt (zombie: open, short sleeves, torn hem), Clown suit (baggy, ruff collar, ruffled cuffs, pompom buttons).
- New coat options: `harness` (accent, width): two straps from the belt across the chest, over the shoulders, crossed on the
  back, each point on this row's own panel (past the row's front edge = the outer panel); `fringe` [(dz, x0, x1, length,
  accent)]: hanging strands from a line on the front; `emblem` [(dz, x, w, h, accent)]: a patch placed point by point at front x
  on whichever panel shows there (spans a closed front's overlap); `trim_hem`: the trim on the hem only; `own` {tile, tile_m}:
  the coat body wears its own R2 tile (like the fur cape). `ribbons` now take as many rows / columns as their size needs.
- A coat's belt needs a closed / single / double front (an open front has no cloth at phi 0). A hem at or above belt - 0.12
  makes the hang's smoothstep divide by zero (NaN): keep the hem below the hips (0.93 is the shortest so far).

## THE BLENDER SKIRTS — 4d batch 5b (2026-11-01, character-models-plan row 12)
- `skirt=True` on a COATS row: the coat sheet from the hem up to a waistband (belt line + `rise`, 5 cm), no sleeves / collar;
  `cat` / `z` / `layer` make it a MakeHuman-clothes pick (no coded twin, wear has no `outer`): Ragged skirt (demon F), Valkyrie
  skirt (pleats = fold_n 26, gold hem, leather belt), Linen kilt (Anubis; wrap front, gold belt), Loincloth (demon M, minotaur,
  goatman) -> `ewb_{raggedskirt,valkyrie,kilt,loincloth}.glb`, sprites.js EW_MH_WEAR Bottoms rows (z 48), painted by the
  Bottoms layer (`layer: 'bottom'`).
- THE SWAY round the hem: SKIRT_SWAY = 8 chains (3 joints from 10 cm under the belt line to the hem). `legs=True`: a chain over
  a thigh (|sin phi| > 0.3) hangs from THAT thigh, the front / back centre ones from the pelvis (ewWear.sway.parents, one per
  chain; three-renderer.js wearChains reads it, falls back to `parent`). All on the pelvis, the creator's wide stance pushed
  the thighs through the skirt. The loincloth hangs on 6 pelvis chains (front under / outer panel edges, back centre).
- `flaps` (dz, front half-angle, back half-angle): the loincloth drops every coat face under belt + dz outside the front / back
  windows, chosen on the male build and reused (one topology on every body).
- Leaf dress (fairy): an Outer pick (`bleafdress`), its own R2 `leaves_3` tile (`own`), cap sleeves, a torn hem, 70 loose leaf
  tabs (`leaves` (accent, count, seed): the cape's x_leaves on the coat sheet), the hem sways.
- Seen in the creator's wide stance: the front of any coat skirt stretches between the legs (the hang weights blend the two
  thighs by x), so a charge on the skirt front stretches with it: the tabard's cross stays on the chest.

## THE BLENDER COSTUME PIECES — 4d batch 5c (2026-11-01, character-models-plan row 12; the 4d list is complete)
All pack picks (sprites.js EW_MH_WEAR, `ewb_<key>.glb`), built by bake-clothes.py on the five MPFB bodies (one topology).
- TIGHT kinds: `mummy` (Suits 50) = a `legs` garment from the neck (`top_dz` 5 cm over the neck knot) to the ankle + `arms`
  (bake-garment.py `sleeve` rings at the body's own ease, `s0` = how far into the shoulder the tube starts) + `shoulder_turns`
  (straps over each shoulder, weighted to the arm) + `wraps` (`mummy_wraps`: a helix of strips round each tube, each strip's
  lower edge standing out over the next turn; turns per tube counted on the male, `_cache`). A few armpit skin vertices stay
  uncovered (the tube meets the body there).
- `ghost` (Suits 70): `build_ghost` = the Head capsule's dome over the crown, then per column (round the head's axis) the cloth
  hangs over the convex hull of every skin slab: the smallest concave majorant from the crown to the widest thing under it (the
  hands, in the bind pose), a little sag between supports (`sag`), straight down from there with `flare`; folds toward the
  hem, two black eye patches ray-cast onto the sheet. Weights = the nearest skin anywhere (no feet); below `anchor` (belt - 10
  cm) it fades onto 12 sway chains (`chain_overlay`; all on the pelvis: thigh-hung side chains flared the hem out like wings in the creator's wide stance). Hides all the
  skin under it (`maxd` 0.40).
- `dorag` (Hats 52): the Head capsule from a per-angle lower `edge` (brow at the front, the nape at the back) to the crown, a knot
  and two tails. `suspenders` (Equipment 60): two straps ray-cast in the planes x = +-strap_x, front waist -> over the shoulder
  -> back waist, silver clips. `scaleleggings` (Bottoms 47, Bottoms colour): ankle-length legs (`foot_z`; `xsec` = the skin's
  own edge cross-section where the lower shin's rings are sparse) + `leg_scales` (shingled tabs).
- COATS `skirt=True` with a high `rise` (a top above the hips): `bellytop` (Tops 52, Top colour; bandeau, gold bands, `coins`),
  `coinbelt` (Equipment 49, its own purple; a hip band hung with two staggered rows of gold coins, the count cached from the
  male), `offshoulder` (Tops 52, Top colour; a tube top with a folded collar and arm bands: `sleeve_from` / `sleeve_rings`).



## THE BLENDER SHOES — the Feet layer built as real shoes (2026-11-01, character-models-plan row 12c)
mondo 11-01: "what about shoes? can you redo the shoes in blender like you did the capes ... or were there no shoes and footwear
from those asset packs". The packs DO have footwear: shoes01 (23), shoes02 (24), shoes03 (12) + the system assets' shoes01-06 =
65, all already fitted in row 11 (creator CLOTHES > MakeHuman clothes > Shoes, MPFB bodies only, no colour pick yet). What he saw
was the Feet row: four coded shells pushed out from the foot's skin (CC_FEET sneakers / boots / highboots / sandals). Those four
are now rebuilt in Blender, + cowboy boots (no pack has them). The coded picks stay.
- **Tool:** `python3 -I bake-clothes.py --mpfb /tmp/mpfb2 --only shoe_sneakers,shoe_boots,shoe_highboots,shoe_sandals,shoe_cowboy`
  (~12 s each) -> `charactercreation/wear/ewb_shoe_<key>.glb` (130-470 KB), catalogue `SHOES`, builder `build_shoe_side`.
- **How a shoe is built (`FootLast`):** each foot in its own frame (A along the foot from the heel back, C across to the outer
  side, Z from the floor; the axis = the foot -> ball bones' line averaged with the footprint's long axis). THE LAST = the convex
  hull of that leg's foot / ball / calf skin below `z_cut` (+ added points: a roomy toe box lifts the toes' top, the cowboy's
  `point` draws the tip forward) pushed out by `ease` (planes moved out: exact ray exits, `_exit`). The sole outline = the
  footprint's 2D hull + ease + `margin`. Stations: 26 per side, cosine-spaced heel -> toe, the outer and the inner side at the
  SAME u (so the vamp's top line welds); a heel adds two stations 8 mm apart at `heel_u` (the breast). THE UPPER = one meridian
  per station, in the vertical plane through the foot's middle line (`spine`, clamped short of the heel / toe ends), from the
  welt (`welt` heights) up to the collar `clip` (low shoes: a plane from the heel back down to the throat's top, dipping under
  the ankle bones; boots: `join`) or over the top; 15 rows, smoothed 6 passes (no hull facets), never more than 2.2 mm inside
  the last. THE SOLE = its own accent: welt lip, side wall, underside strips (outer -> inner at the same station); `bottom`
  heights put it 2-3 mm under the floor where it stands, raised under the arch (boots / cowboy shank) and at the toe (spring);
  `inset_heel` tapers the heel stack. Sneakers: a rubber toe bumper (`toe_cap`), a padded collar tube, a tongue standing out of
  the opening. THE SHAFT (boots): rings round the leg (`FootLast.ring` = the skin's own edge cross-section at that height, the
  shin's rings are far apart, + ease + 2.2 mm), centres + radii smoothed in height (`shaft_table`), the front edge carried
  down 3.2 cm over the instep (no gap at the ankle's front), a turned facing at the top, a top band, the cowboy's scalloped top
  (front + back dips), pull tabs + three rows of stitching a side, the high boot's back pull strap. LACES: eyelets (discs) at
  +-w across a spine up the vamp (and the shaft front on boots), criss-cross tubes lifted off the surface. SANDALS: no upper;
  the sole + two cross straps + an ankle strap + side / heel straps + a buckle (the skin stays: toes show).
- **Every body:** built on each of the five MPFB bodies' own feet (no warp; every grid has fixed counts, so one topology), welded
  where all five agree. Weights = the 6 nearest skin vertices of that leg's foot / ball / calf (the toes bend the toe box),
  averaged over the five. Hidden skin per body (`delBy`, tight_hidden over the foot / ball / calf, 4.5 cm), which also drops the
  coded trousers on those triangles (a boot's shaft reads as tucked in).
- **Game side:** sprites.js `EW_BLENDER_FEET` (ids `bsneakers` `bboots` `bhighboots` `bsandals` `bcowboy`, pushed onto
  EW_FEET_STYLES; `look` = where a pick starts: cowboy = tan leather), `EW_MESH_FEET`, `getFeetMeshUrl` (also warmed by
  getCharacterAppearanceAssets). three-renderer.js `CC_MESH_FEET` + `_ccFeetDef(id, part)`: an MPFB body wears the GLB (setWear
  `got['@feet']`, ewWear.layer `feet` -> paintMeshOuter paints it with the Feet layer's tile / tint / print from the feet shell's
  material), a classic Meshy base cuts the coded twin. The two classic MPFB bodies wear it through the reshape (`fitSmooth` 6).
  Online: appearance already syncs; nothing new.
- **Trousers under a boot:** the coded trouser leg's hem ring stood out over the instep through the shaft, so a Blender boot cuts
  the coded bottoms' hem just under its top (three-renderer.js `CC_MESH_TUCK`, in the shells' t: 0.135 t = the 16.5 cm boot)
  and its shaft has `shaft_ease` room. Pack jeans (real meshes) still sit over a shaft.
- **Checked** in the real creator stage (Chrome, swiftshader) on MPFB male / female / heavy / thin / short / classic male /
  classic female: /mnt/project-files/blender-clothes/shoes/shoes_before_after.jpg. Known: a small step where a boot's shaft
  meets its foot at the ankle's front (the shaft is a separate ring piece 6-8 mm out).

## THE SOLID PIECES (2026-11-01, character-models-plan.md row 16)
bake-clothes.py `SOLIDS` = mondo's own rigid pieces (a .blend / .fbx + his textures from R2, nothing generated) fitted onto
every MPFB body and written as a pack-wear GLB (`charactercreation/wear/ewb_<id>.glb`, extras.ewWear `solid: true`,
skinned 100 % to one bone) that the creator lists like any pack piece (EW_MH_WEAR). `python3 -I bake-clothes.py --mpfb
/tmp/mpfb2 --only <id>`.
- `load_solid`: appends the object (libraries.load, `matrix_basis`), flips v, levels the band ring (the inner rim) to +Z,
  centres on the crown, band bottom at z = 0, turns the lower-dipping brim end to the front.
- `fit_solid` per body: the hat line = eye + `line_k` × (crown − eye); the head's slice radius per 10° sector there; scale
  = max over sectors of (head r + `ease`) / (crown r − `thick`); `tilt` lifts the front (worn pushed back, the face shows).
- `bake_solid`: texture = base × (0.45 + 0.55 × occ), 1024 JPEG; bone Head.
- First piece: Cowboy hat (`ewb_cowboyhat`, Hats, z 56): 2020 tris, 311 KB; scales male 0.931, female 0.859, heavy 1.101,
  thin 1.105, short 0.791; ≥ 1.5 cm clearance on all bodies, front brim 3.4 cm above the eye. The hat's underside floor
  across the crown opening stays (hidden inside the head).
- THE WORN HATS (2026-11-03, mondo: "make it look more realistic/weathered/worn/textured. Like look at the cowboy meshy model
  and his hat"): Meshy Retexture API (POST /openapi/v1/retexture, his hat GLB as a data URI, `enable_original_uv: true`, 10 credits)
  paints a 2K base colour on HIS UVs; Meshy's own re-exported mesh (4 vertices fewer, rescaled) is never used: the texture goes
  through bake_solid like his own (`SOLIDS` cowboyhat_worn / cowboyhat_worntan: `tex` = R2 wear/cowboyhat/textures/
  Cowboy-Hat_meshy_worn_dark.png / _worn_tan.png, `occ: None`). Same mesh, same fit, every vertex the same as `ewb_cowboyhat`.
  All the tries + the sheets: /mnt/project-files/meshy/retexture/cowboyhat/ (mondo picked F + H of round 2; the best match to
  the Meshy cowboy's hat came from `image_style_url` = a render of that hat).
- THE BAND TINT (2026-11-03, mondo: "change the color of the band and the hat separately"): `band_tint: True` writes the
  `band_mat` faces as accent primitive 1 (write_glb `FA`, a per-face accent; same texture; ewWear.band = 1). three-renderer.js
  paintWear colours it from `appearance.wearTint['<id>:band']` like the hat from `wearTint[id]` (none = its own texture); sprites.js
  `EW_WEAR_BANDS` lists the hats with a band (normalizeWearTint keeps their ':band' key); the creator's colour row for the hat
  gets a second block, "Band". The band no longer follows the hat's colour. The band faces are the thin strip of his band
  material; the worn textures paint the band a little wider, so a sliver of painted band takes the hat's colour.
- Held props of a race look (`RACE_CREATOR_LOOK_DEFS.hold`): `_unitAttachHeld` now also reads catalogue rows with base
  `weapons` (`_R2_WEAPONS`), so the R2 revolver works as a hold.

## THE BLENDER BASICS (2026-11-02, character-models-plan row 12f)
The retired coded clothes with no pack match, built with bake-clothes.py (`--only longsleeve,henley,sweatpants,jacket,blazer,vest,cardigan,belt,tie,bowtie`):
- COATS: `longsleeve`, `henley` (front 'seam' = a pullover, closed crew neck `COLLARS['crew']`, the henley's placket = an emblem + 3
  buttons; hem 0.965 so it never hangs between the legs), `jacket`, `blazer`, `vest` (`sleeveless` + `armholes` (z, x): the sheet's
  sides above the armpits cut away, chosen on the male like the loincloth's flaps), `cardigan`, `belt` (skirt mode, rise -0.035,
  `buckle_at` = coat_buckle on the band; `keep_above` 1.0 hides no torso skin).
- TIGHT: `sweatpants` (legs to the ankle, ease 1.1 cm), `tie` + `bowtie` (new kinds: build_tie ray-casts the front surface across
  ±8 cm, hangs at most 25 cm/m back toward the body, a closed knot; build_bowtie = two pinched loops + a knot band; both weighted to
  spine_03 / neck / clavicles, hide no skin, tintable).
- Files charactercreation/wear/ewb_<key>.glb, in ASSET_MANIFEST.json. charactercreation/mpfb/mpfb_classic_fit_<g>.glb (bake-classic-fit.js) too.

## THE JIGGLE — chest + glute spring bones on the MPFB bodies (2026-11-02, plan row 11d)
mondo 11-02: "similar to the capes and the hair, can we add jiggle physics to the boobs and butt? In the character creator".
- three-renderer.js `_createAppearanceRig`: `jigExtend(mesh)` runs in the part setup of every MPFB body (part.stock: the five
  MPFB bodies, the three MPFB female ones, the two MPFB classic ones), BEFORE the garment shells bind, and rebinds the body to its
  skeleton + 12 bones `ewjig_<chestL|chestR|buttL|buttR>_<bone>`: one child of each bone that carries that spot's skin (the
  chest: Spine / Spine01 / Spine02 — MPFB breasts are 94 % Spine; a glute: Hips / Spine02 / that side's UpLeg — about half and
  half Hips + UpLeg). Each sits at its parent's origin with the parent's bind inverse, so at rest it skins exactly like the
  parent; every later skeleton (the hair chains, the cape chains) is a concat of this one, so the indices agree everywhere.
- `jigWeights(part)` (from tick() whenever part.jig.dirty: set at the end of update(), after a hair build, after the clothes
  apply) finds each spot on the shaped skin (the front-most vertex of each breast at 0.66..0.80 of the height, the back-most
  of each glute at 0.42..0.56, off the arms), then for EVERY skinned mesh on that skeleton (skin, coded shells, pack +
  Blender wear and accents, hair) moves f × the weight on the spot's bones onto their jiggle bones; f = a round fall-off
  (sigma 5 cm chest / 6 cm glute, per 1.7 m) × a depth ramp (0 at the body wall 7.5 / 7 cm behind the apex, 1 at the apex and
  anything outside it, so a coat front over a breast rides it fully). It first folds any jiggle weight back onto its parent,
  so it can run again after any rebuild and never stacks. A garment over a spot therefore moves with the skin: no clipping.
- `jigTick(part, dt, a)` (in tick(), after the hair / cape sway): per spot a world-space damped spring (chest 3.2 Hz, zeta 0.2;
  glute 3.6 Hz, zeta 0.25) toward where the skin sits this frame; the skin's path is cut into the 1/120 s steps and the
  damping works on the speed RELATIVE to the skin, so a steady walk / run / the turntable leaves no lag; only changes of speed
  swing it. Shown offset = lag × gain (gain = 2 × the slider, 3 × on a glute; a male body's chest × 0.35; a female chest × (1 + 0.4 × Bust)),
  sideways / front-back × 0.7, eased (tanh) to a cap of 4.5 cm chest / 3 cm glute per 1.7 m; written into each jiggle bone
  through its parent's own frame. A frame over 0.25 s resets the spots at rest (no snap after a hidden tab).
- appearance.jiggleChest / jiggleButt (sprites.js EW_APPEARANCE_LIMITS, 0..1, default 0.5); creator BODY > Jiggle (Chest,
  Butt) on MPFB bodies. Cosmetic and local (RULE #2: each screen runs its own; the look already syncs). Every stage that ticks
  the creator rig gets it (the board, the unit viewer, the HQ cast, the line-ups). Kill switch window.EW_DISABLE_JIGGLE = true
  (before the model loads = no bones, weights untouched; set live = the spots go back to rest and stay there).
- Proof: before / after sheets in /mnt/project-files/jiggle/ (the same instant rendered with the jiggle and with every jiggle
  bone at rest, idle and walking). Probe = a scratch Playwright page through playtest_creator.js's routes, DOOR Agent slot >
  GEAR > CHARACTER CREATOR > MPFB FEMALE, EWCharViewer.dev.model() for the bones, EWCharViewer.snapshot({yaw}) per frame.

## THE MESHY OUTFITS (2026-11-12, character-models-plan.md row 21d)

mondo 11-12: "i like route 2 better" + "Go". A unit's own clothes, remade by Meshy as separate shells, worn on the MPFB body so the
head is the MPFB head (67 face shapes, eyes, teeth, tongue). Meshy models stay the units' defaults.

- **The remake** (15 credits, ~1 min, Meshy API through the proxy): `POST /openapi/v1/image-to-3d` with a front render of the old unit,
  `model_type: smart-topology`, `ai_model: meshy-t2`, `texture_model: meshy-n1`, `pose_mode: a-pose`, `target_polycount: 15000`.
  One GLB object made of loose shells. `meshy-t2.5` does NOT separate. No body under the clothes.
- **`bake-outfit.py`** (repo root; `pip install bpy==5.2.3 scipy pillow`; reads the five `mpfb_<body>.glb` from R2 copies):
  `python3 -I bake-outfit.py --name cowboy --label Cowboy --gender male --src cowboy_t2a.glb --bodies <dir>` writes
  `charactercreation/wear/ewm_t2<name>_outfit.glb` (+ `_hat.glb`) through bake-clothes.py `write_glb` (compact layout, `solid`,
  `del` = the hm08 skin indices under the cloth). Steps: scale by the eyeball shells; cut the skin-coloured faces off the face shell
  (flood fill) so the collar stays; drop bare hands + the unit's hair (the look picks pack hair); size hats to the MPFB head; aim the
  body's arms + legs down the sleeves, copy the posed body's weights, un-skin to rest; loose cloth off the legs (a skirt, a cape)
  shares its leg weight between both legs + the hips (env LOOSE0 / LOOSE1 / LOOSEHIP); the other four bodies = the offsets of the 12
  nearest skin vertices. Env knobs: SKIN_T, S, HS, SY, SZ, BRIM, BRIMHI, SCALP, RAY_OUT, RAY_LEG, RAY_IN, ALLHIDE.
- **Gotchas**: Blender's UV v is 1 - glTF's (a scrambled texture = that); a robe needs RAY_LEG (45 cm) or the legs show through it;
  tall boots under a robe poke through when the leg swings; `new_from_object` needs `preserve_all_data_layers=True`.
- **Boots (11-12, PR after #1153, mondo: boots distort on the walk + "pointy things sticking out the back")**: a shell on ONE side of
  the body (boot, greave, gauntlet, holster) is never loose cloth (its sole stood far off the skin, so the loose rule gave it to the
  hips + the other leg); footwear's toe weight goes to the foot (a stiff sole); a spur (Meshy fuses it to the boot as a horn) is laid
  flat on the heel (env SPURS=0 keeps it). The remade button no longer needs a RACE_CREATOR_LOOKS look (knight + wizard had none).
- **Round 3 (11-12, mondo: wizard "two pointy parts near his butt", knight "slivers of skin outside of her boots")**: THE SLEEVE TEST
  (cloth keeps arm weights only when the mesh's own edges join it to the cloth round the upper arm; the skirt beside the hanging hands
  had the hand's weights; env SLEEVES=0 off) and a thigh / calf that is 70 % under cloth is hidden whole (LEGHIDE). TRIED AND DROPPED:
  a ray test for "round the arm" (cuffs failed it and flared into plates) and aiming the forearm at the sleeve's middle (tore the
  cowboy's shoulders). His "elbows bending backwards" on the wizard was not seen again after the sleeve test; unconfirmed.
- **Round 4 (11-12, mondo: "fix the wizards tall boots showing through his robe")**: THE CLOTH OVER A LEG. LOOSE CLOTH shared the skirt's leg weight evenly between both legs + the hips, so the robe front stayed behind when a leg stepped forward (Idle_11 stance, every stride) and the boot shaft came out through it. Now only the cloth BETWEEN the legs is shared (|x| under 3 cm full, fading out by 9 cm: LOOSEX0 / LOOSEX1 / LOOSESIDE 0.7); cloth in front of, behind and outside a leg keeps most of that leg's weight. Tried first and dropped: cutting the boot tops under the hem (bare shin showed in the same place). All three rebaked; cowboy coat tail + knight cape checked from four sides + walking. Proof `/mnt/project-files/meshy-parts-20261112/wizard_boots_fixed.jpg`.
- **Batch 2 of 3 (11-13, mondo: "make new models for all of the units ... see what is available from the clothes in the character creator ... meshy for parts and pieces we don't have")**:
  glitch .. police officer (meshy-remake-batches.md), 25 models, `RACE_REMADE_LOOKS` rows + per-unit commands in meshy-remake-plan.md section 8.
  The five with a saved creator look (halfdemon M + F, mad scientist M + F, men in black) used NO Meshy: the saved clothes on the MPFB body +
  the unit's face. Creator pieces picked over the T2 ones: ice crown, overlord helmet, mushroom cap, beret, tricorn (M), luchador mask, police
  badge, fishing hat (hippie M), a tank top (marksman F), Feathered wings (nephilim). New in bake-outfit.py, off by default: env `EYEH=<0..1>`
  (NO EYE SHELLS: Meshy fused the eyes into the face under a hat's shadow twice running on the pirate; the eyes' height as a part of the
  figure's). Lessons: a garment the colour of the unit's hair is dropped as A HAIR LOCK (`LOCKS=0`: ice queen bodice, overlord armour, glitch
  body); a top PAINTED on the T2 body shell cannot hold the MPFB bust (marksman F): wear a creator top over it; the look probe
  (`look.js`) must block the world preload (every non-character GLB / audio request) or the viewer takes minutes, and wait for the
  host's `ew-cv-ready` class, not a fixed time; three browsers at once is the most 16 GB holds.
- **In the game**: sprites.js EW_MH_WEAR rows `ewm_t2*` (outfits are category `equipment`, shown on the Armour tab; hats on Hats),
  `RACE_REMADE_LOOKS` + `getRaceRemadeLook(race, gender)`, party-builder.js USE THE REMADE <RACE> LOOK (beside USE THE SAVED LOOK) and
  REMADE LOOK inside the creator. The race's default idle can crouch a creator rig (knight, wizard): the looks carry `idle: Idle_11`.
- Sources kept: /mnt/project-files/meshy-parts-20261112/ (the three T2 GLBs, the in-game sheet, scripts).
- **Batch one of the demo starters (11-12, mondo: "demo starters is good")**: zombie (F), catgirl (F), robinhood (M), quarterback (M):
  `ewm_t2zombie_outfit`, `ewm_t2catgirl_outfit` (+ `_hat` = her black ears, on the Hats tab, not in the look: his saved catgirl look has
  its own ears), `ewm_t2robinhood_outfit`, `ewm_t2quarterback_outfit` + `_hat` (the helmet). Sources + look check sheets:
  /mnt/project-files/meshy-remake-batch1/. The djinn was REFUSED twice by Meshy's safety check (`provider_content_refused`, a bare chest); not worked around.
  New rules in bake-outfit.py (all seven units rebaked with them, cowboy / knight / wizard rechecked from four sides + walking):
  THE GLOVE ON A BARE HAND (a skin-coloured hand shell loses only its skin faces when 150+ glove faces are left: fingerless gloves; env GLOVE),
  A FLAKE (a shell under 30 faces and 4 cm, off the head, is dropped; env FLAKE), `--headgear` (a helmet / cowl that reaches below the eyes is
  the hat, not hair, and is not lifted like a brim; the look picks `hair: 'bald'`), THE HAND IN A BIG SHELL (cloth tight round the wrist + hand
  stays on the arm even when the shell is not joined to upper-arm cloth; env WRIST / WRISTR), THE SCALP UNDER A HOOD (the crown is hidden under
  the outfit's own hood when 60 % of it is covered; a high collar is not a hood; env HOODZ / HOODMIN), A TORN FACE (a face whose edge grew 3x
  and past 6 cm in the un-skin is left out; env TORN). Tried and dropped: a "skin chip" rule (small skin-coloured shells): it took pieces of
  the knight's armour and the zombie's rags.
  Gotchas: Meshy's T2 run varies: robinhood's first run fused a bow string into his hand + skirt shell (a second run was clean). The zombie's
  whole bloody skin comes as shells and is worn as clothes over the hidden body (her hands too); the look's skin is `sohh_female_zombie_skin`.
  A front render should be cropped to the figure before it is sent (the first four went out small in the frame and still worked).
  A HAIR LOCK (11-12, mondo: "some sort of strip hanging off the back of the [zombie]'s head and back"): a shell under 600 faces in the
  unit's hair colour that reaches the head is hair too and is not exported (env LOCKS / LOCKN / LOCKT; off under --headgear).
  THE BARE NECKLINE (11-12, mondo on the catgirl: "the necklace looks messed up or painted on"): Meshy gives the bare skin in a low
  neckline as part of the top's shell with the necklace smeared into its texture, and the choker as spiky shards. `--neckline` (catgirl
  only) cuts the skin-coloured faces from the chin to the bust (flood from the throat) + what they enclose + the small shells round the
  neck, so the body's own skin shows; her look wears his saved look's `ewm_crosspendant` (+ its tint, + its code cord). Also in A HAIR
  LOCK: what is left of the face's own shell in hair colour is hair at any size, and HAIR FUSED TO THE CLOTHES (hair-coloured faces of
  other shells above chin - 5 cm, env LOCKZ) is cut (catgirl 48 faces, knight 1). Left: the top's own neckline edge is jagged.
  ROUND 3 (11-12, mondo: "what are all those jagged black spots around her neck"), all under `--neckline`: (1) THE THROAT: everything
  in front of the neck (NECKX each side, chin to NECKCUT under it) goes: the neck in the chin's shadow, the painted straps. (2) THE
  LONG HAIR: her waist-long Meshy hair is one 2,580-face shell that is not a head piece (the "hair shells" the bake found were her
  ears, so the hair colour test never matched): a shell reaching above the eyes with a fifth of it above the chin is hair; only its
  part down her back stays (HAIRBACK/HAIRTOP: Meshy made no jacket under it, without it her back is bare patches), and on any other
  shell everything above the chin goes. (3) THE CLEAN NECK OPENING: the jacket's inner edges are re-cut straight (bisect planes, SCX
  each side, SCZ above the top's edge). (4) THE SKIN AT THE OPENING'S EDGE: most of the "black spots" were NOT cloth: a body triangle
  with one hidden corner is not drawn, so skin hidden under the jacket's edge bit saw teeth into the open chest and the jacket's
  black inside showed through. The shown skin now grows OPENRING (3) rings under the edge (skin with cloth straight in front, or
  inside OPENX2 with no same-facing cloth under it). Lesson: before cutting cloth, render the outfit GLB alone; if the teeth are not
  in it they are holes in the body. Left: 3-4 small notches on her right collar with the hair off, one skin triangle on her left
  shoulder, the cross of the pendant sits under the top's edge (the cord shows).
  A PAIR OF LEGS (11-12, mondo on the catgirl: "she has her heel sticking out of the back of her boot"): it was the skin chip by her
  left boot. Not cloth: her right calf was 71 % under the stocking (hidden whole, LEGHIDE 0.7), her left 68 % (shown), so the back
  of the left ankle stood outside the boot. When one leg of a pair is hidden whole the other is too from LEGPAIR 0.5 on. All seven
  remade units rebaked: only the catgirl's file changed.
  BATCH TWO (11-12, mummy F + angel F; mondo "whats the progress of the other units"), four new bake-outfit.py flags, all off by
  default (the nine earlier units rebaked: no file changed): `--longhair` (a shell that reaches above the eyes with a fifth of it
  above the chin is hair and goes whole; the look wears a creator hair), `--bodysuit` (mummy: bandages the colour of her skin, the
  colour flood took her chest wraps or nothing. No colour cut: the head goes from BSNECK under the chin, the hands past BSHAND of
  the arm span, everything else, painted skin included, is the suit; the body's skin above the collar + two rings is shown),
  `--nowings` (angel: shells wholly behind her back are left out, the arm span and the centring ignore them: Meshy centres the model
  wings and all, so her dress sat 20 cm in front of the body until it was moved back onto the body's eyes and the floor), `--barearms`
  (a sleeveless dress: skin-coloured faces out from the middle go, not the feet). Angel input: render on a DARK background, on
  light grey her white wings came back dark blue. Commands: mummy `--longhair --bodysuit`; angel `SKIN_T=0.3 LOCKZ=0.25 LOCKT=0.3
  ... --longhair --nowings --barearms --neckline`. Looks: mummy = suit + mh_long01 black; angel = dress + creator Feathered wings +
  mh_long01 blond. Left: see the status table in meshy-remake-plan.md.
  BATCH TWO, ROUND 2 (11-12, mondo: "the mummy bandages and the angel neckline definitely need work"; the nine other units rebaked: no
  file changed). MUMMY (`--bodysuit`): A HANGING END (a shell under BSSTRIP 500 faces hangs stiff from the ONE bone its top is on:
  weighted vertex by vertex its top went with the arm and its tip with the hips, the torn middle was left out and the tip floated by
  her hand), A CUT-OFF BIT (what a torn face cuts off its shell, under BSCHIP 40 triangles, goes with it), BSSPIKE (a face un-posed
  up past the collar is torn: the strip to her chin), THE BACK UNDER LONG HAIR (with `--longhair`: between the shoulder blades the
  suit lies no more than BSBACK 6 mm off the body; Meshy modelled it round her own hair and the lumps stood through the creator hair
  as tan flecks). ANGEL: new flag `--repaint` = PAINTED OVER (faces painted in her hair's or skin's colour take the colour of the
  nearest plain cloth: their UVs go to that face's middle, no texture is repainted. Cutting them out with LOCKZ 0.25 was the ragged
  neckline and the hole in the bodice; REPWARM adds "redder than blue"; a whole shell in skin colour = her bare legs under the skirt,
  the "skin patch on the back of the skirt", is left out). With `--barearms --neckline`: THE ARM OPENINGS + THE NAPE (straight cuts
  AHX out from the middle above AHZ, and behind the square neck above NAPE; tooth triangles with two free edges go, EARS; long faces
  cut up, STRAPSEG), THE STRAPS ON THE SKIN (cloth from BAZ up lies STRAPOFF 10 mm outside the body and takes the weights of the skin
  under it: with the arm's weight taken off, her shoulder rose through the strap when the arm came down), shown skin grows BARING 2
  rings round the arm openings, flaps past the arm opening after the un-pose are left out (AHPAD). Angel command now:
  `REPWARM=0.08 LOCKT=0.3 SKIN_T=0.3 ... --longhair --nowings --barearms --neckline --repaint` (no LOCKZ).
  ROUND 3 (11-12, mondo "keep improving them"): the teeth on the back of the angel's dress behind her right arm were not in the cloth,
  they were WEIGHTS: the back panel beside her arm took the weights of the arm skin nearest to it and stood out in spikes when the
  body was un-posed. THE STRAPS ON THE SKIN now takes the weights of the nearest skin that is NOT arm (kdb / noarm), for all cloth
  within STRAPNEAR 8 cm of the skin (was 3 cm: a seam of two kinds of weights ran through the arm opening); BARING 1 ring. ONE SIDE
  LIKE THE OTHER (MIRD: a face out past the neck stays only when its mirror lies on cloth) is in but took 4 faces. Tried + dropped on
  the mummy: a straight bisect of the collar (a spike stood up from her chest; her uneven collar is the suit's painted skin against
  the body's, not shape) and `skinTint: pick` (paints her whole skin one flat colour, face included).
  ROUND 4 (11-12, mondo after his playtest: "Robinhood has his shoulders and ear skin sticking out. Catgirl has a weird piece of
  floating skin under her crotch"; he put a creator goddess dress on the angel himself). ROBINHOOD, now `ARMSKIN=0.35 ... --barearms`:
  his bare arms were a shell of their own, exported as pink painted cloth with the body's shoulders standing through it. THE BARE
  ARMS IN ANOTHER SHELL (skin-coloured faces out from the middle go in every shell whose skin faces lie ARMMEAN 20 cm out on
  average, so not the quiver's leather; ARMSKIN = that colour match, his arms are paler than his face; islands under ARMISLE go),
  and without `--neckline` the body's upper arm + shoulder skin is shown whole, hidden only within SHNEAR 1.2 cm of cloth (the arm
  bands): the hidden skin under the cape's edge had bitten a jagged hole into the arm. The dress rules of round 2/3 (straps, arm
  openings, BARING) now need `--barearms --neckline` together. THE EARS UNDER A HOOD: under a real hood the head from HOODEAR 7 cm
  out to each side, behind the face, is hidden. CATGIRL, now `SKINISLE=200 ... --neckline`: A FLOATING PIECE OF SKIN (a patch of
  shown skin under SKINISLE vertices cut off by hidden skin is hidden; the skin between her legs is on the hips, not a leg).
  The seven other units rebaked: no file changed.
  Open: a few skin flecks on robinhood's hood front, a skin chip by the catgirl's left boot, light patches on her sleeves (the lacing in
  Meshy's texture), the knight's and zombie's walk hunches (the race's own walk clip), no sway, stock faces until the face step.

- **BATCH 1, HIS REVIEW (11-13, twelve pinned notes on the contact sheet; flags per unit = /mnt/project-files/meshy-remake-b1/scripts/rebake.sh)**. New bake-outfit.py envs, all off by default:
- **BATCH 1, REVIEW ROUND 2 (11-13, five more pinned notes)**. `SNUG=1` (THE SNUG WAIST: trouser shells, the ones that reach below the knee, are drawn in toward the skin between the knees and SNUGTOP 0.22 over the hip joints, gap x SNUGK 0.3, fading to the knees; between the legs only front to back, else the seat's seam opens; jackets / coats / belts untouched) on gangster, conspiracy, general, clown. `HATMIRROR=1/-1` (the hat's +x / -x half copied across: the demon princess had a stray shard beside her left horn, -1). Bunny girl = creator clothes only now (his: "it needs to be a tight tucked in top", "ankles/legs messed up/not in boot"): One piece bikini01 under Female short jeans + Biker boots female, all tinted #141416, T2 ears kept; her T2 outfit file stays in the catalog, unworn. Sheet batch1_review_round2.jpg.
- **BATCH 1, REVIEW ROUND 3 (11-13, demon princess: "her butt and back is sticking out the back of the dress", "her arms are not in the sleeves")**. The back was BODY SKIN standing through the dress (not a hole in the cloth): `RAY_IN=0.12` hides it. `NOARMS=1` (NOARMW 0.6): every cloth face that rides the arms + hands goes and the arms' skin shows; Meshy's long gloves were torn strips hanging beside her arms. The look wears creator Gloves long tinted #141416 in their place. Left: a few pale flecks at the bodice's left edge, bare skin at her side under the arm.
  `NOHANDS=1` (+ `NOHANDW`): THE BIG ONE. A unit whose T2 hands were more than 35 % "under cloth" had the BODY'S hands hidden and wore Meshy's fused fingers ("fingers look messed up"; the whole point of the remake is the MPFB fingers). With it the outfit's faces that ride the hand + finger bones go and the body's hands always show. On: annunaki, conspiracy, cowgirl, fallen angel, fortune teller F, gangster, general (NOHANDW 0.3: cuff shards), ghost F. NOT the giant (his painted tattooed arms end in pale body hands) or a unit in gloves.
  `WINGKEEP=1`: a wing shell's faces round the neck stay (the annunaki's gold collar was one shell with his wings and went with `--nowings`). `NOHELD=1`: every face out at the hands goes (his rule: no weapons in an outfit; the cowgirl's hand revolvers turned out to be the game's own held weapons). `LOCKREM=0`: the face's own shell is never a hair lock (demon princess: her bodice). `SHELLS=1` prints every shell as the sorter sees it. + a shell wholly above the brow or with its middle above the eyes, out to 0.3 m, is headgear (the bunny girl's second ear went as 'long hair'; a demon's curled T2 horn stayed in her outfit beside the creator horns).
  Bare skin Meshy modelled (thigh patches, a leg in a slit, shoulders): `ARMX=0 ARMZ=2 ARMMEAN=0 --barearms` cuts every skin-coloured face anywhere (bunny girl, fallen angel, demon princess); T2 hair fused to a dress: `--longhair` (+ `--neckline SKIN_T=0.32` on the fallen angel; `--neckline` tore the demon princess' gloves, not used).
  Looks: annunaki without the creator collar; astronaut `ewm_t2astronaut_hat` = the creator Astronaut helmet grown x1.32 about a point high in it (astro_helmet.py in the scripts folder; the creator one ends at the nose on an MPFB head; a `--headgear` rebake of the astronaut overwrites it); barbarella without the thigh holster (a gun); bunny girl + black short jeans; chef bald under the hat, general mh_short04 (HAIR UNDER THE HAT pulls fuller styles in and bares the scalp); giant mh_short04 + Viking beard; gangster red do-rag + gold cross on THE CHAIN (three-renderer.js WEAR_CORD.chain: a pendant that wears a wearTint hangs from a metal chain in that colour, 2.2 x the cord). Left + told him: demon princess bare patch low on her back + tatters at the shoulders; the giant keeps Meshy hands.
- **BATCH 1 OF 3 (11-13, mondo: "new models for all of the units ... see what is available from the clothes in the character creator ... meshy for parts and pieces we don't have"; split in meshy-remake-batches.md)**: 19 remade looks (annunaki .. giant; status + per-unit flags in meshy-remake-plan.md section 8). CREATOR FIRST: headgear, props and wings are creator pieces wherever one exists (Anunnaki headdress, Egyptian collar, Astronaut helmet + backpack, Firefighter helmet + air tank, Officer cap, cowboy hat, headset, Feathered / Fairy moth wings); chef and barbarella wear creator clothes only (their T2 clothes were worse); the demon keeps his saved look's body + horns + ears. Sources: /mnt/project-files/meshy-remake-b1/ (T2 GLBs, eyes.txt, units.json, the scripts).
  New in bake-outfit.py, all OFF unless asked (the earlier units' bakes are unchanged): `EYE=x,y,z EYEW=` = THE EYES GIVEN (the middle between the eyes in the T2 file's own coordinates; the figure is moved onto the middle line; tiny shells at the eyes go). Found by `bake-t2-eyes.py` (repo root) (a face landmarker on a front drawing of the T2 head). Why: Meshy's eyeball shells are missing on about a third of runs and earrings / buttons pass for them (atlantean scaled to her earrings, bunny girl half size). NO EYEBALL SHELLS and no EYE: the eyes are placed from the crown (EYEHAT / EYEK / EYEIN). A crash on the emptied face shell fixed.
  Lessons: white clothes need the DARK background render (astronaut, barbarella, bunny girl, chef); `--longhair` on black hair over a black dress takes the bodice (demon princess: `LOCKS=0`); a shirtless unit = `SKIN_T=0.45 ARMX=0 --barearms` (gangster); look.js: the first unit of a run is still loading at 30 s, put a warm-up unit first, and one browser at a time (two timed out the screenshots).
  THE SHOULDER SKIN on wide jackets (clown, general, conspiracy theorist, cowgirl's bust): the outfit GLB alone was whole, the body's skin came through when the arms came down; `RAY_OUT=0.15` and `TORN=1` did not cure it, batch 3's jacket envs did (`RAY_IN=0.12 RAY_OUT=0.12 TORN=9`: the skin stood more than 5 cm OUTSIDE the cloth). Held back: antihero, atlantean, fortune teller (M) (the old head / body stays inside the clothes). Left on the shipped ones: bunny girl thigh patches + strap ends, demon princess shoulder patches + hair shards, fallen angel pale patch in the slit.
## THE MESHY PIECES (2026-11-03, character-models-plan.md row 16)
mondo: "now how do we put these models both in the character creator and in the game for spells". This is the creator half.
- `bake-meshy.py` (repo root, imports bake-clothes.py): `python3 -I bake-meshy.py --mpfb /tmp/mpfb2 [--only key1,key2] [--views dir]`
  (cloud Blender 4.2.3 bpy + MPFB; ~2.5 min for all). Reads `/mnt/project-files/meshy/models/<num>_<name>.glb`, writes
  `charactercreation/wear/ewm_<key>.glb` in the compact wear layout (male fit + `_d_<body>` offsets for female/heavy/thin/short),
  `extras.ewWear.solid = true`, texture downsized to a 1024 JPEG (512 for small pieces) in place of optimize-assets.js (the compact
  layout is not a plain glTF scene). `--views` draws a 3x3 check sheet per piece (male front/side/back, zooms, the other bodies).
- One spec line per piece (`piece(key, src, label, cat, z, mode=...)`). Modes: `hat` (dropped onto the crown), `helm` (sized to the
  head width, `sink`/`top` from the crown), `head` (creature heads: the piece's eye point on the face, the head skin hidden), `float`
  (halo), `front`/`back` (rayed to the chest/back skin), `side` (hip pieces, `anchor` ear/neck), `drop` (collar: hole wider than the
  neck oval, `cone` drape, then lowered), `pads` (shoulder pads: front/back halves deepened apart until clear), `cap` (pauldron over
  the shoulder joint, tilted half down the arm), `ring`/`limb`/`foot`/`mermaid` (wraps: length set, widened all round until the
  outer surface clears, then each way across taken in + the centre slid while clear: belts take the waist oval, greaves sit on the
  shin), `tail` (sway chains, `chains` joints), `hand` (THE GRIP's seat, the same formula as three-renderer.js `_gripFrame`).
- Hidden skin (`delBy` per body): creature heads = every head-dominated vertex + the neck inside the piece; hooves/beast feet = the
  feet; mermaid = the legs + the hips under the waist; breastplate = the skin inside it (`hide='cover'`). Gotcha: the signed
  distance test is wrong next to a cut-away part's rim (BVH of the body with the arms removed) - keep the arms in for shoulder pieces.
- Renderer (three-renderer.js): `w.solid` pieces ride the body sliders as one (mean offset), on the classic bodies too; their del
  list ALWAYS hides (`part.solidHide`, the skin cover pass would otherwise draw the head under a creature head); `ex.hideHead` ->
  `headOff` hides the hair, the facial hair and the eye pack; `ex.hideLegs` (mermaid) hides worn bottoms/skirts/shoes; `ex.grip`
  (the 12 props) -> `wearGrip` curls the right hand (`_gripHand`) and restores the fingers when the prop comes off (skipped when the
  unit's own `hold` already curled it, e.g. the DOOR Agent's gun).
- sprites.js: EW_MH_WEAR rows `ewm_*`, category `heads` (new, one at a time), tabs Armour / Creature heads / In the hand (one prop) /
  Badges + jewellery / Back gear / Ears, feet + fins (EW_WEAR_SHELVES + EW_WEAR_SHELF_MOVE). The whip (#49) is the spell side's.
- Not on R2 by sync-zip.js: the `ewm_*.glb` files go in the sync zip by hand (Assets/Models/charactercreation/wear/) and are listed
  in ASSET_MANIFEST.json.

## THE MASTER MODEL LIST (2026-11-03, mondo: "Any model from spell animations, characters, props, etc. needs to be documented and kept up to date with new additions ... include how the model was made")
- `MODEL_LIST.md` is written by `node list-models.js` (repo-only tooling): it loads data.js (load-data.js) + sprites.js in one vm sandbox
  and reads DOOR_HQ.catalogue, HQ_TREE_KINDS, HQ_STAIR_PACK, RACE_MODELS_3D / RACE_MODEL_SKINS / DOOR_CAST_MODELS, EW_ANIM_LIB_URLS,
  EW_MH_WEAR, EW_HAIR_STYLES, the renderer's `_MISC_GLB` / `_ANIMALS` / `_FOLIAGE_MODEL_FOR_KEY` and the VFX `_WPN_MODELS` by text,
  every literal cdn model URL in the game scripts (catch-all), and charactercreation/{wear/wear.json, hair/mh/hair_styles.json}.
- "How made" = the `SOURCES` regex table (first match on the bucket path). A file no row matches lands in UNSORTED at the bottom.
- Hand-kept parts (§9 Meshy API pieces not wired, §10 decor still missing) live in `MODEL_LIST_EXTRA.md`, pasted in verbatim.
- §10 sorts all 184 procedural catalogue stand-ins: 92 need a new model (concept prompts + doubled tri targets, also in project files
  meshy/decor/decor_prompts.json), 32 swap to a model already in the game, 60 are not a model job; + 4 missing spell props + the
  old wishlists' items with no stand-in. Gotcha: iterating DOOR_HQ's keys in the sandbox hangs (lazy getters) — read named tables only.

## THE LOSSLESS PASS (2026-11-14, mondo: "make optimized versions of all of the glbs or models that dont have an optimized version yet ... help the character creator and disaster city load faster")
- The gap: 2,322 GLBs on R2 had no `.opt.glb` (bucket listed through the API, compared to ASSET_MANIFEST files + alt). 1,922 of them are
  ones the game names (basename in a game script, or any creator wear / hair / mpfb file); the other 400 (3.1 GB) are per-character
  Meshy animation exports nothing loads and were left alone. The interior-pass Meshy props were already meshopt + WebP in place (skipped).
- **`optimize-assets.js --lossless`** (new): NO gltf-transform round trip. The creator's files are data, not plain scenes: wear has
  3- and 6-byte custom attributes (`_N` i8, `_D_<body>` i16) the code reads by `.array` (gltf-transform pads them to 4 → interleaved
  attribute → wrong normals/offsets), mpfb_classic_bust / mpfb_shapes keep shapes as vertex RANGES (reorder would scramble them).
  So the repack keeps every bufferView in place: meshopt ATTRIBUTES (filter NONE) on views whose stride is a multiple of 4, INDICES
  (sequence codec, not TRIANGLES: no rotation) on u16/u32 index views, anything else raw; PNG → WebP lossless (`exact`), kept only if
  every pixel decodes back the same; JPEG untouched; already-compressed files skipped. `losslessVerify` decodes every view with
  meshoptimizer's decoder and compares bytes + pixels + the JSON; nothing that fails it is written. No KTX2 flag, so `_asResolve`
  also hands these to the creator (wear + hair call `_ktxNoCompress`, which only refuses KTX2 copies).
- Run: `--lossless --check --flat <mirror>/Assets/opt --root <mirror>`, 4 shards: 1,513 copies, 0 failed, 786 MB → 577 MB
  (wear ×1.25, hair ×1.44, mpfb ×1.51, PSX Mega Pack ×1.50, elbolilloduro ×1.35). The rest were kept (under 5 % gain: mostly JPEG
  texture files like hq/models, top_fangs). eagle.glb is a zip, not a GLB (eagle_rigged.glb is the one used).
- R2 `Assets/opt/<sha8>_<name>.opt.glb`; ASSET_MANIFEST.json rows for each copy + its original (+710 originals) + `alt`. Token
  `20261114-optall02-cors`.
- Proof: a bare three r128 page drew 9 originals vs copies (hair, mpfb body, wear helmet + beard, PSX box + armchair, 6twelve store,
  Meshy apple, retro tree): 0 pixels differ (`/mnt/project-files/optimize-models/original_vs_optimized.png`). Gotcha seen there: GLTFLoader's
  mesh order changes from one load to the next (async), so two see-through meshes at the same spot (hair + scalp) can swap draw order
  between ANY two loads, original or not; the creator rebuilds hair in traverse order with its own renderOrder, so it does not care.
- Next time: rerun the gap script (list the bucket, compare to manifest alt + `.opt.glb` siblings), then the same command on the new files.

## THE MESHY DECOR (2026-11-03, mondo: "put the 71 new meshy models in the game")
The 71 decor + spell-prop models Claude made on Meshy (concepts approved by mondo; IDs D02-D92 / S01-S04 in project files
`meshy/decor/decor_prompts.json`, list MODEL_LIST_EXTRA.md §10A/§10B) are in. Files: R2 `Assets/decor/<name>.glb` (the
D-prefix dropped), each one `optimize-assets.js`-style meshopt + WebP 1024 (24 MB for all 71; originals 2048 JPEG in
project files `meshy/decor/models/`). ASSET_MANIFEST.json lists them. sync-zip.js does not see them (no index.html URL):
the thread's zip adds `Assets/decor/` by hand.
- **How a proc wears one:** three-renderer.js `_HQ_DECOR_GLB` (name → file) + `_hqDecorWear(name, U, g, opts)`, called at
  the end of the proc builder. The catalogue rows in data.js are UNCHANGED (still `proc`), so every placement in every room
  gets the model. The proc's own meshes hide (`_hqDecorHide` sets `_ew_mcKeep`, so `_mcSnap` still builds the collider
  from them) and the model is fitted into their box: `fit` contain (default) | height | width | stretch, `wall` (back
  flush on the wall plane), `top` (hangs from the box top), `turn`, `repeat`, `into` (an animated sub-group), `onDone`
  (re-seat kept pieces from the model's measured size). Glows, screens, text, flames, water, smoke stay proc.
- **Kept proc pieces (on purpose):** slot machine plinth (the Meshy cabinet stands on it), round table chairs, school desk
  seat, eeg live screen, lifeguard brolly, popcorn kernels, sea vent smoke, departures/scoreboard screens, punch-clock
  card rack, autopsy tags, wall torch + cave torch flames, meat hook carcass, music box dancer pin (Meshy dancer on it),
  directory kiosk text (moved onto the blank panel), carousel brass poles (Meshy horses on them), ferris wheel spin
  (Meshy wheel + gondolas in the spinning groups), fountain water (re-seated on the Meshy basin), trophy case glass.
- **Sub-part models:** armour_stand_post, carousel_horse, ferris_gondola, ferris_wheel_wheel, music_box_dancer,
  trophy_cup (3 on the shelf), umbrella_closed (in the stand), wall_torch_bracket.
- **Animated:** dream eye turns to the player + bobs, anemone breathes, nightmare bloom turns, robot arm door hangs from
  the Meshy gripper, rocking chair rocks the model, skiff hides the old rowboat pack model.
- **Spell props (three-vfx-effects.js `_WPN_MODELS.piano/sheep/tripodMachine`):** Things That Go Bump throws the piano
  first; Counting Sheep jumps three Meshy sheep; Tripod Sweep stands the Meshy tripod behind the beam (the ray starts at
  its head). Ack Ack Ack still uses its old saucer + code legs.
- **Kill switch:** `window.EW_NO_DECOR_GLB = true` before a room builds = the old procs.

## THE MESHY SWAP (2026-11-03, mondo: "replace the meshy models in the game that it downloaded an asset pack for. Except for urban buildings")
- 26 Meshy props now draw an Elbolilloduro PSX pack piece (all 14 packs CC0; list + the Meshy file each replaced: MODEL_LIST.md 10F).
  Side-by-side sheets: project files `asset-packs/meshy-swap/`. The original pack archives: project files `asset-packs/elbolilloduro/`.
- Files: R2 `Assets/misc/ebd_<pack>_<item>.glb` (20-600 KB each; the Meshy files were 3-9 MB). NOT in the repo: they go in the
  sync zip by hand. `bake-pack-pieces.py` (repo-only, Blender) rebuilds them from the unzipped packs (`--packs <dir>` with one folder
  per itch slug): keeps the named scene nodes, bakes transforms, recentres (base y = 0), turns `rotz` so the front faces where the
  Meshy model's front faced, packs the textures (the FBXs point at the author's C:/ paths), unlinks the fake alpha (an opaque texture
  wired to Alpha exports as BLEND), Glass/Vidrio 35 % see-through.
- Wiring: the catalogue rows only changed `file` (+ `base: 'misc'` on the D.O.O.R. kit rows), so every row keeps its h / span / wall
  / mount / glow. The renderer's `_MISC_GLB` keys that named the same Meshy files (dumpster, city_bin, bus_shelter, campfire,
  camping_tent, fallen_log, stump, rowboat, lantern) name the pack files too.
- Kept Meshy (no pack match): school_bus, cardboard boxes, wooden_bucket, car_cop (the car pack already draws it), fridges, signpost.
- Licences: Elbolilloduro = CC0 (credits row "PSX prop packs"). Pizza Doggy (Retro Tree Pack, the Mega Packs) is NOT CC0: no AI
  use of the assets, no redistribution as standalone files (credits + MODEL_LIST fixed).
- **Round 2 (mondo 11-03, after the first look):** server rack back to the proc (the Meshy one is not used, not shipped);
  space divider ONE screen (no repeat); flood mast pole thinned in Blender (shaft x/y ×0.4, base ×0.6); tanker desk
  retextured with Meshy Retexture on its own UVs (meshy-6, text prompt) and the red top toned to the old oxblood brown
  (texture swapped into the same mesh); high striker split in Blender into the striker + `high_striker_hammer` (its own piece,
  laid flat, lying on the floor in front); armour stand = the suit standing ON a new Meshy square oak plinth with a thin iron
  rod (`armour_plinth`, concept D15c picked by mondo) in place of the T-post whose crossbar stuck out. The Göbekli battle
  board's T-pillar monument (`_hzTPillar`) wears the hands T-pillar too, stretched into the old 1.9 × 3.8 tile box (the code
  pieces stay hidden in the group so the monument fit and the 2-voxel stamp are unchanged).
- **Round 3 (mondo 11-03: the thinned mast "still looks dumb", regenerate it):** new Meshy stadium floodlight `flood_mast.glb`
  (concept D04c picked by mondo: slim dark pole on a concrete footing, a crossbar of 8 floodlights facing +Z), same name, same
  `_hqDecorWear('flood_mast', U, g, { fit: 'height' })`. Concepts A/B/C in project files meshy/decor/concepts/D04_flood_mast_redo_A_B_C.jpg.

## THE PACK WEAR + THE MESHY AUDIT (2026-11-04, mondo: "Why ... did you have me making meshy models for the stadium lights and other stuff when we already have non meshy versions??? You are supposed to document every single model and try to not use meshy models.")
- **The floodlight was not a duplicate:** no downloaded pack has a stadium floodlight; the "Beach world props v4" sheet labelled
  Meshy decor as "decor" without saying Meshy. MODEL_LIST.md §12 is the full audit write-up.
- **THE PACK WEAR (three-renderer.js `_HQ_PACK_WEAR`, before `_hqDecorBox`):** name → `Assets/misc/ebd_<pack>_<key>.glb`. `_hqDecorWear`
  looks a name up in `_HQ_DECOR_GLB` (Meshy, Assets/decor/) first, then here, so a proc wears a pack piece exactly like a Meshy model
  (its pieces hide, keep collision, the piece fits their box). Wired: steel_table (DINER Table_Metal), metal_shelving (Gas Station
  Shelf_Metal, `fit: 'stretch'`), wall_shelf (House Shelf_01, `wall`), toilet_paper (House Toilet_paper, three rolls `at`), broom
  (House Broom), washer / dryer (House Washing_machine / Abandoned House Secadora, via `_laundry_machine`). Kill switch: EW_NO_DECOR_GLB.
- **bake-pack-pieces.py AUDIT jobs** cut them (+ the candidates bare_bulb Foco, concrete_pillar Metro Column, roller_shutter Tacos
  doors_garage, chalkboard VHS Shop Blackboard, turnstile Metro automatic_ticket_gate — cut, NOT wired, mondo's call). The rotations in
  AUDIT are the shipped ones; `--rot '{"k":deg}'` overrides. Copies in project files asset-packs/meshy-swap/glb/.
- **list-models.js:** the car pack rows list the GGBot OBJs (pool read off `_CAR_PACK_POOLS`) and the Meshy cars go under "fallback
  only"; procWears follows `_hqProcBuilders._x(` / `_hqXxxBuild(` helpers and `_HQ_DECOR_GLB.x` / ternary names; §10A gets an AUTO
  "in the game now" column; §13 lists every model file on R2 from `R2_MODEL_FILES.json` (`node list-models.js --r2` re-lists the
  bucket — rerun after uploading models); THE PACK-FIRST RULE box at the top.
- **Round 2 (mondo 11-04: "keep the lava lamp with moving wax, and switch those on"):** the five candidates now wear their pack piece
  too: bare_bulb (Foco, `h: 0.14, top`, the glow moved up to the bulb), concrete_pillar (Metro Column, `stretch`, the hazard band +
  bay number kept), roller_shutter (Tacos doors_garage, a 2.6 × 2.7 × 0.1 `box`, `wall`), chalkboard (VHS Shop Blackboard turned
  180 in the bake so the green face is +Z, `stretch`, the type-wheel text kept and set on its face in `onDone`), turnstile (Metro
  automatic_ticket_gate, `fit: 'height'`; the code tripod is hidden so the gate no longer turns). The lava lamps keep the Meshy
  base + cap and the drawn wax.

## THE MOCAP LIBRARY (2026-11-05) — real motion capture as lib 5 (MOC1_CMU.glb)
mondo (11-05, thread "Add mocap animations for 5 races", from the Blender/AAA gap doc https://claude.ai/artifact/AJ51krxhmmE93EMbWEkLkh
row 1): give races their own motion from free mocap; pilot on 5 races that already have a creator look.
- SOURCE: the CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu, free for games, credit in data.js EW_CREDITS), the
  Motionbuilder-friendly BVH conversion by B. Hahne: `git clone --depth 1 --filter=blob:none --no-checkout
  https://github.com/una-dinosauria/cmu-mocap.git` then `git checkout HEAD -- data/<subject>` per subject (608 MB for 11
  subjects; the index is cmu-mocap-index-text.txt). 120 Hz, frame 1 = a T-pose facing +Z, left = +X (same as UAL1/MAL1).
- TOOL: `python3 -I bake-mocap.py --cmu <repo>/data --clips <clips.json> --out MOC1_CMU.glb [--sheet dir] [--base 137_28]`.
  Pure numpy, no Blender needed: the GAME retargets (three-renderer.js _libEnsureSrc / _libRetargetSetup / _libBakeClips), so
  the file is just a UAL-NAMED skeleton (pelvis, spine_01-03, neck_01, Head, upperarm/lowerarm/hand, thigh/calf/foot/ball) +
  clips; unmapped CMU joints ride along as cmu_*. Shoulders are left unmapped (the CMU shoulder sits on the spine, its rest
  direction would shrug every target). Per clip spec {name, take, a, b, fade, steady, head}: 30 Hz, mean facing turned to +Z,
  hips XZ detrended (in place), last `fade` s slerped into the frames before `a` (seamless), every take's T-pose re-based onto
  the --base take's (one rest for the file), THE LEVEL HEAD (a take's T-pose head is often pitched: subject 137 looked up
  20-30 deg; the stretch's median head pitch becomes level, + `head` deg), THE STEADY BODY (`steady` k takes k of the hips'
  turn off the mean facing; idles use 0.7 because the actors pivot 15-30 deg on the spot).
- THE CLIPS (sprites.js `_MOC`, lib 5): MOC_HandsOnHips_Idle (54_16 29.9-31.55, ts 0.75), MOC_Calm_Idle (77_02 3.5-7.0),
  MOC_ShiftWeight_Idle (139_02 3.5-7.0), MOC_Fidget_Idle (137_19 19.3-21.8), MOC_Tough_Idle (137_41 19.7-23.47),
  MOC_Macho_Walk (91_33 15.37-17.07, ts 3.3), MOC_Slow_Walk (91_10 8.34-10.21, ts 3.6), MOC_LegsApart_Walk (132_53
  21.44-22.87, ts 2.7), MOC_Rushed_Walk (142_14 5.24-6.57, ts 2.5), MOC_Cool_Walk (91_23 15.71-17.11, ts 2.7). The clip spec
  list is kept in the clip's glTF extras (cmuTake/from/to). Walk ts = cycle / 0.52 s (the library Walking's played cycle):
  matching the board's stride speed instead would need 3.4-5.9x and looked frantic, so a slow walk slides a little.
- WIRED (sprites.js `lib:` rows; THE RACE LOOKS copy them onto the creator looks): superhero M hands on hips + macho walk, F
  hands on hips; priest M+F calm + slow walk; cowboy M weight shift + bow-legged walk, F weight shift (no gun in the idle:
  THE IDLE RULE); mad scientist M+F fidget + rushed walk; gangster tough stance + cool walk. The five idles are also EW_IDLE_POSES
  picks (creator OUTFIT > idle pose) for any look.
- CHECKED in a plain three.js page with the game's own retarget functions copied out of three-renderer.js (no game,
  no playtest): every clip on its race's Meshy model + the MPFB male, front + side sheets. Kill-switch for the lot:
  remove the lib rows, or `window.EW_DISABLE_ANIM_LIB` (all libraries).
- NEXT (not built): more races; signature casts/attacks from the same set (CMU has boxing 13_17/14_01, kicks 86_*, a gun pull
  139_05, laughs 13_14); a mirror option for left/right-handed takes.

## THE MOCAP LIBRARY rev 2 (2026-11-05, same day) — creator picks only, the converter redone
mondo (thread "Redo pilot race idles and walks"): "fidget doesnt loop. Hands on hips looks [bad] and the ankle is all twisted and
distorted. the buttons are bugged and calm is doing the fidget animations and hands on hip animations and weight shift is doing hands
on hips ... add the walk animations to the character creator just like the idle animations ... The walk preview just plays like one
walk cycle and stops", then "dont give them default idles and walks, just add them to the character creator ... Put their defaults
back to what they were".
- DEFAULTS BACK: superhero, priest, cowboy, mad scientist, gangster lose their `lib:` idle/walk rows (sprites.js exactly as before
  PR #902; `_MOC` table gone). Nothing plays lib 5 unless a look picks it.
- WHY "CALM = WEIGHT SHIFT": the CMU BVH set ships 77_02 ("standing") and 139_02 ("shifting weight") as the SAME FILE, byte for
  byte. The buttons were wired right; the two clips were one motion. Judge a take by its motion, never its label.
- bake-mocap.py rev 2 (see its docstring): THE CLEAN REST (zero pose, legs straightened, feet straight ahead; rev 1 used the
  actor's frame-1 T-pose, whose turned-out toes / rolled ankles played backwards on our bodies = the twisted ankle), THE FLAT FEET
  (per take, the planted frames give each foot's true standing turn: subject 54's toe markers point the foot 45 deg up), THE LOOP
  POINTS (start AND end searched for the best pose + speed match, the leftover spread over the whole clip, then THE SEAM EASE: a
  +-4 frame circular average at the wrap; no blend window = no rewind), NO PIVOT (rev 1 "steady" turned planted feet), THE FLOOR
  (feet on the rest pose's floor; the hips path in the file's leg lengths), THE STRAIGHT PATH (a walk is turned frame by frame
  by its heading of travel: CMU walks curve), THE QUIET WRISTS (35 % of the noisy CMU hand turn), THE POSTURE LAYER (spec `pose`:
  constant joint turns over the actor's motion; the Heroic stance = 111_28 standing still + chest up, arms and legs a little out).
  `--scan <take>` shows a whole take (hips speed per second + a stick sheet) to find stretches. Seam check: every clip's wrap step
  is at or under its own 90th-percentile frame step.
- THE CLIPS (mocap-clips.json): idles MOC_Heroic_Idle (111_28), MOC_Calm_Idle (82_08), MOC_ShiftWeight_Idle (139_02),
  MOC_Fidget_Idle (137_19), MOC_Tough_Idle (137_41), MOC_Pockets_Idle (137_28); walks MOC_Normal_Walk (91_29), MOC_Confident_Walk
  (82_09), MOC_Macho_Walk (91_33), MOC_Strong_Walk (137_42), MOC_Heavy_Walk (17_08), MOC_Cool_Walk (91_23), MOC_Slow_Walk (91_10),
  MOC_LegsApart_Walk (132_53). Dropped: hands on hips (54_16), the rushed walk (142_14: erratic data). Rejected after rendering on a
  creator body: 54_16/55_22 superhero (hands on hips, broken foot markers), 113_21 (head lolls), 40_10 (looks up), 140_07 / 77_03
  (crouched), 76_04 (no loop), 137_19 37 s (turns round).
- THE WALK STYLE: sprites.js EW_WALK_STYLES + EW_APPEARANCE_ENUMS.walk (appearance.walk, saved in the look like the idle);
  getCharacterAppearanceModel -> def.walkPick; three-renderer.js _animLibBakeForModel swaps the caller's `walk` like the idle pick.
  Row `ts` = the board speed (one stride cycle in 0.52 s, like the library Walking at 2.05). Creator: OUTFIT/BODY "Walk" row under
  "Idle pose"; a pick (Default too) walks on the stage at once, LOOPING, at the clip's recorded speed (EWCharViewer.walk()); the
  PREVIEW WALK / WALK buttons now loop until pressed again (STOP WALK). A looped MOVE PREVIEW has no timer any more (ran 60 s).
  An idle pick made while the walk loops ends the walk and shows the idle.
- ASSET_MANIFEST.json lists MOC1_CMU.glb (sha a83dab3d347b), so a browser that stored rev 1 in the asset store fetches rev 2.
- CHECKED in the real game page (local scripts, Playwright): every idle + walk button plays its own clip; the walk still loops
  after 6 s; idle during a walk; WALK -> STOP WALK.
- REV 2.1 (same day, mondo tested live: "I pick one walk animation and then like the next 2 or 3 i click are broken", walks slide,
  idles still broken). THE CAUSE was the ASSET STORE, not the buttons: his browser had stored rev 1 of MOC1_CMU.glb while the
  manifest did not list it (row stored with no sha); on the first hit after the manifest listed rev 2, three-renderer.js
  _asTouch stamped the MANIFEST's sha on that old row, so _asStale never fired and rev 1 played for good. Every clip that only
  exists in rev 2 (Heroic, Pockets, Normal, Confident, Strongman, Heavyset) baked to nothing = a dead button, and the rev 1 walks
  are the sliding ones. Reproduced in Playwright by seeding the store with rev 1 (/tmp harness t6.js): old code = his exact
  symptoms, new code = every button plays its clip. FIX (three-renderer.js THE ASSET STORE): a hit never takes the manifest's sha;
  a listed file is stale when its row has no sha, no row, a different sha, or a size that is not the manifest's; a fresh copy of a
  listed file is stored under the manifest's bytes. So any file changed in place + listed in the manifest now really refetches.
- REV 2.1 UI: the Walk row carries its own PLAY WALK / STOP WALK (party-builder.js CreatorControls, reads three-renderer.js's
  'ew-cv-state' window event that _cvEmitState now dispatches); the party builder's bottom PREVIEW WALK is gone (moved up).
  Clicking a walk walks at once (also the one already picked); clicking the picked idle during a walk stops the walk.
- Seams on the real rig (bone world positions sampled over the loop point, MPFB male): every walk + idle seam step is at or under
  the clip's 90th-percentile frame step (walks 6-17 mm vs 17-27 mm, idles 0.1-7 mm vs 0.6-11 mm).
- REV 2.2 (same day, mondo: "there is nothing heroic about the heroic stance idle, it looks like they have to pee" + "Almost all of the
  walk animations you added, their hands clip through their thighs as they swing ... Do the mpfb bodies not have like bones and
  collision"). Heroic stance is out of EW_IDLE_POSES; Macho + Bow-legged are out of EW_WALK_STYLES (on the front/side sheets the
  Macho walk staggers and dips a shoulder, Bow-legged swings the arms wide); the clips stay in MOC1_CMU.glb. Added the walks the game
  already had: UAL1 Walk_Loop ("UAL walk"), UAL1 Walk_Formal_Loop ("UAL formal"), MAL1 Walking_Woman ("Meshy woman").
- THE ARM CLEARANCE (three-renderer.js _ccArmClear / _ccArmClearMeasure, called first in _createAppearanceRig's tick(), before the
  coat hang / sway / jiggle / cloth): a clip is bone rotations only, so nothing stopped a hand going through a thigh on the wider MPFB
  body. Measured on the skin (every vertex, every frame): 7 of the 8 mocap walks went 9-52 mm into the thigh, UAL Walk_Loop 22 mm,
  Walk_Formal 27 mm, idles Calm 13 / Fidget 63 / Pockets 32 mm; MAL1 Walking (Default) 0. Each frame the hand's skin points are tested
  against both thighs' measured radius (re-measured when the body shape changes) and the upper arm turns out from the body just
  enough (+12 mm for the cloth), rising at once and easing back. After: 0-5 mm on every walk, default and Weight-max bodies.
  Any clip, any rig that has the UAL-named bones; board units with a creator look get it too. Kill-switch window.EW_NO_ARM_CLEAR.
  The cloth side (garments out of the body) belongs to the "Add collision between bodies and clothes" thread, which keeps off the arm bones.
- REV 2.3 (same day, mondo: Calm "shaking back and forth really fast subtly", Tough stance "looking at their arm like they have a
  watch", Fidget "a weird dance"): all three out of EW_IDLE_POSES (clips stay in MOC1_CMU.glb). Mocap idles left: Weight shift only
  (Hands in pockets also out: on the front/side sheet it is the hands-on-hips pose he rejected in rev 1). Calm's shake is the CMU marker noise on a near-still pose (the hand jitters the same with the arm clearance off), so
  CMU is a poor source for subtle idles; its takes are acted prompts ("walk like ..."), exaggerated by design.
- THE ARM CLEARANCE rev 2: it pushed Hands in pockets' elbows out ~20 deg (the hand sits at the hip on purpose) and popped on poses it
  could not clear. Now: thigh points above CLR_T0 (0.15 of the thigh from the hip) are not tested, a solve that needs more than
  CLR_MAX (0.3 rad) gives up (the clip means it), the radius blends between bins, the turn eases in (CLR_RISE 12/s) and out
  (CLR_EASE 5/s). Real-time check: walks 25-52 mm in -> 0-6 mm; Pockets / Weight shift jitter the same as with it off.
- REV 2.4 (same day, mondo: "Are there not any simple or subtle ones? ... Are there other better resources or libraries?", then
  "okay whatever, use any of them"): THE 100STYLE LIBRARY. Source: The 100STYLE Dataset (Ian Mason, CC BY 4.0, Zenodo record 8127870,
  100STYLE.zip 1.47 GB; credit row in data.js EW_CREDITS). One actor walking 100 styles on a treadmill-free stage, Xsens 60 fps, each
  style has an ID (idle) take and walks. Only the needed BVHs were pulled from the zip by HTTP range (no full download).
  mocap-100style.py renames the Xsens joints to CMU names + rescales cm -> CMU units, so bake-mocap.py (same tool as MOC1) cuts the
  seamless in-place loops; the spec is mocap-clips-100style.json (take numbers 901-910 = the styles listed in mocap-100style.py).
  Output: Assets/characters/animations/MOC2_100STYLE.glb = lib 6 in sprites.js EW_ANIM_LIB_URLS (254 KB, in ASSET_MANIFEST.json).
  Creator picks added (never unit defaults): idles S100_Neutral_Idle "Neutral", S100_ArmsBehindBack_Idle "Hands behind back",
  S100_ArmsFolded_Idle "Arms crossed", S100_Proud_Idle "Proud"; walks S100_Neutral_Walk, S100_ArmsBehindBack_Walk,
  S100_ArmsFolded_Walk, S100_Proud_Walk. Checks per clip: loop seam <= the 90th-percentile frame step, idles move < 0.5 mm/frame (no
  shake), real-time hand-in-thigh 0-5 mm on the default and Weight-max bodies with the arm clearance on. Hands behind back gets
  pose LeftArm/RightArm +14 deg (the heavy body's hands sank into the seat). Rejected after looking: Heavyset + HandsInPockets
  (elbows out, reads as hands on hips), Old (hunched), Strutting (arms flail), Stiff + ArmsBySide (same as Neutral).
  Review sheets: /mnt/project-files/mocap-rev2/s100_*.png.

## THE MESHY ANIMATION PULL (2026-11-11) — libs 7 + 8 (MAL4_Sniper.glb, MAL5_Sniper.glb)
mondo: "With Meshy animations, I was only able to download 20 at a time with the Sniper ... are you able to go on there and download more
animations that would be useful and give different units more personality with their walks and idles and spells and attacks".
- YES, through the Meshy API (api.meshy.ai is a connected service in the cloud environment: the Network secret adds the key, send any
  dummy Bearer). `GET /openapi/v1/animations/library` = 678 clips (action_id, key, category; free). ONE rigging task on the male sniper
  (`POST /rigging {model_url: his Idle_5 _withSkin GLB on the CDN}`, 5 credits, task 01a1c9cb-7b9c-7114-9415-a804d3fe308e, expires on
  Meshy's side after a while: the tool rigs again), then `POST /animations {rig_task_id, action_ids: [up to 10]}` = one GLB per batch,
  one clip per action already named by the library key, 3 credits a clip. This pull: 130 clips, 395 credits (15,781 -> 15,386).
- TOOLS (repo root): `python3 pull-meshy-anims.py meshy-anim-pull.json <out dir> [set...]` (`--library` prints Meshy's list; the spec
  holds the sets of action_ids), then `python3 -I build-mal.py <out.glb> <batch.glb...> [--inplace clips] [--drop clips] [--report j]`
  packs them animation-only like MAL1-3 (26 nodes, no mesh; scale tracks and the constant bone-offset tracks dropped: 53 clips = 2.8 MB).
- THE TRAVEL: about half of Meshy's walks and every sprint carry root motion (hips end 0.5-2.9 m away). `--inplace` takes the
  straight-line travel out of the Hips track (Elderly_Shaky_Walk, Limping_Walk, Sneaky_Walk, Stylish_Walk, walking_2,
  Cautious_Crouch_Walk_Forward, Stumble_Walk, Funky_Walk, the 6 sprints). The combat clips in MAL5 keep their travel (use pinXZ / pinHips
  on the slot). Dropped from MAL4: Catching_Breath (runs 4.4 m then stops), Stage_Walk (4 m, uneven), Idle_13 (= mage_soell_cast_5).
- THE STRIDE: build-mal.py measures one stride cycle by forward kinematics (left foot minus right foot along +Z from the hips, upward
  zero crossings); a walk's board `ts` = cycle / 0.52, capped at 3.6 (Sneaky, Slow orc, Elderly are slow walks). Limping_Walk's leg
  tracks are too flat for the measure: 1.75 s read off the frame sheet.
- THE REST POSE (same day, mondo: "Their knees look bent backwards in a lot of these"): MEASURED in the creator (hip-knee-ankle on the
  MPFB body, signed): the old picks never pass straight, the new ones bent up to 38 deg the wrong way. CAUSE: the retarget plays a clip as
  each bone's turn away from the LIBRARY FILE'S REST POSE (_libEnsureSrc reads the file's nodes), and the API rigged the new skeleton on the
  sniper as he stands in his Idle_5 export (knees 51 deg, hips 8 cm low, its own bone axes), so every clip lost that much knee bend.
  FIX in build-mal.py `--rest <calib batch.glb> <MAL1_Sniper.glb> Idle_5,Regular_Jump` (ALWAYS pass it): the same Meshy actions exist in
  MAL1 and were pulled once on the new rig (spec set `calib` = 245 Idle_5, 1 Walking_Woman, 466 Regular_Jump, 9 credits); per bone
  rest_new = rest_old x inverse(world_old(t)) x world_new(t), constant under 1 deg over Idle_5, averaged with Regular_Jump, written into
  the nodes (the clips' tracks untouched). A first try (turn each bone to MAL1's rest DIRECTIONS) left 9 deg: the two rigs put the knee
  joint in different places, so directions are not comparable. After: all 16 idles + 19 walks measured, none passes straight
  (/mnt/project-files/meshy-anim-pull-20261111/proof/knees_before_after.jpg). ANY new rigging task needs its own calib pull.
- MAL4 (lib 7, 53): Idle, Idle_02, Idle_03, Idle_3, Idle_4, Idle_6, Idle_7, Idle_8, Idle_9, Idle_12, Idle_14, Idle_15, Alert, Combat_Stance,
  Axe_Stance, Long_/Short_/Axe_Breathe_and_Look_Around, Confused_Scratch, Scheming_Hand_Rub, Hand_on_Hip_Gesture, Boxing_Warmup;
  Casual_Walk, Confident_Walk, Confident_Strut, Flirty_Strut, Injured_Walk, Monster_Walk, Mummy_Stagger, Proud_Strut, Quick_Walk,
  Red_Carpet_Walk, Slow_Orc_Walk, Thoughtful_Walk, Unsteady_Walk, Elderly_Shaky_Walk, Limping_Walk, Sneaky_Walk, Stylish_Walk, walking_2,
  Walk_Fight_Forward, Cautious_Crouch_Walk_Forward, Spear_Walk, Stumble_Walk, Funky_Walk; Run_02, Run_03, Lean_Forward_Sprint,
  Standard_Forward_Charge, Male_/Female_Head_Down_Charge, run_fast_2, run_fast_3.
- MAL5 (lib 8, 74): casts Charged_Spell_Cast_1, mage_soell_cast_5, mage_soell_cast_8, Skill_02, Crouch_Charge_and_Throw,
  Jump_and_Slam_Back_Down; attacks Attack, Double_Blade_Spin, Double_Combo_Attack, Left_Slash, Simple_Kick, Side_Shot, Triple_Combo_Attack,
  Counterstrike, Dodge_and_Counter, Flying_Fist_Kick, Reaping_Swing, Left_Jab_/Left_Hook_/Right_Uppercut_from_Guard, Lunge_Roundhouse_Kick,
  Elbow_Strike, Leg_Sweep, High_Kick, Lunge_Spin_Kick, Punch_Forward_with_Both_Fists, Charged_Axe_Chop, Axe_Spin_Attack, Weapon_Combo,
  Weapon_Combo_2, Archery_Shot, Draw_and_Shoot_from_Back, Draw_and_Shoot_Left, Crouch_Pull_and_Throw, Over_Shoulder_Throw,
  Grip_and_Throw_Down, baseball_pitching, Double_kick_forward; hits + deaths Hit_Reaction, Electrocution_Reaction, Hit_Reaction_to_Waist,
  Face_Punch_Reaction_1/_2, Knock_Down, dying_backwards, Shot_and_Fall_Backward/_Forward, Electrocuted_Fall,
  Fall_Dead_from_Abdominal_Injury, Shot_and_Blown_Back, Strangled_and_Fall_Forward; guards Block1, Block2, Block4, Sword_Parry,
  Two_Handed_Parry, Stand_Dodge_1, Roll_Dodge, Quick_Step_and_Spin_Dodge; emotes Chest_Pound_Taunt, Victory_Cheer, Victory_Fist_Pump,
  victory, Neck_Slashing_Gesture, Show_Both_Arm_Muscles, Formal_Bow, Gentlemans_Bow, Shrug, Finger_Wag_No, Angry_Stomp, Shouting_Angrily,
  Zombie_Scream, Wave_One_Hand, Agree_Gesture.
- WIRED (sprites.js): EW_ANIM_LIB_URLS 7 + 8; CREATOR PICKS ONLY (his 11-05 rule: no race default changes): 16 idles in EW_IDLE_POSES
  (ids MAL_<clip>: Meshy calm / still / arms out / idle 7 / 9 / 12, Breathe long / short, Hunched breathing, Look around, Alert, Fight
  ready, Combat stance, Head scratch, Hand on hip, Hand rub) and 19 walks in EW_WALK_STYLES (Casual, Meshy walk 2, Quick, Proud strut,
  Confident strut, Stylish, Flirty strut, Thoughtful, Marching, Fighting advance, Crouched, Sneaky, Monster, Slow orc, Mummy, Unsteady,
  Injured, Limping, Elderly). Not offered as picks (still in the file): the idles that turn round / bend back / jump / crouch-rise, the
  walks with a hand gesture (Confident_Walk, Red_Carpet_Walk), Stumble_Walk, Funky_Walk, the runs.
- NOT DONE: no MAL5 clip is on a slot. They show in the spell editor's clip picker (EWCharViewer.libClips) and can go on a character with
  `lib: {slot: {clip, lib: 8, ts, strikeAt}}`; each needs its strike frame read off a sheet first (THE STRIKE FRAME). The library files
  load with the others at start (2.8 + 3.7 MB before the edge's brotli, once, then the asset store keeps them).
- PROOF: frame sheets of every clip on the sniper /mnt/project-files/meshy-anim-pull-20261111/sheets/; the real creator (WebGL2,
  software GL) with picks made by clicking the rows /mnt/project-files/meshy-anim-pull-20261111/proof/. Board play of a picked walk was
  not looked at.

## THE CHRISTMAS PACK IS Y-UP (2026-11-05)
mondo's console showed `THREE.ColladaLoader: You are loading an asset with a Z-UP coordinate system ... see #24289` (and the parser's
`File version 1.4.1` debug line) on every load. The only COLLADA file in the game is the Christmas pack
(`Assets/world/packs/elbolilloduro_christmas/models/Christmas.dae`, same R2 key). It was turned to Y-up ONCE offline: every POSITION
and NORMAL array (x,y,z) -> (x,z,-y) and every node matrix M -> R M R^T with R = Rx(-90 deg), `<up_axis>Y_UP`. R is a signed
permutation, so numbers only move / flip sign as text (no precision change). Checked in a browser with three 0.186.1: same 69 meshes,
41556 vertices, world positions + normals equal to 5e-15, no warning. The Z-up original is kept in project files
`models-backup/Christmas_ZUP_original_20261105.dae`. three-renderer.js `_asDae` hides the parser's "File version" debug line, and its
no-store path now fetches `?h=<sha>` too. ASSET_MANIFEST.json lists the .dae (manifest-assets.js KINDS takes `dae`) so the in-place
replacement reaches every browser and the edge.

## THE FOUR WEIGHTS (2026-11-05, mondo's console: "THREE.FBXLoader: Vertex has more than 4 skinning weights … Deleting additional weights")
- Cause: 21 rigged FBX files carried vertices with 5-12 bone weights: the ocean pack's BrownFish, ClownFish, Crab, Dolphin,
  DoryFish, Fish2, Hammerhead, Lobster, Manta ray, Octopus, Penguin, SeaWeed, SeaWeed1, SeaWeed2, Seal, Squid, StarFish,
  TunaFish, Whale, Whale2 (Assets/world/packs/ocean/) and the elephant (Assets/world/animals/elephant/elephant-3d.fbx).
  The other ocean files, the chess set, the Halloween kit, the spear and the UFO were already clean.
- Fix at the source: `python3 -I bake-fbx-weights.py <in.fbx> <out.fbx>` (repo root) keeps each vertex's 4 largest weights,
  scales them back to its original total, and rewrites only the cluster Indexes/Weights arrays (every other byte as it was).
  FBXLoader did the same cut at load, so the game draws the same thing (checked in node with three 0.186.1: mesh, UVs,
  normals, clip names identical; posed vertices match to < 0.004 % of the model's size) and the warning is gone.
- The fixed files replaced the originals under the SAME R2 keys (bucket ewmusicsfx); the originals are kept in bucket
  dirtymondo `archive/2026-11/fbx-weights-originals/world/...`. ASSET_MANIFEST.json lists the 21 new files (so the edge and
  the store fetch them by `?h=<sha>`, not a cached old copy). Ghost FBX (characters/Character_Ghost.fbx) also has 5-weight
  vertices but the game loads its GLB, so it was left alone.
- A NEW FBX upload: run it through bake-fbx-weights.py first if the console shows that warning.

## THE PSX MEGA PACK (2026-11-08)
mondo bought Pizza Doggy's PSX Mega Pack and dropped it unzipped in `dirtymondo:inbox/psxmegapack/`. 584 of its 592 GLBs are on the
game bucket at `Assets/world/packs/pizzadoggy_psx_mega_pack/<category>/<name>.glb` (pack names kept; textures embedded); the 8
fake-light cards + the loose textures folder + the licence PDF are pack source in `dirtymondo:source/Assets/world/packs/pizzadoggy_psx_mega_pack/`.
Ten Meshy props swapped to it the same day (MODEL_LIST §12b table; catalogue `base: 'psxmp'`, _MISC_GLB `psxmp/...` via the
sprites.js EW_ASSET_MOVES alias `Assets/misc/psxmp/`; facings measured from vertices, never renders). MODEL_LIST §12b = the inventory, the licence rules (no AI use of any kind, no standalone
redistribution, never in the repo) and the Meshy / code swap candidates by name. Credited in data.js EW_CREDITS.

## THE PROCEDURAL RIGS IN THE TEAM ROOM (2026-11-12)
- mondo on Select Your Team: "the occulus eyeball doesnt show up on this screen, only the wings". The team room (`_trBuildMember`)
  never read `entry.procClips`: a boneless assembly (Occulus, Seraphim, UFO forms, chess pieces, unicorn) got no core eye
  (`_procRigAttachEye`) and no mixer, so it stood as its bare file, still. Now like the dock and the viewer: the eye goes on after
  the room's look, the assembly's own `idle` clip plays, its clips feed the room's poses, and `_procRigEyeTrack(eye, T.camera)`
  (new optional camera argument) turns the eye to the room's camera. The board is untouched.
- Proof: /mnt/project-files/oculus-team-room/oculus_eye_on_team_select.jpg (headless, WebGL2).

  AGENT LOCKE (11-12, mondo: "Ship, and remake Locke to blink"): the first CAST member on a creator body. Old rig rendered front,
  Meshy T2 a-pose (task 01a1d095), `ISLENECK=0.2 OPENSKIN=1 OPENX=0.045 OPENX2=0.045 OPENZ=0.3 SKINISLE=400 python3 -I bake-outfit.py
  --name locke --label "Agent Locke" --gender female --src locke_t2.glb --bodies charactercreation/mpfb` (delete the bogus `_hat`).
  New knobs: OPENSKIN (the open-collar skin rule without the rest of --neckline: --neckline cut her blouse collar away) and
  ISLENECK (SKINISLE never hides an island near the neck: under a blouse collar the neck is cut off from the head's skin and went
  black; off by default so the catgirl's file is byte-identical). Her body stood through the suit at the bust, shoulders, crotch
  and calves until SKINISLE hid those islands. Hair shells are not exported: creator `mh_elvs_short_side_do` tinted #e6e6ea.
  Face: bake-face.py from the OLD rig (`lockeFace`, `ew_face_locke`, stock=middleage_caucasian_female, hairrgb=225,225,228).
  Wiring: sprites.js CAST_CREATOR_LOOKS + getCastLookModel; getCastModel (DOOR HQ, portrait studio) and getRace3DModel's cast
  branch (the board, with the Door Agent's gun) return the creator def with its `raceLook`; three-renderer.js _ptSpec passes that
  look. `window.EW_DISABLE_CAST_LOOKS = true` = her old rig. Seen: viewer four sides + walk + head, a portrait-studio bust. NOT
  seen: her in DOOR HQ or in the first fight. Left: small dark teeth in the blouse collar's V, mouth reads a little pursed, the
  fringe sweeps to the other side from her old model. Proof: /mnt/project-files/meshy-remake-batch1/locke_look_check.jpg.
  LOCKE'S COLLAR (11-12, mondo: "fix the dark teeth in the v of the blouse collar"): her command is now `ISLENECK=0.2 OPENFRONT=1
  SKINISLE=400` (OPENSKIN dropped). OPENFRONT (off by default): skin on the front of the chest with no cloth straight in front
  of it and none within 8 cm behind it (not her bust standing through the blouse) is shown + one ring under the collar's edge,
  and the collar's cloth (z above eye - 0.27, |x| < 0.07) is lifted 6 mm outside the skin so that ring does not stand through.
  Tried and dropped: the ring without the lift (skin patch on the blouse), the lift down to the bust (blouse through the jacket).
  File 921dfad8. Proof: /mnt/project-files/meshy-remake-batch1/locke_collar_before_after.jpg.

- **THE MESHY OUTFITS, BATCH 3 OF 3 (11-13, mondo: "make new models for all of the units ... a combination of stuff we already have and new stuff with meshy")**: politician .. wizard F, 23 models; list + status `meshy-remake-batches.md`, rows `meshy-remake-plan.md` section 8. New bake-outfit.py envs, all off by default: `EYEAT` (eyes by hand, no eyeball shells behind goggles), `SLEEVESEED` / `SLEEVER` (fur sleeves; a cape fused to a sleeve). Found: a suit jacket narrower than the MPFB shoulders lets the skin through (`RAY_IN=0.12 RAY_OUT=0.12 TORN=9`); a dark coat / gown that holds the face is dropped whole as a hair lock (`LOCKS=0`); gown + bare arms + chest in one shell cannot be cut (telepath F: creator gown instead); T2 runs vary enough that a second run fixed vampire + valkraye.
