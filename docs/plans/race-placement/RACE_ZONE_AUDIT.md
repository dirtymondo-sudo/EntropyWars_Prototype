# Entropy Wars: race placement audit of the HQ world

Source: the local copies in `/home/user/ew-src` pulled 2026-11-18 (`data.js`, `sprites.js`; `state.js`, `map.js`, `battle.js` and `ai.js` hold no placement tables). Nothing in the source was changed.

Method: I loaded `data.js` and `sprites.js` in a Node sandbox and called the game's own functions (`hqRoomPopulation`, `hqSiteResidents`, `hqRoomEncTable`, `hqSpotRaces`, `hqHubOf`, `hqWorldGraph`) for every room, so the tables below are what the shipped rules produce, not what the comments say. Anything marked *inferred* is my reading rather than something the data states.

## The short version

The world has 18 zones and 160 races. Most fixed placements make sense. The problems come from three rules that fire in places their authors probably did not intend:

1. **A room's encounter table replaces any fixed NPC whose race is not on the table.** The Circus, Western Town and Area 51 all borrow the Giza table, so their clowns, cowboys, the sheriff and the Men in Black are swapped for mummies, djinn and greys. Camelot's outer woods and the Beach have the same problem.
2. **A merged room draws its walkers from its parent site.** Mount Olympus draws Mount Shasta's people, Stonehenge and Technoticlan draw Göbekli Tepe's, the Haunted House grounds draw the ranch's.
3. **Four filed homes match no site**: The Internet, The Sewers, The Carnival and H-Wing. The races filed there get no walker pool at all.

The result is 2 races that appear nowhere (streamer, vtuber), 4 that appear only as accidental strays (virus, sewer gator, samurai slug, quetzalcoatl), 27 races with fixed spots that are overridden somewhere, and 17 races absent from the zone their own file names.

## 1. How placement works

Five mechanisms decide who stands where. All line numbers are in `data.js`.

| Mechanism | Table / function | What it does |
|---|---|---|
| Fixed NPCs | `DOOR_HQ.rooms[id].npcSpots` (inline in the room definitions, from line 31313) | An authored person at an x/z position. 635 of these carry a race across the live rooms. |
| Encounter table | `HQ_AREA_ENCOUNTERS` (92540), plus aliases at 93446–93455, read by `hqRoomEncTable` (93456) | A weighted race list per room. Where a room has one it is the **only** source of random walkers, and `hqSpotRaces` (93478) re-races every fixed NPC whose race is not on the list, unless the NPC has a `talk`, `cast` or `clone` field or the table says `spots: false`. Only the North Pole sets `spots: false`. |
| Site pool | `hqSiteResidents` (91334), fed by `DOOR_TEXT.POINT_OF_ENTRY` (28587), `ALSO_NATIVE` (28653), `EW_RACE_BIOMES` (20949) and `EW_MAP_META` biomes (19842) | Used when a room has no table. Walkers are drawn 50% from races filed at the room's `site`, 30% from every race sharing a biome tag with the site, 20% from neighbouring sites and the sector (`HQ_POPULATION_RULES.wildWeights`, 91260). |
| Sewer list | `HQ_POPULATION_RULES.underworld` (91288) | A fixed list of 13 races that replaces the site pool in the Sewers. |
| City residents | `HQ_CITY_RESIDENTS.list` (91502) expanded by `HQ_SPAWN_RULES.rooms.*.people` (91585) | 150 scheduled residents of Disaster City, each with a home district, a job and a level tier. |

Smaller sources: story cast (`DOOR_CAST`, 100870), six plot-dungeon fights (`PD_DUNGEONS`, 101695), one battle dungeon (`MD_DUNGEONS.agartha_depths`, 20187), and room variants. `BOSS_DEFS` holds two battle-map bosses that are not roster races. `HQ_AREA_LEVELS` only covers the training room. `CAMPAIGN_REGION_THEMES` holds level bands and no races. `RACE_PROFILES` has no faction field in this build, only `types`.

Three facts shape everything below:

- **`site` is not the room's name.** After the one-world merge, many rooms keep their parent's site. Mount Olympus, the Ski Lodge and the Polar Trail are all `prebuilt_shasta`; Stonehenge, Babel, Technoticlan and the Bug Colony are all `prebuilt_gobekli`; the Haunted House grounds are `prebuilt_skinwalker`; all of Outer Space is `prebuilt_moon`. Fourteen sites that still own filed races have no live room of their own (list in section 4).
- **Nothing separates "hostile" from "resident" by placement.** Any fixed NPC or walker in a room with a site can be struck and fought, except story cast, agents and Men in Black. What differs is temper (`HQ_NPC_TEMPERS`, 91766): brutes attack on sight, territorials warn first, opportunists mug, guards and protectors defend others, civilians and cowards flee. Only 42 races have a temper so far. The temper is shown per race in section 3.
- **Nine races have no 3D model** (`isRace3DReady` in `sprites.js`): android, skinwalker, cyclops, demon prince, droid, chosen one, super sentai, watcher, vtuber. They are filtered out of every walker pool and table. They still hold 33 fixed spots between them (watcher 12, android 9, droid 5). Whether those spots draw anything is decided in the renderer, which I do not have. They are marked † throughout.

## 2. Zone by zone: who appears where

How to read the tables:

- **Fixed NPCs standing as themselves** are authored spots the rules leave alone.
- **Overridden** spots are authored but re-raced from the room's table each day, so the race written there does not appear at that spot.
- **Random walkers** names the pool and the number of extra walkers the room draws. Pools and tables are listed after the zone tables.
- Sub-areas are the room's own named districts. A fixed NPC is assigned to the district of the plot it stands on. For the Disaster City streets the district move makes that lookup approximate; the resident rows are exact.
- Retired rooms (66), the D.O.O.R. HQ building's roster-driven rooms and the puzzle dungeons are left out of these tables and covered afterwards.

### Disaster City

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **Disaster City · The Tower Lobby** | superhero, zombie | — | table **CITY**, 1 |
| **Disaster City · The Showroom** | door agent ×6, politician | — | table **CITY**, 1 |
| **Disaster City · The Platform** | antihero, zombie | — | table **CITY**, 2 |
| ↳ variants | rush_hour: antihero, zombie; last_train: zombie | — | |
| **Disaster City** · Sports + Culture | — | dinosaur | table **CITY**, 6 |
| ↳ outside the named plots | hippie ×2, chef | homosapien ×4, mermaid, siren |  |
| ↳ Entertainment | king kong | — |  |
| ↳ residents with a home in Southside (16) | gangster×5, conspiracy theorist×2, firefighter×2, priest×2, chef, cult leader, cursed tv, ki fighter, swordfighter | — | |
| ↳ residents with a home in Financial (18) | goblin×3, banker×2, police officer×2, politician×2, spy×2, chef, general, halfdemon, honda civic, men in black, tech ceo, time cop | — | |
| ↳ residents with a home in University (17) | zombie×4, professor×3, chef×2, librarian×2, police officer×2, telepath×2, mad scientist, reptilian | — | |
| ↳ residents with a home in Hero Plaza (16) | police officer×4, chef×2, delivery boy×2, superhero×2, antihero, eagleman, nephilim, ninja, sidekick, super sentai† | — | |
| ↳ residents with a home in Entertainment (18) | bunny girl×3, clown×3, mime×3, chef×2, influencer×2, magician×2, police officer×2, ringmaster | — | |
| ↳ residents with a home in Bayside (16) | hippie×3, chef×2, lifeguard×2, pirate×2, police officer×2, skater×2, florida man, ghost, popstar | — | |
| ↳ residents with a home in Sports + Culture (17) | luchador×4, quarterback×4, police officer×2, referee×2, chef, delivery boy, firefighter, juggernaut, king kong | — | |
| ↳ residents with a home in Industrial (16) | marksman×4, astronaut×2, firefighter×2, gangster×2, knight×2, police officer×2, chef, delivery boy | — | |
| ↳ residents with a home in Civic Center (16) | police officer×6, firefighter×5, politician×3, chef, time cop | — | |
| ↳ The Hollywood Hills (39 plots) | — (no fixed NPCs, no residents) | — | |
| **Disaster City · The Mall** | zombie ×2, conspiracy theorist, mad scientist | — | table **CITY**, 6 |
| **Disaster City · Supply Closet** | — (no fixed NPCs) | — | table **CITY**, 1 |

### The Sewers

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **Disaster City · The Sewers** · The Holding Cells | gangster, men in black, politician, zombie | — | `underworld` list, 4 |
| ↳ The Old Workings | flesheater, ghost, ghoul, skeleton, swamp monster, zombie | — |  |
| ↳ The Radioactive Drain | black goo ×2, kaiju, mad scientist, swamp monster | — |  |
| ↳ The Running Tunnels | ai, gangster, skeleton, zombie | — |  |
| ↳ The Sewers | conspiracy theorist, gangster, ghoul, zombie | — |  |

### The Beach

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **The Beach** · The Shore | mermaid, pirate, starfish | homosapien ×5, chef, hippie, siren | table **BEACH**, 4 |
| ↳ The Harbour | pirate ×2, sharkman | homosapien ×6 |  |
| ↳ outside the named plots | pirate | hippie |  |
| ↳ The Ocean | starfish | — |  |
| **The Bermuda Triangle** · The Bermuda Triangle | deep sea fish, jellyfish, pirate, sharkman | siren | table **BEACH**, 4 |
| **The Volcano Island** · The Ocean | dinosaur, pirate | — | table **VOLCANO**, 4 |
| ↳ outside the named plots | dinosaur ×3 | — |  |
| **Pirates' Cove** · The Ocean | pirate ×4 | — | table **COVE**, 4 |
| **The Frozen Sea** · outside the named plots | yeti | — | table **FROZEN SEA**, 4 |
| ↳ The Ocean | yeti | — |  |
| **The Coast Road** | — (no fixed NPCs) | — | site pool **The Bermuda Triangle**, 4 |

### The Deep

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **The Deep · Atlantis + The Trench** · Atlantis, the Citadel | atlantean ×5, mermaid ×3, starfish ×2 | siren | table **DEEP**, 4 |
| ↳ Atlantis, the Rings | atlantean ×2, mermaid, starfish | siren |  |
| ↳ The Trench | deep sea fish ×2, kaiju, kraken, mermaid | — |  |
| **The Deep · The Sea Floor** · The Sea Floor | atlantean, deep sea fish, jellyfish, mermaid, pirate, sharkman | — | table **DEEP**, 4 |
| **Atlantis · The Temple Of The Deep** | atlantean, mermaid, starfish | — | table **DEEP**, 4 |

### The Flying Dutchman (no hub)

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **The Flying Dutchman · The Gun Deck** | pirate, skeleton | — | site pool **The Flying Dutchman**, 1 |
| ↳ variants | battle_stations: pirate ×3, skeleton ×2 | — | |
| **The Flying Dutchman · The Captain’s Cabin** | ghost | — | site pool **The Flying Dutchman**, 1 |
| **The Flying Dutchman · The Hold** | mermaid, siren | — | site pool **The Flying Dutchman**, 1 |
| **The Flying Dutchman · The Main Deck** | pirate ×2, ghost, siren | — | site pool **The Flying Dutchman**, 4 |

