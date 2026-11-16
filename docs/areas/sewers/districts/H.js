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
   PASSES: 1 the structure, 2 the interiors (every room furnished), 3 the dressing (`walls()`: dado, floor lines, words, conduit),
   4 the light and the air (`lights()`: drawn lamps, no new real light), 5 polish (the frame rate: heavy small models out, fewer materials).
   FIVE PASSES DONE: stopped until mondo has looked (docs/plans/DISTRICT_THREAD_BRIEF.md). The notes hold what each placed and the lists.
   ctx: see W.js. Thin walls, bars, doors, the deck and the signs are this file's own kit (`mk`): walls on square LINES, as the Desert's insides. */
'use strict';
const C = 3.5, T = 0.3, DW = 1.75, DH = 2.2, HB = 3.0, TOP = 5.32, CAT = 2.2;
const BRICK = 'bricks_2', PAINTED = 'urban:BrickPainted1a', STEEL = 'urban:MetalCorrugatedPainted2a', GRILL = 'urban:MetalSubwayGrill1a', TILE = 'urban:TileSubway2c';
const IRON = 0x25282c, RAILC = 0x3c4046, SPAN = 0x6a6458, WALLT = 0x8f9a8c;
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
        [0.55, 1.05].forEach(yy => { const s = sz(axis, L, 0.05, 0.05); k.box(q[0], y + yy, q[1], s[0], s[1], s[2], null, RAILC); });
        for (let s = a; s <= b + 0.001; s += 0.5) { const p = along(axis, at, s); k.box(p[0], y, p[1], 0.06, 1.08, 0.06, null, RAILC); }
        walk(axis, at, a, b, 1.1, y); };
    /* words on a wall: a plate facing `ry` (0 = south, 180 = north, 90 = west, 270 = east) */
    k.sign = (words, x, y, z, w, h, ry, fg, bg) => parts.push({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], ry: ry || 0, key: 'txt:' + words + '|' + (fg || '#e8e4d0') + '|' + (bg || '') + '|' + r2(w / h) + '||stencil', uv: 'fit', kind: bg ? 'wall' : 'over' });
    /* props: P = a blocker on a square's middle, dec = decor off it (the tool's dice), at = decor at an exact spot (metres from the square's middle) */
    k.P = (key, c, r, o) => { const l = loc(c, r); if (!ctx.free(l[0], l[1], l[2])) return false; ctx.P(key, l[0], l[1], l[2], o); return true; };
    k.dec = (key, c, r, o) => { const l = loc(c, r); ctx.dec(key, l[0], l[1], l[2], o); };
    k.at = (key, c, r, dx, dz, o) => ctx.props.push(Object.assign({ key, x: r2(X(c + 0.5) + (dx || 0)), z: r2(Z(r + 0.5) + (dz || 0)) }, o || {}));
    /* put = a piece of furniture against a wall (off the square's middle, the square is then taken); `y` of 1 m or more is over the ROOM's level 0 */
    k.put = (key, c, r, dx, dz, o) => { k.keep(c, r); k.at(key, c, r, dx, dz, o); };
    k.up = h => r2(B + h);
    k.who = (race, c, r, face, say) => { const l = loc(c, r); ctx.native(race, l[0], l[1], l[2], face, say); };
    return k;
}


/* PASS 3, THE WALLS AND THE FLOOR (drawn parts only; called from build() before the rows are written).
   zone(c, r): which room a square belongs to: 'c' cell, 'p' the Property Room, 'f' the fan room, 't' the trap's passage, 'h' the halls. */
