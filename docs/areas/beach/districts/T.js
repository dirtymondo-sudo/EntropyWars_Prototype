/* THE BEACH · THE BERMUDA TRIANGLE (district T, 25 plots: a 3-4-5 right triangle of sea, sides 6, 8 and 10 plots) — the district file (2026-11-16).
   Part of `node bake-beach.js` (its one hook). Notes: docs/notes/areas-complexes.md "THE BEACH ON PLOTS" + "THE BEACH, THE DISTRICT FILES".
   DOOR_MASTER: "it's a right triangle" (Room 345). West point = the Lighthouse Rock, right angle = the island, north point = the Maelstrom.

   THE PLOTS (docs/areas/beach/layout.json):
     P12-03  The Maelstrom (level 0): the whirlpool at the north point: the way down  [the plan's way out: The Deep (the whirlpool)]
     P10-05  No Fixed Position (level 0): open water; the Flight 19 tape
     P10-06  The Sandbar (level 0): the sandbar, the way over
     P08-07  The Wreck Islet (level 0): a scrap of sand and a wreck
     P09-07  The Reef (level 0): shallows, coral
     P11-07  The Jetty (level 1): the island's jetty; the skiff lands here
     P12-07  The Cay (level 2): LANDMARK: the cay, its dune and the lookout, at the right angle
     P05-08  The Lighthouse Rock (level 3): the lighthouse on its rock, at the west point
     P11-08  The Lagoon (level 0): still green water inside the reef  [the plan's way out: DOOR HQ pool]
     P12-08  The Island Beach (level 1): white sand, wreckage
     no name (open water or bare sand): P11-04 P12-04 P11-05 P12-05 P08-06 P09-06 P11-06 P12-06 P07-07 P10-07 P06-08 P07-08 P08-08 P09-08 P10-08

   WHAT STANDS HERE TODAY: the LIGHTHOUSE on its rock (3.4 m; the game's own, the beam turns; the tape lies there: ctx.LIGHT is the tool's);
   the WRECK ISLET (the old wreck, a chest, skulls, an octopus under it); THE REEF (waded, five coral scatters, clams, tube coral, reef
   fish); the Sandbar's seals; jellyfish in the middle water; THE MAELSTROM (the drop, a ring of four buoys, sharks, an eel and a squid
   down the hole, coral and weed round it); THE ISLAND at the right angle: the Jetty (the island's skiff, a lantern, a ring), the Cay and
   its dune, the Lagoon, the Island Beach (palms, a camp fire, a gun, a telescope, a rowboat, an umbrella, shells).
   People: siren (Wreck Islet), pirate (the island), jellyfish (Lagoon), sharkman (Island Beach), deep sea fish (Reef).
   THE TOOL'S, NOT THIS FILE'S (doors and links, checked against data.js on every bake): ctx.MAEL (link `bermuda_abyss`, down to The
   Deep), ctx.POOL (link `weir_bermuda`, Room 8's weir, the tide pool by the Lagoon), ctx.BAY (Room 345's cabin door on the Island
   Beach + the fight marker beside it), the tape on the Lighthouse Rock. Their squares are kept clear by the tool.

   PASS 1 (2026-11-16, seen on screen; notes: areas-complexes.md "THE BEACH, THE TRIANGLE"): the old cay's LOOKOUT carried over (a dune, the
   lookout's rock, a timber stair, a rail, a straw roof, a flag); water steps and a parapet on the Lighthouse Rock; the Maelstrom's foam
   arms, sea stacks and turning wreckage; Flight 19's hull plates at No Fixed Position; THE SHACK (walk-in) on the Island Beach; the
   Jetty's piles and cargo; more on the Wreck Islet, the Reef and the Sandbar.
   PASS 2 (seen): the Shack's inside (it stands at 143-144 x 94-96 now, off the fight's sand); the Keeper's Store on the Lighthouse Rock (walk-in).
   STILL MISSING: nothing seen at night; the probe's camera does not go under water; 15 no-name plots are open water; the Triangle's
   edge is not marked on the sea; no residents with routines; mondo's open question: a Deep-to-Area-51 way.
   THE SQUARES: the island is sx 140-155 (rows 84-95) and 132-152 (rows 96-107); the Lagoon's water is sx 136-140, rows 98-106.
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
const B_WRECK = [99, 89];
const T_LOOKOUT = { y: 5.4, foot: 1.1 };   // the lookout's top and its stair's foot, metres over the sea (the foot = the dune's own height there: checked on the compiled room)
const T_CEIL = { shack: 2.45, store: 2.4 };   // each walk-in's own ceiling AS SEEN from inside (the zone kit: not the row's h)
const T_SHACK = [143, 94];                 // the shack's north-west square (2 x 3, its door east to the palm grove). NOT by the camp: data.js HQ_AREA_MARKERS stands Room 345's fight on square 148,104 (seen: its rings lay inside the first shack)   // the plan's building square: the old wreck (a prop on sand). The lighthouse's squares are ctx.LIGHT (the tool's: the tape lies there)
module.exports = {
tailor(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    setRect(LIGHT[0], LIGHT[1], LIGHT[0] + 2, LIGHT[1] + 2, 'r'); cell[B_WRECK[1]][B_WRECK[0]] = 'd';
},

/* ── PASS 1, THE EXTERIORS + THE LANDMARKS (2026-11-16, the Triangle thread; mondo's order of 11-16, docs/plans/DISTRICT_THREAD_BRIEF.md).
   Seen first (probe b0): the island was flat bare sand (the plan's dune stood 0.7 m), the Lighthouse Rock a bare block nobody could climb (the
   tape lies on it), the Maelstrom the link's own 9 m funnel in open water, No Fixed Position empty.
   THE OLD CAY'S WORKS, CARRIED OVER (`site_prebuilt_bermuda_sea`: a plateau 2.1 m over the camp, its stair, its rail): THE LOOKOUT on the
   Cay's dune, the stair up its south side, the rail round it. Everything DRAWN is one `arch` row a place with its foot at the sea (`y: 0`,
   the Harbour's `works`), so a part's height is metres over the sea. ── */
