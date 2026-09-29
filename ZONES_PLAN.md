# THE ZONES — DOOR HQ the hub, separate zones behind its doors, the open world gone

*Plan document, 2026-09-29. Z0 built (see §12). It replaces OPEN_WORLD_PLAN.md and
WORLD_GEOGRAPHY_PLAN.md (both move to docs/archive/ in Z0). House rules that stand over every phase:
no puzzles (secret pathways are fine, puzzle content is not); no sound work; no test files; no invented
names (plain labels: Zone 3, Room 2, Path A; only the names mondo wrote); every R2 delivery bumps `?v=`.*

mondo's brief (2026-09-29), the parts that decide things:

- "Ditch the open world entirely and go back to how it was before. Different explorable areas, with
  DOOR HQ being the main hub point/node."
- "Zones that you discover are more connected than you first think through different doors and
  secret pathways."
- "There shouldn't be loading screens inside DOOR HQ except for maybe going between different floors."
- "Keep the battle grid in mind when making maps."
- "Buildings and other areas: more like mystery dungeon maps, rooms and hallways. 2 areas of interest
  connected by 3 lanes, those 3 lanes with their own smaller connections."
- "Parking Garage you can take a Taxi to the City, somewhere else you can take a staircase to the
  woods. Those should be the only 2 open doors to the outside to start off. The rest of the world should
  be able to be reached from just those 2 starting points."
- "I shouldn't be able to see the entrance to one place from another place."

---

## 0. The verdict, in one paragraph

Go back to the door graph, because it is still there. Every place is still a room in `DOOR_HQ.rooms`,
every bay threshold still leads to its site's entry room, the site-to-site seams (`DOOR_HQ.links`, the
wardrobe, the well, the train) still exist, and the node map (THE WORLD / THIS AREA sheets, dated
2026-09-19, before the open world) still draws them. The open world added two things on top: THE LAND
(one baked 5.6 km ground with the sites standing on it, ~4,500 lines across data.js, three-renderer.js,
map.js, editor.js, plus bake-land.js and land.json) and THE STAGE (rooms drawn together and crossed
without a card). **Cut THE LAND whole. Keep THE STAGE, but only inside DOOR HQ**, where it is exactly the
tool for "no loading screens inside HQ": today only the medical wing, the basement and the D.U.M.B. are
staged; making each floor a staged zone is a data-table job on machinery that already works. Keep every
engine piece the plans built that does not need one ground (asset store, LOD, near-first queue, static
batch, memory budget, portals, the clock). Cut the far shells, the LAND and ATLAS map tabs, the `land`
room, the land edits inside the site rooms, and the editor's THE LAND mode. The world map is the node
map again. DOOR HQ has two open exits at the start (the garage's taxi and the fire stair into the woods);
every other way out of the building already exists and becomes a secret found later. Zones are built by
hand in the editor, one room per zone or per building floor, as rooms and hallways, with every exit in its
own room so no two exits are ever in sight of each other.

---

## 1. The answers (recommendation first, one reason each)

**What is on the physical map? — Nothing. There is no physical map.** The world is places joined by
doors, and half of them (Heaven, Hell, the Moon, Atlantis, Camelot through a wardrobe) cannot sit on one
landmass without lying. The map is the node map that already exists (§6): one node per zone, an edge per
door you have walked, a dashed edge per secret you have found, and per zone a rooms-and-hallways sheet
that fills in as you visit.

**Real world or a fictional landmass? — The real world, reached through doors, never drawn.** The
places are real-world places (Area 51, the Vatican, the Pyramids, the Strip); the story is that DOOR's
doors connect them, so distance is meaningless and a landmass map would contradict the premise. The node
map answers "how are these connected", which is the only question the player has.

**Where is DOOR HQ? — Not on any map, and not told. Antarctica, revealed late.** Canon already has the
"first Black Cube" DOOR claims to have destroyed in Antarctica (DOOR_MASTER.md:469), the main menu is a
lone door on the ice half the time, and an Antarctica site room exists. The two starting exits are both
DOOR-made routes (a taxi ride you never see the road of, a staircase standing in a forest), so the
building can be anywhere. The reveal: the foyer's front door (`street`, today the open world's door)
stays sealed until mondo's story point, then opens onto the ice shelf. mondo's call on the when.

**The battle grid? — Fixed 8×8 at 1.75 m (14 m square); every fight room needs one clear 14 m patch.**
`HQ_FIELD_RULES.size` is 8 and `hqFieldWindow` picks the 8×8 origin holding both combatants with the
most reachable cells; walls outside the room become rock. So: rooms of interest at least 12×12 tiles
(21 m) with one 8×8 patch free of props over 2.2 m; lanes 3–4 tiles wide, with an 8×8 bulge every ~30 m so
a lane fight is a fight and not a slot. Rules in §2.3.

