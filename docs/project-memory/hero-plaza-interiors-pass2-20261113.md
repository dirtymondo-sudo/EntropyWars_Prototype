---
name: hero-plaza-interiors-pass2-20261113
description: Hero Plaza (Disaster City) SECOND interior pass 11-13 night: atmosphere kit (liner/lamps/pendants), 8 Meshy models made, shared Meshy claims across districts, HAS() guard
metadata:
  type: project
  modified: 2026-11-13T23:00:09.561Z
---
Thread (thread in the owner project) "Polish Hero Plaza interiors atmosphere" (mondo 22:33: after a district's first interior pass, another pass on Opus high; list models wanted but missing, make Meshy versions, add to the model list; focus aesthetic, vibe, atmosphere). Follows [[hero-plaza-interiors-20261113]].

- Code: docs/disaster-city/districts/H.js `IN2[bid]` runs after `IN[bid]`; kit helpers put/wall/liner/lamp/pendant/sconce/rug, K.H, K.dlx. Light is drawn + glowing only (HQ_PROP_LIGHT_MAX = 10 real lamps for the whole city room).
- SHARED MESHY CLAIMS FILE: /mnt/project-files/meshy/interior-claims.md (all district threads). Convention: R2 Assets/world/props/meshy/<key>.glb + .opt.glb, ASSET_MANIFEST rows, data.js HQ_CATALOGUE_ALL row of the same key, group 'Meshy city interiors'.
- Hero Plaza made (live on R2 11-13 ~23:00): treadmill, welding_cart, photocopier, newspaper_bundles, studio_camera, pallet_jack, hand_truck, mailbox_bank. Originals + concepts /mnt/project-files/disaster-city-hero-plaza/meshy/. Pipeline: Meshy text-to-image (nano-banana-pro) -> image-to-3d meshy-t2.5 smart-topology -> metallic 0 + front turned to +Z (gltf-transform) -> optimize-assets.js.
- Reused from others via `HAS(key)` (checks data.js text at bake time): Southside punching_bag/dumbbell_rack/weight_bench/tool_chest/engine_hoist/tire_stack; University espresso_machine/pastry_case/rope_stanchion; Entertainment studio_light. If they merged after this PR, REBAKE (node bake-disaster-city.js) to bring them in.
- Camera probe: scratch views.js (room frame -> world; face = row.rot looks at the back wall), y = level x 1.75 (levels.js grid: news/garage/press/cafe/gym 8, tower 9, plant/apt/office 7, depot 5).
- MERGED PR #1350 (11-14 ~02:00), data.js + ASSET_MANIFEST live, token 20261114-heroin2-03-cors. Fixes in it: belt course = ring (RING_COURSE) so lit ceilings show; K.wall passes mount 0 (catalogue mount doubled the height, Codex find); K.prop/K.put add 180 to face (a prop's face is a heading, 0 = front to -z; the kit meant 0 = to the door; all chairs/lockers/wall pieces were backwards).
- HEADLESS: the bigger Meshy pieces load (right height, shadow shows) but never draw in the headless browser, like the city's Meshy cars; newspaper_bundles draws. Waiting on mondo's Mac check. Shots: project files disaster-city-hero-plaza/inside2_1..3.jpg, meshy_models_8.jpg.
- BEDROOMS (residents brief) MERGED PR #1372 11-14 ~03:10, data.js live: Apartments A P07-04-B2 walk-in flat (Sidekick, Nephilim, Police officer), Superhero Tower back-corner rooms (Superhero, Eagleman), Apartment stair room (Antihero). H.js helpers partition()/bedSet(); PSX beds' length runs along their own x, headboard +x -> face = foot dir + 270. Residents thread told.
