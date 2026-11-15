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
   No building is moved or removed by any of them. */
'use strict';
module.exports = {
    to: { C: [0, 0], F: [1, 0], E: [2, 0], U: [0, 1], H: [1, 1], B: [2, 1], R: [0, 2], S: [1, 2], I: [2, 2] },
    frame: { L: 'B' },
    seams: [
        /* Financial | Entertainment */
        { op: 'walk', plot: 'P11-01', side: 'E' },                                              // Vault annex: a gate to the Restaurant court
        { op: 'roadEnd', plot: 'P08-07', side: 'W' }, { op: 'walk', plot: 'P11-03', side: 'E' },   // the strip ends at the Taxi rank; the Private garden's gate
        /* Civic | University, Financial | Hero Plaza */
        { op: 'roadEnd', plot: 'P03-04', side: 'N' }, { op: 'walk', plot: 'P07-03', side: 'S' },   // the university avenue ends under the Permit offices
        { op: 'roadEnd', plot: 'P08-03', side: 'S' }, { op: 'walk', plot: 'P04-04', side: 'N' },   // the financial avenue ends over the News office
        /* University | Southside */
        { op: 'walk', plot: 'P01-00', side: 'N', at: [6] },                                     // the Townhouse court's alley up to the Clinic
        { op: 'roadEnd', plot: 'P03-07', side: 'S' }, { op: 'walk', plot: 'P03-00', side: 'N', at: [7] },   // the alley beside the Boxing gym (its buildings stand where a street would run)
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
    ways: [
        { plot: 'P04-01', side: 'W', name: 'THE VATICAN GATE', look: 'iron' },
        { plot: 'P03-03', side: 'S', name: 'THE HIGHWAY', look: 'road', open: true },   // THE DESERT ON PLOTS (2026-11-15): the Desert is built; the door is links.downtown_desert
        { plot: 'P08-04', side: 'N', name: 'THE MOUNTAIN ROAD', look: 'road' },
        { plot: 'P03-09', side: 'E', quay: true }, { plot: 'P03-11', side: 'E', quay: true },
    ],
};
