# DOOR HEADQUARTERS — BUILD PLAN
### The facility that replaces the Play menu · rev 1 (2026-09-03)

Read CLAUDE.md first (RULE #1 delivery, #1b cache-bust, #1c no playtest,
#2 online parity), then `DOOR_MASTER.md` Part A5 (the department → room
table) and Part C (pending decisions). This file is the step-by-step plan
for building the D.O.O.R. headquarters as a navigable hub: what to build,
in what order, in which existing files, and when the user must supply
reference art. It is the anti-"start over" memory for the HQ. **Append to
§9 (build log) every session that touches the HQ.**

---

## 0. The vision in one paragraph, and the plan in one paragraph

**Vision.** Pressing **Play** on the main menu no longer offers Quick Play /
Friendly / VS CPU. It shows a loading screen (clearance check, a memo card)
and puts the player INSIDE headquarters: a round hall with a black cube
hanging overhead, a dispatch desk in the middle, and doors with red / amber
/ green lights around the walls. Menu functions become places: ranked play
is a BELL call at the dispatch desk, VS CPU is walking through a mission
door in a containment bay, the Shop is the Quartermaster's window, the
Codex is the Archives, your Profile is the ID card on the Reception
counter, the story is the in-tray in your office (a janitor's closet, at
first), and the tutorial is the only square room in the building. Doors
light up from real data (played / mastered / rank too low / sealed). Later
the building starts to change when you are not looking.

**Plan.** Build it as **pre-rendered rooms with live overlays** (the
PS1/FF7/Resident Evil technique): one 16:9 background image per room
(user-made, from the same generator that made the reference art), plus
DOM "hotspots" for doors, desks and props, with labels, lights, tape and
planks drawn by CSS from game state. This ships the first room in one
session using art the user already has, keeps every existing screen
intact (each hotspot just calls the function its menu button called), needs
no 3D assets or engine work, and does not close the door on a walkable 3D
egress later — the existing Mystery Dungeon free-roam hub is the ready-made
tech for that (§7). Phase 1 delivers the Central Egress; Phase 2 the rooms;
Phase 3 door states and mastery; Phase 4 story hooks in the building;
Phase 5 the unreliable layout, rings and H-Wing; Phase 6 the Training Room
as a real 8×8 map and the Cube/Keys reskin; **Phase 7 makes the building
walkable in third or first person on the 3D engine** — the committed end
state, with the pre-rendered rooms surviving as the close-up views you
step into (the Resident Evil split: walk the halls in 3D, enter a room,
get the painted view).

---

## 1. Decisions needed from the user (each has a recommendation; build proceeds on the recommendation unless told otherwise)

| # | Decision | Recommendation | Why |
|---|---|---|---|
| D1 | Rendering approach for the hub | **DECIDED 2026-09-03: pre-rendered rooms + DOM hotspots first; the walkable third/first-person facility is the COMMITTED end state (Phase 7), not an option.** The Guild Hub is understood as its prototype. | Ships in one session with existing art; zero engine risk; the same room-graph data drives both; the 3D build needs props, interiors and a perf pass that should not block "menu functions become places". See §7 for what actually makes 3D slower to reach (it is not the renderer as such). |
| D2 | Where Quick Play and Friendly live | Both at the **dispatch desk** in the Central Egress (Quick Play = "answer a BELL call"; Friendly = the desk phone, room code). One click from arriving. | Ranked players must not pay a navigation tax; the round desk is the room's focal point in the reference art. |
| D3 | What a mission door launches | **VS CPU on that map's 8×8 Δ board, 4v4, enemy pool = that map's native entities** (`doorSiteCrossings`). The full-size map is a second option on the door panel ("deep crossing"). | The brief's core format IS 4v4 on 8×8; the Δ boards exist; native pools exist via POINT_OF_ENTRY. |
| D4 | Sector grouping of the 29 maps into 6 bays | Table in DOOR_MASTER A10 (TERRESTRIAL / ANCIENT / HOLLOW / CELESTIAL / DIPLOMATIC / QUARANTINED). | Biomes in `EW_MAP_META` map cleanly; 4–8 doors per bay fits one room image. |
| D5 | What happens to the main menu | **Phase 1: unchanged except Play → HQ.** Once a room hosts a function (Phase 2), its main-menu button is removed. End state: Play / Settings / Profile card / Quit. | No dead ends during the transition; the menu is the safety hatch until the building is complete. |
| D6 | Settings | Stays an **overlay** (gear icon in the HQ strip + Esc). Not a room. | You do not walk to Settings. |
| D7 | Back buttons | Every "← Back" / "Main Menu" that today returns to `mainMenuPage` returns to **the room you came from** when the HQ is active (`_hqReturn`). The post-match "Main Menu" button reads "RETURN TO HQ". | 12 call sites (map.js 10, ui.js 1, battle.js 1) — one helper. |
| D8 | Door art | **Bay backgrounds get EMPTY door frames; door leaves are separate transparent sprites composited by the page** (v2). For Phase 1 the egress can use its baked-in doors as-is (v1). | Separate leaves let Mandela shifts reorder doors, let the office door change with rank, and let every threshold be "the wrong door for its surroundings" without re-rendering rooms. |
| D9 | Mastery rule for a green door | **v1: a win on that map by every win condition the map's mode offers** (from `matchHistory[].winCondition`, persisted monotonically in `progress.unlocked`). v2 may add "every native entity declassified". | User's own suggestion; the data already exists per match. |
| D10 | A walking character in the rooms | **Phase 2b, optional:** a 2D sprite of your most-played race walks to the hotspot you click (straight-line tween, 0.3–0.6 s) before it activates. | Cheap "presence" without pathfinding; can be disabled for speed (double-click = instant). |
| D11 | Reference images | **Commit them to the repo** under `docs/door-hq/ref/` (Claude can view PNG/JPG committed to the repo with its file reader). Production backgrounds go to R2 `Assets/door/hq/`. | Chat attachments vanish between sessions; the repo copy is permanent memory. §5 says which step needs which image. |

