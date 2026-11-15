---
name: lava-water-stone
description: Water + lava = stone terrain and rain putting out ground fire (PR #294, 2026-10-18)
metadata:
  type: project
  modified: 2026-10-18T06:41:43.110Z
---
PR #294 merged 2026-10-18, zip r2-sync/ENTROPY_WARS_SYNC_20261018-0641.zip.
- New terrain `stone` (moveCost 1, rocks_5 sheet). map.js lavaWaterMixOf inside setTerrainAt: lava on water / water or ice on lava = stone. Great Flood's old obsidian quench now gives stone.
- Rain weathers (def.soaks) put out all burning tiles under the rain only when they FORM (mondo: fire spells must still work in rain); they harden the fight's lava (not the map's own lava) on forming and every round end (state.js rainOnTheBoard).
- **How to apply:** default choices he hasn't confirmed: map's own lava stays under rain; water/ice element hits on lava also make stone.
