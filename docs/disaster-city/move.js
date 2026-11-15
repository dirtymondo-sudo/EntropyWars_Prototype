/* DISASTER CITY, THE DISTRICT MOVE (2026-11-15, mondo: "the districts along the coast should be industrial, bayside, and entertainment, so move
   financial somewhere else ... swap civic center and southside ... southside should actually be in the south"; his OK on the drawn plan 18:25,
   "Build it as drawn"). Read by `node bake-disaster-city.js` (THE DISTRICT MOVE). Notes: docs/notes/areas-complexes.md "DISASTER CITY, THE DISTRICT MOVE".

   `to` = where each district's 4 x 4 block stands now, in blocks (x west to east, y north to south). city-layout.json keeps every district's
   HOME block (its gx / gy) and every plot its home x / y, and a plot's ID NEVER CHANGES: 'P00-03' is still the Canal walk, although it now
   stands at x 0, y 11. An id is a name, not a place; a plot's place is its `x` / `y` (ctx.plotOf[id].x).
       today                 home (the ids)
       C F E                 R C F
       U H B                 U H E
       R S I                 I S B
   A DISTRICT FILE STILL WRITES IN ITS HOME FRAME: while a district's hook runs, the tool hands it the whole city shifted so that the
   district's block lies where it was built (every row, prop, plot x / y and square the hook reads or writes), and shifts it back after.
   So a district file's absolute squares and metres stay as written, and nothing in a district file had to change for the move.
   (L.js, the landmarks, runs in Bayside's frame: its canal and parking deck are written in Bayside's home squares.)

   `seams` = what the move does where two districts now meet (and on the city's outer line), plot by plot:
     walk     cut a walk opening in this plot's side (squares `at` along the side, default 5 and 6: the plan's walk gap; `len` squares in, default: to the plot's walk)
     road     run this plot's street on to this side (the plan's street profile, squares 3 to 8)
     roadEnd  this plot's street stops short of this side: its last three squares are paved, and the side is a walk crossing
     close    close this side's gap (nothing faces it any more)
     rect     squares of the plot made carriageway or pavement (a lane that is not the plan's street profile); port = set a side's gap by hand
   No building is moved or removed by a seam (the tool throws); `gone` takes a building out by name. */
