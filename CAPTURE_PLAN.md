# THE ONE-WAY DOOR — the capture mechanic of story mode

*Plan document, 2026-09-23. Story mode (the encounters and the marker's fights) only — Online and
Practice never see a capture door. Phases 0 (THE RULES) and 1 (THE DOOR ON THE BOARD) are built (2026-09-25); §6 is the order to build the rest in.
Read CLAUDE.md "THE CHAIN REACTION", "THE DOOR AGENT rev 3", "THE PARTY" and "THE BAG'S TABS" first —
every hook this plan hangs on already exists.*

---

## 0. The verdict — is this a good capture mechanic for a tactics JRPG?

Yes, and it is better than the genre's default for exactly the reason the brief gives: a Poké Ball is a
dice roll you buy with an action; the one-way door is a **position you have to engineer**. The
interesting decisions all happen before the capture — where the door goes, which of your ~40
displacement verbs (push, pull, hook, tether, tackle, blowback, the vortex, the ice slide, a teleport,
a collision) gets the body onto it, and whether you can hold the door while their friends try to
break it. That is a tactics-game capture: it rewards board reading, not luck.

Four things in the brief would undo that strength, and the plan changes them:

| The brief says | The problem | The plan does instead |
|---|---|---|
| Captured for **1–3 rounds, rolled**; low HP / statuses "make it more likely" to last 3 | The roll is the Poké Ball again — the player engineers a perfect trap and then watches a die. | **THE SEAL TIME is deterministic** (§2.3): the door shows exactly how many rounds it must hold — 3 for a healthy unit, fewer for a hurt / debuffed / type-matched one, never 0. The player counts it, the enemy AI counts it, and the fight is about who wins those rounds. |
| The unit is "temporarily" captured, then walks out | A captive that always comes back is a stun with extra steps; the capture only "means" something at the moment of victory, so the player is invited to stall. | **Two states** (§2.4): HELD (the door is up, the unit is in the void, its allies can break the door) → after the seal time **SEALED** (gone from the board for the rest of the fight, counts as removed for Wipeout, joins you on victory). A capture is a KILL you have to defend for a few rounds — and a better prize than a kill. |
| Enemies still captured at victory join the roster | Fine as written — it is the SEALED rule above with one generosity: a HELD unit at the moment of victory seals (nobody is left to free it). | Kept. |
| Only one enemy → auto-win or a 1–3 round wait | The wait is the real problem (a stall with nothing to do). | With SEALED as the end state, a lone enemy who steps in seals **at the end of that round** — no ally can come — and the fight is won. That is not a free win: the AI avoids the door (§4), so the player had to force the body in, which is the whole game. On top of that, encounters spawn **at least two** enemies (§5.1) so the door is never the only play. |

Three improvements the brief did not ask for:

1. **The door is a contest, not a timer.** Its HP bar is the enemy's clock; the seal time is yours.
   Their AI will come for the door (§4.2), so a capture far from the action still pulls the fight
   toward it — the player has to hold ground, which is the tactics genre's best verb.
2. **Doors are the bag's own economy, not a spell** (§3.1 answers the item-vs-spell question): a
   limited, purchasable, findable, tiered consumable is the monster-collector loop the party system
   already runs on (the bag, the spoils, the stashes, the Quartermaster). A spell would be free and
   infinite and the strategy would collapse to "always place one".
3. **The capture pays differently from a kill** (§2.6): the unit itself, half the kill's XP, no
   spoils. Otherwise capturing dominates killing on every fight and the door stops being a choice.

---

## 1. The rules, in one page

- A CAPTURE DOOR is a **bag item** (`captureDoor*`, §3). Any story-mode party member USES it on an
  empty tile within the gun's reach (4, line of sight); the shot is the door gun's (§3.3). One door per
  player at a time (a second placement folds the first — `DOOR_RULES.perTeam`'s rule), one placement
  per unit per turn, 1 AP, the item is spent on placement.
- The door stands **open and visible to everyone** — a real catalogue leaf on a D.O.O.R. frame, the
  same look as the Door Agent's board doors. You see straight through it. It is a board OBJECT with a
  health bar (like a turret / the agent's doors: `DOOR_RULES.hits` per tier).
- A door **takes an enemy the moment one arrives on its tile by any means** — a walk (the walk STOPS
  there, like a bomb), a push, a pull, a tether, a drop, a teleport, a knockback, a blowback, a
  collision, the weather, an ice slide: it is a step in THE CHAIN REACTION resolver (§2.2). Never a
  friendly unit, never a flyer in the air, never a unit with `doorImmune` (the Keyholder), never a unit
  inside its post-escape grace.
- Taking = the inside goes BLACK (the void), the body is **HELD**: realm-shielded (no damage, no
  targeting, no statuses — the `exited` status's own rules), no move, no action, still ON the tile
  under the status. The door shows a **HOLD METER**: pips for the rounds still to go (§2.3).
- The captive's allies **attack the door** (a structure attack, the Cube / turret rule). When it breaks
  the captive steps out onto the nearest free tile, Staggered 1, and cannot be captured again for 2
  rounds. The capturer's units can stand in the way: a body blocks the door's tile's neighbours like
  any body, and the door itself blocks nothing (it is open).
- When the hold meter reaches 0 with the door standing, the door **stamps shut** and the captive is
  **SEALED**: off the board for the rest of the fight (no turn, not an enemy to anyone, not counted
  for Wipeout, never freed). The door then folds away and the item is gone.
- At **victory** every SEALED unit — and every HELD one (nobody is left to free it) — is CAPTURED:
  it joins **THE PARTY** if a slot is free and its race is not already on the books, else your
  ROSTER (the on-call list, the account's unlocked units), else (a duplicate race with no room) a
  BOUNTY in gold. At a **loss** every door breaks and nothing is captured.
- **Online and Practice never see any of it**: the item is `story: true`, refused outside story scope
  at the loadout, the hud, the launch and the engine (`isOnlineMatch()` refuses the use).

---

## 2. THE ENGINE (battle.js / data.js / state.js)

### 2.1 The record — one door, no twin

Reuse `state.doors` (synced, ids only, the six reset blocks and the fog key already carry it) with a
new kind, never a second array:

```js
{ id, pairId: null, kind: 'capture', x, y, z, open: true,
  hp, maxHp,                       // the tier's hits (T1 3 · T2 4 · T3 5)
  owner, ownerId, placedRound,
  tier: 1|2|3, type: null|'human'|…,   // a typed door
  itemKey: 'captureDoor',
  held: null | { unitId, seal: 3, sealAt: round, tookRound },   // HELD: the hold meter
  sealed: null | { unitId, race, gender, name, lvl, round } }   // SEALED: the prize
```

Reads through ONE helper block beside THE DOOR (`captureDoorAt(x, y)`, `captureDoorsOf(player)`,
`captureDoorPlace(unit, x, y, itemKey)`, `captureDoorTake(door, unit, via)`, `captureDoorSeal(door)`,
`captureDoorBreak(door, byUnit)`, `captureDoorFree(door)`, `captureDoorHoldTick(player)`,
`captureDoorLegalTiles(unit)`), on `window` and `GAME`. The agent's `doorAt` / `doorTwin` /
`doorStepThrough` must SKIP `kind: 'capture'` (a capture door is not a passage; `doorBlocksMove`
stays false — it is open).

### 2.2 THE CHAIN REACTION — the take

A new step **D′ · THE ONE-WAY DOOR** in `resolveTileArrival`, right after D THE FUSES (a bomb on the
same tile goes off first — a bomb under a door is a trap nobody should be able to build, so the placer
refuses a bomb / trap / mine tile) and before E THE ZONES:

```js
fired += _chainCaptureDoor(unit, opts);   // an enemy's capture door on this tile takes the body
if (moved() || unit._held) return fired;   // a held body reacts to nothing else (the void)
```

`_chainCaptureDoor`: the door at the tile, `door.owner !== unit.player`, not airborne, no
`doorImmune`, no `_captureGraceUntil >= round`, the door not already holding → `captureDoorTake`.
The walk must STOP on the door like a bomb: `getPathPickupEvent` gains a `capture` event
(`completeMoveAlongPath` already stops a walk on a bomb / trap event and hands the landing to the
resolver). A friendly unit walks through its own door as if it were floor.

### 2.3 THE SEAL TIME — deterministic, shown

```js
const CAPTURE_RULES = {
  baseSeal: { 1: 3, 2: 2, 3: 1 },     // rounds to hold by tier, for a healthy unit
  hpSteps: [0.5, 0.25],               // −1 at ≤ 50 % HP, −1 more at ≤ 25 %
  debuffStep: 1,                      // −1 when the unit carries any `kind: 'debuff'` status or hard CC
  typeMatch: 1,                       // −1 when a typed door meets a unit of that type
  typeMiss: 0,                        // a typed door on the wrong type is a plain door (no penalty)
  leadStep: 1,                        // +1 for the encounter's LEAD (the named native — the prize)
  minSeal: 1, maxSeal: 5,
  grace: 2,                           // rounds a freed unit cannot be re-taken
  freeStagger: 1,
  perPlayer: 1,                       // live doors per player
  range: 4, los: true,
  xpShare: 0.5, spoils: false,        // a capture pays half a kill's XP and no drop
  bounty: { 1: 40, 2: 80, 3: 160 },   // gold for a duplicate race with no room
};
function captureSealFor(door, unit) { … }   // pure, data.js, on window — the ONE read
```

The number is computed ONCE at the take and written on the record (`held.seal`); `captureDoorHoldTick`
runs at the round transition (beside `processNexusIncome`) for the DOOR OWNER's team: `seal--`, the pips
update, at 0 → `captureDoorSeal`. A lone enemy (its team has no other body alive and un-held) seals at
the end of the round it was taken in ("nobody comes"). The formula is a table — tune it, never the code.

### 2.4 HELD and SEALED

- **HELD** = status `captured` in `STATUS_DEFS` (the `exited` row's shape: `realm: true`,
  `blockMove`, `blockAction`, `dispelProof`, kind `marker`, a 🚪 glyph, duration 99;
  `isUnitRealmShieldedFrom` already refuses every damage / heal / status / target on it;
  `getNextBlitzUnit` already skips a `blockMove + blockAction` status). The body stays on the tile;
  the renderer HIDES the model (`_holdHidden`, the intro cinematic's own flag) and the door's void
  swallows it (§3.4). `onRemove` = the free (`captureDoorFree` → the nearest free tile, Stagger,
  `_captureGraceUntil`), so a cleanse / a dispel can never let it out (`dispelProof`) — only the door
  breaking or the seal.
- **SEALED** = `unit._sealed = true` + status `sealed` (the same shape) and the body moved OFF the
  board (`x = y = -1`, the exited unit's own "the body stays" rule is wrong here — a sealed unit must
  not block a tile). Every reader that counts a team reads it as gone:
  `getTeamWipeoutCount` / the early-stop reader (`!u._sealed`), `checkWin`'s wipeout, `checkWinConditionOnly`,
  the AI's `visibleEnemies` / focus / threat vision, the HUD's turn clock and party dock (a SEALED
  enemy shows a 🚪 chip on the scoreboard, never a nameplate), `_encFallenEnemies` (a sealed unit is
  NOT fallen — no drop, no defeated-ledger mark), `getRespawnZoneFor` (no respawn: sealed is not dead).
  Tutorial drift: `getTeamWipeoutCount` is a watched function — re-read `three_ways`, re-stamp.
- **Attacking the door**: `doAttack`'s structure branches gain a `capture door` branch (a Cube / turret
  attack with `damageDoorAt` — enemies' doors only, one hit per basic attack, an AoE spell's tile hit
  counts one; `setUnitFacing` after the snapshot like the rest), `_structureAt` reports it,
  `hasReachableTarget` / `attackHasReachableTarget` see it, hud.js `_computeTileActions` gets an
  `attack:capture` `_objAtkRow` (in reach → attack, else move-then-attack). The DOOR OWNER's own team
  cannot hit it (`damageDoorAt`'s owner rule).
- **Victory / loss**: `finalizeMatch` → every HELD door seals on a win; on a loss every door breaks
  (`captureDoorFree`, quiet). `hqPartyAfterMatch(p, { …, captures })` (§2.6).

### 2.5 Placement rules (`captureDoorLegalTiles`)

Empty tile (no unit, no structure, no bomb / trap / mine / deployed object / monument / the Cube /
a nexus or spawn tile is fine), walkable and not lava / deep water / a wall, not a door of any kind,
within `range` with LOS from the placer, never on the placer's own tile. THE CHAIN's rule holds: a
door placed under a unit is refused — you feed a body IN, you never drop the door ON it. The AI
placer (§4.4, later) reads the same list.

### 2.6 The prize — `hqCaptureEnlist` (data.js, THE PARTY block)

`captures: [{ race, gender, name, lvl, tier }]` ride the commit's event. For each, in order:
1. `hqPartyEnlist(profile, { race, gender, cls: hqPartyDefaultJob(race), name })` — a free slot and no
   duplicate race → **joins the party** at the party's level (`HQ_LEVEL_RULES.enlist`), on the SECOND
   SHIFT's first free slot (never displacing the lead).
2. Else → **the roster**: the account's `unlockedUnits`. Ownership is SERVER-owned (the roster lock),
   so the capture is a SYNCED LEDGER first — `progress.hq.captured[race] = 'YYYY-MM-DD'`
   (`mergeProgressBlobs`, the earlier day wins, `ACH_MERGE_CAPS.captured`; `hqDoorSyncFold`; **ship
   data.js to Render**) — and server.js unions `progress.hq.captured` into `unlockedUnits` on every
   economy read / login (the starters' own union rule), `localPurchaseUnit`'s twin `localCaptureUnit`
   on the mirror. `isUnitOwned` then answers true everywhere (the shop says OWNED, the forge in story
   scope offers it, THE PARTY's ON CALL lists it). `hqUnitBuyable` is untouched (a captured race is
   owned, not bought).
3. Else (owned already, no slot) → **the bounty** (`CAPTURE_RULES.bounty[tier]` gold, through the
   commit's local credit / the server pay path the finds use).
XP: a sealed unit's `computeKillXP` × `xpShare` into the pool; no drop, no defeated mark (a capture is
not a defeat — the shop's DEFEAT ONE FIRST still wants a kill; the user may prefer a capture to count
— one line in `hqDefeatedMark`'s call).

---

## 3. THE DELIVERY (the item, the menus, the gun, the look)

### 3.1 Item, spell or button? — an ITEM, with a shortcut

An **item** (the bag, `ITEM_RULES`): it is limited, bought, found and dropped — the loop the story
already runs. Not a spell (free, infinite, a race's); not a fourth button (a button that only works
when you hold an item IS an item row). The ITEMS menu shows it; **THE TILE'S QUICK MENU** shows it
too (§3.2), so it costs no more clicks than a button would.

```js
captureDoor:   { name: 'One-Way Door',      icon: '🚪', kind: 'captureDoor', tier: 1, story: true, max: 4, shopPrice: 120, desc: … },
captureDoor2:  { name: 'Reinforced Door',   icon: '🚪', kind: 'captureDoor', tier: 2, story: true, max: 3, shopPrice: 300 },
captureDoor3:  { name: 'Vault Door',        icon: '🚪', kind: 'captureDoor', tier: 3, story: true, max: 2, shopPrice: 800 },
captureDoor_human … captureDoor_anomaly:    // six TYPED doors: tier 1 with typeMatch −1 (a T2 hold on its own type), shopPrice 200
```

`story: true` = refused outside story scope like `fieldOnly`: `normalizeLoadoutForClass` (battle.js
AND state.js) caps it to 0 unless `state.partyBag` is set, `hqPartyForLaunch` keeps it in the battle
bag, the forge's `allItemKeys` never offers it, `doItem` refuses it under `isOnlineMatch()`. Bag tab:
a new `HQ_BAG_TABS` row **doors** (`hqBagCategoryOf`: `kind === 'captureDoor'`), its own colour on the
blades. `HQ_PARTY_RULES.itemKinds` is untouched (no field use).

### 3.2 The menus

- ITEMS → the door row: the aim is a TILE (the drum reads `PLACE THE DOOR · empty tile within 4`),
  ui.js paints `captureDoorLegalTiles` as placement reach (the Knock Knock painter's path), the click
  → `doItem(unit, x, y, z)`'s new `captureDoor` branch → `captureDoorPlace`.
- **THE TILE QUICK MENU** (hud.js `_computeTileActions`): a `🚪 PLACE CAPTURE DOOR` row on any legal
  empty tile when the unit's bag holds one (the best tier first; a sub-row per tier when more than
  one); out of reach → **move-then-place** through a `findItemApproachTile` twin of
  `findInspectApproachTile` (one walk step, `_moveThenItem` → the WRAPPED `doMove` then `doItem`),
  the `↳ MOVE` note + the approach preview on hover. The enemy-unit menu shows nothing (a door never
  goes on a body).
- A door on the board wears the turret's nameplate rule: a **health bar** (`🚪 2/3`) + the HOLD METER
  as pips when held (`.nb-pips`'s look), owner-coloured; the captive's name under it.

### 3.3 The gun

The placement fires **the door gun's shot** whoever places it: `TRAVEL_HANDLERS.doorGun`'s own
recipe (`raceDoorGun:shot` from the hand — the comet, the muzzle flash, the unfold on the tile,
`doorGunShot` / `doorGunLand`) with the ranged clip (`_attackChainFor('ranged')`); the Door Agent's
`_unitAttachHeld` gun is in its hand already, any other member fires it "from the hip" (the D.O.O.R.
issue gun — no hand model, the comet still leaves the hand; a held-gun clone for every member is a
later polish). Relay-safe by construction (VS-CPU only), still routed through `window._doorGeom`.

### 3.4 The look — the leaf, the void, the seal

- The door: `_buildDoor3D` (the agent's board door — the map's catalogue leaf on the D.O.O.R. frame)
  with `kind: 'capture'` → the leaf standing OPEN at 150° (`leafOpenDeg`), the frame in the owner's
  team colour, an aperture pane at 0 alpha (see-through). Tier: T2 a second jamb lamp, T3 the vault
  leaf (`leaf_vault`). Typed: the type's badge colour on the lamps.
- THE TAKE: a new geometry recipe `raceCaptureDoor:take` (three-vfx-effects.js "THE DOOR AGENT'S
  DOORS" section, `_sigRunOwned` + `_fxDelay`) — the aperture pane goes BLACK over 300 ms (the void),
  a pull of motes into it, the body's model hidden on the strike frame, the pips light. THE SEAL:
  `:seal` — the leaf swings shut, the `stamp` cue, the frame folds away on the comet in reverse
  (`doorGunRecall`'s look). THE BREAK: `:break` — the frame splinters, the pane clears, the body steps
  out. THE HIT: the turret's hit flash + `🚪 n/m`.
- The board door and the HQ's placed doors are different objects; nothing in the walker changes.

---

## 4. THE AI (ai.js)

1. **Avoid the tile** — `aiHazardPenaltyAt(unit, x, y)`: an enemy capture door on (x, y) → `+ 260 ×
   (1 + the seal steps the unit would lose)`; a held door's tile (occupied by the void) is a wall to
   the mover. `tileDangerCost` reads it already; so do the joint move × action search, the safety
   moves and the final ranking.
2. **Avoid being fed** — every displacement forecast already checks the landing for a friendly trap
   (`shoveTo` … `+80`): the enemy's OWN evaluation of a push it would TAKE is `tileDangerCost` of the
   landing (§4.1 covers it); the AI's own push / pull SCORING gains `+ 220` for a landing on ITS OWN
   capture door (§4.4, when natives carry doors) and `− 220` when a slide would drop an ALLY on an
   enemy door (a collision push's second body).
3. **Free the captive** — a new candidate `freeCaptive`: for each enemy capture door holding an
   ally, a structure attack on the door scores `killBase × (held ally's threat output) / seal` — the
   fewer rounds left, the more urgent; a door that would break this turn (hp ≤ the team's hits in
   reach) is a team FOCUS (`pickTeamFocus` reads it before the kill-now rule). The path to the door
   ignores the capture tile itself (the void is a wall) and reads `tileDangerCost` as ever — the
   player's guards make it a fight.
4. **Place doors** (later, phase 6+): natives that are Door Agents / Keyholders carry `captureDoor`
   in their pockets (`hqEncounterLaunch` seeds them); `scoreItem` gains a placement scorer (a tile
   two steps behind the human's nearest pusher's line, or beside an ally with a pull) — the same
   `captureDoorLegalTiles`. The player's party is captured by the same rules (a captured member is
   OUT for the fight, returns after — never lost).
5. The imitation lab (`aiScoreMargin`) sees the item like any candidate; `_candDesc` names it.

---

## 5. THE ENCOUNTERS (the sizes and the swarms)

### 5.1 Never one enemy

`HQ_LEVEL_RULES.group.solo: [1, 2]` (`soloWeights` re-split — 55 % two, 45 % three) and
`roamSize: [2, 3]` as today: **every encounter is at least two bodies**, so a door is never the
whole fight and the player always has a second body to worry about while the first seals. THE
MARKER's fight keeps its line (`group.marker` 4). The lone-enemy seal rule (§2.3) stays for the case
a fight is REDUCED to one (kills happen).

### 5.2 THE SWARM (the last phase)

`HQ_LEVEL_RULES.swarm = { p: 0.18, size: [6, 8], elite: [1, 2], offset: -4, races: [...] }`:
`hqEncounterGroup` rolls a third kind, `'swarm'` — the roaming group's seeded coin (`groupP`) with a
second roll, or a room's authored `swarm: true` spot — of `size` bodies of the LEAD's race (or one of
the SWARM RACES when the lead's is not one: antperson · zombie · ghoul · grey · scarecrow · cultist
(THE GATHERING's key) · jellyfish · glitch · demon · goatman · skinwalker · black goo — a race whose
lore comes in numbers), `elite` of them at the ordinary encounter level and the rest at `offset` under
the party level (`hqEncounterLevels` takes a per-member offset list; the caps `maxBelow` / `maxAbove`
hold). The room shows it: `_hqSpawnRounds` walks the swarm as ONE group on ONE loop (the group
rule, `ch.group`) with the sub `A SWARM OF n`. THE FIELD seats up to 8 per side already
(`hqEncounterSeats` takes `n2`); `hqEncounterConfig`'s cap is 8. XP pool: the swarm's worth is
its bodies' worth (cheap each) + the elites'; a swarm is where doors shine (six bodies, one door, a
tornado). CPU tempo: a swarm's turns are slow — the encounter passes `state.trainingMatch`-style
turbo for the swarm's LOW-level bodies' activations (an option row on `HQ_ENCOUNTER_RULES`).

---

## 6. THE ORDER (phases; each a delivery with its own test)

| # | Delivery | Files | Test |
|---|---|---|---|
| 0 | THE RULES: `CAPTURE_RULES`, `captureSealFor`, `hqCaptureEnlist`, the `captured` / `sealed` statuses, the `captured` ledger + the merge, the item rows + the bag tab, `story: true` at the three loadout gates | data.js, battle.js (normalize), state.js (normalize, the literal) | `capture-door.test.js` (pure) |
| 1 | THE DOOR ON THE BOARD: the record, the helpers, the chain step + the walk stop, HELD → the hold tick → SEALED, the structure attack, the win readers (wipeout / early stop / AI vision / the HUD counts), the loss / win teardown, the commit's `captures` | battle.js, state.js, hud.js (counts) | vm harness: place → push in → hold → break / seal → wipeout |
| 2 | THE DELIVERY: `doItem`'s branch, the placement painter, the tile menu row + move-then-place, the door's nameplate + pips, the gun shot, the three recipes, `_buildDoor3D`'s capture look | battle.js, ui.js, hud.js, three-renderer.js, three-vfx-effects.js | source guards + the VFX smoke harness (new-race-vfx's) |
| 3 | THE AI: avoid, free-the-captive, the displacement forecasts | ai.js | ai harness (a door on the shove landing is refused; a held ally makes the door the focus) |
| 4 | THE PRIZE: the party / roster / bounty on victory, the server union, the local mirror, THE CAPTURES card on the debrief (under THE SPOILS), the return toast | data.js, profile.js, server.js, battle.js, index.html, styles-cinematic.css | hq-party (the enlist paths), a server unit test (the union) |
| 5 | THE ECONOMY: the Quartermaster's shelf + Room 911's hatch stock the three tiers (typed doors at the Quartermaster only), `DOOR_HQ.stashes` rows (a door in Supply Closet 4B, the warehouse, the door garden's shed), `HQ_DROP_RULES` (`captureDoor` 6 · uncommon), a T1 door in every fresh profile's bag (the intake's issue) | data.js | hq-purpose / hq-party pins |
| 6 | THE SIZES + THE SWARM: §5.1 then §5.2; natives that carry doors (§4.4) | data.js, three-renderer.js (the group walk), ai.js | hq-population, party-levels (the per-member offsets) |

Ship data.js to R2 AND Render at every phase from 0 (the ledger's key regex, the server's union,
the item rows the server's loadout validation reads).

## 7. Decisions (answered by the user 2026-09-25)

1. A capture does not need the shop: **a captured race is OWNED at once** ("if you caught an enemy then why would
   you need to buy it in the shop? It should already be unlocked") — data.js isUnitOwned / hqUnitBuyable /
   hqPartyUnlocked read the captured ledger. It is still not a DEFEAT (the defeated ledger is untouched).
2. **Natives never capture the party** ("the capture gun is DOOR technology") — `CAPTURE_RULES.playerOnly`;
   §4.4's native placers are dropped.
3. ONE tuned door (the default taken in Phase 0; the user did not object).
4. **No healing a held unit** (the realm shield).
5. **A lone enemy seals** — at the end of the round, whatever the pips say (`loneSeal: 'round'`).

## 8. Log

- 2026-09-23 — the plan written; nothing built.
- 2026-09-25 — **Phase 0 THE RULES built** (token `20260925-capture-01-cors`). data.js: `CAPTURE_RULES` (the §2.3
  table + `hits` by tier, `types`, `ap`, `loneSeal`), `captureSealSteps` / `captureSealFor` (itemised steps for the
  door's hover), `captureDoorHits`, `captureXp`, `captureDoorItemKeys`, `itemStoryOnly`; four ITEM_RULES rows
  (`captureDoor` T1, `captureDoor2` T2, `captureDoor3` T3, `captureDoorTuned` — **§7.3 decided by default: ONE tuned
  door**, type picked at placement, 300 gold) + their ITEM_META; the bag's **DOORS** tab (`hqBagCategoryOf`: `kind ===
  'captureDoor'`, sorted last); STATUS_DEFS `captured` (onRemove → `window.captureDoorFree`, skipped for a sealed
  unit) + `sealed`; the `hq.captured` ledger (mergeProgressBlobs + `ACH_MERGE_CAPS.captured`, hqDoorSyncFold,
  `hqCapturedRecord` / `hqUnitCaptured` / `hqCapturedMark`); `hqCaptureEnlist` (party → roster → bounty; it returns
  the bounty gold, the commit credits it in Phase 4). **Deviation:** `hqPartyUnlocked` unions the captured ledger, so
  a captured race is enlistable and THE PRUNE never relieves it before the server's union (Phase 4) lands. The story
  gate: `_storyLoadoutOn()` in battle.js AND state.js `normalizeLoadoutForClass` (party bag on, not online), the
  forge's item list (party-builder.js), the random CPU loadout. Nothing sells or drops a door yet. Test:
  `capture-door.test.js`. Next: Phase 1 THE DOOR ON THE BOARD.
- 2026-09-25 — **Phase 1 THE DOOR ON THE BOARD built** (token `20260925-capture-02-cors`), with §7 answered. battle.js
  "THE ONE-WAY DOOR" block after THE DOOR's exports: `captureDoorAt / ById / sOf`, `captureDoorLegalTiles`,
  `captureDoorPlaceCheck` (reasons: story · seat · none · ap · once · holding · tile · item), `captureDoorPlace`
  (the record: `kind: 'capture'`, `pairId === id`, `fixed: true`, `open: true`, tier / type / itemKey / held / sealed),
  `captureDoorCanTake`, `captureDoorTake` (status `captured` SET at 99, AP to 0, Keys dropped), `captureDoorFree`
  (the onRemove: Stagger + grace; the body never moved), `captureDoorSeal` (the unit leaves `state.units` for
  `state.sealedUnits`; a record in `state.captures`), `captureDoorHoldTick` (before `state.round += 1`; a lone captive
  seals), `captureMatchEnd` (first thing in finalizeMatch). Hooks: resolveTileArrival D′ + the held early-out,
  getPathPickupEvent `capture`, isUnitRealmShieldedFrom, doorTwin / doorTeamPairs / doorsBeside skip capture doors,
  breakDoorPair's capture branch frees the captive, doAttack's swing at a held body lands on the door,
  getTeamWipeoutCount skips `_sealed`, `_encXpPool` pays `captureXp` per sealed native, the encounter commit runs
  `hqCaptureEnlist` (the bounty onto the saved profile's gold). **Deviation from §2.4:** a sealed body leaves
  `state.units` instead of sitting at (−1, −1), so no reader (turn order, AI, HUD, renderer) ever sees it. Nothing
  in the UI places a door yet (Phase 2). Test: `capture-board.test.js` (the DOOR block in a vm). Next: Phase 2.
