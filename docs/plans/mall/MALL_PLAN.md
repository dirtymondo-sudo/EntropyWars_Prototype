# THE BAYSIDE MALL, THE PLAN

World polish thread 20. Written 2026-11-20.

**BUILT 2026-11-20, FIRST PASS (steps 1 to 6).** mondo's word on the questions: "Own room, 2 or 3 plots. 2 floors. Yes. Sure. GO ahead". So the building is BIGGER than this plan drew: 70 x 38.5 m (x 136.5..206.5, z 3.5..42), the old plot plus the east of the Cordon plaza, with a second cross hall and a Department Store. The numbers that are true now are `docs/disaster-city/mall/box.js`; what was built, the traps and what is next are in `docs/notes/areas-complexes.md` "THE BAYSIDE MALL"; pictures in `after/`. The text below is the plan as it was shown to him.

mondo, 2026-11-20:
- "the mall needs to be redone, since its outside looks nothing like its inside. It needs to be a real physical building inside disaster city"
- "it is supposed to be a bayside mall"
- "start the mall plan. Needs exterior and interior, use the current mall as a basis. Real architecture, outside has to match the inside
  (currently they are 2 totally separate buildings)"

Pictures beside this file:
- `before/` : the game today, 14 pictures (`[EW BUILD] HEAD 8c95f56`, FRESH). `out_*` = the outside, `in_*` = the inside.
- `01_mismatch.png`, `02_site.png`, `03_floors.png`, `04_elevations.png` : the plan, drawn by `node docs/plans/mall/draw-plan.js`.
  They are sketches of sizes and places, not the finished look. Change a number in that script first, then here.

All places are room metres of the city room `site_prebuilt_downtown_streets`: x runs east, z runs south. A square is 3.5 m.

---

## 1. WHAT THE MALL IS TODAY

### The outside
- Building `P10-10-B1` "Mall concourse" on Bayside's plot P10-10 (`docs/disaster-city/city-layout.json`; drawn by `B.mall` + `POLISH.mall` in
  `docs/disaster-city/districts/B.js`).
- It stands at x 175..203, z 7..35. **28 x 28 m** (8 x 8 squares), in a 42 m plot. Ground level 0 (sea level).
- 10.5 m to the eaves (`storeys: 3`), hip roofs to 13.5 m, a glass dome over the middle.
- Shape: four sand and cream corner blocks under terracotta hip roofs, round a glass cross vault 8.4 m wide, a glass dome on the crossing,
  a coral portal on the west face with the sign THE MALL, striped awnings. Miami deco trim.
- Windows on all four sides: shop glass on the ground, two rows of windows above.
- **One door**, on the west face (x 174.75, z 19.25), facing the Cordon plaza. There is no door to the sea.
- It is a hollow walk-in (`hollow: true`, `skin: false`): an empty one-floor shell stands inside the walls (`before/out_8`), but the door does
  not lead into it. The door jumps you to another room.

### The inside
- A separate room, `site_prebuilt_downtown_mall` (data.js). Built 2026-09-17 for the old Downtown, restyled 09-21 as "a 1960s terminal".
- **One box of 96 x 64 m, 12 m high.** Plaster walls, terrazzo, a flat ceiling.
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
| the old streets' `mall` door | room `site_prebuilt_downtown_oldstreets` | the same `street` door | that room is retired; kept only as a PvP board |

No other mall room exists: no shop interior, no car park, no separate food court. The closet is the only room behind it.
The time machine's link to old Cyberpunk City (`timemachine_cyberpunk`) is already in `DOOR_HQ.cut.links`.

### What else points at the two rooms (data.js)
The area fight board (`_MF_AREA_DELTA_BUILDERS`), the skylight beams (`DOOR_HQ.lightShafts`), two tapes (`HQ_TAPE_SHEET`: THE FOOD COURT,
STAFF ONLY), the tape's place (`DOOR_HQ.findSpots`), the encounter lists (`HQ_AREA_ENCOUNTERS`), the look (`HQ_ROOM_LOOKS.mall`).
Not on the zone map, not in the hubs, not an arena pick.

### What stands round it (read from the room's rows and checked in the pictures)
- **West:** the Cordon plaza (P09-10, no building, the bandstand on its north lawn, barriers and sandbags), then the Arrival court with THE
  MALL ARCH at x 120.75, z 21.
