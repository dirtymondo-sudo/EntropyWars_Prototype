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

### 2026-09-22 — THE ARRIVAL: the seam is ONE camera move (the crane, the two-shot, no card)

The user: "the seamless field plan is going well — very high frame rate even
in the city; the transition is still a little janky and it zooms out way too
much to an over-the-board view; fluid, stylish, cinematic, seamless, no cuts,
no loads." Read off the code, the seam was three moves and a card:

1. `showVSSplash` seeded the walker's eye, then `_afterVSSplash` ran the stock
   `resetBoardCamera(true)` — so THE SWOOP flew from the eye to the **board's
   overview** (getDefaultZoom ≈ 1.0 on the reset target, tilt 40, yaw 45),
   over 1.4 s. That was the zoom-out.
2. The ROUND 1 card played (1.85 s), then the first activation pan pulled
   back IN to the lead at the turn framing (1.5×). Two moves, a card between.
3. The walker's HEADING was thrown away: the reset's yaw is 45°, so the
   board spun under the crane. And `getCameraMode()` re-applies the preset's
   FOV every turn, which popped the walker's 52° lens to 45° mid-swoop.

Now (data.js `HQ_ENCOUNTER_RULES.arrival` is THE table; battle.js the block
after `_encRun`; three-camera.js THE CRANE):

- **THE MEDIUM TWO-SHOT** — `_encArrivalFrame()` runs in `_afterVSSplash`
  in place of the overview reset: `hqEncounterArrival(eye, lead, foe)` (pure)
  = the focal `lead` (0.42) of the way from the officer's lead cell to the
  native's, the WALKER'S OWN YAW (`hqEncounterYawOf(dx, dz)` — both eye reads
  carry `yaw` now), tilt 50; `camera.snap` at `getTurnFramingZoom() ×
  zoomMult` — and `snap()` files that tilt / yaw as the fight's RESTING
  orientation, so the first activation is a short slide onto the acting unit
  at the same angle. The C key's preset restores the player's own pitch.
- **THE CRANE** — `seedPose(eye, swoopS, crane)`: an ease-in-out cubic over
  2.1 s; the gaze runs ahead of the body (`lookLead` 1.18 — the pan lands
  before the dolly); the eye bows over the chord by `bow` 0.22 × its travel
  on a half-sine (a boom up and over, never a dolly out); the lens holds the
  walker's 52° and tightens to the board's only after `fovLate` 0.35.
  `setFOV` under the tween writes the DESTINATION, never the live lens; a
  window that elapses between two frames lands the record (it used to
  linger).
- **THE BEAT** — `_encArrivalRound(cb)` replaces the ROUND 1 card: letterbox
  bars (`barsVh` 7) ride the crane and retract 220 ms before it lands, the
  HUD (`body.enc-arrival` → the four panels + the party dock + the nameplate
  layer at opacity 0) fades in over the landing (`enc-arrived` carries the
  transition), the first activation fires `settleMs` (260) after the swoop.
  Reduced motion: no transitions.

Unchanged: THE SLIDE (260 ms), the held snapshot + the 220 ms crossfade keyed
on the first frame, the light hand-over. `npm test` runs
`encounter-arrival.test.js` (the yaw, the two-shot, the crane in a vm — the
bow, the lead, the deferred lens, the landing — the straight tween untouched,
the source sites). UNSEEN LIVE (RULE #1c): the bow's height against a low
ceiling (`crane.bow`), the two-shot's tilt against the player's preset
(`arrival.tilt`), the bars' height on a wide screen, the HUD fade's pace.
Next if it still reads busy: a 9 × 9 / 10 × 10 window is `HQ_FIELD_RULES.size`
plus the seat / reach tests' pins — the frame rate now allows it.

**THE FIRST STRIKE (the same day):** the probe showed the first activation going to
the fastest unit while the arrival framed the officer ("I have to select my unit
first"). The officer who swung opens round 1 now (`window._ewEncounterFirstId`,
set before the order is built, consumed by `buildBlitzTurnOrder`, round 1 only).

### 2026-09-22 — delivery 6: THE CUT + THE STRATA (§8.3 steps 7 + 8) — dig and build in a field

The user, after the CI red: "continue with the seamless field plan; I still need to eventually be
able to dig and build". Both steps landed (step 8 was already the plan's dig / build item — the user's
requirement is now written on the rule itself in data.js).

