# NPC ENCOUNTERS: the review of rev 4 + step 0, the check-up (2026-11-17, Fable)

**ANSWERED 2026-11-17: mondo's answers are in `PLAN.md` section 0 (rev 5), and they win over this file's proposals.** Every question of this file is answered there (two rounds).

mondo asked for a critique of `PLAN.md` (rev 4) from the player's side before anything is built, and for step 0.
This file is both. **Nothing here is built. Nothing here changes a decision he made:** where I think one of his
answers should be looked at again it says "his call" and section 5 lists it as a question.

## 0. The short version

The plan is sound and fits the game. Its weak side is the player's seat: almost everything it adds is invisible until it
goes wrong for you. Seven things I would change before building, in order of how much they matter:

1. **Show it.** Temper, "it has seen you", "it is coming for you" and "these two will step in" need marks on screen
   before the strike lands. Without them joiners and ambushes feel random (2.1).
2. **A level gap rule for NPC-started fights.** Levels no longer follow the party, so a level 40 party gets jumped by
   level 5 Zombies for 3 XP a fight. Far weaker NPCs should not start fights (2.2).
3. **Whoever starts the fight acts first.** The plan does not say who opens when an NPC starts it (2.3).
4. **Surrender as a state on the unit, not a panel on the enemy's turn.** As planned, offers will almost never be seen (2.4).
5. **Joining for free undercuts the One-Way Door**, a bought item with its own hold-the-door game (2.5).
6. **The third side is not "one change".** It is the biggest engine job in the plan. Build joiners on two sides first,
   the third side after he has played it (1, finding 3 + section 4).
7. **Build one street first.** Bayside, level 5 to 10, end to end, then he plays it, then crowds (section 4).

## 1. Step 0, the check-up: what the code says

Checked on main `cbfa4a0`. Line numbers drift; the function names are the handle.

| # | Question | Finding |
|---|---|---|
| 1 | What do the room's walkers do during a fight? | **Nothing: they are gone.** map.js `_hqEncounterStart` leaves the walk (`_hqLeave`) and starts a full match; three-renderer.js `_hqBuildRoomInBattle` rebuilds the room round the field. The walkers' rigs are parked and handed to the fight's units (`_rigCarry*`). So the plan's reading is right, and an onlooker is a NEW thing in the fight's scene. The rig hand-over can carry their bodies across, so they need not pop. |
| 2 | Where does the round end hook go? | battle.js `processEndOfRoundStatuses` → `processEndOfRoundZonesAndSeeds` → `processEndOfRoundRegen` → `showEndOfRoundOverview`. All four exist. The plan's place (after regen, before the overview) is fine. |
| 3 | Is the third side "one change at `isEnemyUnit`"? | **No.** battle.js calls `isEnemyUnit` 130 times and `isAllyUnit` 62 times, but also compares `.player` directly about 135 times. ai.js calls `isEnemyUnit` 4 times and compares `.player` directly about 50 times (it builds its enemy lists with `u.player === q`). The win check counts players 1 and 2 only (`getTeamWipeoutCount(1)` / `(2)`). Vision and fog are per player. The victory XP pool is "the natives' worth" (finding 9). What helps: the FFA paths (`_isFFA`, `getHostileUnits(player, refUnit)`) and the **Provoked** status (`taunt`: battle.js `getTauntTargeter`, ai.js gives the taunter +800 priority), which already is "this unit goes for that unit". |
| 4 | Who acts first in an encounter? | The unit that swung. battle.js `_afterVSSplash` sets `window._ewEncounterFirstId`, state.js `buildBlitzTurnOrder` puts it first in round 1 (THE FIRST STRIKE, 09-22). `buildBlitzTurnOrder` is a watched tutorial function (`turn`): any step that touches the order re-reads that lesson. |
| 5 | Can anything but the swing start a fight? | Yes: **a standing door of the door gun** that touches a native (three-renderer.js `_hqGunDoorStrike`, gesture `door`, the door's act is the fight's opening). The plan's ladder does not mention it. |
| 6 | Who is "aware"? | Only residents with a body: `HQ_CITY_RESIDENTS` `drawn: 8`, `drawnLow: 4` on a weak PC, within 70 m. So on the plan's rule, who witnesses and who joins **differs between his Mac and his friend's PC**. |
| 7 | NPC escape | A written rule today: "Natives never escape" (data.js `HQ_ESCAPE_RULES` comment, fork §10.2). Step 5 is a REPLACES, not a NEW. |
| 8 | Capture | The One-Way Door is a small game of its own: fire a door, the enemy is held, hold the door 3 rounds (fewer when hurt or debuffed), its friends can break it. Doors are bought: Reinforced 300 gold, Vault 800. A capture pays a kill's XP. |
| 9 | The numbers that matter here | A game day is 24 real minutes (`HQ_WORLD_CLOCK.dayMin`), so the refill of 3 days is 72 minutes and "memory until the next game day" is 24 minutes at most. `killXpFor`: level 5 beats level 5 = 50 XP; level 5 beats level 50 = 1,862 XP (level 5 to 12 in one kill); level 40 beats level 5 = 3 XP. The victory pool is every native's worth × 0.5 (battle.js, `HQ_LEVEL_RULES.share.poolMult`), whoever downed them. A loss wakes the party healed at the ward and costs nothing else (`lossRestore`). HP carries from fight to fight. |
| 10 | Levels of the people who would step in | Police Officers are level 5 to 10 in Bayside, 15 to 20 in Hero Plaza, 35 to 40 in Civic Center. The Superhero is 50 and patrols Hero Plaza (a level 15 district) by night. |

