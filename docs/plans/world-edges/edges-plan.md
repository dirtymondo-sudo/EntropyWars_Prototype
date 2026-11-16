# THE WORLD'S EDGES — what stands past each zone's line, and what should (2026-11-16)

mondo 11-16: "fix and improve all of the big weenies on the edges of the map, and make the edges/boundaries of the map
more natural. for example in desert, its surrounded by mountains but that's not what's actually next to it on the map,
so it doesn't make any sense. and ... at the end of the beach/shore, at the north, where it meets the hills, there are
hard right angles and straight lines ... that would be a good spot to turn into a cove".

The map every row below is checked against: `docs/plans/world-zones/world_layout.png` (layout 3, his OK 11-15) and
`world_state_map.png` (the zones at their built size). Every open zone was photographed from the air, four ways, in the
real game (`playtest_city.js`): the sheets are in this folder.

## 1. Built in the first PR

| What | Before | Now |
|---|---|---|
| **The Desert's four sides** (`bake-desert.js`) | a snow range with pines 14 m past the west and south lines | north: open sand (Disaster City is that way). West: dry scrub, the map's "scrub (edge)". South: flat sand, red rock tables far off. East: the bay behind Western Town, then Leylines' sand level with Giza. The room's saguaros run on past every line. `desert_before_after.jpg` |
| **The Cove** (`districts/N.js` + `B.js beach()`) | the Shore's sand ended on the city's old north line: a square corner in the sea, a 3.6 m drop along the line, a straight cliff | a round bay, a crescent of sand under the cliff, a rock headland that hooks round it, sea stacks off its point. `cove_before_after.jpg` |
| **No ruler lines on any land past an edge** (three-renderer.js, every zone) | where two kinds of land met (sand / sea south of the city, range / sea north of it) the line was dead straight; the corner between two sides was a straight diagonal | those lines wander. The mountains' foot steps in and out (it was one wall, 14 m off, the whole way) |
| **The tan slabs** where a range falls into the sea | the banned `cliff.png` sheet | the rock sheet |

New tools for every zone (three-renderer.js `_hqEdgeLandFn`, notes: areas-complexes.md "THE EDGES THAT FIT THE MAP"):
kinds `scrub` and `mesa`; `beyond: { kind, d, len }` (a second kind further out: sand then sea, hills then a range);
`plants` (a dry side grows the room's own plants); `bare` (no pines on a mountain's foot).

## 2. The audit: every zone, every side

"Wall" = the rock face that rises 30 m within 14 m of the line. Pictures: `audit_*.jpg`.

| Zone | Side | The map says | The game shows | Fits? | Proposed |
|---|---|---|---|---|---|
| Disaster City | N | the Hollywood Hills, the range behind | the Hills (real ground), a low dry ridge behind | yes | nothing |
| | W | The Woods; the Vatican at the north end | a forest hillside; past the trees (60 m) the hill is bare bright green | half | darker ground under the far forest, or trees further out |
| | S | The Desert | flat sand; the shore now wanders | yes | nothing |
| | E | the ocean, The Beach | the sea | yes | nothing |
| The Desert | all | see section 1 | | yes (new) | north: Disaster City's skyline on the horizon? (question 1) |
| The Beach | W | Bayside | a drawn sea wall + Bayside's front | yes | nothing |
| | N E S | the ocean | open sea | yes | nothing |
| The Mountains | N | "the north face (edge)" | the wall, grey bands, snow spikes | half | hills first, the range further back (`beyond`), so it is not a wall on the line |
| | W | the North Pole (snow) | the same grey wall | no | snow slopes |
| | E | the dry Hollywood range | the same grey wall with snow | no | dry rock, lower, no snow |
| | S | The Woods, Camelot, the Vatican | forest, then a bare green hill with furrows | half | as the city's west |
| The North Pole | E | The Mountains | a dark bare rock wall all round, 30 m from the village | half | snow-covered slopes, further back |
| | S | "the woods between Camelot and the range" | the same wall | no | snowy pines on a low rise |
| | N W | the north face | the same wall | half | snow slopes |
| The Woods | all | N the Mountains (Mount Shasta), W Camelot, E the city, S The Estate | NO land past the line: the last trees, then sky. Floating black door frames and a slab in the sky | no | forest all round, the range beyond it on the north |
| Camelot Kingdom | all | N the range + the North Pole, E The Woods, W + S deep forest | NO land past the line. One sky landmark (the castle in the sky) | no | forest all round, the range beyond on the north |
| The Estate | all | N The Woods, E the city / the Desert, S scrub, W deep forest | NO land past the line: a ring of pines, then sky | no | forest north and west, scrub south |
| The Sewers | | underground | closed room | | nothing |

## 3. Not built: waits for mondo

1. **The Desert's north.** The map puts Disaster City there. Today it is open sand to the horizon. A far skyline of the
   city (hazed, 300 m off, with the Hills behind it) would be the true landmark; he threw out "fake buildings as
   barriers" on 11-13, so this one is his call.
2. **The floating things in the sky** over the city, the Woods and Camelot (black door frames, a slab, a log, a glow):
   the old far roster (`sky.scenery: 'city'` / `'dark'`). Keep, or take out of the zones?
3. **The six rows of section 2 marked "no" / "half".** Each is a few numbers in that zone's bake tool now that the
   kinds exist. The Woods, Camelot and the Estate get land past their line for the first time (they have none). Those
   zones' rows on the board are held or wait for his look, so nothing was changed there.
4. **The Shore's main waterline** (the 170 m south of the cove) is still one straight line. Tide pools, the lifeguard
   hut and people stand right on it, so bending it moves the Shore district's own content (its row waits for his look).
5. **The Hills' cliff north of the headland** is still one straight wall (seen only from the Coast Overlook).
6. **A dark slab in the bay**, south-east of Industrial's dock (about x 300..335, z 255..320, in the strip south of the
   city's old south line): a flat dark grey rectangle on the water, seen from the air and from the dock. It was there
   before this work. Not looked into yet (the strip is the city tool's `room.north` south strip).