build(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    const WHITE = 0xffffff, ROPE = 0xd8c49a, PILE = 0xa08868, BEAM = 0xc4a880, IRON = 0x3c4046, BLACK = 0x1c1c20, FOAM = 0xf2fbff, STRAW = 0xd8c070, RUST = 0xb06a44;
    const PLK = 'wood_planks', RIB = U('MetalWallRibbed1a'), BED = -3.7;
    /* a drawn row in WORLD metres (x east, z south, y over the sea): the Harbour's `works` */
    const works = (id, ox, oz, fn) => { const a = ctx.sheet(), X0 = r2(ox), Z0 = r2(oz);
        const T = { a, box: (x, y, z, w, h, d, key, tint, o) => a.box(x - X0, y, z - Z0, w, h, d, key, tint, o), cyl: (x, y, z, r, h, key, tint, o) => a.cyl(x - X0, y, z - Z0, r, h, key, tint, o),
            roof: (form, x, y, z, w, h, d, key, tint, o) => a.roof(form, r2(x - X0), r2(y), r2(z - Z0), w, h, d, key, tint, o),
            part: o => { o.p = [r2(o.p[0] - X0), r2(o.p[1]), r2(o.p[2] - Z0)]; a.P.push(o); return o; } };
        fn(T); feat({ k: 'arch', id: 'bch:t_' + id + ':look', x: X0, z: Z0, y: 0, rot: 0, parts: a.P }); };
    const take = (x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) taken.add(x + ':' + y); };
    const flag = (T, x, y, z, h, tint) => { T.cyl(x, y, z, 0.05, h, null, 0xe8e0d0, { seg: 6 }); T.box(x + 0.75, y + h - 1.0, z, 1.4, 0.85, 0.03, null, tint, { ds: true }); };

    /* THE CAY'S DUNE AND THE LOOKOUT (the plan: "LANDMARK: the cay, its dune and the lookout, at the right angle") */
    const LKX = gx(150), LKZ = gz(89), LK = T_LOOKOUT.y, LK0 = T_LOOKOUT.foot;
    feat({ k: 'hill', x: LKX, z: LKZ, r: 15, h: 2.3 });                                                                    // the dune: a real rise under the lookout
    feat({ k: 'plateau', absY: true, x: LKX, z: LKZ, w: 2 * C, d: 2 * C, h: LK, edge: 0.2 });                              // the lookout's rock: squares 149-150 x 88-89
    feat({ k: 'ramp', absY: true, x0: mx(150), z0: gz(93), x1: mx(150), z1: r2(gz(90) + 0.4), w: C, h0: LK0, h1: LK, stairs: true, model: 'forest', edge: 0.1 });   // its stair, up the south side
    feat({ k: 'rail', pts: [[gx(150), r2(gz(90) - 0.25)], [r2(gx(149) + 0.25), r2(gz(90) - 0.25)], [r2(gx(149) + 0.25), r2(gz(88) + 0.25)], [r2(gx(151) - 0.25), r2(gz(88) + 0.25)], [r2(gx(151) - 0.25), r2(gz(90) - 0.25)]], y: LK, model: 'ranch' });
    take(149, 88, 151, 90); take(150, 90, 151, 93);
    works('lookout', LKX, LKZ, T => {
        for (const sx of [-1, 1]) for (const z of [-3.1, -0.3]) T.box(LKX + sx * 3.1, LK, LKZ + z, 0.16, z < -1 ? 2.3 : 2.9, 0.16, PLK, PILE, { uv: [1, 1] });   // a shade roof of palm straw over the seaward half
        T.roof('shed', LKX, LK + 2.3, LKZ - 1.7, 7.0, 0.6, 3.5, CORR, STRAW, { gain: 2.4, ry: 180 });
        flag(T, LKX - 3.2, LK, LKZ + 3.1, 5.2, BLACK);                                                                         // the island's flag, seen from the sea
        T.box(LKX - 1.75, LK, LKZ - 2.9, 2.6, 0.45, 0.5, PLK, BEAM, { uv: [1, 1] });                                         // a bench under the roof
    });

    /* THE LIGHTHOUSE ROCK: water steps up its east face (the way to the tape), a parapet round its top */
    const RK = 3.4;
    feat({ k: 'ramp', absY: true, x0: gx(74), z0: mz(102), x1: r2(gx(70) - 0.5), z1: mz(102), w: C, h0: -1.8, h1: RK, stairs: true, model: 'external', edge: 0.1 });
    { const q = (x, y, ix, iz) => [r2(gx(x) + ix * 0.3), r2(gz(y) + iz * 0.3)];   // inset 0.3 m from the rock's edge; open at the steps (square 69,102) and where the store's own walls stand (67-68 x 100)
      feat({ k: 'rail', pts: [q(70, 103, -1, -1), q(70, 104, -1, -1), q(69, 104, -1, -1), q(69, 105, -1, -1), q(68, 105, -1, -1), q(68, 106, -1, -1), q(65, 106, 1, -1), q(65, 105, 1, -1), q(64, 105, 1, -1), q(64, 104, 1, -1), q(63, 104, 1, -1), q(63, 101, 1, 1), q(64, 101, 1, 1), q(64, 100, 1, 1), q(65, 100, 1, 1), q(65, 99, 1, 1), q(68, 99, -1, 1), q(68, 100, -1, 0)], y: RK, model: 'parapet' });
      feat({ k: 'rail', pts: [q(69, 101, 0, 1), q(70, 101, -1, 1), q(70, 102, -1, 0)], y: RK, model: 'parapet' }); }
    works('rock', gx(66.5), gz(102.5), T => {
        flag(T, gx(64) + 0.9, RK, gz(104) - 0.9, 6.0, 0xe8483c);                                                               // a storm flag
    });

    /* THE MAELSTROM: the link's own funnel is 9 m wide. Round it: arms of foam turning in on the hole, drawn on the water */
    works('maelstrom', MAEL.x, MAEL.z, T => {
        for (let arm = 0; arm < 3; arm++) { let px = null, pz = null;                                                      // three arms, each a chain of short strokes end to end
            for (let k = 0; k <= 44; k++) { const t = k / 44, r = 6 + 27 * t * t + 5 * t, an = arm * Math.PI * 2 / 3 + t * 7.2, x = MAEL.x + r * Math.cos(an), z = MAEL.z + r * Math.sin(an);
                if (px != null && k % 5 !== 4) T.part({ s: 'box', p: [(x + px) / 2, 0.04, (z + pz) / 2], size: [r2(Math.hypot(x - px, z - pz) + 0.1), 0.03, r2(0.22 + 0.5 * t)], ry: r2(Math.atan2(-(z - pz), x - px) * 180 / Math.PI), tint: FOAM, glow: 0.35, sides: false });
                px = x; pz = z; } }
    });

    /* THE JETTY: piles under the planks, mooring posts and a rope along its north side */
    works('jetty', gx(136), gz(90), T => {
        T.part({ s: 'cyl', p: [gx(132) + 0.3, BED, gz(89) + 0.2], r: 0.17, h: r2(0.5 - BED), key: PLK, tint: PILE, seg: 8, uv: 1, n: 3, step: [10.5, 0, 0] });
        T.part({ s: 'cyl', p: [gx(132) + 0.3, BED, gz(91) - 0.2], r: 0.17, h: r2(0.5 - BED), key: PLK, tint: PILE, seg: 8, uv: 1, n: 3, step: [10.5, 0, 0] });
        T.part({ s: 'cyl', p: [gx(132) + 0.3, 0.6, gz(89) + 0.2], r: 0.11, h: 1.0, key: PLK, tint: BEAM, seg: 8, uv: 1, n: 5, step: [5.25, 0, 0] });
        T.box(gx(135) + 0.3, 1.45, gz(89) + 0.2, 21.0, 0.05, 0.05, null, ROPE);
    });

    /* ── PASS 2, THE INSIDES (2026-11-16). `inside` and `In` are the Shore's (S.js, copied unchanged but for the names; the zone kit: a coat
       3.5 cm in front of each inner wall, a white dado, a LIT ceiling 5 cm under the building's own, daylit windows; a prop inside takes
       `floor: true` and a `y` of 1 or more is typed over the building's own ground G). ── */
    const inside = (a, w, d, h, tint, door, wins) => { const W2 = w / 2, D2 = d / 2, e = 0.335, Hc = h, lit = { gain: 2.9, glow: 0.16, uv: [2.4, 2.4], kind: 'wall' };
        const Q = (x, y, z, qw, qh, ry, key, tn, o) => a.P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(qw), r2(qh)], ry, key, tint: tn }, o));
        const coat = (y0, hh, tn, o) => { Q(0, y0, -D2 + e, w - 2 * e, hh, 0, CORR, tn, o); Q(0, y0, D2 - e, w - 2 * e, hh, 180, CORR, tn, Object.assign({}, o, y0 < 2.2 ? { hole: [r2(-door.lx), r2(door.cw + 0.12), r2(2.25 - y0)] } : null));
            Q(-W2 + e, y0, 0, d - 2 * e, hh, 270, CORR, tn, o); Q(W2 - e, y0, 0, d - 2 * e, hh, 90, CORR, tn, o); };
        coat(1.0, Hc - 1.0, tint, lit); coat(0, 1.0, WHITE, Object.assign({}, lit, { gain: 3.2 }));
        a.box(0, Hc - 0.05, 0, w - 0.66, 0.04, d - 0.66, CORR, 0xfff6e2, { glow: 0.45, gain: 3.0, under: true, roof: true, top: false, ds: true, uv: [2.4, 2.4] });
        (wins || []).forEach(q => { const [wl, al, y, ww, wh] = q, at = wl === 'f' ? [al, D2 - e - 0.03, 180] : wl === 'l' ? [-W2 + e + 0.03, al, 270] : wl === 'r' ? [W2 - e - 0.03, al, 90] : [al, -D2 + e + 0.03, 0];
            const nx = wl === 'l' ? 1 : wl === 'r' ? -1 : 0, nz = wl === 'b' ? 1 : wl === 'f' ? -1 : 0;
            Q(at[0], y - 0.1, at[1], ww + 0.24, wh + 0.2, at[2], null, WHITE, { kind: 'wall' }); Q(at[0] + nx * 0.02, y, at[1] + nz * 0.02, ww, wh, at[2], GLS, 0xdcf0ff, { glow: 0.8, win: 'keep', uv: 'fit' }); }); };
    const FY = 0.14, In = (B, G, key, lx, lz, face, y, o) => { const yy = FY + (y || 0); put(B, key, lx, lz, Object.assign({ face: face || 0, floor: true, y: r2(yy < 1 ? yy : G + yy) }, o)); };
    /* THE SHACK (walk-in), where the Jetty's path meets the island: a wrecker's board shack, its door east to the palm grove, its back window to the Lagoon */
    const SHK = building('t_shack', [T_SHACK[0], T_SHACK[1], T_SHACK[0] + 2, T_SHACK[1] + 3, 'E'], 3.0, { leaf: 'leaf_stable' }, (a, w, d, door) => {
        a.shell(w, 2.7, d, CORR, 0x6fc4b8, door, [2.4, 2.4], 2.7); a.frame(door, d, null, WHITE);
        a.roof('shed', 0, 2.7, 0, w + 0.8, 0.7, d + 0.9, COR, RUST, { gain: 1.9 });
        a.box(0, 0, d / 2 + 0.9, w + 0.3, 0.16, 1.8, FLR, 0xd8c4a0, { uv: [1.75, 1.75] });                                    // a plank step along the front
        for (const s of [-1, 1]) a.box(s * (w / 2 - 0.1), 0.16, d / 2 + 1.66, 0.14, 2.2, 0.14, null, 0xe8e0d0);
        a.box(0, 2.3, d / 2 + 1.66, w, 0.12, 0.12, null, 0xe8e0d0); a.roof('shed', 0, 2.36, d / 2 + 0.95, w + 0.6, 0.4, 2.2, CORR, STRAW, { gain: 2.4 });
        const wx = door.lx > 0 ? -w / 4 : w / 4;                                                                             // a window on the front, beside the door: dark glass, a white frame
        a.box(wx, 1.0, d / 2 + 0.06, 1.44, 1.16, 0.06, null, WHITE); a.box(wx, 1.08, d / 2 + 0.09, 1.2, 1.0, 0.04, GLS, 0x9cc4e0, { uv: 'fit', win: 'keep', glow: 0.3 });
        inside(a, w, d, T_CEIL.shack, 0x8fd8cc, door, [['f', wx, 1.08, 1.2, 1.0], ['b', 0, 1.2, 1.6, 0.9]]);
        a.box(0, 1.1, -d / 2 - 0.06, 1.84, 1.1, 0.06, null, WHITE); a.box(0, 1.2, -d / 2 - 0.09, 1.6, 0.9, 0.04, GLS, 0x9cc4e0, { uv: 'fit', win: 'keep', glow: 0.3 });   // the back window, to the sea
        for (const z of [-1.75, 1.75]) a.box(0, T_CEIL.shack - 0.24, z, w - 0.7, 0.18, 0.16, PLK, BEAM, { roof: true, uv: [1, 1] });                                       // tie beams
        a.box(-w / 2 + 0.34 + 0.2, 1.5, -1.2, 0.36, 0.05, 2.4, PLK, BEAM, { uv: [1, 1] }); a.box(-w / 2 + 0.34 + 0.2, 2.0, -1.2, 0.36, 0.05, 2.4, PLK, BEAM, { uv: [1, 1] });   // two shelves on the west wall
    });
    /* THE SHACK'S INSIDE: 3 x 2 squares, middles at (-3.5 | 0 | 3.5, -1.75 | 1.75) in its own frame; the door's square (front, middle) stays clear */
    { const G = 2.0, I = (key, lx, lz, face, y, o) => In(SHK, G, key, lx, lz, face, y, o);
      I('dorm_bed', 3.9, -2.2, 90); I('footlocker', 2.3, -2.5, 0); I('psx_glass_bottle_2', 3.0, -1.2, 40); I('greek_amphora', 4.5, 2.5, 0); I('greek_amphora', 3.9, 2.7, 120);
      I('psx_table_large_2', -1.2, -2.2, 0); I('psx_chair_mp_3', -1.2, -1.1, 180); I('railway_lantern', -1.5, -2.3, 0, 0.96); I('psx_glass_bottle_2', -0.8, -2.2, 0, 0.96); I('psx_wooden_crate_1', -4.4, 0.9, 10); I('ship_model', -4.4, 0.9, 90, 0.36); I('psx_metal_barrel_mp_1', -4.4, 2.3, 0); I('money_sacks', -3.3, 2.6, 200); I('sea_chest', 1.6, 2.5, 180);
      I('fishing_net_wall', 2.2, -3.05, 0, 1.2); I('arms_trophy', -2.6, -3.05, 0, 1.75); I('ship_wheel', 4.8, 0.2, 270, 1.5); I('ships_bell', 0.9, 3.05, 180, 1.7); I('meshy_hanging_lantern', 0, 0, 0, 2.0);
      I('meshy_rope', -4.75, -1.8, 90, 1.56); I('item_spyglass', -4.75, -0.9, 90, 1.56); I('psx_gold_bar_pcs_1', -4.75, -1.3, 90, 2.06); }
    /* THE KEEPER'S STORE on the Lighthouse Rock (walk-in, 2 x 1 squares, its door south to the light): white boards, a red tin roof */
    const STO = building('t_store', [67, 100, 69, 101, 'S'], 2.8, { leaf: 'leaf_beige_wood' }, (a, w, d, door) => {
        a.shell(w, 2.5, d, CORR, WHITE, door, [2.4, 2.4], 3.2); a.frame(door, d, null, 0x3a60a8);
        a.roof('shed', 0, 2.5, 0, w + 0.6, 0.55, d + 0.6, CORR, 0xe8483c, { gain: 2.6 });
        a.box(door.lx > 0 ? -w / 4 : w / 4, 1.2, d / 2 + 0.06, 1.24, 0.96, 0.06, null, 0x3a60a8); a.box(door.lx > 0 ? -w / 4 : w / 4, 1.28, d / 2 + 0.09, 1.0, 0.8, 0.04, GLS, 0x9cc4e0, { uv: 'fit', win: 'keep', glow: 0.3 });
        inside(a, w, d, T_CEIL.store, WHITE, door, [['f', door.lx > 0 ? -w / 4 : w / 4, 1.28, 1.0, 0.8]]);
    });
    { const G = 3.4, I = (key, lx, lz, face, y, o) => In(STO, G, key, lx, lz, face, y, o);
      I('psx_metal_barrel_mp_1', 2.7, -0.9, 0); I('psx_metal_barrel_mp_2', 2.0, -1.0, 30); I('psx_jerrycan_1', 2.8, 0.2, 80); I('psx_jerrycan_1', 2.3, 0.5, 200); I('psx_wooden_crate_1', -2.6, -0.9, 0); I('field_radio', -2.6, -0.9, 0, 0.36);
      I('beach_life_ring', 0.4, -1.3, 0, 1.5); I('meshy_rope', -2.9, 0.6, 90); I('railway_lantern', -1.6, -1.0, 0); }
},

