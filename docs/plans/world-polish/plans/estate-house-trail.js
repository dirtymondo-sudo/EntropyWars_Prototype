/* THREAD 17, THE ESTATE: THE HOUSE TRAIL, a NEW walked way between the Estate's big room and the Haunted House's room.
   mondo 2026-11-20, asked "do you want a walked way between the two rooms": "Yes this is a big priority". (That is his OK for the new way;
   the build thread still writes its row in data.js beside DOOR_HQ.cut's rules.) APPROVED by mondo 2026-11-20 ("yep looks good"). Nothing is built from it yet.
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/estate-house-trail.js
   WHERE: a new room of 13 plots on world plots x -20..-14, y 14..16 (all free on the One World map 11-20), between the Estate's new West
   Bank (world -13,16) and the Haunted House's Treehouse (-20,14) and Graveyard (-21,15).
   THE IDEA: a horror walk over a wooded hill. From the lake you climb by switchbacks to the Dead Oak (5), where the land opens; from
   there you come down to the estate's old Back Gate and its gatehouse, and the House is on the far side. A thin trail leaves the top,
   drops through the low woods and comes in by the Graveyard's back gate: the hidden second way in.
   Levels: 0 = the lake shore of the Estate's room. The two seams' heights are checked against both rooms by the build thread. */
