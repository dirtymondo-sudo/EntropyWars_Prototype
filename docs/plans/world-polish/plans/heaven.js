/* THREAD 11, HEAVEN + HELL + VATICAN: HEAVEN'S HEIGHT PLAN, laid OVER THE ROOM AS IT STANDS (`underlay`).
   APPROVED by mondo 2026-11-20 ("looks good"). Nothing is built from it yet. DATA ONLY (the format: plans/README.md).
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/heaven.js
   TODAY Heaven has its climb (the foot of the stair 2, the flights 5, 8, 11, the Gate 14, the Cloud Fields 14, the City 16), but every
   join between its clouds is a straight strip two squares wide: the Cloud Bridge (17 squares), the Cloud Path (24), the City Path
   (12), the Long Way (19 + 13 + 18). And the Fields are one level slab.
   THE IDEA. The void is the wall, so the plan lays NEW CLOUD and takes the straight strips away:
   - THE CLOUD BRIDGE becomes a switchback up three small clouds, with a ledge to hop back down.
   - THE CLOUD PATH (the Gate to the Fields) and THE CITY PATH (the Fields up to the City) wind, three squares wide.
   - THE LONG WAY stays the slow second way up, but it turns and steps (two squares wide) round by the Fall.
   - THE FIELDS get the Sun's dial on a rise (15), the Terraces above (16) and the loose Cloud Paths below (13).
   THE GATE'S LANDING and THE CITY'S STREET stay LEVEL ON PURPOSE (a landing, a street: architecture). The three floating flights that
   stand today are kept (they are stairs). Levels: one level = 1.75 m, as the room has them today. */
