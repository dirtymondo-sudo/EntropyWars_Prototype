# LEVEL DESIGN — the areas that need it most, rebuilt as rooms, hallways and architecture

*Plan document, 2026-09-30. House rules over every delivery: no puzzles (jumping across platforms is traversal),
no invented names (plain labels: Room 1, Hall A, Island 3; only names mondo gave), no sound work, no test files,
reuse the bucket's textures and models (no new art), only a quick load check in the browser. Every R2 delivery
bumps `?v=`. The Woods and Disaster City's streets are out of scope (mondo). §9 is the log.*

mondo's brief (2026-09-30), the parts that decide things:

- "Focus on the areas of the map we haven't touched as much (so not the woods or disaster city), or areas that still
  have weird raised terrain when it is clearly meant to be a building or man made structure."
- "I want the astral realm to have floating platforms that you have to jump across, figure out how to make that work
  and look good."
- "I want the staircase to the woods inside the door facility to look like the reference image, not in the stairwell."
- "I want the spaceship to have no load screens going between the rooms."
- "Sewers, tunnels, caverns, dungeons … look more like the map layouts, actual mazes and level designs, not just big areas."
- "The vatican looks stupid, the library has the weird raised terrain."

---

## 1. What the reference images say (door_reference_images/, the 2026-09-30 upload)

| Image | What to take from it |
|---|---|
| `staircase_to_the_woods.PNG` | One tall hall. A pale checker floor with a gold ring inlaid round the middle, a coloured runner down the centre to ONE wide straight stair that climbs to a big door under a clock face, free-standing columns either side, tall panelled walls lit from inside, the door you came in by standing alone on the floor. The stair is the room: everything points at it. |
| `astral_realm_floating_platforms.PNG` | Islands of stepped rock hanging in a starfield, flat tops, undersides that taper to a point, dark stalks growing on them, a purple glow below. The gaps between islands are the level. |
| `spaceship_interior.PNG` | A round command deck under a glass dome, consoles in a ring, a raised walkway in, light strips in the floor and the rails. |
| `map_layout.JPG` | THE TEMPLATE for every dungeon: rectangular rooms of different sizes joined by hallways 2–3 m wide, hallways that bend at right angles, loops (two ways round), dead-end side rooms holding the loot, one long corridor that doubles back on itself, the exit at the far end from the spawn. |
| `map_layout_2.JPG` | A shooter map: 2 areas of interest, 3 lanes between them, the lanes crossing through small connectors, choke doors. The 8×8 battle grid wants exactly this: open rooms joined by lanes. |
| `map_layout_3.JPG` | A base: a hub room with spokes, a round ward room, quarters down one corridor, a vent-shaft maze (narrow, twisting) round a warehouse. Narrow and wide lanes mixed. |
| `map_layout_4.JPG` | Levels stacked: ground floor, first floor, second floor, joined by stairs at known spots. |
| `multiple_floors_interior.WEBP` | A cavern done as stacked ledges: a stair up the wall, a waterfall, a pool on the lowest ledge, rooms off the top ledge. Height is walls and stairs, never blobs. |
| `tunnel_or_leylines.PNG` | A corridor of cut stone blocks, pilasters every few metres, a set piece at the end of the corridor (the carved head). Straight walls, square corners. |
| `rooftops.PNG` | Rooftops as a level: parapet walls, flat roofs at different heights, the street far below. |
| `moody_cyberpunk_city.PNG`, `architecture_and_mood.jpg` | Mood: built stone, arches, stairs cut into the floor, dark sky. Structures are architecture, not terrain. |

The one rule all of them share: **walls are walls.** A building's inside is floors and walls at square corners; a cave
is a maze of passages with rock walls; height is a stair, a ledge or a gallery you can see is built. None of them has a
2.4 m bank of generated terrain standing in the middle of a floor.

---

## 2. What the engine already has (so nothing here is invented from scratch)

