---
name: quetzalcoatl-pass-20261116
description: Quetzalcoatl race polish 11-16 (PR #1887): serpent body = the king (hits redirect), Coil releases, stats mid-tank, 4 VFX; how to probe multi-square units
metadata:
  type: project
---
Thread (owner-project id) (mondo 11-16: per new race, polish spell pool + VFX + playtest). Shipped PR #1887, token 20261116-quetz-01-cors, live on R2.
- Rule chosen (no OK from mondo yet): a hit on a serpent body square lands on the king; areas/beams catch him once; body never breakable. Before, one basic attack destroyed a body square.
- Coil releases when no body square touches the victim. Feathered Serpent cd 2 -> 3. Stats POWER 745 (#1/143) -> 609; Morning Star 145 -> 125.
- VFX `_qz*` in three-vfx-effects.js on _GO_SIG. GOTCHA: setDrawRange / swapping geometry mid-life drew NOTHING in the game renderer; animate scale/rotation instead.
- Probe: /tmp scripts gone; recipe = playtest.js boot, click `.ewi-overlay` to skip intro, swap race via unit.race + _raceAbilities + computeUnitStats, read results AFTER a wait (damage is async).
Proof /mnt/project-files/quetzalcoatl-pass/quetzalcoatl_proof.jpg. Notes champions-combat.md "THE QUETZALCOATL PASS".
