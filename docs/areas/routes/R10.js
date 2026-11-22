/* R10 THE COAST ROAD, the north end by hand (2026-11-22, the coast + underground entrances thread; mondo: "every single entrance/exit in the game needs to
   look good and natural"). Since ONE BEACH (11-20) the road's north end is Disaster City's port: the city draws a concrete causeway 110 m south from its
   quay across the bay's mouth (docs/disaster-city/districts/Q.js `dc:coastroad:arch`). This room showed none of it: the dirt road ran to the room's line
   and ended in open sea. THE TWO SIDES OF A GATE SHOW THE SAME COUNTRY: the same causeway is drawn on north from this room's line (the same deck, kerbs
   and piles, Q.js's own numbers), and at its far end the port it leads to: the quay, the container line on its city side, the cranes on its water side,
   the yard and two sheds behind (the city's own props and sheets: no new model, no new sheet). Scenery past the line: the room changes 6 m onto the deck. */
'use strict';
const CON = 'urban:ConcreteStriped2a', MET = 'urban:MetalCorrugated1a', LEN = 110;
module.exports = {
    dress(ctx) {
        const r = v => Math.round(v * 1000) / 1000, e = ctx.ENDS.find(q => q.side === 'n' && q.onWall); if (!e) return;
        const x0 = e.along, z0 = r(-ctx.D * ctx.C / 2 + 0.4), y0 = ctx.r2(Math.max(0, ctx.hAt(e.sq[0], 0)));
        const parts = [
            /* the causeway: Q.js's deck, kerbs and pile pairs, run north */
            { s: 'box', p: [0, -0.5, r(-LEN / 2)], size: [10.5, 0.5, LEN], key: CON, uv: [3.5, 3.5] },
            { s: 'box', p: [-5.05, 0, r(-LEN / 2)], size: [0.4, 0.45, LEN], key: CON }, { s: 'box', p: [5.05, 0, r(-LEN / 2)], size: [0.4, 0.45, LEN], key: CON },
            { s: 'box', p: [-3.8, -5.2, -5], size: [1.0, 4.8, 1.0], key: CON, tint: 0x9a9a94, n: 11, step: [0, 0, -10] }, { s: 'box', p: [3.8, -5.2, -5], size: [1.0, 4.8, 1.0], key: CON, tint: 0x9a9a94, n: 11, step: [0, 0, -10] },
            /* the port: the quay (three squares wide, the causeway's own line) and the yard west of it, one height, a wall down into the water */
            { s: 'box', p: [0, -6, r(-LEN - 110)], size: [10.5, 6, 220], key: CON, uv: [3.5, 3.5] },
            { s: 'box', p: [-50.25, -6, r(-LEN - 110)], size: [90, 6, 220], key: 'urban:RoadGeneric1a', tint: 0xb4b4b8, uv: [3.5, 3.5] },
            /* two sheds in the yard: corrugated walls, a low gable each */
            { s: 'box', p: [-52, 0, r(-LEN - 62)], size: [56, 9, 30], key: MET, tint: 0x8a9298 }, { s: 'roof', form: 'gable', size: [57, 4, 31], p: [-52, 9, r(-LEN - 62)], over: 0.5, key: MET, tint: 0x6a7278, keyEnd: MET, roof: true },
            { s: 'box', p: [-52, 0, r(-LEN - 150)], size: [56, 9, 30], key: MET, tint: 0x9a8a78 }, { s: 'roof', form: 'gable', size: [57, 4, 31], p: [-52, 9, r(-LEN - 150)], over: 0.5, key: MET, tint: 0x7a6a5a, keyEnd: MET, roof: true }];
        ctx.feat({ k: 'arch', id: 'ow:r10:port', x: x0, z: z0, rot: 0, y: y0, parts });
        /* the container line on the city side of the quay, the cranes on its water side (Q.js's own places: the west and the east column) */
        for (let i = 0, z = z0 - LEN - 12; i < 13; i++, z -= 14) { const hi = 1 + (i * 7 + 3) % 3; for (let l = 0; l < hi; l++) ctx.props.push({ key: 'ind_container', x: r(x0 - 3.5), z: r(z), face: 0, y: r(y0 + l * 2.15) }); }
        [30, 100, 170].forEach(d => ctx.props.push({ key: 'babel_crane', x: r(x0 + 3.5), z: r(z0 - LEN - d), face: 90, y: y0 }));
    },
};
