/* THE WOODS · DEAD MAN'S CAVE (district M, plots x 3..5 · y 3..5, the south-east, levels 0 to 1: the low wet ground) — this district's own content, split out of bake-woods.js on
   2026-11-16 (mondo: "every single zone needs to be like that. now. so we can work in parallel"). One thread = this one file.
   Repo tooling only: nothing here ships; the room is baked into data.js (site_prebuilt_fairy_forest_plots, WOODS36-BEGIN / END).

   THE LOOK: rot and thorns, "where things get dumped". Bare trees, thorn vine, gas plants, spore caps, dead snags with crows; ash in the air.
   THE PLOTS AND WHAT STANDS THERE TODAY
     P03-03 The Culvert (L1)         warning tape, a garbage bag, a dead snag.
     P04-03 The Channel, upper (L1)  garbage bags, a sack, a dead snag.
     P05-03 The Storm Drain (L0)     warning tape, a flashlight, a dead snag. The link streets_drain (up to Disaster City) is east.
     P03-04 The Cave Mouth (L0)      LANDMARK: the crag (14 x 7 m, 5.25 m high) with the culvert mouth in its face, a graffiti wall, torch, wet floor
                                     sign, a skull pile, skulls, a cobweb; natives: ghoul, flesheater.
     P04-04 The Channel, lower (L0)  two half-buried coffins, a lid, a dead snag, a frog.
     P05-04 The Outfall (L0)         a fish skeleton, two barrels, a dead snag, a frog. The link sewers_drain (the city sewers) is east.
     P03-05 The Gully (L0)           the yard (tailor below): the trailer home, the school bus, THE CABIN (a walk-in building: one hollow texbuilding
                                     woods:cabin + one arch row, furnished), a garbage bag, a bear trap, a sack.
     P04-05 The Pool (L0)            natives: swamp monster, mothman; frogs, a dead snag. The Pool is the tool's water.
     P05-05 The Tunnel Way (L0)      a sarcophagus box, a skull, a dead snag. The link woods_sewer (the HQ tunnel, secret) is east.
   KNOWN MISSING / WAITING FOR MONDO
     - The life pass and the horror pass are live but wait for his look (the board).
     - THE CABIN HAS NO GAME ROLE: mondo, "Nothing yet". Do not tie a rest spot, a shop, a story beat or an NPC to it until he says what it is for.
     - NO CAVE INSIDE: the plan gives the Cave Mouth a door to the cave inside. No door is wired; the mouth is a prop in the crag.
     - The Tunnel Way's trail ends with no post (the link is secret): the one dead end left; mondo is to say what stands there.
     - The plan's brick channel, pipes and drain grates on the two Channel plots are not built.
     - The thorn vine model lives in this district only (it is wrong for the other woods).
     - The trees are closed ("Good, keep them"): do not change tree kinds unasked.

   THE HOOKS (bake-woods.js "THE DISTRICT FILES" calls them; each one is optional):
     tailor(ctx)                          before the levels are read: change this district's squares in ctx.cell[cy][cx]
                                          (t trees, g grass, p path, s snow, r rock, w water, b bridge)
     dress(ctx), horror(ctx), life(ctx)   the three passes as they were built, run in this order; each starts on its own recorded dice,
                                          so an edit here never moves another district's pieces
     build(ctx)                           after all three: NEW work goes here first (its own dice; nothing that stands is thrown again)
                                          (a sow's seed is the count of feature rows before it: a feature row added in an old pass
                                          re-throws every later scatter of the room, one added in build moves nothing)
     wood, treeZones(ctx), airZones(ctx)  this district's forest mass and its air
   ctx: put / dec / tree / native (plot id, ..., dx, dy) stand a thing on the free square nearest the plot's clearing middle + (dx, dy) and claim
   the square (put = a blocker on the square's middle, dec = a small thing off it); hput / hdec = the same, skipped when the plot is full;
   life / fly = a small thing on a random open square (claims none); sow = a scatter row over a disc; centre(plot id) = the clearing's middle
   square; freeSquares(plot id); features / props (push your own rows), doors (read only), taken, cell; gx / gc = a square's line / middle in
   metres; ground(x, z) = the height there; rnd; h0 (horror only: props.length before the pass). A helper given another district's plot throws.
   NOT YOURS: the terrain, the levels, the trails and paths, the creek and the pools, the doors and link ends, the sky, the tree kinds
   (the trees row on the board), the particle engine. Those are the tool's: a note on the board first (docs/notes/claims.md).
   Rules for district threads: docs/notes/areas-complexes.md "THE WOODS, THE DISTRICT FILES". Bake: node bake-woods.js (--dry-run = counts only). */