'use strict';
const street = 'the City stands on one cloud: a level street (architecture)', landing = 'the Gate\'s landing: one level cloud';
module.exports = {
    approved: 'mondo 2026-11-20, shown the plan and its picture in chat: "looks good"',
    zone: 'Heaven + Hell + Vatican', thread: 11, room: 'site_prebuilt_heaven_plots', underlay: { deep: 30, void: true },
    title: 'HEAVEN: THE HEIGHT PLAN over the room as it stands',
    build: { frame: 'room', file: 'docs/areas/afterlife/districts/heaven-room.js (new: the room design, in the room\'s own frame)' },
    mass: 'the void (open sky: the wall of the place)', massHeight: 0,
    tiles: { ' ': ['the void (open sky)', false, [22, 34, 66], [22, 34, 66]], u: ['cloud as it stands today (read from the room)', true, [150, 160, 190], [250, 250, 255]],
        g: ['NEW cloud (open ground)', true, [200, 170, 120], [255, 236, 190]] },
    grid: { w: 84, h: 96, n: 12 }, start: [6, 90],
    /* the room's "R" plots (the cloud paths) are planned with the district they lead into */
    districts: { T: { name: 'The Stairway', color: '#f2c14e' }, A: { name: 'The Gate', color: '#ffffff', flat: landing }, F: { name: 'The Cloud Fields', color: '#7fe3ff' }, Y: { name: 'The City', color: '#ffb347', flat: street } },
    plots: [
        [3, 0, 'The Towers, west', 'Y', 16, 16, { flat: street }], [4, 0, 'Room 777, west', 'Y', 16, 16, { flat: street }], [5, 0, 'Room 777, east', 'Y', 16, 16, { flat: street }], [6, 0, 'The Towers, east', 'Y', 16, 16, { flat: street }],
        [3, 1, 'The City Path, west', 'Y', 16, 15, { relief: 'the winding climb to the City' }], [4, 1, 'The City Path, east', 'Y', 16, 16, { relief: 'the winding climb to the City' }],
        [2, 2, 'The Terraces', 'F', 15, 16], [3, 2, 'The Sun', 'F', 14, 15, { relief: 'the Sun\'s dial on a rise' }], [4, 2, 'The Cloud Fields', 'F', 14, 14, { flat: 'an open field of cloud' }], [5, 2, 'The Cloud Paths', 'F', 14, 13, { relief: 'loose clouds, a level lower' }],
        [1, 3, 'The Cloud Path, west', 'A', 14, 14], [2, 3, 'The Cloud Path, middle', 'A', 14, 14], [3, 3, 'The Cloud Path, east', 'A', 14, 14],
        [0, 4, 'The Top of the Stair', 'A', 13, 14, { flat: landing }], [1, 4, 'The Gate, west', 'A', 14, 14, { flat: landing }], [2, 4, 'The Gate, east', 'A', 13, 14, { flat: landing }], [3, 4, 'The Book', 'A', 13, 14, { flat: landing }],
        [0, 5, 'The Cloud Bridge', 'T', 11, 12, { relief: 'three small clouds, a switchback' }],
        [0, 6, 'The Third Flight', 'T', 11, 11], [1, 6, 'The Second Flight', 'T', 8, 8], [2, 6, 'The Long Way, north', 'T', 7, 8, { relief: 'the Long Way steps up' }], [3, 6, 'The Fall, north', 'T', 7, 7, { relief: 'the Long Way steps up' }],
        [0, 7, 'The Stair in the Sky', 'T', 2, 2, { flat: 'the foot of the stair: the landing from the world below' }], [1, 7, 'The First Flight', 'T', 5, 5], [2, 7, 'The Long Way', 'T', 5, 5], [3, 7, 'The Fall', 'T', 5, 6, { relief: 'the Long Way steps up' }]],
    steps: [
        ['area', 55, 2, 64, 7, 'k', 16],
        /* the straight strips go */
        ['area', 5, 55, 7, 71, ' ', 0], ['area', 25, 24, 25, 32, ' ', 0], ['area', 23, 40, 47, 41, ' ', 0], ['area', 23, 42, 24, 47, ' ', 0], ['area', 46, 36, 47, 39, ' ', 0], ['area', 47, 12, 48, 23, ' ', 0],
        ['area', 26, 89, 41, 90, ' ', 0], ['area', 40, 78, 41, 88, ' ', 0], ['area', 29, 76, 41, 77, ' ', 0],
        ['label', 60, 5, 'ROOM 777', 'mark'], ['label', 20, 51, 'THE GATE', 'mark'], ['label', 22, 52.4, 'the landing · level on purpose', 'note'], ['label', 6, 89, 'THE STAIR IN THE SKY', 'place'], ['label', 60, 9.4, 'THE CITY · one level street', 'note'],
        /* ── THE CLOUD BRIDGE: a switchback from the Third Flight (11) to the Gate's landing (14) ── */
        ['main', [[6, 72, 11], [6, 67, 12], [10, 67, 12], [10, 61, 13], [4, 61, 13], [4, 56, 14]], { name: 'the Stairway: the Cloud Bridge, a switchback up three clouds' }],
        ['area', 3, 63, 5, 65, 'g', 12], ['label', 4, 64.4, 'ledge', 'note'],
        /* ── THE CLOUD PATH: the Gate's landing to the Cloud Fields ── */
        ['main', [[30, 47, 14], [30, 43, 14], [36, 43, 14], [36, 38, 14], [42, 38, 14], [42, 36, 14]], { name: 'the Cloud Path: the Gate to the Fields' }],
        /* ── THE FIELDS: the Sun's dial on its rise, the Terraces, the loose clouds ── */
        ['area', 34, 26, 41, 33, 'g', 15], ['label', 37.5, 29, 'THE SUN\'S DIAL', 'mark'], ['label', 37.5, 30.2, 'on a rise · a board fits', 'note'], ['label', 53, 30, 'THE CLOUD FIELDS · open, level', 'place'], ['label', 29, 23.2, 'THE TERRACES', 'place'],
        ['thin', [[45, 30, 14], [42, 30, 15]], { to: 'the Sun\'s dial, up its rise' }],
        ['thin', [[33, 34, 14], [28, 34, 16], [28, 32, 16]], { to: 'the Terraces: the high cloud west of the Fields (a lookout)' }],
        ['thin', [[60, 30, 14], [65, 30, 13], [65, 27, 13], [68, 27, 13]], { to: 'a secret: the far one of the loose clouds, east of the Fields' }], ['area', 69, 25, 71, 28, 'g', 13],
        /* ── THE CITY PATH: the Fields (14) up to the City (16) ── */
        ['main', [[44, 25, 14], [44, 19, 15], [50, 19, 15], [50, 13, 16]], { name: 'the City Path: the winding climb to the City' }],
        ['area', 52, 16, 54, 18, 'g', 15], ['label', 53, 15.4, 'ledge', 'note'],
        /* ── THE LONG WAY (2 squares): the slow second way up, round by the Fall ── */
        ['lane', [[26, 89, 5], [31, 89, 5], [31, 92, 5], [37, 92, 5], [37, 88, 5], [43, 88, 5], [43, 82, 6], [39, 82, 6], [39, 77, 7], [44, 77, 7], [44, 72, 8], [36, 72, 8], [36, 76, 8], [28, 76, 8]], { to: 'the Second Flight by THE LONG WAY: the slow second way up, round by the Fall' }],
        ['label', 45, 85, 'THE FALL', 'mark'],
        /* ── small thin ways ── */
        ['thin', [[3, 89, 2], [1, 89, 2]], { to: 'the Castle in the Sky (another zone)' }],
        ['thin', [[4, 91, 2], [4, 93, 2]], { to: 'the Ski Mountain (another zone)' }],
        ['thin', [[37, 51, 14], [39, 51, 14]], { to: 'the Book (on the landing\'s east end)' }], ['label', 41, 50, 'THE BOOK', 'mark'],
    ],
    /* the three floating flights that stand today (real stair pieces) */
    stairs: [[[11, 89], [15, 89]], [[20, 85], [20, 79]], [[16, 76], [10, 76]]],
    doors: [[7, 95, 'S', 'the Vatican (the Observatory\'s stair)', 2], [0, 89, 'W', 'the Castle in the Sky', 2]],
    landmarks: [{ name: 'The Foot of the Stair', at: [6, 88], tall: 1 }, { name: 'The Gate', at: [20, 50], tall: 5 }, { name: 'The Book', at: [41, 51], tall: 2 }, { name: 'The Sun\'s Dial', at: [37, 29], tall: 3 }, { name: 'Room 777', at: [60, 8], tall: 6 }],
    lookouts: [
        { name: 'the Third Flight\'s cloud', at: [6, 80], sees: 'The Foot of the Stair', next: 'A' }, { name: 'the Top of the Stair', at: [4, 53], sees: 'The Gate', next: 'T' },
        { name: 'the Terraces', at: [29, 29], sees: 'The Sun\'s Dial', next: 'Y' }, { name: 'the City\'s south edge', at: [50, 11], sees: 'Room 777', next: 'F' }],
    found: [
        { name: 'the loose puffs by the first flight', from: [10, 88], to: [16, 88], kind: 'ledge chain' }, { name: 'the cloud wisps up to the second flight', from: [22, 86], to: [22, 78], kind: 'climb' },
        { name: 'the wisps up to the third flight', from: [18, 75], to: [10, 75], kind: 'climb' }, { name: 'the bridge\'s under-cloud', from: [8, 74], to: [4, 64], kind: 'climb' },
        { name: 'the terraces\' steps', from: [33, 34], to: [28, 33], kind: 'climb' }, { name: 'the cloud ladder under the City', from: [53, 17], to: [51, 14], kind: 'ladder' }, { name: 'the puff chain', from: [68, 27], to: [59, 28], kind: 'ledge chain' }],
    flats: [
        { name: 'The Stair in the Sky', rect: [0, 84, 11, 94], why: 'the foot of the stair: the landing from the world below' }, { name: 'The Gate\'s landing', rect: [0, 48, 45, 54], why: landing },
        { name: 'The Sun\'s Dial', rect: [34, 26, 41, 33], why: 'the dial\'s rise', board: true }, { name: 'The Cloud Fields', rect: [46, 24, 59, 35], why: 'an open field of cloud', board: true },
        { name: 'The City\'s street', rect: [37, 1, 54, 11], why: street, board: true }],
    buildings: [{ name: 'Room 777', rect: [55, 2, 64, 7], door: 'S', tall: 6, inside: 'the hall of Room 777 (a walk-in hall; it stands today)' }],
    picture: { S: 18 },
};
