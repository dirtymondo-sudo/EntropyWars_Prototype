/* DISASTER CITY, THE SPREAD (2026-11-27, mondo: "it really doesn't feel that big ... more side streets and scenic routes ... more space in between buildings
   ... the highway could actually go through the city and there could be an underpass with a U-turn ... look at how the desert highway did its highway").
   Read by `node bake-disaster-city.js` as its LAST step. Notes: docs/notes/areas-complexes.md "DISASTER CITY, THE SPREAD".

   THE TOOL STILL BUILDS THE COMPACT CITY (12 x 12 plots, 504 m, every district file in its home frame, nothing in them changed). This file then takes the
   finished room and SETS THE NINE DISTRICTS APART: two cuts down the city (x -84 and 84 in the compact room) and two across it (z -84 and 84) are opened
   into strips of new ground, a column is added on the west side and a row on the south, and the new ground is laid with road:

       x (squares)   0..11  THE WOODLAND PARKWAY · 12..59 Civic / University / Southside · 60..83 THE HIGHWAY · 84..131 Financial / Hero Plaza / Sports
                     132..143 BLUFF DRIVE · 144..191 Entertainment / Bayside / Industrial · 192..223 the beach strip
       z (squares)   0..35 the Hills · 36..83 the north districts · 84..95 NORTH AVENUE · 96..143 the middle districts · 144..155 SOUTH AVENUE
                     156..203 the south districts · 204..215 DESERT VIEW DRIVE (the bay under Industrial)

   A compact place (x, z) stands at x + DX[its column band], z + DZ[its row band] (`map`). Because the cuts run the whole room, every straight street of the
   compact city stays straight: it just runs on across the new strip (a junction on an avenue, an underpass under the highway). The Hills and the beach are
   cut by the same lines; there the ground is stretched across the strip (heights run between the two edges, the sheets copied from the nearer one).
   The room is centred again on what is used (784 x 756 m), so the two dead strips the compact room carried (west and south) are gone.

   RULES: a district thread changes nothing for this file. A NEW thing on the new ground is written HERE, in the new room's squares (`I`, `J` below).
   Whoever reads a compact place outside the room (a link end, a marker) maps it with `map`. */
'use strict';
const vm = require('vm');
const C = 3.5;
const CUTX = [-84, 84], CUTZ = [-84, 84], DX = [-98, -14, 28], DZ = [0, 42, 84];
const OX0 = -252, OZ0 = -378, ONX = 176, ONZ = 216, OPZ = 180;          // the compact grids: heights 176 x 216 (the last 36 rows = the dead south strip), paint 176 x 180
const X0 = -392, Z0 = -378, NX = 224, NZ = 216;                          // the new room's grids (one for heights, one for paint)
const r3 = v => Math.round(v * 1000) / 1000;
const band = (v, cuts, side) => { let b = 0; for (const c of cuts) { if (v > c + 1e-6 || (Math.abs(v - c) <= 1e-6 && (side || 1) > 0)) b++; } return b; };
/* a compact place -> its place in the spread room. `sx` / `sz`: which side a place exactly on a cut goes to (-1 the low side, 1 the high side, default high) */
const map = (x, z, sx, sz) => [r3(x + DX[band(x, CUTX, sx)]), r3(z + DZ[band(z, CUTZ, sz)])];
const colOld = i => i < 12 ? -1 : i < 60 ? i - 12 : i < 84 ? -1 : i < 132 ? i - 36 : i < 144 ? -1 : i - 48;
const rowOld = j => j < 84 ? j : j < 96 ? -1 : j < 144 ? j - 12 : j < 156 ? -1 : j < 204 ? j - 24 : -1;
const lx = i => r3(X0 + i * C), lz = j => r3(Z0 + j * C), cx = i => r3(X0 + (i + 0.5) * C), cz = j => r3(Z0 + (j + 0.5) * C);
const b64 = { dec: s => new Uint8Array(Buffer.from(s, 'base64')), enc: u => Buffer.from(u.buffer, u.byteOffset, u.byteLength).toString('base64') };

/* ── reading and writing the room's block ── */
const ser = v => {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return '[' + v.map(q => (q && q.__gridiron) ? '...hqGridironMarks(' + ser(q.__gridiron) + ')' : ser(q)).join(',') + ']';
    if (v.__shell) return 'hqCityShell(' + ser(v.__shell) + ')';
    return '{' + Object.keys(v).filter(k => v[k] !== undefined).map(k => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? k : ser(k)) + ':' + ser(v[k])).join(',') + '}';
};
const parse = block => {
    const sb = { hqCityShell: o => ({ __shell: o }), hqGridironMarks: o => [{ __gridiron: o }] };
    const o = vm.runInNewContext('({' + block + '})', sb);
    return o.site_prebuilt_downtown_streets;
};

