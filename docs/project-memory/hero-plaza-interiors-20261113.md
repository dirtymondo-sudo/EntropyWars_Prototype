---
name: hero-plaza-interiors-20261113
description: Hero Plaza (Disaster City district H): signs PR #1333, interiors PR #1345/#1347, NEW YORK look PR #1434 (11-15)
metadata:
  type: project
  modified: 2026-11-13T21:11:24.496Z
---
Thread (thread in the owner project). Follows [[hero-plaza-buildings-20261113]].

- Sign lettering LIVE PR #1333 (data.js 91234aad): `txt:WORDS|fg|bg|aspect` keys in docs/disaster-city/districts/H.js. Shot polish_4_signs.jpg. Seen in game: HERO WORKSHOP, PRESS COURT, TRANSIT COURT, DELIVERIES. Not seen in frame: COFFEE, TRAINING HALL, DISPATCH, NEWS, SNACKS.
- INTERIORS: mondo 21:04 "after the exterior polish, do the interiors"; rule = plan + mock-up first, wait for his explicit OK. Plan posted with /mnt/project-files/disaster-city-hero-plaza/interiors_1..4_*.jpg (script: plans.py in session scratch, redraw if lost).
  Nine rooms: 1 News office newsroom (28x28), 2 Hero workshop garage (17.5x14), 3 Superhero Tower lobby (28x28), 4 Press court briefing room (24.5x14), 5 Coffee arcade cafe (17.5x17.5), 6 Tower service plant room (28x24.5), 7 Apartment stair lobby (24.5x14), 8 Office court lobby (21x17.5), 9 Delivery yard depot (31.5x10.5).
  Asked him: should Training hall + Transit court (solid roof-route buildings now) become walk-in too.
- Build plan once OK'd: catalogue props (HQ_CATALOGUE_ALL psx_*, reception_wedge, round_desk, conference_table, lockers, tube_tv...) + arch parts inside (counters, glass partitions, stage) from H.js; decorative props off cell centre, blocking props centred; no invented names.
- GRID RULE (mondo 21:14, all interiors): anything that blocks (desks, counters, cars, racks, partitions, boilers) snaps to whole 3.5 m BATTLE squares (HQ_ARENA_RULES.squareDefault 3.5, bake C = 3.5; NOT 1.75 m), centred on its cell, and multi-cell pieces fill whole cells (a 2-wide vehicle = exactly 2 tiles, never straddling). Cosmetic decor sits off centre, free of the grid. The posted mock-ups draw a 1.75 m grid and are NOT snapped: snap every blocker when building.
- 21:17 mondo: an intended walkway is whole cells wide, nothing halfway on 2 cells. 21:25 mock-ups REDRAWN on 3.5 m squares (plans2.py, same file names) and reposted: rooms in squares = news 8x8, garage 5x4, tower lobby 8x8, press 7x4, cafe 5x5, plant room 8x7, apt lobby 7x4, office lobby 6x5, depot 9x3. Still waiting for his OK.
- 22:25 INTERIORS LIVE PR #1345 (data.js 31af4d3c): mondo's OK 21:22 "ok and yes". H.js `insideKit` + `IN[id]`; ten rooms incl. Training hall gym (walk-in now). Shots inside_1..4_*.jpg. NOT DONE: Transit court (roof stair of bridge RF90 stands on its roof; tool can't stand a flight on a walk-in roof slab; needs levels.js change or a floating flight). Tower lobby door moved EAST: the plaza (N) doorway holds the story door THE TOWER (JOIN.tower -> site_prebuilt_downtown_lobby), whose dark housing reaches 3.5 m into the shell; asked mondo which lobby stays. car_cyber did not draw headless -> parked_car. Details: areas-complexes.md "HERO PLAZA, THE INSIDES".
- 22:45 mondo "keep the new lobby" -> PR #1347: tower walk-in lobby opens on the plaza; story door THE TOWER moved to its lift bank (H.js `joins`, new generic hook in bake-disaster-city.js). Old room site_prebuilt_downtown_lobby kept (showroom + subway stair hang off it).
- 11-15 NEW YORK pass LIVE PR #1434 (data.js 8d2405df): H.js block NEW YORK (NYC/NYC_TINT/NYC_OPEN/NYC_PROPS). News office tiers -> wedge tower + copper globe; billboards + ticker; tan brick, brownstone townhouses, fire escapes, water towers; subway stairs; star base + Meshy `hero_statue_landing` (mondo picked concept 2; R2 Assets/world/props/meshy/). Shots /mnt/project-files/disaster-city-hero-plaza/nyc/nyc_1..3*.jpg. Headless: Meshy props + taxis need 30-40 s settle before they draw (not a bug).
- 11-15 PR #1436: second Meshy statue hero_statue_crossed (concept S3, mondo asked) on a granite pedestal at plaza (-36.75,-19.25). Shot nyc_4_second_statue.png.
