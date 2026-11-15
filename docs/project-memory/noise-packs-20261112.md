---
name: noise-packs-20261112
description: mondo's 4 SBS noise/texture packs (11-12): where they are, licence, mock-up built (tile hit wash, astral ground, liquids), waiting on his OK
metadata:
  type: project
  modified: 2026-11-12T05:48:20.153Z
---
mondo 11-12 uploaded 4 folders of noise + texture packs, wants them used where most impactful (spells/VFX, psychic/astral terrain, astral realm / dreamy maps, liquids, tile effects on spell hits), EXAMPLES FIRST. Thread (thread in the owner project). Related [[riot-vfx-plan-20261108]] [[calm-rollout-20261111]] [[visual-rules]].

- WHERE: R2 bucket `dirtymondo`, prefix `inbox/SBS Abstract Noise Pack/` (100 grey), `inbox/SBS Abstract Texture Pack/` (100 colour), `inbox/SBS Noise Texture Pack/<18 families>/` (262 grey: Cracks, Craters, Gabor, Grainy, Manifold, Marble, Melt, Milky, Perlin, Spokes, Streak, Super Noise, Super Perlin, Swirl, Techno, Turbulence, Vein, Voronoi), `inbox/SBS Seamless Abstract Pack/` (50 colour). 512 PNGs, all 128x128, seamless, 14 MB. `._*` files there are Mac junk. NOT yet sorted out of the inbox (still there).
- LICENCE: Screaming Brain Studios, CC0 (License.txt in three folders; the fourth has none but is the same maker).
- MOCK-UP on branch claude/project-thread-s75nrz (NOT merged, no ?v= bump, nothing uploaded to the game bucket): three-vfx-effects.js "THE NOISE PACKS — MOCK-UP" after THE FIRE PASS. Off unless `?noisefx=1` / `window.EW_NOISE_FX`.
  - THE WASH `_nzWash` / `_nzStage` (hooked in `_fireStage` after `_fpStage`): per element (`_NZ` table: 13 elements -> two pack sheets + colours), a disc splat on each footprint square, alphaMap = the noise, alphaTest climbs so it erodes in the noise's shapes; vertex alpha (centre 1.7, rim 0.1) makes it eat from the rim and stay in the square. Bright additive sheet + flat-colour stain (reads on pale floors).
  - THE MOVING GROUND `_nzGround` (console `EW_NZ_GROUND(tiles, o)`): an overlay sheet for the look only (the real build = the square's own top material + a terrain key / liquid look). Colour sheet in world UVs across `span` squares, drifting, + additive noise sheet sliding the other way. Lambert + emissiveMap.
  - Short file names planned for R2: `Assets/fx/noise/sbs/<family>_<nn>.png`, `absn_NNN`, `abst_NNN`, `seam_NN` (only upload the sheets used).
- Picks shown to him: astral ground = abst_091 + marble_03 (look A), abst_018 + superperlin_03 (look B); liquids: dream water abst_094, spring abst_079, poison seam_20, purple bog abst_038, magma seam_03, oil seam_37.
- HARNESS LESSONS: headless node renderer on WebGL2 runs ~3 fps; a new material shows only after a few seconds, so hold effects (freeze option) and wait 5-7 s before a shot. The game moves the camera on its own: re-snap on an interval. Vertex alpha + alphaMap + alphaTest work on the node renderer with plain MeshBasicMaterial (no TSL twin needed). Keep one browser open (CDP port) and connect per shot; a reload costs ~5 min. `window.THREE` is the game's THREE. Hide the HUD with a style rule on `#game-viewport *` (canvas kept visible).
- NOT SEEN: real WebGPU, classic WebGL, a real spell cast (only direct calls), online guest, frame cost.
- HE SAID 11-12 12:46 AM "Yeah looks good, go ahead" (= all three). SHIPPED PR #1182 (?v=20261112-noisepack-01-cors), files live on R2.
  - WASH on by default for every `type:'damage'` spell whose vfxElement||element is in `_NZ`; off `window.EW_NO_NOISE_WASH`; `window.EW_NZ_SLOW = 14` stretches its life (needed for headless shots at 3 fps).
  - MOVING SHEETS (three-renderer.js `_NZ_MOVE`, `_nzMoveTex`; hooks at the top of `_hzTex` + `getTerrainTexture`): eight texture keys in data.js CALM_TERRAIN.sheets that play by their twins' rules (hqRuleKeyOf): nz_astral_a / nz_astral_b (purple_grass), nz_dreamwater (water), nz_spring (healing_spring), nz_poison, nz_purplebog (purple_bog), nz_magma (lava), nz_oil. One 128 px canvas per key redrawn ~12 times a second (base drifting + tinted noise added, sliding the other way) = works on every renderer with no shader. Off `window.EW_NO_MOVING_SHEETS`. Stills on R2 Assets/world/terrain/calm/nz_*.png (pack files unedited). Editor picker family MOVING.
  - Sea of Possibility (DOOR_HQ room site_prebuilt_lookingglass_sea) terrain floor = nz_astral_a. Seen moving on screen.
  - The astral ground is NOT a new terrain key: it is a look that plays as purple_grass. No board uses it yet; liquid looks only appear when picked by name in the editor.
- Proof /mnt/project-files/noise-packs-20261112/ (examples 1_/2_/3_, live_sea_of_possibility.jpg, live_cast_psychic.jpg, live_cast_fire.jpg). Notes: docs/notes/spells-vfx.md "THE NOISE PACKS", maps-terrain-battle.md "THE MOVING SHEETS".
- NOT SEEN: real WebGPU, classic WebGL, online guest, a liquid look painted in the editor, frame cost. Psychic wash reads pale on grass (additive), his to judge.
- LEFT: the packs are still in dirtymondo inbox/ (he did not ask to sort the inbox). Offers: astral ground on a PvP board / other dreamy rooms, more sheets as looks.
- Room proof recipe that worked: `/?ew_gpu=webgl2&demo=0&hq`, wait 25 s, `_hqEnter({room, quiet:true, from:'walk'})`, wait 30 s; a screenshot there takes ~1 min (give it 240 s).
