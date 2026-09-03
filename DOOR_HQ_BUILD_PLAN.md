# DOOR HEADQUARTERS — BUILD PLAN
### The walkable facility that replaces the Play menu · rev 2 (2026-09-03)

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
| `clearance` | red | tape, "CLEARANCE REQUIRED" | `profile.door.clearance < minClearance` (or Keys short) |
| `unstable` | amber, slow pulse | — | playable, not mastered |
| `stabilized` | green | "STABILIZED" plate | mastered (D9) |
| `codered` | red strobe | doorbell icon | Code Red active (Phase 3) |

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
- 1.3 ⚙ Flow: `_hqEnter` (Play), `_hqLoading`, `_hqTrigger`,
  `_hqReturnOrMenu` at the 12 sites + result overlay, `_hqLaunchMission`
  + `_hqPreselect` in match-select, `GS.HQ`, skip-list entries, `?nohq`.
- 1.4 ⚙ Mastery flag write at match commit; lamps from it; strip counts.
- 1.5 ⚙ Audio: room-tone placeholder, `doorBuzz` on doors, `paChime`
  reserved; `doorMuzak` slot silent until a track exists.
- 1.6 ⚙ Rank strings → DOORMAT…THE DOORMAN (rides this data.js delivery).
- Exit: the hall works end to end on placeholder boxes and existing
  textures; `npm test` green; online flows unchanged.

### Phase 2 — The kit lands (2 sessions, 🧊 as assets arrive)
Each delivery from the user swaps placeholders for real props; nothing
else changes. Order of impact: cube → dispatch wedge → door leaves →
lamp/frame details → furniture → fixtures → machinery.
- 2.1 🧊 Textures (§5.2) replace the terrain placeholders on the shell.
- 2.2 🧊 Hero props: cube, dispatch wedge, globe lamp, round table, chairs.
- 2.3 🧊 Door leaves: the six office doors + the institutional set.
- 2.4 🧊 Dressing: cabinets, shelving, boxes, CRTs, vents, clocks, signs,
  extinguisher, vending machine, water cooler, plant.
- 2.5 🧊 NPCs: DOOR agent (male/female) rigged via the CLAUDE.md recipe —
  also usable later as the playable DOOR officer race.
- 2.6 ⚙ The six **bays** as short curved corridors off the ground ring
  (same shell code, smaller radius arc), threshold doors with their own
  leaves (§5.3 list), the bay's site files on the door panels.
- 2.7 ⚙ The **janitor's closet** as the first interior (a box room with
  the closet props; `ref/janitor_closet_v1` is the layout).
- 2.8 🧊 Ambience loop + muzak (user-made).

### Phase 3 — Doors that mean something (1 session, ⚙)
- 3.1 Mastery v1 on every threshold; checklist in the door panel; plates.
- 3.2 Keys: per-profile counter from `hourglasses` wins/pickups;
  restricted doors require rank + Keys.
- 3.3 Code Red: daily-seeded (date + profile) pick of one mastered map +
  one out-of-place race; `doorbell` recipe rings on entering the egress;
  the door strobes; the mission pins that race; bonus Hazard Pay/SP.
- 3.4 Office door = rank (six leaves), `paChime` + card stamp on promotion.

### Phase 4 — Story lives in the building (1–2 sessions, ⚙)
- 4.1 The office in-tray = case-file screen: SP meter, chapters, pending
  directive, AWAITING FIELD WORK (`requires`), memos (`dotMatrix`),
  commendations; `fax` on arrival.
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
- 6.1 `prebuilt_training`: 8×8 square, flat z3, `tilefloor` with
  `concrete_floor` gutters, `M.wall` ring, corner scorch marks, registered
  like `clash_stage`; cool fluorescent env. `ref/training_room_v1` is the
  look. (This one IS a battle map, so it uses the voxel path.)
- 6.2 Black Cube: the Arena tower's model/label/announcer → the Saturnian
  Black Cube; "THRESHOLD CLOSED".
- 6.3 Keys: hourglass pickups/objective → Keys; "THRESHOLD STABILIZED".
- 6.4 (MASTER C-5) Nexus hold → double Cube damage instead of a win.
- 6.5 Battle-board draw-call work (ROADMAP §4 items 1–3) — unrelated to
  the hub, listed here so nobody conflates the two again.

---

## 5. Assets

### 5.1 Reference images (commit to `docs/door-hq/ref/`, names in the README)
| File | What it shows | Drives |
|---|---|---|
| `central_egress_v1` | Two-tier round hall: mezzanine ring with five doors (green/amber/red lamps) and curved stairs both sides; ground ring with five more; a huge black cube with the DOOR square-spiral glyph hanging from the dome; round dispatch desk piled with CRTs and boxes; round tables, cabinets, globe lamps on pedestals; an agent in black at the desk. Cool speckled stone, oxblood dado, teal trim, terrazzo floor with inlaid rings. | shell proportions + palette (1.2), prop list (§5.3) |
| `office_doors_sheet_v1` | Six doors in curved-wall panels with a lamp above, silhouette for scale: peeling wooden closet door with vent · plain hollow-core · blue-grey wired-glass institutional · black security door with keypad · brushed-steel frosted · glass biometric threshold. | the six office leaves (2.3) |
| `training_room_v1` | Top-down 8×8 lit grid on cracked concrete, four scorch stars, red lamps, wall clocks, glass observation booths, corner machinery, green-lit doors top and bottom, two agents outside the grid. | 6.1 map, 4.3 backdrop |
| `janitor_closet_v1` | The L1 office: door ajar onto the curved hall, mop bucket and broom, sink, cleaning shelves, breaker panel, desk with beige CRT + phone + lamp, clipboards, locker with toilet paper on top, folding chair, round rug, floor drain, army cot. | 2.7 interior |
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
