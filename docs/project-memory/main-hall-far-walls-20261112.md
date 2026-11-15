---
name: main-hall-far-walls-20261112
description: Main Hall far walls dark until you walk closer (mondo 11-12) = stage lamp budget picked nearest-to-eye lamps across hall + foyer; fixed PR #1231
metadata:
  type: project
  modified: 2026-11-12T17:09:06.227Z
---
mondo 11-12: "the walls further away are not lit until i walk closer to them, thats what is making the main hall feel dark". Thread (thread in the owner project).

- Cause: three-renderer.js `_hqStagePick` (stage lamp budget) lit the N point lights nearest the eye over every room on the stage, N = max(lampsLive 12, own). Hall 13 lamps + foyer 6: at the hall entrance the foyer's lamps took six places, the hall's far ring + gallery lamps went dark. Not the rig ([[lost-light-rig-20261111]]), not the hemisphere ([[foyer-lobby-light-20261112]]).
- Fix PR #1231: current room lights ALL own lamps first; neighbours share the rest, at least `HQ_STAGE_RULES.lampsNb` (4); THE ROUND JOIN (hall + foyer) lights every lamp, cap `lampsRound` (32). Hall + foyer now draw 19 point lights (was 13). Token 20261112-halllit-02-cors, data.js 47aa3972, three-renderer.js c565eed9. Proof /mnt/project-files/main-hall-far-walls/.
- If he reports a frame drop in the hall on his Mac: lower `lampsRound`, do not undo own-first. Not seen on real WebGPU.
- Seen, not fixed: the hall viewed from INSIDE THE FOYER part (before the swap at the doorway) still reads dimmer than once you are in it (same hemi/key/fill; cause not found).
- Harness: the room swap at a stage doorway only fires once `ThreeRenderer.hq.gate().ready` is true (about 10 min in the cloud browser, the hard cap); teleport across after that. A probe that stays open and takes commands over localhost saved reloads. Related [[headless-hq-proof-gotchas-20261108]].
