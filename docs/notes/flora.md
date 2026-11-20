# THE FLORA — every zone's trees and plants by climate (2026-11-20)

mondo, 11-20: "Uploaded some Zips of assets packs to the inbox, use them throughout the game. We need to do a foliage pass on
every single zone, and it needs to be accurate to that zone's climate in the game world/on the map. Examine what all tree and
flower and foliage assets we are using, and add these new ones to the repertoire as well ... determine where they should be used
and how in which zones and districts, for the whole map. Some of the maps are still being worked on so add them in a way that
future changes to the map preserve their foliage from your decisions in this thread."

**Read this before planting anything in a zone, changing a zone's ground sheets, or moving a room on the One World map.**

## 1. The one idea: a RULE, not rows

Nothing of this pass is written into a room. A room's foliage is WORKED OUT each time the room is built, from three things
the map already says:

1. **the room's zone** (`data.js ZONE_FLORA.zones`: one row per zone, its rooms and its climate);
2. **the One World map's ground under each spot** (`hqOwGround`: forest, meadow, marsh, tundra, desert ...), for the zones
   whose row says `map: true`;
3. **the ground sheet painted under each plant** (`ZONE_FLORA.sheets`: grass = `lawn`, `grass_dark_fantasy` = forest `floor`,
   `desert` = `sand`, `ice` / `calm_snow` = `snow` ...).

So a zone that is re-laid, grown, split into more rooms, moved on the map or rebaked by its tool keeps its climate's plants,
and no bake tool, district file or layout was edited for this pass. A district thread that plants its usual `tree` rows and
paints its usual sheets comes out in the climate's trees and flowers by itself. The same idea as `ZONE_LOOKS`.

- **A new, renamed or split room** of a zone needs NOTHING: a room with no row of its own takes the row of the zone it belongs to
  on the map (`HQ_ZONE_MAP.zones`, rewritten by `node bake-map.js`; `ZONE_FLORA.mapZones` = map zone -> zone row). This was
  needed the same day: while this pass was being built, Katana Island and the Mountains both changed their room ids on main.
  Give a room its own row only when it differs from its zone (the Fairy Forest, the Snowy Pines, the Redwood Trail, Stonehenge).