---

## 2. What already exists (build on it, don't rebuild it)

Verified 2026-09-03 against the current files. Line numbers drift; search
for the symbol.

**Menu / page system**
- `index.html:576-1015` — every menu screen is a `<div class="title-page">`
  inside `#startOverlay`; `map.js` `_showTitlePage(pageId)` (~line 60)
  toggles `.active`, refreshes wallets/dev panel/onboarding on
  `mainMenuPage`, calls `_msRenderAll()` on `modePage`, and shows/hides the
  `#menuBgCanvas` motes (`window._menuBgSetActive`).
- `map.js:98` `_goToPlayHub()` — the function the **Play** button calls.
  This is the seam: it becomes `_hqEnter()`.
- Entry points every room hotspot can call directly (all `window.*`):
  `_goToQuickPlay` (map.js:120), `_goToFriendlyMatch` (:130),
  `_goToVsCpu` (:137, sets `_msCpuOnly` then `modePage`),
  `_goToMysteryDungeon` (:157), `_goToCodex` (:400), `_goToTeamBuilder`
  (:433), `_goToCampaign` (:459, → `challengePickPage`: Gauntlet /
  Survival), `_goToMapEditor` (:14255), `_goToShop(focusRace)`
  (ui.js:8412), `_mountReactProfile` / `_mountLeaderboard` /
  `_mountCommunityMaps` (profile.js:2601/2631/2655), `_ewReplayLastMatch`
  (online.js:4854), `_openMainMenuSettings`.
- Sites that return to the main menu and must learn to return to a room:
  `_showTitlePage('mainMenuPage')` — map.js ×10, ui.js ×1, battle.js ×1;
  the result overlay's `#mainMenuBtn` (battle.js:30168, ui.js:12024).
- Match launch: match-select.js `_msConfirm` (map.js:1755) →
  `applyGameMode(modeId)` (state.js:1168) → team size → party builder →
  `startMatch()` (battle.js:32592). Δ boards are separate mode ids that
  share the parent's site file. There is no "preselect a map" API yet —
  `_msSelectedMap` is an index into `MS_MAP_LIST`.
- Loading screen: `showBattleLoadingScreen(onDone)` (battle.js:31460) —
  warms unit GLBs/sprites/music; the `.ls-*` CSS (grain, motes, hint cards)
  and `_lsDoorHints()` (memo / canon-notice cards) are reusable for an HQ
  loading screen without the unit warmers.

**DOOR layer (shipped)**
- `data.js` `DOOR_TEXT` (~line 14900 to end): LOGO urls, DEPARTMENTS,
  CLEARANCE, DESKS, CUSTOMS, POINT_OF_ENTRY (race → map label),
  DOSSIER_NOTES, MEMOS, CANON_NOTICES, ONBOARD/INTAKE/SYSTEM, RESULT_STAMP,
  `SITE_FILES` (one per map, ~line 15054; `status`, `tone`, `juris`,
  `summary`), helpers `doorSiteFile`, `doorSiteCrossings(label)` (the
  native entity pool of a map), `doorSiteCanonDate`, `doorCaseNo`,
  `doorClearance(profile)`.
- `profile.js` `defaultDoor()` → `{clearance, desk, flagged, memosSeen,
  pendingDirective, cardStamps, choice}`; `matchHistory` (cap 100) entries
  carry `mapId`, `gameMode`, `multiplayerMode`, `result`, `winCondition`,
  `opponent` ('CPU' or a name), `ranked` (profile.js:980-996);
  `progress` blob (`counters`, `records`, `unlocked`) is monotonic and
  synced to D1 via `mergeProgressBlobs` — `unlocked` is a set-union, ideal
  for "site:<mapId>:<winCondition>" mastery flags.
- `audio.js` `playDoorSfx(key)`: `doorBuzz`, `paChime`, `fax`, `dotMatrix`
  are defined and UNWIRED — reserved for the HQ (room transitions,
  promotion, directive arrival, memo print).
- `styles-base.css` (end): `.door-seal*`, `.door-stamp*`, `.door-card*`,
  `.door-wm`, `.door-file-*`, `.door-officer`. `styles-cinematic.css`:
  `.ls-*` loading kit, `.door-ident*` VHS kit, `.door-result-stamp`.
- `playCutscene(script, onDone)` battle.js:11336 — the dialogue/cutscene
  player (speakers with race sprites, location card, typewriter, hold to
  skip). Script grammar: `{location, subtitle, speakers:{key:{name,
  race|sprite}}, lines:[{direction:'location_card'|'battle_start'|
  'fade_in'} | {speaker, text, enterNew}]}`. Read `processLine` before
  authoring.

**Walkable-hub tech (for §7, not Phase 1)**
- Mystery Dungeon **Guild Hub**: `data.js` `_mdBuildHub()` (~12266) builds
  an 8×8 prebuilt map with MapForge (`_mfNew` ~10003: `t/h/rect/box/disc/
  ring/hole/lintel/wall/roof/stair/obj/mon/building/fence/scatter/spawns/
  finish`), `_mdEntrance` trigger tiles and `_mdNpcSpots`; registered in
  `PREBUILT_MAPS` + `MAP_LAYOUT_PRESETS` + `GAME_MODES.md_hub` (state.js
  ~424) outside `EW_MAP_META` (no picker card, no Δ).
- `battle.js` `_mdOnBattlePrepared()` (~27960): drops the CPU team, seats
  roster NPCs (`_mdSpawnHubNpcs`, `unit._mdNpc`, never in turn order),
  starts `ThreeRenderer.hubFreeRoam.start(uid)`; `_mdCheckStairs(unit)` is
  the tile-trigger (entrance tiles → `_mdOpenPartySelect`).
