---
name: climb-preview-20261111
description: PR #1121 (11-11) move hover / Climb verb / tile menu rows preview the climb with CLIMB or HANG + ENDS TURN chips; move-then-act previews follow real path
metadata:
  type: project
---
PR #1121 merged 2026-11-11 (battle 97ef5a45, three-renderer 1f09aa3f, hud 9546c96f, live on R2). Thread (thread in the owner project).
- mondo: hovering a climb ledge in MOVE showed a plain walk arrow, the click climbed and ended his turn.
- Now: walk to foot blue, face sandstone arrow, hologram climbs (2 AP on top, 1 AP hangs on wall), ghost chips CLIMB / CLIMB DOWN / HANG + ENDS TURN. Same preview in CLIMB mode and on tile menu Move here / Jump here / Climb rows (window.previewMovePlan). Move-then-act arrows follow findMovePath (moveRouteWps).
- No rule changed. Notes: docs/notes/champions-combat.md "THE CLIMB PREVIEW". Proof /mnt/project-files/climb-preview-20261111/.
- Left as is, flagged to mondo: in MOVE a ledge with a plain move square behind it on the same ray still gives hover + click to that square (THE SEE-THROUGH CLIMB, 11-03). A second walk that ends the turn has no ENDS TURN chip (not asked). Not viewed on WebGPU.
- Browser-proof tip: headless hover needs the camera settled; arrows pulse and wash out on the Training Room floor, use Stonehenge.
Related: [[climb-two-ways-20261101]] [[roof-climb-20261101]]
