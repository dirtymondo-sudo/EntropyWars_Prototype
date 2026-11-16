/* THE ESTATE · THE RANCH (district R, the south-east nine: plots x 3..5 · y 3..5, squares sx 36..71 · sy 36..71, level 1, the
   Windmill 2). Repo tooling only: bake-estate.js loads this file through its one hook (THE DISTRICT FILES) and writes the room
   `site_prebuilt_skinwalker_estate` into data.js. One thread works this file; nobody else edits it.
   THE PLOTS (docs/areas/estate/layout.json):
     P03-03  The Pasture            level 1  open grass, cows
     P04-03  The Windmill           level 2  LANDMARK: the windmill
     P05-03  The Hay Field          level 1  bales
     P03-04  The Paddock            level 1  fenced ring, horses
     P04-04  The Barn               level 1  the barn (inside: new)
     P05-04  The Farmhouse          level 1  the farmhouse, porch (inside: new)
     P03-05  The Ranch Gate         level 1  gate, cattle grid
     P04-05  The Yard               level 1  chicken coop, trough
     P05-05  The Cow Field          level 1  cows, a fence out to the desert road
   WHAT STANDS HERE TODAY (passes 1 + 2 of 5, the exteriors and the insides, 2026-11-16; notes: docs/notes/areas-complexes.md "THE ESTATE, DISTRICT R"):
     THE BARN (walk-in: a gambrel tin roof, barn red boards on a stone footing, white trim, sliding doors, the hayloft door under its hoist beam, a cupola
     and weathervane, a lean-to on posts down the east wall with the mower under it), the grain silo beside it (`ind_silo`), THE FARMHOUSE (walk-in: white
     boards, green shingles, a gable over the door, sashed windows with shutters, a railed porch, a smoking chimney), the Yard's hen house and its picket hen
     run, the water tower (`water_tower_west`), the trough and hand pump, THE WINDMILL (`decor_windpump_tower` + wheel) and its stock tank, the Paddock's ring
     rail with its gate, three horses and a trough, the Pasture's cows, trough and a trailer, the Hay Field's bales + a truck + a scarecrow, the kitchen garden
     and the picket fence by the farmhouse, THE RANCH GATE (two posts, a beam, the board RANCH, two leaves swung back) on the track from the
     house (squares 36 x 63..64), two trailers, the Cow Field's fence, tank, cows and the COW SHED (walked into), chickens, two people: a cowboy, a goatman.
   MISSING / WAITING:
     - INSIDE (pass 2): the Barn has a hayloft (seen, not climbed: no stair model fits and no procedural stairs), stalls, pens, a feed store, a wagon;
       the Farmhouse a kitchen, a dining corner, a living room by the hearth and a bedroom. Neither has an upstairs.
     - no cattle grid at the gate (the plan names one): drawn flat it lay under the track; it wants a model.
     - the cowboy has no line (his old line named the three gates, which are gone); the goatman has none (lines are mondo's).
     - the Cow Field's "fence out to the desert road" leads nowhere: no door to the Desert exists (a way out = the tool's, mondo's call; not added).
     - Room 512's stable door `bay` (the Yard's south wall) and the Lodge's saloon door by the farmhouse porch are the tool's.
     - no residents with routines, no encounter table (mondo's baked tables), night not seen on screen yet (pass 4).
     - NEEDS A MODEL (nothing on R2): a tractor, a plough, a wheelbarrow, a pitchfork, a saddle on a rack, a pig, a goat, a rooster, a duck, a beehive, a
       dog kennel, a mailbox on a post, a clothes line, sunflowers / wheat (the bus-stop pack's `Wheat` is not on the game bucket), a cattle skull.
   THE HOOKS (bake-estate.js "THE DISTRICT FILES"; a file exports any of these, each is called with this district's own ctx):
     plan(ctx)    first of all: change the plan's squares (ctx.setRect(x0, y0, x1, y1, ch); 'c' = corn, anything else is walked).
     houses(ctx)  the main buildings (ctx.building: a hollow texbuilding + its drawn look; ctx.put: a prop in a building's own frame).
     sheds(ctx)   the out-buildings (same helpers).
     pieces(ctx)  drawn pieces on open ground (ctx.look) + their rows; ctx.flat(x0, y0, x1, y1) levels the ground under one.
     water(ctx)   pools, decks, rocks in the water.
     dress(ctx)   everything else: props (ctx.P on a square, ctx.dec off its middle), trees, rails, people (ctx.native), animals.
   ctx = { d, C, N, G, W, HALF, gx, gc, r2, PLAN, plot, cell, setRect, open, distAt, feat, props, npc, taken, building, put, look, sheet,
           windows, SOLID, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, P, dec, tree, native, rail, rnd, flat, sayOf, O_FIELDS, O_GROUNDS, BUILT }.
   Squares are (sx 0..72 west to east, sy 0..72 north to south); gx() = a square's west / north line in metres, gc() = its middle.
   ctx.rnd / ctx.dec throw THIS district's own dice, so nothing here moves another district's pieces. Row ids start 'est:'.
   NOT YOURS (the tool's, shared: a note on docs/notes/claims.md before anyone touches them): the corn wall and the pines on it, the levels,
   the paint rule, the sky and shell, the ways out (the Woods gate, the house's front door, `bay`, `bay13`, the well, the Lodge door).
   Rules for district threads: docs/notes/areas-complexes.md "THE ESTATE, THE DISTRICT FILES". Rebake: `node bake-estate.js`. */
'use strict';
let BARN = null, FARM = null;   // the two walk-ins' handles (houses), used again by dress
/* THE LOOK (zone kit, district H's rules): white woodwork = no sheet + a pale colour (a tint only darkens a sheet), iron 0x1c1c20, lamps amber 0xff9a30 at glow 0.7,
   lit windows 0xf0c868 at 0.6, dark ones 0x2a3040. The Ranch's own: barn red on boards with `gain`, tin roofs, weathered grey timber for the yard's fittings. */
