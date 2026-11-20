/* THREAD 12, LEYLINES: THE HEIGHT PLAN of the Line's room (Göbekli Tepe + the Ley Line), square by square.
   APPROVED by mondo 2026-11-20 ("yep looks good"). Nothing is built from it yet: its build thread starts here. DATA ONLY (the format: plans/README.md).
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/leylines-line.js
   TODAY the Ley Line is nine plots in a chain ONE PLOT WIDE, dead level, with the walk on the Line itself: 380 m straight.
   (A room one plot wide cannot be fixed inside its plots: thread 3's lesson. So the room GROWS, inside its own 12 x 3 box.)
   THE IDEA. THE LINE STAYS DEAD STRAIGHT AND DEAD LEVEL (it is a ley line): a kerbed bed of light at level 0 from mouth to mouth.
   THE LAND rises and falls beside it: knolls north (up to 5), hollows south (down to -2). Where the land is higher the Line runs in a
   CUT; you always know where you are by where the Line is and whether you stand over it or under it.
   THE WALK never follows the Line: it snakes from side to side, crosses the Line five times (the Nexus ring and three stone slabs
   over the cut), climbs by switchbacks, and has ledges to hop back down. 18 new plots, north and south of the old nine.
   mondo 11-20, asked whether the Line stays walkable end to end: "no I do not want it to be a long straight line". So you CROSS the
   Line and never walk along it. On the 18 new plots: "Yes that's fine". On the two new buildings: "that fine, ancient right? or at
   least one of the early civilizations": both are ANCIENT dry stone, built like Göbekli Tepe's enclosures (no later style).
   GÖBEKLI TEPE looks good in the pictures and is left as built: drawn here only as open ground so the walks join.
   Levels: 0 = the plain and the Line today. One level = 1.75 m. */
