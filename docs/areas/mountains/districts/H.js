/* THE MOUNTAINS · THE HOLLYWOOD HILLS (district H, 39 plots of room `site_prebuilt_shasta_hills`)
   One of the six district files of bake-mountains.js (THE DISTRICT FILES there; rules: docs/notes/areas-complexes.md "THE MOUNTAINS, THE DISTRICT FILES").
   One thread = this one file. Never edit bake-mountains.js, layout.json or another district's file without a note on the board (docs/notes/claims.md).
   After an edit: `node bake-mountains.js` (writes data.js between MOUNTAINS-BEGIN / END; `--dry-run` prints the counts only), then RULE #1.

   THE PLOTS (id, name, level; a level is 1.75 m; the plan's squares are layout.json, the tool's file):
     H00-00 The Saddle (19)                  H01-00 The Fire Road (19)               H02-00 The Burn (19)
     H03-00 The Boulders (20)                H04-00 The Lookout Rock (20)            H05-00 The Radio Mast (20)
     H06-00 The Ridge Trail (20)             H07-00 Behind the Letters, west (20)    H08-00 The Peak (22)
     H09-00 Behind the Letters, east (20)    H10-00 The Water Tank (19)              H11-00 The Headland (17)
     H12-00 The Sea Cliff (8)                H00-01 The Shasta Road (15)             H01-01 The Reservoir (15)
     H02-01 The Dam (15)                     H03-01 The Oak Canyon (15)              H04-01 The Old Quarry (15)
     H05-01 The Horse Trail (15)             H06-01 The Sign, D I S (16)             H07-01 The Sign, A S T (16)
     H08-01 The Sign, E R C (16)             H09-01 The Sign, I T Y (16)             H10-01 The Observatory (15)
     H11-01 The Coast Overlook (13)          H12-01 The Cliffs (6)                   H00-02 The Dry Wash (11)
     H01-02 The Chaparral (11)               H02-02 The Gully (11)                   H03-02 The Fire Break (12)
     H04-02 The Hill House (12)              H05-02 The Hairpin (12)                 H06-02 The Hikers' Lot (12)
     H07-02 The Canyon Road (10)             H08-02 The Brush (11)                   H09-02 The Stilt House (11)
     H10-02 The Observatory Drive (12)       H11-02 The Cliff Stair (6)              H12-02 The Cove (2)

   WHAT STANDS HERE TODAY
   - THE SIGN: twelve letters DISASTER CITY on H06-01..H09-01, each an `arch` plane cut from the typeface on two steel legs; no collision, you walk under and behind them
   - Walked into (plain, mondo: "fine for now"): THE OBSERVATORY (H10-01), THE HILL HOUSE (H04-02), THE STILT HOUSE (H09-02)
   - The radio mast (H05-00), the water tank, the reservoir and the dam (two `pool` rows on ground levelled with ctx.flat), the Hikers' Lot's cars, three lookouts with telescopes, the Cove's rowboat
   - The east column (H12-00, H12-01) is sea cliff: rock and water, nobody stands there

   KNOWN MISSING OR WRONG
   - SEEN ON SCREEN in a probe (the sign from the road, under and behind the letters, the Observatory, the reservoir, the Cove); mondo has not answered on it
   - Nobody lives here (mondo: "don't worry about it yet"). No encounter table
   - The three buildings are plain boxes by the city's standard ("each one unique, purposeful and recognizable")
   - The room's own north edge still shows the old tall scenery range (the tool's `edges`)

   THE TOOL'S, NOT YOURS (shared pieces that stand in this district)
   - The doors `shasta` (H00-01) and `ridge` (H00-00) on the west wall, the Canyon Road's way down to the city (H08-02, link `downtown_mountains`) and the Cove's (H12-02, link `downtown_cove`)
   - THIS ROOM'S GROUND IS DISASTER CITY'S NORTH SKYLINE: the city reads this room's heights and paint at load (three-renderer.js _hqEdgeLandFn), and draws its own far sign where these twelve letters stand (districts/E.js edges.sign: at 84, d 66.5). Move the letters, or change a plot's squares with tailor(), and you leave a note for the city's holder on the board
   - The canyon road's squares and the two concrete pads (makeRoom `carves`), the sea (seaBed, seaShore), the heights, the paint, the sky, the edges

   THE HOOKS (export any of them; ctx is described in bake-mountains.js "THE DISTRICT FILES")
   - tailor(t)   before the trails are cut: t.set(plotId, lx, ly, ch) / t.get(plotId, lx, ly) change a square of YOUR plots (the letters: layout.json `legend`)
   - apply(ctx)  the standing things: buildings you walk into (ctx.building), anything that takes squares before the dressing
   - build(ctx)  the dressing: put (a blocker on a square's middle), dec (decor, jittered), tree, native, look (an `arch` parts list), feat (any terrain row)
   Squares are S(plotId, lx, ly), 0..11 in a plot, x east, y south. S() throws on a plot that is not this district's. Your own random stream: ctx.rnd.
   A blocker stands centred on a whole 3.5 m square (owner-rules.md); the tool throws on a piece in the rock or on a taken square. */
