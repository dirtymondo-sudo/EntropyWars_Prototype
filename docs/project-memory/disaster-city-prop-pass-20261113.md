---
name: disaster-city-prop-pass-20261113
description: Disaster City prop pass (all districts) LIVE PR #1315 + #1316 (11-13): the prop check + dressing tool props.js, new pack props, what is open
metadata:
  type: project
---
Thread (thread in the owner project) "Clean up and dress city props" (mondo 11-13 19:30: cars on stuff, benches on fences, signs in buildings, add the green subway bin; he chose "Build all of it" 20:03).

- LIVE: PR #1315 (prop check, real road signs, green metro_bin, district wall dressing, sandbags, manholes) + PR #1316 (second wave cut from packs: public_phone, power_pole, garbage_bags, garbage_bag, metal_trash_can, play_slide, play_swing, play_sandbox). Thread open for his review on his Mac.
- Code: `docs/disaster-city/props.js` (kerbSign / dress / check), run at the end of `node bake-disaster-city.js`. Every rebake re-checks every prop against buildings, arch parts, doorways, fences, stairs; shared props move or are left out, district-own props are only listed in `docs/disaster-city/prop-check.txt`. A district thread that adds buildings just rebakes. New prop = add its real footprint to SIZE in props.js.
- OPEN: six district-own clashes in prop-check.txt (three taxis at Financial Taxi court, car_suv + car_pack_2 in garages, one bus shelter) belong to those district threads. The `planter` proc is a bare wooden bed (333 of them), not replaced. Loose tyres not cut (sewers pack has one). Only one playground fit (Southside Townhouse court).
- Shots: /mnt/project-files/city-props/ (1 before map, 6 after map, 10-11 game shots, 12 second-wave models). Notes: docs/notes/areas-complexes.md "DISASTER CITY, THE PROP PASS".
Related [[disaster-city-144-20261113]] [[disaster-city-shared-pieces-20261113]]
