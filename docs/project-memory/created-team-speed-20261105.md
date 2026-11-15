---
name: created-team-speed-20261105
description: PR #958 (11-05) why created (MPFB) teams froze Select Your Team and what fixed it; numbers mondo was given; what is left
metadata:
  type: project
  modified: 2026-11-05T23:06:58.058Z
---
mondo 11-05 asked whether created characters can load as fast as Meshy before committing to a created look for every unit ("if you cant get them to load lightning fast ... forget about it").

PR #958 (token 20261105-quickteam-01-cors, three-renderer.js live 92143f5b):
- Cause: each team switch rebuilt all 4 creator rigs in one main-thread task. 45 % of it was the skin sheet's GPU read-back (getImageData) and ~25 % the nearest-skin garment fits.
- Fixes: shared look sheets, CPU canvases for read-backs, fit memo shared across rigs, dense grids, and the team room's bench + one build per frame.
- Headless numbers (old -> new): switching back 8.1 s -> 0.03 s (same as Meshy); first visit 24.8 -> 16.9 s.
- Geometry of 13 looks came out identical.

Left (offered, not asked):
- The first build of each look per session costs ~0.3-1 s per character.
- Next steps would be pre-dressing saved teams during boot, and async shader warm-up on WebGPU.

Notes: docs/notes/character-creator.md "THE QUICK TEAM ROOM". Related [[character-models-plan-doc]] [[race-looks-batch1-20261102]]
