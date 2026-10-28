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