function apply(block, opt) {
    opt = opt || {};
    const room = parse(block), T = room.terrain, say = [], count = {};
    const warn = s => { say.push(s); };

    /* ══ 1. THE GRIDS: heights (four corners a square, cm), the walk-in flag, the painted sheet ══ */
    const oh = new Int16Array(b64.dec(T.slope.cells.d).buffer), of = b64.dec(T.slope.cells.f), op = b64.dec(T.paint.d);
    if (T.slope.cells.nx !== ONX || T.slope.cells.nz !== ONZ || T.paint.nx !== ONX || T.paint.nz !== OPZ) throw new Error('THE SPREAD: the compact room is not the size this file was written for');
    const H = new Float32Array(NX * NZ * 4), FL = new Uint8Array(NX * NZ), P = new Uint8Array(NX * NZ), KIND = new Uint8Array(NX * NZ);   // KIND: 1 copied, 2 stretched nature, 3 new city ground, 4 the bay
    const K = (i, j) => j * NX + i;
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const oi = colOld(i), oj = rowOld(j); if (oi < 0 || oj < 0) continue;
        const k = K(i, j), o = (oj * ONX + oi) * 4; for (let q = 0; q < 4; q++) H[k * 4 + q] = oh[o + q] / 100; FL[k] = of[oj * ONX + oi]; P[k] = op[oj * ONX + oi]; KIND[k] = 1; }
    const NEWC = [[0, 11], [60, 83], [132, 143]], NEWR = [[84, 95], [144, 155], [204, 215]];
    /* the Hills' rows over a new column: stretched between the two edges (the west column: the edge carried out) */
    for (let j = 0; j < 36; j++) for (const [a, b] of NEWC) { const n = b - a + 1;
        for (let i = a; i <= b; i++) { const k = K(i, j), t0 = (i - a) / n, t1 = (i - a + 1) / n;
            if (a === 0) { const s = K(12, j); H[k * 4] = H[k * 4 + 1] = H[s * 4]; H[k * 4 + 2] = H[k * 4 + 3] = H[s * 4 + 2]; P[k] = P[s]; FL[k] = FL[s]; }
            else { const L = K(a - 1, j), R = K(b + 1, j), l0 = H[L * 4 + 1], l1 = H[L * 4 + 3], q0 = H[R * 4], q1 = H[R * 4 + 2];
                H[k * 4] = l0 + (q0 - l0) * t0; H[k * 4 + 1] = l0 + (q0 - l0) * t1; H[k * 4 + 2] = l1 + (q1 - l1) * t0; H[k * 4 + 3] = l1 + (q1 - l1) * t1; const s = (i - a) < n / 2 ? L : R; P[k] = P[s]; FL[k] = FL[s]; }
            KIND[k] = 2; } }
    /* the beach strip's squares in a new row: the same, north to south (the south row: the edge carried out) */
    for (let i = 192; i < NX; i++) for (const [a, b] of NEWR) { const n = b - a + 1;
        for (let j = a; j <= b; j++) { const k = K(i, j), t0 = (j - a) / n, t1 = (j - a + 1) / n;
            if (a === 204) { const s = K(i, 203); H[k * 4] = H[k * 4 + 2] = H[s * 4 + 2]; H[k * 4 + 1] = H[k * 4 + 3] = H[s * 4 + 3]; P[k] = P[s]; FL[k] = FL[s]; }
            else { const U = K(i, a - 1), D = K(i, b + 1), u0 = H[U * 4 + 2], u1 = H[U * 4 + 3], d0 = H[D * 4], d1 = H[D * 4 + 1];
                H[k * 4] = u0 + (d0 - u0) * t0; H[k * 4 + 1] = u1 + (d1 - u1) * t0; H[k * 4 + 2] = u0 + (d0 - u0) * t1; H[k * 4 + 3] = u1 + (d1 - u1) * t1; const s = (j - a) < n / 2 ? U : D; P[k] = P[s]; FL[k] = FL[s]; }
            KIND[k] = 2; } }
    /* THE BAY under Industrial (the south row east of Bluff Drive): the port's south edge falls into the water */
    const SAND = T.paint.pal.indexOf('desert') + 1, GRASS = T.paint.pal.indexOf('grass_2') + 1, WALK = 1, DIRT = T.paint.pal.indexOf('dirt_2') + 1;
    /* (a shore all round it: the floor falls half a metre a square from the Bluff's foot and from the Coast Road's spit, faster from the port's quay,
       so whoever walks or falls in walks out again) */
    { const bayH = (ci, cj) => { const e = H[K(Math.min(191, ci), 203) * 4 + (ci > 191 ? 3 : 2)]; return Math.max(-3, e - 1.2 * (cj - 204), -0.6 - 0.5 * (ci - 144), -0.5 * (192 - ci)); };
      for (let j = 204; j < NZ; j++) for (let i = 144; i < 192; i++) { const k = K(i, j); H[k * 4] = bayH(i, j); H[k * 4 + 1] = bayH(i + 1, j); H[k * 4 + 2] = bayH(i, j + 1); H[k * 4 + 3] = bayH(i + 1, j + 1); P[k] = SAND; KIND[k] = 4; } }
    /* THE SHORE IN THE NEW ROWS (the beach strip's sea is not in the height sheet: rows of sunk plateaus cut it, and a new row has none, so the
       stretch above left LAND to the room's east line there). Each new row gets its own beach: flat sand from the district's edge out to a shore
       line that joins the coast north and south of it, then the floor falls 0.9 m a square to the sea's floor (a slope a walker comes back up).
       The south row: the Coast Road's causeway (the quay's three columns, carried out) keeps its ground and the sea lies east of it. */
    { const FLOOR = -3.6, shore = [[84, 95, () => 213], [144, 155, cj => 206 - 10 * (cj - 144) / 12]];
      for (const [a, b, sc] of shore) { const w = []; for (let cj = a; cj <= b + 1; cj++) w[cj] = cj <= b ? H[K(192, cj) * 4] : H[K(192, b) * 4 + 2];
          const hB = (ci, cj) => { const land = ci <= 192 ? w[cj] : ci >= 195 ? 0 : w[cj] * (195 - ci) / 3, c = sc(cj); return ci <= c ? land : Math.max(FLOOR, -0.9 * (ci - c)); };
          for (let j = a; j <= b; j++) for (let i = 192; i < NX; i++) { const k = K(i, j); H[k * 4] = hB(i, j); H[k * 4 + 1] = hB(i + 1, j); H[k * 4 + 2] = hB(i, j + 1); H[k * 4 + 3] = hB(i + 1, j + 1); if (i >= 195) { P[k] = SAND; FL[k] = 0; } } }
      const hS = ci => Math.max(FLOOR, -0.9 * (ci - 195));
      for (let j = 204; j < NZ; j++) for (let i = 195; i < NX; i++) { const k = K(i, j); H[k * 4] = H[k * 4 + 2] = hS(i); H[k * 4 + 1] = H[k * 4 + 3] = hS(i + 1); P[k] = SAND; FL[k] = 0; } }
    /* THE NEW CITY GROUND: every other new square. Its heights are one smooth sheet hung between the edges round it (a relaxed lattice). */
    const LW = NX + 1, LAT = new Float32Array(LW * (NZ + 1)), FIX = new Uint8Array(LW * (NZ + 1)), LK = (i, j) => j * LW + i;
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) if (!KIND[K(i, j)]) KIND[K(i, j)] = 3;
    { const sum = new Float32Array(LAT.length), n = new Uint8Array(LAT.length);
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const k = K(i, j); if (KIND[k] === 3) continue;
          [[i, j, 0], [i + 1, j, 1], [i, j + 1, 2], [i + 1, j + 1, 3]].forEach(([a, b, q]) => { sum[LK(a, b)] += H[k * 4 + q]; n[LK(a, b)]++; }); }
      for (let q = 0; q < LAT.length; q++) if (n[q]) { LAT[q] = sum[q] / n[q]; FIX[q] = 1; }
      /* a start value for the free points (the nearest fixed one along the row), then the relaxation */
      for (let j = 0; j <= NZ; j++) { let last = null; for (let i = 0; i <= NX; i++) { const q = LK(i, j); if (FIX[q]) last = LAT[q]; else if (last != null) LAT[q] = last; }
          last = null; for (let i = NX; i >= 0; i--) { const q = LK(i, j); if (FIX[q]) last = LAT[q]; else if (last != null && !LAT[q]) LAT[q] = last; } }
      const free = []; for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) if (!FIX[LK(i, j)]) free.push([i, j]);
      for (let it = 0; it < 1500; it++) for (const [i, j] of free) { let s = 0, m = 0;
          if (i > 0) { s += LAT[LK(i - 1, j)]; m++; } if (i < NX) { s += LAT[LK(i + 1, j)]; m++; } if (j > 0) { s += LAT[LK(i, j - 1)]; m++; } if (j < NZ) { s += LAT[LK(i, j + 1)]; m++; }
          const q = LK(i, j); LAT[q] += 1.85 * (s / m - LAT[q]); }
      count.newPoints = free.length; }
    const setFromLattice = (i, j) => { const k = K(i, j); H[k * 4] = LAT[LK(i, j)]; H[k * 4 + 1] = LAT[LK(i + 1, j)]; H[k * 4 + 2] = LAT[LK(i, j + 1)]; H[k * 4 + 3] = LAT[LK(i + 1, j + 1)]; };
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) if (KIND[K(i, j)] === 3) setFromLattice(i, j);
    const kindAt = (i, j) => (i < 0 || j < 0 || i >= NX || j >= NZ) ? 0 : KIND[K(i, j)];

    /* ══ 2. THE NEW GROUND'S PLAN: one letter a square. R carriageway · P pavement · G grass · H the highway on its fill · S a slip ramp · D dirt · U under a bridge ══ */
    const TY = new Uint8Array(NX * NZ), ch = c => c.charCodeAt(0), at = (i, j) => (i < 0 || j < 0 || i >= NX || j >= NZ) ? '' : String.fromCharCode(TY[K(i, j)] || 32);
    const put = (i, j, c) => { if (kindAt(i, j) === 3) TY[K(i, j)] = ch(c); };
    const rect = (i0, j0, i1, j1, c, only) => { for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (!only || only.indexOf(at(i, j)) >= 0) put(i, j, c); };
    const streets = [], lamps = [], trees = [], extra = [], props = [], marks = [], signals = [];
    rect(0, 36, 191, NZ - 1, 'G');
    const HW = 60, BL = 132, NA = 84, SA = 144, SR = 204;
    /* THE AVENUES (north and south): pavement, a carriageway of four squares, a planted middle of two, a carriageway, pavement */
    const AV_W = 8, AV_E = 187;
    for (const a of [NA, SA]) { rect(AV_W, a, 191, a, 'P'); rect(AV_W, a + 11, 191, a + 11, 'P'); rect(AV_W, a + 1, AV_E, a + 4, 'R'); rect(AV_W, a + 7, AV_E, a + 10, 'R'); rect(AV_E + 1, a + 1, 191, a + 10, 'P'); }
    /* BLUFF DRIVE: pavement, the road, the promenade on the edge, the planted bank, the low walk beside the east districts */
    rect(BL, 36, BL, 207, 'P'); rect(BL + 1, 36, BL + 4, 209, 'R'); rect(BL + 5, 36, BL + 5, 209, 'P'); rect(BL + 11, 36, BL + 11, 203, 'P');
    for (const a of [NA, SA]) { rect(BL, a + 1, BL + 11, a + 4, 'R'); rect(BL, a + 7, BL + 11, a + 10, 'R'); rect(BL + 5, a, BL + 11, a, 'P'); rect(BL + 5, a + 11, BL + 11, a + 11, 'P'); rect(BL + 1, a, BL + 4, a + 11, 'R'); }
    /* THE HIGHWAY's strip: pavement, a frontage road, a verge, the highway (ten squares), a verge, a frontage road, pavement */
    rect(HW, 36, HW, NZ - 1, 'P'); rect(HW + 23, 36, HW + 23, NZ - 1, 'P');
    rect(HW + 1, 50, HW + 4, 209, 'R'); rect(HW + 19, 50, HW + 22, 209, 'R');
    rect(HW + 7, 56, HW + 16, NZ - 1, 'H');
    /* the park at the highway's north end (the road stops at Civic Street) */
    rect(HW + 1, 36, HW + 22, 49, 'G'); rect(HW + 11, 36, HW + 12, 51, 'P'); rect(HW + 1, 44, HW + 22, 44, 'P');
    for (const a of [NA, SA]) { rect(HW, a + 1, HW + 23, a + 4, 'R'); rect(HW, a + 7, HW + 23, a + 10, 'R'); rect(HW + 5, a + 5, HW + 18, a + 6, 'G'); rect(HW + 5, a, HW + 18, a, 'P'); rect(HW + 5, a + 11, HW + 18, a + 11, 'P');
        rect(HW + 1, a, HW + 4, a + 11, 'R'); rect(HW + 19, a, HW + 22, a + 11, 'R'); }
    /* the U-turn lanes under the bridges: north of the north avenue (the old Permit lane's own two squares), south of it, and both sides of the south avenue */
    const UT = [[NA - 2, NA - 1], [NA + 12, NA + 13], [SA - 2, SA - 1], [SA + 12, SA + 13]];
    UT.forEach(([a, b]) => rect(HW + 5, a, HW + 18, b, 'R'));
    /* THE OPENINGS: the rows where the highway is a bridge and the ground under it is the street's */
    const OPEN = [[NA - 2, NA + 13], [135, SA + 13]];
    OPEN.forEach(([a, b]) => rect(HW + 7, a, HW + 16, b, 'U'));
    /* DESERT VIEW DRIVE (the south row) and THE WOODLAND PARKWAY (the west column): one two-lane road, winding */
    const PK = [[6, 19], [6, 46], [4, 58], [4, 72], [7, 82], [7, 98], [5, 112], [5, 128], [8, 142], [8, 158], [4, 172], [4, 192], [7, 203], [11, 208], [BL + 1, 208]];
    const segDist = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz, t = l2 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2)) : 0; return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t); };
    const polyDist = (px, pz, pts) => { let d = 1e9; for (let q = 0; q + 1 < pts.length; q++) d = Math.min(d, segDist(px, pz, pts[q], pts[q + 1])); return d; };
    for (let j = 36; j < NZ; j++) for (let i = 0; i <= BL; i++) { const d = polyDist(i + 0.5, j + 0.5, PK); if (d < 1.05 && 'GP'.indexOf(at(i, j)) >= 0) put(i, j, 'R'); }
    rect(52, 204, 55, 206, 'R');                                           // the old way out to the desert (Southside's south street) runs on to Desert View Drive
    rect(11, 36, 11, 203, 'P', 'G');                                       // the greenway: a walk along the districts' west side
    rect(12, 204, BL - 1, 204, 'P', 'G');                                  // ... and along their south side
    rect(0, 106, 10, 106, 'D', 'G');                                       // the Valley Road's footpath out to the Woods (the dirt path, as before)
    /* the highway meets the ground at both ends: Civic Street (north) and the south street + Desert View Drive (at grade) */
    rect(HW + 7, 196, HW + 16, 199, 'R'); rect(HW + 5, 207, HW + 18, 208, 'R');

    /* ══ 3. THE ROWS: every row of the compact room set down in its new place ══ */
    const F = T.features, OUT = [];
    const along = (f, ax, v, tol) => Math.abs(f[ax + '0'] - v) < tol && Math.abs(f[ax + '1'] - v) < tol;
    const inHills = f => Math.max(f.z0, f.z1) <= -252 + 0.01, inBeach = f => Math.min(f.x0, f.x1) >= 252 - 0.01;
    const mapQuadLike = (f, dx, dz) => { for (const k of ['quad', 'pts']) if (Array.isArray(f[k])) f[k] = f[k].map(v => Array.isArray(v) ? [r3(v[0] + dx), r3(v[1] + dz)].concat(v.slice(2)) : v); };
    const moveBy = (f, mx, mz) => { const d = map(mx, mz), dx = d[0] - mx, dz = d[1] - mz;
        for (const k of ['x', 'x0', 'x1']) if (typeof f[k] === 'number') f[k] = r3(f[k] + dx); for (const k of ['z', 'z0', 'z1']) if (typeof f[k] === 'number') f[k] = r3(f[k] + dz); mapQuadLike(f, dx, dz); return f; };
    const archAnchor = f => { if (f.rot || !Array.isArray(f.parts) || !f.parts.length) return [f.x, f.z]; let sx = 0, sz = 0, n = 0; f.parts.forEach(p => { if (Array.isArray(p.p)) { sx += p.p[0]; sz += p.p[2]; n++; } }); return n ? [f.x + sx / n, f.z + sz / n] : [f.x, f.z]; };
    count.dropped = 0; count.split = 0; count.stretched = 0; let westTree = 0;
    F.forEach(f0 => { const f = JSON.parse(JSON.stringify(f0));
        if (typeof f.x0 === 'number' && typeof f.x1 === 'number' && typeof f.z0 === 'number' && typeof f.z1 === 'number') {
            const lin = f.k === 'wall' || f.k === 'rail';
            /* a fence, a wall or a ghost wall that ran ALONG a line that is now open ground (two districts' line, the old west and south edge) goes */
            if (lin && !inHills(f)) {
                if (!inBeach(f) && (CUTX.some(c => along(f, 'x', c, 0.9)) || CUTZ.some(c => along(f, 'z', c, 0.9)) || along(f, 'x', -252, 0.9))) { count.dropped++; return; }
                if (along(f, 'z', 252, 0.9)) { const a = Math.max(84, Math.min(f.x0, f.x1)), b = Math.min(252, Math.max(f.x0, f.x1)); if (b - a < 0.5) { count.dropped++; return; }   // (Industrial's south fence stays: the bay is behind it)
                    if (f.x0 < f.x1) { f.x0 = a; f.x1 = b; } else { f.x0 = b; f.x1 = a; } delete f.quad; }
            }
            const bx0 = band(f.x0, CUTX, f.x1 > f.x0 ? 1 : -1), bx1 = band(f.x1, CUTX, f.x0 > f.x1 ? 1 : -1), bz0 = band(f.z0, CUTZ, f.z1 > f.z0 ? 1 : -1), bz1 = band(f.z1, CUTZ, f.z0 > f.z1 ? 1 : -1);
            const crosses = bx0 !== bx1 || bz0 !== bz1;
            if (!crosses) { OUT.push(moveBy(f, (f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2)); return; }
            if ((inHills(f) && bz0 === bz1) || (inBeach(f) && bx0 === bx1) || f.k === 'stream') {   // nature: the row is as long as the stretched ground
                const a = map(f.x0, f.z0, f.x1 > f.x0 ? 1 : -1, f.z1 > f.z0 ? 1 : -1), b = map(f.x1, f.z1, f.x0 > f.x1 ? 1 : -1, f.z0 > f.z1 ? 1 : -1);
                f.x0 = a[0]; f.z0 = a[1]; f.x1 = b[0]; f.z1 = b[1]; delete f.quad; count.stretched++; OUT.push(f); return; }
            if (lin && (f.x0 === f.x1 || f.z0 === f.z1) && !f.quad) {   // a straight fence across a cut: one piece on each side
                const ax = f.x0 === f.x1 ? 'z' : 'x', cuts = ax === 'x' ? CUTX : CUTZ, lo = Math.min(f[ax + '0'], f[ax + '1']), hi = Math.max(f[ax + '0'], f[ax + '1']);
                const stops = [lo].concat(cuts.filter(c => c > lo + 1e-6 && c < hi - 1e-6), [hi]);
                for (let q = 0; q + 1 < stops.length; q++) { if (stops[q + 1] - stops[q] < 0.4) continue; const g = Object.assign({}, f); g[ax + '0'] = stops[q]; g[ax + '1'] = stops[q + 1];
                    if (g.id && q) g.id = g.id + ':s' + q; delete g.gaps; OUT.push(moveBy(g, (g.x0 + g.x1) / 2, (g.z0 + g.z1) / 2)); }
                count.split++; return; }
            OUT.push(moveBy(f, (f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2)); return;
        }
        if (typeof f.x !== 'number') { if (Array.isArray(f.pts)) f.pts = f.pts.map(v => { const m = map(v[0], v[1]); return [m[0], m[1]].concat(v.slice(2)); }); OUT.push(f); return; }
        if (f.k === 'tree' && Math.abs(f.x + 250.25) < 1 && f.z > -252) { if ((westTree++) % 3 !== 0) { count.dropped++; return; } }   // the old west tree line was a wall of trees: every third stays, as the greenway's own
        const a = f.k === 'arch' ? archAnchor(f) : [f.x, f.z];
        OUT.push(moveBy(f, a[0], a[1]));
    });
    const PR = (room.props || []).map(p => { const q = Object.assign({}, p), m = map(p.x, p.z); q.x = m[0]; q.z = m[1]; if (Array.isArray(q.rect)) warn('a prop with a rect: ' + q.key); return q; });

    /* ══ 4. THE STREETS: the compact city's own run on straight across the new ground ══ */
    const mapLine = pts => { const out = [], cross = [];
        for (let q = 0; q + 1 < pts.length; q++) { const a = pts[q], b = pts[q + 1], ts = [0, 1];
            CUTX.forEach(c => { if ((a[0] - c) * (b[0] - c) < -1e-9) ts.push((c - a[0]) / (b[0] - a[0])); }); CUTZ.forEach(c => { if ((a[1] - c) * (b[1] - c) < -1e-9) ts.push((c - a[1]) / (b[1] - a[1])); });
            ts.sort((u, v) => u - v);
            for (let s = 0; s + 1 < ts.length; s++) { const p0 = [a[0] + (b[0] - a[0]) * ts[s], a[1] + (b[1] - a[1]) * ts[s]], p1 = [a[0] + (b[0] - a[0]) * ts[s + 1], a[1] + (b[1] - a[1]) * ts[s + 1]];
                const sx = Math.sign(p1[0] - p0[0]) || 1, sz = Math.sign(p1[1] - p0[1]) || 1, m0 = map(p0[0], p0[1], sx, sz), m1 = map(p1[0], p1[1], -sx, -sz);
                if (out.length) { const l = out[out.length - 1]; if (Math.abs(l[0] - m0[0]) > 0.01 || Math.abs(l[1] - m0[1]) > 0.01) { cross.push([l, m0]); out.push(m0); } } else out.push(m0);
                out.push(m1); } }
        return { pts: out.filter((p, q) => !q || Math.abs(p[0] - out[q - 1][0]) > 0.01 || Math.abs(p[1] - out[q - 1][1]) > 0.01), cross }; };
    const cellOfX = x => Math.floor((x - X0) / C + 1e-6), cellOfZ = z => Math.floor((z - Z0) / C + 1e-6);
    const carve = (a, b, w) => {   // a compact street's run across new ground: its carriageway, a pavement square either side
        const hw = w / 2, i0 = cellOfX(Math.min(a[0], b[0]) - (a[1] === b[1] ? 0 : hw) + 0.01), i1 = cellOfX(Math.max(a[0], b[0]) + (a[1] === b[1] ? 0 : hw) - 0.01), j0 = cellOfZ(Math.min(a[1], b[1]) - (a[0] === b[0] ? 0 : hw) + 0.01), j1 = cellOfZ(Math.max(a[1], b[1]) + (a[0] === b[0] ? 0 : hw) - 0.01);
        if (a[1] === b[1]) { rect(i0, j0 - 1, i1, j0 - 1, 'P', 'G'); rect(i0, j1 + 1, i1, j1 + 1, 'P', 'G'); } else if (a[0] === b[0]) { rect(i0 - 1, j0, i0 - 1, j1, 'P', 'G'); rect(i1 + 1, j0, i1 + 1, j1, 'P', 'G'); }
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = at(i, j); if (c === 'H') put(i, j, 'U'); else if (c && c !== 'U') put(i, j, 'R'); } };
    (T.gen.streets || []).forEach(st => { const m = mapLine(st.pts); streets.push(Object.assign({}, st, { pts: m.pts })); m.cross.forEach(cr => carve(cr[0], cr[1], st.w || 14)); });
    /* the south street's and Civic Street's crossing of the highway are at grade (the highway has come down); every other crossing is under a bridge */
    const BR = [];   // the bridges: [j0, j1] rows of U under the highway, merged
    { let run = null; for (let j = 36; j < NZ; j++) { const u = at(HW + 12, j) === 'U'; if (u && !run) run = [j, j]; else if (u) run[1] = j; else if (run) { BR.push(run); run = null; } } if (run) BR.push(run); }
    /* a crossing at grade is carriageway, not bridge (north of the first ramp, south of the last) */
    const RAMP_N = [56, 76], RAMP_S = [162, 192];
    for (let j = 36; j < NZ; j++) if (j < RAMP_N[1] || j > RAMP_S[0]) for (let i = HW + 7; i <= HW + 16; i++) if (at(i, j) === 'U') put(i, j, j < RAMP_N[0] || j >= RAMP_S[1] ? 'R' : 'H');
    const BRIDGES = BR.filter(b => b[0] >= RAMP_N[1] && b[1] <= RAMP_S[0]);
    count.bridges = BRIDGES.length;

    /* ══ 5. THE HIGHWAY'S HEIGHTS: a fill that follows the falling city, level over each opening, down to the ground at both ends ══ */
    const G0 = new Float32Array(NZ + 1); for (let j = 0; j <= NZ; j++) { let s = 0, n = 0; for (let q = -4; q <= 4; q++) { const jj = Math.max(36, Math.min(NZ, j + q)); s += LAT[LK(HW + 12, jj)]; n++; } G0[j] = s / n; }
    const RISE = 6.0, TOP = new Float32Array(NZ + 1), ctl = [];
    ctl.push([RAMP_N[0], G0[RAMP_N[0]]]);
    BRIDGES.forEach(b => { let m = -1e9; for (let j = b[0] - 2; j <= b[1] + 3; j++) for (let i = HW + 6; i <= HW + 18; i++) m = Math.max(m, LAT[LK(i, Math.min(NZ, j))]); b.y = r3(m + RISE); ctl.push([b[0] - 4, b.y]); ctl.push([b[1] + 5, b.y]); });
    ctl[1][0] = Math.min(ctl[1][0], RAMP_N[1]); ctl[ctl.length - 1][0] = Math.max(ctl[ctl.length - 1][0], RAMP_S[0]);
    ctl.push([RAMP_S[1], G0[RAMP_S[1]]]);
    for (let j = 0; j <= NZ; j++) { let v = null; if (j <= ctl[0][0] || j >= ctl[ctl.length - 1][0]) v = -1e9; else for (let q = 0; q + 1 < ctl.length; q++) if (j >= ctl[q][0] && j <= ctl[q + 1][0]) { const t = (j - ctl[q][0]) / Math.max(1, ctl[q + 1][0] - ctl[q][0]); v = ctl[q][1] + (ctl[q + 1][1] - ctl[q][1]) * t; }
        TOP[j] = v; }
    const topAt = (i, j) => Math.max(TOP[j], LAT[LK(i, j)]);               // a lattice point of the fill
    for (let j = 36; j < NZ; j++) for (let i = HW + 7; i <= HW + 16; i++) if (at(i, j) === 'H') { const k = K(i, j); H[k * 4] = topAt(i, j); H[k * 4 + 1] = topAt(i + 1, j); H[k * 4 + 2] = topAt(i, j + 1); H[k * 4 + 3] = topAt(i + 1, j + 1); }
    /* THE SLIP RAMPS (two squares wide, on the verge beside the fill): from the ground beside a bridge up to the highway, fourteen squares long.
       At the north avenue: on and off to the south. At the south bridges: on and off to the north. */
    const SLIPS = [];
    if (BRIDGES.length >= 2) { const A = BRIDGES[0], B = BRIDGES[BRIDGES.length - 1];
        SLIPS.push({ side: -1, foot: A[1] + 1, top: A[1] + 19, name: 'on, south' }, { side: 1, foot: A[1] + 1, top: A[1] + 19, name: 'off, north' },
                   { side: -1, foot: B[0], top: B[0] - 18, name: 'off, south' }, { side: 1, foot: B[0], top: B[0] - 18, name: 'on, north' }); }
    /* the ground under the bridges: carriageway, the avenues' pavements and their middle (paved under a bridge, nothing grows there) */
    const SLAB = T.paint.pal.indexOf('urban:ConcreteSlab2a') + 1;
    const underSheet = j => (j === NA || j === NA + 11 || j === SA || j === SA + 11 || j === 135 || j === 140 || j === 141) ? WALK : (j === NA + 5 || j === NA + 6 || j === SA + 5 || j === SA + 6) ? SLAB : 0;

    /* BLUFF DRIVE's ground. The west districts stand 2 to 12 m over the east ones here. The road and its promenade keep the west side's height; under the
       promenade a retaining wall, then a planted bank falls (never more than 4.5 m) to the low walk beside the east districts. Where a street crosses,
       the whole strip is one even slope from the west height to the east one, and the drive dips into the crossing over six squares either side. */
    { const J0 = 36, J1 = 203, W = [], E = [], Ws = [], Es = [], sAt = [];
      for (let j = J0; j <= J1 + 1; j++) { W[j] = LAT[LK(BL, j)]; E[j] = LAT[LK(BL + 12, j)]; }
      for (let j = J0; j <= J1 + 1; j++) { let a = 0, b = 0, n = 0; for (let q = -4; q <= 4; q++) { const jj = Math.max(J0, Math.min(J1 + 1, j + q)); a += W[jj]; b += E[jj]; n++; } Ws[j] = a / n; Es[j] = b / n; if (Es[j] > Ws[j]) Es[j] = Ws[j] = (Es[j] + Ws[j]) / 2; }
      const crossRow = j => j < J0 || j > J1 ? false : at(BL + 8, j) !== 'G';
      for (let j = J0; j <= J1 + 1; j++) { let d = j === J0 ? 0 : 99; for (let q = -7; q <= 7; q++) if (crossRow(j + q) || crossRow(j + q - 1)) d = Math.min(d, Math.abs(q)); sAt[j] = Math.max(0, Math.min(1, 1 - (d - 0.5) / 6)); if (d === 0) sAt[j] = 1; }
      /* the height at lattice column u (0..12) of lattice row j; `side` -1 / 1 = just west / east of the wall's line (u 6) */
      const hB = (u, j, side) => { if (u <= 0) return W[j]; if (u >= 12) return E[j]; const D = Ws[j] - Es[j], s = sAt[j];
          const cross = Ws[j] - D * Math.max(0, Math.min(1, (u - 1) / 10));
          const bank = Math.min(D, 4.5), wall = D - bank, terr = (u < 6 || (u === 6 && side < 0)) ? Ws[j] : (u >= 11 ? Es[j] : Ws[j] - wall - bank * (u - 6) / 5);
          return terr + (cross - terr) * s; };
      for (let j = J0; j <= J1; j++) for (let u = 0; u < 12; u++) { const k = K(BL + u, j); if (KIND[k] !== 3) continue;
          H[k * 4] = hB(u, j, 1); H[k * 4 + 1] = hB(u + 1, j, -1); H[k * 4 + 2] = hB(u, j + 1, 1); H[k * 4 + 3] = hB(u + 1, j + 1, -1); }
      /* the promenade's rail over the wall, the bank's trees, benches looking out to sea */
      let run = null; const flush = () => { if (run && run[1] - run[0] >= 1) extra.push({ k: 'rail', x0: r3(lx(BL + 6) - 0.3), z0: lz(run[0]), x1: r3(lx(BL + 6) - 0.3), z1: lz(run[1] + 1), model: 'balusters_b' }); run = null; };
      for (let j = J0; j <= J1; j++) { const drop = Math.min(hB(6, j, -1) - hB(6, j, 1), hB(6, j + 1, -1) - hB(6, j + 1, 1)); if (drop > 0.55 && at(BL + 5, j) === 'P') { if (!run) run = [j, j]; else run[1] = j; } else flush(); } flush();
    }
    /* the south row near the bay: the land keeps its head over the water as far as the drive's end */
    for (let j = SR; j < NZ; j++) for (let i = BL; i <= BL + 8; i++) { const k = K(i, j); for (let q = 0; q < 4; q++) if (H[k * 4 + q] < 0.9) H[k * 4 + q] = 0.9; }
    for (let j = SR; j < NZ; j++) for (let i = BL + 9; i <= BL + 11; i++) { const k = K(i, j), a = Math.max(-0.6, 0.9 - (i - BL - 9) * 0.5), b = Math.max(-0.6, 0.9 - (i - BL - 8) * 0.5); H[k * 4] = H[k * 4 + 2] = a; H[k * 4 + 1] = H[k * 4 + 3] = b; TY[k] = ch('B'); }

    /* THE WAYS UP INTO THE HILLS (the Hills' own squares, stretched ground): the parkway climbs a cutting to the Hills' west road, Bluff Drive runs up to
       the road along the Hills' foot. A road square there: asphalt, a box out of the Hills' ground zone, heights in one even ramp between its two ends. */
    const outHills = [];
    const hillRoad = (i0, i1, jTop, jBot) => { for (let i = i0; i <= i1; i++) for (let j = jTop; j < jBot; j++) { const k = K(i, j);
            const top = c => H[K(i, jTop - 1) * 4 + 2 + c], bot = c => (kindAt(i, jBot) === 3 ? LAT[LK(i + c, jBot)] : H[K(i, jBot) * 4 + c]), y = (c, jl) => top(c) + (bot(c) - top(c)) * (jl - jTop) / (jBot - jTop);
            H[k * 4] = y(0, j); H[k * 4 + 1] = y(1, j); H[k * 4 + 2] = y(0, j + 1); H[k * 4 + 3] = y(1, j + 1); P[k] = 0; FL[k] = 0; TY[k] = ch('R'); }
        outHills.push([lx(i0), lz(jTop), lx(i1 + 1), lz(jBot)]); };
    hillRoad(5, 6, 19, 36); hillRoad(BL + 1, BL + 4, 34, 36);
    /* the parkway's first squares in the city keep the cutting's fall (the lattice there is the Hills' foot wall, 11 m in one square) */

    /* ══ 6. the sheets of the new ground ══ */
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const k = K(i, j); if (KIND[k] !== 3) continue; const c = at(i, j);
        P[k] = c === 'P' ? WALK : c === 'G' ? GRASS : c === 'D' ? DIRT : c === 'B' ? SAND : c === 'U' ? underSheet(j) : 0; FL[k] = 0; }
    /* Desert View Drive looks out on the desert: south of the road the grass thins to dirt and sand */
    const hash = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + (c || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    for (let j = 210; j < NZ; j++) for (let i = 0; i < BL; i++) { const k = K(i, j); if (at(i, j) !== 'G') continue; const v = (j - 210) + Math.sin(i * 0.37) * 0.9 + Math.sin(i * 0.11 + 2) * 0.8 + hash(Math.floor(i / 3), j, 3) * 0.6; P[k] = v > 3.6 ? SAND : v > 1.5 ? DIRT : GRASS; }

    /* ══ 7. THE HIGHWAY's body: the bridges, the barriers, the paint, the lamps ══ */
    const CONC = 'urban:ConcretePanels1a', CT = 0xcfcbc2, CD = 0x9c988f, ASPH = 'urban:RoadGeneric1a', WHITE = 0xf0f0f0, YEL = 0xe8b830, BH = 0.9, TH = 1.5;
    const HX0 = lx(HW + 7), HX1 = lx(HW + 17), HC = (HX0 + HX1) / 2, HWID = HX1 - HX0;
    const feat = f => { extra.push(f); return f; };
    const jersey = (Pp, rx, rz, x, za, zb, ya, yb) => { const up = yb >= ya, lo = up ? za : zb, hi = up ? zb : za, L = Math.abs(zb - za), rise = Math.abs(yb - ya), ry = hi > lo ? 0 : 180, sh = rise > 0.001 ? { shear: [r3(rise), r3(L)] } : null;
        Pp.push(Object.assign({ s: 'box', p: [r3(x - rx), r3(Math.min(ya, yb)), r3((za + zb) / 2 - rz)], ry, size: [0.6, 0.5, r3(L)], key: CONC, tint: CT, uv: 3.5 }, sh),
                Object.assign({ s: 'box', p: [r3(x - rx), r3(Math.min(ya, yb) + 0.5), r3((za + zb) / 2 - rz)], ry, size: [0.32, BH - 0.5, r3(L)], key: CONC, tint: CT, uv: 3.5 }, sh)); };
    const paintLine = (Pp, rx, rz, x, za, zb, ya, yb, w, color, dash) => { const up = yb >= ya, lo = up ? za : zb, hi = up ? zb : za, L = Math.abs(zb - za), rise = Math.abs(yb - ya), dir = hi > lo ? 1 : -1, ry = dir > 0 ? 0 : 180, y0 = Math.min(ya, yb) + 0.035;
        if (!dash) { Pp.push(Object.assign({ s: 'quad', flat: true, p: [r3(x - rx), r3(y0), r3((za + zb) / 2 - rz)], ry, size: [w, r3(L)], tint: color }, rise > 0.001 ? { shear: [r3(rise), r3(L)] } : null)); return; }
        const per = dash[0] + dash[1], n = Math.floor((L - dash[0]) / per) + 1, k = rise / L; if (n < 1) return;
        Pp.push(Object.assign({ s: 'quad', flat: true, p: [r3(x - rx), r3(y0), r3(lo + dir * dash[0] / 2 - rz)], ry, size: [w, dash[0]], tint: color, n, step: [0, r3(k * per), r3(dir * per)] }, rise > 0.001 ? { shear: [r3(k * dash[0]), dash[0]] } : null)); };
    const ghost = (x, j, ya, yb, hung) => feat(Object.assign({ k: 'wall', ghost: true, x0: r3(x), z0: lz(j), x1: r3(x), z1: lz(j + 1), t: 0.6, h: BH, absY: true },
        hung ? { y0: r3(ya), y: r3(ya + BH) } : Object.assign({ y: r3(Math.max(ya, yb) + BH) }, Math.abs(ya - yb) > 0.01 ? { rail: [r3(ya + BH), r3(yb + BH)] } : null)));
    const isBridgeRow = j => BRIDGES.some(b => j >= b[0] && j <= b[1]);
    const J_N = RAMP_N[0], J_S = RAMP_S[1];                                   // the highway stands over the ground between these lattice rows
    const hwY = jl => jl <= J_N ? G0[J_N] : jl >= J_S ? G0[J_S] : TOP[jl];                          // the road's own line (the fill's top) at a lattice row
    const sideGround = (sd, jl) => LAT[LK(sd < 0 ? HW + 6 : HW + 18, jl)];
    const slipAt = (sd, j) => SLIPS.find(s => s.side === sd && j >= Math.min(s.foot, s.top) && j < Math.max(s.foot, s.top));
    const slipH = (s, i, jl) => { const d = Math.sign(s.top - s.foot), n = Math.abs(s.top - s.foot), t = Math.max(0, Math.min(1, ((jl - s.foot) * d - 1) / (n - 3))), g = LAT[LK(i, jl)]; return g + (Math.max(TOP[jl], g) - g) * t; };
    /* the slip ramps' ground again, by the same rule the barriers read (their last two squares are level with the highway: the merge) */
    SLIPS.forEach(s => { const i0 = s.side < 0 ? HW + 5 : HW + 17, lo = Math.min(s.foot, s.top), hi = Math.max(s.foot, s.top);
        for (let j = lo; j < hi; j++) for (let i = i0; i <= i0 + 1; i++) { const k = K(i, j); TY[k] = ch('S'); P[k] = 0; H[k * 4] = slipH(s, i, j); H[k * 4 + 1] = slipH(s, i + 1, j); H[k * 4 + 2] = slipH(s, i, j + 1); H[k * 4 + 3] = slipH(s, i + 1, j + 1); } });
    /* the rows of one slope (between two bends of the road's line): one long barrier, one long paint line each */
    const bends = [...new Set(ctl.map(c => c[0]).concat(BRIDGES.reduce((a, b) => a.concat([b[0], b[1] + 1]), [])))].sort((a, b) => a - b);
    const spans = []; for (let q = 0; q + 1 < bends.length; q++) spans.push([bends[q], bends[q + 1]]);
    spans.forEach(([ja, jb], si) => { const Pp = [], rx = HC, rz = (lz(ja) + lz(jb)) / 2, ya = hwY(ja), yb = hwY(jb), yAt = jl => ya + (yb - ya) * (jl - ja) / (jb - ja), bridge = isBridgeRow(ja);
        /* the edge barriers: where the road stands half a metre or more over the ground beside it, and no slip ramp is joining */
        for (const sd of [-1, 1]) { const x = sd < 0 ? HX0 + 0.4 : HX1 - 0.4; let run = null;
            const close = j => { if (run != null) { jersey(Pp, rx, rz, x, lz(run), lz(j), yAt(run), yAt(j)); run = null; } };
            for (let j = ja; j < jb; j++) { const s = slipAt(sd, j), i0 = sd < 0 ? HW + 6 : HW + 17, beside = s ? Math.min(slipH(s, i0, j), slipH(s, i0, j + 1)) : Math.min(sideGround(sd, j), sideGround(sd, j + 1));
                const need = bridge || (Math.max(yAt(j), yAt(j + 1)) - beside > 0.5);
                if (need) { if (run == null) run = j; ghost(x, j, yAt(j), yAt(j + 1), bridge); } else close(j); }
            close(jb); }
        /* the middle barrier and the paint */
        const c0 = Math.max(ja, J_N + 3), c1 = Math.min(jb, J_S - 3);
        if (c1 > c0) { jersey(Pp, rx, rz, HC, lz(c0), lz(c1), yAt(c0), yAt(c1)); for (let j = c0; j < c1; j++) ghost(HC, j, yAt(j), yAt(j + 1), bridge); }
        for (const sd of [-1, 1]) { paintLine(Pp, rx, rz, HC + sd * 0.75, lz(ja), lz(jb), ya, yb, 0.16, YEL); paintLine(Pp, rx, rz, HC + sd * 7, lz(ja), lz(jb), ya, yb, 0.14, WHITE, [3.5, 7]); paintLine(Pp, rx, rz, HC + sd * 13.6, lz(ja), lz(jb), ya, yb, 0.16, WHITE); }
        if (bridge) { const L = lz(jb) - lz(ja), y = ya;
            feat({ k: 'bridge', id: 'dc:hw:deck' + si, x0: HC, z0: lz(ja), x1: HC, z1: lz(jb), w: HWID, y: r3(y), thick: TH, rails: false, hide: true, absY: true });
            Pp.push({ s: 'box', p: [0, r3(y - 0.5), 0], size: [r3(HWID + 0.8), 0.5, r3(L)], key: CONC, tint: CT, keyTop: ASPH, tintTop: 0xdcdce0, under: true, uv: 3.5 });
            [-14, -7, 0, 7, 14].forEach(o => Pp.push({ s: 'box', p: [o, r3(y - TH), 0], size: [1.0, TH - 0.5, r3(L)], key: CONC, tint: CD, top: false, under: true, uv: 3.5 }));
            /* the pillars: a cap beam on four round columns, on the pavements and the avenue's middle, never on a carriageway */
            const lines = []; for (let j = ja; j < jb; j++) { const u = underSheet(j); if (u === WALK && (underSheet(j - 1) !== WALK)) lines.push(j + (underSheet(j + 1) === WALK ? 1 : 0.5)); else if (u === SLAB && underSheet(j - 1) !== SLAB) lines.push(j + 1); }
            lines.filter(v => v - ja >= 2 && jb - v >= 2).forEach(v => { const z = Z0 + v * C, jl = Math.floor(v), cols = [HW + 8, HW + 10, HW + 13, HW + 15].map(cx);
                Pp.push({ s: 'box', p: [0, r3(y - TH - 1.1), r3(z - rz)], size: [r3(HWID - 2), 1.1, 1.8], key: CONC, tint: CT, under: true, uv: 3.5 });
                cols.forEach(x => { const g = Math.min(LAT[LK(Math.round((x - X0) / C), jl)], LAT[LK(Math.round((x - X0) / C), jl + 1)]) - 0.3;
                    Pp.push({ s: 'cyl', p: [r3(x - rx), r3(g), r3(z - rz)], r: 0.8, h: r3(y - TH - 1.1 - g), seg: 14, key: CONC, tint: CT, cap: false, uv: 3.5 });
                    feat({ k: 'wall', ghost: true, x0: r3(x - 0.8), z0: r3(z), x1: r3(x + 0.8), z1: r3(z), t: 1.6, h: 4, rail: false }); }); }); }
        feat({ k: 'arch', id: 'dc:hw:body' + si, x: r3(rx), z: r3(rz), rot: 0, y: 0, parts: Pp });
        /* the lamps: on the edge barriers, every seven squares, side by side in turn */
        for (let j = ja; j < jb; j++) if (j % 7 === 3 && j > J_N + 4 && j < J_S - 4) { const sd = (Math.floor(j / 7) % 2) ? 1 : -1; lamps.push({ x: r3(sd < 0 ? HX0 + 0.4 : HX1 - 0.4), z: cz(j), y: r3(yAt(j + 0.5) + BH), nx: sd, nz: 0, d: 'H' }); } });
    /* the slip ramps' outer barriers (the side away from the highway) */
    SLIPS.forEach((s, q) => { const Pp = [], sd = s.side, x = sd < 0 ? lx(HW + 5) + 0.35 : lx(HW + 19) - 0.35, ig = sd < 0 ? HW + 5 : HW + 19, io = sd < 0 ? HW + 4 : HW + 19, lo = Math.min(s.foot, s.top), hi = Math.max(s.foot, s.top), rz = (lz(lo) + lz(hi)) / 2;
        for (let j = lo; j < hi; j++) { const a = slipH(s, ig, j), b = slipH(s, ig, j + 1), g = Math.min(LAT[LK(io, j)], LAT[LK(io, j + 1)]); if (Math.max(a, b) - g < 0.5) continue; jersey(Pp, x, rz, x, lz(j), lz(j + 1), a, b); ghost(x, j, a, b, false); }
        if (Pp.length) feat({ k: 'arch', id: 'dc:hw:slip' + q, x: r3(x), z: r3(rz), rot: 0, y: 0, parts: Pp }); });
    /* the highway at grade (its two ends): two carriageways the city's own way, lines and kerbs by the engine */
    for (const sd of [-1, 1]) streets.push({ pts: [[HC + sd * 8.75, lz(J_S)], [HC + sd * 8.75, lz(NZ)]], w: 17.5 });

    /* ══ 8. THE NEW STREETS (the engine paints their lines, kerbs and manholes) ══ */
    const st = (pts, w) => streets.push({ pts: pts.map(p => [r3(p[0]), r3(p[1])]), w });
    for (const a of [NA, SA]) { st([[lx(AV_W), lz(a + 3)], [lx(AV_E + 1), lz(a + 3)]], 14); st([[lx(AV_W), lz(a + 9)], [lx(AV_E + 1), lz(a + 9)]], 14); }
    st([[lx(BL + 3), lz(34)], [lx(BL + 3), lz(210)]], 14);
    st([[lx(HW + 3), lz(50)], [lx(HW + 3), lz(210)]], 14); st([[lx(HW + 21), lz(50)], [lx(HW + 21), lz(210)]], 14);
    UT.forEach(([a, b]) => st([[lx(HW + 5), lz(a + 1)], [lx(HW + 19), lz(a + 1)]], 7));
    st(PK.map(p => [lx(p[0]), lz(p[1])]), 7);
    st([[lx(54), lz(204)], [lx(54), lz(207)]], 14);
    /* the Hills' west road runs on to the room's west line */
    streets.forEach(s => s.pts.forEach(p => { if (Math.abs(p[0] - (-252 + DX[0])) < 0.01 && p[1] < lz(36)) p[0] = X0; }));

    /* ══ 9. what stands on the new ground: lamps, trees, benches ══ */
    const tree = (x, z, kind, h) => trees.push({ k: 'tree', x: r3(x), z: r3(z), kind, h: r3(h) });
    const KINDS_CITY = ['tree_2', 'tree_3', 'tree_4', 'tree'], KINDS_WOOD = ['tree_52', 'pine', 'tree_3', 'tree_4', 'tree_52', 'tree_2'];
    for (const a of [NA, SA]) {
        for (let i = AV_W; i <= AV_E; i++) { if (at(i, a + 5) === 'G' && at(i, a + 6) === 'G' && i % 3 === 0 && at(i - 1, a + 5) === 'G' && at(i + 1, a + 5) === 'G') tree(cx(i), cz(a + 5 + (i / 3) % 2), KINDS_CITY[(i / 3) % 4], 6 + hash(i, a) * 2.5);
            if (i % 6 === 2 && at(i, a) === 'P' && at(i, a + 1) === 'R') lamps.push({ x: cx(i), z: r3(lz(a + 1) - 0.35), nx: 0, nz: -1, d: 'H' });
            if (i % 6 === 5 && at(i, a + 11) === 'P' && at(i, a + 10) === 'R') lamps.push({ x: cx(i), z: r3(lz(a + 11) + 0.35), nx: 0, nz: 1, d: 'H' }); } }
    for (let j = 37; j < 204; j++) {
        if (j % 6 === 1 && at(BL + 5, j) === 'P' && at(BL + 4, j) === 'R') lamps.push({ x: r3(lx(BL + 5) + 0.35), z: cz(j), nx: 1, nz: 0, d: 'H' });
        if (j % 6 === 4 && at(BL, j) === 'P' && at(BL + 1, j) === 'R') lamps.push({ x: r3(lx(BL + 1) - 0.35), z: cz(j), nx: -1, nz: 0, d: 'H' });
        if (j % 6 === 2 && at(HW, j) === 'P' && at(HW + 1, j) === 'R') lamps.push({ x: r3(lx(HW + 1) - 0.35), z: cz(j), nx: -1, nz: 0, d: 'H' });
        if (j % 6 === 5 && at(HW + 23, j) === 'P' && at(HW + 22, j) === 'R') lamps.push({ x: r3(lx(HW + 23) + 0.35), z: cz(j), nx: 1, nz: 0, d: 'H' });
        if (j % 9 === 4 && at(BL + 5, j) === 'P' && at(BL + 7, j) === 'G') props.push({ key: 'city_bench', x: r3(cx(BL + 5) + 0.6), z: cz(j), face: 90 });
        for (let u = 6; u <= 10; u++) if (at(BL + u, j) === 'G' && hash(BL + u, j, 7) < 0.2) tree(cx(BL + u), cz(j), KINDS_CITY[Math.floor(hash(u, j, 9) * 4)], 5 + hash(u, j, 11) * 3);
        for (const i of [HW + 5, HW + 6, HW + 17, HW + 18]) if (at(i, j) === 'G' && j > 58 && hash(i, j, 5) < 0.1) props.push({ key: 'leafy_bush', x: cx(i), z: cz(j), face: Math.floor(hash(i, j, 6) * 4) * 90 }); }
    /* the park at the highway's north end */
    for (let j = 36; j < 50; j++) for (let i = HW + 1; i <= HW + 22; i++) if (at(i, j) === 'G' && hash(i, j, 13) < 0.13) tree(cx(i), cz(j), KINDS_CITY[Math.floor(hash(i, j, 14) * 4)], 6 + hash(i, j, 15) * 3);
    [HW + 4, HW + 8, HW + 15, HW + 19].forEach((i, q) => props.push({ key: 'park_bench', x: cx(i), z: r3(cz(44) + (q % 2 ? 1 : -1) * 2.4), face: q % 2 ? 0 : 180 }));
    /* the parkway's wood: thick west of the road, a tree a square on the room's line, thin between the road and the greenway */
    const PKm = PK.map(p => [p[0], p[1]]);
    for (let j = 19; j < 204; j++) for (let i = 0; i <= 10; i++) { const k = K(i, j), c = at(i, j); if (j >= 36 ? c !== 'G' : (c === 'R')) continue; if (j < 36 && (i >= 4 && i <= 7)) continue;
        const d = polyDist(i + 0.5, j + 0.5, PKm), west = (i + 0.5) < PKm.reduce((b, p, q) => (q + 1 < PKm.length && j + 0.5 >= p[1] && j + 0.5 <= PKm[q + 1][1]) ? p[0] + (PKm[q + 1][0] - p[0]) * (j + 0.5 - p[1]) / (PKm[q + 1][1] - p[1]) : b, 6);
        if (d < 2.1 || Math.abs(j - 106) <= 1) continue;
        const pr = i === 0 ? 0.85 : west ? 0.34 : 0.1; if (hash(i, j, 21) < pr) tree(cx(i) + (hash(i, j, 22) - 0.5) * 1.2, cz(j) + (hash(i, j, 23) - 0.5) * 1.2, KINDS_WOOD[Math.floor(hash(i, j, 24) * KINDS_WOOD.length)], 6.5 + hash(i, j, 25) * 4); }
    /* lookouts on the parkway (a bench and a lamp where the road swings east) and along Desert View Drive */
    [[9, 90], [10, 150], [9, 199]].forEach(([i, j]) => { if (at(i, j) === 'G') { props.push({ key: 'park_bench', x: cx(i), z: cz(j), face: 270 }); lamps.push({ x: cx(i), z: r3(cz(j) + 2), nx: -1, nz: 0, d: 'U' }); } });
    for (let i = 14; i < BL; i++) { if (i % 12 === 6 && at(i, 209) !== 'R' && at(i, 208) === 'R') lamps.push({ x: cx(i), z: r3(lz(209) + 0.35), nx: 0, nz: 1, d: 'R' });
        if (i % 16 === 3 && at(i, 210) === 'G') props.push({ key: 'park_bench', x: cx(i), z: cz(210), face: 0 });
        for (let j = 210; j < NZ; j++) if (at(i, j) === 'G') { const v = hash(i, j, 31); if (v < 0.035) props.push({ key: 'psxg_dead_bush_2', x: cx(i), z: cz(j), face: 0 }); else if (v < 0.06) props.push({ key: hash(i, j, 32) < 0.5 ? 'psxg_rock_1' : 'psxg_rock_2', x: cx(i), z: cz(j), face: Math.floor(hash(i, j, 33) * 4) * 90 }); else if (v < 0.075 && j > 211) tree(cx(i), cz(j), 'tree_52', 5.5 + hash(i, j, 34) * 2); } }

    /* ══ 10. THE CARS ══ */
    const traffic = (T.traffic || []).map(t => { const o = Object.assign({}, t, { pts: mapLine(t.pts).pts }); if (Array.isArray(t.narrow)) o.narrow = t.narrow.map(n => { const a = map(n[0], n[1]), b = map(n[2], n[3]); return [a[0], a[1], b[0], b[1]]; }); return o; });
    const route = (pts, o) => traffic.push(Object.assign({ pts: pts.map(p => [r3(p[0]), r3(p[1])]), loop: true, n: 2, speed: 4.2, lane: 3.5, kinds: ['suv', 'taxi', 'cadillac'] }, o));
    for (const a of [NA, SA]) route([[lx(AV_W + 2), lz(a + 9)], [lx(AV_E - 1), lz(a + 9)], [lx(AV_E - 1), lz(a + 3)], [lx(AV_W + 2), lz(a + 3)], [lx(AV_W + 2), lz(a + 9)]], { n: 4, lane: 0.01, kinds: a === NA ? ['suv', 'taxi', 'cadillac', 'citybus'] : ['taxi', 'suv', 'truck', 'cadillac'] });
    route([[lx(BL + 3), lz(38)], [lx(BL + 3), lz(206)]], { n: 3, speed: 3.8 });
    /* the highway: down the west half, round at the south end, back up the east half */
    route([[HC - 8.75, lz(57)], [HC - 8.75, lz(213)], [HC + 8.75, lz(213)], [HC + 8.75, lz(57)], [HC - 8.75, lz(57)]], { n: 6, speed: 8, lane: 0.01, deck: true, kinds: ['suv', 'cadillac', 'truck', 'taxi', 'suv', 'copcar'] });
    /* the frontage roads, round by the U-turn lanes under the two bridges */
    { const xw = lx(HW + 3), xe = lx(HW + 21), zn = lz(NA - 1), zs = lz(SA + 13);
      route([[xw, zn], [xw, zs], [xe, zs], [xe, zn], [xw, zn]], { n: 4, kinds: ['taxi', 'suv', 'cadillac', 'copcar'], narrow: [[xw, zs, xe, zs], [xe, zn, xw, zn]] }); }
    /* the parkway and Desert View Drive, there and back */
    route(PK.map(p => [lx(p[0]), lz(p[1])]), { n: 3, speed: 3.6, lane: 1.75, kinds: ['suv', 'cadillac', 'suv'] });

    /* ══ 11. the room written again ══ */
    const mp = o => { const m = map(o.x, o.z); return Object.assign({}, o, { x: m[0], z: m[1] }); };
    const rectMap = q => { const a = map(q[0], q[1], 1, 1), b = map(q[2], q[3], -1, -1); return [a[0], a[1], b[0], b[1]].concat(q.slice(4)); };
    room.shell = { __shell: Object.assign({}, room.shell.__shell, { w: NX * C, d: NZ * C, plate: room.shell.__shell.plate ? mp(room.shell.__shell.plate) : undefined }) };
    room.dc144 = Object.assign({}, room.dc144, { spread: { x0: X0, z0: Z0, cutX: CUTX, cutZ: CUTZ, dx: DX, dz: DZ } });
    room.sub = 'NINE DISTRICTS · THE HIGHWAY · THE PARKWAY';
    room.doors = room.doors.map(d => { const o = mp(d);
        if (d.id === 'ow_v_0_m3') o.x = r3(X0 + 1.75);                                              // the Hills' west road leaves by the room's new west line
        if (d.id === 'ow_h_15_12') o.z = r3(-Z0 - 6.5);                                             // the Coast Road leaves by the new south line
        return o; });
    room.props = PR.concat(props);
    room.npcSpots = (room.npcSpots || []).map(mp); room.spawn = mp(room.spawn);
    if (Array.isArray(room.agents)) room.agents = room.agents.map(a => (a && typeof a.x === 'number') ? mp(a) : a);
    T.moored = (T.moored || []).map(mp);
    delete T.backdropInset;
    T.backdropOpen = [[391, -420, 440, 420], [282, -420, 440, -250], [lx(BL + 12) - 20, 376, 440, 420]];
    const E = T.edges, wayAt = v => r3(v + DX[2]);
    T.edges = Object.assign({}, E, { w: { kind: 'forest', cap: E.w.cap }, s: { kind: 'scrub', cap: { kind: 'coast', at: 'e', off: r3(-X0 - lx(BL + 12) - 30), len: 30 } },
        ways: (E.ways || []).map(w => Object.assign({}, w, { at: wayAt(w.at) })).concat([{ side: 's', at: r3(HC) }, { side: 'w', at: cz(106) }]),
        roads: (E.roads || []).map(w => Object.assign({}, w, { at: wayAt(w.at) })).concat([{ side: 's', at: r3(HC), w: 35, key: ASPH, line: 15251504 }, { side: 'w', at: cz(106), w: 3.5, key: 'dirt_2' }, { side: 'w', at: r3(lz(18)), w: 7, key: ASPH }]) });
    T.zones = (T.zones || []).map((z, zi) => { const o = Object.assign({}, z); const hills = z.z1 <= -252 + 0.01;
        if (hills) { o.x0 = X0; o.x1 = -X0; } else { const a = map(z.x0, z.z0, 1, 1); o.x0 = a[0]; o.z0 = a[1]; o.x1 = -X0; o.z1 = -Z0; }
        o.out = (z.out || []).map(q => { const m = rectMap(q); if (hills && Math.abs(q[0] + 252) < 0.01) m[0] = X0; return m; }).concat(hills ? outHills : []);
        return o; });
    T.slope = { cells: { res: C, x0: X0, z0: Z0, nx: NX, nz: NZ, f: b64.enc(FL), d: b64.enc(Int16Array.from(H, v => Math.round(v * 100))) } };
    T.paint = Object.assign({}, T.paint, { x0: X0 + C / 2, z0: Z0 + C / 2, nx: NX, nz: NZ, d: b64.enc(P) });
    T.gen = Object.assign({}, T.gen, { streets, lamps: (T.gen.lamps || []).map(mp).concat(lamps), open: (T.gen.open || []).map(o => (o.r != null) ? mp(o) : (() => { const a = map(o.x0, o.z0), b = map(o.x1, o.z1); return Object.assign({}, o, { x0: a[0], z0: a[1], x1: b[0], z1: b[1] }); })()) });
    T.beds = (T.beds || []).map(q => { const m = map((q[0] + q[2]) / 2, (q[1] + q[3]) / 2), dx = m[0] - (q[0] + q[2]) / 2, dz = m[1] - (q[1] + q[3]) / 2; return [r3(q[0] + dx), r3(q[1] + dz), r3(q[2] + dx), r3(q[3] + dz)].concat(q.slice(4)); });
    T.marks = (T.marks || []).map(m => m.__gridiron ? { __gridiron: Object.assign({}, m.__gridiron, { at: Object.assign({}, m.__gridiron.at, mp(m.__gridiron.at)) }) } : (typeof m.x0 === 'number' ? (() => { const a = map(m.x0, m.z0), b = map(m.x1, m.z1); return Object.assign({}, m, { x0: a[0], z0: a[1], x1: b[0], z1: b[1] }); })() : (typeof m.x === 'number' ? mp(m) : m))).concat(marks);
    T.features = OUT.concat(extra, trees);
    T.features.forEach(f => { if (f.id === 'dc:coastroad:arch') f.z = r3(-Z0 - 0.4); });   // the Coast Road's causeway past the room: it starts at the room's new south line

    T.traffic = traffic;
    T.signals = (T.signals || []).map(mp).concat(signals);
    T.busStops = (T.busStops || []).map(b => Object.assign(mp(b), { signs: (b.signs || []).map(mp) }));
    count.features = T.features.length; count.props = room.props.length; count.lamps = T.gen.lamps.length; count.trees = trees.length; count.streets = streets.length;

    /* the text: a key a line, a row a line in the long lists */
    const rows = (arr, ind) => '[\n' + arr.map(v => ind + ser(v)).join(',\n') + '\n' + ind.slice(4) + ']';
    const tl = []; Object.keys(T).forEach(k => { if (T[k] === undefined) return; tl.push('                ' + k + ': ' + (k === 'features' ? rows(T.features, '                    ') : ser(T[k])) + ','); });
    const out = ['site_prebuilt_downtown_streets: {'];
    Object.keys(room).forEach(k => { if (room[k] === undefined) return;
        if (k === 'terrain') out.push('            terrain: {\n' + tl.join('\n') + '\n            },');
        else out.push('            ' + k + ': ' + (k === 'props' ? rows(room.props, '                ') : ser(room[k])) + ','); });
    out.push('        },\n');
    const text = out.join('\n');
    return { text, room, count, say, grid: { H, P, FL, KIND, TY, K, at, LAT, LK }, BRIDGES, SLIPS, streets, traffic, ctl };
}
module.exports = { apply, map, band, ser, parse, CUTX, CUTZ, DX, DZ, X0, Z0, NX, NZ, C };
