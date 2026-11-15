---
name: spell-vfx-fx2-20261026
description: Spell look fix batch FX-2 (metal/lightning/sonic/psychic) — PR #569 merged 10-26, zip 20261026-2249, calls flagged
metadata:
  type: project
  modified: 2026-10-26T22:50:01.086Z
---
FX-2 of the spell VFX fix pass ([[spell-vfx-audit-20261026]]): PR #569 merged 2026-10-26. Token is 20261026-fx2-1-cors.
Zip: /mnt/project-files/r2-sync/ENTROPY_WARS_SYNC_20261026-2249.zip (battle.js, three-renderer.js, three-vfx-effects.js).
Notes and before/after sheets: /mnt/project-files/spell-vfx-audit/fix/FX-2/.

## What was built
- Guns are held in the hand at hand size (`_sigHandWorld` → renderer `unitBoneWorld(uid, bones, anyVis)`), with ray beams.
- Metal hit kinds come from `_mtlKind` (blade/gun/line/cog; pin a spell in `_MTL_KIND`). The anchor misc GLB drops.
- Chain and cable tethers use canvas textures.
- Charge and pull bursts are retimed to arrival.
- The lightning archetype has no orb (`noOrb`).
- `freeEnergy:restore` and `raceTeslaTrap:detonate` geometry recipes.
- Psychosis and Possession use the skull GLB.
- The doorGun travel fires the door recipes. Door Slam uses the real door leaf.
- Things That Go Bump throws HQ catalogue furniture.

## Calls flagged to mondo (not rule changes)
- Rescue Line stages as aura.
- Grapple's reel is now 320 + 360 ms.
- Free Energy's arcs show on full-MP allies too.
- The metal hit kind is picked from the spell name.
- The skull faces the camera.
- The door recipes fire on arrival.

## Merge note
FX-CAM already added a grapple reel shot, so FX-2's duplicate camera was dropped.

## Missing models appended
Sheep, tesla coil, grenade, knife, mic, trumpet, neuralyzer, piano.
