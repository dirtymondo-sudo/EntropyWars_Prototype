# One World: the test slice, built and walked (17 Nov 2026)

BUILD_PLAN phase 2. mondo: "this decides whether the size and spacing stay". This is the report every phase 3 and 4 thread reads first.
How it was built: `docs/notes/areas-complexes.md` "ONE WORLD, THE TEST SLICE". Pictures: `proof/slice_*.jpg`.

## AFTER THE FIXES (17 Nov, later the same day): read this first

mondo read the report below: "keep the size, and do your fixes FIRST, before any zone thread starts". All seven are in. Everything under
"What stands" and after is the slice AS FIRST BUILT (six rooms); this section is how it stands now. How each was built:
`docs/notes/areas-complexes.md` "THE FIXES AFTER MONDO READ THE REPORT". Pictures: `proof/fix1_*.jpg` to `proof/fix7_*.jpg`.

**The rooms now: four.**

| Room | What | Box | Plots |
|---|---|---|---|
| `site_prebuilt_fairy_forest_ow_clearing` | The Clearing + Dead Man's Cave: the Stair to the Storm Drain in one walk | 12 x 5 | 18 |
| `site_prebuilt_skinwalker_ow_corn` | The Corn Fields, County Lane down the middle | 2 x 6 | 12 |
| `site_prebuilt_skinwalker_ow_lake` | County Lane + the footpath L8 + the Lake | 5 x 8 | 25 |
| (not moved) `site_prebuilt_fairy_forest_plots`, `site_prebuilt_skinwalker_estate` | the Redwood Trail + the Ritual Ground; the Haunted House + the Ranch | 6 x 3 each | 18 each |

**The walk now. The Stair to the Lake: 2 loading cards (was 3; by the footpath it was 4).**

| Walk | Metres | Walking | Running | Loading cards |
|---|---|---|---|---|
| The Stair to the Lake by County Lane | 672 | 4:40 | 2:26 | 2 (the corn, the lane's room) |
| The Stair to the Lake by the corn's tracks and the footpath L8 | 678 | 4:43 | 2:27 | 2 |
| The Stair to the Storm Drain | 395 | 2:45 | 1:26 | 0 (was 1) |
| The Culvert to the Storm Drain, along the north bank | 297 | 2:04 | 1:05 | 0 |
| The Culvert down the bed to the sewer mouth | 247 | 1:43 | 0:54 | 0 |
| The Culvert to the Tunnel Way, along the south rim | 286 | 1:59 | 1:02 | 0 |
| The lane's room, the corn's end to the Lake's south shore | 337 | 2:20 | 1:13 | 0 (was 2) |

By room: the Clearing's room, Stair to Fence Line 193 m; the corn, gate to the lane's south end 257 m by the lane, 275 m by the tracks to
L8's gap; the lane's room to the Lake's north shore 222 m by the lane, 210 m by the footpath. The lengths are counted over the open squares
and stop at any step in the ground over a metre, so the bed's walls count.

**What each fix changed** (the numbers are the points of "What felt wrong" below):

1. **Join more** (point 1). The room-splitting rule is rewritten: things that touch stand in one room until a number stops them (two zones
   never join; a 12 x 12 box; 30 plots; 12 plots in one straight open row; 2,500 calls and 12 M triangles at the heaviest view; 1.4 GB).
   Measured: the Clearing's room 1,932 calls / 10.4 M triangles looking down its twelve plots, 1,210 MB, 54 s to load in the probe; the
   lane's room 671 / 2.7 M, 1,006 to 1,290 MB, 55 s. The Woods' south room is full by the triangle number: the Redwood Trail does not join it.
2. **Open-ground seams** (point 7). A seam in open country has no arch and no dark hole: the ground runs on and you walk off the edge
   (`way: 'open'`). Three of the slice's seams: the corn's south end and back, the Lake's south shore. Arches stay on the forest walls (the
   Fence Line's gate, L8's gap in the corn, every Woods trail). All walked in the probe.
