---
name: race-grades-bell-proposal-20261108
description: 11-08 race letter grades moved to a bell curve (rank in roster) after the balance loop; SHIPPED PR #1064, SPD/VISION cuts kept
metadata:
  type: project
---
mondo 11-08 23:47 asked even ranges vs bell curve; 23:52 "go ahead". Thread (thread in the owner project).
SHIPPED PR #1064 (token 20261108-grades-01-cors, data.js f6d7c2b1, ui.js 8b966a57 live on R2).
STAT_GRADE_BANDS = 10/20/40/20/10 rank of 134 playable races, tie-aware cuts: hp 1500/1180/880/678, mp 225/200/115/90,
atk 160/122/65/23, int 195/159/60/20, def 170/130/79/42, mdef 181/146/68/33, crt 30/26/19/13 (CRT 26 % = A for 56 races).
SPD + VISION cuts KEPT (SPD letters = move tiles via MOVE_SPD_RULE.follow). Ring/HUD bar (statGradePct) fills by mid-rank in the roster.
Race editor GRADES tab > BELL CURVE button re-cuts a row after a balance pass. Fixed numbers, not live.
Why: old cuts were even steps; S meant 9 % of roster on HP, 28 % on M ATK, 50 % on CRT. The balance loop itself barely moved letters (59/670).
Table: /mnt/project-files/race-grades-20261108/GRADES_PROPOSAL.md. Notes: champions-combat.md "THE BELL CURVE".
On-screen check 11-09: PR #1065 (SPD/VISION rings straight ruler, VISION 2..6 = 20..100 %) + PR #1066 (forge .pb-stat-val overflowed under Press Start 2P; `long` class for 4+ chars), token 20261109-grades-03-cors. Shots /mnt/project-files/race-grades-20261108/shots/.
GOTCHA for browser proof: VS CPU flow no longer shows the party builder (mode confirm -> loading); it is mounted under #startOverlay in setup phase, hide that overlay to see it. Open a unit card in battle with a real mouse click on the unit (clickTile/focusUnitPanel by script did nothing).
Related [[balance-loop-20261108]].
