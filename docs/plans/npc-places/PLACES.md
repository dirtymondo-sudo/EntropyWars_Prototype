# WHERE EVERY UNIT STANDS AND WALKS (2026-11-20, a PROPOSAL for mondo; nothing is built)

mondo 11-20: "use this as the basis for spawn/encounter locations ... if there is anything I missed to put in specific
buildings or districts or zones, then make a list of ones you are going to put there so I can approve. Also they should
still all have routes they do, even if it's just between 1 or 2 districts."

- **The source:** his Main board, `relationship-web-2026-11-20.json` beside this file (382 nodes, 129 places, 22 factions, 162 ties).
- **Section 1** = how the board is read. **Section 2** = THE APPROVAL LIST (everything that is not on his board). **Section 3** = every
  unit's home and route, zone by zone. **Section 4** = what leaves the game. **Section 5** = open questions. **Section 6** = how it gets built.
- Counts, levels and rarity are NOT decided here: they stay rows of `HQ_SPAWN_RULES` (docs/notes/npc-system.md).

## 1. HOW THE BOARD IS READ

1. A unit in a district = it lives there. A unit in a building (Luxury hotel, Arcade, Wrestling hall) = it lives in that building.
2. Gender is kept exactly: Mad Scientist F is the University's, Mad Scientist M is the D.U.M.B.'s; only Ghost M haunts the hotels.
3. A common unit in several places (Police Officer, Skater, Hippie, Gambler, Cameraman, Chef) = SEVERAL people, one home each.
4. A one-of-a-kind unit in several places (King Arthur, the Pope, Robinhood, the Dragon, the Shogun) = ONE unit whose route joins those places.
5. A unit only at zone level (the Woods' Bigfoot) gets a district from me: list 2A of its zone.
6. A tie can put a unit somewhere (Scarecrow hates Grey = Greys in the corn at night): list 2B of its zone, with the tie named.
7. His custom places: **Katana Bay** = the zone Katana Island (six districts, built 11-20). **Atlantis** = the Deep's Citadel + Rings.
   **Ancient** (inside Leylines) = Leylines' districts. **Future** = no zone in the game: question 5.2.

**The route words**
- STAYS = one building or spot, never leaves (the hotel Ghost).
- DISTRICT = walks its own district.
- A ↔ B = between two or three districts of its zone.
- ZONE = every district of its zone (the Delivery Boy).
- CLOCK = two zones: it is in one for some hours and in the other for the rest (it is not seen walking the road between rooms).

## 2. THE APPROVAL LIST

2A = his unit, my district. 2B = a unit he did not put in that place at all. Numbers are for his answer ("all but 14, 31").

### Disaster City
2A
| # | Unit | Where | Why |
|---|---|---|---|
| 1 | Chef | every restaurant: Food hall, Restaurant court, Kitchen lane, Coffee arcade, Student cafe, Worker cafe, Caterer yard, Community kitchen, Vendor stalls | his rule of 11-16 |
| 2 | Delivery Boy | Delivery yard (Hero Plaza) | his example: every district |
| 3 | Honda Civic | the roads, the Showroom, the Taxi court | a car |
| 4 | King Kong | the park (Sports + Culture) | his field today; climbs the Superhero Tower |
| 5 | Clown M | Comedy theater (Entertainment) | Southside's streets by night |
| 6 | Conspiracy Theorist | Southside homes | protests at City Hall, broadcasts from the Radio Mast (Hills) |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 7 | Politician M/F, Banker, Tech CEO, Halfdemon M/F | Members club (Financial) = the Lodge | his own example; all six are Financial's already |
| 8 | General, Professor M, Reptilian, Mad Scientist M | Members club, as members who come in | Illuminati + Military Industrial Complex |
| 9 | Marksman M/F | the Members club's door | they serve the General |
| 10 | Goblin | Goblin Bank (Financial) | the building is named for them |
| 11 | Spy | Intelligence office (Financial) | Tech CEO loves Spy; she serves the Shogun |
| 12 | Men in Black | Intelligence office (Financial) | Reality Containment |
| 13 | General | Military offices (Civic Center) | the building |
| 14 | Time Cop | Time Bureau (Civic Center) | the building; Law and Order (see 5.2) |
| 15 | Librarian | Public library (Civic Center) | a second one; the University's stays |
| 16 | Mechanic | Repair shops (Southside), Service garage (Financial) | the buildings |
| 17 | Janitor | City Hall, Locker rooms (Sports), the Supply Closet | he sees everything |
| 18 | Firefighter | the Fire Road + the Burn (Hills) | a second crew |
| 19 | Cursed TV | Pawnshop court (Southside) | stands there today |
| 20 | Ki Fighter F, Swordfighter M | the Dojo (Southside) | stand there today; Anime Friends away from Katana |
| 21 | Astronaut | Film studio (Entertainment), with a Cameraman | his tie Cameraman · Astronaut |
| 22 | Popstar | home = the Stilt House (Hills) | his: Entertainment + the Hills |
| 23 | Streamer M | the Arcade, with Streamer F | pair |

### The Woods
2A
| # | Unit | Where | Why |
|---|---|---|---|
| 24 | Bigfoot | The Redwood Trail | territorial; fears the Cameraman |
| 25 | Cameraman | a camp on the Redwood Trail | after Bigfoot |
| 26 | Mothman | The Clearing, by night | |
| 27 | Werewolf | The Clearing, by night | |
| 28 | Wendigo | Dead Man's Cave | comes out on the Trail by night |
| 29 | Goatman | The Ritual Ground | The Legion |
| 30 | Shadow Entity | The Ritual Ground + the Cave, by night | feeds off fear |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 31 | Cult Leader | The Ritual Ground | his five cultists stand there and worship him |
| 32 | Politician M, Banker, Tech CEO | The Ritual Ground, by night | the Members' tunnel from the club opens here |

### Came A Lot
2A
| # | Unit | Where | Why |
|---|---|---|---|
| 33 | Wizard M/F | the Castle (a tower) | court wizards |
| 34 | Dragon | a lair at the far end of The Forest | hunts the Knights |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 35 | Knight M/F | The Village gate | a patrol from the Castle |
| 36 | Farmer | The Village | the village has only Gnomes |
| 37 | Priest M | The Village (chapel) | King Arthur serves the Pope |
| 38 | Chef | The Village (tavern) | |
| 39 | Krampus | The Snowy Pines | Ice Age, with the Yeti |
| 40 | Werewolf | The Forest, by night | hunts the Rabbit |
| 41 | Wizard M/F, Hippie M/F | Stonehenge | empty on the board |

### Outer Space
2A
| # | Unit | Where | Why |
|---|---|---|---|
| 42 | Astronaut | The Mare (Moon), The Rover Bay (Mars), the Spaceship | |
| 43 | Grey, Bligblog | The Far Side (Moon) | the base |
| 44 | Martian | Cydonia + The Canyon (Mars) | home |
| 45 | Grey, Black Goo | The Hexagon (Saturn) | home of both |
| 46 | Nordic M/F, Barbarella | The Ring Shard (Saturn) | Galactic Federation post |
| 47 | Cosmic Wraith | The Drop + The Accretion Rim | home |
| 48 | Reptilian | The Far Side (Moon) | Invasion Day |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 49 | Mantid | The Crater (Moon) | Invasion Day, with Martian and Reptilian |
| 50 | Boltzmann Brain, Watcher | The Accretion Rim | the game's home for both |

### The D.U.M.B.
2A
| # | Unit | Where | Why |
|---|---|---|---|
| 51 | Mad Scientist M, Grey, Symbiote | Research | he made the Symbiote; Greys are allied |
| 52 | Telepath M/F, Juggernaut, Shadow Entity | Sub-Level 7 | the test subjects' cells |
| 53 | Mechanic, Men in Black | Level P3 | the motor pool and the gate |
| 54 | Hacker | CERN, The Ring | breaking in |
| 55 | Janitor | Command | cleans every level |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 56 | Politician M, Marksman M/F | Command | the General serves the Politician; the Marksmen serve the General |
| 57 | Machine Elves, Glitch | CERN, The Ring | the game's home for both |

### Bug Colony (2A)
| # | Unit | Where |
|---|---|---|
| 58 | Bee Queen | The Hive (STAYS) |
| 59 | Antperson | The Ant Nest |
| 60 | Cicada Brood, Mantid, Voidweaver | the Giant Tree and the ground between |

### The Sewers
2A
| # | Unit | Where | Why |
|---|---|---|---|
| 61 | Sewer Gator | The Sewers + The Radioactive Drain | the waste that makes the Kaiju |
| 62 | Karate Frog | The Sewers | |
| 63 | Samurai Slug | The Old Workings | rivals: they meet in The Running Tunnels |
| 64 | Swamp Monster | The Old Workings + The Radioactive Drain | |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 65 | Men in Black | The Holding Cells | Reality Containment's cells |
| 66 | Mole Man | The Old Workings | the way down to the Cavern |

### The Internet
2A
| # | Unit | Where |
|---|---|---|
| 67 | Streamer M/F, VTuber | Live |
| 68 | Influencer | The Feed |
| 69 | Conspiracy Theorist, Hacker | The Forums |
| 70 | Virus, Glitch | The Pop-ups |
| 71 | AI | The Motherboard (STAYS) |
| 72 | Ghost M | The Server Farm |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 73 | Demon M | The Dark Web | his tie: demons use the internet as a conduit |
| 74 | Florida Man | The Forums | his tie: he listens to the podcast |
| 75 | Hacker | The Dark Web | a second one |

### The Astral Realm (2A)
| # | Unit | Where |
|---|---|---|
| 76 | Telepath M/F | The Sea of Possibility |
| 77 | Shadow Entity | The Nightmare |
| 78 | Ghost M | The Waiting Room |

### The Beach
2A
| # | Unit | Where |
|---|---|---|
| 79 | Lifeguard M/F, Florida Man, Starfish | The Shore |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 80 | Pirate M/F, Deep Sea Diver | The Harbour | empty on the board |
| 81 | Pirate M/F, Skeleton | Pirates' Cove | the crew |
| 82 | Monk, Ninja M | The Volcano Island | "part of the empire" |
| 83 | Jellyfish UFO | The Ocean + The Bermuda Triangle | on the board in no place |

### The Mountains
2A
| # | Unit | Where |
|---|---|---|
| 84 | Dragon | Mount Shasta, the peak |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 85 | Chef, Skater M/F, Influencer | The Ski Lodge + slopes | a lodge needs guests; the Skaters ride boards |
| 86 | Politician M, Banker, Tech CEO | The Ski Lodge, on holiday | only if the Ski Lodge is the lodge he meant (5.5) |
| 87 | Hippie M/F, Shaman M/F, Bigfoot | Mount Shasta | empty on the board; the game's home for the Shaman and Bigfoot |
| 88 | Men in Black | North Pole | his tie: the MIC uses Santa's surveillance network |

### The Estate
2A: the Haunted House's rooms: Ghost M the Hall, Ghost F Upstairs, Haunted Doll the Nursery, Cursed TV the Hall, Vampire M/F the Cellar, Zombie M/F + Skeleton the Graveyard (#89).

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 90 | Grey | The Corn Fields, by night | his tie: the Greys keep messing up the Scarecrow's crops |
| 91 | Cameraman | The Lake + the Haunted House's yard | his ties: Nessie and the Ghost fear him |
| 92 | Priest M | The Graveyard | his tie: he hunts Vampire M |
| 93 | Undead, Ghoul | The Graveyard | on the board only in Hell |

### The Desert (2B)
| # | Unit | Where | Why |
|---|---|---|---|
| 94 | Conspiracy Theorist, Florida Man | Area 51's gate | |
| 95 | Bligblog | Hangar 18 (held) | the game's home for it |
| 96 | Mad Scientist M | Area 51 | he works for the General |
| 97 | Sheriff, Mechanic | The Highway | the patrol car and the gas station |

### Leylines
2A
| # | Unit | Where | Why |
|---|---|---|---|
| 98 | Giant, Watcher | Göbekli Tepe | "Ancient"; the game's home for the Giant |
| 99 | Golem, Fallen Angel M | Babel | "Ancient"; with Fallen Angel F and the Nephilim |
| 100 | Cult Leader | The Ley Line, passing through | he travels by it |
| 101 | Cyclops, Minotaur | NOT in Leylines | Olympus and the Colosseum are theirs |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 102 | Hippie M/F | The Ley Line | pilgrims |

### Antarctica
2A
| # | Unit | Where |
|---|---|---|
| 103 | Nordic M/F | The Hull in the Ice + The Polar Openings |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 104 | Reptilian | The Polar Openings | his tie: at war with the Nordics; the way to Hollow Earth |
| 105 | Yeti | The Crevasse + The Shelf Ice | stands in Antarctica today |
| 106 | Professor F, Mechanic | The Station | |
| 107 | Conspiracy Theorist | the foot of The Ice Wall | the Men in Black guard it from him |

### Heaven + Hell + Vatican
2A
| # | Unit | Where |
|---|---|---|
| 108 | Priest M/F | The Basilica, The Cloister, The Gardens |
| 109 | Gargoyle M/F | the roofs of The Basilica + The Cloister |
| 110 | Angel M, Valkraye | The Gate + The Stairway |
| 111 | Orb of Light, Angel F | The Cloud Fields |
| 112 | Seraphim M/F | The City |
| 113 | Demon M/F | The Rim |
| 114 | Undead, Ghoul, Flesheater | The Descent |
| 115 | Succubus M/F | The Walkways |
| 116 | Overlord, Demon Prince, Demon Princess | The Bowl |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 117 | Reptilian | The Palace | his tie: it serves the Pope |
| 118 | Knight M/F | The Square | King Arthur serves the Pope: his envoys |
| 119 | Skeleton, Undead, Vampire M | The Catacombs | his tie: the Priest hunts the Vampire |
| 120 | Fallen Angel M/F | The Rim | his tie: cast out of Heaven, they become demons |
| 121 | Halfdemon M/F | The Walkways | the go-betweens to the Members club |
| 122 | Necromancer M/F | The Bowl | his tie: they worship the Demons |

### The Cavern
2A
| # | Unit | Where |
|---|---|---|
| 123 | Mole Man, Goblin, Gnome, Mushroom Girl, Skeleton, Flesheater, Shadow Entity | The Cavern |
| 124 | Reptilian | Hollow Earth (it made the Dinosaurs) |
| 125 | Golem | Agartha's gate |
| 126 | Antperson | The Long Tunnel + The West Tunnel |

### The Deep
2A
| # | Unit | Where | Why |
|---|---|---|---|
| 127 | Atlantean M/F | Atlantis, the Citadel | |
| 128 | Mermaid M/F, Starfish, Sharkman | Atlantis, the Rings | |
| 129 | Grey | The Temple of the Deep | the Jellyfish made them |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 130 | Jellyfish | The Temple of the Deep | his tie: allied to Atlantis |
| 131 | Kraken | The Trench (its lair) | |
| 132 | Jellyfish UFO | The Sea Floor | rises to the Ocean |

### Katana Island
2A
| # | Unit | Where |
|---|---|---|
| 133 | Shogun | The Palace (the City) |
| 134 | Swordfighter M/F | The Samurai Quarter |
| 135 | Ninja M/F | The Castle by day, The Old Wood by night |
| 136 | Spy | The Palace |
| 137 | Monk | The Temple Quarter |
| 138 | VTuber, Catgirl, Chef | The Merchants' Town |
| 139 | Farmer | The Paddies + The Village |
| 140 | Karate Frog | The Paddies |
| 141 | Samurai Slug | The Castle Garden |
| 142 | Ki Fighter M/F | The Bamboo Wood + The Hot Spring |
| 143 | Dragon | The Crater (the Volcano) |
| 144 | Chef | The Waterfront (Katana Bay) |

2B
| # | Unit | Where | Why |
|---|---|---|---|
| 145 | Dinosaur | The Dinosaur Park (the Jungle) | the plot is named for it |
| 146 | Hacker | The High Town | his tie: the Shogun employs him |

## 3. EVERY UNIT'S HOME AND ROUTE

"(n)" = an approval row of section 2. No mark = straight from his board.

### Disaster City
| Unit | Home | Route |
|---|---|---|
| Police Officer | every district but Southside | ZONE (the beat, never Southside) |
| Delivery Boy (2) | Delivery yard, Hero Plaza | ZONE, every district, by day |
| Honda Civic (3) | the roads | ZONE; CLOCK with the Desert's Highway |
| Chef (1) | his restaurant | STAYS at work; home in the same district |
| Cameraman | Civic, Entertainment, Hero Plaza, Bayside, Sports, the Hills | each: his district ↔ the News office (Hero Plaza) |
| Skater M/F | Entertainment, University, Bayside, Southside, the Hills | each: his district ↔ the skate park (Bayside) |
| Hippie M/F | Civic, Bayside, the Hills; M also University | Civic ↔ Bayside (the protest by day, the beach by night) |
| Gambler | Financial, Entertainment, Southside, Sports, the Hills | each: his district ↔ the Casino; the Financial one ↔ the Bank (he owes the Banker) |
| Influencer | Bayside, Sports, the Hills | Bayside ↔ the Mall ↔ the Hills |
| Eagleman | Civic, Financial, Hero Plaza, Sports | flies all four |
| Politician M/F | Civic (City Hall) | Civic ↔ Financial (Members club, 7); M: CLOCK with the D.U.M.B.'s Command (56) and the Ritual Ground by night (32) |
| Firefighter | Civic (Fire Station) | Civic ↔ whichever district; one crew in the Hills (18) |
| Reptilian | Civic | Civic ↔ Financial (Members club, 8) |
| General (13) | Military offices, Civic | Civic ↔ Members club; CLOCK with Area 51 and Command |
| Time Cop (14) | Time Bureau, Civic | ZONE (he hunts the Cult Leader) |
| Librarian | University; Public library (15) | STAYS |
| Banker | Financial (Bank offices) | Bank ↔ Members club; by night the Ritual Ground (32) |
| Tech CEO | Financial (Penthouse stair) | Penthouse ↔ Members club ↔ Aerospace lab (Industrial) |
| Halfdemon M/F | Financial | Financial ↔ Members club; CLOCK with Hell's Walkways (121) |
| Elle (cast) | Financial | with the Tech CEO |
| Ghost M | Luxury hotel; Waterfront hotel | STAYS (never leaves the building) |
| Goblin (10) | Goblin Bank | STAYS; CLOCK with the Cavern |
| Spy (11) | Intelligence office | Intelligence office ↔ the Penthouse; CLOCK with Katana's Palace |
| Men in Black (12) | Intelligence office | Financial ↔ Civic |
| Marksman M/F (9) | Members club door | STAYS on the door |
| Popstar (22) | the Stilt House, the Hills | the Hills ↔ Entertainment (Concert hall, Recording studio) |
| Bunny Girl | Entertainment (Cabaret, Casino) | DISTRICT; CLOCK with the Circus (allied to the Ringmaster) |
| Magician | Entertainment (Cabaret) | DISTRICT |
| Mime M/F | F Entertainment + Bayside; M Bayside | Entertainment ↔ Bayside's boardwalk |
| Streamer M/F | University; the Arcade (23) | University ↔ the Arcade |
| Astronaut | Industrial (Aerospace lab) | Industrial ↔ the Film studio (21) |
| Clown M (5) | Comedy theater | Entertainment by day ↔ Southside by night |
| Professor M/F | University | DISTRICT; M: ↔ Members club (8) |
| Mad Scientist F | University (Research lab) | DISTRICT |
| Chess Piece | University (Campus green) | STAYS |
| Janitor | University, Industrial; (17) | his building, floor by floor |
| Hacker | University (Dorm court) | University ↔ the Arcade; CLOCK with the Internet |
| Superhero M/F, Sidekick, Antihero | Hero Plaza (Superhero Tower) | Hero Plaza by day; ZONE patrol by night |
| Lifeguard M/F | Bayside (the beach) | the beach, by shift |
| Florida Man | Bayside | Bayside ↔ the beach; CLOCK with Area 51's gate (94) |
| Gangster | Southside | Southside ↔ the Casino's back door ↔ Industrial's Dock edge, by night |
| Televangelist | Southside (Church) | Southside ↔ Entertainment (his show) |
| Priest M/F | Southside (Church) | DISTRICT |
| Conspiracy Theorist (6) | Southside homes | Southside ↔ City Hall ↔ the Radio Mast |
| Ki Fighter F, Swordfighter M (20) | the Dojo | STAY |
| Cursed TV (19) | Pawnshop court | STAYS |
| Quarterback, Referee | Sports (Clubhouse, Locker rooms) | DISTRICT |
| Luchador | Wrestling hall | STAYS; CLOCK with the Circus |
| King Kong (4) | the park, Sports | Sports ↔ Hero Plaza (the Tower) |
| Mechanic | Industrial (Machine shop); (16) | his shop |
| Trucker | Industrial (Freight gate) | Industrial; CLOCK with the Highway and Western Town |

### The Woods
| Unit | Home | Route |
|---|---|---|
| Bigfoot (24) | Redwood Trail | Trail ↔ Clearing; walks away from the Cameraman |
| Cameraman (25) | his camp, the Trail | Trail ↔ Clearing |
| Mothman (26), Werewolf (27) | The Clearing | Clearing ↔ Trail, by night only |
| Wendigo (28) | Dead Man's Cave | Cave ↔ Trail, by night |
| Goatman (29) | Ritual Ground | Ritual Ground ↔ Clearing |
| Shadow Entity (30) | Ritual Ground | Ritual Ground ↔ Cave, by night |
| Cultists 1 to 5, Cult Leader (31) | Ritual Ground | STAY; the Leader: CLOCK with the Ley Line (100) |
| Conspiracy Theorist | the Ritual Ground's edge | Ritual Ground ↔ Clearing (he watches the rite) |
| Skater M/F | Dead Man's Cave | Cave ↔ Clearing |

### Came A Lot
| Unit | Home | Route |
|---|---|---|
| King Arthur | The Castle | Castle ↔ Village, once a day |
| Knight M/F | The Castle | Castle ↔ Village gate (35); one pair hunts the Dragon in The Forest |
| Wizard M/F (33) | The Castle | Castle ↔ Village ↔ Stonehenge (41) |
| Dragon (34) | The Forest | flies Forest → Castle → Village; CLOCK: one Dragon each for Shasta (84) and Katana's Crater (143) |
| Robinhood | The Forest | Forest ↔ Fairy Forest ↔ the Village road (he owes King Arthur) |
| Fairy, Mushroom Girl, Rabbit, Tree Person | Fairy Forest, the Garden, The Forest | each: its wood ↔ the next |
| Unicorn | Fairy Forest | DISTRICT |
| Gnome | Fairy Forest, Village, Snowy Pines | Village ↔ Fairy Forest; Pines ↔ the North Pole (CLOCK) |
| Chess Piece | the Looking-Glass Garden | STAYS on its board |
| Yeti | Snowy Pines | Pines ↔ the Snowy Pass (CLOCK) |
| Farmer (36), Priest M (37), Chef (38) | The Village | DISTRICT |
| Krampus (39) | Snowy Pines | Pines ↔ the North Pole (CLOCK) |
| Werewolf (40) | The Forest | by night only |
| Hippie M/F (41) | Stonehenge | Stonehenge ↔ the Ley Line (CLOCK) |

### Outer Space (the four worlds are four rooms: every route between worlds is CLOCK)
| Unit | Home | Route |
|---|---|---|
| Astronaut (42) | The Mare; The Rover Bay; the Spaceship | Mare ↔ Crater; Rover Bay ↔ Canyon |
| Grey (43, 45) | The Far Side; The Hexagon | Far Side ↔ Crater; CLOCK Far Side ↔ Hexagon |
| Bligblog (43) | The Far Side | DISTRICT |
| Mantid (49), Reptilian (48) | The Crater; The Far Side | Far Side ↔ Crater |
| Martian (44) | Cydonia | Cydonia ↔ Canyon ↔ Rover Bay (it rivals the Greys) |
| Black Goo (45) | The Hexagon | Hexagon ↔ Ring Shard |
| Nordic M/F (46) | The Ring Shard | DISTRICT; CLOCK with Antarctica |
| Barbarella (46) | The Ring Shard | Ring Shard ↔ Hexagon (she hunts the Black Goo); CLOCK with Mars |
| Cosmic Wraith (47) | The Drop | Drop ↔ Accretion Rim |
| Boltzmann Brain, Watcher (50) | The Accretion Rim | STAY |

### The D.U.M.B.
| Unit | Home | Route |
|---|---|---|
| General | Command | Command ↔ Research; CLOCK with Area 51 and the city |
| Politician M (56) | Command | visits by CLOCK |
| Marksman M/F (56) | Command | Command ↔ Level P3 |
| Mad Scientist M (51) | Research | Research ↔ Sub-Level 7 ↔ CERN |
| Grey (51) | Research | Research ↔ Sub-Level 7 |
| Symbiote (51) | Research | Research ↔ Sub-Level 7 |
| Telepath M/F, Juggernaut (52) | Sub-Level 7 | STAY in the cells; the Telepaths: CLOCK with the Astral Realm (asleep here = there) |
| Shadow Entity (52) | Sub-Level 7 | Sub-Level 7 ↔ CERN |
| Men in Black, Mechanic (53) | Level P3 | MiB: ZONE; Mechanic: STAYS |
| Hacker (54) | CERN | CERN ↔ Level P3 |
| Machine Elves, Glitch (57) | CERN | STAY at the Ring |
| Janitor (55) | Command | ZONE, every level |

### Bug Colony
Bee Queen STAYS in the Hive (58). Antperson: the Ant Nest ↔ the Giant Tree; CLOCK with the Cavern's tunnels (59, 126). Cicada Brood: the Giant Tree, DISTRICT. Mantid: Hive ↔ Nest (the overseer). Voidweaver: between the two (60).

### The Sewers
| Unit | Home | Route |
|---|---|---|
| Sewer Gator (61) | The Sewers | Sewers ↔ Radioactive Drain |
| Karate Frog (62) | The Sewers | Sewers ↔ Running Tunnels |
| Samurai Slug (63) | The Old Workings | Old Workings ↔ Running Tunnels (where the two meet) |
| Swamp Monster (64) | The Old Workings | Old Workings ↔ Radioactive Drain |
| Men in Black (65) | The Holding Cells | Cells ↔ Running Tunnels |
| Mole Man (66) | The Old Workings | CLOCK with the Cavern |

### The Internet
| Unit | Home | Route |
|---|---|---|
| AI (71) | The Motherboard | STAYS |
| Virus (70) | The Pop-ups | ZONE (it spreads) |
| Glitch (70) | The Pop-ups | anywhere, a new district each hour |
| Streamer M/F, VTuber (67) | Live | Live ↔ The Feed |
| Influencer (68) | The Feed | Feed ↔ Live |
| Conspiracy Theorist (69) | The Forums | Forums ↔ Feed |
| Florida Man (74) | The Forums | STAYS |
| Hacker (69, 75) | The Forums; The Dark Web | Forums ↔ Dark Web ↔ Server Farm |
| Men in Black | The Dark Web | Dark Web ↔ Forums |
| Demon M (73) | The Dark Web | Dark Web ↔ Pop-ups |
| Ghost M (72) | The Server Farm | Server Farm ↔ Information Highway |

### The Astral Realm
Occulus: all three districts. Boltzmann Brain, Orb of Light: Sea ↔ Library. Machine Elves: STAY in the Library. Dreameater: Nightmare ↔ Sea (it hunts dreamers). Telepath M/F (76): the Sea. Shadow Entity (77), Flesheater, Succubus M/F: the Nightmare; the Succubi CLOCK with Hell's Walkways. Ghost M (78): the Waiting Room, STAYS.

### The Beach + the sea
| Unit | Home | Route |
|---|---|---|
| Lifeguard M/F, Starfish (79) | The Shore | DISTRICT |
| Florida Man (79) | The Shore | Shore ↔ Harbour |
| Pirate M/F (80, 81) | Pirates' Cove | Cove ↔ Harbour ↔ Ocean ↔ Bermuda Triangle |
| Skeleton (81) | Pirates' Cove | STAYS |
| Deep Sea Diver (80) | The Harbour | Harbour ↔ Ocean; CLOCK with the Sea Floor and the Trench |
| Siren | The Bermuda Triangle | Triangle ↔ Ocean (she hunts Pirate M, who loves her) |
| Sharkman | The Bermuda Triangle | Triangle ↔ Ocean; CLOCK with the Trench |
| Kraken, Jellyfish | The Ocean | Ocean; CLOCK with the Deep (131, 130) |
| Jellyfish UFO (83) | The Ocean | Ocean ↔ Triangle; CLOCK with the Sea Floor (132) |
| Monk, Ninja M (82) | The Volcano Island | DISTRICT; CLOCK with Katana |

### The Mountains
| Unit | Home | Route |
|---|---|---|
| Santa Clause | North Pole (the workshop) | STAYS |
| Gnome | North Pole | workshop ↔ the village; one group ↔ the Snowy Pass |
| Krampus | North Pole | North Pole ↔ Snowy Pass (the enforcer) |
| Ice Queen | North Pole | North Pole ↔ Snowy Pass |
| Yeti | North Pole, the slopes, the Snowy Pass | Pass ↔ slopes |
| Men in Black (88) | North Pole | STAYS by the workshop |
| Chef, Skater M/F, Influencer (85) | The Ski Lodge | Chef STAYS; the others lodge ↔ slopes |
| Giant, Cyclops, Minotaur, Nephilim | Mount Olympus | DISTRICT |
| Dragon (84) | Mount Shasta | Shasta ↔ Olympus, in the air |
| Hippie M/F, Shaman M/F (87) | Mount Shasta | DISTRICT |
| Bigfoot (87) | Mount Shasta | CLOCK with the Redwood Trail |

### The Estate
| Unit | Home | Route |
|---|---|---|
| Scarecrow | The Corn Fields | STAYS by day, walks the corn by night |
| Jack O Lantern | The Corn Fields | Corn ↔ Graveyard |
| Farmer | Corn Fields; the Ranch | Corn ↔ Ranch |
| Cowboy M/F | The Ranch | Ranch ↔ Corn (County Lane); CLOCK with Western Town |
| Loch Ness Monster | The Lake | STAYS; under water while the Cameraman is near |
| Ghost M/F, Haunted Doll, Cursed TV (89) | the Haunted House | STAY in their rooms |
| Vampire M/F (89) | the Cellar | Cellar by day; Graveyard ↔ Corn by night |
| Zombie M/F, Skeleton, Undead, Ghoul (89, 93) | the Graveyard | DISTRICT, by night |
| Grey (90) | The Corn Fields | by night only; Corn ↔ Ranch |
| Cameraman (91) | The Lake | Lake ↔ Haunted House |
| Priest M (92) | The Graveyard | Graveyard ↔ the Hall, by day |

### The Desert
| Unit | Home | Route |
|---|---|---|
| Ringmaster | Circus (the big top) | STAYS |
| Clown M/F, Mime M/F, Magician, Luchador, Fortune Teller M/F | Circus | DISTRICT; the Fortune Tellers STAY in their tent |
| Sheriff | Western Town | Western Town ↔ Highway (97) |
| Cowboy M/F, Gambler | Western Town (the saloon) | DISTRICT |
| Farmer | Western Town | Western Town ↔ Highway |
| Mechanic | Western Town; the Highway (97) | STAYS at his garage |
| Trucker | The Highway | Highway ↔ Western Town; CLOCK with Industrial |
| Honda Civic | The Highway | Highway; CLOCK with the city |
| General | Area 51 | CLOCK with Command |
| Men in Black, Marksman M/F | Area 51 | the fence, all the way round |
| Grey | Area 51 | Area 51 ↔ Hangar 18 |
| Mad Scientist M (96), Bligblog (95) | Hangar 18 | STAY |
| Conspiracy Theorist, Florida Man (94) | Area 51's gate | Gate ↔ Highway |
| Pharaoh M/F | Giza | Giza ↔ inside the Pyramid |
| Anubis, Annunaki | Giza | DISTRICT (Annunaki employs Anubis) |
| Mummy M/F, Necromancer M/F | inside the Great Pyramid | Pyramid ↔ Giza by night; the Necromancers CLOCK with Babel |
| Djinn, Catgirl | Giza | DISTRICT |

### Leylines
| Unit | Home | Route |
|---|---|---|
| Giant (98) | Göbekli Tepe | Göbekli Tepe ↔ the Ley Line ↔ Stonehenge |
| Watcher (98) | Göbekli Tepe | STAYS |
| Nephilim, Fallen Angel M/F, Golem (99) | Babel | Babel ↔ the Ley Line; the Golem STAYS at the gate |
| Necromancer M/F | Babel | DISTRICT |
| Quetzalcoatl | Technoticlan (the temple top) | STAYS |
| Shaman M/F | Technoticlan | Technoticlan ↔ the Ley Line |
| Dinosaur, Reptilian | Technoticlan | DISTRICT |
| Cult Leader (100) | (the Ritual Ground) | passes along the Ley Line |
| Hippie M/F (102) | The Ley Line | Ley Line ↔ Stonehenge |

### Antarctica
Nordic M/F (103): the Hull ↔ the Polar Openings. Reptilian (104): the Polar Openings. Men in Black: the Ice Wall, end to end. Conspiracy Theorist (107): the Shelf Ice ↔ the Wall's foot. Yeti (105): Crevasse ↔ Shelf Ice. Professor F, Mechanic (106): STAY at the Station.

### Heaven + Hell + Vatican
| Unit | Home | Route |
|---|---|---|
| Pope | The Palace | Palace ↔ Basilica |
| Priest M/F (108) | The Cloister | Cloister ↔ Basilica ↔ Gardens |
| Gargoyle M/F (109) | the roofs | STAY by day; fly Basilica ↔ Cloister by night |
| Gladiator M/F | The Colosseum; The Square | Colosseum ↔ Square |
| Cyclops, Minotaur | The Colosseum | STAY |
| Reptilian (117) | The Palace | STAYS |
| Knight M/F (118) | The Square | Square ↔ Basilica |
| Skeleton, Undead, Vampire M (119) | The Catacombs | DISTRICT |
| Angel M (110) | The Gate | STAYS |
| Valkraye (110) | The Stairway | Stairway ↔ Gate |
| Orb of Light, Angel F (111) | The Cloud Fields | Cloud Fields ↔ City |
| Seraphim M/F (112) | The City | STAY |
| Demon M/F (113), Fallen Angel M/F (120) | The Rim | Rim ↔ Descent |
| Undead, Ghoul, Flesheater (114) | The Descent | Descent ↔ Walkways |
| Succubus M/F (115), Halfdemon M/F (121) | The Walkways | Walkways ↔ Bowl |
| Overlord (116) | The Bowl | STAYS |
| Demon Prince, Demon Princess (116) | The Bowl, opposite sides | each: Bowl ↔ Walkways, never together |
| Necromancer M/F (122) | The Bowl | CLOCK with Babel |

### The Cavern
Mole Man, Goblin, Gnome, Mushroom Girl (123): the Cavern, DISTRICT; the Goblin CLOCK with the Goblin Bank. Skeleton, Flesheater, Shadow Entity (123): the Cavern's far end. Antperson (126): the tunnels, end to end. Giant, Dinosaur, Reptilian (124): Hollow Earth. Crystal Guardian: Agartha, STAYS. Golem (125): Agartha's gate, STAYS.

### The Deep
Atlantean M/F (127): Citadel ↔ Temple. Jellyfish, Grey (129, 130): the Temple ↔ the Rings. Mermaid M/F, Starfish (128): the Rings. Sharkman: Rings ↔ Trench. Deep Sea Fish: Sea Floor ↔ Trench. Deep Sea Diver: Sea Floor ↔ Trench (CLOCK with the Harbour). Kraken (131): Trench ↔ Sea Floor. Jellyfish UFO (132): the Sea Floor.

### Katana Island
| Unit | Home | Route |
|---|---|---|
| Shogun (133) | The Palace | Palace ↔ Castle |
| Spy (136) | The Palace | CLOCK with Financial |
| Swordfighter M/F (134) | The Samurai Quarter | Quarter ↔ Castle ↔ Waterfront |
| Ninja M/F (135) | The Castle | ZONE by night |
| Monk (137) | The Temple Quarter | Temple Quarter ↔ Hot Spring |
| VTuber, Catgirl (138) | The Merchants' Town | Merchants' Town ↔ High Town |
| Chef (138, 144) | Merchants' Town; the Waterfront | Merchants' Town ↔ the Fishing Beach each morning |
| Hacker (146) | The High Town | STAYS |
| Farmer (139) | The Village | Village ↔ Paddies ↔ Terraces |
| Karate Frog (140), Samurai Slug (141) | the Paddies; the Castle Garden | each its own; they meet at the Waterfront |
| Ki Fighter M/F (142) | The Bamboo Wood | Bamboo Wood ↔ Hot Spring ↔ the Volcano's flank |
| Dragon (143) | The Crater | flies the Volcano |
| Dinosaur (145) | The Dinosaur Park | Park ↔ Jungle |

### DOOR HQ
The story cast, as on the board. No routes proposed: the story places them.

## 4. WHAT LEAVES (the game stands them today, the board does not)

If the board REPLACES today's placements (question 5.1), these go:
- **Disaster City residents:** Nephilim, Ninja, Super Sentai (Hero Plaza); Zombie × 4, Telepath, Mad Scientist M, Reptilian (University);
  Cult Leader, Firefighter's home (Southside); Juggernaut (Sports); Knight, Marksman, Gangster's home (Industrial); Pirate (Bayside);
  Ringmaster (Entertainment); the Dinosaur (Sports).
- **Every zone's walk-in table** (`HQ_AREA_ENCOUNTERS`: the Desert lists the Kraken, the Cavern the Ice Queen, the Beach the Superhero ...) is
  replaced by that zone's rows of section 3.
- Hand-placed quest and scene NPCs (`npcSpots` a story beat needs) are NOT touched without a look at each.

## 5. QUESTIONS

1. **Does the board replace what the game stands today, or only add to it?** Proposed: replace (section 4).
2. **"Future" is not a zone.** Only there on the board: Robot M/F, Mech M/F, Cyborg M/F, Time Cop, Kaiju. Hold them until a Future zone
   exists, or stand them now? If now: Time Cop = the Time Bureau (14); Mech M/F = Hangar 18 + Command (they serve the General);
   Robot M/F = the Internet's Server Farm (Robot Takeover); Cyborg M/F = the Sewers' Old Workings (Escapees in hiding); Kaiju = nowhere
   (it is the Sewer Gator's future).
3. **Six units of the game are not on the board:** Android, Droid, Skinwalker, Chosen One, Super Sentai, Door Agent. Left out on purpose?
   If not: Skinwalker = the Ranch by night; Chosen One = Mount Olympus; Super Sentai = Katana's Merchants' Town; Door Agent = DOOR HQ;
   Android + Droid = with the Robots.
4. **CLOCK routes:** a unit of two zones is in one for some hours and in the other for the rest; it is not seen on the road between.
   OK, or should a few (the Trucker, the Honda Civic, the Delivery Boy) really drive the route rooms?
5. **"The lodge":** read as Financial's Members club (the game's old Lodge). The Ski Lodge gets them only on holiday (86).

## 6. HOW IT GETS BUILT (after his answers)

- **Disaster City:** rows of `HQ_CITY_RESIDENTS` + `HQ_SPAWN_RULES.rooms[...].people` (the days, shifts and beats exist). The spawn system
  row on the board is the second side's: a board note first.
- **Every other zone:** has no clocked days today (npc-system.md row 9: "a zone without a walk grid falls back to the rounds"). The city's
  day code has to read a zone room first (delivery 8, "the blueprint"); then one table a zone.
- **The Relationship Web's map** has no Katana Island yet: `node build.js` after the map is read again.
- Order proposed: the city, then the zones he plays first.
