# NPC ENCOUNTERS, STEP 6A: THE LOSING NPC (design + mock-up, 2026-11-18)

mondo 11-18: "Go ahead and start 6a". Plan rule: design + mock-up first, then WAIT for his OK; step 6b builds it.
What his answers already fix (PLAN.md section 0): giving up is a STATE on the unit, answered on the player's own turn (round 1, 4);
taking it is THE ARREST, a door on the spot to DOOR HQ (round 1, 5), free (round 2, 1); the pay-off = 8 gold x its level + one certain
spoils roll, a second from level 20 (round 2, 9; rev 4: no XP); "Spare me" counts as beaten (4.4); an escaped NPC keeps its wounds (5a);
any enemy that goes down stays beaten (11-18); the line "Stop. I give up." and the buttons TAKE THE PAY-OFF / ARREST / LET IT GO
(STEP-1A.md section 4, "these lines are fine for now"). Everything else below is a **PROPOSAL** (numbers are data rows in 6b).

## 1. What a losing NPC does, by temper

"Losing" = the hit that leaves it alive at or under **30 % of its max HP** (`giveUpAt: 0.30`). It decides once, at that hit.

| Temper | Under 30 % | Examples in Bayside |
|---|---|---|
| Civilian | **Gives up** | Chef, Hippie, Skater, Popstar |
| Coward | **Runs** (escape); gives up if it cannot get away | (none in Bayside) |
| Opportunist | **Runs**; gives up if it cannot get away | Pirate, Florida Man |
| Territorial | Fights on (it is on its own ground) | Ghost |
| Guard / Protector | Fights on | Police Officer, Lifeguard |
| Brute | Fights on | (none in Bayside) |
| No temper yet | Fights on (as today) | the 28 races still waiting for their pass |

Rows on top: a `boss` or `unique` unit always fights on. Online is never touched (story fights only).

## 2. Giving up (the state)

- **At once, as a free reaction** (no turn spent): it drops its weapon pose and plays a kneel (the pack's `Fixing_Kneeling` held,
  already in sprites.js); it stops acting: its turns are skipped, it moves and casts nothing, its friends fight on.
- **The mark** (symbols only, round 1, 1): a white flag in its nameplate where the eye sits, and its HP bar greys. Nothing else.
- **Hit it = refuse:** the give-up ends, it fights on to the end and never gives up again that fight.
- **The fight ends** when nobody hostile is left fighting: a unit that gave up counts as out. If it is the last one, the fight is won
  and the panel opens by itself before the debrief.

## 3. The Talk panel (the answer)

- On your unit's own turn, a new command **TALK** on an enemy that gave up, within 3 squares, **free** (no AP, does not end the turn).
- The panel (mock-up): the battle's own black box with the white outline (owner-rules UI), the NPC's portrait, name, level,
  its line "Stop. I give up.", and three buttons:

| Button | What happens | XP | Ledger |
|---|---|---|---|
| **TAKE THE PAY-OFF · 💰 8 x LV** | Gold now; the items roll at the debrief (1 certain roll, 2 from level 20) | none | beaten today (cleared) |
| **ARREST** | A door opens under it and it is sent to DOOR HQ, free: `hqCaptureEnlist` (the party, else the roster, else a bounty) | none | captured |
| **LET IT GO** | It walks off the board | none | beaten today (cleared) |

- Back keys as everywhere: ESC, E, right click close it with no answer; it stays given up, ask again later.
- Each of the three takes it off the board at once.

## 4. Running (the escape)

The player's escape turned round (battle.js `escapeProblem` / `_escapeWalkPath` / `_escapeRemove`): on its own turn, a unit that chose
to run walks toward the board's rim; once no party unit sees it (`isUnitSeenByAnyEnemy` false) and it has the AP, it leaves the board
(`state.escaped[2]`). It counts as escaped: no XP, no drop, not beaten. It keeps its wounds on the walk (5a, already built) and is back
in its day. If it is cornered (no way that breaks line of sight within its move), it gives up instead. "Natives never escape" is REPLACED.

## 5. The lines

None new. "Stop. I give up." (approved) is the panel's line for every unit.

## 6. Pictures

`step-6a-give-up.jpg` (the state on the board) and `step-6a-talk-panel.jpg` (the panel), drawn on a real fight frame (a VS-CPU match on Proving Grounds, build HEAD `e60f804`, `[EW BUILD]` FRESH; the Chef staged at 24 % HP; the flag, the grey bar and the panel are drawn on top).
