---
name: psx-mega-pack-20261108
description: Pizza Doggy PSX Mega Pack (bought 11-08) on the game bucket, 10 Meshy props swapped (PR #1053); licence forbids ANY AI use and standalone redistribution
metadata:
  type: project
  modified: 2026-11-08T11:31:11.498Z
---
mondo 11-08 bought Pizza Doggy's PSX Mega Pack (creator coupon), dropped it unzipped in `dirtymondo:inbox/psxmegapack/`.
Thread "Add PSX Mega Pack models to the game" (thread in the owner project):
- 584 of 592 GLBs uploaded to `ewmusicsfx:Assets/world/packs/pizzadoggy_psx_mega_pack/<category>/<pack name>.glb`
  (categories: furniture, modular_structures, items_and_weapons, small_props, electronics_and_misc, large_props, lighting, decals).
  Textures embedded, static, real metres (wall module 4 m x 3 m).
- Skipped: 8 `*_fake_light_*` glow cards (real-lights rule). They + the loose textures/ folder + licence PDF live in
  `dirtymondo:source/Assets/world/packs/pizzadoggy_psx_mega_pack/`.
- MODEL_LIST §12b (hand part in MODEL_LIST_EXTRA.md) = inventory + Meshy/code swap candidates BY NAME; list-models.js SOURCES row; EW_CREDITS row.
- SWAPPED 11-08 (mondo "yeah sure", PR #1053): cardboard_box, cinder_block, couples_bed, dorm_bed, library_shelf, key, house_key,
  pen, pencil, vent_grille. Catalogue `base: 'psxmp'` (file '<category>/<file>.glb'); _MISC_GLB rows 'psxmp/...' via sprites.js
  EW_ASSET_MOVES alias Assets/misc/psxmp/. Facings MEASURED from vertices (beds/pen/pencil turn 90). Not swapped + why: MODEL_LIST §12b.

**Why:** Pizza Doggy licence (same as Retro Tree Pack): no AI use at all (no Meshy from them, not as reference/input/prompt),
no standalone redistribution, no open-source/asset-pack inclusion.
**How to apply:** never feed pack models/textures/renders to Meshy or any AI image/3D tool; never commit pack files to the repo;
picking swaps = by name, mondo judges the look. Related [[itch-asset-packs-20261103]] [[meshy-audit-pack-first-20261104]] [[model-list-master]]
