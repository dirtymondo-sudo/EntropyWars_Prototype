---
name: power-refit-20261029
description: 10-29 POWER refit PR #669: STATS + PASSIVES + SPELLS(average of pool), fit on STATS24+25, held-out r .57→.65; how to rebake
metadata:
  type: project
  modified: 2026-10-29T09:00:25.661Z
---
mondo 10-29 asked POWER to be "more accurate and robust ... include passives", and asked why not balance by POWER.
SHIPPED PR #669 (merged, token 20261029-powerfit-01-cors, zip ENTROPY_WARS_SYNC_20261029-0900 = battle.js f7656355,
data.js 1ff8395a, ui.js aa72c447). No race/spell numbers changed.

- POWER = STATS + PASSIVES (data.js racePowerStats/racePassivePower: passives + element affinities turned into stats;
  Incorporeal = HP ÷ (1 − 0.51 physical share); status immunities count 0, since the lab shows no effect) + SPELLS (5 × the pool's AVERAGE
  spell, no longer the best 5; the lab fields a draw of the pool, r .98).
- Weights hp .3 mp .7 atk .68 int .94 def .6 spd 1.7 range 92, mdef/vision/crt 0, perPoint 78; scale 2500 pts = 100% WR.
  Target (median) is now 1261 on the new scale.
- Held-out r: STATS25 .567 (old formula) → .650 (fit on S24); S24 .729 (fit on S25); LORO .624/.697. Noise ceiling for S25 alone
  is ≈ .62 (40 games a race); the two runs agree with each other at r .55.
- Flying and jump showed nothing held out. Calls I made, not measured: half of "other" damage counted as physical, night 50%, low-HP 20%, Longshot +2 RNG.
- Rebake: `node bake-power.js <newest> <S24> <older…> --fit-stats` (the fit uses the newest 2; exports listed in the CLAUDE.md
  notes). The older exports used for element pooling: 47989451, 05b28e92, 859aaf84 (in uploads/hearth).
- Screenshots: /mnt/project-files/balance/power-refit/. Notes: champions-combat.md "THE POWER REFIT".
Related [[balance-stats24-power-20261029]] [[balance-stats25-20261029]].
