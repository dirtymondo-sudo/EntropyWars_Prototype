/* LEYLINES · district G · GOBEKLI TEPE (9 plots: P00..P02 x rows 00..02; squares x 0..35, y 0..35). One thread a file.
   STANDS TODAY (first build): the tell (a flat-topped mound 5 m up, the tool's heights); the Four Enclosures A to D sunk a metre into its top,
   each a ring of eight T-pillars round two taller ones, a stone kerb, a fire; the Sentinel on its knoll; the Dig (two trenches with earth ramps,
   tools, crates); the Dig Camp (three tents, the finds table's boxes, a fire); the Cistern; the First Doorway (two pillars: Room 9600's door
   stands between them); dry snags; the old Tell's four people and their lines.
   NOT YET: the dig's shelter roofs and scaffold walks (no tarp / canopy model: NEEDS A MODEL), carved animals on the pillars, rope fences,
   the benches between the ring pillars as real walls, a path of planks, lights at night beyond the five fires. */
'use strict';
exports.build = ctx => {
    const { A, C, feat, look, gx, gz, cx, cz } = ctx;
    A.enclosures.forEach(e => { feat({ k: 'dip', x: cx(e[0]), z: cz(e[1]), r: 9.6, h: 1.0 });
        look('gobekli:kerb:' + e[2], cx(e[0]), cz(e[1]), 0, a => a.cyl(0, -0.15, 0, 9.5, 0.65, 'rock_wall_1', 0xd8c8a8, { ri: 8.8, arc: 300, a0: 120, seg: 28 }), ctx.heightAt(e[0], e[1])); });
    A.dig.forEach((q, i) => { const w = (q[2] - q[0]) * C, d = (q[3] - q[1]) * C;
        feat({ k: 'plateau', x: gx((q[0] + q[2]) / 2), z: gz((q[1] + q[3]) / 2), w, d, h: -1.2, sink: true, edge: 0.3 });
        feat({ k: 'ramp', x0: gx(q[2] + 1.5), z0: gz((q[1] + q[3]) / 2), x1: gx(q[2] - 0.5), z1: gz((q[1] + q[3]) / 2), w: 3.5, h0: 0, h1: -1.2, edge: 0.3, key: 'dirt_2' }); });
};
exports.plan = ctx => { const { cell } = ctx; for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) if (cell[y][x] === 'o') cell[y][x] = 'm'; };   // the rings' floors are stamped round (paint)
exports.paint = ctx => { const { A, cx, cz } = ctx; ctx.stamp((x, z) => { for (const e of A.enclosures) if (Math.hypot(x - cx(e[0]), z - cz(e[1])) < 8.5) return 'cobblestone'; return null; }); };
exports.dress = ctx => {
    const { A, P, Pm, dec, cx, cz, rnd } = ctx;
    A.enclosures.forEach(e => { [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]].forEach(o => { if (o[0] === -1 && o[1] === 2 || o[0] === 1 && o[1] === 2) return;   // the way in, from the south
            P('t_pillar', e[0] + o[0], e[1] + o[1], { h: 3.3, face: Math.round(90 - Math.atan2(-o[1], o[0]) * 180 / Math.PI) }); });
        P('t_pillar', e[0] - 1, e[1], { h: 4.8, face: 0 }); P('t_pillar', e[0] + 1, e[1], { h: 4.8, face: 0 }); P('brazier', e[0], e[1] - 1); });
    P('t_pillar', A.sentinel.x, A.sentinel.y, { h: 6.6, face: 20 }); dec('cave_stone', A.sentinel.x + 1, A.sentinel.y + 1); P('brazier', A.sentinel.x - 1, A.sentinel.y + 2);
    P('ancient_well', A.cistern.x, A.cistern.y, { h: 1.5 }); dec('wooden_bucket', A.cistern.x + 1, A.cistern.y); P('signpost', A.cistern.x - 1, A.cistern.y + 2, { face: 270 });
    /* THE FIRST DOORWAY: two pillars, nothing between them but the door */
    P('t_pillar', A.doorway.x - 1, A.doorway.y, { h: 3.6, face: 0 }); P('t_pillar', A.doorway.x + 1, A.doorway.y, { h: 3.6, face: 0 }); P('signpost', A.doorway.x + 2, A.doorway.y - 2, { face: 160 });
    /* THE DIG */
    dec('wheelbarrow', 10, 3); dec('pickaxe', 4, 4, { y: -1.2 }); dec('hw_shovel', 6, 3, { y: -1.2 }); dec('pickaxe', 5, 8, { y: -1.2 }); dec('wooden_bucket', 7, 9, { y: -1.2 }); dec('psx_wooden_crate_1', 10, 9); dec('psx_wooden_crate_1', 11, 8); dec('cardboard_boxes', 1, 6); dec('wheelbarrow', 1, 11);
    P('signpost', 11, 5, { face: 90 });
    /* THE DIG CAMP */
    P('canvas_tent', 4, 15, { face: 180 }); P('canvas_tent', 7, 15, { face: 180 }); P('canvas_tent', 4, 20, { face: 0 }); P('campfire', 6, 18); dec('cardboard_boxes', 7, 20); dec('cardboard_boxes', 8, 19); dec('paper_sheet', 7, 19, { y: 0.01 }); dec('paper_sheet', 5, 17, { y: 0.01 });
    P('sea_chest', 8, 21, { face: 90 }); dec('folding_chair', 5, 19); dec('folding_chair', 7, 17);
    /* the dry slope: snags and loose stone */
    [[28, 26], [31, 30], [33, 24], [26, 32], [34, 33], [2, 26], [9, 28], [12, 33], [33, 11], [27, 2], [22, 1], [14, 1]].forEach((q, i) => dec(i % 3 ? 'dead_snag' : 'psxg_rock_3', q[0], q[1], i % 3 ? {} : { h: 1.0 }));
    [[25, 27], [29, 34], [1, 30], [34, 15]].forEach(q => dec('cattle_skull', q[0], q[1]));
};
exports.people = ctx => { const { native, sayOf, OLD } = ctx;
    native('annunaki', 24, 16, 240, sayOf(OLD.tell, 'annunaki')); native('grey', 17, 8, 180, sayOf(OLD.tell, 'grey')); native('shaman', 10, 16, 80, sayOf(OLD.tell, 'shaman')); native('conspiracy theorist', 8, 30, 200, sayOf(OLD.tell, 'conspiracy theorist')); };
exports.airZones = () => [{ sx0: 0, sy0: 0, sx1: 36, sy1: 36, kind: 'dust', color: 0xe8d8b8, n: 70 }];
