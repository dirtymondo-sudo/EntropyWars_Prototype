# THE BAYSIDE MALL, THE PLAN

World polish thread 20. Written 2026-11-20. **A plan only: nothing is built. It waits for mondo's word.**

mondo, 2026-11-20:
- "the mall needs to be redone, since its outside looks nothing like its inside. It needs to be a real physical building inside disaster city"
- "it is supposed to be a bayside mall"
- "start the mall plan. Needs exterior and interior, use the current mall as a basis. Real architecture, outside has to match the inside
  (currently they are 2 totally separate buildings)"

Pictures beside this file: `01_mismatch.png`, `02_site.png`, `03_floors.png`, `04_elevations.png` (drawn by `node docs/plans/mall/draw-plan.js`;
change a number there first, then here) and `before/` (the game today, HEAD 8c95f56).

All places are room metres of the city room `site_prebuilt_downtown_streets`: x runs east, z runs south. A square is 3.5 m.

---

## 1. WHAT THE MALL IS TODAY

### The outside
- Building `P10-10-B1` "Mall concourse" on Bayside's plot P10-10 (`docs/disaster-city/city-layout.json`; drawn by `B.mall` + `POLISH.mall` in
  `docs/disaster-city/districts/B.js`).
- It stands at x 175..203, z 7..35. **28 x 28 m** (8 x 8 squares), in a 42 m plot. Ground level 0 (sea level).
- 10.5 m to the eaves (`storeys: 3`), hip roofs to 13.5 m, a glass dome over the middle.
- Shape: four sand and cream corner blocks under terracotta hip roofs, round a glass cross vault 8.4 m wide, a glass dome on the crossing,
  a coral portal on the west face with the sign THE MALL, coral awnings, the signs SHOPS and CAFE. Miami deco trim.
- Windows on all four sides: shop glass on the ground, a row of windows above.
- **One door**, on the west face (x 174.75, z 19.25), facing the Cordon plaza. The plan gave it a north and an east door; B.js turned its
  front west. There is no door to the sea.
- It is a hollow walk-in (`hollow: true`, `skin: false`): there is an empty one-floor shell inside the walls, but the door does not lead
  into it. The door jumps you to another room.

### The inside
- A separate room, `site_prebuilt_downtown_mall` (data.js). Built 2026-09-17 for the old Downtown, restyled 09-21 as "a 1960s terminal".
- **One box of 96 x 64 m, 12 m high.** White plaster, cream terrazzo, a flat ceiling with three small skylight beams.
- Ground floor: a cross of two concourses, THE ATRIUM with the fountain in the middle, THE CLOCK TOWER (8.5 m, the tape on it), THE ARCADE at
  the west end (six slot cabinets), a fun box, grind ledges, two quarter pipes, two lounges with sofas and lava lamps.
- Upper floor at 4.6 m: four galleries and THE EAST BRIDGE with THE FOOD COURT; THE FLIGHT TUBE (a ring bridge round the atrium).
- A catwalk at 8.4 m over the east concourse.
- Ways up: two escalators (west), four wide stairs, two fire-escape stairs to the catwalk.
- Shops: eleven runs of shopfronts, about 50 bays (DOORS R US, KEYS & KEYS, TAPE WORLD, PRETZELS, THE GOO SHOP, NOTHING HAPPENED,
  DEPARTMENT STORE, FOOD COURT ...). They are fronts only. No shop is entered.
- Windows: four round windows and four portholes, high up. Their view is of mountains.
- People: four NPC spots, one online spot, five lines.
- **Two doors:** `street` in the middle of the SOUTH wall, back to the city. `closet` in the middle of the north wall, to
  `site_prebuilt_downtown_closet` (the supply closet, 7 x 7 m, the time machine).

### Every door between outside and inside
| Door | Outside | Inside | Note |
|---|---|---|---|
| `mall` / `street` | west face of P10-10-B1 | middle of the south wall | the only live way in |
| the old streets' `mall` door | room `site_prebuilt_downtown_oldstreets` | same `street` door | that room is retired; kept only as a PvP board |

