---
name: wendigo-pass-20261117
description: Wendigo race polish 11-17 (PR #1914): Feast +30% vs Bleeding, FED/HUNGRY chip, HP 1250, own VFX; probe recipe on project files
metadata:
  type: project
---
Thread (owner-project id) (mondo 11-17: per new race, flesh out spells + VFX, test mechanics). Shipped PR #1914, token 20261117-wendigo-01-cors, live on R2.
- Feast bonusVsStatus bleed x1.3 (Rend -> Feast combo); hud chip FED/HUNGRY from unit._fedRound; HP 1350->1250 (POWER 862, median 811). No OK from mondo on these yet.
- VFX block "THE WENDIGO'S LOOKS" in three-vfx-effects.js after the Skater's; hunger tick fires fireGeometry('wdHunger').
- Probe: /mnt/project-files/wendigo-pass/probe/wd.js (VS-CPU board; real round end = controllers {1:'local',2:'ai'} + call triggerEndTurn() each 1.5 s) and show.js (frozen clock looks). Chip text is not in document.body.innerText; read it on the screenshot.
