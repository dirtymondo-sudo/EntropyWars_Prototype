---
name: playtest-mechanics-20261107
description: 11-07 forced movement + two-step targeting VS CPU playtest (report only): bug families A-H, code causes, harness tips
metadata:
  type: project
  modified: 2026-11-07T04:21:07.118Z
---

11-07 thread "forced movement / two-step targeting playtest", main b3ab112, report only, nothing changed.
Report: /mnt/project-files/playtest-mechanics-20261107/forced-movement/PLAYTEST_FORCED_MOVEMENT_20261107.md (+ shots/, ledger, 2 match
exports, spell_list_229.json = the in-scope rows). 3 battles: Mount Shasta x2, Hell Arena. 25 of 229 rows cast in browser.

Worst families (with code causes):
- A1 straight N/S push goes DIAGONAL: battle.js ~77170 `(Math.sign(target.x-unit.x) || 1)`; CPU planner ~39367 same.
  Hits Haymaker, Kinetic Hurl, Shoulder Through, Body Check.
- A2 flyer in a column blocks ground slides: `_slideStepInfo` uses unitAt(nx,ny) with no z (all forced slides).
- B1 chargeToTarget dash (Runaway Train etc.): no enemy in target list/range, in-range enemy click = MOVE→CAST, walks first.
- C prompt bar wrong on 2nd click (Horn Toss, Teleport any unit). D forecasts (no landing on pushes, SLAM badge no slam).
- E log order/wording (pull "3 tiles" counts rebounds). F text vs behaviour (Telekinetic Slam, Grapple line, Walk the Plank).
- G text covered (Sky Tackle pills over nameplate, plates clipped).
CPU never cast a forced-movement spell in 3 battles. Online guest/fog not checked.

Not bugs: extra AP after a damaging hit = PRESS refund; Cyborg Power Core x1.5 MP; hover sets pendingTarget so tile casts
look one-click. Harness: staging with `_ewShotRecApi.place(id,x,y)` (disclose it); wait ~3.5 s after opening ABILITIES
before clicking a row (list slides; wrong row armed); confirm pill click may fail, Enter works; END TURN via
`ph sel ".hrlg-blade" "/END TURN/"`. Related [[playtest-elements-20261106]] [[forced-movement-rules]]

PART 2 (same day, coordinator: "all means all"): 4 more battles (Mount Shasta x2, Stonehenge, Camelot), files run2/. 67 of 229
names now cast (34 me + 10 CPU-only casts + Part 1 25); every mechanic group has a proven spell + a variant table of shared code.
New: J1 Piercing Arrow roots its OWN caster (collisionStatusBoth ~7951 pins rebound hitUnits); J2 Rampart/Pyramid Protocol lift
units incl allies onto the wall; I MOVE->CAST walks caster when height counts toward range (Grotesque Dive, Gravity Crush walked
AWAY, Soul Bind 2nd pick judged on caster range + loses 1st pick); K4 Fractal Needle split hits unseen enemy (fog leak risk);
A1 only hits kind 'displacement' (tackles/_runPostEffects ~2584 push straight). Unproven: leap teleports, Icky Surprise,
Resonance Pulse, Prism Burst wall bounce, Tunnel Network, 2-wide/boomerang/zigzag/lineZone aims. Harness: Homosapien isn't in the roster; party builder slots y=556 at x 340/455/572/688.
PART 3 (coordinator: finish the 6): Spell Lab (window._slbEnterLab(id); real ABILITIES menu) proved leap teleports, Icky
Surprise, Resonance Pulse (pushes 1, text silent), Prism Burst (wallBounce flag never read in code), Tunnel Network (door-pair
walk-through; "attack/cast from the other mouth" NOT implemented), 2/3-wide, boomerang, zigzag, lineZone. 79 names cast; family
fully covered.
FIXES 11-07 (PR #1004, merged + uploaded): D1, D2/D3, D4/K6, K5 wording, P2, D7/K2 landing bites + fall (state.js fallDamageFor),
K3 IMMOVABLE. Proof shots /mnt/project-files/forced-movement-forecast-fix/. D5 "≈−1" not reproduced (harness regex grabs any
on-screen ≈−N). D6 crush rows exist for enemies; playtest drop was onto an ALLY (mondo's open question, left alone).
K4 FIXED PR #1006: battle.js spellHopPool = splits/ricochets/chains seek only seen enemies. Proof .../split-fog/.
