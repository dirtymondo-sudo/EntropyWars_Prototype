---
name: storm-funnels
description: PR #412 (10-22): all cyclones (Tornado/Hurricane/Blizzard/Sandstorm weather + Dust Devil spell) share one non-wireframe storm rig in three-vfx-effects.js
metadata:
  type: project
  modified: 2026-10-22T19:57:26.134Z
---
PR #412 (2026-10-22, main 61e61b9, token 20261022-stormfunnels-01-cors, zip ENTROPY_WARS_SYNC_20261022-1957.zip, three-vfx-effects.js 1eeb0335). mondo (playtest 2): "All of the cyclones are wireframes ... fix the rest too and make them look visually impressive".

- One rig `_buildStormVortex3D(x,y,z,ts,kind)` / `_stormVortexTick` / `_disposeStormVortex`, looks in `_STORM_LOOKS` (tornado, hurricane, blizzard, sandstorm, dustDevil). Old build*/tick*/dispose*Vortex exports are thin wrappers, renderer untouched.
- Lathe funnel, 4 shells with canvas wind textures (`_stormTex`) scrolling round+up, alphaMap fade, baked vertex shading, per-vertex sway; spiral skirt, instanced puffs/flecks/debris, wall cloud / spiral cap (fades edge-on), hurricane lightning flicker. Whirlpool foam wireframe -> streak texture.
- Rim light was split to a separate thread (mondo: "completely unrelated").
- Other weather (rain, blood rain, tesseract, solar flare, quake, drought) had no wireframe; untouched.
- Screenshots /mnt/project-files/storm-vfx/. Stage harness approach (three from npm, page.route, https origin needed for WebGPU) worked for quick VFX shots without running the game. See [[hands-on-playtest]] [[visual-rules]].