- **North:** the Staff apartments (`P10-09-B2`, x 168..185.5, z -17.5..0), 7 m from the mall's wall. The Security office behind them.
- **South:** a blank filler block (`dc:in105`, x 185.5..203, z 38.5..45.5, 7 m high, dark, no door on the mall's side), 3.5 m from the mall's
  wall. Then **the canal** (z 45.5..52.5, from x 115.5 east to the sea, four plank bridges, boats). South of the canal: Medical staging.
- **East:** the Juice dome (`P11-10-B2`, x 210..220.5, z 0..17.5), 7 m from the mall's wall. South of it open paving. Then the coast road
  (carriageway x 224..238, short palms on its middle line), the planks kept clear for the view (x 241.5..252), the boardwalk (x 252..259),
  the sea wall, the sand one step down, the waterline near x 295.
- **The pier runs out on the mall's own line, z 21:** 7 m wide from the sea wall to x 297.5, then a 21 m head with the pavilion.

---

## 2. WHAT THE PICTURES SHOW (`before/`)

### The outside
- **It is a good-looking small building, and it is too small to be a mall.** From the pier (`out_3`) it is one low house among taller ones.
  The Juice dome in front of it is nearly as big. The dome is the only thing that says "landmark".
- **The west front (`out_1`):** the coral portal and the sign THE MALL read well. Inside the portal the wall is a dark brick apartment front
  with small windows, a strip of glass that does not line up, and one grey service door with a plate. That is the main entrance. It looks
  like a back door.
- **The sea front (`out_2`):** the glass end of the vault, no door, no sign, no name. From the boardwalk the mall does not say what it is
  and cannot be entered. The Juice dome hides its north half.
- **The south (`out_4`):** fully hidden. The blank dark block stands 3.5 m in front of it, then the canal. The canal side is a nice place
  (water, boats, plank bridges) and the mall shows it a wall.
- **The north (`out_5`):** the glass end of the vault again, no door, the apartments close by.
- **From above (`out_6`, `out_7`):** the cross vault and the dome are clear and handsome. They are the best part. Nothing inside matches them.
- **Inside the shell (`out_8`):** bare plaster walls and a bare floor. Nobody is meant to see it.

### The inside
- **A wide grey hall (`in_1`, `in_6`).** The floor is about 60 m of empty terrazzo between far walls. The lounges and the fountain are lost
  in it.
- **The ceiling (`in_2`) is flat grey with a few lamps.** No glass, no vault, no dome, no sky.
- **The shops (`in_3`, `in_4`) are name boards on a blank wall** with a grille under each. The walls are stained plaster.
- **The upper floor (`in_5`)** is concrete decks with pipe rails. It reads as a car park's upper deck, not a mall's gallery.
- No daylight, no view out, no hint of the sea, and nothing of the pastel building you just walked into.

---

## 3. THE MISMATCH, MEASURED (`01_mismatch.png`)

| | Outside | Inside |
|---|---|---|
| Size on the ground | 28 x 28 m | 96 x 64 m |
| Floor | 784 m² | 6,144 m² (7.8 times as much) |
| Height | 10.5 m eaves, a dome above | 12 m, a flat ceiling |
| Floors | reads as three rows of windows | two floors and a catwalk |
| Doors | one, west | one, south (and the closet, north) |
| Roof | glass cross vault + glass dome | a flat ceiling, three small beams of light |
| Windows | shop glass and windows on four sides | eight small round windows with mountains in them |
| Style | pastel Miami stucco, terracotta roofs | grey stained plaster, 1960s lounge furniture |
| The sea | 56 m away, no door to it | never seen |

In plain words:
- The inside is 3.4 times as long and 2.3 times as wide as the building. It would cover four plots.
- You walk in facing east and arrive facing north.
- The outside promises a glass vault and a dome. Inside there is a ceiling.
- The inside has an atrium, a food court and about 50 shop names. The outside shows one service door.
- The outside's cross shape (four blocks round two crossing glass halls) IS the inside's idea (two crossing concourses round an atrium).
  That is the thing to build on.
- It is a mall by the sea with no door to the sea. The pier is on its line and it does not use it.

---

## 4. THE ONE BUILDING (`02_site.png`, `03_floors.png`, `04_elevations.png`)

### The rule
**One box, written once.** One file holds the mall's numbers (walls, floors, doors, windows, vault, dome). The outside and the inside are
both written from that file. So:
- Every outside door is an inside door at the same place, facing the same way.
- Every window seen from outside is a shop window, a hall window or a skylight inside, at the same place and height.
- The atrium's roof is the building's dome. The concourses' roof is the building's glass vault.
- The inside is never bigger than the walls. The floors stand at the heights the windows show.
- The same materials on both sides of a wall: the sand stucco, coral trim and glass come indoors.

### Where it stands
- **The body: x 171.5..206.5, z 3.5..42. 35 x 38.5 m, 10 x 11 squares.** It stays on its own plot, P10-10. It grows one square west, north
  and east, and two squares south to the canal's quay. The dome stays exactly where the dome is today (x 189, z 21).
- **It is today's building, made bigger.** The same four blocks, the same cross of glass halls, the same dome and portal.
- **One thing has to go:** the blank filler block `dc:in105` on the south side. It is a tool's fill-in with no name and no use, and it is
  what hides the mall from the canal. Nothing else is moved or removed.
- **Kept and used:** the Juice dome (it becomes the mall's kiosk on the sea front), the canal and its bridges (the mall gets a canal door),
  the Cordon plaza, the bandstand, the mall arch, the Staff apartments.
- **The sea front:** the open paving east of the mall and south of the Juice dome, as far as the coast road's pavement. It gets the
  colonnade, the terrace stair, cafe tables, short palms in planters. Nothing tall.
- **Nothing east of the coast road is touched.** Not the planks, the boardwalk, the sea wall, the sand, the waterline (`COAST.bay`) or the pier.
- **One line, z 21:** the mall arch, the Cordon plaza, the main doors, the fountain under the dome, the sea doors, the crossing, the pier.
  From the fountain you see out through the sea doors and down the pier. From the pier you see the portal and the dome over it.

### Floors and heights
| Level | Height | What |
|---|---|---|
| Ground | 0 m | the two concourses, the atrium, shops, the arcade, service |
| Upper | 5.25 m | galleries, the ring walk, shops, the food court, the sea terrace outside |
| Eaves | 10.5 m | the same as today's building |
| Vault crown | 13.5 m | glass, over both concourses |
| Dome top | 19 m | glass, over the atrium; the landmark from the pier and the plaza |

Two floors, each one and a half city storeys high, so shop fronts are tall and the camera has room. The outside's windows change from
three rows to two, to match.

### The ground floor
- **THE CROSS CONCOURSE** (7 m wide, on z 21): main doors to sea doors.
- **THE LONG CONCOURSE** (7 m wide, on x 189): from the staff end in the north to the canal doors in the south.
- **THE ATRIUM** (14 x 14 m, open to the dome): the fountain, the clock tower beside it (off the line, so the view to the pier is clear),
  a lounge.
- **THE ARCADE** (14 x 14 m, the north-west block, walked into): the cabinets. At its back, at the north end of the concourse: the STAFF
  ONLY door and the stair down to the supply closet (the time machine). Hard to find, as his rule for secrets asks.
- **SERVICE** (north-east block, north half): the loading bay, bins, the staff door. Shut to the player except the staff door.
- **Shops:** two in the north-east block, four in the south-west, three in the south-east. The south-east three open both ways: to the
  concourse and to the colonnade on the sea front.
- **Ways up:** two escalators in the south arm of the long concourse, a wide stair in the north arm.
- The fun box and the grind ledges stay in the concourses. The two quarter pipes do not fit a 7 m hall; they go outside to the sea front.

### The upper floor
- Galleries 3.5 m wide along the concourses, a bridge at the south end, and the flight tube: the ring walk round the atrium (kept).
- **THE FOOD COURT** (10.5 x 17.5 m, the south-east block, walked into): counters on the south wall, tables by the glass. Its east wall is
  glass doors.
- **THE SEA TERRACE** (7 x 17.5 m, outside, at 5.25 m, on a white colonnade): tables under coral umbrellas, a rail, the view of the pier,
  the beach and the water. Reached from the food court through two glass doors, and from the sea front by an outside stair. This is what
  makes it a BAYSIDE mall.
- Shops on the west side. The arcade's upper room with the prize counter. The mall office and security (the one camera's screen).

### The doors (each is one door, the same place outside and inside)
| Door | Where | Leads to |
|---|---|---|
| the main doors | x 171.5, z 21, west | the Cordon plaza |
| the sea doors | x 206.5, z 21, east | the sea front, the crossing, the pier |
| the canal doors | x 189, z 42, south | the quay and the canal's bridges |
| the staff door | x 199.5, z 3.5, north | the yard by the Security office (the quest's service route: needs the pass) |
| two terrace doors | x 206.5, z 29.75 and 36.75, at 5.25 m | the sea terrace |
| the closet door | inside, north end | the supply closet, down a stair |

These fit the Bayside quest plan (`docs/disaster-city/plan-design.md`): the direct way from the plaza starts closed (the main doors), the
service way needs the pass (the staff door), and "the east-shop shutter toward the boardwalk" becomes the mall's own sea doors, since the
East shops are gone.

### The fronts
- **The sea front (east).** The coral portal round the glass end of the vault, the sign THE BAYSIDE MALL, the sea doors under it. South of
  it the white colonnade with three shop fronts, the terrace over it with umbrellas, the food court's glass wall behind. North of it
  shop windows, with the Juice dome standing in front as it does today.
- **The plaza front (west).** The same portal and sign over real glass doors (today's portal, kept; the brick wall and the grey door in it
  go). Shop windows with coral awnings on the ground, a row of windows above. The ARCADE sign on the north block.
- **The canal front (south).** The glass end of the long concourse with the canal doors, shop windows either side, a quay one square
  wide with benches. The mall is seen across the water from the bridges.
- **The north front.** Service. The loading bay door, the staff door, bins, air units. No signs. It faces the apartments' back.
- **The roof.** Terracotta hip roofs with lanterns on the four blocks (kept), the glass vault along both concourses, the glass dome on a
  drum with a spire (kept, a little wider: 14 m). Dark glass in the windows.
- **Signs:** THE BAYSIDE MALL on the portals, lit. A shop's name over its window is the same name as inside. A directory board at each door.

---

## 5. THE CURRENT MALL IS THE BASIS

### Kept from today's inside
- The cross of two concourses with the atrium and fountain at the crossing.
- The clock tower and its tape. The flight tube. A lounge with the curved sofas, the lava lamps, the saucer and sputnik lamps.
- The upper galleries, the food court upstairs on the east side, the escalators, a wide stair.
- The arcade, the STAFF ONLY door, the supply closet and its time machine.
- The fun box, the grind ledges, the rails.
- Every shop name, every NPC spot and line, both tapes, the encounter lists, the fight board.

### Kept from today's outside
- The place, the plot, the dome's spot. The four blocks, the cross vault, the dome, the hip roofs, the lanterns, the coral portal, the
  awnings, the Miami deco trim, the sand and cream stucco.

### Changed
- The outside grows from 28 x 28 m to 35 x 38.5 m.
- The inside shrinks from 96 x 64 m (6,144 m² on one floor) to 35 x 38.5 m (1,348 m² a floor, two floors).
- The upper floor moves from 4.6 m to 5.25 m (the city's heights step in half squares).
- Four doors in place of one, each on the wall it is seen on.
- The food court gets a glass wall and the terrace. The windows show the bay, not mountains.
- The grey plaster box becomes the building's own walls. The flat ceiling becomes the vault and the dome.

### Dropped, and why
- The catwalk at 8.4 m and its two fire-escape stairs: it hung under a roof that is now glass. The clock tower keeps the high tape.
- About 30 of the 50 shopfront bays: the building is smaller. No name is lost; a name that stood two or three times stands once.
- One of the two lounges and two of the four wide stairs: no room. The quarter pipes move outside.
- The eight round windows with mountains in them: real windows replace them.
- The blank filler block south of the mall (`dc:in105`).
- The room `site_prebuilt_downtown_mall` itself: it goes to `DOOR_HQ.retired`, pointing at the new one, in the same change (his rule).

---

## 6. HOW IT IS BUILT IN THIS ENGINE

### What the engine does today
- **A city walk-in** (107 of them) is a hollow `texbuilding` row: four ghost walls, one doorway, a roof slab, ONE floor. No city building
  has an upper floor you walk on. The Financial district's halls (`F-inside.js`) are all one floor.
- **A stacked building** exists once: Came A Lot Castle (`bake-camelot-castle.js`), its own room, six levels. Upper floors are `bridge`
  slabs over the room below, stairs are `ramp` rows on the ground, upper walls hang with their own foot height. It works, with rules: no
  stair over a stair or over a walked room, slabs overlap half a metre, every way out stands on solid ground.
- **The city room is already far over its limits:** 7,609 draw calls in its heaviest view against a line of 2,500, and 3,394 MB against a
  line of 1,400 (One World phase 5's numbers). In this thread the cloud browser died three times loading it before one run got through.
- In the city room: no real lights (glow only), props inside a building are drawn only within 40 m, nothing hides a roof over the player,
  and fights do not stand on bridge slabs.

### Way A: the whole mall inside the city room
You walk through the doors with no loading card. You see the real sea through the real doors.
- Against: two floors of slabs, some 200 props, 20 shopfronts and five NPCs added to a room at three times its limits. A fight on the
  upper floor has no board. No lights under a floor slab, so the mall is dim. Stacked floors have never been built in the city room.

### Way B: its own room, and the room is the building's box (RECOMMENDED)
The city room holds the true outside: the full 35 x 38.5 m shell, its roofs, vault and dome, every door and window, the sea front and the
sea terrace. The inside is its own room, `site_prebuilt_bayside_mall`, **35 x 38.5 m, the same compass, the same squares**: a place inside
is the city place minus (189, 22.75). You step through a door on the true wall and stand just inside that same wall.
- For: the mall can be full (lights, props, people, fights on its own board, stacked floors by the castle's proven rules). The city room
  pays only for a shell. Both sides are written from one file, so they cannot drift apart again. This is how the castle is done.
- Against: a loading card at each door (the room is small, so it is short). You do not see the real sea from indoors.
- What keeps it honest:
  1. The room's sky, sun and time of day are the city's. Its glass vault and dome show that sky.
  2. Beyond the sea doors and the food court's glass the pier, the beach and the water are drawn pieces, placed from the same numbers as
     the city's (the pier on z 21, 7 m wide).
  3. Beyond the main doors the plaza's bandstand and the arch are drawn the same way; beyond the canal doors, the canal.
  4. From outside, the dark glass shows the atrium's lamps behind it.
  5. The sea terrace is OUTSIDE, in the city room. You step out of the food court's doors onto it and the real sea is there.
- One thing to try in step 5, not promised: the HQ's "stage" join (two rooms joined at a door with no card). If it holds, the card goes.

### Recommendation
**Way B.** Way A is the purer reading of "inside Disaster City", and it is the one that hurts the city room, which is already the heaviest
room in the game. Way B gives what he named: one building, a real exterior and a real interior that are the same box. If he wants no
loading card at any price, the middle way is the GROUND FLOOR inside the city room and the upper floor as its own room. That is question 1.

---

## 7. THE WORK, IN STEPS

Each step is one PR a later thread can do alone. The owner side holds the city: take the Bayside rows on the board first
(`docs/notes/claims.md`; the One Beach thread holds the coast until mondo has looked).

| # | Step | Done looks like |
|---|---|---|
| 1 | **THE BOX FILE.** `docs/disaster-city/mall/box.js`: walls, floors, doors, windows, shops, vault, dome, as numbers. `draw-plan.js` reads it. | The four drawings come out of the box file. mondo has OK'd them. |
| 2 | **THE GROUND.** `city-layout.json` + B.js: P10-10-B1 grows to 10 x 11 squares; `dc:in105` goes; the quay, the sea front and the walks round the building are paved and join; the quarter pipes stand on the sea front. | `node bake-disaster-city.js` passes its checks. A picture from above: a plain block of the right size, nothing overlapped, a way all round it. |
| 3 | **THE OUTSIDE.** B.js `B.mall` + `POLISH.mall` rewritten from the box file: four fronts, two portals, the canal front, the colonnade, the terrace + its stair, roofs, vault, dome, signs. The terrace is walked (`HQ_CITY_RESIDENTS.walkOn`). | Pictures from the pier, the boardwalk, the plaza, a canal bridge, the north and above. From the pier it reads as a mall. City draw calls and memory measured before and after. |
| 4 | **THE INSIDE ROOM.** A new tool `bake-mall.js` writes `site_prebuilt_bayside_mall` from the box file by the castle's stacking rules: ground, upper floor, galleries, the ring walk, stair, escalators, the atrium, the vault and dome from below, shopfronts. Bare, no dressing. | Every floor and stair is walked. Pictures of each concourse and of the atrium looking up into the dome. Calls and memory under the room lines. |
| 5 | **THE DOORS.** The four ground doors and the two terrace doors, both ways, the same place both sides. The old `mall` door goes. The closet hangs off the new room. Try the no-card join. | Walk in at each door and out again: you come out where you went in, facing the way you walked. |
| 6 | **THE MOVE.** Everything kept in section 5 moves in: furniture, lamps, the clock tower and tape, skate things, NPCs and lines, tapes, encounter lists, the fight board, the look. `site_prebuilt_downtown_mall` goes to `DOOR_HQ.retired`. | A count before and after: nothing missing but what section 5 drops. The tape is still reached. A fight starts and ends in the mall. |
| 7 | **THE VIEW OUT AND IN.** The pier, beach, plaza and canal drawn beyond the room's glass; the atrium seen through the outside's glass; the mall lit at night. | A picture from the fountain out to the pier. A picture from the pier at night. |
| 8 | **THE DRESSING.** MODEL_LIST.md searched first (mall, shop, food, arcade, cafe, beach). Shop windows dressed, the food court's counters, the terrace's tables, the service yard, the directory boards. | Pictures. 75 % of the city's detail, by his rule. |
| 9 | **THE RECORD.** `areas-complexes.md`, `world-layout.md`, MODEL_LIST.md §8b, the polish plan's thread 20, the board, the map picture (`node bake-map.js`). | The notes match the game. |

### Never touched by these steps
- The pier, the boardwalk, the sea wall, the sand, the waterline, the mole, the skate park: all as the One Beach thread left them.
- The planks between the coast road and the boardwalk: nothing tall, ever (mondo 11-20).
- The coast road and its palms.
- The canal, its bridges and boats.
- The Juice dome, the Staff apartments, the Security office, the Cordon plaza, the bandstand, the mall arch, the cinema, the hotel.
- The city's plan and dice outside plot P10-10.
- The supply closet room and the time machine (only its door's other end changes).
- The old streets room (the PvP board).

### Traps already known
- The tool lifts a drawn `arch` row by its plot's level, and a drawn row stands at its own y. Plot P10-10 is level 0: keep the mall on it.
- A raised flat is shut to city residents unless its id is in `HQ_CITY_RESIDENTS.walkOn` (the terrace).
- A city probe needs the whole machine. It died three times here while a file search ran beside it, and ran clean when alone.
- The city's hollow ceiling draws black. The mall's shell in the city is `skin: false` with its own drawn roof; nobody walks into the shell.
- The files alone did not show the filler block, the canal or the Juice dome round the mall. Look at the room's rows and a picture from
  above before trusting the plan's plot list.

---

## 8. QUESTIONS FOR MONDO

1. **Own room or inside the city?** The plan: the true outside in the city, the inside as its own room of exactly the same box, entered
   through the real doors (a short loading card), the sea terrace outside in the city. The other way is the whole mall inside the city room
   with no card, which is heavy on a room already at three times its limits. **I recommend its own room.**
2. **The size.** One plot: 35 x 38.5 m, two floors. It is today's outside made a quarter bigger, and today's inside made much smaller
   (the hall is 96 x 64 m now). It is hemmed in by the apartments, the Juice dome and the canal. A bigger mall is possible: a south wing
   over the canal onto the Medical staging plot would double it, with the canal running under a glass bridge hall. **I recommend the one
   plot first.** It touches nothing of anyone else's, and the wing can be added later if it feels small.
3. **Two floors?** Ground and upper at 5.25 m, the glass vault and the dome above; the catwalk goes. **I recommend two.** Bayside is the
   lowest district and the mall should not stand over the hotel.
4. **The blank block south of the mall goes** (a tool's filler, no name, no door on that side). It hides the mall from the canal.
   **I recommend removing it.** I ask because you did not name it.
5. **The style indoors:** the outside's Miami colours and glass on the walls and roof; the 1960s lounge kept as furniture and lamps.
   **I recommend that.** The grey stained plaster goes.
