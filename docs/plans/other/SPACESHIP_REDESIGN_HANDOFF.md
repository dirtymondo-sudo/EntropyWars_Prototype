# Spaceship redesign: hand-off (2026-11-11)

The Spaceship map (site `prebuilt_derelict`, room `site_prebuilt_derelict_deck`) is being taken over by a new thread. This note lists what is live, what mondo said about it, and the rules I learnt that any new design has to pass.

## What is live now

PR #1144 is merged and live (`?v=20261111-gunship-01-cors`; data.js `ab6f0ac5` and three-renderer.js `cddc202f` are on R2).

- **The ship.** `HQ_AREA_SPECS.prebuilt_derelict` is a "lengthwise gunship" with the bow north and the stern south. The deck is drawn with `hqDeckPlan` rows (data.js, about line 50840). The plan characters are:
  - `.` void
  - `o` deck at 3.2 m
  - `1` deck +3.5 m
  - `2` deck +7 m

  The `2` character is new in #1144.
- **The hull code.** `three-renderer.js _hqBuildStarship` (about line 67361) gained these options: `bow:'n'`, `canopy`, `guns`, `ledges` (lit strips under raised edges), and `b.y`/`b.len` on the bells and `p.len` on the pods.
- **The other edits.** #1144 also changed:
  - the backDoors bay at x 33.25;
  - the stage frame x 600;
  - the tape at (-1.75, -43.75);
  - `HQ_ARENA_RULES.within.prebuilt_derelict` x 0;
  - a new `HQ_ROOM_LOOKS.gunship` row;
  - the picks: 12 @ 11,8; 11 @ 11,8; 10 @ 12,9; 9 @ 12,9.
- **The notes.** `docs/notes/maps-terrain-battle.md` has the section "THE GUNSHIP".
- **Not shipped.** A "clear hull fog" experiment (the board fog measured from the ship's box) was reverted and never shipped. mondo said to stop it. Show shots with HIS fog as he sees it in game.

## What mondo said

1. "redesign the spaceship. It just looks nothing like a spaceship at all ... keeping the square grid in mind and designing the map for interesting and strategic PVP play"
2. "why not put the spawn zones at either end of the ship" (bow and stern; the first plan had them on the wings).
3. After #1144: "it still just looks like a floating rectangle. This is not good."
4. "the battlefield and the map do not have to be flat, in fact i do not want or expect them to be. A ship is generally more clyndrical. I expect there to be ramps and stairs on a ship. Just add more verticality and depth/height to it and shape it like an actual spaceship, you are not confined to making it a rectangle."

## Rules the board has to pass (bake-arenas.js judge; tools/judge.js replicates it)

Lattice and coordinates:
- The lattice is 34 x 28 squares of 3.5 m, with the room origin at x -59.5, z -49.
- The 12 board is at lattice i 11..22, j 8..19.
- Board c = i - 11 and r = j - 8. A square's left edge is at x = -21 + 3.5c, so its centre is at -19.25 + 3.5c.

Levels:
- A level is 1.75 m (`HQ_CAVE_CELL`), counted from the window's LOWEST walkable square top (`ref` = the minimum).
- The cut-offs are `tierMin` 1.2 m and `tierMax` 3:
  - under +1.2 m is tile 0;
  - +1.2 to 2.95 m is tile 1;
  - +2.95 to 4.7 m is tile 2;
  - over that is tile 3.
- No walkable square may be above `topMax` 3.

Spawn squares:
- The HOUSE squares are cols 3..8, rows 0..2 and 9..11. They must be tile 0 (the lowest level on the board), a seat, and have no prop, wall, fluid or bridge.
  - So the centre of both spawn ends is the lowest ground. A raised cylinder spine has to rise BETWEEN the spawn decks (rows 3..8) and step down to them.
- The APRON (cols 2..9, rows 0..2 and 9..11) must be ≤ tile 1.

Out budget:
- `out` is void + rock + any square the WALKER can't reach from the north spawn. It must be ≤ wallMax:
  - 48 for the 12 board;
  - 40 for 11;
  - 33 for 10;
  - 27 for 9.
- Both spawns must be joined.

The walker's reach:
- The walker steps up at most `climbM` 1.46 m between square-centre tops. It can step down any height.
- A 1.75 m terrace step therefore needs a stair or ramp square. One 3.5 m ramp square per 1.75 m works: its centre is +0.875.
- A 3.5 m rise needs about 3 squares, or 2 at 1.75 m each.
- In battle, units jump 1-3 levels, so this limit is only the judge's.

How squares read:
- The raster is sub 3 / cover 5, and the `hqDeckPlan` plates stick out 0.7 m past their square line.
  - So a void ONE square wide between plates reads as deck. A void must be 2 squares across, or open to the edge.
- A 7 m drop next to a deck square made that square read as rock. A 3.5 m drop is fine.

The fit check:
- It must be true at all four sizes: `node tools/fit.js derelict`.
- Re-bake the picks with `node bake-arenas.js` (a few minutes).

## The fog (his, do not override)

- The green space is his shipped Haunted Green fog preset (index.html SHIPPED-KEYS). Room looks don't reach him because Map Looks is off.
- THE BOARD FOG fades everything by distance from the board rect. The probe showed a reach of about 2.5 squares past the board on this map.
- So in battle, whatever is more than 2-3 squares off the board mostly vanishes. The ship shape has to read ON the board and right next to it.

## Tools (tools/)

- `plan2.py`: the #1144 plan generator. Run it, then `putrows.py` writes the rows into data.js.
- `mock2.py`: the top-down mock-up PNG.
- `judge.js <S> <ox> <oz>`: prints out / cap / reach for the board, plus a reach grid.
- `ras.js prebuilt_derelict [ox oz]`: prints the raster's levels.
- `fit.js derelict`: runs the fit check at 12 / 11 / 10 / 9.
- `pm.js`: the board screenshot harness. It needs `npm start` on :3000 and takes about 5 minutes. Run it as:

  ```
  OUT=<dir> POSES=default,wide,low,top,far PRE_EVAL="$(cat hide.js)" NODE_USE_ENV_PROXY=1 node pm.js prebuilt_derelict_delta
  ```

  `hide.js` hides the HUD. `ThreeRenderer` is a top-level const, not `window.ThreeRenderer`.

## Shots

- `current_board_before.jpg` is the old ship.
- `new_ship_plan_lengthwise.png` is the #1144 plan.
- `proof/` holds the #1144 board shots with his fog.
