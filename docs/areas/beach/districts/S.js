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

   THE INSIDES (THE INTERIOR PASS, 11-16, seen on screen): each hut is lined (a coat in its own colour over a white board dado, a lit board
   ceiling, tie beams, daylit windows). SURF: the rack, a steel bench under the pegboard, boards and a net on the walls, the cool box.
   BEACH HUT: a bed, a bedside lamp, the chest, a rocking chair, a rug, a seascape. FLOATS: the counter and till, a cart of balls, a shelf,
   rings and air beds in stacks, paper lanterns. LIFEGUARD: the cot, the desk with the radio and the glasses, the tool chest, the board, rings.

   THE LIGHT (THE ATMOSPHERE PASS, 11-16, seen on screen; all drawn glow, no new real light): bulbs strung along each hut's porch and lamp
   to lamp down the Boardwalk, pennants under the gate, bamboo torches (the court's corners, the huts' fire, the Palms' bench, both camps,
   the foot of the Dunes path), a line of paper lanterns in the Palms, a lamp over the lifeguard's door and a red light on its roof.

   STILL MISSING:
   THE DRESSING (THE DRESSING PASS, 11-16, seen on screen): the North Headland (anchor, a boat pulled up, traps, the bench), the wild beach
   north (a camp, a boat on the wet sand), the Boardwalk (hot dog stand, bins), the Huts (the towel line, chairs, a bin), the Surf (toys adrift),
   the Palms (a bench, chairs, a guitar, the radio), the court's chairs and ball, THE DUNES (a ranch-rail path three squares wide, rows 76-78,
   up to the high bench and a second glass; dry scrub), the Sandbar's shells and seals, the fishermen's camp south (tent, fire ring, traps, a
   boat), the South Dunes (a chest half in the sand, a wrecked boat, a bottle).
   - NEEDS A MODEL (not stood in for): hammocks (the Palms), a windbreak, a sandcastle, gulls, coconuts, a surf-side shower. (Towels are
     drawn on a line; a towel lying on the sand still needs a model.)
   - NO HOOK FOR A DISTRICT: sound (the room has one bed, the shell's), particles (spray, gulls wheeling), night (the shell is day only).
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
    /* ── THE INTERIOR PASS (2026-11-16; seen first: a brown box under a black ceiling). A hut's inside is drawn in its own arch row, the city's
       way (districts/F-atmos.js): a coat 3.5 cm in front of each inner wall (the inner face stands 0.3 m in: a coat at the city's 0.27 is behind it, seen), a white board dado and its rail, a
       LIT plank ceiling under the roof slab (the hollow building's own ceiling draws black), two tie beams, daylit windows where the outside
       has them. `lit` lifts the coat out of the dark. THE SQUARES: a 2 x 2 hut has four squares, middles at (+-1.75, +-1.75) in its own frame;
       the door stands on the front-left one, which stays clear; what blocks stands on a square's middle, the rest stands off it or on a wall. ── */
    const inside = (a, w, d, h, tint, door, wins) =>   /* h = the height of the building's own ceiling, as SEEN (not the row's h) */
        { const W2 = w / 2, D2 = d / 2, e = 0.335, Hc = h, lit = { gain: 2.9, glow: 0.16, uv: [2.4, 2.4], kind: 'wall' };
        const Q = (x, y, z, qw, qh, ry, key, tn, o) => a.P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(qw), r2(qh)], ry, key, tint: tn }, o));
        const coat = (y0, hh, tn, o) => { Q(0, y0, -D2 + e, w - 2 * e, hh, 0, CORR, tn, o); Q(0, y0, D2 - e, w - 2 * e, hh, 180, CORR, tn, Object.assign({}, o, y0 < 2.2 ? { hole: [r2(-door.lx), r2(door.cw + 0.12), r2(2.25 - y0)] } : null));
            Q(-W2 + e, y0, 0, d - 2 * e, hh, 270, CORR, tn, o); Q(W2 - e, y0, 0, d - 2 * e, hh, 90, CORR, tn, o); };
        coat(1.0, Hc - 1.0, tint, lit); coat(0, 1.0, WHITE, Object.assign({}, lit, { gain: 3.2 }));
        const band = (y, bh, t, tn) => { const f = e + t / 2; a.box(0, y, -D2 + f, w - 2 * e, bh, t, null, tn); for (const s of [-1, 1]) a.box(s * (W2 - f), y, 0, t, bh, d - 2 * e, null, tn);
            a.box((-W2 + e + door.lx - door.cw / 2 - 0.1) / 2, y, D2 - f, door.lx - door.cw / 2 - 0.1 + W2 - e, bh, t, null, tn); a.box((door.lx + door.cw / 2 + 0.1 + W2 - e) / 2, y, D2 - f, W2 - e - door.lx - door.cw / 2 - 0.1, bh, t, null, tn); };
        band(0.14, 0.14, 0.05, 0xe8e0d0); band(0.98, 0.07, 0.06, 0xf4f0e6);
        a.box(0, Hc - 0.05, 0, w - 0.66, 0.04, d - 0.66, CORR, 0xfff6e2, { glow: 0.45, gain: 3.0, under: true, roof: true, top: false, ds: true, uv: [2.4, 2.4] });   // the lit ceiling: painted boards (a tint over the dark plank sheet stayed dark, seen)
        if (Hc >= 2.6) for (const z of [-1.75, 1.75]) a.box(0, Hc - 0.24, z, w - 0.6, 0.18, 0.16, WD2, 0xb89a74, { roof: true });                                       // tie beams
        (wins || []).forEach(q => { const [wl, al, y, ww, wh] = q, at = wl === 'f' ? [al, D2 - e - 0.03, 180] : wl === 'l' ? [-W2 + e + 0.03, al, 270] : wl === 'r' ? [W2 - e - 0.03, al, 90] : [al, -D2 + e + 0.03, 0];
            const nx = wl === 'l' ? 1 : wl === 'r' ? -1 : 0, nz = wl === 'b' ? 1 : wl === 'f' ? -1 : 0, side = wl === 'l' || wl === 'r';
            Q(at[0], y - 0.1, at[1], ww + 0.24, wh + 0.2, at[2], null, WHITE, { kind: 'wall' }); Q(at[0] + nx * 0.02, y, at[1] + nz * 0.02, ww, wh, at[2], GLS, 0xdcf0ff, { glow: 0.8, win: 'keep', uv: 'fit' });
            a.box(at[0] + nx * 0.04, y + wh / 2 - 0.03, at[1] + nz * 0.04, side ? 0.03 : ww, 0.06, side ? ww : 0.03, null, WHITE); a.box(at[0] + nx * 0.04, y, at[1] + nz * 0.04, side ? 0.03 : 0.06, wh, side ? 0.06 : 0.03, null, WHITE); }); };
    const door0 = B => B.door.lx;
    const FY = 0.14;                                                                                                          // the plank floor's top: every prop inside stands on it
    /* A PROP'S HEIGHT ON RAISED SAND (seen: the wall pieces stood on the roof, the hung rings and the table's radio lay on the floor): a prop's
       `y` under 1 is a lift over the ground under it; a `y` of 1 or more is a height over the ROOM's level 0, not over this sand (three-renderer.js
       THE TIER HEIGHT), so a thing hung 1.5 m up a hut wall is typed G + 1.5; and within about 0.4 m of a wall "the ground under it" is the wall
       row's top unless the prop says `floor: true`. G = the huts' sand (a level 1 plot's cap, bake-beach.js CAP[1]). */
    const G = 1.2;
    const In = (B, key, lx, lz, face, y, o) => { const yy = FY + (y || 0); put(B, key, lx, lz, Object.assign({ face: face || 0, floor: true, y: r2(yy < 1 ? yy : G + yy) }, o)); };
    /* ── THE ATMOSPHERE PASS (2026-11-16): what a district can give its own light with. All of it DRAWN glow (no new real light: the room
       already carries 20 lit props): strings of coloured bulbs, torches on bamboo, the lit lamps and windows of the passes before. The room's
       sky, fog, sound bed and day / night are the shell's = the tool's. ── */
    const BULBS = [0xffe2a8, 0xff6a5a, 0x5ad0ff, 0xffd23c, 0x7ae08a, 0xff8ad0];
    /* a string of bulbs from (x0, z0) to (x1, z1) at height y, one every `gap` metres, sagging `sag` in the middle */
    const bulbs = (a, x0, z0, x1, z1, y, gap, sag) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / (gap || 0.8)));
        for (let k = 0; k <= n; k++) { const t = k / n, dy = -(sag || 0) * 4 * t * (1 - t); a.cyl(x0 + (x1 - x0) * t, y + dy - 0.1, z0 + (z1 - z0) * t, 0.055, 0.11, null, BULBS[k % BULBS.length], { glow: 1, seg: 6 }); }
        const m = 4; for (let k = 0; k < m; k++) { const t0 = k / m, t1 = (k + 1) / m, tm = (t0 + t1) / 2, dy = -(sag || 0) * 4 * tm * (1 - tm), al = Math.abs(x1 - x0) > Math.abs(z1 - z0);
            a.box(x0 + (x1 - x0) * tm, y + dy, z0 + (z1 - z0) * tm, al ? L / m : 0.02, 0.02, al ? 0.02 : L / m, null, 0x2a2a2a); } };
    /* a torch on a bamboo pole: the flame is drawn glow */
    const torch = (a, x, z) => { a.cyl(x, 0, z, 0.04, 1.7, WD2, 0xd8b070, { seg: 6, cap: false }); a.cyl(x, 1.66, z, 0.1, 0.18, null, 0x3a2a1c, { r2: 0.07, seg: 8 }); a.cyl(x, 1.84, z, 0.08, 0.3, null, 0xff7a10, { r2: 0.01, seg: 6, glow: 0.8 }); };
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
        bulbs(a, -w / 2, d / 2 + 1.98, w / 2, d / 2 + 1.98, 2.56, 0.7, 0.12);                                                  // a string of bulbs along the porch
        inside(a, w, d, 2.68, [0xa8ecff, 0xfff0a0, 0xffc4b0][i], door, [['f', 1.95, 1.05, 1.3, 1.15], ['l', 0, 1.1, 1.2, 1.1], ['r', 0, 1.1, 1.2, 1.1]]);
    }));
    { const B = HUTS[0];   // THE SURF HUT: the rack, the shaping bench under the pegboard, boards on the walls, a net, the cool box
      In(B, 'surfboard_rack', -1.75, -1.75, 90); In(B, 'steel_table', 1.75, -1.75, 0); In(B, 'retro_radio', 1.5, -1.8, 200, 0.76); In(B, 'psx_glass_bottle_1', 2.2, -1.6, 0, 0.76); In(B, 'wooden_bucket', 2.6, -0.7, 0);
      In(B, 'tool_pegboard', 1.75, -3.02, 180, 1.25); In(B, 'surfboard_long', 2.95, 0.5, 285); In(B, 'surfboard_short', 0.1, -2.95, 10); In(B, 'surfboard_fish', -0.6, -2.95, 350);
      In(B, 'fishing_net_wall', -3.05, 0.9, 90, 0.9); In(B, 'beach_life_ring', 3.02, 2.2, 270, 1.5); In(B, 'beach_cooler', 2.4, 2.4, 30); In(B, 'folding_chair', 1.3, 2.3, 200); In(B, 'doormat', door0(B), 2.75, 0, 0.01); }
    { const B = HUTS[1];   // THE BEACH HUT: a bed, a chest, a rocking chair by the window, a rug, the radio, a seascape
      In(B, 'dorm_bed', -1.75, -1.75, 180); In(B, 'psx_bedside_table_1', -0.2, -2.8, 180); In(B, 'table_lamp', -0.2, -2.8, 0, 0.64); In(B, 'sea_chest', 1.75, -1.75, 180); In(B, 'retro_radio', 1.75, -1.75, 160, 0.7);
      In(B, 'rocking_chair', 1.75, 1.75, 215); In(B, 'rug_round', 0.2, 0.3, 0, 0.02); In(B, 'railway_lantern', -2.8, 0.2, 0); In(B, 'painting_seascape', 1.4, -3.05, 180, 1.35); In(B, 'wall_shelf', -3.06, 1.0, 90, 1.5); In(B, 'psx_glass_bottle_2', -2.96, 1.0, 0, 1.52);
      In(B, 'hook_rail', 3.06, 2.4, 270, 1.6); In(B, 'beach_ball', 2.7, -0.4, 0); In(B, 'doormat', door0(B), 2.75, 0, 0.01); }
    { const B = HUTS[2];   // THE FLOAT HUT: the counter and its till, a cart of balls, a shelf, rings and air beds in stacks, paper lanterns
      In(B, 'form_counter', 1.75, 1.75, 270); In(B, 'cash_register', 1.75, 1.75, 270, 1.15); In(B, 'ball_cart', -1.75, -1.75, 20); In(B, 'psx_shelf_mp_2', 1.75, -1.75, 180);
      [0, 0.29, 0.58].forEach(y => In(B, 'beach_swim_ring', 2.6, 0.1, 0, y)); In(B, 'beach_air_mattress_blue', -0.2, -2.6, 90); In(B, 'beach_air_mattress_pink', -0.2, -2.6, 90, 0.25); In(B, 'beach_ball', -2.7, 0.2, 0); In(B, 'beach_ball', 0.4, -1.2, 40);
      In(B, 'beach_life_ring', -3.02, -0.9, 90, 1.5); In(B, 'beach_life_ring', -3.02, 0.9, 90, 1.5); In(B, 'price_tag', -2.6, 2.5, 150); [[-1.4, 0.4], [0.3, 0.9], [1.4, -0.3]].forEach(q => In(B, 'paper_lantern', q[0], q[1], 0, 1.9)); In(B, 'doormat', door0(B), 2.75, 0, 0.01); }
    /* THE LIFEGUARD HUT (the Shore's landmark, walk-in): white boards, a red band, a red roof with its name on a board to the sea, a railed
       veranda, the red cross, the red-over-yellow flag */
    GUARD = building('lifeguard', [B_GUARD[0], B_GUARD[1], B_GUARD[0] + 2, B_GUARD[1] + 2, 'E'], 3.2, { leaf: 'leaf_beige_wood' }, (a, w, d, door) => {
        wall(a, w, 3.2, d, WHITE, door);
        a.box(0, 0, 0, w - 0.1, 0.14, d - 0.1, FLR, 0xc8b490, { uv: [1.75, 1.75] });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.26, 3.2, 0.26, null, RED);
        for (const sg of [-1, 1]) { a.box(0, 2.62, sg * (d / 2 + 0.06), w + 0.16, 0.32, 0.05, null, RED); a.box(sg * (w / 2 + 0.06), 2.62, 0, 0.05, 0.32, d + 0.16, null, RED); }   // the red band under the eaves (four strips: one box across the hut was the inside's dark ceiling, seen)
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
        a.box(door.lx, 2.42, d / 2 + 0.2, 0.5, 0.14, 0.22, null, 0xfff0c8, { glow: 1 });                                         // the lamp over the door
        a.cyl(0, 5.2, 0, 0.16, 0.26, null, 0xff3a30, { glow: 1, seg: 8 });                                                      // the red light on the roof's point
        inside(a, w, d, 2.5, 0xfff4e4, door, [['f', 2.0, 1.05, 1.3, 1.15]]);   // (its ceiling stands at 2.5, the huts' at 2.68: seen, a deck at 2.63 was hidden above it)
    });
    { const B = GUARD;   // THE LIFEGUARD HUT: the cot, the desk with the radio and the glasses, the board, rings, the extinguisher, rope, the tool chest
      In(B, 'cot', -1.75, -1.75, 0); In(B, 'tanker_desk', 1.75, -1.75, 180); In(B, 'field_radio', 1.5, -1.85, 190, 0.76); In(B, 'item_binoculars', 2.2, -1.6, 40, 0.76); In(B, 'folding_chair', 1.75, -0.6, 0);
      In(B, 'tool_chest', -0.1, -2.75, 180); In(B, 'notice_board', -3.07, 0.9, 90, 1.2); In(B, 'wall_clock', 0.9, -3.07, 180, 1.9); In(B, 'beach_life_ring', -3.02, -0.9, 90, 1.5); In(B, 'beach_life_ring', 3.02, -1.0, 270, 1.5);
      In(B, 'fire_extinguisher', 3.04, 0.6, 270, 0.9); In(B, 'clipboard', 3.07, 2.5, 270, 1.4); In(B, 'meshy_rope', 2.6, 2.6, 0); In(B, 'surfboard_long', -2.95, 2.4, 80); In(B, 'water_cooler', -2.75, -0.1, 90); In(B, 'doormat', door0(B), 2.75, 0, 0.01); }
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
        for (const sg of [-1, 1]) bulbs(a, x0 + 5.6, sg * (D / 2 - 0.5), L / 2 - 1.2, sg * (D / 2 - 0.5), 3.3, 1.0, 0.45);       // THE ATMOSPHERE PASS: bulbs strung lamp to lamp, both sides
        for (let k = -4; k <= 4; k++) a.box(gxl + 0.2, 2.92, k * 0.5, 0.02, 0.36, 0.3, null, [RED, 0xffd23c, 0x24a8a0, WHITE][(k + 4) % 4], { ds: true });   // pennants under the gate's beam
    });
    /* THE VOLLEYBALL COURT (the plan: "the lifeguard hut, chairs, the volleyball net"; Bayside's drawn net, districts/B.js B.net): a rope
       court 14 x 7 m on the flat sand south of the hut, the net across its middle */
    look('court', gx(14), gz(69.5), 0, a => {
        for (const s of [-1, 1]) { a.box(0, 0.02, s * 3.5, 14, 0.04, 0.07, null, NAVY); a.box(s * 7, 0.02, 0, 0.07, 0.04, 7, null, NAVY); }
        for (const s of [-1, 1]) a.cyl(0, 0, s * 4.0, 0.07, 2.5, null, NAVY, { seg: 8, cap: false });
        a.P.push({ s: 'quad', p: [0, 1.45, 0], size: [8, 1.0], ry: 90, key: U('MetalTruss1a'), kind: 'over', ds: true, uv: [0.5, 0.5], tint: WHITE });
        a.box(0, 2.43, 0, 0.05, 0.05, 8, null, WHITE);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) torch(a, sx * 7.6, sz * 4.1);                                       // THE ATMOSPHERE PASS: a torch at each corner
    });
    for (let y = 68; y <= 70; y++) for (let x = 12; x <= 15; x++) taken.add(x + ':' + y);
    /* THE SURF: the swim flags at the waterline either side of the pier's foot (red over yellow), the black-ball board */
    [[17, 50], [17, 57]].forEach((q, i) => look('swimflag' + (i + 1), mx(q[0]), mz(q[1]), 270, a => {
        a.cyl(0, 0, 0, 0.05, 3.4, null, WHITE, { seg: 6 }); a.box(0.5, 2.95, 0, 0.95, 0.36, 0.03, null, RED, { ds: true }); a.box(0.5, 2.59, 0, 0.95, 0.36, 0.03, null, 0xffd23c, { ds: true }); }));
    /* THE TOWEL LINE east of the huts (drawn: the game has no towel model): two posts, a rope, four towels on it */
    look('towels', mx(11), gz(48), 0, a => { for (const sg of [-1, 1]) a.cyl(0, 0, sg * 2.6, 0.06, 2.0, WD2, 0xb89a74, { seg: 6 }); a.box(0, 1.9, 0, 0.03, 0.03, 5.2, null, ROPE);
        [[-1.8, RED, WHITE], [-0.6, 0x24a8a0, WHITE], [0.6, 0xffd23c, NAVY], [1.8, 0xff4a70, WHITE]].forEach(q => { a.box(0, 0.8, q[0], 0.02, 1.1, 0.8, null, q[1], { ds: true }); for (const y of [1.0, 1.35, 1.7]) a.box(0, y, q[0], 0.03, 0.09, 0.8, null, q[2], { ds: true }); }); });
    /* THE ATMOSPHERE PASS: torches where people sit at dusk (the huts' fire, the Palms' bench, both camps, the foot of the Dunes path) and a
       line of paper lanterns in the Palms (the lanterns are props, hung at G + their height: see `In`) */
    look('torch-huts', mx(6), mz(54), 0, a => { torch(a, -4.6, 1.2); torch(a, 4.6, 1.2); });
    look('torch-palms', mx(6), mz(63), 0, a => { torch(a, 0.4, -2.6); torch(a, 0.4, 2.6);
        for (const sg of [-1, 1]) a.cyl(3.4, 0, sg * 5.2, 0.07, 3.1, WD2, 0xb89a74, { seg: 6 }); a.box(3.4, 3.0, 0, 0.03, 0.03, 10.4, null, ROPE); });
    [-3.6, -1.2, 1.2, 3.6].forEach(dz => props.push({ key: 'paper_lantern', x: r2(mx(6) + 3.4), z: r2(mz(63) + dz), y: r2(G + 2.28), floor: true }));
    look('torch-camp-n', mx(5), mz(33), 0, a => torch(a, 1.9, -1.6));
    look('torch-camp-s', mx(7), mz(88), 0, a => torch(a, 1.7, -1.5));
    look('torch-dunes', gx(11.6), gz(77.5), 0, a => { torch(a, 0, -5.6); torch(a, 0, 5.6); });
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
    /* ── THE DRESSING PASS (2026-11-16), all at the END (the dice). Every plot gets a reason to walk to it; only models the game has.
       Blockers (P) on a square's middle, the rest (dec) off it. ── */
    /* THE NORTH HEADLAND: where the fishing boats are pulled up under the rock; a bench to look out to the Volcano Island */
    P('ship_anchor', 1, 16, { face: 30 }); P('rowboat', 3, 20, { face: 40 }); dec('lobster_traps', 2, 19); dec('lobster_traps', 4, 21); P('park_bench', 5, 23, { face: 90 }); dec('fallen_log', 2, 23); dec('wooden_bucket', 4, 20); dec('ocean_crab', 5, 22);
    /* the two no-name plots north (the wild beach): a camp in the lee of the palms, a boat on the wet sand */
    P('camping_tent', 3, 33, { face: 120 }); dec('meshy_campfire_ring', 5, 33); dec('folding_chair', 6, 33); dec('folding_chair', 5, 34); dec('instrument_guitar_lying', 4, 34); dec('beach_cooler', 6, 34);
    P('rowboat', 13, 33, { face: 100 }); dec('lobster_traps', 12, 31); dec('fallen_log', 10, 29); dec('ocean_conch', 12, 30); dec('ocean_starfish', 11, 34);
    /* THE BOARDWALK: the hot dog stand and the bins on the sand beside the boards */
    P('hot_dog_stand', 7, 43, { face: 0 }); P('city_bin', 4, 43); P('city_bin', 7, 39); dec('folding_chair', 8, 43); dec('beach_ball', 6, 44);
    /* THE TIDE POOLS: a bucket, shells */
    dec('wooden_bucket', 14, 42); dec('ocean_conch', 16, 43); dec('ocean_sand_dollar', 13, 39); dec('ocean_sand_dollar_2', 17, 37);
    /* THE BEACH HUTS: a bin, boards against the surf hut's porch, chairs out front */
    P('city_bin', 1, 53); dec('surfboard_long', 1, 52, { floor: true }); dec('folding_chair', 6, 53); dec('folding_chair', 9, 53); dec('beach_swim_ring', 10, 52); dec('wooden_bucket', 4, 53);
    /* THE SURF: toys adrift where the bathers wade */
    afloat('beach_air_mattress_blue', 20, 51, { y: -0.5, hover: 0.55, face: 70 }); afloat('beach_swim_ring', 21, 57, { y: -0.5, hover: 0.53 }); afloat('beach_ball', 19, 50, { y: -0.5, hover: 0.58 });   // (a thing that is not a `float` prop rides the surface as y -0.5 + hover: a small y is a lift over the SEA BED)
    /* THE PALMS: a bench and chairs in the shade, a guitar, the radio on the cool box */
    P('iron_garden_bench', 6, 63, { face: 90 }); dec('folding_chair', 7, 66); dec('folding_chair', 6, 67); dec('instrument_guitar_lying', 7, 67); P('beach_cooler', 1, 66); props.push({ key: 'retro_radio', x: mx(1), z: mz(66), y: 0.56, face: 100 }); dec('beach_ball', 2, 61);
    /* THE LIFEGUARD HUT: chairs by the court (the plan's "chairs"), the ball, a rescue board against the hut, a bin */
    dec('folding_chair', 13, 71); dec('folding_chair', 15, 71); props.push({ key: 'beach_ball', x: r2(gx(13) + 1.2), z: r2(gz(69.5) + 0.8), face: 0 }); P('city_bin', 17, 64); dec('surfboard_long', 14, 64, { floor: true });
    /* THE DUNES: a fenced path up to the high bench and its glass; dry scrub on the dunes (the graveyard pack's bushes) */
    feat({ k: 'rail', x0: gx(11), z0: gz(76), x1: gx(5), z1: gz(76), model: 'ranch' }); feat({ k: 'rail', x0: gx(11), z0: gz(79), x1: gx(5), z1: gz(79), model: 'ranch' });
    P('park_bench', 3, 77, { face: 90 }); P('brass_telescope', 3, 78, { face: 90 }); dec('fallen_log', 8, 74);
    [[2, 73], [6, 75], [9, 81], [4, 82], [10, 73], [1, 80], [7, 87], [3, 86], [9, 90], [5, 92], [1, 95], [4, 98], [0, 103], [2, 100]].forEach((q, i) => dec('psxg_dead_bush_' + (1 + i % 2), q[0], q[1]));
    /* THE SANDBAR: more of the low-water life out on the bar */
    dec('ocean_starfish', 16, 78); dec('ocean_conch', 21, 78); dec('ocean_seal_resting', 22, 78); dec('ocean_crab', 14, 79); dec('ocean_sand_dollar_3', 18, 77);
    /* the two no-name plots south: the fishermen's camp in the dunes above the rocks */
    P('camping_tent', 5, 88, { face: 60 }); dec('meshy_campfire_ring', 7, 88); dec('fallen_log', 7, 89); dec('lobster_traps', 9, 86); dec('lobster_traps', 10, 87); dec('wooden_bucket', 6, 90); P('rowboat', 12, 84, { face: 20 });
    /* THE SOUTH DUNES: where the sand runs out: a chest half in the sand, a wrecked boat, a bottle at the tide line */
    P('sea_chest', 1, 101, { face: 140, y: -0.25 }); P('meshy_rowboat', 1, 99, { face: 200 }); dec('psx_glass_bottle_1', 2, 101); dec('fallen_log', 4, 96); dec('ocean_conch', 3, 99);
},
};