- `three-renderer.js` `_freeRoamStart` (~18725): WASD/arrows + gamepad,
  Shift run, Space hop, collision via `unitCanTraverse`, camera follow via
  `window._mdFreeRoamCam` → `camera.snap`. Requires the 3D renderer to be
  active (no 2D fallback).
- Interior tech: thin edge walls (`M.wall`), lintel roofs, engine stairs,
  hollow-voxel buildings with cutaway (Camelot, MD floors); terrain keys for
  an office: `tilefloor`, `tilefloor_2`, `concrete_floor`, `checkerboard*`,
  `marble*`, `carpet*`, `drywall*`, `gunmetal*`, `metal*`, `wood_planks`,
  `brokenglass`.

---

## 3. Architecture (pre-rendered rooms + live overlays)

### 3.1 Files (RULE #1: no new game files)
| File | What goes there |
|---|---|
| `data.js` | `DOOR_HQ` — the room graph (rooms, hotspots, sectors, door art), and pure helpers `doorSiteState(mapId, profile)`, `hqRoomUnlocked(roomId, profile)`. Appended after `DOOR_TEXT`. |
| `index.html` | `#hqPage` (a `title-page`), the HQ loading overlay markup, the `?v=` bump. |
| `map.js` | Navigation + rendering: `_hqEnter`, `_hqGo(roomId)`, `_hqRender`, `_hqReturn`, `_hqLoading`, the hotspot click/keyboard handlers, `_hqLaunchMission(mapId, opts)`. Lives next to `_goToPlayHub` / `_showTitlePage`. |
| `styles-base.css` | `.hq-*` (stage, 16:9 plane, hotspots, lights, labels, tape/planks, tooltip, strip, directory). |
| `ui.js` | Dev hotspot editor (`_hqEdit`, `_hqExport`) in the existing dev panel (`_ensureDevPanel`). |
| `audio.js` | `_R2_MUSIC.doorMuzak` (when the user supplies it), HQ ambience key; wire `doorBuzz`. |
| `battle.js` | Post-match return to HQ; Code Red hook (Phase 3); Training Room map registration (Phase 6, with data.js). |
| `profile.js` | `door.hq = {lastRoom, visited:[], variantSeed, keys}` backfill. |
| `door-hq.test.js` (repo tooling, allowed) | validates `DOOR_HQ` headlessly via `load-data.js`. |

### 3.2 Data: the room graph (`DOOR_HQ` in data.js)
```js
const DOOR_HQ = {
  rooms: {
    central_egress: {
      label: 'CENTRAL EGRESS', ring: 'ops', minClearance: 1,
      bg: 'https://cdn.entropywars.net/Assets/door/hq/central_egress.jpg',   // 1920×1080, no text, lights neutral
      variants: [],                     // Phase 5: alternate renders for the unreliable layout
      ambience: 'hqHall', music: 'doorMuzak',
      hotspots: [
        // rect = [x%, y%, w%, h%] of the 16:9 image; stand = [x%, y%] where the walking sprite stops
        { id: 'dispatch',  kind: 'prop', rect: [41, 58, 18, 16], stand: [50, 80], label: 'DISPATCH',           action: { fn: '_hqDispatch' } },
        { id: 'board',     kind: 'prop', rect: [6, 30, 8, 12],   label: 'EMPLOYEE OF THE MONTH',               action: { fn: '_mountLeaderboard' } },
        { id: 'bay_terrestrial', kind: 'door', rect: [24, 44, 6, 16], label: 'BAY 1 · TERRESTRIAL', sector: 'terrestrial', action: { room: 'bay_terrestrial' } },
        { id: 'stairs',    kind: 'exit', rect: [78, 40, 14, 36], label: 'TRAINING FACILITY ↓',               action: { room: 'training_hall' } },
        { id: 'elevator',  kind: 'door', rect: [86, 22, 6, 16],  label: 'ELEVATOR', minClearance: 4,          action: { room: 'executive_ring' } },
        ...
      ],
    },
    ...
  },
  sectors: {
    terrestrial: { label: 'TERRESTRIAL', tone: 'deny', maps: ['prebuilt_nuketown', 'prebuilt_area51', ...] },
    ...
  },
  doorArt: {                           // D8 — separate door leaves (Phase 2)
    prebuilt_nuketown: { sprite: 'doors/suburban_closet.png', blurb: 'a suburban closet door, in concrete' },
    ...
    office: ['doors/office_l1_closet.png', 'doors/office_l2_hollow.png', 'doors/office_l3_wired.png', 'doors/office_l4_keycard.png', 'doors/office_l5_frosted.png', 'doors/office_l6_seamless.png'],
  },
};
```
Hotspot `action` is exactly one of: `{room}` (navigate), `{fn}` (call an
existing `window.*` function — the whitelist lives in the test),
`{mission: mapId}` (D3 launcher), `{overlay: 'settings'|'directory'}`.
`kind` ∈ `door | prop | exit | npc`. Optional `minClearance`, `minChapter`,
`sector`, `light: 'auto'|'off'|'red'|'amber'|'green'`, `tip` (hover copy).