'use strict';
module.exports = {
    approved: 'mondo 2026-11-20, shown the four plans and their pictures in chat: "yep looks good"',
    zone: 'The Estate', thread: 17, title: 'THE ESTATE, THE HOUSE TRAIL: the new way from the Lake to the Haunted House',
    newRoom: 'a new room, 7 x 3 plots at world -20,14 (13 plots)', build: { frame: 'room', file: 'a new room design in bake-estate.js\'s frame' },
    mass: 'dead woods and brush (the wall of the place)', massHeight: 3,
    grid: { w: 84, h: 36, n: 12 }, start: [82, 30],
    districts: { T: { name: 'The House Trail', color: '#b58cff' } },
    plots: [
        [6, 2, 'The Fence Gap', 'T', null, 1, { flat: 'the open ground where the trail leaves the lake' }], [5, 2, 'The First Bend', 'T', null, 2], [4, 2, 'The Switchback', 'T', null, 3],
        [3, 2, 'The Old Camp', 'T', null, 2], [5, 1, 'The Pond', 'T', null, 0, { relief: 'a hollow with a pond; the Dead Oak\'s ledges land in it' }],
        [4, 1, 'The Dead Oak', 'T', null, 5, { flat: 'the open top of the hill' }], [3, 1, 'The Far Side', 'T', null, 4], [3, 0, 'The Descent', 'T', null, 3], [2, 0, 'The Back Road', 'T', null, 3],
        [1, 0, 'The Back Gate', 'T', null, 2, { flat: 'the gatehouse yard' }], [2, 1, 'The Low Woods', 'T', null, 2], [1, 1, 'The Bottom', 'T', null, 1], [0, 1, 'The Graveyard Gate', 'T', null, 2]],
    steps: [
        ['area', 75, 28, 82, 35, 'g', 1], ['label', 78.5, 31, 'THE FENCE GAP', 'place'], ['label', 78.5, 32.2, 'open · level, a board fits', 'note'],
        ['main', [[82, 30, 1], [77, 30, 1], [77, 26, 1], [70, 26, 2], [70, 32, 2], [63, 32, 2], [63, 27, 2], [57, 27, 3], [57, 32, 3], [51, 32, 3], [51, 25, 5], [55, 25, 5], [55, 18, 5]], { name: 'the House Trail: up the switchbacks to the Dead Oak' }],
        ['area', 49, 13, 56, 20, 'g', 5], ['set', 49, 13, 'k', 5], ['label', 52.5, 15, 'THE DEAD OAK', 'mark'], ['label', 52.5, 16.2, 'the hill\'s open top · a board fits', 'note'],
        /* the ledges straight back down, east: 5 -> 4 -> 2 -> the Pond's hollow (0) */
        ['area', 57, 14, 58, 15, 'g', 4], ['area', 59, 14, 59, 15, 'g', 2], ['area', 60, 13, 67, 20, 'g', 0], ['area', 62, 15, 65, 18, 'w', 0], ['label', 63.5, 19.6, 'THE POND', 'place'],
        ['thin', [[64, 21, 0], [64, 26, 2]], { to: 'the Pond in the hollow (where the Dead Oak\'s ledges land); this is the way back up to the trail' }],
        ['main', [[48, 16, 5], [43, 16, 4], [43, 10, 3], [38, 10, 3], [38, 4, 3], [31, 4, 3], [31, 9, 3], [24, 9, 2], [24, 5, 2], [18, 5, 2]], { name: 'the House Trail: down the far side to the Back Gate' }],
        ['area', 13, 1, 20, 8, 'g', 2], ['area', 21, 4, 23, 4, 'g', 2], ['area', 21, 1, 23, 3, 'k', 2], ['label', 16.5, 2.4, 'THE BACK GATE', 'place'], ['label', 16.5, 7.4, 'the gatehouse yard · a board fits', 'note'], ['label', 22, 0.6, 'gatehouse', 'note'],
        /* the hidden second way: off the top, down through the low woods, in by the Graveyard's back gate */
        ['thin', [[43, 18, 4], [43, 21, 4], [37, 21, 3], [37, 17, 3], [31, 17, 2], [31, 22, 2], [25, 22, 2], [25, 18, 2], [19, 18, 1], [19, 14, 1], [13, 14, 1], [13, 19, 1], [7, 19, 2], [7, 17, 2], [1, 17, 2]], { to: 'the Haunted House by the Graveyard\'s back gate: the hidden second way in' }],
        ['thin', [[31, 11, 3], [31, 16, 2]], { to: 'the Graveyard trail, from the Back Road (a short cut between the two ways)' }],
        ['thin', [[49, 33, 3], [44, 33, 2], [44, 30, 2]], { to: 'a secret: the old camp in the hollow' }], ['area', 38, 26, 43, 31, 'g', 2], ['label', 40.5, 28.6, 'old camp', 'note'],
    ],
    doors: [[83, 30, 'E', 'The Estate (the Lake\'s West Bank)', 1], [12, 5, 'W', 'the Haunted House (by the Treehouse)', 2], [0, 17, 'W', 'the Haunted House (the Graveyard\'s back gate)', 2]],
    landmarks: [{ name: 'The Dead Oak', at: [49, 13], tall: 6 }, { name: 'The Pond', at: [63, 16], tall: 1 }, { name: 'The Back Gatehouse', at: [22, 2], tall: 3 }],
    lookouts: [{ name: 'the hill\'s east edge, under the Dead Oak', at: [56, 15], sees: 'The Pond' }],
    found: [
        { name: 'the roots out of the Pond\'s hollow', from: [60, 15], to: [59, 15], kind: 'climb' },
        { name: 'the fallen trunk above the old camp', from: [43, 28], to: [50, 31], kind: 'trunk' },
        { name: 'the rock steps under the Dead Oak', from: [53, 31], to: [53, 20], kind: 'climb' }],
    flats: [
        { name: 'The Fence Gap', rect: [75, 28, 82, 35], why: 'the open ground where the trail leaves the lake', board: true },
        { name: 'The Dead Oak', rect: [49, 13, 56, 20], why: 'the hill\'s open top', board: true },
        { name: 'The Back Gate', rect: [13, 1, 20, 8], why: 'the gatehouse yard', board: true }],
    buildings: [{ name: 'The Back Gatehouse (new)', rect: [21, 1, 23, 3], door: 'S', tall: 3, inside: 'the estate\'s old back lodge: one room below, a ladder to a loft with a window over the gate' }],
    picture: { S: 20 },
};
