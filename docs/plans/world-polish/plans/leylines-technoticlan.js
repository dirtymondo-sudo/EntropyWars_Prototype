/* THREAD 12, LEYLINES: TECHNOTICLAN'S PLAN, laid OVER THE ROOM AS IT STANDS (`underlay`), in the room it shares with Babel.
   APPROVED by mondo 2026-11-20 ("looks good"). Nothing is built from it yet. DATA ONLY (the format: plans/README.md).
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/leylines-technoticlan.js
   mondo 2026-11-20: "Tecnoticlan can stay straight bc it's more architecture than dungeon or passageways". So THE CAUSEWAYS STAY
   STRAIGHT and the lake city keeps its one water level: its height is its monuments (the Pyramid 12, the Round Tower 4, the
   Ball Court's walls 2). This plan does NOT wind anything. It gives the city what it lacks:
   - WAYS WIDE ENOUGH TO READ: the North Causeway (one square wide today) and the Precinct Road over the canal become 3 squares.
   - THE BALL COURT IS SUNK one level between its walls, as a real court is, with a step down at each end.
   - BUILDINGS YOU WALK INTO (ancient: stone and plaster, flat roofs): a Market Hall on the precinct's north side, the Shrine on the
     Pyramid's top, the Round Tower.
   - The Ball Court's north side is cut off from the rest of the city today (the tool found it): a stepping stone joins it.
   BABEL (the north half of the room) has its own plan, plans/leylines-babel.js: drawn here as it stands. Levels: 0 = the lake city. */
