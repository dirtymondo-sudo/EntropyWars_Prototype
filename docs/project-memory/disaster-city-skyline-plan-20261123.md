---
name: disaster-city-skyline-plan-20261123
description: Disaster City skyline plan 11-23 (24 towers 55-150 m + Superhero Tower 175 m): sites, doc, pictures, status (waits mondo's OK)
metadata:
  type: project
  modified: 2026-11-23T16:53:40.566Z
---
Thread (owner-project id) "Plan Disaster City's new skyline" = step 1 of [[building-interiors-plan-20261123]]. APPROVED 11-23 17:00 ("Build it, plus the mid-rise fill"); coordinator asked to start the 4 build threads.
Doc: https://claude.ai/artifact/YEe54svVhVbLufjHdfQ5QY · pictures + tools (three.js sketch, towers.json with sites) /mnt/project-files/skyline-plan/.

- Measured (main 5c42270, room features + arch parts): 278 city buildings, 15 over 20 m; Superhero Tower top ~89 m (spire).
- Sites (building id -> tower, m): H: P04-04-B1 Daily Globe 140, P07-04-B2 Umpire State 125, P07-06-B1 Office Court 110, P06-06-B1 Pan-Ham over station 100, P04-05-B2 Pencil 95, P04-06-B2 Prewar 80. F: P11-01-B1 Shard 150, P09-02-B3 Cheese Grater 135, P10-01-B1 Walkie-Talkie 130, P08-00-B1 Hotel 120 (Hotel thread), P11-00-B2 Pickle 95, P09-00-B1 Act of God Insurance 85. S: P06-10-B1 Fears Tower 145, P06-09-B2 Big John 120, P07-10-B2 Corn Cob 60. B: P09-09-B1 Food Hall Condos 115, P08-08-B1 Waterfront Hotel 60 (kept low: blocks hero tower from the sea), P10-09-B2 Hole Condo 75. E: P10-05-B1 Late Fees Tower 100, P08-04-B1 Casino 85, P11-04-B1 Mid Records 55. R: P02-02-B1 Revival Center 100. I: P02-10-B1 Gusher Twins 90. U: P01-06-B1 Bones Carillon 60. Civic: none (second account; DC height law).
- Roof walks on P06-06-B1, P08-00-B1, P09-09-B1: shaft on back half. No skyscraper pack exists: towers = code arch parts + city urban: textures; Gothic pack for #23.
- Perf: <=4 materials merged per tower (~100 pieces, ~0.5 ms); F3 check after Hero Plaza lands before other districts merge.
- Build order proposed: 4 parallel threads (H / F / coast B+E / south+west S R I U). Recommended extra: mid-rise fill (~20 fillers in H+F to 5-8 storeys).
- 11-23 ~17:30 HERO PLAZA BUILT + LIVE (PR #2481): [[hero-plaza-skyline-20261123]]; waits mondo's Downtown F3 before F / coast / south-west threads merge.
- COAST (B + E) BUILT + LIVE 11-23: PR #2491 (data.js 8735ac84, token 20261123-coastskyline-04-cors), (thread in the owner project). Proof /mnt/project-files/skyline-coast/. Palm in Hole Condo's hole unseen headless (needs his look). interior-polish.js now skips props over a walk-in's roof. Notes areas-complexes.md "THE COAST SKYLINE".
