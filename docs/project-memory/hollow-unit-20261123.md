---
name: hollow-unit-20261123
description: The Hollow (Horror B) unit built and live 11-23 (PR #2473); thread, files, what waits on mondo
metadata:
  type: project
  modified: 2026-11-23T12:20:05.632Z
---
The Hollow (Horror B) was built 11-23 in (thread in the owner project) and merged as PR #2473 (live on R2, token 20261123-hollow-02-cors).
- Kit: Lull / Puppet Strings / Shard Bloom / Wake; masks max 4 (battle.js "THE MASKS"); drags use resolveForcedSlide opt `noBreach` so they never smash its crystals.
- Model source: /mnt/project-files/horror-hollow/ (assemble.mjs, hollow.glb, probe/, proof/hollow_proof.jpg). Notes: champions-combat.md + models-assets.md "THE HOLLOW".
- Waits on mondo's look at the proof. Abomination (Horror A) is a separate thread; see [[horror-units-plan-20261123]].
**Why:** later threads touching horror units need to know it exists and where its source lives.
**How to apply:** change the body via assemble.mjs then re-upload with sync-zip --put; keep Hollow and Abomination code separate.
