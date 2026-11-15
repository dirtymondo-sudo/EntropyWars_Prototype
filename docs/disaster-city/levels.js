/* DISASTER CITY, THE LEVELS (2026-11-13, mondo's OK on the elevation plan 18:30: "Build it as drawn").
   The city's ground as LEVELS, one level = 1.75 m (a battle block): `grid[y][x]` is the level of the plot standing at x, y (x west to east, y north to
   south; a plot's place, not its id: move.js). 0 = sea level (Bayside), 14 = City Hall (24.5 m). Read by `node bake-disaster-city.js` (THE LEVELS), which writes the room's
   `terrain.slope.cells` from it: building plots flat, the streets sloping between the plot centres, a stair / a ramp where a walk crosses two
   levels, a retaining wall where nothing crosses. Change a number here and rerun the tool; never edit the room.
   THE STADIUM (district S: P04-09, P05-09, P04-10, P05-10, one pitch over four plots) stands on ONE level; keep those four numbers equal.
   `pieces` = the ground shaped INSIDE a plot (plot-local squares, 0..12 from the plot's north-west corner): a `bowl` sinks and a `mound` rises
   `by` levels inside the rectangle x0..x1, y0..y1, its sides sloping `rate` levels a square (1 = the stair pitch, a bank to skate). */
'use strict';
module.exports = {
    M: 1.75,
    /* THE DISTRICT MOVE (2026-11-15, mondo's OK on the drawn plan 18:25): the grid is by a plot's PLACE in the city (move.js), blocks C F E /
       U H B / R S I. 14 = City Hall (the city's top, under the mountains); the ground falls east to the sea and south to the desert.
       University, Hero Plaza, Sports + Culture, Bayside and Entertainment keep the numbers they were built on; Civic = its old numbers + 2,
       Southside = its old numbers - 7 (so the stairs inside both stand as built); Financial and Industrial (a flat port, 0 to 2; its east column is 0 all the way down: the harbour quay is one height) are new. */
    grid: [
        [13, 13, 14, 13,  12, 11, 10,  9,   7,  7,  7,  6],
        [13, 13, 13, 12,  11, 11, 10,  8,   6,  6,  6,  5],
        [12, 12, 12, 12,  11, 10,  9,  8,   6,  5,  5,  4],
        [11, 11, 11, 11,  10,  9,  9,  8,   5,  4,  4,  3],
        [10, 10, 12,  9,   8,  8,  9,  8,   3,  2,  2,  1],
        [ 9,  9, 10,  8,   8,  8,  8,  7,   1,  0,  0,  0],
        [ 8,  8,  8,  7,   7,  7,  7,  7,   0,  0,  0,  0],
        [ 7,  7,  7,  6,   6,  6,  5,  5,   0,  0,  0,  0],
        [ 7,  6,  6,  5,   4,  4,  4,  3,   1,  1,  2,  0],
        [ 6,  6,  5,  5,   3,  3,  3,  2,   0,  1,  1,  0],
        [ 5,  5,  5,  4,   3,  3,  2,  1,   0,  0,  1,  0],
        [ 3,  4,  4,  3,   1,  1,  1,  1,   0,  0,  0,  0],
    ],
    /* the stairs' pack flight per district (data.js HQ_STAIR_KINDS) */
    stairs: { R: 'external', C: 'stone', F: 'stone', U: 'precast', H: 'concrete', E: 'concrete', I: 'steel', S: 'concrete', B: 'external' },
    pieces: [
        { plot: 'P00-03', name: 'Canal walk: the sunk canal, banked both sides (a ditch to skate)', k: 'bowl', x0: 1, y0: 1, x1: 5, y1: 11, by: 2, rate: 1 },
        { plot: 'P00-05', name: 'Campus green: the sunk amphitheatre', k: 'bowl', x0: 1, y0: 7, x1: 5, y1: 11, by: 1, rate: 0.5 },
        { plot: 'P07-10', name: 'Event square: the sunk court', k: 'bowl', x0: 1, y0: 1, x1: 5, y1: 5, by: 1, rate: 1 },
    ],
};
