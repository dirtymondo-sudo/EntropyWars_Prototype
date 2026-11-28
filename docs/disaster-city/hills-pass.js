/* DISASTER CITY, THE HILLS REJOINED (2026-11-28, mondo: "you didnt catch or fix how disaster city in the hills is split apart now? I think that whole area
   needs a pass, ideally the disaster city letters can be placed in a way where there's at least one area where you can see the whole sign for a scenic view.
   So maybe the hills need to climb higher and the sign needs to be higher. Or some tall buildings in the way of the view need to move").
   Run by `spread.js` (the city bake's last step but the Harbour), on the spread room. Notes: docs/notes/areas-complexes.md "THE HILLS REJOINED".

   WHAT THE SPREAD DID TO THE HILLS: its two cuts run through the Hills too. The ground there is stretched across each new strip (heights run straight
   between the two edges, the sheets copied from the nearer one), and nothing stands on a strip. So: the sign's twelve letters stood six and six, 42 m apart,
   either side of Bluff Drive's strip; a seven-square rock outcrop at the canyon mouth became a 42 m grey slab at the head of the drive; the Highway's strip
   was 84 m of bare ramp; the foot road ran down 4 m, level for 42 m, down 4 m more and up 5 (find-bumps' last DIP).

   WHAT THIS FILE DOES (the district file, N.js, lifts the ridge and lays the letters as one word on it; the rest needs the spread room's own squares):
     1. THE CANYON MOUTH: the foot road from the Canyon Road to the mountain road's junction is one even grade (9 m in 77 m); the slab is a grass saddle.
     2. THE SIGN, ONE WORD: the twelve letters are set down about Bluff Drive's line (x 91), on the ridge's edge. The drive runs straight at them.
     3. THE SIGN VIEW: a flagstone terrace off Bluff Drive's promenade, 125 m from the letters (the whole word is 60 degrees of the walk's 82): a low wall,
        three coin telescopes, benches, a lamp. Every tree that stood in the sight cone between the terrace and the letters is taken out.
     4. THE SHELL: a white band shell (five round ribs, each smaller and further back, an apse behind) at the Highway's north end, on the park's axis,
        its back in the hill: the Highway runs straight at it. Benches on the park's lawn before it, the park's trees off the axis. (An original take on a
        canyon amphitheatre; it has no name on it: a name is mondo's.)
     5. THE STRIPS' BRUSH: chaparral, grey rocks, agave and trees on the two strips' grass (no tree before the letters), from a hash: no dice of the city's.
   `DC_NO_HILLS_PASS=1` = the spread room without any of it (a bisect). */
