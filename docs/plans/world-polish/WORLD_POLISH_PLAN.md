# THE WORLD POLISH PLAN: the audit, the verticality pass, and who does what next

mondo's ask (2026-11-19): "an audit of the world, zone by zone and district by district, to determine which ones are too small or cramped
and can be made bigger, or which ones need more work visually ... a verticality pass, where we add hills and ridges and waterfalls and ledges
and valleys and walls and stairs and ramps and walkways ... which zones and districts + plots need the most love", designed for "third person
exploration, the square battle grid, skateboarding, and aesthetics".

## START HERE (a new thread picks the plan up from this section)

**Where it stands (last updated 2026-11-20):** the audit is done (sections 0 to 3). The Desert is done (thread 1). The SCREENSHOT AUDIT is part done
(`SCREENSHOT_AUDIT.md`: 323 of 406 pictures taken, about 200 looked at; Disaster City, the Sewers and the Moon NOT photographed; section 5b says what it changed). **Thread 3: The Snowy Pines and The Forest are DONE and merged 11-20 (each three plots wide; `pictures/camelot_ow_pines/` and `camelot_ow_forest/proof_three_plots_wide.jpg`). Next: thread 2 (Disaster City, the cramped
city) and the rest of thread 3 (The Fairy Forest); they are different zones and can run side by side.** The table in section 5 is the list of threads, in order, with what is done.

