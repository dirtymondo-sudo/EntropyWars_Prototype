---
name: meshy-creator-pieces-20261103
description: Plan row 16 DONE 11-03 (PR #829): 71 Meshy pieces fitted on MPFB bodies by bake-meshy.py and wired as character-creator picks
metadata:
  type: project
  modified: 2026-11-03T06:57:49.513Z
---
2026-11-03, PR #829 (thread in the owner project): mondo asked how the Meshy pieces get into the
creator and into spells; this thread did the creator half (the spell half is PR #827, row 24).
- `bake-meshy.py` (repo root, cloud Blender + MPFB, imports bake-clothes.py) -> charactercreation/wear/ewm_<key>.glb, solid,
  71 pieces (whip #49 left to spells, #58 dropped). One `piece(...)` spec line per piece; modes documented in models-assets.md
  "THE MESHY PIECES". Rerun one piece: `--only key --views dir` (3x3 check sheet).
- Creator tabs added: Armour, Creature heads (cat `heads`, one at a time), In the hand (one prop), Badges + jewellery, Back gear,
  Ears/feet/fins. Creature heads hide head skin+hair+eyes; mermaid tail hides legs + trousers/shoes; props curl the right hand.
- ewm GLBs (~47 MB) are NOT picked up by sync-zip.js: added by hand to the zip (ENTROPY_WARS_SYNC_20261103-0657) and listed in
  ASSET_MANIFEST.json.
- Not yet seen by mondo; open questions: fit tweaks he names, whether the DOOR Agent's own gun should drop when a prop is held.
Related [[meshy-api-pieces]] [[character-models-plan-doc]]
