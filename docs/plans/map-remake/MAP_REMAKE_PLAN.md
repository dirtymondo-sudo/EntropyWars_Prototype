# THE MAP REMAKE — plan + mock-up, for mondo's OK (2026-11-16)

mondo 11-16: "completely remake the map/directory in the game to reflect the new plan/layout/world map with the
districts and plots, like what's actually in the game".

**State: plan and mock-up only. Nothing in the game is changed. The build starts after his OK** (owner-rules.md §8:
design work on UI and maps = a plan and a mock-up first).

Thread: second side. Board row: `docs/notes/claims.md` "The map / directory".

## 1. What is wrong with the map today

Pictures of the live game at main `67adc4c` (the map opened with everything charted):

| Picture | What it shows |
|---|---|
| `today_world.png` | The world sheet is a subway diagram with DOOR HQ in the middle and the zones as dots at made-up places. Nothing sits where layout 3 puts it. The lines cross all over. |
| `today_disaster_city.png` | Disaster City's sheet is a nearly empty page with small unnamed boxes. No districts, no plots, no names. |
| `today_woods.png` | The Woods' sheet is a pile of "ROOM 12", "ROOM 44" labels on top of each other. The districts' names sit off in a corner. |

Why: the map was built for handmade rooms joined by doors. It draws one dot per ROOM. A plot-built zone is ONE room
with 36 to 183 plots in it, so its whole content collapses into one dot (or into the rooms of its walk-in buildings).
The game data already knows every plot's name and district; the map never reads it.

## 2. The new map (mock-up)

The mock-up is drawn from the game's own data, not typed by hand: `mockup-extract.js` loads data.js and reads every
plot-built room's plots, districts and doors. So what it shows is what is in the game.

Three levels, one click each: **THE WORLD > A ZONE > A DISTRICT**, and a card for the plot you pick.

| Picture | Level | What it shows |
|---|---|---|
| `mock_1_world_surface.png` | The world, surface | Every built zone at its real size and place (layout 3), one small square = one plot, tinted by district. A green line joins the two doors of a way between zones. Gold marks = where DOOR HQ doors come out. Zones still on old rooms = dashed blocks. |
| `mock_2_world_underground.png` | The world, underground | The Sewers under the city, with the surface zones as outlines so you see what is above. The Cavern, the D.U.M.B., Hell and The Deep as dashed blocks until they are built. |
| `mock_3_zone_disaster_city.png` | A zone | Disaster City: ten districts by name, every door (to another zone, to DOOR HQ, into a building), the YOU ARE HERE arrow at the spot you really stand. The card lists districts, ways out and insides. |
| `mock_4_district_hero_plaza.png` | A district | Hero Plaza: its sixteen plots with their names. The card of a picked plot: what is on it, GO. |
| `mock_5_zone_woods.png` | A small zone | The Woods: 36 plots fit with their names at the first look. |
| `mock_6_zone_mountains.png`, `mock_7_zone_beach.png` | Odd shapes | The Mountains (two rooms, the North Pole joined at the Pass Gate) and The Beach (islands in a sea room). |
| `mock_8_new_save_world.png`, `mock_9_new_save_city.png` | A new save | What a player who took the taxi and one walk in the Woods sees: only walked plots are lit, zones behind a seen door are a "?". |

`map-remake-mockup.html` is the same mock-up as a page you can click through (wheel zooms, drag pans).

What each level does:

- **The world.** North is up. The zones sit as on layout 3. Two sheets, SURFACE and UNDERGROUND, one button each.
  DOOR HQ, Heaven, Outer Space and the Astral Realm are not places on the sheet: they are rows in the list.
- **A zone.** The plot grid of the zone's room(s). District borders are thick, district names are on. Plot names come
  on as soon as they fit (a small zone at once, a big zone after one zoom step or a click on a district). No name is
  ever cut off: a name that does not fit is not drawn, the card and the zoom have it.
