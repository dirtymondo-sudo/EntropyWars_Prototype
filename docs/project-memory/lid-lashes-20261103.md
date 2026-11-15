---
name: lid-lashes-20261103
description: 11-03 PR #883: stock Lashes 1-4 + every MPFB body's own lashes were invisible (drawn on the cut eyelash helper); bake-lashes.py redraws them on the lids
metadata:
  type: project
  modified: 2026-11-03T18:14:20.681Z
---
mondo 11-03: "lashes 1-4 ... i click them but i dont see any lashes".
Cause: MakeHuman eyelashes01-04 are fitted to hm08's helper-l/r-eyelashes groups; bake-mpfb.py cuts that helper, so the lash layers (and the stock sheet's own lashes) landed on a dead UV patch (box ~673,15). Pack "Mesh lashes" (mindfront) are lid-fitted and always worked.
Fix PR #883, token 20261103-lidlashes-01-cors, uploaded to R2 directly (4 PNGs mpfb/looks/eyelash_eyelashes0N.png + sprites/three-renderer/ASSET_MANIFEST).
- bake-lashes.py (numpy, mpfb2 clone base.obj + system eyelashes): nearest-skin projection; --check reproduces mindfront boxes exactly.
- "Body's own": sprites.js getMhOwnLashLayer + three-renderer _ccOwnLashMap (one shared texture per stock map).
- Rerunning bake-mpfb.py --looks undoes it: run bake-lashes.py after.
Shots /mnt/project-files/creator-lashes/. Notes character-creator.md "THE LID LASHES". Related [[eye-pack-20261103]] [[character-models-plan-doc]]
