/* THE WOODS · THE RITUAL GROUND (district G, plots x 3..5 · y 0..2, the north-east, levels 3 to 5; with the old Bohemian Grove) — this district's own content, split out of bake-woods.js on
   2026-11-16 (mondo: "every single zone needs to be like that. now. so we can work in parallel"). One thread = this one file.
   Repo tooling only: nothing here ships; the room is baked into data.js (site_prebuilt_fairy_forest_plots, WOODS36-BEGIN / END).

   THE LOOK: the fairy forest gone wrong, "the cult". Dark spruce with bare trees, glowing toadstools, giant caps, crystals, moths; violet motes.
   THE PLOTS AND WHAT STANDS THERE TODAY (the district thread's passes are in build(); notes: areas-complexes.md "THE RITUAL GROUND")
     P03-00 The Mound (L5)             a grass hill (r 9, h 2.6) with a wooden cross, three crosses, an open coffin and its lid, a giant cap. PASS 1: THE BARROW, a stone doorway in the south face + kerb stones.
     P04-00 The Lake, west shore (L4)  two lanterns, two giant caps, frogs. The lake is the tool's water. PASS 1: THE JETTY (cut: 4 bridge squares), posts, a lamp post, a rowboat. PASS 3 / 4: the effigy's boat and candles afloat.
     P05-00 The Lake, east shore (L4)  a candle line, two giant caps, frogs. The lodge door (the Lodge's halls) is east.
     P03-01 The Tents (L4)             three tents, a chest, a radio, three masks, a crystal; native: fortune teller. PASS 2: THE CAMP HOUSE on its east edge (room squares 45..48 x 16..17), a walk-in hall, furnished.
     P04-01 The Stage (L4)             PASS 1: a timber BAND SHELL over the old block (deck, back wall + red cloth, wings, posts, gable roof, footlights, rails); steps, lectern, two speakers, six folding chairs with a mask on each, a crystal.
     P05-01 The Owl (L4)               LANDMARK: the owl statue (Meshy owl_statue) on its mound with steps, the stone altar, two braziers, an effigy on a bier, a candle line, a crystal. PASS 1: the mound in stone, stair cheeks, ten columns in a horseshoe.
     P03-02 The Fire (L3)              campfire, two folding chairs, torch, meat, a hand saw, a cauldron, a crystal; native: cult leader.
     P04-02 The Stones (L3)            the ritual circle, six menhirs, candle rings, a cauldron, skulls, a torch, the 14-cap fae ring 10.5 m out; native: goatman. PASS 1: two trilithons, eight sarsens.
     P05-02 The Dead Tree (L3)         the dead snag, a stain, a cobweb, two dolls, a crystal. The lookingglass door (Camelot Kingdom's garden) is east.
   STATE (2026-11-16): FIVE PASSES + THE MODEL PASS LIVE (exteriors, interiors, dressing, atmosphere, polish; then the wish-list models: every model this district
   asked for is placed and the stand-ins are out). STOPPED: nothing more here until mondo has seen it (his order).
   KNOWN MISSING / WAITING FOR MONDO
     - NO WAY TO ROOM 333: the plan gives the Stones a hidden way to Room 333. The link woods_ritual still ends on the retired Ritual Ground
       room, so coming through it lands at the Woods' spawn. The same for the link deadtree_lookingglass. A door or a link end is the tool's.
     - THE OLD BOHEMIAN GROVE ROOM (site_prebuilt_bohemian_grove_grove) still stands and is still where its bay door, battle marker, tape and find lead. Its look is
       carried in here; NOT carried (his call / the tool's row): its four talkers and their lines (two politicians, the fortune teller, the conspiracy theorist), the
       room's line, the BATTLE marker, the tape and the find, its ticket booth, telescope and lesson sign, its door to the bay. Retiring the room is his call.
     - The barrow's doorway on the Mound is a look, not a way: nothing is behind it.
     - Every glow is drawn (noLight / glow parts): the room's ten real lights are spoken for. No light shafts, no mist, no sound (no row for them).
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
module.exports = {
    id: 'G', name: 'The Ritual Ground',
    /* the forest mass: the feature trees planted deep in this district's tree squares [kind, height m, chance a deep square] (plots of level 6 up get pines, the tool's rule) */
    wood: ['tree_2', 8, 0.03],
    /* THE TREE ZONES (terrain.gen.zones, the thicket by district) and THE AIR BY DISTRICT (shell.atmos.zones): boxes in plots, zoneOf(x0, y0, x1, y1) */
    treeZones: ctx => [Object.assign(ctx.zoneOf(3, 0, 6, 3), { kinds: ['tree_55', 'tree_55', 'tree_56', 'tree_6', 'tree_55'], treeH: [6.5, 9.5] })],           // dark spruce, a bare one among them
    /* PASS 4: the air by plot (boxes in metres, the district's violet motes last): fireflies over the Lake, warm sparks over the Fire and before the Owl,
       pale spores on the Mound, ash under the Dead Tree. (No `embers` zone: that kind rises from EVERY fire prop in the room, other districts' too.) */
    airZones: ctx => { const { gx } = ctx, B = (c0, r0, c1, r1, o) => Object.assign({ x0: gx(c0), z0: gx(r0), x1: gx(c1), z1: gx(r1) }, o);
        return [B(52, 1, 68, 10, { kind: 'fireflies', n: 110 }), B(37, 25, 44, 32, { kind: 'motes', color: 0xff9a40, n: 46, speed: 1.6 }), B(64, 16, 70, 23, { kind: 'motes', color: 0xffb060, n: 40, speed: 1.4 }),
            B(39, 2, 47, 10, { kind: 'spores', color: 0xc8ffe0, n: 50 }), B(63, 28, 70, 34, { kind: 'ash', n: 70 }),
            Object.assign(ctx.zoneOf(3, 0, 6, 3), { kind: 'motes', color: 0xc8a8ff, n: 300 })]; },
    /* THE DRESSING: the landmark, the set pieces and the natives (ported from the old rooms) */
    dress(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        for (let y = 16; y <= 17; y++) for (let x = 45; x <= 48; x++) taken.add(x + ':' + y); for (let y = 23; y <= 24; y++) for (let x = 65; x <= 68; x++) taken.add(x + ':' + y);   // the Camp House's eight squares (build, pass 2): no old piece lands in it
        { const q = centre('P04-02'), R = 2; put('P04-02', 'ritual_circle', 0, 0, { y: 0.01 });   // THE STONES: six round the circle
          [[-R, -1], [-R, 1], [R, -1], [R, 1], [0, -R], [0, R]].forEach(d => put('P04-02', 'menhir', d[0], d[1])); dec('P04-02', 'candle_ring', 1, 0); put('P04-02', 'cave_torch', -3, 3); }
        put('P03-02', 'campfire', 0, 0); dec('P03-02', 'folding_chair', 1, 1); dec('P03-02', 'folding_chair', -1, 1); put('P03-02', 'cave_torch', 2, -2);
        put('P05-02', 'dead_snag', 0, 0, { h: 12 });   /* pass 3: the plot's landmark stands 12 m (at the catalogue's 4.6 m it was lost among the spruce: seen) */ dec('P05-02', 'floor_stain', 1, 0);                                                                               // THE DEAD TREE
        put('P03-01', 'canvas_tent', 0, 0, { face: 180 }); put('P03-01', 'canvas_tent', 2, 1, { face: 200 }); put('P03-01', 'canvas_tent', -2, 1, { face: 160 });   /* THE MODEL PASS: canvas wall tents (the blue dome tents were modern tents in an old camp) */ dec('P03-01', 'sea_chest', 0, 2); dec('P03-01', 'retro_radio', 1, 2);
        { const q = centre('P04-01');   // THE STAGE: a low timber stage (one level up), steps at its south side
          features.push({ k: 'plateau', x: gx(q[0]), z: gx(q[1] - 1), w: 14, d: 7, h: 1.75, edge: 0.3 }, { k: 'ramp', x0: gx(q[0]), z0: gx(q[1] + 2), x1: gx(q[0]), z1: gx(q[1]), w: 3.5, h0: 0, h1: 1.75, stairs: true, model: 'wood', edge: 0.2 });
          for (let dy = -2; dy <= 1; dy++) for (let dx = -2; dx <= 1; dx++) taken.add((q[0] + dx) + ':' + (q[1] + dy));
          props.push({ key: 'lectern', x: gx(q[0]), z: gc(q[1] - 2), y: 1.75, face: 180 }, { key: 'retro_speakers', x: gc(q[0] - 2), z: gc(q[1] - 2), y: 1.75, face: 180 }, { key: 'retro_speakers', x: gc(q[0] + 1), z: gc(q[1] - 2), y: 1.75, face: 180 });
          [[-2, 3], [-1, 3], [0, 3], [1, 3], [-1, 4], [0, 4]].forEach(d => dec('P04-01', 'folding_chair', d[0], d[1], { face: 0 })); }
        { const q = centre('P05-01');   // THE OWL's mound and altar (the owl statue is a Meshy piece, 2026-11-15)
          features.push({ k: 'plateau', x: gx(q[0]), z: gx(q[1]), w: 7, d: 7, h: 1.75, edge: 0.4 }, { k: 'ramp', x0: gx(q[0]), z0: gx(q[1] + 3), x1: gx(q[0]), z1: gx(q[1] + 1), w: 3.5, h0: 0, h1: 1.75, stairs: true, model: 'forest', edge: 0.2 });
          for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 0; dx++) taken.add((q[0] + dx) + ':' + (q[1] + dy));
          props.push({ key: 'owl_statue', x: gx(q[0]), z: r2(gx(q[1]) - 1.0), y: 1.75, face: 180 }, { key: 'stone_altar', x: gx(q[0]), z: r2(gx(q[1]) + 2.6), y: 1.75, face: 180 },   // THE HORROR PASS: the owl itself (Meshy), the altar at its feet
              { key: 'brazier', x: r2(gx(q[0]) - 2.8), z: r2(gx(q[1]) + 2.6), y: 1.75 }, { key: 'brazier', x: r2(gx(q[0]) + 2.8), z: r2(gx(q[1]) + 2.6), y: 1.75 }); }
        { const q = centre('P03-00'); features.push({ k: 'hill', x: gc(q[0]), z: gc(q[1]), r: 9, h: 2.6 }); props.push({ key: 'wooden_cross', x: gc(q[0]), z: gc(q[1]) }); taken.add(q[0] + ':' + q[1]); }   // THE MOUND
        native('P03-02', 'cult leader', -1, -1, 90); native('P03-01', 'fortune teller', 1, -1, 180); native('P04-02', 'goatman', 3, -2, 240);
    },
    /* THE HORROR PASS (mondo 11-15): it gets worse the farther you walk from the Stair */
    horror(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        hdec('P03-02', 'psx_meat_1', 1, -1, { y: 0.02 }); hdec('P03-02', 'psx_meat_1', -2, 0, { y: 0.02 }); hdec('P03-02', 'psx_hand_saw_1', 2, 1, { y: 0.02 }); hput('P03-02', 'cauldron', -1, 2);
        hdec('P04-02', 'candleRing', -1, 0); hdec('P04-02', 'candleRing', 0, 1); hput('P04-02', 'cauldron', 0, -1); hdec('P04-02', 'skull', 1, 1); hdec('P04-02', 'skull', -1, -1);
        hdec('P05-02', 'psx_cobweb_2', 1, -1, { y: 1.2 }); hdec('P05-02', 'meshy_voodoo_doll', -1, 0); hdec('P05-02', 'meshy_voodoo_doll', 0, 1);
        hdec('P03-01', 'psx_incognito_mask_mp_1', 1, 1, { y: 0.02 }); hdec('P03-01', 'psx_incognito_mask_mp_1', -1, 2, { y: 0.02 }); hdec('P03-01', 'psx_incognito_mask_mp_1', 3, 2, { y: 0.02 });
        { const pl = plot['P04-01'], x0 = gx(pl.x * N), z0 = gx(pl.y * N);   // a mask on every seat facing the stage
          props.slice(0, h0).filter(q => q.key === 'folding_chair' && q.x >= x0 && q.x < x0 + PL && q.z >= z0 && q.z < z0 + PL).forEach(q => props.push({ key: 'psx_incognito_mask_mp_1', x: q.x, z: q.z, y: 0.46, face: q.face || 0 })); }
        { const q = hdec('P05-01', 'decor_effigy_bier', -3, 3, { face: 0 }); if (q) { const b = props[props.length - 1]; props.push({ key: 'decor_effigy_figure', x: b.x, z: b.z, y: 0.55, face: 0 }); } hdec('P05-01', 'candleLine', 2, 3); }
        [[2, 2], [-2, 2], [3, -1]].forEach(d => hdec('P03-00', 'cross', d[0], d[1], { face: 180 })); hput('P03-00', 'trap_coffin_open', -3, -1, { face: 20 }); hdec('P03-00', 'trap_coffin_lid', -2, -2);
        hdec('P04-00', 'railway_lantern', 0, 0); hdec('P04-00', 'railway_lantern', 1, 2); hdec('P05-00', 'candleLine', 0, 0);
    },
    /* THE LIFE PASS (mondo 11-15): this district's own wood, its plants and its small animals */
    life(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        { const q = centre('P04-02'), cx0 = gc(q[0]), cz0 = gc(q[1]);   // THE FAE RING round the Stones (the Fae Ring spell's ring, the Camelot fairy forest's toadstools): violet caps, 10.5 m out, none on a path
          for (let i = 0; i < 14; i++) { const a = i / 14 * 6.2832, x = cx0 + Math.cos(a) * 10.5, z = cz0 + Math.sin(a) * 10.5; if (softAt(Math.floor((x + HALF) / C), Math.floor((z + HALF) / C))) props.push({ key: 'fae_toadstool', x: r2(x), z: r2(z), face: Math.round(90 - a * 57.3), noLight: true }); } }
        [['P04-00', -3, 3], ['P04-00', 2, 4], ['P05-00', -2, 3], ['P05-00', 3, 2], ['P03-00', 3, 3]].forEach(d => hput(d[0], 'fae_mushroom', d[1], d[2], { noLight: true, face: Math.round(rnd() * 360) }));   // the giant caps on the lake shore
        [['P03-01', 3, -2], ['P04-01', 4, 3], ['P05-02', 2, 2], ['P05-01', 3, 3], ['P03-02', -3, -2]].forEach(d => hput(d[0], 'crystal_cluster', d[1], d[2], { noLight: true }));
        DIST('G').forEach((id, i) => { life(id, 'woods_glowcap'); life(id, 'woods_glowcap', { h: 0.5 }); life(id, 'woods_glowcap', { h: 0.9 }); fly(id, i % 2 ? 'luna_moth' : 'hawk_moth', 1.4); });
        ['P04-00', 'P04-00', 'P05-00', 'P05-00', 'P05-00', 'P04-00'].forEach(id => life(id, 'meshy_frog'));
        sow('mushroom2', 14, [54, 18], 58, { h: 0.4, r0: 0.25 }); sow('fern', 20, [54, 18], 58);
    },
    /* THE GROUND (the zone kit; mondo's forest-floor rule): the dark forest sheet, no lawn */
    ground: 'grass_dark_fantasy',
    /* THE CUT (pass 1): the jetty's squares on the Lake's west shore: one dirt square on the bank, four bridge squares out over the water (the tool lays the plank deck) */
    cut(ctx) { const { cell } = ctx; cell[6][52] = 'p'; for (let x = 53; x <= 56; x++) cell[6][x] = 'b';
        for (let y = 16; y <= 17; y++) for (let x = 47; x <= 48; x++) cell[y][x] = 'g';
        for (let y = 23; y <= 24; y++) for (let x = 65; x <= 68; x++) cell[y][x] = 'g'; },   // the model pass: the fallen redwood's eight squares beside the trail from the Owl to the Dead Tree (rows 23 / 24 are plot rims: no clearing middle moves)
    /* (pass 2: the Camp House's east half; its west half stands on the Tents' glade; columns 47 / 48 are a plot's rim, so no plot's clearing middle moves) */
    /* ── THE DISTRICT THREAD'S PASSES (2026-11-16, mondo's order: every district prototyped, at most five passes; docs/plans/DISTRICT_THREAD_BRIEF.md). New work only:
       its own dice, nothing that stands is thrown again. Row ids woods:G:<name>. ── */
    build(ctx) {
        const { cell, N, gx, gc, r2, rnd, features, props, taken, centre, hput, hdec, DIST, ground } = ctx;
        const WD = 'urban:WoodGeneric1b', WD2 = 'urban:WoodGeneric1a', SH = 'urban:WoodGeneric2a', FL = 'urban:WoodFlooring1d', ROCK = 'rocks_5', CLOTH = 'urban:CarpetPlain1c';
        const LOG = 0xcdbb9f, DARK = 0x7d6c58, MOSS = 0x9fb089, STONE = 0xd6d2c4, STONE2 = 0xbcb9aa, RED = 0x7a1f24, BLACK = 0x050505;
        const box = (x, y, z, sw, sh, sd, key, tint, o) => Object.assign({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(sw), r2(sh), r2(sd)], key, tint }, o || {});
        const cyl = (x, y, z, r, h, key, tint, o) => Object.assign({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r: r2(r), h: r2(h), key, tint }, o || {});
        const rock = (x, y, z, r, h, r2_, seg, tint) => cyl(x, y, z, r, h, ROCK, tint, { r2: r2(r2_), seg, uv: [3.5, 3.5], gain: 1.5 });
        const free = (cx, cy) => /[gsr]/.test(cell[cy][cx]) && !taken.has(cx + ':' + cy), take = (cx, cy) => taken.add(cx + ':' + cy);
        /* ═══ PASS 1 · THE EXTERIORS ═══ */
        /* THE STAGE (P04-01): the old grass block becomes a timber band shell: a boarded deck and skirt, a plank back wall with a red cloth, side wings, six posts
           under a mossy gable roof, footlights. The front is the south (the seats, the steps). Rails on the back and the sides keep the walker on the deck. */
        { const q = centre('P04-01'), ox = gx(q[0]), oz = gx(q[1] - 1), y0 = r2(ground(ox, oz)), T = 1.75, H = 5.4;
          const parts = [
              box(0, T, 0, 14.16, 0.08, 7.16, FL, 0xc9b9a0, { uv: [1.75, 1.75] }),                                                         // the deck's boards
              box(0, 0, 0, 14.2, T + 0.04, 7.2, WD, LOG, { faces: 'blr', top: false, uv: [3.5, 1.75], gain: 1.3 }),                        // the skirt: back and sides
              box(-4.4, 0, 3.56, 5.3, T + 0.04, 0.08, WD, LOG, { faces: 'f', top: false, uv: [3.5, 1.75], gain: 1.3 }), box(4.4, 0, 3.56, 5.3, T + 0.04, 0.08, WD, LOG, { faces: 'f', top: false, uv: [3.5, 1.75], gain: 1.3 }),   // the front skirt, left and right of the steps
              box(0, T, -3.38, 14.0, H, 0.22, WD, LOG, { uv: [3.5, 1.75], gain: 1.3 }),                                                    // the back wall
              box(0, T + 0.5, -3.22, 8.6, 4.3, 0.06, CLOTH, RED, { faces: 'f', top: false }),                                              // the red cloth
              box(0, T + 4.8, -3.2, 9.2, 0.16, 0.12, WD2, DARK),                                                                            // its pole
              box(-6.9, T, -1.7, 0.2, H, 3.4, WD, LOG, { uv: [3.5, 1.75], gain: 1.3 }), box(6.9, T, -1.7, 0.2, H, 3.4, WD, LOG, { uv: [3.5, 1.75], gain: 1.3 }),   // the wings
              ...[-6.85, 6.85].flatMap(x => [box(x, 0, 3.3, 0.34, T + H, 0.34, WD2, DARK), box(x, T, -3.2, 0.34, H, 0.34, WD2, DARK)]),   // the four corner posts (the front ones stand on the ground; none in the middle: the steps and the cloth stay clear)
              box(0, T + H - 0.3, 3.3, 14.2, 0.3, 0.3, WD2, DARK), box(-6.85, T + H - 0.3, 0, 0.3, 0.3, 6.8, WD2, DARK), box(6.85, T + H - 0.3, 0, 0.3, 0.3, 6.8, WD2, DARK), box(0, T + H - 0.3, 0, 0.3, 0.3, 6.8, WD2, DARK),   // the beams
              { s: 'roof', form: 'gable', p: [0, T + H, 0], size: [15.2, 2.4, 8.0], key: SH, tint: MOSS, keyEnd: WD, tintEnd: LOG, over: 0.5, roof: true },
          ];
          features.push({ k: 'arch', id: 'woods:G:stage', x: ox, z: oz, y: y0, parts });
          features.push({ k: 'rail', x0: r2(ox - 6.6), z0: r2(oz - 3.0), x1: r2(ox + 6.6), z1: r2(oz - 3.0), model: 'ranch' }, { k: 'rail', x0: r2(ox - 6.6), z0: r2(oz - 3.0), x1: r2(ox - 6.6), z1: r2(oz + 3.0), model: 'ranch' }, { k: 'rail', x0: r2(ox + 6.6), z0: r2(oz - 3.0), x1: r2(ox + 6.6), z1: r2(oz + 3.0), model: 'ranch' }); }
        /* THE OWL (P05-01): the mound is dressed stone, stone cheeks flank the steps, ten columns stand in a horseshoe behind the owl (blockers, each on its own square) */
        { const q = centre('P05-01'), ox = gx(q[0]), oz = gx(q[1]), y0 = r2(ground(ox, oz)), T = 1.75;
          const parts = [
              box(0, 0, 0, 7.14, T + 0.05, 7.14, ROCK, STONE, { faces: 'blr', uv: [3.5, 3.5] }),
              box(-2.66, 0, 3.58, 1.84, T + 0.05, 0.08, ROCK, STONE, { faces: 'f', top: false, uv: [3.5, 3.5] }), box(2.66, 0, 3.58, 1.84, T + 0.05, 0.08, ROCK, STONE, { faces: 'f', top: false, uv: [3.5, 3.5] }),
              ...[-1, 1].flatMap(sd => [box(sd * 2.2, 0, 5.25, 0.8, 1.5, 3.5, ROCK, STONE2, { uv: [1.75, 1.75] }), box(sd * 2.2, 0, 8.75, 0.8, 0.75, 3.5, ROCK, STONE2, { uv: [1.75, 1.75] }),
                  cyl(sd * 2.2, 1.5, 4.2, 0.5, 0.5, ROCK, STONE, { r2: 0.32, seg: 6, uv: [1.75, 1.75] })]),                                 // the stair cheeks and their end stones
              ...[-1, 1].flatMap(sd => [0, 1, 2].map(k => rock(sd * (4.3 + rnd() * 0.5), -0.3, -2.6 + k * 2.6 + rnd(), 0.9 + rnd() * 0.5, 0.9 + rnd() * 0.7, 0.4, 5 + k % 2, k % 2 ? STONE : STONE2))),   // boulders at the mound's foot
          ];
          features.push({ k: 'arch', id: 'woods:G:owl', x: ox, z: oz, y: y0, parts });
          [[66, 16], [67, 16], [65, 17], [68, 17], [64, 18], [69, 18], [64, 19], [69, 19], [65, 20], [68, 20]].forEach(c => { if (!free(c[0], c[1])) return; take(c[0], c[1]); props.push({ key: 'greek_column', x: gc(c[0]), z: gc(c[1]), h: 4.6 }); }); }
        /* THE JETTY (P04-00, the Lake's west shore; the squares are cut above): mooring posts down both sides of the tool's plank deck, a lamp post at its head, a rowboat */
        { const x0 = gx(53) - 1.75, x1 = gx(57) + 1.75, oz = gc(6), ox = r2((x0 + x1) / 2), y0 = r2(ground(gx(52), oz)), L = x1 - x0, parts = [];
          for (let k = 0; k <= 5; k++) for (const sd of [-1, 1]) parts.push(box(-L / 2 + 0.3 + k * (L - 0.6) / 5, -1.6, sd * 1.9, 0.26, 2.5 + (k % 2) * 0.25, 0.26, WD2, DARK));
          parts.push(box(0, 0.86, -1.9, L - 0.6, 0.1, 0.12, WD2, DARK));                                                 // one rail, the lamp post, its arm and its lamp (drawn glow, no light)
          features.push({ k: 'arch', id: 'woods:G:jetty', x: ox, z: oz, y: y0, parts });
          props.push({ key: 'rowboat', x: r2(gx(55)), z: r2(oz + 3.6), y: r2(y0 - 0.42), floor: true, face: 80 }); }   /* pass 5: a height from the room's floor (the water's top is 0.3 m under the bank): as a lift of -0.25 it stood on the lake's BED, under water (seen) */
        /* THE BARROW (P03-00, the Mound): a stone doorway in the hill's south face (two uprights, a lintel, blackness), boulders heaped on its shoulders, kerb stones round the foot */
        { const q = centre('P03-00'), ox = gc(q[0]), oz = gc(q[1]), y0 = r2(ground(ox, oz)), parts = [];
          parts.push(box(0, 0, 5.6, 2.3, 2.3, 2.4, null, BLACK, { top: false }), box(0, 2.3, 5.6, 2.3, 0.05, 2.4, null, BLACK),
              rock(-1.5, -0.3, 6.9, 0.7, 2.9, 0.5, 5, STONE), rock(1.5, -0.3, 6.9, 0.7, 2.9, 0.5, 5, STONE2), box(0, 2.45, 6.9, 4.6, 0.7, 1.3, ROCK, STONE, { uv: [3.5, 3.5] }),
              rock(-2.7, -0.3, 6.1, 1.2, 2.3, 0.6, 7, STONE2), rock(2.7, -0.3, 6.1, 1.2, 2.3, 0.6, 7, STONE), rock(-1.1, 2.3, 5.6, 1.0, 0.8, 0.45, 7, STONE2), rock(1.2, 2.3, 5.5, 1.1, 0.7, 0.5, 6, STONE));   // pass 5: smaller (the first heap covered the hill's top in grey blocks: seen)
          for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832 + 0.2, x = Math.cos(a) * 9.4, z = Math.sin(a) * 9.4, cx = Math.floor((ox + x + 126) / 3.5), cy = Math.floor((oz + z + 126) / 3.5);
              if (Math.abs(x) < 3.6 && z > 0) continue; if (!/[gsr]/.test(cell[cy][cx])) continue;
              parts.push(rock(x, r2(ground(ox + x, oz + z) - y0 - 0.3), z, 0.7 + rnd() * 0.4, 0.8 + rnd() * 0.6, 0.35, 5 + k % 2, k % 2 ? STONE : STONE2)); }
          features.push({ k: 'arch', id: 'woods:G:barrow', x: ox, z: oz, y: y0, parts }); }
        /* THE STONES (P04-02): two trilithons (north and south of the circle, each on two whole squares) and an outer ring of tall sarsens */
        { const q = centre('P04-02');
          [[-1, -3, 0], [-1, 3, 180]].forEach(d => { const a = [q[0] + d[0], q[1] + d[1]], b = [a[0] + 1, a[1]]; if (!free(a[0], a[1]) || !free(b[0], b[1])) return; take(a[0], a[1]); take(b[0], b[1]);
              props.push({ key: 'trilithon', x: gx(b[0]), z: gc(a[1]), face: d[2] }); });
          [[-4, -1], [4, -1], [-4, 2], [4, 2], [-3, -3], [3, -3], [-3, 4], [3, 4]].forEach((d, i) => hput('P04-02', 'sarsen', d[0], d[1], { h: 3.8 + (i % 3) * 0.5, face: i * 47 })); }
        /* ═══ PASS 2 · THE INTERIORS ═══ */
        /* THE CAMP HOUSE (between the Tents and the Stage, room squares 45..48 x 16..17, its front south on the path): the members' hall, a walk-in building made the
           city's way (the Woods' cabin in districts/M.js is the pattern) = one hollow texbuilding (the walls you bump into, the doorway, the swinging leaf) + one arch
           row for the look. 4 squares along the front x 2 deep. Row frame = room frame (rot 0): +x east, +z out of the front. Inside: a hearth and two armchairs at
           the west end, the feast table down the east half with a throne at its head, a bar, the robes, the masks. Every lit piece is noLight / drawn glow. */
        { const cx = gx(47), cz = gx(17), w = 14, d = 7, H = 3.5, E = 0.05, GL = 'urban:GlassWindowTall1a';
          features.push({ k: 'texbuilding', id: 'woods:G:camphouse', x: cx, z: cz, w, d, rot: 0, storeys: 1, seed: 1, skin: false, hollow: true, leaf: 'leaf_shabby_wood', keyIn: WD2, floorIn: FL });
          const L = w - 0.12, cols = Math.round(L / 1.75), cw = L / cols, lx = r2(-L / 2 + (Math.floor((cols - 1) / 2) + 0.5) * cw);   // data.js hqTexbDoor: the doorway's middle along the front
          const win = (x) => [box(x, 0.85, d / 2 + 0.06, 1.7, 1.9, 0.08, GL, 0x39424a, { uv: 'fit', faces: 'f', top: false }), box(x, 0.72, d / 2 + 0.12, 2.0, 0.14, 0.14, WD2, DARK), box(x, 2.75, d / 2 + 0.12, 2.0, 0.14, 0.14, WD2, DARK),
              box(x - 0.93, 0.85, d / 2 + 0.12, 0.14, 1.9, 0.14, WD2, DARK), box(x + 0.93, 0.85, d / 2 + 0.12, 0.14, 1.9, 0.14, WD2, DARK), box(x, 0.85, d / 2 + 0.11, 0.08, 1.9, 0.08, WD2, DARK)];
          const parts = [
              box(0, 0, 0, w + 2 * E, H, d + 2 * E, WD, LOG, { faces: 'blr', top: false, uv: [3.5, 1.75], gain: 1.5 }),
              { s: 'quad', p: [0, 0, r2(d / 2 + E)], size: [r2(w + 2 * E), H], key: WD, tint: LOG, uv: [3.5, 1.75], gain: 1.5, hole: [lx, r2(cw), 2.2] },
              { s: 'roof', form: 'gable', p: [0, H, 0], size: [w + 1.4, 3.6, d + 1.2], key: SH, tint: MOSS, keyEnd: WD, tintEnd: LOG, over: 0.5, roof: true },
              ...[[-w / 2, d / 2], [w / 2, d / 2], [-w / 2, -d / 2], [w / 2, -d / 2]].map(q => box(q[0], 0, q[1], 0.44, H, 0.44, WD2, DARK)),
              box(0, 0, d / 2 + 0.08, w + 0.3, 0.3, 0.2, WD2, DARK), box(0, H - 0.28, d / 2 + 0.08, w + 0.3, 0.28, 0.2, WD2, DARK),
              box(lx - cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.35, 0.2, WD2, DARK), box(lx + cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.35, 0.2, WD2, DARK), box(lx, 2.2, d / 2 + 0.1, cw + 0.4, 0.2, 0.2, WD2, DARK),
              ...win(-4.6), ...win(2.7), ...win(5.3),                                                                                       // three tall dark windows on the front
              { s: 'roof', form: 'shed', p: [lx, 2.5, r2(d / 2 + 0.7)], size: [3.0, 0.6, 1.4], key: SH, tint: MOSS, roof: true },           // the hood over the door, on two brackets (no posts: the path is whole)
              box(lx - 1.3, 1.9, d / 2 + 0.35, 0.12, 0.6, 0.7, WD2, DARK), box(lx + 1.3, 1.9, d / 2 + 0.35, 0.12, 0.6, 0.7, WD2, DARK),
              box(-w / 2 - 0.6, 0, 0, 1.2, 8.2, 2.0, ROCK, STONE, { roof: true, uv: [1.75, 1.75], gain: 1.4 }),                             // the stone chimney up the west end
              /* the inside */
              box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FL, 0xc9b9a0, { uv: [1.75, 1.75] }),                                                    // a real board slab
              box(0, H - 0.62, 0, w - 0.5, 0.05, d - 0.5, WD, 0xe8dcc0, { uv: [3.5, 1.75], glow: 0.7, under: true, roof: true }),           // the lit plank ceiling under the building's own
              /* a lit board lining on the four walls (the hollow building's own inside draws near black): back, east, west beside the hearth, the front left and right of the door */
              box(0, 1.16, -d / 2 + 0.34, w - 0.6, H - 1.78, 0.04, WD, 0xd9c9aa, { faces: 'f', top: false, uv: [3.5, 1.75], glow: 0.4 }), box(w / 2 - 0.34, 1.16, 0, 0.04, H - 1.78, d - 0.6, WD, 0xd9c9aa, { faces: 'l', top: false, uv: [3.5, 1.75], glow: 0.4 }),
              box(-w / 2 + 0.34, 0.16, -2.35, 0.04, H - 0.78, 1.9, WD, 0xd9c9aa, { faces: 'r', top: false, uv: [3.5, 1.75], glow: 0.4 }), box(-w / 2 + 0.34, 0.16, 2.35, 0.04, H - 0.78, 1.9, WD, 0xd9c9aa, { faces: 'r', top: false, uv: [3.5, 1.75], glow: 0.4 }),
              box((-w / 2 + lx - cw / 2) / 2, 0.16, d / 2 - 0.34, lx - cw / 2 + w / 2 - 0.6, H - 0.78, 0.04, WD, 0xd9c9aa, { faces: 'b', top: false, uv: [3.5, 1.75], glow: 0.4 }), box((w / 2 + lx + cw / 2) / 2, 0.16, d / 2 - 0.34, w / 2 - lx - cw / 2 - 0.6, H - 0.78, 0.04, WD, 0xd9c9aa, { faces: 'b', top: false, uv: [3.5, 1.75], glow: 0.4 }),
              ...[-4.6, 2.7, 5.3].map(x => box(x, 0.95, d / 2 - 0.37, 1.6, 1.7, 0.04, GL, 0x56646e, { uv: 'fit', faces: 'b', top: false, glow: 0.35 })),   // the three windows seen from inside
              box(-5.25, H - 0.88, 0, 0.26, 0.28, d - 0.5, WD2, DARK, { n: 4, step: [3.5, 0, 0], roof: true }), box(0, H - 0.92, 0, w - 0.5, 0.2, 0.22, WD2, DARK, { roof: true }),
              box(0, 0.16, -d / 2 + 0.3, w - 0.6, 1.0, 0.05, WD2, 0xa89478, { uv: [1.75, 1.0] }), box(w / 2 - 0.3, 0.16, 0, 0.05, 1.0, d - 0.6, WD2, 0xa89478, { uv: [1.75, 1.0] }),   // a boarded dado
              box(-w / 2 + 0.75, 0.16, 0, 1.0, 1.6, 2.6, ROCK, STONE, { uv: [1.75, 1.75], gain: 1.4 }), box(-w / 2 + 0.8, 1.76, 0, 1.2, 0.16, 3.0, WD2, DARK),   // the hearth and its mantel
              box(-w / 2 + 1.0, 0.16, 0, 0.56, 0.9, 1.3, null, BLACK), box(-w / 2 + 1.2, 0.2, 0, 0.3, 0.24, 0.8, null, 0xff7a20, { glow: 1 }),
              box(-w / 2 + 0.75, 1.92, 0, 0.9, H - 2.54, 1.8, ROCK, STONE2, { uv: [1.75, 1.75], gain: 1.4 }),                               // the breast up to the ceiling
              box(4.6, 0.16, 2.55, 4.2, 1.02, 0.6, WD, 0xb89a78, { uv: [1.75, 1.0] }), box(4.6, 1.18, 2.5, 4.4, 0.06, 0.8, WD2, DARK),      // the bar and its top
              box(4.6, 1.5, d / 2 - 0.52, 4.0, 0.05, 0.3, WD2, DARK), box(4.6, 2.0, d / 2 - 0.52, 4.0, 0.05, 0.3, WD2, DARK),                 // two shelves behind it
              box(lx, 0.165, d / 2 - 1.0, 1.5, 0.02, 0.9, CLOTH, 0x7a4a3a, { sides: false }),
          ];
          features.push({ k: 'arch', id: 'woods:G:camphouse:arch', x: cx, z: cz, parts });
          const F = 0.16, Y0 = r2(ground(cx, cz)), inP = (key, rx, rz, o) => { const p = Object.assign({ key, x: r2(cx + rx), z: r2(cz + rz), floor: true }, o || {}); if (p.y >= 1) p.y = r2(p.y + Y0); props.push(p); };   // a prop's y of 1 m or more is a height from the ROOM's floor, not a lift (three-renderer.js THE TIER HEIGHT): on this 7 m ground the table's food lay on the boards.   // floor: true = the room's ground (without it a prop beside a wall stands on the wall's TOP: seen, the mantel's skull and the shelf bottles were on the roof)
          inP('psx_armchair_1', -4.4, -1.3, { face: 250, y: F }); inP('psx_armchair_2', -4.4, 1.3, { face: 290, y: F }); 
          inP('skull', -6.15, -0.9, { y: 1.93, face: 90 }); inP('hw_candles', -6.15, 0.9, { y: 1.93, noLight: true }); inP('bird_cage', -6.2, 2.7, { y: F }); inP('wooden_bucket', -5.7, -2.2, { y: F });
          inP('psx_carpet_mp_1', 1.1, -0.5, { y: F + 0.01 }); inP('psx_carpet_mp_1', 4.2, -0.5, { y: F + 0.01 });   // (holy_carpet is a standing tapestry 6 m tall: seen filling the room, taken out)
          inP('trestle_table', 1.4, -0.5, { y: F, face: 0, span: 2.3 }); inP('trestle_table', 3.8, -0.5, { y: F, face: 0, span: 2.3 });                                                                              // THE MODEL PASS: the `trestle_table` with its two benches (was three pack tables and eight stools); two at span 2.3: at its listed 3.5 m the model's top stands 1.22 m up (seen)
          inP('royal_throne', 6.0, -0.5, { y: F, face: 270 });
          const TT = F + 0.8;   // the trestle's top inP('xmas_turkey', 2.6, -0.5, { y: TT }); inP('xmas_roast', 1.2, -0.45, { y: TT }); inP('xmas_punch', 3.9, -0.55, { y: TT }); inP('xmas_champagne', 1.0, -0.7, { y: TT }); inP('xmas_champagne', 4.2, -0.3, { y: TT });
          [[0.9, -0.85], [1.9, -0.15], [3.2, -0.85], [4.3, -0.15]].forEach(q => inP('psx_plate_mp_1', q[0], q[1], { y: TT })); [[1.6, -0.8], [3.5, -0.2], [2.2, -0.2]].forEach(q => inP('item_drinking_cup', q[0], q[1], { y: TT }));
          inP('hw_candles', 2.0, -0.5, { y: TT, noLight: true }); inP('hw_candles_2', 3.4, -0.5, { y: TT, noLight: true });
          inP('candelabra', -0.4, -0.5, { y: F, noLight: true }); inP('candelabra', 6.3, 1.0, { y: F, noLight: true });
          inP('costume_rack', -2.2, -2.85, { y: F, face: 0 }); inP('psx_display_cabinet_mp_1', 0.4, -3.0, { y: F, face: 0 }); inP('psx_shelf_mp_3', 2.6, -3.05, { y: F, face: 0 }); inP('taiko_drum', 5.6, -2.6, { y: F });
          [-3.9, -3.4, -2.9].forEach(x => inP('psx_incognito_mask_mp_1', x + 6.4, -3.1, { y: 2.2, face: 0 }));                              // masks hung on the back wall over the cabinet
          inP('psx_painting_1', -3.6, -3.1, { y: 1.9, face: 0 }); inP('psx_painting_1', 6.6, -1.9, { y: 1.9, face: 270 });
          inP('psx_glass_bottle_1', 3.2, 2.5, { y: F + 1.09 }); inP('psx_glass_bottle_2', 3.6, 2.6, { y: F + 1.09 }); inP('crystalBall', 5.4, 2.5, { y: F + 1.09 }); inP('tarotDeck', 5.0, 2.45, { y: F + 1.09 }); inP('item_drinking_cup', 4.3, 2.4, { y: F + 1.09 });
          [3.2, 3.7, 4.4, 5.6].forEach((x, i) => inP(i % 2 ? 'psx_glass_bottle_2' : 'psx_glass_bottle_1', x, d / 2 - 0.52, { y: 1.56 })); [3.5, 4.9, 5.9].forEach(x => inP('xmas_champagne', x, d / 2 - 0.52, { y: 2.06 }));
          inP('psx_wooden_crate_2', 6.3, 2.2, { y: F }); inP('wooden_barrel', -2.6, 2.8, { y: F }); inP('wooden_barrel', -3.5, 2.75, { y: F });
          inP('psx_ceiling_lamp_1_on', -3.5, 0, { y: 2.42, noLight: true }); inP('psx_ceiling_lamp_1_on', 2.6, -0.5, { y: 2.42, noLight: true });
          inP('psx_cobweb_1', 6.5, -3.0, { y: 2.4 }); inP('railway_lantern', lx - 2.2, d / 2 + 0.5, { noLight: true }); }
        /* ═══ PASS 3 · THE DRESSING ═══ (catalogue pieces only; the model list read end to end first: areas-complexes.md "THE RITUAL GROUND", FITS THIS DISTRICT)
           sq = a blocker on a free square's middle (skipped when the square is not free); sm = a small thing at a spot in metres, only on open ground that is no
           path (so nothing lands on a trail); up = a height for a piece that sits ON something (1 m or more is a height from the room's floor, so the ground is added) */
        { const cellAt = (x, z) => { const cx = Math.floor((x + 126) / 3.5), cy = Math.floor((z + 126) / 3.5); return cy >= 0 && cy < 36 && cx >= 36 && cx < 72 ? cell[cy][cx] : 't'; };
          const sq = (key, cx, cy, o) => { if (!free(cx, cy)) return false; take(cx, cy); props.push(Object.assign({ key, x: gc(cx), z: gc(cy) }, o || {})); return true; };
          const sm = (key, x, z, o) => { if (!/[gsr]/.test(cellAt(x, z)) && !(o && o.any)) return false; const p = Object.assign({ key, x: r2(x), z: r2(z) }, o || {}); delete p.any; props.push(p); return true; };
          const up = (x, z, lift, extra) => r2(ground(x, z) + lift + (extra || 0));
          /* THE MOUND: a burial ground on the hill: stones, fresh graves, one rising, a coffin and a skull pile at the barrow's door, candles, crows */
          { const q = centre('P03-00'), ox = gc(q[0]), oz = gc(q[1]); take(43, 7); take(43, 8);
            [[41, 5, 'psxg_tombstone_1', 350], [44, 5, 'psxg_tombstone_2', 10], [45, 7, 'psxg_tombstone_3', 20], [41, 7, 'hw_grave', 340], [45, 4, 'psxg_tombstone_1', 0], [40, 6, 'hw_grave_low', 80]].forEach(t => {
                if (sq(t[2], t[0], t[1], { face: t[3] })) sm('psxg_dirt_grave', gc(t[0]) + 0.1, gc(t[1]) + 1.25, { face: t[3], y: 0.02 }); });
            sm('hw_body_rising', gc(44) + 0.2, gc(5) + 1.3, { face: 200 }); sm('hw_shovel', gc(41) + 0.9, gc(7) + 1.0, { face: 40, y: 0.03 }); sq('psxg_coffin', 42, 8, { face: 25 }); sq('skull_pile', 44, 8);
            sm('hw_candles', ox - 2.0, oz + 7.5, { noLight: true }); sm('hw_candles_2', ox + 2.1, oz + 7.6, { noLight: true }); sm('skull', ox + 0.9, oz + 7.9, { face: 200 });
            sm('crow', ox + 1.2, oz + 6.9, { y: up(ox, oz, 3.2), floor: true, face: 160 }); sm('crow', gc(41), gc(5), { y: up(gc(41), gc(5), 1.2, 1.4), floor: true, face: 90 }); }
          /* THE LAKE, WEST: the jetty's end of the shore: a bench, a signpost, traps and a bucket, a fish on the boards; rocks along the water */
          { sq('park_bench', 51, 5, { face: 90 }); sq('signpost', 53, 7, { face: 90 }); sm('lobster_traps', gc(50) + 0.6, gc(6) - 0.9, { face: 30 }); sm('wooden_bucket', gc(51) - 0.4, gc(6) + 1.0);
            props.push({ key: 'psx_fish_skeleton_mp_1', x: r2(gx(55) + 0.4), z: r2(gc(6) + 0.8), y: 0.33, face: 70 }, { key: 'wooden_bucket', x: r2(gx(56) + 1.2), z: r2(gc(6) - 0.9), y: 0.31 }, { key: 'meshy_rope', x: r2(gx(54)), z: r2(gc(6) - 1.0), y: 0.32, face: 10 });
            sm('fallen_log', gc(51), gc(9), { face: 70 }); }
          /* THE LAKE, EAST: pews turned to the water, urns, a votive stand; out on the lake the effigy lies in a boat among candles */
          { sq('church_pew', 66, 7, { face: 270 }); sq('church_pew', 67, 6, { face: 270 }); sq('votive_stand', 65, 3, { noLight: true }); sm('stone_urn', gc(66) - 1.2, gc(3) + 0.9); sm('stone_urn', gc(67) + 0.8, gc(7) + 1.1);
            const bx = gx(61), bz = gc(5), wy = r2(ground(bx, bz) - 0.42); props.push({ key: 'rowboat', x: bx, z: bz, y: wy, floor: true, face: 100 }, { key: 'decor_effigy_figure', x: bx, z: bz, y: r2(wy + 0.3), floor: true, face: 100 },
                { key: 'hw_candles', x: r2(bx + 0.9), z: r2(bz + 0.2), y: r2(wy + 0.3), floor: true, noLight: true }, { key: 'hw_candles_2', x: r2(bx - 0.9), z: r2(bz - 0.2), y: r2(wy + 0.3), floor: true, noLight: true }); }   // pass 5: on the water, not on the bed
          { const cxl = gx(60), czl = gc(5); for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832 + 0.1, x = cxl + Math.cos(a) * (22.6 + (k % 3) * 0.7), z = czl + Math.sin(a) * (14.6 + (k % 2) * 0.8);   // rocks and dead bushes round the shore, only on grass
                sm(k % 3 === 2 ? 'psxg_dead_bush_' + (1 + k % 2) : 'psxg_rock_' + (1 + k % 4), x, z, { face: k * 53 % 360 }); } }
          /* THE TENTS: the fortune teller's own tent, a covered wagon on two squares, crates, barrels, pots, straw, lanterns */
          { sq('fortune_teller_tent', 42, 15, { face: 180 }); sm('psx_carpet_mp_1', gc(42), gc(16) - 0.2, { y: 0.02 }); sm('crystalBall', gc(42) + 0.5, gc(16) - 0.6, { y: 0.05 }); sm('tarotDeck', gc(42) - 0.3, gc(16) - 0.4, { y: 0.04 });
            if (free(43, 20) && free(44, 20)) { take(43, 20); take(44, 20); props.push({ key: 'covered_wagon', x: gx(44), z: gc(20), face: 0 }); }
            sq('psx_wooden_crate_2', 44, 14); sm('psx_wooden_crate_1', gc(44) - 1.2, gc(14) + 0.9); sq('hw_straw', 41, 16, { face: 90 }); sm('psx_metal_barrel_mp_1', gc(40) + 0.9, gc(16) - 0.8); sm('psx_metal_barrel_mp_2', gc(40) + 0.2, gc(17) + 0.7);
            sm('stock_pots', gc(43) - 0.8, gc(16) + 0.6); sm('railway_lantern', gc(42) + 1.2, gc(18) - 0.9, { noLight: true }); sm('wooden_bucket', gc(41) + 0.8, gc(19) - 0.6); sm('cat', gc(45) + 0.6, gc(19) + 0.9, { face: 200 }); }
          /* THE STAGE: the band's gear on the deck, two followspots and four pews on the grass, rope posts at the steps */
          { const q = centre('P04-01'), ox = gx(q[0]), oz = gx(q[1] - 1);
            props.push({ key: 'drum_kit', x: r2(ox + 3.6), z: r2(oz - 1.4), face: 180 }, { key: 'pa_speaker', x: r2(ox - 5.3), z: r2(oz + 2.3), face: 180 }, { key: 'pa_speaker', x: r2(ox + 5.3), z: r2(oz + 2.3), face: 180 },
                { key: 'music_stand', x: r2(ox - 3.0), z: r2(oz - 0.4), face: 180 }, { key: 'music_stand', x: r2(ox - 4.4), z: r2(oz - 1.0), face: 200 }, { key: 'instrument_harp', x: r2(ox - 4.2), z: r2(oz - 1.9), face: 150 }, { key: 'taiko_drum', x: r2(ox + 1.2), z: r2(oz - 1.8), face: 180 });
            sq('followspot', 51, 16, { face: 60 }); sq('followspot', 58, 16, { face: 300 });
            [[51, 19], [52, 19], [55, 19], [56, 19]].forEach(c => sq('church_pew', c[0], c[1], { face: 0 }));
            [-2.5, 2.5].forEach(dx => { sm('rope_stanchion', ox + dx, gx(q[1] + 2) + 0.5); sm('rope_stanchion', ox + dx, gx(q[1] + 2) + 2.4); }); }
          /* THE OWL: the altar is laid (a book, candles, a skull, a censer), drums either side, urns and votive stands at the steps, candles at the columns' feet */
          { const q = centre('P05-01'), ox = gx(q[0]), oz = gx(q[1]), az = r2(oz + 2.6);
            props.push({ key: 'psx_open_book_mp_1', x: ox, z: az, y: 0.97, face: 180 }, { key: 'hw_candles', x: r2(ox - 0.75), z: az, y: 0.97, noLight: true }, { key: 'hw_candles_2', x: r2(ox + 0.75), z: az, y: 0.97, noLight: true },
                { key: 'skull', x: r2(ox + 0.35), z: r2(az + 0.25), y: 0.97, face: 200 }, { key: 'item_censer', x: r2(ox - 0.4), z: r2(az + 0.25), y: 0.97 });
            sq('taiko_drum', 65, 18); sq('taiko_drum', 68, 18); sm('stone_urn', ox - 3.1, oz + 10.9); sm('stone_urn', ox + 3.1, oz + 10.9); sm('votive_stand', ox - 3.3, oz + 7.3, { noLight: true }); sm('votive_stand', ox + 3.3, oz + 7.3, { noLight: true });
            sm('candleRing', ox, oz + 12.2, { noLight: true });
            [[66, 16], [67, 16], [65, 17], [68, 17], [64, 19], [69, 19]].forEach((c, k) => sm(k % 2 ? 'hw_candles' : 'hw_candles_2', gc(c[0]) + (k % 2 ? 0.7 : -0.7), gc(c[1]) + 0.75, { noLight: true })); }
          /* THE FIRE: log seats round the fire, the big tent on four squares, a drum, a cooler, cups, bottles, pots, crates, straw */
          { sq('fallen_log', 40, 27, { face: 0 }); sq('fallen_log', 39, 28, { face: 90 }); sq('fallen_log', 41, 28, { face: 90 });
            if (free(42, 27) && free(43, 27) && free(42, 28) && free(43, 28)) { [[42, 27], [43, 27], [42, 28], [43, 28]].forEach(c => take(c[0], c[1])); props.push({ key: 'carnival_tent', x: gx(43), z: gx(28), face: 270 }); }
            sq('taiko_drum', 41, 30); sq('stump', 38, 29); sq('psx_wooden_crate_2', 37, 27); sq('hw_straw', 38, 27, { face: 20 });
            sm('beach_cooler', gc(40) + 1.1, gc(29) + 0.9, { face: 30 }); [[39, 27, 0.9, 1.1], [41, 29, -0.9, 0.8], [40, 29, 0.2, 1.3]].forEach(c => sm('solo_cup', gc(c[0]) + c[2], gc(c[1]) + c[3], { y: 0.02 }));
            sm('psx_glass_bottle_1', gc(39) - 0.9, gc(28) + 1.2, { y: 0.02 }); sm('psx_glass_bottle_2', gc(41) + 1.0, gc(28) - 1.2, { y: 0.02 }); sm('stock_pots', gc(40) - 1.2, gc(26) + 0.4); sm('psx_knife_mp_1', gc(40) + 0.7, gc(26) + 0.9, { y: 0.03 }); }
          /* THE STONES: a candle at every menhir's foot, ward totems at the four quarters, the stocks, what was left on the ground */
          { const q = centre('P04-02'), ox = gc(q[0]), oz = gc(q[1]);
            [[-2, -1], [-2, 1], [2, -1], [2, 1], [0, -2], [0, 2]].forEach((d, k) => { const l = Math.hypot(d[0], d[1]); sm(k % 2 ? 'hw_candles' : 'hw_candles_2', ox + d[0] * 3.5 * (1 - 1.3 / (l * 3.5)), oz + d[1] * 3.5 * (1 - 1.3 / (l * 3.5)), { noLight: true }); });
            sq('item_ward_totem', 53, 26); sq('item_ward_totem', 55, 34); sq('item_ward_totem', 50, 30); sq('item_ward_totem', 58, 30); sq('stocks', 51, 28, { face: 120 });
            sm('hw_body', ox + 0.9, oz + 0.3, { face: 70, y: 0.03 }); sm('hw_part_1', ox - 1.4, oz + 1.2, { y: 0.03 }); sm('hw_part_3', ox + 1.5, oz - 1.3, { y: 0.03 }); sm('psx_butcher_knife_mp_1', ox + 0.2, oz + 1.1, { y: 0.04, face: 40 });
            sm('crow', gc(52), gc(29), { y: up(gc(52), gc(29), 3.3), floor: true, face: 100 }); sm('crow', gc(56), gc(31), { y: up(gc(56), gc(31), 3.3), floor: true, face: 280 }); sm('wolf', gc(57) + 0.5, gc(32) + 0.6, { face: 300 }); }
          /* THE DEAD TREE: stones and a scarecrow under the snag, cages, a body, webs, dead bushes, crows */
          { sq('psxg_tombstone_3', 65, 29, { face: 170 }); sq('hw_grave', 67, 29, { face: 190 }); sq('hw_scarecrow', 64, 30, { face: 100 }); sq('hw_scarecrow_2', 68, 30, { face: 250 });
            sm('bird_cage', gc(65) + 0.9, gc(30) + 0.8); sm('bird_cage', gc(67) - 0.2, gc(33) - 0.6, { face: 40 }); sm('hw_body_2', gc(65) - 0.5, gc(32) + 0.4, { face: 130, y: 0.03 });
            sm('hw_web', gc(66) + 1.3, gc(30) + 0.9, { y: up(gc(66), gc(30), 1.6), floor: true }); sm('hw_web_2', gc(65) + 0.6, gc(31) + 1.2, { y: up(gc(65), gc(31), 2.1), floor: true, face: 80 });
            [[64, 31, 0.8, -0.6], [68, 31, -0.7, 0.9], [66, 33, 1.1, 0.2], [65, 33, -0.9, 0.5], [67, 31, 0.9, 1.3]].forEach((c, k) => sm('psxg_dead_bush_' + (1 + k % 2), gc(c[0]) + c[2], gc(c[1]) + c[3], { face: k * 70 }));
            sm('crow', gc(65), gc(29), { y: up(gc(65), gc(29), 1.2), floor: true, face: 30 }); sm('crow', gc(67) + 0.9, gc(32) + 0.7, { face: 220 }); sm('crow', gc(64) + 0.9, gc(32) - 0.5, { face: 80 }); }
          /* scatter, non-blockers only (a scatter row may land on a path): dead bushes and small mushrooms over the whole district (sow rows in build re-throw nobody) */
          ctx.sow('psxg_dead_bush_1', 10, [54, 18], 60); ctx.sow('psxg_dead_bush_2', 8, [54, 18], 60); ctx.sow('mushroom', 10, [54, 18], 60, { h: 0.35, r0: 0.2 }); }   // pass 5: 46 -> 28 (the frame rate)
        /* ═══ PASS 4 · THE ATMOSPHERE ═══ (drawn glow only: the room's ten real lights are the old torches and fires; nothing here adds a light)
           The air by plot is airZones above. Here: lantern posts along the trails, bulbs and paper lanterns on the Stage, the owl's eyes, candles afloat on the Lake. */
        { const byPlot = {}, LDZ = -0.25, inG = (cx, cy) => cx >= 36 && cx < 72 && cy >= 0 && cy < 36, at = (cx, cy) => inG(cx, cy) ? cell[cy][cx] : 't';
          /* THE LANTERN POSTS: a post in the trees' edge beside a path, about one every four squares of wood edge, leaning its lamp over the path (never on a path square) */
          let nPost = 0;
          for (let cy = 1; cy < 35; cy++) for (let cx = 37; cx < 71; cx++) { if (at(cx, cy) !== 't' || (cx * 7 + cy * 13) % 5 !== 0) continue;
              const d = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(q => at(cx + q[0], cy + q[1]) === 'p'); if (!d) continue;
              const x = r2(gc(cx) + d[0] * 1.35), z = r2(gc(cy) + d[1] * 1.35), px = Math.floor(cx / 12), py = Math.floor(cy / 12), O = byPlot[px + ':' + py] || (byPlot[px + ':' + py] = { x: gx(px * 12 + 6), z: gx(py * 12 + 6), parts: [] });
              props.push({ key: 'lantern_post', x, z, face: 0, floor: true, noLight: true }); O.parts.push(box(x - O.x, r2(ground(x, z)) + 1.3, z - O.z + LDZ, 0.13, 0.17, 0.13, null, 0xffc070, { glow: 1 })); nPost++; }   // the model has no glow of its own: a small drawn flame sits in its lantern (measured on the file: 0.25 m north of the pole at face 0, 1.4 m up; seen)
          Object.keys(byPlot).sort().forEach(k => features.push({ k: 'arch', id: 'woods:G:lanterns:' + k.replace(':', '-'), x: byPlot[k].x, z: byPlot[k].z, y: 0, parts: byPlot[k].parts }));   // THE MODEL PASS: the `lantern_post` model (was a post, an arm and a lamp drawn from boxes)
          ctx.count.gPosts = nPost; }
        { const q = centre('P04-01'), ox = gx(q[0]), oz = gx(q[1] - 1), y0 = r2(ground(ox, oz)), T = 1.75, H = 5.4;   // THE STAGE: a string of bulbs under the front beam, three paper lanterns in the shell
          [-4.1, 0, 4.1].forEach(dx => props.push({ key: 'string_lights', x: r2(ox + dx), z: r2(oz + 3.05), noLight: true }));   // THE MODEL PASS: three `string_lights` standing on the deck's front edge (were 13 glow boxes on a drawn wire; the model has its own posts, hung from the beam they floated: seen)
          [-3.4, 0, 3.4].forEach(dx => props.push({ key: 'paper_lantern', x: r2(ox + dx), z: r2(oz + 0.6), y: r2(y0 + T + H - 1.3), floor: true, noLight: true })); }
        { const q = centre('P05-01'), ox = gx(q[0]), oz = gx(q[1]), y0 = r2(ground(ox, oz));   // THE OWL: its eyes burn (two small drawn glows; the statue's own stone is untouched)
          features.push({ k: 'arch', id: 'woods:G:owl:eyes', x: ox, z: r2(oz - 1.0), y: y0, parts: [-0.6, 0.6].map(dx => box(dx, 1.75 + 8.3, 1.78, 0.34, 0.34, 0.1, null, 0xff8a20, { glow: 1 })) }); }   // measured on the model: the face's front is 1.8 m before the owl's middle at 10 m tall, the eyes 8.5 m up, 0.6 m off the middle (two tries seen first: inside the head, then on the brow)
        { const bx = gx(61), bz = gc(5);   // THE LAKE: candles afloat round the effigy's boat and off the jetty's head
          const wy = r2(ground(bx, bz) - 0.3);   // the water's top (a height from the room's floor)
          [[1.9, 1.2], [-1.6, 1.7], [2.6, -1.0], [-2.4, -1.3], [0.3, 2.6], [-0.4, -2.5]].forEach(d => props.push({ key: 'candle', x: r2(bx + d[0]), z: r2(bz + d[1]), y: wy, floor: true, noLight: true }));
          [[1.6, -1.4], [2.4, 0.9]].forEach(d => props.push({ key: 'candle', x: r2(gx(57) + 1.75 + d[0]), z: r2(gc(6) + d[1]), y: wy, floor: true, noLight: true })); }
        /* ═══ THE MODEL PASS (2026-11-16, mondo: "these are models that were added ... tell all of those district threads that needed models to use these ones"; one pass on
           top of the five; docs/plans/WISHLIST_MODELS_ADDED.md read end to end). The ten this district asked for are placed; the stand-ins they replace are gone
           (the box-built lantern posts, bulbs, footlights and lamps, the pack tables and stools, the dome tents, the metal barrels: edited where they stood, above). ═══ */
        { const cellAt = (x, z) => { const cx = Math.floor((x + 126) / 3.5), cy = Math.floor((z + 126) / 3.5); return cy >= 0 && cy < 36 && cx >= 36 && cx < 72 ? cell[cy][cx] : 't'; };
          const sq = (key, cx, cy, o) => { if (!free(cx, cy)) return false; take(cx, cy); props.push(Object.assign({ key, x: gc(cx), z: gc(cy) }, o || {})); return true; };
          const sm = (key, x, z, o) => { if (!/[gsr]/.test(cellAt(x, z))) return false; props.push(Object.assign({ key, x: r2(x), z: r2(z) }, o || {})); return true; };
          const top = (x, z, lift) => r2(ground(x, z) + lift);
          /* THE FALLEN REDWOOD: on its eight cut squares beside the trail between the Owl and the Dead Tree, an owl on it */
          props.push({ key: 'fallen_redwood', x: gx(67), z: gx(24), face: 0 }); sm('moss_clump', gx(67) - 4.6, gx(24) - 2.9); sm('moss_clump', gx(67) + 3.9, gx(24) - 3.0); sm('fox', gx(67) + 5.4, gx(22) + 1.0, { face: 200 });
          /* THE OWL: hooded figures between the columns and at the steps' foot, the bell on its frame, a gong */
          { const q = centre('P05-01'), ox = gx(q[0]), oz = gx(q[1]);
            sq('hooded_statue', 65, 18, { face: 90 }) || sm('hooded_statue', gc(65), gc(18) + 1.2, { face: 90 }); sm('hooded_statue', ox - 3.4, oz + 9.2, { face: 180 }); sm('hooded_statue', ox + 3.4, oz + 9.2, { face: 180 });
            sm('hooded_statue', gc(65) + 1.2, gc(17) + 1.3, { face: 135 }); sm('hooded_statue', gc(68) - 1.2, gc(17) + 1.3, { face: 225 });
            sq('bell_frame', 68, 16, { face: 180 }); sq('gong', 68, 20, { face: 270 }) || sm('gong', gc(68) + 1.1, gc(21) + 0.4, { face: 270 }); }
          /* THE STAGE: a hooded figure at each front corner (on the grass), an owl on the roof's beam end */
          { const q = centre('P04-01'), ox = gx(q[0]), oz = gx(q[1] - 1);
            sq('hooded_statue', 51, 17, { face: 180 }); sq('hooded_statue', 56, 17, { face: 180 }); props.push({ key: 'owl_perched', x: r2(ox - 6.85), z: r2(oz + 3.3), y: top(ox, oz, 1.75 + 5.4), floor: true, face: 180 }); }
          /* THE LAKE: the dock with its boat on the east shore, a bollard, rope and oars on the jetty, a lantern post at its head, a rod, reeds and lake rocks on the
             shores, a swan and ducks on the water, a heron, two deer come down to drink */
          { const wy = r2(ground(gx(61), gc(5)) - 0.3), jz = gc(6);
            props.push({ key: 'dock_boat', x: r2(gx(65) - 1.0), z: r2(gc(5) + 0.4), y: r2(wy - 0.5), floor: true, face: 0 });
            props.push({ key: 'lantern_post', x: r2(gx(57) + 1.2), z: r2(jz + 1.5), y: 0.3, face: 0, noLight: true }, { key: 'mooring_bollard', x: r2(gx(57) + 0.9), z: r2(jz - 1.3), y: 0.3 }, { key: 'rope_coils', x: r2(gx(56) - 0.6), z: r2(jz + 1.1), y: 0.31 }, { key: 'oars', x: r2(gx(54) + 1.2), z: r2(jz + 1.2), y: 0.31, face: 80 });
            sm('fishing_rod', gc(51) + 0.9, gc(7) - 0.9, { face: 90 });
            const cxl = gx(60), czl = gc(5); for (let k = 0; k < 14; k++) { const a = k / 14 * 6.2832 + 0.33, x = cxl + Math.cos(a) * (21.6 + (k % 3) * 0.5), z = czl + Math.sin(a) * (13.7 + (k % 2) * 0.5); sm(k % 4 === 3 ? 'lake_rock' : 'reeds', x, z, { face: k * 61 % 360 }); }
            props.push({ key: 'swan', x: r2(gx(59)), z: r2(gc(3)), y: wy, floor: true, face: 120 }, { key: 'duck', x: r2(gx(63) + 1), z: r2(gc(7) + 0.5), y: wy, floor: true, face: 300 }, { key: 'duck', x: r2(gx(63) + 1.9), z: r2(gc(7) + 1.1), y: wy, floor: true, face: 320 });
            sm('heron', gc(51) + 1.2, gc(5) + 1.3, { face: 100 }); sm('deer', gc(66) + 0.4, gc(3) + 0.6, { face: 250 }); sm('deer', gc(67) - 0.6, gc(3) - 0.9, { face: 200 }); }
          /* THE MOUND: a weeping angel among the graves, an owl on the barrow's lintel (the crow there stays on its stone), a raven on its perch */
          { const q = centre('P03-00'), ox = gc(q[0]), oz = gc(q[1]); sq('weeping_angel', 42, 5, { face: 160 }) || sq('weeping_angel', 44, 4, { face: 160 }); props.push({ key: 'owl_perched', x: r2(ox - 1.3), z: r2(oz + 6.9), y: top(ox, oz, 3.2), floor: true, face: 180 }); sm('raven_perch', gc(45) + 1.0, gc(6) + 0.9, { face: 250 }); }
          /* THE STONES: two goats tethered outside the circle (the goatman's), a raven on its perch */
          { sm('goat', gc(57) + 0.8, gc(29) + 0.8, { face: 240 }); sm('goat', gc(57) - 0.4, gc(30) + 1.2, { face: 300 }); sm('raven_perch', gc(51) + 1.0, gc(30) - 1.0, { face: 80 }); }
          /* THE FIRE: a chopping block, stacked firewood, a kettle by the fire, barrels at the big tent */
          { sq('axe_chopping_block', 37, 28) || sm('axe_chopping_block', gc(37), gc(28) + 1.2); sm('firewood_stack', gc(38) + 0.3, gc(30) + 0.9, { face: 20 }); sm('kettle', gc(40) + 1.0, gc(28) + 0.9, { y: 0.02 }); sm('wooden_barrel', gc(41) + 1.3, gc(27) - 1.1); sm('wooden_barrel', gc(41) + 1.2, gc(29) + 1.3); }
          /* THE TENTS: firewood against the Camp House's chimney, a barrel, a cairn at the path's fork */
          { sm('firewood_stack', gx(45) - 1.6, gc(17) + 0.6, { face: 90 }); sm('wooden_barrel', gc(44) + 1.0, gc(15) + 1.0); }
          /* THE DEAD TREE: an owl on a gravestone, a raven on its perch */
          { props.push({ key: 'owl_perched', x: gc(67), z: gc(29), y: top(gc(67), gc(29), 1.33), floor: true, face: 200 }); sm('raven_perch', gc(64) + 0.9, gc(32) + 0.9, { face: 60 }); }
          /* THE CAMP HOUSE: the antler trophy over the mantel, beer taps on the bar, a bear rug at the hearth, cage lamps at the door, an owl on the hood */
          { const cx = gx(47), cz = gx(17), Y0 = r2(ground(cx, cz)), w = 14, d = 7, inP = (key, rx, rz, o) => { const p = Object.assign({ key, x: r2(cx + rx), z: r2(cz + rz), floor: true }, o || {}); if (p.y >= 1) p.y = r2(p.y + Y0); props.push(p); };
            const L = w - 0.12, cols = Math.round(L / 1.75), cw = L / cols, lx = r2(-L / 2 + (Math.floor((cols - 1) / 2) + 0.5) * cw);
            inP('antler_trophy', -w / 2 + 1.35, 0, { y: 2.0, face: 90 }); inP('fur_rug', -4.0, 0, { y: 0.22, face: 90 });
            inP('cage_lamp', lx - 1.5, d / 2 + 0.2, { y: 1.6, noLight: true }); inP('cage_lamp', lx + 1.5, d / 2 + 0.2, { y: 1.6, noLight: true }); inP('owl_perched', lx, d / 2 + 0.9, { y: 2.95, face: 180 }); } }
    },
};