3. **A place on every route plot** (point 8). The route kit lays one small place beside the path on every plot (`ow-places.js`; every name
   is an idea of mine, plain, with no role in the game: rename or drop any in that one table). County Lane's sixteen plots: the fire watch
   sign, the bench, the boundary stone, the lone scarecrow, the rest, the bee yard, the scarecrow row, the camp, the hay stack, the carved
   pole, the old jetty and the stranded boat on the salt flat; L8's four: the wayside cross, a scarecrow, the plough, the marker stones.
   The corn's three lane fields: a hay stack, a bee yard, a rest.
4. **L8** (point 2): BOTH. It is in the lane's room, so the two ways are seen, and it leaves the corn by its own gap in the south field,
   21 m east of the lane's end.
5. **County Lane through the corn** (points 3 and 4). Nothing stands within 7 m of the lane's middle line: the field shed, the silo yard,
   the crashed car, the bench, trees, fences and lamps were moved by hand, each on its own plot; the five dead-end tracks are closed (their
   pieces moved, the bare track back to corn). Nothing deleted: the census lists only corn-row models on the closed tracks (real corn now).
6. **Dead Man's Cave** (points 5 and 6). A creek bed you follow: out of the dry pipe, east beside the trail, down a ramp on the Dry Creek's
   lower plot, 1.75 m deep between rock walls through the Hollow and the Gully with a dirt rim each side, down again to the 3.5 m ravine and
   the sewer mouth. Walked in the probe from the ramp's top into the Sewers. The cabin stands on the Gully's north bank, off the line. Found
   on the way: the ravine's ramp had done nothing since the move (the bed ended at a 3.5 m drop you could not climb back up); it is a real
   ramp now. The Rocks' gate leads to a ledge of bare rock behind the crag where somebody has been sleeping (THE BACK OF THE ROCKS: my idea,
   plain, no role); the gate itself had been cut off by forest and is reached again.
7. **The two gates** (point 10) stand on one line, world x -13.5.

**Not done, still true:** point 9 (seen from above the forest is hollow; not seen on foot). A fight on the lane itself or in the sunk bed
has not been tried. The in-game map pictures of the three rooms are remade.

## What stands

| Room | What | World plots | Plots |
|---|---|---|---|
| `site_prebuilt_fairy_forest_ow_clearing` | The Clearing, a cross: the Stair north, the Fence Line south | -17..-13 x 0..4 | 9 |
| `site_prebuilt_fairy_forest_ow_creek` | Dead Man's Cave, the dry creek west to east to the Storm Drain | -12..-6 x 0..2 | 9 |
| `site_prebuilt_skinwalker_ow_corn` | The Corn Fields, two columns of six, County Lane down the middle | -14..-13 x 5..10 | 9 + 3 of R7 |
| `site_ow_r7_3_14` | County Lane (R7), the road from the corn to the Lake | -14..-11 x 10..14 | 12 |
| `site_ow_l8` | The wild link L8, a footpath beside the lane | -13 x 12..15 | 4 |
| `site_prebuilt_skinwalker_ow_lake` | The Lake, its nine plots as they stood | -12..-10 x 15..17 | 9 |

