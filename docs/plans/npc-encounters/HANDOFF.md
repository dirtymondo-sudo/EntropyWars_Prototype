# NPC ENCOUNTERS: where it stands, for the next thread (2026-11-17, end of the step 1a thread)

Read this first, then `PLAN.md` section 0 (four rounds of mondo's answers; they win over everything below them), then `STEP-1A.md`.
**mondo cannot see repo files.** Anything that needs his answer or OK goes to him IN CHAT, in full (tables, lines, pictures sent as files).
Never end a turn on "next I will": do it in the same turn.

## 1. THE CHECK: DONE 11-17, the bodies come

One probe run through `probe-fast.js` on a fully loaded city (861 of 861 files, no errors), 16:00, the Street market in Bayside
(x 100, z -6, y 1.2): `ThreeRenderer.hq.dev.residents()` said 150 residents, 150 with a day, 8 wanted near the player, 0 still loading,
8 with a body shown (Police Officer, Pirate, Chef x 2, Hippie x 3, Firefighter). mondo saw the same in the game ("i can see npcs in bayside
there just not a lot bc there is barely over 1 resident per plot"). So the two empty runs were the half-loaded probe; `drawn` stays 20,
nothing in `_hqTickResidents` was wrong. What is true: the city is THIN (150 people on 144 plots; 8 within 70 m of the market at 16:00),
so the limit of 20 is never reached. More people is the spawn system's counts, not a bug.

Probe lesson: the city's first load in a new container took 7 minutes and the browser was then killed for memory twice, because a
crashed attempt leaves its browser running. Before a rerun: `pkill -f playtest_city.js; pkill -f chrom; pkill Xvfb`, and run nothing
heavy (a headless `load-data.js` script) beside the probe. With the file cache warm the city loads in about 330 s.

## 2. What is built and live

| What | Where |
|---|---|
| Bayside's list fixed: Homosapien out of the city, Lifeguard x 2, Skater x 2, Florida Man x 1 in; the Ghost never leaves the hotel | data.js `HQ_CITY_RESIDENTS`, `HQ_SPAWN_RULES...people`; notes `docs/notes/npc-system.md` "THE BAYSIDE LIST + THE RACE PASS" |
| 150 residents, every district 16+; cops in every district but Southside, on a city-wide `beat` | same file, "THE 144 + THE BEAT" |
| Up to 20 bodies near you, the same on every machine | `drawn` 20, `drawnLow` 20, `bodies` 26 |
| New row fields: `h` (own shift starts), `beat`; place `f:<feature id>`; `walkOn` (the skate pad) | data.js `hqSpawnExpand`, `hqResidentPlace`, `hqCityGrid` |

Nothing of the encounter system itself (tempers, marks, ladder, muggings, giving up) is built.

## 3. What mondo decided in this thread (all in PLAN.md section 0, rounds 3 and 4)

- Tempers for Bayside: Chef, Hippie, Skater, Popstar = Civilian; Police Officer, Lifeguard = Guard; Pirate, Florida Man = Opportunist; Ghost = Territorial inside the hotel.
- The Pirate is in no group. A Guard defends its district's Civilians; no exceptions written.
- The mugging: a flat chance per game day (no health or level test). The level gap of 8 still holds.
- Every lost story fight costs gold, quest fights too: 8 gold x the strongest enemy's level, never more than held; a retreat costs nothing.
- People passing through from other districts use the plan's example tempers now; levels are fluid, not tuned here.
- The 12 lines of `STEP-1A.md` section 4: "fine for now".
- **The eye is on the PLAYER, by the portrait in the HUD** (as in Skyrim and the battle; OK'd to build 11-17); the red `!` is over the NPC that is coming for you or will step in.
- At least 144 residents; cops work the whole city; Homosapien is no race.

## 4. Waiting for mondo

1. ~~Mock-up 2 of the marks~~ **ANSWERED 11-17: "eye can be by the portrait, okay to build".** The eye sits by the player's portrait in the HUD (picture `step-1a-marks2-eye-by-portrait.jpg`), the red `!` over the NPC. Step 2 is free to build once step 1b is in.
2. **The race table** (`RACE-HOMES.md`): the city's placeless races are housed now. Still placed nowhere: Pope, Televangelist, Haunted Doll,
   Wendigo, Mole Man, Quetzalcoatl, Cicada Brood, Boltzmann Brain, Symbiote, Sewer Gator, Karate Frog, Samurai Slug. They belong to zones
   other threads hold: a board note for each zone is owed (not written yet).
3. Three guesses he has not confirmed: the Ninja in Hero Plaza, the Cursed TV at Southside's Pawnshop court, Industrial's mix.
4. Homosapien's three hand-placed spots (one in the city room by the harbour, two in Beach rooms) and its stats / spells / finisher still exist.
5. Cops who live in Southside still walk home through it; their beat does not go there.

## 5. Next steps, in order

1. ~~Section 1's check.~~ Done (section 1).
2. **Step 1b** (all its inputs are approved): the tempers, groups, lines and numbers into data.js as `HQ_NPC_TEMPERS` + `hqNpcTemper`,
   `hqNpcGroup`, `hqNpcSameGroup`, `hqNpcDefends`; nothing reads them yet. A full draft is `STEP-1B-DRAFT.js.txt` beside this file (written,
   never loaded or checked): put it after `hqSpawnExpand()` in data.js, `node --check`, bump the `?v=` token, merge, `node sync-zip.js --upload`.
3. **Step 2** (awareness + the marks): his OK is given (the eye by the portrait, the red `!` over the NPC). Build it after step 1b; a proof picture goes to him in chat.
4. Then PLAN.md section 6 as written: 3, 4, 5a, 6a, 6b, the GATE (he plays Bayside), S beside them.

## 6. Probe notes learned here

- The city needs about 250 s to load in the cloud browser and often reports ROOM NOT READY; give views a long first `settle`.
- The road by the Street market is 1.2 m over level 0: a teleport there needs `"y": 1.2` or the walker stands in the road.
- Changing the clock twice in one run closed the browser once. One hour per run.
- A mock-up drawn onto a finished screenshot (PIL + a small HTML page) takes a minute; a new probe run takes ten.