### 3.3 Rendering: one 16:9 plane, CSS "cover", percent coordinates
```html
<div id="hqPage" class="title-page hq-page">
  <div class="hq-stage">
    <div class="hq-plane">                 <!-- 16:9, cover-fit by pure CSS -->
      <img class="hq-bg" alt="">
      <div class="hq-hotspots"></div>      <!-- absolutely positioned buttons, % units -->
      <div class="hq-walker" hidden></div> <!-- D10 sprite -->
    </div>
    <div class="hq-vignette"></div><div class="ls-grain"></div>
  </div>
  <div class="hq-strip">                   <!-- seal · ROOM NAME · clearance · wallet · ELO · gear · directory · back -->
  <div class="hq-tip" hidden></div>        <!-- hotspot tooltip / door panel -->
  <div class="hq-directory" hidden></div>  <!-- text list of reachable rooms + functions: the accessibility/fallback view -->
</div>
```
`.hq-plane { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
width:max(100vw,177.78vh); height:max(56.25vw,100vh); }` — cover-fit with
no JS, so hotspot `%` rects stay glued to the image at any viewport. Each
hotspot is a `<button class="hq-hs hq-hs-door" data-state="unstable"
style="left:24%;top:44%;width:6%;height:16%">` with children `.hq-light`
(the lamp above the door, colour by state), `.hq-label` (DotGothic16
nameplate, shown on hover/focus and always on touch), `.hq-tape` /
`.hq-planks` (CSS-drawn for `clearance` / `sealed`), and an optional
`<img class="hq-leaf">` (D8 door sprite). Minimum hit size 44px. Keyboard:
Tab cycles hotspots in reading order; Enter activates; Esc = back /
settings. Reduced-motion honoured.

### 3.4 Navigation and state
- `window._hqEnter()` replaces `_goToPlayHub` as Play's target: sets
  `state._hqActive = true`, `state.gameState = GS.MODE_SELECT` (no new GS
  needed for Phase 1; add `GS.HQ` if anything gates on it), plays the HQ
  loading (§3.6), then `_hqGo(profile.door.hq.lastRoom || 'central_egress')`.
- `_hqGo(roomId)`: clearance/chapter gate → push onto `_hqStack` → preload
  the bg (`new Image()`) → `_hqRender` → `playDoorSfx('doorBuzz')` on door
  transitions, ambience crossfade.
- `_hqReturn()`: pop the stack; if empty, stay in the current room. The 12
  `_showTitlePage('mainMenuPage')` sites become `_hqReturnOrMenu()` (= HQ
  room if `state._hqActive`, else main menu). Post-match: the result
  overlay's button returns to the room the match was launched from
  (`state._hqLaunchRoom`).
- Leaving the building: the strip's "EXIT" (or Esc twice) →
  `state._hqActive = false` → `mainMenuPage`.
- Persistence: `profile.door.hq.lastRoom`, `visited` (for first-visit
  lines and the directory), `variantSeed` (Phase 5).

### 3.5 Door state (`doorSiteState(mapId, profile)` in data.js — pure, testable)
| State | Lamp | Dressing | Rule |
|---|---|---|---|
| `sealed` | off | planks | the sector's `minChapter` not reached (Phase 4; until then never sealed) |
| `clearance` | red, steady | yellow tape, "CLEARANCE REQUIRED" | `profile.door.clearance < door.minClearance` |
| `unstable` | amber, slow pulse | — | playable; not mastered |
| `stabilized` | green, steady | small "STABILIZED" plate | mastered (D9): for every win condition `w` of the map's mode, `progress.unlocked['site:'+mapId+':'+w]` is set. Written at match commit (battle.js, next to the achievement `bump` pass) from `matchSummary.winCondition` when `result==='win'` — both online and CPU count. |
| `codered` | red, fast strobe | doorbell icon | a Code Red event is active on this map (Phase 3) |

The strip shows the current room's door count by state ("3 STABILIZED · 4
UNSTABLE · 1 SEALED"); a stabilized door also acts as a shortcut (Phase 5).

### 3.6 The HQ loading screen
`_hqLoading(onDone)` (map.js) reuses the battle loading kit's DOM/CSS
(`.ls-*`, grain, motes, the memo/canon hint card via `_lsDoorHints`) with
the header "D.O.O.R. HEADQUARTERS · CLEARANCE CHECK" and the officer chip,
waits for the target room's bg to decode, minimum 900 ms, click to skip
once loaded. No unit warmers. (Later: the same screen with "CROSSING…" is
what a mission door shows before `startMatch` — the battle loading screen
then follows as today.)

### 3.7 Missions (D3) — `_hqLaunchMission(mapId, {delta:true, teamSize:4})`
Sets `window._msCpuOnly = true`, `window._hqPreselect = {mapId, delta,
teamSize}`, and opens `modePage`; `_msRenderAll` reads `_hqPreselect` once
to select the map card (the Δ board when `delta`), the Arena mode and the
team size, and to pin the enemy roster to the map's native pool
(`doorSiteCrossings(label)`, padded from the map's biome neighbours when
fewer than 4). The player still passes through the party builder, so
nothing about match setup is bypassed. The door panel (the `.hq-tip` for a
door) shows the SITE FILE stamp, FIRST CROSSING date, the native entity
chips, the mastery checklist (which win conditions are done) and two
buttons: ENTER (Δ 4v4) · DEEP CROSSING (full map, default size).

### 3.8 Online parity (RULE #2)
The building is single-player and local. Quick Play / Friendly hand off to
the untouched lobby pages; nothing in the HQ runs during a match. The two
things that touch both clients stay as they are: the result overlay
(local on each client) and, later, the opponent's ID card on the VS splash
(relayed, already planned). `state._hq*` fields are UI-only → add them to
`_serializeState`'s skip list when they are introduced (online.js).

