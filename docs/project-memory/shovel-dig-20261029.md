---
name: shovel-dig-20261029
description: PR #688 (10-29) THE SHOVEL DIG: Build dig plays a stoop-and-yank with the Halloween pack shovel; looks only; calls made + harness capture tricks
metadata:
  type: project
  modified: 2026-10-29T23:30:35.223Z
---
mondo (10-29, Halloween pack upload): "There's a shovel that can be used to make a dig animation for the dig action." PR #688 merged, sync zip ENTROPY_WARS_SYNC_20261029-2330.

- Block dig = attack kind 'dig' (tree keeps 'chop'). Body = castReap (Farm_Harvest), since no library has a shovel clip. The shovel is placed post-mixer from the right hand, and a two-bone IK puts the left hand on the D-grip. Then a dirt spray, a clod carried on the blade and flicked to the right. Kill-switch EW_NO_SHOVEL_DIG.
- Calls I made: the body turns to the dug tile while digging (looks only; real facing untouched). The dig clip plays whole, past the 1.4 s one-shot cap.
- Not done (possible follow-up): Grave Robbery finisher still has its procedural shovel (three-vfx-effects.js ~35340).
- Harness capture tricks (helps any close-up proof): wrap ThreeRenderer.hq.dev.renderer().render to move the camera. The game camera's `up` is tilted, so set it to (0,1,0) before lookAt, and hide sprites for the plates. Use draw DEMAND, because draw always is slower than battle.js's 350 ms attackAnimIds window and attack clips get missed. ThreeRenderer.setTimeWarp(0.08, ms) gives slow motion. Scripts are in the thread scratch only.
- Proof: /mnt/project-files/shovel-dig/. Related [[knock-anim-20261027]] [[sandbox-playtest-speed]].
