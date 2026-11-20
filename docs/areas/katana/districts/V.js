/* KATANA ISLAND, district V: THE VOLCANO (world polish thread 21, 2026-11-20). bake-katana.js runs build(ctx). ISLAND squares.
   mondo 11-20: "Still with volcano/mountain, but it might have to be a little bigger". Five plots of rolling black ground under one cone: the Black
   Cape (x 24..35, y 0..11) · the West Flank (x 24..35, y 12..23) · the Crater (x 36..47, y 12..23; the rim 31.5 m, the lava inside 26.5 m) · the East
   Flank (x 48..59, y 12..23) · the Lava Field (x 36..47, y 24..35). The tool shapes the cone; this file dresses it.
   The Mountain Road reaches the rim by switchbacks on the West Flank; the Wild Way comes up the East Flank. The volcano is the island's landmark.
   No modelled smoke (mondo 11-16). Lava = the game's own lava sheet lying in the crater and in pools on the Lava Field. */
'use strict';
module.exports = {
    reach: [[39, 15, 'the crater’s rim (the Mountain Road’s end)'], [46, 17, 'the rim, east (the Wild Way’s end)'], [31, 5, 'the Black Cape']],
    build(ctx) {
        const { rnd } = ctx, RED = 0xc23a22, PLS = ctx.PLS;
        const soft = (x, y) => ctx.kindAt(x, y) === 'v' && ctx.free(x, y) && !ctx.onWay(x, y);
        /* lava lying on the Lava Field (the game's lava sheet in shallow pools; they glow at night) */
        [[40, 28, 3.2], [44, 31, 2.4], [38, 32.5, 2.0], [45, 26.5, 1.8]].forEach(q => { ctx.feat({ k: 'pool', x: ctx.gx(q[0]), z: ctx.gz(q[1]), r: q[2], y: -0.1, depth: 0.3, key: 'lava' }); const r = Math.ceil(q[2] / 3.5); for (let y = Math.floor(q[1]) - r; y <= Math.floor(q[1]) + r; y++) for (let x = Math.floor(q[0]) - r; x <= Math.floor(q[0]) + r; x++) ctx.take(x, y); });
        /* black rocks and burnt snags over the cone's lower slopes; nothing on the ways */
        let rocks = 0;
        for (let y = 0; y <= 35; y++) for (let x = 24; x <= 59; x++) { const v = rnd(); if (v > 0.07 || !soft(x, y)) continue; const d = Math.hypot(x - 41.5, y - 17.5); if (d < 5) continue; ctx.take(x, y);
            ctx.props.push(v < 0.045 ? { key: ['psxg_rock_1', 'psxg_rock_2', 'psxg_rock_3', 'psxg_rock_4'][Math.floor(rnd() * 4)], x: ctx.mx(x), z: ctx.mz(y), face: Math.round(rnd() * 360), h: ctx.r2(1.2 + rnd() * 1.8) } : { key: 'burnt_tree', x: ctx.mx(x), z: ctx.mz(y), face: Math.round(rnd() * 360) }); rocks++; }
        /* the rim's gate: where the Mountain Road ends, a red gate looks down the island to the bay (drawn, like the others) */
        ctx.look('rimgate', 39.5, 15.4, 0, a => { for (const sx of [-1, 1]) a.cyl(sx * 3.0, 0, 0, 0.24, 4.8, PLS, RED, { r2: 0.2, seg: 10, gain: 2.2 }); a.box(0, 3.7, 0, 7.0, 0.34, 0.3, PLS, RED, { gain: 2.2 }); a.box(0, 4.5, 0, 8.0, 0.42, 0.46, PLS, RED, { gain: 2.2 }); a.box(0, 4.92, 0, 8.5, 0.18, 0.7, PLS, 0x2a2a2e, { roof: true }); });
        if (soft(38, 13)) { ctx.take(38, 13); ctx.props.push({ key: 'stone_lantern', x: ctx.mx(38), z: ctx.mz(13) }); } if (soft(41, 13)) { ctx.take(41, 13); ctx.props.push({ key: 'stone_lantern', x: ctx.mx(41), z: ctx.mz(13) }); }
        /* the Black Cape: a watch fire and a cairn at the island's north point */
        if (soft(31, 3)) { ctx.take(31, 3); ctx.props.push({ key: 'campfire', x: ctx.mx(31), z: ctx.mz(3) }); } if (soft(29, 4)) { ctx.take(29, 4); ctx.props.push({ key: 'cairn', x: ctx.mx(29), z: ctx.mz(4) }); }
        ctx.npc.push({ x: ctx.mx(42), z: ctx.mz(14), face: 180, race: 'dragon' }); ctx.take(42, 14);
        console.log('the Volcano: ' + rocks + ' rocks and snags');
    },
};
