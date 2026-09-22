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
| 4 | THE CHUNKS — split the merged batches so the frusta cull them | superseded by §8.3 step 7 (THE CUT re-cuts them over the chunk instead) |
| 5 | THE STATIC SHADOW — the sun and its frame never move in a fight: refresh the depth pass on a unit move / a piece change, not every frame | open → §8.3 step 6 |
| 6 | THE BLOCKER SET — the occlusion fade raycasts pieces near the eye-to-subject lines only (a bounding-sphere prefilter per holder) | open → §8.3 step 5, FIRST |
| 7 | THE POST — SSAO at half resolution in a field, the reflectors off, the atmosphere tier down, the room's point lights capped by distance to the window | open → §8.3 step 10 |

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

### 2026-09-22 — the second plan: THE CUT (planning, no code)
The user: the hall is fine, a city is ~10 fps; "slice a 12×12 chunk, 8×8 the
map, the rest a moat / holo grid, keep the fog and the weenies, strata under
the 8×8 per room, puzzles later; are we doubling something?" §8 answers: the
occlusion raycast against the merged room (~10⁸ ray-triangle tests a second
on a city), the board's shadow frame over a room, the site's far roster built
over a room whose own sky is dropped. §8.3 is the order: the blocker set
first (the 10 fps), the static shadow, THE CUT, THE STRATA, THE SWITCH, the
post. Nothing measured live (the CDN is unreachable from the sandbox).

### 2026-09-22 — delivery 5: THE BLOCKER SET · THE STATIC SHADOW · THE SKY ONCE (§8.3 steps 5 + 6, §8.1 item 3)
See CLAUDE.md "THE SEAMLESS FIELD, delivery 5". Step 5: under a true-ground field
`_occComputeBlockers` never raycasts the facility group whole — `_occFieldBuild`
lists the group's direct children with a measured bounding sphere (a root carrying
the field mesh, the outer ground, a textured-building batch, the road paint, a
backdrop prism or > 40 k triangles is OUT and its meshes wear `_ew_occSkip`) and
`_occFieldCandidates` hands each ray only the roots whose sphere lies within
`blockerM` (2.5 m) of the eye→subject segment; the five board-point subjects are
gone (the units + the focal tile are the subjects). Step 6: the shadow gate reads
`_shadowsDirty` + the lighting ease alone under a field (`staticShadow`), and the
four tween-end loops stamp a landing. Item 3: `hqFieldLayout` says `scenery: 'none'`
for EVERY field (an open room keeps its stars / day / tint), the hand-over stash
carries the room's own floaters + landmarks and the battle hangs them under a matrix
holder in the horizon group outside the facility group (a rebuild re-builds the
landmarks on a scratch record). Readout: `perf().occ` = `{ roots, merged, rays,
tests, ms }` and the build line prints `blockers n (m merged out) · sky k`. Built
without a browser (the CDN is unreachable from the sandbox) — the numbers are the
user's: `hq.perf()` on the walk against `perf()` in the fight in Downtown / the Grid
/ the sewers / the cavern, and `perf().occ.tests` should read a handful per ray.
Steps 7 (THE CUT proper: the re-cut chunk + the moat), 8, 9, 10 stay open.

## 8. The second plan — THE CUT (2026-09-22, planning)

The user, after delivery 4: the hall is fine, a city or any big area is ~10 fps.
"The explorable world runs smooth. The battles run smooth. Combining them is
trouble — unless we are doubling something." We are. §8.1 names it; §8.2 is the
user's idea (a chunk, a moat, strata under the 8×8, a switch) made a plan.

### 8.1 What is actually doubled (read off the code, not measured live)

The battle does not ADD the room to a board. It applies the BOARD's per-frame
machinery — written for 64–128 tiles of voxel columns — to a ROOM-scale scene
that was never built for it. Three of those loops scale with the room:

1. **THE OCCLUSION RAYCAST is the 10 fps.** `_occComputeBlockers` raycasts
   `_facilityNearGroup` recursively (`intersectObjects(groups, true)`) —
   under the hand-over that group IS the whole room: a city's terrain field
   (one merged mesh; Downtown at `res` 0.5 m over 224 × 176 m ≈ 300 k
   triangles), ~20 merged lot batches, the road paint, the treeline, every
   prop. three r128 has no BVH: every ray tests every triangle of every mesh
   whose bounding sphere it crosses, and a merged mesh's sphere is the room.
   With a facility group present THE BOARD IS A SUBJECT: five grid points +
   the selected unit + the focal tile = up to 7 subjects × 5 rays, recomputed
   every 60 ms (`OCC_RECOMPUTE_DT`) — ~600 rays/s × ~3 × 10⁵ triangles ≈ 10⁸
   ray-triangle tests a second on the main thread. The walk never raycasts
   geometry at all: `_hqCamBlocked` reads the data rules (the height field,
   the blockers, the plan). The hall is fine because its room is a box with
   forty pieces.
2. **THE SHADOW FRAME.** The battle's sun frames the board; a merged batch
   always intersects any frame, so the depth pass draws the whole room on
   every dirty frame (`_shadowsDirty` / `_shadowMotion` — every unit tween,
   every `_applyFogVisibility`). The walk did the same pass, but on the
   room's key with nothing else moving; in a battle it fires far more often.
3. **THE SKY TWICE.** An OPEN terrain room keeps the SITE's far roster
   (`hqFieldLayout`: `open` keeps `env.scenery`) — so the battle builds and
   animates 50–100 floaters per frame (`_animateFloaters`) — while the ROOM's
   own sky and weenies (`H.sky`, `_hqBuildLandmarks`) are NOT in the
   hand-over stash and vanish. Twice the work and the wrong picture.

Everything else the battle adds (the fog grid, nameplates, reticles, the
post chain) is the same cost in a room as on a board. Fix 1 alone should
bring a city from ~10 fps to the walk's rate; 2 and 3 are the rest of the gap.

### 8.2 THE CUT — the user's idea, as the rule

> "slice out a 10×10 or 12×12 chunk, make 8×8 of it the battle map and the
> rest a moat / landscape; the rest empty or a flat holo grid; keep the fog and
> the big weenies; terrain blocks under just the 8×8 so Meteor / Flat Earth
> work, layered by what room the 8×8 is on top of; eventually puzzles."

Yes — with three amendments the geometry demands:

- **The chunk is a RE-CUT, not a filter.** The radius (§3) filters PIECES,
  but a terrain room's ground, a city's lots, the road paint and the treeline
  are merged meshes whose box spans the room — a filter cannot cut them. The
  chunk REBUILDS them over the chunk's rect from the SAME DATA (the height
  field's samples, the lot rows, the street rows, the tree list): `_hqBuildTerrain`
  gains a `rect`; a 12 × 12-tile chunk is ~21 m square ≈ 3.6 k samples — a
  few ms, against seconds for the room. The props, doors, walls and plan walls
  inside the chunk are HANDED OVER as today (they are pieces); everything
  outside is dropped.
- **The moat is the room's own edge, not a new look.** The ground past the
  chunk fades through THE WORLD's dissolve (`_wdInject`'s fbm discard, pinned
  at the chunk's edge — the shader exists) into the MOAT: a flat plane at the
  chunk's median floor in the room's floor colour with a lit lattice at the
  tile pitch (`EW_HQ_FIELD_MOAT = 'grid' | 'fog' | 'none'`; the grid is the
  default the user asked for), the room's fog to the horizon, the room's SKY
  and LANDMARKS handed over (`H.sky` joins the stash; `_hqBuildLandmarks` runs
  on the horizon group), the site's far roster NEVER built for a field
  (`scenery: 'none'` for every field, open or closed). A city's backdrop
  prisms are the far silhouette — cheap boxes, kept.
- **The strata are drawn only where the engine dug.** Under true ground the
  columns are not built and `_fieldGroundTop` reads the room's STATIC tops —
  so today a Meteor crater / a Flat Earth dig / a Build raise changes
  `state.boardHeights` and the eye sees nothing (a real gap, §8.3 D8).

