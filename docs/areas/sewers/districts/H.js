/* THE SEWERS, district H · THE HOLDING CELLS (2 plots: the Guardroom, the Drunk Tank). The precinct's basement, the top level (9 = 15.75 m).
   One thread a file (docs/notes/claims.md). Read by `node bake-sewers.js`; rules: docs/notes/areas-complexes.md "THE SEWERS ON PLOTS" and
   "THE SEWERS, DISTRICT H" (the passes, the decisions made for mondo, the needs-a-model list).
   BRIEF: a gaol nobody runs any more. The cell door at the east end leads down a stair into the Precinct Drain; the trap behind the tank
   drops by rope ladder to the Old Workings; the west door is DOOR HQ's Room 24601 ("the seventh cell"). Those three ways are the tool's.

   THE PLAN (squares c 0..23 west to east over both plots, r 0..11 north to south; `plan()` cuts it into the tool's map):
     r 2-3    SIX CELLS, 2 x 2 squares each, a whole square of brick between two (c 4, 7, 16, 19); their fronts are bars on the line r 4,
              each with a swinging cell door (`leaf_cell`)
     r 4-5    THE CELL CORRIDOR, west door to east door; THE SALLY GATE (bars, a double cell door) on the plot line c 12
     r 6-8    west: THE GUARDROOM (the booking counter on r 6, the desk behind it); east: THE DRUNK TANK (c 17-21, r 7-8, bars on two sides)
              and THE VENT STACK (a brick drum 3.6 m high on square c 14, r 8)
     r 9-10   dug out of the wall: THE PROPERTY ROOM (c 2-5, a steel door), the stair well + the lockers (c 7-9), the stack's fan room
              (c 14-15); the trap's passage (c 17-19) was there
     THE CATWALK: a steel gangway 2.2 m up over column c 7, from the stair in the well to the cells' fronts ("whoever watches the cells").
   The vaults are the tool's: with the cells' brick the plots cut into north-south bays, a wide one over each pair of columns, a narrow one
   over c 4, 7, 16, 19; the three piers stand under narrow bays. Thin walls here run floor to roof slab (5.3 m), so they meet any vault.
   ctx: see W.js. Thin walls, bars, doors, the deck and the signs are this file's own kit (`mk`): walls on square LINES, as the Desert's insides. */
'use strict';
const C = 3.5, T = 0.3, DW = 1.75, DH = 2.2, HB = 3.0, TOP = 5.32, CAT = 2.2;
const BRICK = 'bricks_2', PAINTED = 'urban:BrickPainted1a', STEEL = 'urban:MetalCorrugatedPainted2a', GRILL = 'urban:MetalSubwayGrill1a', TILE = 'urban:TileSubway2c';
const IRON = 0x25282c, SPAN = 0x6a6458, WALLT = 0x8f9a8c;
const nth = (list, i) => list.length ? list[Math.min(list.length - 1, Math.max(0, i))] : null;
const CELLS = [2, 5, 8, 14, 17, 20];                 // each cell's west column; it is c, c + 1 by r 2, 3; its door is in the east square's front
let K = null;

