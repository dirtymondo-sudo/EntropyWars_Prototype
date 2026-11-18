# NPC ENCOUNTERS: the plan and the guide (rev 6, 2026-11-17, mondo's answers to the review, rounds 1 and 2, are in: section 0)

mondo uploaded an NPC encounter concept (v0.3, made with another AI that did not know the game; kept word for word in
`concept-v0.3.md` beside this file). This file fits that concept to Entropy Wars as it stands on main today: the roster,
the zones, and what is already built. Nothing here is built by this file.

**REVIEWED 2026-11-17 (Fable): `REVIEW.md` beside this file** holds step 0 (the check-up, done) and a critique from the
player's side with 12 questions for mondo. Read it before any build step. Rows below marked **(step 0)** were corrected from it;
no design decision in this file was changed.

**STEP 1A IS DELIVERED (2026-11-17): `STEP-1A.md` beside this file** (Bayside: tempers, groups, the mix, the lines, the marks' mock-up, the cost of a lost fight, 7 questions). It waits for mondo's marks; step 1b starts after them.

**This is a NEW encounter system, and it is meant to replace the old encounter rules** (mondo, 11-17: "we are making a brand
new encounter system. The rules are going to change"). Where the concept differs from how the game works today, the concept
is the target and the old rule is what gets changed; such parts are marked **REPLACES**. Details the concept left open
(numbers, which race does what, the words NPCs say) are still **PROPOSALS** for mondo to set; the questions are in section 8.

## 0. REV 5: mondo's answers to the review (2026-11-17). These win over anything below that says otherwise

The review is `REVIEW.md` beside this file. His answers, in his order:

| # | Topic | His answer | What it changes |
|---|---|---|---|
| 1 | Show it | Yes, **symbols only, keep it simple.** The battle already has the closed and open eye for "an enemy sees you": use those on the walk. Add one red mark (an exclamation mark or the like) for aggression. | No temper word, no text list. Step 1a mocks up three marks: eye closed (has not seen you), eye open (sees you), red mark (coming for you / will step in). 4.1, steps 1a + 2. |
| 2 | Level gap | Yes, a level gap rule is needed. | An NPC far under the party's level never starts a fight (PROPOSAL: 8 levels). 4.3, step 4. |
| 3 | Who opens | Yes. | Whoever starts the fight acts first in round 1. 4.2 / 4.3, step 3. |
| 4 | Surrender | Yes. | Giving up is a state on the unit, answered on the player's own turn. Replaces "offers on the NPC's turn" in 4.4. Step 6. |
| 5 | Joining | "Maybe when they join you use a door on them automatically and they are detained back to DOOR HQ, like you are just reality cop making a routine arrest." | **THE ARREST:** a unit that gave up and is taken goes through a door on the spot, to DOOR HQ (the holding tank of npc-system.md delivery 4 is where it lands). Replaces "Join you" in 4.4. Open: does it use up a door from the bag (section 8). |
| 6 | The third side | Free for all used to be in the game; it should not be hard to add; "if its hard to add to our game then that means the battle code and architecture is written like shit and needs to be fixed". | The third side stays in, and the code is fixed first: **step S, the one side question** (section 6). Found 11-17: no mode sets `isFFA` any more, but about 40 FFA paths are still in battle.js, ai.js and map.js to build on. |
| 7 | One street first | Fine, "just dont forget to add crowds as a clear step after the street test otherwise it will be forgotten". | Bayside first, then the gate (he plays it), then **CROWDS as its own named step, never skipped** (section 6). |
| 8 | Awareness per machine | "We should just get rid of that, the game is the game and if you have a bad pc then tough shit. The player experience should be the same." | NPC behaviour is the same on every machine. The weak-PC cut (`HQ_CITY_RESIDENTS.drawnLow`, three-renderer.js `EW_PERF_LOW`) goes in step 2; the row is the spawn system thread's, so a board note first. |
| 9 | XP when the third side downs an enemy | "I dont see a problem with that right now." | Nothing. The victory pool stays as it is. |
| 10 | The door strike | It should be in the plan. | In 4.2. PROPOSAL: a standing door that hits an NPC counts as one strike of the ladder (section 8). |
| 11 | Escape and the ladder | "Need to track health outside of battle then, already do for the player and party so it should be easy to implement for NPCs." | **NPC health carries on the walk** (new step 5a). An NPC that escaped a fight keeps its wounds. 4.5. |
| 12 | Cops and civilians | Cops should protect civilians. A cop not protecting one certain unit is fine if it is a special case between those two. | A Guard defends the Civilians of its district (4.6, 3.2). Exceptions are rows (this race does not defend that race); none is written until he names one. |

### Round 2 of his answers (2026-11-17, rev 6). Nothing from the review is open any more

| # | Topic | His answer | What it changes |
|---|---|---|---|
| 1 | THE ARREST | Free: "what happens if they offer to join but you have no door in your bag? i dont want to worry about that so just make it free". | The arrest uses up no item. The bought One-Way Doors stay the way to take a unit that has NOT given up. Step 6. |
| 2 | An NPC's wounds | They heal at the next game day "or after they sleep". | A resident with a day is whole again after its Sleep block; a walker with no day at the next game day. Step 5a. |
| 3 | The level gap | 8 is fine. | An NPC 8 or more levels under the party never starts a fight. A number in data. Step 4. |
| 4 | Losing | "yes. every loss should lose you money". | **A rule for every lost fight, not only a mugging: a loss costs gold.** Replaces "a loss costs nothing" (`HQ_PARTY_RULES.lossRestore` still heals the party). The amount is a PROPOSAL for step 1a to put to him (a first idea: 8 gold × the strongest enemy's level, the pay-off table turned round, never more than he holds). Built in step 4; `owner-rules.md` §4 has the rule. |
| 5 | The door strike | Yes. | A standing door that hits an NPC is one strike of the ladder. Step 3. |
| 6 | Joiners | "no cap". | No cap on the total and no limit per round end: everyone aware and willing joins at the next round end (rev 4's rule stands). The review's "2 per round" is dropped. |
| 7 | Opportunists | Okay. | An Opportunist never joins a fight; it comes for the winner afterwards if the winner is weak. Replaces its row in the onlooker table of 4.6. |
| 8 | Spell preview | Yes. | The area preview marks an onlooker it would hit, before the cast. Step 7a / 7b. |
| 9 | The pay-off items | Yes. | One certain roll on the spoils table; a second certain roll only from level 20 up. Replaces "2 rolls" in 4.4. |
| 10 | The Superhero as city-wide backup | Leave it for the wanted system. | Nothing now. |
| 11 | Step 1a | Starts in a fresh thread once these answers are in this file. | Step 1a is free to start. |

### Round 3 of his answers (2026-11-17, to step 1a's seven questions; `STEP-1A.md`)

| # | Topic | His answer | What it changes |
|---|---|---|---|
| 1 | Who wears a mark / the 8 bodies | "i dont like this whole only 8 bodies being drawn rule, that seems very limiting ... for a populated area i dont see why we can do like 20". | Built 11-17: `HQ_CITY_RESIDENTS` `drawn` 20, `drawnLow` 20 (the weak-PC cut of answer 8 is gone with it), `bodies` 26. Found: with 80 residents the most ever within 70 m is 12, so seeing 20 needs more residents, not a higher limit. Who wears a mark was not answered in words: the pick stands until he says otherwise (every NPC you can strike within 25 m). |
| 2 | The Ghost | Territorial inside the hotel. | As proposed. It never leaves the hotel (built). |
| 3 | The Pirate's group | No group. | As proposed. |
| 4 | The mugging | "flat chance per gameday, the other way is too complicated right now". | No health or level test. A flat chance per game day; the number is a PROPOSAL for step 4. The level gap rule (8) still holds. |
| 5 | A lost quest fight | "yes fights should lose you gold". | Every lost story fight costs gold, quest fights too. |
| 6 | People passing through | "that is the price for getting in a fight in view of police. Im not too worried about the levels right now, all that stuff is fluid". | Races with an example in 3.1 get that temper now, wherever they walk. Levels are not tuned in this plan. |
| 7 | The cost of a lost fight | The first way. | 8 gold x the strongest enemy's level, never more than he holds; a retreat costs nothing. Step 4. |

**Round 4 (2026-11-17, in chat):**
- **The lines:** "these lines are fine for now". The 12 lines of `STEP-1A.md` section 4 are approved for step 1b.
- **THE EYE IS ON THE PLAYER** ("yes, eyes on player and red ! on npcs", as in Skyrim and the battle): one eye by the player, closed = nobody who
  would act sees you, open = someone does (Guards, muggers, the Ghost count; harmless people do not). The red `!` stays over the NPC that is coming
  for you or will step in. This REPLACES "an eye over every NPC" in answer 1 of round 1, in 4.1 and in step 1a's pictures. The mock-up is redone
  and shown to him before step 2 builds it.
- **Mock-up 2 OK'd (11-17): "eye can be by the portrait, okay to build".** The eye sits by the player's portrait in the HUD; step 2 may build it.
- **The city:** at least 144 residents (150 built), cops in every district but Southside and on a city-wide beat: `docs/notes/npc-system.md` "THE 144 + THE BEAT".
- **He cannot see the repo's plan files:** anything that needs his answer or OK is put to him in chat, in full.

How to read the marks:

| Mark | Means |
|---|---|
| **BUILT** | In the game on main today. The code is named so a thread can check it. |
| **PARTLY** | Some of it exists; the gap is spelled out. |
| **NEW** | Nothing exists yet. |
| **REPLACES** | The new system changes a rule the game has today. The step that builds it also removes or rewrites the old rule and its notes. |
| **PROPOSAL** | A detail the concept left open (a number, a race's behaviour, a line). Needs mondo's yes before it is built. |

Model picks: **Fable** = `claude-fable-5-2`, **Opus** = `claude-opus-5-5`. The rule used in section 6: Fable for the wide
passes (design, reading the whole roster, writing proposals and mock-ups, audits, the final review); Opus for the steps that
are mostly code in the big game files (data.js, three-renderer.js, battle.js, ai.js, map.js) and need exact edits plus a
browser proof.

---

## 1. What the concept got right, and what it did not know

**Kept from the concept:** the three answers Flee / Talk / Fight; a few reusable behaviour presets instead of stats per
NPC; the fight happening where you stand; NPCs escaping a fight by breaking line of sight; witnesses and crowds; nearby
NPCs acting at the round boundary, never in real time during turns; NPCs calming down but remembering. The concept's own
closing line is the right rule: few presets, few universal reactions, clear limits, lasting results.

**What it did not know (fitted in this plan; the old rules named here are the ones the new system REPLACES):**

1. **Today one strike starts a fight (REPLACES; REPLACED 11-17 by step 3, the ladder is live).** In a wild room, a left click with the door gun holstered swings the
   walker's basic attack; on the swing's strike frame the fight starts at once (three-renderer.js `_hqStrikeClick` →
   `_hqEncounterAim` → data.js `hqEncounterLaunch`). The new system puts the temper's ladder (Flee → Talk → Fight, three
   strikes at most) in front of that launch.
2. **Today only the player starts fights (REPLACES).** The 09-15 rule "never random" (seamless-field-encounter.md) and the
   one exception of 11-16 (rare muggings and drive-bys, npc-system.md round 2) give way to the concept's rule: Brutes attack
   when they see you, Territorials after a warning, Opportunists when you look weak. The muggings become one case of this.
   Pacing still matters (his 11-16 words: "enough to feel alive, never annoying"), so how often is a number to set (Q2).
3. **The old factions are gone** and play no part here (mondo 11-17). In their place: natural GROUPS of races who stand
   up for each other (cops and firefighters; several of the same race), section 3.2.
4. **No followers, units named after their race** (owner-rules.md §2). "Bandit joins the party" cannot mean a follower in
   the walk; the party is the party sheet. And there is no Merchant, Bandit or Bartender race: the plan uses the real roster
   (section 3).
5. **Allies cannot be struck at all.** `hqEncounterCharOk` refuses story cast, agents, the clone and the online shift, and
   DOOR HQ is a safe hub (story characters only, never a wild room). So the concept's "ally attack rules" are already
   decided: you cannot attack them. Kept as is.
6. **Recruiting today is the One-Way Door capture** (`hqCaptureEnlist`, ONE OF EACH + the planned holding tank). The
   concept's "join the party" offer is IN (mondo 11-17) and lands through the same enlist.
7. **No shops in the zones, no spell learning from people, no quest clues yet.** mondo 11-17: shops and items need their
   own plan; he has his own spell-learning concept; clues wait for more quests. So the merchant discount, the wizard's
   spell and the bartender's information are left out of this plan.
8. **The offers that stay** are what a losing NPC can give now: money, health potions, revives (mondo 11-17), joining
   you, or being spared.
9. **The NPC spawn system already exists and is being built** (npc-system.md, claims row "Disaster City NPCs: the spawn
   system", held by the second account): set levels per district and tier, variants, caps that refill, zodiac, the boss
   sheet, spontaneous events. This plan sits ON TOP of it and must not rebuild any of it (section 7).
10. **Online is not touched.** Exploration, residents and walk-ins are story mode on one machine; nothing is on `state` or
    relayed (RULE #2 bites only if a fight rule used online changes). Every step below stays story-only
    (`isOnlineMatch` refuses an encounter today).

---

## 2. What the game already has (the inventory)

| Piece | State | Where | Notes |
|---|---|---|---|
| Strike to fight (one swing) | **BUILT** | three-renderer.js `_hqStrikeClick`, `_hqEncounterAim` (reach 3.4 m, 55° cone, line of sight); data.js `HQ_ENCOUNTER_RULES`, `hqEncounterLaunch`; map.js `_hqEncounterFire`, `_hqEncounterStart` | The fight is Team Deathmatch, team size 4 (`gm: 'tdm'`). |
| Who may be struck | **BUILT** | data.js `hqEncounterCharOk`, `hqEncounterRoomOk` | Natives and residents only; never cast, agents, Men in Black; never the facility (DOOR HQ). |
| The fight on the room itself | **BUILT** | data.js `hqFieldFrame` (whole room up to 24 × 24, else a crop round the feet), `hqFieldRaster`, `hqEncounterSeats` | Everyone fights from the cell they stood on. The concept's "no artificial repositioning" is done. |
| The arrival + the dash-in | **BUILT** | `HQ_ENCOUNTER_RULES.arrival`, three-camera.js `seedPose`, battle.js `_encPartyDashIn` | One camera move from the walk into the fight; the party jumps in behind the lead. |
| Walking groups | **BUILT** | room `encounters.group: [min, max]`; `_hqEncounterTargetOf` hands the group's members to the launch | Strike one native and its walking group fights too. Residents walk alone. |
| Player escape by line of sight | **BUILT** | battle.js `escapeProblem`, `_escapeWalkPath`, `_escapeRemove`, `_escapeAll` (THE RETREAT); data.js `HQ_ESCAPE_RULES` | A unit no enemy can see may slip out for its AP; Team escape at 75 % hidden. Story fights only. |
| Back to the walk after a fight | **BUILT** | `_hqEncounterResult`, map.js `_hqReturnOrMenu`, `hqEncounterEndSpot` | A win lands the lead on its end cell; a retreat at the entry door; a loss at the ward. |
| Talk (E) | **BUILT** | map.js `_hqInteractTarget` → `_hqOpenPanel`; room `npcSpots[].say` lines; quest talk scenes `_questTalkScene` | A panel opens and every walker in the room freezes while it is up (`H.paused`). Lines are fixed per spot; no choices. |
| Residents with a day | **BUILT** (Disaster City only) | data.js `HQ_CITY_RESIDENTS`, `hqResidentTimeline`, `hqResidentAt`, `hqCityGrid`; three-renderer.js `_hqResStart`, `_hqTickResidents` | Work, out, sleep, patrol on the world clock. This IS the concept's "routine". |
| Other zones' walkers | **BUILT** | data.js `hqRoomPopulation`, `HQ_AREA_ENCOUNTERS` / room `encounters` (`list` of race + weight, `walkers`, `levels`, `group`); three-renderer.js "THE ROUNDS" (loops of stops on the room's nav) | No day, no memory; they walk loops. |
| Set levels, variants, tiers | **BUILT** (city) | data.js `HQ_SPAWN_RULES`, `hqSpawnLevel`, `hqSpawnExpand` | npc-system.md deliveries 1 + 2. |
| Beaten = gone until tomorrow | **BUILT** | data.js `hqEncounterRecord` → `door.hq.cleared[room]`, `hqEncounterCleared` | Real calendar day. The cap + 3-game-day refill is npc-system.md delivery 3 (not built). |
| Capture | **BUILT** | battle.js "THE ONE-WAY DOOR", data.js `CAPTURE_RULES`, `hqCaptureEnlist` | The holding tank (delivery 4) is not built. |
| Quests | **BUILT** (one quest) | data.js `STORY_QUESTS`, `QUEST_FIGHTS` (`orientation_portal`) | The boss / scripted battle sheet is npc-system.md delivery 6 (not built). |
| Running away inside a fight | **PARTLY** | battle.js Feared ("flees in terror", one flee ends the fear); ai.js hazard flee | The AI can run from danger; it never leaves the fight. NPC escape is NEW. |
| The round boundary | **BUILT** | battle.js `state.round`, `processEndOfRoundStatuses`, `processEndOfRoundZonesAndSeeds`, `processEndOfRoundRegen`, `showEndOfRoundOverview` | The concept's "reuse the end-of-round phase" has a real place to hook in. |
| Other walkers during a fight | **BUILT** (step 0) | map.js `_hqEncounterStart` → `_hqLeave`; three-renderer.js `_hqBuildRoomInBattle`, `_rigCarry*` | Confirmed: the walk is left and the room is rebuilt round the field, so nobody watches. An onlooker is a new thing in the fight's scene; the rig hand-over can carry its body across. |
| Awareness (an NPC notices you) | **NEW** | | Walkers do not look at you, turn, step aside or react. |
| NPC-started fights | **NEW** (REPLACES "never random", see 1.2) | | The approved muggings / drive-bys (npc-system.md delivery 7) are NOT built on main yet; step 4 builds them. |
| Offers in a fight (talk mid-fight) | **NEW** | | |
| Witnesses, spectators, joining a fight | **NEW** | | |
| NPC-to-NPC trouble | **NEW** | | |

---

## 3. The tempers, the groups and the room mix

### 3.1 The tempers
The concept's presets become one small field per race, the **temper**. "Typical enemy" is folded into Opportunist and
Brute. Merchant waits for the shops plan (mondo 11-17: items and shops get their own plan and threads). Step 1a tags the
races of **Disaster City first** (the vertical slice); other zones come later. Every pick below is an example.

| Temper | Normal life | When struck | Examples (PROPOSAL) |
|---|---|---|---|
| **Civilian** | Its day; steps out of your way | Flee → Talk → Fight | Hippie, Professor, Librarian, Chef, Delivery Boy, Mime, Bunny Girl, Influencer, Banker, Skater, the city's ordinary people |
| **Coward** | Avoids you | Flee → Talk → Fight (the full three) | Rabbit, Gnome, Fairy, Unicorn |
| **Guard** | Patrols or stands at its post; watches you | Fight (a one-line warning first if you only trespass) | Police Officer, Sheriff, Time Cop, Lifeguard |
| **Territorial** | Holds a spot (a lair, a field, a gate); warns you when you come close | Talk (the warning) → Fight | King Kong on his field, Yeti, Bigfoot, Minotaur, Sewer Gator |
| **Protector** | Lives normally; steps in when its place, its people or its group is hit | Fight when it steps in | Superhero (male + female), Sidekick, Firefighter, Eagleman |
| **Opportunist** | Sizes you up; comes at you when you look weak | Talk → Fight; may run when losing | Gangster, Goblin, Pirate, Florida Man, Politician, Televangelist, Tech CEO |
| **Brute** | Comes at you when it sees you | Fight, no Talk (mondo 11-17: some skip Talk) | Zombie, Shadow Entity, Werewolf, Wendigo, Ghoul, Flesheater |

Rules for every temper:
- **Three strikes at most** to a fight for the most reluctant. A temper may skip steps, never add.
- **The ladder starts over** when an NPC that fled is struck again later (mondo 11-17, Q15): three strikes again, never more.
- Roles are tags on top: `boss` (the boss sheet, npc-system.md delivery 6), `unique` (the one-of-a-kind tier), `wildlife`
  (growls instead of Talk).
- **Nobody blocks a path** while it flees, watches or warns. No followers. DOOR HQ keeps story characters only and stays safe.
- The temper is per race, with overrides per room and per resident (a Police Officer off duty could be a Civilian).

### 3.2 The groups (NEW, mondo 11-17, needs more design: step 1a)
The old factions are gone and have nothing to do with this. A **group** is a natural group of races who stand up for each
other: hit one and the others of its group who are AWARE may step in. mondo's words: "based on natural groups, like cops
and firefighters", and "attacking one race while there are multiple of that race around, they would probably wanna defend
and hop in the fight too".

Two rules, both PROPOSALS:
1. **Same race:** every unit of the race you hit is in its group automatically (hit a Police Officer near two others).
2. **Named groups:** a short list of races that back each other. A first draft for Disaster City (step 1a finishes it):

| Group (plain name) | Races (PROPOSAL) |
|---|---|
| Emergency | Police Officer, Firefighter, Sheriff, Time Cop, Lifeguard |
| Heroes | Superhero (m + f), Sidekick, Eagleman, Antihero? |
| Street | Gangster, Goblin, Florida Man |
| Show people | Clown, Mime, Ringmaster, Popstar, Bunny Girl |
| The dead | Zombie, Ghoul, Flesheater, Ghost |

Whether a group member steps in still goes through its temper: a Protector or Guard of the group steps in, a Civilian of
the same race may only flee or shout. A unit can be in one named group at most (keeps it readable).

### 3.3 The room mix (mondo 11-17, Q2: "depend on the room and the unit")
How hostile a place is comes from the room, not one global number. Each room's `encounters` row (it exists already) gets
a temper mix: Hell can be almost all Brutes, a quiet street almost no one hostile. The unit's own temper still decides what
it does; the room decides who is there. No global cap on NPC-started fights, and no calm timer (mondo 11-17, Q23): every Brute that
was aware of a fight joins it (4.6), so when a fight ends the ones left around you never saw you. If back-to-back fights
still show up when he plays it, a calm time is added then.

---

## 4. The design, part by part

### 4.1 Awareness (NEW)
An NPC can see you without anything happening. On the walk that means a head turn, a look, a step aside, and a line over
the head for a Guard or Territorial. Line of sight reuses `_hqLosClear`. Only drawn bodies (8 near you, 4 on a weak PC)
are aware, so it costs nothing for the timelines with no body. **Awareness is also what decides who joins a fight** (4.6):
an NPC that did not see or hear it never joins. Confidence is computed (party HP against its own level from
`hqSpawnLevel`), never stored.

### 4.2 The strike ladder (REPLACES the one-strike fight)
Strike 1 makes a Civilian run (slower than you, along the nav, to its home or work door); strike 2 makes it stop and Talk
(the panel opens and walkers freeze as today; choices "Back off" / "Fight"); strike 3 starts the fight as today. A Guard
or Brute fights on strike 1. E before you swing opens Talk with "Fight" among the choices, except for tempers that skip
Talk. The count lives on the walking body, is not reset by an apology, and starts over after the NPC has fled and you meet
it again (3.1). The first quest's fight is a quest fight (`QUEST_FIGHTS`) and keeps its own start.
**Rev 5:** whoever starts the fight acts first in round 1 (the hook is `window._ewEncounterFirstId`). A standing door of the door
gun that hits an NPC (three-renderer.js `_hqGunDoorStrike`) is on the ladder too; PROPOSAL: it counts as one strike. A Civilian's run
is short (PROPOSAL: about 15 m or out of sight), and one with no way out skips the run and Talks.

### 4.3 Who starts a fight on its own (REPLACES "never random")
- **Brute:** sees you, comes at you, the fight starts when it reaches you. You can outrun it or break its sight.
- **Territorial:** warns once when you step onto its ground, fights if you stay or come closer.
- **Opportunist:** comes at you when your party looks weak and Talks first: this IS the mugging. It may give a reason in
  its line ("Nice shoes."), as mondo liked (Q16).
- **Guard / Protector / group members:** when they see you strike someone of their own (3.2) or their place.
- **Never:** in DOOR HQ or during a cutscene or quest scene.
- **Note for mondo:** the muggings and drive-bys are not in the game yet (npc-system.md delivery 7, not built on
  main: no code for them in data.js or three-renderer.js on 11-17). This step builds them.

### 4.4 Talk in a fight and the offers (NEW)
**Rev 5 (his answers 4 + 5):** giving up is a STATE on the unit, not a panel on its turn. The hit that leaves it alive under its
line makes it give up at once: it stops acting and shows it. The player answers on their own turn: hit it (refuse) or Talk to it
(the panel: pay-off, the arrest, or let it go). "Join you" below is now THE ARREST: a door opens on it and it is sent to DOOR HQ.
The text below is rev 4 and stands only where it does not disagree with this.

A losing NPC may offer something on its own turn (it spends that turn, so turn order never pauses). The player answers in
a panel that obeys the back keys (Escape, E, right click). What it can offer now (mondo 11-17):

| Offer | Result | Notes |
|---|---|---|
| **Pay you off** | Gold + items into the bag (the table below) | The bag and the spoils exist |
| **Join you** | It joins the party through `hqCaptureEnlist` (party, else roster, else the holding tank) | mondo said yes (Q6); same ONE OF EACH rule as a capture |
| **Spare me** | The fight ends, it flees | Counts as beaten for the cleared ledger and the refill |

**The pay-off (PROPOSAL by Claude, mondo 11-17 Q24 "you propose").** It follows his spoils rule ("don't give different
units different drop rates"): the items come from the same `HQ_DROP_RULES` table every fallen enemy rolls on, the same
for every unit; only the gold grows with the NPC's level, as XP and bounties already do.

| Part | Amount | Why |
|---|---|---|
| Gold | 8 × the NPC's level (a level 5 Chef pays 40, a level 20 cop 160, the level 50 Superhero 400) | A health potion costs 40, so an early pay-off buys about one potion; the 40 / 80 / 160 capture bounty sits in the same range |
| Items | 2 rolls on the spoils table, each certain to drop (a kill is one roll at 60 %) | You give up the kill's XP, so the deal must beat a kill's drop; the table's own weights keep revives rare (4 %) |
| Nothing else | No XP | The XP is what you trade for the goods |

Not now (mondo 11-17): shops and discounts (their own plan), learning spells (his own concept comes later), information
and clues (wait for more quests). The lines: as few as the system needs to work, Claude drafts, mondo approves.

### 4.5 NPC escape from a fight (NEW)
Reuse the player's escape turned around (no player unit sees it, it has the AP). The AI (ai.js) gets one more choice for
tempers that may run (Civilian, Coward, Opportunist when losing). An escaped NPC is out of the fight, counted "escaped"
(not beaten, not captured), runs on the walk afterwards, and its ladder starts over when you catch it (3.1).
**Rev 5 (his answer 11):** an NPC's health carries on the walk as the party's does (step 5a), so an escaped NPC keeps its wounds.
PROPOSAL: it is whole again at the next game day. **(step 5a, built 11-18: whole after its Sleep block, a walker at the next game day; mondo's round 2 answer 2.)**

### 4.6 Witnesses, onlookers and joining (NEW, the big design job)
mondo 11-17 (Q12, Q13): anyone in the room who is aware and wants to fight may join, as many as there are; and how an
onlooker reacts depends on the unit, not one fixed rule. What stays fixed:
- **Who reacts:** drawn bodies that saw or heard it (4.1). Everyone else carries on with its day.
- **When:** everything moves at the existing round end (after `processEndOfRoundRegen`, before `showEndOfRoundOverview`).
  Shouts and flinches play at once and cost nothing. A joiner gets its first turn next round, never two actions in one round.
- **Onlookers are not units** until they join: free squares outside the seats, skipped by turn order, they step aside for
  any move. They are the same rigs already drawn on the walk.

**What an onlooker does** (PROPOSAL, by temper, with a roll so it is not always the same):

| Temper | Sees a fight | Hit by a stray spell |
|---|---|---|
| Civilian / Coward | Watches from a distance or flees | Flees, or brushes it off |
| Guard / Protector | Comes closer; joins if its group or place is involved | Joins against whoever hit it |
| Opportunist | Watches; joins the side that is winning | Joins against whoever hit it, or flees |
| Brute | Joins, against whoever is nearest | Joins against whoever hit it |
| Territorial | Joins only if the fight is on its ground | Joins against whoever hit it |

**The sides (mondo 11-17: option C).** mondo asked: if an ENEMY's spell hits an onlooker, does it join your side? Can it
be free for all? Can it fight the enemy and stay neutral to you? Options, using what the engine has:

- **A. Two sides only.** A joiner picks yours or the enemy's. Simple, but "it hates the enemy and is not your friend"
  cannot happen.
- **B. Free for all.** Everyone is everyone's enemy. The engine already has it: battle.js `isAllyUnit` / `isEnemyUnit` turn
  on `_isFFA()` (the FFA mode). Chaotic; your own party would also fight each other, so it needs a team-aware version.
- **C. A third side with grudges (recommended).** Each joiner is its own side with a short **grudge list**: the units that
  hit it or its group. It attacks those first, ignores the rest, and anyone who hits it goes onto its list. So a cop hit by
  the Gangster fights the Gangster, stays neutral to you, you can still target it, and if you hit it, it turns on you too.
  This is exactly mondo's third option. **(step 0) It is NOT one change:** battle.js compares `.player` directly about 135
  times beside its `isEnemyUnit` calls, ai.js about 50 times (4 `isEnemyUnit` calls), and the win check, vision and the XP
  pool know two players only (REVIEW.md section 1, finding 3). It is the plan's biggest engine job. Online is not touched.

Keep to the frame: joiners above a sane count make fights long. No hard cap (mondo: "as many as ... want to fight"), but the
room mix and awareness keep it small in practice; step 8 measures a crowded street and reports.

### 4.7 Calming down and memory (PARTLY)
Routine → Threatened → Safe → Routine maps onto what exists: the resident's day goes on after the fight; beaten /
captured is the cleared ledger and soon the cap + refill (npc-system.md delivery 3). New and small: a memory per NPC id
until the next game day (mondo said yes, Q14): struck you, fled from you, saw you fight, joined against you. A group member
remembers for its group (a cop that saw you beat a cop is wary of you that day).

### 4.8 NPC-to-NPC trouble (NEW, last)
Hand-placed situations on the same timer as the muggings: a Gangster mugs a Civilian, a Police Officer steps in, you may
watch or take a side. With option C this falls out for free: the two are already on each other's grudge lists when you
arrive. Each situation is a data row (who, where, which district). Disaster City only for now.

---

## 5. Ownership and order on the board

- The claims row "Disaster City NPCs: the spawn system" (second account, `docs/notes/claims.md`) covers the residents
  code and `HQ_SPAWN_RULES`. **Steps 1, 2, 3, 6, 7 and 8 touch the same code.** Before any build step, read the board, then
  either take this plan's own row ("NPC encounters: tempers, ladder, awareness, offers, onlookers") in your PR or leave a
  note at the board's bottom for the spawn system thread. Never edit the other side's rows without mondo's word.
- Spawn system delivery 3 (cap + refill) should land before this plan's step 9. Delivery 7 (spontaneous events) is built by this plan's step 4: tell the spawn system thread on the board.
- Other zones come after Disaster City; the One World moves (wave B, 11-17) move a room's `encounters` row with it.

---

## 6. The build steps

Disaster City first (the vertical slice, mondo 11-17); other zones later. **Priority: now** (mondo 11-17: "its priority
number 1"). One PR a step. Every step: `git fetch origin main && git merge origin/main` first (RULE #1d), `node --check`
every edited JS file, visual steps get a browser proof through `probe-fast.js` with the `[EW BUILD]` HEAD, then merge +
`node sync-zip.js --upload` (RULE #1). No tests. Story mode only.

| # | Step | State | Model | Why that model | Needs first |
|---|---|---|---|---|---|
| 0 | **The check-up**: confirm every BUILT / CHECK row of section 2 in code (what the room's walkers do during a fight; where the round-end hook goes; how the AI picks targets through `isEnemyUnit`) and write the findings here | **DONE 11-17** (`REVIEW.md` section 1; three smaller checks left, named there) | **Fable** | A read-only audit across five big files; the result is prose | nothing |
| 1a | **Tempers + groups, design**: tag Disaster City's races (residents + its AREA UNITS table) with a temper, a group and roles; draft the room mix per district; draft the fewest lines the system needs | **DELIVERED 11-17 for Bayside (`STEP-1A.md`), waits for his marks** | **Fable** | A creative, wide pass over the roster and the city; output is a table + lines for mondo to mark | step 0 |
| 1b | **Tempers + groups, data**: data.js `HQ_NPC_TEMPERS` (temper, group, roles by race; overrides by room / resident id; the room mix) + `hqNpcTemper(ch)`, `hqNpcGroup(ch)`; nothing reads them yet | **BUILT 11-17** (data.js, after `hqSpawnExpand()`: `HQ_NPC_TEMPERS`, `hqNpcTemper`, `hqNpcGroup`, `hqNpcSameGroup`, `hqNpcDefends`; 42 races tagged, 28 city races still without a temper) | **Opus** | Exact edits in data.js (a stray brace takes the game down) | mondo's marks on 1a |
| 2 | **Awareness + the marks**: who has seen you (the same on every machine: the weak-PC cut goes, board note to the spawn system thread first); the eye closed / eye open / red mark over heads; step aside; Guards / Territorials say their line | **BUILT 11-17** (the eye by the portrait, the red `!`, the Ghost's warning; notes `docs/notes/npc-system.md` "THE AWARENESS + THE MARKS". Left for steps 3 / 4, which make the moments: the Guards' warning line, stepping aside) | **Opus** | three-renderer.js tick code, a browser proof | 1b, the marks' mock-up OK'd |
| 3 | **The strike ladder**: the short run, cornered skips it, the Talk panel (E first too), the third strike starts the fight; the door strike; whoever starts the fight opens round 1; the day's memory per id; the old one-strike notes get a REPLACED line | **BUILT 11-17** (with the Guard who sees a strike: its warning line, then it comes for you and starts its own fight; notes `docs/notes/npc-system.md` "THE STRIKE LADDER"; its numbers are proposals put to mondo in chat) | **Opus** | Changes the built strike path (`_hqStrikeClick`, `_hqEncounterAim`, map.js `_hqEncounterFire`); must not break the first quest or the capture | 1b |
| 4 | **NPC-started fights**: Brutes come at you, Territorial warnings, the Opportunist mugging (Pay / Fight), the drive-by; **the level gap rule**; "never random" retired in its notes | **BUILT 11-18** (Brutes, the Ghost's fight after its warning, the mugging with PAY / FIGHT, the level gap on all four ways of starting, the gold a lost fight costs; notes `docs/notes/npc-system.md` "NPC-STARTED FIGHTS". NOT built: the drive-by, mondo 11-18 "skip drive-by for now". His answers of 11-18: the numbers of steps 2 to 4 are OK; cops always come (no level gap on a Guard); a story fight not won pays no match pay; five more muggers' lines) | **Opus** | The encounter launch, the walk tick and line of sight; a proof picture | 2, 3 |
| 5a | **NPC health on the walk**: a resident's HP is kept between fights (as the party's is) and carried into the next one. **DONE 11-18** (the profile's `door.hq.wounds`; whole after its Sleep block / a walker at the next game day; npc-system.md "NPC HEALTH ON THE WALK") | BUILT | **Opus** | data.js ledger beside `cleared`, the launch, the commit; the spawn system's row: board note | 1b |
| 6a | **The losing NPC, design**: gives up / runs / fights on, one table per temper; the give-up state's look; the pay-off; THE ARREST; the panel mock-up, the lines. **DELIVERED 11-18: `STEP-6A.md` beside this file + two mock-ups; OK'D by mondo 11-18 ("OK sounds good")** | NEW | **Fable** | A mock-up and words; mondo's rule is plan + mock-up first, then wait | 1a |
| 6b | **The losing NPC, build**: the give-up state, the Talk answer, the results (bag, the arrest through `hqCaptureEnlist`, the cleared ledger); NPC escape (the AI choice + the escaped state; "natives never escape" REPLACED). **BUILT 11-18** (npc-system.md "THE LOSING NPC") | NEW / REPLACES | **Opus** | battle.js turn code, ai.js, hud.js panel, the commit; the back keys; never reset the trained weights | 6a OK'd, 5a |
| **GATE** | **mondo plays Bayside**: one street, end to end, no crowds yet | | | Everything after it is tuned by what he felt | 2 to 6b |
| S | **The one side question**: every place in battle.js, ai.js, map.js and hud.js that compares `.player` directly asks the side functions instead (`isAllyUnit` / `isEnemyUnit` / `getHostileUnits`); the win check, vision and the turn order take a side that is not 1 or 2. No rule changes: PvP must play exactly as before (RULE #2) | NEW | **Opus** | His answer 6: if a third side is hard, the code is what gets fixed. About 185 direct compares in battle.js + ai.js today. Can run beside steps 2 to 6b | nothing |
| **7a** | **CROWDS, design** (his answer 7: a clear step, never forgotten): the onlooker table, where onlookers stand, the area preview marking an onlooker it would hit, the camera with a crowd, mock-up pictures | NEW | **Fable** | Needs pictures and his explicit OK before code | the gate |
| **7b** | **CROWDS, build**: onlooker bodies on free squares, the round-end update, step-aside, dispersal | NEW | **Opus** | The field, the round end, rigs, frame rate | 7a OK'd |
| 8 | **Joining + the third side**: joiners enter next round; a side per group with one shared grudge list; Guards defend their district's Civilians; stray hits on onlookers; a crowded-street measurement | NEW | **Opus** | Turn order (`buildBlitzTurnOrder` is watched by the `turn` lesson), unit creation mid-fight, the AI's targeting | 7b, S |
| 9 | **NPC-to-NPC situations** in Disaster City | NEW | **Fable** drafts the rows, **Opus** builds | Rows are creative and need his yes; the code is the battle start + walk | 8 |
| 10 | **The review**: walk the city against this plan and mondo's rules, list what is missing or wrong | NEW | **Fable** | An audit and a written report | the steps above |
| later | **THE WANTED SYSTEM** (mondo 11-17: "i eventually want that in the game"), its own plan after the Bayside gate. His pieces: the game already has a jail; backup comes closer at each end-of-round phase; each zone has its own "cops" (Sheriff, Time Cop, Knight, and so on). It reads the same who-saw-what memory as 4.7, so steps 2 to 8 are built to carry it: Guards per zone are a data row, and reinforcements arrive through the round-end update of 4.6 | later | **Fable** plans | GTA / Skyrim are his references | the gate |
| later | The other eight districts' tempers, other zones (Hell as the hostile one, quiet rooms with none), route rooms, shops, spell learning, clues | later | | Each its own plan | Bayside played |

Order (rev 5): 0 (done) → 1a → 1b → 2 → 3 → 4 → 5a → 6a → 6b → **GATE** → 7a → 7b → 8 → 9 → 10. Step S runs beside 2 to 6b and must be in before 8.
Step 1a is **Bayside only** (Chef, Hippie, Pirate, Homosapien, Police Officer, Popstar, Ghost; level 5 to 10) and carries the marks' mock-up.

---

## 7. What this plan does NOT do

- Rebuild levels, variants, tiers, caps, refill, zodiac, the holding tank or the boss sheet: npc-system.md's deliveries.
- Give story characters a temper, or let anyone strike them. DOOR HQ stays a safe hub.
- Shops, items, discounts, spell learning or quest clues (mondo 11-17: their own plans later).
- Add followers, puzzles, new characters or new names. Generate art or sound effects.
- Touch online play.

---

## 8. His answers (2026-11-17) and what is still open

**Settled:** Q1 the ladder as proposed ("go with your gut"). Q2 how hostile a place is depends on the room and the unit
(3.3). Q3 tag the races. Q4 + Q11 Claude drafts the fewest lines, mondo approves. Q5 some tempers skip Talk. Q6 joining is
in. Q7 shops, Q8 spell learning, Q9 clues: not now. Q10 offers are money, health potions, revives. Q12 everyone aware and
willing may join. Q13 it depends on the unit (4.6, settled by Q20 to Q22). Q14 memory until the next game day. Q15 the ladder starts over after a flee (three strikes again).
Q16 muggings yes, with a reason in the line (not built yet, see 4.3). Q17 Disaster City first. Q18 top priority now.
Q19 the old factions are gone; natural groups instead (3.2), to flesh out. Q20 option C, the third side with grudge lists. Q21 groups: the general
idea is right; step 1a drafts the full list. Q22 the onlooker table as written, with a roll. Q23 no calm timer (3.3). Q24
Claude's pay-off table (4.4).

**Still open (rev 6):** nothing from the review. Step 1a brings the next ones: the temper and group table for Bayside, the marks' mock-up,
and how much gold a lost fight costs.

**Rev 4's line:** nothing from this round. The next decisions come with steps 1a (the temper and group table for Disaster
City, the fewest lines), 6a (the offer panel mock-up) and 7a (the onlooker and camera mock-ups).

---

## 9. Concept words → game words

| The concept says | In Entropy Wars |
|---|---|
| Exploration attack | The strike (left click, door gun holstered) |
| Tactical combat begins at current positions | The encounter on the field (`hqFieldFrame`), the arrival swoop |
| Preset | The temper (section 3) |
| Faction | Gone. Natural groups instead (3.2) |
| Ally | Story cast and agents: cannot be struck |
| Merchant / Bandit / Wizard / Bartender | Not races. Bandit = Gangster (an Opportunist). Merchant, Wizard teaching and Bartender clues wait for their own plans |
| Initiative | The blitz turn order; joiners enter at the next `state.round` |
| End-of-round phase | battle.js `processEndOfRound*` + `showEndOfRoundOverview` |
| Routine | The resident's day (`hqResidentTimeline`) or a walker's rounds |
| Recruit | The One-Way Door capture |
| Escape | `escapeProblem` / THE RETREAT (player); NPC escape is step 5 |
| Free for all / a third side | battle.js `isAllyUnit` / `isEnemyUnit` (`_isFFA()`); the grudge list of 4.6 hooks in there |
