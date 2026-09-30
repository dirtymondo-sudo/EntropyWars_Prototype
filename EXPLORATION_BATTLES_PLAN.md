# EXPLORATION BATTLES — the fight is the room you were walking

*Plan document, 2026-09-30. Phase 1 built (2026-09-30); §12 is the log. House rules that stand over every phase: no
puzzles; no sound work; no test files; no invented names (plain labels only); every R2 delivery bumps `?v=`;
RULE #2 is moot here because encounters are refused online (map.js `_hqEncounterFire`), so every phase is
story-mode only and nothing below is relayed.*

mondo's brief (2026-09-30), the parts that decide things:

- "The grid is always drawn with the enemies on a back edge instead of the board being centered on me and
  the enemies."
- "If the encounter is next to a wall units can spawn inside the wall or floating in the air."
- "Get rid of the 8x8 limitation, and just be able to move anywhere in any direction at any time as long as
  the map and my movement or spells allow it."
- "An Escape action, where if you are hidden your unit can escape. A unit that escapes survives the battle
  even after a loss, but is not available to be switched in. If I lose a fight and my whole team got wiped
  out except for one unit I was able to escape with earlier, the game would put them at the front of my
  party and let me continue exploring."
- "If more than half your team (3/4 or better) is hidden you can do a team escape."
- "The transition from the victory screen back to the explore screen is still not seamless. Do we need to
  have the first 3 party members following behind the player?"

---

## 0. The verdict, in one paragraph

Stop cutting an 8×8 window out of the room and fight on the room itself. The battle engine already runs
boards from 4×4 to 24×24 and 16×28 (`GAME_MODES`, state.js; every reader goes through `bw()` / `bh()`),
so the 8×8 is not an engine limit: it is one number (`HQ_FIELD_RULES.size`, data.js) and the window-choosing
code around it (`hqFieldWindow`). Both of mondo's placement bugs are that code: the window is chosen for the
WALKER'S reach, which slides it off the walls and leaves the native on its rim, and the live seat test is the
respawn rule, which thinks a wall is walkable. Make the rasterised room the board (whole room under 24 tiles
a side; a 24×24 crop centred on the two parties above it), start every body on the cell under its own feet,
and let only the raster's own cells be seats. Then give the party a body in the walk: the first shift's
other three members follow the lead in file, so the fight opens in the formation you walked in and the way
back is the same three people standing where the fight left them, with no rebuild of the room (the walk is
SUSPENDED for the fight, not left). ESCAPE is the nameplate eye the game already draws: a unit no enemy can
see may slip away for its whole activation; it sits in a third list beside the board and the bench, cannot be
switched in, survives any result, and when the rest fall it walks out of the room at the head of the party.
TEAM ESCAPE is the same action for everyone at once when three quarters of the living board is unseen, and
ends the fight as a RETREAT: no prize, no clearing, no ward. Because natives never attack first
(encounters are player-initiated only, `HQ_ENCOUNTER_RULES.trigger`), "continue exploring" after a retreat
is safe by construction.

---

## 1. The causes, read off the code (why the grid sits wrong and units float)

**1.1 The window is chosen for the walker's reach, not for the pair.** `hqFieldWindow` (data.js ~50331)
lists every 8×8 origin that holds both feet and scores each by `reach` (cells the WALKER can walk to inside
the window, `hqFieldReach`) FIRST; the distance to the pair's midpoint only breaks ties. A window that holds
a wall or a rock cell loses cells, so the winner slides away from the wall the fight started beside, and the
native, who stood 3.4 m from you towards that wall, lands on the rim. The seat fill (`hqEncounterSeats`,
data.js ~48378) then packs the native's group "farther from the enemy lead", so the enemy party stacks
behind the native against the edge. That is the back-edge grid.

**1.2 The live seat test is the respawn rule, and walls are passable.** The raster knows its own seats
(`hqFieldBuild`: `free = c.in && !c.hazard && c.seat !== false`, data.js ~50438) but that only feeds the
fallback spawns. The seats units actually take come from map.js `_encounterPlaceSeats` (~14022), whose
`free` is `_respawnTileSafe` + a walkable surface + `objectBlocksLanding` + `passable`. Every wall sheet
the field uses is `passable: true` (`cave_wall`, `rock_wall_1`, `cliff`, `forest`, `castle_wall`, data.js
~1041 …), so a rock column standing where the room's wall is counts as a seat. A rock cell's real top is
`null` (data.js ~50453), so `_fieldSurfaceY` has nothing to say and the body is drawn at the engine level
× 1.75 m: three levels or more up. That is the unit "in the wall" and the unit "floating in the air", one
bug seen twice. A cave field is worse: `_fieldGround` returns null for `R.cave`, so every cave unit stands at
the integer level.

