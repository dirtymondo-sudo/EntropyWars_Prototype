---
name: christmas-pack
description: mondo's Christmas pack on R2 Assets/christmas (2026-10-24): Christmas.dae split at load, where it's placed, Santa spells, PR #489
metadata:
  type: project
  modified: 2026-10-24T13:32:53.499Z
---
Thread "Christmas pack" (2026-10-24), PR #489 merged, token 20261024-xmaspack-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261024-1332.zip (data.js, three-renderer.js, three-vfx-effects.js). Proof shots /mnt/project-files/christmas-pack/.

R2 Assets/christmas/models: Christmas.dae == Christmas.fbx (62 nodes, one kit), Roads.* (snowy road tiles, unused), SantaClaus.fbx / SantaClaus_B.fbx (rigged, unused: offered to mondo as Santa unit model). Textures/ 55 sheets. Game reads the .dae via three ColladaLoader (importmap), pieces cut at load like [[metro-pack]] (`base: 'xmas', node`). Kill-switch window.EW_NO_XMAS_PACK. Wall-flagged catalogue rows add `mount` on top of y: placed wall rows need `mount: 0`.

Placed: North Pole forest+groves = pack snowy pines (was retro pine), plaza tree+gifts, hearth dressing, 3 snowmen, gift stack, bay hall wreaths (all outside the arena window). Cafeteria: counter/table food (dropped after hours), champagne on the after-hours bar. Spells: Blizzard Present + Naughty List finisher use pack gift (procedural bow still lands on top = double bow, flagged); Milk and Cookies sets cookies+cocoa beside caster (tray dropped by mondo, PR #493, token xmaspack-02). Lump of Coal untouched.

Calls flagged to mondo, unanswered at delivery: the forest swap, double bow, cafeteria food, Santa rig swap.

Party builder stage preview is faster than a harness screenshot (7 s): capture frames in-page by drawImage of `.pb-hero3d canvas` on rAF (script was /tmp/claude-0/xmas/cap.sh).
