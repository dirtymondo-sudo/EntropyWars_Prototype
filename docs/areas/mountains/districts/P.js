/* THE MOUNTAINS · THE SNOWY PASS (district P, 12 plots of room `site_prebuilt_shasta_mountains`)
   One of the six district files of bake-mountains.js (THE DISTRICT FILES there; rules: docs/notes/areas-complexes.md "THE MOUNTAINS, THE DISTRICT FILES").
   One thread = this one file. Never edit bake-mountains.js, layout.json or another district's file without a note on the board (docs/notes/claims.md).
   After an edit: `node bake-mountains.js` (writes data.js between MOUNTAINS-BEGIN / END; `--dry-run` prints the counts only), then RULE #1.

   THE PLOTS (id, name, level; a level is 1.75 m; the plan's squares are layout.json, the tool's file):
     P04-00 The Ridge, west (18)             P05-00 The Ridge (19)                   P06-00 The Ridge, east (18)
     P04-01 The Pass Gate (12)               P05-01 The High Pass (15)               P06-01 The Switchbacks (14)
     P04-02 The Sleigh Bend (11)             P05-02 The Frozen Tarn (13)             P06-02 The Rope Bridge (13)
     P04-03 The Tree Line, west (10)         P05-03 The Tree Line (10)               P06-03 The Warming Hut (11)

   WHAT STANDS HERE TODAY
   - THE WARMING HUT (P06-03, walked into): a log cabin (ctx.cabin), a fire, two cots
   - THE PASS GATE (P04-01): two poles and a crossbar over the trail. THE HIGH PASS (P05-01): the cairn and its flags, a brazier
   - THE ROPE BRIDGE (P06-02): ranch rails either side of the planks and along both lips of the crevasse (the slot is sunk 9 m by the tool)
   - A sleigh and a snowman at the Sleigh Bend, a tent at the Frozen Tarn, an eagle on the Ridge, rocks, logs, a wolf at the Tree Line

   KNOWN MISSING OR WRONG
   - NEVER SEEN ON SCREEN: the first delivery was compiled headless only (no NaN, every door resolves); mondo has not looked at it. Your first job is a probe run and pictures (RULE #1c)
   - Thin: twelve plots hold about thirty pieces. The Ridge (three plots at level 18-19) is bare rock and three stones. The Frozen Tarn has no tarn (no `pool` row)
   - The bridge is rails over painted planks: no deck row, no rope look. No encounter table, nobody lives here

   THE TOOL'S, NOT YOURS (shared pieces that stand in this district)
   - The Pass Gate door `pass` (P04-01, west wall, to the North Pole)
   - The plan's two cuts here: the hub of P06-02 and the extra port P05-00 S (makeRoom opts in the tool)
   - The heights (the crevasse too), the paint, the tree zones, the sky, the edges; ctx.cabin (the log building, shared with district K)

   THE HOOKS (export any of them; ctx is described in bake-mountains.js "THE DISTRICT FILES")
   - tailor(t)   before the trails are cut: t.set(plotId, lx, ly, ch) / t.get(plotId, lx, ly) change a square of YOUR plots (the letters: layout.json `legend`)
   - apply(ctx)  the standing things: buildings you walk into (ctx.building), anything that takes squares before the dressing
   - build(ctx)  the dressing: put (a blocker on a square's middle), dec (decor, jittered), tree, native, look (an `arch` parts list), feat (any terrain row)
   Squares are S(plotId, lx, ly), 0..11 in a plot, x east, y south. S() throws on a plot that is not this district's. Your own random stream: ctx.rnd.
   A blocker stands centred on a whole 3.5 m square (owner-rules.md); the tool throws on a piece in the rock or on a taken square. */
'use strict';

exports.apply = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* THE WARMING HUT, on the tree line under the pass */
  const HUT = building('hut', 'P06-03', [4, 3, 8, 6, 'S'], 3.5, {}, (a, w, d, dr) => cabin(a, w, d, dr, { h: 3.5, rh: 2.6, chimney: 4.5, name: 'WARMING HUT' }));
  HUT.put('campfire', 4.5, -3.3); HUT.put('cot', -5, -3.4, { face: 0 }); HUT.put('cot', -5, 0.4, { face: 0 }); HUT.put('locker_bench', 1, -4.2, { face: 0 }); HUT.put('rug_round', 1.5, -1, { y: 0.17 }); HUT.put('xmas_cocoa', 1, -4.2, { y: 0.5 });
  HUT.put('psx_wooden_crate_2', 5.6, 3.4); HUT.put('railway_lantern', -1.5, 3.6);
};