'use strict';

exports.apply = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* ── THE SIGN: twelve letters, each a standing plane cut from the typeface (the city's own sign's font), two legs behind it; you walk under and behind them ── */
  { const WORD = 'DISASTERCITY', LW = 9.4, LH = 13.6, STEEL = U('MetalWallRibbed1a');
    ['H06-01', 'H07-01', 'H08-01', 'H09-01'].forEach((id, pi) => [2, 6, 10].forEach((lx, li) => { const ch = WORD[pi * 3 + li], q = S(id, lx, 5), n = pi * 3 + li, lift = [0, 0, 0, 0, 0, 0, 0, 0, -1.2, 0, 0, -2.2][n], tilt = [0, 0, 5, 0, 0, 0, -4, 0, 0, 0, 0, 7][n];
        look('sign' + n, gx(q[0]), gz(q[1]), a => { a.quad(0, 1.2 + lift, 0, LW, LH, 'txt:' + ch + '|#f6f4ec||' + r2(LW / LH) + '||anton', null, Object.assign({ uv: 'fit', kind: 'over', ds: true }, tilt ? { rz: tilt } : {}));
            for (const sx of [-1, 1]) { a.box(sx * 2.6, 0, -0.9, 0.36, 10.5 + lift, 0.36, STEEL, 0x8a8e94); a.box(sx * 2.6, 6 + lift, -0.45, 0.2, 0.2, 0.9, STEEL, 0x8a8e94); }
            a.box(0, 3.2 + lift, -0.9, 5.6, 0.2, 0.2, STEEL, 0x8a8e94); });
        for (const d of [-1, 0]) R.taken.add((q[0] + d) + ':' + q[1]); })); }
  /* ── THE BUILDINGS (plain labels of the plan: mondo "fine for now") ── */
  const STUCCO = U('PlasterWallStucco1a'), WHITE = 0xf2efe6, DARKW = 0x3a2a20, DGLASS = 0x20303a;
  /* THE OBSERVATORY: white, a copper dome on a drum, two small domes on its wings */
  const OBS = building('observatory', 'H10-01', [3, 3, 9, 7, 'S'], 6, { leafDouble: true, keyIn: 'marble_light', floorIn: 'marble_light' }, (a, w, d, dr) => {
      a.shell(w, 6, d, 'marble_light', WHITE, dr); a.box(0, 6, 0, w + 0.8, 0.5, d + 0.8, 'marble_light', 0xe6e2d6, { roof: true, under: true });
      a.cyl(0, 6.5, 0, 4.6, 2.2, 'marble_light', WHITE, { seg: 20, roof: true }); a.dome(0, 8.7, 0, 4.8, 4.2, U('MetalWallRibbed1a'), 0x5a8a78, { roof: true });
      for (const sx of [-1, 1]) { a.cyl(sx * (w / 2 - 2.6), 6.5, 0, 2.0, 1.2, 'marble_light', WHITE, { seg: 14, roof: true }); a.dome(sx * (w / 2 - 2.6), 7.7, 0, 2.1, 1.9, U('MetalWallRibbed1a'), 0x5a8a78, { roof: true }); }
      for (let x = -w / 2 + 0.3; x <= w / 2 - 0.2; x += (w - 0.6) / 6) { if (Math.abs(x - dr.lx) < 1.2) continue; a.box(x, 0, d / 2 + 0.12, 0.6, 6, 0.24, 'marble_light', 0xe6e2d6); }
      a.sign('OBSERVATORY', 0, 4.4, d / 2 + 0.3, 9, 1.0, '#2a2a30', '', 'anton', { kind: 'over' }); });
  OBS.put('brass_telescope', 0, -1.5); OBS.put('brass_orrery', -6.5, -3.5); OBS.put('telescope', 6.5, -3.5, { face: 200 }); OBS.put('globe_lamp', -8.5, 4.5); OBS.put('lectern', 3, 3.5, { face: 180 }); OBS.put('iron_garden_bench', -4, 5.2, { face: 0 });
  /* THE HILL HOUSE: one storey, a flat roof that sails out over a wall of dark glass */
  const HOUSE = building('hillhouse', 'H04-02', [7, 3, 11, 5, 'S'], 3.5, { keyIn: STUCCO, floorIn: FLR }, (a, w, d, dr) => {
      a.shell(w, 3.5, d, STUCCO, WHITE, dr); a.box(0, 3.5, 0.9, w + 2.6, 0.3, d + 3.4, WD2, DARKW, { roof: true, under: true });
      for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - dr.lx) < 1.7) continue; a.box(x, 0.3, d / 2 + 0.06, 2.9, 2.9, 0.08, GLS, DGLASS, { glow: 0.15 }); }
      a.box(-w / 2 - 0.6, 0, 0.9, 0.4, 3.5, d + 2.2, 'rocks_5', 0x9a9088); });
  HOUSE.put('psx_sofa_3', -3.5, -2.2, { face: 0 }); HOUSE.put('psx_tv_table_1', -3.5, 1.6, { face: 180 }); HOUSE.put('tube_tv', -3.5, 1.6, { y: 0.6, face: 180 }); HOUSE.put('psx_bed_1', 4.6, -1.6, { face: 0 }); HOUSE.put('retro_radio', 6.2, 1.8, { y: 0 });
  /* THE STILT HOUSE: timber, a deck out over the drop */
  const STILT = building('stilthouse', 'H09-02', [3, 3, 9, 8, 'S'], 3.5, { keyIn: WD, floorIn: FLR }, (a, w, d, dr) => {
      a.shell(w, 3.5, d, WD, 0xb8946a, dr, [3.5, 1.75]); a.box(0, 3.5, 0.6, w + 1.6, 0.3, d + 2.4, WD2, DARKW, { roof: true, under: true });
      for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - dr.lx) < 1.7) continue; a.box(x, 0.6, d / 2 + 0.06, 2.6, 2.4, 0.08, GLS, DGLASS, { glow: 0.15 }); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * (w / 2 - 0.3), -6, sz * (d / 2 - 0.3), 0.4, 6, 0.4, WD2, DARKW); });
  STILT.put('curved_sofa', -5, -4.5, { face: 0 }); STILT.put('coffee_table', -5, -2.2); STILT.put('decor_piano', 6, -5.5, { face: 300 }); STILT.put('couples_bed', 6.5, 4.5, { face: 270 }); STILT.put('rug_round', -5, -2.2, { y: 0.17 }); STILT.put('retro_radio', -9, 6);
};

