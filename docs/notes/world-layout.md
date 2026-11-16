# Notes: world-layout — the whole world, its doors, and which zone comes next

Survey of 2026-11-16 (a thread on the SECOND side; first signed "owner" by mistake, corrected the same day), at main `afbbd24` (PR #1548). Nothing was built or rebaked for it.
**Where the docs and the data disagree, the data is the truth**; each such place is marked DATA below.

**THE MAP: `docs/plans/world-zones/world_state_map.png`** (drawn by `docs/plans/world-zones/draw-world-state.js`, which
writes an SVG; render it in a browser to a PNG). Built zones at their real size from the data, unbuilt zones placed as on
layout 3, every way between zones, the DOOR HQ doors, the missing ways in red, the proposed order as 1, 2, 3.

How it was read: `load-data.js` (the real data.js), `hqWorldGraph()` for every door and link, `hqHubOf()` for the zone a
room belongs to, `DOOR_HQ.retired` for the rooms a rebuilt area replaced. To redo it: load the data, walk
`hqWorldGraph().edges`, drop every room that is a key of `DOOR_HQ.retired`.

Sources for the plan side: `docs/plans/world-zones/world_layout.png` + `zone-layout-proposals.md` (LAYOUT 3, mondo's
"okay that's good" 11-15 19:37), `docs/plans/world-areas/world-areas-proposal.md` (revision 2, his answers),
`docs/project-memory/world-zones-plan-20261115.md`, ZONES_PLAN.md §3 (the zone graph), `docs/notes/claims.md`.

---

## A. The world as it stands

Numbers: 255 rooms in `DOOR_HQ.rooms`; about 148 are DOOR HQ, 105 are `site_*` rooms; 18 rooms are retired but still in the data (17 site rooms + the old `carnival`;
kept as the rooms the PvP boards are cut from). 76 links. 9 rooms are plot-built.

### A1. Every zone, how you get in, and its state

State words: **PLOTS** = rebuilt on 12 x 12 plots. **OLD** = still its handmade rooms. **PLAN** = a plot plan picture and
layout json exist in `docs/plans/world-zones/`, not approved zone by zone, nothing built. **INSIDE** = a handmade room kept
as the inside of a plot-built place.

| Zone | Room(s) today | State | Ways in (from) | Holder |
|---|---|---|---|---|
| DOOR HQ | 148 rooms, hub `central_egress` | handmade, stays handmade | | owner |
| Disaster City | `site_prebuilt_downtown_streets` (144 plots + THE HOLLYWOOD HILLS, 39 plots on its north side, one room since 11-16: you walk or drive up the mountain road or from the boardwalk's north end, no door) + INSIDE lobby, showroom, platform, mall, closet, stadium bowl | PLOTS | HQ garage taxi; Beach quay; Desert highway Exit 1; the Mountains (doors `shasta` + `ridge` on the Hills' west side); Woods storm drain; Sewers (pump court, dock) | owner (Civic Center + frame rate: second) |
| The Woods | `site_prebuilt_fairy_forest_plots` (36) | PLOTS | HQ stair (`woodstair`); HQ tunnel; city drain; Sewers drain; Camelot (trail + dead tree); Mountains snowline; Estate gate | owner |
| Camelot Kingdom | `site_prebuilt_camelot_kingdom` (64) + `site_prebuilt_camelot_palace`; OLD `site_prebuilt_camelot_sky` | PLOTS (sky castle OLD, waits mondo) | Woods (two ways); North Pole sleigh road; Haunted House upstairs (hidden); bay | owner |
| The Mountains | `site_prebuilt_shasta_mountains` (12 x 8), `site_prebuilt_northpole_plots` (16). (The Hollywood Hills left this zone on 11-16: they are Disaster City's north district; the old room `site_prebuilt_shasta_hills` is retired) | PLOTS | Woods snowline; Disaster City's Hills (doors `hills` + `saddle`, east side of Shasta); Camelot into the North Pole; Vatican cortile + Heaven cloud fields onto Olympus; Agartha (Lemuria stair); the Lodge | second |
| The Estate | `site_prebuilt_skinwalker_estate` (36) + INSIDE the Haunted House's five floors | PLOTS | Woods gate; the Cavern (two wells); the Lodge; hidden: Camelot, North Pole, Astral attic | second |
| The Desert | `site_prebuilt_area51_desert` (144) + INSIDE Hangar 18, the White Rooms, inside the Great Pyramid | PLOTS | city highway; HQ tunnel (the Circus) + HQ `mandela` mirrors; Leylines robbers' tunnel; D.U.M.B. up through Hangar 18 | second |
| The Beach | `site_prebuilt_bermuda_beach` (14 x 10, a sea room) + INSIDE the Flying Dutchman's four decks | PLOTS | city quay; HQ pool; the Dutchman; Atlantis whirlpool | second |
| The Sewers | `site_prebuilt_downtown_underworld` (a maze of 6 x 5 plots since 11-16: 24 + district R, the radioactive drain under the Power station; its own place) | PLOTS (first build 11-16, `bake-sewers.js`) | city pump court, dock, platform; stadium; Woods drain; HQ dungeon cells, garden well, tunnel; the Cavern oubliette (the Strip's and Cyberpunk's gutters dropped) | second (tool), districts free |
| The Cavern | `site_prebuilt_hollow_earth_cavern` (36 plots, one room since 11-16: the Cavern, Hollow Earth, Agartha; the Crystal City is a district now) | PLOTS (first build 11-16, `bake-cavern.js`) | Sewers old workings (the Oubliette); HQ dungeon (hidden); Estate wells (the Crossroads, the Mouth); Hell fissure; D.U.M.B. Level −6; Mount Shasta (the Lemuria Stair) + the Woods' trail; Technoticlan (the East Gate); Antarctica (two ways); Bay 3 (two doors) | second (tool), K the pilot STOPPED, H + A free |
| The D.U.M.B. | six rooms + CERN's ring | OLD + PLAN (36) | Hangar 18; HQ garage motor pool; the Cavern; Astral library (dream lab) | free |
| Heaven + Hell + Vatican | `site_prebuilt_vatican_plots` (6 x 4), `site_prebuilt_vatican_under` = the Catacombs (3 x 2), `site_prebuilt_hell_plots` (4 x 4), `site_prebuilt_heaven_plots` (4 x 5); the nine old rooms are retired (11-16) | PLOTS (66, a redesign) | HQ `continuity` painting (the Square's north colonnade); Mount Olympus two ways (the Pilgrim Stair from the Vatican's north wall, the Grand Stair from Heaven's east side); the Cavern's fissure (Hell's west wall); Camelot's sky castle (Heaven's west side); three bay doors; a CLOSED gate toward Disaster City in the Vatican's east wall | second |
| Leylines | ley tunnels, Stonehenge, Göbekli Tepe, Babel; Technoticlan is its own site | OLD + PLAN (45) | Giza robbers' tunnel; Technoticlan; bays | free |
| Leylines | `site_prebuilt_gobekli_ancient` (63: Göbekli Tepe, Bug Colony, Stonehenge, The Ley Line, Babel, Technoticlan) | PLOTS (11-16) | the Desert's Giza robbers' tunnel (west wall); Agartha under the Ball Court; DOOR HQ Rooms 9600, 56, 11, 2012 | second |
| The Deep (with Atlantis) | `site_prebuilt_atlantis_deep` (8 x 5, a drowned room) + INSIDE the Temple of the Deep (`site_prebuilt_atlantis_pocket`) | PLOTS (11-16; the old Abyss + Temple retired, kept as PvP board sources) | Beach whirlpool -> the Upwelling; the Dutchman's hold -> the wreck's hatch; HQ Room H-20 -> the Temple's inside | second |
| Outer Space | `site_prebuilt_moon_plots` (5 x 4), `site_prebuilt_mars_plots` (5 x 4), `site_prebuilt_saturn_plots` (4 x 4), `site_prebuilt_singularity_plots` (4 x 4): four rooms, one a world, 72 plots (11-16, `bake-space.js`, plot plan 3) + the Spaceship x4 (handmade, stays). Hub `space` | PLOTS (first build 11-16; the Spaceship handmade) | the ship's collar (Moon, Mars, Saturn; and Antarctica); Moon <> Mars (the bore); Saturn <> the Singularity (the frame); HQ `observatorium` to the Singularity; four bays | second (tool), district M piloted, nine districts free |
| Antarctica | `site_prebuilt_antarctica_plots` (6 x 6 = 36, a sea on its south side; 11-16, `bake-antarctica.js`, plot plan 2). Hub `antarctica` | PLOTS (first build 11-16; the Station is the pilot, 3 passes) | the Cavern twice (the Polar Opening to the Inner Sun, the Admiral's Tunnel to Agartha: both hidden); the Spaceship's airlock (the Collar, behind the Ice Wall); HQ bay door 90S (on the Station Yard) | second (tool STOPPED; S stopped at 3 passes; H W C O F free) |
| The Astral Realm | `site_prebuilt_lookingglass_realm` (36 islands over the void, one room since 11-16) + INSIDE the Waiting Room | PLOTS (first build 11-16, `bake-astral.js`; the old sea, nightmare and library are retired) | HQ `dreamlab` (into the Waiting Room, which has a frame to each district); Camelot's Looking-Glass Garden mirror (two-way, onto the Sea's Mirror island); D.U.M.B. dream lab (the Library's Ward Screen); the Haunted House attic (the Nightmare's Attic Screen) | second (tool STOPPED, waits mondo's look), S piloted, L + N free |

Loose sites that the world plan folds into a zone but that still stand as their own OLD rooms:

| Room | The plan says | Today |
|---|---|---|
| `site_prebuilt_lookingglass_garden` | a district of Camelot Kingdom (it IS in Camelot's layout) | still live beside the district: see A2 no. 2 |
| `site_prebuilt_bohemian_grove_grove` | part of the Woods' Ritual Ground | still live; reached from the Lodge and a bay |
| `site_prebuilt_lodge_halls` | the inside of Financial's Members club | still live; a junction of four hidden ways (Woods, Estate, Olympus, the Grove) |
| the Strip (streets, chapel, casino) | insides of Entertainment's Casino + Wedding chapel; the boulevard a PvP board | still live and still joined to the city (`link_downtown_strip`, `link_streets_strip`) |
| Cyberpunk City (streets, noodle bar) | later: a reskin of the whole city, not a place | still live; reached by the HQ tunnel and the Sewers |
| `site_prebuilt_agartha_crystalcity` | a district of the Cavern | live, no hub claims it (the map files it alone). `site_prebuilt_technoticlan_templecity` is retired into Leylines (11-16) |

(11-16: Outer Space has a hub now, `space`, anchored on the Spaceship's airlock. Antarctica has one too, `antarctica`, anchored on its one room.)

DATA: mondo's zone list in owner-rules.md has 16 names. The game's map (`DOOR_HQ.hubs`) has 15 hubs and they do not match
one to one: The Mountains and The Astral Realm are hubs but not on the list; Fairy Forest and Atlantis are on the list but
are a district (Camelot) and part of The Deep; Outer Space and Antarctica have no hub at all.

### A2. The door check

The good news first: **no door leads to a room that does not exist, and every live zone room can be reached from DOOR HQ
and has a way back.** The problems are all loose ends from the rebuilds.

| # | Problem | Where | What a fix would change |
|---|---|---|---|
| 1 | Three doors still name a retired room. The game sends you to the new room, but with no arrival spot, so you land at its default spawn, not at the matching door. | HQ `ritual` > the old Ritual Ground (link `woods_ritual`); the old Looking-Glass Garden > the old Ritual Ground (`deadtree_lookingglass`); the sky castle's `keep` + `chimney` > the old Keep | point each at a door of `…fairy_forest_plots` / `…camelot_palace` (Woods + Camelot bake tools, owner) |
| 2 | The Looking-Glass Garden exists twice: as a Camelot district and as the old room. Camelot's `oldgarden` door goes into the old room and nothing there leads back to Camelot. The HQ barbershop mirror and the Astral waiting room still open on the old room. | `site_prebuilt_lookingglass_garden` | retire it to Camelot (rule: rebuilt areas replace their old rooms); re-point the barbershop mirror and the waiting room's `garden` door at Camelot's district (owner) |
| 3 | CLOSED 11-16 (the Astral Realm zone thread): Camelot's mirror opens on the Sea of Possibility's Mirror island and that island's mirror leads back; the Waiting Room's `garden` frame opens on Camelot's mirror too. | `…camelot_kingdom.mirror` <> `…lookingglass_realm.mirror` | done |
| 4 | Two Woods trails are one-way. Each arrives at a door that belongs to another link, so walking back puts you somewhere else. | Woods `lemuria` > Agartha (walk back = the Mountains); Woods `lodge` > the Lodge (walk back = Bohemian Grove) | give each its own return door, or drop the trail: the Mountains now own the Lemuria stair (mondo's call) |
| 3 | Camelot's mirror into the Astral Realm is one-way: the waiting room's way back opens on the old garden, not Camelot. | `…camelot_kingdom.mirror` | solved by no. 2 |
| 4 | Two Woods trails are one-way. Each arrives at a door that belongs to another link, so walking back puts you somewhere else. | Woods `lemuria` > Agartha (walk back = the Mountains); Woods `lodge` > the Lodge (walk back = Bohemian Grove) | give each its own return door, or drop the trail: the Mountains now own the Lemuria stair (mondo's call) | UPDATE 11-16: the Cavern's room has the return door now (`woods`, at the Lemuria Stair, back to the Woods' `lemuria`); the Woods' own door still has to name it (`at: 'woods'`, owner side, note on the board). |
| 5 | Retired rooms still carry doors (old Keep 4, old Clearing 5, old Flight Line 4 and others, 25 in all). Nobody can enter them, so it is clutter, not a bug. | 10 retired rooms | empty their door lists when their zone is next rebaked |
| 6 | `DOOR_HQ.retired` names two rooms that are already deleted (`…camelot_hall`, `…camelot_castle`). Harmless. | data.js | none needed |
| 7 | Three rooms have no door at all: the old Downtown (`…downtown_oldstreets`), the Bermuda island, the Fairy Forest glade. All three are PvP board sources, kept on purpose. | | none; listed so nobody "fixes" them |
| 8 | One HQ door arrives at a door id that does not exist: `records.tapes` > `observatorium@projector`. | DOOR HQ | add the arrival door or fix the id (owner, HQ) |
| 9 | Every one of the 76 links is still flagged `draft: true`. | `DOOR_HQ.links` | nothing, unless the flag is meant to end one day (question for mondo if it matters) |

Not a problem, for the record: the bay thresholds are one-way out of the bay rooms by design (`ring_m` / `ring_g` take
the way back).

### A3. Districts, and one file per district (added 2026-11-16)

Relayed to this thread as mondo's order of 2026-11-16: "every single zone needs to be like that [one file per district,
like Disaster City's `docs/disaster-city/districts/`]. now. so we can work in parallel". Set-up threads are splitting the
six built zones into `docs/areas/<zone>/districts/<letter>.js`; each replaces its zone's board row with one row per
district. State below is main at `b055c5b` (PR #1551); recheck with `ls docs/areas/*/districts`.

| Zone | Districts (letter in its layout json) | District files |
|---|---|---|
| Disaster City | S Southside, C Civic Center, F Financial, U University, H Hero Plaza, E Entertainment, I Industrial, R Sports + Culture, B Bayside, N The Hollywood Hills (file `N.js`, on the rows north of the plots; 11-16) (+ L, Q shared files) | YES, `docs/disaster-city/districts/` |
| The Woods | T The Redwood Trail, G The Ritual Ground, C The Clearing, M Dead Man's Cave | yes since 11-16: `docs/areas/woods/districts/C.js T.js G.js M.js` (areas-complexes.md "THE WOODS, THE DISTRICT FILES") |
| Camelot Kingdom | K The Castle, T The Village, N The Snowy Pines, F The Fairy Forest, L The Looking-Glass Garden, W The Forest | not yet |
| The Desert | R The Highway, C The Circus, W Western Town, A Area 51, G Giza | not yet |
| The Estate | C The Corn Fields, R The Ranch, H The Haunted House + Graveyard, L The Lake | not yet |
| The Mountains | N The North Pole village, P The Snowy Pass, K The Ski Lodge + slopes, S Mount Shasta, O Mount Olympus (H The Hollywood Hills moved to Disaster City as its district N, 11-16) | not yet |
| The Beach | S The Shore, H The Harbour, O The Ocean, T The Bermuda Triangle | not yet |
| The Sewers (PLAN) | W The Sewers, O The Old Workings, T The Running Tunnels | none: not built |
| The D.U.M.B. (PLAN) | R Research, S Sub-Level 7, C Command, P Level P3 (CERN = the ring) | none |
| The Cavern | K The Cavern, H Hollow Earth, A Agartha | yes since 11-16: `docs/areas/cavern/districts/K.js H.js A.js` (areas-complexes.md "THE CAVERN ON PLOTS") |
| The Deep | C Atlantis, the Citadel (pilot: 3 passes), R Atlantis, the Rings, S The Sea Floor, T The Trench | not yet |
| Leylines (PLAN) | G Göbekli Tepe, B Bug Colony, S Stonehenge, Y The Ley Lines (the road), T Babel, Z Technoticlan | none |
| Heaven + Hell + Vatican | Vatican: B The Basilica (PILOT, 4 passes), S The Square, P The Palace, C The Cloister, G The Gardens · K The Catacombs · Hell: R The Rim, D The Descent, L The Bowl, W The Walkways · Heaven: T The Stairway, A The Gate, F The Cloud Fields, Y The City | yes since 11-16: `docs/areas/afterlife/districts/<letter>.js` (areas-complexes.md "HEAVEN + HELL + VATICAN ON PLOTS") |
| Leylines | G Göbekli Tepe, B Bug Colony, S Stonehenge (the pilot, 5 passes), Y The Ley Line, T Babel, Z Technoticlan | S done; the other five: first build only, rows free |
| Outer Space | the Moon: M The Mare, C The Crater, F The Far Side · Mars: Y Cydonia, V The Canyon, R The Rover Bay · Saturn: H The Hexagon, G The Ring Shard · the Singularity: D The Drop, A The Accretion Rim | yes since 11-16: `docs/areas/space/districts/<letter>.js` (ten files, the letters unique across the four rooms) |
| Antarctica | H The Hull in the Ice, W The Ice Wall, C The Crevasse, S The Station (pilot: 3 passes), O The Polar Openings, F The Shelf Ice | yes since 11-16: `docs/areas/antarctica/districts/<H W C S O F>.js` |
| The Astral Realm | S The Sea of Possibility (16), L The Library of Unthought Things (10), N The Nightmare (10) | yes since 11-16: `docs/areas/astral/districts/S.js L.js N.js` (areas-complexes.md "THE ASTRAL REALM ON PLOTS") |

**Rule for every zone not yet on plots:** its FIRST PR lays down the plots, the districts and one empty file per
district (`docs/areas/<zone>/districts/<letter>.js`) with the bake tool reading them, and puts one row per district on
the board, so district threads can start side by side at once. No zone starts as one big layout file again.

---

## B. The layout: how the zones sit

The approved picture is LAYOUT 3 (`docs/plans/world-zones/world_layout.png`). Disaster City is the middle; its four edges
decide the rest.

### B1. What borders what, and whether the game agrees

| Side | Layout 3 says | DATA |
|---|---|---|
| North | The Mountains run east to west; the Hollywood Hills over the city; the North Pole far north-west | built: the Hills are the city's own north district (no door: the mountain road and the cove are ground), the Hills' west doors up to the range, Woods snowline, Camelot's sleigh road |
| North-west | The Vatican at the foot of the mountains, a gate into Civic Center, Hell under it, Heaven over it, Olympus above | the Pilgrim Stair and the Grand Stair exist (to the OLD Vatican and Heaven rooms). The Civic gate is a closed gate with no door behind it |
| West | The Woods on the city's forest edge, Camelot beyond | built; the only city > Woods way is the hidden storm drain |
| South-west | The Estate under the Woods, the Ranch meeting the Desert | Woods gate built. No way between the Estate and the Desert |
| South | The Desert down the highway; the D.U.M.B. under Area 51 | built: Exit 1 to the city, Hangar 18 down to the (OLD) D.U.M.B. |
| South-east | Leylines east of Giza | built 11-16: the robbers' tunnel lands on the new room's west wall, where the Ley Line starts |
| East | The Beach off Bayside, The Deep under the sea | built: the quay, the whirlpool down to the OLD Abyss |
| Under | Sewers under the city's south side, then the Cavern, which opens on the D.U.M.B., Hell, Leylines | all there as OLD rooms |
| Far south | Antarctica | reached only from underground and the ship |
| Off the map | DOOR HQ, Outer Space, the Astral Realm | as drawn |

So the surface ring (Mountains, Woods, Camelot, Estate, Desert, Beach, city) is built and joined. **Everything still on
old rooms is below, above or beyond that ring**: the underground (Sewers, Cavern, D.U.M.B., Hell), the sky (Vatican,
Heaven), the sea floor (The Deep), the far east (Leylines), and the three off-map places.

**What each zone SHOWS past its line** (the land, the sky landmarks) against this table: `docs/plans/world-edges/edges-plan.md` (2026-11-16, the edges
thread). The Desert's sides and the city's Cove are fixed; the Mountains, the North Pole, the Woods, Camelot and the Estate are listed there, not built.

### B2. What is inconsistent or missing, with a fix each

1. **The underground plans are out of date.** The Sewers and Cavern plan pictures were drawn before the city's district
   move; their exits were never re-pointed (the memory file's own TODO). Fix: redraw `sewers_plot_plan.png` so its doors
   come up where the built city has them (the gutter, Church strip and Canal walk in Southside's south-west; the Pump
   court and drowned manhole in Industrial's south-east; the metro stair), then the Cavern's.
2. **Two finished surface zones point into old rooms on their far side.** The Mountains reach the old Vatican and old
   Heaven; the Beach reaches the old Abyss; the Desert reaches the old D.U.M.B. (Leylines is built since 11-16: its tunnel lands in the new room). Not broken, but each
   is the seam where a plot-built place drops you into a room at the old scale. Fix: only by building those zones.
3. **The Looking-Glass Garden stands twice** (A2 no. 2). Fix: retire the old room into Camelot.
4. **The Lodge and Bohemian Grove are not folded in.** The plan puts them inside Financial and the Woods; in the data
   they are still two old rooms carrying four hidden ways. Fix: fold them in (city + Woods, owner) and re-home their ways,
   or mondo says they stay as they are.
5. **The Strip is still a place.** The plan makes its casino and chapel the insides of Entertainment's buildings. Fix:
   re-point `link_downtown_strip` / `link_streets_strip` at those buildings and keep the boulevard as a PvP board.
6. **The Estate's Ranch touches the Desert on the map but no way joins them.** Fix: a gate or road between the Ranch and
   the Desert's highway (both rooms are the second side's), or leave it a border. mondo's call.
7. **The Vatican gate in Civic Center is a gate to nothing** until the Vatican is built. Nothing to do before then.
8. **Outer Space has one way in that the plan does not want as the first**: the ship docks at Antarctica; ZONES_PLAN's
   default is Hangar 18. Open question below.
9. **The zone list and the map disagree** (A1, DATA). Fix: once mondo confirms the merges, rewrite the zone-name line in
   owner-rules.md §2 to the real set and give Outer Space and Antarctica a hub row.

---

## C. Which zone next

### C1. What was weighed

- **His rules:** every area is plot-built; each zone needs its own plot plan picture and his explicit OK before any build;
  a rebuilt area retires its old rooms in the same change.
- **Not built:** The Sewers, The Cavern, The D.U.M.B., Heaven + Hell + Vatican, Leylines, The Deep, Outer Space,
  Antarctica, The Astral Realm. All nine are `free` on the board.
- **Who holds the neighbours** (this thread is on the second side): the Estate, the Desert, the Mountains, the Beach
  and Civic Center are held by sibling threads on this account, which can be told directly. Disaster City, the Woods,
  Camelot and DOOR HQ are the owner side's: this side cannot edit their rooms or bake tools, only leave a note on the
  board. So a zone whose doors land in owner rooms costs a board note and a wait; one whose doors land in second rooms
  does not.
- **Waiting already:** five built zones wait for mondo's look; Camelot's next four pieces, the HQ elevator and several
  city districts wait for his answers. A new zone adds a sixth thing to look at.
- **What unlocks most:** counted as ways into zones that are already built on plots.

| Zone | Plots | Ways into built zones | Neighbour held by | Blocked by |
|---|---|---|---|---|
| The Sewers | 16 | 7 (city x3, Woods, HQ x3) + the Strip, Cyberpunk, stadium | owner (the city) | its plan picture must be redrawn for the moved districts |
| Heaven + Hell + Vatican | 48 in 3 rooms | 5 (Olympus x2, Camelot's sky castle, HQ painting, the Civic gate) | second (Mountains, Civic) | the sky castle waits mondo; two neighbours to coordinate |
| The D.U.M.B. | 36 | 2 (Hangar 18, HQ garage) | second (Desert) | the White Rooms question (the plan moved them down; the Desert kept them up) |
| The Deep | 40 | 3 (the whirlpool, the Dutchman, Room H-20) | second (Beach) | BUILT 11-16 (areas-complexes.md "THE DEEP ON PLOTS"); no way to Area 51 (mondo); `world_state_map.png` not redrawn for it yet |
| The Cavern | 36 | 3 (HQ dungeon, Estate wells) | second (Estate) | wants the Sewers first (its main way in); plan exits out of date |
| Leylines | 63 | BUILT 11-16 | second | five districts wait their threads; the Bug Colony needs models |
| The Astral Realm | 36 | 3 (HQ, Camelot mirror, attic) | owner / second | A2 no. 2 first |
| Outer Space | 144 | 0 walked (HQ observatorium only) | | where the ship leaves from; flying is a new system |
| Antarctica | 12 | 0 | | story: the foyer reveal comes late |

### C2. The ranked shortlist

1. **The Sewers (recommended).** It is the smallest zone in the plan (16 plots) and it has more doors into built places
   than any other unbuilt zone: three city doors, the Woods drain, three HQ ways. It is also the gate to the whole
   underground: Woods > Sewers > Cavern > D.U.M.B. / Hell. The first quest's lift ride shows the Sewers first on the
   way down. Cost of entry: redraw its plan for the moved districts, show mondo, wait for his OK. Its first PR sets up
   three district files (W, O, T) per A3, so three threads can build at once. The catch: every one
   of its doors lands in an owner-side room (the city, the Woods, DOOR HQ). The old rooms can be retired so those doors
   still arrive in the new room, but landing each at its matching manhole needs the owner side's bake tools, by a board
   note, or mondo hands the Sewers to an owner thread.
2. **Heaven + Hell + Vatican.** The most visible gap: the Mountains' two stairs, the city's Civic gate and Camelot's
   sky castle all end at it. Three rooms make it the bigger job, but its main neighbours (the Mountains, Civic Center)
   are sibling threads on this side; only the sky castle and the HQ painting are the owner side's.
3. **The D.U.M.B.** The Door Agent's own point of entry, behind the HQ garage and under the built Area 51. Needs the
   White Rooms answer; the Desert's holder is a sibling thread on this side.

After those: the Cavern (straight after the Sewers), The Deep (once mondo has seen the Beach), Leylines, the Astral
Realm, Antarctica, Outer Space last.

### C3. Questions only mondo can answer

1. The pick: The Sewers next? (Then a redrawn plot plan picture comes first, for his OK.)
2. His stated goal is a PvP demo plus the first quest's polish. Does a new zone go ahead now, or after the five built
   zones have had his look?
3. The Sewers: stay their own zone by name, as on his list, or count as Disaster City's lower level, as the world plan
   proposes? (Either way one room of 16 plots.)
4. The old Looking-Glass Garden: retire it into Camelot's district? The Lodge and Bohemian Grove: fold into Financial
   and the Woods as the plan says, or leave them?
5. The Strip: its casino and chapel into Entertainment, the boulevard kept only for PvP?
6. Still open from layout 3: the Ice Wall round the world's rim; The Deep to Area 51; where the Spaceship leaves from
   (Hangar 18, Antarctica, or both).
7. A way between the Estate's Ranch and the Desert, or only a border?

---

## D. mondo's answers of 2026-11-16 (after the survey) and what was started

- The eight zones still on old rooms get a thread each and are REDESIGNED on plots and districts, not ported
  (`docs/plans/ZONE_THREAD_BRIEF.md` holds his words and the method).
- The White Rooms go to The D.U.M.B. The Deep is an underwater room. NO way between The Deep and Area 51.
- A door from Camelot's Looking-Glass Garden to the Astral Realm's Sea of Possibility. BUILT 11-16 (the mirror, two-way).
- Where the Spaceship leaves from and how the player reaches it: undecided, "let's just get the world built".
- Antarctica as the late-game reveal is only a possibility: build it like any zone.
- Exits may move with a redesign ("it's not that big of a deal"). New models come after, from the threads' lists
  (`docs/plans/MODEL_WISHLIST.md` is the first collected list).
- Earlier the same day: the Hollywood Hills became Disaster City's district N; The Sewers were built (five districts);
  every district of every built zone got up to five passes (`docs/plans/DISTRICT_THREAD_BRIEF.md`).
- **Outer Space built (11-16, the zone thread):** four rooms, one a world, on plots (plan 3); the Spaceship untouched. Door check: every bay, collar course and link lands at its own door in the new rooms; `hqWorldGraph()` has no edge into the four retired space rooms. Where the ship leaves from is still open; flying it is listed, not built (areas-complexes.md "OUTER SPACE ON PLOTS").

### Heaven + Hell + Vatican is on plots (2026-11-16, the zone thread)
- Built as four rooms (plan 2, `docs/plans/world-zones/heaven-hell-vatican_plot_plan_2.png`): rows A1 and A3 above are updated. B2's item 2 is half closed: the Mountains' two
  stairs now end in the NEW Vatican and the NEW Heaven. Item 7 stands as it was, from the other side: the Vatican's gate is built, in its east wall, CLOSED; the link is the
  Disaster City holder's to add (a board note names the place).
- THE DOOR CHECK for this zone (`hqWorldGraph` + each room's doors read after the bake): every one of the seven links and three bay doors resolves to a room that exists, both
  ways; the Vatican and its Catacombs are joined by two door pairs (`crypt` <> `stair`, `well` <> `well`). Loose ends: the Cavern's end of `cave_hell` still stands in the old
  vent room's frame until the Cavern thread re-points it (their end; a board note); `skycastle_stair`'s far end is Camelot's old sky castle room (owner side, waits mondo).
