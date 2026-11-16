/* THE WOODS · DEAD MAN'S CAVE (district M, plots x 3..5 · y 3..5, the south-east, levels 0 to 1: the low wet ground) — this district's own content, split out of bake-woods.js on
   2026-11-16 (mondo: "every single zone needs to be like that. now. so we can work in parallel"). One thread = this one file.
   Repo tooling only: nothing here ships; the room is baked into data.js (site_prebuilt_fairy_forest_plots, WOODS36-BEGIN / END).

   MONDO'S BRIEF (2026-11-16, his words; it outranks the plan's brick channel below): "dead man's cave is just this nickname for this spot in the woods by the high
   school I went to ... there is dry creek, but it is pretty steep, so there are two cliffs basically facing each other with dry riverbed in between, steep walls. And
   then at the end of the riverbed is a big sewer mouth ... that leads into a tunnel into the sewers. so this part of the woods needs to have a corresponding plot in
   the sewers". So: the creek bed through this district is DRY and cut deep between two rock walls; it ends (the Outfall, link sewers_drain) at one big sewer mouth.
   BUILT 2026-11-16 (the exterior pass, his answers the same day: the bed is walked; "the mouth is the cave"; no pool here; a way out underground "should
   just be blackness"): THE CULVERT takes the creek's water under the trail (a brick head, a black pipe) and the bed below is DRY bare rock; THE RAVINE
   (plots P04-04 / P05-04, room squares 56..71 x 54..55) is cut 3.5 m down between rock walls, its bed DIRT with a concrete apron at the end, a dirt path along each rim, a ramp down from the trail, and ends at THE SEWER
   MOUTH (the cave: a brick head with blackness in its arch, link sewers_drain). The Storm Drain and the Tunnel Way end in the same black mouths. The Pool
   is gone. The crag stands on its plan squares as a rock gate over the north trail and wears no drain. The lists below are older than this.
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
     P04-05 The Pool (L0)            NO POOL since 11-16 (grass); natives: swamp monster, mothman; a dead snag. The plot's name waits mondo.
     P05-05 The Tunnel Way (L0)      a sarcophagus box, a skull, a dead snag. The link woods_sewer (the HQ tunnel, secret) is east.
   KNOWN MISSING / WAITING FOR MONDO
     - The life pass and the horror pass are live but wait for his look (the board).
     - THE CABIN HAS NO GAME ROLE: mondo, "Nothing yet". Do not tie a rest spot, a shop, a story beat or an NPC to it until he says what it is for.
     - THE CAVE IS THE SEWER MOUTH (mondo 11-16); its inside is the tunnel to the Sewers: that zone's plot (the Sewers thread, a board note asks for it).
     - The Tunnel Way's trail ends at a black mouth now (mondo: "it should just be blackness"); the link itself is still `secret` in the tool.
     - The plan's brick channel is dropped: his brief makes it a dry rock bed. Plot names "The Cave Mouth", "The Channel", "The Pool" no longer fit: his to rename.
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
/* arch parts (data.js THE ARCHITECTURE ROW): p = the foot's middle in the row's frame; a tint MULTIPLIES its sheet */
const R2 = v => Math.round(v * 100) / 100;
const box = (x, y, z, w, h, d, key, tint, o) => Object.assign({ s: 'box', p: [R2(x), R2(y), R2(z)], size: [R2(w), R2(h), R2(d)], key, tint }, o || {});
const cyl = (x, y, z, r, h, key, tint, o) => Object.assign({ s: 'cyl', p: [R2(x), R2(y), R2(z)], r: R2(r), h: R2(h), key, tint }, o || {});
const ROCK = 'rocks_5', BRICK = 'urban:BrickMasonry1a', BRICK2 = 'urban:BrickUrban3a', CONC = 'urban:ConcreteWoodFormed1a';
const T_ROCK = 0xd6d2c4, T_ROCK2 = 0xbcb9aa, T_BRICK = 0xb39a8a, T_BRICK2 = 0x9c8f84, T_CONC = 0xb4b6ac, BLACK = 0x000000;
const rock = (x, y, z, r, h, top, seg, tint) => cyl(x, y, z, r, h, ROCK, tint || T_ROCK, { r2: top, seg, uv: [3.5, 3.5] });
/* THE RAVINE (mondo 11-16): the bed's squares, cut 3.5 m down, in room squares [col0, col1, row0, row1]: two squares wide from the trail to the east wall.
   Four of them were forest squares: opened in cut() (bake-woods.js THE CUT keeps the forest's dice where they were). */
