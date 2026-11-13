# Notes: areas-complexes

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). Explorable areas, complexes, terrain rooms, Area Content Plan D1-D5, population.
Append new notes for this system at the end of this file.

## 7.6 WAVE 1 — THE SIX NEW SITES (HQ plan 7.6) — shipped 2026-09-13
Six launch maps in one delivery, each the plan's 7.10 checklist end to end:
**13 · THE HAUNTED HOUSE** (`prebuilt_haunted`, Terrestrial, `near:
'haunted'`; the gothic point of entry — ghost / werewolf / vampire /
ghoul), **33 · THE LODGE** (`prebuilt_lodge`, Terrestrial, indoors,
`near: 'lodge'` w 3.4 h 3.6; politician / general / marksman), **0 · THE
SINGULARITY** (`prebuilt_singularity`, CELESTIAL — the Quarantined bay is
sealed and a map must be playable, the E4 precedent; watcher / cosmic
wraith), **6 · SATURN** (`prebuilt_saturn`, Celestial; grey / black goo),
**21 · THE STRIP** (`prebuilt_strip`, Urban; conspiracy theorist / honda
civic) and **1954 · DOWNTOWN** (`prebuilt_downtown`, Urban, `leaf_glass`
— doorhq.test.js rations `leaf_revolving` to Bay 5; superhero / antihero
/ zombie / king kong). The full builders sit in a "7.6 WAVE 1" block right
before the DELTA FORGE banner in data.js, the Δs before the META banner,
the near builders before the MOVING MAPS block in three-renderer.js.
Rules that came with it: a full map's thin walls are `M.wall` (`see:
true` = a window: blocks walking, not sight; `sym180` mirrors walls —
author rows 0..7 ONLY, a row-8 edit is overwritten by the mirror); a Δ
never holes (the Singularity's void is a depth-2 `M.lake`); a +2 block
beside a spawn tile is clamped and fails the forge test; the 2×1 dumpster
mirrors by hand (`(4,3)-(5,3)` ↔ `(10,12)-(11,12)`); a site's flavour
props must sit inside its room (half = 4 + pad·… — the test says "in a
wall"). `env.ambience` on a meta row names a still map's bed (audio.js,
read after the moving-map rule). check-data-parity.js #6 now diffs
server.js `MAP_POOL` against EW_MAP_META (ids · sizes · team) — a new map
without its two pool rows fails `npm test`. delta-maps.test.js expects 38
Δ boards. Unseen live (RULE #1c): eyeball the house's windows, the eye over
the Lodge, the Singularity's drop, Saturn's ring plane, the Luxor's scale,
the collapsed tower. Full log: DOOR_HQ_BUILD_PLAN.md §9 (2026-09-13 wave 1).

## THE COMPLEXES — THE HAUNTED HOUSE (HQ plan 9.2 stage 1) — 2026-09-15, local delivery
A site that is SEVERAL ROOMS. The generated room (`hqSiteRoom`) stays the
BOARD ROOM (console, battle marker, the way back to the bay); a COMPLEX is
hand-authored box rooms in `DOOR_HQ.rooms` with ids `site_<mapId>_<part>`
wearing `site: mapId` + `part: '<name>'` and NO `roomNo` (`hqRoomNo` reads
the threshold's number through `site`; the register lists the site once;
the renderer plate does the same), joined to the board room by rows in
**`siteRooms.backDoors[mapId]`, now an ARRAY** (one row stays legal — the
Backrooms keeps its single H-Wing row). The first: Room 13 —
`site_prebuilt_haunted_hall` / `_upstairs` / `_attic` / `_cellar` (data.js,
the block right before H-WING) behind THE FRONT DOOR on the board room's
north wall at x −7.5 (west of the console at 0, clear of the signboard at
x 5 and the corner mast). Reads (data.js, before the built-rooms loop; on
`window`): `hqComplexRoomId(mapId, part)`, **`hqRoomSite(roomId)`** (= 9.4's
WILD test — a room with a site is wild, the facility is safe by
construction: never a flag on a facility room), `hqRoomPart`,
`hqSiteComplex(mapId)` (board room + parts in sheet order),
`hqComplexRooms()`, `hqRefreshComplexLinks()` (the parts take
`hqLinkDoors` once at load, never accumulating). A `links` end may name
`{ site, part, wall, x|z }` — `hqLinkRoom` resolves it ONLY to an authored
room (never manufactured). RULES: a part's doors stay inside the site (a
site ⇄ site seam is a `links` row, never a door row); a part never wears
`fx: 'site'` (no board, no setting); the house lights itself (`strips:
false`, `lights: []`, torches / candles / bulbs, ≤ `HQ_PROP_LIGHT_MAX`);
**THE PARK RULE**: a `railing_1m` run in every room and `riser_*` tiers in
every big one (a sloped ramp waits on 9.8's registry). The gallery (a
two-floor room, `shell.gallery`) is stage 2 renderer work — upstairs is
its own box room today. The wardrobe upstairs and the well in the cellar
stand as props where 9.3's `way` seams will hang. `npm test` runs
`hq-complex.test.js` (the sheet, the front door's lane, every door a pair
+ the complex connected, the production landing clear of every blocker,
the park rule, the link hooks, the source sites). Unseen live (RULE #1c):
the wallpaper tints, the `leaf: null` stair openings, the banister's
facing, the boiler's glow in a 2.7 m cellar.

## THE URBAN BLOCK — THE STRIP + DOWNTOWN AS COMPLEXES (HQ plan 9.2 stage 4) — 2026-09-16, local delivery
Rooms 21 and 1954 are the FIFTH and SIXTH complexes: `site_prebuilt_strip_
chapel` / `_casino` and `site_prebuilt_downtown_lobby` / `_subway` (data.js,
the block right after the Dutchman's hold; `site` + `part`, no `roomNo`).
`siteRooms.backDoors.prebuilt_strip` = THE CHAPEL's motel door on the north
wall at x −0.2 (the Strip's ONE free lane — the highway holds −5 / −10);
`backDoors.prebuilt_downtown` = THE TOWER's lobby door on the **EAST wall**
(z 0) — Downtown's north wall carries three link doors, the lane rule's
full ration, so a back door may hang on ANY wall (the Backrooms' is south;
`_hqBuildSetting` clears every room door's lane). The casino has ONE door,
no clock, no window (hq-urban.test.js insists); the chapel's saloon door is
the way in. **THE SUBWAY's third station**: `links.subway_downtown` (`way:
'train'`) stands the train FREE on the platform's own track (`{ site, part:
'subway', wall: 'free', x: −1.5, z: 3, face: 90 }` — a link end on a
complex part, the spaceship's rule; the body = local x −9..15.4 → room z
12..−12.4 in a 30 m room) and its far end wears **`leaf: 'leaf_frame_only'`**
on Cyberpunk's north wall at x −0.2 — the first `way` link with a PLAIN
DOOR BACK (`hqLinkEndWear`: an end that names a leaf takes a door; the
hq-world seam test accepts it). Never a second train on a wall that
already has one: a wall-end train's front car spans x −9..3 from its mark
and runs through the next lane's door. Two procs in three-renderer.js (the
Phase 8 stage 2 block): `slot_machine` (block, `light` + `glow`; the reels
spin on a ticker — doorhq.test.js counts it as a room's light) and
`turnstile` (block; the tripod turns for the walker). Tapes: one per part,
re-homed from the garage / kitchen / cold room / dungeon (the hundred
stays a hundred); **`DOOR_HQ.findSpots.site_prebuilt_downtown_subway`**
pins the platform's finds onto the platform — a `way`'s blockers are laid
at build and `hqFindFree` cannot see them, so any room whose far corner
is a track / a train / a way object needs a pin. `npm test` runs
`hq-urban.test.js`. UNSEEN LIVE (RULE #1c): the reels, the tripod, the
train's arrival on the shorter platform, the east-wall lobby door against
Downtown's setting, the stair mouth on Cyberpunk's street.

## THE SPACESHIP COMPLEX (HQ plan 9.2 stage 2) + THE CHECKLIST SYNC BUG — 2026-09-15 rev 18, local delivery
Room 426 is the THIRD complex: `site_prebuilt_derelict_airlock` / `_hold` /
`_bridge` (data.js, the block right before H-WING; `site` + `part`, no
`roomNo`) behind THE AIRLOCK on the deck's north wall at x −6
(`siteRooms.backDoors.prebuilt_derelict`). **THE LUNAR ROUTE'S COLLARS
LIVE IN THE AIRLOCK**: `links.moon_derelict.b` / `derelict_saturn.a` are
`{ site, part: 'airlock', wall: 'w' | 'e', z, sub }` — a link end on a
COMPLEX PART is the rule for every future "below decks" seam (the
Dutchman ⇄ Atlantis next); the site stays ONE station on the line
(`hqWorldRoutes` reads stations as sites). `leaf_bulkhead` is a WIDE
leaf: every bulkhead door row says `wide: true` and stands ≥ 1.65 m from
a wall's end (doorhq.test.js). A compartment tape is the 9.1 rule (one
per part); the hundred is fixed, so a new part's tape comes off a floor
room's row in `HQ_TAPE_SHEET`. `npm test` runs `hq-spaceship.test.js`.
**THE CHECKLIST SYNC BUG**: data.js `mergeProgressBlobs`'s `KEY_RE`
refused `:`, so the progress sync (client AND server — server.js runs the
same function off data.js) dropped every `site:<map>:<cond>` flag two
seconds after the commit and the stabilization checklist un-ticked.
Fixed (`:` is legal; achievements.test.js guards it) — **ship data.js to
Render as well as R2 for this one**. A sudden-death Key win files THE
KEYS through `state._winCause` (battle.js; reset beside `_winCondition`).

## THE FLYING DUTCHMAN COMPLEX (HQ plan 9.2 stage 3) — 2026-09-15 rev 19, local delivery
Room 1717 is the FOURTH complex: `site_prebuilt_revenge_gundeck` / `_cabin` /
`_hold` (data.js, right after the spaceship's bridge; `site` + `part`, no
`roomNo`) behind THE COMPANIONWAY on the main deck's north wall at x −5
(`siteRooms.backDoors.prebuilt_revenge`, `leaf_shabby_wood` = the site's
own single leaf). Ship frame: bow EAST (+x), aft west, port north,
starboard south — the cabin's stern windows are a `false_window` on the
WEST wall. **THE DEEP's hatch lives in the hold**: `links.revenge_atlantis
.a` is `{ site, part: 'hold', wall: 'w', z: 0, sub }` — a link end on a
complex PART is the rule for every "below decks" seam (the spaceship's
collars were the first); no link door stands on the main deck, the site
stays one station. **The ship's kit below decks = four `base: 'misc'`
catalogue rows** (`ship_cannon` span 2.2 / foot 0.9 / block — muzzle −X at
face 0, so face 0 runs out to port and 180 to starboard; `sea_chest`;
`ship_anchor`; `ship_lantern` = `ceil` + `light`, in doorhq.test.js's
room-light regex) reading the files `_MISC_GLB` names — never a second
file for the same thing (MODEL_INDEX §9). Tapes: one per deck (the boiler
/ server / ritual rooms gave theirs up; the hundred stays a hundred).
`npm test` runs `hq-dutchman.test.js`. Unseen live (RULE #1c): the guns'
facing, the lanterns under a 2.7 m beam, the stern window's glow.

## THE ROUTES + THE WORLD TAB (HQ plan 9.3 expansion) — 2026-09-15 rev 7, local delivery
`DOOR_HQ.links` (data.js) is the WHOLE route table: 32 live links on nine
lines named in **`DOOR_HQ.routes`** (`lunar` · `deep` · `divine` · `bases`
· `woods` · `ley` · `highway` · `wonderland` · `seams` — `{ label, sub,
color, dashed? }`); every built site but the Looking-Glass is a station
(its 9 m room has no landing off the board — it joins when the room grows
or 9.5 reaches it). RULES for a new link: an ordinary door end is a board
room's NORTH wall at x −0.2 / −5 / −10 (≤ 3 link doors per room, lanes ≥
4.4 m apart, west of the console lane, clear of the corner masts and the
x 5 signboard — hq-world.test.js's production landing test decides),
never a rank leaf, always a `why`, a `route` the catalogue names, two-way
(no one-way route without a verified way back). **`hqLinkLive(link)`** is
the ONE liveness rule (both ends built + well-formed + catalogued wear →
`{ a, b, wearA, wearB }`, else held at BOTH ends) shared by `hqLinkDoors`
and **`hqWorldRoutes(curRoom)`** (a line per route with a live link;
stations = SITES — a seam off a complex's part is the house's, Room 13 is
one station on `woods` + `seams`; walked from an end, `lines.length > 1`
= interchange, `here` = the viewer's room or site; `legs[].fromRoom /
toRoom` keep the real ends). THE WORLD = the directory's second sheet
(map.js `_hqWorldHtml`, under the register): a subway-map SVG per line in
its ink (`.hq-world-*` in styles-base.css, `--hq-line`), a dot per site
with its number, dashed legs for seams, a ring at an interchange, `.here`
filled, GO = `data-room="site_<id>" data-at="egress"` (the register's own
rule; doorhq.test.js counts that literal — 3 now). Older tests that count
a room's doors must filter `!d.link` (links append after a room's own
rows). Viewer-local (RULE #2). Still open: the suites, the star chart's
route lines, the other eight `way` kinds, the airlock / hold ends.

## THE DUNGEON — the cave is a CAVE GRID (HQ plan 9.3 stage 2) — 2026-09-15 rev 11, local delivery
**SUPERSEDED 2026-09-17 — THE TERRAIN ROOMS (below): no room wears `cave` any more; the grid code stays for a room that does.**
The seven cave chambers (`site_prebuilt_hollow_earth_*`, data.js, the
block before H-WING) are Pokémon Victory-Road dungeons in 3D now: a
`kind: 'box'` room may carry **`cave: { rows, legend?, floor, ledge,
rock, tint }`** — a hand-authored ASCII GRID that IS its floor. One cell
= `HQ_CAVE_CELL` 1.75 m (a battle tile); one LEVEL = `HQ_CAVE_LEVEL`
0.875 m (half a tile). **`HQ_CAVE_STD`** is the legend every room
shares: `#` rock (to the ceiling; the box walls stand behind it), `.` /
`0`–`9` floor at that level, `~` water (bed −1, WADED), `W` deep water
(never), `L` lava (never), `P` a pool whose bed is lvl 1 (a terrace
pool; its spill into `~` is a WATERFALL), `Y` the lava lake in a lvl-4
shelf, `=` planks at the floor over `W`, `B` the rope bridge (lvl 4)
over `P`, `H` obsidian (lvl 4) over `Y`, `@` obsidian floor, `O` obsidian
at lvl 4, `K` crystal (lit), and THE RAMPS — a cell rising ONE level
toward a side, the letter its base level: `a`–`f` north (0–5), `g`–`l`
south, `m`–`r` east, `s`–`x` west (**never reuse a lowercase letter in
a room legend** — `o` was the obsidian floor and became the lvl-2 east
ramp). A room's `legend` extends it (`{ lvl, key?, slope?, fluid?,
bridge? + under?, glow?, walk? }`). RULES: a ledge two levels up is a
WALL until its ramp (the walker climbs one level per step —
three-renderer.js `_hqSurface` reads `_hq.site.L`), never walks off
more than HQ_DROP_MAX, wades a `~` / `P` at HQ_CAVE_WADE under the
sheet, never enters `W` / `L` / `Y` or rock; a door LANE is three cells
wide at the wall, level with its sill — **a door stands at its lane's
level** (`hqCaveDoorY` → the renderer's `_hqDoorFloorY`: LEVEL −6 is on
the high tier, the fissure on the hot shelf, the mouth's exit on the
lip), free-standing WELLS on their tiers; the shell's `w` / `d` are
FITTED to the grid (`hqCaveFitRooms()` after the links refresh — never
hand-type them); `wallH` = `h`. Reads (data.js, on `window`):
`hqCaveCompile(cave, h)` → `{ w, h, cell, L, rockH, halfW, halfD,
cells[y][x]: { ch, lvl, key, walk, fluid, rock, slope, bridge, under,
glow, top, sheet } }`, `hqCaveInfo(roomId)` (cached), `hqCaveCellAt /
hqCaveTopAt / hqCaveFeet` (metres, room frame — the walker's feet),
`hqCaveDoorY(room, door)`, `hqCaveEdgeH`, **`hqCaveReach(info, cx, cy)`
= the walker's own step rule as a BFS** (hq-cave.test.js proves every
door reaches every other in every chamber — THE DUNGEON IS ALWAYS
SOLVABLE; author a grid, run the test, never guess), `hqCaveDoorCell`,
`hqCaveRooms`. Renderer (three-renderer.js, before `_hqBuildSiteBoard`):
**`_hqBuildCave(room)`** (called from `_hqEnter` on `room.cave`; sets
`_hq.site = { cave: true, info, NX, NY, L, … }` — `_hqSiteCellAt` is
oblong-aware now) draws instanced tops / ledges per level / the
jittered rock border, ramp WEDGES (`_hqCaveWedge`), bridge decks with
rope rails (`_hq.rails`), fluid pits with the battle's animated sheet
per key (`_hq.moatTick.keys` — `_hqTickMoat` ticks water AND lava),
WATERFALLS where a sheet meets a lower one, one point light per lava
lake, crystal glows, stalactites; **`_hqSiteFloorY(sc, x, z)`** is the
ONE feet read (a ramp interpolates, a pool wades, a bridge is its deck;
a site board keeps its old blockers) used by `_hqSurface`, `_hqAirOK`,
the jump landing and `_hqCamBlocked` (the boom never enters rock);
doors / ways take `y0 = _hqDoorFloorY`, counters / floor props / natives
/ the walker stand on their cell (`_hqCaveTop`); the box shell draws NO
floor plane under a grid. New procs `cave_torch` (a stake in the floor)
and `crystal_cluster` (both catalogued with a `light`; doorhq.test.js
lists them as room lights). THE PARK RULE in a cave = a `railing_1m` run
+ a SLOPE CELL (not a riser; `_hq.ramps` is filled from them for 9.8).
THE CAVERN (52 × 42 m, 30 × 24 cells, h 11) has the routes: the
terrace's ramps, the hall's stair, the ford under the fall, the plank
bridge, the long ramp up the east wall, the causeway across the lava
lake, the rope bridge over the pool. `npm test` runs `hq-cave.test.js`
(the sheet, the wells on three tiers, the lanes, the rock border open
only at lanes, the solver from every door, props / spawn / natives on
walkable cells, the wedge, the renderer sites). Adding a chamber = a
`cave.rows` grid + doors on lanes + `railing_1m` + a ramp letter; adding
a legend kind = `HQ_CAVE_STD` + a branch in `hqCaveCompile` /
`hqCaveFeet` + its look in `_hqBuildCave`. NOT BUILT: a ROCK ceiling
mesh (the box ceiling + stalactites stand in), a stream that flows (the
sheets drift in place), the door gun's surface set off the grid. UNSEEN
LIVE (RULE #1c): every chamber — the wedges' shading, the rock's
jitter against the box walls, the falls, the lava light, the rope
rails, a door frame standing on a 5.25 m tier, the wells on the crag.

## THE WELLS AND THE CAVE (HQ plan 9.3) — 2026-09-15 rev 10, local delivery
Every well in the world drops into ONE cave. The CAVE is the SECOND
complex and it is HOLLOW EARTH's (`site: 'prebuilt_hollow_earth'` +
`part`, no `roomNo` — `hqRoomNo` reads the threshold's 180 through
`site`, the register lists the site once, `hqRoomSite` marks it WILD):
seven hand-authored box rooms in `DOOR_HQ.rooms` (data.js, the block
right before H-WING) — `site_prebuilt_hollow_earth_shaft` (THE WELL
ROOM: one free-standing `way: 'well'` head per well, the gallery west),
`_gallery` (the crossroads, six doors), `_vent` ⇄ Room 666 HELL,
`_blast` ⇄ Room 555 D.U.M.B., `_adit` ⇄ Room 88 AGARTHA, `_mouth` ⇄
Hollow Earth's own BOARD ROOM (the complex's way in / out) and
`_oubliette` (the dead end behind the portcullis; its back wall is the
FOURTH CELL of Room 24601 — a `secret: true` pair, eight secret doors
now, and the dungeon's three `cell_bars` moved to z −3.2 / −1.0 / 1.2 to
free the panel at z 2.7). **THE SIX WELLS** are `links` rows on the new
dashed route **`routes.undercroft`**: the GARDEN (1618 — a facility room
seaming into a wild one, the H-Wing → Backrooms precedent, never gated),
the Haunted House's CELLAR (rev 6's `haunted_hollow` RE-POINTED and
renamed `well_cellar` — one row edit, never a duplicate), CAMELOT,
SKINWALKER RANCH, NUKETOWN and GÖBEKLI TEPE (the four on their board
rooms' free north lanes). Two engine additions carried it: a link END may
name its own **`sub`** and **`verb`** (`hqLinkDoors`; the heads read THE
GARDEN WELL · CLIMB UP — map.js's prompt reads `t.door.verb` before the
kind's), and **`hqRefreshComplexLinks` also refreshes any hand-authored
room a link names by `end.room`** (that is how the garden grows its well
door; it still never accumulates). LANE RULES (they moved): a site room
may carry **four** link doors when the lanes are ≥ 4.4 m apart and inside
the wall (Agartha's fourth is x −14.5), and a `way` on a site room hangs
in ANY free lane west of centre. A cave chamber is lit by its own torches
/ bulbs / crystals (`strips: false`, `lights: []`, ≤ `HQ_PROP_LIGHT_MAX`),
wears the terrain sheet's `cave_wall` / `cave_floor` and keeps THE PARK
RULE (a `railing_1m` run in every chamber, `riser_*` tiers in the big
ones). NEVER place `asteroid_*` or `utility_box` as a room prop (they are
board / horizon pieces — door-kit-batch.test.js fails); the cave's rocks
are `concrete_pillar`. `npm test` runs **`hq-cave.test.js`**. NOT BUILT:
the stage-2 ROCK shell (`kind: 'cave'`) and the stream as a waded sheet
(the shaft's ankle-deep water is a line of copy today), the oubliette's
roamer (9.4) and its tapes (9.1). Unseen live (RULE #1c): all seven
chambers — six well heads in one room, the cave sheets on a box shell,
the portcullis / hell arch as interior doors, the fourth cell's slab.

## THE WOODS — the forest on the cave grid (HQ plan 9.3 stage 3) — 2026-09-16, local delivery
**SUPERSEDED 2026-09-17 — THE TERRAIN ROOMS (below): the seven woods rooms are smooth fields now; the sheet, the links, the weenies and the tapes stand.**
The SEVENTH complex, the FAIRY FOREST's (`site: 'prebuilt_fairy_forest'` +
`part`, no `roomNo`; data.js, the block right before H-WING): seven OPEN
box rooms on the CAVE GRID (rev 11's dungeon rules) under ONE sky
(`hqWoodsShell(o)` — defined right before `DOOR_HQ`; `HQ_WOODS_LANDMARKS`
= the two weenies). **THE TREE CELL**: `HQ_CAVE_STD` `T` (a broadleaf) /
`D` (a dead tree) / `R` (a redwood, `tall`) — `{ lvl, tree: <foliage kind> }`
— a wall to the walker (`walk: false`, never a hazard; `hqCaveFeet` null),
the floor at its level drawn under it, ROCK to the field's raster wearing
the `forest` sheet (`hqFieldRasterCave` reads `src.tree`), planted by
three-renderer.js `_hqBuildCave` with `_nrTree` on a bare kit (the near
kit's foliage OBJ; the HQ loop's `_nrPollPending` swaps the proc stand-in);
a room's legend may raise one onto a tier (`Q` / `Z` on the trail). An
open cave room hangs NO stalactites (`nSt = S.open ? 0 : …`), no masts and
no strips — its torches light it (doorhq.test.js's mast rule exempts a
`cave` room). THE ROOMS: `site_prebuilt_fairy_forest_clearing` (THE
CLEARING — the crossroads: seven doors, the knoll, the stream, the old
tree), `_trail` (THE MOUNTAIN TRAIL: two tiers, Shasta's door on the top
one — a door you climb to), `_redwoods` (→ the Grove), `_pasture` (the
fence: the ranch's gate on the w wall, the house's garden gate on the n),
`_stair` (THE STAIRCASE: four wooden risers `E G I J` = lvl 1–4 in
`wood_planks`, a landing, an EXIT door that opens on the building's
`stairwell`), `_deadmans` (DEAD MAN'S CAVE: a crag, a storm drain, the
`graffiti_wall` proc — a canvas panel standing against a rock face, `face`
= the way the paint looks — and a `leaf_cell` grate onto the `tunnel`,
THE SUBWAY's fourth station) and `_ritual` (standing stones `S` = a lvl-4
unwalkable block, the circle, `leaf_hell_arch` onto Room 333). The way in =
`siteRooms.backDoors.prebuilt_fairy_forest` (n x −10, `leaf: null`). THE
LINKS: rev 7's three fence gates RE-POINTED and renamed (`woods_haunted` /
`woods_skinwalker` / `woods_grove`), plus `woods_shasta`, `woods_stair`,
`woods_sewer` (route `subway`), `woods_ritual` (facility ends `{ room }`,
the garden-well precedent, never gated) and `fairy_camelot` (a `pool` seam,
BOTH ends free on the north strips at `face: 90` — Camelot's north wall
has no lane left; hq-world's free-end landing rule passes only for face 0
/ 90 as written). **THE WEENIES**: `shell.sky.landmarks = [{ kind, id, deg,
dist, s, y }]` → three-renderer.js `_hqBuildLandmarks` (before the roster,
so a `scenery: 'none'` sky can wear one) → `_hqLandmarkBuilders.peak`
(Shasta: cones + a snow cap + `_hzLenticular`) / `.castle` (Camelot: the
curtain wall, four towers, the keep, lit windows); deg 0 = north,
clockwise (the star chart's rule), `dist` = the share of the sky disc,
never a floater. Adding a landmark kind = one builder. TAPES: seven
re-homed (the garden's `1618` → the clearing; Shasta / the ranch / the
forest / the grove / Babel / Downtown gave their SECOND tape — a built
site keeps ≥ 1, hq-finds.test.js says 1–2 now, a one-tape site has no
board find). `npm test` runs `hq-woods.test.js` (the sheet, the tree cell,
the dungeon rules incl. NO ISOLATED WALKABLE CELL, the pairs, the eight
links, the production landings, the park rule, the weenies, the tapes,
the field windows). Unseen live (RULE #1c): the trees' scale against the
walker, the wedge ramps as trails, the wooden risers, the two landmarks'
size over the treeline (`HQ_WOODS_LANDMARKS[i].s` / `dist` are the edits),
the graffiti's read, the pool seams on the strips.

## THE WOODS FIXES — the trees, the flight, the storm drain (2026-09-16, local delivery)
The user's three: no woods, a block staircase, a crag that should be a sewer.
**THE TREES**: three-renderer.js `_hqBuildCave` handed `_nrTree` a bare
`{ ts, rng }` — `_nrTreeProc` needs `K.cyl / K.mat / K.lit`, threw, the catch
swallowed it, and NO woods tree was ever planted. RULE: a tree anywhere in
the HQ is `_nrTree` on a REAL `_nrKit` (the site board's `hq: { w: 0, gap:
0, B: 1, tints: null }` kit) — never a hand-typed kit object. Every broadleaf
cell grows a second smaller tree; **THE TREELINE** = `shell.forest = { depth,
spacing, rows, start, kinds }` (metres; in `hqWoodsShell`) plants rings of
the foliage OBJs on the apron PAST the grid, door lanes clear for 4.6 m,
`EW_PERF_LOW` halves it. There is NO tree GLB in any bucket — the foliage
set is the OBJs (`_FOLIAGE_MODEL_FOR_KEY`). **THE FLIGHT**: a cave legend
row `{ lvl, slope, stair: '<sheet>', stairSide }` is a slope cell DRAWN as
the board's barrier_passage flight (`_buildStairMesh`, STAIR_STEPS treads)
rising one level — the staircase room's `E G I M`; never plank blocks, never
a skate ramp. **THE STORM DRAIN**: Dead Man's Cave is the woods' one INDOOR
part — a closed box on a brick cave grid (`rock: 'bricks_2'` to the 3 m
ceiling), a 3-cell culvert with the channel down its middle, the sump
halfway (ledge + ramp `m`), the grate at the east end; `cave.stalactites:
false` is read by `_hqBuildCave`'s `nSt`. hq-woods.test.js pins all three
(the sewer's width, the flight, the kit, the treeline). Unseen live (RULE
#1c): the OBJ foliage at this density — the offline shots show stand-ins.

## THE SHIP'S ONE DOOR + THE PLANET FLOOR + THE ROCKS + THE PYRAMID ON MARS — 2026-09-16, local delivery
**THE SHIP'S ONE DOOR**: the Spaceship's airlock has ONE collar (`site_prebuilt_
derelict_airlock` door `collar`, port wall, `action: { ship: true }`) that opens
on the course THE NAV CONSOLE on the bridge laid in (counter `nav`, `overlay:
'nav'` → map.js `_hqNavHtml`, `[data-course]` → `window._hqSetCourse` → data.js
`hqShipSetCourse`, one profile transaction, `door.hq.ship = { dest, set }`,
viewer-local). `DOOR_HQ.ship` names the collar + the console. A destination is
a `DOOR_HQ.links` row DOCKED on the collar — an end `{ site, part: 'airlock',
door: 'collar' }` (`hqLinkEndOk` accepts it, `hqLinkEndWear` reads the door's
leaf, `hqLinkDoors` generates NO door at that end and lands the far end AT the
door; `hqLinkDockedDoor` — only a ship door takes a dock). Reads:
`hqShipDestinations()` (sheet order), `hqShipCourse` / `hqShipResolve(profile,
{ force })` (what the collar opens on), `hqShipApplyCourse(profile)` re-plates
the collar (map.js `_hqEnter` calls it; `hqDoorNo` reads the destination's
number off `_courseNo` — never `roomNo`). map.js `_hqDoorDirectAction` resolves
`act.ship` (a course = straight through, charting the link; none = the panel
naming the bridge). `hqWorldGraph` gives the collar one edge per destination.
Adding a port = one link row docked on the collar. hq-spaceship.test.js /
hq-world.test.js own it. **THE PLANET FLOOR**: three-renderer.js
`_hqBuildSetting`'s cull dropped the planet ground as "in a door zone" (every
planet room stood on the sky) — `_wdBuildPlanet` tags its meshes `_ew_hqPlanet`
under `o.hq` and the cull keeps them; the room's planet + rim build at the
room's tile (`_hzKitTs`) with `K._wdFog` set. **THE ROCKS** (the user: no
pointy cones): `_hzRock(K, { kind: boulder | crag | stone | any, span, h, tex,
color, lift, snow, sink, tilt, rng, fog, cast, foot })` = the asteroid GLBs /
the standing stone in a TINTED Lambert (`_hzRockPick`), stretched toward `h`,
sunk, a snow cap on request, the jostled dodecahedron as the fallback; it
replaced every cone in `_nrPeaks`, `_nrSpires`, `_WD_RIM.peaks` (a mesa = the
boulder squashed) and `_WD_RIM.spires`; `_hzDoorKitGLB` / `_hzMiscKit` take
`matPick` + `onDone`. Never raise a ConeGeometry as a mountain / spire again —
call `_hzRock`. The pyramids and the icebergs keep their geometry. **THE
PYRAMID ON MARS**: `_hzModelPyramid(rng, { h, color, lift, cap })` (a lit
tinted Lambert when `color` is given; sizes against the kit tile) stands the
Cydonia pyramid off Mars's far corner in `_NR_BUILDERS.mars`. Log:
DOOR_HQ_BUILD_PLAN §9. Unseen live (RULE #1c): the rock GLBs' read, the tint,
the pyramid's size, the collar's plate, the console's rows.

## THE TERRAIN ROOMS — the cave and the woods as smooth height fields (HQ plan 9.3 stage 4) — 2026-09-17, local delivery
The user: "forget seamless with the battle maps — make the exploratory areas
more complex: smooth elevations, ridges, ledges, winding paths, inclines,
hills, dips, walls; 3D platforming for door gun puzzles, ramps and tall
platforms for skate tricks and big jumps; hard-to-reach places for the tapes;
redo the cave and the woods (the ASCII grid)". A box room may carry
**`terrain`** instead of `cave` (data.js, the block after `hqCaveFitRooms()`):
a SMOOTH HEIGHT FIELD composed from FEATURES in room metres, in AUTHORED
ORDER — `hill` / `dip` / `ridge` (relief, additive; a ridge's `h < 0` is a
gully), `plateau` (a flat tier with CLIFF sides: `edge` 0.35 m — dropped off,
never climbed; `r` or `w × d × rot`; `dome`), `ramp` (an incline `h0 → h1`
along a line; `stairs: true` = treads two samples deep; a ramp ENDS at a
tier's edge, ≤ 0.3 m inside it, never deep in it), `deck` (a plank bridge at
`y`; a deck spans BOTH banks of the water it crosses — an end on a bank is a
one-way cliff), `pool` / `stream` (CARVE to `y − depth`; `bank`; `key` water
(waded ≤ `wadeMax` 1.15 m under the sheet) | deep_water | lava (never
entered)), `wall` (solid, its top a floor + a grind rail once the feet reach
it), `rail`, `path` (the path sheet painted), `tree` / `grove` (blockers, the
near kit's foliage), `scatter` (catalogue props at seeded free spots);
`noise` (undulation), `crag` (a jagged rock band at a closed room's walls,
never in a door's lane). **Every door gets a PAD** (a flat landing at its
sill — `door.y` on a tier, else the ground; a free way a tongue from the
object to past its landing) — `hqTerrainDoorY` is the sill (the renderer's
`_hqDoorFloorY`); `hqLinkDoors` copies an end's `y`. THE ONE RULE:
**`hqTerrainFeet(info, x, z, curY)`** — the sampled height (`hqTerrainHeight`,
bilinear on a grid of `res` 0.35 / 0.5 m — the SAME samples the mesh is), a
climb refused where the slope > `maxSlope` (tan 45°), ANY drop taken
(`dropMax` 40: platforming), water waded, a wall solid below its top;
`hqTerrainAir` / `hqTerrainCam` the air and the boom; **`hqTerrainReach`** =
THE SOLVER (a BFS of that rule on the grid: hq-terrain / hq-cave / hq-woods
insist every door reaches every other — author a field, run
`node check-terrain.js [room]` (the ASCII dump + the reach), never guess).
`HQ_TERRAIN_RULES` = the numbers (climb = HQ_STEP_TOL, wade = HQ_WADE_M, body
= HQ_BODY_R — the test ties them). Renderer (three-renderer.js, the block
before `_hqBuildSiteBoard`): **`_hqBuildTerrain`** — ONE mesh (the floor sheet
blended into the `cliff` sheet by slope and the `path` sheet along the paths:
`_hqTerrainMat`, a three-map Phong through onBeforeCompile with the `aBlend`
attribute), the water in the battle's animated sheet (`_hqTickMoat`), plank
decks with rope rails, walls in the cliff sheet, rails on posts, the trees
(`_nrTree` on a real `_nrKit`, each a blocker), the scatter through
`_hqPlaceProps` (`_hq.terrainScatter`, `rect: false`), the treeline past an
open edge (`_hqPlantTreeline`, shared with the cave builder), stalactites
under a closed ceiling; `_hqSurface` / `_hqAirOK` / `_hqCamBlocked` / the two
landing sites / `_hqCaveTop` (= the ground under (x, z) — `_hqHasGround()`
gates the prop / native / find / counter heights) read the data rules; the
box shell draws no floor under a field. THE FOURTEEN: the cave's seven
chambers (crags, the well room's tiers, THE CAVERN's terrace / west shelf /
high tier (5.25 m, LEVEL −6's door) / spur / rope bridge / hot shelf with the
lava lake under an obsidian deck / long ramp / deep river with a ford and a
plank / THE NEEDLE, the fissure's obsidian ramp over the lava rift, the
oubliette's sunken cells) and the woods' seven (the clearing's knoll, stream,
plank, old redwoods and THE CRAG; the trail's two tiers and Shasta's door on
the top; the redwoods' creek, gully log and THE STAND; the pasture's
dry-stone FENCE (two walls the rider jumps onto) with THE DEAD TREE in its
gap; THE STAIRCASE (a stair ramp to the 3.5 m landing, banister rails, two
quarter pipes, THE TOWER); the storm drain (35 × 10.5 closed brick, the
channel waded, the sump deep, a ledge); the ritual mound, ditch, stones and
THE ALTAR STONE). **THE HARD TAPES**: `DOOR_HQ.findSpots` pins a tape on a
pinnacle; `hqTerrainFindSpot` gives it its ground and `hard: true` when the
walker's reach never gets there; `hqFindHardReachTerrain` proves a shot from
a reachable node into the band under the top, and the renderer's
`_hqPortalLedgeSnap` snaps such a wall hit to a floor door on the top (the
door gun's puzzle). **THE ENCOUNTER**: `hqFieldRoomOk` refuses a terrain
room — it fights the SITE's Δ (THE SITE IS THE BOARD; the user dropped the
seamless field). **THE WOODS BATCH**: fourteen Meshy GLBs (MODEL_INDEX §3e)
in `_MISC_GLB` + `DOOR_HQ.catalogue` (`base: 'misc'`) — `hollow_tree` /
`hollow_dead_tree` are THE TWO TREES WITH HOLES: `DOOR_HQ.ways.hollowtree`
(the fairy forest's way in, both ends) / `.deadtree` (the pasture's garden
gate ⇄ the house; the ritual ground ⇄ the Looking-Glass, `deadtree_
lookingglass`), built by `_hqTreeWay` (the GLB, hole to +Z — `rot` in the
catalogue row — over a procedural trunk); fern / stump / fallen_log /
dead_snag / pine / menhir / cave_stone scattered, campfire / signpost /
culvert_mouth / drain_grate placed, the near settings of the fairy forest /
haunted house / skinwalker ranch dressed. audio.js `wayHollow`. Ship data.js
to Render too (the finds ledger). `npm test` runs `hq-terrain.test.js`
(the rules, every room compiled and solved, the pads, the park rule, the
hard tapes, the walker's rule on a synthetic field, the renderer on a stub
scene). UNSEEN LIVE (RULE #1c): all of it — the mesh's look under each
room's light (the cliff blend, the path sheet), the water sheets, the
walker on a ramp and off a cliff, the GLBs' facings (`rot` / `h` are the
edits), the lip snap on a pinnacle, the treeline's density.

## THE DIVINE STAIR — HEAVEN · HELL · THE VATICAN · THE CATACOMBS · THE STAIRWAY (complex candidate #4, HQ plan 9.3 stage 6) — 2026-09-17, local delivery
The first complex built on THE CAVE / THE WOODS blueprint after the rule: four
TERRAIN rooms with generated floor plans on THREE sites (data.js, the block
right before H-WING; `site` + `part`, no `roomNo`), joined by seams.
**THE CATACOMBS** (`site_prebuilt_vatican_catacombs`, closed, `gen: cave`,
brick + `dungeon` floor, the crypt's own fog, `HQ_ROOM_LOOKS.catacombs` = the
teal preset under candles): the ossuary shelf up a brick stair, the sunken
chapel round a waded font, two sarcophagus rows (walls the rider grinds), THE
SKULL STACK (3.4 m, the hard tape). **THE PIT** (`site_prebuilt_hell_pit`,
closed, `gen: cave`, obsidian, `HQ_ROOM_LOOKS.hell`): THE BOWL (a 2.4 m dip)
down to a lava pool at its heart, THE LAVA RIVER with an obsidian causeway
(a deck spanning both banks), THE PLINTH (3.6 m, the hard tape), the gallery
ledge, the basalt wall. **THE STAIRWAY** (`site_prebuilt_heaven_stair`, OPEN
under Heaven's sky through **`hqDivineShell(o)`** — defined beside
`hqWoodsShell`; `HQ_ROOM_LOOKS.heaven` = Dreamy, bloom 0.5, no night; `gen:
rooms` with **`thicket: false`** (cloud banks, no trees — the rooms plan
without a thicket) and `wallH` 2.4): FOUR STAIR FLIGHTS in switchbacks
0 → 3.5 → 7 → 10 → 12 m (`stairs: true`), the healing pool on the first
landing, THE PINNACLE (5.2 m, the hard tape), the gate's door ON the top
landing (`y: 12`). **THE CLOUD FIELDS** (`site_prebuilt_heaven_gate`, open,
`gen: rooms`, `thicket: false`): cloud islands, THE RIFT (`deep_water`, never
entered) with THE PLANK over it, THE DAIS (1.75 m) with THE PEARLY WALLS and
THE GATE (`leaf_hotel`, Room 777's own, `y: 1.75`), THE PILLAR OF LIGHT (4.6 m,
the hard tape), two healing pools. **THE WAYS IN** = `siteRooms.backDoors`
rows on the FREED lanes: the Vatican's `crypt` (n x −10 → the catacombs'
`stair`), Hell's `pit` (n x −10 → the pit's `mouth`), Heaven's `gate` (n x
−0.2 → the fields' `heaven`). **THE SEAMS**: `links.vatican_hell` is
RE-POINTED (the id kept) off the two board rooms onto the parts — the
catacombs' EAST wall (z 4) ⇄ the pit's WEST wall — "the crypt's warm wall";
`links.catacombs_stair` (route `divine`, `leaf_frame_only`) = the catacombs'
north wall (x −6) ⇄ the stairway's south wall (the foot). The divine line
reads four legs now. **TWO RAMP RULES the flights taught** (the solver caught
both): a ramp ENDS 0.3 m INSIDE its upper tier's edge (`x1/z1` past the edge
leaves a hole between the ramp's end and the tier's 0.35 m edge blend) and
STARTS ≥ 0.4 m inside its lower tier (the ramp's own tolerance past `t < 0`
is 0.18 m). TAPES: four re-homed (Hell's FORM 666 → the pit, Heaven's THE
GATE → the fields, the Vatican's THE CONFESSIONAL → the catacombs, Olympus's
second → the stairway; the hundred stays a hundred, every site keeps ≥ 1);
`findSpots` pins the four hard tapes. Catalogue: `greek_column` (`base:
'misc'`, the board's `greekcol` file — the same-thing rule). Tests amended
for a multi-level plan: hq-floor-plan.test.js judges a deep solid cell
against `info.hFn(x, z)` (the authored floor under it, not a row-walk to
the nearest open cell — a cloud bank at the floor beside a 12 m landing);
the thicket rule reads `gen.thicket !== false`; hq-terrain.test.js's
tree rule is the woods' only; both count 18 / 17 rooms. `npm test` runs
`hq-divine.test.js` (the sheet, the ways in, one piece, the seams, the
solver + the production landing on every door, the park rule + the
hazards, the hard tapes, the helper + the source sites). UNSEEN LIVE (RULE
#1c): all of it — the cloud banks' read in `cloud_thick`, the stair treads
under the walker at 12 m, the lava under the obsidian causeway, the
`leaf_frame_only` foot, the brick catacombs under the teal grade, the
column GLB's scale. Assets that would lift it: MODEL_INDEX §3f.

## THE DIVINE STAIR, second delivery — THE VATICAN + THE FALL + THE RETURN GUARANTEE + THE VATICAN BATCH (2026-09-17, local delivery)
**THE RETURN GUARANTEE** (data.js `_hqTReturnGuarantee`, after the door
guarantee in `_hqTGenerate` and in `hqTerrainCompile` for a room without a
plan): nothing the walker can FALL INTO holds it — every cell reached from the
door pads with the walker's JUMP (`HQ_TERRAIN_RULES.jump` 1.3, any drop) must
reach a pad again; a TRAP gets A RESCUE RAMP (`_hqTRescuePath` / `_hqTLayRamp`:
the shortest way from the trap to returning ground at ≤ `rescueSlope` 0.7,
cut through the plan's solid, never lowering higher open ground beside it,
undone if it breaks a door route) else is SEALED (a forced cell only as a
last resort, `info.sealedCells`; never a pad; undone if it cuts a door off).
**`hqTerrainTraps(info)`** is the ONE read (empty = the room passes;
hq-terrain.test.js insists for every terrain room; `node check-terrain.js`
prints TRAPS + the rescue ramps cut; `info.rescues`). THE RAMP RULE is sharper:
a ramp ends **0.7 m inside** its tier's rect (the 0.35 m edge blend + a 0.5 m
sample — 0.3 m sampled a hole; the pit's gallery ledge was never reachable).
**THE VATICAN** is five parts (data.js, the block before THE PIT):
`site_prebuilt_vatican_basilica` (mass — the chancel, two TRIFORIUM galleries
at 4.6 up stairs behind the chancel, the organ loft = the tape; THE CRYPT door
on the chancel at y 0.9 → the catacombs; the board's white door opens on it:
`backDoors.prebuilt_vatican` id `basilica`), `_library` (THE SECRET ARCHIVE:
`gen: cave` in the `wood` sheet = the stacks, `crag: false`; the gallery at
4.0, THE DOME STAIR's door on it at y 4), `_courtyard` (THE CORTILE:
**`hqVaticanShell(o)`** — open behind a parapet under the Vatican's sky; a
cypress thicket plan; THE CISTERN = a hand-authored `way: 'well'` DOOR ROW,
free-standing, ⇄ the catacombs' north), `_observatory` (THE DOME:
`hqVaticanShell({ night: true, landmarks })` — THE STAIRWAY IN THE SKY due north
via three-renderer.js `_hqLandmarkBuilders.stairway`), `_catacombs` (its north
link door GONE). **THE TELESCOPE IS THE SEAM**: `links.observatory_stair`
(`way: 'telescope'`, a `wall: 'free'` end on the observatory part, eyepiece
south, ⇄ the stair's south wall wearing `leaf: 'leaf_frame_only'`);
`DOOR_HQ.ways.telescope`, `_hqWayBuilders.telescope` (the GLB
`brass_telescope` over a procedural tube — the Observatorium's `telescope` PROC
keeps its key), audio.js `wayScope`. `links.catacombs_stair` no longer exists
(the user's rule: the stair's foot is in the sky over the dome, not the crypt).
**THE STAIRWAY** (40 × 54) keeps the four flights and adds THE FALL: the lower
shelf (2 m) with its incline, THE LONG WAY up the west to the west shelf (6 m)
+ three steps onto the second landing, the stepping clouds (hop-high columns),
the pinnacle on the lower shelf (the tape; pin (17, 8)), `white_cloud` props
hung in the air (`y`, foot 0). **THE VATICAN BATCH** (24 GLBs, MODEL_INDEX §3g):
`_MISC_GLB` + `DOOR_HQ.catalogue` rows (`base: 'misc'`) — pews, podium,
throne (`front: 'back'`), cross, stained glass (wall, glow), carpet,
confessional, church wall / building (rect), italian buildings, arcade, two
shelves, catacomb wall, sarcophagus, skull pile, demon, brazier (`light`),
angel, pearly gate (open in the gap of the pearly walls, foot 0), white cloud.
Looks `HQ_ROOM_LOOKS.basilica` / `.archive` / `.observatory`. Tapes: Camelot's,
Agartha's, CERN's and Area 51's second re-homed. `npm test` runs
hq-divine.test.js (9). Ship data.js to Render too. UNSEEN LIVE (RULE #1c): every
GLB's scale and facing, the stacks in wood, the cypress banks, the landmark's
size from the dome, the rescue cuts between the cloud banks.

## DISASTER CITY — THE STREETS + THE MALL (complex candidate #1, HQ plan 9.3 stage 7) — 2026-09-17, local delivery
The FIRST complex on the blueprint after the rule, and the THIRD floor-plan
kind: **`terrain.gen.kind: 'city'`** (data.js `HQ_TERRAIN_GEN.city`, the
branch in `_hqTGenerate`) — `gen.streets` `{ pts, w, loop }` are the
corridors with a `walkW` SIDEWALK band and a `kerb` step (never on a forced
cell), the solid = THE BLOCKS risen `wallH` **as a MAX, never a stack** (an
authored roof / mezzanine inside a block keeps its height), cut by greedy
packing into LOTS (`info.lots`: `lotW`, `storeys`, `lowP` = a flat roof,
`building_1..8`) whose street-facing edges are FRONTS (`info.fronts`, the
façade where the rise begins); `info.gen.sidewalk / kerb / fronts ('window'
| 'store') / prisms` and `info.traffic` / `info.race` (`terrain.traffic` /
`terrain.race`, defaulted in `hqTerrainCompile`) ride to the renderer. Two
parts on Room 1954 (data.js, the block before THE DIVINE STAIR): **THE
STREETS** (`site_prebuilt_downtown_streets`, 112 × 88, open under Downtown's
sky through `hqCityShell`, `HQ_ROOM_LOOKS.city`): THE RING ROAD = THE
CIRCUIT, the avenue + cross street, the plaza, THE PARKING DECK (3 m, a
car ramp, a rail, two quarter pipes), THE COLLAPSE, THE ROOFTOP (4 m, the
hard tape — flush with the sidewalk so the shot is from the street),
parked cars on the parking lanes; doors `tower` ⇄ the lobby's NEW `avenue`
doors (east wall; the clock moved), `mall`, `metro` ⇄ the platform's NEW
`street` stair (n x 2.2; the departures board moved over the track).
**THE MALL** (`site_prebuilt_downtown_mall`, 66 × 46 × 7.6, closed,
`HQ_ROOM_LOOKS.mall`): the concourse cross, the atrium, the food court,
THE ARCADE with THE TIME MACHINE free against its back, the store units
the solid (5 m, `fronts: 'store'`, `prisms: false`), THE MEZZANINE up THE
ESCALATOR (**THE RAMP RULE's other half: a ramp is never INSIDE its tier's
rect while it is still low** — run it up to the rect and end 0.7 m in),
THE STORE ROOF (the hard tape, its face the concourse wall). **Renderer**
(three-renderer.js, before `_hqBuildSiteBoard`): `_hqBuildCityLots` (the
map-builder sprite prisms on the podiums via `_nrSpriteBuilding` on the
terrain's `_nrKit`; a `low` lot's parapet + plant; the fronts —
`_HQ_STORE_NAMES` on the mall's signs), `_hqBuildStreetLamps` (the lamp
OBJ on every street's kerbs), the sidewalk paint in the blend; **NPC
TRAFFIC** `_hqBuildTraffic` / `_hqTickTraffic` (`_hzVehicle` at the room's
tile — `_hzKitTs` set round the build — on the right, following the car
ahead, an open route's end teleporting to its start; **THE HIT** shoves
the walker along the car's heading with a hop (`pl.mvx / mvz` + `pl.vy`)
and throws a rider — `_hqRideBail(R, pl, 'car')`; `EW_HQ_NO_TRAFFIC`);
**THE CIRCUIT** `_hqBuildRace` (gates at the loop's MID-SEGMENTS — a gate
at a corner is never crossed; the START / FINISH banner) / `_hqTickRace`
(the rider only: `lapstart` · `gate` · `laptick` · `lap { ms, best }` ·
`lapdrop`, the wrong way never counts, `HQ_SKATE_RULES.race` =
`HQ_SKATE_DEFAULT.race` `{ hw, tickMs, minLapMs }`); `_hqWayBuilders.
timemachine` / `.gutter`. map.js `_hqSkateEvent` hears the beats (the
lap timer on the trick line, `_hqLapFmt`; a live combo beats it), files
a lap through `hqSkateBank` → `door.hq.skate.laps[room]` (THE BEST LAP PER
ROOM, LOCAL like the deck), the OFFICER sheet's THE CIRCUIT rows; audio.js
`wayTime` / `wayGutter`. **Seams**: `streets_strip` (the chapel's WEST
wall z 5), `streets_stadium` (Room 50's n x −10), `timemachine_cyberpunk`
(`way` at BOTH ends, Cyberpunk's free on its north strip — the ONLY way
from the city into Cyberpunk), `streets_drain` (`way: 'gutter'` ⇄ the
storm drain's `leaf_cell` grate n x −13, on the NEW dashed
`routes.sewers`). `npm test` runs `hq-city.test.js`. Second-pass asset
wishlist: MODEL_INDEX §3h. Unseen live (RULE #1c): all of it.

## THE COMPLEX BLUEPRINT + THE CANDIDATE LIST (the user's rule, 2026-09-17)
The user: "these two areas [THE CAVE and THE WOODS] are the blueprint for
making complex maps now — especially the part about getting the aesthetic
and the vibe right." RULE: every new complex is built the way those two
were — a generated FLOOR PLAN (`terrain.gen`, never a big box), the field's
own ground running out under a real FOG (no square edge, no kerb), a
`shell.look` GRADE per place (a retro preset, a vignette, the bloom / night
mood tuned to the vibe: exploratory, nostalgic, mysterious, fantasy, retro —
NeverEnding Story / Princess Bride / Oz / Wind Waker / Ocarina), the room's
own light, THE PARK RULE, the hard tapes, and `node check-terrain.js` before
anything is claimed. The candidates are in DOOR_HQ_BUILD_PLAN.md §9
"THE COMPLEX CANDIDATES" — read that list before starting a new complex,
and append to it when the user names another.

## DISASTER CITY, THE SECOND PASS + CYBERPUNK CITY (STREET LEVEL, the road tiles, the city batch, the closet) — 2026-09-17, local delivery
**STREET LEVEL** (the user: "the buildings should be street level, not on raised
plateaus"): the `city` plan's rise is INSIDE the buildings now — data.js
`HQ_TERRAIN_GEN.city` `riseIn` (the rise begins 0.1 m inside the mask line) +
`frontOut` (a lot's face stands 0.35 m OUTSIDE the line, over the ramp the 0.5 m
sampling draws either side of it), and THE TERRACE: the lots are laid ALONG
EVERY STREET FACE shoulder to shoulder (`lotW` a frontage, `lotD` a depth,
`lotMinW` the infill, a 4 cm seam between neighbours — the rows are rounded to
a centimetre), each wearing `rot` (the face's yaw, local +Z = the street),
`base` (the sidewalk's own ground under its front) and `face`; the depth is
capped at half the block when a street lies on the far side, short of any
feature otherwise; the fronts hang on the lots' own edges (`main: true` = the
laid face). three-renderer.js `_hqBuildCityLots`: every prism FROM THE GROUND
(`_nrSpriteBuilding` takes `o.d` — a w × d box turned by `ry`), a LOW lot a
one-storey concrete box from the ground; the 'window' front keeps only the
awning + the shop sign on a prism lot, the `storefront` GLB on a low lot's
ground floor, the `storefront_unit` GLB over the mall's glass; `gen.neon` = a
neon name on every main front + a hologram over a tall lot. **THE ROAD TILES**:
`_hqBuildRoadTiles` lays the user's straight + quarter-turn GLBs along every
street of a sidewalked city plan (a tile per street width, the turn ON a
right-angle vertex, nothing in an intersection; squashed to a kerb, 2 cm over
the field; EW_HQ_NO_ROAD_TILES). **THE CITY BATCH** = MODEL_INDEX §3i (19
`_MISC_GLB` rows, 14 catalogue rows, `_VEHICLE_KIT.taxi` / `.truck`; `city_bin`
OUTSIDE, `mall_bin` INSIDE; the time machine GLB over the `timemachine` way's
cage, the drain over the `gutter`'s grate; `_hzBasilicaDome` GLB-first with
`_hzBasilicaDomeProc` the stand-in + the `dome` landmark). **THE SUPPLY
CLOSET** (`site_prebuilt_downtown_closet` — a part's id is
`site_<mapId>_<part>`, hqComplexRoomId, never longer) off the mall's north wing
holds THE TIME MACHINE; its far end is **THE NOODLE BAR** (`site_prebuilt_
cyberpunk_noodle`) off **CYBERPUNK CITY · THE GRID** (`site_prebuilt_cyberpunk_
streets`, `hqCityShell({ neon: true })` + `HQ_ROOM_LOOKS.neon`: THE LOOP = THE
NEON GRAND PRIX, THE SKYWAY, THE BILLBOARD ROOF (the hard tape), THE STATION
where `links.tunnel_cyberpunk`'s train ARRIVES (a free end on the part) and
`links.subway_downtown`'s stair comes up (n x 12); the board room's back gate
`backDoors.prebuilt_cyberpunk` n x −10 — the board room keeps the highway
alone). RULES: a spawn / a native never stands in a traffic lane (the sidewalk
is theirs); a new city = `hqCityShell` + a `city` plan + the 7.10 checklist.
`npm test` runs `hq-city-2.test.js`. Ship data.js to Render too (the finds
ledger). UNSEEN LIVE (RULE #1c): the sprite prisms' look from the kerb (stand-in
textures offline), the neon inks, every batch facing (MODEL_INDEX §3i lists the
one-field edits), the quarter tile's curve at each corner.


### 2026-09-17 — Disaster City geometry, entrances and pedestrian traffic repair (local delivery)

Based on GitHub main c65341886eb7a4bd5f895d9d8618dfa6d393d57f. Not uploaded or deployed.

- Straight road GLB has baked vertical extent 0.478515 on its unit footprint. Road tiles now fit to 0.035 m thickness after loading, independently of road width, and sit 0.01 m over the field. This also keeps quarter-turn tiles at the same thickness.
- Inspected the storefront_unit asset: width along X, front toward +Z, depth 0.660156. Removed the assumed quarter-turn, recessed the back half-depth into the store, and fitted height below the existing sign band. The model no longer occupies the concourse. Procedural fronts remain available while loading / at low detail.
- The mezzanine ramp is now marked escalator with smooth collision and no lateral terrain rounding. Its visible terrain triangles are omitted under the escalator. _hqBuildEscalators places the supplied two-lane escalator at the lower floor rather than on the ramp midpoint, fits its width/run/rise, and retains a metal-step/handrail fallback when the model is unavailable. Removed the duplicate catalogue prop. Explicit noise amp:0 is now respected (the mall previously inherited 0.15 m noise).
- _hqBuildCityEntrances gives every normal outdoor city area door its own sprite building at the end of its existing approach street, aligned directly behind the working door, with a canopy, surround and destination sign. Shared by Disaster City and Cyberpunk. Door coordinates/actions and return landings are preserved. Special ways such as the gutter and train keep their existing forms; indoor doors already have walls.
- Disaster City traffic: 17 -> 8 vehicles; ring-road speed 4.5 m/s, avenue speed 3.5 m/s. Shared traffic yields to walkers/skaters along a sampled upcoming path, including corners and route respawns. Following gaps use the actual lead vehicle length. A three-second player-wide hit cooldown prevents successive cars from repeatedly shoving the player.
- Existing files only for runtime: data.js, three-renderer.js, index.html. Shared token 20260917-city-repair-03-cors. data.js belongs on both R2 and Render; three-renderer.js on R2; index.html on Render. No model files changed and no additional asset upload required.
- Validation: Node v24-compatible bundled runtime; package test command `node --test *.test.js`: 1,584 tests, 1,578 passed, 6 skipped, 0 failed. Syntax checks passed for edited runtime JS. 42 focused city/terrain/floor-plan tests passed; terrain connectivity and return checks run in that suite. New hq-city-repair.test.js covers mesh fit callbacks, entrance alignment, escalator fit/fallback, yielding through bends/respawn, lead-vehicle spacing, density and zero noise. Updated old assertions that required the removed stepped ramp and 0.3 road squash.
- HQ rendering/traffic changes apply to each player's local exploration; battle simulation and online relay are unchanged. No browser playtest performed. Final visual feel, escalator tread alignment and sign readability remain for in-game confirmation.


### 2026-09-17 — Room directory navigation and zoom readability (local delivery, not deployed)

- Verified the source files against GitHub main blob hashes before editing; includes the city repair already on main.
- map.js now activates a node with one click/tap or Enter/Space. Pointer-up retains the original pressed node even when SVG pointer capture retargets the event. A pan or cancelled pointer never travels. All travel uses the existing _hqDoAction / _hqMapAt path. FIT replaces the conflicting double-click reset.
- _hqMapLabelPlan prioritizes the current/hovered/focused room, hall/rings and major sites at overview scale, adds facility names at 1.55x and complex parts at 2.4x. Labels use screen-sized type and collision avoidance, recomputed during pan, zoom, resize and discovery animation. Uncharted names remain undisclosed.
- Search matches charted room names, numbers and area/site names. Results travel directly. Larger hit targets, visible keyboard focus, quieter map lines, no scanline overlay on the directory frame, and readable two-column door rows improve navigation. Existing room graph, authored names and discovery ledger stay authoritative; no new runtime module, story, battle state or network relay.
- Runtime upload: map.js and styles-base.css to R2; index.html to Render with shared token 20260917-directory-01-cors. Repository-only: hq-map.test.js and the three updated build/history documents.
- Validation: syntax checked map.js; map tests cover captured clicks, drag/cancel, keyboard travel, progressive labels, label separation and discovery privacy. No browser playtest was performed; final visual appearance remains to be checked in game.

Full suite: tests 1586; pass 1580; fail 0; skipped 6. Executed package.json’s test command directly with the bundled Node runtime (`node --test *.test.js`); npm is unavailable.

## EXPLORABLE AREAS — THE GUIDE + STREET LEVEL rev 2 (the city's solid is MASS) — 2026-09-17, local delivery
**`EXPLORABLE_AREAS_GUIDE.md` is THE doc for any explorable area — read it before building
or reworking a complex, a site room or a floor.** It names the THREE FAMILIES (A natural =
`gen.kind: 'cave'` / `'rooms'`; B prefab = hand-authored box rooms; C rooms-and-hallways =
H-Wing / the tunnels, no generator yet; D streets = `gen.kind: 'city'`), when to use which,
how to mix them across a complex's parts, the research (BSP, cyclic dungeons, Parish &
Müller streets, Portal chamber chains), the build order, the checklist, the Δ site-room
rework (§6: the square ledge goes, the crystal stays), the discovery rule (§7: Otto's
repairs open an earned door), the multi-floor plan (§5) and **THE WEENIES (§5b, the user's
Disneyland rule: every part gets a far landmark on the sky and a near one inside at the end
of the entrance's sightline, placed BEFORE the floor plan; a part with neither is not
finished)**. Append to its §10 log.
**STREET LEVEL rev 2**: `HQ_TERRAIN_GEN.city.podium: false` (the default) applies NO rise —
a city block is a MASS at street level: `hqTerrainFeet` refuses it by the mask (`solidPad`),
`hqTerrainAir` / `hqTerrainCam` meet `info.solidTop` (`hqTerrainSolidTop`: a lot's roof at
`storeyH` per storey, else `wallH`), and every frontage run no lot covers wears a YARD WALL
(`info.yardWalls` → `info.walls`, `fenceH` / `fenceKey`; never in front of an authored
tier — the rooftop's own cliff is the door gun's). The mall's plan says `podium: true` (its
store units ARE the mass, `prisms: false`) — the only podium left. `check-terrain.js` still
solves both cities; hq-city / hq-city-2 / hq-floor-plan read the mass rule. Ship data.js
to R2 AND Render. Unseen live (RULE #1c): the yard walls' read in `bricks_2`, the flat
concrete yards seen from the parking deck, the outer ground past the outer blocks now that
no podium hides it.

## THE URBAN PACK — DISASTER CITY IN THE PACK + THE ROADS OUT (2026-09-17, local delivery)
The user's 320 tileables (128 px = one battle tile, 1.75 m; repo `textures/` + 20 at
the root; R2 `Assets/Sprites/terrain/urban/<Name>.png`) are **sprites.js
`URBAN_TEXTURES`** (name → url) / **`URBAN_TEX_FAMILIES`** (34 families) /
`urbanTexPick(family, rng, filter)` / `urbanTexGlow(name)` (the lit `-Glow` twin
of a window sheet) — NEVER in TERRAIN_SPRITES (a terrain key is a board tile).
**THE KEY**: any material names one as **`urban:<Name>`** — three-renderer.js
`_hzTex` / `_hqTex` fall through to the registry, so a shell (`floor` / `wall` /
`dado` / `ceiling` + `ceilTile: 1.75`), a terrain field's `floor` / `cliff` /
`path`, a `fenceKey`, a wall row's `key` and a prop all read it the same way.
**THE STREETS IN THE PACK** (the user: "the streets are all distorted"): the
asphalt IS the field — a city plan's `floor` sheet paints the corridors
(`urban:PlasterWallPainted1b`), its `path` sheet the sidewalk band + the door
paths + THE PLAZA (a 21 m `path` row; the slabs, `urban:TileGeneric1a`), its
`cliff` sheet the yards and the OUTER GROUND (`_hqBuildOuterGround` blends a
city's outer ring to the cliff sheet) — the terrain's own three-sheet blend
follows every corridor and intersection, nothing overlaps, nothing distorts.
What stands on it is **`_hqBuildRoadMarkings`** (three-renderer.js, before the
street lamps; `HQ_ROAD` = the numbers): the centre dashes (never inside another
street's corridor or through a bend), the edge lines, a ZEBRA + a stop line
where a street enters another's corridor, KERB STONES (a light strip with a face
down to the road), MANHOLES (`DecalManholeCover`), SPEED SIGNS on posts
(`SignSpeedUsa025/035-small`, facing the road with a grey back) and a NO ENTRY
at a dead end — three merged geometries. The GLB road tiles are OPT-IN now
(`EW_HQ_ROAD_TILES`); `EW_HQ_NO_ROAD_MARKS` kills the paint. **THE HOARDINGS**:
a city's yard walls wear `gen.fenceKey: 'urban:MetalCorrugatedPainted1a'` at
`fenceH: 1.75` (one tile: the plinth at the foot) with `_hqHoardingSigns` —
the pack's DANGER / CAUTION / HAZARD plates on the street face. **THE
TEXTURED BUILDINGS** (the user: "keep the billboard buildings, but throw in
generated buildings made with these textures"): `gen.texP` (0.5) of the lots
(seeded per lot) and every `low` lot are **`_hqTexBuilding`** — a facade grid
of 1.75 m cells, two a storey (`HQ_TEXB`), a STYLE from `_HQ_TEX_STYLES`
(office: concrete spandrels + square curtain glass, a storefront ground floor;
tower: the tall curtain wall; residential: painted plaster, the skirting band
on the ground row, window DECALS over the upper rows, a painted door; stucco:
the cornice on the top row; factory: the corrugated cladding + the factory
glass + a wide door), `gen.ruinP` of them RUINED (the Broken glass, the grime;
0.35 in Disaster City, 0.1 on the grid), the roof in `ConcreteUnderTiles` under
a parapet, the plant on top; under a neon plan every window wears its `-Glow`
twin as an emissive map. Quads are MERGED per sheet (`_hqTexBatch`, ~20 draw
calls a city); a textured lot's front skips the sprite lot's awning / sign;
blocking is the plan's own mass rule. The neon city's field is self-lit (lift
0.42) and `hqCityShell`'s neon `floorColor` is 0xb4b4d0 — the sheet is dark
already. `EW_HQ_NO_TEX_BUILDINGS` = sprites only. **THE ROADS OUT** (the user:
"roads that lead to nothing need to be doors — keep walking and you end up in
the street of another area"): **`DOOR_HQ.ways.road`** (`w` 9, `pad` 10, `open`,
`sfx: 'wayRoad'`) — a street's END is the seam: three-renderer.js
`_hqWayBuilders.road` runs the asphalt + the dashes 40 m on into the fog over
the outer ground (13 m on a site room's apron), a freeway GANTRY over the mouth
names the next town (the door's label + the end's `sub`), a LEAVING plate and
a speed plate stand on the shoulders; the opening is the whole street and the
press-in is walking on (`hqTerrainCompile` reads a way's `pad` for the landing;
`_hqBuildWay` hands every builder its placed frame `wx / wz / yaw / y0`). The
highway's four links are ROADS at both ends now: `nuketown_downtown`
(Nuketown n −5 ⇄ the streets' cross street EAST end), `downtown_strip` (the
cross street WEST ⇄ the Strip n −5), `stadium_downtown` (the Stadium n −5 ⇄
THE AVENUE's north end), `strip_cyberpunk` (the Strip n −10 ⇄ the GRID's cross
street east end); `streets_stadium` (Gate C) is RETIRED and the Downtown board
room's north wall is free. **THE OTHER URBAN ROOMS** wear the pack: the
platform (`TileSubway1a` walls, the slate floor, `MetalSubwayGrill1a`
overhead), the lobby (chequered `TileMarble1a`, stucco, `FibreCeilingTile`),
the casino (`TileMarble3c`, red `PlasterWallPainted2c`), the chapel (the
cornice stucco), the mall (`TileMarble2a`), the closet, the noodle bar
(`TileSubway3d`, corrugated). **THE PROBE**: `node playtest_city.js <room>
'[views]' [--wait=ms] [--flags=A,B] [--loglen=n]` (repo tooling) = the HQ probe
WITH THE REAL SHEETS — the sandbox's egress proxy reaches the CDN, every asset
is re-served with a CORS header (the proxy strips it and WebGL then refused
every image: the city rendered black) and cached under `shots/.cdn-cache`; the
urban pack is served from `textures/`; it relaunches on the headless crash
(one probe at a time — two browsers kill each other). `npm test` runs
`urban-pack.test.js`; hq-city / hq-city-2 / hq-urban / hq-terrain / hq-world
amended. Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): the plates'
loudness, the road out at the Strip's / the Stadium's / Nuketown's ends (a site
room's apron), the neon glow at 60 fps. The rest of the pack (D.U.M.B., CERN,
Area 51, the Δ boards) is still unworn — the key is the edit.

## DISASTER CITY, THE THIRD PASS — THE LOOK YIELDS · THE TWO-FLOOR MALL · THE KERB RULE · THE MITRE · CYBERPUNK CITY IS THE GRID · THE STRIP ITS OWN AREA (2026-09-17, local delivery)
**THE LOOK YIELDS TO THE PLAYER** (three-post.js): a scene look (`HQ_ROOM_LOOKS` /
`env.look` / `shell.look`) fills in ONLY the settings still at their FACTORY
default (`_RETRO_FACTORY` / `_CIN_FACTORY` / `BLOOM_FACTORY` / `EXPOSURE_FACTORY`
/ `DOF_FACTORY` / `NIGHT_FACTORY`, captured before the saved preference lands);
any slider / toggle the player moved wins everywhere (`_lkSame` at `_lkNum` /
`_lkRetro` / `_lkCin`; a look's preset re-seeds levels / tint only while the
player owns none of the three). `ThreePost.getSceneLookOwned()` lists the
player's keys. RULE: a look is a starting grade, never a lock. **THE ENTRY**
(data.js `DOOR_HQ.siteRooms.entry[mapId] = { room, door: { id, wall, x } }`,
`hqSiteEntry(roomId, at)` / `hqSiteEntryOf(mapId)` / `hqApplySiteEntries()`;
map.js `_hqEnter` redirects at its ONE room-resolution point and marks the
board room seen): a site named there is BYPASSED — every door, threshold, GO
and post-match return that would land in `site_<mapId>` lands in the part
(`at` kept when the part has it, else the part's `bay` door = the board room's
own egress copied onto the part at load, wearing `site` so its plate reads the
number). Cyberpunk City = `site_prebuilt_cyberpunk_streets`, the Strip =
`site_prebuilt_strip_streets` (NEW: `hqCityShell({ strip: true })`,
`HQ_ROOM_LOOKS.strip`, the boulevard + the back-lane circuit + the valet deck
+ THE MARQUEE ROOF's hard tape; the highway links `downtown_strip` /
`strip_cyberpunk` end on its e / w walls; the chapel's `street` door comes back
onto it), Downtown = `site_prebuilt_downtown_streets` (its bay door at s x −30).
The grid's tenement door is gone. Every part's label reads `DISASTER CITY ·
<place>`. Bypassing a new site = one `entry` row (+ a `path` for the bay door's
street on a city plan). **THE MALL** (`site_prebuilt_downtown_mall`): one open
box 96 × 64 × 12, NO plan, NO store-unit mass — the upper floor is five
plateaus at 4.6 (four galleries + THE EAST BRIDGE), the shops are
`terrain.shops` rows (`{ x0, z0, x1, z1, nx, nz, y, lip | wall, names }`) drawn
by three-renderer.js **`_hqBuildShopfronts`** (`HQ_SHOP`: bays, pilasters, the
pack's tall glass + glow, a door, a shutter in three, a fascia sign per bay
via `_hzTextTex`, the lip fascia + edge quad over the plateau's 0.35 m slope;
merged per sheet; `_ew_hqPart: 'wall'`) — a shop is a FRONT on a surface that
exists, never a mass. Two escalators (12 m) wear **`_hqEscalatorBalustrades`**
(solid side panels over the field's sampled skirt); two 12-m stairs (RULE: a
stair's last tread must stand within a climb of the tier before the tier's
0.35 m edge overtakes it — a 9 m stair jumped 1.02 m); THE FUN BOX, two grind
ledges (walls), the half pipe, THE CLOCK TOWER (the tape, 8.5 m). **THE
SCATTER RULES** (`hqTerrainCompile` freeFor): never on a ramp / stair /
escalator or its skirt; a seeded row refuses a slope > 0.25 (a row with its own
centre keeps 0.5); **THE KERB RULE** in a city plan: `rad + 0.35 ≤ maskD ≤
sidewalk − rad/2` (`f.road: true` opts out). **THE MITRE**
(`_hqBuildRoadMarkings`): kerbs + edge lines trimmed on the inner side and
extended on the outer by off·tan(θ/2) at every same-street corner. **THE
OVERLAP SWEEP** (`_hqTGenerate` city): a lot overlapping an earlier lot on
another face (1 cm) is dropped before the fronts. `HQ_TEXB.tint` /
`tintNeon` darken the textured buildings. `npm test` runs
`disaster-city-3.test.js`. Ship data.js to Render too. UNSEEN LIVE (RULE #1c):
the shopfronts, the balustrades, the stairs, the kerb density, the mitres on
the 45° chicane, the Strip at night, the bay doors.

## D.U.M.B. — THE HALLS FLOOR PLAN (family C's generator) + seven parts on Rooms 555 / 999 (complex candidate #5, HQ plan 9.3 stage 8) — 2026-09-17, local delivery
**THE HALLS** (data.js `HQ_TERRAIN_GEN.halls`, the `halls` branch in `_hqTGenerate`,
`_hqTTraceMaskWalls`, `_hqTRdp`): `terrain.gen.kind: 'halls'` = EXPLORABLE_AREAS_GUIDE
family C (ROOMS-AND-HALLWAYS) — a BSP of the shell (`leafMin` / `leafMax`) with a
rectangular room in each leaf, the AUTHORED rooms `gen.rooms` (`{ id, x, z, w, d }` — the
prefab chambers; a BSP room whose centre lands in one is dropped) and the AUTHORED halls
`gen.halls` (`{ id, pts, w, loop }` — a ring, a spur), every room / door pad / hall vertex
a node on a Prim tree + `loops` edges of L-SHAPED corridors (`corridor` [2.6, 3.4],
square-capped, clamped after the snap); `bsp: false` = the authored alone. The solid is
MASS (`solidMass` like a city block: the walker refused by `solidPad`, `info.solidTop` = the
shell's h — the walls reach the ceiling), never a rise; a TOOTH CLEANUP (two passes) before
THE GUARANTEE; the mask's boundary TRACED into **`info.planWalls`** (unit faces on the
half-cell lattice, skipped within `wallInner` of the shell, chained, Ramer–Douglas–Peucker
at `simplify` 0.5 m, each row `wallT` thick in `wallKey` — an `urban:` sheet — pushed into
the solid by t/2 + its own chain's reach toward the open side, so the drawn face never
protrudes past the line the mask refuses at); `minOpen` 0.12 per kind (a tunnel is mostly
wall; hq-floor-plan.test.js reads it). three-renderer.js `_hqBuildTerrain`: `drawWall` is
the ONE wall path (info.walls AND info.planWalls; `keyedMat` caches a material per sheet;
a plan wall wears `_ew_hqPart: 'wall'`), `_hqBuildHallsLights` hangs an emissive tube every
6.5 m down every corridor / hall (`EW_HQ_NO_HALL_LIGHTS`). `check-terrain.js` prints
`traced walls n`. **THE PARTS** (data.js, the block before H-WING; `hqBunkerShell(o)`
beside the city shell — closed, the pack's concrete / corrugated / rubber / drop ceiling
at 1.75, the red lamp, a haze, `HQ_ROOM_LOOKS.dumb`; `.warroom` / `.bunker` / `.cern`
too): `site_prebuilt_dumb_motorpool` (the tram hall + THE PLATFORM + the lit `train_car`
= the weenie, the bays; **`links.area51_dumb.b` / `dumb_cern.a` RE-POINTED onto its west /
east walls** — the board room keeps `cave_dumb` alone), `_sublevel7` (the hub + THE TOWER
(the tape) + THE DROP / THE CATWALK (a `deck` plank between two 4 m towers) / THE PIT (a
`dip`) / OBSERVATION; five spokes), `_dreamlab` (the ward, the range's `floating_orb`, the
booth), `_clonevats` (six `iso_tank` vats under the gantry, the free-standing
`door_furnace`, **THE OTHER ONE = a `clone: true` npcSpot**), `_warroom` (family B, no
plan: two galleries, THE BIG BOARD on the shell's north wall), `_bunker` (the loft, a
`pool` waded, the cellar), `site_prebuilt_cern_ring` (`bsp: false`: one octagon loop hall
+ two spurs, the detector hall, the control room; open 19 %). Back doors on the freed
lanes: `backDoors.prebuilt_dumb` (n x −5 → the motor pool) and `.prebuilt_cern` (n x −5 →
the ring), both `leaf_bulkhead` wide. Tapes: seven re-homed (Antarctica's, the North
Pole's, the Singularity's, Mars's, Saturn's, the Moon's, Giza's second — retitled for their
rooms; the base keeps its own two on the board); `findSpots` pins the seven hard tapes. **RULES**: a STAIR's tread rise + the tier's
0.35 m edge step must stay under the slope rule at the edge — ≤ ~0.45 m a tread (L ≥
2.2 × h) AND the stair ends 0.7 m inside its tier (1.2 m buries the last tread: a 1.0 m
step); a plan room hangs NOTHING on the shell — every wall prop stands FREE on a plan
wall (`x, z, face, mount`); `leaf_security` is the L4 rank leaf; never `utility_box` as
a room prop. `npm test` runs `hq-dumb.test.js`; hq-floor-plan (28 planned) / hq-terrain
(33 rooms) / hq-finds (the shelf hints a site's every other tape) amended. NOT built: a chamber template library, doors on BSP rooms, a
dropped corridor ceiling, THE SHAFT ROOM, Area 51's hangar part, the pack on the board
rooms. Ship data.js to Render too. UNSEEN LIVE (RULE #1c): all of it — the traced walls
at the corners, the strip lights, the tram, the plank, the pit, the windows, the furnace,
the pool, the orb, the two new plates.

## D.U.M.B. CONTINUED — THE CYCLE RULE · THE BASES BYPASSED · LEVEL P3 · THE LOOPS · AREA 51 (2026-09-18, local delivery)
**THE CYCLE RULE** (data.js `_hqTGenerate`, the `halls` branch; `HQ_TERRAIN_GEN.halls
.minDegree` 2): every ROOM node of a halls plan (BSP or authored) takes L-corridors to its
nearest unjoined nodes until it has TWO — a room with one way in is a dead end the user
does not want; `gen.minDegree: 1` restores the tree for an authored spur. Readout
`info.genPlan.edges` / `.deadEnds` (check-terrain's JSON prints `deadEnds`; hq-dumb /
hq-area51 insist on 0). **THE BASES ARE BYPASSED** (`siteRooms.entry` rows for
`prebuilt_dumb` / `prebuilt_cern` / `prebuilt_area51` — the user: "we don't need the board
maps if the place already has an area"): the freight lift lands in the motor pool, the
blast door on the ring, the hangar man-door in HANGAR 18, each part wearing the board's
egress as its `bay` door (s x 0) and no door of its own back to the board. RULE: a link on a
bypassed board lands at the bay door — move every link onto a part FIRST (`area51_dumb.a` →
the hangar's e wall, `cern_backrooms.a` → the ring's n x −12, `cave_dumb.b` → SUB-LEVEL 7's
n x 0 = LEVEL −6). KNOWN: a bypassed board's own tapes are unreachable on foot (Cyberpunk /
the Strip / Downtown too) — hq-finds' 1–2-per-site rule keeps them there; filing them in the
entry part is the next thing to do. **LEVEL P3**: the motor pool is `D.U.M.B. · LEVEL P3`
under the garage (P1 the garage, P2 H-Wing's stair, P3 the level the panel never had);
`links.garage_motorpool` (route `bases`) joins the garage's w wall (z −2.5) to the motor
pool's s wall (x −16). **THE LOOPS**: dream ⇄ clone THE SERVICE CORRIDOR (`service`,
`leaf_frosted` wide), war ⇄ bunker THE PRIVATE STAIR (`stair`; the war room's end `y: 3.0`
ON the south gallery). `leaf_frosted_single` is the L5 RANK leaf — never on a room door.
**AREA 51** (data.js, the block before D.U.M.B.'s; `hqAirbaseShell(o)` beside the bunker
shell; looks `hangar` / `white` / `flightline`): `site_prebuilt_area51_hangar` (HANGAR 18:
`halls` round one authored hall, THE RIG up a stair with the `saucer_rig` proc — the near
weenie — THE CATWALK, THE CRANE HOOK 8 m = the tape; doors bay / the floor lift (the tunnel)
/ `white` / `flightline`), `_ward` (THE WHITE ROOMS: `halls` on FINE leaves 5.5–9 m = the
cells; six `wall_padding` procs standing FREE on the plan walls, `foot 0`; THE DECK, THE
CAGE = the tape; `hangar` / `yard`), `_flightline` (OPEN under the base's own night — the
shell copies the EW_MAP_META sky by hand, hq-area51 diffs them; a `rooms` plan with no
thicket, `wallH` 1.6 = the berms between the aprons; RUNWAY 33, THE TOWER + the beacon, THE
MAST = the tape; four `flood_mast` procs — an outdoor TERRAIN room lights ITSELF,
`shell.lights` must be empty (doorhq); `hangar` / `ward`). Every part has two ways out. Tapes:
Gobekli's, Nuketown's and Bermuda's second re-homed; `findSpots` pins the three. `npm test`
runs `hq-area51.test.js`; hq-floor-plan 31 planned, hq-terrain 36 rooms, disaster-city-3
six entries. Ship data.js to Render too. UNSEEN LIVE (RULE #1c): all of it.

## THE DIVINE STAIR, SECOND PASS — THE BOARDS BYPASSED · THE FLOATING PIECES · THE WAY DOWN · THE BASILICA TO SCALE · THE ARCHIVE LIT (2026-09-18, local delivery)
The user: "get rid of the board rooms since each place is its own area; use the map builder's floating
staircase (floating steps) or something similar with cloud platforms; the path to hell should feel like
going down — inclines in the catacombs and the hell areas; the basilica's sizes and scales are off; the
library is too dark". **THE BOARDS BYPASSED**: `siteRooms.entry` rows for `prebuilt_vatican` (→ THE
BASILICA, bay s x 0), `prebuilt_hell` (→ THE PIT, bay s x 0 **`y: 5`** — an entry door may carry `y`, its
sill; the mouth opens ON THE RIM) and `prebuilt_heaven` (→ THE CLOUD FIELDS, bay **n** x 0 `y: 1.75` —
Room 777's hotel door ON THE DAIS: you arrive at the top and every stair goes down to the dome); the
parts' own doors back to the boards are gone; every link that stood on those boards is on a part
(`hollow_hell` / `cave_hell` → the pit's east wall, `heaven_olympus` → the fields' east wall,
`vatican_heaven` = the archive's west wall ⇄ the fields' west wall, `bureau_vatican` → the cortile's east
wall, `vatican_hell.b` → the pit's NORTH wall at `y: 2.5` = THE WARM LEDGE). **THE FLOATING PIECES**: a
`plateau` or a stair `ramp` in a terrain room may wear **`float: true`** (data.js `hqTerrainCompile` →
`info.floats`; the height rule is untouched — the field carries the tier, the walker climbs its low end);
three-renderer.js `_hqBuildTerrain` CUTS THE FIELD AWAY under it (`underFloat`: a platform's flank ring,
a flight's run but its foot and its mouth) and **`_hqBuildFloats`** hangs the piece — a rounded slab in
the cliff sheet with a ring of puffs under a platform's rim (the field's own top stays: the sheet, the
pool, the path), one marble tread (the path sheet) per compiled step of a flight, 10 % apart, a puff
under each = the map builder's floating staircase in the room's own kit. The compiler's frame helpers
`_hqTEllipse` / `_hqTRectIn` / `_hqTRamp` are on `window` for it. THE STAIRWAY: every flight + every
landing but the summit + the stepping clouds + the pinnacle float; THE CLOUD FIELDS: the dais's steps,
the pillar of light, three stepping clouds up to THE LOOKOUT. **THE WAY DOWN**: the catacombs' crypt
stair lands on THE LANDING (3.2 m) → two brick flights down → the galleries; the pit's mouth on THE RIM
(5 m) → three flights down the west side → the floor → THE BOWL; the warm ledge's ramp is the causeway
over the lava river. **THE RAMP RULE AT A DESCENT**: a descending flight's HIGH end starts 0.7 m INSIDE
its tier's rect (0.4 left a trench between the tier's edge blend and the first tread — the solver must be
run from EVERY door, `hq-divine.test.js` climbs back up). **THE BASILICA**: pews 2.6 m (the catalogue),
columns `h: 8.5` per row, windows `h: 5.5, mount: 7`, the cross 5 m, the upright carpet GLB hung as
**`holy_tapestry`** (the same file, a wall row — a GLB that stands upright is a wall row, never laid flat),
ten lights. **THE ARCHIVE**: ambient 0.62, fog 0.011, the wood lighter, `HQ_ROOM_LOOKS.archive` without
the night mood. hq-divine / hq-world / disaster-city-3 / hq-terrain amended. Ship data.js to Render too.
UNSEEN LIVE (RULE #1c): all of it — DOOR_HQ_BUILD_PLAN §9 lists what to eyeball first.

## CAMELOT CASTLE — five parts on Room i, three families, the board bypassed (complex candidate #2, HQ plan 9.3 stage 9) — 2026-09-18, local delivery
Built on THE CAVE / THE WOODS blueprint (EXPLORABLE_AREAS_GUIDE). data.js, the block before AREA 51's; `hqCastleShell(o)`
beside the airbase shell (Camelot's own night off its EW_MAP_META row — hq-camelot.test.js diffs them — a treeline, torchlight,
the `skycastle` landmark; `sky: true` = dawn above the clouds, cloud underfoot, the `islands` roster, Camelot on the horizon
below). **THE OUTER WARD** (`site_prebuilt_camelot_ward`, open, `rooms`): THE MOAT (a `deep_water` stream, never entered),
THE DRAWBRIDGE (a `deck` spanning both banks), THE CURTAIN WALL (four `wall` rows, 5.5 m, `castle_wall`) whose TOPS are
THE PARAPET WALK — two rampart stairs up to wall-height terraces at the south corners, then the top is a floor and a grind
the whole way; THE GATEHOUSE (two plateau towers), THE SWORD IN THE STONE, THE WELL free in the bailey, THE KEEP TOWER (9 m,
the tape) beside the hall door. **THE GREAT HALL** (closed, NO plan — family B): THE ROUND TABLE, THE DAIS + the throne under
the rose window, THE MINSTRELS' GALLERY (3.5) up its stair, THE LOFT (8 m, the tape), the Lodge's door + the keep's stable
door on the west wall. **THE KEEP** (closed, `halls` round the guardroom + the stairhall): THE GREAT STAIR 0 → 4.5 (THE SOLAR)
→ 9 (THE BATTLEMENTS against the north wall — the sky's door stands ON them, `y: 9`, `leaf: null`), THE TOWER TOP (12.5, the
tape). **MERLIN'S UNDERCROFT** (closed, `cave` bricked to the ceiling): the cistern waded, the gaoler's ledge, THE ORB, THE
OSSUARY SHELF (4.2, the tape), the sally port out under the moat. **THE CASTLE IN THE SKY** (open, `rooms`, no thicket): THE
FLOATING PIECES 0 → 3 → 6.5 → 10 m, THE SPIRE (14, the tape), THE SKY BRIDGE = `links.skycastle_stair` (route `divine`,
`leaf_frame_only`) onto the stairway to heaven's west wall. `siteRooms.entry.prebuilt_camelot` → the ward; the four seams
that stood on the board RE-POINTED (`fairy_camelot.b` a free pool on the moat's bank, `haunted_camelot.b` the ward's west
wall, `well_camelot.a` free in the bailey, `camelot_lodge.a` the hall's west wall); `backDoors.prebuilt_camelot` the
gatehouse arch. **RULES**: a terrain `wall`'s top is the HIGHEST ground under it + h — never end a wall inside a plateau's
footprint or on a moat's bank; a door landing never stands on a low `wall` row. Procs `round_table` / `banner` (wall) /
`armour_stand` / `sword_stone`; landmark `skycastle` (the castle builder on a cloud). Looks `camelot` / `greathall` / `keep`
/ `undercroft` / `skycastle`. Five tapes re-homed (the Backrooms', Atlantis's, the Dutchman's, the Spaceship's, the
Looking-Glass's second). `npm test` runs `hq-camelot.test.js`; hq-terrain 41 rooms, hq-floor-plan 35 planned. Ship data.js
to Render too. UNSEEN LIVE (RULE #1c): all of it — DOOR_HQ_BUILD_PLAN §9's entry lists what to eyeball first. Next in the
candidate list: #3 THE TUNNELS / THE DUNGEONS, #6 DOOR MANUFACTURING.

## THE DEEP — THE OPEN SEA · THE ABYSS · THE TEMPLE (complex candidate #8, HQ plan 9.3 stage 11) — 2026-09-18, local delivery
The user's pick after the underworld: "a sea that you can sail, an ocean you can swim in or drive a
submarine in, a whirlpool for the door, the Dutchman connects to the underwater, a swimming
animation". **THE WATER LAYER** (EXPLORABLE_AREAS_GUIDE §5c is the rule): `terrain.sea = { y, key,
under }` on a terrain room (data.js `hqTerrainCompile` → `info.sea`) = ONE surface over the field; the
field is the SEA FLOOR, the ground above `y` is land, the shallows a wade, deeper a SWIM —
`hqTerrainFeet` floats the walker at `y − HQ_TERRAIN_RULES.swimDraft` (1.1; swim → wade is one step
under the climb, so the solver / the trap check / the finds cross the water on their own);
`hqTerrainFluidAt` reports the sea as a pseudo-fluid (`sea: true`; a scatter row under it says `sea:
true`) and is HEIGHT-AWARE now (ground above a sheet is dry — THE ORACLE rises out of its pool);
`under: true` = a DROWNED room (the surface over the ceiling, the feet the ground everywhere, NO climb —
`_hqTClimbLim` — and no fluid: the water is that room's air). A `plateau` out of water blends
`'ground'` (`blend: 'ground'` — or its edge is a 3.5 m cliff at the waterline). `HQ_SEA_RULES` is the
table (merged over the renderer's `HQ_SEA_DEFAULT` — keep the keys in step, hq-deep.test.js diffs
them); `hqSeaShell` / `hqAbyssShell` the shells; `HQ_ROOM_LOOKS.sea / abyss / temple`. **THE RENDERER**
(three-renderer.js "THE DEEP — THE SWIMMER, THE SKIFF, THE BATHYSCAPHE", before the per-frame section;
walker MODES, nothing on the match, nothing relayed — RULE #2): `_hqSwimCheck` at the walker tick's
tail → `_hqTickSwim` (WASD along the camera, SHIFT, C dives, under the surface W swims where you look,
SPACE up / C down, an idle diver drifts up in the open sea, the shallows hand the walker back;
`_hqSwimFree` is the body's collision); the clips = sprites.js `HQ_SWIM_CLIPS` (UAL1 Swim_Fwd_Loop /
Swim_Idle_Loop) baked as `hqSwim` / `hqSwimIdle`, the body pitches with the dive; a catalogue prop with
`vehicle: 'boat' | 'sub'` is registered by the prop placer (`_hq.boats`; `float: true` rides the
surface, `hover` hangs over the floor) and offered by `_hqFindTarget` as kind `vehicle` (E =
`hq.board`; aboard, E = `hq.disembark`) → `_hqTickVehicle` = the helm (W/S, A/D — the camera keeps
the mouse's offset through the turn; the skiff's `_hqHullFree` refuses water under its draft; the
bathyscaphe drives the column, SPACE / C for depth); `_hqSeaWayCheck` enters a whirlpool / an
upwelling by BEING IN ITS MOUTH (`DOOR_HQ.ways` rows `open: true`; the builder returns `mouthY`; the
two builders live INSIDE the `_hqWayBuilders` literal, stub-safe); `_hqSeaArm` / `_hqTickSea` = the
look under the surface (the wet fog on the camera's depth, the dome goes, GOD RAYS, MARINE SNOW,
BUBBLES); the sea's one surface is the battle's animated sheet over the field + the outer ground,
DoubleSide (`_hqBuildTerrain`). Procs: `skiff` (the misc rowboat + a sail), `submarine`, `lighthouse`
(the beam turns), `sea_buoy`, `kelp` (`_hqKelpMat` sways in the vertex shader), `coral_brain` /
`coral_fan` / `coral_tube` / `anemone` / `giant_clam` / `sea_vent` / `fish_school` (forty on one
InstancedMesh) / `temple_dome`; landmarks `waterspout` / `whale`; audio.js `wayWhirl` / `wayUpwell` /
`seaDive` / `seaSurface` / `seaBoard`; map.js `_hqSeaEvent` (the `.hq-hints.swim / .helm` lines, the
toasts); C is a walker key (before E; the pinned `q || p` tail holds); API `hq.board / disembark /
vehicle / vehicles / swimming / diving / sea`. **THE PARTS** (data.js, the block before THE RANCH):
`site_prebuilt_bermuda_sea` (150 × 120: THE CAY + the lighthouse rock (the tape) + THE LOOKOUT + THE
JETTY with the skiff at its end + the sandbar / the wreck islet / the reef + THE MAELSTROM ringed with
four buoys; the board bypassed — `siteRooms.entry.prebuilt_bermuda`; the weir's tide pool re-pointed
onto the cay), `site_prebuilt_atlantis_abyss` (170 × 140, drowned: THE TRENCH, THE DROWNED ROAD, THE
TEMPLE STEPS + the dome, THE STATION + the bathyscaphe (placed FIRST so its lamp keeps under the light
cap), THE SPIRE (the tape — a swim, never hard), the kelp forest, the coral, THE DUTCHMAN BELOW by the
west wall with **`revenge_atlantis.b` RE-POINTED onto that wall** (the id kept), the `upwelling` free
end), `site_prebuilt_atlantis_temple` (36 × 36, closed, family B: THE DAIS, THE ORACLE in its pool (the
tape, the door gun's), the two dry seams `atlantis_hollow` / `atlantis_agartha` on its north wall, the
bay door east — `entry.prebuilt_atlantis`). The whirlpool link `bermuda_abyss` (route `deep`) wears a
DIFFERENT way at each end (`whirlpool` / `upwelling`). `DOOR_HQ.hubs.deep`. TAPES: the bypassed boards'
into their parts + Heaven's board's into the temple (retitled) — hq-finds' rule reads "a bypassed board
may carry none". `npm test` runs `hq-deep.test.js`; amended: hq-terrain (49 rooms), hq-finds,
hq-dutchman, hq-world (the deep line's reach in two halves; the whirlpool in the seams list), hq-ranch
(ten hubs). Ship data.js to Render too. Second pass = MODEL_INDEX §3n. UNSEEN LIVE (RULE #1c): all of
it — the build-plan entry lists what to eyeball first.

RULES the tests taught (the same day): a way / a door whose pad lies under an OPEN sea deeper than a wade has its SILL where the swimmer floats (`hqTerrainDoorY` → the surface less `swimDraft`; the pad itself stays on the sea floor so the spot stays a swim — the whirlpool's frame lifts itself to the surface); a body that FALLS into deep water at speed PLUNGES (a dive at once, `_hqSwimStart`), the rest bob up to the surface; an idle body meets 2.3× the drag and `buoyancy` 2.0 (≈ 0.4 m/s up); a FLOATING body rides over the shallows a quarter past `exitDepth` (`_hqSwimFree`), so the hand-over to the walker is always crossed; `hqTerrainFluidAt` is HEIGHT-AWARE (a deck or a tier above a pool's sheet is dry — read the water BESIDE a plank). `hqFindHardReachTerrain` walks the reachable nodes NEAREST FIRST and stops at the first clear shot (an existence proof; the door gun's 160 m reach made the old every-node scan take 202 s on the sea room — hq-map-remembers' D9 is seconds again).

## THE UNDERWORLD — THE TUNNELS / THE DUNGEONS (complex candidate #3, HQ plan 9.3 stage 10) — 2026-09-18, local delivery
Four parts UNDER Disaster City on Room 1954's site (data.js, the block before THE RANCH; `hqSewerShell(o)` beside the
castle shell; every plate reads `DISASTER CITY · <place>` — disaster-city-3 insists — and THE MAP gathers them as
**`DOOR_HQ.hubs.underworld`**, the first hub that claims rooms BY ID: `hubs[id].rooms = [...]` beats the site rule in
`hqHubOf`, and a hub with only a `rooms` list claims nothing else). **THE SEWERS** (`site_prebuilt_downtown_sewers`,
120 × 84, `halls` with `bsp: false` — the culverts are AUTHORED halls WITH BENDS (a `halls` polyline may bend; the traced
walls follow), a waded `stream` down every culvert's middle with the walkways dry either side (the rule: `hall.w − stream.w
− 2 × bank ≥ the body`; a stream STARTS short of a door's pad or the landing drops in), THE JUNCTION, THE INSPECTION GALLERY
(1.6 up its stair), THE CISTERN (`deep_water`) with THE PLANK (a `deck` spanning both banks), THE PUMP ROOM, THE OUTFALL SHAFT
(4.4 m, the tape)); **THE RUNNING TUNNELS** (`_tunnels`, 124 × 96, `halls`, `bsp: false`: THE LOOP LINE + THE CROSSOVER +
three rooms — THE DEPOT with two `train_car`s (the lit one = the weenie), THE GHOST STATION's 1 m platform, THE CROSSING with
THE SIGNAL GANTRY (5.2 m, the tape); **THE RAILS are twelve `wall` rows at 0.14 m** — under the climb, stepped over,
grindable); **THE HOLDING CELLS** (`_cells`, 64 × 48, `halls`, `bsp: false`, **`minDegree: 1`** = a cell has ONE door: the
corridor hall carries A VERTEX UNDER EVERY CELL so each authored cell takes a straight corridor to the vertex beneath it —
the way to author any row of one-door rooms; the dead-end readout is then the design (the test pins the six cells; a room whose only tree edge is a stub onto a hall inside it reads as one too — the authored halls carry the ways); THE GUARDROOM +
THE CATWALK (2.2) + THE VENT STACK (3.6 m, the tape), THE DRUNK TANK, THE PROPERTY ROOM; `cell_bars` free at the mouths);
**THE OLD WORKINGS** (`_workings`, 60 × 44, `cave` bricked to the ceiling, FLOODED: THE FLOOD waded, THE SUMP never, THE PUMP
LEDGE, THE CHIMNEY (3.9 m, the tape)). The cycle: sewers → tunnels; sewers → cells → workings → sewers. **THE SEAMS**:
Downtown's streets grew `sewer` (THE PUMPING STATION, e z −20, a pair with the sewers' `pump`; its alley a `path`);
`links.strip_sewer` (a `gutter` way free on the Strip's back-lane kerb ⇄ a `leaf_cell` grate — the storm drain's rule),
`sewers_drain` (⇄ the storm drain's SOUTH wall), `tunnels_works` + `tunnels_platform` (the loop ⇄ the Works' `tunnel` room
and Downtown's platform part, both on the WEST walls past the trains — the subway line runs THROUGH the loop now),
`cells_dungeon` (⇄ Room 24601's south wall), `workings_oubliette` (⇄ the oubliette's east wall) — both on the NEW dashed
`routes.dungeons` (never THE UNDERCROFT: hq-cave insists every leg of that line touches Hollow Earth). Tapes: four re-homed
(D.U.M.B.'s, the Lodge's, the Haunted House's, Hollow Earth's second); `findSpots` pins the four. Looks `sewers` / `tunnels`
/ `cells` / `workings`. `npm test` runs `hq-underworld.test.js`; amended: hq-terrain (46 rooms), hq-floor-plan (40 planned),
hq-dumb, hq-ranch (nine hubs), hq-world (the seams list), hq-city (Downtown's complex is ten rooms), hq-finds (the shelf's pair is a board tape + a part tape — no board carries two any more). No renderer change;
ship data.js to Render too. NEXT: THE DEEP (the user's other pick — Atlantis / Agartha / the Dutchman's hold / Bermuda's
weir on the `deep` route); MODEL_INDEX §3m has the underworld's wishlist. UNSEEN LIVE (RULE #1c): all of it — the channels'
sheets in the culverts, the rails at 0.14 m, the bars standing free (`z −14.0` is the edit), the far ends on the platforms.

## THE LEY LINES — THE LINE THE STONES STAND ON (complex candidate #9, HQ plan 9.3 stage 12) — 2026-09-18, local delivery
Family C's THIRD generator, **`terrain.gen.kind: 'ley'`** (data.js `HQ_TERRAIN_GEN.ley`, the branch in `_hqTGenerate`; EXPLORABLE_AREAS_GUIDE
§1 row C'): `gen.lines` = the AUTHORED straight main lines, `gen.chambers` the authored round rooms; the generator adds a chamber at every
crossing (`crossR`), a round ANTECHAMBER behind every door pad (`padR`) and `forks` FORKS that leave a line at a `forkDeg` angle, `forkW`
wide, and run STRAIGHT until they `join` another corridor, hit the `rim`, or run out (`len`) — then one `joinP` turn at the nearest line or a
NICHE (`nicheR`); `reforkP` forks a fork once. The solid is MASS to the ceiling and TRACED like the halls' (every `gen.kind === 'halls'`
hook reads `|| 'ley'`); `minDegree` 0 — **a niche is the design, `genPlan.deadEnds` is always empty; `genPlan.forks / chambers / niches`
is the readout.** THE WALLS LIGHT THEMSELVES: three-renderer.js **`_hqBuildLeyVeins`** (hooked beside the halls' lights) — an amber vein
(the mood's `strip`) along the foot and the lintel of every traced wall on its OPEN face, one breathing material, a glow per chamber /
niche, THE KEYSTONE in every crossing chamber; `EW_HQ_NO_LEY_VEINS`, `HQ_LEY_VEIN_MAX`. **THE PARTS**: `site_prebuilt_gobekli_leylines`
(200 × 150 × 3.2, closed, `hqLeyShell`; THE NEXUS sunk round THE OMPHALOS = the tape) and four ancient sites REBUILT as open `rooms` parts
with `thicket: false` (the banks are the solid — `wallH` is the bank's height) under `hqAncientShell` (the site's own sky by hand):
`site_prebuilt_stonehenge_henge` (the bank + ditch as an open ridge + gully, the sarsen circle + the horseshoe as `wall` rows, THE GREAT
TRILITHON tier = the tape, `trilithon` / `sarsen` GLBs), `_gobekli_tell` (THE TELL a hill, four enclosures `dip … dome: true`, ring walls,
`t_pillar` procs, THE SENTINEL = the tape; the ley's mouth a door PAIR; `well_gobekli` free on its flank), `_giza_plateau` (the pyramid four
stacked `plateau` rects up a four-flight stair 8.2 m per 3.5 m; THE SPHINX's head = the tape; `obelisk`), `_babel_tower` (four tiers up
THE SPIRAL, `babel_crane` on top, THE LOAD = the tape). The four boards are BYPASSED (`siteRooms.entry`); the four `ley` links RE-POINTED
onto the parts with their ids kept (a star: every leg Göbekli's; Technoticlan's end stays on its board); `hubs.ley`. RULES: a stair up a
tier's face wants the ledge ≥ 8 m (L ≥ 2.2 h + 0.5 in + 0.7 in); a hard tape under a low ceiling stands on a tier whose top band the eye
sees from the floor; a tape that must move comes off a BYPASSED board first (Cyberpunk's BILLBOARD → THE SURVEY). `npm test` runs
`hq-leylines.test.js`; amended hq-terrain (54), hq-floor-plan (45, the kind), hq-ranch (11 hubs), disaster-city-3, hq-area51 / hq-city / hq-city-2 / hq-dumb (the re-homed tapes, the source pin), hq-deep (the token). Ship data.js to Render
too (the finds ledger). NOT built: Technoticlan's part, the second-pass assets (MODEL_INDEX §3o). UNSEEN LIVE (RULE #1c): all of it.

## THE AREAS — EVERY BOARD IS AN AREA (Room 64 excepted), THE MARKER, THE DOOR RULE (2026-09-18, local delivery)
The user: "replace all board maps with areas, except for Room 64 (it is purposely a Δ map); the floating crystal icon somewhere in
the center of the main area, or right by a weenie, with the option to battle on the delta map; no unnecessary doors to other
areas — we just spent the time making the worlds / paths that connect them; keep hidden passages and weird doors like draughts
and the telescope." **EVERY BUILT SITE BUT `prebuilt_training` IS BYPASSED** (`DOOR_HQ.siteRooms.entry`, 38 rows): the bay
threshold lands you in a PART. The sites that had a complex keep it (the woods → THE CLEARING, whose `forest` hollow tree IS the
bay door — an entry door row may carry `way` + `leaf: null`); the twenty that were a board room alone got ONE generated AREA each:
data.js **`HQ_AREA_SPECS[mapId]`** (the block right before the built loop; `part`, size, sheets, `gen`, features, props, natives,
lines, `plaza` / `marker`, `look`, `landmarks`) → **`hqAreaRoom(mapId, spec)`** (a terrain box room on THE COMPLEX BLUEPRINT: a
`rooms` / `cave` / `halls` plan, the site's own EW_MAP_META sky through `hqAreaSky` + a fog per metre, a grade, THE PARK RULE, a
weenie plateau with the hard tape pinned on it in `findSpots`, a `path` from the bay pad to THE PLAZA — never hand-edit the
generated `site_<id>_<part>`; edit the spec) → **`hqBuildAreas()`** (runs before `hqApplySiteEntries`; a room authored by hand under
the same id wins). The parts: levels · bowl · templecity · crystalcity · station · slopes · summit · cydonia · mare · grove ·
village · plain · garden · halls · horizon · hexagon · grounds (the Haunted House's, the hall's `front` door lands on its `house`
door) · innersun · deck (the Spaceship's, its `airlock` door) · deck (the Dutchman's, its `companionway`). **THE MARKER**: every
entry part carries ONE counter `battle` (`proc: 'battle_marker'`, `site`, `overlay: 'crossing'` — the same terminal the board's
console opened; post-match returns you to it) at the area's plaza or a weenie's foot; the older parts read **`HQ_AREA_MARKERS`**
(measured reachable nodes — hq-areas' tool); **`hqAreaMarker(roomId)`** is the ONE read, `hqAreaRoomOf(mapId)` the entry part. The
renderer needed nothing: a box room's counter stands on `_hqCaveTop` (the field's ground). **THE DOOR RULE**: a PLAIN-leaf door
between two sites (`hqLinkPlain`) is gone unless **`HQ_AREA_KEPT_LEAVES`** names it with its reason (a docked collar, a tunnel that
IS the route — the bases, the ley line, the subway, the highway roads — a site's only line, a facility door); PRUNED: `mars_moon`
(Mars is the collar's FOURTH course, `mars_derelict`), `vatican_heaven`, `hollow_hell`, `atlantis_hollow`, `atlantis_agartha`,
`shasta_agartha`, `antarctica_agartha`, `antarctica_northpole`. **A DRAUGHT** = `secret: true` on a links row — `hqLinkDoors` wears
a hidden door at both ends (`leaf: null`, label A DRAUGHT; the renderer's wall slab; the map shows it once both rooms are seen):
`vatican_hell` (the crypt's warm wall — "no door to hell in the Vatican") and `cern_backrooms` (NOT ON THE PLAN). Every link that
stood on a bypassed board was RE-POINTED onto its area (ids kept). **THE TAPES**: no bypassed board keeps a tape — every board's
row of `HQ_TAPE_SHEET` moved into its entry part (merged onto the part's row where one existed; the hundred stays a hundred; the
ids changed with the rows — a prototype's claims, nobody's progress). **THE GRAPH**: `hqWorldGraph` sends a door into a bypassed
board to the part (`hqSiteEntry`), so THE MAP, the directory guard and every reach test walk where the walker lands; the board
rooms are still generated (the threshold's number, the Δ under the marker) but nobody stands in them. `npm test` runs
`hq-areas.test.js` (the bypass, the marker on reachable ground (heavy), the door rule, the tapes, the stations). Ship data.js to
R2 AND Render (the finds ledger). UNSEEN LIVE (RULE #1c): all twenty areas — DOOR_HQ_BUILD_PLAN §9 lists what to eyeball first.

## THE ASTRAL REALM — THE WAITING ROOM · THE SEA OF POSSIBILITY · THE NIGHTMARE · THE LIBRARY OF UNTHOUGHT THINGS (complex candidate #10, HQ plan 9.3 stage 13) — 2026-09-19, local delivery
The user: "the realm of all possibilities, the home of thought-forms, where ideas exist before they are thought by human minds;
creativity is instantaneous, just like your dreams — but that means nightmares as well; bizarre and nightmare fuel mixed with the
beautiful and fantastical; it can connect the Dream Research, the Looking Glass, the Haunted House". Four parts on ROOM E4's site
(data.js, the block before THE RANCH; `site: 'prebuilt_lookingglass'` + `part`, no `roomNo`, every plate `THE ASTRAL REALM · <place>`;
shells `hqAstralShell` / `hqNightmareShell` / `hqUnthoughtShell` beside the deep's; looks `HQ_ROOM_LOOKS.astral / waiting / nightmare /
unthought`), THREE FAMILIES with the hand-offs at real doors: **THE WAITING ROOM** (`site_prebuilt_lookingglass_waiting`, family B — a
prefab box: seven chairs facing the wall, three clocks that disagree, NOW SERVING with your own number, one thought-form nobody has
called), **THE SEA OF POSSIBILITY** (`_sea`, 150 × 120, OPEN under its own violet night — stars 1.3 / nebula 1.8, the `islands` roster —
on a `rooms` plan with no thicket whose banks are `crystal`; THE STREAM waded, THE POOL OF IDEAS in a colonnade, THE MIRROR LAKE never
entered, THREE FLOATING THOUGHTS 3 → 6 → 9 m up `float: true` stairs, THE SPIRE OF THE UNTHOUGHT 7.5 m = the tape; the hub's anchor),
**THE NIGHTMARE** (`_nightmare`, 100 × 76 × 6.5, closed, a `cave` plan in the FLESH sheets: THE LONG HALL, THE MAW ringed with seven fangs
round THE BED, THE STAGE, THE BLOOD (lava), THE SINKHOLE, THE SPINE 4.6 m = the tape) and **THE LIBRARY OF UNTHOUGHT THINGS** (`_library`,
140 × 100 × 4.6, closed, a `ley` plan with `wallKey: 'wood'` — the stacks fork and end in nooks and light themselves; THE READING ROOM,
THE GALLERY, THE TOP SHELF 3.4 m = the tape). **THE SEAMS = THREE SCREENS** on `routes.astral` (dashed, `#d8b4ff`; the rev 22 `screen`
way at every end, no new kind): `rem_astral` (Room REM's north wall ⇄ the waiting room — a facility end, never gated), `dumb_astral`
(the D.U.M.B. ward's north wall ⇄ the library), `attic_nightmare` (the attic's west wall ⇄ the nightmare; the Haunted House is a
four-line interchange now). The garden ⇄ the waiting room is a DOOR PAIR (the same site; `HQ_AREA_SPECS.prebuilt_lookingglass.doors`
— a spec may carry doors). THE CLOSET WITH NO BACK WALL joins the sea and the nightmare from both sides (`way: 'closet'` on a door
row). `hubs.astral` claims the four parts BY ID. **THE RENDERER** (three-renderer.js "THE ASTRAL REALM — THE THOUGHT-FORMS", before the
per-frame section): four procs on tickers — `thoughtform` (its vertices breathe; a light), `dream_eye` (`_hqAstralEye`, the shared
ball-iris-lids helper: it TRACKS `_hq.player`'s head and blinks), `impossible_stair` (four flights, the fourth stepping down into the
first, turning on a cloud), `nightmare_bloom` (bone cones opening and closing; a light) — and landmark `eye` (THE WATCHER on the sea's
horizon). RULES the tests taught: an open room's shell `h` is still the ceiling doorhq's prop rule reads (the telescope at 9 m wants
`h` 14); a wall prop's `mount + h` clears the shell's `h`; a `rooms` plan's crystal banks cut rescue ramps where the jump reaches a
bank top (nine on the sea — `info.rescues`). Tapes: four re-homed (Camelot's ward, Hell's pit, CERN's ring, the basilica — each keeps
its board's own; the hundred stays a hundred). `npm test` runs `hq-astral.test.js`; amended hq-terrain (77), hq-floor-plan (68),
hq-ranch (12 hubs), hq-world (the seams + the house's lines), doorhq (the light regex). Ship data.js to Render too (the finds ledger).
UNSEEN LIVE (RULE #1c): all of it — DOOR_HQ_BUILD_PLAN §9's entry lists what to eyeball first.

## AREA CONTENT PLAN D1 — THE CLIMB + THE TEACHING ROOMS + THE RULES AS WARNINGS (2026-09-19, local delivery)
**`AREA_CONTENT_PLAN.md` is THE doc for filling the rooms with purpose** (the user's brief: too boxy, more climbing, doors
too exposed, discovery should reward, bigger cities); its §6 records the user's decisions (the cave's numbers, D2 before D3,
six looks, warnings until D3, prefab parts exempt from R1) and EXPLORABLE_AREAS_GUIDE §9b carries the rules R1–R9. **THE
CLIMB**: a `terrain.features` row `{ k: 'climb', x, z, y0?, y1?, face, look: ladder|rope|vine|chain|pipe|wall }` (a plain box
room: `room.climbs`, the head on a blocker top) — data.js `hqTerrainClimbs` → `info.climbs` (the head spot found PAST the
tier's edge blend), `hqTerrainClimbEdges` = THE SOLVER'S EDGE read by every walk (`hqTerrainReach`, `_hqTReachGrid`,
`_hqTReachJump`, `_hqTReturnJump`) so a ladder alone may reach a tier, a pit with a ladder out is no trap (no rescue ramp),
a tape above one is not hard; a plan keeps a climb's foot + head open; the scatter stays off them;
`HQ_TERRAIN_RULES.climbReach / climbSpeed / climbMount`. three-renderer.js "THE CLIMB" (before the per-frame section):
`_hqBuildClimbs` (the six looks; called after the props), `_hqClimbCheck` at the walker tick's tail (the foot walked INTO
/ the head walked OFF = the mount; the rider steps off the deck, the swimmer never climbs), `_hqTickClimb` (W / S, SPACE
lets go, the top MANTLES with UAL2 ClimbUp_1m), `EW_HQ_NO_CLIMB`, `hq.climbs()` / `hq.climbing()`. sprites.js
`HQ_CLIMB_CLIPS` — NO ladder loop exists in either library: the climb is the swim stroke stood up (`_hqTickChars` lean
−1.3). map.js `onClimb` → `.hq-hints.climbnear` (W CLIMB) / `.climb`. A walker mode: nothing on `state`, nothing relayed.
**THE TEACHING ROOMS (R9, hard)**: `HQ_WALK_LESSONS` (climb / skate / swim; `hqWalkLessons()`; the `lesson_plaque` proc
reads both tables) — THE GARAGE is 5.4 m high now with THE DOCK OFFICE (a `stair_landing` platform + `garage.climbs`, the
building's first ladder), Room 26 the skate plaque, the natatorium the swim plaque. **THE AUDIT**: `node
check-area-content.js [--rules] [--all] [room…]` (a module — `audit()`, `RULES`) measures R1–R8 (R2 the pull on the reach
graph, R3 door exposure by eye-height LOS, R4 the earned exits, R5 the tease, R6 `parti` / `typology` — an `HQ_AREA_SPECS`
row's ride to the room —, R8 per 60 m² of OPEN floor); `area-content.test.js` prints the offenders as WARNINGS (heavy) and
never reds until D3. `npm test` runs `hq-climb.test.js`. Next: D2 (the cities twice the size, `districts` on the `city`
plan, fire escapes as `climb` chains onto rooftop `deck` runs), then D3 / D4 / D5. Ship data.js to Render too. UNSEEN LIVE
(RULE #1c): the ladder, the stood-up stroke, the mantle, the DOCK OFFICE, the plates.

## AREA CONTENT PLAN D2 — DISASTER CITY + THE GRID, TWICE THE SIZE (THE DISTRICTS) — 2026-09-19, local delivery
`AREA_CONTENT_PLAN.md` §7 has the log, EXPLORABLE_AREAS_GUIDE §4b the rule. **THE DISTRICTS**: a `city` plan may carry
`gen.districts = [{ id, label, rect: [x0, z0, x1, z1], lotW, lotD, lotMinW, lowP, storeys, texP, ruinP, style, fronts, neon,
fenceKey, fenceH }]` (data.js `_hqTGenerate`'s lot pass): the district is read PER LOT at the run's position along a face,
every lot row carries its district's look (`district` · `neon` · `texP` · `ruinP` · `style` · `fronts`), the fronts inherit
it, a yard wall wears its district's fence, `info.districts` counts the lots per district; three-renderer.js `_hqTexPlan` /
`_hqBuildCityLots` read the LOT before the plan (`lotNeonOf`, a second `_hqTexBatch` for a flipped neon flag, `lot.style`
when the storeys allow it, `var store = (lot.fronts || gen.fronts) === 'store'` per front). **THE CUT**: `plateau.sink:
true` = a SUNK tier (THE UNDERCITY, −4) the walker drops into and never climbs at the wall; a plan never forces it open.
**THE GANGWAY**: `deck.gangway: true` = the forced band is the deck's OWN width (a deck between two roofs across a YARD —
never across a street: the height field holds one height per point; an overpass over a walked street is a later layer
mechanic). **THE FIRE ESCAPE**: `climb.look: 'fireescape'` (three-renderer.js `_hqBuildClimbs`: a steel ladder + a grated
landing cage) chained through a LANDING plateau (1.6 × 2.2, half the height) against a roof's flank in an ALLEY (a `path` —
no lots on a path; the roof stands ≥ 3.9 m behind the street's lots). RULES the solver taught: a `rail` on a roof stands
≥ 1.6 m inside its edge, one per roof (its 2.8 m forced band on the mass = a pocket); a canal the walker never enters is
`deep_water` with a 0.55 m bed (a deep bed leaves a dry ledge at the bank's foot = a rescue scar); lots backing onto a
canal need ≥ 5.5 m of mass to the bank. **THE ROOMS**: `site_prebuilt_downtown_streets` 224 × 176 (financial · oldtown ·
docks: the old town's high street / squares / church / THE WAREHOUSE ROOF, the docks' waterfront / THE CANAL under four
bridges / THE QUAY / THE BASIN + THE CONTAINER ROOF (the second tape, the gun's) / THE FLOODED QUAY + `links.docks_sewer`),
`site_prebuilt_cyberpunk_streets` 208 × 168 (neon · stacks · undercity: seven roofs, four fire escapes, three gangways;
THE CUT with THE RAMP ROAD, THE STEPS, THE DRAINS, THE OVERLOOK, the bay door down there, `links.undercity_sewer`), the
Strip at its size + two rooftops; every pinned core coordinate untouched; `parti` / `typology` on all three. **THE AUDIT**:
`RULES.R7.districts` 3; a road out is never earned; a tier is judged against the MEDIAN sill. R1 is not met by either city
(the number was set from 1 500 m² caves — the user's call in AREA_CONTENT_PLAN §6). `npm test` runs
`hq-city-districts.test.js`. Ship data.js to Render too. UNSEEN LIVE (RULE #1c): all of it.

## AREA CONTENT PLAN D2b — THE BRIDGE LAYER (stacked walkable surfaces in a terrain room) — 2026-09-19, local delivery
The user: "why is that limit there … of course we need stacked walkable areas like bridges … why can't we just use 3D
objects as bridges?" THE LIMIT was one structure: the terrain field `info.H` holds one height per (x, z), a `deck` was
WRITTEN INTO it (a deck over a walked street deleted the street) and every solver keyed a node by cell alone. (A 3D object
always walked — a prop's top is a floor, the stairwell's stacked blockers — but the solvers could not see it, so nothing could
prove a route across it.) Now a **`bridge`** feature row (`{ k: 'bridge', x0, z0, x1, z1, w, y, thick?, rails?, key? }`, or a
`deck` wearing `over: true`) is a SECOND SURFACE the field never carries: data.js `hqTerrainBridges` → `info.bridges` (each
with its `layer`); **`hqTerrainFeet` returns its top for feet that ARRIVE within a climb of it** (`hqTerrainBridgeFor` — the
wall rule generalised; a fall lands on the first slab under it; a FREE query is the ground's), the ground under it stays
walked while the slab leaves `HQ_TERRAIN_RULES.headroom` (1.95 m; a lower slab is a wall to the body beneath — never a
clip), `hqTerrainAir` / `hqTerrainCam` hold the slab solid (`hqTerrainInBridgeSlab`), and EVERY solver keys a node by cell +
layer × (nx·nz) (`_hqTNodeFeet` = the candidates at a cell — the step's surface, the jump's cliff top, every bridge the jump
reaches from below — used by `_hqTReachGrid` / `_hqTReachJump` / `_hqTReturnJump` / `hqTerrainReach` (string keys `i,j` /
`i,j,L`; `hqTerrainNodeKey(info, x, z, y)` names a layer when given a y) / `_hqTTraps` (components over CELLS)). Bridges
STACK (`hqTerrainLayerAt`). A plan forces only a bridge's two MOUTHS (a short run 0.9–1.6 m INSIDE each tier at 0.7 × the
width — the raster's round cap must stay inside the tier, or the ground beside it opens and traps). RULES: a bridge is LEVEL
(a slope is a `ramp` on the field); its ends stand 0.7 m inside the tiers it joins at their height; never run one over a car
ramp that rises to within the headroom of its slab; over water the walker never enters a `deck` is still right. Renderer:
three-renderer.js **`_hqBuildBridges`** (from `_hqBuildTerrain`: the slab — the path sheet on top, the cliff sheet on the
sides — a box girder, kerb lips, steel rails = grind rails on `_hq.rails` (`bridge: true`), PIERS every ~7 m where the ground
lies ≥ 1.5 m below and no traffic route runs, each a blocker with no top); the door gun's `_hqPortalSurf` lands the ray on a
deck (`hqTerrainBridgeBelow`) and `_hqPortalLedgeSnap` puts a floor door on one. `check-terrain.js` prints `bridges n` and
the dump draws a span as `B`. THE TWO: Downtown's **THE OVERPASS** (the parking deck west over THE AVENUE at 3 m to THE WEST
LANDING + THE OVERPASS STAIR off the ring road) and the Grid's **THE OVERLOOK SPAN** (the overlook south over THE CUT and THE
LOWER CROSS to THE PIER, down a 7 m fire escape). `npm test` runs `hq-bridge-layer.test.js`. NOT built: a door ON a bridge,
props on a bridge, the full second floor (EXPLORABLE_AREAS_GUIDE §5 item 3 — this is its pattern). Pre-existing on main
before this delivery, not touched: hq-climb's six-looks pin (D2 added `fireescape`) and hq-terrain's "fountain stands in the
water" on Downtown. Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): the slab from below, the piers, the rails, the
headroom under a truck, the fire escape's 7 m against the pier.

## AREA CONTENT PLAN D3, FIRST DELIVERY — SHASTA · THE NORTH POLE · OLYMPUS TO THE CAVE'S STANDARD (2026-09-19, local delivery)
Three of the six areas the user sees first (`AREA_CONTENT_PLAN.md` §5 D3; §7 has the log), re-specced in data.js `HQ_AREA_SPECS`
(`prebuilt_shasta` / `prebuilt_olympus` / `prebuilt_northpole` — never hand-edit the generated `site_<id>_<part>`; the spec is the
edit) and measured clean on ALL of R1–R8 by `node check-area-content.js --rules <room>` (0.73 climb rows per 100 m², 5–6 kinds,
ranges 7–10 m, at most one door exposed, 2 of 3 exits earned on Shasta and Olympus (the village's is the hearth), every one teased, a `parti` + `typology`, ≥ 1 item per 60 m²). THE
PATTERN for the seventeen still to do: every tier reached TWO ways (a stair AND a rope / a trail AND the hand-holds), a `climb`
row per tier where it fits the place, the seam's door ON a tier (`y` on the link END — `hqLinkDoors` copies it: `woods_shasta.b`
4.4, `heaven_olympus.b` 3.0 on the west wall, `northpole_camelot.a` 2.2, `northpole_haunted.a` 1.0 on the west wall), a DRAUGHT
where the lore has a hidden way (`links.shasta_lemuria`, `secret: true` — THE SLOPES' west wall ⇄ THE CRYSTAL CITY's north wall;
the pruned plain door `shasta_agartha` stays pruned, hq-areas pins it), the tape's weenie seen from the tier under it, a `deck`
wearing `over: true` for a level span between two tiers (Olympus's cloud bridge), `float: true` stepping stones, 40–50 items a
room (`grove` regions + `scatter` rows + props). **RULES THE COMPILER TAUGHT**: (1) a `climb`'s line stands ≤ 0.3 m OFF its mass —
`hqTerrainClimbs` scans the head from `climbMount` (0.3) in and breaks on the FIRST flat step, so a rope 0.6 m short of a rim reads
a flat head and is DROPPED (rise < 0.9) — silently in the vm sandbox: read `hqTerrainInfo(id).climbs` after authoring, never trust
the row count; (2) a climb's foot stands OFF its tier (a hand-holds row on the tier's own top is 3.6 → 3.6, dropped); (3) a lava
/ deep pool the walker never enters takes a SHALLOW bed (0.55) AND clear ground round its bank — a dry pocket between the sheet
and a plan's cloud bank is a trap the compiler cuts a rescue ramp out of; `gen.open: [{ x, z, r }]` on the spec's plan clears it.
`hq-climb.test.js`'s looks pin reads seven (D2's `fireescape`). Ship data.js to R2 AND Render. Unseen live (RULE #1c): all of it.

## AREA CONTENT PLAN D3, SECOND DELIVERY — THE BOWL · THE GROUNDS · THE DECK to the cave's standard (2026-09-19, local delivery)
The other three of the six areas the user sees first (`AREA_CONTENT_PLAN.md` §5 D3; §7 has the log and the numbers), re-specced in
data.js `HQ_AREA_SPECS` (`prebuilt_stadium` / `prebuilt_haunted` / `prebuilt_derelict` — the spec is the edit, never the generated
`site_<id>_<part>`) and measured clean on R1–R8 by `node check-area-content.js --rules <room>`, solved by `node check-terrain.js`
(every door from every door, no trap, no rescue ramp). **THE BOWL**: the bay door stands ON THE CONCOURSE (the south stand, 3.4 —
`siteRooms.entry.prebuilt_stadium.door.y`, Hell's-pit precedent: an entry door may carry `y`), THE PRESS BOX moved onto the north
stand (the `findSpots` pin moved with it), three GANTRIES (`deck` + `over: true`) join the stands at the corners, THE SERVICE ROAD (a
`path` ring + `gen.open` corner circles) keeps the ground behind the stands from being a pocket, and THE PITCH DRAIN =
`links.stadium_sewers` (`secret: true`, route `sewers`, the sewers' east wall z 14) is the earned exit — a draught still names a
catalogued `leaf` (`hqLinkLive`'s wear rule) or it is held. **THE GROUNDS**: the porch at 1.6 (the `house` door ON it), the crypt a
block, the coach house, the treehouse, the terrace, the footbridge. **THE DECK** (62 × 50): the airlock ON A TOWER (3.2), the sensor
mast, the engine bell, THE GANGWAY over the breach, and **THE CARGO HATCH** — a plain door pair wearing `secret: true` between the
deck's east wall and the hold's west wall (hq-floors.test.js counts TEN secret doors now — a pair is two). **THREE RULES FOR THE FOURTEEN AREAS STILL
TO DO**: (1) **a climb's LINE stands 0.3 m INSIDE the tier's nominal edge** — the face rises from the edge inward over ~0.5 m and
`hqTerrainClimbs`' head scan (from `climbMount` in) breaks on the first flat step, so a line 0.6 m outside a rect's edge is DROPPED
without a red (fifteen of twenty were); read `hqTerrainInfo(id).climbs` / the audit's `climbs` column, never the row count; (2) on a
TWO-door room the audit's median sill is the HIGHER one, so a tier door is never earned there — the third door (a draught) is what
makes the concourse and the airlock count; (3) a stair needs L ≥ 2.2 × h (the west / east stands' were too steep). Ship data.js to R2
AND Render. UNSEEN LIVE (RULE #1c): the concourse arrival and the drop to the pitch, the gantries from below, the raised porch's
steps, the tower's stair against the bulkhead leaf, the two draughts' slabs, every prop on a tier (`y` is the edit).

## THE Δ AREA PASS — every site Δ is a cut of its entry part + THE AREA BOARDS (a Δ per explorable part) — 2026-09-19, local delivery
The user: "revise the delta maps to look more like their corresponding explorable areas, then make delta maps for the
explorable areas that don't have delta maps yet". **The 38 site Δs** (data.js DELTA FORGE `_MF_DELTA_BUILDERS`) are cuts of
their ENTRY PART (`siteRooms.entry` → the room the bay door lands in): the part's sheets as board keys, its features in the
forge's vocabulary (plateau = step / block, stream = a wade, deep pool = deep water, deck = a `bridge` tile, wall row = a thin
wall, the weenie = the +3 block / the monument), its props as torches / greytubes / cargo; the desc names the part. Reread the
room's spec before retuning a board. **THE AREA BOARDS**: `_MF_AREA_DELTA_BUILDERS[roomId]` (the block after the site boards)
= 56 Δs, one per complex part that is not an entry part; `_mfRegisterAreaDeltas()` (after `hqReplateDoors()`) files each as
`PREBUILT_MAPS[<roomId>_delta]` + a layout + an EW_MAP_META row wearing **`area: roomId` + `site`** (`_mfAreaDeltaEnv`: the
site's Δ env minus `near` / `motion`; a CLOSED part indoors — `world.kind 'room'`, no stars / nebula / roster; an OPEN part
under its site's sky, `world.sea` dropped; the room's `look` as `env.look`). Reads: **`hqAreaDeltaId(roomId)`** (the part's
board or null — the ONE read), `hqSiteId('<roomId>_delta')` → the room's SITE (the pool, the checklist, the stamp, the site
file), `hqEncounterLaunch(...).launchId` / `.area` → map.js `_hqEncounterStart` fights the part's own board and `_hqEncounterFire`
rasterises no field window for a room that has one (the copy: THE ROOM’S OWN BOARD). The FULL terminal lists them as Δ cards;
ranked never deals them (check-data-parity skips `area` rows; server.js MAP_POOL untouched). RULES: adding a part = a builder
keyed by its room id, nothing else; delta-maps.test.js runs every house rule on all 96 boards and FAILS when a non-entry part
has no Δ; the site count stays 38. Ship data.js to R2 AND Render. Unseen live (RULE #1c): every board — the `urban:` sheets
became the nearest board key, a closed part's Δ stands alone under a dark ceiling (§10 stage 4 draws the room round a FIELD
only), the cloud-bed boards, the `bridge` decks.

## AREA CONTENT PLAN D3, THIRD DELIVERY — THE TEMPLE CITY · THE CRYSTAL CITY · THE STATION to the cave's standard (2026-09-19, local delivery)
The first three of the remaining fourteen areas (`AREA_CONTENT_PLAN.md` §5 D3; §7 has the log and the numbers), re-specced in data.js
`HQ_AREA_SPECS` (`prebuilt_technoticlan` / `prebuilt_agartha` / `prebuilt_antarctica` — the spec is the edit, never the generated
`site_<id>_<part>`) and measured clean on R1–R8 by `node check-area-content.js --rules <room>`, solved by `node check-terrain.js` (every door from
every door, no trap, no rescue ramp). **THE TEMPLE CITY**: THE PYRAMID's back stands AGAINST the north wall (the strip behind it was a pocket),
THE OTHER STAIR up its west flank, THE AQUEDUCT = a `deck` wearing `over: true` from THE PRIEST HOUSE to THE MARKET TERRACE over the waded canal,
THE LEY TERRACE with `babel_technoticlan.b` ON it (`y: 2.0`; x −5 kept — hq-leylines pins it), XIBALBA = a draught. **THE CRYSTAL CITY**: THE
GALLERY span from THE UPPER TERRACE (3.6 now — a slab needs 1.95 m of headroom over the lower terrace or it is a wall to the body beneath) to THE
BALCONY, THE ADIT TERRACE with `cave_agartha.b` ON it (`y: 2.4`), THREE DRAUGHTS come out here on the NEW dashed **`routes.hollow` · THE INNER
EARTH** (`antarctica_polar` + `technoticlan_agartha` — new ids; the pruned plain doors stay pruned, hq-areas pins them). **THE STATION**: THE HULL
(3.0) on the north wall with the collar ON it (`antarctica_derelict.a` `y: 3.0`), THE ICE SHELF, THE DRILL RIG, the crevasse's bed 0.55 m (the
canal rule), the polar draught. **THE RULE**: a `climb` row's **`face` is the direction TOWARD THE MASS** (`hqTerrainClimbs`: face 0 = the tier is
north of the line, 180 south, 90 east, 270 west); the first draft had every north / south face inverted — read `hqTerrainInfo(id).climbs` back
against the rows. Two pockets joined with `path` rows, never rescue ramps. hq-cave.test.js's far-lane crowding compares north-wall doors only (a
side-wall draught has no `x`). Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): all of it — DOOR_HQ_BUILD_PLAN §9's entry lists what to
eyeball first. NEXT: Mars, the Moon, the Grove.

## AREA CONTENT PLAN D3, FOURTH DELIVERY — CYDONIA · THE MARE · THE GROVE to the cave's standard (2026-09-19, local delivery)
Three more of the fourteen (`AREA_CONTENT_PLAN.md` §5 D3; §7 has the log and the numbers), re-specced in data.js `HQ_AREA_SPECS`
(`prebuilt_mars` / `prebuilt_moon` / `prebuilt_bohemian_grove` — the spec is the edit, never the generated `site_<id>_<part>`) and measured
clean on R1–R8 by `node check-area-content.js --rules <room>`, solved by `node check-terrain.js` (every door from every door, no trap, no rescue
ramp). **CYDONIA**: two mesas joined by THE ARCH (a `bridge` over the canyon floor, the plaza under it), the pyramid's two tiers, the collar ON
the rover bay's mesa (`mars_derelict.a` `y: 2.6`), the Face moved over the west crater (the pin moved), and **THE FACE'S MOUTH** =
`links.cydonia_mare` (`secret: true`, route `lunar`) ⇄ **THE FAR SIDE** in the Mare's west wall (the pruned `mars_moon` stays pruned; a
draught wears a new id). **THE MARE**: the collar ON the terrace (`moon_derelict.a` `y: 2.4`), THE CATWALK (a `bridge`) to the antenna platform
under the rim's tape (the tease), the lander's pad, the habitat's shelf, the dish, the overlook. **THE GROVE**: the owl's gate ON THE WEST
TERRACE (`woods_grove.a` `y: 2.2`), the treehouse, the log over the creek, the dock, the camp, and **THE MEMBERS' TUNNEL** =
`links.grove_lodge` (`secret: true`, route `ranch`) into the Lodge's east wall; four redwoods screen the terrace's sightlines (R3). **THE RULE
THE SOLVER TAUGHT**: the strip between a tier's cliff and a plan's rock bank is a pocket (a rescue ramp was cut on Cydonia until `gen.open`
forced the plan open along the mesa's north face) — read `RETURN:` on every room. The suites were not run at the user's word (`npm run
test:quick` passed; the two tools solved and audited the three rooms). Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): all of it — the
arch and the catwalk from below, the collars on their tiers, the four redwoods on the terrace's sightlines, the tents' light.

## AREA CONTENT PLAN D3, FIFTH DELIVERY — THE GARDEN · THE HALLS · THE HORIZON to the cave's standard (2026-09-19, local delivery)
Three more of the fourteen (`AREA_CONTENT_PLAN.md` §5 D3; §7 has the log and the numbers), re-specced in data.js `HQ_AREA_SPECS`
(`prebuilt_lookingglass` / `prebuilt_lodge` / `prebuilt_singularity` — the spec is the edit, never the generated `site_<id>_<part>`) and measured
clean on R1–R8 by `node check-area-content.js --rules <room>`, solved by `node check-terrain.js` (every door from every door, no trap, no rescue
ramp). **THE GARDEN**: the two towers joined by THE HEDGE WALK (a `bridge`), the moon's perch seen from the bishop's landing, the mirror and the dead
tree under the tiers. **THE HALLS** (h 5.0): two galleries over the round table joined by THE MINSTRELS' WALK, THE HIGH TABLE (3.9) between them out
of a jump's reach (the tape pin moved to (0, −15)), THE SCREEN across the sanctum's mouth, the mezzanine over the bar that sees the painting, THE
WINE CELLAR; `grove_lodge.b` → `e z 14`. **THE HORIZON**: THE DROP is a real 4 m bowl, the two lenses joined by THE LENSING ARC, THE JET a `float`
shard, the screen ON THE OBSERVATORY LEDGE (`observatorium_singularity.b` `x 14, y 2.4`). **TWO RULES**: (1) a `dip`'s `h` is its DEPTH — positive
(the old Singularity drop `h: -4` was a mound); (2) a climb's `face` is the direction toward the mass in the room's AXES (0 = −z, 180 = +z, 90 =
+x, 270 = −x) — read `hqTerrainInfo(id).climbs` back. Remaining in D3: Saturn, Hollow Earth, the Dutchman's deck (the Flatlands and the Backrooms
are skipped at the user's word). Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): all of it.

## AREA CONTENT PLAN D3, SIXTH DELIVERY — THE HEXAGON · THE INNER SUN · THE MAIN DECK to the cave's standard; D3 COMPLETE (2026-09-19, local delivery)
The last three areas (`AREA_CONTENT_PLAN.md` §5 D3; §7 has the log and the numbers), re-specced in data.js `HQ_AREA_SPECS` (`prebuilt_saturn` /
`prebuilt_hollow_earth` / `prebuilt_revenge` — the spec is the edit, never the generated `site_<id>_<part>`) and measured clean on R1–R8 by `node
check-area-content.js --rules <room>`, solved by `node check-terrain.js` (every door from every door, no trap, no rescue ramp). **THE HEXAGON**: THE
EYE a real bowl, the collar ON THE DOCKING SHELF (`derelict_saturn.b` `y: 2.4`), the drop's frame ON THE RIM WALK on the WEST wall
(`saturn_singularity.a` → `w z −14 y 4.2`), THE RING PLANE span, THE EYE WALL (the hexagon's north segment at 4 m) + THE OUTER TOOTH on the
sightlines. **THE INNER SUN**: the spire r 3.9 on a terrace moved to (0, −13) (the pin moved), the mouth ON THE CRUST LEDGE (`cave_hollow.b`
`y: 2.2`), THE ROOT span, THE GIANT'S STEPS up to THE OVERHANG, and **THE POLAR OPENING** = `links.hollow_byrd` (`secret: true`, route `hollow`) ⇄
the station's east wall (its EAST PRESSURE RIDGE is 2.2 m now). **THE MAIN DECK**: 64 × 52 (R7), THE POOP over THE QUARTERDECK with **THE
CAPTAIN'S SKYLIGHT** — a secret door PAIR `skylight` (the deck's west wall `y: 4.4` ⇄ the cabin's south wall; hq-floors counts TWELVE secret doors,
hq-dutchman reads the pair), THE MIZZEN column, THE GANGWAY span to THE BOAT DECK, THE CROSSTREES under THE MAINTOP. **THE RULES**: (1) the
audit's R3 line of sight reads the height field, `wall` rows, the plan's solid and `tree` / `grove` rows — NEVER props; break a sightline with a
wall, a tree row, a mast column or a cliff; (2) read every pocket off `hqTerrainInfo(id).rescues` (x / z / cells) and kill it with a `gen.open`
circle or a `path` to the floor — stop at zero rescue ramps; (3) a floating stone's column is a wall in the field: open the ground round a
stepping-stone chain. The Flatlands and the Backrooms are skipped at the user's word; the slow suites were not run. Ship data.js to R2 AND Render.
UNSEEN LIVE (RULE #1c): all of it. NEXT: D4, THE DOOR PASS over the complexes; then D5.

## THE WORLD OVERVIEW — the directory reorganised round the hubs + THE ESTATE (2026-09-19, local delivery)
The user, with a reference sheet: "make the map / directory more organized — the main hubs / nodes should be DOOR HQ, The
Woods, The Estate (rename the ranch), The Cavern, The Deep, The D.U.M.B. …". The directory (M, the kiosk, the pause menu)
opens on **THE WORLD** now: data.js **`hqWorldOverviewGraph()`** (cached) = ONE node per PLACE — `hq` (the building: every
facility room, the rings, the car), `hub:<id>` (a `DOOR_HQ.hubs` row), `site:<mapId>` (a wild site no hub claims) —
**`hqWorldNodeOf(roomId)`** is the ONE read of a room's place; ONE edge per pair of places aggregated from `hqMapGraph`
(the strongest kind wins: `main` a door / link / lift > `way` a seam that is not a door > `secret` a draught > `bay` the
ring's thresholds; `links` / `ways` / `n` the ledger; the route's ink). **`hqWorldOverviewLayout()`** places every place
on an AUTHORED slot (**`HQ_WORLD_L.slots.hub / .site`**, units, HQ at the origin, x right, y down — tune the table, never
the code; a place the table does not name lands on a fallback ring, and hq-map.test.js fails naming it: ADDING A HUB OR A
SITE = one slot row) and lists the FLOORS (the elevator's stops top to bottom + H-WING; `hqWorldFloorOf(room)`).
**`hqWorldOverview(profile, curRoom)`** = the model: a place is `here` / `seen` (a room of it stood in) / `q` (a seen
place's door leads to it) else off the sheet; rooms seen / total; edges `st` + `charted` (a link walked, else both
places seen); `secrets` = the graph's secret doors found / total. map.js "THE WORLD OVERVIEW" (before `_hqMapHtml`):
`_hqWorldSvg` (the building a BLOCK with a band per floor — `data-mapnode="w:floor:<room>"`; a hub a ringed node with a
glyph from `_HQ_WORLD_GLYPHS`; a lone site its number; OCTILINEAR lines — `_hqWorldRoute`, a 45° run then straight; the
bay threads only for the place picked), `_hqMapLocsHtml` (the LOCATIONS rail: the facility · THE HUBS · THE LOCATIONS,
the uncharted a count per group), `_hqMapCrumbHtml` (`MAP | WORLD ▸ CENTRAL OVERVIEW ▸ ALL LOCATIONS` + AREAS CHARTED ·
SECRETS · CLICK A PLACE TWICE TO TRAVEL), `_hqMapKeyHtml` (THE KEY), `_HQ_MAP_COMPASS`. **THE CLICK RULE**: every world
element carries `data-mapnode="w:<id>"` → `_hqMapTravel` → `_hqWorldPick`: the first click PICKS (the card: rooms charted,
GO ▸ the anchor, OPEN THE AREA MAP; the building's card lists the floors), the second on the same place TRAVELS to its
anchor. **THE AREA sheet** (`_hqMap.mode = 'area'`, `_hqMap.area` a place id; `[data-mapmode]` / `[data-maparea]`; the
WORLD / THIS AREA tabs on the bar) = `_hqAreaModel(M, place)` — the room map filtered to one place, a room outside it a
plain question mark (never a ring / the hall), the building on its own layout, every other place a RADIAL TREE round its
anchor (`_hqAreaLayout`; a room drops the place's name prefix). The reveal keeps a memory PER SHEET (`door.hq.map`:
`w / we / wbox` beside `n / e / box` + `area`) — switching sheets never replays a pop. CSS "THE WORLD OVERVIEW" in
styles-base.css (+ the HUD pass rows); the panel grid is three columns (the rail · the stage · the card; stacked under
860 px). **THE ESTATE** is the ranch's name everywhere the player reads it (`hubs.ranch.label`, `routes.ranch.label`, the
corn fields' plate, the well's plates — the ids stay `ranch`). `npm test` runs hq-map.test.js (THE WORLD OVERVIEW).
UNSEEN LIVE (RULE #1c): the sheet under the game's fonts / theme, the two-click feel, the world reveal, the rail at 860 px.

## THE POPULATION + THE ROUNDS — every area inhabited by its own, and they WALK (2026-09-19, local delivery)
The user: "each area inhabited by the proper units — they already have map tags / terrain preferences;
Disaster City and DOOR HQ the most diverse; make them walk in routed loops, even loops between doors or
areas — make the game feel more alive." **THE TAGS ARE THE ONES THE GAME KEEPS**: `DOOR_TEXT.POINT_OF_ENTRY`
(a race's home site) and the `biomes` on every `RACE_PROFILES` row against the site's `EW_MAP_META.biomes`.
data.js (the block before THE ENCOUNTER): **`HQ_POPULATION_RULES`** (the whole table — counts per m², the
clamps, `cityMul` / `hqMul`, the draw weights, the walk speed, the pauses, the away time, the ledger's TTL,
`underworld` = the sewers' own people); **`hqSiteResidents(siteId)`** = the ONE ordered read of a site's
people (its NATIVES first, then every race whose biome tags meet the site's — `tiers[race]` names the
reason —, then the natives of the sites that share a biome, then the sector's; never the agency);
**`hqRoomPopulation(roomId, profile, { perfLow, date })`** = the ONE read the renderer spawns from: the
room's KIND (`wild` / `city` / `facility`), its pool, and the EXTRA WALKERS beyond the authored `npcSpots`
(`draw: [{ id: 'hq-roam-<i>', race, tier }]`, seeded by the day + the room — the crowd holds for a day; a
wild room's first draw is always a true native; a city street draws its own · ordinary people (a `human`
type) · the other cities' natives by `cityWeights`; a facility room draws the OFFICER'S OWN ROSTER
(`hqRosterRaces`); the hall / the rings / Room 86 / the foyer wear `hqMul`, hubs.city `cityMul`; a `quiet`
room keeps one, the car none); `hqRoomFloorM2(room, roomId)` sizes it (a terrain room by its compiled
plan's open share when compiled, else an estimate per kind — NEVER a compile: a city plan is a
two-minute proof); `hqSpotRoams(roomId, si, spot)` = does an authored spot native leave its spot (never a
posed / `stay: true` / clone spot; `roam: true|false` pins it, else `spotRoamShare` by seed). **THE
ROUNDS** (three-renderer.js, the block before SKATEBOARDING): every extra walker, every roaming spot native
(its spot = its loop's FIRST stop), a `patrol: true` agent (two in the hall) and every traveller wears
`ch.rounds` and walks a LOOP OF STOPS — **THE NAV** (`_hqNavStart` / `_hqNavBuild`: a lattice of
`HQ_NAV_CELL` 0.7 m cells (coarser past `HQ_NAV_MAX_CELLS`) read through **`_hqNavQuery`** = `_hqSurface`
with the people left OUT of the blockers, built over frames at `HQ_NAV_BUDGET_MS`; `_hqNavPath` = A* on 8
neighbours, no corner cutting, up AND down ≤ the walker's step — a person takes the stair, never the cliff,
never a swim; string-pulled), **THE STOPS** (`_hqRoundsStops`: door landings, counter fronts, the spots,
the spawn, free cells), **THE LOOP** (`_hqRoundsAssign`: 2–4 stops, a door `doorShare` of the time),
**THE EXIT** (a door stop with an edge in `hqWorldGraph` — `_hqRoundsExits` — and unlocked: the leaf
swings (`rec.npcOpenUntil`, read by `_hqTickDoors`), the walker is AWAY `awayMs` (hidden, `ch.away`, its
blocker folded — the aim / E / the finds skip it), then comes back in by ANOTHER door), **THE TRAVELLER
LEDGER** (`_hqTravellers`, module-level: an exit files `{ race, gender, to, at, from }`; the far room spawns
that walker at that door WALKING IN when the officer arrives within `travelTtlMs` — follow someone through
a door and they are ahead of you). Yielding: a walker holds `yieldM` short of the officer, slows behind
another; stuck `stuckS` → one re-path, then the stop is dropped; a panel (`H.paused`) freezes everyone.
`_hqTickRounds` runs in `_hqFrame` before `_hqTickChars` (which plays the walk clip at 0.62×). A character
carries `spot` / `spotIndex` / `patrol` / `rounds` / `away` now. Nothing on `state`, nothing relayed (RULE
#2). Dev: `EW_HQ_NO_ROUNDS`, `hq.roamers()`, `hq.nav()`, `hq.travellers()`. `npm test` runs
`hq-population.test.js` (the nav + a full loop with an exit + the ledger in a vm sandbox, every wild room's
draw, the sites). UNSEEN LIVE (RULE #1c): the nav's build time in the cities (~40k queries over frames),
the walk clip's pace, the crowd's density against the frame rate (`perM2` / `cityMax` are the edits), the
landing spot's fit at wide doors, walkers on stairs and ramps.

## AREA CONTENT PLAN D4 — THE DOOR PASS over the complexes (2026-09-20, local delivery)
R3 / R4 / R5 over every pre-plan complex (`AREA_CONTENT_PLAN.md` §7 has the room-by-room list): **fifteen draught PAIRS** as door rows
(`secret: true, leaf: null, label: 'A DRAUGHT'` at both ends — hq-floors / hq-cave count **42** and hq-floors pins the pair list, regenerated from
`hqSecretDoors()`) + **six draught LINKS** (`secret: true` on the row: the cave's flue + crawl (a chamber is crossed by nothing but a links row),
the ley line's three mouths, the wallpaper, the outfall grate); **nine TIER DOORS** (a link END or a door row carries `y`; the gantry is a `plateau`
+ a stair `ramp` in the room, the door's pad on its flat top); **THE BLOCKERS** on the sightlines (0.6 m partitions, pillars = `plateau` r ≤ 1.3,
`tree` rows, prefab props with a foot / rect ≥ 0.45 and h ≥ 1.7 — the audit reads those and nothing else). RULES: a wall's top is the ground UNDER
it + h (a parapet goes on the tier's flat top, never its edge blend); a 0.3 m wall slips between the audit's 0.5 m LOS samples; two abutting plateau
rects leave a solid seam in a halls plan (overlap them a metre); a `bridge` over a door's landing cell keys the landing to the bridge layer — stop
the slab short of the pad; a draught is never an R3 target nor viewpoint (`check-area-content.js`), a bypassed board room is skipped, the ship's
collar is earned. Accepted residue: the well room (six wells see each other), the haunted hall's landing, the D2 cities. The final full audit and
the slow suites were NOT re-run after the last edits (the user's word); `npm run test:quick` and `check-terrain` on every touched room passed.
Ship data.js to R2 AND Render. Unseen live (RULE #1c): every gantry's stair, the parapets, the fangs, the pillars, the slabs' facings.

## AREA CONTENT PLAN D5 — THE FACILITY ROOMS' PURPOSE (panels · stashes · daily lines) — 2026-09-21, local delivery
The last delivery in `AREA_CONTENT_PLAN.md` §5 (§7 has the room list). 26 facility boxes had no counter, no
find, no line and no cast spot; each got ONE thing. **THE STASH** = a fourth shipped find kind: data.js
`DOOR_HQ.stashes[room] = { item, n, mod, why }` (before `findSpots`) → `hqBuildFinds` appends a `stash:<room>`
row of kind `item`, daily on the row's OWN `mod` of the days (`hqFindLiveToday` reads `row.mod`; 3 = the pay
cache's cadence, 7 = the good stuff), `hqCollectFind` → `hqBagAdd`; `hqStashRoomIds()` joins the three finds
room lists (`_hqFindsAll` / `hqFindsBuildAll` / `hqFindsWarm`); **`hqFindRoomOfId` knows `stash:`** — a find
id must name its ROOM or `hqFindById` falls to the whole table and compiles every terrain room (a 200 s hang
in the sandbox); `FIND_RE` carries the claim; a 3–4 m room pins its spot (`findSpots[room].stash`). Ten rooms:
corridor A / B, the crawlspace, the room at the end (a Revival Tonic), the cold room, SUPPLY CLOSET 4B behind
the L6 blast door (an Elixir), H-Wing's office, both legs, the crossbar. Renderer: proc `find_stash` (a white
first-aid tin with one bottle), the placer maps kind `item` / `potion` → `find_stash`, `HQ_FIND_COLORS.item`;
map.js's take toast names the bag. **SIX BY-ID PANELS** (`action: {}` + `desc`; map.js `_hqCounterPanelHtml`
by counter id) on PURE data.js readers (all on `window`): the dock's THE MANIFEST (`deliveries` →
`hqDockDeliveries`: the earned doors Otto hung, the stabilized sites ON THE TRUCK, the back-orders), the boiler
room's THE GAUGE (`gauge` → `hqBoilerGauge`: the punch clock as PSI), the server room's THE RACKS (`uptime`:
`window._ewAssetStore.stats()` + `_ewAssetFailures.length`, read in map.js), the dungeon's THE ROLL CALL
(`rollcall` → `hqRollCall`: THE DEFEATED with dates, newest first), the ritual room's THE ORDER OF SERVICE
(`order` → `hqOrderOfService`: the encounter log + the rooms cleared today), the typing pool's THE OUT-TRAY
(`typing` → `hqOutTray`: the tapes typed up + the last three — **never through `hqTapeShelf` / `hqFindById`
for a count**, both compile every terrain room). **TEN DAILY LINES**: a `say` LIST on an npcSpot (the three
wings, B · SERVICES, the annex, the kitchen, the laundry, the natatorium, the garden, H-Wing's break room);
three-renderer.js `sayOf` picks by `hqHash(day | room.label | spot)` — one line all day, another tomorrow.
Copy is Claude's DRAFT (A15). `npm test` runs `hq-purpose.test.js`, whose last test is THE BARE ROOM RULE: a
facility box with no counter, no tape, no stash, no `say` and no cast spot FAILS it, naming the room — adding
a room = give it one of the four. hq-finds' kind pin reads four kinds. Ship data.js to R2 AND Render (the
ledger's key regex). UNSEEN LIVE (RULE #1c): the tin's scale on the pipe run and the shelves, the six panels'
rows at the panel's width, the day's line on the roster draw.

## THE BOWL — the stadium as a real football stadium; BUILT architecture instead of raised floors (2026-09-26, local delivery)
mondo: "a normal flat rectangular grass football field with a bowl/stadium/stands around it, with a tunnel leading
from the field through the stadium back to the city … walk through the stands and on the field and the sidelines
and through the tunnel … the maps are using raised floors too much when there need to be objects or buildings or
stairs or bridges … that sit on top of the floor but the player can still walk on and into."
- **THE ROOM** (`HQ_AREA_SPECS.prebuilt_stadium`): 85.4 × 132.2, no `gen`, noise 0, typology 'bowl', grass_2
  floor, concrete paths in the tunnels, `floorColor 0xc8ecc8` (it tints the path sheet too — greener went green).
- **THE PITCH**: `hqGridironMarks(o)` paints end zones (+ ENTROPY / WARS text), the border, yard lines every 5,
  hashes, numbers, the midfield Δ. `hqAreaRoom` passes `A.marks` → `terrain.marks`; three-renderer.js
  `_hqBuildMarks` merges rects/lines per colour and draws text on a canvas. Goal posts at z ±43.9.
- **THE STANDS**: `hqStandBowl(o)` (data.js, before the DIVINE STAIR shell) builds rings round a rounded rectangle,
  high → low: facade, concourse, 14 rows (rise 0.42, tread 0.85), fascia. Each ring is wall rows with walkable flat
  tops, mitred `quad`s, an inward `front`; rows carry `seat` colours (west crimson, east navy, ends gold —
  `_hqBuildTierSeats` instances them). TUNNELS (n w 11 hc 4.4 → the city; s w 7 hc 3.0 turnstiles + ticket booth;
  e at z 12 w 4 hc 2.6 → the pitch drain): a row cut by a tunnel continues OVER it as a `plain` bridge slab, so the
  stands walk over the tunnel roof; `ghost` walls (collision only, never drawn) line the tunnel sides. AISLES are
  gaps in every row (a tread is 0.42 — the walker steps it) plus fascia openings onto the sideline. `box` fills
  the corners outside the facade. Press box: a `plain` + `glaze` bridge over the west stand (x −39, y 11.2), the
  hard tape on its roof. Scoreboard proc (catalogue `scoreboard`) over the south end, four flood masts, benches,
  four quarter pipes on the sidelines, concourse carts.
- **THE ROAD**: `stadium_downtown` leaves from the north tunnel's mouth (a.x 0; hq-city / urban-pack pins).
- **ENGINE PIECES** (reusable): wall rows take `ghost`, `slopeTop [ya, yb]`, `tier`, `quad`, `seat`, `front`,
  `rail: 'front' | false | [y0, y1]`; straight bridges take `plain`, `tier`, `seat`, `drawW`, `glaze`; arc bridges
  `drawR0` / `drawR1`; `hqRingQuad(w, r, t)` mitres a ring chord; `spiral` is a ramp swept round a centre. A bridge
  OVERRIDES walls in `hqTerrainFeet` — keep a bridge's footprint off any wall you mean to stop the walker.
- check-terrain: every door reached, nothing traps (663 walls, 25 bridges). `stadium-garage.test.js` (the bowl's
  walker proof is `heavy`). hq-areas accepts a BUILT area (no gen + tier rows) for the plan / weenie / park rules.

## THE NORTH — CAMELOT REBUILT + THE MOUNTAIN (OPEN WORLD Phase 6, 2026-09-27)
Full log: OPEN_WORLD_PLAN.md §12 "PHASE 6". Test: hq-mountain.test.js (+ hq-camelot re-pinned).
- **THE CROWN'S ROAD** (`site_prebuilt_camelot_road`) is Camelot's entry part (the portcullis at its south end);
  a road join walks into the ward. The ward has no bay door now.
- **THE WARD is BUILT** (no gen, noise 0). Castle helpers in data.js after `hqCastleShell`: `hqRoundBlock`
  (solid drum), `hqCastleTower` (hollow drum + doorway + spiral round a newel + a deck flush where the curtain
  joins; `door`/`joins` arcs in degrees, the deck's stairwell hole is [a0 + 0.603·span, a0 + span] and must miss
  the join arcs), `hqCastleCrown`, `hqCurtainWall` (a 6 m wall-walk block, battlements on the `out` face, the
  capsule pulled back `pull0`/`pull1` at towers). `hqCastleTower` hardcodes bridgeThick 0.28 / headroom 1.95:
  HQ_TERRAIN_RULES is in its TDZ where the room table is built.
- A deep stream leaves a dry strip of bed just outside the water: at a box edge that strip is a trap. The road's
  river is wadeable (depth 1.0) and runs past both edges (x ±44).
- **THE MOUNTAIN**: foothills (slope ramp 0 → 25), switchbacks (five plateaus 7 m apart + five ramps, each
  ramp's centreline 0.9 m past the cliff line, or its edge blend notches against the next ledge), summit at 60 m.
  `terrain.outer.keep` / `outer.lift` shape the land past the shell (three-renderer.js `_hqBuildOuterGround`).
- A closed staged part is roofed (three-renderer.js, `_ew_hqRoof`); the parts beside (`beside: true` on
  `hqStageNeighbours`) draw the hall and the keep from the road and the hills.

## THE COAST — the harbour, the cay and the Dutchman on one sea (OPEN WORLD Phase 7, 2026-09-27)
- `site_prebuilt_downtown_harbour` (Downtown part `harbour`, zone `coast`, 300 × 300, sea −0.4 over a −6 floor) under
  Downtown's quay: a `shore` border on Downtown's south side (stitchM 2), THE LONG PIER on the avenue's line (Downtown x 0
  = harbour x −38) to a T-head, THE WATER STEPS out of the water, the slipway, THE BREAKWATER and its lighthouse, four
  buoys, the harbour's skiff at the T-head. Δ board `site_prebuilt_downtown_harbour_delta`.
- THE ISLAND JOIN (`kind: 'island'`): the cay (`site_prebuilt_bermuda_sea`, frame y −0.4, edges stitched to −6) and the
  Dutchman (`site_prebuilt_revenge_deck`, frame y 2.2, her own sea −2.6 over −8.2, the hull a plateau) stand INSIDE the
  harbour's box. The host's floor sinks under them; one surface (validated). Readers: `hqStageNeighbours` (`inside` /
  `host`), `hqStageWhere` (containment first), `hqTerrainIslandSinks`, `info.seaExits`.
- The renderer asks the owning part for the swimmer's / the hull's ground (`_hqStageOwner`, `_hqSeaGroundAt`), crosses
  swimming and aboard, and carries the vehicle and the sea's look through the swap (`_hqSeaDisarm` / `_hqSeaArm`,
  `_hqDryFog`). An island's sea sheet hides while its host is drawn (`outerSides['~sea']`).
- Downtown's bay door → east wall z 64; the mall's entrance → west wall z 30. The cay's bay door is FREE on its beach.
  The Dutchman: board from the skiff (step off alongside); a swimmer cannot climb her.
- Test: `hq-coast.test.js` (the skiff's crossing in a vm harness). Plan log: OPEN_WORLD_PLAN.md §12.


## THE LAND CUT (ZONES_PLAN Z0, 2026-09-29)

Every THE LAND section below (G0-G9) is HISTORY: the land, its bake, the far shells, the LAND/ATLAS map tabs, the `land`
room and the editor's land mode were deleted in Z0. The sites are rooms behind doors again. What Z0 put back: the woods rooms'
own doors (clearing, stair, redwoods, ritual, Dead Man's Cave) and the mall and Downtown from git 1ed44e1 (the trail and
pasture doors dropped: those rooms are gone); the links downtown_strip, stadium_downtown, streets_strip from 6d1dac8; new
plain doors where a stage join was the only way in (Downtown quay <-> harbour, Area 51 gate <-> flight line). The foyer's
front door is `sealed: true` (doorSiteState -> 'sealed'). The harbour keeps its G7 220 x 110 box (the 300 x 300 one held the
Dutchman's and the Triangle's island holes).

## THE LAND — the bake and the atlas (WORLD_GEOGRAPHY_PLAN G0, 2026-09-28)
- The world recipe is data.js `HQ_LAND` (was the sketch's recipe.js in the project folder open-world/geography/sketch/,
  now retired): coast, plateaus, bumps, ranges, peaks, Area 13, the glen, lakes, canyons, rivers, roads, places (each
  with `region`, weenie `top`, `peak` / `lookout`), `sight` (THE SIGHT RULE's constants + mondo's `never` pairs) and
  `baked` (the bake id the game's urls carry). Readers: `hqLandPlace`, `hqLandRegionLabel`, `hqLandBaked`, `hqLandUrl`,
  `hqLandSightOk` (R2 as one pure rule), `hqLandNever`.
- `bake-land.js` = the sketch hardened: every step in metres (erosion life / brush / drops per km², thermal passes),
  ridged noise with gradient damping on the ranges and peaks, trails benched to 0.9 with `steps` spans, river surfaces
  monotone, a `cliff` material (code 21) wherever the slope passes 0.8, carves indexed by arc length. `checkRules` is
  the one check (R2 + never pairs, R7 rivers / lakes, R5 grades / the ring / every place on a route, R3 cliffs): the CLI
  exits 1 and does not stamp on a breach; land-bake.test.js runs it at 8 m (~14 s) and at 2 m (`heavy`).
- A one-cell erosion brush digs runaway pits (heights of ±50 km at 8 m): the brush is never under 2 cells.
- Two routes were added so every place is on one: TRAIL K (mall → the bay's head) and ROUTE 13
  (estate → the haunted house). The reachability rule counts Disaster City's streets (G7) as joining every road that
  enters the city ellipse; sea, edge, arctic and underground places are reached by sea or through a mouth.
- Outputs (Assets/Land/ on R2): land.json (~110 KB), land-map.png (1400², 4 m a pixel, contours every 25 m, ~1.7 MB),
  tiles/t_<i>_<j>.bin (379 at 2 m, ~100 KB each raw; `EWLT` v1 header, height u16 cm from −200 m, material u8, forest
  u8, water u16) and sea.bin (8 m). The tiles are for G2; only land.json + land-map.png are read in G0.
- THE ATLAS (map.js `_hqAtlas*`, styles-base.css `.hq-atlas-*`): mode 'atlas'; fetches land.json once, draws the relief
  image in metres (one map unit = 1 m) with the roads, rivers, the drain, bridges, regions and places over it; `--az`
  (view width / fit width, 0.12..1) keeps labels and markers one screen size. A place's card: region, height, pad,
  SEES (ground / tops from the sight lists), FIRST SEEN (the reveals, nearest first) and the routes it is ON. Picking a
  place brings the view to it. No fog of war yet (G9).

## THE LAND UNDERFOOT (WORLD_GEOGRAPHY_PLAN G2, 2026-09-28)
- The way out: foyer door `street` → room `land` (`land: true`, an open box with no shell) at door `hq` (`wall: 'free'`,
  `y` = `HQ_LAND.baked.hubY`, re-applied after HQ_LAND loads). The room is story mode only; nothing online reads it.
- data.js, after the recipe: `HQ_LAND_RULES` (chunk 64 m, `lods`, `camFar` 460, `far` lens, `tiles` cap/reach/inFlight,
  `detail`, `walk.maxSlope` 1.0, `cliff` 0.72→0.97, `sea`, `ao`, `tex.layers` (15 sheets, mondo's picks: id, `src`, mean colour, metres per
  repeat), `mats` (bake material → [sheet, tint, detail amplitude]), `hq` (the drum)) and `HQ_LAND_STORE` + the sampler
  (`hqLandIndex`, `hqLandWorldRead`, `hqLandTileRead`, `hqLandPut` / `hqLandTouch` / `hqLandWant`, `hqLandBase`,
  `hqLandDetail`, `hqLandHeight`, `hqLandFeet`, `hqLandSlope`, `hqLandCliff(W)`, `hqLandGrid`, `hqLandIds`,
  `hqLandWorldGrid`, `hqLandPadY`, `hqLandHQSolid`, `hqLandStats`). Pure; nothing fetches. land-stream.test.js holds them.
- three-renderer.js `_hqLand*` (before `_hqSea`): `_hqLandArm` (from `_hqEnter` after the sky), `_hqLandTick` (after the
  camera in `_hqFrame`), `_hqLandBuildChunk`, `_hqLandSheets` (the texture array, cached across visits), the splat hook
  `_hqLandSplatHook` (one program: `customProgramCacheKey 'ewland-splat-1'`, per-chunk uniforms `uIds` / `uIdO`),
  `_hqLandBuildFar` + `_hqLandFarHook` (renderOrder −900 / −899, the depth-clear node −850), `_hqLandBuildSea`,
  `_hqLandBuildHQ`, the reads `_hqLandFeetAt` / `_hqLandAirOK` / `_hqLandCamBlocked`, `_hqLandDisarm` (from `_hqLeave`).
  Probe read: `ThreeRenderer.hq.dev.land()`. The gate waits on `H.land.readyNear` (every chunk within lods[1].to built).
- The splat needs WebGL2 (texelFetch, sampler2DArray); WebGL1 / `window.EW_NO_LAND_SPLAT` = vertex colours.
- The sheets are the bucket's own (mondo 2026-09-28): `tex.layers[].src` = a TERRAIN_SPRITES key or `urban:<Name>`,
  resolved by `_hqLandSheetUrl` (+ `_ewCorsBust`), drawn to 256 px, times `tint` (else TERRAIN_BASE_TINT[src]). Each loaded
  sheet's measured mean goes on its layer (`mean`) and `_hqLandRetone` re-reads the tables + recolours the far land. Nothing
  is generated; zip 4's `Assets/Land/tex/` is dead.
- Probe (offline, scratch copy of playtest_hq_offline.js): serve `/Assets/Land/*` from the repo's bake output, wait for
  the game's own first room before `_hqEnter({ room: 'land' })` (else the boot's hall entry replaces it).

## THE WATER (WORLD_GEOGRAPHY_PLAN G3, 2026-09-28, token 20260928-geography-07-cors, bake 5e65e17571)
- One read of the water: data.js "THE WATER LAYER" after `hqLandForest` — `_hqLandW` (a lattice sample; NaN = none / the sea's),
  `hqLandFresh`, `hqLandWaterY`, `hqLandWaterDepth`, `hqLandWaterFresh`, `hqLandFlow`, `hqLandHullFloats`, `hqLandFalls` (cached in
  `HQ_LAND_STORE.falls`), `hqLandWaterSheet`, `hqLandSeaDepth` / `hqLandSeaDepthWorld` (bytes (depth + 8) × 4), `hqLandMooring`
  (+ `_hqLandMoorRing`). Rules: `HQ_LAND_RULES.water` (nearSea, hull, current, falls, rapids, look, depthTex, moor).
- The bake: `HQ_LAND.riverMouth` = the run-out to the sea's level; land.json `rivers[].mouth`; checkRules R7 refuses a high mouth.
  A recipe edit is still `npm run bake-land` + ship the changed tiles (the bake is deterministic: compare with the last upload).
- three-renderer.js "THE WATER" block replaced `_hqLandBuildSea`: `_hqLandWaterUniforms` (L.wu, one clock `uWT`), the GLSL
  `_HQ_WATER_FS_*`, `_hqLandWaterHook(kind)` / `_hqLandWaterMat(L, 'sea' | 'far' | 'fresh')` (shared mats, `_hqLandDisarm`
  disposes them; the far one is opaque so it stays in the opaque list before the depth clear), `_hqLandWaterSheets` (water.png +
  waves_1.png through `_hqLandFetch`), `_hqLandWaterFar` / `_hqLandWaterDepthTick` (the depth textures), `_hqLandWaterTile` /
  `_hqLandWaterDrop` (a tile's sheet: queued by `_hqLandTileLanded`, dropped with `hqLandPut`'s evictions), `_hqLandBuildFalls` /
  `_hqLandFallsTick`, `_hqLandMoorTick` / `_hqLandMoorSkiff`, `_hqLandWaterTick` (from `_hqLandTick`). `_hqLandFarArrays` raises the
  lakes' cells and tints the rivers.
- Swimmer / helm / underwater read `_hqWaterYAt(x, z)`; `_hqHullFree` has a land branch; the swim tick's `sameW` keeps a surface
  swimmer on one surface and a falls' lip drops the body (`_hqSeaEmit({ kind: 'falls' })`). `_hqWetSheetAt` has a land branch.
- Probe read: `ThreeRenderer.hq.dev.water(x, z)`. Kill-switch `window.EW_NO_LAND_WATER_FX` (colours only).
- r128 gotcha: a transparent DoubleSide lit material renders a back pass first; for a sheet seen from its front that pass can
  read black (the falls' pool did) — the falls are unlit (MeshBasic × `uWLit`).
- Probe: the G2 offline probe plus `_hqEnter({ from: 'play', room: 'land' })`; mooring then `hqLandMooring(m)` in the page gives the
  shore to stand on. Test: land-water.test.js.

## THE TREES AND THE GRASS (WORLD_GEOGRAPHY_PLAN G4, 2026-09-28, token 20260928-geography-08-cors, bake 5e65e17571)
- data.js "THE FLORA" after `_hqLandMoorRing`: rules `HQ_LAND_RULES.flora` (trees, kinds with their `src`, mixes, forestMix,
  zones, under, rocks, grass, near, far, blockers, buildMs). `_hqFloraGrid` (the hash-peak jittered grid, windowed), `hqLandFloraMix`,
  `hqLandFloraKind`, `hqLandTrunkR(kind, h)` (min of the rule's r and the measured `rM * h`), `hqLandFlora(t)` /
  `hqLandFloraStep(t, n)` (48 steps: 3 layers × 16 squares of 64 m; result on `t.flora` = trees/under/rocks Float32Arrays of
  [x, z, y, kind, h|span, yaw]), `hqLandFloraNear(x, z, r)` (the blockers), `hqLandFloraHit`, `hqLandGrassBlock(bi, bj)`,
  `hqLandFarForest()`.
- three-renderer.js "THE TREES AND THE GRASS" block before the HQ-from-outside block: `_hqFloraModel(src, role)` (foliage: /
  misc: / door: sources; `_hqFloraProc` stand-ins; `_hqFloraSetParts` marks everything `_ew_shared` so `_mmEvict` and `_disposeR`
  skip it), `_hqFloraBake` (the card RT), `_hqFloraCardMat` (near cards collapse inside `uNear`, far ones use `_hqLandFarHook`),
  `_hqFloraArm` / `_hqLandFloraTick` (from `_hqLandTick`) / `_hqFloraDropTile` / `_hqFloraDisarm`, `_hqFloraNear` (instanced,
  tri budget), `_hqFloraBlockers` (tags `landFlora: true`, `H.nav.staticKey = -1`), `_hqFloraGrassTick`. `_hqFloraBothLit` swaps
  three's back-face Lambert for the front (r128 lights a DoubleSide back face with the normal flipped: black blades).
- MEM line gains TREES / GRASS. Probe read `ThreeRenderer.hq.dev.flora(x, z)`. Kill-switch `window.EW_NO_LAND_FLORA`.
- Test land-forest.test.js (heavy = the 2 m count).
- G4b THE GRASS BLADES (token 20260928-geography-09-cors): data.js `hqLandGrassField(F, n, ix0, iz0, w, h)` (the blades' ground
  on the world's 1 m lattice, WRAPPED into an n × n window; rules `HQ_LAND_RULES.flora.grass` win/step/texels/recentre/patch/
  blades/near/reach/fade/dens/h/w/lean/push/slope/low/mats). hqLandGrassBlock and the tuft code are gone.
- three-renderer.js "THE GRASS BLADES": `_HQ_GRASS_VS_HEAD` / `_HQ_GRASS_VS_BODY` (the blade in the vertex shader),
  `_hqFloraGrassGeo(k)` (0 = the dense patch, 7 verts a blade; 1 = the thin one, a triangle), `_hqFloraGrassMat`,
  `_hqFloraGrassArm` (the float DataTexture window `L.flora.gs`, two Meshes on InstancedBufferGeometry with `aPatch`),
  `_hqFloraGrassShift` (the strips gained; their density zeroed at once), `_hqFloraGrassFill` (time-sliced), `_hqFloraGrassTick`
  (window, colours from `hqLandColor` once `L.tone` changes, the patches in the camera's frustum). `_hqFloraGrassOk` = vertex
  textures + float textures. MEM line's GRASS = blades in the drawn patches.


## THE ROADS (WORLD_GEOGRAPHY_PLAN G5, 2026-09-28, token 20260928-geography-10-cors, bake 35b9269ad8)
- bake-land.js §6 `gradeLine(rd, pts)`: smoothing (roadRules.smooth), the water's lift (`clear` by type; a river no wider than
  `smallRiver` m, i.e. River 2, only `clearSmall`: a culvert span), the grade clamp, then THE FILL CAP: a dry span standing
  more than 7 m over the ground for `maxDry` (60) m is regraded to at most `fill` (6.5) m over the ground ± `capPad` m (the lower
  envelope of grade cones: it cuts into the slope), except within `approach` m of water and inside a NAMED VIADUCT
  (`HQ_LAND.viaducts`: Bridges 6 and 7 — fork 6's default). Last, the water's lift is made HARD (its cones): a road
  never passes under a river. The stamp reads the height between two samples off the line (the nearest sample stepped it).
  Overlay rows: roads gain `surface` (asphalt / paved / dirt / trail), `maxCut`, `cutAt`, `rails` ([s0, s1, side], side +1 = left
  of travel); `bridges` rows {id, road, type, w, len, wet, river, viaduct, look, label, span, deck, hMax, pts (4 m, ±2
  abutment samples)}; `junctions` {at, y, branch, end, sB, main, sM, ahead, back, to, kind, mainKind} (an end on another road's
  end is a road changing its name: no junction). Names: a viaduct's own, `roadRules.names[road]` (crown = BRIDGE 5),
  else `bridgeNames[river]`, a trail's = `bridgeNames.foot`. Looks: viaduct 'arch', `roadRules.looks[river]` (nile = truss),
  trail 'foot', else 'girder'. Materials `lane` (packed dirt) and `paved` (the Vatican's lane) joined MATS (24 now: the grass
  shader's uGCol[24] and the splat's uLay[24] are full).
- Recipe changes (data.js HQ_LAND): Route 2, Route 3, Route 4 (south), Route 5 re-laid (switchbacks, no
  viaducts); Route 1 crosses River 2 on the plain north of the old line (the old line ran 10 m under the perched creek;
  holding it over the creek made a 718 m ramp); Trail B starts on the new line; a mesa gap by Giza (`mesas.avoid`).
- data.js "THE ROADS" before `hqLandPadY`: `HQ_LAND_RULES.roads` (near, piece, lift, sheets, paint, deck, rail, lamps, sign,
  near2, traffic), `HQ_LAND_ROADS` (built by `hqLandRoadsIndex(ov)` from inside `hqLandIndex`, once per bake id), readers
  `hqLandRoadPose(road, s)`, `hqLandDecksAt`, `hqLandDeckFeet(x, z, curY, g)` (undefined = no say, null = parapet / no headroom,
  else the top), `hqLandDeckBelow`, `hqLandInDeck`, `hqLandDeckNear` (the trees and rocks keep off), `hqLandDeckPiers`,
  `hqLandRailsNear`, `hqLandRailHit(x, z, pad, y)`, `hqLandPlaceLabel`. Signs worded at index time (`W.signs`).
- three-renderer.js "THE ROADS" before the walker reads: `_hqRoadsArm` (from `_hqLandArm`), `_hqRoadsTick` (from `_hqLandTick`:
  pieces within `near` m, decks within camFar, a few ms a frame), `_hqRoadsBuildPiece` (ribbon on the drawn ground's heights,
  paint, guard rails, signs), `_hqRoadsBuildDeck` (slab, parapets / foot rail, girder, piers, arches with spandrels, truss,
  lamps = the street lamp OBJ, name plates), `_hqRoadsBlockers` (piers as turned rects, posts; tags `landRoad: true`; the guard
  pieces near the walker join `_hq.rails` as sloped grind rails linked `next` / `prev` — the grind runs on piece to piece),
  `_hqRoadsTraffic` (Route 1, both directions; `_hqTickTraffic` reads `car.yAt` and pitches the car), `_hqRoadsDisarm`.
  Walker: `_hqLandFeetAt(x, z, curY)` asks the decks then the rails; `_hqLandAirOK` / `_hqLandCamBlocked` the slab, parapet and
  beam; `_hqBlockerFloor` lands on a deck; the steep-face slide skips a walker on a deck. Kill-switch `window.EW_NO_LAND_ROADS`.
- Test land-roads.test.js (a 16 m bake: grades, no giveaway viaduct, wet decks clear their water, rails at the drops, the
  junctions' places, the deck and rail readers, the wiring and the assets). Offline analysis: an 8 m bake's roads / bridges
  report is the fast way to check a recipe edit (`bake({ cell: 8 })`, 12 s).

## THE SITES ON THE LAND (WORLD_GEOGRAPHY_PLAN G6, 2026-09-28, token 20260928-geography-11-cors, bake da0db7e906)
- data.js `HQ_WORLD.zones.land` (ground `land`, hub `land`): the land room plus 26 site parts, each `{ place, dx, dz, dy }`
  on a `HQ_LAND.places` row; `hqLandSiteFrames()` writes x/z from the place and y from its `padY` (rot 0 always). Joins: an
  `island` join `land → part` for each open site (`pad: true`, `y` = the pad), door joins for Area 51 (flight line ⇄ Hangar 18
  ⇄ the white rooms), Camelot (ward ⇄ hall ⇄ keep), the haunted grounds ⇄ the hall, the Vatican's cortile ⇄ basilica ⇄
  library, a stair join to the observatory (dy 6), a road join gate ⇄ flight line on the pad.
- Retired: zones forecourt, highway, desert, kingdom, mountain, woods, haunted, divine, the ground `rome`; rooms
  `fairy_forest_trail`, `fairy_forest_pasture`, `camelot_road`, `olympus_foothills`, `olympus_switchbacks`, `strip_highway`,
  `area51_highway`; links `ranch_haunted`, `ranch_grove`, `woods_grove`, `woods_shasta`, `fairy_camelot` (and their KEPT_LEAVES
  rows); the woods' doors between parts and the three draught pairs (40 secret doors now). Camelot is entered by the ward.
  Dead Man's Cave: its `land` door ⇄ the land room's free `deadmans` door (the storm drain's mouth, Trail D's end).
- Moved off River 1: Camelot to [-40, -685], the Vatican to [787, -445] (their pads buried the river). The loch skiff's
  mooring moved to [-778, 128] (the loch keeps its full outline now that no pad buries it).
- `hqLandSites()` (per place: the union of its parts' rects, the pad y) and `hqLandSiteAt(x, z, pad)`, `hqLandSiteGap`.
  `HQ_LAND_RULES.sites` `{ margin 3, band 24, keepOff 1.5, build 300, drop 380 }`.
- The bake (bake-land.js 5b): after the disc pads each site's rect (+ margin) is flat at the pad y and eases back over `band`;
  the band lets go toward water (a chamfer distance, the shore keeps its bank); disc pads never bury water past 0.8 r; no
  forest in a site (`SITE` mask); rails keep off; overlay `sites` [{ place, rect, y, parts }].
- The island stitch (`hqTerrainStitchRows`, rows `island: true`): the four edges ease to the pad over stitchM, EXCEPT inside an
  authored plateau or ramp (the stair's landing stays 3.5 m up at the north edge; the summit's and the haunted grounds' tiers).
  The generated plan opens an island row with a mouth `islandMouthW` (10 m) wide at the side's middle plus an open strip
  `islandEdgeM` (1.5 m) either side of the edge, so the plan keeps its thicket and trees and the land meets flat ground.
- The land drawn from a site: `H.landZ` (the land record, armed at `_hqEnter` for a land site by `_hqStageLandEarly`) sits in
  `L.group` at the land's frame in the current part's metres (`_hqLandO` / `_hqLandPlace`, uniform `uLandO` in the splat and
  water shaders); `L.v` (`_hqLandView`) = the walker and the eye in land metres, `own` = standing on the land. The land ground
  discards inside the attached sites' rects (`uSiteR[12]`, `_hqLandSiteCut`; a part with dy > 0.5 is not cut); flora, grass
  and road pieces keep off site rects. On a land site `_hqPartOnLand()` skips the outer ground, the treeline and the city
  backdrop.
- The stage on the land: `_hqStageLandPick` keeps the islands within `build` m of the walker and drops past `drop`; beside
  parts (the hall and the keep from the land) follow their island and are never crossed into (`_hqStageLandBeside`); the
  crossing onto an unbuilt island shows no load card. `hqFarParts('land')` lists every open site; `_hqFarTick` keeps the
  farMax nearest the walker.
- Weenies: sites on the land hang none (`hqRoomLandmarks` → the places stand on the horizon). Downtown and the Bowl see
  Olympus from their land place (`HQ_WORLD_WEENIES` row `from: 'downtown'`, `hqWorldBearing(room, target, fromPlace)`).
- Tests: wall-audit.test.js (R3 on every land site, heavy, ~65 s), the re-pinned hq-*.test.js (stage, joins, lod, clock,
  south, mountain, west, woods, world-map, world, map, ranch, urban, floors, coast, terrain, camelot, areas).

## THE CITY ON THE HILL (WORLD_GEOGRAPHY_PLAN G7, 2026-09-29, token 20260929-geography-12-cors, bake 5d00c20e10)
- Downtown (`site_prebuilt_downtown_streets`, rot 1), the harbour (rot 1, `sea: true`) and the Bowl (rot 1) are parts of
  `HQ_WORLD.zones.land` on the places downtown / harbour / stadium. Zones city and coast are gone; the cay and the Dutchman
  are in no zone until G8 (their doors still work). `hqLandSiteFrames` keeps a part's `rot`.
- THE SLOPE: a terrain room may carry `terrain.slope = { axis: 'z' | 'x', pts: [[t, dy], ...] }` (a repeated t is a step).
  `hqTerrainSlopeFn` reads it; `hqTerrainCompile` adds it to the base height and `_hqTSlopeFeatures` lifts every authored
  feature (plateau, ramp ends, deck, bridge, pool, stream, numeric wall y) by the profile at its spot. City lots and solid
  tops use `_hqTBaseAt`; traced walls pass `rel` so they ride the slope. Stair ramps with h0 = h1 = 0 then climb the step.
- THE BAKE: `hqLandSiteY(S, x, z)` gives the site's ground at the nearest point of its rect; bake-land.js flattens a sloped
  site to it and skips `S.sea` sites (the bay's floor stays). Island stitch rows ease to the slope; a site-to-site join
  (Downtown's quay ⇄ the harbour) owns its span of the edge (hqTerrainStitchRows cuts the island ease there).
- THE RENDERER: the land group wears `rotation.y = rot·π/2` for a turned site; `uLandR` (cos, sin) turns the splat and
  water shaders' points back into land metres; `_hqLandToScene` / `_hqLandFromScene` for flora, blockers and roads.
  `_hqBuildCityLots` adds THE PLINTHS (`hq_city_plinths`, one InstancedMesh) under lots stood above their lowest ground;
  traffic pitches with `info.slope`.
- The mall's `street` door leads to the land's `mall` door on the beach pad; the lighthouse is a land prop at its place.
- Test: city-slopes.test.js (R8 per district, the 12 % grade, the stairs walked, the land edge, the renderer pins).

## THE EDGE OF THE WORLD (WORLD_GEOGRAPHY_PLAN G8, 2026-09-29, token 20260929-geography-13-cors, bake 5aa5d61879)
- Four more parts of `HQ_WORLD.zones.land`: `site_prebuilt_bermuda_sea` (place cay, dz −52 so the part's cay is on the place; its
  maelstrom = the `whirlpool` place, moved to 1342, 1360), `site_prebuilt_revenge_deck` (place dutchman, dy 2.6: her water −2.6 is
  the sea at 0), both `sea: true` with `bank` (land metres = the part's floor: −3.5, −5.6; the island join's `y` is the same);
  `site_prebuilt_antarctica_station` (place station 110, 2215, rot 2: its way in faces the landing) on the shelf at 11.5;
  `site_prebuilt_northpole_village` (place pole) on the pack at 1.0. HQ_WORLD_WEENIES is empty (Bermuda's row went).
- THE BAKE (bake-land.js step 5'): the baked cay mound is gone (the site is the cay); `hqLandSites` carries `bank`, and a sea site
  with a bank raises the Deep's floor to it under its box and slopes back over `bankBand` (90 m). THE PACK: every ICE 2 cell stands
  `R.arctic.floe` (0.6) over the sea, running down to −`footDepth` within `foot` m of open water (a chamfer distance; the coast
  counts as ice). THE FAST ICE: `R.arctic.fast` (a 90 m band from the North Pass's foot to the Pole). THE LANDING:
  `R.wall.shelf.landing`, a 34 m ramp of ice from −2 in the water up the shelf's front at 10 % toward the station.
- R4 in `checkRules` via `edgeReach(B)`: a flood from the harbour's water (sail deeper than 1.2 m, walk slope ≤ 1 and wade the
  last 1.3 m); per half-degree the wall's face stands at full height, the wall's foot is reached, nothing reached lies past it;
  the cay, the Dutchman, the station and the Pole are reached. At 2 m the open sea reaches the wall on most bearings, the pack in
  the north (its leads let the skiff in too), the shelf in the south. The Flat Lands on the wall top are not reached (fork 5).
- THE RENDERER: `_hqLandIceMats()` (ice, pack by code); a chunk writes a NEGATIVE cliff weight on an ice face, and the splat reads
  the ice sheet side-on there (`uIceL`), blued low on the face; the far land and the no-WebGL2 colours skip the rock cliff for ice.
- Test: land-edge.test.js (8 m bake: R4, the bearings by kind, the fast ice and the landing, the sites' banks and water, the
  whirlpool on the maelstrom, the renderer pins).

## THE TWO EXITS (ZONES_PLAN Z1, 2026-09-29)
- Only two ways out of DOOR HQ at the start: the garage TAXI (link `garage_taxi`, way `taxi`) to Downtown's east kerb, and
  the woods stair (`woods_stair`). data.js `HQ_EXIT_RULES.open` lists them; `hqApplyShutExits` hides every other link door
  in a facility room until the room on its far side has been seen (map.js `_hqEnter` runs it each entry). Named secrets
  (`secret: true`): garage_motorpool, woods_sewer, woods_ritual, garage.tunnel, stairwell.tunnel.
- Adding a new HQ exit: it is shut by default; add its link id to `HQ_EXIT_RULES.open` only if mondo says it is open.
- `_hqWayBuilders.taxi` sets `_hzKitTs = 1.75 * U` round `_hzVehicle` so the GLB is real size; any new way builder that
  uses the vehicle kit must do the same.

## LEVEL DESIGN PLAN L1-L3 (2026-09-30)
Plan of record: LEVEL_DESIGN_PLAN.md (repo root), log in its §9. Staircase hall `woodstair` off the DOOR HQ main hall; the
Vatican's five rooms rebuilt as architecture (flat floors, plain bridges for galleries, `built` ramps, hung parapet walls,
plan-gen catacombs and garden); the Astral sea as floating islands over `terrain.void` (data.js hqTerrainVoidAt,
three-renderer _hqBuildIslandRock / _hqBuildVoidGlow / _hqVoidReturn); the spaceship as staged zone `derelict` (ground
`space`). Gotcha: a prop over a terrain `wall` stands on the wall's top (hqTerrainFeet), so dress shelf cores thin (t 0.2)
with the shelves beside them. Built flights step one tread per 0.5 m cell so the grid solver sees every riser.
L4 + L5 (2026-09-30): the sewers, running tunnels, holding cells, old workings, Dead Man's Cave (box now 42 × 28),
Camelot's dungeon, the Cavern's gallery and Hell's pit are `plan` layouts (spaces + halls). Gotchas: a `deck` over a
walkable floor needs `over: true` (a plain deck is a height and cuts the floor under it in two); a flight's high end must sit
0.7 m inside its tier and its forced band past the end must land on the tier, or the solver finds a floor sliver (a trap);
wall props (`wall: 'n'` …) hang on the shell wall, so a plan that puts rock against that stretch hides them.

## THE PASSAGES (2026-10-01, mondo: "too many literal doors in places it makes no sense")
A link end or a room door whose way row carries `passage` is no door: it is a walk-through way that darkens with depth
and changes room when you are `deep` metres in (three-renderer.js `_hqPassageWay` builds it, `_hqTickPassages` fades and
fires `onEnterDoor`, `_hqGoTo` lands you `land` m inside the far end facing the room and fades up). Ways (data.js
DOOR_HQ.ways): `tunnel` (rock mouth, an outcrop in open rooms), `trail` (a dirt road between trees, a signpost),
`stairway` (a marble flight past an arch, `rise` 0.4), `cloud` (fades to white). A door/link end may override any
passage key: `w h len deep rise land look fade tread runner spread pad inside`. `wall: 'free'` + `inside` lays the passage
over the room's own terrain (the Woods stair). Wall passages cut the box wall, walk past the wall plane through hooks in
`_hqSurface` / `_hqAirOK` / `_hqCamBlocked`, clear a lane in the treeline and carve the outer ground.
- DOOR HQ → Woods: the stair in `woodstair` IS the way (no door at the top); climb past the arch into the dark.
- The Woods stair (clearing): a freestanding marble flight with cheek walls (ramp `cheek: {h, t, key, head}` in
  `_hqBuildBuiltStairs`) climbing 14 m past the canopy (`shell.forest.canopy` plants a crown ring out to 54 m); walking
  off its top goes to DOOR HQ. The old stair landing room (site_prebuilt_fairy_forest_stair) is deleted.
- Woods ⇄ Camelot: the trail link `woods_camelot` (the old spring pool seam was cut before this). Redwoods trail,
  Dead Man's Cave tunnel, Cavern galleries, Göbekli ley/tell, Hell/Agartha/Hollow caves = tunnels; Heaven/Olympus/sky
  castle/observatory = cloud; North Pole ⇄ Camelot = trail. The clearing's gen seed went 11 → 22 to keep its 8×8 arena.

## NO DOORS IN THE WOODS + THE SILL + THE DIM PATH (2026-10-05)
mondo: "why the fuck are there still doors like this in the woods? ... trail/dirt path to the next area"; "the terrain is covering
the bottom of these doors"; the stair walk "an all black screen ... when i come out the other side my screen is still all black".
- PR #42 missed the secret exits: clearing ⇄ ritual ground (a DRAUGHT, `leaf: null` = a black wall slab), the redwoods ⇄ Dead
  Man's Cave culvert, the ritual ground's end of `woods_ritual`. Now trails (ritual) and tunnels (the culvert, and Dead Man's
  Cave's ends of woods_sewer / streets_drain / sewers_drain). Secret stays secret (map), a secret trail gets no signpost.
- THE RULE: data.js `hqWoodsNoDoors()` (run at the end of every hqRefreshComplexLinks) turns any wall door / link end with no
  `way` in an outdoor Woods room (`hqWoodsTrailRoom`: site prebuilt_fairy_forest, open forest shell) into a trail. The user's
  tree ways (hollow tree, dead tree) and the stair keep their own way.
- THE SILL (hqTerrainCompile): every wall door is a plan `mouth` (open past the wall, the opening + 1 m wide) unless the plan's
  solid is a mass; the closed-room rim clamp skips door lanes; a passage's pad is its width + 1.6 m. 99 of 332 wall doors had
  ground over the sill at the wall plane; 4 left (the HQ stair's own flight, two hollow-earth tunnel flanks).
- THE DIM PATH (three-renderer.js passages): the walk in dims the screen to 45% (was black at `deep`); only the crossing blinks
  black; the dark cards are a deepening dusk (only the far card is solid); roofed passages are self-lit (`lift` 0.22 hall, 0.14
  rock). Arrivals land 0.9 m out of the far mouth in the room (they used to land `land` m inside it, with the boom behind every
  dark card = a black screen until you walked out); the fade-up is 0.7 s. Arenas re-baked.

## THE RETRO TREE PACK (2026-10-04)
mondo uploaded `Assets/foilage/retrotreepack/GLB/` (dead_tree_rt_1/2, small_tree_rt_1, tree_rt_1, tree_rt_2, tree_rt_2_1,
tree_rt_3, tree_rt_4; the `Low Res/` PNGs are the same textures, already embedded in each GLB) and asked for the woods and
similar areas to be fully surrounded by trees so the map edge never shows.
- A tree model name `rt:<file>` is a pack GLB (three-renderer.js `_foliageUrl`, `_foliageBakeGlb` bakes the GLB's Z-up node
  rotation into the geometry so the wind hook reads y as up; `_foliageGlbMat` = Lambert, the file's texture tagged linear,
  cards alphaTest 0.5, two-sided). Each file is ~100 tris (crossed cards on a trunk).
- data.js HQ_TREE_KINDS: tree = tree_rt_2_1 (birch), tree_2 = tree_rt_3 (spruce), tree_3 = tree_rt_4 (oak), tree_4 = tree_rt_2
  (tall birch), tree_5 = dead_tree_rt_2, tree_6 = dead_tree_rt_1, pine = tree_rt_1, pine_2 = small_tree_rt_1. tree_7 … tree_20
  stay the old OBJs (editor palette). HQ_TREE_KINDS now overrides every key of the renderer's `_FOLIAGE_MODEL_FOR_KEY`.
  The battle board trees, the battle world rim, the HQ treeline / thicket / terrain trees all draw the pack through this map.
- THE CANOPY now runs for EVERY room with `shell.forest` (was the clearing only; `forest.canopy: false` opts out): pack trees
  from the treeline out to the outer ground's end, 6-10.5 m tall, the forest's own kinds, one InstancedMesh per model piece,
  no shadows, nearest rows first, capped at HQ_CANOPY_MAX (3200; half under EW_PERF_LOW), skipping passages and staged
  neighbours. Needs a terrain room with an outer ground. Waits for the files (no timeout); a failed file falls back to the
  old icosahedron crowns (`_hqCanopyStandIn`). Switch: `window.EW_HQ_NO_CANOPY = true` then re-enter.
- Forest rooms: the clearing, redwoods, ritual, Skinwalker fields, Shasta slopes, Bohemian Grove, haunted grounds, North
  Pole village, Camelot ward. Load-checked the clearing (sandbox): ~2200 canopy trees in 11 draws, no errors.
- The editors (2026-10-04, mondo: "and add them to the map editor"): the HQ editor's TREES tab groups the pack first
  ("Retro tree pack", named birch / spruce / oak / tall birch / pine / sapling / bare tree / big bare tree; the old OBJs under
  "Trees (old)"). The battle map editor (map.js) Trees tab gains `tree_pine` + `tree_sapling` (object ids 60 / 61, appended to
  ME_OBJECT_IDS and mirrored in data.js MF_OID; board defs in data.js; picture = the pack's Low Res PNG in sprites.js). The
  board keys start `tree_` so every /^tree/ rule (cover, fire, forest-adapted, wither → tree_5) counts them. The plan layout's
  TREES look defaults to pack kinds (tree, tree_2, tree_3, pine, tree_4) instead of tree_7-9.

## NO STEPPED STAIRS (2026-10-05)
mondo: "either make a smooth ramp or use a stairs prop ... Delete and replace every single one". Every terrain `ramp` wearing
`stairs: true` (158 rows, plus hqHelixRamp / editor rows) used to quantise the field into 1 m (built: 0.5 m) treads drawn as chunky
blocks. Now data.js hqTerrainCompile gives every flight a smooth slope h0 → h1; only a `float: true` flight (the Divine Stair's cloud
steps) keeps treads. `built: true` flights draw as ONE solid wedge (three-renderer.js _hqSlopePrismGeo / _hqBuildBuiltStairs): slope in
`key`, flanks in `side`, runner and cheek parapets slope with it. The editor's Stairs tool places a solid smooth ramp (built). Arenas
re-baked (camelot, mars picks moved). Untouched: metro_stairs passages, the rotunda's curved flights, stadium seat rows, legacy voxel
battle-map 1-tile staircases.

## THE WATER (2026-10-05, mondo: water flickers, doesn't touch the edges, gets him stuck; "the only place the water doesnt do this is the deep")
Walk-mode pools and streams (terrain `pool` / `stream` rows) were a disc per pool and a mitred ribbon per stream at one height. Where
two met (Dead Man's Cave's sump over its channel, the sewers' pools on their channels, the gallery's and the workings' streams) two
sheets lay at the same depth: the z-fight flicker. A sheet cut at the outline (+0.25 m) also stopped short of the carved bank, leaving a
dry strip of sunk ground between the water and the wall. Now (three-renderer.js `_hqWaterOwners` / `_hqWaterGeoms`, called from
`_hqBuildTerrain`) each liquid is ONE surface drawn per grid cell, like THE DEEP's sea: every node is owned by one liquid (later row
wins where outlines meet), and a contained liquid floods over the ground under its surface, through its bank, past it only onto ground
at its bed (a door's sill pad), max `HQ_WATER_REACH` m. The field hides the surface where the ground is higher, so the shore is the
ground's own line. A liquid standing proud of its ground keeps outline + 0.25 m. data.js fluids now carry `bank`. The walker's reads
(hqTerrainFluidAt) are unchanged.
Stuck: a jump that landed in water too deep to wade (a sump, a canal, lava) stood on the bed where every step and jump is refused.
The walker now returns to the last ground it stood on (`pl._landSafe`, the void's `_hqVoidReturn`).
Tunnel mouths: `_hqPassageWay`'s roofed tube had its wall ends and roof lip exactly in the room wall's plane (z-fight ring round
every tunnel mouth in a walled room, e.g. Dead Man's Cave's drain). The tube now starts 6 cm behind the wall line.
Graffiti: Dead Man's Cave's and the sewers' graffiti panels stood mid-floor after the L4 layouts (read mirrored from behind: the "RM 13"
on the floor); re-hung flat on the drawn brick, and the panel is one-sided.

## STAIRS PASS (2026-10-05, thread "stairs, railings and verticality") — the running list
Engine + catalogue: docs/notes/models-assets.md "THE STAIRS PACK". Every stair ramp in the game is drawn as a pack flight from batch 1
(kind: the row's `model`, else the room's `terrain.stairs`, else timber in a forest room, else HQ_STAIR_RULES.siteKinds by site — stone / steel — else `concrete`); every rail row as a pack railing. Rooms redesigned (verticality, stairs
instead of ramps, upper sections, gap jumps, curved / sloped / gap-crossing railings):
- Batch 1 (engine): THE MALL escalators swapped for the pack's (no layout change yet).
- Batch 2 (urban / man-made), one commit per room (git log --grep for the room name):
  - Mall: stairs, tongues with a jump gap, a top catwalk, handrails, curved rails. Strip: north roof run with walkways, a gap and
    stairs, an upper parking deck, curved kerb rails. Downtown: the canal terrace (stairs, a gap, a walkway over the avenue), plaza
    fountain curved rail.
  - Cyberpunk streets: the seven stack roofs (10.5) joined into one rooftop run by bridges over the alleys and the boulevard; fire
    escape stairs up stacks W and E1 to 5.25 landings; overlook ramp → glass stair; undercity steps → grate; curved rails round the
    holo-plaza. City-plan gotcha: a `rail` row with x0..x1 forces the ground open under it — over masses write rails as `pts`.
  - Harbour: a quay at 0 along the north edge (fixed the old sea trap: nothing joined the door to the water), three wharves at 3.0
    with a 2.5 m gap, a steel gantry bridge over the water down to the T-head, stone water steps a swimmer can climb out of, the mole
    crest walk to the lighthouse (curved railing round its head). `res` 1.0 → 0.5.
  - Stadium bowl (HQ_AREA_SPECS.prebuilt_stadium): two more tunnel slots with concrete flights sideline → concourse (6.3); a rim walk
    at 10.5 round the facade top (ladders up; the concourse is a wall row and cannot hold a flight); pipe rails across the tunnel
    mouths; the flood masts on the roof corners. Garage: two concrete stairs plaza → deck (4.2) with centre pipe handrails.
  - Area 51 (gate, flight line, hangar, ward), Antarctica station, derelict deck, Revenge deck, D.U.M.B. (bunker, war room, clone
    vats, dream lab, sub-level 7, motor pool), sewers (three upper districts at 1.6), running tunnels (maintenance level at 2.4),
    holding cells (north half at 1.4), old workings (1.4 ledges), CERN ring (catwalks, raised control room).
  - Gotcha: a blocking railing hung over open lower ground reads as a false trap (the cell under it takes the railing's top) — make
    such railings `block: false`.
- Batch 3 (stone sites, realms, the Woods), one commit per room:
  - Vatican: catacombs (tomb tier at 1.6, loculi ledge at 3.2 with a high passage and a railed gap to the cistern ledge), basilica
    (rood loft bridge joining the galleries into a ring, raised apse with a curved balustrade, organ loft gap), archive (L gallery
    with a spur over the stacks, three ways up), cortile (terrace + north cloister walk one 2.4 level, gap over the west garden),
    observatory (roof terraces at 3.0 joined by a walkway, still a rooftop).
  - Camelot: ward (breaches in the wall-walk to jump, a north rampart at 6, parapets round), hall (west gallery, two walks across,
    one with a gap), keep (east gallery looping to the battlements, a rail across the hall), dungeon (stepped cells, upper route to
    the cistern, workshop loft), sky (east route to a piece beside the keep across a gap). Lodge: all flights wood, organ loft
    stair. Atlantis temple: stepped terraces round the dais, a gap on the back terrace (one water surface unchanged).
  - Giza: raised causeway (1.8) with an arm to a pier across a gap onto the pyramid, dig scaffolds over three courts, flights up the
    east face. Babel: round terraces, flights set in from the rim, walkway and platforms with a gap. Göbekli (keeps its own arena
    map): round court with a lookout on the tell top, spoil heap step + scaffold across a gap. Stonehenge: the bank a raised ring at
    1.8 in five lengths (gaps at the lanes with curved rails), avenue banks with a gap. Hand-drawn plan gotcha: a stair forces the
    ground open 3 m past its head and an outer bank's height adds on top, so outer banks can't take flights.
  - Temple city (causeway from its hall over the canal with a gap, forecourt, ball-court gallery; the plaza stays flat — it is the PvP arena window), crystal city (terraces one district, glass
    railings, gallery gap), Olympus (raised colonnade walk, loft stair), North Pole (timber walkway along the north wall, workshop
    loft stair).
  - Haunted grounds (porch balcony wings, bridges to the coach house roof and an upper terrace deck, upper plot, churchyard walk with
    a gap to the crypt roof), Looking Glass library (gallery ring round the reading room, galleries either side of the nave with a
    jump across), Hollow Earth gallery (mine stairs on built parts, upper loop), Mars (second flight up the pyramid top), Moon
    (pad steps, dish stair).
  - Woods (no doors, exits and culverts untouched): fairy clearing (knoll ledge, lookout and bank terrace with gaps), redwoods (root
    terrace + west deck across the gully), Dead Man's Cave (split sump ledge with a gap), ritual (west ledge), Bohemian Grove (log
    bridge, second treehouse across a gap, stage ramp → wood stairs), Shasta (shelf trail steps, north ledge across a gap),
    woodstair (side galleries, lighting unchanged).
  - Solver note: hqTerrainPockets' `lost` counts blocking railing tops as ground and does not count jumps; every gap side also has a
    stair or ladder.

### THE YARDS OPEN (2026-10-06, Disaster City invisible alleys)
mondo: gaps between Downtown's buildings looked like alleys (darker ground) but were invisible walls. Root cause: a `city`
plan's walker solid was the whole BLOCK mask (`solidMass`), and the buildings (info.lots) never covered all of it; the
alley carve / slit-closing pass (2026-09-22) only fixed some runs (Downtown: 22 slits it failed to close, ~5000 m2 of
bare mass). Now `_hqTGenerate` opens every mass cell no lot covers (inside the rim band) right after THE INFILL, keeps a
cell open only if the walker reaches it from the old open ground by small steps (a roof-drop pocket closes again), and
sets `info.yard`; three-renderer.js paints yard cells with the path (pavement) sheet instead of the dark cliff sheet.
Walker solid = the lots (buildings) + the rim + real walls. `gen.yardsOpen: false` keeps the old mass. Applies to every
non-podium city: Downtown, the Strip, Cyberpunk (the mall has `podium`).

**THE CLIMB, REAL CLIPS (2026-10-12, mondo: "use the climbing meshy animations instead of the swimming animation")**:
`HQ_CLIMB_CLIPS` now names MAL3 (lib 4) `Fast_Ladder_Climb` (ladder / fireescape / pipe / wall) and `Climb_Up_Rope`
(rope / vine / chain, slot `hqClimbRope`), both baked `pinHips` (the walker's own climb moves the body). `_hqTickChars`
paces the clip by `rate` (metres a second at ts 1: ladder 0.62, rope 0.23) against the climb speed, clamped 0.5-2.4,
plays it backwards going down and freezes it (timeScale 0) as the hang; no nose-up pitch with a real clip. Without lib 4
the old swim-stroke-stood-up chain still plays. `ClimbUp_1m` stays the mantle.

## THE FAIRY FOREST REBUILT (2026-10-24, mondo: "why does fairy forest look like shit? Is it still an old voxel map? Please fix")
- What it was: the FULL SITE (20×20, 6v6) was still the old voxel board (purple, chunky caps and crystals); the 12/10/9 arenas were
  cut out of THE WOODS' clearing (`site_prebuilt_fairy_forest_clearing`) hard under the treeline, so the fight sat in fog and trunks.
- Now: its own room `DOOR_HQ.rooms.site_prebuilt_fairy_forest_glade` (data.js, defined just before the arenas register): 70×70 m
  hqWoodsShell (fog 0.012/m, retro pack treeline + canopy), grass_2 / dirt_2 / rocks_5, the board in the middle: the fairy ring mark
  round the nexus, the middle path + two winding fae paths (the voxel's lanes), retro trees and the misc Meshy mushrooms as cover, a
  1.75 m knoll each side (one level; a rise under tierMin 1.2 m is floor), 180° symmetric. The low ring: ferns, stumps, logs, the
  spring, a brook, glowing mushrooms.
- The mushrooms on the board are TREES (HQ_TREE_KINDS `fae_cap` / `fae_cap_2`, foliage name `misc:<file>` → three-renderer.js
  _foliageUrl reads Assets/misc/) because a PROP on a terrain board is scenery only (hqFieldTerrainInfo blocks trees, not props).
- Lights: catalogue `fae_mushroom` / `fae_toadstool` (the same two GLBs + glow + point light), all a square or more OFF the board.
- Boards: HQ_ARENA_RULES.own.prebuilt_fairy_forest (20×20 at 10,10, `node bake-arenas.js --own prebuilt_fairy_forest`) and
  HQ_ARENA_RULES.within.prebuilt_fairy_forest (12 @14,14; 11 @14,14; 10 @15,15; 9 @15,15). The voxel stays as "Fairy Forest · voxel".
- 6v6 house: HQ_ARENA_TEAM_BY_SIZE[20] = 6 and hqArenaHouse lays a row of six (x 7..12) — the voxel had 6 spawns a side.
- TRAP: `bake-arenas.js --size N --apply` writes the WHOLE picksN block from the json; a json of one site wipes every other site's
  row. Bake one site at a size with `--json`, then merge its row into the block by hand (or bake all sites).
- The Woods clearing is unchanged; the Woods crystal fight (hqMarkerArenaId → `<site>_delta`) now fights in the new room.
- RESTYLED the same day (mondo, shown the shots: the old arena — the Woods clearing cut — "looks way better"; he picked "arena
  back + restyle full site"): the 12/10/9 picks are the clearing cut again (picks11 has no Fairy Forest row, as before), the
  `within` row is gone (so the Woods crystal fight is the clearing again), and the glade is the clearing's look: hqWoodsShell
  defaults (fog 0.03/m, the woods' mood), tall trees on the board (6-7.5 m, tree/tree_2/tree_3/tree_4/tree_5), dense groves, no
  mushrooms and no mushroom lamps. Only the 20×20 full site (HQ_ARENA_RULES.own) is cut from the glade. The fae_* catalogue rows
  and the fae_cap tree kinds stay in the palette, unused.

## THE GRID FIT, GROUP 6 (2026-10-26): the field-fight terrain rooms on the battle squares
mondo: "redesign the maps with the square grid in mind ... a ramp ... could easily just take up the width of one or 2 and sit
nicely in the grid". 38 site/zone terrain rooms + the garage kickers: every existing ramp, stair, deck, bridge, tier, wall and
tree moved/resized onto the 1.75 m squares (edges on square lines, k×1.75 from the room centre), nothing added or deleted.
- Terrain ramps a walker uses (≥ 2.2 m) are 2 squares wide: a 1-square terrain ramp never makes an IN square (side blends).
  Narrow ones stay 1 square with their side skirts outside it (w = 1.75 + 2·edge). Built flights read edge to edge.
- A ramp's top end stays tucked into its tier by the old overlap (the "ends off 0.7 m" the audit lists is that tuck, on purpose).
- Rooms sampled at 0.5 m now sample at `res: 0.4375` (a quarter square) and a moved tier/ramp lip is `edge: 0.2`: at 0.5 a
  cliff ON a square line smeared into the square beside it and that row dropped OUT. The huge rooms (sea, abyss, harbour,
  leylines, astral sea + library) keep 0.5. Soft banks (edge > 0.6, the Bermuda island's beach) keep their edge.
- Two same-height tiers that now meet on a line overlap 0.5 m (else each blends down at the line: a trough).
- Cave rooms (`gen.kind: 'cave'`) regrow their rock from the pieces: in the Nightmare only the moves that keep the cave whole
  were kept (3 fangs + its props stay put; the stage stair is 2 squares at x -15.75..-23.45, z -21); in the Oubliette the
  torch by the rock stays.
- Left round/slanted on purpose: the garage drum (ring walls, spiral, radial stairs), the harbour's slanted causeway, the
  mall ring bridges, the astral library's radial stairs, the Hell pit's slanted obsidian walls.
Plans + shots: /mnt/project-files/grid-fit/group6/.
## GRID FIT — GROUP 2 SITES ON THE BATTLE SQUARES (2026-10-26)
mondo: "redesign the maps with the square grid in mind" (ramps overlapping two tiles etc.). Group 2 = Area 51
hangar + flight line, D.U.M.B. motor pool + sub-level 7, CERN ring, Spaceship (derelict) deck, Singularity
horizon, Saturn hexagon, Mars Cydonia, Moon mare. Only existing pieces moved/resized in data.js; no new rules.
- Lattice lines are multiples of 1.75 from the room centre. Plateau/deck edges sit on lines; ramps/stairs/bridges
  run on an axis, 1 or 2 squares wide (1.75 / 3.5), foot on a line, sides on lines, never steeper than before.
- Stair head sits 0.4 m inside the tier rim (0.7 m where 0.4 left a stair-cheek invisible-wall spot). Bridges
  overlap a square onto each tier. Round pieces: odd diameter on a square centre, even on a corner.
- Strict plan rooms: a plateau whose edge lands exactly on a plan wall line leaves a trapped 0-height ditch row,
  so tiers that ran past a wall keep running under it (hangar catwalk/south deck/freight gantry, sub-level 7
  side room 3 + CH03 gallery). CH04 over-decks start at the catwalk edge x 17.5.
- Arena picks: all 32 (12/11/10/9 × 8 sites) keep their room + ox/oz; only the cells re-baked. To keep them the
  flight line tower deck stops at z -12.25, the hangar south deck at x -10.5, CERN beam dump moved to (35,7),
  hangar crane hook one square north.
- Not moved: Saturn hexagon walls (slanted by design), CERN control room (inside off-grid plan walls).
- Saturn (10.5,3.5) and Singularity (12.25,5.25) lowest floating stones are no longer reachable on foot in
  explore (were only via scattered rocks).
- Checked with the grid-fit tools (/mnt/project-files/grid-fit/tools/verify.js): traps 0, pads joined,
  invisible-wall counts ≤ main in every room. Plans + shots: /mnt/project-files/grid-fit/group2/.

## DISASTER CITY, THE 144 PLOTS — the new city room from mondo's plan (2026-11-13, BUILT ON THE BRANCH, WAITS HIS OK)
mondo uploaded `disaster-city-complete.zip` (a plan made in another chat): 12 x 12 plots, each 12 x 12 cells, nine districts of 16
plots (Southside, Civic Center, Financial / University, Hero Plaza, Entertainment / Industrial, Sports + Culture, Bayside), 216
buildings, 210 ground connections, 33 roof crossings, a 39-entry cast, the Bayside opening (the mall, the cordon, the police response).
The plan's data lives in `docs/disaster-city/` (city-layout.json = the source, plan-design.md, plan-direction.md).
- **The room**: `site_prebuilt_downtown_streets` since the swap (was `site_prebuilt_downtown_city`; data.js, between the `DC144-BEGIN` / `DC144-END` markers, WRITTEN BY
  `node bake-disaster-city.js`; never hand-edit it, edit the tool or the layout and rerun). 504 x 504 m, `terrain.res` 0.875. Today's
  Disaster City rooms (`site_prebuilt_downtown_streets` and its parts) are untouched and nothing leads to the new room yet.
- **The tailoring** (what the plan became): a plan cell = ONE battle square, 3.5 m (HQ_ARENA_RULES.squareDefault), so a plot is 42 m =
  exactly a 12 x 12 board. THE BOUNDARIES (mondo 11-13 13:14 "i dont like how it looks like the plots are separated by literal walls, and they are all the same wall", then 14:09 "there can still be walls ... get creative ... a row of flower pots, a gated fence, a picket fence, chained fences, police barracades, traffic cones, walls, some dumpsters, some trees ... hedges, benches"): bake-disaster-city.js THE PLOT EDGES + THE INFILL + THE BOUNDARIES. A building one square from its plot's edge grows into the plan's blocked band (buildings meet back to back); some of the band on a side the plan does not connect is built on (140 infill buildings); the rest gets a boundary picked per border from the district's list (LOW where the plan joins the plots, HIGH where it does not), two recipes alternating run by run: a fence (`k: 'rail'` rows with the STAIRS PACK's railings: wire_fence, wood_fence, spear, ranch, bars, guard, parapet, panel_fence ...; first outdoor use), a hedge (a wall row keyed `leaves_3`), a short wall in the district's sheet, or a row of planters / police barricades + cones / dumpsters / trees on the band's squares. The plan's ports stay the gaps. THE SQUARE'S MIDDLE (his rule, all battle maps): a thing that blocks or gives cover stands CENTRED on its square; a thing that does nothing in a fight (bench, bin, cone, pot, hydrant, signpost) stands OFF the centre (against a building / fence / the kerb), because a unit stands on the centre (`put`'s DECOR set). THE PLOTS' DRESSING: door flanks by district (planters / pots / a bin / a barrel), a service dumpster against a doorless wall (R E I B), benches + bins against fences every 4th square, kerb furniture every 6th square on both kerbs. THE SWAP (his decision card 14:10 "Replace today's streets with it"): the tool writes the room AS `site_prebuilt_downtown_streets` (part `streets`) with the old room's five doors as free doors at their plan places, and THE JOINS re-point the six link rows, the bay entry, the hub spot, the marker and the tape; the old room stays in the file as `site_prebuilt_downtown_oldstreets` (unlinked) because the site's fight board is cut from it (HQ_ARENA_RULES anchor + picks name it). ENGINE: `gen.noRescue` (no return-guarantee / door-carve pass on a drawn city; with doors the compile ran for minutes) and hqTerrainBridgesAt buckets a room's bridges on an 8 m grid (same answers). Headless: the fence pack (stairs_railings.glb, 31 MB) lands late; shots before it show no fences.
THE STREET FURNITURE (11-13, mondo: "so many street lamps ... fire hydrants? Vending machines? Bus stations?"): bake-disaster-city.js THE KERBS writes `terrain.gen.lamps` (the whole list, read by hqTerrainCompile in place of the capped auto lamps; three-renderer.js _hqBuildStreetLamps draws them, two shared materials so the instance pass batches them): 288 lamps on the line between two squares, +side kerb lines 2/8, other kerb 5/11 of each plot, plus the quarter points of a plot with no street. A hydrant on square 2 of the +side kerb, signpost on the other, bin on square 8; a bus_shelter on kerb squares 4-6 of every other plot column; vending machines two squares along the wall from a door (entertainment: pair at the first door; civic/university/sports/plaza/bayside: first door), off-centre against the wall.
  Named buildings = `texbuilding` rows with `hollow: true` (walk-in, the doorway on the plan's first door); the plan's filler buildings
  (Residence / annex, Local shop, Street kiosk / annex, Workshop / store) wear the painted building sprites; ten shop plots wear the
  Buildings pack's shop blocks; the Church wears `church_1`. The 42 roof-route buildings are `plateau` rows with `bld` (solid, the roof
  walked, all 7 m so every `bridge` row is level); the plan's inside stairs are fire escapes (a 3.5 m landing + two `climb` rows) at
  both ends of each route (18). Roads = `gen.kind: 'city'` streets (paint, manholes, lamps, traffic) with `gen.allOpen: true`; the
  ground sheets are `terrain.paint` per square. Storeys per district (the plan gives two floors to nearly everything).
- **Engine change**: data.js `_hqTGenerate` reads `gen.allOpen: true` (every node forced open, the per-node scan of the authored rows
  skipped: 1 500 rows x 260 000 nodes took two minutes, now the room compiles in about 6 s headless).
- **Measured** (headless, WebGL 2, after the static batch went live): about 210 to 440 draws from a high view; today's Downtown 984.
- **Not built yet**: doors (the mall concourse to `site_prebuilt_downtown_mall`, the tower to the lobby, a way in from DOOR HQ),
  the three Bayside gates (service pass, mall cleared: open gaps today), people / the encounter table, a second doorway on a building,
  upper floors, the future version, a helicopter (no model in the game).
- **Gotchas**: a ladder's foot within 0.3 m of a SECOND roof climbs the wrong one (the tool keeps a landing's square clear of other
  buildings); the batch only goes live once every asset has landed (headless: 5 minutes; before that the same view reads 3 000 draws).
- Proof: /mnt/project-files/disaster-city-144/ (plan_map.jpg + six in-game shots).

## DISASTER CITY, THE SHARED PIECES — the city door, the shop blocks at true size, the front rule (2026-11-13)
mondo: "any new buildings you make that will have an interior need workable swinging doors, just like Door HQ" + "for the shop center
buildings from the asset pack ... make sure their scale is correct, right now they are way too small and i am taller than the door".
Built for the nine district threads (each owns its 16 plots); NOT SEEN ON SCREEN (RULE #1c: no browser run), checked by reading + node --check.
- **THE CITY DOORS** (three-renderer.js `_hqBuildTexDoors` / `_hqTickCityDoors`, `HQ_CITY_DOOR`): every `texbuilding` row with `hollow: true`
  hangs a swinging leaf in its doorway by itself. No new row kind. Row fields: `leaf: '<DOOR_HQ.catalogue swing leaf key>'` (default
  `leaf_lobby_glass_double`, the HQ's double door; e.g. `leaf_shabby_wood`, `leaf_security`, `leaf_office`, `leaf_exit`, `leaf_suburban`),
  `leafDouble: true` = two of a single leaf, `leaf: 'none'` = the bare doorway. The doorway is still `door: <face square from the left, 1-based>`
  (one 1.75 m square wide, 2.2 m high). The leaves open within 2.6 m of the doorway and swing AWAY from the walker. Drawn only (the walker's gap
  is hqTexBuildingRows'). Pack and prism buildings are solid: no doorway, no leaf. Kill switch `window.EW_NO_CITY_DOORS = true`.
  Records: `_hq.cityDoors` (room metres). Not done: a door sound, NPCs opening it, a locked state, online (walking is local, nothing to relay).
- **THE FRONT RULE** (bake-disaster-city.js): a texbuilding's `w` runs ALONG ITS FRONT, `d` back from it (the row's own turned frame). The tool
  wrote the plan's x / z sizes unturned, so every east / west facing building that was not square (named ones and the infill) stood a quarter
  turn off its footprint. Fixed; `plateau` rows and the tool's `bInfo` (`w` / `d2`) stay world x / z.
- **THE SHOP BLOCKS AT TRUE SIZE**: a pack block (data.js HQ_PACK_BUILDINGS) is one model fitted to the row's `w`, so `w` IS its scale: a 33 m
  block on a 10.5 m front stood at 0.3 to 0.6 size (a 1.1 m door). bake-disaster-city.js `packFit(frontMetres, depthMetres, want)` picks the
  block, or two / three side by side, that fills the front at 0.9 to 1.15 of true size with the depth stretched 0.7 to 1.5; the front is the
  first door side that takes one; a front nothing fits (under 14 m) wears the painted `shop`. RULE for a hand-written pack row: `w` within
  0.9 to 1.15 of the block's own `w`. Today: Repair shops 00 (0.99), Pawnshop 09 (1.04), Tailor 08 (0.90), Coffee arcade 09 (1.04), West shops
  09 (1.04), Restaurant court + East shops = 08 + 09 side by side (0.97). Corner shops, Bookshops, Costume shops are roof-route tiers (no pack).
- Pack building claims between districts: `docs/disaster-city/pack-claims.md`.

## DISASTER CITY, THE ARCHITECTURE ROW — `k: 'arch'`, a building's look as a list of parts (2026-11-13, shared by the nine district threads)
mondo: "use different materials/textures and tint them to match your vision for the building ... use more complex geometry for some
buildings, domes, roof tops, modern architecture, curves". The texbuilding is a box in one global tint, so every district needed the same
thing; ONE row kind does it (Sports + Culture thread owns it). Seen in the game (headless, a test Museum: portico, dome, tints).
- **The row** (three-renderer.js `_hqArchGeometry` + `_hqBuildArchRows`; data.js hqRoomExpand hands `info.arch`): `{ k: 'arch', id, x, z,
  rot (degrees clockwise, as a texbuilding: the front is the row's +z), y (the foot; none = the ground), parts: [...] }`. DRAWN ONLY: the
  walker never reads it. One mesh per material per row (never a city-wide mesh, so the plot chunks cull a building whole): one row per building.
- **A part**: `s` (shape), `p: [x, y, z]` (its foot centre in the row's frame), `ry` (degrees), `key` (a sheet: `urban:<Name>`, a terrain
  key, `hq:<name>`; none = a plain colour), `tint` (0xRRGGBB over the sheet), `tintTop` / `tintEnd` (for keyTop / keyEnd; none = untinted),
  `glow` (0..1, a sign / lit glass), `gain` (a number over 1: the sheet's tint times it, past white, for a painted pastel wall; Bayside), `kind` ('wall' | 'glass' | 'over' = cut-out decal), `ds` (two-sided), `roof: true` (hidden with HIDE
  ROOFS), `uv` (metres a repeat spans, a number or [u, v]; 'fit' = once across the face), `n` + `step: [dx, dy, dz]` (repeat),
  `ring: { n, r, a0, arc }` (repeat round a circle, each turned outward).
- **The shapes**: `box` size [w, h, d] (keyTop, top: false, sides: false, faces: 'fblr', under: true) · `cyl` r, h (r2 = a taper, 0 = a
  cone; seg; arc + a0 = a curved wall; ri = a hollow ring; cap: false) · `dome` r, h, rz (arc + a0 = a half dome; seg, rings) · `roof`
  form 'gable' | 'hip' | 'pyramid' | 'shed' | 'barrel', size [w, h, d], the ridge along x, a shed's high edge at -z (over = eaves, keyEnd,
  seg) · `quad` size [w, h], a panel facing +z (hole: [x, w, h] = a doorway cut from its foot; flat: true = lying, facing up) · `poly`
  pts [[x, z]...] convex, h.
- **Collision, the inside, the walked roof** stay with the rows that already do them, with their own faces switched off: a `texbuilding`
  with `skin: false` keeps its ghost walls, roof slab, doorway, city door leaf and hollow inside and draws no outside; a roof-route
  `plateau` with `bld: { skin: false }` keeps its walked top (and still draws that roof slab) and draws no faces. Put an arch facade about
  5 cm proud of the footprint. Things that stand outside the footprint (columns, canopy posts) need their own ghost `wall` rows if they
  should block. Catalogue models are ordinary room props, not parts.
- A doorway on a walk-in building: hqTexbDoor(row) gives its `lx`, `cw` (1.74 m) and 2.2 m height; cut the same hole in the arch front
  with `{ s: 'quad', p: [0, 0, d / 2], size: [w, h], hole: [lx, cw, 2.2] }`.

- **THE CITY'S WHOLE BUILDINGS** (PR after #1264): twelve catalogue props `city_*` (data.js, after the town houses): pizzeria, diner, BurgerPiz,
  6twelve, laundry, VHS shop, house, Quequis house, gas store + gas canopy (walked under) + gas price sign, taco stand. Cut from the
  Elbolilloduro scenes by `bake-pack-pieces.py` (jobs `city_*`; a region may now be a `box`), outside only, real size, entrance +Z, solid `rect`.
  Run: `pip install bpy`, `apt-get install unrar`, unpack `/mnt/project-files/asset-packs/elbolilloduro/<slug>/*.rar` to `<dir>/<slug>/`, then
  `python3 bake-pack-pieces.py -- --packs <dir> --out <out> --only city_pizzeria,...`. Files: R2 `Assets/world/packs/elbolilloduro/ebd_<scene>_city_*.glb`.
  They are PROPS, not HQ_PACK_BUILDINGS, on purpose: a prop is never fitted to a footprint, so its scale cannot go wrong. Not seen in the game
  (Blender renders only: /mnt/project-files/disaster-city-shared/pack_buildings_cut.jpg). The laundry's roof sign renders blank orange in Blender.

## HERO PLAZA, THE BUILDINGS — the district architected (2026-11-13, mondo's OK 17:12 "looks good")
mondo 11-13: nine district threads "architect the buildings in their respective districts plots ... every building should be unique and
purposeful and recognizable". Hero Plaza (plots x4..7, y4..7 of the 144; room metres -84..84) is laid out like a theme-park hub: the
Superhero Tower is the weenie seen from everywhere, every walk ends at a clear silhouette. Plan doc: https://claude.ai/artifact/36EML6wNh4PjGRH6u2hzhy.
- **The file**: `docs/disaster-city/districts/H.js` = every building as a parts list (`B`, by the plan's building id), the open
  ground's drawn pieces (`OPEN`: the plaza's colonnade + bandstand + flags, the memorial's curved wall + obelisk + flame, the two avenue
  gateways) and one swap (`SWAP`: the Local shop's lot wears the chain pizzeria `city_pizzeria` at real size, mondo 17:07 "a chain").
- **The tool**: bake-disaster-city.js THE DISTRICT FILES calls its `build(ctx)` after all other passes
  (no random number drawn: no other district's rows move) and writes one `k: 'arch'` row per building. The plan's own row keeps collision,
  inside, door and walked roof with `skin: false`; a file's `row` says what else changes (storeys, leaf, solid, hollow + doorSide, pack +
  packSide, replace = smaller footprints, remove = walked through).
- **The 23**: News office (art-deco ziggurat, copper-green cornices, mast) · Hero workshop (brick, sawtooth roof, roller shutter) · pizzeria ·
  Workshop store (ochre brick, green gable) · Superhero Tower (columned marble podium, glass shaft + white fins, round drum, overhanging
  observation ring, gilt dome + pyramid + spire, about 88 m) · Press court (glass pavilion under a floating slab) · Apartments A · Coffee
  arcade (glass barrel vault, striped arcade, a giant cup) · the pack shop block at true size (pack_bld_09) · the plaza · Training hall (brick
  armory, four turrets, glass monitor; roof route) · Tower service (plant: cooling towers, striped stack, tank, pipes, dock) · Apartment
  stair (tenement, iron stair face, water tower) · Townhouse row (three gables) · the memorial · Transit court (tile station, canopy, clock
  tower; roof route) · Office court (teal slab on stilts, fins, round stair tower) · the Annex (stone pavilion; roof route) · Market steps
  (cobble terrace, three tent stalls, walked through) · Kiosks · Delivery yard (depot, shed roof, dock) · Dispatch office · the Gateways.
- **Inside** (hollow texbuilding + the city swing door): News office, Hero workshop, Tower, Press court, Coffee arcade, Tower service,
  Apartment stair, Office court, Delivery yard. The three roof-route buildings (Training hall, Transit court, Annex) stay solid plateaus:
  their roofs are the route. Furnishing = a later pass (the Metro pack's pieces belong in the Transit court).
- **Rules learned**: a tint MULTIPLIES a sheet (and the city's building tint multiplies again), so pale tints on pale sheets; his glass
  sheets are dark window grids, lit with the part's `glow`. `gold` = the terrain key (gilt.png); never the gold*.png files, not even in a
  mock-up. The arch row has no lettering: sign boards are plain panels until a lettering part exists. No tilted parts: a stair flight is
  stepped boxes, an arch is a barrel roof on a beam.
## DISASTER CITY, BAYSIDE — the district's architecture (2026-11-13, thread "Design Bayside district buildings")
mondo's district ask (16:41) + "bayside needs to have the actual bayside in it too (the beach), with sand and a pier and stuff" (17:05) +
his OK on the plan and mock-up ("looks good", "yes add sea wall and water", 17:11). Plan doc: https://claude.ai/artifact/S8nPJ2AF6soGsNFSgf9VkL.
- **Where the code is**: `docs/disaster-city/districts/B.js` (the district hook of `node bake-disaster-city.js`, PR #1274). `tailor` turns the
  cinema and the mall WEST (a W door unshifted onto P10-08-B1 / P10-10-B1, so the mall's link door stands in the portal). `apply` switches
  every Bayside building's own outside off (`skin: false` / `bld.skin: false`) and pushes one `k: 'arch'` row per building (`dc:<id>:arch`);
  each building is a function `B.<name>(W, D, lx)` of its row's front, depth and doorway. Edit B.js, rerun the bake, never the data.js block.
- **The look**: a pastel waterfront. Painted walls = a stucco / plaster sheet under a pastel tint with `gain` 2.3 (the city's building tint
  under a mid-grey sheet turned every pastel to mud: seen in the game); trim = plain colour; glass = the urban glass sheets, tinted, `glow`.
- **The buildings** (plan numbers): 1 hotel (9 storeys, eyebrows, round glass corner tower + mint dome, fin, canopy; walk-in) · 2 surf + bait
  shack · 3 West shops (pack block, untouched) · 4 ice cream parlour (roof route) · 5 boat workshop (barrel roof) · 6 cinema (stepped front,
  half-ring marquee + glass drum, 26 m blade; walk-in, faces W) · 7 lookout pavilion (P11-08 east strip) · 8 market hall (three gables on
  posts; walk-in) · 9 taco stand (`city_taco_stand` prop) · 10 florist (round glasshouse) · 11 food hall (roof route) · 12 security office
  (roof route) · 13 staff apartments · 14 loading dock (sawtooth; walk-in) · 15 parking booth (roof route) · 16 mall arch (Arrival court,
  two ghost pylons) · 17 bandstand (Cordon plaza) · 18 mall (four hip-roofed wings, glass cross vault + dome, coral portal W; walk-in) ·
  19 East shops (pack blocks, untouched) · 20 juice bar (the orange) · 21 carports (P09-11; the parked cars keep their squares) ·
  22 harbour master (P11-11, a new solid `texbuilding` row `dc:bay-harbourmaster`).
- **Seen in the game** (headless, playtest_city.js copy, `teleport` with `y` = a raised first-person camera): all 22 draw, colours right.
  Shots: /mnt/project-files/disaster-city-bayside/game_*.jpg. NOT walked: the swing doors and the insides (the interiors are a later pass;
  the food hall and the security office are roof-route tiers, solid until then).
- **Known**: no lettering part exists in the arch row, so the signs (hotel fin, cinema blade, name bands) are blank colour. The roof
  routes' fire-escape landings (grey tiers) stand in front of the ice cream parlour and the security office: the city tool's, not Bayside's.
  The pack models (West / East shops, the taco stand) draw near-black in the headless probe only.
- **Next: THE BEACH** (same thread): the room grows east of Bayside: sea wall, boardwalk, sand, the bay (terrain.sea), pier + pavilion,
  breakwater + lighthouse, lifeguard station, the BurgerPiz grill on a deck.
- **THE BEACH (second delivery, 2026-11-13).** Outside the plot grid, along Bayside's east side: `B.js beach()`. From the city's edge
  (x 252) east: the boardwalk (2 squares of planks, palms, benches, a spear rail on the sea wall), the sand shelf (y -1.05, about 19 m,
  umbrellas, loungers, two lifeguard chairs, the volleyball net, the lifeguard hut), the bay (`terrain.sea` y -1.45, `field: true`; the
  floor falls to -3.6), the PIER on the mall's axis (z 189: `deck` rows + the arch row `bay-pier`, the octagon pavilion at its head, the
  bait hut), the BREAKWATER north (a concrete mole to a round head, the Marina's lighthouse stands on it), the GRILL DECK south
  (`city_burgerpiz`, real size). Four ways out of the city (`WAYS`: plot squares turned to 'P', the edge rail / wall cut in `build`),
  a sand ramp at each.
- **What the beach added to the shared tool (every district may use it).** A district file may export
  `room = { east, sea, backdropOpen }`: `east` = squares the room grows on EACH side (the field is centred, so no coordinate moves; the
  west strip is closed by a ghost wall and the skyline stands inside it: `terrain.backdropInset.w`), `sea` = the room's `terrain.sea`,
  `backdropOpen` = boxes [x0, z0, x1, z1] the skyline ring leaves empty (three-renderer.js `_hqBuildCityBackdrop`). `ctx.paintCell(cx, cy,
  sheet)` paints a square outside the 144 x 144 grid. THE GROUND PALETTE IS FULL (8 sheets: the city's 6 + `wood_planks` + `desert`).
  The room is now 644 m wide (shell w), 504 deep.
- **The beach against THE LEVELS.** Outside the grid the slope carries the edge plot's level outward, so every beach row is `absY: true`
  and the strip is first cut flat to 0 (a `sink` plateau); the Marina plot (level 1) comes down a 7 m ramp across the boardwalk. North
  of Bayside the city's edge stands up to 21 m over the water as a cliff.
- **NOT PROVEN in the headless browser:** no `city_*` pack building (the grill, the taco stand; also the diner, pizzerias, laundry in
  other districts) attached in the thread's probe runs: only the shadow blob draws. The files are on the CDN and fetched. Check on a real
  machine before blaming the placement.

## DISASTER CITY, SPORTS + CULTURE (2026-11-13, district S: plots P04..P07 × rows 08..11) — `docs/disaster-city/districts/S.js`
mondo's OK 17:20 ("Yes, build it") on the plan with THE STADIUM (his 17:17: "is this not where the football field is supposed to go?", pick "Stadium on 4 plots, 3/4 size field").
- One file, loaded by the bake's district hook. `tailor` rewrites the plan's squares; `apply` turns each plan row into collision only (`skin: false`) and pushes one `arch:S:<id>` row per building, plus `dc:S-*` rows (blocks nothing is drawn for: stands, kiosks, mast feet, the drum on the Wrestling hall roof, the clinic's glass corner).
- THE STADIUM = Park west + Park east + Practice court + Locker rooms (plots renamed `Stadium`, `wasName` keeps the plan's). Squares: `G` grass (nothing is ever placed there), `I` stand, `P` concourse. Field 77 × 35 m = 22 × 10 squares (x -80.5..-3.5, z 150.5..185.5), a sideline row each side, a stand 70 × 14 m each side (solid), goal posts on the end lines at the corner of four squares, masts + scoreboard posts on square middles (blocked). The grass is the ground's own sheet; stripes, end zones and lines are `kind: 'over'` flat quads at 2 to 4 cm.
- Walk-ins (hollow, swinging door from the shared row): Museum (3 storeys), Training gym (2), Equipment depot (1), South gatehouse (1). A walk-in's ceiling is a slab at storeys × 3.5 m in its arch row (the inside walls stop there). The door hole's x = -w/2 + (door - 0.5) × 1.75.
- Roof route kept (Gallery, Wrestling hall, Clubhouse, Arena loading dock, Sports clinic: `bld.skin: false`). The Wrestling hall has flag towers on its two FRONT corners only (the roof bridges land on the back ones).
- The Museum faces SOUTH, not the plan's north (its portico on a three-square forecourt that runs into the stadium concourse); the Band shell is solid (its stage shows through the open front). The two street kiosks are 2 × 2 squares. THE PIZZERIA = the shared chain prop `city_pizzeria` at (-31.5, 246.75) face 90 on six squares by three (the plan's Vendor stalls building is gone); four stalls on squares beside it.
- GOLD = key `'gold'` (the gilt sheet) on the Wrestling hall and the Clubhouse band. Thin posts stand on the lines between squares; anything thick on a square's middle has a block under it.
- NOT DONE: no gas station (it needs about 28 × 45 m, the road plots have 10.5 m: the South gatehouse stands there); the Playground pack is not used (the park is the stadium now); no signs / lettering; the stands are solid (nobody climbs them); the Giant Ape's home was Park west (asked mondo, default: the field).

## DISASTER CITY, CIVIC CENTER — the 28 buildings of district C (2026-11-13, mondo's OK 17:11)

District C = plots x 4..7, y 0..3 of `site_prebuilt_downtown_streets`. Everything lives in ONE file:
`docs/disaster-city/districts/C.js` (the shared district hook of bake-disaster-city.js loads it; `apply(ctx)`).
- Authoring: `plot(px, py, fn)` then one `B(i, spec, fn)` per building, parts in LOCAL PLOT METRES with the helpers
  box / cyl / cone / dome / roof / vault / door / ring / flag / face. `toArch()` turns each building into ONE
  `k:'arch'` row (id `arch:<building id>`): 28 rows, 586 parts. Gold parts use key `gold` (never the riveted sheets).
- Collision: the tool's own texbuilding / plateau rows stay, with `skin:false` (ghost walls). `spec.solids` resizes them
  or adds extra ones (`-c<i>`); `spec.ghost` adds ghost wall rows (colonnades, towers); `spec.cells` takes plan cells.
- NINE WALK-INS (hollow + the city swing door, one doorway each): Fire Station E, Civil Records W, City Hall S,
  Council annex S, Courthouse S, Police E, Time Bureau W, Military offices N, Permit offices N. The interiors
  themselves are NOT built yet (empty shells).
- ROOF-ROUTE tiers keep the flat walked roof at 7 m and stay solid: Holding annex, Bail bonds, Public library,
  Records garden, Army surplus. The landmark shapes (reading room, glasshouse, guard tower) stand on that roof.
- Flattened from the mock-up: the raised stairs / podiums of City Hall, Courthouse and Library (ground level, so the
  doors work). City Hall has the south door only.
- The two open plots: Civic plaza (bandstand + plaza clock), Transit square (metro entrance, ticket rotunda, bus bays).
- Texture findings (tints only darken; the city tint 0xa8a49c multiplies again): `marble_light` is the clean stone;
  `marble`, `marble_2`, `rocks_1` are cobbles; roofs / domes / trim = `aluminium` tinted; PlasterWallPainted1a /
  Stucco1a for tinted bodies (the 2x ones carry a base band); bricks_1 tinted = red brick.
- Mock-up source (standalone three page): `docs/disaster-city/civic/`. Plan: https://claude.ai/artifact/TA61UXvfBcUexNL9yhJ19n

## DISASTER CITY, THE ENTERTAINMENT DISTRICT — the buildings, exteriors (2026-11-13, plots P08-04 .. P11-07)
mondo 11-13 16:41 (architect every building, unique + recognizable) and 17:08 on the plan: "looks good, and remember this is basically
replacing the strip that is currently in the game". File: `docs/disaster-city/districts/E.js` (the `build` stage of THE DISTRICT FILES);
rerun `node bake-disaster-city.js` after any edit.
- How a building is written: `B(id, { walk, st, open, leaf }, b => …)`. It keeps the tool's collision row (`texbuilding` / roof-route
  `plateau`) with `skin: false` and pushes ONE `k: 'arch'` row `dc:<id>:arch` (31 rows, about 5,100 triangles for the district). `walk`
  = hollow shell + the city swing door in the plan's doorway; `open` = no collision row (the Night market canopies). The helper `b` has
  box / cyl / dome / roof / walls (door hole cut) / top / trim / face / canopy. Sheet tints are lifted ×1.7 (the urban sheets are mid grey).
- The 27: Casino (marble, gold trims with terrain key `gold`, domed corner tower, canopy), pawn kiosk, Costume shops (jettied upper floor,
  roof route kept), mask shop, tailor (saw-tooth), Concert hall (podium + drum + dome + fly tower + glass lobby), Recording studio, lofts,
  Restaurant court (trattoria, ramen, rooftop grill), burger drive-in (giant burger), Comedy theater, Backstage dock, crew canteen, Film
  studio (barrel vault + water tower), Night market, noodle bar, Cabaret (turret), magic shop, prop store, Stage workshop, Arcade,
  apartments, bakery, kebab, Crew house, box office (octagon lantern), Cinema (stepped deco front, fin).
- Carried over from the Strip: a wedding chapel (P11-07), the fountain plaza with palms and benches (P11-04), the Casino. Plus the taxi
  canopy + dispatch booth (P08-07) and the pack `city_vhs_shop` (P09-04, face 270).
- Walk-in shells now (door hung, empty inside): Casino, Recording studio, Restaurant court, Comedy theater, Cabaret, Stage workshop,
  Arcade, bakery, Crew house, Cinema. Interiors are the next pass (Casino -> `site_prebuilt_strip_casino`, chapel -> `site_prebuilt_strip_chapel`).
- Open: marquee and sign panels are blank glow panels (the arch row has no text part); the texbuilding roof slab sits at storeys × 3.5 m,
  so a shell's drawn walls must reach that height. NOT SEEN IN THE GAME: the cloud browser timed out on the full city; checked by drawing
  the baked rows with the game's own `_hqArchGeometry` offline (/mnt/project-files/dc-entertainment/). Tints and the VHS shop's facing
  want a look on mondo's Mac.

### HERO PLAZA, proven in the game (2026-11-13 evening) — four things the first bake got wrong
- **A roof-route building's arch row needs `y: 0`.** An arch row with no `y` stands on the ground under its origin, and under a roof-route
  `plateau` that ground is the 7 m roof: the Training hall, Transit court and Office annex floated on a dark terrace block. districts/H.js
  writes `y: 0` on every arch row whose collision row is a plateau.
- **The tool's back-lot infill** (`dc:in<n>`, the same pack sheet over and over) stood on the plaza's north edge in front of the Workshop
  store and the pizzeria's corner; `build()` drops the infill rows in that band (by place, not by number). The other infill rows stay.
- **A tint multiplies the sheet**, so a blue tint on the red corrugated sheet (MetalCorrugatedPainted2a) is near black: the yard wears the
  blue sheet (…5a), the slate townhouse roofs the grey one (…1a). Pick a sheet of the colour, then tint.
- **The shade lift**: every textured part with no glow of its own gets `glow: 0.16` (`LIFT`), since a sheet in the city's shade read near
  black in the headless browser. The city_pizzeria prop's entrance faces the plaza with `face: 180` on the N side (proven on screen).
- Probe recipe that worked: scratch copy of playtest_city.js, routed responses one at a time, 320x200 while loading, then 1280x800;
  first-person views with `ThreeRenderer.hq.dev.lookAt(x, z, pitch)` in the view's `eval`, overviews with `y: 55`.
## DISASTER CITY, THE TRAFFIC — traffic lights, car routes, Bus Line 1 (2026-11-13, mondo's OK on the plan 17:33)
mondo 11-13 17:20: "get some traffic lights and intersections planned out for actual traffic and car routes. Bus sections placed in each
district with a bus route". Plan + mock-up: `/mnt/project-files/city-traffic-plan/` (traffic_plan_map.jpg, traffic_models_found.jpg).
- THE ROADS (city-layout.json, plot coords): west avenue x = 3, east avenue x = 8 (and x = 11 south of the cross street), north street
  y = 1, cross street y = 7, south street y = 11. Those street names are labels in notes only, not canon. The plan has NO road out of the
  city: the west avenue stops at the Boxing gym (P03-00) and the cross street at the Campus gate (P00-07). Police streets (parked police
  only, no moving car): x = 8 south of the cross street, the south street east of x = 8, x = 11.
- THE MODELS (no Meshy; all Elbolilloduro CC0, cut by `bake-pack-pieces.py` jobs `street_signal`, `transit_bus`, `bus_stop_sign`, R2
  `Assets/world/packs/elbolilloduro/`): `ebd_pizzeria_street_signal.glb` (the yellow three-faced head on a mast arm, 7.38 m, 970 tris),
  `ebd_busstop_transit_bus.glb` (the blue city bus with its four tyres and door leaves joined on, 11.2 m, nose at -X, 6,482 tris),
  `ebd_busstop_bus_stop_sign.glb`. Catalogue rows `street_signal`, `transit_bus`, `bus_stop_sign`; the traffic's vehicle kind `citybus`.
  The battle maps' coded `traffic_light` prop is another thing and is untouched.
- THE ROOM ROWS (terrain, written by bake-disaster-city.js "THE TRAFFIC" + "THE BUS LINE"; data.js passes them through beside `traffic`):
  `signals: [{ x, z, arms: 'NESW', off, flash }]`, `busStops: [{ x, z, name, end, signs: [{ x, z, ns }] }]`, a route's `bus: true`.
- THE SIGNALS (three-renderer.js `_HQ_SIGNAL`, `_hqBuildSignals`, `_hqTickSignals`): lights at (3,1) T, (3,7) and (8,7) crossroads, one mast
  for every arm traffic comes in on (11), its pole on the kerb corner to the driver's right, the arm over his lane; the police staging T
  (8,11) blinks red (3 masts). The file's lenses are painted all lit, so each lens wears a flat disc the code paints bright or dark; the
  lens spots are MEASURED in Blender (metres off the GLB's box middle). Clock: 14 s green, 3 s yellow, 1.5 s all red, then the other street.
- THE CARS (`_hqTickTraffic`): a car stops with its nose at the stop line (11.5 m before the junction's middle, where the road paint already
  draws the line) on a red, or a yellow it can still stop for; it queues behind a car of ANOTHER route in its lane (before: only its own
  route's); two cars turning into one lane, the first in the list goes; a knot of cars with no red behind it lets one drive through after
  5 s. THE TURN-ROUND (`_hqRouteCorner` `u`): a route that doubles back swings a half circle from its lane into the lane coming back.
  A vehicle further than 210 m from the camera is not drawn (it still drives).
- THE ROUTES (16 vehicles, 5 before): the ring both ways 3 + 3; the west avenue run (the avenue's north end to the cross street's west
  end, turning round at both dead ends) 4; the freight run (campus gate, west avenue, south street, round short of the police line) 2
  trucks; the strip taxis (cross street east end) 2; Bus Line 1, one `citybus` each way (the police line, south street, up the west
  avenue, round the ring, back down), waiting 8 s at each stop.
- THE STOPS: nine, one per district: Southside P03-02, Civic Center P04-01, Financial P08-02, Entertainment P08-05, Hero Plaza P06-07,
  University P03-05, Industrial P03-09, Sports + Culture P04-11, and BAYSIDE GATE, the line's end on the south street at the district
  line where the police cars start. A stop uses the plot's shelter; five plots had none on their road and got one (three free kerb
  squares in a row, without moving a lamp, hydrant or bin). Each stop: a sign pole by the shelter and one on the kerb across the road.
- THE CULL: each junction and each stop is one group in the plot chunks' list (`_hqSignalChunk` → `_hqChunkReg`, not drawn past 230 m /
  150 m or off camera) and flagged `_ew_hqSignal` so the static batch leaves it alone. Off: `window.EW_HQ_NO_SIGNALS`.
- Probe: `ThreeRenderer.hq.dev.traffic()` = every light's colours and every vehicle's place, speed, wait.
- NOT SEEN IN THE GAME: the headless browser run was refused (RULE #1c). Checked offline instead: the game's own route, signal and
  traffic functions run in Node for a simulated hour on the baked rows: no car ran a red, the longest wait was 20 s (one red), every
  vehicle kept lapping (a bus lap is about 9 minutes), the paths have no jump through the turn-rounds. Unseen and wanting mondo's eye:
  each mast's facing and where its lens discs sit, the bus's nose direction, the sign poles' facing, and the frame rate.
- Open: the plan's roads have pavement bands across them at some plot edges (P03-02, P08-05, the junction plots); cars drive over them.
  Left turns cross oncoming cars without waiting. Stop names are in the data but shown nowhere yet.

## DISASTER CITY, THE INDUSTRIAL DISTRICT — the 28 buildings of district I (2026-11-13, mondo's OK 17:05)
Plots x 0-3, y 8-11 (room x -252..-84, z 84..252). All of it lives in `docs/disaster-city/districts/I.js` (`build(ctx)`); rerun `node bake-disaster-city.js`.
- **How a building is made:** its `dc:<id>` row becomes a `texbuilding` with `skin: false` (the walls you bump into, the roof slab, the doorway, the city swing door)
  and an `ind:<id>` `k:'arch'` row draws the look. `DESIGN[<id>]` = `{ inside, st, leaf, extra, parts(c, C0) }`; `c` = the baked footprint (w along the front, d2 deep),
  so a design follows the plot if the plan moves. Helpers: `body` (solid box or hollow shell with a door hole), `truss`, `bay` / `bayX` (roller doors), `vents`, `house`.
- **Walk-ins (11):** Freight gate, Power station, Machine shop, Loading office, Aerospace lab, Port office, Maintenance depot, Hangar, Water works, Rail service,
  and the Pump court sewer entry (`leaf: 'none'`). The rest are solid.
- **Roof route:** Warehouse, the corner shop and Container court stay `plateau` rows (flat 7 m); every arch row carries `y: 0` so it stands on the ground, not on the plateau top (fixed PR after #1279). Freight gate + Loading office became hollow 2-storey texbuildings
  (roof slab at 7 m); NOT walk-tested from the bridges.
- **Landmarks:** Power station (barrel roof + two striped stacks), Aerospace lab (dome + vault + control tower), Port office (green pyramid lantern), Container court
  (a stack of tinted containers on the roof), the Dock Edge gantry crane (`ind:crane`, truss parts; the game's `crane` is a horizon model, not a room prop).
- **THE INDUSTRIAL PACK:** domi236 PS1/PSX Industrial Pack #1 (CC0), cut by `bake-pack-pieces.py` (`ind_*` jobs, scale 0.4694 = a real 20 ft container) to R2
  `Assets/world/packs/domi236_industrial/`. Catalogue keys, free for every district: `ind_container` (2.4 x 6.1 x 2.15, a row may carry `y` 2.15 a level to stack),
  `ind_skip`, `ind_skip_full`, `ind_silo` (9.1 m), `ind_vent`, `ind_panel`, `ind_factory_red` / `_tan` / `_blue` (whole factory fronts; cut, not placed yet).
- Checked in the cloud browser with a free camera over each plot (WebGL2). Not placed: the space shuttle (a horizon model only).

## DISASTER CITY, SOUTHSIDE — the buildings of district R, exteriors (2026-11-13, mondo's OK 17:14 "pizza yes, ok")
Thread "Design Southside district buildings". Plots P00-00 .. P03-03 (the city's north-west corner, world x and z under -84). All of it is
`docs/disaster-city/districts/R.js` (the district hook: `apply` + `build`); nothing of it is in the shared tool. Rerun `node bake-disaster-city.js` after an edit.
- **The look**: old working neighbourhood. Brick, painted plaster, stucco, ribbed metal, timber; every building its own tints; pitched, hipped, barrel,
  sawtooth and shed roofs; overhangs, awnings, cornices, chimneys, water towers. Each building is ONE `k: 'arch'` row (`dc:<id>-arch`, `y: 0`).
  **An arch row over a roof-walk plateau MUST carry `y: 0`**: without it the row takes the ground under its origin, which is the plateau's 7 m roof, and
  the whole front floats a storey up (seen in the first browser run).
- **Collision**: the building's own `texbuilding` row stays with `skin: false` (ghost walls + roof); extra wings are `wall` rows with `ghost: true`.
  The five roof-route buildings (P01-00-B1, P01-00-B3, P02-00-B1, P02-01-B2, P01-01-B1) keep their `plateau` with `bld.skin: false`: the roof is still walked.
- **Walk-in (hollow + the city swing door)**: the Church, the Bakery, the Boxing gym, the Community kitchen, the Dojo, the Auto garage, the Pawnshop. The rest are fronts.
- **The buildings**: Church (tower, apse dome, east front) · Townhouses · Bakery · Bike workshop · Laundry terraces · Boxing gym (barrel roof) · Row house ·
  Community kitchen · two apartment blocks (alike on purpose) · Corner shops (a Buildings-pack block `pack_bld_09` at 1.0 of its true width + a four-shop arcade) ·
  Tenement with its fire stair · Walk-up flats · Dojo · Bus depot (office + barrel canopy) · Market hall (open, stalls) · Carpenter shed · Auto garage (sawtooth) ·
  Gatehouse · News kiosk (round) · Pawnshop (three gilt balls: `key: 'gold'` = gilt.png) · boathouse + a `stream` canal on the Canal walk · a car wash on the Street court.
- **Pack whole buildings** (catalogue props, real size, entrance +Z): `city_pizzeria` in place of P01-02-B2 (the chain); two `city_house` on Homes row;
  `city_quequis_house` in place of P02-03-B2 + B3 (31.7 m wide, so the TV and lock repair shops are gone); `city_laundry` on the Canal walk's north-east yard
  (16.7 m wide: the Laundry terraces lot is too small, that building keeps a designed wash-house front). `city_6twelve` not used: no lot fits 22.8 x 21.1 m.
- **The back lots**: the district's infill rows (`dc:inN` inside Southside) restyled in three plain kinds (they may repeat). **The clearing**: trees, rails,
  fence walls and furniture standing inside a new footprint are removed by R.js itself (its own plots only).
- **Follow-up (same day)**: the Corner shops' pack block row carries `y: 0` too (it stood on the 7 m roof). THE BIG WINDOWS (mondo 18:49): R.js windows are
  'fit' quads, so the shared repeat rule skips them; the helper now draws 1.7 x 1.8 m windows and `a.floors` draws the GROUND row as half as many wide
  shop panes (`urban:GlassWindowSquare1a`), never the upper floors' window (`ground: 'same'` opts out).
- **On THE LEVELS** (Southside stands on levels 10 to 14, 17.5 to 24.5 m): the tool lifts every arch row onto its building's base, so R.js keeps
  writing `y: 0`. Rows the tool does NOT lift ask R.js `plotY(px, py)`: the pack block's `texbuilding` and the canal's water. The canal is the levels'
  sunk ditch on P00-03 (levels.js `pieces`): the `stream` runs north-south on its bed (water 0.5 m deep), the boathouse stands on the east bank.
- **THE POLISH PASS** (mondo 11-13 20:15 "one or two more layers deep with the detail", 20:18 "roofs and ac units"): all in R.js's helpers, so every
  Southside building gets it. `a.wins`: a stone sill + lintel on every glazed opening (`trim: false` off, `trim: 0x..` its tint), a wall AC unit under
  every third upper window on back and left walls. `a.floors`: a string course under each upper floor (`band: false`). `a.panel`: a door sheet gets a
  step and a hood (`plain: true`). `a.roof`: ridge cap + two cowled vents on a gable, a vent on a hip, ridge ventilators on a barrel (`bare: true`).
  `dress()` in `a.done` reads the first part (the main block): dark base course, two downpipes with hoppers, and on a flat roof nobody walks two AC
  units with fans, two capped vents and a hatch (seated on a cornice slab when one lies on the block). Walked roofs get no roof units (nothing a unit
  would walk through).
- **Seen in the cloud browser** (WebGL2 headless): every plot from above, shots in `/mnt/project-files/disaster-city-southside/`. Not seen on his Mac yet.
  Interiors are the next pass (the seven walk-in shells are empty rooms with a floor and plaster walls).

- **A ROOF IS NOT GROUND (2026-11-13, the shared-pieces thread, the root fix for the note above).** data.js hqTerrainCompile `archGround`: an arch
  row with no `y` whose origin lies over a building plateau (`bld`) takes the ground that building stands on, never its roof. Four rows on main
  still stood 7 m up (P09-08-B2, P09-09-B1, P10-09-B1, P11-09-B2); the headless compile now gives all 191 city arch rows base 0. `y: 0` in a
  district file is harmless and no longer needed.

## DISASTER CITY, THE BIG WINDOWS (2026-11-13, the shared-pieces thread)
mondo (screenshot of two city blocks): "The buildings that use these repeated window textures from the urban pack, the windows are too small, need
to be scaled up, and remember the bottom row of these buildings should be different/not windows". Both ways a city building is drawn put a window
sheet on every 1.75 m square (a window about 1 m wide, two rows per storey, one at the pavement). Fixed in the shared code, three-renderer.js:
- **The textured building** (`_hqTexBuilding`, every `texbuilding` and infill block not yet architected): one window per STOREY-wide bay (3.5 m).
  Residential / stucco / pack-sheet decals are laid one per storey over the wall (`bigOver`), none on the ground storey, whose bottom row wears the
  band / stucco trim sheet. Office: a 2.6 m pane over a spandrel per storey; tower: storey-high panes; both keep the shopfront glass at the ground with
  a concrete fascia over it. Factory unchanged. `HQ_TEXB.bigWin = 0` = the old squares.
- **The arch row** (`_hqArchGeometry`): a part whose `key` is `urban:GlassWindow*` / `urban:DecalWindows*` with no `uv` or a `uv` number under 3.5
  repeats in whole storey rows (a 9 m wall = three rows of 3 m; a strip shorter than a storey = one row). An `[u, v]` pair and `'fit'` are the
  district's own and stay. A box side / quad / poly wall of such a sheet that stands on the ground (part foot under 0.6 m) and is taller than
  4.5 m draws its ground storey in `keyBase` (none = `HQ_TEXB.archBase`, plain concrete, in the part's tint; a decal draws nothing there).
  `win: 'keep'` on a part turns both off. Cylinders get the bigger repeat but no base split.
- NOT SEEN ON SCREEN (RULE #1c): checked by reading and `node --check` only.

## DISASTER CITY, THE LEVELS — the city's ground at fifteen heights (2026-11-13, mondo's OK 18:30 "Build it as drawn")
mondo 18:07: "more verticality ... Streets that slope, ramps, stairs ... different districts should have different elevations, bayside being
the lowest (sea level) ... different elevations within the districts from plot to plot and even within plots."
NOT SEEN IN THE GAME BY THE THREAD (no browser run, RULE #1c): checked headless only (compile, walk reach, every flight climbed).
- **THE NUMBERS = `docs/disaster-city/levels.js`.** `grid[y][x]` = the level of plot P<x>-<y>; one level = 1.75 m; 0 = Bayside (sea),
  14 = the Church (24.5 m). Change a number, rerun `node bake-disaster-city.js`; never edit the room. THE STADIUM's four plots
  (P04-09, P05-09, P04-10, P05-10) keep ONE level. `pieces` = ground shaped inside a plot (`bowl` / `mound`): the Canal walk ditch (P00-03),
  the Campus green amphitheatre (P00-05), the Event square court (P07-10). `stairs` = the pack flight per district.
- **THE FORMAT (data.js `hqTerrainSlopeFn`): `terrain.slope = { cells: { res, x0, z0, nx, nz, d, f } }`.** `d` = base64 i16 cm, four corner
  heights a square (NW NE SW SE), bilinear inside; two squares that disagree on a shared corner = a step (a retaining wall). `f` = a byte a
  square, 1 = a walk-in building's floor. ON A LINE between squares the HIGHER side wins, unless a side is flagged (its floor then stands to
  the line). `hqTerrainCompile` puts the lattice ON the squares' lines for such a room (581 nodes, x0 -253.75), so a step is one lattice cell
  wide with its top edge on the line: fences / walls / hedges on a plot line stand on the top. Every slope-riding row (plateau, ramp, deck,
  bridge, wall y, texbuilding base, arch base, lamps, signals, traffic, rails' g0 / g1) rides it with no edit in a district file.
  `absY: true` on a row = its heights are already absolute (`_hqTSlopeFeatures` leaves it). `hqTerrainAdopt` now carries `info.slope`.
  Compile: bounding boxes on the ordered rows (`orderedBB`), the city compiles in about 5 s headless (was 17 s before the levels).
- **THE TOOL'S RULES (bake-disaster-city.js THE LEVELS; `ctx.LEVELS` + `ctx.lvOf(plot)` for the district hooks).** A building's squares are
  flat at its base: its plot's level, or the kerb walk's height at its door when the door opens on a sloping street; an infill building over
  a plot line takes the LOWEST level under it. Street squares (road + kerb walk) follow the road: flat within 2 squares of a plot's middle,
  straight to the mid height at the plot line (1 level a plot = 6.25%, 2 = 12.5%: Port hill, Hotel Hill, Cinema hill, the police street).
  Open squares: plot level + piece, joined to the building / the kerb at their corners. Arch rows get `y` = their building's base; props
  with `y >= 1` get the ground added.
- **THE CROSSINGS.** Every E / S walk port between two levels: a pack flight (`dc:stair:<plot><side>`, `stairs: true`, the low side first,
  cut into the upper plot where short of room) and, on a one-level crossing with two free columns, one column as a plain 3-square ramp
  (`dc:ramp:…`, the skate line). Today 100+ flights, about 40 ramps, 0 crossings closed. Roof bridges stand at the higher roof with a steel
  flight on the lower one (`dc:roofstair:<RF>`). DOOR STOOPS (`dc:stoop:<building>`): a walk-in building whose doorway faces ground at
  another height gets a one-square flight outside it.
- **KNOWN, NOT FIXED.** (1) Two walk-in buildings back to back on a plot line at two levels (P03-05-B1 against P02-05) share the line's
  nodes: the lower one shows a bank 0.9 m deep along its back wall. (2) Two doors face an infill building's wall across the plot line
  (P08-02-B1, P02-05-B1): the city tool's own flaw, older than the levels. (3) Some stoops end 3.5 m from the next building's back wall
  (the alley is that narrow); the walker leaves them sideways.
- **NOT BUILT from the mock-up:** the park knoll + the Dish (district S made those plots the stadium), the Hero plaza stage (district H has
  its colonnade there), the Service garage roof ramp, the Industrial loading-dock platforms, the Marina lookout beach steps (the beach
  thread's ground). Mock-up + tools: `/mnt/project-files/disaster-city-vertical/` (shows the first grid, before the stadium).
## DISASTER CITY, THE FINANCIAL DISTRICT'S ARCHITECTURE (2026-11-13) — docs/disaster-city/districts/F.js, data.js
mondo 11-13: "architect the buildings in their respective districts plots ... every building should be unique and purposeful and
recognizable"; his OK on the plan + mock-up 17:10 (project files `disaster-city-financial/`, `mock-src/` = the mock scene).
- THE DISTRICT FILES: `bake-disaster-city.js` loads `docs/disaster-city/districts/<LETTER>.js` (the shared hook, PR #1274; this district = `F.js`). `tailor(PLAN, plotOf)` runs before the plan
  is read (change a plot's cells / building slots); `build(api)` runs once every row exists, `api = { features, props, lateRows, bInfo,
  PLAN, plotOf, C, N, HALF, r3, gx, gc }`. A district file touches its own plots only. Rerun `node bake-disaster-city.js` after an edit.
- THE METHOD: a building keeps its collision row and loses its own skin (`texbuilding skin:false`, a roof-route `plateau` gets
  `bld.skin:false`), then gets ONE `arch` row at the same x / z / rot. `frame(id, o)` in the file does that and can resize / move the
  row (`w`, `d`, `dz`) so the walk-in inside matches the drawn body; `frontWithDoor` cuts the city door's doorway out of the front.
  A mass outside the row's box needs its own collision (`texbuilding skin:false` in lateRows, `y` for one on a walked roof, ghost `wall`s).
- THE 16: hotel (deco tower on the roof-route podium, verdigris roof, porte-cochère) · bank archive (concrete vault, drum corner) ·
  GOBLIN BANK (marble temple, arch, six-column portico, verdigris dome; walk-in) · executive court (glass slab on stilts, helipad) ·
  members club (oxblood brick, bow bay) · caterer yard (brick north wing on the roof route + dock wing + sawtooth kitchen round a yard) ·
  bank offices (teal curtain wall, stone core; walk-in lobby) · vault annex (stepped bunker, steel door; walk-in) · taxi court (canopy,
  checker fascia, dispatch office walk-in; a small store across the road) · tailor shops (pack_bld_08 kept) · intelligence office (black
  glass tiers growing upward, radome; walk-in) · service garage (bow roof) · finance arcade (loggia; shop walk-in) · WORKER CAFE = the
  pack's `city_diner` at real size (the plot P09-03 re-cut round it in `tailor`) · penthouse stair (point tower; walk-in) · private
  garden (walled, arched gate, glass palm house walk-in). Fillers: `terrace` (bankers' brick houses), `shop`, `workshop`, `backlot` (infill).
- GOLD = terrain key `gold` (gilt.png) only; never a tinted copper / metal, never the gold.png files (mondo 11-13 17:12).
- No text signs yet (an arch part cannot write text). 6TWELVE was handed back (too big for any Financial slot).

**Civic Center, the big windows (2026-11-13 evening):** C.js no longer writes a `uv` on `urban:DecalWindows*` / `urban:GlassWindow*`
parts or on the `win` overlay, so the shared BIG WINDOWS rule sizes them (one row a storey, no window row on the ground storey).
Every Civic arch row carries `y: 0` (the tool adds the building's base level). Seen in game (library, courthouse).
- HERO PLAZA, the lift (2026-11-13 19:10): districts/H.js `LIFT` now also sets `gain: 1.5` on every part whose key is a battle sheet
  (bricks_3, marble_light, aluminium, gold, wood_planks ...: the game draws those with the darker calm sheet), and leaves GlassWindow
  sheets with no added glow (the dark glass is the approved look; the Superhero Tower's shaft lost its glow). Seen on screen on the levels.
- **THE DARK GLASS (mondo 11-13 19:02: "i actually like these dark looking windows, see if we can use them in any other buildings")**: the pack's
  GlassWindow* sheets draw near black in an arch row and he wants that look, so never lift them (no glow / gain). Added in F.js: the hotel's
  sky bar tier, the archive's stair drum, the palm house's vault + dome (back to glass), a clerestory on the garage, the shops' upper floor,
  every third back lot a glass office block over a stone ground storey. The HOTEL gets a walk-in inside when the interiors start (his word).
- THE GIANT APE (mondo 11-13 19:25: "put king kong in the district with the most high rises or tall buildings"): Financial (5 to 11 storeys). S.js `build` pushes him to `ctx.npcSpots` (new in the bake hook: a district's people, written to the room's `npcSpots`) at (173.25, -92.75), the open ground at the foot of the Penthouse stair tower (P10-03), with his own line from the old streets.

## DISASTER CITY, THE UNIVERSITY DISTRICT (2026-11-13, the University thread; mondo's OK 19:24)
mondo 16:41: "architect the buildings in their respective districts plots ... every building should be unique and purposeful and recognizable".
`docs/disaster-city/districts/U.js` (the district hook, `build(ctx)`) re-dresses the district's 22 buildings (plots x 0-3, y 4-7): each keeps its
collision row with the skin off and gets ONE `k: 'arch'` row `dcu:<building id>` (425 parts in all) + the bandstand on the Campus green.
- **Old campus (west)**: red brick (`urban:TileSubway3a` at 3.5 m a sheet, its dark band a string course per storey), pale stone (`calm_marble`), blue
  slate (`calm_tiles_small` tinted). Dorm court (four wings round a court, archway), lecture hall (six-column porch, lead vault; roof route), library
  (gothic gables, clock tower; walk-in), student cafe (hip roof, conservatory, turret; walk-in), campus gate (two turrets, arch), bookshops, faculty homes.
- **Science side (east)**: observatory (podium with a walked 7 m terrace, verdigris dome = `calm_snow` tinted, `glow: 0.3`), research lab (sawtooth roof,
  glass stair drum; walk-in), lab annex, service court (vaulted shed, boiler chimney, tanks), psychology lab (rounded ends; walk-in), research annex,
  science museum (barrel roof, the planetarium globe standing out of the front; walk-in), clinic, pavilion, guard post, stands, corner store.
- **The chain**: the pizzeria (`city_pizzeria` prop, real size) stands on the old student-flats lot P00-06-B2; no gas station (no lot fits one). The
  pack shop block P01-04-B2 = `pack_bld_09` at its own size.
- **Lessons** (for every district file): (1) a battle-sheet key in an arch part (bricks_3, concrete_floor, aluminium, tilefloor, gunmetal) is swapped in
  the game for a DARK calm sheet (`CALM_TERRAIN.of`), so tinted roofs / domes drew near black: use an `urban:` sheet, an `hq:` sheet or a calm sheet by
  its own name. (2) A roof-route plateau draws its own concrete cliff: the drawn walls stand 0.15 m outside it, a tier plateau 0.15 m inside its walls.
  (3) The unlit side of a dome reads black: `glow: 0.3`. (4) A walk-in building's back never stands ON a plot line under a higher plot (`SHALLOW`).
  (5) THE BIG WINDOWS: cut-out window sheets are drawn 5.25 m a sheet (a window about 1.8 m), none on the ground storey of a taller building.
- Seen in the game (headless, 14 views) before the globe / window pass; that last pass is checked by `node --check` + the bake only.
- Next pass: interiors of the roof-route buildings; the U plots' infill buildings are untouched.

## DISASTER CITY, THE NATURAL EDGES — mountains, forest, desert, the bay in place of the ring of buildings (2026-11-13, mondo's OK 19:28 "Build it as drawn")
- mondo 19:20: "get rid of the edge/moat of buildings around disaster city ... where the elevation is the highest there should be steep mountains, one
  side can be forest or tall trees, or one side could be just plain flat desert ... I want the buildings to be interactable ... having these fake
  buildings as barriers doesnt feel right". Later the plot system is used for other zones (The Woods) and plots get joined; this pass only replaces the ring.
- GONE: the skyline ring (`terrain.backdrop: false`; three-renderer.js _hqBuildCityBackdrop is untouched for the other city rooms) and the concrete outer
  ground (a room with `terrain.edges` builds none; `_hq.outer` is the land's own height); the 63 filler buildings on the city's OUTER plot line (bake-disaster-city.js THE INFILL: the draw is still made and the id
  still counted, the row is not written; Bayside's east line is kept, it is the beach's). Southside's and Financial's styled back lots on the outer line went with them.
- THE LAND: `terrain.edges = { reach, n, s, w, e }`, read by three-renderer.js `_hqBuildEdgeLand` / `_hqEdgeLandFn` (THE NATURAL EDGES). A side =
  `{ kind: 'mountain' | 'forest' | 'desert' | 'coast', inset, cap: { kind, at, off, len } }`. The city: north = mountain (cap coast at the east end, over the
  bay's strip), west = forest (cap mountain for the north 170 m; `inset` 69.9: the land starts behind the ghost wall on the city's old edge and lies OVER the
  dead west strip Bayside's wider room added), south = desert (cap coast at the east end), east = coast (the bed under `terrain.sea`; the sea's sheet runs on
  over it at the room's own height and key). One height function for the four sides and corners; ~36 000 triangles, 60 meshes in 20 pieces, each a chunk
  (`H.chunks.cells['edge:<side><n>']`, far 1e12: culled off camera, never by distance). Past 70 m the land is fog-free with its haze in its vertex colours
  (the city's fog eats everything at ~120 m; the peaks must stand over it). Sheets: `mountain` (rock), `grass` (forest floor), `desert` (sand, the beach's
  own), `cliff` (a high edge falling to the sea); snow = plain white. ~900 trees (pine, tree_4, tree, pine_2; 13 to 22 m) through the room's tree kit to
  60 m out, a skirt of pines on the mountains' feet. Kill switch `EW_HQ_NO_EDGE_LAND`. The build is ~0.7 s once, inside the room's load.
- THE EDGE STOPS (bake EDGE_STOP): the city's outer line wears its side's own boundary, never a district's yard wall: north trees + a low wall, west trees,
  south guard rail + cable fence (then a dry ditch in the land), east parapet + pipe rail (you see the sea over it). Bayside's outer lines stay Bayside's.
- B.js (two numbers, told to the Bayside thread): the north water's sink runs 2 m past the field's north edge (a rim at the city's level stood across the north
  end of the bay) and the deep sink's 12 m bank lies past the room's east edge (a sand bar rose along it).
- NOT SEEN IN THE GAME: the headless browser run was refused (RULE #1c). Checked: `node --check`, the bake, and pictures of the land code alone (the real
  function run in Node on the real room, drawn in a bare three.js page): /mnt/project-files/disaster-city-edges/built_land_check.jpg. Unchecked on screen:
  the land's sheets and tints under the game's light, the seam at the field's edge, the fog-free far part against the sky, the game's own tree models.
- NOT DONE: no road runs out into the desert (the streets end at the south line); no rocks / cactus on the desert (he asked for plain flat); the sky's far
  roster (`sky.scenery: 'city'`) is unchanged; the forest past 60 m is bare ground (in the fog from the streets).

## THE STEEL LANDING — a fire escape's platform, no terrain lump (2026-11-13)
mondo: "wherever there are ladders, there is a raised piece of terrain to go with it that looks wrong, and its easy to fall off of and i can
climb it just by jumping up next to it ... Can i not just climb up the ladder and stand on the platform part?" He picked "Steel platform you
stand on". The lump was the fire escape's halfway LANDING, a 1.6 x 2.2 m terrain `plateau` (the height field can only draw it as a slanted
block). 25 of them, city rooms only: `site_prebuilt_downtown_streets` 18 (bake-disaster-city.js, the `escapeAt` loop),
`site_prebuilt_cyberpunk_streets` 5 (STACK W + E1 had a second, wider plateau for the stair's head: one landing each now, 4 rows),
`site_prebuilt_downtown_oldstreets` 2. Every other ladder in the game climbs straight onto a real tier.
- **The row**: `{ k: 'landing', x, z, w, d, h | y, back, gaps? }` (data.js `hqTerrainLandings`, compiled in `hqTerrainCompile` before the first
  `hqTerrainClimbs`): `h` over the LOWEST ground under it (or absolute `y`), `back` = the heading of the building's side (no rail),
  `gaps: [[heading, a, b]]` = a stair's mouth in a rail. It becomes a hidden `bridge` slab (`hide`, `landing`, 0.1 thick: the ground under it
  stays flat and walked) + one hung `ghost` wall per open side (`y0` = the slab, 1.05 high: the walker cannot step off). A landing with no
  mass behind it (its building became a walk-in: P01-08-B1) gets an unseen wall on the back too (`guard`).
- **The ladders**: `hqTerrainClimbs` gives a foot / a head on a landing the slab's height (`c.footOn` / `c.landing`); `hqTerrainClimbEdges`
  takes for such an end the nearest grid node that STANDS on the slab (the nearest node may lie under a rail: two city landings fell out of
  the reach until this).
- **The look** (three-renderer.js `_hqBuildClimbs`, after the ladders): an iron deck + a grating, posts and two rails along each `rails` run
  (open where a ladder's head stands on that side), two struts to the wall; two merged meshes a landing. A fireescape ladder whose head is on a
  landing draws no cage of its own and ends in two grab rails.
- Checked offline (node, the compiled rooms, against main): same ladders, same reach flags on every ladder end, the same tapes with the same
  `hard` flags in the three rooms; standing on each slab, the ground under it, every rail blocks. NOT SEEN ON SCREEN (RULE #1c).
- After merging main in Disaster City: `node bake-disaster-city.js` (the tool writes the `landing` rows).