**Node map or world map? — Node map.** It exists, it is honest, and it is what the door graph is.

---

## 2. The rules

### 2.1 The five elements (his list) mapped onto the game

| Element | What it is here | Where it is authored |
|---|---|---|
| **Districts** | ZONES: the Woods, the Estate, Disaster City… (§3). One zone = one to three editor rooms (a big outdoor room, plus interiors as their own rooms). | editor rooms; `zones` group in world.json (E7, §8) |
| **Nodes** | DOOR HQ globally; inside a zone, the rooms where lanes meet (a clearing, a plaza, a junction hall). Every node is a room of interest with a fight patch. | LAYOUT `space` rows |
| **Paths** | The lanes between nodes: dirt paths through tree walls, hallways, streets, tunnels. The "2 rooms, 3 lanes, cross-links" template (§2.2). | LAYOUT `hall` rows |
| **Landmarks** | One tall thing per zone seen from its lanes (a castle keep, the stadium's rim, a pyramid, the mansion's roof) so the player knows where they are. Never an exit. | MODELS / BUILD; sky landmarks (`hqRoomLandmarks`) |
| **Edges / boundaries** | What stops you: tree walls, cliffs, water, building walls. No invisible walls, ever. | LAYOUT look (walls / trees / rock); GROUND cliffs and water |

### 2.2 The template: two rooms of interest, three lanes, and their cross-links

```
Room 1 ──── Path A ──────┬────── Room 2
   │                     │          │
   ├──── Path B ─────────┼──────────┤
   │                     │          │
   └──── Path C ──── Room 3 ────────┘
                    (a side room off the cross-link; a secret door or a dead end)
```

- Path A is the obvious one (widest, straightest). Path B is longer with a fight bulge. Path C is the one
  that passes a side room (Room 3) and is where the secret pathway to another zone lives, if this zone has one.
- The cross-links between lanes are the "smaller connections". They make loops, so a player can go around
  a fight or come back a different way.
- A zone is this template repeated: Room 2 of one pair is Room 1 of the next.
- **The sight rule (his):** every exit to another zone stands in its own room, and every lane into that room
  bends at least once, so no exit is visible from another exit or from a room that holds one. With the
  TREES look the forest itself blocks sight; with WALLS the wall does; outdoors with no walls, a ridge or a
  building does (GROUND cliff / BUILD building).

### 2.3 The battle grid rules for a hand-built room

- Cell 1.75 m; the arena is 8×8 = 14 m × 14 m (`HQ_FIELD_RULES`, data.js ~51298). No bigger arena
  exists in the code (OPEN_WORLD_PLAN §5.6's 12/16 windows were never built).
- A room of interest: at least 12×12 tiles, with one 8×8 patch where nothing stands taller than 2.2 m
  (taller = a wall cell). Props under 0.5 m are floor, under 2.2 m are cover: place cover on purpose inside
  the patch, it is what makes the fight.
- A lane: 3 tiles wide minimum (a 2-tile lane fights inside walls of rock, which is fine once, not always);
  an 8×8 bulge every ~30 m.
- Height steps of 1.75 m (one level) are cover and vantage; steps over 1.46 m cannot be walked, so a
  terrace needs a ramp.
- Water: a room with `terrain.sea` never fights on its own ground (it falls back to the Δ board). Keep
  water as pools and streams, not a sea, in any room that should host encounters.
- An encounter needs the room to name a `site` (`hqEncounterRoomOk`, data.js ~49277). Editor rooms
  have no site today; §8 adds the field.
- The editor's AUDITS already checks "the fight window"; run it on every room of interest.

### 2.4 Loading

- Between zones: a door, and a fade. The blink is 700 ms before it becomes the load card
  (`HQ_WALK_BLINK_MS`, map.js ~365); the room behind any door within 20 m is warmed ahead
  (`_hqWarmTick`, `warmDoorM`), and a terrain room's floor plan compiles in a worker before you arrive.
  The taxi ride and the long stair are the two places a load is invisible by design: a ride is a fade.
- Inside a zone: a fade between the zone's rooms (a cave mouth, a building door, a stair down a dungeon
  level). These are the loads that are fine. A zone's big outdoor room is one room, so nothing loads inside it.
- Inside DOOR HQ: none, except the elevator (§7.2).

---

## 3. The zone graph (his list, plus the entries it needs)

Solid = a door the player finds by walking. **Secret** = a hidden or draught door, or a way (wardrobe,
well, train), found later. **DEFAULT** = an entry his list did not give; a fork in §10.