### The Desert

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **Area 51 · Hangar 18** | general, grey, mad scientist, men in black | — | site pool **Area 51**, 4 |
| **Giza · Inside The Great Pyramid** | anubis, mummy | — | site pool **Pyramids of Giza**, 4 |
| **The Circus** · The Circus | catgirl, fortune teller, giant, wizard | clown ×2, bunny girl, chef, cyclops†, gnome, luchador, mermaid, mime, ringmaster | table **DESERT**, 4 |
| **Western Town** · Western Town | skeleton | cowboy ×2, sheriff | table **DESERT**, 4 |
| **Area 51** · Area 51 | grey | men in black ×3, marksman ×2, bligblog, mad scientist, spy | table **DESERT**, 4 |
| **Giza** · Giza | anubis ×3, mummy ×3, skeleton ×3, djinn ×2, annunaki, conspiracy theorist | — | table **DESERT**, 4 |
| **The Delta Causeway** | — (no fixed NPCs) | — | site pool **Area 51**, 4 |
| **The Badlands Highway** | — (no fixed NPCs) | — | table **DESERT**, 4 |
| **The Desert Highway** | — (no fixed NPCs) | — | table **DESERT**, 4 |
| **The Desert Highway** · The Highway | conspiracy theorist | — | table **DESERT**, 4 |
| **The Desert Highway** | — (no fixed NPCs) | — | table **DESERT**, 4 |
| **The Desert Highway** | — (no fixed NPCs) | — | table **DESERT**, 4 |

### The D.U.M.B.

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **The D.U.M.B.** · Command | politician ×2, catgirl, general, juggernaut, men in black | — | site pool **D.U.M.B.**, 4 |
| ↳ CERN, The Ring | ai, glitch, mad scientist | — |  |
| ↳ Level P3 | cowboy, mad scientist, men in black | — |  |
| ↳ Research | telepath ×3, grey ×2, android†, dreameater, mad scientist, men in black | — |  |
| ↳ Sub-Level 7 | android† ×3, mad scientist ×2, men in black ×2, professor ×2, flesheater, grey, telepath | — |  |

### Leylines

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **Leylines · The Line** · Göbekli Tepe | annunaki, conspiracy theorist, grey, shaman | — | site pool **Göbekli Tepe**, 4 |
| ↳ The Ley Line | antperson, conspiracy theorist, giant, grey, watcher† | — |  |
| **Leylines · Babel + Technoticlan** · Babel | conspiracy theorist, giant, golem | — | site pool **Göbekli Tepe**, 4 |
| ↳ Technoticlan | annunaki ×2, reptilian | — |  |
| **Stonehenge** · Stonehenge | hippie ×2, shaman ×2, conspiracy theorist, knight | — | site pool **Göbekli Tepe**, 4 |
| **Bug Colony · The Hive** | bee queen ×2 | — | site pool **Göbekli Tepe**, 4 |
| **Bug Colony · The Ant Nest** | antperson ×2 | — | site pool **Göbekli Tepe**, 4 |
| **Bug Colony** · Bug Colony | antperson, bee queen, mantid | — | site pool **Göbekli Tepe**, 4 |

### The Estate

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **The Haunted House · The Hall** | ghoul | — | site pool **The Haunted House**, 1 |
| **The Haunted House · Upstairs** | ghost | — | site pool **The Haunted House**, 2 |
| **The Haunted House · The Attic** | — (no fixed NPCs) | — | site pool **The Haunted House**, 1 |
| **The Haunted House · The Nursery** | priest | — | site pool **The Haunted House**, 1 |
| **The Haunted House · The Cellar** | vampire | — | site pool **The Haunted House**, 2 |
| **The Estate** · The Corn Fields | scarecrow ×3, mothman, skinwalker† | — | site pool **Skinwalker Ranch**, 4 |
| ↳ The Lake | loch ness monster | — |  |
| ↳ The Ranch | cowboy ×2, conspiracy theorist, goatman, grey | — |  |
| **The Ranch Road** | — (no fixed NPCs) | — | site pool **Skinwalker Ranch**, 4 |
| **The Haunted House** · The Haunted House + Graveyard | eagleman, ghost, ghoul, jack o lantern, necromancer, undead, vampire, werewolf, zombie | — | site pool **Skinwalker Ranch**, 4 |

### The Woods

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **The Clearing** · The Clearing | hippie, scarecrow, tree person, werewolf | — | site pool **Fairy Forest**, 4 |
| ↳ Dead Man's Cave | flesheater, ghoul, mothman, swamp monster | — |  |
| **The Redwood Trail** · The Redwood Trail | bigfoot, ki fighter, krampus, shaman, skinwalker†, yeti | — | site pool **Fairy Forest**, 4 |
| **The Ritual Ground** · The Ritual Ground | cult leader, fortune teller, goatman | — | site pool **Fairy Forest**, 4 |
| **The Trail · The Snowline To The Tree Line** | — (no fixed NPCs) | — | site pool **Fairy Forest**, 4 |
| **The Trail · West To Camelot** | — (no fixed NPCs) | — | site pool **Fairy Forest**, 4 |
| **The Valley Road** | — (no fixed NPCs) | — | site pool **Fairy Forest**, 4 |

### Camelot Kingdom

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **Camelot Castle** | knight ×5, swordfighter ×2, wizard ×2, ghost, king arthur, skeleton | — | table **CASTLE**, 4 |
| **Camelot Kingdom** · The Castle | knight ×2, robinhood, swordfighter | — | table **KINGDOM**, 4 |
| ↳ The Village | knight ×2 | krampus, yeti |  |
| **The Snowy Pines** · The Snowy Pines | — | bigfoot, ice queen | table **KINGDOM**, 4 |
| **The Looking-Glass Garden** · The Looking-Glass Garden | dreameater, fairy, gnome, mushroom girl, rabbit | chess piece ×2, catgirl, ice queen | table **KINGDOM**, 4 |
| **The Fairy Forest** · The Fairy Forest | fairy, gnome, mushroom girl, unicorn | — | table **KINGDOM**, 4 |
| **The Forest** · The Forest | knight, rabbit, robinhood, wizard | tree person | table **KINGDOM**, 4 |
| **Camelot · The Castle In The Sky** | dragon, knight | fairy | table **CASTLE**, 4 |
| **The Trail · The Pines To The Ski Lodge** | — (no fixed NPCs) | — | site pool **Camelot**, 4 |
| **The Stone Path** | — (no fixed NPCs) | — | site pool **Camelot**, 4 |
| **The Old Road** | — (no fixed NPCs) | — | site pool **Camelot**, 4 |

### The Mountains

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **The Ski Lodge · The Snowy Pass** · The Snowy Pass | yeti ×3 | — | site pool **Mount Shasta**, 4 |
| **Mount Olympus** · Mount Olympus | angel, chosen one†, cyclops†, giant, minotaur, nephilim, occulus, orb of light, seraphim, unicorn, valkraye, watcher† | — | site pool **Mount Shasta**, 4 |
| **Mount Shasta** · Mount Shasta | hippie ×3, nordic ×2, yeti ×2, bigfoot, gnome, ki fighter, shaman, tree person | — | site pool **Mount Shasta**, 4 |
| **The North Pole** · The North Pole village | gnome, ice queen, krampus, santa clause, yeti | — | table **NORTH POLE** (spots keep own race), 5 |
| **The Pilgrim Way** | — (no fixed NPCs) | — | site pool **Mount Shasta**, 4 |
| **The Polar Trail** | — (no fixed NPCs) | — | site pool **Mount Shasta**, 4 |

### Antarctica

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **Antarctica** · The Shelf Ice | kaiju | — | site pool **Antarctica**, 4 |
| ↳ The Hull in the Ice | men in black, nordic, yeti | — |  |
| ↳ The Polar Openings | men in black | — |  |
| ↳ The Station | men in black ×4 | — |  |
| ↳ The Ice Wall | yeti ×2, nordic | — |  |

### The Cavern

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **The Cavern** · Hollow Earth | dinosaur ×2, antperson, giant, gnome, goblin, reptilian | — | site pool **Hollow Earth**, 4 |
| ↳ The Cavern | gnome ×5, ghoul ×3, reptilian ×3, goblin ×2, antperson, men in black | — |  |
| **Agartha** · Agartha | crystal guardian ×2, loch ness monster, machine elves, nordic | — | site pool **Hollow Earth**, 4 |
| **The West Tunnel** | — (no fixed NPCs) | — | site pool **Hollow Earth**, 4 |
| **The Long Tunnel** | — (no fixed NPCs) | — | site pool **Hollow Earth**, 4 |
| **The Tunnel-Way Tunnel** | — (no fixed NPCs) | — | site pool **Hollow Earth**, 4 |

### Heaven + Hell + Vatican

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **Hell** · The Rim | fallen angel, skeleton, succubus | — | site pool **Hell**, 4 |
| ↳ The Descent | halfdemon, undead | — |  |
| ↳ The Bowl | demon, demon prince†, demon princess, ghoul, skeleton | — |  |
| ↳ The Walkways | demon, fallen angel, overlord | — |  |
| **The Catacombs** · The Catacombs | priest ×2, ghoul, vampire | — | site pool **Vatican City**, 4 |
| **The Vatican** · The Basilica | priest ×3, seraphim | — | site pool **Vatican City**, 4 |
| ↳ The Square | gargoyle ×2, priest ×2 | — |  |
| ↳ The Palace | priest ×3, watcher† | — |  |
| ↳ The Cloister | priest ×2, gargoyle | — |  |
| ↳ The Gardens | gargoyle, priest | — |  |
| ↳ The Colosseum | cowboy ×3, priest ×3, banker ×2, fortune teller ×2, influencer ×2, knight ×2, pirate ×2, politician ×2, tech ceo ×2, wizard ×2, luchador, minotaur, pope, quarterback, referee, ringmaster, swordfighter, televangelist | — |  |
| **Heaven** · The Stairway | angel, chosen one†, seraphim | — | site pool **Heaven**, 4 |
| ↳ The Gate | angel, seraphim, valkraye | — |  |
| ↳ The Cloud Fields | angel, seraphim, valkraye | — |  |
| ↳ The City | angel, seraphim | — |  |
| **The River Road** | — (no fixed NPCs) | — | site pool **Heaven**, 4 |

### Outer Space

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **The Spaceship · The Airlock** | grey | — | site pool **Spaceship**, 1 |
| **The Spaceship · The Cargo Hold** | black goo, symbiote | — | site pool **Spaceship**, 2 |
| **The Spaceship · The Bridge** | ai | — | site pool **Spaceship**, 2 |
| **Outer Space** · The Mare | grey ×2, men in black ×2, barbarella | — | site pool **Moon**, 4 |
| ↳ The Crater | grey, mantid, voidweaver | — |  |
| ↳ The Far Side | grey, men in black | — |  |
| ↳ Cydonia | grey ×2, martian | — |  |
| ↳ The Canyon | droid†, martian | — |  |
| ↳ The Rover Bay | droid†, martian | — |  |
| ↳ The Hexagon | grey ×2, black goo, watcher† | — |  |
| ↳ The Ring Shard | android†, grey | — |  |
| ↳ The Drop | cosmic wraith, shadow entity | — |  |
| ↳ The Accretion Rim | cosmic wraith, occulus, watcher† | — |  |
| **Spaceship · The Deck** | android†, grey | — | site pool **Spaceship**, 4 |

### The Astral Realm

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **The Astral Realm** · The Library of Unthought Things | fortune teller, mad scientist, telepath, watcher† | — | site pool **The Looking-Glass**, 4 |
| ↳ The Nightmare | dreameater, ghoul, shadow entity, succubus | — |  |
| ↳ The Sea of Possibility | chess piece ×2, glitch ×2, telepath ×2, voidweaver ×2, watcher† ×2, cosmic wraith, dreameater, fairy, fortune teller, machine elves, mushroom girl, occulus, orb of light, rabbit, siren | — |  |
| **The Astral Realm · The Waiting Room** | telepath, watcher† | — | site pool **The Looking-Glass**, 2 |

### The Internet

