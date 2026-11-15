---
name: no-new-map-rules
description: Maps get danger from geometry + existing terrain rules only; never add a map-specific death/movement rule
metadata:
  type: feedback
  modified: 2026-10-20T11:50:09.401Z
---

Never add a new gameplay rule for a map (e.g. a lava-pit insta-kill, a no-walk-in block). Build the hazard from geometry (deep low tiles, ledges) and let the game's existing rules (applyFallDamage, lava endTurn burn, height/climb rules, forced movement) handle it.

**Why:** Hell walkways PR #371 shipped lethal lava pits; mondo 10-20: "we already have rules for lava and fall damage, why would you add new rules? Thats a huger change to the game... i never asked for that". Reverted in PR #375.

**How to apply:** When a map brief says "you can fall in", make the fall physically possible on the board and stop there. Any change to combat rules needs his explicit ask. See [[zones-plan]].