**1.3 A box cell counts as IN at half a footprint.** `HQ_FIELD_RULES.box.cover` 0.5 lets a cell whose
centre sits ON the wall line count as floor (with `margin` 0.4 m pulling it in a little). A body seated
there is half in the wall even when the cell is legal. The terrain lattice already uses the walker's own
feet rule per cell (`hqTerrainFeet`); the box lattice should too.

**1.4 Group members are not where they stood.** Only the native you hit slides onto a cell
(`encounterSnap`); its companions, who were walking the room as NPC bodies, are re-seated round the lead
(`hqEncounterGroup`, data.js ~48646). The party's other three are conjured at seats beside you because they
do not exist in the walk at all (no follower code in three-renderer.js or map.js; LIVE_ACTION_PLAN §2.7
only proposed it).

**1.5 The way back rebuilds the room.** The walk hands its room to the battle (`_hqHandoverStash`,
three-renderer.js ~58663), but the return does not hand it back: `_hqReturnOrMenu` (map.js ~1558) runs
`_hqLeave` then `_hqEnter({ seamless })` under a held snapshot of the last battle frame. That is a full
dispose and rebuild of the room, the party's rigs re-attached, hidden behind a 2D canvas that fades when
`H.ready` fires. The hitch and the pop when a rig arrives late are the seam mondo still sees. The suspend
path the modals use (`_hqSuspend` / `_hqResume`, map.js ~1529) keeps a scene alive and is the shape the
return should take.

---

## 2. The rules (the new contract)

1. **THE FIELD IS THE ROOM.** A battle cell is a place the walker could stand. The board is the room's own
   lattice (`hqFieldLattice`: terrain, cave or box), whole, up to `HQ_FIELD_RULES.max` tiles a side
   (24: the largest board the engine ships today, 42 m). A room bigger than that fights on a `max × max`
   crop centred on the midpoint of the two parties and clamped inside the lattice. The crop's edge is not
   a wall and is not drawn: the room goes on, the fight does not.
2. **THE STAND RULE.** Every body starts the fight on the cell under its own feet: the lead, the followers,
   the native and its group. A body whose cell is not a seat is nudged to the nearest seat by ring. A seat
   is the RASTER'S seat (`in`, not a hazard, not `seat: false`) and unoccupied. `_respawnTileSafe` is never
   consulted for a field seat again.
3. **THE FEET RULE, everywhere.** A lattice cell is IN only when the walker's own body could stand at the
   cell's centre: the centre is inside the room's floor by the walker's radius (the box lattice's
   `margin` becomes that radius and the half-footprint `cover` share goes), the walker's feet rule for a
   terrain cell (as now), the cave's `walk && !rock` (as now). A cell that is not IN is never a seat, is
   never a landing, and has no top. Cave fields join the true ground (`_fieldGround` stops refusing `R.cave`).
4. **Levels are tiers over the room's main floor.** THE TIER RULE (`hqFieldTierOf`) keeps its numbers; its
   reference floor becomes the median top of the field's IN cells (the room's main floor) instead of the
   window's lowest cell, so a pit does not lift the whole room a level. A cell more than one level BELOW
   the reference is a hazard (as water is), never a walkable −2.
5. **Nothing is built for the fight that the walk did not have.** The room is suspended, not left; the
   battle draws in it (as `_hqBuildRoomInBattle` does today under the handover) and hands it back the same
   way. THE BATTLE RADIUS (`ground.keepM` 28 / `keepFarM` 48) is measured from the field's rim, not its
   centre, so a bigger field keeps the same margin of room round it.
6. **The party walks as a party.** Slot 1 walks (`HQ_PARTY_RULES.leadWalks`, as now); the other fit members
   of the FIRST SHIFT follow in file. The bench and the DOWN stay home. Followers never block anything.
7. **Hidden means the eye is closed.** ESCAPE reads `isUnitSeenByAnyEnemy(u) === false` (battle.js ~9236),
   the same truth as the nameplate eye and the move-preview ghost's eye: fog vision, line of sight, wards,
   invisibility, smoke, Cryptid, Shadow Realm, pierced by `marked`. No new stealth rule is written.
8. **An escaped unit is out of the fight for good.** It is not on the board, not on the bench, not in the
   turn order, cannot be switched in, cannot be targeted, and survives whatever the result is.
9. **A retreat is neither a win nor a loss.** Nothing is cleared, no XP pool is shared, no drops, no ward,
   no loss counted. The natives stand where the fight left them.
10. **PvP is untouched.** The 8×8 maps (the Δ boards, `MF_DELTA_S`) and every prebuilt arena stay exactly as
    they are: they are the PvP boards and have nothing to do with the exploration fights. Everything here
    lives behind the encounter path (`HQ_FIELD_RULES`, `hqField*`, `_encRun()`); a sea room's fallback to
    the Δ board is the only place the two meet, and it is unchanged.
11. **Fog stays on in encounters** (`state.fogOfWar` defaults true; the encounter never turns it off). With
    the whole room as the board, fog is what makes hiding, and so escaping, a decision.

---

