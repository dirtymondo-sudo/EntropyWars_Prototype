---
name: ground-price-ai-20261101
description: 11-01 PR #743 CPU prices Inner Peace, weather, terrain spells and hazards from real rules (AI gap batch A); lab numbers, kill-switches, harness
metadata:
  type: project
  modified: 2026-11-01T09:48:51.329Z
---
11-01 AI gap list batch A (thread "Fix how the CPU scores spells"). SHIPPED PR #743 (merged 11-01, ai.js f71838ec, AI stamp v4.30 ...+ground-price, token 20261101-groundprice-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261101-0948.zip). ai.js only, existing rules, weights untouched.
- Inner Peace was always 0 because the old scorer read target.statusEffects (units have no such field; use getActiveStatusKeys). Now debuffs lifted + M DEF stage (x0.4..1.6 by caster share of enemies).
- groundHazardCost replaces flat lava 90/deep 60/poison 30/fire 45 in aiHazardPenaltyAt (real ticks via forecastHitOnUnit; scorched alone now 0).
- terrainCreate: forecastSpellPlan footprint + ground left behind + H/V orient (target._orient -> state._spellOrientation; CPU always cast horizontal before).
- summonWeather: homing eye simulated, Blood Rain by divine/unholy, recast priced on what it adds.
- Kill-switches EW_AI_OLD_CLEANSE / _HAZARD / _TERRAIN / _WEATHER. Notes champions-combat.md "THE GROUND'S PRICE".
- Lab (biased teams, paired vs main pre-#736): 670-595 / 1,265 = 53.0% ±2.8, graded 52.6% ±2.4. Casts: Inner Peace 0->94, Fissure 298->1037, Blood Rain 292->61.
- Harness: /mnt/project-files/ground-price/ (duel3.js = trap-plan duel2.js with spell-bias ids + per-seat usage; us.js prints castable/scored/cast per seat). Needs playtest-harness setup.sh.
- Gotcha: `pkill -f "node server.js"` in a Bash call killed the calling shell (exit 144); kill by pid from ps -eo instead.

[[ai-training-20261101]] [[ai-audit-20261101]] [[cpu-traps-20261101]]
