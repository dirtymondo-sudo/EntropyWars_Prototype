/* THREAD 7, THE UNDERGROUND WALKS: THE LONG TUNNEL, THE HEIGHT PLAN. The PILOT and the PATTERN for every tunnel.
   A PROPOSAL: nothing is built from it until mondo says so. DATA ONLY (the format: plans/README.md).
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/tunnel-long.js
   TODAY: ten plots in a line, a corridor 2 or 3 squares wide, dead straight and dead level for 420 m.
   mondo's ruling (11-20): a chamber every 3 or 4 plots, on two levels, with one thing in it; ALWAYS branches; the tunnel between
   chambers bends and climbs or falls; the Long Tunnel runs from Agartha to the Cavern and goes DOWN, so you know which way you are
   walking; the corridor stays narrow (3): it does not get wider, it gets a shape.
   THE PLAN. The room grows from 1 plot wide to 3 (a room one plot wide cannot be fixed inside its plots). The tunnel snakes across the
   three columns and FALLS NINE LEVELS from the Agartha end (9) to the West Tunnel end (0): downhill is always toward the Cavern.
   THREE CHAMBERS, each one thing: THE UNDERGROUND RIVER (a slab slopes over it, the water falls east), THE ROCK BRIDGE over a pit
   (hop off it: the pit leads to the Crystal Pocket and back up), THE COLLAPSE (a rubble mound you climb). Thin side cuts branch off:
   two fast ways down that end in ledges, four secrets, one side tunnel east that is blocked today.
   Levels: 0 = the tunnel floor today. One level = 1.75 m. Roofed: the closed squares are rock. */
