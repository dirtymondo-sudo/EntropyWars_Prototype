# THE NPC SPAWN SYSTEM — Disaster City first, then the blueprint for every zone

Started 2026-11-16 on mondo's order (thread "Disaster City NPCs: the spawn system", second side, claims row of that name).
**State (11-16): his answers are in (next section). DELIVERY 1 · THE SET LEVELS is live. Deliveries 2-8 are not built.
Every number is still a PROPOSAL he has not set: they are rows in data.js `HQ_SPAWN_RULES`.**

**How NPCs react to you (strikes, talk, fleeing, onlookers, joining fights): `docs/plans/npc-encounters/PLAN.md` (2026-11-17, a plan of proposals on top of this system).**

His brief, in short: no level scaling with the player; many of the same unit (cop b, cop c ...) with schedules; more NPCs (in big outdoor spaces; small indoor rooms stay at few, mondo 11-16);
rarity from common to one of a kind (Superhero male + female, Sidekick, Antihero); a set level or level range per race, rarer
= higher (cops 5 to 10, the Superhero about 50); a cap per zone or district that refills after captures; random zodiac signs;
later an easy sheet for boss and scripted battles; the result is the blueprint for the other zones.

## HIS ANSWERS (2026-11-16) — these are decisions now

1. **The cap is per district.** An NPC counts against its HOME district wherever its day takes it (my reading of his "not sure how
   that will work when npc have routines that go through multiple districts"; `capBy: 'district'`).
2. **The refill is about 3 in-game days** (`refillDays: 3` on every tier).
3. **One of a kind, captured = gone for good, at least in that zone.**
4. **Cop variants may differ in look:** "there is a white cop somewhere that you can use too" (find the model in delivery 2).
5. **A captured race you already own goes to a holding tank / waiting room in DOOR HQ**, "like the Pokemon box where they are
   stored". So a second cop CAN be captured; the ONE OF EACH team rule stays (a team still fields one of a unit).
6. **Districts differ in strength, with a sharp rise.** The story needs only the Mall and Bayside first; the other districts are
   meant to kill an early player so he follows the route. No level cap chosen yet.
7. **XP stays as it is**: a level 5 that kills a level 50 gets all of it.
8. **Chefs stand wherever there is a restaurant** or a building that needs one, all over the city.
9. **Superhero male and Superhero female are two separate one-of-a-kind residents.**
10. **NEW: spontaneous events**, to prototype: "a gangster mugging you or doing a drive by or something".

## DELIVERY 1 · THE SET LEVELS (2026-11-16, live)

- data.js **`HQ_SPAWN_RULES`** (after `HQ_CITY_RESIDENTS`): `tiers` (common / uncommon / rare / veryRare / unique: `n`, `add`,
  `refillDays`), `rooms[room].districts[letter].base` (THE STRENGTH OF THE DISTRICT), `rooms[room].races[race]` (a tier name, or
  `{ tier: 'unique', lvl }`; `race|gender` names one gender).
- `hqSpawnDistrict(room, home)` = the home district letter of a home plot. `hqSpawnLevel(room, { id, race, gender, home })` =
  `{ lvl, tier, district }`: the district's base + the tier's `add` range, seeded by the NPC's id (the same NPC is always the same
  level); a unique is its fixed `lvl`. null for a room with no table: the old party-level rule still runs there.
