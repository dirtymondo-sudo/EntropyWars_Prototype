---
name: ice-highlight-backing
description: PR #455 (2026-10-23) tile highlights on ice/snow get a shaded backing; cause was contrast, not draw order
metadata:
  type: project
  modified: 2026-10-23T09:57:52.017Z
---
mondo 10-23: "frozen/ice tiles are covering up tile highlights or making them hard to see" (second time; the 10-16 fix was draw order, GROUND_SHEET_ORDER). Repro showed the order was already right: pale blue plates + white-hot outline vanish on white ice. PR #455 three-renderer.js THE PLATES ON THE ICE: `_hlBackOne` (from `_syncHlGhosts`) adds a backing child (plate colour x0.3, no outline, opacity 0.55 x plate's live ratio) under every highlight plate on cells matching ice|snow|frost|frozen|igloo|glacier. Switch window.EW_NO_HL_BACKING. Water/desert/scorch checked, fine. Zip r2-sync/ENTROPY_WARS_SYNC_20261023-0957.zip. Shots /mnt/project-files/ice-highlights/.
Seen but NOT fixed: painted ice on a raised cell drapes the ground under the rise (hidden); the ice fringe hangs down the arena's front step. Related [[ice-skin-drape]].
