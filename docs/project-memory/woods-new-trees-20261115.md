---
name: woods-new-trees-20261115
description: The Woods FULL TREES (mondo 11-15): retro-pack trunks + real crowns from their own leaf pictures; bake-trees.py, tree_52-56; LIVE PR #1501, Woods only; what he rejected
metadata:
  type: project
---
Thread (owner-project id). mondo 11-15 18:03: dislikes the retro-pack trees' 2D cutout leaves, wants more realistic trees made from assets/textures already in the game.
- 18:19: keep the trunks + branches of the current trees (retro pack) and of the Quaternius OBJ trees ("A"), make better leaves, textured with the CURRENT trees' leaves.
- Round 1 (solid low-poly clumps): "too chunky and low poly, something slightly more realistic".
- Round 2 (dark core + small domed leaf-spray cards): "better but the silhouette of the leaves isn't right, especially for the winter tree (the fir), it looks weird. Just try to make them natural looking".
- Round 3 posted 21:10 `/mnt/project-files/world-areas-plan/woods/woods_tree_leaves_3.jpg`: firs = 16 tiers of bough sheets, each a slice of the fir's own picture from stem to its real outline; leafy crowns = dark core + small sprays + ragged fringe sprays turned outward. Script draw-trees-leaves.py + tree-leaf-wins.json (Blender via pip bpy). WAITING for his OK; then build in three-renderer.js (tree kinds) / bake-woods.js.
- PR #1471 (same ask) is live: cabin board floor, main trails 3 squares, side paths 1 square (bake-woods.js MAIN list).
- 21:06 mondo "let's go with 2" (row 2 = current trunks). BUILT + LIVE PR #1501: bake-trees.py writes `<name>_full.glb` (R2 Assets/world/nature/retrotreepack/GLB/), data.js HQ_TREE_KINDS tree_52 oak / 53 birch / 54 tall birch / 55 spruce / 56 pine, ~500-600 tris each; bake-woods.js FULL map swaps every leafy Woods tree (thicket + feature). Other rooms still draw the card trees (not asked). Not seen in game; perf cost unmeasured (~2,000 trees).
- 21:20 mondo (after seeing them in game): "the ones that are not the winter tree still look really rough, please fix". PR #1503 live: leafy trees rebuilt like the fir (ten tiers of slices of their own picture, stem to real outline), same file names, manifest shas updated. LESSON: slices of the whole tree picture read natural; loose spray cards/blobs do not. Waits his look.
- 21:35 mondo: "the one on the very left looks bad (the oak), the rest are good". PR #1507 live: oak rebuilt (bake-trees.py form `oak`: steeper split slices, round crown, trunk visible). Birches + fir + pine APPROVED. Waits his look at the oak.
**How to apply:** if he likes them in game, offer to roll the full kinds out to other rooms; if the Woods gets slow, thin the thicket or keep cards for the deep forest. Related [[world-areas-plan-20261115]]
