/* THE BEACH · THE SHORE (district S, 14 plots: the west coast off Disaster City's Bayside) — the district file (2026-11-16).
   Part of `node bake-beach.js` (its one hook). Notes: docs/notes/areas-complexes.md "THE BEACH ON PLOTS" + "THE BEACH, THE DISTRICT FILES".

   THE PLOTS (docs/areas/beach/layout.json):
     P00-01  The North Headland (level 1): the sand runs out at a rock headland
     P00-03  The Boardwalk (level 1): the plank boardwalk on the sea wall, palms, benches  [the plan's way out: Disaster City: Bayside (boardwalk)]
     P01-03  The Tide Pools (level 0): rock pools, starfish
     P00-04  The Beach Huts (level 1): a row of huts (insides: new)  [the plan's way out: insides: the huts]
     P01-04  The Surf (level 0): the break; wade and swim; the Long Pier starts on this sand
     P00-05  The Palms (level 1): palm grove, hammocks
     P01-05  The Lifeguard Hut (level 1): LANDMARK: the lifeguard hut, chairs, the volleyball net
     P00-06  The Dunes (level 2): high dunes, the sand runs on south
     P01-06  The Sandbar (level 0): a bar out into the bay at low water
     P00-08  The South Dunes (level 2): the dunes run on south
     no name (open water or bare sand): P00-02 P01-02 P00-07 P01-07

   WHAT STANDS HERE TODAY: the Boardwalk (planks on the sand, benches, a signpost, the snack cart, a telescope) inside the city door `quay`
   (the door, the spawn and the west wall are the tool's); the three BEACH HUTS (walk-in: aqua surf hut, lemon sleeping hut, coral float hut;
   squares 2-9 x 50-51, fronts south); the LIFEGUARD HUT (walk-in, white, red roof, its door east to the sea; squares 15-16 x 65-66) and the
   lifeguard chair; 51 palms less the islands' (the three groves on the plan's 't' squares + singles); umbrellas, loungers, surfboards, a camp
   fire, a sandbox, two rowboats, flamingos in the Tide Pools and on the Sandbar, shells and crabs, four rocks; seals and a turtle in the
   shallows. People: mermaid (Tide Pools), starfish (Sandbar), siren (the Surf).

   MISSING / NEVER SEEN ON SCREEN (from the notes + the board):
   - Seen once from far (11-15, playtest_city.js): the shore and the huts draw; the huts were repainted after ("brighten the huts") and the
     new paint, the flamingos up close and the huts' INSIDES were never looked at.
   - The plan's own words not built: the volleyball net (no model), hammocks in the Palms, beach towels (no model), "chairs" at the lifeguard hut.
   - The four no-name plots and both headlands and the South Dunes are nearly bare (a palm, a log, a shell).
   - The west edge is open sea past the room, not the city's sea wall (no `terrain.edges`: the tool's, ask on the board).
   - No residents with routines, no fight set up. Weed / kelp / the ocean pack's rocks do NOT go in the shallows or on dry sand (seen: black
     spikes and pillars).
   THE HOOKS (all optional; bake-beach.js "THE DISTRICT FILES" runs each stage for S, H, O, T in that order):
     tailor(ctx)  before the heights are made: the plan's squares. Turn each plan building ('B') you build back into its ground with
                  ctx.setRect(x0, y0, x1, y1, ch) / ctx.cell[y][x] = ch (the tool refuses to bake while a 'B' is left that nobody builds).
     build(ctx)   the buildings: ctx.building(id, [sx0, sy0, sx1, sy1, front side], height, row opts, (a, w, d, door) => parts) = a walk-in
                  (a hollow texbuilding + its arch look; returns the frame for ctx.put(B, key, lx, lz, opts) = a prop inside it);
                  ctx.look(id, x, z, rot, a => parts) = a thing that is only drawn.
     place(ctx)   props, palms, people, scatters: ctx.P (a blocker on a square's middle), ctx.dec (decor, off the middle, shares a square),
                  ctx.afloat, ctx.swimmer, ctx.under (sea things), ctx.palm, ctx.native(race, sx, sy, face, say), ctx.feat(row), ctx.props.push(row).
     dress(ctx)   the same tools, run after every district's place (the second pass: THE DRESSING).
     reach        [[sx, sy, 'name'], ...]: squares the walker must reach on foot from the city door (the tool's walk check).
   ctx also carries: C N W H OY, gx gz mx mz r2, rnd (YOUR OWN dice, one stream per district and stage: a new throw at the END of a hook moves
   nothing; a new throw in the middle re-throws only your own later ones), cell plot Pxy flat taken spot, the sheets U WD WD2 SHG FLR GLS COR
   BRK SHUT CORR PAINT, the old rooms' lines sayOf O_SEA O_HARB, and the tool's fixed places MAEL POOL BAY GANG SP SHIP PIER_END LIGHT
   (read them, never move them: they are doors, links and the Dutchman's berth).
   Squares are (sx 0..168 west to east, sy 0..120 north to south), 3.5 m each; a plot is 12 x 12 of them.
   RULES for the thread that holds this file: docs/notes/areas-complexes.md "THE BEACH, THE DISTRICT FILES". This file only; never bake-beach.js,
   layout.json or another district's file without a note on docs/notes/claims.md. Not a game file, never uploaded. */