**THE CUT** (`HQ_FIELD_RULES.cut = { on, moatTiles: 2, fadeM: 3, moat: 'grid', outM: 60, gridTiles: 1 }`,
`EW_HQ_NO_FIELD_CUT`): a TERRAIN room's battle is built over the CHUNK = the window + moatTiles a side
(12 × 12). `_hqBuildRoomInBattle` sets `_hq.cut` (room metres + `fadeM`) on the scratch record; a
handed-over room keeps its doors / props / counters (the pieces) and DROPS the walk's shell group (the
whole field, the lots, the paint, the treeline — merged meshes no radius can cut), which is re-cut over
the chunk by `_hqBuildTerrain(copy)` + `_hqBuildBoxShell(copy)` + `_hqBuildClimbs(copy)`; the radius
becomes the moat's edge (`keepM = keepFarM = moatTiles × C + fadeM`). In the builders: `_hqCutHit(cut,
x0, z0, x1, z1, pad)` is the ONE rect test (no cut = true), `_hqCutRange(info, cut)` the field's sample
window (the chunk + the fade band, clamped, the SAME samples), `_hqCutPtsBox` a polyline's box; the
field mesh, the fluids, the decks, the walls (info.walls + the plan's), the rails, the trees, the
thicket, the stalactites, the bridges, the floats, the lots (+ their fronts), the shopfronts, the halls'
tubes, the ley veins, the road paint (at `quad`), the street lamps and the climbs each ask it; the outer
ground, the treeline, the sea, the traffic and the circuit are not built under a cut (the moat / no
ticker). The seed order is untouched (a stalactite's rng is drawn before the test; a lot's rng is its own
seed), so the chunk matches the walk. THE FADE: `_hqTerrainMat(info, S, cut)` carries `uCut` (room px)
+ `uCutFade` and discards past the chunk with a hashed dither over fadeM (the walk's material has
uCutFade 0 — the same program). THE MOAT: `_fieldMoatBuild` — four strips of a Lambert plane at the
window's reference floor (`R.field.ref`) in the room's floor colour × 0.55 out to outM, under the
room's fog, `_ew_hqOuter` + `_ew_occSkip` + `_ew_hqMoat` (never raycast, never faded), a second additive
pass wearing a canvas lattice at the tile pitch keyed to the window's origin (`moat: 'grid'`; `'flat'` the
plane alone; `'none'` nothing). `_fieldRoomStats.cut` + the build line print `cut 12×12 (moat grid)`.

**THE STRATA** (`HQ_FIELD_RULES.strata = { on, beds: { hq, cavern, woods, ranch, divine, city, dumb,
kingdom, deep, underworld, ley, astral }, fallback }`, `EW_HQ_NO_FIELD_STRATA`): data.js `hqFieldBuild`
files `field.levels` (= `B + c.tile`, every cell — the engine height at the build) and
`hqFieldBedFor(roomId)` → `{ side, floor, hub }` (a room's own `terrain.bed` — `{ side, floor }` or a hub
id — else its hub's row, else the fallback; every key a terrain sheet the game has, the test insists).
three-renderer.js `_fieldGround()`'s record carries `levels` + `elev` and **`deltaAt(x, y)` = the
engine's LIVE height (`getBaseHeightAt`) − the level at the build**; `yAt` = the true top + delta × the
level step — every tween, highlight, float and the pick quads follow a dig or a raise at once (the cache
holds the record, the delta is read live). `rebuildTerrain`'s field branch calls **`_fieldStrataBuild(ts)`**
after the picks (it runs on every `_heightVersion` change): `_fieldStrataFaces(N, yAt, deltaAt, elev)`
(pure, vm-tested) plans a top quad per moved cell (a raise wears the room's floor sheet, a dig the bed's
floor) and, per edge, a face wherever the cell's top differs from the neighbour's — OUTWARD from a
higher cell, INWARD (the pit's wall) into a lower cell whose neighbour stands unmoved, none between two
digs, a raise beside an OUT cell from its old top — in the bed's side sheet, tiled by height, into
`terrainGroup` (`_ew_fieldStrata`; cleared with the group on the next rebuild); `_shadowsDirty` stamps
the static shadow. The ENGINE is untouched — Meteor's `terrainDeform`, the Build dig / raise, Flat
Earth, reshape write `state.boardHeights` exactly as on a board; the eye sees it now.

Tests: seamless-field.test.js (26 — the rules, the levels on the grounds' record, the cut arithmetic
in a vm, every builder's read, the battle's cut path + the moat, the strata planner in a vm on a dig /
a raise / two digs / an edge, the live delta through `_fieldGroundTop`); hq-terrain / hq-bridge-layer's
`_hqTerrainMat` signature pins moved. NOT measured live (the CDN is unreachable from the sandbox): the
fps in a city after the cut (the plan's target: a fraction of the walk's), the fade's read under each
room's fog, the lattice's brightness (`opacity 0.55` in `_fieldMoatBuild`), a dug cell's bed sheet
against the field's own, a raise's top sheet on a path cell (the room's floor sheet, never the path's).
OPEN: 9 THE SWITCH, 10 THE POST; and for the strata — the water sheets stand where they were (a flooded
dig draws no water under a field), a Build WALL / a terrainCreate monument stands its column through the
board's own object / monument pass (untouched), the AI's forecast of a dig is the board's rule.


### 2026-09-22 — THE CUT UNDONE (step 7 backed out; THE STRATA stays)

The user: "undo the cut — it wasn't necessary any more, the frame rate was fine during battles
now even in the city" (steps 5 + 6 — THE BLOCKER SET and THE STATIC SHADOW — were the fix; the
cut was the third thing tried in the same hour). Backed out whole: `HQ_FIELD_RULES.cut` (data.js),
`_hqCutHit` / `_hqCutOf` / `_hqCutRange` / `_hqCutPtsBox`, every `cut &&` guard in the builders,
the `uCut` / `uCutFade` dithered fade in `_hqTerrainMat`, the chunk branch of `_hqBuildRoomInBattle`
(the handed-over shell group stands whole again, `keepM` / `keepFarM` are the radius as delivery 4
set them), `_fieldMoatBuild` + its grid texture, the `cut` read in `_hqHandoverRules`, the
`EW_HQ_NO_FIELD_CUT` switch, the three cut tests. RULE: a TERRAIN room's field is built WHOLE round
the window (delivery 2–5's rule); the outer ground, the treeline, the sea, the traffic and the
circuit build as they did before delivery 6. THE STRATA (step 8: `field.levels`, `hqFieldBedFor`,
`_fieldStrataBuild`) and THE RED CI fix are untouched. Step 7 is struck from the table, not
re-opened — the plan's item 4 (THE CHUNKS, culling the merged batches by frustum) is the way back
if a room ever needs it. Token `20260922-uncut-01-cors`.

### 2026-09-22 — THE HIGHLIGHTS CONFORM · THE LIVE LEVELS · THE WAY BACK
The user's three: "the tile highlights conform to the shape of the terrain
they are on; let units level up during battle — victory grants the entire
party XP, less if they did not participate, alive at the end to receive
it; a smooth transition from the victory screen back to exploration, no
loading screen". CLAUDE.md "THE SEAMLESS FIELD, delivery 7" has the
contract. (1) `_fieldGroundSampleAt(wx, wz, x, y)` is the sub-tile read of
a terrain room's field (hqTerrainFeet at the cell's own layer, through the
matrix inverted, the strata delta added); `_buildDrapeGeo` samples it at
every vertex — the move / attack / spell washes, the hover ring and the
underfoot ring lie on the slope. The pick quads stay flat at the cell top
(a click on a steep cell lands a few pixels off the drawn plate — the
quad could take the same drape later). (2) grantXP levels a story unit LIVE
(no hold), tallies `_xpBattle`, marks `_encFought`; spendAP marks it too;
the commit hands `xpBattle` / `fought`; `hqPartyXpShare` = fought 1 ·
present 0.5 · down 0, a WIN only; `_encXpPool` × `share.poolMult` 0.6.
(3) `ThreeRenderer.fieldSnapshot` → `take()` renders the debrief's frame
once more into a 2D canvas + reads the eye in room metres; `_encReturnLeave`
fades the panel, takes it, then `backToMainMenu`; `_hqEnter({ seamless })`
skips the card, seeds the HQ camera (`H.arrive`) and fades the frame on
READY while the camera eases onto the boom over `HQ_RETURN_EASE_MS`.
`_encRoomLast` keeps the room record through the debrief (the podium stood
on `level × step` heights on a tiered field before). Unseen live: the
CDN is unreachable from the sandbox — the drape's read on a real slope,
the ease's feel, the fade's pop, the level-up card mid-fight are the
user's to eyeball.
REV 2 (the same day): THE LIFT — a field plate rides `HL_FIELD_LIFT` (0.04 tile) over
the ground (`_fieldGroundLiftPx`, added in `_makeHlTile`) at `HL_FIELD_SEGS` 6, so the
floor sheet never covers a highlight between the field's samples.

### 2026-09-23 — delivery 8: THE DEFORM (a dig bowls the room's own floor) + THE RINGS ABOVE

The user: "digging still doesn't show on screen and spells that lower terrain
just make the units appear underground since the floor doesn't change — can we
not temporarily overwrite the floor elevation for a tile or an area and return
the map to normal after the battle; natural terrain deformation, not voxels; I
don't want to lose the spells that lower the ground. And the unit selection
rings and the vital rings need to appear above the floor textures and the tile
highlights — they are getting buried."

**Why a dig was invisible**: THE STRATA (delivery 6) drew a dug cell as a quad
at its new (lower) top plus four inward faces — all of it UNDER the room's
floor mesh, which never moved. A raise stood proud (a block) and showed.

**THE DEFORM** (three-renderer.js, the block right before `_fieldStrataMats`):
- `_fieldDeformPlan(N, deltaAt, elev, band)` (pure, vm-tested): the drop field
  over the window in tiles — a dug cell's centre drops its FULL delta × elev
  (tileTopY's number: the unit stands on the bowl's floor), a plateau
  `1 − 2·band` wide, the wall a smoothstep over `band` (0.3 tile ≈ 0.5 m)
  either side of the cell's edge — the shared edge is the two cells' mean, a
  corner the four cells', so the surface is continuous and two dug
  neighbours share one floor; an unmoved neighbour keeps its centre; a RAISE
  contributes nothing (it stays a block).
- `_fieldDeformApply(ts)` runs FIRST in `_fieldStrataBuild` (every height
  version): the room's floor meshes (`_fieldFloorMeshes`: a terrain room's
  field `_ew_hqTerrain`, a box room's `_ew_hqPart === 'floor'` plane(s) —
  never the outer ground / a site's apron / the backdrop / the strata's own
  pieces) are deformed IN PLACE in the battle frame: each vertex → world via
  `matrixWorld`, + the drop, → back through the inverse. The ORIGINAL
  positions are kept on the mesh (`_ew_fieldOrig`) and every rebuild
  re-derives from them (a dig then a raise back = flat again). A box floor is
  ONE quad: the first dig subdivides it (`_ew_fieldOrigGeo` kept, ≈ four
  vertices a tile, the same frame + UVs). Normals / bounds recomputed.
- The columns (THE STRATA) then draw only what the deform did not take: a
  raise's quad + faces (`c.delta > 0` / `deltaAt(f.x, f.y) > 0`); with no
  floor mesh found (nothing to deform) the old columns stand as the fallback.
- `_fieldGroundSampler` carries the bowl: a dug cell's plate / ring samples
  `_fieldDeformDyAt`; a raise stays a flat block at its delta; a BOX room
  gets a sampler once something is dug (its cells were flat = null before).
- `deactivate()` → `_fieldDeformRestore()` puts every floor back (and the
  next room entry rebuilds the room from its data regardless) — THE MAP IS
  BACK TO NORMAL after the battle. Kill-switch `EW_HQ_NO_FIELD_DEFORM`; the
  band on `HQ_FIELD_RULES.strata.deformBand` (data.js).

**THE RINGS ABOVE**: the team reticle and the selected-tile marker wear
`renderOrder` 4 (`RING_RENDER_ORDER`) — the highlight plates are 0 / 2 and
none of the three writes depth, so the later draw wins everywhere, field or
board. Under a true-ground field both are built as GRIDS (`RING_FIELD_SEGS`
10) and `_fieldRingsTick(g)` (both branches of `_updateUnitFacing`) drapes
them over the room's ground through the highlights' own sampler, lifted
`RING_FIELD_LIFT` (1.75) × the plates' lift (≈ 12 cm), capped half a tile
off the unit's own top; keyed on the group's spot + yaw + the height version
(a standing unit costs nothing); a body in the air (a flyer, a leap) wears
them flat; off the field the geometry is the one quad it always was.

Tests: seamless-field.test.js (delivery 8 ×3 — the planner in a vm, the
sources, the rings). `npm run test:quick` + the touched suites green.

UNSEEN LIVE (RULE #1c): the bowl's read in each room's floor sheet (the
sheet stretches down the wall — a steeper `deformBand` is the edit), the
box floor's subdivision seam under the AO, the ring's lift against a
rig's feet, the marker's grid on a slope, a dig beside a raise.

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
| 7 ↩ (undone 2026-09-22) | **THE CUT** — `HQ_FIELD_RULES.cut = { moatTiles: 2, moat: 'grid', fadeM: 3 }`: the chunk = the window + `moatTiles` a side (12 × 12); `_hqBuildTerrain(copy, { rect })` re-cuts the field, the water, the decks, the walls, the rails, the scatter, the lots (`_hqBuildCityLots` filtered by lot rect), the road paint and the treeline over the chunk; the hand-over keeps pieces inside the chunk only (`keepM` = the moat's edge); the moat plane + the dissolve edge + the fog; `H.sky` in the stash → the room's dome + landmarks in the battle; `scenery: 'none'` for every field | item 3, the radius made exact, the user's chunk |
| 8 ✅ | **THE STRATA** — `HQ_FIELD_RULES.beds[family]` (facility: concrete · rebar · bedrock; city: asphalt · earth · bedrock; cave: rock · rock · lava-deep; woods: soil · roots · rock; divine: cloud · cloud · cloud; sea: sand · rock · deep water; astral: void) keyed off the room's shell family / hub, `terrain.bed` on a room overriding; `hqFieldBuild` files `field.levels` (the tier per cell at the build) and `tileTopY` = the true top + (`boardHeights − levels`) × the level step; `rebuildTerrain` builds a column ONLY for a cell whose engine height differs from its level — a dig shows the bed's faces (THE CRATER FIX's rule: the crater opens onto the column's own faces), a raise stands a column wearing the room's floor sheet on top; the picking quads follow the engine height | Meteor, Flat Earth, Build, reshape in a field |
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
