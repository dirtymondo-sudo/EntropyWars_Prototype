---
name: car-hills-turning-20261122
description: Car could not climb Disaster Hills roads + turning too wide (mondo 11-22); cause, fix PR #2442, numbers to tune, probe hooks
metadata:
  type: project
---
Thread (owner-project id) "Make car driving fluid on hills". mondo 11-22: car must turn tighter and drive up the roads to Disaster Hills, "as fluid as riding the skateboard". LIVE PR #2442 (token 20261122-carhill-02-cors; three-renderer 418edbfc, data acf090f1). Follows [[car-driving-20261122]].

- Cause: `_hqCarHits` held the body against ONE height (car's middle); hill roads climb 0.3-0.5 m/m so the nose read the road as a wall. Also `_hqSurface` refuses a spot more than a climb (0.62 m) over the asker's curY, so wheels must be asked from their own last height (`V.wg`).
- Fix: `_hqCarWheels` + body held against the wheels' plane. Numbers in data.js `HQ_SEA_RULES.car` + three-renderer `HQ_SEA_DEFAULT.car` (keep in step): steer 0.88, steerHi 0.22, steerIn 10, steerMax 1.1, grade 0.9, hill 0.3.
- **How to apply:** "still too wide" = raise steer / steerHi; "loses speed uphill" = lower hill; car stopped somewhere = read `ThreeRenderer.hq.vehicle().bumpWhy` (EW_HQ_DEBUG). Probe: `hq.dev.ship({x,z,yaw,v})` stands the driven car; hill roads: Canyon Road x 63, z -280..-336; canyon road z -262.5.
- Seen in cloud browser: taxi up both canyon roads without stopping. NOT seen: the turning feel at speed (cloud game time runs ~10x slow), other car models on the hill. Waits his Mac look. No control text was added (his rule, PR #2429).
