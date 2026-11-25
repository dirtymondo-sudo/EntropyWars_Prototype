---
name: stair-straight-sides-20261124
description: Banks leaning over stairs (Disaster City etc.) fixed in the engine 11-24, PR #2529 (THE STRAIGHT SIDE); city probe OOM tip
metadata:
  type: project
  modified: 2026-11-24T15:25:18.508Z
---
Thread (owner-project id) "Stop slopes clipping into city stairs". mondo 11-24: stairs all over Disaster City have the ground beside them sloping into the steps.

- Cause: data.js hqTerrainCompile THE JOINED FLIGHTS skipped lattice nodes exactly on a flight's side line; on lattice-aligned flights (all city ones, cut into the upper plot) the high ground sloped 0.875 m over the treads. Fix = THE STRAIGHT SIDE (generic, every room), kill switch window.EW_NO_STRAIGHT_SIDE. LIVE PR #2529 (data.js e1d9c289, token 20261124-stairsides-01-cors).
- 28 flights fixed (city 7, Katana 7, Hell 6, Antarctica 3, others 5). Pictures /mnt/project-files/stair-sides/. Notes: areas-complexes.md "THE STRAIGHT SIDE".
- Probe tip: the Disaster City probe gets OOM-killed in the cloud (chrome ~6.6 GB, dmesg shows memcg oom); add EW_HQ_NO_TRAFFIC,EW_HQ_NO_EDGE_LAND,EW_HQ_NO_PROPS to --flags to get pictures. Restart `npm start` after merging main if the probe says "page never ready".
