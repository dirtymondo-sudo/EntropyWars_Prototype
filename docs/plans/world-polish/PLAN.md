# THE WORLD POLISH PLAN: the audit, and the order of work (2026-11-19)

**A PROPOSAL. Nothing in the game was changed.** mondo's ask: "an audit of the world, zone by zone and district by district, to
determine which ones are too small or cramped and can be made bigger, or which ones need more work visually ... a verticality pass,
where we add hills and ridges and waterfalls and ledges and valleys and walls and stairs and ramps and walkways ... which zones and
districts + plots need the most love", designed for "third person exploration, the square battle grid, skateboarding, and aesthetics".

Files here:
- `audit.js` the tool that measured the world (`node docs/plans/world-polish/audit.js`, about 5 minutes). Its header explains every number.
- `AUDIT_DATA.md` its tables: every place, every district, the worst plots of each place.
- `plots.csv` all 1,514 plots, one row each.
- `need-map.svg` the world drawn plot by plot, green (fine) to red (needs the most).

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

### 4.2 The Desert + every route (tier 2; wave 1, the cheapest big win)

| Place | Do |
|---|---|
| Giza | a real plateau: the pyramids stand 2 tiers above the causeway, a quarry cut (a dip with ledges), dunes as ridges on the open plots, a wadi |
| Area 51 | a dry lake bed stays flat on purpose (4 plots); around it a ridge line with the gate in a cut, a bunker hill, berms round the hangars, a watch-tower rise |
| Western Town | Boot Hill becomes a hill; a mesa behind Main Street with a switchback and a mine mouth; a gulch with a trestle bridge; Main Street itself stays level (skate, fights) |
| The Circus | a low bowl round the Big Top, a midway on a terrace, a ridge of wagons |
| The Desert Highway (4 rooms) | cuttings and embankments: the road stays level and skateable, the land rises and drops beside it; mesas, arroyos under culverts, one overlook a leg |
| The 13 other routes | ONE change in the route kit (`bake-route.js`): each ground kind gets a relief recipe (peak / alpine: switchbacks and ledges; forest: banks and a stream gully; meadow: rolls; marsh: causeway over low water; coast: a cliff on the sea side). The road's own squares stay smooth. Then the Polar Trail and the Pines-to-Lodge trail get real climbs by hand. |

### 4.3 The underground (tiers 1 and 3; wave 3)

| Place | Do |
|---|---|
| The Cavern's tunnels + the Sewers' walks (100 plots) | Do NOT dress 100 plots of corridor. Every 3rd or 4th plot becomes a **chamber**: the whole plot opened (a board fits), on two levels, with one thing in it (an underground river and fall, a rock bridge over a drop, a collapsed stretch you climb, a crystal pocket, a flooded dip). Between chambers the corridor widens to 5 squares and slopes: the Long Tunnel runs from Agartha to the Cavern and should go DOWN. About 28 chambers. Ask first whether some walks should be shorter (question 3). |
| The D.U.M.B. Ring | open the ring's inside wall into galleries over the beamline (2 levels, grated walkways, stairs every quarter); service bays as side rooms; widen the ring floor to 5 |
| The D.U.M.B. P3, Command, Research | P3 = a car park: make it a ramped two-deck garage (the best skate spot underground); Command gets a raised bridge over a pit floor; Research a mezzanine |
| The Catacombs | grow to 12 plots; vaults, a lower gallery by stairs, niches, bone stacks |
| The Sewers proper | widen the walks to 4 or 5 where two channels meet; more weirs and falls (it has 3) on the level changes it already has (21 m of span) |
| Hollow Earth, Agartha | terrace the cave floors down to the Inner Sun; Agartha's city on three shelves joined by stairs and crystal bridges |
| The Cavern (K) | the three tiers exist; widen the ledges between them, add 2 chamber floors a board fits on |

### 4.4 The woods, the mountains, Came A Lot (tiers 1 to 3; wave 2)

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

### 4.5 The first builds (tier 4; wave 4): dressing passes, the shape is right

Each of these needs the five passes the older zones had, not new terrain. In order of how much they give back:
**Hell** (the height is superb and it is empty: parapets, chains, cages, the queue, embers), **Heaven** (the Rim rebuilt as
a real walk, the City given levels: stairs of cloud, a gate on a height), **The Deep** (the Rings and the Trench: ruins,
kelp, wrecks, ledges down the Trench wall a board fits on), **Babel + Technoticlan** (Babel's ramp as a place, not a slope),
**Antarctica** (the Ice Wall as a WALL you climb with stairs cut in it and a top walk; the Crevasse with ice bridges),
**The Vatican's Square and Cloister**, **The Internet** (levels: the districts at different heights joined by the moving
platforms it already has; the Information Highway widened to a board), **The Astral Realm** (the islands at one height
each: step them, widen the bridges to 3), **Outer Space** (the Mare and Cydonia: crater rims, a rille, a mesa field).

