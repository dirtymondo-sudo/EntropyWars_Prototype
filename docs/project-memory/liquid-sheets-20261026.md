---
name: liquid-sheets-20261026
description: PR #545 (2026-10-26) — mondo's 48 R2 liquid sheets give every non-water/lava liquid its own look; picks are calls awaiting his OK
metadata:
  type: project
  modified: 2026-10-26T09:21:35.866Z
---
mondo 2026-10-26 uploaded 48 sheets to R2 Assets/Sprites/terrain/liquids/ (Liquid_<Blue|Brown|Green|Purple|Red>_01..08-128x128.png, Yellow_1..8 with no zero pad) and asked to use them to tell apart every liquid except water and lava, and to have them in the editor.
BUILT in PR #545 (merged; token 20261026-liquids-03-cors; zip r2-sync/ENTROPY_WARS_SYNC_20261026-0921.zip). Notes: docs/notes/maps-terrain-battle.md "THE LIQUIDS". Screens: /mnt/project-files/liquids/.
Picks (calls I made, flagged to him): poison=Green_02, poison_bog=Green_08 (olive), purple_bog=Purple_07, swamp/Black Ooze=Blue_06 darkened #4a4a4a, oil=Brown_02 darkened #7a7a7a, blood=Red_05. Yellow unused (no yellow liquid). healing_spring kept its own art (offered to switch).
- How it works: sprites.js TERRAIN_SPRITES + TERRAIN_BASE_TINT; three-renderer.js _LIQUID_STYLES `sheet: true` scrolls the liquid's own sheet in both wave layers.
- Editor: all 48 sheets = `urban:Liquid_<Colour>_<NN>` (sprites.js LIQUID_SHEETS, family Liquids) in the texture picker; POOL/STREAM Liquid dropdown lists all liquids; voxel editor Liquids tab, blood appended to ME_TERRAIN_IDS/MF_TID (id 161).
- Found: purple_bog.png never existed on R2 (404). poison and poison_bog share the label "Poison Bog" (not changed).
Related: [[element-terrain]] [[visual-rules]]