/* the kit: everything is written in the two plots' own squares (c, r) and lands in one arch row, one door carrier and the tool's lists */
function mk(ctx) {
    const B = ctx.plot['P00-00'].base, r2 = ctx.r2, X = c => r2(ctx.gx(0) + c * C), Z = r => r2(ctx.gz(0) + r * C), parts = [], inner = [];
    const loc = (c, r) => c < 12 ? ['P00-00', c, r] : ['P01-00', c - 12, r];
    const k = { B, X, Z, parts, inner, loc };
    k.box = (x, y, z, w, h, d, key, tint, x2) => { const p = Object.assign({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, x2 || {}); if (key) p.key = key; if (tint != null) p.tint = tint; parts.push(p); return p; };
    /* the walker's wall on a line: axis 'u' = west-east on the line r = at, 'v' = north-south on the line c = at; s0..s1 in squares */
    const walk = (axis, at, s0, s1, h, y0) => { const L = (s1 - s0) * C; if (L < 0.06) return; const e = Math.min(0.15, L / 2 - 0.01);
        const row = Object.assign({ k: 'wall' }, axis === 'u' ? { x0: r2(X(s0) + e), z0: Z(at), x1: r2(X(s1) - e), z1: Z(at) } : { x0: X(at), z0: r2(Z(s0) + e), x1: X(at), z1: r2(Z(s1) - e) }, { t: T, ghost: true, rail: false, h, y: r2(B + (y0 || 0) + h) });
        if (y0) row.y0 = r2(B + y0); ctx.feat(row); };
    const along = (axis, at, m) => axis === 'u' ? [X(m), Z(at)] : [X(at), Z(m)], sz = (axis, L, h, t) => axis === 'u' ? [L, h, t] : [t, h, L];
    /* iron bars from y0 to y1 over s0..s1: a bar every 0.17 m, a rail at the foot, the head and (over 1.5 m) the middle */
    const bars = (axis, at, s0, s1, y0, y1) => { const L = (s1 - s0) * C; if (L < 0.1) return; const q = along(axis, at, (s0 + s1) / 2), n = Math.max(1, Math.floor((L - 0.08) / 0.17)), a0 = -((n - 1) * 0.17) / 2;
        const rails = y1 - y0 > 1.5 ? [y0 + 0.03, (y0 + y1) / 2, y1 - 0.09] : [y0 + 0.03, y1 - 0.09];
        rails.forEach(y => k.box(q[0], y, q[1], sz(axis, L, 0.07, 0.07)[0], 0.07, sz(axis, L, 0.07, 0.07)[2], null, IRON));
        k.box(axis === 'u' ? q[0] + a0 : q[0], y0 + 0.05, axis === 'u' ? q[1] : q[1] + a0, 0.035, y1 - y0 - 0.1, 0.035, null, IRON, { n, step: axis === 'u' ? [0.17, 0, 0] : [0, 0, 0.17], top: false }); };
    /* a wall on a line from square a to b. o.style 'bars' (iron to HB, brick over it) | 'solid' (o.key / o.tint, floor to slab);
       o.doors [[middle, leaf, double]] (a 1.75 m doorway with a swinging leaf), o.gaps [[from, to]] (whole squares left open, a brick head over them) */
    k.wall = (axis, at, a, b, o) => { o = o || {}; const isBars = o.style === 'bars', key = o.key || PAINTED, tint = o.tint != null ? o.tint : WALLT;
        const seg = (s0, s1) => { if (s1 - s0 < 0.02) return; const q = along(axis, at, (s0 + s1) / 2), L = (s1 - s0) * C;
            if (isBars) bars(axis, at, s0, s1, 0, HB); else { const s = sz(axis, L, TOP, T); k.box(q[0], 0, q[1], s[0], s[1], s[2], key, tint, { uv: 1.75, top: false }); }
            walk(axis, at, s0, s1, isBars ? HB : TOP); };
        const cuts = (o.doors || []).map(d => ({ a: d[0] - DW / 2 / C, b: d[0] + DW / 2 / C, d })).concat((o.gaps || []).map(g => ({ a: g[0], b: g[1] }))).sort((p, q) => p.a - q.a);
        let cur = a;
        cuts.forEach(c => { seg(cur, c.a); cur = c.b; const q = along(axis, at, (c.a + c.b) / 2), L = (c.b - c.a) * C;
            if (!c.d) { const s = sz(axis, L, TOP - 2.6, T + 0.06); k.box(q[0], 2.6, q[1], s[0], s[1], s[2], BRICK, SPAN, { under: true, top: false }); return; }
            /* the doorway: two iron jambs, a head, what stands over it, the leaf */
            [-1, 1].forEach(sd => { const j = along(axis, at, c.d[0] + sd * (DW / 2 + 0.05) / C); k.box(j[0], 0, j[1], axis === 'u' ? 0.1 : T + 0.06, DH + 0.1, axis === 'u' ? T + 0.06 : 0.1, null, IRON); });
            { const s = sz(axis, DW + 0.2, 0.1, T + 0.06); k.box(q[0], DH, q[1], s[0], s[1], s[2], null, IRON); }
            if (isBars) bars(axis, at, c.a, c.b, DH + 0.1, HB); else { const s = sz(axis, L, TOP - DH - 0.1, T); k.box(q[0], DH + 0.1, q[1], s[0], s[1], s[2], key, tint, { uv: 1.75, top: false, under: true }); }
            if (c.d[1] && c.d[1] !== 'none') { const r = { x: q[0], z: q[1], rot: axis === 'u' ? 0 : 90, w: DW - 0.2, leaf: c.d[1], y: B }; if (c.d[2]) r.double = true; inner.push(r); }
            const m = Math.floor(c.d[0]); (axis === 'u' ? [[m, at - 1], [m, at]] : [[at - 1, m], [at, m]]).forEach(s => k.keep(s[0], s[1])); });
        seg(cur, b);
        if (isBars) { const q = along(axis, at, (a + b) / 2), s = sz(axis, (b - a) * C, TOP - HB, T); k.box(q[0], HB, q[1], s[0], s[1], s[2], BRICK, SPAN, { under: true, top: false }); } };
    /* a square nothing may block (a doorway's two sides, a walk) */
    k.keep = (c, r) => { const l = loc(c, r), s = ctx.sq(l[0], l[1], l[2]); ctx.taken.add(s[0] + ':' + s[1]); };
    /* a rail on the catwalk's edge at height y: posts, two bars, and a low wall nobody up there walks through (the walker below passes under) */
    k.guard = (axis, at, a, b, y) => { const q = along(axis, at, (a + b) / 2), L = (b - a) * C;
        [0.55, 1.05].forEach(yy => { const s = sz(axis, L, 0.05, 0.05); k.box(q[0], y + yy, q[1], s[0], s[1], s[2], null, 0x3c4046); });
        for (let s = a; s <= b + 0.001; s += 0.5) { const p = along(axis, at, s); k.box(p[0], y, p[1], 0.06, 1.08, 0.06, null, 0x3c4046); }
        walk(axis, at, a, b, 1.1, y); };
    /* words on a wall: a plate facing `ry` (0 = south, 180 = north, 90 = west, 270 = east) */
    k.sign = (words, x, y, z, w, h, ry, fg, bg) => parts.push({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], ry: ry || 0, key: 'txt:' + words + '|' + (fg || '#e8e4d0') + '|' + (bg || '') + '|' + r2(w / h) + '||stencil', uv: 'fit', kind: bg ? 'wall' : 'over' });
    /* props: P = a blocker on a square's middle, dec = decor off it (the tool's dice), at = decor at an exact spot (metres from the square's middle) */
    k.P = (key, c, r, o) => { const l = loc(c, r); if (!ctx.free(l[0], l[1], l[2])) return false; ctx.P(key, l[0], l[1], l[2], o); return true; };
    k.dec = (key, c, r, o) => { const l = loc(c, r); ctx.dec(key, l[0], l[1], l[2], o); };
    k.at = (key, c, r, dx, dz, o) => ctx.props.push(Object.assign({ key, x: r2(X(c + 0.5) + (dx || 0)), z: r2(Z(r + 0.5) + (dz || 0)) }, o || {}));
    k.who = (race, c, r, face, say) => { const l = loc(c, r); ctx.native(race, l[0], l[1], l[2], face, say); };
    return k;
}