'use strict';
module.exports = {
    zone: 'The underground walks', thread: 7, room: 'site_prebuilt_hollow_earth_ow_long',
    title: 'THE LONG TUNNEL: THE HEIGHT PLAN, the pattern for every tunnel (a proposal)',
    grows: 'from 1 x 10 plots to 3 x 10 (one new column each side; 9 new plots): the under layer is free there',
    numbers: { boardEveryPlots: 4, why: 'mondo 11-20 on the tunnels: "a chamber every 3 or 4 plots"' },
    noBuildings: 'a tunnel: its chambers are the architecture',
    build: { frame: 'room', file: 'bake-cavern.js\'s walk rooms (a new room design for the Long Tunnel, in the room\'s own frame)' },
    mass: 'rock (the tunnel\'s walls)', massHeight: 6,
    grid: { w: 36, h: 120, n: 12, at: [1, 0] }, start: [18, 1],
    districts: { T: { name: 'The Long Tunnel', color: '#c9a36a' } },
    plots: [
        [1, 0, 'The Agartha End', 'T', 0, 9, { flat: 'the entry chamber' }], [1, 1, 'The First Bend', 'T', 0, 8], [0, 1, 'The West Turn', 'T', null, 8], [0, 2, 'The Underground River', 'T', null, 7, { relief: 'a chamber on two levels, the river between' }],
        [1, 2, 'Behind the Fall', 'T', 0, 5], [0, 3, 'The Lower Bank', 'T', null, 6], [1, 3, 'The Cross Cut', 'T', 0, 5], [2, 3, 'The East Turn', 'T', null, 5], [2, 4, 'The Rock Bridge', 'T', null, 4, { relief: 'a bridge over a pit 3 levels deep' }],
        [1, 4, 'The Crystal Pocket', 'T', 0, 1], [2, 5, 'Under the Bridge', 'T', null, 3], [1, 5, 'The Bridge Camp', 'T', 0, 3, { flat: 'a level chamber: a board fits' }], [1, 6, 'The Long Fall', 'T', 0, 2], [0, 6, 'The Side Cut', 'T', null, 2],
        [0, 7, 'The Collapse', 'T', null, 1, { relief: 'a rubble mound 2 levels high' }], [1, 7, 'The Chute', 'T', 0, 2], [0, 8, 'The Last Bend', 'T', null, 1], [1, 8, 'The Foot', 'T', 0, 0], [1, 9, 'The West Tunnel End', 'T', 0, 0, { flat: 'the end chamber, the seam' }]],
    steps: [
        /* the chambers and the level places */
        ['area', 14, 1, 21, 8, 'c', 9], ['label', 17.5, 2.4, 'THE AGARTHA END', 'place'],
        ['area', 1, 26, 10, 29, 'g', 7], ['area', 1, 30, 10, 31, 'w', 5], ['area', 1, 32, 8, 39, 'g', 6], ['label', 5, 27.4, 'THE UNDERGROUND RIVER', 'mark'], ['label', 4.5, 36, 'the lower bank · a board fits', 'note'],
        ['area', 25, 50, 34, 52, 'g', 4], ['area', 25, 53, 28, 56, 'g', 1], ['area', 32, 53, 34, 56, 'g', 1], ['area', 29, 53, 31, 56, 'c', 4], ['area', 25, 57, 31, 59, 'g', 4], ['label', 30, 49.4, 'THE ROCK BRIDGE', 'mark'], ['label', 26.5, 54.6, 'pit', 'note'],
        ['area', 14, 52, 18, 57, 'g', 1], ['set', 16, 55, 'k', 1], ['label', 16, 51.4, 'CRYSTAL POCKET', 'mark'],
        ['area', 13, 63, 20, 70, 'c', 3], ['label', 16.5, 67, 'THE BRIDGE CAMP', 'place'],
        ['area', 1, 86, 10, 94, 'g', 1], ['area', 2, 88, 5, 91, 'g', 3], ['label', 5, 87, 'THE COLLAPSE', 'mark'], ['label', 3.5, 89.6, 'rubble', 'note'],
        ['area', 12, 110, 19, 117, 'c', 0], ['label', 15.5, 113, 'THE WEST TUNNEL END', 'place'],
        /* THE TUNNEL (main, 3 squares): it snakes and falls from 9 to 0 */
        ['main', [[18, 0, 9], [18, 5, 9], [14, 5, 9], [14, 13, 8], [8, 13, 8], [8, 20, 8], [4, 20, 8], [4, 27, 7], [8, 27, 7], [8, 33, 6], [5, 33, 6], [5, 41, 6], [11, 41, 5], [11, 44, 5], [19, 44, 5], [19, 41, 5], [27, 41, 5], [27, 46, 5]], { name: 'the Long Tunnel: the Agartha End, the River, the East Turn' }],
        ['main', [[27, 46, 5], [27, 51, 4], [30, 51, 4], [30, 58, 4], [27, 58, 4], [27, 65, 3], [20, 65, 3], [20, 70, 3], [16, 70, 3], [16, 77, 2], [9, 77, 2], [9, 85, 1], [7, 85, 1], [7, 93, 1], [4, 93, 1], [4, 100, 1], [11, 100, 0], [11, 104, 0], [16, 104, 0], [16, 110, 0], [18, 110, 0], [18, 118, 0]], { name: 'the Long Tunnel: the Rock Bridge, the Camp, the Collapse, the West Tunnel End' }],
        /* THIN SIDE CUTS (1 square) */
        ['thin', [[11, 33, 6], [16, 33, 5]], { to: 'a secret: behind the river\'s fall' }], ['area', 16, 31, 20, 34, 'g', 5],
        ['thin', [[2, 40, 6], [2, 44, 6]], { to: 'a secret: the still pool below the river' }], ['area', 1, 45, 4, 46, 'w', 5],
        ['thin', [[31, 41, 5], [34, 41, 5]], { to: 'a side tunnel EAST toward the Tunnel-Way Tunnel (blocked by a rock fall today: a later way, asked of mondo)' }],
        ['thin', [[24, 55, 1], [19, 55, 1]], { to: 'the Crystal Pocket, from the pit under the Rock Bridge (you hop off the bridge to get there)' }],
        ['thin', [[16, 58, 1], [16, 63, 3]], { to: 'the Bridge Camp, up out of the Crystal Pocket (the way back to the tunnel)' }],
        ['thin', [[33, 57, 1], [33, 62, 3], [29, 62, 3]], { to: 'the tunnel again, up out of the pit\'s east side' }],
        ['thin', [[7, 77, 2], [2, 77, 2], [2, 81, 2]], { to: 'a secret: an old camp at the end of a side cut' }], ['area', 1, 82, 3, 83, 'g', 2],
        ['thin', [[16, 79, 2], [16, 84, 2], [19, 84, 2], [19, 90, 2]], { to: 'the Foot by THE CHUTE: the fast way DOWN past the Collapse (it ends in a ledge)' }], ['area', 18, 91, 20, 95, 'g', 2], ['area', 18, 96, 20, 99, 'g', 0],
        ['thin', [[19, 100, 0], [19, 104, 0], [18, 104, 0]], { cont: true }],
    ],
    doors: [[18, 0, 'N', 'Agartha', 9, { moves: 'the tunnel goes DOWN from Agartha (mondo 11-20): this end rises 9 levels; Agartha\'s tunnel stub is thread 9\'s and meets it there' }], [18, 119, 'S', 'the West Tunnel (to the Cavern)', 0]],
    landmarks: [{ name: 'The River\'s Fall', at: [10, 30], tall: 1 }, { name: 'The Rock Bridge', at: [30, 54], tall: 1 }, { name: 'The Crystal Pocket\'s glow', at: [16, 55], tall: 1 }, { name: 'The Collapse', at: [3, 89], tall: 1 }],
    lookouts: [{ name: 'the middle of the Rock Bridge', at: [29, 55], sees: 'The Crystal Pocket\'s glow' }],
    found: [
        { name: 'the chute\'s rubble', from: [19, 96], to: [19, 95], kind: 'climb' }, { name: 'the Collapse: climb the rubble', from: [6, 89], to: [5, 89], kind: 'climb' },
        { name: 'the rope up the pit\'s wall', from: [33, 56], to: [27, 46], kind: 'climb' }, { name: 'the wet steps behind the fall', from: [16, 33], to: [9, 33], kind: 'climb' },
        { name: 'the stepping stones up the river', from: [8, 34], to: [8, 28], kind: 'climb' }, { name: 'the crack above the river', from: [4, 26], to: [8, 19], kind: 'climb' }, { name: 'the old ladder to the Agartha End', from: [14, 12], to: [16, 6], kind: 'ladder' }],
    flats: [
        { name: 'The Agartha End', rect: [14, 1, 21, 8], why: 'the entry chamber', board: true }, { name: 'The Lower Bank', rect: [1, 32, 8, 39], why: 'the river chamber\'s lower floor', board: true },
        { name: 'The Bridge Camp', rect: [13, 63, 20, 70], why: 'a level chamber', board: true }, { name: 'The West Tunnel End', rect: [12, 110, 19, 117], why: 'the end chamber, the seam', board: true },
        { name: 'The Collapse\'s floor', rect: [6, 86, 10, 94], why: 'the chamber floor round the rubble' }],
    buildings: [],
    picture: { S: 16 },
};
