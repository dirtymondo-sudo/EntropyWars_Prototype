---
name: foliage-pass2-20261125
description: 11-25 foliage pass 2 (lead thread): research + ground rules G1-G11 in flora.md §0, grass everywhere + clumps/patches/bare/edges/pebbles shipped PR #2550; sibling threads
metadata:
  type: project
  modified: 2026-11-25T07:49:59.686Z
---
mondo 11-25: grass/foliage "samey", wants research first (he was angry the lead thread didn't research before coding), rules for grass, rocks/flowers, Woods ferns ugly, Fairy Forest needs a flower field, Disaster City palms need planters, right trees per zone. Lead (thread in the owner project).
- RESEARCH + RULES: docs/notes/flora.md §0 (Ghost of Tsushima clumps, Horizon density maps, Far Cry 5 biome recipes, Witcher 3, env-art practice, street tree pits), rules G1-G11, PR #2548.
- CODE PR #2550 (live, token 20261125-groundrules-01-cors): three-renderer.js GROUND_RULES (_grAt clumps/patches/bare, _grNearBucket edges), blade grass in EVERY climate room (_hqGrassWanted; was 18 rooms), on plan MASS floors 55%, never on paths/decks/prop footprints; per-climate grassH/grassDry; ZONE_FLORA near (ferns by trunks), stones (kit rock pebbles), tint, fairy `field` row + terrain.floraFields. ~210-250k blade tris in view; real-machine fps unmeasured.
- Siblings: Woods ferns (owner-project id) (owns M.fern/M.bush/size/ZONE_FLORA.tint), Fairy flower field (owner-project id) (F-room.js + floraFields), DC palm planters (owner-project id).
- Probe lesson: info.mask 0 = plan MASS; the old grass skipped it, so woodland floors beside paths were bare even in grassField rooms.
Related [[grass-two-sides-20261118]].
