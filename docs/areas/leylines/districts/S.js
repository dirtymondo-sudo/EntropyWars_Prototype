/* LEYLINES · district S · STONEHENGE (9 plots: P06..P08 x rows 00..02; squares x 72..107, y 0..35) — the zone's PILOT district.
   One thread a file; the tool (bake-leylines.js) calls the stages below with this district's ctx. Rules: docs/notes/areas-complexes.md
   "LEYLINES ON PLOTS" + "LEYLINES, THE ZONE KIT". The circle's middle is A.henge (a corner where four squares meet); every stone is a blocker
   on a square's middle.
   STANDS TODAY (first build): the chalk bank and the ditch (two rings, about 80 and 95 m across, open to the north-east and the south); the
   Sarsen Circle (30 sarsens, a lintel ring on the standing side, the south-west quarter fallen); the five trilithons in a horseshoe open to the
   south, the great one at the back; twelve bluestones; the altar; three station stones; the Avenue to the north-east and the Heel Stone; the Long
   Barrow and three round barrows; the Solstice Camp; Room 56's frame by the South Gate; sheep, crows; the old Plain's three people and lines.
   PASS 1, EXTERIORS (the pilot): the fallen quarter is real fallen sarsens with their lintels lying by them; the 56 Aubrey holes (chalk spots
   inside the bank: Room 56's own number); the Avenue runs between two low banks, the Slaughter Stone lies in its mouth; two portal stones at
   the South Gate; five barrows now (two more on the Plain), each in its ring ditch.
   NOT YET: see the pass list at the end of this file's section in the notes. */
'use strict';
/* two more round barrows on the Plain (squares; the tool adds them to the heights). The first three are the layout's own (A.barrows). */
const MORE = [[80, 28], [86, 33]];
exports.hills = MORE.map(b => ({ x: b[0] + 0.5, y: b[1] + 0.5, r: 2.8, flat: 0.7, h: 1.9 }));
const RING = (() => { const o = [[0.5, 5.5], [1.5, 5.5], [2.5, 4.5], [3.5, 4.5], [4.5, 3.5], [4.5, 2.5], [5.5, 1.5], [5.5, 0.5]], all = [];
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(s => o.forEach(q => all.push([q[0] * s[0], q[1] * s[1]])));
    return all.filter(q => !(q[0] === 3.5 && q[1] === -4.5) && !(q[0] === 4.5 && q[1] === -3.5)).sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0])); })();
const FALLEN = q => q[0] < 0 && q[1] > 0 && (Math.round(q[0] * 2 + q[1] * 3) % 3 !== 0);   // the south-west quarter: two stones in three are down
/* the ground: the plan's square rings are cleared, the bank's chalk and the Avenue are stamped round (the tool's half-square paint) */
exports.plan = ctx => { const { A, cell } = ctx, h = A.henge;
    for (let y = 0; y < 36; y++) for (let x = 72; x < 108; x++) { const d = Math.hypot(x + 0.5 - h.x, y + 0.5 - h.y), ch = cell[y][x];
        if (ch === 'c' && !(x >= 91 && x < 93 && y >= 18)) cell[y][x] = 'g'; if (ch === 'p' && d > h.ditch - 1.6 && d < h.ditch + 1.3) cell[y][x] = 'g'; } };
exports.paint = ctx => { const { A, C, gx, gz } = ctx, h = A.henge, X = gx(h.x), Z = gz(h.y), R = h.bank * C;
    const seg = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - ax - t * dx, z - az - t * dz); };
    ctx.stamp((x, z) => { const d = Math.hypot(x - X, z - Z), a = (Math.atan2(z - Z, x - X) * 180 / Math.PI + 360) % 360;
        if (seg(x, z, X + 15, Z - 15, gx(107), gz(1)) < 3.6 && d > 21) return 'marble_light';                       // THE AVENUE
        if (Math.abs(d - R) < 2.4 && !(a > 303 && a < 327) && !(a > 80 && a < 100)) return 'marble_light';       // the bank's chalk crest
        if (Math.abs(d - (R - 6.2)) < 1.0 && Math.abs(((a + 3.2) % (360 / 56)) - 3.2) < 1.35) return 'marble_light';   // THE 56 AUBREY HOLES
        return null; }); };
