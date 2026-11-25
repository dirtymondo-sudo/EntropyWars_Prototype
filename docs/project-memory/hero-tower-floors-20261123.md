---
name: hero-tower-floors-20261123
description: Superhero Tower's 7 floors + roof as one stacked room behind the lobby lift (building-interiors plan step 1), 11-23
metadata:
  type: project
  modified: 2026-11-23T17:18:07.832Z
---
Thread (owner-project id) "Build the Superhero Tower's floors". Part of [[building-interiors-plan-20261123]].

- Room `site_prebuilt_hero_tower`, written by `bake-hero-tower.js` (data.js block HERO-TOWER). 8x8 squares a floor, floors 5.25 m apart (F1 y0 .. roof 36.75). Floors (draft list, mondo may rename): 1 Security, 2 Press + fan mail, 3 Costume dept, 4 Training floor, 5 The lab, 6 Monitor room, 7 Penthouse, R roof helipad.
- No stairs (the engine can't stack a stair over a walked floor): THE LIFT = a panel (map.js `_hqLift*`) that hops inside the room (three-renderer.js `_hqLiftHop`, black fade) or loads the city lobby. Lift doors carry `lift: <room>`, `onDeck: true` (no door pad; `hqTerrainDoorY` returns door.y). City lobby has 3 lift doors `hero_lift_a/b/c` (districts/H.js `HERO_LIFTS`). Story door THE TOWER unchanged.
- Glass walls show the real city around (city rows within 72 m copied in, shifted). Soft-lock finder: 0.
- Not done: no fire stair; training floor is not a fight arena; the tower's outside raise to 175 m belongs to the "Raise Hero Plaza's towers" thread.
- 11-23 mondo: lift panel = floor number + name ONLY, no sub lines ("way too wordy"). PR #2488.