module.exports = {
    /* THE SQUARES: brick between the cells; four rooms dug out of the south wall (two squares deep; row 11 stays solid over the mine) */
    plan(ctx) {
        const x0 = ctx.plot['P00-00'].sx, y0 = ctx.plot['P00-00'].sy, set = (c0, r0, c1, r1, ch) => ctx.setRect(x0 + c0, y0 + r0, x0 + c1, y0 + r1, ch);
        [4, 7, 16, 19].forEach(c => set(c, 2, c + 1, 4, 'x'));
        set(2, 9, 6, 11, 'f'); set(6, 9, 7, 10, 'x');     // the Property Room, a square of brick on its east side
        set(7, 9, 10, 11, 'f');     // the stair well and the lockers
        set(14, 9, 16, 11, 'f');    // the stack's fan room
    },
    build(ctx) {
        const k = K = mk(ctx), B = k.B, X = k.X, Z = k.Z;
        /* THE SIX CELLS: bars on the line r 4, the door in the east square, the cell's number over it */
        CELLS.forEach((c, i) => { k.wall('u', 4, c, c + 2, { style: 'bars', doors: [[c + 1.5, 'leaf_cell']] });
            k.sign(String(i + 1), X(c + 1.5), 3.35, Z(4) + T / 2 + 0.02, 0.5, 0.62, 0, '#d8d2b8'); });
        /* THE SALLY GATE across the passage between the two halls, on the plot line */
        k.wall('v', 12, 5, 8, { style: 'bars', doors: [[6.5, 'leaf_cell', true]] });
        /* THE PROPERTY ROOM, THE FAN ROOM: painted brick, a steel door each */
        k.wall('u', 9, 2, 6, { doors: [[3.5, 'leaf_security']] });
        k.sign('PROPERTY', X(3.5), 2.5, Z(9) - T / 2 - 0.02, 1.7, 0.36, 180, '#1c1c1c', '#c9c2a0');
        k.wall('u', 9, 14, 16, { doors: [[15.5, 'leaf_security']] });
        k.sign('PLANT', X(15.5), 2.5, Z(9) - T / 2 - 0.02, 1.2, 0.36, 180, '#1c1c1c', '#c9c2a0');
        /* THE DRUNK TANK: bars on its front and its west side, its door in the front; the trap's passage is one square wide in its back wall */
        k.wall('u', 7, 17, 22, { style: 'bars', doors: [[18.5, 'leaf_cell']] });
        k.wall('v', 17, 7, 9, { style: 'bars' });
        k.wall('u', 9, 17, 20, { key: BRICK, tint: SPAN, gaps: [[18, 19]] });
        k.sign('TANK', X(18.5), 3.35, Z(7) - T / 2 - 0.02, 1.5, 0.5, 180, '#d8d2b8');
        /* THE VENT STACK: a brick drum on one whole square, 3.6 m high (the old room's own: a perch for the door gun); its duct goes on up */
        { const sx = X(14.5), sz = Z(8.5); ctx.feat({ k: 'plateau', x: sx, z: sz, r: 1.72, h: ctx.r2(B + 3.6), edge: 0.12 }); k.keep(14, 8);
          k.parts.push({ s: 'cyl', p: [sx, 0, sz], r: 1.78, h: 0.35, key: BRICK, tint: 0x4c4a44, seg: 20 }, { s: 'cyl', p: [sx, 1.7, sz], r: 1.78, h: 0.12, tint: IRON, seg: 20 }, { s: 'cyl', p: [sx, 3.5, sz], r: 1.8, h: 0.14, tint: IRON, seg: 20 },
              { s: 'cyl', p: [sx, 3.6, sz], r: 0.85, h: ctx.r2(TOP - 3.6), key: STEEL, tint: 0x70685c, seg: 14 }, { s: 'cyl', p: [sx, 4.3, sz], r: 0.9, h: 0.1, tint: IRON, seg: 14 });
          /* its louvres, north and west (the two faces a walker sees first) */
          k.box(sx, 1.95, sz - 1.74, 1.3, 1.1, 0.06, GRILL, 0x5a5e60); k.box(sx - 1.74, 1.95, sz, 0.06, 1.1, 1.3, GRILL, 0x5a5e60); }
        /* THE CATWALK (2.2 m): a steel stair in the well, a gangway over column 7 to the cells' fronts, railed */
        { const x = X(7.5), y = ctx.r2(B + CAT);
          ctx.feat({ k: 'ramp', x0: x, z0: ctx.r2(Z(10) - 0.2), x1: x, z1: ctx.r2(Z(9) - 0.4), w: 1.75, h0: B, h1: y, stairs: true, model: 'steel', edge: 0.15 });
          ctx.feat({ k: 'bridge', x0: x, z0: ctx.r2(Z(4) + 0.2), x1: x, z1: ctx.r2(Z(9) + 0.3), w: 1.75, y, key: GRILL, rails: false, plain: true });
          const w = 0.875 / C; k.guard('v', 7.5 - w, 4.06, 9, CAT); k.guard('v', 7.5 + w, 4.06, 9, CAT); k.guard('u', 4.06, 7.5 - w, 7.5 + w, CAT);
          /* what carries it: two steel legs under each end and the middle, a beam under each edge */
          [4.4, 6.5, 8.6].forEach(r => [-0.8, 0.8].forEach(dx => k.box(x + dx, 0, Z(r), 0.12, CAT - 0.12, 0.12, null, 0x3c4046)));
          [-0.8, 0.8].forEach(dx => k.box(x + dx, CAT - 0.2, (Z(4.06) + Z(9)) / 2, 0.1, 0.14, (9 - 4.06) * C, null, 0x3c4046));
          k.keep(7, 9); k.keep(7, 10); k.keep(8, 10); }
        /* THE BOOKING COUNTER (the old room's): a tiled counter along row 6, a brick pier between its two halves */
        [[2, 4], [5, 7]].forEach(s => { ctx.feat({ k: 'wall', x0: ctx.r2(X(s[0]) + 0.3), z0: Z(6.5), x1: ctx.r2(X(s[1]) - 0.3), z1: Z(6.5), h: 0.95, t: 0.7, key: TILE }); for (let c = s[0]; c < s[1]; c++) k.keep(c, 6); });
        k.sign('BOOKING', X(3), 2.9, Z(6.5), 1.9, 0.4, 180, '#1c1c1c', '#c9c2a0'); k.box(X(3), 2.86, Z(6.5) + 0.03, 2.0, 0.48, 0.04, null, IRON);
        [-0.9, 0.9].forEach(dx => k.box(X(3) + dx, 3.34, Z(6.5) + 0.03, 0.03, TOP - 3.4, 0.03, null, IRON));
        ctx.pier('P00-00', 4, 6); ctx.pier('P01-00', 4, 6); ctx.pier('P01-00', 7, 6);
        /* the kit's rows: the drawn parts, the doors' leaves */
        /* (a row is drawn with the plot chunk it stands in: one row a plot, its parts measured from the plot's middle) */
        ['P00-00', 'P01-00'].forEach((id, i) => { const ox = X(6 + 12 * i), oz = Z(6), mine = k.parts.filter(p => (p.p[0] < X(12)) === (i === 0));
            ctx.feat({ k: 'arch', id: 'sew:' + id + ':in', x: ox, z: oz, rot: 0, base: B, parts: mine.map(p => Object.assign({}, p, { p: [ctx.r2(p.p[0] - ox), p.p[1], ctx.r2(p.p[2] - oz)] })) }); });
        ctx.feat({ k: 'texbuilding', id: 'sew:H:doors', x: X(12), z: Z(6.5), y: 0, w: 2, d: 2, rot: 0, storeys: 1, skin: false, doorsOnly: true, leaf: 'leaf_cell',
            inner: k.inner.map(r => Object.assign({}, r, { x: ctx.r2(r.x - X(12)), z: ctx.r2(r.z - Z(6.5)) })) });
    },
    dress(ctx) {
        const k = K;
        /* THE CELLS: a cot under the back wall, a steel toilet beside it, an old mattress on the floor */
        CELLS.forEach((c, i) => { k.P('cot', c, 2, { face: 90 }); k.P('steel_toilet', c + 1, 2, { face: 180 }); k.dec('psx_old_mattress_mp_1', c, 3); });
        /* the lamps: four bare bulbs (the room has ten real lights for all four districts) */
        [[6, 4.5], [5, 7.5], [16, 5], [19, 7.5]].forEach(q => ctx.props.push({ key: 'bare_bulb', x: k.X(q[0] + 0.5), z: k.Z(q[1] + 0.5), ceil: true }));
        /* THE GUARDROOM: the desk behind the counter */
        k.P('steel_table', 3, 7, { face: 180 }); k.at('crt_terminal', 3, 7, 0, 0, { y: 0.76, face: 180 }); k.P('folding_chair', 3, 8, { face: 0 }); k.P('filing_cabinet', 2, 8, { face: 90 });
        k.dec('psx_police_baton_mp_1', 5, 7); k.dec('key', 18, 5);
        [[3, 5, 'floor_stain'], [9, 5, 'paper_sheet'], [15, 4, 'floor_stain'], [20, 6, 'paper_sheet'], [19, 8, 'floor_stain']].forEach(q => k.dec(q[2], q[0], q[1]));
    },
    people(ctx) {
        const k = K, O = ctx.O.cells, say = race => ctx.sayOf(O, race);
        k.who('men in black', 4, 7, 0, say('men in black'));        // behind the counter
        k.who('gangster', 5, 3, 180, say('gangster'));              // cell 2
        k.who('politician', 17, 3, 180, say('politician'));         // cell 5
        k.who('zombie', 20, 8, 0, say('zombie'));                   // the tank
    },
};