exports.build = ctx => {
    const { A, C, feat, look, gx, gz } = ctx, h = A.henge, X = gx(h.x), Z = gz(h.y);
    const arc = (r, a0, a1) => { const pts = []; for (let a = a0; a <= a1 + 0.01; a += 5) pts.push([ctx.r2(X + r * Math.cos(a * Math.PI / 180)), ctx.r2(Z + r * Math.sin(a * Math.PI / 180))]); return pts; };
    /* THE BANK + THE DITCH: open to the north-east (the Avenue) and to the south (the fork up from the line) */
    [[100, 303], [327, 440]].forEach(q => { feat({ k: 'ridge', pts: arc(h.bank * C, q[0], q[1]), w: 10, h: 1.0 }); feat({ k: 'ridge', pts: arc(h.ditch * C, q[0], q[1]), w: 9, h: -0.9 }); });
    /* THE AVENUE's two banks, from the henge's own bank out to the corner */
    { const ax = X + 31, az = Z - 31, bx = gx(106.5), bz = gz(1.5), n = Math.hypot(bx - ax, bz - az), px = -(bz - az) / n * 6.2, pz = (bx - ax) / n * 6.2;
      [1, -1].forEach(sd => feat({ k: 'ridge', pts: [[ctx.r2(ax + sd * px), ctx.r2(az + sd * pz)], [ctx.r2(bx + sd * px), ctx.r2(bz + sd * pz)]], w: 4.5, h: 0.55 })); }
    /* every barrow in its ring ditch */
    A.barrows.concat(MORE).forEach(b => { const pts = []; for (let a = 0; a <= 360; a += 20) pts.push([ctx.r2(ctx.cx(b[0]) + 12.5 * Math.cos(a * Math.PI / 180)), ctx.r2(ctx.cz(b[1]) + 12.5 * Math.sin(a * Math.PI / 180))]); feat({ k: 'ridge', pts, w: 3.5, h: -0.45 }); });
    /* the fallen quarter's lintels, lying where they dropped, and THE SLAUGHTER STONE in the Avenue's mouth (drawn; knee-high, walked over) */
    look('henge:fallen', X, Z, 0, a => { [[-13.5, 21.5, 25], [-21, 13, 100], [-17.5, 18.5, 60], [-9, 23.5, 170], [-24, 8.5, 80]].forEach(q => a.box(q[0], 0, q[1], 4.6, 0.7, 1.1, 'rock_wall_1', 0xc4c4bc, { ry: q[2] }));
        a.box(25.5, 0, -25.5, 6.4, 0.55, 2.1, 'rock_wall_1', 0xb8b4aa, { ry: 45 }); });
    /* THE LINTELS: one stone across each pair of standing neighbours (drawn; the sarsens under it are the blockers) */
    look('henge:lintels', X, Z, 0, a => { for (let i = 0; i < RING.length; i++) { const p = RING[i], q = RING[(i + 1) % RING.length]; if (FALLEN(p) || FALLEN(q)) continue;
        const dx = (q[0] - p[0]) * C, dz = (q[1] - p[1]) * C, len = Math.hypot(dx, dz); if (len > 6) continue;
        a.box((p[0] + q[0]) / 2 * C, 4.25, (p[1] + q[1]) / 2 * C, len + 1.3, 0.75, 1.15, 'rock_wall_1', 0xd0d0c8, { ry: -Math.atan2(dz, dx) * 180 / Math.PI, under: true }); } });
};
exports.dress = ctx => {
    const { A, C, P, Pm, dec, tree, gx, gz, cx, cz, taken, rnd } = ctx, h = A.henge, X = gx(h.x), Z = gz(h.y), sq = (dx, dy) => [h.x + dx - 0.5, h.y + dy - 0.5];
    /* THE SARSEN CIRCLE */
    RING.forEach(q => { const s = sq(q[0], q[1]), face = Math.round(90 - Math.atan2(-q[1], q[0]) * 180 / Math.PI);
        if (FALLEN(q)) { P(rnd() < 0.5 ? 'hw_stone_2' : 'hw_stone_4', s[0], s[1], { h: 1.4, face: Math.round(rnd() * 360) }); dec('cave_stone', s[0], s[1]); }
        else P('sarsen', s[0], s[1], { face, h: 4.4 }); });
    /* THE TRILITHONS: a horseshoe open to the south, the great one at the back (each fills two squares) */
    [[-8.75, -7, 90], [8.75, -7, 90], [-8.75, 7, 90], [8.75, 7, 90]].forEach(q => { Pm('trilithon', X + q[0], Z + q[1], { face: q[2] }); [-1.75, 1.75].forEach(o => taken.add(Math.floor(h.x + q[0] / C) + ':' + Math.floor(h.y + (q[1] + o) / C))); });
    Pm('trilithon', X, Z - 12.25, { face: 0, h: 7.4 }); taken.add((h.x - 1) + ':' + (h.y - 4)); taken.add(h.x + ':' + (h.y - 4));
    /* the bluestones, the altar, the station stones, the Heel Stone */
    [[1.5, -3.5], [-1.5, -3.5], [3.5, -1.5], [3.5, -0.5], [3.5, 0.5], [3.5, 1.5], [-3.5, -1.5], [-3.5, -0.5], [-3.5, 0.5], [-3.5, 1.5], [1.5, 3.5], [-1.5, 3.5]].forEach(q => { const s = sq(q[0], q[1]); P('menhir', s[0], s[1], { h: 2.0, face: Math.round(rnd() * 360) }); });
    Pm('stone_altar', X, Z - 5.25, { face: 0 }); taken.add((h.x - 1) + ':' + (h.y - 2)); taken.add(h.x + ':' + (h.y - 2));
    [[84, 10], [99, 25], [84, 25]].forEach(q => P('menhir', q[0], q[1], { h: 1.6 }));
    P('sarsen', 103, 8, { h: 4.8, face: 40 });
    /* THE SOUTH GATE: two fires where the fork comes through the bank */
    P('brazier', 89, 30); P('brazier', 94, 30); P('sarsen', 90, 29, { h: 3.6, face: 80 }); P('sarsen', 93, 29, { h: 3.6, face: 100 }); P('signpost', 90, 34, { face: 180 }); P('signpost', 100, 13, { face: 45 });
    /* THE LONG BARROW's stone front (its east end) + the round barrows' kerb stones */
    P('sarsen', 81, 2, { h: 3.0, face: 90 }); P('sarsen', 81, 4, { h: 3.0, face: 90 }); P('menhir', 82, 2, { h: 1.8 }); P('menhir', 82, 5, { h: 1.8 });
    A.barrows.concat(MORE).forEach(b => { dec('cave_stone', b[0] - 2, b[1] + 2); dec('cave_stone', b[0] + 2, b[1] - 2); dec('psxg_rock_1', b[0] + 2, b[1] + 2, { h: 0.7 }); });
    /* THE SOLSTICE CAMP (the old Plain's fire and instruments) */
    { const c = A.camp; P('campfire', c.x, c.y); P('camping_tent', c.x - 2, c.y - 1, { face: 100 }); P('camping_tent', c.x + 2, c.y + 1, { face: 250 }); P('fallen_log', c.x, c.y + 2, { face: 0 });
      dec('instrument_drum', c.x - 1, c.y + 1); dec('instrument_guitar_lying', c.x + 1, c.y - 1); dec('instrument_tambourine', c.x + 1, c.y + 1); dec('instrument_maracas', c.x - 1, c.y - 1); dec('instrument_seed_pod', c.x, c.y - 1);
      P('sea_chest', c.x + 3, c.y - 1, { face: 200 }); dec('paper_sheet', c.x + 3, c.y, { y: 0.01 }); }
    /* sheep on the Plain, crows on the lintels */
    [[75, 27], [78, 28], [80, 26], [83, 30], [79, 33], [86, 32], [74, 9], [78, 10], [106, 22], [105, 28]].forEach(q => dec('decor_sheep', q[0], q[1]));
    [[4.5, 2.5], [5.5, -0.5], [-2.5, -4.5]].forEach(q => Pm('crow', X + q[0] * C, Z + q[1] * C, { y: 5.05, face: Math.round(rnd() * 360) }));
    [[72, 0], [73, 7], [72, 17], [73, 34], [107, 34]].forEach((q, i) => tree(q[0], q[1], i % 2 ? 'tree_3' : 'tree_5', 6 + (i % 3)));
};
exports.people = ctx => { const { native, sayOf, OLD } = ctx;
    native('shaman', 92, 22, 200, sayOf(OLD.henge, 'shaman')); native('conspiracy theorist', 77, 19, 90, sayOf(OLD.henge, 'conspiracy theorist')); native('knight', 103, 27, 300, sayOf(OLD.henge, 'knight')); };
