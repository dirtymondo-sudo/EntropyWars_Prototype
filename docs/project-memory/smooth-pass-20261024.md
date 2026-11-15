---
name: smooth-pass-20261024
description: PR #476 perf pass (10-24): Light Rays only from real light sources, async frame read, plates/menu CPU cuts; proposed slow-motion fix awaiting mondo
metadata:
  type: project
  modified: 2026-10-24T03:18:13.412Z
---

PR #476 merged on 2026-10-24 with sync zip r2-sync/ENTROPY_WARS_SYNC_20261024-0317.zip. Notes are in docs/notes/rendering-loading-perf.md under "THE SMOOTH PASS", and proof images are in /mnt/project-files/smooth-pass/.

- **Light Rays** now read a 1/8-size "ray source" (three-post.js `_RaySrcShader` / `_ngRaySrc`). A cell has to be a quarter to half lit, so stars and glints no longer throw shafts. Braziers, glowing zones and sky gaps still do.
- **Biggest win:** `_aeMeasure` used a blocking `readRenderTargetPixels` every 220 ms whenever Light Rays or the building's auto exposure was on. It is now async on WebGL 2. Sandbox CPU per frame with rays on went from ~850 ms to ~20 ms.
- **Smaller wins:** the CSS2D plates skip the second scene matrix walk, and the menu measures query only inside `.hrlg-rig`.
- **Open:** I proposed raising the three-camera.js 0.05 s step cap (slow motion below ~20 fps) to mondo, but did not build it. It's a feel change and he decides.

Related: [[perf-lens]] [[sandbox-playtest-speed]] [[visual-rules]]
