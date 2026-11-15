---
name: drop-pick-camera-20261028
description: Second-click "drop range" camera framing for sky throws / Teleport / tosses (PR #628, 2026-10-28)
metadata:
  type: project
  modified: 2026-10-28T02:57:26.764Z
---
mondo 10-28: "for abduction beam, after i pick a target, the camera needs to go to an over the board view of the range i can drop them ... This goes for all similar spells." PR #628 merged (token 20261028-droppick-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261028-0257: battle 9c0d3855, data 16209c8a, state 217ab033, three-renderer eda5d3d4).

- battle.js `_dropPickCamCheck` (called from state.js renderIfDirty) frames the second click's reach once via `_frameSpellTilePick` (setTool's free-aim tile-pick framing, extracted and shared).
- Covered: sky throws (To the Moon, Abduction Beam, Dragon Toss, Infernal Hurl), Teleport (teleportAnyUnit) landing, the throwAnyDirection tosses (Horn Toss, Suplex, Fifty Times Its Weight). The escape landing is a first pick and setTool already framed it.
- Viewer's own unit only. The guest frames locally from state-sync, nothing relayed. Browser-verified for Abduction Beam only; Teleport, the tosses and the online guest were not clicked.
- Leftover: the Abduction Beam saucer still hangs over the middle of the ring in the overhead view. Clicks pass through it.
Related: [[sky-throw-landing-pick]] [[camera-rules]]