**To start a thread, say:** "Do thread N of docs/plans/world-polish/WORLD_POLISH_PLAN.md." The thread then:
1. `git fetch origin main && git merge origin/main` (CLAUDE.md RULE #1d), then reads this section, its row in section 5, section 4 for its zone,
   and mondo's rulings below. Then `docs/notes/owner-rules.md` and the board (`docs/notes/claims.md`): it takes its zone's rows there in its first PR.
2. LOOKS AT ITS ZONE FIRST: reads its rows in `SCREENSHOT_AUDIT.md` and opens its pictures in `pictures/<place>/`; if the zone was not
   photographed or not looked at (the list is at the top of that file), it runs `node docs/plans/world-polish/shoot.js <its rooms>` (one zone, a few
   minutes; never the whole world) and adds its rows to that file in its first PR.
2b. Reads the worked example before building: `docs/notes/areas-complexes.md` "THE DESERT, GIZA", THE VERTICALITY PASS (what rides the ground, how
   steep, the traps), and its own zone's notes there.
3. Does ONE district first as the pilot, looks at it in the browser, shows mondo the pictures, and waits for his word before the zone's other districts.
4. Per district: edit the zone's district file (or its layout / tool when the ground itself has to change), rerun the zone's bake, print the heights
   offline, browser look + proof pictures (RULE #1c), `node bake-map.js <room>`, bump the token, PR, merge, upload (RULE #1).
5. Before its last PR: `node docs/plans/world-polish/audit.js` (5 minutes; commit the three tables), set its row in section 5 to DONE with one line
   on what was built and what was left on purpose, and free its rows on the board.

**HOW THE WORLD IS BUILT (the rules a thread must know BEFORE it designs; this plan left them out until 11-20 and its first pilot failed for it):**
- **A ZONE is made of DISTRICTS; a district is made of PLOTS** (one plot = 12 x 12 squares = 42 m). A plot has a NAME, which never changes, and
  an id `Pcc-rr`, which is only its column and row in the room it stands in today.
- **A ROOM is not a zone.** One World (mondo's map v13) stood every plot at a world place and cut the zones into rooms by THE ROOM-SPLITTING RULE:
  a district is never cut; what touches on the map shares a room (join first); two zones never share one; a room is at most 12 x 12 plots,
  30 plots, 12 plots in one straight open row, 2,500 draw calls / 12 M triangles, 1.4 GB. `ROOM_LAYOUTS.md` here = every room as it stands.
- **THE HOME FRAME.** A district file still writes in its zone's OLD plan squares. The zone's tool then moves the result PLOT BY PLOT to the
  room: each piece goes with the plot its middle stands on, nothing is turned. A piece that lies across two plots that no longer stand
  together is a STRAY and gets cut. So: design inside one plot, or check in `ROOM_LAYOUTS.md` that the plots still touch the same way.
- **PLOT SIDES.** Two plots that touch get a walk opening (a seam: walk / road / close); a side with no plot and no door past it CLOSES, and
  the tool fills a lane that ran to it back in (trees, hedge). A new way that crosses a plot side needs that side to be open in the tool.
- **THE LAND PAST A ROOM'S LINE** (`terrain.edges: { world: true }`) is drawn from the ground kind of the world plots beside it
  (`docs/plans/one-world/plots.json`, written by `gen.js --plots`, never by hand; since 11-20 `gen.js --plots` stops on the moved zones, so a change
  after v13 is a row in `docs/plans/one-world/after-v13.js`, which writes the sheet; then `node bake-map.js <room>`). A snow room beside grass plots lies in green lawn.
  A cell of a room's BOX that is no plot wears the room's default floor and trees (the kingdom's lawn and summer trees, in a snow room): thread 3 fixed both for the Pines.
- **GROWING A ROOM** = more plots (worked example: the Snowy Pines, 8 -> 22, thread 3): new rows in plots.json (`after-v13.js`), the zone's layout and tool, the room's `world` place, no clash with a
  neighbour (`node bake-map.js --table` refuses a clash), seam doors and routes that end on it re-pointed, the map picture redone.
- THE RULES IN FULL (read the ones your change touches): `docs/notes/areas-complexes.md` "ONE WORLD, THE ZONE MOVES" (THE PLOT LIST, WHERE A
  ROOM STANDS, THE ROOM-SPLITTING RULE, THE HORIZON READS THE MAP, HOW A ZONE MOVES) and your zone's "… THE DISTRICT FILES" section;
  `docs/plans/one-world/README.md` + `BUILD_PLAN.md` ("Rules every thread follows").

**mondo's rulings so far (they bind every thread of this plan):**
- **Height has to give you something to do** (11-20: "This pass is not meant to just raise things for the sake of raising them. A pyramid is
  already raised anyway, it's literally a tall monument. why do you want to make it taller?"). Build a climb, a view, a drop, a second way, a
  place that is hard to reach. Never lift a monument, a building or a whole district onto a step. Ask "is it like that in the real place?".
- **Never say a thing cannot be raised** (11-20: "You are the one that drew them ... It's one z value"). A drawn piece (`arch` row) has one `y`,
  and doors and props already follow the ground. Whether to raise it is a design call, to be argued as one.
- **FREE TO MOVE, CHANGE AND GROW** (11-20: "you have freedom to move and change and make bigger whatever you need to, that is the whole point of this pass"). Do not stop to ask before growing a room, moving plots or changing a layout or a shared tool: note it on the board and do it.
- **Level on purpose:** streets you fight and skate on (Main Street), an airfield and its lake bed, a fairground (the Circus), fields, plazas.
- **THE HIGHWAYS AND ROUTES ARE NOT IN THIS PLAN** (11-20: "I want to make the highway system much better and more accurate, so that would
  require its own thread"). No thread of this plan edits `bake-route.js`, a `site_ow_*` room or the Desert Highway. The audit's numbers for
  them (section 2, tier 2) are there for that thread to use.
- **No long straight boring ways** (11-20: "Im trying to avoid just long straight boring pathways. There should always be branches and different
  routes you can take that lead to different zones or districts"). Every walk, trail and tunnel gets side branches and a second way round; a
  branch should lead somewhere (another district, another zone, a secret), never to a dead wall.
- **Flat is fine where it is meant** (11-20: "Yes its okay if some areas are still flat").
- **Growing is approved** (11-20: "Yes that is all good"): the Catacombs to 12 plots, Pirates' Cove to 9, the Snowy Pines 3 plots wide, the Sewers'
  2-plot districts to 4 to 6, the Frozen Sea grown (taken as "grow it": he was asked grow or fold and said all good; ask again before folding).
- **DISASTER CITY FEELS CRAMPED** (11-20: "The city is where I feel cramped, like there are too many buildings and it might help if some districts
  are made bigger ... There are stairs that lead straight into a wall or collide with a building ... if the city needs to be made bigger that is
  fine"). The audit scored the city roomiest of all: it measures walkable ground, not how close the buildings stand or what a stair runs into.
  So the city gets its own look first (thread 2: section 5).
- Giza's pilot: "okay looks decent, continue" (11-19).

Files here:
- `audit.js` the tool that measured the world (`node docs/plans/world-polish/audit.js`, about 5 minutes). Its header explains every number.
- `AUDIT_DATA.md` its tables: every place, every district, the worst plots of each place.
- `plots.csv` all 1,514 plots, one row each.
- `need-map.svg` the world drawn plot by plot, green (fine) to red (needs the most).
- **`ROOM_LAYOUTS.md` HOW EVERY ROOM REALLY STANDS** (its size, its grid of plots, which plot is where, its place in the world; `node docs/plans/world-polish/layouts.js` rewrites it). READ YOUR ROOMS' ENTRIES BEFORE DESIGNING ANYTHING: One World moved many plots, a district file's home squares and a zone's plan sheet are NOT the room (thread 3's first pilot was drawn from the plan sheet and failed for it).
- `SCREENSHOT_AUDIT.md` what the world LOOKS like, place by place (11-20, part done) + `pictures/` (three a district) + `shoot.js` the tool that takes them.

## 0. How it was measured, and what it cannot tell

Every plot-built room that is not retired (62 rooms) was sampled one point a 3.5 m square, from the real game data, with the same
ground reads the map uses. For each plot the tool knows: how much of it you can walk, how wide the walkable ways are, whether an
8 x 8 board fits, how much height there is and of what kind (slopes you walk, ledges you drop off), which terrain rows stand on it
(ramps, stairs, bridges, falls, water, mounds, rails) and how many pieces dress it.

Three scores a plot, 0 good to 3 bad: **SPACE** (does a board fit), **HEIGHT** (is there any), **DRESSING** (does anything stand
there). NEED = their sum.

**What it cannot tell:**
- **It did not look at anything.** No browser run was made. "Needs work visually" below means bare, flat, monotone or marked
  "first build only" on the board; it does not mean ugly. Whether a dressed plot looks good needs eyes: step 1 of every zone's pass is a look.
- **Low scores that are meant.** A salt flat is flat, a plaza is flat, a tunnel is narrow. Section 3 says which are meant.
- **DOOR HQ and the insides** (Hangar 18, the Pyramid, the castle, the ant nest, the Dutchman, plot dungeons) are not plot-built and were not measured.
- **Outer Space** is one room you fly through. 505 of its 600 plots are the empty gaps between worlds and were left out; the other 95 are counted.
- The Vatican reads 8.8 m of relief on most plots. That number was not checked against the room and is not used below.

## 1. The yardsticks (what "good" means for the four things you named)

| For | The numbers the game already uses | So a plot should have |
|---|---|---|
| Third-person exploration | camera behind the body; a square is 3.5 m | main ways 5+ squares wide (17 m), side trails 3; something to see over or climb to every 2 or 3 plots |
| The battle grid | the PvP board is 8 x 8; a field fight takes 12 x 12 (6 x 6 at least) and reads up to 3 tiers of 1.75 m (`HQ_FIELD_RULES`) | one 8 x 8 window with 52+ walkable squares on the plot or its neighbour; height built in 1.75 m steps on terraces 6+ squares wide, never as noise |
| Skateboarding | a ramp needs 10 m clear before it and 6 m after (`HQ_TERRAIN_RULES.rampRunUp / rampLanding`); rails are whole squares long, under 0.7 m | long lines of hard ground, banks and stairs with a clear run-up, rails along edges and down stairs, drops you can ollie (under 1.6 m) |
| Looks | each area is the ULTIMATE form of its idea; nothing bare, nothing repeated | 14+ pieces a plot, a landmark a district, a skyline (high ground behind low ground) |

Today, across the measured world: **48 % of plots are dead flat** (under 0.6 m of relief), and **the whole built world outside
Disaster City holds 19 hill / ridge rows, 26 waterfalls and 9 climbs**. The Hollywood Hills alone have more height than every
route and the whole Desert together. So the verticality pass is the biggest single win, and it is mostly terrain rows, which cost no models and almost no memory.

## 2. The ranking: who needs the most love

NEED is 0 to 9 (district average). S / V / A = space / height / dressing, each 0 to 3.

### Tier 1: bad on all three (cramped, flat and bare)

| # | Where | Plots | What the numbers say | NEED |
|---|---|---|---|---|
| 1 | **The Cavern's three tunnels** (Long, Tunnel-Way, West) + Agartha's tunnel | 65 | 3 squares wide, 0 m of relief, 2 or 3 pieces a plot, no board fits on any plot. The largest block of empty world. | 8.8 to 9 |
| 2 | **The Sewers' under-city walks** (district U) | 35 | the same: 3 wide, 30 of 35 dead flat, 3 pieces a plot | 7.5 |
| 3 | **Heaven, The Rim** | 6 | 15 % walkable, 2 squares wide, nothing stands on it | 8.3 |
| 4 | **The D.U.M.B., CERN the Ring** | 22 | 33 % walkable, 21 of 22 dead flat, 19 bare | 7.2 |
| 5 | **Came A Lot, The Snowy Pines** | 8 | 31 % walkable, paths 2.8 wide, 0 m relief, no board on 7 of 8 | 6.9 |
| 6 | **The Internet, The Information Highway** | 12 | 44 % walkable, flat, 11 of 12 bare | 6.7 |
| 7 | **Came A Lot, The Forest** | 9 | 31 % walkable, 2.7 wide, all 9 dead flat (well dressed) | 5.6 |
| 8 | **Antarctica, The Ice Wall** | 6 | 46 % walkable, 0.8 m relief on a WALL district, 4 pieces a plot | 5.7 |
| 9 | **The Astral Realm, The Nightmare** | 13 | 3.4 wide, 8 dead flat, 7 bare | 5.3 |
| 10 | **The Ley Line** | 9 | roomy, but 0.1 m relief on all 9 and 8 pieces a plot | 5.3 |
| 11 | **The Catacombs** | 6 | too small (6 plots), 3 wide, one flat brick roof, 6 pieces a plot | 5.2 |
| 12 | **The D.U.M.B., Level P3** | 7 | all 7 dead flat, 4 pieces a plot | 5.0 |
| 13 | **The North Pole village** | 16 | 47 % walkable, 3.1 wide, 9 dead flat, no board on 8 | 4.9 |

Also at 4.2 to 6.1, small: the wild link plots (the Ritual Ground's 9 "L" plots, L9 / L10 / L11 by the Lodge and Olympus, 22 plots in all): bare connectors with nothing on them.

### Tier 2: roomy but flat (the verticality pass proper)

These have space and mostly dressing; they are tables. Cheapest to fix: terrain rows only.

| Where | Plots | Relief a plot | Dead flat | Note |
|---|---|---|---|---|
| **The Desert: Giza, Area 51, Western Town, The Circus** | 57 | **0.1 m** | 45 of 57 | the flattest zone in the game; span 10 m exists only as a few plateaus |
| **The Desert Highway** (4 rooms) | 74 | 0.4 m | 63 | |
| **Every other route** (13 rooms: Old Road, Valley Road, River Road, Stone Path, Pilgrim Way, Polar Trail, Coast Road, Badlands Highway, the trails) | 247 | 0.4 to 0.9 m | 133 | the Polar Trail climbs to a mountain pass on 0.7 m; the route kit lays flat ground by kind |
| **Came A Lot, The Village** | 28 | 0 m | 20 | also cramped: 3.7 wide, no board on 12 |
| **The Estate: The Corn Fields, The Ranch** | 38 | 0.1 / 0.6 m | 24 | fields may stay level; the ranch wants a rise, a creek cut, a hayloft line |
| **Hollow Earth + Agartha** | 23 | 0 m | 17 | big caves with flat floors |
| **The Looking-Glass Garden** | 6 | 0 m | 6 | also 2.9 wide |
| **The Internet** (8 districts) | 59 | 0 to 0.2 m | 48 | islands over a grid, all at one level |
| **The D.U.M.B. Command, Research** | 14 | 0 m | 11 | |
| **Heaven: The City, The Cloud Fields** | 8 | 0 m | 7 | |
| **Disaster City: Financial, Industrial, Civic Center** | 48 | 0 to 0.8 m | 27 | owner side; lowest priority, the city is in good shape (NEED 1.5) |

### Tier 3: has height, but cramped

The mountains and woods have the relief already; the walkable part is a thin ribbon through solid mass.

| Where | Plots | Walkable | Path width | No board fits |
|---|---|---|---|---|
| **Mount Shasta** | 20 | 43 % | 2.8 | 11 |
| **Mount Olympus** | 12 | 44 % | 2.8 | 5 |
| **The Snowy Pass** | 12 | 37 % | 2.6 | 7 |
| **The Woods** (Clearing, Dead Man's Cave, Redwood Trail, Ritual Ground) | 36 | 47 to 56 % | 3.8 to 4 | 8 |
| **The Fairy Forest** (Came A Lot) | 6 | 40 % | 3.1 | 2 |
| **The Sewers proper** (W) + Running Tunnels | 24 | 41 to 47 % | 3.7 | 5 |
| **The Cavern** (K) | 13 | 54 % | 3.9 | 2 |
| **The Astral Realm: the Sea, the Library** | 32 | 39 to 54 % | 3.1 to 3.8 | 8 |
| **Heaven, The Stairway** + **Hell, The Walkways** | 12 | 37 / 51 % | 3.1 to 3.3 | 7 |
| **The Beach, The Harbour** + **The Bermuda Triangle** | 18 | 33 to 35 % (the rest is sea) | 3.9 to 4.9 | 13 |

### Tier 4: good shape, bare (first builds that never got their dressing passes)

| Where | Plots | Pieces a plot | Note |
|---|---|---|---|
| **Hell** (all four districts) | 16 | 4 to 5 | the best raw height in the game (12 to 18 m a plot); the board says "LACKS: almost all dressing" |
| **The Deep: the Rings, the Trench, the Sea Floor** | 31 | 4 to 7 | the Trench drops 27 m; 20 of 31 bare |
| **Babel + Technoticlan** | 27 | 6 | 17 bare; Babel has 14 m a plot |
| **Antarctica** (all but the Station) | 28 | 4 to 10 | 16 bare |
| **The Vatican: The Square, The Cloister** | 11 | 3 to 7 | "first build only" on the board |
| **Heaven: The Gate, The Stairway** | 12 | 2 to 4 | |
| **Outer Space** (the 95 real plots) | 95 | 1 to 3 (the Mare 13) | 83 bare; the Crater, Canyon and Drop have height, Cydonia and the Mare are flat |
| **Göbekli Tepe** | 9 | 10 | |

### What is already good (leave alone, or use as the model)

The Hollywood Hills (0.7: 54 m of span, wide, dressed), the Haunted House (0.8), Antarctica's Station (0.5), the Basilica (1.2),
the D.U.M.B.'s Sub-Level 7 (1.3: the only D.U.M.B. district with stairs and levels), the Ritual Ground (1.4), the Ski Lodge +
slopes (1.4), the Lake (1.4), the Castle (1.6), Stonehenge (1.8), Bayside (1.1).

## 3. Too small, and can it grow

A plot is 42 m. **Every surface place has free One World plots beside it** (column "Free plots beside it" in `AUDIT_DATA.md`), so
on the map nothing is boxed in. Two things do limit growth:
- **Memory.** world-layout.md: a single district already measures at the 1.4 GB line (the Ranch, Western Town, Area 51). Adding
  plots to a heavy room is the expensive way to grow.
- **Seams.** A room that grows over a route's plots moves the route's seam door.

So grow in this order: **(a) widen the ways inside the plots a place already has** (most "cramped" places are 30 to 50 %
walkable: the room is there, it is filled with solid mass), **(b) open the solid mass into side places** (a clearing, a ledge, a
cave mouth), **(c) only then add plots.**

| Place | Plots | Verdict |
|---|---|---|
| The Frozen Sea | 3 | Too small to be a place. Add 3 to 5 floe plots, or fold it into the North Pole. |
| Pirates' Cove | 5 | Too small and bare (7 pieces a plot), 37 % walkable. Grow to 9: a cove wall, a wreck, a cave. 4 free sand plots beside it. |
| The Catacombs | 6 | Too small for what joins there (the Vatican above, Hell below, a tunnel). Grow to 12: an ossuary, a flooded crypt, a lower gallery. |
| The Sewers' Holding Cells, Old Workings, Radioactive Drain | 2 each | Districts of 2 plots. Each wants 4 to 6; the Old Workings already have 23 m of height on two plots. |
| The Looking-Glass Garden, the Fairy Forest | 6 each | Small and 40 to 48 % walkable. Widen first (a); each has 4 to 9 free forest plots if that is not enough. |
| The Circus | 9 | Small but full (46 pieces a plot). Leave the size; it needs height, not plots. |
| Stonehenge, the Sea Floor | 9 each | Small, both score well. Leave. |
| The Snowy Pines | 8 | 84 m wide: one plot of corridor each side of a trail. Widen to 3 plots across (14 free plots beside it). |
| The Redwood Trail | 9 | The same shape (84 x 336) but it scores well; leave. |
| Hell | 16 | Good shape, feels small for Hell. A candidate for a fifth district later; dress it first. |
| The North Pole village | 16 | Enough plots, half of each is solid. Widen (a). |
| The Long Tunnel | 10 | 42 m wide, 420 m long, one corridor. See 4.3. |

## 4. The work, zone by zone

### 4.1 The verticality kit (what to build height from)

All of it exists in the terrain rows today: `plateau`, `hill`, `ridge`, `dip` (ground), `ramp`, `climb`, `spiral`, terrain
`stairs` (ways up), `bridge`, `deck` (ways over), `fall`, `stream`, `pool` (water), `wall`, `rail` (edges), and the height sheet in
each zone's `layout.json`. Rules that hold for every use:
1. **Height in 1.75 m steps on terraces 6+ squares wide**, so a fight's field reads it as tiers and a board still fits. No lumpy noise.
2. **Every level has two ways up**: one you walk (a ramp, stairs, a switchback) and one you find (a climb, a ledge chain, a fallen trunk).
   The owner's rule on secrets ("hard to reach vertically") lives here.
3. **Stairs are real pieces on whole squares** ("no procedural stairs"); walkways are whole cells wide.
4. **Skate lines**: every ramp and stair keeps 10 m clear before it and 6 m after; hard-ground districts get a rail down each long
   stair and along each terrace edge, and drops under 1.6 m where a line crosses a level.
5. **A waterfall needs a reason** (a stream above, a pool below) and a way behind or beside it. Cliffs wear `rocks_5`.
6. **Seams stay level.** The squares where a road leaves a room keep their height, so the neighbour still matches.
7. **A view pays for a climb**: each district gets one high place from which you see its landmark and the next district.

### 4.2 The Desert (thread 1, DONE) + every route (OUT of this plan: the highway thread's)

| Place | Do |
|---|---|
| Giza | a real plateau: the pyramids stand 2 tiers above the causeway, a quarry cut (a dip with ledges), dunes as ridges on the open plots, a wadi |
| Area 51 | a dry lake bed stays flat on purpose (4 plots); around it a ridge line with the gate in a cut, a bunker hill, berms round the hangars, a watch-tower rise |
| Western Town | Boot Hill becomes a hill; a mesa behind Main Street with a switchback and a mine mouth; a gulch with a trestle bridge; Main Street itself stays level (skate, fights) |
| The Circus | a low bowl round the Big Top, a midway on a terrace, a ridge of wagons |
| The Desert Highway (4 rooms) | cuttings and embankments: the road stays level and skateable, the land rises and drops beside it; mesas, arroyos under culverts, one overlook a leg |
| The 13 other routes | ONE change in the route kit (`bake-route.js`): each ground kind gets a relief recipe (peak / alpine: switchbacks and ledges; forest: banks and a stream gully; meadow: rolls; marsh: causeway over low water; coast: a cliff on the sea side). The road's own squares stay smooth. Then the Polar Trail and the Pines-to-Lodge trail get real climbs by hand. |

### 4.3 The underground (threads 7 to 10)

| Place | Do |
|---|---|
| The Cavern's tunnels + the Sewers' walks (100 plots) | Do NOT dress 100 plots of corridor. Every 3rd or 4th plot becomes a **chamber**: the whole plot opened (a board fits), on two levels, with one thing in it (an underground river and fall, a rock bridge over a drop, a collapsed stretch you climb, a crystal pocket, a flooded dip). Between chambers the corridor widens to 5 squares and slopes: the Long Tunnel runs from Agartha to the Cavern and should go DOWN. About 28 chambers. Approved by mondo 11-20, with BRANCHES: side tunnels off the chambers that lead to other districts and zones, so no walk is one straight pipe. |
| The D.U.M.B. Ring | open the ring's inside wall into galleries over the beamline (2 levels, grated walkways, stairs every quarter); service bays as side rooms; widen the ring floor to 5 |
| The D.U.M.B. P3, Command, Research | P3 = a car park: make it a ramped two-deck garage (the best skate spot underground); Command gets a raised bridge over a pit floor; Research a mezzanine |
| The Catacombs | grow to 12 plots; vaults, a lower gallery by stairs, niches, bone stacks |
| The Sewers proper | widen the walks to 4 or 5 where two channels meet; more weirs and falls (it has 3) on the level changes it already has (21 m of span) |
| Hollow Earth, Agartha | terrace the cave floors down to the Inner Sun; Agartha's city on three shelves joined by stairs and crystal bridges |
| The Cavern (K) | the three tiers exist; widen the ledges between them, add 2 chamber floors a board fits on |

### 4.4 The woods, the mountains, Came A Lot (threads 3 to 6)

| Place | Do |
|---|---|
| The Snowy Pines | widen to 3 plots across; a frozen stream in a gully, a pine ridge, drift banks; trails 4 wide with 2 clearings a board fits on |
| The Forest (Came A Lot) | the Crown's Road to 5 wide; a hollow, a bluff with a hunters' stand, a ford; 3 clearings |
| The Looking-Glass Garden | a sunken lawn, a raised terrace walk with a balustrade, steps between: a formal garden is the easiest place in the game to do levels well |
| The Fairy Forest | knolls are in its plot names and it has 1.3 m of relief: raise them to real knolls with a hollow between and root stairs |
| The Village | the town is flat on a table. Give the wall a walk you can climb to, drop the moat bank, put the market on the low ground and the church on a rise; widen the lanes to 4 (12 plots fit no board today) |
| Mount Shasta, Mount Olympus, the Snowy Pass | keep the height; widen the trail to 4 to 5 squares, and turn every second switchback into a ledge 8 squares deep. Olympus' temples want forecourts. Add what is missing on a mountain: falls (Shasta has 3 pools and no fall), a rope bridge, a chimney climb as the short way |
| The Woods (4 districts) | trails to 5 on the main way; open one clearing a district to a full board. Dead Man's Cave and the Redwood Trail already have the height: add 2 or 3 falls where the streams cross a level (the Redwood Trail has 12 water rows and 1 fall) |
| The North Pole village | open the solid half: a square in the middle a board fits on, a sledding hill behind the workshop, an ice wall with stairs, the lanes to 4 |

### 4.5 The first builds (threads 11 to 18): dressing passes, the shape is right

Each of these needs the five passes the older zones had, not new terrain. In order of how much they give back:
**Hell** (the height is superb and it is empty: parapets, chains, cages, the queue, embers), **Heaven** (the Rim rebuilt as
a real walk, the City given levels: stairs of cloud, a gate on a height), **The Deep** (the Rings and the Trench: ruins,
kelp, wrecks, ledges down the Trench wall a board fits on), **Babel + Technoticlan** (Babel's ramp as a place, not a slope),
**Antarctica** (the Ice Wall as a WALL you climb with stairs cut in it and a top walk; the Crevasse with ice bridges),
**The Vatican's Square and Cloister**, **The Internet** (levels: the districts at different heights joined by the moving
platforms it already has; the Information Highway widened to a board), **The Astral Realm** (the islands at one height
each: step them, widen the bridges to 3), **Outer Space** (the Mare and Cydonia: crater rims, a rille, a mesa field).

### 4.6 Disaster City (thread 2; mondo 11-20: the city is CRAMPED, see its row in section 5: that comes before these three)

The city is the best-scored place (1.5) and the skate capital (99 % hard ground, 300+ rails). Only three districts are tables:
**Financial** (plazas on podiums with stairs and rails, a sunken court), **Industrial** (loading docks, a rail cutting, a gantry
walk), **Civic Center** (a stepped forum). Small, and only on the owner side's say.

## 5. THE THREADS, in order

**How the work is cut:** ONE THREAD = ONE ZONE, because a zone has one bake tool and one layout, and two threads cannot edit the same tool.
Inside a thread, one district at a time, the worst-scoring first as the pilot. Threads on DIFFERENT zones can run side by side. The order below
is: the cramped surface first (the places a player walks through most), then the underground (worst scores, most new building), then the
first builds that are bare, then the small places. NEED = the audit's score (section 2; 9 is worst).

| # | Thread (zone) | Districts, worst first | Tool + files | What it mostly needs | State |
|---|---|---|---|---|---|
| 1 | **The Desert** | Giza, Western Town, Area 51, The Circus | `bake-desert.js`, `docs/areas/desert/districts/G W A C.js` | height | **DONE 11-19** (PRs 2195, 2197, 2198). Giza: dunes on the Sand Sea, the Canyon Stair to a lookout, the Deep Cut. Western Town: Boot Hill 4.6 m, the Gulch + its plank bridge, the Ridge Trail to an outlook. Area 51: Watchers' Peak over the wire, a dune line. LEFT LEVEL ON PURPOSE: the monuments, Main Street, everything inside the wire, the whole Circus. |
| 2 | **Disaster City, the cramped city** | every city district; start with the one mondo names, else the densest (Industrial 82 buildings on 16 plots, Sports + Culture 56, Entertainment, Financial) | the city's own files: `docs/disaster-city/districts/`, `city-layout.json`, `bake-disaster-city.js`; the owner side holds the city | STEP 1, A CITY AUDIT the first audit could not do: every stair, ramp and walkway that ends in a wall or runs into a building; every gap between two buildings under 2 squares; every plot with more buildings than it can hold. A list with pictures, shown to mondo. STEP 2: fix the collisions. STEP 3: thin or spread the worst plots, and GROW the districts that need it (42 free plots stand beside the city; growing moves the roads and seams round it, so the plan for that is shown first). | **NEXT** |
| 3 | **Came A Lot's woods** | The Snowy Pines (6.9, pilot), The Forest (5.6), The Looking-Glass Garden (4.3), The Fairy Forest (3.2) | `bake-camelot.js`, `docs/areas/camelot/layout.json`, `districts/N W L F.js` | WIDER ways (paths are 2.7 to 3.1 squares; 31 to 48 % walkable), clearings a board fits on, then height (all four are dead flat) | **THE SNOWY PINES DONE 11-20**: the room is 22 plots, three wide, in snow and snow pines (was a chain of 8 in summer lawn); the Sleigh Road in an S, the Pine Ridge + the Lookout, the Frozen Gully under the Log Bridge, three board clearings, the Frozen Tarn, the Hermit's Hollow. HOW (the Forest and the Fairy Forest copy it): a ROOM DESIGN in the room's own frame, `districts/N-room.js`; notes areas-complexes.md "THE SNOWY PINES, THREE PLOTS WIDE". LEFT: the old plots' own dressing, the trail L6 (the routes' thread). **THE FOREST DONE 11-20**: 21 plots, three wide (was a T of 9): the Crown's Road 5 squares with three bends, the Hollow (-3 m), the Bluff (5 m) with the Hunters' Stand, the Brook and its fords, the Old Oak, three board clearings; `districts/W-room.js`, notes "THE FOREST, THREE PLOTS WIDE". **NEXT: The Fairy Forest**; the Garden stays as it is. |
| 4 | **Came A Lot, The Village** | The Village (4.6; 28 plots, 20 dead flat, no board on 12) | same tool, `districts/T.js` + `T-houses.js` | lanes to 4 squares, the wall walk, the moat bank, a rise for the church. NOT the Castle (K: held by the castle thread) | open |
| 5 | **The Mountains** | The North Pole village (4.9), The Snowy Pass (3.9), Mount Shasta (2.8), Mount Olympus (2.7) | `bake-mountains.js`, `docs/areas/mountains/layout.json`, `districts/N P S O.js` | WIDER trails (2.6 to 3.1 squares), ledges 8 squares deep at the switchbacks, falls, a rope bridge; the North Pole's solid half opened | open |
| 6 | **The Woods** | Dead Man's Cave (3.4), The Clearing (2.7), The Redwood Trail (2.3), The Ritual Ground (1.4) + its 9 bare link plots (6.1) | `bake-woods.js`, `docs/areas/woods/layout.json`, `districts/C T G M.js` | main trails to 5 squares, one clearing a district, falls where the streams cross a level | open |
| 7 | **The underground walks** | The Cavern's three tunnels + Agartha's (8.8 to 9; 65 plots), the Sewers' under-city walks (7.5; 35 plots) | `bake-cavern.js`, `bake-sewers.js` (their walk rooms) | a two-level chamber every 3 or 4 plots, the corridor to 5 squares and sloping. A chamber every 3 or 4 plots (mondo 11-20) AND branches: side tunnels that lead to other districts and zones, never one straight pipe | open |
| 8 | **The D.U.M.B.** | CERN, The Ring (7.2), Level P3 (5.0), Command (3.7), Research (3.6) | `bake-dumb.js`, `docs/areas/dumb/districts/K P C R.js` | galleries over the beamline, P3 as a ramped two-deck garage, a bridge over Command's pit; dressing (19 of the Ring's 22 plots are bare) | open |
| 9 | **The Cavern** | Agartha (4.5), Hollow Earth (3.9), The Cavern (2.7) | `bake-cavern.js`, `docs/areas/cavern/districts/A H K.js` | terraced floors down to the Inner Sun, Agartha on three shelves. After thread 7 (same tool) | open |
| 10 | **The Sewers** | The Radioactive Drain (4.0), The Running Tunnels (3.3), The Sewers (2.9) | `bake-sewers.js`, `docs/areas/sewers/districts/R T W.js` | walks to 4 or 5 where channels meet, more weirs and falls. After thread 7 (same tool) | open |
| 11 | **Heaven + Hell + Vatican** | Heaven: The Rim (8.3), The Stairway, The City, The Cloud Fields; The Catacombs (5.2); Hell: all four (2.7 to 4.3); The Vatican: The Square (3.5), The Cloister | `bake-afterlife.js`, `docs/plans/world-zones/draw-afterlife.js`, `docs/areas/afterlife/districts/` | DRESSING (first builds). Hell has the best raw height in the game and is empty; Heaven's Rim is 15 % walkable | open |
| 12 | **Leylines** | The Ley Line (5.3), Babel (3.5), Technoticlan (2.8), Göbekli Tepe (2.2) | `bake-leylines.js`, `docs/areas/leylines/districts/Y T Z G.js` | the land beside the Line rises (the Line's own strip stays level); dressing on Babel + Technoticlan (17 of 27 bare) | open |
| 13 | **Antarctica** | The Ice Wall (5.7), The Hull in the Ice (4.2), The Shelf Ice (3.7), The Crevasse (3.5) | `bake-antarctica.js`, `docs/areas/antarctica/districts/W H F C.js` | the Ice Wall as a wall you climb; ice bridges; dressing (16 of 36 bare) | open |
| 14 | **The Internet** | The Information Highway (6.7), then the seven at 4.3 to 4.8 | `bake-internet.js`, `docs/areas/internet/districts/` | levels (56 of 71 plots dead flat), the Highway widened to a board, dressing | open |
| 15 | **The Astral Realm** | The Nightmare (5.3), The Sea of Possibility (4.6), The Library (3.8) | `bake-astral.js`, `docs/areas/astral/districts/N S L.js` | islands stepped, bridges to 3 squares, dressing | open |
| 16 | **The Deep** | The Sea Floor (3.3), The Trench (2.8), the Rings (2.7) | `bake-deep.js`, `docs/areas/deep/districts/S T R.js` | DRESSING (20 of 31 bare); ledges down the Trench wall | open |
| 17 | **The Estate** | The Ranch (2.8), The Corn Fields (2.8) | `bake-estate.js`, `docs/areas/estate/districts/R C.js` | a rise, a creek cut on the Ranch. The corn stays level | open |
| 18 | **Outer Space** | The Far Side, The Mare, Cydonia, The Rover Bay (4.1 to 4.8) | `bake-space.js`, `docs/areas/space/districts/` | dressing (83 of 95 real plots bare); crater rims, a rille | open |
| 19 | **The Beach's small places** | The Frozen Sea (5.3), Pirates' Cove (4.4), The Harbour (4.4), The Bermuda Triangle (4.0) | `bake-beach.js`, `docs/areas/beach/districts/` | GROW (approved 11-20): Pirates' Cove to 9, the Frozen Sea. The board lists the Beach's districts under the SECOND side: say so on the board first | open |
| — | **The highways and the routes** | the Desert Highway's four legs + 13 routes (~320 plots, 0.4 to 0.9 m of relief) | `bake-route.js` | NOT THIS PLAN: its own thread (mondo 11-20) | out |

**Targets** (what a district should reach; a low score that is meant stays low and is written in the row): main ways 5 squares wide; a board
fits (52 of 64) on at least 2 of every 3 plots; no more than 1 plot in 3 dead flat unless it is meant; 14+ pieces a plot; one high place
with a view and a reason to go there.

**What the audit gets wrong** (learned in thread 1; read a score with this in mind): it counts a drawn mass (a pyramid's footprint) as
walkable; a town's or an airfield's flat plots score as bad although they are meant; `hqTerrainFeet` answers nothing under a bridge.

## 5b. What the screenshot audit changed (2026-11-20; `SCREENSHOT_AUDIT.md` has the detail)

The pictures say the biggest problem is EMPTY and UNREADABLE places, not missing height. So, for the threads above:

- **Thread 2 (Disaster City):** nothing learned, it was NOT photographed. Its first step is its own pictures (30 views, a few minutes).
- **Thread 3 (Came A Lot's woods):** confirmed. The Forest and the Snowy Pines are flat lawn / flat snow with tree walls and a straight path.
  LEAVE the Looking-Glass Garden as it is (it is a model). Fix the hard square snow / grass edge at the Pines' room line.
- **THREAD 3, WHAT THE FIRST TRY FOUND (11-20; a pilot on the Snowy Pines was built, looked at and THROWN AWAY, nothing merged):**
  1. The Snowy Pines' room (`site_prebuilt_camelot_ow_pines`) is NOT the plan sheet's 96 x 17 strip. One World re-laid it: its 8 plots stand in a
     chain ONE PLOT WIDE (2 x 7 box, in the order P04, P03, P05, P02 | P01, P06, P00, P07), each moved on its own. So a ridge, a trail or a gully
     drawn across plot lines in `districts/N.js` is cut apart, and a side trail that reaches a plot side with no neighbour is filled back with
     trees by the tool (bake-camelot.js step 6b). **Design every piece INSIDE ONE PLOT**, and print the baked room's heights before a browser run.
  2. What makes it look poor is the room, not the dressing (N.js already had five dressing passes): a white strip 42 m wide lying in summer
     green lawn. The edge land is `edges: { world: true }`: it is drawn from the One World plots next to it, which are grass. The fix that would
     show most is SNOW AND SNOW PINES ON THE LAND BESIDE IT (the One World plot kinds, `docs/plans/one-world/`, a shared file: board note first)
     and the room 3 plots wide (approved 11-20). Both are layout jobs, not district-file jobs.
  3. Opening more squares (track to 4, two side trails, wider glades) made it WORSE: with one plot of width there are few pines left and it reads
     as bare snow. Do not widen the ways before the room is wider.
  4. Probes: an enemy near the spawn starts a fight and ruins every picture: run with `--flags=EW_HQ_NO_ENCOUNTER` (PLAYTEST_NOTES "A PROBE THAT
     NEVER GETS READY"). `shoot.js` does not pass it yet.
- **Thread 4 (the Village):** the houses against the castle wall are the tight spot. The castle's blurry wall picture is the castle thread's.
- **Thread 6 (the Woods):** the trail district (the link plots) is the long straight road mondo does not want: bends, branches, side glades first.
  The Redwood Trail and the Ritual Ground are good.
- **Thread 8 (the D.U.M.B.): MOVE IT UP, it is the worst-looking zone seen.** CERN, Command, Level P3 and Research are near-empty halls. Fill
  them (machines, pipes, mezzanines, pits) or make the halls smaller; copy Sub-Level 7, which works. It shares no tool with threads 2 and 3,
  so it can run beside them.
- **Thread 11 (Heaven + Hell + Vatican):** HELL NEEDS LIGHT, NOT HEIGHT: its shape is the best in the world and it is black on black. Torches,
  lava glow on the rock, colour, landmarks. Vatican: dress the Cloister and the Catacombs; the Colosseum and the Gardens are done; the palace's
  domes stand too close and wear a blurry picture. Heaven: not looked at.
- **Thread 12 (Leylines):** the Ley Line is the job (flat and bare). Stonehenge, Göbekli Tepe and Bug Colony's flowers are good.
- **Thread 13 (Antarctica):** it has its height already. The job is the empty one-colour fields of the Ice Wall and the Hull: landmarks, wrecks,
  camps, coloured things, blue ice. Fewer new ridges than its row says.
- **Thread 19 (the Beach's small places):** the Frozen Sea is the barest small place. Pirates' Cove and Volcano Island are good; check the cone
  wearing the water picture off Volcano Island.
- **A new kind of job, in no thread yet: BIG WALLS ARE BLURRY UP CLOSE** (Came A Lot's castle, the Vatican's palace and domes: one stretched
  stone picture). Ask mondo whether it gets its own thread (a tiling wall picture) or rides with each zone.
- Not looked at yet, so unchanged: threads 5 (Olympus, the Ski Lodge), 7, 9, 10, 14, 15, 16, 17, 18.

## 6. Questions for mondo

All answered 2026-11-20 (his words are in START HERE): flat is fine where meant; tunnels get a chamber every 3 or 4 plots and always branches;
every proposed growth is approved; the city is the place that feels cramped and may grow. One thing to confirm when its thread starts: the
Frozen Sea, grown (assumed) or folded into the North Pole.
