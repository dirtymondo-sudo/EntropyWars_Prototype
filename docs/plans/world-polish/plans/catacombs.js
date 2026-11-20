/* THREAD 11, HEAVEN + HELL + VATICAN: THE CATACOMBS, THE HEIGHT PLAN. A new design: the room grows from 6 plots to 12, on levels.
   A PROPOSAL: nothing is built from it until mondo says so. DATA ONLY (the format: plans/README.md).
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/catacombs.js
   mondo 11-20 approved growing the Catacombs to 12 plots. TODAY: six rooms on one flat floor (the Crypt 2 up), one brick roof.
   THE IDEA: a dungeon that goes DOWN as you go in. The Crypt under the altar (2) is the top. The old galleries are the upper floor
   (0). Below them, new: the Descent (-1), the Bone Chapel and the Flooded Gallery (-2), the Collapsed Gallery and the Hot Gallery
   (-3), where the far wall is Hell's. Galleries TURN AND BRANCH; three ways lead down, and the short one ends in a ledge.
   The six old plots keep their places (the top-left 3 x 2 of the new 4 x 3 box). The two ways out in the old east wall MOVE to the
   new east wall: the Tunnel-Way from the Tunnel Mouth, Hell from the Hot Gallery.
   Levels: 0 = the old floor. One level = 1.75 m. It is roofed: the closed squares are rock and bone. */