No other mall room exists: no shop interior, no car park, no separate food court. The closet is the only room behind it.
The time machine's link to old Cyberpunk City (`timemachine_cyberpunk`) is already in `DOOR_HQ.cut.links`.

### What else points at the two rooms (data.js)
The area fight board (`_MF_AREA_DELTA_BUILDERS`), the skylight beams (`DOOR_HQ.lightShafts`), two tapes (`HQ_TAPE_SHEET`: THE FOOD COURT,
STAFF ONLY), the tape's place (`DOOR_HQ.findSpots`), the encounter lists (`HQ_AREA_ENCOUNTERS`), the look (`HQ_ROOM_LOOKS.mall`).
Not on the zone map, not in the hubs, not an arena pick.

### What stands round it
- West: the Cordon plaza (P09-10, no building, the bandstand on its north lawn), then the Arrival court with THE MALL ARCH at x 120.75, z 21.
- North: the Security office and the Staff apartments (P10-09).
- South: Medical staging (P10-11). **No building on it.**
- East: 17.5 m of plain yard, then the coast road (pavements x 220.5 and 238, carriageway x 224..238, short palms on its middle line), the
  planks kept clear for the view (x 241.5..252), the boardwalk (x 252..259), the sea wall, the sand one step down, the waterline near x 295.
- **The pier runs out on the mall's own line, z 21:** 7 m wide from the sea wall to x 297.5, then a 21 m head with the pavilion.

---

## 2. WHAT THE PICTURES SHOW

BEFORE_PICTURES

---

## 3. THE MISMATCH, MEASURED (`01_mismatch.png`)

| | Outside | Inside |
|---|---|---|
| Size on the ground | 28 x 28 m | 96 x 64 m |
| Floor | 784 m² | 6,144 m² (7.8 times as much) |
| Height | 10.5 m eaves, a dome above | 12 m, a flat ceiling |
| Floors | reads as two rows of windows | two floors and a catwalk |
| Doors | one, west | one, south (and the closet, north) |
| Roof | glass cross vault + glass dome | three small beams of light, no vault, no dome |
| Windows | shop glass and windows on four sides | eight small round windows with mountains in them |
| Style | pastel Miami stucco, terracotta roofs | white 1960s terminal |
| The sea | 56 m away, never faced | never seen |

In plain words:
- The inside is 3.4 times as long and 2.3 times as wide as the building. It could not fit on four plots.
- You walk in facing east and arrive facing north.
- The outside promises a glass vault and a dome. Inside there is a ceiling.
- The inside has an atrium, a food court and about 50 shops. The outside shows a door, a few windows and two small signs.
- The outside's four wings and cross shape do match the inside's cross of concourses in idea. That is the one thing worth keeping.
- It is a mall by the sea that turns its back to the sea. Its only door faces inland. The pier is on its line and it has no door to it.

---

## 4. THE ONE BUILDING (`02_site.png`, `03_floors.png`, `04_elevations.png`)

### The rule
**One box, drawn once.** One file holds the mall's numbers (walls, floors, doors, windows, vault, dome). The outside and the inside are both
written from that file. So:
- Every outside door is an inside door at the same place, facing the same way.
- Every window seen from outside is a window, a shopfront back or a skylight inside, at the same place and height.
- The atrium's roof is the building's dome. The concourse's skylight is the building's glass vault.
- The inside is never bigger than the walls. The floors stand at the heights the windows show.
- Same materials on both sides of a wall: the sand stucco, coral trim and terrazzo come indoors.

### Where it stands
- **The body: x 171.5..206.5, z 3.5..80.5. 35 x 77 m, 10 x 22 squares.** It takes plot P10-10 (where it stands now) and plot P10-11 to the
  south (Medical staging, which has no building). It grows south, not east. The dome stays where the dome is today (x 189, z 21).