### 4.6 Disaster City (owner side; wave 5, small)

The city is the best-scored place (1.5) and the skate capital (99 % hard ground, 300+ rails). Only three districts are tables:
**Financial** (plazas on podiums with stairs and rails, a sunken court), **Industrial** (loading docks, a rail cutting, a gantry
walk), **Civic Center** (a stepped forum). Small, and only on the owner side's say.

## 5. The order, and how each pass is checked

| Wave | What | Plots | Why here |
|---|---|---|---|
| 0 | mondo's answers (section 6); one look run a zone with 3 or 4 views, to catch what numbers cannot | all | cheap, and it may reorder the rest |
| 1 | The Desert (4 places) + the Desert Highway + the route kit's relief recipes | ~380 | terrain rows only, no models, no memory; fixes the flattest quarter of the world with one zone tool and one kit change |
| 2 | Came A Lot's woods + the Village, the North Pole, the mountains' trails, the Woods' trails | ~150 | the cramped surface; widening is edits to each zone's layout sheet |
| 3 | The underground: tunnel chambers, the D.U.M.B., the Catacombs, the Sewers, Hollow Earth | ~230 | the worst scores, but the most new building |
| 4 | The first builds' dressing passes: Hell, Heaven, the Deep, Babel, Antarctica, the Vatican, the Internet, the Astral Realm, Space | ~330 | model-heavy; one thread a district as before |
| 5 | The small places (Frozen Sea, Pirates' Cove) and Disaster City's three districts | ~60 | least urgent |

**Per pass:** take the row on the board (`docs/notes/claims.md`), edit the zone's own tool / layout / district file, rerun its bake,
rerun `audit.js` for its rooms and put the before / after line in the PR, browser look + proof picture (RULE #1c), rerun
`bake-map.js` for the room (its heights changed), and `ow-census.js --diff` when plots were widened or moved ("nothing missing").

**Targets** (a district is done when): main ways 5 squares wide; a board fits (52 of 64) on at least 2 of every 3 plots; no more
than 1 plot in 3 dead flat unless it is meant (a lake bed, a plaza, a field); 14+ pieces a plot; one high place with a view; NEED under 2.5.

## 5b. THE PILOT IS BUILT: Giza (2026-11-19, on mondo's "go")
Dunes on the Sand Sea, the Canyon Stair to a lookout on the mesa's rim, the Deep Cut (a two-level excavation). What it taught, for every flat
district after it: `docs/notes/areas-complexes.md` "THE DESERT, GIZA", THE VERTICALITY PASS. The short of it: props ride the ground, monuments
drawn from parts do not, so a monument district gets its height between its monuments. mondo 11-19 on Giza: "looks decent, continue".
**WESTERN TOWN is built too (11-19):** Boot Hill raised, the Gulch with its plank bridge, the Ridge Trail to an outlook over the town
(areas-complexes.md "THE DESERT, WESTERN TOWN — THE VERTICALITY PASS"). **AREA 51 (11-19):** Watchers' Peak (the mesa outside the wire climbed, an overlook over Hangar 18) and a dune line; inside the wire stays level on
purpose. **THE CIRCUS: left as it is** (no free ground; its pieces are drawn at a fixed height). Next: the Desert Highway's legs and the route kit.

## 6. Questions for mondo

1. **Is the order right?** It puts the cheap flat surface (Desert, routes) before the worst-scoring underground. If you would rather see the worst fixed first, waves 1 and 3 swap.
2. **Flat on purpose?** I assumed these stay level: Area 51's lake bed, Main Street, the Corn Fields, plazas, the Ley Line's own strip (the land beside it rises). Anything else?
3. **The 100 plots of tunnel:** chambers every 3 or 4 plots (the plan above), or make the walks shorter and denser?
4. **Growing:** the Catacombs to 12, Pirates' Cove to 9, the Snowy Pines 3 wide, the 2-plot Sewers districts to 4 to 6. Yes / no each? And the Frozen Sea: grow it or fold it into the North Pole?
5. **Disaster City's three flat districts:** in scope, or leave the city alone?
6. **A look pass first?** This audit is numbers. Do you want wave 0's screenshots of every zone (about 20 probe runs) before any building, or straight into wave 1?
