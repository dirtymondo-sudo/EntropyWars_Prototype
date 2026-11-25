---
name: cicada-polish-20261117
description: Cicada Brood polish 11-17 (PR #1918): Brood stacks never grew, fixes, Chorus rename, kit, AI, VFX; gotchas for any status onRoundEnd
metadata:
  type: project
  modified: 2026-11-17T08:28:01.173Z
---
Thread (owner-project id) (mondo 11-17: per-race spell/VFX polish + test new mechanics). Shipped PR #1918, token 20261117-cicada-02-cors, live on R2.
- GOTCHA: a STATUS_DEFS onRoundEnd only runs if the key is in state.js `_STATUS_EFFECT_IDS` (normal battles); else call it from battle.js `_nrRoundEnd`. Dormant does the latter (`_cicadaBrood`).
- Dig In duration 3 -> 4 (3 gave only 2 round ends). invisible.onRemove clears dormant. T3 `nrScreech` renamed Chorus (sonic family has raceScreech "Screech"; menu finds spells by name). RACE_TREE = own 3 + Swarm Signal. Other NEW RACES 2 rows still borrowed rungs (slug fixed in its own thread).
- Probe gotcha: swapping partyMeta race leaves unit.spells empty; set c.spells from raceDefaultKit in page. AI check: window._aiRankCandidates(unit).
- Seen, not fixed: a big white/rainbow swirl over the caster on any heavy AoE hit (~600 dmg), shared staging, not race VFX.
Proof /mnt/project-files/cicada-polish/cicada_proof.jpg.
