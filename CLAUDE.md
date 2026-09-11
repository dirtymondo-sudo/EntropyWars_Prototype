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
2. Hand the user the COMPLETE edited file(s) in the chat (SendUserFile).
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
