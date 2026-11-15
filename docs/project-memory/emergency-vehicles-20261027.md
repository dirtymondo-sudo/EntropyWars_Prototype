---
name: emergency-vehicles-20261027
description: Fire truck / ambulance / cop car added to firefighter + police spells (PR #597, 10-27); nose orientation + ghost-on-occlude gotchas
metadata:
  type: project
  modified: 2026-10-27T07:59:33.058Z
---
mondo 10-27: firefighter should use the in-game fire truck/ambulance, police officer the cop car. PR #597 merged, token
20261027-evehicles-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261027-0759.zip (battle.js, three-vfx-effects.js). Proof /mnt/project-files/emergency-vehicles/.

- Fire Hose = fire truck + hose; Fireman's Carry = ambulance; Hose Down finisher = fire truck (battle.js theWave director, race check);
  Freeze! Police! = cruiser behind suspect; Lockdown = two cruisers in a V. Book 'Em already had the cop car.
- Gotcha: the Meshy firetruck/ambulance/copcar GLBs are nose −X (measured by isolated renders); `rotation.y = π/2` → nose +Z.
- Gotcha: action camera cuts round after a prop spawns, so "far side from the lens" at spawn can end up in front. `_evOccludes`
  ghosts the vehicle on the sight line instead. For target spells place props relative to the caster line, not the camera.
- _FIN_STAGE.* is only the forge/stage preview; real battle finishers run in battle.js _FIN_DIRECTORS (add looks to both).
Related: [[models-check-20261027]] [[spell-vfx-audit-20261026]]
