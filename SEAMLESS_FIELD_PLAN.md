# SEAMLESS_FIELD_PLAN.md — the battle inside the room you were walking

The plan doc the seamless field never had. It gathers what shipped in the
three deliveries of 2026-09-22 (THE TRUE GROUND, THE TERRAIN ROOMS, THE LIGHT
HOLDS) and sets the rules for the part that was missing: **a battle only
needs the part of the room it can see.** Append to §7 on every session.

## 1. The contract (what is shipped)

- An encounter in a BOX room (a complex part, a generated area, a cave
  chamber) fights on ITS OWN 8×8 WINDOW rasterised from the room
  (`hqFieldWindow` / `hqFieldBuild`, data.js). A site's board room fights
  its Δ; a room with a sea keeps the site's Δ.
- THE TRUE GROUND: every unit stands on the room's real surface
  (`entry.field.tops` → `_fieldGroundTop`, the first line of `tileTopY`);
  no voxel column is built; the engine's levels are THE TIER RULE
  (`hqFieldTierOf`) over the window's lowest floor.
- THE ROOM ROUND THE FIELD: `_hqBuildRoomInBattle` (three-renderer.js)
  draws the room in the battle's frame through ONE matrix
  (`_hqBattleRoomMatrix`), as the occlusion fade's facility group.
- THE LIGHT HOLDS: the battle wears the room's rig, fog, look, AO and
  ceiling (`_fieldGroundDress`, `ThreePost.setFieldLight`); the crossfade
  waits for the party's rigs; THE SWOOP starts from the walker's eye.

## 2. The problem (why a city tanks)

Nothing is DOWNLOADED at the cut — every sheet and model was in memory from
the walk. What tanks is per-frame work on top of a room that was rebuilt
whole:

1. **The rebuild.** `_hqLeave` disposed the walk's room and
   `_hqBuildRoomInBattle` ran every builder again on a scratch record: the
   terrain mesh, the outer ground, the treeline, every lot, every prop GLB
   re-cloned, the traffic, the road paint, the decals, the climbs. Seconds
   of hitch on a city, twice the memory.
2. **No radius.** Every piece of a 200 m city stood in the battle. Three.js
   frustum-culls per mesh, so the small props off screen were cheap, but
   the number of draw calls, the shadow pass and the occlusion raycast all
   scale with what EXISTS, not with what is seen.
3. **The merged batches never cull.** The terrain is one mesh, a city's
   textured lots are ~20 merged meshes (one per sheet), the road paint is
   three, the treeline a batch. One bounding box covers the room, so each
   draws from every angle and enters every shadow pass.
4. **Everything casts.** Under true ground the whole room casts and
   receives; the sun's ortho frame is the board's, but a merged batch
   always intersects it, so the depth pass renders the city every frame.
5. **The occlusion fade raycasts the whole facility group** from six or
   more subject points, every frame.
6. **The full post chain** (HDR, bloom, SSAO, the room's fog, the dome, the
   far roster) plus the room's whole point-light budget.

## 3. The rule

**A battle keeps what stands within THE BATTLE RADIUS of its window, and
beyond it only a cheap backdrop.** The walk's room is HANDED to the battle,
never rebuilt. Anything that scales with the room's size (shadow casters,
occlusion blockers, draw calls) must scale with the radius instead.

## 4. The deliveries

| # | Step | Status |
|---|------|--------|
| 1 | THE READOUT — `ThreeRenderer.perf()`: draw calls, triangles, an FPS average, the room's kept / culled counts, the same on the walk (`hq.perf()`), one console line per build | delivery 1 (2026-09-22) |
| 2 | THE BATTLE RADIUS — props, doors, counters, trees, lamps, cars, decals farther than `keepM` from the window are not taken; lots, backdrop prisms and thicket banks farther than `keepFarM`; shell parts, the field mesh, the outer ground, the plan walls and any merged batch always stand | delivery 1 |
| 3 | THE HAND-OVER — `_hqLeave({ handover: true })` stashes the walk's shell / door / prop groups instead of disposing them; `_hqBuildRoomInBattle` takes them for the same room under true ground and runs NO builder | delivery 1 |
| 4 | THE CHUNKS — split the terrain mesh, `_hqTexBatch`, the road paint and the treeline into ~20 m tiles so the camera and the shadow frustum cull them | open |
| 5 | THE STATIC SHADOW — the sun and its frame never move in a fight: refresh the depth pass on a unit move / a piece change, not every frame | open |
| 6 | THE BLOCKER SET — the occlusion fade raycasts pieces near the eye-to-subject lines only (a bounding-sphere prefilter per holder) | open |
| 7 | THE POST — SSAO at half resolution in a field, the reflectors off, the atmosphere tier down, the room's point lights capped by distance to the window | open |

The numbers live in data.js `HQ_FIELD_RULES.ground` (`keepM`, `keepFarM`,
`handover`). Kill-switches: `EW_HQ_NO_ROOM_HANDOVER` (the rebuild),
`EW_HQ_NO_BATTLE_RADIUS` (everything stands).

## 5. What the radius keeps and drops

- ALWAYS: anything wearing `_ew_hqPart` (the shell's slabs, the field mesh,
  the outer ground, the plan walls, the shopfronts, the bridges), the merged
  batches (their box spans the room, so the distance is 0).
- `keepM` (28 m ≈ 16 tiles): props, doors, ways, counters, lamps, cars,
  decals, finds, climbs — anything under a holder whose box lies farther
  than that from the window's rect.
- `keepFarM` (48 m): the lots (`_ew_hqLot`), the backdrop prisms
  (`_ew_hqBackdrop`), the trees (`_ew_hqTree`).
- NEVER in a battle: the atmosphere (`_ew_hqPart: 'fx'`, no ticker runs),
  the battle marker (`_ew_hqMarker`), the CSS2D plates, the characters.

## 6. How to measure

Console, on the walk in the room: `ThreeRenderer.hq.perf()`. In the
battle: `ThreeRenderer.perf()`. Both print `{ fps, ms, calls, triangles,
textures, programs, room: { kept, culled, props, scenery, handover } }`.
The build logs one line: `[HQ→battle] <room>: kept n · culled m (props p ·
scenery s) · radius 28/48 m · handed over`. Compare the walk's calls to the
battle's in the same room: the battle should be at or under the walk.

## 7. Log

### 2026-09-22 — delivery 1: the readout, the battle radius, the hand-over
See CLAUDE.md "THE SEAMLESS FIELD, delivery 4". Built without a browser:
the CDN is unreachable from the sandbox, so the numbers in §6 are the
user's to read first.
