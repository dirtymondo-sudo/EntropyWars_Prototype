---
name: arenas-12x12
description: 2026-10-06 PvP arenas went 8x8 -> 12x12 (PR #147); walled-cut bake rule, rooms widened, what stays 8x8
metadata:
  type: project
  modified: 2026-10-20T11:45:19.741Z
---
mondo 2026-10-06: "make all arena maps 12x12 instead of 8x8". Done in PR #147 (token 20261006-arenas12-01-cors), zip /mnt/project-files/arenas-12/.

- data.js HQ_ARENA_SIZE = 12 drives HQ_ARENA_RULES.size + HQ_FIELD_RULES.size; hqArenaHouse(S) centres spawns (x 4..7) and nexus (5..6).
- Kept boards (Göbekli TELL, Looking-Glass garden) re-authored at 12 via _mfDeltaNew({S}).
- bake-arenas.js: strict open pass, then "walled cut" (room walls inside window, wallMax 48, topMax 3). `node bake-arenas.js prebuilt_x` bakes one site.
- Rooms changed for it: Lodge THE HALLS space 22x22 m; Woods clearing gen.open disc {x0,z10,r10.5}.
- 31 site arenas + 2 kept = 33 in online pool. Hell/Revenge/Bermuda no arena (8x8 voxel Δ, out of PvP); facility boards stay 8x8.
- Not yet seen in game by mondo; camera framing on 12x12 unverified in browser.

CRYSTALS (PR #239 + #240, 2026-10-16): the floating crystal (battle_marker) fights its site's arena (data.js hqMarkerArenaId) with the arena's room drawn round it (battle.js _encArenaFallback). Hell, Bermuda, Flying Dutchman have no arena and keep their OWN moving Δ boards (sailing / descending). #239 swapped them to Mars/Atlantis/Haunted and mondo was angry ("flying dutchman has the pvp map where its moving on the water, why would you replace it"); #240 reverted. Never swap a site's moving board for another site's map. Hitting a native still uses an 8x8 area Δ in Bermuda sea, Downtown harbour, Atlantis abyss, Dutchman deck.

CLASH TEMPLE DONE (PR #374, 2026-10-20): clash_stage = 10x10 cut of its own room DOOR_HQ.rooms.clash_temple (HQ_CLASH_STAGE + `node bake-arenas.js clash_stage`; formation via hqArenaEntry opts.formation). Old voxel = clash_stage_voxel "Temple · voxel", VS CPU only. Not via voxelKeep/own (Clash needs its formation). Shots /mnt/project-files/new-maps/temple/.

VOXEL LEFT (checked 2026-10-20, plan /mnt/project-files/voxel-maps/VOXEL_MAPS_PLAN.md): online = Göbekli Δ, Looking-Glass Δ, Clash Temple (clash_stage 10x10, ranked Clash too). Dry-run bake: Looking-Glass garden fits (needs board n:12 + pieces); Göbekli TELL has no 12x12 (only ley lines, banned) so a TELL space must widen to ~24 m. ENTROPY DISSOLVE (THE WORLD, 09-13) is inert on every arena: hqFieldLayout sets env.world {kind:'room'}; the World setting does nothing there. Restoring = port _wdInject to the arena room + an underside under the board (medium job).

LOOKING-GLASS REMADE (PR #367, 2026-10-20, token 20261020-chesscourt-01-cors, zip ENTROPY_WARS_SYNC_20261020-1107): online map = garden THE BOARD grown to 12x12 with marble chess pieces (HQ_TREE_KINDS chess_*) as cover; 12/11/10/9 cuts all on the board (bake-arenas.js board rule). Old voxel kept via HQ_ARENA_RULES.voxelKeep -> prebuilt_lookingglass_12x12_delta 'The Looking-Glass Δ · voxel' (VS CPU only). Left HQ_ARENA_RULES.keep (only Göbekli now). Screens /mnt/project-files/new-maps/lookingglass/.
