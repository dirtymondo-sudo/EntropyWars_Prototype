# The world as plot-built areas: a proposal

For mondo, 2026-11-15. **Revision 2**, after your answers at 12:06 UTC: Cyberpunk City is the whole of Disaster City in the future (not a district), the Astral Realm is built from plots too, everything else stands, and Mount Olympus is worked through in section 4b. **Nothing here is built or merged.** Names are the ones already in the game or in your own lists; where a thing has no name yet I use a plain label and say so.

Read from main at PR #1414: your zones-and-rooms list, ZONES_PLAN.md, the Disaster City pipeline (bake-disaster-city.js, docs/disaster-city/), data.js (134 playable units, each unit's point of entry and biome tags, your AREA UNITS tables, the 44 city residents), DOOR_STORY.md (your cast), and the animal catalogue.

## 1. The short version

- **14 plot-built areas plus DOOR HQ**, in place of today's 16 zones and about 20 loose sites. Each area is one idea pushed to its ultimate form, built from 12 x 12 plots grouped into named districts, the same way Disaster City is. Only DOOR HQ stays handmade.
- **Three merges I recommend:** the Fairy Forest becomes a district of Camelot Kingdom (the ultimate storybook land), Atlantis becomes a district of The Deep (the ultimate ocean), and The Sewers becomes Disaster City's lower level.
- **One new area:** a polar area for the North Pole and Antarctica, which exist today but sit on none of your zones. Five units (Yeti, Ice Queen, Santa Clause, Nordic, Kaiju) have nowhere else to live.
- **Every one of the 134 units gets a home district** (table in section 6). Their homes follow the "point of entry" already written on each unit's file, so nothing about the units is invented.
- **Nothing is deleted.** Handmade rooms are either kept as the insides of buildings, ported onto plots as a district, or kept as PvP boards.
- **Size:** about 510 new plots in total, against Disaster City's 144. No single room is bigger than 64 plots, because Disaster City at 144 plots runs at about 20 FPS on your Mac. Most new plots are land (trees, sand, water), which cost far less than city plots.
- **Zones stay separate, DOOR HQ stays the hub, no open world.** Areas join by doors, roads that fade, the taxi and the stair, as in your zone graph.

## 2. What "built like Disaster City" means for every area

These are the rules the city already follows, restated so they fit a forest or a desert as well as a street.

| Rule | In Disaster City today | In any other area |
|---|---|---|
| The plot | 12 x 12 squares of 3.5 m, so 42 m a side | The same. One plot is exactly one 12 x 12 battle board, so a fight can happen on any plot without a crop. |
| The district | 16 plots (4 x 4), one landmark, its own look (lamp colour, kerb, banner) | 6 to 16 plots, one tall landmark you can see from its paths, its own ground, trees, light and edge pieces |
| The roads | Streets inside the plots, sidewalks, alleys | Whatever the place walks on: dirt paths, a highway, boardwalks, cave lanes, a ley line. Whole squares wide (your 11-13 rule). |
| Plot edges | Buildings back to back or open ground, never one repeated wall | Tree walls, dunes, cliffs, hedges, water, rock. Mixed, never one repeated piece. |
| Levels | A height per plot (levels.js), slopes, stairs, ramps | The same file per area. Mountains, terraces, pits and sea floors come from it. |
| The area's edge | Mountains north, forest west, desert south, the bay east | Each area gets natural edges that hint at its neighbours |
| Buildings | Every building unique and recognisable, walk-in with swinging doors, big windows | The same wherever there are buildings. A tent, a tomb or a barn counts as a building. |
| Insides | First pass (floor plan), second pass (atmosphere, missing props by Meshy with your OK) | The same two passes |
| People | Residents with a home, a day on the world clock, a bed | The same, kept few and never blocking |
| Props | Barriers centred on whole squares, decor off centre, everything real size | The same |
| Files | city-layout.json, levels.js, one file per district, pack-claims.md, one bake tool | One folder per area with the same five things (see section 8) |

## 3. The proposed areas at a glance

Status words: **KEPT** (your zone, same idea), **MERGED** (two of your zones or loose sites joined), **NEW** (not in the game yet), **HANDMADE** (stays as it is, no plots).

| # | Area | The ultimate... | Districts | Plots | Rooms | Status |
|---|---|---|---|---|---|---|
| 0 | **DOOR HQ** | subconscious; the hub | the floors and wings as today | none | as today | KEPT, HANDMADE |
| 1 | **Disaster City** | city | the nine built districts + The Sewers below. Later: the same city in the future (Cyberpunk), a reskin of all 144 plots | 144 + 16 | 2 | KEPT, with the Strip, the Stadium, the Lodge and the Sewers MERGED in |
| 2 | **The Woods** | wild forest | The Clearing, The Redwood Trail, Dead Man's Cave, The Ritual Ground | 36 | 1 | KEPT, with Mount Shasta and Bohemian Grove MERGED in |
| 3 | **Camelot Kingdom** | storybook land | The Fairy Forest, The Looking-Glass Garden, The Castle, The Town | 48 | 1 | MERGED (Fairy Forest + Camelot); The Town is NEW |
| 4 | **The Estate** | haunted countryside | The Corn Fields, The Ranch, The Haunted House + Graveyard, The Lake | 36 | 1 | KEPT; Ranch and Lake are NEW (both on your list) |
| 5 | **The Beach** | coast | The Shore, The Harbour, The Island | 24 | 1 | NEW room for your zone; the Harbour, the Flying Dutchman and the Bermuda Triangle MERGED in |
| 6 | **The Desert** | desert | The Road, Western Town, Giza, Area 51 | 64 | 1 | KEPT; Giza moved in from Leylines; Western Town is NEW (on your list) |
| 7 | **The Deep** | ocean | Atlantis, The Trench | 27 | 1 | MERGED (Atlantis + The Deep) |
| 8 | **The D.U.M.B.** | secret base | Level P3, Sub-Level 7, Research, Command, with CERN as the ring round it | 36 | 1 | KEPT, CERN and Area 51's White Rooms MERGED in |
| 9 | **The Cavern** | underworld of rock | The Cavern, Hollow Earth, Agartha | 36 | 1 | KEPT |
| 10 | **Leylines** | ancient mystery | Stonehenge, Göbekli Tepe, Babel, Technoticlan, Bug Colony | 45 | 1 | KEPT; Giza moved out; Bug Colony is NEW (on your list) |
| 11 | **Heaven + Hell + Vatican** | afterlife | Hell, The Vatican, Heaven | 48 | 3 stacked | KEPT, Mount Olympus MERGED into Heaven |
| 12 | **Outer Space** | space | the Moon, Mars, Saturn, the Singularity, and the Spaceship between them | 36 | 4 + the ship | KEPT |
| 13 | **The Poles** (working label, yours to name) | frozen end of the world | North Pole Village, Antarctica Station | 24 | 2 | NEW AREA from two rooms that exist |
| 14 | **The Astral Realm** | dream | The Sea of Possibility, The Nightmare, The Library of Unthought Things, with The Waiting Room as the way in | 36 | 1 | KEPT, now plot-built (your call 11-15) |