place(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    props.push({ key: 'lighthouse', x: gx(LIGHT[0] + 1), z: gz(LIGHT[1] + 1), face: 0 });                                         // on its rock at the west point (the beam turns; the tape)
    props.push({ key: 'ship_wreck', x: mx(B_WRECK[0]), z: mz(B_WRECK[1]), face: 30 }); dec('sea_chest', 98, 88); dec('skull_pile', 100, 90); native('siren', 100, 88, 250, sayOf(O_SEA, 'siren'));
    [[146, 37], [154, 37], [146, 47], [154, 47]].forEach(q => afloat('sea_buoy', q[0], q[1]));                                         // the Maelstrom's ring of four red buoys
    props.push({ key: 'ocean_shark', x: MAEL.x, z: MAEL.z, y: -4.2, hover: 0, swim: { r: 9, v: 1.3, bob: 0.2 } }, { key: 'ocean_hammerhead', x: MAEL.x, z: MAEL.z, y: -5.4, hover: 0, swim: { r: 6, v: 1.1, bob: 0.2, dir: -1 } });
    swimmer('ocean_shark', 104, 92, { y: -0.85, hover: 0.25, swim: { r: 14, v: 1.4, bob: 0.1 } }); dec('ocean_seal_resting', 122, 72); dec('ocean_seal_resting', 126, 73); dec('ocean_rock_7', 119, 72);
    swimmer('ocean_moon_jelly', 124, 62, { y: -1.2, hover: 0 }); swimmer('ocean_box_jelly', 128, 66, { y: -1.4, hover: 0 }); swimmer('ocean_bioluminescent_jelly', 120, 80, { y: -1.2, hover: 0 }); swimmer('ocean_moon_jelly_pulsing', 136, 58, { y: -1.0, hover: 0 });
    for (const k of ['ocean_coral', 'ocean_coral_3', 'ocean_coral_6', 'coral_fan', 'coral_brain']) feat({ k: 'scatter', key: k, n: 8, x: mx(113), z: mz(90), r: 16, seed: k.length * 7, sea: true });   // THE REEF
    feat({ k: 'scatter', key: 'ocean_coral_2', n: 5, x: MAEL.x, z: MAEL.z, r: 17, seed: 85, sea: true }); feat({ k: 'scatter', key: 'ocean_seaweed', n: 6, x: MAEL.x, z: MAEL.z, r: 15, seed: 88, sea: true });
    /* the island at the right angle: the Jetty, the Cay and its dune, the Lagoon, the Island Beach */
    for (let y = 84; y < 108; y++) for (let x = 132; x < 156; x++) if (cell[y][x] === 't') palm(x, y);
    [[142, 86], [150, 86], [153, 92], [141, 95], [152, 104], [143, 106]].forEach(q => palm(q[0], q[1]));
    P('campfire', 148, 99); dec('folding_chair', 149, 100); dec('cardboard_box', 147, 101); dec('paper_sheet', 148, 101, { y: 0.01 }); P('signpost', 141, 92, { face: 270 }); dec('wet_floor_sign', 140, 90);
    dec('ocean_crab', 150, 96); dec('ocean_starfish', 143, 98); dec('ocean_conch', 152, 100); dec('ocean_sand_dollar', 145, 104); P('railway_lantern', 132, 89);   // (the `dockring` went: a spaceship docking ring, seen)
    props.push({ key: 'skiff', x: gx(131), z: gz(90), y: 0.32, face: 90 });                                                           // the island's own skiff, at the Jetty
    native('pirate', 144, 93, 220, sayOf(O_SEA, 'pirate')); native('jellyfish', 139, 104, 20); native('sharkman', 151, 102, 300); native('deep sea fish', 113, 91, 90);
    /* ── PASS 1 (2026-11-16), added at the END so no earlier throw moves ── */
    const sea = (key, sx, sy, o) => { spot(sx, sy, key, 'sea', true); props.push(Object.assign({ key, x: r2(mx(sx) + (rnd() - 0.5) * 2), z: r2(mz(sy) + (rnd() - 0.5) * 2), face: Math.round(rnd() * 360) }, o || {})); };   // stands on the sea bed
    /* THE MAELSTROM: a broken ring of black sea stacks round the hole (the ocean pack's rocks, grown), wreckage turning on the water */
    for (let k = 0; k < 14; k++) { if (k === 3 || k === 4 || k === 10) continue; const a = k / 14 * Math.PI * 2 + 0.2, r = 33 + (k % 3) * 4, tall = k % 3 !== 1;   // (seen: the pack's round rocks grown to 10 m are black blocks; the pillar is the stack, the round ones stay low)
        props.push({ key: tall ? 'ocean_rock_3' : 'ocean_rock_9', x: r2(MAEL.x + r * Math.cos(a)), z: r2(MAEL.z + r * Math.sin(a)), h: tall ? r2(6 + (k * 5 % 6)) : 3.2, face: k * 47 % 360 }); }
    [['psx_wooden_crate_4', 9, 0.9], ['psx_metal_barrel_mp_0', 12, 0.75], ['psx_wooden_crate_5', 15, 0.6], ['psx_metal_barrel_mp_3', 19, 0.5], ['meshy_rowboat', 23, 0.42], ['psx_wooden_crate_6', 27, 0.36]]
        .forEach((q, i) => props.push({ key: q[0], x: MAEL.x, z: MAEL.z, y: -0.5, hover: 0.5, face: i * 60, swim: { r: q[1], v: q[2] * q[1] / 4, bob: 0.12 } }));
    /* NO FIXED POSITION (the plan: "open water; the Flight 19 tape"): aircraft wreckage on the sea bed, a torn hull plate through the surface.
       The game has no Avenger (NEEDS A MODEL); these are its own torn hull plates, never the F-22 */
    sea('hullplate', 125, 65, { face: 20, y: -3.3, hover: 0 }); sea('hullplate', 122, 68, { face: 200, h: 3.2, y: -3.4, hover: 0 }); sea('hullplate', 128, 63, { face: 110, h: 2.6, y: -3.4, hover: 0 }); sea('hullplate', 127, 69, { face: 300, h: 3.8, y: -3.4, hover: 0 });
    sea('hullplate', 121, 62, { face: 60, h: 2.8, y: -3.4, hover: 0 });   // five pieces for five aircraft (seen: the `nacelle` is an airliner's engine and floated: taken out)
    /* THE LIGHTHOUSE ROCK: stacks in the water round it, the keeper's stores on top, an anchor */
    [[61, 100, 4.6], [62, 105, 2.2], [71, 99, 5.2], [70, 106, 2.0], [66, 97, 3.6]].forEach((q, i) => sea(['ocean_rock_3', 'ocean_rock_9'][i % 2], q[0], q[1], { h: q[2] }));
    props.push({ key: 'psx_wooden_crate_4', x: r2(gx(64) + 1.2), z: r2(gz(101) + 1.0), face: 12 }, { key: 'psx_metal_barrel_mp_3', x: r2(gx(64) + 2.4), z: r2(gz(101) + 0.8) }, { key: 'ship_anchor', x: mx(67), z: mz(104), face: 140 }, { key: 'lobster_traps', x: r2(gx(65) + 0.8), z: r2(gz(104) + 1.4), face: 80 });
    /* THE WRECK ISLET: what came off her */
    dec('ship_anchor', 100, 89); dec('psx_wooden_crate_5', 98, 89); dec('psx_metal_barrel_mp_0', 101, 89); dec('femur', 99, 90); dec('skull', 100, 88); dec('psxg_rock_3', 98, 88);
    sea('ocean_rock_9', 96, 87, { h: 1.6 }); sea('ocean_rock_3', 102, 91, { h: 3.0 }); sea('psx_wooden_crate_6', 97, 90);
    /* THE REEF: three more corals, kelp and anemones in the deeper water round it, rocks through the surface */
    for (const k of ['ocean_coral_4', 'ocean_coral_5', 'ocean_coral_7']) feat({ k: 'scatter', key: k, n: 9, x: mx(113), z: mz(90), r: 15, seed: k.length * 11 + k.charCodeAt(12), sea: true });
    [[106, 84], [121, 86], [122, 95], [107, 95], [115, 98]].forEach(q => sea('kelp', q[0], q[1], { h: 2.6, y: -3.4, hover: 0 }));   // (seen: 4.5 m kelp in the shallows stood out of the water like reeds) [[112, 86], [116, 89], [111, 91]].forEach(q => sea('anemone', q[0], q[1]));
    sea('ocean_rock_3', 111, 87, { h: 2.2 }); sea('ocean_rock_3', 117, 92, { h: 1.7 }); sea('ocean_rock_3', 114, 90, { h: 1.3 });   // (seen: a round rock given `h` 1.8 is a black slab 8 m wide)
    /* THE SANDBAR: driftwood and a beached boat */
    dec('fallen_log', 120, 72); dec('meshy_rowboat', 128, 72); dec('psxg_rock_1', 124, 73); dec('ocean_starfish', 125, 72); dec('ocean_crab', 127, 73); dec('dead_snag', 118, 73);
    /* THE ISLAND: the lookout's glass and signal fire, the Jetty's cargo, the camp, wreckage on the Island Beach, scrub on the dune */
    props.push({ key: 'brass_telescope', x: r2(gx(151) - 1.2), z: r2(gz(88) + 1.2), face: 45 }, { key: 'brazier', x: r2(gx(149) + 1.0), z: r2(gz(90) - 1.0) });
    dec('psx_wooden_crate_4', 134, 89); dec('psx_metal_barrel_mp_0', 136, 89); dec('lobster_traps', 138, 90); dec('meshy_burlap_sack', 139, 89);
    P('cave_torch', 146, 97); P('cave_torch', 150, 101); dec('fallen_log', 149, 98); dec('cauldron', 147, 99); dec('footlocker', 150, 99); dec('meshy_burlap_sack', 147, 100);
    P('wheel', 151, 100, { face: 250 }); dec('psx_wooden_crate_6', 152, 102); dec('psx_fish_skeleton_mp_1', 151, 104); dec('fallen_log', 150, 106); dec('psx_metal_barrel_mp_3', 149, 106); dec('dead_snag', 151, 96);
    [[148, 87], [152, 90], [147, 91], [153, 88], [149, 92], [151, 86]].forEach((q, i) => dec(i % 2 ? 'psxg_dead_bush_1' : 'psxg_dead_bush_2', q[0], q[1]));
    [[146, 93], [147, 94], [148, 93], [145, 95]].forEach(q => dec('fern', q[0], q[1]));
    [[141, 88], [147, 85], [154, 93], [137, 107], [146, 107], [133, 97]].forEach(q => palm(q[0], q[1]));
},

