---
name: crater-floor-fissure-gap
description: PR #475 (2026-10-24) spell craters capped at 2 tiles, Fissure cuts to lava bed; permanent-height rule set awaiting mondo's pick
metadata:
  type: project
  modified: 2026-10-24T02:51:05.802Z
---

PR #475 (merged 2026-10-24, zip ENTROPY_WARS_SYNC_20261024-0250):
- No spell sinks a tile more than 2 below its height before the first spell touched it (TERRAIN_RESHAPE_CONFIG.spellSinkMax). Flat Earth is capped too. Build and Dig are untouched.
- Fissure (`terrainDeform.toBed`) cuts 3 tiles to the board's bottom layer, which is lava on standard boards, and shows rock walls. It still closes on the 3-round terrain timer.

The rule set is still OPEN. mondo leans toward making height changes (craters, Rampart, raises, Fissure gap) permanent and keeping type changes (liquids, paint) at 3 rounds. The thread posted a decision card recommending that. Don't build it until he picks.

**Why:** he asked for one consistent rule set and said not to have craters vanish overnight. The brief said to build only after he chooses.
**How to apply:** any later crater/terrain-timer work should check this decision first. Related: [[index-rules-elements-terrain-camera]]