'use strict';
const B_HUTS = [[2, 50], [5, 50], [8, 50]], B_GUARD = [15, 65];   // the plan's building squares (north-west corner): three huts 2 x 2, the lifeguard hut 2 x 2
let HUTS, GUARD;
module.exports = {
tailor(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    B_HUTS.forEach(q => setRect(q[0], q[1], q[0] + 2, q[1] + 2, 'd')); setRect(B_GUARD[0], B_GUARD[1], B_GUARD[0] + 2, B_GUARD[1] + 2, 'd');
},

build(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* THE BEACH HUTS (walk-in, mondo: "walk ins"): three painted plank huts in a row, each its own colour, a striped gable, a step, a porch post pair */
    /* THE PAINT (seen on screen 11-15: a colour over the brown board sheet read as mud; mondo "brighten the huts"): Bayside's way (districts/B.js) —
       a painted wall takes `gain` (the tint times it, past white), the roof is the painted corrugated sheet, the trim is plain paint (no sheet) */
    const HUT_COL = [[0x7fdcec, 0xffffff, 0xff5a7a], [0xffe27a, 0xffffff, 0x38b0aa], [0xffa590, 0xffffff, 0x44669c]];   // aqua / lemon / coral walls, white trim, a hot roof each
    HUTS = B_HUTS.map((q, i) => building('hut' + (i + 1), [q[0], q[1], q[0] + 2, q[1] + 2, 'S'], 3.0, { leaf: 'leaf_white_wood' }, (a, w, d, door) => {
        const [COL, TRIM, ROOF] = HUT_COL[i];
        a.shell(w, 3.0, d, WD, COL, door, [3.5, 1.75], PAINT);
        a.box(0, 0, 0, w - 0.1, 0.14, d - 0.1, FLR, 0xc8b490, { uv: [1.75, 1.75] });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.24, 3.0, 0.24, null, TRIM);
        a.roof('gable', 0, 3.0, 0, w + 0.7, 2.0, d + 0.9, CORR, ROOF, { keyEnd: WD, tintEnd: COL, gain: 2.0 });
        for (let k = -2; k <= 2; k++) a.box(k * 1.3, 3.0, d / 2 + 0.47, 0.5, 0.06, 0.04, null, k % 2 ? ROOF : TRIM);                              // the striped fascia
        a.frame(door, d, null, TRIM);
        a.box(0, 0, d / 2 + 0.6, w, 0.14, 1.2, FLR, 0xc8b490);                                                             // the step
        for (const s of [-1, 1]) a.box(s * (w / 2 + 0.06), 1.1, 0, 0.08, 1.1, 1.3, SHUT, 0xe8e4d8, { uv: 'fit', faces: s < 0 ? 'l' : 'r', top: false });
    }));
    put(HUTS[0], 'surfboard_rack', -2.2, -2.2, { face: 90 }); put(HUTS[0], 'surfboard_long', 2.6, -2.4, { face: 20 }); put(HUTS[0], 'beach_life_ring', 2.9, 0.6, { y: 1.5 }); put(HUTS[0], 'beach_cooler', 2.2, 2.0);
    put(HUTS[1], 'cot', -2.0, -1.6, { face: 0 }); put(HUTS[1], 'sea_chest', 2.4, -2.4, { face: 270 }); put(HUTS[1], 'retro_radio', 2.5, 0.4); put(HUTS[1], 'rug_round', 0, 0.2, { y: 0.15 }); put(HUTS[1], 'railway_lantern', -2.6, 2.2);
    put(HUTS[2], 'beach_air_mattress_blue', -2.0, -2.0, { face: 0 }); put(HUTS[2], 'beach_air_mattress_pink', -2.0, -0.4, { face: 0 }); put(HUTS[2], 'beach_swim_ring', 2.4, -2.4); put(HUTS[2], 'beach_ball', 2.2, 0.2); put(HUTS[2], 'folding_chair', 2.0, 2.2, { face: 200 });
    /* THE LIFEGUARD HUT (the Shore's landmark, walk-in): a white plank hut, a red roof, the red cross board, its front to the sea */
    GUARD = building('lifeguard', [B_GUARD[0], B_GUARD[1], B_GUARD[0] + 2, B_GUARD[1] + 2, 'E'], 3.2, { leaf: 'leaf_white_wood' }, (a, w, d, door) => {
        const WHITE = 0xffffff, RED = 0xe8483c;
        a.shell(w, 3.2, d, WD, WHITE, door, [3.5, 1.75], PAINT);
        a.box(0, 0, 0, w - 0.1, 0.14, d - 0.1, FLR, 0xc8b490, { uv: [1.75, 1.75] });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.26, 3.2, 0.26, WD2, RED);
        a.roof('pyramid', 0, 3.2, 0, w + 1.2, 1.9, d + 1.2, CORR, RED, { gain: 2.0 });
        a.frame(door, d, WD2, RED);
        a.box(0, 0, d / 2 + 0.9, w + 0.4, 0.14, 1.8, FLR, 0xc8b490);                                                        // the deck before the door
        a.box(2.2, 1.9, d / 2 + 0.07, 0.9, 0.3, 0.06, WD2, RED); a.box(2.2, 1.6, d / 2 + 0.07, 0.3, 0.9, 0.06, WD2, RED);     // the red cross
        a.cyl(-w / 2 - 0.3, 0, d / 2 + 0.3, 0.05, 5.4, WD2, WHITE); a.box(-w / 2 - 0.3 + 0.45, 4.7, d / 2 + 0.3, 0.9, 0.6, 0.03, null, RED);   // the flag
    });
    put(GUARD, 'cot', -2.0, -2.0, { face: 0 }); put(GUARD, 'beach_life_ring', -2.9, 1.0, { y: 1.5 }); put(GUARD, 'beach_life_ring', 2.9, -1.0, { y: 1.5 }); put(GUARD, 'tool_chest', 2.3, -2.4, { face: 270 }); put(GUARD, 'retro_radio', 2.4, 0.6);
},

