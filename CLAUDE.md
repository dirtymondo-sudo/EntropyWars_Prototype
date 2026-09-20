# CLAUDE.md

Entropy Wars — a browser Tactical-JRPG PvP prototype. `server.js` (Express +
socket.io) is only matchmaking/relay; ALL gameplay logic is client-side in
`index.html` + ~35 scripts loaded from a Cloudflare R2 bucket (custom domain
`cdn.entropywars.net`, brotli + long-cache edge) and CDNs.

## RULE #1 — DELIVERY WORKFLOW (do this, nothing else)
The game loads its scripts from the R2 bucket, NOT from the repo and NOT from a
local server. So Claude CANNOT make changes go live. The ONLY correct workflow:
1. Edit the ACTUAL existing files in the repo in place (never create new GAME
   .js files, never split game logic into a new module — work with what's
   already there; that rule protects the fixed R2 upload set. Repo-only dev
   tooling at the repo root (check-*.js, *.test.js, deploy.js, load-data.js)
   is fine and expected — see TOOLING).
2. Hand the user the COMPLETE edited file(s) in the chat AS ONE ZIP
   (SendUserFile). STANDARD since 2026-09-12 (the user's rule): every
   delivery is a single `ENTROPY_WARS_<TOPIC>.zip` built with `zip -j`
   (flat, no folders) in the scratchpad, holding every changed file —
   the R2 scripts, the bumped index.html (RULE #1b), and any repo-only
   files (tests, docs, CLAUDE.md). Never a loose file list. The chat
   caption says which files go to R2, which to Render, which to the repo.
3. The user uploads them to the R2 bucket (and manually syncs the repo so future
   sessions start from the latest) — or runs `npm run deploy` (see TOOLING),
   which uploads + cache-busts in one command.
DO NOT `git commit`, DO NOT `git push` (it 403s anyway), DO NOT generate patches/
diffs. The deliverable is always the full edited file, produced in chat.

### TOOLING (added 2026-07-29; THE SCOPE RULE 2026-09-18 — the user: "why do we even have to test at all, especially if the changes have nothing to do with the maps / areas")
- **TEST WHAT YOU TOUCHED, NOTHING MORE.** Before delivering: (1) `npm run
  test:quick` ALWAYS (`node --check` on every JS + the data / server parity
  and schema checks — ~15 s; a stray brace in data.js takes the whole game
  down at load, that is the one check that always pays); (2) the ONE
  `*.test.js` that names the feature you changed, if one exists (`node --test
  <file>`); (3) `npm run test:full` ONLY when the delivery changed an HQ
  room / terrain / link / find / tape or the terrain compiler. NEVER run
  `npm test` or `npm run test:full` as a session-end ritual — every session
  before this one did, on a VFX or AI change, and it was the whole cost. CI
  runs the full suite on every push on GitHub's minutes, not the user's.
- `npm test` — zero-dependency (Node 22 built-in runner): syntax-checks every
  repo JS, validates data.js content schemas (races/spells/abilities/classes),
  and diffs the hand-synced server.js economy copy against data.js (this
  caught real drift on day one: `swordfighter` missing from the server's
  AVAILABLE_RACES). A server-boot smoke test runs when node_modules exists.
  .github/workflows/ci.yml runs the FULL suite on every push
  (must live at exactly that path — GitHub ignores workflows elsewhere).
- **THE TWO SPEEDS (2026-09-18 — the user's rule: the end-of-session test
  run was burning credits).** `npm test` is the FAST suite (~2 min): the
  fifty heavy HQ GEOMETRY PROOFS (every terrain room compiled + its floor
  plan generated + the walker's reach solved + every hard tape's door-gun
  shot, `check-terrain.js` / `check-find-spots.js` spawned) are gated behind
  `test-heavy.js` — `test('…', heavy, () => …)` — and show as SKIPPED.
  **`npm run test:full`** (= `EW_FULL_TESTS=1`) runs them; run it ONLY when
  the delivery touched data.js's `DOOR_HQ` rooms / terrain / links / finds
  / tapes or the terrain compiler, never as a session-end ritual — CI runs
  the full suite on every push anyway (the GitHub failure e-mail means a
  REAL red: read the run's `not ok` lines, never re-run it). A new heavy
  test (anything that compiles more than one terrain room, reads
  `DOOR_HQ.finds` for every room, or spawns a check-* tool) takes `heavy`.
  `hqFindRoomInfo` is CACHED on the room object like `_terrainInfo`
  (`hqFindsDrop()` clears it) — never recompute a room's reach per find.
- `npm run test:parity` / `npm run test:syntax` — the individual checks.
  ANY edit to the ACCT_* constants / starter lists / race lists in data.js or
  server.js MUST pass test:parity. Since 2026-07-29 the server RUNTIME derives
  these from data.js at boot (server.js `ECON` object, headless load via
  load-data.js), but the server literals remain the boot-failure fallback AND
  the parity tool's extraction target — keep them synced, and keep them as
  plain `const NAME = <literal>` declarations (extraction is source-text based).
- `npm run deploy` — USER-run (needs wrangler auth + EW_R2_BUCKET env): finds
  the changed R2 files (git status, explicit args, or `--all`), node --checks
  them, bumps the `?v=` token in index.html, uploads via wrangler, and prints
  the Render-redeploy reminder. `--dry-run` previews. Without a bucket it
  still bumps the token and prints a manual upload checklist. Claude has no
  wrangler creds — Claude's deliverable is still files in chat (RULE #1);
  this script is how the USER ships them.
- `load-data.js` — loads data.js headlessly in a Node vm sandbox (real
  values, not a copy). Use it for any new data validation/tooling instead of
  regex-scraping data.js.
- `migrations/*.sql` (added 2026-07-29) — versioned D1 schema, applied at
  boot by server.js `runMigrations` (recorded in `schema_migrations`;
  duplicate-column/already-exists errors are tolerated so it converges on
  the pre-existing live DB). Schema changes = a NEW `NNN_*.sql` file, never
  ad-hoc ALTERs in code. Account tokens are SHA-256-hashed at rest since
  2026-07-29 (`players.token_hash`; plaintext column holds a `'#'+hash`
  tombstone, legacy rows are backfilled at boot — all lookups MUST go
  through server.js `findPlayerByToken`). HTTP endpoints are per-IP
  rate-limited (`httpRateLimit`). Production checklist: set
  `EW_ALLOWED_ORIGINS` on Render so arbitrary sites can't open sockets.

### RULE #1c — DO NOT PLAYTEST UNLESS EXPLICITLY ASKED
Playtesting (Playwright runs, browser automation, driving the game) burns a LOT
of the user's tokens and they are fully capable of testing themselves. After
making changes: syntax-check the edited JS (`node --check <file>`) and hand the
files over — that's it. Only run the playtest harness / any browser automation
when the user explicitly requests it (e.g. "playtest <mode>") or when a change
is genuinely impossible to validate any other way AND the user has agreed.

### RULE #1b — CACHE-BUSTING (MANDATORY on EVERY R2 file delivery)
Assets are served with immutable long-cache headers, so an uploaded file does
NOTHING until `index.html`'s version token changes — players keep the cached old
copy otherwise. Therefore: **whenever you deliver ANY R2-hosted file (.js/.css/
asset) in chat, you MUST also bump the `?v=` token in `index.html` and deliver
the updated `index.html` in the SAME message.** No exceptions — one R2 file
changed ⇒ ship a fresh index.html too.
- Bump = one global find/replace of the current token to a new unique one:
  `sed -i 's/?v=<OLD>/?v=<NEW>/g' index.html`  (e.g. `20260705a` → `20260705b`,
  or a fresh date). The token is shared across every URL, so one bump
  invalidates everything — that's intended. KEEP any suffix after the date+rev
  (the current tokens end in `-cors` — that part is load-bearing).
  `npm run deploy` / `node deploy.js` does this bump automatically.
- `index.html` is served by Render (NOT R2); the user redeploys it to Render.
  It must stay revalidated (short/no cache), so the new token is seen immediately.
- Asset URLs *inside* the JS (sprites/textures/audio/GLB in sprites.js `_S`,
  audio.js `_R2_BASE`, inline data.js/three-renderer.js URLs) are NOT yet
  `?v=`-tagged. If you change an asset in place, either rename its file (new path
  = auto cache-bust) or tell the user, since the token bump won't cover it.

## RULE #2 — ONLINE PVP PARITY (every gameplay/visual change MUST work online)
Online is host-authoritative: the HOST runs the entire engine (blitz turns, AI
auto-play, damage, banners, camera); the GUEST is a dumb mirror that only (a)
applies `state-sync` snapshots and (b) replays `relay` events it's explicitly
sent (online.js). **Anything that happens engine-side — a banner, a camera move,
a VFX, floating text — simply does not exist for the guest unless it is relayed.**
That's why online kept drifting behind VS-CPU. So, for EVERY change:
- New on-screen moment (banner/announce/VFX/camera)? Wrap the global fn in
  online.js like `showTurnBanner`/`showPlayerTurnAnnounce`/
  `playOffensiveActionCamera`: host `_emit('relay', {type: ...})`, plus a guest
  handler in the `socket.on('relay')` dispatcher. Relay ALL opts that change
  behavior (dropping `noActionCam` is how guests got cinematics on basic attacks).
- New `state.*` field the guest needs? Check `_serializeState`'s skip list.
  New UI-only field? ADD it to the skip list + `_guestUIKeys` if guest-local.
- New player action? Guest must EMIT it (engine-wrapper pattern, see
  `doEntropyStrike`/`doBuildAction`), never execute locally.
- Fog is ENFORCED online. Any camera pan / select / text keyed to an ENEMY unit
  must gate on screen-true visibility: `_shouldCameraFollowUnit` /
  `_isTileVisibleToViewer` (both use the fog renderer's `computeVisibleTiles`
  set — do NOT reintroduce flat awr-radius checks, they see through walls and
  leak positions to the opponent).
- Before delivering, ask: "what does PLAYER 2 (guest) see when this fires?"
  If the answer is "nothing" and it's player-facing, it's not done.
- NEVER store a unit / state OBJECT on a unit or on `state` — store the ID
  (`_lastDamageSourceId`, resolve with `unitFromId`). A back reference made
  `state.units` cyclic and every host snapshot threw (2026-09-12 freeze; see
  PLAYTEST_NOTES "Online freeze"). online.js `_ewSafeStringify` now cuts a
  cycle and warns with the key instead of killing the sync — treat that
  warning as a bug in the writer.

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

## ROOM 86 + ROOM VARIANTS (HQ plan 7.4 / 5.1) — added 2026-09-11
`DOOR_HQ.rooms.cafeteria` (data.js) is THE CAFETERIUM, a `kind: 'box'`
room off the ground ring at 75° (`central_egress.doors` id `cafeteria`,
`leaf_saloon`; the hall's break nook moved in). Counters: `notice` →
`_mountLeaderboard`, `till` → `_goToShop` (map.js's counter panel reads
the counter's `verb`). `npcSpots` = the roster on break; **`onlineSpots`**
= one anonymous D.O.O.R. agent per online player besides you
(online.js `_updateCounterUI` publishes `window._ewOnlineCount`;
three-renderer.js `_hqSpawnPopulation` seats them; `EW_HQ_ONLINE = n`
forces a crowd). Two new procs in `_hqProcBuilders`: `notice_board`
(wall, `depth`) and `mobius_bar` (the after-hours counter, `block`).
**VARIANTS**: a sheet room may carry `variants: { <id>: { when: { hours,
p }, label, sub, why, door, shell, drop, add, counters, agents, npcSpots,
onlineSpots, lines, spawn } }`. `hqRoomBase(id)` is the sheet
(`DOOR_HQ.roomsBase`); `hqVariantRoll(id, profile, { force, now })` = the
clock, else a roll seeded by `profile.door.hq.variantSeed` (set once per
profile in map.js `_hqRecordVisit`) + the day + the visit count;
`hqApplyRoomVariant(id, vid)` SWAPS `DOOR_HQ.rooms[id]` for the merged
copy (same `roomNo` / `kind` / `doors`) and re-plates every door whose
action leads into the room (`d._base` keeps the sheet's plate; `null`
restores); `hqRollRoomVariants(profile, opts)` does every room and is
called from map.js `_hqEnter` on a FRESH arrival only. Dev:
`?hqvariant=after_hours` / `window.EW_HQ_VARIANT` (`none` = the sheet).
Every reader goes through `DOOR_HQ.rooms[id]` — never cache a room
object across visits. doorhq.test.js guards the room, the roll, the
apply / restore and the source sites.

## ROOM 247 + FORM 365 + THE PUNCH CLOCK (HQ plan 7.4 / 7.9) — shipped 2026-09-11
`DOOR_HQ.rooms.clockroom` (data.js) is THE CLOCK ROOM, a `kind: 'box'` room
off the ground ring at 225° (`central_egress.doors` id `clockroom`,
`leaf_frosted`, between MEDICAL and RECORDS). Three counters: `form365`
→ `overlay: 'form365'` (map.js `_hqForm365Html`), `punch` → `overlay:
'punch'` (`_hqPunchHtml`), `codered` → the hall's Code Red panel. Three
procs in `_hqProcBuilders`: `world_clocks` (SHASTA · GIZA · LOCAL · CERN ·
THE MOON, none agree), `punch_clock`, `form_sheet`; every `wall_clock` in
the room hangs at its own height. **FORM 365 = Daily Office Operations
Requirements** (data.js, the block after `hqCodeRed`): `DOOR_HQ.dailyOps =
{ pay: 120, allBonus: 150, count: 3, force }`; `hqDailyOpsRows` draws three
lines from `HQ_DAILY_TEMPLATES` (site · cond · keys · exits · native ·
strike · delta · codered) seeded by `hqHash(date | employee no | 'form365')`
— the same sheet all day, a new one tomorrow; `hqDailyOps(profile, opts)`
reads progress from `door.hq.dailies` (date-matched); `hqDailyRowMet(row,
ev)` is the rule per template (lines that say WIN need a win); battle.js
`commitAchProgress` calls `hqDailyOpsJudge(p, ev)` AFTER the Code Red
commit (so a cleared Code Red counts), credits Hazard Pay locally
(`creditLocalGold`), sets `window._lastHqForm365` for the result stamp
(`_stampHqSite` → `.drs-site.form365`), and logs a 📋 line. Standard matches
only (`kind === 'match'`; MD / campaign never). The strip pill `#hqForm365`
(index.html, `.hq-strip-form`, map.js `_hqFillStrip`) mirrors the count and
opens the sheet (`window._hqOpenForm365`); Room 86's notice board mirrors it
too. Dev: `?form365=site,keys,strike` / `DOOR_HQ.dailyOps.force`.
`hqCanonToday(date)` = the day's canon date. **THE PUNCH CLOCK** = the
login streak: map.js `_hqRecordVisit(null)` (a fresh arrival from Play)
calls `hqPunchIn(profile)` once a day (`door.hq.punch = { last, streak,
best, days }`); `hqPunchClock(profile)` reads it (a missed day → streak 0,
`lapsed`). Viewer-local, nothing relayed (RULE #2). doorhq.test.js guards
the room, the sheet, the judge, the punch and the source sites.

## ROOM 1287 + THE HQ AVATAR (Occam's Barbershop, HQ plan 7.4) — added 2026-09-11
`DOOR_HQ.rooms.barbershop` (data.js) is OCCAM'S BARBERSHOP, a `kind:
'box'` room off the ground ring at 105° (`central_egress.doors` id
`barbershop`, `leaf_glass`, between the Quartermaster and Reception; the
vending machine moved to 98°, a `barber_pole` wall proc hangs at 111°).
**THE CHAIR** (counter `chair` → `overlay: 'barber'`, map.js
`_hqBarberHtml`) is where the officer chooses what they WALK THE BUILDING
AS: data.js `hqAvatarPref(profile)` → `{ mode: 'player' | 'vessel' | 'agent'
| 'race', race?, gender? }` from `door.hq.avatar` (default `player` = the
recruit, the Player cast model); `hqSetAvatar(profile, choice)` validates
and writes it (`door.hq.cuts` counts changes); `hqAvatarLabel(pref)` is the
wording. map.js `_hqAvatar(profile)` reads the pref AFTER the dev override
`EW_HQ_AVATAR` (`'vessel'` still forces the most-played rule); a `race`
whose model is missing falls through to the recruit. Picking = buttons with
`data-avatar` (`player` / `vessel` / `agent` / `race:<race>:<gender>`) →
`window._hqPickAvatar` → save → `ThreeRenderer.hq.setAvatar(av)` swaps
the model IN PLACE (same spot, heading, camera; the `hq-player` rig record
is evicted and respawned — never a room rebuild) → the panel re-renders.
Only declassified races with a rigged, animated model are offered
(`profile.account.unlockedUnits`, `getRace3DModel`, `_DEV_UNLOCK_ALL`).
**THE MIRROR** (counter `mirror` → `_mountReactProfile`) is the ID card;
profile.js `doorCardPortrait` now lets a `race` / `agent` pick lead the
photo (the recruit / vessel modes keep the most-played rule). Procs:
`barber_chair` (floor, `block`), `barber_mirror` (wall, the catalogue
`glow` = its vanity bulbs), `barber_pole` (wall, a canvas-helix stripe
texture cached in `_hqPoleTex`; it does not turn). The in-tray shows a
WALKS AS row. Cosmetic and viewer-local — nothing on `state`, nothing
relayed (RULE #2). This answers HQ plan D13. doorhq.test.js guards the
room, the helpers and the source sites.

## ⇄ RESERVES — the bench in the respawn modes (2026-09-14, local delivery)
Match-select CONFIG → **RESERVES: Off / ⇄ Bench** (match-select.js, sticky
localStorage `ew_reserves`, offered only when the mode has `respawns` and is
not Clash / FFA; mirrored into map.js `_msReserves` → `_msConfirm` sets
`state.reserves` and sizes the party like Gauntlet: `CONFIG.teamSize` =
`RESERVE_RULES.roster` (8 — the Team Archive's cap), `CONFIG.gauntletDeploy`
= `RESERVE_RULES.deploy` (4, the chosen team size caps it lower), SPAWNS
sliced to the deploy). Constants: data.js `RESERVE_RULES` (on `window`).
The Gauntlet plumbing (battle.js `state.bench`, `doSwitch`,
`_gauntletPartitionBench`, the replacement modal) is shared through ONE gate,
**`_benchOn()`** (= Gauntlet OR `_isReservesMatch()` = `state.reserves`, which
SYNCS — never gate on CONFIG there); every site that read `_isGauntlet` for
the bench reads it now (partition, wipeout counts, spawn zones, the SWITCH
blade, the party dock strip, the AI retreat). The reserves-only rules read
`_isReservesMatch()`: **(1) the bench is a rotation, not a hospital** — a
switch keeps HP / MP / lingering statuses (stat stages + shield reset, as in
Gauntlet), nothing heals on the bench; **(2) death owes the ladder, the
ladder follows the seat** — map.js `defeatUnit` keeps `_respawnIn` and calls
`_reserveQueueSeat(fallen)`: the human picks at the death (the Gauntlet modal
with `seat: true`, `fallenId`, `rounds`; WAIT keeps the fallen unit; hud.js
`GauntletReplaceModal` → `_reserveSeatPick(player, reserveId|null, slot,
resume)`), the AI takes its healthiest free reserve above `seatMinHpPct`;
the promise is `fallen._seatFillId` / `reserve._seatFor` (a promised reserve
leaves the FREE list — `_gauntletReserves(player, { free: true })`, the
switch verb's read); NOTHING moves until `processRespawns` revives the
fallen unit on the clock at a zone the team holds (the Nexus spawn lockout
applies), then its tail calls `_reserveTakeSeat(unit)` — the reserve stands
where the fallen unit respawned (its own HP, Spawn Guard) and the fallen
unit revives ON THE BENCH: one body per death, on the ladder's clock; **(3)
switching costs the turn, not a spawn** — `switchApCost` 2, the incoming
unit acts with the leftover AP, and `_switchesLeft(player)` caps voluntary
switches at `switchesPerRound` (1) per team per round (`state.
_switchesThisRound`, reset at the round transition + match start; Gauntlet
stays uncapped). **THE COUNTER-PICK CHIP**: hud.js `_hrlgReserveMatchup(r,
st)` = ▲ enemies the reserve hits WEAK / ▼ enemies that hit it WEAK, the
same `getTypeDamageMultiplier` read as the damage roll, gated by
`_isUnitVisibleToViewer` (screen-true, RULE #2); it rides the switch blade's
`note` (`noteColor`) and the seat modal's rows. **ONLINE (RULE #2)**:
`doSwitch`, `_gauntletDeployReserve` and `_reserveSeatPick` are wrapped in
online.js (the `bench` game-action — not `engine`: a seat pick names a DEAD
seat during anyone's turn); the host validates by the SENDER (`remoteP`
owns the switching unit AND it is the active unit; the pending replacement
is the sender's). A human seat is LOCAL **or REMOTE** (`_benchSeatIsHuman`)
so the host waits for the guest's pick; the guest's modal reads the synced
`_gauntletPendingReplace`. This also fixes Gauntlet's switch, which was
host-only. NOT BUILT: the online LOBBY has no RESERVES toggle (its friendly
config carries mode / map / teamSize / rounds only) — a reserves match is a
VS-CPU launch today; the engine + relay are ready for it. `npm test` runs
`reserves.test.js`. Unseen live (RULE #1c): the seat modal over a paused
enemy turn, the chip's colours on the blade, the dock's 🪑 tag.

## THE TUTORIAL — ORIENTATION, DAY 1 (HQ plan 4.3) — shipped 2026-09-13
Main menu → **Tutorial** (`_goToTutorial`, index.html `.mm-btn-tutorial`)
→ `#tutorialPage` THE SHELF (map.js `_renderTutorialPage`): the ORIENTATION
TAPE, three CORE tapes (1 FIRST STEPS · 2 THE PRESS · 3 THE THREE WAYS OUT)
and six OPTIONAL ones (high ground · fog · facing/overwatch · abilities/MP ·
items · the HUD tour), each stamped FILED off `profile.door.tutorial`
(data.js `tutorialProgress` / `tutorialMarkDone`). Completely optional,
unscored, nothing recorded. In the building the RANGE console (Room 64)
offers the same (`data-tutorial="tape"` → the tape + lesson 1, returning to
the console; `_goToTutorial` → the shelf). **CONTENT = data.js** (the block
after `DOOR_TEXT`): `TUTORIAL_TAPE` (the beats; `draft: true` — the
narration is Claude's DRAFT for the user to rewrite, A11/A15),
`TUTORIAL_LESSONS` (board · order · steps: `say` / `hint` / `focus` /
`allow` / `goal` / `cpu` / `enter` / `auto` — the header comment is the
schema), `TUTORIAL_MECHANICS` (THE DRIFT REGISTER, below), `tutorialFacts`
(the `{{numbers}}` in every copy string, read LIVE from the engine through
ui.js `_tutEngineFacts`, else from the pins). **RUNTIME = ui.js "THE
TUTORIAL RUNTIME"**: a lesson is a REAL VS-CPU match on `prebuilt_training`
(the spell lab's recipe: `applyGameMode` + pinned partyBuilds / partyMeta
`customSpells` + `applyPartyBuild(false)` + `startMatch()`; intro cine off;
no party builder, no match select), the dummies are CTRL.AI units whose
activation runs `_tutCpuTurn` (hold / approach / attack / guard / pass)
instead of aiTakeTurn, the player's verbs are gated by the step's `allow`
(`_tutActionAllowed` at doMove / doAttack / doSpell / doItem / doInspect /
doGuard / triggerEndTurn / channelNexus / chooseActionMenu; hud.js
`_tutFilterBlades` greys the ladder LATER and `b.tut` glows the taught
verb), the engine reports through `_tutEvent` (activation · move · attack
· press · spell · item · inspect · guard · endTurn · channel · entropy ·
cube), a 200 ms poll judges `goal` (`_tutGoalMet`), THE COACH (`#tutCoach`,
styles-base.css "THE COACH", `.tut-glow` = the pointer) says the step, the
lesson's `order` is the initiative (state.js `buildBlitzTurnOrder` →
`_tutTurnOrder`), `checkWin` / `checkWinConditionOnly` never end a lesson,
leaving = `backToMainMenu()` → `window._tutReturnPage` (map.js
`_hqReturnOrMenu`) or the console. **THE TAPE** = ui.js `doorTapePlay()`
(`#doorTape`, styles-cinematic.css "THE ORIENTATION TAPE": the ident kit's
power-on / tracking bar / OSD round drawn SVG slides `_TAPE_ART`, a typed
caption, SPACE next / ESC skip / reduced-motion). Dev: `Tutorial.start(id)`
· `Tutorial.skipStep()` · `Tutorial.state()` · `doorTapePlay()`.
**THE RULE — a mechanic change must flag its tape.** `TUTORIAL_MECHANICS`
names, per mechanic, the numbers the copy states (`pins`: name · file ·
value, read from SOURCE by `check-tutorial-drift.js` / load-data
`extractConst`) and the rule functions the lesson describes (`watch`: file ·
fn · `hash` = sha1 of the whitespace-collapsed body). `npm test`
(tutorial.test.js) FAILS on any drift, naming the lesson. When you change a
pinned constant, a watched function, the type wheel or the arena row: RE-READ
the named lesson (copy, steps, board), fix it, then update the pin's value /
`node check-tutorial-drift.js --stamp`. Adding a lesson = a `TUTORIAL_LESSONS`
row + its mechanics in the register (`teaches` ↔ `lessons` must agree — the
test checks). Never edit a hash without re-reading the lesson. Viewer-local,
VS-CPU only (RULE #2 has nothing to relay). UNSEEN LIVE (RULE #1c): the
coach's placement over the HUD, the tape's timing, the dummies' pacing.

## ROOM 111 + ROOM 1984 (The Trophy Case, The Interrogation Room, HQ plan 7.4) — added 2026-09-13
`DOOR_HQ.rooms.trophycase` (data.js) is THE TROPHY CASE, a `kind: 'box'`
room off the MEZZANINE at 290° (`central_egress.doors` id `trophycase`,
`level: 1`, `leaf_glass_exec`, between Bay 6 and the Bureau, directly
over the EMPLOYEE OF THE MONTH board; the frame that hung at 288° moved to
281°). Counter `cabinet` → `fn: '_mountReactTrophies'` (profile.js) =
`_mountReactProfile({ tab: 'achievements' })` — `ProfilePage({ initialTab })`
is the only change to the page; map.js `_HQ_MODAL` maps the new mount to
`_unmountReactProfile` (add any future tab-mount there too or the building
never resumes). **`hqTrophyCount(profile)`** (data.js, on `window`) =
`{ done, total, champs, feats, lines }` off `progress.unlocked` — the ONE
read for the panel's count and the proc's gold. Proc `trophy_case`
(three-renderer.js `_hqProcBuilders`, wall, `glow`): three rows of three
plaques, gold for the first `lines.length` (read once at build). `DOOR_HQ.
rooms.interrogation` is THE INTERROGATION ROOM, a box room off the ground
ring at 255° (door id `interrogation`, `leaf_cell`, between Records and
Bay 1; the frame / extinguisher / boxes there moved to 247° / 262° / 263°).
Counter `table` → `overlay: 'transcript'` → map.js `_hqTranscriptHtml`:
the TRAINING MATCH imitation ledger from battle.js `_ewImitationSnapshot()`
(`total` + `weights` vs `AI_WEIGHT_DEFAULTS`) and a `[data-transcript]`
button that opens `_ewImitationReport()` IN PLACE (never through
`_hqDoAction` — a bare `fn` outside `_HQ_MODAL` leaves the building),
enabled by the new one-liner `_ewImitationHasReport()`. Counter `glass`
has `action: {}` — `_hqCounterPanelHtml` renders its own panel by id. Proc
`steel_table` (floor, `block`, top at 0.76 — tabletop props sit at
`y: 0.76`). Both rooms are viewer-local (RULE #2). doorhq.test.js guards
the rooms, the helper and the source sites.

## ROOM 1111 + ROOM 5150 (Medical as a ward, The Padded Room, HQ plan 7.4) — added 2026-09-13 rev 3
`DOOR_HQ.rooms.medical` (data.js) is MEDICAL, a `kind: 'box'` room behind
the ground ring's hospital door at 210° (`central_egress.doors` id
`medical` — it was a door straight to `_goToCampaign`; the number `1111`
now sits on the ROOM, `hqDoorNo` reads it through). Counters: `desk` (THE
SERVICES DESK) → `_goToCampaign` (Challenge mode); `chart` (THE CHART, a
`clipboard` on the east wall between the two cots) → `overlay: 'chart'` →
map.js `_hqChartHtml`, which reads **`hqMedicalRecord(profile)`** (data.js,
on `window`, beside `hqTrophyCount`) = `{ matches, wins, exits, rate,
healing, dodges, crits, days, leave, condition, tone, note }` off
`profile.career` + the punch clock — the ONE read for the ward; the
CONDITION line is INTAKE / FIT FOR DUTY / UNDER OBSERVATION (exits >
wins) / ADMINISTRATIVE LEAVE (`profile.door.leave` truthy — the story's
hook, nothing sets it yet). Door `padded` (north wall, `leaf_cell`) →
`{ room: 'padded', at: 'egress' }`. `DOOR_HQ.rooms.padded` is ROOM 5150 ·
THE PADDED ROOM, a 3.6 × 3.6 box room: three walls wear the wall proc
`wall_padding` (three-renderer.js `_hqProcBuilders`, front +z, mount
0.1, no block), the fourth is the door's back to the ward; counter `hold`
has `action: {}` — `_hqCounterPanelHtml` renders its panel by id (the
chart's condition row + SERVE IT / NOT TODAY). Both rooms are viewer-local
(RULE #2). doorhq.test.js guards the rooms, the helper and the source
sites. NOTE for tests that read data.js through the vm sandbox: never
`deepStrictEqual` an array from it (a different `Array` realm fails on
identical contents) — compare `.join(',')` or `.length`.

## ROOM 42 + ROOM 1337 (Records as a room, IT, HQ plan 7.4) — added 2026-09-13
`DOOR_HQ.rooms.records` (data.js) is RECORDS, a `kind: 'box'` room behind
the ground ring's wired double door at 240° (`central_egress.doors` id
`records` — it was a screen door with two alts; the number `42` now sits
on the ROOM, `hqDoorNo` reads it through). Counters: `codex` (THE READING
DESK) → `_goToCodex`; `unfiled` (THE CARD CATALOGUE) → `_mountCommunityMaps`
— a MODAL over the paused building (map.js `_HQ_MODAL` maps it to
profile.js `_unmountCommunityMaps`). Door `tapes` (north wall, `leaf_exit`)
→ `{ room: 'observatorium', at: 'projector' }` (the old REPLAY alt, walked;
`_hqGoTo` resolves a counter id in a box room). `DOOR_HQ.rooms.it` is
ROOM 1337 · IT, a box room off the MEZZANINE at 120° (door id `it`,
`leaf_holographic` — `leaf_hollow_core` is the L2 rank leaf, so the plan's
keypad hangs INSIDE by the way out; the round cabinet moved 120° → 113°).
Counters: `library` → `_goToSpellLibrary` (map.js `_spellLibraryBack` now
returns to the building when `_hqHome`, else to Settings), `bench` →
`_launchBalanceSim`, `racks` → `_launchAITraining` — all three in
`_HQ_FN_LABELS`; they leave the building like every page fn. Procs in
`_hqProcBuilders` (three-renderer.js, wall, front +z): `card_catalogue`
(block), `server_rack` (block, `glow`), `keypad`. A counter with a `desc`
and no panel of its own states it (`_hqCounterPanelHtml`, before the fn
button). Both rooms are viewer-local (RULE #2). doorhq.test.js guards the
rooms, the moved prop, the counters ↔ props and the source sites.

## ROOM 360 + THE STAR CHART (The Observatorium, HQ plan 7.4) — added 2026-09-11
`DOOR_HQ.rooms.observatorium` (data.js) is THE OBSERVATORIUM, a `kind:
'box'` room off the MEZZANINE at 240° (`central_egress.doors` id
`observatorium`, `level: 1`, `leaf_holographic`, directly above Records
between Bay 3 and Bay 6; the office locker moved to 232°). A planetarium:
counter `projector` → `_ewReplayLastMatch` (Replay MOVED here from
Records — Records' door `alt` is now `{ room: 'observatorium', at:
'projector' }`; map.js `_hqDoorPanelHtml` renders a door alt with `room`
/ `at` as a `data-room` button) and counter `chart` → `overlay:
'starmap'` (map.js `_hqStarmapHtml`). **`hqStarChart(profile)`**
(data.js, before the Keys block; on `window`) is the ONE layout every
reader shares: a unit disc (x east, z south) in equal wedges in bay
order, Bay 1 at twelve and clockwise, each bay's sites zigzagging from
the rim inward in roster order (seeded by `hqHash(id + '|star')`, never
the clock), joined in that order; every star carries `st` (=
`doorSiteState` on a synthesized `{ action: { mission } }` door:
stabilized / unstable / codered / sealed), `done / total` and `siteRoom`.
Readers: three-renderer.js procs `star_dome` (ceiling Points + the
constellation LineSegments + a number plane per star facing down),
`star_chart` (a wall proc; `_hqStarChartTex` canvas, cached by the lamps
it shows), `star_projector` (the room's light) and `telescope`; the
panel's SVG (`.hq-starmap` / `.hq-sky-*` / `.hq-star` in
styles-base.css). **Point at a star** = `[data-star]` in the panel click
handler (read before `[data-fn]`) → `window._hqOpenThreshold(mapId,
{ star: true })` opens the threshold's OWN door panel from anywhere in
the building (a door synthesized from `DOOR_HQ.thresholds[id]` like the
CROSSING console's, id `chart` so the launch's `doorId` returns you to
the chart post-match); `d.star` adds ◂ THE CHART (`[data-starmap]` →
`window._hqOpenStarmap`). A box shell can be painted down:
`shell.floorColor` / `wallColor` / `dadoColor` / `ceilColor` and
`ceilTile` (metres per ceiling tile) — `_hqBuildBoxShell`; the room's
ceiling is the `void` terrain sheet. `_hqStarColor(st)` is the one
colour rule (green / amber / red / grey). Viewer-local, nothing relayed
(RULE #2). doorhq.test.js guards the room, the layout and the source
sites.

## MAP SETTINGS (near scenery) — added 2026-09-06
Every Δ board is dressed like the Training Room: a NEAR builder builds the
board's immediate surroundings (apron/plateau, moats, walls, buildings, trees,
props) in three-renderer.js `_NR_BUILDERS` ("MAP SETTINGS" block, right before
`_HZ_NEAR_BUILDERS`), keyed by `near: '<key>'` on the map's EW_MAP_META row
(data.js; folded into the Δ preset env → `state.mapEnv.near`). The far
floating roster (`env.scenery`) is untouched. Use the `_nr*` kit (apron,
moat, wall ring, room, blocks, trees, fence, lamps, props…) — never new
files. Enclosures opt into the line-of-sight fade with `occ:true`. Screenshot
any board with `NODE_USE_ENV_PROXY=1 node playtest_maps.js <map…>` (repo
tooling; see PLAYTEST_NOTES "MAP SETTINGS"). Kill-switch:
`window.EW_NO_FACILITY_SCENERY`.

## THE MAP-BUILDER BUILDINGS IN THE LANDSCAPE + THE FOLIAGE EVERYWHERE — 2026-09-14
The editor's **building_1..8** sprites stand in the urban landscapes as
prisms: three-renderer.js **`_nrSpriteBuilding(K, key, x, z, o)`** (right
after `_nrHouse`) = the board's own `_buildBuildingPrism` look — four faces
wearing the sprite between its alpha trim (ui.js `_alphaScanSprite`, async:
the prism is rebuilt through `_nrPending` kind `spr` when the scan lands), a
dark core, a brick roof at the sprite's roof line, **`stack`** storeys for a
tower (whole-sprite storey blocks — never RepeatWrapping, the sprites are
NPOT), `roofKit` mast + beacon from 3 storeys; **`_nrSpriteBlocks(K, o)`**
walks the `_nrBlocks` street (lots, alleys, gates, `only`, the neon signs)
with those prisms. Readers: `_NR_BUILDERS.cyberpunk` / `.strip` / `.downtown`
(the procedural `_nrBlocks` neon boxes are gone there — `_nrBlocks` itself
stays for anyone else) and the world rim's **`city`** kind (`_WD_RIM.city`:
every `city` rim row — Cyberpunk, the Stadium, the Strip, Downtown — is the
map-builder buildings stacked to `h`; `proc: true` on the row = the old
boxes; `keys` = another set). **THE FOLIAGE EVERYWHERE**: `_WD_RIM.trees`
plants `_nrTree` (the foliage OBJs — Tree_* / DeadTree_*; `h` tiles, else
1.5 × the old `s`) instead of `_nrTreeProc` — the Haunted House's rim was
the procedural trunk + sphere; the HQ site board's own trees
(`_hqBuildSiteBoard`) are `_nrTree` on a bare `_nrKit` instead of a trunk +
sphere; Bohemian Grove's redwoods are tall `_nrTree`s. Late fills join the
world haze through **`K._wdFog`** (set in `_worldBuild`) → `_nrInjectWorld`
(the foliage swap and the trim rebuild both call it — a material made after
`_worldBuild`'s traversal is otherwise unfogged and undissolved). The HQ
loop polls `_nrPollPending` UNCONDITIONALLY now (the board's trees swap
without a setting). `npm test` runs `landscape-buildings.test.js`. Unseen
live (RULE #1c): the prisms' scale against the board's own buildings, the
trim landing (a flash from untrimmed to trimmed), the rim tree count on
the Haunted House (48 + 58 OBJ clones).

## THE CROSSING (opening cinematic) — added 2026-09-06
The match intro (battle.js `playOpeningCinematic` + three-renderer.js
`introCineStart/_introBuildDoor/_introUpdateDoors`) no longer marches teams up
a staircase (the MAP SETTINGS aprons buried it). Each team files through a
freestanding D.O.O.R. threshold standing on the setting's apron outside its
spawn lane (past the moat): the leaf is the map's own `DOOR_HQ.thresholds`
catalogue door (data.js; `_delta` stripped from the mode id, else the `near`
key, else `leaf_closet_alt`), buzzed open / stamped shut with the DOOR sound
kit, dissolved at the cross-map push. Units are hidden "on the other side"
until their turn (walk-tween `_holdHidden`). The near kit publishes the apron
facts in `_nrLastKit` (apron top, level `B`, moat gap) — a board with no
setting gets a floating landing instead. Loading screen pre-warms the leaf
(`introCineWarm`). Lone doors also float in every far roster (`_hzLoneDoor`,
monument key `door`). Kill-switch unchanged: `window.EW_DISABLE_INTRO_CINE`.
Camera framing for beats 1–2 is anchored on `info[p].doorOut`/`zB` (battle.js
`doorLift`) — tune those two numbers before touching the renderer.

## THE MAIN MENU SCENE (the lone door in the open) — added 2026-09-08
The main menu's black void is a PLACE: three-renderer.js `ThreeRenderer.menu`
(`_menuEnter/_menuLeave/_menuBuild`, right after `_hqApi`) is a self-contained
scene on the SHARED renderer — same contract as the HQ — re-parented into
`#menuStage` (index.html, first child of `#mainMenuPage`) by map.js
`_menuSceneEnter` (called from `_showTitlePage` for `mainMenuPage`; every
other page calls `_menuSceneLeave`). ONE crossing door stands ~65% across
the frame (right of the text column) in the middle of a desert or out on
the Antarctic ice, the Sedan (the honda civic's static car GLB) is parked
off to the side with its headlights on the door, the site's own sky + far
roster (`_hqBuildSky(room, Hx)` / `_hqTickSky(now, Hx)` now take a target
record) hang round it, the page's CSS motes drift over it, and a scrim
(`.void-menu.menu-3d .menu-stage::after`, styles-base.css) keeps the left
column readable. The door IS the match door: `_introBuildDoor` (the
crossing's threshold builder — frame, seal, case line, catalogue leaf —
the leaf is a PLAIN door, `leaf_hollow_core`, per the user) on a flat kit
at y=0; `_MENU_BIOMES` (renderer) holds every framing number (camAt /
lookAt / doorAt / doorYaw / sedanAt / sedanYaw / cineDist / cineSide /
cineLookOff in METRES, the leaf key, the floor terrain key, the far
roster, `lightMul`) — tune those, not the code. **The camera looks down
+Z, so SCREEN-RIGHT IS WORLD −X** (the door stands at x = −2.6 to land
right of frame — the first cut mirrored it). The door stands SHUT on a
fresh arrival from the title (`enterGameFromTitle` → `menu.reset()`);
ENTER on the menu (ui.js keydown → map.js `_menuSceneEnterKey`) plays
THE ENTER BEAT — `menu.playEnter()`: the camera pushes to cineDist m in
front of the door (`_MENU_CINE` keyframes: push 1.7 s, the buzz + swing
at 0.8 s, hold 1.1 s, pull 1.9 s), the leaf swings open with the light
behind it, then the pull back out with the door left open; ENTER again
shuts it (the stamp). The "⏎ ENTER · THE DOOR" hint (`#menuEnterHint`)
shows while it stands shut (`onState` callback). Screenshot it with
`NODE_USE_ENV_PROXY=1 node playtest_menu.js desert|antarctica [tag]`
(repo tooling; `EW_MENU_CINE_SCALE` stretches the beat so a ~1 fps
software-GL run can photograph it — see PLAYTEST_NOTES "THE MAIN MENU
SCENE"). Built once per session and kept across visits;
`menu.dispose()` drops it (the Settings biome button rebuilds). Off = the
classic void: `?nomenu3d`, localStorage `ew_menu3d='off'` (Settings → Main
Menu Scene), `window.EW_NO_MENU_SCENE`; `EW_MENU_BIOME` / `?menubiome=` /
localStorage `ew_menu_biome` pick desert / antarctica (else a coin toss per
load); `EW_MENU_NO_POST` = bare render. Entering parks a post-match battle
renderer (same guard as `_hqEnter`) and refuses over a live battle or the
building (map.js leaves a suspended HQ first). Fixed on the way: a HOT
crossing leaf (introCineWarm) landed synchronously before its group was
parented, so `_introBuildDoor`'s fit ran on `g.parent` = null and bailed —
the guard is now `rec.dead` (set by `_introDropDoors`). doorhq.test.js
source-scans the signatures.

## THE TERMINAL (the match-select screen is a console's CRT) — added 2026-09-08
Match-select is DIEGETIC: match-select.js renders a full-frame CRT monitor
(`.ms-crt` bezel → glass → screen, scanlines, the phosphor's warm black;
CSS in styles-base.css "THE TERMINAL" block, `.ms-tty-*` = the terminal
typography) in two homes and two VARIANTS. Homes: `#hqTerminal` inside
`#hqPage` (map.js `_hqOpenTerminal(spec)` — the building waits underneath,
paused via `_hqSuspend`; three-renderer.js `hq.focusScreen({ counterId })`
pushes the camera onto the desk's `crt_terminal` prop (found by catalogue
key in `_hq.props`, +Z-front, `hq.unfocus(ms)` pulls it back; the avatar
hides under the push) and the overlay powers on 430 ms in (`.on` =
`msCrtOn`, `crtOn` SFX); `#modePage` = the classic route (`?nohq`,
VS CPU from the play hub) — the same monitor on black, `frame: 'page'`.
Variants (`_mountReactMatchSelect({ host, variant, frame, pre })`): **SITE**
(`pre.locked`) = the site is the room you stand in — site file, then BOARD
(Δ 8×8 ↔ the full site, `pickBoard`), GAME MODE (Clash excluded — it is
pinned to its own stage; Gauntlet on full boards only), TEAM, ROUNDS, CPU
TEMPO, FILE THE CROSSING; **FULL** = MODE · every SITE (cards, filters,
optional `pre.presets` chips) · CONFIG. Who opens what (map.js
`_hqInteractTarget` → `_hqConsoleTerminal`): a walkable site's CROSSING
console → SITE for `room.site` (sealed / gated sites keep their panel);
the Training Room's RANGE console → FULL with ORIENTATION / PRACTICE
presets (`_hqRangeTerminal`; the facility boards have NO Δ cut — launchId
is the site); DISPATCH's panel → "THE DESK'S SCREEN" (`data-terminal`,
`_hqDeskTerminal`) → FULL, bare pre; a bay threshold's CROSS / DEEP /
RESPOND (`_hqLaunchMission`) → SITE over the paused ring, no push. The
launch contract is unchanged: `_msSelected*` mirrored during render,
`window._hqPreselect` (+ `locked`, `presets`) read by `_msConfirm`, the
CPU pool pinned only while the filed map is the pre-selected site. FILE →
`_msConfirm` → `_hqTerminalClose({ launch: true })` drops the overlay and
`_hqLeave`s (the match owns the canvas next; the return spot is the
console — `doorId` → `_hqLastDoor`). STEP AWAY / ESC → `_hqTerminalClose()`
→ power-down (`.off`, `vhsEject`), `unfocus(560)`, `_hqResume`. `_msBack`
/ `_msConfirm` / the walker's `onEscape` check `_hqTerm` first; `_hqLeave`
and `_hqEnter` drop a screen left up. **THE DEAD-CURSOR FIX that came with
it**: `requestPointerLock` is async — closing a panel un-paused the walk,
which re-requested the lock, and the grab landed AFTER `_hqLeave` on the
match-select page. Now `_hqUnbindInput` exits the lock unconditionally and
stamps `_hqLockStaleAt`; a document `pointerlockchange` listener
(`_hqOnLockChange`) releases any lock that lands while the walk is PAUSED
or within 2.5 s of a leave; panels on the way to a launch close with
`_hqClosePanel({ keepPaused: true })`. `npm test` (doorhq.test.js "the
terminal") source-scans all of it. Fallback: no host / no React → the old
panel + the page.

## THE FORGE TERMINAL (party builder redesign) — Stage 1 SHIPPED 2026-09-09
`PARTY_BUILDER_PLAN.md` is the staged plan for rebuilding party-builder.js
around the seven reference images in `party_builder_references/` (view
them with the Read tool): ONE CRT monitor (the match-select `.ms-crt`
chrome), four tabs (ROSTER = the champ-select wall · TECHNIQUES = the
three-pillar circuit + the technique panel · GEAR · DOSSIER), the party as a
ROW of circular portraits along the bottom, stats as pills, passives as
sticky notes ON THE BEZEL, and the hero playing its real cast animation +
VFX on the stage when a spell is hovered / equipped. Read the plan's §2
(anatomy: mount points, `EWCharViewer`, the cast chain, the VFX binding —
`ThreeVFX.init` is single-scene and online.js RELAYS `VFX3D.fire`, so a
preview must route around it), §3 (the rounding rule and the other design
rules), §5 (the six stages, in order), §6 (decisions the user still owns)
before touching the builder; append to its §9 build log every session.
**Stage 1 shipped (2026-09-09)**: party-builder.js renders the monitor —
root `.ms-crt.ms-crt-page.ms-crt-forge.pb-tarot` → bezel → glass →
`.ms-tty.pb-tty` (head · `.pb-tabbar` · `.pb-body[data-tab]` · `.pb-party`
· `.pb-foot`); `PB_TABS` (`window.PB_TABS`, `window._pbSetTab(id)`), React
state `pbTab`, ROSTER first, `pickRace` flips to TECHNIQUES; Q / E, [ / ],
1–4, ← →, ESC (closes a window, else BACK). The STAGE (`.pb-stage`, one
keyed element) never remounts across tabs — `EWCharViewer` is a singleton.
Windows (`PbWindow`, module-level — a per-render component remounts on
every keystroke) replace the modals; the standalone locker is `.pb-locker`.
CSS = styles-base.css "THE FORGE TERMINAL" block (`#builderOverlay` is
positioned there because the CRT root is absolute). `npm test` runs
`party-builder.test.js` (source scans: tabs, root, row, one stage, the
lock-flow names, the mechanic names). Every mechanic kept its function name
(plan rule 3.5) — re-skin, never re-implement.
**Stage 2 shipped (2026-09-09)**: TECHNIQUES is THE CIRCUIT —
`SpellTreePanel` (same name, same `TREE_NODE_POS`, same rules) draws
round-capped `<path>` connectors, 50 px chips (capstones 58 px in a
`.pb-node-crown` ring), pillar-head PILLS in their own strip
(`.pb-circuit` = heads · board · pips), a gold halo on `techSel`; the
TECHNIQUE PANEL (`TechniquePanel`, `.pb-technique`, fed by
`pbTechInfo`) follows `techHover || techSel` and its verb (`techVerb`)
does what the chip click does. Keys on TECHNIQUES: arrows walk the
circuit (`treeStepKey`; SHIFT+← → = the party row), ENTER = verb,
BACKSPACE = unequip, SPACE = replay. THE MOVE PREVIEW: three-renderer.js
`_castChainFor(kind)` / `_attackChainFor(kind)` are the ONE chain table
(the board's cast + attack sites call them — never inline a chain
again); `EWCharViewer` keeps the whole library bake and exposes
`play(slotOrChain, { full, name })`, `playSpell(spell, { attack, full })`
(`classifySpellAnimKind` → the chain; a basic attack → the def's
`basicAttackKind`), `stopPreview`, `isPlaying`, `hasClips`, `onState(fn)`.
The builder's `pbPreview(sp, { hover })` fires it (hover / keyboard =
180 ms debounce, idle only; click / equip = immediately) and the stage
wears `.pb-stage-pill` (`MOVE PREVIEW · name`, `NO PREVIEW · SPRITE
VESSEL`, `PREVIEW OFF`). Kill-switches: `state.animationsDisabled`,
`window.EW_NO_PB_PREVIEW`. The party row is sized by
`.pb-party { --pb-portrait }` (96 / 76 / 64 px by breakpoint).
**Stage 3 shipped (2026-09-09)**: the spell LIGHTS UP the stage — a click /
equip / ENTER / ▶ on a technique runs `EWCharViewer.previewSpell` (hover
stays animation-only, C-10): the viewer borrows the battle's VFX layer
through `ThreeVFX.attach(v.vfxGroup)` (the pools re-parented; a stage
opened before the first match initialises them and the board's
`init(scene)` ADOPTS them; `detach()` clears and sends them home) and
`VFX3D.stage.enter/exit/fire` (three-vfx-effects.js `_VS`: the stage cfg,
flat ground, `_suppressed` ignores the phase, `_post` → a shim,
`_shake` / `_LT()` / `_geom3D` route every board shake / lightning /
geometry read — **never add a bare `window.shakeBoard(` /
`ThreeLightning.` / `_spell3DGeometry[` to that file again**;
`stage.fire` is the INTERNAL fire, never the online-wrapped one). The beat:
turn to +X, windup, the clip, burst + the mapped intents at 45 % ((2,0) =
two tiles to screen-right, aura at the hero), finish. The monitor reacts
through `onStageFx` → `data-grade` (the type's ENTROPY STRIKE colour),
`.pb-crt-roll-on`, `.pb-crt-jolt`. Kill-switches: `EW_NO_PB_VFX` (Stage
2's animation-only preview), `EW_PB_VFX_NO_GEOM`, `EW_NO_PB_PREVIEW`.
**Stage 4 shipped (2026-09-09, rev 5)**: ROSTER is THE WALL — `.pb-rtile`
tiles (portrait full-bleed else the sprite, faction ring, type dots, ★, 🔒),
round filters (`.pb-type-disc` ×6 `PB_TYPE_GLYPH`, `.pb-faction-ring` ×3,
search pill, SORT / JOB pills → `PbWindow` menus — no native `<select>` on
the wall), hover → the stage shows that vessel (`rosterHoverIn`, 220 ms;
`stageRace` etc. feed `HeroViewer3D`). Same rev: the row's OVAL portraits
fixed (the legacy `.pb-party-slot` height clamp at styles-base.css ~3467 is
overridden in the forge block — never delete that override), the VFX plays
on HOVER too (C-10 overruled by the user), and THE MOVE + THE FRAME
(three-renderer.js `_cvMovePlan` / `_cvMoveTo` / `v.frameTo`): a charge
RUNS to the tile beside its dummy at (3,0) and strikes on arrival, a dash
slides its line, a teleport blinks, a melee swing lunges, and `_cvFrame`
pulls the camera out to hold the whole beat (`VFX3D.stage.caster(x, y)`
moves the effects' caster anchor with the hero). Two instance bugs fixed:
`PartyBuilder(props)` reads `props.standalone` (the module flag was shared
by the sleeping pre-match instance) and the key handler acts only for the
instance on screen; match-select.js's ENTER / ESC listener returns while
its host is off screen. Screenshot the forge with `NODE_USE_ENV_PROXY=1
node playtest_builder.js [tag]` (repo tooling; standalone route; GLBs do
not load in the sandbox — DOM / CSS only).
**Stage 5 shipped (2026-09-09, rev 6)**: THE STICKY NOTES — `pbUnitNotes`
builds a pseudo-unit and reads data.js `getUnitPassives` (so `flying`
resolves through map.js `canFly`, jetpack included; never the race table),
the non-passive `RACE_TRAITS` rows become one TERRAIN note, `PbNotes`
renders them ON THE BEZEL in a widened right margin (`--pb-notes-w`,
132 px; closes under 1180 px → the same text inline as `.pb-traits-inline`),
paper per faction, `Caveat` handwriting (index.html Google-Fonts link),
`PASSIVE_DEFS[id].note` = user marginalia (C-7), a click opens THE NOTES
window. STAT PILLS: `StatBar` / `VitalBar` keep their names (+ `statKey`),
`PB_STAT_LOOK` is paint only, `.pb-grade-ring` is the grade, the MOVE /
RANGE diamonds sit in `.pb-foot-badge`. AFFINITIES: `pbAffinities` reads
`TYPE_CHART` **strongVs / weakVs** exactly like state.js
`getTypeDamageMultiplier` (WEAK ×1.30 red ring · RESIST ×0.75 green ring;
the `resists` field is documentation). GEAR: `.pb-sub-pill`, the ZODIAC
wheel (`.pb-zodiac-chip` ×12 → `handleZodiacChange`; `PB_ZODIAC_ELEMENT`
mirrors battle.js Star Crossed's `_zElementOf` — the test diffs them; there
is NO `ZODIAC_NATURES` table, the wheel states the engine's +10 % move &
armor rule). No native `<select>` survives in party-builder.js (C-9 —
tested). Next: Stage 6 (the desk in the building, sounds, `EW_NO_PB_CRT`).
**THE RELAYOUT (2026-09-09, rev 7)**: the glass IS the screen — the
notes are ON THE GLASS (`PbNotes` inside `.pb-stage-view`, top-right of
the hero's band; no bezel margin), the STAGE spans the whole body on
TECHNIQUES / GEAR / DOSSIER (`grid-column: 1 / -1`) with the circuit and
the stats floating TRANSPARENT over it (scrims via `::before`); the hero
stands in the free band: `PB_STAGE_CX` (0.575 = `--pb-tech-w` 36% +
half the rest, party-builder.test.js ties them) → `HeroViewer3D
{ focus }` → `EWCharViewer.setFocus(cx)` (three-renderer.js `v.focusX`,
`_cvFrame` slides camera + look; a wide beat frame eases it home). The
future ground + sky belong in the viewer (it already fills the body).
The circuit is THREE LANES (`.pb-lanes` → `.pb-lane` → `.pb-tn` node
rows: disc + name + `pbNodeMeta` line; CSS `.pb-link` segments onto a
`.pb-bus` with the root hub) — `SpellTreePanel`, `TREE_NODE_POS`,
`treeStepKey` and every legality rule unchanged. ONE head row (tabs
inside `.pb-head`) and ONE bottom bar (`.pb-party-left` BACK + summary ·
portraits · `.pb-party-right.pb-foot` tools + CONFIRM + the lock ladder
verbatim). Cut: the officer chip, the prompt line, the ◂ ▸ caps, the
counter, the stage title, the hover-hint sub-head, the tab hint.
`node playtest_builder.js [tag]` honours `PW_W` / `PW_H`.
**rev 8 (same day)**: the body grid has TWO rows — the sheet, then the
bottom bar; on TECHNIQUES `data-panel="1"` puts `TechniquePanel` in its
own `.pb-zone-panel` cell under the lanes, beside the party bar (which is
a body cell, `grid-area: party`; the stage spans both rows). Portraits
84 px, closer; the bar's summary is gone (identity = STATS column).

## THE SPELL TREE UX PASS — the fork, the cascade, 7 slots (2026-09-13, local delivery)
`SPELL_SLOT_MAX` is **7** (data.js; was 6 — one capstone per unit still
holds, 4 + 4 > 7). On the forge's TECHNIQUES circuit (party-builder.js
`SpellTreePanel`): a TWIN node is **THE FORK** — both alternates stand on
the tier as `.pb-tn-opt` option discs (the chain through the left one, an
⇄ bridge to the right), each with its own state from `treeAltState(tree,
sealed, equipped, key, altId)` (`equipped` / **`swap`** = the node wears
the other option, one click trades in place / reachable / far / blocked /
sealed), its own hover + select (`techHoverAlt` / `techSelAlt`;
`pbTechInfo(…, altId)` → `alt` / `otherAlt` / `drop` / `dropCount`) and
its own click (`treeAltClick` → `twinPickSpell(twinKey, spellId)`). The
twin picker window is gone (the Freelancer socket window stays). A fork's
wrapper wears `st-<state>`, never `is-<state>`. **THE CASCADE**: an
unequip always lands — `treeDropIds(tree, equipped, id)` (data.js
`treeReachableKeys` without the id) = the node + everything that hung off
it, dropped together (`treeLegalSubset` is the safety net); hovering an
equipped node paints `.will-drop` + `.pb-link.cut` and the pips forecast
`−N`; hovering a reachable node lights the gold path and the pips forecast
`+N` (`.pend` / `.over`). Every refused click explains itself through
`flashTreeNote` → `.pb-tree-note` (1.6 s). TAB on a selected fork = the
other option. `npm test` runs `spell-tree-ux.test.js`. PARTY_BUILDER_PLAN
§9 has the entry.

## TRAINING MATCH (instant CPU turns vs a human) — added 2026-09-07
Match-select → CONFIG column → **CPU TEMPO: Cinematic / ⚡ Training**
(match-select.js, sticky via localStorage `ew_training_match`; mirrored into
map.js `_msTraining` → `_msConfirm` sets `state.trainingMatch`). The human
plays P1 normally; whenever a CPU-controlled unit becomes the active blitz
unit, battle.js `_syncTrainingTurbo` (called from `_continueBlitzWithUnit_impl`)
flips `state._aiTurbo` on: `_skipVisuals()` → true, camera + animations
forced off (restored from `_preTurboVisualPrefs`), `getDevSimSpeedMultiplier`
→ `TRAINING_TURBO_MULT` (64), `_waitForAnimationsThen` tight poll, AI
telegraph/activation delays zeroed, SFX muted (audio.js). It's cleared for
the human's units, at the end-of-round sequence, in `finalizeMatch` and at
match start. Floating damage numbers are NOT visual-gated so the CPU's hits
still pop. Other launch paths (campaign, MD, spell lab, `_selectMode` labs)
reset `state.trainingMatch = false`; online never turbos (skip-listed in
online.js). Renderer/VFX gates that used to read only
`devAutoSim && !_devSimShowAnims` now also honour `state._aiTurbo`
(three-renderer.js `actionGlowStart`, three-vfx-effects.js timers, state.js
storm lightning). Blitz-turn modes only — Simul has no per-side turn.
**Imitation (same session):** in a training match the CPU LEARNS from the
human. At each human doMove/doAttack/doSpell/doGuard, battle.js
`_imitObserve` calls ai.js `window.aiScoreMargin(unit, action)` — which
runs the CPU's own ranking (`rankCandidates`, now shared with `aiTakeTurn`)
for that unit, finds the human's action among the candidates (a move the
scorer never proposed is scored synthetically: joint move×action value −
tile danger) and returns human − CPU-best score margin. On a disagreement
a random subset of `AI_WEIGHT_DEFAULTS` keys is probed by finite
differences (`_aiWeightProbe` override in `getAIWeight`) and each key that
closes the gap steps 2% of its range, clamped, into `_aiTrainedWeights`
(the same champion table the A/B lab tunes; persisted via saveAIWeights).
Match-end log line summarises; `window._ewImitationSnapshot()` for numbers;
`EW_AI_DEBUG` logs each disagreement; kill-switch `EW_NO_IMITATION`.
Stats key `ai-imitation-stats-v<schema>`. Reset = Training panel → Reset.
The match-end REPORT is a persistent panel (`#imitReportPanel`, created by
battle.js `_imitShowReport`, z-index above the result overlay) with Export
JSON / Copy / Close; it hides on `hideResultOverlay` and at the next match
start; `window._ewImitationReport()` reopens the last one. (Also fixed
2026-09-07: the Arena victory tally zipped P1/P2 detail rows by index and
crashed `showResultOverlay` when only one side had a Bounties row.)

## ENTROPY STRIKE — THE SIX APOCALYPSES (typed team attack) — added 2026-09-07
The full-gauge team attack is no longer typeless: the ⚛ ENTROPY row on the
bezel now OPENS a picker (hud.js `_hrlgEntropyBlades`, `actionMenuView ===
'entropy'`, gated in ui.js `chooseActionMenu`) with one row per damage
type — **For All Mankind** (human) · **Invasion Day** (alien) ·
**Revelations** (divine) · **Hell on Earth** (unholy) · **Robot Uprising**
(tech) · **Reality Shift** (anomaly). Catalogue: data.js
`ENTROPY_STRIKE_TYPES` / `ENTROPY_STRIKE_TYPE_ORDER` (also on `window`);
read it through battle.js `getEntropyStrikeType(id)`. Damage: `doEntropyStrike
(unit, strikeType)` passes the type as `spellType` to applyDamageToUnit, so the
TYPE_CHART judges every victim (weak ×1.30 / resist ×0.75 + the trigger's
STAB) — no element layer. `getEntropyStrikeForecast(unit, type)` (weak /
resist / neutral counts, avg mult, stab) feeds the picker's intel chips and
`getEntropyStrikeBestType(unit)` (the AI's pick, ai.js `scoreEntropyStrike`
→ `strikeType` on the candidate; also the default for any caller that omits
the type). Presentation: `_ewsPlayCinematic` is a shared skeleton (typed
banner `.ews-t-<id>` in styles-cinematic.css, splitscreen charge, crane,
per-enemy camera beats, restore) that delegates every beat to the type's
DIRECTOR in `_EWS_DIRECTORS` (siren / pane / world / enemyCam / lead /
strike / resolve + FIXED chargeMs/staggerMs/resolveMs). Directors use the
CineFX kit (cineGrade, cineInsert — new kinds k-stamp / k-signal /
k-scripture / k-terminal / k-glitch — cineFreezeFrame, cineSlowMo,
cineDollyZoom, the named shots) and the VoidStage (`opts.maxMs` added so
the ultimate holds the void through every strike; scarcity gate bypassed
on purpose). RELAY RULE: VFX that online.js relays by itself
(sigUFOFleet3D, spawnProbeDescent3D, tileGlow) fire only when
`!ctx.relayed`; the DOOR synth kit (`playDoorSfx`) is NOT relayed so both
screens voice it. Online: `strikeType` rides the `doEntropyStrike`
game-action and the `entropy-cine` relay; Simul plan steps carry it too.
`npm test` runs `entropy-strike.test.js` (catalogue ↔ directors ↔ CSS).

## NEXUS REWORK — Arena's zones are the economy — added 2026-09-12
data.js `NEXUS_CAPTURE_THRESHOLD` is **4** (was 6) + `NEXUS_HOLD_HEAL_PCT`
(0.15) / `NEXUS_HOSTILE_DMG_PCT` (0.25) / `NEXUS_CUBE_DMG_PER_ZONE` (0.5,
cap `NEXUS_CUBE_DMG_MAX_MULT` 2). ONE tick engine — ui.js
`_nexusApplyTicks(nex, section, team, ticks, creditUnit)` — fed by three
sources: `channelNexus` (1 AP, +1), **`nexusOnUnitArrive(unit)`** (the
step-on tick: +1 per unit per zone per round, `unit._nexusStepStamp`;
called from battle.js `completeMoveAlongPath` next to `checkFlagPickup` —
four bodies on a fresh 2×2 zone flip it on the spot; an enemy already
standing there = CONTESTED, no tick) and `processNexusIncome` (round
transition, +1 / +2). A tick against an OWNED zone drains the owner's
pips first; the zone goes neutral when they hit 0 (the enemy loses it
right there), then your own pips build. **No instant Nexus-Dominance win
any more** — the prize is the **SPAWN LOCKOUT**: map.js
`getRespawnZoneFor(player)` → the home spawn nexus while you hold it,
else the nearest other zone you hold (the centre, their spawn), else
`{ locked: true }` and `processRespawns` parks the unit (`_respawnIn` 0,
`_spawnLocked`) until the team reclaims a zone; `_respawnTileSafe` skips a
zone tile that was dug into lava / flooded / walled (zones are BUILDABLE:
battle.js `isObjectiveTile` now guards the Cube tiles ONLY — reshape /
dig / flood / block / terrainCreate all work on nexus and spawn tiles;
zone membership is by coordinate, never by terrain key). Zone perks
(battle.js end-of-round block, was spawn-only): every unit standing in a
zone reads the NEXUS owner first (`getNexusAtUnit`) — ally of the owner
heals HP + MP + cleanse, enemy of the owner burns `NEXUS_HOSTILE_DMG_PCT`
(the paced scorch beat); map.js `getSpawnZoneOwnerAt` answers the spawn
nexus's owner in Arena (0 while neutral), the home team elsewhere. Cube
siege: ui.js `getCubeDamageMult(player)` = 1 + 0.5 per held zone that is
not your own spawn, applied in doAttack's Cube branch (both paths, `⬡
SIEGE ×1.5` float). Presentation goes through ONE door — ui.js
`_nexusFx({ kind: tick|contested|neutral|capture|lockout|restored, section,
player, x, y, prog, thr })` (floats at the zone centre in the new `nexus`
float kind, the `_nexusProgress/_nexusChannel` auras, banners, SFX,
shake) — routed through `window._nexusFx` so online.js's wrapper relays it
(`nexus-fx`; the guest replays with `relayed = true` = banner / SFX /
shake only, the floats + VFX ride their own relays). Renderer:
`rebuildNexusWalls` draws EVERY zone (spawn nexuses included — the
sanctuary curtain / spawn wash skip them in Arena) as a terrain-hugging
perimeter: per-tile owner wash on that tile's top, rim line + halo on each
exposed edge at `tileTopY`, gradient SKIRTS down cliff faces where the
ground steps across an edge or between two zone tiles, a short additive
curtain; `_computeNexusSerial` folds `_terrainVersion / _heightVersion /
_voxelVersion` in so building on a zone redraws it that frame. The zone
meter is PIPS (`.nb-pips`, one per tick, `nb-pop` on change, `⛔ Pn LOCKED
OUT` under a stolen spawn). HUD: CHANNEL row shows `⬡ n/4` (+ `ONE MORE`),
the scoreboard's `⛔ Pn SPAWN LOCKED`, dead turn chips say NO SPAWN POINT.
AI: `scoreNexusChannel` / the Arena macro goals score the lockout (we
hold nothing → +200 / sprint; their last zone or spawn → lock them). Legacy
`nexus_dominance` labels stay for old records. `npm test` runs
`nexus-rework.test.js` (source guards for all of the above).

## ARENA RULES — fixed Key pool + round safety cap — added 2026-09-07
Arena (state.js `MULTIPLAYER_MODES.arena`) scatters a FIXED pool of
`keySpawnCount` (5) Keys and wins THRESHOLD STABILIZED when one team CARRIES
`keysToWin` (3) at once; `roundLimit` is 100 — a safety cap only (composite
Arena score, then Sudden Death), because a match must end on a real win
condition (AI training / balancing wants every objective live, comebacks
included; a tighter cap returns later). Read the numbers ONLY through
battle.js `getArenaKeyRules(mp)` / `getKeysToWin(mp)` — modes without the
two fields keep the legacy "carry every Key on the board" rule and the map's
`CONFIG.winHourglasses`. A fixed pool never restocks (the round-10
`spawnPeriodicHourglasses` top-up is skipped). `state.hourglassTarget` is set
at spawn for ai.js `assessWinCondition` and syncs to the guest. HUD tower
block shows `🗝 held/needed`. See PLAYTEST_NOTES "ARENA RULES PASS".

## THE PASSIVE BATCH (CHAMP_REWORK_PLAN Phase 3) — added 2026-09-07
Every §5.2 passive is a `PASSIVE_DEFS` row (data.js) whose HOOK FIELDS the
engine reads through `unitPassiveValue(unit, key)` — never the race. The
header comment above `PASSIVE_DEFS` lists every field and its consumer; plan
§5.7 has the per-passive table. Rules that came with it: `getEffectiveRange
(unit, opts)` — pass `{ item: true }` for thrown-item reach (Longshot is
basic-attack only); `applyStatStageBoost(…, { perm: true })` makes a
permanent ledger entry (`statStageMods[i].perm`, skipped by the tick, the
badge timer and buff purges; death resets it); `unitCryptidHiddenFrom` rides
`isUnitConcealedFrom` (renderer + AI + nameplate eye) and is gated again in
`doAttack` / unit-targeted `doSpell`; `_applyRoundStartPassives()` runs
before EVERY `buildBlitzTurnOrder()` (Lycanthropy's `wolfForm` carrier, Mad
Genius); `buildBlitzTurnOrder` tiers by `getEffectiveSpd` (stages reorder
initiative) and Quickdraw heads its tier. New status fields: `healTakenMult`
(applyHealingToUnit), `magicDamageTakenMult` (applyDamageToUnit, magic only).
Adding a passive = one `PASSIVE_DEFS` row + one `RACE_PASSIVES` id + a
`PASSIVE_VALUE` price in check-grades.js; `npm test` (champ-rework.test.js)
fails on a missing def, a slot overflow (flying counts), an unpriced id, or a
`PLANNED_PASSIVE_ALLOWANCE` row for a race that already wears its passive.

## THE STATUS BATCH (CHAMP_REWORK_PLAN Phase 4) — added 2026-09-07
Every §5.1 status is a `STATUS_DEFS` row (data.js, the Phase 4 block after
`wolfForm`; its header comment lists every hook field → consumer). The
engine reads FIELDS, never ids: `countsAs` (bonusStatusMatches — Corroded
is Burn AND Poison), `blockSpells` (`unitSpellsBlocked` — the ONLY
silence gate; never call `unitHasStatus(u,'silence')` at a cast site),
`rangeDelta` (getEffectiveRange, generic), `basicAttackStatus`
(Incendiary), `hpMaxMult` + `onApply`/`onRemove` (Monstrous; the hooks
fire from applyStatusPayload / clearStatus — `onRemove` runs BEFORE the key
is deleted), `grantsFlight` (map.js canFly + `levitateUnit` /
forceGroundUnit), `shedMotes` (finishMoveAt → dropPixieDust, blind on
step), `linkEcho` (`_procLinks` after every damage application; partner
ids ride the PAYLOAD: `partnerId` / `allyId`), `dragDamagePerTile`
(`_tetherFollow` in finishMoveAt), `fear` (`_fearFleeMove` at the
victim's activation), `realm` (`isUnitRealmShieldedFrom` — target /
damage / heal / status gates). state.js `getNextBlitzUnit` skips ANY
status with blockMove + blockAction (stun, frozen, Stoneform). Adding a
status = one row + `STATUS_LIBRARY_DESCS` + `_STATUS_EFFECT_IDS` +
`_HRLG_SB_COLORS` (+ ai.js `HARD_CC` / data.js `_MF_*` if it denies
turns); champ-rework.test.js fails on a missing registry. §5.6 RULE: a
non-capstone `statStageBoost` is ±1 (ring-3 capstones ±2; Calcify −2) —
the test enforces it. Possessed / Infected are rows only until the
`possess` kind (Phase 5 wave B) wires `getControllingPlayer`.

## TWIN NODES (race-tree nodes that hold two spells) — added 2026-09-07
CHAMP_REWORK_PLAN §4 / §4.6 (Phase 2). A `RACE_TREE` entry (data.js) may be
a 2-id array: the node holds two ALTERNATES, exactly one equips (1 slot,
the node's ring cost + tier), the other is a free respec. Read rows only
through `getRaceTreeRow` (pairs intact) / `getRaceTreeSpells` (faces =
first alternate, the flat shape every legacy caller expects) /
`getRaceTreeAlts` (`{ R3: [a, b] }`) / `getRaceTreeAllIds`. A unit's
tree (`buildUnitSpellTree(race, cls, sec, equippedIds)`) resolves each twin
node to its equipped alternate else its face and exposes `tree.alts`; ALWAYS
pass the equipped ids so the node wears the right spell. `isTreeLoadoutLegal`
rejects both alternates at once, `treeLegalSubset` keeps the first,
`buildTreeLegalLoadout` rebuilds the tree per pick. Builder: ⇄ badge on the
chip, "⇄ other" under the name, one picker overlay shared with the
Freelancer sockets (`twinPick` / `flSocketPick`), swap-in-place via
`twinCandidate`. Saves unchanged (flat `customSpells`); online host
validation already funnels through `treeLegalSubset`. Adding a twin = one
row edit + `npm test` (content-schema.test.js checks the shape, tiers,
one-alternate rule, repair and random walks).

## PHASE 5 WAVE A (CHAMP_REWORK_PLAN §5.9) — added 2026-09-08
The first spell wave: 16 new `RACE_ABILITIES` rows on their §6 twin nodes
(QB Sneak, Transform, Snowball Volley, White Christmas, Ice Shard,
Incendiary Rounds, Grave Chill, Tail Whip `raceDinoTailWhip`, Apex Roar,
Treeline Retreat, Stoneform, Piercing Arrow, Freeze Breath, Sky Tackle,
Cluster Rockets, Plasma Cannon), renames with ids kept (Stampede, Arrow
Volley, Heat Vision, Flat Earth), Perch Form deleted. New kinds:
**`transform`** (battle.js `doSpell` branch toggles the `carForm` /
`mechaForm` carriers at 99 rounds; the model rides `UNIT_ANIM_OVERRIDES
[race].formSprites` via `unitStanceForm` / `_formSpriteFor`, which the
apply/revert sprite beats honour) and **`tackle`** (the damage branch +
`_runPostEffects`: carry `pushDistance` down the charge line, caster lands
one tile behind, `collisionBonus` / `collisionStatus` on a wall or body).
New flags the engine reads: `executeBelowPct` (`_applyExecuteRider`, also
on the delayed Take Aim record → state.js), `onKillHealPct` /
`onKillRefundAp` (`_applyOnKillRiders`), `lineWidth` 2–3
(`getLineSpellLaneOffsets` — `_applyLineDamage`, ray footprint, direction
preview), linePush `collisionBonus` / `collisionStatus` /
`collisionStatusBoth`, `terrainDeform.flatten` (+ `radius`), zoneDebuff
`expireTerrain`, STATUS `spellRangeDelta` (`getEffectiveSpellRange`).
Fixes that came with it: `damage`-kind `pushDistance` and escape-kind
`statusEffects` were never applied (now they are — plan §10 #27). Adding
a wave-B/C spell = data row + tree node + a `SPELL_MAP['<id>']` family
alias in three-vfx-effects.js + a `WAVE_A`-style row in
champ-rework.test.js; a new KIND also needs `SPELL_KIND_META`, a `doSpell`
branch, ai.js `scoreSpell` + `findSpellTarget`, hud.js parts, ui.js
`_SLB_KINDS`. `npm test` guards all of it.

## PHASE 5 WAVE B (CHAMP_REWORK_PLAN §5.10) — added 2026-09-08
Control + links: ten rows on ghost / zombie / demon / shaman / vampire /
succubus and five kinds. **`possess`** (Possession, Enthrall, Infect,
Thrall Bite): battle.js `possessUnit` applies the control status and
FLIPS `unit.player` to the caster's seat (`_origPlayer` = home) — every
`unit.player` consumer (HUD gate, `runComputerTurn`, fog, targeting, the
online guest-emit gate) hands the body over with no special cases;
data.js `_releaseControl` (the statuses' `onRemove`) and battle.js
`releasePossession` (map.js `defeatUnit` calls it) hand it back;
`maybeAdvanceTurn` spends one activation per controlled turn;
`showPossessedActivation` opens the turn (relayed as
`possessed-activation`). Read `getControllingPlayer(unit)` /
`unitHomePlayer(unit)`, never `_origPlayer` directly. **`link`** (Soul
Bind, Voodoo) and **`transfer`** (Sacrifice) are the first TWO-CLICK
casts: `SPELL_KIND_META.twoClick`, the first legal click is remembered in
`state._spellPick1` `{ id, spellId, x, y }` (nothing spent; the gate sits
right before doSpell's commit point), the second resolves; the drum /
prompt / hud chip follow `_twoClickPick(spell)`; `clearSpellPick()` on
cancel / ESC / turn end; online the guest picks locally and its second
click carries `partnerId` (host dispatcher seats it); `_spellPick1` is
skip-listed + guest-local; the AI stashes the partner in
`_aiPairPick[spell.id]` and the executor seats it. **`shadowRealm`**
(Shadow Realm★) crosses `partnerId` on both, director
`CINE_SEQUENCES.raceShadowRealm` = the `shadow` Void palette (+ css
`vp-shadow`). **`cannibalize`** is corpse-targeted through
`spellTargetsCorpses(spell)` (raiseDead OR meta `corpseTarget`) — use it,
never `kind === 'raiseDead'`. Adding a possess / link spell = a data row
+ tree node + `SPELL_MAP` alias + a `WAVE_B` test row; `npm test` guards
the kinds, the seat flip, the two-click gate and the relay.

## PHASE 5 WAVE C (CHAMP_REWORK_PLAN §5.11) — added 2026-09-08
Summons, tethers, terrain: eighteen rows on cowboy / mad scientist / black
goo / fairy / ghoul / atlantean / dragon. **`summonUnit`** (Whistle's Hound,
Summon Creation): a WALKING TURRET in `state.turrets` (`summon: <key>`,
`hitsToKill`, `move`, `reveals`, `armored`; `summonDef` on the row) — the
raiseDead zombie's template, so fog / `damageTurretAt` (now takes
`opts.damageType`; armored = physical hits count half) / the renderer
(`_buildSummon3D`) / the HUD nameplate / state-sync come free;
`processTurretVolleys`' walker branch hunts the owner's ENEMIES only, reveals
Invisible within `reveals` first, walks `move` tiles, strikes adjacent with
`sourceUnit` = the caster. **Goo terrain = the existing `swamp` Black Ooze
row** (never add a `goo` key): `enterStatus` (finishMoveAt) + a
`{ type: 'status' }` endTurn result (map.js applyTerrainTurnEffects) Goo
whoever touches it; **timed painting** through battle.js
`_paintTimedTerrain(cx, cy, { terrain, radius, rounds }, unit, label)` →
`state._timedTerrain` (prev terrain remembered, reverted by
`_tickTimedTerrain` at the top of processEndOfRoundZonesAndSeeds) — used by
`paintTerrain` on damage (`_runPostEffects`) / barrage rows and by Oozing's
`trailTerrain`. Flags the engine reads: `lineZone` (`_applyLineDamage` →
radius-0 `_activeZones` entries; every `zone.radius || 1` became `?? 1`),
`onlyTerrain` on a teleport (`getTeleportTerrainTiles`, gate + ui.js
highlight + AI), `statusFirst` (status before the hit), `purgeBuffs`
(`removeBuffs`). The `pull` branch now applies `spell.statusEffects` (it
never did) — Lasso is the rope (`tethered` 2). Tsunami★ took Great Flood's
r4 seat (Flood stays authored, off-tree). Adding a summon = a row with
`kind: 'summonUnit'` + `summonDef { key, name, move, dmg, hits, reveals?,
armored? }` + a `_buildSummon3D` look for a new key; `npm test`
(champ-rework.test.js "Phase 5 wave C" ×3) guards the rows, the terrain
plumbing and every engine site.

## PHASE 6 — THE TWO NEW RACES (CHAMP_REWORK_PLAN §5.12) — added 2026-09-08
The last phase of the champ rework: **gangster** (Gunslinger, `shank`;
Stomp Out → Drive-By ⇄ Hit a Lick → Choppa → Extended Clips★) and **nun**
(White Mage, `devout`; Purify ⇄ Smite → Blessing → Prayer → Hallelujah★)
are real races — 98 in `AVAILABLE_RACES`, in every race table on BOTH
sides (server.js `AVAILABLE_RACES` + `ACCT_STARTER_UNITS` literals; `npm
run test:parity`). The nun is her OWN race: `RACE_PROFILES.priest
.labelFemale` is 'Priestess' (same whitemage female model, shared by
`RACE_MODELS_3D.priest.female` and `.nun.female`), the Nun's user-authored
`DOOR_ROSTER_LINES` sit under `'nun'` (moved, never rewritten), she is a
starter. **The gangster's art landed 2026-09-10** (R2
`Assets/Sprites/Races/gangster/`): `_mkUAL('gangster',
'thug_gangster_reali')` in `RACE_MODELS_3D`, his OWN single-file 2D sheet
(`_SINGLE_FILE_RACES`; the gunslinger-folder borrow is retired), and a
starter on both sides now — no `basicAttackKind` (Gunslinger range 2
quick-draws; up close he SHANKS, so `castMelee` is flavoured to
Punch_Cross). His five spells stopped aliasing other races' VFX: authored
`raceStompOut_impact` · `raceDriveBy_muzzle` + `_impact` ·
`raceHitALick_impact` · `raceChoppa_beam` + `_impact_tile` ·
`raceExtendedClips_aura`; Choppa's `projectileOverride` was REMOVED so the
line branch takes the (relayed) beam path instead of flying one sprite,
and Drive-By's `afterShot` is a real beat (ranged clip + muzzle at the
caster + gunshot + impact). Still missing from R2: his `portrait.png`;
his `DOOR_ROSTER_LINES` are user-authored (A15) and unwritten. See
CHAMP_REWORK_PLAN §9.8. New kinds (battle.js `SPELL_KIND_META` + `doSpell`):
**`steal`** (the hit, then `_stealFromUnit` moves `stealKeys` Keys +
`stealItems` items — Plunder keeps its utility id) and **`cleanseArea`**
(3×3 tile cast: allies lose every `kind: 'debuff'` key via `clearStatus`,
enemies lose every buff via `removeBuffs`; nothing applied). A `dash` may
wear **`afterShot { dmg, range }`**: after the slide, `_afterShotTarget`
(weakest visible enemy in LOS of the landing tile) takes the bullet; a
`dmg: 0` dash only shoves. ai.js scores/targets all three; hud.js parts,
ui.js `_SLB_KINDS` / AoE preview, data.js `SIM_DEFAULTS` know the kinds.
check-grades.js `PLANNED_PASSIVE_ALLOWANCE` is EMPTY now — a future
planned passive goes back in as `race: value`. Adding a race = the §5.12
table list (data.js ×15, sprites.js ×5, server.js ×2, lore ×2) and the
Heat Death ladder's top tier (`ACH_CATALOG` champsMastered = roster
size; achievements.test.js pins it). `npm test` (champ-rework.test.js
"Phase 6" ×3) guards every table and engine site.

## THE STRIKE FRAME (animation ↔ VFX timing) — added 2026-09-09
Every action slot in sprites.js `UAL_SLOTS` carries **`strikeAt`** — the
SOURCE-clip second on which the hit / release / bloom lands (read off frame
contact sheets of every library clip; the table is in PLAYTEST_NOTES "THE
STRIKE FRAME") — and optionally **`trim: [from, to]`** (bake only that window;
strikeAt stays in source seconds). The renderer answers
`ThreeAnim.castStrikeMs(unit, kind)` / `attackStrikeMs` (−1 = no library
clip); battle.js starts the clip that many ms BEFORE the launch / impact it
scheduled (`_releaseCastSprite` trades the source hold for it, doAttack's
`_attackStrikeLeadMs`), and the forge preview fires its burst on the same
frame (`_cvStrikeMs`). Adding / retuning a clip = set `strikeAt` (and `trim`)
in UAL_SLOTS — never a per-site delay. `classifySpellAnimKind` routes
`kind: 'dash'` / `'tackle'` BY KIND (castDash / castTackle) before the text
rules. `rigged_animations/` (repo, 218 MB, NOT an upload set) holds the
libraries + the Meshy exports; **`node anim-sheets.js`** renders a contact
sheet of every clip so Claude can LOOK at an animation before wiring it
(needs `npm i --no-save playwright three@0.128.0`; that is not a playtest).
`npm test` runs `anim-strike.test.js` (the table ↔ the GLBs ↔ the consumers).

## Most common request: "playtest <mode>"
The user wants Claude to **actually play Player 1 against the CPU** (NOT auto-sim /
dev-sim — they can do that themselves) and report pain points: unresponsive
clicks, getting stuck, confusing UI, bad pacing, plus the bug classes in
PLAYTEST_NOTES.md. There is a ready-made harness — don't rebuild it:

```bash
npm install && npm start            # server on :3000 (background it)
# first time only:
npm install playwright && npx playwright install chromium --with-deps
node playtest.js tdm                # arena | tdm | clash | simul | gauntlet
```

It drives the real menus → starts a VS-CPU match → plays P1 with real tactics and
spells → flags bugs → writes screenshots + combat log + `<mode>-flags.json` to
`shots/`. Read the console output and the artifacts, then summarize findings.

**Read `PLAYTEST_NOTES.md` first** — it has the full menu flow, the `window.GAME`
API (blitz turn model, move/attack/spell calls), and prior findings. That file is
the anti-"start over" memory; keep it updated when you learn something new.

## Wiring up a 3D character (frequent request)
Units can render as rigged Meshy GLB models instead of sprites. Since
2026-07-10 animations come from SHARED libraries on R2 (`Assets/Models/`):
Quaternius `UAL1_Standard.glb` + `UAL2_Standard.glb` (non-root-motion), and
since 2026-07-11 `MAL1_Sniper.glb` — the 20 Meshy animations exported ONCE
from the male sniper, consolidated offline into a 1.4MB animation-only GLB.
three-renderer.js retargets all of them onto every Meshy rig at load, so
per-character animation exports are no longer needed; Meshy-sourced
libraries retarget exactly like UAL ones (_libEnsureSrc auto-detects rig
naming). To grow the library: download animations for ONE character, then
consolidate (strip meshes/textures, merge clips named by file stem — see
PLAYTEST_NOTES "MAL library"). Retargeting
keeps each character's OWN rest posture (hunched beasts stay hunched; only
arm bind angles are standardized), and per-character clip flavor is one
`lib: {slot: {clip, lib, ts}}` opt (see UAL_SLOTS + PLAYTEST_NOTES). Recipe:
1. The user uploads the rigged model `..._Character_output.glb` (or any
   `_withSkin` export) to the race's R2 sprite folder. The
   `_generate`/`_texture` stage GLBs are BONELESS — never use them.
2. Add ONE line in sprites.js RACE_MODELS_3D:
   `'<race>': { male: _mkUAL('<folder>', '<meshy file prefix>', { heightRatio: 1.0 }) }`
   — done. Slot→clip map + timescales live in `UAL_SLOTS` (sprites.js);
   heightRatio is relative to the male fortune teller (=1.0). The renderer
   measures true SKINNED bounds for scaling — don't compensate manually.
3. Optional 128×128 `portrait.png` in the same folder + a `RACE_PORTRAITS`
   entry → shows in HUD panels/turn clock instead of the map sprite.
4. Verify a GLB before wiring (rigged? boneless?): parse its JSON chunk with a
   node script (see PLAYTEST_NOTES.md "Rigged 3D unit models").
5. Deliverable: hand the edited sprites.js back via chat (RULE #1).
Legacy path: per-character Meshy `..._Animation_<Name>_withSkin.glb` clips
(must be exported FROM that character — direct cross-character playback warps
the mesh) still wire via `_mk3d(folder, prefix, {slot: Clip})` and are the
automatic fallback when the library fails or a def sets `noAnimLib: true`.
Kill-switches (console): `window.EW_DISABLE_3D_UNITS = true` (all 3D),
`window.EW_DISABLE_ANIM_LIB = true` (library → per-character Meshy clips).

## Key facts
- Server: `npm start` → http://localhost:3000.
- External assets load behind TLS inspection → Playwright needs
  `ignoreHTTPSErrors:true` and `--use-gl=swiftshader` (already in playtest.js).
- Turn model is blitz (`GAME.state._blitzActiveUnitId`); the engine auto-plays AI
  (P2) units and waits when a local P1 unit is active.
- TDM/FFA score is `state.matchKills`, NOT `state.matchScores`.

## Conventions
- Don't run auto-sim/dev-sim for playtesting — play P1 manually.
- `node_modules/`, `package-lock.json`, `shots/` are gitignored; commit code + docs.
- Dev branch: `claude/great-cray-5OS8X`. NOTE: in this environment BOTH `git push`
  and the GitHub API/MCP return 403 for the agent — Claude cannot write to the repo.
  To persist new files, hand them to the user (SendUserFile) to upload via GitHub
  manually. Don't waste time retrying pushes.

## CHARACTER CREATOR rev 11 — THE SKIRT HEM (the sawtooth, the collision that never ran, the skirt under a jacket) (2026-09-13, local delivery)
The user, again: "the edges of the skirt are messed up… jagged… the back looks
messed up… why is it so hard to make a skirt". Root cause, measured: the lathe
was PERFECT in the bind pose (where every headless render is made) and tore the
moment the legs posed, because every column rode the ONE skin vertex that set
its radius (`rep`) — neighbouring bins land on vertices with different bone
weights (a thigh vertex beside a hip vertex beside the OTHER thigh, worst near
the centre front / back where the ray passes between the legs), so each column
moved its own way: hem |Δ²y| 5.4 mm mean / 156 mm max in a walk. Four fixes in
three-renderer.js: **(1) THE SMOOTH WEIGHT FIELD** (`buildLathe`): the weights
are a field over the (row, azimuth) grid in three ROLES (hips + everything
else · upper leg · lower leg + foot, the two sides folded together), blurred
round each row (~10°) and down the columns, interpolated between bins per
vertex, the leg roles handed to LEFT / RIGHT by ONE smooth `wL(θ)` (a
smoothstep of sin θ over ±0.5, the left leg at +x); the old mirror blend is
gone (`sw` inside buildLathe is the SWING allowance — read the welded weights
as `part.siW / part.swW` there). Walk hem now 1.3 mm mean / 27 mm max, and the
27 is the fold between the legs, not a tooth. **(2) THE COLLISION NEVER RAN**:
`collideSkirt` scaled the leg radii by the MESH node's world scale, but the
base GLB's mesh node is scaled 0.01 while its skeleton is not (the bind matrix
carries the difference) — every capsule was 1/100 of a leg. The scale is now
THE BONES' (`S.sc` = the world length of hip → knee → ankle over its bind
length, `lg.len`); the capsule above the CROTCH holds the thigh's radius
(`firstLeg`, the profile measured from t ≤ 0.45 — the pelvis is not a leg);
**THE REST DEPTH** (`part.skirtRest`, computed at rebuild against the bind
polyline `lg.pts`) = how far inside a capsule each vertex already sits in the
bind pose, and the pass pushes only what a POSE adds (the bind pose is left
exactly as built — 0 vertices moved); **THE TENT**: the push is recorded per
vertex (`part._colBuf`), relaxed over the skirt's own grid (`part.skirtGrid`
from `opts.grid`; slope limit 6 mm / column, 4 mm / row) and only then applied
along each vertex's own outward direction — cloth tents over a knee, it does
not dimple round it. **(3) THE SKIRT UNDER AN OUTER**: `opts.over` (the outer's
surface) / `overT` (its hem) / `overLathe` (the coat tail's field — the tail is
built FIRST now and `buildLathe` returns `{ RAD, rows, tTop, tHem, NTH }`)
hold every covered row 6 mm inside the layer worn over it (`overLim`, eased in
over the 3 cm above the hem), and below the hem the skirt widens back as a
CONE (≤ 0.7 cm per 1 cm row) never a shelf — the skirt used to come through a
jacket's hem as a ragged line. **(4) THE PROBE**: `POSE=walk|idle|kick node
creator-render.js …` renders the rig POSED (CPU-skinned after the collision
tick) and prints `HEM` (the sawtooth number) + `COLLIDE` — the bind pose hides
all of this; never judge a skirt from it again. character-creator.test.js: two
rev 11 tests (source + the real rig posed: bind untouched, walk mean < 2.5 mm,
the kick pushes more than the walk). Unseen live: the browser's lit hem, the
long skirt over a raised foot (the capsule ends at the ankle).

## CHARACTER CREATOR rev 10 — the locker, the name, topless, the extra layers, the beard, the prints (2026-09-13, local delivery)
**THE NAME + THE LOCKER**: party-builder.js `SavedLooks` (rendered first
inside `CreatorControls`, which now takes `name / onName / onLoad`) — the
NAME field lives where the look is made (the forge writes `partyNames`
through `handleNameChange`; the mirror files it as `door.hq.look.name`,
data.js `hqLook` / `hqSetLook`), 💾 SAVE CHARACTER files `{ id, name,
gender, appearance, at }` in localStorage `ew_saved_looks` (`pbLooksLoad /
pbLooksSave / pbLooksDelete`, `PB_LOOKS_MAX` 40, the same name
overwrites, newest first; `window._ewSavedLooks`), a chip LOADs it
(appearance + base + name, either home), ✕ forgets it. **TOPLESS**:
`outfit: 'none'` (sprites.js EW_OUTFIT_STYLES; `_ccTopDef('none')` →
null — every TOP read in `rebuildGeometry` is guarded; neckwear then sits
on the skin). **THE EXTRA LAYERS (＋ ADD LAYER)**: `outfit2` (a second top
over the top) and `bottoms2` (a second pair of bottoms over the bottoms —
briefs over trousers) with `top2* / bottom2*` fabric / colour / pattern
keys (`EW_APPEARANCE_LAYERS` rows carry `slot` for every layer and `extra:
true` for these); renderer shells `top2` / `bottom2` (`CC_LAYER_NAMES` =
15), cut by `_ccOverDef(def, extra)` = the catalogue row at a larger
ease, `under` = the layer beneath; the belt rides up over bottoms2; ONE
lathe: a dress > a second top's dress > a skirt worn over (`bottoms2`) >
the bottoms' skirt (`part.skirtOwner` names the keys). The builder's
`ccExtraLayers` (＋ ADD LAYER menu → a full layer row with ✕ REMOVE).
**COLLARS / HOODS ARE GONE** (the ribbon read as teeth; every neckline is
the cloth's own rim fold) — no `collar` field on any row. **CONFORMING
PATCHES**: `surfacePatch(b, L, cx, t, hw, hh, mode, th, gain, { n, k,
puff, shape })` samples a rounded outline (a superellipse or a custom
`shape(s)`) ON the surface — patch pockets, the kangaroo pocket, a tie's
knot, THE BOW's two pinched wings (in the `tie` shell) — never
`placeBox` for anything wider than a welt. **THE BEARD**: styles
`moustache` + `fullbeard` (enum); VOLUME — `rebuildGeometry` pushes the
masked jaw / chin / cheeks out along the WELDED normals (4 / 3 / 6 mm,
`bPush`; the base's split normals cracked the cheek) and redoes NB; PAINT
— strands across a growth-direction field (down + outward), two octaves,
a slow noise wander, clumps, darker roots / lighter tips; stubble = the
field thresholded. `beard` is in the shape key. **THE PRINTS**: 20
patterns (+ hpinstripe · hearts · minidots · diamonds · houndstooth ·
zebra · leopard · crosshatch); feet / gloves / belt print at 2× cells
(`_ccPatternTexture(…, cellsMul)`). **THE CLOTH FRAME**: the arm region
starts at the SHOULDER JOINT (`_armRegX` = shoulder.x + 1.2 cm; a
sleeve is its own tube, the switch is the shoulder seam) and the FEET
are their own polyline (`limbs.footL/R`, a hand above the ankle → the
ankle → the toe, `qt < 0.15`; u / v continue the leg's through `uOff /
vOff`) — a shoe used to be the leg cylinder's clamped end (stripes fanned
round the ankle whatever the fabric); the seam guards compare ANGLES
(`ANG / TURN`), u stays at ONE radius per limb (a skin-radius u was tried
and fanned every stripe in at the waist — cloth hangs at one
circumference). **THE LATHE**: 96 azimuths, the radius field blurred
round and down (`fs2` below the waistband) then held ≥ the measured
maximum + the layers worn UNDER it (`opts.surface` for the bodice band,
`opts.under` for the trousers — they poked through a dress), no pockets
on covered bottoms, the collision margin 1.1 cm. `npm test`:
character-creator.test.js (two rev 10 tests, one on the real rig).
Screenshotted headlessly (`creator-render.js` renders top2 / bottom2):
the beard, the bow, briefs over trousers, the striped tee, the boots, the
dress waist — the LOOK in the browser is unseen; the hoodie's kangaroo
pocket is subtle under flat light.

## CHARACTER CREATOR rev 9 — the picker lag, the coat, the wrist, cloth collision, THE DETAILS, the wardrobe (2026-09-13, local delivery)
**THE LAG**: every colour change re-baked the 2048² face (~265 ms) and the
native colour input fires per pointer move. Now the rig's `update(value,
{ preview: true })` bakes the face at `CC_FACE_PREVIEW_TEX` (512) and a
printed tile at a quarter size; the viewer's per-frame coalesced update is
a preview and ONE full bake runs `CC_SETTLE_MS` (240) after the last change
(`v.appearanceSettle`); party-builder.js `CreatorControls` sends colour /
slider values through `queueChange` (one change per animation frame).
**THE COAT**: no lathe tail any more — the coat is ONE shell to mid-thigh
(`CC_OUTER.coat.hem` 0.40) at a larger stand-off below the hips (`hemEase`
/ `hemEaseFrom`, `layerEase` + `layerEaseAtQ`); the tail tore on every
posed stance. **THE HAND**: a 'wrist' sleeve is never cloth past the wrist
joint's plane (`armAt().past`, `wristPlane − A.past` in the sleeve cut) and
the arm profile leaves the hand out — the thumb projected before the joint
and every long sleeve capped it in cloth; a rim strip's depth reads the
layer's LOCAL ease and stays under 45 % of the limb's radius. **THE WRIST**:
the sniper's `Idle_5` (every rig's default idle) holds its right wrist bent
67° with a 51° twist; `def.wristLimit` (degrees; the creator bases wear 30,
sprites.js `EW_CHARACTER_BASES`) caps a hand bone's rotation off its rest in
`_libBakeClips` (`_lqLimit`). **CLOTH COLLISION**: a cut garment rides the
body's own topology + weights and can never clip; the LATHES (skirts) can,
so `collideSkirt(part)` runs every frame after the mixer (`rig.tick()` at
the board / HQ / viewer mixer sites): each skirt vertex is skinned on the
CPU (`SkinnedMesh.boneTransform`), pushed out of the two leg capsules
(`part.legs` — hip → knee → ankle radius profiles measured at setup, the
joints from the bones' world matrices) and carried back to bind space
through its own skin matrix. Kill-switch `EW_NO_CLOTH_COLLIDE`. No Blender
pass is needed for any of this: the cloth IS the body, offset. **THE
DETAILS** (`buildDetails`, kill-switch `EW_CC_NO_DETAILS`): trim geometry
placed on a layer's cloth surface at (|x|, t) off the nearest base vertex
(`surfaceAt` — front / back / the thigh's side / the top of the foot) and
riding that vertex's weights — `placeBox`, `disc`, `ribbon` (+ `smoothPath`,
the raw samples zigzag). Row fields: `buttons { n, x, from, to, r, double }`,
`placket { buttons, from, to, w }`, `zipTape`, `pockets [{ x, t, w, h, kind:
patch | welt, side, back, flap }]`, `collar: 'band' | 'hood'`, `beltBand`,
`straps` (sandals). Fabric pieces land in their layer's buffer (the owner
vertex's cloth UV + the corner offset); hardware in the `trim` shell,
neckwear in `tie` (`tieColor`), glasses in `glasses` (`glassesColor`) — three
new shells (`CC_LAYER_NAMES` = 13). **THE WARDROBE**: tops polo · henley;
outer cardigan · hoodie · trench · parka; bottoms baggy · cargo · sweatpants;
feet sandals; accessories `neckwear` (tie · bowtie) + `glasses` (round ·
square · shades — rims round the measured eyes, temples to the ears) with
the builder's ACCESSORIES section. `EWCharViewer.dev.state()/model()` = the
live stage record for probes; `playtest_creator.js` now serves the animation
libraries from `rigged_animations/` so its shots are POSED. On Meshy
garments: see PARTY_BUILDER_PLAN §9 (rev 9 entry) — when to model, how to
fit. `npm test`: character-creator.test.js (+ the rev 9 guard).

## CHARACTER CREATOR rev 8 — the outer layer fixed, THE PRINTS, THE MIRROR (2026-09-13, local delivery)
The 2nd layer (`CC_OUTER`: jacket · blazer · vest · coat) verified on BOTH
bases with `creator-render.js` (baseline → fix, every view): sleeved
layers' ease TAPERS to the wrist (`layerEase` / `sleeveEase` /
`part.armFrac` — the cuffs belled), NO collar cap (`neck.top` 0.848 put
the cut on the neck-base wall → a sawtooth; the 0.852 ridge is the only
collar line), the lapel is a cosine fold (`lapelRaise`, lit), the lathe
(`buildLathe`) measures the RELAXED skin R (it read P and ledged out of
the coat / the trousers), the coat tail hangs from 6 mm above the hem with
its own `swing`, the dress skirt likewise, the arm capsule's cap BEHIND
the shoulder joint is 0.45 × the deltoid's radius blended over 3 cm
(`armAt().proj` — the full sphere ate every strap; a step made bites),
the vest wears the tank's panel heights, and every rim strip is THE FOLD
(extruded toward the skin AND under the cloth, its normal leaning toward
the cloth's, gain 0.86 — the strips used to poke past the shoulder as
teeth and outline every opening in black). Probe any layer's cuts with
`window.EW_CC_DEBUG_CUTS = (garments, part) => …`. **THE PRINTS**:
sprites.js `EW_PATTERNS` (12 ids, `solid` first) + `<layer>Pattern` /
`<layer>Color2` on every `EW_APPEARANCE_LAYERS` row; three-renderer.js
`_ccPatternMask(id, u, v)` (pure, tiling) → `_ccPatternBytes` →
`_ccPatternTexture` (an instance-owned canvas = the fabric tile × colour
1 → colour 2; the printed layer's vertex tint is WHITE); the builder's
`ccPrint` rows (live swatches via `EWCharViewer.patternThumb`, COLOUR 1 /
COLOUR 2); creator-render.js prints through the same painter. Adding a
pattern = one `EW_PATTERNS` row + one `case` in `_ccPatternMask`.
**THE MIRROR** in Occam's Barbershop IS the character creator: the
counter's `fn: '_mountReactCreator'` (party-builder.js `OfficerCreator`
over the shared `CreatorControls` component — the forge's GEAR panel
uses the same one; `_HQ_MODAL` in map.js) files the officer's own look on
the profile (data.js `hqLook` / `hqSetLook` → `door.hq.look = { gender,
appearance, portrait, at }`), takes THE PHOTO (`EWCharViewer.snapshot` —
a 256 × 320 bust JPEG data URL; profile.js `doorCardPortrait` shows it on
the ID card, `.door-photo-look`) and sits you in the chair as it: the
fifth avatar mode `'look'` (only while a look is on file) → map.js
`_hqAvatar` → `{ race: 'homosapien', gender, appearance }` → the walker
is the creator rig (`_hqSpawnCharacter` passes `spec.appearance` into
`unit.appearance`); `window._hqRefreshAvatar()` swaps it at once. The
forge's creator has USE YOUR OWN LOOK. `npm test`: character-creator
.test.js (+ a headless React render of both screens — needs `npm i
--no-save three@0.128.0 react@18 react-dom@18` in ONE install),
doorhq.test.js, party-builder.test.js. Verified in the bind pose only —
photograph a posed jacket over a tee next (`playtest_creator.js
--layers`). Full log: PARTY_BUILDER_PLAN.md §9 (rev 8 entry).

## CHARACTER CREATOR rev 7 — the wardrobe: LAYERS, straps that hold, skirts (2026-09-12, local delivery)
Every garment is a LAYER shell (`CC_LAYER_NAMES` = body · top · bottom ·
face · outer · feet · gloves · belt · skirt · buckle; each a SkinnedMesh
hidden when its cut is empty) with its own cloth surface at its own ease
(`clothSurface`), cuts, t-range, shading, fabric + tint (`LAYER_KEYS`;
sprites.js `EW_APPEARANCE_LAYERS` names the keys — `outerFabric` /
`outerColor` etc.; the skirt wears the top's for a dress, else the
bottoms'). Tables in three-renderer.js: `CC_TOPS` (tee · vneck · suit ·
crop · tank · atank · racer · tube · bikini · dress · gown), `CC_OUTER`
(jacket · blazer · vest · coat — an OPEN FRONT `open` + a `lapel` band;
the coat has a lathe `tail`), `CC_BOTTOMS` (trousers · shorts ·
shortshorts · briefs · bikini — a `leg` line — · miniskirt · skirt ·
longskirt — `skirt` = the lathe only), `CC_FEET` (sneakers · boots ·
highboots + `buildSole`), `CC_GLOVES`, `CC_BELT` (+ `buildBuckle`) ↔
sprites.js `EW_*_STYLES` catalogues (character-creator.test.js diffs
every one; the rev 6 `jacket` TOP maps to `outer: 'jacket'` in
`normalizeCharacterAppearance`). **THE ARM IS GEOMETRIC** (`armMask`:
the measured radius profile `part.armR` round the arm polyline + 9 mm,
plus a 13.5 cm hand sphere round the wrist joint) — never read the skin
weights (q[3]) for a cut again: they wander to |x| 0.06 on the back and
their isoline is a sawtooth. **A SLEEVELESS TOP = two PANELS + STRAPS**:
`panelCut` (the neck U `depth` → `xIn` ≥ 0.056 — the neck base is 5
cm(q) wide, anything inside climbs the neck — the panel `top`, the
armhole `xOut` → `pit` keyed off the shoulder joint) blended front /
back and UNIONED with `strapPath` capsules (a path sampled on the
shoulder, distance measured in the unrolled (x, arc) plane so the width
never depends on the ease or the mesh) and the racerback's `spine`.
**THE LATHE** (`buildLathe`): skirts, dresses, the coat's tail — the
pelvis as a radial map off the NORMAL-offset skin, draped vertically,
flared, a SWING allowance on the front / back panels (growing below the
knee), every column weighted to the nearest leg (a 50/50 blend of both
over ±27° at the front / back centre — a split lathe gaped in the idle
stance), the flare 35 % to the Hips. Rules: a straddling triangle is
subdivided before the cut (`refine`; `thin` layers also test midpoints);
a rim strip over another layer ends 1.5 mm past it (`under`); strip
normals come from the cut's gradient; every shade is a ramp (`line` /
`band`); generated geometry indexes past the layer's base (`nBase`).
Adding a garment = a table row + a catalogue entry (+ a `ccLayer` row in
party-builder.js for a new layer); `node creator-render.js male tee tag
'{"outer":"coat","bottoms":"skirt",…}'` renders any look headlessly;
`playtest_creator.js <tag> --layers` photographs every layer posed. Full
log: PARTY_BUILDER_PLAN.md §9 (rev 7 entry).

## CHARACTER CREATOR rev 6 — the sleeves, the straps, nine tops (2026-09-11, local delivery)
The tops are `CC_TOPS` (three-renderer.js "CHARACTER CREATOR RUNTIME") ↔
sprites.js `EW_OUTFIT_STYLES` (id + label; `EW_APPEARANCE_ENUMS.outfit`
derives from it, the builder's Top row reads it): tee · vneck · suit (the
v1 long sleeve) · jacket · crop · tank · atank (the A-shirt) · racer ·
bikini. Every top is CUTS in the q frame built by the rig's `topCuts`:
`hem`; a `neck` with separate front / back depths (blended by `frontness`)
rising to 0.852 by |x| = w (quarter-ellipse or v; `top` caps a stand
collar); `sleeve` = metres ALONG THE ARM'S POLYLINE (`armAt` — the cut is a
plane normal to the arm axis gated to the arm, a ring in every pose; never
an x-plane) or `null` = sleeveless: the arm goes by the rig's SKIN WEIGHTS
(`part.arm` → q[3] ARMNESS, interpolated by `mix`) and a `scoop`
superellipse keyed off `part.shoulder.x` shapes the front armhole / strap
(front / back may differ — the racerback); `bikini` = band + triangle cups
+ straps. Adding a top = one `CC_TOPS` row + one `EW_OUTFIT_STYLES` entry
(character-creator.test.js diffs them). RULES that came with it: the cloth
relaxation moves vertices along their NORMAL only (a plain Laplacian slid
them a centimetre and every bind-frame cut came out as a sawtooth); `split`
refines each crossing with secant steps (cuts are curves) — never a
clamped constant inside a cut (it flattens the interpolation); rim edges
are found by `on` masks (`split(poly, cut, bit)`), the hem strip is planar
with its own outward normal; the bottoms hang at their own ease (`CB`).
Tooling: `creator-render.js` `VIEW='{"name","yaw","cx","ct","scale"}'`
(a custom close-up, q units) and `NO_HEMS=1`; `playtest_creator.js <tag>
--tops` photographs every top on both bases posed. Full log:
PARTY_BUILDER_PLAN.md §9 (rev 6 entry).

## CHARACTER CREATOR rev 5 — the face off the mesh, the skull map, the cloth frame, welded weights (2026-09-11, local delivery)
Four fixes to the rev 4 rig (three-renderer.js "CHARACTER CREATOR RUNTIME"):
**THE FACE IS MEASURED, NEVER TABLED** — the two bases do NOT share a face
(male mouth line t 0.8985 / nose tip 0.918, female 0.8915 / 0.912; the old
`CC_FACE` put the male's lips in his chin). `_ccFaceLandmarks(q, nz, ids)`
rasterises the head's front into a depth map and reads nose tip, mouth line,
subnasale, sulcus, chin, nasion (eyes 3 mm(q) under it), mouth width and the
BROW RIDGE off the centreline / eye-column profiles into `lm.F`; the painter
reads `lm.F || CC_FACE` (the table is the fallback only). Brows sit on the
ridge, 2.6 cm(q) long. **THE SKULL MAP** — `buildSkullMap` (a radial height
field of the head, 64 × 32 bins) and `fitHair` push every hair card ≥ 4.5 mm
off it, conform the scalp cap to +1.5 mm and tuck the cap's rim under the
nape; the fit is centred on the skull's BOX centre (the centroid leaned one
way → one temple bald). Under any style the crown is painted in the hair
colour (`scalpOn` in `_ccBakeSkin`; `paintKey` carries bald ↔ hair). **THE
CLOTH FRAME** — garment UVs are cut like cloth in METRES on five centred
polyline cylinders (torso · arms from |x| > 0.155 q · legs incl. the pelvis;
`polyline` / `limbUv` / `clothRegion` / `clothUvOf` / `centreLimb`,
`fixClothUv` re-emits seam / region straddlers with their own vertices, cut
vertices re-project from position) — the Meshy atlas's islands made every
fabric a shattered patchwork. `EW_FABRICS.repeat` = tiles PER METRE now.
**WELDED SKIN WEIGHTS** — the rigged bases give the two copies of a seam
vertex different weights (2,835 pairs, up to 0.48 apart); a posed rig tore at
every UV seam ("cracks" on the shins and the shirt — invisible in the bind
pose, so invisible to every headless render). `part.siW` / `part.swW` weld
them per position group; every shell reads those. Tooling: `creator-render.js`
now renders fabrics + hair (+ `back` / `top` / `hair*` views); a crack the
headless tool cannot reproduce is a POSE problem → the Playwright probe.
Full log: PARTY_BUILDER_PLAN.md §9 (rev 5 entry).

## CHARACTER CREATOR rev 4 — the drape, the face shell, the eyes (2026-09-11, local delivery)
Three fixes to the rev 3 rig (three-renderer.js "CHARACTER CREATOR RUNTIME"):
**THE DRAPE** — the shirt front is no longer a flat chest plank: `drapeFront`
grids the relaxed cloth's front depth, takes each row's upper convex hull
(bridges the sternum valley, keeps convex sides round) and drapes each column
downward at a max fall slope (`DR.slope`), so a shirt hangs from the bust /
pecs. **SHADING** — every shell's normals are relaxed over the welded one-ring
(`smoothNormals`; strong on body + cloth, light on the face), skin roughness
0.8. **THE FACE SHELL** — the head (t > `CC_HEAD_T`) is a FOURTH shell
(`EWCreator_face`) with its own seam-free cylindrical UVs (`_ccFaceUv`, seam
at the back, seam triangles re-emitted at u + 1) and a 2048×1024 painted
texture (`CC_FACE_TEX`, half on mobile); the body wears the skin tone as vertex
colour, no texture. Eyes are ANTHROPOMETRIC (`_ccFaceLandmarks`: ±0.53 × the
front half-width, 53 % chin → crown — the bases' sockets are too faint to
detect and the old recess search put them at the temples), almond-shaped with
the iris under the lid, soft edges; the painter `faceColor` is allocation-free
with band gates (~265 ms per repaint in the browser; the vm test harness is
~15× slower — interceptor globals — don't trust its timings); the beard mask
follows the jaw. **`node creator-render.js`** (repo tooling, needs
three@0.128.0) renders the rig headlessly — body, cloth and the painted face —
to PNG; use it before the Playwright probe (see PLAYTEST_NOTES). The test
expects four shells. Full log: PARTY_BUILDER_PLAN.md §9 (rev 4 entry).

## CHARACTER CREATOR rev 3 — the charactercreation/ assets (2026-09-11, local delivery)
The Forge's GEAR → CHARACTER CREATOR dresses Homosapien slots from the
user's `charactercreation/` folder (repo + R2 `Assets/Models/charactercreation/`).
**The bases there are UNRIGGED** (Meshy "low_poly_unwrapped", 30k tris, UVs,
no skeleton) — never wire `…_<gender>.glb` directly. `node character-rig.js`
(repo tooling, zero deps) makes the runtime assets: `bodies` transfers the
old donor exports' (`rigged_animations/…_biped_Character_output.glb`, keep
them) 24-joint skin weights onto the new meshes → `…_<gender>_rigged.glb`;
`hair` splits `hair-pack-part-1/source/HairPackPT1.glb` into
`hair/hairNNN.glb` (one static GLB per style, textures embedded, centred on
its scalp cap). A new unrigged human base or a hair-pack-part-2 goes through
the same two commands. Data model = sprites.js `normalizeCharacterAppearance`
(v2; catalogues `EW_HAIR_STYLES`, `EW_FABRICS`, `EW_APPEARANCE_ENUMS`;
URL helpers `getHairStyleUrl` / `getFabricTextureUrl`; every asset has ONE
same-origin fallback via `getCharacterModelFallback` → server.js
`/api/character-model/*`). Runtime = three-renderer.js "CHARACTER CREATOR
RUNTIME" block (`_createAppearanceRig` + `_ccBakeSkin` / `_ccFaceLandmarks` /
`_ccLoadFabric` / `_ccHairTexture` / `_ccLoadHair` / `_ccWarmAssets`): the face
(eyes / brows / lips / facial hair) is PAINTED per texel through the base's
UVs onto an instance-owned skin canvas; garments are cut shells wearing a
fabric tileable; hair is the style GLB fitted to the skull and skinned to the
Head bone; tints are VERTEX colours (the board's Lambert swap keeps map +
vertexColors + side/alpha only). Rules that came with it: relax / average
normals over position-WELDED vertices (the unwrapped base splits every UV
seam — per-index maths tears the cloth); keep geometry INDEXED (base
vertices shared, cut vertices appended — a rebuild is ~0.2 s, not 1.7 s);
mutate `mesh.material` (the CURRENT one), never a stored material; hair
meshes wear `_ew_noTwin`; `state.js resolveIdentityForBuild` keeps a creator
look's gender (the stock human model is male-only). Dev: `EW_CC_DEBUG_UNLIT`
(unlit creator materials). Verify with `NODE_USE_ENV_PROXY=1 node
playtest_creator.js [tag]` (serves the creator assets from disk; see
PLAYTEST_NOTES "THE CHARACTER CREATOR PROBE"). `npm test` runs
`character-creator.test.js` against the real files. Full history + the
asset wishlist: PARTY_BUILDER_PLAN.md §9 (2026-09-11 entry). Not deployed
until the user uploads the rigged bases + hair GLBs and the edited files.

## Adversarial continuation — 2026-09-10: shared VFX helper cleanup (local delivery)

Shock ring and speed burst helpers now dispose instance resources if `_sigRun` refuses registration; do not move this disposal into `_sigRun` without auditing callers that already own refusal cleanup. Flame scene switches detach groups before material disposal, preserving cached box geometry. Host and guest use the same helpers; relay payloads are unchanged. See ENTROPY_WARS_ADVERSARIAL_REVIEW_PLAN.md for the current continuation and EFFECT_CALLBACK_INVENTORY.md for remaining work. 13 focused tests pass (8 fail before fixes); full local suite 445 pass, 2 existing failures, 2 skips; syntax 85/85 clean. Complete-file delivery is ENTROPY_WARS_SHARED_HELPER_FIXES.zip; deployment and browser acceptance are unverified.

## Adversarial continuation — 2026-09-11: `_sigRun` refusal sweep (local delivery)

`_sigDisposeGroup` is the ONE disposal rule for a signature group (skip `_ew_shared` geometry, dispose materials incl. arrays, never textures) — `_sigRun`'s `finish` and `_sigRunOwned` both use it. A helper that builds a fresh group and does not read the entry back MUST call `_sigRunOwned`; a helper that checks the entry and cleans up itself keeps `_sigRun` (never both — that double-disposes). `sig-refusal-cleanup.test.js` fails on any `_sigRun(` call whose entry is ignored. Test harnesses that stub `_sigRun` must stub `_sigRunOwned` too (descent-lifetime.test.js does). `_wpnLoad` / `_loadCachedTex` are cache-only loaders with application lifetime — keep them outside `_fxCancelDelays`. Full local suite 464 / 462 pass / 2 skips; syntax 88/88. Delivery zip `ENTROPY_WARS_SIG_REFUSAL_FIXES.zip`; not deployed.

## Adversarial continuation — 2026-09-10 (America/Chicago): ritual emissions (local delivery)

After the preceding entry labeled 2026-09-11, refreshed the full main archive at `ccbdde65b0ca8636ef45a0ab29d1f9af059443f9`. Candle embers and burning-cross licks now use `_fxDelay`, so they retire with the originating battle/preview even after partial emission or a fresh cast. Keep `_sigRunOwned` geometry/refusal cleanup and cache-only loaders unchanged. New production-helper tests: 16 pass, nine fail on unchanged source; full package test command via bundled Node: 479 pass, zero fail, two skips; syntax 89/89. `ENTROPY_WARS_RITUAL_EMISSION_FIXES.zip` contains complete files; not deployed or browser-playtested. Continue with sleigh frost wake and stand-sword dissolve motes, then remaining bespoke timers and VFX-04; see the review plan and inventory.

## Adversarial continuation — 2026-09-10: sleigh/stand-sword emissions (local delivery)

Sleigh frost wake and stand-sword dissolve motes now use `_fxDelay`. Keep `_sigRunOwned` geometry cleanup and application cache warmup unchanged. Thirteen new checks pass (five fail before); full suite 492 pass, zero fail, two skips; syntax 90/90. Complete files: ENTROPY_WARS_SLEIGH_SWORD_FIXES.zip. Not deployed or browser-playtested. Next: slash-combo dissolve motes and jaws terminal mist, then remaining bespoke timers and VFX-04.

## Adversarial continuation — 2026-09-10: slash-combo/jaws emissions (local delivery)

Slash-combo dissolve motes and jaws terminal mist now use `_fxDelay`. Preserve `_sigRunOwned` cleanup and cache warmup. Fifteen checks pass (six cancellation regressions fail before); full suite 507 pass, zero fail, two skips; syntax 91/91. Complete files: ENTROPY_WARS_SLASH_JAWS_FIXES.zip. Not deployed or browser-playtested. Next audit `_sigCannonShot3D` detached-ball disposal ownership; its timer cleans up resources and must not simply be canceled. Then continue remaining emissions and VFX-04.

## Adversarial continuation — 2026-09-10: cannon and four emission helpers (local delivery)

Cannon carriage and ball now share an identity-transform `_sigRunOwned` group, retaining independent carriage recoil/world-space flight while disposing together on finish, refusal or retirement. No detached-ball cleanup timer remains. Tesla arcs, storm impact, judgment pillar and staggered music-note creation use `_fxDelay`; preserve geometry owners and cache warmup. 27 checks pass (15 fail before); full suite 534 pass, zero fail, two skips; syntax 92/92. Complete files: ENTROPY_WARS_CANNON_EMISSION_FIXES.zip. Not deployed or browser-playtested. Next: whiteout second ring, rune sphere and remaining bespoke callbacks, then VFX-04. See the plan's top entry for evidence limits.

## Adversarial continuation — 2026-09-10: whiteout/seal/gas (local delivery)

Whiteout second ring, Spear Prison finisher and Gas Cloud puffs now use `_fxDelay`. Rune Sphere returns `_sigRunOwned` so refusal disposes its instance resources; its entry/null API and cached glyph texture are preserved. 24 checks pass (11 fail before); full suite 558 pass, zero fail, two existing skips; syntax 93/93. Complete files: ENTROPY_WARS_WHITEOUT_SEAL_GAS_FIXES.zip. Not deployed or browser-playtested. Next: Aurora Curtain and Spiral Beam refusal paths (returning `_sigRun` alone is not cleanup), then Bad Trip staggered skull emissions and VFX-04. See the review plan's top entry for evidence limits.

## Adversarial continuation — 2026-09-10: Aurora Curtain/Spiral Beam/Bad Trip (local delivery)

Aurora Curtain and Spiral Beam return `_sigRunOwned` to dispose refused allocations while preserving entry/null results and shared textures. Bad Trip delayed skulls use `_fxDelay`; its first skull remains immediate. 16 new checks pass (six fail before); full suite 574 pass, zero fail, two existing skips; syntax 94/94. ENTROPY_WARS_CONTINUED_VFX_FIXES.zip includes these three fixes plus the preceding four whiteout/seal/gas fixes and both test files (40 new checks total). Not deployed or browser-playtested. Next: Magic Circle, Magic Orb and Light Pillar refusal paths, then remaining return-only consumers and Psychosis timers; VFX-04 remains open. See the review plan's top entry for evidence limits.

## MOVING MAPS — the setting travels (2026-09-12, rev 2 the same day)
Three sites whose WORLD streams past the board, faster every round —
**Room 1717 · THE FLYING DUTCHMAN** (`prebuilt_revenge` — the id stays,
the label / names / site file / cast lines were renamed from Queen Anne's
Revenge in rev 2; Hollow bay: the main deck of the ghost ship, bow to +X,
a wood-and-deep-water bed, the sea racing past into a storm), **Room 426 ·
THE DERELICT** (`prebuilt_derelict`, Celestial: the DORSAL DECK of a dead
starship, void under hull plate, the wreckage field streaming by as it
swings in close to the SUN) and **Room E4 · THE LOOKING-GLASS**
(`prebuilt_lookingglass`, Diplomatic: a marble chessboard flying through a
void of unfinished shapes, the Cheshire MOON swinging in close). Heaven
drifts too (a gentle one). **Rev 2 added four more movers**: Stonehenge
and Area 51 WHEEL (the far roster + the dome turn about the board), the
Tower of Babel RISES (the world streams down past a climbing board), Hell
SINKS (`dir: -1`). The board itself NEVER moves (every rule, pick and
camera is untouched); the ENVIRONMENT does. One row does it all:
`env.motion` on the EW_MAP_META row (data.js) — `{ kind: sea|space|void|
drift|wheel|rise, axis: 'x' (the streaming kinds), dir: ±1 (rise), speed
(tiles/s at round 1 — for `wheel` tiles/s along the ring at the roster's
radius, so the dome and the roster turn as one), ramp (per round), max
(multiplier cap), sea + seaDepth (the moat sheet streams), sky (dome
cloud/nebula flow; the yaw on a wheel; the lift on a rise), storm: { from,
to } (overcast builds between those rounds), orbit: { body: sun|moon,
period (tiles travelled), near 0..1 } (a close pass that SWELLS the sun /
moon), ambience (an audio.js bed) }`. Rev 2 PACE: the three travellers run
3–3.6 tiles/s at round 1 with a 5–5.5× cap (15+ tiles/s by round 17) —
motion-maps.test.js insists on ≥ 3 / ≥ 5; tune `speed` / `ramp` / `max`
on the row. three-renderer.js **MOTION** block (right before
`_buildHorizonScenery`): `_motionTick` (distance, eased speed = speed ×
min(max, 1 + ramp·(round−1)) — reads `state.round`, which SYNCS to the
guest, so online both seats see one speed with nothing relayed, RULE #2;
`_motion.ang` / `skyYaw` on a wheel, `skyLift` on a rise),
`_hzPlaceStream` (streaming kinds: the far roster laid along the travel
band and WRAPPED instead of the ring; wheel / rise: placed ON the ring and
then turned about the board / streamed up a vertical band by
`_motionPlace` — `e.mode`; rows may carry a sixth field `'sea'` = on the
water / `'door'`), `_motionBuildMotes` (spray / dust streaks stretched by
the speed; sparks orbiting on a wheel, vertical streaks on a rise),
`_motionAnimate` (streams, sheets, wake textures, motes — from
`_animateFloaters`). Sky: `uSkyFlow` / `uSunNear` / `uMoonNear` /
`uSkyYaw` (rotates `rd` about Y — the whole dome wheels, sun and moon
included) / `uSkyLift` (the cloud fbm's second axis) on `_envUni`; the
dome swells the sun / moon, the 3D moon mesh scales with it, the map tint
gilds near the sun; `_hqTickSky` zeroes them all — the building is still.
Sea: `_nrMoat({ stream: true })` registers the sheet in `_motionSheets`
(slides one tile and wraps — seamless), the caustic web follows through
`_fluidFlowUniform` / `uFluidFlow` (reset by `_hqTickMoat`).
**THE HULLS (rev 2)**: `_nrLoft(rings, ts, { open, capStart, capEnd })`
is the one lofting helper (R rings of N points → an indexed surface, UVs
in tiles, DoubleSide it); `_nrShipPlan(K, { hb, sternX, prowX })` the
deck plan of a ship (a rounded transom, a clipper bow), `_nrPlanRing` /
`_nrPlanDeck` its rings and deck. The Dutchman is that plan lofted to a
keel with tumblehome + a rounded bilge, two wales, the deck cut to the
plan, a BULWARK ribbon following the sheer with the gangways open at the
spawn lanes, stanchions and `_nrTorch` TORCHES in brackets on every third
post (the game's torch model, `_torchRegisterFlame` entries wearing
`_ew_nr` so `_buildHorizonScenery` prunes them with the setting, point
lights on eight + the prow torch, reach 2.4× a floor torch's), the
sterncastle lofted off the stern of the plan (transom windows, the name).
The Derelict is a FUSELAGE of rounded-box sections along X (a blunt stern
with three burning engine bells + plumes, the widest section under the
board, a drooping nose), the deck plate = the deep apron on its back with
a lip, nacelles on pylons, the bridge forward, flank light strips, running
lights, a breach with sparking cables. **`_ew_occSkip`** on a mesh exempts
it from the line-of-sight fade (`_occComputeBlockers` skips the hit): the
hull / fuselage / deck the board rides on carry it — their closed back
lies under every tile, so the jittered rays below a subject's feet hit it
from any angle and the whole ship faded out. Hull materials carry a
STRONG self-lit `lift` (0.4–0.55): a plain Lambert side face is black
under a night sky / in space. Both hulls are battle-only (`!HQ`) — the
site room keeps its quay. **THE PIECES (rev 2)**: the Looking-Glass's
cover is six chess MONUMENT kinds `chess_pawn / knight / rook / bishop /
queen / king` — 1×1 tile boxes in map.js `_MON_GRID` (pawn + knight 2
high, the rest 3: they block the way AND the sight like any block) mirrored
in three-renderer.js `_MON_GRID` and delta-maps.test.js, allowed on Δ
boards by `MF_DELTA_SOLID_MONS`, placed by the forge's `M.pieceSym(kind,
x, y, h)` (the authored one dark = P2's half, the twin light), built by
`_hzChessMon(kind)` (the `_hzChessPiece` lathe, slimmer via its new
`rMul`, on a plinth that fills the tile so the horizontal-first fit leaves
the piece slim; lit Lambert). Monument builders now receive `(rng, mon)`
in the battle AND the site room — `mon.dark` is the only reader so far.
The editor catalogue lists them. Three far rosters (`sea` · `wreckage` ·
`wonder`) and three settings (`_NR_BUILDERS.revenge` / `.derelict` /
`.lookingglass`; `_hzChessPiece` is the lathe both the rim and the roster
use; a setting must skip its wake / rigging / hull under `K.hq`). Cost:
uniform writes + one position write per streaming body per frame.
Kill-switch `window.EW_NO_MAP_MOTION`; `EW_PERF_LOW` halves the motes;
readout `ThreeRenderer.motion()` (now with `angleDeg` / `skyYaw` /
`skyLift` / `dir`). The Δ FORGE takes a per-board bed (`cfg.strata` /
`underTop` on `_mfDeltaNew`, recorded as `entry.bed`). Adding a moving
map = the 7.10 checklist + an `env.motion` row (+ a roster if none fits);
a wheel / rise needs NO new roster (the map's own turns / streams).
`npm test` runs `motion-maps.test.js`. **Screenshot them** with
`NODE_USE_ENV_PROXY=1 POSES=far,side,bow node playtest_maps.js
prebuilt_revenge prebuilt_derelict` (the tool was re-pointed at the CRT
match-select in rev 2 and launches through the selection mirrors;
`PROBE_EVAL='<js expr>'` prints any page value, e.g. `ThreeRenderer.
motion()`; see PLAYTEST_NOTES "MOVING MAPS rev 2"). First things to
eyeball: the pace at round 1 and the cap, the Dutchman's env light (rev 2
lifted the tint a notch — she is still a dark map), the wheel's rate on
Area 51.

## RING VITALS + NAMEPLATE STYLES (Video settings) — added 2026-09-11
An alternative to the HP/MP bars on the nameplate: the two meters are drawn
ON the team reticle at the unit's feet. three-renderer.js `_plateLook`
(`rings`, `style`; localStorage `ew_ringVitals` / `ew_plateStyle`; API
`ThreeRenderer.setRingVitals / isRingVitalsOn / setPlateStyle /
getPlateStyle`, applied LIVE — no rebuild). The reticle shader
(`_reticleFragmentShader`) has a `uMeters` branch: HP is the outer meter on
the ring's own radius (0.42), MP the inner one (0.335), both filled
CLOCKWISE FROM THE SCREEN'S 12 O'CLOCK over a dark track — `uMeterRot` =
camera azimuth + π − facing yaw, fed per frame by `_updateRingVitals` from
`_updateUnitFacing` (bat swarms included); fills ease toward the unit's live
hp/mp/shield (`_seedRingVitals` at build so a rebuild never re-drains).
Colours: ally HP green / enemy HP red / MP blue (`RING_HP_ALLY_COLOR`,
`RING_HP_ENEMY_COLOR`, `RING_MP_COLOR` = the bar gradients); the facing
chevron keeps the team colour, the gap + ticks + accent arc are off in
meter mode. `_updateDmgPreviewPlates` also drives `uPrev` / `uPrevHeal`
(the confirm-step forecast blinks on the ring). Unit entries expose
`entry.reticle` (`_reticleOfUnit(uid)`). Plate STYLES: `'bars'` (classic),
`'compact'` (`.tp-compact`, no bars, type chips in a row), `'side'`
(`.tp-side`: a white leader line `.tp-side-line` + the name beside the
ring at foot level, HP/MP numbers under it — the CSS2D anchor drops to
`po._footY`, `_writePlateTransform` pushes it right by
`SIDE_PLATE_OFFSET_TILES` × the projected tile width; the far-zoom card
always wins and returns to the head anchor). Real AND decoy plates wear the
style (`_plateStyleClass`, `_anchorPlateForStyle`, `_applyPlateStyleLive`).
Settings: map.js `window._buildVitalsLookHTML(refreshJs)` (Vitals: Bars on
plate / Rings at feet · Nameplate: Classic / No bars / Side line) rendered
in the pause menu (ui.js, under Nametags) and the main-menu Settings
Display group. Viewer-local cosmetics — nothing relayed (both online seats
read their own synced hp/mp). `npm test` runs `ring-vitals.test.js`.

## Adversarial continuation — 2026-09-11: magic helper ownership (local delivery)

Fresh complete main archive `2042f1062c480cf68d3d2ec70d6061f88d39df94`. Magic Circle, Magic Orb and Light Pillar return `_sigRunOwned` for refusal disposal. `_sigDisposeGroup` retains engine-shared Sprite geometry (`isSprite`) as well as `_ew_shared` geometry, while disposing instance materials and keeping cached textures. Preserve this rule when fixing remaining return-only consumers. 21 new tests pass (15 fail before); 12 supplemental real Three.js r128 object checks pass. Full suite 618 pass, zero fail, two existing skips; syntax 99/99. Complete files: ENTROPY_WARS_MAGIC_OWNERSHIP_FIXES.zip. Not deployed or browser-playtested. Next: Crescent Slash and Orb Burst, then six remaining return-only helpers; Psychosis has no direct timer in current source, so inspect its downstream helpers and subsequent Ego Death emissions. See the review plan's top entry for evidence limits.

## Adversarial continuation — 2026-09-11: Crescent Slash / Orb Burst (local delivery)

Refreshed full main archive `4f9e0fdcbd1fffa970b62a1127be7739f7e85169`; prior magic-ownership fixes are present in the repository. Crescent Slash and Orb Burst now return `_sigRunOwned`. Keep the slash main material's private smear-texture disposer (the echo shares that texture), Orb Burst's preallocation cap guard, and cached sphere/plane plus Sprite geometry retention. 22 focused checks pass (four fail before; 18 controls pass before/after). Full suite 640 pass, zero fail, two existing skips; syntax 100/100. ENTROPY_WARS_CRESCENT_ORB_FIXES.zip contains complete files. Not deployed or browser-playtested. Next: Neon Grid, Fractal Tunnel, Kaleidoscope, Spectrum Burst, Prism Refraction and Stat Rings, then downstream Psychosis/Ego Death ownership and VFX-04. See the review plan's top entry for evidence limits.

## Adversarial continuation — 2026-09-11: remaining six helper owners (local delivery)

Main still `4f9e0fdcbd1fffa970b62a1127be7739f7e85169`; continued cumulatively from local Crescent Slash/Orb Burst edits. Neon Grid, Fractal Tunnel, Kaleidoscope, Spectrum Burst, Prism Refraction and Stat Rings now return `_sigRunOwned`. No return-only `_sigRun` sites remain. `_sigDisposeGroup` deduplicates instance materials within each cleanup and reads `userData.wireMat` to retain ownership when wireframe edge construction yields no meshes. Bars/joints share one material; all current wireframe callers allocate per-effect materials. Keep cached texture, shared geometry and Sprite policies unchanged. 51 new tests pass with doubles AND real Three.js r128 objects; 27 fail before in both modes. Full suite 691 pass / 0 fail / 2 skips, syntax 101/101. ENTROPY_WARS_SIX_HELPER_FIXES.zip supersedes the Crescent/Orb zip and includes both tests and all eight helper fixes plus material ownership correction. Not deployed or browser-playtested. Next: downstream Psychosis and Ego Death emission ownership, then VFX-04; the semantic audit remains partial.

### 2026-09-11 — Ego Death / Time Rewind lifetime ownership

Main 8bc3bf594b79786a059c0dee77d008fdeec0270d includes the preceding six-helper package. Two Ego Death and four Time Rewind direct timer sites now use _fxDelay; delayed calls recheck spell-category and suppression gates. Preserve normal timings and particle-budget independence. 14 focused checks pass (eight fail before); full suite 705 pass / 0 fail / 2 skips; syntax 102/102. ENTROPY_WARS_EGO_REWIND_FIXES.zip contains complete files, not deployed or browser-tested. Next: Merkaba and following signature timer ownership, then VFX-04. See the review plan top entry for evidence limits.

### 2026-09-11 — adversarial Phase 6 spell dispatch (local delivery)

Pinned main: `82906801a763c0ce5fe943bdde48980d60ee7776`. AI stamp:
`v4.3-2026-09-12-spell-routing`. Hit a Lick (`steal`) and Purify
(`cleanseArea`) had scorer and target-picker branches nested under
`utility`, so normal spell selection skipped them. Both now dispatch at
kind level; missing targets score zero. Existing values and all execution,
resource, failed-action and online contracts are preserved.

`ai-spell-routing.test.js` executes production dispatch/candidate/executor
functions with canonical data and controlled board, damage and engine-call
doubles: 13 pass, 10 fail on the pinned baseline, three controls pass on both.
The champion source guard now requires direct dispatch and null guards.
Full suite: 720 total, 718 passed, zero failed, two existing skips. No browser
playtest, simulation, actual doSpell-effects validation or deployment.

`check-ai-spell-dispatch.js` inventories 501 canonical spells / 65 kinds.
It does not prove every utility ID or executor works. Remaining direct
scorer/picker gaps: guard/Trick Room. Prism self-casts have scorers and
no-target admission but no target coordinates for the generic executor;
inspect mirror ownership as well. Wide Plasma Cannon/Tsunami still use
spine-only AI geometry. The review plan contains evidence and the exact
next task: prism self-cast contract, then wide-beam direction/footprint.

Complete files: ai.js → R2, index.html → Render (shared token
`20260912-ai-spell-routing-01-cors`); tests, tooling and docs → repository.

### 2026-09-11 — Phase 6 prism self-cast contract (local delivery)

Baseline main: `043dede2ada453c7ccc9d022438988107eeba64a`; relevant Git blobs verified. AI stamp `v4.4-2026-09-12-prism-selfcast`.
Pulse Lattice and Tune Frequency return the caster as their target, supplying coordinates to ordinary execution and Simul conversion. Removed their no-target exemptions. Keep player-wide mirror ownership: `ownerUnitId` is only the placement-cap owner; the lattice intentionally aggregates `owner === unit.player`.
Canonical Tune costs 75 MP, so its score 12 is rejected under default MP weight; trained weight 0.1 admits it. Preserve this distinction when assessing reachability. Frequency-aware valuation remains open.
Twelve new production AI/real network checks pass; six fail on baseline. Full package script via bundled Node: 732 total, 730 pass, zero fail, two skips. Syntax 105/105. `doSpell` is doubled; no gameplay, simulation or live multiplayer acceptance. Simul conversion was source-reviewed.
Complete delivery: ENTROPY_WARS_PHASE6_PRISM_FIXES.zip. ai.js → R2; index.html → Render (`20260912-prism-selfcast-01-cors`); tests/docs → repository. Not deployed. Exact next task: wide-beam footprint/direction correspondence for Plasma Cannon and Tsunami, then guard/Trick Room and Tune valuation, then mode-aware endgame evaluation. See review plan for evidence limits.

### 2026-09-11 — Phase 6 wide-beam direction/footprint (local delivery)

Baseline main `3a00af7735cb8e96681bc1c771841794c85cb368`; relevant Git blobs verified. AI stamp `v4.5-2026-09-12-wide-beams`. Plasma Cannon/Tsunami side lanes now follow the spine's reach, engine width/diagonal offsets and side-cell passability. Shared AI footprint drives full-direction scoring, target discovery, hypothetical movement and cast-time re-aim. Return aligned aim coordinates plus a victim ID for Simul; never aim directly at an off-spine victim. Movement charges MP once and uses destination elevation. Shared narrow-beam direction valuation also uses total spell value; no tuning weights or online fields changed.
28 production AI/engine-footprint/Simul checks pass; 26 fail before. Full package script via bundled Node: 760 total, 758 passed, zero failed, two skips. Syntax 106/106. Damage, board and doSpell boundaries are doubled; no browser, simulation, performance or live multiplayer acceptance. Destructive wall-boring prediction and existing Simul null-re-aim fallback remain open; see the review plan for scope and evidence.
Complete delivery: ENTROPY_WARS_PHASE6_WIDE_BEAM_FIXES.zip. ai.js → R2; index.html → Render (`20260912-wide-beams-01-cors`); test and docs → repository only. Not deployed. Exact next task: AI-04b guard/Trick Room and Tune valuation, then AI-06 endgame evaluation. Phase 6 remains open; VFX work stays deferred.

### 2026-09-11 — Phase 6 utility contracts / Trick Room reset (local delivery)

Pinned main `844c4ba424963f301a0dd24e952f2ce08cc5838a`; nine relevant Git blobs verified. Added initial `_trickRoomRounds: 0` and clear it in the four match/roster data reset blocks in battle.js. An old cast can no longer reverse the next match's opening order through these blocks. Actual Blitz duration/order and host scalar serialization are preserved. No AI weights or relay changes; ai.js remains unchanged.
12 new focused checks pass; five fail before, seven controls pass before/after. Runs actual reset blocks/order builder/host serializer with controlled boundaries, not complete UI/map reset routes. Full suite via bundled Node: 772 total, 770 passed, zero failed, two existing skips. Syntax 108/108. No browser, simulation or deployment.
The utility diagnostic confirms null Chivalry/Trick Room targets, Simul comparator ignoring reversal, constant Tune scores and Pulse scoring independent of frequency despite distinct engine damage/effects. See the latest review entry for detailed contracts, evidence limits and residuals. Simul duration does reach common end-of-round upkeep; do not describe it as never decrementing. Chivalry transfers a raw hit to the guardian, not shield HP. Tune must compare the next frequency against the current one; Pulse/crossing/burn effects share the frequency.
Complete package: ENTROPY_WARS_PHASE6_TRICK_ROOM_RESET.zip. battle.js and state.js → R2; index.html → Render (`20260912-trick-room-reset-01-cors`); tests/diagnostic/docs → repository. Next: Chivalry legal-target/net-transfer scoring, Trick Room Simul/effective-speed contract and mode-aware scoring, then coupled Tune/Pulse valuation and AI-06. Phase 6 stays open; VFX stays deferred.

### 2026-09-11 — Phase 6 Chivalry landing prerequisite (local delivery)

Latest main `99ff7c86f82113cc46fa2aee6f3c43ca16cd0356` refreshed and changed files Git-blob-verified, including the new online snapshot-cycle regression. Preserved the current ID-only damage-source/safe-serialization fix. Chivalry interception now uses nearestWalkableZ at the ward's elevation and canOccupy3D before assigning x/y/z. It skips blocked or missing surfaces; if no adjacent landing exists, the existing in-place interception remains. No AI scores, weights, stamp, damage formula or new network fields changed.
19 new focused checks pass; 12 fail before, seven controls pass both. Tests execute actual interception/early immunity and landing predicates with board queries controlled, stopping before final damage arithmetic and rendering. Full suite: 794 total, 792 passed, zero failed, two existing skips. Syntax 110/110, 12 inline entry scripts clean, import map valid. No browser/simulation/deployment or live guest acceptance.
Complete package: ENTROPY_WARS_PHASE6_CHIVALRY_LANDING.zip. battle.js → R2; index.html → Render (`20260912-chivalry-landing-01-cors`); test and docs → repository. AI-04b scoring remains the exact next task: legal allies, corrected landing, guardian-specific net loss and kill risk, pledge replacement, ordinary/Simul execution. Interception runs before ward immunity checks; preserve that distinction in prediction. See review plan AI-04b-L2 for limitations. Phase 6 remains open and VFX deferred.

### 2026-09-12 — Phase 6 deadline and Simul correctness (local delivery)

Main tree `3aeb17bbc68def72faa5885617f921ee93c621cc` verified unchanged before/after. AI stamp `v4.6-2026-09-12-match-deadline`. AI urgency follows the actual clock/mode round cap, uses inclusive remaining rounds, distinguishes unlimited play/sudden death and no longer fabricates numerical advantage. Final-quarter/final-tenth thresholds remain an initial heuristic; lead/trail decisions are not implemented by this input fix.
Simul identity-tracked beams with no current target use one committed-resource whiff instead of casting at stale coordinates. Explicit tile shots remain unchanged. Simul resolution snapshots effective SPD once, preserving plan priority and initiative ties; logs use the same snapshot. Trick Room reversal remains open because its counter decrements at common order building: it needs round ownership, not a naive positive-counter comparator.
23 added regressions (20 fail before, three controls pass), focused 51/51; full suite 815 pass, zero fail, two skips (817 total); JS syntax 112/112 plus 12 inline scripts and import-map JSON. Controlled production function tests, not browser/simulation/live multiplayer acceptance. No deployment.
Complete package `ENTROPY_WARS_PHASE6_DEADLINE_SIMUL.zip`: ai.js and battle.js → R2; index.html → Render, token `20260912-ai-deadline-simul-01-cors`; tests, diagnostic and documents → repository. See latest review tracker for remaining Chivalry, Trick Room, frequency valuation and endgame/breach batches plus acceptance gates. Next: Chivalry net-interception scoring. Preserve unuploaded delivery on refresh.

## HQ PLATES = ROOM № · NAME · FUNCTION + THE BATTLE MARKER — added 2026-09-12
Every door / counter / room `label` + `sub` in `DOOR_HQ` (data.js) follows
ONE rule: the plate reads **ROOM № · one name · what pressing E does**
(RECEPTION → VIEW PROFILE, QUARTERMASTER → SHOP, RECORDS → CODEX, MEDICAL →
CHALLENGE MODE, bays → BATTLE MAPS, ring thresholds → BATTLE SITE, the
site room → BATTLE SITE · BAY n, every way-back door → BACK TO THE MAIN
HALL / BACK TO THE BAY, the console → BATTLE SETUP). No second titles,
departments or lore on a plate — lore stays in `desc`. A new door /
counter = a name + its function in `sub`, nothing else. **THE BATTLE
MARKER**: `hqSiteRoom` gives every playable site room a counter `battle`
at the board centre (`proc: 'battle_marker'`, `verb: 'BATTLE'`, `overlay:
'crossing'` — the same terminal as the console, post-match returns you
there); three-renderer.js `_hqBuildBattleMarker` draws the beacon on the
centre cell's top, `_hqTickWorld` spins it. doorhq.test.js checks both.

## THE ROUNDED HUD + THE PARTY DOCK — added 2026-09-12
**THE ROUNDING PASS** (hud.js `_injectHudHideStyles`, the block "THE
ROUNDING PASS" at the END of the injected stylesheet): nothing on the
battle HUD keeps a hard 90° corner any more — plates wear soft radii + a
bevelled rim, command rows are asymmetric BLADES (`.hrlg-body` 7px left /
15px right, the left spine still carries the function colour), chips are
pills, bars are capsules, the scoreboard plate (`.ew-score-plate`) and the
match-meta pill (`.ew-meta-plate`) are classes now (their inline
background/border stay in the JS), `ClipPanel` is a rounded plate
(`corner` = the radius), `UnitSprite` frames / turn chips / FrameCorners
round inline. The overrides live AFTER the rules they soften — restyle
there, never by re-editing the original blocks. The HP bar on the identity
column can NOT clip (the heartbeat trace escapes it) — the fill wears the
capsule itself. **THE PARTY DOCK** (hud.js `PartyRoster` → `PartyPortrait`,
CSS `.ew-party-*` / `.ew-pp*`): a bottom-right row of circular portraits
for the VIEWER's party (home seat via `unitHomePlayer` — a possessed body
stays in its owner's row, chained), each wearing HP (outer) and MP (inner)
as ring meters drawn in SVG (`_ppArc`: `pathLength=100` circles,
dasharray = the fill, rotation = where it starts; both transition on the
same curve so the arc's end stays pinned at 12). **The rings DEPLETE
CLOCKWISE**: the fill ends at the screen's 12 o'clock and the spent track
sweeps clockwise from it, like a cooldown — and the 3D reticle ring
vitals (`_reticleFragmentShader`, `frac = fract((ang − uMeterRot)/2π)`)
were flipped the same day to match (ring-vitals.test.js pins it). Shield
leads the HP fill in pale blue; `getPendingDamagePreview` blinks the
forecast slice; RenderBus `unit:damaged` blinks the face; the acting unit
wears a turning halo (`.active`), spent units dim, the fallen go grey
under a skull; click = `selectUnit`. Gauntlet reserves ride a pill strip
above the row; the dock is OFF on Mystery Dungeon floors (the SCANNER
owns that corner). Sits above the bottom-centre description bar at the
same lift as the Horologe rig, scales with `--ew-ui-scale`. Viewer-local,
nothing relayed (RULE #2).
**THE COLOUR PASS (same day, after the rounding pass in the injected
sheet)**: the violet-black chrome is gone — every Horologe plate (identity
column, header blade, mode strip, tool rows, item slots, command rows),
the scoreboard plate and the match-meta pill wear CLASSIC FF BLUE under a
bone-white double frame. The material is two tokens on `.hrlg-rig` /
`.ew-scoreboard` / `.ew-meta-plate` (`--ew-plate-bg`, `--ew-plate-edge`;
rows `--ew-row-bg` / `--ew-row-sel-bg`) — black or "none" is a one-line
swap there. The scoreboard's inline `EW.panel` background is beaten with
`!important` in that block on purpose. Every blade carries `data-bid`
(its id) so the ROOT VERBS wear their own colour (MOVE teal · ATTACK red ·
ABILITIES blue · COMBO violet · ITEMS green · GUARD amber · SWITCH orange
· END / CANCEL red via `.danger`); spell rows keep `catVars`. The
SELECTED row (cursor / hover / the armed verb in a dimmed parent) turns
GOLD (`--ew-sel`): text, glyph and frame, the blue fill lifts. Restyle in
that block, never upstream.
**HUD THEMES (same day)**: the material is a TOKEN SET on `:root`
(`--ew-plate-bg/-edge/-seam/-rim/-lip/-scan`, `--ew-head-bg/-ink`,
`--ew-row-bg/-sel-bg/-edge/-lip`, `--ew-ink/-mute/-dim`, `--ew-hair`,
`--ew-dead-*`, `--ew-sel/-soft/-faint`, `--ew-tshadow`, `--ew-drop`) and
a THEME is one `:root[data-hud-theme="<id>"]` block overriding it. hud.js
`HUD_THEMES` (crystal = Classic Blue, the default and the bare `:root`
block · void = the old violet-black · onyx · leather · parchment (light,
umber ink, dark-gold select) · glass); `window.getHudTheme /
setHudTheme / applyHudTheme` (localStorage `ew_hud_theme`, applied at
script load as `data-hud-theme` on `<html>`, live — no rebuild). The
scoreboard / meta pill write their inline ink through `EW_T` (`var(--ew-
ink…)`) so a light theme darkens it; `EW.time/space/chaos` stay literal.
Picker: map.js `_buildHudThemeHTML(refreshJs)` under the Vitals row in
BOTH the pause menu (ui.js) and the main-menu Settings Display group.
Adding a theme = one `HUD_THEMES` row + one token block;
`hud-theme.test.js` ties catalogue ↔ blocks ↔ picker ↔ scoreboard ink.

## THE MISC KIT + MODEL_INDEX.md (the moving-maps model batch) — added 2026-09-12
28 Meshy GLBs the user uploaded to R2 `Assets/misc/` now stand on the
three travellers, the wheel / rise maps, D.U.M.B., the Cannonball spell
and Room 247. **`MODEL_INDEX.md` is THE register of every 3D model family
(kind · bucket · loader · every place it stands) — update it in the same
delivery as any model change; misc-models.test.js checks the batch is
named in full.** Renderer: `_MISC_GLB` (three-renderer.js) holds the
filenames (the facing of each measured off contact sheets is in its
comment) and **`_hzMiscKit(key, { tiles | metres, fit, yaw / tilt / roll
(pre-turn the MODEL so the caller's rotation.y keeps its meaning), hang
(top at y = 0), sink, lift (the bake as emissive — night / space maps),
cast, foot (collision disc in metres for the site room), low: 'skip'
(pure scenery skipped under EW_PERF_LOW), fallback })`** places one.
GLB-first builders keep their names with a `…Proc` fallback:
`_hzTrilithon`, `_hzBabelCrane`, `_hzBlastDoor` (= the bank vault; the
`blastdoor` monument too), `_hzGhostShip`; `_hzSaucerLanded` is Area 51's
craft on its gear (the flying `_hzSaucer` stays the horizon's). Settings:
the Dutchman (rail cannon ×8 `yaw π/2` outboard, the helm, the anchor, the
chest, yard lanterns, the towed rowboat, two kraken arms off the port
quarter), the Derelict (nacelles `yaw π`, the mast dish, the docked escape
pod, the torn plate at the breach, a dead astronaut adrift, the docking
collar), the Looking-Glass (teapot, cups, caterpillar, flamingo, the open
watch on the rim), Stonehenge (the standing-stone bluestones). Rosters
`sea` / `wreckage` / `wonder` carry `_hz*Far` GLB rows (kraken, shark,
palm isle, pod, astronaut, docking ring, hanging watch, teapot, cups,
flamingo, caterpillar-on-mushroom). three-vfx-effects.js `_WPN_MODELS.
cannon` (misc-bucket `url`, `tweak ry π`) is the Cannonball's gun,
GLB-first in `_sigCannonShot3D` (the carriage materials are made only on
the procedural path). `DOOR_HQ.catalogue` entries may carry **`base:
'misc'`** (`_hqModelUrl`) — the two pocket watches in the clock room.
Wish-list (still procedural): the Staunton set, a galleon hull with a
figurehead, card soldiers, a cryo tube. Measure a new GLB before wiring
(PLAYTEST_NOTES "Rigged 3D unit models" has the parser; a Playwright
contact sheet with an AxesHelper settles the facing in one look).

## 7.6 WAVE 1 — THE SIX NEW SITES (HQ plan 7.6) — shipped 2026-09-13
Six launch maps in one delivery, each the plan's 7.10 checklist end to end:
**13 · THE HAUNTED HOUSE** (`prebuilt_haunted`, Terrestrial, `near:
'haunted'`; the gothic point of entry — ghost / werewolf / vampire /
ghoul), **33 · THE LODGE** (`prebuilt_lodge`, Terrestrial, indoors,
`near: 'lodge'` w 3.4 h 3.6; politician / general / marksman), **0 · THE
SINGULARITY** (`prebuilt_singularity`, CELESTIAL — the Quarantined bay is
sealed and a map must be playable, the E4 precedent; watcher / cosmic
wraith), **6 · SATURN** (`prebuilt_saturn`, Celestial; grey / black goo),
**21 · THE STRIP** (`prebuilt_strip`, Urban; conspiracy theorist / honda
civic) and **1954 · DOWNTOWN** (`prebuilt_downtown`, Urban, `leaf_glass`
— doorhq.test.js rations `leaf_revolving` to Bay 5; superhero / antihero
/ zombie / king kong). The full builders sit in a "7.6 WAVE 1" block right
before the DELTA FORGE banner in data.js, the Δs before the META banner,
the near builders before the MOVING MAPS block in three-renderer.js.
Rules that came with it: a full map's thin walls are `M.wall` (`see:
true` = a window: blocks walking, not sight; `sym180` mirrors walls —
author rows 0..7 ONLY, a row-8 edit is overwritten by the mirror); a Δ
never holes (the Singularity's void is a depth-2 `M.lake`); a +2 block
beside a spawn tile is clamped and fails the forge test; the 2×1 dumpster
mirrors by hand (`(4,3)-(5,3)` ↔ `(10,12)-(11,12)`); a site's flavour
props must sit inside its room (half = 4 + pad·… — the test says "in a
wall"). `env.ambience` on a meta row names a still map's bed (audio.js,
read after the moving-map rule). check-data-parity.js #6 now diffs
server.js `MAP_POOL` against EW_MAP_META (ids · sizes · team) — a new map
without its two pool rows fails `npm test`. delta-maps.test.js expects 38
Δ boards. Unseen live (RULE #1c): eyeball the house's windows, the eye over
the Lodge, the Singularity's drop, Saturn's ring plane, the Luxor's scale,
the collapsed tower. Full log: DOOR_HQ_BUILD_PLAN.md §9 (2026-09-13 wave 1).

## THE SPACESHIP (was THE DERELICT) + THE CARGO STACK + MOVING MAPS rev 3 — 2026-09-13
`prebuilt_derelict` (the id, the `near: 'derelict'` key and every builder
name STAY) is labelled **Spaceship** everywhere the player reads it: the
meta row, both forge builders, the race home-site table, Room 426's sign.
The deck is plain brushed **`aluminium`** (base / deltaPad / the doorway
tiles / finishSpawns / the site room's floor + apron, tint `#8e98a2`) —
the `metal_3` grate was too busy for a floor; the bulkhead stubs stay
gunmetal. The fuselage (three-renderer.js `_NR_BUILDERS.derelict`) wears
the same sheet at a coarse repeat (`HULL_UV` 0.7 × HZ_TEX_DENSITY → one
texture per ~3 tiles: grain, not tiles), FRAME RIBS at every other
station (thin dark `_nrLoft` bands proud of the skin, `_ew_occSkip`) and
four flank hatches — plain with a little texture; swap the key in the two
`K.mat('aluminium'` / `_hzTex('aluminium')` sites if the sheet reads
wrong live. **THE CARGO STACK** replaces the specimen tanks on this map
only: monument kind `cargo` (three-renderer.js `_hzCargo` — three strapped
freight crates on a pallet, corner frames, a hazard band, a status lamp;
authored at exactly 1 × 3 tiles), a GRID monument `[1, 1, 3]` in map.js /
three-renderer.js `_MON_GRID` + delta-maps.test.js (a full-height wall,
the same collision the tank had), in `MF_DELTA_SOLID_MONS`, in the editor
catalogue (📦 Cargo Stack). `greytube` is untouched for Area 51 / D.U.M.B.
**Rev 3 pace**: the travellers run 5 / 6 / 5 tiles/s at round 1 with a 7×
cap (Dutchman `ramp` 0.4, Spaceship 0.45, Looking-Glass 0.4); Stonehenge
2.4 / Area 51 4.0 (wheel), Hell 1.6 / Babel 1.8 (rise), caps 5–6; Heaven's
drift unchanged. motion-maps.test.js insists on ≥ 5 / ≥ 7. Screenshotted
offline (every CDN is egress-blocked in this sandbox: a scratch variant of
playtest_maps.js served three / React / MeshLine / socket.io from
node_modules and the scripts from the repo — geometry only, no textures):
the ribs, the hatches and the stacks render, zero page errors,
`ThreeRenderer.motion()` eased to 5.3 tiles/s at round 1. The textures
themselves are UNSEEN — the user eyeballs the sheet live.

## SHARED-TILE TARGETING + STRUCTURE FACING — added 2026-09-13
A flyer can hover over a ground unit in ONE column. A board click carries
the flyer's own z only when the pointer hit its sprite; a click on the
tile resolves to the SURFACE z and `unitAt(x, y)` prefers the ground
unit — so attacks / casts at the wrong body, "can't target" bounces and
AoE whiffs. ONE rule now: battle.js **`resolveUnitInColumn(actor, x, y,
z, { side: 'enemy'|'ally'|'any', inRange? })`** (right before
`_structureAt`; global) — the exact-z unit when it suits the action, else
the best other unit in the column (right side, then in reach, ground as
the tie-break), else the click as it came. Readers: `doAttack`
(`_clickedTarget` = the pick; **`z` is re-assigned to the pick's z** so
range + every later `unitAt(x, y, z)` agree), `doSpell` (unit-targeted
kinds only — tile / directional / self / phase-2 casts keep the click;
side from `_kindMeta` offensive / allyOnly, twoClick = any), `doItem`
(potions ally, banes enemy), the confirm gates `_spellTargetTeamOk` /
`_itemTargetTeamOk`, ui.js `getPendingDamagePreview`. Never add another
`unitAt(x, y, z) || unitAt(x, y)` at a unit-targeted site — call the
resolver. `_applyAoeDamage` and the combo `aoe` burst hit EVERY enemy in
a tile's column (`filter`, not `find`). FACING: every structure branch of
`doAttack` (Cube / turret / mirror / deployed object / seed / tree chop /
terrain smash) calls `setUnitFacing` after its `pushUndoSnapshot` — the
attacker squares up on the Cube like on a unit. Overwatch turns the MOVER
when the shot FIRES and its delayed impact passes `keepFacing: true` to
`applyDamageToUnit` (the whip-around's opt-out) — the impact used to land
~0.7 s later and spin a unit that had already squared up on its own cast
target. `npm test` runs `shared-tile-targeting.test.js` (the resolver in
a vm sandbox + source guards).

## THE CAPSTONE PASS + THE CHARGED CAST — added 2026-09-13
**Why Charged_Spell_Cast was rare**: sprites.js `UAL_SLOTS.castAOE` was
the only slot on the clip and `classifySpellAnimKind` reached it only for
`/horde|stampede/` and the terrain-raise words — every other big magic
EVENT played the one-arm bolt push (`castMagic`). Now: **`castUltimate`**
(same clip, ts 1.6 → 1.69 s, `strikeAt` 1.90 = the arms-to-the-sky beat)
+ `_castChainFor('ultimate')` → `['castUltimate','castAOE','castMagic',
'cast']` (three-renderer.js); `classifySpellAnimKind` returns
**`'ultimate'` for every CAPSTONE** (`_isCapstoneSpellForAnim` → data.js
`isCapstoneSpellId`, `tier: 'III'` when data.js is absent) unless it is a
weapon / adjacent physical strike, a gun, a move kind or a single-target
heal; and **`'aoe'` for every big magical event** (aoeRadius ≥ 2,
barrage / aoePull / delayed / summon / storm / zone / terrainCreate /
healAll / warCry kinds, a line with `lineWidth` ≥ 2). Fixed on the way:
`/arrow/` caught MARROWstorm (now `/(^|[^m])arrow/`), quake / tremor
slam, the horde rule promotes a capstone. **`isCapstoneSpellId(id)` /
`capstoneSpellIds()`** (data.js, on `window`): ring 3 of
`buildTreeRingIndex` — the r4★ of every RACE_TREE / CLASS_TREE pillar,
both alternates of a twin capstone, Nuke included (it sits on no lower
ring); cached, `applyTreeRingCosts` drops the cache.
**THE VFX** (three-vfx-effects.js "THE CAPSTONE PASS" section, right
after the pass-3 END marker): `_isCapstoneSpell(id, def)` →
`_stageWeight` promotes every capstone to the **`ultimate`** staging tier
and `_stageBurst` adds **THE CAPSTONE BLOOM** (`_sigCapstoneBloom3D`: a
sigil disc + a thin light column in the archetype's colours — the shared
"this is an ultimate" stamp on top of the spell's own recipe; damage
bursts only). Bespoke signatures: **`_sigTsunami3D`** (the beam def flag
`beamTsunami` — `_fireBeamMapped` routes it like breath / boomerang; a
lofted curling WAVE WALL `lineWidth` lanes wide rises behind the caster,
rolls the spine, washes every lane tile, crashes on the last tile and
recedes — Tsunami was a byte-copy of Water Pulse), the breath rig's
**`breathScale` / `inhale` / `firestorm`** (Dragonfire = the INFERNO at
1.7× with `_sigFirestorm3D` at the far end; Dragon Breath r1 keeps a
plain `raceDragonBreath_beam`; Atomic Breath / Hellmouth grew),
`_sigFaeRing3D` (the ring of toadstool lights; `EFFECTS[x].geom3D: true`
on an aoe def makes `fire('aoe')` run the registry beside the recipe —
the aoe intent never reached it before), `_sigCataclysmMark3D` (`:mark`,
the burning crown) + `_sigCataclysmDecree3D` (fires from the descent
pipeline at detonation), `_sigDrainingEmbrace3D` (the crimson wings),
`_sigCrusade3D` (the cross of light). Registry entries are written with
`Object.assign(_spell3DGeometry, {…})` — party-builder.test.js counts
`_spell3DGeometry[` reads. Data-only recipes gave the HITCHHIKERS their
own look (Glitter Bomb, Snowball Volley, Artillery Strike, Terror Pounce,
Hallelujah, Dragon Breath) and every theme-fallback capstone an identity
(Supernova, Singularity, Marrowstorm, Eternal Slumber, Baphomet's Rite,
Fire for Effect, Indomitable Will, Awakening, Overtinker, Colossal Crush,
Sasquatch Smash, Crusade). RULE #2: everything rides `fire()` /
`fireGeometry` — and **online.js now relays `fireGeometry`** through the
`vfx3d-x` sibling wrapper (`fireGeometry: [[1, 2]]`), so every `:mark` /
`:dash` / end-of-round apparition reaches the guest (they were host-only).
`npm test` runs `capstone-vfx.test.js`: the capstone set, the slot + chain
+ classify rules, the hooks, **no capstone shares an effect id with a
sibling on its pillar**, every capstone has an identity (a map row, a
geometry, a CINE_SEQUENCES director, or a kind whose travel is the
signature). Smoke-tested headlessly with real three r128 (a scratch
harness; not a playtest) — the LOOK is unseen: eyeball Tsunami, Dragonfire,
Fae Ring, Cataclysm Decree, Draining Embrace, Crusade live first.

## THE CRATER FIX + THE WADE (the roofed-over crater) — 2026-09-13
Two "my unit is under the floor" bugs, one delivery. **BATTLE**: THE
WORLD's ground disc (`_worldBuild`, `world:ground`; the moat maps'
`world:liquid` disc too) was a FULL circle 2.5 px under the base tile
tops, spanning under the whole board — so every tile dug below the base
(Meteor's `terrainDeform`, the Build dig, Flat Earth) was ROOFED OVER: the
engine had the crater, the unit dropped into it, the eye saw a flat board
with the unit under it. Now `_wdIslandDisc(K, R, ts)` = the disc with the
BOARD FOOTPRINT (`K.BX0..BX1 × BZ0..BZ1`, grown 2 % of a tile) cut out
(a `THREE.Shape` with a hole; the board's own voxel columns fill that
footprint to y 0 and their faces are the crater's walls; the apron covers
the seam). RULE: nothing of the world / a setting may lie under the tiles
inside the footprint — a crater must always open onto the columns' own
faces. world-ground.test.js fails on a `CircleGeometry` under the island.
**HQ**: `_hqSurface` dropped the walker to a walkable LIQUID cell's BED
(a lake: −1.75 m; deep: −3.5 m) under the sheet drawn at −0.3 m — the
walker vanished under the water. Now a fluid cell (the moat included) is
WADED at `HQ_WADE_M` (0.55 m — thigh-deep, always visible); a dry pit (a
trench) is still a drop to its floor. doorhq.test.js guards it.

## THE WORLD — grounded ↔ floating (the horizon pass) — added 2026-09-13
Every Δ board used to end at its square apron in the sky. Now a map's
**`env.world`** row (data.js EW_MAP_META, all 32 launch maps; the doc
comment above the table lists the fields) continues the SETTING to the
horizon and lets ENTROPY take it apart — three-renderer.js **THE WORLD**
block (right before `_buildHorizonScenery`): `_worldBuild(nearCtx)` runs
at every `scene.add(_horizonGroup)` site AFTER the near builder (it reads
`_nrLastKit`, which `_nrApron` / `_nrMoat` now stamp with `tex / color /
skirt / skirtColor / moatPad / moatDepth`) and builds into `_horizonGroup`
(**never give that group a `renderOrder`** — a Group's order buckets its
children before the dome, whose depthTest is off, and the sky paints over
them; that cost an hour). Pieces: **the ground** (`kind: 'plain'`, a disc
in the apron's sheet 2.5 units under the apron top; a moat map gets a
LIQUID disc under its sheet first and the land from the SHORE = apron +
pad outward with a BANK; `sea: true` = the liquid to the horizon), **the
haze** (`_wdInject` = a Lambert `onBeforeCompile` chain: radial fog
toward the dome's own `uFogColor` from `fogR0` (shore + 3) to `r` (56
tiles), tagged `_ew_hzNear` so `_applyHorizonFog`'s altitude fog leaves
it alone), **the rim** (`_WD_RIM` builders on `_wdRing` circles — peaks
(`mesa`, `snow`) / hills / dunes / trees (`_nrTreeProc`, never the OBJ
swap) / town (`_nrHouse`) / city (+ glow sprites in `_wd.extras`) /
spires / bergs / ruins / pyramids / craters; `K._wdMinD` = the shore + 2
keeps every one out of the lake; a peak's radius is ≤ 0.3 × its ring
radius — fatter and they carpet the ground), **the wall** (`kind:
'cavern'` + `wall`, a ruffled cylinder fading UP into the haze, `mode
1`), **the root** (`_wdBuildRoot`: a superellipse lathe under the apron
in the skirt's sheet darkened ×0.62 + stalactites, `root: false` under a
hull; on a moat map the island is its SHEET, so the root spans apron +
pad and hangs from `moatY` — the player's eye never goes under the tile
tops (three-camera.js FLAT FLOOR), so it is seen at grazing angles only). **THE
DISSOLVE**: `_wd.stab` (1 grounded → 0 adrift) eased in `_worldTick`
(called in `_updateEnvironment` right after the horizon build, i.e.
after `_applyDomeFog`): the world beyond `uWdKeep` is `discard`ed per
fragment with an fbm edge that burns in the gauge's violet, veins crack
the ground inside it, the root grows down, and the dome's fog is driven
to FULL at / below the horizon (`uFogAmount → 1`, `uFogTop → fogTop`,
band = top — the retro filter's fog too) while the ground holds, so the
ground's far edge and the sky are one colour. Target = `mode`
(`ThreeRenderer.getWorldMode / setWorldMode`, localStorage
`ew_world_mode`, `window.EW_WORLD_MODE`): **entropy** (default — 1 − the
fuller team's `state.entropyGauge`, cracking from 12 %, adrift at 96 %,
reforms after the strike resets it; the gauge SYNCS, nothing relayed,
RULE #2) · **grounded** · **floating**; `kind: 'void'` (Heaven, the
Spaceship, the Looking-Glass) never grounds, `kind: 'room'` (D.U.M.B.,
CERN, Backrooms) is inert. Settings row "World" (map.js
`_buildWorldModeHTML`, pause menu + main-menu Display). Dev:
`window.EW_WORLD_STAB = 0..1` pins it exactly; `ThreeRenderer.world()`
reads stab / keep / the fog uniforms; `hq.dev.renderer()` = the WebGL
renderer for shader diagnostics. The wheel-zoom floor is **0.3** now
(state.js ×3; the world runs out at 56 tiles). `npm test` runs
`world-ground.test.js`. Screenshots: `node playtest_world.js <map…>`
(repo tooling; CLEAN=1 = no retro filter; POSES / STABS / EXPERIMENTS /
PROBE_EVAL — see PLAYTEST_NOTES "THE WORLD") — every CDN is blocked
here, so it serves the repo scripts, node_modules copies of three /
React / socket.io / MeshLine and GENERATED stand-in textures coloured by
file name; the real sheets are unseen — eyeball live first.

## BASIC ATTACK DELIVERY + THE LEAP (charges and strikes respect elevation) — 2026-09-14, local delivery
The fist sprite (`_PROJ_SPRITES['attack']` = proj_human.png) is RETIRED for
basic attacks. battle.js (the block right after `_unitAttacksWithClip`):
**`basicAttackKindOf(unit)`** = ONE kind for the clip AND the delivery —
the gun / psychic JOB KITS first (`BASIC_ATTACK_JOB_KINDS`: Gunslinger ·
Sniper · Agent → `ranged`, Psychic → `magic` — a Gunslinger of any race
shoots, that IS the job), then the 3D def's authored `basicAttackKind`,
then the mage jobs (`BASIC_ATTACK_MAGE_JOBS`), then
**`BASIC_ATTACK_RACE_KINDS`** (the sprite-only / kind-less races: cowboy ·
marksman · general · men in black · gangster · martian · mad scientist ·
ai · android · droid = `ranged`; ice queen · seraphim · watcher · occulus ·
shadow entity · siren · chosen one · symbiote = `magic`; voidweaver =
`throw`; the brutes = `punch` / `claw`), then reach (> 1 = `ranged`).
`_attackAnimKindFor` reads it (no more reach-by-distance clip choice).
**`basicAttackDelivery(unit)`** → `{ mode: 'shot' | 'leap', kind, bolt,
proj }`: `magic` / `ranged` / `arrow` / `throw` SHOOT (a gun = the
`_bolt_bullet` muzzle flash + the spinning `proj-bullet` round; magic = a
typed ORB, `BASIC_ATTACK_ORB_BOLTS` by `unit.types[0]` — divine / unholy /
tech / alien / psi / ki; a bow = `_bolt_arrow`; a thrower = the race's
`projectileClass` prop, the football / the spider); EVERYONE ELSE LEAPS
at ANY reach (a high-ground brawler striking two tiles down leaps down
and swipes — it used to lob the fist). **`playBasicAttackShot(unit,
target, delivery, flyMs)`** fires the shot (wrapped in online.js → relay
`basic-shot`, the guest replays it fog-gated on either end — playProjectile
itself was never relayed). **`_meleeStrikeAnim(unit, tx, ty, { clip,
strikeLeadMs, leapMs, targetId })`** is the ONE melee strike (doAttack,
the Echo Band re-strike, the counter, the follow-up, the Chivalry
guardian): a rigged model LUNGES `stopShort` of the victim (0.45 tile
adjacent, 0.9 = the adjacent tile from farther) and HOLDS beside it while
its attack clip swings (`animateStrikeLeap`'s `clip: true` builds the
on-arrival `triggerAttackAnim`; the hold = the strike lead + 260 ms; the
in-place clip is gone), a sprite jumps onto the tile as always. doAttack's
`impactDelay = projectileDelay + actionMs(_leapMs) + _meleeLead` (leap 260
ms + 110 per tile beyond the first). The `strike-leap` relay carries the
opts (primitives; the guest calls the UNWRAPPED `window.animateStrikeLeap`
so the clip flag rebuilds its callback). **THE LEAP (three-renderer.js)**:
`startDisplaceTween` vaults when the from / to surface differs by ≥ half
a level, or on `opts.leap: true` (the charge-to-target spells —
`_runChargeToTargetSpell` and the `_runPostEffects` hop pass it through
`animateDisplacement`), never on `opts.leap: false` (a knockback stays a
shove): the body runs the flat part on the FROM surface and vaults the
last ~1.4 tiles on a parabola whose apex clears the higher surface
(`tw.leap`); a polyline slide HOPS every segment that steps a level
(`tw.hops`); `tw._air` = the clip picker plays `jump`; the landing arms
the jump tween's squash + a puff. `startStrikeLeapTween` takes `stopShort`
/ `targetId` (the landing height is the VICTIM's surface — a flyer, a
roof), the arc clears the higher end, `tw._phase` (0 leap / 1 hold / 2
return — the picker plays `jump` in flight and `idle` under the one-shot
on the hold), rigged models get the jump squash & stretch. `npm test` runs
`basic-attack-delivery.test.js` (the classifier + the shot helper in a vm
sandbox, source guards on every site + the relay). UNSEEN LIVE (RULE
#1c): the vault's height against a 3-level cliff, the hold's timing
against long swing clips, the orb colours per type, the guest's leap.

## THE DIRECTOR'S PASS — the spell camera (2026-09-13, local delivery)
Three things in battle.js's SPELL CINEMATICS block + playDetonationCinematic.
**THE BOARD-AWARE RIG (the beam edge bug)**: a beam ending at the rim put
the reel's end-cap pivot 0.8 tiles PAST the victim and the eye 2.6 beyond;
off the board `_camGroundPx` answered 0, so on a raised board the rig's
flat floor sat under the map and the frame was the strata. Now
`window._camGroundPx` clamps every lookup to the nearest edge tile,
`_cineTpsAnchor(pos, unit, { liftPx })` clamps the pivot's ground read
(`_cineClampTile`) and takes an explicit pivot height, `_cineEdgeRoom(x,
y)` = tiles inside the rim (negative past it), `cineEndCapReverse` keeps
its pivot on the victim's tile and becomes THE HIGH REVERSE (shorter boom,
craned down) when there is no room past the rim, `cineSideDolly` scores
both perpendiculars by where the EYE lands and takes the inside one, and
`_cineYawTowardBoard(center, yaw, boom)` turns any strike-tile yaw whose
eye would hang over the apron. Any new shot near the rim reads those.
**THE SNIPER KIT** (`CINE_SEQUENCES._sniperKit` — headshot / precisionShot
/ deadEye / kneecapShot / railgun): `cineSniperPov(caster, target, { fov,
zoomMs, squint })` = FIRST PERSON — ThreeCamera's `cam._fpEye` branch
(Strike Mode's rig) with the shooter's model hidden (`window._ewFpHideUid`),
the gaze slope-aimed down the line, the lens zooming by FOV
(`_cineFovTween`, the dolly-zoom's base/restore) and THE EYELIDS
(`cineEyelids(ms, { amt, closeMs })` / `cineEyelidsBlink` /
`cineEyelidsClear`; styles-cinematic.css `.cine-eyelids`) closing to a
slit round a reticle; the shot blinks them, `_cineFpRelease()` hands the
eye back (the sequence, `camera._apply`'s rig auto-release via
`_cineFpOwned`, and `_cineReleaseAllFx` all call it), then the bullet cam
and a freeze on the victim. Never over Strike Mode (`_shooterCamOwns`).
**THE FLYOVER STRIKE** (Nuke / Artillery Strike are DELAYED spells — the
cast is a mark, the camera is `playDetonationCinematic` at the end of the
round): `VFX.getDescentFlyover(id)` says a craft flies it in → `cineFlyBy`
(level lens at 3.2 tiles over the strike tile, span 11 — the VFX flies its
craft ACROSS THE SCREEN, now on the horizon line: `fo.ndcY` 0.1 in the
three flyover defs) → `cineFlyByTrack` (the VFX publishes its real path in
`window._ewDescentCine`; the frame pans at 0.35× its speed) → `cineFallFollow`
(`_cineTweenLift` rides the pivot from the jet's altitude to the tile,
easeIn, tilt 90 → 56; the warhead now DROPS FROM THE JET — `fromZ` in
`_fireDescent`, and the three flyovers are retimed `delayMs` = telegraph −
duration/2 so the craft is overhead at the release) → the blast reverse +
the Nuke's whiteout / bone-desat. Meteor-class delayed strikes (no craft)
get `cineSkyWatch` (look UP into the airspace at the release, pitch DOWN
with the fall); cast-time descent spells with no director get the same
through `_cineApplyFamily`'s sky-fall branch (`shotOpts.descentCam`, now
relayed). RULE #2: online.js wraps `window.playDetonationCinematic` (relay
`det-cine`, guest fog-gated) and carries `descentCam`. `npm test` runs
`spell-camera.test.js`. **`node playtest_spellcam.js`** (repo tooling, see
PLAYTEST_NOTES "THE SPELL CAMERA PROBE") casts any spell between two
teleported units offline and samples the rig; `FREEZE_AT` photographs a
beat. Unseen live: the jet under the level lens, the eyelids' paper feel.

## THE VIEW SIZE THE BATTLE OWNS (nameplates / Cube bar / nexus bars offset) — 2026-09-14, local delivery
The shared renderer is sized by THREE owners: the battle (`renderFrame`'s
resize block → `renderer` + `ThreeCamera.resize` + `ThreePost.resize` +
`css2dRenderer.setSize`), the main-menu scene (`_menuEnter` → the canvas to
`#menuStage`) and the HQ (`_hqEnter` / `_hqFrame` → `.hq-stage`). The
battle's block used to key on the CANVAS BUFFER alone, so when a host had
already sized the canvas to `.map-center`'s exact pixels (the menu scene
on a full-window layout) the battle never re-applied its size: the camera
kept init's 960×540 aspect and the CSS2D renderer kept init's 960×540
half-sizes — every nameplate, Cube bar and nexus bar landed at 0.6× toward
the top-left (Play → VS CPU; a site room's BATTLE marker was fine because
`_hqEnter` had sized the CSS2D layer to the full window). Now three-
renderer.js keeps **`_viewW / _viewH`** = the size the BATTLE last applied,
the block re-applies when `.map-center` differs from THAT (or the buffer
drifted — `Math.floor(w × pr)`, what setSize writes, so a fractional
product no longer resizes every frame), and `activate()` resets it so the
first battle frame always re-applies. init sets the overlay's `cssText`
BEFORE `setSize` (the assignment wiped the px size). RULE: anything that
sizes the shared renderer for another host never touches the battle's
record — the battle re-derives it on activate. Measured headlessly with a
scratch probe (CSS2D transform ≡ the plate's projected position on both
launch paths at 1600×1000); the look live is unseen (RULE #1c).

## THE DOOR-KIT BATCH + THE SURROUND (the frame fits the leaf) — 2026-09-14, local delivery
Fifteen files the user uploaded to R2 `Assets/door/models/` (MODEL_INDEX
§3b): eight AUTHORED doors (not Meshy — real scales, several meshes,
filenames WITH SPACES: `_hqModelUrl` encodes them) and seven props. **The
leaves** (data.js catalogue `leaf_beige_wood` / `_white_wood` / `_coffee`
— one model, three finishes, edge-on `yaw: 90`, hinge right; `leaf_wooden`
— 11 MB, its own frame, hinge left; `leaf_birch_glass` / `_orange_glass` —
`yaw: 180`, hinge left; `leaf_window_large` / `_window_medium` /
`leaf_entrance` — 2× life size, fitted) hang on nine doors: the Haunted
House, Shasta, the Vatican, the North Pole, Area 51 and Downtown
thresholds, the Barbershop (+ its way out), Reception, Bay 7. The hinge
sides were read off the GLBs' hinge / handle NODES (scratch tooling;
`node --check` only — the swing is unseen, RULE #1c). **THE SURROUND**:
three-renderer.js `_hqDoorSurround(ow, oh, cat, mat)` (right before
`_hqBuildDoors`) stands a wall-textured plate in the recess in front of
the black beyond, CUT TO THE LEAF'S SHAPE — catalogue `shape: 'circle'` +
`hole` (the disc's share of the opening: `leaf_vault` 0.64 — a round door
proud of a dark square plate, the plate now hides behind the wall;
`leaf_bulkhead` 0.96), `shape: 'arch'` + `arch` (the cap's share of the
height: `leaf_portcullis` 0.42, `leaf_hell_arch` 0.34), else the opening
inset 1.5 % (a stop, never a black sliver). The leaf fit is edge to edge
now (`frame: true` leaves overlap the jambs by a few cm; a bare leaf stops
1 cm short; the 8 cm of black over every leaf is gone). Measure a new
leaf's silhouette before giving it a shape (PLAYTEST_NOTES has the
scratch rasteriser recipe under "THE DOOR-KIT BATCH"). **The props**:
`computer_chair_blue` / `_grey` (16 MB each — the hall's conference table
+ cubicles, IT, Records, the Clock Room, Medical), `security_camera`
(wall, `mount` 2.55: the hall over Reception + the vault, IT, the
Interrogation Room; Downtown's `_hzSecurityCam` head is GLB-first over
the box), `utility_box` (URBAN settings through `_nrProp` +
`_hzDoorKitGLB`: Cyberpunk, the Strip, Downtown, Nuketown, the Stadium —
the site rooms inherit them, `foot` 0.45 blocks the walker),
`asteroid_a` / `asteroid_b` (`_hzAsteroidFar` in the `space` + `wreckage`
rosters, GLB-first over `_hzAsteroid`; the celestial site rooms' skies
too). `_hzDoorKitGLB` grew `unlit` / `lift` / `low: 'skip'` / `fit`.
None of the seven prop GLBs is in the repo — their `h` / `span` are
targets; if one lands wrong, that field is the edit. `npm test` runs
`door-kit-batch.test.js`. UNSEEN LIVE (RULE #1c): every new leaf's face
and swing, the camera's authored facing (a photo camera would want a desk,
not a wall), the chairs' scale, the asteroids' size against the planets.

## THE FREELANCER = TWO SOCKET RACKS + THE HOMOSAPIEN TWINS — 2026-09-14, local delivery
The Freelancer's three fixed spells (`improvise` · `jackOfAll` (Pep Talk)
· `reallyGoodPunch`) are HOMOSAPIEN RACE ABILITIES now (data.js
`RACE_ABILITIES.homosapien`, same ids — saves keep working; they left
SPELL_LIBRARY and carry no `school` / `classRestriction`), twinned onto
the race tree: `RACE_TREE.homosapien` = `[[raceElbowGrease, improvise],
[raceAdrenalineRush, jackOfAll], raceUnderdogSpirit, [raceIndomitableWill,
reallyGoodPunch]]`. `CLASS_SPELL_LEARN_ORDER` has NO Freelancer row any
more; `FL_FIXED` is `{}` (still exported). The Freelancer's tree (data.js
FREELANCER block, `buildFreelancerTree`) is the race pillar + TWO socket
racks, ring-tier-capped (r1/r2 tier I, r3 tier II, r4★ tier III):
**P1–P4 = ANY RACE ability** (`flRacePool(race)` = every other race's
tree, both twin alternates, minus the unit's own pillar and anything a
job tree owns; a `jobRequirement` row stays with its job) and **S1–S4 =
ANY JOB ability** (`flWildcardPool(race)`, unchanged). `FL_SOCKET_POOL`
names the pool per key, `flSocketPool(race, key)` is the picker's read,
`tree.socketPool` rides the built tree. **A socket judges a spell by its
TREE RING** (`_flTierOf` → `treeRingOfSpell(id)`, cached beside the
capstone set and dropped by `applyTreeRingCosts`) — most race abilities
carry no `tier` field. The pools are disjoint (no id lives on both a job
and a race tree), so placement is by pool + tier. party-builder.js:
`flSocketKind(tree, key)`, the pillar heads read ANY RACE / ANY JOB, the
socket chip / panel / window say Race Socket / Job Socket, the picker
reads `window.flSocketPool` and `window._flTierOf`. Two capstones still
never fit (4 + 4 > 7). `npm test` (content-schema.test.js "Freelancer
wildcard-socket tree") guards the move, both pools, placement, legality,
the random walks and the repair. Unseen live (RULE #1c): the race pool is
~400 rows in one window — a filter row may be wanted.

## ROOM 1 (Reception as a room, HQ plan 7.4) — added 2026-09-14
`DOOR_HQ.rooms.reception` (data.js) is RECEPTION, a `kind: 'box'` room
behind the ground ring's window door at 120° (`central_egress.doors` id
`reception` — it was a door straight to `_mountReactProfile`; the number
`1` now sits on the ROOM, `hqDoorNo` reads it through). Counters:
`window` (THE INTAKE WINDOW) → `_mountReactProfile` (the ID card — the
callsign and the desk are still edited there); `laminator` (THE
LAMINATOR) → `overlay: 'intake'` → map.js `_hqIntakeHtml`, which reads
**`hqIntakeCard(profile)`** (data.js, on `window`, beside
`hqMedicalRecord`) = `{ onFile, status, tone, note, empNo, callsign, desk,
clearance, rank, issued, photo, visits, days, reissues, fee, feeCharged,
serving, ticket, queue }` — the ONE read for the sheet, the dispenser
panel and the sign; `ticket` (NOW SERVING) has `action: {}` —
`_hqCounterPanelHtml` renders its panel by id (the sign = the first half
of the employee number, the ticket = the second, AHEAD OF YOU = the gap).
Procs in `_hqProcBuilders` (three-renderer.js): `now_serving` (wall,
front +z, `glow`; the digits are a `_hzTextTex` plane keyed by the ACTIVE
profile's number at build, `000` without one) and `laminator` (a
tabletop proc — place it with `y` = the desk top, `foot` 0). The hall's
intake wedge at 128° is untouched (the window from the hall side).
Viewer-local (RULE #2). doorhq.test.js guards the room, the helper and
the source sites. `HQ_LOST_CARD_FEE` (86) is never charged — a number the
sheet prints, not an economy hook.


## THE BUREAU OF CONTINUITY + THE MOTTO PLAQUE (the reality barometer, HQ plan 4.4) — added 2026-09-15
`DOOR_HQ.rooms.continuity` (data.js) is THE CANON OFFICE, a `kind: 'box'`
room behind the mezzanine's house door at 315° (`central_egress.doors`
id `continuity`, `leaf_suburban_house`; the gate — GATEKEEPER + 24 Keys —
stays ON THE DOOR, and so does the number `№ — CONTESTED`: the room wears
no `roomNo`, `hqRoomNo('continuity')` reads the door's through). Two
by-id panels (`action: {}` → map.js `_hqCounterPanelHtml`): `plaque` (THE
MOTTO PLAQUE) and `notices` (CANON NOTICES). **THE BAROMETER** (data.js,
right after `hqCornerInspection`; all on `window`): `HQ_MOTTO_BANDS` maps
the CHAPTER BAND to a form of `HQ_MOTTO_FORMS` — until the story track
(4.1) lands the band is the clearance: L1–L2 → 0 DO OBSERVE OTHER
REALITIES · L3–L4 → 1 DON'T. OPEN. OBSERVE. REPORT. (the one orientation
taught; `hqCornerInspection` still prints it) · L5–L6 → 2 DO OPEN OUR
REALITY (MASTER A7). **`hqMottoBarometer(profile, opts)`** is the ONE read
(`{ idx, form, forms, band, act, tone, level, title, source, taught,
drift, changed, previous, remembered, reading, note }`); `profile.door.
mottoForm` (the story hook — map.js `window._doorSetMotto(n)`, null =
follow the band) beats the band, `opts.force` (dev: `?motto=n` /
`window.EW_HQ_MOTTO`, read through map.js `_hqMottoForce()`) beats both.
**`hqMottoObserve(profile)`** is the ONE write — map.js `_hqRecordVisit
(null)` calls it on every fresh arrival and files today's reading in
`door.hq.motto = { form, since, remembered: [{ form, until }] }`: a
wording the plaque no longer reads goes on the REMEMBERED list (one per
wording, never the current one) — the Mandela effect is the player's
alone. **`hqCanonNotices(profile)`** = the Bureau's board, GENERATED
(never stored): the motto (STANDING, or RETCON when it changed since your
last visit), one CORRECTION per remembered wording, the WORDING notice
when the story set the form, the ladder, the floors (no 13), Bay 6, the
front door, H-Wing, today's cleared Code Red, Room 86 after hours.
Readers: the plaque proc `motto_plaque` (three-renderer.js, after
`wall_plaques`; reads the barometer AT BUILD — a room is rebuilt per
entry — texture cached per form as `hq_motto_plaque_<idx>`), the two
panels, **the Bureau's DOOR panel in the hall** (the motto + the top
three notices, readable at ANY rank — "canon notices on the Bureau's
door"), and the LOADING CARD (`#hqLoadMotto`, `.hq-load-motto` — A7:
posters, plaques, loading screens). Viewer-local, nothing relayed (RULE
#2). doorhq.test.js guards the room, the helpers and the source sites;
hq-floors.test.js dropped its "the Bureau's door waits" exception. The
notices' copy is Claude's DRAFT (A15 — the user rewrites).

## THE FOURIER FOYER (the front door, HQ plan 7.4's last row) — added 2026-09-15
`DOOR_HQ.rooms.foyer` (data.js) is THE FOURIER FOYER, a `kind: 'box'`
vestibule SOUTH of the hall behind the ground ring's revolving door at
195° (`central_egress.doors` id `foyer`, `leaf_revolving`, wide — the
one free stretch of the lower wall, between the Training Room and
Medical; the cooler moved 196° → 204°, the round picture 188° → 186°).
No `roomNo` (a foyer; the register skips it). Doors: `egress` (north,
the same revolving leaf) → `central_egress@foyer`; `street` (south,
`leaf_entrance`) → `fn: '_hqExitToMenu'` — the strip's EXIT as a door,
the street IS the main menu (labelled in map.js `_HQ_FN_LABELS`; one
home). Counter `inspection` (CORNER INSPECTION, `action: {}`) → the by-id
panel in `_hqCounterPanelHtml`, which reads **`hqCornerInspection
(profile)`** (data.js, on `window`, beside `hqIntakeCard`) = `{ onFile,
empNo, callsign, corners: 4, angle: 90, verdict, tone, visits, days,
streak, punched, date, canon, motto, mottoForms, note }`; `HQ_MOTTO_FORMS`
= MASTER A7's three forms (the seal does NOT carry the motto — the
barometer is the Bureau's plaque, 4.4). Procs in `_hqProcBuilders`
(three-renderer.js, the Phase 8 block): `door_seal` (a 3.6 m canvas
decal, cached — the department's name + the Customs & Admissions slogan
round the rim, a door in a square in a circle), `doormat`,
`umbrella_stand` (block). **THE ARRIVAL**: map.js `_hqEnter({ from:
'play' })` lands in `_hqArrivalRoom()` = the foyer (spawn just inside the
front door, facing the revolving door) unless `?nofoyer` / localStorage
`ew_hq_foyer='off'` / `window.EW_HQ_NO_FOYER`; returns, walks, `opts.room`
and the dev entries land as before; the Code Red doorbell rings in the
foyer too. Viewer-local (RULE #2). doorhq.test.js guards the room, the
helper, the ration (the foyer's two faces of one door) and the source
sites.

## THE HQ PAUSE MENU + THE LAST ROSTER + THE LANDING — 2026-09-15, local delivery
**ESC / P in the building = THE PAUSE MENU** (map.js `_hqOpenPause` /
`_hqClosePause` / `_hqTogglePause`; `_hqOpenSettings` is an alias now): an
OVERLAY inside `#hqPage` (`#hqPause`, index.html; CSS "THE PAUSE MENU" in
styles-base.css, z 35 — over the strip / panel / terminal, under the load
card), never a title-page swap. The old ESC pushed the whole Settings PAGE
over the HQ page (`_showTitlePage('settingsPage')`) and the walker's page
faded out under it with the cursor still spoken for — "escape pauses but
something has my mouse". Now `_hqSuspend()` pauses the walk in place
(`hq.setPaused(true)` releases the pointer lock; `exitPointerLock` again
for a late one) and a JRPG command column stands over it: **RESUME · PARTY ·
OFFICER · SETTINGS · DIRECTORY · EXIT** (`_HQ_PAUSE_CMDS`; ↑↓ ENTER, ←→
cycle members, BACKSPACE back, ESC / P resume — `_hqPauseKey` on document;
the walker's own ESC / P handler routes through `onEscape`, which closes
the menu first). **PARTY = THE LAST ROSTER**: state.js `recordLastParty()`
(`window._ewRecordLastParty`, localStorage `ew_last_party_v1`, the HUMAN
seat: the online seat, else the LOCAL controller, else P1) is called by
battle.js `startMatch` for a standard match only (never campaign / MD /
spell lab / tutorial) and files `{ seat, mode, members: [{ cls, name, meta:
{ race, gender, secondaryJob, customSpells, zodiac, appearance }, loadout:
{ spells, items, equipment } }] }`; `loadLastParty()` (`_ewLoadLastParty`)
reads it. The menu builds each member with the REAL `createUnit` (level,
sec job, tree-legal spells, gear bonuses — cached per open in
`_hqPause.units`) for the cards and the sheet (`_hqPausePartyHtml` /
`_hqPauseMemberHtml`: portrait or R2 sprite, race label, job, Lv, HP / MP
/ ATK / DEF / INT / MDEF / SPD / AWR bars, MOVE / RANGE / INSPECT, type
chips, ABILITIES with `type` category · MP · AP · RNG · PWR · desc,
PASSIVES via `getUnitPassives`, GEAR via `EQUIP_DEFS`, ITEMS via
`ITEM_RULES`); a build that throws falls back to the record's bare ids.
**OFFICER** = the file (`hqIntakeCard` / `hqMedicalRecord` / `hqPunchClock`
/ `hqKeys` / `hqMasteryCount` / `hqDailyOps` / `hqAvatarLabel` /
`hqMottoBarometer` / `getEloRankInfo`) + buttons into the ID card, the
trophies, the board (`_hqPauseFn` → `_hqDoAction({ fn })`; the modals
resume the building, a page comes home through `_hqReturnOrMenu`).
**SETTINGS** renders the main menu's settings body INTO the overlay:
`_renderMainMenuSettings` writes to `window._hqPauseSettingsBody ||
#mmSettingsBody`, and `_openMainMenuSettings` (the buttons' rerender hook)
re-renders in place while the menu is on SETTINGS. **DIRECTORY** drops the
menu and opens the directory panel over the paused walk. `_hqResume`,
`_hqLeave` and `_hqEnter` all `_hqPauseDrop()` — a screen opened from the
menu never comes back under a stale overlay. **THE LANDING** (three-
renderer.js): `_hqGoTo` stands the walker 2.4 m in from a flat wall (was
1.6) / 2.6 m from a curved one, and **`_hqCamInDoorway`** makes every door
a camera blocker — a slab 1.5 m deep on the room side of the wall plane,
the opening + the leaf's swing wide, door height — read first by
`_hqCamBlocked`; the boom used to stop at the wall plane INSIDE the
doorway behind the open leaf, so the door you came through filled the
screen until you stepped forward. Viewer-local, nothing on `state`,
nothing relayed (RULE #2). `npm test` runs `hq-pause.test.js` (the
recorder and the doorway blocker in vm sandboxes + source guards).
UNSEEN LIVE (RULE #1c): the menu's look over the building, the settings
body's width in the sheet, the portraits' crop, the landing on a wide
(revolving / hangar) door.

## THE PENTHOUSE + ROOMS 4C + 8 (the elevator rides, HQ plan 5.4 stage 1 / 7.4) — added 2026-09-14
`DOOR_HQ.rooms.executive` (data.js) is THE PENTHOUSE, a `kind: 'box'` lobby
behind the mezzanine ELEVATOR at 0° (`central_egress.doors` id `elevator`,
`proc: 'elevator'`, KEYHOLDER + 12 Keys — the gate is that door's, the lobby
wears NO `roomNo`: it is a floor and the register skips it). The way down
is the car on the lobby's south wall (a box-room door with `proc:
'elevator'` and no leaf; never gated) → `{ room: 'central_egress', at:
'elevator' }`. Counter `floorpanel` has `action: {}` — `_hqCounterPanelHtml`
renders its panel by id (the elevator door's `floors` as chips, M and PH
lit, `M ▸ DOWN` = a `data-room` button). Two doors off it: **`rooms.corner`
= ROOM 4C · THE CORNER OFFICE** (east wall, `leaf_glass_exec`): counters
`intray` → `overlay: 'intray'` (the SAME case-file sheet as Room 101 —
the closet stays yours and keeps the rank door; 4C's door is never
`rankDoor`), `plaques` → `_mountReactTrophies`, `view` (`action: {}`) →
the by-id panel: one row per bay, `hqSiteMastery` summed over its
thresholds. **`rooms.pool` = ROOM 8 · THE INFINITY POOL** (north wall,
`leaf_glass`): the FIRST hand-authored OPEN room — `shell.open: true`,
`edge: 'low'` (the parapet), `shell.sky` = a hand copy of the
`prebuilt_heaven` env row (doorhq.test.js diffs tint / fog / scenery
against `EW_MAP_META` — edit both or the test fails), `apron: 'cloud_2'`,
terrain-sheet keys for floor / wall (`_hqTex` falls through to
`TERRAIN_SPRITES`), `shell.lights` = the point lights (an open room has no
fluorescents). Counters `edge` (`action: {}` → the by-id panel: the punch
clock as ON BREAK, the engraved count, the leaderboard button) and
`ranking` → `_mountLeaderboard`; `onlineSpots` on the loungers (Room 86's
rule). Procs in `_hqProcBuilders` (three-renderer.js, after `telescope`):
`floor_panel` (wall), `exec_desk` (wall, `block`, top 0.76 — desk props at
`y: 0.76`), `exec_chair` (floor, `block`), `wall_plaques` (wall; gold per
`hqTrophyCount` at build), `false_window` (wall, `glow`), `infinity_pool`,
`pool_lounger` (seat 0.42, `hqSit` at its x/z), `pool_umbrella`. **RECT
BLOCKERS**: a catalogue row may carry `rect: { hw, hd }` (metres, ROOM
axes — place the prop at `face` 0 / 180) and both prop-blocker sites in
`_hqPlaceProps` pass it through (`_hqBlkContains` already honoured
`b.rect`); the pool is the first. All three rooms are viewer-local (RULE
#2). doorhq.test.js guards the ride, both rooms, the sky diff, the rect and
the source sites. Still open in 7.4: the Fourier Foyer only.

## THE EXPLORATION FLOORS (HQ plan Phase 8 stage 1) — shipped 2026-09-14, local delivery
The elevator is a ROOM: `DOOR_HQ.rooms.car` has no doors — its FLOOR
PANEL (counter `panel` → map.js `_hqFloorPanelHtml`, shared with the
penthouse's `floorpanel`) rides to `DOOR_HQ.elevator.stops` (PH · 3 · M ·
G · B; read through `hqElevatorStops(profile, fromRoom)` — PH wears the
old KEYHOLDER + 12 Keys gate, the mezzanine door is ungated; `window.
_hqCarFrom` = the floor the car was boarded from). Every lobby's
`elevator` door (`proc: 'elevator'`) leads back to `car@panel`. Three
floors + an undercroft on no button (24 rooms, the block after
`training` in data.js; plan §8.2 has the table): **G** THE GARAGE (P1,
THE RAMP landmark, the booth panel) + the dock; **B** SERVICES (the
lobby), the kitchen (350, a saloon door UP into the Cafeterium), the cold
room (−18), the laundry (60), Service Corridors A and B, the boiler room
(451), the room at the end, the server room (127, a stair UP into IT);
**B2** the dungeon (24601), the ritual room (333), the sacrifice room
(322, THE ALTAR panel = Form 322), Room X (the `floating_orb`, THE
OBJECT panel); **3** THE ANNEX, the lecture hall (314, THE BOARD panel =
TYPE_CHART), the cubicle floor (9-5, the online shift's `onlineSpots`),
the bathroom (WC), the crawlspace, the locker room (26), the natatorium
(50M), the garden (1618, open under Olympus's sky by hand, the L5 gate →
Room X). Un-numbered rooms are lobbies / corridors (the register skips
them). **SECRET DOORS**: `door.secret: true` = no leaf / lamp / plate; the
renderer hangs a wall slab on a hinge in the shell's tinted wall
(`_hqBuildDoors` `wallMatS`); `hqSecretDoors()` lists the five. **ONE
HOME PER FUNCTION** (plan C-27): every `fn` / overlay has ONE counter or
door in the building (the ID card = Reception's window; the leaderboard
= the hall's board; the shop = the Quartermaster; Challenge = Medical's
desk; achievements = Room 111; the case file = Room 101) — a duplicate is
a by-id PANEL or a prop, never a second launch; hq-floors.test.js fails
on a second home, and no panel carries a YOUR CARD button. **Renderer
rules that came with it** (three-renderer.js): a catalogue proc may carry
`light: { color, intensity, dist, y }` (a PointLight the placer adds,
`HQ_PROP_LIGHT_MAX` 10 per room); a builder that moves pushes a ticker
(`_hq.tickers`, run by `_hqTickWorld`); a shell may say `strips: false`
and `mood.ambient` (a dim room lit by its own props); a placement's
`rect: false` refuses the catalogue rect. The 44 Phase 8 procs live in
`Object.assign(_hqProcBuilders, {…})` before `_hqProcProp`; `parked_car`
is the Sedan (`getRace3DModel('honda civic')`, MODEL_INDEX). **THE PAUSE**
(C-28): P = ESC in the building and the pause menu in a battle (ui.js);
an UNREQUESTED pointer-lock loss is the ESC the browser ate —
`_hqOnLockChange` (`_hqHadLock`, outside `_hqLockStaleAt`'s window) opens
the settings, Strike Mode's `pointerlockchange` (`_strikeLockReleasedAt`)
opens the pause menu. `npm test` runs `hq-floors.test.js`. Unseen live
(RULE #1c): all of it — plan §9 2026-09-14 rev 3 lists what to eyeball
first.

## H-WING (HQ plan 5.5 stage 1) + THE DOOR THAT OPENED THE SETTINGS — 2026-09-14 rev 4, local delivery
**The bug**: after C-28 (the eaten-ESC rule) EVERY door in the building
opened the settings. `_hqEnter` re-appended the shared canvas into the host
on every room entry; appendChild on an element already in the host
REMOVES and re-inserts it, a pointer-locked element removed from the
document loses its lock, and `_hqOnLockChange` read that as the walker's
ESC. Now the canvas / CSS2D layer are appended ONLY when their parent is
not the host, and the room-to-room swap stamps `_hqRebuildAt` (a loss
inside 2.5 s of it is never an ESC). RULE: never re-parent the shared
canvas while it may be pointer-locked; test `parentNode !== host` first.
**H-WING** (data.js `DOOR_HQ.hwing` + eight `rooms.hwing_*`, built OPEN —
the user's rule: build as end-game, lock later; the gates go on
`garage/p2`, `deadend/hwing` and the site back door as `minClearance`):
an H of two 48 m legs + a bar under the facility. Ways in: THE STAIR from
the garage's west wall (P2) and the room at the end's SECOND secret wall
(six secret doors now — hq-floors.test.js). The west leg's EXIT walks
into `site_prebuilt_backrooms@hwing` — **`DOOR_HQ.siteRooms.backDoors
[mapId]`** is a second door row `hqSiteRoom` appends after the way in
(three-renderer.js `_hqBuildSetting` keeps every room door's lane clear
of the setting now, not only the way in); a `room` door is never gated by
a sector lock, so Bay 6 stays sealed (C-12). THE FRACTAL: `hwing_office`
is ONE room behind all eight office doors and its way out lands at
`hwing_w@office_1`; the east leg's far end opens onto `hwing_w@lobby`;
HOME's kitchen door opens onto its own front door. HOME is SCAFFOLDING
(A14 Q5): the hallway only, `house_stairs` to the ceiling, counter `phone`
(map.js by-id panel, ANSWER disabled). Procs: `square_cubicle`,
`house_stairs` (Phase 8 block). Panels: `wingplan`, `phone`. No room in
the wing wears a number (the register skips it; `hqHWingRooms()` /
`hqHWingEntries()`). The wing's plain leaf is **`leaf_coffee`** — never
`leaf_hollow_core` (the L2 rank leaf; doorhq.test.js refuses it). The
car has no H stop (the lobby's elevator door still calls it). `npm test`
runs `hwing.test.js`. Unseen live (RULE #1c): all of it — plan §9
2026-09-14 rev 4 lists what to eyeball first.

## THE SOCKET PICKER'S TABS + FILTERS (the Freelancer pool window) — 2026-09-14, local delivery
The ＋ RACE SOCKET / ＋ JOB SOCKET window (party-builder.js, the node
picker after the RACE ABILITIES strip) wears five category TABS (ALL ·
DAMAGE · UTILITY · BUFF · DEBUFF · HEAL — `PB_SOCKET_TABS`, coloured by
`PB_CAT` through `--pb-fc`, each with a count judged inside the other
filters) and a FILTER ROW: DMG PHYS / MAGIC (`pbSpellDmgKind` — the
`ew-dmgicon` rule, damage-dealers only, `damageType`), the six TYPE discs
(`sp.spellType`, greyed when the pool has none), SHAPE single / multi /
aoe / line / self (`pbSpellShape` — ONE shape per row derived from the
kind + `lineWidth` / `pbAoeLabel` / `hitDamages` / `range 0`;
`_PB_SELF_KINDS` mirrors battle.js SPELL_KIND_META `selfCast`), the
socket's TIERS (only when it spans more than one, `pbTreeTierOf` = the
tree ring) and a search (name / desc / school). State `flSocketFilt`
(`PB_SOCKET_FILTER_EMPTY`; reset whenever `flSocketPick` changes), the
match is `pbSocketFilterMatch(sp, f)`; the sub-line reads shown / pool.
CSS: styles-base.css `.pb-socket-tabs` / `.pb-socket-filters` /
`.pb-socket-empty` right after `.pb-window-body`. Viewer-local UI,
nothing on `state` (RULE #2). party-builder.test.js evaluates the
classifiers on the real race + job pools. Unseen live (RULE #1c): the
sticky tab strip over a long scroll, the row wrapping at narrow widths.

## THE BOW ON EVERY ARROW (2026-09-14, local delivery)
Every arrow attack draws the bow (three-vfx-effects.js `_sigBowShot3D`)
and plays the archery clip (sprites.js `castArrow`): **`_SIG_BOW_FOR`**
now names all seven arrow spells (Bomb / Fire / Poison / Splitting /
Piercing / Green Arrow / Arrow Volley — never `knifeThrow`, which only
shares `_bolt_arrow`), read through **`_sigBowShotFor(spellId, params)`**
(`params.bow` = the basic attack's flag). Three paths reach it: the bolt
intent (`_fireBoltMapped`, as before), the BEAM intent (`_fireBeamMapped`
— Piercing Arrow looses down the lane to its last tile; guarded with
`typeof` because mapped-effect-lifetime.test.js sandboxes that function
without the helper) and **`fireBoltDirect`** (battle.js
`playBasicAttackShot` passes `bow: true` for an arrow-kind attacker —
Robin Hood's quick shot; the flag rides the delivery, so the `basic-shot`
relay needs nothing new). Arrow Volley got a `_BOLT_WIRING` row so the
aoe's travel projectile fires the first shaft (bow + tracer) before the
`raceArrowRain` geometry rains. sprites.js `classifySpellAnimKind` judges
the ARROW rule BEFORE the throw rule (Bomb Arrow read as a lob). **The
arrow GLB comes in tip-backward** like the guns — `_WPN_MODELS.arrow`
wears `tweak: { ry: Math.PI }` (the bow's loose and the volley's plunge
both take the same instance, so one flip fixes both). Unseen live (RULE
#1c): the flipped arrow's head at the string and in the dirt.

## THE DOOR AGENT — the race built on doors (DOOR_RACE_DESIGN.md, Stage 1 shipped 2026-09-14, local delivery)
Race key **`'door agent'`** (label DOOR Agent; human + anomaly; TIME; Agent
job; a starter; the Player / Agent Belle cast GLBs via `RACE_MODELS_3D['door
agent']`, registered AFTER `DOOR_CAST_MODELS` in sprites.js because the cast
library is built later than the race table). **THE DOOR** = battle.js "THE
DOOR" block (right before `_structureAt`): `state.doors` = `[{ id, pairId, x,
y, z, open, hp, maxHp, owner, ownerId, spellName, fixed, placedRound }]` (ids
only, RULE #2; synced — state literal, net snapshot, the six reset blocks and
the fog cache key all carry it). Read it ONLY through `doorAt / doorTwin /
doorsBeside / doorTeamPairs / doorTileFree / placeDoorPair / setDoorOpen /
breakDoorPair / damageDoorAt / doorStepThrough` (on `window` and on `GAME`).
Rules: OPEN = passable, whoever ENDS a move on it steps out of its twin
(`finishMoveAt` → `doorStepThrough`, before the arrival hooks), the owning
team sees the twin's 3×3 (map.js `computeVisibleTiles`); SHUT = a wall for
everyone (`doorBlocksMove` at the four occupancy gates, `doorBlocksSightBetween`
in `isRangeBlockedByTerrain`); `DOOR_RULES.hits` 3 (Keyholder `doorHits` 4)
and the pair breaks together; 1 pair per agent, 2 per team, the oldest
folds. `deployPair` (Grave Passage / Tunnel Network) places FIXED doors now.
Kinds: `door` (Knock Knock — two TILE clicks via `state._spellPick1 { tile:
true }`, NOT the unit two-click gate; online.js's wrapper picks locally and
sends `pickX / pickY`; a click on a friendly door toggles it — Keyholder's
`doorFreeToggle` makes that free once a turn, `_doorFreeAction` skips the
AP spend), `doorBreach`, `doorDelivery` + `doorExit` (their reach is a
DOOR's — `_doorOriginForSpell` replaces the range + LOS gate; meta
`doorOrigin: true`), `doorSlam`, `doorTrap`; The Long Way Round = `buff` +
status `castFromDoors` → `doorCastOriginFor` lets doAttack / doSpell launch
from a twin door when the direct cast fails. **The rear-attack rider**:
`state._doorRearCast` (armed in doSpell by `spell.rearAttack` or a door
origin, disarmed in finishAction) makes `applyDamageToUnit` price the hit
as a back attack. EXITED = status `exited` (realm-shielded from everyone,
no move / act; `onRemove` → `window._doorExitReturn` out of the twin,
Staggered) — the body STAYS on its tile under the status. Renderer:
`_buildDoor3D` in `rebuildDeployables`, hashed into `_computeDeployableSerial`.
`npm test` runs `door-race.test.js`. Adding a door-reading rule = the block;
never re-derive "is there a door here" from `state.doors` at a call site.
Unseen live (RULE #1c): the leaf swing, the pips, the step-through beat,
the guest's tile pick, every AI placement.
**REV 2 (2026-09-14, same day) — THE DOOR IN THE FRAME**: the board door is
the map's own CATALOGUE leaf (`_doorLeafFor` = the crossing's threshold
leaf, else `leaf_hollow_core`) on a DOOR-issue frame, hinged per the
catalogue, facing its twin — NEVER a procedural plank (the user's rule:
the kit has thirty doors). Every ability fires a door recipe from
three-vfx-effects.js "THE DOOR AGENT'S DOORS" (`_sigDoorRig3D` wears the
same leaf through the weapon cache as `door:<key>`; `_sigDoorPortal3D` /
`Knock3D` / `Slam3D` / `Delivery3D` / `Network3D`) through battle.js
`window._doorGeom(id, x, y, extra)` → `VFX.fireGeometry` (relayed;
`extra` primitives only — `doors` rides as "x,y;x,y"). Ids:
`raceKnockKnock` · `raceBreakingEntering:door` · `raceSpecialDelivery` ·
`raceSlam` · `raceExit` / `:out` · `raceLongWayRound` · `raceTrapdoor` /
`:out`. `npm test` runs `door-vfx.test.js`. A new door ability = a
recipe in that section + a `_doorGeom` fire at its branch.

## MOVE + ACT ON THE TILE MENU (Cube attacks, Inspect) — 2026-09-14, local delivery
The tile quick menu (hud.js `_computeTileActions` → `_hrlgTileBlades`) now
offers the one-step "walk into reach, then act" plan the enemy-unit menu
always had: every STRUCTURE attack row (Cube / turret / deployed object /
seed / tree) goes through **`_objAtkRow`** — in range → `_fireObjectAttack`,
else battle.js `findAttackApproachTile` (validated against
`_getAttackValidTargets` from the probe tile, so the Cube's 3D reach + LOS
+ fog rules hold) → `_moveThenAttack`; the INSPECT row measures the scan's
OWN reach (Chebyshev + LOS — it used to read the 3D combat distance and grey
a diagonal the engine accepts), else **`findInspectApproachTile`** →
**`_moveThenInspect`** (battle.js, right after `_tryMoveThenAttack`: ONE
walk step, jump/takeoff tiles skipped, no plan once the unit has moved,
`_inspectMoveBudget`; `_tryMoveThenInspect` is the board-click twin in
clickTile's inspect branch, `_inspectApproachHoverPreview` the hover
arrow). A plan row wears `moveTile` → the `↳ MOVE` / `↳ JUMP` note and the
engine's approach preview on hover (`_drawSpellApproachPreview` /
`_clearSpellApproachPreview`). The root ATTACK blade already lit for a
reachable Cube (`attackHasReachableTarget`), and Attack mode's board click
already walked to it (`_tryMoveThenAttack`) — only the tile menu was behind.
Online (RULE #2): `_moveThenAttack` / `_moveThenInspect` call the WRAPPED
`doMove` / `doAttack` / `doInspect`, so a guest's plan emits each verb and
the host resolves; nothing new is relayed. `npm test` runs
`move-then-act-menu.test.js`. Unseen live (RULE #1c): the ↳ MOVE note on the
object-led menu, the ghost + arrow on hover, the scan landing after the walk.

## 2026-09-14 — adversarial Phase 6: endgame policy and Nexus membership (local delivery)

Refreshed full main at `58483d42e0693e9c2aca6dd385792e7f9effb475`. `ai.js` now reads TDM/Simul team kill-score lead against the real deadline: preserve a lead through increased exposure cost and reduced pursuit; seek needed kills or break ties through bounded pursuit/kill premiums. These are initial heuristics, not measured optimal play. Simul gets the TDM kill-mode bonus and `_aiPlanCandidates` now uses final `rankCandidates` in Simul only; it previously bypassed danger scoring. Other planner consumers keep their prior contract.

Nexus channel scoring now calls the production `GAME.getNexusAtUnit` query, respecting roaming precedence, tile footprints and authored elevation. It no longer picks a nearby unrelated zone or duplicates overlapping zone promises; roaming-only states work. Airborne landing projection and macro route selection remain unvalidated. No new synchronized fields or relays: vision values are ephemeral; host-driven actions still execute through existing paths.

Two new test files: `ai-endgame-policy.test.js`, `ai-nexus-membership.test.js`, 36 passing checks (30 fail unchanged AI; six controls pass). Full suite/syntax results and limitations are in `ADVERSARIAL_20260914_VALIDATION.txt`. `check-ai-breach-review.js` records the still-open destructive-beam forecast mismatch using controlled production walk/footprint functions. Dispatch inventory: 508 spells / 71 kinds, no missing direct routes; not proof of tactical coverage. No browser test, full-match simulation, deployment, commit or push. See the latest adversarial plan entry for evidence and exact next task.

Delivery: `ENTROPY_WARS_PHASE6_ENDGAME_NEXUS.zip`; ai.js → R2, index.html → Render (`20260914-ai-endgame-nexus-01-cors`), other files → repository. Preserve newer repository work on future refreshes. Phase 6 stays open for beam breach, Arena immediate-win/denial precedence, reserves/door scenarios, timing and authorized observed play.

## 2026-09-14 — Phase 6 prerequisite: door LOS and production breach evidence

Fixed `doorBlocksSightBetween` skipping the first interior tile: production `getLinePoints` excludes the source. Start at index 0; exclude only the endpoint so doors remain targetable. The existing door test now uses the actual map helper instead of a source-inclusive mock. New door LOS tests exercise the real map/AI/line-walk boundary, eight directions and both seats. 22 new tests pass (18 fail on unchanged battle.js); full suite 1,095 passed, zero failures, four skips; syntax 142/142. No new state/relays, no live test or deployment.

`check-ai-breach-terrain.js` adds production voxel/door evidence. In the controlled raised-column fixtures the LOS blocker can precede the current beam cell, but the engine attempts to breach that current cell; the original simplified successful-removal probe is not full voxel evidence. A last-hit enemy door removes its pair and permits continuation, which the static AI footprint misses. The pure forecast and Arena precedence remain open; see AI-05e/f/g in the adversarial tracker for evidence and exact next work. Water settling and several non-door destruction effects remain doubled in this probe; it stops before unit damage/aftermath.

Complete package: `ENTROPY_WARS_PHASE6_DOOR_LOS.zip`. battle.js to R2, index.html to Render (`20260914-door-los-boundary-01-cors`), other files repository-only. Preserve the existing AI version; no AI runtime edit in this batch.

## 2026-09-14 — Phase 6: actual-obstruction beam boring

Baseline main `ed196c9e9ae1f47be0d870befd373f045adc4585`, including the prior door fix. Implemented locally: map LOS optionally reports the first terrain/object obstruction; beam resolution checks occupancy and breaches that column, then reruns LOS before continuing. This fixes failing to bore the earlier wall and breaking later innocent columns, while respecting hardness, the body window, retained upper blocks and two-bore cap. No new persistent state or relay fields. AI prediction remains unchanged and is the next task (including mid-cast door-pair removal).

30 new production-boundary tests pass; 27 fail on unchanged map/battle source. Full suite: 1,129 total, 1,125 passed, zero failures, four skips. Tests stop before damage/aftermath and double water settling/destruction side effects; no browser, live guest or match acceptance. See AI-05f's latest adversarial entry and BORE_VALIDATION.txt for scope/evidence. Deliver ENTROPY_WARS_PHASE6_BEAM_BORE.zip: map.js/battle.js to R2, index.html to Render (20260914-beam-bore-obstruction-01-cors), remaining files to repository; sync runtime files too. Not committed, pushed or deployed.

## 2026-09-14 — Phase 6: read-only destructive beam forecast

Baseline main `d34afac086cacd043d6a39f8d35937020ebef4d9` includes the previous actual-obstruction beam fix. New `GAME.getLineForecast` applies hypothetical wall/tree/door changes to private copied rows/columns and door records, using existing map LOS and breach-window queries with an optional board view. AI scoring/direction selection use this footprint, including two-bore limits, body height, occupancy, hardness, retained lintels, door-pair destruction, terrain painting and final-board wide lanes. No live-state swap or side-effect callbacks; hypothetical caster movement replaces old occupancy. AI stamp `v4.9-2026-09-14-beam-forecast`.

71 new checks pass; unchanged AI fails 48 with 23 controls passing. Full suite: 1,200 total, 1,196 passed, zero failures, four skips. Actual production footprint/terrain/door boundaries, plus controlled scorer/picker and frozen-input checks. Not full damage/aftermath or browser acceptance. Explosion, fatal building collapse and possible flooding yield only a conservative prefix with uncertainty; their full prediction remains open. No serialized fields/relays, commit, push or deployment. See the latest adversarial entry and FORECAST_VALIDATION.txt for exact scope.

Deliver `ENTROPY_WARS_PHASE6_BEAM_FORECAST.zip`: ai.js/battle.js/map.js to R2; index.html to Render (`20260914-ai-beam-forecast-01-cors`); remaining files to repository. Sync runtime/entry files to repo too. Next: Arena immediate-win/legal-denial precedence and reserves-aware wipeout; retain AI-05 complex aftermath and Phase 6 scenario/timing/observed acceptance as open.

## 2026-09-14 — Phase 6 continuation: Arena Key scan priority

Retained the preceding beam forecast and corrected Inspect selection: shared `getInspectFootprint` now drives both actual Key collection and AI known-Key valuation. Registry-backed held counts/current `getKeysToWin` replace stale counters. A projected winning revealed-Key scan precedes ordinary attacks, danger/kill overrides, Easy random picks and automatic reserve retreat; other Key pickups receive initial collection/one-away denial value. No hidden-Key or hidden-bomb oracle. Engine inspect geometry and online host execution are unchanged; no new synchronized fields.

21 new checks pass (13 fail with preceding AI, eight controls pass), including actual `doInspect`/`checkWin` victories for both seats and sudden death. Combined with 71 beam checks: 92 new tests; full suite 1,221 total, 1,217 passed, zero failures, four skips. Rendering/rewards/timers are doubled; no full-turn browser/guest acceptance. Hidden bomb/aftermath interruptions can invalidate projected Key wins. Cube terminal forecasts, carrier denial, move-then-inspect and home-team/reserves wipeout remain open; `checkWinConditionOnly` still needs its current-player/home-player discrepancy audited against `checkWin`.

Combined complete delivery `ENTROPY_WARS_PHASE6_BEAM_AND_KEY_AI.zip` supersedes this task's beam-only ZIP. ai.js/battle.js/map.js → R2; index.html → Render (`20260914-ai-beam-key-priority-01-cors`); remaining files → repository; sync runtime/entry files too. AI stamp `v4.10-2026-09-14-arena-key-priority`. No commit, push or deployment. See latest adversarial entry and ARENA_KEY_VALIDATION.txt.

## 2026-09-14 — Phase 6 continuation: Cube finish and wipeout consistency

Shared `getCubeAttackDamage` preserves actual Cube damage order and RNG execution, and supplies minimum/neutral/maximum forecasts to AI. Supported direct attacks that finish the Cube even on the minimum roll gain the existing objective priority. AP/status, surface-height range, LOS, fog and occupied-column checks gate it. Private unit copies absorb stat/level caches. Remote/telescope/terrain-face and spell/multi-hit finishes remain outside this conservative query.

`getTeamWipeoutCount` now supplies both actual winner and early-stop readers: home player, dead/dying and living reserves (including promised replacements). Early stop no longer treats possession as a wipeout, agrees with the final reader's both-empty case and handles FFA without bypassing clock expiry. Key/Cube priority avoids already-terminal home-team boards.

26 new tests pass (nine fail prior AI/early-win source, 17 controls pass); all 26 pass with the original pre-extraction Cube attack body too. Full suite: 1,247 total, 1,243 passed, zero failures, four skips. This task adds 118 checks across all three batches. Syntax: 146/146. Re-read the unchanged three_ways tutorial and updated its early-win hash and added watches for the extracted wipeout/Cube helpers in data.js. Stats/range/LOS/rewards/rendering/timers are controlled in Cube tests; no browser/live guest/full-match or full-candidate timing acceptance.

FINAL delivery: `ENTROPY_WARS_PHASE6_BEAM_ARENA_OBJECTIVES.zip`, containing all beam, Key, Cube and wipeout changes. R2: ai.js/battle.js/map.js/data.js; Render: index.html (`20260914-ai-beam-arena-objectives-01-cors`); remaining files: repository. Sync runtime/entry files too. AI stamp `v4.11-2026-09-14-arena-cube-priority`. This supersedes interim package scopes in earlier entries. No commit, push or deployment. Next: carrier denial, move-then-inspect, residual scenarios/timing and authorized observations; Phase 6 remains open.

## THE GALLERY'S EDGE + ROOM X + THE CAR + THE PLANET IN THE ROOM + THE ISLANDS — 2026-09-16, local delivery
Five of the user's HQ fixes (DOOR_HQ_BUILD_PLAN §9 has the log). **THE
GALLERY'S EDGE**: the third ring's fascia (`_hqBuildRing3`) faced the DRUM
(a `_hqBand` cylinder is FrontSide = outward) and the underside is a sliver
from below, so the rail floated on the stone from the mezzanine and the
floor; it is `BackSide` now + a 0.25 m soffit lip (oxblood between two teal
trims, closed under). RULE: a fascia at a slab's INNER radius is seen from
inside — `BackSide`. **ROOM X**: the door landing (2.4 m in) stood INSIDE
the orb's blocker in a 5 m room = a soft lock (`railing_1m` is `foot: 0` —
it never blocked); `_hqGoTo`'s box landing is clamped to the room's depth
and walked back toward the door until it stands on no blocker, and the
room is 7 × 7 with the orb ring north of centre. **THE CAR**: no `metal_3`
grate (brushed `aluminium` walls / dado), the leaves brushed aluminium
instead of the trim sheet tinted grey. **THE PLANET IN THE ROOM**:
`hqSiteRoom` sets `shell.planet` + `shell.world` for a map whose
`env.world.kind` is `planet`; under `K.hq` the near builder's
`_nrApron({ planet: true })` records craters on `K.planet` (`_nrCrater` /
`K.inCrater` read it), `_nrKit` takes `ctx.hq.keepOut` (the room's doors,
console, props, natives, masts, spawn, finds — hoisted from
`_hqBuildSetting`'s clear zones) and rides on `ctx.kit`; after the build
**`_hqBuildPlanetGround(room, g, K)`** runs `_wdBuildPlanet` + the `_WD_RIM`
builders + `_wdInject` (dissolve off, the shared uniforms pinned grounded,
`_wd.mats` / `_wd.hasGround` untouched — `o.hq`) in the setting group; the
flat floor / apron / skirt wear `_ew_hqGround` and hide when it lands;
`_hq.planet.yAt` is a layer of `_hqSurface`'s box branch (the walker walks
the bowls). Saturn's storm walls + rings come indoors (no `!HQ` gate). Mars
/ Saturn rooms wear the board's own sheet + tint. **THE ISLANDS**: Bermuda
is the open sea — beaches (spawn rows), shallows to wade, the deep, the
treasure island with the X (`dirt_2`) + the chest, a wreck on a rock islet
a side, a sandbar; full map + Δ authored from `ROWS` sheets; the near
builder builds NO sand apron (the sea at `depth: 1` = the board's water
level, beach tongues past the spawn rows, the lighthouse on a rock, palms,
`_nrRocks` `y`). Ship data.js to Render too. Unseen live (RULE #1c).

## THE PLANETS + THE ONE TINT + THE STREET (the visual pass) — 2026-09-16, local delivery
The user: "I don't get the impression I'm on a planet — a little curve to
the edges; the mounds that are supposed to be craters are upside down;
Saturn doesn't look like Saturn; the 8×8 surface looks different from the
landscape; mountain textures are stretched; the urban street sheet has a
direction." **THE PLANET** (`env.world.kind: 'planet'` on Mars / the Moon /
Saturn, data.js): THE WORLD's ground IS the near apron — the builder's
`_nrApron(K, { planet: true, … })` builds NO box, and three-renderer.js
**`_wdBuildPlanet`** (right before `_wdIslandDisc`; `_wdPlanetProfile` is
the height + colour function) lays ONE surface from the board's edge to the
horizon: a flat COLLAR round the board's square (`rb`), the flat ISLAND to
the apron zone's corners (`ri` = half·√2; never dissolved, the root hangs
under it, round), then the FAR RING falling on a parabola (`curve` = tiles
of drop at the horizon radius — the edge of the map curves off like a ball;
dissolved + hazed like any world). **CRATERS ARE CARVED, NEVER STOOD**: the
builder registers them (`_nrCrater(K, x, z, rTiles, { depth, rim })` /
`_nrCraterField(K, { n, r: [min, max] })` → `_nrLastKit.craters`; refused
on the collar, in a lane, on a `K.keepOut` prop or over another crater;
`K.inCrater` keeps the mounds / rocks out), the row's `craters: { n, r, d0,
depth, rim }` scatters the far field, and the mesh carries them (a
parabolic bowl, a raised rim, the floor in shade). `_WD_RIM.craters` on a
non-planet is a lathe bowl now (`_wdCraterLathe`) — the torus is gone, and
so are the `_nrMounds` on the planets. Rim builders read `c.yAt(x, z)` so
peaks / hills stand ON the curve. **SATURN**: `bands: [[tiles, hex], …]`
(latitudes are concentric round the pole) and `hex: { w, color, amt }` (the
storm, at the builder's `hexR` = the island's edge + 3 tiles) are VERTEX
COLOURS on the deck; the builder stands six wispy storm WALLS on the
hexagon's edges and THE RINGS (`_hzSaturnRingTex`: C · B · Cassini · A ·
Encke · F on one canvas, `_hzRadialUV`, a 40–122-tile annulus tilted 0.2
rad + a dark shade sheet under it — the deck hides the near half, the far
half arcs low over the horizon; a steeper tilt puts the arc above the
frame at the game's pitch, measured). **THE ONE TINT** (`K.mat`): the
board's per-terrain tint (`state.terrainTints` / `HQ.tints`) is applied
ONLY when a builder passed no colour of its own — every builder that
passed the Δ's own hex was tinted TWICE (0.78² = 0.61), which is why the
apron never matched the board; and `_nrApron`'s TOP face is a plain
Lambert like the tiles (`lift` 0 — the 22% emissive lift stays on skirts
and walls). The planets' ground is the board's OWN sheet + tint (Mars
`moon_2` × #c88a5a, the Moon `moon` × #c8ccd8). **THE CONE UVs**:
`_nrConeUV(geo, r, h, ts, dens)` — u round the base's PERIMETER, v up the
slant; the old `r / ts` stretched every peak / spire / pyramid (near and
rim) ~6× sideways. **THE STREET**: sprites.js `urban_street` → the concrete
sheet, darkened by **`TERRAIN_BASE_TINT`** (`_evBaseTint`, multiplied BEFORE
any map tint in `_evTintMat`, `K.mat` and `_hqMat`) — direction-free
asphalt for every street; the old `urban_street.png` stays in the bucket
unreferenced; `road` is untouched (a dirt road on the fantasy maps).
world-ground.test.js knows the kind and guards the planets. Screenshotted
offline with `CLEAN=1 POSES=wide,far,horizon,vfar node playtest_world.js
prebuilt_mars prebuilt_moon prebuilt_saturn` (stand-in textures: the
curve, the bowls, the hexagon and the rings are verified; the SHEETS are
not — RULE #1c). Unseen live: the real regolith sheets in the bowls, the
concrete-as-asphalt tone (`TERRAIN_BASE_TINT.urban_street` is the edit),
the ring's brightness against the real sky.

## THE VANISHING DEPLOYABLES + THE SAME TORCH EVERYWHERE — 2026-09-15, local delivery
**The bug**: wards, mirrors, doors, seeds, bombs, decoys and gates blinked
out after placement and came back only when the NEXT deployable changed.
three-renderer.js `rebuildObjects` stripped EVERY child of `objectGroup` but
the turrets (`_ew_turretId`) and the deco group — the deployables too —
while `deployableMeshes` kept the disposed handles and
`_lastDeployableSerial` never changed, so `rebuildDeployables` never ran.
Any object rebuild did it; the usual trigger was a TEXTURE landing and
flipping `_objectsDirty` (the ward torch's own bark sheet, `_getTorchWoodTex`,
on the first ward of the match). RULES now: (1) `rebuildObjects` skips
anything in `deployableMeshes` or wearing `_ew_deployable` — a deployable is
removed ONLY by `rebuildDeployables`, exactly as a turret is only by
`rebuildTurrets`; (2) `_computeDeployableSerial` folds `_terrainVersion /
_heightVersion / _voxelVersion` (a dig / raise under a prop re-seats it —
the object pass used to do that by accident); (3) your OWN wards, doors,
gate pairs and `_deployedObjects` (decoys, walls, totems) wear
`_ew_depOwner`, so `_applyFogVisibility` never tile-gates them (mirrors and
bombs already did). **THE SAME TORCH EVERYWHERE** (the user's rule): the
HQ's `wall_torch` / `cave_torch` procs are `_makeTorchModel` now — the
ward's / the map editor's / the Dutchman rail's wood-and-rope torch — built
in metres (`_makeTorchModel({ ts: HQ_TILE_M * U, scale, noTint })`; `opts.ts`
and `opts.noTint` are new, `HQ_TILE_M` = 1.75) and fluttered by
**`_torchFlicker(entry, nowSec, isNight, baseInt)`**, the ONE flicker
(`_updateTorchFlames` runs it over `_torchFlames`; an HQ proc runs it from a
room ticker; the point light stays the catalogue's). The wall torch leans
0.42 rad off an iron bracket like a ward hung on a cube face (data.js rows:
`h` 1.1 / 1.9, the glow + light `y` retuned; the gun deck's torch hangs at
mount 1.4 under its 2.7 m beam). Never draw a cone-flame torch again — a
new torch anywhere = `_makeTorchModel` + `_torchFlicker`. `npm test` runs
`deployables-persist.test.js`. Unseen live (RULE #1c): the torch's scale
against the HQ walls, the bracket, the lean.

## THE GALLERY — two floors in ONE box room (HQ plan 9.2 stage 2) — 2026-09-15 rev 20, local delivery
`shell.gallery = { h, side: 'n'|'s'|'e'|'w', w, stairAt: 'start'|'end'|null,
rail }` on a box room (data.js) = a SLAB along one wall at height h, w
deep, a straight closed-string flight at the named end of the strip (its
LOW end at the wall's corner, its foot open at the side; twelve risers over
3.36 m for 2.9 m — `rise` / `run` override) and a banister on the open
edge. three-renderer.js (the block right before `_hqSurface`):
`_hqGalleryFrame(room)` → `_hq.gallery` (set in `_hqEnter` BEFORE the
shell build; s ALONG the wall from its start corner, t INTO the room,
`local` / `world`), **`_hqGalleryAt(x, z, curY)` = THE LAYER** `_hqSurface`'s
box branch reads after the site cell — a number (a tread / the slab), `null`
(a wall: the flight's mass from below, the rail band = 0.15 m + HQ_BODY_R
from the slab or a tread above a step), `undefined` (not the gallery's: off
the strip, or the FLOOR UNDER THE SLAB — a free query, curY null, is always
the floor's); `_hqGalleryFloor` seeds `_hqBlockerFloor` (a jump lands on
the slab / a tread; the portal aim lifts to them); `_hqGalleryAir`
(`_hqAirOK`) and `_hqGalleryCam` (`_hqCamBlocked`) make the slab's volume
and the flight solid; `_hqBuildGallery` draws it (deck in the floor sheet,
underside in the ceiling sheet, trim fascia, solid tread boxes + nosings,
posts + top + mid rail, the sloped rail up the flight, newels) and registers
`_hq.rails` (two runs) + `_hq.ramps` (the flight) for 9.8. **A door on the
gallery's wall STANDS ON THE SLAB** (`_hqDoorFloorY` → `gallery.h`; an
explicit `y: 0` puts it under; a numeric `y` wins) and `_hqGoTo` lands 2.4 m
in at that height. **THE FIX**: `_hqFindTarget` found a box door by the
rotunda's LEVEL, so a box door at a height (this doorway, the stairwell's
`landing` at y 6) was never offered — a box door is found by HEIGHT now
(|Δy| ≤ 1.2). Props stand on the slab with `y: h`, wall props above it with
`mount` from the floor. `stairAt: null` = the door gun's ledge; `rail: false`
draws nothing but the edge stays a balcony. THE FIRST: the Haunted House's
HALL (`site_prebuilt_haunted_hall`, h 5.8): THE LANDING along the north
wall at 2.9 m, the flight out of the east corner, the `stairs` door (→
upstairs, still its own box room) at x 1.0 ON the landing, the
`house_stairs` / banister props retired. Adding a gallery = one `shell.
gallery` row + doors on its wall + `y: h` props; hq-complex.test.js's
landing harness reads `_hqDoorFloorY` and its park rule accepts the
gallery's banister / flight. `npm test` runs `hq-gallery.test.js` (THE
CLIMB: a walker climbs the flight and crosses the slab to the door by the
step rule alone). NOT BUILT: 8.4's third ring on the rotunda, natives on
the slab, a gallery on a site / cave room. Unseen live (RULE #1c): the
deck / underside / tread sheets, the sloped rail, the first step onto the
foot from the side, the boom on the landing, the plate at 2.9 m.

## THE COMPLEXES — THE HAUNTED HOUSE (HQ plan 9.2 stage 1) — 2026-09-15, local delivery
A site that is SEVERAL ROOMS. The generated room (`hqSiteRoom`) stays the
BOARD ROOM (console, battle marker, the way back to the bay); a COMPLEX is
hand-authored box rooms in `DOOR_HQ.rooms` with ids `site_<mapId>_<part>`
wearing `site: mapId` + `part: '<name>'` and NO `roomNo` (`hqRoomNo` reads
the threshold's number through `site`; the register lists the site once;
the renderer plate does the same), joined to the board room by rows in
**`siteRooms.backDoors[mapId]`, now an ARRAY** (one row stays legal — the
Backrooms keeps its single H-Wing row). The first: Room 13 —
`site_prebuilt_haunted_hall` / `_upstairs` / `_attic` / `_cellar` (data.js,
the block right before H-WING) behind THE FRONT DOOR on the board room's
north wall at x −7.5 (west of the console at 0, clear of the signboard at
x 5 and the corner mast). Reads (data.js, before the built-rooms loop; on
`window`): `hqComplexRoomId(mapId, part)`, **`hqRoomSite(roomId)`** (= 9.4's
WILD test — a room with a site is wild, the facility is safe by
construction: never a flag on a facility room), `hqRoomPart`,
`hqSiteComplex(mapId)` (board room + parts in sheet order),
`hqComplexRooms()`, `hqRefreshComplexLinks()` (the parts take
`hqLinkDoors` once at load, never accumulating). A `links` end may name
`{ site, part, wall, x|z }` — `hqLinkRoom` resolves it ONLY to an authored
room (never manufactured). RULES: a part's doors stay inside the site (a
site ⇄ site seam is a `links` row, never a door row); a part never wears
`fx: 'site'` (no board, no setting); the house lights itself (`strips:
false`, `lights: []`, torches / candles / bulbs, ≤ `HQ_PROP_LIGHT_MAX`);
**THE PARK RULE**: a `railing_1m` run in every room and `riser_*` tiers in
every big one (a sloped ramp waits on 9.8's registry). The gallery (a
two-floor room, `shell.gallery`) is stage 2 renderer work — upstairs is
its own box room today. The wardrobe upstairs and the well in the cellar
stand as props where 9.3's `way` seams will hang. `npm test` runs
`hq-complex.test.js` (the sheet, the front door's lane, every door a pair
+ the complex connected, the production landing clear of every blocker,
the park rule, the link hooks, the source sites). Unseen live (RULE #1c):
the wallpaper tints, the `leaf: null` stair openings, the banister's
facing, the boiler's glow in a 2.7 m cellar.

## THE THIRD RING (the hall's GALLERY, HQ plan 8.4 / 9.3) + ROOM 345 · THE BERMUDA TRIANGLE (7.7 wave 2 begins) — 2026-09-16, local delivery
**THE THIRD RING**: `DOOR_HQ.rooms.central_egress.shell.ring3 = { h: 3.3,
inner: 20.6, outer: 24, thick: 0.35, railH: 1.05, stair: { from: 278, to:
312, rIn: 22.6, steps: 20 } }` (data.js) — a second ring slab 3.3 m over
the mezzanine (the same radii; `upperWallH` grew 5.4 → 6.6), ONE curved
flight off the mezzanine's walkway whose MASS stands on level 1 in that
arc (nothing else may stand there — doorhq.test.js checks doors and
props). The key is `ring3`, NEVER `gallery` (that is the box room's
two-floor slab). Doors / props / spots with **`level: 2`** stand on it:
the four EXPLORATION doors (engineering 90° · it 120° · observatorium
240° · executive 315°) — the mezzanine keeps the bays + the elevator
(hq-suites.test.js: 11 / 6 / 4). three-renderer.js: EVERY rotunda level
reader goes through **`_hqLevelY(S, level)` / `_hqLevelR(S, level)` /
`_hqLevelOf(S, y)`** — never write `level ? S.wallH` again
(hq-ring3.test.js refuses it); the ring is a LAYER read FIRST in
`_hqSurface`'s rotunda branch (`_hqRing3At(x, z, curY)`: a tread from
either level, the slab only for a walker already up there — a FREE query
is never the ring's — the rail band from the slab side, undefined over
the void), a mass in the air (`_hqRing3Air`) and a wall to the boom
(`_hqRing3Cam`); `_hqBuildRing3` (end of `_hqBuildShell`) builds the slab
cut over the flight's band + the strip inside it, the rails, the flight;
the rail joins `_hq.rails`. map.js's directory says THE GALLERY ·. The
car has no gallery stop. `npm test` runs `hq-ring3.test.js` (THE CLIMB by
the step rule alone). **ROOM 345 · THE BERMUDA TRIANGLE** (`prebuilt_
bermuda`, Hollow, `near: 'bermuda'`, tier 2): the 7.10 checklist end to
end — the board is TWO right triangles of `desert` shoal meeting at a
`deep_water` hypotenuse (NE → SW), a two-tile SANDBAR at the centre (on
the Δ it IS the nexus tiles (3,4) / (4,3) — the forge's two routes), the
corner buoys (floor torches), a `sea` motion at HALF the Dutchman's pace
(speed 2.5 — motion-maps' ≥ 5 rule is the three travellers' only; the
movers list is pinned there), the storm from round 3; the site room on
the Dutchman's moat recipe in daylight; `_NR_BUILDERS.bermuda` (before
the MOVING MAPS block) = the sand apron, the streaming sea, the
LIGHTHOUSE (`_hzLighthouse` scaled to the build's tile — it reads
CONFIG.tileSize) at the NW corner, the lantern BUOY + the ∠ 90° plate at
the SE. **THE WEIR**: `links.weir_bermuda` (route `deep`, a `pool` way
FREE at both ends — Room 8's west parapet corner, whose loungers moved
south for the landing, and the Triangle's north strip). Two tapes
re-homed (sacrifice / orb → 345; the hundred stays a hundred);
delta-maps.test.js expects 39 Δ boards. NOT BUILT: the waterspout,
Flight 19's flyover, the yacht as the quay, the HUD compass. Next in 7.7:
Tartaria, then the Tesseract. Unseen live (RULE #1c): all of it.

## THE URBAN BLOCK — THE STRIP + DOWNTOWN AS COMPLEXES (HQ plan 9.2 stage 4) — 2026-09-16, local delivery
Rooms 21 and 1954 are the FIFTH and SIXTH complexes: `site_prebuilt_strip_
chapel` / `_casino` and `site_prebuilt_downtown_lobby` / `_subway` (data.js,
the block right after the Dutchman's hold; `site` + `part`, no `roomNo`).
`siteRooms.backDoors.prebuilt_strip` = THE CHAPEL's motel door on the north
wall at x −0.2 (the Strip's ONE free lane — the highway holds −5 / −10);
`backDoors.prebuilt_downtown` = THE TOWER's lobby door on the **EAST wall**
(z 0) — Downtown's north wall carries three link doors, the lane rule's
full ration, so a back door may hang on ANY wall (the Backrooms' is south;
`_hqBuildSetting` clears every room door's lane). The casino has ONE door,
no clock, no window (hq-urban.test.js insists); the chapel's saloon door is
the way in. **THE SUBWAY's third station**: `links.subway_downtown` (`way:
'train'`) stands the train FREE on the platform's own track (`{ site, part:
'subway', wall: 'free', x: −1.5, z: 3, face: 90 }` — a link end on a
complex part, the spaceship's rule; the body = local x −9..15.4 → room z
12..−12.4 in a 30 m room) and its far end wears **`leaf: 'leaf_frame_only'`**
on Cyberpunk's north wall at x −0.2 — the first `way` link with a PLAIN
DOOR BACK (`hqLinkEndWear`: an end that names a leaf takes a door; the
hq-world seam test accepts it). Never a second train on a wall that
already has one: a wall-end train's front car spans x −9..3 from its mark
and runs through the next lane's door. Two procs in three-renderer.js (the
Phase 8 stage 2 block): `slot_machine` (block, `light` + `glow`; the reels
spin on a ticker — doorhq.test.js counts it as a room's light) and
`turnstile` (block; the tripod turns for the walker). Tapes: one per part,
re-homed from the garage / kitchen / cold room / dungeon (the hundred
stays a hundred); **`DOOR_HQ.findSpots.site_prebuilt_downtown_subway`**
pins the platform's finds onto the platform — a `way`'s blockers are laid
at build and `hqFindFree` cannot see them, so any room whose far corner
is a track / a train / a way object needs a pin. `npm test` runs
`hq-urban.test.js`. UNSEEN LIVE (RULE #1c): the reels, the tripod, the
train's arrival on the shorter platform, the east-wall lobby door against
Downtown's setting, the stair mouth on Cyberpunk's street.

## THE SPACESHIP COMPLEX (HQ plan 9.2 stage 2) + THE CHECKLIST SYNC BUG — 2026-09-15 rev 18, local delivery
Room 426 is the THIRD complex: `site_prebuilt_derelict_airlock` / `_hold` /
`_bridge` (data.js, the block right before H-WING; `site` + `part`, no
`roomNo`) behind THE AIRLOCK on the deck's north wall at x −6
(`siteRooms.backDoors.prebuilt_derelict`). **THE LUNAR ROUTE'S COLLARS
LIVE IN THE AIRLOCK**: `links.moon_derelict.b` / `derelict_saturn.a` are
`{ site, part: 'airlock', wall: 'w' | 'e', z, sub }` — a link end on a
COMPLEX PART is the rule for every future "below decks" seam (the
Dutchman ⇄ Atlantis next); the site stays ONE station on the line
(`hqWorldRoutes` reads stations as sites). `leaf_bulkhead` is a WIDE
leaf: every bulkhead door row says `wide: true` and stands ≥ 1.65 m from
a wall's end (doorhq.test.js). A compartment tape is the 9.1 rule (one
per part); the hundred is fixed, so a new part's tape comes off a floor
room's row in `HQ_TAPE_SHEET`. `npm test` runs `hq-spaceship.test.js`.
**THE CHECKLIST SYNC BUG**: data.js `mergeProgressBlobs`'s `KEY_RE`
refused `:`, so the progress sync (client AND server — server.js runs the
same function off data.js) dropped every `site:<map>:<cond>` flag two
seconds after the commit and the stabilization checklist un-ticked.
Fixed (`:` is legal; achievements.test.js guards it) — **ship data.js to
Render as well as R2 for this one**. A sudden-death Key win files THE
KEYS through `state._winCause` (battle.js; reset beside `_winCondition`).

## THE FLYING DUTCHMAN COMPLEX (HQ plan 9.2 stage 3) — 2026-09-15 rev 19, local delivery
Room 1717 is the FOURTH complex: `site_prebuilt_revenge_gundeck` / `_cabin` /
`_hold` (data.js, right after the spaceship's bridge; `site` + `part`, no
`roomNo`) behind THE COMPANIONWAY on the main deck's north wall at x −5
(`siteRooms.backDoors.prebuilt_revenge`, `leaf_shabby_wood` = the site's
own single leaf). Ship frame: bow EAST (+x), aft west, port north,
starboard south — the cabin's stern windows are a `false_window` on the
WEST wall. **THE DEEP's hatch lives in the hold**: `links.revenge_atlantis
.a` is `{ site, part: 'hold', wall: 'w', z: 0, sub }` — a link end on a
complex PART is the rule for every "below decks" seam (the spaceship's
collars were the first); no link door stands on the main deck, the site
stays one station. **The ship's kit below decks = four `base: 'misc'`
catalogue rows** (`ship_cannon` span 2.2 / foot 0.9 / block — muzzle −X at
face 0, so face 0 runs out to port and 180 to starboard; `sea_chest`;
`ship_anchor`; `ship_lantern` = `ceil` + `light`, in doorhq.test.js's
room-light regex) reading the files `_MISC_GLB` names — never a second
file for the same thing (MODEL_INDEX §9). Tapes: one per deck (the boiler
/ server / ritual rooms gave theirs up; the hundred stays a hundred).
`npm test` runs `hq-dutchman.test.js`. Unseen live (RULE #1c): the guns'
facing, the lanterns under a 2.7 m beam, the stern window's glow.

## THE LOBBY THEME + THE TITLE THEME'S LIMITS + concrete_floor rev (2026-09-15, local delivery)
audio.js `doorLobby` = R2 `music/door_lobby.mp3` (the user's HQ track, MASTER
B4; `_R2_MUSIC` / `_LOCAL_MUSIC` / `AUDIO_BASE_VOLUMES`, pause-menu name in
ui.js `_TRACK_DISPLAY_NAMES`). map.js `syncMusicToState`: in the building
(`GS.HQ`) it plays `doorLobby` while `_hqCurRoom` is in
`_HQ_LOBBY_MUSIC_ROOMS` (foyer · central_egress · ring_g · ring_m — the
arrival and the main circular hall) and `mainTheme` in every other room
(`_hqEnter` re-syncs on every room entry, walks included). The `doorMuzak`
slot is retired. **ff7 (`titleTheme`) is the TITLE SCREEN's alone**: the
menu key is `titleTheme` only while `gameState === GS.TITLE`;
`enterGameFromTitle` and the campaign map play `mainTheme`.
**concrete_floor.png was repainted in place**: the sprite URL carries
`?v=20260915` (sprites.js `TERRAIN_SPRITES.concrete_floor` + the
training_floor fallback, ui.js's two dome URLs) because the sheet is
immutable-cached — bump that query on the next repaint; every loader reads
`TERRAIN_SPRITES[key][0]` verbatim, so the query is harmless.

## THE ROUTES + THE WORLD TAB (HQ plan 9.3 expansion) — 2026-09-15 rev 7, local delivery
`DOOR_HQ.links` (data.js) is the WHOLE route table: 32 live links on nine
lines named in **`DOOR_HQ.routes`** (`lunar` · `deep` · `divine` · `bases`
· `woods` · `ley` · `highway` · `wonderland` · `seams` — `{ label, sub,
color, dashed? }`); every built site but the Looking-Glass is a station
(its 9 m room has no landing off the board — it joins when the room grows
or 9.5 reaches it). RULES for a new link: an ordinary door end is a board
room's NORTH wall at x −0.2 / −5 / −10 (≤ 3 link doors per room, lanes ≥
4.4 m apart, west of the console lane, clear of the corner masts and the
x 5 signboard — hq-world.test.js's production landing test decides),
never a rank leaf, always a `why`, a `route` the catalogue names, two-way
(no one-way route without a verified way back). **`hqLinkLive(link)`** is
the ONE liveness rule (both ends built + well-formed + catalogued wear →
`{ a, b, wearA, wearB }`, else held at BOTH ends) shared by `hqLinkDoors`
and **`hqWorldRoutes(curRoom)`** (a line per route with a live link;
stations = SITES — a seam off a complex's part is the house's, Room 13 is
one station on `woods` + `seams`; walked from an end, `lines.length > 1`
= interchange, `here` = the viewer's room or site; `legs[].fromRoom /
toRoom` keep the real ends). THE WORLD = the directory's second sheet
(map.js `_hqWorldHtml`, under the register): a subway-map SVG per line in
its ink (`.hq-world-*` in styles-base.css, `--hq-line`), a dot per site
with its number, dashed legs for seams, a ring at an interchange, `.here`
filled, GO = `data-room="site_<id>" data-at="egress"` (the register's own
rule; doorhq.test.js counts that literal — 3 now). Older tests that count
a room's doors must filter `!d.link` (links append after a room's own
rows). Viewer-local (RULE #2). Still open: the suites, the star chart's
route lines, the other eight `way` kinds, the airlock / hold ends.

## THE FINDS + THE TAPES (HQ plan 9.1 stage 1) — 2026-09-15 rev 12, local delivery
Glowing objects the walker TAKES, and THE HUNDRED TAPES. **Data (data.js,
the block after `hqCaveFitRooms()`)**: `HQ_TAPE_SHEET` → **`DOOR_TAPES`**
(T001…T100 — two per built site in `siteRooms.built` order, one per
complex part, one per exploration-floor room; NEVER the hall, the foyer, a
lobby or a corridor; `where` = the room, `site` for the hint rule, `clip:
null` until the user's file is on R2 `Assets/door/tapes/` — `hqTapeClipUrl`
never invents a path; titles + captions are Claude's DRAFT, `draft: true`,
A15). **`DOOR_HQ.finds` is GENERATED** by `hqBuildFinds()` — never
hand-edit a row: per tape room a `tape:Tnnn` row + ONE `pay:<room>` row
(`daily: true`; `HQ_FIND_RULES.pay` 30 on a board room's walkway,
`payDeep` 45 elsewhere). Spots: `hqFindSpot(roomId, salt, avoid)` = the
free 0.5 m grid point FARTHEST from the way in (`hqFindFree`: inside the
walls, off every floor prop's footprint, native / agent / counter reach /
door landing / spawn / mast, a walkable cell the first door reaches in a
cave, off the board + moat on a board room; `HQ_FIND_RELAX` loosens twice
for a small room); a site's SECOND tape is ON THE BOARD
(`hqFindBoardSpot`: a wall cell two levels up → **`hard: true`** — the
walker never reaches it, 9.5's door gun will; else a climbed cell; `cell`
+ `y` = the cell top); **`DOOR_HQ.findSpots[roomId] = { tape, tape2,
pay }`** pins a spot by hand (the cold room; a `y` = a shelf). RESERVED
kinds `potion` / `item` / `cube` are refused by the collector until an
inventory owner exists — never fake a reward. **Rules**: `hqFindsInRoom
(roomId, profile, now)` (the taken and the dark dailies removed;
`hqFindLiveToday` = `hqHash(date|id) % dailyMod === 0`),
**`hqCollectFind(profile, id, now)`** writes the claim AND the pay into
the profile OBJECT handed in (`door.hq.finds = { taken: { id: true |
date }, tapes, pay }`, `account.gold += amount`) and returns the beat —
THE CALLER SAVES ONCE (map.js `_hqTakeFind`: load → collect →
`saveProfile` → `_refreshWallets`; never `creditLocalGold` inside the
take — one transaction), `hqTapeCount`, `hqTapeShelf` (found / `hint` =
another tape of the same SITE is on file / room / clip). **Renderer
(three-renderer.js)**: procs `find_tape` / `find_pay` / `tape_shelf`;
`_hqPlaceFinds(room)` after the props → each row under `_hqFindSparkle`
(ring + core + six motes on a ticker + a point light, `HQ_FIND_LIGHT_MAX`
4), a walkway row nudged by `_hqSettingFreeSpot`, a board row on its cell
top, a cave row on `_hqCaveTop`; `_hq.finds`; `_hqFindTarget` offers kind
**`find`** within `HQ_FIND_REACH` 1.6 m and |Δy| ≤ 1.8; `hq.takeFind(id)`
drops it with a burst, no rebuild; `hq.finds()` lists them. Dev
`EW_HQ_FINDS_ALL` / `EW_HQ_NO_FINDS`. **Flow (map.js)**: `_hqInteractTarget`
→ `window._hqTakeFind(t)` (no panel), the prompt verb TAKE, `_hqToast`
(`#hqToast`, index.html / styles-base.css), the strip pill `#hqTapes`
(`_hqOpenTapes`), the OFFICER sheet's THE TAPES row. **THE SHELF** = Room
360's counter `shelf` (east wall; the south `metal_shelving` became the
`tape_shelf` prop) → `overlay: 'tapes'` → `_hqTapesHtml` (the CRT set: a
found tape's clip as `<img>` / `<video loop muted>`, a blank cassette =
STATIC, the 10 × 10 spines, `[data-tape]` re-renders the panel in place,
`_hqTapeSel`). ONE home (hq-floors.test.js). Viewer-local (RULE #2).
`npm test` runs `hq-finds.test.js`. Adding a tape = a `HQ_TAPE_SHEET` row
(the count must stay 100 — the test insists); adding a find kind = the
collector's branch + a proc + `HQ_FIND_COLORS`. Unseen live (RULE #1c).

## THE DUNGEON — the cave is a CAVE GRID (HQ plan 9.3 stage 2) — 2026-09-15 rev 11, local delivery
**SUPERSEDED 2026-09-17 — THE TERRAIN ROOMS (below): no room wears `cave` any more; the grid code stays for a room that does.**
The seven cave chambers (`site_prebuilt_hollow_earth_*`, data.js, the
block before H-WING) are Pokémon Victory-Road dungeons in 3D now: a
`kind: 'box'` room may carry **`cave: { rows, legend?, floor, ledge,
rock, tint }`** — a hand-authored ASCII GRID that IS its floor. One cell
= `HQ_CAVE_CELL` 1.75 m (a battle tile); one LEVEL = `HQ_CAVE_LEVEL`
0.875 m (half a tile). **`HQ_CAVE_STD`** is the legend every room
shares: `#` rock (to the ceiling; the box walls stand behind it), `.` /
`0`–`9` floor at that level, `~` water (bed −1, WADED), `W` deep water
(never), `L` lava (never), `P` a pool whose bed is lvl 1 (a terrace
pool; its spill into `~` is a WATERFALL), `Y` the lava lake in a lvl-4
shelf, `=` planks at the floor over `W`, `B` the rope bridge (lvl 4)
over `P`, `H` obsidian (lvl 4) over `Y`, `@` obsidian floor, `O` obsidian
at lvl 4, `K` crystal (lit), and THE RAMPS — a cell rising ONE level
toward a side, the letter its base level: `a`–`f` north (0–5), `g`–`l`
south, `m`–`r` east, `s`–`x` west (**never reuse a lowercase letter in
a room legend** — `o` was the obsidian floor and became the lvl-2 east
ramp). A room's `legend` extends it (`{ lvl, key?, slope?, fluid?,
bridge? + under?, glow?, walk? }`). RULES: a ledge two levels up is a
WALL until its ramp (the walker climbs one level per step —
three-renderer.js `_hqSurface` reads `_hq.site.L`), never walks off
more than HQ_DROP_MAX, wades a `~` / `P` at HQ_CAVE_WADE under the
sheet, never enters `W` / `L` / `Y` or rock; a door LANE is three cells
wide at the wall, level with its sill — **a door stands at its lane's
level** (`hqCaveDoorY` → the renderer's `_hqDoorFloorY`: LEVEL −6 is on
the high tier, the fissure on the hot shelf, the mouth's exit on the
lip), free-standing WELLS on their tiers; the shell's `w` / `d` are
FITTED to the grid (`hqCaveFitRooms()` after the links refresh — never
hand-type them); `wallH` = `h`. Reads (data.js, on `window`):
`hqCaveCompile(cave, h)` → `{ w, h, cell, L, rockH, halfW, halfD,
cells[y][x]: { ch, lvl, key, walk, fluid, rock, slope, bridge, under,
glow, top, sheet } }`, `hqCaveInfo(roomId)` (cached), `hqCaveCellAt /
hqCaveTopAt / hqCaveFeet` (metres, room frame — the walker's feet),
`hqCaveDoorY(room, door)`, `hqCaveEdgeH`, **`hqCaveReach(info, cx, cy)`
= the walker's own step rule as a BFS** (hq-cave.test.js proves every
door reaches every other in every chamber — THE DUNGEON IS ALWAYS
SOLVABLE; author a grid, run the test, never guess), `hqCaveDoorCell`,
`hqCaveRooms`. Renderer (three-renderer.js, before `_hqBuildSiteBoard`):
**`_hqBuildCave(room)`** (called from `_hqEnter` on `room.cave`; sets
`_hq.site = { cave: true, info, NX, NY, L, … }` — `_hqSiteCellAt` is
oblong-aware now) draws instanced tops / ledges per level / the
jittered rock border, ramp WEDGES (`_hqCaveWedge`), bridge decks with
rope rails (`_hq.rails`), fluid pits with the battle's animated sheet
per key (`_hq.moatTick.keys` — `_hqTickMoat` ticks water AND lava),
WATERFALLS where a sheet meets a lower one, one point light per lava
lake, crystal glows, stalactites; **`_hqSiteFloorY(sc, x, z)`** is the
ONE feet read (a ramp interpolates, a pool wades, a bridge is its deck;
a site board keeps its old blockers) used by `_hqSurface`, `_hqAirOK`,
the jump landing and `_hqCamBlocked` (the boom never enters rock);
doors / ways take `y0 = _hqDoorFloorY`, counters / floor props / natives
/ the walker stand on their cell (`_hqCaveTop`); the box shell draws NO
floor plane under a grid. New procs `cave_torch` (a stake in the floor)
and `crystal_cluster` (both catalogued with a `light`; doorhq.test.js
lists them as room lights). THE PARK RULE in a cave = a `railing_1m` run
+ a SLOPE CELL (not a riser; `_hq.ramps` is filled from them for 9.8).
THE CAVERN (52 × 42 m, 30 × 24 cells, h 11) has the routes: the
terrace's ramps, the hall's stair, the ford under the fall, the plank
bridge, the long ramp up the east wall, the causeway across the lava
lake, the rope bridge over the pool. `npm test` runs `hq-cave.test.js`
(the sheet, the wells on three tiers, the lanes, the rock border open
only at lanes, the solver from every door, props / spawn / natives on
walkable cells, the wedge, the renderer sites). Adding a chamber = a
`cave.rows` grid + doors on lanes + `railing_1m` + a ramp letter; adding
a legend kind = `HQ_CAVE_STD` + a branch in `hqCaveCompile` /
`hqCaveFeet` + its look in `_hqBuildCave`. NOT BUILT: a ROCK ceiling
mesh (the box ceiling + stalactites stand in), a stream that flows (the
sheets drift in place), the door gun's surface set off the grid. UNSEEN
LIVE (RULE #1c): every chamber — the wedges' shading, the rock's
jitter against the box walls, the falls, the lava light, the rope
rails, a door frame standing on a 5.25 m tier, the wells on the crag.

## THE WELLS AND THE CAVE (HQ plan 9.3) — 2026-09-15 rev 10, local delivery
Every well in the world drops into ONE cave. The CAVE is the SECOND
complex and it is HOLLOW EARTH's (`site: 'prebuilt_hollow_earth'` +
`part`, no `roomNo` — `hqRoomNo` reads the threshold's 180 through
`site`, the register lists the site once, `hqRoomSite` marks it WILD):
seven hand-authored box rooms in `DOOR_HQ.rooms` (data.js, the block
right before H-WING) — `site_prebuilt_hollow_earth_shaft` (THE WELL
ROOM: one free-standing `way: 'well'` head per well, the gallery west),
`_gallery` (the crossroads, six doors), `_vent` ⇄ Room 666 HELL,
`_blast` ⇄ Room 555 D.U.M.B., `_adit` ⇄ Room 88 AGARTHA, `_mouth` ⇄
Hollow Earth's own BOARD ROOM (the complex's way in / out) and
`_oubliette` (the dead end behind the portcullis; its back wall is the
FOURTH CELL of Room 24601 — a `secret: true` pair, eight secret doors
now, and the dungeon's three `cell_bars` moved to z −3.2 / −1.0 / 1.2 to
free the panel at z 2.7). **THE SIX WELLS** are `links` rows on the new
dashed route **`routes.undercroft`**: the GARDEN (1618 — a facility room
seaming into a wild one, the H-Wing → Backrooms precedent, never gated),
the Haunted House's CELLAR (rev 6's `haunted_hollow` RE-POINTED and
renamed `well_cellar` — one row edit, never a duplicate), CAMELOT,
SKINWALKER RANCH, NUKETOWN and GÖBEKLI TEPE (the four on their board
rooms' free north lanes). Two engine additions carried it: a link END may
name its own **`sub`** and **`verb`** (`hqLinkDoors`; the heads read THE
GARDEN WELL · CLIMB UP — map.js's prompt reads `t.door.verb` before the
kind's), and **`hqRefreshComplexLinks` also refreshes any hand-authored
room a link names by `end.room`** (that is how the garden grows its well
door; it still never accumulates). LANE RULES (they moved): a site room
may carry **four** link doors when the lanes are ≥ 4.4 m apart and inside
the wall (Agartha's fourth is x −14.5), and a `way` on a site room hangs
in ANY free lane west of centre. A cave chamber is lit by its own torches
/ bulbs / crystals (`strips: false`, `lights: []`, ≤ `HQ_PROP_LIGHT_MAX`),
wears the terrain sheet's `cave_wall` / `cave_floor` and keeps THE PARK
RULE (a `railing_1m` run in every chamber, `riser_*` tiers in the big
ones). NEVER place `asteroid_*` or `utility_box` as a room prop (they are
board / horizon pieces — door-kit-batch.test.js fails); the cave's rocks
are `concrete_pillar`. `npm test` runs **`hq-cave.test.js`**. NOT BUILT:
the stage-2 ROCK shell (`kind: 'cave'`) and the stream as a waded sheet
(the shaft's ankle-deep water is a line of copy today), the oubliette's
roamer (9.4) and its tapes (9.1). Unseen live (RULE #1c): all seven
chambers — six well heads in one room, the cave sheets on a box shell,
the portcullis / hell arch as interior doors, the fourth cell's slab.

## THE SUITES (HQ plan 9.3 "the crowding" / C-27) — 2026-09-15 rev 9, local delivery
A DEPARTMENT gets ONE hall door onto its own LOBBY; its rooms hang off
that. Three new hand-authored box rooms in `DOOR_HQ.rooms` (data.js, the
block right after `padded`), each wearing **NO `roomNo`** (a lobby — the
foyer and the penthouse are the precedent, so `hqRoomRegister` skips it):
**`medwing`** · THE MEDICAL WING behind the ground ring's hospital door at
**210°** (`ward` → Room 1111, `interrogation` → Room 1984; Room 5150 stays
behind the WARD's own cell door), **`recwing`** · THE RECORDS WING behind
the wired double door at **240°** (`records` → Room 42, `clockroom` → Room
247) and **`execwing`** · THE EXECUTIVE SUITE behind the mezzanine's house
door at **315°** (`trophycase` → Room 111, `continuity` → the Bureau).
The ground ring is 13 → **11** doors (225° and 255° are free wall), the
mezzanine 11 → **10** (290° free). **THE RULE a suite keeps**: every moved
room's own `egress` id, leaf, `wide`, counters, cast and NUMBER are
untouched — only the FAR END of its way out moved (`central_egress@<id>`
→ the wing), and the three hall doors keep their ids (`medical` /
`records`, plus the new `executive`) so a remembered landing still
resolves. **THE BUREAU'S GATE AND ITS `№ — CONTESTED` STAY ON THE
BUREAU'S OWN DOOR** (GATEKEEPER + 24 Keys), which now hangs on the
suite's north wall: the suite is ungated, so a recruit walks it, reads
the notices and does not go in; `hqRoomNo('continuity')` still finds the
number (the helper scans every room's doors). A lobby LAUNCHES NOTHING
(C-27) — doors, a bench and a rail; THE PARK RULE is met with a
`railing_1m` run in each (the ramp waits on 9.8). The one non-data
change: map.js's door panel reads `d.id === 'continuity' || d.id ===
'executive'`, so the canon notices are still readable from the hall at
any rank (rev 2's promise). `npm test` runs **`hq-suites.test.js`** (the
lobbies + the register, one hall door per department + the freed angles +
the door counts, full reversibility, the gate + the number, C-27, and the
PRODUCTION landing on all nine lobby doors). Adding a suite = a lobby
room + re-point the rooms' `egress` far ends + a row in the test's
`SUITES` table. Unseen live (RULE #1c): all three lobbies, the two house
doors in the executive suite, the landing through a WIDE door in a small
box room.

## THE SEAMS THAT ARE NOT DOORS (HQ plan 9.3 `way`, the first two) — 2026-09-15 rev 6, local delivery
A `DOOR_HQ.links` row may carry **`way: '<kind>'`** instead of a `leaf`:
the seam is an ENTRYWAY OBJECT, not a door. **`DOOR_HQ.ways`** (data.js,
before `links`) is the catalogue AND the gate — `{ verb, sub, sfx, w, h }`
per kind; `hqLinkDoors` holds back a `way` it does not list, and one
unsupported end holds the WHOLE link back (never half a seam). Shipped:
`wardrobe` (upstairs in the Haunted House, east wall z 0.4 ⇄ Camelot's
north wall x −5 — the user's Narnia) and `well` (FREE in the cellar's floor
at (−2.6, 1.6) facing east ⇄ Hollow Earth's north wall x −5). A link end is
a wall end (`wall` n/s/e/w + x|z) or **free** (`wall: 'free', x, z, face`
= the heading its opening faces); an end may override the wear with its
own `leaf` (a plain door back) or `way`. Reads: `hqLinkEndOk`,
`hqLinkEndWear` (on `window`). The generated door row wears `way`, `leaf:
null`, the kind's `sub`, the link's `why` / `note`. **Renderer**
(three-renderer.js): `_hqBoxWall(room, 'free', spec)` returns the same
{ wx, wz, nx, nz, yaw } record off the object's own plane, so the scan,
the press-in, `_hqGoTo` (lands 2.4 m in front, facing AWAY — you climb
OUT of the wardrobe) and `_hqCamInDoorway` need nothing; `_hqWayBuilders
[kind](U, { free, cat, door, room })` → `{ g, motion, ow, oh, plateY }`
in the door's local frame (+Z into the room), `_hqBuildWay` places it and
pushes a door record (`way`, no lamp — `_hqLampApply` guards `lens`) with
`motion = { mode: 'way', tick(k) }`, driven by `_hqTickDoors` when the
walker stands at it; the press-in fires at 0.55 like a swinging leaf.
map.js: the prompt reads `DOOR_HQ.ways[kind].verb` (`_hqWayCat`), the room
change plays the kind's `sfx`. audio.js: `wayCreak` / `wayWell` recipes
(quiet; the buzz stays muted). **Adding a kind = a `DOOR_HQ.ways` row + a
builder in `_hqWayBuilders` + a link row** — hq-world.test.js diffs the
catalogue against the builders, runs every builder on a stub scene, and
checks both ends, the plates, the sounds and the production landings. The
other eight kinds in the plan's table (mirror · pool · painting ·
fireplace · phonebox · screen · train · closet) are not built. Viewer-local
(RULE #2). Unseen live (RULE #1c): the objects themselves.

## PHASE 8 STAGE 2 — TWO MORE FLOORS: 2 · THE WORKS + 4 · THE LABS (HQ plan §8.6) — 2026-09-15 rev 14, local delivery
Eighteen hand-authored box rooms in `DOOR_HQ.rooms` (data.js, the block
right before THE HAUNTED HOUSE COMPLEX), two new stops on the car
(`DOOR_HQ.elevator.stops`: `4` above 3, `2` between 3 and M — seven; the
car panel proc lights whatever the stops list). `hqStage2Rooms()` lists
them by floor. **2 · THE WORKS** (`works`): Room 1000 `warehouse` (belts
`conveyor` / `conveyor_z` with leaves riding them, `robot_arm`s opening and
shutting one door for ever, `door_stack`s), Room −1 `incinerator`
(`door_furnace`; THE MANIFEST panel = the register's SEALED sites), Room Y
`autopsy` (`autopsy_table` — the parts tagged; `hqDoorParts`), Room ½
`doorgarden` (`planter` + `door_vine` + `grow_lamp`), Room 24/7 `control`
(`monitor_stack` ×3; THE FEEDS panel = `hqSecurityFeeds(curRoom)` — one
row per numbered room, LIVE for yours), Room ? `lostfound` (`lost_shelf`;
THE CLAIMS BOOK = `hqClaimsBook(profile)`), `stairwell`, `tunnel`
(`track_bed` / `platform_edge` / `train_car` / `tube_map` (= `DOOR_HQ.
routes`) / `departures_board`), Room 1893 `carnival` (`bigtop`,
`ferris_wheel`, `carousel`, `fortune_tent`, `high_striker`, `ticket_booth`,
`popcorn_cart`, `festoon`). **4 · THE LABS** (`labs`): Room REM `dreamlab`
(`eeg_rack`, `dream_screen`; THE DREAM LOG = the last roster via
`_ewLoadLastParty`), Room 0dB `tank` (`iso_tank`), Room * `mandela`, Room
9 `upsidedown`, Room 4B `closet4b` (+ `supply` behind the blast door),
Room II `disposal` (`lone_gun`, `garbage_chute`). **RULES THAT CAME WITH
IT**: (1) **a box door may carry `y`** (metres) — it stands at that height
(three-renderer.js `_hqDoorFloorY`; the build, `_hqGoTo`'s landing spot
and the doorway camera blocker read it) — put a platform of blockers
under it (THE STAIRWELL: `stair_landing` at y 5.75, the `landing` door at
y 6; the walker descends three flights of `stair_step` / `stair_step_x`
blockers stacked by `y`, 0.25 m a tread, and DOWN at the bottom lands on
`stairwell@landing` — THE LOOP). For that: a blocker's base is the prop's
own `y` (`y: y0 + (p.y || 0)` at both `_hqPlaceProps` sites) and the step
rule skips a raised blocker only when it is above the floor AND above the
walker (`b.y > y + 1.2 && b.y > curY + 1.2`) — never "fix" that back.
(2) **`flip: true`** on a prop hangs it from the ceiling upside down (a
ceiling prop stands on the floor upside down): `rotation.z = π`, a wall
prop's `mount` measured down from the ceiling, NO blocker (Room 9). (3)
**ROOM DIALOGUE = `say` on an `npcSpots` row** (a line or a list): whoever
stands there — a race-hinted native or the roster draw — says THAT before
any roster line (three-renderer.js `sayOf` → `_hqSpawnCharacter` `line`;
map.js `_hqNpcPanelHtml` reads `t.line` first). The bathroom's spot is
the conspiracy theorist at the sink now; Room X has a watcher, the
cubicle floor a politician. **`clone: true`** on a spot spawns the
walker's OWN vessel (Room II: THE OTHER ONE). Every `say` is Claude's
DRAFT (A15). (4) **a variant with `when: { each: true }`** is rolled on
EVERY entry — data.js `hqVariantRollEach(roomId, profile, n, last)` (the
sheet + every `each` variant, seeded by variantSeed + day + n, never
twice the same in a row), applied by map.js `_hqEnter` on every entry
(`_hqEachN` / `_hqEachLast`, `window._hqMandelaLast` = what you
remember — THE FRAME panel); the visit roll (`hqVariantRoll` /
`hqRollRoomVariants`) skips `each` variants and rooms that have only
them. (5) **Supply Closet 4B's gate is on THE BLAST DOOR** (`leaf_vault`,
`minClearance: 6`), never on the vestibule; EVACUATION is a panel whose
button is a room move to the foyer (`data-room="foyer" data-at="street"
data-evac`) — never a second home for `_hqExitToMenu` (C-27). (6) THE
PARK RULE in every room (a `railing_1m` + a `riser_*` or the stair's own
treads — the test insists). Fourteen by-id panels (`line`, `manifest`,
`parts`, `bed`, `feeds`, `claims`, `departures`, `booth`, `log`, `lid`,
`frame`, `note`, `evac`, `chute`) in map.js `_hqCounterPanelHtml`; 37
procs in `Object.assign(_hqProcBuilders, {…})` "PHASE 8 STAGE 2" (with
`_hqMiniDoor`, the small leaf they share); the garage grew a `tunnel`
door (e, z −7). Numbers are REC (the user rules). No rank leaf on any of
it (doorhq.test.js). `npm test` runs `hq-stage2.test.js`. NOT BUILT:
tapes for the new rooms (the sheet is fixed at 100), a train that arrives
(the `train` way), cast on the new floors, sounds. UNSEEN LIVE (RULE
#1c): all of it — the treads under the walker and the boom on the
landing first, the belts' pace, the flipped office, the Mandela swap.

## THE DOOR GUN — THE PORTABLE THRESHOLD (HQ plan 9.5 stage 1) — 2026-09-15 rev 13, local delivery
Two freestanding DOOR-issue doors the walker PLACES. **F** draws / holsters
(**Q** holsters a drawn one before it rings the bell; RIGHT CLICK too); a
GHOST frame follows the aim — three-renderer.js **`_hqPortalAim`**: the
camera's own ray marched against the room's WALKABLE SURFACE SET
(`_hqPortalSurf` = `_hqSurface(x, z, null, true)` lifted to
`_hqBlockerFloor`; the ray ends at a wall / rock / off the room and at a
blocker's side via `_hqAirClearOfBlockers`), green legal / red refused
(`fluid` · `near` 1.2 m · `twin` 1.6 m · `door` a room door's lane · `room`
the frame's footprint). **LEFT CLICK** places: `_hqPortalPlaceAim` →
`opts.onPortalPlace(spec)` (map.js `_hqPortalPlaced` — ONE profile
transaction: load → data.js **`hqPortalPlace`** → save) → the slot →
**`_hqPortalBuild(slot, spec)`**: the DOOR frame + seal + THRESHOLD A / B
+ the catalogue leaf on a swing pivot, pushed into `_hq.doors` as a FREE
box-wall record (`_hqBoxWall(room, 'free', …)`, `door.portal`, `verb:
'STEP THROUGH'`, `action: { portal }`) so the scan / swing / press-in /
`_hqGoTo` / `_hqCamInDoorway` read it unchanged; three discs on the leaf
line (`blocker.portal = slot`) make the shut door a wall from behind.
PORTAL'S RULE (data.js `hqPortalNextSlot`): an empty slot first (A, then
B), else the OLDER moves. ONE record, `door.hq.portal = { issued, a, b,
last }` — **`hqPortalStatus(profile, { force })`** is the ONE read;
`hqPortalRecord` / `hqPortalIssue` (KEYHOLDER + `HQ_PORTAL_RULES.cost` 24
Keys spent from the issued ledger `door.hq.keys`) / `hqPortalClear` (a
fresh arrival from Play, map.js `_hqRecordVisit(null)` — the rope is for
one visit) / `hqPortalLeaf(roomId)` (a site room's own threshold leaf when
it swings, else `leaf_coffee`, NEVER a rank leaf) / `hqPortalDoorsIn` /
`hqPortalSafeRoom` (= not `hqRoomSite`). The renderer rebuilds the pair's
doors in the current room on every entry (`_hqBuildPortals(room, opts)`,
`opts.portal` from map.js `_hqPortalOpts` — a fresh arrival hands none).
Walking into one (E or the press-in; `_hqInteractTarget` /
`_hqWalkThroughDoor` read `t.door.portal` FIRST) → map.js
`window._hqPortalStep(slot)`: the twin in this room → `hq.portalHop`
(`_hqGoTo('portal:<slot>', true)` + the latch, no rebuild); another room
→ `_hqGoRoom(twin.room, 'portal:<slot>')`. ISSUE = the QUARTERMASTER door
panel's row (`[data-portal-issue]` → `window._hqPortalIssue`, then
`hq.portalIssued(true)` — no rebuild); dev `?portal` / `EW_HQ_PORTAL`
(`_hqPortalForce`). Strip pill `#hqPortal` (click = draw), OFFICER sheet
row, `.hq-hints.portal`. API: `hq.portalDraw / portalDrawn /
portalIssued / portalAim / portalPlace / portalHop / portalRemove /
portalDoors`. Viewer-local, nothing on `state`, nothing relayed (RULE #2);
the Door Agent's Knock Knock stays the race's own object on the board.
`npm test` runs `hq-portal.test.js`. RULES: the walker's key line is
pinned by hq-floors.test.js (`… || k === 'q' || k === 'p') return k;` —
add a key BEFORE q); anything new `_hqEnter` (map.js) references must be
guarded with `typeof` — scene-lifecycle.test.js evals it alone. Unseen
live (RULE #1c): the ghost, the frame's scale, the swing, the hop's flash,
the cross-room landing.

## THE DOOR GUN rev 2 — ANY SURFACE, TWO BUTTONS, TWO COLOURS (2026-09-15, local delivery)
The user's brief: "it should place a door on whatever surface you aim it
at — walls and ceilings — FLAT on the surface, so I can fall down two
portals forever; two buttons for Door A and Door B; always two different
colours." All of it, in the same three files. **THE AIM** takes THREE
surface kinds now (three-renderer.js `_hqPortalAim(slot)`): the room's own
CEILING plane (`_hqPortalCeil` — a box room's `shell.h`, a bay's `wallH`;
an OPEN room and the hall's dome have none), the walkable FLOOR set
(`_hqPortalSurf`, unchanged) and the WALL — the first point the ray cannot
occupy (`_hqPortalSolidAt` = no surface / inside the ground / a blocker's
side), bisected by **`_hqPortalWallHit`**, whose normal comes off the
SOLIDNESS GRADIENT either side in x and z (falling back to the ray's own
heading). Refusals unchanged but for two: a CEILING is never refused for
being close (that is the trick), and the twin gap is **3D** — a floor
hatch under a ceiling hatch is a COLUMN, not a clash. `_hqPortalFits`
carries the footprint rule per kind (a floor level either side; solid
behind and clear in front at every corner of a wall / ceiling opening).
**THE DOOR LIES FLAT ON THE SURFACE**: `_hqPortalBasis(face, surf)` =
local +Z = the surface normal, local +Y = the door's own up (world up on a
wall, the officer's heading laid flat otherwise) → a quaternion off
`makeBasis` (verified headlessly against real three: right-handed in every
case, and the WALL case reproduces the old `rotation.y` with zero pitch,
so a wall door is the standing door it always was, dropped to the floor
when the aim is low). The opening's CENTRE lands on the aim, 4.5 cm clear
of the surface. A flat door keeps its leaf standing open (`_hqTickDoors`),
wears no sill / cap / seal plate, and lays **NO blockers** — you walk onto
a hatch; a wall door keeps its three discs. The record carries
`portalSurf` / `px,py,pz` / the normal. **THE CROSSING**: a wall door is
still walked into (the press-in / E — it is skipped by `_hqTickAutoEnter`,
`_hqCamInDoorway` and the box branch of `_hqFindTarget` for a flat one). A
FLAT door is crossed by TOUCH — **`_hqTickPortalCross`** (run from
`_hqFrame` right after the walker's tick) reads the FEET against a floor
hatch and the HEAD against a ceiling one (`_hqPortalInMouth`), remembers
the entry speed and reports it (`opts.onPortalCross` → map.js
`_hqPortalStep`). **`_hqPortalHop(slot, opts)`** leaves along the twin's
OWN normal: out of a ceiling hatch you come out below it still falling
(the entry's speed, ≥ 2 and ≤ 18 m/s — the clamp is the terminal velocity
that keeps a 60 fps step inside the 1.6 m mouth band), out of a floor
hatch you are thrown UP when you came in fast and stand on it when you did
not, out of a wall door you step clear as before. The mouth you came out
of is **HELD** (`H.portal.hold`) until the body leaves it, so the pair
never re-fires on itself. Simulated headlessly with the shipped numbers
(scratch harness, not a playtest): floor at 0 + ceiling at 2.7 m = a fall
that never lands, terminal in ~1 s. map.js throttles the crossing's SFX to
one every 260 ms (the loop crosses ~30×/s — the beat sang thirty times).
**TWO BUTTONS**: LEFT CLICK places THRESHOLD A, RIGHT CLICK places
THRESHOLD B (right-click no longer holsters — F and Q do). The slot is
explicit end to end: `_hqPortalPlaceAim(slot)` → `spec.slot` → data.js
`hqPortalPlace` (`spec.slot` / `opts.slot`, else the old Portal order), so
a named slot MOVES ITS OWN ROW and never blocks itself in the aim.
**TWO COLOURS, ALWAYS**: `HQ_PORTAL_COLORS.a` cyan `#49b0ff` / `.b` amber
`#ff8a2b` paint the frame's tint, both jamb lamps, the mouth glow and THE
APERTURE (a new additive pane + rim filling the opening — the read that
says A from B across a room); `HQ_PORTAL_RULES.colors` / `colorNames` /
`buttons` / `surfaces` are the words for them, and the CSS plate wears
`.hq-plate-portal-a` / `-b`. A row filed before rev 2 has no `surf` and
reads as a floor door. `npm test` runs `hq-portal.test.js` (11 tests).
UNSEEN LIVE (RULE #1c): all of it — the ghost on a wall and a ceiling, the
aperture's brightness, the hatch's leaf standing open in the floor, the
fall's speed in a tall room (a cave chamber, the hall), a wall door's drop
to the floor, and the two colours against each room's own light.

## THE PROMOTION LADDER + THE STABILIZATION CHECKLIST + the door gun standard issue — 2026-09-15 rev 15, local delivery
**Why nobody ranked up**: `door.clearance` was only ever written by the dev
hook `window._doorPromote(n)` (the story track that was to promote never
landed), so every officer stayed L1 DOORMAT and every `minClearance` gate
(the rank leaves, the penthouse, the Bureau, the garden, 4B) was dead.
Clearance is FIELD WORK now: data.js **`HQ_PROMOTION`** (right before
`doorClearance`) = per rung `{ level, stabilized, keys }` (L2 1 site · L3
3 + 12 Keys · L4 6 + 24 · L5 12 + 48 · L6 20 + 96 — tune the table, nothing
else); **`hqFieldClearance(profile)`** = the highest rung met by
`hqMasteryCount(profile).mastered` + `hqKeys(profile).keys`;
**`doorClearance`** reads the HIGHER of the story number and the field
rung (a chapter can promote early, the field never demotes; the building's
ceremony `_hqCheckPromotion` fires on its own when it climbs);
**`hqRankProgress(profile)`** = the ONE "how do I rank up" read (`level,
title, stabilized, total, keys, next { level, title, stabilized, keys },
missing [{ what, need, have, short }], met, rows, note`). **THE
STABILIZATION CHECKLIST**: **`hqSiteChecklist(mapId, profile, { modes })`**
(data.js, after `hqSiteMastery`; `HQ_MASTERY_HOW` = the copy) = per
`masteryConditions` row `{ cond, label, name, done, how, modes }` — the
modes come from `MULTIPLAYER_MODES.winConditions` (Wipeout: Arena · TDM ·
Simul · Clash · Gauntlet; the Cube and the Keys: Arena only; the dungeon
never), the Keys row states `keysToWin` of `keySpawnCount`; a Δ id resolves
to its site. Readers: match-select.js `SiteChecks` (`.ms-tty-checks`, on
EVERY variant now, the officer's next rung under it), map.js
`_hqChecklistHtml(id, profile)` inside `_hqThresholdPanelHtml` — so the
hall's threshold door, the CROSSING console and the BATTLE marker all show
it — the pause menu's OFFICER row (the next rung) and `_hqGateText` (a red
lamp says what L-n costs and what you have). **THE DOOR GUN IS STANDARD
ISSUE** (the user's call, for the test): `HQ_PORTAL_RULES.free: true` (cost
0, rank 1) → `hqPortalStatus(...).issued` for everyone; `free: false, cost:
24, rank: 4` brings the Quartermaster's signature back (KEYHOLDER is L4 —
the old `rank: 2` was DOORSTOP). `npm test` runs `rank-ladder.test.js`.
Unseen live (RULE #1c): the checklist's grid on the CRT at narrow widths,
the promotion notice firing on the first arrival for a profile that
already has stabilized sites.

## THE ENCOUNTER — PLAYER-INITIATED (HQ plan 9.4 stage 1) — 2026-09-15 rev 16 / rev 17 THE CLICK, local delivery
**Never random (the user's rule).** In a WILD room (data.js
`hqEncounterRoomOk(roomId)` = `hqRoomSite` non-null — a site's board room
or a complex part; the facility is safe by construction) the officer
**LEFT-CLICKS with the door gun HOLSTERED** (rev 17, the user's
correction: "when you are not wielding the gun, clicking should do the
attack; press F and wield the gun, then clicking places a door" — the
1 · 2 · 3 · 4 keys are GONE, there is one gesture, the walker's
basic-attack clip: the def's `basicAttackKind` → `_attackChainFor`) —
three-renderer.js `_hqStrikeClick()` plays the one-shot on the walker's
rig (`pl.strike`, LoopOnce; the walker squares up on the camera's aim)
and takes `_hqEncounterAim()` = the nearest `hqEncounterCharOk` character
(a native / roster draw; never the cast, an agent, the online shift, the
clone) within `reach` 3.4 m, in the 55° aim `cone`, with `_hqLosClear`
line of sight (blockers except people, rock / raised cells, doorway
walls); `opts.onStrike` fires at once (the toast), `opts.onEncounter` on
the clip's STRIKE FRAME (`_slotStrikeMs`, else 380 ms) — guarded by `_hq
=== H` so a room change under the swing never lands. THE CLICK RULE in
`H.onMouseDown`: the door gun DRAWN reads the click first (LEFT places,
RIGHT holsters — never an attack); holstered, a LEFT click with the
pointer LOCKED strikes at once, the first (unlocked) click only grabs the
pointer, and with the lock refused a left click that did not drag strikes
on mouseup (`H.drag.strike`). `HQ_ENCOUNTER_RULES` = `{ reach, cone, dy,
cooldownMs, trigger: 'click', gesture: 'attack', labels }` — no `gun`, no
`keys`; `hqEncounterGesture('click')` → `'attack'`. API: `hq.strike()`,
`hq.encounterAim()`. map.js `_hqEncounterFire(ev)` →
data.js **`hqEncounterLaunch(roomId, ch, cfgRaw, { gesture })`** (pure:
the site, `delta: true`, the STICKY CONFIG `hqEncounterConfig` off
localStorage `ew_hq_encounter_cfg` — written by `_msConfirm` for every
crossing filed from the building, Clash / Gauntlet fall back to Arena ·
4 — the roster = the native's race first + `hqMissionPool`, `doorId:
'crossing'`) → `_hqEncounterStart`: THE LAST ROSTER (`_hqLastParty`)
rides `window._hqEncounterParty` into **`_msConfirm`**, which runs every
config rule as today and then seats it (`_hqApplyLastParty`), randomises
the CPU, `applyPartyBuild(false)` + `startMatch()` — NO party builder;
no roster on file → `_hqLaunchMission(...)` (the terminal, once).
`window._hqEncounterRun = { site, room, race, label, gesture, date, eye,
noIntro: true }`: battle.js `_introCineEligible` + the leaf warm-up skip
the intro PER LAUNCH (never `EW_DISABLE_INTRO_CINE`); the commit (before
the Code Red block) consumes it win or lose → `hqEncounterRecord(p, ev)`
→ `door.hq.encounters = { count, wins, losses, last }` (`hqEncounterLog`
reads; the OFFICER sheet's ENCOUNTERS row) and `window._hqEncounterResult`
→ `_hqReturnOrMenu`: a LOSS re-enters at `medical` (the ward, Part C row
30), a win at the console; a toast either way. The prompt reads `[CLICK]
ATTACK · ENGAGE` while holstered + aimed. Off: localStorage
`ew_hq_encounter = 'off'` / `window.EW_HQ_NO_ENCOUNTER`. VS-CPU only
(RULE #2 — `isOnlineMatch` refuses). `npm test` runs
`hq-encounter.test.js`. NOT BUILT: the walker's eye as the first battle
frame (the event carries it; three-camera.js has no initial-pose API),
the `spawnSide` mirror, the dissolve, a cleared-room rule. UNSEEN LIVE
(RULE #1c): the one-shot on the Player cast rig, the strike timing, the
builder-less first frame, the ward landing.

## THE ENCOUNTER stage 2 — THE EYE, THE CLEARED ROOM, THE GUARDED ENVELOPE (HQ plan 9.4) — 2026-09-15 rev 24, local delivery
**THE EYE (seam 2)**: three-camera.js **`ThreeCamera.seedPose(seed, easeS)`**
(+ `seedState()`) is the ONE initial-pose entry point: `seed = { tx, tz, up,
dx, dy, dz, look }` in TILES (`up` above the ground under the eye's column,
read through `_groundYWorld`); the next `sync()` — both branches — starts the
smoothed state THERE, renders that frame as the seed, then damps home with
time constant easeS / 3; `snapImmediate()` is IGNORED while the seed eases
(a match start snaps the camera; the seed survives it). The renderer's
`onEncounter` payload carries `eye` (`_hqEncounterEye`: the HQ camera's
position + gaze in room metres, the ground under it) and `board`
(`_hqEncounterBoard`: `{ N, C, half }`, null in a cave / a complex part);
data.js **`hqEncounterEye(ev)`** (pure) → the seed; map.js files it on
`window._hqEncounterRun.eye` (`walker` = the raw pose); battle.js
`showVSSplash` seeds it and returns — an encounter has NO VS card and no
cinematic. **THE CLEARED ROOM**: `hqEncounterRecord` writes a WIN to
`door.hq.cleared[roomId] = { date, ids }` (the native's spawn id rides the
run marker as `id` → the commit); **`hqEncounterCleared(profile, roomId,
now)`** = today's clearing or null; `_hqSpawnPopulation` leaves those ids out
(`hq-native-<spot>` / `hq-npc-<draw>`) until tomorrow. **THE GUARDED
ENVELOPE**: **`hqRoomGuarded(roomId)`** = a wild room with a race-hinted
`npcSpots` row → `hqBuildFinds` marks its pay row `guard: true`;
`hqFindsInRoom` hides a guarded row until the room is cleared today (51
rooms; one line to strike). **THE WARD**: `hqMedicalRecord` → CONDITION
`RECOVERING` (+ `exited`) the day you were exited from a wild room; leave
outranks it. **NOT BUILT, with the reason**: the `spawnSide` mirror — the
spawn zones (map.js `state.spawnZones[1]` = P1's ROW) and the Arena's
`spawn1` / `spawn2` nexus points are keyed by seat + row, never by `SPAWNS`;
a lane swap seats P1 on P2's spawn nexus. Never swap `SPAWNS` alone. Seam
(3) the dissolve is open. `npm test` runs hq-encounter.test.js (17).
Unseen live (RULE #1c): the eased move from the boom to the frame, the
emptier walkway, the envelope after a win.

## SKATEBOARDING rev 3 — SEAMLESS: ONLY A FAILED TRICK BAILS, THE FITTED STANCE, THE FALL + THE GET-UP (2026-09-17, local delivery)
The user's brief: "way too easy to fall — running into objects makes me fall;
riding should be as seamless as walking (Tony Hawk / Jet Set Radio); only fall
on a failed trick; after a fall get back upright on the board (the character
got stuck sideways until a landed trick); the character runs the whole time
when it should idle on the board and only kick now and then." All of it in
three-renderer.js's "SKATEBOARDING — THE RIDER" block, data.js `HQ_SKATE_RULES`
and sprites.js. **THE BAIL RULE**: `_hqRideBail` is reached ONLY by a rotation
still turning at the touchdown (`unfinished`), a spin landed off-axis
(`offaxis`) and the balance lost on a rail (`balance`) — a wall / a prop / a
blocker is **`_hqRideWall`** (head-on = the speed scrubs to `wallScrub` 0.15 of
itself, glancing keeps the share it made, a door's lane a walking pace), a
walk-off DROP of any height is a landing, a CAR KNOCKS the rider along its
heading (`R.hd` / `R.v`, the hop) still on the deck; `bailV` / `bailDrop` stay
in the table as retired keys. **THE LATE LANDING**: a trick ≥ `landGrace` (0.8)
done when the ground comes up is snapped complete through `_hqRideTrickDone`
(the one finisher the trick tick and the landing share); a queued trick never
started is dropped. **THE SIDEWAYS BUG**: the bail never reset `flip` / `roll` /
`deckRoll` / `spinAcc` / `stance` — a bail mid-corkscrew left the root half
turned until the next clean landing wrote zeros. It resets every one now, the
roll runs out under the slide (0.35 ×, then 0.93 / frame), no root tumble. **THE
BAIL IS TWO CLIPS**: sprites.js `HQ_SKATE_CLIPS` (baked onto the walker's rig
beside `hqRide` like the gun clips) — `hqFall` = UAL2 `Slide_Start` (a run
into a slide on the floor) for `bailFall` 0.6 of `bailMs` 1400, then `hqGetup`
= `Slide_Exit` for the rest, each ONE playthrough sized to its share
(`_hqRideBailPhase` → the clip picker); THE SKID: the deck is never hidden —
it shoots 1.6 m out ahead on a sine and slides back under the feet by
`deckBackMs`. **THE STANCE IS FITTED** (`_hqRideFitStance`, every 0.25 s while
the ride clip plays): the LeftFoot / RightFoot bones measured in the model's
frame → the pose yaw that lays the foot LINE along the deck (the candidate
nearest `stanceYaw`: regular / goofy) and the deck CENTRED under the feet's
midpoint (`R.fit`, eased; `R.deckOx / deckOz` in the group's frame) — a flat
−90° put Idle_10's forward foot half a metre off the deck's side (measured).
**THE CADENCE**: `pushEvery` 0.85 s / `pushV` 4.2 / `friction` 0.993 (four
strokes to cruise, a long Tony Hawk roll), the stride is `hqPush` = UAL1
`Jog_Fwd_Loop` for `pushMs` 520 (the Running sprint is gone from the deck);
above **`cruiseV`** 10.5 W only HOLDS the speed (no friction, no stride — the
rider stands on the deck, `kickEvery` [2.5, 5.5] the occasional kick);
`turnMin` 0.4 = the carve's floor at a crawl; the grind's drift 0.25 /
balance 0.75. **THE COPING** check moved BEFORE the move (`here.t ≥ qpTop −
0.2` with the next step at / past the lip): the ground probe's body pad left
the curve a frame before the feet reached `qpTop`, and at a cruising pace that
read as a walk-off into the air and a "wall" inside the pipe. **THE PROBE**:
`node playtest_skate_offline.js <room> '<steps>' [tag]` (repo tooling — the
gun probe's mirror: every repo GLB from disk, the deck at the repo root, the
walker a POSED rig; `hq.skate(true)` + `hq.dev.press` + `hq.dev.lookAt` for a
side view; PLAYTEST_NOTES "THE SKATE PROBE") photographed the stance from two
sides, the stride, the fall lying on the floor and the rider back upright on
the deck. `npm test` runs hq-skate.test.js (16; hq-city.test.js reads the
knock). UNSEEN LIVE (RULE #1c): the clips at 60 fps (the slide's run-in, the
get-up's speed — `bailFall` / `bailMs` are the edits), the jog stride's read
against the deck, the fit on the CAST rigs (the probe posed the creator base).

## SKATEBOARDING rev 2 — THE RIDE STANCE, FAKIE, THE KICK, HOLD TO JUMP — 2026-09-15, local delivery
The user's brief: Idle_10 on the deck with the feet on the board, the
occasional run/kick, skate backwards with S, jump higher the longer SPACE is
held. **THE RIDE CLIP**: sprites.js `HQ_RIDE_CLIP` (= the library's Idle_10,
lib 2); three-renderer.js `_hqSpawnCharacter` bakes it onto the WALKER's rig
only as slot `hqRide` (a clone of the def — never the shared table; a def
without the library keeps its idle, `_playUnitModelAnim` falls `hqRide` →
idle); the clip picker plays `hqRide` on the deck, `run` for the stride.
**THE STANCE**: `_hqRidePose` turns the body `stanceYaw` (HQ_SKATE_RULES,
−π/2 = regular, chest to the right of travel; +π/2 = goofy) INSIDE the
travel frame — `e.model.quaternion = Euler(flip, yaw, roll + lean) ·
RotY(poseYaw)` — so Idle_10's feet-apart stance lies ALONG the deck and a
front flip still turns about the travel's lateral axis; `R.poseYaw` eases to
0 for the push / the kick / the bail (squared up for the stride). **FAKIE**:
S rolling forward is the brake; from a stop S is the fakie push (`R.v`
NEGATIVE along `hd`, `reversePushV` per cadence, capped `reverseMaxV`; W
while backwards brakes first); every speed read in the tick is `Math.abs`
now (the wall rule's progress carries the roll's sign, the grind lock's
direction folds it in, the door hand-off caps both ways). **THE KICK**:
coasting ≥ `kickMinV` the rider throws in a stride every `kickEvery` [lo,
hi] s (`pushAnim`, +0.25 m/s, beat `kick` → map.js plays `skatePush` low).
**HOLD TO JUMP**: the press pops `ollieTapV` (4.6 → ≈ 0.6 m); SPACE held
keeps lifting `ollieHoldAcc` (13 m/s²) for up to `ollieHoldS` (0.42 s) —
`R.holdOn` / `R.holdT`, cleared by the release, the cap, a grind hop-off;
a full hold ≈ 1.65 m (the old fixed ollie was 1.46). `ollieV` now only
sizes the grind's hop-off. hq-skate.test.js rev 2 (four tests) proves the
tap < half < full apexes, the fakie roll + the wall behind, the kick
cadence, the stance sites. UNSEEN LIVE (RULE #1c): Idle_10 turned sideways
on the deck (if the feet hang off, `stanceYaw`'s sign is the edit), the
squat during the hold (`scale.y` 0.94), the stride's ease.

## SKATEBOARD CONTROL CORRECTION — 2026-09-15, local delivery
First-push camera yaw must be converted to +Z-front rider yaw with
`atan2(sin(cam.yaw), -cos(cam.yaw))`. A/D subtract the right-minus-left
input from rider yaw. `_hqRideTurn` applies the inverse shortest heading delta
to camera yaw, keeping mouse-look offset through carves and rail bends.
Airborne stance/spin does not steer the camera. The grind branch updates the
rider group position and yaw before returning. Regression checks live in
`hq-skate.test.js`; cache token `20260915-skate-controls-02-cors`.
Local changes only; no browser playtest or upload.

## SKATEBOARDING — THE RIDER (HQ plan 9.8 stage 1) — 2026-09-15 rev 23, local delivery
A walker MODE, never a game mode: nothing on `state`, nothing relayed
(RULE #2; hq-skate.test.js reads the block for `state.` and online.js for
the word). **B** drops the deck / picks it up (three-renderer.js
`_hqRideToggle`; the arrows are their OWN keys now — `up / down / left /
right` — the walker reads them as WASD, the rider as tricks; B sits before
V in `_hqKeyName`'s line so the door gun's and P's pins hold). The block
"SKATEBOARDING — THE RIDER" (before the per-frame section) owns `_hq.ride`:
`_hqTickRide` takes the frame from `_hqTickWalker` while `ride.on` —
momentum (`v` along `hd`; W pushes on a cadence, S brakes, A / D carve,
time-based friction), THE OLLIE (SPACE = HQ_JUMP_V), GRINDS (an ollie
coming down within `grindSnap` of a rail in **`_hq.rails`** locks —
`_hqRailAt` / `_hqRailNearest` are ONE geometry for a straight run
`{ x0, z0, x1, z1, y }` and an arc `{ arc: true, r, a0, a1, y }`; A / D
balance; the end hops off), RAMPS (**`_hq.ramps`**: a `prof: 'qp'` row
is a SURFACE — `_hqRampSurfaceAt` is a layer of `_hqSurface` after the
gallery's and a mass in `_hqAirOK`; the coping launches; a flat register
turns a rise taken at speed into a hop), TRICKS (← kickflip · → heelflip
· ↑ front flip · ↓ backflip · W corkscrew · A / D a 180 each, an odd
count lands FAKIE · SHIFT the grab — rotations on the rider's model
(order YXZ about its centre, `_hqRidePose`) and the deck, no new clip),
THE COMBO (pts × tricks, live on `#hqTrick`, BANKED on a clean landing;
a trick still turning / a spin off-axis / a head-on wall at speed
(progress along the heading — the axis slide cannot see a wall) / a rail
lost = BAIL, the line lost). **THE REGISTERS (THE PARK RULE)**: `_hq.rails`
/ `_hq.ramps` start empty in `_hqEnter`'s literal and every builder
pushes — the mezzanine's rail arcs (`_hqBuildShell`), the gallery, the
cave, and `_hqRegisterPropPark` at BOTH prop-placer sites for a catalogue
`rail: { h }` (`railing_1m`) / `ramp: { w, len, h, prof? }` (`riser_*`,
`quarter_pipe` — a new proc; two face each other in Room P1). **THE
TABLE** is data.js `HQ_SKATE_RULES` (`_hqSkateRules` merges it over the
renderer's `HQ_SKATE_DEFAULT` — keep the keys in step, the test diffs
them); `free: true` = STANDARD ISSUE (the user's rule, the door gun's
precedent) — `free: false` puts THE DECK in Room 26 as a find of kind
`deck` (`hqBuildFinds`, `find_deck`, `hqCollectFind` → `door.hq.skate.
deck`). `hqSkateStatus(profile, { force })` is the ONE read (map.js
`_hqSkateOpts` → `opts.skate.issued`; the strip pill `#hqSkate`, click =
B; the OFFICER sheet's THE BOARD row); `hqSkateBank(profile, ev)` the ONE
write (map.js `_hqSkateFile`, one transaction per banked line / bail:
`door.hq.skate = { deck, since, best: { score, text, date }, total,
lines, bails }`). Beats reach map.js through `opts.onSkate` (`_hqSkateEvent`:
the trick line, six audio.js recipes `skate*`, the books). THE DECK is
the user's GLB (`_MISC_GLB.skateboard`, MODEL_INDEX §3d; `_hqRideDeckBuild`
fits it by span to 0.84 m, pre-turned π/2 to the rider's +Z, over a
stand-in). `_hqRideMem` carries the board through a door (`_hqRideArm`
after the population; `_hqGoTo` keeps it rolling at ≤ 2.5 m/s). Dev:
`?skate` / `EW_HQ_SKATE` = issued, `EW_HQ_NO_SKATE` = off; API
`hq.skate / skating / skateIssued / ride / rails / ramps`. `npm test` runs
`hq-skate.test.js` (the ride itself in a vm sandbox). UNSEEN LIVE (RULE
#1c): everything — the deck under the feet, the flips' pivot, the grind
height on the mezzanine arc, the quarter pipe, the trick line, the sounds.

## THE SEAMS, THE SECOND BATCH (HQ plan 9.3 `way` ×6) — 2026-09-15 rev 22, local delivery
Six more `DOOR_HQ.ways` kinds (data.js) with builders in three-renderer.js
`_hqWayBuilders` and sounds in audio.js: `mirror` (`wayMirror`) · `pool`
(`waySplash`) · `painting` (`wayCanvas`) · `fireplace` (`wayFloo`) ·
`screen` (`wayStatic`) · `closet` (reuses `wayCreak`). Seven `links` rows
on `seams`: `mirror_lookingglass` (the Barbershop's east wall ⇄ **a FREE
end on the Looking-Glass's north strip** — its 18 m room has no north lane,
so it is the first free `way` on a site room; hq-world.test.js's landing
and lane rules skip `wall: 'free'` there, and every built site is a
station now), `natatorium_dutchman` (both ends free: the plunge pool beside
the lap pool ⇄ the bilge in the hold), `lodge_olympus`, `bureau_vatican`
(**the link carries `gate: { minClearance: 5, requiresKeys: 24 }` — the
Bureau's own — so the Vatican is no way round the Gatekeeper's door**),
`northpole_haunted` (the hall's EAST wall — the north wall is the gallery's
slab), `observatorium_singularity`, `nuketown_haunted`. RULES that came
with it: a prop the seam displaces MOVES (never deleted — the test checks);
a builder may use only the stub scene's geometry kinds (Box · Cylinder ·
Ring · Circle · Plane · Torus · Sphere) and its tick must move a
position / rotation / scale (the stub's JSON diff ignores materials);
`hqDoorNo` reads a room numbered on its own DOOR (the Bureau) by scanning
for an entry that carries a `roomNo` — never through `hqRoomNo` (it
recursed). NOT BUILT: `phonebox` (A14), `tent`, Room 8's weir ⇄ Atlantis
(no fourth north lane). Unseen live (RULE #1c): every object.

## THE VEHICLE BATCH + THE TRAIN WAY (HQ plan 9.3 `train`) — 2026-09-15 rev 21, local delivery
Nine Meshy vehicles on R2 `Assets/misc/` (MODEL_INDEX §3c). Renderer:
`_MISC_GLB` rows `suv · cadillac · copcar · cybercar · firetruck ·
schoolbus · ambulance · subway_front · subway_cart`; **`_VEHICLE_KIT`**
(after `_hzMiscKit`) = per vehicle `m` (length, fitted `span`), `yaw`
(the pre-turn that puts the NOSE at +Z — a TARGET, unmeasured: a nose
that lands backward is `yaw: Math.PI` on that row, sideways ±π/2),
`foot`, the stand-in box, `lift`, `beacon`; **`_hzVehicle(kind, o)`** is
the ONE placer (`_hzVehicleProc` fallback = a lit box on wheels, so
EW_PERF_LOW still shows a car; the beacon pulse on the board only).
Placed with `_nrProp` in the URBAN settings (Nuketown's yellow boxes are
gone; Cyberpunk, the Stadium, the Strip, Downtown's EVACUATION) — the
site rooms inherit them. Room P1 parks five cars: the Sedan +
`DOOR_HQ.catalogue` rows `car_suv / car_cadillac / car_cop /
car_ambulance` (`base: 'misc'`, **`vehicle: true`** — map.js's booth
counts that flag); `car_cyber` / `fire_truck` / `school_bus` are
catalogued, unparked. **THE TRAIN** is the THIRD `way` kind:
`DOOR_HQ.ways.train`, `routes.subway`, link `tunnel_cyberpunk` — Room 2's
tunnel (a FREE end on the track bed, doors facing the platform; the
`train_car` prop is retired, never re-add it) ⇄ Cyberpunk's north wall x
−10 (the body half inside the wall — the wall is the tunnel).
`_hqWayBuilders.train` = the subway front (nose −X, doorway at x 0) + the
cart (the FREE end only — a wall end stands the front car alone so the
body never crosses the next lane's door) through `_hzVehicle`, THE
ARRIVAL ticker (26 m in over 3.2 s, nose first), the door leaves on the
way tick; **a way builder may return `blockers`**
(discs in its own frame — `_hqBuildWay` places them in the room's).
audio.js `wayTrain`. Downtown's / CERN's platforms wait on a free north
lane. `npm test`: misc-models.test.js (the vehicle block), hq-world,
hq-stage2. Unseen live (RULE #1c): every facing, the beacons, the
arrival, the half-buried body.

## THE HQ VISUAL PASS — the measured front, the tabletop seat, the kit tile, the vehicle turn (2026-09-16, local delivery)
The user's look at the building: backwards desks, props floating off desks,
trays floating off the counter, the subway sideways, the cars half-size on
their maps. Every one was a placer CONVENTION nobody measured. **THE KIT
TILE** (three-renderer.js `_hzKitTs` / `_hzKitTile()`): `_hzMiscKit` /
`_hzDoorKitGLB` / `_hzVehicleProc` / the beacon size in TILES and read the
CURRENT build's tile — `_hqBuildSetting` sets it round the near builder
(try / finally; 127.75 in a site room, `CONFIG.tileSize` on the board).
Never read `CONFIG.tileSize` in a helper a room can call: every vehicle,
utility box, rover and palm in a site room was 45 % of its size. **THE
VEHICLE TURN**: `_VEHICLE_KIT` rows wear `yaw: Math.PI / 2` (Meshy lays a
long model along X, front −X — every measured piece: the cannon, the
rowboat, the wreck, the crane, the skateboard) and the catalogue `car_*`
rows `turn: 90` (the placer applies `turn`, degrees, to the INSTANCE);
unmeasured — a nose that lands backward is `-π/2` / `turn: -90`, one
field. **THE FRONT OFF THE MESH** (`_hqAutoFrontYaw(inst, mode)`, catalogue
`front: 'back' | 'open'`): a GLB seat's facing is MEASURED when it lands
(backrest = the centroid of the band above 62 % of the height, the front
is the other way; a cubicle's opening = the emptiest side band between
desk and partition height) and the instance is turned so that front is
local +Z, the placer's contract — every chair / couch row and
`round_cubicle` carry it; a new seat / booth GLB = set `front`, never guess
`rot`. **THE TABLETOP SEAT** (`_hqSeatTabletops` / `_hqSeatLater`,
`_hq.tabletops`): a raised small prop (`y` ≥ 0.25, `foot` ≤ 0.35, not
block / rect / wall / ceiling) is seated on the surface a ray finds within
±0.3 m of its authored height once the furniture has landed (procs at
once, each GLB as it arrives, debounced) — type the surface you MEAN, the
mesh decides where; `EW_HQ_DEBUG` logs the rows with nothing under them.
**THE ROOMS**: Room 86's counter is the `serving_line` proc (3 m: hot
wells, sneeze guard, THE TRAY SLIDE at 0.85 m — trays at z = wall + 0.95),
Room 4C's `exec_desk` is centred, a FLOOR prop, drawers to the sitter,
modesty panel to the room, the visitors' chairs face the Director; Room
?'s clerk sits BEHIND her desk; the cubicle floor's `face` names the way
each mouth points and the shift sits at the mouth. Offline screenshots:
`node playtest_hq_offline.js <room> '<views>' [--nogltf]` (repo tooling —
the CDN is blocked from the sandbox; see PLAYTEST_NOTES "THE VISUAL
PASS"). `npm test` runs `hq-visual-pass.test.js`. UNSEEN LIVE (RULE #1c):
the real chairs' measured fronts, the cubicle's opening, every car's nose,
the train arriving nose first, the seat pass on the span-fitted tables.

## THE MIXER — per-song / per-cue master levels (dev tool, Settings → Audio) — 2026-09-16, local delivery
The songs and the cues were not mastered at one loudness. audio.js "THE
MIXER" block (right after `audioFadeVersion`): **`_mixLevel(channel, key,
base)`** is the ONE read at every play path — `getMusicBaseVolume` /
`getSfxBaseVolume` / `_ambienceTargetVol` / `playDoorSfx` — precedence
LOCAL dev override (localStorage `ew_audio_mix`, what the panel writes) →
**`AUDIO_MIX_SHIPPED`** (`{ music, sfx, ambience, door }`, the mix every
player gets) → the four base tables (`AUDIO_BASE_VOLUMES` ·
`SFX_BASE_VOLUMES` · `AMBIENCE_BASE_VOLUMES` · `_DOOR_SFX_GAIN`). A level
is an ABSOLUTE base (the file's share of full scale, 0–1.5, clamped to 1
at play time), never a multiplier — an exported number reads exactly like
the table entry it replaces. **`window.AudioMixer`**: `open(channel)` /
`close()` (the panel `#audioMixer`, z 100000, CSS injected by `_mixCss`;
tabs MUSIC · SFX · AMBIENCE · DOOR KIT, a filter, ▶ audition at the
current level — a song through `playMusic` (the shuffle continues from
it), a cue once, a bed for 12 s kept alive by `_desiredAmbienceKeys`
through `_mixAudition.ambience`, a door-kit recipe — a slider per key,
`tbl n` = the table's value, gold = set here, ↺ per row / per tab / all),
`get / shipped / base / isLocal / set / reset`, **`overrides()`** = every
key whose effective level differs from the TABLE (a shipped value still
wanted survives a re-export), `exportJson()` (= the override object —
**paste it over `AUDIO_MIX_SHIPPED` to ship the mix**), `exportJs()` (the
four tables rewritten with the mix folded in, for baking into the
literals), `importJson(text)`, `audition / stopAudition`. Buttons:
map.js `_renderMainMenuSettings` Audio group (so the HQ pause menu's
SETTINGS has it too) and ui.js `_buildPauseMusic`. Viewer-local, nothing
on `state`, nothing relayed (RULE #2). `npm test` runs
`audio-mixer.test.js`. The user's workflow: tune in the panel → EXPORT
JSON → hand it to Claude (or paste it over `AUDIO_MIX_SHIPPED`) → ship
audio.js. Unseen live (RULE #1c): the panel over the CRT / the pause menu,
the slider's feel, the bed audition's fade.

## PHASE 9 DELIVERY 1 — THE LEDGER + the open edge + the Works' kit doors (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §9's Delivery 1, plus two rules of the user's. **B1 THE
STABLE TAPE ID**: data.js `DOOR_TAPES[i].id` is `<sheetKey>#<slot>`
(`prebuilt_revenge#0`) — the claim a profile files (`taken['tape:<id>']`,
`tapes[]`); `num` ('T077') / `no` are the DISPLAY number, recomputed per
build (map.js `_hqTapesHtml` prints `num`, files `id` in `data-tape`).
`hqTapeById` accepts either; `hqTapeLegacyId` / `hqFindLegacyId` read a
positional claim as the tape at that position today (`hqFindsRecord`
migrates on every read). Adding a site never renumbers a collection.
**B2 THE LEDGER**: the claims live in TWO places and `hqFindsRecord` is
their UNION — `door.hq.finds` (the building's local record + the pay tally)
and **`progress.hq.finds.taken`** (the SYNCED blob: `mergeProgressBlobs`
carries `hq.finds.taken` — `true` beats a date, two dates keep the later,
`FIND_RE` + `ACH_MERGE_CAPS.finds`; profile.js `profileLoadProgress` folds
the local record in on every read). `hqCollectFind(profile, id, now,
{ serverPays })` writes both; with `serverPays` (map.js `_hqTakeFind` passes
`PS.hasServerAccount()`) the local wallet is NOT credited — the take
schedules the debounced push (`PS.scheduleProgressSync`, exported now) and
server.js `/api/progress/sync` pays every newly-merged `pay:` claim once
through data.js **`hqFindsSyncPay(before, after)`** (`ACH.findsPay`; on the
FIRST sync too — a local credit never reached the server). A profile with no
v2 blob never gets one invented (`hqFindsSyncedTaken`). **Hardening**: the
encounter marker carries `armed: true`; battle.js `startMatch` spends it on
its own launch and DROPS a stale one on any later match. **B3 copy**: map.js
`_hqEncounterBoardCopy(board)` — THE ROOM IS THE BOARD on a board room, THE
SITE IS THE BOARD from a complex part / a cave. **THE OPEN EDGE** (the rule
above): no outdoor battle room wears facility walls. **THE WORKS WEAR THE
KIT** (the user: "the doors in the works need to be the GLB doors, not
procedurally generated ones — visual consistency"): three-renderer.js
`_hqWorksLeaf(U, w, h, i, knobSide)` = a catalogue leaf from
`_HQ_WORKS_LEAVES` (16 plain leaves, never a rank leaf) cloned through
`_miscModelInstance` + `_hqPropMatPick`, fitted to w × h on its bottom edge
facing +Z, the `_hqMiniDoor` panel a hidden STAND-IN once the file lands —
the belt, the arm's gripper, the pallet, the furnace, the vine, the shelf
all take it (hq-stage2.test.js insists no proc builds a panel of its own).
Still open from §8: D1 (return to the swing spot), D2 (the native's
identity), the dissolve, D3–D9. `npm test` 1439 / 0 / 4 skipped. UNSEEN
LIVE (RULE #1c): the open Stadium / Camelot / city rooms without their
walls (the link doors and the wardrobe stand alone on the north line), the
kit leaves at 0.2 m on the vine, the ledger's toast wording.

## PHASE 9 QUALITY REVIEW — the brief reconciled (2026-09-16, docs only)
`PHASE9_QUALITY_PLAN.md` is the ACTIVE Phase 9 specification (§1: one answer per
behaviour — read it before the plan's Phase 9 section, whose superseded bullets are marked
in place) plus the findings and the plan. Before the finds go live, ship §8 items 1–2:
**tape ids are POSITIONAL** (data.js `DOOR_TAPES` numbers T001… by `siteRooms.built` +
`HQ_TAPE_SHEET` order; claims are `tape:Tnnn` — give every sheet row a stable key and make
`Tnnn` display-only) and **hazard pay is a local credit the server wallet overwrites**
(`hqCollectFind` → `profile.account.gold`; `serverSyncProgress` → `_syncEconomyToLocal`
replaces it; `door.hq.*` is not in the synced progress blob — put a monotonic `hq.finds.taken`
map in the blob and let `/api/progress/sync` pay each new `pay:` claim once). From a complex
part or a cave the encounter fights the SITE'S Δ with no eye seed — the toast must not say
THE ROOM IS THE BOARD there. THE FIELD (§11: the room's own lattice as the 8×8 window,
in/out cells, heights clamped so walker-reachable ⇒ unit-reachable, units snapped to cell
centres at the strike frame, explicit spawn cells per seat, the battle built at the room's
transform behind a 0.6 s dissolve) and THE LOOK (§10: one material path, one light rig, THE
WORLD in the open room, the room's furniture in the battle) are staged there; the user's
decisions are §14. `npm test` at HEAD: 1438 / 0 / 4 skipped.

## PHASE 9 DELIVERY 2 — THE ENCOUNTER'S TRUTH (D1 · D2 · the dissolve) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §8 items 3 + 7. **D1 THE SWING SPOT**: the run marker's
`walker` (feet + camera yaw at the strike) rides home on `_hqEncounterResult`
(battle.js commit); data.js `hqEncounterReturnSpot(result)` → `{ x, z, y, face°,
swing }`; map.js `_hqReturnOrMenu` lands a WIN there when the strike's room is
the return room (a loss = the ward, another room = the console); three-renderer.js
`_hqGoTo` accepts the FREE-SPOT form (any object with numeric x / z: the
walkable surface at the recorded level, the recorded heading, `faceAway`
ignored) before its door scan — use it for any "stand exactly here" landing.
**D2 THE LEAD**: `hqEncounterLaunch(...).encounter.name` = the room's label for
the native; `hqEncounterLead(enc)` validates race / gender / name; state.js
`optimizeRandomizeParty(2)` pins P2's SEAT 1 to it off `_hqPreselect.encounter`
(`randomizeIdentity(false, race)`, the gender, `sanitizeUnitName`) — the enemy
lead IS the character you hit. **THE DISSOLVE (seam 3)** = a 2D CROSSFADE, not
the material dissolve: `_hqLeave({ dissolve: true })` → `_hqDissolveStart` renders
the room once more and copies it over the canvas IN THE SAME TASK (the drawing
buffer is not preserved across tasks), disposes the room, holds 150 ms, fades
600 ms (`HQ_DISSOLVE_MS`); THE EYE seeds the battle from the same viewpoint.
Only `_hqEncounterStart` asks for it (map.js `window._hqLeave(opts)` passes it
through; a screen / menu exit still cuts). Off: `EW_HQ_NO_DISSOLVE`, reduced
motion. Any test that anchors on `window._hqLeave = function (opts)` reads the
new signature. `npm test` 1444 / 0 / 4 skipped. Unseen live (RULE #1c): the
crossfade's feel, the swing landing on a tier, the lead's nameplate. Next in
§8: items 5–6 (Delivery 3 — THE GUN READS: the ghost's refusal reason, the A/B
shape cue, the hatch-loop cap + the F-hold escape).


## THE PLAYLIST — songs wear TAGS, places ask for tags (2026-09-16, local delivery)
audio.js "THE PLAYLIST" block (right before `MUSIC_CROSSFADE_MS`). Two new
facility songs: `doorLobby2` / `doorLobby3` = R2 `music/door hq 2.mp3` /
`door hq 3.mp3` (the spaces are `%20` in `_R2_MUSIC`; display names in ui.js
`_TRACK_DISPLAY_NAMES`). **The model**: every song carries a SET of tags in
five dimensions (`MUSIC_TAG_GROUPS`: role · mood · energy · style · setting —
a song takes as many as fit); `MUSIC_TAGS_SHIPPED` is the tagging every
player gets (the role tags ARE the old wiring: ff7 = title, the main theme =
menu + battle, the door tracks = lobby + hq, the alts = battle; the mood /
style tags on the alts are Claude's guesses off the titles — retag in the
panel). A PLACE is a `MUSIC_CONTEXTS` row `{ any: [role tags], not,
fallback }` — title · menu · lobby · hq · exploration · battle · boss; a
map's MOODS (`MUSIC_SITE_MOODS[near key]`, or `env.music: [...]` on its
EW_MAP_META row) are asked for first (`MUSIC_MOOD_MIN` 2 matches or the
pool is topped up); an empty pool falls down `fallback` and ends at the
main theme. ONE read per song `MusicTags.get(key)` (LOCAL override in
localStorage `ew_music_tags` → shipped); ONE pool read
`MusicTags.pool(ctx, moods)`; per-pool SHUFFLE BAGS (`_musicDraw`: every
song once before a repeat, never the same song twice running); a pool of
ONE song loops, a pool of many advances on `ended` (the battle crossfades
9 s early as before) — no track has `loop = true` on its own any more
(`_musicApplyLoop`; the pause menu's 🔁 pins `_pinnedLoop`). Entry points:
`playContextMusic(ctx, { moods })` (keeps a playing song that still fits the
new pool — a walk from the hall into an office keeps the track),
`setMusicContext('battle')` (the match keeps the song it pre-warmed at
startMatch), **`skipTrack()` = ⏭ ANYWHERE** (the fix for "no way to change
the song" — map.js `skipBattleTrack` delegates; it was gated to battle /
editor). map.js **`musicContextForState()`** is the ONE resolver
(`syncMusicToState` calls it): battle → `battle`; HQ lobby rooms
(`_HQ_LOBBY_MUSIC_ROOMS`) → `lobby`; a WILD room (`hqRoomSite`) →
`exploration` + the site's moods (`_musicMoodsForSite`); other rooms → `hq`;
title → `title`; else `menu`. The legacy names (`battleMusicKeys` is GONE;
`refillBattleShuffleBag` / `drawFromBattleShuffleBag` / `chooseBattleTrackKey`)
are wrappers over the battle pool. **THE DEV TOOL**: the mixer panel has two
more tabs — 🏷 TAGS (a chip per tag per song, click toggles, gold = tagged
here, ▶ auditions) and ⌖ CONTEXTS (each place → its rule → the resolved pool,
▶ plays a draw; the site-mood table) — `AudioMixer.open('tags')` from
Settings → Audio → 🏷 Song Tags and the pause menu's Music tab. EXPORT JSON
carries `tags` (paste over `MUSIC_TAGS_SHIPPED`); EXPORT JS TABLES prints
the table; IMPORT takes either. **Settings → Audio wears NOW PLAYING**
(map.js `_buildNowPlayingHTML`: the song, its pool, ⏮ ⏭, a picker of every
song with the current pool first; the HQ pause menu's SETTINGS renders the
same body). Viewer-local, nothing on `state`, nothing relayed (RULE #2).
Adding a song = `_R2_MUSIC` + `_LOCAL_MUSIC` + `AUDIO_BASE_VOLUMES` + a
`MUSIC_TAGS_SHIPPED` row + a display name; adding a tag = its group's list;
adding a place = a `MUSIC_CONTEXTS` row + a branch in
`musicContextForState`. `npm test` runs `music-tags.test.js`. UNSEEN LIVE
(RULE #1c): the chips' wrap in the panel, the picker in the settings row,
the crossfade when a walk changes pools.

## THE DOOR GUN rev 3 — THE MODEL, THE SHOT, THE RECALL (Phase 9 Delivery 3 — THE GUN READS) — 2026-09-16, local delivery
The user's retro ray gun (R2 `Assets/door/models/Meshy_AI_a_retro_gun_that_
shoo_0916054449_texture.glb`, repo `doors/`; MODEL_INDEX §3b) is
`DOOR_HQ.catalogue.door_gun` (data.js; `span` 0.62, `gun: true`). **ONE
tuning row**: `HQ_PORTAL_RULES.gun = { key, bone, span, pos, rot, muzzle }` —
the grip in the hand bone's frame (metres / degrees) and the barrel's end in
the gun's own frame (metres from the instance's base centre, +X the barrel —
the Meshy long-on-X convention, muzzle read as −X UNMEASURED: a barrel that
lands backward is `rot[1]` ± 180). **THE BUILDING** (three-renderer.js, the
gun helpers right after `_hqPortalRules`): `_hqGunAttach` parents it to the
walker's RightHand through `_hqAttachHeld` (the Janitor's-mop holder), shown
only while DRAWN (`_hqGunShow` from `_hqPortalDraw`); `_hqGunMuzzle()` is
the ONE origin (world metres; the chest + half a metre while the GLB streams).
Drawn: THE LASER SIGHT (`_hqPortalSight`, a 1 px additive Line muzzle → hit
+ a dot; white while F is held), THE STANCE (standing, the officer squares up
on the aim), THE WORD (D3a: `_hqPortalGhostLabel` — `HQ_PORTAL_RULES.reasons
[reason]` over the ghost's lintel in red, the surface + `A / B` in green).
**THE SHOT**: `_hqPortalPlaceAim` files the record at the click as before
and builds with `{ fresh, flight: { from: muzzle } }` → `_hqPortalFlight`
hides the frame, flies a tumbling miniature + a comet trail on a shallow arc
(`HQ_PORTAL_RULES.shot`: msPerM / minMs / maxMs), then UNFOLDS it about the
opening's centre (ease-out-back, `unfoldMs`) over `_hqPortalLandBeat` (the
old mote ring + a shock ring in the surface's plane + a 600 ms PointLight +
`doorGunLand`); `_hqGunFire` at the trigger = muzzle flash + sparks + the
camera's pitch kick (`shot.kick`, eased back over `kickMs`) + the walker's
ranged clip (`_attackChainFor('ranged')`) + `doorGunShot`. A slot removed
mid-flight kills the projectile. **D3b THE SHAPES**: `HQ_PORTAL_RULES.
shapes` — the placed frame's aperture rim is a circle (A) or a four-segment
ring turned a quarter (B, a square), the jamb-lamp caps a ball / a cube.
**D3c**: a mouth re-arms only `rearmMs` (250) after its last crossing
(`rec.lastCrossAt`, the hatch-loop cap); **F is a TAP on the release** (the
press stamps `H.portal.fAt`, `_hqPortalTickHold` runs from
`_hqPortalTickAim` every frame) and a HOLD of `recallMs` (600) with a door
placed = **THE RECALL** — `_hqPortalRecall` drops both records at once
(`_hqPortalRemove(slot, { keep: true })` keeps the group), flies each frame
home to the muzzle shrinking on its own comet, `doorGunRecall`, then
`onPortal({ kind: 'recall', n })` → map.js clears the pair on the profile
(`hqPortalClear`, one transaction) + the toast. **D4**: `_hqPortalHop` out of
a flat twin nudges the body along the twin's normal up to `exitNudgeM` (0.6)
until `_hqAirClearOfBlockers` passes at the feet and the head. API:
`hq.portalRecall()`, `hq.gunMuzzle()`. **THE BOARD**: sprites.js
`RACE_MODELS_3D['door agent']` (both genders) carries `hold:
_DOOR_AGENT_HOLD` (sprites.js loads before data.js — the row is the
fallback; three-renderer.js `_unitAttachHeld(m, hold, ts)` merges the live
`HQ_PORTAL_RULES.gun` over it at attach time, parents the catalogue GLB to
the rig's hand bone at real scale (`ts / HQ_TILE_M` px per metre, the bone's
world scale undone), `_ew_noTwin`, and it rides the rig cache with the body;
any def may carry `hold` now). Every placement is a SHOT from the gun:
three-vfx-effects.js `_sigDoorGunShot3D` (registered `raceDoorGun:shot` —
a folded frame in the agent's teal on a comet trail from the caster's hand
to the tile, the muzzle flash, a shock ring on landing, the two cues voiced
INSIDE the recipe so the guest hears them — `playDoorSfx` is never relayed)
fired by battle.js through `window._doorGeom` (relayed `vfx3d-x`, RULE #2)
before Knock Knock's two doors (the second `delay: 140`), Breaking and
Entering's door, EXIT and the Trapdoor; the door recipes rise under it. The
basic attack stays the punch (the Closer's kit). audio.js: `doorGunShot`
(a ray-gun zap) / `doorGunLand` (the unfold) / `doorGunRecall` (the zap in
reverse) in `_DOOR_SFX_RECIPES` + `_DOOR_SFX_GAIN`. NOT BUILT: D3d (the
boom's pitch clamp in a loop, the fade after the third crossing — playtest
first), the `hard` reachability test (item 9), a holstered gun on the hip.
`npm test` runs hq-portal.test.js (14 tests: the hold's arithmetic in a vm).
UNSEEN LIVE (RULE #1c): the grip and the muzzle on the Player / Belle rigs
(`HQ_PORTAL_RULES.gun.pos / rot / muzzle` are the edits), the gun's scale in
a unit's hand at tile scale, the flight's arc and the unfold's overshoot,
the sight's brightness under each room's light, the three cues' loudness.

## THE DOOR GUN rev 4 — THE HOLD, THE HAND, ONE TRIGGER, THE WALL, THE CARRY (Phase 9 polish) — 2026-09-16, local delivery
The user's five fixed and MEASURED with `playtest_gun_offline.js` (repo tooling: the
offline HQ harness + every repo GLB served from disk, so the walker is a POSED rig
holding the real gun; keys through `hq.dev.press`, pointer lock stubbed — see
PLAYTEST_NOTES "THE DOOR GUN PROBE"). **THE HOLD**: `HQ_PORTAL_RULES.gun` = `rot
[0, −90, 90]` (the gun's +X barrel down the hand bone's +Y fingers, its +Y top along
−Z), `pos [0, 0.05, 0.06]` (the grip in the palm), `span 0.36` (`_hqGunAttach` passes
`h: G.span` — the holder read the catalogue's 0.62 before); a held prop is never
frustum-culled. **THE ANIMATION**: sprites.js `HQ_GUN_CLIPS` (UAL1 `Pistol_Aim_Neutral`
+ `Pistol_Shoot`) baked onto the walker's rig as `hqAim` / `hqShoot` (the `hqRide`
pattern); drawn + standing = `hqAim`; the shot plays `hqShoot` first. **THE HAND**:
in first person the gun is a VIEWMODEL under the camera (`_hqViewmodel` /
`_hqViewmodelTick`: the GLB at the rules' span, a black glove round the grip, the
cuff off the corner; `viewmodel.pos` / `adsPos` / `rot` / `bob` / `kick` in the rules;
the camera is added to the scene for it; `_hqGunMuzzle` answers its muzzle in FP).
**ONE TRIGGER**: LEFT CLICK shoots the SELECTED threshold (`H.portal.slot`, A first —
the ghost / sight / word wear its colour and the ghost judges THAT slot), a shot
auto-advances to the other, R flips, 1 / 2 pick (`_hqPortalSelect`, `_hqPortalFire`;
`buttons: { fire, aim, select, a, b }`); RIGHT CLICK held = AIM DOWN SIGHTS
(`_hqPortalAds` → `adsK` eased over `ads.ms`: the lens to `ads.fov`, the mouse ×
`ads.sens` via `_hqLookGain`, the boom to `ads.boom`, the viewmodel to the centre).
`_hqKeyName` knows R / 1 / 2 (before Q — the pinned line). **THE WALL**:
`_hqPortalWallSnap` moves a hit within 0.6 m of a box room's perimeter (or a
rotunda's drum) ONTO the shell plane (the march reads the walkable set, which stops a
body short of every wall — the frame floated and its back read as air); the aim
computes the wall door's OWN centre (on the floor in front when low, under the
ceiling when high) and the fit tests the FRAME's corners with a frame-sized front
(`_hqPortalFrontSolidAt`, a 6 cm pad, 0.45 m out) — never the walker's body pad; TOO
CLOSE is a floor door under you only; the wall lane is 1.45 m; in third person the
march starts at the officer's head. **THE CARRY** (no new physics engine — gravity
existed, horizontal momentum did not): `_hqTickWalker` measures `velX / velZ / velY`
off the frame and `pushX / pushZ` (the intended walk); a WALL door is crossed by
TOUCH (`_hqPortalWallTouch`, `carry.touchM` 1.05 past the discs, moving or pushing
in); `_hqPortalMapCarry(v, A, B)` (pure; `_hqPortalFrame` = the plain twin of
`_hqPortalBasis`) maps the entry vector through the pair — into A → out of B, up
stays, sideways mirrors, ≥ `carry.minOut` out of a wall, ≤ `carry.max`; the walker
keeps it as `pl.mvx / mvz` (`_hqTickCarry`: the walk's own slide / step rules, run
off over `carry.groundS` on the ground, kept in the air); `_hqPortalWallExit` stands
you clear of the twin's discs; wall → wall keeps the look's offset; across a room
change map.js calls `hq.portalCarryFor(twin)` before `_hqGoRoom` and
`_hqGoTo('portal:x')` spends `_hqPortalCarryMem`. Probe-only dev reads:
`hq.dev.walk()` / `playerGroup()` / `press()`, `hq.portalViewmodel()`. `npm test`
runs hq-portal.test.js (20). UNSEEN LIVE (RULE #1c): the grip on the CAST rigs
(the probe posed the creator base; `gun.pos` is the edit), the ADS feel, the
viewmodel's scale at the real lens, the fling through a ceiling hatch at speed.

## PHASE 9 DELIVERY 4 — THE MAP REMEMBERS (D6 · D7 · D8 · D9 + THE LIP) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §8 items 8 + 9. **D6 DISCOVERED ROUTES**: a world-graph link
is CHARTED when the officer walks one of its doors — map.js `_hqRecordVisit` on a
`link_<id>` door → data.js **`hqLinkSee(profile, id)`** (the ONE write; both
records: `door.hq.links.seen[id] = 'YYYY-MM-DD'` + the SYNCED blob
`progress.hq.links.seen` — `mergeProgressBlobs` carries it, EARLIER day wins,
`ACH_MERGE_CAPS.links` 512; profile.js folds the local record in on every read
like the finds; **ship data.js to Render too**), the caller saves once, a first
sighting toasts ROUTE CHARTED. Reads: `hqLinksSeenRecord` (the union),
`hqLinkSeen`, `hqWorldCharted(profile)`, and **`hqWorldRoutes(curRoom, { profile
})`** marks every leg `seen` / station `known` (`hqWorldApplyKnown`: here, a
FACILITY room, or a charted leg touches it) — no `opts` = no marks. THE WORLD
tab (map.js `_hqWorldHtml`) draws an unseen leg DOTTED (`.hq-world-unseen`), an
unknown stop as a hollow `?` + an UNCHARTED row; **GO stays on every stop** (the
user's rule, C row G). **D7**: `room.quiet = true` (the attic, the airlock) =
a tape and NO envelope (`hqBuildFinds`); the Spaceship's reveal is
`sun_viewport` (three-renderer.js proc + ticker) on the bridge's bow wall.
**D8 THE LEARNING SEQUENCE**: data.js `HQ_GUN_LESSONS` / `hqGunLessons()` (six
rows, `draft: true`, A15), catalogue `lesson_plaque` (wall) / `lesson_sign`
(a post) → proc `lesson_plaque(U, p)` — **`_hqProcProp(name, p)` hands a proc
its own placement row now** (a builder ignoring the 2nd arg is unaffected);
the six rows sit in training · the haunted hall · the foyer · upsidedown · the
stairwell · the Singularity's flavour (`lesson: '<id>'`); the hall's tape is
PINNED on the landing (`findSpots`, `y: 2.9`). **THE LIP (item 9)**:
`hqFindHardReach(row)` (data.js) proves every `hard` board find has a shot
from a walkway point — it FAILED on the gun as it stood (a 3.5 m top is
invisible from a 1.6 m eye; a wall exit lands at the base), so
`HQ_PORTAL_RULES.ledgeSnapM` (0.9) + three-renderer.js `_hqPortalLedgeSnap`:
a WALL hit on a raised board cell's side within 0.9 m of its top = a FLOOR
door ON the top, 0.55 m in (never in a cave; the ghost says THE LIP · ON TOP).
**D9**: `node check-find-spots.js --suggest` audits every find (spot · relax ·
distance · lesson · the case for a pin); the ~20 pins are the user's (§14 E).
`npm test` runs `hq-map-remembers.test.js`. NOT built: D5's blob keys, D7
variant beats for the Dutchman / Strip / Downtown, D3d. Unseen live (RULE
#1c): the dotted map, the plates, the post, the sun's pass, the snap's feel.

## PHASE 9 DELIVERY 5 — THE SYNCED BUILDING + THE THREE REVEALS (D5 · D7) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §6 D5 + the rest of D7. **D5**: `hq.cleared` / `hq.encounters` /
`hq.skate` ride the progress blob beside the finds and the links (data.js
`mergeProgressBlobs`, MONOTONIC: the later day + the ids' union; per-field max +
the later `last`; the best line by score; `ACH_MERGE_CAPS.cleared` 256 ×
`clearedIds` 32). RULE: every READ is the UNION of `door.hq.*` and
`progress.hq.*` (`hqEncounterLog` / `hqEncounterCleared` / `hqSkateRecord` —
never read `door.hq.encounters` or `.cleared` or `.skate` directly again),
every WRITE continues from the union and lands in BOTH (`hqEncounterRecord` /
`hqSkateBank` → `hqSyncedHq(profile, true)`, which never invents a v2 blob);
profile.js `profileLoadProgress` folds the local record in through
`hqDoorSyncFold(prog.hq, p.door)`. `portal` and `punch` stay local. **Ship
data.js to Render as well as R2** (the server merges off it). **D7**: the last
three complexes' reveals are VARIANTS on the parts (never new rooms; rolled on
a fresh arrival like Room 86, the way in re-plated): `site_prebuilt_revenge_
gundeck.variants.battle_stations` (night / p 0.25), `site_prebuilt_strip_
casino.variants.dead_hour` (3–6) + `.jackpot` (p 0.2), `site_prebuilt_downtown_
subway.variants.rush_hour` (7–10) + `.last_train` (0–5). A variant on a part
keeps the identity the room's test pins (the casino: no clock, no window, one
door, eight machines; the platform: nobody on the track; the gun deck: the
guns where they stand) — hq-synced-building.test.js runs every beat through
the urban / Dutchman prop rules (landings, the spawn, the lights ≤ 10). Dev:
`?hqvariant=jackpot`. Lines are Claude's DRAFT (A15). `npm test` runs
`hq-synced-building.test.js`. Unseen live (RULE #1c): all five beats.


## PHASE 9 DELIVERY 6 — THE FIELD, STAGE A (the seamless encounter) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §11.3 stage A, the user's rules: no VS screen, one click
back to where you were walking, TDM (Arena with a Cube / Code Red), a loss
wakes you in your office or the ward, "forget spawn zones — slid to the
nearest square tile, right up close to each other". **THE LATCH**: battle.js
`_encMatch` (module-local, never on `state`) is the run for THIS match, set in
`startMatch` from the armed marker; `_encRun()` is the ONE read for the intro
gate, the leaf warm-up, the VS card, the eye and the commit — nothing that
touches `window._hqEncounterRun` after the launch can bring the card back;
`window._ewEncounterField()` publishes its field; a rematch / a plain match
clears it. **THE FIELD RECORD** (data.js, after `hqEncounterEye`):
`hqEncounterField(ev)` = the board (or null), both feet, the walker → native
HEADING, the raw eye, and on a board the two CELLS (clamped in from the
walkway, never shared) + `snap` (their centres, room metres);
**`hqEncounterSeats(field, { W, H, n1, n2, free })`** = the START of both
parties: P1 seat 1 the walker's cell, P2 seat 1 the native's (no board → the
map's centre, P2 one cell east), each nudged to the nearest FREE cell, the
rest of each party on its own side nearest its lead; `free` is the caller's
walkability. map.js `autoGenerateSpawnZones` → **`_encounterPlaceSeats()`**
(a free cell = `_respawnTileSafe` + a walkable surface + nothing landing-
blocked) seats the units and the row relocation SKIPS them — the zones and
SPAWNS stand as before, so a TDM respawn still comes home to the team's row
and Arena's spawn nexuses are untouched. **THE SLIDE**: map.js
`_hqEncounterFire` → `ThreeRenderer.hq.encounterSnap({ walker, target,
targetId }, HQ_ENCOUNTER_RULES.snapMs, cb)` — three-renderer.js `H.snap` owns
the walker's frame (`_hqTickSnap`, smoothstep, no input, both bodies squared
up, the native's group moved) and the launch fires from its callback with the
eye re-read (`hq.encounterEye()`); a room with no board starts at once.
**THE EYE WITHOUT A BOARD**: `hqEncounterEyeFromSeats(field, seats)` (routed
through `hqEncounterEye(field, seats)`) hangs the camera's offset, rotated by
the heading, on P1's lead at `tileM` per tile — battle.js seeds it from
`field.seats` once the zone builder placed them. **THE MODE**:
`hqEncounterConfig(raw, ctx)` = `gm` TDM, `gmCodeRed` Arena when the site is
today's uncleared Code Red (map.js reads `hqCodeRed` and the encounter IS the
response — `L.codeRedRun` → `window._hqCodeRedRun`, `codeRed` on the
preselect); only the sticky TEAM SIZE is kept, rounds are the mode's own.
**NO ROSTER ON FILE** = a stand-in squad (`party.fallback` →
`_hqApplyLastParty` pads, `_msConfirm` randomises identities + loadouts),
never the terminal. **THE WAY OUT**: battle.js `_encounterResultButtons()`
replaces the result bar with ONE button (▸ BACK TO THE ROOM / ▸ WAKE UP →
`backToMainMenu` → `_hqReturnOrMenu`); `showResultOverlay` restores the
standard bar first when the last match left the encounter's. **WHERE YOU
WAKE**: `hqEncounterWakeRoom(profile)` = the ward on an odd loss count, your
office (Room 101) on an even one (the commit already counted this exit);
`_hqReturnOrMenu` lands there (`encRes.wake`), the toast says which. NOT
BUILT (stage A's rest): the battle at the room's transform with the room's
furniture as the setting (§10 stage 4), explicit spawn zones per seat for
respawns, the rasteriser (stages B–D — a cave / a complex part still fights
the site's Δ from its centre). `npm test` runs hq-encounter.test.js (30).
UNSEEN LIVE (RULE #1c): the slide's feel under the strike clip, the eased
first frame off the seats, the stand-in squad's identities, the one-button
card over the podium.

## PHASE 9 DELIVERY 7 — THE FIELD, STAGE A rev 2 (the seats are the zones, the board untouched) (2026-09-16, local delivery)
Delivery 6 seated the parties on their cells but the zone builder still ran its
ROW pass first — the site board's two edge rows were FLATTENED and their egress
rows rewritten for a fight the walker had just crossed, a TDM respawn came home
to an edge row and a Code Red Arena fight put spawn nexuses there. Now map.js
`autoGenerateSpawnZones` takes THE FIELD branch right after the custom-map one
(`_encounterPlaceSeats()` → `{ zones, index, seats }`): the seats ARE the zones
— data.js **`hqEncounterZones(seats)`** = `{ 1: [cells], 2: [cells], field: true }`,
EXPLICIT PER SEAT (`_spawnIndex` = the seat, `SPAWNS` = the seats) — and the
builder RETURNS: no row, no flatten, no egress rewrite, no `_initArenaSpawnNexuses`.
**`isFieldSpawnZones()`** (map.js, on `window`) is the ONE read every zone PERK
gates on: `getSpawnZoneOwnerAt` → 0 (the end-of-round regen / scorch skips; the
nexus branch is untouched), the Arena spawn nexuses stand down, three-renderer.js
skips the spawn wash / the sanctuary curtain / the minimap tint on a `field`
record. The respawn readers (`getRespawnZoneFor` → `section: 'home'`, recall,
Gauntlet reinforcements) keep the tiles — a respawn comes home to the seat you
started on. **`hqFieldTransform(board)`** (data.js, on `window`) is THE ONE
room-metre ↔ tile rule (`toTile` / `toRoom` / `cellOf` / `centre` / `inside`);
`hqEncounterField` and `hqEncounterEye` read it — never write `(x + half) / C`
again. Nothing relayed (an encounter is VS-CPU; `field` is a plain boolean on a
synced object). `npm test` runs hq-encounter.test.js (33). UNSEEN LIVE (RULE
#1c): a respawn landing on a mid-board seat beside the enemy, the Code Red
fight with only the centre nexus. Still open in stage A: §10 stage 4 (the room's
furniture as the battle's setting), §14 B (the party's arrival).

## PHASE 9 DELIVERY 8 — THE FIELD, STAGE B (the rasteriser on the cave) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §11.3 B: "anywhere you stand becomes the 8×8" — a CAVE
chamber (no Δ under the walker; it fought Hollow Earth's board from the centre)
now fights ITS OWN WINDOW. data.js, the block after `hqEncounterWakeRoom`:
**`HQ_FIELD_RULES`** (size 8, base = MF_DELTA_BASE_H, rockMin 3 / rockPad 2,
fluidMin −1, prefix `field:`), **`hqFieldRoomOk`** (stage B = a wild room with
a `cave` grid), **`hqFieldRaster(roomId, ox, oz)`** (the 8 × 8 of the cave grid
at origin (ox, oz) — off the grid / `#` = ROCK at max(rockMin, the tallest IN
cell + rockPad), every cell's `tile` = its height in BATTLE LEVELS: a plain
cell round(top / C), a ramp its middle, a fluid floor(sheet / C) ≥ −1; a
hazard the walker never enters is OUT but drawn as the liquid), **`hqFieldReach`**
(the walker's own step rule inside the window), **`hqFieldWindow(roomId,
walkerPt, targetPt)`** (THE WINDOW'S CHOICE: every origin holding both feet,
scored by the walker's reach inside it, then the nearest centre to the feet's
midpoint → `{ id, board: { N, C, x0, z0, cave: true }, cells, raster }`),
**`hqFieldBuild`** (the map entry through the forge's `_mfNew`: the shared
bed, the site Δ's tints, deep water / a bridge flooding the layer under them,
spawns = `hqEncounterSeats` over the IN cells — explicit per seat, rule §7),
**`hqFieldRegister`** (PREBUILT_MAPS + MAP_LAYOUT_PRESETS under
`field:<roomId>:<ox>,<oz>`, the site Δ's env → the cavern world + `near`).
THE GUARANTEE (rule §4) holds by construction — round() of half-levels never
splits a walker's step — and hq-field.test.js proves it on every window of
every chamber (2910 windows). `hqFieldTransform` takes an explicit ORIGIN
(`x0` / `z0`; a site board stays centred) so THE SLIDE / THE SEATS / THE EYE
read a cave like a board; **`hqSiteId` reads a `field:` id as its room's
site** (the CPU pool, the Code Red response, the checklist, the stamp).
map.js: `_hqEncounterFire` chooses the window in a cave and hands its frame
to the event as `board`; `_hqEncounterStart` → **`_hqFieldRegister`** (the
GAME_MODES row + an MS_MAP_LIST row wearing `field: true` — match-select.js's
card filter drops it) and launches the field id; the toast says THE CAVE IS
THE BOARD. **Two bugs the probe measured and fixed**: (1) THE SLIDE's
callback leaves the building INSIDE the walker's tick — `_hqFrame` now
returns when `_hq !== H` after the walker / the crossing tick (the frame
ticked a disposed room's `chars`); (2) D2's seat-1 pin NEVER FIRED —
`_msConfirm` nulls `_hqPreselect` long before `optimizeRandomizeParty(2)`;
the lead rides **`window._hqEncounterLead`** across the null and is spent
after the draw (state.js reads the marker first). **THE PROBE**:
`node playtest_field_offline.js [roomId]` (repo tooling — the offline HQ
harness + a strike; needs the server + `npm i --no-save playwright
three@0.128.0 react@18 react-dom@18 three.meshline`) prints the mode, the
zones, the units, the heights; PLAYTEST_NOTES "THE FIELD PROBE". Measured:
`field:site_prebuilt_hollow_earth_gallery:3,7`, TDM, the seats the zones, P1
seat 1 on the walker's cell, P2 seat 1 the Gnome wearing the room's name one
cell east, the ledge at +1 / the rock at +2 in the heights. NOT built: box
rooms (stage C), the window's thin walls / a door as a threshold (stage D),
the HUD of the field (E), the room as the battle's setting (§10 stage 4).
UNSEEN LIVE (RULE #1c): the real cave sheets on the field's columns, the
rock's height against the chamber's walls, the eye's first frame in a cave.

## PHASE 9 DELIVERY 9 — THE FIELD, STAGE C (the rasteriser on the box rooms) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §11.3 C's rasteriser: a COMPLEX PART (a box room with no Δ
under the walker — the hall, the hold, the casino, the platform) fights ITS OWN
WINDOW like a cave since stage B. data.js (the stage B block, grown):
**`HQ_FIELD_RULES.box`** (cell = HQ_CAVE_CELL · cover 0.5 · margin 0.4 · the
bands low 0.5 / high 2.2 · footMin 0.7 · climbM 1.46 = the walker's jump apex ·
dropM · galleryRise / galleryRun = the renderer's constants, hq-field.test.js
diffs them); **`hqFieldRoomOk`** = a cave chamber OR a wild box room that is not
a site's BOARD room; **`hqFieldBoxInfo(roomId)`** = THE LATTICE (cells of a
battle tile on the room's axes, edges at off + k·C from the centre, `off` per
axis 0 or half a cell — the one that puts the most cells inside; a cell is IN
when ≥ 50 % of it lies inside and its centre stands 0.4 m off the wall) + THE
COVERS (every floor prop the renderer BLOCKS — `foot > 0` and `block` or
standing, top = `y + cat.h || 1`, the renderer's own read — as a box in room
axes; a disc as the square of its area, ignored under footMin; a cover on
≥ 50 % of a cell sets its top; `seat: false` on a cover) + the gallery through
**`hqFieldGallery`** (`_hqGalleryFrame`'s frame in data: the slab a +2, the
flight's treads at the run's middle → +1 then +2); cached per room OBJECT (a
variant swap re-rasterises). **`hqFieldBoxTile(top)`** = the band (< 0.5 the
floor · < 2.2 a +1 · else a +2). **`hqFieldLattice(roomId)`** is ONE shape over
the cave grid and the box lattice (`walk(gx, gy)`) for **`hqFieldWindow`**,
which nudges a foot in a partial edge cell to the nearest walkable
(`hqFieldNearestWalk`) and marks the board `box: true`. **`hqFieldRasterBox`**:
OUT = the room's WALL (rock in the shell's wall sheet), IN = the floor sheet at
its band. **`hqFieldBoxStep(a, b)`** = the walker's own step (up ≤ climbM,
down ≤ dropM, the flight + the slab one run) — `hqFieldReach` dispatches on
`R.box`; THE GUARANTEE (walker-reachable ⇒ unit-reachable) holds by the bands
and the test proves it on every window of every part. `hqFieldLayout(site,
base, { box })`: a box field is INDOORS — no `near`, no `motion`, THE WORLD
inert (`kind: 'room'`); the site's sky stands until §10 stage 4 draws the room
round the field. map.js `_hqEncounterBoardCopy` says THE ROOM IS THE BOARD in
a part. Nothing relayed (VS-CPU; RULE #2). NOT built: §10 stage 4, stage D
(the thin walls / a door as a threshold), stage E (the HUD). Measured: the
hall 56 IN / three heights, the platform 5 wide inside rock, the attic 15 IN
(the plan's "≥ 24" predates the measurement; the test pins ≥ 12). Unseen live
(RULE #1c): the wall sheets as rock columns, the +2 landing, the eye's first
frame in a box room.

## PHASE 9 DELIVERY 10 — THE ROOM ROUND THE FIELD (§10 stage 4) (2026-09-16, local delivery)
An encounter's battle is built INSIDE the room the officer struck from. three-renderer.js
"THE ROOM ROUND THE FIELD" (right before `_hqEnter`): **`_hqBattleRoom()`** reads battle.js
**`window._ewEncounterRoom()`** (the latched run's `room` / `field` / `fieldId`; null outside an
encounter — a plain match never wears a room) and answers `{ room, T, site, base, field }` for a
box room that is not a cave (a site room only when the board is its Δ); **`_hqBattleRoomMatrix`**
= ONE matrix, hqFieldTransform's rule (cell (0,0)'s NW corner on tile (0,0)'s, the floor on the
base top, `(ts / C) / U`); **`_hqBuildRoomInBattle(ctx)`** (from `_buildHorizonScenery` at every
`scene.add` site, after THE WORLD; **`_hqBattleRoomKey()` rides the horizon key**) runs the HQ
builders on a SCRATCH `_hq` record in a try / finally (`_hqBuildBoxShell` · `_hqBuildGallery` ·
`_hqBuildSiteDressing` · `_hqBuildDoors` · `_hqBuildCounters` minus the `battle` marker ·
`_hqPlaceProps`), filters the pieces (CSS2D plates; `_ew_hqPart` floor / ceil / pipe / strip on a
site room, `ceil` on a part; a site room's `_ew_hqGround`; a prop on a COVER cell —
`_hqBattleRoomCoverAt`, the raster's '2'..'9'), bakes each through the matrix and hangs them as the
occlusion fade's facility group: a piece wearing **`_ew_hqWall`** (every shell slab — set in
`slab()` — every box-wall door / seam / wall prop) goes into its side's `_ew_occWall` group, so the
wall between the eye and a unit fades. A scratch record's **`floorHole`** makes the box shell draw
its floor as four bands round the window (the field's columns fill it). **`_hqBuildSiteDressing`**
is the site board's tail (signs · signboards · masts · lamps · strips) split off so it can stand
without the board. RULES: any new piece of a box shell must wear `_ew_hqPart` (the bridge drops by
part); a builder that reads `_hq` must tolerate the scratch record (null profile / site / setting,
every list present); `HQ_BATTLE_ROOM_LIGHTS` (4) caps the room's point lights in a battle. Kill-switch
`EW_HQ_NO_ROOM_IN_BATTLE`. NOT drawn: a cave chamber (the cavern world stands), the console's
crossing (no marker), the tickers. `npm test` runs `hq-room-in-battle.test.js`. Unseen live (RULE
#1c): all of it — DOOR_HQ_BUILD_PLAN §9 lists what to eyeball first.


## PHASE 9 DELIVERY 11 — THE SWOOP + THE CAVE ROUND THE FIELD (the encounter's seam) (2026-09-16, local delivery)
The user's three notes: the cave fight opened under Hollow Earth's stars / nebula / floating crystal roster, a
loading card stood between the strike and the board, and the cut should be ONE camera swoop. **THE DARK
CEILING**: data.js `hqFieldLayout(site, base, { cave })` — a cave field is indoors like a box field (no `near` /
`motion`, `world: { kind: 'room' }`) AND `scenery: 'none'`, `stars: 0`, `nebula: 0` (the fog + tint stay; the
site's own EW_MAP_META row is untouched). THE WORLD's dissolve was never it (`_wd.stab` starts grounded).
**THE CAVE ROUND THE FIELD**: three-renderer.js `_hqBattleRoom` takes a cave (`R.cave`); `_hqBuildRoomInBattle`
runs `_hqBuildCave(copy)` on the scratch record BEFORE the shell; `_hqBuildCave` reads `_hq.floorHole` and draws no
floor / ledge / ramp / bridge / pool / glow inside the window (the field's columns stand there) — its ROCK is drawn
inside too (the crag encloses the field's short rock column), stalactites outside only. RULE: a builder that runs
on the scratch record reads `_hq.floorHole` for the window. **NO LOADING CARD**: battle.js `showBattleLoadingScreen`
— `_encMatch` takes the auto-sim path (warmers fire, microtask boot, models stream in). **THE SWOOP**:
three-camera.js tweens the seed (`_seedFrom` → the ideal, smoothstep over the window, `_seedT0 / _seedEase`) — never
a damp (a damp reads as a jump then a drift); the ordinary damp after the window. **THE DISSOLVE keyed on the
first frame**: `_hqDissolveStart(H, { onFrame: true, hold, ms })` holds the room's last frame until `renderFrame`
has drawn the battle once (`_hqDissolveRec` → `_hqDissolveFrame`; `hold` = the cap), then fades over `ms`; map.js
`_hqEncounterStart` asks `{ onFrame: true, hold: 1500, ms: 220 }`. `npm test` 1512 / 1508 / 0 / 4 skipped. Unseen
live (RULE #1c): the swoop's feel (`seedPose(eye, 1.4)`'s second argument is the edit), the fade's pop, the GLBs
popping in, the black sky over the chamber, the crag at the window's rim.

## PHASE 9 DELIVERY 12 — THE FIELD, STAGES D + E (THE EDGE + THE HUD OF THE FIELD) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §11.3 D and E — the last two stages of THE FIELD. **THE EDGE (D)**: a box room's lattice
used to sit at offset 0 or half a cell, whichever gave the most cells; an OUT partial cell is a ROCK COLUMN filling
its whole cell, so its inside share stood INSIDE the room in front of the true wall (the hold: a metre of rock proud
of BOTH long walls; a door in that wall buried). data.js `hqFieldBoxInfo`'s `axis` now picks the offset per axis
among the exact alignments (a wall on an edge, the two partials shared, 0, half) then a 0.05 m sweep by the rock
PROUD of the walls — `HQ_FIELD_RULES.box.edgeSnap` 0.3 (flush) / `proudMax` 0.8 (the bound the test proves — a
residue r < 0.8 m goes on ONE wall, r ≥ 0.8 splits into two IN partials, nothing proud) / `doorWeight` 3 (a wall
with doors stays flush when the other is free) / `sweep`; `bi.edges = { w, e, n, s: { proud, flush, doors, at } }`,
`bi.colsX / colsZ`. **THE RIM + THE DOORS ON THE FRAME** (`hqFieldRimBox`, run by `hqFieldRasterBox`): every OUT
cell touching an IN cell wears `edge: 'wall'` + `proud`; `R.doors` = every room door whose landing lies in the
window (`{ id, wall, rim, x, y, inX, inY, proud, flush, link, wide }`, the rim cell marked `door`) — a RECORD only
(rule §10: the rim IS rock in the engine; `entry.field.doors / edges / dump`). **THE DUMP**: `hqFieldDump(R,
{ walker, target, seats })` (8 lines: `#` rock · `%` rock proud > edgeSnap · `.` floor · `1`/`2` up · `!` hazard ·
`D` a door's rim cell · W / T / a / b); **`node check-field-windows.js [--all] [--json] [room]`** prints every
wild room's window from its door landings — stage D's acceptance grid, the user's to read; `--json` is what the
test reads (never `process.exit` after prints in a tool the test spawns — a draining pipe lost the tail under
the parallel run). hq-field.test.js proves LEGALITY FROM EVERYWHERE (every cell the walker can stand on in every
wild room: both feet in, the walker's cell IN, reach ≥ 8, both squads of four seated; ≥ 1500 windows). Fixed on
the way: **a lead never displaces the other lead** (`hqEncounterSeats` holds the native's cell while the walker
is nudged off a table top). NOT built, by decision: the thin-wall primitive on the rim (a thin wall is vaulted /
hovered over / breached — a floor strip behind the true wall would not be sealed; the rock column is the honest
cell, the true wall is §10 stage 4's) and the door as the party's ARRIVAL threshold (superseded by the user's
seat rule, Delivery 6). **THE HUD OF THE FIELD (E)**: the scoreboard's mode line reads THE FIELD · TEAM
DEATHMATCH while an encounter is live (hud.js reads battle.js `_ewEncounterField()` + `HQ_FIELD_RULES.hudLabel`),
the result stamp reads HELD / EXITED · THE ENCOUNTER · the room · the native with the mastery flag after it
(battle.js `_stampHqSite` READS `window._hqEncounterResult`, never consumes it — the return spends it; a Code Red
cleared still outranks), the pause menu's OFFICER row says LAST <RACE> IN <ROOM>. **`hqEncounterRoomLabel
(roomId)`** (data.js, on `window`) is the ONE wording for where a fight was (a room's label; a site's board room
the site's label; never an id). `npm test` runs hq-field.test.js (18). UNSEEN LIVE (RULE #1c): the residue wall
(the attic's north, the casino's east, the subway's north — 0.25–0.75 m of wall sheet before the true wall), the
scoreboard line's width with the tag, the stamp's length on the card.

## THE MAP — the directory as a subway map (2026-09-16, local delivery)
The Building Directory (the hall's kiosk, the pause menu's DIRECTORY, `Q`)
is a MAP: every room of the building and every site of the world is a
NODE, every door / lift / seam an EDGE, drawn as subway lines over the
impossible architecture, and it only shows what the officer has WALKED.
**THE LEDGER** (data.js, the block before THE COMPLEXES): `hqRoomSee
(profile, roomId)` is the ONE write — map.js `_hqEnter` calls
`_hqRecordRoomSeen(roomId)` on EVERY room entry (typeof-guarded; a first
sighting toasts ON THE MAP) — into both records, `door.hq.rooms.seen` and
the SYNCED blob `progress.hq.rooms.seen` (`mergeProgressBlobs` carries it,
the EARLIER day wins, `ACH_MERGE_CAPS.rooms` 512; `hqDoorSyncFold` folds
the local record in on every read — **ship data.js to Render too**);
`hqRoomsSeenRecord(profile)` is the union read. **THE GRAPH**
`hqMapGraph()` = every room reachable from the foyer along the DIRECTED
doors (the stage-1 `bay_*` rooms nobody can walk into are off the map) +
the car ⇄ its stops; edges deduped per pair, kind door / lift / secret /
way / link (a seam wears its route's colour), `gate` kept. **THE LAYOUT**
`hqMapLayout()` (cached per rooms object) is DETERMINISTIC and
collision-free — never a random number, never a force pass: the hall at
the origin, `ring_g` / `ring_m` drawn as RINGS round it, the hall's doors'
rooms at their door's `deg` (deg 0 at twelve, clockwise — the star chart's
rule; radius by level), the sites at their threshold's angle on the ring
(`HQ_MAP_L.siteR` per ring), the elevator a SHAFT at `shaftX` with a band
per stop (`floorDy`), H-Wing under the lowest stop, everything else walked
level-by-level from EVERY seed into the first FREE cell (band mode steps
left, polar mode steps outward; a same-site `links` row — the cave's
mouth — is a domestic door for the walk). Tune `HQ_MAP_L`, not the code.
**THE MODEL** `hqMapModel(profile, curRoom, { all, seen })` = nodes with
a state — `here` / `seen` (numbered: `hqMapRoomNo`, a part wears none) /
`q` (a question mark: an unseen room behind a NON-secret door of a seen
room; a link's far end too) — the rest are off the sheet; edges `known` /
`q` (never between two question marks; a secret door only once both rooms
are seen), `charted` off `hqLinksSeenRecord`; the BOX that fits the drawn
nodes. **THE PANEL** (map.js "THE MAP" block, before `_hqWorldHtml`):
`_hqMapHtml` draws the SVG (`.hq-map-svg`, `viewBox` = the fit box ×
`HQ_MAP_U` 100 px per unit; the hall a double circle, a site a diamond, a
part a small dot, a ring a dashed circle, the shaft a thick gold line with
a stub per stop, a seam a curve bowing away from the hall in its route
colour, a way dashed, an unwalked seam dotted, a `?` node dotted; the
number inside a numbered node, a label under an un-numbered / the here /
the picked one) + the bar (N OF M PLACES · Q IN QUESTION · seams walked,
+ / − / FIT) + the legend + THE CARD (`_hqMapCardHtml`: the picked node —
number · label · where (`pos.where`) · FIRST SEEN · doors charted · GO;
a `?` offers GO ANYWAY (C row G, GO stays); the here-card carries THIS
ROOM's WALK rows); then `<details>` THE ROOM REGISTER (reached places
only) and THE LINES (`html += _hqWorldHtml();` — hq-world.test.js pins
the literal). **THE REVEAL** `_hqMapAfterRender(body)` (called by
`_hqOpenPanel` after the innerHTML lands) diffs the model against what the
map LAST DREW — `door.hq.map = { n: { id: 'n' | 'q' }, e: { key: 1 }, box }`
(viewer-local, never synced: a memory of a drawing, not a discovery;
`_hqMap.mem` without a profile) — and animates the difference with CSS
classes delayed by `--d`: a `?` that became a number FLIPS (`.flip`: the ?
spins out, the number spins in, the dot's dashes solidify), a new room
POPS, a new `?` fades in (`.qin`), a new leg DRAWS itself (`.draw`,
`--len` = its length; dashed legs fade), and the frame ZOOMS OUT from the
last box to the new fit (`_hqMapTweenView`, `HQ_MAP_ZOOM_MS`); the first
open pops with no zoom; a re-render inside one open (a node picked, a
zoom button) finds no difference. `prefers-reduced-motion` kills it.
Wheel zooms about the cursor, a drag pans (a drag never picks), double
click / FIT refits; a discovery drops the officer's own view. Dev:
`window.EW_HQ_MAP_ALL` draws everything; `window._hqMapDev()`. Nothing
on `state`, nothing relayed (RULE #2). `npm test` runs `hq-map.test.js`
(the ledger, the graph, the layout's guarantees, the model's rules, the
panel headless, THE REVEAL through a fake DOM). UNSEEN LIVE (RULE #1c):
the whole look — the ring circles' weight, the label sizes at the fit
zoom, the flip's timing, the zoom-out's ease, the pan under the panel's
scroll (the stage is `touch-action: none`; the card scrolls).

## THE WOODS — the forest on the cave grid (HQ plan 9.3 stage 3) — 2026-09-16, local delivery
**SUPERSEDED 2026-09-17 — THE TERRAIN ROOMS (below): the seven woods rooms are smooth fields now; the sheet, the links, the weenies and the tapes stand.**
The SEVENTH complex, the FAIRY FOREST's (`site: 'prebuilt_fairy_forest'` +
`part`, no `roomNo`; data.js, the block right before H-WING): seven OPEN
box rooms on the CAVE GRID (rev 11's dungeon rules) under ONE sky
(`hqWoodsShell(o)` — defined right before `DOOR_HQ`; `HQ_WOODS_LANDMARKS`
= the two weenies). **THE TREE CELL**: `HQ_CAVE_STD` `T` (a broadleaf) /
`D` (a dead tree) / `R` (a redwood, `tall`) — `{ lvl, tree: <foliage kind> }`
— a wall to the walker (`walk: false`, never a hazard; `hqCaveFeet` null),
the floor at its level drawn under it, ROCK to the field's raster wearing
the `forest` sheet (`hqFieldRasterCave` reads `src.tree`), planted by
three-renderer.js `_hqBuildCave` with `_nrTree` on a bare kit (the near
kit's foliage OBJ; the HQ loop's `_nrPollPending` swaps the proc stand-in);
a room's legend may raise one onto a tier (`Q` / `Z` on the trail). An
open cave room hangs NO stalactites (`nSt = S.open ? 0 : …`), no masts and
no strips — its torches light it (doorhq.test.js's mast rule exempts a
`cave` room). THE ROOMS: `site_prebuilt_fairy_forest_clearing` (THE
CLEARING — the crossroads: seven doors, the knoll, the stream, the old
tree), `_trail` (THE MOUNTAIN TRAIL: two tiers, Shasta's door on the top
one — a door you climb to), `_redwoods` (→ the Grove), `_pasture` (the
fence: the ranch's gate on the w wall, the house's garden gate on the n),
`_stair` (THE STAIRCASE: four wooden risers `E G I J` = lvl 1–4 in
`wood_planks`, a landing, an EXIT door that opens on the building's
`stairwell`), `_deadmans` (DEAD MAN'S CAVE: a crag, a storm drain, the
`graffiti_wall` proc — a canvas panel standing against a rock face, `face`
= the way the paint looks — and a `leaf_cell` grate onto the `tunnel`,
THE SUBWAY's fourth station) and `_ritual` (standing stones `S` = a lvl-4
unwalkable block, the circle, `leaf_hell_arch` onto Room 333). The way in =
`siteRooms.backDoors.prebuilt_fairy_forest` (n x −10, `leaf: null`). THE
LINKS: rev 7's three fence gates RE-POINTED and renamed (`woods_haunted` /
`woods_skinwalker` / `woods_grove`), plus `woods_shasta`, `woods_stair`,
`woods_sewer` (route `subway`), `woods_ritual` (facility ends `{ room }`,
the garden-well precedent, never gated) and `fairy_camelot` (a `pool` seam,
BOTH ends free on the north strips at `face: 90` — Camelot's north wall
has no lane left; hq-world's free-end landing rule passes only for face 0
/ 90 as written). **THE WEENIES**: `shell.sky.landmarks = [{ kind, id, deg,
dist, s, y }]` → three-renderer.js `_hqBuildLandmarks` (before the roster,
so a `scenery: 'none'` sky can wear one) → `_hqLandmarkBuilders.peak`
(Shasta: cones + a snow cap + `_hzLenticular`) / `.castle` (Camelot: the
curtain wall, four towers, the keep, lit windows); deg 0 = north,
clockwise (the star chart's rule), `dist` = the share of the sky disc,
never a floater. Adding a landmark kind = one builder. TAPES: seven
re-homed (the garden's `1618` → the clearing; Shasta / the ranch / the
forest / the grove / Babel / Downtown gave their SECOND tape — a built
site keeps ≥ 1, hq-finds.test.js says 1–2 now, a one-tape site has no
board find). `npm test` runs `hq-woods.test.js` (the sheet, the tree cell,
the dungeon rules incl. NO ISOLATED WALKABLE CELL, the pairs, the eight
links, the production landings, the park rule, the weenies, the tapes,
the field windows). Unseen live (RULE #1c): the trees' scale against the
walker, the wedge ramps as trails, the wooden risers, the two landmarks'
size over the treeline (`HQ_WOODS_LANDMARKS[i].s` / `dist` are the edits),
the graffiti's read, the pool seams on the strips.

## THE DIRECTORY GUARD — every room and map is on the map, or the test says so (2026-09-16)
The user's rule: "the map / room directory always gets flagged for update
with any rooms / maps we add". The directory (THE MAP, the register, the
world tab) is GENERATED from the doors — nothing is drawn by hand — so the
guard is a TEST: hq-map.test.js **THE DIRECTORY GUARD** fails, naming the
room, when any `DOOR_HQ.rooms` entry is not reachable from the foyer along
doors (`hqMapGraph`), when the layout cannot place a node, when a built
site / complex part / numbered threshold is off the map, or when the
register / world tab name a room the map cannot reach. Only `bay_*`
(stage-1 rooms) may be off the walk. ADDING A ROOM = give it a door from a
room that is on the map (or a `links` row) and run `npm test`; ADDING A
SITE = the 7.10 checklist (the threshold puts it on the map). No manual
directory edit exists to forget.

## THE WOODS FIXES — the trees, the flight, the storm drain (2026-09-16, local delivery)
The user's three: no woods, a block staircase, a crag that should be a sewer.
**THE TREES**: three-renderer.js `_hqBuildCave` handed `_nrTree` a bare
`{ ts, rng }` — `_nrTreeProc` needs `K.cyl / K.mat / K.lit`, threw, the catch
swallowed it, and NO woods tree was ever planted. RULE: a tree anywhere in
the HQ is `_nrTree` on a REAL `_nrKit` (the site board's `hq: { w: 0, gap:
0, B: 1, tints: null }` kit) — never a hand-typed kit object. Every broadleaf
cell grows a second smaller tree; **THE TREELINE** = `shell.forest = { depth,
spacing, rows, start, kinds }` (metres; in `hqWoodsShell`) plants rings of
the foliage OBJs on the apron PAST the grid, door lanes clear for 4.6 m,
`EW_PERF_LOW` halves it. There is NO tree GLB in any bucket — the foliage
set is the OBJs (`_FOLIAGE_MODEL_FOR_KEY`). **THE FLIGHT**: a cave legend
row `{ lvl, slope, stair: '<sheet>', stairSide }` is a slope cell DRAWN as
the board's barrier_passage flight (`_buildStairMesh`, STAIR_STEPS treads)
rising one level — the staircase room's `E G I M`; never plank blocks, never
a skate ramp. **THE STORM DRAIN**: Dead Man's Cave is the woods' one INDOOR
part — a closed box on a brick cave grid (`rock: 'bricks_2'` to the 3 m
ceiling), a 3-cell culvert with the channel down its middle, the sump
halfway (ledge + ramp `m`), the grate at the east end; `cave.stalactites:
false` is read by `_hqBuildCave`'s `nSt`. hq-woods.test.js pins all three
(the sewer's width, the flight, the kit, the treeline). Unseen live (RULE
#1c): the OBJ foliage at this density — the offline shots show stand-ins.

## THE SHIP'S ONE DOOR + THE PLANET FLOOR + THE ROCKS + THE PYRAMID ON MARS — 2026-09-16, local delivery
**THE SHIP'S ONE DOOR**: the Spaceship's airlock has ONE collar (`site_prebuilt_
derelict_airlock` door `collar`, port wall, `action: { ship: true }`) that opens
on the course THE NAV CONSOLE on the bridge laid in (counter `nav`, `overlay:
'nav'` → map.js `_hqNavHtml`, `[data-course]` → `window._hqSetCourse` → data.js
`hqShipSetCourse`, one profile transaction, `door.hq.ship = { dest, set }`,
viewer-local). `DOOR_HQ.ship` names the collar + the console. A destination is
a `DOOR_HQ.links` row DOCKED on the collar — an end `{ site, part: 'airlock',
door: 'collar' }` (`hqLinkEndOk` accepts it, `hqLinkEndWear` reads the door's
leaf, `hqLinkDoors` generates NO door at that end and lands the far end AT the
door; `hqLinkDockedDoor` — only a ship door takes a dock). Reads:
`hqShipDestinations()` (sheet order), `hqShipCourse` / `hqShipResolve(profile,
{ force })` (what the collar opens on), `hqShipApplyCourse(profile)` re-plates
the collar (map.js `_hqEnter` calls it; `hqDoorNo` reads the destination's
number off `_courseNo` — never `roomNo`). map.js `_hqDoorDirectAction` resolves
`act.ship` (a course = straight through, charting the link; none = the panel
naming the bridge). `hqWorldGraph` gives the collar one edge per destination.
Adding a port = one link row docked on the collar. hq-spaceship.test.js /
hq-world.test.js own it. **THE PLANET FLOOR**: three-renderer.js
`_hqBuildSetting`'s cull dropped the planet ground as "in a door zone" (every
planet room stood on the sky) — `_wdBuildPlanet` tags its meshes `_ew_hqPlanet`
under `o.hq` and the cull keeps them; the room's planet + rim build at the
room's tile (`_hzKitTs`) with `K._wdFog` set. **THE ROCKS** (the user: no
pointy cones): `_hzRock(K, { kind: boulder | crag | stone | any, span, h, tex,
color, lift, snow, sink, tilt, rng, fog, cast, foot })` = the asteroid GLBs /
the standing stone in a TINTED Lambert (`_hzRockPick`), stretched toward `h`,
sunk, a snow cap on request, the jostled dodecahedron as the fallback; it
replaced every cone in `_nrPeaks`, `_nrSpires`, `_WD_RIM.peaks` (a mesa = the
boulder squashed) and `_WD_RIM.spires`; `_hzDoorKitGLB` / `_hzMiscKit` take
`matPick` + `onDone`. Never raise a ConeGeometry as a mountain / spire again —
call `_hzRock`. The pyramids and the icebergs keep their geometry. **THE
PYRAMID ON MARS**: `_hzModelPyramid(rng, { h, color, lift, cap })` (a lit
tinted Lambert when `color` is given; sizes against the kit tile) stands the
Cydonia pyramid off Mars's far corner in `_NR_BUILDERS.mars`. Log:
DOOR_HQ_BUILD_PLAN §9. Unseen live (RULE #1c): the rock GLBs' read, the tint,
the pyramid's size, the collar's plate, the console's rows.


## THE HQ HUD PASS — the exploring HUD wears the battle HUD's themes (2026-09-16, local delivery)
The user: "a dark box with a gold or purple outline … the same issues plaguing
the battle HUD." The D.O.O.R. HQ's exploring HUD reads the BATTLE HUD's theme
TOKENS now: styles-base.css "THE HQ HUD PASS" (appended at the END of the file
so it wins the cascade — restyle THERE, never the HQ block above it) maps
`--hq-*` on `#hqPage` to `--ew-plate-bg / -edge / -seam / -rim / -lip / -scan`,
`--ew-row-*`, `--ew-ink*`, `--ew-sel*`, `--ew-drop` (Classic Blue fallbacks),
and every plate — the strip, the prompt, the toast, the trick line, the panel
card, the pause frame + its command blades, the map stage / card, the buttons
(capsules) — wears the Horologe's rounded, bevelled material; Settings →
Display → HUD Theme restyles the building with the battle. hud.js injects its
stylesheet (the tokens live in it) ONCE AT SCRIPT LOAD now
(`_injectHudHideStyles()` after its definition — idempotent, battle-scoped
rules), because the HQ renders before any battle HUD mounts. **THE STRIP**:
the room you stand in IS the title (`#hqRoomTitle`, map.js `_hqFillStrip`;
`#hqRoomName` under it = D.O.O.R. HEADQUARTERS · ROOM № · sub) — no second
box with the room's name anywhere; the CSS2D **door plates are floating
labels** (no background / border, a hairline of the function colour under
the name; the battle marker's inline border is gone); NO buttons (DIRECTORY /
EXIT are the pause menu's — ESC / P); a pill sits on the strip only while it
is LIVE: `_hqStripFlash(key, ms)` (the one write; `HQ_STRIP_FLASH_MS` 6 s) /
`_hqStripPillLive(key)` (the one read, the strip re-fills when the flash runs
out) — a found tape flashes TAPES, a placed door flashes THRESHOLD (drawn =
always shown), FORM 365 flashes on a fresh arrival and on a return from a
match that ticked a line; the SKATEBOARD pill shows only while riding. The
pause menu's OFFICER sheet carries every count. **M = THE MAP**:
three-renderer.js `_hqKeyName` knows `m` (inserted after `d` — the pinned
`e … q || p` chain is untouched), the handler routes `onHotkey('m')` BEFORE
the pause gate; map.js opens the directory, M again closes it (a pause menu /
terminal / other panel keeps the key). **A NODE CLICKED TWICE GOES**: the
first click picks the room (the card: where it is + GO), the second click on
the same node walks you there through `_hqDoAction({ room, at })` — the same
path as the card's GO; the card says CLICK THE NODE AGAIN TO GO. `npm test`
1532 / 0 / 4 skipped. UNSEEN LIVE (RULE #1c): the plate material over each
room's light, the floating plates' legibility against bright walls, the strip
at narrow widths, the pill fade, the parchment theme's light ink in the
building.

## THE TERRAIN ROOMS — the cave and the woods as smooth height fields (HQ plan 9.3 stage 4) — 2026-09-17, local delivery
The user: "forget seamless with the battle maps — make the exploratory areas
more complex: smooth elevations, ridges, ledges, winding paths, inclines,
hills, dips, walls; 3D platforming for door gun puzzles, ramps and tall
platforms for skate tricks and big jumps; hard-to-reach places for the tapes;
redo the cave and the woods (the ASCII grid)". A box room may carry
**`terrain`** instead of `cave` (data.js, the block after `hqCaveFitRooms()`):
a SMOOTH HEIGHT FIELD composed from FEATURES in room metres, in AUTHORED
ORDER — `hill` / `dip` / `ridge` (relief, additive; a ridge's `h < 0` is a
gully), `plateau` (a flat tier with CLIFF sides: `edge` 0.35 m — dropped off,
never climbed; `r` or `w × d × rot`; `dome`), `ramp` (an incline `h0 → h1`
along a line; `stairs: true` = treads two samples deep; a ramp ENDS at a
tier's edge, ≤ 0.3 m inside it, never deep in it), `deck` (a plank bridge at
`y`; a deck spans BOTH banks of the water it crosses — an end on a bank is a
one-way cliff), `pool` / `stream` (CARVE to `y − depth`; `bank`; `key` water
(waded ≤ `wadeMax` 1.15 m under the sheet) | deep_water | lava (never
entered)), `wall` (solid, its top a floor + a grind rail once the feet reach
it), `rail`, `path` (the path sheet painted), `tree` / `grove` (blockers, the
near kit's foliage), `scatter` (catalogue props at seeded free spots);
`noise` (undulation), `crag` (a jagged rock band at a closed room's walls,
never in a door's lane). **Every door gets a PAD** (a flat landing at its
sill — `door.y` on a tier, else the ground; a free way a tongue from the
object to past its landing) — `hqTerrainDoorY` is the sill (the renderer's
`_hqDoorFloorY`); `hqLinkDoors` copies an end's `y`. THE ONE RULE:
**`hqTerrainFeet(info, x, z, curY)`** — the sampled height (`hqTerrainHeight`,
bilinear on a grid of `res` 0.35 / 0.5 m — the SAME samples the mesh is), a
climb refused where the slope > `maxSlope` (tan 45°), ANY drop taken
(`dropMax` 40: platforming), water waded, a wall solid below its top;
`hqTerrainAir` / `hqTerrainCam` the air and the boom; **`hqTerrainReach`** =
THE SOLVER (a BFS of that rule on the grid: hq-terrain / hq-cave / hq-woods
insist every door reaches every other — author a field, run
`node check-terrain.js [room]` (the ASCII dump + the reach), never guess).
`HQ_TERRAIN_RULES` = the numbers (climb = HQ_STEP_TOL, wade = HQ_WADE_M, body
= HQ_BODY_R — the test ties them). Renderer (three-renderer.js, the block
before `_hqBuildSiteBoard`): **`_hqBuildTerrain`** — ONE mesh (the floor sheet
blended into the `cliff` sheet by slope and the `path` sheet along the paths:
`_hqTerrainMat`, a three-map Phong through onBeforeCompile with the `aBlend`
attribute), the water in the battle's animated sheet (`_hqTickMoat`), plank
decks with rope rails, walls in the cliff sheet, rails on posts, the trees
(`_nrTree` on a real `_nrKit`, each a blocker), the scatter through
`_hqPlaceProps` (`_hq.terrainScatter`, `rect: false`), the treeline past an
open edge (`_hqPlantTreeline`, shared with the cave builder), stalactites
under a closed ceiling; `_hqSurface` / `_hqAirOK` / `_hqCamBlocked` / the two
landing sites / `_hqCaveTop` (= the ground under (x, z) — `_hqHasGround()`
gates the prop / native / find / counter heights) read the data rules; the
box shell draws no floor under a field. THE FOURTEEN: the cave's seven
chambers (crags, the well room's tiers, THE CAVERN's terrace / west shelf /
high tier (5.25 m, LEVEL −6's door) / spur / rope bridge / hot shelf with the
lava lake under an obsidian deck / long ramp / deep river with a ford and a
plank / THE NEEDLE, the fissure's obsidian ramp over the lava rift, the
oubliette's sunken cells) and the woods' seven (the clearing's knoll, stream,
plank, old redwoods and THE CRAG; the trail's two tiers and Shasta's door on
the top; the redwoods' creek, gully log and THE STAND; the pasture's
dry-stone FENCE (two walls the rider jumps onto) with THE DEAD TREE in its
gap; THE STAIRCASE (a stair ramp to the 3.5 m landing, banister rails, two
quarter pipes, THE TOWER); the storm drain (35 × 10.5 closed brick, the
channel waded, the sump deep, a ledge); the ritual mound, ditch, stones and
THE ALTAR STONE). **THE HARD TAPES**: `DOOR_HQ.findSpots` pins a tape on a
pinnacle; `hqTerrainFindSpot` gives it its ground and `hard: true` when the
walker's reach never gets there; `hqFindHardReachTerrain` proves a shot from
a reachable node into the band under the top, and the renderer's
`_hqPortalLedgeSnap` snaps such a wall hit to a floor door on the top (the
door gun's puzzle). **THE ENCOUNTER**: `hqFieldRoomOk` refuses a terrain
room — it fights the SITE's Δ (THE SITE IS THE BOARD; the user dropped the
seamless field). **THE WOODS BATCH**: fourteen Meshy GLBs (MODEL_INDEX §3e)
in `_MISC_GLB` + `DOOR_HQ.catalogue` (`base: 'misc'`) — `hollow_tree` /
`hollow_dead_tree` are THE TWO TREES WITH HOLES: `DOOR_HQ.ways.hollowtree`
(the fairy forest's way in, both ends) / `.deadtree` (the pasture's garden
gate ⇄ the house; the ritual ground ⇄ the Looking-Glass, `deadtree_
lookingglass`), built by `_hqTreeWay` (the GLB, hole to +Z — `rot` in the
catalogue row — over a procedural trunk); fern / stump / fallen_log /
dead_snag / pine / menhir / cave_stone scattered, campfire / signpost /
culvert_mouth / drain_grate placed, the near settings of the fairy forest /
haunted house / skinwalker ranch dressed. audio.js `wayHollow`. Ship data.js
to Render too (the finds ledger). `npm test` runs `hq-terrain.test.js`
(the rules, every room compiled and solved, the pads, the park rule, the
hard tapes, the walker's rule on a synthetic field, the renderer on a stub
scene). UNSEEN LIVE (RULE #1c): all of it — the mesh's look under each
room's light (the cliff blend, the path sheet), the water sheets, the
walker on a ramp and off a cliff, the GLBs' facings (`rot` / `h` are the
edits), the lip snap on a pinnacle, the treeline's density.

## THE FLOOR PLANS + THE ROOM LOOKS + THE VIDEO SETTINGS EVERYWHERE (HQ plan 9.3 stage 5) — 2026-09-17, local delivery
The user: "use room and hallway generation algorithms like cellular automata or
random room placing … I can see the square edge of the landscape, supposed to
be fog … the entire area is outlined in wood planks … see what can be done with
the graphics settings on a per map basis … I need the video settings in the
pause menu, not just during battles". **THE FLOOR PLAN**: a terrain room may
carry `terrain.gen = { kind: 'cave' | 'rooms', seed, … }` (data.js
`_hqTGenerate`, the block before `hqTerrainRooms`; the numbers in
`HQ_TERRAIN_GEN`): a MASK over the field says where the walker may go and
everything outside it is SOLID — rock to `wallH` (3.2 m) in a cave (the crag
everywhere, the cliff sheet to its top), a 1.7 m THICKET bank with the forest
on it in the woods. `cave` = cellular automata on a `cell` (1.4 m) lattice
(fill / born 5 / keep 4 / iters 3; a pinned OPEN neighbour is left out of the
count or it eats every rock beside it), rounded by two majority passes;
`rooms` = `n` elliptical CLEARINGS at seeded spots joined by a Prim tree +
`loops` extra edges of WINDING corridors, every authored `path` a corridor
too, the door pads rooms. Every authored thing is FORCED OPEN with a margin
(pads + their lanes, plateau tops + lip, ramps / decks, pools + half their
bank, streams, walls / rails, trees, props, natives, counters, the spawn, the
`findSpots` pins; relief — hills / dips / ridges — is NOT forced unless the row
says `open: true`; `gen.open` / `gen.solid` are hand rows). **THE GUARANTEE**:
the walker's own reach (`_hqTReachGrid`, hqTerrainFeet on the authored heights
restricted to the mask) is run from the first door; for every door it misses a
corridor is CARVED along the walker's shortest path over the UNRESTRICTED
field (`corridorW` 2.6 m); then every open pocket the walker cannot reach (and
no feature needs) is filled back in, and a solid island under `minIsland` m²
is opened (a bump is not a wall). The mask becomes a signed distance
(`info.maskD`, m; `hqTerrainMaskAt(info, x, z)` bilinear, +∞ without a plan)
and the rise is added to `info.H` over `edge` m — steeper than the walker
climbs, so the plan is a wall by the height rule alone and nothing new is read
by the renderer's walker. `freeFor` (trees / scatter) refuses the solid;
`info.thicket` = the trees on the woods' solid (`spacing` 2.1 m, the wall of
the woods first, `maxTrees` 280), planted by three-renderer.js
`_hqBuildTerrain` as blockers (`thicket: true`, never `tree: true` — the stub
test counts trees). Thirteen rooms carry a plan (the storm drain is a culvert).
`hqTerrainDump` / `node check-terrain.js` draw the solid as `#` and print the
open share and the corridors carved. **THE FOG PAST A FIELD**: `sky.fog.
density` (per METRE; the woods 0.03) → `_hqEnter`'s `scene.fog` (it was a
thin 0.00005 / unit — the square edge showed); a closed chamber's own
`shell.fog = { color, density }` (the cave's warm dark); the open field's
flat apron + skirt + the paving KERB (the "wood planks") are gone under a
terrain room — `_hqBuildOuterGround` runs the field's own material out
`HQ_OUTER_M` (54 m) past the shell, matched to the field's edge, rolling,
swelling into low rises and falling away under the fog; the treeline stands
on it (`_hqTerrainGround` → `_hq.outer.yAt`). **THE LOOKS**: data.js
`HQ_ROOM_LOOKS` (declared ABOVE `EW_MAP_META` — a const in its dead zone
throws at load) = a GRADE per place `{ name, retro: { enabled, preset,
pixelSize, ditherStrength, levels, tintAmount, grain }, cin: { vignette,
vigAmount, vigSize }, nightMood, bloom, exposure?, dof? }`: `shell.look` on a
room (the woods DREAMY, the cave AMBER, the drain / the Haunted House GREEN,
the Backrooms FADED, Hell amber), `env.look` on a map row (five maps + their
Δs). three-post.js **`ThreePost.setSceneLook(look | null)`** lays it OVER the
player's settings — `_lkRetro()` / `_lkCin()` / `_lkNum(key, base)` are the
reads at every consumer (retro uniforms + pass gate, cinematic uniforms +
gates, night mood, exposure, bloom, DoF) and the overlay never writes
localStorage; the getters the panels read keep answering the PREFERENCE.
three-renderer.js `_sceneLookOf` (null when localStorage `ew_scene_looks ===
'off'` / `window.EW_NO_SCENE_LOOKS`), `_applyEnvLook` (from
`_updateEnvironment`, keyed on the row; `activate()` resets the key),
`_hqEnter` wears the room's / `_hqLeave` drops it / `_menuEnter` is bare,
`ThreeRenderer.refreshSceneLook()`. **THE VIDEO SETTINGS EVERYWHERE**: ui.js
`window._buildVideoSettingsHTML(refreshJs, { battle, perf, extra, bare,
noFullscreen })` is the ONE sheet (Graphics · CRT · Retro · Particles + the
MAP LOOKS toggle `window._setSceneLooks`); `_buildPauseVideo` = it with
`battle: true`; map.js `_renderMainMenuSettings` renders it (`bare`) — and so
the HQ pause menu's SETTINGS has it. The hosts pass their own literal
`_buildVitalsLookHTML` / `_buildHudThemeHTML` / `_buildWorldModeHTML` /
`_buildPerfSettingsHTML` rows (older tests read those literals). `npm test`
runs `hq-floor-plan.test.js`. UNSEEN LIVE (RULE #1c): the plans' look (the
cave's rock masses, the thicket banks with the trees on them), the outer
ground's swell against the treeline, the fog's density (`sky.fog.density` is
the edit), each look's strength (the table is the edit), the settings sheet's
length in the HQ pause overlay.

## THE DIVINE STAIR — HEAVEN · HELL · THE VATICAN · THE CATACOMBS · THE STAIRWAY (complex candidate #4, HQ plan 9.3 stage 6) — 2026-09-17, local delivery
The first complex built on THE CAVE / THE WOODS blueprint after the rule: four
TERRAIN rooms with generated floor plans on THREE sites (data.js, the block
right before H-WING; `site` + `part`, no `roomNo`), joined by seams.
**THE CATACOMBS** (`site_prebuilt_vatican_catacombs`, closed, `gen: cave`,
brick + `dungeon` floor, the crypt's own fog, `HQ_ROOM_LOOKS.catacombs` = the
teal preset under candles): the ossuary shelf up a brick stair, the sunken
chapel round a waded font, two sarcophagus rows (walls the rider grinds), THE
SKULL STACK (3.4 m, the hard tape). **THE PIT** (`site_prebuilt_hell_pit`,
closed, `gen: cave`, obsidian, `HQ_ROOM_LOOKS.hell`): THE BOWL (a 2.4 m dip)
down to a lava pool at its heart, THE LAVA RIVER with an obsidian causeway
(a deck spanning both banks), THE PLINTH (3.6 m, the hard tape), the gallery
ledge, the basalt wall. **THE STAIRWAY** (`site_prebuilt_heaven_stair`, OPEN
under Heaven's sky through **`hqDivineShell(o)`** — defined beside
`hqWoodsShell`; `HQ_ROOM_LOOKS.heaven` = Dreamy, bloom 0.5, no night; `gen:
rooms` with **`thicket: false`** (cloud banks, no trees — the rooms plan
without a thicket) and `wallH` 2.4): FOUR STAIR FLIGHTS in switchbacks
0 → 3.5 → 7 → 10 → 12 m (`stairs: true`), the healing pool on the first
landing, THE PINNACLE (5.2 m, the hard tape), the gate's door ON the top
landing (`y: 12`). **THE CLOUD FIELDS** (`site_prebuilt_heaven_gate`, open,
`gen: rooms`, `thicket: false`): cloud islands, THE RIFT (`deep_water`, never
entered) with THE PLANK over it, THE DAIS (1.75 m) with THE PEARLY WALLS and
THE GATE (`leaf_hotel`, Room 777's own, `y: 1.75`), THE PILLAR OF LIGHT (4.6 m,
the hard tape), two healing pools. **THE WAYS IN** = `siteRooms.backDoors`
rows on the FREED lanes: the Vatican's `crypt` (n x −10 → the catacombs'
`stair`), Hell's `pit` (n x −10 → the pit's `mouth`), Heaven's `gate` (n x
−0.2 → the fields' `heaven`). **THE SEAMS**: `links.vatican_hell` is
RE-POINTED (the id kept) off the two board rooms onto the parts — the
catacombs' EAST wall (z 4) ⇄ the pit's WEST wall — "the crypt's warm wall";
`links.catacombs_stair` (route `divine`, `leaf_frame_only`) = the catacombs'
north wall (x −6) ⇄ the stairway's south wall (the foot). The divine line
reads four legs now. **TWO RAMP RULES the flights taught** (the solver caught
both): a ramp ENDS 0.3 m INSIDE its upper tier's edge (`x1/z1` past the edge
leaves a hole between the ramp's end and the tier's 0.35 m edge blend) and
STARTS ≥ 0.4 m inside its lower tier (the ramp's own tolerance past `t < 0`
is 0.18 m). TAPES: four re-homed (Hell's FORM 666 → the pit, Heaven's THE
GATE → the fields, the Vatican's THE CONFESSIONAL → the catacombs, Olympus's
second → the stairway; the hundred stays a hundred, every site keeps ≥ 1);
`findSpots` pins the four hard tapes. Catalogue: `greek_column` (`base:
'misc'`, the board's `greekcol` file — the same-thing rule). Tests amended
for a multi-level plan: hq-floor-plan.test.js judges a deep solid cell
against `info.hFn(x, z)` (the authored floor under it, not a row-walk to
the nearest open cell — a cloud bank at the floor beside a 12 m landing);
the thicket rule reads `gen.thicket !== false`; hq-terrain.test.js's
tree rule is the woods' only; both count 18 / 17 rooms. `npm test` runs
`hq-divine.test.js` (the sheet, the ways in, one piece, the seams, the
solver + the production landing on every door, the park rule + the
hazards, the hard tapes, the helper + the source sites). UNSEEN LIVE (RULE
#1c): all of it — the cloud banks' read in `cloud_thick`, the stair treads
under the walker at 12 m, the lava under the obsidian causeway, the
`leaf_frame_only` foot, the brick catacombs under the teal grade, the
column GLB's scale. Assets that would lift it: MODEL_INDEX §3f.

## THE DIVINE STAIR, second delivery — THE VATICAN + THE FALL + THE RETURN GUARANTEE + THE VATICAN BATCH (2026-09-17, local delivery)
**THE RETURN GUARANTEE** (data.js `_hqTReturnGuarantee`, after the door
guarantee in `_hqTGenerate` and in `hqTerrainCompile` for a room without a
plan): nothing the walker can FALL INTO holds it — every cell reached from the
door pads with the walker's JUMP (`HQ_TERRAIN_RULES.jump` 1.3, any drop) must
reach a pad again; a TRAP gets A RESCUE RAMP (`_hqTRescuePath` / `_hqTLayRamp`:
the shortest way from the trap to returning ground at ≤ `rescueSlope` 0.7,
cut through the plan's solid, never lowering higher open ground beside it,
undone if it breaks a door route) else is SEALED (a forced cell only as a
last resort, `info.sealedCells`; never a pad; undone if it cuts a door off).
**`hqTerrainTraps(info)`** is the ONE read (empty = the room passes;
hq-terrain.test.js insists for every terrain room; `node check-terrain.js`
prints TRAPS + the rescue ramps cut; `info.rescues`). THE RAMP RULE is sharper:
a ramp ends **0.7 m inside** its tier's rect (the 0.35 m edge blend + a 0.5 m
sample — 0.3 m sampled a hole; the pit's gallery ledge was never reachable).
**THE VATICAN** is five parts (data.js, the block before THE PIT):
`site_prebuilt_vatican_basilica` (mass — the chancel, two TRIFORIUM galleries
at 4.6 up stairs behind the chancel, the organ loft = the tape; THE CRYPT door
on the chancel at y 0.9 → the catacombs; the board's white door opens on it:
`backDoors.prebuilt_vatican` id `basilica`), `_library` (THE SECRET ARCHIVE:
`gen: cave` in the `wood` sheet = the stacks, `crag: false`; the gallery at
4.0, THE DOME STAIR's door on it at y 4), `_courtyard` (THE CORTILE:
**`hqVaticanShell(o)`** — open behind a parapet under the Vatican's sky; a
cypress thicket plan; THE CISTERN = a hand-authored `way: 'well'` DOOR ROW,
free-standing, ⇄ the catacombs' north), `_observatory` (THE DOME:
`hqVaticanShell({ night: true, landmarks })` — THE STAIRWAY IN THE SKY due north
via three-renderer.js `_hqLandmarkBuilders.stairway`), `_catacombs` (its north
link door GONE). **THE TELESCOPE IS THE SEAM**: `links.observatory_stair`
(`way: 'telescope'`, a `wall: 'free'` end on the observatory part, eyepiece
south, ⇄ the stair's south wall wearing `leaf: 'leaf_frame_only'`);
`DOOR_HQ.ways.telescope`, `_hqWayBuilders.telescope` (the GLB
`brass_telescope` over a procedural tube — the Observatorium's `telescope` PROC
keeps its key), audio.js `wayScope`. `links.catacombs_stair` no longer exists
(the user's rule: the stair's foot is in the sky over the dome, not the crypt).
**THE STAIRWAY** (40 × 54) keeps the four flights and adds THE FALL: the lower
shelf (2 m) with its incline, THE LONG WAY up the west to the west shelf (6 m)
+ three steps onto the second landing, the stepping clouds (hop-high columns),
the pinnacle on the lower shelf (the tape; pin (17, 8)), `white_cloud` props
hung in the air (`y`, foot 0). **THE VATICAN BATCH** (24 GLBs, MODEL_INDEX §3g):
`_MISC_GLB` + `DOOR_HQ.catalogue` rows (`base: 'misc'`) — pews, podium,
throne (`front: 'back'`), cross, stained glass (wall, glow), carpet,
confessional, church wall / building (rect), italian buildings, arcade, two
shelves, catacomb wall, sarcophagus, skull pile, demon, brazier (`light`),
angel, pearly gate (open in the gap of the pearly walls, foot 0), white cloud.
Looks `HQ_ROOM_LOOKS.basilica` / `.archive` / `.observatory`. Tapes: Camelot's,
Agartha's, CERN's and Area 51's second re-homed. `npm test` runs
hq-divine.test.js (9). Ship data.js to Render too. UNSEEN LIVE (RULE #1c): every
GLB's scale and facing, the stacks in wood, the cypress banks, the landmark's
size from the dome, the rescue cuts between the cloud banks.

## DISASTER CITY — THE STREETS + THE MALL (complex candidate #1, HQ plan 9.3 stage 7) — 2026-09-17, local delivery
The FIRST complex on the blueprint after the rule, and the THIRD floor-plan
kind: **`terrain.gen.kind: 'city'`** (data.js `HQ_TERRAIN_GEN.city`, the
branch in `_hqTGenerate`) — `gen.streets` `{ pts, w, loop }` are the
corridors with a `walkW` SIDEWALK band and a `kerb` step (never on a forced
cell), the solid = THE BLOCKS risen `wallH` **as a MAX, never a stack** (an
authored roof / mezzanine inside a block keeps its height), cut by greedy
packing into LOTS (`info.lots`: `lotW`, `storeys`, `lowP` = a flat roof,
`building_1..8`) whose street-facing edges are FRONTS (`info.fronts`, the
façade where the rise begins); `info.gen.sidewalk / kerb / fronts ('window'
| 'store') / prisms` and `info.traffic` / `info.race` (`terrain.traffic` /
`terrain.race`, defaulted in `hqTerrainCompile`) ride to the renderer. Two
parts on Room 1954 (data.js, the block before THE DIVINE STAIR): **THE
STREETS** (`site_prebuilt_downtown_streets`, 112 × 88, open under Downtown's
sky through `hqCityShell`, `HQ_ROOM_LOOKS.city`): THE RING ROAD = THE
CIRCUIT, the avenue + cross street, the plaza, THE PARKING DECK (3 m, a
car ramp, a rail, two quarter pipes), THE COLLAPSE, THE ROOFTOP (4 m, the
hard tape — flush with the sidewalk so the shot is from the street),
parked cars on the parking lanes; doors `tower` ⇄ the lobby's NEW `avenue`
doors (east wall; the clock moved), `mall`, `metro` ⇄ the platform's NEW
`street` stair (n x 2.2; the departures board moved over the track).
**THE MALL** (`site_prebuilt_downtown_mall`, 66 × 46 × 7.6, closed,
`HQ_ROOM_LOOKS.mall`): the concourse cross, the atrium, the food court,
THE ARCADE with THE TIME MACHINE free against its back, the store units
the solid (5 m, `fronts: 'store'`, `prisms: false`), THE MEZZANINE up THE
ESCALATOR (**THE RAMP RULE's other half: a ramp is never INSIDE its tier's
rect while it is still low** — run it up to the rect and end 0.7 m in),
THE STORE ROOF (the hard tape, its face the concourse wall). **Renderer**
(three-renderer.js, before `_hqBuildSiteBoard`): `_hqBuildCityLots` (the
map-builder sprite prisms on the podiums via `_nrSpriteBuilding` on the
terrain's `_nrKit`; a `low` lot's parapet + plant; the fronts —
`_HQ_STORE_NAMES` on the mall's signs), `_hqBuildStreetLamps` (the lamp
OBJ on every street's kerbs), the sidewalk paint in the blend; **NPC
TRAFFIC** `_hqBuildTraffic` / `_hqTickTraffic` (`_hzVehicle` at the room's
tile — `_hzKitTs` set round the build — on the right, following the car
ahead, an open route's end teleporting to its start; **THE HIT** shoves
the walker along the car's heading with a hop (`pl.mvx / mvz` + `pl.vy`)
and throws a rider — `_hqRideBail(R, pl, 'car')`; `EW_HQ_NO_TRAFFIC`);
**THE CIRCUIT** `_hqBuildRace` (gates at the loop's MID-SEGMENTS — a gate
at a corner is never crossed; the START / FINISH banner) / `_hqTickRace`
(the rider only: `lapstart` · `gate` · `laptick` · `lap { ms, best }` ·
`lapdrop`, the wrong way never counts, `HQ_SKATE_RULES.race` =
`HQ_SKATE_DEFAULT.race` `{ hw, tickMs, minLapMs }`); `_hqWayBuilders.
timemachine` / `.gutter`. map.js `_hqSkateEvent` hears the beats (the
lap timer on the trick line, `_hqLapFmt`; a live combo beats it), files
a lap through `hqSkateBank` → `door.hq.skate.laps[room]` (THE BEST LAP PER
ROOM, LOCAL like the deck), the OFFICER sheet's THE CIRCUIT rows; audio.js
`wayTime` / `wayGutter`. **Seams**: `streets_strip` (the chapel's WEST
wall z 5), `streets_stadium` (Room 50's n x −10), `timemachine_cyberpunk`
(`way` at BOTH ends, Cyberpunk's free on its north strip — the ONLY way
from the city into Cyberpunk), `streets_drain` (`way: 'gutter'` ⇄ the
storm drain's `leaf_cell` grate n x −13, on the NEW dashed
`routes.sewers`). `npm test` runs `hq-city.test.js`. Second-pass asset
wishlist: MODEL_INDEX §3h. Unseen live (RULE #1c): all of it.

## THE COMPLEX BLUEPRINT + THE CANDIDATE LIST (the user's rule, 2026-09-17)
The user: "these two areas [THE CAVE and THE WOODS] are the blueprint for
making complex maps now — especially the part about getting the aesthetic
and the vibe right." RULE: every new complex is built the way those two
were — a generated FLOOR PLAN (`terrain.gen`, never a big box), the field's
own ground running out under a real FOG (no square edge, no kerb), a
`shell.look` GRADE per place (a retro preset, a vignette, the bloom / night
mood tuned to the vibe: exploratory, nostalgic, mysterious, fantasy, retro —
NeverEnding Story / Princess Bride / Oz / Wind Waker / Ocarina), the room's
own light, THE PARK RULE, the hard tapes, and `node check-terrain.js` before
anything is claimed. The candidates are in DOOR_HQ_BUILD_PLAN.md §9
"THE COMPLEX CANDIDATES" — read that list before starting a new complex,
and append to it when the user names another.

## DISASTER CITY, THE SECOND PASS + CYBERPUNK CITY (STREET LEVEL, the road tiles, the city batch, the closet) — 2026-09-17, local delivery
**STREET LEVEL** (the user: "the buildings should be street level, not on raised
plateaus"): the `city` plan's rise is INSIDE the buildings now — data.js
`HQ_TERRAIN_GEN.city` `riseIn` (the rise begins 0.1 m inside the mask line) +
`frontOut` (a lot's face stands 0.35 m OUTSIDE the line, over the ramp the 0.5 m
sampling draws either side of it), and THE TERRACE: the lots are laid ALONG
EVERY STREET FACE shoulder to shoulder (`lotW` a frontage, `lotD` a depth,
`lotMinW` the infill, a 4 cm seam between neighbours — the rows are rounded to
a centimetre), each wearing `rot` (the face's yaw, local +Z = the street),
`base` (the sidewalk's own ground under its front) and `face`; the depth is
capped at half the block when a street lies on the far side, short of any
feature otherwise; the fronts hang on the lots' own edges (`main: true` = the
laid face). three-renderer.js `_hqBuildCityLots`: every prism FROM THE GROUND
(`_nrSpriteBuilding` takes `o.d` — a w × d box turned by `ry`), a LOW lot a
one-storey concrete box from the ground; the 'window' front keeps only the
awning + the shop sign on a prism lot, the `storefront` GLB on a low lot's
ground floor, the `storefront_unit` GLB over the mall's glass; `gen.neon` = a
neon name on every main front + a hologram over a tall lot. **THE ROAD TILES**:
`_hqBuildRoadTiles` lays the user's straight + quarter-turn GLBs along every
street of a sidewalked city plan (a tile per street width, the turn ON a
right-angle vertex, nothing in an intersection; squashed to a kerb, 2 cm over
the field; EW_HQ_NO_ROAD_TILES). **THE CITY BATCH** = MODEL_INDEX §3i (19
`_MISC_GLB` rows, 14 catalogue rows, `_VEHICLE_KIT.taxi` / `.truck`; `city_bin`
OUTSIDE, `mall_bin` INSIDE; the time machine GLB over the `timemachine` way's
cage, the drain over the `gutter`'s grate; `_hzBasilicaDome` GLB-first with
`_hzBasilicaDomeProc` the stand-in + the `dome` landmark). **THE SUPPLY
CLOSET** (`site_prebuilt_downtown_closet` — a part's id is
`site_<mapId>_<part>`, hqComplexRoomId, never longer) off the mall's north wing
holds THE TIME MACHINE; its far end is **THE NOODLE BAR** (`site_prebuilt_
cyberpunk_noodle`) off **CYBERPUNK CITY · THE GRID** (`site_prebuilt_cyberpunk_
streets`, `hqCityShell({ neon: true })` + `HQ_ROOM_LOOKS.neon`: THE LOOP = THE
NEON GRAND PRIX, THE SKYWAY, THE BILLBOARD ROOF (the hard tape), THE STATION
where `links.tunnel_cyberpunk`'s train ARRIVES (a free end on the part) and
`links.subway_downtown`'s stair comes up (n x 12); the board room's back gate
`backDoors.prebuilt_cyberpunk` n x −10 — the board room keeps the highway
alone). RULES: a spawn / a native never stands in a traffic lane (the sidewalk
is theirs); a new city = `hqCityShell` + a `city` plan + the 7.10 checklist.
`npm test` runs `hq-city-2.test.js`. Ship data.js to Render too (the finds
ledger). UNSEEN LIVE (RULE #1c): the sprite prisms' look from the kerb (stand-in
textures offline), the neon inks, every batch facing (MODEL_INDEX §3i lists the
one-field edits), the quarter tile's curve at each corner.


### 2026-09-17 — Disaster City geometry, entrances and pedestrian traffic repair (local delivery)

Based on GitHub main c65341886eb7a4bd5f895d9d8618dfa6d393d57f. Not uploaded or deployed.

- Straight road GLB has baked vertical extent 0.478515 on its unit footprint. Road tiles now fit to 0.035 m thickness after loading, independently of road width, and sit 0.01 m over the field. This also keeps quarter-turn tiles at the same thickness.
- Inspected the storefront_unit asset: width along X, front toward +Z, depth 0.660156. Removed the assumed quarter-turn, recessed the back half-depth into the store, and fitted height below the existing sign band. The model no longer occupies the concourse. Procedural fronts remain available while loading / at low detail.
- The mezzanine ramp is now marked escalator with smooth collision and no lateral terrain rounding. Its visible terrain triangles are omitted under the escalator. _hqBuildEscalators places the supplied two-lane escalator at the lower floor rather than on the ramp midpoint, fits its width/run/rise, and retains a metal-step/handrail fallback when the model is unavailable. Removed the duplicate catalogue prop. Explicit noise amp:0 is now respected (the mall previously inherited 0.15 m noise).
- _hqBuildCityEntrances gives every normal outdoor city area door its own sprite building at the end of its existing approach street, aligned directly behind the working door, with a canopy, surround and destination sign. Shared by Disaster City and Cyberpunk. Door coordinates/actions and return landings are preserved. Special ways such as the gutter and train keep their existing forms; indoor doors already have walls.
- Disaster City traffic: 17 -> 8 vehicles; ring-road speed 4.5 m/s, avenue speed 3.5 m/s. Shared traffic yields to walkers/skaters along a sampled upcoming path, including corners and route respawns. Following gaps use the actual lead vehicle length. A three-second player-wide hit cooldown prevents successive cars from repeatedly shoving the player.
- Existing files only for runtime: data.js, three-renderer.js, index.html. Shared token 20260917-city-repair-03-cors. data.js belongs on both R2 and Render; three-renderer.js on R2; index.html on Render. No model files changed and no additional asset upload required.
- Validation: Node v24-compatible bundled runtime; package test command `node --test *.test.js`: 1,584 tests, 1,578 passed, 6 skipped, 0 failed. Syntax checks passed for edited runtime JS. 42 focused city/terrain/floor-plan tests passed; terrain connectivity and return checks run in that suite. New hq-city-repair.test.js covers mesh fit callbacks, entrance alignment, escalator fit/fallback, yielding through bends/respawn, lead-vehicle spacing, density and zero noise. Updated old assertions that required the removed stepped ramp and 0.3 road squash.
- HQ rendering/traffic changes apply to each player's local exploration; battle simulation and online relay are unchanged. No browser playtest performed. Final visual feel, escalator tread alignment and sign readability remain for in-game confirmation.


### 2026-09-17 — Room directory navigation and zoom readability (local delivery, not deployed)

- Verified the source files against GitHub main blob hashes before editing; includes the city repair already on main.
- map.js now activates a node with one click/tap or Enter/Space. Pointer-up retains the original pressed node even when SVG pointer capture retargets the event. A pan or cancelled pointer never travels. All travel uses the existing _hqDoAction / _hqMapAt path. FIT replaces the conflicting double-click reset.
- _hqMapLabelPlan prioritizes the current/hovered/focused room, hall/rings and major sites at overview scale, adds facility names at 1.55x and complex parts at 2.4x. Labels use screen-sized type and collision avoidance, recomputed during pan, zoom, resize and discovery animation. Uncharted names remain undisclosed.
- Search matches charted room names, numbers and area/site names. Results travel directly. Larger hit targets, visible keyboard focus, quieter map lines, no scanline overlay on the directory frame, and readable two-column door rows improve navigation. Existing room graph, authored names and discovery ledger stay authoritative; no new runtime module, story, battle state or network relay.
- Runtime upload: map.js and styles-base.css to R2; index.html to Render with shared token 20260917-directory-01-cors. Repository-only: hq-map.test.js and the three updated build/history documents.
- Validation: syntax checked map.js; map tests cover captured clicks, drag/cancel, keyboard travel, progressive labels, label separation and discovery privacy. No browser playtest was performed; final visual appearance remains to be checked in game.

Full suite: tests 1586; pass 1580; fail 0; skipped 6. Executed package.json’s test command directly with the bundled Node runtime (`node --test *.test.js`); npm is unavailable.

## EXPLORABLE AREAS — THE GUIDE + STREET LEVEL rev 2 (the city's solid is MASS) — 2026-09-17, local delivery
**`EXPLORABLE_AREAS_GUIDE.md` is THE doc for any explorable area — read it before building
or reworking a complex, a site room or a floor.** It names the THREE FAMILIES (A natural =
`gen.kind: 'cave'` / `'rooms'`; B prefab = hand-authored box rooms; C rooms-and-hallways =
H-Wing / the tunnels, no generator yet; D streets = `gen.kind: 'city'`), when to use which,
how to mix them across a complex's parts, the research (BSP, cyclic dungeons, Parish &
Müller streets, Portal chamber chains), the build order, the checklist, the Δ site-room
rework (§6: the square ledge goes, the crystal stays), the discovery rule (§7: Otto's
repairs open an earned door), the multi-floor plan (§5) and **THE WEENIES (§5b, the user's
Disneyland rule: every part gets a far landmark on the sky and a near one inside at the end
of the entrance's sightline, placed BEFORE the floor plan; a part with neither is not
finished)**. Append to its §10 log.
**STREET LEVEL rev 2**: `HQ_TERRAIN_GEN.city.podium: false` (the default) applies NO rise —
a city block is a MASS at street level: `hqTerrainFeet` refuses it by the mask (`solidPad`),
`hqTerrainAir` / `hqTerrainCam` meet `info.solidTop` (`hqTerrainSolidTop`: a lot's roof at
`storeyH` per storey, else `wallH`), and every frontage run no lot covers wears a YARD WALL
(`info.yardWalls` → `info.walls`, `fenceH` / `fenceKey`; never in front of an authored
tier — the rooftop's own cliff is the door gun's). The mall's plan says `podium: true` (its
store units ARE the mass, `prisms: false`) — the only podium left. `check-terrain.js` still
solves both cities; hq-city / hq-city-2 / hq-floor-plan read the mass rule. Ship data.js
to R2 AND Render. Unseen live (RULE #1c): the yard walls' read in `bricks_2`, the flat
concrete yards seen from the parking deck, the outer ground past the outer blocks now that
no podium hides it.

## THE URBAN PACK — DISASTER CITY IN THE PACK + THE ROADS OUT (2026-09-17, local delivery)
The user's 320 tileables (128 px = one battle tile, 1.75 m; repo `textures/` + 20 at
the root; R2 `Assets/Sprites/terrain/urban/<Name>.png`) are **sprites.js
`URBAN_TEXTURES`** (name → url) / **`URBAN_TEX_FAMILIES`** (34 families) /
`urbanTexPick(family, rng, filter)` / `urbanTexGlow(name)` (the lit `-Glow` twin
of a window sheet) — NEVER in TERRAIN_SPRITES (a terrain key is a board tile).
**THE KEY**: any material names one as **`urban:<Name>`** — three-renderer.js
`_hzTex` / `_hqTex` fall through to the registry, so a shell (`floor` / `wall` /
`dado` / `ceiling` + `ceilTile: 1.75`), a terrain field's `floor` / `cliff` /
`path`, a `fenceKey`, a wall row's `key` and a prop all read it the same way.
**THE STREETS IN THE PACK** (the user: "the streets are all distorted"): the
asphalt IS the field — a city plan's `floor` sheet paints the corridors
(`urban:PlasterWallPainted1b`), its `path` sheet the sidewalk band + the door
paths + THE PLAZA (a 21 m `path` row; the slabs, `urban:TileGeneric1a`), its
`cliff` sheet the yards and the OUTER GROUND (`_hqBuildOuterGround` blends a
city's outer ring to the cliff sheet) — the terrain's own three-sheet blend
follows every corridor and intersection, nothing overlaps, nothing distorts.
What stands on it is **`_hqBuildRoadMarkings`** (three-renderer.js, before the
street lamps; `HQ_ROAD` = the numbers): the centre dashes (never inside another
street's corridor or through a bend), the edge lines, a ZEBRA + a stop line
where a street enters another's corridor, KERB STONES (a light strip with a face
down to the road), MANHOLES (`DecalManholeCover`), SPEED SIGNS on posts
(`SignSpeedUsa025/035-small`, facing the road with a grey back) and a NO ENTRY
at a dead end — three merged geometries. The GLB road tiles are OPT-IN now
(`EW_HQ_ROAD_TILES`); `EW_HQ_NO_ROAD_MARKS` kills the paint. **THE HOARDINGS**:
a city's yard walls wear `gen.fenceKey: 'urban:MetalCorrugatedPainted1a'` at
`fenceH: 1.75` (one tile: the plinth at the foot) with `_hqHoardingSigns` —
the pack's DANGER / CAUTION / HAZARD plates on the street face. **THE
TEXTURED BUILDINGS** (the user: "keep the billboard buildings, but throw in
generated buildings made with these textures"): `gen.texP` (0.5) of the lots
(seeded per lot) and every `low` lot are **`_hqTexBuilding`** — a facade grid
of 1.75 m cells, two a storey (`HQ_TEXB`), a STYLE from `_HQ_TEX_STYLES`
(office: concrete spandrels + square curtain glass, a storefront ground floor;
tower: the tall curtain wall; residential: painted plaster, the skirting band
on the ground row, window DECALS over the upper rows, a painted door; stucco:
the cornice on the top row; factory: the corrugated cladding + the factory
glass + a wide door), `gen.ruinP` of them RUINED (the Broken glass, the grime;
0.35 in Disaster City, 0.1 on the grid), the roof in `ConcreteUnderTiles` under
a parapet, the plant on top; under a neon plan every window wears its `-Glow`
twin as an emissive map. Quads are MERGED per sheet (`_hqTexBatch`, ~20 draw
calls a city); a textured lot's front skips the sprite lot's awning / sign;
blocking is the plan's own mass rule. The neon city's field is self-lit (lift
0.42) and `hqCityShell`'s neon `floorColor` is 0xb4b4d0 — the sheet is dark
already. `EW_HQ_NO_TEX_BUILDINGS` = sprites only. **THE ROADS OUT** (the user:
"roads that lead to nothing need to be doors — keep walking and you end up in
the street of another area"): **`DOOR_HQ.ways.road`** (`w` 9, `pad` 10, `open`,
`sfx: 'wayRoad'`) — a street's END is the seam: three-renderer.js
`_hqWayBuilders.road` runs the asphalt + the dashes 40 m on into the fog over
the outer ground (13 m on a site room's apron), a freeway GANTRY over the mouth
names the next town (the door's label + the end's `sub`), a LEAVING plate and
a speed plate stand on the shoulders; the opening is the whole street and the
press-in is walking on (`hqTerrainCompile` reads a way's `pad` for the landing;
`_hqBuildWay` hands every builder its placed frame `wx / wz / yaw / y0`). The
highway's four links are ROADS at both ends now: `nuketown_downtown`
(Nuketown n −5 ⇄ the streets' cross street EAST end), `downtown_strip` (the
cross street WEST ⇄ the Strip n −5), `stadium_downtown` (the Stadium n −5 ⇄
THE AVENUE's north end), `strip_cyberpunk` (the Strip n −10 ⇄ the GRID's cross
street east end); `streets_stadium` (Gate C) is RETIRED and the Downtown board
room's north wall is free. **THE OTHER URBAN ROOMS** wear the pack: the
platform (`TileSubway1a` walls, the slate floor, `MetalSubwayGrill1a`
overhead), the lobby (chequered `TileMarble1a`, stucco, `FibreCeilingTile`),
the casino (`TileMarble3c`, red `PlasterWallPainted2c`), the chapel (the
cornice stucco), the mall (`TileMarble2a`), the closet, the noodle bar
(`TileSubway3d`, corrugated). **THE PROBE**: `node playtest_city.js <room>
'[views]' [--wait=ms] [--flags=A,B] [--loglen=n]` (repo tooling) = the HQ probe
WITH THE REAL SHEETS — the sandbox's egress proxy reaches the CDN, every asset
is re-served with a CORS header (the proxy strips it and WebGL then refused
every image: the city rendered black) and cached under `shots/.cdn-cache`; the
urban pack is served from `textures/`; it relaunches on the headless crash
(one probe at a time — two browsers kill each other). `npm test` runs
`urban-pack.test.js`; hq-city / hq-city-2 / hq-urban / hq-terrain / hq-world
amended. Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): the plates'
loudness, the road out at the Strip's / the Stadium's / Nuketown's ends (a site
room's apron), the neon glow at 60 fps. The rest of the pack (D.U.M.B., CERN,
Area 51, the Δ boards) is still unworn — the key is the edit.

## DISASTER CITY, THE THIRD PASS — THE LOOK YIELDS · THE TWO-FLOOR MALL · THE KERB RULE · THE MITRE · CYBERPUNK CITY IS THE GRID · THE STRIP ITS OWN AREA (2026-09-17, local delivery)
**THE LOOK YIELDS TO THE PLAYER** (three-post.js): a scene look (`HQ_ROOM_LOOKS` /
`env.look` / `shell.look`) fills in ONLY the settings still at their FACTORY
default (`_RETRO_FACTORY` / `_CIN_FACTORY` / `BLOOM_FACTORY` / `EXPOSURE_FACTORY`
/ `DOF_FACTORY` / `NIGHT_FACTORY`, captured before the saved preference lands);
any slider / toggle the player moved wins everywhere (`_lkSame` at `_lkNum` /
`_lkRetro` / `_lkCin`; a look's preset re-seeds levels / tint only while the
player owns none of the three). `ThreePost.getSceneLookOwned()` lists the
player's keys. RULE: a look is a starting grade, never a lock. **THE ENTRY**
(data.js `DOOR_HQ.siteRooms.entry[mapId] = { room, door: { id, wall, x } }`,
`hqSiteEntry(roomId, at)` / `hqSiteEntryOf(mapId)` / `hqApplySiteEntries()`;
map.js `_hqEnter` redirects at its ONE room-resolution point and marks the
board room seen): a site named there is BYPASSED — every door, threshold, GO
and post-match return that would land in `site_<mapId>` lands in the part
(`at` kept when the part has it, else the part's `bay` door = the board room's
own egress copied onto the part at load, wearing `site` so its plate reads the
number). Cyberpunk City = `site_prebuilt_cyberpunk_streets`, the Strip =
`site_prebuilt_strip_streets` (NEW: `hqCityShell({ strip: true })`,
`HQ_ROOM_LOOKS.strip`, the boulevard + the back-lane circuit + the valet deck
+ THE MARQUEE ROOF's hard tape; the highway links `downtown_strip` /
`strip_cyberpunk` end on its e / w walls; the chapel's `street` door comes back
onto it), Downtown = `site_prebuilt_downtown_streets` (its bay door at s x −30).
The grid's tenement door is gone. Every part's label reads `DISASTER CITY ·
<place>`. Bypassing a new site = one `entry` row (+ a `path` for the bay door's
street on a city plan). **THE MALL** (`site_prebuilt_downtown_mall`): one open
box 96 × 64 × 12, NO plan, NO store-unit mass — the upper floor is five
plateaus at 4.6 (four galleries + THE EAST BRIDGE), the shops are
`terrain.shops` rows (`{ x0, z0, x1, z1, nx, nz, y, lip | wall, names }`) drawn
by three-renderer.js **`_hqBuildShopfronts`** (`HQ_SHOP`: bays, pilasters, the
pack's tall glass + glow, a door, a shutter in three, a fascia sign per bay
via `_hzTextTex`, the lip fascia + edge quad over the plateau's 0.35 m slope;
merged per sheet; `_ew_hqPart: 'wall'`) — a shop is a FRONT on a surface that
exists, never a mass. Two escalators (12 m) wear **`_hqEscalatorBalustrades`**
(solid side panels over the field's sampled skirt); two 12-m stairs (RULE: a
stair's last tread must stand within a climb of the tier before the tier's
0.35 m edge overtakes it — a 9 m stair jumped 1.02 m); THE FUN BOX, two grind
ledges (walls), the half pipe, THE CLOCK TOWER (the tape, 8.5 m). **THE
SCATTER RULES** (`hqTerrainCompile` freeFor): never on a ramp / stair /
escalator or its skirt; a seeded row refuses a slope > 0.25 (a row with its own
centre keeps 0.5); **THE KERB RULE** in a city plan: `rad + 0.35 ≤ maskD ≤
sidewalk − rad/2` (`f.road: true` opts out). **THE MITRE**
(`_hqBuildRoadMarkings`): kerbs + edge lines trimmed on the inner side and
extended on the outer by off·tan(θ/2) at every same-street corner. **THE
OVERLAP SWEEP** (`_hqTGenerate` city): a lot overlapping an earlier lot on
another face (1 cm) is dropped before the fronts. `HQ_TEXB.tint` /
`tintNeon` darken the textured buildings. `npm test` runs
`disaster-city-3.test.js`. Ship data.js to Render too. UNSEEN LIVE (RULE #1c):
the shopfronts, the balustrades, the stairs, the kerb density, the mitres on
the 45° chicane, the Strip at night, the bay doors.

## D.U.M.B. — THE HALLS FLOOR PLAN (family C's generator) + seven parts on Rooms 555 / 999 (complex candidate #5, HQ plan 9.3 stage 8) — 2026-09-17, local delivery
**THE HALLS** (data.js `HQ_TERRAIN_GEN.halls`, the `halls` branch in `_hqTGenerate`,
`_hqTTraceMaskWalls`, `_hqTRdp`): `terrain.gen.kind: 'halls'` = EXPLORABLE_AREAS_GUIDE
family C (ROOMS-AND-HALLWAYS) — a BSP of the shell (`leafMin` / `leafMax`) with a
rectangular room in each leaf, the AUTHORED rooms `gen.rooms` (`{ id, x, z, w, d }` — the
prefab chambers; a BSP room whose centre lands in one is dropped) and the AUTHORED halls
`gen.halls` (`{ id, pts, w, loop }` — a ring, a spur), every room / door pad / hall vertex
a node on a Prim tree + `loops` edges of L-SHAPED corridors (`corridor` [2.6, 3.4],
square-capped, clamped after the snap); `bsp: false` = the authored alone. The solid is
MASS (`solidMass` like a city block: the walker refused by `solidPad`, `info.solidTop` = the
shell's h — the walls reach the ceiling), never a rise; a TOOTH CLEANUP (two passes) before
THE GUARANTEE; the mask's boundary TRACED into **`info.planWalls`** (unit faces on the
half-cell lattice, skipped within `wallInner` of the shell, chained, Ramer–Douglas–Peucker
at `simplify` 0.5 m, each row `wallT` thick in `wallKey` — an `urban:` sheet — pushed into
the solid by t/2 + its own chain's reach toward the open side, so the drawn face never
protrudes past the line the mask refuses at); `minOpen` 0.12 per kind (a tunnel is mostly
wall; hq-floor-plan.test.js reads it). three-renderer.js `_hqBuildTerrain`: `drawWall` is
the ONE wall path (info.walls AND info.planWalls; `keyedMat` caches a material per sheet;
a plan wall wears `_ew_hqPart: 'wall'`), `_hqBuildHallsLights` hangs an emissive tube every
6.5 m down every corridor / hall (`EW_HQ_NO_HALL_LIGHTS`). `check-terrain.js` prints
`traced walls n`. **THE PARTS** (data.js, the block before H-WING; `hqBunkerShell(o)`
beside the city shell — closed, the pack's concrete / corrugated / rubber / drop ceiling
at 1.75, the red lamp, a haze, `HQ_ROOM_LOOKS.dumb`; `.warroom` / `.bunker` / `.cern`
too): `site_prebuilt_dumb_motorpool` (the tram hall + THE PLATFORM + the lit `train_car`
= the weenie, the bays; **`links.area51_dumb.b` / `dumb_cern.a` RE-POINTED onto its west /
east walls** — the board room keeps `cave_dumb` alone), `_sublevel7` (the hub + THE TOWER
(the tape) + THE DROP / THE CATWALK (a `deck` plank between two 4 m towers) / THE PIT (a
`dip`) / OBSERVATION; five spokes), `_dreamlab` (the ward, the range's `floating_orb`, the
booth), `_clonevats` (six `iso_tank` vats under the gantry, the free-standing
`door_furnace`, **THE OTHER ONE = a `clone: true` npcSpot**), `_warroom` (family B, no
plan: two galleries, THE BIG BOARD on the shell's north wall), `_bunker` (the loft, a
`pool` waded, the cellar), `site_prebuilt_cern_ring` (`bsp: false`: one octagon loop hall
+ two spurs, the detector hall, the control room; open 19 %). Back doors on the freed
lanes: `backDoors.prebuilt_dumb` (n x −5 → the motor pool) and `.prebuilt_cern` (n x −5 →
the ring), both `leaf_bulkhead` wide. Tapes: seven re-homed (Antarctica's, the North
Pole's, the Singularity's, Mars's, Saturn's, the Moon's, Giza's second — retitled for their
rooms; the base keeps its own two on the board); `findSpots` pins the seven hard tapes. **RULES**: a STAIR's tread rise + the tier's
0.35 m edge step must stay under the slope rule at the edge — ≤ ~0.45 m a tread (L ≥
2.2 × h) AND the stair ends 0.7 m inside its tier (1.2 m buries the last tread: a 1.0 m
step); a plan room hangs NOTHING on the shell — every wall prop stands FREE on a plan
wall (`x, z, face, mount`); `leaf_security` is the L4 rank leaf; never `utility_box` as
a room prop. `npm test` runs `hq-dumb.test.js`; hq-floor-plan (28 planned) / hq-terrain
(33 rooms) / hq-finds (the shelf hints a site's every other tape) amended. NOT built: a chamber template library, doors on BSP rooms, a
dropped corridor ceiling, THE SHAFT ROOM, Area 51's hangar part, the pack on the board
rooms. Ship data.js to Render too. UNSEEN LIVE (RULE #1c): all of it — the traced walls
at the corners, the strip lights, the tram, the plank, the pit, the windows, the furnace,
the pool, the orb, the two new plates.

## D.U.M.B. CONTINUED — THE CYCLE RULE · THE BASES BYPASSED · LEVEL P3 · THE LOOPS · AREA 51 (2026-09-18, local delivery)
**THE CYCLE RULE** (data.js `_hqTGenerate`, the `halls` branch; `HQ_TERRAIN_GEN.halls
.minDegree` 2): every ROOM node of a halls plan (BSP or authored) takes L-corridors to its
nearest unjoined nodes until it has TWO — a room with one way in is a dead end the user
does not want; `gen.minDegree: 1` restores the tree for an authored spur. Readout
`info.genPlan.edges` / `.deadEnds` (check-terrain's JSON prints `deadEnds`; hq-dumb /
hq-area51 insist on 0). **THE BASES ARE BYPASSED** (`siteRooms.entry` rows for
`prebuilt_dumb` / `prebuilt_cern` / `prebuilt_area51` — the user: "we don't need the board
maps if the place already has an area"): the freight lift lands in the motor pool, the
blast door on the ring, the hangar man-door in HANGAR 18, each part wearing the board's
egress as its `bay` door (s x 0) and no door of its own back to the board. RULE: a link on a
bypassed board lands at the bay door — move every link onto a part FIRST (`area51_dumb.a` →
the hangar's e wall, `cern_backrooms.a` → the ring's n x −12, `cave_dumb.b` → SUB-LEVEL 7's
n x 0 = LEVEL −6). KNOWN: a bypassed board's own tapes are unreachable on foot (Cyberpunk /
the Strip / Downtown too) — hq-finds' 1–2-per-site rule keeps them there; filing them in the
entry part is the next thing to do. **LEVEL P3**: the motor pool is `D.U.M.B. · LEVEL P3`
under the garage (P1 the garage, P2 H-Wing's stair, P3 the level the panel never had);
`links.garage_motorpool` (route `bases`) joins the garage's w wall (z −2.5) to the motor
pool's s wall (x −16). **THE LOOPS**: dream ⇄ clone THE SERVICE CORRIDOR (`service`,
`leaf_frosted` wide), war ⇄ bunker THE PRIVATE STAIR (`stair`; the war room's end `y: 3.0`
ON the south gallery). `leaf_frosted_single` is the L5 RANK leaf — never on a room door.
**AREA 51** (data.js, the block before D.U.M.B.'s; `hqAirbaseShell(o)` beside the bunker
shell; looks `hangar` / `white` / `flightline`): `site_prebuilt_area51_hangar` (HANGAR 18:
`halls` round one authored hall, THE RIG up a stair with the `saucer_rig` proc — the near
weenie — THE CATWALK, THE CRANE HOOK 8 m = the tape; doors bay / the floor lift (the tunnel)
/ `white` / `flightline`), `_ward` (THE WHITE ROOMS: `halls` on FINE leaves 5.5–9 m = the
cells; six `wall_padding` procs standing FREE on the plan walls, `foot 0`; THE DECK, THE
CAGE = the tape; `hangar` / `yard`), `_flightline` (OPEN under the base's own night — the
shell copies the EW_MAP_META sky by hand, hq-area51 diffs them; a `rooms` plan with no
thicket, `wallH` 1.6 = the berms between the aprons; RUNWAY 33, THE TOWER + the beacon, THE
MAST = the tape; four `flood_mast` procs — an outdoor TERRAIN room lights ITSELF,
`shell.lights` must be empty (doorhq); `hangar` / `ward`). Every part has two ways out. Tapes:
Gobekli's, Nuketown's and Bermuda's second re-homed; `findSpots` pins the three. `npm test`
runs `hq-area51.test.js`; hq-floor-plan 31 planned, hq-terrain 36 rooms, disaster-city-3
six entries. Ship data.js to Render too. UNSEEN LIVE (RULE #1c): all of it.

## THE DIVINE STAIR, SECOND PASS — THE BOARDS BYPASSED · THE FLOATING PIECES · THE WAY DOWN · THE BASILICA TO SCALE · THE ARCHIVE LIT (2026-09-18, local delivery)
The user: "get rid of the board rooms since each place is its own area; use the map builder's floating
staircase (floating steps) or something similar with cloud platforms; the path to hell should feel like
going down — inclines in the catacombs and the hell areas; the basilica's sizes and scales are off; the
library is too dark". **THE BOARDS BYPASSED**: `siteRooms.entry` rows for `prebuilt_vatican` (→ THE
BASILICA, bay s x 0), `prebuilt_hell` (→ THE PIT, bay s x 0 **`y: 5`** — an entry door may carry `y`, its
sill; the mouth opens ON THE RIM) and `prebuilt_heaven` (→ THE CLOUD FIELDS, bay **n** x 0 `y: 1.75` —
Room 777's hotel door ON THE DAIS: you arrive at the top and every stair goes down to the dome); the
parts' own doors back to the boards are gone; every link that stood on those boards is on a part
(`hollow_hell` / `cave_hell` → the pit's east wall, `heaven_olympus` → the fields' east wall,
`vatican_heaven` = the archive's west wall ⇄ the fields' west wall, `bureau_vatican` → the cortile's east
wall, `vatican_hell.b` → the pit's NORTH wall at `y: 2.5` = THE WARM LEDGE). **THE FLOATING PIECES**: a
`plateau` or a stair `ramp` in a terrain room may wear **`float: true`** (data.js `hqTerrainCompile` →
`info.floats`; the height rule is untouched — the field carries the tier, the walker climbs its low end);
three-renderer.js `_hqBuildTerrain` CUTS THE FIELD AWAY under it (`underFloat`: a platform's flank ring,
a flight's run but its foot and its mouth) and **`_hqBuildFloats`** hangs the piece — a rounded slab in
the cliff sheet with a ring of puffs under a platform's rim (the field's own top stays: the sheet, the
pool, the path), one marble tread (the path sheet) per compiled step of a flight, 10 % apart, a puff
under each = the map builder's floating staircase in the room's own kit. The compiler's frame helpers
`_hqTEllipse` / `_hqTRectIn` / `_hqTRamp` are on `window` for it. THE STAIRWAY: every flight + every
landing but the summit + the stepping clouds + the pinnacle float; THE CLOUD FIELDS: the dais's steps,
the pillar of light, three stepping clouds up to THE LOOKOUT. **THE WAY DOWN**: the catacombs' crypt
stair lands on THE LANDING (3.2 m) → two brick flights down → the galleries; the pit's mouth on THE RIM
(5 m) → three flights down the west side → the floor → THE BOWL; the warm ledge's ramp is the causeway
over the lava river. **THE RAMP RULE AT A DESCENT**: a descending flight's HIGH end starts 0.7 m INSIDE
its tier's rect (0.4 left a trench between the tier's edge blend and the first tread — the solver must be
run from EVERY door, `hq-divine.test.js` climbs back up). **THE BASILICA**: pews 2.6 m (the catalogue),
columns `h: 8.5` per row, windows `h: 5.5, mount: 7`, the cross 5 m, the upright carpet GLB hung as
**`holy_tapestry`** (the same file, a wall row — a GLB that stands upright is a wall row, never laid flat),
ten lights. **THE ARCHIVE**: ambient 0.62, fog 0.011, the wood lighter, `HQ_ROOM_LOOKS.archive` without
the night mood. hq-divine / hq-world / disaster-city-3 / hq-terrain amended. Ship data.js to Render too.
UNSEEN LIVE (RULE #1c): all of it — DOOR_HQ_BUILD_PLAN §9 lists what to eyeball first.

## THE DOOR GUN rev 5 — THE NEW MODEL, PORTAL'S TWO BUTTONS, THE FAR PREVIEW, THE LEAF, THE FLING — 2026-09-18, local delivery
The user's brief, straight from Portal. **THE GUN** is `DOOR_HQ.catalogue.door_gun` = `Meshy_AI__0916054803_texture.glb`
(`base: 'misc'` — R2 `Assets/misc/`, repo root; MODEL_INDEX §3b). MEASURED (the vertex profile along X): its GRIP hangs at
+X, the opposite end from the first gun, so **`HQ_PORTAL_RULES.gun.turn` (degrees about the gun's own up) pre-turns the
INSTANCE in every holder** — three-renderer.js `_hqAttachHeld` (the walker), `_unitAttachHeld` (the Door Agent), `_hqViewmodel`
(first person); the glove / the muzzle / the shot keep the +X-barrel frame. A future gun that lands backward = that ONE field.
**TWO TRIGGERS** (rev 4's selector + aim-down-sights are GONE — `_hqPortalSelect` / `_hqPortalAds` / `_hqLookGain` / R · 1 · 2 /
`adsK` / the lens + boom pull / `ads` + `viewmodel.adsPos` no longer exist; never bring a right-click aim back): `H.onMouseDown`
→ **`_hqPortalFire('a')` on LEFT, `_hqPortalFire('b')` on RIGHT**; `HQ_PORTAL_RULES.buttons = { a, b }`; the ghost judges the
surface for EITHER button (`_hqPortalAim(null)`) and wears `HQ_PORTAL_COLORS.ok`. **THE REACH**: `reach` 160 m; `_hqPortalAim`'s
step grows with the distance (`HQ_PORTAL_STEP_K` × t ≤ `HQ_PORTAL_STEP_MAX`) and a floor hit is stepped back onto the surface —
the preview shows on any surface the eye can see. **THE LEAF**: `leafOpenDeg` 150 / `leafAlways` — a placed wall door swings
near flat and stands open from the landing (`_hqTickDoors`); the room's own doors are untouched. **THE FLING**: out of a floor
hatch the whole entry speed comes out (`C.max`, not 12). `npm test` runs hq-portal.test.js (22). UNSEEN LIVE (RULE #1c): the
grip / barrel on the rigs (`gun.turn` / `pos` / `rot`), the leaf at 150°, the far ghost, the fling.

## CAMELOT CASTLE — five parts on Room i, three families, the board bypassed (complex candidate #2, HQ plan 9.3 stage 9) — 2026-09-18, local delivery
Built on THE CAVE / THE WOODS blueprint (EXPLORABLE_AREAS_GUIDE). data.js, the block before AREA 51's; `hqCastleShell(o)`
beside the airbase shell (Camelot's own night off its EW_MAP_META row — hq-camelot.test.js diffs them — a treeline, torchlight,
the `skycastle` landmark; `sky: true` = dawn above the clouds, cloud underfoot, the `islands` roster, Camelot on the horizon
below). **THE OUTER WARD** (`site_prebuilt_camelot_ward`, open, `rooms`): THE MOAT (a `deep_water` stream, never entered),
THE DRAWBRIDGE (a `deck` spanning both banks), THE CURTAIN WALL (four `wall` rows, 5.5 m, `castle_wall`) whose TOPS are
THE PARAPET WALK — two rampart stairs up to wall-height terraces at the south corners, then the top is a floor and a grind
the whole way; THE GATEHOUSE (two plateau towers), THE SWORD IN THE STONE, THE WELL free in the bailey, THE KEEP TOWER (9 m,
the tape) beside the hall door. **THE GREAT HALL** (closed, NO plan — family B): THE ROUND TABLE, THE DAIS + the throne under
the rose window, THE MINSTRELS' GALLERY (3.5) up its stair, THE LOFT (8 m, the tape), the Lodge's door + the keep's stable
door on the west wall. **THE KEEP** (closed, `halls` round the guardroom + the stairhall): THE GREAT STAIR 0 → 4.5 (THE SOLAR)
→ 9 (THE BATTLEMENTS against the north wall — the sky's door stands ON them, `y: 9`, `leaf: null`), THE TOWER TOP (12.5, the
tape). **MERLIN'S UNDERCROFT** (closed, `cave` bricked to the ceiling): the cistern waded, the gaoler's ledge, THE ORB, THE
OSSUARY SHELF (4.2, the tape), the sally port out under the moat. **THE CASTLE IN THE SKY** (open, `rooms`, no thicket): THE
FLOATING PIECES 0 → 3 → 6.5 → 10 m, THE SPIRE (14, the tape), THE SKY BRIDGE = `links.skycastle_stair` (route `divine`,
`leaf_frame_only`) onto the stairway to heaven's west wall. `siteRooms.entry.prebuilt_camelot` → the ward; the four seams
that stood on the board RE-POINTED (`fairy_camelot.b` a free pool on the moat's bank, `haunted_camelot.b` the ward's west
wall, `well_camelot.a` free in the bailey, `camelot_lodge.a` the hall's west wall); `backDoors.prebuilt_camelot` the
gatehouse arch. **RULES**: a terrain `wall`'s top is the HIGHEST ground under it + h — never end a wall inside a plateau's
footprint or on a moat's bank; a door landing never stands on a low `wall` row. Procs `round_table` / `banner` (wall) /
`armour_stand` / `sword_stone`; landmark `skycastle` (the castle builder on a cloud). Looks `camelot` / `greathall` / `keep`
/ `undercroft` / `skycastle`. Five tapes re-homed (the Backrooms', Atlantis's, the Dutchman's, the Spaceship's, the
Looking-Glass's second). `npm test` runs `hq-camelot.test.js`; hq-terrain 41 rooms, hq-floor-plan 35 planned. Ship data.js
to Render too. UNSEEN LIVE (RULE #1c): all of it — DOOR_HQ_BUILD_PLAN §9's entry lists what to eyeball first. Next in the
candidate list: #3 THE TUNNELS / THE DUNGEONS, #6 DOOR MANUFACTURING.

## THE MAPS / ROOMS CLEANUP — Nuketown retired · Antarctica on the lunar route · CAMELOT KINGDOM · THE RANCH · THE HUBS · THE PLATE READS THE ROOM THROUGH THE DOOR — 2026-09-18, local delivery
**NUKETOWN IS GONE** (every runtime file: data.js builders / Δ / meta / site file / threshold 1945 / Bay 1 seat / built /
near / shells / flavour / three links / challenge pools; three-renderer.js `_NR_BUILDERS.nuketown`; map.js; server.js
`MAP_POOL` ×2; audio.js) — its tape is THE SCARECROWS on the ranch (the hundred kept); delta-maps expects 38. **ANTARCTICA
IS ON THE LUNAR ROUTE**: `links.antarctica_derelict` docked on the Spaceship's collar (a third course on the nav console).
**CAMELOT KINGDOM** = `routes.kingdom`: `links.northpole_camelot` (the North Pole n x −0.2 ⇄ THE OUTER WARD e z 24 — the
approach OUTSIDE the moat; a ward door inside the moat is unreachable, the solver says so); `camelot_lodge` is deleted (the
ley line is the stones alone). **THE RANCH** (`routes.ranch`; `DOOR_HQ.hubs.ranch`): `site_prebuilt_skinwalker_fields` ·
THE RANCH · THE CORN FIELDS (data.js, the block before H-WING; `hqRanchShell` / `HQ_RANCH_LANDMARKS` / `hqRingPts` beside
the woods shell; `HQ_ROOM_LOOKS.ranch`) — a `rooms` plan whose SOLID IS THE STANDING CORN, three crop circles as `path`
rings, the mesa + its ramp, THE BUTTE (the hard tape, pinned), the fence walls; `siteRooms.entry.prebuilt_skinwalker` →
the fields (the stable door lands you in the corn). Gates: `ranch_haunted` (the dead tree, off the pasture), `ranch_lodge`
(off Camelot's hall), `ranch_grove` (Bohemian Grove keeps its owl's gate to the redwoods = THE INTERCHANGE to the woods),
`well_skinwalker` (free in the farmyard). **HELD**: `ranch_graveyard` / `ranch_western` name sites that do not exist —
`hqLinkLive` holds them at both ends; build THE GRAVEYARD / THE WESTERN MAP (the 7.10 checklist) and the gates appear.
THE WOODS keep their seven parts (the pasture's two gates are the ranch's now). **THE HUBS**: `DOOR_HQ.hubs` `{ label,
room = the anchor, sites | facility, color }` (hq · cavern · woods · ranch · divine · city · dumb · kingdom);
`hqHubOf(roomId)` the ONE read; `hqMapGraph` / `hqMapModel` carry `hub` / `hubOf` / `hubLabel` / `hubColor` (never on a
`?`); map.js draws the anchor big in its ink with the hub's name always on, the members with a halo (`--hub` on the `<g>`;
CSS "THE HUBS" in the map block). Adding a hub = one row. **THE PLATE READS THE ROOM THROUGH THE DOOR** (the user: "it'll
say where that door eventually leads me to but not what's actually directly through the door"): data.js `hqDoorThrough
(door)` / `hqDoorPlateLabel(door)` / `hqReplateDoors()` — run once at load after the entries + the links; every door's
`label` = the label of the room its action lands in (the entry part of a bypassed board, the lobby behind a suite door;
`_own` keeps the authored plate; `plate: 'own'` opts out; a BAY door keeps its segment; a SECRET door its DRAUGHT);
`hqLinkDoors` labels a link door with the far ROOM's own label (CAMELOT · THE OUTER WARD). Never author a door label that
names the far destination again — name the room, put the rest in `sub`. `npm test` runs `hq-ranch.test.js`. Ship data.js to
Render too (the finds ledger). Unseen live (RULE #1c): the corn banks, the circles, the butte, the hub rings, the re-plated
hall.

## THE DEEP — THE OPEN SEA · THE ABYSS · THE TEMPLE (complex candidate #8, HQ plan 9.3 stage 11) — 2026-09-18, local delivery
The user's pick after the underworld: "a sea that you can sail, an ocean you can swim in or drive a
submarine in, a whirlpool for the door, the Dutchman connects to the underwater, a swimming
animation". **THE WATER LAYER** (EXPLORABLE_AREAS_GUIDE §5c is the rule): `terrain.sea = { y, key,
under }` on a terrain room (data.js `hqTerrainCompile` → `info.sea`) = ONE surface over the field; the
field is the SEA FLOOR, the ground above `y` is land, the shallows a wade, deeper a SWIM —
`hqTerrainFeet` floats the walker at `y − HQ_TERRAIN_RULES.swimDraft` (1.1; swim → wade is one step
under the climb, so the solver / the trap check / the finds cross the water on their own);
`hqTerrainFluidAt` reports the sea as a pseudo-fluid (`sea: true`; a scatter row under it says `sea:
true`) and is HEIGHT-AWARE now (ground above a sheet is dry — THE ORACLE rises out of its pool);
`under: true` = a DROWNED room (the surface over the ceiling, the feet the ground everywhere, NO climb —
`_hqTClimbLim` — and no fluid: the water is that room's air). A `plateau` out of water blends
`'ground'` (`blend: 'ground'` — or its edge is a 3.5 m cliff at the waterline). `HQ_SEA_RULES` is the
table (merged over the renderer's `HQ_SEA_DEFAULT` — keep the keys in step, hq-deep.test.js diffs
them); `hqSeaShell` / `hqAbyssShell` the shells; `HQ_ROOM_LOOKS.sea / abyss / temple`. **THE RENDERER**
(three-renderer.js "THE DEEP — THE SWIMMER, THE SKIFF, THE BATHYSCAPHE", before the per-frame section;
walker MODES, nothing on the match, nothing relayed — RULE #2): `_hqSwimCheck` at the walker tick's
tail → `_hqTickSwim` (WASD along the camera, SHIFT, C dives, under the surface W swims where you look,
SPACE up / C down, an idle diver drifts up in the open sea, the shallows hand the walker back;
`_hqSwimFree` is the body's collision); the clips = sprites.js `HQ_SWIM_CLIPS` (UAL1 Swim_Fwd_Loop /
Swim_Idle_Loop) baked as `hqSwim` / `hqSwimIdle`, the body pitches with the dive; a catalogue prop with
`vehicle: 'boat' | 'sub'` is registered by the prop placer (`_hq.boats`; `float: true` rides the
surface, `hover` hangs over the floor) and offered by `_hqFindTarget` as kind `vehicle` (E =
`hq.board`; aboard, E = `hq.disembark`) → `_hqTickVehicle` = the helm (W/S, A/D — the camera keeps
the mouse's offset through the turn; the skiff's `_hqHullFree` refuses water under its draft; the
bathyscaphe drives the column, SPACE / C for depth); `_hqSeaWayCheck` enters a whirlpool / an
upwelling by BEING IN ITS MOUTH (`DOOR_HQ.ways` rows `open: true`; the builder returns `mouthY`; the
two builders live INSIDE the `_hqWayBuilders` literal, stub-safe); `_hqSeaArm` / `_hqTickSea` = the
look under the surface (the wet fog on the camera's depth, the dome goes, GOD RAYS, MARINE SNOW,
BUBBLES); the sea's one surface is the battle's animated sheet over the field + the outer ground,
DoubleSide (`_hqBuildTerrain`). Procs: `skiff` (the misc rowboat + a sail), `submarine`, `lighthouse`
(the beam turns), `sea_buoy`, `kelp` (`_hqKelpMat` sways in the vertex shader), `coral_brain` /
`coral_fan` / `coral_tube` / `anemone` / `giant_clam` / `sea_vent` / `fish_school` (forty on one
InstancedMesh) / `temple_dome`; landmarks `waterspout` / `whale`; audio.js `wayWhirl` / `wayUpwell` /
`seaDive` / `seaSurface` / `seaBoard`; map.js `_hqSeaEvent` (the `.hq-hints.swim / .helm` lines, the
toasts); C is a walker key (before E; the pinned `q || p` tail holds); API `hq.board / disembark /
vehicle / vehicles / swimming / diving / sea`. **THE PARTS** (data.js, the block before THE RANCH):
`site_prebuilt_bermuda_sea` (150 × 120: THE CAY + the lighthouse rock (the tape) + THE LOOKOUT + THE
JETTY with the skiff at its end + the sandbar / the wreck islet / the reef + THE MAELSTROM ringed with
four buoys; the board bypassed — `siteRooms.entry.prebuilt_bermuda`; the weir's tide pool re-pointed
onto the cay), `site_prebuilt_atlantis_abyss` (170 × 140, drowned: THE TRENCH, THE DROWNED ROAD, THE
TEMPLE STEPS + the dome, THE STATION + the bathyscaphe (placed FIRST so its lamp keeps under the light
cap), THE SPIRE (the tape — a swim, never hard), the kelp forest, the coral, THE DUTCHMAN BELOW by the
west wall with **`revenge_atlantis.b` RE-POINTED onto that wall** (the id kept), the `upwelling` free
end), `site_prebuilt_atlantis_temple` (36 × 36, closed, family B: THE DAIS, THE ORACLE in its pool (the
tape, the door gun's), the two dry seams `atlantis_hollow` / `atlantis_agartha` on its north wall, the
bay door east — `entry.prebuilt_atlantis`). The whirlpool link `bermuda_abyss` (route `deep`) wears a
DIFFERENT way at each end (`whirlpool` / `upwelling`). `DOOR_HQ.hubs.deep`. TAPES: the bypassed boards'
into their parts + Heaven's board's into the temple (retitled) — hq-finds' rule reads "a bypassed board
may carry none". `npm test` runs `hq-deep.test.js`; amended: hq-terrain (49 rooms), hq-finds,
hq-dutchman, hq-world (the deep line's reach in two halves; the whirlpool in the seams list), hq-ranch
(ten hubs). Ship data.js to Render too. Second pass = MODEL_INDEX §3n. UNSEEN LIVE (RULE #1c): all of
it — the build-plan entry lists what to eyeball first.

RULES the tests taught (the same day): a way / a door whose pad lies under an OPEN sea deeper than a wade has its SILL where the swimmer floats (`hqTerrainDoorY` → the surface less `swimDraft`; the pad itself stays on the sea floor so the spot stays a swim — the whirlpool's frame lifts itself to the surface); a body that FALLS into deep water at speed PLUNGES (a dive at once, `_hqSwimStart`), the rest bob up to the surface; an idle body meets 2.3× the drag and `buoyancy` 2.0 (≈ 0.4 m/s up); a FLOATING body rides over the shallows a quarter past `exitDepth` (`_hqSwimFree`), so the hand-over to the walker is always crossed; `hqTerrainFluidAt` is HEIGHT-AWARE (a deck or a tier above a pool's sheet is dry — read the water BESIDE a plank). `hqFindHardReachTerrain` walks the reachable nodes NEAREST FIRST and stops at the first clear shot (an existence proof; the door gun's 160 m reach made the old every-node scan take 202 s on the sea room — hq-map-remembers' D9 is seconds again).

## THE UNDERWORLD — THE TUNNELS / THE DUNGEONS (complex candidate #3, HQ plan 9.3 stage 10) — 2026-09-18, local delivery
Four parts UNDER Disaster City on Room 1954's site (data.js, the block before THE RANCH; `hqSewerShell(o)` beside the
castle shell; every plate reads `DISASTER CITY · <place>` — disaster-city-3 insists — and THE MAP gathers them as
**`DOOR_HQ.hubs.underworld`**, the first hub that claims rooms BY ID: `hubs[id].rooms = [...]` beats the site rule in
`hqHubOf`, and a hub with only a `rooms` list claims nothing else). **THE SEWERS** (`site_prebuilt_downtown_sewers`,
120 × 84, `halls` with `bsp: false` — the culverts are AUTHORED halls WITH BENDS (a `halls` polyline may bend; the traced
walls follow), a waded `stream` down every culvert's middle with the walkways dry either side (the rule: `hall.w − stream.w
− 2 × bank ≥ the body`; a stream STARTS short of a door's pad or the landing drops in), THE JUNCTION, THE INSPECTION GALLERY
(1.6 up its stair), THE CISTERN (`deep_water`) with THE PLANK (a `deck` spanning both banks), THE PUMP ROOM, THE OUTFALL SHAFT
(4.4 m, the tape)); **THE RUNNING TUNNELS** (`_tunnels`, 124 × 96, `halls`, `bsp: false`: THE LOOP LINE + THE CROSSOVER +
three rooms — THE DEPOT with two `train_car`s (the lit one = the weenie), THE GHOST STATION's 1 m platform, THE CROSSING with
THE SIGNAL GANTRY (5.2 m, the tape); **THE RAILS are twelve `wall` rows at 0.14 m** — under the climb, stepped over,
grindable); **THE HOLDING CELLS** (`_cells`, 64 × 48, `halls`, `bsp: false`, **`minDegree: 1`** = a cell has ONE door: the
corridor hall carries A VERTEX UNDER EVERY CELL so each authored cell takes a straight corridor to the vertex beneath it —
the way to author any row of one-door rooms; the dead-end readout is then the design (the test pins the six cells; a room whose only tree edge is a stub onto a hall inside it reads as one too — the authored halls carry the ways); THE GUARDROOM +
THE CATWALK (2.2) + THE VENT STACK (3.6 m, the tape), THE DRUNK TANK, THE PROPERTY ROOM; `cell_bars` free at the mouths);
**THE OLD WORKINGS** (`_workings`, 60 × 44, `cave` bricked to the ceiling, FLOODED: THE FLOOD waded, THE SUMP never, THE PUMP
LEDGE, THE CHIMNEY (3.9 m, the tape)). The cycle: sewers → tunnels; sewers → cells → workings → sewers. **THE SEAMS**:
Downtown's streets grew `sewer` (THE PUMPING STATION, e z −20, a pair with the sewers' `pump`; its alley a `path`);
`links.strip_sewer` (a `gutter` way free on the Strip's back-lane kerb ⇄ a `leaf_cell` grate — the storm drain's rule),
`sewers_drain` (⇄ the storm drain's SOUTH wall), `tunnels_works` + `tunnels_platform` (the loop ⇄ the Works' `tunnel` room
and Downtown's platform part, both on the WEST walls past the trains — the subway line runs THROUGH the loop now),
`cells_dungeon` (⇄ Room 24601's south wall), `workings_oubliette` (⇄ the oubliette's east wall) — both on the NEW dashed
`routes.dungeons` (never THE UNDERCROFT: hq-cave insists every leg of that line touches Hollow Earth). Tapes: four re-homed
(D.U.M.B.'s, the Lodge's, the Haunted House's, Hollow Earth's second); `findSpots` pins the four. Looks `sewers` / `tunnels`
/ `cells` / `workings`. `npm test` runs `hq-underworld.test.js`; amended: hq-terrain (46 rooms), hq-floor-plan (40 planned),
hq-dumb, hq-ranch (nine hubs), hq-world (the seams list), hq-city (Downtown's complex is ten rooms), hq-finds (the shelf's pair is a board tape + a part tape — no board carries two any more). No renderer change;
ship data.js to Render too. NEXT: THE DEEP (the user's other pick — Atlantis / Agartha / the Dutchman's hold / Bermuda's
weir on the `deep` route); MODEL_INDEX §3m has the underworld's wishlist. UNSEEN LIVE (RULE #1c): all of it — the channels'
sheets in the culverts, the rails at 0.14 m, the bars standing free (`z −14.0` is the edit), the far ends on the platforms.

## THE FINISHER PASS, delivery 1 — TO THE MOON · METEOR STORM · THE TRICK SHOT + THE SPELL-MADE MONUMENTS + THE ROCKS (2026-09-18, local delivery)
**`FINISHER_PLAN.md` is THE doc for the over-the-top capstones** — the rules (§1: a
finisher is a capstone, reworked in place or a ring-4 twin (≤ 2 per node, 8 per
branch); the round-10 Entropy alternative is deferred, §4 has the sketch), the
catalogue of the rest of the user's brief with home spells / engine needs / effort
(§3), the checklist (§5). Read it before touching a capstone. **THE SPELL-MADE
MONUMENTS** (the user's rule: raised terrain that means a wall or a pillar is a
Meshy piece): a `terrainCreate` row with `monument: { kind }` (data.js: `rampart`
→ `menhir`, `raceShieldWall` → `castle_wall`, `raceGothicRampart` →
`gothic_wall`, `raceZigguratProtocol` → `ziggurat_block`) stands ONE real
monument per affected tile through map.js **`placeSpellMonument(mon)`** (the ONE
live placer: appends to `state.monuments` — synced —, stamps the kind's
`_MON_GRID` box into the voxel + column grids, records the floor in
`state._monumentTiles`, syncs the column; refused on a wall / objective /
non-walkable object / another monument / a living unit — the damage still
lands, the stone does not) and never raises the ground (`terrainDeform` stays on
the row for the ghost preview only). The four kinds are `[1, 1, 2]` grid rows in
map.js + three-renderer.js `_MON_GRID`, delta-maps.test.js's mirror,
`MF_DELTA_SOLID_MONS` and the editor catalogue; builders `_hzPropMenhir`
(the woods `menhir` GLB), `_hzCastleWallSeg` (procedural crenellated masonry in
the castle sheet — a wall piece is authored along X, the placer's `rot` = 0 for a
horizontal line / 90 vertical), `_hzGothicWallSeg` (the Vatican `church_wall`
GLB), `_hzZigguratBlock` (a stepped sandstone block); `_buildMonumentObj` fits
each into its tile box. Adding a wall spell = `monument: { kind }` + a grid row
in the three tables + a builder. **THE ROCKS**: `_WPN_MODELS.asteroid` /
`.asteroid2` (the D.O.O.R. kit's `asteroid_1/2.glb`, `axis: 'y'`) through
**`_finRockBody(diam, { key, glbOnly })`** — the boulder projectile (Boulder
Hurl, Stone Throw, Stonefall — added to `_BOULDER_SPELL_IDS`), the Meteor's body
(`_spawnMeteorSphere3D`: asteroid → moon → icosahedron), the storm, the moon's
debris; warmed 3.5 s after load. **THE THREE**: (1) cyborg `raceRocketToss` =
**To the Moon** (`moonshot`, `moonArcTiles` 7, `carryHeight` 6): battle.js
`playSkyThrowFx` flings 1.9 s with `arcPx` (three-renderer.js
`startThrowArcTween`'s new opt — the bump above the carry line), publishes
`window._ewMoonshot` and calls **`ThreeVFXEffects.sigMoonshot3D`** INSIDE the
relayed function (never through `fireGeometry` — the guest would get the moon
twice): the `moon` misc GLB (`getMiscModelClone`) drops into the fling's apex,
the body hits it at half the fling, whiteout, 18 shards, seven `_sigAsteroidDrop3D`
pieces onto the landing's 5×5; director `CINE_SEQUENCES.raceRocketToss` = sky
watch on the apex column, freeze + slow-mo on the crack (the throw's own
`_cineRetargetShot` yields to it). (2) mothman `raceProphecyOfDisaster` =
**METEOR STORM** (`aoeRadius` 2, `groundsFlyers`): `EFFECTS['raceProphecyOf
Disaster_descent']` (`storm: true`, descentMs 1600) → `_fireDescent` runs
**`_sigMeteorStorm3D`** — ONE `_sigRunOwned` group for every body (the cap is
20 live groups), n = 10 + 6r rocks on random tiles across the first 62 % of the
fall, streakers across the sky, THE BIG ONE on the centre timed to the descent's
impact, a landing beat per rock (a light `raceProphecyOfDisaster_tile` per
tile); the camera is the descent grammar's `cineSkyWatch`. (3) cowboy
`raceHighNoon` = **THE TRICK SHOT** (`ignoresLineOfSight`, `travelMs` 1500,
range 6, no `projectileOverride`): battle.js `executeSpellAnimation` hands a
row's `travelMs` to the action camera (`playCinematicAttack` honours it and the
bolt's flyMs reads it back); `_fireBoltMapped` hands High Noon to
**`_sigTrickShot3D`** after the revolver rig — the path is planned off the LIVE
board (raised tiles higher than either end, `wall` / `mountain`, `state.
_monumentTiles`, never a unit; the board's rim past the edge fills in on a flat
map), 3–5 bounces, the legs share the travel by length, steel sparks per bounce,
the tracer cools behind the head; director `raceHighNoon` = the clock, the slam,
a high wide `cineFlyBy` at half speed, the slam on the hit. RULE #2: all three
ride relays that exist (the throw FX, the descent intent, the bolt intent); the
guest's ricochet plans its own bounces (cosmetic). `npm test` runs
`finishers.test.js`. UNSEEN LIVE (RULE #1c): all of it — the moon's size and its
fall into frame, the shards' spread, the storm's density and the big one's
timing against the damage tick, the ricochet's read at half speed (a bounce off
the rim on a flat map), every monument's scale in its 1×1×2 box (the menhir GLB
fitted to a full tile wide may read chunky — `_MON_GRID` and the builders'
widths are the edits), the church_wall GLB's facing as a wall piece.


## THE FINISHERS — THE EXECUTIONS (the gauge's other verb) + THE CAMERA A DIRECTOR OWNS (2026-09-19, local delivery)
The user: "instead of the finishers replacing the capstones they should be an alternative to the Entropy Strike — a
single-target attack with one unit, or a team attack on the entire enemy team; completely unique finishers for every
playable unit; the cinematic camera is supposed to enhance, not ruin". **FINISHER_PLAN.md rule 0 is the spec** — read
it before touching a finisher. A FULL GAUGE buys either the ENTROPY STRIKE (unchanged) or a FINISHER: ONE unit executes
ONE visible enemy for ~3× the strike's slice (data.js `FINISHER_RULES`), typed by the chart (one of the race's own
types → STAB), 1 AP + the whole gauge. **THE CATALOGUE** data.js `FINISHERS[race]` = a row for ALL 99 races (`name ·
glyph · type · tagline · desc · sig · built`); `sig` names a BESPOKE director + signature, `sig: null` = designed, not
built — it plays the TYPED EXECUTION (`FINISHER_TYPE_DEFAULTS`, battle.js `_finTypedDirector` = the six apocalypse
directors on one victim). Read it ONLY through battle.js `getFinisherFor(unit)`. **THE ENGINE** (battle.js, the block
after `_EWS_DIRECTORS`): `canUseFinisher` / `getFinisherTargets` (= the strike's: every visible enemy) /
`getFinisherDamage` / `getFinisherForecast(unit, target)` (`dmg · kill · weak · resist`) / `getFinisherBestTarget` /
**`doFinisher(unit, targetId)`** (drains the gauge, `state._finisherCount`, spends all AP, Simul-queues as
`{ type: 'finisher', targetId }`) → **`_finPlayCinematic(unit, target, hooks)`** = the shared skeleton (the ⚛ banner in
the type's theme with a FINISHER kicker — `_ewsShowBanner` takes `opts` now —, ONE live pane on the executioner + the
name slam, the director's `charge` → `cam` + `stage` at CHARGE −120 → `strike` (damage lands) → `resolve`, on FIXED
`chargeMs / strikeMs / resolveMs`; `camera.save` → `restore` — it NEVER runs the stock two-beat action shot).
`_FIN_DIRECTORS[sig]` hooks: `siren · charge · cam · stage · strike · resolve` on the strike's ctx + `target · hitAt ·
shot · dive · slow · freeze · fade · enterVoid`. **THE BUILT SIX**: king arthur WORLD CLEAVE (`_sigWorldCleave3D`, the
sword falls, the blade sweeps, a wall of light + a fissure edge to edge), anubis THE WEIGHING (`_sigWeighing3D`, the
scales, the heart vs the feather, Ammit's jaws), santa clause THE NAUGHTY LIST (`_sigNaughtyList3D`, the scroll with
the name, coal, the house-sized present, the bow last), honda civic HIT AND RUN (`_sigHitAndRun3D`, a misc-cache car
off the map, the ramp, the tumble, the airbag), kaiju THE STOMP (`_sigKaijuStomp3D`, the shadow first, then the foot),
ai SEGFAULT (`_sigSegfault3D`, the scan, the cage, the voxel deletion + `cineUnitFade`). three-vfx-effects.js "THE
FINISHER PASS 2" (one group through `_sigRunOwned`, timers through `_fxDelay`, called INSIDE the relayed cinematic —
never through `fireGeometry`). **HUD**: the ☠ row LEADS the ⚛ picker (hud.js `_hrlgEntropyBlades`, forecast on the
best victim) → `chooseActionMenu('finisherTargets')` → `_hrlgFinisherTargetBlades` (face, HP, ≈−dmg, KILL) →
`doFinisher`; ui.js gates the view like the entropy one. **RULE #2**: online.js wraps `doFinisher` (engine
game-action, `targetId`) and `_finPlayCinematic` (relay `finisher-cine`; the guest replays with no applyHit, muted).
**AI**: ai.js `scoreFinisher` (a candidate per victim the execution KILLS + the best non-kill, `_noDanger`), the
executor case, `_candMatchesHuman` / `_candDesc`; battle.js's Simul conversion / label / resolver know the step.
**THE CAMERA A DIRECTOR OWNS**: battle.js `cineOwnShot(sequenceId)` — the stock action shot's beat 2 (the cut to the
victim) and every `_cineRetargetShot` are skipped for an owned sequence; High Noon owns its shot from the clock, To
the Moon from the fling (the stock cut used to yank the fly-by / sky watch back to a shoulder close-up — why the
capstone finishers read better with the action camera off). A new bespoke director that composes its own shots MUST
call it. Adding a finisher = set `sig` on the race's row + a director + a signature + the BUILT table in
finishers.test.js (14 tests). Unseen live (RULE #1c): all of it — FINISHER_PLAN §7 lists what to eyeball first.

## SKATE + PORTAL MOVEMENT INTEGRATION — 2026-09-18, local delivery (not uploaded)
Main bb51ae4 base. three-renderer.js: `_hqTickRide` substeps `_hqTickRideStep` at
≤ 1/120 s and records velocity; A/D flip for R.v < 0. `_hqRideSlide` retains the
free tangent; `_hqRideObstacleSlide` follows circular props/NPCs without overlap.
Body-centre ground probes retain the surface's existing body-radius collision pad.
`_hqPortalSweep` checks movement before collision/gravity, including grinds and the
walker, with full rectangular `_hqPortalInMouth` geometry. Wall mouths now hold exits
until the body leaves. `_hqPortalRideExit` puts mapped carry into signed R.v / R.hd
and clears the unused walker impulse. `_hqPortalRideState` keeps plain trick/queue/
combo/stance data through `_hqPortalCarryFor` → `_hqGoTo` on room changes, never rail
objects. Floor hatches do not prematurely bank/bail a trick. Raised wall exits fall;
flat exits keep mapped normal velocity. See the HQ plan/DOOR_MASTER build logs and
hq-skate.test.js regressions. R2: three-renderer.js; Render: index.html with fresh
20260918-skate-portals-0545-cors token; tests/docs repo-only. No browser playtest or
live upload; hands-on feel and cross-room scene-load pauses remain unverified.

Validation completed for this delivery: 49/49 skateboard + portal tests passed,
including 11 new movement/traversal regressions; edited JavaScript syntax and diff
whitespace checks passed. Full-suite attempt: 1642 passed, 6 skipped, seven assertion
failures reproduced on untouched main bb51ae4 (hq-stage2, hq-terrain, hq-urban), and
one interrupted hq-map-remembers process after ~8 minutes. Its seven non-exhaustive
checks subsequently passed; the exhaustive hard-find reachability check remains
unverified. No browser playtest. Full details are in the ZIP's README.txt.

## THE LEY LINES — THE LINE THE STONES STAND ON (complex candidate #9, HQ plan 9.3 stage 12) — 2026-09-18, local delivery
Family C's THIRD generator, **`terrain.gen.kind: 'ley'`** (data.js `HQ_TERRAIN_GEN.ley`, the branch in `_hqTGenerate`; EXPLORABLE_AREAS_GUIDE
§1 row C'): `gen.lines` = the AUTHORED straight main lines, `gen.chambers` the authored round rooms; the generator adds a chamber at every
crossing (`crossR`), a round ANTECHAMBER behind every door pad (`padR`) and `forks` FORKS that leave a line at a `forkDeg` angle, `forkW`
wide, and run STRAIGHT until they `join` another corridor, hit the `rim`, or run out (`len`) — then one `joinP` turn at the nearest line or a
NICHE (`nicheR`); `reforkP` forks a fork once. The solid is MASS to the ceiling and TRACED like the halls' (every `gen.kind === 'halls'`
hook reads `|| 'ley'`); `minDegree` 0 — **a niche is the design, `genPlan.deadEnds` is always empty; `genPlan.forks / chambers / niches`
is the readout.** THE WALLS LIGHT THEMSELVES: three-renderer.js **`_hqBuildLeyVeins`** (hooked beside the halls' lights) — an amber vein
(the mood's `strip`) along the foot and the lintel of every traced wall on its OPEN face, one breathing material, a glow per chamber /
niche, THE KEYSTONE in every crossing chamber; `EW_HQ_NO_LEY_VEINS`, `HQ_LEY_VEIN_MAX`. **THE PARTS**: `site_prebuilt_gobekli_leylines`
(200 × 150 × 3.2, closed, `hqLeyShell`; THE NEXUS sunk round THE OMPHALOS = the tape) and four ancient sites REBUILT as open `rooms` parts
with `thicket: false` (the banks are the solid — `wallH` is the bank's height) under `hqAncientShell` (the site's own sky by hand):
`site_prebuilt_stonehenge_henge` (the bank + ditch as an open ridge + gully, the sarsen circle + the horseshoe as `wall` rows, THE GREAT
TRILITHON tier = the tape, `trilithon` / `sarsen` GLBs), `_gobekli_tell` (THE TELL a hill, four enclosures `dip … dome: true`, ring walls,
`t_pillar` procs, THE SENTINEL = the tape; the ley's mouth a door PAIR; `well_gobekli` free on its flank), `_giza_plateau` (the pyramid four
stacked `plateau` rects up a four-flight stair 8.2 m per 3.5 m; THE SPHINX's head = the tape; `obelisk`), `_babel_tower` (four tiers up
THE SPIRAL, `babel_crane` on top, THE LOAD = the tape). The four boards are BYPASSED (`siteRooms.entry`); the four `ley` links RE-POINTED
onto the parts with their ids kept (a star: every leg Göbekli's; Technoticlan's end stays on its board); `hubs.ley`. RULES: a stair up a
tier's face wants the ledge ≥ 8 m (L ≥ 2.2 h + 0.5 in + 0.7 in); a hard tape under a low ceiling stands on a tier whose top band the eye
sees from the floor; a tape that must move comes off a BYPASSED board first (Cyberpunk's BILLBOARD → THE SURVEY). `npm test` runs
`hq-leylines.test.js`; amended hq-terrain (54), hq-floor-plan (45, the kind), hq-ranch (11 hubs), disaster-city-3, hq-area51 / hq-city / hq-city-2 / hq-dumb (the re-homed tapes, the source pin), hq-deep (the token). Ship data.js to Render
too (the finds ledger). NOT built: Technoticlan's part, the second-pass assets (MODEL_INDEX §3o). UNSEEN LIVE (RULE #1c): all of it.

## THE AREAS — EVERY BOARD IS AN AREA (Room 64 excepted), THE MARKER, THE DOOR RULE (2026-09-18, local delivery)
The user: "replace all board maps with areas, except for Room 64 (it is purposely a Δ map); the floating crystal icon somewhere in
the center of the main area, or right by a weenie, with the option to battle on the delta map; no unnecessary doors to other
areas — we just spent the time making the worlds / paths that connect them; keep hidden passages and weird doors like draughts
and the telescope." **EVERY BUILT SITE BUT `prebuilt_training` IS BYPASSED** (`DOOR_HQ.siteRooms.entry`, 38 rows): the bay
threshold lands you in a PART. The sites that had a complex keep it (the woods → THE CLEARING, whose `forest` hollow tree IS the
bay door — an entry door row may carry `way` + `leaf: null`); the twenty that were a board room alone got ONE generated AREA each:
data.js **`HQ_AREA_SPECS[mapId]`** (the block right before the built loop; `part`, size, sheets, `gen`, features, props, natives,
lines, `plaza` / `marker`, `look`, `landmarks`) → **`hqAreaRoom(mapId, spec)`** (a terrain box room on THE COMPLEX BLUEPRINT: a
`rooms` / `cave` / `halls` plan, the site's own EW_MAP_META sky through `hqAreaSky` + a fog per metre, a grade, THE PARK RULE, a
weenie plateau with the hard tape pinned on it in `findSpots`, a `path` from the bay pad to THE PLAZA — never hand-edit the
generated `site_<id>_<part>`; edit the spec) → **`hqBuildAreas()`** (runs before `hqApplySiteEntries`; a room authored by hand under
the same id wins). The parts: levels · bowl · templecity · crystalcity · station · slopes · summit · cydonia · mare · grove ·
village · plain · garden · halls · horizon · hexagon · grounds (the Haunted House's, the hall's `front` door lands on its `house`
door) · innersun · deck (the Spaceship's, its `airlock` door) · deck (the Dutchman's, its `companionway`). **THE MARKER**: every
entry part carries ONE counter `battle` (`proc: 'battle_marker'`, `site`, `overlay: 'crossing'` — the same terminal the board's
console opened; post-match returns you to it) at the area's plaza or a weenie's foot; the older parts read **`HQ_AREA_MARKERS`**
(measured reachable nodes — hq-areas' tool); **`hqAreaMarker(roomId)`** is the ONE read, `hqAreaRoomOf(mapId)` the entry part. The
renderer needed nothing: a box room's counter stands on `_hqCaveTop` (the field's ground). **THE DOOR RULE**: a PLAIN-leaf door
between two sites (`hqLinkPlain`) is gone unless **`HQ_AREA_KEPT_LEAVES`** names it with its reason (a docked collar, a tunnel that
IS the route — the bases, the ley line, the subway, the highway roads — a site's only line, a facility door); PRUNED: `mars_moon`
(Mars is the collar's FOURTH course, `mars_derelict`), `vatican_heaven`, `hollow_hell`, `atlantis_hollow`, `atlantis_agartha`,
`shasta_agartha`, `antarctica_agartha`, `antarctica_northpole`. **A DRAUGHT** = `secret: true` on a links row — `hqLinkDoors` wears
a hidden door at both ends (`leaf: null`, label A DRAUGHT; the renderer's wall slab; the map shows it once both rooms are seen):
`vatican_hell` (the crypt's warm wall — "no door to hell in the Vatican") and `cern_backrooms` (NOT ON THE PLAN). Every link that
stood on a bypassed board was RE-POINTED onto its area (ids kept). **THE TAPES**: no bypassed board keeps a tape — every board's
row of `HQ_TAPE_SHEET` moved into its entry part (merged onto the part's row where one existed; the hundred stays a hundred; the
ids changed with the rows — a prototype's claims, nobody's progress). **THE GRAPH**: `hqWorldGraph` sends a door into a bypassed
board to the part (`hqSiteEntry`), so THE MAP, the directory guard and every reach test walk where the walker lands; the board
rooms are still generated (the threshold's number, the Δ under the marker) but nobody stands in them. `npm test` runs
`hq-areas.test.js` (the bypass, the marker on reachable ground (heavy), the door rule, the tapes, the stations). Ship data.js to
R2 AND Render (the finds ledger). UNSEEN LIVE (RULE #1c): all twenty areas — DOOR_HQ_BUILD_PLAN §9 lists what to eyeball first.

## THE ASTRAL REALM — THE WAITING ROOM · THE SEA OF POSSIBILITY · THE NIGHTMARE · THE LIBRARY OF UNTHOUGHT THINGS (complex candidate #10, HQ plan 9.3 stage 13) — 2026-09-19, local delivery
The user: "the realm of all possibilities, the home of thought-forms, where ideas exist before they are thought by human minds;
creativity is instantaneous, just like your dreams — but that means nightmares as well; bizarre and nightmare fuel mixed with the
beautiful and fantastical; it can connect the Dream Research, the Looking Glass, the Haunted House". Four parts on ROOM E4's site
(data.js, the block before THE RANCH; `site: 'prebuilt_lookingglass'` + `part`, no `roomNo`, every plate `THE ASTRAL REALM · <place>`;
shells `hqAstralShell` / `hqNightmareShell` / `hqUnthoughtShell` beside the deep's; looks `HQ_ROOM_LOOKS.astral / waiting / nightmare /
unthought`), THREE FAMILIES with the hand-offs at real doors: **THE WAITING ROOM** (`site_prebuilt_lookingglass_waiting`, family B — a
prefab box: seven chairs facing the wall, three clocks that disagree, NOW SERVING with your own number, one thought-form nobody has
called), **THE SEA OF POSSIBILITY** (`_sea`, 150 × 120, OPEN under its own violet night — stars 1.3 / nebula 1.8, the `islands` roster —
on a `rooms` plan with no thicket whose banks are `crystal`; THE STREAM waded, THE POOL OF IDEAS in a colonnade, THE MIRROR LAKE never
entered, THREE FLOATING THOUGHTS 3 → 6 → 9 m up `float: true` stairs, THE SPIRE OF THE UNTHOUGHT 7.5 m = the tape; the hub's anchor),
**THE NIGHTMARE** (`_nightmare`, 100 × 76 × 6.5, closed, a `cave` plan in the FLESH sheets: THE LONG HALL, THE MAW ringed with seven fangs
round THE BED, THE STAGE, THE BLOOD (lava), THE SINKHOLE, THE SPINE 4.6 m = the tape) and **THE LIBRARY OF UNTHOUGHT THINGS** (`_library`,
140 × 100 × 4.6, closed, a `ley` plan with `wallKey: 'wood'` — the stacks fork and end in nooks and light themselves; THE READING ROOM,
THE GALLERY, THE TOP SHELF 3.4 m = the tape). **THE SEAMS = THREE SCREENS** on `routes.astral` (dashed, `#d8b4ff`; the rev 22 `screen`
way at every end, no new kind): `rem_astral` (Room REM's north wall ⇄ the waiting room — a facility end, never gated), `dumb_astral`
(the D.U.M.B. ward's north wall ⇄ the library), `attic_nightmare` (the attic's west wall ⇄ the nightmare; the Haunted House is a
four-line interchange now). The garden ⇄ the waiting room is a DOOR PAIR (the same site; `HQ_AREA_SPECS.prebuilt_lookingglass.doors`
— a spec may carry doors). THE CLOSET WITH NO BACK WALL joins the sea and the nightmare from both sides (`way: 'closet'` on a door
row). `hubs.astral` claims the four parts BY ID. **THE RENDERER** (three-renderer.js "THE ASTRAL REALM — THE THOUGHT-FORMS", before the
per-frame section): four procs on tickers — `thoughtform` (its vertices breathe; a light), `dream_eye` (`_hqAstralEye`, the shared
ball-iris-lids helper: it TRACKS `_hq.player`'s head and blinks), `impossible_stair` (four flights, the fourth stepping down into the
first, turning on a cloud), `nightmare_bloom` (bone cones opening and closing; a light) — and landmark `eye` (THE WATCHER on the sea's
horizon). RULES the tests taught: an open room's shell `h` is still the ceiling doorhq's prop rule reads (the telescope at 9 m wants
`h` 14); a wall prop's `mount + h` clears the shell's `h`; a `rooms` plan's crystal banks cut rescue ramps where the jump reaches a
bank top (nine on the sea — `info.rescues`). Tapes: four re-homed (Camelot's ward, Hell's pit, CERN's ring, the basilica — each keeps
its board's own; the hundred stays a hundred). `npm test` runs `hq-astral.test.js`; amended hq-terrain (77), hq-floor-plan (68),
hq-ranch (12 hubs), hq-world (the seams + the house's lines), doorhq (the light regex). Ship data.js to Render too (the finds ledger).
UNSEEN LIVE (RULE #1c): all of it — DOOR_HQ_BUILD_PLAN §9's entry lists what to eyeball first.

## AREA CONTENT PLAN D1 — THE CLIMB + THE TEACHING ROOMS + THE RULES AS WARNINGS (2026-09-19, local delivery)
**`AREA_CONTENT_PLAN.md` is THE doc for filling the rooms with purpose** (the user's brief: too boxy, more climbing, doors
too exposed, discovery should reward, bigger cities); its §6 records the user's decisions (the cave's numbers, D2 before D3,
six looks, warnings until D3, prefab parts exempt from R1) and EXPLORABLE_AREAS_GUIDE §9b carries the rules R1–R9. **THE
CLIMB**: a `terrain.features` row `{ k: 'climb', x, z, y0?, y1?, face, look: ladder|rope|vine|chain|pipe|wall }` (a plain box
room: `room.climbs`, the head on a blocker top) — data.js `hqTerrainClimbs` → `info.climbs` (the head spot found PAST the
tier's edge blend), `hqTerrainClimbEdges` = THE SOLVER'S EDGE read by every walk (`hqTerrainReach`, `_hqTReachGrid`,
`_hqTReachJump`, `_hqTReturnJump`) so a ladder alone may reach a tier, a pit with a ladder out is no trap (no rescue ramp),
a tape above one is not hard; a plan keeps a climb's foot + head open; the scatter stays off them;
`HQ_TERRAIN_RULES.climbReach / climbSpeed / climbMount`. three-renderer.js "THE CLIMB" (before the per-frame section):
`_hqBuildClimbs` (the six looks; called after the props), `_hqClimbCheck` at the walker tick's tail (the foot walked INTO
/ the head walked OFF = the mount; the rider steps off the deck, the swimmer never climbs), `_hqTickClimb` (W / S, SPACE
lets go, the top MANTLES with UAL2 ClimbUp_1m), `EW_HQ_NO_CLIMB`, `hq.climbs()` / `hq.climbing()`. sprites.js
`HQ_CLIMB_CLIPS` — NO ladder loop exists in either library: the climb is the swim stroke stood up (`_hqTickChars` lean
−1.3). map.js `onClimb` → `.hq-hints.climbnear` (W CLIMB) / `.climb`. A walker mode: nothing on `state`, nothing relayed.
**THE TEACHING ROOMS (R9, hard)**: `HQ_WALK_LESSONS` (climb / skate / swim; `hqWalkLessons()`; the `lesson_plaque` proc
reads both tables) — THE GARAGE is 5.4 m high now with THE DOCK OFFICE (a `stair_landing` platform + `garage.climbs`, the
building's first ladder), Room 26 the skate plaque, the natatorium the swim plaque. **THE AUDIT**: `node
check-area-content.js [--rules] [--all] [room…]` (a module — `audit()`, `RULES`) measures R1–R8 (R2 the pull on the reach
graph, R3 door exposure by eye-height LOS, R4 the earned exits, R5 the tease, R6 `parti` / `typology` — an `HQ_AREA_SPECS`
row's ride to the room —, R8 per 60 m² of OPEN floor); `area-content.test.js` prints the offenders as WARNINGS (heavy) and
never reds until D3. `npm test` runs `hq-climb.test.js`. Next: D2 (the cities twice the size, `districts` on the `city`
plan, fire escapes as `climb` chains onto rooftop `deck` runs), then D3 / D4 / D5. Ship data.js to Render too. UNSEEN LIVE
(RULE #1c): the ladder, the stood-up stroke, the mantle, the DOCK OFFICE, the plates.

## MOBILE CRASH / SFX PASS — 2026-09-19 (local delivery, not deployed)
Reported: iPhone 13 reaches the menu but crashes entering HQ/a match; some SFX silent. `MOBILE_UPLOAD_README.md` records the exact upload paths, checks and remaining device validation.

`three-post.js` Low mode now returns after lighting setup BEFORE composer/bloom allocation; both render paths already fall back to direct rendering. `three-renderer.js` serializes unit/misc model loading in Low mode, caps embedded material textures at 512px, skips all character appearance preload when 3D units are disabled, and samples one in four tornado frames (same cycle duration). `sprites.js` no longer eagerly decodes the 99 tornado images. No board rules/collision/fog/host or guest state changes.

`audio.js` leaves music at preload none and plays file SFX through the existing gesture-resumed AudioContext (two decodes, 8 MiB LRU buffer cache, 16 pending URLs, 12 voices; 1.2s stale-event cutoff). The 37 Ogg cues now point to new `_mobile.mp3` files; the delivery includes converted originals, uploaded to R2 `Assets/SFX/`, retained under `mobile-audio/` in the repo. Upload assets BEFORE audio.js. Existing MP3 effects, mixer levels and cooldowns remain. Ogg music is not converted. Shared index token: `20260919-mobile-02-cors`.

Validation: all 204 JS syntax checks, data parity and 21 schema checks pass; targeted suite 65 pass / 3 optional dependency skips / 0 fail. Nine mobile regressions in `mobile-performance.test.js`; `character-creator.test.js` loader sandbox now loads the new helpers. Broader run exposed three pre-existing failures confirmed on original source (Astral obsolete token, DUMB dream-lab exit count, Astral sea column in water). No live playtest, upload or physical iPhone measurement; do not call this shipped or the crash device-confirmed.

## AREA CONTENT PLAN D2 — DISASTER CITY + THE GRID, TWICE THE SIZE (THE DISTRICTS) — 2026-09-19, local delivery
`AREA_CONTENT_PLAN.md` §7 has the log, EXPLORABLE_AREAS_GUIDE §4b the rule. **THE DISTRICTS**: a `city` plan may carry
`gen.districts = [{ id, label, rect: [x0, z0, x1, z1], lotW, lotD, lotMinW, lowP, storeys, texP, ruinP, style, fronts, neon,
fenceKey, fenceH }]` (data.js `_hqTGenerate`'s lot pass): the district is read PER LOT at the run's position along a face,
every lot row carries its district's look (`district` · `neon` · `texP` · `ruinP` · `style` · `fronts`), the fronts inherit
it, a yard wall wears its district's fence, `info.districts` counts the lots per district; three-renderer.js `_hqTexPlan` /
`_hqBuildCityLots` read the LOT before the plan (`lotNeonOf`, a second `_hqTexBatch` for a flipped neon flag, `lot.style`
when the storeys allow it, `var store = (lot.fronts || gen.fronts) === 'store'` per front). **THE CUT**: `plateau.sink:
true` = a SUNK tier (THE UNDERCITY, −4) the walker drops into and never climbs at the wall; a plan never forces it open.
**THE GANGWAY**: `deck.gangway: true` = the forced band is the deck's OWN width (a deck between two roofs across a YARD —
never across a street: the height field holds one height per point; an overpass over a walked street is a later layer
mechanic). **THE FIRE ESCAPE**: `climb.look: 'fireescape'` (three-renderer.js `_hqBuildClimbs`: a steel ladder + a grated
landing cage) chained through a LANDING plateau (1.6 × 2.2, half the height) against a roof's flank in an ALLEY (a `path` —
no lots on a path; the roof stands ≥ 3.9 m behind the street's lots). RULES the solver taught: a `rail` on a roof stands
≥ 1.6 m inside its edge, one per roof (its 2.8 m forced band on the mass = a pocket); a canal the walker never enters is
`deep_water` with a 0.55 m bed (a deep bed leaves a dry ledge at the bank's foot = a rescue scar); lots backing onto a
canal need ≥ 5.5 m of mass to the bank. **THE ROOMS**: `site_prebuilt_downtown_streets` 224 × 176 (financial · oldtown ·
docks: the old town's high street / squares / church / THE WAREHOUSE ROOF, the docks' waterfront / THE CANAL under four
bridges / THE QUAY / THE BASIN + THE CONTAINER ROOF (the second tape, the gun's) / THE FLOODED QUAY + `links.docks_sewer`),
`site_prebuilt_cyberpunk_streets` 208 × 168 (neon · stacks · undercity: seven roofs, four fire escapes, three gangways;
THE CUT with THE RAMP ROAD, THE STEPS, THE DRAINS, THE OVERLOOK, the bay door down there, `links.undercity_sewer`), the
Strip at its size + two rooftops; every pinned core coordinate untouched; `parti` / `typology` on all three. **THE AUDIT**:
`RULES.R7.districts` 3; a road out is never earned; a tier is judged against the MEDIAN sill. R1 is not met by either city
(the number was set from 1 500 m² caves — the user's call in AREA_CONTENT_PLAN §6). `npm test` runs
`hq-city-districts.test.js`. Ship data.js to Render too. UNSEEN LIVE (RULE #1c): all of it.

## AREA CONTENT PLAN D2b — THE BRIDGE LAYER (stacked walkable surfaces in a terrain room) — 2026-09-19, local delivery
The user: "why is that limit there … of course we need stacked walkable areas like bridges … why can't we just use 3D
objects as bridges?" THE LIMIT was one structure: the terrain field `info.H` holds one height per (x, z), a `deck` was
WRITTEN INTO it (a deck over a walked street deleted the street) and every solver keyed a node by cell alone. (A 3D object
always walked — a prop's top is a floor, the stairwell's stacked blockers — but the solvers could not see it, so nothing could
prove a route across it.) Now a **`bridge`** feature row (`{ k: 'bridge', x0, z0, x1, z1, w, y, thick?, rails?, key? }`, or a
`deck` wearing `over: true`) is a SECOND SURFACE the field never carries: data.js `hqTerrainBridges` → `info.bridges` (each
with its `layer`); **`hqTerrainFeet` returns its top for feet that ARRIVE within a climb of it** (`hqTerrainBridgeFor` — the
wall rule generalised; a fall lands on the first slab under it; a FREE query is the ground's), the ground under it stays
walked while the slab leaves `HQ_TERRAIN_RULES.headroom` (1.95 m; a lower slab is a wall to the body beneath — never a
clip), `hqTerrainAir` / `hqTerrainCam` hold the slab solid (`hqTerrainInBridgeSlab`), and EVERY solver keys a node by cell +
layer × (nx·nz) (`_hqTNodeFeet` = the candidates at a cell — the step's surface, the jump's cliff top, every bridge the jump
reaches from below — used by `_hqTReachGrid` / `_hqTReachJump` / `_hqTReturnJump` / `hqTerrainReach` (string keys `i,j` /
`i,j,L`; `hqTerrainNodeKey(info, x, z, y)` names a layer when given a y) / `_hqTTraps` (components over CELLS)). Bridges
STACK (`hqTerrainLayerAt`). A plan forces only a bridge's two MOUTHS (a short run 0.9–1.6 m INSIDE each tier at 0.7 × the
width — the raster's round cap must stay inside the tier, or the ground beside it opens and traps). RULES: a bridge is LEVEL
(a slope is a `ramp` on the field); its ends stand 0.7 m inside the tiers it joins at their height; never run one over a car
ramp that rises to within the headroom of its slab; over water the walker never enters a `deck` is still right. Renderer:
three-renderer.js **`_hqBuildBridges`** (from `_hqBuildTerrain`: the slab — the path sheet on top, the cliff sheet on the
sides — a box girder, kerb lips, steel rails = grind rails on `_hq.rails` (`bridge: true`), PIERS every ~7 m where the ground
lies ≥ 1.5 m below and no traffic route runs, each a blocker with no top); the door gun's `_hqPortalSurf` lands the ray on a
deck (`hqTerrainBridgeBelow`) and `_hqPortalLedgeSnap` puts a floor door on one. `check-terrain.js` prints `bridges n` and
the dump draws a span as `B`. THE TWO: Downtown's **THE OVERPASS** (the parking deck west over THE AVENUE at 3 m to THE WEST
LANDING + THE OVERPASS STAIR off the ring road) and the Grid's **THE OVERLOOK SPAN** (the overlook south over THE CUT and THE
LOWER CROSS to THE PIER, down a 7 m fire escape). `npm test` runs `hq-bridge-layer.test.js`. NOT built: a door ON a bridge,
props on a bridge, the full second floor (EXPLORABLE_AREAS_GUIDE §5 item 3 — this is its pattern). Pre-existing on main
before this delivery, not touched: hq-climb's six-looks pin (D2 added `fireescape`) and hq-terrain's "fountain stands in the
water" on Downtown. Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): the slab from below, the piers, the rails, the
headroom under a truck, the fire escape's 7 m against the pier.

## SKATEBOARDING rev 4 — THE STICK, THE CROUCH POP, AIR CONTROL, THE COMBO CARD (2026-09-19, local delivery)
The user: "impossible to move after I jump because WASD is used for tricks — click and drag for tricks like a hit stick;
WASD still steers in the air; hold SPACE to crouch, release to jump, a meter for the max; a long line's points get cut
off; make it fun, add juice." three-renderer.js "SKATEBOARDING — THE RIDER": **THE STICK** — on the deck the mouse
buttons are the trick stick (`_hqRideStickDown / Move / Up`, read in `H.onMouseDown` / `onMouseMove` BEFORE the strike
and the camera): a button held in the air accumulates the mouse travel and at `flickPx` the flick's DIRECTION fires the
trick (`_hqRideFlickDir` → `_hqRideFlick`; the accumulator resets, a second flick chains) — LEFT ← → ↑ ↓ = kickflip ·
heelflip · front flip · backflip, ↖ ↗ corkscrew, ↙ ↘ VARIAL kick / heel (new, the deck spins as it flips); RIGHT ← → =
180s, ↑ NOSEGRAB / ↓ indy grab (grabs are timed tricks). On the ground the travel is thrown away and the mouse aims;
there is NO strike from the board. The arrows + SHIFT still fire the flips / a grab for a keyboard-only rider. **AIR
CONTROL**: in the air A / D turn the heading (`airTurn`, the camera follows), W / S nudge the speed (`airAccel`) —
never a trick. **THE CROUCH POP** (`_hqRidePop`): SPACE held on the ground charges `R.crouch` over `crouchS` (the body
squats, the `charge` beat feeds THE METER `#hqOllie` — map.js `_hqOllieMeter`, gold + MAX at the top, red past
`crouchMaxHoldS`); the RELEASE pops `ollieTapV` → `ollieMaxV` by the charge; a release inside `popPerfectMs` of the top
= PERFECT POP (`tricks.pop` on the line, a flash). The rev 2 held boost is retired (`ollieHoldS` / `ollieHoldAcc` are
dead keys in the table). **THE COMBO CARD** (map.js `_hqComboCard` / `_hqComboChips`, CSS `.hq-trick-head` /
`.hq-trick-list`): the score pops on every add, the tricks are WRAPPING chips (repeats fold to ×n, the oldest past
nine to "+n MORE" — nothing clips), a banked line wears its RANK (`HQ_SKATE_RULES.ranks`). **THE JUICE**: the landing
squashes the body by the fall (`R.squash` / `R.landK`), a dust puff, a camera dip (`_hqRideCamDip`); four new cues
(audio.js `skateCharge` / `skatePop` / `skateTrick` / `skateSick`). The table keys are in data.js `HQ_SKATE_RULES`
(`flickPx` is the one to tune if flicks fire too eagerly). `npm test` runs hq-skate.test.js (29). Unseen live (RULE
#1c): the flick threshold at a real mouse, the meter's spot, the squat on the cast rigs, the dip's size.
**rev 4b (same day)**: THE CROUCH HOLDS FOR EVER (no deflate; `crouchMaxHoldS` retired), ONE TRICK PER FLICK
(`flickCoolMs` — the stick's travel is discarded for 220 ms after a flick fires), THE FIT (`_hqRideFitMs`: a rotation
started in the air is sped up to end inside `trickFitShare` of the air left, floored at `trickFitMin`; too little air =
REFUSED with the `late` beat, never a bail — `_hqRideAirLeft` is the ballistic estimate off `_hqSurface`; a queued trick
carries its fitted ms) and THE TUCK (`R.grabTuck` / `R.deckTuck` pitch the body + the deck on a grab). hq-skate.test.js (30).

## AREA CONTENT PLAN D3, FIRST DELIVERY — SHASTA · THE NORTH POLE · OLYMPUS TO THE CAVE'S STANDARD (2026-09-19, local delivery)
Three of the six areas the user sees first (`AREA_CONTENT_PLAN.md` §5 D3; §7 has the log), re-specced in data.js `HQ_AREA_SPECS`
(`prebuilt_shasta` / `prebuilt_olympus` / `prebuilt_northpole` — never hand-edit the generated `site_<id>_<part>`; the spec is the
edit) and measured clean on ALL of R1–R8 by `node check-area-content.js --rules <room>` (0.73 climb rows per 100 m², 5–6 kinds,
ranges 7–10 m, at most one door exposed, 2 of 3 exits earned on Shasta and Olympus (the village's is the hearth), every one teased, a `parti` + `typology`, ≥ 1 item per 60 m²). THE
PATTERN for the seventeen still to do: every tier reached TWO ways (a stair AND a rope / a trail AND the hand-holds), a `climb`
row per tier where it fits the place, the seam's door ON a tier (`y` on the link END — `hqLinkDoors` copies it: `woods_shasta.b`
4.4, `heaven_olympus.b` 3.0 on the west wall, `northpole_camelot.a` 2.2, `northpole_haunted.a` 1.0 on the west wall), a DRAUGHT
where the lore has a hidden way (`links.shasta_lemuria`, `secret: true` — THE SLOPES' west wall ⇄ THE CRYSTAL CITY's north wall;
the pruned plain door `shasta_agartha` stays pruned, hq-areas pins it), the tape's weenie seen from the tier under it, a `deck`
wearing `over: true` for a level span between two tiers (Olympus's cloud bridge), `float: true` stepping stones, 40–50 items a
room (`grove` regions + `scatter` rows + props). **RULES THE COMPILER TAUGHT**: (1) a `climb`'s line stands ≤ 0.3 m OFF its mass —
`hqTerrainClimbs` scans the head from `climbMount` (0.3) in and breaks on the FIRST flat step, so a rope 0.6 m short of a rim reads
a flat head and is DROPPED (rise < 0.9) — silently in the vm sandbox: read `hqTerrainInfo(id).climbs` after authoring, never trust
the row count; (2) a climb's foot stands OFF its tier (a hand-holds row on the tier's own top is 3.6 → 3.6, dropped); (3) a lava
/ deep pool the walker never enters takes a SHALLOW bed (0.55) AND clear ground round its bank — a dry pocket between the sheet
and a plan's cloud bank is a trap the compiler cuts a rescue ramp out of; `gen.open: [{ x, z, r }]` on the spec's plan clears it.
`hq-climb.test.js`'s looks pin reads seven (D2's `fireescape`). Ship data.js to R2 AND Render. Unseen live (RULE #1c): all of it.

## THE PARTY — TWO SHIFTS, THE HEALTH THAT CARRIES, FIELD MEDICINE (the JRPG party, 2026-09-19, local delivery)
The user: "a party like a standard JRPG — the units you have unlocked are on call / off duty; four including yourself on
FIRST SHIFT (sent out first), four more on SECOND SHIFT (switching in and out during battle), eight in all; encounters in the
explorable areas do not respawn; health carries over between encounters; heal the party from the pause menu with their heal
spells; no levels / XP yet." **THE RECORD** (data.js "THE PARTY", the block after `hqEncounterWakeRoom`; `HQ_PARTY_RULES` =
the numbers: `roster` 8 = RESERVE_RULES.roster, `shift` 4 = RESERVE_RULES.deploy, `lossRestore`, `restRoom` / `restCounter`,
`healKinds`, `itemKinds`, `officerRace`): `door.hq.party = { v, at, seq, members }` — **THE ORDER IS THE SHIFT**
(members[0..3] FIRST SHIFT = the board, [4..7] SECOND SHIFT = the bench), member 0 is THE OFFICER (`you: true`: the mirror's
look → a Homosapien in the creator's clothes, the barbershop's race pick, else the DOOR Agent; never relieved, never moved),
a member `{ id, cls, name, meta { race, gender, secondaryJob?, customSpells?, zodiac?, appearance? }, loadout, hp, hpMax,
mp, mpMax }` with **`hp === null` = FULL and `hp === 0` = DOWN** (a KO stays down until a revive or the ward). LOCAL like the
punch clock (nothing on `state`, nothing relayed — RULE #2). Reads: `hqPartyRecord` / `hqPartyShifts` / `hqPartyVitals(m,
unit)` / `hqPartyFit` (`ready` = anyone fit) / `hqPartyOnCall` (the unlocked not on the books; `hqPartyUnlocked` = the
account's `unlockedUnits`, the starters offline, the 3D-only rule, `_DEV_UNLOCK_ALL`). Writes (pure over the profile handed
in — THE CALLER SAVES ONCE, map.js `_hqPartyTx`): `hqPartyEnsure(profile, { last })` (THE SEED: the officer + the last
roster one vessel per race, else the officer + three starters), `hqPartyEnlist(profile, { race, gender, cls })` (the first
free slot; one vessel per race; `full` / `dup` / `locked`), `hqPartyRelieve`, `hqPartySwap(profile, a, b|index)` (a shift
change is a swap across the line; an empty slot = to the end of the order; slot 1 refuses), `hqPartyRestore` (THE COT),
`hqPartyAfterMatch(profile, { won, units: [{ partyId, hp, maxHp, mp, maxMp, dead }] })` (THE COMMIT: a dead body is DOWN; a
loss with `lossRestore` wakes the party treated). **THE LAUNCH**: `hqPartyForLaunch(profile)` = the fit of the first shift,
then the fit of the second (a downed member stays home, the bench steps up), each member's vitals + id on its identity
(`meta.hp / hpMax / mp / mpMax / partyId`) — map.js `_hqPartyLaunch()` is `_hqEncounterStart`'s party source (the last
roster stands in only without a profile), `_hqEncounterFire` refuses a strike when nobody is fit (THE PARTY IS DOWN toast);
`_msConfirm` peeks the party BEFORE the reserves block: a party encounter is a RESERVES match (`state.reserves`, roster 8 /
deploy 4, the Gauntlet plumbing) with **`state.noRespawns = true`** (map.js `defeatUnit` sets `_respawnIn = null`; a fallen
seat is filled the Gauntlet way — the replacement modal / the AI's healthiest — `_gauntletQueueReplacement`'s gate reads
`state.noRespawns && _benchOn()`; reset beside `state.reserves` at every site), the enemy is the native's group at the
encounter's team size (P2 truncated after the draw), and the human seat is EXACTLY its members (`party.exact` — never padded;
`window._ewPartySlots` caps `repairPartyBuilderState`'s pad for that build only). map.js `createUnit` reads
`identityOverride.hp / hpMax / mp / mpMax` LAST (after the gear tops the max off), scaled to the build's own max, never under
1; state.js `repairPartyBuilderState`'s whitelist keeps `partyId` + the four. battle.js's commit gathers the human seat's
bodies (`state.units` + `state.bench[seat]`), maps each unit's index to `state.partyMeta[seat][i].partyId` and calls
`hqPartyAfterMatch`; the result carries `party` (the return toast reads it: n DOWN / THE PARTY WAS TREATED). TDM's
`wipeout` win condition ends a no-respawn fight; the round cap still decides by kills. **THE PAUSE MENU · PARTY** (map.js
`_hqPausePartyHtml` / `_hqPauseMemberHtml` / `_hqPartyAct`; `_hqPause.member` is a member ID now, `arm` = the armed action,
`msg` = the one-render result line — the HQ toast sits UNDER the pause overlay): FIRST SHIFT · SECOND SHIFT as four-slot
grids (a card wears HP / MP bars off `hqPartyVitals`, a DOWN stamp, YOU), ON CALL with ENLIST ♂ / ♀, the member sheet's DUTY
row (⇄ SWAP SLOT arms a swap — pick a card / TO THE END OF THE ORDER; RELIEVE OF DUTY), **FIELD MEDICINE**: USE on a heal /
healAll / selfHeal / revive row (`hqPartyFieldSpells`; `hqPartyFieldTargets` = the rule; `hqPartyCast(profile, units,
casterId, spellId, targetId)` — the battle's own arithmetic without the board: `(base + healBonus) × supportScale(the
recipient's level)`, the low-HP rider, `selfHealPct` / `revivePct`; the caster's OWN MP) and USE on a potion chip
(`hqPartyUseItem`: healPct / mpPct of the target's max, one fewer in the owner's pocket). **THE COT** (Medical, counter `cot`,
a by-id panel → `[data-party-rest]` → `window._hqPartyRest` → `hqPartyRestore`): the free inn. The console's crossings keep
THE LAST ROSTER (the forge); the party is the encounters'. `npm test` runs `hq-party.test.js`; hq-encounter.test.js's two
result-literal pins read `party: partyRes`. NOT built: levels / XP (the user's call), a synced party (D5-style union), the
party in the forge / a console crossing, gear or spell editing from the sheet (the forge still owns loadouts), a flee verb.
UNSEEN LIVE (RULE #1c): the two grids at the pause frame's width, the armed card's glow, the replacement modal firing in a
no-respawn TDM, the enemy's size against a five-man launch, the carried HP on the first frame, the cot's panel.

## THE PAUSE MENU BACK + SKATEBOARDING rev 5 — HOLD TO JUMP (2026-09-19, local delivery)
**THE BLANK PAUSE MENU**: the party upload dropped map.js `_hqPauseHeadHtml` / `_hqPauseNavHtml` (the
overlay's title + vitals row and the command column) while `_hqPauseRender` still called them — a
ReferenceError on the first line, nothing landed. Both are back (before `_hqPausePartyHtml`), and the
render is FAULT-TOLERANT now: each section (head · nav · party / member · officer) renders inside its own
try, a throw prints a DID NOT RENDER plate naming the error instead of a blank frame. hq-pause.test.js
guards that every `_hqPause*Html` / `_hqParty*` the menu calls is defined. **SKATEBOARDING rev 5** (the
user: "change the jumps back to a normal jump with holding it to jump bigger; no crouch and release"):
rev 2's HOLD TO JUMP is the rule again — the PRESS leaves the ground at `ollieTapV` at once, SPACE held
keeps lifting `ollieHoldAcc` for `ollieHoldS` (the air branch), a tap ≈ 0.6 m, a full hold ≈ 1.65 m;
`_hqRideAirLeft` counts the lift still to come from a held jump, so a flick thrown on the way up is judged
against the jump it will be. The rev 4 crouch / `_hqRidePop` / the `#hqOllie` meter / PERFECT POP are
retired (the function and the element stand unused; `ollieMaxV` / `crouchS` / `popPerfectMs` are dead
keys in `HQ_SKATE_RULES`, `ollieHoldS` / `ollieHoldAcc` live). hq-skate.test.js's crouch test is the
hold test. `npm run test:quick` + hq-skate / hq-pause / hq-party green. Unseen live (RULE #1c): the
pause frame with the party grids, the hold's feel at 60 fps.

## AREA CONTENT PLAN D3, SECOND DELIVERY — THE BOWL · THE GROUNDS · THE DECK to the cave's standard (2026-09-19, local delivery)
The other three of the six areas the user sees first (`AREA_CONTENT_PLAN.md` §5 D3; §7 has the log and the numbers), re-specced in
data.js `HQ_AREA_SPECS` (`prebuilt_stadium` / `prebuilt_haunted` / `prebuilt_derelict` — the spec is the edit, never the generated
`site_<id>_<part>`) and measured clean on R1–R8 by `node check-area-content.js --rules <room>`, solved by `node check-terrain.js`
(every door from every door, no trap, no rescue ramp). **THE BOWL**: the bay door stands ON THE CONCOURSE (the south stand, 3.4 —
`siteRooms.entry.prebuilt_stadium.door.y`, Hell's-pit precedent: an entry door may carry `y`), THE PRESS BOX moved onto the north
stand (the `findSpots` pin moved with it), three GANTRIES (`deck` + `over: true`) join the stands at the corners, THE SERVICE ROAD (a
`path` ring + `gen.open` corner circles) keeps the ground behind the stands from being a pocket, and THE PITCH DRAIN =
`links.stadium_sewers` (`secret: true`, route `sewers`, the sewers' east wall z 14) is the earned exit — a draught still names a
catalogued `leaf` (`hqLinkLive`'s wear rule) or it is held. **THE GROUNDS**: the porch at 1.6 (the `house` door ON it), the crypt a
block, the coach house, the treehouse, the terrace, the footbridge. **THE DECK** (62 × 50): the airlock ON A TOWER (3.2), the sensor
mast, the engine bell, THE GANGWAY over the breach, and **THE CARGO HATCH** — a plain door pair wearing `secret: true` between the
deck's east wall and the hold's west wall (hq-floors.test.js counts TEN secret doors now — a pair is two). **THREE RULES FOR THE FOURTEEN AREAS STILL
TO DO**: (1) **a climb's LINE stands 0.3 m INSIDE the tier's nominal edge** — the face rises from the edge inward over ~0.5 m and
`hqTerrainClimbs`' head scan (from `climbMount` in) breaks on the first flat step, so a line 0.6 m outside a rect's edge is DROPPED
without a red (fifteen of twenty were); read `hqTerrainInfo(id).climbs` / the audit's `climbs` column, never the row count; (2) on a
TWO-door room the audit's median sill is the HIGHER one, so a tier door is never earned there — the third door (a draught) is what
makes the concourse and the airlock count; (3) a stair needs L ≥ 2.2 × h (the west / east stands' were too steep). Ship data.js to R2
AND Render. UNSEEN LIVE (RULE #1c): the concourse arrival and the drop to the pitch, the gantries from below, the raised porch's
steps, the tower's stair against the bulkhead leaf, the two draughts' slabs, every prop on a tier (`y` is the edit).

## LIVE COMBAT IN THE AREAS — the plan (2026-09-19, docs only)
`LIVE_ACTION_PLAN.md` is THE doc for the Skyrim-style live combat the user asked for
(dual-wield the seven spells, LEFT / RIGHT click per hand, a roll, a middle-click
weapon wheel, a HUD health bar). Read it before building any of it. The rule it
sets: live combat is a SECOND SMALL RESOLVER (THE LIVE ENGINE, a walker mode like
the ride) that reads the same spell ROWS and applies them to real-time ACTORS in
`H.chars`, reusing only the pure math (`computeSpellBase`, `getTypeDamageMultiplier`,
`STATUS_DEFS` fields) and the VFX through the forge stage's `VFX3D.stage` route with a
ground callback — never `doSpell` / `applyDamageToUnit` / `state`. A tile is 1.75 m:
`range × 1.75` = reach, `(aoeRadius + 0.5) × 1.75` = the blast radius, a cooldown
round = 2.5 s. §2.2 maps every kind class to a live delivery; §4 lists the decisions
the user owns (the roll key, the wheel's bind gesture, live vs tactical toggle,
followers). Nothing built; VS-CPU only (RULE #2 has nothing to relay).

## THE Δ AREA PASS — every site Δ is a cut of its entry part + THE AREA BOARDS (a Δ per explorable part) — 2026-09-19, local delivery
The user: "revise the delta maps to look more like their corresponding explorable areas, then make delta maps for the
explorable areas that don't have delta maps yet". **The 38 site Δs** (data.js DELTA FORGE `_MF_DELTA_BUILDERS`) are cuts of
their ENTRY PART (`siteRooms.entry` → the room the bay door lands in): the part's sheets as board keys, its features in the
forge's vocabulary (plateau = step / block, stream = a wade, deep pool = deep water, deck = a `bridge` tile, wall row = a thin
wall, the weenie = the +3 block / the monument), its props as torches / greytubes / cargo; the desc names the part. Reread the
room's spec before retuning a board. **THE AREA BOARDS**: `_MF_AREA_DELTA_BUILDERS[roomId]` (the block after the site boards)
= 56 Δs, one per complex part that is not an entry part; `_mfRegisterAreaDeltas()` (after `hqReplateDoors()`) files each as
`PREBUILT_MAPS[<roomId>_delta]` + a layout + an EW_MAP_META row wearing **`area: roomId` + `site`** (`_mfAreaDeltaEnv`: the
site's Δ env minus `near` / `motion`; a CLOSED part indoors — `world.kind 'room'`, no stars / nebula / roster; an OPEN part
under its site's sky, `world.sea` dropped; the room's `look` as `env.look`). Reads: **`hqAreaDeltaId(roomId)`** (the part's
board or null — the ONE read), `hqSiteId('<roomId>_delta')` → the room's SITE (the pool, the checklist, the stamp, the site
file), `hqEncounterLaunch(...).launchId` / `.area` → map.js `_hqEncounterStart` fights the part's own board and `_hqEncounterFire`
rasterises no field window for a room that has one (the copy: THE ROOM’S OWN BOARD). The FULL terminal lists them as Δ cards;
ranked never deals them (check-data-parity skips `area` rows; server.js MAP_POOL untouched). RULES: adding a part = a builder
keyed by its room id, nothing else; delta-maps.test.js runs every house rule on all 96 boards and FAILS when a non-entry part
has no Δ; the site count stays 38. Ship data.js to R2 AND Render. Unseen live (RULE #1c): every board — the `urban:` sheets
became the nearest board key, a closed part's Δ stands alone under a dark ceiling (§10 stage 4 draws the room round a FIELD
only), the cloud-bed boards, the `bridge` decks.

## AREA CONTENT PLAN D3, THIRD DELIVERY — THE TEMPLE CITY · THE CRYSTAL CITY · THE STATION to the cave's standard (2026-09-19, local delivery)
The first three of the remaining fourteen areas (`AREA_CONTENT_PLAN.md` §5 D3; §7 has the log and the numbers), re-specced in data.js
`HQ_AREA_SPECS` (`prebuilt_technoticlan` / `prebuilt_agartha` / `prebuilt_antarctica` — the spec is the edit, never the generated
`site_<id>_<part>`) and measured clean on R1–R8 by `node check-area-content.js --rules <room>`, solved by `node check-terrain.js` (every door from
every door, no trap, no rescue ramp). **THE TEMPLE CITY**: THE PYRAMID's back stands AGAINST the north wall (the strip behind it was a pocket),
THE OTHER STAIR up its west flank, THE AQUEDUCT = a `deck` wearing `over: true` from THE PRIEST HOUSE to THE MARKET TERRACE over the waded canal,
THE LEY TERRACE with `babel_technoticlan.b` ON it (`y: 2.0`; x −5 kept — hq-leylines pins it), XIBALBA = a draught. **THE CRYSTAL CITY**: THE
GALLERY span from THE UPPER TERRACE (3.6 now — a slab needs 1.95 m of headroom over the lower terrace or it is a wall to the body beneath) to THE
BALCONY, THE ADIT TERRACE with `cave_agartha.b` ON it (`y: 2.4`), THREE DRAUGHTS come out here on the NEW dashed **`routes.hollow` · THE INNER
EARTH** (`antarctica_polar` + `technoticlan_agartha` — new ids; the pruned plain doors stay pruned, hq-areas pins them). **THE STATION**: THE HULL
(3.0) on the north wall with the collar ON it (`antarctica_derelict.a` `y: 3.0`), THE ICE SHELF, THE DRILL RIG, the crevasse's bed 0.55 m (the
canal rule), the polar draught. **THE RULE**: a `climb` row's **`face` is the direction TOWARD THE MASS** (`hqTerrainClimbs`: face 0 = the tier is
north of the line, 180 south, 90 east, 270 west); the first draft had every north / south face inverted — read `hqTerrainInfo(id).climbs` back
against the rows. Two pockets joined with `path` rows, never rescue ramps. hq-cave.test.js's far-lane crowding compares north-wall doors only (a
side-wall draught has no `x`). Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): all of it — DOOR_HQ_BUILD_PLAN §9's entry lists what to
eyeball first. NEXT: Mars, the Moon, the Grove.

## THE COMBAT FIXES — solid highlights · the mode holds · the beam heading · the Door Agent's one-click kit · no hover wash while the camera flies (2026-09-19, local delivery)
Five of the user's combat notes. **SOLID HIGHLIGHTS**: three-renderer.js `HL_OPACITY` / `HL_FILL` /
`HL_OPACITY_MAP` / the move-tile recipe in `_getSharedHlMat` / `_OVERLAY_STYLE` were all lifted ("THE
SOLID PASS" comments) — the range washes were a 13 % lattice, they are ~36 % plates now, the move tiles
~46 %; the three tiers keep their order. Restyle there, never per site. **THE MODE HOLDS** (battle.js
`clickTile`): an incompatible click while a verb is armed — out of range, wrong team, no effect, a unit
under a move / jump click — is a beep and a log line and NOTHING else: the mode, the selection and the
range stay up (it used to `_exitModeAndShowUnitMenu` / `selectUnit`, which dropped the highlights). Two
latch bugs fixed on the way: the bare `return doMove(…)` and the "No route onto that surface" branch left
`state._actionExecuting` true, so a refused walk hid the move range and ate the next click (`_execMove`
wraps it now). **THE BEAM HEADING** (Chemtrails "hits 0 targets in a line"): battle.js
`lineSpellHeadingTo(spell, fromX, fromY, fromZ, tx, ty)` (right before `getSpellRangeTiles`, on `window`)
walks the eight rays exactly as `_applyLineDamage` does (range cap, impassable, LOS, the wide beams' lanes;
no boring) and answers the heading whose spine or lane holds the target, else null. `doSpell`'s line branch
reads it (a human's click on a tile no ray reaches is refused BEFORE MP is spent; the AI keeps the old
`Math.sign` snap), `_spellGlowTiles` reads it, and hud.js's enemy quick menu `beamRayHits(sxx, syy, szz)`
reads it — the menu used to offer a beam whose ray the LOS walk stopped short of, and the cast took
`Math.sign` of the click, so an enemy at (+3, +1) got a diagonal beam that missed. Never aim a beam with
`Math.sign` again. **THE DOOR AGENT, ONE CLICK**: Knock Knock places the FAR door where you click (any free
tile within 4 you can see) and the NEAR door beside you (`_doorNearSpot(unit, far)` = the free adjacent tile
nearest the far one); `DOOR_RULES.pairRange` / `minGap` and the `_spellPick1` tile pick are GONE (online.js's
door block emits every click; `pickX / pickY` ride null). A click on your own door still toggles it. Special
Delivery flies out of ANY of your open doors (the nearest that reaches the target within 3 with LOS —
`_doorOriginForSpell`; `doorRange` is gone). **THE GREYING**: `hasSpellTargetInRange` has door branches now —
`door` / `doorSlam` are castable when `getSpellRangeTiles` (→ **`_doorRangeTiles`**: free tiles + your doors ·
your open doors in reach · the delivery zones round your doors · the tiles beside them) is non-empty;
`doorDelivery` / `doorExit` when an enemy a door of yours reaches exists; `doorBreach` / `doorTrap` sit in the
plain single-target list. `_getSpellValidTargets` lists door-reached enemies for Delivery / EXIT and NO unit
for Knock Knock / Slam (the board is their drum); ui.js paints the door tile sets as placement reach. The
rows read their rule (data.js descs, hud.js parts / labels, the aim prompts). ai.js picks the far tile only.
door-race.test.js pins the new delivery rule, the near spot and the reach. **NO HOVER WASH WHILE THE CAMERA
FLIES**: battle.js `isCameraAutoMoving()` (beside `stopBoardCameraAnimation`; on `window`) = a path tween /
`_busy` / a cine shot / a 2D cinematic / the encounter's seeded ease; `updateEnemyRangePreview` returns while
it is true and three-renderer.js `_syncEnemyRangePreview` folds it into its signature so the wash comes back
when the camera lands. Unseen live (RULE #1c): the plate opacities against the busiest sheets, the
one-click door pair's near spot on a crowded flank, the greyed rows' reasons, the wash's return timing.

## AREA CONTENT PLAN D3, FOURTH DELIVERY — CYDONIA · THE MARE · THE GROVE to the cave's standard (2026-09-19, local delivery)
Three more of the fourteen (`AREA_CONTENT_PLAN.md` §5 D3; §7 has the log and the numbers), re-specced in data.js `HQ_AREA_SPECS`
(`prebuilt_mars` / `prebuilt_moon` / `prebuilt_bohemian_grove` — the spec is the edit, never the generated `site_<id>_<part>`) and measured
clean on R1–R8 by `node check-area-content.js --rules <room>`, solved by `node check-terrain.js` (every door from every door, no trap, no rescue
ramp). **CYDONIA**: two mesas joined by THE ARCH (a `bridge` over the canyon floor, the plaza under it), the pyramid's two tiers, the collar ON
the rover bay's mesa (`mars_derelict.a` `y: 2.6`), the Face moved over the west crater (the pin moved), and **THE FACE'S MOUTH** =
`links.cydonia_mare` (`secret: true`, route `lunar`) ⇄ **THE FAR SIDE** in the Mare's west wall (the pruned `mars_moon` stays pruned; a
draught wears a new id). **THE MARE**: the collar ON the terrace (`moon_derelict.a` `y: 2.4`), THE CATWALK (a `bridge`) to the antenna platform
under the rim's tape (the tease), the lander's pad, the habitat's shelf, the dish, the overlook. **THE GROVE**: the owl's gate ON THE WEST
TERRACE (`woods_grove.a` `y: 2.2`), the treehouse, the log over the creek, the dock, the camp, and **THE MEMBERS' TUNNEL** =
`links.grove_lodge` (`secret: true`, route `ranch`) into the Lodge's east wall; four redwoods screen the terrace's sightlines (R3). **THE RULE
THE SOLVER TAUGHT**: the strip between a tier's cliff and a plan's rock bank is a pocket (a rescue ramp was cut on Cydonia until `gen.open`
forced the plan open along the mesa's north face) — read `RETURN:` on every room. The suites were not run at the user's word (`npm run
test:quick` passed; the two tools solved and audited the three rooms). Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): all of it — the
arch and the catwalk from below, the collars on their tiers, the four redwoods on the terrace's sightlines, the tents' light.

## AREA CONTENT PLAN D3, FIFTH DELIVERY — THE GARDEN · THE HALLS · THE HORIZON to the cave's standard (2026-09-19, local delivery)
Three more of the fourteen (`AREA_CONTENT_PLAN.md` §5 D3; §7 has the log and the numbers), re-specced in data.js `HQ_AREA_SPECS`
(`prebuilt_lookingglass` / `prebuilt_lodge` / `prebuilt_singularity` — the spec is the edit, never the generated `site_<id>_<part>`) and measured
clean on R1–R8 by `node check-area-content.js --rules <room>`, solved by `node check-terrain.js` (every door from every door, no trap, no rescue
ramp). **THE GARDEN**: the two towers joined by THE HEDGE WALK (a `bridge`), the moon's perch seen from the bishop's landing, the mirror and the dead
tree under the tiers. **THE HALLS** (h 5.0): two galleries over the round table joined by THE MINSTRELS' WALK, THE HIGH TABLE (3.9) between them out
of a jump's reach (the tape pin moved to (0, −15)), THE SCREEN across the sanctum's mouth, the mezzanine over the bar that sees the painting, THE
WINE CELLAR; `grove_lodge.b` → `e z 14`. **THE HORIZON**: THE DROP is a real 4 m bowl, the two lenses joined by THE LENSING ARC, THE JET a `float`
shard, the screen ON THE OBSERVATORY LEDGE (`observatorium_singularity.b` `x 14, y 2.4`). **TWO RULES**: (1) a `dip`'s `h` is its DEPTH — positive
(the old Singularity drop `h: -4` was a mound); (2) a climb's `face` is the direction toward the mass in the room's AXES (0 = −z, 180 = +z, 90 =
+x, 270 = −x) — read `hqTerrainInfo(id).climbs` back. Remaining in D3: Saturn, Hollow Earth, the Dutchman's deck (the Flatlands and the Backrooms
are skipped at the user's word). Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): all of it.

## AREA CONTENT PLAN D3, SIXTH DELIVERY — THE HEXAGON · THE INNER SUN · THE MAIN DECK to the cave's standard; D3 COMPLETE (2026-09-19, local delivery)
The last three areas (`AREA_CONTENT_PLAN.md` §5 D3; §7 has the log and the numbers), re-specced in data.js `HQ_AREA_SPECS` (`prebuilt_saturn` /
`prebuilt_hollow_earth` / `prebuilt_revenge` — the spec is the edit, never the generated `site_<id>_<part>`) and measured clean on R1–R8 by `node
check-area-content.js --rules <room>`, solved by `node check-terrain.js` (every door from every door, no trap, no rescue ramp). **THE HEXAGON**: THE
EYE a real bowl, the collar ON THE DOCKING SHELF (`derelict_saturn.b` `y: 2.4`), the drop's frame ON THE RIM WALK on the WEST wall
(`saturn_singularity.a` → `w z −14 y 4.2`), THE RING PLANE span, THE EYE WALL (the hexagon's north segment at 4 m) + THE OUTER TOOTH on the
sightlines. **THE INNER SUN**: the spire r 3.9 on a terrace moved to (0, −13) (the pin moved), the mouth ON THE CRUST LEDGE (`cave_hollow.b`
`y: 2.2`), THE ROOT span, THE GIANT'S STEPS up to THE OVERHANG, and **THE POLAR OPENING** = `links.hollow_byrd` (`secret: true`, route `hollow`) ⇄
the station's east wall (its EAST PRESSURE RIDGE is 2.2 m now). **THE MAIN DECK**: 64 × 52 (R7), THE POOP over THE QUARTERDECK with **THE
CAPTAIN'S SKYLIGHT** — a secret door PAIR `skylight` (the deck's west wall `y: 4.4` ⇄ the cabin's south wall; hq-floors counts TWELVE secret doors,
hq-dutchman reads the pair), THE MIZZEN column, THE GANGWAY span to THE BOAT DECK, THE CROSSTREES under THE MAINTOP. **THE RULES**: (1) the
audit's R3 line of sight reads the height field, `wall` rows, the plan's solid and `tree` / `grove` rows — NEVER props; break a sightline with a
wall, a tree row, a mast column or a cliff; (2) read every pocket off `hqTerrainInfo(id).rescues` (x / z / cells) and kill it with a `gen.open`
circle or a `path` to the floor — stop at zero rescue ramps; (3) a floating stone's column is a wall in the field: open the ground round a
stepping-stone chain. The Flatlands and the Backrooms are skipped at the user's word; the slow suites were not run. Ship data.js to R2 AND Render.
UNSEEN LIVE (RULE #1c): all of it. NEXT: D4, THE DOOR PASS over the complexes; then D5.

## THE WORLD OVERVIEW — the directory reorganised round the hubs + THE ESTATE (2026-09-19, local delivery)
The user, with a reference sheet: "make the map / directory more organized — the main hubs / nodes should be DOOR HQ, The
Woods, The Estate (rename the ranch), The Cavern, The Deep, The D.U.M.B. …". The directory (M, the kiosk, the pause menu)
opens on **THE WORLD** now: data.js **`hqWorldOverviewGraph()`** (cached) = ONE node per PLACE — `hq` (the building: every
facility room, the rings, the car), `hub:<id>` (a `DOOR_HQ.hubs` row), `site:<mapId>` (a wild site no hub claims) —
**`hqWorldNodeOf(roomId)`** is the ONE read of a room's place; ONE edge per pair of places aggregated from `hqMapGraph`
(the strongest kind wins: `main` a door / link / lift > `way` a seam that is not a door > `secret` a draught > `bay` the
ring's thresholds; `links` / `ways` / `n` the ledger; the route's ink). **`hqWorldOverviewLayout()`** places every place
on an AUTHORED slot (**`HQ_WORLD_L.slots.hub / .site`**, units, HQ at the origin, x right, y down — tune the table, never
the code; a place the table does not name lands on a fallback ring, and hq-map.test.js fails naming it: ADDING A HUB OR A
SITE = one slot row) and lists the FLOORS (the elevator's stops top to bottom + H-WING; `hqWorldFloorOf(room)`).
**`hqWorldOverview(profile, curRoom)`** = the model: a place is `here` / `seen` (a room of it stood in) / `q` (a seen
place's door leads to it) else off the sheet; rooms seen / total; edges `st` + `charted` (a link walked, else both
places seen); `secrets` = the graph's secret doors found / total. map.js "THE WORLD OVERVIEW" (before `_hqMapHtml`):
`_hqWorldSvg` (the building a BLOCK with a band per floor — `data-mapnode="w:floor:<room>"`; a hub a ringed node with a
glyph from `_HQ_WORLD_GLYPHS`; a lone site its number; OCTILINEAR lines — `_hqWorldRoute`, a 45° run then straight; the
bay threads only for the place picked), `_hqMapLocsHtml` (the LOCATIONS rail: the facility · THE HUBS · THE LOCATIONS,
the uncharted a count per group), `_hqMapCrumbHtml` (`MAP | WORLD ▸ CENTRAL OVERVIEW ▸ ALL LOCATIONS` + AREAS CHARTED ·
SECRETS · CLICK A PLACE TWICE TO TRAVEL), `_hqMapKeyHtml` (THE KEY), `_HQ_MAP_COMPASS`. **THE CLICK RULE**: every world
element carries `data-mapnode="w:<id>"` → `_hqMapTravel` → `_hqWorldPick`: the first click PICKS (the card: rooms charted,
GO ▸ the anchor, OPEN THE AREA MAP; the building's card lists the floors), the second on the same place TRAVELS to its
anchor. **THE AREA sheet** (`_hqMap.mode = 'area'`, `_hqMap.area` a place id; `[data-mapmode]` / `[data-maparea]`; the
WORLD / THIS AREA tabs on the bar) = `_hqAreaModel(M, place)` — the room map filtered to one place, a room outside it a
plain question mark (never a ring / the hall), the building on its own layout, every other place a RADIAL TREE round its
anchor (`_hqAreaLayout`; a room drops the place's name prefix). The reveal keeps a memory PER SHEET (`door.hq.map`:
`w / we / wbox` beside `n / e / box` + `area`) — switching sheets never replays a pop. CSS "THE WORLD OVERVIEW" in
styles-base.css (+ the HUD pass rows); the panel grid is three columns (the rail · the stage · the card; stacked under
860 px). **THE ESTATE** is the ranch's name everywhere the player reads it (`hubs.ranch.label`, `routes.ranch.label`, the
corn fields' plate, the well's plates — the ids stay `ranch`). `npm test` runs hq-map.test.js (THE WORLD OVERVIEW).
UNSEEN LIVE (RULE #1c): the sheet under the game's fonts / theme, the two-click feel, the world reveal, the rail at 860 px.

## THE POPULATION + THE ROUNDS — every area inhabited by its own, and they WALK (2026-09-19, local delivery)
The user: "each area inhabited by the proper units — they already have map tags / terrain preferences;
Disaster City and DOOR HQ the most diverse; make them walk in routed loops, even loops between doors or
areas — make the game feel more alive." **THE TAGS ARE THE ONES THE GAME KEEPS**: `DOOR_TEXT.POINT_OF_ENTRY`
(a race's home site) and the `biomes` on every `RACE_PROFILES` row against the site's `EW_MAP_META.biomes`.
data.js (the block before THE ENCOUNTER): **`HQ_POPULATION_RULES`** (the whole table — counts per m², the
clamps, `cityMul` / `hqMul`, the draw weights, the walk speed, the pauses, the away time, the ledger's TTL,
`underworld` = the sewers' own people); **`hqSiteResidents(siteId)`** = the ONE ordered read of a site's
people (its NATIVES first, then every race whose biome tags meet the site's — `tiers[race]` names the
reason —, then the natives of the sites that share a biome, then the sector's; never the agency);
**`hqRoomPopulation(roomId, profile, { perfLow, date })`** = the ONE read the renderer spawns from: the
room's KIND (`wild` / `city` / `facility`), its pool, and the EXTRA WALKERS beyond the authored `npcSpots`
(`draw: [{ id: 'hq-roam-<i>', race, tier }]`, seeded by the day + the room — the crowd holds for a day; a
wild room's first draw is always a true native; a city street draws its own · ordinary people (a `human`
type) · the other cities' natives by `cityWeights`; a facility room draws the OFFICER'S OWN ROSTER
(`hqRosterRaces`); the hall / the rings / Room 86 / the foyer wear `hqMul`, hubs.city `cityMul`; a `quiet`
room keeps one, the car none); `hqRoomFloorM2(room, roomId)` sizes it (a terrain room by its compiled
plan's open share when compiled, else an estimate per kind — NEVER a compile: a city plan is a
two-minute proof); `hqSpotRoams(roomId, si, spot)` = does an authored spot native leave its spot (never a
posed / `stay: true` / clone spot; `roam: true|false` pins it, else `spotRoamShare` by seed). **THE
ROUNDS** (three-renderer.js, the block before SKATEBOARDING): every extra walker, every roaming spot native
(its spot = its loop's FIRST stop), a `patrol: true` agent (two in the hall) and every traveller wears
`ch.rounds` and walks a LOOP OF STOPS — **THE NAV** (`_hqNavStart` / `_hqNavBuild`: a lattice of
`HQ_NAV_CELL` 0.7 m cells (coarser past `HQ_NAV_MAX_CELLS`) read through **`_hqNavQuery`** = `_hqSurface`
with the people left OUT of the blockers, built over frames at `HQ_NAV_BUDGET_MS`; `_hqNavPath` = A* on 8
neighbours, no corner cutting, up AND down ≤ the walker's step — a person takes the stair, never the cliff,
never a swim; string-pulled), **THE STOPS** (`_hqRoundsStops`: door landings, counter fronts, the spots,
the spawn, free cells), **THE LOOP** (`_hqRoundsAssign`: 2–4 stops, a door `doorShare` of the time),
**THE EXIT** (a door stop with an edge in `hqWorldGraph` — `_hqRoundsExits` — and unlocked: the leaf
swings (`rec.npcOpenUntil`, read by `_hqTickDoors`), the walker is AWAY `awayMs` (hidden, `ch.away`, its
blocker folded — the aim / E / the finds skip it), then comes back in by ANOTHER door), **THE TRAVELLER
LEDGER** (`_hqTravellers`, module-level: an exit files `{ race, gender, to, at, from }`; the far room spawns
that walker at that door WALKING IN when the officer arrives within `travelTtlMs` — follow someone through
a door and they are ahead of you). Yielding: a walker holds `yieldM` short of the officer, slows behind
another; stuck `stuckS` → one re-path, then the stop is dropped; a panel (`H.paused`) freezes everyone.
`_hqTickRounds` runs in `_hqFrame` before `_hqTickChars` (which plays the walk clip at 0.62×). A character
carries `spot` / `spotIndex` / `patrol` / `rounds` / `away` now. Nothing on `state`, nothing relayed (RULE
#2). Dev: `EW_HQ_NO_ROUNDS`, `hq.roamers()`, `hq.nav()`, `hq.travellers()`. `npm test` runs
`hq-population.test.js` (the nav + a full loop with an exit + the ledger in a vm sandbox, every wild room's
draw, the sites). UNSEEN LIVE (RULE #1c): the nav's build time in the cities (~40k queries over frames),
the walk clip's pace, the crowd's density against the frame rate (`perM2` / `cityMax` are the edits), the
landing spot's fit at wide doors, walkers on stairs and ramps.

## THE LOADING SCREEN + THE SURVEY — the freeze after the door, and the floor plans off the main thread (2026-09-19, local delivery)
The user: "when I click Play it does the door animation and then freezes — there needs to be a loading
screen there; textures / models load slowly." MEASURED (headless, `node`): a terrain room's floor plan
(data.js `hqTerrainCompile` — the automata, the reach BFS, the rescue ramps) takes **3–31 s** on a big
room (Downtown 31 s, the grid 23 s, the astral sea 18 s, the cavern 12 s; 206 s for all 77), and the finds
warm (`hqFindsWarm`, on idle after arrival) triggered it for every tape room in turn — that was the freeze;
and map.js `_hqEnter` showed the load card and BUILT THE ROOM IN THE SAME TASK, so the card was never
painted. Three rules now. **(1) THE PAINT**: map.js `_hqDeferBuild(fn)` runs the build a frame + a macrotask
after the card / the page switch (inline without rAF — scene-lifecycle.test.js's harness); on a walk the old
room HOLDS under the card through renderer `hq.hold(true)` (pause WITHOUT releasing the pointer lock — a
released lock reads as the eaten ESC). **(2) THE SURVEY**: the compile runs in a Web Worker — map.js
`_hqSurveyWorkerGet` builds a blob script = `_HQ_SURVEY_PRELUDE` (the browser stubs load-data.js's sandbox
uses) + `importScripts(<the page's own data.js URL>)` + data.js **`hqTerrainWorkerServe(self)`**; one job at
a time, the room being entered at the FRONT (`_hqSurvey(roomId, true)` — its build waits under the FULL
card: "surveying <room>… 12 s"), every other room in the background nearest-first (`_hqSurveyWarmAround`:
the rooms behind this room's doors through `hqDoorThrough`, then theirs, then the building; one hop on
EW_PERF_LOW). The record crosses as a PLAIN copy — data.js **`hqTerrainPlain(info)`** (no closures, no
`room` / `S` / `rules`, the typed arrays TRANSFERRED) — and is adopted by **`hqTerrainAdopt(roomId, plain)`**
(the room / shell / HQ_TERRAIN_RULES re-attached, `hFn` = the SAMPLED field — `hFnSampled: true`; nothing
outside the compiler reads the authored one —, the pads' doors re-pointed at the live rows by id + wall,
`_terrainInfo` defined); the worker compiles the ROOM OBJECT the page sends (`hqTerrainRoomPlain`), so a
variant compiles as the variant. `hqFindsWarm` SKIPS a terrain room whose record has not landed (the
adoption re-kicks the warm). No worker (file://, EW_HQ_NO_SURVEY, a dead import) = the sync compile under
the painted card. **(3) THE ARRIVAL WARM**: `window._hqWarmArrival()` (once per page load, from the main
menu's show and from Play) → renderer `hq.warmAvatar(spec)` (the walker's rig + the UAL libraries — the
card waits for exactly that model) + `hq.warmRoom(roomId)` (the arrival room's leaves, props, the door gun,
the shell's sheets through the same caches) + the survey worker set on the arrival's neighbours. The card's
note is live (`_hqLoadProgressStart`: the survey's clock, then `ThreeRenderer.assetsPending()` = GLB files
still in flight). RULE: never call `hqTerrainInfo` for a room the officer is not standing in from the main
thread — ask `_hqSurvey`. THE WEIGHT is the rest of the slowness and is the user's: the hall's furniture is
~100 MB of GLB (computer_chair_blue 16 MB, Wooden Door 11 MB, the door frame 8 MB, UAL1 + UAL2 16 MB) —
`gltf-transform optimize` with WebP textures at 1024 px would cut it ~5–10×. `npm test` runs
scene-lifecycle.test.js (the paint, the survey wait, the dead worker) + hq-terrain.test.js (THE SURVEY ×3).
UNSEEN LIVE (RULE #1c): the worker on iOS Safari (a blob worker importing a cross-origin classic script),
the card's clock, the hold on a walk.

## THE FINISHER ON THE CIRCUIT + THREE MORE EXECUTIONS (FINISHER_PLAN delivery 3) — 2026-09-19, local delivery
The user: "would still like to see the finishers and their animations in the party builder in the
spell tree somewhere." The forge's TECHNIQUES circuit ends in **THE FINISHER STRIP** (party-builder.js
`SpellTreePanel` → `finStrip()`, `.pb-fin` under the root's bus): ONE ☠ row — the race's execution off
data.js `FINISHERS` through **`pbFinisherDef(race)`** (= `getFinisherDefForRace`, the ONE read), in its
TYPE colour, BESPOKE (a pulsing ring) or TYPED EXECUTION (dashed); its node key is **`PB_FIN_KEY`**
('FIN'; `treeStepKey`: root ↓ = the strip, ↑ = the root), `pbTechInfo(..., finisher)` answers `st8:
'finisher'`, `TechniquePanel` hands it to **`FinisherPanel`** (type · name · tagline · brief · the price
chips · ▶ PREVIEW), and **`pbPreviewFinisher`** (hover debounced, click / ENTER / SPACE / ▶ at once) →
three-renderer.js **`EWCharViewer.previewFinisher(def)`** = the CHARGED CAST (`_castChainFor
('ultimate')`; `_cvSpellChain` takes `opts.chain` now) timed so its strike frame lands on the hit, the
frame pulled wide + tall, and **`VFX3D.stage.finisher(def, o)`** (three-vfx-effects.js, the FINISHER
PASS 2 section: `_FIN_STAGE[sig]` = the director's VFX beats on the stage frame — the hero at (0,0),
the dummy at (3,0), `P.at` = `_fxDelay`; `_FIN_STAGE_TYPE[type]` = the six apocalypse directors' beats on
one victim; `finisherTiming` = its clock). Never a slot, never a loadout write, never the relayed
`VFX3D.fire` (RULE #2). **RULE: a bespoke finisher = the director + the signature + a `_FIN_STAGE[sig]`
script** — finishers.test.js insists on all three. THREE MORE BUILT (nine of 99): homosapien **The
Haymaker** (`haymaker` / `_sigHaymaker3D` — the fist winds up, the body laps the world on a great
ring, back into the fist), cowboy **Boot Hill** (`bootHill` / `_sigBootHill3D` — the rope from the sky,
the coffin with the name plate, the lid, the cross, the tumbleweed), mad scientist **Shrink Ray**
(`shrinkRay` / `_sigShrinkRay3D` — the ring beam, the shrink, SIZE: 1/40, the ACME anvil). `npm test`
runs finishers.test.js (THE FORGE test). UNSEEN LIVE (RULE #1c): the strip under the lanes at the small
breakpoints, the wide stage frame on the monitor, each script's timing against the strike frame, the
fist's facing (`fistPivot.rotation.y`), the lid's swing, the anvil's read, the three directors' camera
paths on the real board.

## SIX MORE EXECUTIONS — Keelhauled · A Thousand Cuts · The Joust · The Trip · Neuralyzer · Mind over Matter (FINISHER_PLAN delivery 4) — 2026-09-19, local delivery
The next six `FINISHERS` rows in roster order are BUILT (fifteen of 99): pirate
`keelhaul` (`_sigKeelhaul3D` — the misc cache's `wreck` GLB sails the sky along
the line, the hook, the drag under the keel, the slam), swordfighter
`thousandCuts` (`_sigThousandCuts3D` — afterimages, slash planes at a rising
cadence, a tally SPRITE to 1000, the column into slabs), knight `joust`
(`_sigJoust3D` — a procedural charger + a lance the length of the line, the
carry to the far edge), shaman `theTrip` (`_sigTheTrip3D` — the fairy ring,
the breathing wireframe dome, the eye-motes, the library's kaleidoscope +
fractal tunnel + spectrum burst, the fold), men in black `neuralyzer`
(`_sigNeuralyzer3D` — the pen, the flash, the rewind, the darkened `cadillac`
clone that takes the body in its boot), telepath `mindOverMatter`
(`_sigMindOverMatter3D` — the eight tiles round the CASTER lifted as columns
in their own sheet via `getTerrainAt` / `TERRAIN_SPRITES`, orbited, slammed
one by one — VFX-only, the board keeps every tile). Each = a director in
battle.js `_FIN_DIRECTORS` (the first finishers to use `cineCrane`,
`cineDollyZoom` and `cineEyelids`), the signature in "THE FINISHER PASS 2"
(`_sigRunOwned` + `_fxDelay`, called inside the relayed cinematic — RULE #2),
a `_FIN_STAGE[sig]` script for the forge, a row in finishers.test.js's BUILT
table. RULE learnt: a text plane that must face the camera in that section is
a `THREE.Sprite` (`_sigDisposeGroup` keeps Sprite geometry; there is no camera
accessor in the VFX file). Smoke-tested in a scratch stub-THREE harness (every
tick of every signature; not a render). UNSEEN LIVE (RULE #1c): FINISHER_PLAN
§7's delivery-4 entry lists what to eyeball first — the wreck's heading, the
tally's size, the charger, the sedan's tint, the tile sheets, the six camera
paths.

## THE DESKTOP LOAD PASS — THE RIG LANE, THE SFX FAILURE MEMO, THE CDN CACHE (2026-09-20, local delivery)
The user: "loading textures really slowly after the iPhone session". MEASURED: the mobile pass (2026-09-18)
changed nothing for a PC in Auto / High — every renderer / post change is behind `EW_PERF_LOW` (a PC that
shows LOW in Settings → Performance gets one model at a time, 512 px model textures, sprite units and 30 fps:
click HIGH). What the same day DID add for everyone: THE POPULATION (2–12 extra rigged GLBs per room) and THE
ARRIVAL WARM (a whole room of props fired at once), both sharing the connection with the walker's own rig —
the file the HQ load card WAITS for. And the CDN: `curl -I` shows every object under `Assets/` and `music/`
(and any dashboard-uploaded js / css) is `cf-cache-status: DYNAMIC` with NO `cache-control` — R2 caches per
OBJECT, only the wrangler-uploaded files carry `max-age=31536000`; every player pulls textures and 16 MB
GLBs from origin, and the browser only guesses freshness (10 % of the file's age — a GLB uploaded yesterday
is re-validated within hours). **THE RIG LANE** (three-renderer.js, beside `_scheduleModelLoad`): a URL
marked by `_rigLaneMark` (the avatar's model + animation libraries — `hq.warmAvatar` and the player's
`_hqSpawnCharacter` mark them) starts at once; while any marked file is in flight every other model request
(`_loadUnitGLB`, `_loadMiscModel` — both hand their `url` to the scheduler now) is HELD and released
TOGETHER when the rig lands (a flush, never the phone's serial queue; a 12 s safety flush covers a stalled
file). Kill-switch `EW_NO_RIG_LANE`. **THE SFX FAILURE MEMO** (audio.js `_sfxFailed`): a cue that failed
twice in a row backs off 60 s instead of a fetch per play. **deploy.js** uploads with `--cache-control
'public, max-age=31536000, immutable'` (js / css are `?v=`-busted; a renamed asset is its own bust). THE
USER'S ACTION (the biggest win, no code): a Cloudflare Cache Rule on `cdn.entropywars.net` — Eligible for
cache, Edge TTL 1 year (ignore origin), Browser TTL 1 year — or `wrangler r2 object put --cache-control`
on the asset folders. mobile-performance.test.js has the lane + the memo (its "every replacement MP3" test
fails at HEAD because `mobile-audio/` was never committed — pre-existing). UNSEEN LIVE (RULE #1c): the
card's wait on a cold cache with the lane, the flush's burst of requests after the rig.

## THE BLACK BUILDING — THE RETRY, THE BACKGROUND LANE, THE MENU'S DOOR FIRST (2026-09-20, local delivery)
The user: "the door frame is always missing from the title screen, the rotunda stairs have no texture …
everything is just black". MEASURED (a scratch Playwright probe against the REAL CDN through the egress
proxy — `shots/.cdn-cache` keeps the files; the CDN is reachable and serves `access-control-allow-origin`
for the play origin `entropywars-prototype.onrender.com` with `vary: origin`, the edge keys on Origin, every
live script matches the repo byte for byte): (1) the menu's door leaf landed 70 s in, behind the 28 GLBs
THE ARRIVAL WARM fired at the same moment plus the VFX file's 20-weapon boot warm — the user never saw a
door; (2) the CDN is edge-cached for a YEAR now (the cache rule) and the browser keeps every copy as long —
a copy ever answered without its CORS header (a policy change; Safari's plain <img> of the same URL) or as
a 404 (a file asked for before its upload — the edge caches a 404 for the year too) is FROZEN, and a
texture / model that never lands is a black surface until the cache is cleared. Three rules now.
**THE RETRY** (three-renderer.js, beside `textureLoader`): every failed CDN load is fetched ONCE more under
`ewretry=<token>` (`_ewRetryUrl` — a new cache key on the edge AND in the browser) — the texture loader's
wrapper (onto the SAME Texture), `_loadUnitGLB` (before the character fallback), `_loadMiscModel`,
`_loadFoliageModel`, three-vfx-effects.js `_loadCachedTex` / `_wpnLoad`; every failure is one console line
(`_ewAssetFailed`) and a row on `window._ewAssetFailures` — READ THAT FIRST on any "black" report. Proven
by the probe with every first image / model request answered 403: the ground, the leaf and the car landed
on the second try. **THE BACKGROUND LANE** (`_scheduleModelLoad(start, url, bg)`): a warm — `hq.warmRoom`
(`_loadMiscModel(…, { bg: true })`), the roaming extras (`_hqSpawnRounds` under `_bgLoadDepth`), the weapon
boot warm (`_wpnLoad(key, { bg: true })` through `ThreeRenderer.bgModelLoad`) — runs at most `BG_MAX` 3
files at a time and only while no rig is streaming; a REAL request for a queued URL promotes it
(`_bgPromote` / `ThreeRenderer.bgPromote`). The rig lane is a SET (`_rigLaneLive`, never a counter).
**THE MENU'S DOOR FIRST**: map.js `_hqWarmArrivalSoon` — the main menu warms the building only after its
own leaf and car have landed (else 8 s in); Play still warms at once. mobile-performance.test.js pins the
lanes. UNSEEN LIVE (RULE #1c): the user's own browser — if a room is still black after this build, the
console names the URL and the Network tab shows the header (or the 404) the cache froze; a hard reload
(Ctrl+Shift+R) or clearing the site's cache is the reset, and a Cloudflare cache PURGE after an upload
that replaces a file that ever 404'd.

## SIX MORE EXECUTIONS — Danger Close · Excommunicated · Abracadabra · The Tower · Fee Fi Fo Fum · The Changeling (FINISHER_PLAN delivery 5) — 2026-09-20, local delivery
The next six `FINISHERS` rows in roster order are BUILT (twenty-one of 99):
marksman `dangerClose` (`_sigDangerClose3D` — the grid lattice + the grid
reference, the laser designator, the reticle, ONE shell straight down, the
fireball; the director is the first finisher to use `cineSniperPov`, released
by hand before the sky watch), priest `excommunicated` (`_sigExcommunicated3D`
— the cathedral rises on the 3×3, the bells toll, the doors slam, the whole
thing lifts into the sky with the victim inside), wizard `abracadabra`
(`_sigAbracadabra3D` — the house-sized top hat, the wand's three taps, the
lift on nothing, the reappearance sixteen tiles up), fortune teller
`theTower` (`_sigTheTower3D` — the building-sized card flips to XVI, burns,
a stone tower rises, six `_LT().bolt` strikes, the crown, the two figures,
the split), giant `feeFiFoFum` (`_sigFeeFiFoFum3D` — the hand, the grab, the
blinking eye, the two millstones rolling in, the flour, the loaf), fairy
`changeling` (`_sigChangeling3D` — the toadstool ring off the misc
`mushroom` / `mushroom2` clones, the dancing lights, the sun-and-moon
time-lapse, the clock, the ageing silhouette, 100 YEARS). Three shared
helpers joined the section: `_finBodyMesh` (the dark stand-in capsule),
`_finTextSprite` (a camera-facing text card — a Sprite, the section's rule),
`_finFireball`. Each = a director in battle.js `_FIN_DIRECTORS`, the signature
in "THE FINISHER PASS 2" (the DELIVERY 5 block; `_sigRunOwned` + `_fxDelay`,
called inside the relayed cinematic — RULE #2), a `_FIN_STAGE[sig]` script for
the forge, a row in finishers.test.js's BUILT table. Smoke-tested in a stub
THREE harness (every tick; not a render). UNSEEN LIVE (RULE #1c):
FINISHER_PLAN §7's delivery-5 entry lists what to eyeball first.

## THE LOADING PASS — NOTHING IS WARMED BEHIND THE TITLE (the 330 MB title screen) — 2026-09-20, local delivery
The user: "the page just loads forever — transferring data from cdn.entropywars.net… the title sprites never
finish". MEASURED with a headless browser against the REAL CDN (`playtest` scratch probe, request log by
phase): the TITLE SCREEN alone pulled **330 MB** in 355 requests before any click — the VFX file's boot warm of
all 29 weapon GLBs (5–13 MB each; the `first` burst at 3.5 s + a 700 ms drip), the renderer's projectile
(14 MB) and bone (27 MB) boot timers, the finisher rocks (both asteroids, 22 MB), AND the pre-match party
builder, which React-renders at boot INSIDE `.app.setup-mode` under the title overlay and whose `HeroViewer3D`
stage streamed the first slot's rig + UAL1 + UAL2 + MAL1 (26 MB); four of the weapon files were fetched TWICE
(the VFX cache and the renderer's misc cache share URLs). The menu added ~100 MB (the arrival warm's whole
room). The CDN itself is fast (a 18 MB file in 0.7 s from here) — the tab was simply queueing a third of a
gigabyte, and on a home line the 466 KB title sprite sheets sat behind it for minutes. THE RULE NOW: **no
model is ever warmed at boot, on the title or on the menu** — a weapon / a bone / a projectile loads on its
FIRST USE (every helper degrades gracefully while it streams), the battle's LOADING SCREEN warms only what
the two parties' basic attacks deliver (battle.js: `basicAttackDelivery` → `ThreeVFXEffects.warmWeapons
(['bullet' | 'arrow'])` + `ThreeRenderer.warmProjectileModels([dv.proj])`, both in the background lane,
fire-and-forget) and `finish()` starts **`ThreeVFXEffects.warmWeaponsDrip(4000, alive)`** — the rest of the
library one file every 4 s through the background lane while `gameState === GS.BATTLE`; `stopWeaponDrip`,
`EW_NO_WEAPON_WARM`. The menu's `_hqWarmArrivalSoon` warms the WALKER'S RIG only (`_hqWarmArrival({
avatarOnly: true })` — the one file the load card waits for); Play warms the room + the survey. **THE HIDDEN
STAGE**: `EWCharViewer.mount` parks a host that has no box OR whose centre is covered by an element outside
its own page / app root (`_cvHostHidden` — `host.closest('[id$="Page"], .app')`; a window of the SAME page
over it, the forge's locker, is not a cover) and polls it in (`_cvDeferMount`, 400 ms); `unmount` drops the
park. AFTER: the title is 22.7 MB (the scripts), the forge from the menu mounts its stage and streams its rig
on open. `npm test` runs `load-diet.test.js`. STILL THE USER'S (assets, not code): the menu scene's pyramid
wears a 28 MB `Pyramid/Textures/TextureBake.png`; the hall's chairs are 16 MB each; `railing_1m`'s file
`Meshy_AI_one_meter_of_railing_0903105339_texture.glb` is NOT in the bucket (a 404 + a retry in every room);
the Cloudflare cache rule caches a 404 for a year in the browser too — set the rule's Edge/Browser TTL for
status 200 only (404 → a minute) and PURGE after uploading a file that ever 404'd.

## THE LANES ARE OFF — everything loads at once again + THE CDN CORS PROBE (2026-09-20, local delivery)
The user, on the two-day-old rig lane + background lane: "everything used to load fast all at once — go back
to that; still black, everything loading slow." MEASURED on the live Render host (headless, the real CDN):
zero asset failures, every texture and GLB carries its CORS header, the hall renders textured after 90 s —
the black was assets not yet arrived, and the LANES were the delay (the walker's rig held every other model,
the room's props and the natives trickled three at a time). three-renderer.js `_scheduleModelLoad`: on a
desktop EVERY request starts the moment it is made; the rig lane and the background lane exist only under
`window.EW_MODEL_LANES = true` (the phone's serial queue under EW_PERF_LOW is untouched; the retry stays).
map.js `_hqWarmArrivalSoon` warms the WHOLE arrival room from the menu again (`avatarOnly` is still a valid
opt). index.html gains THE CDN CORS PROBE at boot: one small cors fetch of the CDN; when the page's origin
is not in the R2 bucket's CORS policy (only the Render host is today — entropywars.net / www get NO
`access-control-allow-origin`) a red banner names the origin and the fix and `window._ewCdnCorsBlocked` is
set — a blocked origin renders every texture and model black with nothing else in the console. The bucket's
policy is the user's (Cloudflare → R2 → bucket → Settings → CORS; `r2-cors-policy.json` in the delivery).
mobile-performance.test.js's lane test opts in; load-diet's menu test reads the full warm.

## THE FREEZE AFTER PLAY — the finds table compiled every area on the main thread (2026-09-20, local delivery)
MEASURED (a headless A/B against the real CDN, the Sept 18 build vs HEAD): Play → the foyer took 13.8 s on
the old build and 40 s on HEAD, with the main thread BLOCKED ~30 s under the "n models streaming…" card. The
CPU profile named it: three-renderer.js `_hqPlaceFinds` guarded on `D.finds` — data.js's LAZY GETTER
`_hqFindsAll`, which builds the finds of EVERY tape room, and since THE AREAS (2026-09-18) every one of the
twenty generated areas is a TERRAIN room with a tape, so the getter ran `hqTerrainCompile` on all of them
(3–31 s each) on the main thread, on every first room entry. The survey worker never saw it (the SURVEY
delivery fixed `hqFindsWarm` and missed this reader). RULES now: (1) NEVER read `DOOR_HQ.finds` / `D.finds`
in the game — a room's rows are `hqFindsInRoom(roomId)` / `hqFindsForRoom(roomId)`; (2) in a real page (a
`Worker` exists) the getter SKIPS a terrain room whose survey record has not landed and pins the table only
once complete; the Node sandbox / the tools still compile the lot (17 suites read the whole table);
`hqFindsBuildAll()` is the explicit full build for tooling. Not touched: the "models streaming" note on the
load card is the SURVEY delivery's live count of GLBs in flight (`ThreeRenderer.assetsPending`) — the card
waits only for the walker's own rig; the count is information, not the wait. The two Cloudflare cache
rules on cdn.entropywars.net are the user's to keep or drop; the CORS probe showed the edge keys on Origin
correctly and every asset carries its header. Still missing from R2: `Assets/door/models/
Meshy_AI_one_meter_of_railing_0903105339_texture.glb` (a 404 + one retry in every room).

## THE MODEL QUEUE — the 507 MB hall, measured and ordered (2026-09-20, local delivery)
The user: "still having issues with the loading textures … the whole game … the door frame doesn't
even load in the main menu." MEASURED on the LIVE host (a Playwright probe against the real CDN,
every request logged): entering the hall pulled **507 MB in 533 requests** — ~110 GLBs of 5–9 MB fired
in ONE burst at t = 3 s (60 props, the cast, THE POPULATION's 13 roaming natives' rigs at 7–9 MB
each — the 2026-09-19 addition), all sharing one HTTP/2 pipe, so the walker's own rig landed at
**109 s**, a 20 KB terrain PNG took 16 s, and the building stood black for a minute; the menu warmed
the whole room behind its own door leaf; a battle's models queued behind the same flood. "Everything
at once" was never fast — it was everything arriving together at the end. RULES now: (1) three-
renderer.js **`_scheduleModelLoad` is ONE priority queue** (`_mqJobs` / `_mqPump`, `MODEL_MAX_INFLIGHT`
4): priority 0 = THE RIG LANE (`_rigLaneMark` — the walker's model + libraries; NEVER waits for a
slot), 1 = the scene on screen (props, doors, units), 2 = a warm / the population's extras (`bg` /
`_bgLoadDepth`); `_bgPromote(url)` lifts a queued bg file the scene asks for; a job frees its slot on
`done()` or the 90 s safety timer; `EW_NO_MODEL_QUEUE` = the old burst (`EW_MODEL_LANES` /
`EW_NO_RIG_LANE` are gone); the phone keeps its serial queue. (2) map.js `_hqWarmArrivalSoon` warms
the WALKER'S RIG ONLY from the menu (`avatarOnly`); Play warms the room. Measured with the fix
substituted on the live host: the rig at 21 s (was 109), the terrain sheets in 2–4 s (was 16), the
population last. STILL THE USER'S: the volume — the hall's furniture is ~300 MB of GLB and the
population ~100 MB per room on a cold cache; `gltf-transform optimize` (WebP, 1024 px) would cut it
5–10×, and the population's draw (`HQ_POPULATION_RULES` `hqMul` / `perM2`) is the other edit.
mobile-performance.test.js pins the queue; load-diet.test.js the avatar-only menu warm.

## THE PARTY'S QUICK ACTIONS + THE BAG + THE DISPENSARY + AUTO HEAL (the JRPG inventory, 2026-09-20, local delivery)
The user: "quick actions on the party in the pause menu — click on them and swap / relieve / use any heal
spells they have; an auto heal button that uses any existing potions or MP and spells; an inventory to
collect potions and stuff; a room that is a shop that sells potions; heal in the medical bay." **THE BAG**
(data.js, the block after `hqPartyFieldItems`; `door.hq.bag = { items: { key: n }, at }`, LOCAL like the
party — RULE #2): `hqBagRecord / hqBagCount / hqBagAdd (capped at HQ_PARTY_RULES.bagStack 20) / hqBagTake /
hqBagList / hqBagTotal`. Things go IN three ways: every PAY CACHE drops ONE potion beside the Hazard Pay
(`HQ_FIND_RULES.potionDrop` weights, seeded by the day + the row; `hqCollectFind` returns `potion` and the
toast names it), a find row of kind `potion` / `item` with an `item` key goes straight in (the collector no
longer refuses the kind — a row WITHOUT `item` still reads `unsupported`), and THE DISPENSARY sells them.
Things go OUT two ways: a FIELD USE (`hqPartyUseItem(profile, units, 'bag', key, targetId)` — the bag is an
owner beside a member's pockets) and **THE POCKETS**: `hqPartyStock(profile)` tops every FIT member's battle
pockets up to `HQ_PARTY_RULES.pocket` (2 heal · 1 mana) from the bag — map.js `_hqPartyLaunch` runs it in a
transaction before every encounter and the pause menu's RESTOCK POCKETS button runs it by hand; the commit
(battle.js, the vit rows carry `items`) writes each unit's battle items back onto its member, so what a fight
spent stays spent. **TWO FIELD-ONLY ITEMS** in ITEM_RULES / ITEM_META: `reviveTonic` (a down member up at
half) and `elixir` (full HP + MP, wakes the down) wear `fieldOnly: true` — `normalizeLoadoutForClass` (battle.js
AND state.js) caps a field-only key to 0, `hqPartyForLaunch` strips them from the pockets, the forge's item
picker (party-builder.js `allItemKeys`) never offers them; `HQ_PARTY_RULES.itemKinds` lists all four.
**THE DISPENSARY** = `DOOR_HQ.rooms.dispensary` · ROOM 911, a box room off THE MEDICAL WING's north wall at
x 2.2 (`leaf_hospital`; hq-suites' SUITES table lists it): counter `pharmacy` → `overlay: 'pharmacy'` → map.js
`_hqPharmacyHtml` (THE HATCH: `HQ_DISPENSARY.stock` at each row's `shopPrice`, BUY 1 / BUY 5, SELL 1 at
`sellBack` 0.5; re-renders in place), counter `bag` = a by-id panel. THE GOLD: `hqShopQuote` (a read) → profile.js
**`ProfileSystem.spendGold(amount, reason)`** (the server's wallet through the NEW server.js
`POST /api/economy/spend` — an atomic `gold >= amount` debit, a NEGATIVE amount is a refund capped by
`SPEND_REFUND_CAP`; no token → `localSpendGold` on the mirror) → `hqShopBuyApply` puts the goods in the bag
ONLY after the wallet answered; a sell is `hqShopSell` then a negative spend. RULE: never touch `account.gold`
for goods except through spendGold (a local write is overwritten by the next server sync). **AUTO HEAL** =
`hqPartyAutoHeal(profile, units)`, a greedy planner over the two verbs (`hqPartyCast` / `hqPartyUseItem` — the
arithmetic is one): the DOWN first (a revive spell from the fit caster with the cheapest cost, then a Revival
Tonic, then an Elixir; none → a `skip` step naming them), then the HURT lowest-first (a healAll when two or
more are hurt, the single heal from the caster with the most MP, the member's own selfHeal, a Healing Potion
from the bag then from anyone's pockets, a Mana Potion on a dry caster ONLY when a heal is wanted and nobody
can pay, an Elixir last), `autoHeal.maxSteps` 64; returns `{ steps, before, after, healed, revived, still, did,
note }`. **THE PAUSE MENU** (map.js): every party CARD is a `<div role="button">` now and wears a QUICK STRIP
(`_hqPauseCardQuickHtml`: ⇄ SWAP · RELIEVE · one ♥ button per heal spell the member can cast here (a
single-target heal arms the pick, healAll / self cast at once) · their pocket potions and the bag's potions
used ON THAT MEMBER at once (`itemon:<owner>:<key>:<target>`) · SHEET ▸); THE QUICK BAR over the shifts
(`_hqPauseQuickBarHtml`: ♥ AUTO HEAL · 🎒 RESTOCK POCKETS · THE BAG · 🛏 THE COT · 🧪 THE DISPENSARY — a
`data-pause-room` button drops the menu and walks you there through `_hqDoAction`); the new command **ITEMS**
(`_hqPauseBagHtml`: the bag's rows with USE ▸ = `bag:<key>` arms a target pick on the party sheet, THE
POCKETS per member, the same bar). THE COT (Medical 1111) is unchanged — the free inn. CSS at the END of
styles-base.css ("THE PARTY'S QUICK ACTIONS"). `npm test` runs hq-party.test.js (14). NOT built: a synced bag
(the party is local too), the bag in a console crossing (the forge still owns loadouts), a shop for gear,
selling from the pause menu (the hatch only). UNSEEN LIVE (RULE #1c): the quick strip's wrap on a 300 px
card, the ITEMS sheet, the hatch's rows, the pharmacist's chair behind the counter, the wallet round-trip on
a server account.

## THE EARNED DOORS + THE ROSTER LOCK (2026-09-20, local delivery)
The user: "get rid of any doors in DOOR HQ that lead straight to battle sites — the only
exception is Room 64; the player must explore and discover the sites by natural means, and only
once they have cleared the site (all 3 win conditions) does the area stabilize and Otto builds a
door to it; lock all the units except online PvP (the whole roster) and VS CPU (testing) —
otherwise only what you unlocked through Hazard Pay or a ticket." **THE EARNED DOORS** (data.js,
the block before `hqMissionPool`): a BAY THRESHOLD (`action.mission`) is EARNED only for a
STABILIZED site — `hqSiteEarned(mapId, profile)` (the free list `HQ_EARNED_DOOR_RULES.free` =
`prebuilt_training`; dev `?alldoors` / `EW_HQ_ALL_DOORS`; else `hqMapMastered`) is the ONE read;
`hqApplyEarnedDoors(profile)` stamps `hidden` on every threshold row (map.js `_hqEnter` runs it
on EVERY entry before the room builds; three-renderer.js `_hqBuildDoors` builds NOTHING for a
hidden door — no frame, no plate, no record, so the scan / the walk-in / the rounds never see
it; the run of wall is blank). The map treats an unearned threshold as a SECRET edge
(`hqWorldGraph` edges carry `mission`, `hqMapGraph` edges `threshold`; `hqMapModel` /
`hqWorldOverview` pose no `?` through it — a site behind a facility SEAM (the mirror, the
natatorium, the screen, H-Wing) is still posed: that IS the exploration). The star chart's stars
wear `chart: earned | charted | uncharted` (`hqSiteSeen` = a room of the site stood in): an
uncharted star is a nameless dot, a charted one is named with its checklist and no POINT, only an
earned one opens its door (`_hqOpenThreshold` refuses the rest). The bay door's panel in the hall
lists EARNED thresholds only (+ a count of the unbuilt); `_hqThresholdPanelHtml` reads `earnedDoor`
(the CROSSING console / the crossing panel pass `inSite: true`); **`_hqLaunchMission` refuses a
wild site unless you stand IN it** (`_hqRoom().site` — the BATTLE marker / the console are the
natural way to file the three wins) or `o.variant === 'full'` (Room 64's RANGE console = every
site, the exception); DISPATCH's desk passes `pre.allow` (earned sites + the range's boards) and
match-select.js's card filter / initial pick honour it. **OTTO BUILDS A DOOR**: map.js
`_hqCheckEarnedDoors` after the promotion check — `hqEarnedDoorsNew(profile)` (stabilized, not
yet in `door.hq.earned`) → `hqEarnedDoorsStamp` (ONE write, the caller saves) → the PA chime + a
toast per site naming its bay. **THE ROSTER LOCK**: `ACCT_STARTER_UNITS` is `door agent` +
`homosapien` + the user's three free hires `catgirl` · `bigfoot` · `honda civic` on BOTH sides (server.js unions starters into an account on login and never
removes — an account that already holds the old all-3D roster keeps it until its `unlockedUnits`
row is reset); `unitRosterScope()` = `'all'` for `_DEV_UNLOCK_ALL`, an online seat
(`isOnlineMatch` / `_NET.online`) or `window._ewRosterScope === 'all'` (set by `_goToVsCpu`,
`_goToQuickPlay`, `_goToFriendlyMatch`, the RANGE console's `scope: 'all'`), else `'owned'`
(`_hqEnter`, `_hqLaunchMission`, the desk); `isUnitOwned(race)` = the LEDGER (never the scope —
the shop + the codex read it); `isUnitUnlocked(race)` = 3D-ready AND (scope all OR owned). THE
PARTY's seed fills from what the account owns (the five starters fill the first shift).
`npm test` runs `earned-doors.test.js`; champ-rework / hq-party amended. Ship data.js to R2 AND
Render (server.js reads it). UNSEEN LIVE (RULE #1c): the blank runs of ring wall, the ceremony's
toasts, the chart's dots, the desk's shortened deck, the forge's 🔒 wall in the building.

## SKATEBOARDING rev 6 — WASD LIKE WALKING, THE CAMERA IS THE MOUSE'S, THE KICK (2026-09-20, local delivery)
The user: "my character does a pushing animation with his arms instead of a kick animation; I want
AWSD movement with the skateboard just like walking; I don't want the camera to move with A and S —
I control the camera with the mouse, just like walking." **THE ARM PUSH** was a slot collision: the
walker is the Player CAST rig, which already carries `_CAST_POSES.hqPush` = `Push_Loop` (leaning into
a mop handle), and rev 3's bake guard `!def.libClips.hqPush` left the stride unbaked — the mop push
played on every stroke. The skate push is slot **`hqSkatePush`** now (three-renderer.js's bake,
`_playUnitModelAnim`'s fallback → `castKick` → run, the clip picker) and the clip is **THE KICK**:
sprites.js `HQ_SKATE_CLIPS.push` = MAL1 `Spartan_Kick` (lib 2) `trim: [0.4, 1.0]` at ts 1.15 — one
stroke fills `pushMs` (a libClips row may carry `trim`; the bake copies it). RULE: never bake a walker
slot under a `_CAST_POSES` name. **WASD IS A DIRECTION**: `_hqRideWantHeading(H, k, arrows)` = the
walker's own camera-relative input (forward / right flattened; the arrows count on the ground, in the
air they are tricks), `_hqRideDelta(R, want)` the shortest turn from the ROLL's direction (a negative
`R.v` travels along hd + π); on the ground the board CARVES toward it (`turn` at ≥ 3 m/s, up to 3.5×
tighter below — `turnMin` the crawl's floor), pushes on the cadence, a key more than 0.62π off the
roll is THE BRAKE, from a stop (|v| < 0.3) the heading snaps to the keys and the first push goes there
(S with the camera ahead turns the board round and rolls toward the camera — the rev 2 FAKIE PUSH is
retired, `reversePushV` a dead key; a negative `R.v` is only a portal exit's or a bail's); in the air
the heading turns toward the keys at `airTurn` and the speed is nudged by `cos(delta) × airAccel`.
**THE CAMERA NEVER TURNS**: `_hqRideTurn(R, heading)` wraps and writes the heading ONLY — no carve,
rail bend, wall slide or air control touches `_hq.cam.yaw` (hq-skate.test.js scans the block for a
yaw write). hq-skate.test.js (30). Unseen live (RULE #1c): the kick's read on the deck (`trim` / `ts`
are the edits), the carve's tightness at a crawl, the turn-round on S.

## SIX MORE EXECUTIONS — Ack Ack Ack · Ascension Denied · The Probe · Blurry Footage · Sleep Paralysis · The Unmasking (FINISHER_PLAN delivery 6) — 2026-09-20, local delivery
The next six `FINISHERS` rows in roster order are BUILT (twenty-seven of 99):
martian `ackAckAck` (`_sigAckAckAck3D` — the seven-tile TRIPOD walks in along
the line, the heat ray sweeps onto the tile, the skeleton topples), nordic
`ascensionDenied` (`_sigAscensionDenied3D` — the column of light, the lift,
the stutter, the drop from orbit on a re-entry trail, the crater), grey
`theProbe` (`_sigTheProbe3D` — `_sigBuildUFO`'s saucer, the tractor beam,
the table, three jabs, the body back in three pieces in the wrong order),
bigfoot `blurryFootage` (`_sigBlurryFootage3D` — the pine treeline, the ● REC
card, the grain, the thing that walks through the tile; a witness shot with
hand-held kicks), shadow entity `sleepParalysis` (`_sigSleepParalysis3D` — the
black dome, the bed, the flickering lamp, the figure in the corner closer
each time, 3:33 AM, the grin; a face cam under the eyelids), reptilian
`unmasking` (`_sigUnmasking3D` — the skin peels at the caster, a 26-segment
serpent on a head trail (`_finChain`), the lunge, the swallow, the bulge, a
● LIVE card). Each = a director in battle.js `_FIN_DIRECTORS` (the DELIVERY 6
block), the signature in "THE FINISHER PASS 2" (the DELIVERY 6 block;
`_sigRunOwned` + `_fxDelay`, called inside the relayed cinematic — RULE #2),
a `_FIN_STAGE[sig]` script for the forge, a row in finishers.test.js's BUILT
table. Smoke-tested in a stub-THREE harness (every tick; not a render).
UNSEEN LIVE (RULE #1c): FINISHER_PLAN §7's delivery-6 entry lists what to
eyeball first — the tripod's scale, the dome's radius against the reverse
shot, the flat figure off-axis, the pines' scale, the serpent's jaws.

## THE LIGHT PASS + THE SUBTITLE + SKATEBOARDING rev 7 (no push clip) — 2026-09-20, local delivery
The user's three: "the skateboarding uses a weird kick to push — I'd rather have no kick animation at
all; character dialogue should still look like subtitles, black bar with white text; the map looks
setting resets between zones and the night mood is too aggressive — more torches or a key light, and the
brightness I set in a dark area blows out the battle". **THE CYCLE BUG (the root of "it resets")**: the HQ
never wrote `document.body.dataset.cycle`, so every room inherited the LAST BATTLE's day / night — a night
map left the night grade (`uNightGrade` × the look's `nightMood`) and the night exposure over a room that
lights itself, a day map left none; the same room read dark one visit and fine the next. Now
three-renderer.js `_hqEnter` writes **`HQ_LIGHT_RULES.cycle`** (`'day'`: no grade, exposure 1 — a room's
mood is its own lights, its fog, its look's retro preset); the battle rewrites the cycle from its map as
before. **THE NIGHT CAP**: `_sceneLookOf` clamps a look's `nightMood` to `HQ_LIGHT_RULES.nightCap` (0.45)
wherever it is worn (a battle's `env.look`); the `HQ_ROOM_LOOKS` table keeps its authored values (tests
pin them) — a mood, never the darkness. **THE KEY LIGHT**: data.js **`HQ_LIGHT_RULES`** (beside
`HQ_SKATE_RULES`, on `window`; three-renderer.js `_hqLightRules()` merges it over `HQ_LIGHT_DEFAULT` — keep
the keys in step) = `ambientFloor` 0.55 (a box room's `mood.ambient` never dims the fill below it — the
torches carry the vibe on top), `fill` / `fillColor` (a cool fill light from behind the key in every box
and open room — no black side on a face), `open` (an outdoor room's hemisphere / sun / lamps by day and
night: the night keeps a real MOON key — nightHemi 0.62 / nightSun 0.4, was 0.42 / 0.22). **THE TWO
BRIGHTNESSES** (three-post.js, the block after `EXPOSURE_MAX`): the Brightness slider is PER PLACE —
`ew_exposure` the battle's (the old key), `ew_exposure_hq` the building's (follows the battle's until
moved); `ThreePost.setExposureContext('hq' | 'battle')` (`_hqEnter` / `_hqLeave`) swaps the active value
and **`_expLk()`** eases the swap over ~0.4 s (`EXPOSURE_EASE_K`) — it is the ONE read every
`toneMappingExposure` write goes through (never `_lkNum('exposure', …)` directly again); a slider move
lands at once and files under the active place; ui.js's slider is labelled `Brightness · EXPLORING /
BATTLE`. **THE SUBTITLE**: map.js `_hqOpenPanel` toggles `hq-panel-say` on `#hqPanel` for every target
that is a PERSON (not a door / counter / notice); styles-base.css "THE SUBTITLE" (appended at the END, after
the HUD pass) makes the card a black bar along the foot of the screen — the name small above, the line
in white — the plate rules never reach it. **SKATEBOARDING rev 7**: NO push clip and NO kick — a push is
the speed + the sound (`R.pushAnim` stays 0; the picker never plays `hqSkatePush`; sprites.js
`HQ_SKATE_CLIPS` = the two bail clips only; the bake guard is `hqFall`); `pushMs` / `kickEvery` /
`kickMinV` are dead keys. hq-skate.test.js (30) pins it; the quarter-pipe test took a longer run-up and
the air-control test judges S while airborne (the retired kick's bump had hidden a landing inside its S
phase). PRE-EXISTING at HEAD, not touched: doorhq.test.js 60 / 61 (the Δ area pass's board reads).
UNSEEN LIVE (RULE #1c): every room under the day cycle (a room that now reads FLAT wants its own lights,
not the grade back), the moon key on the night areas, the eased swap through a door, the subtitle bar
against the walk.

## SIX MORE EXECUTIONS — Kiss of Death · Bone Rattle · Ordnance · Possessed Photo · The Pile-On · Pyramid Scheme (FINISHER_PLAN delivery 8) — 2026-09-20, local delivery
The next six `FINISHERS` rows in roster order are BUILT (thirty-nine of 99):
succubus `kissOfDeath` (`_sigKissOfDeath3D` — the dance floor, the mirror
ball, the dancer, the circling, the dip, the kiss, the candle going out into
a HEART-SHAPED SMOKE RING), skeleton `boneRattle` (`_sigBoneRattle3D` — two
rings of stick skeletons pop up, rattle for a chorus, then all POINT; the
victim drops into a bone pile), mech `ordnance` (`_sigOrdnance3D` — six pod
doors, three lock rings, thirty missiles on their own beziers with smoke
trails, a rolling sequence of fireballs, the crater), ghost `possessedPhoto`
(`_sigPossessedPhoto3D` — the flash, the print that develops facing the
caster, the taller figure behind, the burn from the middle with flames on
the print's own plane), zombie `pileOn` (`_sigPileOn3D` — forty over the
edge from every side, the ring, the three-tier mound, off with the pieces),
annunaki `pyramidScheme` (`_sigPyramidScheme3D` — three inverted pyramids
descend, capstones charge, three lasers converge, the tile goes to glass).
Each = a director in battle.js `_FIN_DIRECTORS` (the DELIVERY 8 block), the
signature in "THE FINISHER PASS 2" (the DELIVERY 8 block; `_sigRunOwned` +
`_fxDelay`, called inside the relayed cinematic — RULE #2), a
`_FIN_STAGE[sig]` script for the forge, a row in finishers.test.js's BUILT
table. Smoke-tested in a stub-THREE harness (every tick; not a render).
UNSEEN LIVE (RULE #1c): FINISHER_PLAN §7's delivery-8 entry lists what to
eyeball first — the print's facing, the beams' axis, the missiles' apexes,
the skeletons' scale, the horde's pace, the heart ring.

## SIX MORE EXECUTIONS — Compactor · Factory Reset · The Rapture, Party of One · Be Not Afraid · Into the Sun · The Contract (FINISHER_PLAN delivery 7) — 2026-09-20, local delivery
The next six `FINISHERS` rows in roster order are BUILT (thirty-three of 99):
robot `compactor` (`_sigCompactor3D` — two steel walls on hydraulic rails
close on the victim along the PERPENDICULAR of the caster → victim line,
the press plate, the serial-stamped cube), android `factoryReset`
(`_sigFactoryReset3D` — the ⏻ power-down, the exploded PARTS DIAGRAM with
leader lines and a progress card, the THIS SIDE UP crate), angel `rapture`
(`_sigRapture3D` — the cloud ring, the trumpet, the gold column, the iris
that shuts and re-opens RED, the hand, the one scorched feather), seraphim
`beNotAfraid` (`_sigBeNotAfraid3D` — three rings within rings on three
axes with fourteen eyes a ring that all turn to the victim on the gaze
beat, the great eye's lid, the bleach), orb of light `intoTheSun`
(`_sigIntoTheSun3D` — a board-sized sun off the far edge, the fling down
the line, the collapse, the NOVA shell out to thirty tiles; the resolve's
whiteout is `sizeTiles: max(8, c.span)` — the whole board), demon
`contract` (`_sigContract3D` — a sky-sized parchment off two rollers
(`_finTextTex` with a `bg`), the quill signing the victim's own name in
fire, the seal, the pit, four `_finChain` chains, the burn). Each = a
director in battle.js `_FIN_DIRECTORS` (the DELIVERY 7 block), the
signature in "THE FINISHER PASS 2" (the DELIVERY 7 block; `_sigRunOwned` +
`_fxDelay`, called inside the relayed cinematic — RULE #2), a
`_FIN_STAGE[sig]` script for the forge, a row in finishers.test.js's BUILT
table. RULE learnt: a signature that spawns particles beside a moving piece
adds the piece's group-local offset to `tilePx`'s x / y directly — the
board's world units ARE its pixels (`c.x + px * gap`), never a tile
conversion. Smoke-tested in a stub-THREE harness (every tick; not a
render). UNSEEN LIVE (RULE #1c): FINISHER_PLAN §7's delivery-7 entry lists
what to eyeball first — the walls' facing, the sun's radius against the
dome, the parchment's legibility, the eyes' lag, the six camera paths.

## THE OWNED SEED + THE MARKER'S FIGHT + THE DEFEATED LEDGER + THE HEALING ZONES (2026-09-20, local delivery)
The user's four. **THE OWNED SEED**: data.js `hqPartyEnsure` seeds the party from what the account OWNS — a last-roster
member joins only when `hqPartyUnlocked` names its race (a VS-CPU test roster is scope 'all': its martian / knight were
leaking in), the starters + the owned fill the first shift when the roster gave nothing; **`hqPartyPrune(profile)`**
relieves a stranger already on the books (never the officer) and every `hqPartyEnsure` on an existing record runs it.
**THE MARKER'S FIGHT**: E on the floating crystal (`proc: 'battle_marker'`) opens ITS OWN panel (map.js `_hqMarkerHtml`:
the party's vitals, the site's natives, the checklist, ⚔ FIGHT ▸ WIPEOUT · TDM / ⬡ FIGHT ▸ THE CUBE · THE KEYS · ARENA —
the two modes the three win conditions need) → `window._hqMarkerFight(gm)` → data.js **`hqMarkerLaunch(roomId, cfg,
{ gm, codeRed })`** (the encounter's launch shape, the first native as the lead, `doorId: 'battle'` so the return lands at
the marker) → `_hqEncounterStart(L, null, null)`: the officer's PARTY seated, no terminal, no builder, no roster wall.
`_hqInteractTarget` routes the marker BEFORE the console branch (doorhq's pins on that branch hold); the CROSSING console
and DISPATCH still open the terminal. **THE DEFEATED LEDGER** (the user: "a unit shouldn't become available for purchase
until the player has defeated one in battle"): `{ '<race>': 'YYYY-MM-DD' }` in TWO places like the cleared rooms —
`door.hq.defeated` + the SYNCED `progress.hq.defeated` (`mergeProgressBlobs`, the EARLIER day wins, `ACH_MERGE_CAPS.
defeated` 256; `hqDoorSyncFold` folds; **ship data.js to Render — the server merges off it**); `hqDefeatedMark(profile,
races, date)` is the ONE write — battle.js's commit marks every ENEMY body that DIED in a standard match (VS-CPU, online,
the areas; win or lose; `unitHomePlayer` ≠ the viewer) and schedules the push; `hqDefeatedRecord` / `hqUnitDefeated` /
**`hqUnitBuyable(profile, race)`** (a starter or an owned vessel always; else defeated; `_DEV_UNLOCK_ALL` opens all) are
the reads. The shop (ui.js `_shopLockReason` → 'model' | 'defeat' | null; `_shopBuyable` = no reason; the card / hero /
action bar say DEFEAT ONE FIRST), the local mirror (profile.js `localPurchaseUnit`) and server.js `/api/economy/purchase`
(a non-starter needs `player_progress.data.hq.defeated[raceKey]` — 403 "defeat one in battle first") all refuse an unmet
vessel. **THE HEALING ZONES**: data.js `HQ_HEAL_ZONE` + `hqHealZoneRooms()` / `hqBuildHealZones()` (run at load after the
areas + the entries) put ONE counter `healzone` (`proc: 'heal_zone'`, verb REST, `action: {}`, `hub`) in every
`DOOR_HQ.hubs` anchor room — 2.8 m BESIDE the room's BATTLE marker where it has one, else 2.2 m in front of the spawn on
its pad; `HQ_HEAL_ZONE.rooms` overrides three (the HQ hub's in THE FOURIER FOYER at x −3.3 — the hall is polar; the city's
west of the plaza's marker — east was the fountain; the deep's at the slope's foot) — all eleven measured on the compiled
field: reachable from the spawn, dry, flat (a scratch probe; the compile is 1–26 s a room). The
panel is THE COT's (map.js `if (c.id === 'cot' || c.id === 'healzone')` → `[data-party-rest]` → `hqPartyRestore`: HP / MP
full, the down back up, free); three-renderer.js `_hqBuildHealZone` = a green floor ring + a column + a turning cross of
light + a point light (the marker's `{ icon, ring2, y }` record so the marker ticker turns it; no blocker — walked onto).
Adding a hub = its zone appears; a hub whose anchor is no place for it = a `HQ_HEAL_ZONE.rooms` row. `npm test` runs
`party-hubs.test.js`; hq-party / achievements amended. PRE-EXISTING at HEAD, not touched: doorhq 84 / 85, hq-astral 6,
hq-deep 15, hq-dumb 18, hq-floor-plan 29, hq-terrain 38 (the fountain). UNSEEN LIVE (RULE #1c): the green ring on each
hub's ground (a spot that lands on a slope or in the water is a `HQ_HEAL_ZONE.rooms` row edit), the marker panel's two
buttons, the shop's DEFEAT ONE FIRST tags, the 403 on a server account before the first sync lands.

## AREA CONTENT PLAN D4 — THE DOOR PASS over the complexes (2026-09-20, local delivery)
R3 / R4 / R5 over every pre-plan complex (`AREA_CONTENT_PLAN.md` §7 has the room-by-room list): **fifteen draught PAIRS** as door rows
(`secret: true, leaf: null, label: 'A DRAUGHT'` at both ends — hq-floors / hq-cave count **42** and hq-floors pins the pair list, regenerated from
`hqSecretDoors()`) + **six draught LINKS** (`secret: true` on the row: the cave's flue + crawl (a chamber is crossed by nothing but a links row),
the ley line's three mouths, the wallpaper, the outfall grate); **nine TIER DOORS** (a link END or a door row carries `y`; the gantry is a `plateau`
+ a stair `ramp` in the room, the door's pad on its flat top); **THE BLOCKERS** on the sightlines (0.6 m partitions, pillars = `plateau` r ≤ 1.3,
`tree` rows, prefab props with a foot / rect ≥ 0.45 and h ≥ 1.7 — the audit reads those and nothing else). RULES: a wall's top is the ground UNDER
it + h (a parapet goes on the tier's flat top, never its edge blend); a 0.3 m wall slips between the audit's 0.5 m LOS samples; two abutting plateau
rects leave a solid seam in a halls plan (overlap them a metre); a `bridge` over a door's landing cell keys the landing to the bridge layer — stop
the slab short of the pad; a draught is never an R3 target nor viewpoint (`check-area-content.js`), a bypassed board room is skipped, the ship's
collar is earned. Accepted residue: the well room (six wells see each other), the haunted hall's landing, the D2 cities. The final full audit and
the slow suites were NOT re-run after the last edits (the user's word); `npm run test:quick` and `check-terrain` on every touched room passed.
Ship data.js to R2 AND Render. Unseen live (RULE #1c): every gantry's stair, the parapets, the fangs, the pillars, the slabs' facings.