DOOR HQ stays handmade (your call 11-15): it is the subconscious, so it keeps its corridors and rooms that do not line up, and everything outside it stands on the grid.

## 4. Each area

For each district: what it is built from, and whether that is a room you already have.

### 1. Disaster City (the ultimate city) · 144 plots built, 32 proposed

| District | Built from | Status |
|---|---|---|
| Southside, Civic Center, Financial, University, Hero Plaza, Entertainment, Industrial, Sports + Culture, Bayside | the 144 plots | KEPT as built |
| The Strip, folded into **Entertainment** | Entertainment already has a Casino, a Cabaret and a Wedding chapel plot. THE CASINO FLOOR and THE CHAPEL become the insides of those two buildings. The old boulevard room stays as a PvP board. | MERGED. Your first zone list had the Strip under the Desert, so say if you would rather have it there. |
| The Football Stadium, folded into **Sports + Culture** | the district already turned four plots into the Stadium; THE BOWL is its inside | MERGED (mostly done already) |
| The nuclear power plant from your zone list | Industrial's Power station plot | MERGED, no new plot needed |
| The Lodge, folded into **Financial** | THE LODGE · THE HALLS becomes the inside of Financial's Members club. The Marksman, General and Politician have the Lodge as their point of entry and already live in this district. | MERGED (proposal) |
| The Mall, the Tower Lobby, the Showroom, the Platform | insides behind city doors, as today | KEPT |
| **Cyberpunk City** | Not a district (your call 11-15). It is the whole of Disaster City in the future: the same 144 plots, the same streets and buildings, reskinned. Not started and not planned here. The good news for later: because the city is written as plot and district files, a reskin is a second set of looks (walls, signs, lights, sky, props per district) over the same layout, with no new map to design. Until then today's Cyberpunk streets room and THE NOODLE BAR stay as they are behind the Metro, so the units whose home is Cyberpunk City keep a place to stand. | KEPT as it is, waits for the future city |
| **The Sewers** | The city's lower level in its own room of 16 plots, lined up under the plots above so a manhole comes up where you expect. Ports the Sewers, the Running Tunnels, the Holding Cells and the Old Workings (about 25 plots of floor today). Doors at the Pump court and the Dock edge as now; the way on to the Cavern stays. | MERGED. Still shown by its own name. |

### 2. The Woods (the ultimate wild forest) · 36 plots (6 x 6, 252 m)

The forest of campfire stories: big trees, things seen once, robed people round a fire. First area off the HQ stair.

| District | Built from | Status |
|---|---|---|
| The Clearing (9) | THE CLEARING: the stair from HQ, the crossroads, the Old Tree | KEPT, ported |
| The Redwood Trail (9) | THE REDWOOD TRAIL plus MOUNT SHASTA · THE SLOPES (meadow, falls, shelf, snowline) as the high end of the trail | MERGED. Shasta is not on your zone list today; Bigfoot, Shaman and Ki Fighter have it as their point of entry. |
| Dead Man's Cave (9) | DEAD MAN'S CAVE: the storm drain, the channel, the way down to the Sewers | KEPT, ported |
| The Ritual Ground (9) | THE RITUAL GROUND plus BOHEMIAN GROVE (the lake, the stage, the owl) | MERGED. The five cult members of the Family already stand in the Grove; the Cult Leader and Fortune Teller have it as their point of entry. |

Ways out, as in your zone graph: Camelot Kingdom (through the Fairy Forest), the Estate, the Sewers.

### 3. Camelot Kingdom (the ultimate storybook land) · 48 plots (8 x 6, 336 x 252 m)

Every fairy tale in one place: the enchanted forest, the garden through the mirror, the castle, the town under it.

| District | Built from | Status |
|---|---|---|
| The Fairy Forest (12) | THE FAIRY FOREST glade (today only a battle board, nobody can walk to it): the ring, the paths, the knolls | MERGED into Camelot (proposal). Its name stays on the district. |
| The Looking-Glass Garden (12) | THE LOOKING-GLASS · THE GARDEN: hedges, chessboard, tea table. The mirror here leads to the Astral Realm. | KEPT, ported |
| The Castle (12) | THE OUTER WARD on plots; THE GREAT HALL, THE KEEP, MERLIN'S UNDERCROFT and THE CASTLE IN THE SKY stay as its insides | KEPT |
| The Town (12) | nothing yet: houses, a market, a smithy, an inn, a chapel under the castle wall | **NEW (proposal).** A kingdom with no town is only a castle. It gives Robin Hood, the Swordfighter and the Priest somewhere to stand. |

If you would rather keep the Fairy Forest as its own area, it works as a 24-plot area with the Looking-Glass Garden inside it, and Camelot drops to 24.

### 4. The Estate (the ultimate haunted countryside) · 36 plots (6 x 6, 252 m)

