---
name: televangelist-polish-20261117
description: Televangelist race polish 11-17: own spell VFX, PLATE chip, CPU scoring, new Tax Exempt spell (PR #1938), waits mondo's review
metadata:
  type: project
  modified: 2026-11-17T09:09:28.541Z
---
Thread (owner-project id) (one of the 11 new races, [[zone-characters-proposal-20261116]]).
Done 11-17: own VFX for every spell (three-vfx-effects.js "THE TELEVANGELIST"), PLATE HUD chip, CPU scoring for Collection Plate / Miracle; notes spells-vfx.md "THE TELEVANGELIST".
mondo asked for TAX EXEMPT (his name): self or ally within 3, every spell half MP for 2 rounds, 30 MP, cd 3; status `taxExempt` with STATUS_DEFS `mpCostMult: 0.5` (battle.js getSpellMpCostFor). PR #1938 merged + live on R2.
Note: Jammed in this game is a sight debuff; the MP-up debuff is the Magician's Pick a Card (+40), which Tax Exempt mirrors.
Probes: /mnt/project-files/televangelist-pass/probe/ (slow clock `__setK(0.1)` to catch flying coins).
**How to apply:** waits his look/feedback; follow-ups go to that thread.
