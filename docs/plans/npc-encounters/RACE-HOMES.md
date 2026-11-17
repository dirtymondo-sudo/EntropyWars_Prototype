# EVERY RACE AND WHERE IT LIVES (2026-11-17, for mondo to mark up)

mondo 11-17, on the Bayside list of step 1a: "That list is fucking retarded, we need to fix that first. Go through all races in the game."
This is that pass: all 157 races on the race list (data.js `AVAILABLE_RACES`), read from the game on main, not from a plan.

**How to mark it:** the last column is yours. Write a place, or "no", beside any row. Nobody is put anywhere new without your word.

## 0. The short version

- **Fixed today on your OK (Bayside):** the Homosapien is out of the city (9 residents and 8 walk-in tables; it was not on the race list
  any more but the residents code let it through). The Lifeguard (2, on the beach), the Skater (2, on the skate park's pad) and
  Florida Man (1, on the beach) live in Bayside now. The Ghost never leaves the Waterfront hotel.
- **22 races are still placed nowhere in the walked world** (no resident row, no hand-placed spot, no table): Banker, Boltzmann Brain, Cicada Brood, Cursed Tv, Delivery Boy, Haunted Doll, Influencer, Karate Frog, Librarian, Magician, Mole Man, Ninja, Pope, Quetzalcoatl, Referee, Samurai Slug, Sewer Gator, Super Sentai, Symbiote, Tech Ceo, Televangelist, Wendigo.
  20 of them are the new races of 11-16 and 11-17: the spawn system's list was written before they landed. The other two are the
  Super Sentai and the Symbiote.
- **6 races are placed, but not where their written home is:** Android, Cyclops, Door Agent, Ice Queen, Minotaur, Santa Clause.
- **Not changed:** the Homosapien still has its stats, spells and finisher in data.js, and three hand-placed Homosapien spots still
  stand (one in the city room by the harbour, two in Beach rooms, one with a line about the skiff). Say the word and they go too.

## 1. Where the columns come from

| Column | Source |
|---|---|
| Written home | Your world-areas list (`docs/plans/world-areas/world-areas-proposal.md` section 6, "the list is good", 11-15), 134 units. For the 23 newer races: the home written on the race's own row in data.js when it was added. |
| In the game today | City residents by home district (`HQ_CITY_RESIDENTS` after `hqSpawnExpand`); spots placed by hand in a zone's rooms (`npcSpots`); the old shared walk-in tables (`HQ_AREA_ENCOUNTERS`, one list copied over a whole zone, which is why a Bee Queen can walk into Camelot). |
| Status | MISSING = none of the three (shown as NOWHERE). CHECK = placed, but in no zone its written home names. |

Retired rooms and the plot dungeons are not counted. Zones whose districts were built by their own threads place their people by hand,
so "placed by hand: The Estate" is as exact as this table gets; which district is in that zone's district file.

## 2. The table

| Race | Written home | In the game today | Status | mondo |
|---|---|---|---|---|
| Ai | Disaster City: the future city (Cyberpunk); also The D.U.M.B.: Command | placed by hand: The D.U.M.B., The Sewers; old shared tables: Disaster City | placed |  |
| Android | Disaster City: the future city (Cyberpunk) | placed by hand: DOOR HQ, The D.U.M.B., Outer Space | CHECK: not where its home is |  |
| Angel | Heaven + Hell + Vatican: Heaven | placed by hand: The Mountains, Heaven + Hell + Vatican | placed |  |
| Annunaki | The Desert: Giza | placed by hand: The Desert, Leylines; old shared tables: The Desert | placed |  |
| Antihero | Disaster City: Hero Plaza | city residents: Hero Plaza × 1; old shared tables: Disaster City | placed |  |
| Antperson | The Cavern: Hollow Earth; also Leylines: Bug Colony | placed by hand: The Cavern, Leylines; old shared tables: The Cavern | placed |  |
| Anubis | The Desert: Giza | placed by hand: The Desert; old shared tables: The Desert | placed |  |
| Astronaut | Outer Space: the Spaceship; also Disaster City: Industrial (Aerospace lab) | city residents: Industrial × 1; old shared tables: Disaster City | placed |  |
| Atlantean | The Deep: Atlantis | placed by hand: The Deep; old shared tables: The Cavern, The Deep, The Beach | placed |  |
| Banker | Disaster City, Financial (its own data row) | NOWHERE | MISSING |  |
| Barbarella | Outer Space: the Moon | placed by hand: Outer Space; old shared tables: Disaster City | placed |  |
| Bee Queen | Leylines: Bug Colony; also Leylines: Göbekli Tepe | placed by hand: Leylines; old shared tables: The Cavern, Camelot Kingdom, The Desert | placed |  |
| Bigfoot | The Woods: The Redwood Trail (Mount Shasta) | placed by hand: The Mountains, The Woods, Camelot Kingdom; old shared tables: The Cavern | placed |  |
| Black Goo | Outer Space: Saturn; also The D.U.M.B.: Sub-Level 7 | placed by hand: The Sewers, Outer Space | placed |  |
| Bligblog | The Desert: Area 51; also Outer Space: Saturn | placed by hand: The Desert | placed |  |
| Boltzmann Brain | Outer Space, the Singularity (its own data row) | NOWHERE | MISSING |  |
| Bunny Girl | Disaster City: Entertainment (the Casino, from the Strip) | city residents: Entertainment × 2; placed by hand: The Desert; old shared tables: Disaster City | placed |  |
| Catgirl | Disaster City: the future city (Cyberpunk) | placed by hand: Camelot Kingdom, The Desert, The D.U.M.B.; old shared tables: Disaster City, The Desert | placed |  |
| Chef | Disaster City: Bayside (Food hall); also Disaster City: Entertainment (Restaurant court) | city residents: Bayside × 2, Southside × 1, Financial × 1, University × 1, Hero Plaza × 1, Entertainment × 1; placed by hand: Disaster City, The Desert, The Beach; old shared tables: Disaster City | placed |  |
| Chess Piece | Camelot Kingdom: The Looking-Glass Garden (the chessboard) | placed by hand: Camelot Kingdom, The Astral Realm | placed |  |
| Chosen One | Heaven + Hell + Vatican: Heaven (Mount Olympus) | placed by hand: The Mountains, Heaven + Hell + Vatican | placed |  |
| Cicada Brood | Leylines, the Bug Colony (its own data row) | NOWHERE | MISSING |  |
| Clown | DOOR HQ: The Carnival (Room 1893); also Disaster City: Entertainment | city residents: Entertainment × 2; placed by hand: The Desert; old shared tables: Disaster City | placed |  |
| Conspiracy Theorist | Disaster City: Southside; also The Desert: Area 51 (outside the gate) | city residents: Southside × 2; placed by hand: DOOR HQ, The Desert, Leylines, The Sewers, The Estate; old shared tables: Disaster City, The Desert | placed |  |
| Cosmic Wraith | Outer Space: the Singularity | placed by hand: The Astral Realm, Outer Space | placed |  |
| Cowboy | The Desert: Western Town; also The Estate: The Ranch | placed by hand: The Desert, The D.U.M.B., The Estate | placed |  |
| Crystal Guardian | The Cavern: Agartha | placed by hand: The Cavern; old shared tables: The Cavern, The Desert | placed |  |
| Cult Leader | The Woods: The Ritual Ground (Bohemian Grove); also Disaster City: Southside | city residents: Southside × 1; placed by hand: The Woods; old shared tables: The Cavern, Disaster City, Camelot Kingdom | placed |  |
| Cursed Tv | Disaster City's pawn shops, the Haunted House's attic (its own data row) | NOWHERE | MISSING |  |
| Cyborg | Leylines: Technoticlan; also Disaster City: the future city (Cyberpunk) | old shared tables: Disaster City | placed |  |
| Cyclops | Heaven + Hell + Vatican: Heaven (Mount Olympus) | placed by hand: The Mountains, The Desert | CHECK: not where its home is |  |
| Deep Sea Fish | The Deep: The Trench; also The Beach: The Island (the Bermuda Triangle) | placed by hand: The Beach, The Deep; old shared tables: The Cavern, The Deep, The Beach, The Desert | placed |  |
| Delivery Boy | Disaster City, Hero Plaza (its own data row) | NOWHERE | MISSING |  |
| Demon | Heaven + Hell + Vatican: Hell | placed by hand: DOOR HQ, Heaven + Hell + Vatican | placed |  |
| Demon Prince | Heaven + Hell + Vatican: Hell | placed by hand: Heaven + Hell + Vatican | placed |  |
| Demon Princess | Heaven + Hell + Vatican: Hell | placed by hand: Heaven + Hell + Vatican | placed |  |
| Dinosaur | The Cavern: Hollow Earth | placed by hand: The Cavern, Disaster City; old shared tables: The Cavern, The Beach, The Desert | placed |  |
| Djinn | The Desert: Giza | placed by hand: DOOR HQ, The Desert; old shared tables: Camelot Kingdom, The Desert | placed |  |
| Door Agent | DOOR HQ; also The D.U.M.B.: Level P3 | old shared tables: Disaster City | CHECK: not where its home is |  |
| Dragon | Camelot Kingdom: The Castle (the Castle in the Sky) | old shared tables: Camelot Kingdom, The Desert | placed |  |
| Dreameater | Camelot Kingdom: The Looking-Glass Garden; also The Astral Realm: The Nightmare | placed by hand: DOOR HQ, Camelot Kingdom, The D.U.M.B., The Astral Realm; old shared tables: Camelot Kingdom | placed |  |
| Droid | Outer Space: Mars; also Disaster City: the future city (Cyberpunk) | placed by hand: Outer Space | placed |  |
| Eagleman | The Estate: The Haunted House; also Disaster City: Hero Plaza (Superhero Tower) | city residents: Hero Plaza × 1; placed by hand: The Estate; old shared tables: Camelot Kingdom | placed |  |
| Fairy | Camelot Kingdom: The Fairy Forest | placed by hand: DOOR HQ, Camelot Kingdom, The Astral Realm; old shared tables: The Cavern, Camelot Kingdom | placed |  |
| Fallen Angel | Heaven + Hell + Vatican: Hell; also Leylines: Babel | placed by hand: Heaven + Hell + Vatican; old shared tables: The Cavern, The Desert | placed |  |
| Firefighter | Disaster City: Civic Center (Fire Station) | city residents: Southside × 1, Civic Center × 2; old shared tables: Disaster City | placed |  |
| Flesheater | The D.U.M.B.: Sub-Level 7; also Disaster City: The Sewers | placed by hand: The Woods, The D.U.M.B., The Sewers | placed |  |
| Florida Man | Disaster City, Bayside (its own data row) | city residents: Bayside × 1 | placed |  |
| Fortune Teller | The Woods: The Ritual Ground (Bohemian Grove); also Disaster City: Entertainment (Night market) | placed by hand: The Woods, The Desert, The Astral Realm; old shared tables: The Cavern, The Desert | placed |  |
| Gangster | Disaster City: Southside; also Disaster City: the future city (Cyberpunk) | city residents: Southside × 3; placed by hand: The Sewers; old shared tables: Disaster City | placed |  |
| Gargoyle | Heaven + Hell + Vatican: The Vatican; also Camelot Kingdom: The Castle | placed by hand: Heaven + Hell + Vatican; old shared tables: Camelot Kingdom | placed |  |
| General | Disaster City: Financial (the Lodge as the Members club); also The D.U.M.B.: Command (the War Room) | city residents: Financial × 1; placed by hand: The D.U.M.B.; old shared tables: Disaster City | placed |  |
| Ghost | The Estate: The Haunted House; also Disaster City: Bayside (Waterfront hotel) | city residents: Bayside × 1; placed by hand: DOOR HQ, The Sewers, The Estate; old shared tables: Disaster City, Camelot Kingdom | placed |  |
| Ghoul | The Estate: The Graveyard; also Heaven + Hell + Vatican: Hell | placed by hand: DOOR HQ, The Cavern, The Woods, Heaven + Hell + Vatican, The Sewers, The Astral Realm, The Estate; old shared tables: Camelot Kingdom | placed |  |
| Giant | Leylines: Göbekli Tepe; also Camelot Kingdom: The Castle | placed by hand: The Cavern, The Mountains, The Desert, Leylines; old shared tables: The Cavern, Camelot Kingdom, The Desert | placed |  |
| Glitch | The D.U.M.B.: CERN; also The Astral Realm: The Sea of Possibility | placed by hand: The D.U.M.B., The Astral Realm | placed |  |
| Gnome | Camelot Kingdom: The Fairy Forest; also The Cavern: The Cavern | placed by hand: DOOR HQ, The Cavern, The Mountains, Camelot Kingdom, The Desert; old shared tables: The Cavern, Camelot Kingdom | placed |  |
| Goatman | The Estate: The Ranch; also The Woods: The Ritual Ground | placed by hand: The Woods, The Estate; old shared tables: The Cavern | placed |  |
| Goblin | The Cavern: Hollow Earth; also Disaster City: Financial (Goblin Bank) | city residents: Financial × 2; placed by hand: The Cavern; old shared tables: The Cavern | placed |  |
| Golem | Leylines: Babel | placed by hand: Leylines; old shared tables: The Cavern, Camelot Kingdom, The Desert | placed |  |
| Grey | Outer Space: Saturn; also The Desert: Area 51 | placed by hand: The Desert, The D.U.M.B., Leylines, Outer Space, The Estate; old shared tables: The Desert | placed |  |
| Halfdemon | Heaven + Hell + Vatican: Hell; also Disaster City: Financial | city residents: Financial × 1; placed by hand: Heaven + Hell + Vatican; old shared tables: Disaster City | placed |  |
| Haunted Doll | The Estate, the Haunted House (its own data row) | NOWHERE | MISSING |  |
| Hippie | Leylines: Stonehenge; also The Woods: The Clearing | city residents: Bayside × 3; placed by hand: The Mountains, The Woods, Disaster City, Leylines, The Beach; old shared tables: The Cavern, Disaster City | placed |  |
| Honda Civic | Disaster City: the roads (Financial, Taxi court); also The Desert: The Road | city residents: Financial × 1; old shared tables: Disaster City | placed |  |
| Ice Queen | The Poles: North Pole Village | placed by hand: The Mountains, Camelot Kingdom; old shared tables: The Cavern | CHECK: not where its home is |  |
| Influencer | Disaster City, Entertainment (its own data row) | NOWHERE | MISSING |  |
| Jack O Lantern | The Estate: The Graveyard; also The Estate: The Corn Fields | placed by hand: The Estate; old shared tables: Camelot Kingdom | placed |  |
| Jellyfish | The Beach: The Island (the Bermuda Triangle); also The Deep: Atlantis | placed by hand: The Beach, The Deep; old shared tables: The Cavern, The Deep, The Beach | placed |  |
| Juggernaut | The D.U.M.B.: Sub-Level 7; also Disaster City: Sports + Culture | city residents: Sports + Culture × 1; placed by hand: The D.U.M.B.; old shared tables: Disaster City | placed |  |
| Kaiju | The Poles: Antarctica Station; also The Deep: The Trench | placed by hand: Antarctica, The Sewers, The Deep; old shared tables: The Cavern, Disaster City, The Deep, The Beach | placed |  |
| Karate Frog | The Sewers (its own data row) | NOWHERE | MISSING |  |
| Ki Fighter | The Woods: The Redwood Trail (Mount Shasta); also Disaster City: Southside (the Dojo) | city residents: Southside × 1; placed by hand: The Mountains, The Woods; old shared tables: The Cavern, Disaster City | placed |  |
| King Arthur | Camelot Kingdom: The Castle | old shared tables: Camelot Kingdom | placed |  |
| King Kong | Disaster City: Sports + Culture (the stadium field) | city residents: Sports + Culture × 1; placed by hand: Disaster City; old shared tables: The Cavern, Disaster City | placed |  |
| Knight | Camelot Kingdom: The Castle | city residents: Industrial × 1; placed by hand: Camelot Kingdom, Leylines; old shared tables: Disaster City, Camelot Kingdom | placed |  |
| Kraken | The Deep: The Trench; also The Deep: Atlantis | placed by hand: The Deep; old shared tables: The Cavern, The Deep, The Beach, The Desert | placed |  |
| Krampus | The Woods: The Redwood Trail (the snowline); also The Poles: North Pole Village | placed by hand: The Mountains, The Woods, Camelot Kingdom; old shared tables: The Cavern | placed |  |
| Librarian | Disaster City, University (the library) (its own data row) | NOWHERE | MISSING |  |
| Lifeguard | The Beach, Bayside (its own data row) | city residents: Bayside × 2 | placed |  |
| Loch Ness Monster | The Cavern: Agartha (the lake); also The Estate: The Lake | placed by hand: The Cavern, The Estate; old shared tables: The Cavern, The Deep, The Beach, The Desert | placed |  |
| Luchador | Disaster City: Sports + Culture (Wrestling hall) | city residents: Sports + Culture × 2; placed by hand: The Desert; old shared tables: Disaster City | placed |  |
| Machine Elves | The D.U.M.B.: CERN; also The Astral Realm: The Sea of Possibility | placed by hand: The Cavern, The Astral Realm | placed |  |
| Mad Scientist | The D.U.M.B.: Research; also Disaster City: University | city residents: University × 1; placed by hand: DOOR HQ, The Desert, The D.U.M.B., The Sewers, The Astral Realm; old shared tables: Disaster City | placed |  |
| Magician | Disaster City, Entertainment (the casino stages) (its own data row) | NOWHERE | MISSING |  |
| Mantid | Outer Space: the Moon; also Leylines: Bug Colony | placed by hand: Outer Space, Leylines | placed |  |
| Marksman | Disaster City: Financial (the Lodge as the Members club); also Disaster City: Industrial | city residents: Industrial × 2; placed by hand: The Desert; old shared tables: Disaster City | placed |  |
| Martian | Outer Space: Mars | placed by hand: Outer Space; old shared tables: The Desert | placed |  |
| Mech | Leylines: Technoticlan; also Disaster City: the future city (Cyberpunk) | old shared tables: Disaster City, The Desert | placed |  |
| Men In Black | The Desert: Area 51; also Disaster City: Financial | city residents: Financial × 1; placed by hand: The Cavern, Antarctica, The Desert, The D.U.M.B., The Sewers, Outer Space | placed |  |
| Mermaid | The Deep: Atlantis; also The Beach: The Shore | placed by hand: Disaster City, The Desert, The Beach, The Deep; old shared tables: The Cavern, The Deep, The Beach | placed |  |
| Mime | Disaster City: Entertainment | city residents: Entertainment × 2; placed by hand: The Desert; old shared tables: Disaster City | placed |  |
| Minotaur | Heaven + Hell + Vatican: Heaven (Mount Olympus); also Leylines: Babel | placed by hand: The Mountains; old shared tables: The Cavern, The Desert | CHECK: not where its home is |  |
| Mole Man | Hollow Earth, the tunnels under everything (its own data row) | NOWHERE | MISSING |  |
| Mothman | The Estate: The Corn Fields; also The Woods: Dead Man's Cave | placed by hand: The Woods, The Estate; old shared tables: The Cavern | placed |  |
| Mummy | The Desert: Giza | placed by hand: The Desert; old shared tables: Camelot Kingdom, The Desert | placed |  |
| Mushroom Girl | Camelot Kingdom: The Fairy Forest | placed by hand: Camelot Kingdom, The Astral Realm; old shared tables: The Cavern, Camelot Kingdom | placed |  |
| Necromancer | Leylines: Stonehenge; also The Estate: The Graveyard | placed by hand: The Estate; old shared tables: The Cavern, Camelot Kingdom, The Desert | placed |  |
| Nephilim | Leylines: Göbekli Tepe; also Disaster City: Hero Plaza | city residents: Hero Plaza × 1; placed by hand: The Mountains; old shared tables: Disaster City, The Desert | placed |  |
| Ninja | the rooftops of Disaster City (its own data row) | NOWHERE | MISSING |  |
| Nordic | The Poles: Antarctica Station; also Outer Space: the Spaceship | placed by hand: The Cavern, Antarctica, The Mountains; old shared tables: The Cavern, The Deep | placed |  |
| Occulus | Camelot Kingdom: The Looking-Glass Garden; also The Astral Realm: The Sea of Possibility | placed by hand: The Mountains, The Astral Realm, Outer Space | placed |  |
| Orb Of Light | Heaven + Hell + Vatican: Heaven (Mount Olympus); also The Astral Realm: The Sea of Possibility | placed by hand: The Mountains, The Astral Realm; old shared tables: The Cavern, The Deep, The Desert | placed |  |
| Overlord | Leylines: Babel; also Heaven + Hell + Vatican: Hell | placed by hand: Heaven + Hell + Vatican; old shared tables: Camelot Kingdom | placed |  |
| Pirate | The Beach: The Harbour (the Flying Dutchman); also The Beach: The Island (the Bermuda Triangle) | city residents: Bayside × 2; placed by hand: The Beach, The Deep; old shared tables: Disaster City, Camelot Kingdom, The Deep, The Beach | placed |  |
| Police Officer | Disaster City: Civic Center (Police desk); also Disaster City: Bayside (Police staging) | city residents: Hero Plaza × 2, Civic Center × 3, Bayside × 2; old shared tables: Disaster City | placed |  |
| Politician | Disaster City: Financial (the Lodge as the Members club); also Disaster City: Civic Center | city residents: Financial × 1, Civic Center × 1; placed by hand: DOOR HQ, The D.U.M.B., The Sewers; old shared tables: Disaster City | placed |  |
| Pope | Vatican City (its own data row) | NOWHERE | MISSING |  |
| Popstar | Disaster City: Entertainment (Concert hall); also Disaster City: Sports + Culture (the Stadium) | city residents: Bayside × 1; old shared tables: Disaster City | placed |  |
| Priest | Heaven + Hell + Vatican: The Vatican; also Disaster City: Southside (the Church) | city residents: Southside × 2; placed by hand: Heaven + Hell + Vatican; old shared tables: Disaster City, Camelot Kingdom | placed |  |
| Professor | The D.U.M.B.: Research; also Disaster City: University | city residents: University × 2; placed by hand: The D.U.M.B.; old shared tables: Disaster City | placed |  |
| Quarterback | Disaster City: Sports + Culture (the Stadium) | city residents: Sports + Culture × 2; old shared tables: Disaster City | placed |  |
| Quetzalcoatl | Leylines, Technoticlan (its own data row) | NOWHERE | MISSING |  |
| Rabbit | Camelot Kingdom: The Looking-Glass Garden | placed by hand: Camelot Kingdom, The Astral Realm; old shared tables: The Cavern, Camelot Kingdom | placed |  |
| Referee | Disaster City, Sports + Culture (its own data row) | NOWHERE | MISSING |  |
| Reptilian | The Cavern: Hollow Earth; also The D.U.M.B.: Sub-Level 7 | city residents: University × 1; placed by hand: The Cavern, Leylines; old shared tables: The Cavern, The Deep, The Desert | placed |  |
| Ringmaster | DOOR HQ: The Carnival (Room 1893); also Disaster City: Entertainment | city residents: Entertainment × 1; placed by hand: The Desert; old shared tables: Disaster City | placed |  |
| Robinhood | Camelot Kingdom: The Fairy Forest; also Camelot Kingdom: The Town | placed by hand: Camelot Kingdom; old shared tables: The Cavern, Camelot Kingdom | placed |  |
| Robot | Leylines: Technoticlan; also Disaster City: the future city (Cyberpunk) | placed by hand: DOOR HQ; old shared tables: Disaster City | placed |  |
| Samurai Slug | The Sewers (its own data row) | NOWHERE | MISSING |  |
| Santa Clause | The Poles: North Pole Village | placed by hand: The Mountains | CHECK: not where its home is |  |
| Scarecrow | The Estate: The Corn Fields | placed by hand: The Woods, The Estate | placed |  |
| Seraphim | Heaven + Hell + Vatican: Heaven | placed by hand: The Mountains, Heaven + Hell + Vatican | placed |  |
| Sewer Gator | The Sewers (no unit of their own before it) (its own data row) | NOWHERE | MISSING |  |
| Shadow Entity | DOOR HQ: H-Wing; also The Astral Realm: The Nightmare | placed by hand: The Astral Realm, Outer Space; old shared tables: The Cavern | placed |  |
| Shaman | The Woods: The Redwood Trail (Mount Shasta); also Leylines: Göbekli Tepe | placed by hand: The Mountains, The Woods, Leylines; old shared tables: The Cavern, The Desert | placed |  |
| Sharkman | The Beach: The Island (the Bermuda Triangle); also The Deep: Atlantis | placed by hand: The Beach, The Deep; old shared tables: The Cavern, The Deep, The Beach | placed |  |
| Sheriff | The Desert: Western Town | placed by hand: The Desert | placed |  |
| Sidekick | Disaster City: Hero Plaza | city residents: Hero Plaza × 1; old shared tables: Disaster City | placed |  |
| Siren | The Deep: Atlantis; also The Beach: The Shore | placed by hand: Disaster City, The Beach, The Deep, The Astral Realm | placed |  |
| Skater | Disaster City, the Bayside skate park (its own data row) | city residents: Bayside × 2 | placed |  |
| Skeleton | Heaven + Hell + Vatican: Hell; also Camelot Kingdom: The Castle (the Undercroft) | placed by hand: DOOR HQ, Heaven + Hell + Vatican, The Desert, The Sewers; old shared tables: Camelot Kingdom, The Desert | placed |  |
| Skinwalker | The Estate: The Corn Fields; also The Estate: The Ranch | placed by hand: The Woods, The Estate | placed |  |
| Spy | The Desert: Area 51; also Disaster City: Financial (Intelligence office) | city residents: Financial × 1; placed by hand: The Desert | placed |  |
| Starfish | The Deep: Atlantis; also The Beach: The Shore | placed by hand: The Beach, The Deep; old shared tables: The Cavern, The Deep, The Beach | placed |  |
| Succubus | Heaven + Hell + Vatican: Hell | placed by hand: DOOR HQ, Heaven + Hell + Vatican, The Astral Realm | placed |  |
| Super Sentai | Leylines: Technoticlan; also Disaster City: Hero Plaza | NOWHERE | MISSING |  |
| Superhero | Disaster City: Hero Plaza | city residents: Hero Plaza × 2; old shared tables: Disaster City | placed |  |
| Swamp Monster | The Woods: Dead Man's Cave; also Disaster City: The Sewers | placed by hand: The Woods, The Sewers; old shared tables: The Cavern | placed |  |
| Swordfighter | Camelot Kingdom: The Castle; also Disaster City: Southside (the Dojo) | city residents: Southside × 1; placed by hand: Camelot Kingdom; old shared tables: Disaster City, Camelot Kingdom | placed |  |
| Symbiote | Outer Space: the Spaceship; also The D.U.M.B.: Sub-Level 7 | NOWHERE | MISSING |  |
| Tech Ceo | Disaster City, Financial (the towers) (its own data row) | NOWHERE | MISSING |  |
| Telepath | The D.U.M.B.: Research (Dream Research); also Disaster City: University | city residents: University × 1; placed by hand: DOOR HQ, The D.U.M.B., The Astral Realm; old shared tables: Disaster City | placed |  |
| Televangelist | Vatican, the Square (its own data row) | NOWHERE | MISSING |  |
| Time Cop | Disaster City: Civic Center (Time Bureau); also Disaster City: Financial | city residents: Financial × 1; old shared tables: Disaster City | placed |  |
| Tree Person | The Woods: The Clearing (the Old Tree); also Camelot Kingdom: The Fairy Forest | placed by hand: The Mountains, The Woods, Camelot Kingdom; old shared tables: The Cavern | placed |  |
| Undead | The Estate: The Graveyard; also Heaven + Hell + Vatican: Hell | placed by hand: Heaven + Hell + Vatican, The Estate; old shared tables: Camelot Kingdom | placed |  |
| Unicorn | Camelot Kingdom: The Fairy Forest | placed by hand: The Mountains, Camelot Kingdom; old shared tables: Camelot Kingdom | placed |  |
| Valkraye | Heaven + Hell + Vatican: Heaven | placed by hand: The Mountains, Heaven + Hell + Vatican | placed |  |
| Vampire | The Estate: The Haunted House; also Heaven + Hell + Vatican: The Vatican (the Catacombs) | placed by hand: Heaven + Hell + Vatican, The Estate; old shared tables: Camelot Kingdom | placed |  |
| Voidweaver | Outer Space: the Moon; also The Astral Realm: The Sea of Possibility | placed by hand: DOOR HQ, The Astral Realm, Outer Space | placed |  |
| Watcher | Outer Space: the Singularity; also Heaven + Hell + Vatican: Heaven | placed by hand: DOOR HQ, The Mountains, Heaven + Hell + Vatican, Leylines, The Astral Realm, Outer Space | placed |  |
| Wendigo | The Mountains, the Snowy Pass (its own data row) | NOWHERE | MISSING |  |
| Werewolf | The Estate: The Haunted House; also The Woods: The Clearing | placed by hand: The Woods, The Estate; old shared tables: The Cavern, Camelot Kingdom | placed |  |
| Wizard | Leylines: Stonehenge; also Camelot Kingdom: The Castle (Merlin's Undercroft) | placed by hand: Camelot Kingdom, The Desert; old shared tables: The Cavern, Camelot Kingdom, The Desert | placed |  |
| Yeti | The Poles: Antarctica Station; also The Woods: The Redwood Trail (the snowline) | placed by hand: Antarctica, The Mountains, The Woods, Camelot Kingdom | placed |  |
| Zombie | Disaster City: University; also The Estate: The Graveyard | city residents: University × 3; placed by hand: DOOR HQ, The Sewers, The Estate; old shared tables: Disaster City | placed |  |

## 3. What I would do next (your call)

1. Give the 12 city races that are placed nowhere a resident row in the district their own row names: Banker and Tech CEO (Financial),
   Magician and Influencer (Entertainment), Delivery Boy (Hero Plaza), Librarian (University), Referee (Sports + Culture), Ninja
   (the rooftops), and the Sewers' three (Sewer Gator, Karate Frog, Samurai Slug) in the Sewers. Mark the table and I build exactly that.
2. The other placeless races belong to zones whose districts other threads hold (the Vatican, Leylines, the Cavern, Outer Space, the
   Mountains, the Estate): a note on the board for each, not built here.
3. Step 1a's temper table is redone for the new Bayside list (`STEP-1A.md`).
