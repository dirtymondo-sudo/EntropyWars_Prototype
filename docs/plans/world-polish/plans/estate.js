/* THREAD 17, THE ESTATE: THE HEIGHT PLAN of its big room (the Corn Fields, County Lane, the Lake, the Ranch), square by square.
   A PROPOSAL: nothing is built from it until mondo says so. DATA ONLY (the format: plans/README.md).
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/estate.js
   THE IDEA. Today the room is level: corn 1, the lane and the lake 0, the ranch 1 (3.5 m over 47 plots).
   - THE CORN FIELDS stay LEVEL ON PURPOSE (fields). The corn is the wall: the Farm Track winds through it and crosses County Lane
     three times; thin tracks branch off. One knoll, the Scarecrow's Rise, is the only place you see over the corn.
   - COUNTY LANE and its fields (the route kit's, R7) are NOT TOUCHED: drawn here as they stand, so the walks join up.
   - THE LAKE lies low in a bowl: a high WEST BANK and a BLUFF (2 new plots) over the water, the shore walk west, the boathouse way east.
   - THE RANCH becomes ranch country: the barn in a HOLLOW (0), the yard and paddock level (1), the south beach where the walk dips to the water (0), the farmhouse on a low RISE (2), the
     DRAW with the creek cut (3), the hay field (3), and a RIDGE with the fence line behind it all (4 to 6, 4 new plots).
   The Haunted House's room is a model and is left as it is: no plan.
   Levels: 0 = the lane and the lake shore today. One level = 1.75 m. */