| Zone | Leads to (his list) | Entry into it | Exists today (data.js) |
|---|---|---|---|
| **DOOR HQ** | the City (taxi from the garage), the Woods (stairs) | — | the building, floors PH/4/3/2/M/G/B + B2 + H-Wing |
| **The Woods** | Fairy Forest, the Estate, Dead Man's Cave | HQ stairwell → the stair in the woods (`woods_stair`) | `fairy_forest_stair/clearing/redwoods/deadmans/ritual` |
| **The Fairy Forest** | Camelot, the looking glass | the Woods | `fairy_forest` parts; `lookingglass_garden` + astral parts |
| **Camelot Kingdom** | (the North Pole route stays as a secret) | Fairy Forest | `camelot_ward/hall/keep/dungeon/sky` |
| **Disaster City** | the mall, the stadium, the nuclear power plant site | HQ garage → taxi | `downtown_streets/lobby/showroom/subway/closet`, `downtown_mall`, `stadium_bowl`; plant: **new** |
| **The Beach** | the Bay | DEFAULT: Disaster City (the harbour side) | **new**; `downtown_harbour` is the Bay |
| **The Desert** | Area 51, the Strip, western town, the Pyramids | DEFAULT: Disaster City → Route 1 | `strip_streets/chapel/casino`, `area51_*`, `giza_plateau`; western town **new**; the desert itself **new** |
| **The Sewers** | the City, the Cavern | Dead Man's Cave (`woods_sewer` storm drain) | `downtown_sewers/tunnels/cells/workings` |
| **The Estate** | the Lake, the Haunted House / Graveyard, the Mansion, the Ranch, Crop Fields | the Woods | `skinwalker_fields` (crops), `haunted_*` + `haunted_grounds` (house = mansion, family plot); Lake **new**, ranch buildings **new** |
| **The D.U.M.B.** | Hangar 51, dream labs, the Cavern | Area 51 (THE BASES); secret: HQ garage motor pool (`garage_motorpool`) | `dumb_motorpool/sublevel7/dreamlab/clonevats/warroom/bunker`; `area51_hangar` is Hangar 51 |
| **Atlantis** | the Deep | the Deep | `atlantis_abyss/temple` |
| **The Deep** | Area 51, the Flying Dutchman, the Bay | the Bay (from the Beach) | `bermuda_sea`, `revenge_gundeck/cabin/hold/deck`, `downtown_harbour` |
| **Outer Space** | Moon, Mars, Saturn, Singularity, Spaceship | DEFAULT: Hangar 51 → the Spaceship (the ship's collar) | `derelict_*`, `moon_mare`, `mars_cydonia`, `saturn_hexagon`, `singularity_horizon` |
| **Heaven + Hell + Vatican** | — | Hell from the Cavern; DEFAULT: Vatican from Hell's crypt door (`vatican_hell`, secret); Heaven from the Vatican | `hell_pit`, `vatican_*`, `heaven_stair/gate` |
| **The Cavern** | Agartha, Hell, Leylines | the Sewers; the D.U.M.B. | `hollow_earth_*` + `hollow_earth_innersun`, `agartha_crystalcity` |
| **Leylines** | Ancient sites, new Bug Colony | the Cavern | `gobekli_leylines`, `stonehenge_henge`, `gobekli_tell`, `babel_tower`, `technoticlan_templecity`; Bug Colony **new** |

Reachability from the two exits: stairs → Woods → {Fairy Forest → Camelot, looking glass} {Estate →
Lake, Haunted House, Mansion, Ranch, Crops} {Dead Man's Cave → Sewers → City, Cavern → Agartha, Hell →
Vatican → Heaven, Leylines → ancient sites, Bug Colony}; taxi → City → {mall, stadium, plant, Beach → Bay
→ the Deep → Atlantis, Dutchman} {Route 1 → Desert → Strip, western town, Pyramids, Area 51 → D.U.M.B. →
Hangar 51 → Spaceship → Space}. Every zone is reached. The Deep ↔ Area 51 and the Pyramids ↔ Leylines
are the back ways that make the world "more connected than you think".

Sites not on his list that exist today (Cyberpunk, the Backrooms, the Lodge, Olympus, Mt Shasta, the
Grove, the North Pole, CERN, Flat Lands, Antarctica): they stay in the library. Their present seams
(subway → Cyberpunk, CERN ↔ Backrooms, Shasta ↔ Lemuria, Heaven ↔ Olympus, Camelot ↔ the Lodge and the
North Pole, looking glass ↔ Flat Lands) stay as secrets until mondo strikes or moves them. Antarctica is
the foyer reveal (§1).

---

## 4. The Woods, worked as the example

The entry zone, built first, as the proof of the template. One editor room, TREES look (tree walls the
walker cannot enter, dirt lanes), about 160 × 160 m. Plain labels; mondo names what he wants.

| Room | Role | Exit it holds | Notes |
|---|---|---|---|
| Room 1 | the stair clearing | back up the stairs to HQ | the staircase standing in the forest; the only thing here; 12×12 tiles |
| Room 2 | the first junction | none | three lanes leave it (A, B, C); the zone's landmark is seen from here (a tall dead tree, a rock, mondo's pick) |
| Room 3 | end of Path A | **the Fairy Forest** | the exit is in the far wall; Path A bends twice before it |
| Room 4 | end of Path B | **the Estate** (a gate, a fence line) | Path B is the long one with a fight bulge and a cross-link to Path A |
| Room 5 | end of Path C | **Dead Man's Cave** (a cave mouth, ROCK look inside as its own room) | Path C passes Room 6 |
| Room 6 | a side clearing off Path C | secret: the ritual room (`woods_ritual`, HQ Room 333) as a draught | a dead end unless found |

