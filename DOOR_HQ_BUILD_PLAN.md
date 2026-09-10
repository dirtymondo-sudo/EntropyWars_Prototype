# DOOR HEADQUARTERS — BUILD PLAN
### The walkable facility that replaces the Play menu · rev 25 (2026-09-08 rev 5 — 5.4a stage 2 SHIPPED: THE CONTAINMENT RING is ONE CORRIDOR PER FLOOR — the bays of a floor are segments of a single hallway framed just outside the egress drum (ground ring r 21.5–25.5 behind Bays 1 and 4, mezzanine ring r 24.5–28.5 behind Bays 2 · 5 · 7 · 3 · 6), every egress bay door is the ring's inner-wall door at the same angle, the thresholds spread along the outer wall either side of it, no rebuild between bays, the caps wear the fire door to each other across the service side; data.js `bayShell.corridor`, `hqRingLayout` / `hqRingRoom` / `hqBayEntry` / `hqBayNo` / `hqRingSectorAt` / `hqRingSpot`, `hqBayId(sector)` → the floor's ring; the renderer learns only `shell.full`; map.js lands through `hqBayEntry`; the cast's bay spots carry over; kill-switch `corridor.on: false`; rev 24 2026-09-08 rev 4 — 7.2 stage 6 SHIPPED: THE REST OF THE REGISTER — every launch map is a walkable room: Rooms 14179 · SHASTA, 56 · STONEHENGE, 444 · GIZA, 777 · HEAVEN, 2047 · CYBERPUNK CITY, 11 · BABEL, 12 · OLYMPUS, 4 · MARS, 51 · AREA 51, 512 · SKINWALKER RANCH, 180 · HOLLOW EARTH, 420 · FAIRY FOREST, 1969 · MOON, 888 · VATICAN CITY, 23 · BOHEMIAN GROVE, 9600 · GÖBEKLI TEPE, 1225 · NORTH POLE and 2D · FLAT LANDS are outdoor rooms behind their bay thresholds, each with its map's setting inside it at 1:1 and its sky overhead (Flat Lands opts out of its fourteen-tile setting), four consoles off the west wall, Babel's terraces as stands, the Moon under a 3 m berm; data-only — `siteRooms.built` / `near` / `shells` / `flavour`, no renderer change; doorhq.test.js now insists every site in the register has a room; rev 23 2026-09-08 rev 3 — 7.2 stage 5 SHIPPED: THE SETTING IN THE ROOM — every walkable site room now runs its map's own MAP SETTINGS near builder inside it at 1:1 (D.U.M.B.'s server racks and blast door, CERN's beamline and terminals, the Backrooms' partitions and stalk fluorescents, Nuketown's picket fence, houses, road and buses, the Stadium's tiers and floodlights, Camelot's curtain wall with its towers and drawbridge, Atlantis' colonnade and kelp, Hell's spires and braziers, Technoticlan's temple tiers and torches, Agartha's crystal spires, Antarctica's ice ridges and igloo) — the room grows to the setting's apron (`siteRooms.near[key].w` tiles, + the moat's gap), the kit's enclosure primitives are no-ops in the room (the shell is those), every piece is culled clear of the way in and the console and becomes a blocker, natives and props are nudged off the houses and the stands, and four consoles moved to the north wall (`shells[id].console`); `hqSiteRoom` `near`, three-renderer.js `_hqBuildSetting` / `_hqSettingFreeSpot`, `_nrKit` `ctx.hq`; rev 22 2026-09-08 rev 2 — 7.2 stage 4 SHIPPED: the MOAT rooms — Rooms i · CAMELOT, H-20 · ATLANTIS, 666 · HELL, 2012 · TECHNOTICLAN, 88 · AGARTHA and 90S · ANTARCTICA are outdoor sites whose walkway is a QUAY: the ring between the island and the quay is the map's own liquid one level down in the battle's animated fluid sheet, board-edge canals open into it, a causeway either way (the south one is the way in), deep water and lava never entered; `shells[id].moat`, `hqSiteRoom` → `shell.moat`, three-renderer.js `_hqSiteOnCauseway` / `_hqTickMoat`, and a site room's floor is now a FRAME so every board pit finally shows; rev 21 2026-09-08 — 7.2 stage 3 SHIPPED: the first OUTDOOR rooms — Room 1945 · NUKETOWN and Room 50 · FOOTBALL STADIUM are walkable sites with no ceiling, the map's own sky on the battle's firmament dome, its far roster drifting round the room, lamp masts on the walkway corners, a fence / the bowl's wall for a perimeter and the ground running out past it; `shells[id].open`, `shell.sky`, three-renderer.js `_hqBuildSky` / `_hqTickSky`, `_hqTex` reads terrain keys; rev 20 2026-09-07 rev 5 — 7.2 stage 2 SHIPPED: Rooms 999 · CERN and 90 · BACKROOMS are walkable sites, each in its own LIGHT (`siteRooms.shell.mood`: lamps, strips, sign palettes, `signLines`; the Backrooms under a low yellow ceiling with no conduits, the almond water tinted); rev 19 2026-09-07 rev 4 — 7.2 stage 1 SHIPPED: the first WALKABLE SITE — Room 555 · D.U.M.B. is a room behind its bay threshold, its own Δ board in the middle at 1:1 (steps climbed, blocks solid, the cell walls, the specimen tubes, the nexus ring), the CROSSING console files the crossing, the natives loiter on the walkway; `hqSiteRoom` / `hqSiteBoardInfo`, the renderer's `_hqBuildSiteBoard` + the board layer in `_hqSurface`; rev 18 2026-09-07 rev 3 — 7.5 SHIPPED + THE CONTAINMENT RING (new 5.4a) stage 1: Bay 7 · URBAN on the mezzanine, the rebalance (C-22 + C-23 DECIDED), and every bay's end caps wear fire doors into the next bay on its floor — 1 ⇄ 4 downstairs, 2 → 5 → 7 → 3 → 6 → 2 upstairs; rev 17 2026-09-07 rev 2 — 7.1 SHIPPED, the numbers are on the doors: `roomNo` on every threshold and numbered room, `hqRoomNo` / `hqRoomRegister`, the plate · the panels · the SITE FILE header · the result stamp · the loading card · the directory's register; the elevator skips 13; rev 16 2026-09-07 — the ROOM REGISTER: Phase 7 — a number on every site and HQ room, seven new sites for wave 1, the walkable-site mechanism, seven bays, the dailies, §5.6 assets; rev 15 2026-09-06 rev 2 — the cast PLAYTESTED and re-seated: pinXZ sitting, Rhonda in the round desk, held props, playtest_hq.js, §9; rev 14 2026-09-06 — the CAST moves in: fifteen rigged story characters at their posts, the Player as the avatar; rev 13 2026-09-04 — 6.3 rev 2: the Key pickup celebration + emoji purge)

Read CLAUDE.md first (RULE #1 delivery, #1b cache-bust, #1c no playtest,
#2 online parity), then `DOOR_MASTER.md` Part A5 (the department → room
table) and Part C (decisions). This file is the step-by-step plan for
building the D.O.O.R. headquarters as a real 3D place you walk through in
third or first person: what to build, in what order, in which existing
files, and exactly which 3D assets the user makes. It is the anti-"start
over" memory for the HQ. **Append to §9 (build log) every session that
touches the HQ.**

**Rev 2 supersedes rev 1's "pre-rendered rooms + hotspots" approach.** The
user is making 3D assets and wants the facility walkable from the start, so
the painted-background layer is dropped. What survives from rev 1: the room
graph as data, the door-state rules, the mission launcher, the back-button
plumbing, the dev layout editor, and the reference-art protocol.

---

## 0. The vision, and how it is built

