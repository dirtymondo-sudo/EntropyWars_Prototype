# Plot layouts for the remaining zones, and the whole-world map

## The Sewers, plan 2 (2026-11-16, waits mondo's OK)

`sewers_plot_plan_2.png` + `sewers-layout-2.json`, drawn by `node docs/plans/world-zones/draw-sewers.js` (it reads the built city's files for the outline). It replaces `sewers_plot_plan.png` (plan 1, 8 x 2), which was drawn before the city's districts moved.

- The Sewers use the city's own 12 x 12 plot grid: sewer plot `Pcc-rr` lies under the city plot standing at column cc, row rr. 31 plots are dug.
- Districts: W The Sewers (23), T The Running Tunnels (4), H The Holding Cells (2), O The Old Workings (2). One file each from the first build PR (`docs/areas/sewers/districts/W.js T.js H.js O.js`, `layout.json`, `bake-sewers.js`).
- Doors up: the Pump court (column 10, row 11) and the Dock edge's drowned manhole (column 8, row 11) straight under their city doors; the track to the Platform under the Transit square (column 0, row 3); the stadium under the pitch's east half; the cells under Civic Center's Police desk and Holding annex.
- All 11 ways out are the 11 in the game today; no way and no name was added.
- Open for mondo: own zone or the city's lower level; who re-points the owner-side doors; keep the Strip and Cyberpunk gutters; 31 plots or a shorter plan that does not line up.

## Layout 3 (after your note, 11-15 18:17 UTC)

- **New zone: The Mountains** (`mountains_plot_plan.png`, `mountains-layout.json`). One range across the north, 16 x 4 plots plus a 2 x 4 Shasta trail, 72 plots. Five districts west to east: the North Pole village, the Snowy Pass, the Ski Lodge and slopes, Mount Shasta, Mount Olympus.
- **Three trails from the Fork** on Shasta: up to Shasta's summit, west past the Lodge and over the High Pass to the North Pole village, east along the Sacred Way to the Temple on Olympus and on up the Grand Stair into Heaven.
- **Ways in:** from the Woods (its built Mount Shasta corner), from behind the Vatican (the Pilgrim Stair), a hidden path from Camelot's castle postern, and a new mountain road from the north edge of Disaster City to the Lodge Yard.
- **The slopes:** groomed runs you skate down on the board the game already has, a chairlift back up, the Lodge as a walk-in.
- **The North Pole** is lifted out of Camelot Kingdom (where it was built today) and over the pass. This needs your yes and is work for the Camelot thread.
- **Mount Olympus** is settled as the east peak above the Vatican; Heaven keeps its 16 plots.
- The hills north of Disaster City stay scenery (the Hollywood sign), the dry east end of the range.
- Whole world: 716 plots.

## Layout 2 (after your notes, 11-15 17:33 UTC)

The first versions of the four pictures that changed are kept in `v1/`.

- **Disaster City on the world map:** the coast is Entertainment, Bayside, Industrial (north to south). Southside is in the south-west. Civic Center is the north-west corner. Financial is the north middle. University, Hero Plaza and Sports + Culture stay. This is drawn on the map only; the built city is untouched.
- **The Vatican** moved north: above the Woods, at the foot of the mountains, with a gate into Civic Center. Hell stays under it and Heaven over it.
- **The Estate (plan 2):** the Lake and the Ranch swapped. The Ranch now meets the Desert.
- **The Astral Realm (plan 2):** only two ways cross between districts (Reading Room to Near Shore; the Sea to the Nightmare at the Stairs Down). The Waiting Room still has a door to each.
- **Outer Space (plan 2):** one solar system of 12 x 12 plots. The Sun, Earth, the Moon, Mars, the asteroid belt, Saturn and the black hole. You fly the Spaceship between worlds and float outside it, the same way the sea already lets you sail the skiff and swim. Fights stay on the worlds and on the ship's Deck.
- Moved with them: the Beach and The Deep (up beside Bayside), the Cavern (north-west, near Hell and Mount Shasta).

The sections below are the first write-up; where they disagree with this list, this list wins.

For mondo, 2026-11-15. **Proposals only: nothing is built, nothing in the game changed.** They follow the world plan (Revision 2) and use the same plan format as The Woods. Zones already handled elsewhere are not redone here: Disaster City (built), The Woods (built), Camelot Kingdom (plan 2 OK'd), The Desert (plan posted).

## The pictures

| Zone | Size | Districts | Picture |
|---|---|---|---|
| **The whole world** | 660 plots | every zone, surface and underground | world_layout.png |
| The Estate | 6 x 6 = 36 | Corn Fields, The Ranch (new), Haunted House + Graveyard, The Lake (new) | estate_plot_plan.png |
| The Beach | 6 x 4 = 24 | The Shore, The Harbour, The Island | beach_plot_plan.png |
| The Deep | 9 x 3 = 27 | Atlantis, The Trench | the-deep_plot_plan.png |
| The D.U.M.B. | 6 x 6 = 36 | Research, Sub-Level 7, Command, Level P3, CERN as the ring | dumb_plot_plan.png |
| The Cavern | 6 x 6 = 36 | The Cavern, Hollow Earth, Agartha | cavern_plot_plan.png |
| Leylines | 9 x 5 = 45 | Göbekli Tepe, Bug Colony (new), Stonehenge, the Great Line, Babel, Technoticlan | leylines_plot_plan.png |
| Heaven + Hell + Vatican | 3 rooms of 4 x 4 = 48 | Hell, The Vatican, Heaven with Mount Olympus on top | heaven-hell-vatican_plot_plan.png |
| Outer Space | 4 rooms of 3 x 3 = 36 | The Moon, Mars, Saturn, The Singularity (the Spaceship stays handmade) | outer-space_plot_plan.png |
| Antarctica | 4 x 3 = 12 | Antarctica Station | antarctica_plot_plan.png |
| The Astral Realm | 6 x 6 = 36 | The Library of Unthought Things, The Sea of Possibility, The Nightmare | astral-realm_plot_plan.png |
| The Sewers | 8 x 2 = 16 | The Sewers, The Old Workings, The Running Tunnels | sewers_plot_plan.png |

Each picture has a `<zone>-layout.json` beside it with every plot's name, district, height, what stands on it, which existing room it comes from, and its ways out. That file is what a build thread would start from.

## What is the game's and what is mine

- Plot names come from the names already on each room in the game (for example THE CROSSROADS, THE SARSEN CIRCLE, THE BIG BOARD). Every way between zones drawn in pink or as an inside exists in the game today.
- Where a plot had no name I used a plain label and marked it "(label mine)" in the json. Counts: Estate 21 of 36 (the Ranch and the Lake are new), Beach 9 of 24, The Deep 10 of 27, D.U.M.B. 7 of 36, Cavern 5 of 36, Leylines 9 of 45, Heaven + Hell + Vatican 12 of 48, Outer Space 2 of 36, Antarctica 4 of 12, Astral Realm 13 of 36, Sewers 0 of 16. They are yours to rename.
- No characters and no rules were invented. "Who lives here" on each picture is the homes table from the world plan.

## Changes from the world plan (Revision 2) that these layouts assume

1. **The North Pole is no longer with Antarctica.** You moved it north of Camelot on 11-15, so "The Poles" becomes Antarctica alone, 12 plots.
2. **The White Rooms stay at Area 51.** The Desert plan keeps them there, so they are not in the D.U.M.B. layout.
3. **The Beach's Shore grows out of the beach strip already built along Bayside** (boardwalk, sand, lifeguard hut, pier, breakwater, lighthouse). Nothing of that strip is thrown away.
4. **The Sewers are a strip of 8 x 2** under the city's south side, so the Pump court door and the Dock door both come up where they are today.
5. **Old rooms get redesigned, not just carried over**, as you said for Camelot's castle: the Basilica, the Haunted House, the Flying Dutchman, the Temple of the Deep and the D.U.M.B. rooms would be rebuilt inside and out at the level of the city's best buildings when their zone is built.

## The world map: how it fits

Disaster City is the middle, and its four edges (mountains north, forest west, desert south, bay east) decide the rest.

- **West:** The Woods on the city's forest edge, Camelot Kingdom beyond them, with the North Pole as Camelot's cold north.
- **South-west:** The Estate, through the Woods' fence gate.
- **South:** The Desert, down the highway. The D.U.M.B. is under Area 51.
- **East:** The Beach off Bayside, the ocean, The Deep under the sea off the island.
- **South-east:** The Vatican between the city and Leylines, with Hell straight under it and Heaven straight over it. Leylines lies east of Giza so the robbers' tunnel is short.
- **Under it all:** the Sewers under the city, then The Cavern, which opens onto the D.U.M.B. (west), Hell (east), Leylines (up the ley line) and the Sewers (above).
- **Far south:** Antarctica.
- **Not on the map:** DOOR HQ (its doors are marked in gold on every zone they open into), Outer Space, The Astral Realm.

## Decisions I need from you

1. **The way round:** Woods and Camelot west, Desert south, sea east. OK?
2. **Mount Olympus:** A, the top of Heaven (my pick, drawn that way). B, a sixth site in Leylines. C, its own small climb on the mountains north of Disaster City, about 6 plots stepping up from the Hollywood sign.
3. **The Vatican:** a gate from Disaster City, or reachable only by the HQ painting, Hell and Heaven as today?
4. **The Ice Wall:** should Antarctica's Ice Wall run round the rim of the whole world? It is my idea, not something in the game.
5. **The Spaceship:** does it leave from Hangar 18, from Antarctica (where it docks today), or both?
6. **The Deep to Area 51:** it is on your zone list but has no door today. Keep it?
7. **Which of these to build next**, once Camelot and the Desert are under way. I suggest The Estate (it hangs off the Woods, which is built) and then The Beach (it hangs off Bayside).

## Files

All in `/mnt/project-files/world-zones-plan/`: the twelve pictures, the eleven layout json files, and the scripts that draw them (`engine.py`, `zones_a.py`, `zones_b.py`, `zones_c.py`, `world.py`), so any plan can be changed and redrawn in a minute.
