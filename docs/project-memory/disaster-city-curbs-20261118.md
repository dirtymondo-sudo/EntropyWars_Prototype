---
name: disaster-city-curbs-20261118
description: Disaster City curbs + gutters (11-18): roads 15 cm lower via gen.curb, curb/gutter meshes, battle tiers add the drop back; built on branch, waits mondo's OK
metadata:
  type: project
  modified: 2026-11-18T08:59:37.288Z
---
Thread (owner-project id). mondo 11-18 asked for normal street curbs + gutters, with no combat difference.
Mock-up posted 11-18 ~09:00 (pictures in /mnt/project-files/disaster-city-curbs/). Branch claude/project-thread-x7ucrk commit 970c4dd is pushed, NOT merged. It waits for his OK.

- data.js `_hqTCurbDrop` (called in hqTerrainCompile before THE CLIMB): gen `curb: 0.15, curbBox` lowers street lattice nodes. `_hqTFieldAt` treats mixed cells as sidewalk, so the step sits on the kerb line. `_hqTCurbAt` gives the drop, and hqFieldRasterTerrain adds it back (`cell.curbUp`), so battle tiers are unchanged (checked in Node: 10 windows identical).
- `info.curb` must be a plain enumerable property, because the survey worker's plain copy drops non-enumerable ones.
- three-renderer.js `_hqBuildCurbs` (called from _hqBuildRoadMarkings) builds 3 merged meshes: ConcreteCurb2 stone, ConcreteSidewalk1a edge band (covers the one leaning lattice cell), and ConcreteCurb1 gutter. Kill switch: EW_HQ_NO_CURBS. Edge lines use HQ_ROAD.edgeInCurb.
- The bake line is in bake-disaster-city.js (gen line 924).
- Probe note: playtest_city.js on DC crashed 3 times in a row once and then ran clean. That was flakiness, not this code.
Related [[disaster-city-phantom-walls-20261113]] [[disaster-city-vertical-20261113]]
