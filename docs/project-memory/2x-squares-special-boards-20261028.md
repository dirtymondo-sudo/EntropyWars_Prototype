---
name: 2x-squares-special-boards-20261028
description: 2× squares for exploration fights, Clash Temple, Training Room, Holo Sim (PR #641, 10-28); voxel boards untouched, awaiting mondo's pick
metadata:
  type: project
  modified: 2026-10-28T10:36:32.205Z
---

Part of mondo's "2x everywhere" (10-28), see [[strip-big-squares-20261028]]. PR #641 merged, token 20261028-sq2xfield-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261028-1035.zip.

- Exploration fights: HQ_FIELD_RULES.squareM 3.5; data.js hqFieldSquareFor(roomId) = 3.5 when the room's 3.5 m lattice (hqFieldLattice(id, true, 3.5)) has >= squareMinWalk (36) walkable squares in one 4-connected region, else 1.75 until the room is grown (auto-switch). Room `fieldSquareM` forces it. Box rooms take cellM (hqFieldBoxInfo). Caves stay 1.75. Site threads grow their own side rooms (coordinator's split).
- Holo Sim + Training Room = 63 m halls, Clash Temple = 192 m, all doubled in plan (heights kept in levels, props real size). Boards re-cut on 3.5 (bake-arenas.js --own / clash_stage now cut on hqArenaSquareM and write `sq`). Tutorial 8x8 cells unchanged.
- Growing a room => rerun bake-holes.js for it (gaps are baked on 1.75 squares of the old room).
- Exploration board is the whole room lattice, so a room fights on fewer squares than before (Skinwalker 16x12 at 3.5 vs 24x24 crop).
- Voxel boards (~35 full-site, ~55 area Δ 8x8, kept "· voxel"): NOT changed; decision card to mondo (recommend leave as is; alt: half-size units, or rebuild as rooms).
- Shots: /mnt/project-files/2x-squares-special/.
