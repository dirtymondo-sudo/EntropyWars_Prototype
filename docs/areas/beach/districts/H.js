/* THE BEACH · THE HARBOUR (district H, 8 plots: the Quay, the Breakwater, the Long Pier, the Flying Dutchman's berth) — the district file (2026-11-16).
   Part of `node bake-beach.js` (its one hook). Notes: docs/notes/areas-complexes.md "THE BEACH ON PLOTS" (+ its THE REAL DUTCHMAN and
   ALONGSIDE lines) + "THE BEACH, THE DISTRICT FILES".

   THE PLOTS (docs/areas/beach/layout.json):
     P02-03  The Quay (level 1): the stone quay, crates, nets
     P03-03  The Breakwater (level 1): the long rock arm
     P02-04  The Long Pier (level 1): the pier from the beach out to the ship
     P03-04  The Flying Dutchman (level 1): LANDMARK: the ship at the pier head; four decks inside  [the plan's way out: inside: the Flying Dutchman; the hold hatch: Atlantis]
     P02-05  The Skiff (level 0): the skiff that crosses to the island
     P03-05  The Channel (level 0): the marked channel out
     P02-06  The Harbour Mouth (level 0): open water, buoys
     P03-06  The Roads (level 0): open water where ships wait

   WHAT STANDS HERE TODAY: the stone QUAY (0.9 m, cobbles) with the QUAY SHED (walk-in, tarred boards, tin roof, barn doors, HARBOUR sign;
   squares 26-28 x 39-41, front south; crates, traps, a net, an anchor, the outboard, wheel and bell inside); freight on the quay (a
   container, a pallet, the forklift, a cable drum, sandbags, a gun); the BREAKWATER (rock, 1.6 m) with the harbour light on its head and
   rocks at its foot; the LONG PIER from the sand east to square 56 (lamps, rings, traps, a lobster, a crate, a chest); the skiff afloat at
   her jetty's end; the Channel's four red buoys; a dolphin, a turtle, a tuna. People: pirate (Quay), homosapien (Long Pier).
   THE FLYING DUTCHMAN IS THE TOOL'S, NOT THIS FILE'S: her berth (ctx.SHIP, squares 35-68 x 56-69, she runs out into the Ocean's plots), the
   pier's length (ctx.PIER_END), the gangway (ctx.GANG, link `beach_dutchman`) and `terrain.moored` are shared pieces. She is drawn by
   three-renderer.js _hqBuildMoored from her own deck room. Moving or redressing her = a note on the board first.

   MISSING / NEVER SEEN ON SCREEN (from the notes + the board):
   - Seen 11-15: the real ship at the pier and the Quay shed draw. NOT seen since she was berthed ALONGSIDE: whether the gangway reads as a
     way aboard, the pier's new length and its dressing, the freight on the quay, the shed's inside, how the hard steps (pier sides, the
     quay wall) are textured.
   - Not carried over from the old Harbour room (the plan does not draw them): the wharves, the gantry, the slipway, the water steps.
   - The Dutchman's bulwarks, deck stairs, crates and cannon are her deck room's rows and are not drawn at the berth; she is not redesigned
     (the world plan wants her rebuilt inside and out: not this file's job without mondo's word).
   - The Harbour Mouth and the Roads are empty water ("ships wait" there: no ships). No kelp (4.5 m tall in 3.5 m of water).
   - No residents with routines, no fight set up.
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
const B_SHED = [26, 39];   // the plan's building squares (north-west corner): the Quay Shed, 3 x 3
let SHED;
module.exports = {
tailor(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    setRect(29, 65, 31, 68, 'w');                               // THE SKIFF: the plan's block is the boat herself (a prop afloat at the jetty's end)
    setRect(B_SHED[0], B_SHED[1], B_SHED[0] + 3, B_SHED[1] + 3, 'o');
},

build(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* THE QUAY SHED (walk-in): tarred boards, a tin roof, wide doors onto the quay; crates, nets and pots inside */
    SHED = building('shed', [B_SHED[0], B_SHED[1], B_SHED[0] + 3, B_SHED[1] + 3, 'S'], 4.2, { leaf: 'leaf_barn', leafDouble: true, floorIn: U('WoodFlooring1a') }, (a, w, d, door) => {
        const TAR = 0x4a4038, TRIM = 0xd8d0bc;
        a.shell(w, 4.2, d, WD, TAR, door, [3.5, 1.75]);
        a.box(0, 0, 0, w - 0.1, 0.14, d - 0.1, U('WoodFlooring1a'), 0x8a7c68, { uv: [1.75, 1.75] });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.3, 4.2, 0.3, WD2, TRIM);
        a.roof('gable', 0, 4.2, 0, w + 0.8, 2.4, d + 0.8, COR, 0x6a7078, { keyEnd: WD, tintEnd: TAR });
        a.frame(door, d, WD2, TRIM);
        a.sign('HARBOUR', door.lx, 2.9, d / 2 + 0.08, 3.4, 0.7, '#e8e0c8', '#2a2622', 'stencil');
    });
    put(SHED, 'lobster_traps', -3.6, -3.4, { face: 0 }); put(SHED, 'fishing_net_wall', 0, -5.0, { y: 1.4, face: 0 }); put(SHED, 'psx_wooden_crate_1', 3.6, -3.6); put(SHED, 'psx_wooden_crate_2', 3.8, -1.8); put(SHED, 'psx_metal_barrel_mp_1', -3.8, -0.6);
    put(SHED, 'ship_anchor', 3.4, 2.6, { face: 110 }); put(SHED, 'railway_lantern', -3.8, 3.4); put(SHED, 'meshy_rope', -1.6, -3.8); put(SHED, 'sea_chest', -3.6, 1.6, { face: 90 });
},

