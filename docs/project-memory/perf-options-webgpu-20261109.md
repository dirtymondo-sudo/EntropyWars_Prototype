---
name: perf-options-webgpu-20261109
description: WebGPU frame rate work: options doc (11 options / 3 plans), Plan 1 PR #1079 + Plan 2 Render Scale PR #1081 shipped 11-10, real gains, what failed, what is left
metadata:
  type: project
  modified: 2026-11-10T02:27:11.751Z
---
mondo 11-09 asked for frame rate options (battle + exploration, WebGPU); 11-10 "proceed with plan 1". Thread (thread in the owner project). Doc: https://claude.ai/artifact/EZN4WmV1dJCm6uFB3sn3GA . Raw profiles + tools: /mnt/project-files/perf-webgpu-20261109/ . Notes: docs/notes/rendering-loading-perf.md "THE FRAME RATE PLAN 1".

PLAN 1 SHIPPED PR #1079 (11-10), all viewer-local, each with a live kill switch:
- AO passes skipped at strength 0 (node chain only; classic N8AO floors intensity at 0.5 so 0 is not identity there). 9 passes -> 8. `EW_AO_AT_ZERO`.
- Hero light (torch/brazier/campfire/lava lamp) cube shadow map HELD until a caster in reach moves a quarter map texel. `EW_HERO_SHADOW_EVERY_FRAME`, counts `ThreeRenderer.hq.dev.heroShadow()`. GAIN SMALLER THAN THE DOC SAID: held = Main Hall 1000 draws / 2.49M tris -> 878 / 1.62M, but a standing body's idle moves 6-14 cm/s so it rested only 21% of frames in the dungeon, and the MAIN HALL NEVER RESTS (its hero light is a floor lava lamp whose wax blobs are moving casters; Locke stands 1.2 m away).
- HUD quick-cone loop + `_wmMenuRects` run every 150 ms while the page is still. `EW_HUD_NO_REST`, counts `window._ewHudRest()`. Small gain (~0.85 ms/frame sandbox).
- STILL MATRICES NOT SHIPPED: an exact "keep unchanged matrices" walk cost the same as three's own math (0.60-0.70 vs 0.62-0.67 ms, 3542 objects). Real gain needs still props out of the walk (`matrixAutoUpdate = false` at build, every mover named). The HQ scene is matrix-walked ~5x a frame.

PLAN 2 SHIPPED PR #1081 (11-10, he tapped the card): Video settings RENDER SCALE row 50/67/75/85/100% of min(dpr,2); `ThreePost.setRenderScale/getRenderScale`, same stored `ew_pixelRatio`; Pixel Ratio row (Fast/Native) kept; default unchanged. Emulated Retina software raster: 801 ms @100%, 534 @75%, 467 @67%, 336 @50%. Screens /mnt/project-files/perf-webgpu-20261109/render-scale/. Not checked on real WebGPU; preview canvases keep own ratio. Harness: local `--dpr 2` flag added to /tmp/ph/ph.js only.

LEFT: Plan 3 (static/moving shadow map split, doc option 5, sun + torch; merge leftover draws; one GPU copy per image) NOT picked. Open question to him: should the lava lamp's wax cast shadows (could not see them on screen).

Still asked of mondo: two F3 Copy readouts (battle; slowest zone).

Lessons: measure a "skip the work" fix against the work it skips before promising it; the sandbox draws ~4 fps and clamps dt to 0.05, so per-frame motion is ~3x a real frame (slow `performance.now` to step at 60 fps pace). Measured counts from the planning pass: battle 163 draws / 416K tris, 10 screen passes; Disaster City 1209 draws / 2.70M tris, 7258 of 7393 objects matrixAutoUpdate.

Harness tips: `_hqEnter({from:"play", room})` jumps to a room; `ph draw always` keeps frames coming; the lens overlay covers the action menu.
Related [[per-frame-audit-20261105]] [[webgpu-plan]] [[perf-lens]] [[sandbox-playtest-speed]]
