# Entropy Wars — Playtest Engineering Notes

Reverse-engineered notes so any future session can drive the game without
rediscovering it. The game is a browser Tactical-JRPG PvP; the server is just
matchmaking/relay — all gameplay logic is client-side.

## Running the game + harness
```bash
npm install                       # express + socket.io
npm start                         # serves the client on http://localhost:3000
# one-time, for automated playtesting:
npm install playwright
npx playwright install chromium --with-deps
node playtest.js tdm              # arena | tdm | ffa | domination | hotspot | ctf
```
Artifacts land in `shots/`: per-round PNGs, `<mode>-result.png`,
`<mode>-combat-log.txt`, `<mode>-flags.json` (flagged bugs).

## Asset loading (important fragility)
`index.html` loads ~35 external scripts from a Cloudflare R2 bucket
(`pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev`) + CDNs (three.js r128, socket.io).
ALL game logic lives there (`battle.js` ~20k lines, `ai.js`, `data.js`, sprites…).
- If those hosts are blocked/down, the game silently renders every menu stacked
  and unstyled — no error, no spinner. Single point of failure.
- Behind TLS inspection the browser throws `ERR_CERT_AUTHORITY_INVALID`; the
  harness sets Playwright `ignoreHTTPSErrors: true` to load anyway.
- Headless needs `--use-gl=swiftshader` for WebGL.

## Menu flow to start a VS-CPU match (no auto-sim — drive the real UI)
1. `window._goToVsCpu()` → opens Mode Select (sets controllers {1:'local', 2:'ai'},
   parties auto-filled 4v4). Does NOT start a match.
2. Click the `.ms-mode-card` whose text matches the mode → then `.ms-btn-primary`
   (CONFIRM) → goes to Party Builder.
3. Click `.pb-btn-primary` ("SEAL YOUR FATE"). NOTE: two-stage — it LOCKS the team
   first, then STARTS on a second press (`doStart` only calls `startMatch()` once
   `state.teamLockedIn` is true). Harness clicks up to 2x, else forces
   `applyPartyBuild(false); state.teamLockedIn = true; startMatch()`.
4. After battle begins, re-assert `state.controllers = {1:'local', 2:'ai'}`.

## The live state + API (everything you need to play)
`window.GAME` exposes a live game object. `window.GAME.state` is the full state.
- Turn model = **blitz**: one unit acts at a time, id in `state._blitzActiveUnitId`.
  The engine auto-advances after each unit and **auto-plays AI (P2) units**; when a
  P1 (`controllers[1]==='local'`) unit is active it WAITS for input — that's our cue.
- Read state: `state.phase` ('setup'|'battle'), `state.winner` (1/2/0/null),
  `state.round`, `state.units` (each: id, player, name, cls, hp, maxHp, x, y, z, ap,
  mp, dead, spells[]), `state.matchKills` (TDM/FFA score — NOT `matchScores`, which
  stays 0 in TDM), `state.logEntries` / `state._fullLogEntries` (combat log).
- Act on the active unit (all on `GAME`):
  - `getMoveTiles(unit)` → [{x,y,z,cost}] reachable tiles (the orange highlight).
  - `doMove(unit,x,y,z)` → returns false / logs "Invalid move." if tile not in a
    freshly computed getMoveTiles.
  - `getAttackTiles(unit)` → [{x,y}] in basic-attack range. `unitAt(x,y,z)` → unit there.
  - `doAttack(unit,x,y,z)`.
  - Spells: set `state.selectedTool = spell.name` then `doSpell(unit,x,y,z)`.
    `getSpellRangeTiles(unit,spell)` = castable tiles; `canAffordSpell(unit,spell)`
    checks AP+tier; also require `unit.mp >= spell.cost`. Damage kinds: damage,
    ricochet, multiHit, aoe, barrage, lifeDrain, line, linePush, cross, aoePull,
    splitBeam, displacement, pull, dash, sky*, leapStrike. Heal kinds: heal/healAll/selfHeal.
