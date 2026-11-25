---
name: sludge-radiation-20261116
description: Radioactive sludge (Sewers district R liquid): mondo picked 11-16 that radiation is its OWN status, Corroded stays chemical fire
metadata:
  type: project
  modified: 2026-11-16T12:00:25.129Z
---
Thread (owner-project id). Proposal: /mnt/project-files/proposals/SLUDGE_RADIATION_PROPOSALS_20261116.md.

mondo 11-16 decision card: "Radiation: its own status". Corroded stays exactly as is (chemical fire, Burn+Poison merge R4, water douses it; only Chemical Concoction gives it directly). Sludge (data.js TERRAIN_RULES.sludge) today still gives Corroded 2 rounds until the new status ships.

SHIPPED PR #1870 (11-16, token 20261116-radioactive-01-cors, R2 live): STATUS_DEFS.radioactive (name his: "radioactive"), stacks to 3, 20/stack/round, drains 1 off sludge, water no cure, glows (fog + can't hide). NOT Poison (his rule: "it needs its own bonus spells"). Sludge gives it instead of Corroded.
SPELLS PR #1871 (his "yes on all 3"): Nuclear Pulse gives 1 stack (+Stagger), Atomic Breath x1.5 vs Stagger or Radioactive, Nuclear Option x1.5 vs Radioactive.
Still open: reactions S4-S7, machines Jammed, Atomic Breath leaving sludge, Kaiju feeding in sludge.

**How to apply:** never rename Corroded to radiation; never give Radioactive countsAs poison; build nothing beyond what he picked.