'use strict';
module.exports = {
    zone: 'Heaven + Hell + Vatican', thread: 11, room: 'site_prebuilt_vatican_under',
    title: 'THE CATACOMBS: THE HEIGHT PLAN, 12 plots going down (a proposal)',
    grows: 'from 3 x 2 plots to 4 x 3 (12 plots, mondo\'s OK of 11-20): one new column east, one new row south; the two east ways out move to the new east wall',
    build: { frame: 'room', file: 'docs/areas/afterlife/districts/K.js + the map draw-afterlife.js (the room is grown there)' },
    noBuildings: 'the whole room is an inside: its chambers are the architecture',
    mass: 'rock and stacked bone (the walls)', massHeight: 3,
    grid: { w: 48, h: 36, n: 12 }, start: [19, 1],
    districts: { K: { name: 'The Catacombs', color: '#d8c7a0' } },
    plots: [
        [0, 0, 'The Loculi', 'K', 0, 0], [1, 0, 'The Crypt', 'K', 2, 2, { flat: 'the crypt under the altar' }], [2, 0, 'The Font', 'K', 0, 0], [3, 0, 'The Ossuary', 'K', null, -1],
        [0, 1, 'The Cistern', 'K', 0, 0, { flat: 'the foot of the cistern' }], [1, 1, 'The Descent', 'K', 0, -1], [2, 1, 'The Warm Wall', 'K', 0, -2], [3, 1, 'The Hot Gallery', 'K', null, -3],
        [0, 2, 'The Flooded Gallery', 'K', null, -2], [1, 2, 'The Bone Chapel', 'K', null, -2, { flat: 'the chapel: level, a board fits' }], [2, 2, 'The Collapsed Gallery', 'K', null, -3], [3, 2, 'The Tunnel Mouth', 'K', null, -2]],
    steps: [
        ['area', 14, 1, 22, 8, 'c', 2], ['label', 18, 3, 'THE CRYPT', 'place'], ['label', 18, 4.2, 'under the altar · a board fits', 'note'],
        ['area', 1, 13, 8, 20, 'c', 0], ['set', 6, 16, 'k', 0], ['label', 4.5, 14.4, 'THE CISTERN', 'place'], ['label', 6, 17.6, 'the well', 'door'],
        ['area', 13, 27, 20, 34, 'c', -2], ['set', 19, 33, 'k', -2], ['label', 16.5, 29, 'THE BONE CHAPEL', 'place'], ['label', 16.5, 30.2, 'level, a board fits', 'note'],
        ['area', 27, 2, 33, 8, 'c', 0], ['set', 30, 4, 'k', 0], ['label', 30, 2.6, 'THE FONT', 'mark'],
        ['area', 40, 2, 45, 9, 'c', -1], ['label', 42.5, 5.4, 'THE OSSUARY', 'place'],
        /* THE MAIN GALLERY (3 squares): the Crypt, the Loculi, the Cistern, the Descent, the Bone Chapel, the Collapsed Gallery, the Tunnel Mouth */
        ['main', [[16, 6, 2], [9, 6, 0], [9, 10, 0], [4, 10, 0], [4, 17, 0], [8, 17, 0], [8, 21, 0], [15, 21, -1], [15, 16, -1], [20, 16, -1], [20, 22, -2], [17, 22, -2], [17, 28, -2]], { name: 'the Main Gallery: down from the Crypt to the Bone Chapel' }],
        ['main', [[21, 31, -2], [27, 31, -3], [27, 27, -3], [33, 27, -3], [33, 32, -3], [40, 32, -2], [40, 28, -2], [45, 28, -2]], { name: 'the Main Gallery: the Collapsed Gallery to the Tunnel Mouth' }],
        ['main', [[41, 26, -2], [41, 20, -3], [45, 20, -3]], { name: 'the Hot Gallery: to the wall that is Hell\'s' }], ['label', 43, 17.6, 'THE HOT GALLERY', 'mark'], ['label', 30, 29.4, 'COLLAPSED GALLERY', 'note'],
        /* THIN GALLERIES (1 square) */
        ['thin', [[23, 5, 2], [28, 5, 0]], { to: 'the Font (the east side of the upper floor)' }],
        ['thin', [[30, 9, 0], [30, 14, -2], [26, 14, -2], [26, 20, -2], [30, 20, -2], [30, 25, -2]], { to: 'the Collapsed Gallery by the Warm Wall: the SHORT way down (it ends in a ledge: you cannot come back up it)' }], ['label', 28, 17, 'THE WARM WALL', 'note'],
        ['thin', [[34, 5, 0], [39, 5, -1]], { to: 'a secret: the Ossuary, bone stacks to the roof' }],
        ['thin', [[6, 22, 0], [6, 27, -2], [9, 27, -2], [9, 31, -2], [12, 31, -2]], { to: 'the Bone Chapel by the Flooded Gallery: the second way down, from the Cistern' }], ['area', 2, 29, 7, 33, 'w', -2], ['label', 5, 31, 'flooded', 'note'],
        ['thin', [[2, 8, 0], [2, 3, 0], [6, 3, 0]], { to: 'a secret: the end of the Loculi (grave niches, one of them open)' }], ['label', 5, 1.6, 'THE LOCULI', 'note'],
    ],
    doors: [[19, 0, 'N', 'the Vatican (the Basilica\'s stair)', 2], [47, 28, 'E', 'the Tunnel-Way (moved to the new east wall)', -2], [47, 20, 'E', 'Hell (the warm wall; moved to the new east wall)', -3]],
    landmarks: [{ name: 'The Bone Altar', at: [19, 33], tall: 2 }, { name: 'The Font', at: [30, 4], tall: 1 }, { name: 'The Well', at: [6, 16], tall: 3 }],
    lookouts: [{ name: 'the Bone Chapel\'s door', at: [14, 28], sees: 'The Bone Altar' }],
    found: [
        { name: 'the rubble under the ledge', from: [30, 26], to: [30, 25], kind: 'climb' }, { name: 'the broken stair behind the chapel', from: [20, 28], to: [15, 17], kind: 'climb' },
        { name: 'the drain from the Descent', from: [15, 20], to: [8, 20], kind: 'climb' }, { name: 'the hole in the crypt\'s floor', from: [9, 7], to: [15, 8], kind: 'ladder' }],
    flats: [
        { name: 'The Crypt', rect: [14, 1, 22, 8], why: 'the crypt under the altar', board: true }, { name: 'The Cistern', rect: [1, 13, 8, 20], why: 'the foot of the cistern', board: true },
        { name: 'The Bone Chapel', rect: [13, 27, 20, 34], why: 'a chapel of bones', board: true }, { name: 'The Font', rect: [27, 2, 33, 8], why: 'the font\'s chamber' }, { name: 'The Ossuary', rect: [40, 2, 45, 9], why: 'a chamber' }],
    buildings: [],
    picture: { S: 30 },
};
