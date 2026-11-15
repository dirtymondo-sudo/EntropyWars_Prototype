---
name: oculus-team-room-eye-20261112
description: 11-12 PR #1211: Occulus eyeball missing on Select Your Team fixed (team room ignored procedural rigs); headless proof notes
metadata:
  type: project
  modified: 2026-11-12T13:22:37.743Z
---
Thread (thread in the owner project). mondo 11-12 12:55Z: "the occulus eyeball doesnt show up on this screen, only the wings" (Select Your Team).

- SHIPPED PR #1211, token 20261112-occeye-02-cors, three-renderer.js ac436fd1, live.
- Cause: team room `_trBuildMember` never read `entry.procClips`, so procedural rigs (Occulus, Seraphim, UFO forms, chess pieces, unicorn) got no core eye, no idle, no poses there. Fixed for all of them; board untouched. Note: docs/notes/models-assets.md "THE PROCEDURAL RIGS IN THE TEAM ROOM".
- Proof: /mnt/project-files/oculus-team-room/oculus_eye_on_team_select.jpg (headless WebGL2). Only the Occulus was looked at on screen; his Mac unchecked.
- Headless proof recipe for the team room: local server, route cdn *.js to repo files, `window._openSquadDesk('cpu')`, then `ThreeRenderer.teamRoom.setTeam([{race,gender}])`, poll `teamRoom.dev.rec().members[].shown`. Unit models take ~4 min to land headless (rig lane behind the menu's background loads): wait, do not assume a failure.
- The flashing left buttons from the same message = a separate thread (token sqflash).