## 3. Phase 1 — THE FIELD IS THE ROOM (the grid, the walls, the 8×8, in one delivery)

The three placement complaints are one delivery, because they are one piece of code.

**3.1 The raster takes the room.** `hqFieldWindow(roomId, wPt, tPt)` becomes `hqFieldFrame(roomId, feet[])`:
given every body's feet (the lead, the followers once Phase 2 exists, the native, its group), it returns the
lattice's whole extent when `w ≤ max && h ≤ max`, else the `max × max` crop whose centre is nearest the
midpoint of all feet, clamped inside the lattice. No reach score, no span search. `hqFieldRaster*` (box /
terrain / cave, data.js ~50115–50188) take `(ox, oz, W, H)` instead of `S`. OUT cells stay rock columns for
the engine (never climbed: `rockMin` / `rockPad` as now) but are never seats and never drawn (true ground).

**3.2 The square goes.** Everything that holds ONE `N` learns `W` and `H`: `hqFieldTransform` (data.js
~48269), `hqEncounterEye`'s clamp, `hqFieldFixedCells` (`S`), `hqFieldLayout`, `hqFieldRegister` (the forge
entry `_mfNew` gets `w, h`), the renderer's gate `ctx.bw !== R.T.N || ctx.bh !== R.T.N` in
`_hqBuildRoomInBattle` (three-renderer.js ~56762), `floorHole`, `_fieldGround`'s `G.N` reads (~56282 …
~56524) and the deform plans (~56595–56699). The engine side is already `bw()` / `bh()`; the `|| 8`
fallbacks in battle.js ~42532 and map.js ~8245 / ~8686 / ~8764 read `bw()` / `bh()` instead.

**3.3 The seats are the feet.** `hqEncounterField` files every body's cell (not just two), and
`hqEncounterSeats` becomes THE STAND RULE: seat = the cell under the body if it is a raster seat and free,
else the nearest raster seat by ring (the party rings towards the lead, the group towards the native).
`_encounterPlaceSeats` drops its own `free` and reads the field's `seats` map; `_respawnTileSafe` is out of
the encounter path. Until Phase 2 gives the party followers, the other three party members seat on the free
raster cells nearest BEHIND the lead (away from the native), which is today's fill with the right seat test.
The native's group members are seated on their OWN NPC positions (the renderer already knows them: the loop
stop the group walks), so a roaming group that was spread across the room opens spread across the room.

**3.4 The feet rule on the box lattice.** `hqFieldBoxInfo` (data.js ~49911) tests the cell CENTRE against the
room's floor polygon inset by the walker's radius; the half-footprint share goes. Props: a prop is COVER
(`seat: false`, a climbable top) when its footprint covers the cell centre; a prop that only clips a corner
leaves the cell as floor. `hqFieldTerrainInfo` and the cave already meet the rule.

**3.5 The cave stands on its ground.** `_fieldGround` (three-renderer.js ~56271) stops returning null for
`R.cave`; the cave raster files `tops` (the cave floor is a height per cell already, `hqCaveInfo`).

**3.6 The reference floor.** `hqFieldBuild` computes the median IN top and hands it to `hqFieldTierOf` as
`refM`; a cell under `refM − step` is a hazard cell.

**3.7 THE BATTLE RADIUS from the rim.** `_fieldKeep*` reads (three-renderer.js, SEAMLESS_FIELD_PLAN §3)
measure from the field's bounding box, not the window centre.

**3.8 The camera.** THE ARRIVAL's two-shot (`hqEncounterArrival`) is unchanged: it frames the lead and the
native, not the board. `getTurnFramingZoom` already reads `bw()` / `bh()`; on a 24-tile field the resting zoom is
the 8v8 maps'. The C key restores the preset as now.

**3.9 What the player sees.** The fight starts where everyone stands, in the whole clearing or hall, walls
where the walls are, nobody on a rim, nobody in a wall, nobody in the air. A hallway fight is a hallway
fight: three tiles wide and long, which is the mystery-dungeon corridor and is fine.

Files: data.js, map.js, three-renderer.js, battle.js (the `|| 8` fallbacks), editor.js (§7). Kill-switch:
`window.EW_HQ_FIELD_WINDOW = true` keeps the old 8×8 window path for one delivery, then it is deleted.

---

## 4. Phase 2 — THE FOLLOWERS (the first shift walks behind the lead)

mondo's question, answered: yes. Three followers cost nothing the game does not already pay (their rigs are
loaded for every encounter anyway, `_hqEncounterStart` warms them), they make the party visible as a party,
and they are what makes both seams trivial: going in, the party is already standing in formation on real
floor; coming back, the survivors are already standing where the fight ended. The escaped-unit-at-the-front
rule (§6) is SEEN: the unit that got out walks first.

**4.1 Who.** The FIRST SHIFT's members 2–4 that are fit (`hp !== 0`), in shift order. The bench never
walks. A DOWN member is not drawn. When slot 1 changes (a swap in the pause menu, an escape), the file
re-forms behind the new lead.

