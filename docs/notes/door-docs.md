# Notes: door-docs

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). Map of the DOOR design docs (DOOR_MASTER, HQ build plan, Phase 9 brief).
Append new notes for this system at the end of this file.

## DOOR docs (story + headquarters) — read before ANY DOOR / story / hub work
- `DOOR_MASTER.md` — the single DOOR file: Part A canon (world, factions,
  ranks L1–L6, departments → rooms, arena objectives ↔ engine), Part B
  integration layer (what's shipped where), Part C reconciliation decisions
  (some awaiting the user's yes/no), Part D build log. APPEND to Part D on
  every DOOR session. `DOOR_DESIGN.md` and `entropy_wars_claude_brief.md`
  are stubs — don't resurrect them.
- `DOOR_HQ_BUILD_PLAN.md` — the phased plan for the headquarters hub that
  replaces the Play menu (pre-rendered rooms + DOM hotspots first; the MD
  Guild Hub free-roam tech is the later walkable path). Has the file
  placement per RULE #1, the room-graph data shape, the door-state rules,
  and the reference-art protocol (`docs/door-hq/ref/` in the repo —
  Claude can view images committed there; production backgrounds go to R2
  `Assets/door/hq/`). Append to its §9 build log when you touch the HQ.
- **PHASE 9 · THE WORLD (9.3 Lunar pilot implemented locally; not uploaded)** — the
  user's brief for finds + a hundred TAPES, sites as whole BUILDINGS
  (complexes), the WORLD GRAPH of site ⇄ site doors (+ suites / a third
  ring for the crowded hall), the roaming ENCOUNTER that makes the room
  the board, THE DOOR GUN (two placeable thresholds), the NOT-A-DOOR
  seams (a `way` on a link: the wardrobe into Camelot, mirrors, wells,
  pools, paintings, hearths, screens, trains) and OPTIONAL SKATEBOARDING
  (9.8, a walker mode). **THE PARK RULE is in force for every new room
  or map: give a rider a rail and a ramp.** Read HQ plan
  §4 Phase 9 (data shapes, stages, tests) and DOOR_MASTER Part C rows
  25–31 (the user's decisions) before building any of it; the REC order
  is 9.3 → 9.2 → 9.1 → 9.5 → 9.4.
- **Phase 9.3 local pilot (2026-09-14 local / 2026-09-15 UTC):**
  `DOOR_HQ.links` generates Moon ⇄ Derelict ⇄ Saturn ordinary door pairs
  through `hqLinkDoors` in `hqSiteRoom`. `backDoors` accepts one row or
  an array, copying actions. The spaceship ends are in its existing board
  room until an airlock exists. North/south endpoints use x; east/west
  use z. `hqWorldGraph()` reports registered rooms and directed door
  actions; it is not yet a directory UI or complete lift/overlay graph.
  See the Phase 9 implementation review before continuing; old cost/count
  claims are superseded. No new plot text, economy or online battle state.
- The HQ SHIPPED 2026-09-03 (three-renderer.js `ThreeRenderer.hq`, data.js
  `DOOR_HQ`, map.js `_hqEnter`) and since Phase 1.3 the main menu's **Play
  enters it** (`_goToPlayHub`); every screen's Back / the result overlay
  return to it via `_hqReturnOrMenu`; bay doors launch VS-CPU crossings
  through `_hqLaunchMission` → `window._hqPreselect` (match-select) +
  `window._hqCpuPool` (state.js). Classic hub: `?nohq`, localStorage
  `ew_hq='off'`, or Settings → D.O.O.R. Headquarters. Dev entries:
  `index.html?hq`, `window._hqEnter()`. Kit assets live on R2 under
  `Assets/door/models/` + `Assets/door/textures/`; reference art is in the
  repo at `door_reference_images/`. `npm test` runs `doorhq.test.js`.
  Playtest harnesses call `_goToVsCpu()` directly and bypass the building.
  **The ROOM REGISTER (HQ plan Phase 7.1, shipped 2026-09-07)**: every site
  and numbered HQ room wears ONE `roomNo` (a string; `i`, `2D`, `H-20` are
  legal) — on `DOOR_HQ.thresholds[mapId]`, on a room, on a department
  door, or in `DOOR_HQ.facility` (64 / 404). Read it ONLY through
  `hqRoomNo(idOrMapId)` / `hqDoorNo(entry)`; `hqRoomRegister()` lists
  every numbered place sorted. doorhq.test.js fails on a shared number, a
  launch map without one, or a door that duplicates its room's number.
  Adding a site = a `roomNo` + `why` on its threshold (plan 7.3 has the
  number; 7.10 the checklist).
  **SEVEN BAYS + THE CONTAINMENT RING (plan 7.5 + 5.4a, shipped
  2026-09-07 / stage 2 2026-09-08)**: `DOOR_HQ.sectors` has seven bays
  (Bay 7 · URBAN on the mezzanine at 180°). Since 5.4a stage 2 the bays
  of one egress floor are ONE room: `bayShell.corridor` (`on`, `rings`
  per level with rIn/rOut just outside the egress drum, `endPadM`,
  `gapM`, `arc` override, `close`) → `hqRingLayout(level)` (each bay a
  SEGMENT: its egress door on the inner wall at the SAME angle as on the
  egress, its thresholds a `spacing` run on the outer wall centred on it,
  runs relaxed apart, the break at the widest gap) → `hqRingRoom(level)`
  (`rooms.ring_g` / `ring_m`, still `kind: 'bay'`; `segments`,
  `shell.full`). READ the room through `hqBayId(sector)` (→ the floor's
  ring) and land through `hqBayEntry(sector)` (→ `egress_<sector>`) —
  never hard-code `'egress'` or `bay_<sector>` for a bay; `hqBayNo
  (sector)` for its number (no room wears `bayNo` any more);
  `hqRingSectorAt(room, deg)` names the bay you stand in (map.js uses it
  for the overheard lines); `hqRingSpot(sector, spot)` carries a
  bay-frame prop / cast spot into the ring (Sedaniel). The caps wear the
  stage-1 fire door to EACH OTHER (`{ room: ring, at: cap_* }`). The
  stage-1 rooms (`hqBayRoom` → `bay_<sector>`, cap doors via
  `hqBayRing` into the neighbour bay, `_hqCapWall`) stay registered and
  come back with `corridor.on: false`; `bayShell.ring: false` kills both
  stages. Moving a map between bays = edit `sectors` only — everything
  else derives. doorhq.test.js checks the layout (no door overlaps,
  every launch map once on the rings, the segments, the caps).
  **THE WALKABLE SITE (plan 7.2 stage 1, shipped 2026-09-07)**: a site
  listed in `DOOR_HQ.siteRooms.built` (since stage 6, 2026-09-08 rev 4,
  ALL 29 launch maps — doorhq.test.js insists every threshold id is
  built; the first were `prebuilt_dumb`, `prebuilt_cern`,
  `prebuilt_backrooms` — stage 2 shipped 2026-09-07 — then the OUTDOOR
  rooms `prebuilt_nuketown`, `prebuilt_stadium` — stage 3 shipped
  2026-09-08: `shells[id].open: true` = no ceiling, the walls are
  the site's perimeter in battle TERRAIN keys (`_hqTex` falls through to
  the terrain sheet), an `apron` / `skirt` past them, lamp MASTS at the
  walkway corners, and `shell.sky` = the map's EW_MAP_META `env` drawn by
  three-renderer.js `_hqBuildSky` — a second firmament dome on the
  battle's shared `_envUni` uniforms, driven by `_hqTickSky`, plus the
  map's far roster hung round the room from the same builders; the
  battle's own horizon is untouched) is a ROOM
  behind its bay threshold — `hqSiteRoom(mapId)` (data.js) generates a
  box room (`kind: 'box', fx: 'site', site: mapId`; never hand-edit
  `rooms.site_*`) with the site's Δ board on the floor at 1:1, read by
  `hqSiteBoardInfo(mapId)` and drawn by three-renderer.js
  `_hqBuildSiteBoard` (instanced cell quads / raised boxes / pits /
  edge-wall slabs / `_monBuilders` monuments / the nexus ring — never the
  battle mesher). Walking = `_hqSurface`'s board layer (`_hq.site`,
  `_hqSiteCellAt`): +1 climbed, +2 a wall, water waded, lava never. The
  bay threshold walks you in (map.js `_hqDoorDirectAction`); the CROSSING
  console (`overlay: 'crossing'`, `_hqCrossingHtml`) files the crossing
  and is where post-match returns you. The room wears NO `roomNo`
  (`hqRoomNo(roomId)` → the threshold's). Adding a site room = one id in
  `siteRooms.built` (+ `shells[id]` / `flavour[id]`); doorhq.test.js
  checks it. Natives stand at `npcSpots` with a `race` hint. **THE MOAT
  ROOMS (stage 4, shipped 2026-09-08 rev 2: `prebuilt_camelot`,
  `_atlantis`, `_hell`, `_technoticlan`, `_agartha`, `_antarctica`)**:
  `shells[id].moat = { key, gap, bank, bed, deck, causeways }` on an open
  room makes the walkway a QUAY (`pad` = quay + gap) and sinks the ring
  round the board one level, full of the map's liquid — `hqSiteRoom` →
  `shell.moat` (+ `walk` / `tint` / `quay` derived); the renderer draws
  it in the battle's own fluid sheet (`_buildFluidTopMat`, ticked by
  `_hqTickMoat`), the walker gets it as a pseudo-cell from `_hqSiteCellAt`
  (`_hqSiteOnCauseway` = the deck), board-edge lakes of the same liquid
  open into it. A site room's floor is a FRAME (box shell `siteHole`)
  so pits show. Adding a moat room = `open` + `pad: 5` + `moat` on the
  shell; the test checks the quay ≥ 2 m, the liquid, the tint, and that
  no prop / native / mast stands in the water. **THE SETTING IN THE
  ROOM (stage 5, shipped 2026-09-08 rev 3)**: every site room runs its
  map's MAP SETTINGS near builder (`_NR_BUILDERS[meta.near]`) inside
  itself at 1:1 — `DOOR_HQ.siteRooms.near[key] = { w, h?, stands? }`
  (`w` MUST equal the builder's `_nrKit` `w`; doorhq.test.js diffs the
  renderer source), `hqSiteRoom` grows `pad` to `w × tile + the moat's
  gap` and hands the renderer `shell.near`; three-renderer.js
  `_hqBuildSetting` runs the builder with `ctx.hq` (`_nrKit` takes the
  room's w / gap / base / tints; `_nrApron` / `_nrMoat` / `_nrRoom` /
  `_nrSign` are no-ops under `K.hq` — the shell is those), culls pieces
  that double the perimeter or stand in the way in / at the console,
  makes every other piece a blocker, and `_hqSettingFreeSpot` nudges
  natives + floor props off them. A console off the west wall =
  `shells[id].console = { wall: 'n'|'e', at }`; `stands: true` moves the
  natives / boxes / chair to the n/s strips; flavour props keep their
  distance to the wall when the room grows (`flavour[id].fitted: true`
  = already placed). Kill-switch `window.EW_HQ_NO_SETTING`. A site can
  opt OUT of its setting (`shells[id].setting: false` + a plain `pad`
  — Flat Lands, whose builder's apron is fourteen tiles). **Adding a
  site room today = `built` + `shells[id]` + a `near` row (`w` = the
  builder's) + `flavour[id]`; nothing in the renderer.** **THE EDGE
  (2026-09-11)**: `shells[id].edge` = `'open'` (the default for an
  outdoor room — NO facility walls, a flush paving line, the lone door
  panel, freestanding signboards, `shell.roam` 5 m onto the apron) |
  `'low'` (a knee-high field wall) | `'walls'` = the full box, INDOOR
  rooms ONLY — since 2026-09-16 (the user's rule: "battle rooms that are
  areas outside should not have walls") `hqSiteRoom` reads an OPEN
  shell's `edge: 'walls'` as `'open'` (the Stadium, Camelot, Cyberpunk,
  Babel, Agartha, Hollow Earth, the Strip, Downtown stand in the open;
  their settings' stands / curtain wall / storefronts are the walls).
  doorhq.test.js refuses `'walls'` on any open site room. A wall prop survives a
  wall-less room only if it STANDS (`hqSitePropStands`); the setting's
  own perimeter (fence / wire / trees) is KEPT there (natural walls are
  fine). The D.O.O.R. kit stands on the boards through three-renderer.js
  `_hzDoorKitGLB` (the Mars rover, the Moon lander, Atlantis's palms —
  battle and room alike; never double them as room props). A room's
  LIGHT is `shells[id].mood` (lamp / glow / strip / light colours, the two
  sign palettes, optional `signLines`) merged over `siteRooms.shell.mood`
  (= D.U.M.B.'s red); the renderer's signs and lamps hang from `S.h`.
- **The CAST shipped 2026-09-06**: the story's named characters (the user's
  cast sheet, canon, `DOOR_STORY.md` §2 / DOOR_MASTER A16) stand in the
  building. Models: sprites.js `DOOR_CAST_MODELS` (15 rigged GLBs on R2
  `Assets/Sprites/Races/maincharacters/`, `_mkCast`, the `_CAST_POSES`
  library slots — sit/talk/phone/fold-arms/kneel-fix/push/reach/crouch).
  Placement: data.js `DOOR_CAST` (spots per room, pose, talk radius,
  weights; `hqCastInRoom`), spawned by three-renderer.js `_hqSpawnCast`,
  panel in map.js. The HQ avatar is the Player model (`EW_HQ_AVATAR =
  'vessel'` restores the most-played vessel; `EW_DISABLE_CAST` removes the
  cast). Cast LINES are user-authored (A15 rule) — Claude writes only the
  `doing` stage directions. Adding a cast member = one `_mkCast` line +
  one `DOOR_CAST` entry; `npm test` (doorhq.test.js) checks both sides.
  Placement is screenshot-driven: `node playtest_hq.js <room> [force-json]`
  (repo tooling; needs the server + `NODE_USE_ENV_PROXY=1`) — see
  PLAYTEST_NOTES "THE CAST IN THE HEADQUARTERS" before moving anyone.

## THE DOOR WHEEL plan (2026-09-25)
- `DOOR_GUN_PLAN.md` (repo root) — the DOOR gun rework: a weapon wheel of doors (hold middle
  click in the room; the tier rack in a battle), STANDING doors that act like turrets (two per
  player, the oldest folds, a health bar, a facing + a lane), the SWING DOOR + one-way door
  capture combo, Door Dash, seven destination doors (Gust · Archers · Hell · Maw · Frost · Laser ·
  Light) as spells, live room objects and puzzle tools, all through THE CHAIN REACTION (step E′).
  Read it before any door gun / Door Agent / puzzle work; append to its §11 per phase. It
  supersedes DOOR_RACE_DESIGN.md:23's "one door object" rule and rev 3's "never re-add a
  door-placing row".

## THE OPEN WORLD plan (2026-09-26)
- `OPEN_WORLD_PLAN.md` (repo root; copy in the project folder `open-world/`) — the explored world as
  ZONES of stitched PARTS on one ground: `DOOR_HQ.world` frames + joins (§4), the STAGE that draws the
  current part and its joined neighbours with no card at the crossing (§5), far shells as the weenies,
  `HQ_WORLD_CLOCK` (the exploration day), the field beyond 8 × 8, download-once made whole (§6), the map
  drawn from the frames (§7), the content track (the mall, Camelot, the Vatican, the bunker, the D.U.M.B.,
  the medical merge, the woods as one field, the wells re-pointed, the buffer audit — §8), fifteen forks
  with defaults (§9), ten phases (§10). Read it before any room / area / link / map work; append to its
  §12 per phase. NO PUZZLES stands over it.
- Phase 0 shipped 2026-09-26 (the plan's §12): `DOOR_HQ.world` (data.js, after `hqWorldFloorOf`) with the
  readers `hqWorldFrame` / `hqWorldToZone` / `hqZoneToRoom` / `hqWorldJoinResolve` / `hqWorldRing` /
  `hqWorldValidate` / `hqWorldSheet`; the map's LAND tab (map.js `_hqLand*`); THE BUILDING MERGE and THE
  INSTANCE PASS (three-renderer.js); the walk's CALLS · TRIS readout. Nothing moved: the rooms still load
  one at a time until Phase 1's stage. Test: hq-world-map.test.js. Probe: measure_rooms.js.
