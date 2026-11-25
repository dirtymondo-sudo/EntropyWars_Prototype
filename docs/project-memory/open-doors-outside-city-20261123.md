---
name: open-doors-outside-city-20261123
description: Interiors step 2 outside Disaster City ((thread in the owner project)): what opened, what is left, the doorway-width lesson
metadata:
  type: project
  modified: 2026-11-23T19:50:30.486Z
---
Thread "Open every door outside Disaster City" (11-23). PR #2496 (outhouse, woods cabin, Babel's 4 houses; bake-open-props.js cuts a Meshy door out) and PR #2499 (trailer homes 1-6 from the pack scene, sunk 0.81 m via hover; lighthouses dropped from find-doors: no door on the model). Both merged + live.

PASS 3 (PR #2502, merged + live): Harbour stilt houses open (wet ladder from the sea, hidden porch + floor slab, lifted rows measured from the swimmer's height via data.js hqLiftGround, furniture `liftY`); Estate field shed's west door reached (one `area` row in docs/plans/world-polish/plans/estate.js, then bake-estate + bake-route R7 + bake-map). Not doors to fix: Haunted House rim houses are scenery past the room edge; Heaven Room 777 is reachable (find-doors under-reads floating stairs). Outside the city, every reachable door now opens.

**Why:** mondo: "If there is a door the player should be able to walk inside of it."
**How to apply:** a walk-in row's doorW must be >= ~1.05 m (the walker stopped dead in a 0.87 m gap, seen in the browser); a mesh collider's 0.25 m columns also shut a narrow doorway, so sunk/hover shells have none. Summary file: /mnt/project-files/building-interiors-kits/doors_open_outside_city.md. Notes: areas-complexes.md "THE OPEN DOORS".