'use strict';
const G = 'Göbekli Tepe looks good in the pictures: left as it stands (its tell is not redrawn here)';
module.exports = {
    approved: 'mondo 2026-11-20, shown the four plans and their pictures in chat: "yep looks good"',
    zone: 'Leylines', thread: 12, room: 'site_prebuilt_gobekli_ow_line',
    title: 'LEYLINES, the Line\'s room: Göbekli Tepe + THE LEY LINE, THE HEIGHT PLAN',
    build: { frame: 'room', file: 'docs/areas/leylines/districts/Y-room.js (new: the room design, in the room\'s own frame)' },
    grows: 'the box stays 12 x 3 plots (no door moves); 18 new plots in its empty cells, north and south of the Ley Line\'s nine',
    mass: 'scrub, boulders and standing stones (the wall of the place)', massHeight: 1,
    tiles: { y: ['THE LEY LINE: a kerbed bed of light, dead straight and level. You cross it; you do not walk along it', false, [70, 225, 255], [70, 225, 255]] },
    grid: { w: 144, h: 36, n: 12 }, start: [1, 31],
    districts: { G: { name: 'Göbekli Tepe (left as built)', color: '#c9a36a', skip: G }, Y: { name: 'The Ley Line', color: '#7fe3ff' } },
    plots: [
        [0, 0, 'The Dig', 'G', 0, 0, { flat: G }], [1, 0, 'The Mound', 'G', 0, 0, { flat: G }], [2, 0, 'The Sentinel', 'G', 0, 0, { flat: G }],
        [0, 1, 'The Dig Camp', 'G', 0, 0, { flat: G }], [1, 1, 'The Four Enclosures', 'G', 0, 0, { flat: G }], [2, 1, 'The Cistern', 'G', 0, 0, { flat: G }],
        [0, 2, 'The First Doorway', 'G', 0, 0, { flat: G }], [1, 2, 'The T-Pillars', 'G', 0, 0, { flat: G }], [2, 2, 'The Dry Slope', 'G', 0, 0, { flat: G }],
        [3, 1, 'The West Mouth', 'Y', 0, 0, { flat: 'the paved mouth where the Line starts' }], [4, 1, 'The Niches', 'Y', 0, 1, { relief: 'the Line in a cut, 1 level under its banks' }],
        [5, 1, 'The Forks', 'Y', 0, 2, { relief: 'the Line in a cut, 2 levels deep; a slab crosses it' }], [6, 1, 'The Great Line', 'Y', 0, 0], [7, 1, 'The Nexus', 'Y', 0, 0, { flat: 'the Nexus ring: level, a board fits' }],
        [8, 1, 'The Great Line, east', 'Y', 0, 1, { relief: 'the Line in a cut; a slab crosses it' }], [9, 1, 'The Forks, east', 'Y', 0, 2, { relief: 'the Line in a cut, 2 levels deep, under the High Stone' }],
        [10, 1, 'The Niches, east', 'Y', 0, 1, { relief: 'the Line in a cut; a slab crosses it' }], [11, 1, 'The East Mouth', 'Y', 0, 0, { flat: 'the paved mouth where the Line leaves for Babel' }],
        [3, 0, 'The North Bank', 'Y', null, 1], [4, 0, 'The Terrace', 'Y', null, 3], [5, 0, 'The North Knoll', 'Y', null, 4, { flat: 'the knoll\'s open top' }], [6, 0, 'The Lone Stone', 'Y', null, 2],
        [7, 0, 'The Rise', 'Y', null, 1], [8, 0, 'The Shoulder', 'Y', null, 2], [9, 0, 'The High Stone', 'Y', null, 5, { flat: 'the highest ground on the Line: an open top' }], [10, 0, 'The East Knoll', 'Y', null, 3], [11, 0, 'The East Bank', 'Y', null, 1],
        [3, 2, 'The Dry Field', 'Y', null, 0, { flat: 'an open field' }], [4, 2, 'The Low Ground', 'Y', null, -1], [5, 2, 'The South Bank', 'Y', null, 1], [6, 2, 'The Sink', 'Y', null, -2],
        [7, 2, 'The Fork\'s End', 'Y', null, -1], [8, 2, 'The Flat', 'Y', null, 0, { flat: 'an open field' }], [9, 2, 'The South Rise', 'Y', null, 1], [10, 2, 'The Hollow', 'Y', null, -1], [11, 2, 'The Last Niche', 'Y', null, 0]],
    steps: [
        /* ── GÖBEKLI TEPE (as built; open ground here so the walks join) ── */
        ['area', 0, 0, 35, 35, 'g', 0], ['area', 13, 12, 22, 20, 'k', 0], ['label', 17.5, 15.5, 'GÖBEKLI TEPE', 'mark'], ['label', 17.5, 17, 'the tell, as built (not redrawn)', 'note'],
        /* ── THE LINE: dead straight, level 0, from mouth to mouth; the ring and the slabs lie over it ── */
        ['area', 44, 17, 135, 18, 'y', 0], ['label', 76, 17.6, 'THE LEY LINE', 'mark'],
        ['area', 36, 13, 43, 20, 'c', 0], ['area', 44, 14, 44, 14, 'c', 0], ['area', 45, 13, 47, 15, 'k', 0], ['label', 39.5, 15, 'THE WEST MOUTH', 'place'], ['label', 46, 12.4, 'rest house', 'note'],
        ['area', 86, 14, 94, 22, 'c', 0], ['label', 90, 17, 'THE NEXUS', 'mark'], ['label', 90, 20.4, 'the ring · level, a board fits', 'note'],
        ['area', 65, 16, 67, 19, 'c', 2], ['area', 102, 16, 104, 19, 'c', 1], ['area', 124, 16, 126, 19, 'c', 1], ['label', 66, 17.6, 'slab', 'note'], ['label', 103, 17.6, 'slab', 'note'], ['label', 125, 17.6, 'slab', 'note'],
        ['area', 136, 13, 143, 20, 'c', 0], ['label', 139.5, 15, 'THE EAST MOUTH', 'place'],
        /* ── THE WALK, part 1: the West Mouth, up the north side to the North Knoll (4), over the cut, down the south side into the Sink (-2) ── */
        ['main', [[38, 12, 0], [38, 6, 1], [44, 6, 1], [44, 3, 1], [51, 3, 3], [51, 9, 3], [58, 9, 4], [58, 4, 4], [64, 4, 4]], { name: 'the Walk: the West Mouth to the North Knoll' }],
        ['area', 62, 1, 69, 8, 'g', 4], ['area', 69, 9, 71, 10, 'g', 4], ['label', 65.5, 3, 'THE NORTH KNOLL', 'place'], ['label', 65.5, 6.4, 'open top · level, a board fits', 'note'],
        ['main', [[66, 8, 4], [66, 15, 2], [62, 15, 2]], { name: 'the Walk: down the knoll to the cut' }],
        ['main', [[66, 16, 2], [66, 21, 2], [61, 21, 2], [61, 27, 1], [68, 27, 1], [68, 32, 1], [74, 32, 0], [74, 27, -1], [81, 27, -2], [81, 20, 0], [87, 20, 0]], { name: 'the Walk: over the slab, down the switchback into the Sink, up to the Nexus' }],
        ['area', 69, 28, 72, 28, 'g', 1], ['label', 70.5, 29.4, 'ledge', 'note'],
        ['area', 79, 29, 83, 34, 'g', -2], ['label', 81, 31.6, 'THE SINK', 'place'],
        /* ── part 2: the Nexus, north over the Shoulder, back over the Line, the Flat, the South Rise, the Hollow, over the Line, the East Knoll, the East Mouth ── */
        ['main', [[90, 14, 0], [90, 8, 1], [95, 8, 1], [95, 3, 1], [102, 3, 2], [102, 8, 2], [106, 8, 2], [106, 14, 1], [103, 14, 1], [103, 22, 1], [99, 22, 1], [99, 28, 0], [106, 28, 0], [106, 32, 0], [113, 32, 1], [113, 27, 1], [119, 27, 1], [119, 32, 1], [126, 32, -1], [126, 28, -1], [122, 28, -1], [122, 20, 1], [125, 20, 1], [125, 13, 1], [129, 13, 1], [129, 6, 3], [136, 6, 1], [136, 11, 0]], { name: 'the Walk: the Nexus to the East Mouth' }],
        ['area', 97, 27, 104, 34, 'g', 0], ['label', 100.5, 31, 'THE FLAT', 'place'], ['label', 100.5, 32.2, 'level, a board fits', 'note'],
        ['area', 128, 29, 131, 34, 'g', -1], ['label', 129.5, 31.6, 'THE HOLLOW', 'place'],
        ['area', 135, 12, 137, 12, 'c', 0],
        /* ── THIN TRAILS (1 square) ── */
        ['thin', [[40, 4, 1], [40, 2, 1], [36, 2, 0]], { to: 'Göbekli Tepe by the Sentinel: the north way onto the tell (another district)' }],
        ['area', 49, 16, 57, 16, 'g', 1], ['thin', [[53, 11, 3], [53, 16, 1]], { to: 'the north Niches: the shrines of the old places, on the cut\'s bank' }], ['label', 53, 14.6, 'THE NICHES', 'mark'],
        ['thin', [[38, 21, 0], [38, 25, 0]], { to: 'the Forks and the South Bank, by the Dry Field and the Low Ground: the second way east, SOUTH of the Line' }],
        ['area', 36, 26, 44, 34, 'g', 0], ['label', 40, 30, 'THE DRY FIELD', 'place'], ['label', 40, 31.2, 'open · level, a board fits', 'note'],
        ['thin', [[45, 30, 0], [52, 30, -1], [52, 27, -1], [59, 27, 1]], { cont: true }], ['area', 49, 21, 57, 21, 'g', 1], ['thin', [[52, 26, -1], [52, 21, 1]], { to: 'the south Niches, up out of the Low Ground' }],
        ['thin', [[70, 4, 4], [75, 4, 2], [75, 8, 2]], { to: 'a secret: the Lone Stone, north of the Great Line' }], ['area', 74, 9, 78, 11, 'g', 2], ['set', 76, 10, 'k', 2], ['label', 76, 8.2, 'lone stone', 'note'],
        ['thin', [[90, 23, 0], [90, 28, -1], [93, 28, -1]], { to: 'a secret: where the south fork dies in the low ground (the Fork\'s End)' }], ['area', 91, 29, 95, 33, 'g', -1], ['label', 93, 31, 'fork\'s end', 'note'],
        ['thin', [[84, 31, -2], [90, 31, -1]], { to: 'the Nexus from the Sink, by the Fork\'s End (the second way)' }],
        ['thin', [[108, 14, 1], [113, 14, 2]], { to: 'the east Forks: the bank over the deep cut, under the High Stone' }], ['area', 113, 12, 116, 13, 'g', 2], ['area', 114, 14, 116, 15, 'g', 2],
        ['thin', [[127, 6, 3], [127, 4, 3], [120, 4, 5], [120, 6, 5], [116, 6, 5]], { to: 'the High Stone: the highest ground on the Line, the watch tower (the lookout)' }],
        ['area', 108, 1, 115, 8, 'g', 5], ['area', 116, 1, 119, 5, 'g', 5], ['area', 117, 1, 118, 2, 'k', 5], ['area', 112, 9, 114, 11, 'g', 5],
        ['label', 111.5, 4, 'THE HIGH STONE', 'place'], ['label', 111.5, 5.2, 'open top · a board fits', 'note'], ['label', 118, 0.6, 'watch tower', 'note'],
        ['thin', [[140, 21, 0], [140, 26, 0], [136, 26, 0], [136, 30, 0]], { to: 'a secret: the last niche, south of the East Mouth' }], ['area', 134, 31, 138, 33, 'g', 0],
    ],
    doors: [[0, 31, 'W', 'the Delta Causeway (to Giza)', 0], [30, 35, 'S', 'Bug Colony', 0], [143, 18, 'E', 'Babel + Technoticlan', 0]],
    landmarks: [
        { name: 'Göbekli Tepe (the tell)', at: [17, 16], tall: 5 }, { name: 'The Nexus ring', at: [90, 18], tall: 4 }, { name: 'The Niches', at: [53, 16], tall: 2 },
        { name: 'The Watch Tower', at: [117, 1], tall: 4 }, { name: 'The Lone Stone', at: [76, 10], tall: 3 }],
    lookouts: [{ name: 'the High Stone', at: [110, 7], sees: 'The Nexus ring', next: 'G' }, { name: 'the North Knoll', at: [71, 10], sees: 'The Nexus ring', next: 'G' }],
    found: [
        { name: 'the root steps out of the Sink', from: [79, 30], to: [72, 28], kind: 'climb' },
        { name: 'the broken kerb by the Niches', from: [54, 16], to: [53, 11], kind: 'climb' },
        { name: 'the chimney under the High Stone', from: [113, 13], to: [113, 11], kind: 'climb' }],
    flats: [
        { name: 'The West Mouth', rect: [36, 13, 43, 20], why: 'the paved mouth where the Line starts', board: true },
        { name: 'The Dry Field', rect: [36, 26, 44, 34], why: 'an open field', board: true },
        { name: 'The North Knoll', rect: [62, 1, 69, 8], why: 'the knoll\'s open top', board: true },
        { name: 'The Nexus', rect: [86, 14, 94, 22], why: 'the ring on the Line', board: true },
        { name: 'The Flat', rect: [97, 27, 104, 34], why: 'an open field', board: true },
        { name: 'The High Stone', rect: [108, 1, 115, 8], why: 'the open top of the highest ground', board: true },
        { name: 'The East Mouth', rect: [136, 13, 143, 20], why: 'the paved mouth where the Line leaves', board: true }],
    buildings: [
        { name: 'The Rest House (new; ancient stone)', rect: [45, 13, 47, 15], door: 'W', tall: 2, inside: 'one round dry-stone room in the style of Göbekli Tepe\'s enclosures: stone benches, a hearth, an offering table' },
        { name: 'The Watch Tower (new; ancient stone)', rect: [117, 1, 118, 2], door: 'S', tall: 4, inside: 'a round dry-stone tower of the same early builders: a stair inside, the open top is the lookout' }],
    picture: { S: 13 },
    pictures: [{ suffix: 'west', x0: 34, x1: 97, S: 24, title: 'THE LEY LINE, WEST HALF: the West Mouth, the North Knoll, the slab over the cut, the Sink, the Nexus' },
        { suffix: 'east', x0: 84, x1: 143, S: 24, title: 'THE LEY LINE, EAST HALF: the Nexus, the Shoulder, the Flat, the High Stone, the Hollow, the East Mouth' }],
};
