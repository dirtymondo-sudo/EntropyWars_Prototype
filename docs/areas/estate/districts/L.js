/* THE ESTATE · THE LAKE (district L, the north-east nine: plots x 3..5 · y 0..2, squares sx 36..71 · sy 0..35, level 0).
   Repo tooling only: bake-estate.js loads this file through its one hook (THE DISTRICT FILES) and writes the room
   `site_prebuilt_skinwalker_estate` into data.js. One thread works this file; nobody else edits it.
   THE PLOTS (docs/areas/estate/layout.json):
     P03-00  The Reeds              level 0  reeds, mud
     P04-00  The North Shore        level 0  shingle beach
     P05-00  The Boathouse          level 0  boathouse and slip
     P03-01  The Dock               level 0  a long dock out over the water
     P04-01  The Lake               level 0  LANDMARK: open water; something big under it
     P05-01  The Lake, east         level 0  water, the far bank
     P03-02  The South Shore        level 0  picnic ground
     P04-02  The Lake, south        level 0  water, lily pads
     P05-02  The Marsh              level 0  wet ground, frogs
   WHAT STANDS HERE TODAY (pass 1, the exteriors, 2026-11-16; seen in the cloud browser):
     - THE LAKE: one pool 98 x 82 m, 1 m deep, waded and swum. THE ROCK in its middle = eight rocks of the ocean pack standing on the bed (6 m the tallest).
     - THE DOCK from the west shore, two squares wide, with a head across its end (bench, brass telescope, a boat tied up), piles with pale caps down
       both sides, four iron lamp posts. THE SLIP from the Boathouse out over the water, THE JETTY on the east bank, THE BOARDWALK over the Marsh's
       south pool: all decks on piles, boards painted under every one (the grass field grows through a deck on lawn).
     - THE BOATHOUSE (walk-in by the south door): weathered boards on a stone footing, a tin gable roof, the two boat doors on the lake side at the
       head of the slip (drawn shut), a loft hatch and hoist beam, sashed windows (two lit), a stove pipe, lanterns, BOATHOUSE over the door.
       INSIDE (pass 2, seen): a lit plank ceiling on three tie beams with three lanterns, daylight panes at the seven windows, the boat doors' inner
       face and bar, a rowboat on its cradle on the slip's line, a workbench under a tool pegboard (saw, bucket, rope), a pot-belly stove under its
       pipe (drawn), a tool chest, shelving, jerrycans, barrels, an anchor, a net on the wall, a table and chair under the ship's lantern, a cot,
       rug, radio and a seascape, a sea chest, crates, an outboard motor, a ladder rack, a life ring, the ship's bell by the door.
     - THE PICNIC SHELTER on the South Shore (drawn: four posts on square middles, a shingle roof, two plank tables, PICNIC AREA read from the lake),
       the playground pack's swing, slide and sandbox beside it, benches, a campfire, folding chairs.
     - THE GROUND: gravel shingle on the North Shore (plan char `s`, the tool's one new paint letter), mud at the Reeds and round the Marsh's pools.
     - the Marsh's two pools, rowboats, logs, frogs, moths, dead snags, seven trees, and the Loch Ness Monster (mondo's OK 11-15): it WALKS THE BED,
       its neck and back out of the water, wandering south of the rock (seen on screen 11-16).
     - THE DRESSING (pass 3, seen): a dirt path round the whole lake from the three gaps in the corn; the ocean pack's seaweed as the water plants
       in the shallows (the Reeds, the south shore, the Marsh's pools); about ninety drawn lily pads on the Lake, south and the Marsh's pools; stones
       and driftwood on the shingle, a second boat, two iron benches; ferns, frogs, a rabbit at the Reeds; rope, a crate, traps on the dock, a
       NO SWIMMING board at its foot; a camp on the east bank (tent, fire ring, chairs, cooler); a chair, bucket and cooler on the jetty; dead trees,
       dead bushes, ferns and a flamingo in the Marsh; a bin, a cooler, crows on the shelter, rabbits, butterflies at the picnic ground; twelve more
       trees; three blank signposts; two marker buoys off the rock.
   THE POLISH (pass 5, seen): the Boathouse's boards and tin lifted to a weathered grey, the tree out of the shelter's roof, the west shore dressed
     (two benches to the water, the Woods' MISSING board at the dock's foot, a stump, ferns), boats tied at the slip's and the jetty's end, two
     lamp posts on the Marsh's boardwalk.
   FIVE PASSES LIVE (2026-11-16): STOPPED, waits mondo's look (docs/plans/DISTRICT_THREAD_BRIEF.md). What is still open is in areas-complexes.md
     "THE ESTATE, DISTRICT L", "WHAT IS STILL OPEN".
   MISSING / WAITING:
   THE AIR + THE NIGHT (pass 4, seen day and night): `airZones()` = a slow pale mist over the water, marsh lights over the Marsh, fireflies at the
     Reeds. At night the district is carried by the six lamp posts, the Boathouse's two lit windows and three lanterns, the shelter's lantern,
     the buoys and the picnic campfire (L's two real lights: the campfire and the lantern inside the Boathouse; everything else is drawn glow).
     - no residents with routines, no encounter table (mondo's baked tables).
   NEEDS A MODEL (nothing on R2 or in any pack file, MODEL_LIST.md searched 11-16: reed, cattail, bulrush, lily, duck, swan, heron, pier, canoe):
     - reeds / cattails (pass 3 will try the ocean pack's seaweed in the shallows and say how it reads), a duck or a heron, a mooring bollard with rope,
       oars, a fishing rod, a pot-belly stove (drawn in code today), a lighter grey lake rock (the ocean pack's rocks draw near black; a prop row takes no tint).
   REMOVED 11-16: `dockring` by the Boathouse. It is the Meshy SPACESHIP docking ring (4.5 m), placed by its name as if it were a mooring ring.
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
/* the zone's look rules (areas-complexes.md "THE ESTATE, THE ZONE KIT"): trim, iron, oil-lamp amber, lit and dark glass */
const TRIM = 0x26222a, IRON = 0x1c1c20, AMBER = 0xff9a30, LAMP = { glow: 0.7 }, LITW = 0xf0c868, DARKW = 0x2a3040, PILE = 0x5a5044, GREY = 0x9a968c;
/* THE LAKE'S OUTLINE in squares (the pool is an ellipse: middle 54 · 17.5, 14 x 11.7 squares): under 1 = water */
const E = (x, y) => Math.pow((x + 0.5 - 54) / 14.6, 2) + Math.pow((y + 0.5 - 17.5) / 12.3, 2);
const MARSH = [[63.5, 27, 2.6, 2.15], [68.5, 32.5, 2.15, 2.15]];   // the Marsh's two pools: middle, half sizes (squares)
const M = (x, y) => Math.min.apply(null, MARSH.map(q => Math.hypot((x + 0.5 - q[0]) / q[2], (y + 0.5 - q[1]) / q[3])));
module.exports = {
    /* THE GROUND (pass 1): shingle on the North Shore, mud where the Reeds and the Marsh are, boards under the shelter and at the Boathouse's door.
       Only squares the plan already walks; the grass field keeps off all of them. */
    plan(ctx) { const { cell, setRect } = ctx, free = (x, y) => 'gw'.includes(cell[y][x]);
        for (let y = 0; y < 13; y++) for (let x = 40; x < 66; x++) { const e = E(x, y); if (e < 0.86 || !free(x, y)) continue;
            if (x >= 47 && x <= 62) { if (e < 1.52 - 0.13 * ((x * 7 + y * 3) % 3)) cell[y][x] = 's'; }            // THE NORTH SHORE: shingle (`s` = the gravel sheet), a ragged upper edge
            else if (x < 47 && e < 1.4 - 0.1 * ((x * 5 + y) % 3)) cell[y][x] = 'p'; }                              // THE REEDS: mud at the water's edge
        for (let y = 23; y < 36; y++) for (let x = 59; x < 72; x++) { const m = M(x, y); if (m >= 0.8 && m < 1.75 - 0.15 * ((x * 3 + y * 5) % 3) && E(x, y) >= 1 && free(x, y)) cell[y][x] = 'p'; }   // THE MARSH: mud round both pools
        /* THE PATH ROUND THE LAKE (pass 3): one square wide, dirt, from the three gaps in the corn: up the west shore, along the north side above the shingle
           to the Boathouse, down the east bank past the jetty to the boardwalk's far end, along the south shore past the picnic ground */
        { const path = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (free(x, y) && E(x, y) >= 1.02 && M(x, y) >= 1.2) cell[y][x] = 'p'; };
          path(37, 1, 37, 30); path(36, 7, 36, 8); path(36, 16, 36, 16); path(36, 30, 36, 31); path(37, 1, 66, 1); path(66, 1, 66, 9); path(66, 9, 67, 9); path(70, 9, 71, 9); path(71, 9, 71, 31); path(37, 30, 59, 30); path(59, 30, 59, 31); }
        setRect(45, 31, 48, 34, 'j'); setRect(68, 9, 70, 10, 'j');
        setRect(36, 17, 50, 19, 'j'); setRect(48, 16, 50, 20, 'j'); setRect(58, 7, 67, 8, 'j'); setRect(65, 17, 71, 18, 'j'); setRect(60, 31, 72, 32, 'j');   // boards under every deck (the grass field grew up through the planks)                                                  // boards: the picnic shelter's floor, the landing at the Boathouse's door
    },
    /* THE AIR (pass 4; bake-estate.js THE AIR BY DISTRICT): a slow pale mist low over the lake, marsh lights over the Marsh, fireflies thick at the Reeds;
       the rest of the district keeps the room's own fireflies */
    airZones() { return [{ sx0: 40, sy0: 6, sx1: 68, sy1: 30, kind: 'dust', color: 0xd4e4ec, n: 260, speed: 0.15 }, { sx0: 59, sy0: 23, sx1: 72, sy1: 36, kind: 'motes', color: 0xc8ff90, n: 90, speed: 0.25 },
        { sx0: 36, sy0: 0, sx1: 48, sy1: 13, kind: 'fireflies', n: 70 }]; },
    houses(ctx) { const { building, put, U, WD, WD2, COR, GLS } = ctx;
        /* THE BOATHOUSE (walk-in; THE EXTERIOR PASS 2026-11-16): weathered grey boards on a stone footing, corner boards, a tin gable roof with its ends to the
           water, the two big boat doors on the lake side at the head of the slip (drawn shut: you go in by the south door), a loft hatch over them, sashed
           windows, a stove pipe, a lantern at each door, BOATHOUSE over the south door. */
        const BOAT = building('boathouse', [67, 5, 71, 9, 'S'], 3.5, { leaf: 'leaf_shabby_wood', floorIn: U('WoodFlooring1a') }, (a, w, d, door) => {
            const f = d / 2, h2 = w / 2, BOARD = { gain: 2.1 }, DOORC = 0x6a6258, SZ = 1.75;   // SZ: the slip meets the west wall 1.75 m south of its middle
            /* a window on a face ('f' front, 'b' back: u along x · 'l' / 'r' the sides: u along z) */
            const win = (face, u, y, lit, ww, hh) => { ww = ww || 1.1; hh = hh || 1.25; const fb = face === 'f' || face === 'b', sg = (face === 'f' || face === 'r') ? 1 : -1, base = fb ? f : h2;
                const B = (du, y0, dn, su, sh, sn, key, tint, x) => fb ? a.box(u + du, y0, sg * (base + dn), su, sh, sn, key, tint, x) : a.box(sg * (base + dn), y0, u + du, sn, sh, su, key, tint, x);
                B(0, y, 0.09, ww, hh, 0.08, GLS, lit ? LITW : DARKW, { glow: lit ? 0.6 : 0.05 });
                B(0, y - 0.1, 0.14, ww + 0.4, 0.1, 0.26, WD2, TRIM); B(0, y + hh, 0.12, ww + 0.3, 0.14, 0.2, WD2, TRIM);
                B(-ww / 2 - 0.05, y, 0.11, 0.1, hh, 0.1, WD2, TRIM); B(ww / 2 + 0.05, y, 0.11, 0.1, hh, 0.1, WD2, TRIM);
                B(0, y, 0.14, 0.05, hh, 0.04, WD2, TRIM); B(0, y + hh * 0.5, 0.14, ww, 0.05, 0.04, WD2, TRIM); };
            a.shell(w, 3.5, d, WD, GREY, door, [3.5, 1.75], BOARD);
            a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, U('WoodFlooring1a'), 0x8a7c68, { uv: [1.75, 1.75] });
            a.box(0, 0, 0, w + 0.36, 0.5, d + 0.36, 'castle_wall', 0x8a8880, { top: false, faces: 'blr' });                                         // the stone footing (open at the south door)
            { const l = door.lx - door.cw / 2 - 0.12, r = door.lx + door.cw / 2 + 0.12; a.box((-h2 - 0.18 + l) / 2, 0, f + 0.09, l + h2 + 0.18, 0.5, 0.18, 'castle_wall', 0x8a8880); a.box((h2 + 0.18 + r) / 2, 0, f + 0.09, h2 + 0.18 - r, 0.5, 0.18, 'castle_wall', 0x8a8880); }
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * h2, 0.5, sz * f, 0.3, 3.0, 0.3, WD2, TRIM);                              // corner boards
            a.box(0, 3.38, 0, w + 0.3, 0.2, d + 0.3, WD2, TRIM, { top: false });                                                                    // the eaves board
            a.roof('gable', 0, 3.5, 0, w + 1.0, 2.8, d + 1.2, COR, 0x8a929a, { keyEnd: WD, tintEnd: GREY, gain: 1.9 });                             // tin, the gable ends east and west
            a.box(0, 6.26, 0, w + 1.1, 0.12, 0.34, null, IRON, { roof: true });                                                                     // the ridge cap
            for (const s of [-1, 1]) { a.box(s * (h2 + 0.5), 3.42, 0, 0.14, 0.16, d + 1.2, WD2, TRIM, { roof: true }); }                            // the barge boards' feet
            a.cyl(5.25, 4.2, -5.25, 0.14, 2.3, null, IRON, { roof: true }); a.cyl(5.25, 6.5, -5.25, 0.24, 0.1, null, IRON, { roof: true });             // the stove pipe and its cap
            /* the lake side (west): the boat doors on their rail at the head of the slip, the loft hatch, a lantern */
            for (const s of [-1, 1]) { a.box(-h2 - 0.09, 0.08, SZ + s * 0.88, 0.1, 3.0, 1.72, WD, DOORC, { gain: 1.5, uv: [1.75, 1.75] });
                a.box(-h2 - 0.16, 0.2, SZ + s * 0.88, 0.05, 0.16, 1.6, WD2, TRIM); a.box(-h2 - 0.16, 1.5, SZ + s * 0.88, 0.05, 0.16, 1.6, WD2, TRIM); a.box(-h2 - 0.16, 2.8, SZ + s * 0.88, 0.05, 0.16, 1.6, WD2, TRIM);
                a.box(-h2 - 0.16, 0.08, SZ + s * 1.84, 0.12, 3.25, 0.2, WD2, TRIM); a.box(-h2 - 0.18, 1.35, SZ + s * 0.2, 0.05, 0.3, 0.08, null, IRON); }
            a.box(-h2 - 0.2, 3.12, SZ, 0.08, 0.1, 4.6, null, IRON); a.box(-h2 - 0.16, 3.22, SZ, 0.12, 0.2, 4.0, WD2, TRIM);                           // the door rail, the head
            a.box(-h2 - 0.08, 4.0, 0, 0.08, 1.0, 1.2, WD, DOORC, { gain: 1.5, roof: true }); a.box(-h2 - 0.14, 3.92, 0, 0.1, 0.1, 1.5, WD2, TRIM, { roof: true }); a.box(-h2 - 0.14, 5.0, 0, 0.1, 0.1, 1.5, WD2, TRIM, { roof: true });   // the loft hatch
            a.box(-h2 - 0.5, 5.5, 0, 1.0, 0.12, 0.12, WD2, TRIM, { roof: true });                                                                   // the hoist beam over it
            a.box(-h2 - 0.3, 2.5, SZ - 2.5, 0.22, 0.34, 0.22, null, AMBER, LAMP); a.box(-h2 - 0.3, 2.84, SZ - 2.5, 0.3, 0.06, 0.3, null, IRON); a.box(-h2 - 0.15, 2.95, SZ - 2.5, 0.34, 0.05, 0.05, null, IRON);
            /* the south front: the door's frame, the sign, a lantern, two windows; the back and the east side */
            a.frame(door, d, WD2, TRIM);
            a.box(door.lx, 2.62, f + 0.1, 3.3, 0.62, 0.06, WD, 0x3a3a36); a.sign('BOATHOUSE', door.lx, 2.68, f + 0.14, 3.1, 0.5, '#e8e0c8', '#3a3a36', 'fell');
            a.box(door.lx + 1.5, 1.9, f + 0.24, 0.2, 0.3, 0.2, null, AMBER, LAMP); a.box(door.lx + 1.5, 2.2, f + 0.24, 0.28, 0.06, 0.28, null, IRON); a.box(door.lx + 1.5, 2.3, f + 0.12, 0.05, 0.05, 0.3, null, IRON);
            /* ── THE INSIDE (pass 2, 2026-11-16): a lit plank ceiling on three tie beams (a walk-in's own ceiling draws black), the boat doors' inner face,
               daylight panes where the windows are, a boat on its cradle on the slip's line, a workbench under the north wall, a pot-belly stove under
               its pipe, lanterns on the beams. Blockers stand on square middles (x, z = +-1.75, +-5.25). ── */
            { const iw = h2 - 0.22, id = f - 0.22, BEAM = 0x4a3c2e, TIMB = 0x7a6a54;
              a.box(0, 3.16, 0, 2 * iw - 0.3, 0.06, 2 * id - 0.3, U('WoodFlooring1a'), 0xa89a80, { glow: 0.4, uv: [1.75, 1.75], top: false });
              for (const z of [-3.5, 0, 3.5]) { a.box(0, 2.9, z, 2 * iw - 0.3, 0.26, 0.24, WD2, BEAM, { gain: 1.3 }); }
              for (const q of [[-1.75, -3.5], [1.75, 3.5], [-3.5, 0.3]]) { a.box(q[0], 2.7, q[1], 0.03, 0.2, 0.03, null, IRON); a.box(q[0], 2.4, q[1], 0.2, 0.3, 0.2, null, AMBER, LAMP); a.box(q[0], 2.7, q[1], 0.26, 0.05, 0.26, null, IRON); }
              for (const s of [-1, 1]) { a.box(-iw + 0.05, 0.08, SZ + s * 0.88, 0.08, 3.0, 1.72, WD, 0x6a6258, { gain: 1.4, uv: [1.75, 1.75] }); a.box(-iw + 0.11, 0.9, SZ + s * 0.88, 0.05, 0.14, 1.6, WD2, TRIM); a.box(-iw + 0.11, 2.4, SZ + s * 0.88, 0.05, 0.14, 1.6, WD2, TRIM); }
              a.box(-iw + 0.14, 1.5, SZ, 0.1, 0.16, 3.2, WD2, BEAM);                                                                                  // the bar across the boat doors
              const pane = (face, u, y, ww, hh) => { const fb = face === 'f' || face === 'b', sg = (face === 'f' || face === 'r') ? 1 : -1, b = (fb ? id : iw) - 0.16;
                  const B = (du, y0, su, sh, sn, key, tint, x) => fb ? a.box(u + du, y0, sg * b, su, sh, sn, key, tint, x) : a.box(sg * b, y0, u + du, sn, sh, su, key, tint, x);
                  B(0, y, ww, hh, 0.04, null, 0xb8c8d0, { glow: 0.45 }); B(0, y - 0.08, ww + 0.3, 0.08, 0.1, WD2, TRIM); B(0, y + hh, ww + 0.3, 0.1, 0.1, WD2, TRIM); B(0, y, 0.05, hh, 0.06, WD2, TRIM); B(0, y + hh * 0.5, ww, 0.05, 0.06, WD2, TRIM);
                  B(-ww / 2 - 0.05, y, 0.1, hh, 0.08, WD2, TRIM); B(ww / 2 + 0.05, y, 0.1, hh, 0.08, WD2, TRIM); };
              pane('f', -4.9, 1.25, 1.1, 1.25); pane('f', 3.4, 1.25, 1.1, 1.25); pane('b', -3.5, 1.25, 1.1, 1.25); pane('b', 3.5, 1.25, 1.1, 1.25); pane('r', -3.5, 1.25, 1.1, 1.25); pane('r', 2.6, 1.25, 1.1, 1.25); pane('l', -4.2, 1.25, 1.1, 1.25);
              for (const x of [-4.5, -2.5]) { a.box(x, 0.16, SZ, 0.14, 0.4, 1.5, WD2, TIMB, { gain: 1.3 }); for (const s of [-1, 1]) a.box(x, 0.16, SZ + s * 0.62, 0.14, 0.62, 0.14, WD2, TIMB, { gain: 1.3 }); }   // the boat's cradle
              a.box(-5.25, 0.86, -id + 0.45, 3.3, 0.08, 0.8, U('WoodFlooring1a'), 0xa89878, { gain: 1.3 }); for (const x of [-6.75, -3.75]) for (const z of [0.12, 0.78]) a.box(x, 0.16, -id + z, 0.1, 0.7, 0.1, WD2, TIMB);   // the workbench
              a.box(-5.25, 0.3, -id + 0.45, 3.1, 0.05, 0.7, WD2, TIMB);
              a.cyl(5.25, 0.42, -5.25, 0.36, 0.78, null, IRON); a.cyl(5.25, 1.2, -5.25, 0.3, 0.08, null, 0x2a2a30); a.cyl(5.25, 1.28, -5.25, 0.09, 2.2, null, IRON); a.box(5.25, 0.6, -4.87, 0.3, 0.24, 0.04, null, AMBER, { glow: 0.8 });   // the stove, its door aglow
              for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(5.25 + sx * 0.24, 0.16, -5.25 + sz * 0.24, 0.07, 0.28, 0.07, null, IRON);
            }
            win('f', -4.9, 1.25, false); win('f', 3.4, 1.25, true); win('b', -3.5, 1.25, false); win('b', 3.5, 1.25, false); win('r', -3.5, 1.25, false); win('r', 2.6, 1.25, true); win('l', -4.2, 1.25, false);
        });
        /* what stands inside (every row on the floor: `floor: true`; a `y` of 1 m or more = a height, the Lake is level 0) */
        const IN = (key, lx, lz, o) => put(BOAT, key, lx, lz, Object.assign({ floor: true }, o || {})), f = 7, ctxFeat = ctx.feat, r2 = ctx.r2;
        const blk = (lx0, lz0, lx1, lz1, t, h) => { const p = BOAT.at(lx0, lz0), q = BOAT.at(lx1, lz1); ctxFeat({ k: 'wall', x0: p[0], z0: p[1], x1: q[0], z1: q[1], t, h, ghost: true, rail: false }); };
        IN('rowboat', -3.5, 1.75, { face: 90, y: 0.5 }); blk(-5.0, 1.75, -2.0, 1.75, 1.3, 1.0);                                                      // the boat on its cradle
        blk(-6.8, -6.3, -3.7, -6.3, 0.8, 0.9); blk(5.05, -5.25, 5.45, -5.25, 0.8, 1.2);                                                              // the workbench, the stove
        IN('tool_pegboard', -5.25, -6.7, { y: 1.5, face: 0 }); IN('psx_hand_saw_1', -4.4, -6.3, { y: 0.96, face: 20 }); IN('wooden_bucket', -6.2, -6.3, { y: 0.94 }); IN('meshy_rope', -5.4, -6.35, { y: 0.34, face: 40 });
        IN('tool_chest', -1.75, -5.25, { face: 0 }); IN('metal_shelving', 1.75, -6.72, { face: 0 }); IN('psx_jerrycan_1', 2.9, -6.2, { face: 30 }); IN('psx_jerrycan_1', 3.3, -5.7, { face: 300 });
        IN('psx_metal_barrel_mp_1', 1.75, -5.25); IN('ship_anchor', -5.25, -1.75, { face: 60 }); IN('meshy_rope', -4.3, -2.6, { face: 200 }); IN('fishing_net_wall', -6.7, -3.5, { y: 1.5, face: 90 });
        IN('psx_table_large_2', 1.75, -1.75, { face: 0 }); IN('folding_chair', 0.5, -1.2, { face: 250 }); IN('ship_lantern', 1.75, -1.75);
        IN('sea_chest', 5.25, -1.75, { face: 270 }); IN('cot', 5.9, 1.75, { face: 90 }); IN('rug_round', 4.2, 1.9); IN('retro_radio', 6.1, 3.3, { y: 0.56 }); IN('psx_wooden_crate_4', 6.1, 3.3, { h: 0.55 });
        IN('painting_seascape', 6.72, 0, { y: 1.8, face: 270 }); IN('psx_wooden_crate_4', 5.25, 5.25); IN('psx_wooden_crate_6', 4.2, 5.9, { face: 20 }); IN('psx_wooden_crate_4', 5.3, 5.2, { y: 1.08, h: 0.8, face: 30 });
        IN('outboard_motor', -5.25, 5.25, { face: 45 }); IN('psx_metal_barrel_mp_2', -6.1, 4.0); IN('ladder_wall_rack', -4.4, 6.7, { y: 1.9, face: 180 }); IN('beach_life_ring', 2.4, 6.72, { y: 1.7, face: 180 });
        IN('ships_bell', 0.9, 6.6, { y: 2.0, face: 180 }); IN('wooden_bucket', 0.4, 5.9); IN('doormat', -0.87, 6.2);
    },
    /* THE PICNIC SHELTER (drawn, the South Shore's landmark): an open timber pavilion over three by three squares, four posts on the corner squares'
       middles, a shingle roof, two plank tables with their benches; the middle aisle stays open north to south. */
    pieces(ctx) { const { look, feat, gc, r2, taken, WD, WD2, SHG, FLR } = ctx, X = gc(46), Z = gc(32);
        const blk = (x0, z0, x1, z1, t, h) => feat({ k: 'wall', x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), t: t || 0.3, h: h || 1.1, ghost: true, rail: false });
        look('picnic', X, Z, 0, a => { const POST = 0x7a6a54, ROOF = 0x2c2830;
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) { a.box(sx * 3.5, 0, sz * 3.5, 0.28, 2.7, 0.28, WD2, POST, { gain: 1.4 }); a.box(sx * 3.5, 0, sz * 3.5, 0.5, 0.3, 0.5, 'castle_wall', 0x8a8880);
                a.box(sx * 3.5, 2.3, sz * 3.5, 1.3, 0.14, 0.14, WD2, POST, { gain: 1.4 }); a.box(sx * 3.5, 2.3, sz * 3.5, 0.14, 0.14, 1.3, WD2, POST, { gain: 1.4 }); }
            for (const s of [-1, 1]) { a.box(0, 2.7, s * 3.5, 8.6, 0.24, 0.24, WD2, POST, { gain: 1.4 }); a.box(s * 3.5, 2.7, 0, 0.24, 0.24, 8.6, WD2, POST, { gain: 1.4 }); }
            a.box(0, 2.7, 0, 8.6, 0.2, 0.2, WD2, POST, { gain: 1.4 });
            a.roof('gable', 0, 2.94, 0, 9.4, 1.7, 9.8, SHG, ROOF, { keyEnd: WD, tintEnd: 0x6a5a48 });
            a.box(0, 2.3, 4.75, 0.2, 0.3, 0.2, null, AMBER, LAMP); a.box(0, 2.6, 4.75, 0.28, 0.06, 0.28, null, IRON);                                // a lantern under the south eave
            a.box(0, 3.3, -4.78, 3.5, 0.56, 0.06, WD, 0x3a3a36); a.sign('PICNIC AREA', 0, 3.35, -4.82, 3.3, 0.46, '#e8e0c8', '#3a3a36', 'fell', { ry: 180 });   // read from the lake
            for (const s of [-1, 1]) { const x = s * 3.5;                                                                                           // a table on each side square's middle
                a.box(x, 0.72, 0, 0.9, 0.07, 2.0, FLR, 0xa89878, { gain: 1.3 }); for (const e of [-1, 1]) { a.box(x, 0.4, e * 0.78, 1.5, 0.06, 0.06, WD2, POST); a.box(x - 0.5, 0, e * 0.78, 0.08, 0.72, 0.08, WD2, POST); a.box(x + 0.5, 0, e * 0.78, 0.08, 0.72, 0.08, WD2, POST); }
                for (const e of [-1, 1]) a.box(x + e * 0.75, 0.42, 0, 0.28, 0.06, 2.0, FLR, 0xa89878, { gain: 1.3 }); } });
        for (const sx of [-1, 1]) { for (const sz of [-1, 1]) { blk(X + sx * 3.5 - 0.2, Z + sz * 3.5, X + sx * 3.5 + 0.2, Z + sz * 3.5, 0.4, 2.6); taken.add((46 + sx) + ':' + (32 + sz)); }
            blk(X + sx * 3.5, Z - 1.0, X + sx * 3.5, Z + 1.0, 1.8, 0.8); taken.add((46 + sx) + ':32'); }
    },
    water(ctx) { const { W, gx, gc, r2, feat, props, taken, sheet, WD2 } = ctx;
        feat({ k: 'pool', x: gx(54), z: gx(17.5), r: 49, rz: 41, y: -0.3, depth: 1.0, key: 'water', bank: 2.4 });
        feat({ k: 'deck', x0: gx(36), z0: gx(18), x1: gx(49), z1: gx(18), w: 7, y: 0.3 });                                                          // THE DOCK
        feat({ k: 'deck', x0: gx(49), z0: gx(16), x1: gx(49), z1: gx(20), w: 7, y: 0.3 });                                                          // its head, across the end
        feat({ k: 'deck', x0: r2(gx(67) - 0.9), z0: gc(7), x1: gx(58), z1: gc(7), w: 3.5, y: 0.3 });                                                          // the Boathouse's slip, out over the water
        feat({ k: 'deck', x0: gx(71), z0: gc(17), x1: gx(65), z1: gc(17), w: 3.5, y: 0.3 });                                                        // the east bank's jetty
        feat({ k: 'pool', x: gx(63.5), z: gx(27), r: 9, rz: 7.5, y: -0.25, depth: 0.6, key: 'water', bank: 1.6 }); feat({ k: 'pool', x: gx(68.5), z: gx(32.5), r: 7.5, y: -0.25, depth: 0.6, key: 'water', bank: 1.4 });
        feat({ k: 'deck', x0: gx(60), z0: gc(31), x1: gx(72), z1: gc(31), w: 3.5, y: 0.25 });                                                       // the Marsh's boardwalk, over the south pool
        for (let y = 0; y < 36; y++) for (let x = 36; x < W; x++) if (E(x, y) < 1 || M(x, y) < 1.2) taken.add(x + ':' + y);
        for (let y = 16; y < 20; y++) for (const x of [48, 49]) taken.delete(x + ':' + y);                                                          // the dock's head is walked: things stand on it
        /* THE FITTINGS (drawn, ONE arch row for the whole district's piles and lamp posts = a handful of draw calls; the row stands at level 0, so a
           pile over the water starts on the bed): two rows of piles along every deck with a pale cap each, an iron lamp post on a deck's edge */
        const OX = gx(36), OZ = gx(18), a = sheet();
        const piles = (x0, z0, x1, z1, w, from, step, top) => { const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L, n = Math.floor((L - from) / step) + 1;
            for (const s of [-1, 1]) { const ox = x0 - OX + from * ux - s * uz * (w / 2 + 0.1), oz = z0 - OZ + from * uz + s * ux * (w / 2 + 0.1), rep = { n, step: [r2(ux * step), 0, r2(uz * step)] };
                a.cyl(ox, -1.5, oz, 0.17, 1.5 + top, WD2, PILE, rep); a.cyl(ox, top, oz, 0.2, 0.06, null, 0xb8b0a0, rep); } };
        piles(gx(36), gx(18), gx(49), gx(18), 7, 3.5, 7, 1.1); piles(gx(49), gx(16), gx(49), gx(20), 7, 0, 7, 1.1);
        piles(gx(67), gc(7), gx(58), gc(7), 3.5, 3.5, 7, 0.9); piles(gx(71), gc(17), gx(65), gc(17), 3.5, 3.5, 7, 0.9); piles(gx(60), gc(31), gx(72), gc(31), 3.5, 1.75, 7, 0.75);
        /* a lamp post: (x, z) = its foot, (ux, uz) = the way its arm reaches over the deck, y = the deck's top */
        const lamp = (x, z, ux, uz, y) => { const X = x - OX, Z = z - OZ, lx = X + ux * 0.6, lz = Z + uz * 0.6;
            a.box(X, y, Z, 0.3, 0.4, 0.3, null, IRON); a.cyl(X, y + 0.4, Z, 0.06, 2.6, null, IRON); a.box(X + ux * 0.3, y + 2.95, Z + uz * 0.3, ux ? 0.75 : 0.07, 0.07, uz ? 0.75 : 0.07, null, IRON);
            a.box(lx, y + 2.47, lz, 0.24, 0.36, 0.24, null, AMBER, LAMP); a.box(lx, y + 2.83, lz, 0.32, 0.07, 0.32, null, IRON); a.box(lx, y + 2.4, lz, 0.3, 0.07, 0.3, null, IRON); };
        lamp(gx(40), gx(17) + 0.25, 0, 1, 0.3); lamp(gx(44), gx(17) + 0.25, 0, 1, 0.3); lamp(gx(48), gx(16) + 0.25, 0, 1, 0.3); lamp(gx(50) - 0.25, gx(20) - 0.25, 0, -1, 0.3);   // the dock and its head
        lamp(gx(59), gc(7) - 1.5, 0, 1, 0.3); lamp(gx(66), gc(17) - 1.5, 0, 1, 0.3); lamp(gx(63), gc(31) - 1.5, 0, 1, 0.25); lamp(gx(69), gc(31) + 1.5, 0, -1, 0.25);                                                                 // the slip's end, the jetty's end
        { const X = gx(38) - OX, Z = gx(17) + 0.9 - OZ; a.cyl(X, 0.3, Z - 0.84, 0.06, 1.75, WD2, PILE); a.cyl(X, 0.3, Z + 0.84, 0.06, 1.75, WD2, PILE); a.box(X, 1.45, Z, 0.05, 0.5, 1.6, WD2, 0x3a3a36); a.sign('NO SWIMMING', X - 0.04, 1.5, Z, 1.4, 0.4, '#e8e0c8', '#3a3a36', 'fell', { ry: 90 }); }   // a board at the dock's foot, read walking out
        feat({ k: 'arch', id: 'est:lakefittings:look', x: OX, z: OZ, rot: 0, y: 0, parts: a.P });
        /* THE SHALLOWS (pass 3). No reed, cattail or lily model exists on R2 (the NEEDS A MODEL list): the ocean pack's seaweed stands in the shallows as
           the water plants (it sways; 1.2 to 1.8 m, its top out of the water), two rows round the Reeds' bank, clumps in the Marsh's pools and on the
           south shore. LILY PADS are drawn (Camelot's Fairy Forest way: a notched disc in the leaf sheet on the water), ONE arch row, some in flower. */
        { const rnd = ctx.rnd, CX = gx(54), CZ = gx(17.5), weed = (x, z) => props.push({ key: ['ocean_seaweed', 'ocean_seaweed_2', 'ocean_seaweed_3'][Math.floor(rnd() * 3)], x: r2(x), z: r2(z), face: Math.round(rnd() * 360) });
          for (let t = 206; t <= 246; t += 1.9) for (const k of [0.965]) { const q = (t + (rnd() - 0.5) * 1.6) * Math.PI / 180, kk = k + (rnd() - 0.5) * 0.02; weed(CX + 49 * kk * Math.cos(q), CZ + 41 * kk * Math.sin(q)); }
          for (const t of [100, 106, 130, 62, 68]) { const q = t * Math.PI / 180; weed(CX + 49 * 0.965 * Math.cos(q), CZ + 41 * 0.965 * Math.sin(q)); }                       // the south shore's clumps
          for (const m of [[gx(63.5), gx(27), 9, 7.5], [gx(68.5), gx(32.5), 7.5, 7.5]]) for (let t = 20; t < 360; t += 75) { const q = (t + rnd() * 20) * Math.PI / 180; if (Math.abs(m[1] + m[3] * 0.8 * Math.sin(q) - gc(31)) < 2.4) continue; weed(m[0] + m[2] * 0.8 * Math.cos(q), m[1] + m[3] * 0.8 * Math.sin(q)); }
          const L = sheet(), pad = (x, z, y) => { const r = r2(0.3 + rnd() * 0.32); L.P.push({ s: 'cyl', p: [r2(x - OX), y, r2(z - OZ)], r, h: 0.02, seg: 9, arc: 320, a0: Math.round(rnd() * 360), key: 'leaves_3', tint: 0xb8e088, gain: 1.5 });
              if (rnd() < 0.22) { L.P.push({ s: 'cyl', p: [r2(x - OX), y + 0.02, r2(z - OZ)], r: 0.13, h: 0.09, seg: 6, tint: rnd() < 0.5 ? 0xf6f0e0 : 0xf0b8d0, glow: 0.25 }); L.P.push({ s: 'cyl', p: [r2(x - OX), y + 0.1, r2(z - OZ)], r: 0.05, h: 0.05, seg: 5, tint: 0xf0c040, glow: 0.4 }); } };
          const drift = (cx, cz, n, sp, y) => { for (let i = 0; i < n; i++) { const q = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * sp; pad(cx + Math.cos(q) * d, cz + Math.sin(q) * d * 0.7, y); } };
          [[50, -34, 9, 3.4], [57, -30.5, 8, 3], [65, -29, 9, 3.6], [73, -30.5, 8, 3], [80, -34.5, 9, 3.4], [61, -36, 7, 2.6], [70, -37, 7, 2.8], [44, -40, 6, 2.4], [87, -40, 6, 2.4]].forEach(q => drift(q[0], q[1], q[2], q[3], -0.285));   // the Lake, south
          drift(gx(63.5), gx(27), 9, 5, -0.235); drift(gx(68.5), r2(gx(32.5) + 2.5), 7, 3.6, -0.235);                                                // the Marsh's pools
          feat({ k: 'arch', id: 'est:lilies:look', x: OX, z: OZ, rot: 0, y: 0, parts: L.P });
          props.push({ key: 'sea_buoy', x: r2(gc(54) - 11), z: r2(gc(18) - 9), noLight: true }); props.push({ key: 'sea_buoy', x: r2(gc(54) + 12), z: r2(gc(18) + 10), noLight: true });   // two marker buoys off the rock (they glow, no real light)
        }
        /* THE ROCK in the lake's middle: big rocks of the ocean pack standing on the bed (was a mound in the corn's leaf sheet) */
        const RX = gc(54), RZ = gc(18), rock = (key, dx, dz, h, face) => props.push({ key, x: r2(RX + dx), z: r2(RZ + dz), h, face });
        rock('ocean_rock_3', 0, 0, 6.4, 20); rock('ocean_rock_4', -3.4, 1.3, 4.4, 140); rock('ocean_rock_3', 2.9, -2.4, 3.8, 250); rock('ocean_rock_2', 2.2, 3.0, 3.0, 80); rock('ocean_rock', -2.4, -3.1, 2.6, 300);
        rock('ocean_rock_7', -5.6, -1.2, 1.9, 10); rock('ocean_rock_8', 5.4, 1.0, 1.7, 200); rock('ocean_rock_7', 0.6, 5.6, 1.6, 120);
    },
    dress(ctx) { const { gx, gc, r2, npc, props, P, dec, tree } = ctx;
        P('rowboat', 50, 3, { face: 80 }); dec('fallen_log', 46, 2); dec('fallen_log', 58, 3); dec('meshy_frog', 38, 3); dec('meshy_frog', 39, 8); dec('luna_moth', 37, 5); dec('fallen_log', 37, 10);
        P('cave_torch', 36, 16, { noLight: true }); P('cave_torch', 36, 19, { noLight: true }); P('meshy_rowboat', 66, 10, { face: 300 }); dec('wooden_bucket', 69, 10);   // (the room's ten real lights: L keeps the campfire and the Boathouse's lantern)
        P('park_bench', 40, 31, { face: 0 }); P('park_bench', 44, 32, { face: 0 }); P('campfire', 42, 33); dec('folding_chair', 41, 34); dec('folding_chair', 43, 34); dec('butterfly', 46, 31);
        dec('meshy_frog', 61, 30); dec('meshy_frog', 66, 29); dec('meshy_frog', 70, 35); dec('meshy_frog', 64, 33); P('dead_snag', 62, 33); P('dead_snag', 70, 28); dec('hawk_moth', 67, 26);
        tree(39, 3, 'tree', 7.5); tree(70, 2, 'tree_2', 8); tree(37, 33, 'tree', 7); tree(49, 35, 'tree_2', 7.5); tree(58, 33, 'tree', 8); tree(70, 14, 'tree_2', 7); tree(70, 21, 'tree', 7.5);
        npc.push({ x: gc(54), z: gc(23), face: 0, race: 'loch ness monster' });                                                    // in the water, south of the rock (mondo's OK 11-15)
        /* ── THE DRESSING (pass 3, 2026-11-16) ── */
        { const rnd = ctx.rnd, at = (key, x, z, o) => props.push(Object.assign({ key, x: r2(x), z: r2(z), face: Math.round(rnd() * 360) }, o || {}));
          /* the North Shore's shingle: stones of the graveyard pack, driftwood, a second boat pulled up, an iron bench on the path */
          for (let i = 0; i < 26; i++) { const sx = 47 + Math.floor(rnd() * 16), sy = 2 + Math.floor(rnd() * 4); if (ctx.cell[sy][sx] !== 's') continue; at(['psxg_rock_1', 'psxg_rock_2', 'psxg_rock_3', 'psxg_rock_4', 'psxg_rock_2', 'psxg_rock_3'][Math.floor(rnd() * 6)], gc(sx) + (rnd() - 0.5) * 3, gc(sy) + (rnd() - 0.5) * 3, { noBlock: true }); }
          dec('stump', 55, 2); dec('meshy_fallen_log', 61, 4); P('meshy_rowboat', 56, 4, { face: 200 }); at('iron_garden_bench', gc(53), gc(1) - 1.1, { face: 0 }); at('iron_garden_bench', gc(44), gc(1) - 1.1, { face: 0 });
          /* the Reeds: ferns on the mud behind the water plants, frogs, a heron's worth of quiet */
          for (let i = 0; i < 14; i++) { const q = (207 + rnd() * 40) * Math.PI / 180, k = 1.04 + rnd() * 0.07; at('fern', gx(54) + 49 * k * Math.cos(q), gx(17.5) + 41 * k * Math.sin(q)); }
          dec('meshy_frog', 41, 9); dec('meshy_frog', 43, 6); dec('meshy_frog', 40, 11); dec('grasshopper', 40, 5); dec('blue_morpho', 42, 4); dec('rabbit', 40, 2); P('signpost', 38, 8, { face: 90 });
          /* the dock: rope, a crate, the traps, a bucket; the slip and the Boathouse's yard */
          at('meshy_rope', gx(42) + 1, gx(18) + 2.6); at('meshy_rope', gx(47), gx(17) + 0.9); at('psx_wooden_crate_4', gx(45), gx(18) + 2.7, { face: 10 }); at('wooden_bucket', gx(49) - 0.6, gx(19) + 1.2); at('lobster_traps', gc(48) + 0.3, gc(19) + 0.9, { face: 30 });
          P('psx_metal_barrel_mp_1', 70, 10); dec('psx_wooden_crate_6', 71, 10); dec('tire_stack', 66, 8); dec('meshy_rope', 67, 9); dec('ship_anchor', 71, 6, { noBlock: true }); at('meshy_rope', gx(60), gc(7) + 1.0); P('signpost', 66, 0, { face: 180 });
          /* the east bank: a camp by the jetty (tent, a cold fire ring, chairs, a cooler), a chair and a bucket on the jetty's end */
          P('camping_tent', 69, 12, { face: 270 }); at('meshy_campfire_ring', gc(69) + 0.4, gc(13) + 1.0); dec('folding_chair', 68, 14); dec('folding_chair', 70, 14, { }); dec('beach_cooler', 70, 13); dec('railway_lantern', 69, 14);
          at('folding_chair', gc(66) - 0.5, gc(17) + 0.5, { face: 270 }); at('wooden_bucket', gc(66) + 0.6, gc(17) - 0.9); at('beach_cooler', gc(67), gc(17) + 1.0, { face: 80 });
          /* the Marsh: dead trees and bushes on the mud, ferns, more frogs, a flamingo in the shallows, a signpost where the boardwalk starts */
          P('psxg_dead_tree_1', 61, 32); P('psxg_dead_tree_2', 67, 22); P('hw_tree_4', 60, 34); P('psxg_dead_tree_1', 65, 35); P('hw_tree_3', 71, 34);
          for (const q of [[61, 26], [66, 30], [64, 30], [71, 29], [66, 35], [62, 29], [69, 28]]) dec(rnd() < 0.5 ? 'psxg_dead_bush_1' : 'psxg_dead_bush_2', q[0], q[1]);
          for (const q of [[60, 28], [61, 24], [67, 24], [65, 31 - 1], [70, 29], [63, 31 + 1], [67, 35], [71, 33]]) dec('fern', q[0], q[1]);
          dec('meshy_frog', 62, 30); dec('meshy_frog', 67, 30); dec('meshy_frog', 71, 35); dec('luna_moth', 64, 24); at('flamingo', gx(63.5) + 5.5, gx(27) - 3.6, { face: 200 }); P('signpost', 59, 32, { face: 270 });
          /* the picnic ground: a bin and its bag, a cooler and cups on the tables, crows on the shelter's ridge, rabbits, butterflies */
          dec('metal_trash_can', 44, 31); dec('garbage_bag', 44, 31); at('beach_cooler', gc(45) + 1.2, gc(32) - 0.9, { face: 20 });
          at('crow', gc(46) - 1.5, gc(32), { y: 4.68, face: 100 }); at('crow', gc(46) + 2.2, gc(32), { y: 4.68, face: 250 }); dec('rabbit', 39, 34); dec('rabbit', 55, 34); dec('monarch', 49, 33); dec('swallowtail', 41, 32); dec('bee', 52, 34); dec('ladybug', 46, 34);
          /* THE POLISH (pass 5): the west shore between the dock and the picnic ground (two benches to the water, the Woods' MISSING board by the dock's
             foot, a stump, a boat pulled up), boats tied at the slip's and the jetty's end */
          P('park_bench', 39, 21, { face: 90 }); P('park_bench', 39, 27, { face: 90 }); P('missing_board', 38, 15, { face: 90 }); dec('stump', 38, 23); dec('fern', 39, 25); dec('fern', 38, 20); dec('monarch', 39, 22);
          props.push({ key: 'rowboat', x: r2(gx(58) + 1.2), z: r2(gc(7) + 2.9), y: 0.95, face: 95 }); props.push({ key: 'meshy_rowboat', x: r2(gx(65) + 1.5), z: r2(gc(17) - 2.9), y: 0.95, face: 80 });
          /* more trees on the grass (birch, oak, spruce, pine of the tree pack), set back from the path */
          tree(41, 4, 'tree_3', 8.5); tree(44, 3, 'pine', 7); tree(64, 3, 'tree', 7.5); tree(69, 3, 'tree_4', 8.5); tree(69, 20, 'tree_3', 8); tree(69, 25, 'tree_4', 8); tree(39, 13, 'tree_4', 8); tree(39, 24, 'tree_3', 8.5);
          tree(52, 35, 'tree_3', 8); tree(56, 34, 'pine', 7.5); tree(43, 35, 'tree', 7); tree(63, 0, 'pine', 7); }
        /* on the dock's head: a bench looking down the lake, a boat tied up beside it */
        /* THE MODEL LIST FIRST (mondo 11-16): the playground pack's swing, slide and sandbox on the South Shore, the brass telescope on the dock's head */
        P('play_swing', 50, 32, { face: 0 }); P('play_slide', 53, 32, { face: 90 }); props.push({ key: 'play_sandbox', x: r2(gc(51) + 0.9), z: r2(gc(34) - 0.4), span: 3, face: 10 });
        P('brass_telescope', 49, 19, { face: 100 });
        P('park_bench', 48, 16, { face: 180 }); props.push({ key: 'rowboat', x: r2(gx(50) + 1.4), z: gc(18), y: 0.95, face: 5 });
    },
};