- End a unit's turn: set `unit.ap = 0` then `window.endUnitIfDone(unit)`
  (engine then advances; AI units auto-play, next P1 unit waits).
- Useful globals: `window.maybeTriggerComputerTurn()`, `maybeAdvanceTurn()`,
  `getActiveMultiplayerMode()` (has `.id`, `.roundLimit`), `_goToVsCpu`,
  `applyPartyBuild`, `startMatch`.
- `setDevAutoSim(true)` / `toggleDevAutoSim()` = AI-vs-AI auto-play. Do NOT use for
  playtesting — the user wants Claude to actually play P1.

## Board / map selection (IMPORTANT — board size is a CHOICE, not forced)
The mode-select screen has **map cards** `.ms-map-card`, separate from the mode
cards. Each card's text is like `Outpost 8×8 PRESET 4 SPAWNS`. Click one to set the
board. Sizes: 4×4 (Apartment), **8×8** (Outpost/Suburb/Bunker), 10×10, 12×12 (the
default if you don't pick), 16×16. For fast, decisive 4v4 pick an **8×8 4-SPAWNS**
card. Flow: `_goToVsCpu()` → click `.ms-map-card` (8×8) → click `.ms-mode-card`
(mode) → CONFIRM → seal → start. (CONFIG.boardSize overrides do NOT work — must click.)

## Type chart / damage (job-independent)
Effectiveness = **spell type vs target's `unit.types[]`**, NOT class/job. Spell types:
human, divine, alien, unholy, anomaly, tech, earth (`spell.spellType`). The engine
exposes **`window.getTypeDamageMultiplier(source, target, spellType)`** → call it
directly to score moves. Multiplier = effectMult × stabMult: strong **×1.30**, neutral
×1.0, weak **×0.75**; STAB **×1.25** if `source.types` includes the spellType. So
super-effective is only +30% — **focus fire matters far more than type-chasing.**

## Arena mode mechanics (multi-objective, scores via a COMPOSITE)
Win by destroying the enemy tower, wipeout, or **composite score** at the round limit
(15). Three scoring paths:
- **Kills** (~15 pts each).
- **Tower damage** — enemy tower = `state.towers[2]` `{x,y,hp}` (yours is `[1]`, 5000 HP).
  Attack/cast its TILE to damage it. ~0.1 pt/HP → the **biggest** point source; lean here.
- **Nexus** — `state.nexusPoints` (fixed, e.g. `earth`) and/or `state.roamingNexus`,
  each with `{zoneX,zoneY,zoneSize,progress,owner}`. Stand a unit in the zone and call
  **`window.channelNexus(unit)`** (costs `NEXUS_CHANNEL_COST_AP`); each call moves
  `progress` ±1 toward you; reach the threshold (≈6) to capture → +gold/round + ~3 pts/round.
  Helpers: `getNexusAtUnit(unit)`, `isInNexusZone(x,y)`.
- **GOTCHA:** Arena `state.matchScores` stays 0-0 — the real result is the composite,
  logged at end as `P1: NNN pts — K kills (..), tower dmg (..), nexus rounds (..)`.

## Smart playtest agents (USE THESE — don't replay "hit closest enemy")
- `playtest_smart.js` — TDM on 8×8 with real tactics: **focus-fires the lowest-HP
  reachable enemy, SECURES KILLS, prioritizes enemy healers, type-aware via
  getTypeDamageMultiplier, White Mage revives/heals.** Result: 5–0 wipeout in 3 rounds.
- `playtest_arena.js` — Arena variant: same core + dedicates the closest unit to
  channel the Nexus + pressures the enemy tower. Result: composite **324–69**.
- `playtest_custom.js` — fills all 8 spell slots but plays the dumb base tactics
  (kept for comparison; it 0–0 stalemated). Lesson: **the dumb "weakest-in-range"
  loop spreads chip damage and never kills — always focus-fire + secure kills.**
- All build full 8-slot loadouts via `getEligibleSpellsForClass(cls)` (native ≈5) +
  a random secondary job + damage fillers, applied as a post-start `unit.spells`
  override (pre-seal `state.loadouts` mutation can wedge `startMatch` — don't).

## Environment gotchas (cost a lot of time once)
- **R2 throttling:** each chromium cold-start re-downloads ~35 scripts; after ~15+
  launches the page load slows to minutes. Minimize browser launches; do all probing
  in as few runs as possible. "Stuck at Game loaded" is usually just slow loading.
- **Heavy-DOM evaluates HANG:** `document.body.innerHTML`, `innerText`, and
  `querySelectorAll('*')` force reflow on the 3D board and never return. Use
  `textContent` on bounded selectors, or read JS globals, or one element's `outerHTML`.
- **Screenshots** time out on the software-WebGL renderer; use `timeout` +
  `animations:'disabled'` and treat failures as non-fatal.
- Render bugs seen mid-combat: `hpBar is not defined`, `Cannot read properties of
  null (reading 'accMs')` — animation/render path, worth chasing.

## Known findings (from playtests)
- **Stale highlights (the "won't move to the orange tile" / "terrain blocks the
  spell" bugs):** highlight (`getMoveTiles`/`getSpellRangeTiles`) and execution
  (`doMove`/`doSpell` via `isRangeBlockedByTerrain`) use the SAME logic with the
  SAME caster Z, so fresh recompute never disagrees (harness logged 0 disagreements
  over a full match). The real cause is the highlight not being recomputed/cleared
  after state changes (ally moves into LOS, AP/moves spent, terrain deform, fog).
  Repro idea: select unit → capture highlight → change state → click stale tile.
- **Lethality is fine WITH focus fire (earlier "no kills" was bad play):** units have
  ~750–1050 HP; a focused target dies in 2–3 hits (Meteor/Dead Eye hit 250–550). The
  0-kill stalemate came from the dumb harness SPREADING damage. Concentrate fire +
  secure kills and TDM ends in a 3-round wipeout. End-of-round regen (~5%) + 1-round
  respawns only matter if you fail to focus.
- **Homing storms (tornado, hurricane, thunderstorm, blizzard, sandstorm):** these are
  now single-tile vortices that, at END OF ROUND (just before end-of-round healing, via
  `processHomingWeather` in `state.js`), CHASE the nearest unit, moving up to
  `homingSpeed` tiles (tornado 3, others 2) toward it. Damage only lands on units the
  vortex **physically touches** — i.e. units standing on a tile it lands on or sweeps
  through that round. Stay farther than its move range and you're safe; let it catch you
  and you're hit. Tornado & hurricane also displace (blow back) anyone they catch.
  Blizzard freezes every tile it sweeps. They no longer drift randomly or damage whoever
  stands inside at start of round. Naturally-spawned storms chase both teams; spell-cast
  storms (`_casterUnitId` set) only chase the caster's enemies. Other weather (blood
  rain, drought, solar flare, tesseract storm, earthquake) is unchanged.
- **Mode resolution:** TDM has a 12-round limit (resolves cleanly + shows a result
  screen); Arena had a 15-round limit but dragged with respawns. "No-contest" voids
  after 20–30 idle rounds — a sign matches stall.
- **matchScores vs matchKills:** TDM/FFA kills live in `state.matchKills`; reading
  `state.matchScores` shows 0-0 and is misleading.
- **Traversal is centralized in `unitCanTraverse` (map.js) — and its 3D branch
  used to skip objects (fixed 2026-06-10):** all movement paths (battle.js BFS,
  ai.js pathing, ui.js highlights, the final move check at `doMove`) funnel through
  `unitCanTraverse(unit, x, y, z)`. Current maps always run in 3D mode
  (`state.boardColumns` populated), and the 3D branch only checked block terrain —
  it returned true without consulting `OBJECT_RULES.passable`, so trees
  (`passable:false`) were walkable. Deployed turrets live in `state.turrets` (NOT
  `boardObjects`/`_deployedObjects`) and were never checked by traversal at all.
  Both now block in `unitCanTraverse`; flyers can still pass above (z above object
  top / turret z+1). `canOccupy` previously blocked only `siegeTurret` and
  `canOccupy3D` ignored turrets — both now block any live turret, so teleports/
  knockbacks can't land on one. If a "walk through obstacle" bug reappears, check
  whether the code path passes `z` (3D branch) and whether the blocker is in
  `state.turrets`, `state._deployedObjects`, or `boardObjects` — each is checked
  separately.

## Camera system (battle.js `camera` object, ~line 5160) — 2026-06 overhaul
The logical camera is `camera` in battle.js (x/y tile focus, zoom, tilt, yaw,
camZ, elevZ); it drives BOTH the CSS diorama transform and `ThreeCamera.sync`.
Debug access: **`window.GAME._camera`** (added). Tilt/yaw readouts:
`state.dioramaTiltDeg` / `state.dioramaYawDeg`; focus via `window._lastCamFocalX/Y`.
- **`moveTo` semantics:** `zoom` is IGNORED unless `_allowZoomChange:true`
  (+`_bypassCap` to skip the auto-zoom floor). Since 2026-06, axes not specified
  keep the previous tween TARGET (not the live interpolated value) — interrupting
  a tilt restore with a pan no longer freezes the tilt halfway.
- **Action camera flow:** every offensive action funnels through
  `playOffensiveActionCamera(src, tgt, opts)` → returns timings
  ({sourceHold, travelMs, targetHold, totalMs}) that VFX scheduling relies on.
  It `camera.save()`s (now saves tween TARGETS + tilt/yaw), then either the
  default midpoint framing or the cinematic shot. Restores go through
  `camera.softResetToUnit` — which now SKIPS the restore when the acting side
  is auto-controlled (AI/auto/remote), killing the old per-action
  pan-back-to-unit bounce; ai.js also only re-centers a unit on its FIRST
  action of an activation (`unit._aiLoopCount === 1`).
- **Cinematic action cam** (`state.cinematicActionCam`, persisted in
  localStorage `ew_cinematicActionCam`; toggles: pause menu Video → "Action
  Cam", dev bar "3P"): `_playCineActionShot` (base tilt const 72) swoops
  behind the caster, yaw = atan2(-dx,-dy) **+16° off-axis** so the caster
  reads bottom-corner foreground (Pokémon OTS, not dead-centered). **2026-06
  AAA pass** (pull-back + headroom + steeper look-down): focal now sits
  **0.5–0.72** of the way toward the TARGET (was 0.32–0.62 toward the caster)
  so the target frames with headroom and its nameplate stays on-screen; zoom
  RELATIVE to `getDefaultZoom()` (≈ whole-board view) pulled back to
  `default × (2.7 − 0.18·dist)` clamped **1.35–2.8** (was 4.4−0.3·dist /
  ≤4.0, which cropped the caster and pushed the target off the top) — do NOT
  use `computeZoomForVisibleTiles`, its flat-view model badly underestimates
  what a tilted perspective shows. The shot dollies down-range at fire time
  (easeOut, arrives with the hit) + `shakeBoard('normal')` impact kick.
  Ownership token `camera._cineShotId`/`_cineShotUnitId` guards the dolly and
  the deferred `selectUnit` activation pan from fighting each other.
  `camera._preCineView` remembers the player's overhead tilt/yaw/zoom;
  restored by softResetToUnit/reset/selectUnit for MANUAL local units, while
  auto/AI units keep streaming from the cinematic framing. Bane-vial item
  throws (`doItem` baneType branch) route through `playOffensiveActionCamera`
  like attacks (throw anim/projectile delayed by `cam.sourceHold`). The shot
  is elevation-aware: focal height lerps caster→target elevation + a headroom
  term, and **tilt pitches harder with the slope (coeff 1.15, clamped 40–80):
  ~40–52 firing DOWN from height/flight for a real 3rd-person look at the
  ground (was clamped ≥55, "didn't tilt toward the ground enough"), 72 flat,
  ≤80 looking up at airborne/high targets — capped below the horizon so
  nameplates keep headroom instead of climbing off the top edge.**
- **Sky-strike descent cam** (`_playDescentCam`, meteor/nuke/cosmic slam via
  `opts.descentCam`): **2026-06 reworked into 3 beats** — (1) SWOOP to an
  over-the-shoulder 3rd-person view behind the caster (yaw = atan2(-dx,-dy)
  +16°, tilt 64, focal 0.62 toward impact) while the telegraph ring forms;
  (2) CRANE UP to the sky (tilt 86, focal back on the impact tile at ground
  elevZ) as the body spawns overhead so it falls into frame from above; (3)
  tilt back DOWN (tilt 58, zoom in) following the body onto the impact,
  `shakeBoard('hard')` on the hit. Beat timing keys off `sourceHold` /
  `descentCam.telegraphMs` / `descentMs` (mirrors `ThreeVFXEffects._fireDescent`).
  Self-cast / zero-range meteors keep the player's heading (no spin).
- **End-of-round camera sequence (2026-06):** when a round ends
  (`maybeAdvanceTurn`, blitz, `!nextUnit`), `showEndOfRoundOverview()` pulls
  back to a near-top-down **tactical overhead of the whole battlefield**
  (board center, tilt 32, `getFullMapZoom()`). The EOR phases then drop in
  from it: `processEndOfRoundStatuses` holds the overhead ~460ms, then **pans
  to each unit taking poison/burn/drown DoT** (tilt 34, `getDefaultZoom()×1.25`)
  and restores to overhead between units; `processHomingWeather` (state.js)
  **focuses and follows each weather vortex along its path** (reaches the
  battle camera via `window.GAME._camera` since it's in another script's
  closure — pans to the storm's start tile over 320ms then glides to its
  landing tile over `SLIDE_MS`, tilt 52, `getDefaultZoom()×1.35`; strike
  resolution waits `followLeadMs + SLIDE_MS`); `processEndOfRoundRegen`
  re-frames to the overhead so every `+HP/+MP` float reads at once.
- **EOR combat-log de-bloat (2026-06):** the global regen log is a single
  summary line; spawn-zone friendly regen (`processEndOfRoundZonesAndSeeds`)
  no longer logs one `Spawn zone heals NAME (+HP, +MP)` line PER unit — it
  accumulates `_szRegenUnits`/`_szCleanseUnits` and logs one
  `🏠 Spawn zones restore N units…` line (per-unit `+HP/+MP` floats + subtitle
  dialogue still show on the board). The round-start subtitle/log is now
  `⚡ Round N — Fight!` (was "Blitz!"); the bottom subtitle bar mirrors the
  latest combat-log line (`_renderDialogueBox`), so that one string drives both.
- **camera._busy lifecycle (STALL TRAP):** `_waitForAnimationsThen` polls
  `camera.isBusy()` (8s max per wait). `boardCameraResetTimer` is a SHARED
  slot that any pan/reset/focus cancels — never park a busy-release there or
  `_busy` strands true and every AI action stalls ~8s ("game stalls after a
  spell"). Busy releases must live on `camera._busyTimer` (every setter of
  `_busy=true` installs its own release; ownership transfers re-install).
  Verified with an injected `camera.reset()` race mid-spell.
- **User-held camera + turn change:** while the user holds a camera drag,
  `state._userPanning` must be true so `selectUnit` defers its activation pan
  into `state._deferredTurnPanUnitId`; each drag-release handler consumes it
  (pans to the new active unit). The right-button pan and touch paths always
  did this; the middle-button tilt/yaw drag didn't (fixed 2026-06 in state.js
  — it left the camera wherever the drag ended when a turn started mid-drag).
- **`state.thirdPersonCamera` is DEAD** (never assigned; leftover guards remain
  in state.js input handlers only — battle.js's guard was removed). The 2D
  overlay "Cin" toggle (`state.cinematicMode`, `playCinematicAttack`) is a
  separate, still-live feature.
- **Harness:** `node playtest_camera.js` (needs server on :3000) plays a TDM,
  records tilt/yaw around attacks in 3 phases (cinematic P1, cinematic CPU,
  default) and screenshots to `shots/cam-*`. It serves the LOCAL
  battle.js/ai.js/ui.js via `LOCAL_ASSETS` so repo edits are testable before
  the R2 upload. NOTE: setting `controllers={1:'ai',2:'ai'}` mid-match STALLS
  (no attacks, `_blitzActiveUnitId` null) — use a local side or dev-sim to
  drive soaks.

## Elevation / heights — ONE WORLD SPACE (2026-06-13 unification)
The 3D world (three-renderer.js) draws **1 height level = 1 full tile**
(`ELEV_STEP_RATIO = 1.0`, cube voxels). Historically the rest of the code still
used the legacy half-tile ratio, so spell VFX landed HALF-height (inside cliffs,
a full tile under flyers) and the camera focused below airborne units. Now:
- **`window._getElevationPx(h)` (ui.js) is THE converter** (h × tileSize × 1.0)
  and matches the renderer + three-camera.js. All VFX (three-vfx-effects.js,
  three-lightning.js, three-vfx.js rain), camera elevZ math (battle.js), and
  DOM overlays go through it. NEVER hand-roll `h * ts * 0.5` again (stragglers
  fixed in hud.js move-arrow preview + three-vfx.js `_rainTileTopY`).
- **Game LOGIC heights stay half-tile-based**: building `_gameHeight` is
  `floor(roofPx/(ts*0.5))` (LOS/roof-standing unchanged). Both prism builders
  (ui.js `_buildBuildingPrism` + three-renderer's) now write IDENTICAL
  quantized `_gameHeight`/`_roofZPx` (they used to disagree — whichever ran
  last won, randomly shifting roof-standing VFX/units).
- Because `_roofZPx = _gameHeight × ts × 1.0`, level-based math
  (`_getElevationPx(getHeightAt(x,y))`) ≡ px-based (`tileElevationZ`,
  `ThreeRenderer.tileTopY/unitSurfaceY`). `playtest_heights.js` asserts this.
- **Aim height**: `ThreeVFXEffects.unitZBoost()` is now a FIXED torso anchor
  (ts × 0.45; same in three-lightning chainBolt). It used to scale with the
  camera tilt (diorama hack) so projectiles aimed at feet from overhead.
- Flying = `canFly(unit) && isUnitAirborne(unit)` (map.js; SKY_RACES, psychic,
  jetpack accessory; airborne = unit.z > getHeightAt). Renderer/VFX/camera all
  use `unit.z` levels for airborne, terrain+roof otherwise. Parties roll
  jetpacks/sky races often — airborne units appear in normal matches.

## Action camera framing — REVERTED 2026-06-13 (DO NOT REDO)
The two "framing fixes" below were REVERTED: in practice they ruined the good
closeup over-the-shoulder action cam and made matches start zoomed way out.
The camera now matches the 2026-06-10 (good) behavior. Keep it that way:
- **`ThreeCamera.setBaseDist` stays init-ONLY** (three-renderer.js line ~6045,
  `sqrt(w*w+h*h)*1.2`). The "refresh baseDist on every canvas resize" tweak in
  renderFrame was REMOVED — re-applying baseDist with the full-screen canvas
  dims yanked the steady-state view far out, so every match opened zoomed out.
- **`_playCineActionShot` uses the simple framing**: `f = min(0.62, 0.32 +
  0.8/(dist+1))`, `zoom = min(4.0, getDefaultZoom()*max(1.8, 4.4-0.3*dist))`,
  dolly `f2 = min(0.8, f+0.18)` at `zoom*1.08`. The analytic NDC-budget
  pull-back/zoom-out (caster-in-frame model, budget 0.65/0.78, getBaseDist)
  was REMOVED — it pulled the focal off the caster and pushed zoom out, killing
  the tight closeup third-person shot. (`ThreeCamera.getBaseDist` still exists
  but is no longer used by the cine shot.)
The height/projectile-aim work from the same batch (ELEV_STEP_RATIO=1.0 in
ui.js/three-camera.js/renderer, unitZBoost torso anchor, rain/hud elev px) was
KEPT — only the camera framing was reverted.
- **`node playtest_heights.js`** (server on :3000; uses asset cache +
  LOCAL_ASSETS to serve repo-local edits): asserts renderer-Y ==
  `_getElevationPx` for all units incl. forced-airborne, cine focal elevation
  between the two unit anchors, caster in frame during the held shot (real
  projection through ThreeCamera), and VFX z-args converting to renderer
  space. Quirks: in-page `sleep(100)` samples stretch under swiftshader (use
  the REAL `performance.now` timestamps; nominal labels lie); the target must
  survive the hit or the kill-cam restore ends the shot early; only samples
  with `camera._cineShotId != null` count as "held shot".
- `playtest.js` now honors `USE_ASSET_CACHE=1` (+`LOCAL_ASSETS=...`) too.

## Online / multiplayer (two-browser harness: `playtest_online.js`)
`server.js` is the relay (room codes + ranked queue + D1 ELO); the client glue is
`online.js` (on R2). Authority model: **HOST = Player 1 = authoritative engine;
GUEST = Player 2 = thin client** — guest sends semantic `game-action` intents
(`clickTile`/`selectUnit`/`setActionMode`/`triggerEndTurn`, each with a `_ctx`),
host replays them via `_executeRemoteAction` then `_broadcastState()` (full
serialized state, Set-aware, throttled 50ms). Guest applies host state via
`_applyRemoteState` (preserves local UI keys).
- Entry points (no menu nav needed; they self-connect): `lobbyCreateRoom()` →
  `window._NET.roomCode`; `lobbyJoinRoom()` reads `#lobbyJoinInput`;
  `lobbyJoinQueue()` (uses `_queueTeamSize`/`_queueMode`). `window._NET` =
  {socket, role, myPlayer, roomCode, online, connected, _lockState}.
- Start handshake: guest `applyPartyBuild(false)` (locks + sends party-config →
  sets host `_lockState.guestPartyReceived`), host `applyPartyBuild(false)`, host
  `startMatch()` (gate: `_lockState.host && guestPartyReceived`).
- `node playtest_online.js [friendly|ranked]` drives two real browsers through
  this, plays host=P1 locally + guest=P2 via the real emitters, and **diffs
  host-vs-guest state each step (desync detector)**. Writes `shots/online-*`.
- **CONFIRMED relay layer works:** connect, room-full, party-config relay,
  disconnect detection (`connected=false` + 90s window), and rejoin (new socket
  id) all functioned in testing.
- **BUG FOUND (blocks online match start on procedural maps):** `startMatch` →
  `prepareBattleStateFromCurrentBuilds` (battle.js:9612) → `initMap` (map.js:3139)
  throws **`ReferenceError: sanctuaries is not defined`**. Line 3139 uses bare
  `[sanctuaries[1], sanctuaries[2]]` but everywhere else it's `state.sanctuaries`
  (map.js 2826/2913/2966/3064). **Fix: add `state.` prefix.** Solo vs-CPU misses
  it (uses 8×8 presets); online friendly defaults to map `'medium'` (12×12
  procedural) which hits this branch. NOTE: map.js is on R2 — fix must be applied
  there (or uploaded + re-served) to take effect. Until then the in-match desync
  test can't run (match never starts); the "desyncs" the harness logs pre-start
  are just each client's independent party roll, not a confirmed sync bug.

## Online — 2026-06 session update (match now STARTS; new findings)
- **`sanctuaries` blocker is GONE.** Online friendly on `'medium'` (12×12 procedural)
  now starts cleanly — `startMatch` → battle, no `sanctuaries is not defined`. Either
  the R2 `map.js` was patched or the path changed. The in-match sync test runs now.
- **Relay + state sync CONFIRMED working end-to-end** (via `probe_online.js`): party-
  config relay, P1-turn state-sync (guest correctly mirrors `_blitzActiveUnitId`),
  guest playing P2 through the real emitters, host `_executeRemoteAction`, and turn
  handoff back to P1. In clean probe runs the guest played several unit-turns and
  control returned to P1 — both P1-first and P2-first initiative.
- **`_blitzActiveUnitId` is host-authored ONLY for the host's own (P1) turns.** During
  the REMOTE player's (P2/guest) turn the host often leaves it null; the guest's
  `_applyRemoteState` auto-selects the first available P2 unit into `selectedUnitId`
  (online.js ~2255). So **a guest must be driven off `state.selectedUnitId`, not
  `_blitzActiveUnitId`** (that field being undefined for the remote turn is NOT a
  desync). Fixed in `playtest_online.js` GUEST_TURN + the desync digest (it now only
  compares `active` on the host's turn). This was the cause of the old instant
  "stall + 60 DESYNC" — a HARNESS bug, not a game bug.
- **SUSPECTED real bug — battle-start handoff can be lost with no resend.** The host
  broadcasts each turn-handoff once; `_broadcastState` dedups on `NET.lastSyncJson`,
  so if the guest ever MISSES that single packet there is no retransmit and the match
  deadlocks (`activePlayer host=2 guest=1`, seen intermittently when P2 wins
  initiative). The harness now detects a persistent activePlayer disagreement, forces
  a host re-broadcast (clears the dedup), and logs whether it RECOVERS — confirming
  "missed broadcast + dedup-prevents-resend." Real-fix would live in online.js (e.g.
  periodic full-state heartbeat, or guest-side "I'm behind, resend" request). Couldn't
  repro deterministically in the clean probe (race), but it stalled the full harness.
- **`rejoin-failed` flag** is the disconnect/rejoin probe, a separate area (socket
  reconnect path) — not investigated this session.

## R2 throttling + the on-disk asset cache (`asset_cache.js`)
The game pulls ~35 scripts/styles (~1.3MB; `battle.js` alone ~975KB) from the **public
`*.r2.dev` dev bucket** (rate-limited, NOT CDN-cached) + a few CDNs. Each Playwright
cold-start re-downloads all of them; after ~15 launches the endpoint throttles and
`page.goto` times out (minutes). **Fix shipped:** `asset_cache.js` exports
`installAssetCache(context[, dir])` — a Playwright `context.route` interceptor that
serves those hosts from a local on-disk cache (`.asset-cache/`, gitignored), fetching
each file at most once ever (content-encoding/length headers dropped to avoid double-
decode). Wired into `playtest_online.js` and `probe_online.js` via `mk()`. First run
warms the cache (~124MB incl. sprites); subsequent cold-starts load without hitting R2,
so no more goto timeouts. Page-load in the harnesses now uses `waitUntil:'commit'` +
poll-for-globals (don't wait on `'load'`). **Real-player fix** (out of repo): serve
assets from a real Cloudflare custom domain / CDN instead of the throttled `*.r2.dev`.

## Persistence
This is Claude Code on the web: the container is ephemeral and the repo is cloned
fresh each session. Commit `CLAUDE.md`, `playtest.js`, this file, and `package.json`
to the branch so future sessions auto-load context (CLAUDE.md) and reuse the harness.
`node_modules/`, `package-lock.json`, and `shots/` are gitignored.
