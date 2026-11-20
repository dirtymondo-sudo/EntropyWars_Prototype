/* THREAD 12, LEYLINES: THE HEIGHT PLAN of BABEL, laid OVER THE ROOM AS IT STANDS (`underlay`), in the room it shares with Technoticlan.
   APPROVED by mondo 2026-11-20 ("The rest looks good"). Nothing is built from it yet. DATA ONLY (the format: plans/README.md).
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/leylines-babel.js
   TODAY: the Tower stands and is climbed already (four flights that spiral: north, east, south, west, to level 16). The LAND round
   it is dead level, and there is nothing to walk into.
   THE IDEA. THE TOWER IS NOT TOUCHED (a monument is never lifted; the six plots it stands on keep their level). The land WEST and
   EAST of it is shaped as the builders' country:
   - WEST, the through way from the Ley Line: the Kiln's yard (0, the seam), up to the Brick Stacks (1), down into the Clay Pits (-1).
   - EAST: the Crane on its platform (3), the Workers' Town on a level terrace (2) with two houses you walk into, the Barn yard (1).
   - Two thin ways join them round the Tower's foot, north and south; the Tower's own spiral is the third, and its top is the lookout.
   TECHNOTICLAN (the lake city, the south half of the room) IS NOT PLANNED HERE: it is drawn as it stands. It needs its own pass.
   mondo 11-20 on its causeways: "Tecnoticlan can stay straight bc it's more architecture than dungeon or passageways".
   Levels: 0 = the plain today. One level = 1.75 m. */
