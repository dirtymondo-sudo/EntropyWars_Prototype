/* THE SEWERS, district H · THE HOLDING CELLS (2 plots: the Guardroom, the Drunk Tank). The precinct's basement, the top level (5).
   One thread a file (docs/notes/claims.md). Read by `node bake-sewers.js`; rules: docs/notes/areas-complexes.md "THE SEWERS ON PLOTS".
   BRIEF: a gaol nobody runs any more. The cell door at the Drunk Tank's east side leads down a stair into the Precinct Drain; the trap under
   the tank drops by rope ladder to the Old Workings; the Guardroom's west door is DOOR HQ's Room 24601 ("the seventh cell"). ctx: see W.js.
   STANDS TODAY (first build): cots and bars along the north wall, the guard's table, terminal and files, bare bulbs, the old room's four
   bystanders. NOT YET: the six cells as walled cells with doors, the Catwalk (2.2 m), the Vent Stack (3.6 m), the Property Room. */
'use strict';
const nth = (list, i) => list.length ? list[Math.min(list.length - 1, Math.max(0, i))] : null;
module.exports = {
    dress(ctx) {
        ['P00-00', 'P01-00'].forEach(id => {
            const north = ctx.squares(id, 'f').filter(q => q[1] === 2);
            [1, 3, 5].forEach(k => { const q = north[k]; if (q) { ctx.P('cot', id, q[0], q[1], { face: 90 }); if (ctx.free(id, q[0], q[1] + 1)) ctx.P('cell_bars', id, q[0], q[1] + 1, { face: 0 }); } });
            const mid = ctx.inner(id); [2, mid.length - 3].forEach(k => { const q = nth(mid, k); if (q) { const s = ctx.sq(id, q[0], q[1]); ctx.props.push({ key: 'bare_bulb', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), ceil: true }); } });
            const dry = ctx.squares(id, 'f'); for (let k = 9; k < dry.length; k += 13) ctx.dec(k % 2 ? 'floor_stain' : 'paper_sheet', id, dry[k][0], dry[k][1]);
        });
        const g = ctx.inner('P00-00');
        [['steel_table', 20], ['crt_terminal', 21], ['folding_chair', 28], ['filing_cabinet', 30]].forEach(r => { const q = nth(g, r[1]); if (q && ctx.free('P00-00', q[0], q[1])) ctx.P(r[0], 'P00-00', q[0], q[1], { face: 180 }); });
        const k = nth(ctx.inner('P01-00'), 12); if (k) ctx.dec('key', 'P01-00', k[0], k[1]);
    },
    people(ctx) {
        const O = ctx.O.cells, stand = (race, id, k) => { const q = nth(ctx.inner(id), k); if (q) ctx.native(race, id, q[0], q[1], 180, ctx.sayOf(O, race)); };
        stand('men in black', 'P00-00', 24); stand('gangster', 'P00-00', 10); stand('politician', 'P01-00', 8); stand('zombie', 'P01-00', 26);
    },
};
