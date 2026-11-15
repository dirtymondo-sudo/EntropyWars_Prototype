---
name: meshy-api-pieces
description: How Claude makes mondo's Meshy list pieces via the Meshy API (concept image -> approval -> low-poly model), started 2026-11-03
metadata:
  type: project
  modified: 2026-11-03T04:29:31.355Z
---
mondo 11-03 (thread in the owner project): Claude makes the Meshy list (character-models-plan.md
section 4a #1-46 + 6b/6c #47-72) itself through the Meshy API. This overrides "never generate art" for THIS work only.
His API key is in his (thread in the owner project) (never write it to repo/memory/zips/logs).

Flow he set: concept image first (Meshy text-to-image) -> HIS APPROVAL -> image-to-3d + texture in low-poly mode -> show
him, he names redos. Batch concepts so he approves several at once. Poly targets scaled by size vs a character
(~15000 character, ~6000 chair, car more, pen less). Outputs in /mnt/project-files/meshy/. Wire into game only when asked.

API facts (docs.meshy.ai, checked 11-03): "lowpoly" model_type is deprecated (retires 2026-11-30); the low-poly mode is
now model_type "smart-topology" + ai_model "meshy-t2.5" (target_polycount 100-30000, triangles), 15 credits with 2K
texture. text-to-image nano-banana-pro works on his plan (9 credits). Balance 11-03: ~10,600 credits.
#1 cowboy hat is mondo's own piece (row 16), not remade. #42 split into 42a tail + 42b dorsal fin; #2 has 02b thigh holster.
Related [[character-models-plan-doc]]
STATUS 11-03: 73 pieces modelled (mondo asked poly targets doubled: MPFB bodies ~30k), files /mnt/project-files/meshy/models + renders, plan row 15 PR #822. Waiting on his redo calls (flagged 31, 40, 19 pair, 43 flat, 44 fur). Scripts in that thread's scratchpad (meshy.py/concepts.py/model.py; render via playwright+three from unpkg).
REDOS 11-03 (PR #824): 31/33/40/44/56 redone, #58 cards dropped (he uses a pack), #49 whip = Meshy handle + Blender lash on 21 bones (mondo: whips should be straight so they animate). His concept rules: no strings/chains/cords on pieces (they model badly), screens blank (lit in game). Cloud Blender 4.2.3 downloads fine from download.blender.org; use Cycles CPU (no EGL for Workbench).
