---
name: open-maps-olympus-antarctica-20261103
description: 11-03 de-dungeoned sites (walls plan removed, new boards): Olympus+Antarctica PR #859, North Pole #864, Giza/Babel/Technoticlan/Agartha #868
metadata:
  type: project
  modified: 2026-11-03T11:53:05.235Z
---
mondo 11-03: "why are mount olympus and antartica built like dungeons with walls? ... audit every map ... redo the ones that make no sense".

PR #859 merged (token 20261103-openmaps-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261103-1152.zip). Before/after shots in /mnt/project-files/battle-map-audit/.
- Cause: HQ_AREA_SPECS `gen:{kind:'plan', look:'walls'}` carves spaces/halls out of solid mass. The planGen fallback rebuilds it if ANY space/hall feature rows remain, so remove those too.
- Whole rooms fixed (easier than battle-only). Olympus: open summit + Court of the Twelve (12 greek_column props, floor:true, on one-square ghost walls at x ±12.25). Antarctica: open ice + station yard (ice ridges, corrugated containers, iso tanks, flood mast).
- HQ_ARENA_RULES.within pins both (r 2.6); all 4 sizes re-baked (Olympus got an 11×11 for the first time). Run bake-holes.js (not dry) BEFORE bake-arenas or stale holes show as cloud_gap.
- Calls I made: fountain, lower stair and stepping clouds moved; garden rings 5→1; crevasse extended; Antarctica board sits south of the plaza.
- North Pole done PR #864 (zip 20261103-1215): walls plan gone, xmas_house cottages h 6 on 3x3 ghost blocks (wall row x0=x1,z0=z1, t 10.2: row ends are round), sleighs + snowmen on 1-square blocks, bay gate posts; within (-28,14). Wall rows past the room edge are clipped (hearth has no back wall).
- Giza/Babel/Technoticlan/Agartha done PR #868 (mondo OK'd, zip 20261103-1305): boards Giza sand before sphinx (17.5,77), Babel square (0,70) brick houses as point wall rows t 7 (plateaus drew as loaves), Technoticlan ball court (r 10: court walls block a 9x9's house rows), Agartha plaza (0,14). Lessons: a block:true prop on a square corner makes 4 squares rock; 9x9 has a 3x3 flat nexus in the middle + house rows 0,1,7,8, so a 2-row raised causeway can't cross it.
- No walled-court sites left among the ones audited.
Related: [[gobekli-arena-remake-20261103]]