place(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    [[10, OY + 2], [12, OY + 9], [14, OY + 20], [3, OY + 20], [9, OY + 21], [6, OY + 44], [10, OY + 40], [4, 30], [8, 26], [3, 22], [1, 18], [2, 90], [7, 94], [3, 100]].forEach(q => palm(q[0], q[1]));
    for (let y = 0; y < H; y++) for (let x = 0; x < 24; x++) if (cell[y][x] === 't' && (x + y) % 2 === 0) palm(x, y);                // THE PALMS: the three groves
    P('park_bench', 2, OY + 3, { face: 180 }); P('park_bench', 5, OY + 3, { face: 180 }); P('signpost', 8, OY + 5, { face: 90 }); P('city_bench', 2, OY + 7, { face: 0 }); dec('beach_ball', 9, OY + 8);
    P('surfboard_rack', 11, OY + 15, { face: 0 }); dec('surfboard_short', 12, OY + 17); dec('surfboard_fish', 13, OY + 16); P('campfire', 6, OY + 18); dec('folding_chair', 5, OY + 19); dec('folding_chair', 7, OY + 19); dec('beach_cooler', 7, OY + 17);
    P('pool_umbrella', 13, OY + 22); dec('pool_lounger', 14, OY + 22, { face: 90 }); P('pool_umbrella', 13, OY + 26); dec('pool_lounger', 14, OY + 26, { face: 90 }); dec('beach_ball', 12, OY + 24);
    P('lifeguard_chair', 18, OY + 27, { face: 90 }); dec('beach_life_ring', 17, OY + 31); dec('beach_swim_ring', 13, OY + 33); dec('beach_air_mattress_pink', 12, OY + 34);
    [[16, OY + 3], [18, OY + 7], [14, OY + 9], [20, OY + 10]].forEach((q, i) => dec(['ocean_starfish', 'ocean_crab', 'ocean_conch', 'ocean_sand_dollar'][i], q[0], q[1]));   // THE TIDE POOLS
    dec('ocean_starfish', 15, OY + 8); dec('ocean_crab', 17, OY + 10);
    [[15, OY + 40], [17, OY + 41], [20, OY + 42], [22, OY + 41]].forEach((q, i) => dec(['ocean_sand_dollar_2', 'ocean_conch', 'ocean_seal_resting', 'ocean_crab'][i], q[0], q[1]));   // THE SANDBAR
    dec('fallen_log', 4, OY + 40); dec('ocean_conch', 2, 20); dec('fallen_log', 4, 24); dec('ocean_crab', 8, 32); dec('ocean_sand_dollar_3', 3, 96);
    native('mermaid', 19, OY + 9, 250, sayOf(O_SEA, 'mermaid')); native('starfish', 19, OY + 41, 270); native('siren', 16, OY + 18, 90);
},

