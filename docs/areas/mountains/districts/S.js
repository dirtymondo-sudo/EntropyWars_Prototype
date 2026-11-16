/* THE MOUNTAINS · MOUNT SHASTA (district S, 20 plots of room `site_prebuilt_shasta_mountains`)
   One of the six district files of bake-mountains.js (THE DISTRICT FILES there; rules: docs/notes/areas-complexes.md "THE MOUNTAINS, THE DISTRICT FILES").
   One thread = this one file. Never edit bake-mountains.js, layout.json or another district's file without a note on the board (docs/notes/claims.md).
   After an edit: `node bake-mountains.js` (writes data.js between MOUNTAINS-BEGIN / END; `--dry-run` prints the counts only), then RULE #1.

   THE PLOTS (id, name, level; a level is 1.75 m; the plan's squares are layout.json, the tool's file):
     P13-00 Shastina (18)                    P14-00 The Summit (22)                  P15-00 The Glacier (18)
     P13-01 The Red Banks (17)               P14-01 Helen Lake (15)                  P15-01 The Steam Vents (16)
     P13-02 Avalanche Gulch (13)             P14-02 The Fork (12)                    P15-02 The Scree (13)
     P13-03 Bunny Flat (10)                  P14-03 Panther Meadows (10)             P15-03 The Old Lava (10)
     P13-04 The Last Trees (9)               P14-04 The Spring (9)                   P13-05 The Switchback, upper (9)
     P14-05 The Lookout (9)                  P13-06 The Switchback, lower (8)        P14-06 The Boulder Field (8)
     P13-07 The Trailhead (8)                P14-07 The Upper Shelf (8)

   WHAT STANDS HERE TODAY
   - THE SUMMIT (P14-00): stones round the crater, a cloud parked over it. Helen Lake's camp (two tents, a fire, a yeti). THE STEAM VENTS (P15-01): a warm pool, a nordic, and the Lemuria adit's door spot (link `shasta_lemuria`, ctx.anchor('lemuria'))
   - BUNNY FLAT (P13-03): a camp, a bigfoot, and DOOR HQ's bay door (Room 14179's cabin door, ctx.anchor('bayShasta')). PANTHER MEADOWS (P14-03): a candle ring, instruments, a shaman and a ki fighter
   - The trail down (rows 4-7): the Spring (a pool and a deck), the Lookout's bench, the Boulder Field, the Trailhead's fire and signpost
   - No building is walked into in this district

   KNOWN MISSING OR WRONG
   - Only the Goat Track's way into Bunny Flat was seen on screen (one probe view). The rest: never. mondo has not looked
   - The largest district (20 plots) with the least on it: no building at all; Helen Lake has no lake; the Glacier, Shastina, the Red Banks, the Scree and the Old Lava hold one or two stones each
   - The Upper Shelf (P14-07) has no door down to the Woods (the plan drew two joins; only the Trailhead's is cut). That door would be the tool's and the Woods holder's: ask on the board
   - No encounter table

   THE TOOL'S, NOT YOURS (shared pieces that stand in this district)
   - The Trailhead's door `woods` (P13-07, south wall; bake-woods.js holds the far end), the doors `hills` (the Scree, P15-02) and `saddle` (the Glacier, P15-00) on the east wall to the Hollywood Hills
   - The heights, the paint (volcanic rock, dirt trail under level 12), the tree zones, the sky, the edges

   THE HOOKS (export any of them; ctx is described in bake-mountains.js "THE DISTRICT FILES")
   - tailor(t)   before the trails are cut: t.set(plotId, lx, ly, ch) / t.get(plotId, lx, ly) change a square of YOUR plots (the letters: layout.json `legend`)
   - apply(ctx)  the standing things: buildings you walk into (ctx.building), anything that takes squares before the dressing
   - build(ctx)  the dressing: put (a blocker on a square's middle), dec (decor, jittered), tree, native, look (an `arch` parts list), feat (any terrain row)
   Squares are S(plotId, lx, ly), 0..11 in a plot, x east, y south. S() throws on a plot that is not this district's. Your own random stream: ctx.rnd.
   A blocker stands centred on a whole 3.5 m square (owner-rules.md); the tool throws on a piece in the rock or on a taken square. */
'use strict';

