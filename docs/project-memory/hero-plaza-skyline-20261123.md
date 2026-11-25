---
name: hero-plaza-skyline-20261123
description: Hero Plaza skyline BUILT + LIVE 11-23 (PR #2481, data.js ddd1a352): 6 towers + Superhero Tower 175 m + mid-rise fill; waits mondo's Downtown F3 paste
metadata:
  type: project
  modified: 2026-11-23T17:27:51.706Z
---
Thread (owner-project id), step 1 of [[disaster-city-skyline-plan-20261123]].
- LIVE 11-23 ~17:30 UTC: PR #2481, token 20261123-heroskyline-01-cors. Code docs/disaster-city/districts/H.js: `HT` (Superhero Tower heights), `OCH` (Office Court slab), `TW[bid]` = tower as own arch row `arch:<bid>:tower` (Daily Globe, Umpire, Pan-Ham), Pencil + Prewar as whole B buildings with walk-in lobbies (IN/IN2). Pencil REPLACED pack_bld_09 shop block; Prewar REPLACED Townhouse row (plan said "filler", they were named buildings).
- Pan-Ham ghost block `dc:H:panham-w0` (skinless 3-storey texbuilding on station roof back half). Each new tower <=4 materials, 15 new meshes total.
- Mid-rise fill in H = only 3 infill rows (dc:in66/79/80 to 5/7/6 storeys); rest of fill is Financial's.
- F3 GOT 11-23 18:26 UTC at Press court (build hotelmd-01, WebGPU Firefox, pixel ratio 2): 41 FPS, middle frame 20 ms, CPU 13 ms, 40 draws; no tower in heaviest draws or slow shader builds; Hero Plaza dips = single 50-62 ms frames, 70-80% outside JS. Verdict: towers not a measurable cost, other districts can go ahead (coordinator releases).
- Not done: Pan-Ham lobby (Transit court still solid roof route), no tower signs. Shots /mnt/project-files/disaster-city-skyline-hero/.
- Hero Tower floors thread ((owner-project id)) may raise its floors now the outside is 175 m.
- Colonnade moved out of walk-in pizzeria 4 m south, PR #2489 (data.js af6df70c).