| Room · sub-area | Fixed NPCs standing as themselves | Fixed NPCs overridden by the table | Random walkers |
|---|---|---|---|
| **The Internet** · The Server Farm | ai ×2, cyborg, droid†, glitch, mech, robot | — | **none** (empty pool) |
| ↳ Live | catgirl ×2, android†, astronaut, bunny girl, ghost, influencer, knight, ninja, occulus, pirate, popstar, quarterback, robot, skater, super sentai†, wizard | — |  |
| ↳ The Forums | conspiracy theorist, goblin, karate frog, librarian, mime, politician, professor, referee, watcher† | — |  |
| ↳ The Pop-ups | banker, clown, delivery boy, florida man, fortune teller, glitch, mad scientist, magician, police officer, politician, professor, robot, symbiote, tech ceo, televangelist | — |  |
| ↳ The Dark Web | black goo, cursed tv, gangster, ghoul, mantid, men in black, shadow entity, skeleton, spy, voidweaver | — |  |
| ↳ The Feed | clown, delivery boy, florida man, influencer, popstar, skater, tech ceo, televangelist | — |  |
| ↳ The Information Highway | ai, boltzmann brain, glitch, machine elves, robot | — |  |
| ↳ The Motherboard | ai, android†, cyborg, droid†, machine elves, mad scientist, mech, mole man, robot | — |  |
| ↳ The Inbox | banker, delivery boy, droid†, librarian, robot, televangelist | — |  |

### Zones and rooms outside those tables

- **D.O.O.R. HQ building.** Walkers are the player's own unlocked roster, one home room per race per day (`hqRosterHomeOf`), so there is no fixed population to audit. Fixed race NPCs: Room X: watcher†; Control Room: watcher†; Cubicle Floor: politician; Bathroom: conspiracy theorist; Second Floor: robot; Warehouse: android†; Incinerator: demon; Autopsy Room: ghoul; Door Garden: fairy, gnome; Lost and Found: djinn; Subway platform: zombie, skeleton; Fourth Floor: mad scientist; Dream Lab: succubus, mad scientist, dreameater, voidweaver, telepath; Upside-Down Room: ghost. Story cast with a race: Agent Forrest (bigfoot) and Kit (catgirl) in the Main Hall, Sedaniel (honda civic) in the bay.
- **Puzzle dungeons** (`PD_DUNGEONS`, set fights): Turning Crypt: undead ×2, necromancer. Turning Tomb: skeleton ×2. Missing Channel: zombie ×2, gangster. Traveling Door: men_in_black ×2, droid†. Three-Rail Crossing: gangster ×2, marksman. Root That Remembers: goblin ×2, swamp_monster. Two of those ids are written with underscores (`men_in_black`, `swamp_monster`), which do not match the roster ids `men in black` and `swamp monster`.
- **Battle dungeon** (`MD_DUNGEONS.agartha_depths`): enemies reptilian, antperson, skeleton, goatman, annunaki, demon; boss annunaki.
- **Unreachable or special:** The Bermuda Triangle · The Island (no door leads to it), the Training Room and the clash stage have no population.
- **Roads.** Sixteen surface road and trail rooms and three Cavern tunnels have no fixed NPCs. Each draws walkers from the pool or table shown in its zone table.

### The encounter tables (race and weight)