- **A district.** The zone sheet zoomed to one district, every plot named.
- **A plot's card.** Name, district, what is on the plot (doors, insides), GO.
- **The list on the left.** The zones, each with plots walked / plots in all. The open zone lists its districts.
- **DOOR HQ keeps its own sheet** (the floors and rooms directory) as it is today. It is handmade and stays handmade.
- **A zone still on old rooms keeps today's room sheet** until it is rebuilt. The day its room gets plots it draws
  like the built zones with no map work.

What stays as it is: M opens and closes, Escape / right click / E back out one level, the search box, the map is the
viewer's own (nothing online is relayed: RULE #2 has nothing to do here), the UI Maker themes the panel.

## 3. Where the data comes from

- Seven of the eight built zones already carry `room.plots.names` in data.js (`[plot id, name, district, level]`,
  written by each zone's own bake tool). The map reads it live, so a renamed plot is right on the map at once.
- Disaster City's room has no such list (only `dc144`: sizes). Its plots, the district move and the Hills are in
  `docs/disaster-city/` files that the game does not load.
- New, one repo tool: `bake-map.js` writes ONE table into data.js, `HQ_ZONE_MAP`: each zone's place on the world sheet
  (in plots), its district names and colours, and Disaster City's 183 plot rows (read from `city-layout.json`,
  `move.js`, `hills-layout.json`). No other thread's bake tool is edited. A zone's first PR adds its row.
- Doors come from the rooms themselves (`doors[].x / z / wall`, `action.room`), as the mock-up does.

## 4. The build, in PRs (after the OK)

| PR | What | Proof |
|---|---|---|
| M1 | `bake-map.js` + data.js `HQ_ZONE_MAP` + `hqZoneMapModel()` (the model the mock-up draws, in data.js). No screen change. | `node --check`, the model's counts |
| M2 | The zone sheet + the district view + the plot card + the YOU ARE HERE arrow (map.js THE MAP block, styles-base.css). The old room sheet stays for DOOR HQ and old-room zones. | browser pictures of three zones |
| M3 | The world sheet: surface + underground, ways door to door, HQ door marks, dashed blocks. The old subway sheet and its slot table (`HQ_WORLD_L.slots`) go. | browser pictures |
| M4 | The ledger: a plot is charted when you stand on it (the existing 400 ms walk tick writes it), the new-save look, GO. | browser pictures on a new save |
| M5 | The list, the search (plots and districts by name), the UI Maker rows, the notes (ui-menus-audio.md, hq-building-rooms.md). | browser pictures |

No new game .js file; every R2 file changed bumps the `?v=` token; each PR is uploaded with `node sync-zip.js --upload`.

## 5. Found while reading (nothing was changed)

- The zones were never built to face each other, so three ways draw as long lines on layout 3's placing: the
  Mountains' two doors to the Hollywood Hills (the Mountains sit north-west, the Hills' doors are on their west
  side), the Woods' dead tree (a door on the Woods' EAST edge that lands on Camelot's SOUTH edge), and the city's
  storm drain. See question 2.
- `world-layout.md` A3 names the city's districts "S Southside ... R Sports + Culture". The data has it the other way
  round (`city-layout.json`: R = Southside, S = Sports + Culture) and `world_state_map.png` drew those two swapped.
  The mock-up follows the data: Southside south-west, Sports + Culture south middle.
- The Hills are 13 plots wide, the city 12: the Hills' last column stands over the sea, north of the Beach.

## 6. Questions for mondo

1. **GO (fast travel):** to any plot you have walked (new, as in the mock-up), or only to a zone's entrance as today?
2. **Where the zones sit:** keep layout 3 as drawn (three ways are long lines), or may I move zones a little so the
   doors of a way meet (the Mountains would slide down beside the Hills, the Woods and the Estate south)?
3. **What a new save shows:** only the plots you have stood on (as in pictures 8 and 9), or a whole district as soon
   as you enter it?
4. **The underground:** its own sheet behind a SURFACE / UNDERGROUND button (as in the mock-up). OK?

## 7. To redraw the mock-up

```
cd docs/plans/map-remake
node mockup-extract.js      # reads data.js + the layout files, writes data.json
node mockup-build.js        # writes map-remake-mockup.html (+ local.html for the pictures)
node mockup-shoot.js        # pictures into out/ (DSF=2 for double size)
```
