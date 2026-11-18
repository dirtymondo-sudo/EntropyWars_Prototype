# NPC ENCOUNTERS: where it stands, for the next thread (2026-11-18, after steps 1b, 2, 3, 4 and 5a)

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

| **Step 1b:** the tempers, groups, lines and numbers | data.js `HQ_NPC_TEMPERS`, `hqNpcTemper`, `hqNpcGroup`, `hqNpcSameGroup`, `hqNpcDefends` (after `hqSpawnExpand()`) |
| **Step 2:** awareness + the marks: the eye by the lead's portrait (green slashed / amber open), the red `!` over an alert NPC, the Ghost's warning | data.js `HQ_NPC_TEMPERS.aware`, `hqNpcActs`, `hqNpcGround`, `hqNpcOnGround`; three-renderer.js `_hqTickAware`; map.js `_hqAwareEvent`, `_hqFillDock`; styles-base.css `.hq-dock-eye`; notes `docs/notes/npc-system.md` "THE AWARENESS + THE MARKS" |

| **Step 3:** the strike ladder (REPLACES the one-strike fight): the run, cornered, the Talk box (E first too), the day's memory, the door strike, whoever starts opens round 1, the Guard who sees a strike (warning line, then it comes for you and starts its own fight) | data.js `HQ_NPC_TEMPERS.ladder` / `.guard`, `hqNpcStrike`, `hqNpcMem`, `hqNpcTalks`, `hqNpcGuardSees`; three-renderer.js `_hqLadderStruck`, `_hqTickLadder`, `hq.npcCornered` / `npcStruck` / `encounterEvent`; map.js `_hqEncounterFire` (the ladder in front of the launch), `_hqLadderTalk`, `_hqLadderFight`; battle.js `_afterVSSplash` (`opener`); notes `docs/notes/npc-system.md` "THE STRIKE LADDER" |

| **Step 4:** NPC-started fights (REPLACES "never random"): Brutes come at sight, the Ghost fights if you stay after its warning, THE MUGGING (a flat chance per game day, PAY / FIGHT), the level gap on every way of starting, every lost story fight costs gold | data.js `HQ_NPC_TEMPERS.brute` / `.ground` / `.mug` / `.levelGapOn` / `.graceMs`, `hqNpcStarts`, `hqNpcGapHolds`, `hqGameDay`, `hqNpcMugRoll`, `hqNpcMugPrice`, `hqNpcLossGold`; three-renderer.js `_hqTickAware` (who comes), `_hqTickLadder` (the chase by `why`), `hq.npcMugDone`, `dev.come`; map.js `_hqMugOpen`, `_hqMugAnswer`; battle.js the encounter commit (`lostGold`), `_stampHqSite`; notes `docs/notes/npc-system.md` "NPC-STARTED FIGHTS" |

