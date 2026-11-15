---
name: stadium-garage-maps
description: 2026-09-26 rebuild of the football stadium (THE BOWL) and the garage (Room P1) as built architecture; zip, token, rules learned
metadata:
  type: project
  modified: 2026-09-26T08:39:59.959Z
---

Thread "stadium and garage maps" (2026-09-26): zip /mnt/project-files/maps/ENTROPY_WARS_MAPS.zip, token 20260926-maps-01-cors (data.js, three-renderer.js, map.js to R2; index.html + data.js to Render; tests + docs to repo). Not yet checked by mondo live.

mondo's asks: maps used raised floors too much; wants real architecture (stands, bridges, stairs, tunnels you walk on and into). Stadium = flat grass gridiron + bowl of stands + tunnel to the city. Garage = round like Central Egress, open to skate, ramp a car fits on, NO door to H-Wing (H-Wing must stay hard to find; the only way in is now deadend/hwing).

Built pieces now in data.js: hqStandBowl (stands/concourse/facade/tunnels), hqGridironMarks (field paint via terrain.marks), hqRingQuad (mitred ring chords), spiral ramps, arc bridges, wall rows with ghost/slopeTop/tier/quad/seat. Notes: docs/notes/areas-complexes.md "THE BOWL", hq-building-rooms.md "THE PARKING GARAGE". Test: stadium-garage.test.js.

Gotchas: a bridge overrides walls in hqTerrainFeet (a deck reaching past a wall lets the walker walk over it, making traps); ring skip ranges are chord-midpoint based, so put jambs at chord boundaries; the screenshot probe needs WAIT >= 30 s for the garage in the sandbox. Related: [[door-gun-plan]].

Heads-up for later threads: on 2026-09-26 `npm run test:full` was ALREADY red on unchanged main in about 25 heavy tests (Downtown/Cyberpunk city plans, the fairy-forest stair tape, hollow_earth_blast mask, Camelot's Round Table, check-terrain timeout, a renderer stub missing _hqLightRules). Compare against a clean worktree of HEAD before blaming your change. The fast `npm test` was green.
