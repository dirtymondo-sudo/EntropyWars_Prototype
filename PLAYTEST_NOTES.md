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
- **Mode resolution:** TDM has a 12-round limit (resolves cleanly + shows a result
  screen); Arena had a 15-round limit but dragged with respawns. "No-contest" voids
  after 20–30 idle rounds — a sign matches stall.
- **matchScores vs matchKills:** TDM/FFA kills live in `state.matchKills`; reading
  `state.matchScores` shows 0-0 and is misleading.

## Terrain elevation buffs (battle.js — measured, June 2026)
Constants near `battle.js:74-76`, applied in `applyDamageToUnit` (~5985) via
`getUnitStandingHeight`:
- **Downhill damage:** attacker higher than target → `damage × (1 + 0.10 × Δh)`
  → **+10% per height level** (`DOWNHILL_DAMAGE_BONUS = 0.1`).
- **High-ground defense:** target higher than attacker → incoming damage
  `− 5 × Δh` (FLAT, `HIGH_GROUND_DEF_BONUS = 5`) — small vs ~hundreds of dmg.
- **High-ground range:** ranged unit (range≥2) standing at h≥2 → **+1 range**
  (`HIGH_GROUND_RANGE_BONUS`, in `getEffectiveRange`).
So elevation's real value is the +10%/level downhill and the +1 range (kiting);
the flat −5 def is minor. **The stock AI mostly ignores it** between fights:
`pickBestMoveTile` weights height at only `moveHighGroundRanged_v1=0.3` /
`moveHighGroundMelee_v1=0.5` vs a distance weight of ×10. It only banks height
in `scoreMoveToAttack` (the move-then-attack tile gets the ×(1+0.1Δh)). Climbing
when it's nearly free is a cheap, underused edge.

## ⚠️ Damage is applied on PROJECTILE IMPACT, not synchronously (~1.4s)
The single most important thing for any automated player: `doSpell`/`doAttack`
return an **animation delay in ms**, and `applyDamageToUnit` (which does the
`target.hp -= dmg`) runs on IMPACT, gated by
`impactDelay = max(sourceHold(~900) + travelMs(~480) + 80, 620)` ≈ **~1.4s**
(`battle.js:~16799`). Consequences:
- Reading `target.hp` right after an action shows STALE (pre-hit) HP.
- The OLD `playtest_smart.js` loops up to 8 actions inside ONE `page.evaluate`
  with no wait → it re-reads full HP → re-fires the SAME "best" spell on the
  same target → wasted AP + inflated logs + the "Dead Eye→X(990)" ×4 with HP
  frozen that looks like a no-op bug. It is NOT a game bug — just measuring too
  early. (Kills still land ~1.4s later.)
- **Correct pattern (what the stock AI's `executeAction` does):**
  `const delay = doSpell(...); setTimeout(finishComputerAction, delay);` — do
  ONE action, wait the returned delay, then re-read/decide. `playtest_claude.js`
  uses one-action-per-step (but its fixed 280ms verify is still too short, so its
  "no-op" counter is a false positive — ignore it; trust the kill count).

## Headless renderer stability
Under `--use-gl=swiftshader`, the page reliably **crashes mid-match** (Playwright
"Target page/browser closed") within ~6–9 rounds in long combats. Harnesses must
wrap every `page.evaluate` and finalize from in-memory counters on crash
(`playtest_claude.js` does this). Matches rarely run to a clean result headless.

## My playstyle vs ai.js, and `ainew.js`
Playtested P1 (TDM 8×8, 4v4) with `playtest_claude.js`. My two edges over the
stock AI:
1. **Hard team focus-fire** — ONE shared target the whole team piles on (stock AI
   only soft-focuses via a team-damage-log priority nudge; each unit otherwise
   hunts its own nearest/highest-priority enemy → spread chip damage on ~1000-HP
   units). Hard focus → kills by round 2–3 (went 3–0, 4v2 by R6 before a crash).
2. **Proactive high-ground seeking** — climb when nearly free (logged h0→2, h3→5,
   h5→6) for the +10%/level + range edge.
`ainew.js` is a surgical drop-in **on top of ai.js** (load it AFTER ai.js): it
wraps `GAME.getAIWeight` to raise the height weights, and overrides `aiTakeTurn`
to take a focus-weighted shot when one exists, else delegates everything
(healing, tower, nexus, CTF, retreat) UNCHANGED to the stock AI. Validate with
`node validate_ainew.js`.

## Persistence
This is Claude Code on the web: the container is ephemeral and the repo is cloned
fresh each session. Commit `CLAUDE.md`, `playtest.js`, this file, and `package.json`
to the branch so future sessions auto-load context (CLAUDE.md) and reuse the harness.
`node_modules/`, `package-lock.json`, and `shots/` are gitignored.
