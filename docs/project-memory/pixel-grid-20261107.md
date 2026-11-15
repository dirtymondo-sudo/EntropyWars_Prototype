---
name: pixel-grid-20261107
description: 11-07 PR #1040 pixel-grid grass fix (UNDONE 11-08 PR #1044 at mondo ask) + 11-08 PR #1042 one pixel density (TM vs TS tiling, kept)
metadata:
  type: project
  modified: 2026-11-07T23:35:25.536Z
---
mondo 2026-11-07 (Mount Shasta, Firefox WebGPU): "why are there mixels/blurriness on the grass? It's pixel art".

There were three causes, all fixed in PR #1040 (token 20261107-pixelgrid-02-cors; sprites.js 971de772 and three-renderer.js 4fc16953 uploaded):
- 8 terrain sheets were 1024 px fake-pixel paintings: grass_2, dirt, cave_floor, deep_water, obsidian, forest_2, cloud_2, lava. They were baked to R2 terrain/px/<same name> with bake-pixel-sheet.py --size 128 --keep 4 --sharpen 80. sprites.js has TERRAIN_PIXEL_SHEETS and ewPixelSheetUrl, and textureLoader.load sends those files to px/. Kill switch: window.EW_SOFT_SHEETS.
- GOTCHA: HQ engine boards (every site / delta board field, walls, buildings) use _hzTex, and HQ rooms use _hqTex. They do NOT use getTexture. Both used magFilter Linear; it is Nearest now, and min stays trilinear. Kill switch: ?ew_softmag=1.
- GOTCHA: three 0.186.1 WebGPU mipmaps every texture with generateMipmaps true and samples the mips even with minFilter Nearest. _ewGpuNoMipsUnlessSampled patches r._textures.needsMipmaps. Kill switch: ?ew_pixmips=1.
- Headless WebGPU (swiftshader flags in the probe) runs, but its screenshots come out black. Prove visuals on WebGL2.
Proof: /mnt/project-files/pixel-grid/. Notes: maps-terrain-battle.md "THE ONE PIXEL GRID". Related: [[crystal-pixelate-flicker-20261105]], [[sheet-per-square-door-20261103]].

11-08 PR #1042 (token 20261108-onedensity-01-cors, three-renderer.js e8393d1c live), from mondo's "bridge crisper than grass / is it stretched over 4 squares?":
- The answer was NO. The field already shows 1 sheet per 3.5 m square.
- The cause: decks, bridges, water, walls, doors and kit buildings tiled by TM (the 1.75 m model tile), which is 2x2 sheets per square.
- GOTCHA: TS is the only sheet scale. TM is only for model size.
- Fix: water + _nrKit ctx.sheet use TS, and the _hqOneDensity pass rescales the UVs. Kill switch: window.EW_SHEET_ANY_DENSITY.
- GLB props and tree leaves are not covered.
- mondo has not confirmed it on screen yet.

11-08 PR #1044: UNDONE at mondo's request ("undo the original grass fix ... it still looks ugly").
- The PR #1040 game code was reverted: the original 1024 px sheets are back, _hzTex/_hqTex mag is Linear again, and the WebGPU mip patch is removed. Token 20261108-softgrass-01-cors.
- The density fix (PR #1042) stays.
- The px/ bakes are still in the bucket but unused.
- Don't re-apply PR #1040 without asking him.