'use strict';
/* arch parts (data.js THE ARCHITECTURE ROW): p = the foot's middle in the row's frame, a tint MULTIPLIES its sheet */
const R2 = v => Math.round(v * 100) / 100;
const box = (x, y, z, w, h, d, key, tint, o) => Object.assign({ s: 'box', p: [R2(x), R2(y), R2(z)], size: [R2(w), R2(h), R2(d)], key, tint }, o || {});
const cyl = (x, y, z, r, h, key, tint, o) => Object.assign({ s: 'cyl', p: [R2(x), R2(y), R2(z)], r: R2(r), h: R2(h), key, tint }, o || {});
const ROCK = 'rocks_5', BRICK = 'urban:BrickMasonry1a', BRICK2 = 'urban:BrickUrban3a', CONC = 'urban:ConcreteWoodFormed1a', CONC2 = 'urban:ConcreteGeneric3a';
const T_ROCK = 0xa9a79c, T_ROCK2 = 0x8f9084, T_BRICK = 0xb39a8a, T_BRICK2 = 0x9c8f84, T_CONC = 0xb4b6ac, T_MOSS = 0x8fa07c, T_DARK = 0x16181a;
module.exports = {
    id: 'M', name: 'Dead Man\'s Cave',
    /* the forest mass: the feature trees planted deep in this district's tree squares [kind, height m, chance a deep square] (plots of level 6 up get pines, the tool's rule) */
    wood: ['tree_6', 7, 0.05],   // bare trees (was `dead_tree`, no such kind: nothing was planted)
    /* THE TREE ZONES (terrain.gen.zones, the thicket by district) and THE AIR BY DISTRICT (shell.atmos.zones): boxes in plots, zoneOf(x0, y0, x1, y1) */
    treeZones: ctx => [Object.assign(ctx.zoneOf(3, 3, 6, 6), { kinds: ['tree_5', 'tree_6', 'tree_5', 'tree_6', 'tree_55'], treeH: [6, 8.5] })],               // bare
    airZones: ctx => [Object.assign(ctx.zoneOf(3, 3, 6, 6), { kind: 'ash', color: 0x8a9484, speed: 0.5, n: 240 })],
    /* THE GROUND: this district's own changes to the plan's squares, before the levels and the open ground are read */
    tailor(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        { const p = plot['P03-05']; for (let ly = 9; ly <= 10; ly++) for (let lx = 1; lx <= 10; lx++) cell[p.y * N + ly][p.x * N + lx] = 'g';
          for (let ly = 5; ly <= 8; ly++) for (let lx = 8; lx <= 10; lx++) cell[p.y * N + ly][p.x * N + lx] = 'g';
          for (let lx = 4; lx <= 7; lx++) if (cell[p.y * N + 6][p.x * N + lx] === 't') cell[p.y * N + 6][p.x * N + lx] = 'p'; }   // the alley from the plot's path to the cabin porch
    },
    /* THE DRESSING: the landmark, the set pieces and the natives (ported from the old rooms) */
    dress(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        { /* THE CAVE MOUTH (the exterior pass, 2026-11-16): the crag stands on the plan's own rock squares now (row 49 + the two arms on row 50), a horseshoe
             open to the clearing with the north trail walking through its back by a one-square mouth. It stood 2 squares south before, across the
             alley of row 51. ONE feature row stays here (the east block: an old pass keeps its count of feature rows); the rest is build(). */
          const p = plot['P03-04'], X = p.x * N, Y = p.y * N;
          features.push({ k: 'plateau', x: gx(X + 7), z: gc(Y + 1), w: 7, d: 3.5, h: 6.5, edge: 0.08 });
          props.push({ key: 'culvert_mouth', x: gx(X + 7), z: r2(gx(Y + 2) - 0.4), face: 180 }, { key: 'graffiti_wall', x: r2(gx(X + 7) + 2.3), z: r2(gx(Y + 2) + 0.08), face: 180 });
          [[3, 2], [4, 1], [6, 1], [7, 1], [8, 2], [7, 2]].forEach(q => taken.add((X + q[0]) + ':' + (Y + q[1]))); put('P03-04', 'cave_torch', 2, -1); dec('P03-04', 'wet_floor_sign', -1, 1); }
        native('P04-05', 'swamp monster', -1, 1, 60); native('P04-05', 'mothman', 1, -1, 300);   // THE HORROR PASS: the thing in the Pool, and the one above it
    },
    /* THE HORROR PASS (mondo 11-15): it gets worse the farther you walk from the Stair */
    horror(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        hdec('P03-03', 'warning_tape', 0, 0, { y: 0.01 }); hdec('P03-03', 'garbage_bag', 1, 1);
        hdec('P04-03', 'garbage_bags', 0, 0); hdec('P04-03', 'garbage_bags', 1, 1); hdec('P04-03', 'meshy_burlap_sack', -1, 1);
        hdec('P05-03', 'warning_tape', 0, 0, { y: 0.01 }); hdec('P05-03', 'psx_flashlight_1', 1, 0);
        hput('P03-04', 'skull_pile', 2, 2); hdec('P03-04', 'skull', 0, 2); hdec('P03-04', 'skull', -2, 1); hdec('P03-04', 'psx_cobweb_1', 1, 0, { y: 1.4 }); native('P03-04', 'ghoul', -2, 2, 60); native('P03-04', 'flesheater', 3, 1, 300);
        hput('P04-04', 'trap_coffin_wood', 0, 0, { y: -0.28, face: 30 }); hput('P04-04', 'trap_coffin_wood', 2, 1, { y: -0.34, face: 300 }); hdec('P04-04', 'trap_coffin_lid', 1, -1);
        hdec('P05-04', 'psx_fish_skeleton_mp_1', 0, 0, { y: 0.02 }); hput('P05-04', 'psx_metal_barrel_mp_1', 1, 1); hput('P05-04', 'psx_metal_barrel_mp_1', -1, 1);
        { const p = plot['P03-05'], X = p.x * N, Y = p.y * N, tk = (x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) taken.add((X + x) + ':' + (Y + y)); };   // THE GULLY's yard
          props.push({ key: 'trailer_home_4', x: r2(gx(X + 1) + 8.75), z: gx(Y + 10), face: 0 }); tk(1, 5, 9, 10);          // 5 x 2 squares
          props.push({ key: 'school_bus', x: gc(X + 8), z: gc(Y + 9), face: 90 }); tk(7, 9, 9, 9);                             // 3 x 1 squares, nose east
          /* THE CABIN (2026-11-15, mondo: "would rather you architect a wooden cabin like the building's in disaster city so i can actually walk inside of it"):
             a walk-in building made the city's way = one hollow `texbuilding` (skin off: the walls you bump into, the doorway, the swinging leaf, the inside's
             wall / floor / ceiling) + one `k: 'arch'` row for the look. 3 squares along its front x 2 deep, its front to the WEST (the path), a porch on the
             square row before it. Row frame: +x along the front, +z out of the front. The Meshy `woods_cabin` model stays in the catalogue, unused here. */
          { const cx = gx(X + 10), cz = r2(gx(Y + 5) + 5.25), w = 10.5, d = 7, H = 3.5, E = 0.05, WD = 'urban:WoodGeneric1b', WD2 = 'urban:WoodGeneric1a', SH = 'urban:WoodGeneric2a', FL = 'urban:WoodFlooring1d';
            const LOG = 0x6e6558, DARK = 0x3c352e, MOSS = 0x55604a, STONE = 0x8d8a82;
            const row = { k: 'texbuilding', id: 'woods:cabin', x: cx, z: cz, w, d, rot: 90, storeys: 1, seed: 1, skin: false, hollow: true, leaf: 'leaf_shabby_wood', keyIn: WD2, floorIn: FL };
            features.push(row);
            const L = w - 0.12, cols = Math.round(L / 1.75), cw = L / cols, lx = r2(-L / 2 + (Math.floor((cols - 1) / 2) + 0.5) * cw);   // data.js hqTexbDoor: the doorway's middle along the front
            const box = (x, y, z, sw, sh, sd, key, tint, o) => Object.assign({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(sw), r2(sh), r2(sd)], key, tint }, o || {});
            const parts = [
                box(0, 0, 0, w + 2 * E, H, d + 2 * E, WD, LOG, { faces: 'blr', top: false, uv: [3.5, 1.75] }),                                     // the three blind log walls
                { s: 'quad', p: [0, 0, r2(d / 2 + E)], size: [r2(w + 2 * E), H], key: WD, tint: LOG, uv: [3.5, 1.75], hole: [lx, r2(cw), 2.2] },   // the front, its doorway cut
                { s: 'roof', form: 'gable', p: [0, H, 0], size: [w + 1.6, 2.7, d + 1.4], key: SH, tint: MOSS, keyEnd: WD, tintEnd: LOG, over: 0.5, roof: true },   // mossy shingles, the ridge along the front
                box(-w / 2, 0, d / 2, 0.42, H, 0.42, WD2, DARK), box(w / 2, 0, d / 2, 0.42, H, 0.42, WD2, DARK), box(-w / 2, 0, -d / 2, 0.42, H, 0.42, WD2, DARK), box(w / 2, 0, -d / 2, 0.42, H, 0.42, WD2, DARK),   // the corner logs
                box(0, 0, d / 2 + 0.08, w + 0.3, 0.3, 0.2, WD2, DARK), box(0, H - 0.28, d / 2 + 0.08, w + 0.3, 0.28, 0.2, WD2, DARK),                // the sill log and the top plate
                box(lx - cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.35, 0.2, WD2, DARK), box(lx + cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.35, 0.2, WD2, DARK), box(lx, 2.2, d / 2 + 0.1, cw + 0.4, 0.2, 0.2, WD2, DARK),   // the door frame
                /* two boarded windows on the front, one on each end wall */
                ...[-3.6, 3.3].flatMap(x => [box(x, 1.05, d / 2 + 0.06, 1.3, 1.2, 0.08, 'urban:GlassWindowResidentialShutter1', 0x8a8a80, { uv: 'fit', faces: 'f', top: false }),
                    box(x, 1.25, d / 2 + 0.14, 1.7, 0.22, 0.06, WD2, 0x8a7d68), box(x, 1.75, d / 2 + 0.14, 1.7, 0.22, 0.06, WD2, 0x7a6e5c)]),
                ...[-1, 1].flatMap(sd => [box(sd * (w / 2 + 0.06), 1.05, 0.6, 0.08, 1.2, 1.3, 'urban:GlassWindowResidentialShutter1', 0x8a8a80, { uv: 'fit', faces: sd > 0 ? 'r' : 'l', top: false }),
                    box(sd * (w / 2 + 0.14), 1.45, 0.6, 0.06, 0.22, 1.7, WD2, 0x8a7d68)]),
                /* the porch: boards on the ground, four posts, a lean-to roof */
                /* THE FLOOR (mondo 11-15 "the cabin has a grass floor"): the ground rolls a few cm under the cabin and came up through the building's own thin floor,
                   so the boards are a real slab now, 16 cm proud of the ground, wall to wall; the porch boards sit at the same height */
                box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FL, 0x8c8172, { uv: [1.75, 1.75] }),
                box(0, 0, d / 2 + 1.75, w, 0.16, 3.3, FL, 0x8c8172), ...[-w / 2 + 0.3, -1.9, 1.9, w / 2 - 0.3].map(x => box(x, 0, d / 2 + 3.2, 0.22, 2.55, 0.22, WD2, DARK)),
                { s: 'roof', form: 'shed', p: [0, 2.55, r2(d / 2 + 1.85)], size: [w + 1.0, 0.95, 3.9], key: SH, tint: MOSS, roof: true },
                /* the stone chimney up the back wall, its hearth inside */
                box(3.4, 0, -d / 2 - 0.5, 1.6, 6.6, 1.1, 'rocks_5', STONE, { roof: true }), box(3.4, 0, -d / 2 + 0.75, 2.2, 1.5, 0.9, 'rocks_5', STONE), box(3.4, 1.5, -d / 2 + 0.75, 2.6, 0.18, 1.0, WD2, DARK),
                /* a table built from parts by the front window */
                box(3.5, 0.74, 1.75, 1.5, 0.08, 0.9, WD2, 0x7a6a55), ...[[2.85, 1.4], [4.15, 1.4], [2.85, 2.1], [4.15, 2.1]].map(q => box(q[0], 0, q[1], 0.09, 0.74, 0.09, WD2, DARK)),
            ];
            features.push({ k: 'arch', id: 'woods:cabin:arch', x: cx, z: cz, rot: 90, parts });
            /* the inside (a row-frame spot to the room: rot 90 puts +x of the row on the room's +z, +z of the row on its -x) */
            const at = (rx, rz) => ({ x: r2(cx - rz), z: r2(cz + rx) });
            const inP = (key, rx, rz, o) => props.push(Object.assign({ key }, at(rx, rz), o || {}));
            inP('cot', -3.5, -2.2, { face: 0 }); inP('sea_chest', -4.4, -0.3, { face: 90 }); inP('rocking_chair', -3.9, 2.0, { face: 300 }); inP('retro_radio', -4.6, 2.7); inP('rug_round', -0.9, 0.2, { y: 0.01 });
            inP('cauldron', 3.4, -1.5); inP('skull', 3.2, 1.75, { y: 0.83, face: 250 }); inP('candle', 3.9, 1.6, { y: 0.83 }); inP('psx_vhs_tape_1', 3.5, 2.0, { y: 0.83 }); inP('psx_hand_saw_1', 1.9, -2.9, { y: 0.02 });
            inP('psx_cobweb_1', -4.9, -3.1, { y: 2.3 }); inP('psx_cobweb_2', 4.9, 3.1, { y: 2.3 }); inP('trap_bear_shut', 1.6, 2.6); inP('meshy_burlap_sack', -1.8, -2.8); inP('wooden_bucket', 1.2, -2.9);
            inP('railway_lantern', lx + 1.6, d / 2 + 2.4);   // on the porch boards
            tk(8, 10, 5, 7); }
          hdec('P03-05', 'garbage_bag', 3, 2); hdec('P03-05', 'trap_bear_open', 2, -1); hdec('P03-05', 'meshy_burlap_sack', 0, 3); }
        hput('P05-05', 'trap_sarcophagus_box', 0, 0, { face: 90 }); hdec('P05-05', 'skull', 1, 1);
    },
    /* THE LIFE PASS (mondo 11-15): this district's own wood, its plants and its small animals */
    life(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        sow('woods_thornvine', 26, [54, 54], 58, { h: 1.3, r0: 0.5 }); sow('woods_gasplant', 14, [54, 54], 58, { h: 1.1, r0: 0.4 }); sow('mushroom2', 12, [54, 54], 58, { h: 0.38, r0: 0.25 }); sow('stump', 12, [54, 54], 58);
        [['P03-03', 2, 2], ['P04-03', -2, 2], ['P05-03', 2, -2], ['P04-04', -2, -2], ['P05-04', 2, 2], ['P04-05', 3, 2], ['P05-05', -2, 2]].forEach(d => { const q = hput(d[0], 'dead_snag', d[1], d[2], { face: Math.round(rnd() * 360) });
            if (q && rnd() < 0.6) props.push({ key: 'crow', x: gc(q[0]), z: gc(q[1]), y: 4.5, face: Math.round(rnd() * 360) }); });
        DIST('M').forEach((id, i) => { life(id, 'woods_gasplant', { h: 1.3 }); if (i % 2) life(id, 'crow'); });
        ['P04-05', 'P04-05', 'P04-05', 'P05-04', 'P04-04'].forEach(id => life(id, 'meshy_frog'));
    },
    /* THE EXTERIOR PASS (2026-11-16, the pilot thread): every plot reads as its name. New rows only, on this district's own dice. */
    build(ctx) {
        const { plot, N, gx, gc, r2, features, props, taken } = ctx;
        const rock = (x, y, z, r, h, top, seg, tint) => cyl(x, y, z, r, h, ROCK, tint || T_ROCK, { r2: top, seg, uv: [3.5, 3.5] });
        /* ── THE CAVE MOUTH: the rest of the crag (west block, the two arms), its rock skin, the lintel over the mouth ── */
        { const p = plot['P03-04'], X = p.x * N, Y = p.y * N, ox = gc(X + 5), oz = gc(Y + 1);   // the row's origin = the mouth's middle (square col 5, row 1 of the plot)
          features.push({ k: 'plateau', x: gc(X + 4), z: gc(Y + 1), w: 3.5, d: 3.5, h: 6, edge: 0.08 },      // the west block
              { k: 'plateau', x: gc(X + 3), z: gc(Y + 2), w: 3.5, d: 3.5, h: 3.5, edge: 0.08 },                // the west arm
              { k: 'plateau', x: gc(X + 8), z: gc(Y + 2), w: 3.5, d: 3.5, h: 3.5, edge: 0.08 });               // the east arm
          const sk = (x, z, w, d, h, t) => box(x, 0, z, w + 0.12, h + 0.06, d + 0.12, ROCK, t, { uv: [3.5, 3.5] });
          features.push({ k: 'arch', id: 'woods:M:crag', x: ox, z: oz, parts: [
              sk(-3.5, 0, 3.5, 3.5, 6, T_ROCK), sk(5.25, 0, 7, 3.5, 6.5, T_ROCK), sk(-7, 3.5, 3.5, 3.5, 3.5, T_ROCK2), sk(10.5, 3.5, 3.5, 3.5, 3.5, T_ROCK2),
              box(0, 4.1, 0, 3.8, 2.6, 4.1, ROCK, T_ROCK2, { uv: [3.5, 3.5], under: true }),                 // the lintel: the mouth is 3.5 m wide, 4.1 m high
              /* the crowns and the shoulders: tapered stone, so no block reads as a box */
              rock(-3.6, 6, 0.2, 2.5, 2.2, 1.1, 6), rock(4.2, 6.5, -0.2, 3.2, 3.0, 1.2, 7), rock(7.4, 6.5, 0.4, 2.2, 1.7, 0.8, 5, T_ROCK2), rock(0.2, 6.7, 0, 2.3, 1.5, 0.9, 6, T_ROCK2),
              rock(-7, 3.5, 3.4, 2.3, 1.6, 0.8, 5), rock(10.5, 3.5, 3.5, 2.4, 1.9, 0.9, 6), rock(-7.4, 0, 0.1, 2.9, 5.0, 1.3, 6, T_ROCK2), rock(11.2, 0, 0.2, 3.1, 5.4, 1.4, 7, T_ROCK2),
              rock(-5.2, 0, -2.6, 2.4, 3.4, 1.0, 5, T_ROCK2), rock(6.5, 0, -2.8, 2.9, 4.2, 1.2, 6, T_ROCK2), rock(-9.4, 0, 4.2, 1.7, 2.2, 0.7, 5), rock(13, 0, 4.4, 1.9, 2.6, 0.8, 5),
              rock(-2.1, 0, 2.3, 0.9, 1.5, 0.45, 5, T_ROCK2), rock(2.2, 0, -2.3, 1.0, 1.9, 0.5, 5, T_ROCK2),
              box(3.5, 0, 1.8, 2.5, 2.7, 0.1, null, T_DARK),                                                 // the dark behind the drain's mouth
          ] }); }
        /* ── THE CHANNEL: the creek runs between brick walls from the Channel's upper plot to the Outfall (the plan's brick channel) ── */
        { const pts = []; features.filter(f => f.k === 'stream').forEach(st => st.pts.forEach(q => { const l = pts[pts.length - 1]; if (q[0] >= 45.4 && q[1] >= 27.9 && q[0] <= 114 && !(l && l[0] === q[0] && l[1] === q[1])) pts.push(q); }));
          const decks = features.filter(f => f.k === 'deck' && f.w >= 7), under = (x, z) => decks.some(d => d.z0 === d.z1 ? Math.abs(z - d.z0) <= d.w / 2 && x >= d.x0 && x <= d.x1 : Math.abs(x - d.x0) <= d.w / 2 && z >= d.z0 && z <= d.z1);
          const rows = {}, rowOf = (x, z) => { const px = Math.floor((x + 126) / 42), pz = Math.floor((z + 126) / 42), id = px + ':' + pz; return rows[id] || (rows[id] = { k: 'arch', id: 'woods:M:channel:' + id, x: -126 + px * 42 + 21, z: -126 + pz * 42 + 21, hug: true, parts: [] }); };
          const OFF = 2.55, nrm = i => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [-(b[1] - a[1]) / L, (b[0] - a[0]) / L]; };
          for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; if (under(mx, mz)) continue;
              const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L, R = rowOf(mx, mz);
              for (const sd of [-1, 1]) { const x = mx + nx * sd * OFF - R.x, z = mz + nz * sd * OFF - R.z;
                  R.parts.push(box(x, -1.2, z, L + 0.1, 1.7, 0.5, BRICK, T_BRICK, { ry: ang, uv: [1.75, 1.75], top: false }), box(x, 0.5, z, L + 0.1, 0.14, 0.72, CONC, T_CONC, { ry: ang })); } }
          pts.forEach((q, i) => { if (under(q[0], q[1])) return; const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], c = pts[i];
              const bend = Math.abs(Math.atan2(c[1] - a[1], c[0] - a[0]) - Math.atan2(b[1] - c[1], b[0] - c[0])) > 0.14; if (!bend && i % 3 && i !== pts.length - 1) return;
              const n = nrm(i), R = rowOf(q[0], q[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
              for (const sd of [-1, 1]) { const x = q[0] + n[0] * sd * OFF - R.x, z = q[1] + n[1] * sd * OFF - R.z;
                  R.parts.push(box(x, -1.2, z, 0.95, 2.0, 0.95, BRICK2, T_BRICK2, { ry: ang, uv: [1.75, 1.75], top: false }), box(x, 0.8, z, 1.1, 0.14, 1.1, CONC, T_CONC, { ry: ang })); } });
          /* the culvert heads: where the creek dives under a trail's deck, a brick head with a parapet and the dark of its barrel */
          const head = (x, z, len, ang) => { const R = rowOf(x, z), lx = x - R.x, lz = z - R.z, c = Math.cos(ang * Math.PI / 180), s2 = Math.sin(ang * Math.PI / 180);
              R.parts.push(box(lx, -1.3, lz, len, 2.5, 0.55, BRICK, T_BRICK, { ry: ang, uv: [1.75, 1.75], top: false }), box(lx, 1.2, lz, len + 0.3, 0.16, 0.8, CONC, T_CONC, { ry: ang }),
                  box(lx - c * (len / 2 + 0.3), -1.3, lz - s2 * (len / 2 + 0.3), 1.0, 2.9, 1.0, BRICK2, T_BRICK2, { ry: ang, uv: [1.75, 1.75] }), box(lx + c * (len / 2 + 0.3), -1.3, lz + s2 * (len / 2 + 0.3), 1.0, 2.9, 1.0, BRICK2, T_BRICK2, { ry: ang, uv: [1.75, 1.75] }),
                  box(lx + s2 * 0.3, -1.3, lz - c * 0.3, 4.2, 1.45, 0.08, null, T_DARK, { ry: ang }), box(lx - s2 * 0.3, -1.3, lz + c * 0.3, 4.2, 1.45, 0.08, null, T_DARK, { ry: ang })); };
          head(21, 17.2, 9, 0); head(45.5, 28.3, 9, 0);          // the Culvert plot's long deck: the creek goes in at its north edge, out at its south
          head(62.6, 52.2, 7.5, 0); head(72.05, 62.8, 6.5, 90);  // the lower Channel's crossing: in from the north, out to the east
          Object.keys(rows).forEach(id => features.push(rows[id])); }
        /* ── THE STORM DRAIN: the trail to the street leaves through a concrete box culvert (the link's own end is the tool's, one square east) ── */
        { const x = 115.5, z = 14, W = 7.3, H = 4.2, L = 7;
          features.push({ k: 'arch', id: 'woods:M:stormdrain', x, z, parts: [
              box(0, 0, -(W / 2 + 0.6), L, H, 1.2, CONC, T_CONC, { uv: [3.5, 3.5] }), box(0, 0, W / 2 + 0.6, L, H, 1.2, CONC, T_CONC, { uv: [3.5, 3.5] }),
              box(0, H, 0, L + 0.5, 0.7, W + 3.0, CONC, T_CONC, { uv: [3.5, 3.5], under: true, roof: true }), box(-L / 2 - 0.1, H + 0.7, 0, 0.7, 0.6, W + 3.0, CONC2, T_CONC, { roof: true }),
              box(-L / 2 - 1.6, 0, -(W / 2 + 1.5), 3.6, 2.9, 0.6, CONC, T_CONC, { ry: 150, uv: [3.5, 3.5] }), box(-L / 2 - 1.6, 0, W / 2 + 1.5, 3.6, 2.9, 0.6, CONC, T_CONC, { ry: 30, uv: [3.5, 3.5] }),   // the wing walls
              box(-L / 2 - 0.02, H - 0.55, 0, 0.06, 0.5, W, 'urban:ConcreteStriped1a', 0xffffff, { uv: [1.75, 0.5] }),                                                                    // the hazard band over the mouth
              box(-L / 2 - 0.05, 1.5, -(W / 2 + 0.6), 0.05, 0.9, 0.9, 'urban:SignHazard1a', 0xffffff, { uv: 'fit', faces: 'l', top: false }),
              box(0, 0.02, -(W / 2 - 0.25), L, 0.3, 0.5, CONC2, T_MOSS), box(0, 0.02, W / 2 - 0.25, L, 0.3, 0.5, CONC2, T_MOSS),                                                          // the benches along the barrel's feet
          ] }); }
        /* ── THE OUTFALL: the creek runs out into the sewers through a brick mouth under a barrel vault ── */
        { const x = 119, z = 66.5, W = 9, H = 3.2, L = 7;
          features.push({ k: 'arch', id: 'woods:M:outfall', x, z, parts: [
              box(0, -1.2, -(W / 2 + 0.7), L, H + 1.2, 1.4, BRICK2, T_BRICK2, { uv: [1.75, 1.75] }), box(0, -1.2, W / 2 + 0.7, L, H + 1.2, 1.4, BRICK2, T_BRICK2, { uv: [1.75, 1.75] }),
              { s: 'roof', form: 'barrel', p: [0, H, 0], size: [L, 2.6, W + 2.8], key: BRICK, tint: T_BRICK, keyEnd: BRICK2, tintEnd: T_BRICK2, uv: [1.75, 1.75], roof: true, seg: 12 },
              box(-L / 2 - 0.15, H - 0.25, 0, 0.5, 0.5, W + 3.0, CONC, T_CONC),                                                    // the stone course the vault springs from
              box(-L / 2 - 1.5, -1.2, -(W / 2 + 1.7), 3.4, 3.4, 0.6, BRICK, T_BRICK, { ry: 150, uv: [1.75, 1.75] }), box(-L / 2 - 1.5, -1.2, W / 2 + 1.7, 3.4, 3.4, 0.6, BRICK, T_BRICK, { ry: 30, uv: [1.75, 1.75] }),
              box(-L / 2 - 0.05, 1.6, W / 2 + 0.7, 0.05, 0.9, 0.9, 'urban:SignCaution1a', 0xffffff, { uv: 'fit', faces: 'l', top: false }),
          ] }); }
    },
};
