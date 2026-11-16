/* THE WOODS · THE REDWOOD TRAIL (district T, plots x 0..2 · y 0..2, the north-west, levels 2 to 8: the climb to the snow) — this district's own content, split out of bake-woods.js on
   2026-11-16 (mondo: "every single zone needs to be like that. now. so we can work in parallel"). One thread = this one file.
   Repo tooling only: nothing here ships; the room is baked into data.js (site_prebuilt_fairy_forest_plots, WOODS36-BEGIN / END).

   THE LOOK: ancient and overgrown, "you are being watched". Giant redwoods, mushrooms, boulders, ferns, logs; pale green spores, snow on the Snowline.
   THE PLOTS AND WHAT STANDS THERE TODAY
     P00-00 The Snowline (L8)          three pines, two dead snags, a stone, two skull piles, a bird cage, skulls; native: yeti.
                                       The shasta door (Mount Shasta's Trailhead) is north. Ice sheet on the ground (the game has no snow sheet).
     P01-00 The Shelf (L7)             three cave stones, a sea chest, a signpost, five crosses; natives: krampus, skinwalker.
                                       The lemuria door (Agartha's Crystal City) is north.
     P02-00 The Falls (L6)             two cave stones, a lantern, frogs, an eagle. The Falls' pool is the tool's water.
     P00-01 The Old Trees, north (L5)  LANDMARK: the giant redwood (16 m) and a second (11 m), a log, five hung voodoo dolls, a ward totem; native: bigfoot.
     P01-01 The Meadow (L5)            campfire, drum, guitar, tambourine, bench, eagle; natives: shaman, ki fighter.
     P02-01 The Creek, upper (L4)      torch, a sack, a frog.
     P00-02 The Old Trees, south (L3)  a redwood (11 m), a log, two effigy figures, a hung doll, an eagle.
     P01-02 The Trail (L3)             a candle ring, three hung dolls, a ward totem.
     P02-02 The Creek, lower (L2)      torch, two ward totems.
   KNOWN MISSING / WAITING FOR MONDO
     - The life pass and the horror pass are live but wait for his look (the board).
     - PASS 1, THE EXTERIORS (11-16, `build` + `cut` + `ground`): THE FALLS = a rock wall on the north edge (10.5 m at the lip) and the waterfall row into the
       pool; THE SHELF = rock ground on its north half, the adit's rock gate with a lintel over the lemuria trail, a broken rock edge to the south;
       THE SNOWLINE = the mountain's flank on the west / north-west edge with snow on every top + three snowed outcrops; the giant redwood is 26 m (was 16);
       the district wears `grass_dark_fantasy`. Passes still to do: dressing (the two Creek plots), atmosphere (no light shafts exist in the engine, no mist
       row, no snow sheet: the snow is the ice sheet), polish. No walk-in stands in this district's plan (no interior pass).
     - PASS 3, THE DRESSING (11-16, `build`): the fisher's camp on the upper Creek's glade (tent, rowboat, log, bucket, crate, small things); the rest by the
       bridge on the lower Creek (signpost, bench, log, stepping stones in the water); signposts at the trail's joins; rocks in and along the creek, rocks, logs,
       dead bushes and mushrooms along the trails; from THE MODEL LIST (owner-rules.md §1): Halloween stones, cobwebs, a corpse and body parts (the yeti's
       larder), wolves, rabbits, an anthill, a snowman on the Snowline. 7 of 62 hand-placed pieces were skipped (plot full).
     - PASS 3 OF 5, MORE LANDMARK WORK (11-16, `build`): the Shelf's burial ground + low wall, the Snowline's kills + snow drifts, scarecrows / webs / a trap under
       the old trees, the Meadow's drum circle, pack candles for the candle ring, the camp's dog. The shortlist of everything that fits and the DECISIONS MADE FOR
       MONDO list: areas-complexes.md "THE REDWOOD TRAIL". Two passes left: atmosphere, polish. Then STOP (the district brief: five passes).
     - PASS 4 OF 5, THE ATMOSPHERE (11-16, `airZones` + `build`): mist at the Falls (white rising + hanging particles), fireflies over the Meadow and the creek's
       glades, heavier snow, seven pack lanterns on the trail's edges (`noLight`). Seen by day and at 22:30. Light shafts are NOT possible from a district file
       (arch parts cannot be translucent; `light_shaft` is drawn by code and draws nothing). One pass left: polish. Then STOP.
     - NEEDS A MODEL (nothing stands in for these): a snow ground sheet; a fallen giant redwood trunk (the pack's `fallen_log` is 2 m);
       stepping stones a person can see (the graveyard pack's are a hand wide); a bat (the game's bats are drawn by code); a river fish; green bushes, moss, reeds;
       icicles; deer / bear / owl; a lookout, a lean-to, a rope bridge; a trail sign with words; a bark sheet and a snow sheet; a lit candle (flame).
     - The two Creek plots hold almost nothing of their own.
     - Seen in the probe, do not bring back: the thorn vine model (a toothed man-eater on a mound) is wrong for this wood, and the ocean
       pack's rocks draw as black blocks in this room (the boulders are cave_stone).
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
/* arch parts (data.js THE ARCHITECTURE ROW; the zone kit's rock, copied from districts/M.js): p = the foot's middle in the row's frame; a tint MULTIPLIES its sheet */
const R2 = v => Math.round(v * 100) / 100;
const box = (x, y, z, w, h, d, key, tint, o) => Object.assign({ s: 'box', p: [R2(x), R2(y), R2(z)], size: [R2(w), R2(h), R2(d)], key, tint }, o || {});
const cyl = (x, y, z, r, h, key, tint, o) => Object.assign({ s: 'cyl', p: [R2(x), R2(y), R2(z)], r: R2(r), h: R2(h), key, tint }, o || {});
const ROCK = 'rocks_5', SNOW = 'ice', T_ROCK = 0xd6d2c4, T_ROCK2 = 0xbcb9aa, T_SNOW = 0xffffff, BURY = 1.5;
const rock = (x, y, z, r, h, top, seg, tint) => cyl(x, y, z, r, h, ROCK, tint || T_ROCK, { r2: top, seg, uv: [3.5, 3.5] });
module.exports = {
    id: 'T', name: 'The Redwood Trail',
    ground: 'grass_dark_fantasy',   // THE GROUND BY DISTRICT (bake-woods.js): the dark forest floor, not the room's lawn (mondo's rule: forest floor = grass_dark_fantasy / dirt_2)
    /* THE CUT (bake-woods.js): THE SHELF IS ROCK (pass 1): the north half of the Shelf's clearing wears the rock paint (grass squares -> rock squares; both are open ground,
       so no piece, no tree and no path moves) */
    cut(ctx) {
        const { cell } = ctx;
        for (let cy = 0; cy <= 5; cy++) for (let cx = 12; cx <= 23; cx++) if (cell[cy][cx] === 'g' && (cy <= 3 || (cx + cy) % 3 !== 0)) cell[cy][cx] = 'r';
    },
    /* the forest mass: the feature trees planted deep in this district's tree squares [kind, height m, chance a deep square] (plots of level 6 up get pines, the tool's rule) */
    wood: ['tree_3', 14, 0.12],
    /* THE TREE ZONES (terrain.gen.zones, the thicket by district) and THE AIR BY DISTRICT (shell.atmos.zones): boxes in plots, zoneOf(x0, y0, x1, y1) */
    treeZones: ctx => [Object.assign(ctx.zoneOf(0, 0, 3, 1), { kinds: ['tree_56', 'tree_55', 'tree_56', 'tree_5'], treeH: [6, 9] }),                            // the three mountain plots, first (the first box a tree stands in wins)
        Object.assign(ctx.zoneOf(0, 0, 3, 3), { kinds: ['tree_52', 'tree_52', 'tree_55', 'tree_52', 'tree_53'], treeH: [8.5, 13] })],                 // giants
    /* PASS 4 OF 5, THE ATMOSPHERE (2026-11-16): mist rising off the Falls' foot and drifting over its pool (white `spores` rise, white `dust` hangs), fireflies over the
       Meadow and along the creek's glades, heavier snow on the Snowline; the district's pale green spores stay. Metres; one Points a zone, nothing lit. */
    airZones: ctx => [{ x0: -19.5, z0: -120, x1: -5, z1: -115, kind: 'spores', color: 0xffffff, n: 150, speed: 1.6 }, { x0: -21, z0: -120, x1: -3.5, z1: -106, kind: 'dust', color: 0xeaf4ff, n: 90 },
        Object.assign(ctx.zoneOf(1, 1, 2, 2), { kind: 'fireflies', n: 45 }), { x0: -33, z0: -72, x1: -7, z1: -18, kind: 'fireflies', n: 60 },
        Object.assign(ctx.zoneOf(0, 0, 1, 1), { kind: 'snow', n: 260 }), Object.assign(ctx.zoneOf(0, 0, 3, 3), { kind: 'spores', color: 0xc8f090, n: 300 })],   // snow on the Snowline plot before the district's spores
    /* THE DRESSING: the landmark, the set pieces and the natives (ported from the old rooms) */
    dress(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        tree('P00-01', 'tree_3', 26, 0, 0, 2.4); tree('P00-01', 'tree_3', 17, 2, 1, 1.4); tree('P00-02', 'tree_3', 17, 0, 0, 1.4); dec('P00-02', 'fallen_log', 1, 1); dec('P00-01', 'fallen_log', -1, 2);   // the giant redwood (the landmark)
        put('P01-01', 'campfire', 0, 0); dec('P01-01', 'instrument_drum', 1, 1); dec('P01-01', 'instrument_guitar_lying', -1, 1); dec('P01-01', 'instrument_tambourine', 1, -1); put('P01-01', 'park_bench', -2, -1, { face: 90 }); dec('P01-01', 'eagle', 3, -3);
        put('P01-00', 'cave_stone', 0, 0); put('P01-00', 'cave_stone', 2, 1); put('P01-00', 'cave_stone', -2, 1); dec('P01-00', 'sea_chest', 1, -1); put('P01-00', 'signpost', 0, 3);
        tree('P00-00', 'pine', 6.5, 0, 0); tree('P00-00', 'pine', 6.0, 3, 2); tree('P00-00', 'pine', 5.5, -3, 2); put('P00-00', 'dead_snag', 2, -3); put('P00-00', 'dead_snag', -2, -2); put('P00-00', 'cave_stone', 0, 3);
        put('P02-00', 'cave_stone', 0, 0); put('P02-00', 'cave_stone', 1, 1); dec('P01-02', 'hw_candles', 0, 0); put('P02-01', 'cave_torch', 0, 0); put('P02-02', 'cave_torch', 0, 0);
        native('P01-01', 'shaman', -2, 2, 0); native('P00-01', 'bigfoot', -2, -1, 120); native('P01-01', 'ki fighter', 3, 2, 300); native('P00-00', 'yeti', -1, 1, 150); native('P01-00', 'krampus', -1, 2, 180);
    },
    /* THE HORROR PASS (mondo 11-15): it gets worse the farther you walk from the Stair */
    horror(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        hdec('P02-02', 'item_ward_totem', 1, 1); hdec('P02-02', 'item_ward_totem', -1, -1);
        hdec('P01-02', 'meshy_voodoo_doll', 1, 1, { y: 1.7 }); hdec('P01-02', 'meshy_voodoo_doll', -1, 1, { y: 2.1 }); hdec('P01-02', 'meshy_voodoo_doll', 0, -1, { y: 1.5 }); hdec('P01-02', 'item_ward_totem', 2, 0);
        hdec('P00-02', 'decor_effigy_figure', 1, -1); hdec('P00-02', 'decor_effigy_figure', -1, 1); hdec('P00-02', 'meshy_voodoo_doll', 2, 1, { y: 1.8 });
        [[1, 0, 1.3], [-1, 0, 1.9], [0, 1, 1.6], [0, -1, 2.2], [1, 1, 1.1]].forEach(d => hdec('P00-01', 'meshy_voodoo_doll', d[0], d[1], { y: d[2] })); hdec('P00-01', 'item_ward_totem', 3, 1);
        hdec('P02-01', 'meshy_burlap_sack', 1, 0); hdec('P02-00', 'railway_lantern', 1, 2);
        [[2, 2], [3, 0], [-3, 1], [-1, -3], [1, -2]].forEach(d => hdec('P01-00', 'cross', d[0], d[1], { face: 180 })); native('P01-00', 'skinwalker', 3, -2, 200);
        hput('P00-00', 'skull_pile', 1, 1); hput('P00-00', 'skull_pile', -2, 3); hput('P00-00', 'bird_cage', 3, -1); hdec('P00-00', 'skull', 2, 2); hdec('P00-00', 'skull', -1, 2); hdec('P00-00', 'skull', 0, -2);
    },
    /* THE LIFE PASS (mondo 11-15): this district's own wood, its plants and its small animals */
    life(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        sow('mushroom2', 16, [22, 22], 38, { h: 0.45, r0: 0.25 }); sow('mushroom2', 6, [7, 27], 24, { h: 0.5, r0: 0.25 });
        sow('cave_stone', 14, [20, 21], 40, { r0: 0.5 });   /* seen in the probe (11-15): the ocean pack's rocks draw as black blocks here, and the thorn vine model is a toothed man-eater on a mound, wrong for this wood: it lives in Dead Man's Cave only */ sow('fern', 40, [20, 24], 42); sow('fallen_log', 8, [20, 24], 42, { r0: 1.9 }); sow('stump', 8, [20, 24], 42);
        ['P00-01', 'P00-02', 'P01-02', 'P02-01', 'P02-02', 'P01-01'].forEach((id, i) => { fly(id, i % 2 ? 'luna_moth' : 'hawk_moth', 1.5); life(id, i % 2 ? 'crow' : 'grasshopper'); });
        fly('P00-02', 'eagle', 9); fly('P02-00', 'eagle', 8); life('P02-00', 'meshy_frog'); life('P02-00', 'meshy_frog'); life('P02-01', 'meshy_frog');
    },    /* PASS 1, THE EXTERIORS (2026-11-16, the district's second thread). New rows only, on this district's own dice (nothing that stands is thrown again).
       A rock block = a `plateau` on whole squares (the blocker) under a rock skin 6 cm proud, with tapered boulders leaning on it so nothing reads as a box. */
    build(ctx) {
        const { gx, gc, r2, features, rnd, taken, cell, ground } = ctx;
        /* one outcrop: blocks = [col, row, cols wide, rows deep, height m]; caps = snow on top (the Snowline); returns nothing, pushes the plateaus + ONE arch row */
        const outcrop = (id, blocks, o) => { o = o || {};
            const b0 = blocks[0], ox = r2(gx(b0[0]) + b0[2] * 1.75), oz = r2(gx(b0[1]) + b0[3] * 1.75), y0 = r2(ground(ox, oz)), parts = [];
            blocks.forEach((b, i) => { const w = b[2] * 3.5, d = b[3] * 3.5, h = b[4], x = r2(gx(b[0]) + w / 2), z = r2(gx(b[1]) + d / 2), g = ground(x, z) - y0, t = i % 2 ? T_ROCK2 : T_ROCK;
                features.push({ k: 'plateau', x, z, w, d, h, edge: 0.08 });
                for (let cy = b[1]; cy < b[1] + b[3]; cy++) for (let cx = b[0]; cx < b[0] + b[2]; cx++) taken.add(cx + ':' + cy);
                parts.push(box(x - ox, g - BURY, z - oz, w + 0.12, h + BURY + 0.06, d + 0.12, ROCK, t, { uv: [3.5, 3.5] }));
                if (o.snow) parts.push(box(x - ox, g + h + 0.06, z - oz, w + 0.4, 0.5, d + 0.4, SNOW, T_SNOW, { gain: 1.7, uv: [3.5, 3.5] }));
                /* the boulders: a ragged crest on top, leaners at the foot of every face that is not the room's edge */
                const n = Math.max(2, Math.round((w + d) / 3.5));
                for (let k = 0; k < n; k++) { const rr = 1.1 + rnd() * 1.3, hh = 1.0 + rnd() * 1.8, bx = x - ox + (rnd() - 0.5) * Math.max(0.5, w - 2.4), bz = z - oz + (rnd() - 0.5) * Math.max(0.5, d - 2.4);
                    parts.push(rock(bx, g + h, bz, rr, hh, rr * (0.3 + rnd() * 0.2), 5 + Math.floor(rnd() * 3), k % 2 ? T_ROCK : T_ROCK2));
                    if (o.snow) parts.push(cyl(bx, g + h + hh - 0.25, bz, rr * 0.62, 0.5, SNOW, T_SNOW, { gain: 1.7, r2: rr * 0.3, seg: 6, uv: [3.5, 3.5] })); }
                /* THE FACES: every face that is not the room's edge is broken by tapered buttresses half sunk in it (no flat wall shows), with smaller leaners at its foot.
                   `clear` = [x0, x1] (m): nothing stands on a SOUTH face between them (the waterfall's sheet) */
                const faces = [[0, d / 2, w], [0, -d / 2, w], [w / 2, 0, d], [-w / 2, 0, d]];
                faces.forEach((f, fi) => { if (Math.abs(x + f[0]) > 124 || Math.abs(z + f[1]) > 124) return; const m = Math.max(1, Math.ceil(f[2] / 2.7)), sx = Math.sign(f[0]), sz = Math.sign(f[1]);
                    for (let k = 0; k < m; k++) { const s = (k + 0.5) / m * f[2] - f[2] / 2 + (rnd() - 0.5) * 0.8, px = x + f[0] + (f[0] ? 0 : s), pz = z + f[1] + (f[1] ? 0 : s), rr = 1.5 + rnd() * 0.9, hh = h * (0.78 + rnd() * 0.3), lr = 0.8 + rnd() * 0.9, lh = 0.9 + rnd() * 1.6;
                        if (fi === 0 && o.clear && px > o.clear[0] && px < o.clear[1]) continue;
                        parts.push(rock(px - ox - sx * 0.35, g - BURY, pz - oz - sz * 0.35, rr, hh + BURY, rr * (0.5 + rnd() * 0.25), 5 + Math.floor(rnd() * 3), k % 2 ? T_ROCK2 : T_ROCK));
                        if (o.snow) parts.push(cyl(px - ox - sx * 0.35, g + hh, pz - oz - sz * 0.35, rr * 0.72, 0.45, SNOW, T_SNOW, { gain: 1.7, r2: rr * 0.4, seg: 6, uv: [3.5, 3.5] }));
                        if (k % 2 === 0) parts.push(rock(px - ox + sx * (rr + 0.2) + (rnd() - 0.5), g - BURY, pz - oz + sz * (rr + 0.2) + (rnd() - 0.5), lr, lh + BURY, lr * 0.4, 5 + Math.floor(rnd() * 2), T_ROCK2)); } }); });
            (o.extra || []).forEach(e => parts.push(e(ox, oz, y0)));
            features.push({ k: 'arch', id: 'woods:T:' + id, x: ox, z: oz, y: y0, parts });
        };
        /* ── THE FALLS (P02-00): a rock wall on the room's north edge behind the pool, 10.5 m at the lip, 7 m on its shoulders; the creek comes over it into the pool
              (the waterfall row, areas-complexes.md THE WATERFALLS: it draws only). mondo's size rule: a waterfall is at least 7 m. ── */
        outcrop('falls', [[31, 0, 3, 2, 10.5], [29, 0, 2, 2, 7], [34, 0, 2, 2, 7], [28, 0, 1, 1, 3.5], [29, 2, 1, 1, 3.5], [35, 2, 1, 1, 3.5]], { clear: [gc(32) - 3.4, gc(32) + 3.4] });
        { const lx = gc(32), lz = gx(2), top = r2(ground(lx, gx(1)) + 10.5), pool = r2(ground(gc(32), gc(3)) - 0.25);
          features.push({ k: 'fall', x: lx, z: r2(lz + 0.1), face: 180, w: 5.25, y0: r2(top - 0.05), y1: pool });
          /* the notch the water comes through, and the wet rocks at its foot (decor, off the squares' middles) */
          features.push({ k: 'arch', id: 'woods:T:fallsnotch', x: lx, z: lz, y: top, parts: [rock(-4.2, -0.4, -1.3, 1.7, 2.6, 0.7, 6), rock(4.1, -0.4, -1.5, 1.9, 3.1, 0.8, 7, T_ROCK2), rock(-3.4, -0.4, -4.4, 1.5, 1.9, 0.6, 5, T_ROCK2), rock(3.2, -0.4, -4.8, 1.6, 2.2, 0.7, 6)] });
          features.push({ k: 'arch', id: 'woods:T:fallsfoot', x: lx, z: r2(lz + 2), y: r2(pool - 0.6), parts: [rock(-5.6, 0, 0.6, 1.5, 1.7, 0.6, 6), rock(5.4, 0, 0.9, 1.7, 2.0, 0.7, 5, T_ROCK2), rock(-7.9, 0, 3.6, 1.2, 1.5, 0.5, 5, T_ROCK2), rock(7.6, 0, 4.4, 1.3, 1.6, 0.5, 6),
              rock(-2.6, 0, 0.5, 0.9, 1.0, 0.4, 5), rock(2.9, 0, 0.4, 1.0, 1.1, 0.4, 6, T_ROCK2), rock(-8.6, 0, 8.2, 1.0, 1.3, 0.4, 5), rock(8.4, 0, 8.8, 1.1, 1.4, 0.5, 5, T_ROCK2)] }); }
        /* ── THE SHELF (P01-00): the adit's rock gate on the plan's own rock squares (two 7 m blocks and a lintel over the one-square trail to the lemuria door,
              which stays where it is), and the broken rock edge where the Shelf drops to the Old Trees ── */
        outcrop('adit', [[20, 0, 1, 2, 7], [22, 0, 1, 2, 7], [20, 2, 1, 1, 3.5], [23, 0, 1, 1, 3.5]],
            { extra: [(ox, oz, y0) => box(gc(21) - ox, 4.4, gx(1) - oz, 3.9, 2.9, 5.6, ROCK, T_ROCK2, { uv: [3.5, 3.5], under: true }), (ox, oz) => rock(gc(21) - ox, 7.2, gx(1) - oz, 2.4, 1.7, 0.9, 6)] });
        { const band = []; for (let cy = 7; cy <= 11; cy++) for (let cx = 12; cx <= 23; cx++) if (cell[cy][cx] === 'r' && !taken.has(cx + ':' + cy)) band.push([cx, cy, 1, 1, 3.5]);
          if (band.length) outcrop('edge', band); }
        /* ── THE SNOWLINE (P00-00): the mountain's flank on the room's west and north-west edge (10.5 m at the corner, stepping down south), snow on every top,
              and three snowed outcrops on the field. The shasta door (north) and every piece that stands are left where they are. ── */
        outcrop('flank', [[0, 0, 1, 5, 10.5], [1, 0, 2, 1, 7], [0, 5, 1, 4, 7], [1, 1, 1, 1, 3.5], [0, 9, 1, 2, 3.5]], { snow: true });
        { const want = [[2, 8], [9, 9], [9, 1], [3, 5], [8, 6]].filter(q => cell[q[1]][q[0]] === 's' && !taken.has(q[0] + ':' + q[1])).slice(0, 3);
          want.forEach((q, i) => outcrop('snowrock' + i, [[q[0], q[1], 1, 1, 3.5]], { snow: true })); }
        /* ── PASS 3, THE DRESSING (2026-11-16): catalogue props only, packs first. hput / hdec skip a piece when its plot is full; the scatters are `sow` rows
              added here, so they re-throw nobody's (bake-woods.js THE SEEDS HOLD). ── */
        const { hput, hdec, sow } = ctx;
        /* THE CREEK, UPPER (P02-01): a fisher's camp on the glade between the trail and the water */
        hput('P02-01', 'camping_tent', -1, -2, { face: 120 }); hput('P02-01', 'rowboat', 1, 1, { face: 20 }); hdec('P02-01', 'fallen_log', 0, 1); hdec('P02-01', 'wooden_bucket', 1, 0);
        hdec('P02-01', 'psx_fish_skeleton_mp_1', 1, -1); hdec('P02-01', 'psx_wooden_crate_2', -1, -1); hdec('P02-01', 'stump', -1, 1); hdec('P02-01', 'psx_glass_bottle_1', 0, -1);
        /* THE CREEK, LOWER (P02-02): the rest by the bridge where the trails meet */
        hput('P02-02', 'signpost', -1, 1); hput('P02-02', 'park_bench', 1, -1, { face: 180 }); hdec('P02-02', 'fallen_log', 2, 0); hdec('P02-02', 'wooden_bucket', 1, 1); hdec('P02-02', 'stump', 0, -1); hdec('P02-02', 'psxg_dead_bush_1', 2, 1);
        /* the trail's joins and the old trees */
        hput('P01-02', 'signpost', 2, 0); hput('P00-02', 'signpost', 1, 1); hdec('P00-02', 'fallen_log', -1, -1); hdec('P00-01', 'fallen_log', 2, -2); hdec('P00-01', 'stump', -2, 2); hdec('P01-01', 'fallen_log', 3, 0); hdec('P01-01', 'stump', -3, 2);
        hdec('P01-00', 'psxg_dead_bush_2', -3, -1); hdec('P01-00', 'psxg_dead_bush_1', 3, 3); hdec('P00-00', 'psxg_dead_bush_2', 3, 3); hdec('P00-00', 'psxg_dead_bush_1', -3, -1);
        /* THE MODEL LIST FIRST (mondo 11-16; owner-rules.md §1): pieces of the packs the first cut had missed. The graveyard pack's stepping stones across the creek at
           the lower glade; the Halloween pack's stones, cobwebs, a corpse and body parts (the yeti's larder, the bigfoot's trees); the PSX pack's small things at the
           camp; the animal pack's wolves, rabbits and an anthill; the Christmas pack's snowman on the Snowline. Skipped on purpose: the bats (drawn by code, no model),
           the caterpillar (a 2 m Meshy piece), the Halloween and graveyard packs' trees (the tree kinds are closed). */
        { const { life, props } = ctx, sx = gc(32), sz = gc(28);
          [[-4.6, 0.3, 1], [-2.9, -0.4, 2], [-1.2, 0.2, 1], [0.6, -0.3, 2], [2.3, 0.3, 1], [4.0, -0.2, 2]].forEach(q => props.push({ key: 'psxg_stepping_stone_' + q[2], x: r2(sx + q[0]), z: r2(sz + q[1]), face: Math.round(rnd() * 360) }));
          hdec('P02-01', 'psx_flashlight_1', 0, 0); hdec('P02-01', 'psx_hand_saw_1', -1, 0); hdec('P02-01', 'psx_knife_mp_1', 1, -1); hdec('P02-01', 'psx_meat_1', 0, 1);
          hdec('P00-00', 'hw_body', 1, 2, { face: 70 }); hdec('P00-00', 'hw_part_3', -2, 2); hdec('P00-00', 'hw_part_6', 2, 0); hdec('P00-00', 'psx_meat_1', -1, 3); hput('P00-00', 'xmas_snowman', 3, 3, { face: 135 });
          hput('P01-00', 'hw_stone_3', -3, 2); hput('P01-00', 'hw_stone', 3, 1); hdec('P01-00', 'hw_shovel', 2, 3); hdec('P01-00', 'hw_part_6', 1, 2);
          hdec('P00-01', 'hw_web', 1, -1, { y: 1.4 }); hdec('P00-01', 'hw_web_2', -1, 1, { y: 1.9 }); hdec('P00-02', 'hw_web', 1, 0, { y: 1.5 }); hdec('P00-01', 'hw_part_3', -2, -2); hdec('P00-01', 'anthill', 3, -1);
          life('P00-02', 'wolf'); life('P01-02', 'wolf'); life('P01-00', 'wolf'); life('P01-01', 'rabbit'); life('P01-01', 'rabbit'); life('P02-02', 'rabbit'); life('P02-01', 'anthill'); }
        /* ── PASS 3 OF 5, MORE LANDMARK WORK (2026-11-16; this district has no walk-in, so the interiors pass is spent here, as the district brief says).
              From the whole-list shortlist (areas-complexes.md THE REDWOOD TRAIL, FITS THIS DISTRICT). `at` = a piece at metres from a plot's clearing middle, on open
              ground only, sharing squares (a blocker snaps to its square's middle and claims it). ── */
        { const { centre, props, life, fly } = ctx, open = (cx, cy) => cx >= 0 && cy >= 0 && cx < 36 && cy < 36 && /[gsr]/.test(cell[cy][cx]);
          const at = (id, key, dx, dz, o, blk) => { const c = centre(id), x = gc(c[0]) + dx, z = gc(c[1]) + dz, cx = Math.floor((x + 126) / 3.5), cy = Math.floor((z + 126) / 3.5);
              if (!open(cx, cy) || (blk && taken.has(cx + ':' + cy))) return false; if (blk) taken.add(cx + ':' + cy);
              props.push(Object.assign({ key, x: blk ? gc(cx) : r2(x), z: blk ? gc(cy) : r2(z), face: Math.round(rnd() * 360) }, o || {})); return true; };
          /* THE SHELF: the crosses are a hill burial ground (graveyard + Halloween packs), a low stone wall on its south lip */
          [['psxg_tombstone_1', -5.2, 2.6], ['psxg_tombstone_2', 5.6, -1.2], ['psxg_tombstone_3', -8.4, -2.2], ['hw_grave_low', 8.6, 5.4], ['hw_stone_2', -1.6, -6.2], ['hw_stone_4', 9.4, -5.2], ['hw_stone_1', -10.2, 6.2]].forEach(q => at('P01-00', q[0], q[1], q[2], { face: 180 }, true));
          [[-5.2, 4.4], [5.6, 0.6], [-8.4, -0.4]].forEach(q => at('P01-00', 'psxg_dirt_grave', q[0], q[1], { face: 0 }));
          [[2, 1.2, 'hw_candles'], [-3.9, 3.9, 'hw_candle'], [6.6, 1.0, 'hw_candle_2'], [-0.6, -4.9, 'hw_candles_2'], [1.4, 2.4, 'hw_part_7'], [-6.8, 1.2, 'psx_cross_1']].forEach(q => at('P01-00', q[2], q[0], q[1]));
          for (let cx = 13; cx <= 20; cx++) if (open(cx, 8) && !taken.has(cx + ':8') && cx !== 16) { taken.add(cx + ':8'); props.push({ key: cx % 3 ? 'psxg_wall' : 'psxg_wall_pillar', x: gc(cx), z: gc(8), face: 0 }); }
          /* THE SNOWLINE: the yeti's kills in the snow, and drifts (low domes in the ice sheet; decor, off the squares' middles) */
          [['hw_body_rising', -6.4, 5.2, true], ['hw_body_2', 5.2, 7.4], ['hw_part', 3.4, -4.6], ['hw_part_2', -4.4, -6.2], ['hw_part_4', 8.2, 2.4], ['hw_part_9', -8.6, 1.4], ['psx_butcher_knife_mp_1', 4.6, 6.6], ['trap_chain_draped', 10.4, -3.0], ['psx_jerrycan_1', -9.6, 8.4], ['psx_walkie_talkie_1', 5.9, 8.1]].forEach(q => at('P00-00', q[0], q[1], q[2], null, q[3]));
          { const ox = gc(5), oz = gc(5), y0 = r2(ground(ox, oz)), parts = [];
            for (let i = 0; i < 22; i++) { const cx = 1 + Math.floor(rnd() * 10), cy = 1 + Math.floor(rnd() * 10); if (cell[cy][cx] !== 's') continue; const x = gx(cx) + 0.6 + rnd() * 2.3, z = gx(cy) + 0.6 + rnd() * 2.3, r = 1.5 + rnd() * 1.9;
                parts.push({ s: 'dome', p: [r2(x - ox), r2(ground(x, z) - y0 - 0.12), r2(z - oz)], r: r2(r), rz: r2(r * (0.6 + rnd() * 0.5)), h: r2(0.35 + rnd() * 0.45), seg: 10, rings: 3, key: SNOW, tint: T_SNOW, gain: 1.7, uv: [3.5, 3.5] }); }
            features.push({ k: 'arch', id: 'woods:T:drifts', x: ox, z: oz, y: y0, parts }); }
          /* THE OLD TREES: watchers between the trunks, webs and a chrysalis hung at head height, a hunter's trap by the bigfoot's trees */
          at('P00-01', 'hw_scarecrow', -7.4, -5.2, { face: 135 }, true); at('P00-02', 'hw_scarecrow_2', 4.2, 3.6, { face: 300 }, true);
          at('P00-01', 'psx_cobweb_1', 4.4, -4.2, { y: 1.3 }); at('P00-01', 'psx_cobweb_4', -3.2, 5.4, { y: 1.6 }); at('P00-02', 'psx_cobweb_2', -2.4, -1.8, { y: 1.4 }); at('P00-01', 'chrysalis', 1.4, 3.1, { y: 1.9 }); at('P00-02', 'chrysalis', 2.2, -0.8, { y: 1.7 });
          at('P00-01', 'trap_bear_base', 6.2, 5.6); at('P00-01', 'trap_bear_jaw', 6.2, 5.6); at('P00-01', 'trap_chain_straight', 6.9, 5.9); at('P00-02', 'hw_part_4', -1.2, 2.2);
          /* THE MEADOW: the drum circle round the fire (straw seats, a rug, the pack's other instruments, plates and cans), butterflies and bees over the grass */
          [[5.2, 0, 90], [-2.6, 4.6, 200], [-2.6, -4.6, 330], [3.6, 4.2, 140]].forEach(q => at('P01-01', 'hw_straw', q[0], q[1], { face: q[2] }, true));
          [['psx_carpet_mp_1', 0.4, 6.4], ['instrument_guitar', 5.9, 1.1], ['instrument_maracas', -1.9, 3.6], ['instrument_seed_pod', 2.1, -3.3], ['instrument_tambourine_up', 3.9, 3.2], ['instrument_violin_lying', 0.9, 7.1],
            ['psx_old_mattress_mp_1', -7.4, 6.6], ['psx_open_book_mp_1', 1.2, 6.8], ['psx_tin_can_mp_1_rusty', 6.4, -2.2], ['psx_supply_crate_1', -6.4, -4.4], ['psx_wooden_crate_6', 7.6, 6.2]].forEach(q => at('P01-01', q[0], q[1], q[2]));
          ['butterfly', 'monarch', 'blue_morpho', 'bee'].forEach((k2, i) => fly('P01-01', k2, 0.8 + (i % 3) * 0.4)); life('P01-01', 'ladybug'); life('P01-01', 'grasshopper_brown'); life('P00-01', 'ant_leaf'); life('P00-02', 'caterpillar_bug');
          /* THE TRAIL: the candle ring is the Halloween pack's candles now (the old piece was drawn by code), more candles round it, picket panels at the join */
          for (let i = 0; i < 7; i++) { const a = i / 7 * 6.2832; at('P01-02', i % 2 ? 'hw_candle' : 'hw_candle_2', Math.cos(a) * 1.5, Math.sin(a) * 1.5); }
          at('P01-02', 'hw_fence', 5.4, 2.0, { face: 90 }, true); at('P01-02', 'hw_fence', -5.4, 2.0, { face: 90 }, true); at('P01-02', 'psx_cross_mp_2', 0.4, 0.5); at('P01-02', 'hw_part_7', -0.7, -0.4);
          /* PASS 4 OF 5, THE LIT PIECES (drawn glow, no light: the room's ten real lights are the torches and fires): the pack's lantern on the trail's edge at each join (every one `noLight`) */
          { /* SEEN IN THE PROBE, TAKEN OUT: flames built from glowing boxes stood beside the pack's candles and read as pale blocks; a lit candle needs a model */
            [['P01-02', 4.4, -3.2], ['P02-02', -3.6, 3.0], ['P00-02', 3.2, -4.4], ['P01-01', 9.4, -2.6], ['P01-00', -4.4, 8.2], ['P00-00', 7.4, -7.2], ['P00-01', -5.6, 7.4]].forEach(q => at(q[0], 'railway_lantern', q[1], q[2], { noLight: true })); }
          /* THE CREEK: the camp's dog, cooler, cans */
          at('P02-01', 'dog', 2.4, 1.6); at('P02-01', 'beach_cooler', -1.4, 2.6); at('P02-01', 'psx_canned_food_mp_2', -0.6, 2.2); at('P02-01', 'psx_canned_food_mp_5_rusty', 0.8, -2.4); at('P02-01', 'psx_metal_barrel_mp_1', -4.4, -3.2); at('P02-01', 'psx_lighter_mp_1', 0.3, 1.1);
          at('P02-02', 'psx_supply_crate_1_empty', 2.6, 1.2); at('P02-02', 'psx_tin_can_mp_1_rusty', -1.2, 2.2); at('P02-02', 'psx_bandage_mp_1', 1.4, -0.6); }
          /* SEEN IN THE PROBE, TAKEN OUT: the ocean pack's fish are reef fish (a clownfish, a blue tang) and hover 1.5 m over this shallow pool; no pool life until a river fish exists */
        /* rocks in and along the creek (the Falls' pool down to the bridge), rocks and logs along the trails, more mushrooms under the giants */
        sow('psxg_rock_2', 9, [32, 4], 9, { r0: 2.5 }); sow('psxg_rock_1', 10, [32, 14], 12, { r0: 0.5 }); sow('psxg_rock_3', 10, [32, 26], 12, { r0: 0.5 }); sow('psxg_rock_4', 8, [31, 19], 8);
        sow('psxg_rock_1', 8, [16, 27], 20, { r0: 0.5 }); sow('psxg_rock_4', 8, [20, 12], 28, { r0: 0.5 }); sow('fallen_log', 6, [16, 26], 26, { r0: 1.9 }); sow('mushroom', 12, [7, 20], 22, { h: 0.5, r0: 0.25 }); sow('psxg_dead_bush_1', 8, [14, 6], 30);
    },
};
