# NPC ENCOUNTERS: where it stands, for the next thread (2026-11-17, end of the step 1a thread)

Read this first, then `PLAN.md` section 0 (four rounds of mondo's answers; they win over everything below them), then `STEP-1A.md`.
**mondo cannot see repo files.** Anything that needs his answer or OK goes to him IN CHAT, in full (tables, lines, pictures sent as files).
Never end a turn on "next I will": do it in the same turn.

## 1. CHECK THIS FIRST (not verified)

After the city went from 80 to 150 residents and the body limit from 8 to 20 (PRs #1989, #1993, both live), two probe runs showed
**no resident bodies at all**. `ThreeRenderer.hq.dev.residents()` said: 150 residents, 150 with a day, 7 wanted near the player, 0 with a body.
In both runs the room had not finished loading (574 and 668 of 860 files after 240 s on the software browser), and the run before the
150 (80 residents, limit 8) did show bodies. So it is probably the slow probe, but it is NOT proven. First job of the next thread:
one probe run that waits until the room is fully loaded, then reads `dev.residents()` and photographs the Street market at 16:00
(x 100, z -6, y 1.2, face 0). If bodies still do not come: look at `three-renderer.js` `_hqTickResidents` with `drawn` 20 / `bodies` 26
and fix it; if nothing else works set `HQ_CITY_RESIDENTS.drawn` back to 8 and tell mondo. He can also see it himself in ten seconds:
walk Bayside and look for people.

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

1. Section 1's check.
2. **Step 1b: DONE 11-17.** The draft is in data.js right after `hqSpawnExpand()` (loaded headless: every race name exists; a Police Officer defends a Chef, not a Pirate; the Ghost is Territorial). The draft file is deleted. 28 races that live in the city have no temper yet (they behave as today): Priest, Ki Fighter, Swordfighter, Conspiracy Theorist, Cult Leader, Halfdemon, Men in Black, Spy, General, Honda Civic, Mad Scientist, Reptilian, Telepath, Antihero, Nephilim, Clown, Ringmaster, Quarterback, Luchador, Juggernaut, Knight, Astronaut, Marksman, Cursed TV, Super Sentai, Ninja, Magician, Referee. They wait for their district's pass. What it was (all its inputs are approved): the tempers, groups, lines and numbers into data.js as `HQ_NPC_TEMPERS` + `hqNpcTemper`,
   `hqNpcGroup`, `hqNpcSameGroup`, `hqNpcDefends`; nothing reads them yet. A full draft is `STEP-1B-DRAFT.js.txt` beside this file (written,
   never loaded or checked): put it after `hqSpawnExpand()` in data.js, `node --check`, bump the `?v=` token, merge, `node sync-zip.js --upload`.
3. **Step 2** (awareness + the marks): his OK is given (the eye by the portrait, the red `!` over the NPC). Build it after step 1b; a proof picture goes to him in chat.
4. Then PLAN.md section 6 as written: 3, 4, 5a, 6a, 6b, the GATE (he plays Bayside), S beside them.

## 6. Probe notes learned here

- The city needs about 250 s to load in the cloud browser and often reports ROOM NOT READY; give views a long first `settle`.
- The road by the Street market is 1.2 m over level 0: a teleport there needs `"y": 1.2` or the walker stands in the road.
- Changing the clock twice in one run closed the browser once. One hour per run.
- A mock-up drawn onto a finished screenshot (PIL + a small HTML page) takes a minute; a new probe run takes ten.
