---
name: balance-stats25-20261029
description: 10-29 STATS25 read (POWER r .56, loadouts don't matter, no-damage pool share r -.45, Ghost = Incorporeal) + STATS25 pass in data.js
metadata:
  type: project
  modified: 2026-10-29T08:33:55.521Z
---
mondo 10-29 08:20 sent ew-balance-stats25.json (630 Arena matches, builds elves-02/bbspy-01/bnuni-01, all after PR #661;
upload /mnt/project-files/uploads/hearth/11716be8-bfe8-454d-b582-577a681d1a4f) and asked: what Spread + builds data say,
one clear cause per outlier race, another balance pass, more export fields, POWER vs WR.

Findings (doc https://claude.ai/artifact/GwRLGGxMmPQePu12eD12Hq): POWER race r .56 (stats half .52, spells .31), +100 POWER
≈ +4 pts, team POWER gap 600+ → 84%. Within-race loadout effects ≈ ±2 pts; 488 spells tested, fewer |z|>2 than chance.
Pool no-damage share r -.45 (Arena score ignores heals/buffs). PR #661: 4/6 stat changes moved races, 0/17 spell changes.
Ghost: Incorporeal (immune to all physical) = cause; takes least dmg of all races. Decision card sent (recommended:
physical spells land, basics/opp attacks still pass) — NOT built until he picks.

STATS25 PASS (branch claude/project-thread-eqzkey): 22 spell numbers (weak races' own dmg spells up, Succubus/KK/Dino
over-tier down; Starfish Tube Feet + Five-Armed Crush range 1→2) + stats: Dino/Minotaur/Sharkman SPD→160 (move 4),
HP Ghoul 1060, Jugg 1520, KK 1620, Dragon 1020, Goblin 820, Priest 700; Mech ATK 155. Comments "STATS25 PASS 2026-10-29".
SHIPPED PR #668 (merged 10-29 08:41, token 20261029-stats25-01-cors, zip ENTROPY_WARS_SYNC_20261029-0841.zip = data.js 2f2ab553). Not lab-checked (mondo: skip the cloud lab). POWER rework (passives etc.) went to a separate thread "Make POWER score reflect real strength". Ghost card still open. Related [[balance-stats24-power-20261029]] [[balance-spread-20261029]].
