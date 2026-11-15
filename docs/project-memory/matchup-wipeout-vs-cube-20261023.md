---
name: matchup-wipeout-vs-cube-20261023
description: 10-23 matchup thread, one online Arena match both seats by hand: Wipeout Crew (P1) vs Cube Breakers (P2) on Downtown 12x12; Cube won R20; report link + key findings
metadata:
  type: project
  modified: 2026-10-23T12:03:15.118Z
---

One of the six "Matchup:" threads mondo asked for 10-23 (each pairing of win conditions, both teams played by Claude, report only). Main 1f69668, Downtown Arena 12x12 4v4, local two-seat online (host P1 = Wipeout Crew: Dragon, Ki Fighter, Mech, Fallen Angel; guest P2 = Cube Breakers: Superhero, Dinosaur, King Kong, Antihero). Shot clock forced to 1800 s by script (sandbox concession).

Result: CUBE BREAKERS WON ROUND 20/20 (Antihero 231 on a 149-HP Cube). Kills 9-3 to Wipeout; arena score 369-405 (P2 led at R18 too, so P2 also wins a timeout). Centre Nexus siege x1.5 from R11 took the Cube 2002 -> 501 in 3 rounds; Black Sun reset at R14 nearly saved Wipeout. Report https://claude.ai/artifact/CWTojTHQLaLz8Jz6tqAeKF ; page + shots /mnt/project-files/matchup-wipeout-vs-cube/.

Key findings (nothing fixed): ROUND 19 SKIPPED, no unit acted, cause not traced (my clock script may be involved; maybe the same host no-active-unit watchdog as [[matchup-wipeout-vs-keys-20261023]]: server replay log shows a guest disconnect+rejoin in R18, then R18 end -> R20 start in <60 s with no actions; log at matchup-wipeout-vs-cube/replay-20261023-CCDNT.jsonl.gz); MOVE->CAST forecasts off both ways (Heroic Leap 340 vs 254, Spirit Bomb 376 vs 252, Wrath 571 vs 639); Martyr's Talisman not in forecast ("lethal" -> 1 HP, 4x); ATTACK lit with no reachable enemy still seen after PR #422; Dragon stacked on Dinosaur's tile; plaza height gap blocks adjacent street targets; Stampede on flyer silent no-op; Meteor cooldown text vs castable; Cube row % = Cube HP reads like hit chance; Downtown tower swallows camera. Questions for mondo: timeout score favours Cube dmg over kills; zone-leave tick with ally inside; 1-round Fear expiring at round end.

Related: [[win-condition-balance]] [[playtest-wipeout-20261023]] [[playtest-cube]] [[hands-on-playtest]]

FIXED 10-23 PR #472 (main 81eed0f, token 20261023-wipecube-01-cors, zip ENTROPY_WARS_SYNC_20261023-2222.zip): Talisman in forecast ("✨ SURVIVES AT 1", once per plan), PROTECTED/OUT OF REACH/GUARDED rows, ATTACK lights only with a basic-attack target (buildings no longer light it, thread call), Downtown tower camera (tall room props solid to roof, sight lines from the slid eye, very wide swings only when blocked), Meteor/Requiem/Tidal Slam now really have the 2-round cooldown their text says (mana pass ran before the cooldown stamp; thread call, flagged: the alternative is dropping the text). Not reproduced: Stampede on flyer, Tornado triple fling, Overwatch, Ki Wave rows. Rule questions to mondo still open (timeout score, zone-leave tick, 1-round Fear).
