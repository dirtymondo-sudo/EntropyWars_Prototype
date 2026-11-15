---
name: calm-test-boards-out-20261111
description: mondo 11-11 "get rid of the calm maps, we dont need the duplicates": the 3 (Calm) test boards are out of every map list (PR #1145); calm look itself untouched
metadata:
  type: project
---
mondo 2026-11-11: "Can we get rid of the 'calm' maps? Arent all of the maps calm now? We dont need the duplicates".

PR #1145 (?v=20261111-nocalmdupes-01-cors, data.js 475de8d6 live): data.js HQ_LOOK_MAPS is EMPTY, so Fairy Forest (Calm), Stonehenge (Calm), Hell (Calm) (test boards from PR #1112/#1116, [[calm-ground-test-20261111]]) are no longer registered. Those three were the only map entries labelled calm. Kept: CALM_TERRAIN default look, ROOM tab Calm/Pixel switch, window.EW_NO_CALM_LOOK, his pixel sheets, the HQ_LOOK_MAPS table + hqMapLook + register (empty mechanism). Editor texture picker CALM group (calm sheets by name) is not a map duplicate and stays ([[calm-rollout-20261111]]).

**How to apply:** never re-add a "(Calm)" map card. Proof /mnt/project-files/calm-dupes-out-20261111/. Proof recipe: localhost:3000/?nohq&ew_gpu=webgl2, _goToVsCpu(), type in `.ms-tty-input input`; route cdn data.js to the local file for the after shot; launch chromium with executablePath /opt/pw-browsers/chromium. Thread (thread in the owner project).