'use strict';
const Z = 'Technoticlan is not planned yet: drawn as it stands', R = 'the route kit\'s trail: its squares stay as they are', TW = 'the Tower of Babel, as built: a monument is not lifted';
module.exports = {
    approved: 'mondo 2026-11-20, shown the plan and its picture in chat: "The rest looks good"',
    zone: 'Leylines', thread: 12, room: 'site_prebuilt_gobekli_ow_babel', underlay: { deep: 6, shift: true },
    title: 'LEYLINES, BABEL: the land round the Tower, THE HEIGHT PLAN over the room as it stands',
    build: { frame: 'room', file: 'docs/areas/leylines/districts/T-room.js (new: the room design, in the room\'s own frame)' },
    mass: 'closed ground', massHeight: 0,
    tiles: { u: ['the ground and the Tower as they stand today (read from the room)', true, [120, 104, 80], [240, 226, 196]] },
    grid: { w: 84, h: 96, n: 12 }, start: [37, 18],
    districts: { T: { name: 'Babel', color: '#f2c14e' }, Z: { name: 'Technoticlan (not planned yet)', color: '#6fb7ff', skip: Z }, R: { name: 'the trail (the route kit\'s)', color: '#9a9a9a', skip: R } },
    plots: [
        [3, 0, 'The Brick Stacks', 'T', 0, 1], [4, 0, 'The Tower, north-west', 'T', 0, 0, { flat: TW }], [5, 0, 'The North Stair', 'T', 0, 0, { flat: 'the stair\'s forecourt; ' + TW }], [6, 0, 'The Crane', 'T', 0, 3, { flat: 'the crane\'s platform' }],
        [3, 1, 'The Kiln', 'T', 0, 0, { flat: 'the kiln\'s yard, the seam with the Ley Line' }], [4, 1, 'The Tower', 'T', 0, 0, { flat: TW }], [5, 1, 'The Tower, east', 'T', 0, 0, { flat: TW }], [6, 1, 'The Workers\' Town', 'T', 0, 2, { flat: 'the town\'s terrace: one level street' }],
        [3, 2, 'The Clay Pits', 'T', 0, -1, { relief: 'dug pits, a level under the road' }], [4, 2, 'The Tower, south-west', 'T', 0, 0], [5, 2, 'The South Face', 'T', 0, 0, { flat: TW }], [6, 2, 'The Barn Door', 'T', 0, 1, { flat: 'the barn yard' }],
        [3, 3, 'The trail, the well', 'R', 0, 0, { flat: R }], [3, 4, 'The trail, the bee yard', 'R', 0, 0, { flat: R }],
        [0, 5, 'The Garden Islets', 'Z', 0, 0, { flat: Z }], [1, 5, 'The Ball Court', 'Z', 0, 0, { flat: Z }], [2, 5, 'The North Causeway', 'Z', 0, 0, { flat: Z }], [3, 5, 'The Pyramid, north', 'Z', 0, 0, { flat: Z }], [4, 5, 'The Lake', 'Z', 0, 0, { flat: Z }],
        [0, 6, 'The Causeway', 'Z', 0, 0, { flat: Z }], [1, 6, 'The West Gate', 'Z', 0, 0, { flat: Z }], [2, 6, 'The Canal', 'Z', 0, 0, { flat: Z }], [3, 6, 'The Pyramid', 'Z', 0, 0, { flat: Z }], [4, 6, 'The Pyramid, east', 'Z', 0, 0, { flat: Z }],
        [0, 7, 'The Reeds', 'Z', 0, 0, { flat: Z }], [1, 7, 'The Round Tower', 'Z', 0, 0, { flat: Z }], [2, 7, 'The Portcullis', 'Z', 0, 0, { flat: Z }], [3, 7, 'The Pyramid, south', 'Z', 0, 0, { flat: Z }], [4, 7, 'The Lake, south', 'Z', 0, 0, { flat: Z }]],
    steps: [
        ['label', 59.5, 16, 'THE TOWER OF BABEL', 'mark'], ['label', 59.5, 18.4, 'as built: four flights spiral to the top', 'note'], ['label', 30, 78, 'TECHNOTICLAN: as it stands (not planned yet)', 'note'], ['label', 41, 15.4, 'THE KILN', 'mark'],
        /* ── WEST: the through way from the Ley Line ── */
        ['main', [[37, 18, 0], [37, 11, 1], [44, 11, 1]], { name: 'the Brickmakers\' Road: from the Ley Line up to the Brick Stacks' }], ['label', 41, 1.4, 'THE BRICK STACKS', 'place'],
        ['main', [[37, 20, 0], [37, 27, -1], [42, 27, -1], [42, 34, 0]], { name: 'the Brickmakers\' Road: down through the Clay Pits to the trail south (Technoticlan)' }],
        ['area', 44, 25, 47, 29, 'm', -1], ['label', 45.5, 24.2, 'THE CLAY PITS', 'place'],
        /* ── EAST: the Crane (3), the Workers' Town (2), the Barn yard (1) ── */
        ['area', 72, 1, 79, 8, 'c', 3], ['set', 78, 2, 'k', 3], ['label', 75.5, 6.6, 'THE CRANE', 'mark'], ['label', 75.5, 7.6, 'its platform · a board fits', 'note'],
        ['area', 72, 12, 83, 20, 'g', 2], ['area', 72, 14, 73, 16, 'k', 2], ['area', 79, 13, 81, 15, 'k', 2], ['label', 77.5, 20.6, 'THE WORKERS\' TOWN', 'place'],
        ['area', 72, 23, 83, 33, 'g', 1], ['label', 77.5, 29, 'THE BARN YARD', 'place'], ['label', 77.5, 30.2, 'level, a board fits', 'note'],
        ['main', [[76, 4, 3], [82, 4, 3], [82, 11, 2], [76, 11, 2], [76, 18, 2], [81, 18, 2], [81, 25, 1], [76, 25, 1], [76, 32, 1]], { name: 'the Town Road: the Crane, the Workers\' Town, the Barn yard' }],
        /* ── THIN TRAILS round the Tower's foot, and the Tower itself ── */
        ['thin', [[46, 10, 1], [46, 4, 0], [54, 4, 0], [54, 2, 0], [62, 2, 0], [62, 4, 0], [69, 4, 3], [69, 2, 3], [71, 2, 3]], { to: 'the Crane and the Workers\' Town, along the Tower\'s NORTH foot past the North Stair (a second way round the Tower)' }],
        ['thin', [[45, 31, -1], [51, 31, 0], [51, 33, 0], [59, 33, 0], [59, 31, 0], [67, 31, 0], [67, 33, 0], [71, 33, 1]], { to: 'the Barn yard and the Workers\' Town, along the Tower\'s SOUTH foot (the other way round)' }],
        ['thin', [[57, 3, 0], [58, 3, 0]], { to: 'the TOP of the Tower of Babel, up its four flights (north, east, south, west): the lookout over all of Leylines' }],
    ],
    /* the Tower's four flights, as built (real stair pieces): the plain to terrace 4, 4 to 8, 8 to 12, 12 to the top (16) */
    stairs: [[[59, 2], [59, 6]], [[70, 16], [67, 17]], [[61, 25], [60, 23]], [[55, 16], [57, 17]]],
    doors: [[36, 18, 'W', 'the Ley Line (the East Mouth)', 0]],
    landmarks: [{ name: 'The Tower of Babel', at: [62, 17], tall: 2 }, { name: 'The Crane', at: [78, 2], tall: 6 }, { name: 'The Kiln', at: [41, 16], tall: 3 }],
    lookouts: [{ name: 'the top of the Tower', at: [60, 16], sees: 'The Crane', next: 'Z' }, { name: 'the Crane\'s platform', at: [73, 7], sees: 'The Tower of Babel' }],
    found: [
        { name: 'the pit\'s cut steps', from: [45, 24], to: [45, 23], kind: 'climb' },
        { name: 'the scaffold on the Tower\'s west face', from: [47, 20], to: [48, 20], kind: 'ladder' }],
    flats: [
        { name: 'The Brick Stacks', rect: [38, 2, 45, 9], why: 'the stack yard: bricks in rows' },
        { name: 'The Crane\'s platform', rect: [72, 1, 79, 8], why: 'the crane stands on it', board: true },
        { name: 'The Workers\' Town', rect: [72, 12, 83, 20], why: 'the town\'s one street, on a level terrace', board: true },
        { name: 'The Barn yard', rect: [72, 23, 83, 33], why: 'a yard', board: true }],
    buildings: [
        { name: 'A workers\' house (new; mud brick, early-civilization style)', rect: [72, 14, 73, 16], door: 'E', tall: 2, inside: 'one room: sleeping mats, a hearth, water jars, a ladder to the flat roof' },
        { name: 'The brickmakers\' hall (new; mud brick)', rect: [79, 13, 81, 15], door: 'S', tall: 2, inside: 'one hall: brick moulds, a long table, tally marks on the wall' }],
    picture: { S: 20, y1: 47 },
};
