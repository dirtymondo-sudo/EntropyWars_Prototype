---
name: aim-side-colours-20261111
description: Spell preview tile colours come from what the spell does (PR #1118): support green, red only for what hurts; what was left as-is and what mondo may still overturn
metadata:
  type: project
  modified: 2026-11-11T10:31:45.379Z
---

mondo 11-11: Purify's 3x3 on his own unit drew red; "shouldnt it be green because 1) its healing, 2) its not even a damaging spell."

SHIPPED PR #1118 (thread in the owner project): data.js `spellAimSide(row)` = harm (red) / help (green) / neutral (purple area, blue place tile). Every preview painter reads it (ui.js aim footprint + single tile + self cast + reach lattice, battle.js move→cast footprint, hud.js quick menu). Colours are the UI Maker's existing heal / util / place hexes. Proof /mnt/project-files/aim-side-colours-20261111/ (WebGL2 only, not WebGPU).

**The thread's picks, his to overturn:**
- A hostile cast with NO damage (debuff, Exhaust Cloud, pull, possession) stays red (the older "red = hostile" convention).
- Divine Light (heal + sear on enemies beside the ally) is green.
- Summons, turrets, doors, deployables aim with the blue "Placeable" tile, weather areas purple, instead of red.
- A buff's single aim tile stays the blue "Buff spell reach" (his UI Maker setting), not green.
- Purify's area is all green even over an enemy who would lose buffs.

**How to apply:** any new preview painter or new spell kind reads spellAimSide; never hardcode red. Follow-ups on tile colours go to this thread.
