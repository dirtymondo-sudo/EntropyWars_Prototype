---
name: cheer-guard-20261124
description: 11-24 Cheerleader + Point Guard shipped as TWO separate races (PR #2534), his code-made basketball, kits, where files live
metadata:
  type: project
  modified: 2026-11-24T16:18:38.368Z
---
Thread (owner-project id). mondo picked TWO SEPARATE UNITS (not one M/F race) on 11-24.
- Races 'cheerleader' (female, support, DCU Aftershocks = Disaster City University) and 'point guard' (male, ranged, Sports district).
- Cheerleader: passive Spirit (unit.spirit 0-3, cast at 3 = stunt heal+cleanse), High Kick, Ready? OK!, Basket Toss (teleportAnyUnit + chToss, adjacent ally), Gimme a D-C-U!.
- Point Guard: passive Assist (marks for his team, target._pgMarkBy skips his own hits), Chest Pass, Crossover, Alley-Oop (_deltaCrit), Buzzer Beater.
- Basketball made in code: /mnt/project-files/cheer-guard/make_basketball.py -> R2 Assets/characters/gear/held/basketball.glb (held + proj-basketball).
- PR #2534 merged + uploaded (token 20261124-cheerguard-01-cors). Notes champions-combat.md "THE CHEERLEADER + THE POINT GUARD". Proof /mnt/project-files/cheer-guard/proof*/.
- 11-24 Slam Dunk added (his ask "give him a slam dunk ability too"): pgSlamDunk chargeToTarget T3, VFX pgSlam hoop drop; data.js RACE_DEFAULT_KIT_EXTRAS puts it in his default kit. PR #2536 merged + uploaded (token 20261124-slamdunk-01-cors).
- Related: [[unit-concepts-20261124b]] (models), [[meshy-casts-20261124]].