| **Step 5a:** NPC health on the walk: a hurt NPC keeps its HP into the next fight (a fight you lost or left); whole after its Sleep block, a walker at the next game day; every enemy that went down, in any outcome, is beaten for the day (the cleared list; mondo 11-18) | data.js `HQ_NPC_TEMPERS.wounds`, `hqNpcWoundFor`, `hqNpcWoundsAfter`, `hqNpcRestHour`, `hqClockTotal` (the clock's running hours `t`); the profile's `door.hq.wounds`; three-renderer.js `_hqRestOf`; map.js `_hqEncounterFire` (`L.wounds`), the encounter start (`partyMeta[2][i].hp`), `_hqClock.t`; battle.js the encounter commit; notes `docs/notes/npc-system.md` "NPC HEALTH ON THE WALK" |

Not built yet: the drive-by (mondo 11-18: skip it for now), giving up, everything from step 6a on. Nothing shows a hurt NPC's HP on screen (a UI change: mock-up first). A race with no temper still fights on the first strike.

**ANSWERED 11-18: "All those numbers look good" (the numbers of steps 2, 3 and 4 are his now).** His changes: skip the drive-by for now; a story fight
that is not won pays no match pay (built); cops always come, the level gap does not hold a Guard (built: `'defend'` out of `levelGapOn`); Brutes in every
zone are fine; the five muggers' lines are OK'd and in. What was asked: the mugging 0.25 per mugger per game day (a game day = 24 real minutes of the
world clock), one try a game day, it comes at 2.7 m/s and Talks within 2.2 m; closing the box with no answer = it asks again after 4 s, you may run; PAY takes
what you hold when you hold less than the price, and is off at 0 gold; Brutes 2.7 m/s, fight within 1.9 m, give up past 32 m or 6 s unseen; the Ghost comes
6 s after its warning if you stay, or when you are within 4 m; nobody starts anything for 5 s after you enter a room; **a Guard 8 or more levels under the
party warns but does not come** (`levelGapOn` has `'defend'`); the lost gold shows as ` · LOST n GOLD` on the result screen's site line and the wake toast;
five muggers have no line yet and so do not mug (Gangster, Goblin, Politician, Televangelist, Tech CEO).

**Step 3's numbers, OK'd by mondo 11-18 ("all those numbers look good"):** the run 15 m at 2.0 m/s, cornered = no clear 5 m away
from you, rest 5 s, the ladder starts over after 30 s left alone; E first shows the NPC's ordinary line with NOTED / FIGHT (the approved Talk lines are answers
to a strike); keys 1 / E = back off, 2 = fight; the Guard warns at the first strike it sees and comes at the second (2.7 m/s, fight within 1.9 m, gives up past
32 m or 6 s unseen); the day's memory lives in the page (a reload forgets it) and "day" is the calendar day, as the beaten-today ledger.

**What step 2 could not show in a picture** (say it to mondo if he asks): the red `!` in the proof picture was held on a Police Officer with
`dev.awareMark` (the real trigger, a Guard who sees you while your aim is on someone it defends, was checked headless through `hqNpcActs`,
not staged in the street); the Ghost in its hotel at night was not photographed (the browser died for memory at 23:00 twice): its warning's
code path was run by day with a Chef standing in for it in the page only.

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

1. ~~The check~~, ~~step 1b~~, ~~step 2~~: done 11-17 (sections 1 and 2).
2. ~~Step 3, the strike ladder~~: done 11-17 (section 2).
3. ~~Step 4, NPC-started fights~~: done 11-18 (section 2). The drive-by is skipped on his word.
4. ~~5a, NPC health on the walk~~: done 11-18 (section 2). ~~6a~~ OK'd 11-18 ("OK sounds good"). ~~6b, the losing NPC~~: BUILT 11-18 (npc-system.md "THE LOSING NPC"; proof pictures in `/mnt/project-files/npc-encounters/step-6b/`). Next: the GATE (he plays Bayside), S beside it.
5. 28 races that live in the city have no temper yet (Priest, Ki Fighter, Swordfighter, Conspiracy Theorist, Cult Leader, Halfdemon, Men in Black, Spy, General, Honda Civic, Mad Scientist, Reptilian, Telepath, Antihero, Nephilim, Clown, Ringmaster, Quarterback, Luchador, Juggernaut, Knight, Astronaut, Marksman, Cursed TV, Super Sentai, Ninja, Magician, Referee; they behave as today and never open the eye):
   they wait for their district's pass, which needs mondo's marks like Bayside's did.

## 6. Probe notes learned here

- The city needs about 250 s to load in the cloud browser and often reports ROOM NOT READY; give views a long first `settle`.
- The road by the Street market is 1.2 m over level 0: a teleport there needs `"y": 1.2` or the walker stands in the road.
- Changing the clock twice in one run closed the browser once. One hour per run.
- A mock-up drawn onto a finished screenshot (PIL + a small HTML page) takes a minute; a new probe run takes ten.
- A crashed probe attempt leaves its browser running and the next attempt dies for memory: `pkill -f playtest_city.js; pkill -f chrom; pkill Xvfb` before a rerun, and nothing heavy beside the probe.
- The city at night (clock 23) killed the browser for memory right after the room was ready, twice. By day it holds.
- To stand next to somebody: `dev.chars()` rows carry `race` and `away`; a view with `"keep": true` stays where the last view's `eval` put the walker.
