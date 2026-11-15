---
name: balance-stats24-power-20261029
description: 10-29 STATS24 read + PR #659 spell-aware POWER score (bake-power.js); proposals doc awaiting mondo's picks; stat-half repricing decision open
metadata:
  type: project
  modified: 2026-10-29T01:57:00.429Z
---
mondo 10-29 sent ew-balance-stats24.json (992 Arena matches, build 20261028-real-af-01-cors; upload id 00dd038d-1e3a-43d0-865f-a02dab793a01) and asked: analyze races/elements/spells/statuses, propose fixes, and make each unit's POWER include its spells weighted by data (blood/earth count more).

SHIPPED PR #659 (merged, token 20261029-power-01-cors, zip ENTROPY_WARS_SYNC_20261029-0154.zip = battle.js 13d4d349, data.js 9d2cf37b, styles-hud.css da5118fd, ui.js 2192b8e0; battle/css/ui also carried PR #658 heals). data.js SPELL_POWER_RULES: POWER = statline budget + best 5 pool spells x 50 x tier x element weight (1+4x(WR-.5)) x lab dmg weight; no-dmg x0.25. Target = median race (954). Race Editor STATS/SPELLS/POWER columns + SPELL POWER list. Export base.spellPower/power. Refresh: `node bake-power.js <newest> [older…] [--fit]` (elements pooled from all files, spells newest only). Fit r .42 -> .47.

Findings: bruisers 54% vs casters 45% (HP, move, Cube dmg 260 vs 95/game; 80% of games end on score at round cap). Earth/blood top, psychic last in 4 runs, but within-race element effect only +-2 pts. A refit of the STATS half (SPD/range up, MP/INT/MDEF/CRT down) gives LOO r ~.65 — decision card sent to mondo, NOT built.

Proposals doc: https://claude.ai/artifact/59BSYFam2gss4qtXYWUgrC — trims Quake, Eye of the Storm, Vortex Slam, To the Moon, Full Burst, Wing Attack, Spike the Ball, Arterial Spray, Crystal Resonator, Descending Wrath (hits Fallen Angel); buffs Pocket Sand, Tesla Coil, Lure, Leech Seed, Team Strike, Blue Screen, Migraine, Telekinetic Slam, Sonic Boom; stats last (Dino HP 1500, Seraphim HP 500, Occulus SPD 50, Mermaid SPD 88, MIB HP 600, Grey HP 650).
Related [[balance-stats23-20261026]] [[balance-stats22-20261025]].

UPDATE 10-29 02:13: mondo picked "Re-price from the data" + approved ALL proposals. PR #661 merged (token 20261029-stats24-01-cors,
zip ENTROPY_WARS_SYNC_20261029-0213.zip = battle.js 20c54856, data.js f872d9ad, styles-hud.css c8ea85b4). RACE_POWER_WEIGHTS hp .21 mp .26
atk .61 int .41 def .31 mdef 0 spd 1.31 vision 0 crt 0 range 66 (bake-power.js --fit-stats). BUG found in browser: data.js spellPowerOf
was overwritten by battle.js window.spellPowerOf (combat) -> renamed spellPowerScore. Leech Seed lives in battle.js SEED_LEECH_PCT.
Browser check harness: /tmp/ew-harness via balance/weak-races-harness/setup.sh + route.js; screenshots /mnt/project-files/balance/stats24/.
