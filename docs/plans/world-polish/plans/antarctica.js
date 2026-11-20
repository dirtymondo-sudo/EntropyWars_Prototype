/* THREAD 13, ANTARCTICA: THE HEIGHT PLAN, laid OVER THE ROOM AS IT STANDS (`underlay`).
   mondo 2026-11-20: "you can make a plan for antarctica, or just improve upon what's already there". The room has its height (sea 1,
   station 4 to 6, the crevasse field 10, the Ice Wall 35 m sheer, the hull behind it). So this plan IMPROVES WHAT IS THERE: the grey
   squares are today's real ground, read from the room; the plan adds the ways, the stairs, the places and the landmarks.
   APPROVED by mondo 2026-11-20 ("yep looks good"). Nothing is built from it yet: its build thread starts here.
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/antarctica.js
   WHAT IS WRONG TODAY: one walk straight north up one column of plots (the Pier, the Yard, the Huts, the Plank, the Gap, the Hull),
   and empty one-colour fields with nothing to steer by.
   THE IDEA.
   - THE TRAVERSE (main, flag-lined) snakes: the Landing, the Station Yard, east round the Radio Mast, west behind the Huts, up the
     slope by a stepped switchback, over the ICE BRIDGE in the far west, back east along the Wall's foot, through the GAP to the Hull.
   - THE PLANK stays: the straight, daring short cut (a thin trail). THE SNOW BRIDGE is the east way.
   - THE ICE WALL IS CLIMBED: a west stair and an east stair cut in its face, a WALK ON TOP (20 levels up) that zigzags the whole
     width and bridges the Gap, a north stair down to the Hull, and the icefall in the far east as the way you find.
   - LANDMARKS so each field reads: the berg, the mast on its rise, a pressure ridge, the watch post, the blue ice, the hull's trench.
   Levels: 0 = the sea. One level = 1.75 m. The Wall's top is level 31. */
