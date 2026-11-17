# NPC ENCOUNTERS: the plan and the guide (rev 2, 2026-11-17)

mondo uploaded an NPC encounter concept (v0.3, made with another AI that did not know the game; kept word for word in
`concept-v0.3.md` beside this file). This file fits that concept to Entropy Wars as it stands on main today: the roster,
the zones, and what is already built. Nothing here is built by this file.

**This is a NEW encounter system, and it is meant to replace the old encounter rules** (mondo, 11-17: "we are making a brand
new encounter system. The rules are going to change"). Where the concept differs from how the game works today, the concept
is the target and the old rule is what gets changed; such parts are marked **REPLACES**. Details the concept left open
(numbers, which race does what, the words NPCs say) are still **PROPOSALS** for mondo to set; the questions are in section 8.

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

1. **Today one strike starts a fight (REPLACES).** In a wild room, a left click with the door gun holstered swings the
   walker's basic attack; on the swing's strike frame the fight starts at once (three-renderer.js `_hqStrikeClick` →
   `_hqEncounterAim` → data.js `hqEncounterLaunch`). The new system puts the temper's ladder (Flee → Talk → Fight, three
   strikes at most) in front of that launch.
2. **Today only the player starts fights (REPLACES).** The 09-15 rule "never random" (seamless-field-encounter.md) and the
   one exception of 11-16 (rare muggings and drive-bys, npc-system.md round 2) give way to the concept's rule: Brutes attack
   when they see you, Territorials after a warning, Opportunists when you look weak. The muggings become one case of this.
   Pacing still matters (his 11-16 words: "enough to feel alive, never annoying"), so how often is a number to set (Q2).
3. **No factions** (owner-rules.md §2) is a standing rule outside encounters, so the concept's "faction" relationship is
   left out: a Guard or Protector protects a PLACE (its work building, its district) or a named RACE. If mondo wants
   factions back, that is Q19.
4. **No followers, units named after their race** (owner-rules.md §2). "Bandit joins the party" cannot mean a follower in
   the walk; the party is the party sheet. And there is no Merchant, Bandit or Bartender race: the plan uses the real roster
   (section 3).
5. **Allies cannot be struck at all.** `hqEncounterCharOk` refuses story cast, agents, the clone and the online shift, and
   DOOR HQ is a safe hub (story characters only, never a wild room). So the concept's "ally attack rules" are already
   decided: you cannot attack them. Kept as is.
6. **Recruiting today is the One-Way Door capture** (CAPTURE_PLAN.md, battle.js "THE ONE-WAY DOOR", `hqCaptureEnlist`,
   ONE OF EACH + the planned holding tank). The concept's "join the party" offer is a second way in, through the same
   enlist (party, else roster, else the holding tank). How the two sit together is Q6.
7. **There are no shops in the zones** (buying is the DOOR HQ Dispensary + the bag, which does not restock). The concept's
   merchant needs one: step 6c adds zone shops (a Merchant temper on races that sell, e.g. a Chef at a restaurant). Q7.
