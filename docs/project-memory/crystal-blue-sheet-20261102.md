---
name: crystal-blue-sheet-20261102
description: 11-02 crystal.png out of the game (Crystal Formation = Liquid_Blue_05 solid, PR #784); crystal cones out of the game, Meshy crystal shard GLBs everywhere (PR #788)
metadata:
  type: project
  modified: 2026-11-02T02:14:41.573Z
---
mondo 2026-11-02: "replace all crystal.png terrain in the game with liquid_blue_1 or liquid_blue_5, but not as liquids with a noise layer, just as solid textures".
PR #784: sprites.js TERRAIN_SPRITES.crystal = liquids/Liquid_Blue_05 (tile, HQ rooms, editor swatches, every _hzTex/K.mat 'crystal' prop). Not a _LIQUID_STYLES row, so no flow. Rules untouched. Per-map tints.crystal kept; on bright maps it reads pale/icy.

Then mondo: "those crystal cones that appear everywhere, i think they look really bad and i dont want them ... use the meshy glb crystal shards ... definitely get rid of these ones from everywhere".
PR #788 (token 20261102-crystalshards-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261102-0214.zip): three-renderer.js _crystalModel(kind 'shard'|'shards', h, o) wraps the Meshy Assets/misc crystal_shard / crystal_shards GLBs. Used by crystal-tile decorations, _hzCrystalShards (horizon, crystal monument, island crowns, spires), Singularity rim, HQ crystal_cluster prop. NEVER bring back ConeGeometry crystals. The glow pool under _hzCrystalShards was dropped.
Screens /mnt/project-files/crystal-blue/. Notes docs/notes/maps-terrain-battle.md "THE CRYSTAL SHEET" + "THE CRYSTAL MODELS". Related [[liquid-sheets-20261026]]

FOLLOW-UP 11-05 PR #934 (live, token 20261105-crystalcrisp-02-cors): mondo said the crystal terrain looked blurry, and that every 128 px pixel tile must have the same pixel density. The sampling was already fine (NearestFilter, one sheet per square). Liquid_Blue_05 is a smooth 6,314-colour painting, while the pixel tiles have 24 colours. Crystal now wears terrain/crystal_blue.png, which is Liquid_Blue_05 run through bake-pixel-sheet.py (sharpened with wrap-around + 24-colour palette). It is crisper, but it still has big soft liquid shapes; moon_3 is far finer. Offered: a different pixel sheet if he wants a closer match. Also flagged: the other 47 liquid sheets are equally soft, and dirt/lava/obsidian.png are 1024 px photos. Proof /mnt/project-files/crystal-crisp/.