exports.build = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* ── MOUNT SHASTA ── */
  put('P14-00', 'cave_stone', 5, 5); dec('P14-00', 'cave_stone', 6, 7); put('P14-00', 'signpost', 7, 8, { face: 180 }); props.push({ key: 'white_cloud', x: mx(S('P14-00', 5, 5)[0]), z: mz(S('P14-00', 5, 5)[1]), y: 16, h: 7 });   // THE SUMMIT: the crater, the cloud parked over it
  dec('P13-00', 'cave_stone', 5, 4); dec('P15-00', 'ocean_rock_5', 6, 5); dec('P13-01', 'cave_stone', 5, 5); dec('P13-01', 'cave_stone', 4, 6);
  put('P14-01', 'camping_tent', 3, 4, { face: 140 }); put('P14-01', 'camping_tent', 8, 4, { face: 220 }); put('P14-01', 'campfire', 5, 3); dec('P14-01', 'sea_chest', 6, 2); native('P14-01', 'yeti', 7, 9, 300, say('shasta', 'yeti'));
  { const q = S('P15-01', 5, 6); feat({ k: 'pool', x: mx(q[0]), z: mz(q[1]), r: 3.6, rz: 3.0, y: -0.2, depth: 0.5, key: 'water', bank: 0.8 }); R.taken.add(q[0] + ':' + q[1]);   // THE STEAM VENTS: the warm pool
    const d = S('P15-01', 8, 6); R.anchor('lemuria', { x: mx(d[0]), z: mz(d[1]), face: 270 }); R.taken.add(d[0] + ':' + d[1]); }
  native('P15-01', 'nordic', 3, 5, 90, say('shasta', 'nordic')); dec('P15-01', 'cave_stone', 4, 8); dec('P15-01', 'cave_stone', 6, 9);
  dec('P13-02', 'ocean_rock_6', 5, 6); dec('P13-02', 'ocean_rock_7', 4, 7); put('P14-02', 'signpost', 5, 4, { face: 0 }); dec('P15-02', 'cave_stone', 3, 5); dec('P15-02', 'ocean_rock_8', 4, 6);
  put('P13-03', 'campfire', 4, 6); put('P13-03', 'camping_tent', 2, 5, { face: 120 }); put('P13-03', 'camping_tent', 6, 7, { face: 240 }); put('P13-03', 'park_bench', 4, 8, { face: 0 }); put('P13-03', 'signpost', 6, 4, { face: 180 });
  native('P13-03', 'bigfoot', 2, 7, 60, say('shasta', 'bigfoot')); dec('P13-03', 'fallen_log', 5, 9);
  dec('P14-03', 'candle_ring', 5, 6); dec('P14-03', 'instrument_drum', 6, 6); dec('P14-03', 'instrument_tambourine', 4, 7); dec('P14-03', 'instrument_guitar_lying', 6, 8); native('P14-03', 'shaman', 5, 5, 180); native('P14-03', 'ki fighter', 8, 7, 270);
  dec('P15-03', 'cave_stone', 4, 6); dec('P15-03', 'dead_snag', 5, 7);
  { const q = S('P13-03', 8, 6); R.anchor('bayShasta', { x: mx(q[0]), z: mz(q[1]), face: 270 }); R.taken.add(q[0] + ':' + q[1]); }   // Room 14179's cabin door stands on Bunny Flat
  /* the trail down to the Woods */
  dec('P13-04', 'fallen_log', 7, 5); dec('P13-04', 'stump', 6, 6); { const q = S('P14-04', 6, 6); feat({ k: 'pool', x: mx(q[0]), z: mz(q[1]), r: 5.0, rz: 5.0, y: -0.25, depth: 0.8, key: 'water', bank: 1.0 }); }   // THE SPRING
  { const a = S('P14-04', 6, 9), b = S('P14-04', 6, 11); feat({ k: 'deck', x0: mx(a[0]), z0: r2(gz(a[1]) - 1.75), x1: mx(a[0]), z1: r2(gz(b[1] + 1) + 1.75), w: 3.5, y: 0.3 }); }
  put('P14-05', 'park_bench', 6, 8, { face: 90 }); put('P14-05', 'lesson_sign', 4, 7, { face: 180 }); dec('P13-05', 'cave_stone', 6, 4);
  for (const d of [[6, 5], [8, 5], [5, 6], [9, 7], [7, 8]]) put('P14-06', 'cave_stone', d[0], d[1]); dec('P13-06', 'fallen_log', 6, 3);
  put('P13-07', 'signpost', 5, 5, { face: 180 }); put('P13-07', 'campfire', 7, 4); dec('P14-07', 'cave_stone', 7, 4); dec('P14-07', 'sea_chest', 8, 3);
};