'use strict';
const r3 = v => Math.round(v * 1000) / 1000;
const hash = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + (c || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const smooth = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
const vnoise = (x, y, s) => { const ix = Math.floor(x), iy = Math.floor(y), tx = smooth(x - ix), ty = smooth(y - iy);
    return (hash(ix, iy, s) * (1 - tx) + hash(ix + 1, iy, s) * tx) * (1 - ty) + (hash(ix, iy + 1, s) * (1 - tx) + hash(ix + 1, iy + 1, s) * tx) * ty; };
const HW = 60, BL = 132, HR = 36;                 // the Highway's strip (24 squares), Bluff Drive's (12), the Hills' rows
const SIGN_X = 91;                                // the word's middle: the line between Bluff Drive's promenade and its bank
const VIEW = { i0: BL + 6, i1: BL + 8, j0: 42, j1: 46 };   // THE SIGN VIEW's squares (the bank's first three columns beside the promenade)
const BOWL = { i0: HW + 6, i1: HW + 17, j0: 33, j1: 35 };  // THE SHELL's level ground (twelve squares across the Highway's axis, the Hills' last three rows)

function lay(q) {
    const { room, T, H, P, TY, NX, NZ, X0, Z0, C, count, say } = q, SG = require('./districts/N.js').sign;
    const K = (i, j) => j * NX + i, lx = i => r3(X0 + i * C), lz = j => r3(Z0 + j * C), cx = i => r3(X0 + (i + 0.5) * C), cz = j => r3(Z0 + (j + 0.5) * C);
    const pal = T.paint.pal, sheet = name => { const i = pal.indexOf(name); if (i < 0) throw new Error('THE HILLS REJOINED: the ground palette has no ' + name); return i + 1; };
    const ROCK = sheet('rocks_5'), FLAG = sheet('calm_flagstone'), MARBLE = sheet('marble_light'), SLAB = sheet('urban:ConcreteSlab2a');
    const ty = (i, j) => String.fromCharCode(TY[K(i, j)] || 32);
    const gy = (x, z) => { const fi = Math.max(0, Math.min(NX - 1e-6, (x - X0) / C)), fj = Math.max(0, Math.min(NZ - 1e-6, (z - Z0) / C)), i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, k = K(i, j) * 4;
        return (H[k] * (1 - u) + H[k + 1] * u) * (1 - v) + (H[k + 2] * (1 - u) + H[k + 3] * u) * v; };
    const F = T.features, tally = { regraded: 0, slab: 0, letters: 0, cleared: 0, parkTrees: 0, trees: 0, brush: 0, rocks: 0, benches: 0 };
    const hillsZone = (T.zones || []).find(z => z.z1 <= -252 + 0.01 && z.z0 <= Z0 + 0.01);
    const roadSq = new Set();   // the Hills' road squares (the boxes cut out of the Hills' ground zone)
    ((hillsZone && hillsZone.out) || []).forEach(b => { for (let j = Math.round((b[1] - Z0) / C); j < Math.round((b[3] - Z0) / C); j++) for (let i = Math.round((b[0] - X0) / C); i < Math.round((b[2] - X0) / C); i++) roadSq.add(K(i, j)); });

    /* ══ 1. THE CANYON MOUTH: the foot road on one grade, the rock slab a saddle. A lattice over squares A0..A1 x J0..35, hung between its edges
       (the ground round it, the city's line, Bluff Drive's own two rows), the road's three lines fixed on the grade, the rest relaxed. ══ */
    { const A0 = 126, A1 = 147, J0 = 23, J1 = HR - 1, RJ = [32, 33, 34], W = A1 - A0 + 2, Hh = J1 - J0 + 2, L = new Float64Array(W * Hh), FIX = new Uint8Array(W * Hh), LK = (i, j) => (j - J0) * W + (i - A0);
      const corner = (i, j) => { let s = 0, n = 0;   // a lattice point: the mean of the corners that meet on it (the Hills' ground is one sheet)
          for (const [di, dj, c] of [[-1, -1, 3], [0, -1, 2], [-1, 0, 1], [0, 0, 0]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= NX || b >= HR) continue; s += H[K(a, b) * 4 + c]; n++; } return s / n; };
      for (let j = J0; j <= J1 + 1; j++) for (let i = A0; i <= A1 + 1; i++) { const k = LK(i, j); L[k] = corner(i, j); if (i === A0 || i === A1 + 1 || j === J0 || j === J1 + 1) FIX[k] = 1; }
      const yW = L[LK(A0, 33)], yE = L[LK(A1 + 1, 33)];
      for (const j of RJ) for (let i = A0 + 1; i <= A1; i++) { const k = LK(i, j); L[k] = yW + (yE - yW) * (i - A0) / (A1 + 1 - A0); FIX[k] = 1; }
      for (let i = BL + 1; i <= BL + 5; i++) { const k = LK(i, 35); L[k] = (L[LK(i, 34)] + L[LK(i, 36)]) / 2; FIX[k] = 1; }   // Bluff Drive's two rows up to the foot road: one even ramp
      for (let it = 0; it < 900; it++) for (let j = J0 + 1; j <= J1; j++) for (let i = A0 + 1; i <= A1; i++) { const k = LK(i, j); if (FIX[k]) continue; L[k] += 1.8 * ((L[k - 1] + L[k + 1] + L[k - W] + L[k + W]) / 4 - L[k]); }
      for (let j = J0; j <= J1; j++) for (let i = A0; i <= A1; i++) { const k = K(i, j);
          H[k * 4] = L[LK(i, j)]; H[k * 4 + 1] = L[LK(i + 1, j)]; H[k * 4 + 2] = L[LK(i, j + 1)]; H[k * 4 + 3] = L[LK(i + 1, j + 1)]; tally.regraded++;
          if (P[k] === ROCK) { P[k] = 0; tally.slab++; } }
      say.push('THE HILLS REJOINED: the foot road ' + r3(yW) + ' m at square ' + A0 + ' to ' + r3(yE) + ' m at ' + (A1 + 1) + ', one grade'); }

    /* ══ 2. THE SIGN, ONE WORD ══ */
    const zS = lz(SG.row), letters = [];
    for (let n = 0; n < 12; n++) { const f = F.find(g => g.id === 'hills:sign' + n); if (!f) throw new Error('THE HILLS REJOINED: no letter ' + n + ' (districts/N.js THE SIGN)');
        f.x = r3(SIGN_X + SG.off(n)); f.z = zS; letters.push(f); tally.letters++; }
    const xL = SIGN_X + SG.off(0) - SG.lw / 2, xR = SIGN_X + SG.off(11) + SG.lw / 2;
    let yFoot = 1e9; letters.forEach(f => { yFoot = Math.min(yFoot, gy(f.x, f.z)); });

    /* ══ 3. THE SIGN VIEW: the terrace, then the sight cone ══ */
    { const V = VIEW;
      for (let j = V.j0; j <= V.j1; j++) { const pk = K(V.i0 - 1, j) * 4, a = H[pk + 1], b = H[pk + 3];   // the promenade's east edge, carried out level
          for (let i = V.i0; i <= V.i1; i++) { const k = K(i, j); H[k * 4] = H[k * 4 + 1] = a; H[k * 4 + 2] = H[k * 4 + 3] = b; P[k] = FLAG; TY[k] = 'P'.charCodeAt(0); } }
      const x0 = lx(V.i0), x1 = lx(V.i1 + 1), z0 = lz(V.j0), z1 = lz(V.j1 + 1), inBox = (x, z, m) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m;
      /* the terrace's own squares, and the bank from the terrace north to the Hills' line: its trees stood between the telescopes and the letters */
      for (let n = F.length - 1; n >= 0; n--) if (F[n].k === 'tree' && (inBox(F[n].x, F[n].z, 2.5) || (F[n].x > lx(BL + 5) && F[n].x < lx(BL + 12) + 4 && F[n].z > lz(HR) - 1 && F[n].z < z1 + 3))) { F.splice(n, 1); tally.cleared++; }
      room.props = room.props.filter(p => !inBox(p.x, p.z, 0.2));
      const WALL = { h: 0.95, t: 0.4, key: 'urban:ConcreteWoodFormed1a', tint: '#d8d4cc' }, wall = (ax, az, bx, bz) => F.push(Object.assign({ k: 'wall', id: 'hills:signview:wall', x0: r3(ax), z0: r3(az), x1: r3(bx), z1: r3(bz) }, WALL));
      wall(x0 + 0.2, z0 + 0.25, x1 - 0.25, z0 + 0.25); wall(x1 - 0.25, z0 + 0.25, x1 - 0.25, z1 - 0.25); wall(x1 - 0.25, z1 - 0.25, x0 + 0.2, z1 - 0.25);
      for (let i = V.i0; i <= V.i1; i++) room.props.push({ key: 'coin_telescope', x: cx(i), z: r3(z0 + 1.5), face: 0 });
      room.props.push({ key: 'city_bench', x: cx(V.i0), z: cz(V.j0 + 2), face: 0 }, { key: 'city_bench', x: cx(V.i1), z: cz(V.j0 + 2), face: 0 }, { key: 'city_bench', x: cx(V.i0 + 1), z: cz(V.j0 + 3), face: 0 }, { key: 'trash_bin', x: r3(x1 - 1.1), z: r3(z1 - 1.1) });
      T.gen.lamps.push({ x: cx(V.i0 + 1), z: r3(z1 - 0.9), nx: 0, nz: -1, d: 'H' });
      /* THE SIGHT CONE: from a head on the terrace to the letters' feet, seven metres wider each side. A tree that rises into it goes. */
      const ex = cx(V.i0 + 1), ez = cz(V.j0 + 1), ey = gy(ex, ez) + 1.7, yb = yFoot + 2.4;
      for (let n = F.length - 1; n >= 0; n--) { const f = F[n]; if (f.k !== 'tree' || f.z >= ez || f.z <= zS) continue;
          const t = (ez - f.z) / (ez - zS), a = ex + (xL - ex) * t - 7, b = ex + (xR - ex) * t + 7; if (f.x < a || f.x > b) continue;
          if (gy(f.x, f.z) + (f.h || 7) * 2 > ey + (yb - ey) * t - 0.5) { F.splice(n, 1); tally.cleared++; } }   // (a tree's crown stands about twice its `h` on screen)
      say.push('THE HILLS REJOINED: THE SIGN VIEW at ' + ex + ', ' + ez + ' (eye ' + r3(ey) + ' m), the letters ' + r3(xL) + '..' + r3(xR) + ' at z ' + zS + ' on ' + r3(yFoot) + ' m, ' + r3(ez - zS) + ' m away'); }

    /* ══ 4. THE SHELL at the Highway's north end ══ */
    const HC = lx(HW + 12);
    { const B = BOWL, line = (i, c) => H[K(i, HR) * 4 + c];   // the city's own heights on the line (the park's north edge)
      const old = {}; for (let j = B.j0 - 2; j <= B.j1; j++) for (let i = B.i0 - 2; i <= B.i1 + 2; i++) old[K(i, j)] = [H[K(i, j) * 4], H[K(i, j) * 4 + 1], H[K(i, j) * 4 + 2], H[K(i, j) * 4 + 3]];
      for (let j = B.j0; j <= B.j1; j++) for (let i = B.i0; i <= B.i1; i++) { const k = K(i, j); H[k * 4] = H[k * 4 + 2] = line(i, 0); H[k * 4 + 1] = H[k * 4 + 3] = line(i, 1);
          P[k] = (i >= B.i0 + 2 && i <= B.i1 - 2) ? MARBLE : SLAB; }
      /* the two squares either side come down to it in one slope; the two rows behind climb from it to the road */
      for (let j = B.j0; j <= B.j1; j++) { for (const [i, w0, w1] of [[B.i0 - 2, 0, 0.5], [B.i0 - 1, 0.5, 1]]) { const k = K(i, j), o = old[k], f = line(B.i0, 0); H[k * 4] = o[0] + (f - o[0]) * w0; H[k * 4 + 1] = o[1] + (f - o[1]) * w1; H[k * 4 + 2] = o[2] + (f - o[2]) * w0; H[k * 4 + 3] = o[3] + (f - o[3]) * w1; }
          for (const [i, w0, w1] of [[B.i1 + 1, 1, 0.5], [B.i1 + 2, 0.5, 0]]) { const k = K(i, j), o = old[k], f = line(B.i1, 1); H[k * 4] = o[0] + (f - o[0]) * w0; H[k * 4 + 1] = o[1] + (f - o[1]) * w1; H[k * 4 + 2] = o[2] + (f - o[2]) * w0; H[k * 4 + 3] = o[3] + (f - o[3]) * w1; } }
      for (let i = B.i0 - 2; i <= B.i1 + 2; i++) { const top = c => H[K(i, B.j0 - 3) * 4 + 2 + c], bot = c => H[K(i, B.j0) * 4 + c];
          for (let j = B.j0 - 2; j < B.j0; j++) { const k = K(i, j), y = (c, jl) => top(c) + (bot(c) - top(c)) * (jl - (B.j0 - 2)) / 2; H[k * 4] = y(0, j); H[k * 4 + 1] = y(1, j); H[k * 4 + 2] = y(0, j + 1); H[k * 4 + 3] = y(1, j + 1); if (P[k] === ROCK) P[k] = 0; } }
      /* the shell: five half-round ribs, each smaller and starting further back, all running to the back; an apse closes it. Parts frame: x east, +z south (the park) */
      const ST = 'marble_light', parts = [], zc = cz(B.j1), z0 = 1.6, zEnd = -8.9, N = 5;
      for (let k = 0; k < N; k++) { const span = 35 - 4.2 * k, rise = 15 - 1.6 * k, zk = z0 - 2.1 * k;
          parts.push({ s: 'roof', form: 'barrel', p: [0, 0, r3((zk + zEnd) / 2)], ry: 90, size: [r3(zk - zEnd), rise, span], seg: 20, ends: false, ds: true, key: ST, tint: k % 2 ? 0xe9e5da : 0xffffff, glow: k % 2 ? 0.86 : 1, uv: 3.5 });
          parts.push({ s: 'roof', form: 'barrel', p: [0, 0, r3(zk - 0.2)], ry: 90, size: [0.4, rise + 0.35, span + 0.7], seg: 20, ends: false, ds: true, key: ST, tint: 0xffffff, glow: 1.08, uv: 3.5 }); }   // each rib's lip (`glow`: drawn unlit, so the shell is white from the Highway at any hour; a lit vault's inside is its dark side)
      parts.push({ s: 'dome', p: [0, 0, zEnd], r: 17.5, h: 15, rz: 4.6, a0: 180, arc: 180, seg: 20, rings: 6, ds: true, key: ST, tint: 0xe9e5da, glow: 0.8, uv: 3.5 });
      F.push({ k: 'arch', id: 'hills:shell', x: HC, z: zc, rot: 0, parts });
      /* nobody walks through its sides or its back: whole squares (the ribs' feet close in toward the back) */
      const block = (i, j) => F.push({ k: 'wall', id: 'hills:shell', x0: cx(i), z0: cz(j), x1: cx(i), z1: cz(j), h: 3, t: 3.5, key: 'urban:ConcreteGeneric3a', ghost: true, rail: false, block: true });
      const c0 = HW + 7, c1 = HW + 16;   // the ribs stand on squares c0..c1 (35 m)
      block(c0, 35); block(c1, 35); block(c0, 34); block(c0 + 1, 34); block(c1 - 1, 34); block(c1, 34); for (let d = 0; d < 3; d++) { block(c0 + d, 33); block(c1 - d, 33); } for (let i = c0; i <= c1; i++) block(i, 32);
      /* the park before it: the trees off the axis, benches in rows on the lawn (the cross path, row 44, and the middle path stay) */
      for (let n = F.length - 1; n >= 0; n--) { const f = F[n]; if (f.k !== 'tree' || f.z < lz(HR) || f.z > lz(50)) continue; const d = Math.abs(f.x - HC); if (d < 14 || (d < 30 && f.z < lz(44))) { F.splice(n, 1); tally.parkTrees++; } }
      for (const j of [38, 40, 42]) for (let d = 2; d <= 7; d++) for (const s of [-1, 1]) { const i = s < 0 ? HW + 11 - d : HW + 12 + d; if (ty(i, j) !== 'G') continue; room.props.push({ key: 'park_bench', x: cx(i), z: cz(j), face: 0 }); tally.benches++; } }

    /* ══ 5. THE STRIPS' BRUSH ══ */
    { const BRUSH = ['leafy_bush', 'leafy_bush', 'psxg_dead_bush_1', 'psxg_dead_bush_2', 'leafy_bush'], ROCKS = ['psxg_rock_1', 'psxg_rock_2', 'psxg_rock_3', 'psxg_rock_2'], CACT = ['agave', 'yucca', 'prickly_pear'];
      const BAND = j => j < 12 ? { kinds: ['pine', 'tree_4', 'tree', 'pine'], t: 0.07, h: [5.5, 8] } : j < 24 ? { kinds: ['tree_3', 'tree_52', 'tree_3', 'tree_2'], t: 0.06, h: [4.5, 7] } : { kinds: ['tree_3', 'tree_52', 'palm'], t: 0.04, h: [5, 7.5] };
      for (const [a, b, noTree] of [[HW, HW + 23, false], [BL, BL + 11, true]]) for (let j = 0; j < HR; j++) for (let i = a; i <= b; i++) { const k = K(i, j);
          if (P[k] !== 0 || roadSq.has(k) || ty(i, j) === 'R') continue;
          if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(d => { const kk = K(i + d[0], Math.max(0, Math.min(HR - 1, j + d[1]))); return roadSq.has(kk) || (P[kk] !== 0 && P[kk] !== ROCK); })) continue;   // not on a road's or a trail's edge
          if (i >= BOWL.i0 - 3 && i <= BOWL.i1 + 3 && j >= BOWL.j0 - 3) continue;
          if (Math.abs(j - SG.row) <= 1 && cx(i) > xL - 6 && cx(i) < xR + 6) continue;   // the letters' own line
          const hh = [H[k * 4], H[k * 4 + 1], H[k * 4 + 2], H[k * 4 + 3]]; if (Math.max(...hh) - Math.min(...hh) > 3) continue;
          const u = hash(i, j, 101), m = BAND(j), x = r3(cx(i) + (hash(i, j, 102) - 0.5) * 2), z = r3(cz(j) + (hash(i, j, 103) - 0.5) * 2), face = Math.floor(hash(i, j, 104) * 360), patch = vnoise(i / 5, j / 5, 77);
          if (!noTree && u < m.t) { F.push({ k: 'tree', x, z, kind: m.kinds[Math.floor(hash(i, j, 105) * m.kinds.length)], h: r3(m.h[0] + hash(i, j, 106) * (m.h[1] - m.h[0])), r: 0.8, keep: true }); tally.trees++; }
          else if (u < m.t + 0.2 && patch > 0.5) { room.props.push({ key: BRUSH[Math.floor(hash(i, j, 107) * BRUSH.length)], x, z, face }); tally.brush++; }
          else if (u > 0.955) { room.props.push({ key: ROCKS[Math.floor(hash(i, j, 108) * ROCKS.length)], x, z, face }); tally.rocks++; }
          else if (u > 0.93 && j >= 12) { room.props.push({ key: CACT[Math.floor(hash(i, j, 109) * CACT.length)], x, z, face }); tally.brush++; } } }

    count.hillsPass = tally;
}
module.exports = { lay, SIGN_X, VIEW, BOWL };