const RAVINE = [[56, 71, 54, 55]], DEEP = -3.5;
module.exports = {
    id: 'M', name: 'Dead Man\'s Cave',
    bare: [115.5, 63, 127, 70],   // the concrete apron before the sewer mouth: no scatter piece lands there (bake-woods.js BARE GROUND; this file's own sow rows carry it as `off`)
    /* the forest mass: the feature trees planted deep in this district's tree squares [kind, height m, chance a deep square] (plots of level 6 up get pines, the tool's rule) */
    wood: ['tree_6', 7, 0.05],   // bare trees (was `dead_tree`, no such kind: nothing was planted)
    /* THE TREE ZONES (terrain.gen.zones, the thicket by district) and THE AIR BY DISTRICT (shell.atmos.zones): boxes in plots, zoneOf(x0, y0, x1, y1) */
    treeZones: ctx => [Object.assign(ctx.zoneOf(3, 3, 6, 6), { kinds: ['tree_5', 'tree_6', 'tree_5', 'tree_6', 'tree_55'], treeH: [6, 8.5] })],               // bare
    airZones: ctx => [Object.assign(ctx.zoneOf(3, 3, 6, 6), { kind: 'ash', color: 0x8a9484, speed: 0.5, n: 240 })],
    /* THE GROUND: this district's own changes to the plan's squares, before the levels and the open ground are read */
    /* THE WATER (bake-woods.js THE WATER BY DISTRICT): the creek's water ends at the culvert's head on the Culvert plot (north edge of the trail, x 21 · z 17.5);
       below it the bed is dry. No pool here (mondo: "this is dead man's cave"). */
    water(row) {
        if (row.k === 'pool') return (row.x > 0 && row.z > 0) ? null : row;
        if (row.k !== 'stream') return row;
        const pts = row.pts.filter(q => !(q[0] > 21.01 && q[1] > 17.51)); return pts.length === row.pts.length ? row : pts.length >= 2 ? Object.assign({}, row, { pts }) : null;
    },
    tailor(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        { const p = plot['P03-05']; for (let ly = 9; ly <= 10; ly++) for (let lx = 1; lx <= 10; lx++) cell[p.y * N + ly][p.x * N + lx] = 'g';
          for (let ly = 5; ly <= 8; ly++) for (let lx = 8; lx <= 10; lx++) cell[p.y * N + ly][p.x * N + lx] = 'g';
          for (let lx = 4; lx <= 7; lx++) if (cell[p.y * N + 6][p.x * N + lx] === 't') cell[p.y * N + 6][p.x * N + lx] = 'p'; }   // the alley from the plot's path to the cabin porch
    },
    /* THE CUT (bake-woods.js): this district's later changes to its squares */
    cut(ctx) {
        const { cell } = ctx;
        /* THE DRY BED (mondo 11-16): below the culvert the creek's squares are bare rock (r), the plank decks are plain trail again (no water to cross),
           the Pool's squares are grass. No tree square is touched. */
        for (let cy = 36; cy < 72; cy++) for (let cx = 36; cx < 72; cx++) { const ch = cell[cy][cx], pool = cx >= 50 && cx <= 58 && cy >= 62 && cy <= 70;
            if (ch === 'w') cell[cy][cx] = pool ? 'g' : (cy <= 40 && cx <= 42) ? 'w' : 'p'; else if (ch === 'b') cell[cy][cx] = 'p'; }   // the bed is DIRT (mondo 11-16: "the riverbed is supposed to be dirt")
        RAVINE.forEach(q => { for (let cy = q[2]; cy <= q[3]; cy++) for (let cx = q[0]; cx <= q[1]; cx++) { cell[cy][cx] = 'p'; } });
        /* THE RIMS (mondo 11-16: "I still need to be able to walk along the edges of the creek"): one square of dirt along each rim of the ravine, trail to east wall */
        for (let cx = 56; cx <= 71; cx++) for (const cy of [53, 56]) if (cell[cy][cx] === 't') cell[cy][cx] = 'p';
    },
    /* THE DRESSING: the landmark, the set pieces and the natives (ported from the old rooms) */
    dress(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        for (let cx = 56; cx <= 71; cx++) { taken.add(cx + ':54'); if (cx <= 60 || cx >= 69) taken.add(cx + ':55'); }   // THE RAVINE: the ramp, a clear lane down the bed and the mouth's apron hold no piece
        { /* THE CRAG (2026-11-16): mondo, "the mouth is the cave": the sewer mouth at the ravine's end is the district's cave, so the crag wears no drain
             mouth any more. It stands on the plan's own rock squares now (row 1 of the plot + the two arms on row 2), a horseshoe open to the clearing
             with the north trail walking through its back; it stood two squares south before, across the alley. ONE feature row stays here (an old
             pass keeps its count of feature rows); the rest is build(). */
          const p = plot['P03-04'], X = p.x * N, Y = p.y * N;
          features.push({ k: 'plateau', x: gx(X + 7), z: gc(Y + 1), w: 7, d: 3.5, h: 6.5, edge: 0.08 });
          props.push({ key: 'graffiti_wall', x: r2(gx(X + 7) + 1), z: r2(gx(Y + 2) + 0.1), face: 180 });
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
            const LOG = 0xcdbb9f, DARK = 0x7d6c58, MOSS = 0x9fb089, STONE = 0xd6d2c4;   // lifted 11-16 (the interior pass): a tint multiplies the sheet and the building tint, the old ones drew near black
            const row = { k: 'texbuilding', id: 'woods:cabin', x: cx, z: cz, w, d, rot: 90, storeys: 1, seed: 1, skin: false, hollow: true, leaf: 'leaf_shabby_wood', keyIn: WD2, floorIn: FL };
            features.push(row);
            const L = w - 0.12, cols = Math.round(L / 1.75), cw = L / cols, lx = r2(-L / 2 + (Math.floor((cols - 1) / 2) + 0.5) * cw);   // data.js hqTexbDoor: the doorway's middle along the front
            const box = (x, y, z, sw, sh, sd, key, tint, o) => Object.assign({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(sw), r2(sh), r2(sd)], key, tint }, o || {});
            const parts = [
                box(0, 0, 0, w + 2 * E, H, d + 2 * E, WD, LOG, { faces: 'blr', top: false, uv: [3.5, 1.75], gain: 1.5 }),                                     // the three blind log walls
                { s: 'quad', p: [0, 0, r2(d / 2 + E)], size: [r2(w + 2 * E), H], key: WD, tint: LOG, uv: [3.5, 1.75], gain: 1.5, hole: [lx, r2(cw), 2.2] },   // the front, its doorway cut
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
                box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FL, 0xc9b9a0, { uv: [1.75, 1.75] }),
                box(0, 0, d / 2 + 1.75, w, 0.16, 3.3, FL, 0xc9b9a0), ...[-w / 2 + 0.3, -1.9, 1.9, w / 2 - 0.3].map(x => box(x, 0, d / 2 + 3.2, 0.22, 2.55, 0.22, WD2, DARK)),
                { s: 'roof', form: 'shed', p: [0, 2.55, r2(d / 2 + 1.85)], size: [w + 1.0, 0.95, 3.9], key: SH, tint: MOSS, roof: true },
                /* the stone chimney up the back wall, its hearth inside */
                box(3.4, 0, -d / 2 - 0.5, 1.6, 6.6, 1.1, 'rocks_5', STONE, { roof: true }), box(3.4, 0, -d / 2 + 0.75, 2.2, 1.5, 0.9, 'rocks_5', STONE), box(3.4, 1.5, -d / 2 + 0.75, 2.6, 0.18, 1.0, WD2, DARK),
                /* THE INTERIOR PASS (2026-11-16): the hollow building's own ceiling draws black, so the room gets a LIT plank ceiling (drawn glow, no light) on four
                   dark beams, a warm wall coat, a mantel shelf, wall shelves, a plank bed frame and a firewood stack */
                box(0, H - 0.62, 0, w - 0.5, 0.05, d - 0.5, WD, 0xe8dcc0, { uv: [3.5, 1.75], glow: 0.55, under: true, roof: true }),   // under the building's own ceiling (3.18 m), or that one hides it
                box(-3.5, H - 0.88, 0, 0.26, 0.28, d - 0.5, WD2, DARK, { n: 3, step: [3.5, 0, 0], roof: true }), box(0, H - 0.92, 0, w - 0.5, 0.2, 0.22, WD2, DARK, { roof: true }),
                box(0, 0.16, -d / 2 + 0.3, w - 0.6, 1.0, 0.05, WD2, 0xa89478, { uv: [1.75, 1.0] }), box(-w / 2 + 0.3, 0.16, 0, 0.05, 1.0, d - 0.6, WD2, 0xa89478, { uv: [1.75, 1.0] }), box(w / 2 - 0.3, 0.16, 0, 0.05, 1.0, d - 0.6, WD2, 0xa89478, { uv: [1.75, 1.0] }),   // a boarded dado on three walls
                box(-1.2, 1.5, -d / 2 + 0.42, 2.4, 0.06, 0.34, WD2, DARK), box(-1.2, 2.05, -d / 2 + 0.42, 2.4, 0.06, 0.34, WD2, DARK),                                   // two wall shelves on the back wall
                box(3.4, 0.16, -d / 2 + 0.72, 1.1, 0.75, 0.5, null, 0x050505), box(3.4, 0.2, -d / 2 + 0.95, 0.7, 0.22, 0.2, null, 0xff7a20, { glow: 1 }),                // the hearth's mouth and its embers
                box(1.35, 0.16, -d / 2 + 0.55, 0.9, 0.5, 0.45, WD2, 0x8a7458, { uv: [0.3, 0.3] }),                                                                      // the firewood stack
                box(-3.5, 0.16, -1.75, 2.2, 0.3, 1.25, WD2, DARK),                                                                                                       // the bed's plank frame under the cot
                box(lx, 0.165, d / 2 - 1.0, 1.5, 0.02, 0.9, 'urban:CarpetPlain1c', 0x7a4a3a, { sides: false }),                                                          // the door mat
                /* a table built from parts by the front window */
                box(3.5, 0.74, 1.75, 1.5, 0.08, 0.9, WD2, 0x7a6a55), ...[[2.85, 1.4], [4.15, 1.4], [2.85, 2.1], [4.15, 2.1]].map(q => box(q[0], 0, q[1], 0.09, 0.74, 0.09, WD2, DARK)),
            ];
            features.push({ k: 'arch', id: 'woods:cabin:arch', x: cx, z: cz, rot: 90, parts });
            /* the inside (a row-frame spot to the room: rot 90 puts +x of the row on the room's +z, +z of the row on its -x) */
            const at = (rx, rz) => ({ x: r2(cx - rz), z: r2(cz + rx) });
            const inP = (key, rx, rz, o) => props.push(Object.assign({ key }, at(rx, rz), o || {}));
            inP('cot', -3.5, -1.75, { face: 0, y: 0.46 }); inP('sea_chest', -2.1, -1.75, { face: 90 }); inP('rocking_chair', 0.4, -2.1, { face: 20 }); inP('retro_radio', -4.6, -0.6, { y: 0.8 }); inP('rug_round', -0.9, 0.2, { y: 0.01 });
            inP('cauldron', 3.4, -1.5); inP('skull', 3.2, 1.75, { y: 0.83, face: 250 }); inP('candle', 3.9, 1.6, { y: 0.83 }); inP('psx_vhs_tape_1', 3.5, 2.0, { y: 0.83 }); inP('psx_hand_saw_1', 1.9, -2.9, { y: 0.02 });
            inP('psx_cobweb_1', -4.9, -3.1, { y: 2.3 }); inP('psx_cobweb_2', 4.9, 3.1, { y: 2.3 }); inP('trap_bear_shut', 1.6, 2.6); inP('meshy_burlap_sack', -1.8, -2.8); inP('wooden_bucket', 1.2, -2.9);
            inP('railway_lantern', lx + 1.6, d / 2 + 2.4);   // on the porch boards
            /* THE INTERIOR PASS: lived in, then left. Blockers on the squares' middles (the cot, the table), the rest against the walls or off the middles;
               the door's square and the way to the hearth stay clear. Every lit piece carries noLight (the room's real lights are the torches and fires). */
            inP('psx_wardrobe_mp_1', -4.55, 1.1, { face: 90 }); inP('psx_bedside_table_1', -4.6, -0.35, { face: 90 }); inP('psx_lamp_1_on', -4.6, -0.35, { y: 0.8, noLight: true });
            inP('psx_armchair_1', 1.5, -1.3, { face: 60 }); inP('psx_carpet_mp_1', 1.9, -0.9, { y: 0.17, face: 90 }); inP('psx_shelf_mp_3', 4.75, -0.6, { face: 270 });
            inP('psx_canned_food_mp_1', -1.9, -3.08, { y: 1.72 }); inP('psx_canned_food_mp_1', -1.6, -3.08, { y: 1.72 }); inP('psx_tin_can_mp_1_rusty', -0.7, -3.08, { y: 1.72 }); inP('psx_book_mp_1', -1.0, -3.08, { y: 2.27 }); inP('psx_clock_1', -1.9, -3.08, { y: 2.27 });
            inP('psx_painting_1', -w / 2 + 0.36, -1.9, { y: 1.9, face: 90 }); inP('wall_chains', 4.9, 2.4, { face: 270 }); inP('psx_butcher_knife_mp_1', 3.1, 2.05, { y: 0.83, face: 40 }); inP('psx_plate_mp_1', 3.8, 1.9, { y: 0.83 });
            inP('psx_wooden_crate_2', -1.6, 2.75); inP('psx_jerrycan_1', -0.9, 2.95); inP('psx_glass_bottle_1', 3.4, -2.75, { y: 1.86 }); inP('hw_candles', 4.0, -2.75, { y: 1.86 }); inP('psx_ceiling_lamp_1_on', 0, 0, { y: 2.42, noLight: true });
            inP('psx_old_mattress_mp_1', -3.5, 2.5, { face: 90, y: 0.17 }); inP('psx_pillow_mp_1', -4.3, -1.75, { y: 0.78 });
            tk(8, 10, 5, 7); }
          hdec('P03-05', 'garbage_bag', 3, 2); hdec('P03-05', 'trap_bear_open', 2, -1); hdec('P03-05', 'meshy_burlap_sack', 0, 3); }
        hput('P05-05', 'trap_sarcophagus_box', 0, 0, { face: 90 }); hdec('P05-05', 'skull', 1, 1);
    },
    /* THE LIFE PASS (mondo 11-15): this district's own wood, its plants and its small animals */
    life(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        const OFF = { off: [115.5, 63, 127, 70] };   // nothing grows on the apron
        sow('woods_thornvine', 26, [54, 54], 58, Object.assign({ h: 1.3, r0: 0.5 }, OFF)); sow('woods_gasplant', 14, [54, 54], 58, Object.assign({ h: 1.1, r0: 0.4 }, OFF)); sow('mushroom2', 12, [54, 54], 58, Object.assign({ h: 0.38, r0: 0.25 }, OFF)); sow('stump', 12, [54, 54], 58, OFF);
        [['P03-03', 2, 2], ['P04-03', -2, 2], ['P05-03', 2, -2], ['P04-04', -2, -2], ['P05-04', 2, 2], ['P04-05', 3, 2], ['P05-05', -2, 2]].forEach(d => { const q = hput(d[0], 'dead_snag', d[1], d[2], { face: Math.round(rnd() * 360) });
            if (q && rnd() < 0.6) props.push({ key: 'crow', x: gc(q[0]), z: gc(q[1]), y: 4.5, face: Math.round(rnd() * 360) }); });
        DIST('M').forEach((id, i) => { life(id, 'woods_gasplant', { h: 1.3 }); if (i % 2) life(id, 'crow'); });
        /* (the five frogs went with the water, 2026-11-16) */
    },
    /* THE EXTERIOR PASS (2026-11-16, the pilot thread, on mondo's brief at the top of this file). New rows only, on this district's own dice. */
    build(ctx) {
        const { plot, N, gx, gc, r2, features, props, rnd } = ctx;
        /* ── THE CRAG: the west block and the two arms, the rock skin, the lintel over the trail's way through ── */
        { const p = plot['P03-04'], X = p.x * N, Y = p.y * N, ox = gc(X + 5), oz = gc(Y + 1);   // the row's origin = the way through (plot square 5, 1)
          features.push({ k: 'plateau', x: gc(X + 4), z: gc(Y + 1), w: 3.5, d: 3.5, h: 6, edge: 0.08 }, { k: 'plateau', x: gc(X + 3), z: gc(Y + 2), w: 3.5, d: 3.5, h: 3.5, edge: 0.08 },
              { k: 'plateau', x: gc(X + 8), z: gc(Y + 2), w: 3.5, d: 3.5, h: 3.5, edge: 0.08 });
          const sk = (x, z, w, d, h, t) => box(x, 0, z, w + 0.12, h + 0.06, d + 0.12, ROCK, t, { uv: [3.5, 3.5] });
          features.push({ k: 'arch', id: 'woods:M:crag', x: ox, z: oz, parts: [
              sk(-3.5, 0, 3.5, 3.5, 6, T_ROCK), sk(5.25, 0, 7, 3.5, 6.5, T_ROCK), sk(-7, 3.5, 3.5, 3.5, 3.5, T_ROCK2), sk(10.5, 3.5, 3.5, 3.5, 3.5, T_ROCK2),
              box(0, 4.1, 0, 3.8, 2.6, 4.1, ROCK, T_ROCK2, { uv: [3.5, 3.5], under: true }),
              rock(-3.6, 6, 0.2, 2.5, 2.2, 1.1, 6), rock(4.2, 6.5, -0.2, 3.2, 3.0, 1.2, 7), rock(7.4, 6.5, 0.4, 2.2, 1.7, 0.8, 5, T_ROCK2), rock(0.2, 6.7, 0, 2.3, 1.5, 0.9, 6, T_ROCK2),
              rock(-7, 3.5, 3.4, 2.3, 1.6, 0.8, 5), rock(10.5, 3.5, 3.5, 2.4, 1.9, 0.9, 6), rock(-7.4, 0, 0.1, 2.9, 5.0, 1.3, 6, T_ROCK2), rock(11.2, 0, 0.2, 3.1, 5.4, 1.4, 7, T_ROCK2),
              rock(-5.2, 0, -2.6, 2.4, 3.4, 1.0, 5, T_ROCK2), rock(6.5, 0, -2.8, 2.9, 4.2, 1.2, 6, T_ROCK2), rock(-9.4, 0, 4.2, 1.7, 2.2, 0.7, 5), rock(13, 0, 4.4, 1.9, 2.6, 0.8, 5),
          ] }); }
        /* ── THE RAVINE: the dry bed cut 3.5 m down between two rock walls, the ramp down into it from the trail, the rock on its rims ── */
        { const X0 = q => gx(q[0]), X1 = q => gx(q[1] + 1), Z0 = q => gx(q[2]), Z1 = q => gx(q[3] + 1);
          RAVINE.forEach((q, i) => features.push({ k: 'plateau', x: r2((X0(q) + X1(q)) / 2 + (i === RAVINE.length - 1 ? 0.5 : 0)), z: r2((Z0(q) + Z1(q)) / 2), w: X1(q) - X0(q) + (i === RAVINE.length - 1 ? 1 : 0), d: Z1(q) - Z0(q), h: DEEP, absY: true, sink: true, edge: 0.25 }));
          features.push({ k: 'ramp', x0: gx(56), z0: gx(55), x1: gx(60), z1: gx(55), w: 7, h0: 0, h1: DEEP, edge: 0.05, absY: true });   // four squares long, a quarter grade
          /* the walls' rock skin: one slab a wall run, from the bed to a little over the rim; then boulders along both rims */
          const inR = (cx, cy) => RAVINE.some(q => cx >= q[0] && cx <= q[1] && cy >= q[2] && cy <= q[3]), P = [], ox = gx(64), oz = gx(55);
          for (let cy = 53; cy <= 56; cy++) for (let cx = 55; cx <= 71; cx++) { if (!inR(cx, cy)) continue;
              const ramp = cx <= 59, top = ramp ? 0.5 + DEEP * (cx - 56 + 0.5) / 4 : DEEP;   // on the ramp the wall starts at the ramp's own height
              [[0, -1], [0, 1], [-1, 0]].forEach(d => { if (inR(cx + d[0], cy + d[1]) || (d[0] && cx === 56)) return; const ns = d[1] !== 0, x = gc(cx) + d[0] * 1.8 - ox, z = gc(cy) + d[1] * 1.8 - oz;
                  const apron = cx >= 69; P.push(box(x, top - 0.3, z, ns ? 3.6 : 0.3, 0.42 - top, ns ? 0.3 : 3.6, apron ? CONC : ROCK, apron ? T_CONC : (cx + cy) % 2 ? T_ROCK : T_ROCK2, { uv: [3.5, 3.5] }));
                  if (!apron && rnd() < 0.45) { const r = 0.3 + rnd() * 0.35; P.push(rock(x + (ns ? (rnd() - 0.5) * 2.6 : 0), 0, z + (ns ? 0 : (rnd() - 0.5) * 2.6), r, 0.25 + rnd() * 0.45, r * 0.5, 5, rnd() < 0.5 ? T_ROCK : T_ROCK2)); } }); }   // small stones on the lip: the rims are walked
          /* loose stone on the bed */
          for (let i = 0; i < 9; i++) P.push(rock(gx(61) + rnd() * 26 - ox, DEEP, gx(55) + (rnd() - 0.5) * 2.4 - oz + (rnd() < 0.5 ? -1.6 : 1.6), 0.35 + rnd() * 0.5, 0.3 + rnd() * 0.5, 0.2, 5, T_ROCK2));
          /* the last three squares before the mouth are a concrete apron (mondo: "a little part at the end that turns into concrete") */
          P.push(box(gx(69) + 5.25 - ox, DEEP - 0.1, 0, 10.6, 0.16, 7.1, CONC, T_CONC, { uv: [3.5, 3.5] }), box(gx(69) - ox, DEEP - 0.1, 0, 0.35, 0.22, 7.1, CONC, T_CONC));
          features.push({ k: 'arch', id: 'woods:M:ravine', x: ox, z: oz, y: 0, parts: P });
          /* the dry wash above the ravine: the old creek line sags a little, so the bare rock reads as a bed */
          [[49, 28.5], [54, 30.5], [58.5, 34], [59.5, 40], [61, 46], [69, 60.5]].forEach(q => features.push({ k: 'dip', x: q[0], z: q[1], r: 3.2, rz: 3.2, h: 0.7 })); }
        /* ── THE MOUTHS: a way out of the woods underground is a masonry head with BLACKNESS in its arch (mondo 11-16: "it should just be blackness").
              West-facing, on the east wall; the links' own ends are the tool's and stand where they stood. `y` = the foot (the ravine's bed for the sewer mouth). ── */
        const mouth = (id, z, y, ow, hs, H, Wd, key, tint) => { const fan = (x, r, k, t) => ({ s: 'roof', form: 'barrel', p: [x, hs, 0], size: [0.1, r, 2 * r], key: k, tint: t, keyEnd: k, tintEnd: t, uv: [1.75, 1.75], seg: 14 });
            features.push({ k: 'arch', id: 'woods:M:' + id, x: 123.6, z, y, parts: [
                box(1.3, 0, 0, 2.4, H, Wd, key, tint, { uv: [1.75, 1.75] }), box(1.3, H, 0, 2.9, 0.3, Wd + 0.6, CONC, T_CONC),
                fan(0, ow / 2 + 0.55, BRICK2, T_BRICK2), box(0.02, 0, -(ow / 2 + 0.28), 0.14, hs, 0.55, BRICK2, T_BRICK2, { uv: [1.75, 1.75] }), box(0.02, 0, ow / 2 + 0.28, 0.14, hs, 0.55, BRICK2, T_BRICK2, { uv: [1.75, 1.75] }),
                fan(-0.08, ow / 2, null, BLACK), box(-0.08, 0, 0, 0.1, hs, ow, null, BLACK),
                box(-1.6, 0, -(Wd / 2 + 1.1), 3.6, H * 0.6, 0.6, key, tint, { ry: 150, uv: [1.75, 1.75] }), box(-1.6, 0, Wd / 2 + 1.1, 3.6, H * 0.6, 0.6, key, tint, { ry: 30, uv: [1.75, 1.75] }),
            ] }); };
        mouth('sewermouth', 66.5, DEEP, 5.4, 2.1, 6.2, 9.5, BRICK, T_BRICK);      // THE CAVE: the big sewer mouth at the end of the dry bed (link sewers_drain)
        mouth('stormdrain', 14, null, 4.6, 2.2, 5.6, 9, CONC, T_CONC);            // the Storm Drain: up to the street (link streets_drain)
        mouth('tunnelway', 115.5, null, 4.4, 2.0, 5.2, 8.5, BRICK, T_BRICK2);     // the Tunnel Way (link woods_sewer)
        /* ── THE CULVERT: where the creek's water goes under the trail for good, and the dry pipe it once came out of ── */
        { const head = (id, x, z, sd) => features.push({ k: 'arch', id: 'woods:M:' + id, x, z, hug: true, parts: [
              box(0, -1.4, 0, 7, 2.3, 0.6, BRICK, T_BRICK, { uv: [1.75, 1.75] }), box(0, 0.9, 0, 7.4, 0.16, 0.85, CONC, T_CONC), box(-3.8, -1.4, 0, 1, 2.7, 1, BRICK2, T_BRICK2, { uv: [1.75, 1.75] }), box(3.8, -1.4, 0, 1, 2.7, 1, BRICK2, T_BRICK2, { uv: [1.75, 1.75] }),
              box(0, -1.4, sd * 0.31, 2.6, 1.0, 0.06, null, BLACK), { s: 'roof', form: 'barrel', p: [0, -0.4, sd * 0.31], ry: 90, size: [0.06, 1.3, 2.6], key: null, tint: BLACK, keyEnd: null, tintEnd: BLACK, seg: 12 },
          ] });
          head('culvert:in', 21, 17.9, -1); head('culvert:out', 45.5, 27.7, 1); }
    },
};
