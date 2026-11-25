---
name: hud-no-control-lists
description: mondo 11-22 - exploration prompts show only name/level + action with input icon; never list standard controls (car, ship, NPC filler)
metadata:
  type: feedback
---
mondo, 2026-11-22: the NPC proximity box ("A NATIVE · THE GROUND IS THE BOARD [CLICK] ATTACK · ENGAGE") had "way too much info" and lacked the level; then for cars: "its a fucking car, its the same controls every racing game ever, get rid of them". Earlier (11-17) the same for the spaceship.

**Why:** he wants a clean screen; standard controls and flavour text are clutter.

**How to apply:** a prompt box = name, the key fact (level for a fightable unit), the action(s) with their input (mouse buttons as icons like hud.js `_HrlgRmbIcon` / map.js `_hqLmbIcon`). No key-list toasts or sub lines for vehicles; no box while driving / flying. Shipped PR #2423 (NPC box), #2429 (car), pass 2 boats + ladder/seat/swim/skate/fight-toast filler. Door gun toasts kept (game-only keys). Pass 3 (PR #2440): toast flavour lines gone too ("NOBODY IS DRIVING IT · CROSS AT THE LIGHT" was the miss); no jokes/lore/explanation in any toast. Notes: ui-menus-audio.md "THE SHORT PROMPT", door-gun-skate-vehicles.md "THE CAR".
