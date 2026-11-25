---
name: grass-two-sides-20261118
description: Walked-room grass only showed from one side (fixed PR #2074, 11-18); realistic-grass mock-up (blade fans) waiting on mondo's OK
metadata:
  type: project
  modified: 2026-11-18T03:26:11.151Z
---
mondo 11-18: "In story mode the grass blades are only showing from one side, please fix. Then can you also make the grass look better, more realistic". Thread (owner-project id). Related [[grass-field-20261112]].

- CAUSE: walked-room tufts (`_hqGrassTick`) turned to the board's camera (`ThreeCamera.getCamera()`, still while walking) instead of `_hq.camera`; tufts are FrontSide, so looking the other way culled the field. FIX PR #2074 (three-renderer.js 93c0cefe live, ?v=20261118-grass2side-03-cors): `_ggFace(G, cam)`, walked room has its own right uniform `S.right`. Proof /mnt/project-files/grass-two-sides-20261118/.
- MOCK-UP (NOT shipped): shape `fan` = 5 tapered blades per tuft from one root, ~14% dry straw blades (`_ggBlade`, `GGRASS.dry/dryShare`), taller (hMin .09 hMax .27), HQ perSquare 10. Code = /mnt/project-files/grass-realistic-mockup-20261118/fan-mockup.patch (generalizes the fixed 7-corner / 15-index loops to any shape). Pictures same folder. Fewer triangles than today's High. - PROBE LESSON: retune live needs `setGrassField('low')`, then 'high' AFTER a tick (setTimeout), or cells keep the old shape; switching shape without rebuild corrupts the index (bad indices -> invisible field).
- 11-18 9:27 PM CT his words on mock-up 1: "looks better but ... too spiky and unrealistic". MOCK-UP 2: fan = 7 thin curved blades (3 segments, arch outward), perSquare 9, hMax .30, dryShare .10, lean .30; ~5.7k tufts, ~200k tris (= today's High). Patch curved-blades-mockup.patch, pictures grass_mockup2_*.jpg. - SHIPPED 11-18 PR #2079 (he said "yeah that's better" to mock-up 2): fan is the default on board + walked rooms, three-renderer.js cde0afbf live, ?v=20261118-grassblades-01-cors. Notes maps-terrain-battle.md "THE CURVED BLADES". Board only seen at battle-camera distance.