### 8.3 The deliveries (the order is the plan)

| # | Step | What it fixes |
|---|------|---------------|
| 5 ✅ | **THE BLOCKER SET** — the fade raycasts a per-battle `_occFieldRoots` list: pieces whose bounding sphere lies within `blockerM` of an eye→subject segment, never the field mesh / outer ground / merged batches (they never fade — `_ew_occSkip` them AND leave them out of `groups`; a wall group fades, the ground never); under true ground the five board-point subjects go (the units + the focal tile are the subjects; the shell's walls are the only thing that can hide them) | the 10 fps (§8.1 item 1) |
| 6 ✅ | **THE STATIC SHADOW** — a field battle's depth pass refreshes on a unit's landing / a piece change / a terrain edit, never on a tween frame (`_shadowMotion` ignored under `_fieldGroundLive()`; a moving unit's own shadow is the cheap blob) | item 2 |
| 7 (the sky half ✅, the re-cut + the moat open) | **THE CUT** — `HQ_FIELD_RULES.cut = { moatTiles: 2, moat: 'grid', fadeM: 3 }`: the chunk = the window + `moatTiles` a side (12 × 12); `_hqBuildTerrain(copy, { rect })` re-cuts the field, the water, the decks, the walls, the rails, the scatter, the lots (`_hqBuildCityLots` filtered by lot rect), the road paint and the treeline over the chunk; the hand-over keeps pieces inside the chunk only (`keepM` = the moat's edge); the moat plane + the dissolve edge + the fog; `H.sky` in the stash → the room's dome + landmarks in the battle; `scenery: 'none'` for every field | item 3, the radius made exact, the user's chunk |
| 8 | **THE STRATA** — `HQ_FIELD_RULES.beds[family]` (facility: concrete · rebar · bedrock; city: asphalt · earth · bedrock; cave: rock · rock · lava-deep; woods: soil · roots · rock; divine: cloud · cloud · cloud; sea: sand · rock · deep water; astral: void) keyed off the room's shell family / hub, `terrain.bed` on a room overriding; `hqFieldBuild` files `field.levels` (the tier per cell at the build) and `tileTopY` = the true top + (`boardHeights − levels`) × the level step; `rebuildTerrain` builds a column ONLY for a cell whose engine height differs from its level — a dig shows the bed's faces (THE CRATER FIX's rule: the crater opens onto the column's own faces), a raise stands a column wearing the room's floor sheet on top; the picking quads follow the engine height | Meteor, Flat Earth, Build, reshape in a field |
| 9 | **THE SWITCH** — a counter with `action: { field: { ox, oz, enemies, gm } }`: `hqMarkerLaunch`'s shape with a PINNED window and a named enemy set at a spot, launched by E — the puzzle hook ("get into position, press the button, the field turns into battle mode, the enemies are where you need to be") | the user's puzzles; no renderer work |
| 10 | **THE POST** (was 7) — SSAO at half resolution in a field, the reflectors off, the atmosphere tier down, point lights capped by distance to the window | the last of the frame |

Measure each with §6: the walk's `hq.perf()` against the battle's `perf()`
in Downtown, the Grid, the sewers, the cavern. The target stands: **the
battle at or under the walk.** After 7 the battle's draw calls should be a
fraction of the walk's (a 12 × 12 chunk of a 200 m city).

### 8.4 Rules that come with it

- A field battle never raycasts a merged mesh. Anything wearing
  `_ew_hqTerrain` / `_ew_hqOuter` / a batch tag is out of the occlusion
  `groups`, not merely skipped after the hit.
- The room's SKY is part of the hand-over. A field never builds the site's
  far roster.
- The strata are a property of the ROOM FAMILY, never of the site's Δ (the
  mall is concrete over earth whatever Downtown's board says; the cavern is
  rock over lava).
- A builder that takes a `rect` must produce, over that rect, exactly the
  triangles it produced there over the whole room (the same samples, the same
  seed per lot / tree) — the chunk must match the walk the player just left.
