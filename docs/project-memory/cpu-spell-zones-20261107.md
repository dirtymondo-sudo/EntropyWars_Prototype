---
name: cpu-spell-zones-20261107
description: 11-07 PR #1025 CPU prices enemy spell zones (E1) + summon walker walks around bodies (F1); the unregistered-weight gotcha
metadata:
  type: project
  modified: 2026-11-07T11:26:26.380Z
---
Zones/traps playtest fix family E1 + F1 (thread "Stop the CPU sitting in harmful zones"). SHIPPED PR #1025 (merged 11-07,
token 20261107-cpuzones-01-cors, uploaded ai.js 2b31c3d9 + battle.js 24eec65b, AI stamp v4.34).
- ai.js spellZoneCost inside aiHazardPenaltyAt: enemy zone tick + statuses (ccDenialValue) + Gravity Crush flyer slam.
  Probes window._aiSpellZoneCost / _aiRankCandidates. Kill-switch EW_AI_NO_SPELL_ZONES.
- GOTCHA: any new wght() key must be added to battle.js AI_WEIGHT_DEFAULTS, else getAIWeight returns 0 and the feature is off.
- Summon walker (processTurretVolleys) now does a reachable-square flood instead of greedy steps; logs "can't find a way".
- Proof match: CPU Demon/Firefighter walked out of War of the Worlds and Black Smoke. Files /mnt/project-files/cpu-zones-20261107/.
- Harness gotcha: the VS CPU screen remembers TRAINING tempo (imitation learning tunes weights); pick CINEMATIC for proofs.
- Not done (other families): E2 CPU never casts own zone spells; F2 summon plates.
[[playtest-zones-traps-20261107]] [[ground-price-ai-20261101]]
