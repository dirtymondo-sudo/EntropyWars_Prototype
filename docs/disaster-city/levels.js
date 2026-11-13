/* DISASTER CITY, THE LEVELS (2026-11-13, mondo's OK on the elevation plan 18:30: "Build it as drawn").
   The city's ground as LEVELS, one level = 1.75 m (a battle block): `grid[y][x]` is the level of plot P<x>-<y> (x west to east, y north to
   south). 0 = sea level (Bayside), 14 = the Church (24.5 m). Read by `node bake-disaster-city.js` (THE LEVELS), which writes the room's
   `terrain.slope.cells` from it: building plots flat, the streets sloping between the plot centres, a stair / a ramp where a walk crosses two
   levels, a retaining wall where nothing crosses. Change a number here and rerun the tool; never edit the room.
   THE STADIUM (district S: P04-09, P05-09, P04-10, P05-10, one pitch over four plots) stands on ONE level; keep those four numbers equal.
   `pieces` = the ground shaped INSIDE a plot (plot-local squares, 0..12 from the plot's north-west corner): a `bowl` sinks and a `mound` rises
   `by` levels inside the rectangle x0..x1, y0..y1, its sides sloping `rate` levels a square (1 = the stair pitch, a bank to skate). */
'use strict';
module.exports = {
    M: 1.75,
    grid: [
        [14, 13, 13, 12,  11, 11, 12, 11,  10, 11, 12, 12],
        [13, 13, 12, 12,  11, 11, 11, 10,  10, 10, 11, 11],
        [12, 12, 12, 11,  10, 10, 10, 10,   9, 10, 10, 10],
        [10, 11, 11, 10,   9,  9,  9,  9,   8,  9,  9, 10],
        [10, 10, 12,  9,   8,  8,  9,  8,   7,  7,  7,  6],
        [ 9,  9, 10,  8,   8,  8,  8,  7,   6,  6,  6,  5],
        [ 8,  8,  8,  7,   7,  7,  7,  7,   6,  5,  5,  4],
        [ 7,  7,  7,  6,   6,  6,  5,  5,   5,  4,  4,  3],
        [ 3,  3,  4,  4,   4,  4,  4,  3,   3,  2,  2,  1],
        [ 2,  3,  3,  3,   3,  3,  3,  2,   1,  0,  0,  0],
        [ 1,  1,  2,  2,   3,  3,  2,  1,   0,  0,  0,  0],
        [ 0,  1,  1,  1,   1,  1,  1,  1,   0,  0,  0,  0],
    ],
    /* the stairs' pack flight per district (data.js HQ_STAIR_KINDS) */
    stairs: { R: 'external', C: 'stone', F: 'stone', U: 'precast', H: 'concrete', E: 'concrete', I: 'steel', S: 'concrete', B: 'external' },
    pieces: [
        { plot: 'P00-03', name: 'Canal walk: the sunk canal, banked both sides (a ditch to skate)', k: 'bowl', x0: 1, y0: 1, x1: 5, y1: 11, by: 2, rate: 1 },
        { plot: 'P00-05', name: 'Campus green: the sunk amphitheatre', k: 'bowl', x0: 1, y0: 7, x1: 5, y1: 11, by: 1, rate: 0.5 },
        { plot: 'P07-10', name: 'Event square: the sunk court', k: 'bowl', x0: 1, y0: 1, x1: 5, y1: 5, by: 1, rate: 1 },
    ],
};