**4.2 How they move.** THE TRAIL: the lead's feet are sampled every 0.35 m of travel into a ring buffer of
points (position, heading, ground y). Follower k targets the trail point `k × HQ_FOLLOW_RULES.gap` (1.4 m)
behind the lead's travel and eases towards it (the lead's own move speed, the walk / run clip by speed, idle
when the lead idles). No pathfinding, no collision: followers walk through NPCs and each other, never push
the lead, never block a door or a prompt. A follower more than `catchUpM` (6 m) off its point, or on the far
side of a door, ladder, climb, drop or stage swap, is placed on its point at once (the JRPG teleport). While
the lead rides (the taxi, the train, the skateboard) or swims, the followers are hidden and re-form when
the lead stands.

**4.3 Where.** Everywhere the lead walks, DOOR HQ's halls included (the JRPG rule; fork §10.4).

**4.4 The encounter seats them.** THE STAND RULE (§3.3) reads each follower's feet as its cell, so the fight
opens in the file you walked in: the lead nearest the native, the rest strung behind. A follower standing on
a non-seat cell (a doorway, a stair) rings to the nearest seat.

**4.5 Not followers.** NPCs never react to them. They cast no encounter of their own (the strike is the
lead's click, as now). They do not count for the room's population or the memory budget's actor cap
(`_mm*`) beyond their rigs, which the fight already budgets.

Files: three-renderer.js (the trail, the follower bodies, hide / show on ride and swim), map.js (the party
source per room enter, the re-form on a swap), data.js (`HQ_FOLLOW_RULES` = gap · sampleM · catchUpM ·
count 3 · halls true). Kill-switch: `window.EW_HQ_NO_FOLLOWERS`.

---

## 5. Phase 3 — THE HAND-BACK (the way back with no rebuild)

**5.1 Suspend, don't leave.** `_hqEncounterStart` calls `_hqSuspend()` (the modal path) instead of
`_hqLeave({ handover })`: the walk's scene stays alive and paused; the battle draws inside it through the
handover as today. The dissolve on the way in stays (it is one camera move now, THE ARRIVAL).

**5.2 The debrief stands in the room.** The podium already stands on the true ground; the panel stays.
BACK TO THE ROOM no longer snapshots the frame: `_encReturnLeave` tears down the battle layer (plates,
highlights, HUD, podium) and calls `_hqResume()` with the party's end-of-fight cells as the walk's positions:
slot 1's unit stands where it ended (its heading = its facing), the followers stand on their own cells and
fall into file when the lead moves. The camera eases from the debrief eye to the walker's boom over
`HQ_RETURN_EASE_MS` inside the live scene. No `_hqEnter`, no dispose, no snapshot, no pop.

**5.3 The room's truth is updated in place.** `hqEncounterCleared` marks the beaten natives gone (they
dissolved on death already; their NPC records are dropped without a rebuild); the population, the map's
charted state and the clock resume as the modal path does. A loss that WIPES the party keeps the ward wake
(`hqEncounterWakeRoom`): that is a move between rooms, and a card is right there (you passed out).

**5.4 The snapshot path stays as the safety net** (reduced motion, `EW_HQ_NO_DISSOLVE`, a resume that
fails) exactly as THE WAY BACK left it.