- three-renderer.js `_hqResStart` reads the level once per resident; `_hqResSpawn` puts it on the body (`ch.lvl`) and in its line
  ("LV 42 · LIVES AT SOUTHSIDE APARTMENTS"); `_hqEncounterTargetOf` hands `lvl` to the launch (the group's members too).
- data.js `hqEncounterLaunch`: a target with `lvl` fights at it, no clamp to the party. Checked headless: the Superhero is 50
  against a party of 5 and of 40; an NPC without a level still follows the party (every other zone, the crystal, quest fights).
- The numbers shipped (PROPOSALS): Bayside base 5 · Entertainment, Industrial, Hero Plaza 15 · Financial, Sports 25 · Civic,
  University, Southside 35. Tier adds: common +0..5, uncommon +3..7, rare +7..12, very rare +12..16. Uniques: Sidekick 45,
  Antihero 48, Superhero 50, King Kong 50. Result today: Chef 5, Hippie 7, Pirate 9 in Bayside; Police Officer 20 (his home is Hero Plaza);
  Southside’s Cult Leader 49.
- Seen in the browser (build 5da6d16 + this change): the aim on the Ki Fighter in the Dojo returns "Ki Fighter", sub "LV 42 ·
  LIVES AT SOUTHSIDE APARTMENTS", lvl 42. NOT photographed: the prompt box itself (the probe's fresh profile did not draw it).
- Not changed: XP, capture, the one-each list, the 8-body limit, online (story only, nothing on `state`).

## DELIVERY 2 · THE VARIANTS (2026-11-16, live)

- 84 residents where 44 stood: data.js `HQ_SPAWN_RULES.rooms[room].people` = rows `{ race, d, n, work, homes, patrol? }` ("n more of
  this unit, of district d"). `hqSpawnExpand()` (runs once at load) writes each as a full row into `HQ_CITY_RESIDENTS.list` with `v`
  (its letter: b, c, d ... per race) and `dist` (its district: its level and, later, its cap). Its day = a shift from `shifts`
  (work 9 h at `work`, out in its district, 8 h asleep at a home from `homes`). Nothing else in the day code knows a variant.
- Now in the city (PROPOSAL counts): Police Officer 7 (3 at the Police desk, 2 at Bayside's Police staging, 1 on the Hero Plaza beat),
  Chef 7 (Community kitchen, Worker cafe, Student cafe, Coffee arcade, Restaurant court, Food hall x 2), Homosapien 9, Firefighter 3,
  Gangster 3, Zombie 3, Hippie 3, and one more Conspiracy Theorist, Politician, Goblin, Professor, Clown, Mime, Bunny Girl,
  Quarterback, Luchador, Marksman, Pirate. People per district: Southside 13, Bayside 12, Financial 11, University 10, Hero Plaza
  10, Entertainment 9, Civic 7, Sports 7, Industrial 5.
- **Superhero male + Superhero female** are two rows (`gender`), both level 50, both of the Superhero Tower; her day is a proposal
  (asleep 8-15, the Hero plaza 16-20, patrols Hero Plaza by night).
- three-renderer.js: ids `hq-res-<race>[-gender][-letter]`; a variant's gender and look are seeded by its id, and it may wear the
  race's other model (`getRaceModelSkin` alts: the white officer for the cops).
- The body limit is NOT changed (`drawn` 8 / `drawnLow` 4 / `bodies` 14): the street is fuller because more people are near you, at the
  same number of rigs. Checked headless: all 84 build a 24 h day, 0 jumps. Seen in the browser (build 1ca2614 + this change): by the
  Food hall 6 bodies within 70 m (2 Police Officers, 2 Pirates, 2 Hippies; 3 of them are new). A real FPS number cannot be taken in
  the cloud browser (software GPU, 2 FPS): raising `drawn` waits for a reading on his machine (F3 on the walk).
- Beds: a variant sleeps in a free bed of its home if there is one, else it goes in through the door (as before).

## THE BAYSIDE LIST + THE RACE PASS (2026-11-17, the NPC encounters thread, on mondo's direct word)

mondo 11-17, reading the Bayside residents: "where are the lifeguards? the skateboarder? homosapien isnt even supposed to be a race at all in
the game anymore ... we need to fix that first. Go through all races in the game"; "the ghost should haunt the hotel but never leave it".
- **The Homosapien lives nowhere:** its resident row, its eight `people` rows, its tier and its row on the eight city walk-in tables
  (`HQ_AREA_ENCOUNTERS`) are gone; `hqSpawnExpand` no longer lets a race through that is not on `AVAILABLE_RACES`. 80 residents (was 84).
  Not touched: its stats / spells / finisher, and three hand-placed `npcSpots` (the city room by the harbour, two Beach rooms).
- **Bayside (16 people):** + Lifeguard × 2 (the beach, shifts from 7 and 11), Skater × 2 (the skate park's pad, from 11 and 15), Florida Man × 1
  (the beach, from 15). Tiers: Lifeguard and Skater common, Florida Man uncommon (PROPOSALS, like every number here).
- **A `people` row may carry `h: [hours]`**, its own shift starts, one a variant; such a row takes no slot of `shifts`. Removing the
  Homosapien rows moved the later rows two slots along `shifts`, so the variants after them (gangster b, c and on) work other hours than before.
- **`f:<feature id>`** is a new place: the walked squares of one terrain feature. **`HQ_CITY_RESIDENTS.walkOn`** names plateaus the residents'
  grid walks on (`hqCityGrid` blocked every plateau; the skate park's pad `dc:skate:pad` stands at the boardwalk's level).
- **The Ghost never leaves the hotel:** its two blocks meet now (`[5, 22, S]`, `[22, 5, P]`); the hour between them was spent on the pavement.
  Checked headless: 0 of 1,200 samples of its day outside the building.
- **THE BODY LIMIT (mondo 11-17, the same day):** `drawn` 8 -> 20, `drawnLow` 4 -> 20 (the same on every machine), `bodies` 14 -> 26. No frame rate could be read in the cloud browser: F3 on the walk on his machine is the check; it is one number to turn down. The most residents ever within 70 m is 12 today, so the street fills only with more residents.
- **Every race and where it lives:** `docs/plans/npc-encounters/RACE-HOMES.md`, for mondo to mark. 22 races are placed nowhere (20 of them
  the races of 11-16 / 11-17). Nobody else is placed before his marks.

## THE 144 + THE BEAT (2026-11-17, the NPC encounters thread, on mondo's word)

mondo 11-17: "there should be at least 144 residents if there are 144 plots. like minimum"; "a cop works the whole city ... obviously university
and sports should have some cops too" (none in Southside).
- **150 residents** (was 80): every district 16 or more (Financial and Entertainment 18, University and Sports 17). 70 new `people` rows' worth at
  the END of the list, so no older variant changed its shift.
- **The city's races that stood nowhere have homes:** Banker x 2, Tech CEO, Magician x 2, Influencer x 2, Delivery Boy x 4, Librarian x 2,
  Referee x 2, Ninja, Super Sentai, Cursed TV (the Pawnshop court). The Ninja's and the Cursed TV's districts and Industrial's mix are guesses.
- **Cops: 22**, in every district but Southside (Civic 6, Hero Plaza 4, two in each other). **`beat`** on a `people` row (and on the first
  Police Officer's own row): after its shift the unit patrols those districts (`'CFEUHBSI'`, all but Southside) in place of time out at home,
  on long legs (`HQ_CITY_RESIDENTS.beatR` 90 m). Headless: a cop stands in 2 to 5 districts over a day.
- With `drawn` 20 the most people ever within 70 m is 17. No frame rate was read (cloud browser): F3 on his machine.
- All counts, tiers and work places are PROPOSALS.

## The short table

| # | He asked for | Today | Gap |
|---|---|---|---|
| 1 | No level scaling with the player | Every enemy's level = the party's level plus a small offset (`hqEncounterLevels`) | A level range per race, read in place of the party level. Small. |
| 2 | Many of the same unit, as variants with schedules | 44 residents, one row a unit (the Priest twice: male + female) | The list, the ids and the day-seed are keyed by race. Medium. |
| 3 | More NPCs, the city feels dead | 44 in 144 plots; at most 8 get a body near you (4 on a weak PC), 14 rigs kept | More rows are cheap. More BODIES on screen cost frames. Medium, the frame rate is the risk. |
| 4 | Rarity tiers, common to one of a kind | A weight per race in the AREA UNITS table; the residents ignore it (one each) | A tier per race per district. Small once 2 is in. |
| 5 | Level range per race, rarer = higher | No race has a level. A room table can clamp levels (`levels: [min, max]`), unused in the city | The same rows as 1. |
| 6 | A cap per district that refills over time | A beaten or captured NPC is gone until the next real calendar day, then back | A count per row + a refill timer on the save. Medium. |
| 7 | Random zodiac per unit | Each enemy rolls a random sign when the FIGHT starts; the walking NPC has none | Roll it at spawn, keep it, show it, carry it into the fight and the capture. Small. |
| 8 | Easy boss / scripted battles | `QUEST_FIGHTS` rows (the first quest): race + gender + seats; enemy levels still follow the party | Level, sign, stats, spells and place per enemy on that row. Medium. |
| 9 | The blueprint for other zones | The residents code is tied to one room (`HQ_CITY_RESIDENTS.room`) | Rules as rows keyed by room + district. Comes with 2. |

## A. HOW IT IS NOW

**Who the city's NPCs are.** data.js `HQ_CITY_RESIDENTS.list`: 44 rows for the room `site_prebuilt_downtown_streets`. One row
a unit; only the Priest has two (male, female). A row = `race`, optional `gender`, `home` (a plan building), `homeName`, and
`day` = blocks of [from hour, to hour, Sleep | Work | Out | Patrol, place]. The Superhero is ONE row (its gender is picked by a
hash). In this room the older systems stay out: the random extra walkers (`hqRoomPopulation`, 6 in a city room) and the
roster draw are not spawned (three-renderer.js `_hqResStart`, called from `_hqSpawnRounds`).

**Homes by district today** (from each row's `home`): Southside 9 · Civic Center 0 (five work there) · Financial 8 ·
University 5 · Hero Plaza 6 · Entertainment 4 · Sports 4 · Industrial 3 · Bayside 5.

**Schedules, homes, beds.** data.js `hqCityGrid(room)` = the walk map on 3.5 m squares. `hqResidentTimeline(G, r, dayKey)`
lays a 24 hour day from the row (walks, the bus, pottering inside, patrols), seeded by the day + the race. `hqResidentAt(tl,
hour)` = where it is now, on the world clock. Beds: `hqCityGrid().beds`, 41 of 44 sleep in a bed; one without a bed still
goes in through its front door.

**Bodies on screen.** three-renderer.js `_hqTickResidents`: every 0.4 s the nearest `drawn` 8 (`drawnLow` 4) residents
within `radius` 70 m get a body, kept to `keepM` 85 m, at most `bodies` 14 rigs. Everyone else exists only as a timeline.
This is the main reason the city feels empty: 44 people over 144 plots, many asleep or indoors, and never more than 8 drawn.

**Where an enemy's level comes from (the scaling).** data.js `hqEncounterLevels(partyLevel, site, n, seed)`:
level = the party's level (`hqPartyLevel`, the first shift's mean; map.js `_hqPartyLevelNow`) + the site's offset
(`HQ_LEVEL_RULES.tierOffset`, Disaster City is tier 1 = -1), jittered by `lead` (-1..+3) and `band` (-3..+2), clamped to
`maxBelow` 6 / `maxAbove` 8 of the party level. Measured: party 5 gives 5, 2, 3; party 40 gives 40, 37, 38.
Callers: `hqEncounterLaunch` (you hit a walking NPC), `hqMarkerLaunch` (the crystal), `questFightLaunch` (a quest fight).
map.js `_hqEncounterStart` carries `enemyLevels`; `_msConfirm` writes `storyLevel` on each enemy; `createUnit` builds it.
Two hooks exist and are almost unused: `HQ_AREA_LEVELS[site]` (only the Training Room) and a room table's `levels: [min,
max]` clamp (`hqRoomEncTable`; no room sets it).

**The AREA UNITS table.** data.js `HQ_AREA_ENCOUNTERS[room]` (his dev window): `{ list: [{ race, w }], walkers, levels,
group }`. The city's row has 39 races with weights 7 / 2 / 1. In the city it only decides who may walk in from another room
and who a crystal fight draws; the residents do not read the weights.

**A fight and a capture.** Click a walking NPC: three-renderer.js `_hqEncounterAim` → `hqEncounterLaunch`. The enemy line =
that NPC + the members of its walking group (none for a resident: they walk alone). A capture is the One-Way Door item
(CAPTURE_PLAN.md; battle.js "THE ONE-WAY DOOR"); after a win `hqCaptureEnlist` puts the unit in the party (a free slot, at
the level it was fought at), else on the roster, else pays a bounty. **A race you already own cannot be captured** (battle.js
`captureRaceOwned`, the ONE OF EACH rule of 10-20), and no team fields the same unit twice.

**What a beaten or captured NPC leaves behind.** data.js `hqEncounterRecord` writes its id into `door.hq.cleared[room]`
with today's date; `_hqResStart` skips those ids. The next REAL calendar day (`hqToday`) it is back: same unit, same home,
same schedule. A capture is the same: the unit joins you AND stands in the city again tomorrow. Nothing counts, nothing refills.

**Zodiac.** It exists in fights: 12 signs (`AVAILABLE_ZODIACS`). A unit whose sign matches the sky's sign gets the sky
bonus (`ZODIAC_EFFECTS[sign].sky`, +10 % on seven stats; the sky turns every 5 rounds), fire / earth / air / water signs
give the element surge (×1.25), and a sign can carry natal stat changes (`natal`, empty as shipped). An enemy gets a random
sign in state.js `randomizeIdentity` when the fight is set up: new every fight, not shown in the field, not kept. A captured
unit's record can hold a sign (`meta.zodiac`); whether the fight's sign rides into the capture is not checked yet.

**Fixed and scripted fights today.** data.js `QUEST_FIGHTS` (one row: `orientation_portal`, the first quest): site, room,
guest, `allies` (Agent Locke, `level: 25`, a tactic), `enemies: [{ race, gender }]`, seats, the cutscenes. The enemies'
levels still come from `hqEncounterLevels` (about the party's). No row can set an enemy's level, sign, stats or spells.
The crystal (`hqMarkerLaunch`) draws from the table. Plot dungeon fights are stand-ins. There is no boss sheet.

**Online.** All of this is story mode on one machine: nothing is on `state` or relayed (RULE #2 does not bite until a
fight rule changes).

## B. WHAT HE ASKED (his terms)

1. No level scaling with the player.
2. Many of the same unit, as variants (cop b, cop c, cop d ...) that each keep a schedule.
3. More NPCs so the city feels alive.
4. Rarity tiers from common (many) to one of a kind per district (Superhero male + female, Sidekick, Antihero), "and
   everything in between".
5. A set level or level range per race; rarer = higher (cops about 5 to 10, the Superhero about 50: "if I run into them
   early game I get clobbered").
6. A cap per zone or per district that refills over time after captures, so the city never goes empty.
7. Random zodiac signs per unit.
8. Later: an easy way to make boss and scripted battles (this NPC, this level, this place, these stats).
9. The result is the blueprint every other zone copies.

## C. THE GAP

| # | Exists | Missing | Files | Size | Risks |
|---|---|---|---|---|---|
| 1 | `hqEncounterLevels` + two unused hooks | A level per spawned NPC, carried from the walk into the fight; the party-level maths switched off where a row gives a range | data.js (rules + launch), map.js (`_hqEncounterStart` already carries levels) | Small | The first quest's fight must keep its own levels (see 8). A level-50 kill pays big XP to a level-5 party (`killXpFor`): his call whether that stays. The tutorial lines: no TUTORIAL_MECHANICS lesson watches these functions today; re-check in the PR. |
| 2 | One row a race; id `hq-res-<race>`; day seeded by race | Variant rows (letter b, c, d ...), each with its own home, day and seed; ids per variant | data.js (`HQ_CITY_RESIDENTS` → the new rules object, `hqResidentTimeline` seed), three-renderer.js (`_hqResStart` ids) | Medium | Homes and beds: a new variant needs a door to go home through (works today) and, to sleep in a bed, a bed the district thread built. Saves: the cleared ids change (he does not care about old saves). |
| 3 | 8 drawn / 14 rigs | More people AND a way to show more of them | data.js knobs; three-renderer.js `_hqTickResidents` | Medium | **Frame rate.** The city runs about 37 FPS; each drawn body is a skinned rig. More rows cost nothing until they are drawn. Plan: measure FPS at 8, 12, 16 drawn before choosing; keep `drawnLow` for the weak PC. The frame-rate row is held by the second side too: a note goes on the board. "None blocking a path" stays. |
| 4 | Weights in AREA UNITS (not read by residents) | A tier per race per district; one-of-a-kind = count 1 | data.js | Small | None beyond 2. |
| 5 | Nothing per race | Level range on the tier, with a per-race override | data.js | Small | Same as 1. |
| 6 | "Gone until tomorrow" on the real calendar | A live count per district row, a removed-list with times on the save, a refill timer | data.js (ledger beside `cleared`), three-renderer.js (`_hqResStart` reads it), battle.js commit (a capture marks "captured", a win marks "beaten") | Medium | Saves: a new key in `door.hq` (never deletes his saves). The synced blob needs a merge rule (server merges off data.js). ONE OF EACH blocks capturing a second cop: see F. |
| 7 | A random sign per fight | Rolled once at spawn (seeded by the variant + its refill count), shown on the NPC, carried into the fight and the capture | data.js, three-renderer.js (the sub line), state.js (the lead's identity takes the sign), data.js `hqCaptureEnlist` | Small | None. |
| 8 | `QUEST_FIGHTS` | Per enemy: `level`, `zodiac`, stat changes, spells, name, seat; a place in the world that starts it | data.js (`QUEST_FIGHTS` / `questFightLaunch`), map.js, state.js | Medium | Must not move the first quest's fight. Stats first, never remove a spell. Names and characters are his: the sheet is empty until he fills it. |
| 9 | One room hard-wired | Rules keyed by room and district; the residents code reads any room that has rows | data.js, three-renderer.js (`_hqResRoom`) | With 2 | Other zones have no walk grid for schedules yet (`hqCityGrid` reads the city plan): a zone without one falls back to the rounds (loops of stops). |

## D. THE PROPOSED DATA SHAPE (every number is a PROPOSAL)

One new rules object in data.js beside the population helpers (working name `HQ_SPAWN_RULES`): the tier ladder once, then
one table per room, one block per district. Another zone adds only its own table.

**The tier ladder (PROPOSAL)**

| Tier | At once, per district | Level range | Back after capture or defeat |
|---|---|---|---|
| Common | 4 | 5 to 10 | 1 day |
| Uncommon | 2 | 10 to 20 | 2 days |
| Rare | 1 | 20 to 35 | 4 days |
| Very rare | 1 | 35 to 45 | 7 days |
| One of a kind | 1 in the whole city | 50 | his call (F3) |

A row may override its tier's count, level and refill. "Days" are world-clock days unless he picks real days (F2).

**Hero Plaza, the worked example (PROPOSAL)**

| Unit | Tier | At once | Level | Variants | Refill | Today |
|---|---|---|---|---|---|---|
| Police Officer | Common | 4 | 5 to 10 | a, b, c, d: each its own home, shift and beat | 1 day | 1, lives in Apartments A, works at the Police desk |
| Chef | Common | 3 | 5 to 10 | a, b, c | 1 day | 0 here (the one Chef lives and works in Bayside; his example names chefs: his call if they also work Hero Plaza's Coffee arcade) |
| Homosapien | Common | 4 | 5 to 8 | a to d | 1 day | 0 here (1 in Southside) |
| Eagleman | Rare | 1 | 25 to 35 | one | 4 days | 1, Superhero Tower |
| Nephilim | Rare | 1 | 25 to 35 | one | 4 days | 1, Apartments A |
| Sidekick | One of a kind | 1 | 40 | one | F3 | 1, Apartments A |
| Antihero | One of a kind | 1 | 45 | one | F3 | 1, Apartment stair |
| Superhero (male) | One of a kind | 1 | 50 | one | F3 | 1 row, gender by a hash |
| Superhero (female) | One of a kind | 1 | 50 | one | F3 | not a row of her own today |

District total: 17 people where 6 live today.

**The other districts (PROPOSAL; units = today's residents by home, no new units)**

| District | Common (4 at once, 5 to 10) | Uncommon (2, 10 to 20) | Rare (1, 20 to 35) | Very rare (1, 35 to 45) |
|---|---|---|---|---|
| Southside | Homosapien, Gangster | Priest (male, female), Firefighter, Conspiracy Theorist | Ki Fighter, Swordfighter | Cult Leader |
| Civic Center (nobody lives here today) | Police Officer, Firefighter | Politician | Time Cop | General |
| Financial | Honda Civic (on the roads) | Goblin, Spy | Men in Black (cannot be fought today), Halfdemon, Politician | General, Time Cop |
| University | Zombie | Professor, Telepath | Mad Scientist, Reptilian | |
| Entertainment | Chef | Clown, Mime, Bunny Girl | Ringmaster | Popstar (works here, lives in Bayside) |
| Sports + Culture | | Quarterback, Luchador | Juggernaut | King Kong (one of a kind, on his field) |
| Industrial | | Marksman | Knight, Astronaut | |
| Bayside | Chef, Hippie | Pirate | Popstar | Ghost (one, haunts the hotel) |

With these counts the city holds about 110 people in place of 44. How many get a BODY near you stays a separate knob
(`drawn`), set after the FPS measurement.

**The row shape (sketch)**

```
HQ_SPAWN_RULES = {
  tiers: { common: { n: 4, lvl: [5, 10], refillDays: 1 }, ..., unique: { n: 1, lvl: [50, 50], refillDays: null } },
  rooms: { site_prebuilt_downtown_streets: { capBy: 'district', districts: {
    H: [ { race: 'police officer', tier: 'common' },                       // variants a..d made from n
         { race: 'superhero', gender: 'male', tier: 'unique', lvl: 50 },
         { race: 'superhero', gender: 'female', tier: 'unique', lvl: 50 }, ... ] } } }
}
```

Each variant's home, day and seed: the first variant keeps today's `HQ_CITY_RESIDENTS` row; b, c, d ... take a home in
the same district and a shifted day (a cop on the day shift, one on the night shift), written as rows so he can read them.

## E. THE BUILD ORDER (each delivery stands alone, one PR each)

1. **The set levels, scaling off.** DONE 11-16 (above).
2. **Variants + counts + more people.** The rules object replaces the one-each list: cops b, c, d with their own homes and shifts
   (the white cop as one look), chefs at every restaurant, Superhero male + female as two residents. FPS before and after at
   8 / 12 / 16 drawn bodies.
3. **The cap + the refill.** Captured or beaten = out of the home district's count; back after 3 game days; a captured unique
   never comes back in this zone.
4. **The holding tank.** A captured race you already own is stored in DOOR HQ (the box). Needs from him: which room it is.
5. **Zodiac.** A sign per spawned NPC, shown, kept through the fight and the capture.
6. **The scripted / boss battle sheet.** One row = who, level, sign, stats, spells, place. The first quest's fight moves onto it unchanged.
7. **Spontaneous events, a prototype.** A gangster mugs you; a drive-by. Needs from him: what a mugging takes or starts (a fight?).
8. **The blueprint.** The "add a zone" recipe here; the first other zone's table when he names it.

## HIS ANSWERS, ROUND 2 (2026-11-16)

- The holding tank is a NEW ROOM in DOOR HQ that has to be built; try BOTH a room you walk into and a menu at a counter, "to see
  which one feels better". (DOOR HQ is the owner side's row: a board note before building in it.)
- A mugging / a drive-by STARTS A FIGHT. Rare: "like once per hour of playing or something", enough to feel alive, never annoying.
- A unique you only beat comes back after the 3 days like the others.

## F. STILL OPEN (his to answer)

1. The level numbers per district and tier, and the counts per unit (the shipped ones are my proposal). The city's top level.
2. `drawn` 8 → 12 bodies near you: worth it on his machine and his friend's PC? (An FPS reading on the walk decides.)

## THE AWARENESS + THE MARKS (NPC encounters step 2, 2026-11-17; mondo: "eyes on player and red ! on npcs", "eye can be by the portrait, okay to build")

Story walk only, and the same on every machine. Plan: `docs/plans/npc-encounters/PLAN.md` 4.1.

- **The data** (data.js, with step 1b's `HQ_NPC_TEMPERS`): `aware: { sightM 18, dyM 6, tickMs 300, sayMs 3500, markH 0.05 }` (all PROPOSALS), `hqNpcActs(ch, o)`,
  `hqNpcGround(ch)`, `hqNpcOnGround(room, ground, x, z)`.
- **Who sees you:** an NPC with a body, a temper that has `watch` (Guard, Protector, Territorial, Opportunist, Brute), inside 18 m on the flat and 6 m up or down,
  a clear line between the heads (`_hqLosClear`), not asleep. Civilians and Cowards never count.
- **What it is to you** (`hqNpcActs`): `null`, `'watch'` or `'alert'`.
  - Guard / Protector: `watch`; `alert` while your strike aim is on someone it defends (`hqNpcDefends`: its group, or for a Guard a Civilian / Coward).
  - Territorial with a ground row (Bayside's Ghost, `b:P08-08-B1` = the Waterfront hotel): nothing while you are off its ground, `alert` while you stand on it.
    It says its warning line once a visit ("Get out."), over its head.
  - Opportunist / Brute: `watch`, unless it is 8 or more levels under the party (`levelGap`: it never starts a fight, so it does not count).
    Their own `alert` ("it is coming") belongs to step 4, which makes them come.
- **The eye** (map.js `_hqAwareEvent`, `_hqAwareEyeSvg`, drawn inside the lead portrait's own svg in `_hqFillDock`; styles-base.css `.hq-dock-eye`): one eye right
  of the lead's portrait. Green with a slash = nobody who would act sees you; amber and open = someone does. The battle nameplate's own character, colours and
  slash (three-renderer.js `.tp-eye`). No eye where a strike cannot start a fight (DOOR HQ, an online seat): `opts.awareOk`.
- **The red `!`** (three-renderer.js `_hqTickAware`): a sprite over the head of every `alert` NPC, the same size on screen at any distance (5 % of the screen's
  height), hidden by walls.
- **The weak-PC cut is gone** in `_hqTickResidents` (`cap = R.drawn`; `drawnLow` is no longer read). mondo: "the game is the game".
- **Probe:** `ThreeRenderer.hq.dev.aware()` = `{ on, seen, n, marks, says }`; `dev.awareMark(id, on)` holds a red mark on one NPC for a picture;
  `dev.chars()` rows carry `race` and `away`; a `playtest_city.js` view may say `"keep": true` (do not move the walker back).
- **Not built here (no moment for them yet):** the Guards' warning line (it needs a strike that does not start the fight at once: step 3), people stepping
  aside (a walker already waits when you stand in its way), who joins a fight (step 8 reads the same awareness).