const zone = (c, r) => (r <= 3) ? 'c' : (r >= 9 && c <= 5) ? 'p' : (r >= 9 && c >= 14 && c <= 15) ? 'f' : (r >= 9 && c >= 17 && c <= 19) ? 't' : 'h';
const DIR = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }, TILEC = 0xa9b8a6, CAPC = 0x2f4a3c, YEL = 0xc9a227;
function walls(ctx, k) {
    const X = k.X, Z = k.Z, x0 = ctx.plot['P00-00'].sx, y0 = ctx.plot['P00-00'].sy, open = (c, r) => c >= 0 && r >= 0 && c < 24 && r < 12 && ctx.cell[y0 + r][x0 + c] !== 'x';
    /* a part on the brick face of square (c, r) on side d: u = along the wall from the square's middle, out = its middle's distance from the wall line */
    const onFace = (c, r, d, u, y, out, w, h, t, key, tint, o) => { const v = DIR[d], cx = X(c + 0.5), cz = Z(r + 0.5);
        return v[0] ? k.box(cx + v[0] * (C / 2 - out), y, cz + u, t, h, w, key, tint, o) : k.box(cx + u, y, cz + v[1] * (C / 2 - out), w, h, t, key, tint, o); };
    k.onFace = onFace;
    /* THE TILED DADO: the precinct's own skin on the sewer's brick, in the halls only (the cells, the stores and the trap stay bare brick) */
    let n = 0;
    for (let r = 2; r <= 10; r++) for (let c = 0; c < 24; c++) { if (!open(c, r) || zone(c, r) !== 'h') continue;
        for (const d of 'nswe') { const v = DIR[d]; if (open(c + v[0], r + v[1])) continue; if (c + v[0] < 0 || c + v[0] > 23) continue;
            onFace(c, r, d, 0, 0, 0.115, C, 1.25, 0.05, TILE, TILEC, { uv: 1.75, top: false }); onFace(c, r, d, 0, 1.25, 0.125, C, 0.09, 0.08, null, CAPC); n++; } }
    /* THE FLOOR: the corridor's rubber runner (the old room's), the yellow line a pace before the cells' bars, hazard chevrons at the stair's foot */
    const flat = (x, z, w, d, key, tint, y, o) => k.parts.push(Object.assign({ s: 'quad', flat: true, p: [ctx.r2(x), y || 0.03, ctx.r2(z)], size: [ctx.r2(w), ctx.r2(d)], tint }, key ? { key } : {}, o || {}));
    flat((X(2.1) + X(11.9)) / 2, Z(5.05), X(11.9) - X(2.1), 1.7, 'urban:RubberNonSlip3a', 0x8a8e88); flat((X(12.1) + X(21.9)) / 2, Z(5.05), X(21.9) - X(12.1), 1.7, 'urban:RubberNonSlip3a', 0x8a8e88);
    [[2, 10], [14, 22]].forEach(q => flat((X(q[0]) + X(q[1])) / 2, Z(4) + 0.95, X(q[1]) - X(q[0]) - 0.3, 0.12, null, YEL, 0.035));
    flat(X(18.5), Z(7) - 0.95, 5 * C - 0.4, 0.12, null, YEL, 0.035);                                        // before the tank
    flat(X(7.5), Z(10.5), 1.9, 2.6, 'urban:SignHazard1a', 0xb8b0a0, 0.035, { uv: 1.75 });                       // the stair's landing
    /* THE WORDS */
    k.sign('DRAIN', X(22) - T / 2 - 0.02, 3.3, Z(6.5), 1.5, 0.44, 90, '#1c1c1c', '#c9c2a0');                 // over the cell door, read from the corridor
    k.sign('CELLS 4 5 6', X(12) - T / 2 - 0.02, 3.3, Z(6.5), 2.1, 0.36, 90, '#d8d2b8'); k.sign('CELLS 1 2 3', X(12) + T / 2 + 0.02, 3.3, Z(6.5), 2.1, 0.36, 270, '#d8d2b8');
    k.sign('STAND BEHIND THE LINE', X(6), 3.35, Z(4) + T / 2 + 0.02, 3.2, 0.3, 0, '#c9a227'); k.sign('STAND BEHIND THE LINE', X(18), 3.35, Z(4) + T / 2 + 0.02, 3.2, 0.3, 0, '#c9a227');
    k.sign('STAFF ONLY', X(7.75) + 0.04, 0.5, Z(9.75), 1.3, 0.3, 270, '#1c1c1c', '#c9a227');                      // on the stair's flank, read from the lockers
    k.sign('NO VISITORS PAST THIS GATE', X(12) - T / 2 - 0.02, 3.02, Z(6.5), 2.6, 0.22, 90, '#c9a227');
    /* THE CONDUIT: a steel conduit over the cells' bars, a drop to each door's lamp box, a junction box a cell */
    [[2, 10], [14, 22]].forEach(q => k.box((X(q[0]) + X(q[1])) / 2, 3.72, Z(4) + T / 2 + 0.05, X(q[1]) - X(q[0]), 0.06, 0.06, null, RAILC));
    CELLS.forEach(c => { k.box(X(c + 0.4), 3.6, Z(4) + T / 2 + 0.07, 0.3, 0.3, 0.12, null, RAILC); k.box(X(c + 1.5), 3.05, Z(4) + T / 2 + 0.05, 0.05, 0.7, 0.05, null, RAILC); });
    /* THE STACK'S DUCTWORK: a square duct from the drum over the fan room's door, hangers */
    { const sx = X(14.5), sz = Z(8.5); k.box(sx, 2.75, sz + 1.2, 0.8, 0.6, 1.5, STEEL, 0x70685c, { under: true }); [0.75, 1.6].forEach(d => k.box(sx, 3.35, sz + d, 0.05, TOP - 3.35, 0.05, null, IRON)); }
    return n;
}

