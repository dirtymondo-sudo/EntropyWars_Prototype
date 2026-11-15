---
name: ladder-flush-20261115
description: Disaster City fire escape platforms now level with the roof (flush landing, one ladder), LIVE PR #1405 11-15; what changed, what is unseen, two leftovers
metadata:
  type: project
  modified: 2026-11-15T08:56:32.946Z
---
Thread (thread in the owner project) "Fix ladder platforms reaching rooftops". mondo 11-15 08:35: platforms stop short of the roof, "I should just be able to walk off the platform and on to the roof/floor", and walking off he fell and clipped into the building. Follows [[ladder-wedges-20261113]].

- LIVE PR #1405 (token 20261115-flushladder-01-cors; data.js 94810cce). Thread left open for his look.
- Causes: the platform was a HALFWAY landing (3.5 m, second ladder to the 7 m roof); the hidden slab ended at the wall (a strip to fall through); a yard hedge at a building's foot pulled a roof-edge walker down inside the building.
- Fix: `landing` row `flush: true` (data.js hqTerrainLandings) = top level with the roof behind it, ONE ladder from the yard (bake-disaster-city.js). Slab laps 0.6 m into the mass. `_hqTLandingMouths` opens the drawn parapet at the mouth (compile time, arch copies). hqTerrainFeet ignores a wall whose top is under the ground. Notes: docs/notes/areas-complexes.md "THE FLUSH LANDING".
- 16 of 18 flush. LEFTOVERS: landing 0 (P01-08-B1) and landing 10 (P06-05-B1) have no roof behind them (buildings became walk-ins): still halfway balconies leading nowhere. Not removed (never delete content); he was told.
- Cyberpunk streets + old streets keep halfway landings + upper ladders (stairs need them); only the fall-through gap is closed there.
- NOT SEEN ON SCREEN (RULE #1c, he did not ask for a browser run himself). Checked offline in node only. Known: Industrial P01-08-B2 drawn roof cap sits 0.25 m over its walked roof.
- Any new fire escape in the city: use a flush landing, never a halfway one.