'use strict';
module.exports = {
    to: { C: [0, 0], F: [1, 0], E: [2, 0], U: [0, 1], H: [1, 1], B: [2, 1], R: [0, 2], S: [1, 2], I: [2, 2] },
    frame: { L: 'B' },
    seams: [
        /* Financial | Entertainment */
        { op: 'walk', plot: 'P11-01', side: 'E' },                                              // Vault annex: a gate to the Restaurant court
        { op: 'roadEnd', plot: 'P08-07', side: 'W' }, { op: 'walk', plot: 'P11-03', side: 'E' },   // the strip ends at the Taxi rank; the Private garden's gate
        /* Civic | University, Financial | Hero Plaza */
        /* THE ROADS JOIN AGAIN (mondo 11-15): THE PERMIT LANE. The university avenue runs on north two squares into the Permit offices' plot
           and turns east along its south edge (two squares wide, squares cy 46-47) into the foot of the financial avenue. No building is
           removed: the lane takes the Permit offices' south walk. levels.js puts the Permit offices and the Faculty homes on the lane's level (10). */
        { op: 'rect', plot: 'P07-03', x0: 4, y0: 10, x1: 11, y1: 11, ch: 'R' }, { op: 'rect', plot: 'P07-03', x0: 3, y0: 10, x1: 3, y1: 11, ch: 'P' },
        { op: 'rect', plot: 'P08-03', x0: 0, y0: 10, x1: 3, y1: 11, ch: 'R' }, { op: 'rect', plot: 'P08-03', x0: 0, y0: 9, x1: 2, y1: 9, ch: 'P' },
        { op: 'port', plot: 'P07-03', side: 'S', port: 'walk' }, { op: 'port', plot: 'P07-03', side: 'E', port: 'walk' }, { op: 'port', plot: 'P08-03', side: 'W', port: 'walk' },
        { op: 'rect', plot: 'P08-03', x0: 9, y0: 11, x1: 10, y1: 11, ch: 'P' }, { op: 'walk', plot: 'P04-04', side: 'N', at: [9, 10] },   // the News office's walk up to the avenue's foot (east of the carriageway)
        /* University | Southside */
        { op: 'walk', plot: 'P01-00', side: 'N', at: [6] },                                     // the Townhouse court's alley up to the Clinic
        /* THE ROADS JOIN AGAIN: THE GYM LANE. The west avenue meets the Boxing gym head on. The row house east of the gym is taken out
           (`gone`), and the avenue bends two squares east past the gym (two squares wide, cx 43-44, cy 96-100) and back. The gym stays.
           levels.js puts the gym's plot on the cross street's level (6). */
        { op: 'rect', plot: 'P03-07', x0: 8, y0: 9, x1: 8, y1: 11, ch: 'R' }, { op: 'rect', plot: 'P03-07', x0: 9, y0: 9, x1: 9, y1: 11, ch: 'P' },
        { op: 'rect', plot: 'P03-00', x0: 7, y0: 0, x1: 8, y1: 4, ch: 'R' }, { op: 'rect', plot: 'P03-00', x0: 9, y0: 0, x1: 9, y1: 7, ch: 'P' },
        { op: 'rect', plot: 'P03-00', x0: 6, y0: 5, x1: 8, y1: 5, ch: 'R' }, { op: 'rect', plot: 'P03-00', x0: 5, y0: 6, x1: 8, y1: 6, ch: 'R' }, { op: 'rect', plot: 'P03-00', x0: 8, y0: 7, x1: 8, y1: 7, ch: 'R' },
        { op: 'port', plot: 'P03-00', side: 'N', port: 'walk' },
        /* Bayside | Industrial */
        { op: 'walk', plot: 'P09-11', side: 'S' },                                              // Loading / parking down to the Warehouse
        { op: 'road', plot: 'P11-11', side: 'S' },                                              // the coast road: the Boardwalk exit on to the Machine shop
        /* Southside | Sports + Culture */
        { op: 'roadEnd', plot: 'P03-01', side: 'E' },                                           // the Dojo's side street: a paved court at the park's west gate
        { op: 'road', plot: 'P03-03', side: 'E' },                                              // the south street runs into the Southside avenue
        /* Sports + Culture | Industrial */
        { op: 'close', plot: 'P07-09', side: 'E' },                                             // the Sports clinic's east gap faces the Container court's wall
        { op: 'roadEnd', plot: 'P07-11', side: 'E' }, { op: 'walk', plot: 'P00-11', side: 'W', at: [7], len: 1 },   // the south street ends at the port gate (one square south of the dry-berth tanker's seven)
        /* the city's outer line */
        { op: 'close', plot: 'P04-03', side: 'W' }, { op: 'close', plot: 'P01-03', side: 'S' }, { op: 'close', plot: 'P09-04', side: 'N' },
    ],
    /* THE WAYS OUT (the world map, /mnt/project-files/world-zones-plan/): a street that reaches the city's outer line. Each is a closed gate
       until its zone is built. `east` ones open onto the harbour quay (the room's east strip). */
    /* THE ROADS JOIN AGAIN (mondo 11-15: "delete some buildings ... get rid of the most useless ones to connect the roads again") */
    gone: [{ id: 'P03-00-B2', why: 'the row house east of the Boxing gym: the west avenue runs where it stood' }],
    /* the two lanes' middle lines for the road markings and the lamps (square lines; w in squares) */
    streets: [
        { pts: [[42, 54], [42, 47]], w: 4 }, { pts: [[42, 47], [54, 47]], w: 2 }, { pts: [[54, 42], [54, 47]], w: 4 },
        { pts: [[42, 90], [42, 93]], w: 4 }, { pts: [[42, 93], [44, 96]], w: 2 }, { pts: [[44, 96], [44, 101]], w: 2 }, { pts: [[44, 101], [42, 104]], w: 2 },
    ],
    ways: [
        { plot: 'P04-01', side: 'W', name: 'THE VATICAN GATE', look: 'iron' },
        { plot: 'P03-03', side: 'S', name: 'THE HIGHWAY', look: 'road', open: true },   // THE DESERT ON PLOTS (2026-11-15): the Desert is built; the door is links.downtown_desert
        { plot: 'P08-04', side: 'N', name: 'THE MOUNTAIN ROAD', look: 'road', open: true },   // THE MOUNTAINS ON PLOTS (2026-11-15): the Mountains are built; the door is links.downtown_mountains
        { plot: 'P03-09', side: 'E', quay: true }, { plot: 'P03-11', side: 'E', quay: true },
    ],
};
