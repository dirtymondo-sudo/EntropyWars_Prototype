---
name: disaster-city-southside-20261113
description: Disaster City Southside district (R) buildings: exteriors LIVE PR #1289 + #1307 + polish #1325 (11-13); interiors #1342 + pass 2 #1355; DETROIT look #1428 (11-15, fist concept waits OK); what is built, deviations from the approved plan, open points, how to shoot the city headless
metadata:
  type: project
  modified: 2026-11-14T01:10:00.000Z
---
Thread (thread in the owner project) "Design Southside district buildings" (mondo's 11-13 16:41 ask; his OK 17:14 "pizza yes, ok").
Plots P00-00..P03-03. All code in `docs/disaster-city/districts/R.js`; rerun `node bake-disaster-city.js`. Notes: docs/notes/areas-complexes.md "DISASTER CITY, SOUTHSIDE".

- LIVE: PR #1289 (30 buildings as `arch` rows, pack whole buildings, 7 walk-in shells) + PR #1307 (bigger windows + ground row shop panes per his 18:49 rule,
  corner shop pack block at street level, canal moved into the levels' sunk ditch). data.js uploaded both times.
- POLISH PASS LIVE PR #1325 (his 20:15-20:19 asks: more detail layers, roofs + AC units, different sheets/decals per building part): all in R.js helpers
  (`a.wins` sills/lintels/wall AC, `a.floors` string courses, `a.panel` door step + hood, `a.roof` ridge caps + vents, `dress()` base course, frieze,
  corner piers, downpipes, rooftop AC, decals). Walked roofs kept clear on purpose. Shots polish_1.jpg, polish_2.jpg.
- NOT USED YET in Southside: SIGN LETTERING (PR #1327): arch part key 'txt:WORDS|fg|bg|aspect' draws real sign text (no apostrophes; empty bg + kind:'over' = letters only). Candidate for shop signs on the next pass.
- INTERIORS LIVE PR #1342 (his 21:04 go, plan OK 21:23 "okay"; plans interiors_1/2.jpg, game shots inside_1/2.jpg): R.js `inside(id, gx, gy, fn)`. HIS GRID RULE
  (21:14 + 21:17, all interiors): rooms read on the 3.5 m BATTLE squares (not 1.75 m); a barrier fills WHOLE squares centred (`R.cell`/`R.block` ghost),
  walkways whole squares wide, nothing halfway across two; decor on walls/corners/overhead. Squares: church 5x5 (+1 m strips), gym 5x5, bakery 3x5,
  pawn 5x3, kitchen 8x3, dojo 9x3, garage 8x6 (+1 m back strip). No-model pieces (ring, bags, weights, lift, tyres, mat, posts, counters) = arch row `dc:<id>-in`.
  LESSONS: a prop standing in a ghost wall stands ON its top unless `floor: true`; a vehicle ignores that, so the lift's ghost top (1.55) is the car's
  height; floor overlays need >= 0.05 m or they z-fight the room floor.
- SECOND INTERIOR PASS LIVE PR #1355 (11-14, (thread in the owner project): 18 Meshy props (ring, bags, lift, tyres, dummies, taiko,
  candelabra, votive, jewelry case, steam tables...), `R.liner`/`R.lamp`/`R.wq` look. Inside walls stand 0.30 m in; ceiling = texbuilding h - 0.32; wall props via
  `mount`. Shots project files disaster-city-southside/interiors-2/.
- BEDROOMS LIVE PR #1370 (11-14): P00-01-B2, P00-02-B2, P02-01-B1, P03-00-B2 walk-ins, 9 beds; 5 displaced residents moved in (told residents thread). Headless: prop static batch drops props (EW_HQ_NO_PROP_BATCH shows them).
- DETROIT LIVE PR #1428 (11-15, real-cities brief, his 'Build it as drawn' 12:32): R.js `detroit()` palette in arch() (brick/limestone/slate; `det:false` opts a part out), church tower 27 m, Community gate = train depot front, gym steel frame + BOXING sign, car works + car on roof, burnt porch house, Street court mural wall (`mural()`), street block (wire_fence, cars on 2 squares, burn barrels glow, poles + wires, weeds). BRONZE FIST: concept sent (project files disaster-city-southside/fist/fist_concept.jpg), WAITS HIS OK; then Meshy image-to-3d, catalogue row, set `GYM_FIST` in R.js, MODEL_LIST. Shots detroit_1..3.jpg. castle_wall sheet reads dark olive, use plaster for pale stone.
- DISTRICT MOVE (PR #1482, 11-15): Southside now stands south-west (city columns 0-3, rows 8-11). R.js needs NO edit (plot ids = built place, the bake shifts the city during the hook); levels = old numbers minus 7. Headless teleport x/z/y from before the move are stale: read new places from a DC_DUMP. Notes areas-complexes.md 'THE DISTRICT MOVE', docs/disaster-city/move.js.
- Mock-up deviations (told to mondo): laundromat on the Canal walk; Quequis house on Pawnshop court; car wash, no street court.
- OPEN: the canal's water sheet did not show in the last headless run (ditch + rowboat do). He has not seen it on his Mac yet.
- Lessons: an `arch` row or `texbuilding` over a roof-walk plateau takes the plateau roof as its ground: arch rows are now lifted by the tool (THE LEVELS),
  a pack-block texbuilding needs its own `y` (R.js `plotY`). After THE LEVELS (levels.js, Southside = levels 10..14) every headless teleport needs
  `y: level*1.75` or the camera is under the ground.
- Headless shots: scratch probe (copy of playtest_city.js) with `--wait=400000`; the city_* pack buildings need about 7 minutes to load there.
  Shots: /mnt/project-files/disaster-city-southside/game_1_street_and_plots.jpg, game_2_plots.jpg (+ mock_1..6).
Related [[disaster-city-shared-pieces-20261113]] [[disaster-city-144-20261113]]