'use strict';
const B = 'Babel has its own plan (plans/leylines-babel.js)', R = 'the route kit\'s trail: its squares stay as they are', lake = 'a lake city on one water level: its height is its monuments (architecture; mondo 11-20)';
const cz = 'a city causeway: straight on purpose (mondo 11-20: "Tecnoticlan can stay straight bc it\'s more architecture")';
module.exports = {
    approved: 'mondo 2026-11-20, shown the plan and its picture in chat: "looks good"',
    zone: 'Leylines', thread: 12, room: 'site_prebuilt_gobekli_ow_babel', underlay: { deep: 6 },
    title: 'LEYLINES, TECHNOTICLAN: the lake city, THE PLAN over the room as it stands',
    build: { frame: 'room', file: 'docs/areas/leylines/districts/Z-room.js (new: the room design, in the room\'s own frame)' },
    mass: 'closed', massHeight: 0,
    tiles: { u: ['the city as it stands today (read from the room)', true, [110, 120, 96], [222, 228, 200]] },
    grid: { w: 84, h: 96, n: 12 }, start: [41, 58],
    districts: { T: { name: 'Babel (its own plan)', color: '#f2c14e', skip: B }, R: { name: 'the trail (the route kit\'s)', color: '#9a9a9a', skip: R }, Z: { name: 'Technoticlan', color: '#6fb7ff', flat: lake } },
    plots: [
        [3, 0, 'The Brick Stacks', 'T', 0, 0, { flat: B }], [4, 0, 'The Tower, north-west', 'T', 0, 0, { flat: B }], [5, 0, 'The North Stair', 'T', 0, 0, { flat: B }], [6, 0, 'The Crane', 'T', 0, 0, { flat: B }],
        [3, 1, 'The Kiln', 'T', 0, 0, { flat: B }], [4, 1, 'The Tower', 'T', 0, 0, { flat: B }], [5, 1, 'The Tower, east', 'T', 0, 0, { flat: B }], [6, 1, 'The Workers\' Town', 'T', 0, 0, { flat: B }],
        [3, 2, 'The Clay Pits', 'T', 0, 0, { flat: B }], [4, 2, 'The Tower, south-west', 'T', 0, 0, { flat: B }], [5, 2, 'The South Face', 'T', 0, 0, { flat: B }], [6, 2, 'The Barn Door', 'T', 0, 0, { flat: B }],
        [3, 3, 'The trail, the well', 'R', 0, 0, { flat: R }], [3, 4, 'The trail, the bee yard', 'R', 0, 0, { flat: R }],
        [0, 5, 'The Garden Islets', 'Z', 0, 0, { flat: lake }], [1, 5, 'The Ball Court', 'Z', 0, 0, { relief: 'the playing alley sunk one level between its walls' }], [2, 5, 'The North Causeway', 'Z', 0, 0, { flat: lake }], [3, 5, 'The Pyramid, north', 'Z', 0, 0, { flat: lake }], [4, 5, 'The Lake', 'Z', 0, 0, { flat: lake }],
        [0, 6, 'The Causeway', 'Z', 0, 0, { flat: lake }], [1, 6, 'The West Gate', 'Z', 0, 0, { flat: lake }], [2, 6, 'The Canal', 'Z', 0, 0, { flat: lake }], [3, 6, 'The Pyramid', 'Z', 0, 0, { flat: 'the Pyramid, as built: a monument is not lifted' }], [4, 6, 'The Pyramid, east', 'Z', 0, 0, { flat: lake }],
        [0, 7, 'The Reeds', 'Z', 0, 0, { flat: lake }], [1, 7, 'The Round Tower', 'Z', 0, 0, { flat: lake }], [2, 7, 'The Portcullis', 'Z', 0, 0, { flat: lake }], [3, 7, 'The Pyramid, south', 'Z', 0, 0, { flat: lake }], [4, 7, 'The Lake, south', 'Z', 0, 0, { flat: lake }]],
    steps: [
        ['label', 59.5, 17, 'BABEL: its own plan', 'note'], ['label', 47, 78, 'THE PYRAMID', 'mark'], ['label', 47, 80.4, 'as built · the Shrine on top', 'note'], ['label', 19, 86, 'ROUND TOWER', 'mark'], ['label', 6, 78, 'THE GARDEN ISLETS', 'place'],
        /* THE NORTH CAUSEWAY, 3 squares wide (one today), from the trail into the precinct */
        ['main', [[41, 61, 0], [33, 61, 0], [33, 66, 0]], { name: 'the North Causeway: from the trail into the city (widened to 3 squares)' }], ['label', 33, 62.6, 'N. CAUSEWAY', 'note'],
        /* THE PRECINCT ROAD: from the Pyramid's west stair, over the canal's middle bridge, to the Ball Court. Straight on purpose. */
        ['main', [[37, 79, 0], [22, 79, 0], [22, 75, 0]], { name: 'the Precinct Road: the Pyramid to the Ball Court over the canal', straight: true, why: cz }], ['label', 27, 77.4, 'bridge', 'note'],
        /* THE BALL COURT: the alley sunk one level between its two walls, a step down at each end */
        ['area', 16, 69, 25, 71, 'c', -1], ['label', 20.5, 70.4, 'THE BALL COURT · sunk', 'mark'],
        /* the Market Hall on the precinct's north side (new), the precinct's open plaza south of it */
        ['area', 36, 63, 43, 70, 'c', 0], ['label', 39.5, 66, 'THE MARKET QUAY', 'place'], ['label', 39.5, 67.2, 'level, a board fits', 'note'],
        ['area', 15, 74, 22, 81, 'c', 0], ['label', 18.5, 76.4, 'THE WEST SQUARE', 'place'],
        ['area', 44, 66, 49, 68, 'k', 0], ['label', 46.5, 65.6, 'MARKET HALL', 'mark'], ['label', 46, 89.6, 'THE SOUTH PLAZA · open, level', 'place'],
        /* thin ways (one square), over what stands */
        ['thin', [[14, 65, 0], [14, 65, 0]], { to: 'the Garden Islets from the Ball Court\'s north side (a stepping stone: that side is cut off today)' }],
        ['thin', [[20, 81, 0], [20, 83, 0]], { to: 'the Round Tower (a stair inside to its top: the west lookout)' }],
        ['thin', [[40, 91, 0], [43, 91, 0]], { to: 'the two ways out on the south plaza: the Harbour and Antarctica (other zones)' }],
    ],
    /* stairs that stand today (the Pyramid's west flight, the Round Tower's) and the Ball Court's two new end steps */
    stairs: [[[38, 78], [45, 78]], [[20, 83], [20, 86]], [[15, 70], [16, 70]], [[26, 70], [25, 70]]],
    doors: [[0, 66, 'W', 'Bug Colony', 0]],
    landmarks: [{ name: 'The Pyramid\'s Shrine', at: [48, 79], tall: 3 }, { name: 'The Round Tower', at: [20, 87], tall: 4 }, { name: 'The Ball Court\'s rings', at: [20, 68], tall: 2 }, { name: 'The Market Hall', at: [46, 67], tall: 3 }],
    lookouts: [{ name: 'the Pyramid\'s top', at: [46, 78], sees: 'The Round Tower' }, { name: 'the Round Tower\'s top', at: [20, 88], sees: 'The Pyramid\'s Shrine' }],
    found: [{ name: 'the court wall\'s broken end', from: [16, 70], to: [16, 68], kind: 'climb' }],
    flats: [{ name: 'The South Plaza', rect: [38, 87, 55, 92], why: 'the precinct\'s open plaza: level' }, { name: 'The Market Quay', rect: [36, 63, 43, 70], why: 'the paved quay by the Market Hall (two rows of it are new, built out over the water)', board: true }, { name: 'The West Square', rect: [15, 74, 22, 81], why: 'the square between the Ball Court and the Round Tower', board: true },
        { name: 'The Ball Court', rect: [16, 69, 25, 71], why: 'the playing alley' }],
    buildings: [
        { name: 'The Market Hall (new; ancient: stone and plaster, a flat roof)', rect: [44, 66, 49, 68], door: 'S', tall: 3, inside: 'one long hall open to the south: stalls, baskets, jars, a tally stone' }],
    picture: { S: 20, y0: 48 },
};