Not checked yet (said plainly): how every AI scoring path picks targets (only counted), the frame cost of awareness
checks, and whether a capture door placed on the walk before a fight still carries in when the NPC starts the fight.

## 2. Where the plan will hurt the player, and the fix

### 2.1 Nothing is shown
Temper, awareness, the ladder's step and who would join are all hidden. Today the aim prompt already shows the name
and "LV 42 · LIVES AT ...". The player needs, before the swing:
- the temper as one plain word in that same line;
- a bare mark over a head for three states: it has noticed you, it is warning you, it is coming for you;
- when the aim is on someone: who will step in if you swing ("2 POLICE OFFICERS WATCHING"), with their level.

This is UI, so a mock-up and his OK first (owner-rules §8). It belongs in step 1a / 2, not at the end.

### 2.2 No level scaling meets NPC-started fights
The spawn system gave every NPC a fixed level. The plan then lets Brutes and Opportunists start fights. Together:
- **A strong party in a weak district** is jumped again and again for 3 XP, and every fight costs the swoop in, the
  fight, the debrief and the way back. Fix: an NPC a set number of levels under the party (PROPOSAL: 8) never starts a
  fight. A Brute hangs back or backs off, an Opportunist does not try. You can still strike it.
- **A weak party in a strong district** is meant to die (his answer 6, npc-system.md). That is fair only when it is
  seen coming: the mark of 2.1 at a distance, the level readable, and a Brute slower than a running player.
- **A joiner far above the fight.** Hit a level 15 Chef in Hero Plaza at night and the level 50 Superhero steps in.
  If that is wanted (I think it is: "if I run into them early game I get clobbered"), the warning of 2.1 is what
  makes it the player's own mistake and not the game's.