Files: map.js (`_hqEncounterStart`, `_hqReturnOrMenu`), battle.js (`_encReturnLeave`), three-renderer.js
(the resume with positions; the battle layer's teardown without touching the room group).

---

## 6. Phase 4 — ESCAPE, and Phase 5 — TEAM ESCAPE

### 6.1 ESCAPE (one unit)

**Where.** A row on the unit's action menu in a party encounter only (`_encRun()`), beside ⇄ SWITCH.
Greyed with the reason when refused: SEEN (the eye is open), NO AP, or NOT IN A STORY FIGHT.

**When.** The unit is alive, active, its eye is closed (`isUnitSeenByAnyEnemy(u) === false`), and it has
at least `escape.apMin` (1) AP. The move-preview ghost's eye already tells the player which tile hides them;
nothing new to learn.

**What.** The unit spends its whole activation: it steps out of the fight and out of the room's story for
this battle. Engine: removed from `state.units`, pushed to `state.escaped[player]`, `u._escaped = true`,
`u.ap = 0`, the turn order rebuilt without it (the removal half of `_gauntletSwapInTurnOrder`), every
targeting and camera read treats it as gone (it is not in `state.units`, so they do). The bench does NOT
fill its seat (nobody fell; a switch is the player's own choice before escaping). Renderer: the body walks
off its cell towards the field's nearest rim over `escape.ms` and fades; a log line names it. No banner,
no camera (RULE #2 does not apply, but the walk-off is small on purpose: a hidden unit leaving should look
like a hidden unit leaving).

**Not switchable.** `_gauntletReserves` reads `state.bench` only; the escaped are in a third list, so the
rule needs no gate. THE RESERVES panel shows them under an ESCAPED heading, greyed.

**The result.**
- The fight ends as usual when the board and bench of one side are empty; the escaped are not counted as
  living for `getTeamWipeoutCount` (a fight cannot be stalled by fleeing), and if the LAST living body
  escapes the fight ends at once as a RETREAT (§6.3).
- The commit (`hqPartyAfterMatch`) gets `escaped: true` per row: an escaped unit keeps the HP and MP it
  left with, is never DOWN, and on a WIN takes the `present` share (0.5) unless it fought (`_encFought`,
  then the full share); on a LOSS or a RETREAT nothing (as today).
- **A LOSS with escapes is not a wipe.** `lossRestore` does not fire (nobody is treated), the DOWN stay
  DOWN with `hp = 0`, the loss is counted, and the party record is re-ordered: the escaped units move to
  the FRONT in their existing order (`hqPartySwap` sequences), so slot 1 is an escaped unit and, by
  `leadWalks`, the one who walks. The officer is never relieved but may leave slot 1 (the 2026-09-23
  rule), so this needs no exception. The return is the ROOM, not the ward: the player stands at the door
  they entered by (`_hqLastDoor`), the natives still in the room where the fight ended, nothing cleared.
  Natives never strike first, so the walk out is safe; the player may leave, heal from the bag, or swing
  again.
- The debrief's result sheet gets a line: n ESCAPED, and on a loss THE PARTY IS DOWN · <name> GOT OUT.

**The AI.** Natives do not escape in Phase 4 (fork §10.2).

### 6.2 What "hidden" costs the player

Hiding is the game's own systems: break line of sight behind cover or a wall cell, stand outside every
enemy's vision range, be invisible, stand in your own smoke, be a Cryptid with nobody near. Fog is on. A
bigger field (§3) is what makes this reachable: an 8×8 has nowhere to hide; a hall or a clearing does.

### 6.3 TEAM ESCAPE

**When.** A team action on the active unit's menu (where FORFEIT lives) when `hidden / living ≥
teamEscape.share` (0.75) over the LIVING BOARD units: 4 alive needs 3 unseen, 3 alive needs 3, 2 alive
needs 2, 1 alive is the single ESCAPE. The bench does not count either way (it is not on the field).

**What.** Everyone alive on the board and the bench escapes at once; the fight ends as a RETREAT. The
seen minority go too (the hidden majority covers them; that is the point of the rule). The DOWN come home
DOWN (carried, not lost).

**A RETREAT** (also the last body's single escape): the debrief shows a one-sheet THE RETREAT (who got
out, the party's state, no EXPERIENCE, no SPOILS), BACK TO THE ROOM lands the party at the door they
entered by, the natives stand where the fight left them, nothing is cleared or counted (`hqEncounterLog`
gets `retreats`, not a loss), the gauge carries as it would (`carryGauge`).

**Cost.** None beyond the fight not being won: no XP pool, no drops, no capture, and the room is still full.
mondo's rule is the door to a grind-free "this fight is bad, leave"; a price on it would only send the
player to the pause menu to save-scum. (Fork §10.3 if he wants one.)

Files: battle.js (the two actions, `state.escaped`, the wipe count, the commit rows, the result sheet),
ui.js (the menu rows + the RESERVES panel heading), data.js (`HQ_ESCAPE_RULES` = apMin 1 · ms 900 ·
teamShare 0.75 · retreatLandsAtDoor true; `hqPartyAfterMatch` rows `escaped` / `retreat`; the front-of-party
re-order; `hqEncounterLog.retreats`), map.js (`_hqReturnOrMenu`: a retreat or an escape-loss returns to the
room at `_hqLastDoor`, never the ward; `_hqEncounterResult.retreat`), three-renderer.js (the walk-off).
`state.escaped` is added to online.js `_serializeState`'s skip list beside the guest UI keys as a
precaution; it never exists online.

---

## 7. What changes in the zones plan and the editor

ZONES_PLAN.md §2.3 and the E7 audit assume the fixed 8×8 at 1.75 m ("every room of interest needs one clear
14 m patch"). Under §2 rule 1 that patch is not a thing. The amendments, to be written into ZONES_PLAN §2.3
when Phase 1 merges:

- **The cell stays 1.75 m.** Nothing about the tile changes; `HQ_TERRAIN_RULES.tile`, the height steps
  (1.75 m a level, 1.46 m the walkable step), the lane widths (3 tiles) all stand.
- **"One clear 8×8 patch" becomes "enough seats".** A room of interest needs at least `fieldMinSeats` (48)
  raster seats in one connected walkable region (a 4-body party, a group of up to 8 with THE SWARM, and room
  to move), and no room needs a clear square. Cover INSIDE the room is wanted, not avoided: it is what
  hides a unit (§6.2).
- **A lane fights as a lane.** A 3-tile hallway is a legal field; a bulge is nice, not required. The
  "8×8 bulge every ~30 m" row goes.
- **The crop rule for big rooms.** A room over 24 tiles a side is legal but fights on a 24×24 crop; the
  editor says so on the room (an amber row, not a red one). Hand-built zone rooms should stay under it,
  which they do by the mystery-dungeon template already.
- **Water and sea** unchanged: a `terrain.sea` room still falls back to the Δ board.
- **The editor (E7's AUDIT 8×8 → AUDIT FIELD).** `hqPlanFightPatches` (data.js ~44076) becomes
  `hqPlanFieldSeats(room)`: per `space`, the count of lattice cells that meet THE FEET RULE and the largest
  connected region; red under `fieldMinSeats`, amber over the crop. `HQ_ZONE_TOOL_RULES.patchTiles` and
  `patchStep` retire. The FIGHT audit at the cursor (editor.js ~1255) previews the whole-room frame, not a
  window. The LAYOUT auto-hallway rule (3 wide) is unchanged.
- **ZONES_PLAN §4 (the Woods)** loses the sentence "every room of interest has an 8×8 fight patch" and the
  Path B "fight bulge"; the six rooms stand as drawn.

---

## 8. What it costs

- **Engine per turn.** A 24×24 board is what the 8v8 prebuilt maps run today (pathing, fog's
  `computeVisibleTiles`, the AI's tile scoring). A hand-built zone room is 10–20 tiles a side; most fights
  are smaller than Camelot.
- **Rendering.** The room is already drawn whole under the true ground; the field adds pick quads per
  cell (576 at most, flat) and drapes only under highlighted cells. THE BATTLE RADIUS keeps the same
  margin. No board mesh, no columns, as today.
- **Memory.** Three follower rigs in the walk: the same three the fight loads now, loaded at room enter
  instead of at the strike. The memory budget's actor line counts them.
- **Risk.** The square-to-rectangle pass (§3.2) touches the renderer's field block in a dozen places; it
  ships with the kill-switch so a bad frame falls back to the 8×8 window for one delivery.

---

## 9. The order (each a delivery: a merged PR + one zip of the R2 files)

1. **Phase 1 THE FIELD IS THE ROOM** — the frame, the seats, the feet rule, the cave ground, the audit
   (§3 + §7). Fixes the grid, the walls, the floating, the 8×8 at once. Files: data.js, map.js,
   three-renderer.js, battle.js, editor.js, ZONES_PLAN.md §2.3 / §4 amended.
2. **Phase 4 ESCAPE** (§6.1) — it depends on nothing above and is the gameplay mondo described most.
   Files: battle.js, ui.js, data.js, map.js, three-renderer.js.
3. **Phase 2 THE FOLLOWERS** (§4). Files: three-renderer.js, map.js, data.js.
4. **Phase 3 THE HAND-BACK** (§5) — after the followers, because the survivors ARE the followers on the
   way back. Files: map.js, battle.js, three-renderer.js.
5. **Phase 5 TEAM ESCAPE + THE RETREAT** (§6.3). Files: battle.js, ui.js, data.js, map.js.
6. Cleanup: the `EW_HQ_FIELD_WINDOW` path and `hqFieldWindow` deleted; SEAMLESS_FIELD_PLAN §1 contract
   rewritten to §2 here.

Every phase: `node --check` on each edited JS; a quick load check only (no browser sweeps); notes appended
to docs/notes/seamless-field-encounter.md and §12 here.

---

## 10. Forks (mondo decides; the default is what gets built if he says nothing)

1. **The cap.** Default 24 tiles a side (42 m), the largest board the engine ships. The alternative is no
   cap (a 200 m city as one 114×114 board): the AI's per-turn cost and the fog pass scale with cells, and
   nothing in the game has run there; not recommended.
2. **Do natives escape?** Default no. If yes (Phase 5b): an AI unit unseen by the party and under
   `escape.aiHpPct` may escape; it stays in the room's population and is there when you walk out.
3. **Does a retreat cost anything?** Default nothing (§6.3). Options: the gauge resets to 0; or the
   natives heal to full.
4. **Followers inside DOOR HQ's halls?** Default yes, everywhere the lead walks. Alternative: only in the
   wild rooms (`hqRoomSite`), alone in the building.
5. **Where a retreat lands you.** Default the door you entered by, natives left standing. Alternative: the
   swing spot (where you stood when you struck), beside the natives.
6. **ESCAPE's condition.** Default: the eye closed is enough (mondo's words). Alternative: closed AND no
   enemy within 2 tiles.
7. **The escaped's XP on a win.** Default the `present` share (0.5) unless the unit fought. Alternative:
   nothing (they ran).

---

## 11. What exists where (so no thread re-searches)

- The strike and the chain: `HQ_ENCOUNTER_RULES` data.js ~47658; aim `_hqEncounterAim` three-renderer.js
  ~51198; `_hqEncounterFire` map.js ~3791 → `hqEncounterLaunch` data.js ~47710 → `hqFieldWindow` ~50331 →
  `hqEncounterField` ~48299 → `encounterSnap` three-renderer.js ~54448 → `_hqEncounterStart` map.js ~3896
  → `hqFieldRegister` / `hqFieldBuild` data.js ~50497 / ~50425 → `_hqLeave({ dissolve, handover })` →
  `_msConfirm` → `startMatch` battle.js ~44760 (latches `_encMatch`) → `_encounterPlaceSeats` map.js
  ~13885 / ~14022.
- The lattices: `hqFieldLattice` data.js ~50007; box `hqFieldBoxInfo` ~49911; terrain
  `hqFieldTerrainInfo` ~50044; cave `hqCaveInfo`. Rasters ~50115 / ~50149 / ~50188. `HQ_FIELD_RULES`
  ~49708 (size 8, box.cover 0.5, box.margin 0.4, ground.tierMin 1.2, keepM 28, keepFarM 48).
- The true ground: `_fieldGround` three-renderer.js ~56271, `_fieldGroundTop` ~56295, `_fieldSurfaceY`
  ~56373 (read by `unitSurfaceY` / `_tileSurfaceY`); `entry.field.tops` (null on rock, data.js ~50453);
  `hqFieldTierOf` ~49834; `hqFieldFixedCells` ~50371.
- The room in the battle: `_hqBuildRoomInBattle` three-renderer.js ~56760 (the `N` gate ~56762), the
  handover `_hqHandoverStash` / `_hqRoomHandover` ~58649–58673; the suspend path `_hqSuspend` /
  `_hqResume` map.js ~1529.
- The way back: `_encReturnLeave` battle.js ~38754; `fieldSnapshot` three-renderer.js ~58597;
  `_hqReturnOrMenu` map.js ~1558; the win spot `hqEncounterReturnSpot` data.js ~47798; the loss wake
  `hqEncounterWakeRoom` ~48455; `hqEncounterCleared` ~48190; `HQ_RETURN_EASE_MS` 1500.
- Board size: `bw()` / `bh()` / `bmax()` state.js ~1337; `GAME_MODES` sizes 4–36 state.js ~60–240;
  `_generatePrebuiltGameModes` reads `EW_MAP_META.w / h` (largest shipped 24×24 and 16×28).
- Stealth: `isUnitConcealedFrom` battle.js ~9110; `isUnitSeenByAnyEnemy` ~9236 (the eye);
  `isUnitSeenByTeam` ~9256; `predictStealthAtTile` ~9305 (the ghost's eye); `checkStealthReveals` ~9398;
  the AI's `isConcealed` ai.js ~358; the renderer's `_isConcealedFromViewer` three-renderer.js ~16806.
- The party: `HQ_PARTY_RULES` data.js ~48483 (shift 4, lossRestore, leadWalks, carryGauge);
  `hqPartyForLaunch`, `hqPartyAfterMatch`, `hqPartySwap` ~49154; `RESERVE_RULES` ~11208 (switchApCost 2,
  switchesPerRound 1); `doSwitch` battle.js ~35518; `_benchOn` ~35420; `_gauntletReserves`;
  `_gauntletQueueReplacement` ~35591; `getTeamWipeoutCount` ~66920; `forfeitMatch` ~42790; the RESERVES
  panel ui.js.
- The levels: `HQ_LEVEL_RULES` data.js ~48531 (`share` fought 1 / present 0.5 / down 0; `group` solo,
  roamExtra, swarm).
- The editor audits: `hqPlanFightPatches` data.js ~44076, `HQ_ZONE_TOOL_RULES` ~44029 (patchTiles 8);
  editor.js AUDIT ~2308–2347, the FIGHT preview ~1255.
- Docs: SEAMLESS_FIELD_PLAN.md (§1 contract, §3 rule, §7 log, §8 THE CUT, §9 structure heights);
  docs/notes/seamless-field-encounter.md (delivery 6 seats ~237, 7 ~290, 8 cave ~315, 9 box ~364, 12 THE
  EDGE ~448, true ground ~495, THE ARRIVAL ~660, THE WAY BACK ~732, units on the ground ~814);
  LIVE_ACTION_PLAN.md §2.7 (the follower idea, never built); ZONES_PLAN.md §2.3 / §4 / §8.

---

## 12. Log

- 2026-09-30 — the plan written (this document). Nothing built.
- 2026-09-30 — **Phase 1 THE FIELD IS THE ROOM built** (token 20260930-battles-01-cors; R2: data.js, map.js, three-renderer.js,
  editor.js). `hqFieldFrame` (whole lattice ≤ 24 a side, else a 24×24 crop on the feet; padded to 6) on the encounter path;
  rasters / transform / entry / GAME_MODES row / renderer are W × H; THE STAND RULE = `entry.field.seats` (no respawn test),
  the group seated on its own cells (the aim reports their feet); the box FEET RULE (centre `bodyR` inside, a prop covers when
  it holds the centre); the terrain reference = the median IN top; the cave files its real tops (`caveGround`, dormant: no
  cave rooms today); editor FIGHT previews the frame, AUDIT 8×8 → AUDIT FIELD (`hqPlanFieldSeats`); ZONES_PLAN §2.3 / §4
  amended. Kill-switch `EW_HQ_FIELD_WINDOW`. One deviation: a cell more than one level under the main floor is clamped to
  −1, not made a hazard (a sloped whole-room frame would lose ground the walker walks on). The arenas are untouched
  (every pick's raster diffed identical). Notes: docs/notes/seamless-field-encounter.md. Next: Phase 4 ESCAPE.
- 2026-09-30 — **THE CAMERA + Phases 4, 2, 3 (lite) and 5 built in one delivery** (token 20260930-battles-02-cors; R2: data.js,
  battle.js, hud.js, map.js, three-renderer.js). mondo: "when the battle starts, the overhead view of the map is not zoomed too
  far out, it needs to be zoomed in more".
  - THE CAMERA: a story field frames `HQ_ENCOUNTER_RULES.arrival.frameTiles` (8) board tiles, not the whole field side
    (battle.js `_framingBoardTiles` in `getDefaultZoomAtTilt`, `_getBattleZoom`, the intro's rest zoom). Checked live on the
    fairy forest clearing (24 × 22): zoom 0.459 → 0.765. The player still zooms out by hand. PvP / Δ boards unchanged.
  - ESCAPE + TEAM ESCAPE + THE RETREAT (§6): battle.js `escapeProblem` / `doEscape` / `teamEscapeInfo` / `doTeamEscape` /
    `_escapeAll`; `state.escaped[seat]` (off the board, off the bench, out of the turn order); the ladder rows are in
    **hud.js** (the action ladder lives there, not ui.js), the roster shows an ESCAPED row. The last body escaping = THE
    RETREAT. data.js `HQ_ESCAPE_RULES`, `hqEscapeTeamNeed` (3 of 4, 3 of 3, 2 of 2), `hqPartyEscapedFront`; the encounter log
    counts `retreats` and a retreat leaves `last` alone; `hqPartyAfterMatch` returns `retreat` / `escLoss` / `escaped` /
    `lead`, and lossRestore runs only on a plain loss. map.js: the run carries the `entry` door; a retreat or an escape loss
    comes back to the room at that door (the swing spot when none), never the ward. Checked live (escape, team escape,
    result, the way back).
  - THE FOLLOWERS (§4): data.js `HQ_FOLLOW_RULES` (count 3, gap 1.4 m, halls on) + `hqPartyFollowers`; map.js `_hqFollowers`
    (the officer rides as the Player cast model when not the lead) and `_hqRefreshFollowers` (after every party change);
    three-renderer.js THE FOLLOWERS block (`_hqSpawnFollowers`, `_hqTickFollowers`: a breadcrumb trail, eased, re-formed on a
    jump, hidden on rides / vehicles / swim / climb; no collision, not talk targets). The strike files their feet
    (`party`) and `hqEncounterSeats` seats the party on their own cells. Off switch `EW_HQ_NO_FOLLOWERS`.
  - THE HAND-BACK, LITE (§5.2 only): a WIN lands the lead on its end-of-fight cell facing its facing, and each follower
    on its own end cell (held until the lead walks off, then it runs back into the file). data.js `hqEncounterEndRows` /
    `hqEncounterEndSpot`; battle.js files `end` on `_hqEncounterResult`. DEVIATION: §5.1 (suspend instead of leave) is NOT
    built — the handover takes the room's groups apart into the battle scene and disposes far props, so the walk's
    records cannot resume without a rebuild; the room is still rebuilt under the held frame (THE WAY BACK), which already
    hides it. Next: §5.1 needs the handover to lend the room groups instead of moving them.
- **2026-09-30 — THE DASH-IN (token 20260930-dashin-01-cors).** mondo: "take away the party members following you, its
  too distracting. Instead let's have them jump into action or dash in behind you." THE FOLLOWERS (§4) are REMOVED:
  data.js `HQ_FOLLOW_RULES` / `hqPartyFollowers`, map.js `_hqFollowers` / `_hqRefreshFollowers`, three-renderer.js
  `_hqSpawnFollowers` / `_hqTickFollowers` / `hq.setFollowers` and the strike's `party` feet are gone. The walk has
  the lead only; the party's other members are seated by the fill. battle.js `_encPartyDashIn` (called right before
  the first render of a story fight): each member LEAPS onto its seat from up to 3 tiles behind the lead (away from
  the native, where the crane starts), the stock jump tween + jump clip, all take off together, landing 150 ms apart.
  The hand-back lands the lead only. Kill-switch `window.EW_ENC_NO_DASH_IN`.