- A walk of one square stays all round it inside the two plots.
- **The sea front:** the 14 m between the east wall and the coast road's pavement (x 206.5..220.5) becomes the mall's paved front: the
  colonnade, the terrace stair, benches, short palms in planters. Nothing tall.
- **Nothing east of the coast road is touched.** Not the planks, the boardwalk, the sea wall, the sand, the waterline (`COAST.bay`) or the pier.
- **One line, z 21:** the mall arch, the Cordon plaza, the west doors, the fountain under the dome, the sea doors, the crossing, the pier.
  Standing at the fountain you see out through the sea doors and down the pier. Standing on the pier you see the dome.
- The Medical staging plot loses its open ground. Its props (tents, barriers) move to the parking plot west of it (P09-11) or onto the
  sea front. Said here so nothing is lost by surprise.

### Floors and heights
| Level | Height | What |
|---|---|---|
| Ground | 0 m | the two concourses, the atrium, shops, the arcade, the department store, service |
| Upper | 5.25 m | galleries, shops, the food court, the department store's upper floor, the sea terrace outside |
| Eaves | 10.5 m | the same as today's building |
| Vault crown | 13.5 m | glass, over both concourses |
| Dome top | 19 m | glass, over the atrium; the landmark from the pier and the avenue |

Two floors, each one and a half city storeys high, so shop fronts are tall and the camera has room. The roof is not walked, except the
clock tower's top (the tape).

### The ground floor
- **THE CROSS CONCOURSE** (7 m wide, on z 21): west doors to sea doors.
- **THE LONG CONCOURSE** (7 m wide, on x 189): from the atrium south to the department store.
- **THE ATRIUM** (21 x 21 m, open to the dome): the fountain, the clock tower, the two lounges, both escalators.
- **THE ARCADE** (14 x 14 m, north-west corner): the cabinets. Behind its back wall, in the north stub of the concourse: the STAFF ONLY
  door and the stair down to the supply closet (the time machine). Hard to find, as his rule for secrets asks.
- **SERVICE** (north-east corner): the loading bay, the bins, the staff door. Shut to the player except the staff door.
- **Shops:** six on the west side, five on the east. The east ones under the terrace open both ways: to the concourse and to the sea
  front (the juice bar, pretzels, a cafe).
- **THE DEPARTMENT STORE** (35 x 14 m, the south end, both floors, its own stair): the anchor. It is the one shop you walk into.
- In the long concourse: the fun box, the grind ledges, the quarter pipes (the skate things are kept).

### The upper floor
- Galleries 3.5 m wide down both sides of the long concourse, two bridges across it, and the flight tube ring round the atrium (kept).
- Six shops on the west side.
- **THE FOOD COURT** (10.5 x 35 m, east side): counters at both ends, tables by the glass. Its whole east wall is glass doors.
- **THE SEA TERRACE** (7 x 35 m, outside, at 5.25 m, over the colonnade): tables under coral umbrellas, a rail, the view of the pier, the
  beach and the water. Reached from the food court through three glass doors, and from the sea front by an outside stair. It is the
  reason this is a BAYSIDE mall.
- The mall office and security (north-east): the one camera's screen.

### The doors (each is one door, the same place outside and inside)
| Door | Where | Leads to |
|---|---|---|
| W, the main doors | x 171.5, z 21 | the Cordon plaza |
| E, the sea doors | x 206.5, z 21 | the sea front, the crossing, the pier |
| E2 | x 206.5, z 54.25 | the colonnade |
| S | x 189, z 80.5 | the street south of the department store |
| N, the staff door | x 199.5, z 3.5 | the Security office's yard (the quest's service route: needs the pass) |
| three terrace doors | x 206.5, z 38.5, 49, 59.5, at 5.25 m | the sea terrace |
| the closet door | inside, the north stub | the supply closet, down a stair |

