# THE DOOR WHEEL — the DOOR gun as a weapon, the doors as spells, turrets and puzzle tools

*Plan document, 2026-09-25. Nothing built. Covers the explorable world (the walker rooms), story
battles and PvP. PvP gets every new door SPELL but never the capture door (CAPTURE_PLAN.md stays
story-only). Read CAPTURE_PLAN.md (§1–2, §8), docs/notes/door-gun-skate-vehicles.md "THE DOOR GUN"
revs 1–5, docs/notes/champions-combat.md "THE DOOR AGENT rev 3" and "THE SPELL TIERS", and
docs/notes/spells-vfx.md "THE CHAIN REACTION" first — every hook this plan hangs on already exists.
Implementation threads: each phase in §9 is one delivery; append to §11 when you ship one.*

---

## 0. The verdict — what this rework is, in one paragraph

The gun stops being a portal gun with one trick and becomes **a wheel of doors**: every door on the
wheel is one verb the world already understands (push, pull, dash, a lane of wind, a lane of fire,
a volley, a beam, ice, light), and the same door is (a) a spell row on the tier rack in any battle,
(b) a live object in the explored room, and (c) the thing puzzles are built around. Two rules make
it a system rather than twelve gimmicks. **One: a placed door is a STANDING DOOR** — a board object
with a facing, a health bar and a per-round act, exactly like a turret, capped at two per player
(the capture door is not counted), the oldest folding when a third goes down. **Two: every door's
effect is a step in THE CHAIN REACTION** — a door pushes, pulls, burns or freezes THROUGH
`resolveTileArrival`, and a body that arrives in a door's lane mid-chain is acted on at once. That
is what makes "bomb → blowback → gust lane → capture door, all in one resolution" a rule of the
engine rather than a special case. The first two doors the player owns (the SWING DOOR's
predictable two-tile push and the one-way capture door from CAPTURE_PLAN) are the bread-and-butter
capture combo; every later door is a new way to feed a body somewhere on purpose.

What this reverses, on the user's word: DOOR_RACE_DESIGN.md:23 ("Different abilities place
different doors? No. One door object, one set of rules") and rev 3's "never re-add a door-placing
row" (champions-combat.md "THE DOOR AGENT rev 3"). The capture door already re-added a placed door
(2026-09-25); this plan makes placed doors the whole kit. The dormant door engine those revs left
in battle.js (`state.doors`, `placeDoorPair`, `damageDoorAt`, `_structureAt`'s door branch, the
`door` / `doorSlam` / `doorDelivery` / `doorExit` handlers, DOOR_RULES.perTeam's replace-oldest
rule) is exactly the base a standing door needs — nothing is built from zero.

---

## 1. The rules, in one page

- **THE WHEEL** is the door gun's list of doors. In the explored room: hold **MIDDLE CLICK**, a
  radial opens round the crosshair, move the mouse to a wedge, release to select; the selected door
  is what LEFT CLICK fires. In a battle the wheel IS the tier rack: a door is a spell row the Door
  Agent equips (7 slots / 16 SP), fired from the spell menu like any spell; a hold-middle-click
  wheel over the board is a later shortcut (§5.4), never the only way.
- **Every door is UNLOCKED now** (`DOOR_GUN_RULES.allUnlocked: true`). The story unlock hooks (§7)
  are specified and dormant; flipping one flag turns them on.
- **Three kinds of door:**
  - a **SHOT** door appears, does its thing, folds (Swing Door, Door Dash, the Threshold pair);
  - a **STANDING** door stays on its tile with a **facing**, **hits** (3, 4 for a Keyholder), a
    **plate** (health bar, owner colour), and an **ACT** that fires ONCE when placed and again at
    THE DOORS' TURN every round (§3.3);
  - the **CAPTURE** door is CAPTURE_PLAN's item, unchanged, never counted against the cap.
- **THE CAP**: two standing doors per player at a time (`DOOR_RULES.perTeam` 2, a fixed pair
  counts as one); placing a third folds the oldest (`placeDoorPair`'s existing `reason: 'replaced'`
  branch). One placement per unit per turn, 1 AP.
- **Enemies attack standing doors** (`_structureAt` → `damageDoorAt`, one hit per basic attack,
  one per AoE tile hit), the door breaks at 0 and its lane effect stops. Its owner's team cannot
  hit it.
- **THE LANE**: a standing door's effect covers the tiles IN FRONT of its face (`lane` tiles) or a
  radius round it (`radius`), never behind it. The facing is picked at placement (§3.2) and shown.
- **THE CHAIN**: a door's push / pull / slide runs through `resolveForcedSlide` / `applyBlowback`
  and lands through `resolveTileArrival`; a body that ARRIVES in a standing door's lane by any
  means is acted on now by a new resolver step **E′ · THE STANDING DOORS** (§3.4), once per door
  per round per unit. Fire and ice lanes are TERRAIN, so step B already bites them.
- **The world**: the same doors fire in the explored room (§5): a standing door there is a live
  object that pushes kickables and the ball, lights braziers, freezes water, reflects off mirrors;
  its act on a roaming native IS the encounter's strike, and the door **carries onto the board** at
  its room cell when the fight starts (§5.3).
- **Online**: doors ride `state.doors` in the snapshot already; every beat goes through
  `window._doorGeom` / `fireGeometry` (relayed `vfx3d-x`) with primitive extras; THE DOORS' TURN
  runs host-side and relays its VFX like `processTurretVolleys`. The wheel is viewer-local.
- **The user's rule (2026-09-25):** no dev shortcuts reach players — a door's act plays its full
  beat every round, the facing is the player's pick, never auto-picked.

---

## 2. THE DOORS — what is on the wheel and why

### 2.1 The starters (owned from intake, tier I)