### 2.3 Who acts first
One rule, both ways: **whoever starts the fight opens round 1.** You swing: your lead opens (today's rule). It
reaches you: it opens. It is coming at you and you turn and swing first: you open. This is Persona 5's ambush, his
camera reference, and it is what makes noticing an NPC before it notices you worth something. The hook exists (finding 4).

### 2.4 Offers: a state, not a panel
The plan has a losing NPC offer on its own turn through a panel. Two problems. In this game a losing unit is usually
dead before its next turn (a strong hit refunds AP, so the party keeps hitting), so the offer is rarely seen. And when
it does fire it is a box popping up in the middle of the enemy's phase.

PROPOSAL: **surrender is a state on the unit.** The hit that takes it under its line and leaves it alive makes it
give up at once, as a free reaction like a flinch: hands up, it stops acting, its nameplate shows what it offers. The
player answers on their own turn with what they already do: hit it = refuse; Talk to it = the panel with the offer
(back keys as always). No interruption, the choice is always the player's, and it reads at a glance. Scope is that one
unit; the fight ends when nobody is left fighting.

Escape and offers are the same moment, "what a losing NPC does", and should be one table per temper (give up / run /
fight on), designed together in step 6a, not two separate steps.

### 2.5 Joining for free against the One-Way Door (his call, Q6)
He said yes to joining. As written it is free: beat it down, it offers, you say yes. That skips the door you paid 300
or 800 gold for and the three rounds of holding it. PROPOSAL: a unit that has given up **seals a One-Way Door at
once** (no hold, its friends cannot break it). Joining is then the reward for making it give up, and the door still
costs a door. One-of-a-kind units never offer to join. Until the holding tank is built, a race you own pays the bounty as today.

### 2.6 An NPC that escapes takes your work with it (his call, Q15)
You spend turns, it breaks line of sight and is gone: no XP, no drop. Then on the walk "its ladder starts over", so
it is three strikes again at, as written, full health. The concept itself warns against this ("no infinite
flee / restart loops"). PROPOSAL: an NPC that escaped **a fight** keeps its wounds and its memory until it refills:
struck again that day it fights at once (or gives up at once), at the HP it left with. His Q15 answer ("the ladder
starts over") then covers only the strike 1 run on the walk, which is harmless.

### 2.7 The chase after strike 1
"Runs to its home or work door, slower than you" can be a run across a district, and the plan does not say what
happens at the door. PROPOSAL: a short run (about 15 m or out of sight), then it stops and watches you. **Cornered
skips the step:** no way out, or already at home, goes straight to Talk. Keep E → "Fight" as the quick way in for a
player who is hunting a unit to capture, and show it in the prompt. What the ladder really buys: a stray click in a
crowd makes someone run, it no longer throws you into a fight. That is worth saying in the plan.

### 2.8 The third side (Q20, option C)
The idea is right. The plan's version has holes:
- **"Each joiner is its own side" breaks groups.** Two cops join; cop A's area spell clips cop B; B now hates A. The
  side must be the **group** (or the race), with one grudge list for the group.
- **When does the fight end?** PROPOSAL: when no unit hostile to the party is left fighting. Third-side units then go
  back to being onlookers.
- **Who gets the XP and the drops** for a unit the third side downed? Today the pool counts every native (finding 9).
  If that stays, a level 5 party stands back while the Superhero wins it 1,862 XP a body. PROPOSAL: the pool counts
  only what the party downed or captured.
- **Colours.** His rule is own side cyan-blue, enemy pink-orange. A third side needs a third colour: a new visual rule, his OK.
- **Waiting.** Every third-side unit is another turn the player only watches. Turns between two NPCs should play short
  (no spell shots, a quick camera).
- Can you capture, heal or buff a third-side unit? PROPOSAL: capture yes (it is a native), heal and buff no.

### 2.9 "As many as want to fight" (his call, Q12)
A party is 4 on the board with 4 on the bench. Six Zombies and three cops joining is a 30 minute fight. He ruled out
a hard cap. PROPOSAL, a pace and not a cap: at most 2 join per round end, the others stay onlookers and may join at a
later round end. The fight grows in steps the player can answer. A knob in data, measured in step 8.

### 2.10 The Opportunist who "joins the winning side"
If the party is winning it adds nothing; if the party is losing it is a pile-on. Neither is fun. PROPOSAL: an
Opportunist never joins a fight. It watches, and comes for whoever won if they came out weak. Section 4.3 already has
that behaviour, and it is more in character for a Gangster, a Goblin or a Politician.

### 2.11 Stray hits
- The area preview (green / red tiles) must mark an onlooker inside it and say what will happen ("WILL PROVOKE:
  POLICE OFFICER LV 8"). A spell that drags a cop into the fight with no warning is the game cheating.
- The enemy AI must treat onlookers as squares to avoid, not as targets and not as nothing.
- An onlooker that is hit needs HP: it becomes a unit at that moment (the plan implies it; say it).

### 2.12 Crime has no witness rule
As written a Guard steps in for "its group or place". Beat a Hippie in front of a Police Officer and nothing happens.
In a parody of the real world the player expects the cop to act. PROPOSAL: a Guard also defends the Civilians of its
own district, and the memory of 4.7 makes the cops who saw it hostile on sight until the next game day (24 minutes).
That is the whole "wanted" system, with no new meter. This is a new rule: his call.

### 2.13 The mugging has a line but no choices
"Nice shoes." Then what? PROPOSAL: Pay / Fight. Pay costs the same table as the pay-off, turned round (8 gold × the
mugger's level), so one table serves both ways. Note finding 9: a loss costs nothing today, so losing the fight on
purpose is cheaper than paying. Either that is fine, or a lost mugging also takes the gold.

### 2.14 The pay-off table (Q24)
The amounts are reasonable. Two notes. The two certain item rolls are the same for a level 5 Chef and the level 50
Superhero, so the best place to farm items is the weakest district; one certain roll, plus a second from level 20 up,
fixes it. And the offer needs its scope written: in a fight against three Gangsters, "Spare me" removes that one
Gangster, it does not end the fight.

## 3. What the plan does not cover

- **Awareness tied to bodies** (finding 6). Every resident has a place on its timeline whether it has a body or
  not. Decide who is aware from places inside a fixed radius, then give those a body. Same result on every machine.
- **The door strike** (finding 5): which step of the ladder is a door that hits a Civilian? PROPOSAL: it counts as one strike.
- **Time of day.** The clock and the schedules exist and the plan barely uses them. Cheap and in character:
  muggings at night; a Police Officer at home is a Civilian (the plan has this as an example); fewer witnesses at
  night. Needs a rule: striking someone asleep (cornered, 2.7), and being in someone's home (everyone is Territorial at home?).
- **The Honda Civic** is a common unit on the roads. A car cannot "run slower than you", and the drive-by needs one.
  It needs its own row in 1a.
- **Men in Black** cannot be fought. Do they witness? PROPOSAL: they watch and never join.
- **The bench.** Joiners arrive on the NPC side; the party's answer is its second shift. Worth one line in 7a so the
  crowd is sized against 8 units, not 4.
- **Capture doors placed before a fight** carry into it (`hqGunDoorCarry`). With Brutes that come at you, luring one
  onto a door you placed is good emergent play. Keep it; check it still works when the NPC starts the fight.
- **One World (11-17).** The world is becoming one map with route rooms between zones. Routes are where NPC-started
  fights fit best; city streets are mostly Civilians. The room mix (3.3) should have a row kind for routes.
- **Tutorial.** Joiners change the turn order: `buildBlitzTurnOrder` is watched by the `turn` lesson (finding 4).

## 4. The build order I would use

Same steps, three changes: Bayside first, the marks early, the third side split and last.

| # | Step | Change from rev 4 |
|---|---|---|
| 0 | The check-up | Done: section 1. Three checks left (listed there); they belong to steps 4, 7a and 8. |
| 1a | Tempers + groups, design | **Bayside only** first (Chef, Hippie, Pirate, Homosapien, Police Officer, Popstar, Ghost; level 5 to 10; the story's first district). Adds the mock-up of the marks and the prompt (2.1) and the level gap number (2.2). The other eight districts after the gate. |
| 1b | Tempers + groups, data | As planned. |
| 2 | Awareness + the marks | Awareness from places, not bodies (section 3). The marks ship here. |
| 3 | The strike ladder | Adds: the short run and "cornered" (2.7), the door strike, who opens round 1 (2.3). |
| 4 | NPC-started fights | Adds the level gap rule and the mugging's choices (2.13). |
| 6a / 6b | The losing NPC: give up, run or fight on | Offers and escape designed as one table (2.4, 2.6). Step 5 folds into 6b. |
| **gate** | **mondo plays Bayside** | One street, end to end, no crowds yet. Everything after this is tuned by what he felt. |
| 7a / 7b | Onlookers | As planned, plus the preview mark (2.11) and the join pace (2.9). |
| 8a | Joiners on **two sides** | A cop joins the enemy's side, or yours. No engine change to sides. Most of the fantasy, little of the risk. |
| 8b | The third side | Group sides with a shared grudge list, built on the Provoked code path where it fits; the win check, the XP pool, vision, the colour. Its own PR, after he has played 8a. |
| 9, 10 | NPC-to-NPC, the review | As planned. |

## 5. Questions for mondo (my pick first)

1. **The marks** (2.1): yes to a temper word in the prompt, three marks over heads, and "who will step in" before the swing? Pick: yes; mock-up comes with 1a.
2. **The level gap** (2.2): NPCs 8 or more levels under the party never start a fight? Pick: yes, 8.
3. **Who opens** (2.3): whoever starts the fight acts first? Pick: yes.
4. **Surrender** (2.4): a state on the unit you answer on your own turn, in place of a panel on its turn? Pick: yes.
5. **Joining** (2.5): a unit that gave up seals a One-Way Door at once (costs a door), or joins for free as written? Pick: costs a door; uniques never offer.
6. **Escape** (2.6): an NPC that escaped a fight keeps its wounds and fights at once when struck again that day? Pick: yes.
7. **The third side** (2.8, section 4): two sides first (8a), the third side after you have played it (8b)? Pick: yes.
8. **Joiners** (2.9): at most 2 join per round end, no cap on the total? Pick: yes.
9. **Opportunists** (2.10): never join a fight; they come for the winner after? Pick: yes.
10. **Cops and civilians** (2.12): a Guard defends its district's Civilians, and cops who saw you are hostile until the next game day? Pick: yes.
11. **The mugging** (2.13): Pay or Fight, pay = 8 gold × its level; does a lost mugging also take the gold? Pick: Pay / Fight, and yes it takes it.
12. **The slice** (section 4): Bayside first, then you play it, then the rest of the city and the crowds? Pick: yes.
