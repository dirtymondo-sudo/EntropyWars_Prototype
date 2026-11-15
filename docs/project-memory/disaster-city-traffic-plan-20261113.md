---
name: disaster-city-traffic-plan-20261113
description: Disaster City traffic lights / 16 vehicles / Bus Line 1 SHIPPED PR #1280 (11-13), NOT seen in game; road facts, models, code names, what mondo must eye
metadata:
  type: project
  modified: 2026-11-13T17:55:50.637Z
---
Thread (thread in the owner project) "Plan city traffic and bus routes". mondo 11-13 17:20 asked; plan + mock-up posted; he tapped "Build it as drawn" 17:33. SHIPPED PR #1280 (merged 11-13 ~18:15, data.js + three-renderer.js live). Mock-ups + GLB copies: /mnt/project-files/city-traffic-plan/. Notes: docs/notes/areas-complexes.md "DISASTER CITY, THE TRAFFIC".

FACTS:
- Roads (plot coords): west avenue x=3, east avenue x=8 (x=11 south of y=7), north street y=1, cross street y=7, south street y=11. Names = my labels, not canon. NO road leaves the city: west avenue dead-ends at Boxing gym P03-00, cross street at Campus gate P00-07 (I had drawn "gates" on the mock-up; wrong, told him). Police streets (no moving cars): x=8 y8-11, y=11 x8-11, x=11 y8-11.
- Models (no Meshy; Elbolilloduro CC0; bake-pack-pieces.py jobs street_signal / transit_bus / bus_stop_sign; R2 Assets/world/packs/elbolilloduro/): ebd_pizzeria_street_signal.glb (3-faced yellow head, mast arm, blank face +X), ebd_busstop_transit_bus.glb (nose -X, 6482 tris), ebd_busstop_bus_stop_sign.glb. Catalogue street_signal / transit_bus / bus_stop_sign; vehicle kind `citybus`.
- Code: three-renderer.js _HQ_SIGNAL, _hqBuildSignals, _hqTickSignals, _hqBuildBusStops, _hqRouteMarks, U-turn in _hqRouteCorner (`u`), stops/queues/knot breaker in _hqTickTraffic, probe ThreeRenderer.hq.dev.traffic(). Room rows `signals`, `busStops`, route `bus: true` (bake-disaster-city.js "THE TRAFFIC" + "THE BUS LINE"). Off: window.EW_HQ_NO_SIGNALS. Groups flagged _ew_hqSignal (static batch skips), registered with _hqChunkReg.
- Lights: (3,1) T, (3,7), (8,7) = 11 masts; (8,11) police T blinks red, 3 masts. 16 vehicles: ring 3+3, west avenue run 4, freight 2, strip taxis 2, buses 2. 9 stops (one per district; Bayside Gate = line end at district line); 5 new shelters (Southside, Financial, Entertainment, University, Industrial), none displaced a lamp/hydrant/bin.
- NOT SEEN IN GAME: the auto-mode classifier refused the headless browser (RULE #1c). Checked by running the game's own traffic functions in Node for a simulated hour (scratch sim; found + fixed a gridlock). mondo owes a look: mast facing + lens discs, bus nose direction, sign facing, FPS. If he asks for a playtest, that unlocks the browser.
- Open / offered: city gates (roads out), pavement bands across roads at some plot edges (P03-02, P08-05, junction plots), existing Bayside shelter sits in the mouth of the north arm at Police staging P08-11, left turns do not yield, stop names shown nowhere.

Related [[disaster-city-144-20261113]] [[perf-city-chunks-20261113]] [[disaster-city-shared-pieces-20261113]]
