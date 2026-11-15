---
name: balance-stats31-20261030
description: 10-30 STATS31 read (458 matches ≈ noise: untouched S30→S31 slope .04, true spread ~2.7 pts sd) + PR #708 42-race pass, different levers on non-movers, half steps back on seesaws
metadata:
  type: project
  modified: 2026-10-30T09:53:14.494Z
---
mondo 10-30 09:42 sent ew-balance-stats31.json ("analyze and balance"): 458 Arena, all build stats30-01 (= PR #700 data.js), ~29 games a race.
Upload: /mnt/project-files/uploads/hearth/676945fd-7b73-49dc-8746-ad31ac345e39.

Findings: #700 raised 16 went 37→50.6, cut 13 went 62.4→52.8, BUT untouched races regressed just as far (57→52, 43→51) and untouched
S30 predicts S31 at slope .04. τ² now ~.00074 (sd 2.7 pts) vs 9 pts noise at 29 games; POWER held-out r on S31 .12. One 458-match run
can't measure a single change; ~1,500+ matches a run needed. Ghost 64→50, CG 69→47, Dino 60→45 landed. Seesaws: Chess Piece 35→62,
Grey 37→60, Nephilim 63→31, Antperson 63→40. Didn't move: Popstar 61→73, Skeleton 63→69, Juggernaut 61→67, Fallen Angel 35→31, Jack 41→37.

SHIPPED PR #708 (merged, token 20261030-stats31-01-cors, zip ENTROPY_WARS_SYNC_20261030-0952 = data.js 23a53e8a). Rebake fit-on=8
(hp .25 atk .51 int .88 def .12 spd 1.25; median 849). Same rule as S30 (41 races ≤40/≥60 + AI pooled), min 40 POWER, half HP / half dmg stat.
Different levers: Popstar/Skeleton DEF+M.DEF cut, Juggernaut DEF 155→125, Fallen Angel DEF 27→60 + Contract/Soul Bind excluded,
Jack Haunt/Cold Spot excluded. Half steps back: Chess Piece, Grey, Nephilim, Antperson. Pooled-near-50 races got only the 40 minimum
(Swamp Monster, Ringmaster, Vampire, Honda, Quarterback, Undead, Machine Elves). Scripts in scratchpad only. Related [[balance-stats30-20261030]].