exports.build = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
    const DARK = 0x3a2a20;
  /* ── THE SNOWY PASS ── */
  { const q = S('P04-01', 2, 4); look('passgate', gx(q[0]), gz(q[1] + 1), a => { for (const s of [-1, 1]) a.cyl(0, 0, s * 4.2, 0.28, 5.2, WD2, DARK, { seg: 8 }); a.box(0, 4.6, 0, 0.4, 0.4, 9.6, WD2, DARK); a.box(0, 5.1, 0, 0.5, 0.25, 11, WD2, 0x8a2a20); }); }
  put('P04-01', 'ocean_rock', 4, 3); dec('P04-01', 'ocean_rock_2', 5, 3); put('P04-01', 'signpost', 4, 7, { face: 270 }); dec('P04-01', 'railway_lantern', 3, 6);
  { const q = S('P05-01', 5, 5); look('highpass', mx(q[0]), mz(q[1]), a => { for (let i = 0; i < 5; i++) a.cyl(0, i * 0.7, 0, 1.3 - i * 0.22, 0.7, 'rocks_5', i % 2 ? 0x9a9aa0 : 0x86868c, { seg: 7 }); a.cyl(0, 3.5, 0, 0.07, 3.2, WD2, DARK, { seg: 6 });
        [0xc83030, 0x3060c8, 0xf0d040, 0x30a050, 0xf4f4f4].forEach((c, i) => a.box(0.5 + i * 0.5, 6.2 - i * 0.35, 0, 0.4, 0.34, 0.03, null, c)); }); R.taken.add(q[0] + ':' + q[1]); }   // THE HIGH PASS (the landmark): the cairn and its flags
  put('P05-01', 'brazier', 7, 6); dec('P05-01', 'cave_stone', 3, 6); put('P06-01', 'signpost', 3, 5, { face: 90 }); dec('P06-01', 'ocean_rock_3', 4, 3);
  put('P05-00', 'ocean_rock_4', 6, 3); dec('P05-00', 'eagle', 8, 4, { y: 0.02 }); dec('P04-00', 'cave_stone', 5, 5); dec('P06-00', 'cave_stone', 3, 4);
  put('P04-02', 'sleigh', 5, 6, { face: 30 }); put('P04-02', 'xmas_snowman', 3, 7); put('P05-02', 'camping_tent', 5, 3, { face: 200 }); dec('P05-02', 'sea_chest', 9, 3);
  { const p = R.byId['P06-02'], z0 = gz(p.ly * N + 5), z1 = gz(p.ly * N + 7), xa = gx(p.lx * N + 5), xb = gx(p.lx * N + 7);   // THE ROPE BRIDGE: planks over the crevasse, a rope rail either side (a wall: nobody falls in)
    for (const x of [xa + 0.15, xb - 0.15]) feat({ k: 'rail', x0: x, z0: r2(z0 - 1.2), x1: x, z1: r2(z1 + 1.2), model: 'ranch' });
    for (const [x0, x1] of [[gx(p.lx * N), xa], [xb, gx(p.lx * N + N)]]) for (const z of [r2(z0 - 0.4), r2(z1 + 0.4)]) feat({ k: 'rail', x0, z0: z, x1, z1: z, model: 'ranch' });   // …and along both lips of the slot
    put('P06-02', 'signpost', 5, 3, { face: 180 }); dec('P06-02', 'meshy_rope', 7, 8); }
  dec('P04-03', 'fallen_log', 5, 5); dec('P04-03', 'wolf', 4, 6); dec('P05-03', 'stump', 5, 6); tree('P05-03', 'xmas_snow_pine', 6, 6, 5); dec('P06-03', 'fallen_log', 3, 6); put('P06-03', 'signpost', 8, 6, { face: 0 });
};
