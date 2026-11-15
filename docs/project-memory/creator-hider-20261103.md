---
name: creator-hider-20261103
description: Creator Item Hider + rename dev tool (11-03, PR #815 hide, PR #854 rename + F2): mondo hides/renames creator picks himself, exports, bake-hidden.js bakes sprites.js EW_CREATOR_HIDDEN + EW_CREATOR_NAMES
metadata:
  type: project
  modified: 2026-11-03T10:51:22.925Z
---
mondo 11-03: "a devtool that let's me remove models like certain clothes and hairstyles from the character creator ... easier for me to manually exclude them". Then (11-03, PR #854): rename creator models "in the same place where i can hide models", and "i need to access it from the character creator obviously" (he was annoyed it was only in main-menu Settings > Developer, which every player can open).
OPEN IT: **F2 inside the creator** (after CREATE APPEARANCE on a race slot) toggles the hider; Settings > Developer > Creator Item Hider still works. F4 / UI Maker only themes + lays out the creator, never edits its picks.
Bar DEV · ITEM HIDER + NAMES: ✕ / SHOW hide, ✎ rename (box under the tile), MARKS on/off = player view, HIDDEN LIST, RENAMED list, CLOSE (F2), EXPORT HIDDEN + NAMES -> Entropy_Wars_Creator_Picks_<stamp>.json (v2: hidden + names). Older Entropy_Wars_Creator_Hidden_*.json = v1 (hidden only). Ships with nothing hidden, nothing renamed.
Renames are DISPLAY ONLY: catalogue labels stay (rules read them: skin side, beard camera, male/female trim).
**Why:** he picks the bad hair/clothes and the names himself; Claude only bakes.
**How to apply:** when he sends an Entropy_Wars_Creator_Picks_*.json / _Hidden_*.json (or a SAVE EVERYTHING file carrying ew_creator_hidden_v1 / ew_creator_names_v1), run `node bake-hidden.js <file>` (newest file = whole lists), node --check sprites.js, bump ?v=, PR + zip. Never delete the hidden assets. Notes docs/notes/character-creator.md "THE HIDDEN PICKS" + "THE RENAMED PICKS", plan rows 12m / 12o. Shots /mnt/project-files/creator-hider/ and creator-rename/. Related [[character-models-plan-doc]] [[creator-shelves-20261102]] [[creator-tabs-body-slots-20261103]]
