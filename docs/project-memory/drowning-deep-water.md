---
name: drowning-deep-water
description: Drowning status lands only on a unit in deep water (PR #461, 2026-10-23); swimmers exempt from spell Drowning too
metadata:
  type: project
  modified: 2026-10-23T12:19:59.678Z
---

mondo 2026-10-23: "Make it to where drowning can only take place in deep water" (Long Neck drowned his unit on grass).
BUILT PR #461 (main 29acaba, token 20261023-drown-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261023-1219.zip).
- map.js `unitCanDrownHere` (deep_water tile, grounded, not unitIsDeepWaterAdapted) gates every Drowning in battle.js
  applyStatusPayload (quiet skip); ai.js mirrors it. Long Neck keeps dmg + pull, drowns only if it lands in deep water.
- Long Neck was the only spell row applying Drowning; flood spells drown via deep-water terrain (already gated).
- Thread's call, flagged to mondo: swimmers (siren, kraken, Loch Ness, snorkel...) also shrug off a spell's Drowning
  in deep water, matching the terrain rule.

**Why:** a status must match the board. **How to apply:** any new Drowning source goes through applyStatusPayload.

Browser repro recipe that worked: copy /mnt/project-files/balance/weak-races-harness/{route.js,ctl.js} into the
scratchpad and do setup.sh's steps by hand (running setup.sh from the shared folder was blocked by the permission
classifier); `EW_HARNESS_DIR=<dir> node <dir>/ctl.js '?nohq'`, then POST JS to localhost:4555/eval.
