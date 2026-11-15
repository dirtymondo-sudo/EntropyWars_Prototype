---
name: calm-ground-test-20261111
description: Fairy Forest Arena (Calm) test map (PR #1112): realistic low-saturation ground, own water/lava, VS CPU only; awaiting mondo's verdict
metadata:
  type: project
  modified: 2026-11-11T09:25:17.389Z
---
mondo 11-11 asked: terrain pixel sprites too busy vs 3D units; Riot guide value section; make an ALTERNATIVE Fairy Forest map with AAA-ish grass/water/lava, less busy. Thread cmsg root in project chat ("Calm Ground").

Shipped PR #1112 (merged 11-11, ?v=20261111-calmground-01-cors, R2 uploaded):
- Map id `prebuilt_fairy_forest_calm_delta`, label "Fairy Forest Arena (Calm)", data.js HQ_LOOK_MAPS + hqMapLook; VS CPU only (out of PvP pool/size groups). Original Fairy Forest untouched.
- three-renderer.js THE CALM GROUND: `_calmOn` keyed on `_arenaLatchId`; sheets `Assets/world/terrain/calm/calm_{grass,dirt,rock,lava}_1.png` (code-baked by bake-calm-terrain.py, one per square); tints `_CALM.floorT/pathT/cliffT`; `_calmFluidMat` water/lava. Kill switch `window.EW_NO_CALM_LOOK`.
- Finding: his board was already darker than units; busyness = saturation (grass 0.86) + pixel speckle. Calm: sat 0.46, fine detail -25..55%.
- Plan/proof page https://claude.ai/artifact/Ag2YjY586HDu2dZ4qzchtV ; shots /mnt/project-files/calm-terrain-20261111/.
- Part 2 11-11 (he: "looks pretty good ... try it on a couple more maps"): PR #1116 adds Stonehenge Arena (Calm) + Hell Arena (Calm) (new calm_scorched_1.png, _CALM.tints per floor, lava molten flow glow so a lava field reads from the wide camera). ?v=20261111-calmground-02-cors.
- Part 3 11-11 (he, WebGPU: lava "all brown ... isnt even moving"): PR #1119 calm_lava_2.png (melt + crust rafts), two sliding copies like PR #782, WebGPU twin _ewNodeCalmFluid; proven moving on headless WebGPU (ph_gpu.js flags per [[sandbox-webgpu]]). ?v=20261111-calmlava-01-cors.
- Part 4 11-11 (he: "dark parts distracting ... just the lava part, no rocks" + "yes do water too"): PR #1120 calm_lava_3.png melt-only flow lines; WebGPU calm water twin _ewNodeCalmWater. Both proven moving on headless WebGPU. ?v=20261111-calmlava-02-cors. He dislikes dark crust on lava. Woods map look (dither/grain/green tint) untouched: offered as next lever.
- Part 5 11-11 (he: v3 "too cartoony ... Why did you make a whole other thing"): PR #1122 calm_lava_4.png = v2's own melt with the rafts removed, v2 motion back; v3 flow lines retired. ?v=20261111-calmlava-03-cors. LESSON: when he asks to remove one part, remove only that part, never redesign.
- Part 6 11-11 (he: "not like a repeated pattern"): PR #1128 lava no-tile (two offset lookups per copy picked by slow world noise, textureGrad), same sheet + scale. ?v=20261111-calmlava-04-cors. Calm grass/dirt sheets still tile per square (his 1-tile-per-square rule), not offered changed.

**Why:** he wanted to SEE an option before deciding anything about his sheets.
**How to apply:** 11-11 he DID ask to roll calm out game-wide as the default (his sheets kept in the editor): thread "Roll out calm terrain across all maps" (thread in the owner project) owns the calm code now; tell it before editing calm/lava/water functions. Before that ask the rule was: never roll the calm look onto other maps or replace his sheets unless he says so; a new bake = new `_2` file name. Related [[visual-rules]].
