/* CAME A LOT · THE FAIRY FOREST, THE ROOM DESIGN (2026-11-20, the world polish plan, thread 3: docs/plans/world-polish/WORLD_POLISH_PLAN.md).
   Repo tooling only: bake-camelot.js calls `room(kit)` on `site_prebuilt_camelot_ow_fairy` as it stands on the One World, before it joins anything.
   The pattern is the Snowy Pines' (`N-room.js`; notes: docs/notes/areas-complexes.md "THE SNOWY PINES, THREE PLOTS WIDE" + "THE FAIRY FOREST, 13 PLOTS").
   F.js (the home frame) still stands everything on the six old plots; its two knolls were raised there (they lie inside their own plots).

   THE ROOM (4 x 4 plots, 13 of them; O = an old plot, a name = a new one, . = no plot: the Old Road, R4, lies north). Squares x 0..47, y 0..47:
        x 0..11            12..23            24..35                36..47
     y  0  O Knoll, north   .                 .                     .
       12  O the Pond       O the Fairy Ring  O the Woods Trail     O the Spring
       24  The Moth Glade   O Knoll, south    The Glow-Worm Hollow  The Mossy Stair
       36  The Wishing Pool The Root Stair    The Hollow Oak        The Lantern Glade
   In: the east gate's seam on the Pond's west side. Out: the trail east from the Spring to the Woods' Clearing.
   At home the six plots were a column and each kept its own stretch of the trail (two squares at its x 4..5); on the One World four of them
   stand side by side, so those stretches are four dead-end lanes.

   THE WAYS:
     THE FAIRY WALK (4 squares, soft): the four lanes widened to 4 and joined by a walk south of them that dips through THE GLOW-WORM HOLLOW
       (a bowl 2.6 m deep, a clearing a battle board fits on). In at the Pond, down, east through the hollow, up to the Spring and out: a U, never a line.
     THE SOUTH LOOP: from the walk's west end south to THE WISHING POOL, east under THE ROOT STAIR's knoll (5 m: a stair of roots up its north
       face to a ring of toadstools and a chest, the place that is hard to reach), past THE HOLLOW OAK to THE LANTERN GLADE (the second board
       clearing) and north again to the walk. The hollow has its own way south to the oak.
     THE KNOLLS (F.js): the north knoll 4.5 m with its great oak, the crystal knoll 4.2 m; root steps on the way up each. */
