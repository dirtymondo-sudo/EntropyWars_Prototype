---
name: bermuda-island
description: Bermuda remade as an island editor room (PR #369, 2026-10-20); sea.field flag, palm tree kind, voxel board kept
metadata:
  type: project
  modified: 2026-10-20T11:19:54.547Z
---
mondo 10-20: Bermuda/"the beach map" must be "literally just an island in the ocean", y2k beach, PS1 retro. Done in PR #369 (token 20261020-bermudaisle-02-cors, zip ENTROPY_WARS_SYNC_20261020-1119).

- Room `site_prebuilt_bermuda_island` (data.js, before THE HARBOUR). Arena 12×12 @ 18,18 takes `prebuilt_bermuda_delta`, so Bermuda is in the online pool now and its crystal fights the island. Old voxel board = `prebuilt_bermuda_8x8_delta` via HQ_ARENA_RULES.voxelKeep (shared list; keep every id on merges).
- `terrain.sea.field: true` lets a sea room host THE FIELD (deep sea = deep_water hazard, shallows wade). Without it sea rooms are refused.
- HQ_TREE_KINDS `palm` (kit: foliage prefix in three-renderer.js → Assets/door/models). Use it for any beach/tropical room; old Bermuda sea room's bare trees are palms now.
- Sand texture: only `desert` exists in the bucket (golden, pebbly). Not yet seen in game by mondo. [[arenas-12x12]]