Nothing was lost: every prop (2,877), every native (37) and every line of talk of the two old rooms is in a room today (`ow-census.js`,
before and after; what the diff lists is the tools' own re-laid pieces, each answered in the notes). The Redwood Trail, the Ritual Ground,
the Haunted House and the Ranch did not move: they stand in the old room ids, 6 x 3 plots each, joined to the slice by interim doors.

On "the wild link from the Fence Line": on v13 the Fence Line and the Woods Gate touch, so that join is door to door (no plots). The wild
link the slice built is L8, the footpath from the corn to the Lake.

## The numbers

Walk speed in the game: 2.4 m/s walking, 4.6 m/s running (shift). One plot = 42 m = 17.5 s walking, 9 s running.
Lengths are the shortest line a walker can take over the open squares, door to door.

| Walk | Metres | Walking | Running | Loading cards on the way |
|---|---|---|---|---|
| The Stair to the Lake by County Lane | 665 | 4:37 | 2:25 | 3 (the corn, the lane, the Lake) |
| The Stair to the Lake by the corn's tracks and the footpath L8 | 675 | 4:41 | 2:27 | 4 (the corn, the lane, L8, the Lake) |
| The Stair to the Storm Drain by the creek | 404 | 2:48 | 1:28 | 1 (the creek) |
| The creek alone, the Culvert to the Storm Drain | 308 | 2:08 | 1:07 | 0 |
| The Clearing end to end, the Camelot trail to the creek | 219 | 1:31 | 0:48 | 0 |

By room: the Clearing, Stair to Fence Line 193 m (1:20); the corn, gate to the lane's south end 259 m by the lane, 279 m by the tracks
(1:48 / 1:56); County Lane 213 m (1:29); L8 154 m (1:04).

The creek ends at the Storm Drain, 6 plots (252 m) short of Disaster City's west line. From there the way into the city today is the
drain's own link (up to the street) or the sewers; on foot above ground it is the Valley Road (R6), which is thread 4.2's.

Measured in the probe (Mesa llvmpipe software drawing, 1280 x 800, post off). Draw calls, triangles and memory do not depend on the
machine. FRAME RATE DOES: the probe read 2 to 18 frames a second in every room, old or new, so it says nothing about mondo's machine and
is left out of the table. Load time is the probe's too (files already on disk); read it as one room against another.

| Room | Files | Load in the probe | Heaviest view: calls / triangles | A quiet view | Memory read (models + rigs) |
|---|---|---|---|---|---|
| The Clearing | 239 | 44 s | 1,512 / 7.8 M (the Crossroads, looking east) | 91 / 0.29 M | 1,083 MB after standing 2.5 minutes |
| Dead Man's Cave | 166 | 52 s | 586 / 2.1 M (the bed, looking east) | 321 / 0.89 M | 1,245 MB |
| The Corn Fields | 153 | 57 s | 1,562 / 6.2 M (the lane's north end, looking down it) | 183 / 0.72 M | 1,369 MB at load, 1,090 after |
| County Lane | 63 | 40 s | 405 / 2.2 M | 404 / 2.1 M | 1,026 MB |
| L8 | 55 | 37 s | 239 / 1.0 M | | 687 MB |
| The Lake | 155 | 42 s | 413 / 0.79 M | 408 / 0.57 M | 999 to 1,226 MB |
| the old Woods room now (T + G, 18 plots) | 262 | 61 s | 2,586 / 23.5 M | 316 / 5.7 M | 1,301 to 1,685 MB |
| the old Estate room now (H + R, 18 plots) | 264 | 73 s | 1,082 / 2.9 M | 699 / 2.2 M | 1,348 to 1,638 MB |

The rule of phase 1 (data.js `HQ_ENGINE_RULES`): 2,500 calls, 1.5 M triangles, 700 MB.
- **Every slice room is lighter than the room it came out of.** Loads are a third shorter.
- **No district room meets the rule, and neither do the old ones.** Only the 4-plot trail reads under 700 MB. The 700 MB line cannot be
  the test for a zone thread as it is written; "not heavier than the room it came from" is the test the slice passes.
- **What costs is a long straight view, not the plot count.** The corn's lane shows both columns of corn at once (6.2 M triangles); the
  Clearing's west to east row does the same with trees (7.8 M). The land past the room's line is about a fifth of the Clearing's view
  (2.9 M without it, 3.7 M with it, looking west).
- The edge land and the far sights load nothing extra worth naming (the lane's room: 63 files).

## The fight on a trail plot

One fight, on L8's second plot (world plot -13,13), 6 m off the footpath, against a Mothman (the trail's own locals are Mothmen).
Strike to the board: 12 s in the probe. The board is cut from the plot's grass where you stand ("TRAIL · THE LONG GRASS · THE FIELD"),
round 1 opened, the turn came to the player. Won from the probe; back on the trail 6.4 s after pressing BACK TO THE ROOM, standing
where the fight was, the room's five locals still there. No errors. A route plot is a fight board as it is: nothing had to be added.
Pictures: `proof/slice_fight_1_before.jpg` … `slice_fight_4_back.jpg`. Not tried: a fight ON the path, on the lane's road, or beside a fence.

## What the horizon shows

- **The Clearing**: forest on every side past its line (the map: forest). South past the Fence Line's gate the trees thin to open
  woodland, as the map says. Disaster City's towers are a thin dark stroke over the trees to the east.
- **The creek**: forest both sides; from the bed, looking east, the city's towers over the trees. That reads right: the creek ends "by the city".
- **The Corn Fields**: over the corn, flat green country and a few trees (the map: open woodland); from the lane's south end the land opens.
- **County Lane**: wooded on its north half (the map: open woodland and forest), then two plots of bare salt flat down to the Lake.
- **The Lake**: salt flats and low pale hills south and west (the map calls it the Salt Lake), trees north.
- Two things were wrong and are fixed in this PR: every far sight stood 74 m from a room's middle, so in these wider rooms Disaster
  City's towers stood IN the creek's ravine and the Vatican's dome on the corn's north field; and a place 20 plots away was drawn at half
  its full size. A far sight now stands past the room and shrinks with the distance.

## What felt wrong (plainly)

1. **Too many loading cards for the distance.** The Stair to the Lake is four and a half minutes of walking and three cards, one about
   every 90 seconds. Each room is fine by itself; the walk is chopped. The rooms could be fewer: the Clearing and the creek as one room
   (12 x 5, 18 plots), and County Lane + L8 + the Lake as one (5 x 8, 25 plots) both sit inside the room-splitting rule and would be
   lighter than either old room. That would make it one card to the Lake's room instead of three.
2. **L8 is not a second way.** It runs 42 m beside County Lane for three plots, hidden from it only because they are two rooms. The two
   walks to the Lake differ by 10 m and 4 seconds. Either it joins the lane's room (then you see both), or it should leave the corn
   somewhere the lane does not go.
3. **County Lane inside the corn is not a clean road.** It runs down the edges of the corn's plots, and a few of the district's own
   pieces stand in its band: the field shed and two silos (The Rows, east), a crashed car, a bench, two trees, some fence. There are
   always two squares free, so you weave. A clean lane means moving those few pieces by hand in the district's file.
4. **Five dressed tracks in the corn end at the bank** where the next plot used to be (The Woods Gate west, The Scarecrow east, The Farm
   Track west, The Rows, east east, The Hub west and south). The tool only closes a bare track; these carry lamps and fences, so they stayed.
5. **The dry creek is not one bed any more.** The district was built as a bed that turns south then east through four plots; v13 lines
   seven plots up west to east. The deep cut is whole and on one plot now, but through the Hollow and the Gully the "bed" is the trail at
   grade, and the cabin stands on the bed's line so the walk passes north of it. It reads as a trail that reaches a ravine, not as a creek
   you follow. It needs a designed pass on the district (a sunk bed through the Hollow and the Gully, the cabin moved off the line).
6. **The Rocks' gate leads nowhere.** The crag was a rock gate over the trail north; nothing stands north of it on v13.
7. **A seam in open ground shows.** A trail door is a dark hole in a clump of trees. On a forest wall that is fine. On the salt flat at
   the Lake's end of County Lane it is a lone grove with a black arch in it, and the footpath's door off the lane is a dark pillar on the
   verge. Open country needs a seam with no portal: you walk off the edge.
8. **The last two plots of County Lane are empty.** Salt flat, a road the same colour as the ground, nothing on it. The kit dresses a
   salt flat with four stones and a skull. A minute and a half of road wants one thing to walk towards.
9. **Seen from above, the forest is hollow.** Trees stand only in a band along the paths; the box's other cells are bare ground. You
   cannot see it on foot. It will show on any view from height.
10. **The gates at the Fence Line and the Woods Gate stand 3.5 m apart** along the seam (each kept its own place). Nobody will notice
    through a card; they would in one room.

## What it settles

- **Size and spacing.** Nothing in the numbers says the plot (42 m) or the map's distances are wrong. Two and a half minutes running
  from the Woods' hub to the Estate's lake, a minute to cross the creek, is a walk with room for things on the way. What is wrong is how
  often it is cut by a card and how little stands on the route plots. My recommendation: keep the size, change the room-splitting rule
  to join more (point 1), and give every route plot one place of its own.
- **Residents on a route.** They come by themselves: the spawn system put three Mothmen on L8 and locals on the lane. No hand-placed
  residents are needed for a route to feel lived in.
- **The kit.** A road that passes through a district is the district tool's job there (the corn's lane), not the kit's; the kit needed a
  hand-drawn line for the bend and a hook for a side path, and has both now.
- **The move itself.** A straight move (the Lake) is free. A district whose plots change neighbours (the Clearing, the corn) moves by
  tool with a short list of strays. A district built round one long piece (the creek) moves, but needs a design pass after.
