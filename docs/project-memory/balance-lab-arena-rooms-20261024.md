---
name: balance-lab-arena-rooms-20261024
description: PR #495 (10-24) — Balance Lab/AI labs now draw arenas in their rooms; why they showed voxel blocks; Gauntlet call flagged
metadata:
  type: project
  modified: 2026-10-24T14:49:37.095Z
---
mondo 10-24: "why is the ai balance lab using the old voxel maps?" The lab pool was already hqArenaPvpPool(4), but map.js _simApplyModeAndMap never waited for the room survey (VS CPU waits in _msArenaGate), and three-renderer.js latches the arena room once at activate() — lab matches never re-activate, so match 2+ drew no room. PR #495: sync hqArenaUpgrade(compile) before applyGameMode + deactivate/activate renderer on a new board. Proof: /mnt/project-files/balance-lab-maps/. Call flagged to mondo: Gauntlet rotation still uses full voxel launch maps (VS CPU Gauntlet offers only those); Medium/Siege/Conquest dropdown untouched.

**How to apply:** any new auto-sim path that changes map between matches must re-latch the renderer. See [[new-maps-voxel-remakes]].