8. **Units do not learn spells from people today** (a unit's spells are its race kit + the circuit, RACE_FAMILIES). The
   concept's "teach a spell" adds that: the teacher's kit becomes a source for the circuit. Q8.
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
| Other walkers during a fight | **CHECK** | step 0 confirms it | My reading: the fight builds the room's field and the walkers are not part of it, so nobody watches. Step 0 must check this in code before step 7 is planned. |
| Awareness (an NPC notices you) | **NEW** | | Walkers do not look at you, turn, step aside or react. |
| NPC-started fights | **NEW** (REPLACES "never random", see 1.2) | | The approved muggings / drive-bys (npc-system.md delivery 7, not built) fold into this. |
| Offers in a fight (talk mid-fight) | **NEW** | | |
| Witnesses, spectators, joining a fight | **NEW** | | |
| NPC-to-NPC trouble | **NEW** | | |

---

## 3. The presets, fitted to the roster

The concept's eight presets become one small field per race, the **temper**. Same names where they fit; "Typical enemy"
is folded into Opportunist and Brute (in a world with no factions, "enemy" is a temper, not a side). Merchant comes in with
the zone shops (step 6c). Every race-to-temper pick below is a PROPOSAL and an example, not the full list: step 1 tags all 157 races.

| Temper | Normal life | When struck | Examples from the roster (PROPOSAL) |
|---|---|---|---|
| **Civilian** | Its day or its loop; steps out of your way | Flee → Talk → Fight | Hippie, Professor, Librarian, Chef, Delivery Boy, Mime, Bunny Girl, Influencer, Banker, Skater, the city's ordinary people |
| **Guard** | Patrols or stands at its post; watches you | Fight (a warning line first when you are only trespassing) | Police Officer, Sheriff, Time Cop, Lifeguard, Crystal Guardian, Knight |
| **Territorial** | Holds a spot (a lair, a field, a gate); warns you when you come close | Talk (the warning) → Fight | Yeti, Bigfoot, King Kong on his field, Minotaur, Dragon, Kraken, Sewer Gator |
| **Protector** | Lives normally; steps in when its place or its people are hit | Fight on stepping in | Superhero (male + female), Sidekick, Firefighter, Eagleman, Angel |
| **Opportunist** | Sizes you up; may approach when you look weak (low HP party) | Talk → Fight; may run when losing | Gangster, Goblin, Pirate, Florida Man, Politician, Televangelist, Tech CEO |
| **Brute** (the concept's Aggressor) | Moves at you when it sees you | Fight at once | Zombie, Shadow Entity, Werewolf, Wendigo, Ghoul, Flesheater, Skinwalker |
| **Merchant** (with step 6c) | Sells at its counter or stall | Talk → Fight | Chef at a restaurant, Banker, Pirate at a stall (PROPOSAL) |
| **Coward** (the concept's Pacifist) | Avoids you | Flee → Talk → Fight (always the full three, never more) | Rabbit, Gnome, Fairy, Unicorn |

Rules that stay with every temper:

- **Three strikes at most** to a fight, for the most reluctant (the concept's own rule). A temper may skip steps, never add.
- **Roles are tags on top of a temper**, not more presets: `boss` (comes from the boss sheet, npc-system.md delivery 6),
  `unique` (the one-of-a-kind tier, already in `HQ_SPAWN_RULES`), `wildlife` (no Talk lines: it growls instead).
- **No temper may block a path** while it flees, watches or warns (owner-rules.md §2). Every new walk uses the existing
  nav, which already treats people as non-blockers for each other.
- **Fewer NPCs indoors, more outdoors** is the spawn system's knob, not a temper's. DOOR HQ keeps story characters only
  and stays a safe room: no temper runs there.
- The temper is per race, with a per-room or per-resident override (a Police Officer off duty could be a Civilian).

---

## 4. The design, part by part

### 4.1 Awareness (NEW)
Kept from the concept: an NPC can see you without anything happening. In the game that means only small, cheap things on
the walk: a head turn, a look, a step aside, a line over its head for a Guard or Territorial ("Keep moving."). Line of
sight reuses `_hqLosClear`. It runs only on the drawn bodies (8 near you, 4 on a weak PC), so it costs nothing for the
timelines that have no body. **Hostility is the temper, not a stored number.** Confidence stays computed (party HP vs
its own level from `hqSpawnLevel`), never stored: the concept's open question 7 is answered "computed".

### 4.2 The strike ladder (REPLACES the one-strike fight)
Strike 1 makes a Civilian run (slower than you, along the nav, back to its home or work door);
strike 2 makes it stop and Talk (the panel opens, walkers freeze as today; choices "Back off" / "Fight"); strike 3 starts
the fight exactly as today. A Guard or Brute fights on strike 1 (today's behaviour, unchanged). The count lives on the
walking body only and is kept until the fight starts or the NPC is gone from the room; it does not reset on an apology.
E before you swing also works: Talk first, with "Fight" among the choices. The first quest's fight is a quest fight
(`QUEST_FIGHTS`) and keeps its own start.

### 4.3 Who starts a fight on its own (REPLACES "never random")
- **Brute:** sees you (line of sight, a range per temper), walks at you, and the fight starts when it reaches you. You can
  outrun it or break its sight, so a fight is still avoidable.
- **Territorial:** warns once when you step onto its ground (its marked squares), fights if you stay or come closer.
- **Opportunist:** approaches when your party looks weak (low HP, a lone walker) and Talks first (a mugging is this).
- **Guard / Protector:** only when it sees you strike someone, or its place or person is hit (section 4.6).
- **Never:** in DOOR HQ, during a cutscene or a quest scene, or right after a fight (a short grace time, PROPOSAL).
- **How often** (Q2): his 11-16 pacing word for muggings was about once an hour of play; Brutes in wild zones will be
  more often by nature. A per-room `calm` knob (how many NPC-started fights per walk at most) keeps it from getting
  annoying.

### 4.4 Talk in a fight and the offers (PARTLY / PROPOSAL)
A losing NPC may offer something on its own turn (it spends that turn, so the turn order never pauses: the concept's
open question 2 answered "it costs the turn"). The player answers in a panel that obeys the back keys (Escape, E, right
click). What an offer may be, fitted to systems that exist:

| Concept's offer | In this game | State |
|---|---|---|
| Bandit joins the party | Gangster (or any Opportunist) joins through `hqCaptureEnlist`, the same way a capture lands | NEW; how it sits next to capture: Q6 |
| Merchant discount | Its shop's prices drop for you, kept on the save | NEW, after the zone shops (step 6c); Q7 |
| Wizard teaches a spell | Wizard, Magician, Shaman, Necromancer ... teach one spell of their kit; it joins the circuit pool | NEW; Q8 |
| Bartender reveals information | No Bartender race; any Civilian / Opportunist tells a clue or marks a place on the map through the quest system | NEW; Q9 |
| (new) Spare me | The fight ends, the NPC flees and is "beaten" for the cleared ledger, no XP or half XP | PROPOSAL (Q10) |
| (new) Pay you off | Spoils into the bag (the bag and spoils exist) | PROPOSAL (Q10) |

Offer lines are words a player reads. Who writes them is Q11 (Fable can draft, mondo approves; nothing ships unread).

### 4.5 NPC escape from a fight (NEW)
Reuse the player's escape (same `escapeProblem` test turned around: no player unit sees it, it has the AP). The AI
(ai.js) gets one more choice for tempers that may run (Civilian, Coward, Opportunist when losing). An escaped NPC is out
of the fight, counted as "escaped" (not beaten, not captured), and runs on the walk afterwards. **Re-engagement (the
concept's open question 1), PROPOSAL:** an NPC that escaped you fights at once if you strike it again the same day (no
ladder twice), so there is never a flee loop. A unique that escapes keeps its one-of-a-kind status.

### 4.6 Witnesses, spectators and joining (NEW)
Kept from the concept, fitted:
- Who can witness: only bodies that are drawn and have line of sight. Timelines with no body never react (cheap, and a
  player cannot see them anyway).
- Inside a fight, onlookers are NOT units: they stand on free squares outside the seats, are skipped by turn order and by
  `state.units`, and step aside when a move or a landing needs their square (never blocking, owner-rules.md).
- Everything they do happens at the existing round end (after `processEndOfRoundRegen`, before
  `showEndOfRoundOverview`): watch, flee, call for help, or step in. Shouts and flinches may play at once and cost nothing.
- **Joining:** a Guard or Protector that steps in becomes a P2 unit at the start of the next round, never with two actions
  in one round (the concept's own rule). A cap of one or two joiners per fight (PROPOSAL, Q12) keeps fights short.
- Area spells that reach an onlooker: Q13 (hit it and it joins or flees; or onlookers are never hit).
- Cost: the onlookers are the same rigs already drawn on the walk; the 8-body limit is not raised by this step.
- This is camera and screen work, so it starts with a plan + mock-up and WAITS for his OK (owner-rules.md §8).

### 4.7 Calming down and memory (PARTLY)
Routine → Threatened → Safe → Routine maps onto what exists: the resident's day carries on after the fight; "beaten /
captured" is the cleared ledger and soon the cap + refill (npc-system.md delivery 3). New and small: a short memory per
NPC id for the same game day (struck you, fled from you, escaped you, saw a fight), read by the ladder and by Talk lines.
How long it lasts is Q14 (proposal: until the next game day).

### 4.8 NPC-to-NPC trouble (NEW, last)
Not a world simulation. Hand-placed situations on the existing spontaneous-events timer: a Gangster mugs a Civilian, a
Police Officer steps in, you may watch or take a side (taking a side = the fight starts with the other side as P2). Each
situation is a data row (who, where, which district), no story characters, no invented names. Comes after 4.6 works.

---

## 5. Ownership and order on the board

- The claims row "Disaster City NPCs: the spawn system" (second account, `docs/notes/claims.md`) covers the residents
  code and `HQ_SPAWN_RULES`. **Steps 1, 2, 3, 6 and 7 touch the same code.** Before any build step, read the board, then
  either take this plan's own row ("NPC encounters: tempers, ladder, awareness, offers, onlookers") in your PR or leave a
  note at the board's bottom for the spawn system thread. Never edit the other side's rows without mondo's word.
- Spawn system deliveries 3 (cap + refill) and 7 (spontaneous events) should land before this plan's steps 8 and 9.
- The One World zone moves (wave B running 11-17) move rooms and plots; a room's `encounters` row moves with it. Step 10
  waits until a zone's move is merged.

---

## 6. The build steps

One PR a step unless a step says otherwise. Every step: `git fetch origin main && git merge origin/main` first (RULE #1d),
`node --check` every edited JS file, visual steps get a browser proof through `probe-fast.js` with the `[EW BUILD]` HEAD,
then merge + `node sync-zip.js --upload` (RULE #1). No tests. Story mode only.

| # | Step | State | Model | Why that model | Needs first |
|---|---|---|---|---|---|
| 0 | **The check-up**: confirm every BUILT / CHECK row of section 2 in code (above all: what the room's walkers do during a fight; where a round-end hook can go; how the AI picks a move) and write the findings into this file | PARTLY (section 2 is a first pass) | **Fable** | A read-only audit across five big files; the result is prose, not code | nothing |
| 1a | **The temper sheet, design**: tag all 157 races with a temper + roles, and per zone say which tempers live where (indoor few, outdoor many) | NEW | **Fable** | A creative, wide pass over the whole roster and the zone lists; output is a table for mondo to mark | step 0 |
| 1b | **The temper sheet, data**: data.js `HQ_NPC_TEMPERS` (rows by race, overrides by room / resident id) + `hqNpcTemper(ch)`; nothing reads it yet | NEW | **Opus** | Exact edits in data.js (a stray brace takes the game down); small but must be right | mondo's marks on 1a |
| 2 | **Awareness on the walk**: drawn bodies look at you, step aside, Guards / Territorials say their line | NEW | **Opus** | three-renderer.js tick code, the frame-rate budget, a browser proof | 1b |
| 3 | **The strike ladder**: flee walk, the Talk panel (E first works too), the third strike starts the fight; the day's memory per id; the old one-strike notes in seamless-field-encounter.md get a REPLACED line | REPLACES | **Opus** | Changes the built strike path (`_hqStrikeClick`, `_hqEncounterAim`, map.js `_hqEncounterFire`); must not break the first quest or the capture | 1b |
| 4 | **NPC-started fights**: Brutes chase on sight, Territorial warnings + ground, Opportunist approach (the mugging), the grace time and the per-room `calm` cap; the 09-15 "never random" rule is retired in its notes | REPLACES | **Opus** | Hooks into the encounter launch, the walk tick and line of sight; a proof picture | Q2's numbers, step 2 |
| 5 | **NPC escape from a fight**: the AI choice + the escaped state + no flee loop | NEW | **Opus** | ai.js + battle.js escape code, the commit record; the AI must still play well (never reset the trained weights) | 1b |
| 6a | **Offers, design**: which tempers offer what, the panel's look (mock-up), the lines as drafts for mondo | NEW | **Fable** | A UI mock-up and words; mondo's rule is plan + mock-up first, then wait | Q6-Q11 |
| 6b | **Offers, build**: the offer on the NPC's turn, the panel, the results: spare, pay off, join (through `hqCaptureEnlist`), teach a spell, a clue | NEW | **Opus** | battle.js turn code, hud.js panel, the commit, the circuit pool; the back keys | 6a OK'd |
| 6c | **Zone shops + the discount**: a Merchant temper sells from the shop list at its counter; a won discount is kept on the save | NEW | **Fable** for which races sell what, **Opus** for the code | The stock list is a design pass; the shop panel and save are code | 6a OK'd, Q7 |
| 7a | **Onlookers, design**: where they stand, what they do at round end, the camera with a crowd, mock-up pictures | NEW | **Fable** | Camera and screen design needs a plan + mock-up and his explicit OK | step 0 finding on walkers in a fight |
| 7b | **Onlookers, build**: onlooker bodies on free squares, round-end update, step-aside, dispersal after the fight | NEW | **Opus** | The heaviest code step: the field, the round end, rigs, frame rate | 7a OK'd |
| 8 | **Joining a fight**: a Guard / Protector joins at the next round, the joiner cap, area hits on onlookers | NEW | **Opus** | Turn order and unit creation mid-fight in battle.js | 7b, Q12, Q13, spawn delivery 3 |
| 9 | **NPC-to-NPC situations**: rows on the spontaneous-events timer, watch or take a side | NEW | **Opus** for the code, **Fable** to draft the situation rows | Code is battle start + walk; the rows are creative and need his yes | 8, spawn delivery 7 |
| 10 | **Every zone**: give each plot-built zone's `encounters` rows their tempers and counts; DOOR HQ stays out | NEW | **Fable** for the zone-by-zone table, **Opus** for the data edits | Reading 15 zones is wide work; the edits are exact data.js / zone tool rows | 1b, that zone's One World move merged |
| 11 | **The final review**: read the built game against this plan and mondo's rules, list what is missing or wrong | NEW | **Fable** | An audit and a written report, no code | all steps he wanted |

Order: 0 → 1a → 1b → 2 → 3 → 5 → 4 → 6a → 6b → 6c → 7a → 7b → 8 → 9 → 10 → 11. Steps 2, 3
and 5 are the core; 6 to 9 can wait for the PvP demo to ship (his current goal).

---

## 7. What this plan does NOT do

- Rebuild levels, variants, tiers, caps, refill, zodiac, the holding tank, the boss sheet or the spontaneous-events
  timer: those are npc-system.md's deliveries and stay there.
- Give story characters a temper, or let anyone strike them. DOOR HQ stays a safe hub. (Ally rules are not needed: allies cannot be struck.)
- Add followers, factions, puzzles, new characters or new names. Generate art or sound effects. Every body is an
  existing race model on R2.
- Touch online play.

---

## 8. Open questions for mondo

Numbered so a reply can say "Q3 yes". Each has my recommendation in brackets; none of them is decided.

1. **The ladder's numbers.** Three strikes for Civilians and Cowards, two for Talk-first tempers, one for Guards and
   Brutes, as the concept says. Any race you want handled differently? [As the concept says.]
2. **How often NPCs may start fights.** A Brute that sees you chases; a Territorial warns first; an Opportunist mugs you
   when you look weak. At most how many NPC-started fights per room visit, and how long a calm time after a fight?
   [At most 1 per room visit in the city, 2 in wild zones; 60 s calm after any fight.]
3. **Tempers per race.** Step 1a will hand you a table of all 157 races. OK to tag them all, with overrides per room?
   [Yes.]
4. **Awareness lines.** May Guards and Territorials say a short line when you come close ("Keep moving.")? Who writes the
   lines? [Yes; Claude drafts, you approve.]
5. **Talk before a fight.** E on a native opens Talk with "Fight" among the choices (section 4.2). Should every temper
   allow that, or should Brutes skip Talk? [Brutes skip it.]
6. **Joining next to capturing.** A losing NPC offers to join you; the One-Way Door also recruits. Should joining be
   rarer (only Opportunists, only when they are nearly down), or as common as the concept says? [Only Opportunists and
   only when nearly down, so the door items stay worth having.]
7. **Zone shops.** Which races sell, and do they sell the same items as the Dispensary or their own? [Chefs sell
   food that heals, other Merchants sell the Dispensary's list; Claude drafts the table.]
8. **Learning a spell from a person.** One spell of the teacher's kit, once per teacher, joins your circuit pool. Any
   unit may then equip it, or only units of the same race family? [Same race family only, so races stay distinct.]
9. **Information as an offer.** A spared NPC tells you a clue or marks a place on the map. Wanted, and for which quests?
   [Yes, once a second quest exists.]
10. **Spare me / pay you off.** A losing NPC begs; you accept and the fight ends. What do you get: nothing, half XP,
    spoils? [Half XP + a small spoil.]
11. **Who writes the offer and warning lines?** [Claude drafts, you approve every line.]
12. **How many people may join a fight in progress?** [At most 2 per fight.]
13. **Onlookers and area spells.** If an AoE reaches an onlooker: it joins the fight, it flees, or onlookers are never
    hit? [It flees; a Guard joins.]
14. **How long an NPC remembers you hit it.** [Until the next game day.]
15. **An NPC that escaped you.** Strike it again the same day: a fight at once (no flee loop)? [Yes.]
16. **Should a fleeing or escaped NPC ever come back with friends** (a Gangster returns with another Gangster)? [Later,
    only after step 8.]
17. **Which zone first after Disaster City?** [The Woods: its routes are built and it is outdoors.]
18. **Priority against the PvP demo.** Build the core (steps 0 to 5) now, or after the demo? [After the demo's
    threads are done; steps 0 and 1a can run now since they are docs only.]
19. **Factions.** Your standing rule is "no factions", so Guards protect a place or a race, not a side. Keep it that way
    in the new system? [Keep it.]

---

## 9. Concept words → game words

| The concept says | In Entropy Wars |
|---|---|
| Exploration attack | The strike (left click, door gun holstered) |
| Tactical combat begins at current positions | The encounter on the field (`hqFieldFrame`), the arrival swoop |
| Preset | The temper (section 3) |
| Faction | Dropped (no factions). A place or a race instead |
| Ally | Story cast and agents: cannot be struck |
| Merchant / Bandit / Wizard / Bartender | Not races. Closest real ones: Chef or Banker / Gangster / Wizard / (none) |
| Initiative | The blitz turn order; joiners enter at the next `state.round` |
| End-of-round phase | battle.js `processEndOfRound*` + `showEndOfRoundOverview` |
| Routine | The resident's day (`hqResidentTimeline`) or a walker's rounds |
| Recruit | The One-Way Door capture |
| Escape | `escapeProblem` / THE RETREAT (player); NPC escape is step 5 |
