/* KATANA ISLAND, district J: THE JUNGLE (world polish thread 21, 2026-11-20). bake-katana.js runs build(ctx). ISLAND squares.
   mondo 11-20: "There can still be dinosaurs, there can still be jungle". Five plots: the East Shore 1 (x 72..83, y 24..35) · the Dinosaur Park 2
   (x 60..71, y 24..35) · the Jungle 3 (x 60..71, y 36..47) · the Jungle north 5 (x 60..71, y 12..23) · the Jungle Rise 6 (x 48..59, y 24..35).
   WHAT CAME OVER FROM THE VOLCANO ISLAND (nothing of it is lost): the fenced DINOSAUR PARK (the paddock, its gate and sign, the timber lookout, the
   keeper's hut, the dig with the skeleton and two tents, four dinosaurs) and THE TRIBE'S CAMP (two walk-in thatch huts, the idol shrine with its
   altar and standing stones, totem poles, the watch fire, torches), which stands in the Jungle north now.
   LEVEL ON PURPOSE: the paddock (7 x 7 squares). The Shore Road ends at the park; the Wild Way climbs from it to the crater. */
'use strict';
module.exports = {
    reach: [[67, 32, 'the Dinosaur Park’s gate'], [68, 27, 'the paddock'], [62, 16 + 2, 'the tribe’s camp'], [76, 28, 'the East Shore'], [56, 22 + 4, 'the Jungle Rise'], [63, 40, 'the Jungle']],
    build(ctx) {
        const { rnd, thatch, r2 } = ctx, B = {};
        const P = (key, x, y, o) => { if (ctx.open(x, y)) ctx.P(key, x, y, o); };
        /* ── THE DINOSAUR PARK: the paddock of bare earth x 65..71, y 24..30, its gate on the south side at the way ── */
        const PK = [65, 24, 71, 30], GATE = 67;
        ctx.set(PK[0], PK[1], PK[2], PK[3], 'g', 2, { paint: 'dirt', dry: true });
        { const e0 = ctx.gx(PK[0]), e1 = ctx.gx(PK[2] + 1), n0 = ctx.gz(PK[1]), n1 = ctx.gz(PK[3] + 1), g0 = ctx.gx(GATE), g1 = ctx.gx(GATE + 1);
          ctx.feat({ k: 'rail', pts: [[g0, n1], [e0, n1], [e0, n0], [e1, n0], [e1, n1], [g1, n1]], model: 'ranch' }); ctx.props.push({ key: 'fence_with_gate', x: r2((g0 + g1) / 2), z: n1, face: 180 }); }
        for (let y = PK[1]; y <= PK[3]; y++) for (let x = PK[0]; x <= PK[2]; x++) ctx.take(x, y);
        ctx.props.push({ key: 'dinosaur_skeleton', x: ctx.gx(62), z: ctx.gz(26), face: 30 }); for (let y = 24; y <= 27; y++) for (let x = 60; x <= 63; x++) ctx.take(x, y);
        ctx.props.push({ key: 'canvas_tent', x: ctx.mx(61), z: ctx.mz(29), face: 0 }, { key: 'canvas_tent', x: ctx.mx(62), z: ctx.mz(30), face: 40 }, { key: 'campfire', x: ctx.mx(60), z: ctx.mz(30) }); [[61, 29], [62, 30], [60, 30]].forEach(q => ctx.take(q[0], q[1]));
        ctx.props.push({ key: 'timber_lookout', x: ctx.mx(70), z: ctx.mz(25), face: 225 }, { key: 'thatched_hut', x: ctx.mx(70), z: ctx.mz(33), face: 270 }, { key: 'signpost', x: ctx.mx(66), z: ctx.mz(32), face: 180 }, { key: 'lantern_post', x: ctx.mx(69), z: ctx.mz(32) });
        [[70, 33], [66, 32], [69, 32]].forEach(q => ctx.take(q[0], q[1]));
        [[66, 26, 40], [68, 28, 200], [70, 29, 270], [67, 24, 120]].forEach(q => ctx.npc.push({ x: ctx.mx(q[0]), z: ctx.mz(q[1]), face: q[2], race: 'dinosaur' }));
        /* ── THE TRIBE'S CAMP (the Jungle north): the two huts, the idol shrine, the totems, the watch fire ── */
        B.big = ctx.building('tribe_big', [60, 14, 63, 17, 'S'], 3.2, {}, (a, w, d, door) => thatch(a, w, 3.2, d, door, 0xcdb88a));
        B.north = ctx.building('tribe_north', [66, 13, 68, 15, 'S'], 2.8, {}, (a, w, d, door) => thatch(a, w, 2.8, d, door, 0xcdb88a));
        P('demon_statue', 69, 19, { face: 180 }); P('stone_altar', 69, 20, { face: 180 }); P('brazier', 68, 19); P('brazier', 70, 19); P('carved_totem_pole', 62, 19); P('carved_totem_pole', 66, 18); P('campfire', 64 + 1, 17);
        P('tiki_torch', 61, 18); P('tiki_torch', 67, 16); P('tiki_torch', 68, 21); P('drying_fish', 63, 20, { face: 90 }); P('woven_baskets', 60, 19); P('hammock', 69, 15, { face: 0 });
        ctx.props.push({ key: 'golden_idol', x: ctx.mx(69), z: ctx.mz(20), y: 1.0 });
        ctx.put(B.big, 'fur_rug', 0, -2, {}); ctx.put(B.big, 'psx_old_mattress_mp_1', -3, -3, {}); ctx.put(B.big, 'spear', 3, -4, {}); ctx.put(B.big, 'woven_baskets', 3, -1, {}); ctx.put(B.north, 'psx_old_mattress_mp_1', 0, -1.5, {}); ctx.put(B.north, 'spear', 2, -2, {});
        /* ── THE EAST SHORE: palms on the sand, canoes pulled up ── */
        ctx.props.push({ key: 'dugout_canoe', x: ctx.mx(79), z: ctx.mz(29), face: 80 }, { key: 'dugout_canoe', x: ctx.mx(78), z: ctx.mz(31), face: 110 }, { key: 'campfire', x: ctx.mx(77), z: ctx.mz(27) });
        /* ── THE JUNGLE RISE: a lookout over the park, a rope bridge's posts at the drop ── */
        P('timber_lookout', 58, 30, { face: 90 }); P('cairn', 50, 26);
        /* ── THE JUNGLE: palms, banana plants and bushes (blockers on whole squares), ferns off the middle; thick, never on a way ── */
        let n = 0;
        [[60, 36, 71, 47, 0.42], [60, 24, 71, 35, 0.3], [72, 24, 83, 35, 0.16], [48, 24, 59, 35, 0.46], [60, 12, 71, 23, 0.3]].forEach(b => ctx.sow(b[0], b[1], b[2], b[3], b[4], (x, y, v) => {
            if (v < 0.55) { if (ctx.tree('palm', x, y, 4.6 + rnd() * 3)) n++; } else if (v < 0.75) ctx.P(rnd() < 0.5 ? 'banana_plant' : 'tropical_bush', x, y, { face: Math.round(rnd() * 360) }); else ctx.dec('fern', x, y); }));
        for (let y = 24; y <= 47; y++) for (let x = 60; x <= 83; x++) if (ctx.kindAt(x, y) === 's' && ctx.free(x, y) && !ctx.onWay(x, y) && rnd() < 0.07) { if (ctx.tree('palm', x, y, 4 + rnd() * 2)) n++; }
        [['parrot', 62, 38], ['parrot', 57, 28], ['lizard', 65, 41], ['coconuts', 76, 30], ['coconuts', 78, 26]].forEach(q => ctx.dec(q[0], q[1], q[2]));
        console.log('the Jungle: ' + n + ' palms');
    },
};
