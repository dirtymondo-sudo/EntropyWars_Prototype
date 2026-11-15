---
name: open-world-plan
description: OPEN_WORLD_PLAN.md (2026-09-26) — zones of stitched parts, the stage, the clock, the phases; which phases shipped and what a phase thread must read
metadata:
  type: project
  modified: 2026-09-27T18:00:00.000Z
---
OPEN_WORLD_PLAN.md is at the repo root (copy + probes in /mnt/project-files/open-world/). mondo starts one thread per phase; each appends to §12. Forks in §9; fork 5 RULED; the rest not ruled.

Design: a room stays the authoring unit; rooms on one ground get a FRAME in `DOOR_HQ.world.zones[].parts` (x, z, y, rot quarter turns) and JOINs along shared edges; interiors join by a door that swings; small rooms merge. The STAGE draws the current part + joined neighbours in one scene; the crossing is a swap. `HQ_WORLD_CLOCK` = a 24-minute day.

Order (§10): 0-7, 9-12 done (12 = geography G1, 2026-09-28), 8 skipped; interiors in parallel; 10-14 the engine gaps (§5.9). SUPERSEDED GEOGRAPHY 2026-09-28: [[world-geography-plan]] replaces §4.5 and the outdoor zones with one baked land; Phase 12 runs as its G1, Phases 13/14 as G11/G12.

Phases 0-2 (2026-09-26, zips open-world/…_0/_1/_2, tokens 01-03): `DOOR_HQ.world` + `hqWorld*` readers, LAND map tab, instance pass (test hq-world-map); THE STAGE on the city: `hqStage*` readers, add a zone to `HQ_STAGE_RULES.zones` when its joins exist; renderer `_hqPartFields` = the ROOM's keys, `_HQ_ZONE_KEYS` = the visit's (a new `_hq` key must go in the right one); kill-switch `window.EW_HQ_NO_STAGE` (test hq-stage) ; door joins + stitch (test hq-joins).

Phase 3 DONE 2026-09-26: see plan §12. Clock lives in map.js (_hqClockHour/Advance/Hold), rules in data.js HQ_WORLD_CLOCK (lock, dayLook), renderer _hqClock*; test hq-clock.test.js.

Phase 4 (token 05): wells under their places; zone `woods` = JOINED PARTS (ids kept), `haunted`, `basement` door joins; `gen.mouths`, per-join `stitchM`. Test hq-west. Cleanup + Phase 5 (tokens 06-08): board rooms deleted (site_ aliases land on the entry part), no tape/find/save compat, session end = `npm run test:end`; zones highway, desert, dumb (door joins); bunker rebuild still open. Test hq-south.

Zip 09 + Phase 6 DONE 2026-09-27: open-world/ENTROPY_WARS_OPEN_WORLD_9.zip (token 09: floating grass = hqStageNearbyParts/NearerParts, outer ground cut per nearer set) then ENTROPY_WARS_OPEN_WORLD_10.zip (token 10). Phase 6: zones kingdom (road entry ⇄ ward road join; hall/keep door joins) + mountain (foothills y0, switchbacks y25, summit y60, trail joins; border ward postern ⇄ foothills). Test hq-mountain.test.js.

Phase 7 DONE 2026-09-27 (zip 11, token 11): zone `coast`, harbour sea part, ISLAND joins (cay, Dutchman inside the host), skiff/swimmer crossings. Test hq-coast.test.js. Detail: plan §12.

Phase 8 SKIPPED 2026-09-27 (mondo). Phase 9 DONE 2026-09-27 (zip 12, token 20260927-open-world-12-cors): optimize-assets.js (meshopt + WebP, NO quantize: r128 reads normalized ints raw on the CPU), manifest-assets.js → ASSET_MANIFEST.json ([bytes, sha]); the renderer loads a listed `.opt.glb` instead of the original (no URL renames) and fetches listed files as `?h=<sha>`; cap by quota; hq.warmZone + "The World on Disk" settings group. Test asset-store.test.js. Compression goes live only after mondo runs the tools on his local bucket copy.

Phase 10 DONE 2026-09-27 (zip 13, token 20260927-open-world-13-cors): optimize-assets.js --lod writes .lod1/.lod2.glb (geometry only); renderer THE LOD LEVELS swaps by screen size, culls tiny props (no impostors); THE NEAR FIRST sorts each queue lane by distance (_mqSpots/_mqDistances/_mqCmp: a vm test that extracts _mqPump/_pumpModelLoads must also extract those); THE FAR SHELLS = data.js hqFarParts/hqFarShell + renderer _hqFarTick (thin fog, far plane grows). Test hq-lod.test.js. Probes: `?hq` auto-enters central_egress, so a probe must re-call _hqEnter until the gate names its room.

Phase 11 DONE 2026-09-27 (zip 14, token 14): builders are generators (`_hqSliceAsk` = give me the iterator; `_hqSliceDue()` yields), warm-up `_hqWarmRun` before attach (lights via `_hqStagePick`), static batch `_hqBatch*` (originals hidden only inside renderer.render), `createImageBitmap` sheets. Test hq-attach.test.js; notes rendering-loading-perf.md. Long single units left: field normals/tiles, stands merge, tabletops (~50 ms headless).

**Why:** the phase threads must build from the plan's tables and names, not re-derive them.
**How to apply:** read §4, §5, §10, §11 and §12 first; check §9 for a ruling before building a fork's default. Related: [[stadium-garage-maps]], [[door-gun-plan]].