const WHITE = 0xece6d8, IRON = 0x1c1c20, AMBER = 0xff9a30, LIT = 0xf0c868, DARK = 0x2a3040, TIMBER = 0x9a8468, TINC = 0xb4babc, WATER = 0x4a7890;
const LAMP = { glow: 0.7 }, GW = { gain: 1.9 };   // GW: weathered timber = the board sheet lifted (the trim sheet draws near black)
module.exports = {
    /* THE PLAN: dirt under the barn's lean-to and the cow shed, a worn path from the barn's track to the farmhouse door */
    plan(ctx) { const { setRect } = ctx;
        setRect(36, 63, 38, 65, 'p'); setRect(58, 51, 60, 55, 'p'); setRect(67, 70, 70, 72, 'p'); setRect(55, 58, 66, 59, 'p'); setRect(65, 57, 66, 58, 'p');
    },
    houses(ctx) { const { building, put, feat, r2, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT } = ctx;
        const TB = 0xa08a6a;                                                                                                   // the insides' timber
        const inb = (B, key, lx, lz, o) => put(B, key, lx, lz, Object.assign({ floor: true }, o || {}));                         // a prop on a walk-in's own floor
        const wallIn = (B, x0, z0, x1, z1, h) => { const p = B.at(x0, z0), q = B.at(x1, z1); feat({ k: 'wall', x0: p[0], z0: p[1], x1: q[0], z1: q[1], t: 0.25, h: h || 1.5, ghost: true, rail: false }); };   // the walker's block under a drawn partition
        const G1 = 1.75;                                                                                                       // the Ranch's ground over level 0 (a row's y of 1 m and over is a height over level 0)
        /* THE BARN (walk-in). PASS 1: a GAMBREL roof (two steep tin slopes + a low cap, the ridge front to back), barn red boards on a stone footing, white corner
           boards and belts, two big sliding doors on their rail, the hayloft door under a hoist beam, a louvre in the peak, windows down both long walls, a cupola with
           a weathervane, a lean-to on posts down the east wall. */
        BARN = building('barn', [51, 50, 58, 56, 'S'], 5.25, { leaf: 'leaf_barn', leafDouble: true, floorIn: 'dirt_2', keyIn: WD, storeys: 1 }, (a, w, d, door) => {
            const RED = 0xb8402f, DRED = 0x8a3226, TIN = 0x6a6e70, G = { gain: 1.7 }, f = d / 2, h2 = w / 2, lx = door.lx, H = 5.25, BX = 6.6, LOW = 4.6, CAP = 2.6;
            a.shell(w, H, d, WD, RED, door, [3.5, 1.75], G);
            a.box(0, 0, 0, w + 0.3, 0.5, d + 0.3, 'castle_wall', 0x8a8478, { faces: 'blr', top: false });                                          // the stone footing, open across the doors
            for (const s of [-1, 1]) { const x0 = s < 0 ? -h2 - 0.15 : lx + 3.6, x1 = s < 0 ? lx - 3.6 : h2 + 0.15; a.box((x0 + x1) / 2, 0, f + 0.1, x1 - x0, 0.5, 0.12, 'castle_wall', 0x8a8478); }
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * h2, 0.5, sz * f, 0.36, H - 0.5, 0.36, null, WHITE);                      // corner boards
            for (const sz of [-1, 1]) a.box(0, H - 0.12, sz * (f + 0.08), w + 0.3, 0.24, 0.14, null, WHITE);                                        // the belt under the gable
            /* the gambrel: the two steep slopes (a shed each, its high edge to the middle), the wall between them front and back, the low cap */
            const half = h2 + 0.4, span = half - BX;
            a.roof('shed', -(half + BX) / 2, H, 0, d + 0.12, LOW, span, COR, TIN, Object.assign({ ry: 90, keyEnd: WD, tintEnd: RED }, G));
            a.roof('shed', (half + BX) / 2, H, 0, d + 0.12, LOW, span, COR, TIN, Object.assign({ ry: 270, keyEnd: WD, tintEnd: RED }, G));
            a.box(0, H, 0, BX * 2, LOW, d + 0.12, WD, RED, Object.assign({ faces: 'fb', top: false, uv: [3.5, 1.75], roof: true }, G));
            a.roof('gable', 0, H + LOW, 0, d + 0.12, CAP, BX * 2 + 0.5, COR, TIN, Object.assign({ ry: 90, keyEnd: WD, tintEnd: RED }, G));
            for (const sz of [-1, 1]) a.box(0, H + LOW - 0.1, sz * (f + 0.1), BX * 2 + 0.3, 0.2, 0.12, null, WHITE, { roof: true });               // the belt at the roof's break
            /* the two sliding doors, run back either side of the doorway on their rail: red boards in white frames */
            for (const sd of [-1, 1]) { const cx = lx + sd * 2.2, z = f + 0.07;
                a.box(cx, 0.05, z, 2.3, 3.0, 0.08, WD, DRED, G);
                for (const y of [0.05, 1.5, 2.93]) a.box(cx, y, z + 0.05, 2.3, 0.14, 0.06, null, WHITE);
                for (const dx of [-1.08, 1.08]) a.box(cx + dx, 0.05, z + 0.05, 0.14, 3.0, 0.06, null, WHITE); }
            a.box(lx, 3.1, f + 0.16, 7.4, 0.12, 0.12, null, IRON); a.frame(door, d, null, WHITE);
            /* the hayloft door, its hoist beam and hook, the louvre in the peak */
            a.box(lx, H + 0.5, f + 0.09, 2.3, 2.5, 0.08, WD, DRED, Object.assign({ roof: true }, G));
            for (const y of [H + 0.45, H + 1.7, H + 2.95]) a.box(lx, y, f + 0.14, 2.5, 0.14, 0.07, null, WHITE, { roof: true });
            for (const dx of [-1.2, 0, 1.2]) a.box(lx + dx, H + 0.45, f + 0.14, 0.14, 2.6, 0.07, null, WHITE, { roof: true });
            a.box(lx, H + 3.5, f + 0.8, 0.24, 0.24, 1.9, WD2, 0x6a5038, { roof: true }); a.cyl(lx, H + 2.9, f + 1.55, 0.03, 0.6, null, IRON, { roof: true }); a.box(lx, H + 2.75, f + 1.55, 0.18, 0.16, 0.08, null, IRON, { roof: true });
            a.box(lx, H + LOW + 0.5, f + 0.09, 1.1, 1.1, 0.08, SHUT, 0xd8d2c4, { uv: 'fit', faces: 'f', top: false, roof: true });
            a.box(lx, H + LOW + 0.4, f + 0.13, 1.4, 0.12, 0.1, null, WHITE, { roof: true }); a.box(lx, H + LOW + 1.6, f + 0.13, 1.4, 0.12, 0.1, null, WHITE, { roof: true });
            /* windows: two on the front, four down each long wall (dark glass in white frames) */
            const winF = (x, y, sz) => { a.box(x, y, sz * (f + 0.06), 1.1, 1.1, 0.08, GLS, DARK, { glow: 0.05 }); for (const dy of [-0.12, 1.1]) a.box(x, y + dy, sz * (f + 0.1), 1.4, 0.12, 0.12, null, WHITE); for (const dx of [-0.6, 0, 0.6]) a.box(x + dx, y, sz * (f + 0.1), 0.1, 1.1, 0.1, null, WHITE); };
            const winS = (z, y, sx) => { a.box(sx * (h2 + 0.06), y, z, 0.08, 1.1, 1.1, GLS, DARK, { glow: 0.05 }); for (const dy of [-0.12, 1.1]) a.box(sx * (h2 + 0.1), y + dy, z, 0.12, 0.12, 1.4, null, WHITE); for (const dz of [-0.6, 0, 0.6]) a.box(sx * (h2 + 0.1), y, z + dz, 0.1, 1.1, 0.1, null, WHITE); };
            winF(-8.75, 1.5, 1); winF(8.75, 1.5, 1); winF(-6.1, 1.5, -1); winF(6.1, 1.5, -1);
            for (const z of [-7, -2.33, 2.33, 7]) { winS(z, 1.6, -1); if (Math.abs(z) > 7.5) winS(z, 1.6, 1); }
            a.box(0, 0.05, -f - 0.07, 3.2, 3.0, 0.08, WD, DRED, G); for (const y of [0.05, 1.5, 2.93]) a.box(0, y, -f - 0.12, 3.2, 0.14, 0.06, null, WHITE); for (const dx of [-1.55, 0, 1.55]) a.box(dx, 0.05, -f - 0.12, 0.14, 3.0, 0.06, null, WHITE);   // the back doors (shut)
            /* the cupola on the ridge and its weathervane */
            const RY = H + LOW + CAP;
            a.box(0, RY - 0.5, 0, 1.9, 1.7, 1.9, null, WHITE, { roof: true }); a.box(0, RY + 0.1, 0, 2.0, 0.8, 1.2, SHUT, 0xd8d2c4, { uv: 'fit', top: false, roof: true }); a.box(0, RY + 0.1, 0, 1.2, 0.8, 2.0, SHUT, 0xd8d2c4, { uv: 'fit', top: false, roof: true });
            a.roof('pyramid', 0, RY + 1.2, 0, 2.6, 1.3, 2.6, COR, TIN, G); a.cyl(0, RY + 2.5, 0, 0.04, 1.1, null, IRON, { roof: true }); a.box(0, RY + 3.3, 0, 1.0, 0.07, 0.05, null, IRON, { roof: true }); a.box(0.35, RY + 3.25, 0, 0.3, 0.3, 0.04, null, IRON, { roof: true });
            /* the lean-to down the east wall: a tin roof on five posts, open on three sides (squares 58..59 x 51..54) */
            const LX = h2 + 3.5, LZ = -1.75;
            a.roof('shed', LX, 3.0, LZ, 14.4, 1.3, 7.2, COR, TIN, Object.assign({ ry: 270 }, G));
            a.box(h2 + 6.75, 0, LZ - 7, 0.26, 3.0, 0.26, WD, TIMBER, { n: 5, step: [0, 0, 3.5], gain: 1.9 }); a.box(h2 + 6.75, 2.85, LZ, 0.2, 0.22, 14.4, WD, TIMBER, GW);
            a.box(LX, 2.9, LZ - 7, 7.0, 0.16, 0.16, WD, TIMBER, { n: 5, step: [0, 0, 3.5], gain: 1.9 });
            /* THE INSIDE (pass 2): a lit plank ceiling under the black one, tie beams, the HAYLOFT over the back two rows of squares on four posts with its rail,
               three stalls down the west wall and two pens down the east (partitions on the squares' lines, half-open gates), mangers, lanterns on the posts */
            a.box(0, 4.85, 0, w - 0.3, 0.06, d - 0.3, FLR, 0xc8b490, { sides: false, top: false, under: true, glow: 0.5, gain: 1.6 });   // under the walk-in's own (black) ceiling, which hangs some 0.3 m under the wall's top
            a.box(0, 4.55, -7, w - 0.3, 0.28, 0.28, WD, TB, { n: 5, step: [0, 0, 3.5], gain: 1.9 });
            a.box(0, 2.9, -6.95, w - 0.3, 0.16, 6.9, FLR, 0x9a8468, { under: true }); a.box(0, 2.72, -3.5, w - 0.3, 0.32, 0.26, WD, TB, GW);
            for (const x of [-8.75, -5.25, 5.25, 8.75]) { a.box(x, 0, -3.5, 0.28, 2.72, 0.28, WD, TB, GW); a.box(x, 2.0, -3.28, 0.16, 0.24, 0.16, null, AMBER, LAMP); a.box(x, 2.24, -3.28, 0.2, 0.05, 0.2, null, IRON); }
            for (const x of [-8.75, 8.75]) a.box(x, 0, 3.5, 0.28, H - 0.2, 0.28, WD, TB, GW);
            a.box(0, 3.96, -3.5, w - 0.3, 0.08, 0.1, WD, TB, GW); a.box(-11.9, 3.06, -3.5, 0.08, 0.9, 0.08, WD, TB, { n: 18, step: [1.4, 0, 0], gain: 1.9 });
            for (const sx of [-1, 1]) { const zs = sx < 0 ? [-7, -3.5, 0, 3.5] : [-7, -3.5, 0];
                for (const z of zs) a.box(sx * 10.5, 0, z, 3.4, 1.5, 0.12, WD, TB, GW);
                for (let i = 0; i < zs.length - 1; i++) { const z0 = zs[i]; a.box(sx * 8.75, 0, z0 + 1.1, 0.12, 1.5, 2.2, WD, TB, GW); a.box(sx * 8.15, 0.2, z0 + 2.3, 1.2, 1.1, 0.07, WD, TB, GW);
                    a.box(sx * 11.85, 0.55, z0 + 1.75, 0.5, 0.35, 1.7, WD, TB, GW); } }
        });
        { const zsW = [-7, -3.5, 0, 3.5], zsE = [-7, -3.5, 0];
          for (const z of zsW) wallIn(BARN, -12.2, z, -8.75, z); for (const z of zsE) wallIn(BARN, 8.75, z, 12.2, z);
          for (let i = 0; i < 3; i++) wallIn(BARN, -8.75, zsW[i], -8.75, zsW[i] + 2.2); for (let i = 0; i < 2; i++) wallIn(BARN, 8.75, zsE[i], 8.75, zsE[i] + 2.2); }
        /* the Barn's things: horses in two stalls, straw in the third, the hay store in the north-west corner, cows in the two pens, the feed store, the tools,
           a wagon under the loft, bales up on the loft, the ladder, a hoist, the one real lamp */
        inb(BARN, 'horse_brown', -10.4, -5.25, { face: 90 }); inb(BARN, 'horse', -10.4, -1.75, { face: 90 }); inb(BARN, 'hw_straw', -11.2, 1.2, { face: 90 }); inb(BARN, 'hw_straw_2', -10.6, 2.6); inb(BARN, 'wooden_bucket', -9.5, 2.9); inb(BARN, 'wooden_bucket', -9.4, -4.2);
        for (const q of [[-11.5, -9.8, 0, 0], [-10.1, -9.8, 0, 0], [-11.5, -9.1, 0, 0], [-10.1, -9.1, 0, 0], [-11.5, -8.2, 0, 90], [-10.8, -9.5, 0.86, 0], [-10.8, -8.8, 0.86, 0]]) put(BARN, q[2] ? 'hw_straw_2' : 'hw_straw', q[0], q[1], q[2] ? { y: G1 + q[2], face: q[3] } : { floor: true, face: q[3] });
        inb(BARN, 'cow', 10.4, -5.25, { face: 270 }); inb(BARN, 'cow', 10.4, -1.75, { face: 270 }); inb(BARN, 'wooden_bucket', 9.4, -0.7);
        inb(BARN, 'meshy_burlap_sack', 10.4, 1.2); inb(BARN, 'meshy_burlap_sack', 11.4, 2.0); inb(BARN, 'meshy_burlap_sack', 10.6, 2.9); inb(BARN, 'meshy_burlap_sack', 11.5, 3.9); put(BARN, 'meshy_burlap_sack', 10.9, 2.0, { y: G1 + 0.55 });
        inb(BARN, 'psx_metal_barrel_mp_1', 11.3, 5.6); inb(BARN, 'psx_metal_barrel_mp_3', 10.2, 6.2); inb(BARN, 'psx_wooden_crate_1', 9.6, 8.6); inb(BARN, 'psx_wooden_crate_2', 11.0, 8.9); inb(BARN, 'psx_wooden_crate_4', 10.3, 7.6); inb(BARN, 'platform_scale', 9.4, 4.4, { face: 270 });
        inb(BARN, 'tool_chest', 11.3, -9.4, { face: 270 }); inb(BARN, 'tire_stack', 9.6, -9.6); inb(BARN, 'psx_jerrycan_1', 9.3, -8.4); inb(BARN, 'psx_car_battery_1', 10.4, -8.2); inb(BARN, 'covered_wagon', 1.6, -8.0, { face: 0 }); inb(BARN, 'hw_shovel', -3.6, -9.6, { face: 30 });
        inb(BARN, 'meshy_rope', -6.6, -9.4); inb(BARN, 'broom', -7.9, 9.9); inb(BARN, 'wooden_bucket', -6.9, 9.4); inb(BARN, 'library_ladder', 6.9, -2.9, { face: 180 }); inb(BARN, 'cat', 3.4, 6.2, { face: 220 }); inb(BARN, 'chicken', -3.2, 4.4, { face: 60 }); inb(BARN, 'chicken', 5.2, 1.6, { face: 300 });
        for (let i = 0; i < 9; i++) { const x = -10.4 + i * 2.5; put(BARN, i % 2 ? 'hw_straw_2' : 'hw_straw', x, -8.9, { y: G1 + 3.06, face: 0 }); if (i % 3 !== 1) put(BARN, 'hw_straw', x + 0.3, -7.9, { y: G1 + 3.06, face: 90 }); if (i % 2 === 0) put(BARN, 'hw_straw_2', x, -8.9, { y: G1 + 3.92, face: 0 }); }
        put(BARN, 'chain_hoist', 1.4, -3.0, { y: G1 + 2.6 }); put(BARN, 'psx_ceiling_lamp_1_on', 0, 3.5, { y: G1 + 4.38 }); put(BARN, 'psx_cobweb_1', -11.4, 9.6, { y: G1 + 4.2 }); put(BARN, 'psx_cobweb_2', 11.4, 9.4, { y: G1 + 4.2 });
        /* THE FARMHOUSE (walk-in). PASS 1: white boards on a stone footing, a green shingle roof with a gable over the door, sashed windows with green shutters (three
           lit), white porch posts and rails, a brick chimney that smokes. */
        FARM = building('farmhouse', [63, 51, 69, 56, 'S'], 3.5, { leaf: 'leaf_white_wood', keyIn: WD }, (a, w, d, door) => {
            const WALL = 0xe6e0d0, GREEN = 0x4a6048, SHUTC = 0x3a5a44, f = d / 2, h2 = w / 2, lx = door.lx;
            a.shell(w, 3.5, d, WD, WALL, door, [3.5, 1.75], { gain: 2.2 });
            a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75] });
            a.box(0, 0, 0, w + 0.24, 0.4, d + 0.24, 'castle_wall', 0x8a8478, { faces: 'blr', top: false });
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * h2, 0, sz * f, 0.3, 3.5, 0.3, null, WHITE);
            a.roof('gable', 0, 3.5, 0, w + 1.0, 3.2, d + 1.0, SHG, GREEN, { keyEnd: WD, tintEnd: WALL });
            a.roof('gable', lx, 3.5, f - 1.2, 5.4, 2.0, 5.6, SHG, GREEN, { ry: 90, keyEnd: WD, tintEnd: WALL });                                       // the gable over the door
            a.box(lx, 3.75, f + 1.53, 0.9, 0.9, 0.06, GLS, LIT, { glow: 0.6, roof: true }); a.box(lx, 3.65, f + 1.56, 1.2, 0.1, 0.08, null, WHITE, { roof: true }); a.box(lx, 4.65, f + 1.56, 1.2, 0.1, 0.08, null, WHITE, { roof: true });
            a.frame(door, d, null, WHITE);
            /* a sash window on a face: glass, white frame and bars, green shutters */
            const win = (face, u, lit) => { const fb = face === 'f' || face === 'b', sg = (face === 'f' || face === 'r') ? 1 : -1, base = fb ? f : h2, y = 1.0, hh = 1.5, ww = 1.2;
                const B = (du, y0, dn, su, sh, sn, key, tint, x) => fb ? a.box(u + du, y0, sg * (base + dn), su, sh, sn, key, tint, x) : a.box(sg * (base + dn), y0, u + du, sn, sh, su, key, tint, x);
                B(0, y, 0.07, ww, hh, 0.08, GLS, lit ? LIT : DARK, { glow: lit ? 0.6 : 0.05 }); B(0, y - 0.12, 0.13, ww + 0.4, 0.12, 0.26, null, WHITE); B(0, y + hh, 0.11, ww + 0.3, 0.14, 0.2, null, WHITE);
                B(-ww / 2 - 0.05, y, 0.1, 0.1, hh, 0.1, null, WHITE); B(ww / 2 + 0.05, y, 0.1, 0.1, hh, 0.1, null, WHITE); B(0, y, 0.12, 0.05, hh, 0.04, null, WHITE); B(0, y + hh * 0.5, 0.12, ww, 0.05, 0.04, null, WHITE);
                B(-ww / 2 - 0.38, y, 0.1, 0.46, hh, 0.06, WD, SHUTC); B(ww / 2 + 0.38, y, 0.1, 0.46, hh, 0.06, WD, SHUTC); };
            [-8.75, -5.25, 3.5, 7.0].forEach((x, i) => win('f', x, i === 1 || i === 2)); [-7, -2.33, 2.33].forEach(x => win('b', x, false));
            [-5.25, 0, 5.25].forEach((z, i) => { win('l', z, i === 0); win('r', z, false); });
            /* the porch: its floor, white posts and rails (open at the door's bay), its own roof */
            a.box(0, 0, f + 1.75, w, 0.16, 3.4, FLR, 0x8c7a62);
            const px = i => -h2 + 0.25 + i * (w - 0.5) / 6;
            for (let i = 0; i <= 6; i++) { if (Math.abs(px(i) - lx) < 0.9) continue; a.box(px(i), 0, f + 3.25, 0.2, 2.8, 0.2, null, WHITE); }
            for (const i of [0, 1, 4, 5]) { const x0 = px(i), x1 = px(i + 1), L = x1 - x0; a.box((x0 + x1) / 2, 0.95, f + 3.25, L, 0.08, 0.1, null, WHITE); a.box((x0 + x1) / 2, 0.3, f + 3.25, L, 0.06, 0.08, null, WHITE);
                a.box(x0 + 0.28, 0.3, f + 3.25, 0.05, 0.65, 0.05, null, WHITE, { n: Math.floor(L / 0.28) - 1, step: [0.28, 0, 0] }); }
            for (const s of [-1, 1]) { a.box(s * (h2 - 0.25), 0.95, f + 1.7, 0.1, 0.08, 3.1, null, WHITE); a.box(s * (h2 - 0.25), 0.3, f + 1.7, 0.08, 0.06, 3.1, null, WHITE); a.box(s * (h2 - 0.25), 0.3, f + 0.4, 0.05, 0.65, 0.05, null, WHITE, { n: 10, step: [0, 0, 0.28] }); }
            a.roof('shed', 0, 2.8, f + 1.85, w + 0.6, 0.7, 3.8, SHG, GREEN);
            a.box(lx, 2.3, f + 3.1, 0.2, 0.3, 0.2, null, AMBER, LAMP); a.cyl(lx, 2.6, f + 3.1, 0.02, 0.25, null, IRON);                               // the porch lamp
            a.box(6.6, 0, -f - 0.5, 1.6, 7.4, 1.1, BRK, 0x9a6a58, { roof: true }); a.box(6.6, 0, -f + 0.75, 2.2, 1.5, 0.9, BRK, 0x9a6a58); a.box(6.6, 7.4, -f - 0.5, 1.8, 0.2, 1.3, 'castle_wall', 0x8a8478, { roof: true });   // the chimney, its hearth inside
            /* THE INSIDE (pass 2): a white ceiling under the black one, the bedroom's two walls (east front corner, its doorway the square by the front wall), the
               kitchen's wall and counter (west back corner), the mantel over the hearth, ceiling beams */
            const PW = 0xd8d0bc, PG = { gain: 2.0 };
            a.box(0, 3.06, 0, w - 0.3, 0.06, d - 0.3, null, 0xe8e2d4, { sides: false, top: false, under: true, glow: 0.25 });
            a.box(0, 2.85, -5.25, w - 0.3, 0.22, 0.22, WD, TB, { n: 4, step: [0, 0, 3.5], gain: 1.9 });
            a.box(3.5, 0, 3.5, 0.14, 3.06, 3.5, WD, PW, PG); a.box(7.0, 0, 1.75, 7.0, 3.06, 0.14, WD, PW, PG);
            a.box(-8.75, 0, -1.75, 3.5, 3.06, 0.14, WD, PW, PG); a.box(-5.25, 0, -1.75, 3.5, 0.95, 0.6, WD, TB, GW); a.box(-5.25, 0.95, -1.75, 3.6, 0.06, 0.7, 'castle_wall', 0xb8b2a6);
            a.box(6.6, 1.5, -f + 1.3, 2.8, 0.12, 0.5, WD, TB, GW); a.box(6.6, 0, -f + 1.25, 2.4, 0.06, 1.0, 'castle_wall', 0x8a8478);
        });
        wallIn(FARM, 3.5, 1.75, 3.5, 5.25, 3); wallIn(FARM, 3.5, 1.75, 10.4, 1.75, 3); wallIn(FARM, -10.4, -1.75, -7, -1.75, 3); wallIn(FARM, -7, -1.75, -3.5, -1.75, 1);
        /* the Farmhouse's things. KITCHEN (west back): range, sink, shelf, a work table, the bread rack, pots; DINING (west front): the table and four chairs, a
           cabinet, the radio; LIVING (by the hearth): the fire, a sofa, two armchairs, a low table, the TV, shelves; BEDROOM (east front): bed, wardrobe, carpet */
        inb(FARM, 'kitchen_range', -9.6, -8.0, { face: 0 }); inb(FARM, 'sink', -7.8, -8.15, { face: 0 }); inb(FARM, 'psx_shelf_mp_2', -5.4, -8.2, { face: 0 }); inb(FARM, 'bread_rack', -9.9, -4.2, { face: 90 }); inb(FARM, 'psx_table_large_2', -6.6, -5.0);
        put(FARM, 'stock_pots', -5.25, -1.75, { y: G1 + 1.01 }); put(FARM, 'pot_rack', -7.6, -6.2, { y: G1 + 2.4 }); inb(FARM, 'psx_plate_mp_1', -6.9, -5.1, { y: 0.8 }); inb(FARM, 'coffee_mug', -6.2, -4.8, { y: 0.8 }); inb(FARM, 'broom', -10.1, -2.4); inb(FARM, 'mop_bucket', -4.2, -8.0);
        inb(FARM, 'psx_dinner_table_1', -7.0, 3.5); inb(FARM, 'psx_chair_mp_1', -7.0, 1.9, { face: 0 }); inb(FARM, 'psx_chair_mp_1', -7.0, 5.1, { face: 180 }); inb(FARM, 'psx_chair_mp_1', -8.8, 3.5, { face: 90 }); inb(FARM, 'psx_chair_mp_1', -5.2, 3.5, { face: 270 });
        inb(FARM, 'psx_display_cabinet_mp_1', -9.9, 0.4, { face: 90 }); inb(FARM, 'retro_radio', -9.8, 7.6); inb(FARM, 'psx_plate_mp_1', -7.4, 3.3, { y: 0.8 }); inb(FARM, 'psx_plate_mp_1', -6.6, 3.8, { y: 0.8 }); inb(FARM, 'potted_plant', -9.9, 6.2);
        inb(FARM, 'hearth_fire', 6.6, -7.75); inb(FARM, 'psx_sofa_1', 6.6, -3.2, { face: 180 }); inb(FARM, 'psx_armchair_1', 3.2, -5.6, { face: 90 }); inb(FARM, 'psx_armchair_2', 9.7, -5.6, { face: 270 }); inb(FARM, 'psx_coffee_table_1', 6.6, -5.3); inb(FARM, 'rug_round', 6.6, -5.2, { y: 0.17 });
        inb(FARM, 'psx_tv_table_1', 0.2, -8.1, { face: 0 }); inb(FARM, 'psx_tv_mp_1', 0.2, -8.1, { y: 0.62, face: 0 }); inb(FARM, 'psx_shelf_mp_3', -2.4, -8.2, { face: 0 }); inb(FARM, 'cat', 4.6, -6.6, { face: 140 }); inb(FARM, 'footlocker', 9.8, -1.0, { face: 90 });
        put(FARM, 'candle', 5.9, -7.45, { y: G1 + 1.63 }); put(FARM, 'psx_clock_1', 7.3, -7.45, { y: G1 + 1.63 }); inb(FARM, 'doormat', -0.87, 7.9); inb(FARM, 'umbrella_stand', 0.9, 8.2); inb(FARM, 'rifle_rack', 2.9, -1.2, { face: 90 });
        inb(FARM, 'psx_bed_1', 8.4, 5.6, { face: 270 }); inb(FARM, 'psx_bedside_table_1', 9.8, 3.0); inb(FARM, 'psx_lamp_1_on', 9.8, 3.0, { y: 0.62, noLight: true }); inb(FARM, 'psx_wardrobe_mp_1', 4.6, 2.5, { face: 0 }); inb(FARM, 'psx_carpet_mp_1', 6.6, 5.9, { y: 0.17 }); inb(FARM, 'footlocker', 6.4, 8.0);
        put(FARM, 'psx_ceiling_lamp_1_on', 0, 0, { y: G1 + 2.9 }); put(FARM, 'psx_ceiling_lamp_1_on', -7, -5.2, { y: G1 + 2.9, noLight: true });
        put(FARM, 'rocking_chair', -7.6, 10.4, { face: 180 }); put(FARM, 'dog', 5.2, 10.6, { face: 200 }); put(FARM, 'railway_lantern', 9.4, 10.2);
        put(FARM, 'chimney_smoke', 6.6, -9.25, { y: 1.75 + 7.7 });
    },
    sheds(ctx) { const { building, SOLID, WD, WD2, COR, SHUT, GLS } = ctx;
        /* THE COOP: the hen house in the Yard (a low shed, not walked into). PASS 1: pale boards, a red door, white trim, wire windows, the hens' hatch and its ramp */
        building('coop', [56, 67, 59, 70, 'W'], 2.8, SOLID, (a, w, d) => { const f = d / 2, BOARD = 0xd8c8a0, G = { gain: 2.1 };
            a.box(0, 0, 0, w + 0.1, 2.8, d + 0.1, WD, BOARD, Object.assign({ top: false, uv: [3.5, 1.75] }, G)); a.roof('shed', 0, 2.8, 0, w + 0.8, 1.2, d + 0.8, COR, 0x6a6e70, { ry: 180, keyEnd: WD, tintEnd: BOARD, gain: 1.7 });
            for (const sx of [-1, 1]) a.box(sx * w / 2, 0, f, 0.26, 2.8, 0.26, null, WHITE);
            a.box(-3.0, 0, f + 0.07, 1.1, 2.1, 0.08, WD, 0x8a3226, G); for (const y of [0, 1.0, 2.0]) a.box(-3.0, y, f + 0.12, 1.1, 0.12, 0.06, null, WHITE); for (const dx of [-0.55, 0.55]) a.box(-3.0 + dx, 0, f + 0.12, 0.1, 2.1, 0.06, null, WHITE);   // the keeper's door (shut)
            a.box(1.2, 0.45, f + 0.07, 0.8, 0.8, 0.08, null, 0x1a1410); a.box(1.2, 0, f + 0.9, 0.8, 0.42, 1.7, WD, TIMBER, GW);                        // the hens' hatch and its ramp block
            for (const x of [-0.6, 3.6]) { a.box(x, 1.5, f + 0.06, 1.3, 0.8, 0.08, SHUT, 0xc8c0b0, { uv: 'fit', faces: 'f', top: false }); a.box(x, 1.38, f + 0.11, 1.6, 0.12, 0.14, null, WHITE); a.box(x, 2.3, f + 0.11, 1.6, 0.12, 0.14, null, WHITE); }
            a.box(3.4, 0.6, f + 0.5, 2.6, 0.7, 0.9, WD, BOARD, G); a.roof('shed', 3.4, 1.3, f + 0.5, 2.8, 0.3, 1.1, COR, 0x6a6e70, { gain: 1.7 }); a.box(2.3, 0, f + 0.5, 0.1, 0.6, 0.1, WD, TIMBER, { n: 2, step: [2.2, 0, 0], gain: 1.9 });   // the nest box on its legs
        });
    },
    pieces(ctx) { const { gx, gc, r2, feat, sheet, look, taken, WD, WD2, COR, GLS } = ctx;
        const blk = (x0, z0, x1, z1, t, h) => feat({ k: 'wall', x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), t: t || 0.3, h: h || 1.1, ghost: true, rail: false });
        /* THE FITTINGS: every small drawn piece of the yards in ONE row (a handful of draw calls); `hug` lays each corner on the ground under it, so a piece on the
           Windmill's slope or at the gate stands right. Parts are written in the room's own metres. */
        const a = sheet(), OX = gc(54), OZ = gc(62), X = v => r2(v - OX), Z = v => r2(v - OZ);
        const box = (x, y, z, w, h, d, key, tint, o) => a.box(X(x), y, Z(z), w, h, d, key, tint, o), cyl = (x, y, z, r, h, key, tint, o) => a.cyl(X(x), y, Z(z), r, h, key, tint, o);
        const water = (x, y, z, w, d) => a.P.push({ s: 'quad', flat: true, p: [X(x), y, Z(z)], size: [w, d], key: GLS, tint: WATER, glow: 0.12 });
        /* a plank trough on legs, 2.6 m, long along x ('x') or z ('z'); it blocks */
        const trough = (x, z, al) => { const T = (dx, dz, sx, sz, y, h, tint) => al === 'x' ? box(x + dx, y, z + dz, sx, h, sz, WD, tint, GW) : box(x + dz, y, z + dx, sz, h, sx, WD, tint, GW);
            for (const s of [-1, 1]) { T(0, s * 0.32, 2.6, 0.07, 0.28, 0.42, TIMBER); T(s * 1.27, 0, 0.07, 0.7, 0.28, 0.42, TIMBER); for (const e of [-1, 1]) T(s * 1.05, e * 0.27, 0.1, 0.1, 0, 0.3, 0x7a6a54); }
            T(0, 0, 2.6, 0.64, 0.24, 0.06, TIMBER); if (al === 'x') water(x, 0.62, z, 2.46, 0.56); else water(x, 0.62, z, 0.56, 2.46);
            if (al === 'x') blk(x - 1.3, z, x + 1.3, z, 0.7, 0.7); else blk(x, z - 1.3, x, z + 1.3, 0.7, 0.7); };
        /* a round galvanised stock tank, 2.6 m across; it blocks */
        const tank = (x, z, r) => { cyl(x, 0, z, r, 0.75, COR, TINC, { ri: r - 0.07, seg: 18, cap: false }); cyl(x, 0, z, r - 0.07, 0.6, GLS, WATER, { glow: 0.12, seg: 18 }); cyl(x, 0.72, z, r + 0.03, 0.05, COR, TINC, { ri: r - 0.09, seg: 18 });
            blk(x - r, z, x + r, z, r * 1.7, 0.8); };
        /* a timber gate leaf (five rails, two stiles, a brace board) hinged at (x, z), lying along +z (dz 1) or -z (-1) or along x (dx) */
        const leaf = (x, z, dx, dz, L) => { const mx = x + dx * L / 2, mz = z + dz * L / 2, sw = dx ? L : 0.07, sd = dz ? L : 0.07;
            for (const y of [0.25, 0.5, 0.75, 1.0, 1.25]) box(mx, y, mz, sw, 0.09, sd, WD, TIMBER, GW);
            for (const t of [0.04, 0.5, 0.96]) box(x + dx * L * t, 0.2, z + dz * L * t, 0.1, 1.2, 0.1, WD, TIMBER, GW); };
        const post = (x, z, h, t) => box(x, 0, z, t, h, t, WD, 0x8a7052, GW);
        /* THE RANCH GATE on the district's line (the track from the house comes in on squares 34..35 x 63..64, so the gate stands at 36 x 63..64): two tall posts, the beam over the track with its board, the two leaves swung back
           along the rail. NO CATTLE GRID: drawn flat on the ground it lay UNDER the track here (the drawn ground by the corn's bank stands some 0.6 m over the
           height a hugging row is given); it wants a model or a level site (listed) */
        { const GX = gx(36), Z0 = gx(63), Z1 = gx(65), ZM = gx(64);
          post(GX, Z0, 5.4, 0.42); post(GX, Z1, 5.4, 0.42); box(GX, 4.9, ZM, 0.34, 0.34, 8.2, WD, 0x8a7052, GW); box(GX, 5.24, ZM, 0.5, 0.08, 8.6, WD, 0x7a6a54, GW);
          for (const s of [-1, 1]) { cyl(GX, 4.25, ZM + s * 1.5, 0.02, 0.65, null, IRON); }
          box(GX, 3.45, ZM, 0.1, 0.85, 3.7, WD, 0x7a6048, GW);
          a.sign('RANCH', X(GX - 0.06), 3.5, Z(ZM), 3.5, 0.75, '#efe6d0', '#5a4028', 'fell', { ry: 90 }); a.sign('RANCH', X(GX + 0.06), 3.5, Z(ZM), 3.5, 0.75, '#efe6d0', '#5a4028', 'fell', { ry: 270 });
          leaf(GX + 0.35, Z0 - 0.2, 0, -1, 3.3); leaf(GX + 0.35, Z1 + 0.2, 0, 1, 3.3);
          blk(GX, Z0 - 0.2, GX, Z0 + 0.2, 0.45, 2); blk(GX, Z1 - 0.2, GX, Z1 + 0.2, 0.45, 2); }
        /* THE YARD: the trough with its hand pump by the hen run, the chopping place */
        { trough(gc(51), gc(63), 'x'); const px = gc(51) + 1.75, pz = gc(63);
          cyl(px, 0, pz, 0.07, 1.0, null, IRON); box(px, 1.0, pz, 0.16, 0.22, 0.16, null, IRON); box(px - 0.22, 1.02, pz, 0.34, 0.06, 0.06, null, IRON); box(px + 0.3, 1.16, pz, 0.6, 0.05, 0.05, null, IRON); box(px, 0, pz, 0.7, 0.06, 0.7, 'castle_wall', 0x8a8478);
          taken.add('51:63'); }
        /* THE PADDOCK: its gate (one square, the leaf swung in), a trough inside the ring */
        { const z = gc(58); post(gx(42), z, 1.5, 0.18); post(gx(43), z, 1.5, 0.18); leaf(gx(43), z - 0.12, 0, -1, 3.3); trough(gc(45), gc(54), 'z'); taken.add('45:54'); }
        /* THE WINDMILL's stock tank and the pipe from the pump; THE COW FIELD's tank; THE PASTURE's trough */
        { tank(gc(56), gc(42), 1.3); box(gx(55) + 0.2, 0.3, gc(41) + 0.6, 3.2, 0.07, 0.07, null, IRON); cyl(gx(55) + 1.75, 0, gc(41) + 0.6, 0.04, 0.34, null, IRON); taken.add('56:42');
          tank(gc(62), gc(66), 1.3); taken.add('62:66'); trough(gc(43), gc(41), 'x'); taken.add('43:41'); }
        feat({ k: 'arch', id: 'est:ranchfittings:look', x: OX, z: OZ, rot: 0, hug: true, parts: a.P });
        /* THE COW SHED in the Cow Field (squares 67..69 x 70..71): three boarded walls, a tin roof, open to the north; walked into */
        { const cx = gx(68.5), cz = gx(71), w = 10.5, d = 7;
          look('cowshed', cx, cz, 0, s => { const BOARD = 0xb89a70, G = { gain: 2.0 };
              s.box(0, 0, d / 2 - 0.08, w, 2.5, 0.16, WD, BOARD, Object.assign({ uv: [3.5, 1.75] }, G)); for (const sx of [-1, 1]) s.box(sx * (w / 2 - 0.08), 0, 0, 0.16, 2.9, d, WD, BOARD, Object.assign({ uv: [3.5, 1.75] }, G));
              s.box(-w / 2 + 0.13, 0, -d / 2 + 0.13, 0.26, 3.3, 0.26, WD, TIMBER, { n: 4, step: [(w - 0.26) / 3, 0, 0], gain: 1.9 }); s.box(0, 3.2, -d / 2 + 0.13, w, 0.2, 0.22, WD, TIMBER, GW);
              s.roof('shed', 0, 2.5, 0, w + 0.8, 1.0, d + 0.9, COR, 0x6a6e70, { gain: 1.7, keyEnd: WD, tintEnd: BOARD }); });
          blk(cx - w / 2, cz + d / 2, cx + w / 2, cz + d / 2, 0.3, 2.4); blk(cx - w / 2, cz - d / 2, cx - w / 2, cz + d / 2, 0.3, 2.4); blk(cx + w / 2, cz - d / 2, cx + w / 2, cz + d / 2, 0.3, 2.4); }
    },
    dress(ctx) { const { gx, gc, r2, feat, props, taken, put, P, dec, tree, native, rail, rnd, flat } = ctx;
        props.push({ key: 'decor_windpump_tower', x: gx(54), z: gx(41), h: 11 }, { key: 'decor_windpump_wheel', x: gx(54), z: r2(gx(41) + 0.9), y: 10.2, span: 4.2 });   // THE WINDMILL (the landmark)
        [[53, 40], [54, 40], [53, 41], [54, 41]].forEach(q => taken.add(q[0] + ':' + q[1])); dec('wooden_bucket', 55, 41); P('cave_torch', 51, 44, { noLight: true });
        [[38, 40, 60], [41, 44, 200], [45, 38, 300], [39, 46, 120], [46, 45, 20]].forEach(q => P('cow', q[0], q[1], { face: q[2] })); dec('grasshopper', 42, 41); dec('grasshopper_jump', 44, 46); dec('butterfly', 40, 43);
        tree(37, 37, 'tree_2', 8); tree(47, 47, 'tree', 7.5); props.push({ key: 'trailer_home_2', x: r2(gx(38) + 8.75), z: gx(39), face: 0 }); for (let y = 38; y < 40; y++) for (let x = 38; x < 43; x++) taken.add(x + ':' + y);
        P('car_truck', 64, 41, { face: 180, span: 6.8 }); dec('meshy_burlap_sack', 66, 43); dec('meshy_burlap_sack', 62, 44); dec('crow', 68, 38); dec('crow', 61, 46); dec('grasshopper_brown', 69, 45);
        { const O = [[40, 50], [44, 50], [46, 52], [46, 56], [44, 58], [40, 58], [38, 56], [38, 52]];   // THE PADDOCK: the ring's rail on the plan's line, its gate in the south side
          O.forEach((a, i) => { const b = O[(i + 1) % O.length]; if (i === 4) { feat({ k: 'rail', x0: gc(44), z0: gc(58), x1: gc(43) + 1.75, z1: gc(58), model: 'ranch' }); feat({ k: 'rail', x0: gc(41) - 1.75, z0: gc(58), x1: gc(40), z1: gc(58), model: 'ranch' });
                  feat({ k: 'rail', x0: gx(43), z0: gc(58), x1: gx(44), z1: gc(58), model: 'ranch' }); feat({ k: 'rail', x0: gx(41), z0: gc(58), x1: gx(42), z1: gc(58), model: 'ranch' }); }   // the gap is one square: the gate (pieces)
              else feat({ k: 'rail', x0: gc(a[0]), z0: gc(a[1]), x1: gc(b[0]), z1: gc(b[1]), model: 'ranch' }); }); }
        P('horse_brown', 41, 53, { face: 75 }); P('horse_black', 43, 55, { face: 250 }); P('horse', 42, 51, { face: 15 }); dec('wooden_bucket', 40, 56);
        P('cave_torch', 50, 57, { noLight: true }); P('cave_torch', 59, 57, { noLight: true }); dec('psx_wooden_crate_1', 59, 55); P('psx_metal_barrel_mp_1', 50, 55);
        P('signpost', 38, 62, { face: 90 }); P('cave_torch', 37, 67, { noLight: true }); rail(36, 60, 36, 63); rail(36, 65, 36, 72);                         // THE RANCH GATE: the rail on the district's line, the gap on the track
        props.push({ key: 'trailer_home_4', x: r2(gx(39) + 8.75), z: gx(62), face: 0 }, { key: 'trailer_home_6', x: r2(gx(39) + 8.75), z: gx(70), face: 180 });   // the old Corn Fields' three trailers stand on the ranch now
        for (const y0 of [61, 69]) for (let y = y0; y < y0 + 2; y++) for (let x = 39; x < 44; x++) taken.add(x + ':' + y);
        [[52, 62, 200], [54, 67, 120], [55, 69, 300], [49, 64, 40], [53, 66, 250], [54, 68, 30], [55, 67, 210], [53, 69, 80], [57, 65, 160]].forEach(q => dec('chicken', q[0], q[1], { face: q[2] })); P('campfire', 50, 61, { noLight: true }); dec('cardboard_boxes', 51, 62); dec('anthill', 49, 70); dec('ant', 50, 70);
        P('psx_metal_barrel_mp_2', 52, 70); dec('wooden_bucket', 55, 68); P('cave_torch', 48, 66, { noLight: true });
        { /* THE HEN RUN before the coop (squares 53..55 x 67..69): the pack's pickets on the squares' lines, its gate a gap on the west side */
          for (let i = 0; i < 6; i++) for (const z of [gx(67), gx(70)]) props.push({ key: 'hw_fence', x: r2(gx(53) + 0.875 + i * 1.75), z, face: 0 });
          for (let i = 0; i < 6; i++) { if (i === 2 || i === 3) continue; props.push({ key: 'hw_fence', x: gx(53), z: r2(gx(67) + 0.875 + i * 1.75), face: 90 }); } }
        /* PASS 1: the grain silo by the barn, the water tower over the Yard, what stands under the lean-to */
        P('ind_silo', 49, 52); props.push({ key: 'water_tower_west', x: gx(50), z: gx(69), face: 0 }); for (const q of ['49:68', '50:68', '49:69', '50:69']) taken.add(q);
        P('ride_on_mower', 58, 52, { face: 80 }); P('tire_stack', 59, 51); P('psx_metal_barrel_mp_2', 59, 54); dec('psx_jerrycan_1', 59, 53); dec('cinder_block', 58, 54); dec('tire_stack', 58, 51);
        rail(60, 60, 64, 60); rail(67, 60, 72, 60); rail(60, 60, 60, 65); rail(60, 67, 60, 72);                                            // THE COW FIELD's fence, a gap on each side
        [[63, 63, 270], [66, 66, 300], [69, 62, 0], [64, 69, 90]].forEach(q => P('cow', q[0], q[1], { face: q[2] })); dec('grasshopper', 67, 64); tree(71, 67, 'tree_2', 8); tree(61, 70, 'tree', 7);
        { /* THE HAY FIELD: straw bales in rows (the Halloween pack's), a stack by the truck, a scarecrow over them */
          for (let y = 37; y <= 46; y += 3) for (let x = 61; x <= 70; x += 3) { if (taken.has(x + ':' + y) || (x === 64 && y === 40)) continue; P(rnd() < 0.5 ? 'hw_straw' : 'hw_straw_2', x, y, { face: rnd() < 0.7 ? 0 : 90 }); }
          props.push({ key: 'hw_straw', x: gc(67), z: gc(41), face: 0 }, { key: 'hw_straw', x: r2(gc(67) + 1.5), z: gc(41), face: 0 }, { key: 'hw_straw_2', x: r2(gc(67) + 0.7), z: gc(41), y: 0.86, face: 0 }); taken.add('67:41');
          P('hw_scarecrow_2', 66, 38, { face: 180 });
          P('hw_straw', 56, 57, { face: 90 }); P('hw_straw_2', 57, 57, { face: 0 }); props.push({ key: 'hw_straw', x: gc(56), z: gc(57), y: 0.86, face: 90 });
          /* THE KITCHEN GARDEN east of the farmhouse: two tilled beds, their crops, pumpkins */
          for (const x of [70, 71]) { props.push({ key: 'hw_farmland', x: gc(x), z: gx(53), face: 0, y: 0.02 }); for (let i = 0; i < 4; i++) props.push({ key: ['hw_crop', 'hw_crop_2', 'hw_crop_3'][(x + i) % 3], x: r2(gc(x) + (i % 2 ? 0.4 : -0.4)), z: r2(gx(53) - 1.4 + i * 0.95), y: 0.2 }); }
          for (let y = 51; y < 55; y++) for (const x of [70, 71]) taken.add(x + ':' + y); dec('hw_pumpkin_4', 70, 55); dec('hw_pumpkin', 71, 50); dec('hw_pumpkin_2', 69, 56);
          /* the picket fence before the farmhouse porch, a gap at the door */
          const dx = FARM.at(FARM.door.lx, 0)[0]; for (let x = gx(62) + 0.83; x < gx(69); x += 1.66) { if (Math.abs(x - dx) < 1.8) continue; props.push({ key: 'hw_fence', x: r2(x), z: gx(58), face: 0 }); } }
        native('cowboy', 40, 64, 340); native('goatman', 44, 42, 200);
        flat(53, 40, 55, 42);   // the ground levelled under the windmill
    },
};
