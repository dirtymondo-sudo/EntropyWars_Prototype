---
name: held-props-row24-20261103
description: PR #827 (11-03) Meshy props #47-72 in game: spells hold props in hand, Crack the Whip 20-bone crack, 12 gear pieces worn on bones; files on R2 Assets/props/
metadata:
  type: project
  modified: 2026-11-03T06:37:22.272Z
---
PR #827 merged 2026-11-03 (thread in the owner project), plan row 24 SPELLS + GEAR DONE.
- R2 Assets/props/<name>.glb = optimize-assets.js --size 512 output under the PLAIN name (no original). NOT picked up by sync-zip.js: added by hand to zip 20261103-0635.
- three-vfx-effects.js _HELD_PROPS (18 spells) + _HELD_BY_RACE.wizard (wand); ThreeRenderer.unitHoldProp / unitPropMetre; whip = _whipSetup/_whipPose (world-space lash pose); dev still window.EW_HELD_T.
- three-renderer.js UNIT_GEAR_WEAR (EQUIP_DEFS keys) via _unitGearSync on build.
- Not done: 6a weapons (swords/shield/spear) still float beside casters; staff unused; creator side of the Meshy pieces not in this PR.
- Probe: scratchpad heldprobe.js (real game, local JS, close-up renders hiding far meshes). A race swap needs ~25 s for the new rig before casting.
Related [[character-models-plan-doc]] [[meshy-api-pieces]]
