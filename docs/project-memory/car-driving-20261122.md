---
name: car-driving-20261122
description: Arcade car driving (parked cars, E to drive) shipped PR #2384 11-22; what is built, what is unverified, known limits, probe hook
metadata:
  type: project
  modified: 2026-11-22T13:22:29.875Z
---
Thread (owner-project id) "Add arcade car driving". mondo 11-22: parked city cars offered E but "act like a boat"; wanted simple arcade driving like the skateboard, player hidden (no interior). LIVE PR #2384 (token 20261122-cardrive-02-cors; three-renderer 09ce205f, data deaba1f7, map d566c956).

- Cause: catalogue `vehicle: true` was registered with the helm since the spaceship (11-17) and fell to the skiff's rules.
- Built: three-renderer.js "THE CAR" (`_hqTickCar`, `_hqCarHits`, kind `car` in `_hqVehicleRegister`), numbers data.js `HQ_SEA_RULES.car`; `noDrive: true` on a catalogue row = prop only. Notes: docs/notes/door-gun-skate-vehicles.md "THE CAR". Probe hook `ThreeRenderer.hq.dev.carRun(id)`.
- Seen in cloud browser: a taxi (E in, hidden driver, turn, wall bounce, reverse, E out). NOT seen: school bus / fire truck / ambulance moving (Meshy `turn: 90` rows: nose direction unverified; browser crashed loading the city 3 runs).
- Limits told to mondo: ~18 of 95 city cars cannot move from their spot (inside building mass, deck edge, against wall); no engine sound; wheels do not turn (pack wheels painted on); traffic cars not takeable; moved cars reset on leaving the zone; `drop` 0.7 m = cars never leave their city level except by sloped streets.
- Waiting: his look on his Mac.
