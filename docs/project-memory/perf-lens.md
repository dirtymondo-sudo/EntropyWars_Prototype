---
name: perf-lens
description: Perf overlay (F3) and perf pass merged PR #43 (2026-10-01); findings and next likely fixes
metadata:
  type: project
  modified: 2026-10-01T14:37:17.478Z
---

PR #43 was merged on 2026-10-01. The zip is perf/ENTROPY_WARS_PERF.zip and the findings are in perf/PERF_FINDINGS.md.

**What it added (three-renderer.js):**
- THE PERF LENS: F3, `?perf`, or localStorage ew_perfLens; the Settings > Performance row appears once it has been opened. It wraps render, renderBufferDirect and shadowMap.render only while open, and reports calls and tris per pass and per kind (chars/props/terrain/fog/env/fx/other). It has toggles, and the API is `ThreeRenderer.perfLens`.
- HQ trees share materials (`_nrTreeMats`; the wind is in world units and instancing-aware), so they batch.
- The instance pass also covers attached stage parts and the battle room (`_fieldInst*`).
- Off-screen walk NPCs skip their mixer (`EW_HQ_NO_CHAR_CULL`).
- The field pick group is hidden.
- three-post.js: a live pixel ratio now resizes the composer.

**Sandbox count findings** (no GPU timings):
- The HQ torch PointLight cube shadow redraws everything near it 6 more times per frame.
- Downtown is draw-call bound (~1,700 tiny meshes).
- In battle, the fog grid LineSegments take ~1,700 draws, and each character is drawn 3 times (body, x-ray, outline).

**Round 2 (PR #44, #45, 2026-10-01):**
- mondo's Mac (DPR 2) runs ~45-57 FPS. FPS follows draw calls, not resolution.
- The lens now shows the room, the static batch line, a why-not-merged list, and Point lights all/4/2/off.
- The static batch now merges props (R.batchP), uses 96 m cells, rescans every 4 s, and merges additive glows.
- Contact discs are shared, so they are instanced.
- Downtown in the sandbox went 1447 → 859 draws.
- Sandbox textures load if the Playwright context sets proxy {server: HTTPS_PROXY, bypass: localhost} and route.fetch adds ACAO:* for cdn.entropywars.net.

**Next:** waiting on mondo's F3 Copy text from his machine. The likely first fixes are the torch cube shadow, fog grid merging, and the x-ray/outline twins. See [[level-design-plan]] and [[passages]] for the rooms involved.