| Door | Kind | Tier / SP / MP | Range | What it does |
|---|---|---|---|---|
| **SWING DOOR** (Door to the Face, reworked) | shot | I · 1 · 25 | 3 | Pick an EMPTY tile beside an enemy (the hinge; 8 neighbours). The door unfolds there, its leaf swings THROUGH the enemy: 40 phys + Stagger 1 + **a push of 2 directly away from the hinge** (`resolveForcedSlide(target, dx, dy, getUnitPushDistance(target, 2))`, dx/dy = target − hinge). The direction is the hinge's — the player reads it off the board before the click, the AOE painter draws the two landing tiles. This is the bread-and-butter feed: capture door two tiles behind the target, hinge on the far side, swing. |
| **DOOR DASH** | shot | I · 1 · 25 (the rung-I twin of Swing Door) | 5 | Breaking and Entering's teleport look with no strike: the agent steps into a door on its own tile and out of one on the landing (`_sigDoorPortal3D` twice, `_vfxTeleport`), 1 AP, no damage, the landing runs `resolveTileArrival({ via: 'teleport' })` (a dash INTO a gust lane rides the lane — on purpose). Not an attack, so no opportunity strike. |
| **THE THRESHOLD** (the current portal pair) | shot, room only | — | 160 m | The gun as it ships (revs 1–5: A / B, any surface, the fling, the recall). Stays on the wheel as ONE wedge; LEFT = A, RIGHT = B while it is selected. **No battle row** (the board has Door Dash; a pair on the board is the retired Knock Knock — DOOR_RACE_DESIGN's reasons still hold). The user may remove this wedge later; nothing else depends on it. |
| **ONE-WAY DOOR** (capture) | capture, story only | bag item | 4 | CAPTURE_PLAN.md as built. On the wheel in the room only to PRE-PLACE (§5.3); in a battle it is the bag's DOORS tab, unchanged. |

### 2.2 The destinations (story unlocks; all unlocked now)

Chosen for **distinct verbs** first, then type coverage across the six types, then whether the
place and its ally already exist in the game. Every one is a STANDING door unless marked.

| Door | Place · ally (exists?) | Type · element | Tier / SP / MP | Lane | ACT (on placement, then every DOORS' TURN, then on arrival E′) | In the room (§5) | Puzzle verb |
|---|---|---|---|---|---|---|---|
| **GUST DOOR** | Mt Shasta · the shaman (`prebuilt_shasta`, area `slopes`; natives shaman / bigfoot) | anomaly · wind | II · 2 · 50 | 4 tiles ahead | **The wind tunnel.** Every unit in the lane (EITHER team — the wind picks no side, that is what makes it a tool) slides to the lane's end + 1 (`resolveForcedSlide` along the face, dist = tiles left in the lane + 1; collisions, walls and the chain as ever). 0 dmg. **Launch pad**: cast on a tile a FRIENDLY unit stands on → the door lies flat under them and throws them (`skyThrow`'s landing, up to 3 tiles in the face's direction, chosen); the only flat door. | Pushes kickables, the BALL and the walker along the lane; a floor gust under your feet is a jump boost (the fling's numbers). | Move the ball; cross a gap; reach a ledge (replaces the ledge-snap trick for hard tapes). |
| **ARCHERS' DOOR** | Camelot · King Arthur / Robin Hood (`prebuilt_camelot`, Arthur at the Round Table, Robin Hood's spots) | human · physical | II · 2 · 50 | radius 4 | **The volley.** The nearest hostile unit within 4 (sight through the opening, `doorBlocksSightBetween` rules) takes 3 arrows × 25 phys (the `processTurretVolleys` pattern: the laser paint during the round, the volley at the turn, credited to the caster). No displacement — this is the door that punishes a body you have pinned in a lane. | Volleys the aimed native → the strike (§5.3). | Cuts a rope / a hanging target (a shot that starts a swing). |
| **HELL DOOR** | Hell · the demon princess (`prebuilt_hell`, the pit; `demon princess` is a race — she becomes the named ally of the unlock beat, §7) | unholy · fire | III · 3 · 75 | 3 tiles ahead | **The lava tongue.** The lane's tiles become BURNING terrain for 2 rounds (`TERRAIN_RULES` burning, the existing `fire` tile) and every unit in it takes 45 fire + Burn 2. Arrivals need no E′ — step B THE GROUND already burns a body knocked onto fire. | Lights braziers / campfires (`brazier`, `campfire` procs gain a `lit` state), melts a FROST block, burns a rope. | Light the thing; melt the thing. |
| **MAW DOOR** | The Void / Singularity · the Watcher (`prebuilt_singularity`, room 0; the moon route for the alien races) | alien · psychic | III · 3 · 75 | radius 2 | **The draught.** Every hostile within 2 is pulled ONE tile toward the door (`aoePull`'s slide, `pullThroughHazards` on — a pull over a bomb sets it off, that is the point); a body that ends ON the door's tile takes 50 alien + Stagger and is spat out the back one tile (the only door whose tile a body can enter; the spit is a slide → the chain). The pull toward a hazard or a capture lane is the play. | Pulls kickables and the ball to it. | Gather the balls; drag a crate onto a plate. |
| **FROST DOOR** | The North Pole · Santa / the Ice Queen (`prebuilt_northpole`, area `village`) | anomaly · ice | II · 2 · 50 | 4 tiles ahead | **The ice lane.** The lane's tiles become ICE for 3 rounds (water tiles too — frozen water is walkable ice); 30 ice + Chill to units in it. Ice makes every push LONGER: `_resolveIceSlide` today runs only after a walk (battle.js `doMove`); THE CHAIN gains the rule "a displaced body landing on ice slides on in its travel direction" (step B). A swing onto a frost lane sends a body the length of the lane. | Freezes a pool into a bridge; a frost block seals a vent. | Bridge the water; the ice that fire melts. |
| **LASER DOOR** | Cyberpunk city · the gangster / the AI (`prebuilt_cyberpunk`; `gangster` is a race with a casino spot — the "saved the city" beat is §7's) | tech · lightning | III · 3 · 75 | the whole line ahead, to a wall | **The beam.** A straight line from the face until a wall / a shut door; every hostile in it takes 60 tech; **a MIRROR turns it** (`state.mirrors` exists — the Mirror spells' object; the beam reflects off the mirror's facing, one bounce per mirror, up to 3). Allies in the beam are not hit (a laser is aimed, a wind is not). | A red beam across the room; a SENSOR prop that opens a gate when lit. | The mirror puzzle. |
| **LIGHT DOOR** | Heaven · the angel at the pearly gate (`prebuilt_heaven`, `heaven_gate`) | divine · holy | II · 2 · 50 | 4 tiles ahead | **The shaft.** Allies in the lane heal 40 and are cleansed; hostiles take 45 divine + Dazzle 1 (accuracy down); unholy bodies eat the type wheel's ×1.3. The one support door — it makes a lane worth standing in for your side and worth leaving for theirs. | Lights a dark room's lane; a LIGHT SENSOR. | See the thing; wake the thing. |

Type cover: human (Archers), divine (Light), unholy (Hell), tech (Laser), anomaly (Gust, Frost),
alien (Maw). Every door carries `spellType` for the type wheel and an `element` for the affinity
table (fire / ice / lightning are `COMBAT_ELEMENTS`; wind, psychic, holy are neutral).

### 2.3 Not planned, and why (the other five of the user's twelve)

| Idea | Verdict |
|---|---|
| Atlantis water blast | The verb is Gust's (a line push) plus Soaked; Frost already owns the water tiles. If wanted later: a Gust variant that leaves WATER on the lane (douses fire, Soaks) — one row, the same engine. |
| Astral dream pulse | No place of its own (the Astral is four parts of the Looking-Glass site) and no board verb that is not Sleep / Confuse, which zones already do. A `zoneDebuff` door is one row if the story wants the Dreameater's gift. |
| Mt Olympus lightning | There is no Zeus in the game (Olympus's natives are the orb, the cyclops, the chosen one, the minotaur) and Laser owns the beam. |
| Haunted House bats / ghosts AoE | An AoE with no displacement is the generic spell the rest of the roster already has forty of; nothing for the chain to use. |
| Trap house bullets | The same turret verb as Archers; there is no trap house, gang or sewers story (the Underworld hub is Downtown's sewers, the gangster is a race). Camelot has Arthur and Robin Hood on the board today. |

### 2.4 The Door Agent's kit after this (data.js `RACE_ABILITIES['door agent']`)

Rung I `[raceSwingDoor, raceDoorDash]` · rung II `[raceBreakingEntering, raceAirMail]` · rung III
`raceTrapdoor` · rung IV `raceDropIn★`. Door to the Face's id is RETIRED (`raceSwingDoor` replaces
it; `treeLegalSubset` trims stale saves). The seven destinations are **THE WHEEL POOL** — a third
pool part for the race only (`unitSpellPoolParts` gains `gunDoors` when `race === 'door agent'`,
`DOOR_GUN_DOORS` rows with a fixed `tier`; story scope limits it to the unlocked ledger, PvP and
Practice offer all seven). The tier rack shows them as a fourth column, THE WHEEL, under the
race's rows. Still 7 slots / 16 SP: a full destination kit is a real choice (Gust + Archers +
Swing + Dash + Hell = 9 SP with room for the job's four).
The finisher Open House and the `keyholder` passive (`doorHits: 4`) are untouched; the passive's
`doorImmune` keeps the Keyholder out of every door's take and off every lane's slide (a Keyholder
walks through wind).

---

## 3. THE ENGINE (battle.js / data.js / state.js)

### 3.1 The table — `DOOR_GUN_DOORS` (data.js, beside `CAPTURE_RULES`)

```js
const DOOR_GUN_RULES = { allUnlocked: true, standingCap: 2, hits: 3, ap: 1, range: 4, los: true,
  lane: { max: 6 }, actOrder: 'placed', /* the doors' turn walks doors oldest first */
  wheel: { holdMs: 140, slow: 0.15, wedges: 8 } };
const DOOR_GUN_DOORS = {
  threshold: { name: 'The Threshold', kind: 'shot', roomOnly: true, spell: null, wedge: 0, icon: '🚪' },
  swing:     { name: 'Swing Door',    kind: 'shot',     spell: 'raceSwingDoor',  tier: 1 },
  dash:      { name: 'Door Dash',     kind: 'shot',     spell: 'raceDoorDash',   tier: 1 },
  capture:   { name: 'One-Way Door',  kind: 'capture',  spell: null, item: 'captureDoor', story: true },
  gust:      { name: 'Gust Door',     kind: 'standing', spell: 'gunGustDoor',    tier: 2, lane: 4, act: 'lanePush',   unlock: { site: 'prebuilt_shasta' } },
  archers:   { name: "Archers' Door", kind: 'standing', spell: 'gunArchersDoor', tier: 2, radius: 4, act: 'volley', unlock: { site: 'prebuilt_camelot' } },
  hell:      { name: 'Hell Door',     kind: 'standing', spell: 'gunHellDoor',    tier: 3, lane: 3, act: 'laneTerrain', terrain: 'fire', unlock: { site: 'prebuilt_hell' } },
  maw:       { name: 'Maw Door',      kind: 'standing', spell: 'gunMawDoor',     tier: 3, radius: 2, act: 'pullIn',  unlock: { site: 'prebuilt_singularity' } },
  frost:     { name: 'Frost Door',    kind: 'standing', spell: 'gunFrostDoor',   tier: 2, lane: 4, act: 'laneTerrain', terrain: 'ice', unlock: { site: 'prebuilt_northpole' } },
  laser:     { name: 'Laser Door',    kind: 'standing', spell: 'gunLaserDoor',   tier: 3, beam: true, act: 'beam', unlock: { site: 'prebuilt_cyberpunk' } },
  light:     { name: 'Light Door',    kind: 'standing', spell: 'gunLightDoor',   tier: 2, lane: 4, act: 'laneLight', unlock: { site: 'prebuilt_heaven' } },
};
function doorGunUnlocked(profile, key) { … }   // allUnlocked || door.hq.gunDoors[key]
function doorGunWheel(profile) { … }           // the wedges in order, sealed ones flagged
function doorGunLaneTiles(door) { … }          // pure: the lane / radius / beam tiles from x,y,faceX,faceY
```

Each `spell` is a row in `SPELL_LIBRARY` with `kind: 'doorDeploy'` (standing) or its own kind
(`swing` = `damage` with `hinge: true`; `dash` = `teleport` with `doorGun: true`), `doorGun: true`
(the shot from the hand, `TRAVEL_HANDLERS.doorGun`), `door: '<key>'`, `spellType`, `element`,
`range` 4, `apCost` 1, `cooldownRounds` 0 for a standing door (the cap is the limit, not a
cooldown; a shot door may carry 1). `spellTierOf` reads `DOOR_GUN_DOORS[key].tier` for a wheel-pool
id (the off-tree fallback today is the MP ladder — add the door read before it).
The unlock ledger: `door.hq.gunDoors = { gust: 'YYYY-MM-DD', … }` on the profile
(`mergeProgressBlobs` earlier-day-wins, `hqDoorSyncFold`, `ACH_MERGE_CAPS.gunDoors`; **ship data.js
to Render** when it lands — the sync validates keys).

### 3.2 The record — `state.doors` grows one kind

```js
{ id, pairId: id, kind: 'standing', door: 'gust', x, y, z, open: true,
  faceX, faceY,                       // the lane's direction, a unit vector (8 directions)
  hp, maxHp,                          // doorMaxHits(unit): 3, 4 for a Keyholder
  owner, ownerId, spellId, placedRound, fixed: true,
  actedRound,                         // the doors' turn stamps it; the placement act stamps it too
  laneStamps: {},                     // unitId → round: E′ once per unit per round
  _revealAt }                         // the renderer skips it until the comet lands (the capture door's field)
```

- `doorAt` / `doorTwin` / `doorStepThrough`: a standing door has no twin (`pairId === id`, the
  capture door's own rule); `doorBlocksMove` false (it stands open — a body can be pushed THROUGH
  its tile; the Maw is the one door that acts on a body ON its tile); `doorBlocksSightBetween`
  false.
- **Placement** — `doorGunPlace(unit, key, x, y, faceX, faceY)`: `doorTileFree` + `CAPTURE_RULES`'s
  tile rules (no bomb / trap / mine / object under it, not lava / deep water, LOS, never the
  placer's own tile) → the standing cap (`doorStandingOf(player)` excluding `kind: 'capture'`,
  pairs counted once; at 2 the oldest folds with `raceGunDoor:fold`) → the record → the shot
  (`raceDoorGun:shot` from the hand, `_revealAt` after the comet, then `raceGunDoor:<key>:open`)
  → **the placement ACT** (§3.3) with `fxDelayMs` = the comet + the unfold.
- **The facing** is the player's pick, two clicks: the tile, then a direction. hud.js's
  `directional` pattern (`SPELL_KIND_META`) already takes a direction click for `linePush`; the
  door's aim is `tileTargeted` + `facing: true`: after the tile click the painter draws the lane
  from that tile for the 8 directions on hover, the second click confirms, ESC / right-click backs
  out to the tile pick. **Default direction = away from the placer** (the shot line), shown first,
  so a quick double-click places a lane pointing the way you shot. The CPU's placer (§6) picks
  its own. A radius door (Archers, Maw) skips the second click (no facing).
- **Legal tiles painter**: `doorGunLegalTiles(unit)` = the capture door's list (`captureDoorLegalTiles`
  generalised — one function, a `kind` arg), painted by ui.js's placement painter; the lane preview
  on hover (`doorGunLaneTiles`) in the door's colour.

### 3.3 THE DOORS' TURN — `processDoorActs(player)`

Runs at the round transition for the door OWNER's team, in this order beside the existing
end-of-round work: **turret volleys → THE DOORS' TURN → the capture hold tick**. (Doors act before
the hold tick so a lane that feeds a capture door this round is taken this round; the volley's
camera tour pattern is the model.) Oldest door first (`actOrder: 'placed'`). Each act:

| `act` | What fires | Chain entry |
|---|---|---|
| `lanePush` (Gust) | for each unit in the lane, nearest the door first: `resolveForcedSlide(u, faceX, faceY, tilesLeft + 1, { byUnit: owner, label: 'the gust' })` — the far body first so nobody is a cushion for the one behind | the slide's own landing → `_applyKnockbackHazard` → `resolveTileArrival` |
| `volley` (Archers) | nearest hostile within `radius` with sight → `applySpellDamage` ×3 arrows (the turret's `dmg + rand` shape, physical, credited to the caster) + the `raceGunDoor:archers:volley` recipe | none (no move) |
| `laneTerrain` (Hell, Frost) | `applyTerrainDeform`-style set of the lane's tiles to `fire` / `ice` for `terrain.rounds` (the existing timed-terrain path `expireTerrain` on zones is the model: a `_doorTerrain` list with an expiry round, restored at expiry), then the damage + status to every unit in it | step B on every later arrival; Frost's ice slide rule (§3.4) |
| `pullIn` (Maw) | every hostile within `radius`, farthest first: one tile toward the door (`aoePull`'s slide with `pullThroughHazards`); a body ON the door's tile: 50 + Stagger, then a 1-tile slide out the back (`−faceX, −faceY`) | each slide's landing |
| `beam` (Laser) | `doorGunBeamTiles(door, state.mirrors)` — the line to a wall / shut door, turned by each mirror's facing, ≤ 3 bounces; 60 tech to every hostile on it; the `raceGunDoor:laser:beam` recipe draws the bent line | none |
| `laneLight` (Light) | allies in the lane: heal 40 + cleanse (`STATUS_DEFS` `kind: 'debuff'` rows); hostiles: 45 divine + Dazzle 1 | none |

Every act runs on the host only, its VFX through `_doorGeom` (relayed), its damage through the
ordinary damage path (floating numbers, kill credit, `checkWin` once at the end of the turn's
loop). A door with `hp <= 0` never acts. The user's rule: the act plays its full beat every round
(the volley's camera tour, the gust's slide tween) — no fast-forward, ever.

### 3.4 THE CHAIN — step E′ and the ice rule

In `resolveTileArrival`, after **E THE ZONES** and before **F THE VORTEX**:

```js
fired += _chainStandingDoors(unit, opts);   // E′ · THE STANDING DOORS: a lane acts on the body now
if (moved() || unit.hp <= 0) return fired;
```

`_chainStandingDoors`: for every standing door whose lane / radius holds the tile and whose
`laneStamps[unit.id] !== state.round` and `hp > 0`: stamp, then run THAT door's act for THIS unit
only (`lanePush` → the slide along the face; `pullIn` → one tile in; `beam` / `volley` / `laneLight`
→ their hit; `laneTerrain` → nothing, the terrain is already under the body and step B bit it).
A slide re-enters the resolver at depth + 1 (`CHAIN_RULES.maxDepth` 8 holds; a gust into a gust
into a capture door is depth 3). The vortex's stamp rule is the model (`unit._vortexStamps`).
The ICE RULE (Frost): step B gains "a body arriving on ice with `via !== 'move'` keeps sliding in
its travel direction" — `_resolveIceSlide` takes an explicit direction (today it reads the walker's
facing after a walk), called with the slide's `dx, dy`; the slide's landing re-enters the resolver.
A Keyholder (`doorImmune`) is skipped by E′ entirely.
The order contract, written into the resolver's header comment: **A sky · B ground · C pickups · D
fuses · D′ one-way door · E zones · E′ standing doors · F vortex · G rune.** A capture door
before a standing door means a body that lands ON a capture door is taken before any lane can
move it off (the capture is the terminal of every chain).

### 3.5 The shot doors

- **Swing Door** (`raceSwingDoor`, `kind: 'damage'`, `hinge: true`, `pushDistance: 2`, dmg 40,
  Stagger 1, range 3): the aim is an EMPTY tile adjacent to a hostile (the painter: legal hinge
  tiles = empty tiles with ≥ 1 hostile neighbour; hovering one highlights the victim and its two
  landing tiles). `doSpell`'s `damage` branch with `hinge` resolves the victim as the hostile
  adjacent to the hinge nearest the caster's aim (one hinge, one victim — a hinge with two hostile
  neighbours takes the one the cursor was nearer, shown before the click), and the push direction
  is `victim − hinge` (not `victim − caster`, the `pushDistance` default at battle.js ~2356 — a
  `pushFrom: 'hinge'` read there). The door: `raceDoorGun:shot` to the hinge + `_sigDoorSwing3D`
  (Door to the Face's recipe, the leaf swinging through the victim's tile).
- **Door Dash** (`raceDoorDash`, `kind: 'teleport'`, `doorGun: true`, range 5, `apCost` 1, no
  damage): the teleport branch as is; the look is Breaking and Entering's two doors
  (`raceBreakingEntering:door` at both ends, the gun's shot to the landing first). `SPELL_ANIM_VERBS`
  routes it to the quick-draw clip.
- **Breaking and Entering** moves to rung II as Air Mail's twin; its row is untouched.

---

## 4. THE LOOK (three-renderer.js / three-vfx-effects.js)

- **The frame** is `_buildDoor3D` with `kind: 'standing'` → the capture door's dress
  (`_captureDoorDress`: the jamb lamps, the plate, the glow pool) in the DOOR's colour
  (`DOOR_GUN_DOORS[key].color`) and a **per-door aperture**: the pane shows the destination —
  Gust a cloud (`white_cloud` proc behind the pane, drifting), Hell the lava glow + `brazier`
  flames, Frost a blue-white pane + ice motes, Archers a stone arch with two
  `arrow` models nocked in the lamps, Maw a black pane with an inward mote pull (the capture door's
  void, inverted), Laser a neon-edged pane (`plasma` gun's glow sheet), Light a white pane with
  god-rays. Every prop is an existing Meshy model per MODEL_INDEX.md's same-thing rule; nothing new
  is generated for the first delivery.
- **The lane** is painted on the board while the door stands: a faint lane decal in the door's
  colour (the AOE grid pattern from the look pass), brighter for its owner; the beam is a real line.
- **The acts** are recipes on the geometry registry (`raceGunDoor:<key>:open / act / fold / hit`,
  three-vfx-effects.js "THE DOOR AGENT'S DOORS", `_sigRunOwned` + `_fxDelay`): the gust a
  ribbon of wind sprites down the lane + leaves; the volley three `arrow` models on arcs from the
  opening; the lava tongue the fire tile's own flames rolling out; the frost a rime spreading tile
  by tile; the maw the void pull + a bite; the laser the lit beam (the craft kit's beam) with
  reflection kinks; the light a shaft with motes. Real lights, particles, tracers — no backdrop.
- **The plate**: the capture door's `tp-tower-plate` (hits + the door's name, owner colour); the
  hit flash on `damageDoorAt`.
- **The tile card** (hud.js `_tileQuickObjectInfo`): the door's name, hits, its lane in words, its
  next act ("acts at the end of the round").

---

## 5. THE WORLD (map.js / three-renderer.js / data.js — the explored room)

### 5.1 THE WHEEL (the UI)

- **Hold MIDDLE CLICK** (`e.button === 1` in `H.onMouseDown`, free in the HQ today — the boom's
  zoom stays on the scroll itself) for `wheel.holdMs` → `#hqWheel` (map.js, a DOM radial over the
  canvas, the LIVE_ACTION_PLAN §2.3 shape): one wedge per door on `doorGunWheel(profile)` (sealed
  wedges greyed with the place's name — "DOOR TO CAMELOT · not yet"), the pointer released, the
  world slowed to `wheel.slow` while it is open (the walker + the natives tick on the slowed dt;
  the room never pauses — the user's world keeps breathing). Move the mouse to a wedge, RELEASE
  the middle button to select; the gun's selected door shows on the strip pill (`#hqPortal` →
  `#hqGun`, the door's icon + name) and on the ghost's label. Number keys are NOT bound (the pinned
  `q || p` key line in `_hqKeyName` — add nothing before it for the wheel; the wheel is the mouse's).
- **The gun's modes** (`H.gun.door`): `threshold` = revs 1–5 exactly (LEFT A, RIGHT B, F recall);
  every other door = LEFT CLICK fires it at the aim, RIGHT CLICK **turns a standing door's facing**
  before the shot (the ghost's lane arrow rotates 45° a click; default = away from you). The ghost
  is `_hqPortalGhost` re-dressed per door (the frame + a lane arrow on the floor).
- **F** still draws / holsters; drawn + the wheel's door selected = the aim as today
  (`_hqPortalAim`'s march; the surface rules of §8 apply per kind).

### 5.2 THE LIVE DOORS (the room's standing doors)

- `H.gunDoors = [ { key, x, y, z, face, hp, hits, at } ]` — viewer-local, nothing on `state`,
  saved on the profile like the portal pair (`door.hq.gunDoors.placed`, `hqGunDoorPlace` /
  `hqGunDoorClear` — cleared on a fresh arrival from Play like `hqPortalClear`). The same cap: two,
  the oldest folds. Built by `_hqGunDoorBuild` (the portal's frame path `_hqPortalBuild` with the
  battle dress) as a FREE box-wall record with three blocker discs (a standing door is a wall from
  behind, an opening from the front — the portal's wall-door rule).
- **The act, live** (`_hqTickGunDoors(dt)` from `_hqFrame`): a standing door acts on a **period**
  (`HQ_GUN_RULES.actMs` 2 500 = `HQ_LIVE_RULES.roundMs`, the live plan's round) and **on arrival**
  (a body / kickable entering the lane, `_hqGunDoorLaneHas`): the gust pushes the walker
  (`pl.mvx / mvz` through `_hqTickCarry` — the carry the portal already has), every kickable and
  THE BALL (§5.4) along the lane at `HQ_GUST_MS` 6 m/s; the maw pulls them in; the hell door lights
  what is in its lane; the frost door freezes the lane's WATER (`_hqSurface`'s fluid → a walkable
  ice slab prop for `frost.ms`); the laser draws its beam to the wall (mirror props turn it); the
  light door lights the lane (a real SpotLight — one per light door, two doors max). A native in a
  lane is §5.3.
- **The room is the board**: a lane is `lane × HQ_CAVE_CELL` (1.75 m) long — the same tile the
  live plan converts with, so a door reads the same size in the room and on the board.

### 5.3 THE ENGAGEMENT + THE CARRY-OVER

- A door's act touching a **roaming native** (the gust's push, the volley's arrow, the beam, the
  lava) is **THE STRIKE**: `_hqEncounterFire` for that native (its group / swarm with it, the
  existing rules — wild rooms only, never online), with `opening: { door: key, dmg, status,
  shove: { dx, dy, n } }` on the launch. `hqEncounterLaunch` applies the opening on the board
  after the seats: the damage lands on the native's unit (floating number, no clip), the shove is
  `resolveForcedSlide` from its seat (the chain runs — a native gusted into a pre-placed capture
  door on the room floor is taken on the fight's first frame; this is the user's "engage them
  with the door").
- **The doors carry over**: at the launch, every live standing door (and a pre-placed capture
  door) inside the field window maps to its cell — `hqFieldTransform(board).cellOf({x, z})` — and
  is placed on the board as a `state.doors` record (`kind: 'standing'` / `'capture'`, the owner =
  the player, `hp` = its room hits, the facing snapped to the nearest of 8) BEFORE the seats
  (`hqEncounterSeats` reads `doorTileFree` so nobody seats on one). A door outside the 8×8 window
  stays in the room (it is still there after the fight). After the fight the room's doors are
  rebuilt from the profile with the hits the board left them (a broken door is gone).
- **Pre-placing a capture door** in the room (the wheel's ONE-WAY wedge, story only): the bag's
  item is SPENT at placement as in a fight; it stands until the next fight in this room carries it
  over, or the room is left (the item is refunded when you leave the room without a fight — a
  door is never lost to a wrong room). The one-per-player rule holds.

### 5.4 THE PUZZLES (the room's objects that doors talk to)

New pure rows in `DOOR_HQ.rooms[id].puzzles` (authored per room, data.js) and three prop kinds:

| Object | Behaviour | Doors that move it |
|---|---|---|
| **THE BALL** (`HQ_KICKABLE` gains `ball`, `puzzle: true`, a stone sphere — a `boulder`-class proc at 0.6 m) | rolls (the kickable physics with lower friction, a rolling spin), remembered per room while the puzzle is unsolved (unlike cosmetic kickables) | Gust (pushed along the lane), Maw (pulled), Swing (a kick), the walker's own kick |
| **THE SOCKET** (a floor plate prop, `socket`) | solved when the ball rests in it ≥ 1 s; fires `puzzle.reward`: a gate opens (`link.gated` cleared for the visit), a find drops (a `hard` tape's twin), a stash | — |
| **THE BRAZIER** (`brazier` / `campfire` procs gain `lit`) | lit by Hell; a room's `puzzle: { kind: 'light', braziers: [...] }` solves when all are lit | Hell (lights), Frost (puts out) |
| **THE FROST SLAB** (a frozen pool) | a pool's surface freezes for `frost.ms`; the walker crosses; melts under Hell | Frost / Hell |
| **THE SENSOR** (a wall eye, `sensor`) | solved while a Laser / Light beam lands on it; a mirror prop (`mirror`, the Mirror spells' model) turns a beam | Laser / Light |
| **THE LEDGE** | Gust under your feet = the launch — the sanctioned way up to a `hard` tape (the ledge-snap trick stays for now, retired when every hard tape has a lane) | Gust |

First authored set (the delivery's proof): a ball-and-socket in the DOOR garden's shed, a brazier
triad in the Hell pit's approach, a frost bridge in Atlantis' abyss, a sensor-and-mirror in the
cyberpunk noodle bar. Authoring rule: a puzzle names the door it needs and the room's link that
door unlocks from (§7) — a puzzle is never gated behind a door the player cannot own yet.
`hqPuzzleState(profile, roomId)` is the ONE read; solved puzzles ride `door.hq.puzzles` (synced,
`ACH_MERGE_CAPS.puzzles`).

---

## 6. THE AI (ai.js)

1. **Doors are structures to kill**: `_capDoorAttacks` / `_capFreeValue` generalise to every
   hostile standing door — worth = the door's act's threat (a gust aimed at my lane toward a
   hazard or a capture door: high; an archers' door within 4 of my bodies: its volley's damage per
   round × rounds it will stand; a light door: low unless a lane covers their healer) ÷ hits;
   `pickTeamFocus` reads a door that can fall this round the same way it reads a held ally's door.
2. **Lanes are hazards**: `aiHazardPenaltyAt` adds a lane's tiles (gust: `260 × danger of the
   lane's end` — the end tile's own hazard cost, so a lane ending on a capture door is the capture
   door's cost; hell / frost lanes: the terrain's cost; a maw's radius: 60 + the pull's landing's
   cost). `_aiMoveTiles` drops paths that cross a gust lane (the walker's engine path already drops
   capture tiles — the same list).
3. **The CPU Door Agent places doors** (Practice / PvP bots, and the story's Door Agent natives —
   Practice only for the capture item, per CAPTURE_PLAN §7.2): `scoreSpells` gains a placement
   scorer per `act`: a gust whose lane ends on a hazard / off a cliff / on its own capture door
   with a body in it; archers within 4 of the human's cluster and out of reach; a hell lane across
   the human's approach; a maw two tiles from a pinned body. Facing = the best of 8 by the lane's
   landing cost. The imitation lab (`aiScoreMargin`) sees them like any candidate.
4. **The AI feeds its own lanes**: the push / pull scorers' landing forecast reads `_chainStandingDoors`'
   outcome (a shove into a friendly gust lane that ends on a hazard scores the hazard).
Kill-switch `window.EW_AI_NO_GUN_DOORS`; bump `EW_AI_VERSION`.

---

## 7. THE UNLOCKS (dormant while `allUnlocked` is true)

A destination door is EARNED where the place is: the site's STABILIZATION (the marker's three
wins, `hqSiteEarned`) is the default trigger; the ally's line is the delivery. The beat, per door
(all on the profile's `door.hq.gunDoors[key]`, awarded through `hqDoorSyncFold` like a find):

| Door | Trigger | The ally's line (the toast + the codex's door page) |
|---|---|---|
| Gust | Shasta stabilized | the shaman: "The mountain breathes through any door you open. Take the breath." |
| Archers | Camelot stabilized | Arthur, at the Round Table: "Open a door to my hall and my archers will answer it." |
| Hell | Hell stabilized | the demon princess (§7.1): "A door to my father's house. Do not knock." |
| Maw | the Singularity stabilized | the Watcher: no words; the door is simply on the wheel. |
| Frost | the North Pole stabilized | Santa: "Every chimney is a door. This one's cold." |
| Laser | Cyberpunk stabilized | the gangster: "You saved the block. The block's got your back." |
| Light | Heaven stabilized | the angel at the gate: "Leave it open." |

7.1 The demon princess as an ally is new story: DOOR_STORY.md's L2–L6 bands are empty templates,
so the Hell beat is the first destination beat to write — a Part C row in DOOR_MASTER for the
user (does the princess's alliance follow a capture, a fight, or a talk?). The others hang on
NPCs that exist (Arthur, Santa, the shaman, the angel) or on the site alone.
The wheel shows a sealed wedge with the place's name so the player knows a door is out there.
Turning the flag off = `DOOR_GUN_RULES.allUnlocked: false` + shipping data.js to Render.

---

## 8. THE OPEN QUESTIONS — ANSWERED (the user, 2026-09-25: "The cap is per player, only the DOOR agent can fire doors (OBVIOUSLY) and yes wind should push allies too")

1. **Floor vs wall — upright or flat?** NOT ANSWERED; the plan's recommendation stands as the
   default until the user says otherwise: **a STANDING door is always UPRIGHT** (perpendicular to
   the ground, standing on the aim point, facing away from you; a wall hit stands it against the
   wall facing out; a ceiling hit is refused for standing doors). A standing door needs a FACE for
   its lane, and a hatch lying flat has none; upright also reads as a turret. The ONE flat door is
   Gust's launch pad. **The THRESHOLD pair keeps revs 1–5's any-surface flat placement** (the
   fling loop is its whole fun).
2. **Per player or per unit?** **RULED: PER PLAYER.** Two standing doors per player at a time
   (`DOOR_GUN_RULES.standingCap` 2, `DOOR_RULES.perTeam`); two Door Agents on one side share it.
3. **Who fires the doors?** **RULED: ONLY THE DOOR AGENT** ("obviously"). Every wheel door —
   the starters and the seven destinations — is the Door Agent's alone: the wheel pool is offered
   to `race === 'door agent'` only and is EXCLUDED from `flRacePool` (a Freelancer can never
   borrow a door). The capture door stays the bag item any party member fires from the hip
   (CAPTURE_PLAN §3.3) — it is an item, not a wheel door.
4. **Does the wind push allies?** **RULED: YES.** The Gust lane moves every body in it, either
   team (the Keyholder's `doorImmune` aside); the launch pad is the friendly use.
5. **Does the Threshold get a battle row back** (a pair on the board, allies step through)? **No**
   for now (the plan's default; not re-asked).

---

## 9. THE ORDER (phases; each a delivery with its own test; no phase ships a dev shortcut)

| # | Delivery | Files | Test |
|---|---|---|---|
| 0 | **THE TABLE**: `DOOR_GUN_RULES` / `DOOR_GUN_DOORS` / `doorGunUnlocked` / `doorGunWheel` / `doorGunLaneTiles` (pure), the `gunDoors` ledger + merge, the wheel pool (`unitSpellPoolParts`, `spellTierOf`), the Door Agent's tree (Swing Door + Door Dash rows, Door to the Face retired, B&E to rung II), the two shot rows' engine (`hinge` push-from-hinge, the dash), the painter for the hinge, the tier rack's WHEEL column | data.js (R2 + Render), battle.js, hud.js, ui.js, party-builder.js, sprites.js (verbs) | `door-gun.test.js` (pure: lanes for 8 facings, the wheel order, tier reads, `treeLegalSubset` on the old kit) + the rows' schema in content-schema |
| 1 | **THE STANDING DOOR**: the record, `doorGunPlace` + the cap + the fold, the facing pick (two clicks), THE DOORS' TURN with **Gust + Archers** (the two verbs: a lane push, a volley), step E′, the structure attack + the plate, the tile card, `_buildDoor3D` standing dress + the lane decal, the recipes `raceGunDoor:{gust,archers}:{open,act,fold,hit}`, the relay check ("what does the guest see": the door in the snapshot, every beat through `_doorGeom`) | battle.js, hud.js, ui.js, three-renderer.js, three-vfx-effects.js, online.js (skip-list audit only) | vm harness `door-gun-board.test.js`: place → the act → a swing into a gust lane → the capture door takes; the cap folds the oldest; a Keyholder walks through wind |
| 2 | **THE DESTINATIONS**: Hell + Frost (`laneTerrain` + the timed terrain + the ice rule), Maw (`pullIn`), Laser (`beam` + mirrors), Light (`laneLight`); their dresses and recipes | data.js, battle.js, three-renderer.js, three-vfx-effects.js | the harness per act; a beam through one mirror; ice lengthens a swing |
| 3 | **THE WHEEL + THE LIVE DOORS**: `#hqWheel` (hold middle click, the slow, the wedges, the sealed look), `H.gun.door`, the ghost per door + the facing turn, `H.gunDoors` + the profile record, `_hqTickGunDoors` (period + arrival), the kickable / walker push, the strip pill | map.js, three-renderer.js, data.js, index.html, styles-base.css | `hq-gun.test.js` (the wheel's geometry, the record, the cap) + the offline HQ probe (`playtest_gun_offline.js` extended — the user allowed gun probes) |
| 4 | **THE ENGAGEMENT + THE CARRY-OVER**: the act as the strike (`opening` on the launch), doors → board cells at `hqEncounterLaunch`, seats around them, the room rebuild after the fight, the pre-placed capture door + its refund | data.js, map.js, three-renderer.js, battle.js | `hq-encounter` pins: a door inside the window lands on its cell; one outside stays |
| 5 | **THE PUZZLES**: the ball, the socket, the brazier's `lit`, the frost slab, the sensor + mirror, `DOOR_HQ.rooms[].puzzles`, the four authored puzzles, `door.hq.puzzles` | data.js, three-renderer.js, map.js | `hq-puzzles.test.js` (every authored puzzle names an ownable door and a reachable reward — `heavy` if it compiles rooms) |
| 6 | **THE AI**: doors as structures, lanes as hazards, the CPU placer, the lane-feed forecast | ai.js | `door-gun-ai.test.js` (a body never paths through a gust lane ending on a hazard; a bot places a gust whose lane ends on its capture door) |
| 7 | **THE UNLOCKS**: the seven triggers, the toasts, the codex page, the sealed wedges, the Part C row for the princess; ships with `allUnlocked` STILL TRUE (the user flips it) | data.js (Render too), map.js, DOOR_MASTER.md | `hq-purpose` pins per trigger |

`npm run test:quick` before every delivery; the one test that names the phase; `test:full` only
for phase 5 (it touches rooms). Every R2 delivery bumps `?v=` (RULE #1b); data.js goes to Render
at phases 0, 2, 5 and 7 (the ledgers).

---

## 10. What exists, where (so no implementation thread re-searches)

| Need | Already there |
|---|---|
| the gun's aim, surfaces, ghost, sight, viewmodel, shot, recall | three-renderer.js `_hqPortalAim` (~48058), `_hqPortalBasis` (~48093), `_hqPortalFits` (~48210), `_hqPortalGhost` (~48246), `_hqPortalFire` / `_hqPortalPlaceAim` (~48347), `_hqGunFire` (~48375), `_hqPortalBuild` (~48437), `_hqPortalFlight` (~48641), `_hqPortalRecall` (~48840); rules `HQ_PORTAL_RULES` data.js ~43386 |
| the room input (middle button free; scroll = boom zoom) | three-renderer.js `_hqBindInput` ~49683–49822, `H.onMouseDown` ~49742, `_hqKeyName` ~49668 (the pinned `q || p` tail) |
| the encounter's strike + launch + the room→board map | `_hqStrikeClick` ~49646, `_hqEncounterAim` ~49589, map.js `_hqEncounterFire` ~3479, data.js `hqEncounterLaunch` ~43780, `hqFieldWindow` ~46319, `hqFieldTransform` ~44338 (`cellOf`), `hqEncounterSeats` ~44401 |
| kickables (the only room physics) | data.js `HQ_KICKABLE` ~46807, three-renderer.js `_hqTickKicks` ~53276 |
| the board door engine | battle.js `DOOR_RULES` ~54504, `doorAt` ~54506, `doorTileFree` ~54537, `placeDoorPair` ~54621 (the replace-oldest branch), `damageDoorAt` ~54680, `doorStepThrough` ~54693, `_doorGeom` ~54782, `_structureAt` ~55114; the capture door block after it (`captureDoorPlace`, `captureDoorLegalTiles`, `faceX / faceY`, `_revealAt`) |
| the chain | battle.js `resolveTileArrival` ~3699 (A–G), `_chainFuses` ~3862, `_chainZones` ~3913, `_chainVortex` ~3934 (the stamp pattern), `_applyKnockbackHazard` ~3960, `_resolveIceSlide` ~3571, `getPathPickupEvent` ~32384, `finishMoveAt` ~32453 |
| displacement | `resolveForcedSlide(target, dx, dy, dist, opts)` ~4396 (opts ~4381: `byUnit`, `label`, `stopBefore`, `onStep`), `getUnitPushDistance` ~4143, state.js `applyBlowback` ~2089 / `applyAreaBlowback` ~2271, `COLLISION_CONFIG` data.js ~88; kinds `displacement` ~61353, `linePush` ~61437, `pull` ~61612, `swap` ~61827, `aoePull` ~62326, `teleport` ~63727, `pushDistance` at ~2356 |
| turrets (the act-per-round model) | `deployTurret` ~64138, `processTurretVolleys` ~30943 (called ~46239), `damageTurretAt` ~31177 |
| deployed objects, bombs, traps, mirrors, zones, weather | `deployObject` ~62480, bombs ~60590 / `detonateBomb` ~52398, traps ~60708 / `_springTrap` ~52648, `state.mirrors` / `damageMirrorAt` ~31361, `zoneDebuff` ~62893 (`expireTerrain` — the timed-terrain precedent), `WEATHER_REGISTRY` state.js ~1633 |
| the Door Agent | data.js race ~2923, stats ~3737, `keyholder` ~3227, rows ~7431–7455, tree ~17504, `applyTreeRingCosts` ~17702; the tiers ~17880 (`SPELL_SP_MAX`, `spellTierOf`, `treeLegalSubset` ~18011, the Freelancer pools ~17803) |
| the VFX registry + relay | three-vfx-effects.js `_spell3DGeometry` ~19025, the door recipes ~25121–25136 (`raceDoorGun:shot`, `raceBreakingEntering:door` → `_sigDoorPortal3D` ~24565, `_sigDoorSwing3D`), `raceCaptureDoor:open` ~25250, `_sigRunOwned` ~9210, `fireGeometry` ~3747; online.js ~2528–2595 (host emit) / ~4325 (guest replay); `TRAVEL_HANDLERS.doorGun` battle.js ~1827 / ~2090 |
| the plate + the dress | three-renderer.js `_buildDoor3D` ~8149, `_captureDoorDress` ~8112–8144, the Cube's plate ~5449 |
| the type wheel | `TYPE_CHART` data.js ~152, `getTypeDamageMultiplier` state.js ~3160, `SPELL_ELEMENTS` / `COMBAT_ELEMENTS` data.js ~400 |
| the places | `PREBUILT_MAPS` data.js ~11918; thresholds ~21376–21427 (Hell 666, Heaven 777, Shasta 14179, Camelot i, North Pole 1225, Cyberpunk 2047, the Singularity 0); natives via `DOOR_TEXT.POINT_OF_ENTRY` ~19169; Arthur ~33745, Robin Hood ~33657 / 33747 |
| the models | MODEL_INDEX.md: `white_cloud`, `brazier`, `campfire`, `arrow`, `pearly_gate`, `plasma`, `ufo`, the door gun `Meshy_AI__0916054803_texture.glb` |
| the middle-click wheel, as planned before | LIVE_ACTION_PLAN.md §2.3 (the DOM radial, the slow, the bind) — this plan builds that wheel for the gun; the live hands can share it later |

Line numbers are the 2026-09-25 clone's (token `20260925-capture-08-cors`); grep the names.

---

## 11. Log

- 2026-09-25 — the plan written; nothing built.
- 2026-09-25 — the user answered §8 (per-player cap, Door Agent only, the wind pushes allies); upright stays the
  default (unanswered).
- 2026-09-25 — **Phase 0 shipped** (`door-gun/ENTROPY_WARS_DOOR_GUN_0.zip`, token `20260925-door-gun-01-cors`):
  the table + the ledger + the wheel pool (data.js), Swing Door (the hinge: `swingDoorResolve`, the push from
  the hinge, the painter) + Door Dash (battle.js, ui.js, three-vfx-effects.js), Door to the Face retired with
  its saves mapped, B&E on rung II, the rack's DOOR WHEEL tag (party-builder.js, map.js). The wheel pool is
  EMPTY until Phase 1 adds the Gust / Archers rows (a door row only joins the rack with its engine). No
  sprites.js / hud.js change was needed (`doorGun` already routes to the quick-draw clip; the target prompt
  lives in battle.js). Notes: docs/notes/champions-combat.md "THE DOOR AGENT rev 4". Test: door-gun.test.js.
- 2026-09-25 — **Phase 1 shipped** (`door-gun/ENTROPY_WARS_DOOR_GUN_1.zip`, token `20260925-door-gun-02-cors`):
  THE STANDING DOOR. data.js adds the two wheel rows `gunGustDoor` / `gunArchersDoor` (`kind: 'doorDeploy'`,
  `door: 'gust'|'archers'`, `doorGun`, 1 AP, range 4; Archers 3 × 25 physical), so the wheel pool now lists them
  for the Door Agent only (a Freelancer's borrow lists never carry them). battle.js "THE STANDING DOORS" (before
  `_structureAt`): the record (`kind: 'standing'`, `pairId = id`, `fixed`, open, faceX/faceY, `laneStamps`,
  ids only), `doorGunPlace` (the cap: 2 per PLAYER, the oldest folds via `breakDoorPair` reason `replaced`),
  `doorGunAimResolve` (the ONE aim: a lane door takes two clicks, the tile then the face, stored in
  `state._spellPick1 {tile: true}`; a radius door one click; only a CPU / auto seat auto-faces, via
  `doorGunBestFacing`), `doorShotLegalTiles` (the capture door's tile rules, generalised; `captureDoorLegalTiles`
  now calls it), the acts `lanePush` (every body in the lane, EITHER team, the far one first, to the lane's
  end + 1, through `resolveForcedSlide`, so the landing runs its own chain) and `volley` (the nearest hostile in
  the radius it can see; the hits land when the arrows arrive), **E′** in `resolveTileArrival` (after E zones,
  before F vortex; once per door per unit per round) and **THE DOORS' TURN** `processDoorActs` (the end of the
  round, AFTER the turret volleys, oldest door first, two camera beats each, never fast-forwarded; the quiet
  paths and the dungeon upkeep resolve in place). A Keyholder (`doorImmune`) is never moved by a lane; arrows
  still hit it. Enemies break a door through the existing `damageDoorAt`, and hud.js adds the tile card and an
  `attack:door` row. The facing painter is in ui.js `updateAoePreview`. online.js: the guest sends the first
  click with the second (`pickX`/`pickY`), and the host seats it. The record rides the snapshot and every beat
  goes through `_doorGeom` (relayed). three-renderer.js: the standing dress (`_standingDoorDress`, lamps, pane,
  plate), the lane decal (`_buildStandingDoorLane3D`), held back while the comet flies (`_revealAt`).
  **Deviation:** the recipes are keyed by the SPELL id, `gunGustDoor:{open,act,hit,break,fold}` /
  `gunArchersDoor:*`, not `raceGunDoor:<key>:*`, so the presentation census credits each row a signature.
  **Also added early:** ai.js gets a basic CPU placer (`doorGunAiPick`: the best gust lane, a volley that
  reaches), so a bot Door Agent is not dead weight; Phase 6 still owns the real AI. Notes:
  docs/notes/champions-combat.md "THE DOOR AGENT rev 5". Test: door-gun-board.test.js.
- 2026-09-25 — **Phase 2 shipped** (`door-gun/ENTROPY_WARS_DOOR_GUN_2.zip`, token `20260925-door-gun-03-cors`):
  **THE GUST STREAM first** (the user: the wind is "a persistent hazard on the field, not just blasting in between
  rounds. If a unit walks into the gust stream it should push them that direction. Immovable units like the kaiju
  and giant should be able to stand in it just fine"): a walk that enters a gust lane stops on the first windy tile
  (`getPathPickupEvent` `gust` → `gustStreamAt`) and E′ blows it; E′ stamps the gust once per CHAIN (`_chainRootSeq`),
  not per round, so every entry is blown and facing gusts cannot juggle a body; **the stream REPLACES the round-end
  blast** (a gust only takes a DOORS' TURN beat when a movable body is still stuck in its lane). Unmoved: colossal
  weight (kaiju, giant, mech, dragon…), flyers, a Keyholder, a held body. The lane is drawn as live wind streaks.
  **THE DESTINATIONS**: `gunHellDoor` (a 3-tile burning lane via `igniteTile`, 45 + Burn to enemies, melts Frost's
  ice), `gunFrostDoor` (4 tiles of timed ice, water freezes, 30 + Slow; **the ice rule** is chain step B′: a body
  displaced onto ice slides on in its travel direction — `resolveForcedSlide` passes `dirX/dirY`), `gunMawDoor`
  (enemies within 2 drawn one tile in; on the door: 50 + Stagger, spat out of the back), `gunLaserDoor`
  (`doorGunBeamTiles`: to a wall / shut door, a PRISM turns it toward the side with more enemies, ≤ 3 turns; 60 to
  enemies only; walking across it burns too), `gunLightDoor` (its side heals 40 + cleanse; the other 45 + Blind).
  **Deviations:** the Light row's element is `light` (the table's `holy` is not a SPELL_ELEMENT); there is no
  Chill or Dazzle status, so Frost slows and Light blinds; Hell's direct blast spares allies (its fire does not);
  mirrors are prisms with no facing, so the turn rule is "toward more enemies, else clockwise". **Also early
  (Phase 6):** ai.js drops move targets whose path enters a stream that would move the unit and prices ending in
  a hostile lane; the placer scores all seven acts. Dresses + recipes in three-renderer.js / three-vfx-effects.js.
  Notes: docs/notes/champions-combat.md "THE DOOR AGENT rev 6". Test: door-gun-destinations.test.js.
