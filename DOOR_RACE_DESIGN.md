# THE DOOR AGENT — a race built on doors (design, 2026-09-14)

Status: **STAGE 1 SHIPPED 2026-09-14 (local delivery)** — the race, the door
object and all seven abilities are in the engine (see §9 at the end for what
landed, the decisions taken and what is still unseen). Cast dialogue and
flavour lines stay user-authored (DOOR_MASTER A15) — `DOOR_ROSTER_LINES['door
agent']` holds one placeholder line for the user to replace.

---

## 0. The answers first (the user's open questions)

| Question | Decision | Why |
|---|---|---|
| Race or job? | **RACE** — `door agent`, types `['human', 'anomaly']` (the ghost's pairing: people who work at right angles). Jobs stay free: a Closer with the Sniper kit, a recruit Freelancer, a Medic Knox. | The user's instinct is right: DOOR as the race pillar, the two jobs as the officer's training. Homosapien would make every agent the same unit. |
| How do I know which way a door faces? | **Doors do not face.** A door is a tile. Whatever goes INTO one door comes OUT of its twin, aimed at the target you picked — range and line of sight are measured FROM THE TWIN. | Facing is the abstract part. Removing it makes every door read the same on the board and needs no rotation UI. |
| How close must the enemy be? | The full range of the attack, counted from the twin door. Special Delivery is 3 tiles from the twin; the capstone lets any spell use its own full range from the twin. | "The fireball travels its full range out of the other door" — exactly as the user imagined, with no extra rule. |
| Does the door auto-rotate? | No rotation exists. You pick the target; the twin is the origin. | Same as above. |
| Closing mine swings theirs? | Kept, as **Slam** (r2): shut a door, its twin slams everything standing on or beside it. | The user's best idea — a wall you can weaponise at range. |
| The door dimension? | Kept, shrunk to one clear verb: **EXIT** (r3) — the lore's own word. One enemy is off the board for one round and comes back out of the twin. | A second map is a whole engine. One unit vanishing for a round is a status the engine already has (`realm`). |
| How many doors? | **1 pair per agent, 2 pairs per team** (4 doors on an 8×8). A new pair replaces your old one. | Two pairs is enough for a network and not enough to fence the board. |
| Destroyable? | Yes. **3 hits** breaks a door and its twin goes with it. A SHUT door is a wall; an OPEN one is a hole. | The counterplay must be obvious: shoot the door. |
| Different abilities place different doors? | No. **One door object, one set of rules**, and the abilities do things TO doors. | Learnable in one match. Every ability answers "what does it do to a door?". |

---

## 1. Identity

The DOOR agent is a **control skirmisher**: a mobile wall, a private
teleporter, and a striker who hits from angles the board did not have a
moment ago. Weak stats, strong geometry. The agent is never the team's damage;
the agent decides where the fight happens.

- **Types** `human` / `anomaly` · **Faction** TIME (the Department keeps
  continuity — "Continuity is Maintenance"). Reads as anomaly on the type
  wheel: weak to tech, resists human.
- **Base stats** (RACE_BASE_STATS shape, next to homosapien 595/140/70/50/45/28/70/33):

  | hp | mp | atk | def | mdef | int | awr | spd |
  |---|---|---|---|---|---|---|---|
  | 560 | 170 | 62 | 46 | 55 | 50 | 84 | 50 |

  High AWR (they check their corners), average speed, mid everything else.
  The jobs decide whether an agent shoots (Gunslinger / Sniper / Agent), casts
  (a mage job — INT 50 is enough to make Special Delivery magic-scaled
  through the Psychic kit) or heals.
- **Basic attack** kind: `ranged` under the gun jobs as today; otherwise
  `punch` (a Closer's shove).

## 2. THE DOOR (the one object every ability reads)

A door is a **structure on a tile**, placed in pairs. The pair is the unit of
play: place two, break one, both go.

| Rule | Value |
|---|---|
| Footprint | 1 walkable tile, empty, not an objective tile (Cube / Key / nexus centre) |
| Placement | both doors within **3 tiles** of the agent, not adjacent to each other (a pair needs a corridor between it to mean anything) |
| State | **OPEN** or **SHUT**. Placed OPEN. |
| OPEN | passable. A unit that **ends a move on an open door steps out of its twin** (if the twin's tile is free; if not, they just stand on the door). Anyone may use it — allies AND enemies. An open door shows its twin's tile and the 8 around it (you can see through a door). |
| SHUT | a **wall**: blocks movement, line of sight and projectiles for everyone. Shows nothing. |
| Hits | **3** (any basic attack or damage spell = 1 hit, as turrets / mirrors). Breaking one breaks the pair. |
| Cap | 1 pair per agent · 2 pairs per team. Placing a third replaces the oldest pair of that agent. |
| Who toggles | the owning TEAM, through Knock Knock (below) or the passive. Enemies cannot open or shut your doors — they can only break them. |
| Lifetime | until broken or replaced. Doors do not expire. |

Why enemies may use an open door: "A door that can never open is a wall. A
door that can never close is a hole." Leaving a door open is a choice with a
cost, and shutting it is the agent's job. This is where the strategy lives
(decision D1 below if the user disagrees).

## 3. The passive — KEYHOLDER

> *A key to every room.*

- Once per turn, the agent may **open or shut a friendly door they stand on
  or beside** as a **free action** (a HUD verb, no AP, no MP).
- Doors the agent owns have **4 hits** instead of 3.
- The agent is never damaged, pushed or EXITED by a friendly door.

One slot (the race is not a flyer), one `PASSIVE_DEFS` row, priced in
check-grades.js like every Phase 3 passive.

## 4. The tree (the homosapien shape: r1 twin · r2 twin · r3 · r4★ twin)

```
r1  [ KNOCK KNOCK  ⇄  BREAKING AND ENTERING ]
r2  [ SPECIAL DELIVERY  ⇄  SLAM ]
r3    EXIT
r4★ [ THE LONG WAY ROUND ★  ⇄  TRAPDOOR ★ ]
```

Seven slots, one capstone per unit — the fork at each ring is the build
choice: **the setup line** (Knock Knock → Special Delivery → EXIT → The Long
Way Round) plays the network; **the kick-in line** (Breaking and Entering →
Slam → EXIT → Trapdoor) plays the doors as weapons and barely needs a pair on
the board.

### r1 · KNOCK KNOCK (setup)
> *Knock twice. Somewhere, a door answers.*

- `utility`, 1 AP, 20 MP, range 3, two-click: tile A, then tile B.
- Places a pair of OPEN doors (rules in §2).
- **Cast on an existing friendly door** instead: toggles it OPEN / SHUT
  (1 AP, 0 MP, range 4). Its twin does NOT change — each door has its own
  state, so one end can be a wall while the other stays a way in.
- No slot spent: the doors are objects, not the agent's turn forever.

### r1 alt · BREAKING AND ENTERING (kick-in)
> *Nobody said the door had to be yours.*

- `dash` + strike, 1 AP, 25 MP, range 4, needs vision of the target.
- Teleport to a free tile adjacent to an enemy and hit them: **WEAK physical
  (85)**, always counted as a **rear attack** (you came in through a door
  they did not know was there). The agent arrives facing the target.
- The build with no doors: an assassin's opener, the mobility every other
  skirmisher gets from a dash, flavoured. Takes the tier-I spot of Knock
  Knock for players who want to fight, not build.

### r2 · SPECIAL DELIVERY (setup)
> *Signature required.*

- 1 AP, 30 MP. Pick a **friendly OPEN door within 2 tiles** of the agent,
  then an **enemy within 3 tiles of its twin** (line of sight from the twin).
- **MEDIUM physical (105)**, always a **rear attack**, and the target is
  **Staggered**. The package flies out of the twin door.
- This is the Portal attack the user described, as a single spell with no
  facing: the door decides the origin, the player decides the target. The
  full "any spell through any door" version is the capstone.
- Scales with the job's damage stat like a basic attack (ATK, or INT for
  casters) so the race does not force a job.

### r2 alt · SLAM (kick-in)
> *When one door closes.*

- 1 AP, 30 MP, range 4. Target any friendly door; it **shuts**, and its
  **twin slams**: every unit standing ON or ADJACENT to the twin takes
  **WEAK physical (70)** and is **pushed 1 tile away from it** (radial —
  no facing). Both doors end SHUT.
- The user's idea, straight: close a door here, hit someone over there.
  Punishes an enemy about to walk through your door, knocks a Key carrier
  off a zone, and leaves two walls behind. Allies are never hit (Keyholder
  covers the agent; teammates take the push only, no damage — decision D2).

### r3 · EXIT
> *Extradimensional Incident Transfer. Sign here.*

- 2 AP, 45 MP, cooldown 3, range 1 from any friendly OPEN door (the target
  must be standing ON or ADJACENT to one of your doors — the door is the
  weapon, not the agent's reach).
- The enemy is **EXITED** until the start of their next activation: off the
  board — untargetable, cannot act, holds no zone, carries no Key (a carried
  Key drops where they stood). They **return out of the twin door** (or on
  their old tile if the twin is gone), Staggered.
- The door dimension, shrunk to what matters: one body removed from the
  fight for a round, and it comes back where YOU put the other door. Pull
  the tank out of the line; drop the healer beside your team. Countered by
  not standing at doors, which is exactly the pressure a door should exert.
- Never on bosses / the Cube. Standard, MD and campaign alike.

### r4★ · THE LONG WAY ROUND ★ (setup capstone)
> *Every corner in every room is a door.*

- 2 AP, 55 MP, self, 2 rounds.
- While it lasts, the agent may **attack or cast from any friendly OPEN
  door they stand on or beside, as if they stood at its twin**: the range,
  the line of sight and the origin of the attack are the twin's. Every such
  hit is a rear attack. The fireball goes in here and comes out there at its
  full range, which is what the user asked for.
- The whole setup line pays off here: two pairs = four launch points, and
  the agent is standing next to none of the enemies who get hit.

### r4★ alt · TRAPDOOR ★ (kick-in capstone)
> *Do not stand in corners.*

- 2 AP, 55 MP, range 4, needs vision.
- **HEAVY physical (170)** to one enemy; the floor gives way and they
  **drop out of your door farthest from them** (or land adjacent to the
  agent if no door stands), **Staggered**, facing away.
- Burst plus displacement in one cast — a capstone-tier single-target hit
  (Weigh the Heart 180 / Hocus Pocus 180 for scale) that also delivers the
  body to your team.

## 5. How a match plays

**Turn 1** Knock Knock: door A beside the team, door B two tiles short of the
centre zone. The team now has a 1-move road to the objective. Enemy ranged
units start shooting the door (3 hits) — that is three attacks not aimed at a
teammate, and the agent can re-place next turn.

**Mid-game** The agent stands at door A. Special Delivery through B hits the
enemy caster from behind. The enemy melee walks onto B to come through —
Slam: shut, knocked back, two walls now sit on the lane. Or EXIT them: they
vanish for a round and reappear beside your Gunslinger.

**Capstone** The Long Way Round: the agent parks in cover at A and shoots
out of B with the job's whole kit for two rounds.

**Counterplay** (must be obvious or the race is gimmicky): shoot the doors
(3–4 hits, twin dies with it); AoE the door tiles; stay two tiles off any
enemy door (EXIT and Slam both need you at it); walk through their open door
yourself when the agent leaves it open — it works for you too.

**Compared with the roster**: the ghost has flight and Possession, the
telepath levitates, the anubis / skeleton pairs place gates that today do
nothing. The DOOR agent's mobility is slower to set up than a dash and more
fragile than flight, and pays for that with team mobility (everyone uses the
doors), a placeable wall (nobody else has one that toggles), and the only
rear-attack-at-range in the game. Numbers are set at the roster's median so
the geometry, not the damage, wins.

## 6. The cast as agents

All six keep the DOOR pillar; the JOBS make them different units. Dialogue is
the user's.

| Agent | Hand | Suggested jobs | Build |
|---|---|---|---|
| The Player | undecided | Freelancer (the recruit's socket racks) | whatever the player picks — the tree is the tutorial |
| Belle | Closer | Agent / Sniper | Knock Knock · Slam · EXIT · The Long Way Round — shuts every door, shoots through the last one open |
| Knox | knocks first | Medic / White Mage | Knock Knock · Special Delivery · EXIT — the support who lays the road and pulls a friend out |
| Glass | Opener (hidden) | Gunslinger | Breaking and Entering · Slam · Trapdoor — kicks doors in, never places one |
| Dorian | radical Opener | a mage job (Psychic / Wizard-type) | Knock Knock · Special Delivery · The Long Way Round — the network, cast through |
| The Janitor | HINGE | Freelancer, hidden unlock | Keyholder maxed: the Janitor may open, shut and walk through ENEMY doors too ("a key to every room") — a late-game unlock, not the base race |

Later (the user's plan): recruit agents in the building, dress them in the
character creator, and they are DOOR-race units with chosen jobs. The race
sheet above is what makes that possible — nothing about it is per-character.

## 7. Engine notes (what exists, what is new)

Already built and reusable:
- `deployPair` (battle.js ~52942) places `state._gatePairs` — but **nothing
  consumes them**: `usesLeft` is never decremented and no move reads the
  pairs, so Grave Passage (anubis) and Tunnel Network (skeleton) are inert
  today. The door object should REPLACE `_gatePairs`; those two spells then
  become plain door pairs (no toggle, no Slam) and start working.
- `state._deployedObjects` (hp, `blocksMovement`, `_structureAt` makes them
  attackable) is the shut door's body; `state.mirrors` is the precedent for
  a placeable with `maxActivePerCaster` and hp.
- `realm` status (`isUnitRealmShieldedFrom`, Shadow Realm) is EXIT's
  untargetable / no-act half; the two-click cast (`link` / `transfer`) is
  Knock Knock's placement UI; `dash` + `afterShot` is the shape of Breaking
  and Entering; `pull` with a teleport is Trapdoor; `getAttackArc` already
  prices rear attacks.
- Fog: doors are structures, visible like turrets; the "see through an open
  door" rule adds the twin's 3×3 to `computeVisibleTiles` for the owning
  team only (RULE #2 — the guest reads the synced door list).

New (one kind each, all in `SPELL_KIND_META` + a `doSpell` branch + ai.js
score / target + hud.js part + ui.js `_SLB_KINDS`, per the wave rules):
- `door` (place / toggle), `doorSlam`, `doorDelivery`, `doorExit`,
  `doorTrap`; the capstone is a status flag the range + LOS gates read
  (`castFromDoors`: for each friendly open door the caster stands on or
  beside, try the twin as the origin).
- The door object: `state.doors = [{ id, pairId, x, y, open, hp, owner,
  ownerId }]` (ids, never object refs — RULE #2), serialized to the guest;
  movement's end-of-path hook (`finishMoveAt`, beside the pixie-dust and
  goo hooks) does the step-through; `_structureAt` + `damageStructureAt`
  learn doors; the renderer draws the catalogue's `leaf_hollow_core` on a
  frame (the crossing's `_introBuildDoor` already builds one) with an
  open / shut swing and the DOOR sound kit.
- AI: place B toward the objective / behind the enemy line, A beside the
  team; score Slam and EXIT by bodies at the twin; never leave a door open
  with an enemy adjacent to it (shut it with the free action).
- Race tables: the §5.12 list (data.js ×15, sprites.js ×5 — the cast GLBs
  already exist as `DOOR_CAST_MODELS`, server.js ×2, lore ×2), the Heat
  Death ladder's top tier, `npm run test:parity`.

## 8. Decisions for the user

- **D1** Enemies may walk through your OPEN doors (recommended — it is the
  cost of leaving one open, and Slam / EXIT punish it). Alternative: owner's
  team only, which makes doors strictly better and the toggle pointless.
- **D2** Slam and allies: push only (recommended) or no effect at all.
- **D3** EXIT's return: out of the twin (recommended — the agent chooses
  where the enemy reappears) or the same tile.
- **D4** Team cap 2 pairs (recommended) or 1 pair per agent with no team
  cap (four agents = eight doors; too much board).
- **D5** Faction TIME (recommended) or SPACE.
- **D6** The Janitor's enemy-door key: a hidden unlock, or cut.

---

## 9. Build log

### 2026-09-14 — Stage 1 (local delivery, `ENTROPY_WARS_DOOR_RACE.zip`)
**Shipped.** Race key `'door agent'` (label DOOR Agent, types human +
anomaly, faction TIME, default job Agent, class assassin, a starter on both
sides, price 300, home site D.U.M.B., the Player / Agent Belle cast GLBs as
its 3D models, the Agent job sheet in 2D). **Stats retuned** from §1's
560/170/62/46/55/50/84/50 (which priced at 302 against the roster's 249–275
band) to **520 / 170 / 48 / 40 / 50 / 40 / 84 / 46** — "weak stats, strong
geometry", check-grades.js holds the row. Passive **Keyholder** (`doorHits`
4 · `doorFreeToggle` · `doorImmune`). Statuses `exited` (realm-shielded,
no move / act; `onRemove` → `window._doorExitReturn` = out of the twin,
Staggered) and `castFromDoors`.

**THE DOOR** = battle.js "THE DOOR" block (right before `_structureAt`):
`state.doors` (synced; the reset blocks, the state literal, the net
snapshot and the fog cache key all know it), `DOOR_RULES` {hits 3,
pairRange 3, toggleRange 4, perAgent 1, perTeam 2, revealRadius 1, minGap 2},
`doorAt / doorTwin / doorsBeside / doorTeamPairs / doorTileFree /
placeDoorPair / setDoorOpen / breakDoorPair / damageDoorAt /
doorStepThrough / doorCastOrigins / doorCastOriginFor /
_doorOriginForSpell` (also on `window` and on `GAME` for ai.js). A SHUT
door blocks movement at all four occupancy gates and sight in
`isRangeBlockedByTerrain`; an OPEN door shows its twin's 3×3 to the owning
team (`computeVisibleTiles`); `finishMoveAt` steps whoever ends a move on
an open door out of its twin; an enemy door is a structure `doAttack`
hits (one hit; the AoE and line sweeps hit doors too); at 0 the pair
breaks. `deployPair` (Grave Passage / Tunnel Network) now places a FIXED
door pair — those two spells work for the first time.

**The kinds** (`SPELL_KIND_META` + `doSpell` branches + AI scorer / picker
+ HUD parts + library kinds + SIM_DEFAULTS + VFX family aliases):
`door` (Knock Knock — two TILE clicks through `state._spellPick1
{ tile: true }`, online the guest picks locally and the second tile rides
`pickX / pickY`; a click on a friendly door toggles it, 0 MP, and
Keyholder makes that a FREE action once a turn beside the door),
`doorBreach`, `doorDelivery`, `doorSlam`, `doorExit`, `doorTrap`; The
Long Way Round is a plain `buff` whose status lets `doAttack` / `doSpell`
take a twin door as the cast ORIGIN when the direct cast is out of reach
or sight. **The rear-attack rider**: `state._doorRearCast` is armed at
the cast (a `rearAttack` row, or any door-origin cast) and
`applyDamageToUnit` prices the hit as a back attack; a door-origin basic
attack forces `_atkArc = 'back'`.

**Decisions taken (the recommended column of §8):** D1 anyone may walk
through an open door · D2 Slam pushes allies, damages enemies only · D3
EXIT returns out of the twin · D4 two pairs per team · D5 faction TIME ·
D6 the Janitor's enemy-door key is NOT built.

**Not in this stage / unseen (RULE #1c):** the EXITED body stays on its
tile under the status (untargetable, cannot act) rather than leaving the
board — it still occupies the tile and counts for zone presence; a
door-origin cast's projectile / VFX still launches from the caster's
model, only the reach, sight and rear pricing are the twin's; Special
Delivery auto-picks the door (no second click); the door mesh is
procedural (jambs, lintel, a hinged leaf, team seal, hit pips) — no
catalogue leaf yet; no HUD verb for the free toggle (it is the Knock
Knock row); nothing was played in a browser. `npm test` runs
`door-race.test.js` (the tables, the tree, the door object in a vm
sandbox, source guards on every engine site).

### 2026-09-14 — rev 2: THE DOOR IN THE FRAME (local delivery, `ENTROPY_WARS_DOOR_RACE_REV2.zip`)
The user: "why a procedurally generated door when there are numerous
higher-quality door models in the game? Every single door ability needs
to use a door in the spell animation." Both fixed.

**The board door is a catalogue leaf.** three-renderer.js `_buildDoor3D`
no longer builds jambs + a plank: `_doorLeafFor()` = the map's own
threshold leaf (`_introLeafFor(activeGameMode)` — the GLB the crossing
cinematic swung open; `leaf_hollow_core` when the map has none) is fitted
by `_miscModelInstance` + `_hqPropMatPick` (shared Lambert, safe under
`_disposeR`) into a DOOR-issue frame at tile scale (the crossing's teal
metal + stone sill; opening 1.18 tiles ≈ 2.06 m, width from the
catalogue `aspect`), hinged on the catalogue's side (`hinge`), swung
`DOOR3D_OPEN_ANGLE` (1.5 rad) toward +z when OPEN or shut flat; a
`slide` leaf pockets into its jamb; a frame-only leaf (the hell arch, the
bare frame) wears a dark team-tinted pane when shut. The door FACES ITS
TWIN (`rotation.y = atan2(tw.x − d.x, tw.y − d.y)` — the opening is the
corridor's mouth); the team seal (both faces), the light in an open
opening and the hit pips stay. `ThreeRenderer.doorLeaf()` exposes the
leaf so the VFX wears the same one.

**Every ability puts a door in the frame** — three-vfx-effects.js "THE
DOOR AGENT'S DOORS" (right after the capstone registry): the leaf loads
through the weapon-model cache as `door:<leafKey>` (`_doorFxLeafKey`
registers `_WPN_MODELS[key]` with the catalogue URL, axis `y`, the
catalogue `yaw` as the tweak; `warmDoor` on the API — the renderer calls
it whenever a board door is built), `_sigDoorRig3D(tx, ty, { yaw, scale,
lay, down, noWedge })` = frame + sill + the leaf on its hinge + the light
kit (veil / halo / floor wedge) with `setOpen / setLight / setFade /
setRise`; while the GLB streams the rig shows light and no leaf — never a
procedural one. Recipes (all `_sigRunOwned`, all in `_spell3DGeometry`,
fired by battle.js `window._doorGeom(id, x, y, extra)` → `VFX.fireGeometry`
— relayed by online.js `vfx3d-x`, `extra` primitives only):
- `raceKnockKnock` — `_sigDoorKnock3D`: the placed pair (both tiles: the
  sigil, the light through the new door, two knock ripples) and the
  toggle (`toggle` / `open`: a flare when it opens, a red thud when it
  shuts); the door in the frame is the persistent one.
- `raceBreakingEntering:door` — `_sigDoorPortal3D` on the LANDING tile
  facing the victim: the door stands up, flings open, the agent lands in
  the doorway, it slams behind them and fades.
- `raceSpecialDelivery` — `_sigDoorDelivery3D`: the twin doorway flares
  and a taped PARCEL tumbles the arc twin → target in the travel time
  (`ms`); `playProjectile` only when the recipe did not run.
- `raceSlam` — `_sigDoorSlam3D` at BOTH ends: a ghost leaf of light swings
  shut over the standing door (the persistent leaf is already shut), the
  flash, the shock ring(s), the shake (`big` at the twin).
- `raceExit` — the portal in front of the victim, facing the caster:
  opens, takes them, slams, and the red EXIT STAMP lands on the leaf.
  `raceExit:out` — the way back: a door opens on the landing tile and
  shuts behind them (`_doorExitReturn`).
- `raceLongWayRound` — `_sigDoorNetwork3D`: four half-size doors circle
  the agent and open in turn; every friendly open door (`doors:
  "x,y;x,y"`) flares.
- `raceTrapdoor` — the portal LAID FLAT under the victim (`lay`: face up)
  whose leaf swings DOWN into the floor (`down`) on the drop's beat;
  `raceTrapdoor:out` at the far door as they drop out of it.
The impact / teleport / aura aliases in `SPELL_MAP` stay for the HIT.
`npm test` runs `door-vfx.test.js` (the leaf on the board, every recipe,
every fire site). Unseen live (RULE #1c): the leaf's fit in the frame
per catalogue aspect, the hinge side against the swing, the trapdoor's
flat lie on a raised tile, the parcel's arc, the stamp's size.


### 2026-09-19 — THE ONE-CLICK KIT (local delivery, `ENTROPY_WARS_COMBAT_FIXES.zip`)

The user: "the DOOR agent's spells are all messed up and complicated. Why do I have to
place doors a certain number of tiles apart? Why are spells showing up that require a
door if I don't have a door placed? It lets me select it and then tells me it can't do
it. Make the whole kit less confusing, make it actually work, follow the same combat
menu rules as the rest of the game." What changed:

- **KNOCK KNOCK is one click.** The click is the FAR door (any empty tile within 4 you
  can see); the NEAR door stands on the free tile beside the agent nearest the far one
  (battle.js `_doorNearSpot`). `DOOR_RULES.pairRange` and `minGap` are gone, and so is
  the `state._spellPick1` tile pick (online.js emits every click; `pickX / pickY` ride
  null). A click on your own door still toggles it (free; Keyholder's free action once
  a turn beside it stands).
- **SPECIAL DELIVERY flies out of ANY of your open doors** — the nearest one that
  reaches the target within 3 with line of sight (`_doorOriginForSpell`). The old
  "a door within 2 of the caster, then 3 from its twin" rule is gone (`doorRange`
  deleted from the row).
- **Every door spell greys when nothing takes it** (`hasSpellTargetInRange`):
  Knock Knock / Slam when `_doorRangeTiles` is empty (no free tile in reach + no door
  of yours / no open door of yours in reach), Delivery / EXIT when no enemy stands
  where a door of yours reaches, Breaking and Entering / Trapdoor when no enemy is in
  range and sight (the plain single-target rule). `_getSpellValidTargets` lists the
  door-reached enemies for Delivery / EXIT and no unit at all for Knock Knock / Slam
  (the board is their drum); the board lights exactly the door tile set
  (`getSpellRangeTiles` → `_doorRangeTiles`, painted as placement reach in ui.js).
- The descs (§4 rows), the HUD parts / labels and the aim prompts read the new rules.
  ai.js picks the far tile only; the engine seats the near door.
- §4's KNOCK KNOCK / SPECIAL DELIVERY prose above is superseded by this entry where
  they disagree (two picks, the corridor, `doorRange`).

Tests: door-race.test.js (the delivery rule, the near spot, the reach). Unseen live:
the near spot on a crowded flank, the greyed rows' reasons.

### 2026-09-20 — rev 3: THE GUN, NOT THE DOORS (local delivery, `ENTROPY_WARS_DOOR_AGENT_REV3.zip`)

The user: "completely rework the DOOR Agent spells. Breaking and Entering can
stay. Drop the whole mechanic of needing to place doors down individually. All
of these spells, Breaking and Entering included, should have the agent holding
the door gun and shooting a door wherever the spell demands — a door for
himself or at an enemy; strictly cosmetic." Five rows, one execution, the gun
always in hand, the gun's pitch.

**The kit** (data.js `RACE_ABILITIES['door agent']`, the tree
`[[Door to the Face, Breaking and Entering], Air Mail, Trapdoor, Drop In★]`;
every row wears `doorGun: true` → sprites.js `classifySpellAnimKind` returns
`'ranged'` = the quick-draw clip, and a `damage` row's TRAVEL is the shot —
battle.js `resolveTravel` → `TRAVEL_HANDLERS.doorGun`, which fires
`raceDoorGun:shot` from the hand to the tile the spell needs a door on):

- **Door to the Face** — `damage`, range 1, WEAK physical, push 1, Stagger.
  The recipe `_sigDoorSwing3D` (registered under the spell id — `fire('impact')`
  runs the geometry registry by id with the caster in params) stands a door
  between the two and slams its leaf into the victim; the shot lands on the
  tile between (`doorAt: 'between'`).
- **Breaking and Entering** — unchanged (`doorBreach`, the way in, rear).
- **Air Mail** — `damage`, range 4, MEDIUM physical, `groundsFlyers`, Stagger,
  `dropTiles: 3`. `_sigDoorAirMail3D`: the victim's own door takes a body, a
  second door hangs three storeys up FACE DOWN (`_sigDoorRig3D` grew `lift`
  + `face: 'down'`), opens, and the body falls out onto the tile; the travel
  handler fades the real victim out for the fall and back in on the landing.
- **Trapdoor** — `placeTrap` (the trap arsenal: hidden from the enemy, the
  owner's sigil `TRAP_TILE_SPRITES.trapdoor`, sprung by the first enemy to END
  a move on it, the Dowsing Rod reveals it), `trapType: 'trapdoor'`,
  **`trapSize: 2`** = a 2×2 (`_trapFootprint(x, y, size)`: the anchor is
  CLAMPED so the footprint fits the board, every tile must pass
  `_placeTrapProblem`; the four records share a `groupId` and the cap counts
  groups), one per agent, tier II — NOT a capstone. The spring
  (`_springTrap`'s `trapdoor` branch): the whole group folds, the WEAK hit,
  every tile sinks TWO levels (`applyTerrainDeform` −2 per tile — a grounded
  unit rides its tile down), the fall is paid on top, Staggered; the victim's
  tile through the impact intent (the sprite burst + the flat-door recipe),
  the other three through `raceTrapdoor` with a stagger. The laying
  (`raceTrapdoor:set`) and its shot are the OWNER's alone: `fireGeometry`'s
  new **`onlyPlayer`** gate draws a geometry only on that player's screen
  (the relay still carries it, so a guest owner sees it; an enemy never does).
  Keyholder: no trapdoor ever takes a door agent (`checkTrapTrigger`).
- **Drop In★** — `doorBreach` + **`fromAbove`**: the shot goes INTO THE AIR
  over the landing (`lift`), `_sigDoorDropIn3D` hangs the door face down and
  drops the agent's body out of it; the real agent is faded for the fall and
  back in on the hit; HEAVY physical, rear, Stagger, **`splashDmg`** on every
  other enemy beside the landing. Tier III, 2 AP, range 5.

**The execution** — `FINISHERS['door agent']` = **OPEN HOUSE** (`sig:
'openHouse'`, built): six doors stand up round the victim (shot there from the
gun), the agent's body comes out of one, hits, and is gone through another —
faster each time (the director and `_sigOpenHouse3D` walk the same
accelerating curve, `1 − (1 − i/(N−1))^1.6`) — until every door opens at once
and the door farthest from the caster takes the victim; every door slams.
`_FIN_DIRECTORS.openHouse` (a face cam, the god shot over the ring, slow-mo
into the last two, the dive, the freeze), `_FIN_STAGE.openHouse` for the
forge, finishers.test.js's BUILT table (52 of 99).

**Retired**: Knock Knock, Special Delivery, Slam, EXIT, The Long Way Round —
the rows, the tree slots, the SPELL_MAP rows. The door OBJECT in battle.js
"THE DOOR" (`state.doors`, the kinds `door` / `doorSlam` / `doorDelivery` /
`doorExit` / `doorTrap`, `castFromDoors`, `exited`, the `_doorRangeTiles`
reach, online's tile-pick relay) STAYS — Grave Passage / Tunnel Network
(`deployPair`) place fixed doors on it and their step-through / wall / sight
rules are still live; the agent-only branches are dormant, not deleted.
`PASSIVE_DEFS.keyholder` keeps its fields (its desc reads what is live now).

**The gun**: the Door Agent's hold (`_DOOR_AGENT_HOLD` on both genders,
`_unitAttachHeld` at rig build) was already in every battle; what changed is
**THE PITCH** — `HQ_PORTAL_RULES.gun.pitch` (degrees the MUZZLE DROPS about
the gun's own lateral axis, after `turn`), applied by three-renderer.js
`_heldPitchGroup` in the three holders (the walker's hand, the board, the
first-person viewmodel). Shipped at **30** for the user's "~30° off
parallel"; a barrel that now points DOWN 30° wants `pitch: -30` — one field,
UNMEASURED (no probe in this sandbox). `_hqGunMuzzle` reads the instance
through `holder.userData.inst` so the laser sight / the shot leave the pitched
barrel.

**Files**: data.js (R2 + Render), battle.js, sprites.js, three-renderer.js,
three-vfx-effects.js, hud.js (R2), index.html (Render, token
`20260920-door-agent-rev3-01-cors`), door-race.test.js, door-vfx.test.js,
finishers.test.js, this doc, FINISHER_PLAN.md, CLAUDE.md (repo). Tests:
door-race (5) · door-vfx (3) · finishers (23) · capstone-vfx · hq-portal ·
champ-rework · sig-refusal-cleanup · mapped-effect-lifetime ·
basic-attack-delivery · earned-doors green; `npm run test:quick` green.
`party-builder.test.js` #15 is red on HEAD before this delivery. NOT
playtested (RULE #1c): the swing's read at range 1, the Air Mail fall against
the damage number (the fade-back at +1150 ms vs the recipe's landing at
1150), the Drop In fade / landing beat, the trapdoor's four sigils on the
board and the sink, the six-door ring on a crowded flank, the gun's pitch
sign, the AI placing a 2×2 near an edge (the anchor clamps; a footprint on a
unit refuses the cast).

## 2026-09-14 — Phase 6 prerequisite: door LOS and production breach evidence

Fixed `doorBlocksSightBetween` skipping the first interior tile: production `getLinePoints` excludes the source. Start at index 0; exclude only the endpoint so doors remain targetable. The existing door test now uses the actual map helper instead of a source-inclusive mock. New door LOS tests exercise the real map/AI/line-walk boundary, eight directions and both seats. 22 new tests pass (18 fail on unchanged battle.js); full suite 1,095 passed, zero failures, four skips; syntax 142/142. No new state/relays, no live test or deployment.

`check-ai-breach-terrain.js` adds production voxel/door evidence. In the controlled raised-column fixtures the LOS blocker can precede the current beam cell, but the engine attempts to breach that current cell; the original simplified successful-removal probe is not full voxel evidence. A last-hit enemy door removes its pair and permits continuation, which the static AI footprint misses. The pure forecast and Arena precedence remain open; see AI-05e/f/g in the adversarial tracker for evidence and exact next work. Water settling and several non-door destruction effects remain doubled in this probe; it stops before unit damage/aftermath.

Complete package: `ENTROPY_WARS_PHASE6_DOOR_LOS.zip`. battle.js to R2, index.html to Render (`20260914-door-los-boundary-01-cors`), other files repository-only. Preserve the existing AI version; no AI runtime edit in this batch.
