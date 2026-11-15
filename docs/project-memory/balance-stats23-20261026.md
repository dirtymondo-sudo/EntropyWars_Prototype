---
name: balance-stats23-20261026
description: 10-26 stats23 pass PR #551 (lab-tested move/HP changes), cloud Balance Lab loop lab4.js + speed, EVEN GAMES draft
metadata:
  type: project
  modified: 2026-10-26T07:23:40.100Z
---
mondo 10-26 sent ew-balance-stats23.json (409 Arena matches, build 20261025-stats22-01-cors) and asked: nerf ~90% WR
spells, surgical race buffs/nerfs, can Claude run the lab itself, and even out games per race.

CLOUD LAB LOOP (works): /mnt/project-files/balance/weak-races-harness/lab4.js (setup.sh copies it). 2 workers ≈ 6.5
matches/min (≈ 390/hour; a 409-match export ≈ 70 min). Tabs die at ~23 matches (heap ~3.3 GB) so lab4 recycles the page
every 14 matches in the same context (IndexedDB keeps the stats). 3 workers = out of memory. Mods applied in-page
(--mods json: stats/spells), never touches mondo's data.

EVEN GAMES (this PR): battle.js _balEvenDraftTeams drafts the races with fewest games on the current build token
(_balanceStats.raceGamesByBuild) then splits teams at random. 525-match run: every race 34-36 games.

ROUND 1 lab read (525 matches, n≈35, ±16): SPD buffs that change move WORK (Telepath 59→88, Necromancer/Mushroom
Girl/Giant →50, Deep Sea Fish/Clown →88, Rabbit 151→165: all ~50 from 25-40); Eagleman HP 880 worked (31→54);
Robin Hood spell trims worked (77→57). DID NOTHING: HP buffs Mantid/Fairy/Machine Elves, Ghost INT 165, Minotaur HP 1530,
Mech HP 1350 (78). Noise is bigger than binomial: Gnome 59% in stats23, 14% in round 1 with no change.
Related [[balance-stats22-20261025]] [[balance-stats21-20261025]].

SHIPPED PR #551 (merged 10-26, token 20261026-stats23-01-cors, zip ENTROPY_WARS_SYNC_20261026-1006.zip = battle.js 6fae083b
+ data.js 3aedd4c1). Rounds 2-3 (501 + 550 matches): Ghost SPD 125 (move 3) read 61; Mech HP 1350 + SPD 160 ~68-72
(still high); Jugg/Dragon SPD 160, Kaiju HP 1320, Cowboy HP 1350, Gargoyle HP 1250 helped. Buffs shipped: SPD Telepath/
Jellyfish/Fortune Teller 88, Necro/Mushroom/Giant/Angel 50, Machine Elves 126, Rabbit 165; Eagleman HP 880. Spell trims:
Arrow Volley 140, Piercing Arrow 110, Bomb Arrow 70, Mortar Salvo 48, Wing Attack 65, Stone Drop 85/10.
NO EFFECT (not shipped): DSF/Clown SPD 88, Mantid/Catgirl/MIB SPD 165, Voidweaver 126, Hippie 88, Professor 50, Fairy HP/SPD,
Minotaur HP+SPD, Dinosaur SPD. Still off: Fairy, Professor, Shadow Entity, Voidweaver, Catgirl (~35); Minotaur, Dinosaur (~65).
