---
name: sedan-car-form-20261024
description: Sedan (honda civic) stays a car for attacks/casts until Transform (PR #500, 2026-10-24); car rams flat, respawn drops stale robot
metadata:
  type: project
  modified: 2026-10-24T16:16:42.710Z
---

mondo 10-24: "if i attack as a car i wanna see the car do it, not the robot, unless i transform first." PR #500, token 20261024-sedancar-01-cors.

- battle.js UNIT_ANIM_OVERRIDES['honda civic'] has NO castSprite/attackSprite now; robot only via formSprites.mecha (STATUS_DEFS mechaForm from the Transform spell).
- sprites.js car def `drives: true` → three-renderer.js `_unitDrivesNow` makes the melee strike roll along the ground (ram) instead of the hop.
- map.js resetUnitPowerState drops `_spriteOverride` when no `form` status is worn (Sedan that died in Mecha came back as robot model with car stats).
- Proof shots: /mnt/project-files/sedan-car-form/.
- Related: a parallel "Time Cop" thread (sheriff/cop/future cop unit) also touches UNIT_ANIM_OVERRIDES.
