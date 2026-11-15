---
name: disaster-city-trees-soil-20261115
description: Disaster City rule (mondo 11-15): trees only on grass/dirt/sand or in a bed; enforced by the last pass of bake-disaster-city.js; PR #1404 live
metadata:
  type: project
  modified: 2026-11-15T08:53:53.923Z
---
mondo 11-15 08:48: "trees are only put on grass or dirt or in a pot ... trees coming out of concrete dont make sense. Get rid of these trees" (screenshot: tree cluster on a concrete plaza with a police barricade). Thread (thread in the owner project).

- LIVE PR #1404 (data.js 2fa2d8a4): `bake-disaster-city.js` last pass "THE TREES STAND IN SOIL". Outdoor `tree` features + `palm_tree` props must stand on a soil sheet (`grass_2`, `desert`); otherwise the tree's 3.5 m square is repainted as a bed (grass; sand under Bayside palms). The bake throws if a tree is left on paving. District threads adding trees just rebake.
- Removed 31 Bayside broadleaf trees on concrete (Cordon plaza 8, Mall concourse 8, Street market 7, Security office 5, East shops 3). My guess that the screenshot is the Cordon plaza / Mall concourse line (not confirmed in game). 127 broadleaf beds + 38 palm beds; 399 trees left.
- Left alone: 6 indoor palms (Luxury hotel lobby, Private garden beds). Offer not built: kerb stone / tree grate round a lone bed.
- Notes: docs/notes/areas-complexes.md same title. Not seen in game.
Related [[disaster-city-prop-pass-20261113]] [[disaster-city-144-20261113]]