/* PASS 4, THE LIGHT (drawn; the room has ten real lights for all its districts and H keeps its four bulbs). A BULKHEAD LAMP on a wall:
   (x, z) = the spot on the wall's face, dir = the way it looks ('n' 's' 'w' 'e'), y = its foot over the floor. It is a lit lens in an iron
   cage, a wash of lit brick on its wall and a pool of lit floor before it (district W's own recipe, written for walls on lines).
   o: dead (no light), y0 / y1 (the wash stays between them: a spandrel over bars starts 3 m up), pool: false. */
const COLD = 0xbfe8b0, SODIUM = 0xffa244, REDL = 0xff3a22, FLOOR = 'urban:ConcreteStriped1e';
function lights(ctx, k) {
    const X = k.X, Z = k.Z;
    const lamp = (x, z, dir, y, color, o) => { o = o || {}; const v = DIR[dir];
        const put = (out, w, h, t, key, tint, x2, yy) => k.box(x + v[0] * out, yy, z + v[1] * out, v[0] ? t : w, h, v[0] ? w : t, key, tint, x2);
        put(0.05, 0.5, 0.36, 0.1, null, IRON, null, y - 0.03);
        if (o.dead) { put(0.13, 0.38, 0.26, 0.12, null, IRON, null, y); return; }
        put(0.13, 0.44, 0.3, 0.14, null, color, { glow: 1 }, y); put(0.215, 0.5, 0.03, 0.03, null, IRON, null, y + 0.08); put(0.215, 0.5, 0.03, 0.03, null, IRON, null, y + 0.2);
        /* the lit brick and the lit floor wear the lamp's colour mixed half into white, in three steps (the pure colour read as coloured mats; the steps share their glow so wall and floor are six materials a colour) */
        const mix = (c, t) => { const ch = sh => Math.round(((c >> sh) & 255) * (1 - t) + 255 * t); return (ch(16) << 16) | (ch(8) << 8) | ch(0); }, cw = mix(color, 0.4), cf = mix(color, 0.6);
        const lo = o.y0 != null ? o.y0 : 0.3, hi = o.y1 != null ? o.y1 : TOP - 0.1;
        if (o.wash !== false) [[1.0, 1.1, 0.24, y - 0.4], [1.9, 2.0, 0.14, y - 0.85], [3.0, 3.0, 0.06, y - 1.35]].forEach((w, i) => { const y0 = Math.max(lo, w[3]), h = Math.min(hi, w[3] + w[1]) - y0; if (h > 0.1) put(0.03 + (2 - i) * 0.01, w[0], h, 0.02, BRICK, cw, { glow: w[2], top: false, uv: 3.5 }, y0); });
        if (o.pool !== false) [[1.3, 0.9, 0.24, 0.65], [2.4, 1.6, 0.14, 0.95], [3.6, 2.5, 0.06, 1.3]].forEach((w, i) => k.parts.push({ s: 'quad', flat: true, p: [ctx.r2(x + v[0] * w[3]), 0.058 - i * 0.008, ctx.r2(z + v[1] * w[3])], size: v[0] ? [w[1], w[0]] : [w[0], w[1]], key: FLOOR, tint: cf, glow: w[2] })); };
    const F4 = Z(4) + T / 2, sp = { y0: 3.0 };
    /* over each cell's bars (3 and 6 are dead: those cells stand dark), and on each lit cell's back wall */
    CELLS.forEach((c, i) => { const dead = i === 2 || i === 5; lamp(X(c + 0.5), F4, 's', 3.2, COLD, Object.assign({ dead }, sp)); if (!dead) lamp(X(c + 1), Z(2) + 0.02, 's', 2.7, COLD, {}); });
    /* the sally gate (sodium, both sides), the cell door (red: the way down), the tank's front and its back wall */
    [5.45, 7.55].forEach(r => { lamp(X(12) - T / 2, Z(r), 'w', 3.15, SODIUM, sp); lamp(X(12) + T / 2, Z(r), 'e', 3.15, SODIUM, sp); });
    lamp(X(22) - T / 2, Z(5.5), 'w', 3.15, REDL, sp); lamp(X(22) - T / 2, Z(7.5), 'w', 3.15, REDL, sp);
    lamp(X(20.5), Z(7) - T / 2, 'n', 3.2, COLD, sp); lamp(X(19.6), Z(9) - T / 2, 'n', 2.7, COLD, {});
    /* the Guardroom: its west wall, over the Property Room's door, the lockers; the Property Room and the fan room inside (sodium, dim stores) */
    lamp(X(2) + 0.14, Z(7.5), 'e', 2.75, COLD, { y0: 1.4 }); lamp(X(4.7), Z(9) - T / 2, 'n', 2.75, COLD, {}); lamp(X(9), Z(11) - 0.14, 'n', 2.7, COLD, { y0: 1.4 });
    lamp(X(3.2), Z(11) - 0.02, 'n', 2.9, SODIUM, {}); lamp(X(14.6), Z(9) - T / 2, 'n', 2.75, SODIUM, {}); lamp(X(15), Z(11) - 0.02, 'n', 2.9, SODIUM, {});
    /* the stair's foot, the trap's passage (one dead lamp: nobody changes a bulb down there) */
    lamp(X(10) - 0.14, Z(10.4), 'w', 2.6, COLD, { y0: 1.4 }); lamp(X(17) + 0.02, Z(10.5), 'e', 2.6, COLD, { dead: true });
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
        /* THE CELL DOOR (the plan's name for the way down to the Precinct Drain): bars across the east passage, a cell door in them */
        k.wall('v', 22, 5, 8, { style: 'bars', doors: [[6.5, 'leaf_cell']] });
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
        { const sx = X(14.5), sz = Z(8.5); ctx.feat({ k: 'plateau', x: sx, z: sz, r: 0.8, h: ctx.r2(B + 3.6), edge: 0.1 }); k.keep(14, 8);
          [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]].forEach(q => ctx.feat({ k: 'wall', x0: ctx.r2(sx + q[0] * 1.5), z0: ctx.r2(sz + q[1] * 1.5), x1: ctx.r2(sx + q[2] * 1.5), z1: ctx.r2(sz + q[3] * 1.5), t: 0.3, ghost: true, rail: false, h: 3.6, y: ctx.r2(B + 3.6) }));
          k.parts.push({ s: 'cyl', p: [sx, 0, sz], r: 1.74, h: 3.62, key: BRICK, tint: 0x8a8274, gain: 1.15, seg: 24, uv: 3.5 });   // (the field's own drum is a rough cone at 0.875 m a sample: this is its face)
          k.parts.push({ s: 'cyl', p: [sx, 0, sz], r: 1.78, h: 0.35, key: BRICK, tint: 0x4c4a44, seg: 20 }, { s: 'cyl', p: [sx, 1.7, sz], r: 1.78, h: 0.12, tint: IRON, seg: 20 }, { s: 'cyl', p: [sx, 3.5, sz], r: 1.8, h: 0.14, tint: IRON, seg: 20 },
              { s: 'cyl', p: [sx, 3.6, sz], r: 0.85, h: ctx.r2(TOP - 3.6), key: STEEL, tint: 0x70685c, seg: 14 }, { s: 'cyl', p: [sx, 4.3, sz], r: 0.9, h: 0.1, tint: IRON, seg: 14 });
          /* its louvres, north and west (the two faces a walker sees first) */
          k.box(sx, 1.95, sz - 1.76, 1.3, 1.1, 0.08, GRILL, 0x5a5e60); k.box(sx + 1.76, 1.95, sz, 0.08, 1.1, 1.3, GRILL, 0x5a5e60);
          k.box(sx, 1.88, sz - 1.78, 1.46, 0.07, 0.1, null, IRON); k.box(sx, 3.05, sz - 1.78, 1.46, 0.07, 0.1, null, IRON); k.box(sx + 1.78, 1.88, sz, 0.1, 0.07, 1.46, null, IRON); k.box(sx + 1.78, 3.05, sz, 0.1, 0.07, 1.46, null, IRON); }
        /* THE CATWALK (2.2 m): a steel stair in the well, a gangway over column 7 to the cells' fronts, railed */
        { const x = X(7.5), y = ctx.r2(B + CAT);
          ctx.feat({ k: 'ramp', x0: x, z0: ctx.r2(Z(10) - 0.2), x1: x, z1: ctx.r2(Z(9) - 0.4), w: 1.75, h0: B, h1: y, stairs: true, model: 'steel', edge: 0.15 });
          ctx.feat({ k: 'bridge', x0: x, z0: ctx.r2(Z(4) + 0.2), x1: x, z1: ctx.r2(Z(9) + 0.3), w: 1.75, y, key: GRILL, rails: false, plain: true });
          const w = 0.875 / C; k.guard('v', 7.5 - w, 4.06, 9, CAT); k.guard('v', 7.5 + w, 4.06, 9, CAT); k.guard('u', 4.06, 7.5 - w, 7.5 + w, CAT);
          /* what carries it: two steel legs under each end and the middle, a beam under each edge */
          [4.4, 6.5, 8.6].forEach(r => [-0.8, 0.8].forEach(dx => k.box(x + dx, 0, Z(r), 0.12, CAT - 0.12, 0.12, null, RAILC)));
          [-0.8, 0.8].forEach(dx => k.box(x + dx, CAT - 0.2, (Z(4.06) + Z(9)) / 2, 0.1, 0.14, (9 - 4.06) * C, null, RAILC));
          k.keep(7, 9); k.keep(7, 10); k.keep(8, 10); }
        /* THE BOOKING COUNTER (the old room's): a tiled counter along row 6, a brick pier between its two halves */
        [[2, 4], [5, 7]].forEach(s => { ctx.feat({ k: 'wall', x0: ctx.r2(X(s[0]) + 0.3), z0: Z(6.5), x1: ctx.r2(X(s[1]) - 0.3), z1: Z(6.5), h: 0.95, t: 0.7, key: TILE }); for (let c = s[0]; c < s[1]; c++) k.keep(c, 6); });
        k.sign('BOOKING', X(3), 2.9, Z(6.5), 1.9, 0.4, 180, '#1c1c1c', '#c9c2a0'); k.box(X(3), 2.86, Z(6.5) + 0.03, 2.0, 0.48, 0.04, null, IRON);
        [-0.9, 0.9].forEach(dx => k.box(X(3) + dx, 3.34, Z(6.5) + 0.03, 0.03, TOP - 3.4, 0.03, null, IRON));
        ctx.pier('P00-00', 4, 6); ctx.pier('P01-00', 4, 6); ctx.pier('P01-00', 7, 6);
        walls(ctx, k); lights(ctx, k);
        /* the kit's rows: the drawn parts, the doors' leaves */
        /* (a row is drawn with the plot chunk it stands in: one row a plot, its parts measured from the plot's middle) */
        ['P00-00', 'P01-00'].forEach((id, i) => { const ox = X(6 + 12 * i), oz = Z(6), mine = k.parts.filter(p => (p.p[0] < X(12)) === (i === 0));
            ctx.feat({ k: 'arch', id: 'sew:' + id + ':in', x: ox, z: oz, rot: 0, base: B, parts: mine.map(p => Object.assign({}, p, { p: [ctx.r2(p.p[0] - ox), p.p[1], ctx.r2(p.p[2] - oz)] })) }); });
        ctx.feat({ k: 'texbuilding', id: 'sew:H:doors', x: X(12), z: Z(6.5), y: 0, w: 2, d: 2, rot: 0, storeys: 1, skin: false, doorsOnly: true, leaf: 'leaf_cell',
            inner: k.inner.map(r => Object.assign({}, r, { x: ctx.r2(r.x - X(12)), z: ctx.r2(r.z - Z(6.5)) })) });
    },
    dress(ctx) {
        const k = K, B = k.B, N = 180, S = 0, W = 90, E = 270;        // a wall piece's `face` by the wall it hangs on
        const lost = []; const P = (key, c, r, o) => { if (!k.P(key, c, r, o)) lost.push(key + '@' + c + ',' + r); };
        /* the lamps: four bare bulbs (the room has ten real lights for all its districts: the board's count for H is four) */
        [[6, 4.5], [5, 7.5], [16, 5], [19, 7.5]].forEach(q => ctx.props.push({ key: 'bare_bulb', x: k.X(q[0] + 0.5), z: k.Z(q[1] + 0.5), ceil: true }));

        /* ── THE SIX CELLS: a cot under the back wall, a steel toilet, a basin on the wall, an old mattress; then each cell its own story ── */
        CELLS.forEach(c => { P('cot', c, 2, { face: 90 }); P('steel_toilet', c + 1, 2, { face: 180 }); k.at('sink', c + 1, 3, 1.38, -0.9, { face: E });
            k.dec('psx_old_mattress_mp_1', c, 3); k.at('toilet_paper', c + 1, 2, 0.9, 0.5); });
        /* 1 nobody: the chains, a web */
        k.at('wall_chains', 2, 2, -1.62, 0.2, { face: W }); k.at('psx_cobweb_1', 2, 2, -1.3, -1.3, { y: k.up(2.3) }); k.dec('psx_pillow_mp_1', 2, 3);
        /* 2 the gangster: his tray, his cup, his smokes, his cards money */
        k.at('meal_tray', 5, 3, 0.9, 0.6, { face: 20 }); k.at('solo_cup', 5, 3, 1.3, 0.2); k.at('psx_cigs_packet_1', 6, 2, -1.0, 1.2); k.at('psx_cash_1', 5, 3, -0.6, 1.1); k.at('psx_lighter_mp_1', 6, 2, -0.7, 1.3);
        /* 3 somebody they forgot: bones on the mattress, a web, the chains */
        k.at('skull', 8, 3, 1.1, -0.9, { face: 200 }); k.at('hw_part_3', 8, 3, 0.9, 0.2, { face: 40 }); k.at('hw_part_5', 8, 3, -0.3, 0.5, { face: 310 }); k.at('psx_cobweb_2', 9, 2, 1.3, -1.3, { y: k.up(2.2) });
        k.at('trap_chain_draped', 8, 2, -1.62, 0.6, { face: W });
        /* 4 the wet one: a bucket under the drip, the scrawl on the back wall */
        P('wooden_bucket', 14, 3); k.at('graffiti_wall', 14, 2, 0.9, -1.66, { face: N }); ctx.grime('puddle', 'P01-00', 2, 3, 1.5); k.dec('mop', 15, 3);
        /* 5 the politician: his ballot box, his papers */
        k.at('ballot_box', 17, 3, -1.1, 0.9, { face: 30 }); k.at('papers_a', 17, 3, 0.4, 1.2); k.at('papers_b', 18, 2, -0.9, 1.3); k.at('pen', 17, 3, 0.6, 1.0);
        /* 6 stripped: a bed frame on end, the chains, a web */
        k.at('wall_chains', 21, 2, 1.62, -0.2, { face: E }); k.at('psx_cobweb_4', 20, 2, -1.3, -1.3, { y: k.up(2.3) }); k.at('psx_tin_can_mp_1_rusty', 20, 3, 0.5, 0.8); k.at('trap_chain_draped', 20, 2, 0.6, -1.64, { face: N });

        /* ── THE CELL CORRIDOR ── */
        k.at('city_seal', 4, 4, 0, -1.72, { face: N, y: k.up(1.9) });                       // on the brick between cells 1 and 2
        k.at('public_phone', 16, 4, 0, -1.6, { face: N }); k.at('fire_extinguisher', 19, 4, 0.4, -1.66, { face: N }); k.at('fire_extinguisher', 7, 4, 1.2, -1.66, { face: N });
        k.at('security_camera', 10, 5, -1.7, -1.6, { face: E });                             // ONE camera (the model is 27,000 triangles): it feeds the wall of screens
        [[6, 5], [15, 5]].forEach(q => k.at('floor_drain', q[0], q[1], 0.9, 0.2));
        k.put('wheelchair', 10, 7, -0.4, 1.0, { face: 130 }); k.put('laundry_cart', 13, 7, 0.3, 0.9, { face: 80 }); k.at('item_police_barricade', 23, 7, 0, 1.1, { face: 15 });
        k.put('metro_bench', 13, 5, 0, -1.3, { face: N });                                 // where a visitor waits, by the gate
        [[3, 5, 'floor_stain'], [9, 5, 'paper_sheet'], [15, 4, 'floor_stain'], [20, 6, 'floor_stain']].forEach(q => k.dec(q[2], q[0], q[1]));
        k.dec('key', 18, 5);                                                                // the ring, on the floor, as in the old room

        /* ── THE GUARDROOM: the booking counter's side, the desk, the screens, the wall of faces ── */
        k.at('number_dispenser', 2, 5, 1.2, 1.2, { face: 0 }); [[2, -0.6], [3, 0.2], [3, 1.0]].forEach(q => k.at('rope_stanchion', q[0], 5, q[1], 0.2));
        k.at('clipboard_flat', 3, 6, -0.5, 0, { y: 0.01, face: 30 }); k.at('rotary_phone', 5, 6, 0.3, 0.1, { y: 0.01, face: 180 }); k.at('papers_a', 6, 6, -0.4, 0, { y: 0.01 });
        P('steel_table', 5, 7, { face: 180 }); k.at('crt_terminal', 5, 7, -0.2, 0, { y: 0.76, face: 180 }); k.at('desk_lamp', 5, 7, 0.55, 0.15, { y: 0.76, face: 200 }); k.at('manila_folders', 5, 7, -0.6, -0.2, { y: 0.76 });
        P('office_chair', 5, 8, { face: 0 }); k.at('psx_police_baton_mp_1', 5, 7, 0.1, -0.3, { y: 0.78, face: 60 });
        k.put('filing_cabinet', 2, 7, -1.45, 0.6, { face: W }); k.put('filing_cabinet', 2, 7, -1.45, 0.1, { face: W }); k.put('filing_cabinet', 2, 8, -1.45, -0.6, { face: W });
        k.at('key_rack', 2, 8, -1.6, 0.9, { face: W, y: k.up(1.25) }); k.at('wall_clock', 2, 7, -1.7, -0.9, { face: W, y: k.up(2.4) }); k.at('punch_clock', 2, 8, -1.7, 0.1, { face: W });
        k.at('mugshot_wall', 4, 8, 0.4, 1.55, { face: S }); k.at('notice_board', 2, 8, 0.6, 1.58, { face: S }); k.at('breaker_panel', 5, 8, 1.1, 1.6, { face: S });
        k.put('monitor_stack', 6, 8, 0, 1.4, { face: S });
        P('steel_table', 9, 7, { face: 270 }); k.at('coffee_maker', 9, 7, 0.1, -0.4, { y: 0.76, face: 270 });
        k.at('water_cooler', 9, 8, 1.5, -0.6, { face: E }); k.at('metal_trash_can', 8, 7, 1.0, -1.2);
        /* the lockers' nook: riot gear and long guns on the east wall, a row of lockers on the south */
        k.put('riot_gear_rack', 9, 9, 1.35, 0, { face: 270 }); k.put('rifle_rack', 9, 10, 1.3, 0.2, { face: 270 });
        [-0.9, -0.38, 0.14].forEach(dx => k.at('locker', 8, 10, dx, 1.45, { face: S })); k.at('footlocker', 8, 9, -1.1, -0.2, { face: 95 });
        /* the catwalk: the watcher's chair, his lamp, his cup (nobody is up there) */
        k.at('folding_chair', 7, 4, 0.1, 1.2, { y: k.up(CAT), face: 0 }); k.at('followspot', 7, 4, -0.3, -0.5, { y: k.up(CAT), face: 330 }); k.at('coffee_mug', 7, 5, 0.5, -0.9, { y: k.up(CAT) });

        /* ── THE PROPERTY ROOM: shelves on the south wall, the boxes on the west, the safe, what was taken off people ── */
        k.put('metal_shelving', 2, 10, 0, 1.45, { face: S }); k.put('lost_shelf', 4, 10, -0.2, 1.42, { face: S }); k.put('metal_shelving', 5, 10, 0, 1.45, { face: S }); k.put('floor_safe', 5, 9, 1.2, 0.6, { face: 270 });
        k.put('deposit_box_wall', 2, 9, -1.4, 0.3, { face: W }); k.at('cardboard_boxes', 4, 9, 0.9, -1.0, { face: 20 }); k.at('psx_cardboard_box_2_1', 4, 9, 0.2, -1.25, { face: 70 }); k.at('cardboard_box', 4, 10, -1.2, -0.4);
        k.at('hand_truck', 4, 9, 1.2, 1.2, { face: 200 }); k.at('skateboard', 3, 10, 1.2, 0.9, { face: 80 }); k.at('instrument_guitar', 3, 10, -1.3, 1.2, { face: 200 }); k.at('umbrella_stand', 4, 9, 1.4, 0.3);
        k.at('sword', 3, 10, 0.5, 1.35, { face: 90 }); k.at('psx_cash_2', 4, 10, 0.3, -1.1); k.at('revolver', 4, 10, -0.5, -1.2, { face: 40 }); k.at('boxing_gloves', 5, 9, 0.2, 1.4);
        k.at('key', 3, 10, 0.1, 0.2, { face: 20 }); k.at('paper_sheet', 3, 10, -0.5, -0.3, { face: 40 });        // the old room's: the list, one ring of keys, unclaimed
        k.at('evidence_board', 5, 9, -0.9, -1.2, { face: N });

        /* ── THE DRUNK TANK: benches along the back wall, one cot, the pan, the floor drain, what they drank ── */
        P('cot', 17, 8, { face: 0 }); P('steel_toilet', 21, 7, { face: 270 });
        k.put('metro_bench', 20, 8, -0.4, 1.3, { face: S }); k.put('metro_bench', 21, 8, 0.2, 1.3, { face: S });
        k.at('floor_drain', 19, 7, 0.6, 0.9); k.at('psx_glass_bottle_1', 19, 8, 0.9, -0.2, { face: 80 }); k.at('psx_glass_bottle_2', 20, 7, -0.3, 0.6); k.at('psx_glass_bottle_1', 21, 8, -1.0, -0.6, { face: 200 });
        k.at('solo_cup', 20, 7, 0.9, 1.1); k.at('psx_tin_can_mp_1_rusty', 17, 7, 0.8, 0.7); k.dec('floor_stain', 20, 7); k.dec('psx_old_mattress_mp_1', 19, 8);
        ctx.grime('puddle', 'P01-00', 8, 8, 1.6); ctx.grime('grime', 'P01-00', 6, 7, 1.8);
        k.at('wet_floor_sign', 20, 6, 0.4, 0.6, { face: 30 }); k.put('mop_bucket', 20, 6, -0.9, 0.9, { face: 200 });

        /* ── THE VENT STACK'S FAN ROOM: the compressor, the valve, the gauges, the breakers ── */
        P('air_compressor', 14, 9, { face: 90 }); P('gate_valve', 14, 10, { face: 90 });
        k.at('gauge_board', 15, 10, -0.2, 1.55, { face: S, y: k.up(1.2) }); k.at('breaker_panel', 15, 9, 1.6, 0.6, { face: E }); k.at('utility_box', 15, 10, 1.3, 0.9, { face: 270 });
        k.at('tool_chest', 15, 10, 1.25, -0.5, { face: 270 }); k.at('psx_jerrycan_1', 14, 10, 1.2, 1.2); k.at('broom', 15, 9, 1.5, -0.9); k.at('psx_pipe_1', 14, 9, -1.5, -1.3); k.at('psx_pipe_1', 14, 10, -1.5, 1.4);
        k.at('ind_vent', 14, 7, -1.2, 1.2, { face: 90 }); k.at('ind_vent', 15, 8, -1.0, 1.3, { face: 180 });        // the stack's own cowls at its foot

        /* ── PASS 3, THE DRESSING: what hangs, leans and lies about ── */
        k.at('cat', 6, 6, 0.4, 0.05, { y: 0.01, face: 200 });                                                               // on the counter
        ctx.props.push({ key: 'psx_ceiling_fan_mp_1_1_light_off', x: k.X(6), z: k.Z(7.6), ceil: true });                    // over the desk, under the bay's crown
        k.at('newspaper_bundles', 9, 7, -1.1, 1.3, { face: 40 }); k.at('garbage_bags', 16, 7, 0.9, 1.2, { face: 70 }); k.at('garbage_bag', 13, 6, 0.9, 1.3); k.at('metal_trash_can', 13, 5, 1.3, -1.1);
        k.at('hose_rack', 10, 5, 0.6, -1.6, { face: N, y: k.up(1.3) }); k.at('psx_light_switch_1', 3, 8, 1.1, 1.55, { face: S, y: k.up(1.3) }); k.at('psx_electrical_outlet_1', 6, 8, -1.3, 1.6, { face: S, y: k.up(0.4) });
        k.at('psx_cobweb_5', 2, 4, -1.4, -1.4, { y: k.up(2.9) }); k.at('psx_cobweb_1', 21, 4, 1.4, -1.4, { y: k.up(2.9) }); k.at('psx_cobweb_2', 9, 10, 1.4, 1.4, { y: k.up(2.6) }); k.at('psx_cobweb_4', 2, 10, -1.4, 1.4, { y: k.up(2.5) });
        k.at('psx_padlock_2', 5, 9, 1.0, 0.1, { y: 0.72, face: 270 });                                                      // on the safe
        /* the trap's passage: a rope, a bucket, cones and tape before the hole, bats under its vault */
        k.at('traffic_cone', 17, 10, 0.3, 1.2); k.at('traffic_cone', 19, 10, -0.3, 1.2); k.at('warning_tape', 18, 10, 0, 1.5, { face: 0 }); k.at('meshy_rope', 19, 9, 1.0, 0.6, { face: 40 });
        k.at('bat_grey', 18, 10, 0.5, -0.6, { y: k.up(3.0) }); k.at('bat_black', 17, 10, 0.2, 0.9, { y: k.up(2.8) }); k.at('bat_brown', 19, 11, -0.4, 0, { y: k.up(3.1) });
        /* past the cell door: what was left by the stair */
        k.at('psx_metal_barrel_mp_1', 23, 5, 0.6, -1.0); k.at('psx_metal_barrel_mp_2', 22, 5, 0.9, -1.1); k.at('cinder_block', 22, 7, 1.0, 1.3, { face: 30 });
        ctx.grime('oil', 'P01-00', 2, 9, 1.3); ctx.grime('blood', 'P01-00', 8, 3, 1.0);

        /* ── PASS 4, THE LIGHT AND THE AIR: tube lights under the bays' crowns (they glow, they are not real lights), steam, a lantern at the trap ── */
        [[3, 5], [9, 5], [15, 5.2], [21, 5.2], [3, 7.6]].forEach(q => ctx.props.push({ key: 'flicker_tube', x: k.X(q[0]), z: k.Z(q[1]), ceil: true }));
        k.at('chimney_smoke', 14, 7, 0, 1.35, { y: k.up(2.9) }); k.at('chimney_smoke', 15, 5, 0.9, 0.2, { y: 0.05 });           // the stack's louvre breathes; so does a floor drain
        k.at('railway_lantern', 18, 10, -0.9, 1.0, { noLight: true });
        if (lost.length) console.log('H: a blocker found its square taken: ' + lost.join(' '));
    },
    people(ctx) {
        const k = K, O = ctx.O.cells, say = race => ctx.sayOf(O, race);
        k.who('men in black', 3, 7, 0, say('men in black'));        // behind the counter
        k.who('gangster', 5, 3, 180, say('gangster'));              // cell 2
        k.who('politician', 17, 3, 180, say('politician'));         // cell 5
        k.who('zombie', 19, 7, 0, say('zombie'));                   // the tank
    },
};