These match the Bayside quest plan (`docs/disaster-city/plan-design.md`): the direct way from the plaza starts closed (W), the service
way needs the pass (N), and "the east-shop shutter toward the boardwalk" becomes the mall's own sea doors (E), since the East shops are gone.

### The fronts
- **The sea front (east), the main face now.** A coral portal three storeys high round the glass end of the cross vault, the sign THE BAYSIDE
  MALL, the sea doors under it. South of it a white colonnade with cafe fronts, the terrace over it with umbrellas and a glass wall
  behind. The department store's block closes the south end. The service end is the north: plain wall, the loading door, round the corner
  from the view.
- **The plaza front (west).** The same coral portal and sign over the main doors (today's portal, kept). A row of shop windows with coral
  awnings, a row of upper windows. The ARCADE sign on the north block. Every window is a shop inside.
- **The south front.** The department store: its doors, tall windows on two floors, its sign.
- **The north front.** Service. The loading bay door, the staff door, bins, air units, a fire stair. No signs.
- **The roof.** Terracotta hip roofs on the shop wings (kept), the glass vault along both concourses, the glass dome on a drum with a
  spire, lanterns on the hips (kept). Dark glass in the windows.
- **Signs:** THE BAYSIDE MALL on both portals, lit. Shop names over shop windows are the same names as inside. A directory board at each door.

---

## 5. THE CURRENT MALL IS THE BASIS

### Kept from today's inside
- The cross of two concourses with the atrium and fountain at the crossing.
- The clock tower and its tape. The flight tube. The two lounges, the lava lamps, the saucer and sputnik lamps.
- The upper galleries, the food court upstairs on the east side, the escalators, the wide stairs.
- The arcade, the STAFF ONLY door, the supply closet and its time machine.
- The skate things: the fun box, the ledges, the rails, the quarter pipes.
- Every shop name, every NPC spot and line, both tapes, the encounter lists, the fight board.
- The 1960s terminal feel (curved sofas, tulip tables, saucers) as the FURNITURE. The walls take the outside's colours.

### Kept from today's outside
- The place and the dome's spot. The cross vault, the dome, the hip roofs, the lanterns, the coral portal, the awnings, the Miami deco
  trim, the sand and cream stucco. Today's building is the new building's north end, made longer.

### Changed
- The outside grows from 28 x 28 m to 35 x 77 m, onto the plot south of it.
- The inside shrinks from 96 x 64 m (one floor of 6,144 m²) to 35 x 77 m (2,695 m² a floor, two floors).
- The upper floor moves from 4.6 m to 5.25 m. The city's heights step in half squares.
- The main way in is no longer on a wall that does not exist. Five doors in place of one.
- The food court gets a glass wall and the terrace. The windows show the sea, not mountains.
- The white plaster box becomes the building's own walls. The flat ceiling becomes the vault and the dome.

### Dropped, and why
- The catwalk at 8.4 m and its two fire-escape stairs: it hung under a roof that is now glass. The clock tower keeps the high tape.
- About 20 of the 50 shopfront bays: the building is smaller. No name is lost; names that stood two or three times stand once.
- The eight round windows with mountains in them: real windows replace them.
- The room `site_prebuilt_downtown_mall` itself: it goes to `DOOR_HQ.retired`, pointing at the new one, in the same change (his rule).

---

## 6. HOW IT IS BUILT IN THIS ENGINE

### What the engine does today
- **A city walk-in** (107 of them) is a hollow `texbuilding` row: four ghost walls, one doorway, a roof slab, ONE floor. No city building has
  an upper floor you walk on. The Financial district's halls (`F-inside.js`) are all one floor.
- **A stacked building** exists once: Came A Lot Castle (`bake-camelot-castle.js`), its own room, six levels. Upper floors are `bridge` slabs
  over the room below, stairs are `ramp` rows on the ground, upper walls hang with their own foot height. It works, with rules: no stair over
  a stair or over a walked room, slabs overlap half a metre, every way out stands on solid ground.
- **The city room is already far over its limits:** 7,609 draw calls in its heaviest view against a line of 2,500, and 3,394 MB against a
  line of 1,400 (measured in One World phase 5). The cloud browser died twice in this thread just loading it.
- In the city room: no real lights (glow only), props inside a building are drawn only within 40 m, nothing hides a roof over the player,
  and fights do not stand on bridge slabs.

### Way A: the whole mall inside the city room
You walk through the doors with no loading card. You see the real sea through the real doors.
- Against: two floors of slabs, some 300 props, 30 shopfronts and five NPCs added to a room at three times its limits. A fight on the upper
  floor has no board. No lights under two floors of slab, so the mall is dim. The 40 m rule shows half a 77 m concourse as empty until you
  walk in. Stacked floors have never been built in the city room.

### Way B: its own room, and the room is the building's box (RECOMMENDED)
The city room holds the true outside: the full 35 x 77 m shell, drawn rows, ghost walls, roofs, vault, dome, every door and window, the
sea front and the sea terrace. The inside is its own room, `site_prebuilt_bayside_mall`, **35 x 77 m, the same compass, the same squares**:
a place inside is the city place minus (189, 42). You step through a door on the true wall and stand just inside that same wall.
- For: the mall can be full (lights, props, people, fights on its own board, stacked floors by the castle's proven rules). The city room
  pays only for a shell. Both sides are written from one file, so they cannot drift apart again. This is how the castle is done.
- Against: a loading card at each door (the room is small, so it is short). You do not see the real sea from indoors.
- What makes it honest all the same:
  1. The room's sky, sun and time of day are the city's. Its glass walls and vault show that sky.
  2. The east glass (sea doors, food court) shows the pier, the beach and the water as drawn pieces just outside the glass, placed from the
     same numbers as the city's (the pier at z 21, 7 m wide).
  3. The west glass shows the plaza's bandstand and the arch the same way.
  4. From outside, the dark glass shows the atrium's lamps and the fountain's shape behind it.
  5. The sea terrace is OUTSIDE, in the city room. You step out of the food court's doors onto it and the real sea is there.
- One thing to try in step 5, not promised: the HQ's "stage" join (two rooms joined at a door with no card). If it holds for the mall's
  doors, the card goes.

### Recommendation
**Way B.** Way A is the purer reading of "inside Disaster City", and it is the one that hurts the city room, which mondo already calls
cramped and which is already the heaviest room in the game. Way B gives him what he named: one building, a real exterior and a real
interior that are the same box. If he wants no loading card at any price, Way A can be done for the GROUND FLOOR only (a one-floor mall
hall inside the city, upper floor as its own room). That is question 1.

---

## 7. THE WORK, IN STEPS

Each step is one PR a later thread can do alone. The owner side holds the city: take the Bayside rows on the board first.

| # | Step | Done looks like |
|---|---|---|
| 1 | **THE BOX FILE.** `docs/disaster-city/mall/box.js`: walls, floors, doors, windows, shops, vault, dome, as numbers. `draw-plan.js` reads it. | The four drawings come out of the box file. mondo has OK'd them. |
| 2 | **THE GROUND.** `city-layout.json` + B.js: P10-10-B1 grows to 10 x 22 squares over P10-10 and P10-11; Medical staging's things move; the sea front is paved; the door steps and walks are right. | `node bake-disaster-city.js` passes its checks. A picture from above: a plain block of the right size, nothing overlapped, the walks join. |
| 3 | **THE OUTSIDE.** B.js `B.mall` rewritten from the box file: four fronts, portals, colonnade, terrace + stair, roofs, vault, dome, signs. The terrace is walked (`HQ_CITY_RESIDENTS.walkOn`). | Pictures from the pier, the boardwalk, the plaza, the south, the north and above. It reads as a mall from the pier. City draw calls and memory measured before and after. |
| 4 | **THE INSIDE ROOM.** A new tool `bake-mall.js` writes `site_prebuilt_bayside_mall` from the box file by the castle's stacking rules: ground, upper floor, galleries, bridges, stairs, escalators, the atrium void, shopfronts, the department store. Bare, no dressing. | You can walk every floor and every stair. Pictures of each concourse and the atrium looking up at the dome. Calls and memory under the room lines. |
| 5 | **THE DOORS.** All five ground doors and the three terrace doors, both ways, same place both sides. The old `mall` door goes. The closet hangs off the new room. Try the no-card join. | Walk in at each door and out again: you come out where you went in. The door audit's check passes. |
| 6 | **THE MOVE.** Everything kept in section 5 moves in: furniture, lamps, the clock tower and tape, skate things, NPCs and lines, tapes, encounter lists, the fight board, light shafts, the look. `site_prebuilt_downtown_mall` goes to `DOOR_HQ.retired`. | A count before and after: nothing missing but the things section 5 drops. The tape is still reached. A fight starts and ends in the mall. |
| 7 | **THE VIEW OUT AND IN.** The pier, beach and plaza drawn outside the room's glass; the atrium seen through the outside's glass; the mall lit at night. | A picture from the fountain out to the pier. A picture from the pier at night. |
| 8 | **THE DRESSING.** MODEL_LIST.md searched first (mall, shop, food, arcade, cafe, beach). Shop windows dressed, the food court's counters, the terrace's tables, the service yard, the directory boards. Bayside's quest gates if mondo wants them now. | Pictures. 75 % of the city's detail, by his rule. |
| 9 | **THE RECORD.** `areas-complexes.md`, `world-layout.md`, MODEL_LIST.md §8b, the board, the map picture (`node bake-map.js`). | The notes match the game. |

### Never touched by these steps
- The pier, the boardwalk, the sea wall, the sand, the waterline, the mole, the skate park: all as the One Beach thread left them.
- The planks between the coast road and the boardwalk: nothing tall, ever (mondo 11-20).
- The coast road and its palms.
- The rest of Bayside: the cinema, the hotel, the food hall, the Security office, the arch, the bandstand.
- The city's plan and dice outside plots P10-10 and P10-11.
- The supply closet room and the time machine (only its door's other end changes).
- The old streets room (the PvP board).

### Traps already known
- The tool lifts a drawn `arch` row by its plot's level, and a drawn row stands at its own y. Both plots are level 0; check P10-11 before step 2.
- A raised flat is shut to city residents unless its id is in `HQ_CITY_RESIDENTS.walkOn` (the terrace).
- The cloud browser dies for memory if anything runs beside a city probe. It died twice in this thread with nothing beside it; give a city
  probe the whole machine and expect retries.
- Two walk-ins back to back at two levels share their line badly. The mall is one building on one level: keep it so.
- The city room's hollow ceiling draws black. The mall's shell in the city is `skin: false` with its own drawn roof.

---

## 8. QUESTIONS FOR MONDO

1. **Own room or inside the city?** The plan is: the true outside in the city, the inside as its own room of exactly the same box, entered
   through the real doors (a short loading card), the sea terrace outside in the city. The other way is the whole mall inside the city room
   with no card, which is heavy on a room already at three times its limits. **I recommend its own room.**
2. **May it take the Medical staging plot (P10-11)?** The building grows south onto it, to 35 x 77 m. The polish plan says "free to grow";
   I ask because a plot of his plan loses its open ground. **I recommend yes.**
3. **Two floors?** Ground and upper at 5.25 m, a glass vault and the dome above; the catwalk goes. **I recommend two.** A third floor would
   make it taller than everything round it in Bayside, the lowest district.
4. **The inside gets smaller** (6,144 m² on one floor becomes 2,695 m² on each of two). Matching today's inside would take six plots.
   **I recommend the smaller, true size.**
5. **The style indoors:** the outside's Miami colours on the walls, the 1960s terminal kept as furniture and lamps. **I recommend that**,
   since "same materials inside and out" is what makes it read as one building.
