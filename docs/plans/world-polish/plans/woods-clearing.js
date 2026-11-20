/* THREAD 6, THE WOODS: the Clearing's room, PLAN 3, in the shared plan format (the WORKED EXAMPLE of docs/plans/world-polish/draw-plan.js).
   It is thread6/plan3.js row for row: the same squares, levels, ramps and ledges (checked 11-20: identical grids). mondo OK'd plan 3 on 11-20
   ("Yes the map layout looks much better ... Go ahead and build with what you have"). bake-woods.js still reads thread6/plan3.js: do not delete it.
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/woods-clearing.js
   DATA ONLY. The format is plans/README.md. */
'use strict';
const flatBed = 'the creek\'s flat bed and the drain\'s concrete apron: level on purpose';
module.exports = {
    zone: 'The Woods', thread: 6, room: 'site_prebuilt_fairy_forest_ow_clearing',
    title: 'THE WOODS, the Clearing\'s room, PLAN 3: the whole room, every square',
    approved: 'mondo 2026-11-20: "Yes the map layout looks much better ... Go ahead and build with what you have"',
    build: { frame: 'room', file: 'docs/areas/woods/districts/C-room.js' },
    mass: 'forest mass (a wall of trees)', massHeight: 5,
    grid: { w: 144, h: 60, n: 12 },            // 12 x 5 plots; box plot 0,0 = world plot -17,0
    start: [43, 8],                            // the Stair from DOOR HQ
    districts: { C: { name: 'The Clearing', color: '#f2c14e' }, M: { name: 'Dead Man\'s Cave', color: '#6fb7ff' }, L: { name: 'the trail north', color: '#bbbbbb' } },
    /* [box x, box y, name, district, level today (null = new), level planned, { flat: 'why' | relief: 'what' }] */
    plots: [
        [1, 0, 'The trail north', 'L', 1, 2], [3, 0, 'The Stair', 'C', 2, 2], [6, 0, 'The Rocks', 'M', 0, 5],
        [0, 1, 'Deep woods, west', 'C', 1, 1], [1, 1, 'The Trail West', 'C', 2, 3], [2, 1, 'The Old Tree', 'C', 2, 5], [3, 1, 'The Crossroads', 'C', 2, 3], [4, 1, 'Deep woods, east', 'C', 1, 4],
        [5, 1, 'The Culvert', 'M', 1, 4], [6, 1, 'The Dry Creek, upper', 'M', 1, 3], [7, 1, 'The Dry Creek, lower', 'M', 0, 2], [8, 1, 'The Hollow', 'M', 0, 1], [9, 1, 'The Gully', 'M', 0, 0, { flat: flatBed }],
        [10, 1, 'The Sewer Mouth', 'M', 0, 0, { flat: flatBed }], [11, 1, 'The Storm Drain', 'M', 0, 0, { flat: flatBed }],
        [3, 2, 'The Campfire', 'C', 1, 2], [10, 2, 'The Tunnel Way', 'M', 0, 0, { flat: flatBed }], [3, 3, 'Deep woods, south', 'C', 1, 1], [3, 4, 'The Fence Line', 'C', 0, 0],
        [2, 0, 'The North Rise', 'C', null, 4], [4, 0, 'The Climb', 'C', null, 5], [5, 0, 'The Top', 'M', null, 6], [7, 0, 'The Scree', 'M', null, 4],
        [1, 2, 'The Burned House', 'C', null, 2], [2, 2, 'The Stick Men', 'C', null, 3], [4, 2, 'Under the Bluff', 'C', null, 2], [4, 3, 'The Dead End', 'C', null, 1],
        [7, 2, 'The Bank', 'M', null, 3], [8, 2, 'The Low Ground', 'M', null, 1], [10, 0, 'The Fenced Yard', 'M', null, 0, { flat: 'a fenced concrete yard' }]],
    /* the rows, in order (a later row lies over an earlier one). area: x0, y0, x1, y1, square, level. main / thin / lane: [x, y, level] corners.
       ramp: one ramp square (x, y, level, uphill dx, dy, letter). set: one square. label: x, y, text, mark | place | note | door. */
    steps: [
        /* ── THE CLEARING (C) ── THE STAIR (2): the landing round the staircase from DOOR HQ, open and level */
        ['area', 38, 2, 46, 9, 'g', 2], ['area', 43, 3, 43, 7, 'k', 2], ['label', 43, 2, 'THE STAIR', 'mark'],
        ['main', [[41, 0, 2], [41, 3, 2]]],
        /* up to THE CROSSROADS (3): a ramp on the east side; in front of the Stair the terrace's lip is a ledge you hop down */
        ['main', [[45, 9, 2], [45, 14, 3]]], ['area', 39, 10, 41, 12, 'g', 3],
        ['area', 38, 13, 46, 21, 'g', 3], ['label', 42, 17, 'THE CROSSROADS', 'place'], ['label', 42, 18.2, 'signpost · level, a board fits', 'note'],
        /* WEST: up the North Rise by a switchback to THE OLD TREE (5, the high point of the Clearing) */
        ['main', [[38, 14, 3], [34, 14, 3], [34, 8, 4], [28, 8, 4], [28, 13, 5]]], ['main', [[31, 7, 4], [31, 4, 4], [24, 4, 3], [24, 9, 3], [21, 9, 3], [21, 13, 3]]],
        ['area', 25, 14, 31, 20, 'g', 5], ['area', 28, 17, 29, 18, 'k', 5], ['label', 28.5, 16.2, 'THE OLD TREE', 'mark'],
        /* the ledge chain east: Old Tree -> shelf -> the Crossroads (two hops, straight back down) */
        ['area', 32, 17, 32, 18, 'g', 4], ['thin', [[33, 17, 3], [37, 17, 3]], { to: 'the Crossroads, from under the Old Tree\'s ledges (the hop down lands here)' }], ['set', 33, 18, 'q', 3],
        /* the thin short cut from the Stair's landing up to the rise */
        ['thin', [[37, 5, 2], [35, 5, 2]], { to: 'the North Rise: a short cut from the Stair\'s landing up to the switchback' }], ['thin', [[35, 5, 2], [35, 2, 3], [32, 2, 4]], { cont: true }],
        /* THE RANGER STATION stands where it stood (a walk-in building): its yard is level 3; a shelf west of the knoll is the hop down to it */
        ['area', 17, 16, 23, 21, 'g', 3], ['area', 20, 18, 22, 19, 'k', 3], ['label', 21, 17.4, 'RANGER STATION', 'mark'], ['area', 24, 19, 24, 20, 'g', 4],
        ['main', [[19, 14, 3], [13, 14, 3]]],
        ['main', [[14, 14, 3], [14, 19, 2], [8, 19, 1]]], ['main', [[7, 19, 1], [7, 22, 1]]],
        ['thin', [[6, 17, 1], [6, 14, 1], [3, 14, 1], [3, 13, 1]], { to: 'Came A Lot (another zone): the thin way north past the wolf den' }],
        ['label', 3.5, 18.6, 'wolf den', 'note'], ['label', 8, 16.6, 'stand', 'note'],
        /* THE TRAIL NORTH (to the Redwood Trail) */
        ['main', [[18, 1, 2], [18, 5, 2], [13, 5, 2], [13, 10, 3], [16, 10, 3], [16, 13, 3]]],
        /* THE BLAIR WITCH LOOP (thin): Trail West -> the Burned House -> the Stick Men -> the Campfire; a fork climbs back to the Old Tree */
        ['thin', [[12, 19, 2], [12, 24, 2], [16, 24, 2], [16, 28, 2]], { to: 'the Burned House (a ruin you walk into)' }],
        ['area', 13, 29, 19, 34, 'g', 2], ['area', 14, 30, 17, 33, 'k', 2], ['label', 15.5, 31.5, 'THE BURNED HOUSE', 'mark'], ['label', 15.5, 32.8, 'a ruin you walk into', 'note'],
        ['thin', [[20, 32, 2], [23, 32, 2], [23, 28, 3], [27, 28, 3], [27, 32, 3], [31, 32, 3], [31, 30, 3]], { to: 'the Stick Men (figures hung in the trees)' }],
        ['area', 29, 26, 33, 29, 'g', 3], ['label', 31.5, 27.3, 'THE STICK MEN', 'mark'], ['label', 31.5, 28.5, 'figures hung in the trees', 'note'],
        ['thin', [[27, 28, 3], [27, 25, 3]], { cont: true }], ['thin', [[27, 25, 3], [29, 25, 3]], { cont: true }],
        ['thin', [[34, 28, 3], [37, 28, 2]], { to: 'the Campfire (the loop closes on the main trail)' }],
        /* a dead-end stub with a stone pile (you turn back at the pile; fair, short) */
        ['thin', [[23, 32, 2], [23, 34, 2], [27, 34, 2]], { to: 'a secret: the stone pile' }], ['label', 27, 35, 'stone pile', 'note'],
        /* the Old Tree's south ledges: knoll -> shelf -> the Stick Men's trail (a loop that returns you to the landmark) */
        ['area', 28, 21, 29, 22, 'g', 4], ['thin', [[28, 23, 3], [28, 24, 3]], { to: 'the Stick Men\'s trail, from under the Old Tree\'s south ledges' }], ['set', 28, 25, 'q', 3],
        /* SOUTH: THE CAMPFIRE (2), open and level */
        ['main', [[39, 21, 3], [39, 24, 3], [45, 24, 2], [45, 27, 2]]], ['area', 38, 28, 46, 34, 'g', 2], ['label', 42, 31, 'THE CAMPFIRE', 'place'], ['label', 42, 32.2, 'level, a board fits', 'note'],
        ['area', 38, 26, 40, 27, 'g', 3],
        /* east under the bluff, round by the Dead End, back west: the way UP from the Estate; the ledge by the Campfire is the way DOWN */
        ['main', [[46, 31, 2], [52, 31, 2], [52, 36, 1], [57, 36, 1], [57, 41, 1], [51, 41, 1], [51, 45, 1], [45, 45, 1], [45, 50, 0]]],
        /* THE FENCE LINE (0): the farm yard that stands there is the open place; the trail ends on it and the gate leaves it */
        ['area', 38, 51, 46, 57, 'g', 0], ['label', 42, 54, 'THE FENCE LINE', 'place'], ['label', 42, 55.2, 'the yard · level', 'note'], ['main', [[42, 57, 0], [42, 58, 0]]],
        ['area', 54, 28, 58, 32, 'g', 2], ['area', 55, 29, 57, 30, 'k', 2], ['label', 56, 28.6, 'pump shed + tank', 'note'], ['label', 56, 31.8, 'rust, chain-link', 'note'],
        ['area', 48, 24, 59, 24, 'r', 4], ['label', 54, 24.5, 'THE BLUFF (a rock face, 2 levels)', 'note'],
        ['area', 53, 43, 59, 45, 'c', 1], ['label', 56, 46.2, 'a road that just ends', 'note'],
        ['area', 37, 37, 42, 42, 'g', 1], ['label', 39.5, 39.5, 'the quiet glade', 'note'], ['area', 39, 35, 41, 36, 'g', 1],
        ['thin', [[43, 42, 1], [43, 45, 1]], { to: 'the quiet glade (a clearing off the trail)' }],
        ['label', 42, 58.4, 'the gate (stands today)', 'note'],
        /* the hollow tree (the door `forest` stays on its square) */
        ['thin', [[47, 20, 3], [49, 20, 3], [49, 23, 3]], { to: 'a secret: the hollow tree (the door `forest`)' }], ['label', 51.5, 21.6, 'hollow tree', 'door'],
        /* ── EAST: DEEP WOODS EAST, THE CLIMB, THE TOP ── */
        ['main', [[46, 16, 3], [52, 16, 4], [52, 10, 5], [57, 10, 5], [57, 4, 6], [62, 4, 6]]],
        ['area', 62, 2, 69, 9, 'g', 6], ['area', 65, 3, 66, 4, 'k', 6], ['label', 65.5, 5.6, 'THE TOP', 'mark'], ['label', 65.5, 6.8, 'fire lookout · level, a board fits', 'note'],
        /* the ledges straight back down from the Top: 6 -> 5 -> 4 */
        ['area', 53, 3, 55, 5, 'g', 6], ['area', 53, 6, 54, 8, 'g', 6], ['area', 55, 12, 56, 13, 'g', 5], ['area', 54, 14, 58, 17, 'g', 4], ['label', 56, 16, 'glade', 'note'],
        /* ── DEAD MAN'S CAVE (M): down into the creek's valley ── */
        ['main', [[63, 9, 6], [63, 14, 5], [68, 14, 5], [68, 19, 4], [74, 19, 4], [74, 13, 5], [77, 13, 5], [77, 9, 5]]],
        ['area', 71, 13, 71, 17, 'w', 4], ['label', 71, 12.6, 'spring', 'note'], ['label', 71, 20.6, 'CULVERT', 'note'],
        ['area', 66, 11, 71, 11, 'r', 6], ['set', 71, 12, 'r', 6],
        /* THE ROCKS (5): the crag and the cave mouth, an open shelf */
        ['area', 73, 3, 80, 8, 'g', 5], ['area', 74, 1, 79, 2, 'r', 7], ['set', 76, 2, 'k', 5], ['set', 77, 2, 'k', 5], ['label', 76.5, 1.2, 'THE CRAG', 'mark'], ['label', 76.5, 3.6, 'cave mouth', 'door'], ['label', 76.5, 6, 'fire ring · level', 'note'],
        /* the ridge trail (thin): the Top -> the Rocks */
        ['set', 70, 5, 'q', 6], ['ramp', 71, 5, 5.75, -1, 0, 'Q'], ['ramp', 72, 5, 5.25, -1, 0, 'Q'],
        /* THE SCREE (4 -> 3): a switchback with its ledge, then down to THE DRY CREEK, LOWER (2) and up THE BANK (3) */
        ['main', [[80, 7, 5], [86, 7, 4], [86, 3, 4], [92, 3, 4], [92, 10, 3], [88, 10, 3], [88, 16, 2], [94, 16, 2], [94, 22, 2], [89, 22, 2], [89, 28, 3], [95, 28, 3], [95, 33, 2], [102, 33, 1], [102, 26, 1], [99, 26, 1], [99, 23, 1]]],
        /* THE DRY BED (2 squares, dirt): the fast way DOWN. Each dry fall is a ledge: you hop down it and cannot climb it */
        ['lane', [[71, 21, 3], [78, 21, 3], [78, 17, 3], [83, 17, 3]], { to: 'the Hollow, down the dry bed: the fast way DOWN the valley (each dry fall is a ledge)' }], ['lane', [[84, 17, 2], [84, 20, 2], [87, 20, 2]], { cont: true }], ['lane', [[96, 20, 1], [96, 20, 1]], { cont: true }],
        ['label', 83.9, 16.2, 'dry fall', 'note'], ['label', 96, 19.2, 'dry fall', 'note'],
        ['area', 85, 27, 87, 31, 'g', 3], ['label', 86, 29.4, 'tent site', 'note'],
        ['area', 104, 26, 106, 31, 'm', 1], ['label', 101, 35.2, 'THE LOW GROUND: mud, dead trees, drain pipes (no pool)', 'note'],
        ['area', 97, 14, 105, 22, 'g', 1], ['label', 101, 17.6, 'THE HOLLOW', 'place'], ['label', 101, 18.8, 'rowboat, swing · level, a board fits', 'note'],
        /* THE GULLY (0): the trail fords the flat bed, the cabin, the dump yard; then the bed ramps down into THE RAVINE (2 levels under its rims) */
        ['main', [[105, 15, 1], [113, 15, 0], [113, 22, 0], [121, 22, 0], [121, 27, 0], [125, 27, 0], [125, 34, 0]]],
        ['main', [[118, 21, 0], [118, 15, 0], [125, 15, 0], [125, 9, 0], [130, 9, 0], [130, 15, 0], [136, 15, 0]]],
        ['ramp', 106, 18, 0.75, -1, 0, 'D'], ['ramp', 106, 19, 0.75, -1, 0, 'D'], ['ramp', 107, 18, 0.25, -1, 0, 'D'], ['ramp', 107, 19, 0.25, -1, 0, 'D'],
        ['area', 108, 18, 111, 19, 'd', 0],
        ['ramp', 115, 18, -0.25, -1, 0, 'D'], ['ramp', 115, 19, -0.25, -1, 0, 'D'], ['ramp', 116, 18, -0.75, -1, 0, 'D'], ['ramp', 116, 19, -0.75, -1, 0, 'D'],
        ['ramp', 117, 18, -1.25, -1, 0, 'D'], ['ramp', 117, 19, -1.25, -1, 0, 'D'], ['ramp', 118, 18, -1.75, -1, 0, 'D'], ['ramp', 118, 19, -1.75, -1, 0, 'D'],
        ['area', 119, 18, 127, 19, 'd', -2], ['area', 128, 18, 130, 19, 'c', -2],
        ['label', 118, 18.6, 'BRIDGE', 'note'], ['label', 124.5, 18.6, 'THE RAVINE (2 levels down)', 'note'], ['label', 113, 18.6, 'ford', 'note'],
        ['thin', [[123, 17, 0], [130, 17, 0]], { to: 'the Sewer Mouth, along the ravine\'s north rim' }], ['thin', [[122, 20, 0], [129, 20, 0]], { to: 'the Sewer Mouth, along the ravine\'s south rim' }],
        ['set', 131, 18, 'k', -2], ['set', 131, 19, 'k', -2], ['label', 129, 21.4, 'THE SEWER MOUTH', 'mark'],
        ['area', 115, 12, 116, 13, 'g', 0], ['area', 112, 12, 114, 13, 'k', 0], ['label', 113, 12.6, 'THE CABIN', 'mark'],
        ['area', 108, 21, 111, 23, 'g', 0], ['label', 109.5, 22.1, 'dump yard', 'note'],
        ['thin', [[127, 32, 0], [130, 32, 0], [130, 33, 0]], { to: 'a secret: the hidden mouth (down to the Tunnel Way)' }], ['label', 131, 33.6, 'hidden mouth', 'door'],
        /* THE FENCED YARD (new, 0) and THE STORM DRAIN (0) */
        ['area', 123, 2, 129, 5, 'c', 0], ['area', 125, 2, 127, 3, 'k', 0], ['thin', [[125, 6, 0], [125, 7, 0]], { to: 'the fenced yard and its locked shed' }], ['label', 126, 4.6, 'fenced yard: chain-link, a locked shed', 'note'],
        ['area', 134, 12, 141, 19, 'c', 0], ['label', 137.5, 13.4, 'THE STORM DRAIN', 'place'], ['label', 137.5, 18.6, 'concrete, level, a board fits', 'note'],
        ['main', [[140, 16, 0], [142, 16, 0]]],
        ['doors'],
        /* the bridge's deck is laid last: the ramps and the ravine floor run on under it */
        ['ramp', 117, 18, -1.25, -1, 0, 'D'], ['ramp', 117, 19, -1.25, -1, 0, 'D'], ['ramp', 118, 18, -1.75, -1, 0, 'D'], ['ramp', 118, 19, -1.75, -1, 0, 'D'], ['set', 119, 18, 'd', -2], ['set', 119, 19, 'd', -2],
    ],
    /* the ways out: x, y, side, where to, level (their squares keep today's height) */
    doors: [[41, 0, 'N', 'the Old Road', 2], [18, 0, 'N', 'the Redwood Trail', 2], [3, 12, 'N', 'Came A Lot', 1], [7, 23, 'S', 'the Ritual Ground', 1], [42, 59, 'S', 'The Estate', 0], [143, 16, 'E', 'Disaster City', 0], [125, 35, 'S', 'the Valley Road', 0]],
    bridges: [[[117, 17], [117, 20]], [[118, 17], [118, 20]], [[119, 17], [119, 20]]],
    /* ── what the first three drawers did not hold; added for the shared tool ── */
    landmarks: [
        { name: 'The Old Tree', at: [28, 17], tall: 14 }, { name: 'The Ranger Station', at: [21, 18], tall: 3 }, { name: 'The Burned House', at: [15, 31], tall: 3 },
        { name: 'The Fire Lookout (the Top)', at: [65, 3], tall: 8 }, { name: 'The Crag', at: [76, 1], tall: 4 }, { name: 'The Cabin', at: [113, 12], tall: 3 }, { name: 'The Sewer Mouth', at: [131, 18], tall: 3 }],
    lookouts: [
        { name: 'the Old Tree\'s knoll', at: [31, 16], sees: 'The Old Tree', next: 'M' },
        { name: 'the Top, by the fire lookout', at: [67, 6], sees: 'The Fire Lookout (the Top)', next: 'C' }],
    flats: [
        { name: 'The Stair\'s landing', rect: [38, 2, 46, 9], why: 'the landing from DOOR HQ: open and level', board: true },
        { name: 'The Crossroads', rect: [38, 13, 46, 21], why: 'the signpost\'s clearing: a board fits', board: true },
        { name: 'The Campfire', rect: [38, 28, 46, 34], why: 'a camp: open and level', board: true },
        { name: 'The Fence Line\'s yard', rect: [38, 51, 46, 57], why: 'the farm yard that stands there', board: true },
        { name: 'The Top', rect: [62, 2, 69, 9], why: 'the fire lookout\'s ground', board: true },
        { name: 'The Hollow', rect: [97, 14, 105, 22], why: 'the rowboat and the swing: a board fits', board: true },
        { name: 'The Storm Drain', rect: [134, 12, 141, 19], why: 'a concrete apron', board: true }],
    buildings: [
        { name: 'The Ranger Station', rect: [20, 18, 22, 19], door: 'N', tall: 3, inside: 'one room: a desk, a radio, maps, bunks (it stands today)' },
        { name: 'The Burned House', rect: [14, 30, 17, 33], door: 'N', tall: 3, inside: 'a roofless ruin you walk into: burned rooms, a cellar hatch' },
        { name: 'The pump shed', rect: [55, 29, 57, 30], door: 'N', tall: 2, inside: 'one room: a pump, a tank, rust' },
        { name: 'The fire lookout', rect: [65, 3, 66, 4], door: 'S', tall: 8, inside: 'a tower: a stair, the watch room on top' },
        { name: 'The Cabin', rect: [112, 12, 114, 13], door: 'S', tall: 3, inside: 'one room: a cot, a stove, things nailed to the walls' },
        { name: 'The locked shed', rect: [125, 2, 127, 3], door: 'S', tall: 2, inside: 'one room, locked: a key opens it' }],
    found: [],
    pictures: [{ suffix: 'west', x0: 0, x1: 71, S: 26, title: 'PLAN 3, WEST HALF: The Clearing (the pilot) + the climb to the Top' },
        { suffix: 'east', x0: 60, x1: 143, y1: 35, S: 23, title: 'PLAN 3, EAST HALF: Dead Man\'s Cave, down the creek to the Storm Drain' }],
    picture: { S: 13 },
};