exports.build = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* ── THE RIDGE (row 0) ── */
  put('H00-00', 'signpost', 4, 4, { face: 90 }); dec('H00-00', 'cave_stone', 7, 7); dec('H01-00', 'fallen_log', 2, 8); dec('H01-00', 'dead_snag', 9, 9);
  dec('H02-00', 'dead_snag', 3, 9); dec('H02-00', 'stump', 4, 8); dec('H02-00', 'dead_snag', 8, 9); put('H03-00', 'ocean_rock_4', 3, 8); put('H03-00', 'ocean_rock_6', 8, 9);
  put('H04-00', 'telescope', 6, 2, { face: 180 }); put('H04-00', 'park_bench', 7, 3, { face: 180 });
  { const q = S('H05-00', 6, 3); look('mast', gx(q[0]), gz(q[1]), a => { const ST = U('MetalWallRibbed1a');   // THE RADIO MAST: a red and white lattice with a light on top
        for (let i = 0; i < 6; i++) a.box(0, i * 5, 0, 0.9 - i * 0.1, 5, 0.9 - i * 0.1, ST, i % 2 ? 0xf0f0f0 : 0xc83030); for (const y of [9, 19, 27]) a.box(0, y, 0, 3.2, 0.14, 0.14, ST, 0x8a8e94);
        a.box(0, 30, 0, 0.3, 0.3, 0.3, null, 0xff3020, { glow: 1 }); a.box(0, 0, 0, 3.4, 0.5, 3.4, 'rocks_5', 0x9a9aa0); });
    for (const d of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) R.taken.add((q[0] + d[0]) + ':' + (q[1] + d[1])); }
  put('H06-00', 'park_bench', 5, 7, { face: 180 }); dec('H07-00', 'cave_stone', 8, 8); put('H08-00', 'signpost', 5, 3, { face: 180 }); dec('H08-00', 'eagle', 7, 2, { y: 0.02 }); dec('H09-00', 'cave_stone', 4, 8);
  put('H10-00', 'water_tower_west', 4, 2); put('H11-00', 'telescope', 8, 4, { face: 180 }); put('H11-00', 'park_bench', 7, 7, { face: 180 });

  /* ── THE LETTERS' SLOPE (row 1) ── */
  put('H00-01', 'signpost', 2, 4, { face: 90 });
  /* THE RESERVOIR + THE DAM: level water behind a concrete wall walk */
  flat('H01-01', 2, 0, 5, 4); { const a = S('H01-01', 2, 0); feat({ k: 'pool', x: gx(a[0] + 1.5), z: gz(a[1] + 2), r: 5.0, rz: 6.6, y: -0.3, depth: 1.2, key: 'water', bank: 0.6 }); }
  { const a = S('H01-01', 7, 0); R.flats.push([a[0], a[1], a[0] + 10, a[1] + 4, 'S']); feat({ k: 'pool', x: gx(a[0] + 4), z: gz(a[1] + 2), r: 13.6, rz: 6.6, y: -0.3, depth: 1.6, key: 'water', bank: 0.6 });
    const d = S('H02-01', 5, 0); feat({ k: 'rail', x0: r2(gx(d[0]) + 0.2), z0: gz(d[1]), x1: r2(gx(d[0]) + 0.2), z1: gz(d[1] + 4), model: 'pipe' }); }
  put('H04-01', 'car_truck', 7, 3, { face: 90 }); dec('H04-01', 'traffic_cone', 3, 3); dec('H04-01', 'traffic_cone', 4, 4); put('H05-01', 'horse_brown', 5, 10, { face: 90 }); put('H05-01', 'horse', 8, 10, { face: 250 });
  put('H10-01', 'telescope', 8, 8, { face: 180 }); put('H10-01', 'city_bench', 3, 8, { face: 180 });
  flat('H11-01', 6, 6, 11, 11); put('H11-01', 'telescope', 9, 7, { face: 180 }); put('H11-01', 'city_bench', 8, 9, { face: 180 }); put('H11-01', 'car_cadillac', 7, 7, { face: 90 });

  /* ── THE CANYON FOOT (row 2) ── */
  dec('H00-02', 'cave_stone', 7, 3); dec('H01-02', 'stump', 8, 8); dec('H03-02', 'traffic_cone', 3, 9);
  put('H04-02', 'mailbox_bank', 6, 7); put('H04-02', 'car_suv', 2, 7, { face: 90 }); tree('H04-02', 'palm', 9, 6, 2); tree('H04-02', 'palm', 8, 11, 8);
  dec('H05-02', 'traffic_cone', 9, 7);
  flat('H06-02', 2, 3, 10, 8); put('H06-02', 'car_pack_1', 3, 4); put('H06-02', 'car_pack_3', 5, 4); put('H06-02', 'car_taxi', 8, 4); put('H06-02', 'signpost', 4, 2, { face: 180 }); put('H06-02', 'trash_bin', 9, 2);
  put('H07-02', 'signpost', 4, 10, { face: 180 }); tree('H09-02', 'palm', 9, 1, 4); tree('H09-02', 'palm', 9, 10, 4); put('H09-02', 'pool_umbrella', 10, 7); put('H09-02', 'pool_lounger', 10, 8, { face: 180 });
  put('H10-02', 'signpost', 4, 7, { face: 0 }); put('H11-02', 'signpost', 7, 7, { face: 90 });
  put('H12-02', 'rowboat', 1, 9, { face: 70 }); put('H12-02', 'pool_umbrella', 2, 8); tree('H12-02', 'palm', 8, 0, 8); dec('H12-02', 'ocean_rock', 3, 10);
};
