---
name: crystal-gems-20261102
description: 11-02 PR #792 crystals became 13 gems in 4 growth forms built from the only two Meshy crystal meshes; real per-gem models would need new Meshy files
metadata:
  type: project
  modified: 2026-11-02T03:44:50.153Z
---
mondo 2026-11-02: the Meshy crystal shards (PR #788, [[crystal-blue-sheet-20261102]]) looked repetitive/unrealistic; wants ruby, diamond, sapphire, emerald, quartz, lapis, amethyst etc, different colours AND shapes; asked if Crystal Guardian has gem models.

Found: R2 has ONLY two crystal meshes (Assets/misc Meshy crystal_shard + crystal_shards) plus crystal_ball (weapon). Crystal Guardian = body model only; its gem spells tint the same shard. No gem pack.

Shipped PR #792 (token 20261102-gems-03-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261102-0344.zip): three-renderer.js `_GEMS` (13 gems: ruby sapphire emerald amethyst diamond quartz rose smoky citrine topaz aquamarine garnet lapis; colour/glow/Phong shine), `_gemCluster` forms druse/points/chunk/bed from the shard (+flat cluster for bed), each piece own height/girth/lean. Board crystal tiles = 3x3 veins of one gem (seed from board size+mapEnv.tint, guest matches), tile growth 0.62-1.0 tile tall. Also horizon outcrops/monument, Singularity rim, HQ crystal_cluster prop, _hzGeode (octahedra gone). Looks only. Notes: docs/notes/maps-terrain-battle.md "THE GEMS". Shots /mnt/project-files/crystal-gems/.

Open: offered mondo a Meshy list for truly distinct gem geometry (octahedral diamond, hexagonal emerald, lapis boulder, amethyst geode...). Not confirmed yet.