- **A room that is in no zone of the map** grows nothing and its trees are untouched (every indoor room, the hub, the old handmade sites).
- Only a SURFACE room falls back to its zone (the Cavern's row also underground): a new cellar under the Beach grows nothing.
- **A sheet with no row** in `ZONE_FLORA.sheets` grows nothing (paving, road, cave floor, cloud, metal).

## 2. The two halves

**THE TREES** (`data.js zoneFloraTrees`, run once by `hqTerrainCompile`). A tree of a PLAIN kind may become its climate's kit
tree. Plain kinds, by class (`ZONE_FLORA.classes`): birch (`tree`, `tree_4`, `tree_53`, `tree_54`), oak (`tree_3`, `tree_52`),
spruce (`tree_2`, `tree_55`), pine (`pine`, `tree_56`), bare (`tree_5`, `tree_6`), snow pine (`xmas_*`). Named trees never
change: palm, cherry, maple, saguaro, the fae trees, the chess pieces, the old OBJ kinds.
- A climate's `trees` list says what each class may become and how often it stays as planted (`'='`).
- **By the water:** a tree within 5 m of open water takes the climate's `water` list (the willows).
- **On snow:** a tree whose own ground sheet is snow takes the winter list (bare birch and oak, snow firs), so the snow line a
  thread paints is also the trees' snow line.
- **The mass** (a room's thicket: thousands of trunks nobody walks among) changes only in its front rows and only to the kit's
  five light trees (`ZONE_FLORA.mass`), because a kit tree is 2 to 5 times the triangles of a painted tree.
- The pick is a hash of the tree's own place and the room's id: the same wood on every visit and for both players online
  (RULE #2). A tree that keeps its kind is exactly as it was. `t.kind0` remembers what was planted.

**THE FLORA FIELD** (`three-renderer.js _hqFloraTick`). The small plants (flowers, ferns, grass tufts, reeds, low bushes)
grow round the walker the way the grass field does: the ground in 14 m cells, each cell ONE merged mesh on one sheet, built
when he comes within 46 m and dropped when he leaves. Per spot: climate (zone + map) -> ground class (sheet; water within
2.2 m = `wet`) -> the climate's layers for that class, thrown by a seeded hash. Never on a path, in water, on a steep face,
under a building or in the thicket. No prop rows, no blockers, nothing a fight reads, nothing relayed (it is the same on
both screens by its seed). A room that grows the blade grass (`terrain.grassField`) gets no kit tufts on top of it.

Off switches (console, before the room is entered): `EW_NO_FLORA` (all), `EW_NO_FLORA_TREES`, `EW_NO_FLORA_FIELD`.
Readout: `window._ewHqFlora` = `{ room, cells, plants, tris, reach, low }`.
**THE ONE KNOB:** `ZONE_FLORA.lush` (2.2) multiplies every flower / fern layer of every climate; `lushG` (1.2) the tufts.
Settings > Video > Grass on low or off, or `EW_PERF_LOW` = reach 30 m and 60 % of the plants.

## 3. The packs (both from the inbox, 2026-11-20)

`bake-foliage.py` turns them into the game's files (Blender as a Python module reads the FBX / .blend; nothing is rendered):

| Pack | What | Game files (R2) |
|---|---|---|
| **Retro Foliage: Pixel Art Nature Kit** · AFGameAssets (bought; 62 FBX + season leaf pictures) | birch x4, oak x4, fir x4, willow x3, each in three seasons; 15 dead / fallen pieces; 4 rocks; 11 flower patches; 11 plants; 6 grass tufts | `Assets/world/packs/afgameassets_retro_foliage/rf_*.glb` (110 files) |
| **Handpainted flower assets** (one .blend, one 4096 px sheet; no author or licence file in the zip) | eight whole plants: bluebell, daisy, daisy bunch, flame flower, orange flower, purple flower, pink "violet", sunflower | `Assets/world/packs/handpainted_flowers/hp_*.glb` (8 files) |
| THE FLORA FIELD | all 54 small plants of both packs in one file on one 1024 px sheet (a plant of many cards keeps 96 triangles) | `Assets/world/nature/flora/ew_flora_field.glb` |

- **Trees** = `HQ_TREE_KINDS` rows `rf_<birch|oak|fir|willow>_<n>[_<season>]` (45 kinds; the editor's TREES tab lists them).
  Seasons: birch / oak `""` summer, `_autumn`, `_winter` (bare) · fir `""`, `_winter` (under snow), `_dead` (brown) · willow
  `""` green, `_yellow`, `_blue`. They follow THE PAINTED TREES' rules: `ewleaf_*` one-sided leaves with both windings and
  normals out of the crown (no black undersides), no leaf card under 30 % of the height (16 % fir; a willow keeps its
  curtain), the trunk on the planted spot.
- **Every piece is also a catalogue row** (`HQ_CATALOGUE_FLORA`, the editor's MODELS tab): the flowers, plants and tufts
  walk-through; the dead wood and rocks solid: `rf_stump`, `rf_oak_stump`, `rf_pine_stump`, `rf_birch_dead_1..3`,
  `rf_oak_fallen_1..2`, `rf_pine_fallen_1..5`, `rf_willow_dead_1..2`, `rf_rock_1..4`.
- **NOT placed by the rule:** the dead wood and the rocks. They block the walk, so a thread places them by hand (or a route
  kit scatters them); the rule never drops a blocker into somebody's room.
- The kit's `.unitypackage` is the same pack for Unity (nothing more in it we use). Its billboard pictures, terrain sheets,
  water sheet and particle materials are not used.
- **Licence, to settle with mondo:** the kit is a bought store pack (use in a game yes, its files never handed on as a pack).
  The flower zip names no author and no licence: ask him where it came from before the credits say more than "author not recorded".

## 3b. THE MESHY FLORA BATCH in the rule (2026-11-20, second pass)

mondo had the top of this thread's gap list made (models-assets.md "THE KATANA + FLORA MESHY BATCH": his one-time yes to four
Meshy trees) and handed the names here. What the rule does with them, again with no room, tool or district file edited:

| Piece | Where the rule puts it | How |
|---|---|---|
| `fl_bamboo_clump` | Katana Island (`japan`): groves where a pine, spruce or birch stood | tree list; 3.6 tiles at least, trunk blocks 0.6 m |
| `fl_giant_redwood` | the Redwood Trail (`redwood`): about half of its oaks, some firs | tree list; 11 tiles (19 m) at least, trunk blocks 1.1 m |
| `fl_jungle_tree` | among the palms of the tropics, Katana and Hollow Earth, NEVER on sand (a beach palm stays a palm) | new class `palm`; one palm in four to six (10,000 triangles each) |
| `fl_joshua_tree` | dry country (`desert`, `scrub`, `badlands`): among the saguaros and in place of some bare trees | new class `cactus` (`saguaro`); half the height of the tree it replaces |
| `fl_lotus` | every still fresh-water pond of a green climate, near its bank, 2 to 9 a pond | THE ACCENTS (`ZONE_FLORA.props`, `zoneFloraProps`): floats at the surface, sunk 0.2 m |
| `fl_barrel_cactus` | dry ground of the desert climates, up to 26 a room | THE ACCENTS; walked through (the catalogue row blocks; the rule's copy does not) |

- **THE ACCENTS** are the rule's only prop rows, and they are made at room build, not written anywhere: seeded by the room id,
  kept clear of everything that already stands by the compiler's own `freeFor`. Off: `EW_NO_FLORA_PROPS`.
- A tree's ground can now have its own list (`trees.<ground class>`): `snow` = the winter trees, `sand` = a palm stays a palm.
- The willow rule reads fresh water only now (no willow on a sea shore), and a palm or cactus is never a willow.
- **NOT placed by the rule, on purpose:**
  - `fl_wheat_clump`, `fl_rice_clump`: a field is rows of hundreds of clumps at 2,500 triangles each; the rule cannot afford
    that and a field's place is a design decision. They are for a holder to plant as a real field (Leylines, the Ranch,
    Katana's paddies). If mondo wants fields BY THE RULE on the map's farmland, they first need a cheap card version in
    the flora field file.
  - Every `kt_*` Katana prop (torii, armour, katana ...): not plants, and Katana Island is the Katana holder's row.
- Seen in the browser 11-20 (build ebed470 + this pass): bamboo and lotus on Katana, a giant redwood on the trail, a Joshua
  tree and barrel cacti on the Desert Highway. NOT looked at: the jungle trees (Katana's view missed them, the Volcano
  Island and the Cavern were not opened).

## 4. Everything that grows in the game, and where it belongs

| Asset | Source | Belongs in |
|---|---|---|
| Painted birch / oak / spruce / pine (`tree`..`tree_4`, `pine`, `tree_52`..`56`) | Retro Tree Pack bark, built by bake-trees.py | every temperate zone: the base of every wood |
| Bare trees `tree_5`, `tree_6`; old OBJ dead trees `tree_13`..`20`, `tree_31`..`42` | Retro Tree Pack / Quaternius | the Woods, the Estate's graveyard, burn scars, scrub |
| Sapling `pine_2` | Retro Tree Pack | alpine edges, young wood |
| **Kit birch** `rf_birch_*` | Retro Foliage kit | summer: forest, meadow, routes · autumn: the Estate · winter: snow country, the Woods |
| **Kit oak** `rf_oak_*` | Retro Foliage kit | summer: forest, meadow, the Hills (live oak), the Vatican · autumn: the Estate · winter: the Woods, snow |
| **Kit fir** `rf_fir_*` | Retro Foliage kit | green: forest, the Redwood Trail · snow: the Snowy Pines, the Mountains · dead: the Woods |
| **Kit willow** `rf_willow_*` | Retro Foliage kit | only by water: green (temperate, Katana), yellow (the Estate's lake), blue (the Fairy Forest, Hollow Earth) |
| Cherry, maple (`cherry*`, `maple`) | painted trees recoloured | Katana Island only |
| Palm (`palm`, `palm_tree`, `palmisle`) | Meshy | the Beach, Katana's jungle, Giza, the city's coast |
| Saguaro, prickly pear, agave, yucca, tumbleweed | Meshy | the Desert, scrub routes |
| Snow pines `xmas_*`, Christmas trees | Elbolilloduro Christmas | snow country only |
| Fae caps, giant flowers (`fae_*`) | Meshy | the Fairy Forest, Hollow Earth |
| Olive, cypress, grape trellis, rose bed | Meshy wish list | the Vatican, Olympus |
| Fern, moss, reeds, leafy bush, wild flowers, sunflowers, corn, banana, tropical bush | Meshy | hand-placed accents (they are solid or large); the field grows the small plants round them |
| **Kit flowers** `rf_flower_1..11` | Retro Foliage kit | 1 pink cosmos, 2 small blue, 3 pink stalks, 4 yellow, 5 black bloom (horror), 6 blue carpet, 7 white carpet, 8 lilac carpet, 9 pink / orange, 10 red poppy, 11 pale pink |
| **Kit plants** `rf_plant_1..11` | Retro Foliage kit | 1 pale frond, 2 orange leaf rosette (autumn), 3 lime rosette, 4 bush, 5 cattail, 6 dark stalks, 7 fern, 8 grey weed, 9 grey-green shrub (sage), 10 sprout, 11 tall bush (prop only) |
| **Kit tufts** `rf_grass_1..6` + `_dry`, `_frost`, `_dark` | Retro Foliage kit | green: lawns · dry: scrub, desert, autumn, the Hills · frost: snow · dark: the Woods, forest floor |
| **Hand-painted flowers** `hp_*` | hand-painted set | daisies: lawns and meadows · bluebell: woods, fairy · sunflower: farms, the Estate · orange (the golden poppy): the Hills, autumn · flame, pink, purple: tropical, fairy, Katana, the Vatican (lavender) |
| Kelp, seaweed, coral, anemone | Ocean pack / code | the Deep only, placed by hand (the rule grows nothing under water) |
| Mushrooms, glowcaps, moss | Meshy / code | caves, sewers, the Woods, placed by hand |

## 5. The climates (`ZONE_FLORA.climates`)

A layer = a plant list, plants a square metre, how clumped (0 even, 1 only in drifts). `like` = the rest as another climate.

| Climate | Trees | Ground cover |
|---|---|---|
| `forest` temperate forest | painted trees + kit birch / oak / fir; willows by water | green tufts, ferns, white and blue carpets, a few bushes; forest floor: dark tufts, more ferns |
| `wood` open woodland | more kit birch / oak | as forest with meadow flowers |
| `meadow`, `grass` | kit birch / oak | green tufts, daisies, poppies, blue, yellow, pink in drifts |
| `farm` | as meadow | sunflowers, poppies, cornflowers; dry tufts on bare ground |
| `marsh` | as meadow | tall green rushes, cattails; a reed belt at the water |
| `foothill`, `alpine` | forest list | low blue / white / lilac carpets, sage on rough ground, sparse on rock |
| `snow` snow country | everything winter: bare birch and oak, snow firs among the snow pines | frost tufts and a dry weed, sparse; alpine carpets where grass shows |
| `scrub`, `badlands` | none | dry tufts, sage, a rare yellow bloom |
| `desert` | none | very sparse dry tufts and sage; reeds only at water |
| `shore` | none | dune grass on sand, a thin meadow on grass |
| `tropical` | none (palms stay) | green tufts, many ferns, flame / pink / orange / purple blooms, bushes; dune grass on sand |
| `japan` Katana Island | willows by water (cherry and maple stay) | pink cosmos, iris, white carpets, ferns |
| `horror` the Woods | bare oaks and birches, dead firs among the green | dark tufts, ferns, black blooms, grey weeds, a little white |
| `redwood` | green firs added, dead firs for the bare | the most ferns in the game, dark tufts |
| `fairy` | kit birch / oak, blue willows | the densest flowers: bluebell, pink, purple, lilac, blue carpets |
| `autumn` the Estate | autumn birch and oak (most of them), yellow willows by the lake | dry gold tufts, orange leaf rosettes, orange and flame blooms, sunflowers, reeds |
| `city` Disaster City | none (street trees stay as planted) | mown lawn: a few tufts, daisy drifts; dune grass on the beach |
| `hills` the Hollywood Hills | live oaks (kit oak 4, 1, 3) | gold dry grass, the golden poppy, purple lupin, sage; sparse on rock |
| `med` the Vatican | a few small oaks (the pines stay) | lavender (purple), daisies, poppies |
| `hollow` Hollow Earth | blue willows | ferns, strange blooms, only where dark grass / dirt is painted |

## 6. Every zone (`ZONE_FLORA.zones`)

| Zone row | Rooms | Climate | Why |
|---|---|---|---|
| `city` | Disaster City | `city`; district N = `hills` | a warm coast city: lawns only in parks and yards; the Hills are dry, gold in summer, live oak and poppy |
| `woods` | the Clearing, the Ritual Ground, link L4 | `horror` | "Blair witch, silent hill": dark, bare, dead among the green |
| `redwood` | the Redwood Trail, link L3 | `redwood` | redwood country is fern country under tall firs |
| `camelot` | the Forest, routes R4, R12 | the map (forest), else `forest` | a temperate forest |
| `village` | the castle + village room | `meadow` | green fields round a village |
| `pines` | the Snowy Pines, link L6 | `snow` | winter |
| `fairy` | the Fairy Forest, the Looking-Glass Garden | `fairy` | always in bloom; blue willows |
| `estate` | the Lake + Corn Fields room, the Haunted House room | `autumn` | harvest: corn, pumpkins, a haunted house |
| `mountains` | the mountain's rooms (Lodge + Olympus, Shasta), routes R3, R5 | the map (peak / tundra = `snow`, alpine, rock, forest), else `snow` | the map's own height bands; a tree on painted snow is a winter tree |
| `northpole` | the North Pole village | `snow` | winter |
| `desert` | Circus, Western Town, Area 51, Giza, DH1-4, R8, R9, R11 | the map (desert, dunes, badlands, scrub), else `desert` | reeds only where there is water (Giza) |
| `beach` | the Harbour, the Triangle, the Volcano Island, the Cove, the old island | `tropical` | tropical islands |
| `coast` | route R10 | the map (sand, badlands, desert), else `shore` | the coast road |
| `katana` | Katana Island (`site_prebuilt_bermuda_katana`) | `japan` | "love letter to anime and Japan" |
| `ley` | the Line, Babel, Bug Colony | the map (farm, scrub, grass), else `scrub` | dry farmland of the Fertile Crescent |
| `henge` | Stonehenge | `meadow` | an English meadow |
| `vatican` | the Vatican | `med` | a Mediterranean garden |
| `routes` | R1, R6 | the map (forest, wood, meadow, foothill, snow), else `wood` | the roads between the zones |
| `cavern` | the Cavern's five rooms, the inner sun | `hollow` | plants only where the inner sun's country is painted |
| `divine` | (no room today) a new surface room of the Afterlife's zone | the map, else nothing | the fallback row of the map zone `divine` |
| `none` | Antarctica, the Frozen Sea, the Deep, the Sewers, the D.U.M.B., Hell, Heaven, the Catacombs, space, the Astral Realm, the Internet | nothing | ice, sea floor, stone, space, cloud, fire, dream, cyberspace: listed so it is a decision, not a gap |

The map's ground letter -> climate is `ZONE_FLORA.ground` (f forest, w wood, m meadow, g grass, a farm, M marsh, F foothill,
A / R alpine, T / P snow, s scrub, b badlands, d / D desert, n shore; sea, ice, salt flat and the Ice Wall grow nothing).
A zone row may rename a map climate for itself with `as: { forest: 'horror', '*': '...' }`.
Districts: `districts: { N: 'hills' }` reads the district letter of the room's plots from `HQ_ZONE_MAP` (today only Disaster
City lists its plots by district; every other multi-district room is told apart by its ground sheets and the map).

## 7. Changing it

- A zone should feel different: change its `c`, or its row in §5's table in `ZONE_FLORA.climates`. Nothing else.
- Thicker / thinner everywhere: `ZONE_FLORA.lush`. One climate: its layers' second number.
- A new plant: add it to `bake-foliage.py` (it joins the field file), `--put` the field file, give it a place in a list `M`.
- A new tree kind in a climate: a row in the `T` lists. A kit tree is heavy: only the five in `mass.light` go in a thicket.
- After any change to the field file: its `ASSET_MANIFEST.json` row (`npm run manifest -- <mirror> --merge`), or players keep the old one.
- The tutorial, fights, saves and the online relay do not read any of this.

## 8. Not done, open, and what to watch

- **Proof pictures** (11-20, cloud probe, software renderer): the Fairy Forest, the Estate, the Clearing, the Snowy Pines,
  Camelot's moat, Disaster City (Hills + a park). The other zones run the same code on their own rows but were NOT looked at:
  the Desert, the Beach, Katana, the Vatican, Leylines, the Mountains, the Cavern, the routes.
- **Frame rate on a real machine is unmeasured.** The field is 12,000 to 50,000 triangles in view (a full meadow more); the
  kit trees add triangles to every wood. If a weak machine suffers: `lush` down, `reach` down, or `mass.share` down.
- The land past a room's line (`terrain.edges`, the edges row) and a room's `shell.forest` treeline are NOT changed: an
  autumn Estate still has a green rim. That is the edges thread's code; the lists to hand it are `ZONE_FLORA.climates.*.trees`.
- bake-route.js's kit and the district files still name the old kinds; that is on purpose (the rule turns them). A thread may
  also plant an `rf_*` kind directly; the rule leaves it alone.
- The raw packs are still in R2 `dirtymondo/inbox/More Foilage/` (this cloud container has no `/mnt/project-files`, so they
  could not be moved to `asset-packs/` or logged in `_sorted-log.md`).