- **CITY** (used by: Disaster City · The Tower Lobby; Disaster City · The Showroom; Disaster City · The Platform; Disaster City; Disaster City · The Mall; Disaster City · Supply Closet): conspiracy theorist 7, antihero 2, bunny girl 2, chef 2, clown 2, firefighter 2, gangster 2, honda civic 2, ki fighter 2, king kong 2, luchador 2, marksman 2, mime 2, police officer 2, popstar 2, professor 2, quarterback 2, ringmaster 2, sidekick 2, superhero 2, swordfighter 2, zombie 2, astronaut 1, cult leader 1, door agent 1, general 1, ghost 1, halfdemon 1, hippie 1, juggernaut 1, knight 1, mad scientist 1, nephilim 1, pirate 1, politician 1, priest 1, time cop 1
- **NORTH POLE** (used by: The North Pole): yeti 7, krampus 2, gnome 2, santa clause 1, ice queen 1
- **CASTLE** (used by: Camelot Castle; Camelot · The Castle In The Sky): dragon 10, king arthur 10, knight 10, robinhood 10, swordfighter 10, cult leader 3, gargoyle 3, ghost 3, ghoul 3, jack o lantern 3, necromancer 3, skeleton 3, undead 3, vampire 3, werewolf 3, wizard 3, bee queen 1, djinn 1, dreameater 1, eagleman 1, giant 1, golem 1, mummy 1, overlord 1, pirate 1, priest 1, rabbit 1
- **KINGDOM** (used by: Camelot Kingdom; The Snowy Pines; The Looking-Glass Garden; The Fairy Forest; The Forest): dragon 10, king arthur 10, knight 10, robinhood 10, swordfighter 10, cult leader 3, gargoyle 3, ghost 3, ghoul 3, jack o lantern 3, necromancer 3, skeleton 3, undead 3, vampire 3, werewolf 3, wizard 3, fairy 3, unicorn 3, gnome 3, mushroom girl 3, bee queen 1, djinn 1, dreameater 1, eagleman 1, giant 1, golem 1, mummy 1, overlord 1, pirate 1, priest 1, rabbit 1
- **DESERT** (used by: The Circus; Western Town; Area 51; Giza; The Badlands Highway; The Desert Highway; The Desert Highway; The Desert Highway; The Desert Highway): annunaki 13, anubis 13, djinn 13, mummy 13, conspiracy theorist 10, catgirl 10, grey 10, reptilian 10, skeleton 10, wizard 10, bee queen 2, crystal guardian 2, dinosaur 2, fallen angel 2, fortune teller 2, giant 2, golem 2, minotaur 2, nephilim 2, shaman 2, deep sea fish 1, dragon 1, kraken 1, loch ness monster 1, martian 1, mech 1, necromancer 1, orb of light 1
- **BEACH** (used by: The Beach; The Bermuda Triangle): deep sea fish 17, jellyfish 17, sharkman 17, atlantean 4, kaiju 4, kraken 4, loch ness monster 4, mermaid 4, pirate 4, starfish 4, dinosaur 2
- **VOLCANO** (used by: The Volcano Island): deep sea fish 17, jellyfish 17, sharkman 17, dinosaur 17, atlantean 4, kaiju 4, kraken 4, loch ness monster 4, mermaid 4, pirate 4, starfish 4
- **COVE** (used by: Pirates' Cove): pirate 17, sharkman 4, mermaid 4, kraken 2
- **FROZEN SEA** (used by: The Frozen Sea): yeti 17, deep sea fish 4, kraken 2
- **DEEP** (used by: The Deep · Atlantis + The Trench; The Deep · The Sea Floor; Atlantis · The Temple Of The Deep): atlantean 8, deep sea fish 8, kraken 8, mermaid 8, sharkman 8, starfish 8, jellyfish 2, kaiju 2, loch ness monster 2, pirate 2, nordic 1, orb of light 1, reptilian 1

### The site pools used by rooms without a table

Each walker draw picks a tier first (50 / 30 / 20), then a race evenly inside the tier. The 20% tier is left as a count because it is long and rarely seen.

- **The Haunted House** (site tags: gothic, clandestine; rooms: The Haunted House · The Hall; The Haunted House · Upstairs; The Haunted House · The Attic; The Haunted House · The Nursery; The Haunted House · The Cellar)
  - native (50% of draws): jack o lantern, eagleman, undead, ghost, werewolf, vampire, haunted doll, cursed tv, ghoul
  - biome-tagged (30%): cult leader, bligblog, conspiracy theorist, door agent, gargoyle, general, grey, halfdemon, mantid, marksman, necromancer, ninja, nordic, politician, professor, reptilian, spy, wizard
  - neighbours + sector (20%): 21 more races
- **Hollow Earth** (site tags: inner_earth, forest; rooms: The Cavern; Agartha; The West Tunnel; The Long Tunnel; The Tunnel-Way Tunnel)
  - native (50% of draws): goblin, reptilian, antperson, mole man, dinosaur
  - biome-tagged (30%): gnome, bee queen, bigfoot, chess piece, cicada brood, crystal guardian, cult leader, fairy, goatman, hippie, king kong, krampus, mothman, mushroom girl, rabbit, robinhood, shadow entity, shaman, swamp monster, tree person, unicorn, wendigo, werewolf
  - neighbours + sector (20%): 18 more races
- **Spaceship** (site tags: space, astral; rooms: The Spaceship · The Airlock; The Spaceship · The Cargo Hold; The Spaceship · The Bridge; Spaceship · The Deck)
  - native (50% of draws): astronaut, symbiote
  - biome-tagged (30%): boltzmann brain, cosmic wraith, barbarella, black goo, bligblog, chess piece, dreameater, fairy, fortune teller, glitch, grey, machine elves, mantid, martian, mushroom girl, nordic, occulus, orb of light, rabbit, shadow entity, succubus, telepath, virus, voidweaver
  - neighbours + sector (20%): 8 more races
- **The Flying Dutchman** (site tags: deep_sea, gothic; rooms: The Flying Dutchman · The Gun Deck; The Flying Dutchman · The Captain’s Cabin; The Flying Dutchman · The Hold; The Flying Dutchman · The Main Deck)
  - native (50% of draws): pirate
  - biome-tagged (30%): atlantean, cult leader, cursed tv, deep sea fish, gargoyle, ghost, ghoul, haunted doll, jack o lantern, jellyfish, kaiju, kraken, loch ness monster, mermaid, necromancer, sharkman, siren, starfish, undead, vampire, werewolf, wizard
  - neighbours + sector (20%): 27 more races
- **Antarctica** (site tags: polar, deep_sea; rooms: Antarctica)
  - native (50% of draws): nordic, kaiju, yeti
  - biome-tagged (30%): loch ness monster, atlantean, deep sea fish, ice queen, jellyfish, kraken, krampus, mermaid, pirate, santa clause, sharkman, siren, starfish, wendigo
  - neighbours + sector (20%): 10 more races
- **Mount Shasta** (site tags: forest, inner_earth; rooms: The Ski Lodge · The Snowy Pass; Mount Olympus; Mount Shasta; The Pilgrim Way; The Polar Trail)
  - native (50% of draws): shaman, bigfoot, wendigo, ki fighter
  - biome-tagged (30%): gnome, goblin, antperson, bee queen, chess piece, cicada brood, crystal guardian, cult leader, dinosaur, fairy, goatman, hippie, king kong, krampus, mole man, mothman, mushroom girl, rabbit, reptilian, robinhood, shadow entity, swamp monster, tree person, unicorn, werewolf
  - neighbours + sector (20%): 17 more races
- **Fairy Forest** (site tags: forest, astral; rooms: The Clearing; The Redwood Trail; The Ritual Ground; The Trail · The Snowline To The Tree Line; The Trail · West To Camelot; The Valley Road)
  - native (50% of draws): mushroom girl, tree person, krampus, swamp monster, unicorn, fairy, gnome
  - biome-tagged (30%): chess piece, rabbit, shadow entity, bee queen, bigfoot, boltzmann brain, cicada brood, cosmic wraith, cult leader, dreameater, fortune teller, glitch, goatman, goblin, hippie, king kong, machine elves, mothman, occulus, orb of light, robinhood, shaman, succubus, telepath, virus, voidweaver, wendigo, werewolf
  - neighbours + sector (20%): 21 more races
- **Hell** (site tags: infernal; rooms: Hell)
  - native (50% of draws): demon, succubus, skeleton, demon princess, fallen angel, halfdemon, undead
  - biome-tagged (30%): ghoul, necromancer, overlord
  - neighbours + sector (20%): 20 more races
- **Vatican City** (site tags: holy_city, gothic, divine; rooms: The Catacombs; The Vatican)
  - native (50% of draws): priest, gargoyle, televangelist, pope
  - biome-tagged (30%): ghost, vampire, angel, cult leader, cursed tv, ghoul, giant, haunted doll, jack o lantern, minotaur, necromancer, nephilim, occulus, orb of light, quetzalcoatl, seraphim, undead, unicorn, valkraye, werewolf, wizard
  - neighbours + sector (20%): 27 more races
- **Heaven** (site tags: divine; rooms: Heaven; The River Road)
  - native (50% of draws): angel, seraphim, valkraye
  - biome-tagged (30%): giant, minotaur, nephilim, occulus, orb of light, quetzalcoatl, unicorn
  - neighbours + sector (20%): 22 more races
- **Area 51** (site tags: clandestine, space, desert; rooms: Area 51 · Hangar 18; The Delta Causeway)
  - native (50% of draws): cowboy, spy, sheriff, bligblog
  - biome-tagged (30%): grey, mantid, nordic, annunaki, anubis, astronaut, barbarella, black goo, boltzmann brain, conspiracy theorist, cosmic wraith, cult leader, djinn, door agent, eagleman, fortune teller, general, halfdemon, marksman, martian, mummy, ninja, politician, professor, reptilian, symbiote
  - neighbours + sector (20%): 24 more races
- **Pyramids of Giza** (site tags: desert, ancient; rooms: Giza · Inside The Great Pyramid)
  - native (50% of draws): mummy, annunaki, djinn, anubis
  - biome-tagged (30%): atlantean, bee queen, cicada brood, crystal guardian, dinosaur, fallen angel, fortune teller, giant, golem, hippie, minotaur, nephilim, quetzalcoatl, shaman, sheriff
  - neighbours + sector (20%): 23 more races
- **D.U.M.B.** (site tags: underground_base, clandestine; rooms: The D.U.M.B.)
  - native (50% of draws): mad scientist, telepath, door agent, professor, flesheater, juggernaut
  - biome-tagged (30%): spy, ai, black goo, bligblog, catgirl, conspiracy theorist, cult leader, eagleman, general, grey, halfdemon, karate frog, mantid, marksman, mole man, ninja, nordic, politician, reptilian, samurai slug, sewer gator, symbiote
  - neighbours + sector (20%): 16 more races
- **Göbekli Tepe** (site tags: ancient, desert; rooms: Leylines · The Line; Leylines · Babel + Technoticlan; Stonehenge; Bug Colony · The Hive; Bug Colony · The Ant Nest; Bug Colony)
  - native (50% of draws): bee queen, giant, nephilim, cicada brood
  - biome-tagged (30%): annunaki, anubis, mummy, atlantean, crystal guardian, dinosaur, djinn, fallen angel, fortune teller, golem, hippie, minotaur, quetzalcoatl, shaman, sheriff
  - neighbours + sector (20%): 23 more races
- **The Looking-Glass** (site tags: astral, arthurian; rooms: The Astral Realm; The Astral Realm · The Waiting Room)
  - native (50% of draws): rabbit, chess piece, dreameater, occulus
  - biome-tagged (30%): boltzmann brain, cosmic wraith, dragon, fairy, fortune teller, glitch, king arthur, knight, machine elves, mushroom girl, orb of light, robinhood, shadow entity, skeleton, succubus, telepath, virus, voidweaver, wizard
  - neighbours + sector (20%): 23 more races
- **Moon** (site tags: space; rooms: Outer Space)
  - native (50% of draws): mantid, voidweaver, barbarella
  - biome-tagged (30%): astronaut, black goo, bligblog, boltzmann brain, cosmic wraith, grey, martian, nordic, symbiote
  - neighbours + sector (20%): 3 more races
- **Skinwalker Ranch** (site tags: ranch, clandestine; rooms: The Estate; The Ranch Road; The Haunted House)
  - native (50% of draws): mothman, scarecrow, goatman
  - biome-tagged (30%): conspiracy theorist, eagleman, bligblog, cowboy, cult leader, door agent, general, grey, halfdemon, jack o lantern, mantid, marksman, ninja, nordic, politician, professor, reptilian, sheriff, spy
  - neighbours + sector (20%): 14 more races
- **Camelot** (site tags: arthurian, gothic; rooms: The Trail · The Pines To The Ski Lodge; The Stone Path; The Old Road)
  - native (50% of draws): swordfighter, knight, dragon, king arthur, robinhood
  - biome-tagged (30%): wizard, cult leader, cursed tv, gargoyle, ghost, ghoul, haunted doll, jack o lantern, necromancer, skeleton, undead, vampire, werewolf
  - neighbours + sector (20%): 27 more races
- **The Bermuda Triangle** (site tags: deep_sea, tropical; rooms: The Coast Road)
  - native (50% of draws): jellyfish, deep sea fish, sharkman, lifeguard
  - biome-tagged (30%): starfish, atlantean, florida man, kaiju, kraken, loch ness monster, mermaid, pirate, siren
  - neighbours + sector (20%): 14 more races
- **The Sewers** (`HQ_POPULATION_RULES.underworld`, one tier): zombie, ghoul, gangster, conspiracy theorist, skeleton, reptilian, antperson, mad scientist, shadow entity, police officer, swamp monster, undead, flesheater.
- **The Internet**: no pool. `prebuilt_internet` has no `EW_MAP_META` entry, so `hqSiteResidents` returns nothing and the room draws zero walkers.

## 3. Race by zone

Columns: the filed home is `DOOR_TEXT.POINT_OF_ENTRY`. "Fixed spots" counts spots that stand as themselves, by zone. "Encounter tables" and "Native walker pool" list zones where the race is on a table or in the 50% tier. The 30% biome tier is not listed per race because it is accidental by design; it is named in the verdict only when it is all a race has.

| Race | Filed home (POINT_OF_ENTRY) | Fixed spots (standing as itself) | Encounter tables | Native walker pool | City residents | Temper | Verdict |
|---|---|---|---|---|---|---|---|
| pirate | The Flying Dutchman | Dutchman ×3, Divine ×2, Beach ×10, Deep, Internet | City, Camelot, Beach, Deep | Dutchman | Bayside | opportunist | ok |
| swordfighter | Camelot | Divine, Camelot ×3 | City, Camelot | Camelot | Southside | — | ok |
| knight | Camelot | Divine ×2, Camelot ×11, Leylines, Internet | City, Camelot | Camelot | Industrial | — | ok |
| shaman | Mount Shasta | Mountains, Woods, Leylines ×3 | Desert | Mountains | — | — | ok |
| mad scientist | D.U.M.B. | HQ ×2, City, Desert, D.U.M.B. ×5, Sewers, Internet ×2, Astral | City | D.U.M.B., Sewers | University | — | ok; spots overridden in Desert |
| cowboy | Area 51 | Divine ×3, D.U.M.B., Estate ×2 | — | Desert | — | — | ok; spots overridden in Desert |
| men in black | Area 51 | Cavern, Antarctica ×6, Desert, D.U.M.B. ×5, Sewers, Internet, Space ×3 | — | — | Financial | — | ok; spots overridden in Desert |
| telepath | D.U.M.B. | HQ, D.U.M.B. ×4, Astral ×4 | — | D.U.M.B. | University | — | ok |
| marksman | The Lodge | — | City | — | Industrial | — | filed home has no live zone; spots overridden in Desert |
| priest | Vatican City | Estate, Divine ×16 | City, Camelot | Divine | Southside | — | ok |
| wizard | Stonehenge | Divine ×2, Camelot ×3, Desert, Internet | Camelot, Desert | — | — | — | **not in filed home** (Leylines) |
| fortune teller | Bohemian Grove | Woods, Divine ×2, Desert, Internet, Astral ×2 | Desert | — | — | — | ok |
| giant | Göbekli Tepe | Cavern, Mountains, Desert, Leylines ×2 | Camelot, Desert | Leylines | — | — | ok |
| fairy | Fairy Forest | HQ, Camelot ×2, Astral | Camelot | Woods | — | coward | ok; spots overridden in Camelot |
| martian | Mars | Space ×3 | Desert | — | — | — | ok |
| nordic | Antarctica | Cavern, Antarctica ×2, Mountains ×2 | Deep | Antarctica | — | — | ok |
| grey | Saturn | Space ×11, Desert ×2, D.U.M.B. ×3, Leylines ×2, Estate | Desert | — | — | — | ok |
| bigfoot | Mount Shasta | Mountains, Woods | — | Mountains | — | territorial | ok; spots overridden in Camelot |
| shadow entity | H-Wing | Internet, Astral, Space | — | Sewers | — | brute | **not in filed home** (HQ) |
| reptilian | Hollow Earth | Cavern ×4, Leylines | Desert, Deep | Cavern, Sewers | University | — | ok |
| ai | Cyberpunk City | Space, D.U.M.B., Sewers, Internet ×4 | — | — | — | — | **not in filed home** (City) |
| robot | Technoticlan | HQ, Internet ×6 | — | — | — | — | **not in filed home** (Leylines) |
| android | Cyberpunk City | HQ, D.U.M.B. ×4, Internet ×2, Space ×2 | — | — | — | — | **not in filed home** (City); no 3D model |
| angel | Heaven | Mountains, Divine ×4 | — | Divine | — | — | ok |
| seraphim | Heaven | Mountains, Divine ×5 | — | Divine | — | — | ok |
| orb of light | Mount Olympus | Mountains, Astral | Desert, Deep | — | — | — | ok |
| demon | Hell | HQ, Divine ×2 | — | Divine | — | — | ok |
| succubus | Hell | HQ, Divine, Astral | — | Divine | — | — | ok |
| skeleton | Hell | HQ, Dutchman, Divine ×2, Camelot, Desert ×4, Sewers ×2, Internet | Camelot, Desert | Divine, Sewers | — | — | ok |
| mech | Technoticlan | Internet ×2 | Desert | — | — | — | **not in filed home** (Leylines) |
| ghost | The Haunted House | HQ, Estate ×2, Dutchman ×2, Camelot, Sewers, Internet | City, Camelot | Estate | Bayside | territorial | ok |
| zombie | Downtown | HQ, City ×4, Sewers ×4, Estate | City | Sewers | University | brute | ok |
| annunaki | Pyramids of Giza | Desert, Leylines ×3 | Desert | Desert | — | — | ok |
| skinwalker | Skinwalker Ranch | Woods, Estate | — | — | — | — | ok; no 3D model |
| werewolf | The Haunted House | Woods, Estate | Camelot | Estate | — | brute | ok |
| gargoyle | Vatican City | Divine ×4 | Camelot | Divine | — | — | ok |
| djinn | Pyramids of Giza | HQ, Desert ×2 | Camelot, Desert | Desert | — | — | ok |
| anubis | Pyramids of Giza | Desert ×4 | Desert | Desert | — | — | ok |
| catgirl | Cyberpunk City | Desert, D.U.M.B., Internet ×2 | Desert | — | — | — | **not in filed home** (City); spots overridden in Camelot |
| mantid | Moon | Internet, Space, Leylines | — | Space | — | — | ok |
| antperson | Hollow Earth | Cavern ×2, Leylines ×4 | — | Cavern, Sewers | — | — | ok |
| mothman | Skinwalker Ranch | Woods, Estate | — | Estate | — | — | ok |
| siren | Atlantis | Dutchman ×2, Astral | — | — | — | — | **not in filed home** (Deep); spots overridden in City, Beach, Deep |
| scarecrow | Skinwalker Ranch | Woods, Estate ×3 | — | Estate | — | — | ok |
| glitch | CERN | D.U.M.B., Internet ×3, Astral ×2 | — | — | — | — | ok |
| machine elves | CERN | Cavern, Internet ×2, Astral | — | — | — | — | **not in filed home** (D.U.M.B.) |
| cyclops | Mount Olympus | Mountains | — | — | — | — | ok; spots overridden in Desert; no 3D model |
| cyborg | Technoticlan | Internet ×2 | — | — | — | — | **not in filed home** (Leylines) |
| demon prince | Hell | Divine | — | — | — | — | ok; no 3D model |
| demon princess | Hell | Divine | — | Divine | — | — | ok |
| dreameater | The Looking-Glass | HQ, Camelot, D.U.M.B., Astral ×2 | Camelot | Astral | — | — | ok |
| fallen angel | Hell | Divine ×2 | Desert | Divine | — | — | ok |
| goatman | Skinwalker Ranch | Woods, Estate | — | Estate | — | — | ok |
| halfdemon | Hell | Divine | City | Divine | Financial | — | ok |
| mermaid | Atlantis | Dutchman, Beach, Deep ×7 | Beach, Deep | — | — | — | ok; spots overridden in City, Desert |
| nephilim | Göbekli Tepe | Mountains | City, Desert | Leylines | Hero Plaza | — | ok |
| vampire | The Haunted House | Estate ×2, Divine | Camelot | Estate | — | — | ok |
| voidweaver | Moon | HQ, Internet, Astral ×2, Space | — | Space | — | — | ok |
| cosmic wraith | The Singularity | Astral, Space ×2 | — | — | — | — | ok |
| superhero | Downtown | City | City | — | Hero Plaza | protector | ok |
| general | The Lodge | Desert, D.U.M.B. | City | — | Financial | — | filed home has no live zone |
| droid | Mars | Internet ×3, Space ×2 | — | — | — | — | ok; no 3D model |
| antihero | Downtown | City | City | — | Hero Plaza | — | ok |
| conspiracy theorist | The Strip | HQ, City, Desert ×2, Leylines ×4, Sewers, Internet, Estate | City, Desert | Sewers | Southside | — | ok |
| overlord | Tower of Babel | Divine | Camelot | — | — | — | **not in filed home** (Leylines) |
| chosen one | Mount Olympus | Mountains, Divine | — | — | — | — | ok; no 3D model |
| politician | The Lodge | HQ, City, Divine ×2, D.U.M.B. ×2, Sewers, Internet ×2 | City | — | Financial, Civic Center | opportunist | filed home has no live zone |
| atlantean | Atlantis | Deep ×9 | Beach, Deep | — | — | — | ok |
| dinosaur | Hollow Earth | Cavern ×2, Beach ×4 | Desert, Beach | Cavern | — | — | ok; spots overridden in City |
| dragon | Camelot | Camelot | Camelot, Desert | Camelot | — | — | ok |
| ghoul | The Haunted House | HQ, Estate ×2, Cavern ×3, Woods, Divine ×2, Sewers ×2, Internet, Astral | Camelot | Estate, Sewers | — | brute | ok |
| gnome | Fairy Forest | HQ, Cavern ×6, Mountains ×2, Camelot ×2 | Mountains, Camelot | Woods | — | coward | ok; spots overridden in Desert |
| kaiju | Antarctica | Antarctica, Sewers, Deep | Beach, Deep | Antarctica | — | — | ok |
| kraken | Atlantis | Deep | Desert, Beach, Deep | — | — | — | ok |
| loch ness monster | Agartha | Cavern, Estate | Desert, Beach, Deep | — | — | — | ok |
| yeti | Antarctica | Antarctica ×3, Mountains ×6, Woods, Beach ×2 | Mountains, Beach | Antarctica | — | territorial | ok; spots overridden in Camelot |
| barbarella | Moon | Space | — | Space | — | — | ok |
| black goo | Saturn | Space ×2, Sewers ×2, Internet | — | — | — | — | ok |
| golem | Tower of Babel | Leylines | Camelot, Desert | — | — | — | ok |
| honda civic | The Strip | — | City | — | Financial | — | ok |
| ice queen | North Pole | Mountains | Mountains | — | — | — | ok; spots overridden in Camelot |
| juggernaut | D.U.M.B. | D.U.M.B. | City | D.U.M.B. | Sports + Culture | — | ok |
| ki fighter | Mount Shasta | Mountains, Woods | City | Mountains | Southside | — | ok |
| king arthur | Camelot | Camelot | Camelot | Camelot | — | — | ok |
| king kong | Downtown | City | City | — | Sports + Culture | territorial | ok |
| minotaur | Mount Olympus | Mountains, Divine | Desert | — | — | territorial | ok |
| necromancer | Stonehenge | Estate | Camelot, Desert | — | — | — | **not in filed home** (Leylines) |
| occulus | The Looking-Glass | Mountains, Internet, Astral, Space | — | Astral | — | — | ok |
| quarterback | Football Stadium | Divine, Internet | City | — | Sports + Culture | — | ok |
| robinhood | Camelot | Camelot ×2 | Camelot | Camelot | — | — | ok |
| santa clause | North Pole | Mountains | Mountains | — | — | — | ok |
| super sentai | Technoticlan | Internet | — | — | Hero Plaza | — | **not in filed home** (Leylines); no 3D model |
| symbiote | Spaceship | Space, Internet | — | Space | — | — | ok |
| valkraye | Heaven | Mountains, Divine ×2 | — | Divine | — | — | ok |
| watcher | The Singularity | HQ ×2, Mountains, Divine, Leylines, Internet, Astral ×4, Space ×2 | — | — | — | — | ok; no 3D model |
| gangster | Cyberpunk City | Sewers ×3, Internet | City | Sewers | Southside, Industrial | opportunist | ok |
| door agent | D.U.M.B. | City ×6 | City | D.U.M.B. | — | — | ok |
| police officer | Downtown | Internet | City | Sewers | Financial, University, Hero Plaza, Entertainment, Bayside, Sports + Culture, Industrial, Civic Center | guard | ok |
| jellyfish | The Bermuda Triangle | Beach, Deep | Beach, Deep | Beach | — | — | ok |
| cult leader | Bohemian Grove | Woods | City, Camelot | — | Southside | — | ok |
| popstar | Football Stadium | Internet ×2 | City | — | Bayside | civilian | ok |
| starfish | Atlantis | Beach ×2, Deep ×4 | Beach, Deep | — | — | — | ok |
| ringmaster | The Carnival | Divine | City | — | Entertainment | — | **not in filed home** (Desert); spots overridden in Desert |
| bee queen | Göbekli Tepe | Leylines ×3 | Camelot, Desert | Leylines | — | — | ok |
| professor | D.U.M.B. | D.U.M.B. ×2, Internet ×2 | City | D.U.M.B. | University | civilian | ok |
| deep sea fish | The Bermuda Triangle | Beach, Deep ×3 | Desert, Beach, Deep | Beach | — | — | ok |
| clown | The Carnival | Internet ×2 | City | — | Entertainment | — | **not in filed home** (Desert); spots overridden in Desert |
| bunny girl | The Strip | Internet | City | — | Entertainment | civilian | ok; spots overridden in Desert |
| sharkman | The Bermuda Triangle | Beach ×2, Deep | Beach, Deep | Beach | — | — | ok |
| crystal guardian | Agartha | Cavern ×2 | Desert | — | — | — | ok |
| jack o lantern | The Haunted House | Estate | Camelot | Estate | — | — | ok |
| sidekick | Downtown | — | City | — | Hero Plaza | protector | ok |
| mushroom girl | Fairy Forest | Camelot ×2, Astral | Camelot | Woods | — | — | ok |
| tree person | Fairy Forest | Mountains, Woods | — | Woods | — | — | ok; spots overridden in Camelot |
| sheriff | Area 51 | — | — | Desert | — | guard | ok; spots overridden in Desert |
| astronaut | Spaceship | Internet | City | Space | Industrial | — | ok |
| krampus | Fairy Forest | Mountains, Woods | Mountains | Woods | — | — | ok; spots overridden in Camelot |
| rabbit | The Looking-Glass | Camelot ×2, Astral | Camelot | Astral | — | coward | ok |
| luchador | The Strip | Divine | City | — | Sports + Culture | — | ok; spots overridden in Desert |
| firefighter | Downtown | — | City | — | Southside, Sports + Culture, Industrial, Civic Center | protector | ok |
| goblin | Hollow Earth | Cavern ×3, Internet | — | Cavern | Financial | opportunist | ok |
| hippie | Stonehenge | Mountains ×3, Woods, City ×2, Leylines ×2 | City | — | Bayside | civilian | ok; spots overridden in Beach |
| time cop | — (none) | — | City | — | Financial, Civic Center | guard | ok |
| mummy | Pyramids of Giza | Desert ×4 | Camelot, Desert | Desert | — | — | ok |
| swamp monster | Fairy Forest | Woods, Sewers ×2 | — | Woods, Sewers | — | — | ok |
| undead | The Haunted House | Divine, Estate | Camelot | Estate, Divine, Sewers | — | — | ok |
| chef | The Strip | City | City | — | Southside, Financial, University, Hero Plaza, Entertainment, Bayside, Sports + Culture, Industrial, Civic Center | civilian | ok; spots overridden in Desert, Beach |
| eagleman | The Haunted House | Estate | Camelot | Estate | Hero Plaza | protector | ok |
| flesheater | D.U.M.B. | Woods, D.U.M.B., Sewers | — | D.U.M.B., Sewers | — | brute | ok |
| mime | Downtown | Internet | City | — | Entertainment | civilian | ok; spots overridden in Desert |
| bligblog | Area 51 | — | — | Desert | — | — | ok; spots overridden in Desert |
| unicorn | Fairy Forest | Mountains, Camelot | Camelot | Woods | — | coward | ok |
| spy | Area 51 | Internet | — | Desert | Financial | — | ok; spots overridden in Desert |
| chess piece | The Looking-Glass | Astral ×2 | — | Astral | — | — | ok; spots overridden in Camelot |
| banker | Downtown | Divine ×2, Internet ×2 | — | — | Financial | civilian | ok |
| sewer gator | The Sewers | — | — | — | — | territorial | **stray only** (30%-tier biome draws in D.U.M.B.) |
| skater | Downtown | Internet ×2 | — | — | Bayside | civilian | ok |
| tech ceo | Downtown | Divine ×2, Internet ×2 | — | — | Financial | opportunist | ok |
| magician | The Strip | Internet | — | — | Entertainment | — | ok |
| mole man | Hollow Earth | Internet | — | Cavern | — | — | ok |
| quetzalcoatl | Technoticlan | — | — | — | — | — | **stray only** (30%-tier biome draws in Divine, Desert, Leylines) |
| lifeguard | The Bermuda Triangle | — | — | Beach | Bayside | guard | ok |
| delivery boy | Downtown | Internet ×3 | — | — | Hero Plaza, Sports + Culture, Industrial | civilian | ok |
| librarian | Downtown | Internet ×2 | — | — | University | civilian | ok |
| televangelist | Vatican City | Divine, Internet ×3 | — | Divine | — | opportunist | ok |
| influencer | Downtown | Divine ×2, Internet ×2 | — | — | Entertainment | civilian | ok |
| referee | Football Stadium | Divine, Internet | — | — | Sports + Culture | — | ok |
| florida man | Downtown | Internet ×2 | — | — | Bayside | opportunist | ok |
| boltzmann brain | The Singularity | Internet | — | — | — | — | **not in filed home** (Space) |
| wendigo | Mount Shasta | — | — | Mountains | — | brute | ok |
| karate frog | The Sewers | Internet | — | — | — | — | **not in filed home** (Sewers) |
| samurai slug | The Sewers | — | — | — | — | — | **stray only** (30%-tier biome draws in D.U.M.B.) |
| cicada brood | Göbekli Tepe | — | — | Leylines | — | — | ok |
| haunted doll | The Haunted House | — | — | Estate | — | — | ok |
| ninja | Downtown | Internet | — | — | Hero Plaza | — | ok |
| pope | Vatican City | Divine | — | Divine | — | — | ok |
| cursed tv | The Haunted House | Internet | — | Estate | Southside | — | ok |
| virus | The Internet | — | — | — | — | — | **stray only** (30%-tier biome draws in Space, Woods, Astral) |
| streamer | The Internet | — | — | — | — | — | **NOWHERE** |
| vtuber | The Internet | — | — | — | — | — | **NOWHERE**; no 3D model |

### Races that appear nowhere

| Race | Why |
|---|---|
| streamer | Filed at "The Internet", which is not a site label. No fixed spot, no table, no resident row. Its tags (neon_city, urban) only feed city rooms, and every city room has a table that excludes it. |
| vtuber† | Same as streamer, and it has no 3D model. |

### Races that appear only as accidental strays

| Race | Intended home (file / comment) | What happens |
|---|---|---|
| virus | The Internet's quarantine | No spot. The `astral` tag puts it in the 30% tier of the Spaceship, the Woods and the Astral Realm. A symbiote stands in The Quarantine instead. |
| sewer gator | The Sewers | Filed at "The Sewers" (not a site label) and missing from the `underworld` list. The `underground_base` tag makes it a 30% stray in the D.U.M.B. |
| samurai slug | The Sewers | Same as sewer gator. |
| quetzalcoatl | Leylines, Technoticlan | Technoticlan has no room of its own. 30% stray in Heaven, the Vatican, the Great Pyramid and every Leylines room. |

Close to that: **karate frog** has one fixed spot (the Internet's Off-Topic forum) and is otherwise a D.U.M.B. stray. **bligblog**, **sheriff**, **spy**: their only fixed spots are overridden, so they exist only as native walkers in Hangar 18 and on the Delta Causeway. **wendigo**, **cicada brood**, **haunted doll**, **lifeguard** (outside the city) and **mole man** (outside the Internet) exist only as native walkers with no fixed spot.

### Where the filed or commented home disagrees with reality

| Race | Home per `POINT_OF_ENTRY` / `EW_RACE_BIOMES` comment | Where it really is |
|---|---|---|
| wizard | Stonehenge | Vatican Colosseum, Camelot, the Circus, the Internet; weight 10 on the DESERT table. Not at Stonehenge. |
| necromancer | Stonehenge | Estate crypt, Camelot and Desert tables. Not at Stonehenge. |
| robot, mech, cyborg, super sentai† | Technoticlan | Only in the Internet (robot also in HQ, super sentai† a Hero Plaza resident). Technoticlan's three fixed NPCs are annunaki ×2 and reptilian. |
| overlord | Tower of Babel | Hell's High Platforms, plus weight 1 on the Camelot tables. Not at Babel. |
| ai, android†, catgirl | Cyberpunk City (retired into Disaster City) | None of them is in Disaster City. ai: Spaceship, D.U.M.B., Sewers, Internet. catgirl: the Circus, D.U.M.B., Internet. |
| machine elves | CERN (now a D.U.M.B. district) | Agartha, the Internet, the Astral Realm. Not in the D.U.M.B. |
| siren | Atlantis | Her Atlantis and Beach spots are all overridden (not on the DEEP or BEACH tables). She stands only on the Flying Dutchman and in the Astral sea. |
| shadow entity | H-Wing (not a site label) | Sewers list, Internet, Astral, Space. |
| clown, ringmaster | The Carnival (not a site label; the room became The Circus) | Their Circus spots are overridden. They live in Entertainment and on the CITY table. |
| boltzmann brain | Outer Space, the Singularity | One spot on the Internet's highway. |
| karate frog | The Sewers | The Internet. |
| lifeguard | The Beach, Bayside | Bayside only. The Beach's two Lifeguard Hut spots are `homosapien` and get re-raced from the BEACH table. |
| unicorn | The Fairy Forest; Heaven | Camelot's Fairy Forest and Olympus. In Heaven only as a 30% stray. |
| chess piece | The Looking-Glass | Astral Realm yes. Both Looking-Glass Garden spots are overridden. |
| krampus | filed Fairy Forest, comment "The Woods" | A 50%-tier native of the Woods all year, plus the North Pole. |
| loch ness monster | filed Agartha | Agartha and the Estate lake as fixed spots; also on the DESERT, BEACH and DEEP tables. |
| kaiju | filed Antarctica | A third of Antarctica's native draws, plus the Sewers' Sludge Pit, the Trench, and the BEACH and DEEP tables. |
| loch ness monster, kraken, deep sea fish, dragon | sea / Camelot | All four are on the DESERT table. |
| time cop | no file at all | Works as a city resident (Time Bureau). |
| eagleman | The Haunted House | A gazebo beside the graveyard, and Hero Plaza's Superhero Tower. |

## 4. Findings

### 4.1 Rule side effects (these cause most of the bad placements)

**F1. Borrowed encounter tables overwrite the cast of the rooms that borrow them.** Lines 93446–93455 point nine Desert rooms at the Giza plateau table and four Camelot woods at the Kingdom table. Because `hqSpotRaces` re-races every fixed NPC not on the table:

- The Circus loses mime, chef, luchador, bunny girl, clown ×2, cyclops†, ringmaster, mermaid and gnome (10 of 14 spots). What stands and walks there instead is drawn from annunaki, anubis, djinn, mummy, grey, reptilian, skeleton, wizard, catgirl, conspiracy theorist.
- Western Town loses its sheriff and both cowboys. Only the Boot Hill skeleton survives.
- Area 51 loses all three Men in Black, both marksmen, the spy, the bligblog and the mad scientist. Only one grey survives. Mummies and djinn guard the gate.
- The Snowy Pines lose bigfoot and ice queen. The Looking-Glass Garden loses both chess pieces, the catgirl and the ice queen. The Forest loses its tree person. Camelot village loses a krampus and a yeti.
- King Arthur and dragons (weight 10 each) are common walkers in the Fairy Forest and the Looking-Glass Garden.

The tables were baked from the AREA UNITS window on 2026-10-31, before the Circus (11-15) and the one-world move (11-17) attached more rooms to them, so this looks like a side effect, not a choice (*inferred*).

**F2. The Beach has the same problem with a different cause.** Eleven of its 23 fixed spots are `homosapien`, which the Spawn Rules comment says "is no race any more". All eleven, plus the chef, both hippies and the siren, are re-raced from the BEACH table, whose three heavy entries are deep sea fish, jellyfish and sharkman (17 each). The boardwalk, the Lifeguard Hut and the pier are staffed by anglerfish. Four more `homosapien` spots on the city's own beach strip are re-raced from the CITY table.

**F3. Merged rooms draw their parent site's people.**

| Room | Walkers actually come from | Its own filed natives |
|---|---|---|
| Mount Olympus | Mount Shasta: shaman, bigfoot, wendigo, ki fighter | orb of light, minotaur (fixed spots only) |
| Stonehenge | Göbekli Tepe: bee queen, giant, nephilim, cicada brood | wizard, hippie, necromancer |
| Babel + Technoticlan | Göbekli Tepe | overlord, golem; robot, mech, cyborg, quetzalcoatl |
| The Haunted House grounds and graveyard | Skinwalker Ranch: mothman, scarecrow, goatman | the nine Haunted House natives (interior rooms only) |
| Agartha | Hollow Earth: goblin, reptilian, antperson, mole man, dinosaur | crystal guardian, loch ness monster |
| Outer Space (Moon, Mars, Saturn, Singularity in one room) | Moon: mantid, voidweaver, barbarella | martian; grey, black goo; cosmic wraith, boltzmann brain |
| The Woods (all six rooms) | Fairy Forest: mushroom girl, tree person, krampus, swamp monster, unicorn, fairy, gnome | the Bohemian Grove's cult leader and fortune teller |
| The Catacombs | Vatican: priest, gargoyle, televangelist, pope | none |

**F4. Four filed homes match no site, and fourteen sites have no room.** "The Internet", "The Sewers", "The Carnival" and "H-Wing" are not `EW_MAP_META` labels, so the nine races filed there (virus, streamer, vtuber†, sewer gator, karate frog, samurai slug, ringmaster, clown, shadow entity) have no native pool anywhere. Time cop has no file. Fourteen sites still own filed natives but have no live room that draws from them: Stonehenge, Cyberpunk City, Football Stadium, Tower of Babel, Mount Olympus, Mars, Technoticlan, Agartha, Bohemian Grove, CERN, The Lodge, The Singularity, Saturn, The Strip.

**F5. The Internet draws no walkers.** It has 86 fixed NPCs and nothing else. Its three own races are not among them.

**F6. Biome tags leak races into places they do not belong.** The 30% tier is "every race that shares any tag with the site". Examples that are live now: santa clause, pirate and mermaid on the Antarctic ice (polar, deep_sea); king kong, robinhood, unicorn and krampus underground in the Cavern and the tunnels (the Hollow Earth site is tagged forest); fairy, rabbit, chess piece, succubus and fortune teller aboard the derelict Spaceship (astral); politician, general, spy, ninja and door agent in the Haunted House and on the ranch (clandestine); sheriff at Göbekli Tepe and inside the Great Pyramid (desert); haunted doll, cursed tv, gargoyle and werewolf on the Flying Dutchman (gothic). Cowboy, spy and sheriff can also walk the Moon in the 20% tier because Area 51 shares the space tag.

**F7. Roads inherit the nearest site whole.** The Coast Road draws jellyfish, deep sea fish and sharkman as its 50% tier, walking a road. The River Road is a Heaven room, so angels, seraphim and valkyries patrol it. The Old Road, Stone Path and the Pines trail draw King Arthur and dragons at 50%.

**F8. One-of-a-kind characters are in random pools.** King Arthur (weight 10 in seven Camelot rooms, 50% tier on three roads), the pope (50% tier in the Vatican and the Catacombs, so several can walk at once), king kong, superhero, antihero and sidekick (weight 2 on the CITY table although `HQ_SPAWN_RULES` marks all four `unique` with a set level), kaiju (a third of Antarctica's native draws; weight 4 on the Beach), kraken (weight 8 in the Deep), santa clause (weight 1 at the North Pole while also standing there; 30% stray in Antarctica), loch ness monster (four tables).

### 4.2 Placements that do not make world sense

| Where | What | Why it reads wrong |
|---|---|---|
| DESERT table | kraken, deep sea fish, loch ness monster (1 each) | Sea monsters on the highway. |
| DESERT table | wizard 10, catgirl 10 across all nine rooms | A wizard and a catgirl are as common at Area 51 as greys. The catgirl makes sense at Giza only (Bastet). |
| CASTLE / KINGDOM tables | bee queen, djinn, mummy, golem, overlord, pirate, eagleman (1 each) | Leftovers from the neighbour tier of the old Camelot site. |
| KINGDOM table in the Fairy Forest and Looking-Glass Garden | ghoul, vampire, werewolf, undead, necromancer, jack o lantern, gargoyle (3 each) | The castle dungeon's gothic set walks the fairy glade. |
| Mount Olympus fixed spots | angel, seraphim, chosen one†, valkraye beside minotaur and cyclops† | Twelve one-off spots mixing three pantheons. Heaven's staff are already in Heaven. |
| The Woods, Redwood Trail | yeti next to bigfoot | Same role twenty metres apart, and the yeti already has twelve spots in snow zones. |
| The Woods walkers | krampus as a year-round native; fairy, unicorn, mushroom girl as the main crowd | The fairy folk now have their own Fairy Forest in Camelot. The Woods' fixed cast is cryptids and cultists. |
| The Estate, the Gazebo | eagleman beside the graveyard | A superhero filed as a Haunted House native. |
| Vatican, the Arena | pope, cowboy ×3, luchador, minotaur, referee, banker ×2, tech ceo ×2 and eleven more races | Reads as a deliberate gladiator show (*inferred*: there is a referee and Gates of Life and Death). The pope's only fixed spot is in the ring, none in the Basilica. |
| The Sewers, Sludge Pit | kaiju | A city-sized monster in a pit. Works only as a hatchling joke. |
| The Sewers, The Crossing | ai | No hardware in the tunnels explains it. |
| D.U.M.B., West Gantry | cowboy | The Western Town is one zone over and has lost its own. |
| Cavern | ghoul ×3, gnome ×6 | Ghouls are already in eight zones. Mole man, filed here, has no fixed spot. |
| Internet, The Capacitors | mole man | His only fixed spot in the game. |
| Antarctica walkers | kaiju at 1 in 6 of all draws | Several kaiju on one ice shelf. |
| Spaceship | grey in the airlock and on the deck, no astronaut fixed | The astronaut is the ship's filed native and has no fixed spot anywhere in Outer Space. |

### 4.3 Overcrowded zones

- **The Internet**: 54 distinct races in one room, the widest mix in the game. Most are jokes that land (banker at The Checkout, karate frog on the forums), but it now holds the only fixed spots of mech, cyborg, boltzmann brain, mole man and karate frog, which leaves their real homes empty.
- **The Desert**: one 28-race table across nine rooms plus a 40-race biome tier in the two rooms without it. Four distinct places (circus, frontier town, air base, pyramids) share one population.
- **Camelot**: 31 races on the Kingdom table, a third of them gothic or stray.
- **The Vatican**: 21 races in one room, 18 of them in the Colosseum district (about 30 spots).
- **Disaster City**: about 60 races, but each has a district, a job and a home, so it reads as crowded on purpose. The only excess is the CITY table drawing unique heroes as walkers.

### 4.4 Thin or empty zones

- **Antarctica**: four races fixed (Men in Black ×6, yeti ×3, nordic ×2, kaiju). The Crevasse (6 plots) has nobody.
- **The Ski Lodge**: 12 lodge plots with no fixed NPC. The three yetis are all on the pass.
- **The Hollywood Hills**: 39 city plots, no residents, no fixed NPCs.
- **Technoticlan**: three fixed NPCs, none of its four filed races.
- **Heaven**: three working races (angel, seraphim, valkraye). The Rim (6 plots) is empty.
- **Cavern tunnels**: three rooms, 62 plots, walkers only.
- **Roads**: sixteen surface road and trail rooms with no fixed NPC. A seventeenth, one Desert Highway segment, has a single conspiracy theorist.
- **The Haunted House attic**: empty, though the cursed tv's comment names it.
- **The Frozen Sea**: yeti only.

### 4.5 Zones missing an obvious race

| Zone | Missing | Evidence |
|---|---|---|
| The Internet | virus, streamer, vtuber† | Filed there; districts "The Quarantine", "The Ring Light", "The Hologram Stage" exist. |
| The Sewers | sewer gator, karate frog, samurai slug, mole man | Comments name the Sewers; none is on the list or placed. |
| The Beach | lifeguard, florida man, skater, chef, hippie | A Lifeguard Hut and a Boardwalk exist; all their spots are re-raced. |
| The Circus | clown, ringmaster, mime, magician, bunny girl | Placed but overridden. |
| Western Town | cowboy, sheriff | Placed but overridden. |
| Area 51 | men in black, bligblog, spy, marksman | Placed but overridden. |
| Technoticlan | quetzalcoatl, robot, mech, cyborg | Filed there. |
| Stonehenge | wizard, necromancer | Filed there. |
| Babel | overlord | Filed there. |
| CERN ring (D.U.M.B.) | machine elves | Filed at CERN. |
| Outer Space | astronaut (Moon), boltzmann brain (Singularity), bligblog | The Lander, the Habitat and a Sound Stage plot exist. |
| Bug Colony | cicada brood | Comment names it. |
| Haunted House | haunted doll (Nursery), cursed tv (Attic) | Comments name the rooms. |
| Snowy Pass | wendigo, krampus | Comment names the pass. |
| Disaster City | catgirl, ai, streamer | Cyberpunk City was retired into the city. |
| Atlantis | siren | Filed there; spots overridden. |

### 4.6 Duplicate-role clusters

- **The walking dead** (zombie, ghoul, undead, skeleton, flesheater, mummy, plus ghost, vampire, necromancer). Ghoul has 13 fixed spots in eight zones and skeleton 12 in seven. They blur together. Suggested lanes: zombie = city streets, mall and campus; ghoul = graves and catacombs; undead = the Estate graveyard and Hell; skeleton = Hell, Boot Hill, the Dutchman and tombs; flesheater = the D.U.M.B. and the deepest sewer; mummy = Giza.
- **Big hairy things** (bigfoot, yeti, wendigo, krampus, king kong, goatman). Yeti has 12 fixed spots in four zones plus two tables; wendigo has none. Split by ground: bigfoot = Shasta and the redwoods; yeti = Antarctica and the Frozen Sea; wendigo = the Snowy Pass and the deep woods; krampus = the North Pole and the Snowy Pines.
- **Aliens** (grey, bligblog, mantid, nordic, martian, reptilian). Grey is the most-placed race in the game (19 fixed spots, weight 10 on the Desert table) while bligblog, filed as "the grey's", has no surviving spot.
- **Machines** (robot, android†, droid†, cyborg, mech, ai). 24 of their 32 fixed spots are in the Internet or the D.U.M.B.; two of the six have no model. Technoticlan, Mars' Rover Bay and the city have almost none that can render.
- **Show people** (clown, mime, ringmaster, magician, bunny girl, luchador). Present twice on paper (Entertainment and the Circus) but only once in practice.
- **Suits** (politician, banker, tech ceo, general, spy, men in black). Fine in the city's Financial and Civic districts. Men in Black have 18 fixed spots, six of them in Antarctica alone.
- **Clergy.** Priest has 17 fixed spots, 16 of them in the Vatican zone.
- **Fairy folk** (fairy, gnome, unicorn, mushroom girl, rabbit). Gnome has 11 fixed spots, six in the Cavern.

## 5. Recommendations

Two kinds of change. The first group fixes rules or tables and puts most of the existing fixed cast back without touching a single spot. The second group is the per-race list.

### 5.1 Table and rule fixes (do these first)

| # | Change | Effect |
|---|---|---|
| R1 | Give the Circus, Western Town and Area 51 their own `HQ_AREA_ENCOUNTERS` rows instead of the Giza alias. | Restores 21 overridden spots. |
| R2 | Give the Snowy Pines, Looking-Glass Garden, Fairy Forest and Forest their own rows instead of the Kingdom alias. | Restores 7 spots; stops King Arthur walking the fairy glade. |
| R3 | Replace the 15 `homosapien` spots (11 on the Beach, 4 on the city beach) with real races, and put shore people on the BEACH table. | The Beach stops being staffed by fish. |
| R4 | Add `sewer gator`, `karate frog`, `samurai slug`, `mole man` to `HQ_POPULATION_RULES.underworld`. | The three sewer races exist. |
| R5 | Give the Internet an encounter table (or an `EW_MAP_META` entry labelled "The Internet"). | Walkers appear; virus and streamer get a home. |
| R6 | Add tables for the merged rooms in F3: Mount Olympus, Stonehenge, Babel + Technoticlan, the Haunted House grounds, Outer Space, the Woods, the Catacombs. | Each place draws its own people. |
| R7 | Add a small "travellers" table to each road. | No jellyfish, angels or King Arthurs on the roads. |
| R8 | Take one-of-a-kind characters out of random pools: king arthur, pope, king kong, superhero, antihero, sidekick, santa clause, kaiju, kraken, loch ness monster, overlord, quetzalcoatl. Keep each as a fixed spot. | One of each. |
| R9 | Fix the four dead `POINT_OF_ENTRY` labels and file time cop. Suggested: clown, ringmaster → Area 51 (the Circus's site) or a table row; shadow entity → The Looking-Glass; the Sewers and Internet races are covered by R4 and R5. | Dossiers and pools agree. |
| R10 | Use `spots: false` on any table whose room has a hand-placed cast (the North Pole already does). | Prevents F1 recurring when a table is reused. |

### 5.2 Per-race list by zone

"Add" means a second home; the race keeps its others unless a "move" says otherwise.

**Disaster City**

| Race | Action | In-world reason |
|---|---|---|
| all 150 residents | keep | Every one has a district, a job and a bed. |
| catgirl | add to Entertainment | Cyberpunk City was folded into the city; the neon arcade is where she was filed. |
| ai | add to Financial (the tech ceo's tower) | The building runs itself and resents it. |
| cyborg | add to Industrial | Workplace upgrades, partly voluntary. |
| streamer | add to Entertainment and Bayside | Somebody has to film the disaster. |
| televangelist | add to Southside (the Church) | His tags already include urban; the Vatican is the head office, this is the franchise. |
| kaiju | move filed home from Antarctica to the harbour off Bayside, as a rare fixed event | The city is called Disaster City. |
| king kong, superhero, antihero, sidekick | keep as residents; remove from the CITY table | They are marked unique. |
| dinosaur (Museum) | keep, stop the override | It is the exhibit. |
| mermaid, siren (city beach) | keep, stop the override | Tourists photograph them; nobody files a report. |
| zombie ×2 (the Mall) | keep | Shoppers. |
| time cop | file at Downtown | He already works at the Time Bureau. |
| The Hollywood Hills | add popstar, influencer, tech ceo, bunny girl, vampire | Celebrity homes; one resident has not aged since 1931. |

**The Sewers**

| Race | Action | Reason |
|---|---|---|
| sewer gator | add: The Outfall and The Cistern, plus the list | The urban legend the zone was built for. |
| karate frog, samurai slug | add: The Sludge Pit and The Loop Line, plus the list | Radioactive drain, martial arts amphibians. The genre demands it. |
| mole man | add: The Old Workings | "The tunnels under everything" per his own comment. |
| kaiju (Sludge Pit) | move to the harbour; replace with sewer gator | Too big for the pit. |
| ai (The Crossing) | move to the Internet or the D.U.M.B. control room | Nothing down here to run on. |
| police officer | restrict to the Holding Cells | Cops do not patrol the outfall. |
| zombie, ghoul, gangster, flesheater, swamp monster, black goo, reptilian, conspiracy theorist | keep | All fit. |

**The Beach**

| Race | Action | Reason |
|---|---|---|
| lifeguard | add: both Lifeguard Hut spots | The hut is named for them. |
| florida man | add: The Boardwalk, The Dunes | His natural range. |
| skater, chef, hippie, influencer | add: Boardwalk, Beach Huts, The Palms | Replace the `homosapien` spots with beach people. |
| pirate | keep (Quay, Headland, Cove) | The harbour is theirs. |
| siren | keep at The Surf; add to the BEACH table | Filed sea race currently overridden. |
| deep sea fish | move off the BEACH table to the Triangle and the Deep only | An anglerfish does not sunbathe. |
| jellyfish | keep on the shore at low weight | Washed up. |
| dinosaur (Volcano Island) | keep | The island time forgot. |
| king kong | add: Volcano Island, as his filed home | Skull Island. The stadium is where the city keeps him. |
| yeti (Frozen Sea) | keep | Ice. |
| Coast Road | walkers: lifeguard, hippie, florida man, pirate, delivery boy, honda civic | Road traffic, not marine life. |

**The Deep and the Flying Dutchman**

| Race | Action | Reason |
|---|---|---|
| atlantean, mermaid, starfish, deep sea fish, sharkman, jellyfish | keep | Coherent. |
| siren | add to the DEEP table | Filed Atlantis native whose spots are overridden. |
| kraken | keep the Trench spot; cut the table weight from 8 to 1 or 0 | One kraken. |
| nordic, orb of light | remove from the DEEP table | No reason to be there. |
| reptilian | keep at weight 1 | Somebody funded Atlantis. |
| Flying Dutchman | add a table: pirate, skeleton, ghost, undead, siren | The crew is dead; the gothic tag currently lets haunted dolls and gargoyles aboard. |

**The Desert**

| Race | Action | Reason |
|---|---|---|
| clown, ringmaster, mime, bunny girl, luchador, chef, mermaid, gnome, giant, fortune teller | keep at the Circus (R1) | The show's cast. Mermaid is the tank act, giant the strongman. |
| magician | add to the Circus | Second stage after the casino. |
| wizard (The Mirrors) | move to Stonehenge; magician takes the mirrors | A real wizard would not work a hall of mirrors. |
| catgirl | move from the Circus to Giza; keep on a Giza-only table | Bastet's temple cats. |
| cowboy, sheriff, skeleton | keep at Western Town (R1) | Saloon, jail, Boot Hill. |
| cowboy (D.U.M.B. gantry) | move to Western Town | He is lost. |
| marksman, ghost | add to Western Town | A gunslinger and a ghost town. |
| men in black, grey, bligblog, spy, marksman, general, mad scientist | keep at Area 51 (R1) | The base staff and the guests. |
| conspiracy theorist | add outside the Area 51 gate | He has a lawn chair and a camera. |
| anubis, mummy, djinn, annunaki, skeleton | keep at Giza | The home set. |
| kraken, deep sea fish, loch ness monster, dragon, martian, mech, orb of light | remove from the DESERT table | Leftovers. |
| highways | walkers: honda civic, cowboy, conspiracy theorist, sheriff, hippie, grey | A speed trap, a van, and a hitchhiker you should not pick up. |

**The D.U.M.B.**

| Race | Action | Reason |
|---|---|---|
| mad scientist, telepath, professor, juggernaut, flesheater, men in black, general, politician, grey, ai, glitch, dreameater | keep | Coherent. |
| machine elves | add: the CERN ring | Filed at CERN; the collider is how they got in. |
| reptilian | add: Command | The management floor. |
| symbiote, black goo | add: Research | Samples. |
| mole man | add: Level P3 | He dug it. |
| android† ×4 | keep, but they need a model | Four fixed spots that may not draw. |
| catgirl (The Pool) | keep | Her tags name the base; she is somebody's project. |

**Leylines**

| Race | Action | Reason |
|---|---|---|
| wizard, necromancer | add: Stonehenge (their filed home) | Solstice management and the barrows. |
| hippie, shaman, knight, conspiracy theorist | keep at Stonehenge | The solstice camp. |
| quetzalcoatl | add: Technoticlan, one fixed spot | The city is his. |
| robot, mech, cyborg | add: Technoticlan | Filed there; the city is techno-Aztec. |
| annunaki ×2, reptilian | keep at Technoticlan | Feathered serpent, scaly court. |
| overlord | add: the top of Babel; keep Hell | The tower was his project. |
| golem, giant | keep at Babel | Labour. |
| cicada brood | add: Bug Colony, one fixed spot | Named in its own comment. |
| antperson, bee queen, mantid | keep in the Bug Colony | Coherent. |
| giant, nephilim, annunaki, grey, shaman, conspiracy theorist | keep at Göbekli Tepe and the Line | Ancient-aliens country. |
| sheriff | remove the `desert`-tag leak (table per R6) | No jurisdiction at a Neolithic dig. |

**The Estate**

| Race | Action | Reason |
|---|---|---|
| scarecrow, mothman, goatman, cowboy, grey, conspiracy theorist | keep on the ranch | Corn, cattle, lights in the sky. |
| loch ness monster | keep in The Lake; make this its filed home | The lake monster nobody has photographed in focus. |
| skinwalker† | keep at The Circles; needs a model | The ranch is named after it. |
| ghost, ghoul, vampire, werewolf, undead, jack o lantern, zombie, necromancer | keep in the graveyard; make them the grounds' walkers (R6) | Currently the walkers there are ranch animals. |
| haunted doll | add: The Nursery | Named in its comment. The priest already there is the exorcist. |
| cursed tv | add: The Attic | Named in its comment; the attic is empty. |
| eagleman | move from the Gazebo to the Ranch Gate; primary home Hero Plaza | A patriot with a ranch reads; a superhero by the graves does not. |
| politician, general, spy, ninja, door agent | remove from the Haunted House pool (table per R6) | The clandestine tag puts them in the hallway. |

**The Woods**

| Race | Action | Reason |
|---|---|---|
| bigfoot, mothman, goatman, werewolf, swamp monster, tree person, shaman, hippie, ki fighter | keep; make them the Woods table | The cryptid forest. |
| wendigo | add: deep woods and the snowline trail | Filed forest and polar, no fixed spot anywhere. |
| cult leader, fortune teller | keep at the Ritual Ground | The Grove. |
| politician, banker, tech ceo, general | add: the Ritual Ground, as visiting members | The Grove's guest list. They are not there, and you did not see them. |
| fairy, unicorn, mushroom girl, gnome | move primary home to Camelot's Fairy Forest; keep rare in The Clearing | They have their own forest now. |
| krampus | move to the North Pole and the Snowy Pines | He is seasonal. |
| yeti (Redwood Trail) | move to the Snowy Pass | Duplicates bigfoot here. |
| scarecrow (Fence Line), flesheater, ghoul (Dead Man's Cave) | keep | Edge of the farm; something lives in the cave. |

**Camelot Kingdom**

| Race | Action | Reason |
|---|---|---|
| knight, swordfighter, robinhood, wizard, king arthur, gargoyle | keep | The court. |
| king arthur | fixed in the castle only | One king. |
| dragon | keep in the Castle in the Sky; weight 1 elsewhere | A dragon is an event. |
| giant | add: the Castle in the Sky | Beanstalk. |
| ghost, ghoul, skeleton, vampire, undead, necromancer | keep in the Castle (its dungeon); remove from the outer woods | The dungeon's set. |
| bee queen, djinn, mummy, golem, overlord, pirate, eagleman | remove from the CASTLE and KINGDOM tables | Strays. |
| chess piece ×2, rabbit, dreameater, catgirl, ice queen | keep in the Looking-Glass Garden (R2) | Chessboard, white rabbit, Cheshire cat, and a queen. |
| fairy, unicorn, gnome, mushroom girl, tree person | Fairy Forest table | Their home. |
| bigfoot, ice queen, yeti, krampus | Snowy Pines table | The cold wood. |
| roads | walkers: knight, robinhood, swordfighter, priest, goblin | Travellers and the people who rob them. |

**The Mountains**

| Race | Action | Reason |
|---|---|---|
| hippie, nordic, bigfoot, shaman, ki fighter, gnome, tree person, yeti | keep on Shasta | Lemurians, seekers, a sasquatch. |
| crystal guardian | add: Shasta | Telos, the crystal city under the mountain. |
| minotaur, cyclops†, orb of light, nephilim, giant, unicorn, occulus | keep on Olympus; make them its table | The Greek set (the unicorn is filling in for Pegasus). |
| angel, seraphim, chosen one†, valkraye | move off Olympus to Heaven | Different management. |
| wendigo, krampus | add: the Snowy Pass | Named in the comment. |
| banker, tech ceo, influencer, popstar | add: the Ski Lodge | Après-ski. The lodge is empty. |
| santa clause, ice queen, krampus, gnome, yeti | keep at the North Pole | Coherent. |
| machine elves | add: the North Pole workshop | Elves, strictly speaking. |

**Antarctica**

| Race | Action | Reason |
|---|---|---|
| men in black, nordic, yeti | keep | The cover-up, the base, the locals. |
| kaiju | one fixed spot frozen in The Floes; out of the walker pool | One, in the ice, not six. |
| symbiote, black goo | add: The Station and The Ice Core | Something was in the sample. |
| mad scientist | add: The Station | Somebody thawed it. |
| reptilian, mole man | add: The Polar Openings | The way down. |
| ice queen | add: The Ice Wall | She has the tags and no southern home. |
| shadow entity | add: The Crevasse | It is empty and dark. |
| santa clause, pirate, mermaid, starfish | remove from the pool (table per R6) | Wrong pole, no open water. |

**The Cavern**

| Race | Action | Reason |
|---|---|---|
| goblin, reptilian, antperson, dinosaur, giant | keep | Coherent. |
| mole man | add: two fixed spots, and the tunnels | Filed here, placed nowhere underground. |
| gnome | cut from 6 to 2 or 3 | Overrepresented. |
| ghoul | cut from 3 to 1 | Already everywhere. |
| crystal guardian, nordic, machine elves, loch ness monster | keep in Agartha | The inner city and its lake. |
| king kong, robinhood, unicorn, krampus, hippie | remove from the pool (drop the site's forest tag or add a table) | Surface dwellers. |
| tunnels | add fixed goblin, antperson, reptilian, mole man | 62 empty plots. |

**Heaven + Hell + Vatican**

| Race | Action | Reason |
|---|---|---|
| priest, gargoyle, seraphim, televangelist | keep in the Vatican | Staff. |
| pope | add: the Basilica; fixed only | One pope. He may keep the Arena as a hobby. |
| Arena cast | keep | It is a show. |
| skeleton, undead, necromancer | add: the Catacombs | It is a catacomb. |
| demon, succubus, fallen angel, halfdemon, demon princess, overlord, skeleton, undead, ghoul | keep in Hell | Coherent. |
| politician, banker, televangelist | add: Hell, The Descent | The VIP queue. |
| angel, seraphim, valkraye | keep in Heaven | Coherent. |
| orb of light, unicorn | add: Heaven, the Cloud Fields | The unicorn's comment names Heaven. |
| fallen angel, nephilim | add: Heaven, The Rim | Outside the gate, not on the list. |
| River Road | walkers: priest, televangelist, hippie, knight, conspiracy theorist | Pilgrims. |

**Outer Space**

| Race | Action | Reason |
|---|---|---|
| grey, mantid, voidweaver, barbarella, martian, black goo, cosmic wraith, occulus | keep | Coherent by world. |
| astronaut | add: The Lander and The Habitat (Moon) | Filed space native with no spot in space. |
| conspiracy theorist | add: The Sound Stage (far side) | He was right about one thing. |
| boltzmann brain | add: the Singularity | Filed there. |
| bligblog | add: Saturn or the Saucer | "The grey's", per its file. |
| robot | add: Mars, the Rover Bay, replacing droid† | A rover that renders. |
| grey | cut a few of 11 for mantid and bligblog | Most-placed race in the game. |
| cowboy, spy, sheriff | remove from the pool (table per R6) | Accidental neighbours. |
| Spaceship | table: astronaut, symbiote, black goo, grey, ai | Keeps fairies off the derelict. |

**The Astral Realm**

| Race | Action | Reason |
|---|---|---|
| rabbit, chess piece, dreameater, occulus, telepath, glitch, voidweaver, machine elves, fortune teller, orb of light, shadow entity, succubus | keep | The most coherent zone in the game. |
| shadow entity | file here | Its current file (H-Wing) is not a site. |

**The Internet**

| Race | Action | Reason |
|---|---|---|
| virus | add: The Quarantine (beside the symbiote) and The Spam Folder | Filed here. |
| streamer | add: The Ring Light, The Chat Room | Filed here. |
| vtuber† | add: The Hologram Stage, once it has a model | Filed here. |
| ai, glitch, robot, influencer, popstar, conspiracy theorist, gangster, spy | keep | Coherent. |
| karate frog (Off-Topic) | keep as a second home | A frog on a forum. |
| mole man (The Capacitors) | move to the Sewers and Cavern | His only spot should not be here. |
| mech, cyborg, droid† | keep some; move one each to Technoticlan | Their filed home has none. |

## 6. What I could not determine

- **Whether the renderer applies the rules exactly as `data.js` states them.** `three-renderer.js` is not in the folder. The override of fixed spots (F1, F2) is what `hqSpotRaces` returns, and its comment says the renderer uses it, but I could not watch it happen. The same goes for whether a fixed spot of a race with no 3D model draws anything.
- **Runtime edits.** The game can load a world document, room edits and AREA UNITS changes after boot (`HQ_WORLD_DOC_STATE`, `HQ_ROOM_EDITS`, `EWDataMods`). I audited the shipped file only. Anything the owner has changed in the live editor since the last bake is not here.
- **The five cult-member cast rows.** `DOOR_CAST.cult1` to `cult5` name the retired room `site_prebuilt_bohemian_grove_grove`. `DOOR_HQ.retired` redirects that room to the Ritual Ground, but I could not confirm cast spots follow the redirect.
- **The two underscore ids in the puzzle dungeons** (`men_in_black`, `swamp_monster`). I found no code that normalises them, so those fights may field an unknown race.
- **Exact districts of the eleven fixed NPCs on the Disaster City streets.** The district move makes my plot lookup approximate there. Resident districts are exact.
- **Daily operations.** One daily template brings a non-native race to a site for a day. It is seeded by date and I did not enumerate it.
- **Intent.** Where I call something a side effect or a deliberate joke it is marked inferred. The weight-10 wizard and catgirl on the Desert table were added by hand in the AREA UNITS window, so they may be wanted at Giza even though they also reach Area 51.
- **Faction.** The brief mentions a faction field in `RACE_PROFILES`; this build has none, so no recommendation uses it.