'use strict';
const corn = 'a corn field: level on purpose', route = 'the route kit\'s (County Lane, R7 / the Ranch Road): its squares stay as they are';
const lane = []; for (const y of [72, 73]) for (let x = 10; x <= 13; x++) lane.push(['ramp', x, y, y === 72 ? 0.75 : 0.25, 0, -1, 'P']);
module.exports = {
    zone: 'The Estate', thread: 17, room: 'site_prebuilt_skinwalker_ow_lake',
    title: 'THE ESTATE: the Corn Fields, the Lake and the Ranch, THE HEIGHT PLAN (a proposal)',
    build: { frame: 'room', file: 'docs/areas/estate/districts/room.js (new: the room design, in the room\'s own frame)' },
    grows: 'the box stays 5 x 18 plots (no door moves); 8 new plots in empty cells of the box, west of the Lake and the Ranch',
    mass: 'corn, brush and fence rows (the wall of the place)', massHeight: 2,
    grid: { w: 60, h: 216, n: 12 }, start: [6, 1],
    districts: {
        C: { name: 'The Corn Fields', color: '#f2c14e', flat: corn }, N: { name: 'County Lane + its fields (not this plan\'s)', color: '#9a9a9a', skip: route },
        L: { name: 'The Lake', color: '#6fb7ff' }, R: { name: 'The Ranch', color: '#ff8a5c' } },
    plots: [
        [0, 0, 'The Woods Gate', 'C', 1, 1, { flat: corn }], [1, 0, 'County Lane, the hay stack', 'C', 1, 1, { flat: corn }],
        [0, 1, 'The Tall Corn', 'C', 1, 1, { flat: corn }], [1, 1, 'The Scarecrow', 'C', 1, 1, { relief: 'the Scarecrow\'s Rise, a knoll 2 levels over the corn' }],
        [0, 2, 'The Circles, west', 'C', 1, 1, { flat: corn }], [1, 2, 'The Circles', 'C', 1, 1, { flat: 'a crop circle: flattened corn' }],
        [0, 3, 'The Farm Track', 'C', 1, 1, { flat: corn }], [1, 3, 'County Lane, the bee yard', 'C', 1, 1, { flat: corn }],
        [0, 4, 'The Rows, west', 'C', 1, 1, { flat: corn }], [1, 4, 'The Rows, east', 'C', 1, 1, { flat: corn }],
        [0, 5, 'The Hub', 'C', 1, 1, { flat: 'the well\'s yard' }], [1, 5, 'County Lane, the rest', 'C', 1, 1, { flat: corn }],
        [2, 5, 'County Lane, the boundary stone', 'N', 0, 0, { flat: route }], [3, 5, 'County Lane, the rest (east)', 'N', 0, 0, { flat: route }],
        [0, 6, 'County Lane, the fire watch sign', 'N', 0, 0, { flat: route }], [1, 6, 'County Lane, the bench', 'N', 0, 0, { flat: route }], [2, 6, 'County Lane, the lone scarecrow', 'N', 0, 0, { flat: route }], [3, 6, 'County Lane, the bee yard (east)', 'N', 0, 0, { flat: route }],
        [1, 7, 'The trail, the wayside cross', 'N', 0, 0, { flat: route }], [2, 7, 'County Lane, the scarecrow row', 'N', 0, 0, { flat: route }], [3, 7, 'County Lane, the camp', 'N', 0, 0, { flat: route }],
        [1, 8, 'The trail, the lone scarecrow', 'N', 0, 0, { flat: route }], [2, 8, 'County Lane, the hay stack (south)', 'N', 0, 0, { flat: route }], [3, 8, 'County Lane, the carved pole', 'N', 0, 0, { flat: route }],
        [1, 9, 'The trail, the plough', 'N', 0, 0, { flat: route }], [2, 9, 'County Lane, the old jetty', 'N', 0, 0, { flat: route }], [3, 9, 'County Lane, the stranded boat', 'N', 0, 0, { flat: route }],
        [1, 10, 'The trail, the marker stones', 'N', 0, 0, { flat: route }],
        [2, 10, 'The Reeds', 'L', 0, 0], [3, 10, 'The North Shore', 'L', 0, 0, { flat: 'the shore where the lane comes in' }], [4, 10, 'The Boathouse', 'L', 0, 0],
        [2, 11, 'The Dock', 'L', 0, 0], [3, 11, 'The Lake', 'L', 0, 0], [4, 11, 'The Lake, east', 'L', 0, 1, { relief: 'a bank over the water' }],
        [2, 12, 'The South Shore', 'L', 0, 1, { relief: 'a bench over the water, the bluff\'s ledge above it' }], [3, 12, 'The Lake, south', 'L', 0, 0, { relief: 'the south beach; the walk dips to it and climbs out' }], [4, 12, 'The Marsh', 'L', 0, 0, { relief: 'mud, a pond' }],
        [1, 11, 'The West Bank', 'L', null, 1], [1, 12, 'The Bluff', 'L', null, 2],
        [3, 13, 'The Ranch Gate', 'R', 1, 1], [4, 13, 'Ranch Road, the bee yard', 'N', 1, 1, { flat: route }], [2, 13, 'The Creek Pool', 'R', null, 1, { relief: 'the creek cut ends in a pool, one level down' }],
        [2, 14, 'The Farmhouse', 'R', 1, 2, { relief: 'a low rise; the creek cut behind the house' }], [3, 14, 'The Yard', 'R', 1, 1, { flat: 'the ranch yard: level, a board fits' }], [4, 14, 'The Barn', 'R', 1, 0, { relief: 'a hollow: the yard\'s edge is a bank you hop down' }],
        [3, 15, 'The Paddock', 'R', 1, 1, { flat: 'a horse paddock' }], [4, 15, 'The Windmill', 'R', 2, 2], [2, 15, 'The Draw', 'R', null, 3, { relief: 'the creek cut, one level under its banks' }],
        [2, 16, 'The Hay Field', 'R', 1, 3, { flat: 'a hay field on the high ground' }], [3, 16, 'The Pasture', 'R', 1, 2, { flat: 'a pasture' }], [3, 17, 'The Cow Field', 'R', 1, 1, { flat: 'a cow field' }],
        [1, 13, 'The Saddle', 'R', null, 4, { relief: 'the climb from the Bluff to the Ridge' }], [1, 14, 'The Ridge, north', 'R', null, 5, { relief: 'the creek cut under its east flank, 4 levels down' }],
        [1, 15, 'The Ridge', 'R', null, 6], [1, 16, 'The Ridge, south', 'R', null, 5, { relief: 'the way down to the Hay Field' }]],
    steps: [
        /* ── COUNTY LANE + ITS FIELDS (the route kit's; drawn as they stand, nothing planned on them) ── */
        ['area', 10, 1, 13, 71, 'c', 1], ...lane, ['area', 10, 74, 13, 83, 'c', 0], ['label', 11.5, 36, 'COUNTY LANE (the route kit\'s: not changed)', 'note'],
        ['area', 0, 74, 9, 83, 'g', 0], ['area', 14, 74, 23, 83, 'g', 0], ['area', 24, 60, 47, 119, 'g', 0], ['area', 12, 84, 23, 131, 'g', 0], ['area', 48, 156, 59, 167, 'g', 1],
        ['label', 36, 90, 'COUNTY LANE\'S FIELDS: the route kit\'s, left as they stand', 'note'],
        /* ── THE CORN FIELDS (C): level 1, the corn is the wall ── THE FARM TRACK (main, 3 squares) winds and crosses the lane three times */
        ['area', 2, 1, 9, 8, 'g', 1], ['label', 5.5, 2.4, 'THE WOODS GATE', 'place'], ['label', 5.5, 7.4, 'the gate yard · level, a board fits', 'note'],
        ['main', [[6, 0, 1], [6, 4, 1], [3, 4, 1], [3, 10, 1], [7, 10, 1], [7, 16, 1], [15, 16, 1], [15, 21, 1], [19, 21, 1], [19, 27, 1]], { name: 'the Farm Track' }],
        ['area', 15, 26, 22, 33, 'g', 1], ['label', 18.5, 29.5, 'THE CIRCLES', 'place'], ['label', 18.5, 30.7, 'a crop circle · level, a board fits', 'note'],
        ['main', [[17, 33, 1], [17, 38, 1], [20, 38, 1], [20, 44, 1], [14, 44, 1], [14, 46, 1], [7, 46, 1], [7, 52, 1], [4, 52, 1], [4, 55, 1], [7, 55, 1]], { name: 'the Farm Track' }],
        ['main', [[7, 55, 1], [15, 55, 1], [15, 62, 1], [19, 62, 1], [19, 68, 1], [14, 68, 1], [14, 66, 1], [8, 66, 1]], { name: 'the Farm Track' }],
        ['area', 1, 62, 8, 69, 'g', 1], ['set', 2, 65, 'k', 1], ['label', 4.5, 63.4, 'THE HUB', 'place'], ['label', 4.5, 67.6, 'the well · level, a board fits', 'note'],
        ['main', [[5, 69, 1], [5, 75, 0]], { name: 'the Farm Track, down to the lane fields' }],
        /* the Scarecrow's Rise: the one place you see over the corn (a knoll 2 levels up; its west edge is a ledge back onto the track) */
        ['area', 17, 13, 20, 17, 'g', 3], ['set', 18, 14, 'k', 3], ['label', 19, 12.4, 'THE SCARECROW\'S RISE', 'mark'],
        ['thin', [[21, 21, 1], [22, 21, 1], [22, 15, 3], [21, 15, 3]], { to: 'the Scarecrow\'s Rise: the knoll where you see over the corn (a lookout; hop off its west edge back onto the track)' }],
        /* thin tracks in the corn */
        ['area', 1, 13, 4, 16, 'g', 1], ['thin', [[3, 12, 1], [3, 12, 1]], { to: 'a secret: the saucer ring (flattened corn, the glow)' }], ['label', 2.5, 14.6, 'saucer ring', 'note'],
        ['thin', [[7, 18, 1], [7, 22, 1], [3, 22, 1], [3, 28, 1], [6, 28, 1], [6, 34, 1], [2, 34, 1], [2, 40, 1], [5, 40, 1], [5, 45, 1]], { to: 'the Farm Track again, through the west corn (the second way round the Circles)' }],
        ['thin', [[14, 30, 1], [14, 30, 1]], { to: 'County Lane, out of the crop circle (the short way)' }],
        ['area', 20, 48, 21, 50, 'k', 1], ['set', 22, 49, 'k', 1], ['thin', [[17, 55, 1], [21, 55, 1], [21, 51, 1]], { to: 'the field shed and the silo (a building you walk into)' }], ['label', 20, 47.2, 'FIELD SHED + SILO', 'mark'],
        /* ── THE LAKE (L): the water lies low; the west bank and the bluff stand over it ── */
        ['area', 24, 120, 59, 124, 'g', 0], ['area', 24, 125, 28, 143, 'g', 0], ['label', 42, 122, 'THE NORTH SHORE · open, level', 'place'],
        ['area', 34, 126, 49, 127, 'w', 0], ['area', 29, 128, 54, 144, 'w', 0], ['area', 34, 145, 49, 146, 'w', 0], ['label', 42, 134, 'THE LAKE', 'place'],
        ['area', 29, 137, 37, 138, 'c', 0], ['label', 33, 136.4, 'THE DOCK', 'mark'],
        ['area', 50, 125, 54, 127, 'g', 0], ['area', 55, 125, 58, 128, 'k', 0], ['label', 56.5, 129.6, 'BOATHOUSE', 'mark'],
        ['main', [[30, 120, 0], [30, 124, 0], [27, 124, 0], [27, 130, 0], [25, 130, 0], [25, 136, 0], [19, 136, 1], [19, 141, 1], [16, 141, 1], [16, 148, 2]], { name: 'the Shore Walk: west round the lake, up the bank to the Bluff' }],
        ['area', 13, 139, 18, 143, 'g', 1], ['label', 15.5, 139.6, 'THE WEST BANK', 'place'],
        ['area', 14, 147, 21, 154, 'g', 2], ['area', 22, 147, 23, 149, 'g', 2], ['label', 17.5, 150, 'THE BLUFF', 'place'], ['label', 17.5, 151.2, 'over the water · level, a board fits', 'note'],
        ['area', 24, 144, 28, 147, 'g', 1], ['label', 26, 145, 'bench', 'note'],
        ['main', [[21, 151, 2], [27, 151, 1], [27, 148, 1], [33, 148, 1], [33, 152, 1], [40, 152, 0], [40, 158, 1]], { name: 'the Shore Walk: down off the Bluff, along the south shore, to the Ranch Gate' }],
        ['area', 37, 147, 47, 150, 'g', 0], ['label', 41.5, 148.6, 'the south beach · picnic tables', 'note'],
        /* the east way round (2 squares): the boathouse, the east bank, the marsh */
        ['lane', [[56, 129, 0], [56, 136, 1], [58, 136, 1], [58, 143, 1], [56, 143, 1], [56, 149, 0], [50, 149, 0]], { to: 'the Marsh and the south beach, round the EAST side of the lake past the Boathouse (the second way round)' }],
        ['area', 50, 148, 59, 155, 'm', 0], ['area', 55, 152, 57, 153, 'w', 0], ['label', 54, 154.4, 'THE MARSH', 'place'], ['area', 48, 149, 49, 150, 'g', 0],
        ['thin', [[26, 119, 0], [26, 119, 0]], { to: 'County Lane\'s fields, straight from the Reeds (the lane north)' }],
        ['thin', [[31, 126, 0], [32, 126, 0]], { to: 'a secret: a duck blind in the reeds' }],
        /* ── THE RANCH (R) ── the Ranch Gate, the Yard (level), the Barn's hollow, the Windmill */
        ['area', 46, 157, 47, 159, 'g', 1],
        ['main', [[40, 158, 1], [44, 158, 1], [44, 164, 1], [41, 164, 1], [41, 170, 1]], { name: 'the Ranch Track' }], ['label', 43, 161, 'THE RANCH GATE', 'mark'],
        ['area', 36, 168, 47, 179, 'g', 1], ['area', 44, 175, 46, 177, 'k', 1], ['label', 40, 170.4, 'THE YARD', 'place'], ['label', 40, 171.6, 'level, a board fits', 'note'], ['label', 45, 178.6, 'coop', 'note'],
        ['area', 48, 168, 59, 179, 'g', 0], ['area', 51, 170, 57, 175, 'k', 0], ['label', 54, 172.6, 'THE BARN', 'mark'], ['label', 54, 177.6, 'the hollow', 'note'],
        ['main', [[45, 172, 1], [50, 172, 0], [50, 177, 0], [55, 177, 0], [55, 184, 2]], { name: 'the Ranch Road: down into the barn\'s hollow, up to the Windmill and the road east' }],
        ['area', 52, 183, 59, 190, 'g', 2], ['set', 56, 186, 'k', 2], ['label', 56, 187.6, 'THE WINDMILL', 'mark'],
        ['thin', [[58, 176, 0], [58, 178, 0]], { to: 'a secret: the stock tank behind the barn' }],
        /* the Paddock (level) and the thin way round it to the Pasture */
        ['area', 37, 181, 45, 190, 'g', 1], ['area', 40, 180, 42, 180, 'g', 1], ['area', 46, 184, 46, 184, 'g', 1], ['label', 41, 185, 'THE PADDOCK', 'place'],
        ['thin', [[47, 184, 1], [47, 191, 2]], { to: 'the Pasture, round the paddock (the second way south from the Yard)' }],
        /* the Farmhouse on its rise; the bank down to the Yard is a ledge */
        ['area', 26, 168, 35, 173, 'g', 2], ['area', 26, 174, 32, 179, 'g', 2], ['area', 27, 171, 32, 175, 'k', 2], ['label', 29.5, 173, 'THE FARMHOUSE', 'mark'], ['label', 30.5, 169.4, 'the rise · porch', 'note'],
        ['main', [[36, 177, 1], [30, 177, 2], [30, 183, 3], [33, 183, 3], [33, 188, 3], [29, 188, 3], [29, 195, 3], [37, 195, 2], [37, 203, 1], [42, 203, 1], [42, 208, 1]], { name: 'the Ranch Track: up past the Farmhouse, through the Draw, the Hay Field, down the Pasture to the Cow Field' }],
        ['area', 28, 182, 35, 186, 'g', 3], ['label', 31.5, 185, 'THE DRAW', 'place'],
        ['area', 24, 196, 31, 203, 'g', 3], ['label', 27.5, 200, 'THE HAY FIELD', 'place'], ['label', 27.5, 201.2, 'level, a board fits', 'note'],
        ['area', 40, 192, 47, 200, 'g', 2], ['area', 39, 193, 39, 197, 'g', 2], ['label', 43.5, 196, 'THE PASTURE', 'place'], ['label', 43.5, 197.2, 'level, a board fits', 'note'],
        ['area', 36, 205, 47, 215, 'g', 1], ['area', 43, 213, 45, 215, 'k', 1], ['label', 41, 209, 'THE COW FIELD', 'place'], ['label', 44, 212.2, 'cow shed', 'note'],
        /* THE CREEK CUT (2 squares, the fast way DOWN): from the Draw, behind the Farmhouse, to the Creek Pool. Each dry fall is a ledge. */
        ['lane', [[26, 189, 2], [26, 184, 2], [24, 184, 2], [24, 181, 2]], { to: 'the Creek Pool, down the creek cut: the fast way DOWN from the Draw (two dry falls you hop)' }],
        ['lane', [[24, 180, 1], [24, 176, 1], [22, 176, 1], [22, 171, 1], [24, 171, 1], [24, 168, 1]], { cont: true }],
        ['lane', [[24, 167, 0], [24, 163, 0], [27, 163, 0], [27, 159, 0]], { cont: true }],
        ['area', 27, 157, 30, 160, 'm', 0], ['label', 28.5, 156.4, 'THE CREEK POOL', 'place'], ['label', 24.5, 174, 'creek cut', 'note'],
        ['thin', [[31, 159, 0], [38, 159, 1]], { to: 'the Ranch Gate, up out of the Creek Pool (the way back to the track)' }],
        /* THE RIDGE (thin, 1 square): the high way from the Bluff along the fence line to the Hay Field */
        ['thin', [[18, 155, 2], [18, 160, 4], [15, 160, 4], [15, 166, 5], [19, 166, 5], [19, 172, 5], [16, 172, 5], [16, 179, 6], [20, 179, 6], [20, 182, 6]], { to: 'the Ridge: the HIGH way from the Lake to the Hay Field, along the fence line (the second way round the Ranch)' }],
        ['area', 16, 183, 23, 188, 'g', 6], ['set', 19, 186, 'k', 6], ['label', 18.5, 184, 'THE RIDGE', 'place'], ['label', 18.5, 187.6, 'the lone tree · the fence line', 'note'],
        ['thin', [[18, 189, 6], [18, 194, 5], [22, 194, 5], [22, 200, 3], [23, 200, 3]], { cont: true }],
        ['label', 17, 163, 'THE SADDLE', 'note'],
    ],
    doors: [[6, 0, 'N', 'The Woods (the Fence Line)', 1], [59, 186, 'E', 'the Ranch Road', 2]],
    landmarks: [
        { name: 'The Scarecrow', at: [18, 14], tall: 2 }, { name: 'The Silo', at: [22, 49], tall: 5 }, { name: 'The Well', at: [2, 65], tall: 1 },
        { name: 'The Boathouse', at: [56, 126], tall: 3 }, { name: 'The Dock', at: [33, 137], tall: 1 },
        { name: 'The Windmill', at: [56, 186], tall: 6 }, { name: 'The Farmhouse', at: [30, 173], tall: 4 }, { name: 'The Barn', at: [54, 172], tall: 5 }, { name: 'The Lone Tree', at: [19, 186], tall: 5 }],
    lookouts: [
        { name: 'the Scarecrow\'s Rise', at: [19, 16], sees: 'The Silo', next: 'L' },
        { name: 'the Bluff\'s edge', at: [21, 149], sees: 'The Boathouse', next: 'R' },
        { name: 'the Ridge, by the lone tree', at: [23, 185], sees: 'The Windmill', next: 'L' }],
    found: [
        { name: 'the washed-out bank (roots)', from: [24, 140], to: [20, 140], kind: 'climb' },
        { name: 'the roots under the Bluff', from: [24, 146], to: [23, 148], kind: 'climb' },
        { name: 'the crates behind the barn', from: [48, 169], to: [47, 169], kind: 'ledge chain' },
        { name: 'the root ladder out of the creek cut', from: [25, 170], to: [26, 170], kind: 'ladder' },
        { name: 'the fallen cottonwood', from: [27, 186], to: [28, 186], kind: 'trunk' },
        { name: 'the rock chimney', from: [28, 184], to: [21, 185], kind: 'climb' }],
    flats: [
        { name: 'The Woods Gate\'s yard', rect: [2, 1, 9, 8], why: 'the yard inside the gate, where County Lane starts', board: true },
        { name: 'The Circles', rect: [15, 26, 22, 33], why: 'a crop circle: flattened corn', board: true },
        { name: 'The Hub', rect: [1, 62, 8, 69], why: 'the well\'s yard', board: true },
        { name: 'The North Shore', rect: [36, 120, 47, 124], why: 'the open shore where the lane comes in' },
        { name: 'The Bluff', rect: [14, 147, 21, 154], why: 'the open top over the water', board: true },
        { name: 'The Yard', rect: [36, 168, 47, 179], why: 'the ranch yard', board: true },
        { name: 'The Paddock', rect: [37, 181, 45, 190], why: 'a horse paddock', board: true },
        { name: 'The Hay Field', rect: [24, 196, 31, 203], why: 'a field', board: true },
        { name: 'The Pasture', rect: [40, 192, 47, 200], why: 'a field', board: true },
        { name: 'The Cow Field', rect: [36, 205, 47, 215], why: 'a field', board: true }],
    buildings: [
        { name: 'The Field Shed', rect: [20, 48, 21, 50], door: 'S', tall: 2, inside: 'one room: tools, seed sacks, a workbench (it stands today)' },
        { name: 'The Boathouse', rect: [55, 125, 58, 128], door: 'W', tall: 3, inside: 'one hall over a slip: a rowboat on the rails, oars, nets (it stands today)' },
        { name: 'The Farmhouse', rect: [27, 171, 32, 175], door: 'E', tall: 4, inside: 'two floors: kitchen and parlour below, bedrooms above; the cellar (it stands today)' },
        { name: 'The Barn', rect: [51, 170, 57, 175], door: 'W', tall: 5, inside: 'one tall hall: stalls, a hay loft you climb to (it stands today)' },
        { name: 'The Coop', rect: [44, 175, 46, 177], door: 'N', tall: 2, inside: 'one low room: roosts and nest boxes (it stands today)' },
        { name: 'The Cow Shed', rect: [43, 213, 45, 215], door: 'N', tall: 2, inside: 'an open-fronted shed: stalls, a trough (it stands today)' }],
    picture: { S: 9 },
    pictures: [{ suffix: 'corn', y0: 0, y1: 83, x1: 47, S: 22, title: 'THE ESTATE, THE CORN FIELDS: level on purpose; the Farm Track winds and crosses County Lane' },
        { suffix: 'lake', y0: 108, y1: 167, S: 22, title: 'THE ESTATE, THE LAKE: the shore walk, the West Bank and the Bluff (new), the east way round' },
        { suffix: 'ranch', y0: 144, y1: 215, x0: 12, S: 22, title: 'THE ESTATE, THE RANCH: the hollow, the yard, the rise, the Draw + the creek cut, the Ridge (new)' }],
};
