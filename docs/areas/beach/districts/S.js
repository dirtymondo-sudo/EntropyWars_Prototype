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

   WHAT STANDS HERE TODAY (after THE EXTERIOR PASS, 11-16; all of it seen on screen): THE BOARDWALK inside the city door `quay` (the door, the
   spawn and the west wall are the tool's): planks on the sand in a timber kerb, bollards with rope, four lamps, THE GATE at the door (two white
   pylons, a navy beam, "The Beach" to the sand, "DISASTER CITY · BAYSIDE" to the city), benches, a signpost, the snack cart, a telescope; the
   three BEACH HUTS (walk-in: aqua SURF, lemon BEACH HUT, coral FLOATS; squares 2-9 x 50-51, fronts south; each a porch, a shuttered window, its
   word on a board, its number, its own door leaf); the LIFEGUARD HUT (walk-in, white boards, red band and roof, LIFEGUARD on the roof to the
   sea, a railed veranda, the red-over-yellow flag; squares 15-16 x 65-66, door east) and the lifeguard chair; THE VOLLEYBALL COURT south of it
   (a drawn net, Bayside's way; squares 12-15 x 68-70 kept clear); the swim flags on the Surf; THE TIDE POOLS (five `dip` hollows the sea
   stands in, ringed with the graveyard pack's rocks); 51 palms less the islands'; umbrellas, loungers, surfboards, a camp fire, a sandbox, two
   rowboats, flamingos, shells and crabs; seals and a turtle in the shallows. People: mermaid (Tide Pools), starfish (Sandbar), siren (the Surf).

   STILL MISSING (the work plan's later passes):
   - INTERIORS: the four huts are a brown box with a black ceiling and a few props (seen 11-16).
   - DRESSING: both headlands, the Dunes, the South Dunes and the four no-name plots are nearly bare.
   - NEEDS A MODEL (not stood in for): hammocks (the Palms), beach towels, a windbreak, a sandcastle, gulls.
   - THE TOOL'S (notes on docs/notes/claims.md, 11-16): the west edge is open sea where the city should stand; the sky's waterspout landmark
     and the sea shell's night bodies draw as a teal spindle and black outlines by day; the dunes' steep faces wear the cliff sheet as grey
     bands; the sand reads grey-white in the cloud browser.
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
const TIDE = [[13.5, 37.5, 5.2, 1.7], [15.2, 44.6, 4.6, 1.6], [12.4, 41.2, 4.0, 1.6], [18.8, 45.6, 3.6, 1.5], [15.8, 40.6, 3.4, 1.5]];   // the tide pools: [square x, square y (a square line), radius m, depth m]
module.exports = {
tailor(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    B_HUTS.forEach(q => setRect(q[0], q[1], q[0] + 2, q[1] + 2, 'd')); setRect(B_GUARD[0], B_GUARD[1], B_GUARD[0] + 2, B_GUARD[1] + 2, 'd');
},

build(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* ── THE EXTERIOR PASS (2026-11-16, the Shore pilot thread; seen on screen first: the huts' walls were mud over the brown board sheet, their
       doors read as grey steel, the lifeguard hut was tan, the Boardwalk was planks painted on the sand with the city door standing bare, the
       Tide Pools had no pools). THE PAINT THAT WORKS HERE: a painted wall = the painted corrugated sheet (reads as painted boards) at `gain`,
       never a colour over the brown wood sheets; trim, posts and rope are plain paint. ── */
    const WHITE = 0xffffff, RED = 0xe8483c, NAVY = 0x44669c, CREAM = 0xfff6e2, ROPE = 0xd8c49a, TIMBER = 0x8a6a48, LAMP = 0xffe2a8;
    const wall = (a, w, h, d, tint, door) => a.shell(w, h, d, CORR, tint, door, [2.4, 2.4], tint === WHITE ? 3.2 : 2.9);   // (seen: at gain 2.3 the room's faded look greys a pastel and white reads as tin)
    /* a window on the front: dark glass in a white frame, a shutter either side */
    const win = (a, x, y, z, w, h, shut) => { a.box(x, y - 0.08, z, w + 0.24, h + 0.16, 0.06, null, WHITE); a.box(x, y, z + 0.03, w, h, 0.04, GLS, 0xdcecff, { uv: 'fit', win: 'keep', glow: 0.35 });
        a.box(x, y + h / 2 - 0.03, z + 0.06, w, 0.06, 0.03, null, WHITE); a.box(x, y, z + 0.06, 0.06, h, 0.03, null, WHITE);
        if (shut != null) for (const s of [-1, 1]) a.box(x + s * (w / 2 + 0.36), y - 0.04, z + 0.02, 0.5, h + 0.08, 0.05, SHUT, shut, { uv: 'fit', gain: 1.6 }); };
    /* a porch: a plank deck, two posts, a shed roof off the front wall */
    const porch = (a, w, d, depth, y, roofTint, post) => { a.box(0, 0, d / 2 + depth / 2, w + 0.3, 0.16, depth, FLR, 0xd8c4a0, { uv: [1.75, 1.75] });
        for (const s of [-1, 1]) a.box(s * (w / 2 - 0.1), 0.16, d / 2 + depth - 0.14, 0.14, y - 0.16, 0.14, null, post);
        a.box(0, y - 0.12, d / 2 + depth - 0.14, w, 0.12, 0.12, null, post);
        a.roof('shed', 0, y, d / 2 + depth / 2 + 0.05, w + 0.7, 0.45, depth + 0.5, CORR, roofTint, { gain: 2.6 }); };
    /* THE BEACH HUTS (walk-in, mondo: "walk ins"): three painted board huts in a row, each its own colour: a porch, a shuttered window, a
       striped gable, its number and its trade on a board (plain trade words, never a made-up name) */
    const HUT_COL = [[0x4fd4f0, 0xff4a70, 'SURF'], [0xffdc50, 0x24a8a0, 'BEACH HUT'], [0xff8e70, 0x3a60a8, 'FLOATS']];   // aqua / lemon / coral walls, a hot roof each, white trim
    HUTS = B_HUTS.map((q, i) => building('hut' + (i + 1), [q[0], q[1], q[0] + 2, q[1] + 2, 'S'], 3.0, { leaf: ['leaf_wooden', 'leaf_beige_wood', 'leaf_stable'][i] }, (a, w, d, door) => {
        const [COL, ROOF, WORD] = HUT_COL[i];
        wall(a, w, 3.0, d, COL, door);
        a.box(0, 0, 0, w - 0.1, 0.14, d - 0.1, FLR, 0xc8b490, { uv: [1.75, 1.75] });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.24, 3.0, 0.24, null, WHITE);
        for (const sx of [-1, 1]) a.box(sx * (w / 2 + 0.06), 0, 0, 0.05, 0.3, d, null, WHITE);                                 // the white base board, both sides
        a.roof('gable', 0, 3.0, 0, w + 0.7, 2.0, d + 0.9, CORR, ROOF, { keyEnd: CORR, tintEnd: COL, gain: 2.6 });
        for (let k = -3; k <= 3; k++) a.box(k * 0.98, 3.0, d / 2 + 0.47, 0.5, 0.2, 0.05, null, k % 2 ? ROOF : WHITE);            // the striped fascia
        a.frame(door, d, null, WHITE);
        porch(a, w, d, 1.9, 2.75, ROOF, WHITE);
        win(a, 1.95, 1.05, d / 2 + 0.06, 1.3, 1.15, ROOF);
        a.box(0, 3.5, d / 2 + 0.47, (WORD.length > 5 ? 3.2 : 2.2) + 0.16, 0.72, 0.05, null, ROOF); a.sign(WORD, 0, 3.55, d / 2 + 0.5, WORD.length > 5 ? 3.2 : 2.2, 0.62, '#1f3a5c', '#ffffff', 'pacifico');
        a.sign(String(i + 1), door.lx - 1.3, 1.55, d / 2 + 0.08, 0.4, 0.4, '#1f3a5c', '#ffffff', 'way');
        for (const s of [-1, 1]) a.box(s * (w / 2 + 0.06), 1.1, 0, 0.08, 1.1, 1.3, SHUT, WHITE, { uv: 'fit', faces: s < 0 ? 'l' : 'r', top: false, gain: 1.6 });
    }));
    put(HUTS[0], 'surfboard_rack', -2.2, -2.2, { face: 90 }); put(HUTS[0], 'surfboard_long', 2.6, -2.4, { face: 20 }); put(HUTS[0], 'beach_life_ring', 2.9, 0.6, { y: 1.5 }); put(HUTS[0], 'beach_cooler', 2.2, 2.0);
    put(HUTS[1], 'cot', -2.0, -1.6, { face: 0 }); put(HUTS[1], 'sea_chest', 2.4, -2.4, { face: 270 }); put(HUTS[1], 'retro_radio', 2.5, 0.4); put(HUTS[1], 'rug_round', 0, 0.2, { y: 0.15 }); put(HUTS[1], 'railway_lantern', -2.6, 2.2);
    put(HUTS[2], 'beach_air_mattress_blue', -2.0, -2.0, { face: 0 }); put(HUTS[2], 'beach_air_mattress_pink', -2.0, -0.4, { face: 0 }); put(HUTS[2], 'beach_swim_ring', 2.4, -2.4); put(HUTS[2], 'beach_ball', 2.2, 0.2); put(HUTS[2], 'folding_chair', 2.0, 2.2, { face: 200 });
    /* THE LIFEGUARD HUT (the Shore's landmark, walk-in): white boards, a red band, a red roof with its name on a board to the sea, a railed
       veranda, the red cross, the red-over-yellow flag */
    GUARD = building('lifeguard', [B_GUARD[0], B_GUARD[1], B_GUARD[0] + 2, B_GUARD[1] + 2, 'E'], 3.2, { leaf: 'leaf_white_wood' }, (a, w, d, door) => {
        wall(a, w, 3.2, d, WHITE, door);
        a.box(0, 0, 0, w - 0.1, 0.14, d - 0.1, FLR, 0xc8b490, { uv: [1.75, 1.75] });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.26, 3.2, 0.26, null, RED);
        a.box(0, 2.62, 0, w + 0.16, 0.32, d + 0.16, null, RED, { top: false, under: false });                                  // the red band under the eaves
        a.roof('pyramid', 0, 3.2, 0, w + 1.6, 2.0, d + 1.6, CORR, RED, { gain: 2.6 });
        a.frame(door, d, null, RED);
        a.box(0, 0, d / 2 + 1.2, w + 0.6, 0.3, 2.4, FLR, 0xd8c4a0, { uv: [1.75, 1.75] });                                       // the veranda, a step up
        a.box(door.lx, 0, d / 2 + 2.65, 1.9, 0.15, 0.5, FLR, 0xd8c4a0);                                                        // its step, before the door
        for (const s of [-1, 1]) { a.box(s * (w / 2 + 0.2), 0.3, d / 2 + 2.3, 0.1, 1.0, 0.1, null, WHITE); a.box(s * (w / 2 + 0.2), 0.3, d / 2 + 0.1, 0.1, 1.0, 0.1, null, WHITE);
            for (const y of [0.75, 1.22]) a.box(s * (w / 2 + 0.2), y, d / 2 + 1.2, 0.06, 0.07, 2.2, null, WHITE); }
        { const gap0 = door.lx - 1.05, gap1 = door.lx + 1.05, z = d / 2 + 2.3;                                                   // the front rail, open before the door
          for (const y of [0.75, 1.22]) { a.box((-w / 2 - 0.2 + gap0) / 2, y, z, gap0 + w / 2 + 0.2, 0.07, 0.06, null, WHITE); a.box((gap1 + w / 2 + 0.2) / 2, y, z, w / 2 + 0.2 - gap1, 0.07, 0.06, null, WHITE); }
          a.box(gap0, 0.3, z, 0.1, 1.0, 0.1, null, WHITE); a.box(gap1, 0.3, z, 0.1, 1.0, 0.1, null, WHITE); }
        win(a, 2.0, 1.05, d / 2 + 0.06, 1.3, 1.15, RED);
        a.box(-2.75, 1.75, d / 2 + 0.07, 0.9, 0.3, 0.06, null, RED); a.box(-2.75, 1.45, d / 2 + 0.07, 0.3, 0.9, 0.06, null, RED);   // the red cross
        a.box(0, 4.0, d / 2 + 0.5, 4.6, 0.86, 0.1, null, WHITE); a.sign('LIFEGUARD', 0, 4.05, d / 2 + 0.56, 4.4, 0.76, '#ffffff', '#e8483c', 'way');
        a.cyl(-w / 2 - 0.5, 0, d / 2 + 2.6, 0.06, 6.4, null, WHITE, { seg: 6 });                                               // the flag: red over yellow (swim between the flags)
        a.box(-w / 2 - 0.5 + 0.6, 5.85, d / 2 + 2.6, 1.1, 0.4, 0.03, null, RED, { ds: true }); a.box(-w / 2 - 0.5 + 0.6, 5.45, d / 2 + 2.6, 1.1, 0.4, 0.03, null, 0xffd23c, { ds: true });
    });
    put(GUARD, 'cot', -2.0, -2.0, { face: 0 }); put(GUARD, 'beach_life_ring', -2.9, 1.0, { y: 1.5 }); put(GUARD, 'beach_life_ring', 2.9, -1.0, { y: 1.5 }); put(GUARD, 'tool_chest', 2.3, -2.4, { face: 270 }); put(GUARD, 'retro_radio', 2.4, 0.6);
    /* THE BOARDWALK (squares 0-7 x 40-42, flat at 1.2 m): a timber kerb round the boards, bollards with a rope along the landward half, four
       lamps, and THE GATE at the city door (the door itself is the tool's): two white pylons, a beam, the way's name to the beach */
    look('boardwalk', gx(4), gz(41.5), 0, a => {
        const L = 28, D = 10.5, x0 = -L / 2, z0 = -D / 2;
        for (const s of [-1, 1]) a.box(0, 0, s * (D / 2 + 0.08), L + 0.3, 0.16, 0.18, WD2, TIMBER);                             // the kerb, north and south
        a.box(L / 2 + 0.08, 0, 0, 0.18, 0.16, D, WD2, TIMBER);
        for (const s of [-1, 1]) { for (let k = 0; k <= 8; k++) a.box(x0 + 0.4 + k * 3.4, 0, s * (D / 2 - 0.12), 0.18, k <= 4 ? 1.0 : 0.6, 0.18, WD2, 0xb89a74);   // bollards: rope high on the landward half
            for (let k = 0; k < 4; k++) a.box(x0 + 0.4 + (k + 0.5) * 3.4, 0.82, s * (D / 2 - 0.12), 3.3, 0.05, 0.05, null, ROPE); }
        for (const q of [[x0 + 5.6, z0 + 0.5], [x0 + 5.6, -z0 - 0.5], [L / 2 - 1.2, z0 + 0.5], [L / 2 - 1.2, -z0 - 0.5]]) {         // the lamps
            a.cyl(q[0], 0, q[1], 0.07, 3.5, null, NAVY, { seg: 6, cap: false }); a.cyl(q[0], 3.5, q[1], 0.26, 0.34, null, CREAM, { glow: 0.9, seg: 8 }); a.cyl(q[0], 3.84, q[1], 0.32, 0.1, null, NAVY, { r2: 0.05, seg: 8 }); }
        const gxl = x0 + 1.3;                                                                                                // THE GATE
        for (const s of [-1, 1]) { a.box(gxl, 0, s * 2.7, 0.8, 4.4, 0.8, CORR, WHITE, { gain: 3.2, uv: [2.4, 2.4] }); a.box(gxl, 4.4, s * 2.7, 1.0, 0.16, 1.0, null, NAVY); a.cyl(gxl, 4.56, s * 2.7, 0.24, 0.32, null, CREAM, { glow: 0.9, seg: 8 }); }
        a.box(gxl, 3.3, 0, 0.3, 0.95, 5.4, null, NAVY);
        a.P.push({ s: 'quad', p: [r2(gxl + 0.16), 3.38, 0], size: [4.6, 0.8], ry: 270, key: 'txt:THE BEACH|#ffffff|#44669c|5.75||pacifico', uv: 'fit', kind: 'wall' });
        a.P.push({ s: 'quad', p: [r2(gxl - 0.16), 3.38, 0], size: [4.6, 0.8], ry: 90, key: 'txt:DISASTER CITY · BAYSIDE|#ffffff|#44669c|5.75||way', uv: 'fit', kind: 'wall' });
    });
    /* THE VOLLEYBALL COURT (the plan: "the lifeguard hut, chairs, the volleyball net"; Bayside's drawn net, districts/B.js B.net): a rope
       court 14 x 7 m on the flat sand south of the hut, the net across its middle */
    look('court', gx(14), gz(69.5), 0, a => {
        for (const s of [-1, 1]) { a.box(0, 0.02, s * 3.5, 14, 0.04, 0.07, null, NAVY); a.box(s * 7, 0.02, 0, 0.07, 0.04, 7, null, NAVY); }
        for (const s of [-1, 1]) a.cyl(0, 0, s * 4.0, 0.07, 2.5, null, NAVY, { seg: 8, cap: false });
        a.P.push({ s: 'quad', p: [0, 1.45, 0], size: [8, 1.0], ry: 90, key: U('MetalTruss1a'), kind: 'over', ds: true, uv: [0.5, 0.5], tint: WHITE });
        a.box(0, 2.43, 0, 0.05, 0.05, 8, null, WHITE);
    });
    for (let y = 68; y <= 70; y++) for (let x = 12; x <= 15; x++) taken.add(x + ':' + y);
    /* THE SURF: the swim flags at the waterline either side of the pier's foot (red over yellow), the black-ball board */
    [[17, 50], [17, 57]].forEach((q, i) => look('swimflag' + (i + 1), mx(q[0]), mz(q[1]), 270, a => {
        a.cyl(0, 0, 0, 0.05, 3.4, null, WHITE, { seg: 6 }); a.box(0.5, 2.95, 0, 0.95, 0.36, 0.03, null, RED, { ds: true }); a.box(0.5, 2.59, 0, 0.95, 0.36, 0.03, null, 0xffd23c, { ds: true }); }));
    /* THE TIDE POOLS (the plan: "rock pools, starfish"): hollows in the wet sand that the sea stands in, each ringed with rocks in `dress` */
    TIDE.forEach(q => feat({ k: 'dip', x: r2(gx(q[0])), z: r2(gz(q[1])), r: q[2], h: q[3] }));
},

place(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    [[10, OY + 2], [12, OY + 9], [14, OY + 20], [3, OY + 20], [9, OY + 21], [6, OY + 44], [10, OY + 40], [4, 30], [8, 26], [3, 22], [1, 18], [2, 90], [7, 94], [3, 100]].forEach(q => palm(q[0], q[1]));
    for (let y = 0; y < H; y++) for (let x = 0; x < 24; x++) if (cell[y][x] === 't' && (x + y) % 2 === 0) palm(x, y);                // THE PALMS: the three groves
    P('park_bench', 2, OY + 3, { face: 180 }); P('park_bench', 5, OY + 3, { face: 180 }); P('signpost', 8, OY + 5, { face: 90 }); P('city_bench', 2, OY + 7, { face: 0 }); dec('beach_ball', 9, OY + 8);
    P('surfboard_rack', 11, OY + 15, { face: 0 }); dec('surfboard_short', 12, OY + 17); dec('surfboard_fish', 13, OY + 16); P('campfire', 6, OY + 18); dec('folding_chair', 5, OY + 19); dec('folding_chair', 7, OY + 19); dec('beach_cooler', 7, OY + 17);
    P('pool_umbrella', 13, OY + 22); dec('pool_lounger', 14, OY + 22, { face: 90 }); P('pool_umbrella', 13, OY + 26); dec('pool_lounger', 14, OY + 26, { face: 90 }); dec('beach_ball', 12, OY + 24);
    P('lifeguard_chair', 18, OY + 27, { face: 90 }); dec('beach_life_ring', 17, OY + 31); dec('beach_swim_ring', 17, OY + 33); dec('beach_air_mattress_pink', 16, OY + 35);   // (moved off the volleyball court; the same throws)
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
    /* THE EXTERIOR PASS (2026-11-16), added at the END (the dice): the tide pools' rocks (the graveyard pack's grey rocks: the ocean pack's are
       black pillars on dry sand), a starfish or a crab in each pool */
    TIDE.forEach((q, i) => { const n = 4 + (i % 2); for (let k = 0; k < n; k++) { const t = (k / n) * Math.PI * 2 + i, rr = q[2] / 3.5 * 0.62;
            props.push({ key: 'psxg_rock_' + (1 + (k + i) % 4), x: r2(gx(q[0] + Math.cos(t) * rr)), z: r2(gz(q[1] + Math.sin(t) * rr)), face: Math.round(rnd() * 360) }); }
        props.push({ key: i % 2 ? 'ocean_crab' : 'ocean_starfish', x: r2(gx(q[0]) + 0.5), z: r2(gz(q[1]) - 0.4), y: -0.05, face: Math.round(rnd() * 360) }); });
},
};