| Tool | Where | What it gives |
|---|---|---|
| THE LAYOUT (`terrain.gen.kind: 'plan'`) | data.js `_hqTGenerate`, `hqPlanShapes`, `HQ_TERRAIN_GEN.plan` (E5) | Hand-drawn `space` rows (rooms) and `hall` rows (hallways). `look: 'walls'` = a mass to the ceiling with the boundary traced into straight walls (`wallKey`); `look: 'rock'` = rock banks; `look: 'trees'` = the forest. Exactly "rooms of different sizes joined by hallways". |
| The area sheet draws a LAYOUT room room-by-room | data.js `hqRoomPlan*`, map.js `_hqAreaPlans` (Z3) | Dormant today (no player room has a LAYOUT). Every room this plan converts lights it up for free. |
| Floating pieces (`float: true` on a `plateau` / a stair `ramp`) | data.js `info.floats`, three-renderer.js `_hqBuildFloats` | A tier hung in the air with the field cut away under it. Heaven's stair and the Astral sea's three thoughts use it. |
| The walker's jump | three-renderer.js `HQ_JUMP_V` 7.25 m/s, `HQ_GRAV` 18 | Apex 1.46 m, airtime 0.8 s; running (4.6 m/s) that is a 3.7 m flat reach. |
| Built walls, bridges | `wall` / `bridge` feature rows (the garage, the stadium, Camelot's ward) | Real architecture on a flat floor. |
| The stage (door-joined parts, no card) | `HQ_WORLD.zones` + `HQ_STAGE_RULES.zones` (Z2) | Nine HQ zones today. The spaceship becomes the tenth. |

What is missing, and gets built here:

1. **THE VOID** (for the Astral realm): a room whose floor is empty space. Falling below the islands returns the walker to
   the last island it stood on (a short fade, no damage), the void is never a battle seat, never a spawn, never
   populated, and it is drawn as a starfield with a glow under the islands, not as ground.
2. **Rock undersides** for floating islands (today every floating piece gets cloud puffs): a `look` on the float that
   hangs a stepped rock cone in the cliff sheet.

---

## 3. The ranking: which areas need the most work

Scored on: raised generated terrain inside something that is clearly built (the complaint), "one big area" instead of a
layout, load cards inside one place, and how little it has been touched. The Woods and Disaster City's streets are left out.

| # | Area | Rooms today | What is wrong | Fix |
|---|---|---|---|---|
| 1 | **The Vatican** | basilica (plateau terraces), library (`cave` gen: 5.6 m wood blobs as "stacks"), catacombs (`cave` gen), courtyard (`rooms` gen banks), observatory | A church, an archive and a crypt made of generated terrain. mondo: "looks stupid", "weird raised terrain". | Architecture: the basilica as a nave + aisles + transepts with columns and a stair up to a built gallery; the library as shelf aisles (real shelves in rows) with a built mezzanine; the catacombs as a LAYOUT maze (walls look, tomb niches in dead ends); the courtyard as a walled cortile with a real cypress maze (tree walls) |
| 2 | **The Astral realm** | sea (150 × 120 m meadow with 2.4 m crystal banks), nightmare (`cave`), library (`ley` walls) | A flat meadow with blobs; mondo wants floating platforms to jump across. | The sea becomes islands in THE VOID (§2): a route of jumps, big islands as rooms of interest (battles), small stepping stones between, a fall returns you. The library becomes a maze of stacks (walls look). |
| 3 | **The Spaceship** | airlock, hold, bridge (boxes), deck (`rooms` gen with 3 m banks on a ship's deck) | A load card between every room of one ship; terrain on a deck. | One staged zone (no cards between its rooms). The deck rebuilt as corridors and compartments (walls look). The bridge gets the round command-deck look of the reference. |
| 4 | **The Sewers** (+ the running tunnels, the cells, the workings) | `halls` BSP rooms 120 × 84 and 124 × 96, `cave` workings | Big generated floors; not mazes. | LAYOUT mazes on `map_layout.JPG`'s pattern: culverts as hallways, junction chambers as rooms, loops, dead ends, the channel down the middle of the main culvert. |
| 5 | **The Cavern** (hollow earth ×6, the inner sun) | `cave` gen ×6, `rooms` gen | Cellular blobs. | LAYOUT with the rock look: passages and chambers, ledges up the walls with stairs (`multiple_floors_interior`), the inner sun kept as the big open room at the end. |
| 6 | **Dungeons**: Dead Man's Cave, Camelot's dungeon (`cave`), Hell's pit (`cave`) | | Blobs / one long room. | LAYOUT mazes: Camelot's dungeon cells off corridors (walls look), Dead Man's Cave as a culvert maze, Hell's pit as ledges round the pit. |
| 7 | **The D.U.M.B.** (motor pool, sublevel 7, dream lab, clone vats, bunker), Area 51 hangar + ward, CERN, the Lodge (the Backrooms was deleted 2026-09-30: H-Wing is the game's backrooms) | `halls` BSP | Generated, samey. Closest to right already (walls to the ceiling). | FREEZE each into a LAYOUT and redraw it on `map_layout_3.JPG` (hub + spokes + vent maze). |
| 8 | **Ship decks**: the Flying Dutchman's deck, the derelict's deck | `rooms` gen banks | Terrain on a ship. | Built decks (bridges, walls, hatches). The derelict's deck goes in delivery 3. |
| 9 | **Built towns on banks**: Agartha, the temple city, Antarctica station, the North Pole village, the haunted grounds, Olympus, Babel, Giza, Stonehenge, Göbekli tell | `rooms` gen banks round built props | Outdoors, so banks read as ground more than inside; lowest priority. | Per site later: built walls and plazas instead of banks where a structure is meant. |

The two named by mondo that are also the worst (the Vatican, the Astral realm) go first, with the two specific asks
(the staircase hall, the spaceship).

---

## 4. The staircase to the Woods (DOOR HQ)

Today the `woods_stair` link lands on the east wall of THE STAIRWELL (floor 2, a 5 × 7 m concrete fire stair).

**Build:** a new HQ room, THE STAIRCASE TO THE WOODS, straight off THE MAIN HALL's ground ring (the free stretch at
255°, where Room 1984's door stood until 2026-09-13), so both exits the player starts with are one room from the hall
(the taxi is the lift down to the garage). The room is the reference's layout:

- 30 × 44 m, 18 m tall, round-cornered; checker floor in pale blue and white (`checkerboard_3` tinted), a gold ring
  inlaid round the middle of the floor, dark green panelled walls with lit windows high up.
- The door from the hall stands alone at the south end of the room (the reference's blue door).
- A blue runner from that door up the middle to the foot of THE STAIR: one straight flight 7 m wide rising 8.75 m (five
  battle levels) to a landing on the north wall; the door to the Woods on the landing, under a clock face.
- Six free-standing columns, three each side of the runner; lamps on stands along the ring.
- `woods_stair` moves: its DOOR HQ end is the landing door of the new room. THE STAIRWELL keeps its own doors (the flights,
  the platform draught). HQ_EXIT_RULES.open is unchanged (`garage_taxi`, `woods_stair`).
- ZONES_PLAN fork 9 (the woods stair's floor) is answered: the ground floor, off the main hall.

## 5. The Astral realm: the floating islands

**The route.** The Waiting Room's frame opens onto THE SEA (rebuilt): Island 1 (the landing, big, the frame back) →
a line of stepping stones → Island 2 (a room of interest, fights) → two routes to Island 3 (the library's frame): Route A
a chain of small stones at one height (running jumps), Route B a longer climb over rising stones (standing jumps up
≤ 1.2 m each); a side branch to Island 4 (the nightmare's closet) and a dead-end stone holding the tape.

**The jump rules** (from the walker's own numbers, §2): a gap is 1.2–3.0 m edge to edge; a rise between stones ≤ 1.1 m
(the apex is 1.46 m, the body needs a margin); a drop is anything. The stepping stones are 2.2–3.5 m across (a landing
target a player can hit without precision). Every island is `float: true` with a rock underside tapering 6–14 m down.

**The void.** `terrain.void: { y, glow }`: the field's ground outside the islands sits at `y` (−40 m); the renderer draws
no ground there; a walker whose feet go below `y + 6` fades out and back in on the last island it stood on (the last
grounded spot more than 1.5 m from an edge). The field's raster treats a void cell as a wall cell (no seat); population,
spawns and props never stand on it.

**The look.** The starfield sky (the astral shell already has it), a violet glow sheet far below, the islands' tops in
`purple_grass` / `crystal`, undersides in the cliff sheet as stepped rock, the dead-tree kinds and `crystal_cluster` as the
stalks (reused models, tinted dark), `thoughtform` / `floating_orb` props kept.

## 6. The spaceship: one staged zone

Z2's recipe: the airlock, the hold, the bridge and the deck become zone `derelict` in `HQ_WORLD.zones` and
`HQ_STAGE_RULES.zones`, frames solved door to door (each pair 0.2 m apart and facing, no overlaps, `hqWorldValidate`
clean). The deck is rebuilt as a LAYOUT (walls look, aluminium walls): corridors between compartments, so its doors meet
the other parts' doors on straight walls. The collar (`ship: true`) stays the one door off the ship.

## 7. The mazes

Every converted room follows `map_layout.JPG`: rooms 6–16 m across joined by 2.4–3.5 m hallways that turn at right angles,
at least one loop, dead-end side rooms (the loot, the tape), the room's doors in rooms far from each other (the sight
rule), and at least one room per level with 48 battle seats (EXPLORATION_BATTLES_PLAN §7). `look: 'walls'` for anything
built (sewers, catacombs, dungeons, bases, the ship), `look: 'rock'` with a tall bank for caves. Rooms are written as
`space` / `hall` rows in data.js so the editor can open and edit them (they are the same rows it draws).

## 8. Deliveries (each a merged PR + one zip of only the changed R2 files)

| # | What ships | R2 files |
|---|---|---|
| L1 | §4 the staircase hall; §3 #1 the Vatican rebuilt (library first) | data.js (+ three-renderer.js if a builder is needed) |
| L2 | §5 the Astral realm's islands, THE VOID, rock undersides; the astral library as a maze | data.js, three-renderer.js, map.js if the fall needs the fade |
| L3 | §6 the spaceship staged + its deck rebuilt | data.js |
| L4 | §7 the Sewers, the tunnels, the cells, the workings, Dead Man's Cave | data.js |
| L5 | §7 the Cavern, Camelot's dungeon, Hell's pit | data.js |
| L6 | §3 #7–#9, plus deleting the Backrooms and the Flat Lands | data.js, map.js, three-renderer.js, audio.js |

---

## 9. Log

- 2026-09-30: plan written, ranking in §3.
- 2026-09-30, L1 + L2 + L3 in one delivery (branch claude/area-level-design-3m97bp):
  - **The staircase (§4):** room `woodstair` off the main hall (central_egress door `woods`, deg 255); `woods_stair` now
    starts at its north wall at y 8.75. Built flights (`ramp` with `built: true`) step one tread per grid cell (data.js
    ramp height + three-renderer `_hqBuildBuiltStairs`), so the 0.62 climb solver never skips a riser.
  - **The Vatican (§3 #1):** the library is a flat wood floor with shelf ranges (11 thin cores, t 0.2, dressed with
    `library_shelf_full` both sides), a gallery on a plain bridge at 4 m reached by a built stair. The basilica is a flat
    nave with side galleries (plain bridges at 4.6 m on `greek_column` rows), built altar and side stairs, parapets as hung
    walls. The catacombs are a `plan` gen (`look: 'walls'`, bricks_3, `forceGrow: -0.3` so the forced band is the stair's
    own width): two flights down, a gallery, chapel, skull room, cistern, ossuary, tombs, loops and dead ends. The
    courtyard is a `plan` gen with `look: 'trees'` (pine hedges): terrace, fountain court, cloister loop, garden paths.
    The observatory's dais got crisp edges and built steps.
  - **The Astral sea (§5):** `terrain.void: { rock, glow, glowY, fall, lip }`. Deviation from §5: the void is not a far
    floor; it is every cell under `base + lip` (data.js `hqTerrainVoidAt`). The walker cannot step onto it (hqTerrainFeet
    returns null there), so nobody walks off an island; a jump that lands on no island falls, and under `fall` (−8) the
    walker fades back (`_hqVoidReturn`) to the last grounded spot. The field raster makes void cells `cloud_gap` (no seat).
    Islands are `float` plateaus with `_hqBuildIslandRock` stepped rock undersides; `_hqBuildVoidGlow` draws the glow.
    About 36 islands: the landing, the Pool of Ideas, Route A (level stones), Route B (rising stones to the High Thought),
    the far shore, the west chain to the closet island, dead ends for the tape and the fortune teller. Gaps 1.5–2.8 m,
    rises ≤ 0.8 m. The solver does not model jumps, so chk shows those doors unreached by design.
  - **The spaceship (§6):** zone `derelict` on its own ground `space` (hub the airlock): airlock, deck (y −3.2), hold,
    bridge, joined door to door; `derelict` added to HQ_STAGE_RULES.zones. Deviation: the deck stays the hull's open top
    (it is outside), but the rooms gen's 3 m banks are gone (flat plate, crisp 0.15 edges, the dorsal fin a wall in three
    pieces). The deck ⇄ hold cargo hatch was removed: it was a card between two rooms of the ship.
  - Arenas re-baked (`node bake-arenas.js`) for the basilica and the deck.
- 2026-09-30, L4 + L5 in one delivery (the mazes): every room below is now a `plan` gen (`space` / `hall` rows the editor
  can open), `forceGrow: -0.3` (-0.4 in the rock rooms) so a flight's forced band is the flight's own width.
  - **The Sewers** (walls, bricks): four rooms of interest (pump room, junction, cistern, outfall) and side rooms 1-5,
    3.4 m culverts at right angles, the 5 m main culvert with its channel; three loops, three dead ends. The inspection
    gallery and the pump gantry are built flights.
  - **The running tunnels** (walls, concrete): the loop line with square corners, the crossover down the middle, the
    depot on its own spur, the ghost station on the south leg, maintenance passages and side rooms 1-7 between the tracks.
  - **The holding cells**: six cells off the corridor (each one mouth), the guardroom, the tank, the property room, side
    rooms 1-3, a back passage; two loops.
  - **The old workings** (rock): pump chamber, flood, chimney chamber, three dead-end side chambers, 3 m drifts, one loop.
  - **Dead Man's Cave**: the box grew from 35 × 10.5 to 42 × 28; the channel runs straight through three chambers, side
    chambers 1-3, the culvert pipe south; one loop.
  - **Camelot's dungeon** (walls, brick): stair foot, workshop, cistern, well alcove, a cell passage with three cells,
    the ossuary (dead end), the gaoler's room with its ledge; two loops.
  - **The Cavern's gallery** (rock): the way in, the hall, the north chamber, the river chamber, the grotto, with the
    terrace / west shelf / high tier / spur / hot shelf kept; the rope bridge is `over: true` (the walker passes under it);
    the mouth door moved to z 16.5 so it clears the river.
  - **Hell's pit** (rock): the rim, the switchback cut down the west wall, the bowl, the lava river in its channel, the
    colossus chamber, the warm ledge and its causeway, the gallery ledge and its alcove; the east crawl loops to the channel.
  - The small cavern rooms (vent, blast, adit, mouth, oubliette) stay single chambers.
  - Tool used: a script moves every floor prop / person / spawn left inside rock to the nearest open cell.
- 2026-09-30, L6 in one delivery (branch claude/level-design-l6-1pwam9):
  - **The Backrooms and the Flat Lands DELETED** (mondo: "I do not want the backrooms or the flatlands in the game … H-Wing is
    the backrooms"): the two battle maps and their Δ boards, their EW_MAP_META rows, the site rooms (THE LEVELS, THE PLAIN),
    their links (cern_backrooms, flatlands_backrooms), map slots, dossiers, room numbers, tapes, the arena pick, the far-roster
    builders (three-renderer.js), the training / challenge pools (map.js, data.js), the server's queue rows, the music tag;
    BAY 6 · QUARANTINED (it held only those two) with its sector, door and notice; H-Wing's EXIT door. The shadow entity's
    home is H-Wing, the scarecrow's Skinwalker Ranch. The Backrooms look is `HQ_ROOM_LOOKS.faded` (the thirteenth floor wears it).
  - **H-Wing is the backrooms:** the west leg, the crossbar, the east leg, the typing pool, the break room and the office
    (six box rooms behind cards) are ONE layout room, `hwing_floor` (72 × 60, 3 m ceiling, yellow `wallpaper` walls, damp
    carpet, the faded look): the H as the spine (two legs, the crossbar, a north corridor joining the legs), THE HUM ROOM and
    THE POOL ROOMS (waded) between the legs, THE TYPING POOL, THE BREAK ROOM and the open office south of the crossbar, six
    identical offices off the legs with narrow passages behind the walls; the corridor that repeats is a door off the north
    corridor; the room at the end's cell door kept. Zone `hwing` (HQ_WORLD.zones, HQ_STAGE_RULES.zones): lobby ⇄ floor ⇄ HOME
    door joins, no card inside the wing.
  - **§3 #7:** the D.U.M.B. (motor pool, sub-level 7 on map_layout_3's hub + spokes + vent, dream lab, clone vats, bunker),
    Area 51 (Hangar 18 with a perimeter corridor, the white rooms on the ward-room idea), CERN (the ring as an octagon of hall
    rows, the detector hall, the control room), the Lodge's halls: every one a `plan` gen (walls look) instead of the BSP.
  - **§3 #8:** the Flying Dutchman's main deck: no generator (the derelict deck's recipe), a flat hull, crisp tiers, built
    flights, the two hatches, a 1.5 m rail round the hull.
  - **§3 #9:** Agartha, the temple city, Antarctica's station, the North Pole village, Olympus's summit (walls look: courts,
    streets and plazas between built walls, terraces as crisp plateaus with built stairs), the haunted grounds (pine hedges, the
    crypt built), Giza and Babel (walls look: walled courts, a town), Stonehenge and Göbekli (a hand-drawn rock bound; the henge
    bank the one earthwork, Göbekli's enclosures ring walls, the barrows crisp with stairs).
  - Every room checked: every door lands and is reached, no traps, no cold space, a 48-seat room in each. Arenas re-baked.