dress(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* the Bermuda Triangle: an eel and a squid down the Maelstrom's
       hole, an octopus under the wreck, clams and tube coral and reef fish on the Reef, a gun and a telescope and a boat on the island */
    props.push({ key: 'ocean_eel', x: r2(MAEL.x + 3), z: r2(MAEL.z - 3), y: -5.8, hover: 0 }, { key: 'ocean_squid', x: r2(MAEL.x - 3), z: r2(MAEL.z + 3), y: -4.8, hover: 0 });
    under('ocean_octopus', 97, 91, -1.6); [[110, 86], [114, 92], [117, 94]].forEach(q => under('giant_clam', q[0], q[1], -0.8)); [[111, 89], [116, 91], [113, 94], [109, 87]].forEach(q => under('coral_tube', q[0], q[1], -0.8));
    [[112, 88, 'ocean_clownfish'], [115, 92, 'ocean_dory'], [110, 90, 'ocean_fish'], [117, 90, 'ocean_fish_2'], [113, 92, 'ocean_fish_3'], [114, 87, 'ocean_brown_fish']].forEach(q => under(q[2], q[0], q[1], -0.5));
    P('ship_cannon', 150, 105, { face: 180 }); P('rowboat', 152, 98, { face: 60 }); dec('ocean_seal_resting', 142, 100); dec('psxg_rock_2', 153, 94);
    P('pool_umbrella', 145, 98); dec('pool_lounger', 146, 98, { face: 90 });
},
};
