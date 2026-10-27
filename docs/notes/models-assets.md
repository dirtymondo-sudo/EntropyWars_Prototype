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
  Run clip across a move, turn + attack clip when facingAngle changes, hit clip when hurt. Elephant / drone / blob keep the box dog.
- Spells (three-vfx-effects.js `_animal`): Crack the Whip = the lion bounds in beside the ringmaster (`_spell3DGeometry.raceCrackTheWhip`);
  Crow Storm / Scare Off add real crows (`_fx3Crows`); A Murder + Grave Robbery crows use crow.glb (the bead crow is the fallback).
- Catalogue: `HQ_CATALOGUE_ANIMALS` (data.js, all `mesh: false`; cow/lion/giraffe block with a rect), palette group "Animals".
- Decor (outside every arena window): THE ESTATE corn fields (cows, hens, dog, crows), Fairy Forest clearing (rabbits, crows, a wolf),
  the glade (butterflies, ladybugs on the stumps, rabbits), the carnival (lion, giraffe), the garden (butterflies, cat), the
  Looking-Glass (rabbit by the tea table, cat). The placer group is `_ew_noInstance` (no batch takes a moving body).
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
