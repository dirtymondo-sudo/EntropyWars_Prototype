---
name: balance-stats32-20261030
description: 10-30 STATS32 read (1,918 matches, #708 landed ~7 pts/100 POWER, τ² .0016) + PR #710 29-race pass, 7 spell numbers, new levers on non-movers, no move changes
metadata:
  type: project
  modified: 2026-10-30T22:16:59.115Z
---
mondo 10-30 22:02 sent ew-balance-stats32.json (no text): 1,918 Arena, ~123 a race, all on PR #708 data (builds stats31-01 + labsweep-01; #709 didn't touch data.js).
Upload: /mnt/project-files/uploads/hearth/7924342b-52a5-4c48-b466-4caab3674223. Older exports for bake-power: S31 676945fd, S30 d11b193d, S29 2e9b3406,
S28 3aea14df, S27 c83f2b4f, S26 d4c1fbf1, S25 11716be8, S24 00dd038d, older 05b28e92 / 47989451 / 859aaf84 (all in uploads/hearth).

Findings: #708 raised 35.6→50.8, cut 63.8→47.9; vs regression (slope .13) ≈ 6.7 pts per 100 POWER (new weights). τ² .0016 (true sd 4 pts) vs 4.5 noise.
STATS31 "seesaws" were 29-game noise. POWER held-out on S32 only r .13 (spread left is kits/AI). Rebake fit-on=9 (8 and 10 put weight on VISION).

SHIPPED PR #710 (merged, token 20261030-stats32-01-cors, zip ENTROPY_WARS_SYNC_20261030-2216 = data.js 5345559b). Rule: ≤40/≥60 raw OR team-adjusted
+ 90% pooled; size = mean(pooled, adj gap) × share, 100 POWER per 7, min 40. Spells: Ammit 165→135, Sting 75→62, Soul Harvest 150→130, Walk the Plank 90→75,
High Noon 180→155 (shared, all users strong), Nuclear Option 180→220, Lure 95→115. Seesaws: #708 change undone + DEF/MP. New levers (flagged): Politician
excl Fortify/Rally Command/Surveillance + MP + SPD 48; AI SPD 75 + MP + excl Firewall Protocol/5G Tower; Jack excl Leech Seed/Poison Seed/Wall of Fire + SPD 48;
Jellyfish MP 230→180. No move changes. Watch: Jack (move 1→2 next), Jellyfish (SPD 87 = move 2 next), Politician, AI, Sheriff.
Related [[balance-stats31-20261030]] [[balance-stats30-20261030]].