| District | Built from | Status |
|---|---|---|
| The Corn Fields (9) | THE CORN FIELDS (Skinwalker Ranch's fields, the crop circles) | KEPT, ported |
| The Ranch (9) | nothing yet: barn, farmhouse, paddock, windmill. The cow, horse and chicken models are already in the game. | NEW (on your zone list) |
| The Haunted House + Graveyard (9) | THE GROUNDS (drive, family plot, crypt, gazebo, treehouse) on plots; the Hall, Upstairs, Nursery, Attic and Cellar stay as the house's insides | KEPT |
| The Lake (9) | nothing yet | NEW (on your zone list). A second home for the Loch Ness Monster. |

### 5. The Beach (the ultimate coast) · 24 plots (6 x 4, 252 x 168 m)

| District | Built from | Status |
|---|---|---|
| The Shore (8) | nothing yet: sand, palms, surf, beach huts. Joins Bayside's Boardwalk exit. | NEW (your zone, no room today) |
| The Harbour (8) | THE HARBOUR (long pier, skiff, breakwater), with THE FLYING DUTCHMAN moored at the pier. Its four decks stay as the ship's insides. | MERGED |
| The Island (8) | THE BERMUDA TRIANGLE: the cay, the jetty, the lagoon, the maelstrom offshore. The Island room is only a battle board today. | MERGED. The way down to The Deep is here. |

### 6. The Desert (the ultimate desert) · 64 plots (8 x 8, 336 m)

Your example. Big because desert plots are nearly empty and so nearly free.

| District | Built from | Status |
|---|---|---|
| The Road (16) | THE ROAD, the opening cutscene's set: one road, one door. Open sand, the highway in from Disaster City's south edge, a gas station from the city's chain. | KEPT, becomes walkable |
| Western Town (16) | nothing yet: main street, saloon, jail, bank, stables, church, boot hill. A saloon door and a barn door are the only western pieces in the game today. | NEW (on your zone list) |
| Giza (16) | GIZA · THE PLATEAU: the three pyramids, the Sphinx, the causeway, the dig. The room is 41 plots of mostly bare sand today; 16 holds everything in it. | MOVED from Leylines, as you suggested. Keep a hidden way from Giza to the Leylines so the "more connected than you think" link stays. |
| Area 51 (16) | THE GATE, THE FLIGHT LINE and HANGAR 18 on plots. THE WHITE ROOMS move underground into the D.U.M.B. The hangar's floor lift is the way down. | KEPT |

Babel could also live here as a fifth district. I left it in Leylines so that area keeps four ancient sites.

### 7. The Deep (the ultimate ocean) · 27 plots (9 x 3, 378 x 126 m)

| District | Built from | Status |
|---|---|---|
| Atlantis (18) | THE ABYSS (the sunken agora rebuilt on 11-13, the drowned road, the wreck) and THE TEMPLE OF THE DEEP as its dry inside | MERGED into The Deep. The game's own map already groups them. |
| The Trench (9) | the trench at the end of the Abyss, made its own dark district | Proposal: a plain label taken from the Abyss room's own subtitle |

### 8. The D.U.M.B. (the ultimate secret base) · 36 plots (6 x 6, 252 m), all underground

| District | Built from | Status |
|---|---|---|
| Level P3 (9) | THE MOTOR POOL, the tram. The secret way up to the HQ garage stays. | KEPT |
| Sub-Level 7 (9) | THE TEST CHAMBERS (16 plots of floor today) | KEPT, tightened |
| Research (9) | DREAM RESEARCH, CLONE RESEARCH, and Area 51's WHITE ROOMS | MERGED |
| Command (9) | THE WAR ROOM and THE BUNKER | KEPT |
| CERN | THE RING run as the ring corridor round the whole base, with the detector hall on one side | MERGED (proposal). CERN is already filed under the D.U.M.B. on the game's map. |

### 9. The Cavern (the ultimate underworld of rock) · 36 plots (6 x 6, 252 m)

| District | Built from | Status |
|---|---|---|
| The Cavern (12) | THE CAVERN crossroads with THE FISSURE, LEVEL −6, THE CRYSTAL ADIT, THE MOUTH and THE OUBLIETTE as its lanes and side chambers | KEPT |
| Hollow Earth (12) | THE INNER SUN: the country under the crust, the crystal forest | KEPT |
| Agartha (12) | THE CRYSTAL CITY: terraces, the lake, the spire | KEPT |

Ways out as in your graph: the Sewers, the D.U.M.B., Hell, Leylines. The zone row "THE CAVE" that points at a room that was never built can simply point here.

### 10. Leylines (the ultimate ancient mystery) · 45 plots (9 x 5, 378 x 210 m)

THE LEY LINES room becomes the road: one great line running the length of the area, with each site a district on it.

| District | Built from | Status |
|---|---|---|
| Stonehenge (9) | STONEHENGE · THE PLAIN. The stone circle itself fits on one plot; the room is 27 plots of grass today. | KEPT, tightened |
| Göbekli Tepe (9) | THE TELL: the mound, four enclosures, the dig | KEPT, tightened |
| Babel (9) | THE TOWER: four tiers, the spiral, the kiln | KEPT, tightened |
| Technoticlan (9) | THE TEMPLE CITY: causeway, canal, ball court, pyramid | KEPT |
| Bug Colony (9) | nothing yet. The ant, anthill and bee models are already in the game. | NEW (on your zone list) |

### 11. Heaven + Hell + Vatican (the ultimate afterlife) · 48 plots, three rooms of 16 stacked

The game already calls this THE DIVINE STAIR. Three levels, one above the other, joined by the stair and the pit, never drawn together.

| District | Built from | Status |
|---|---|---|
| Hell (16) | THE PIT and THE WALKWAYS | KEPT |
| The Vatican (16) | THE CORTILE on plots; THE BASILICA, THE ARCHIVE, THE CATACOMBS and THE OBSERVATORY as insides | KEPT |
| Heaven (16) | THE STAIRWAY, THE CLOUD FIELDS, and MOUNT OLYMPUS · THE SUMMIT at the top of the Grand Stair | Olympus: see section 4b |

### 12. Outer Space (the ultimate space) · 36 plots, four rooms of 9 (3 x 3, 126 m)

Each world is its own small room, because nothing in space is next door. The rooms are already close to 9 plots each, so this is nearly a straight port.

| District | Built from | Status |
|---|---|---|
| The Moon (9) | THE MARE | KEPT |
| Mars (9) | CYDONIA | KEPT |
| Saturn (9) | THE HEXAGON | KEPT |
| The Singularity (9) | THE HORIZON | KEPT |
| The Spaceship | the Airlock, the Deck, the Cargo Hold, the Bridge, as they are. The ship is how you get between the four. | KEPT, HANDMADE |

### 13. The Poles (working label) · 24 plots, two rooms of 12 (4 x 3, 168 x 126 m)

| District | Built from | Status |
|---|---|---|
| North Pole Village (12) | NORTH POLE · THE VILLAGE: workshop, frozen lake, the drift, the pole | exists; NEW as a zone |
| Antarctica Station (12) | ANTARCTICA · THE STATION: huts, crevasse, ice wall | exists; NEW as a zone |

ZONES_PLAN.md keeps Antarctica as the place the foyer's front door opens onto late in the story. If that is still your plan, Antarctica stays locked until then and only the North Pole is open, by its existing hidden way from Camelot.

### 14. The Astral Realm (the ultimate dream) · 36 plots (6 x 6, 252 m)

Plot-built, by your call on 11-15. Reached through the mirror in the Looking-Glass Garden, as the zone plan says.

| District | Built from | Status |
|---|---|---|
| The Sea of Possibility (12) | THE SEA OF POSSIBILITY: the home of thought-forms | KEPT, ported |
| The Nightmare (12) | THE NIGHTMARE: the bad nights, the maw, the bed, the thing under it | KEPT, ported |
| The Library of Unthought Things (12) | THE LIBRARY: the stacks, the reading room, the card catalogue | KEPT, ported |
| The Waiting Room | THE WAITING ROOM (take a number) stays as the small inside you arrive in, with a door to each district | KEPT as an inside |

One idea to make the grid itself feel like a dream, only if you like it: the plot dungeons already move, turn and swap whole plots. Here the plots could hang apart in the Sea with gaps between them, so the same grid reads as islands of thought instead of city blocks. No new rules; it is the same plot machinery.

## 4b. Mount Olympus and the mountains

**What is there today.** MOUNT OLYMPUS · THE SUMMIT is one room of about seven plots: the court, the throne, the forge, the spire. Four units have it as their point of entry: Orb of Light, Cyclops, Minotaur, Chosen One. It already has a way to and from Heaven.

**My recommendation: Olympus is the top of Heaven, and the mountains are not a zone.**

- Olympus is the mountain where gods live. In a world where each area is an idea in its ultimate form, that idea is already an area: Heaven + Hell + Vatican. The game calls that area THE DIVINE STAIR, and a stair needs a top. You climb the Stairway, cross the Cloud Fields, and the Grand Stair ends at the summit: court, throne, forge. About four of Heaven's sixteen plots.
- The mountains over Disaster City's north edge stay scenery. A mountain zone would need its own idea, its own people and its own buildings, and the units do not ask for one: the mountain units already have homes (Bigfoot, Shaman, Ki Fighter and Krampus on Mount Shasta in the Woods; Yeti at the Poles; the Olympus four in Heaven). It would be a fifteenth area with nobody to live in it.

**How a mountain works on plots, wherever one is wanted.** The plot system already answers this; Disaster City climbs fifteen levels from Bayside to the Church.

- Each plot has one height. A mountain is a run of plots that step up, each a shelf of 42 m, joined by a ramp, a stair or a switchback path, with cliffs as the plot edges.
- You walk up the path from shelf to shelf. A fight happens on the shelf you are standing on, which is one flat 12 x 12 board with a cliff on one side and a drop on the other. The height, climb, jump and fall rules the game already has do the rest. No new rules.
- So Mount Shasta in the Woods is three or four shelves from the meadow up to the snowline, and Olympus is the last few shelves above the clouds.

**If you would rather not have Olympus in Heaven,** the other honest fit is Leylines, as an ancient Greek site beside Stonehenge and Babel (the Cyclops and Minotaur are Greek monsters). It would be a sixth district there, nine plots. I think Heaven is better because Olympus is a living home of gods, not a ruin.

## 5. What happens to each of your sixteen zones

| Your zone | Verdict | Why |
|---|---|---|
| DOOR HQ | KEPT as it is | the hub, the subconscious |
| The Woods | KEPT, gains Mount Shasta and Bohemian Grove | both are forest sites with no zone today |
| Fairy Forest | MERGED into Camelot Kingdom as a district | it has one room, and that room is a battle board nobody can walk to. Fairy tale forest and fairy tale castle are one idea. |
| Camelot Kingdom | KEPT, grows | gains the Fairy Forest, the Looking-Glass Garden and a new Town |
| Disaster City | KEPT | gains the Sewers as its lower level; the Strip, the Stadium and the Lodge go inside districts it already has; Cyberpunk City is the whole city in the future, later |
| The Beach | KEPT, gets its first room | plus the Harbour, the Flying Dutchman and the Bermuda Triangle, which are all above the water |
| The Desert | KEPT, gets its first open room | Area 51 plus Giza, Western Town and the Road |
| The Sewers | MERGED into Disaster City as its lower level | every room in it is already named DISASTER CITY · ... in the game |
| The Estate | KEPT | Corn Fields and Haunted House plus the Ranch and the Lake from your list |
| The D.U.M.B. | KEPT | gains CERN and the White Rooms |
| Atlantis | MERGED into The Deep as a district | two rooms; a drowned city is part of the ocean |
| The Deep | KEPT, now only what is under the water | the surface rooms go to the Beach |
| Outer Space | KEPT | four small worlds and the ship |
| Heaven + Hell + Vatican | KEPT | Mount Olympus as the top of Heaven if you agree (section 4b) |
| The Cavern | KEPT | unchanged |
| Leylines | KEPT | loses Giza to the Desert, gains the Bug Colony |

Sites that were on no zone and now have a home: Mount Shasta (Woods), Bohemian Grove (Woods), the Lodge (Disaster City, Financial), Mount Olympus (Heaven, if you agree), Technoticlan and Babel (Leylines, already grouped there), Agartha (Cavern, already there), the North Pole and Antarctica (The Poles), the Looking-Glass Garden (Camelot Kingdom), the Strip (Disaster City).

**Cut: nothing.** These stop being walked but stay in the game as PvP boards, exactly as the old Disaster City did: the old Strip boulevard, the old Downtown, each big outdoor room once its district is ported. Two leftovers you may want cleared, only if you say so: the unused old Training pit, and the zone row "THE CAVE" that points at a room that does not exist.

## 6. Every unit and where it lives

All 134 playable units. "Home" is the district where it is most common; "second place" is where it also turns up. The last column is the point of entry printed on the unit's dossier in the game today, which is what the homes are based on. Where a home differs from that column, it is because the site was folded into a district (the Lodge into Financial, Olympus into Heaven, Skinwalker Ranch into the Estate, and so on) or because the unit already lives somewhere as a Disaster City resident.

Today 34 units are on none of your hand-made AREA UNITS tables (they only show up through the game's default lists). Here every unit has a named place.

| Unit | Home (proposed) | Second place | Point of entry on its file today |
|---|---|---|---|
| AI | Disaster City: the future city (Cyberpunk) | The D.U.M.B.: Command | Cyberpunk City |
| Android | Disaster City: the future city (Cyberpunk) |  | Cyberpunk City |
| Angel | Heaven + Hell + Vatican: Heaven |  | Heaven |
| Annunaki | The Desert: Giza |  | Pyramids of Giza |
| Antihero | Disaster City: Hero Plaza |  | Downtown |
| Antperson | The Cavern: Hollow Earth | Leylines: Bug Colony | Hollow Earth |
| Anubis | The Desert: Giza |  | Pyramids of Giza |
| Astronaut | Outer Space: the Spaceship | Disaster City: Industrial (Aerospace lab) | Spaceship |
| Atlantean | The Deep: Atlantis |  | Atlantis |
| Barbarella | Outer Space: the Moon |  | Moon |
| Bee Queen | Leylines: Bug Colony | Leylines: Göbekli Tepe | Göbekli Tepe |
| Bigfoot | The Woods: The Redwood Trail (Mount Shasta) |  | Mount Shasta |
| Black Goo | Outer Space: Saturn | The D.U.M.B.: Sub-Level 7 | Saturn |
| Bligblog | The Desert: Area 51 | Outer Space: Saturn | Area 51 |
| Bunny Girl | Disaster City: Entertainment (the Casino, from the Strip) |  | The Strip |
| Catgirl | Disaster City: the future city (Cyberpunk) |  | Cyberpunk City |
| Chef | Disaster City: Bayside (Food hall) | Disaster City: Entertainment (Restaurant court) | The Strip |
| Chess Piece | Camelot Kingdom: The Looking-Glass Garden (the chessboard) |  | The Looking-Glass |
| Chosen One | Heaven + Hell + Vatican: Heaven (Mount Olympus) |  | Mount Olympus |
| Clown | DOOR HQ: The Carnival (Room 1893) | Disaster City: Entertainment | The Carnival |
| Conspiracy Theorist | Disaster City: Southside | The Desert: Area 51 (outside the gate) | The Strip |
| Cosmic Wraith | Outer Space: the Singularity |  | The Singularity |
| Cowboy | The Desert: Western Town | The Estate: The Ranch | Area 51 |
| Crystal Guardian | The Cavern: Agartha |  | Agartha |
| Cult Leader | The Woods: The Ritual Ground (Bohemian Grove) | Disaster City: Southside | Bohemian Grove |
| Cyborg | Leylines: Technoticlan | Disaster City: the future city (Cyberpunk) | Technoticlan |
| Cyclops | Heaven + Hell + Vatican: Heaven (Mount Olympus) |  | Mount Olympus |
| Deep Sea Fish | The Deep: The Trench | The Beach: The Island (the Bermuda Triangle) | The Bermuda Triangle |
| Demon | Heaven + Hell + Vatican: Hell |  | Hell |
| Demon Prince | Heaven + Hell + Vatican: Hell |  | Hell |
| Demon Princess | Heaven + Hell + Vatican: Hell |  | Hell |
| Dinosaur | The Cavern: Hollow Earth |  | Hollow Earth |
| Djinn | The Desert: Giza |  | Pyramids of Giza |
| DOOR Agent | DOOR HQ | The D.U.M.B.: Level P3 | D.U.M.B. |
| Dragon | Camelot Kingdom: The Castle (the Castle in the Sky) |  | Camelot |
| Dreameater | Camelot Kingdom: The Looking-Glass Garden | The Astral Realm: The Nightmare | The Looking-Glass |
| Droid | Outer Space: Mars | Disaster City: the future city (Cyberpunk) | Mars |
| Eagleman | The Estate: The Haunted House | Disaster City: Hero Plaza (Superhero Tower) | The Haunted House |
| Fairy | Camelot Kingdom: The Fairy Forest |  | Fairy Forest |
| Fallen Angel | Heaven + Hell + Vatican: Hell | Leylines: Babel | Hell |
| Firefighter | Disaster City: Civic Center (Fire Station) |  | Downtown |
| Flesheater | The D.U.M.B.: Sub-Level 7 | Disaster City: The Sewers | D.U.M.B. |
| Fortune Teller | The Woods: The Ritual Ground (Bohemian Grove) | Disaster City: Entertainment (Night market) | Bohemian Grove |
| Gangster | Disaster City: Southside | Disaster City: the future city (Cyberpunk) | Cyberpunk City |
| Gargoyle | Heaven + Hell + Vatican: The Vatican | Camelot Kingdom: The Castle | Vatican City |
| General | Disaster City: Financial (the Lodge as the Members club) | The D.U.M.B.: Command (the War Room) | The Lodge |
| Ghost | The Estate: The Haunted House | Disaster City: Bayside (Waterfront hotel) | The Haunted House |
| Ghoul | The Estate: The Graveyard | Heaven + Hell + Vatican: Hell | The Haunted House |
| Giant | Leylines: Göbekli Tepe | Camelot Kingdom: The Castle | Göbekli Tepe |
| Glitch | The D.U.M.B.: CERN | The Astral Realm: The Sea of Possibility | CERN |
| Gnome | Camelot Kingdom: The Fairy Forest | The Cavern: The Cavern | Fairy Forest |
| Goatman | The Estate: The Ranch | The Woods: The Ritual Ground | Skinwalker Ranch |
| Goblin | The Cavern: Hollow Earth | Disaster City: Financial (Goblin Bank) | Hollow Earth |
| Golem | Leylines: Babel |  | Tower of Babel |
| Grey | Outer Space: Saturn | The Desert: Area 51 | Saturn |
| Halfdemon | Heaven + Hell + Vatican: Hell | Disaster City: Financial | Hell |
| Hippie | Leylines: Stonehenge | The Woods: The Clearing | Stonehenge |
| Ice Queen | The Poles: North Pole Village |  | North Pole |
| Jack-o'-Lantern | The Estate: The Graveyard | The Estate: The Corn Fields | The Haunted House |
| Jellyfish | The Beach: The Island (the Bermuda Triangle) | The Deep: Atlantis | The Bermuda Triangle |
| Juggernaut | The D.U.M.B.: Sub-Level 7 | Disaster City: Sports + Culture | D.U.M.B. |
| Kaiju | The Poles: Antarctica Station | The Deep: The Trench | Antarctica |
| Ki Fighter | The Woods: The Redwood Trail (Mount Shasta) | Disaster City: Southside (the Dojo) | Mount Shasta |
| King Arthur | Camelot Kingdom: The Castle |  | Camelot |
| King Kong | Disaster City: Sports + Culture (the stadium field) |  | Downtown |
| Knight | Camelot Kingdom: The Castle |  | Camelot |
| Kraken | The Deep: The Trench | The Deep: Atlantis | Atlantis |
| Krampus | The Woods: The Redwood Trail (the snowline) | The Poles: North Pole Village | Fairy Forest |
| Loch Ness Monster | The Cavern: Agartha (the lake) | The Estate: The Lake | Agartha |
| Luchador | Disaster City: Sports + Culture (Wrestling hall) |  | The Strip |
| Machine Elves | The D.U.M.B.: CERN | The Astral Realm: The Sea of Possibility | CERN |
| Mad Scientist | The D.U.M.B.: Research | Disaster City: University | D.U.M.B. |
| Mantid | Outer Space: the Moon | Leylines: Bug Colony | Moon |
| Marksman | Disaster City: Financial (the Lodge as the Members club) | Disaster City: Industrial | The Lodge |
| Martian | Outer Space: Mars |  | Mars |
| Mech | Leylines: Technoticlan | Disaster City: the future city (Cyberpunk) | Technoticlan |
| Men in Black | The Desert: Area 51 | Disaster City: Financial | Area 51 |
| Mermaid | The Deep: Atlantis | The Beach: The Shore | Atlantis |
| Mime | Disaster City: Entertainment |  | Downtown |
| Minotaur | Heaven + Hell + Vatican: Heaven (Mount Olympus) | Leylines: Babel | Mount Olympus |
| Mothman | The Estate: The Corn Fields | The Woods: Dead Man's Cave | Skinwalker Ranch |
| Mummy | The Desert: Giza |  | Pyramids of Giza |
| Mushroom Girl | Camelot Kingdom: The Fairy Forest |  | Fairy Forest |
| Necromancer | Leylines: Stonehenge | The Estate: The Graveyard | Stonehenge |
| Nephilim | Leylines: Göbekli Tepe | Disaster City: Hero Plaza | Göbekli Tepe |
| Nordic | The Poles: Antarctica Station | Outer Space: the Spaceship | Antarctica |
| Occulus | Camelot Kingdom: The Looking-Glass Garden | The Astral Realm: The Sea of Possibility | The Looking-Glass |
| Orb of Light | Heaven + Hell + Vatican: Heaven (Mount Olympus) | The Astral Realm: The Sea of Possibility | Mount Olympus |
| Overlord | Leylines: Babel | Heaven + Hell + Vatican: Hell | Tower of Babel |
| Pirate | The Beach: The Harbour (the Flying Dutchman) | The Beach: The Island (the Bermuda Triangle) | The Flying Dutchman |
| Police Officer | Disaster City: Civic Center (Police desk) | Disaster City: Bayside (Police staging) | Downtown |
| Politician | Disaster City: Financial (the Lodge as the Members club) | Disaster City: Civic Center | The Lodge |
| Popstar | Disaster City: Entertainment (Concert hall) | Disaster City: Sports + Culture (the Stadium) | Football Stadium |
| Priest | Heaven + Hell + Vatican: The Vatican | Disaster City: Southside (the Church) | Vatican City |
| Professor | The D.U.M.B.: Research | Disaster City: University | D.U.M.B. |
| Quarterback | Disaster City: Sports + Culture (the Stadium) |  | Football Stadium |
| Rabbit | Camelot Kingdom: The Looking-Glass Garden |  | The Looking-Glass |
| Reptilian | The Cavern: Hollow Earth | The D.U.M.B.: Sub-Level 7 | Hollow Earth |
| Ringmaster | DOOR HQ: The Carnival (Room 1893) | Disaster City: Entertainment | The Carnival |
| Robin Hood | Camelot Kingdom: The Fairy Forest | Camelot Kingdom: The Town | Camelot |
| Robot | Leylines: Technoticlan | Disaster City: the future city (Cyberpunk) | Technoticlan |
| Santa Clause | The Poles: North Pole Village |  | North Pole |
| Scarecrow | The Estate: The Corn Fields |  | Skinwalker Ranch |
| Sedan | Disaster City: the roads (Financial, Taxi court) | The Desert: The Road | The Strip |
| Seraphim | Heaven + Hell + Vatican: Heaven |  | Heaven |
| Shadow Entity | DOOR HQ: H-Wing | The Astral Realm: The Nightmare | H-Wing |
| Shaman | The Woods: The Redwood Trail (Mount Shasta) | Leylines: Göbekli Tepe | Mount Shasta |
| Sharkman | The Beach: The Island (the Bermuda Triangle) | The Deep: Atlantis | The Bermuda Triangle |
| Sheriff | The Desert: Western Town |  | Area 51 |
| Sidekick | Disaster City: Hero Plaza |  | Downtown |
| Siren | The Deep: Atlantis | The Beach: The Shore | Atlantis |
| Skeleton | Heaven + Hell + Vatican: Hell | Camelot Kingdom: The Castle (the Undercroft) | Hell |
| Skinwalker | The Estate: The Corn Fields | The Estate: The Ranch | Skinwalker Ranch |
| Spy | The Desert: Area 51 | Disaster City: Financial (Intelligence office) | Area 51 |
| Starfish | The Deep: Atlantis | The Beach: The Shore | Atlantis |
| Succubus | Heaven + Hell + Vatican: Hell |  | Hell |
| Super Sentai | Leylines: Technoticlan | Disaster City: Hero Plaza | Technoticlan |
| Superhero | Disaster City: Hero Plaza |  | Downtown |
| Swamp Monster | The Woods: Dead Man's Cave | Disaster City: The Sewers | Fairy Forest |
| Swordfighter | Camelot Kingdom: The Castle | Disaster City: Southside (the Dojo) | Camelot |
| Symbiote | Outer Space: the Spaceship | The D.U.M.B.: Sub-Level 7 | Spaceship |
| Telepath | The D.U.M.B.: Research (Dream Research) | Disaster City: University | D.U.M.B. |
| The Watcher | Outer Space: the Singularity | Heaven + Hell + Vatican: Heaven | The Singularity |
| Time Cop | Disaster City: Civic Center (Time Bureau) | Disaster City: Financial | none on file |
| Tree Person | The Woods: The Clearing (the Old Tree) | Camelot Kingdom: The Fairy Forest | Fairy Forest |
| Undead | The Estate: The Graveyard | Heaven + Hell + Vatican: Hell | The Haunted House |
| Unicorn | Camelot Kingdom: The Fairy Forest |  | Fairy Forest |
| Valkraye | Heaven + Hell + Vatican: Heaven |  | Heaven |
| Vampire | The Estate: The Haunted House | Heaven + Hell + Vatican: The Vatican (the Catacombs) | The Haunted House |
| Voidweaver | Outer Space: the Moon | The Astral Realm: The Sea of Possibility | Moon |
| Werewolf | The Estate: The Haunted House | The Woods: The Clearing | The Haunted House |
| Wizard | Leylines: Stonehenge | Camelot Kingdom: The Castle (Merlin's Undercroft) | Stonehenge |
| Yeti | The Poles: Antarctica Station | The Woods: The Redwood Trail (the snowline) | Antarctica |
| Zombie | Disaster City: University | The Estate: The Graveyard | Downtown |

How many units call each area home: Disaster City 23 (three of them, the AI, the Android and the Catgirl, belong to the future city and stand in today's Cyberpunk room until it exists), Heaven + Hell + Vatican 16, Camelot Kingdom 13, Leylines 12, The Estate 11, Outer Space 11, The Desert 9, The Woods 8, The D.U.M.B. 7, The Cavern 6, The Deep 6, The Poles 5, DOOR HQ 4, The Beach 3. The Beach is thin on its own people; it fills out with second-place visitors from The Deep (Siren, Mermaid, Starfish).

Units not on the playable list: the Nun is the female Priest, so she lives where the Priest does. The Homosapien stays a Disaster City resident as now.

## 7. Story characters and animals

**Your cast (DOOR_STORY.md).** I have moved nobody. Locke, Belle, Glass, Knox, Ringer, Rhonda, Kit, Elle Vator, Otto Matic, Forrest and the Janitor stand in DOOR HQ as today. Sedaniel is parked in Bay 1 and appears on the Road, which becomes a Desert district. The five cult members of the Family stand in Bohemian Grove, which becomes part of The Woods' Ritual Ground. Dorian Gates, the Doorman and your parents are hidden and stay hidden; where Dorian turns up in the world is a story decision and yours.

**Animals (models already in the game, not units).** They dress an area; none of them fight.

| Animal | Where it fits |
|---|---|
| Cow, chicken, horse (three coats) | The Estate: The Ranch. Horses also at Western Town and Camelot's Town. |
| Wolf, crow, rabbit, eagle | The Woods; crows also over the Estate's Graveyard and Corn Fields |
| Dog, cat | Disaster City; the Estate's Ranch |
| Lion, giraffe, elephant | no natural home in these areas. Suggest a zoo plot in Disaster City's Sports + Culture, or leave them unused. Your call. |
| Butterflies, moths, ladybug, grasshoppers, caterpillar | Camelot Kingdom's Fairy Forest and Looking-Glass Garden; the Estate |
| Ants, anthill, bees | Leylines: Bug Colony |
| Sharks, dolphins, mantas, fish schools, jellies (the ocean pack) | The Deep; the Beach's Island |

## 8. How the handmade rooms become plots

Three ways, the same three the city used.

**A. Keep it as an inside.** A handmade interior stays exactly as it is and becomes the room behind a door on a plot, the way the Mall, the Tower Lobby and the Sewers hang off Disaster City. No rebuild. This covers every room that is the inside of something: the Haunted House's five floors, the Flying Dutchman's four decks, the Spaceship, Camelot's Hall, Keep, Undercroft and Sky Castle, the Vatican's Basilica, Archive, Catacombs and Observatory, the Casino floor, the Chapel, the Noodle Bar, the Lodge's halls, the Temple of the Deep, the War Room, the Bunker. About 35 rooms.

**B. Port the look onto plots.** For outdoor rooms. The room's landmarks, props, ground and light are carried over as a district file, and the plot tool lays them on the grid, the way the old Downtown's canal, parking deck and Collapse were ported into the 144 plots today (PR #1402). Most handmade outdoor rooms are much bigger than what stands in them: Giza is 41 plots of floor for three pyramids and a sphinx, Stonehenge is 27 plots for one circle. Porting tightens them so there is something on every plot. This covers the Woods rooms, Shasta, the Grove, the Camelot ward, the Looking-Glass Garden, the Corn Fields, the Haunted grounds, the Harbour, Bermuda, Area 51's gate and flight line, Giza, the Abyss, the Cavern rooms, Hollow Earth, Agartha, the four Leyline sites, Hell, the Cortile, Heaven, Olympus, the four space worlds, the two poles, the three Astral Realm rooms and the four Sewer rooms. About 45 rooms.

**C. Build new.** Districts with nothing behind them: Western Town, the Road's open desert, the Shore, the Ranch, the Lake, the Town, the Bug Colony, the Trench. Eight districts, about 90 plots. These need the full Disaster City treatment and are where missing models will show up. From a first look at MODEL_LIST.md: palms, cactus, pyramids, a sphinx, castle and medieval pieces, a barn door, a saloon door, a windmill, igloos and a lighthouse exist; a whole western street, farm buildings and beach huts do not. Those would come from the packs first, then Meshy with your OK, as usual.

**The files.** Today the tool and its files are named for the city. The proposal is one folder per area holding the same five things, and one tool that takes the area's name:

| Disaster City today | Per area (proposal) |
|---|---|
| docs/disaster-city/city-layout.json (the 144 plots, what each is) | docs/areas/<area>/layout.json |
| docs/disaster-city/levels.js (a height per plot) | docs/areas/<area>/levels.js |
| docs/disaster-city/districts/R.js, C.js ... (one per district) | docs/areas/<area>/districts/<district>.js |
| docs/disaster-city/pack-claims.md (which district uses which pack building) | one claims file for the whole world, so two areas never use the same unique building |
| node bake-disaster-city.js | the same tool taking an area name; the city keeps working as it does |

Everything the city threads built carries over without new work: the swinging doors, the big windows, the levels and slopes, the natural edges, the residents and their beds, the plot chunks for performance, the district looks.

## 9. Size and performance

**What Disaster City costs.** 144 plots, 504 m across, 5,223 props, 2,981 ground and building rows, 79 walk-in buildings. On your Mac it went from 6.8 FPS to about 20 after ten performance PRs, and the 60 FPS rebuild is still under way. So the city is the ceiling, not the model, for size.

**The budget I used.**

- No room over 64 plots. Most are 36 (252 m across, a quarter of the city).
- City-weight plots (buildings, insides, street furniture) cost many times what a land plot (trees, sand, rock, water) costs. My rough guess is ten times; it is not measured. Only Disaster City, Western Town, Camelot's Town and Castle, the Vatican and the D.U.M.B. are city-weight. That is about 90 city-weight plots in all the new work together, under two thirds of Disaster City, spread over five rooms.
- Per room, as a starting cap until the city's rebuild shows what 60 FPS allows: 1,500 props, 25 walk-in buildings, 12 residents drawn at once.
- Areas whose parts are not really next to each other are split into rooms (the three levels of the Divine Stair, the four space worlds, the two poles, the Sewers). You never pay for more than one at a time, and the fade between them is one you already have.

**The totals.**

| | Plots | Rooms |
|---|---|---|
| Disaster City as built | 144 | 1 |
| Disaster City addition (the Sewers) | 16 | 1 |
| The Woods | 36 | 1 |
| Camelot Kingdom | 48 | 1 |
| The Estate | 36 | 1 |
| The Beach | 24 | 1 |
| The Desert | 64 | 1 |
| The Deep | 27 | 1 |
| The D.U.M.B. | 36 | 1 |
| The Cavern | 36 | 1 |
| Leylines | 45 | 1 |
| Heaven + Hell + Vatican | 48 | 3 |
| Outer Space | 36 | 4 |
| The Poles | 24 | 2 |
| The Astral Realm | 36 | 1 |
| **New work** | **512** | **20** |

**What it costs to make.** Honest guess from how the city went: the city took nine district threads, each doing exteriors, two inside passes, a polish pass and bedrooms, plus shared threads for doors, levels, edges, traffic, residents and performance. A 36-plot land area is far lighter: closer to one thread per district and one shared thread. The eight brand-new districts are the heavy part.

**Suggested order.** One pilot first, to prove the tool works off the city: **The Woods**. It is the first place the HQ stair leads, it is all land plots, four rooms already exist to port, and on 11-13 you mentioned the Woods as a zone that would use the plot system later. Then **The Desert**, because it is your example and tests a new town. After those two, the rest can run several at a time the way the nine districts did.

## 10. Where the decisions stand

Answered 11-15 12:06: the list is good; Cyberpunk City is the future reskin of the whole city; DOOR HQ handmade; the Astral Realm on plots. Still open: Mount Olympus (section 4b), the polar area's name, the Strip (items 3 and 4 below), Antarctica (6) and the pilot (7). The original list:

1. **The list in section 3:** OK as it stands, or which areas to change.
2. **The three merges:** Fairy Forest into Camelot Kingdom, Atlantis into The Deep, the Sewers into Disaster City. Yes or no to each.
3. **The polar area:** yes or no, and its name.
4. **The Strip:** inside Disaster City's Entertainment district (my pick, the Casino and Chapel plots are already there) or a district of the Desert (your first zone list).
5. **New districts that were not on your lists:** The Town (Camelot), The Shore, The Trench. You said "everything else seems good", so I am reading these as yes unless you say otherwise.
6. **Antarctica:** still the late reveal behind the foyer door, or open from the start?
7. **Which area to pilot first.** I suggest The Woods.
