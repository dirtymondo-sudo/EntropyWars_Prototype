---
name: bug-colony-redesign-20261117
description: Bug Colony (Leylines district B) redesign SHIPPED PR #1947 (11-17): Giant Tree + Hive NW, Anthill SE, hive + nest inside rooms; open for his review
metadata:
  type: project
  modified: 2026-11-17T09:58:08.363Z
---
Thread (owner-project id). mondo 11-17: "giant beehive on a giant tree above ground, and the anthill underground", "put them opposite of each other". Shipped PR #1947 (data.js 6fb55c9b live): Giant Tree + Hive on NW plot P03-00, Anthill on SE plot P05-02; inside rooms site_prebuilt_gobekli_hive (7 hex chambers) + site_prebuilt_gobekli_nest (ant tunnels, 3 levels). Proof pics /mnt/project-files/leylines-one-world/bug-colony/. Eggs/larvae/honey are drawn shapes (no Meshy). Waits his review. mondo 11-17 04:00 CST: "fine for now but that tree looks terrible"; exterior + interior passes added to the plan (BUILD_PLAN.md Phase 6, PR #1948).

**How to apply:** content = docs/areas/leylines/districts/B.js (`ways()` + `insides()` new stages); rebake `node bake-leylines.js` then `node bake-route.js L14` then `node bake-map.js site_prebuilt_gobekli_ow_bugs`. Notes areas-complexes.md "BUG COLONY, THE GIANT TREE + THE ANT NEST".