'use strict';
const top = [[6, 13], [14, 13], [14, 15], [22, 15], [22, 13], [28, 13]].map(q => [q[0], q[1], 31]);
const top2 = [[34, 13], [42, 13], [42, 15], [50, 15], [50, 13], [58, 13], [58, 15], [66, 15]].map(q => [q[0], q[1], 31]);
module.exports = {
    approved: 'mondo 2026-11-20, shown the four plans and their pictures in chat: "yep looks good"',
    zone: 'Antarctica', thread: 13, room: 'site_prebuilt_antarctica_plots', underlay: { deep: 4 },
    title: 'ANTARCTICA: THE HEIGHT PLAN over the room as it stands',
    build: { frame: 'room', file: 'docs/areas/antarctica/districts/room.js (new: the room design, in the room\'s own frame)' },
    mass: 'the Ice Wall, the crevasse, the open sea (closed)', massHeight: 0,
    tiles: { ' ': ['closed: the Ice Wall, the crevasse, the sea', false, [34, 60, 92], [34, 60, 92]], u: ['snow and ice as they stand today (read from the room)', true, [120, 140, 160], [236, 244, 252]],
        r: ['THE ICE WALL (35 m sheer)', false, [150, 205, 235], [150, 205, 235]] },
    grid: { w: 72, h: 72, n: 12 }, start: [40, 67],
    districts: { F: { name: 'The Shelf Ice', color: '#6fb7ff' }, S: { name: 'The Station', color: '#ffb347' }, O: { name: 'The Polar Openings', color: '#ff6b6b' },
        C: { name: 'The Crevasse', color: '#b58cff' }, W: { name: 'The Ice Wall', color: '#ffffff' }, H: { name: 'The Hull in the Ice', color: '#5dff8a' } },
    plots: [
        [0, 0, 'The Drift', 'H', 12, 12], [1, 0, 'The Dig Camp', 'H', 11, 11], [2, 0, 'The Hull in the Ice', 'H', 10, 8, { relief: 'the hull lies in a dug trench, 2 levels down' }], [3, 0, 'The Collar', 'H', 10, 10, { flat: 'the airlock\'s apron' }], [4, 0, 'The Survey Line', 'H', 11, 11], [5, 0, 'The Blue Ice', 'H', 12, 12, { flat: 'a field of blue ice' }],
        [0, 1, 'The Ice Wall, far west', 'W', 11, 11], [1, 1, 'The Ice Wall, west', 'W', 11, 12, { relief: 'a drift banked against the wall; the west stair' }], [2, 1, 'The Gap', 'W', 11, 11], [3, 1, 'The Ice Wall', 'W', 11, 11, { flat: 'the watch post\'s ground' }], [4, 1, 'The Ice Wall, east', 'W', 11, 12, { relief: 'the east stair' }], [5, 1, 'The Ice Wall, far east', 'W', 11, 13, { relief: 'the icefall: fallen blocks heaped against the wall' }],
        [0, 2, 'The Ice Bridge', 'C', 10, 9], [1, 2, 'The Crevasse, west', 'C', 10, 10], [2, 2, 'The Plank', 'C', 10, 10], [3, 2, 'The Crevasse', 'C', 10, 11, { relief: 'a pressure ridge' }], [4, 2, 'The Snow Bridge', 'C', 10, 10], [5, 2, 'The Crevasse, east', 'C', 10, 9],
        [0, 3, 'The Admiral\'s Tunnel', 'O', 6, 8, { relief: 'the portal\'s bank' }], [1, 3, 'The Ice Core', 'S', 6, 6], [2, 3, 'The Huts', 'S', 6, 6, { flat: 'the huts stand on it' }], [3, 3, 'The Radio Mast', 'S', 6, 7, { relief: 'the mast\'s rise' }], [4, 3, 'The Garage', 'S', 6, 6], [5, 3, 'The Polar Opening', 'O', 6, 6],
        [0, 4, 'The Fuel Drums', 'O', 4, 4, { flat: 'the fuel dump' }], [1, 4, 'The Tank Farm', 'S', 4, 4], [2, 4, 'The Station Yard', 'S', 4, 4, { flat: 'the yard: level, a board fits' }], [3, 4, 'The Flag Line', 'S', 4, 4, { flat: 'the flag line' }], [4, 4, 'The Weather Field', 'S', 4, 5], [5, 4, 'The East Berm', 'O', 4, 6, { relief: 'a snow berm' }],
        [0, 5, 'The Shelf Ice', 'F', 1, 2], [1, 5, 'The Seal Beach', 'F', 1, 1], [2, 5, 'The Ice Pier', 'F', 1, 1], [3, 5, 'The Landing', 'F', 1, 1, { flat: 'the landing: level, a board fits' }], [4, 5, 'The Floes', 'F', 1, 1], [5, 5, 'The Calving Face', 'F', 1, 3, { relief: 'the berg' }]],
    steps: [
        /* ── THE ICE WALL: its body (closed, top 31), the Gap grown to 3 squares, the walk on top ── */
        ['area', 0, 12, 71, 17, 'r', 31], ['area', 30, 12, 32, 17, 'u', 11], ['label', 46, 12.2, 'THE ICE WALL · the walk on top (level 31)', 'mark'], ['label', 31, 15, 'GAP', 'note'],
        ['lane', top, { to: 'THE WALK ON TOP of the Ice Wall: from the west stair right across to the east stair, over the Gap by an ice arch (lookouts; a north stair goes down to the Hull)' }], ['lane', top2, { cont: true }],
        /* ── THE TRAVERSE (main, 3 squares, flag-lined) ── */
        ['area', 41, 60, 48, 67, 'c', 1], ['label', 44.5, 63, 'THE LANDING', 'place'], ['label', 44.5, 64.2, 'level, a board fits', 'note'],
        ['area', 24, 48, 31, 55, 'g', 4], ['label', 27.5, 50, 'THE STATION YARD', 'place'], ['label', 27.5, 51.2, 'level, a board fits', 'note'],
        ['main', [[40, 67, 1], [33, 67, 1], [33, 61, 2], [29, 61, 2], [29, 54, 4], [35, 54, 4], [35, 50, 4], [39, 50, 4], [39, 45, 5], [31, 45, 5], [31, 37, 6], [26, 37, 6]], { name: 'the Traverse: the Landing, the Yard, round the mast, behind the huts' }],
        ['main', [[26, 37, 6], [21, 37, 7], [21, 35, 7], [16, 35, 8], [16, 33, 8], [9, 33, 9], [9, 27, 10], [4, 27, 10], [4, 21, 11], [11, 21, 11], [11, 19, 11], [18, 19, 12], [18, 22, 12], [25, 22, 11], [25, 20, 11], [31, 20, 11], [31, 12, 11]], { name: 'the Traverse: the stepped climb, the Ice Bridge, the Wall\'s foot, the Gap' }],
        ['label', 9, 30.6, 'ICE BRIDGE', 'mark'],
        ['main', [[31, 10, 11], [36, 10, 10], [36, 5, 10]], { name: 'the Traverse: behind the Wall to the Collar' }],
        ['area', 35, 1, 42, 8, 'c', 10], ['area', 38, 9, 38, 11, 'c', 10], ['label', 38.5, 3, 'THE COLLAR', 'place'], ['label', 38.5, 4.2, 'the airlock\'s apron · a board fits', 'note'],
        /* the hull's trench (2 levels down) */
        ['area', 26, 3, 31, 6, 'm', 8], ['label', 28.5, 2.2, 'THE HULL · in its trench', 'mark'],
        ['thin', [[25, 5, 8], [18, 5, 11]], { to: 'the hull\'s trench: the ramp the diggers cut down to the hull' }],
        /* ── THIN TRAILS ── */
        ['thin', [[33, 36, 6], [38, 36, 8], [38, 34, 8], [33, 34, 10], [33, 28, 10], [31, 28, 10], [31, 21, 11]], { to: 'the Gap, straight over THE PLANK: the short, daring way (the Traverse goes round by the Ice Bridge)' }], ['label', 33, 30.6, 'THE PLANK', 'mark'],
        ['thin', [[51, 37, 6], [56, 37, 8], [56, 35, 8], [61, 35, 10], [61, 28, 10], [58, 28, 10], [58, 21, 11], [60, 21, 11], [60, 18, 11]], { to: 'the Ice Wall\'s east stair, over THE SNOW BRIDGE: the second way north from the Garage' }], ['label', 60, 31, 'SNOW BRIDGE', 'mark'],
        ['thin', [[53, 66, 1], [58, 66, 1], [58, 62, 1], [63, 62, 3]], { to: 'the Calving Face: the berg over the sea (a lookout; Pirates\' Cove\'s boat lands under it)' }], ['area', 64, 61, 68, 65, 'g', 3], ['label', 66, 60.4, 'THE BERG', 'mark'],
        /* the Cove's landing under the berg: today its squares are cut off from the rest of the ice (the tool found it); a cut step joins them */
        ['area', 61, 65, 63, 70, 'g', 1], ['label', 62, 68, 'Cove landing', 'door'],
        ['thin', [[28, 69, 1], [22, 69, 1], [22, 65, 1]], { to: 'Babel (another zone): the way out by the Seal Beach' }],
        ['thin', [[13, 43, 6], [6, 43, 6], [6, 38, 8], [4, 38, 8]], { to: 'the Admiral\'s Tunnel (down to Agartha)' }], ['area', 1, 37, 4, 40, 'g', 8], ['label', 3, 37.4, 'TUNNEL', 'mark'],
        ['thin', [[52, 44, 6], [59, 44, 6], [59, 41, 6], [66, 41, 6], [66, 40, 6], [70, 40, 6]], { to: 'the Polar Opening (the way down to the Inner Sun)' }],
        ['thin', [[29, 8, 11], [24, 8, 11], [24, 10, 11], [17, 10, 11], [17, 8, 11], [11, 8, 12]], { to: 'the Dig Camp and the Drift: the hull\'s west end' }], ['area', 7, 6, 10, 9, 'g', 12], ['label', 8.5, 5.4, 'THE DRIFT', 'place'],
        ['thin', [[41, 7, 10], [46, 7, 10], [46, 9, 10], [53, 9, 11], [53, 6, 11], [59, 6, 12]], { to: 'the Blue Ice, along the survey stakes' }], ['area', 60, 2, 67, 9, 'g', 12], ['label', 63.5, 5, 'THE BLUE ICE', 'place'], ['label', 63.5, 6.2, 'level, a board fits', 'note'],
        /* the station's buildings, as they stand */
        ['area', 19, 40, 24, 42, 'k', 6], ['area', 25, 40, 28, 42, 'k', 6], ['area', 34, 38, 37, 40, 'k', 6], ['area', 46, 38, 51, 41, 'k', 6], ['area', 14, 38, 16, 40, 'k', 6], ['area', 14, 51, 16, 53, 'k', 4], ['area', 46, 51, 48, 53, 'k', 4],
        ['label', 24, 39.4, 'THE HUTS', 'mark'], ['label', 48.5, 37.4, 'garage', 'note'], ['label', 38, 42.4, 'RADIO MAST', 'mark'],
        /* places with their own shape */
        ['area', 40, 37, 43, 39, 'g', 7], ['label', 42, 36.4, 'the mast\'s rise', 'note'],
        ['area', 62, 50, 67, 55, 'g', 6], ['label', 64.5, 52.6, 'THE EAST BERM', 'place'],
        ['area', 40, 24, 44, 26, 'g', 11], ['label', 42, 23.4, 'pressure ridge', 'note'],
        ['area', 38, 18, 45, 25, 'g', 11], ['label', 41.5, 20, 'THE WATCH POST', 'place'], ['label', 41.5, 21.2, 'level, a board fits', 'note'],
        ['area', 65, 18, 69, 20, 'g', 13], ['label', 67, 21.4, 'THE ICEFALL', 'mark'],
    ],
    /* the stairs cut in the Wall (real stair pieces): west, east, and north down to the Hull; the ice arch over the Gap */
    stairs: [[[18, 18], [18, 16]], [[60, 18], [60, 16]], [[38, 11], [38, 13]]],
    bridges: [[[28, 13], [34, 13]], [[28, 14], [34, 14]]],
    doors: [[37, 0, 'N', 'the Spaceship (the airlock)', 10], [71, 40, 'E', 'the Cavern (the Polar Opening)', 6]],
    landmarks: [
        { name: 'The Berg', at: [66, 63], tall: 2 }, { name: 'The Radio Mast', at: [38, 41], tall: 12 }, { name: 'The Admiral\'s Tunnel', at: [2, 40], tall: 2 }, { name: 'The Polar Opening\'s steam', at: [69, 40], tall: 4 },
        { name: 'The Lowering Rig', at: [42, 27], tall: 3 }, { name: 'The Ice Wall', at: [40, 17], tall: 0 }, { name: 'The Watch Post', at: [40, 22], tall: 3 }, { name: 'The Hull in the Ice', at: [29, 4], tall: 5 }],
    lookouts: [
        { name: 'the Berg', at: [66, 62], sees: 'The Radio Mast', next: 'S' }, { name: 'the mast\'s rise', at: [41, 37], sees: 'The Ice Wall', next: 'C' },
        { name: 'the East Berm', at: [64, 51], sees: 'The Polar Opening\'s steam', next: 'F' }, { name: 'the north lip by the Plank', at: [33, 28], sees: 'The Ice Wall', next: 'W' },
        { name: 'the walk on top of the Wall, south edge', at: [44, 16], sees: 'The Watch Post', next: 'S' }, { name: 'the walk on top of the Wall, north edge', at: [36, 13], sees: 'The Ice Wall', next: 'H' }, { name: 'the Drift', at: [9, 8], sees: 'The Hull in the Ice', next: 'W' }],
    found: [
        { name: 'the berg\'s back steps', from: [63, 66], to: [64, 65], kind: 'climb' },
        { name: 'the packed drift behind the huts', from: [30, 48], to: [30, 46], kind: 'climb' }, { name: 'the cable ladder up the mast\'s rise', from: [36, 44], to: [40, 39], kind: 'ladder' },
        { name: 'the snow bank under the tunnel', from: [5, 50], to: [3, 40], kind: 'climb' },
        { name: 'the ice screws through the crack', from: [50, 34], to: [50, 27], kind: 'climb' }, { name: 'the ridge\'s broken edge', from: [39, 26], to: [40, 26], kind: 'climb' },
        { name: 'the icefall\'s blocks', from: [64, 21], to: [66, 20], kind: 'ledge chain' }, { name: 'THE ICEFALL: the found way up the Wall', from: [66, 18], to: [66, 16], kind: 'climb' },
        { name: 'the ladder out of the hull\'s trench', from: [28, 6], to: [28, 7], kind: 'ladder' }, { name: 'the crust of the Drift', from: [36, 9], to: [10, 8], kind: 'climb' }],
    flats: [
        { name: 'The Landing', rect: [41, 60, 48, 67], why: 'the landing off the pier', board: true }, { name: 'The Station Yard', rect: [24, 48, 31, 55], why: 'the yard between the huts and the tanks', board: true },
        { name: 'The Fuel Drums', rect: [1, 49, 8, 56], why: 'the fuel dump: level ice' }, { name: 'The open ice north of the Plank', rect: [26, 24, 36, 27], why: 'open ice: the crack is the feature' },
        { name: 'The Watch Post', rect: [38, 18, 45, 25], why: 'the watch post\'s ground under the Wall', board: true }, { name: 'The Collar', rect: [35, 1, 42, 8], why: 'the airlock\'s apron', board: true },
        { name: 'The Blue Ice', rect: [60, 2, 67, 9], why: 'a field of blue ice', board: true }],
    buildings: [
        { name: 'The Bunkhouse', rect: [19, 40, 24, 42], door: 'S', tall: 2, inside: 'bunks, lockers, a stove (it stands today)' }, { name: 'The Mess', rect: [25, 40, 28, 42], door: 'S', tall: 2, inside: 'a galley and one long table (it stands today)' },
        { name: 'The Radio Hut', rect: [34, 38, 37, 40], door: 'S', tall: 2, inside: 'radio sets, charts, a cot (it stands today)' }, { name: 'The Garage', rect: [46, 38, 51, 41], door: 'S', tall: 3, inside: 'a tracked vehicle bay, a workbench, fuel cans (it stands today)' },
        { name: 'The Ice Core Lab', rect: [14, 38, 16, 40], door: 'S', tall: 2, inside: 'core racks, a drill head, sample freezers (it stands today)' }, { name: 'The Power Hut', rect: [14, 51, 16, 53], door: 'E', tall: 2, inside: 'generators, a fuel line (it stands today)' },
        { name: 'The Balloon Shed', rect: [46, 51, 48, 53], door: 'W', tall: 3, inside: 'a weather balloon bay, gas bottles (it stands today)' }],
    picture: { S: 24 },
};