Rules checked: no exit is in Room 2; Rooms 3, 4 and 5 each hold one exit and are out of sight of each
other (the trees do it, and each lane bends); every room of interest has an 8×8 fight patch; lanes are 3–4
tiles wide with a bulge on Path B. The existing generated woods (`fairy_forest_clearing/redwoods`, gen
`rooms`) can be copied from the LIBRARY and FROZEN into layout rows as a starting point, then redrawn.

Dead Man's Cave is its own room (ROCK look, a dungeon with `+ LEVEL` if it goes deep) whose far door is
the Sewers' storm drain. The Estate's side of the gate is the Estate's Room 1.

---

## 5. Keep / cut

### 5.1 CUT (delete from the code, one delivery, Z0)

**data.js**
- THE LAND: `HQ_LAND` recipe (~41070–41374), `hqLandPlace/RegionLabel/Baked/Url/SightOk/Never`,
  `HQ_LAND_RULES` (~41410–41599), `HQ_LAND_STORE` + tile store + sampler (~41600–41900), discovery
  `HQ_LAND_DISC` + `hqLandRegionAt/WeatherAt/DiscoverAt/SeenRecord/See` and the save key `door.hq.land`,
  water `hqLandWater*` (~41898–42128), flora `hqLandFlora*` (~42129–42288), roads `HQ_LAND_ROADS` +
  `hqLandRoad*` (~42289–42461), grid/sites `hqLandGrid/Ids/WorldGrid/SiteFrames/Sites/SiteY/SiteAt/SiteGap`
  (~42462–42593), `HQ_LAND_EDIT_RULES` + `hqLandEd*` (~44160–44735, the editor's land tools).
- Room `DOOR_HQ.rooms.land` (~25206–25275). Foyer `street` door → sealed (`HQ_DOOR_LOCKED`), reserved for
  the Antarctica reveal (was `_hqExitToMenu` before G2; do not restore that).
- Land edits inside site rooms, restored from git `1ed44e1` (the last data.js before `HQ_LAND`) /
  `7beb9d9` (before G6): Dead Man's Cave `land` door (~32912), Downtown "city on the hill" (~33082, ~33155),
  the mall's `street` door (~33215, ~33405), Camelot's ward pad (~34657), the harbour cut to 220×110 (~37119).
- The three links G7 retired (`downtown_strip`, `stadium_downtown`, `streets_strip`, note at ~24384):
  restore from `6d1dac8`. Z3 re-routes `downtown_strip` through the Desert.
- Open world on one ground: `HQ_WORLD.zones.land` (~40213–40292) and its island joins; far shells
  `HQ_FAR_COLORS/hqFarColor/hqFarParts/hqFarGap/hqFarShell` (~40022–40140); `hqWorldBearing`,
  `HQ_WORLD_WEENIES` (~39980–40010; keep `hqRoomLandmarks`, it predates this); `hqWorldSheet`
  (~40862–41060, the LAND tab's model); the land branches of the terrain compiler (island sink, `_hqPartOnLand`).
- `HQ_WORLD_CLOCK.dayLook` rows that name land regions.

**three-renderer.js**
- THE LAND UNDERFOOT / THE WATER / THE TREES AND THE GRASS / `_hqLandBuildHQ` / THE ROADS / THE DISCOVERY /
  `_hqLandFeetAt/AirOK/CamBlocked/Disarm` (~52977–54970) and the hooks outside them (walker/ground ~41030,
  ~41037, ~50776, ~50935, ~50960, ~51025; sea ~54972–55029; ~56536; ~57131; tick ~57811; `_mmLine`'s land
  stats ~24252; enter/API ~61024–61048, ~61288–61307).
- Far shells `_hqFar*` (~58178–58304) and `hq.far`.
- The stage's land branches: `_hqStageLandPick/Early/Root` (~59050–59073), `_hqStageIslandAt/LandBeside`
  (~60384–60402).
- Switches `EW_NO_LAND_SPLAT/WATER_FX/FLORA/ROADS/DISC`.

**map.js**
- The LAND tab (`HQ_LAND_M`, `_hqLandModel/Svg/Pick/CardHtml/LocsHtml/KeyHtml`, ~4878–4995), the ATLAS tab
  (`_hqAtlas*`, ~5001–5190), the discovery title cards (`_hqLandEvent/_hqLandCardNext`, ~3700–3760,
  `onLand` at ~1193), the `land`/`atlas` modes in `_hqMap` and the mode buttons.
- Settings: "The World on Disk" keeps "Download this place" only if `hq.warmZone` is re-pointed at the
  HQ floor zones (§7.2); else the group goes.

**editor.js / world file**
- THE LAND mode whole (E4): the land map and 3D, brushes, paint, lines, PLACE/REGION/REVEAL/SIGHT, region
  weather, the land export (`Assets/World/land/`), `world.json.land`, `float` parts, dungeon "mouths" as
  land places. `hqLandEdInstall` and its ~50 call sites. Keep everything else (§8).
- The outliner's THE LAND row.

**Repo**
- bake-land.js and `npm run bake-land`; land.json; WORLD_GEOGRAPHY_MAP.jpg; WORLD_GEOGRAPHY_PLAN.md and
  OPEN_WORLD_PLAN.md → docs/archive/. docs/notes/areas-complexes.md keeps its THE LAND sections as history
  with a one-line "cut 2026-09-29" header.
- R2 `Assets/Land/` and `Assets/World/land/`: mondo deletes when he likes; nothing reads them after Z0.

### 5.2 KEEP

| Piece | Where | Why it stays |
|---|---|---|
| THE STAGE (door-joined parts drawn as one scene, crossed without a card) | data.js `HQ_WORLD.zones` medwing/basement/dumb + frame and stage readers (~40141–40748); three-renderer.js `_hqStage*` (~59007–60480 minus land branches); map.js `_hqStageCrossed` | the "no loading screens inside HQ" mechanism; Z2 extends it to every floor |
| Portals `_hqCull*` and door joins `_hqJoinOn/_hqJoinDoorTick` | three-renderer.js ~59183–59334, ~56936–56970 | hide staged parts behind shut doors; needed once a floor is one scene |
| Memory budget `_mm*` | ~24129–24255 | keeps a staged floor inside the heap |
| Asset store: `ASSET_MANIFEST.json`, `.opt.glb`, `?h=<sha>`, meshopt, bitmaps | three-renderer.js ~1474–1745, index.html ~286–290, optimize-assets.js, manifest-assets.js | download once; nothing to do with the land |
| Near-first queue, instance pass, LOD levels, static batch, build slices, compile warm-up | ~11292–11390, ~57832–58177, ~59382–59427, ~59716–60075 | frame rate in big rooms; the warm-up runs on room entry too |
| Door warm (`_hqBookRead/_hqWarmRoom/_hqWarmTick`, `warmDoorM`) | ~59493–59715 | the room behind a door within 20 m loads before you open it: this is what keeps a zone door a blink |
| The world clock (`HQ_WORLD_CLOCK`, `hqRoomClock`, `_hqClock*`, map.js clock) | data.js ~39883–39976; three-renderer.js ~60258–60383 | per-room via `sky.clock: true` (E6); no zone needed |
| The node map: WORLD + AREA sheets, `hqWorldOverview*`, `HQ_WORLD_L.slots`, `hqMapGraph/Layout`, `hqWorldGraph/Routes/Charted`, `hqLinkSee` | data.js ~39076–39790; map.js ~4525–5650 | THE MAP (§6) |
| The hub graph: bays, thresholds, `site_` aliases → entry parts, `DOOR_HQ.links/ways/routes/hubs`, `hqDoorEarned`, `doorSiteState` | data.js ~23779–24631, ~38400–38900 | it is "how it was before" |
| The room transition: blink → card, worker survey, THE WAY BACK | map.js ~226–460, ~1037–1160, ~6582–6660 | unchanged |
| Every data.js site room | data.js ~24743–38340 | the LIBRARY, and the live zones until mondo's rooms replace them, zone by zone (§8.3) |
| The editor E0–E3, E5, E6 (rooms, shapes, prefabs, palette, DOOR tool with LEADS TO, GROUND, water, LAYOUT rooms + hallways, looks, DUNGEONS + levels, FREEZE, SKY, clock preview, hide roofs) | editor.js | the tool the zones are built with |
| Built architecture (stadium, garage), the population rounds, capture, the door gun, the spell library, the encounter and field stages | — | untouched |
| `HQ_STAGE_RULES` engine rows (`instanceMin/Cell`, `lod*`, `mqDistMs`, `heapMB`, `cacheIdleMs`, `buildMs`, `tileM`) | data.js ~39836 | **split** into `HQ_ENGINE_RULES` so the stage table can shrink; measure_rooms.js:54 sets two of them, update it |

---

## 6. The map

- THE MAP = the WORLD sheet (one node per zone, HQ the block with a band per floor) and THIS AREA (the
  zone's rooms). Both exist; the LAND and ATLAS modes go.
- `HQ_WORLD_L.slots` is re-authored to the 16 zones of §3 (an authored table, not code). Sites not on the
  list get no slot and appear only once found, as today's fallback ring does.
- An edge is drawn when its door has been walked (`hqLinkSee` / `door.hq.links.seen`); a secret edge is
  dashed and appears only when found; an unfound zone is a `?` count in the rail, as today.
- THIS AREA for a zone built in the editor: rooms as nodes, lanes as edges, drawn as visited (the rooms
  seen ledger `door.hq.rooms.seen` is per room; the editor's `space` rows give the sub-rooms; Z3 draws
  them from the LAYOUT rows so a zone's sheet is its rooms-and-hallways plan, revealed room by room).
- Fast travel: the two-click GO exists and works on any node, `?` included. Default (§10): charted nodes
  only, from anywhere.

---

## 7. DOOR HQ, the hub

### 7.1 The two exits, and the secrets

| Way out | Today | Plan |
|---|---|---|
| Garage → taxi → Disaster City | no taxi; the garage has elevator, tunnel, dock doors; cabs are props | a taxi stand `way` in the garage (like the `train` way): walk to the cab, fade, arrive at a taxi rank in Disaster City's entry room; the rank's cab comes back. **Open at start.** |
| Stairwell → the stair in the Woods | exists: `woods_stair` (`stairwell` ⇄ `fairy_forest_stair`) | keep. **Open at start.** The stairwell's `landing` door is on floor 2 (`works`); mondo may want it off the ground floor instead (fork). |
| Foyer front door (`street`) | → the open world | sealed; the Antarctica reveal (§1) |
| Garage → D.U.M.B. motor pool (`garage_motorpool`) | a plain link | secret, found later |
| Stairwell / tunnel → the subway platform (`tunnel`, train to Cyberpunk, Downtown tunnels) | plain doors | secret, found later |
| Room 333 → the Woods (`woods_ritual`), the storm drain (`woods_sewer`) | links | secret, found later |
| Bay thresholds (7 sectors) | earned by missions, hidden until earned (`hqDoorEarned`) | unchanged: all shut at start, open as the story grants missions. They are the mission face, not exploration exits. Fork: strike them (§10). |
| H-Wing | secret door in `deadend` | unchanged |

"Open at start" = the two, exactly. Everything else out of the building is `secret: true` or earned.

### 7.2 No loading screens inside the building

- Today every facility room off the hall is its own load (the cafeteria, the office, Room 64, the
  reception…), and a floor change is two loads (floor → `car` → floor). Only the medical wing, the basement
  and the D.U.M.B. are staged.
- Plan: **each floor is one staged zone** of door-joined parts, exactly as `medwing` is today:
  M = `central_egress` + cafeteria, quartermaster, barbershop, reception, office, training, medical wing,
  records, foyer; 2 = `works` and its rooms; 3 = `annex`; 4 = `labs` (+ `dreamlab`); PH = `executive`;
  G = `garage` + tunnel + dock; B = `services` + the basement (staged already); B2 and H-Wing as they are.
  A row per floor in `HQ_WORLD.zones` (frames + door joins) and in `HQ_STAGE_RULES.zones`; the swing-door
  join (`swingM`) is the crossing.
- The elevator car stays a room: the ride is the floor load, which is the one load he allows. The car's
  own load is hidden inside the doors closing.
- Cost: the hall floor is the heavy one (the rotunda, three levels, nine rooms). The portals hide parts
  behind shut doors and the memory budget evicts; the MEM line says whether it fits. If a floor does not
  fit, the floor splits into two staged zones at a corridor door (still no card, since the corridor is a join).
- `hq.warmZone` / "Download this place" points at the floor zones.

---

## 8. The editor after this plan

### 8.1 What changes in the plan of phases

| Was | Becomes |
|---|---|
| E4 THE LAND (built) | **removed** in Z0. The E4 map/3D land, brushes, regions, reveals, sight, weather and the land export go. |
| E7 arenas + delete the old `_me*` editor | **E8**, unchanged in content |
| E8 the swap (`live: true`, retire the outdoor rooms, delete HQ_LAND) | **E9 the swap, one zone at a time** (§8.3) |
| — | **E7 THE ZONE TOOLS** (new, §8.2) |

### 8.2 E7 THE ZONE TOOLS (the small things hand-building zones needs)

1. **Door flags in the DOOR inspector**: SECRET (`secret: true`, the draught), ONE WAY (already the
   "its spawn" option; name it), LOCKED (`minClearance` / `requiresKeys`, the story's own gates; no new
   key items). Today they are RAW-JSON fields only.
2. **SITE on a room** (`site: '<mapId>'`): which battle map, population and encounter table the room
   belongs to. Without it no encounter can start (`hqEncounterRoomOk`). Picked from `EW_MAP_META`.
3. **ZONES**: a group of his rooms with a label and a map slot (`world.json.zones`, the same key the
   runtime reads for the map's node and, for HQ floors, the stage). The outliner shows rooms under their zone.
4. **LEADS TO overview**: a tab that draws `hqWorldGraph` for his rooms (nodes + door edges, secrets
   dashed, one-way arrows, doors that lead nowhere in red). The runtime function exists; the editor only draws it.
5. **THE SIGHT CHECK** in AUDITS: for a LAYOUT room, flag any two exit doors with a straight
   line-of-sight through open space, and any exit in a room that holds another exit (§2.2). A line test
   over the layout rows, not a render.
6. **The fight window audit** stays; add "no 8×8 patch in this space" per `space` row.

### 8.3 E9 the swap, one zone at a time

- `world.json.retire` lists the data.js rooms a finished zone replaces; `links` re-point the neighbours'
  doors at his rooms; `start` stays DOOR HQ. `live: true` flips the whole world file on; the per-zone
  part is just which rooms are in `retire` at each delivery.
- Order of swapping = the build order (§9). Until a zone is swapped, its data.js rooms are the zone.
- DOOR HQ itself stays a data.js building. It is not rebuilt in the editor unless mondo says so; the
  floor staging (§7.2) is data.js work.

---

## 9. The order (each a delivery: a merged PR + one zip of the R2 files)

| Phase | What ships | R2 files |
|---|---|---|
| **Z0 THE CUT** | §5.1 whole: the land out of data.js / three-renderer.js / map.js / editor.js, the `land` room and the site rooms' land edits reverted, the three links restored, the foyer door sealed, far shells out, LAND/ATLAS tabs out, `HQ_STAGE_RULES` split, bake-land.js + land.json + npm script deleted, the two plans archived, notes updated. Quick load check: HQ opens, the woods open from the stair, the map opens on WORLD. | data.js, three-renderer.js, map.js, editor.js, index.html (repo) |
| **Z1 THE TWO EXITS** | the taxi stand way (garage ⇄ Disaster City), the other ways out marked secret (§7.1), `HQ_WORLD_L.slots` re-authored to §3, `downtown_strip` re-routed as the Desert's entry once the Desert exists (until then Route 1 leads to the Strip's streets). | data.js, map.js |
| **Z2 THE FLOORS** | each HQ floor a staged zone (§7.2); the MEM line checked per floor; `warmZone` on floors. | data.js, three-renderer.js |
| **Z3 THE MAP** | THIS AREA drawn from LAYOUT rows for editor rooms; secret edges dashed; fast travel on charted nodes only. | data.js, map.js |
| **E7 THE ZONE TOOLS** | §8.2. | editor.js, data.js |
| **Z4 THE WOODS** | mondo builds §4 in the editor; a thread checks it against §2 and wires the retire/links (first E9 swap). Dead Man's Cave and the Estate's gate room with it. | world file (R2 `Assets/World/`), data.js if a neighbour door moves |
| **E8 ARENAS + the old editor deleted** | as EDITOR_PLAN E7. | editor.js, map.js, css |
| **Z5 onward, a zone per delivery** | the Estate, Disaster City (+ the plant site, the Beach), the Desert (+ western town), the Sewers, the Cavern, Fairy Forest + Camelot, the D.U.M.B., the Deep + Atlantis, Space, Heaven/Hell/Vatican, Leylines (+ Bug Colony). Order is mondo's; default = the order the player reaches them from the two exits. | world file per zone |

Z0–Z3 and E7 are Claude's code work and can go in two or three PRs. Z4 onward is mondo in the editor,
with a thread per zone for the swap and the checks.

---

## 10. Forks (mondo decides; the default is what gets built if he says nothing)

| # | Fork | Default | Why |
|---|---|---|---|
| 1 | Where DOOR HQ is | Antarctica, revealed late through the foyer's front door | uses the canon and the title screen; costs nothing until the reveal |
| 2 | The bay thresholds | keep, all shut at start, opened by missions | they are the mission system and the story's customs face, not exploration |
| 3 | Fast travel | charted nodes only, from anywhere | today's two-click GO minus the `?` nodes; HQ-only travel is one line if he prefers |
| 4 | The stage outside HQ | no; a zone's rooms are joined by fades | keeps zones cheap and the editor simple; HQ is where he asked for no loads |
| 5 | The Desert's entry | Disaster City → Route 1 | the old Downtown ⇄ Strip route, made a desert road |
| 6 | The Beach's entry | Disaster City, the harbour side | the harbour is the Bay already |
| 7 | The Vatican's entry | from Hell's crypt (secret) | the seam exists; a front door from the City is a fork he can add |
| 8 | Space's entry | Hangar 51 → the Spaceship | the ship's collar is the existing travel |
| 9 | The woods stair | off floor 2 (`works`), as today | moving it to the ground floor is one door row |
| 10 | Starting a zone in the editor | COPY the generated room from the LIBRARY, FREEZE, redraw | faster than flat; his ruling that the world starts flat still holds for anything he does not copy |
| 11 | Off-list sites (Cyberpunk, Backrooms, Lodge, Olympus, Shasta, Grove, North Pole, CERN, Flat Lands) | stay in the library, reachable only by their existing secret seams | he strikes or moves them zone by zone |

---

## 11. What exists where (so no thread re-searches)

- Room change: map.js `_hqWalkThroughDoor` (~6582) → `_hqDoAction` (~6640) → `_hqGoRoom` (~1447) →
  `_hqEnter` (~1037) → three-renderer.js `_hqEnter` (~60498). Blink/card: map.js ~365, ~1139.
- The hub: `central_egress` data.js ~24744; sectors ~23779; elevator stops ~23959; H-Wing ~23995;
  foyer ~25113; garage ~27550; stairwell ~29927; tunnel ~30003; links ~24167–24631; ways ~24055;
  routes ~24120; hubs ~24148.
- Staged zones: `HQ_WORLD.zones` data.js ~40141 (medwing ~40293, basement ~40316, dumb ~40154);
  `HQ_STAGE_RULES.zones` ~39856; stage core three-renderer.js ~59007–60480.
- The map: `HQ_WORLD_L` data.js ~39609; `hqWorldOverview*` ~39644–39790; map.js `_hqMap` ~4525,
  modes ~5455–5485, travel `_hqMapTravel` ~4611, directory ~5621.
- Encounters: `hqEncounterRoomOk` ~49277, `hqFieldRoomOk` ~51435, `HQ_FIELD_RULES` ~51298,
  `hqFieldWindow` ~51921, rasterisers ~51623–51778.
- Door flags: `secret` (data.js ~38987, three-renderer.js ~47645), `hidden` (~38410–38450),
  `minClearance/requiresKeys` (map.js ~4397), `doorSiteState` ~53626, `HQ_DOOR_LOCKED` three-renderer.js ~56873.
- Editor: tabs editor.js ~2347; DOOR tool ~2501–2594; LAYOUT ~1917–2002; DUNGEONS ~1995–2041;
  world file data.js ~43920–44143 (`hqWorldDocApply` ~44042); `_EW_WORLD_ID` index.html ~1423.
- Git restore points: `1ed44e1` (data.js before `HQ_LAND`), `7beb9d9` (before G6), `6d1dac8` (before
  G7 retired the three links), `d57556e^` (the foyer door before G2).

## 12. Log

- 2026-09-29: plan written. Nothing built.
- 2026-09-29: **Z0 THE CUT built** (token 20260929-zones-01-cors; R2: data.js, three-renderer.js, map.js, editor.js).
  THE LAND gone from all four (data.js: HQ_LAND + rules/store/sampler/discovery/water/flora/roads/grid/sites,
  HQ_LAND_EDIT_RULES + hqLandEd*, the `land` room, `HQ_WORLD.zones.land` + `grounds.land`, the far shells' readers,
  hqWorldBearing + HQ_WORLD_WEENIES, hqWorldSheet, the world doc's `land` apply, HQ_WORLD_RULES far*/island* rows;
  three-renderer.js the land block, far shells, stage land branches, `_hqPartOnLand`, `dev.land/water/flora/disc`,
  `hq.far`, `hq.landEdited`; map.js the LAND + ATLAS tabs and the discovery cards; editor.js THE LAND mode). The stage is
  HQ-only (`HQ_STAGE_RULES.zones` = medwing, basement, dumb); the engine rows moved to `HQ_ENGINE_RULES`. The foyer's
  front door is `sealed: true` (`doorSiteState` returns 'sealed' for it). Restored from 1ed44e1: the woods rooms' doors
  (clearing, stair, redwoods, ritual, Dead Man's Cave), the mall, Downtown (its G7 slope and steps gone); the clearing's
  trail/pasture doors and the stair's deer path dropped (those rooms were retired before the land). Links downtown_strip,
  stadium_downtown, streets_strip restored from 6d1dac8. Two stage joins became plain doors (Downtown quay ⇄ harbour,
  Area 51 gate ⇄ flight line); the harbour keeps its 220 × 110 box. Kept: `float` ground, the Phase 7 island joins (inert,
  no staged zone uses them). Left (dead, harmless): the `hq-land-*` / `hq-atlas-*` / `.ed-map` CSS. bake-land.js,
  land.json, WORLD_GEOGRAPHY_MAP.jpg and the npm script deleted; OPEN_WORLD_PLAN.md + WORLD_GEOGRAPHY_PLAN.md in
  docs/archive/. Load check: HQ opens, the foyer and the woods stair enter, no console errors. Next: Z1 THE TWO EXITS.
