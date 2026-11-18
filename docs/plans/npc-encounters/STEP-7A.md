# NPC ENCOUNTERS, STEP 7A: CROWDS (design + mock-ups, 2026-11-18)

mondo 11-17 (round 1, answer 7): "dont forget to add crowds as a clear step after the street test otherwise it will be forgotten".
mondo 11-18: "start a new thread to begin the next step in the plan" (he has been playing Bayside fights: that is the gate).
Plan rule: design + mock-up first, then WAIT for his OK; step 7b builds it. **Nothing here is built.**

What his answers already fix (PLAN.md section 0 and 4.6):
- **Who reacts:** the bodies drawn near the fight that saw or heard it (step 2's awareness). Everyone else carries on with its day.
- **When:** at the round end (after `processEndOfRoundRegen`, before `showEndOfRoundOverview`). Shouts and flinches play at once and cost nothing.
- **Onlookers are not units** until they join: they stand on free squares, are skipped by the turn order and step aside for any move.
  They are the same rigs the walk already drew (no pop).
- **The onlooker table** (4.6, "groups + onlooker table OK", round 2) with the Opportunist row replaced (round 2, 7: it never joins; it comes
  for the winner afterwards if the winner is weak).
- **A Guard defends the Civilians of its district** (round 1, 12). **No cap on joiners** (round 2, 6). **The area preview marks an onlooker
  it would hit, before the cast** (round 2, 8). **The third side has grudges** (option C). **The same on every machine** (round 1, 8).
- **Symbols only, keep it simple** (round 1, 1): the red `!` = coming for you / will step in; the blue sweat drop = scared (built 11-18 for
  the runner on the walk, PR #2097).

Joining itself (a cop becoming a fighter on its own side with a grudge list) is **step 8** and needs step S first. Step 7b builds the crowd:
the bodies, where they stand, the round-end update, stepping aside, the preview mark, the camera, dispersal. Everything below that his
answers do not already give is a **PROPOSAL** (the numbers are data rows in 7b, `HQ_NPC_TEMPERS.crowd`).

## 1. Who becomes an onlooker

- At the strike (or when an NPC starts the fight), every resident body **shown** (the 20 nearest) that stands **inside the fight's frame**
  (the field, at most 24 x 24 squares), is not in the fight and **can see a fighter** (the walk's line of sight, `_hqLosClear`) becomes an onlooker.
- A body asleep, away, inside a building it cannot see out of, or outside the frame: carries on with its day (it is parked, as today).
- No cap of its own: the 20 drawn bodies are the cap. A busy Bayside corner by day gives about 4 to 8 (8 were within 70 m of the Street
  market at 16:00, PLAN step 0's check).
- At night fewer people are out, so fewer watch. Nothing extra to build.

## 2. What each onlooker does (the table he OK'd, turned into moves)

| Temper | Sees the fight (at the start, rolled once) | Where it stands | Mark | Hit by a stray spell (step 8 makes it a fighter) |
|---|---|---|---|---|
| Civilian / Coward | **Watches 60 %**, **runs 40 %** | Watcher: 4 to 6 squares from the nearest fighter, facing the fight. Runner: walks off the field's edge and is gone (back to its day) | runner: blue drop | runs, or brushes it off (50 / 50) |
| Guard / Protector | **Comes closer**; joins if its group, its place or a Civilian of its district is in the fight (step 8) | 2 to 3 squares from the fight | red `!` | joins against whoever hit it |
| Opportunist | **Watches, never joins**; at the end of a fight the party WON with less than half its HP left, it starts a mugging (the built one: its line, PAY / FIGHT) | 5 to 7 squares, at the edge | none (red `!` when it comes after the fight) | joins against whoever hit it, or runs (50 / 50) |
| Brute | **Joins** against whoever is nearest (step 8) | it walks in | red `!` | joins against whoever hit it |
| Territorial (the Ghost) | **Joins only if the fight is on its ground** (step 8), else watches | its ground | red `!` when it will join | joins against whoever hit it |
| No temper yet (28 city races) | **Watches** (as a Civilian that never runs) | 4 to 6 squares | none | brushes it off |

- A watcher plays its idle facing the fight (the walk's idle clip, turned). No cheering clips, no new animations, no lines.
- In 7b, before step 8 exists, a Guard / Brute / Territorial that would join keeps its red `!` and stands closer; it joins only once step 8 is in.

## 3. Where they stand and how they move

- **The first square:** the free square nearest to where it stood on the walk (its rig carries across, as the fighters' rigs do). Then it
  walks (walk speed, free, during the opening swoop) to its distance from the table above.
- **Free square** = a seat square (`entry.field.seats`) with no unit, no other onlooker, and at least **2 squares** from every fighter.
  Onlookers never stand in a doorway or on a capture door.
- **They never block:** a move, a jump, a knock-back or a summon that needs an onlooker's square sends it 1 to 2 squares aside first
  (a short step, plays during the move). They do not block line of sight, shots or vision, and the enemy AI never targets them.
- **The round end:** each onlooker re-checks its distance (fighters moved) and steps back to its band if it is too close; a Civilian with
  a fighter within 2 squares or a spell landing beside it **runs** then (blue drop). Nothing is re-rolled otherwise.
- **The end of the fight:** every onlooker walks back into its day (the walk resumes with them where they stood). An Opportunist's
  post-fight mugging (above) starts 3 s after the walk is back, and only once a game day (the built mugging's rule).

## 4. The area preview: an onlooker it would hit (his round 2, answer 8)

- The aim's tiles stay green / red as today. An onlooker standing inside a spell's area gets **its mark over its head while you aim**:
  the red `!` if it would join against you (Guard, Brute, Territorial, Opportunist that would fight back), the blue drop if it would run.
  Symbols only, no words.
- Until step 8: the cast still goes, the onlooker steps out of the area (no damage) and does what its mark said, as far as 7b can
  (a runner runs; a joiner keeps its red `!`).

## 5. The camera with a crowd

- **The framing counts fighters only** (`_framingBoardTiles`, `frameTiles` 8): an onlooker never pulls the camera out.
- **An onlooker between the camera and a fighter is ghosted** with the fight's own unit fade (three-renderer.js unit occluders,
  `OCC_FADE_TARGET` 0.10), in the normal view and in every action / spell shot, so a crowd never hides the fight.
- The turn camera, the action camera and the spell camera never aim at an onlooker. One exception for step 8: a joiner gets one short beat
  when it steps in.
- **No nameplate, no HP bar, no eye** on an onlooker (it is not a unit). It cannot be selected or clicked in 7b.

## 6. What 7b changes, and what it does not

- Files: three-renderer.js (the onlooker bodies in the fight, the fade), battle.js (the round end, step-aside), map.js (the hand-over at the
  start and the end), data.js (`HQ_NPC_TEMPERS.crowd`: the rolls, the bands, the 2-square ring, the half-HP mugging test).
- Online and PvP: not touched (story fights only, RULE #2 untouched).
- The spawn system's rows: not changed (a board note goes on the board when 7b starts, as before).
- Frame rate: the bodies were already drawn on the walk; 7b measures a Bayside fight with its crowd and reports.

## 7. Pictures

Both drawn on a real Bayside street fight (build HEAD `b948e71`, `[EW BUILD]` FRESH; the walker struck `hq-res-hippie-b` by the Street market at
09:05). The city had only two people near the market at that hour, so three Bayside races were STAGED as the onlookers (a Police Officer, a
Skater, a Chef seated where the walk had them; their nameplates hidden, as onlookers have none); the marks, arrows and labels are drawn on top.
Copies in `/mnt/project-files/npc-encounters/step-7a/`.
- `step-7a-crowd.jpg`: the crowd round a fight: the Police Officer comes closer with its red `!`, the Skater runs off the field with the blue drop,
  the Chef watches from its distance with no mark.
- `step-7a-preview.jpg`: the area preview: an area spell aimed at the Hippie covers the Police Officer, so its red `!` shows before the cast.