**Vision.** Pressing **Play** shows a loading screen (clearance check, a
memo card) and puts the player, in third person, on the floor of the
Central Egress: a round two-tier hall, a black cube hanging from the dome,
a round dispatch desk in the middle, doors with red / amber / green lamps
around both levels. You walk. Ranked play is answering a BELL call at the
dispatch desk; VS CPU is walking through a mission door; the Shop is the
Quartermaster's window; the Codex is the Archives door; your Profile is the
ID card on the Reception counter; the story is the in-tray in your office
(a janitor's closet, at first); the tutorial is the only square room in the
building, down the stairs. Doors light from real data. Later the building
changes when you are not looking.

**How.** The facility is NOT a battle map and does NOT use the voxel tile
renderer. It is a small three.js scene built from:
1. **Procedural architecture** — floor ring, walls, dado, trim, mezzanine,
   railings, dome, stairs, light strips: lathe/extrude geometry that Claude
   generates in code from a polar layout table (`DOOR_HQ` in data.js) and
   wraps in tileable textures. A round hall is a handful of meshes. Because
   it is parametric, moving a door or a vending machine is a data edit —
   which is the unreliable-layout mechanic for free.
2. **Authored props** (user-made GLBs, §5): the cube, the dispatch desk,
   door leaves, furniture, fixtures, signage blanks, machinery. Placed by
   the same layout table, instanced when repeated.
3. **The existing character pipeline** for NPCs (rigged GLBs + the shared
   animation library, CLAUDE.md recipe) — DOOR agents in black, your
   recruited vessels on break.
4. **The existing camera rigs** — Strike Mode's third-person boom with
   collision and its first-person eye, pointer-lock mouse look — and the
   existing free-roam controller for movement.
5. **DOM overlays for interaction** — the existing screens (Shop, Codex,
   Party Builder, Profile, lobby…) open as overlays when you use a counter
   or door, exactly like talking to a shopkeeper in any RPG. Door panels,
   nameplates and prompts are DOM/CSS2D, so text stays crisp and dynamic.

**Performance, stated honestly.** Rev 1 cited ROADMAP §4's "~1,800 objects
in an 8×8 match" as a ceiling. That number is a property of how the BATTLE
BOARD is built (every tile is its own Mesh with a 6-material box, stacked
columns bypass the material cache, no instancing — ROADMAP §4 item 1), not
of three.js or WebGL, and the facility never touches that code. A kit-built
hall is roughly 10 architecture meshes + 60–80 instanced prop draw calls +
8–12 rigged NPCs: less than a match. The user's instinct is correct: a
PS2-era environment is cheap here.

---

## 1. Decisions (all decided 2026-09-03 unless marked)

| # | Decision | Resolution |
|---|---|---|
| D1 | Approach | **Walkable 3D facility from Phase 1**, procedural shell + authored prop kit, third person default with a first-person toggle. No painted rooms, no voxels. |
| D2 | Quick Play / Friendly | At the **dispatch desk** in the egress (Quick Play = answer a BELL call; Friendly = the desk phone, room code). `Q` hotkey anywhere in the building. |
| D3 | Mission doors | Walk through → door panel → VS CPU on that map's **8×8 Δ board, 4v4, enemy pool = the map's native entities** (`doorSiteCrossings`); "DEEP CROSSING" option = full map. |
| D4 | Sector bays | Six (MASTER A10). In the egress each bay is one door on the ground ring; the bay itself is a short curved corridor with its threshold doors (Phase 2). |
| D5 | Main menu | Phase 1: unchanged except Play → HQ. As rooms/counters come online their buttons go. End state: Play / Settings / Profile card / Quit. `?nohq` + localStorage `ew_hq='off'` keep the old hub reachable for one release. |
| D6 | Settings | Overlay (gear / Esc). Not a place. |
| D7 | Back buttons | The 12 `_showTitlePage('mainMenuPage')` sites + the result overlay's Main Menu button return to the building (`_hqReturnOrMenu`); post-match you re-enter where you launched from. |
| D8 | Door art | Door **leaves** are authored GLBs (one per type); door **frames + lamp housings** are procedural so every door in the building shares one frame and the leaf is the variable. |
| D9 | Mastery (green lamp) | v1: a win on that map by every win condition its mode offers, persisted monotonically in `progress.unlocked` (`site:<mapId>:<winCondition>`). v2 may add "all native entities declassified". |
| D10 | Rank titles | DOORMAT / DOORSTOP / KNOCKER / KEYHOLDER / GATEKEEPER / THE DOORMAN (MASTER C-1); data.js strings change with the first data.js delivery of Phase 1. |
| D11 | Reference images | Commit under `docs/door-hq/ref/` (§5.1). They are the art direction for the modeler and for Claude's procedural shell (colours, proportions). |
| D12 | Story gating | Hybrid (MASTER B3): SP from every mode incl. PvP + single-player field requirements inside the building. |
| D13 (open) | Character in the hub | Your most-played vessel (the ID-card photo) or a DOOR officer avatar? Rec: the vessel — it is already rigged and the roster IS the cast. |

---

## 2. What already exists (build on it)

Verified 2026-09-03. Line numbers drift; search the symbol.

**Menu / page system.** Every menu screen is a `<div class="title-page">`
in `#startOverlay` (index.html:576-1015); `map.js` `_showTitlePage(id)`
toggles them. `map.js:98` `_goToPlayHub()` is what **Play** calls — the
seam that becomes `_hqEnter()`. Every function a counter or door needs is
already a `window.*` entry point: `_goToQuickPlay` / `_goToFriendlyMatch` /
`_goToVsCpu` / `_goToMysteryDungeon` / `_goToCodex` / `_goToTeamBuilder` /
`_goToCampaign` / `_goToMapEditor` (map.js), `_goToShop` (ui.js:8412),
`_mountReactProfile` / `_mountLeaderboard` / `_mountCommunityMaps`
(profile.js:2601+), `_ewReplayLastMatch` (online.js:4854),
`_openMainMenuSettings`. Return-to-menu sites: `_showTitlePage(
'mainMenuPage')` ×12 (map.js 10, ui.js 1, battle.js 1) and the result
overlay's `#mainMenuBtn` (battle.js:30168, ui.js:12024).

**Match launch.** match-select `_msConfirm` (map.js:1755) → `applyGameMode`
(state.js:1168) → party builder → `startMatch` (battle.js:32592). No
"preselect a map" API yet (`_msSelectedMap` is an index into
`MS_MAP_LIST`); Phase 1 adds `window._hqPreselect`.

**Loading screen.** `showBattleLoadingScreen` (battle.js:31460) plus the
`.ls-*` kit and `_lsDoorHints()` (memo / canon-notice cards) — reusable for
the HQ loading screen without the unit warmers.

**3D engine facts that matter for the facility.**
- World scale: `BASE_TILE = 128` (data.js:5) world units per tile; a
  `heightRatio: 1.0` character renders `ts * UNIT_SPRITE_SIZE_RATIO(=1.0)`
  = 128 units tall (three-renderer.js:495, ~10287). So **1 tile ≈ one
  person tall ≈ 1.75 m → 73 world units per metre.** Model in metres;
  Claude applies one scale factor at load.
- GLB loading + caching exists twice: `_loadUnitGLB` (three-renderer.js
  ~9637, rigged units, clones via SkeletonUtils) and the misc static-model
  path (`_R2_MISC`, `_miscModelCache`, ~20545: OBJ + GLB props, loaded
  once, cached, cloned, filled in asynchronously). The prop kit uses the
  second path.
- Procedural monuments (`_MON_BUILDERS`, three-renderer.js ~6240): pyramid,
  ziggurat, obelisk, greek, rings, flag, lightpillar, exitsign, lenticular,
  holoboard, jumbotron, tablet, biodome, whalebones, innersun, fairyring,
  holopyramid, censer, greytube, beamring, securitycam, dumpster, mushroom,
  woodcross, fleshmound, igloo — `securitycam`, `exitsign`, `dumpster`,
  `greytube` are reusable dressing; the rest shows the style of code Claude
  writes for procedural geometry.
- Terrain textures already on R2 that suit an office block (sprites.js
  `_T`): `tilefloor`, `tilefloor_2`, `concrete_floor`, `checkerboard*`,
  `marble`, `marble_2`, `marble_light`, `carpet`…`carpet_4`,
  `drywall`…`drywall_5`, `gunmetal`, `gunmetal_2`, `metal*`, `aluminium`,
  `wood_planks`, `brokenglass`, `wallpaper`. Phase 1 placeholders come from
  here.
- Movement: `_freeRoamStart(uid, opts)` (three-renderer.js ~18725) —
  WASD/arrows + gamepad stick, Shift run, Space hop, continuous `fx/fy`
  with per-tile collision via `opts.tileAllowed(tx,ty)` and an `onTile`
  callback; camera follow via `window._mdFreeRoamCam` → `camera.snap`.
  The hub reuses it with a `tileAllowed` that reads an occupancy grid
  rasterised from the layout (annulus + door openings + stair ramps +
  prop footprints) at half-tile resolution.
- Cameras: Strike Mode's third-person rig with boom collision
  (three-camera.js ~174-310, `cam._tpsCollide`), the FIRST-PERSON EYE
  (~211), pointer lock (battle.js ~14288), `ShooterControls` owning the
  keyboard when active.
- Nameplates: CSS2DRenderer is already loaded (index.html:247) and used
  for unit plates — door nameplates and prompts use it.
- Post stack (three-post.js): grain / scanlines / chromatic aberration —
  the PS1 look for the hub comes free.
- Guild Hub runtime (the prototype): `_mdOnBattlePrepared` drops the CPU
  team and seats roster NPCs (`_mdSpawnHubNpcs`, `unit._mdNpc`), starts
  `ThreeRenderer.hubFreeRoam`, `_mdCheckStairs` is the entrance trigger
  (battle.js ~27960-28060). The HQ generalises these under a
  `state._hqWalk` flag instead of `_isDungeonMode()`.

---

## 3. Architecture

### 3.1 Files (RULE #1: no new game files)
| File | What goes there |
|---|---|
| `data.js` | `DOOR_HQ`: the layout (rooms, ring geometry, doors and props in polar coords, sectors, prop catalogue with URLs/scales/footprints) + pure helpers `doorSiteState`, `hqRoomUnlocked`, `hqOccupancy(layout)`. |
| `three-renderer.js` | `HQ` builder: procedural shell (`_hqBuildShell`), prop placement (`_hqPlaceProps` via the misc-model loader), lamps (`_hqLampMaterial(state)`), CSS2D nameplates, trigger volumes, the hub scene lifecycle (`ThreeRenderer.hq.enter/leave`). |
| `three-camera.js` | third-person / first-person hub mode on the existing rigs; toggle. |
| `map.js` | Flow: `_hqEnter`, `_hqLoading`, `_hqTrigger(id)` (what a door/counter does), `_hqReturn` / `_hqReturnOrMenu`, `_hqLaunchMission`, the door panel + prompt DOM, the directory. |
| `battle.js` | `startHqScene()` beside `startMatch` (no units except the player + NPCs, no turn engine); generalised `_mdSpawnHubNpcs` → `_hqSpawnNpcs`; mastery flag write at match commit; post-match return. |
| `state.js` | `GS.HQ`; `state._hqWalk`, `_hqRoom`, `_hqLaunchRoom` (UI-only → `_serializeState` skip list). |
| `styles-base.css` | `.hq-*` DOM: panel, prompt, strip, directory, lamp/tape/planks in panels. |
| `audio.js` | ambience key, `doorMuzak` slot, wire `doorBuzz` / `paChime` / `fax`. |
| `ui.js` | dev layout editor (`_hqEdit`: nudge props/doors around the ring, export JSON). |
| `profile.js` | `door.hq = {lastRoom, visited, variantSeed, keys}` backfill. |
| `door-hq.test.js` | validates `DOOR_HQ` headlessly via `load-data.js`. |

### 3.2 Layout data (`DOOR_HQ` in data.js)
```js
const DOOR_HQ = {
  units: 73,                                  // world units per metre (128 / 1.75)
  rooms: {
    central_egress: {
      label: 'CENTRAL EGRESS', kind: 'rotunda',
      shell: { radius: 21, mezz: { radius: 24, height: 4.2, width: 3.5 }, wallH: 9, domeH: 6,
               floor: 'terrazzo', dado: 'oxblood', wall: 'stone_speckle', trim: 'teal_metal', ceiling: 'panels' },
      stairs: [{ deg: 150, level: 0, to: 1, side: 'cw' }, { deg: 30, level: 0, to: 1, side: 'ccw' }],
      doors: [                                  // polar: degrees clockwise from north, level 0 = floor, 1 = mezzanine
        { id: 'bay_terrestrial', deg: 200, level: 0, leaf: 'door_institutional', label: 'BAY 1 · TERRESTRIAL', sector: 'terrestrial', action: { room: 'bay_terrestrial' } },
        { id: 'records',         deg: 235, level: 0, leaf: 'door_wiredglass',     label: 'RECORDS',              action: { fn: '_goToCodex' } },
        { id: 'elevator',        deg: 90,  level: 1, leaf: 'door_elevator',       label: 'ELEVATOR', minClearance: 4, action: { room: 'executive' } },
        ...
      ],
      props: [                                  // catalogue key + polar position; r in metres from centre
        { key: 'dispatch_wedge', deg: 0, r: 0, level: 0, repeat: 8, step: 45 },   // 8 wedges = the round desk
        { key: 'hq_cube',        deg: 0, r: 0, level: 'hang', y: 7.5 },
        { key: 'table_round',    deg: 250, r: 12, level: 0 }, { key: 'chair_office', deg: 250, r: 13.2, level: 0, rot: 180 },
        { key: 'lamp_globe',     deg: 160, r: 9, level: 0 },
        { key: 'cabinet_file',   deg: 100, r: 19.5, level: 1, rot: 'wall' },
        ...
      ],
      counters: [                               // walk-up interactions that are not doors
        { id: 'dispatch', deg: 0, r: 3.5, label: 'DISPATCH', action: { fn: '_hqDispatch' } },
        { id: 'board',    deg: 300, r: 20, label: 'EMPLOYEE OF THE MONTH', action: { fn: '_mountLeaderboard' } },
      ],
      npcSpots: [{ deg: 20, r: 8 }, { deg: 210, r: 14 }, ...],
      spawn: { deg: 180, r: 16, level: 0 },
      variants: [],                             // Phase 5: alternate door/prop tables
    },
    ...
  },
  catalogue: {                                  // every authored asset, once
    hq_cube:        { url: 'Assets/hq/hq_cube.glb',        footprint: null, scale: 1 },
    dispatch_wedge: { url: 'Assets/hq/dispatch_wedge.glb', footprint: 'wedge', scale: 1 },
    door_institutional: { url: 'Assets/hq/doors/door_institutional.glb', hinge: 'left' },
    ...
    _placeholder:   { proc: 'box' },            // used for any key without a file yet
  },
  sectors: { terrestrial: { label: 'TERRESTRIAL', maps: [...] }, ... },
};
```
Actions are exactly one of `{room}`, `{fn}`, `{mission: mapId}`,
`{overlay}`. Doors and counters carry optional `minClearance`,
`minChapter`, `requiresKeys`, `tip`. Catalogue keys without a file resolve
to a procedural placeholder (a labelled box of the right footprint), so the
building is complete on day one and fills in as assets arrive.

### 3.3 Building the shell (procedural, three-renderer.js)
- **Floor**: `RingGeometry`/lathe for the terrazzo disc with inlaid bands
  (the reference's dark-teal / oxblood rings) as separate thin rings.
- **Walls**: a cylinder wall per level split into N facets; door openings
  are cut by building the wall as segments between door frames (simple
  quads), so no CSG. Dado band and trim are extruded rings. Blank
  nameplate quads above every door for CSS2D labels.
- **Mezzanine**: an annulus slab at `mezz.height` with a railing (posts +
  rails instanced around the ring), two curved stair flights (a helix of
  steps — each step a box).
- **Dome**: a lathe with a ring of light strips (emissive quads).
- **Lamps**: one emissive box per door, material tinted by
  `doorSiteState` (off / red / amber / green / strobe), plus a soft
  `PointLight`-free glow sprite so lighting stays cheap.
- **Textures**: tileable maps with repeat; Phase 1 uses existing terrain
  textures, Phase 2 swaps to the user's (§5.2). Baked-in ambient
  occlusion is optional; the PS1 look tolerates flat lighting + the post
  grain. One `HemisphereLight` + one `DirectionalLight`, no shadows in the
  hub (the battle shadow pass is what ROADMAP §4 warns about).
- **Collision**: rasterise the layout into a half-tile occupancy grid
  (annulus walkable, stair ramps as height, prop footprints blocked,
  door openings open) → `tileAllowed`. Height comes from level, not from
  a heightfield.

### 3.4 Walking, camera, interaction
- Enter: `startHqScene()` → build shell + props → spawn the player's
  vessel (D13) at `spawn` → `ThreeRenderer.hubFreeRoam.start(uid, {
  tileAllowed, onTile })` → third-person rig follows; `V` toggles first
  person; gamepad works (the free-roam already merges a virtual stick).
- **Triggers**: a door or counter has a trigger arc (polar range + level);
  entering it shows the CSS2D prompt ("▸ RECORDS — E to enter") and the
  door panel (site file stamp, FIRST CROSSING date, native entity chips,
  mastery checklist, ENTER / DEEP CROSSING). `E` / click / gamepad A
  activates; the free-roam stops (`hubFreeRoam.stop`), the DOM screen
  opens as an overlay; closing it resumes the walk where you stood.
- **Back**: `_hqReturnOrMenu` for the 12 sites; post-match returns you to
  `state._hqLaunchRoom` at the door you left through. Esc = settings; Esc
  twice = the directory (text list of every place + function, also the
  accessibility fallback). EXIT on the strip leaves to the main menu.
- **NPCs**: `_hqSpawnNpcs` — DOOR agents at fixed spots (the desk, the
  board) + recruited vessels at `npcSpots`; idle clips from the shared
  library; bump/`E` → a one-line micro-scene.

### 3.5 Door state (`doorSiteState(mapId, profile)`)
| State | Lamp | Dressing | Rule |
|---|---|---|---|
| `sealed` | off | planks over the frame | sector `minChapter` not reached (Phase 4; never sealed before then) |
| `clearance` | red | tape, "CLEARANCE REQUIRED" | `profile.door.clearance < minClearance` **or `requiresKeys` short** (`hqKeysShort`, shipped 3.2) — the panel names which |
| `unstable` | amber, slow pulse | — | playable, not mastered |
| `stabilized` | green | "STABILIZED" plate | mastered (D9) |
| `codered` | red strobe | doorbell icon | the day's Code Red (`hqCodeRed(profile)`, shipped 3.3): the threshold of the picked site AND its bay door in the egress, until `door.hq.codeRed` records a win on that site today. The leaf still opens (you are being sent through it). |

### 3.6 Loading screen
`_hqLoading(onDone)` reuses the `.ls-*` kit (grain, motes, the memo /
canon-notice card via `_lsDoorHints`) with "D.O.O.R. HEADQUARTERS ·
CLEARANCE CHECK" and the officer chip; waits for the shell textures + the
catalogue entries the current room uses (misc-model cache) + the player's
vessel GLB; minimum 900 ms; click to skip once ready. A mission door shows
the same screen with "CROSSING…" before `startMatch`'s own loading screen.

### 3.7 Missions (D3) — `_hqLaunchMission(mapId, {delta:true, teamSize:4})`
Sets `window._msCpuOnly = true`, `window._hqPreselect = {mapId, delta,
teamSize, roster}` and opens `modePage`; `_msRenderAll` consumes
`_hqPreselect` once (map card, Arena, team size, CPU roster pinned to the
native pool from `doorSiteCrossings`, padded from biome neighbours when
fewer than 4). The party builder still runs; nothing about match setup is
bypassed.

### 3.8 Online parity (RULE #2)
The building is single-player and local. Quick Play / Friendly hand off to
the untouched lobby pages; nothing in the HQ runs during a match. All
`state._hq*` fields are UI-only → `_serializeState` skip list. The result
overlay stays local on both clients.

### 3.9 Dev layout editor (`_hqEdit`, ui.js dev panel)
Select any door/prop/counter in the hub, nudge it (`deg`, `r`, `rot`,
level) with keys or a small form, add/remove entries, `_hqExport()` copies
the room's JSON. The user pastes it into chat; Claude merges into
`DOOR_HQ`. This replaces the rev-1 hotspot editor.

### 3.10 Performance budget
Shell ≤ 12 meshes; props via instancing (repeat entries) ≤ 80 draw calls;
NPCs ≤ 12 rigged; textures ≤ 1024² each, ≤ 24 distinct; no shadow pass;
post stack as in battle. Target 60 fps on the machines that run matches.
If a room ever exceeds this, the fix is prop count, not architecture.

---

## 4. Phases

Effort in Claude sessions. ⚙ = Claude can finish with no new art; 🧊 =
needs the user's 3D assets (§5); each step ends with `npm test` and files
handed over per RULE #1 with an index.html bump.

### Phase 0 — Plan ✅ (this session, rev 1 → rev 2)

### Phase 1 — The shell you can walk (2 sessions, ⚙)
Goal: Play → loading → you stand in a procedural Central Egress in third
person; every existing function reachable from doors/counters; door lamps
real; back buttons return you to the hall.
- 1.1 ⚙ `DOOR_HQ` (data.js): the egress layout (shell, 2 stairs, ~14
  doors across two levels, dispatch desk + counters, ~30 props from the
  catalogue as placeholders, npc spots, spawn) + `doorSiteState` +
  `hqOccupancy`. `door-hq.test.js`.
- 1.2 ⚙ `startHqScene` / `ThreeRenderer.hq` / shell builder / placeholder
  props / lamps / CSS2D nameplates / occupancy + free-roam / third-person
  rig + first-person toggle / triggers + prompt + door panel DOM.
- 1.3 ⚙ ✅ (2026-09-03, §9) Flow: `_hqEnter` (Play), `_hqLoading`, `_hqTrigger`,
  `_hqReturnOrMenu` at the 12 sites + result overlay, `_hqLaunchMission`
  + `_hqPreselect` in match-select, `GS.HQ`, skip-list entries, `?nohq`.
- 1.4 ⚙ ✅ Mastery flag write at match commit; lamps from it; strip counts.
- 1.5 ⚙ ✅ Audio: room-tone placeholder, `doorBuzz` on doors, `paChime`
  reserved; `doorMuzak` slot silent until a track exists.
- 1.6 ⚙ ✅ Rank strings → DOORMAT…THE DOORMAN (rode the 1.1 data.js delivery).
- Exit: the hall works end to end; `npm test` green; online flows unchanged.
  Phase 1 is complete — remaining Phase-1-era wishes (gamepad, the §3.9
  in-game layout editor) moved to the §9 next-steps list.

### Phase 2 — The kit lands (2 sessions, 🧊 as assets arrive)
Each delivery from the user swaps placeholders for real props; nothing
else changes. Order of impact: cube → dispatch wedge → door leaves →
lamp/frame details → furniture → fixtures → machinery.
- 2.1 🧊 Textures (§5.2) replace the terrain placeholders on the shell.
- 2.2 ✅ (2026-09-03, §9) Hero props: globe lamp, round table, chairs were in
  since 1.2; the **dispatch wedge is retired** — the user keeps the
  procedural ring desk, so the three wedge GLBs dress the hall instead
  (reception counter, two mezzanine clerk stations, the briefing
  half-ring). The cube stays procedural (no `hq_cube` was made).
- 2.3 🧊 Door leaves: the six office doors + the institutional set.
- 2.4 🧊 Dressing: cabinets, shelving, boxes, CRTs, vents, clocks, signs,
  extinguisher, vending machine, water cooler, plant.
- 2.5 🧊 NPCs: DOOR agent (male/female) rigged via the CLAUDE.md recipe —
  also usable later as the playable DOOR officer race.
- 2.6 ✅ (2026-09-03, §9) The six **bays** as short curved corridors
  (generated rooms `bay_<sector>`: `hqBayRoom`), one threshold door per
  map with its own leaf (`DOOR_HQ.thresholds`), the site file + entity
  chips + checklist on every threshold panel; `_hqGoRoom` walks between
  rooms and returns rebuild the room you launched from.
- 2.7 ✅ (2026-09-03, §9) The **janitor's closet** as the first interior:
  `rooms.office`, the first `kind: 'box'` room (Cartesian frame, four
  flat walls), the closet kit + ten procedural stand-ins for what the kit
  lacks, the IN-TRAY counter on the desk (the case-file screen 4.1 grows
  from it), the way out wearing the rank door.
- 2.8 🧊 Ambience loop + muzak (user-made).

### Phase 3 — Doors that mean something (1 session, ⚙)
- 3.1 ✅ (2026-09-03, §9) Mastery v1 on every threshold (1.4); the
  per-condition checklist in the bay door panel; the STABILIZED plate chip
  (1.2); the result-screen THRESHOLD STABILIZED tag.
- 3.2 ✅ (2026-09-04, §9) Keys: `hqKeys(profile)` = the `hourglasses`
  achievement counter (all buckets) + `door.hq.keys` (Department grants);
  KEYS on the strip + in-tray; `requiresKeys` on the elevator (12) and the
  Bureau of Continuity (24) on top of their rank gates; the panel says what
  is short.
- 3.3 ✅ (2026-09-04, §9) Code Red: `hqCodeRed(profile)` — one stabilized
  site a day (date + employee no.), an entity filed elsewhere; the bay door
  + threshold strobe; `doorbell` rings on the way into the egress; the
  strip pill + brief; RESPOND pins the entity to the CPU roster
  (`hqCodeRedPool`); a same-day win clears it and pays `codeRed.bonusGold`
  (200) with a CODE RED CLEARED tag on the result stamp. SP bonus waits
  for the SP meter (4.1). Dev: `?codered=<mapId>`.
- 3.4 ✅ (2026-09-04, §9) Office door = rank (the leaf half shipped with
  2.7) **and the promotion moment**: the building compares
  `doorClearance` to `door.hq.seenClearance` on entry → `paChime`, the
  PERSONNEL NOTICE panel, a PROMOTED stamp on the card back, the new leaf
  already hung. What promotes is still the story track (4.1);
  `window._doorPromote(n)` is the dev / story hook.
- Exit: Phase 3 is complete — every lamp state in §3.5 is reachable.

### Phase 4 — Story lives in the building (1–2 sessions, ⚙)
- 4.1 The office in-tray = case-file screen: SP meter, chapters, pending
  directive, AWAITING FIELD WORK (`requires`), memos (`dotMatrix`),
  commendations; `fax` on arrival. Hooks already waiting: Code Red clears
  (`door.hq.codeRedsCleared`) as a commendation + SP bonus; promotion via
  `promoteTo` lands on `_hqCheckPromotion` for free.
- 4.2 First-visit micro-scenes per place (`playCutscene`); the handler.
- 4.3 Orientation in the Training Room: the VHS tape (ident CSS kit),
  "please do not turn around", the tutorial match on the Phase 6 map,
  lamination.
- 4.4 The motto plaque reads the chapter band; canon notices on the
  Bureau of Continuity door.
- 4.5 `minChapter` sealing (planks); rings gate on rank.

### Phase 5 — The building is not reliable (1 session, ⚙ + 🧊 optional)
- 5.1 Variants: alternate door/prop tables per room, rolled per visit
  after chapter N (seeded by `variantSeed` + day). Nobody comments.
- 5.2 Department swaps; the directory insists it was always so.
- 5.3 Stabilized doors as shortcuts into deeper rings.
- 5.4 Rings: Support / Operations / Executive as further rotunda instances
  reached by the elevator (a small room with buttons); the office moves up
  at L4.
- 5.4a **THE CONTAINMENT RING** (added 2026-09-07, the user's ask: "the
  hallways with the different doors can be made longer and go all the way
  around, or at least halfway"). Today each bay is an isolated arc that
  only connects back to the desk; the ring makes the bays one continuous
  hallway around the rotunda. Two stages:
  - **Stage 1 ⚙ ✅ (2026-09-07, §9) — the caps link.** Every bay's two end
    caps wear a fire door (`bayShell.ringLeaf`, the institutional wired
    double) into the NEXT bay on the same floor of the egress, ordered by
    the bays' egress-door angles and wrapping: downstairs Bay 1 ⇄ Bay 4 (a
    two-room loop), upstairs 2 → 5 → 7 → 3 → 6 → 2. `hqBayRing(sector)`
    (data.js) computes the neighbours; `hqBayRoom` hangs the doors (`cap:
    'cw' | 'ccw'`, id `cap_cw` / `cap_ccw`); the renderer places a cap door
    as a FLAT wall (`_hqCapWall`, the same shape as a box-room wall, so
    targeting / E / the spawn-at-door all work unchanged); the action is
    the neighbour's SECTOR with `at` = the far side's matching cap, so the
    door wears the neighbour bay's lamp (sealed into Quarantined until its
    chapter, strobing on its Code Red), the panel is the neighbour's bay
    panel, and you arrive on the far side walking the same way round. The
    transition is the existing door-blink rebuild. Kill-switch:
    `bayShell.ring: false` restores the dead-end caps. doorhq.test.js walks
    every ring and checks the reciprocity.
  - **Stage 2 ⚙ ✅ (2026-09-08 rev 5, §9) — one continuous corridor.** The
    bays are re-framed in the egress's polar frame just outside its drum:
    the ground ring at r 21.5–25.5 (behind the lower wall, r 21), the
    mezzanine ring at r 24.5–28.5 (behind the upper drum, r 24) — one
    room per floor (`ring_g` / `ring_m`, still `kind: 'bay'`: the arc
    shell, the annulus walk and the door placement took any span, so the
    renderer learned only `shell.full`). `hqRingLayout(level)` lays each
    bay out as a SEGMENT: its egress door is the ring's inner-wall door
    at the SAME angle (`egress_<sector>`), its thresholds a door run
    `spacing` apart on the outer wall centred on it — runs that would
    collide are relaxed apart (Diplomatic 150 → 146.0, Urban 180 →
    178.7, Hollow 210 → 215.3 on the mezzanine; the egress doors stay
    put), the ring's break is the widest gap between runs, the arc is
    the outermost runs plus `endPadM` (2.2 m) each way: downstairs 239°
    → 374° (Bays 1 and 4, 55 m), upstairs 17° → 282° (2 · 5 · 7 · 3 · 6,
    123 m). `hqRingRoom(level)` hangs the doors, the per-segment
    dressing (extinguisher / breaker / clock at each way out, cabinets
    and boxes in the gaps and at the caps), the bays' own flavour props
    and guards carried over by `hqRingSpot` (angle scaled by the radius
    so the distance along the corridor is kept), the overheard lines per
    segment (map.js picks the bay you stand in via `hqRingSectorAt`).
    `hqBayId(sector)` resolves to the floor's ring and `hqBayEntry
    (sector)` to its door, so the egress doors, the site rooms' way back,
    the panels, the directory, Code Red and the cast (Sedaniel's bay spot
    → `hqCastSpotRoom`) all followed; `hqBayNo(sector)` replaced every
    read of `room.bayNo`. The caps: with `corridor.close` each wears the
    stage-1 fire door to the OTHER cap (`{ room: ring, at: cap_* }` — a
    door-blink across the service side, "not on the plan and not lit");
    `corridor.arc[level] = [a, a + 360]` closes a ring by hand (no caps,
    `full`). Kill-switch `corridor.on: false` = the stage-1 bays (still
    registered as `bay_<sector>` and still tested). doorhq.test.js: five
    new tests (+ the stage-1 block re-pointed at `bay_*`).
- 5.5 H-Wing: a straight corridor kit (drywall, carpet, fluorescent,
  cubicles) — the only place with right angles; the childhood-home door;
  the Backrooms crossing.

### Phase 6 — Engine-side pieces (1 session each, ⚙)
- 6.1 (split 2026-09-04, §9) — the Training Facility is TWO boards and one
  room, all on the voxel path, and both boards are ✅:
  - 6.1a ⚙ ✅ (2026-09-04, §9) **the walkable Training Room**
    (`DOOR_HQ.rooms.training`, a box room off the egress door at 180°): the
    8×8 pit in the middle as room geometry, the booths, the VHS CRT, the
    RANGE console that launches ORIENTATION (6.1b) / PRACTICE (6.1c — the
    Holo Sim IS the practice floor, decided here). Reuses the enclosure
    vocabulary from 6.1b (`_hqBuildTrainingPit` beside `_hzTrainingRoom`).
  - 6.1b ✅ **`prebuilt_training` — the Training Room board.** A Δ board
    (DELTA FORGE house rules, the shared lava→dirt bed, 4v4) authored flat
    and open like `training_room_v1`: warm plaster-concrete SLABS (the
    `training_floor` terrain, drawn at load — rev 3); the lit seams,
    corner lights, four scorch stars and the whole enclosure are the
    `training_room` scenery theme (walkway ring with A–H / 1–8, maroon
    barriers with red post lamps, solid double-sided walls with dado + trims +
    fluorescent strips, green-lit N/S doors, observation booths W/E, corner
    machinery, clocks, red lamps, the signs). Cutscenes (4.3) play here.
  - 6.1c ✅ **`prebuilt_holosim` — the Holo Sim board.** Arcane
    Engineering's simulation floor from the `holo_sim_v1` refs: `holo` /
    `holo_red` tiles (new terrains, pixel-art data-URI textures, self-lit
    rims via `_EMISSIVE_TERRAIN`) over the same bed, black starfield, a
    fading holographic apron grid + corner beams (`holosim` near builder),
    neon rings + dark ring-glyph monoliths in the far roster. Purpose TBD
    (rec. the practice / loadout-testing floor).
  Both ride the Δ list in match select and friendly online rooms
  (`EW_MAP_META` rows with `isDelta: true, facility: true`); never sites
  (no bay, no leaf, no native pool, no ranked rotation).
- 6.2 ✅ (2026-09-04, §9) Black Cube: the tower was ALREADY the Cube in
  model and label (user: "the towers are already cubes"); this session
  added the missing announcer line ("⬡ THRESHOLD CLOSED — …") and the
  CUBE mastery label. No model work was ever needed.
- 6.3 ✅ (2026-09-04, §9) Keys: every player-facing hourglass label/icon/
  log/banner → Key/🗝 (code identifiers untouched, Hazard Pay precedent);
  the Keys win announces "🗝 THRESHOLD STABILIZED".
- 6.4 (MASTER C-5) Nexus hold → double Cube damage instead of a win.
- 6.5 Battle-board draw-call work (ROADMAP §4 items 1–3) — unrelated to
  the hub, listed here so nobody conflates the two again.

### Phase 7 — THE ROOM REGISTER: every site a numbered room (planned 2026-09-07, ⚙ mostly)
The user's brief (2026-09-07): "eventually all the maps become walkable
rooms inside the HQ just like the Training Room", every map gets a room
number that means something, and the HQ grows the rooms a building needs
(a cafeteria, a trophy case, a barbershop…). The user handed over a list of
~75 room ideas; this phase is the curated version — what stays, what
merges, what is cut, what number each place wears, what each one is built
from — and the mechanism that makes a site walkable. Numbers are the
user's wherever they gave one; **REC** marks a number or a change Claude
proposes and the user has not ruled on (MASTER Part C rows 22–24).

#### 7.0 Rules of the register
1. **One number, one place.** A number is a plate over a door, a line on
   the site file, a row in the building directory. Duplicates were
   resolved below; nothing shares a number.
2. **A number needs a hook or it stays blank.** Alphanumerics are fine
   (Room i, E4, 2D, 4D, 4C, 90S, H-20) — the plate machine does not care.
   A few places are better without one (the Foyer, H-Wing, the Quartermaster's
   vault) and the Canon Office's plate reads `ROOM № — CONTESTED`, which is a
   joke and a policy.
3. **A room is a site or it is a department; never both.** Sites are launch
   maps: full map + Δ board + site file + threshold in a bay + ranked rows.
   Departments host existing functions (A5). The Training Room (64) and the
   Holo Sim (404) are the two facility boards and stay facility boards.
4. **Repetitive ideas fold into the site they overlap** as its DEEP
   CROSSING nickname, its threshold note, or a piece of its setting —
   the idea survives as flavour instead of costing a map.
5. **Nothing is built by this phase on its own.** 7.1 is a data edit (✅
   shipped 2026-09-07, §9); 7.2 is the engine piece; the rooms and sites are
   one session each and the user picks the order.

#### 7.1 ⚙ ✅ (2026-09-07, §9) Numbers on the doors (one data.js + doorhq.test.js delivery)
- `roomNo` on every `DOOR_HQ.thresholds[mapId]` entry (sites) and on any
  door / counter entry in `DOOR_HQ.rooms.*` (departments, amenities);
  `hqRoomNo(idOrMapId)` helper. doorhq.test.js: every launch map has a
  `roomNo`, no two places share one, alphanumerics allowed.
- Where it shows: the plate over the threshold (`ROOM 56` in small caps
  above `STONEHENGE`, the bay sub-line under it); the bay door panel and
  the match-select SITE FILE header (`SITE_FILE_LABELS` gains `ROOM`); the
  result stamp's case line (`CASE EW-nnnn · ROOM 56`); the building
  directory, sorted numerically with alphanumerics last; the loading
  screen's site-file card. The Training Room already does this by hand
  (`ROOM 64 · ORTHOGONAL GEOMETRY EXPOSURE AREA`) — it moves onto the field.
- The elevator's floor panel skips 13 (Room 13 is filed in Bay 1, not on a
  floor). One line of procedural text; the joke is free.

#### 7.2 ⚙ The walkable site (the engine piece) — stage 1 ✅ (2026-09-07, §9: D.U.M.B.) · stage 2 ✅ (2026-09-07 rev 5, §9: CERN + Backrooms, the room's `mood`) · stage 3 ✅ (2026-09-08, §9: Nuketown + the Stadium, the OUTDOOR room — `open`, the sky, the masts) · stage 4 ✅ (2026-09-08 rev 2, §9: the six MOAT rooms — `moat`, the quay, the causeways, the fluid sheet) · stage 5 ✅ (2026-09-08 rev 3, §9: THE SETTING IN THE ROOM — the map's near builder at 1:1, `siteRooms.near`, `_hqBuildSetting`) · stage 6 ✅ (2026-09-08 rev 4, §9: THE REST OF THE REGISTER — the eighteen remaining sites, all outdoor rooms; every launch map is walkable) — 7.2 is COMPLETE
**What shipped** (rev 4): the mechanism and the first room. A site in
`DOOR_HQ.siteRooms.built` gets `hqSiteRoom(mapId)` → a **box** room
(`kind: 'box', fx: 'site', site: mapId` — the Training Room's pattern
reused whole, so shell / doors / counters / props / collision / camera
came for free; the `kind: 'site'` name below is kept for the OUTDOOR
rooms that will need a sky and the map's far roster). The board is read
by `hqSiteBoardInfo(mapId)` from the finished Δ (`PREBUILT_MAPS`) — cells
with a level relative to the Δ baseline, `walk` from `TERRAIN_RULES` +
`HQ_SITE_HAZARDS`, `fluid`, the Δ's tints; the edge walls; the monuments;
the objects; the nexus anchor — and drawn by three-renderer.js
`_hqBuildSiteBoard` (never the battle mesher): one InstancedMesh of cell
quads per terrain, one instanced box per raised cell, a sunk pit + sheet
per lake / lava cell, the thin edge walls, the monuments through the
shared `_monBuilders`, the nexus ring, the Training Room's lit seams and
A–H / 1–8. Walking: `_hqSurface` gained a board layer (`_hq.site`,
`_hqSiteCellAt`) — a +1 step is climbed (the jump-1 rule: raised cells are
rect blockers with `step` = one level), a +2 block is a wall, an edge wall
is a thin blocker, shallow water is a −1 pit you drop into and wade, lava /
deep water are never entered or overflown. The way in is the threshold
leaf from the other side on the SOUTH wall (P1's lane), landing back at the
bay's threshold door; the CROSSING console (west wall, the tanker desk) is
the way on — map.js `_hqCrossingHtml` opens the same site-file panel
(CROSS ▸ Δ / DEEP / Code Red RESPOND) and post-match you stand at the
console. A threshold whose site has a room is walked INTO on E
(`_hqDoorDirectAction`; sealed / clearance doors keep their panel); the
directory GOes into the room; the register's site row carries `siteRoom`.
The room wears no `roomNo` — `hqRoomNo(roomId)` and the console's plate
resolve to the threshold's (7.0 rule 1). The natives stand on the walkway
(`npcSpots` with a `race` hint from `hqMissionPool`; a race with no rigged
model falls back to the roster draw). **Stage 3 (2026-09-08): the
OUTDOOR room.** `shells[id].open: true` makes the box room a compound
under the sky: no ceiling, no conduits, no fluorescents; the four walls
are the site's perimeter (`wall` / `floor` / `dado` may be battle TERRAIN
keys — `_hqTex` falls through to the terrain sheet, tiled at one battle
tile = 1.75 m); an `apron` of ground runs 16 m out past the walls over a
dark `skirt`; `shell.sky` is the map's EW_MAP_META `env` (tint / stars /
nebula / fog / far-roster `scenery` / `density`) plus `night` from the
mood; the four `lights` move to the walkway corners and become lamp
MASTS (pole, head, lens and glow in the mood's colour, a blocker each).
The renderer's `_hqBuildSky` hangs a SECOND firmament dome in the HQ
scene wearing the battle's dome shader and its shared uniforms
(`_hqTickSky` drives uMapTint / stars / nebula / fog / day-night from
`shell.sky` every frame; the battle overwrites them again the moment it
renders, and `_hqLeave` re-arms its fog) and the map's far roster round
the room at the battle's scale — the same body builders (the default
list is now `_hzCosmicRoster()`, shared), the same haze stamp, graded
once, drifting under the HQ loop (`_hq.sky.floaters`), with three of the
Department's lone doors and a few haloes like every outdoor battle
roster. The battle's own horizon group, key cache and floaters are never
touched. Lighting is the sky's: a hemisphere in its tint, a sun by day
or a cool fill by night, the masts' point lights, and the map's fog
colour as the distance fog. Still to do per site: the map's `near`
setting inside the room (today: the generic dressing + the site's signs,
per-site props in `siteRooms.flavour`), the cast lines (A15). **Adding a
site room = one id in `siteRooms.built`** (+ optional `shells[id]` —
textures, `h`, `pipes`, a `mood` for its light, `open` + `apron` /
`skirt` for an outdoor one — / `flavour[id]`);
doorhq.test.js checks the room against its threshold, its bay door, its
board and the register (an open room: a sky that is the map's, masts on
the walkway, nothing hung from a ceiling, a wall tall enough for the leaf).
**Stage 4 (2026-09-08 rev 2): the MOAT room.** `shells[id].moat = { key,
gap, bank, bed, deck, causeways }` on an open room makes its walkway a
QUAY (`pad` grows to quay + gap; the quay keeps the 2.4 m every prop,
native, mast, the guard and the console already stand on): the ring
between the board (the island) and the quay is sunk one level and filled
with the map's own liquid — `hqSiteRoom` fills in `walk` (TERRAIN_RULES +
`HQ_SITE_HAZARDS`, exactly a board lake's rule: water wades, deep water
and lava are never entered), `tint` (the Δ's `terrainTints` for the key,
water falling back to the board's water tint) and `quay`, and hands the
renderer `shell.moat`. three-renderer.js `_hqBuildSiteBoard` draws it as
the near kit's `_nrMoat` brought indoors: one sheet per side in the
battle's own animated fluid material (`_buildFluidTopMat(key)`, the tint
set on it, lava's emissive up; a translucent basic sheet if the shader
is unavailable), the bed under it, the quay's face + coping and the
island's face per dry edge cell in the bank texture (an InstancedMesh),
corner posts, a deck with kerbs across the gap per causeway (the south
one is the way in and always exists; the north one matches the near
kit's pair), four glow sprites on a lava moat — and every board-edge
lake cell of the same liquid OPENS into the moat (its pit box and sheet
are dropped, the moat's sheet covers it, a bank stands only on the
sides that meet a dry cell), so Atlantis's canals and Antarctica's bays
run out into the ring. Walking: `_hqSiteCellAt` returns the moat as one
more pseudo-cell (`_hq.site.moat.cell`: top −1 level, walk from the
data) anywhere in the ring that is not a causeway (`_hqSiteOnCauseway`),
so `_hqSurface` / `_hqAirOK` / the landing / `_hqCamBlocked` treat it
like a board lake with no new branches; climbing out of any pit onto the
walkway is one level (`curY < -0.5` extends the board tolerance). The
water animates under the HQ loop (`_hqTickMoat`: the shared fluid
clock, the key's drift offsets, caustic tile = one cell). The A–H / 1–8
labels and the hazard plate move onto the quay. **A fix that came with
it**: a site room's floor is now a FRAME round the board (or round the
moat) instead of one plane over everything — before this the plane hid
every board pit (D.U.M.B.'s and the Backrooms' water sat under it). Six
rooms: i (grass quay, the curtain wall, a plank drawbridge, torchlight),
H-20 (marble under a ruined wall, the canals' teal moat at night), 666
(scorched ground, obsidian, a lava moat, basalt causeways, red light),
2012 (cobbles, the glyph wall, the calendar's cyan canal, torches), 88
(marble under the cavern wall, the inner sea, crystal light by day), 90S
(snow under the ice wall, deep water, an ice bridge, polar day).

**Stage 6 (2026-09-08 rev 4): THE REST OF THE REGISTER.** The eighteen
sites that had no room got one each — a data batch, no renderer change,
because stages 3–5 made a site room `built` + `shells[id]` + a `near`
row + `flavour[id]`: 14179 Shasta (a cliff wall, the pines in the room),
56 Stonehenge (the sarsen ring on the walkway, violet night), 444 Giza
(casing-stone walls, the pyramids over them), 777 Heaven (cloud
underfoot, the north Gate — the south one is the hotel door), 2047
Cyberpunk City (the towers right behind a 12.6 m tenement wall, neon
strips), 11 Babel (the terraces as `stands`, the console on the north
wall — the north terraces make way for it), 12 Olympus, 4 Mars, 51 Area
51 (the fence and the towers inside, the console on the north wall
because the west hangar has the west), 512 Skinwalker Ranch, 180 Hollow
Earth (the inner sun overhead), 420 Fairy Forest (the console on the
east wall; the spring has the west), 1969 Moon (a 3.0 m regolith berm —
the door had no wall; Records built one), 888 Vatican City (the
basilica front across the north strip, the dome over the wall), 23
Bohemian Grove, 9600 Göbekli Tepe, 1225 North Pole (the workshop has
the west wall; console north), and 2D Flat Lands — the one room WITHOUT
its setting (`setting: false`, `pad: 7`): the plane's builder hands
`_nrKit` a fourteen-tile apron, which would make a 63 m room for one
dead tree, so it keeps a 7 m walkway and its emptiness. None of the
eighteen boards holds lava, void or an edge lake worth opening, so none
is a moat room (Shasta's lake and the Grove's creek lie OUTSIDE the
kit's apron in the battle, and `_nrMoat` is a no-op in the room). Day
or night per room follows the map's sky. **7.2 is complete: every
launch map in the register is a room you walk.** Known and accepted:
the setting cull drops what stands in the console's run or the way in
(Vatican's obelisk stands on the south lane; Babel's north terraces),
and a GLB prop that has not loaded when `_hqBuildSetting` runs (the
obelisks, the mushrooms, the dumpsters) has no bounds yet and so is
neither culled nor a blocker — it lands where the battle puts it.

The Training Room is already the pattern: a `kind: 'box'` room whose floor
carries the 8×8 pit (`shell.grid`, one 1.75 m cell per battle tile — a
battle tile IS 128 world units = 1.75 m at `DOOR_HQ.units` 73, so a Δ
board drops into an HQ room at 1:1 with no rescale), the RANGE console
launching the board, the enclosure drawn by the same vocabulary as the
board's scenery theme. Generalise it:
- **`kind: 'site'` rooms are generated, never hand-edited** —
  `hqSiteRoom(mapId)` beside `hqBayRoom(sector)`: the site's Δ board in
  the middle as WALKABLE terrain, the map's `near` setting around it, the
  way in (the threshold leaf from the bay, seen from the other side), the
  way ON (a CROSSING console — or the far spawn lane's D.O.O.R. threshold
  from THE CROSSING cinematic, standing on the apron — that launches
  `_hqLaunchMission(mapId)` / DEEP CROSSING exactly as the bay panel does
  today), and the site's native entities loitering as NPCs.
- **The board as room geometry, within the §0 / §6 guardrail** (the hub
  never uses the battle-board builder or its shadow pass). Draw the Δ the
  way the HQ already draws its stairs and light strips: ONE
  `InstancedMesh` per terrain texture (64 cells → typically 3–6 draw
  calls), per-instance height from the board's height grid, the fluid
  tiles as one `_buildFluidTopMat` sheet each (the moat kit does this
  already), objects / monuments through the near kit's `_nrProp` and the
  foliage loader (`_nrTrees`). This is a static Δ builder, not the tile
  renderer; it also happens to be ROADMAP §4 item 1's fix, so the work
  pays twice.
- **Walking it**: `hqOccupancy` gains a board layer — a cell is walkable
  when `TERRAIN_RULES` says so AND the step from the neighbour is ≤ 1
  (the jump-1 rule the boards are already authored to), water and lava
  block, `void` / `chasm` are the walk-off edges the controls rework
  already handles. Height comes from the board, not from `level`.
- **Outdoor sites** need a sky: `kind: 'site'` rooms carry the map's
  `env` (firmament tint / stars / nebula / fog) and its far roster
  (`env.scenery`) — the renderer already builds both from `state.mapEnv`;
  the HQ drives them from the room instead. Indoor sites (D.U.M.B., CERN,
  Backrooms — near builders that are already `_nrRoom`s) are plain box
  rooms and are the cheapest to do first.
- **Flow**: a threshold door in a bay opens INTO the site room (a real
  door-blink transition) instead of straight to match-select; the crossing
  is launched from inside. `_hqLaunchRoom` remembers the site room, so
  post-match you stand on the apron where you left. Nothing about match
  setup is bypassed (§3.7 still holds).
- **The cast on site**: `doorSiteCrossings(label)` already names the
  natives; spawn 2–3 of them at `npcSpots` on the apron with idle clips
  from the shared library (every one of the 96 races has a rigged model or
  a sprite) — talking to one opens its Codex dossier. Fog rules do not
  apply (nothing here runs during a match, RULE #2 §3.8).
- Order of construction (cheapest first, each ⚙): 555 D.U.M.B. → 999 CERN
  → 90 Backrooms (box rooms) → 64's neighbours 1945 Nuketown and 50
  Stadium (flat, no water) → the moat maps (Camelot, Atlantis, Hell,
  Technoticlan, Agartha, Antarctica) once the fluid sheet is in → the rest.

#### 7.3 THE REGISTER — sites (29 shipped + 2 facility boards)
Bay = the containment bay after the 7.5 rebalance. **REC** = Claude's
number; everything else is the user's.

| Room | Site | Bay | Why this number |
|---|---|---|---|
| **0** | The Singularity *(new, 7.6 #7)* | Quarantined | the user's Void (0) and Singularity (1) merged — a point of zero volume |
| **2D** | Flat Lands | Quarantined | REC — Abbott's *Flatland* is two-dimensional; pairs with 4D |
| **4** | Mars | Celestial | fourth planet |
| **4D** | The Tesseract *(hold, 7.7)* | Quarantined | the hypercube |
| **6** | Saturn *(new, 7.6 #5)* | Celestial | sixth planet; the black cube in the egress is already "the Saturnian black cube" (data.js `shell.cube`) |
| **11** | Tower of Babel | Ancient | REC — Genesis 11 |
| **12** | Mount Olympus | Diplomatic | REC — the Twelve Olympians |
| **13** | The Haunted House *(new, 7.6 #1)* | Terrestrial | the floor hotels leave out; the elevator (7.1) skips it |
| **21** | The Strip *(new, 7.6 #3)* | Urban | blackjack |
| **23** | Bohemian Grove | Terrestrial | the 23 enigma |
| **27** | Club 27 *(hold, 7.7)* | Urban | the 27 Club; the user's concert / dive bar / disco / studio, merged |
| **33** | The Lodge *(new, 7.6 #2)* | Terrestrial | the 33rd degree; Skull & Bones (322) is its basement |
| **50** | Football Stadium | Urban | REC — the 50-yard line (the user's 42 has no football hook; see 42 under departments) |
| **51** | Area 51 | Terrestrial | itself; Roswell 1947 folds in — the saucer on the rig IS the wreck, the plate reads `EST. 1947` |
| **56** | Stonehenge | Ancient | the 56 Aubrey holes |
| **64** | Training Room *(facility)* | — | ✅ shipped; 8×8 |
| **80** | The Colosseum *(hold, 7.7)* | Ancient | REC — inaugurated AD 80 (the user's 300 is Spartan, and Greek; alt) |
| **88** | Agartha | Hollow | the user's; the plate reads as ∞ stacked on ∞ — the world inside the world |
| **90** | Backrooms | Quarantined | the user's "Off Limits" — it's 90 degrees. The one place in the register made of right angles; beyond H-Wing when H-Wing exists (MASTER C-12) |
| **90S** | Antarctica | Hollow | 90° south |
| **180** | Hollow Earth | Hollow | REC for the user's blank 180 — "the floor on the far side is the ceiling" (its own threshold note) |
| **222** | Mitosis *(hold, 7.7)* | Quarantined | cells divide 2→2→2 |
| **343** | The Mothership *(hold, 7.7)* | Celestial | the user's alien ship; the saucer from Area 51, inside |
| **369** | Tesla's Lab *(hold, 7.7)* | Terrestrial | REC — 3-6-9 (the user's 333 as alt; the quote is apocryphal, which is on brand) |
| **404** | Holo Sim *(facility)* | — | the user's "room not found" — the Simulation is a projection, not a room |
| **411** | The National Park *(hold, 7.7)* | Terrestrial | Missing 411 |
| **420** | Fairy Forest | Diplomatic | the user's Enchanted Forest; the mushrooms are not that kind |
| **432** | The Cathedral *(hold, 7.7)* | Diplomatic | the user's Resonance Chamber — 432 Hz, the organ |
| **444** | Pyramids of Giza | Ancient | four faces, three times |
| **451** | The Library of Alexandria *(hold, 7.7)* | Ancient | Fahrenheit 451 — the one library Records did not keep |
| **512** | Skinwalker Ranch | Terrestrial | REC — the ranch is 512 acres |
| **555** | D.U.M.B. | Terrestrial | the user's Pentagon / military base, folded onto the deep underground military base — five sides above ground, the sixth is down |
| **666** | Hell | Diplomatic | — |
| **711** | The Gas Station *(hold, 7.7)* | Urban | 7-Eleven |
| **777** | Heaven | Diplomatic | — |
| **888** | Vatican City | Diplomatic | the user's; moves bays (7.5) |
| **999** | CERN | Terrestrial | 666 upside down; also the Swiss emergency number is not 999, which Records finds suspicious |
| **1225** | North Pole | Hollow | Dec 25 |
| **1600** | The White House *(hold, 7.7)* | Terrestrial | REC — 1600 Pennsylvania Ave (the user's 1776 as alt) |
| **1717** | Pirate Bay *(hold, 7.7)* | Hollow | the year of the pirates' pardon; also the year the first Grand Lodge sat, which Room 33 will not confirm |
| **1945** | Nuketown | Terrestrial | the test; the user's 90210 Suburb folds in (Nuketown IS the suburb) |
| **1954** | Downtown *(new, 7.6 #4)* | Urban | REC — the first kaiju film; the user's 911 "Disaster City" (MASTER C-24: 911 + a ruined metropolis reads as 9/11 to a lot of players — the comedy supports the danger, A12 #2, but that is the wrong danger; alt 1933, Kong) |
| **1969** | Moon | Celestial | the user's Lunar Soundstage — the site file already says the footprints are from missions that never happened |
| **2001** | Jupiter *(hold, 7.7)* | Celestial | the monolith; Saturn first |
| **2012** | Technoticlan | Ancient | the calendar |
| **2047** | Cyberpunk City | Urban | the user's (2049 / 2077 alts); moves bays (7.5) |
| **9600** | Göbekli Tepe | Ancient | 9600 BC |
| **14179** | Mount Shasta | Hollow | REC — the summit elevation in feet, like a trailhead sign (alt: 7, one of the seven sacred mountains) |
| **E4** | The Looking-Glass *(new, 7.6 #6)* | Quarantined | the king's pawn — the user's Chess Board and House of Cards / Wonderland merged |
| **H-20** | Atlantis | Hollow | the user's; sub-line `DEEP OCEAN ORICHALCUM RESEARCH` (the user's research-station idea is Atlantis's own name, not a second map) |
| **i** | Camelot | Ancient | the imaginary kingdom (√−1) |

#### 7.4 THE REGISTER — departments, amenities, counters (the HQ side)
Each is a `kind: 'box'` room from the existing kit plus counters onto
functions that already exist, unless marked. ⚙ throughout; 🧊 only for
the hero prop named in §5.6.

| Room | Place | Ring | Hosts | Number's hook |
|---|---|---|---|---|
| **1** | Reception · Intake | Operations | ✅ exists as a door → the profile; becomes a walkable room (the reception wedge is already there) | REC — "one foot in the door" (A0 #1); forms start at 1 |
| **4C** | The Corner Office | Executive (L4+) | your office once the ladder passes L3 (A5, 5.4): the in-tray, plaques, the window that should not exist | the user's; a corner office in a round building — one dimension short of Room 4D, and a Form 90 problem |
| **8** | The Infinity Pool | Executive (L4+) | an amenity: the pool edge over the void, loungers, the top of the leaderboard on break; optional later: its own board | the user's; ∞ on its side |
| **42** | Records · Archives | Support | ✅ exists as a door → Codex / Replay / Community Maps; walkable later | REC — if the stadium takes 50, 42 goes to the room that has the answer to everything and only keeps the file |
| **86** | The Cafeterium | Support | the roster ON BREAK (`npcSpots`), online silhouettes from `#mmOnlineCount` (§8 open question — this is where they go), the vending machine that was on the other side yesterday, the notice board (mirrors 247's sheet). **After hours (a Phase 5.1 variant, rolled per visit) the door reads `MÖBIUS STRIP CLUB`** — same room, the bar counter is a Möbius loop (one lathe), nobody comments | the user's; 86'd — the menu is always out of it |
| **101** | Your office (the closet) | Support | ✅ shipped | the user's; Orwell's room holds your worst fear, and yours is a closet |
| **111** | The Trophy Case | mezzanine, beside EMPLOYEE OF THE MONTH | a counter → `_mountReactProfile` on the Achievements / Records tab (ACHIEVEMENTS_PLAN's trophy case); a glass cabinet with plaques | the user's |
| **247** | The Clock Room | Support | **D.O.O.R. = Daily Office Operations Requirements** (the user's) as `FORM 365`: three tasks a day seeded like Code Red, Hazard Pay + SP (ROADMAP §8.1's daily loop — engine work, 7.9); the punch clock (login streak); the canon-date clock; today's Code Red posted. Every clock in the room disagrees on purpose | the user's 247 and 365 merged — 24/7, and the form number is the year |
| **360** | The Observatorium | mezzanine / upper | the dome: REC — Replay moves here from Records (the tape library becomes the projection: `_ewReplayLastMatch`), and the **site star-map** — every crossing is a star; point at one and its door panel opens, a fast route to any site (a real function, not dressing) | the user's; 360° |
| **1111** | Medical | Support | ✅ exists as a door → Challenge services (`_goToCampaign`); walkable later — where EXITED operatives are processed (A5) | the user's |
| **5150** | The Padded Room | off Medical | a one-cell box room behind the kit's `leaf_cell`; story: administrative leave (`DOOR_STORY.md` §4) is served here | the user's; California's involuntary hold |
| **1287** | Occam's Barbershop | Support | the user's "change your appearance": the HQ avatar (`EW_HQ_AVATAR`: the Player model / your most-played vessel / any declassified vessel), callsign, the ID-card photo — a chair, a mirror, a counter. "The simplest cut" | REC — William of Ockham, b. c. 1287 |
| **1337** | IT (inside Arcane Engineering) | Operations | the user's Hacker Room as a door, not a map: the Spell Library and the balance lab (A5's dev surfaces) behind a hollow-core door with a keypad | the user's |
| **1984** | The Interrogation Room | Support | a box room: metal table, two folding chairs, the round observation window as the one-way mirror, one lamp; story: Internal Affairs / the leave hearing; Phase 4.2 micro-scenes | the user's |
| — | The Fourier Foyer | the front door | the user's: a vestibule between the main menu and the egress with the kit's revolving door; the loading screen's physical form (spawn here after 7.2, walk in); the seal inlaid in the terrazzo | no number — it's a foyer |
| — | Quartermaster, Arcane Engineering, the Bureau of Continuity, the Elevator, H-Wing | — | as A5 | no number; Continuity's plate reads `ROOM № — CONTESTED`; the elevator skips 13; H-Wing is a wing |
| Bay 1–7 | the containment bays | Operations | as 7.5 | bay numbers, not room numbers |

#### 7.5 ⚙ ✅ (2026-09-07, §9) Seven bays (the sector rebalance; MASTER C-23 DECIDED)
Terrestrial holds 8 sites and every good new idea is terrestrial; the
Quarantined bay holds 2. A seventh bay door is a data edit (doorhq.test.js
wants one bay door per sector; the two curved stairs hug the lower wall
at 18–62° and 298–342°, so the ground ring is only free at ~75° between
the east stair's top and the Quartermaster — the mezzanine at 180°, above
the training door and opposite the elevator, is clean once two boxes
move) and two moves are on-lore:
- **BAY 7 · URBAN** ("cities · the strip · the night shift", REC on the
  mezzanine at 180°, `leaf_glass` — a shopfront): Cyberpunk City (from
  Celestial), Football Stadium (from Terrestrial), The Strip, Downtown;
  later Club 27, the Gas Station.
- **Vatican City → DIPLOMATIC** — it is a sovereign state; "immunity
  claimed" is literally its position.
- **Atlantis → HOLLOW** and the bay's sub-line becomes `inner earth · polar
  · the deep`; Pirate Bay joins it later.
Resulting bays after wave 1 (36 sites): Terrestrial 8 (1945, 51, 512, 23,
555, 999, 33, 13) · Urban 4 (2047, 50, 21, 1954) · Ancient 6 (56, 444, 11,
9600, i, 2012) · Hollow 6 (14179, 180, 88, 90S, 1225, H-20) · Celestial 3
(4, 1969, 6) · Diplomatic 5 (777, 666, 12, 420, 888) · Quarantined 4 (90,
2D, 0, E4).
**Shipped 2026-09-07 (§9):** `sectors.urban` (Cyberpunk City + the
Stadium today; the wave-1 sites join here), `bay_urban` at 180° on the
mezzanine wearing `leaf_glass` (the shopfront; the two boxes that stood
there moved to 133°), Vatican City → Diplomatic, Atlantis → Hollow (sub
`inner earth · polar · the deep`), the bay guards' lines follow their
sites. Bays today (29 sites): Terrestrial 6 · Ancient 6 · Hollow 6 ·
Celestial 2 · Diplomatic 5 · Quarantined 2 · Urban 2.

#### 7.6 New sites — wave 1 (seven, one session each, ⚙ + 🧊 the hero prop)
Chosen for: a roster gap (races with no home of their own), a silhouette
none of the 29 has, buildable from the existing tiles / objects /
monuments / near kit, and a number that lands. Each = the checklist in 7.10.

1. **Room 13 · THE HAUNTED HOUSE** (gothic; Terrestrial). The gap: seven
   races carry the `gothic` tag (wizard, ghost, werewolf, gargoyle, vampire,
   necromancer, ghoul) and none has a gothic point of entry — they are
   filed at the Grove, the Forest, the Backrooms, the Vatican, Stonehenge,
   Hell. Board: the ground floor of a mansion cut open (Camelot's
   hollow-voxel technique — `bricks_2` / `wood` / `carpet_2` rooms, edge
   walls, doorways), the graveyard out back (`gravestone`, `bone_pile`,
   `dark_woods`, `tree_5`). Near: `_nrHouse` gables around the board as
   the rest of the house, an iron `_nrFence`, dead trees, the pumpkin patch
   and the coven's bonfire (the user's Halloween Town / Witch's Coven, 31,
   folded in as the setting), a `woodcross`. Far: `dark` (Camelot's).
   Ambience: `ambNight` + `thunderAmbience` exist. Threshold leaf:
   `leaf_hotel` — the plate says 13, the door says 237 (the user's Hotel
   folds in: one of the doors inside is the Overlook's, the film's number).
2. **Room 33 · THE LODGE** (clandestine, indoor; Terrestrial). The mosaic
   pavement is the `checkerboard` tile; the two pillars are `column_1` /
   `column_2` flanking the nexus; the altar a `tablet`; the all-seeing eye is
   the `eyeball` OBJ that already floats in the `eyes` roster, hung over the
   board as the lamp; `damask` wallpaper and a `wood` dado through
   `_nrRoom`; `torch`es and a `censer`. Distinct from the Grove (redwoods,
   outdoors) as a temple interior. The user's Skull & Bones (322) is its
   DEEP CROSSING — "THE TOMB, sub-basement". Natives: men in black,
   general, politician, conspiracy theorist, marksman, halfdemon, fortune
   teller (biome neighbours until retagged). Leaf: `leaf_vault`.
3. **Room 21 · THE STRIP** (urban / neon; Urban). Not a casino floor (no
   slot-machine object exists) — the boulevard: `urban_street` +
   `_nrRoadLines`, the fountain (`_nrPool` with the Vatican's jets), palms
   (`tree_3`), the wedding chapel (the `church` object), `lamp_post` and
   `traffic_light` objects, the Luxor (the `Pyramid` GLB + an `obelisk` —
   "Las Vegas has a pyramid; Records has questions"). Near: `_nrBlocks`
   towers with lit windows, text neon (`_hzTextTex`), `jumbotron` marquees,
   `_nrLamps`. Far: `city`. Natives: homosapien, politician, conspiracy
   theorist, superhero, antihero, honda civic, zombie. Leaf: `leaf_motel`.
4. **Room 1954 · DOWNTOWN** (urban, monster-movie; Urban). The gap: kaiju,
   king kong, superhero, super sentai, antihero, zombie have no downtown
   (their entries are Antarctica, Hollow Earth, Cyberpunk, Technoticlan,
   Nuketown). Board: `urban_street` / `concrete_floor` / `rubble_1..4`,
   `building_1..11` and `abandoned_building_*` objects, `stairs`,
   `traffic_light`, `lamp_post`. Near: the Cyberpunk block recipe in daylight
   concrete, one tower collapsed across the apron (a tilted `K.box`),
   `dumpster`s, a `securitycam`. Far: `city`. Ambience: `ambDay`. Leaf:
   `leaf_revolving` (a lobby door, revolving the wrong way).
5. **Room 6 · SATURN** (space; Celestial). The Cube's home. Board: the
   north-pole hexagon storm — a hex-ish plateau of `moon_3` / `mars_2`
   tinted ochre, `oil` tiles as the hydrocarbon lakes, `storm` /
   `cloud_thick` at the rim (Olympus's cloud-sea vocabulary), `tower_cube`
   objects as cover ("smaller cubes; do not stack"). Far: `space` with the
   `rings` monument as the ring plane cutting the sky and a `lenticular`.
   Natives: martian, cosmic wraith, voidweaver, mantid, barbarella, black
   goo, grey, nordic. Leaf: `leaf_bulkhead` (the Mars airlock's twin,
   frost on the other side). Nothing to model.
6. **Room E4 · THE LOOKING-GLASS** (astral; Quarantined). The Δ board is
   8×8 — this is the purest one: `checkerboard` / `checkerboard_2` marble,
   giant pieces as monuments (pawn / rook / bishop / queen / king are lathe
   and extrude geometry Claude generates — new `_MON_BUILDERS` keys; the
   KNIGHT needs a horse head, §5.6). Near: a hedge maze (`_nrTrees` boxes
   in `leaves_*`), the card soldiers (flat planes with a canvas-drawn face —
   the user's House of Cards, 52, folded in), the `mushroom` monument at
   oversize, a teacup or two. Natives: glitch, machine elves, dreameater,
   fortune teller, telepath, occulus, and the knights (knight, king arthur —
   "the knight's move"). Leaf: `leaf_frame_only`, mirrored.
7. **Room 0 · THE SINGULARITY** (astral / space; Quarantined). The user's
   Void and Singularity as one map: a spiral of rock shards (`moon_3`,
   `crystal`) over nothing (`void` / `chasm` tiles are the gaps), falling
   toward the nexus. Far: `space` at high density with a `beamring` +
   `lightpillar` at the centre as the accretion light. Cheapest of the
   seven — tiles and far scenery only. Distinct from Flat Lands (an empty
   plane) and the Holo Sim (a grid). Natives: voidweaver, cosmic wraith,
   glitch, dreameater, black goo, occulus, the watcher. Leaf:
   `leaf_frame_only` — "a frame; there is no other side".

#### 7.7 New sites — wave 2 (hold; good, not urgent)
| Room | Site | Bay | One line |
|---|---|---|---|
| 4D | The Tesseract | Quarantined | nested cubes (`tower_cube`, `holo`, `beamring`); the single best lore fit (what H-Wing becomes) — held only because 0, 90 and 404 already cover "abstract"; take it before 222 |
| 27 | Club 27 | Urban | the user's concert + dive bar (27) + disco (69) + recording studio (808) as ONE venue: the lit `checkerboard_3` dance floor, a `jumbotron` LED wall for the stage, the bar; **the booth (808) is a counter = the jukebox — pick the battle theme from the 29-track battle pool** (a real function, and the reason to build it) |
| 80 | The Colosseum | Ancient | the user's Gladiator Arena: sand (`dirt_3`), `column_*`, the hypogeum (`chasm`); near = the Stadium's `_nrTiers` in stone + `_nrColonnade` arches; natives minotaur, cyclops, giant, golem, chosen one, nephilim |
| 451 | The Library of Alexandria | Ancient | the fire spreading as `lava` / `scorched` (Hell's vocabulary, orange), `bricks_1`, `tablet` monuments as scroll racks, `torch`; the Pharos as a far `_nrTower`; "We only keep the file" |
| 711 | The Gas Station | Urban | night, `urban_street`, `_nrLamps`, an `_nrHouse` canopy, `dumpster`, `traffic_light`; far `eyes`; natives cowboy, scarecrow, conspiracy theorist, zombie, mothman, and the honda civic — Sedaniel is paid in oil changes |
| 1600 | The White House | Terrestrial | the Vatican recipe: lawn, `_nrColonnade` + `_nrHouse` facade, fence, `_nrPool`; natives politician, general, men in black, marksman |
| 1717 | Pirate Bay | Hollow | a `wood_planks` deck raised over a `water` / `deep_water` moat, `bridge` gangplanks, `rocks_*` cove, `torch`; a wrecked hull from two slabs; `whalebones`; far `islands`; natives pirate, siren, mermaid, kraken, loch ness monster |
| 411 | The National Park | Terrestrial | the fourth forest (Shasta, Fairy, Grove exist): Shasta's pines + a ranger cabin + a campfire + trail `_nrSign`s + a `securitycam` on a tree — Agent Forrest's woods, "invaded by cameras" (DOOR_STORY §2 #17) |
| 343 | The Mothership | Celestial | the saucer, inside: `aluminium` / `metal_3` / `holo`, `federation_beacon`, `tower_cube`; the D.U.M.B. room recipe in silver; natives grey, nordic, mantid, black goo, symbiote |
| 2001 | Jupiter | Celestial | gas-giant cloud tops (`cloud_2`, `storm`, `cloud_gap`) with the monolith; after Saturn |
| 432 | The Cathedral | Diplomatic | a nave (checkerboard marble), pews as `barrier_*`, the organ as a procedural monument (pipes are cylinders), stained glass through `_nrWindowTex`; natives priest, ghost, gargoyle, vampire |
| 222 | Mitosis | Quarantined | inside a body: `flesh` / `flesh_2` / `flesh_3`, `skin`, `poison_bog`, the `fleshmound` — all exist; the roster is thin (black goo, symbiote, zombie) |
| 369 | Tesla's Lab | Terrestrial | `copper` / `gunmetal`, `lightpillar` + `beamring`, arcs from three-lightning.js; natives mad scientist, ai, telepath; overlaps CERN + D.U.M.B. — last |

#### 7.8 Cut, or folded into something that stays
| User's idea | Verdict |
|---|---|
| 1 Singularity + 0 Void | one map, Room 0 (7.6 #7) |
| 31 Halloween Town / Witch's Coven | the Haunted House's setting (13) |
| 52 House of Cards / Wonderland | the Looking-Glass's setting (E4) |
| 237 Hotel | a door inside the Haunted House; the plate on 13's leaf |
| 300 Gladiator Arena | Room 80 (7.7), 300 kept as alt |
| 322 Skull and Bones | the Lodge's DEEP CROSSING (33) |
| 333 Tesla | Room 369 (7.7), 333 kept as alt |
| 365 | the dailies' form number in the Clock Room (247) |
| 555 Pentagon / military base | D.U.M.B. is already the base — it takes 555 |
| 69 Disco · 808 Recording Studio · 27 Concert | one venue, Club 27 (7.7); 808 is its jukebox booth |
| 747 Airport | cut — Area 51 already owns the runway and the tarmac |
| 911 Disaster City | Downtown, Room 1954 (7.6 #4; MASTER C-24) |
| 1337 Hacker Room | a door in Arcane Engineering (7.4), not a map |
| 1776 White House | Room 1600 (7.7), 1776 kept as alt |
| 1947 Roswell | Area 51's plate (`EST. 1947`) and its saucer |
| 90210 Suburb | Nuketown (1945) is the suburb |
| 5150 · 1984 · 111 · 247 · 360 · 86 · 1111 · 8 · Corner Office · Occam's Barbershop · Fourier Foyer | HQ rooms / counters (7.4), not sites |
| Deep Ocean Orichalcum Research | Atlantis's sub-line (H-20) |
| Möbius Strip Club | the Cafeterium after hours (86, a Phase 5.1 variant) |
| Infinity Pool (listed twice) | once, Room 8 (Executive) |
| Daily Office Operations Requirements | the dailies (247 / FORM 365; engine 7.9 below) |
| 42 Football Stadium | 50 (REC); 42 offered to Records |
| 180, 365 (blank) | 180 → Hollow Earth; 365 → the form |

#### 7.9 ⚙ Daily Office Operations Requirements (engine, 1 session)
`hqDailyOps(profile)` beside `hqCodeRed`: three requirements a day, seeded
from the local date + employee number like Code Red (the same sheet all day,
a new one tomorrow), drawn from templates over real counters — win on a
named site, secure N Keys, a win by a named condition, respond to the Code
Red, declassify one entity, a Δ win with a team of the day's bay. Rewards:
Hazard Pay + SP when the meter exists (4.1); the sheet is `FORM 365` on the
Clock Room wall (247) and mirrored on the strip. ROADMAP §8.1 wanted
exactly this; the building gives it a wall.

#### 7.10 Adding a site — the checklist (what the 29 each already have)
1. data.js: `_MF_BUILDERS.prebuilt_<id>` (the full map) +
   `_MF_DELTA_BUILDERS.prebuilt_<id>` (the hand-authored 8×8 Δ — DELTA
   FORGE house rules, delta-maps.test.js; bump its hard-coded 29) +
   the `EW_MAP_META` row (`id, label, w, h, teamSize, tier, base, biomes,
   deltaPad, near, desc, env`) — everything downstream (presets, match
   select, compatible modes) is generated from the row.
2. data.js `DOOR_TEXT.SITE_FILES[id]` (tone / status / jurisdiction /
   summary — the B2 voice rule: the real place, ~300 chars, an officer
   with an opinion) and `POINT_OF_ENTRY` retags for its natives (a race
   has ONE point of entry; moving it changes the dossier's stamp — until
   retagged the new site pads its CPU pool from biome neighbours, §3.7).
   `doorSiteCanonDate` gives the FIRST CROSSING date for free.
3. three-renderer.js `_NR_BUILDERS.<near>` (the MAP SETTINGS block) and,
   if none of the 12 far rosters fits, a `_HZ_THEME_ROSTERS` entry.
4. data.js `DOOR_HQ.thresholds[id]` (leaf + `roomNo` + note) and the
   sector's `maps` list (doorhq.test.js: the partition, the leaf exists,
   rank leaves untouched, the corridor's door spacing).
5. server.js `MAP_POOL` rows (Δ + full) for ranked — hand-synced and NOT
   parity-checked today; add it to check-data-parity.js while there.
6. `npm test`; index.html bump; deliver data.js + three-renderer.js (+
   server.js for ranked) per RULE #1.

---

## 5. Assets

### 5.1 Reference images (commit to `docs/door-hq/ref/`, names in the README)
*Reality check 2026-09-04: the images live in `door_reference_images/` under
their raw filenames (`training_room_v1` = `ChatGPT Image Sep 3, 2026 at
02_08_16 AM (1).png`, `concept_board_v1` = `…02_08_48 AM.png`; `D.O.O.R.
Reality Door Rotunda.png` is a byte-identical duplicate of `…02_08_07 AM
(1).png`). Renaming to the names below is optional housekeeping.*
| File | What it shows | Drives |
|---|---|---|
| `central_egress_v1` | Two-tier round hall: mezzanine ring with five doors (green/amber/red lamps) and curved stairs both sides; ground ring with five more; a huge black cube with the DOOR square-spiral glyph hanging from the dome; round dispatch desk piled with CRTs and boxes; round tables, cabinets, globe lamps on pedestals; an agent in black at the desk. Cool speckled stone, oxblood dado, teal trim, terrazzo floor with inlaid rings. | shell proportions + palette (1.2), prop list (§5.3) |
| `office_doors_sheet_v1` | Six doors in curved-wall panels with a lamp above, silhouette for scale: peeling wooden closet door with vent · plain hollow-core · blue-grey wired-glass institutional · black security door with keypad · brushed-steel frosted · glass biometric threshold. | the six office leaves (2.3) |
| `training_room_v1` | Top-down 8×8 lit grid on cracked concrete, four scorch stars, red lamps, wall clocks, glass observation booths, corner machinery, green-lit doors top and bottom, two agents outside the grid. | 6.1 map, 4.3 backdrop |
| `janitor_closet_v1` | The L1 office: door ajar onto the curved hall, mop bucket and broom, sink, cleaning shelves, breaker panel, desk with beige CRT + phone + lamp, clipboards, locker with toilet paper on top, folding chair, round rug, floor drain, army cot. | 2.7 interior |
| `holo_sim_v1` (4 phone captures, `IMG_2998/2999/3004/3005.PNG`, added 2026-09-04) | A Tron-style battle floor: wireframe cells with glowing cyan/blue rims floating in a black starfield, red warning cells with a triangle glyph, yellow highlighted cells (in-game highlights), chromatic-split neon rings and dark speaker-cabinet monoliths behind, glitch scanlines. | 6.1c the Holo Sim board (`holo` / `holo_red` tiles, the `holosim` theme) |
| `concept_board_v1` | Labelled egress doors (SUBURBAN SECTOR 12 / OCEANIC / MEDIEVAL / ASTRAL / QUARANTINED), the top-down ring map (Reception/Intake, Quartermaster, Archives, Personnel, Medical, Central Egress, TO TRAINING FACILITY), the training room with signs (ORTHOGONAL GEOMETRY EXPOSURE AREA · MAX OCCUPANCY 45 MINUTES · REALITY LEAKS POSSIBLE), five door-state chips, the four-ring vertical diagram. | door-state vocabulary, ring plan, sign copy |

### 5.2 Export rules for every 3D asset (read this before modelling)
- **Format:** `.glb`, textures embedded, **Y up**, front facing **−Z**,
  **real-world metres** (a door leaf is ~0.9 × 2.1 m; a chair seat is 0.45 m
  high). Claude scales everything by one factor (73 units/m). Do not
  pre-scale to the game.
- **Pivot:** at the base, centred (the point that touches the floor). Door
  leaves: pivot on the hinge edge, at the base. Wall-mounted items (vents,
  clocks, cabinets against a wall): pivot at the back face, base.
- **Static props are boneless** — the `_generate` / `_texture` stage
  output that CLAUDE.md forbids for characters is exactly right here. Only
  NPCs get rigs.
- **Budgets:** small props ≤ 3k tris, furniture ≤ 6k, hero pieces (cube,
  dispatch wedge, machinery) ≤ 15k; one 1024² texture per prop (2048² only
  for the cube and the wedge); one material per prop where possible.
- **Emissive parts** (screens, lamp lenses, the cube's glyph lines) as a
  separate material named `emissive_*` so Claude can drive their colour.
- **Naming:** `hq_<thing>.glb` (props), `door_<type>.glb` (leaves),
  `tex_<surface>.png` (tileables). Upload to R2 `Assets/hq/`,
  `Assets/hq/doors/`, `Assets/hq/tex/`. New version = new filename.
- **Style:** match the references — worn institutional 1980s government,
  PS1/PS2 fidelity (chunky silhouettes read better than detail; the post
  grain hides the rest). No baked text on nameplates (blank plates; text
  is DOM).
- **Tileable textures:** 1024², seamless, albedo PNG (+ optional normal).
  Claude sets repeat per surface.

### 5.3 The asset list, in the order it pays off
**A. Tileable textures (8)** — the shell is procedural, these make it look
like the reference: `tex_stone_speckle` (hall walls), `tex_dado_oxblood`,
`tex_terrazzo` (floor), `tex_teal_metal` (trim, railings, door frames),
`tex_ceiling_panel`, `tex_concrete_cracked` (training room / bays),
`tex_drywall_beige` + `tex_carpet_office` (H-Wing, later). Until they
exist Claude uses `marble_light` / `gunmetal` / `drywall` / `carpet` from
the terrain set.

**B. Hero props (5)** — `hq_cube` (black basalt cube with the square-spiral
glyph on every face as `emissive_glyph`, ~4 m; hangs on a chain/rod — model
the rod), `hq_dispatch_wedge` (one 45° wedge of the round desk: counter
top, front panel, a CRT + keyboard + a box or two — repeated 8× makes the
desk; keep the seam edges clean), `hq_lamp_globe` (frosted sphere on a
stone pedestal, emissive sphere), `hq_table_round`, `hq_chair_office`
(teal), `hq_chair_folding`.

**C. Door leaves (12 first)** — the six office doors from the sheet:
`door_closet_wood`, `door_hollow_core`, `door_wired_glass`,
`door_security_keypad`, `door_steel_frosted`, `door_glass_biometric`; then
the institutional set for the egress: `door_double_institutional`,
`door_elevator` (closed pair), `door_bulkhead` (submarine, for Atlantis),
`door_portcullis` (Camelot), `door_suburban_closet` (Nuketown),
`door_exit_unknown` (Backrooms). More thresholds per map later (motel
door glowing, freestanding Moon door, Mars airlock, Heaven service gate,
Hell furnace hatch, CERN blast door, Area 51 hangar door, ranch gate,
redwood lodge door, stadium turnstile…) — Claude will keep the per-map
list in `DOOR_HQ.catalogue`.

**D. Dressing (≈18)** — `hq_cabinet_file` (2-drawer), `hq_shelf_boxes`
(unit with boxes), `hq_box_cardboard` (×2 sizes), `hq_crt_terminal`,
`hq_desk_lamp`, `hq_vent_grille`, `hq_wall_clock`, `hq_extinguisher`,
`hq_vending_machine` (the Mandela prop), `hq_water_cooler`,
`hq_plant_potted`, `hq_sign_wetfloor`, `hq_fluorescent_fixture`,
`hq_bench`, `hq_railing_segment` (1 m of rail with a post — instanced;
procedural fallback exists), `hq_stair_newel`, `hq_nameplate_blank`,
`hq_pipe_run` (1 m straight + 1 elbow).

**E. Closet (7)** — `hq_cot`, `hq_sink`, `hq_mop_bucket`, `hq_broom`,
`hq_locker`, `hq_breaker_panel`, `hq_rug_round` (a textured quad is fine).

**F. Training room (4)** — `hq_observation_window` (frame + glass),
`hq_machinery_corner` (×2 variants), `hq_grid_puck` (floor light emitter,
instanced), `hq_clock_large`.

**G. Characters (3)** — `door_agent_male`, `door_agent_female` (black suit,
tie, lanyard; rigged, via the CLAUDE.md character recipe so the shared
animation library retargets them), `door_janitor` (coveralls, the
Doorman-in-waiting). Optional: `door_handler` (or keep the redaction-bar
silhouette).
✅ **Superseded 2026-09-06:** the user made the whole CAST instead —
fifteen rigged Meshy characters in R2 `Assets/Sprites/Races/
maincharacters/` (sprites.js `DOOR_CAST_MODELS`, data.js `DOOR_CAST`,
§9). The generic agents in black stay as the MIB roster model. Still
wanted: a 128×128 `portrait.png` per cast member for the panels.

**H. Audio (2)** — hall room tone loop (HVAC hum, distant phones, the
occasional doorbell), DOOR muzak loop for the dispatch queue.

### 5.4 When each is needed
| Step | Needs | Without it |
|---|---|---|
| 1.x | nothing | placeholders (labelled boxes, terrain textures) |
| 2.1 | A | terrain textures stay |
| 2.2 | B | boxes stay |
| 2.3 | C (first six + double + elevator) | a generic procedural door |
| 2.4 | D | boxes |
| 2.5 | G | the fortune teller stands in |
| 2.6 | the six threshold leaves in C | generic door |
| 2.7 | E | boxes |
| 2.8 | H | synth room tone |
| 4.3 | nothing | — |
| 5.5 | A (drywall/carpet) | terrain textures |
| 6.1 | F (optional) | procedural |

---

### 5.5 Inventory as uploaded (2026-09-03) — what the kit actually contains
The user uploaded to R2 **`Assets/door/textures/`** and **`Assets/door/models/`**
(NOT the `Assets/hq/…` paths §5.2 asked for — the data now points at the real
paths; filenames are Meshy's own, kept verbatim in `DOOR_HQ.catalogue`, URL-
encoded at load because one contains a `°`). Against the §5.3 list:
- **A. Tileables — all 8** (`aged_acoustic_ceiling_panel`, `aged_beige_office_
  drywall`, `aged_cracked_concrete`, `aged_oxblood_plaster_wall`,
  `aged_teal_metal_trim`, `mid_century_terrazzo_floor`,
  `muted_taupe_office_carpet`, `seamless_speckled_hallway_stone`).
- **B. Hero props** — globe lamp ✓, round table ✓ (`A_round_office_desk`),
  teal / office / folding chairs ✓, coffee table + oval conference table +
  two curved couches (bonus). **No `hq_cube`** → the cube is procedural (a
  black box with a canvas-drawn square-spiral emissive glyph on a rod).
  **Desk wedges ×3** (`one_45°_wedge_of_a_reception_desk`, two
  `wedge_of_a_round_office_desk`) — measured 2026-09-03 from the GLBs the
  user committed to the repo root (a node script rendered top / front /
  iso views and fitted the sector edges; see §9): the "reception wedge"
  is really a corner reception counter (curved banded front, raised
  ledge, 1.0 × 0.67 × 0.87 model units); wedge A is a solid kidney
  workstation; wedge B is a true 45.3° annular sector (outer r 1.075,
  inner r 0.398, arc centre 1.087 × depth behind the bbox centre). The
  user prefers the procedural dispatch ring, so `desk.mode` stays
  `'procedural'` and the wedges are furniture (`ring: {n, start}` props
  repeat wedge B around a spot).
- **C. Door leaves — 18**: the six office doors (warped closet, hollow
  core, office door, security, frosted, futuristic = L1–L6, wired to
  `DOOR_TEXT.CLEARANCE[i].door`, EXCLUSIVE since 2026-09-04), plus exit,
  wired double, shabby wood, suburban ×2, vault, portcullis, revolving,
  bulkhead, plain closet ×2, bare frame (the shared pool).
  No elevator leaf → procedural brushed pair with an X brace.
- **D. Dressing** — filing cabinet, round cabinet, lockers ×2, boxes ×2,
  CRT terminal, tube TV, desk lamp, table lamp, wall clock, extinguisher,
  vending machine, water cooler, plants ×2, wet-floor sign, fluorescent
  fixture, breaker panel, pipe run, 1 m railing (unused — railings are
  procedural), blank nameplate, desk fan, papers/pens/keys. No vent grille,
  bench, newel.
- **E. Closet kit** — cot, sink, mop, mop bucket, lockers, breaker, two
  round rugs ✓ (interior itself is Phase 2.7).
- **F. Training room** — round observation window only.
- **G. Characters** — none yet; D.O.O.R. agents are the *men in black*
  race's rigged models (black suits already), the avatar is the profile's
  most-played rigged vessel (falls back to the male agent).
- **H. Audio** — none; the hall is silent except `doorBuzz` on entry.

### 5.6 Assets for the Room Register (2026-09-07) — what Claude generates, what exists, what the user makes
**Claude generates (no art needed):** every board (tiles from the 160
terrain keys, the 59 board objects, the 28 procedural monuments plus new
lathe/extrude ones — chess pieces, organ pipes, a Möbius bar counter, a
barber chair, a punch clock, a gas pump), every setting (the `_nr*` kit),
every room shell (the box / rotunda / bay builders), all plates and signs
(CSS2D + canvas: neon text, card faces, stained glass via `_nrWindowTex`,
the calendar, the star-map), the walkable-Δ builder (7.2), the dailies.
**Already on R2, reused as-is:** the 32 door leaves (7.6 / 7.7 name one
per site; the HQ rooms take `leaf_cell` for 5150, `leaf_hospital` for
1111, `leaf_revolving` for the Foyer, `leaf_glass_exec` for 4C, `leaf_saloon`
for 711 and Club 27, `leaf_stall` / `leaf_bathroom` for the club's restroom
gag, `leaf_holographic` for 4D, `leaf_vault` for the Lodge, `leaf_hotel` /
`leaf_motel` for 13 / 21); the office kit (62 catalogue props, 52 GLB + 10 procedural — tables, chairs,
lockers, CRTs, lamps, plants, the water cooler, the vending machine, the
round observation window); the 8 DOOR tileables (drywall + carpet dress
5150 / 1984 / 4C); the roster's rigged race models (about 79 of the 96 races; the rest are sprites) as site NPCs and props (the
honda civic at the Gas Station, a gargoyle posed as a statue on the
Haunted House, the greys aboard the Mothership); the misc OBJ/GLBs (the
`Pyramid` = the Luxor, the `eyeball` = the Lodge's lamp, the street lamp);
the 6 ambience beds (`ambNight` + `thunderAmbience` for 13, `ambDay` for
1954, `ambCavern` for 33 / 451, `ambWindHigh` for 6 / 0) and the 33 music
keys (Club 27's jukebox).
**The user makes (Meshy, §5.2 export rules) — only the ONE hero prop per
place that procedural geometry will not sell, in the order the places are
built:**
| Place | Hero prop (🧊) | Procedural fallback meanwhile |
|---|---|---|
| 13 Haunted House | a chandelier + a grandfather clock; optional: a wrought-iron gate | a lathe chandelier; the kit's wall clock |
| 33 The Lodge | the twin pillars with globes (Boaz / Jachin) + the lectern | `column_*` objects + a `tablet` |
| 21 The Strip | a slot machine (instanced ×8) + a roulette table | none — the wave-1 board is the boulevard, not the floor; these dress the DEEP CROSSING later |
| 1954 Downtown | a collapsed-building chunk + a crushed car | a tilted `K.box`; the honda civic model, upside down |
| 6 Saturn | nothing | — |
| E4 Looking-Glass | the KNIGHT (a horse head on a base, ~2 m) | the other five pieces are lathe / extrude |
| 0 Singularity | nothing | — |
| 1717 Pirate Bay | a ship's wheel + a cannon (instanced) + a treasure chest | cylinders |
| 80 Colosseum | a lion statue or a chariot | none needed |
| 711 Gas Station | two gas pumps + a price sign | boxes + a canvas sign |
| 411 National Park | a tent + a picnic table | `_nrHouse` at tent scale |
| 432 Cathedral | the organ console | pipes are cylinders; the console is a tanker desk |
| 86 Cafeterium | serving counter, coffee machine, tray + food, a microwave | the reception wedge is the counter |
| 247 Clock Room | a punch clock + a large wall calendar (canvas) | a box with a slot |
| 360 Observatorium | the planetarium projector (the star ball) + a telescope | a lathe ball on a tripod |
| 1111 Medical | a gurney, an IV stand, a curtain rail | the cot; a pipe run |
| 5150 Padded Room | **`tex_padded_vinyl`** (the one new tileable) | `drywall_4` tinted |
| 1984 Interrogation | a metal table; an ashtray | the conference table; two folding chairs exist |
| 1287 Barbershop | a barber chair + a mirror | the office chair; a `leaf_glass` leaf laid as a mirror |
| 4C Corner Office | an executive desk + a leather chair | the tanker desk; the teal chair with the `leather` texture |
| 8 Infinity Pool | a lounger (instanced) | folding chairs |
| Fourier Foyer | nothing (the revolving door exists) | — |
**Audio the user could make (2.8 is still open):** a cafeteria clatter bed
(86), a slot-floor bed (21), a crowd murmur (80 / 1954 / 50), rain (13),
an organ drone (432), a lounge loop (Club 27), and the DOOR muzak everything
has been waiting for.
**Textures:** apart from `tex_padded_vinyl`, nothing — parquet (`wood`),
mosaic (`checkerboard`), casino carpet (`carpet_4`), pool tile
(`tilefloor_2`) and veined marble (`marble_2`) already exist in the
terrain set.

## 6. Guardrails (repeat every session)
- RULE #1: no new game .js files (§3.1 placement). `door-hq.test.js` is
  tooling and allowed.
- RULE #1b: any R2 .js/.css delivery ⇒ `?v=` bump + index.html in the same
  message. GLB/PNG assets cache-bust by filename.
- RULE #1c: no playtesting unless asked. `npm test`; `load-data.js` can
  evaluate `DOOR_HQ`; a node script can validate a GLB's JSON chunk
  (PLAYTEST_NOTES "Rigged 3D unit models") to check scale/pivot before
  wiring.
- RULE #2: the building never runs during a match; `state._hq*` is UI-only.
- Don't rename game words. The Shop is the Shop at the Quartermaster.
- The hub never uses the tile/voxel renderer or its shadow pass (§0).
- Every function keeps one physical home + the directory. A missing asset
  is a placeholder, never a missing interaction.
- Play → ranked stays ≤ 3 inputs (Play, skip loading, `Q`/dispatch).

## 7. What changed from rev 1 and why
Rev 1 proposed painted rooms first because it assumed a 2D-image asset
pipeline and over-read ROADMAP §4's battle-board draw-call numbers as an
engine limit. Both were wrong for this user: the assets are 3D, and the
draw-call problem belongs to the voxel board builder (per-tile meshes,
per-tile materials, no instancing), which the facility does not use. The
Guild Hub was the prototype; this plan is the building.

## 8. Open questions
- D13: walk as your vessel or as a DOOR officer avatar?
- Should other online players appear in the egress (silhouettes at the
  desk from `#mmOnlineCount`)? Rec: yes, cheap.
- Does the Guild Hub (Mystery Dungeon) get re-dressed as a DOOR field
  office, or is the "condemned crossing" door explanation enough? Rec: the
  door + a memo for now.
- Hazard Pay wallet on the strip vs only at the Quartermaster. Rec: strip.

## 9. Build log (append per session)

### 2026-09-04 (6.3 rev 2) — the Key pickup CELEBRATION; the emojis go
User feedback on rev 1: "Why not make like an animation with the glb keys?
i dont want god damn emojis infesting the game… like in mario 64 when you
find a star… max 3-5 seconds" — a rename alone was not the ask. Token
`20260904l-cors` → `20260904m-cors` (supersedes rev 1's l batch); files
data.js, battle.js, ui.js, hud.js, three-renderer.js, online.js,
profile.js, index.html. 113/114 green.

**The celebration (three-renderer.js `keyPickupFx(tx, ty)` + `keyFxWarm`,
exported).** A real 3D key rises out of the securing unit and spins in a
gold glow — total ~2.6 s, NON-BLOCKING (no camera move, no input lock —
Keys land mid-competitive-match, so it plays over live play): 450 ms pop-in
rise with overshoot + fast spin → 1650 ms hover (bob, slow spin, pulsing
gold PointLight, a sparkle drip every 240 ms) → 420 ms burst-out (spin-up,
shrink, 18-ember + flash burst). At spawn: a world-mode `shockwave` ground
ring + a 12-ember ring via ThreeVFX (same board-pixel convention as
`_spawnGroundPuff`). The mesh is the DOOR kit's OWN key GLB
(`DOOR_HQ.catalogue.key` = `Meshy_AI_a_key_…`, via `_loadMiscModel` /
`_miscModelInstance` span-fit to 0.5 tile; a flat-lying Meshy bake is
detected by its bbox and stood upright, then recentred so the spin axis
runs through it). Until the GLB is cached a chunky procedural gold key
(torus bow + hex shaft + two teeth, Lambert + emissive, cached geometry)
stands in — and `showBattleLoadingScreen` pre-warms the GLB whenever the
mode has Keys (`CONFIG.winHourglasses > 0`), so match one pickup one
normally shows the real model. Tick rides the frame loop next to
`_updateDeathTweens`; parent-check reaps fx across scene rebuilds.

**Wiring (RULE #2 done properly).** battle.js `playKeySecuredFx(x, y, n)`
(defined beside `_isTileVisibleToViewer`): devsim-suppressed, and
FOG-GATED VIEWER-LOCALLY — an enemy securing a Key inside your fog plays
nothing positional (the screen-level KEY SECURED banner still reports the
event, as before). Called from the one live collection site (the
inspect-scan collect, ~battle.js 43070). online.js wraps it
(host/recording emits `relay {type:'key-fx', x, y, n}`) and the guest
dispatcher re-runs it locally where the GUEST's own fog gate decides —
the followUnitFall pattern.

**Emoji purge (the game already had an emoji habit; the Key never joins
it).** data.js `createKeyIconDataUri()` draws a real 16×16 pixel-art key
(crispEdges SVG rects — bow ring, shaft, two teeth, highlight; same
rounded-box frame as the status icons) → `KEY_ICON_URI` +
`keyIconHtml(px)` (window-exported). It replaces 🗝 at: STATUS_DEFS
`hourglass` iconSrc (log badges/status rows), roster count, scoreboard
Keys row, trade-dialog row, the hidden-pickup dialog icon, the Arena
score tally row, the 3D nameplate KEY+n badge, and the two sidebar
held-count icons (index.html ships `.mini-hourglass` EMPTY; ui.js fills
the background once per element). Text-only spots use the word: floating
text `+1 KEY`, HUD chip `KEY+n`, banner `KEY SECURED!`; the 🗝 prefixes
came OFF the logs, the win message and the result label, and
`decorateTextWithIcons`' 🗝 rule was deleted (no emitters left).
Achievement catalog icons (Keyring/Locksmith) stay emoji — that catalog
is emoji-styled end to end and renders through React as text.
Pre-existing 🗝️ in Mystery Dungeon strings is MD flavor, untouched.

**Tune here:** `_KEYFX_RISE/_KEYFX_HOLD/_KEYFX_OUT` (450/1650/420 ms),
hover height `ts*1.05`, light color 0xffd070, sparkle cadence 240 ms —
all in the `keyPickupFx` block, three-renderer.js. Not verifiable here
(CDN blocked): the GLB's real orientation/texture — if the kit key spins
sideways, the bbox stand-up heuristic at `onDone` is the knob.

### 2026-09-04 (6.3 + 6.2) — hourglasses are Keys; the Cube gets its announcer
User: "let's do the keys. The towers are already cubes." (Story work — 4.1
case-file screen, 4.3 tape, 4.2 micro-scenes — is ON HOLD until the user
writes the outline; do not start it without them.) Token `20260904k-cors` →
`20260904l-cors`; files data.js, state.js, battle.js, ui.js, hud.js, map.js,
three-renderer.js, profile.js, index.html. `npm test` 113/114 green (server
smoke skips).

**The rule (B1's Hazard Pay precedent).** Player-facing text/icons only.
Code identifiers are UNTOUCHED and must stay: `state.hourglasses`,
`unit.hourglasses`, `hourglassBuff`, `winHourglasses`, `hasHourglasses`,
`hourglasses_collected`, the `hourglasses` / `wins_hourglass` achievement
metrics (hqKeys reads them), SFX keys `playerHourglass`/`enemyHourglass`,
CSS classes `.hourglass-text` / `.mini-hourglass`, XP/GOLD constants, the
STATUS_DEFS key `hourglass`. Time-semantic ⏳ stays ⏳ (cooldowns, END OF
ROUND, WAITING FOR OPPONENT, Opponent's Turn, the TIME desk stamp).

**What changed (🗝 everywhere a player reads it):**
- data.js: STATUS_DEFS.hourglass → icon/glyph 🗝, short KEY, label Key
  (same gold palette); the status blurb; achievements renamed 'Sands of
  Time'→'Keyring' ('Secure Keys') and 'Timekeeper'→'Locksmith'; Plunder
  desc; masteryLabels HOURGLASSES→KEYS and TOWER→CUBE.
- battle.js: pickup banner '🗝 Key Secured!' + float '🗝 +N' + 'Key Charge
  Lv.N' (was Temporal Buff); inspection/scanner logs ('Key resonance', 'A
  Key is very close!'); scatter/materialize/reset logs; result-screen
  label '🗝 Keys Secured' + details row 'Keys'; Arena intro + composite
  breakdown + sudden-death line; plunder log; the Keys win message is now
  '🗝 THRESHOLD STABILIZED — Player N secures every Key!' and (6.2's last
  piece) the Cube win is '⬡ THRESHOLD CLOSED — Player N destroys the
  enemy Cube!'; decorateTextWithIcons converts 🗝 (was ⏳) and the log
  colorizer highlights capital-K Key/Keys (was any-case hourglass; capital
  only, so prose "key" never lights up); the FIELD MANUAL loading hint.
- ui.js: roster 🗝N, scoreboard 🗝 row, objective label 'Keys · … · Win by
  Cube Destruction', Inspect/Hint/Keys help text, hidden-pickup dialog
  (🗝, 'Something orthogonal is buried here.'), trade dialog row
  Key/🗝 + trade logs, CPU-difficulty blurb (Cubes/Keys).
- hud.js + three-renderer.js: the ⏳+N chip/badge → 🗝+N 'Key Charge'.
- map.js: Arena mode desc (Cube/Keys), the drop log, the HQ strip Keys
  tooltip ('recovered in the field'), the in-tray KEYS row sub FIELD, and
  RECENT CASES chips now print masteryLabels (KEYS, CUBE) instead of raw
  win-condition ids.
- profile.js: achievements category '🗝 Objectives'. index.html: the two
  sidebar mini-hourglass ⏳ → 🗝 (class name kept).

**Parity (RULE #2):** every changed string renders locally on both clients
from the same file version — no relay surface touched. Mismatched client
versions during the rollout window would just read differently; harmless.
**Not done / later:** no 3D Key model exists because loose hourglasses
never had a board model either (they are hidden pickups — logs, scans,
banners); if a visible pickup model ever lands, it lands as a Key. 6.4
(Nexus → double Cube damage) still awaits the user's engine call.

### 2026-09-04 (6.1a) — the walkable Training Room ships
User: "Let's build the walkable training room inside the facility." Token
`20260904j-cors` → `20260904k-cors`; files data.js, three-renderer.js,
map.js, index.html; doorhq.test.js +1 (114 total, 113 pass, server smoke
skips). No mid-match surface → no relay work (RULE #2); the room is
single-player and local like the rest of the building.

**The room (data.js `rooms.training`).** The egress TRAINING FACILITY door
(180°) now opens into the second `kind: 'box'` room: 20 × 20 m, 5 m
ceiling (the 8×8 grid is 14 m at 1.75 m per battle tile + 3 m of walkway
each side), concrete floor / stone walls / oxblood dado / teal trim.
`fx: 'training'` on the room + `shell.grid: {cells: 8, cell: 1.75}` are
what the renderer reads. Doors: the way out is CENTRED ON THE NORTH WALL so
the pit's barrier gap lines up with it (in from the egress, straight onto
the grid; `at` round-trips both ways); the south gap door is the CHALLENGE
RANGE (`_goToCampaign`, the wired institutional double); the east wall has
the CONDEMNED CROSSING (`_goToMysteryDungeon`, the shabby wooden door,
"somebody keeps oiling the hinges"). The egress door's alt/alt2 shortcut
buttons are GONE — the facility is those functions' physical home now
(guardrail: one physical home + the directory). Props: the tanker desk on
the west wall wearing the signature CRT + rotary phone + papers is the
RANGE console's body; the VHS CRT (tube_tv on a crate, aimed at the grid)
sits beside it for 4.3; observation window, two clocks, extinguisher,
water cooler, lockers, folding chairs, wet-floor sign standing over the SW
crack, two ceiling fluorescents. Two agents watch the grid (one is timing
their break); up to three roster vessels spawn — two of the spots are ON
the grid, sparring.

**The pit (three-renderer.js `_hqBuildTrainingPit`).** Runs after
`_hqBuildBoxShell` when `room.fx === 'training'`; metres × U in the room
frame, reusing the 6.1b enclosure vocabulary and its canvas caches
(`_hzTex('training_floor')` slabs — the data-URI terrain, no CDN;
`_hzLineGridMesh` seams + corner lights; `_hzScorchTex` / `_hzCrackTex`
multiply decals with toneMapped off; `_hzStripeTex` hazard plates;
`_hzTextTex` A–H / 1–8 and the four signs, same copy, shifted off the
doors that now occupy the wall centres). The grid is FLUSH with the floor
(rev 3's no-moat rule): what fences it is the maroon barriers (yellow lip,
posts, breathing red lamps) with gaps at the N/S doors. New collision:
barrier segments push RECT blockers (`rect: {hw, hd}`) that `_hqSurface`'s
box branch now understands — the pit is really fenced, the gaps really
admit you, and you can walk every cell. Overhead: glass observation booths
on the W/E walls at 2.4 m (desk, glowing screen, inner light — never
reachable), corner machinery (drum + crate + wall pipe + red lamp, disc
blockers), seven red wall lamps, eight fluorescent strips, four point
lights over the grid (the box-room lighting alone was sized for a closet).
Pulses live in `_hq.fxPulse`, ticked by `_hqTickWorld` — the battle
`_hzGlowPulse` list never runs under the HQ loop. Also: `_hqGoTo`'s
box-counter branch now stands you in FRONT of a counter that declares
`face` (the office in-tray keeps its old south-side behaviour).

**The console (map.js).** Counter overlay `training` → `_hqTrainingHtml`:
the tape label ("D.O.O.R. ORIENTATION · TAPE 1 OF 1 · 1987 · BE KIND,
REWIND", "please do not turn around"), ORIENTATION ▸ TRAINING ROOM · 4v4
and PRACTICE ▸ HOLO SIM · 4v4 (`data-range`), NOTED. `_hqLaunchMission`
takes `o.roster` now: `[]` = nothing pinned (`_msConfirm` only pins a
non-empty roster), so both launches draw a free CPU pool instead of
`hqMissionPool`'s biome-neighbour padding — they are INTERNAL, no site
file, no mastery, no Code Red. Post-match you re-enter the training room
standing at the console (`doorId: 'range'` rides the existing
`_hqLastDoor` plumbing; `goTo` handles box counters). **Decision recorded:
the Holo Sim's purpose is PRACTICE** (the §9 6.1b open question).

**Tests (doorhq.test.js +1).** The generic box-room checks picked the room
up by themselves (panels fit, props inside walls, mounts clear the
ceiling, lit by a fluorescent); the new test pins the contract: fx +
8×8 grid + ≥2 m walkway, the egress door round-trip through `at`, the
way out / challenge doors centred on the barrier gaps, no rank leaves, no
leftover alt/alt2 shortcuts, the RANGE console at the tanker desk with the
tube_tv present, and both launch ids present as `isDelta + facility` rows.
One data fix the suite caught: the challenge door needed `wide: true` to
agree with its double leaf.

**Could not verify here (CDN blocked):** the kit GLBs in the room (the
observation window's first-ever placement — if it faces the wall, flip its
`rot`), texture read on the walls vs the slab grid, booth glass against
the fog. First things to eyeball live: (1) walk in from the egress —
straight through the gap onto the grid; (2) barriers block everywhere but
the two gaps; (3) E at the console → ORIENTATION lands match select on
TRAINING ROOM, PRACTICE on HOLO SIM, and the CPU roster is NOT pinned
(different races per reroll); (4) post-match you stand at the console; (5)
the sparring vessels on the grid; (6) sign / lamp / clock placement (all
single numbers in `_hqBuildTrainingPit` / the props table).

**Next (in order):** 4.1 the case-file screen; 4.3 the orientation tape
playing on the VHS CRT before ORIENTATION's first run; 6.3 Keys wording;
§3.9 the layout editor; gamepad; 4.2 the desk micro-scene.

### 2026-09-04 (rev 3 of the Training Room) — the room was there all along; the slab floor
User (with a live capture): "still don't really know what's going on with
the training room and why all the outer stuff is invisible… I don't like
the texture you chose for the tiles… refer to the build plan and the
reference images before moving on to the walkable version." Token
`20260904g-cors` → `20260904h-cors`; files three-renderer.js, sprites.js,
data.js, map.js, index.html; `npm test` 113/113. Verified with a headless
render of the real match (this environment blocks the CDN, so every
script was served from the repo and R2 sprites/textures were absent —
flat colours, no units — enough to see the enclosure and the new floor).
- **Root cause of the "invisible" room: the retro fog.** The enclosure was
  fully built (headless census: the same 217 pieces, correct positions,
  Lambert + sun/hemi/ambient all present). But `_applyHorizonFog` injects
  the per-fragment HORIZON-ALTITUDE fog (`_injectHorizonFog`) into every
  material under `_horizonGroup`, and the pause-menu retro fog is ON by
  default (three-post `_retro.fogEnabled`, uFogAmount ≈ 0.98). That fog is
  keyed on the view ray's altitude — anything below the horizon line
  dissolves ~95% into the fog colour — and the whole room stands below the
  horizon at the board's rim. So walls, walkway, barriers and booths were
  drawn as 5% ghosts over the (also fogged) dome: exactly the faint slanted
  quads in the capture. Fix: near builders now run through
  `_hzRunNearBuilder` into a `facilityNear` sub-group and every material
  they make is tagged `_ew_hzNear`; `_applyHorizonFog` skips those (no
  injection, no forced `fog:false`), so lit pieces haze with the board
  through ordinary `scene.fog` and the additive glows / sprites stay
  unfogged as they declare. The map's own env fog (0.22) never touched the
  room either way. Holo Sim's apron gets the same exemption.
- **The floor: `training_floor`, a new terrain.** The reference grid is big
  flat plaster-concrete slabs with a dark grout rim, not cobbles.
  sprites.js `_mkTrainingSlabURI` draws one 256² slab into a canvas at load
  (seeded — identical on every client): warm plaster `#bca98a`, soft
  light/dark stains, elongated damp patches, fine grain, a few pale
  scuffs, a vignette, a 3px grout rim with a bevel highlight top-left and a
  shadow bottom-right. `TRAINING_SLAB_URI` feeds `TERRAIN_SPRITES.training_floor`
  (falls back to concrete_floor.png without a DOM). Registered like the
  holo floors: TERRAIN rule (Training Slab / TRN), EW_TERRAIN_COLORS,
  MF_TID and map.js ME_TERRAIN_IDS (append-only, index-for-index), the
  editor's Floors palette. `prebuilt_training` now builds on it and drops
  the old concrete tint.
- **Perimeter texture.** Follow-up in the same session: the walkway ring and
  the walls had still been wearing concrete_floor.png; per the user they now
  use `tilefloor` (R2 terrain folder) — one `_hzTex` key in `_hzTrainingRoom`.
  Token → `20260904i-cors`.
- **Decals.** The scorch stars showed as dark translucent SQUARES: a
  multiply plate's white base is tone-mapped below 1.0 by the exposure
  grade. Decal materials are now `toneMapped = false`. Two crack decals
  (`_hzCrackTex`, branching random walks) lie in the NE and SW corners like
  the reference. Seams, corner lights, everything else unchanged.
- Camera note for 6.1a: the default battle camera sits INSIDE the room's
  footprint above the wall tops; only very low tilts put a wall between
  the camera and the board, and even then it clips the bottom of the frame,
  not the grid — no cutaway needed.
- **Unverifiable here:** textured walls / booths / units (R2 blocked). First
  thing to eyeball live: wall brightness vs the floor, and whether the slab
  should be warmer or paler under the sun grade (one hex in
  `_mkTrainingSlabURI`).

### 2026-09-04 (later) — 6.1b + 6.1c: the Training Room and Holo Sim boards
User: brainstorm on the 8×8 training room ("can the map BE the room, with
the lava layers underneath? a facility-style renderer, or keep the voxel
engine?"), then "continue building the board… build both of them as two
distinct things… both maps should become selectable in match select",
with four new phone captures of a Tron-style holographic floor as the
second reference. Decision recorded: **keep the voxel engine** — what makes
the facility read better is textures, lighting and props layered on plain
boxes, all of which can be added per map; a second map renderer would mean
re-implementing fog, highlights, decals, water, buildings and every camera.
`npm test` 113 (112 pass, server smoke skips), cache token
`20260904e-cors` → `20260904f-cors`. Files: data.js, sprites.js,
three-renderer.js, map.js, index.html; delta-maps.test.js, doorhq.test.js;
this file, DOOR_MASTER Part D. No mid-match surface → no relay work (RULE
#2): maps, env presets and the new terrains are data both clients load.

**How they register (data.js `EW_FACILITY_BUILDERS` / `EW_FACILITY_META` /
`_mfRegisterFacility`, after `_mfRegisterAll`).** Each is built with
`_mfDeltaNew` (so it gets the shared lava → cave → cave wall → dirt → dirt
bed under a z5 surface, the Δ spawn rows, the centre nexus and
`finishDelta`'s protections) and pushed onto `EW_MAP_META` as a row with
`isDelta: true, facility: true, teamSize 4, tier 3`. That one flag does the
rest: state.js generates the GAME_MODES entry and puts them in every
online mode's `compatibleMaps` (not Gauntlet); map.js MS_MAP_LIST lists
them as `8×8 Δ` after the 29 Δ boards; match-select shows them under the
default Δ filter with their own SITE_FILES (INTERNAL / SIMULATION, grey
stamps); everything that means "a site" (`hqMissionPool`, mastery, the
sector partition, threshold leaves, Code Red) already filters on
`!isDelta`, so the building ignores them. The ranked `MAP_POOL` in
server.js is hand-maintained and untouched, so they are never queued.
Tests: delta-maps.test.js validates them under the full house rules (bed,
symmetry, protected tiles, two disjoint routes) minus the cover minimum for
`facility` rows (the Training Room is an empty grid on purpose); the
roster tests count 29 + 2; doorhq.test.js's "launch map" is now `!isDelta`
like every other check in the file.

**prebuilt_training — the board.** `concrete_floor` tinted warm
(`#cbb99a`), flat, nothing on it. Everything else is the new
three-renderer `training_room` scenery theme (a NEAR builder — see below):
`_hzBoardSeams` draws the lit seams at each tile's own height plus a bright
light at every grid corner (one additive vertex-coloured mesh), four scorch
stars are multiply-blended canvas decals; a walkway ring of thin concrete
slabs meets the board edge (rev 2: no moat — the player only sees the
tops, covering the board's sides is fine); row letters A–H and column numbers 1–8 lie on the walkway; maroon
pit barriers with a yellow lip, posts and pulsing red lamps line the rim
(door gaps N/S); the four walls are double-sided planes running from the
bed's floor to 3.2 tiles above the room floor (dado + upper panel + teal
trims + two fluorescent strips each) — rev 2 dropped the inward-only
"dollhouse" culling: nothing pops as the camera moves; N/S double doors with a dark
reveal, lit window slits, lintel and a pulsing green lamp; hazard-stripe
plates on the walkway in front of them; observation booths off the W and E
walls (glass, frame, desk, screen, interior glow); corner machinery (drum,
console, wall pipe, crate, red lamp) in all four corners; wall clocks on
N/S; eight red wall lamps; four canvas-text signs (ORTHOGONAL GEOMETRY
EXPOSURE AREA · AUTHORIZED PERSONNEL ONLY / D.O.O.R. TRAINING FACILITY ·
ROOM 8×8 · REALITY LEAKS POSSIBLE / MAX OCCUPANCY 45 MINUTES / REALITY
LEAKS POSSIBLE). Lit pieces are Lambert (they share the board's sun and
hemisphere light, not the far scenery's day/night grade). Env: near-black
dome, no stars, light fog, `scenery: 'training_room'`, no far roster.
Headless census (real three r128): 185 meshes + 32 sprites, ~3.9k tris.

**prebuilt_holosim — the board.** Two NEW terrains, `holo` and `holo_red`
(TERRAIN rules, MF_TID 158/159 mirrored into map.js ME_TERRAIN_IDS — which
already carried `swamp`/`oil` at 156/157 that MF_TID lacked; both lists
now agree index-for-index — EW_TERRAIN_COLORS, the editor's Floors
palette). Their textures are 128² pixel-art PNGs embedded in sprites.js as
data URIs (`HOLO_TILE_URI`, `HOLO_RED_TILE_URI`: a dark navy plate with a
cyan rim and a faint sub-grid; a red twin with a warning triangle) — nothing
to upload, `_ewCorsBust` ignores non-CDN URLs. three-renderer
`_EMISSIVE_TERRAIN` gives those keys the tile texture as an emissiveMap in
`buildBoxMaterials`, so only the rim pixels glow and bloom while the plate
stays dark (sides too, so a riser is a glowing wire cube). The board: two +1
holo risers, flat otherwise — rev 2 removed the permanent red cells: the
red warning square is the DELAYED-ATTACK telegraph (below), not terrain;
`holo_red` stays registered as an editor terrain. Env: black dome with strong stars, `scenery: 'holosim'`,
density 1.2. The `holosim` theme = a far roster (`_hzHoloRing`: thin
additive tori with a chromatic twin, tumbling; `_hzHoloMonolith`: dark
slabs wearing glowing ring glyphs and edge lights; `_hzAstralOrbs`) plus
the `_hzHoloApron` near builder: the projected grid continues five cells
past the board and fades into the void (per-vertex brightness, one mesh),
corner dots, and four faint projector beams rising from the board corners.
The obsidian sacred-ring haloes that every map gets are skipped for both
facility themes.

**Renderer plumbing.** `_HZ_NEAR_BUILDERS = { training_room, holosim }`;
`_buildHorizonScenery` runs the near builder after the `'none'` early-out
— alone when the theme has no roster (indoors), after the roster scatter
otherwise — inside the same `_horizonGroup` / key cache, so it rebuilds
with the map and disposes with it. Helpers: `_hzLit` (Lambert), `_hzTextTex`
(cached canvas plates), `_hzStripeTex`, `_hzScorchTex`, `_hzLineGridMesh`,
`_hzBoardSeams`. Kill-switch `window.EW_NO_FACILITY_SCENERY = true` (bare
boards). Known soft spots: seams are drawn at the heights the board had
when the scenery was built (a terrain spell that raises a tile buries its
seams — harmless); `_rerollMapForNextMatch` (battle.js) rotates Δ boards
among ALL `isDelta` rows, so "Find Next Match" can land on a facility
board (left as is — cheap to exclude on `facility` if unwanted); the
match-select size chip still reads "Δ map · hand-authored 8×8 board" for
them (cosmetic, match-select.js untouched).

**First-run checklist for the user:** (1) Play → any bay or Back → match
select: the Δ list ends with TRAINING ROOM (stamp INTERNAL) and HOLO SIM
(stamp SIMULATION); their site files read; VS CPU launches both; (2)
Training Room: warm concrete, lit seams with a light at every corner, four
scorch stars, A–H / 1–8 on the walkway, maroon barriers with red post
lamps, the N/S doors with green lamps, the four signs legible from the
default camera, booths W/E, drums in the corners, clocks; orbit low and
outside the walls — the room stays solid, nothing pops;
(3) Holo Sim: black starfield, dark cells with glowing cyan rims (bloom),
two wire-cube risers (no red cells), the apron grid
fading out past the board, four faint beams at the corners, neon rings and
dark monoliths drifting far out; (4) map editor → Floors: Holo Floor /
Holo Warning paint and play-test; (5) a friendly online room offers both
maps and the guest sees the same scenery (data-driven); (6) report scale
(walls too tall / low vs units?), seam brightness, lamp glow, sign
legibility, booth glass — all are single numbers in `_hzTrainingRoom`.

**Next (in order):** 6.1a the walkable Training Room (box room, the pit as
geometry, ORIENTATION counter → `prebuilt_training`); decide the Holo Sim's
purpose (rec.: PRACTICE from the Training Facility door — free loadout
testing vs CPU, no stamps); 4.1 the case-file screen; 6.3 Keys wording;
§3.9 the layout editor; gamepad; 4.2 desk micro-scene.

### 2026-09-04 (Phase 3 close) — Code Red, Keys, the promotion moment
User: "continue with the DOOR master doc and the HQ build plan". Next in
the standing list were 3.3 → 3.2 → 3.4; all three shipped, so **Phase 3
is complete** and every §3.5 lamp state is now reachable. `npm test` 113
(112 pass, the server smoke skips without node_modules; doorhq.test.js
+8, three older checks updated for the new rules). Cache token
`20260904c-cors` → `20260904d-cors`. Files: data.js, map.js, battle.js,
three-renderer.js, audio.js, styles-base.css, index.html, doorhq.test.js.
No mid-match surface → no relay work (RULE #2); everything reads the
local profile.

**3.3 Code Red (data.js `hqCodeRed`, `hqCodeRedPool`, `hqToday`,
`hqHash`, `DOOR_HQ.codeRed`).** Once a day one STABILIZED threshold goes
wrong. Candidates = the profile's mastered launch maps in unlocked sectors
(nothing is reported until at least one lamp is green — a Code Red is a
green door misbehaving); the pick is `hqHash(localDate | employeeNo |
'codered') % candidates`, so it is the same all day and different
tomorrow. The out-of-place entity is a race whose POINT OF ENTRY is some
OTHER site and never one of this site's natives (rigged-3D filter when
the sprite table is loaded, like `hqMissionPool`). `doorSiteState`
returns `codered` for that site's threshold AND its bay door in the
egress (the strobe already existed in the renderer; the plate chip reads
CODE RED) until `door.hq.codeRed = {date, site, race, cleared}` matches
today. Flow (map.js): the strip grows a strobing **CODE RED · SITE**
pill (`#hqCodeRed`, click → the brief overlay with WALK / ENTER THE BAY);
the threshold panel and the bay-door row carry the brief + **RESPOND ▸
CROSS · ENTITY PINNED** (`data-codered`); `_hqLaunchMission` treats ANY
launch onto the Code Red site today (CROSS, DEEP or RESPOND) as the
response: it builds the roster from `hqCodeRedPool` (the entity
first, `natives = 1`, so `randomizePartyIdentities` always draws it,
then the site's own pool) and sets `window._hqCodeRedRun = {date, site,
race, label, bonus}`; `_msConfirm` keeps the marker only while the
launched card is still that site, `_msBack` / `_goToVsCpu` / any
`_hqEnter` clear it. **audio.js `doorbell`**: a household ding-dong
(E5→C5, bar-chime partials) rung twice, the second a little harder and
flat — plays 1.4 s after entering the egress from Play or a return, once
per Code Red per session (`_hqBellRungFor`), never on room-to-room walks;
file override key `doorDoorbell`. **battle.js commit**
(`commitAchProgress`, after the mastery flag): a WIN with the marker on
the same site + date writes `door.hq.codeRed` cleared, bumps
`door.hq.codeRedsCleared`, `creditLocalGold(200)` (local mirror, like
tier gold) and sets `window._lastHqCodeRed`; `_stampHqSite` shows
**CODE RED CLEARED · SITE · 💰 +200 HAZARD PAY** (red tag) in place of
the mastery tag. The marker is consumed win or lose. Renderer:
`HQ_DOOR_LOCKED` drops `codered` — the breach door opens for the
responder. Dev: `?codered=<mapId>` (or `DOOR_HQ.codeRed.force`) puts it
on any site with no mastery.

**3.2 Keys (data.js `hqKeys`, `hqKeysShort`, `DOOR_HQ.keys`).** Keys are
hourglasses (MASTER A9): `keys = pickups + issued`, pickups = the
`hourglasses` achievement counter summed over pvp / cpu / legacy
(monotonic, already synced), issued = `door.hq.keys` (story grants, none
yet). `requiresKeys` on a door → `clearance` (red) while short, on top of
`minClearance`: the **elevator asks 12**, the **Bureau of Continuity
24** (both still rank-gated too; thresholds and bays never ask — a test
enforces it). The strip shows **KEYS n** (`#hqKeys`), the in-tray has a
KEYS SECURED row, the panel's disabled button and note say exactly what
is short (`_hqGateLabel` / `_hqGateText`: "CLEARANCE L4 + 12 KEYS
REQUIRED", "12 KEYS REQUIRED · 9 SHORT"). Engine-side "Keys" wording on
the pickups (6.3) is still open.

**3.4 the promotion moment (map.js `_hqCheckPromotion`,
`_hqNoticePanelHtml`, `window._doorPromote`).** Nothing in the game
promotes yet (that is the story track, 4.1); what shipped is the
building's reaction so any writer of `door.clearance` gets the ceremony
for free. On every non-walk entry: if `doorClearance(p).level >
door.hq.seenClearance` → ~1.7 s after entry (the load card is gone)
`paChime`, then 1.5 s later the **PERSONNEL NOTICE** panel (kicker
EFFECTIVE IMMEDIATELY · canon date, the new title large, "CLEARANCE L2 ·
FORMERLY L1 DOORMAT", a thunking PROMOTED stamp, the memo line naming
the new leaf, SEE THE DOOR ▸ YOUR OFFICE / YOUR CARD / NOTED) with a
`stamp` thunk; `door.cardStamps` gains `{word:'PROMOTED', ink:'admit',
note:'L2 · DOORSTOP · <canon>', kind:'promotion', level}` (the card back
already renders these); `seenClearance` is saved. A profile seen for the
first time is acknowledged silently at its current level (no ceremony
for legacy L1s). The leaf itself needs no work: scenes rebuild on enter
and `rankDoor` doors already wear `doorClearance().door`. Dev / story
hook: `window._doorPromote(3)` → KNOCKER, re-enters the egress when it is
open so the notice plays.

**First-run checklist for the user:** (1) `index.html?codered=prebuilt_
mars` → Play: the doorbell rings ~1.4 s in, the strip shows CODE RED ·
MARS strobing, BAY 4 · CELESTIAL's lamp strobes; (2) click the pill: the
brief names an entity and its point of entry, WALK TO BAY 4 works; (3) E
at Bay 4 → the row for Mars reads CODE RED with RESPOND ▸ Δ; ENTER THE
BAY → the Mars threshold strobes, its leaf still opens as you approach,
its panel leads with the red brief; (4) RESPOND: match select is
pre-filled on Mars Δ, and after CONFIRM the CPU party's first unit is the
named entity; (5) win it: the result stamp carries CODE RED CLEARED · 💰
+200, the wallet grew by 200 beyond the match, and back in the building
the pill reads CLEARED (green) and Bay 4 is green again; a LOSS leaves it
strobing and RESPOND re-arms; (6) `?codered=` off, with a real mastered
site the Code Red only appears once a threshold is green; (7) Keys: the
strip's KEYS count equals your hourglass pickups on the achievements
page; the ELEVATOR panel's disabled button reads CLEARANCE L4 + 12 KEYS
REQUIRED; (8) console `_doorPromote(2)`: chime → PERSONNEL NOTICE
DOORSTOP → PROMOTED stamp → the office door is the hollow-core leaf;
`_doorPromote(1)` puts it back (no notice for a demotion).

**Next (in order):** 4.1 the case-file screen proper (SP meter,
`DOOR_TEXT.CHAPTERS`, `promoteTo` → `_hqCheckPromotion`, memos,
commendations — Code Red clears and stabilized counts are the first
two); 6.3 Keys wording on the hourglass pickups + THRESHOLD STABILIZED;
§3.9 the in-game layout editor; gamepad in the hall; a first-visit
micro-scene at the desk (4.2); the training room (6.1) as the next box
room. Open: should a Code Red ALSO pay SP once the meter exists (yes,
rec. +5); whether Code Red should pick among UNSTABLE sites too once a
profile has stabilized ≥ 6 (rec. no — the joke is the green lamp).

### 2026-09-04 (batch 2) — fourteen more leaves, the whole rank ladder moves
User uploaded the wishlist to `/doors` (14 GLBs, all single leaves, one
mesh, unit-scaled, no frame except the hell arch). Parsed + rendered
offline; hinge side read from the handle. `npm test` 104 pass. Cache
token `20260904b-cors` → `20260904c-cors`. data.js only.
- **Catalogue +14**: barn .684 · saloon .572 · frosted_single .480 ·
  stable .516 · bathroom .387 · stall .588 · cell .709 · hell_arch .734
  (static, frame) · glass .439 · glass_exec .487 · holographic .609
  (slide) · hospital .498 · hotel .508 · motel .533. `leaf_frosted` (the
  pair) lost its rank and joined the pool.
- **L5 GATEKEEPER = `leaf_frosted_single`** — six of six rank doors now
  open (L1–L5 swing, L6 slides).
- **Re-homed**: reception → glass, medical → hospital, engineering →
  glass_exec, bay_quarantined → cell; thresholds nuketown → motel,
  skinwalker → stable, bohemian_grove → saloon, babel → barn, cyberpunk →
  holographic, heaven → hotel, hell → hell_arch (single opening, the dark
  plate shows through the arch). Unassigned pool: bathroom, stall,
  suburban, closet, closet_alt, shabby_wood, frosted pair.

### 2026-09-04 (later) — doors fit their frames, rank leaves exclusive, doors open
User: doors were different sizes, did not fill their frames or looked
awkward; the 18 GLBs were committed to `/doors`. Parsed + rendered offline
(one mesh each, unit-scaled, no animation). `npm test` 104 pass. Cache
token `20260904a-cors` → `20260904b-cors`.
- **Measured catalogue** (data.js): every leaf has `aspect` (W/H from the
  GLB bbox), `wide` (opening class — THE LEAF DECIDES), `yaw: 90` on the
  hollow-core door (authored edge-on), `open: 'swing' | 'slide'` +
  `hinge`, `frame` (jambs baked into the mesh — informational) and `rank`
  (1–6, exclusive). Aspects: closet_warped .604 · hollow_core .545 (after
  yaw) · office .490 · security .686 · frosted .785 · futuristic .547 ·
  closet .454 · closet_alt .477 · exit .451 · shabby .525 · suburban .433
  · suburban_house .453 · wired_double .908 · vault 1.0 · portcullis .846
  · revolving 1.143 · bulkhead 1.0 · frame_only .637.
- **`_hqBuildDoors`** (three-renderer.js): opening width = aspect × opening
  height, clamped (single 0.95–1.6 m, wide 1.9–2.5 m); the panel (2.5 /
  3.3 m) is unchanged so the jambs absorb the difference. The leaf is
  height-fitted then X-stretched the last few percent (`g.scale.x`), Z
  scaled with it. A `swing` leaf hangs on a hinge pivot at the jamb edge
  and opens ~83° TOWARD the walker (behind it is the wall); a `slide`
  leaf rides a carrier into the `hinge`-side jamb with a world-space
  `THREE.Plane` clip at the jamb edge (`renderer.localClippingEnabled`),
  cloned materials so the plane never leaks to the same model on another
  door. The elevator halves pocket the same way. `rec.ow` (real opening)
  drives `_hqFindTarget`'s box-room reach.
- **`_hqTickDoors`**: the current interaction target opens (ease in-out,
  ~0.5 s) and closes when the target changes; `sealed` / `clearance` /
  `codered` stay shut. Static leaves have no `motion`.
- **Re-homed doors** (rank leaves freed): reception → closet_alt, medical
  → closet, engineering → suburban, continuity → suburban_house, bay 4 →
  bulkhead, bay 3 → wired_double, bay 6 → exit; thresholds area51 →
  closet, cern → bulkhead, vatican → closet_alt, technoticlan → portcullis,
  cyberpunk → closet (single now), heaven → suburban_house, hell →
  bulkhead (wide now), flatlands → frame_only. `hqBayRoom` fallback →
  `leaf_closet_alt`. L3 KNOCKER = `leaf_office`.
- **doorhq.test.js +3**: measured aspect / legal motion per leaf; rank
  exclusivity (+ at least four rank doors move); door `wide` flags agree
  with the leaf; the revolving door stays sparing.
- **Asset wishlist** (handed to the user): a SINGLE-leaf frosted executive
  glass door (so L5 can swing), a motel/hotel room door with a number
  plate, a hospital ward door with a porthole, a rusted steel hatch that
  is a leaf only (no ring), a saloon/lodge door, a cell door with a slot,
  a barn/stable door — all as ONE leaf, NO frame, hinge edge flush, front
  face +Z. Avoid doubles, sliders and anything with the frame in the mesh.

### 2026-09-04 — closet polish: the rug lies flat, the sink hangs at waist height
User (with a screenshot): the round rug stood on edge and the sink was
bathtub-sized on the floor. `npm test` 101 pass. Cache token
`20260903e-cors` → `20260904a-cors`.
- **Sink** (data.js catalogue): was `h: 0.85` — a height fit on a shallow
  basin scaled it to ~3 m wide. Now `span: 0.75, mount: 0.60` (underside;
  rim ≈ 0.85 m, the shelves above it at 1.55 / 2.0 clear it) with the new
  `block: true` so it keeps its `foot` blocker even though it is mounted.
- **Rugs** (data.js catalogue): `rug_round` / `rug_office` get `lay: true`;
  `rug_round` span 1.8 → 1.5 for the closet.
- **three-renderer.js `_hqPlaceProps`**: catalogue `lay` — after the GLB
  fit, the thinnest bbox axis is turned upright (z-thin → tip back on x,
  x-thin → tip on z, already-flat → no-op) and the group re-seated on the
  floor with a 4 mm lift against z-fighting. Catalogue `block` forces the
  floor blocker regardless of `mount` / `ceil` / `y`.
- Could not verify the GLB bboxes (cdn.entropywars.net is blocked from the
  agent): the sink `span`/`mount` are eyeballed from the screenshot — tune
  `mount` (0.55–0.65) and `span` (0.65–0.85) in place if the rim is off.

### 2026-09-03 — Phase 2.7: the janitor's closet (the first interior, the first box room)
User: "continue with the build plan". `npm test` 102 (101 pass, the server
smoke skips without node_modules); 3 new checks in `doorhq.test.js`.

**The room (data.js `rooms.office`).** YOUR OFFICE is the first room with
right angles: `kind: 'box'`, a Cartesian frame (x east, z south, metres
from the room centre), 5.6 × 4.6 m, 3.4 m ceiling (door panels are 3.5 m
to the plate, so box rooms clamp the lintel / cap / lamp under `h − 0.25`
— a lower ceiling still works). Doors and wall props name a `wall`
(`n | e | s | w`) and the spot along it (`x` on n / s, `z` on e / w); free
props sit at `x, z` and `face` the heading their front points (deg cw
from north); `rot` is extra yaw as before. Layout after
`janitor_closet_v1`: the way out on the west wall (z −0.5) with the
cleaning shelves beside it; the north wall left → right: hook rail with
the broom and mop under it, the sink under two shelves of bottles, the
breaker panel, the tanker desk (CRT, rotary phone, desk lamp, papers,
pen, notebook, two clipboards above), the vent; the east wall: the locker
(toilet paper on top), the cot, a shelf with the desk fan; the south wall:
the clock, the extinguisher, boxes; the floor: mop bucket by the sink,
the drain, the round rug; one fluorescent. Spawn just inside the door
facing east. No NPCs (it is your closet).

**Procedural props.** Catalogue entries may now carry `proc: '<builder>'`
instead of `file` (`depth` = stand-off for wall-hung ones; the test
accepts either). three-renderer.js `_hqProcBuilders` builds them in
metres, base on y = 0, front +Z: `tanker_desk`, `floor_drain`,
`vent_grille`, `wall_shelf` (with bottles), `metal_shelving` (with
cans / boxes), `hook_rail`, `broom`, `rotary_phone`, `toilet_paper`,
`clipboard`. Give any of them a `file` and the GLB takes over.

**Renderer (three-renderer.js).** `HQ_WALLS` / `_hqBoxWall(room, wall,
spec)` → the wall point, inward normal and the yaw that faces a +Z-front
object into the room; `_hqHeadingOf`. `_hqBuildBoxShell`: floor + ceiling
planes, four wall slabs with dado + three trims, two conduits + brackets
across the ceiling with a cross pipe and a corner drop, a procedural
fluorescent strip + glow at `shell.light`, the room plate (CSS2D) at
`shell.plate`. Box branches in `_hqBuildDoors` (flat-wall placement,
`rec.box`), `_hqBuildCounters` (`x, z, face`, plate only), `_hqPlaceProps`
(rewritten around one `place(depth)` closure: box wall / box free / polar
wall / polar free; proc props placed synchronously), `_hqSpawnCharacter`
(`x, z` specs), `_hqSurface` (inside the four walls, prop discs),
`_hqCamBlocked`, `_hqFindTarget` (2.6 m in front of the panel, inside its
width), `_hqGoTo` (1.6 m in front, facing it / away; box counters: 1 m
south of the spot), `_hqEnter` (lights: dim hemisphere, the fluorescent
point, a warm pool at every `desk_lamp` / `table_lamp`; the boom starts at
0.6 × d). **Rank door (3.4, leaf half):** a `rankDoor` wears
`doorClearance(profile).door` and widens when that leaf is wide (L5
frosted pair; since 2026-09-04 the leaf decides every opening) — the egress office door and the closet's way
out both, so it is the same door from both sides. Scenes rebuild on every
enter, so a promotion shows the next time you walk in.

**Flow (map.js).** The egress office door's action is `{ room: 'office',
at: 'egress' }` — the panel's INTERIOR NOT YET BUILT button became GO
THROUGH ▸ YOUR OFFICE by itself (the room id exists now). Inside, the way
out is `{ room: 'central_egress', at: 'office' }`. The **IN-TRAY** counter
(`overlay: 'intray'`, prompt verb READ via the new counter `verb` key)
opens `_hqInTrayHtml`: OFFICER + EMPLOYEE NO., CLEARANCE + the door it
issues, NEXT DOOR (AWAITING FIELD WORK), the six-rung ladder as chips,
DIRECTIVE (`profile.door.pendingDirective` or NONE PENDING), VISITS TO HQ,
THRESHOLDS STABILIZED, MEMOS READ · STAMPS ON CARD, RECENT CASES (the
last four `matchHistory` rows: site · CLOSED / OPEN · condition), then
ANSWER A BELL CALL / YOUR CARD ▸ PROFILE (the modal pauses the closet
underneath and resumes on close) / NOTED. Reads the profile only. The
directory labels a box room's doors WALL N / E / S / W.

**Files (RULE #1 placement):** data.js (proc catalogue entries,
`rooms.office`, the office door action), three-renderer.js (`HQ_WALLS`,
`_hqBoxWall`, `_hqHeadingOf`, `_hqBuildBoxShell`, `_hqProcBuilders` /
`_hqProcProp`, `_hqRankLeaf`, box branches everywhere above, door-panel
clamps), map.js (`_hqInTrayHtml`, counter verbs, directory walls),
styles-base.css (`.hq-row-tray`), index.html (`?v=20260903e-cors`),
doorhq.test.js (+3: the office ↔ egress door pair and every rank leaf;
box doors on a named wall with a panel that fits; box props inside the
walls, mounts under the ceiling, the reference kit present, the in-tray
within reach of the desk). Docs: this file, DOOR_MASTER Part D. No
mid-match surface → no relay work (RULE #2).

**First-run checklist for the user:** (1) E at YOUR OFFICE (150°) → GO
THROUGH: do you stand just inside the closet with the door at your back,
facing the desk wall? (2) is the door's leaf the warped closet door on
BOTH sides (L1)? (3) walk the room: do the desk, chair, locker, cot and
shelving block you where they should, and is the boom camera usable in a
5.6 m room (WHEEL in if not)? (4) do the wall props face into the room
(sink, locker, breaker, extinguisher, clock — `EW_HQ_FLIP_LEAVES` does not
touch props; report which ones are backwards and Claude flips their
`rot`)? (5) does the cot run along the east wall (if it runs across the
room its long axis is the other one — set `face: 0`)? (6) E at the desk →
IN-TRAY reads your card; YOUR CARD opens the profile and closing it
resumes the closet; (7) E at the door → back in the egress with the office
door behind you; (8) `?hqdebug` positions are box-local (x z metres, the
deg / r are about the room centre).

**Next (in order):** 3.3 Code Red; 3.2 Keys; 3.4's promotion moment
(`paChime`, the card stamp, the new leaf); 4.1 the case-file screen
proper (SP meter, chapters, memos) growing out of the in-tray; §3.9 the
in-game layout editor; gamepad in the hall; a first-visit micro-scene at
the desk (4.2); the training room (6.1) as the next box room. Open: the
egress bay-door panel's quick-dispatch rows; whether the closet gets a
curved back wall (it sits in the ring — cosmetic, collision stays a box).

### 2026-09-03 — Phase 2.6: the six bays as walkable corridors
User: "continue with the build plan". `npm test` 99 (98 pass, the server
smoke skips without node_modules); 3 new checks in `doorhq.test.js`.

**Rooms.** The building has more than one room now. `DOOR_HQ.rooms`
gains six generated `bay_<sector>` rooms (`kind: 'bay'`) built at load
by data.js `hqBayRoom(sector)` from three tables — never hand-edit the
generated rooms:
- `DOOR_HQ.bayShell` — the corridor: an annular sector r 8.5 → 12.5
  (4 m wide) around its own centre, 4.2 m tall (the egress ground-floor
  height, so the 3.76 m door caps and the nameplates above them clear the
  ceiling), `spacing` 3.9 m of outer wall per threshold, `endPad` 9° of
  blank wall before each end cap, `minHalf` ±24°. The arc is ±(n·17.9°/2
  + 9): TERRESTRIAL (8 maps) ±80.5°, ANCIENT ±71.6°, HOLLOW ±53.7°,
  DIPLOMATIC ±44.8°, CELESTIAL ±35.8°, QUARANTINED ±26.9°.
- `DOOR_HQ.thresholds[mapId] = { leaf, wide, note }` — which of the 18
  leaves hangs on each of the 29 thresholds (Moon / Stonehenge / Göbekli /
  Hollow Earth / Olympus = the bare frame, Atlantis / Mars / D.U.M.B. /
  Antarctica = the bulkhead, Camelot = the portcullis, Backrooms = the EXIT
  door, …) plus a one-line "THE DOOR:" note for the panel. The test
  requires an entry for every launch map and no strays.
- `DOOR_HQ.bays[sector] = { agent, lines, props }` — the bay guard's
  line, overheard lines, and a few extra props in the bay's local frame.

Local polar frame per bay: deg 0 = **the way out** (door id `egress`) on
the INNER wall, wearing the same leaf as the bay door shows in the egress
(the same door from both sides), `action: { room: 'central_egress', at:
<the egress bay door id> }`. Thresholds (`site_<mapId>`, `action: {
mission: mapId }`) are spread evenly along the OUTER wall; for an odd
count one sits straight across from the way out. Standard dressing:
`fluorescent` fixtures every 3.2 m along the ceiling centreline (the
first `ceil` props — the renderer now hangs `cat.ceil`/`p.ceil` props
from `_hqCeilY`), extinguisher + breaker panel flanking the way out, a
clock, site-file cabinets at the ends (papers on one), boxes in a corner,
the guard by the outer wall just past the way in. Spawn: deg 0, r 10.7,
facing the thresholds. New door / prop key: `side: 'in'` = hangs on the
inner wall and faces OUTWARD (`_hqWallR(room, level, side)`); the test
insists every wall prop in a bay names `side: 'in'` (the outer wall is
thresholds).

**Renderer (three-renderer.js).** `_hqBuildBayShell`: floor + ceiling
sectors (concrete / acoustic panel), `_hqArcBand` partial-cylinder walls
(outer BackSide, inner FrontSide) with dado + three trims each, two end
caps with their own dado/trim strips, a teal guide line down the middle
and an oxblood hazard band along the threshold wall, procedural
fluorescent strips + glow, a two-conduit pipe run with brackets high on
the inner wall, and the bay stencil (CSS2D) at the far end. Side-aware
`_hqBuildDoors` / `_hqPlaceProps` / `_hqFindTarget` / `_hqGoTo` (an
inner-wall door is faced by heading toward the arc centre; `goTo(id,
faceAway)` still means "door at your back"). `_hqSurface` / `_hqCamBlocked`
gained a corridor branch (between the wall arcs, short of the end caps,
prop blockers as before). Bay lighting is cooler: a flatter hemisphere,
point lights along the centreline. `ThreeRenderer.hq.room()` reports the
live room. Side fix: `_hqSectorMesh(..., down)` used `rotateX(+90°)`,
which mirrors the sector through X — the stair-landing undersides were
drawn at the mirrored angle (hidden by the symmetric layout); it now
mirrors Y, which flips the winding without moving the arc.

**Flow (map.js).** `_hqCurRoom` / `_hqLastRoom` beside `_hqLastDoor`;
`_hqRoom()` is the live room. `window._hqGoRoom(roomId, at)` rebuilds the
scene for another room under the loading card ("admitting you to bay 1 ·
terrestrial…") and stands you at door `at` with it at your back. Door
actions: `{ sector }` (the egress bay doors) walks into `bay_<sector>` at
its `egress` door; `{ room, at }` walks anywhere a room exists (the
office / training / continuity / executive doors stay "INTERIOR NOT YET
BUILT" until their rooms exist — the panel enables itself the moment a
room id appears in `DOOR_HQ.rooms`). The egress bay-door panel keeps its
quick-dispatch rows (CROSS / DEEP per threshold, the checklists) and
gains **ENTER THE BAY ▸ WALK THE THRESHOLDS** on top; the user can drop
the rows later if the corridor should be the only way. Inside a bay, a
threshold's panel (`_hqThresholdPanelHtml`) is the site file: the customs
stamp, JURISDICTION, FIRST DOCUMENTED CROSSING (`doorSiteCanonDate`) +
case number, the file summary, the field description, THE DOOR note,
ENTITIES ON FILE chips (`hqMissionPool` natives), the ☑/☐ checklist, then
CROSS ▸ Δ BOARD · 4v4 / DEEP CROSSING ▸ FULL SITE · nvn. The prompt reads
[E] OPEN on a threshold. `_hqLaunchMission` records the room, so the
post-match return rebuilds THAT bay at THAT threshold; `_hqReturnOrMenu`
passes `room: _hqLastRoom`. Play always starts on the egress floor.
`Q` (dispatch) and the strip's DIRECTORY work from a bay by borrowing the
egress counter definitions; the directory lists the live room's doors
(INNER WALL / THRESHOLD) with WALK. `doorSiteState` handles `{ mission }`
(the site's own mastery; a locked sector seals its thresholds).
`profile.door.hq.lastRoom` joins `lastDoor` (profile.js backfill).

**Files (RULE #1 placement):** data.js (`bayShell`, `thresholds`,
`bays`, `hqBayId`, `hqBayRoom`, generated rooms, `doorSiteState`),
three-renderer.js (`_hqArcBand`, `_hqWallR`, `_hqCeilY`,
`_hqBuildBayShell`, side-aware doors/props/targets/goTo, corridor
surface + camera, bay lights, `hq.room()`), map.js (rooms, `_hqGoRoom`,
threshold panel, room-aware directory / counters / return), profile.js
(`lastRoom`), styles-base.css (`.hq-site*`, `.hq-chips`, `.hq-chip`,
`.hq-plate-bay`), index.html (`?v=20260903d-cors`), doorhq.test.js (+3).
Docs: this file, DOOR_MASTER Part D. No mid-match surface → no relay work
(RULE #2); the building is still never alive during a match.

**First-run checklist for the user:** (1) E at BAY 1 · TERRESTRIAL →
ENTER THE BAY: do you stand facing the thresholds with the suburban door
at your back? (2) walk the arc: do the door leaves face into the corridor
(else `EW_HQ_FLIP_LEAVES=true` — same convention as the egress)? (3) do
the wall props on the inner wall face you (they use the same +Z
convention flipped by `side: 'in'`)? (4) E at the way out: do you land in
the egress with the bay door behind you? (5) open a threshold, CROSS, play,
and confirm the result screen's D.O.O.R. HQ button re-admits you INTO the
bay at that threshold; (6) Q from inside a bay opens Dispatch; (7) the
fluorescent fixtures hang at the ceiling (if they float or sink, the
`fluorescent` catalogue span is the knob). Report `?hqdebug` positions
(they are bay-local: deg 0 = the way out).

**Next (in order):** 2.7 the closet interior (kit uploaded — `kind:
'box'` room, the same room plumbing now exists); 3.3 Code Red; 3.2 Keys;
§3.9 the in-game layout editor; gamepad in the hall; a first-visit
micro-scene at the desk (4.2). Open: whether the egress bay-door panel
should lose its quick-dispatch rows now that the corridor exists.

### 2026-09-03 — Phase 2.2 (wedge kit re-homed) + Phase 3.1 (mastery checklists)
User: "continue with the build plan; I uploaded the round wedge desks to
the repo for their dimensions, but I like the generated circular desk —
use the desk models somewhere else." `npm test` 96 (95 pass, the server
smoke skips without node_modules); 3 new checks in `doorhq.test.js`.

**Measuring the wedges (no R2 access from the sandbox).** The three
GLBs sit at the repo root. A scratch node script parsed each JSON chunk
+ POSITION accessor, rasterised top / front / iso views to PNG (a 90-line
software rasteriser — no browser, RULE #1c) and least-squares-fitted the
straight edge of the top surface. Findings, model units (Meshy
normalises the longest axis to 1.0):
- `reception_wedge` (…0903105549): 1.000 × 0.674 × 0.865 — NOT a 45°
  sector: a corner reception counter whose two straight sides meet at the
  −x/−z corner, a banded curved front bulging to +x/+z with a raised
  transaction ledge along it; the work surface sits at ≈ 0.70 × height
  (0.77 m at the 1.10 m target).
- `desk_wedge_a` (…0903105601): 1.000 × 0.637 × 0.686 — a solid
  kidney-shaped workstation, convex side −z, concave (worker) side +z.
- `desk_wedge_b` (…0903105612): 1.000 × 0.639 × 0.678 — a 45.3° annular
  sector on two leg frames; edge fit x = 0.417 z − 0.307 → apex at
  z = 0.737, outer r 1.075, inner r 0.398 → at the 0.76 m target
  (s = 1.19) a ring of 8 would be r 1.28 m / hole r 0.47 m.

**Where they went (data.js `central_egress.props`).**
- RECEPTION · INTAKE (door @120°): the reception counter at 128° / r 17.9,
  `rot: 45` so the curved front faces the hall and the clerk's
  `office_chair` (129° / 18.95) sits on the wall side; `crt_terminal`,
  `papers_a`, `pen` on the 0.77 m work surface. `foot: 0.85`.
- The **briefing table**: `desk_wedge_b` with `ring: { n: 4, start:
  -67.5 }` at 20° / r 14.5 — a half-ring (r 1.28 m) opening toward the
  hall; four `folding_chair`s at the sectors' bisectors 0.5 m off the
  outer edge (13.8°/15.27, 17.6°/16.16, 22.4°/16.16, 26.2°/15.27, `rot`
  ±61 / ±20 = facing the ring centre); papers on top.
- Two **mezzanine clerk stations** (`desk_wedge_a`, `rot: 180`, convex
  side to the hall) against the upper wall at 100° (Arcane Engineering,
  CRT + papers, office chair) and 325° (Bureau of Continuity, table lamp
  + notebook, teal chair). The slab is only 2.2 m walkable, so the chairs
  sit BESIDE the desks (±2.7°), never in front — a new test asserts every
  mezzanine floor prop leaves ≥ 2 × HQ_BODY_R of the band free (the
  existing globe lamps pass by 6 cm).
- Orientation assumption: Meshy fronts are +z (the filing cabinets face
  the hall at `rot: 0`); CRTs at the new stations use `rot: 0` = the same
  screen-to-operator relation the dispatch desk's `rot: 180` CRTs have
  (operator on the far side from the hall there, the near side here). If
  a screen faces the wrong way, flip that prop's `rot` by 180 in data.js.

**Ring props (three-renderer.js `_hqPlaceWedgeRing`).** A prop with
`ring` and a catalogue `wedge: { deg, apex, rOut, rIn }` builds n copies
under one group at the spot: copy i is a sub-group yawed −(start +
i·deg) with the instance pushed `apex × depth × s` along −z so the arc
centre sits on the sub-group origin; yaw 0 points the outer arc away from
the hall (local −z). Each copy gets its own collision disc (radius 0.45 ×
its longest span) placed as a bare Object3D directly in `propGroup`,
because `_hqSurface` reads a blocker's own position without parent
transforms.

**Mastery checklist (3.1).** data.js `hqSiteMastery(mapId, profile)` →
`{ have, done, total, missing, mastered }` (flags first, then match
history, Δ-aware); `hqMapMastered` now wraps it; `DOOR_HQ.masteryLabels`
names the conditions (WIPEOUT · TOWER · HOURGLASSES — engine-true words
until Phase 6.2/6.3 rename the tower and hourglasses). The bay door panel
(map.js `_hqDoorPanelHtml`) shows a ☑/☐ row per threshold under its
CROSS / DEEP buttons and the lamp chip reads `n/3` until STABILIZED
(`.hq-row-checks`, `.hq-check` in styles-base.css). The result screen's
D.O.O.R. stamp grows a tag (battle.js `_stampHqSite`, `.drs-site`):
green **THRESHOLD STABILIZED · <site>** when this match completed the
set, amber **FILED · <condition> · <site> n/3** when it logged a new one.
It reads the viewer-local `window._lastHqSiteFlag` (written by
`commitAchProgress`, now reset per commit and on no-contest, consumed by
the tag) — never on `state`, so nothing rides state-sync (RULE #2); the
tag is local on both clients like the stamp itself.

**Files (RULE #1 placement):** data.js (catalogue wedge geometry, props,
`masteryLabels`, `hqSiteMastery`), three-renderer.js (`_hqPlaceWedgeRing`
+ the ring branch in `_hqPlaceProps`), map.js (checklist row), battle.js
(flag reset, `_stampHqSite`), styles-base.css (checks + stamp tag),
index.html (`?v=20260903c-cors`), doorhq.test.js (+3). Docs: this file,
DOOR_MASTER Part D.

**Next (in order):** 2.6 the six bays as corridors with their threshold
doors; 2.7 the closet interior (kit uploaded); 3.3 Code Red; 3.2 Keys;
§3.9 the in-game layout editor; gamepad in the hall; a first-visit
micro-scene at the desk (4.2). Open: the wedge models are in the repo
root — they must also be on R2 under `Assets/door/models/` with the
catalogue filenames (they were listed there in the 1.1 inventory).

### 2026-09-03 — Phase 1.3 + 1.4 + 1.5: Play enters the building
User: "continue with the build plan". The isolated egress became the Play
hub. Every flow rule below is in map.js unless stated; `npm test` 92 pass
(4 new checks in `doorhq.test.js` — note the real filename has no hyphen).

**Play → HQ (D5).** `_goToPlayHub` calls `_hqEnter({from:'play'})` when
`_hqEnabled()`; the classic hub survives via `?nohq`, localStorage
`ew_hq='off'`, `window.EW_DISABLE_HQ`, the new **Settings → D.O.O.R.
Headquarters** toggle (`_hqToggleHome`), and as the automatic fallback when
the 3D enter fails (no WebGL). Main-menu buttons are otherwise unchanged;
only the Play card's description changed. The battle renderer stays alive
behind the menu after a match (only the map editor ever `deactivate()`d
it) and the HQ needs the shared canvas, so `_hqEnter` parks it first when
`state.phase !== 'battle'` — `startMatch` re-activates (it already checks
`isActive`). The playtest harnesses call `_goToVsCpu()` directly and are
unaffected.

**Return plumbing (D7).** `window._hqReturnOrMenu(fallbackPage)` is the
way back from every screen: while `_hqHome` is set (the player came in
through Play) it re-enters the building at `_hqLastDoor` (the door last
walked through, avatar placed with the door at its back —
`ThreeRenderer.hq.goTo(id, faceAway)`), else it shows the classic page.
Rewired sites: `_mdCharBack`, `_settingsBack`, `_codexBack`,
`_teamBuilderBack`, `_challengePickBack`, the Challenge run's exit, both
map-editor exits, `_msBack` + `_lobbyBack` + online.js
`lobbyBackToPlayHub` (fallback `playHubPage`), ui.js `_shopBack`, and
battle.js `backToMainMenu` (post-match; the result overlay's button reads
**D.O.O.R. HQ** via `_hqRelabelMenuButtons`, called again after
`_restoreResultOverlayButtons` rebuilds the bar). EXIT on the strip clears
`_hqHome` — Back buttons land on the main menu again until the next Play.
Two kinds of screen: **page screens and matches leave the building** and
rebuild it on return (the loading card covers the ~1 s); **pure DOM modals
(Profile / ID card, Leaderboard) and the Settings page keep it alive
underneath, paused** (`_hqSuspend` / `_hqResume`; the modal's `_unmount*`
is wrapped once so closing it resumes, deferred a tick so a launch path
would win). Community Maps is deliberately a leave (its PLAY starts a
match). ESC in the hall now opens Settings over the paused building
(D6); `Q` opens the dispatch panel from anywhere (D2, three-renderer
`onHotkey`); the strip gained a DIRECTORY button and a `STABILIZED n / 29`
count; hints updated.

**Mission launcher (D3 / §3.7).** Bay-door panels are live: every
threshold row has **CROSS ▸ Δ** (Arena, 4v4 on the site's 8×8 Δ board) and
**DEEP** (the full map at its own team size); sealed / clearance-gated bays
show them disabled with the reason. `_hqLaunchMission(mapId, {delta,
doorId, doorLabel})` sets `window._hqPreselect = {mapId, launchId, delta,
teamSize, gm:'arena', roster, doorId, doorLabel}` + `_msCpuOnly`, buzzes,
leaves the building and opens `modePage`. `_msRenderAll` remounts the
MatchSelect React root once while a fresh preselect is pending, and the
component's initial state reads it (mode / map / Δ filter / team size) and
shows a "DISPATCHED FROM <door> · 4v4 Δ BOARD · CPU FIELDS THE SITE'S
NATIVE ENTITIES" line in the FIELD ASSIGNMENT slip. Nothing about match
setup is bypassed: the player can still change anything, CONFIRM files
the form, the party builder runs. `_msConfirm` reads the preselect once:
`window._hqCpuPool = roster` only if the launched map is still that site
(else null); `_msBack` / `_goToVsCpu` clear it. **CPU roster pinning**
(state.js): `randomizePartyIdentities(count, ownedOnly, pool)` /
`randomizeIdentity(ownedOnly, forceRace)` — `optimizeRandomizeParty(2)`
and `rerollOpponentForNextMatch` pass `window._hqCpuPool`; the natives are
shuffled among themselves, padding races only appear when they run out;
a pinned race must be real and 3D-ready, ownership never applies to the
CPU. **Pool** (data.js `hqMissionPool(mapId, n)`): the site's natives
(`doorSiteCrossings`), then maps sharing a biome (most shared first), then
the rest of the sector, then any launch map, until ≥ n distinct;
`pool.natives` = how many lead entries are true natives. Filtered by
`isRace3DReady` when sprites.js is loaded (not in the headless test).

**Mastery (D9 / 1.4).** battle.js writes `prog.unlocked['site:<site>:
<winCondition>'] = Date.now()` inside the existing achievements commit
(same `saveProgress` / server sync) for a standard-match win whose
condition is in `DOOR_HQ.masteryConditions` and whose map is a bay
threshold; the Δ suffix is stripped (`hqSiteId`) so a Δ-board win counts
for the site; PvP wins count (MASTER B3). `hqMapMastered` now strips the
suffix on history rows too; `hqMasteryCount(profile)` feeds the strip.
Side fix: profile.js `buildProfileMatchSummary` recorded `mapId:
'unknown'` for every match (`st._mapPresetId` was never written anywhere)
— it now falls back to `activeGameMode`, so match history finally knows
the map. `window._lastHqSiteFlag` (viewer-local) notes a freshly written
flag for a later "THRESHOLD STABILIZED" stamp on the result screen.

**Audio (1.5).** audio.js `startDoorRoomTone()` / `stopDoorRoomTone()`: a
synthesized hall loop (looped noise through a wobbling low-pass = HVAC,
60/120/180 Hz hum, a faint ballast hiss) riding the Ambience slider
(`applyAmbienceVolumeMix` → `_doorRoomToneApplyVol`), started on enter /
resume, stopped on leave / suspend; `EW_DISABLE_AMBIENCE` kills it.
`doorBuzz` fires on every door use (`_hqDoAction`, `_hqLaunchMission`) and
on the way in from Play, not on returns. `syncMusicToState` plays
`doorMuzak` in the HQ once `audioTracks.doorMuzak` exists (user-made,
MASTER B4) and `mainTheme` until then. `paChime` stays reserved for the
promotion moment (Phase 3.4).

**Profile.** `door.hq = {visits, lastDoor, variantSeed, keys}` backfilled
(`defaultDoor`); `visits` counts entries from Play, `lastDoor` is the last
door walked through (`_hqRecordVisit`). Data only.

**Files (RULE #1 placement):** data.js (`hqSiteId`, `hqMasteryCount`,
`hqMissionPool`, `hqMapMastered` Δ-aware), state.js (pool-aware party
randomizer), battle.js (mastery flag, HQ return, relabel hook), profile.js
(`door.hq`, `mapId`), ui.js (`_shopBack`), online.js
(`lobbyBackToPlayHub`), three-renderer.js (`Q` hotkey → `onHotkey`,
`goTo(id, faceAway)`), audio.js (room tone), match-select.js (preselect
+ dispatched line), map.js (everything above), styles-base.css
(`.hq-row-bay`, `.hq-row-btns`, `.hq-strip-stat`), index.html (Play
text, strip DIRECTORY + mastery, hints, `?v=20260903b-cors`),
doorhq.test.js (+4 tests). No mid-match surface changed → no relay work
(RULE #2); the building is still never alive during a match.

**Next (in order):** 2.2 wedge desk once the wedge dimensions are known;
2.6 the six bays as corridors with their threshold doors; 2.7 the closet
interior (kit uploaded); 3.1 mastery checklist inside the door panel +
the result-screen THRESHOLD STABILIZED stamp (reads
`window._lastHqSiteFlag`); 3.3 Code Red; §3.9 the in-game layout editor;
gamepad in the hall; a first-visit micro-scene at the desk (4.2).

### 2026-09-03 — Phase 1.1 + 1.2 shipped as an ISOLATED build (Play untouched)
User: "build/design the facility isolated before connecting it to the main
menu buttons"; uploaded the textures + most models (§5.5) and committed the
reference art under `door_reference_images/` (not `docs/door-hq/ref/` —
fine, the plan's file names in §5.1 map onto them by content).

**How to enter (dev only, nothing on Play changed):**
- `index.html?hq` — skips the ident + title, lands on the egress floor.
- `window._hqEnter()` in the console from the main menu.
- `?hqdev` once → a purple "🚪 D.O.O.R. HQ · DEV BUILD" pill sticks to the
  main menu (localStorage `ew_hqdev`; `localStorage.removeItem('ew_hqdev')`
  hides it). `window._hqExitToMenu()` / ESC / the strip's EXIT leave.
- Controls: WASD/arrows walk, SHIFT run, SPACE hop, E/Enter use, V first
  person (click locks the mouse), drag = orbit, wheel = boom, ESC = close
  panel / leave. Gamepad not wired yet.
- Tuning loop: `?hq&hqdebug` prints `deg · r · y · level · x z` bottom-right.
  Report positions like "water cooler → deg 196 r 19.6" and Claude edits
  `DOOR_HQ`; the §3.9 in-game editor is still to do.
- Console switches: `EW_HQ_FLIP_LEAVES=true` (every leaf 180° — use this if
  doors show their backs), `EW_HQ_NO_PROPS` (shell only), `EW_HQ_NO_POST`
  (bypass the retro/bloom stack), `EW_HQ_AVATAR='race'|{race,gender}`,
  `EW_HQ_DEBUG`, `EW_HQ_DEV`. All read at `_hqEnter` time except the first.

**Files (RULE #1 placement, all existing):**
- `data.js` — `DOOR_HQ` (units, R2 asset roots, the 8 textures, a 70-entry
  catalogue with target sizes in metres + collision radii + wall/mount/glow
  flags, the six sectors, `masteryConditions`, the `central_egress` room:
  shell numbers, procedural desk, 2 stairs, 15 doors, 3 counters, ~75 props,
  3 agents, 5 npc spots, 6 overheard lines, spawn) + helpers `hqPolar`,
  `hqSectorOfMap`, `hqMapMastered`, `doorSiteState`. C-1 rank strings
  landed (DOORMAT…THE DOORMAN) with a `door` leaf key per rank.
- `three-renderer.js` — the HQ module (search `D.O.O.R. HEADQUARTERS`),
  exported as `ThreeRenderer.hq = {enter, leave, active, setPaused,
  interact, toggleView, isFirstPerson, refreshLamps, goTo, target, pos,
  stateLabel}`. Own `THREE.Scene` + camera + `setAnimationLoop` on the
  shared renderer; the canvas + CSS2D overlay are re-parented into
  `#hqStage` for the visit. Procedural: floor + inlaid bands + 8 spokes,
  lower drum (wall/dado/three trims), mezzanine slab (top/underside/fascia)
  + instanced posts + torus rail arcs with gaps at the landings, upper
  drum, ceiling cone + lid + 24 instanced light strips with glow sprites,
  the cube (canvas glyph emissive, slow yaw) on its rod, two curved stairs
  (one InstancedMesh each, sloped inner rail, top landing sector with
  rails), the two-ring dispatch desk with the seal decal + a point light,
  door frames (jambs/lintel/back plate/dado/cap/teal reveal + lamp housing
  + lens + glow), the elevator pair, the EMPLOYEE OF THE MONTH board, the
  directory kiosk. Kit props via `_miscModelInstance` (misc-model cache),
  materials re-wrapped as linear Lambert, sizes auto-normalised from the
  measured bounds, wall props pushed back to touch the wall once their
  depth is known, glow sprites for lamps/screens. Leaves fitted by height
  and clamped to the opening width. Characters = `createUnit` +
  `_attachUnitModel` (shared animation library retargeting) with mixers
  ticked in the HQ loop; silhouette/outline twins hidden.
  Walking: polar walkable query (`_hqSurface`: stairs → landings → slab →
  floor, ±0.62 m step tolerance = the railings, prop footprints as
  circles), axis-separated slide, camera-relative input, idle/walk/run/
  jump clips, lean + landing bounce. Camera: third-person orbit with a
  12-sample boom march against walls/slab/ceiling/floor and auto-follow
  behind the runner; first-person eye with pointer lock. Lamps from
  `doorSiteState` (amber pulse, red, green, off; strobe reserved for Code
  Red). CSS2D nameplates fade with distance. Interaction targets: door arc
  (±6° within 3.4 m of the wall), counter radius, character within 1.75 m.
- `three-post.js` — `ThreePost.renderScene(scene, cam)`: renders any scene
  through the composer (bloom for the lenses, FXAA, grain/dither/levels
  retro pass) with the tilt-shift DoF, night grade and unit pixel mask
  switched off for the frame; everything restored after.
- `map.js` — `_hqEnter/_hqLeave/_hqExitToMenu/_hqClosePanel/_hqDoAction/
  _hqDevPillRefresh` (window.*), prompt + panel builders: room doors (ENTER
  → the screen's own `_goTo*` / `_mount*` entry, ALT buttons for Party
  Builder / Replay / Community Maps / Challenge / Mystery Dungeon), bay
  doors (the sector's thresholds with site-file stamps + UNSTABLE/
  STABILIZED chips, launch buttons DISABLED until Phase 1.3), dispatch
  (Quick Play / Friendly), the board (Leaderboard), the directory (every
  place + WALK teleport), agent/vessel one-liners. `_showTitlePage` hides
  the menu-bg canvas on `hqPage` and refreshes the dev pill.
- `index.html` — `#hqPage` (stage, strip with seal/officer chip/wallet/
  EXIT, hints, prompt, debug, panel, loading card) + the dev pill; `?v=`
  → `20260903a-cors`. `styles-base.css` — `.hq-*`. `state.js` — `GS.HQ`.
  `ui.js` — `?hq` autostart after `_gameReady`. `door-hq.test.js` — 11
  headless checks (catalogue shape, key resolution, door spacing vs stair
  arcs, sector partition of the 29 launch maps, walkable radii, rank
  ladder, `doorSiteState`/`hqMapMastered`). `npm test`: 89 pass.

**Layout as built (metres; deg cw from north; north = the far wall from
the spawn):** ground drum r 21, wall 4.2; mezzanine slab r 20.6→24 at 4.2;
upper drum to 9.6; cone to 12.8; cube 3.6 m centred at 7.4 m. Desk rings
r 2.6/5.6, 1.05 high. Stairs: E 18°→62°, W 342°→298°, treads r 19.35–20.6,
24 steps, landings 6° past the top. Ground doors: 0 BAY 4 CELESTIAL
(futuristic), 90 QUARTERMASTER (vault → Shop / Party Builder), 120
RECEPTION (office → Profile), 150 YOUR OFFICE (warped closet, rank door),
180 TRAINING FACILITY (exit door + EXIT sign; alts Challenge / Mystery
Dungeon), 210 MEDICAL (office → Challenge), 240 RECORDS (wired double →
Codex; alts Replay / Community Maps), 270 BAY 1 TERRESTRIAL (suburban).
Mezzanine: 0 ELEVATOR (proc, L4), 45 BAY 2 ANCIENT (portcullis), 90
ARCANE ENGINEERING (office → Map Editor), 150 BAY 5 DIPLOMATIC
(revolving), 210 BAY 3 HOLLOW (bulkhead), 270 BAY 6 QUARANTINED (security,
sealed), 315 BUREAU OF CONTINUITY (frosted, L5). Counters: DISPATCH (180°,
r 6.9), EMPLOYEE OF THE MONTH (288°, wall), DIRECTORY (165°, r 19.6).
Spawn 180° r 15.4 facing the desk. Agents at the desk centre, the board,
and the ANCIENT bay.

**Deviations / decisions taken:** asset paths (above); no `state._hq*`
fields (state lives in the renderer module, so no `_serializeState` skip
entry was needed); the model-front convention follows the unit pipeline
(+Z toward the hall) — Meshy static exports may face the other way, hence
`EW_HQ_FLIP_LEAVES`; prop target sizes are educated guesses per catalogue
entry (`h`/`span` in metres) — expect a tuning pass; wall props ignore `r`
unless given (the EXIT sign uses `r` + `mount` to sit on the lintel).

**First-run checklist for the user:** (1) do leaves face the hall? (2) do
props look the right size (globe lamp ≈ head height, CRT ≈ 40 cm)? (3) walk
both stairs up and down, cross the mezzanine, try the railing; (4) E at
every door / the desk / the board / the kiosk / an agent; (5) V for first
person; (6) does the cube read? (7) FPS with the retro pass on vs
`EW_HQ_NO_POST`. Report with `?hqdebug` positions.

**Next (in order):** 1.3 Play → HQ + `_hqReturnOrMenu` at the 12 sites +
result overlay, `_hqLaunchMission` + `_hqPreselect` in match-select (bay
doors go live); 1.4 mastery flag write at match commit (`progress.unlocked`
`site:<mapId>:<cond>`); 1.5 room tone + `paChime`; 2.2 wedge desk once
the wedge dimensions are known; 2.6 bays as corridors; 2.7 the closet
interior (kit is uploaded); §3.9 the in-game layout editor; gamepad.

### 2026-09-03 — rev 2: pivot to the walkable 3D facility from Phase 1
User: the doors lead to maps anyway; wants to walk the building in third/
first person; is making 3D assets; challenged the perf claim. Verified:
`BASE_TILE = 128` (1 tile ≈ one character ≈ 1.75 m), a misc static-model
loader already exists (`_R2_MISC`, OBJ + GLB, cached/cloned), Strike Mode
has TPS + first-person rigs with pointer lock, CSS2DRenderer is loaded,
and ROADMAP §4's object count is the voxel board builder's, not an engine
ceiling. Rewrote §0–§7: procedural shell + authored prop kit + DOM
overlays; §5.3 is the asset list with export rules. Reference images still
awaiting commit to `docs/door-hq/ref/`.

### 2026-09-03 — rev 1.1: user decisions
Pre-rendered first (now superseded), walkable end state, rank titles
DOORMAT…THE DOORMAN, hybrid story gating (MASTER C-4 / B3).

### 2026-09-03 — rev 1: plan written, no game files touched
Research: the Play hub is `_goToPlayHub` (map.js:98); every menu function
has a `window.*` entry point; the Guild Hub is a working walkable hub
(free-roam + roster NPCs + entrance trigger); `matchHistory` stores `mapId`
+ `winCondition` per match so mastery needs no new tracking;
`EW_MAP_META.biomes` groups the 29 maps into six bays; `doorSiteCrossings`
gives each map its native enemy pool; the Δ boards are the brief's
4v4-on-8×8 format.

### 2026-09-04 (rev 2 of the boards) — danger cells over the whole footprint; the room goes solid
User feedback on the first build: the Holo Sim's red squares are the
DELAYED-ATTACK marker, not board terrain, and should cover the attack's
entire area of effect; the Training Room's inward-only walls and the moat
were "weird occlusion stuff" — the player only sees the tile tops, so
covering the board's sides is fine. Token `20260904f-cors` →
`20260904g-cors`; files data.js, three-renderer.js, index.html (map.js and
sprites.js from the first build stand). `npm test` 113 (112 pass).
- **Delayed attacks paint every tile.** three-renderer `_getZoneIconTex('cell')`
  is a new canvas plate (red rim, faint red wash, warning triangle) and
  `_renderDangerCells(tiles, small, pulseSpeed)` lays one on EVERY tile of
  a pending blast's footprint (`_buildZoneBorderEdges`' Chebyshev square,
  the same tiles the detonation hits), pushed onto `_zoneBorderMats` so
  they blink at the telegraph's 3.4 countdown speed; the AoE border stays.
  A laser mark (Headshot) is a one-tile footprint that follows its target.
  Works on every map; `state._delayedSpells` already rides state-sync, so
  the guest sees the same cells (RULE #2, no relay needed).
- **Holo Sim board:** the three `holo_red` cells (and mirrors) are gone;
  two risers remain. `holo_red` stays as an editor terrain.
- **Training Room:** walls are double-sided and run from the bed's floor
  (y 0) to 3.2 tiles above the room floor; the walkway meets the board edge
  (no moat, its top a hair under the tile tops so the rim never z-fights);
  barriers sit on the rim. Nothing is culled as the camera moves.

### 2026-09-04 (rev 4 of the Training Room) — see-through walls; the Holo Sim floor goes black
- **Training Room walls fade, not the units.** The enclosure was a solid
  box the occlusion raycaster never saw, so from any outside camera angle
  the wall in front swallowed the grid and every unit behind it dropped to
  its red/blue x-ray hologram. `_hzTrainingRoom` now sets
  `group._ew_occNear`, which `_hzRunNearBuilder` turns into
  `_facilityNearGroup`: an occluder container for `_occComputeBlockers`
  (each direct child is one occluder, `_occHitFadeable` always accepts a
  `_ew_occWall` root, `_occCollect` takes the wall's glow sprites too).
  Each wall — panel, dado, trims, light strips, doors, signs, clocks, red
  lamps, the observation booth — is ONE group (`tr_wall_n/s/w/e`), so it
  fades as a whole to `_ew_occFadeTarget` 0.04 (near-invisible; terrain
  keeps `OCC_FADE_TARGET` 0.10). Barriers, drums, consoles and crates stay
  individual occluders. On a facility board the grid itself is always a
  fade subject (centre + four inner corners, beside the active unit /
  focal tile), so the board reads from every angle, not only the tile the
  active unit stands on. Reverts the rev-2 "nothing is culled or hidden"
  stance — walls hide themselves now, never the board.
- **Holo Sim floor is black.** The `holo` plate's fill was a dark navy
  (8,16,34) that `_EMISSIVE_TERRAIN` + bloom lifted into a solid blue
  floor, drowning the move/attack/danger overlays; the embedded PNG's fill
  is (2,2,3) with (7,8,11) inner lines now — only the cyan rim glows.
  `holo_red` untouched.
- Files: three-renderer.js, sprites.js, index.html (`?v=20260904j-cors`);
  DOOR_MASTER.md Part D.

### 2026-09-05 — controls rework (user feedback): mouse-look TP camera, E walks through doors, door-blink room transitions, a real jump
- **Camera:** third person is pointer-lock mouse-look now, same as FP — click
  the canvas once to capture, the mouse aims (yaw free, pitch clamped
  −1.15…0.85 in TP), WHEEL still zooms, V still toggles FP. Click-drag orbit
  remains only as the unlocked fallback. `setPaused(true)` (any panel/modal)
  releases the lock so the cursor works; walking through a door KEEPS it
  (`_hqKeepLock` holds the lock through the leave/enter rebuild since the
  shared canvas is the same element). Auto-follow only runs while unlocked.
- **Doors:** `_hqInteractTarget` (map.js) fronts `_hqOpenPanel`: E on an
  unlocked single-outcome door (`action.room` with a built interior,
  `action.sector` with a built bay, or `action.fn`) fires `_hqDoAction`
  directly — no panel. Panels remain for thresholds (`action.mission`),
  locked states (sealed/clearance/off — the panel explains the gate),
  `alt`/`alt2` doors, unbuilt interiors, counters, NPCs, notices.
- **Transitions:** `_hqEnter({from:'walk'})` adds `walk` to `#hqLoad` — the
  card is hidden (styles-base.css `.hq-load.walk`), the overlay is a plain
  0.26 s black blink, min-wait 150 ms (was 900 ms), fade-back 320 ms. First
  entry from Play and post-match returns keep the full clearance-check card.
  Props still stream in async on a first bay visit (browser-cached after) —
  acceptable; full seamlessness would mean all rooms in one scene with real
  doorways (collision + occlusion + memory work), logged as a later phase.
- **Jump:** replaced the cosmetic hop with physics: `HQ_JUMP_V` 7.25,
  `HQ_GRAV` 18 → apex ≈ 1.46 m, ~0.8 s air. Space (grounded) sets
  `pl.air/vy`; airborne horizontal moves check `_hqAirOK` (hard walls, arcs,
  stair masses; the mezz railing band crossable only with feet above
  wallH+1.15) and ignore blockers; descent lands on
  `_hqSurface(x,z,null,true)` (0 fallback under the band edges).
  `_hqSurface` learned two surfaces on the rotunda desk: the counter top
  (`desk.h`) and the hollow-centre plinth (0.05 m) — STEP_TOL still forbids
  walking on/off, so the counter/middle are jump-only, as asked ("jump into
  the middle circular table area"). Landing inside a blocker footprint is
  escapable (`_hqInBlocker` → probes skip blockers until clear). `_hqGoTo`
  resets air state. Anim: `jumpT` ≥ 0 still drives the jump clip + landing
  squash.
- Hints line updated (SPACE jump · E enter/use · CLICK aim · MOUSE look).
- Files: three-renderer.js, map.js, styles-base.css, index.html
  (`?v=20260905a-cors`); DOOR_MASTER.md Part D.

### 2026-09-05 (rev 2) — feedback pass: click-free look, walk-through doors, one-shot jump clip
- **Mouse look with zero clicks.** Unlocked mousemove over the scene (the
  canvas or the CSS2D nameplate layer) steers the camera via movementX/Y —
  works the instant you move the mouse; the cursor goes quiet over UI
  elements. Pointer lock is grabbed opportunistically on every available
  gesture (the Play/door click that entered the room via `_hqBindInput`,
  WASD/SPACE keydowns throttled to one try per 1.5 s, canvas clicks, panel-
  closing clicks via `setPaused(false)`) and simply takes over when granted,
  removing the screen-edge limit. ESC still frees the cursor.
- **Walk-through doors.** `_hqTickAutoEnter` (per-frame, after the target
  scan): when the targeted door has `motion`, is unlocked, and has swung
  open (openT ≥ 0.55), pressing into the doorway while moving toward it
  (within the opening width, ≤0.9 m off the wall plane, heading dot > 0.35)
  fires `opts.onEnterDoor` once per approach (latch re-arms when you step
  out). map.js `_hqWalkThroughDoor` runs the same direct set as E
  (`_hqDoorDirectAction`, shared refactor); panel-only doors no-op — and
  static leaves (vault, portcullis, revolving, wired doubles, bulkheads)
  never swing, so exactly those still want E, per the user's rule.
- **Jump fires once.** Two causes fixed: the jump clip looped (LoopRepeat)
  because the physics airtime (0.81 s) outlived the short clip — the HQ
  player's jump action is now LoopOnce + clampWhenFinished with timeScale
  sized to `HQ_JUMP_AIR`, holding the last frame on long falls; and held
  SPACE re-fired the arc on landing — `pl._jumpLatch` makes it one jump per
  press.
- Files: three-renderer.js, map.js, index.html (`?v=20260905b-cors`).

### 2026-09-05 (rev 3) — camera snap, walk-off edges, solid furniture; the MD door replaces the Guild Hub
- **Camera no longer fights the mouse.** The walker's auto-follow (swing
  the camera behind the runner 1.4 s after the last mouse move) is gone —
  that swing was the "snap" the user saw while walking with hover-look.
  The mouse (hover-look / pointer lock) owns the yaw outright.
- **Edges are walked off.** `_hqSurface`'s step rule is one-sided: only
  CLIMBING is limited (`HQ_STEP_TOL` 0.62); a drop up to `HQ_DROP_MAX`
  (1.6 m) is allowed and the walker goes airborne with no upward speed
  (`_hqWalkerSetY`, `HQ_FALL_MIN` 0.5 — stair treads are still walked).
  So the dispatch counter (1.05 m) is jumped ONTO and walked OFF — into
  the well (0.05 m plinth) or back to the hall — no second jump. The
  4.2 m mezzanine is above the drop limit, so every slab / landing edge
  stays railed (plus an explicit landing inner-rail check); the jump over
  the railing is unchanged.
- **Furniture has a top.** Every blocker carries `top` (metres): the
  catalogue `h` at placement, the fitted GLB height once loaded
  (`onDone`), fixed values for the pit barriers (0.79), drum (1.52),
  crate (0.75), directory stand (1.55); NPCs are 2.6 m (never a floor).
  `_hqBlockersUnder` / `_hqBlkTop` / `_hqAirClearOfBlockers` /
  `_hqBlockerFloor` replace the old disc-only checks: a footprint's top
  is a floor when you stand on it or can step up onto it (boxes, crates,
  the couch you jumped on), anything taller than a step is a wall, a
  blocker's SIDE is solid in the air until the feet clear its top, and a
  jump lands on the top (not at floor level inside the prop). The old
  "landed inside a footprint → ignore all blockers until clear" hack —
  the walk-through-everything bug — is gone; the escape hatch only opens
  when the current spot is invalid (`skipB` = current surface is null).
- **Mystery Dungeon = the Condemned Crossing door.** The 8×8 Guild Hub
  free-roam board is out of the flow: the HQ is the hub. The delver page
  (map.js `_mdRenderCharSelect`) now carries the party menu that sat at
  the hub's cave gate — hero job select, roster companions with a job
  each (3 max, `_mdCharSel.party`), the fresh-save first-companion pick
  joins automatically — and ENTER goes straight to Floor 1 via
  battle.js `window._mdLaunchRun(cfg)` (`_mdStartRun(cfg, immediate)`).
  The run's end has one button, "Return to Headquarters"
  (`_mdReturnToHub` → `_mdExitToMenu` → `backToMainMenu` →
  `_hqReturnOrMenu`, landing at the door). `md_hub` (board, mode,
  `hubFreeRoam`, `_mdOpenPartySelect`, the `mdParty` dialog) stays
  registered and unused. Recruit / roster strings say "headquarters".
- Files: three-renderer.js, map.js, battle.js, index.html
  (`?v=20260905c-cors`); DOOR_MASTER.md Part D, PLAYTEST_NOTES.md.

### 2026-09-05 (rev 4) — the camera snap on A: a pointer-lock artifact, not the auto-follow
- Diagnosis: with the mouse still, a keypress cannot touch the yaw (only the
  mouse handlers write it — verified headlessly). What does fire on a
  keypress since rev 2 is the pointer-lock grab, and Chrome reports the
  cursor's jump to the lock origin as one huge movementX/Y on the first
  mousemove after the lock engages (and again as the cursor reappears on
  release). That single delta was the snap on A.
- Fix: `H.onPointerLock` stamps the transition; `_hqMouseDelta` drops the
  first two mousemoves after it and everything inside `HQ_LOCK_GRACE`
  (180 ms), and rejects any single delta over `HQ_MOVE_MAX` (220 px) as an
  artifact. Applies to the locked and the hover-look branches alike.
- `_hqTryLock` funnels every lock request (entry, WASD/SPACE keydown, canvas
  click, panel close, V) and swallows the rejected promise newer Chrome
  returns ("a user gesture is required" / "already locked") — one uncaught
  rejection per keypress otherwise.
- Camera boom eased (`c.f`): 32-step march, pulls in over 40 ms, eases back
  out over 450 ms — passing the desk / a pillar / the stair mass no longer
  pops the eye a metre in a frame.
- Files: three-renderer.js, index.html (`?v=20260905d-cors`).

### 2026-09-05 (rev 5) — the walking 180° snap, root-caused for real: battle.js was releasing the HQ's pointer lock
- Symptom (user): hold W, walk a few steps, the camera snaps ~180° and the
  walk reverses (WASD is camera-relative, so a yaw flip reverses travel).
  Rev 4's delta gates did not stop it.
- Root cause: battle.js's Strike Mode module (the TPS/FPS rig for shooter
  battles and the MD Guild Hub roam) listens to `pointerlockchange` on the
  renderer's SHARED canvas and set its `locked` flag for ANY lock on it.
  Its permanent rAF `_frame` then runs "release a stale pointer lock when
  the mode ends" (`locked && !_enabled()`), and `_enabled()` is false in
  the HQ — so every HQ lock (entry click, canvas click, the WASD/SPACE
  grab) was exited ONE FRAME after it engaged, and its capture-phase
  mousemove swallow ate the HQ's aim while it lasted. The HQ keydown grab
  re-requests every 1.5 s while unlocked, so walking produced a lock →
  release cycle every 1.5 s ("a few steps"). Each cycle warps the OS
  cursor (to the lock origin, then back to where it was); that jump
  arrives in the HQ's UNLOCKED hover-look branch as one huge movementX —
  up to half the screen width, ≈ 180° at 0.0032 rad/px. Verified by
  reading: `_canvas()` is `ThreeRenderer.getCanvas()`, the loop starts at
  load, and only the mouse handlers / room entry write `H.cam.yaw`.
- Fix (battle.js): `locked = el === _canvas() && _enabled()` — the module
  owns a lock only while it is live, so it never releases or swallows the
  HQ's. Its own stale-lock release still works (the flag was set while
  enabled).
- Bandaids removed (three-renderer.js): rev 4's `HQ_LOCK_GRACE`,
  `HQ_MOVE_MAX`, `_hqMouseDelta`, the `pointerlockchange` stamp handler
  and the drop-first-two-moves logic are gone; movementX/Y are used raw in
  both the locked and hover-look branches. Those gates also swallowed real
  fast flicks (>220 px per coalesced event). `_hqTryLock` (the promise-
  rejection swallow) and the eased camera boom stay — neither is a
  workaround for this bug.
- Rev 4's diagnosis in this log ("Chrome's first-mousemove jump") was
  wrong on the cause; the cursor jump was real but it was OUR lock churn
  producing it.
- Files: battle.js, three-renderer.js, index.html (`?v=20260905e-cors`);
  DOOR_MASTER.md Part D.

### 2026-09-06 — the cast moves in: fifteen rigged characters at their posts, the Player as the avatar
- **What the user delivered**: the story cast (DOOR_MASTER A16 /
  `DOOR_STORY.md` §2) and fifteen rigged Meshy models in R2
  `Assets/Sprites/Races/maincharacters/` — verified this session with
  HEAD requests and a JSON-chunk rig check (1 skin, 24 joints, `Hips`
  root, 1.70 m normalised bounds on every one; `Agent_Glass` and
  `Janitor` are named WITHOUT `_biped`, everything else with it; `kit` is
  lowercase). No Forrest / Sedaniel GLB exists there (404s on the obvious
  names) — they borrow the roster bigfoot and Honda Civic.
- **sprites.js `DOOR_CAST_MODELS`** (after `getRace3DModel`): `_mkCast
  (prefix, {heightRatio, female, file, lib})` = the roster's `_mk3d` on
  the `maincharacters` folder + every building pose + the female
  idle/walk where marked (the roster's gendered sweep only covers
  RACE_MODELS_3D). `_CAST_POSES` = ten library slots the building can
  ask for: hqSit `Sitting_Idle_Loop`, hqSitTalk `Sitting_Talking_Loop`,
  hqTalk `Idle_Talking_Loop`, hqPhone `Idle_TalkingPhone_Loop`, hqArms
  `Idle_FoldArms_Loop`, hqFix `Fixing_Kneeling`, hqPush `Push_Loop`,
  hqReach `PickUp_Table`, hqCrouch `Crouch_Idle_Loop`, hqNo
  `Idle_No_Loop` (UAL1 = lib 0, UAL2 = lib 1 — both inventories are now
  listed in doorhq.test.js). Heights: humans 0.94–1.04, Kit 0.88 (the
  roster catgirl), the Doorman and the Janitor both 1.0 on purpose.
  `getCastModel(id)`; `EW_DISABLE_CAST` (console) removes the whole cast
  and the Player avatar at once.
- **data.js `DOOR_CAST`** (before the DOOR_HQ window exports): per
  member name / title / dept / `model` or `race` / gender / `base` (the
  roster race the unit template is borrowed from) / `hidden` / `lines`
  (USER-authored, A15) / `spots`. A spot is a room + a polar (deg, r,
  level), box (x, z) or bay-local (deg, r) position + `face` + optional
  `pose`, `reach` (talk radius, 1.75 default — Rhonda's is 3.4 so the
  counter is not in the way), `rad` (blocker radius; Sedaniel 1.5), `p`
  (weight; the member's weights summing under 1 = sometimes nowhere),
  `minClearance` / `maxClearance` (wired, unused), `doing` (the stage
  direction the panel shows). `hqCastInRoom(roomId, profile, {salt,
  clearance})` draws ONE spot per member per session (seeded with
  `hqHash(id | salt)`, the salt is rolled once per page load) — so a
  character stays where you found them until reload, and is never in two
  rooms at once. `hqCastLine(id)`.
  - Rhonda `129°/18.95 m` on the reception chair, face 309 (the centre),
    hqSit, reach 3.4 · Kit `123.5°/16.4` crouched at the counter's public
    side (p .65) or `245°/19.5` at the Records door (p .35) · the Janitor
    `146.5°/18.55` mopping (hqPush, face 244, p .7; a `mop` prop now
    leans on the bucket at 143.8°/19.2) or IN THE OFFICE at `(−0.95,
    1.45)` facing the west shelves (hqReach, p .3) · Locke `20°/12.7` on
    the hall side of the briefing half-ring, face 20, hqTalk · Belle on
    the teal chair `246°/12.1` (face 246 = the chair's rot 180, p .6) or
    the couch `58.5°/15.55` (p .4), hqSit · Glass `199.5°/19.35` by the
    water cooler, hqArms · Knox on the Training Room's folding chair
    `(8.6, 2.4)` face 260, hqSit (p .6) or `152.5°/19.5` outside the
    office door (p .4) · Ringer `(8.2, −4.6)` face 250, hqArms · Elle
    `351.5°/22.4 L1` by the elevator, face 172, hqPhone (p .5) · Otto
    `307.5°/22.9 L1` at the Canon Office door or `82°/22.9 L1` beside
    Arcane Engineering, hqFix, a `cardboard_box` crate at 304.8°/22.95
    and 79.2°/22.95 (r chosen to pass the mezzanine-band test) · Forrest
    `200.5°/22.35 L1` face 200 (the wall) · Sedaniel bay_terrestrial
    `−38°/10.6` face 52 (along the corridor). All checked against the
    prop table for collisions (≥ 0.7 m from every foot) and against door
    trigger arcs (Otto is 7.5° off his doors so the door prompt does not
    fight his).
  - The Training Room's plate reads ROOM 64 · …; the egress door's desc
    names it.
- **three-renderer.js**: `_hqSpawnCharacter(spec)` takes `spec.def`
  (a cast member brings its own model def — the roster lookup is the
  fallback), `spec.sub / reach / pose / rad / cast / doing`; new
  `_hqSpawnCast(room, opts)` runs after the agents and before the roster
  vessels; `_hqTickChars` plays `ch.pose` for a non-player once
  `e.actions[pose]` exists (the bake is async — idle until then); the
  target picker uses `ch.reach` and carries `sub / cast / doing` into the
  target. **The avatar**: `opts.avatar.cast` → `getCastModel(cast)` as the
  player's def (map.js `_hqAvatar` returns `{cast: 'player', race: 'men
  in black', gender: 'male'}` unless `EW_HQ_AVATAR` is set; `'vessel'`
  keeps the old most-played rule).
- **map.js** `_hqNpcPanelHtml`: `kind === 'cast'` → name / title header,
  the member's own line (`hqCastLine`) in the big serif when there is
  one, the `doing` stage direction in the desc font, NOTED. The E-prompt
  says TALK with the member's title as the sub-line (the target's `sub`).
- **Seating**: a seated member stands at the CHAIR's spot facing the
  chair's heading (deg + 180 + rot for a polar chair) — the library
  sitting clip lowers the hips in-clip, so no y offset is needed; the
  chair's own blocker plus the NPC blocker keep you off their lap.
- **Tests** (`doorhq.test.js`, +4): registry parity (every `DOOR_CAST`
  model id is a `_mkCast` entry in sprites.js SOURCE — sprites.js does
  not evaluate headlessly on its own; every wired model is named by a
  member), every pose clip is in its library's listed inventory, every
  spot is a real room on walkable floor (ring / slab band / corridor /
  box), the draw's invariants over 40 salts (one room per member, hidden
  never, Elle sometimes away, the Janitor seen in both his rooms,
  Rhonda never leaves), the code hooks by source scan.
- **Not done**: no story gating (`minClearance` unused), no cutscenes, no
  walking NPCs (poses are static loops), no squeak on the office door
  (DOOR_MASTER C-18), Kit is not in the party (C-20), no portraits for
  the cast (no `portrait.png` in the folder — a 128×128 per member would
  give the panel a face). Playtest not run (RULE #1c).
- Files: sprites.js, data.js, three-renderer.js, map.js, doorhq.test.js,
  index.html (`?v=20260906a-cors`); docs: this file, DOOR_MASTER.md (rev
  16), DOOR_STORY.md (rev 1), CLAUDE.md, PLAYTEST_NOTES.md.

### 2026-09-06 (rev 2) — the cast PLAYTESTED: seats, the round desk, the mop, Room 64
User feedback on rev 1 (with permission to playtest): Rhonda belongs INSIDE
the round dispatch desk; nobody was sitting on chairs properly; Belle faced
the wall; the Janitor was "pushing nothing". Every placement was then
screenshot-driven — `playtest_hq.js` (repo tooling, see below) enters a
room with the LOCAL edits, forces each member to a chosen spot, walks a
first-person eye in front of / over the shoulder of every character and
saves the frames to `shots/hq/`.
- **Why nobody sat properly — and the fix**: the UAL sitting clip slides
  the pelvis ~0.5 m BEHIND the root (the character's feet stay put, the
  hips move back onto an imaginary chair). Retargeted as-is, a member
  placed at a chair's spot sat half a metre behind it (Rhonda vanished
  behind her chair back; Belle only looked right because the teal chair
  faced the other way). New bake flag **`pinXZ`** (three-renderer.js
  `_libBakeClips`, sprites.js `_mk3d` lib merge): keep the clip's
  VERTICAL hips travel, pin the ground-plane travel to the rest spot. The
  hips now drop straight onto the seat (measured with `dev.bone`: hips
  0.53–0.56 m up, ≤ 5 cm off the spot). Applied to hqSit / hqSitTalk /
  hqFix / hqPush / hqReach / hqCrouch. The chairs were never too small —
  the seat heights match (office/teal 0.96 m tall → ~0.48 seat; folding
  0.84 → ~0.42).
- **Rhonda inside the dispatch desk**: an `office_chair` on the well floor
  (`y: 0.05`, deg 180 r 2.05, facing the BELL console side), Rhonda seated
  on it facing south, reach 5.0 (the console still wins the prompt when
  you stand at it; she takes over as you slide round the counter), a
  `papers_b` stack on the counter above her. The "Take a number" agent in
  the well now faces north so they work opposite halves. The reception
  wedge keeps a SEATED **INTAKE CLERK** (a generic agent: room `agents[]`
  entries accept `pose` / `gender` / `label` / `reach` / `y` now; an agent
  with a pose borrows the MIB def with the cast poses merged, and the bake
  cache key includes the slot count so the HQ bake and the battle bake of
  the same MIB model never collide).
- **Belle** sits on the teal chair at 257°/13.9 (the one facing the hall,
  face 77) — she sees every door; the couch spot (p .4) faces the centre.
- **Kit** — the crouch clip retargeted as a hover; replaced by a
  `folding_chair` at 158°/6.7 by the dispatch counter, Kit seated on it
  facing Rhonda. The Records-door scratching spot is dropped for now (no
  clean "scratching" clip; `Interact` loops as a reach — try it later).
- **The Janitor leans on his mop**: new **held props** — `spots[].hold =
  { key, bone, upright, pos, rot, h }` parents a catalogue GLB to a hand
  bone once the rig is in (`_hqAttachHeld`); `upright: true` re-aims the
  holder to the world axes every frame (`_hqTickChars`), so the prop
  hangs plumb from the hand at real size and only rides the hand's
  position — pos/rot are then WORLD-space. Pose `hqLean` (`Idle_Rail_Loop`,
  forearms forward at ~1.1 m) + the mop GLB (which stands on its HEAD:
  base = bristles) at pos [0, −1.05, 0] → both hands on the handle, head
  on the floor. `hqStaff` (`Sword_Idle`) stays wired as the alternative.
  The standalone egress `mop` prop is gone (it is in his hand). His office
  spot keeps `hqReach` at the shelves — reads as rummaging.
- **Otto** kneels AT the door jambs now (312.5°/23.1 at the Canon Office
  door, 87.5°/23.1 at Arcane Engineering — 1 m off the door centre, 0.55 m
  off the wall), the crates beside him (309° / 84°, r 22.95).
- **Room 64**: the training room's procedural wall sign reads
  `ROOM 64` (was `ROOM 8×8`; both the Holo-Sim board's and the walkable
  room's `sign('tr_south', …)`).
- **Dev API** (three-renderer.js `ThreeRenderer.hq.dev`): `teleport({deg,r
  | x,z, level, y, face, pitch, dist, fp})`, `lookAt(x, z, pitch)`,
  `chars()` (id/kind/label/pos/deg/r/face/pose/anim/actions/attached),
  `bone(charId, name)` (world + root-relative position, scale),
  `props()`. data.js `hqCastInRoom(room, profile, {force: {id: spotIdx}})`
  pins members for the probe (−1 = absent).
- **`playtest_hq.js`** (repo root, `node playtest_hq.js <room> [force-json]
  [tag]`, server on :3000): serves sprites.js / data.js / three-renderer.js
  / map.js from the repo; every other CDN asset is fetched NODE-SIDE
  (`NODE_USE_ENV_PROXY=1`) into `.asset-cache/` and fulfilled, because in
  this sandbox Chromium cannot reach the CDN through the proxy (connection
  resets) while Node's fetch can — the browser runs with
  `--proxy-server=direct://`. Waits for every character's model + baked
  actions (a static model like the Honda Civic has 0 actions — the wait
  gives up after 4 min, harmless), prints `chars()` + hips/hand bones,
  shoots `<room>_<tag>_<char>_{front,34|ots,ots2}.png` (over-the-shoulder
  angles when the front eye would be inside a wall) and a third-person
  `spawn_tp`. NOTE `ThreeRenderer` is a script-scope const — test it with
  a bare identifier in `page.evaluate`, never `window.ThreeRenderer`.
- Verified in frames: Rhonda seated in the well (head + shoulders over the
  counter), the intake clerk seated at the wedge, Belle on the hall-facing
  chair and on the couch, Kit on her folding chair, Knox on the Room 64
  chair and outside the office door, Ringer arms folded at the lockers,
  Locke talking at the half-ring, Glass at the cooler, Elle on the phone
  by the elevator, Otto kneeling at both doors, Forrest nose to the wall,
  the Janitor leaning on the mop / rummaging the closet shelves, Sedaniel
  parked in Bay 1, the Player model in third person in every room, the
  ROOM 64 sign.
- Files: sprites.js, data.js, three-renderer.js (map.js unchanged since
  rev 1), doorhq.test.js, index.html (`?v=20260906b-cors`), playtest_hq.js
  (new, repo-only), this file, DOOR_MASTER.md Part D, PLAYTEST_NOTES.md.

### 2026-09-07 — the Room Register (docs only; no game files touched)
The user handed over ~75 room / map ideas ("eventually all the maps become
walkable rooms inside the HQ just like the Training Room"; every map gets a
room number that makes sense; trim the repeats; say what assets are
needed). Written up as **Phase 7 (§4)** + **§5.6 (assets)**:
- **The register** (7.3 / 7.4): a number for all 29 sites + the two
  facility boards + 15 HQ rooms / counters — the user's numbers kept
  wherever given (i, 4, 23, 51, 56, 64, 88, 90S, 101, 404, 420, 444, 666,
  777, 888, 999, 1225, 1945, 1969, 2012, 2047, 9600, H-20 …); Claude filled
  the blanks (180 → Hollow Earth, 2D Flat Lands, 11 Babel, 12 Olympus, 512
  Skinwalker, 14179 Shasta, 1 Reception, 42 Records) and proposes three
  swaps for the user's yes/no (MASTER C-22): stadium 42 → 50, Disaster City
  911 → 1954 (C-24), Gladiator 300 → 80.
- **Seven new sites, wave 1** (7.6): 13 Haunted House (the gothic gap), 33
  The Lodge, 21 The Strip, 1954 Downtown (the kaiju / superhero gap), 6
  Saturn (the Cube's home), E4 The Looking-Glass, 0 The Singularity — each
  with its board, setting, natives, leaf and hero prop. Thirteen more on
  hold (7.7); the rest cut or folded into what stays (7.8).
- **The walkable site** (7.2): the Training Room pattern generalised —
  `kind: 'site'` rooms generated by `hqSiteRoom(mapId)`, the Δ as
  `InstancedMesh`-per-texture room geometry (within the no-tile-renderer
  guardrail; it is ROADMAP §4 item 1's fix too), the near setting around
  it, the map's sky, natives as NPCs, the crossing launched from inside.
- **Seven bays** (7.5, MASTER C-23): BAY 7 · URBAN; Vatican → Diplomatic;
  Atlantis → Hollow.
- **Dailies** (7.9): Daily Office Operations Requirements = `FORM 365` in
  the Clock Room (247), seeded like Code Red.
- The adding-a-site checklist (7.10) records that server.js `MAP_POOL` is
  hand-synced and unchecked — a parity gap to close with the first new site.
- Files: this file (rev 16), DOOR_MASTER.md (A10 note, Part C rows 22–24,
  Part D). Nothing shipped; `npm test` green on the untouched game files.

### 2026-09-07 (rev 2) — 7.1 SHIPPED: the numbers are on the doors
Phase 7's entry step, exactly as 7.1 specified it — a data edit, a helper,
and the number printed wherever a site or a room is named. No new files,
no art, no engine work (7.2 is untouched).
- **data.js — the register itself.** `roomNo` (a STRING, so `i`, `2D`,
  `90S`, `H-20` ride the same field) + `why` (the one-clause hook from
  the 7.3 table) on all 29 `DOOR_HQ.thresholds`; Atlantis carries
  `sub: 'DEEP OCEAN ORICHALCUM RESEARCH'` (a threshold's `sub` now replaces
  the bay's THRESHOLD · SECTOR sub-line, via `hqBayRoom`). The numbered HQ
  places (7.4): `rooms.office.roomNo = '101'`, `rooms.training.roomNo =
  '64'` (the hand-written `ROOM 64 ·` left the training room's `sub` — it
  is on the field now), and on the egress doors with no interior yet:
  Reception **1**, Records **42**, Medical **1111**, the Bureau of
  Continuity **№ — CONTESTED** (7.0 rule 2: a joke and a policy). Bays wear
  bay numbers, not room numbers; the Quartermaster, Arcane Engineering and
  the elevator stay blank. New `DOOR_HQ.facility`: the two facility boards
  wear the room they are projected in — `prebuilt_training → { room:
  'training' }` (so the board and the room are ONE place, one 64) and
  `prebuilt_holosim → 404`. The elevator door carries `floors: ['B', 'G',
  'M', '2' … '12', '14', 'PH']` — there is no 13.
- **Helpers** (window.*): `hqRoomNo(idOrMapId)` — a launch map (Δ suffix
  stripped, so the Δ board wears the site's number), a facility board, a
  room id, or any door / counter id in the building; `hqDoorNo(entry)` —
  what a PLATE shows: the entry's own `roomNo`, else its mission's, else
  the room it opens into (the egress door to the Training Room says ROOM 64
  without carrying a second copy of the number); `hqRoomNoCompare` —
  plain numbers ascending, then the alphanumerics; `hqRoomRegister()` —
  every numbered place, sorted, with kind / room / bay / why (36 today).
- **Where it shows.** three-renderer.js: `<em>ROOM 56</em>` in small caps
  over the name on every door plate (`_hqPlateNo`), counter plate and box
  room plate (`.hq-plate em`); the Training Room's south sign reads the
  room's `roomNo`. map.js: the strip's room name (`ROOM 64 · TRAINING
  ROOM · …`), the [E] prompt, the threshold panel header (number + hook:
  `ROOM 56 · the 56 Aubrey holes`), the department door header, the bay
  door panel's rows, the elevator panel's FLOOR PANEL line ("There is no
  13. Room 13 is filed in Bay 1, not on a floor."), and the BUILDING
  DIRECTORY: the current room's rows carry their number, and below them
  THE ROOM REGISTER — every numbered place in the building in register
  order, with WALK (in this room) / GO (into the bay at that threshold,
  the training room at the RANGE console for 404, the egress at a
  department door). match-select.js: the SITE FILE kicker prints
  `ROOM 56` after the case number (`SITE_FILE_LABELS.room`). battle.js:
  the result stamp's case line is `CASE No. EW-nnnn · ROOM 56`; the loading
  screen's site-file card is filed as `SITE FILE · ROOM 56 · STONEHENGE`.
  Both are derived locally from `activeGameMode` on either client — no
  relay (RULE #2 satisfied by construction).
- **doorhq.test.js** (five new tests): every launch map has a string
  `roomNo` and a `why`; the Δ board resolves to the site; the facility
  boards are 64 / 404 and never sites; the register is UNIQUE (one number,
  one place), every row round-trips through `hqRoomNo`, every site appears
  once with its bay, the order is numeric-then-alphanumeric; bay doors and
  doors into numbered rooms carry no number of their own; Atlantis's
  sub-line; the elevator skips 13; a source scan for every surface above.
  `npm test`: 130 tests, all green. index.html bumped to `20260907d-cors`.
- **REC still open** (MASTER C-22): the stadium ships as **50** and Records
  as **42** — the user's yes/no can flip either with a one-field edit.
  Not playtested (RULE #1c); what to eyeball first: a bay threshold plate
  (ROOM line over the name), the directory's register, the result stamp.
  Next: 7.5 (Bay 7 · URBAN, a data edit + the mezzanine placement, awaiting
  C-23) or 7.2 (the walkable site, the engine piece — D.U.M.B. first).

### 2026-09-07 (rev 3) — 7.5 SHIPPED + THE CONTAINMENT RING stage 1: seven bays, and the bays join hands
The user's yes to C-22 and C-23, and the ask that started the session:
"the hallways with the different doors can be made longer and go all the
way around, or at least halfway." No new files; one data.js delivery with
its renderer and map.js companions; docs.
- **7.5 — Bay 7 · URBAN (data.js).** `DOOR_HQ.sectors.urban` (`cities ·
  the strip · the night shift`) takes Cyberpunk City from Celestial and the
  Stadium from Terrestrial; Vatican City → Diplomatic; Atlantis → Hollow
  (its sub-line gains `the deep`). The seventh egress door hangs on the
  mezzanine at 180° (`bay_urban`, `leaf_glass` — the shopfront, per 7.5),
  30° clear of Bays 5 and 3; the two cardboard boxes that stood there moved
  to 133° / 136°. The bay guard's line and three overheard lines for the
  urban bay, and the guards whose sites moved say so (Terrestrial no longer
  lists a stadium, Diplomatic counts five, the Atlantis drip line moved to
  Hollow, the Cyberpunk complaint line to Urban) — Claude-written bay
  flavour in the Phase 2.6 register, **the user may rewrite any of it**
  (A15). No map, threshold, room number or server row changed:
  `hqSectorOfMap` / `doorSiteState` / the Code Red pool / the register all
  derive from `sectors`, so the moves are one edit.
- **5.4a stage 1 — the ring (data.js + three-renderer.js + map.js).**
  `bayShell.ring: true` + `ringLeaf: 'leaf_wired_double'`. New
  `hqBayRing(sector)` → `{ level, count, cw, ccw }`: the bays on the same
  floor of the egress sorted by their door angle, wrapping; null with the
  ring off or a bay alone on its floor. `hqBayRoom` adds two doors per
  linked bay — `cap_cw` at +half and `cap_ccw` at −half, `cap: 'cw'|'ccw'`,
  the wide fire door, `action: { sector: <neighbour>, at: <the far side's
  opposite cap> }`, `ring: true` — and steps the cap-side dressing back 2°
  so the frame (a 3.3 m panel on the 4 m cap, protruding 0.5 m) is clear.
  The room carries `level` and `ring`. Renderer: `_hqCapWall(room, door)`
  returns the flat-wall shape `_hqBoxWall` returns (`wx, wz, nx, nz, yaw`
  — the slab's inward face at 0.15 m, the normal = the arc's tangent back
  into the corridor), and `_hqBuildDoors` uses it for `door.cap` on a bay,
  so the panel, the plate, `_hqFindTarget`, `_hqTickAutoEnter` and
  `_hqGoTo` (spawn 1.6 m in front, door at your back) all take the
  existing box-door path. The leaf is static, so E walks through (as with
  the vault / portcullis). map.js: a sector door's `at` is honoured in
  `_hqDoorDirectAction` and the bay panel's button (`THROUGH THE RING ▸
  <SECTOR>` on a cap door; the panel itself is the neighbour bay's — its
  sites, checklists and Code Red brief). Rings today: downstairs 1 ⇄ 4;
  upstairs 2 → 5 → 7 → 3 → 6 → 2 — with Quarantined locked, the doors INTO
  Bay 6 from 3 and 2 read SEALED (the lamp is the neighbour's), so the
  mezzanine ring is open from 2 round to 3 until the chapter opens 6.
- **doorhq.test.js** (four new tests; the Atlantis sub-line test follows
  it to Hollow): seven sectors, Bay 7 on the mezzanine at 180° with
  nothing in its panel, the rebalance; every linked bay wears two cap doors
  on its caps, wide, unnumbered, leading to `hqBayRing`'s neighbours on the
  same floor, reciprocated exactly by the far cap, wearing the neighbour's
  lamp, with no dressing inside the frame; one clockwise lap from any bay
  comes home having visited every bay on its floor once; the ring switches
  off cleanly; a source scan for `_hqCapWall` and the two map.js `at`
  sites. `npm test`: 137 tests, all green. index.html → `20260907i-cors`.
- Not playtested (RULE #1c). What to eyeball first: stand in Bay 2 and
  walk clockwise to the cap — the fire door, its plate (`BAY 5 ·
  DIPLOMATIC · CONTAINMENT RING · CLOCKWISE`), E, arrive in Bay 5 at its
  counter-clockwise cap with the door at your back, keep walking. Then Bay
  7's glass door on the mezzanine at 180° over the training door.
- Next: 7.2 (the walkable site — D.U.M.B. first), then 5.4a stage 2 (one
  continuous ring corridor) once the site rooms hang off it; 7.9 dailies;
  4.1 the case-file screen.

### 2026-09-07 (rev 4) — 7.2 stage 1 SHIPPED: Room 555 is a room you walk
The plan's next step ("7.2, D.U.M.B. first"). No new files; data.js +
three-renderer.js + map.js + doorhq.test.js + index.html; docs.
- **The decision**: a site room is a **box room** (`kind: 'box', fx:
  'site', site: <mapId>`), not a new `kind: 'site'`. The renderer branches
  on `kind === 'box'` in a dozen places (shell, flat-wall doors, counters,
  props, `_hqSurface`, `_hqAirOK`, the camera boom, `_hqGoTo`); forking
  them for an indoor site would have bought nothing. `kind: 'site'` stays
  reserved for the outdoor rooms that need the map's sky and far roster.
- **data.js.** `DOOR_HQ.siteRooms` (`built`, `shell` defaults, `shells[id]`
  texture overrides, `flavour[id]` = guard line + overheard lines + extra
  props — Claude-written placeholders, the user may rewrite, A15).
  `hqSiteRoomId(mapId)` → `site_<id>`; `hqSiteBoard(mapId)` (the finished
  Δ, a facility board under its own id); `hqSiteBoardInfo(mapId)` → `{ w,
  h, base, cells[y][x]: { key, lvl, walk, fluid, tint }, walls, mons, objs,
  nexus }` with `HQ_SITE_HAZARDS` / `HQ_SITE_FLUIDS`; `hqSiteRoom(mapId)`
  → the room: a 22 m box (8 × 1.75 + 4 m walkway each side, h 4.4), the
  way in on the south wall wearing the threshold's leaf (`action: { room:
  bay_<sector>, at: 'site_<id>' }`), the CROSSING console (`action: {
  overlay: 'crossing' }`, `site: id`, verb CROSS) at a tanker desk on the
  west wall with the CRT / phone / papers / clipboard, four fluorescents
  (`shell.lights`, one strip + point light per quarter), lockers, clock,
  breaker, extinguisher, boxes, chair, the wet-floor sign, one guard, three
  walkway spots hinted with the natives (`hqMissionPool(id, 3)`: mad
  scientist, telepath, black goo for D.U.M.B.), the spawn on the walkway
  facing the board. `hqRoomNo` resolves a site room to its site's number,
  `hqDoorNo` resolves a door INTO a site room and a counter with `site` the
  same way, the register's site row carries `siteRoom`. Rooms are
  generated at load from `siteRooms.built` (`['prebuilt_dumb']`).
- **three-renderer.js.** `_hqBuildSiteBoard(room)` (after the training
  pit; wired in `_hqEnter` on `fx === 'site'`): the cell tops as one
  InstancedMesh per terrain/tint (PlaneGeometry, one repeat per cell, the
  Δ tint multiplied, a 12% self-lit lift), raised cells as one instanced
  unit box per group scaled to the level height (`fillAbove: 'surface'`
  look) — each a rect blocker `{ top: lvl × 1.75, step: 1.81 }` — lakes as
  a BackSide box sunk one level with a translucent sheet at −0.3 m (lava
  orange + glow, oil black, bogs purple, water blue), edge walls as 0.14 m
  slabs with a cap (blockers with no top; `low` walls are steppable, `see`
  walls translucent), monuments via `_monBuilders()[kind](_monRng(seed))`
  fitted foot / maxH like the battle's classic branch and seated on the
  cell top (solid ones block), trees as trunk + crown, the nexus as two
  rings + a glow at the 2×2 centre, the lit seam grid, A–H / 1–8, the
  hazard plate before the way in, two signs (the site's name + ROOM № over
  the board, the site file's status by the door), eight red corner lamps
  and the fluorescent strips. The walker: `_hq.site = { N, C, half, cells
  }` + `_hqSiteCellAt(x, z)`; `_hqSurface`'s box branch returns the cell's
  top for pits and null for `walk: false`, the climb tolerance on a board
  cell is one level (+0.06) and the drop tolerance one level (+0.1), and
  the blocker loop honours a per-blocker `step` (`b.step ||
  HQ_STEP_TOL`); `_hqAirOK` refuses hazards and a pit's floor; the landing
  over a pit is the pit's floor; `_hqCamBlocked` keeps the boom out of
  raised cells and above a pit. Box shells draw a strip per `shell.lights`
  entry and `_hqEnter` hangs a point light per entry; the box plate reads
  the site's number when the room has none. `_hqSpawnPopulation` honours a
  spot's `race` hint (a rigged native spawns as `hq-native-<i>`; hinted
  races leave the roster draw).
- **map.js.** `_hqSiteRoomId` helper; `_hqDoorDirectAction`: a threshold
  with a room → `{ room, at: 'egress' }` (the prompt says ENTER, not OPEN);
  `_hqCrossingHtml` builds the threshold panel for the room's site from
  the console (`doorSiteState` on a synthetic mission door, the note / why
  / roomNo from the threshold); the launch buttons from that panel pass
  `doorId: 'crossing'` so `_hqReturnOrMenu` rebuilds the site room at the
  console; the Code Red overlay offers WALK TO THE CONSOLE inside the site;
  the directory's site row GOes into the room (YOU ARE HERE when in it);
  the bay threshold panel (still shown for sealed / clearance doors and by
  RESPOND) gains WALK IN ▸ ROOM №.
- **doorhq.test.js** (three new tests): the board info for D.U.M.B. (4
  steps, 2 blocks, 8 cell walls, the two grey tubes, the nexus at 3,3, no
  trees; Backrooms' almond water wades, Hell's lava never walks); every
  built site is a launch map with a threshold and generates the room —
  kind / fx / site / sector, no roomNo but `hqRoomNo` resolves, the grid
  at 1:1, ≥ 2 m walkway, textures, four lights, the way in on the south
  wall wearing the threshold leaf (wide agreeing with the catalogue) and
  landing at the bay's threshold door, the console at the desk with the
  site's number, native hints from the pool standing on the walkway, the
  spawn facing the board, the register row's `siteRoom`; a source scan of
  the renderer and map.js hooks. `npm test`: 140 green (141 with the
  server smoke test skipped — no node_modules here). index.html →
  `20260907j-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 1, the bulkhead
  (ROOM 555), E — you should stand on the south walkway facing the board,
  the plate reading ROOM 555 · D.U.M.B. over the far wall, the tram-rail
  tint on rows 3–4, the two +2 bulkhead cubes and four server-bank steps
  (walk up a step, walk off it), the holding cell's four walls (solid),
  the specimen tubes at A3 / H6, the teal nexus ring at the centre, three
  natives on the walkways, the guard by the door. Then the console: E →
  the site file with CROSS ▸ Δ / DEEP; cross, win or lose, and you should
  come back standing at the console. Then Bay 1's door panel from the
  Code Red row (RESPOND) still launches directly.
- Next: the plan's order — 999 CERN and 90 Backrooms (indoor, one id each
  in `siteRooms.built` + a `shells` / `flavour` entry), then 1945 Nuketown
  and 50 Stadium (outdoor: the sky + far roster, the `kind: 'site'` work);
  the map's `near` setting inside the room; 5.4a stage 2 once the site
  rooms hang off the ring; 7.9 dailies; 4.1 the case-file screen.

### 2026-09-07 (rev 5) — 7.2 stage 2 SHIPPED: Rooms 999 and 90, each in its own light
The plan's next step ("999 CERN and 90 Backrooms, one id each in
`siteRooms.built`"). No new files; data.js + three-renderer.js +
doorhq.test.js + index.html; docs.
- **data.js.** `siteRooms.built` → `['prebuilt_dumb', 'prebuilt_cern',
  'prebuilt_backrooms']`. The generator was already general — the work was
  making the two rooms not look like D.U.M.B. with the number changed, so
  the shell grew a **`mood`**: `lamp` / `glow` (the containment lamps in
  the corners), `strip` (the wall strips), `light` (the fluorescents' point
  lights and the box shell's strip + glow), `signN` / `signS` (the two
  signs' palettes) and an optional `signLines` (`{ n: [3 lines], s: [3
  lines] }` replacing a sign's text outright). The default mood in
  `siteRooms.shell` IS D.U.M.B. (red lamps, white strips); `hqSiteRoom`
  merges the site's `shells[id].mood` over it into `shell.mood`.
  - **999 · CERN**: speckled stone over concrete, teal dado + trim,
    acoustic ceiling, h 4.6, conduits on; blue lamps (`0x6ac8ff`), blue
    strips and light, the north sign in the collider's palette, the south
    warning in red. Flavour: the control bank in the NE corner (two round
    cabinets wearing CRTs, an office chair), spares shelving on the east
    wall, two vent grilles, the pipe runs at 4.1, a box. Guard + five
    overheard lines (Claude placeholders, A15).
  - **90 · BACKROOMS**: office carpet, beige drywall for wall / dado /
    trim (the kit has no wallpaper — the Δ's own +2 wallpaper blocks bring
    the yellow), acoustic tile, **h 3.9** (the board's 3.5 m blocks clear
    it; the signs and lamps now hang from `S.h` instead of fixed heights),
    dado 0.7, **`pipes: false`**; yellow lamps and strips, warm light, both
    signs in the yellow palette with `signLines` (`LEVEL 0 · NO EXIT` /
    `THE EXIT SIGN IS A LIE`). Flavour: an office chair facing the NE
    corner, three EXIT signs over walls with no door in them (n / w / e —
    the way in is the `leaf_exit` on the south), a water cooler, a filing
    cabinet, an office plant, loose paper on the carpet, a desk fan on the
    floor, four more ceiling fluorescents on the walkway (the hum). Guard +
    five lines.
- **three-renderer.js.** `_hqBuildSiteBoard`: `var mood = S.mood || {}` →
  `lampC` / `glowC` / `stripC`, `signY = S.h − 0.9`, `lampY = S.h − 1.0`,
  the sign palettes merged over the old defaults, `signLines` honoured;
  **water wears the Δ's tint** on its sheet when it has one (the Backrooms'
  almond water was rendering blue; lava / oil / bogs unchanged). The box
  shell's fluorescent strip + glow and `_hqEnter`'s point lights take
  `S.mood.light` when a room has one (plain box rooms unchanged).
- **doorhq.test.js.** The built-site test now requires CERN + Backrooms,
  no duplicates, a mood on every room (four colours, two palettes,
  `signLines` shape), the ceiling clearing the tallest CELL (monuments are
  fitted by the builder, not by maxH — the first draft counted them and
  D.U.M.B.'s tubes failed it), every prop in the catalogue and on a wall /
  the ceiling / the floor inside the room; per-room checks (CERN's wide
  bulkhead, blue lamps, the control bank; the Backrooms' EXIT leaf, no
  pipes, the lower carpeted ceiling, the three lying EXIT signs, the two
  solid monoliths, the tinted water, the Quarantined bay); the source scan
  covers the mood reads, `signLines`, the lamp / strip colours, the
  ceiling-relative heights, the water tint and the point-light colour.
  `npm test`: 151 green (the server smoke test skipped — no node_modules).
  index.html → `20260907p-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 1, the second
  bulkhead (ROOM 999), E — blue corner lamps, the beamline's copper cells,
  the two aluminium arcs, the terminal steps, the checkerboard dais, the
  control bank in the far right corner; then Bay 6, the EXIT door (ROOM
  90), E — yellow light, a low ceiling, the wallpaper partitions and
  blocks, the almond water (wade it), the two monoliths, the chair in the
  corner, EXIT signs over blank walls. Both consoles should file the
  crossing and return you to the desk.
- Next: 1945 Nuketown and 50 Stadium — the OUTDOOR rooms (the `kind:
  'site'` work: the map's sky from `env`, its far roster, no ceiling);
  then the moat maps once a fluid sheet edge is in; the map's `near`
  setting inside the room; 5.4a stage 2; 7.9 dailies; 4.1 the case-file
  screen.

### 2026-09-08 — 7.2 stage 3 SHIPPED: Rooms 1945 and 50, the first OUTDOOR rooms
The plan's next step ("1945 Nuketown and 50 Stadium — the OUTDOOR rooms:
the map's sky from `env`, its far roster, no ceiling"). No new files;
data.js + three-renderer.js + doorhq.test.js + index.html; docs. The
`kind: 'site'` room the plan sketched is NOT a new kind: an outdoor site
is still the `kind: 'box'` room (shell / doors / counters / props /
collision / camera all unchanged) with `shell.open` — the box builder
skips its ceiling and the site builder swaps its indoor kit for masts.
- **data.js.** `siteRooms.built` → `[…, 'prebuilt_nuketown',
  'prebuilt_stadium']`. `shells[id]` grew `open`, `apron`, `skirt`,
  `apronColor` / `floorColor` and `mood.night`; `hqSiteRoom` reads them
  into `shell.open` / `sky` (the map's `env` + `night`) / `apron` /
  `skirt`, nulls the ceiling and the pipes, moves the four `lights` to
  the walkway corners (±(half − 1.3)) and leaves the wall clock, the
  lockers and the ceiling fluorescents out of the props.
  - **1945 · NUKETOWN**: `wood_planks` for the fence (h 3.2 — the motel
    leaf and its lintel need 2.9), `grass_2` underfoot and for the apron
    over a `dirt` skirt, a concrete coping; dusk (`night: 0`) under the
    map's khaki sky and its `orbs` roster; sodium masts (`0xffd890`);
    the north sign green-and-cream (`NUKETOWN · ROOM 1945 · POP. 0 · TEST
    SITE`), the south one `CONDEMNED · THE FENCE IS THE WALL`. Flavour:
    the observation post on the east lawn (a tube TV, a folding chair,
    the mannequins' box), a plant, a mop bucket. Guard + five lines.
  - **50 · FOOTBALL STADIUM**: `concrete_floor` for the bowl's inner
    wall (h 4.2 — the wide turnstile leaf), turf (`grass_2` tinted
    `0x5ec46a` like the near kit's apron) over a concrete apron and
    skirt; night (`night: 1`) under the map's navy sky and its `city`
    roster; floodlight masts (`0xeaf4ff`); the north sign a scoreboard
    (`HOME 0 · AWAY 0 · Q1`), the south one `NO RE-ENTRY WITHOUT A
    STAMP`. Flavour: the home bench on the east wall (three folding
    chairs, the water cooler), the ground crew's bucket by the turnstile,
    a crate of game balls, a plant. Guard + five lines.
- **three-renderer.js.** `_hqTex(name)`: a name missing from
  `DOOR_HQ.textures` resolves to `TERRAIN_SPRITES[name][0]` (same
  loader, same cache key) so a room can wear grass, planks or concrete.
  `_hqBuildBoxShell`: `S.open` → no ceiling plane, terrain textures tile
  at 1.75 m, the floor takes `S.floorColor`, a 16 m apron plane
  (`S.apron`, `S.apronColor`) at −0.9 and a 3 m dark skirt box under it,
  no fluorescent strips. `_hqBuildSiteBoard`: `S.open` → masts at
  `S.lights` (pole to `S.h + 2`, head leaning in over the board, lens
  `_hzGlowMat(lampC)`, glow sprite, a 0.22 m blocker) instead of the
  containment lamps and the wall strips; signs and the plate unchanged
  (they hang from `S.h` — on the fence at 2.3 m). New `_hqBuildSky`
  (after the site board) and `_hqTickSky` (from `_hqTickWorld`), above.
  `_hqEnter`: an open room is lit by its sky (hemisphere in the sky's
  tint, a sun / night fill, the masts' point lights at `S.h + 1.8`, the
  map's fog colour as FogExp2 0.00005). `_hqCamBlocked`: no ceiling
  outdoors. `_hqLeave`: `_horizonFogDirty = true` when a sky was up.
  The battle's default roster literal moved into `_hzCosmicRoster()`
  (`_buildHorizonScenery` calls it — identical rows).
- **doorhq.test.js.** The box-room props test lets an open room be lit
  by masts; the built-site test requires the two new rooms, reads
  `TERRAIN_RULES` out of the sandbox to accept terrain keys, checks an
  open room's sky against `EW_MAP_META` (scenery, tint, fog), the apron /
  skirt textures, masts on the walkway, no ceiling / pipes / hung props,
  and every room's wall tall enough for the leaf + lintel; an indoor room
  must have no sky; per-room checks (Nuketown: dusk, orbs, the fence, the
  motel leaf, the TV, no lockers; the Stadium: night, city, the concrete
  wall ≥ 4 m, the wide turnstile, the bench + cooler); the source scan
  covers `_hqBuildSky` / `_hqTickSky` / `_hzCosmicRoster` / the terrain
  fall-through / the boom / the fog re-arm / no containment lamps
  outdoors. `npm test`: 151 green. index.html → `20260908a-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 1, the motel
  door (ROOM 1945), E — you should be on a lawn inside a board fence
  under a khaki dusk with orbs and lone doors drifting past the fence
  line, four sodium masts, the TV in the far right corner; walk the
  street, climb a dumpster. Then Bay 7 (the mezzanine shopfront), the
  turnstile (ROOM 50), E — night, floodlights, the city's monoliths and
  haloes over the bowl wall, the bench on the right. Both consoles file
  the crossing and return you to the desk. If the sky is black: the
  console says `[HQ] sky:` with a body count when it built; a missing
  line means `_envUni` never initialised (the battle scene's
  `_initEnvironment` runs from the HQ now if it has not).
- Next: the moat maps once a fluid sheet edge is in (Camelot, Atlantis,
  Hell, Technoticlan, Agartha, Antarctica — they are outdoor rooms too,
  `open` + a lake that reaches the walls); the map's `near` setting
  inside the room; 5.4a stage 2; 7.9 dailies; 4.1 the case-file screen.

### 2026-09-08 (rev 2) — 7.2 stage 4 SHIPPED: the six MOAT rooms — the walkway is a quay
The plan's next step ("the moat maps once a fluid sheet edge is in —
Camelot, Atlantis, Hell, Technoticlan, Agartha, Antarctica — outdoor
rooms too, `open` + a lake that reaches the walls"). No new files;
data.js + three-renderer.js + doorhq.test.js + index.html; docs. The
"lake that reaches the walls" became a MOAT with a QUAY: the water fills
the ring from the board's edge out to a 2.4 m dry strip along the walls
(that strip is where every prop, native, mast, the guard and the console
already stood, so nothing in the shipped room recipe moved — the room
just grew 2 m and the ring between sank), bridged by a causeway on the
way-in side and its opposite, exactly the near kit's `_nrMoat` + the
spawn-row causeways brought indoors. That reading keeps the room walkable
without rails or a swim, and keeps "reaches the walls" for the water's
look along the north side, where nothing stands between the moat's
coping and the wall but the sign.
- **data.js.** `siteRooms.built` gains the six. Each `shells[id]` is an
  open room with `pad: 5.0` and `moat: { key, gap: 2.6, bank, bankColor,
  bed, (bedColor), deck, deckColor, causeways: ['s', 'n'] }` plus its own
  perimeter / floor / apron / skirt / mood / signs (comment block above
  the six has the field list). `hqSiteRoom`: `moat = defaults ← shell.moat`,
  then `walk` (TERRAIN_RULES passable AND not in `HQ_SITE_HAZARDS` — the
  same rule as a board lake: water wades, deep_water / lava never),
  `tint` (the Δ's `terrainTints[key]`; a water key falls back to the
  board's `water` / `deep_water` tint — Antarctica's deep water wears
  the board's water blue), `quay` (= pad − gap), and 's' is forced into
  `causeways` (the way in always has a bridge); `shell.moat` carries it.
  Six flavour entries (agent + five lines + quay props; the lines are
  Claude placeholders, A15).
- **three-renderer.js.** `_hqSiteCellAt`: outside the board, a moat room
  returns `_hq.site.moat.cell` (`{ top: -depth, walk, fluid, key, moat }`)
  anywhere inside the quay's inner edge that is not a causeway — new
  `_hqSiteOnCauseway(x, z)` (the deck is `deckW` wide, centred on its
  side, from the island's edge to the quay). Every site consumer
  (`_hqSurface`, `_hqAirOK`, the landing, `_hqCamBlocked`) therefore
  treats the moat as one more board lake with no new branch. `_hqSurface`:
  the one-level climb tolerance also applies when `curY < -0.5` (out of
  the moat onto the quay — the target is not a board cell). `_hqBuildBoxShell`:
  a site room's floor is a FRAME (`siteHole` = board half + the moat's
  gap; four bands) — the fix for a bug the stages before never saw
  without a playtest: the single floor plane at y 0 sat OVER every board
  pit (D.U.M.B.'s tubes were fine, but the Backrooms' almond water and
  every −1 lake were hidden under the floor). `_hqBuildSiteBoard`: the
  MOAT block before the pits — merged edge cells (`moatMerged`: a
  board-edge pit of the same liquid family), `_hq.site.moat`, the bank /
  bed / deck materials through `siteMat`, `_buildFluidTopMat(M.key)` with
  the Δ tint set on `color` (the material's `_evTintMat` may have read a
  stale `state.terrainTints`) and lava's emissive at 0.85 (fallback: the
  cells' translucent basic sheet, pulsed), `_hq.moatTick = { key, tile:
  CM }`; the ring as four bed + four sheet rectangles (`_hzTileUV` per
  cell so the wave layers repeat), the quay's face + coping in one or two
  runs per side (a causeway breaks the run), the island's face as an
  InstancedMesh of one segment per dry edge cell plus corner posts, the
  merged cells' sheet + banks on dry sides only, the deck (0.3 m thick,
  top at +0.012 m) with two kerbs per causeway, four pulsing glows on a
  lava moat. The pits loop skips merged cells. The A–H / 1–8 labels sit
  at the quay's edge and the hazard plate before the causeway. New
  `_hqTickMoat(dt)` (before `_hqTickWorld`, which calls it when
  `H.moatTick`): advances `_fluidTimeSec` / `_fluidTimeUniform`, sets
  `_fluidTileUniform` to one cell, drives the key's `_off1` / `_off2`
  drift — the battle resets all three the moment it renders.
- **doorhq.test.js.** The built-site test requires the six; `dryFrom(S)`
  (board half + gap) replaces the board half in the walkway checks for
  masts, natives, the spawn and (new) the guard; floor props in a moat
  room must stand on the quay, the island or a causeway (`onCauseway`);
  a moat block: the key is in `HQ_SITE_FLUIDS` and TERRAIN_RULES, `walk`
  equals the board-lake rule, gap / depth / deck minimums, the quay ≥ 2 m
  and equal to the room's (to 2 cm — the size is rounded to centimetres),
  the south causeway, the textures, the tint rule; an indoor room has no
  moat. Per-room checks (Camelot: dry board + plank drawbridge + the
  portcullis + torchlight; Atlantis: canals on the board, the #49c2d8
  tint; Hell: lava never waded, obsidian decks, red light, the
  extinguisher; Technoticlan: the cyan tint, the terminal in the corner;
  Agartha: the inner sea, day, three plants; Antarctica: deep water never
  entered, the water tint, an ice bridge, the cot). Source scan: the
  causeway helper, the moat cell, the climb-out tolerance, the fluid
  sheet, the merge skip, `_hqTickMoat` + its call, the floor frame. The
  test caught one placement on the first run (an Agartha paper sheet in
  the water — moved). `npm test`: 152 tests, 151 green + 1 skip.
  index.html → `20260908b-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 2 (the mezzanine
  portcullis), Room i, E — you should be on a lawn quay inside a brick
  curtain wall at night under Camelot's dark sky, the plank drawbridge
  ahead crossing a water moat to the castle board (the board's wall
  slabs and plank lanes); walk the drawbridge, step off it into the moat
  (you wade at −1.75 m, climb out onto the island or the quay), lap the
  quay — the north side is coping, water, wall, sign. Then Bay 5, Room
  666: the lava moat glows and refuses you at the coping; Bay 3, Room
  H-20: the board's canals run out into the moat with no wall between.
  If the water is a flat blue sheet with no ripples, `_buildFluidTopMat`
  threw (the fallback) — the console has no line for it, so check
  `_hq.moatTick` in the console (null = fallback). If a board pit still
  looks covered anywhere, the floor frame is the suspect (`siteHole`).
- Next: the map's `near` setting inside the room (per-site dressing
  beyond the generic quay kit); the remaining sites one session each (the
  plan's order: the rest); 5.4a stage 2; 7.9 dailies; 4.1 the case-file
  screen.

### 2026-09-08 (rev 3) — 7.2 stage 5 SHIPPED: THE SETTING IN THE ROOM — the rooms look like their maps
The user's ask ("I imagined the walkable rooms of the maps inside the HQ
to look more like their battle maps") = the plan's standing next step
("the map's `near` setting inside the room"). No new files; data.js +
three-renderer.js + doorhq.test.js + index.html; docs. The reading: the
battle already dresses every Δ board with a MAP SETTINGS near builder
(three-renderer.js `_NR_BUILDERS`, keyed by the map's EW_MAP_META
`near`) — so the room runs THE SAME BUILDER inside itself at 1:1, and
grows to the builder's apron so the setting's own enclosure lands on
the room's walls. Nothing is redrawn by hand; a site room is now the
battle's setting with a roof (or the map's sky) and a door.
- **data.js.** `DOOR_HQ.siteRooms.near[key] = { w, h?, stands? }` — one
  row per builder the built sites use (11): `w` MUST equal the `w` the
  builder hands `_nrKit` (doorhq.test.js reads the renderer source and
  fails on drift), `h` (indoor: dumb 3.4, cern 3.6 tiles) becomes the
  room's height so the kit's pipes / lamps / trays fit under the
  ceiling, `stands` (stadium, technoticlan) says the setting's tiers
  fill the w/e strips. `hqSiteRoom`: `pad = w × tile + the moat's gap`
  (the shell's `pad` is the fallback when there is no setting or
  `shells[id].setting: false`), `shell.near = { key, w, gap (tiles),
  stands }`, `shell.h` from `near.h`. The CROSSING console can leave the
  west wall: `shells[id].console = { wall: 'n' | 'e', at }` — the desk
  layout (console, tanker desk, CRT, phone, papers, clipboard) is the
  west one turned (`W(along, depth)` / `WA(along)` / faces + ROT); CERN
  (n · 0 — the beamline runs down both flanks), Nuketown (n · +6 — the
  houses stand on the flanks; the road sign is on the other side), the
  Stadium (n · −7) and Technoticlan (n · +6) (the tiers fill the
  flanks). `stands` moves the natives' spots, the file boxes and the
  guard's chair to the n/s strips. Flavour props keep their DISTANCE
  TO THE WALL when the room grows (`fit`: a coordinate past the old dry
  edge shifts by the growth; `flavour[id].fitted: true` = placed for
  this room — the Stadium's bench is on the south strip by the
  turnstile now, the cooler on the south wall; Technoticlan's calendar
  terminal on the north strip's east end). Rooms: D.U.M.B. 24.55 m ·
  h 5.96, CERN 25.25 · 6.31, Backrooms 28.05 (h 4.3 — the partitions
  are 4.2), Nuketown / Stadium 29.81, the four w-4 moat rooms 33.25, Agartha /
  Antarctica 35.01.
- **three-renderer.js.** `_nrKit(group, ctx, o)` takes `ctx.hq = { w,
  gap, B, tints }`: the apron width and gap are the ROOM's (so X0..X1 is
  the walls), the base level is the Δ's (not `_hLevelAt`, which reads
  the last battle), the tints are the board's (not `state.terrainTints`),
  `_nrLastKit` is left alone (the crossing's facts stay the battle's),
  `K.hq` set. Under `K.hq` the enclosure primitives are no-ops:
  `_nrApron` (the floor frame + apron), `_nrMoat` (the room's own moat),
  `_nrRoom` (the shell), `_nrSign` (the mood's signs). New
  `_hqBuildSetting(room)` (before `_hqBuildSky`; called from `_hqEnter`
  right after `_hqBuildSiteBoard`): builds into its own group with a
  seeded rng, shifts it by (−N·ts/2, −B·elev, −N·ts/2) so the kit's
  board lands on the room's, splices the builder's `_hzGlowPulse`
  entries into `H.fxPulse` (the HQ loop breathes them), unfogs the
  additive / sprite materials like `_hzRunNearBuilder`, then walks the
  PIECES (direct children, or the children of an occlusion wall group)
  by world bounds: DROPPED when it doubles the perimeter (thinner than
  0.9 m, longer than 6 m, hugging the room's wall — the Stadium's bowl
  wall) or stands in the way in (the south lane ±2.2 m at the wall —
  D.U.M.B.'s south blast door) or at the console (a 5.6 × 2.4 m run on
  its wall); else a BLOCKER — a rect from the bounds with `top` (a
  house, a bus, a tier, a wall run, a fence panel), or a disc at the
  foot for a slender piece (taller than 1.2 × its width: a tree, a
  stalk fluorescent, a tower, a mast) — unless flat (< 0.35 m: the
  road, the chalk lines, the stripes), overhead (bottom above 1.5 m: the
  pipes, the trays, the banners, the aurora), over the board / the moat,
  or wider than 40 m. `_hqSettingFreeSpot(x, z)`: a floor spot inside a
  setting blocker slides along the wall it stands by (0.5 m steps, 9 m
  either way) to the nearest free one — applied to the natives and the
  roster NPCs in `_hqSpawnPopulation` and to floor props in
  `_hqPlaceProps` (never wall / ceiling / desk-top props). `_hqTickWorld`
  polls the foliage swaps (`_nrPollPending`, factored out of
  `_animateFloaters`) so the trees land. `_hq.setting = { group, key,
  kept, dropped, blockers }` (a console line reports the three counts).
  Kill-switches: `window.EW_HQ_NO_SETTING`, `EW_NO_FACILITY_SCENERY`.
- **doorhq.test.js.** The setting table vs the renderer source (`w` per
  builder), every built site with a `near` key carries `shell.near`, the
  walkway equals the setting's apron (to 2 cm), the gap is the moat's,
  the room height is the setting's where it has one; the console's wall
  from `shells[id].console`, never the south, the desk on that wall with
  the three desk props by it, the console on the walkway; the Stadium's
  bench and cooler on the south, natives + console on the n/s strips;
  source scan for `_hqBuildSetting`, its call, `ctx.hq`, `_nrLastKit`
  guarded, the four no-ops, `_hqSettingFreeSpot` + both nudges, the
  poll, the blocker tag, the kill-switch. `npm test`: 152 tests, 151
  green + 1 skip. index.html → `20260908c-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 1, Room 555 —
  you should walk in past the extinguisher into a 24.5 m red room with
  the server racks along both flanks (LEDs blinking), the north blast
  door across the board, the pipes overhead under a 6 m ceiling; the
  console on the west wall between two racks (two were culled for it).
  Then Bay 2, Room i: the portcullis opens onto the LAWN OUTSIDE the
  curtain wall — the crenellated wall with its corner towers and gate
  towers is 3.85 m in from the board with the drawbridge through its
  south gate; walk round it to the console on the west wall past the
  trees and braziers (you cannot walk through the wall; the gates are
  the way). Room 50: the tiers rise on both flanks, the goalposts and
  the jumbotron at the ends; the bench and the natives are on the south
  strip. If a room is EMPTY of setting, the console line `[HQ] setting
  <key> — pieces: … dropped: … blockers: …` is missing (the builder threw
  — the error is logged just before) or the kill-switch is set. If you
  can walk through something, it was skipped as flat / overhead / wide
  (`_hq.blockers.filter(b => b.setting).length` in the console). If a
  native stands inside a house, `_hqSettingFreeSpot` found nothing free
  within 9 m along that wall.
- Next: the remaining sites one session each (the plan's order: the
  rest — each is now one id in `siteRooms.built` + a shell + a `near`
  row); 5.4a stage 2; 7.9 dailies; 4.1 the case-file screen.

### 2026-09-08 (rev 4) — 7.2 stage 6 SHIPPED: THE REST OF THE REGISTER — every launch map is a room
The plan's standing next step ("the remaining sites one session each")
done as ONE batch, because stages 3–5 had made a site room a data
entry: `siteRooms.built` + `shells[id]` + a `near` row + `flavour[id]`.
No renderer change; data.js + doorhq.test.js + index.html; docs.
- **data.js.** `siteRooms.built` gains the eighteen (29 sites in the
  register, 29 rooms). `siteRooms.near` gains seventeen rows — `w` per
  builder read off the renderer (shasta / stonehenge / giza / heaven /
  area51 / hollow_earth / fairy_forest / vatican / northpole 4.5, olympus
  4.0, cyberpunk 3.2, mars / skinwalker / moon / bohemian_grove / gobekli
  5.0, babel 4.5 `stands`); Flat Lands has no row. Eighteen `shells`,
  all `open` (no board in the batch holds lava, void or a lake worth
  opening — Shasta's lake and the Grove's creek stand outside the kit's
  apron in the battle), each in the map's own terrain keys (a cliff, a
  dry-stone wall, casing stone, marble with gold at its foot, tenement
  wall, brick, rock, metal, timber, cave wall, a wall of leaves, a
  regolith berm, bark, planks, earth), its own light (`mood`, day / night
  per the sky), its own two signs (`signLines`: the north sign wears the
  number). Consoles: Babel n·0 (the terraces fill w/e/n; the north tier
  is what the cull removes for it), Area 51 n·5 (the west hangar), Fairy
  Forest e·8 (the spring on the west), North Pole n·0 (the workshop on
  the west). The Moon's wall is 3.0 m (the lowest the leaf + lintel
  allow: 2.65 + 0.25). Flat Lands: `setting: false`, `pad: 7.0`, `h:
  3.0` — a 28 m room instead of the 63 m the fourteen-tile apron would
  make. Eighteen `flavour` entries (guard line, five overheard lines,
  two to six props each, `fitted: true`, on the walkway clear of the way
  in / the console's run / the guard). Rooms: Cyberpunk 25.2 m, Olympus
  28, the 4.5s 29.75, the 5.0s 31.5, Flat Lands 28.
- **doorhq.test.js.** The stale "the Moon is not walkable yet" gives
  way to: every threshold id is in `built` and the lists are the same
  length; every bay site's register row knows its room (the Holo Sim
  facility row does not count); each stage-6 room is outdoors without
  a moat, its north sign says `ROOM <no>`, its south sign ends at the
  console, its flavour is `fitted`; the four console walls; Babel's
  stands (natives + console on the n/s strips); Flat Lands' opt-out
  (no `near`, no `near.flatlands`, under 30 m); the Moon's 3.0 m berm,
  frame leaf, night; seven day/night spot checks. `npm test`: 152
  tests, 151 green + 1 skip. index.html → `20260908d-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 2 (ANCIENT),
  Room 56 — through the empty frame onto the down at night, the sarsen
  ring standing mid-walkway round the board, the trilithons at two
  corners, the console on the west wall between stones. Bay 1, Room 51 —
  the chain fence and the floodlight towers inside a metal wall, the
  hangar half-cylinders on the flanks, the saucer on its rig in the
  north-east, the console under the RESTRICTED AREA sign on the north
  wall (a fence panel or two are culled for it). Bay 4, Room 1969 — a
  waist-high berm, the lander and the flag on the north-east, the
  monolith in the south-east corner, the Earth in the roster. Bay 5,
  Room 777 — the north Gate across the board, the colonnades on the
  flanks; the cloud mounds hug the wall and are rect blockers (the same
  as Antarctica's drifts). Bay 6, Room 2D — a near-empty 28 m room, one
  chair, one sheet of paper, the eyes overhead. If a native stands
  inside a piece of setting, `_hqSettingFreeSpot` found nothing free
  within 9 m along that wall (the Skinwalker barn on the east wall is
  the likely one). If Babel's north terraces are still there, the
  console zone did not reach them (they should be culled).
- Decisions the user may reverse: Flat Lands without its setting
  (alternative: a `near.flatlands` row `{ w: 14 }` and a 63 m room);
  the Moon's berm at 3.0 m (a taller wall hides less sky); Babel with
  `stands` and the north terraces culled (alternative: `setting:
  false`).
- Next: 5.4a stage 2 (the ring corridor); 7.9 dailies; 4.1 the
  case-file screen; the cast lines for the site rooms (A15, the user's);
  wave 1 of the new sites (7.6) — each is now a room the moment its
  threshold exists.

### 2026-09-08 (rev 5) — 5.4a stage 2 SHIPPED: THE CONTAINMENT RING is one corridor per floor
The plan's standing next step after 7.2. The user's original ask
("the hallways with the different doors can be made longer and go all
the way around, or at least halfway") is now a hallway, not a chain of
rooms: data.js + three-renderer.js + map.js + doorhq.test.js +
index.html; docs.
- **data.js.** `bayShell.corridor = { on, rings: { 0: { rIn: 21.5,
  rOut: 25.5, id: 'ring_g' }, 1: { rIn: 24.5, rOut: 28.5, id: 'ring_m'
  } }, endPadM: 2.2, gapM: 2.6, arc: { 0: null, 1: null }, close: true
  }`. `hqRingLayout(level)`: the bay doors of that floor of the egress
  sorted by angle; each a door run of n × `spacing` metres on the outer
  wall centred on its egress angle; runs closer than `gapM` pushed apart
  half each until none touch; the break = the widest gap between runs
  (the order starts after it, angles run past 360 where they must); the
  arc = first run's start − pad … last run's end + pad, or `arc[level]`
  by hand (≥ 360 − gap → `full`); segment bounds at the gap midpoints.
  `hqRingRoom(level)` → a `kind: 'bay'` room (`corridor: true`,
  `segments`, `shell.full`, `sub: '<FLOOR> · BAYS 1 · 4'`): per segment
  the `egress_<sector>` door (inner wall, the egress leaf, back to
  `central_egress` at that door), the `site_<id>` thresholds (outer
  wall; leaf / roomNo / why / note as the stage-1 bay's), extinguisher
  + breaker (+ a clock on a wide segment) flanking the way out, the
  bay's `bays[sector].props` through `hqRingSpot`, one guard with the
  bay's line; along the whole arc the fluorescents every 3.2 m; in each
  gap ≥ 4 m two cabinets, boxes and papers; at the caps the old cap
  dressing stepped 0.5 m further back when the cap wears a door; the
  two cap doors (`cap_cw` at arc[1] → `at: 'cap_ccw'`, and back) when
  the ring is not full and `close` is on. `hqBayId(sector)` → the
  floor's ring in corridor mode (else `bay_<sector>`), `hqBayEntry
  (sector)` → `egress_<sector>` (else `egress`), `hqBayNo(sector)` off
  the egress door's label, `hqBayLevel`, `hqRingId`, `hqRingSectorAt
  (room, deg)`, `hqRingSpot(sector, spot)` (deg' = c + deg · rOut₁/rOut₂,
  r' = rIn₂ + (r − rIn₁), face' = face + c; `src` / `bay` on the copy).
  The stage-1 rooms stay registered as `bay_<sector>` (kill-switch,
  tests, playtest_hq.js). `hqSiteRoom`'s sub-line and `hqRoomRegister`
  read `hqBayNo`; `hqCastInRoom` resolves a `bay_*` spot through
  `hqCastSpotRoom` and hands the renderer the carried copy. Computed
  today — ground: Terrestrial c 270 (52.6°), Celestial c 360 (17.5°),
  arc [238.77, 373.71]; mezzanine: Ancient 45, Diplomatic 146.02, Urban
  178.69, Hollow 215.28, Quarantined 270, arc [17.06, 282.26].
- **three-renderer.js.** `_hqBuildBayShell` skips the cap slabs on
  `S.full`; `_hqSurface` / `_hqAirOK` / `_hqCamBlocked` skip the cap
  check on `S.full`; the bay lighting spaces its point lights ~12 m
  apart (4–8) on a corridor over 40 m instead of one per 32° of arc.
  Nothing else — the arc band, the sector mesh, the strips, the pipe
  run, `_hqCapWall`, the door placement and `_hqGoTo` took the wider
  arc and the larger radii as they were.
- **map.js.** `_hqBayEntry(sector)` replaces the four hard-coded
  `'egress'` landings (the Code Red panel's ENTER / GO TO THE BAY, the
  bay door panel's button, `_hqDoorDirectAction`, `_hqDoAction`); the
  Code Red WALK TO THE THRESHOLD button also fires when the ring's
  segments include the sector; the directory's row prefix names the
  bay (`d.bay`) and END CAP; the overheard line is the segment's
  (`_hqRingSegHere` → `hqRingSectorAt` on `ThreeRenderer.hq.pos().deg`).
- **doorhq.test.js** (157 tests, 156 green + 1 skip): the stage-1 block
  re-pointed at `bay_*`; five new tests — two rings framed 0.3–1.5 m
  outside the drum, 4 m wide, one segment per bay door in door order
  ([1, 4], [2, 5, 7, 3, 6]), each segment holding its egress angle and
  its whole run; every launch map exactly once on the rings with the
  stage-1 door's leaf / number / hook, nothing overlapping, `gapM`
  between bays, `endPadM` past the outermost run, props and guards
  inside the corridor and in their bay, `hqRingSectorAt` naming every
  door's and guard's bay, the lines on the segments; the caps' doors
  reciprocal within the ring, unnumbered, dressing ≥ 0.75 m clear, a
  hand `[0, 360]` closing the mezzanine with the same thresholds; the
  site rooms' way back landing at their threshold on the ring, the
  register's bay numbers, Sedaniel carried to the same side of the way
  in, the flavour TV with him, the source scans; the kill-switch. index
  → `20260908e-cors`.
- Not playtested (RULE #1c). What to eyeball first: Bay 1's door on the
  egress, E — you stand at `egress_terrestrial` on the ground ring
  facing the outer wall, six thresholds curving away to the left and
  right, and the corridor continuing clockwise past two cabinets to
  Bay 4's way out and the Mars / Moon doors, a fire door at each end
  (E on one lands you at the other, same way round). Upstairs, Bay 2's
  portcullis: the mezzanine ring runs 123 m clockwise past 21
  thresholds and four more ways out; the Diplomatic and Hollow runs
  sit a few metres off-centre of their egress doors (the relaxation),
  the Urban pair between them. Sedaniel is parked a corridor-width left
  of Bay 1's way out. If a threshold plate reads the wrong bay, or a
  guard stands in another bay's run, `hqRingLayout` is the place.
- Decisions the user may reverse: the ring wraps only the bays' arcs
  (alternative: `corridor.arc[0] = [150, 510]` walks the ground ring
  behind Medical / Training / the Office / Reception too, with no doors
  on that stretch); the cap doors as a door-blink across the service
  side (`close: false` = dead-end caps); the radii (a wider ring makes
  room for wave-1 sites without any run moving).
- Next: 7.9 dailies; 4.1 the case-file screen; the cast lines for the
  site rooms (A15, the user's); wave 1 of the new sites (7.6) — each is
  now a segment's extra door the moment its threshold exists.

### 2026-09-08 (rev 7) — THE TERMINAL (the console's screen replaces the match-select page)
- Shipped: map.js `_hqOpenTerminal(spec)` / `window._hqTerminalClose(o)`
  / `_hqTermDrop` / `_hqConsoleTerminal` / `_hqRangeTerminal` /
  `_hqDeskTerminal`; `_hqLaunchMission` files on the screen (`o.variant`,
  `o.counterId`, `o.presets`; `o.terminal === false` = the page);
  `_msBack` / `_msConfirm` / the walker's `onEscape` check `_hqTerm`;
  `_hqClosePanel({ keepPaused })`. three-renderer.js `_hq.props`
  records, `_hqFocusScreen` / `_hqUnfocus` (`hq.focusScreen` /
  `hq.unfocus` / `hq.focused`), the focus blend in `_hqTickCamera`, the
  avatar hidden under the push, `_hqOnLockChange` + `_hqLockStaleAt`.
  match-select.js rewritten as the CRT (`.ms-crt` / `.ms-tty-*`,
  styles-base.css "THE TERMINAL" block), `_mountReactMatchSelect({ host,
  variant, frame, pre })` with one root per host. index.html
  `#hqTerminal` (between the panel and the load card), token
  `20260908j-cors`. doorhq.test.js "the terminal" source scan.
- Tuning knobs: the push — `hq.focusScreen` `dist` 0.62 m out from the
  CRT's base along its yaw, `screenY` 0.21 m up, `ms` 720, `reach` 3.4 m
  from the counter; the mount delay 430 ms (map.js `_hqOpenTerminal`);
  the power-on/off rasters (`msCrtOn` 0.62 s / `msCrtOff` 0.3 s); the
  glass inset (22 / 28 / 34 px) and the phosphor palette (`.ms-crt`
  custom properties).
- Not playtested (RULE #1c). What to eyeball first: walk into any bay
  threshold's room, E at the CROSSING console — the camera should slide
  onto the CRT on the tanker desk (the avatar vanishes as it passes), the
  raster opens, the site's name sits top-left of the screen with its stamp,
  BOARD Δ / FULL on the right; ESC pulls back to the desk with the cursor
  free; FILE stamps and leaves for the party builder; the result overlay's
  D.O.O.R. HQ button lands you at the console. Then the Training Room's
  RANGE console (the FULL desk, Training Room selected, two preset chips
  above the site cards) and DISPATCH → THE DESK'S SCREEN (the push targets
  the CRT at deg 200 on the dispatch desk — if it looks at the wrong
  monitor, `reach` / the CRT rows in DOOR_HQ.rooms.central_egress.props).
  If the screen is dark, check the console for a React error — the page
  fallback is only for a missing host.
- Decisions the user may reverse: bay-threshold launches (the ring) also
  use the SITE screen (alternative: `terminal: false` there → the page);
  Clash is not offered on a site (its stage is its own); DISPATCH keeps its
  panel (Quick Play / Friendly) with the desk's screen as a third button
  rather than lighting the screen on E.
- Next: an idle screensaver on the CRT in the room (the site's name
  scrolling) before the push; the RANGE console's own boot text; a
  `steward`-style boot line for each console (the room's number).


### 2026-09-09 — Adversarial review: scene handoff and settings input (local delivery, not uploaded)

- Implemented in existing files: `three-renderer.js` retires registered battle
  unit plates during deactivation before HQ reuses the CSS2D layer; unrelated
  labels and existing health/mana bar history are preserved. `map.js` owns the
  HQ loading card by entry generation and cancels fade/hide timers on entry,
  leave, or failure. Stale callbacks cannot dismiss the next entry's card;
  duplicate readiness is ignored. Renderer-entry exceptions now use the
  existing main-menu failure fallback. Normal/walking fade durations remain.
- Settings input: `state.js` gives visible settings controller navigation
  priority over the broad title/HQ flag; `ui.js` leaves Tab to menu/dialog
  focus navigation instead of changing battle targets underneath.
- Validation: full package test command (`node --test *.test.js`) executed
  with available Node v24.19.0: 208 tests, 206 passed, zero failures, two
  expected skips (absent animation GLBs and server dependencies). Includes
  eight new production-function regression tests in `scene-lifecycle.test.js`
  and repository-wide JS syntax checks. npm was unavailable; its exact test
  script was run directly. No browser playtest, game simulation, FPS capture,
  or host/guest runtime acceptance was performed. These local UI/lifecycle
  changes add no state-sync fields, gameplay rules, or relay payloads.
- Complete files for upload: `map.js`, `three-renderer.js`, `state.js`, `ui.js`
  to R2; `index.html` to Render, token `20260910-033727-review-cors`.
  Sync these plus the new test, this log, the other HQ/master log, and
  `ENTROPY_WARS_ADVERSARIAL_REVIEW_PLAN.md` to the repository. Nothing committed,
  pushed, or deployed. No canon, room definitions, assets, or story changed.
- Still open: texture readiness/black-material diagnosis, actual battle → HQ
  → battle visual checks for both viewers, modal focus trap/restore and full
  shared pause presentation. Continue UX-01 in the review plan, then reconnect
  and effect boundaries. Story track remains ON HOLD under A14.
