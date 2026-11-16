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

   WHAT STANDS HERE TODAY (after THE EXTERIOR PASS, 11-16; all of it seen on screen): the stone QUAY (0.9 m, cobbles; squares 24-35 x 38-42, it
   runs east to the Breakwater's root now) walled in dressed stone down to the sea bed, a kerb, bollards, a PARAPET on its basin side; the QUAY
   SHED (walk-in, squares 26-28 x 39-41, front south: red painted boards, white trim, a tin roof, barn doors, windows, a hoist beam, HARBOUR on
   a white board). CARRIED OVER FROM THE OLD HARBOUR ROOM: the WHARF (brick, 3.0 m over the quay, squares 29-35 x 36-37, railed) up a concrete
   STAIR from the landing (24-25 x 36-37); the GANTRY from the wharf out over the quay and the basin (square column 34, then west along row 47)
   to a STEEL STAIR down onto the pier's north arm, on steel trestles, a hoist frame over its corner; the SLIPWAY (squares 25-26 x 43-48, a
   concrete slip with timber skids, pipe rails, a winch) into the boat basin; two WATER STEPS (off the quay at column 32, beside the Long Pier
   at column 40); a cobbled slope from the quay onto the BREAKWATER (rock, 1.6 m), which is walked out to the HARBOUR LIGHT on its head (three
   squares each way, railed), armour blocks along its sea side. THE PIERS (the north arm, the LONG PIER to square 56, the skiff jetty): a
   timber fascia and a pile under every square line, bollards (the eight `dockring` props were space-station rings: gone). THE GANGWAY at the
   tool's place GANG: a brow of planks up to the Dutchman's waist, posts, a rope either side of its foot. THE MOUTH: two pile beacons (a red
   can, a green cone) between the Channel's four red buoys. THE ROADS: four mooring buoys. Freight on the quay (a container, a pallet, the
   forklift, a cable drum, sandbags, a gun); lamps, traps, a lobster, a crate, a chest down the Long Pier; the skiff afloat at her jetty's
   end; a dolphin, a turtle, a tuna. People: pirate (Quay), homosapien (Long Pier).
   THE FLYING DUTCHMAN IS THE TOOL'S, NOT THIS FILE'S: her berth (ctx.SHIP, squares 35-68 x 56-69, she runs out into the Ocean's plots), the
   pier's length (ctx.PIER_END), the gangway's PLACE (ctx.GANG, link `beach_dutchman`) and `terrain.moored` are shared pieces. She is drawn by
   three-renderer.js _hqBuildMoored from her own deck room. Moving or redressing her = a note on the board first.
   HEIGHTS IN THIS FILE: a `plateau` / `ramp` / `bridge` row wears `absY: true` (its heights are metres over the sea; without it the game adds
   the height of the square under the row's own anchor: the wharf stood at 4.8, seen in the numbers). A `rail` row's `y` is always absolute.
   The tool's walk check reads the squares only, not these rows: `reach` cannot name the wharf, the gantry or the Breakwater.

   THE SHED'S INSIDE (THE INTERIOR PASS, 11-16, seen by day and at 22:30): cream boards over a red dado, a lit board ceiling, three tie beams,
   seven daylit windows; back row = the pots, a steel bench under the pegboard (radio, jerrycan, a fish's bones), the crates, two nets, the
   outboard on its stand, rope; middle row = the fish scale, a barrel, a crate, tyres, the hand truck; front row = the harbour desk (the
   ship's model), a telescope, a star chart, the sea chest, the anchor, sacks, a lantern; the wheel, a life ring and the bell on the walls.
   It is the district's only walk-in (the plan draws no other building; the stilt houses are solid pack models).

   THE DRESSING (11-16, seen): freight on the wharf's back row under the crane, a skip, a gas rack, crates, pots, tyres and sacks on the quay,
   nets drying on the shed's west wall, ship's stores down the Long Pier's north row, pots on the skiff jetty, a bench at the light; a
   finger post (LONG PIER, BREAKWATER, WHARF, SLIPWAY), the slip's KEEP CLEAR board, WHARF on the brick. From the old Harbour room: the
   crab and starfish at the slip's head, the second dolphin, the shark, the fish schools. People: 10 (8 more, no lines).
   THE WAYS THAT MUST STAY CLEAR: square 25 x 42 and the west lane (24-25 x 38-41) = the only way round the shed to the wharf's stair;
   the wharf's front row (37) to the gantry at 34; the Long Pier's south row (54); squares 51-52 x 53-54 (the gangway).

   THE ATMOSPHERE (11-16, seen by day and at 22:30): seventeen drawn harbour lamps (the Long Pier's north edge, the pier's arm, the skiff
   jetty, the quay's corners, the wharf's rail), bulbs under the shed's eave, a lamp over its door, the hoist's work lamp, the Mouth's
   beacons lit red and green: drawn glow. Real light: two `flood_mast` (the quay's apron, the Long Pier before the gangway), three
   `brazier` (the wharf, the light's head, the skiff jetty). No sound, no particles (no hook a district reaches), no gulls (no model).

   THE POLISH (11-16, a ten-view walk round, seen): the nets off the shed's west windows, the mole's ten boulders set by hand on its sea
   side (the scatter put black lumps, then 2 m standing stones, on the walk), three people moved off the ways.

   STILL SHORT (all five passes are live):
   - The Dutchman's bulwarks, deck stairs, crates and cannon are her deck room's rows and are not drawn at the berth; she is not redesigned
     (the world plan wants her rebuilt inside and out: not this file's job without mondo's word). The brow lands on her rail, not in a port.
   - The Roads have buoys and no ship. No kelp (4.5 m tall in 3.5 m of water). No residents with routines, no fight set up.
   FROM THE MODEL LIST (11-16, mondo's THE MODEL LIST FIRST; seen on screen): the Roads have a house on piles with a fishing boat lying to it,
   the Mouth a hut on piles and its rowboat, a fishermen's house on piles stands off the skiff jetty (the Elbolilloduro Houses on the water
   scene: seven pieces cut out of it, bake-pack-pieces.py); a boat hauled up the slipway, a rowboat at the water steps, mooring piles in the
   basin, the shed's generator, mondo's scaffold crane on the wharf, seals on the Breakwater.
   THE MODEL PASS (11-16, mondo's wish-list models; seen by day and at 22:30): every model this district asked for is placed. A `trawler`
   lies at the Roads' mooring buoys, the `tugboat` alongside the Long Pier's north side; fourteen `seagull`; `rope_coils`, `fish_boxes`;
   the seventeen bollards are the `mooring_bollard` model and the seventeen harbour lamps the `iron_lamp_post` model (the drawn ones are
   out; one drawn flame stays in each lantern, the model has no glow). Also from the list: `cage_lamp` over the shed's door, `drying_fish`,
   `oars`, `fishing_rod` by the angler's chair, `woven_baskets`, `wooden_barrel`, `coin_telescope` at the light, a `heron`, a `wooden_ladder`,
   a `wheelbarrow`. Not used: `rat` (21,754 triangles for 12 cm), `lantern_post` (its lantern hangs off-centre: no place for the flame),
   `string_lights` (stands on its own posts; the shed's eave bulbs are drawn on the eave).
   NEEDS A MODEL: nothing is open. (Still drawn, and no model on the list: the Mouth's two pile beacons, the Roads' four mooring buoys, the
   gangway's brow, the gantry's trestles and hoist, the quay's stone walls and the piers' piles.)
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
    /* THE EXTERIOR PASS (2026-11-16): the old Harbour's works need ground the plan does not draw. All on this district's own plots, in the
       plan's own letters: the quay runs on east to the Breakwater's root, a strip behind it (north) carries the stair and the WHARF, and the
       Breakwater's head is three squares each way round the light (it was two, the light off its middle) */
    setRect(33, 38, 36, 43, 'o'); setRect(24, 36, 36, 38, 'o'); setRect(45, 45, 48, 48, 'r');
},

build(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* ── THE EXTERIOR PASS (2026-11-16, the Harbour thread; seen on screen first, HEAD f706133: the shed was a black box with a grey sign, the
       quay a bare slab 9 x 5 squares, the Breakwater a flat grey bar, the piers planks with smeared sides and no piles, eight `dockring` props
       were three-metre space-station rings, nothing showed the way aboard the Dutchman, and none of the old Harbour's works were here).
       THE OLD HARBOUR'S WORKS, CARRIED OVER (`site_prebuilt_downtown_harbour`: its rows, at this room's heights): the WHARF along the back of
       the quay (3.0 m over it, its stair, its front railings), the GANTRY from the wharf out over the water to a steel stair down onto the
       pier, the SLIPWAY into the water with its pipe rails, the WATER STEPS (the ways out of the water), the quay's PARAPET, the stair onto the
       Breakwater, the railing round the light. Everything DRAWN is one `arch` row per place with its foot typed at level 0 (`y: 0`: the sea). ── */
    const WHITE = 0xffffff, FALU = 0xd04a3a, TIN = 0xc4ccd4, PILE = 0xa08868, BEAM = 0xc4a880, STONE = 0xb4aa9a, STEEL = 0x7c8894, IRON = 0x3c4046, ROPE = 0xd8c49a;
    const QY = 0.9, PY = 0.6, WH = 3.9, MOLE = 1.6, BED = -3.7;
    const PLK = 'wood_planks', CONC = U('ConcreteStriped2c'), MAS = U('BrickMasonry1a'), RIB = U('MetalWallRibbed1a'), TRUSS = U('MetalTruss1a');
    /* a drawn row in WORLD metres (x east, z south, y over the sea) */
    const works = (id, ox, oz, fn) => { const a = ctx.sheet(), X0 = r2(ox), Z0 = r2(oz);
        const T = { a, box: (x, y, z, w, h, d, key, tint, o) => a.box(x - X0, y, z - Z0, w, h, d, key, tint, o), cyl: (x, y, z, r, h, key, tint, o) => a.cyl(x - X0, y, z - Z0, r, h, key, tint, o),
            part: o => { o.p = [r2(o.p[0] - X0), r2(o.p[1]), r2(o.p[2] - Z0)]; a.P.push(o); return o; }, sign: (words, x, y, z, w, h, fg, bg, font, o) => a.sign(words, x - X0, y, z - Z0, w, h, fg, bg, font, o) };
        fn(T); feat({ k: 'arch', id: 'bch:h_' + id + ':look', x: X0, z: Z0, y: 0, rot: 0, parts: a.P }); };
    const isW = (x, y) => cell[y] && cell[y][x] === 'w';
    const SIDES = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // north, east, south, west
    /* a face along one side of square (x, y): a box `t` thick standing `out` proud of the square's line */
    const face = (T, x, y, k, y0, y1, t, key, tint, o) => { const [dx, dy] = SIDES[k], cx = mx(x) + dx * (C / 2 + t / 2 - 0.02), cz = mz(y) + dy * (C / 2 + t / 2 - 0.02); T.box(cx, y0, cz, dx ? t : C, y1 - y0, dx ? C : t, key, tint, o); };
    /* a mooring bollard (the `dockring` prop that stood at these places is a space-station docking ring: seen) */
    const bollard = (T, x, z, y) => props.push({ key: 'mooring_bollard', x: r2(x), z: r2(z) });   // THE MODEL PASS (11-16): the wish list's cast iron bollard; it was two drawn cylinders (the stand-in is out)

    /* THE WHARF, its stair and the gantry (the walker reads these rows; the looks below dress them) */
    const onWharf = (x, y) => x >= 29 && x <= 35 && y >= 36 && y <= 37;
    feat({ k: 'plateau', absY: true, x: gx(32.5), z: gz(37), w: 7 * C, d: 2 * C, h: WH, edge: 0.15 });                                                     // THE WHARF: squares 29-35 x 36-37, 3.0 m over the quay
    feat({ k: 'ramp', absY: true, x0: r2(gx(26) + 0.2), z0: gz(37), x1: r2(gx(29) + 0.7), z1: gz(37), w: 2 * C, h0: QY, h1: WH, stairs: true, model: 'concrete', edge: 0.1 });   // its stair, from the landing (squares 24-25 x 36-37)
    feat({ k: 'rail', x0: r2(gx(29) + 0.9), z0: r2(gz(38) - 0.25), x1: gx(34), z1: r2(gz(38) - 0.25), y: WH, model: 'balusters_b' });               // the wharf's front railing, open at the gantry
    feat({ k: 'rail', x0: gx(35), z0: r2(gz(38) - 0.25), x1: r2(gx(36) - 0.25), z1: r2(gz(38) - 0.25), y: WH, model: 'balusters_b' });
    feat({ k: 'rail', pts: [[r2(gx(29) + 0.9), r2(gz(36) + 0.25)], [r2(gx(36) - 0.25), r2(gz(36) + 0.25)], [r2(gx(36) - 0.25), r2(gz(38) - 0.25)]], y: WH, model: 'balusters_b' });   // its sea side and east end
    feat({ k: 'bridge', absY: true, x0: mx(34), z0: r2(gz(38) - 0.5), x1: mx(34), z1: gz(47), w: C, y: WH, thick: 0.3, rails: false, key: 'metal', id: 'bch:gantry_n' });   // THE GANTRY: out over the quay and the water ...
    feat({ k: 'bridge', absY: true, x0: gx(35), z0: mz(47), x1: gx(33), z1: mz(47), w: C, y: WH, thick: 0.3, rails: false, key: 'metal', id: 'bch:gantry_w' });           // ... and west ...
    feat({ k: 'ramp', absY: true, x0: gx(30), z0: mz(47), x1: gx(33), z1: mz(47), w: C, h0: PY, h1: WH, stairs: true, model: 'steel', edge: 0.1 });                       // ... to a steel stair (`grate` draws black from above: seen) down onto the pier's north arm
    feat({ k: 'rail', pts: [[r2(mx(34) + 1.6), gz(38)], [r2(mx(34) + 1.6), r2(gz(48) - 0.15)], [gx(33), r2(gz(48) - 0.15)]], y: WH, model: 'balusters_b', block: false });   // its railings (a grind only, the old Harbour's way)
    feat({ k: 'rail', pts: [[r2(mx(34) - 1.6), gz(38)], [r2(mx(34) - 1.6), r2(gz(47) + 0.15)], [gx(33), r2(gz(47) + 0.15)]], y: WH, model: 'balusters_b', block: false });
    /* THE SLIPWAY (squares 25-26 x 43-48, down into the boat basin between the sand and the pier's arm) and its pipe rails */
    feat({ k: 'ramp', absY: true, x0: gx(26), z0: gz(43), x1: gx(26), z1: gz(49), w: 2 * C, h0: QY, h1: -2.6, edge: 0.2 });
    feat({ k: 'rail', x0: r2(gx(25) + 0.5), z0: r2(gz(43) + 0.3), x1: r2(gx(25) + 0.5), z1: gz(46), model: 'pipe', block: false });
    feat({ k: 'rail', x0: r2(gx(27) - 0.5), z0: r2(gz(43) + 0.3), x1: r2(gx(27) - 0.5), z1: gz(46), model: 'pipe', block: false });
    /* THE WATER STEPS (the ways out of the water): off the quay into the basin under the gantry, and beside the Long Pier */
    feat({ k: 'ramp', absY: true, x0: mx(32), z0: gz(46), x1: mx(32), z1: r2(gz(43) - 0.5), w: C, h0: -1.8, h1: QY, stairs: true, model: 'external', edge: 0.1 });
    feat({ k: 'ramp', absY: true, x0: mx(40), z0: gz(50), x1: mx(40), z1: r2(gz(53) + 0.5), w: C, h0: -1.8, h1: PY, stairs: true, model: 'external', edge: 0.1 });
    /* the way onto THE BREAKWATER (a cobbled slope from the quay up to its crest) and the railing round the light's head */
    feat({ k: 'ramp', absY: true, x0: gx(35), z0: gz(40), x1: r2(gx(36) + 0.3), z1: gz(40), w: 2 * C, h0: QY, h1: MOLE, edge: 0.1 });
    feat({ k: 'rail', pts: [[gx(46), r2(gz(45) + 0.3)], [r2(gx(45) + 0.3), r2(gz(45) + 0.3)], [r2(gx(45) + 0.3), r2(gz(48) - 0.3)], [r2(gx(48) - 0.3), r2(gz(48) - 0.3)], [r2(gx(48) - 0.3), r2(gz(41) + 0.3)]], y: MOLE, model: 'balusters_b' });
    /* THE QUAY'S PARAPET: open at the slipway, the pier's arm, the water steps and the Breakwater */
    [[30, 32], [33, 36]].forEach(q => feat({ k: 'rail', x0: r2(gx(q[0]) + (q[0] === 24 ? 0.25 : 0)), z0: r2(gz(43) - 0.22), x1: r2(gx(q[1]) - (q[1] === 36 ? 0.25 : 0)), z1: r2(gz(43) - 0.22), model: 'parapet' }));
    feat({ k: 'rail', x0: r2(gx(36) - 0.22), z0: r2(gz(38) + 0.1), x1: r2(gx(36) - 0.22), z1: gz(39), model: 'parapet' }); feat({ k: 'rail', x0: r2(gx(36) - 0.22), z0: gz(41), x1: r2(gx(36) - 0.22), z1: r2(gz(43) - 0.22), model: 'parapet' });
    for (let y = 36; y <= 37; y++) for (let x = 26; x <= 35; x++) taken.add(x + ':' + y);                                                       // the stair and the wharf: nothing is scattered on them
    [[25, 43], [26, 43], [32, 43], [34, 38], [34, 39], [34, 40], [34, 41], [34, 42], [35, 39], [35, 40], [25, 36], [25, 37], [25, 38]].forEach(q => taken.add(q[0] + ':' + q[1]));   // the ways: slip head, water steps, under the gantry, the mole's slope, the landing

    /* THE QUAY'S WALLS: dressed stone down to the sea bed on every water side, a kerb stone along the top; the wharf is brick over a stone foot */
    works('quay', gx(30), gz(40), T => {
        for (let y = 36; y <= 42; y++) for (let x = 24; x <= 35; x++) { if (cell[y][x] !== 'o') continue; const wh = onWharf(x, y);
            SIDES.forEach((d, k) => { if (!isW(x + d[0], y + d[1])) return;
                face(T, x, y, k, BED, QY, 0.3, MAS, STONE, { uv: [3.5, 1.75] });
                if (wh) face(T, x, y, k, QY, WH - 0.16, 0.22, BRK, 0xc08a6a, { uv: [3.5, 3.5], gain: 1.7 });
                face(T, x, y, k, (wh ? WH : QY) - 0.16, (wh ? WH : QY) + 0.06, 0.42, CONC, 0xd8d2c4, { uv: [3.5, 3.5] }); }); }
        T.box(gx(32.5), QY, gz(38) + 0.09, 7 * C, WH - QY - 0.16, 0.18, BRK, 0xc08a6a, { uv: [3.5, 3.5], gain: 1.7 });                                 // the wharf's face to the quay: brick, a stone band on top, iron rings
        T.box(gx(32.5), WH - 0.16, gz(38) + 0.12, 7 * C + 0.2, 0.22, 0.3, CONC, 0xd8d2c4, { uv: [3.5, 3.5] });
        T.box(r2(gx(36) + 0.09), QY, gz(37), 0.18, WH - QY - 0.16, 2 * C, BRK, 0xc08a6a, { uv: [3.5, 3.5], gain: 1.7 });
        for (let k = 0; k < 4; k++) T.part({ s: 'cyl', p: [r2(gx(30.5) + k * 5.25), 1.9, r2(gz(38) + 0.2)], r: 0.2, h: 0.06, ri: 0.13, key: RIB, tint: IRON, seg: 10, uv: 1 });
        [[24, 43, -0.5], [28, 43, -0.5], [30, 43, 0.5], [34, 43, -0.5]].forEach(q => bollard(T, mx(q[0]) + q[2], gz(q[1]) - 0.75, QY));                // bollards along the quay's water edge
        bollard(T, gx(36) - 0.75, mz(38), QY); bollard(T, gx(36) - 0.75, mz(42), QY);
    });
    /* THE SLIPWAY'S LOOK: a concrete slip (a wedge on the slope the walker reads), two timber skids down it, a winch post at its head */
    works('slip', gx(26), gz(46), T => {
        T.part({ s: 'roof', form: 'shed', p: [gx(26), -2.56, gz(46)], size: [2 * C - 0.1, QY + 2.6, 6 * C], key: CONC, tint: 0xcfc8b8, uv: [3.5, 3.5], keyEnd: CONC, tintEnd: 0xcfc8b8 });
        for (const sx of [-1, 1]) T.part({ s: 'roof', form: 'shed', p: [r2(gx(26) + sx * 1.3), -2.44, gz(46)], size: [0.3, QY + 2.6, 6 * C], key: PLK, tint: BEAM, uv: [1.75, 1.75] });
        T.cyl(mx(27) + 1.2, QY, gz(43) - 0.9, 0.2, 1.0, RIB, IRON, { seg: 8, uv: 1 }); T.box(mx(27) + 1.2, QY + 0.55, gz(43) - 0.9, 0.9, 0.36, 0.36, RIB, 0x8a4a32, { uv: 1 });   // the winch: a post and its drum
        T.cyl(mx(27) + 0.72, QY + 0.63, gz(43) - 0.9, 0.3, 0.06, RIB, IRON, { seg: 10, uv: 1 });
    });
    /* THE GANTRY'S LOOK: steel trestles down to the sea bed with truss bracing, a hoist frame over its end with a hook on its chain */
    works('gantry', mx(34), gz(43), T => {
        const leg = (x, z, y0) => T.box(x, y0, z, 0.26, WH - 0.3 - y0, 0.26, RIB, STEEL, { uv: [1.75, 1.75], gain: 1.6 });
        [[40, QY], [42, QY], [44.5, BED], [47.5, BED]].forEach(q => { const z = gz(q[0]); for (const sx of [-1, 1]) leg(mx(34) + sx * 1.5, z, q[1]);
            T.box(mx(34), WH - 0.62, z, 3.4, 0.3, 0.3, RIB, STEEL, { uv: [1.75, 1.75], gain: 1.6 });
            T.part({ s: 'quad', p: [mx(34), Math.max(q[1], 0), z], size: [3.0, r2(WH - 0.6 - Math.max(q[1], 0))], key: TRUSS, tint: STEEL, kind: 'over', ds: true, uv: 'fit' }); });
        for (const sz of [-1, 1]) leg(gx(33.4), mz(47) + sz * 1.5, BED);
        T.box(gx(33.4), WH - 0.62, mz(47), 0.3, 0.3, 3.4, RIB, STEEL, { uv: [1.75, 1.75], gain: 1.6 });
        /* the hoist: two posts and a beam over the gantry's corner, the beam run out past the edge over the basin */
        for (const sx of [-1, 1]) T.box(mx(34) + sx * 1.6, WH, gz(45.5), 0.22, 3.2, 0.22, RIB, 0xd8a032, { uv: [1.75, 1.75], gain: 1.8 });
        T.box(mx(34) - 1.4, WH + 3.2, gz(45.5), 6.6, 0.34, 0.3, RIB, 0xd8a032, { uv: [1.75, 1.75], gain: 1.8 });
        T.box(mx(34) - 3.9, WH + 2.9, gz(45.5), 0.5, 0.3, 0.44, RIB, IRON, { uv: 1 }); T.cyl(mx(34) - 3.9, WH + 0.6, gz(45.5), 0.035, 2.3, null, IRON, { seg: 5 });
        T.part({ s: 'cyl', p: [r2(mx(34) - 3.9), WH + 0.22, gz(45.5)], r: 0.2, h: 0.08, ri: 0.12, key: RIB, tint: IRON, seg: 10, uv: 1 });
    });
    /* THE PIERS: a timber fascia along every water edge and a pile under every square line, down to the sea bed (the district's piers from
       the Quay's plots east: the north arm, the Long Pier out to the Dutchman's bow, the skiff jetty), and bollards where the rings were */
    works('piers', gx(40), gz(54), T => { const piles = new Set();
        for (let y = 43; y <= 64; y++) for (let x = 24; x <= PIER_END; x++) { if (!cell[y] || cell[y][x] !== 'J') continue;
            SIDES.forEach((d, k) => { if (!isW(x + d[0], y + d[1])) return; face(T, x, y, k, PY - 0.46, PY - 0.02, 0.16, PLK, BEAM, { uv: [1.75, 1.75] });
                const cs = d[0] ? [[x + (d[0] > 0 ? 1 : 0), y], [x + (d[0] > 0 ? 1 : 0), y + 1]] : [[x, y + (d[1] > 0 ? 1 : 0)], [x + 1, y + (d[1] > 0 ? 1 : 0)]];
                cs.forEach(c => { const key = c[0] + ':' + c[1]; if (piles.has(key)) return; piles.add(key); T.cyl(gx(c[0]) + d[0] * 0.2, BED, gz(c[1]) + d[1] * 0.2, 0.19, PY + 0.34 - BED, PLK, PILE, { seg: 6, uv: [1.75, 1.75] }); }); }); }
        [[40, 55], [45, 55], [50, 55], [55, 55], [43, 53], [48, 53], [53, 53]].forEach(q => bollard(T, mx(q[0]), gz(q[1]) + (q[1] === 55 ? -0.4 : 0.4), PY));   // the Long Pier's bollards, both edges
        [[30, 59], [30, 63], [30, 48], [30, 51]].forEach(q => bollard(T, gx(q[0]) - 0.4 + (q[1] > 59 ? C : 0), mz(q[1]), PY));
    });
    /* THE GANGWAY (the tool's place GANG, link `beach_dutchman`; nothing showed the way aboard: seen): a brow of planks from the pier up to her
       waist, battens across it, stanchions up both sides, two posts with a rope across the pier's edge either side of its foot */
    works('gangway', GANG.x, GANG.z, T => { const run = 4.6, top = 4.5, z0 = GANG.z - run + 0.5, n = 9, dy = r2((top - PY) / n), dz = r2(run / n);
        T.part({ s: 'roof', form: 'shed', p: [GANG.x, PY, r2(z0 + run / 2)], ry: 180, size: [1.5, top - PY, run], key: PLK, tint: 0xe8d8b8, uv: [1.75, 1.75], keyEnd: PLK, tintEnd: BEAM });
        T.part({ s: 'box', p: [GANG.x, r2(PY + dy * 0.5 + 0.02), r2(z0 + dz * 0.5)], size: [1.5, 0.05, 0.08], key: PLK, tint: PILE, n, step: [0, dy, dz] });
        for (const sx of [-1, 1]) { T.part({ s: 'box', p: [r2(GANG.x + sx * 0.72), r2(PY + dy * 0.5), r2(z0 + dz * 0.5)], size: [0.07, 1.0, 0.07], tint: WHITE, n, step: [0, dy, dz] });
            T.part({ s: 'cyl', p: [r2(GANG.x + sx * 0.72), r2(PY + dy * 0.5 + 1.0), r2(z0 + dz * 0.5)], r: 0.07, h: 0.07, tint: ROPE, seg: 6, n, step: [0, dy, dz] });
            T.cyl(GANG.x + sx * 1.3, PY, z0 - 0.3, 0.09, 1.25, PLK, BEAM, { seg: 6 }); T.cyl(GANG.x + sx * 1.3, PY + 1.25, z0 - 0.3, 0.13, 0.1, null, WHITE, { seg: 6 });
            T.box(GANG.x + sx * 2.4, PY + 0.95, z0 - 0.3, 2.2, 0.05, 0.05, null, ROPE); T.cyl(GANG.x + sx * 3.5, PY, z0 - 0.3, 0.09, 1.25, PLK, BEAM, { seg: 6 }); T.cyl(GANG.x + sx * 3.5, PY + 1.25, z0 - 0.3, 0.13, 0.1, null, WHITE, { seg: 6 }); }
    });
    /* THE BREAKWATER: armour blocks tipped along its sea side (north) and round its head, half in the water (its own dice) */
    works('mole', gx(42), gz(40), T => { const blk = (x, z) => { const s = r2(1.1 + rnd() * 0.9); T.box(x + (rnd() - 0.5) * 0.8, r2(-0.9 + rnd() * 0.9), z + (rnd() - 0.5) * 0.8, s, r2(s * (0.7 + rnd() * 0.4)), s, 'rocks_5', 0xd0cabc, { ry: Math.round(rnd() * 80), uv: [1.75, 1.75] }); };
        for (let x = gx(36.3); x < gx(48); x += 1.9) { blk(x, gz(39) - 1.0); if (rnd() < 0.5) blk(x, gz(39) - 2.3); }
        for (let x = gx(36.3); x < gx(45.6); x += 2.6) blk(x, gz(41) + 0.9);
        for (let z = gz(41.4); z < gz(44.8); z += 2.6) blk(gx(46) - 0.9, z);
        for (let x = gx(45); x < gx(47.6); x += 2.0) blk(x, gz(48) + 1.0); for (let z = gz(45); z < gz(48); z += 2.0) blk(gx(45) - 1.0, z);
    });
    /* THE HARBOUR MOUTH + THE ROADS (the plan: "open water, buoys" · "open water where ships wait"): the Mouth's gate = two pile beacons, a red
       can to port and a green cone to starboard coming in; the Roads' mooring buoys, where a waiting ship would lie (NEEDS A MODEL: the ship) */
    const beacon = (T, x, z, tint, cone) => { for (const q of [[0.45, 0.2], [-0.4, 0.3], [0, -0.45]]) T.cyl(x + q[0], BED, z + q[1], 0.19, 2.6 - BED, PLK, PILE, { seg: 6, uv: [1.75, 1.75] });
        T.cyl(x, 1.5, z, 0.62, 0.14, RIB, IRON, { seg: 8, uv: 1 }); T.cyl(x, 2.5, z, 0.5, 0.1, PLK, BEAM, { seg: 8 }); T.cyl(x, 2.6, z, 0.08, 1.9, null, WHITE, { seg: 6 });
        T.cyl(x, 4.5, z, 0.62, 1.25, RIB, tint, { seg: 10, r2: cone ? 0.02 : 0.62, uv: 1, gain: 2.2 }); T.cyl(x, 5.78, z, 0.13, 0.2, null, tint, { seg: 6, glow: 1 }); };   // (the atmosphere pass: a lit lamp on its top)
    works('mouth', mx(27), mz(78), T => { beacon(T, mx(24), mz(78), 0xe03a30, false); beacon(T, mx(30), mz(78), 0x2aa860, true); });
    const mooring = (T, x, z) => { T.cyl(x, -0.35, z, 0.75, 0.95, RIB, 0xf0902a, { seg: 10, uv: 1, gain: 2.2 }); T.cyl(x, 0.6, z, 0.75, 0.12, RIB, WHITE, { seg: 10, uv: 1, gain: 2.4 });
        T.part({ s: 'cyl', p: [r2(x), 0.72, r2(z)], r: 0.22, h: 0.07, ri: 0.14, key: RIB, tint: IRON, seg: 8, uv: 1 }); };
    works('roads', mx(41), mz(77), T => { [[38, 75], [44, 75], [38, 80], [44, 80]].forEach(q => mooring(T, mx(q[0]), mz(q[1]))); });

    /* ── THE ATMOSPHERE PASS (2026-11-16; seen at 22:30 first: the quay, the wharf and the piers were black, `railway_lantern` lights nothing).
       DRAWN GLOW (it shows where things are, it lights nothing: the kit): harbour lamps on iron posts down the Long Pier's north edge, on
       the pier's arm, the skiff jetty, the quay's corners and the wharf's rail; warm bulbs under the shed's front eave and a lamp over its
       door; a work lamp on the gantry's hoist; the Mouth's beacons lit red and green. REAL LIGHT is five props in place() (two floodlight
       masts, three fire baskets). The Breakwater's own light turns its beam already. Sound and particles have no hook a district reaches. ── */
    const LAMP = 0xffe2a8;
    /* THE MODEL PASS (11-16): a harbour lamp is the wish list's `iron_lamp_post` (3.5 m, a blocker on the edge it stands at). It was a drawn pole, arm and
       shade (the stand-in is out). The model carries no glow and no light, so one small drawn flame stays in its lantern: that is its light after dark. */
    const lamp = (T, x, z, y) => { props.push({ key: 'iron_lamp_post', x: r2(x), z: r2(z) }); T.cyl(x, y + 2.9, z, 0.19, 0.36, null, LAMP, { seg: 4, glow: 1 }); };   // (as wide as the lantern's glass: a thinner flame was hidden inside it at night, seen)
    works('lamps_pier', gx(40), gz(53), T => { [25, 31, 37, 43, 49, 55].forEach(c => lamp(T, gx(c), gz(53) + 0.22, PY));
        [46, 50].forEach(r => lamp(T, gx(30) - 0.22, gz(r), PY)); lamp(T, gx(28) + 0.22, gz(57.5), PY); lamp(T, gx(31) - 0.22, gz(62.5), PY); });
    works('lamps_quay', gx(30), gz(40), T => { lamp(T, gx(24) + 0.3, gz(43) - 0.3, QY); lamp(T, gx(30) - 0.4, gz(43) - 0.3, QY); lamp(T, gx(36) - 0.3, gz(41) - 0.3, QY); lamp(T, gx(29) + 0.3, gz(38) + 0.4, QY);
        [30.5, 33.5].forEach(c => lamp(T, gx(c), gz(36) + 0.4, WH)); lamp(T, gx(36) - 0.4, gz(37), WH);
        T.cyl(mx(34) - 2.6, WH + 2.86, gz(45.5), 0.16, 0.24, null, LAMP, { seg: 8, glow: 0.95, r2: 0.09 });                                              // the hoist's work lamp
        T.part({ s: 'cyl', p: [r2(gx(27.5) - 4.6), QY + 3.92, r2(gz(42) + 0.5)], r: 0.06, h: 0.12, tint: LAMP, glow: 1, seg: 6, n: 12, step: [0.84, 0, 0] });   // warm bulbs under the shed's front eave
        T.box(gx(27.5), QY + 4.06, gz(42) + 0.5, 9.6, 0.02, 0.02, null, 0x2a2a2a);
        T.cyl(gx(27.5) - 0.87, QY + 2.44, gz(42) + 0.22, 0.07, 0.14, null, LAMP, { seg: 6, glow: 1 });                                         // the lamp over the shed's door
    });
    /* THE SIGNS (the dressing pass; dark stencil letters on white boards: the kit): a finger post where the pier's arm meets the quay, the
       slipway's board on its winch side, the wharf's name on its brick */
    works('signs', gx(30), gz(43), T => { const px = gx(30) + 0.5, pz = gz(43) - 0.6;
        T.cyl(px, QY, pz, 0.07, 3.0, null, WHITE, { seg: 6 }); T.cyl(px, QY + 3.0, pz, 0.11, 0.1, null, IRON, { seg: 6 });
        [['LONG PIER', 2.55, 0], ['BREAKWATER', 2.1, 0], ['WHARF', 1.65, 180], ['SLIPWAY', 1.2, 180]].forEach(q => { const dir = q[2] ? -1 : 1, w = q[0].length * 0.2 + 0.3;
            T.box(px + dir * (w / 2 + 0.1), QY + q[1], pz, w, 0.34, 0.05, null, WHITE);
            T.sign(q[0], px + dir * (w / 2 + 0.1), QY + q[1] + 0.04, pz + 0.035, w - 0.12, 0.26, '#2a2622', '#ffffff', 'stencil'); T.sign(q[0], px + dir * (w / 2 + 0.1), QY + q[1] + 0.04, pz - 0.035, w - 0.12, 0.26, '#2a2622', '#ffffff', 'stencil', { ry: 180 }); });
        T.box(gx(27) + 0.5, QY, gz(43) - 0.35, 0.08, 1.5, 0.08, null, WHITE); T.box(gx(27) + 0.5, QY + 1.0, gz(43) - 0.3, 1.9, 0.7, 0.05, null, WHITE);
        T.sign('SLIPWAY', gx(27) + 0.5, QY + 1.36, gz(43) - 0.265, 1.7, 0.28, '#2a2622', '#ffffff', 'stencil'); T.sign('KEEP CLEAR', gx(27) + 0.5, QY + 1.05, gz(43) - 0.265, 1.7, 0.24, '#c8281e', '#ffffff', 'stencil');
        T.box(gx(32.5), QY + 1.75, gz(38) + 0.2, 4.4, 0.8, 0.05, null, WHITE); T.sign('WHARF', gx(32.5), QY + 1.83, gz(38) + 0.235, 4.0, 0.64, '#2a2622', '#ffffff', 'stencil');
    });
    /* THE QUAY SHED (walk-in): red painted boards, white trim, a tin roof, barn doors onto the quay, a hoist beam in the gable, its name on a
       white board (the kit's paint: the painted corrugated sheet at gain 2.9; tar over the brown board sheet was a black box, seen) */
    /* ── THE INTERIOR PASS (2026-11-16; seen first: a brown box under a black ceiling, nine props). The Shore's `inside` (the zone kit), for a
       working shed: cream boards over a red board dado and its rail, a LIT board ceiling 5 cm under the building's own (3.88 m: h 4.2 less
       0.32), three tie beams, daylight in the seven windows the outside has (a plank loft on the beams drew as a black slab from below: seen, out). The coat
       stands 0.335 in (the hollow building's inner face is 0.30 in). THE SQUARES: 3 x 3, middles at -3.5 / 0 / 3.5 in the shed's frame; the
       door stands on the front-middle one; that square and the middle one stay clear. ── */
    const inside = (a, w, d, h, door) => { const W2 = w / 2, D2 = d / 2, e = 0.335, lit = { gain: 2.9, glow: 0.16, uv: [2.4, 2.4], kind: 'wall' }, CREAM = 0xf2e6cc;
        const Q = (x, y, z, qw, qh, ry, key, tn, o) => a.P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(qw), r2(qh)], ry, key, tint: tn }, o));
        const coat = (y0, hh, tn, o) => { Q(0, y0, -D2 + e, w - 2 * e, hh, 0, CORR, tn, o); Q(0, y0, D2 - e, w - 2 * e, hh, 180, CORR, tn, Object.assign({}, o, y0 < 2.2 ? { hole: [r2(-door.lx), r2(door.cw + 0.12), r2(2.25 - y0)] } : null));
            Q(-W2 + e, y0, 0, d - 2 * e, hh, 270, CORR, tn, o); Q(W2 - e, y0, 0, d - 2 * e, hh, 90, CORR, tn, o); };
        coat(1.1, h - 1.1, CREAM, lit); coat(0, 1.1, FALU, lit);
        const band = (y, bh, t, tn) => { const f = e + t / 2; a.box(0, y, -D2 + f, w - 2 * e, bh, t, null, tn); for (const sg of [-1, 1]) a.box(sg * (W2 - f), y, 0, t, bh, d - 2 * e, null, tn);
            a.box((-W2 + e + door.lx - door.cw / 2 - 0.1) / 2, y, D2 - f, door.lx - door.cw / 2 - 0.1 + W2 - e, bh, t, null, tn); a.box((door.lx + door.cw / 2 + 0.1 + W2 - e) / 2, y, D2 - f, W2 - e - door.lx - door.cw / 2 - 0.1, bh, t, null, tn); };
        band(0.14, 0.16, 0.05, 0x7a2a22); band(1.08, 0.08, 0.06, WHITE);
        a.box(0, h - 0.05, 0, w - 0.66, 0.04, d - 0.66, CORR, 0xfff2d8, { glow: 0.45, gain: 3.0, under: true, roof: true, top: false, ds: true, uv: [2.4, 2.4] });   // the lit ceiling
        for (const z of [-3.5, 0, 3.5]) a.box(0, h - 0.3, z, w - 0.6, 0.22, 0.2, null, 0xc8b08a, { roof: true });                                                // tie beams
        const wins = [['f', -3.75, 1.15, 1.2, 1.2], ['f', 1.9, 1.15, 1.2, 1.2], ['f', 3.85, 1.15, 1.2, 1.2], ['l', -2.6, 1.38, 1.24, 1.14], ['l', 2.6, 1.38, 1.24, 1.14], ['r', -2.6, 1.38, 1.24, 1.14], ['r', 2.6, 1.38, 1.24, 1.14]];
        wins.forEach(q => { const [wl, al, y, ww, wh] = q, at = wl === 'f' ? [al, D2 - e - 0.03, 180] : wl === 'l' ? [-W2 + e + 0.03, al, 270] : [W2 - e - 0.03, al, 90];
            const nx = wl === 'l' ? 1 : wl === 'r' ? -1 : 0, nz = wl === 'f' ? -1 : 0, side = wl !== 'f';
            Q(at[0], y - 0.1, at[1], ww + 0.24, wh + 0.2, at[2], null, WHITE, { kind: 'wall' }); Q(at[0] + nx * 0.02, y, at[1] + nz * 0.02, ww, wh, at[2], GLS, 0xdcf0ff, { glow: 0.8, win: 'keep', uv: 'fit' });
            a.box(at[0] + nx * 0.04, y + wh / 2 - 0.03, at[1] + nz * 0.04, side ? 0.03 : ww, 0.06, side ? ww : 0.03, null, WHITE); a.box(at[0] + nx * 0.04, y, at[1] + nz * 0.04, side ? 0.03 : 0.06, wh, side ? 0.06 : 0.03, null, WHITE); }); };
    /* a prop inside the shed (the kit's `In`): on the plank floor (0.14); a height of 1 m or more is typed over LEVEL 0, so the quay's 0.9 is added; `floor: true` keeps a wall piece off the wall row's top */
    const In = (key, lx, lz, face, y, o) => { const yy = 0.14 + (y || 0); put(SHED, key, lx, lz, Object.assign({ face: face || 0, floor: true, y: r2(yy < 1 ? yy : QY + yy) }, o)); };
    const win = (a, x, y, z, w, h) => { a.box(x, y - 0.08, z, w + 0.24, h + 0.16, 0.06, null, WHITE); a.box(x, y, z + 0.03, w, h, 0.04, GLS, 0xdcecff, { uv: 'fit', win: 'keep', glow: 0.35 });
        a.box(x, y + h / 2 - 0.03, z + 0.06, w, 0.06, 0.03, null, WHITE); a.box(x, y, z + 0.06, 0.06, h, 0.03, null, WHITE); };
    SHED = building('shed', [B_SHED[0], B_SHED[1], B_SHED[0] + 3, B_SHED[1] + 3, 'S'], 4.2, { leaf: 'leaf_barn', leafDouble: true, floorIn: U('WoodFlooring1a') }, (a, w, d, door) => {
        a.shell(w, 4.2, d, CORR, FALU, door, [2.4, 2.4], 2.9);
        a.box(0, 0, 0, w - 0.1, 0.14, d - 0.1, U('WoodFlooring1a'), 0x8a7c68, { uv: [1.75, 1.75] });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.3, 4.2, 0.3, null, WHITE);
        for (const sx of [-1, 1]) a.box(sx * (w / 2 + 0.06), 0, 0, 0.05, 0.34, d, null, WHITE); a.box(0, 0, -(d / 2 + 0.06), w, 0.34, 0.05, null, WHITE);
        a.roof('gable', 0, 4.2, 0, w + 1.0, 2.6, d + 0.9, CORR, TIN, { keyEnd: CORR, tintEnd: FALU, gain: 2.6 });
        a.box(0, 4.14, d / 2 + 0.42, w + 1.0, 0.16, 0.06, null, WHITE); a.box(0, 4.14, -(d / 2 + 0.42), w + 1.0, 0.16, 0.06, null, WHITE);              // the white barge boards
        a.frame(door, d, null, WHITE);
        a.box(door.lx, 2.62, d / 2 + 0.07, 3.9, 0.96, 0.06, null, WHITE); a.sign('HARBOUR', door.lx, 2.75, d / 2 + 0.11, 3.5, 0.7, '#2a2622', '#ffffff', 'stencil');
        [-3.75, 1.9, 3.85].forEach(x => win(a, x, 1.15, d / 2 + 0.06, 1.2, 1.2));
        a.box(door.lx, 5.5, d / 2 + 1.0, 0.2, 0.22, 2.0, null, WHITE); a.cyl(door.lx, 4.6, d / 2 + 1.8, 0.03, 0.9, null, IRON, { seg: 5 });           // the hoist beam in the gable, its chain and block
        a.box(door.lx, 4.42, d / 2 + 1.8, 0.2, 0.2, 0.2, RIB, IRON, { uv: 1 });
        for (const s of [-1, 1]) for (const z of [-2.6, 2.6]) { a.box(s * (w / 2 + 0.06), 1.3, z, 0.06, 1.3, 1.4, null, WHITE); a.box(s * (w / 2 + 0.09), 1.38, z, 0.04, 1.14, 1.24, GLS, 0xdcecff, { uv: 'fit', win: 'keep', glow: 0.35, faces: s < 0 ? 'l' : 'r', top: false }); }   // two windows each side
        inside(a, w, d, 3.88, door);
    });
    /* THE SHED'S INSIDE (the catalogue and the model list both searched): what blocks stands on a square's middle, the rest off it or on a wall.
       Back row: the pots, the net bench under its pegboard, the crates. Middle row: the fish scale, the way, a crate and the hand truck.
       Front row: the harbour desk with the ship's model, the door, the anchor. The nine props that stood here are all kept. */
    In('lobster_traps', -3.5, -3.5, 0); In('steel_table', 0, -3.5, 0); In('psx_wooden_crate_1', 3.5, -3.5, 0); In('psx_wooden_crate_2', 3.5, 0, 20); In('platform_scale', -3.5, 0, 90); In('tanker_desk', -3.5, 3.5, 90); In('ship_anchor', 3.5, 3.5, 110);
    In('tool_pegboard', 0, -4.78, 180, 1.35); In('fishing_net_wall', -2.9, -4.78, 180, 1.5); In('fishing_net_wall', 2.9, -4.78, 180, 1.5); In('meshy_retro_radio', -0.6, -3.6, 200, 0.76); In('psx_jerrycan_1', 0.7, -3.5, 30, 0.76); In('psx_fish_skeleton_mp_1', 0.2, -3.2, 70, 0.76);
    In('meshy_rope', -1.6, -3.9, 0); In('outboard_motor', 1.5, -4.2, 0); In('wooden_bucket', -1.4, -2.6, 0); In('psx_metal_barrel_mp_1', -4.2, -1.7, 0); In('tire_stack', 4.2, -1.9, 0); In('psx_supply_crate_1', 2.2, -3.9, 15); In('hand_truck', 2.2, 0.9, 250);
    In('ship_wheel', 4.78, 0, 270, 1.7); In('beach_life_ring', 4.78, -2.6 + 1.2, 270, 1.6); In('ships_bell', -4.78, -1.3, 90, 1.9); In('star_chart', -4.78, 3.9, 90, 1.45);
    In('ship_model', -3.6, 3.2, 90, 0.76); In('brass_telescope', -2.7, 4.3, 200); In('folding_chair', -2.2, 3.0, 270); In('sea_chest', -4.1, 1.7, 90); In('railway_lantern', 1.5, 4.3, 0); In('meshy_burlap_sack', 4.1, 2.0, 40); In('meshy_burlap_sack', 3.3, 1.7, 160); In('doormat', SHED.door.lx, 4.4, 0, 0.01);
},

place(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    const skip = () => { rnd(); rnd(); rnd(); };   // a `dockring` that stood here (a three-metre space-station docking ring: seen): the bollards in build() took its place; its throws are kept so nothing else moved
    P('psx_wooden_crate_3', 24, OY); P('psx_wooden_crate_1', 24, OY + 1);   // (moved off the way to the wharf's stair: the landing's west side)
    P('psx_metal_barrel_mp_2', 31, OY + 3); P('ship_anchor', 30, OY + 5, { face: 110 }); skip(); skip(); P('railway_lantern', 30, OY + 6);
    dec('cardboard_boxes', 28, OY + 10); dec('sea_chest', 33, OY + 17); dec('folding_chair', 26, OY + 18, { face: 200 }); P('railway_lantern', 24, OY + 17); P('railway_lantern', 36, OY + 18); skip(); skip();
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
    P('ship_cannon', 26, OY + 2, { face: 90 });   /* (the shed's outboard, wheel and bell: in build() with the rest of its inside) */
    [42, 47, 55].forEach(x => P('railway_lantern', x, 53)); [40, 45, 50, 54].forEach(() => { rnd(); rnd(); rnd(); }); dec('ocean_lobster', 44, 53, { anim: false }); dec('psx_wooden_crate_2', 49, 53); dec('sea_chest', 56, 54); dec('lobster_traps', 41, 53);
    /* the mole's boulders (polish; they were a scatter of 10 `ocean_rock_8`: black lumps on the crest, seen; the old Harbour's `cave_stone` is a 2 m standing stone here and a
       blocker on a crest two squares wide, seen): ten grey boulders set by hand on the crest's OUTER edge (the sea side row), so the inner row stays the walk. (No kelp: 4.5 m tall in 3.5 m of water.) */
    [[37, 39, -0.6, -1.2, 1], [38, 39, 0.9, -1.3, 3], [40, 39, -1.0, -1.25, 2], [41, 39, 1.1, -1.2, 4], [42, 39, 0.2, -1.3, 1], [44, 39, -0.4, -1.2, 3], [45, 39, 1.0, -1.25, 2], [47, 41, 1.25, 0.4, 4], [47, 43, 1.2, -0.8, 1], [47, 44, 1.25, 0.9, 2]]
        .forEach((q, k) => props.push({ key: 'psxg_rock_' + q[4], x: r2(mx(q[0]) + q[2]), z: r2(mz(q[1]) + q[3]), face: (k * 67) % 360 }));
    /* ── THE MODEL LIST FINDS (2026-11-16, mondo's THE MODEL LIST FIRST: "look at the model list ... to see what else they could add"). The first
       pass searched the prop catalogue only. MODEL_LIST.md and the pack archives held more: the Elbolilloduro HOUSES ON THE WATER scene (87
       pieces, only its rowboat was in the game; seven more cut out now: catalogue `stilt_hut`, `stilt_house`, `stilt_house_wide`,
       `fishing_boat`, `mooring_piles`, `generator`, `hammock`), mondo's own scaffold crane (`babel_crane`), the ocean pack's resting seal.
       A stilt house's foot is its piles' bottom: `y: 0.6` on the 3.5 m sea bed stands its deck 0.7 m over the water. ── */
    const stilt = (key, x, z, face, sq) => { props.push({ key, x: r2(x), z: r2(z), y: 0.6, face }); sq.forEach(q => { spot(q[0], q[1], key, 'sea', true); taken.add(q[0] + ':' + q[1]); }); };
    const adrift = (key, x, z, face) => props.push({ key, x: r2(x), z: r2(z), y: -0.5, hover: 0.55, face });
    stilt('stilt_house_wide', mx(41), mz(78), 0, [[40, 77], [41, 77], [42, 77], [40, 78], [41, 78], [42, 78], [40, 79], [41, 79], [42, 79]]);   // THE ROADS: a house on piles among the mooring buoys, a boat lying to it
    adrift('fishing_boat', mx(41), mz(78) + 6.3, 0);
    stilt('stilt_hut', mx(33), gz(80), 0, [[33, 79], [33, 80]]); adrift('rowboat', mx(33) - 3.2, gz(80), 90);                                    // THE MOUTH: a hut on piles east of the channel, its rowboat
    stilt('stilt_house', gx(26), gz(69), 90, [[24, 68], [25, 68], [26, 68], [27, 68], [24, 69], [25, 69], [26, 69], [27, 69]]);                    // off the skiff jetty: the fishermen's house
    adrift('fishing_boat', gx(26), gz(69) + 5.0, 0);
    props.push({ key: 'fishing_boat', x: gx(26), z: gz(44.6), face: 90 });                                                                       // a boat hauled up the slipway
    adrift('rowboat', mx(31) - 0.4, mz(44), 80);                                                                                                 // a rowboat at the water steps, under the gantry
    props.push({ key: 'mooring_piles', x: mx(24), z: mz(47) }); props.push({ key: 'mooring_piles', x: mx(24), z: mz(44) });                      // piles in the boat basin's shallows
    P('generator', 29, OY + 4, { face: 90 });                                                                                                    // the shed's generator, against its east wall
    props.push({ key: 'babel_crane', x: mx(31), z: mz(36), face: 180 });                                                                         // THE WHARF'S CRANE (mondo's scaffold crane), on the wharf's back row
    props.push({ key: 'ocean_seal_resting', x: r2(mx(40) + 0.6), z: r2(mz(39) - 0.5), face: 200 }); props.push({ key: 'ocean_seal_resting', x: r2(mx(43) - 0.4), z: r2(mz(39) - 0.7), face: 150 });   // seals hauled out on the Breakwater
    props.push({ key: 'ocean_seal_resting', x: r2(gx(26) + 2.2), z: gz(47.2), face: 20 });                                                        // and one at the slip's foot
    /* ── THE DRESSING PASS (2026-11-16; MODEL_LIST.md searched first, the zone kit's FROM THE MODEL LIST). Every place has work lying about it:
       freight on the wharf's back row under the crane (its front row is the walk to the gantry), stores on the quay's east apron and its
       west lane, nets drying on the shed's walls, ship's stores on the Long Pier's north row (the south row is the walk), pots on the skiff
       jetty, a bench at the light. CARRIED OVER FROM THE OLD HARBOUR ROOM: the crab and the starfish at the slipway's head, the second
       dolphin, the shark past the buoys, the fish schools. Drawn: a finger post where the pier's arm meets the quay, the slip's board,
       the wharf's name on its brick (plain words: the plan's own place names). MORE PEOPLE (mondo 11-16: "There need to be more NPCs"):
       eight, none with a line, none on a way through. ── */
    const on = (key, sx, sy, o) => props.push(Object.assign({ key, x: mx(sx), z: mz(sy) }, o));                                   // a blocker on a square's middle, on ground the tool's `P` does not know (the wharf, the Breakwater)
    const off = (key, sx, sy, dx, dz, o) => props.push(Object.assign({ key, x: r2(mx(sx) + dx), z: r2(mz(sy) + dz) }, o));        // decor off the middle, placed by hand
    on('wrapped_pallet', 29, 36); on('psx_supply_crate_1', 32, 36, { face: 10 }); on('psx_supply_crate_1_2', 33, 36, { face: 80 }); on('psx_metal_barrel_mp_2', 35, 36); off('cable_drum', 30, 36, 0.3, -0.2, { face: 40 }); off('psx_metal_barrel_mp_0', 35, 36, -1.3, 0.5); off('meshy_rope', 30, 37, -1.1, -1.2); off('traffic_cone', 33, 36, 1.4, 1.0);
    P('ind_skip', 33, OY + 2, { face: 90 }); P('gas_cylinder_rack', 35, OY + 2, { face: 270 }); P('psx_supply_crate_1_3', 31, OY + 4, { face: 30 }); P('lobster_traps', 24, OY + 4, { face: 90 }); P('lobster_traps', 24, OY + 2, { face: 0 });   // (never on 25, OY + 6: the only way round the shed to the wharf's stair)
    off('pallet_jack', 31, OY + 3, 0.9, 1.1, { face: 200 }); off('tire_stack', 33, OY + 6, 0.2, 1.0); off('tire_stack', 31, OY + 6, -0.9, 1.1); off('psx_jerrycan_1', 29, OY + 4, 1.2, -0.9, { face: 60 }); off('meshy_burlap_sack', 33, OY + 5, 0.6, -0.5); off('meshy_burlap_sack', 33, OY + 5, -0.4, 0.3, { face: 120 }); off('wooden_bucket', 27, OY + 6, 0.9, 0.9);
    put(SHED, 'fishing_net_wall', -5.42, 0, { face: 270, floor: true, y: 0.9 + 1.5 }); put(SHED, 'fishing_net_wall', 0, -5.42, { face: 0, floor: true, y: 0.9 + 1.5 });   /* (polish: one net between the west wall's two windows, one on the back wall; two on the west wall hung over the windows, seen) */ put(SHED, 'beach_life_ring', 5.42, 0.2, { face: 90, floor: true, y: 0.9 + 1.7 });   // nets drying on the shed's west wall, a ring on its east
    props.push({ key: 'ocean_crab', x: r2(gx(26) - 1.9), z: r2(gz(43) + 1.2), face: 300 }); props.push({ key: 'ocean_starfish', x: r2(gx(26) + 1.6), z: r2(gz(43) + 2.2), face: 40 });                                                                       // the old Harbour's, at the slipway's dry head
    swimmer('ocean_dolphin', 28, OY + 44, { swim: { r: 6, v: 2.0, bob: 0.35 } }); swimmer('ocean_shark', 27, OY + 52, { y: -0.9, hover: 0.2, swim: { r: 9, v: 1.3, bob: 0.1 } });                                                                             // the old Harbour's second dolphin, and the shark past the buoys
    feat({ k: 'scatter', key: 'fish_school', n: 4, x: mx(34), z: mz(OY + 40), r: 30, seed: 35, sea: true });
    P('wrapped_pallet', 50, 53); P('psx_supply_crate_1_1', 53, 53, { face: 20 }); P('psx_metal_barrel_mp_3', 46, 53); off('meshy_rope', 48, 53, 0.4, -0.5); off('psx_wooden_crate_4', 44, 53, 1.0, -0.6, { face: 15 }); off('meshy_burlap_sack', 54, 53, -0.3, -0.7); off('wooden_bucket', 39, 53, 0.5, -0.9);   // ship's stores down the Long Pier's north row
    P('lobster_traps', 28, 57, { face: 90 }); off('wooden_bucket', 29, 61, -0.9, 0.4); off('ocean_crab', 30, 62, 0.5, -0.4, { face: 120 }); off('meshy_rope', 29, 63, -0.8, 0.8);                                                                             // the skiff jetty
    off('city_bench', 46, 47, 0, 0.9, { face: 180 }); off('railway_lantern', 45, 47, -0.9, 0.9); off('ocean_crab', 43, 40, 0.4, 0.6, { face: 20 });                                                                                                        // a bench at the light, looking out
    /* the people: on the wharf, under the crane, at the slip, on the Breakwater's head, down the Long Pier, at the gangway, on the skiff jetty */
    const who = (race, sx, sy, face, dx, dz) => ctx.npc.push({ x: r2(mx(sx) + (dx || 0)), z: r2(mz(sy) + (dz || 0)), face, race });
    who('homosapien', 30, 37, 180, 0.8, 1.25); who('homosapien', 32, 37, 180, 0.4, 1.25);   /* (polish: at the wharf's front rail looking over the harbour, off the walk to the gantry) */ who('pirate', 24, 42, 135, 0.6, 0); who('homosapien', 47, 45, 90, 0.9, 0); who('homosapien', 38, 53, 0, 0, -0.9);
    who('pirate', 49, 53, 150, 0.2, -0.9); who('homosapien', 29, 60, 90, 0.8, 0); who('sharkman', 34, 41, 200, 0.9, 0.6);
    /* THE ATMOSPHERE PASS, the real light (five props, each on a square's middle; the room carried about 20 lit props before): a floodlight
       mast on the quay's apron and one on the Long Pier before the gangway (`flood_mast`: a 26 m light, lit by the world clock at dusk),
       fire baskets on the wharf, at the light's head and on the skiff jetty (`brazier`: a 9 m light) */
    P('flood_mast', 33, OY + 4); P('flood_mast', 44, 53); on('brazier', 34, 36); on('brazier', 47, 47); P('brazier', 30, 61);
    /* ── THE MODEL PASS (2026-11-16, mondo: "these are models that were added ... use these ones"; docs/plans/WISHLIST_MODELS_ADDED.md read end to
       end). What this district asked for and got: `trawler`, `tugboat`, `seagull`, `rope_coils`, `fish_boxes`, `mooring_bollard` (build(): the
       drawn bollards are out). From the others' asks: `iron_lamp_post` (build(): the drawn lamps are out), `cage_lamp`, `drying_fish`, `oars`,
       `fishing_rod`, `woven_baskets`, `wooden_barrel`, `coin_telescope`, `heron`, `wooden_ladder`, `wheelbarrow`. ── */
    const ship = (key, x, z, face, y) => props.push({ key, x: r2(x), z: r2(z), y: y || -1.6, hover: 0.55, face });                                             // afloat, about a metre of her under the water
    ship('trawler', mx(41), mz(73), 0); for (let x = 38; x <= 43; x++) for (const y of [72, 73]) taken.add(x + ':' + y);                                // THE ROADS: a trawler lying at the mooring buoys (the plan: "where ships wait")
    props.push({ key: 'tugboat', x: mx(45), z: r2(gz(53) - 5.0), y: -2.2, hover: 0, face: 0 });   /* (her keel is deep: `hover: 0` and a fixed depth; with a `hover` her red bottom rode out of the water whatever `y` said, seen twice) */   /* (her model's keel is deep: at the trawler's -1.6 her red bottom stood out of the water, seen) */ for (let x = 43; x <= 47; x++) for (const y of [51, 52]) taken.add(x + ':' + y);                           // the harbour tug alongside the Long Pier's north side
    put(SHED, 'cage_lamp', SHED.door.lx, 5.36, { face: 0, floor: true, y: 0.9 + 2.4 }); put(SHED, 'wooden_ladder', 3.2, -5.45, { face: 0, floor: true, y: 0 });
    P('fish_boxes', 31, OY + 5); P('fish_boxes', 35, OY + 5, { face: 90 }); P('fish_boxes', 45, 53, { face: 20 }); P('wooden_barrel', 35, OY + 6); P('wooden_barrel', 54, 53); P('drying_fish', 28, 55, { face: 90 });
    off('rope_coils', 30, OY + 6, 1.0, 0.9, { face: 30 }); off('rope_coils', 41, 54, 0.6, 1.0, { face: 110 }); off('rope_coils', 48, 53, -1.0, -0.9); on('rope_coils', 32, 36, { face: 60 });
    off('woven_baskets', 27, OY + 6, -1.1, 1.0, { face: 40 }); off('woven_baskets', 29, 58, 0.9, 0.3); off('oars', 30, 62, -0.2, 1.2, { face: 80 }); props.push({ key: 'oars', x: r2(gx(26) + 2.6), z: r2(gz(43) + 1.6), face: 10 });
    off('fishing_rod', 27, 53, 0, -1.2, { face: 0 }); off('wheelbarrow', 31, 36, 1.4, 1.0, { face: 250 }); off('coin_telescope', 45, 47, -0.9, 0.4, { face: 270 });   /* (no `rat`: its file is 21,754 triangles for a 12 cm animal) */
    props.push({ key: 'heron', x: r2(mx(24) - 0.2), z: r2(mz(45) + 0.6), face: 100 });                                                                // a heron in the boat basin's shallows
    /* gulls (scenery, off every way): on the quay's kerb, the pier's edges, the Breakwater's boulders' side, the wharf's back edge, the shed's ridge */
    [[gx(31) + 0.8, gz(43) - 0.25, 160], [gx(34) + 0.5, gz(43) - 0.3, 200], [gx(36) - 0.3, mz(42) + 0.6, 90], [gx(47), gz(53) + 0.2, 0], [gx(52) + 0.9, gz(53) + 0.2, 340], [gx(56) + 1.2, gz(53) + 0.25, 30], [gx(31) - 0.25, gz(64) - 0.6, 100],
     [mx(39) + 0.7, gz(39) + 0.3, 350], [mx(43) + 1.2, gz(39) + 0.35, 20], [gx(48) - 0.35, mz(46), 80], [gx(31), gz(36) + 0.3, 0], [gx(33) + 0.4, gz(36) + 0.3, 330]].forEach(q => props.push({ key: 'seagull', x: r2(q[0]), z: r2(q[1]), face: q[2] }));
    props.push({ key: 'seagull', x: r2(gx(27.5) - 2.0), z: gz(40.5), y: 0.9 + 6.82, floor: true, face: 200 }); props.push({ key: 'seagull', x: r2(gx(27.5) + 1.4), z: gz(40.5), y: 0.9 + 6.82, floor: true, face: 160 });   // two on the shed's ridge
},
};
