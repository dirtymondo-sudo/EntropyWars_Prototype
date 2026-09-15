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

### TOOLING (added 2026-07-29 — run `npm test` before delivering ANY file)
- `npm test` — zero-dependency (Node 22 built-in runner): syntax-checks every
  repo JS, validates data.js content schemas (races/spells/abilities/classes),
  and diffs the hand-synced server.js economy copy against data.js (this
  caught real drift on day one: `swordfighter` missing from the server's
  AVAILABLE_RACES). A server-boot smoke test runs when node_modules exists.
  OPTIONAL: .github/workflows/ci.yml runs the same suite on every push
  (must live at exactly that path — GitHub ignores workflows elsewhere).
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
  `'low'` (a knee-high field wall) | `'walls'` (forced indoors; set by
  hand only where the place itself is walled — the Stadium, Camelot,
  Cyberpunk, Babel, Agartha, Hollow Earth). A wall prop survives a
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