place(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    P('psx_wooden_crate_3', 24, OY + 2); P('psx_wooden_crate_1', 25, OY + 2); P('psx_metal_barrel_mp_2', 31, OY + 3); P('ship_anchor', 30, OY + 5, { face: 110 }); dec('dockring', 32, OY + 6); dec('dockring', 24, OY + 6); P('railway_lantern', 30, OY + 6);
    dec('cardboard_boxes', 28, OY + 10); dec('sea_chest', 33, OY + 17); dec('folding_chair', 26, OY + 18, { face: 200 }); P('railway_lantern', 24, OY + 17); P('railway_lantern', 36, OY + 18); dec('dockring', 29, OY + 23); dec('dockring', 29, OY + 27);
    props.push({ key: 'skiff', x: mx(31), z: mz(OY + 28), y: 0.32, face: 0 });                                                       // THE SKIFF, afloat at her jetty's end
    props.push({ key: 'lighthouse', x: mx(46), z: mz(OY + 10), face: 0 });                                                           // THE HARBOUR LIGHT on the breakwater's head (the old Harbour's)
    [[30, OY + 38], [24, OY + 38], [30, OY + 47], [24, OY + 47]].forEach(q => afloat('sea_buoy', q[0], q[1]));                        // THE CHANNEL: two pairs of red buoys
    swimmer('ocean_dolphin', 26, OY + 40, { swim: { r: 6, v: 2.2, bob: 0.35 } }); swimmer('ocean_turtle', 42, OY + 44, { swim: { r: 4, v: 0.7, bob: 0.1 } }); swimmer('ocean_tuna', 30, OY + 42, { swim: { r: 6, v: 1.6, bob: 0.2 } });
    native('pirate', 29, OY + 6, 180, sayOf(O_HARB, 'pirate')); native('homosapien', 34, OY + 18, 150, sayOf(O_HARB, 'homosapien'));
},

dress(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* the Harbour: freight on the quay (a container, a pallet, the forklift, a cable drum, sandbags: the quay floods), a gun on the quay's corner,
       the shed's outboard and wheel, lamps and rings down the pier's new length, a lobster on the boards, rocks at the mole's foot */
    props.push({ key: 'ind_container', x: mx(32), z: gz(OY + 4), face: 0 }); taken.add('32:' + (OY + 3)); taken.add('32:' + (OY + 4));
    P('wrapped_pallet', 30, OY + 3); P('forklift', 29, OY + 2, { face: 90 }); dec('cable_drum', 25, OY + 4); dec('meshy_sandbags', 24, OY + 5); dec('meshy_sandbags', 25, OY + 5); dec('meshy_sandbags', 24, OY + 3);
    P('ship_cannon', 26, OY + 2, { face: 90 }); put(SHED, 'outboard_motor', -3.6, 3.6, { face: 0 }); put(SHED, 'ship_wheel', 4.9, 0, { y: 1.7, face: 270 }); put(SHED, 'ships_bell', -4.9, -2.0, { y: 1.9, face: 90 });
    [42, 47, 55].forEach(x => P('railway_lantern', x, 53)); [40, 45, 50, 54].forEach(x => dec('dockring', x, 54)); dec('ocean_lobster', 44, 53, { anim: false }); dec('psx_wooden_crate_2', 49, 53); dec('sea_chest', 56, 54); dec('lobster_traps', 41, 53);
    feat({ k: 'scatter', key: 'ocean_rock_8', n: 10, x: mx(42), z: mz(OY + 4), r: 22, seed: 63, sea: true });   // (no kelp: 4.5 m tall in 3.5 m of water)
},
};
