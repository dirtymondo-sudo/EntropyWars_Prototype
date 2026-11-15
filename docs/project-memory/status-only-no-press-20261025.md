---
name: status-only-no-press-20261025
description: PR #508 + #510 (10-25): noDamage status-only spells (Fear & 24 others) show no green press ! and do NOT end the turn (mondo's call)
metadata:
  type: project
  modified: 2026-10-25T09:37:35.730Z
---
mondo 2026-10-25: "feared shows me a green exclamation point even though its not even a damaging move?" then "no they shouldnt end your turn".
- PR #508: battle.js spellArmsPress returns false for `noDamage`. Before, the aoe/barrage kind armed the press, the cast never recorded a hit (no refund), and forecastPressOn fell back to the type chart, so the green ! lied.
- PR #510: battle.js spellDealsDamage returns false for `noDamage`, so these casts cost their apCost and keep the turn like a buff (cast, ENDS TURN tags, AP icons, CPU plan all read it). One-cast-a-turn lock unchanged.
- Zip r2-sync/ENTROPY_WARS_SYNC_20261025-0937.zip (battle.js 47d00f84). Screenshots /mnt/project-files/fear-press-mark/.
**How to apply:** a status-only spell is never "damaging" for press or end-turn rules; flag `noDamage` on new curse/fear-style areas.
Related: [[ap-press-icons]] [[press-refund-20261023]]