### 3.9 The dev hotspot editor (so nobody guesses pixel coordinates)
`window._hqEdit()` from the dev panel: shows the current room, lets the
user drag rectangles on the plane, name them, set `kind`, and drag a
`stand` point; `_hqExport()` copies the room's hotspot JSON to the
clipboard (same UX as the map editor's `_meExport`). The user pastes the
JSON into chat; Claude merges it into `DOOR_HQ`. Claude CAN read the
reference images and draft rectangles from them (good enough to start; the
editor is for the final pass).

### 3.10 Performance and fallback
Backgrounds ≤ 600 KB JPG (or WebP), lazy-loaded per room, the adjacent
rooms prefetched after arrival. If a background fails to load the room
renders on a dark plate with the directory open — the building is never a
dead end. Mobile: hotspots ≥ 44 px, labels always visible on touch, the
16:9 plane crops symmetrically.

---

## 4. Phases and steps

Effort is in Claude sessions (a session ≈ one delivery of edited files +
index.html bump). Every step ends with `npm test` and the files handed
over per CLAUDE.md RULE #1. 🖼 marks steps that need art from the user
(§5); ⚙ marks steps Claude can finish entirely without new art.

### Phase 0 — Plan and decisions ✅ (this session)
- 0.1 ⚙ Merge the two docs → `DOOR_MASTER.md`; write this plan; stubs;
  CLAUDE.md pointer. **Done.**
- 0.2 User: answer D1–D11 (or accept the recommendations), commit the
  reference images (§5.1), decide the L1–L6 titles (MASTER C-1).

### Phase 1 — The Central Egress replaces the Play hub (1 session)
Goal: Play → loading → the round hall; every existing function reachable
from it; back buttons return to it; door lamps are real.
- 1.1 ⚙ `DOOR_HQ` in data.js with ONE room (`central_egress`) whose
  hotspots cover the whole current main menu + play hub: dispatch (Quick
  Play / Friendly panel), six bay doors (Phase 1: each opens `_goToVsCpu`
  with the sector's maps filtered — `_hqPreselect.sector`), Quartermaster
  door (Shop), Reception (Profile), Records (Codex), Cartography (Map
  Editor), Training stairs (Challenge pick + Mystery Dungeon), the
  leaderboard wall, the office door (Replay + Community Maps parked here
  until their rooms exist), the directory sign, the gear. Hotspot rects
  drafted by Claude from `ref/central_egress_v1` and refined with 1.6.
- 1.2 ⚙ `#hqPage`, `.hq-*` CSS, `_hqEnter/_hqGo/_hqRender/_hqReturn/
  _hqReturnOrMenu`, the strip, tooltip, directory, keyboard nav, the
  loading screen (§3.6). `_goToPlayHub` → `_hqEnter` (keep the old hub
  page + function reachable as `_goToPlayHubLegacy` for one release).
- 1.3 ⚙ `doorSiteState` + the mastery flag write at match commit; lamps
  driven by it; the strip's count line. `door-hq.test.js`: ids unique,
  rects in range, actions resolve, every launch map in exactly one sector,
  every `fn` in the whitelist, `doorSiteState` truth table.
- 1.4 ⚙ Placeholder background: a CSS/SVG dark round hall (gradient floor
  rings, door silhouettes at the hotspot rects) so the room works before
  any upload — and stays as the failed-load fallback.
- 1.5 🖼 Swap in the real background: user uploads
  `Assets/door/hq/central_egress.jpg` to R2 (§5.2 spec; the v1 reference
  render is acceptable as-is for this step — baked lights and all; the
  lamps overlay on top). Claude only changes the URL in `DOOR_HQ`.
- 1.6 ⚙ Dev hotspot editor (§3.9). User exports final rects; Claude merges.
- 1.7 ⚙ Audio: ambience loop key (synth room tone is acceptable as a
  placeholder here — nothing real is being replaced), `doorBuzz` on door
  transitions, `uiButtonConfirm` on props. Music: `doorMuzak` slot,
  silent until the user supplies a track (MASTER B4).
- Exit criteria: Play lands in the hall; every old menu function reachable;
  all backs return to the hall; post-match returns to the hall; `npm test`
  green; guest/host online flows unchanged; `?v=` bumped.

### Phase 2 — The rooms (2 sessions; each room = one image + one hotspot set)
Order chosen so the most-used functions get rooms first. Each room removes
its main-menu button (D5) and gets first-visit copy from `DOOR_TEXT`.
- 2.1 🖼 **Dispatch close-up** (optional — the egress hotspot can open the
  Quick Play / Friendly panel directly without a room).
- 2.2 🖼 **Containment bays ×6** (`bay_<sector>`): a curved wall with N
  empty door frames; door leaves composited (D8) from `doorArt`; each door
  = one launch map with the door panel (§3.7). Community/custom maps do
  NOT get bay doors.
- 2.3 🖼 **Quartermaster / Customs & Admissions**: the Shop window
  (`_goToShop`) and the locker room (Party Builder, `_goToTeamBuilder`).
- 2.4 🖼 **Reception / Intake**: the ID card on the counter (Profile), the
  lanyard of three cards (profile slots), the laminator (onboarding
  replay).
- 2.5 🖼 **Records / Archives**: the Codex (`_goToCodex`), the tape
  library (Replay), the "unfiled sites" cabinet (Community Maps).
- 2.6 🖼 **Your office, L1 = the janitor's closet** (`ref/janitor_closet_v1`
  is exactly this): the in-tray (case file / story — Phase 4), the CRT
  (stats), the wall (achievement plaques), the cot (a save-slot joke), the
  door seen from inside changes with rank (D8 office leaves).
- 2.7 🖼 **Training hall** (the landing at the bottom of the stairs): the
  Training Room door (Orientation / practice → Phase 6 map), the Gauntlet
  and Survival doors (`_challengePickMode`), the condemned crossing (the
  Mystery Dungeon Guild Hub, `_goToMysteryDungeon`), Medical (Challenge-run
  services).
- 2.8 🖼 **Cartography / Arcane Engineering**: Map Editor, Spell Library
  (dev), balance lab.
- 2.9 ⚙ **D10 walker sprite** (optional): 2D sprite of the most-played race
  (`doorCardPortrait` logic → `getBattleMapSpriteUrl`), tween to the
  hotspot's `stand`, then activate; double-click skips the walk.
- Exit criteria: main menu reduced to Play / Settings / Profile card / Quit;
  every room reachable from the directory; every function has exactly one
  physical home.

### Phase 3 — Doors that mean something (1 session)
- 3.1 ⚙ Mastery v1 live on every bay door (D9), mastery checklist in the
  door panel, "STABILIZED" plates; strip counts; the Codex site tab (site
  files) optional.
- 3.2 ⚙ **Keys**: a per-profile Key counter fed by `hourglasses_collected`
  wins and Key pickups (progress counter `hourglasses` already exists);
  restricted doors (H-Wing, the executive elevator) can require N Keys in
  addition to rank.
- 3.3 ⚙ **Code Red**: a daily-seeded (date + profile) pick of one mastered
  map + one race whose point of entry is elsewhere; the doorbell (new
  `playDoorSfx('doorbell')` recipe) rings on entering the egress, the
  door strobes red, the door panel shows "UNAUTHORIZED ENTITY: <race>",
  the mission pins that race into the enemy pool; clearing it pays bonus
  Hazard Pay/SP. Local + deterministic, so no server work.
- 3.4 ⚙ Office door = rank (six leaves), `paChime` + card stamp on
  promotion (hooks into the story track when it lands; until then the
  L1 door and a dev toggle).

### Phase 4 — Story lives in the building (with DOOR_MASTER B3; 1–2 sessions)
- 4.1 ⚙ The office in-tray = the case-file screen: SP meter, chapter
  list, the pending directive, memos received (`dotMatrix` print-out on
  first read), commendations. `fax` when a directive arrives.
- 4.2 ⚙ First-visit scenes per room via `playCutscene` (the handler
  behind the redaction bar; "the break room is not a designated crossing
  point").
- 4.3 🖼 **Orientation** in the Training Room: the VHS tape (the ident's
  tracking/OSD CSS), "please do not turn around", the tutorial breach →
  the tutorial match on the Phase 6 map; ends with lamination.
- 4.4 ⚙ The motto plaque in the egress (and on loading screens) reads the
  chapter band: DO Observe Other Realities → DON'T. Open. Observe. Report.
  → DO OPEN OUR REALITY. Canon notices post to the Bureau of Continuity
  door.
- 4.5 ⚙ Sector `minChapter` gates → `sealed` doors with planks; rings gate
  on rank (`elevator` L4+).

### Phase 5 — The building is not reliable (1 session + art)
- 5.1 🖼 Room **variants** (`variants: [...]`): the same room re-rendered
  with one thing wrong (vending machine moved, a fourth door, the desk
  clockwise). After chapter N, each entry to a room rolls a small chance
  (seeded by `variantSeed` + day) to show a variant; hotspots carry
  per-variant rect overrides; nobody comments.
- 5.2 ⚙ Department swaps: two rooms exchange their egress doors for a
  session; the directory insists it was always so.
- 5.3 ⚙ Stabilized doors as shortcuts: a green door in a bay also appears
  as a door in a deeper ring (the "mastered mission door becomes an
  internal shortcut" rule).
- 5.4 🖼 **Rings**: Support / Operations / Executive backgrounds and the
  elevator as a room with floor buttons; the office moves upstairs at L4.
- 5.5 🖼 **H-Wing**: the straight corridor (a single wide image, scrolled
  horizontally — the only room that pans), right angles, the
  childhood-home door, the Backrooms crossing (MASTER C-12).

### Phase 6 — Engine-side pieces (each independent; 1 session each)
- 6.1 ⚙ **The Training Room map** `prebuilt_training`: 8×8, flat z3,
  `tilefloor` slab with `concrete_floor` gutters, `M.wall` ring of
  `drywall`/`gunmetal`, four corner scorch marks (`scorched`), registered
  like `clash_stage` (not in `EW_MAP_META`, no Δ), env: fluorescent
  (`tint` cool grey, no stars, thin fog). Used by Orientation, practice,
  and the L2/L3 scripted directives. `ref/training_room_v1` is the look.
- 6.2 ⚙ **Black Cube**: the Arena tower's model/label/announcer lines become
  the Saturnian Black Cube (three-renderer tower builder + HUD strings);
  `tower_destroyed` announces "THRESHOLD CLOSED".
- 6.3 ⚙ **Keys**: hourglass pickups/objective become Keys (model + strings;
  `hourglasses_collected` announces "THRESHOLD STABILIZED").
- 6.4 ⚙ (decision C-5) Nexus hold → double damage to the Cube instead of a
  win condition. Engine + AI + online relay; treat as its own balance item.
- 6.5 ⚙ Perf groundwork for Phase 7: measure the Guild Hub's draw calls
  and the ROADMAP §4 items (instancing, shadow pass) on a hub-sized map.

### Phase 7 — The walkable facility (committed; 3–4 sessions + 3D art)
Goal: walk the halls of headquarters in third or first person on the
battle engine, the way the Guild Hub already lets you walk to the cave.
The room graph, door states, gates and mission launcher from Phases 1–5
carry over unchanged: hotspots become trigger tiles and `stand` points
become prop/NPC positions.
- 7.1 ⚙ **Author the egress as a MapForge map** (`door_hq_egress`,
  data.js, registered like `md_hub` outside `EW_MAP_META`): `hollow` disc
  floor (`tilefloor` rings, `marble` centre), a ring corridor, `M.wall`
  facades in `drywall`/`gunmetal` with door openings, `M.lintel` mezzanine
  slab + `M.stair` up to it, the central desk as a monument, the cube as
  a hanging monument. The Guild Hub (`_mdBuildHub`, 8×8) is the template;
  this one is ~24×24.
- 7.2 ⚙ **Generalise the hub runtime**: `_mdOnBattlePrepared` (drop the
  CPU team, seat NPCs), `_mdSpawnHubNpcs` (roster NPCs → DOOR staff:
  agents in black at the desk, your recruited vessels on break),
  `_mdCheckStairs` (entrance tiles → `_hqTrigger(hotspotId)`), and
  `ThreeRenderer.hubFreeRoam` into `hq*` equivalents keyed off a
  `state._hqWalk` flag instead of `_isDungeonMode()`.
- 7.3 ⚙ **Camera**: the third-person rig already exists — Strike Mode's
  player-driven boom with collision (three-camera.js ~174-310,
  `cam._tpsCollide`) and its FIRST-PERSON EYE (three-camera.js ~211), with
  pointer-lock mouse-look (battle.js ~14288) and `ShooterControls` owning
  the keyboard. Expose a 3rd/1st toggle in Settings; default third person.
- 7.4 🖼 **Interaction**: walking into a door's trigger tiles shows the
  door panel (§3.7) / room prompt; `E` or click enters. Entering a ROOM
  shows that room's pre-rendered view (Phase 2 art) — the halls are 3D,
  the rooms are paintings, so only corridors and the egress need 3D
  interiors. Rooms can be promoted to 3D one at a time later.
- 7.5 🖼 **Door props**: one GLB (or a billboard from the D8 leaves) per
  door type; lamps as emissive quads tinted by `doorSiteState`; tape and
  planks as decals. User-made models follow the CLAUDE.md GLB recipe.
- 7.6 ⚙ **NPC lines**: bump an NPC → a one-line `showBattleDialogue` /
  `playCutscene` micro-scene (the break-room memos, "check your corners").
- 7.7 ⚙ Rings + H-Wing as further maps reached by the elevator/stairs
  triggers; H-Wing is the one map with right angles everywhere.
- Exit criteria: Play → loading → you are standing in the egress in third
  person; every door works; a room entry shows its painted view; 2D
  fallback (no WebGL) drops back to the Phase 1 clickable rooms.

---

## 5. Reference art protocol

### 5.1 What exists (received in chat 2026-09-03; NOT in the repo yet)
Commit these under `docs/door-hq/ref/` with these names so any session can
open them (Claude's file reader displays PNG/JPG). JPG at ≤ 2 MB each is
plenty; PNG is fine.

| File | What it shows | Used by |
|---|---|---|
| `central_egress_v1` | Two-tier round hall: mezzanine ring with five doors (green / amber / red lamps) and stairs down both sides; ground ring with five more doors; a huge black cube with the DOOR square-spiral glyph hanging from the dome; a round central desk piled with CRTs and boxes; round tables and cabinets; an agent in a black suit at the desk. Cool grey stone, oxblood dado, teal trim. | 1.1 hotspots, 1.5 background (acceptable as-is), the whole art direction |
| `office_doors_sheet_v1` | Six doors in curved-wall panels with a lamp above, human silhouette for scale, left→right: peeling wooden closet door with a vent (green) · plain hollow-core (green) · blue-grey wired-glass institutional (green) · black security door with keypad (red) · brushed-steel frosted (amber) · glass biometric threshold (green). | D8 office leaves (cut each door out onto transparency), MASTER A4 |
| `training_room_v1` | Top-down 8×8 lit grid on cracked concrete, four scorch stars, red lamps, wall clocks, glass observation booths on both sides, machinery in the corners, a green-lit door top and bottom, two agents outside the grid. | 6.1 map look, 4.3 Orientation backdrop, Training Room door panel |
| `janitor_closet_v1` | The L1 office: door ajar onto the curved hall, mop bucket and broom, sink, cleaning shelves, a breaker panel, a desk with a beige CRT, phone and lamp, clipboards on the wall, a locker with toilet paper on top, a folding chair, a round rug, a floor drain, an army cot. | 2.6 background (usable as-is), story voice |
| `concept_board_v1` | ChatGPT's board: an egress render with labelled doors (SUBURBAN SECTOR 12 / OCEANIC / MEDIEVAL / ASTRAL / QUARANTINED), a top-down ring map (Reception/Intake, Quartermaster, Archives, Personnel, Medical, Central Egress, TO TRAINING FACILITY), a training-room render with signs (ORTHOGONAL GEOMETRY EXPOSURE AREA · MAX OCCUPANCY 45 MINUTES · REALITY LEAKS POSSIBLE), five door-state UI chips (STABILIZED green / ACTIVE MISSION amber / QUARANTINED red / SEALED planks / CLEARANCE REQUIRED tape), and a four-ring vertical diagram (Executive / Operations / Support / Training). | The door-state vocabulary (§3.5), ring plan (A5), sign copy |

### 5.2 Production backgrounds (user-made, to R2 `Assets/door/hq/`)
- **Format:** 1920×1080 (16:9), JPG q≈80 or WebP, ≤ 600 KB. Name by room
  id: `central_egress.jpg`, `bay_terrestrial.jpg`, `office_l1.jpg`… New
  version = new filename (`_v2`) — auto cache-bust, no token needed for the
  image itself (the `DOOR_HQ` URL edit still ships with a bump).
- **No baked text or labels** (nameplates, signs, door numbers are DOM so
  they can change and be read). Sign props in the image are fine if they
  are blank plates.
- **Lamps above doors: OFF or neutral** — the page draws the colour. (The
  v1 egress has baked colours; acceptable for Phase 1 since the overlay
  lamp sits on top; re-render when convenient.)
- **Doors (D8):** from Phase 2, bay walls should have **empty frames** (a
  dark opening) where door leaves will be composited. The egress can keep
  its baked doors.
- **Consistent camera per ring** (same eye height / lens across rooms on a
  ring) so moving between rooms feels like one building; keep a 5% safe
  margin at all edges (the plane crops on tall/narrow screens).
- Optional: a `_night` or `_variant_x` render per room for Phase 5.

### 5.3 Door leaves (user-made, to R2 `Assets/door/hq/doors/`)
Transparent PNG, front-on, 512×1024 (or any 1:2), no lamp, no label,
including the frame if the design has one. First batch: the six office
doors (cut from `office_doors_sheet_v1`), then one per launch map, each
"absurdly wrong for its surroundings" (MASTER A5): motel door glowing with
sunlight, medieval portcullis in concrete (Camelot), suburban closet door
(Nuketown), wet submarine bulkhead (Atlantis), EXIT door to an unknown
destination (Backrooms), a freestanding door with no wall (Moon), an
airlock (Mars), pearly gate service entrance (Heaven), a furnace hatch
(Hell), a Swiss blast door with a lab placard (CERN), a hangar door with a
"KEEP OUT" stencil (Area 51), a ranch gate (Skinwalker), a redwood-lodge
door (Bohemian Grove), a stadium turnstile, and so on. Claude can propose
the full 29-line list when Phase 2.2 starts.

### 5.4 When to supply what
| Step | Needs | Can Claude proceed without it? |
|---|---|---|
| 1.1–1.4, 1.6, 1.7 | nothing (repo refs help hotspot drafting) | yes — placeholder plate |
| 1.5 | `central_egress.jpg` on R2 | no (URL swap only) |
| 2.2 | six bay backgrounds + door leaves | can ship bays on the placeholder plate with CSS door frames; leaves fall back to a generic door |
| 2.3–2.8 | one background per room | each room can ship on the placeholder until its image arrives |
| 3.x, 4.1–4.2, 4.4–4.5 | nothing | yes |
| 4.3 | optional VHS-style Orientation frames | yes (CSS VHS kit) |
| 5.1, 5.4, 5.5 | variant / ring / H-Wing backgrounds | no |
| 6.1–6.4 | nothing | yes |

---

## 6. Guardrails (repeat every session)
- RULE #1: no new game .js files. HQ code goes in data.js / map.js /
  index.html / styles-base.css / ui.js / audio.js / battle.js / profile.js
  as in §3.1. `door-hq.test.js` is repo tooling and allowed.
- RULE #1b: any R2 file delivered ⇒ bump `?v=` in index.html, ship
  index.html in the same message. Image files are cache-busted by filename.
- RULE #1c: no playtesting unless asked. Validate with `npm test`
  (`load-data.js` can evaluate `DOOR_HQ` headlessly) and `node --check`.
- RULE #2: the building never runs during a match; every `state._hq*`
  field is UI-only and skipped by `_serializeState`. Anything that appears
  mid-match (opponent card, Code Red banner if ever in-match) is relayed.
- Don't rename game words. The Shop is the Shop inside the Quartermaster.
- Every function keeps exactly one physical home + the directory. No dead
  ends: a missing image renders the plate + directory.
- Ranked players: from Play to a ranked queue is Play → (skip loading) →
  dispatch → Quick Play. Keep it three clicks or fewer; add a `Q` hotkey.
- Keep `_goToPlayHubLegacy` and the old hub page for one release as a
  kill-switch (`?nohq`, localStorage `ew_hq='off'`).

## 7. Why the walkable 3D hub is Phase 7, not Phase 1
The MD Guild Hub proves the engine can do a walkable hub with roster NPCs
and trigger tiles today, and Strike Mode already has the third-person and
first-person camera rigs. The 3D facility is the committed destination
(D1). It is not Phase 1 because of what is NOT there yet rather than how
the engine renders: the facility needs 3D props (doors, desk, cube,
lockers, a mezzanine) that do not exist and that the voxel/tile look
cannot fake convincingly; interiors need the hollow/lintel tech per room;
the ROADMAP §4 draw-call ceiling applies (an 8×8 match already carries
~1,800 objects; a 24×24 hall with interiors needs the instancing work
first); there is no 2D fallback; and none of that advances "menu
functions become places", which is a data + DOM problem the pre-rendered
approach solves in one session. Building the painted rooms first also
gives the 3D version its interiors for free (walk the halls, enter a room,
see the painting). The room graph is shared: `DOOR_HQ.rooms[x].hotspots`
become trigger tiles and `stand` points become NPC/prop positions.

## 8. Open questions (beyond the D-table)
- Should Community Maps / Map Editor be visible in the fiction at all at
  L1, or appear with Cartography at L3? (Rec: visible; the directory lists
  them as "unfiled".)
- Does the Guild Hub (Mystery Dungeon) get re-dressed as a DOOR field
  office, or does the Training hall's "condemned crossing" door explain
  it well enough? (Rec: the door + one memo; re-dress later.)
- Does the egress ever show other players (online count as "agents on
  shift")? The main menu already has `#mmOnlineCount`. (Rec: yes, cheap:
  N silhouettes at the desk.)
- Hazard Pay wallet on the strip vs only at the Quartermaster. (Rec: strip.)

## 9. Build log (append per session)

### 2026-09-03 (later) — rev 1.1: user decisions
D1 decided: pre-rendered first, walkable third/first-person facility is
the committed end state → new Phase 7 (uses the Guild Hub runtime + Strike
Mode's existing third-person boom / first-person eye rigs; painted rooms
become the interiors you step into). Rank titles decided (MASTER C-1).
Story gating decided as hybrid (MASTER C-4 / B3): SP from any mode incl.
PvP, plus single-player field requirements in the facility for certain
chapters — `DOOR_TEXT.CHAPTERS[].requires` and the office's AWAITING FIELD
WORK state are now part of Phase 4.1.

### 2026-09-03 — rev 1: plan written, no game files touched
Research findings that shaped the plan: the Play hub is `_goToPlayHub`
(map.js:98) rendering `playHubPage`; every menu function already has a
`window.*` entry point; the Mystery Dungeon Guild Hub is a working
walkable hub (free-roam + roster NPCs + entrance trigger) — kept as the
Phase 6.5 path; `matchHistory` already stores `mapId` + `winCondition` per
match so door mastery needs no new tracking, only a monotonic flag in
`progress.unlocked`; `EW_MAP_META.biomes` groups the 29 maps into six bays;
`doorSiteCrossings` gives every map its native enemy pool; the Δ boards
are the brief's 4v4-on-8×8 format. Reference art (5 images) described in
§5.1, awaiting commit to `docs/door-hq/ref/`.
