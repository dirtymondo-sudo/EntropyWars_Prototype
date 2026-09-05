# DOOR HEADQUARTERS — BUILD PLAN
### The walkable facility that replaces the Play menu · rev 13 (2026-09-04 — 6.3 rev 2: the Key pickup celebration + emoji purge, §9)

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
