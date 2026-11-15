---
name: balance-stats30-20261030
description: 10-30 STATS30 read (#693/#694 landed: raised 39→50, cut 60→51; ~3-6 pts/100 POWER) + PR #700 29-race pass with different levers (Ghost move 3→2, shared Quake excludes)
metadata:
  type: project
  modified: 2026-10-30T05:09:32.318Z
---
mondo 10-30 04:56 sent ew-balance-stats30.json ("analyze and balance"): 901 Arena; 792 on battlemap-02 (= live main, after #693/#694,
AI v4.20), 109 battlemap-01 = export's staleMatches (CDN held old data.js, PR #699), left out. Upload: /mnt/project-files/uploads/hearth/d11b193d-a8d7-4d47-95ae-e9c32c0a22d7.

Findings: #693/#694 raised 20 went 38.7→50.3, cut 23 went 60.3→51.4 (both landed). Untouched races regress hard (Fairy 61→36 with no change).
~3-6 pts/100 POWER; used 6. Didn't move: Ghost 67→64, Crystal Guardian 67→69, Dinosaur 63→60, Chess Piece 31→35, Grey 43→37. Seesaw: Cowboy 35→64, Occulus 53→40.

SHIPPED PR #700 (merged, token 20261030-stats30-01-cors, zip ENTROPY_WARS_SYNC_20261030-0509 = data.js 738ced10). Rebake fit-on=7
(6 put .45 on VISION, 5 put 1.51); median 919→878. Rule: every race ≤40/≥60 in newest run + 90% pooled since last change; size = pooled gap
× τ²(.0016) share, 100 POWER per 6 pts, min 40 POWER; dmg stat ≤20%/pass, DEF ≤+40. 29 races (16 up, 13 down).
Different levers (flagged): Ghost SPD 125→87 = move 3→2 + System Crash excluded; Crystal Guardian Quake+Rockslide excluded + ATK/HP;
Dinosaur Quake excluded; Chess Piece DEF/HP + Royal Decree excluded (chess moves ignore SPD); Grey DEF + 4 no-damage excludes;
Bunny Girl ATK not M.ATK; Ice Queen SPD 16→40 (move 1). Analysis scripts were in scratchpad (an.js/solve.js), not saved.
Watch: Ghost move change (could overshoot), the 5 non-movers. Related [[balance-stats29-20261030]] [[power-refit-20261029]].