dress(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* the Shore: flamingos in the tide pools and the shallows, a sandbox and a ball by the huts, the snack cart and a telescope on the Boardwalk, boats pulled up */
    [[18, OY + 4], [20, OY + 5], [19, OY + 7], [21, OY + 8], [17, OY + 43], [20, OY + 40], [16, OY + 34]].forEach(q => { spot(q[0], q[1], 'flamingo', null, true); props.push({ key: 'flamingo', x: mx(q[0]), z: mz(q[1]), face: Math.round(rnd() * 360) }); });
    P('play_sandbox', 12, OY + 18); dec('football', 9, OY + 19); dec('skateboard', 6, OY + 5); P('popcorn_cart', 5, OY + 6, { face: 180 }); P('brass_telescope', 7, OY + 4, { face: 90 });
    P('rowboat', 15, OY + 13, { face: 70 }); P('meshy_rowboat', 14, OY + 37, { face: 110 }); dec('surfboard_long', 15, OY + 25); dec('surfboard_fish', 12, OY + 29); dec('beach_cooler', 14, OY + 30);
    P('pool_umbrella', 10, OY + 33); dec('pool_lounger', 11, OY + 33, { face: 90 }); P('pool_umbrella', 6, 28); dec('pool_lounger', 7, 28, { face: 90 }); dec('beach_ball', 5, 27); dec('beach_swim_ring', 8, 30);
    [[1, OY + 44, 'psxg_rock_1'], [2, 21, 'psxg_rock_2'], [3, 94, 'psxg_rock_3'], [16, OY + 2, 'psxg_rock_4']].forEach(q => dec(q[2], q[0], q[1]));
    swimmer('ocean_seal', 23, OY + 46, {}); swimmer('ocean_seal', 26, OY + 44, {}); swimmer('ocean_turtle', 22, OY + 16, { swim: { r: 3, v: 0.6, bob: 0.1 } });
       // (no weed in the shallows: seen on screen, its tops break the surface as black spikes)
},
};