'use strict';
function room(k) {
    const { r2, gx, gz, gcx, gcz } = k;
    const GRASS = 'grass_dark_fantasy';
    const way = (pts, w, ch, sheet) => { for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let s = 0; s <= n; s++) { const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n); k.carve(x, y, x + w, y + w, ch || 'p', sheet); } } };
    const trail = (pts, w) => { way(pts, w, 'p', GRASS); if (w >= 3) way(pts.map(q => [q[0] + 1, q[1] + 1]), w - 2, 'p'); };
    const glade = (x0, y0, x1, y1) => k.carve(x0, y0, x1 + 1, y1 + 1, 'g');
    const mx = v => gx(v), mz = v => gz(v);
    const A = (key, fx, fy, o) => k.at(key, r2(mx(fx)), r2(mz(fy)), o);
    const P = (key, sx, sy, o) => k.at(key, gcx(sx), gcz(sy), o);
    /* root steps: logs of root across a climb, from (x0, y0) to (x1, y1) in squares, the ground's own height under each (h0 at the foot, h1 at the head) */
    const ROOTS = [];
    const roots = (x0, y0, x1, y1, h0, h1, wide, ry) => { const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) * 3.5 / 0.9)); for (let i = 0; i <= n; i++) { const t = i / n, s = t * t * (3 - 2 * t);
        ROOTS.push({ s: 'box', p: [r2(mx(x0 + (x1 - x0) * t)), r2(h0 + (h1 - h0) * s - 0.1), r2(mz(y0 + (y1 - y0) * t))], size: [wide, 0.24, 0.3], ry: ry + (i % 2 ? 7 : -6), key: 'wood', tint: 0x4a3a2c, gain: 1.5 }); } };   // (a `cyl` part stands upright: a lying root is a box)

    /* the old strips that led nowhere (the east road's own line, cut into two by the move): back to the wood */
    k.close(12, 23, 16, 24); k.close(18, 23, 24, 24); k.close(24, 12, 28, 13); k.close(30, 12, 36, 13);

    /* ── THE FAIRY WALK: the four lanes to 4 squares, the walk south of them ── */
    [2, 14, 26, 38].forEach(x => trail([[x, 12], [x, 24]], 4));
    trail([[2, 24], [2, 28], [14, 28], [26, 29], [38, 28], [38, 24]], 4);
    glade(26, 27, 33, 34);                           // THE GLOW-WORM HOLLOW: 8 x 8, a battle board fits
    k.feat({ k: 'dip', id: 'cam:f:hollow', x: mx(30), z: mz(31), r: 14, h: 2.6 });

    /* ── THE SOUTH LOOP ── */
    trail([[3, 32], [3, 37]], 4); glade(2, 38, 9, 44);                 // THE WISHING POOL's ground
    trail([[10, 43], [24, 43]], 3);                                    // east under the root knoll
    glade(27, 39, 33, 45); trail([[29, 35], [29, 38]], 3);             // THE HOLLOW OAK's ground, the hollow's way south to it
    trail([[34, 42], [37, 42]], 3);
    glade(38, 37, 45, 44);                                             // THE LANTERN GLADE: 8 x 8, a battle board fits
    trail([[40, 32], [40, 36]], 4);
    /* THE ROOT STAIR: a knoll 5 m, the stair up its north face from the walk, a ring of toadstools on its crown */
    k.feat({ k: 'hill', id: 'cam:f:rootknoll', x: mx(18.5), z: mz(39.5), r: 11.5, h: 5 });
    trail([[17, 32], [17, 36]], 3); glade(17, 37, 19, 41);
    roots(18.5, 35.4, 18.5, 38.6, 0.9, 4.7, 3.4, 0);

    /* ── the knolls' root steps (F.js raised them: the north knoll 4.5 m at square 7,10; the crystal knoll 4.2 m at 19,24) ── */
    roots(5.2, 13.6, 6.4, 11.4, 0.5, 3.6, 2.6, 60); roots(18.2, 27.6, 18.6, 25.6, 0.4, 3.4, 2.6, 0);
    k.feat({ k: 'arch', id: 'cam:f:roots', x: 0, z: 0, rot: 0, y: 0, parts: ROOTS });

    /* ── THE DRESSING ── */
    /* the hollow: glow caps and toadstools round its floor, moths, fireflies */
    [[26.6, 27.6], [33.4, 27.5], [26.5, 34.4], [33.5, 34.5], [30, 27.4], [26.4, 31]].forEach((q, i) => A(i % 2 ? 'woods_glowcap' : 'fae_toadstool', q[0], q[1], { face: i * 50, noLight: true }));
    A('luna_moth', 29, 30, { floor: true, y: 1.4 }); A('hawk_moth', 31.5, 32.4, { floor: true, y: 1.1 }); A('firefly', 28, 33, { y: 1.2 }); A('firefly', 32, 29, { y: 1.5 }); A('fern', 33.5, 31.4); A('stump', 27.5, 33.5); A('mushroom2', 31.6, 34.4);
    /* the root stair's crown: the ring, the chest */
    for (let i = 0; i < 7; i++) { const a = (i * 51 + 20) * Math.PI / 180; if (i === 5) continue; A('fae_toadstool', 18.5 + Math.cos(a) * 1.25, 39.6 + Math.sin(a) * 1.25, { face: i * 40, noLight: true }); }
    A('sea_chest', 18.5, 40, { face: 0 }); A('woods_glowcap', 17.3, 41.6, { noLight: true }); A('butterfly', 19.4, 38.5, { floor: true, y: 1.2 });
    /* the wishing pool: drawn water in a ring of stones, a well beside it, flowers */
    { const P2 = [{ s: 'dome', p: [0, 0.03, 0], r: 5.2, h: 0.05, rz: 4.2, seg: 20, rings: 2, key: 'water', tint: 0x9ad0e0, glow: 0.3 }];
      for (let i = 0; i < 13; i++) { const a = (i * 28 + 8) * Math.PI / 180; P2.push({ s: 'dome', p: [r2(Math.cos(a) * 5.5), -0.15, r2(Math.sin(a) * 4.5)], r: r2(0.55 + (i % 3) * 0.14), h: r2(0.45 + (i % 2) * 0.15), rz: 0.5, seg: 7, rings: 3, ry: i * 40, key: 'rocks_5', tint: 0x9a9a92 }); }
      k.feat({ k: 'arch', id: 'cam:f:pool', x: mx(5.6), z: mz(41.4), rot: 0, y: 0, parts: P2 }); }
    P('ancient_well', 8, 38); A('fae_flower_small_blue', 3, 39); A('fae_flower_small_pink', 8.6, 43.6); A('fae_flower_small_violet', 2.6, 43.8); A('reeds', 3.4, 42.6); A('butterfly', 6, 40, { floor: true, y: 1.0 }); A('rabbit', 9, 40.6, { face: 250 });
    /* the hollow oak: one great tree, lanterns in its roots, caps */
    k.feat({ k: 'tree', x: r2(mx(30.5)), z: r2(mz(42.5)), kind: 'tree_52', h: 15, r: 1.3 });
    A('meshy_hanging_lantern', 29.4, 41.6, { y: 2.6 }); A('meshy_hanging_lantern', 31.8, 43.2, { y: 3.0 }); A('woods_glowcap', 29, 43.6, { noLight: true }); A('woods_glowcap', 32, 41.4, { noLight: true }); A('fern', 28, 40.4); A('fern', 33, 44.4); A('mushroom2', 28.4, 44.6);
    /* the lantern glade: stone lanterns at its corners, flowers, a stump */
    P('stone_lantern', 38, 37); P('stone_lantern', 45, 37); P('stone_lantern', 38, 44); P('stone_lantern', 45, 44); A('fae_flower_small_pink', 41, 38.4); A('fae_flower_small_blue', 43.6, 43.4); A('stump', 44.5, 40.5); A('fern', 39.4, 42.6); A('firefly', 42, 40.6, { y: 1.3 }); A('firefly', 40.4, 39, { y: 1.6 });
    /* the moth glade and the mossy stair: moths over the walk's west turn, stepping stones and caps on its east turn */
    A('luna_moth', 4, 26.6, { floor: true, y: 1.5 }); A('hawk_moth', 8.4, 29.4, { floor: true, y: 1.2 }); A('moth_frames', 6.4, 31.6, { floor: true, y: 1.3 }); A('fern', 6.6, 27.4); A('fae_toadstool', 9.6, 27.5, { noLight: true });
    A('psxg_stepping_stone_1', 39.4, 26.4); A('psxg_stepping_stone_2', 40.6, 27.4); A('psxg_stepping_stone_1', 39.6, 30.4); A('woods_glowcap', 42.6, 29.4, { noLight: true }); A('fern', 37.6, 31.6); A('fae_toadstool', 42.4, 25.6, { noLight: true });

    /* the air: fireflies in the hollow and the lantern glade, violet motes over the south loop, sea-green motes at the pool */
    k.air({ x0: mx(25), z0: mz(26), x1: mx(35), z1: mz(36), kind: 'fireflies', n: 46 });
    k.air({ x0: mx(37), z0: mz(36), x1: mx(46), z1: mz(45), kind: 'fireflies', n: 30 });
    k.air({ x0: mx(0), z0: mz(24), x1: mx(48), z1: mz(48), kind: 'motes', color: 0xc8a0ff, n: 120 });
    k.air({ x0: mx(1), z0: mz(37), x1: mx(10), z1: mz(45), kind: 'motes', color: 0x9ae8d0, n: 30 });
    if (process.env.FROOM_DUMP) { let open = 0, all = 0;
        for (let y = 0; y < k.rows * 12; y++) { let s = ''; for (let x = 0; x < k.cols * 12; x++) { const c = k.ch(x, y), on = !!k.plot(x, y); if (on) { all++; if (k.open(x, y)) open++; } s += !on ? '.' : k.stood(x, y) && c !== 't' ? 'o' : c === 't' ? ' ' : c; if (x % 12 === 11) s += '|'; } console.log(String(y).padStart(2) + ' ' + s); if (y % 12 === 11) console.log('   ' + '-'.repeat(52)); }
        console.log('open ' + open + ' of ' + all + ' squares = ' + Math.round(100 * open / all) + ' %'); }
}
module.exports = { room };
