#!/usr/bin/env node
// bake-land.js — THE BAKE (WORLD_GEOGRAPHY_PLAN.md §5.1, phase G0 — 2026-09-28). A repo-only tool.
//
// Bakes data.js HQ_LAND (the world recipe) into THE LAND: one heightmap for the whole world with its layers
// (material, forest density, water surface), the roads graded into it, the pads flattened, and the sight test
// that holds THE SIGHT RULE (R2). It is the sketch generator (project folder open-world/geography/sketch/
// land-sketch.js + r2check.js + reveals.js) hardened:
//   - the recipe comes from data.js through load-data.js (one source; the sketch's recipe.js is retired);
//   - every physical step is in metres, so the land keeps its shape at any cell size (the erosion's drop life,
//     brush and count; the thermal passes; the index of a carve along its line is found by arc length);
//   - ridged noise with ProceduralTerrains' gradient damping (damp = 1/(1 + k·|∇|²), reimplemented, not copied)
//     so the ranges carry gullies instead of rounded domes;
//   - trails are BENCHED: graded to at most 0.9 and cut into the slope, with steps marked where they pass 0.35;
//   - a river's water surface falls monotonically from source to mouth (R7), a lake has one level; G3: a river that
//     reaches the coast meets the sea at the sea's level (HQ_LAND.riverMouth: its last stretch falls to it, the bed with it);
//   - a CLIFF material wherever the slope passes 0.8 (R3: a steep face is always drawn);
//   - the rules are checked in one place (checkRules) that the CLI and land-bake.test.js share.
//
//   node bake-land.js                       bake at 2 m into Assets/Land/ and stamp data.js HQ_LAND.baked.id
//   node bake-land.js --cell 8 --no-tiles   a quick look (8 m, ~15 s)
//   options: --cell <m>  --out <dir>  --no-tiles  --no-map  --no-stamp  --quiet
//   G2: also stamps HQ_LAND.baked.hubY (HQ's pad). The ground wears the bucket's own terrain / urban sheets (HQ_LAND_RULES.tex).
//
// Writes (under --out, default Assets/Land/ — upload to R2 at the same path):
//   land.json        the overlay: places (baked heights), roads (graded, per-sample y), bridges, rivers, lakes,
//                    regions, the coast, the sight lists, the reveals, stats and the bake id. The map's ATLAS tab.
//   land-map.png     the shaded relief with contours (4 m a pixel). The ATLAS tab draws the vectors over it.
//   tiles/t_<i>_<j>.bin   256 m land tiles (129² samples at 2 m): 16-byte header 'EWLT' v1, samples u16, x0 f32,
//                    z0 f32; then height u16 (1 cm steps from heightBase), material u8, forest u8, water u16
//                    (0xFFFF = no water). G2 streams them; nothing reads them in G0.
//   sea.bin          the whole world at 8 m ('EWLS' v1, n u16, x0 f32, cell f32; height u16, material u8).
// Exit 1 when a rule is broken (the sight rule, a river running uphill, a road too steep, a place off every route).
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const vm = require('vm');
const { loadGameData, REPO_ROOT } = require('./load-data.js');

// ───────── the materials (u8 codes in the tiles; land.json carries this table)
const MATS = ['deep', 'shallow', 'sand', 'grass', 'meadow', 'forest', 'rock', 'snow', 'desert', 'redrock', 'playa', 'farm',
    'urban', 'road', 'trail', 'river', 'lake', 'ice', 'pack', 'tundra', 'clay', 'cliff', 'lane', 'paved'];   // G5: a lane's packed dirt, a paved lane
const M = Object.fromEntries(MATS.map((m, k) => [m, k]));
const WET = new Set([M.deep, M.shallow, M.river, M.lake]);
const CLIFF_SLOPE = 0.8;       // a cliff is drawn wherever the ground is steeper than this (R3; the audit's line is 1.0)
const TRAIL_MAX = 0.9;         // a trail is benched to at most this grade (R5: at most 1.0 locally)
const TRAIL_STEPS = 0.35;      // steeper than this a trail is steps

// ───────── utils
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

// ───────── noise (simplex 2D, seeded)
function makeSimplex(seed) {
    const p = new Uint8Array(256); for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed >>> 0; const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    const perm = new Uint8Array(512); for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const gx = [1, -1, 1, -1, 1, -1, 0, 0], gy = [1, 1, -1, -1, 0, 0, 1, -1];
    const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
    return function (xin, yin) {
        const s2 = (xin + yin) * F2; const i = Math.floor(xin + s2), j = Math.floor(yin + s2);
        const t = (i + j) * G2; const x0 = xin - (i - t), y0 = yin - (j - t);
        const i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
        const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
        const ii = i & 255, jj = j & 255; let n = 0;
        let t0 = 0.5 - x0 * x0 - y0 * y0; if (t0 > 0) { const g = perm[ii + perm[jj]] & 7; t0 *= t0; n += t0 * t0 * (gx[g] * x0 + gy[g] * y0); }
        let t1 = 0.5 - x1 * x1 - y1 * y1; if (t1 > 0) { const g = perm[ii + i1 + perm[jj + j1]] & 7; t1 *= t1; n += t1 * t1 * (gx[g] * x1 + gy[g] * y1); }
        let t2 = 0.5 - x2 * x2 - y2 * y2; if (t2 > 0) { const g = perm[ii + 1 + perm[jj + 1]] & 7; t2 *= t2; n += t2 * t2 * (gx[g] * x2 + gy[g] * y2); }
        return 70 * n;
    };
}
function fbm(noise, x, z, oct, lac, gain) {
    let a = 1, f = 1, sum = 0, norm = 0, xx = x, zz = z;
    for (let o = 0; o < oct; o++) { sum += a * noise(xx * f, zz * f); norm += a; a *= gain; f *= lac; const t = xx; xx = 0.8 * t - 0.6 * zz; zz = 0.6 * t + 0.8 * zz; }
    return sum / norm;
}
function ridged(noise, x, z, oct) {
    let a = 0.5, f = 1, sum = 0, carry = 1, xx = x, zz = z;
    for (let o = 0; o < oct; o++) { let v = 1 - Math.abs(noise(xx * f, zz * f)); v *= v; sum += a * v * carry; carry = clamp(v * 1.6, 0, 1); a *= 0.5; f *= 2.03; const t = xx; xx = 0.8 * t - 0.6 * zz; zz = 0.6 * t + 0.8 * zz; }
    return sum; // ~0..1
}
// THE GRADIENT DAMPING (ProceduralTerrains' idea, reimplemented): each octave's ridge is damped by the slope the
// octaves above it already built (damp = 1/(1 + k·|∇|²)), so the fine ridges stay on the gentle ground and the steep
// flanks keep clean gullies instead of rounded domes. The gradient is the octave's own, by central difference.
function ridgedDamped(noise, x, z, oct, k) {
    let a = 0.5, f = 1, sum = 0, carry = 1, gxs = 0, gzs = 0, xx = x, zz = z; const e = 0.01;
    for (let o = 0; o < oct; o++) {
        const px = xx * f, pz = zz * f;
        const r = q => { const v = 1 - Math.abs(q); return v * v; };
        const v = r(noise(px, pz)), vx = (r(noise(px + e, pz)) - r(noise(px - e, pz))) / (2 * e), vz = (r(noise(px, pz + e)) - r(noise(px, pz - e))) / (2 * e);
        gxs += a * vx * f; gzs += a * vz * f;
        const damp = 1 / (1 + k * 4 * (gxs * gxs + gzs * gzs));
        sum += a * v * carry * damp; carry = clamp(v * 1.6, 0, 1); a *= 0.5; f *= 2.03;
        const t = xx; xx = 0.8 * t - 0.6 * zz; zz = 0.6 * t + 0.8 * zz;
    }
    return sum;
}

// ───────── polylines (resolution-free)
function cr(p0, p1, p2, p3, t) { const t2 = t * t, t3 = t2 * t; return [0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)); }
function resample(pts, step, loop) {
    const n = pts.length, out = [];
    const P = i => loop ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
    const segs = loop ? n : n - 1;
    for (let s = 0; s < segs; s++) {
        const p1 = P(s), p2 = P(s + 1); const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const k = Math.max(1, Math.ceil(len / step));
        for (let q = 0; q < k; q++) out.push(cr(P(s - 1), p1, p2, P(s + 2), q / k));
    }
    out.push(loop ? out[0].slice() : pts[n - 1].slice());
    return out;
}
function cumLen(P) { const L = new Float64Array(P.length); for (let k = 1; k < P.length; k++) L[k] = L[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]); return L; }
// the sample of a resampled line nearest arc length s (the carves index their profile by this, not by s / step)
function idxAt(L, s) { let lo = 0, hi = L.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= s) lo = m; else hi = m; } return (s - L[lo] < L[hi] - s) ? lo : hi; }

// ───────── PNG (zero-dependency: zlib + adaptive row filters)
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC_T[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function pngChunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function encodePng(w, h, rgb) {
    const bpp = 3, stride = w * bpp, raw = Buffer.alloc((stride + 1) * h), cand = [0, 1, 2, 4].map(() => Buffer.alloc(stride));
    for (let y = 0; y < h; y++) {
        const row = rgb.subarray(y * stride, (y + 1) * stride), up = y ? rgb.subarray((y - 1) * stride, y * stride) : null;
        let best = 0, bestSum = Infinity;
        [0, 1, 2, 4].forEach((ft, ci) => {
            const out = cand[ci]; let sum = 0;
            for (let i = 0; i < stride; i++) {
                const a = i >= bpp ? row[i - bpp] : 0, b = up ? up[i] : 0, c = (up && i >= bpp) ? up[i - bpp] : 0;
                let pr = 0;
                if (ft === 1) pr = a; else if (ft === 2) pr = b;
                else if (ft === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); pr = (pa <= pb && pa <= pc) ? a : pb <= pc ? b : c; }
                const v = (row[i] - pr) & 255; out[i] = v; sum += v < 128 ? v : 256 - v;
            }
            if (sum < bestSum) { bestSum = sum; best = ci; }
        });
        raw[y * (stride + 1)] = [0, 1, 2, 4][best]; cand[best].copy(raw, y * (stride + 1) + 1);
    }
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', ihdr), pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })), pngChunk('IEND', Buffer.alloc(0))]);
}

// ───────── the recipe (data.js, headless)
function readRecipe(opts) {
    const sb = loadGameData(opts && opts.dataFile ? { file: opts.dataFile } : undefined);
    const R = JSON.parse(JSON.stringify(vm.runInContext('HQ_LAND', sb)));   // a private copy: the bake writes baked heights onto its places
    return { R, sb };
}

// ════════ THE BAKE ════════════════════════════════════════════════════════════════════════════════════════════════════
function bake(opts) {
    opts = opts || {};
    const { R, sb } = opts.recipe ? { R: JSON.parse(JSON.stringify(opts.recipe)), sb: opts.sandbox } : readRecipe(opts);
    const EXT = R.baked.ext, CELL = opts.cell || R.baked.cell;
    const N = Math.round(2 * EXT / CELL), NN = N * N;
    const T0 = Date.now(); const log = opts.quiet ? () => {} : (...a) => console.log(((Date.now() - T0) / 1000).toFixed(1) + 's', ...a);
    log(`bake: ${CELL} m cells, ${N}² over ${2 * EXT} m`);
    const X = i => -EXT + (i + 0.5) * CELL, Z = j => -EXT + (j + 0.5) * CELL;
    const toI = x => (x + EXT) / CELL - 0.5;
    const nA = makeSimplex(R.seed), nB = makeSimplex(R.seed + 11), nC = makeSimplex(R.seed + 23), nD = makeSimplex(R.seed + 37);
    const warp = (x, z, amp, scale) => [x + amp * fbm(nC, x / scale, z / scale, 3, 2, 0.5), z + amp * fbm(nD, x / scale + 9.1, z / scale - 4.7, 3, 2, 0.5)];
    const box = (x0, z0, x1, z1) => [Math.max(0, Math.floor(toI(x0))), Math.min(N - 1, Math.ceil(toI(x1))), Math.max(0, Math.floor(toI(z0))), Math.min(N - 1, Math.ceil(toI(z1)))];
    // distance field of a polyline within reach Rm: d (m), s (arc length at the nearest point), side (+1 right of travel)
    function polyField(P, Rm, wantSide) {
        const d = new Float32Array(NN).fill(1e9), s = new Float32Array(NN), side = wantSide ? new Int8Array(NN) : null;
        const L = cumLen(P);
        for (let k = 0; k < P.length - 1; k++) {
            const a = P[k], b = P[k + 1]; const ex = b[0] - a[0], ez = b[1] - a[1]; const l2 = ex * ex + ez * ez || 1e-9; const sl = Math.sqrt(l2);
            const [i0, i1, j0, j1] = box(Math.min(a[0], b[0]) - Rm, Math.min(a[1], b[1]) - Rm, Math.max(a[0], b[0]) + Rm, Math.max(a[1], b[1]) + Rm);
            for (let j = j0; j <= j1; j++) { const z = Z(j); for (let i = i0; i <= i1; i++) {
                const x = X(i); let t = ((x - a[0]) * ex + (z - a[1]) * ez) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
                const qx = a[0] + ex * t, qz = a[1] + ez * t; const dd = Math.hypot(x - qx, z - qz); const c = j * N + i;
                if (dd < d[c]) { d[c] = dd; s[c] = L[k] + t * sl; if (side) side[c] = (ex * (z - a[1]) - ez * (x - a[0])) > 0 ? 1 : -1; }
            } }
        }
        return { d, s, side, L, P };
    }
    function sampleG(G, x, z) {
        const fi = clamp(toI(x), 0, N - 1.001), fj = clamp(toI(z), 0, N - 1.001); const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j;
        const c = j * N + i; return (G[c] * (1 - u) + G[c + 1] * u) * (1 - v) + (G[c + N] * (1 - u) + G[c + N + 1] * u) * v;
    }
    const cellAt = (x, z) => clamp(Math.round(toI(z)), 0, N - 1) * N + clamp(Math.round(toI(x)), 0, N - 1);

    // ───────── 1. THE COAST: signed distance (+ inland)
    log('coast');
    let coastP = resample(R.coast, 6, true);
    { const L = cumLen(coastP); const tot = L[L.length - 1];
        coastP = coastP.map((p, k) => { const q = coastP[Math.min(k + 1, coastP.length - 1)], o = coastP[Math.max(k - 1, 0)];
            let nx = -(q[1] - o[1]), nz = (q[0] - o[0]); const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
            const s = L[k] / tot * 60; const disp = 42 * nA(s * 0.9, 3.3) + 16 * nB(s * 3.1, 7.7) + 4 * nC(s * 11, 1.1);
            return [p[0] + nx * disp, p[1] + nz * disp]; });
        coastP[coastP.length - 1] = coastP[0].slice(); }
    const coastF = polyField(coastP, 700, false);
    const inside = new Uint8Array(NN);
    for (let j = 0; j < N; j++) { const z = Z(j); const xs = [];
        for (let k = 0; k < coastP.length - 1; k++) { const a = coastP[k], b = coastP[k + 1]; if ((a[1] <= z) !== (b[1] <= z)) xs.push(a[0] + (z - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
        xs.sort((p, q) => p - q); for (let q = 0; q + 1 < xs.length; q += 2) { const i0 = Math.max(0, Math.ceil(toI(xs[q]))), i1 = Math.min(N - 1, Math.floor(toI(xs[q + 1]))); for (let i = i0; i <= i1; i++) inside[j * N + i] = 1; } }
    const D = new Float32Array(NN); for (let c = 0; c < NN; c++) { const dd = Math.min(coastF.d[c], 700); D[c] = inside[c] ? dd : -dd; }

    // ───────── 2. THE LAND (before carving)
    log('land');
    const H = new Float32Array(NN);
    const hillAmpDefault = 16;
    const W = {}; for (const p of R.plateaus) W[p.id] = new Float32Array(NN);
    for (let j = 0; j < N; j++) { const z = Z(j); for (let i = 0; i < N; i++) { const x = X(i), c = j * N + i; const d = D[c];
        const [wx, wz] = warp(x, z, 140, 520);
        let base = 2 + 26 * ss(0, 320, d), amp = hillAmpDefault * ss(-40, 200, d);
        for (const p of R.plateaus) {
            const dist = Math.hypot(wx - p.at[0], wz - p.at[1]); let w = 1 - ss(p.r, p.r + p.edge, dist);
            if (p.id !== 'west') w *= ss(-20, 110, d);        // plateaus stay off the shore (the west keeps its sea cliffs)
            W[p.id][c] = w; base = lerp(base, p.h, w); amp = lerp(amp, R.regionAmp[p.id] || hillAmpDefault, w);
        }
        base += W.desert[c] * clamp(-(z - 640) * 0.042, -22, 10);   // the desert tilts south to the sea
        const hills = fbm(nA, wx / 420, wz / 420, 6, 2.05, 0.5);
        const hills2 = fbm(nB, wx / 150, wz / 150, 4, 2.1, 0.45);
        let h = base + amp * (hills * 1.15 + 0.35 * hills2);
        h += W.badlands[c] * 18 * (ridged(nB, wx / 160, wz / 160, 4) - 0.35);   // Area 8: eroded ridges
        H[c] = h;
    } }
    for (const b of R.bumps) { const [bx, bz] = b.at; const [i0, i1, j0, j1] = box(bx - b.r, bz - b.r, bx + b.r, bz + b.r);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const t = Math.hypot(X(i) - bx, Z(j) - bz) / b.r; if (t < 1) { const c = j * N + i; const f = Math.pow(1 - ss(0, 1, t), b.p); H[c] += b.h * f * (0.85 + 0.15 * nC(X(i) / 60, Z(j) / 60)); } } }
    log('ranges');
    for (const rg of R.ranges) { const P = resample(rg.pts, 8, false); const reach = rg.w * 1.6; const F = polyField(P, reach, false);
        let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity; P.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); });
        const [i0, i1, j0, j1] = box(x0 - reach, z0 - reach, x1 + reach, z1 + reach);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = j * N + i; const d = F.d[c]; if (d > reach) continue; const x = X(i), z = Z(j);
            const m = 1 - ss(0, rg.w * 1.35, d + 40 * nD(x / 180, z / 180));
            if (m <= 0) continue;
            const r1 = ridgedDamped(nA, x / 330, z / 330, 4, 0.18), r2 = ridged(nC, x / 190, z / 190, 3);
            const vary = rg.vary ? (1 - rg.vary + rg.vary * (0.5 + 0.5 * nB(x / 140 + 3.3, z / 140))) : 1;
            H[c] += vary * (rg.h * Math.pow(m, 1.25) * (0.45 + 0.55 * r1) + rg.h * 0.16 * m * r2); } }
    for (const pk of R.peaks) { const [px, pz] = pk.at; const [i0, i1, j0, j1] = box(px - pk.r * 1.2, pz - pk.r * 1.2, px + pk.r * 1.2, pz + pk.r * 1.2);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = X(i), z = Z(j); const ang = Math.atan2(z - pz, x - px);
            const rr = pk.r * (1 + 0.16 * nB(Math.cos(ang) * 1.7 + pk.h, Math.sin(ang) * 1.7)); const t = Math.hypot(x - px, z - pz) / rr; if (t >= 1.15) continue;
            let h = pk.h * Math.pow(Math.max(0, 1 - t), pk.p) * (0.92 + 0.08 * nA(x / 50, z / 50));
            h += pk.h * 0.12 * Math.max(0, 1 - t) * (ridgedDamped(nD, x / 90, z / 90, 4, 0.18) - 0.4);
            if (pk.crater) { const tc = Math.hypot(x - px, z - pz) / pk.crater.r; if (tc < 1) h -= pk.crater.d * (1 - tc * tc); }
            const c = j * N + i; const k = 30; H[c] = Math.log(Math.exp(H[c] / k) + Math.exp(h / k)) * k; } }
    // THERMAL EROSION: slopes steeper than the talus angle shed material downhill (no spikes; scree skirts). The pass
    // count grows as the cells shrink, so the skirts reach as far in metres at any cell size.
    log('thermal');
    { const T = 1.05 * CELL, iters = Math.round(30 * 4 / CELL); for (let it = 0; it < iters; it++) for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const c = j * N + i;
        for (let q4 = 0; q4 < 4; q4++) { const q = q4 === 0 ? c + 1 : q4 === 1 ? c - 1 : q4 === 2 ? c + N : c - N; const d = H[c] - H[q]; if (d > T) { const mv = (d - T) * 0.22; H[c] -= mv; H[q] += mv; } } } }
    // AREA 13: the escarpment (north of the line the highlands stand; south of it the foot is the desert)
    log('rim');
    { const P = resample(R.rim.pts, 6, false); const F = polyField(P, 280, true); const Ltot = F.L[F.L.length - 1];
        for (let c = 0; c < NN; c++) { if (F.d[c] > 280) continue; const sd = F.side[c] * F.d[c];
            const along = F.s[c] / Ltot; const endFade = 1 - ss(0.8, 1.0, Math.abs(along - 0.5) * 2);
            const x = X(c % N), z = Z((c / N) | 0); const wob = 9 * nA(x / 80, z / 80);
            const low = 36 + clamp(-(z - 640) * 0.042, -22, 10) + 4 * fbm(nB, x / 200, z / 200, 3, 2, 0.5);
            const high = R.rim.top + 10 * fbm(nC, x / 150, z / 150, 3, 2, 0.5);
            const cliff = ss(-6 + wob, R.rim.band + wob, sd);
            let target;
            if (sd < R.rim.band + wob) target = lerp(Math.max(H[c], lerp(high, H[c], ss(0, 260, -sd))), low, cliff);
            else target = lerp(Math.min(H[c], low), H[c], ss(60, 220, sd));
            H[c] = lerp(H[c], target, endFade); } }
    // THE GLEN
    log('glen');
    { const g = R.glen; const ax = g.b[0] - g.a[0], az = g.b[1] - g.a[1]; const l2 = ax * ax + az * az;
        const [i0, i1, j0, j1] = box(Math.min(g.a[0], g.b[0]) - 440, Math.min(g.a[1], g.b[1]) - 440, Math.max(g.a[0], g.b[0]) + 440, Math.max(g.a[1], g.b[1]) + 440);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = j * N + i; const x = X(i), z = Z(j); const t = ((x - g.a[0]) * ax + (z - g.a[1]) * az) / l2; const tc = clamp(t, 0, 1);
            const qx = g.a[0] + ax * tc, qz = g.a[1] + az * tc; const d = Math.hypot(x - qx, z - qz) + 18 * nC(x / 70, z / 70); if (d > 420) continue;
            const endOut = (t < 0 ? -t : t > 1 ? t - 1 : 0) * Math.sqrt(l2);
            const floor = g.floor + endOut * 0.25;
            const wall = floor + Math.max(0, d - g.flat) * g.slope * (1 + 0.25 * nB(x / 60, z / 60));
            if (wall < H[c]) H[c] = lerp(H[c], wall, 1 - ss(300, 420, d)); } }
    // THE DUNES + THE BASINS
    log('dunes');
    { const du = R.dunes; const [i0, i1, j0, j1] = box(du.at[0] - du.r, du.at[1] - du.r, du.at[0] + du.r, du.at[1] + du.r);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = j * N + i; const x = X(i), z = Z(j); const d = Math.hypot(x - du.at[0], z - du.at[1]); if (d > du.r) continue;
            const f = 1 - ss(du.r * 0.55, du.r, d); const ph = (x * du.dir[0] + z * du.dir[1]) / du.wave * Math.PI * 2 + 3 * nA(x / 120, z / 120);
            const crest = Math.pow(0.5 + 0.5 * Math.sin(ph), 2.2); H[c] += du.h * f * crest * (0.7 + 0.3 * nB(x / 70, z / 70)); } }
    for (const pl of R.basins) { const [i0, i1, j0, j1] = box(pl.at[0] - pl.rx * 1.9, pl.at[1] - pl.rz * 1.9, pl.at[0] + pl.rx * 1.9, pl.at[1] + pl.rz * 1.9);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = j * N + i; const x = X(i), z = Z(j); const e = Math.hypot((x - pl.at[0]) / pl.rx, (z - pl.at[1]) / pl.rz); if (e > 1.9) continue;
            const w = 1 - ss(0.75, 1.5, e); H[c] = lerp(H[c], pl.h + 0.3 * nA(x / 30, z / 30) + Math.max(0, e - 0.9) * 22, w); } }

    // ───────── 3. EROSION (droplets): the gullies and the fans. Every constant is in metres (the drop's life, its brush,
    // the drops per km²), so a 2 m bake and an 8 m bake carve the same land at their own grain.
    log('erosion');
    const PADS = new Float32Array(NN);   // 1 = a place stands here (no erosion, no trees)
    // G6 (THE SITES ON THEIR PADS, 2026-09-28): each place's parts stand on the land (data.js hqLandSites — the union of their boxes);
    // the ground under that box (+ `margin`) is flat at the pad's height and eases back to the land over `band` m; no trees in it
    const SR = (sb && vm.runInContext('typeof HQ_LAND_RULES !== "undefined" && HQ_LAND_RULES.sites ? JSON.stringify(HQ_LAND_RULES.sites) : "null"', sb)) || 'null';
    const SRULE = Object.assign({ margin: 3, band: 24 }, JSON.parse(SR) || {});
    const SITES = (sb && typeof sb.hqLandSites === 'function') ? JSON.parse(JSON.stringify(sb.hqLandSites())) : [];
    const rectD = (S, x, z) => Math.hypot(Math.max(S.x0 - x, 0, x - S.x1), Math.max(S.z0 - z, 0, z - S.z1));
    const SITE = new Uint8Array(NN);     // 1 = inside a site's box + margin (the island's own ground covers it)
    for (const S of SITES) { if (S.sea) continue;   // G7: a sea site (the harbour) stands on the water's own floor
        const g = SRULE.margin + SRULE.band; const [i0, i1, j0, j1] = box(S.x0 - g, S.z0 - g, S.x1 + g, S.z1 + g);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = j * N + i, d = rectD(S, X(i), Z(j)); if (d <= SRULE.margin) SITE[c] = 1;
            PADS[c] = Math.max(PADS[c], 1 - ss(SRULE.margin, SRULE.margin + SRULE.band, d)); } }
    for (const p of R.places) if (p.pad) { const [px, pz] = p.at; const r = p.pad * 1.3; const [i0, i1, j0, j1] = box(px - r, pz - r, px + r, pz + r);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const t = Math.hypot(X(i) - px, Z(j) - pz) / r; if (t < 1) PADS[j * N + i] = Math.max(PADS[j * N + i], 1 - ss(0.75, 1, t)); } }
    (function erode() {
        const drops = Math.round(0.28 * (2 * EXT) * (2 * EXT) / 16); let seed = 99991; const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };
        const inertia = 0.05, capF = 2.6, minCap = 0.01, erodeS = 0.16, depS = 0.3, evap = 1 - Math.pow(1 - 0.014, CELL / 4), grav = 4, life = Math.round(176 / CELL), rad = Math.max(2, Math.round(8 / CELL));   // never under 2 cells: a one-cell brush digs runaway pits
        const bw = []; let bs = 0; for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) { const w = Math.max(0, rad - Math.hypot(dx, dz)); if (w > 0) { bw.push([dx, dz, w]); bs += w; } } if (!bw.length) { bw.push([0, 0, 1]); bs = 1; } for (const b of bw) b[2] /= bs;
        const hg = (px, pz) => { const i = Math.floor(px), j = Math.floor(pz), u = px - i, v = pz - j, c = j * N + i;
            const a = H[c] / CELL, b = H[c + 1] / CELL, cc = H[c + N] / CELL, dd = H[c + N + 1] / CELL;
            return [a * (1 - u) * (1 - v) + b * u * (1 - v) + cc * (1 - u) * v + dd * u * v, (b - a) * (1 - v) + (dd - cc) * v, (cc - a) * (1 - u) + (dd - b) * u]; };
        const edge = rad + 2; let placed = 0, tries = 0;
        while (placed < drops && tries < drops * 6) { tries++;
            let px = edge + rnd() * (N - 2 * edge - 1), pz = edge + rnd() * (N - 2 * edge - 1); const c0 = Math.floor(pz) * N + Math.floor(px);
            if (D[c0] < 15 || H[c0] < 4 || PADS[c0] > 0.2 || Math.hypot(X(Math.floor(px)), Z(Math.floor(pz))) > 1600) continue; placed++;
            let dx = 0, dz = 0, sp = 1, wat = 1, sed = 0;
            for (let l = 0; l < life; l++) {
                const i = Math.floor(px), j = Math.floor(pz); const c = j * N + i; const u = px - i, v = pz - j;
                const [h, gxx, gzz] = hg(px, pz);
                dx = dx * inertia - gxx * (1 - inertia); dz = dz * inertia - gzz * (1 - inertia); const dl = Math.hypot(dx, dz); if (dl < 1e-6) break; dx /= dl; dz /= dl;
                px += dx; pz += dz; if (px < edge || pz < edge || px > N - edge - 1 || pz > N - edge - 1) break;
                const nh = hg(px, pz)[0]; const dh = nh - h;
                const cap = Math.max(-dh * sp * wat * capF, minCap);
                if (sed > cap || dh > 0) { const amt = dh > 0 ? Math.min(dh, sed) : (sed - cap) * depS; sed -= amt; const a = amt * CELL;
                    H[c] += a * (1 - u) * (1 - v); H[c + 1] += a * u * (1 - v); H[c + N] += a * (1 - u) * v; H[c + N + 1] += a * u * v;
                } else { const amt = Math.min((cap - sed) * erodeS, -dh); for (const [bx, bz, bw2] of bw) { const cc = c + bz * N + bx; if (PADS[cc] > 0.2) continue; H[cc] -= amt * bw2 * CELL * (1 - 0.8 * ss(140, 260, H[cc])); } sed += amt; }
                sp = Math.sqrt(Math.max(0, sp * sp + dh * grav)); wat *= (1 - evap); if (wat < 0.02) break;
            } }
        log('erosion droplets', placed);
    })();

    // the mesas stand up after the erosion: flat tops, sheer sides
    { const Ms = R.mesas; const [i0, i1, j0, j1] = box(Ms.box[0], Ms.box[1], Ms.box[2], Ms.box[3]);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = j * N + i; const x = X(i), z = Z(j);
            if (x < Ms.box[0] || x > Ms.box[2] || z < Ms.box[1] || z > Ms.box[3]) continue; if (D[c] < 60) continue;
            let av = 1; for (const a of Ms.avoid) av = Math.min(av, ss(a[2] * 0.7, a[2] * 1.2, Math.hypot(x - a[0], z - a[1])));
            const [wx, wz] = warp(x, z, 60, 200);
            const n = fbm(nD, wx / 260, wz / 260, 2, 2, 0.5); const top = ss(Ms.thr, Ms.thr + 0.03, n) * av; if (top <= 0) continue;
            const step = n > Ms.thr + 0.16 ? 1 : 0.62;
            H[c] += Ms.h * top * step * (W.desert[c] + W.deepdesert[c] + W.badlands[c] > 0.3 ? 1 : 0.4); } }

    // ───────── 4. CARVES: canyons, rivers (monotone beds and surfaces), lakes
    const WATER = new Float32Array(NN).fill(-9999);   // the water surface where water stands
    const RIVERD = new Float32Array(NN).fill(1e9);     // distance to the nearest river centreline
    const overlay = { rivers: [], roads: [], bridges: [], lakes: [], places: [], regions: R.regions, canyons: [], coast: coastP.filter((p, k) => k % 3 === 0).map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]),
        tunnels: R.tunnels || [], urban: R.urban || [], basins: R.basins || [], beaches: R.beaches || [], forests: (R.forests || []).filter(f => f.label).map(f => ({ id: f.id, label: f.label, at: f.at || f.pts[Math.floor(f.pts.length / 2)] })) };
    function monotoneBed(P, startMax, endY, minDrop) {
        const y = P.map(p => sampleG(H, p[0], p[1])); const L = cumLen(P); y[0] = Math.min(y[0], startMax);
        for (let k = 1; k < y.length; k++) y[k] = Math.min(y[k], y[k - 1] - minDrop * (L[k] - L[k - 1]));
        for (let pass = 0; pass < 3; pass++) for (let k = 1; k < y.length - 1; k++) y[k] = Math.min(y[k - 1], Math.max(y[k + 1], (y[k - 1] + y[k] + y[k + 1]) / 3));
        if (endY !== undefined) y[y.length - 1] = Math.min(y[y.length - 1], endY);
        return y;
    }
    function inLake(lk, x, z) {   // 0 = centre … 1 = shore … >1 outside (an ellipse along a→b, half-width lk.half)
        const ax = lk.b[0] - lk.a[0], az = lk.b[1] - lk.a[1]; const L = Math.hypot(ax, az); const ux = ax / L, uz = az / L;
        const cx = (lk.a[0] + lk.b[0]) / 2, cz = (lk.a[1] + lk.b[1]) / 2; const along = (x - cx) * ux + (z - cz) * uz, across = -(x - cx) * uz + (z - cz) * ux;
        const wob = 1 + 0.12 * nA(along / 90, across / 90 + lk.level);
        return Math.hypot(along / (L / 2 + 20), across / (lk.half * wob));
    }
    log('canyons');
    for (const cn of R.canyons) { const P = resample(cn.pts, 5, false); const Lc = cumLen(P); const bed = monotoneBed(P, 1e9, undefined, 0.012).map(v => v - 22); const F = polyField(P, 90, false);
        for (let k = 1; k < bed.length; k++) bed[k] = Math.min(bed[k], bed[k - 1] - 0.004 * (Lc[k] - Lc[k - 1]));
        for (let c = 0; c < NN; c++) { const d = F.d[c]; if (d > 90) continue; const k = idxAt(Lc, F.s[c]); const x = X(c % N), z = Z((c / N) | 0);
            const w = cn.w + 4 * nA(x / 40, z / 40); const floor = bed[k] + 0.4 * Math.max(0, d - w * 0.5);
            const wall = d < w ? floor : floor + (d - w) * cn.wall * (0.8 + 0.4 * ss(-0.3, 0.3, nB(x / 25, z / 25)));
            if (wall < H[c]) H[c] = wall; }
        overlay.canyons.push({ id: cn.id, label: cn.label, pts: P.filter((p, k) => k % 4 === 0).map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]) }); }
    log('rivers');
    for (const rv of R.rivers) { const P = resample(rv.pts, 4, false); const Ls = cumLen(P); const Lt = Ls[Ls.length - 1];
        const startY = sampleG(H, P[0][0], P[0][1]) - 1.5;
        const endY = sampleG(D, P[P.length - 1][0], P[P.length - 1][1]) < 0 ? -1.2 : undefined;
        const bed = monotoneBed(P, startY, endY, 0.0035);
        for (const lk of R.lakes) for (let k = 0; k < P.length; k++) { const p = P[k]; if (inLake(lk, p[0], p[1]) < 0.95) bed[k] = Math.min(bed[k], lk.level - 1.5); }
        for (let k = 1; k < bed.length; k++) bed[k] = Math.min(bed[k], bed[k - 1]);
        // R7: the SURFACE falls too (the channel deepens downstream, so bed + depth alone can rise where the bed is flat)
        const surf = new Float64Array(P.length);
        for (let k = 0; k < P.length; k++) { const raw = bed[k] + lerp(1.4, 3.0, Ls[k] / Lt) - 0.35; surf[k] = k ? Math.min(raw, surf[k - 1]) : raw; }
        for (const lk of R.lakes) for (let k = 0; k < P.length; k++) if (inLake(lk, P[k][0], P[k][1]) < 1) surf[k] = Math.min(surf[k], lk.level);   // in the loch the river IS the loch
        for (let k = 1; k < P.length; k++) surf[k] = Math.min(surf[k], surf[k - 1]);
        // R7 THE MOUTH (G3): at the coast the river is the sea's level. THE RUN-OUT — from the coast up to RM.run m, or up to the
        // foot of the nearest falls — falls to it in one even grade (never flatter than RM.grade) that meets the river's own
        // surface at its top; the bed goes down with the surface so the channel keeps its depth (a lowered surface on its own
        // bed would be a ford). Upstream of the run-out nothing changes.
        const RM = R.riverMouth || { coast: 16, lift: 0.05, grade: 0.02, run: 400, falls: 0.35 };
        let kc = -1; for (let k = 0; k < P.length; k++) if (sampleG(D, P[k][0], P[k][1]) < RM.coast) { kc = k; break; }
        if (kc >= 0) {
            let ke = kc;
            while (ke > 0 && Ls[kc] - Ls[ke - 1] <= RM.run && (surf[ke - 1] - surf[ke]) / Math.max(1e-6, Ls[ke] - Ls[ke - 1]) < RM.falls) ke--;
            const g = Math.max(RM.grade, (surf[ke] - R.sea - RM.lift) / Math.max(1, Ls[kc] - Ls[ke]));
            for (let k = ke; k < P.length; k++) { const cap = R.sea + RM.lift + Math.max(0, Ls[kc] - Ls[k]) * g; if (surf[k] > cap) surf[k] = cap; }
            for (let k = ke; k < P.length; k++) { const want = surf[k] + 0.35 - lerp(1.4, 3.0, Ls[k] / Lt); if (bed[k] > want) bed[k] = want; }
            for (let k = 1; k < P.length; k++) bed[k] = Math.min(bed[k], bed[k - 1]);
        }
        const vW = rv.valley; const F = polyField(P, vW * 2.2, false);
        for (let c = 0; c < NN; c++) { const d = F.d[c]; if (d > vW * 2.2) continue; const k = idxAt(Ls, F.s[c]); const fr = F.s[c] / Lt;
            const x = X(c % N), z = Z((c / N) | 0);
            const w = lerp(rv.w0, rv.w1, fr) * (1 + 0.2 * nA(x / 30, z / 30));
            const bank = surf[k] + 0.35, depth = Math.max(0.6, bank - bed[k]);
            let y;
            if (d < w) y = bank - depth + depth * 0.25 * (d / w) * (d / w);
            else y = bank - 0.3 + Math.pow(Math.max(0, d - w), 1.25) * lerp(0.55, 0.22, fr) * (0.8 + 0.4 * ss(-0.4, 0.4, nB(x / 50, z / 50)));
            const blend = 1 - ss(vW * 1.5, vW * 2.2, d);
            if (y < H[c]) H[c] = lerp(H[c], y, blend);
            if (d < w + 1.5 && D[c] > -5) WATER[c] = Math.max(WATER[c], surf[k]);
            if (d < RIVERD[c]) RIVERD[c] = d; }
        const pts3 = P.map((p, k) => [+p[0].toFixed(1), +p[1].toFixed(1), +surf[k].toFixed(2)]).filter((p, k) => k % 3 === 0 || k === P.length - 1);
        overlay.rivers.push({ id: rv.id, label: rv.label, w0: rv.w0, w1: rv.w1, pts: pts3, falls: rv.falls || [], mouth: kc >= 0 ? [+P[kc][0].toFixed(1), +P[kc][1].toFixed(1), +surf[kc].toFixed(2)] : null }); }
    log('lakes');
    for (const lk of R.lakes) {
        overlay.lakes.push({ id: lk.id, label: lk.label, level: lk.level, a: lk.a, b: lk.b, half: lk.half });
        for (let c = 0; c < NN; c++) { const x = X(c % N), z = Z((c / N) | 0); if (Math.abs(x - (lk.a[0] + lk.b[0]) / 2) > 900 || Math.abs(z - (lk.a[1] + lk.b[1]) / 2) > 900) continue;
            const e = inLake(lk, x, z); if (e > 1.6) continue;
            if (e < 1) { const bottom = lk.level - lk.depth * Math.pow(1 - e, 0.6) - 0.6; H[c] = Math.min(H[c], bottom); WATER[c] = lk.level; }
            else { const shore = lk.level + 0.4 + (e - 1) * 28; if (H[c] < shore && D[c] > 0) H[c] = lerp(H[c], Math.min(shore, H[c] + 6), 0.7 * (1 - ss(1.2, 1.6, e))); } } }

    // ───────── 5. THE SEA, THE WALL, THE ICE
    log('sea');
    const wallR = (x, z) => { const ang = Math.atan2(x, z);   // 0 = due south
        const s = Math.pow(Math.max(0, Math.cos(ang)), 1 / R.wall.southSpread * 2.2); return R.wall.r - R.wall.southPull * s + 26 * nB(ang * 3.1, 0.7) + 8 * nC(ang * 17, 3.3); };
    const ICE = new Uint8Array(NN);   // 1 = the ice wall / shelf, 2 = pack ice
    for (let c = 0; c < NN; c++) { const x = X(c % N), z = Z((c / N) | 0); const d = D[c];
        const off = -d; let sea = -3 - 26 * ss(0, 280, off) - 70 * ss(220, 700, off) - 30 * ss(0, 1, (Math.hypot(x, z) - 1700) / 600);
        sea -= 90 * (1 - ss(0, R.bermuda.trench, Math.hypot(x - R.bermuda.at[0], z - R.bermuda.at[1])));
        sea += 5 * fbm(nB, x / 160, z / 160, 3, 2, 0.5);
        const stacks = ss(0.62, 0.7, fbm(nC, x / 60, z / 60, 2, 2, 0.5)) * (1 - ss(40, 260, off)) * (x < -1200 ? 1 : 0);
        sea = Math.max(sea, lerp(sea, 26 + 20 * nA(x / 20, z / 20), stacks));
        for (const isl of (R.islands || [])) { if (Math.abs(x - isl[0]) > isl[2] * 2 || Math.abs(z - isl[1]) > isl[2] * 2) continue; const [iwx, iwz] = warp(x, z, 38, 90); const t = Math.hypot(iwx - isl[0], iwz - isl[1]) / isl[2]; if (t < 1.4) { const ih = isl[3] * Math.pow(Math.max(0, 1 - ss(0.2, 1.0, t)), 1.2) * (0.8 + 0.3 * nA(x / 30, z / 30)) - 18 * ss(0.9, 1.4, t); sea = Math.max(sea, ih); } }
        // G8: the cay is its site (the Bermuda Triangle's part stands on a bank in the Deep: 5b THE SEA SITES' BANKS below)
        let h = d > 0 ? H[c] : sea;
        if (d > -60 && d < 60) { const land = H[c]; const t = ss(-18, 26, d); h = lerp(sea, land, t); }
        const r = Math.hypot(x, z); const wr = wallR(x, z);
        if (r > wr - 240) {
            const sz0 = R.wall.shelf.z0 + 0.00005 * x * x + 90 * nA(x / 260, 5.1) + 28 * nB(x / 70, 2.2) + 10 * nC(x / 18, 9.4); const shelfZone = z > sz0 - 40 ? ss(sz0 - 40, sz0 + 10, z) : 0;
            if (shelfZone > 0 && r < wr) { h = Math.max(h, lerp(h, R.wall.shelf.h + 1.5 * nA(x / 40, z / 40), shelfZone)); ICE[c] = 1; }
            const face = ss(wr - 6, wr + 4, r + 5 * nD(x / 14, z / 14));
            if (face > 0) { const top = R.wall.h + 3 * fbm(nA, x / 200, z / 200, 2, 2, 0.5) + 14 * ss(wr, wr + 500, r); h = lerp(h, top, face); ICE[c] = 1; }
        }
        { const az = R.arctic.z + (R.arctic.bow || 0) * x * x + 110 * nA(x / 300, 0.3) + 40 * nC(x / 90, 4.4); const pIce = ss(az + 140, az - 180, z); if (d < -6 && !ICE[c] && pIce > 0 && pIce > 0.5 + 0.42 * fbm(nB, x / 45, z / 45, 3, 2, 0.5)) ICE[c] = 2; }
        H[c] = h; }

    // ───────── 5'. THE EDGE OF THE WORLD (G8, 2026-09-29): the pack ice you walk on, the fast ice off the north coast, the shelf's landing
    // THE FAST ICE: a band of ice frozen to the north coast where the pass comes down, out to the pack (the Pole is reached on foot)
    if (R.arctic.fast) { const FA = R.arctic.fast, P = resample(FA.pts, 4, false), F = polyField(P, FA.w, false);
        for (let c = 0; c < NN; c++) { if (F.d[c] > FA.w || ICE[c] === 1 || D[c] > 0) continue; const x = X(c % N), z = Z((c / N) | 0);
            if (F.d[c] < FA.w / 2 + 14 * nB(x / 60, z / 60)) ICE[c] = 2; } }
    // THE PACK: every frozen cell stands a floe's freeboard over the sea; within `foot` m of open water it runs down under the surface
    // (the ice foot: a swimmer wades up it and the skiff pulls up to it). The coast counts as ice here (no foot against the land).
    if (R.arctic.floe != null) { const EF = new Float32Array(NN), BIG = 1e9, dg = CELL * Math.SQRT2, foot = R.arctic.foot || 7;
        for (let c = 0; c < NN; c++) EF[c] = (ICE[c] === 2 || D[c] > 0 || ICE[c] === 1) ? BIG : 0;
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const c = j * N + i; let v = EF[c]; if (!v) continue;
            if (i > 0) v = Math.min(v, EF[c - 1] + CELL); if (j > 0) { v = Math.min(v, EF[c - N] + CELL); if (i > 0) v = Math.min(v, EF[c - N - 1] + dg); if (i < N - 1) v = Math.min(v, EF[c - N + 1] + dg); } EF[c] = v; }
        for (let j = N - 1; j >= 0; j--) for (let i = N - 1; i >= 0; i--) { const c = j * N + i; let v = EF[c]; if (!v) continue;
            if (i < N - 1) v = Math.min(v, EF[c + 1] + CELL); if (j < N - 1) { v = Math.min(v, EF[c + N] + CELL); if (i < N - 1) v = Math.min(v, EF[c + N + 1] + dg); if (i > 0) v = Math.min(v, EF[c + N - 1] + dg); } EF[c] = v; }
        for (let c = 0; c < NN; c++) { if (ICE[c] !== 2) continue; const x = X(c % N), z = Z((c / N) | 0);
            const top = R.arctic.floe + 0.12 * nA(x / 9, z / 9) + 0.1 * nC(x / 31, z / 31);
            H[c] = Math.max(H[c], lerp(-(R.arctic.footDepth || 1.8), top, ss(0, foot, EF[c] - CELL * 0.5))); } }
    // THE LANDING: the shelf's front is an ice cliff all along but here, where a ramp of ice runs up out of the water to the station
    if (R.wall.shelf.landing) { const LD = R.wall.shelf.landing, P = resample(LD.pts, 2, false), F = polyField(P, LD.w / 2 + 10, false), L = F.L;
        let sFront = null; for (let k = 0; k < P.length && sFront === null; k++) if (ICE[cellAt(P[k][0], P[k][1])] === 1 && sampleG(H, P[k][0], P[k][1]) > 2) sFront = L[k];
        if (sFront !== null) { const s0 = sFront - (LD.toeOut || 16), top = R.wall.shelf.h;
            for (let c = 0; c < NN; c++) { const dd = F.d[c]; if (dd > LD.w / 2 + 10) continue; const sc = F.s[c]; if (sc < s0 - 12) continue;
                const y = Math.min(top + 3, (LD.toe != null ? LD.toe : -2) + Math.max(0, sc - s0) * LD.grade);
                const w = (1 - ss(LD.w / 2, LD.w / 2 + 8, dd)) * ss(s0 - 12, s0, sc); if (w <= 0) continue;
                if (ICE[c] === 1 && H[c] > y) H[c] = lerp(H[c], y, w);
                else if (!ICE[c] && D[c] <= 0 && H[c] < y) { H[c] = lerp(H[c], y, w); if (w > 0.5) ICE[c] = 1; } } }
        else log('warn: the landing never meets the shelf'); }

    // ───────── 5a. BEACHES: a sand strip graded gently down into the water
    const BEACH = new Uint8Array(NN);
    for (const bc of (R.beaches || [])) { const P = resample(bc.pts, 4, false); const F = polyField(P, bc.w * 2.5, false);
        for (let c = 0; c < NN; c++) { const d = F.d[c]; if (d > bc.w * 2.5) continue; const x = X(c % N), z = Z((c / N) | 0);
            if (D[c] < -40) continue; const inland = Math.max(0, D[c]);
            const target = -1.5 + Math.min(inland, 70) * 0.075 + 0.2 * nA(x / 25, z / 25);
            const w = 1 - ss(bc.w, bc.w * 2.5, d); if (H[c] > target || D[c] > 0) H[c] = lerp(H[c], target, w);
            if (d < bc.w && H[c] > -0.5 && D[c] > -10) BEACH[c] = 1; } }

    // ───────── 5b. PADS (the sites' level ground), before the roads so a road arrives at its site's level
    log('pads');
    for (const p of R.places) { const [px, pz] = p.at; const y0 = sampleG(H, px, pz); p.y = y0;
        if (!p.pad) continue; const r = p.pad; let y = p.padY !== undefined ? p.padY : y0; if (p.kind === 'hub') y = Math.max(y0, R.hubMinY);
        p.y = y;
        const [i0, i1, j0, j1] = box(px - r * 1.6, pz - r * 1.6, px + r * 1.6, pz + r * 1.6);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
            const c = j * N + i; const t = Math.hypot(X(i) - px, Z(j) - pz) / r; if (t > 1.6) continue; const w = 1 - ss(0.8, 1.6, t); if (WATER[c] > -9000 && (WATER[c] > y || t > 0.8)) continue; H[c] = lerp(H[c], y, w); } }   // G6: a river past the flat keeps its bed (the blend never buries it)
    // G6: the sites' boxes, flat to their pad's height (after the discs, so the box wins where a disc's blend runs under it)
    // G7 (THE CITY ON THE HILL): a sloped site's box is levelled to its slope (data.js hqLandSiteY), not to one height
    const siteY = (S, x, z) => (S.slope && sb && typeof sb.hqLandSiteY === 'function') ? sb.hqLandSiteY(S, x, z) : S.y;
    // G8 THE SEA SITES' BANKS: a sea site out in the Deep (the Triangle's cay, the Dutchman) stands on a bank at its field's floor
    // (`bank`), which slopes back down to the Deep over `bankBand` m (a shoal the sea's colours show); the harbour keeps the bay's floor
    for (const S of SITES) { if (!S.sea || S.bank == null) continue;
        const g = SRULE.margin + (S.bankBand || 90); const [i0, i1, j0, j1] = box(S.x0 - g, S.z0 - g, S.x1 + g, S.z1 + g);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = j * N + i, d = rectD(S, X(i), Z(j)); if (d > g || D[c] > 0) continue;
            const w = 1 - ss(SRULE.margin, g, d); if (H[c] < S.bank) H[c] = lerp(H[c], S.bank, w); } }
    for (const S of SITES) { if (S.sea) continue;   // G7: the harbour keeps the bay's floor
        const g = SRULE.margin + SRULE.band; const [i0, i1, j0, j1] = box(S.x0 - g, S.z0 - g, S.x1 + g, S.z1 + g);
        // the band lets go of the ground toward a shore (a chamfer distance to the window's water): the bank meets its water, never a wall
        const wi = i1 - i0 + 1, wj = j1 - j0 + 1, DW = new Float32Array(wi * wj), BIG = 1e9, dg = CELL * Math.SQRT2;
        for (let j = 0; j < wj; j++) for (let i = 0; i < wi; i++) DW[j * wi + i] = WATER[(j + j0) * N + i + i0] > -9000 ? 0 : BIG;
        for (let j = 0; j < wj; j++) for (let i = 0; i < wi; i++) { const o = j * wi + i; let v = DW[o];
            if (i > 0) v = Math.min(v, DW[o - 1] + CELL); if (j > 0) { v = Math.min(v, DW[o - wi] + CELL); if (i > 0) v = Math.min(v, DW[o - wi - 1] + dg); if (i < wi - 1) v = Math.min(v, DW[o - wi + 1] + dg); } DW[o] = v; }
        for (let j = wj - 1; j >= 0; j--) for (let i = wi - 1; i >= 0; i--) { const o = j * wi + i; let v = DW[o];
            if (i < wi - 1) v = Math.min(v, DW[o + 1] + CELL); if (j < wj - 1) { v = Math.min(v, DW[o + wi] + CELL); if (i < wi - 1) v = Math.min(v, DW[o + wi + 1] + dg); if (i > 0) v = Math.min(v, DW[o + wi - 1] + dg); } DW[o] = v; }
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = j * N + i, d = rectD(S, X(i), Z(j)); if (d > g) continue;
            if (WATER[c] > -9000 && d > SRULE.margin) continue;
            let w = 1 - ss(SRULE.margin, g, d); if (d > SRULE.margin) w *= ss(0, SRULE.band * 0.5, DW[(j - j0) * wi + i - i0]);
            H[c] = lerp(H[c], siteY(S, X(i), Z(j)), w); } }

    // ───────── 6. ROADS (graded corridors) and TRAILS (benched)
    // G5 (THE ROADS, 2026-09-28): THE FILL CAP. The sketch's grader smoothed a road and clamped its grade, so wherever the ground fell
    // faster than the road could, the road floated off it on a "bridge" (the sketch's giveaway viaducts, §11 limit 2). Now a road may
    // stand at most `fill` m over the ground (a trail `trailFill`): the most grade-feasible profile under that cap (the lower envelope
    // of grade cones) is taken, so the road cuts into the slope instead (a cutting, its banks drawn as cliff) and leaves the ground only
    // over water (plus `approach` m either side) or inside a NAMED VIADUCT (HQ_LAND.viaducts: fork 6, Bridges 6 and 7).
    log('roads');
    const RR = R.roadRules || {};
    const ROAD = new Uint8Array(NN);   // the surface: 1 highway 2 road 3 paved lane 4 dirt lane 5 trail (the lower wins where two meet)
    const surfK = rd => rd.type === 'highway' ? 1 : rd.type === 'road' ? 2 : rd.type === 'trail' ? 5 : (rd.surface === 'paved' ? 3 : 4);
    const VIA = (R.viaducts || []);
    const inVia = (rd, x, z) => { for (const v of VIA) if (v.road === rd.id) for (const zn of v.zones) if (Math.hypot(x - zn[0], z - zn[1]) < zn[2]) return v; return null; };
    const baked = [];
    // one road's graded line over the ground as it stands: the smoothing, the water's lift, the grade clamp and THE FILL CAP
    function gradeLine(rd, pts) {
        const P = resample(pts, 4, !!rd.loop), L = cumLen(P);
        let y = P.map(p => sampleG(H, p[0], p[1]));
        const onWater = P.map(p => sampleG(WATER, p[0], p[1]) > -9000 || sampleG(D, p[0], p[1]) < 2);
        const isTrail = rd.type === 'trail';
        const SM = RR.smooth || { win: 10, passes: 4 }, win = isTrail ? 3 : SM.win; for (let pass = 0; pass < (isTrail ? 1 : SM.passes); pass++) { const y2 = y.slice(); for (let k = 0; k < y.length; k++) { let s = 0, n = 0; for (let q = -win; q <= win; q++) { const kk = rd.loop ? (k + q + y.length) % y.length : clamp(k + q, 0, y.length - 1); s += y[kk]; n++; } y2[k] = s / n; } y = y2; }
        if (!rd.loop) { const g0 = P.map(p => sampleG(H, p[0], p[1])); const m = Math.min(14, Math.floor(y.length / 3)); for (let q = 0; q < m; q++) { const t = ss(0, 1, q / m); y[q] = lerp(g0[q], y[q], t); const e = y.length - 1 - q; y[e] = lerp(g0[e], y[e], t); } }
        const clr = (RR.clear || {})[rd.type] != null ? RR.clear[rd.type] : (rd.type === 'highway' ? 9 : isTrail ? 2 : 5);
        // the water's surface under a sample: the highest real water cell around it (a bilinear read at a river's edge mixes in the -9999
        // of the dry cells); over NARROW water (a wet run shorter than `smallWet` m: a creek) the road needs only `clearSmall` m (a culvert span)
        const wAt = (x, z) => { const i = clamp(Math.floor(toI(x)), 0, N - 2), j = clamp(Math.floor(toI(z)), 0, N - 2), c = j * N + i; return Math.max(WATER[c], WATER[c + 1], WATER[c + N], WATER[c + N + 1]); };
        const clrK = P.map(() => clr); { const smallW = RR.smallRiver || 8, clrS = Math.min(clr, RR.clearSmall != null ? RR.clearSmall : 3); let a = -1;
          const narrow = (x, z) => { let best = 1e9, w = 99; for (const rv of R.rivers) for (const q of rv.pts) { const dd = Math.hypot(q[0] - x, q[1] - z); if (dd < best) { best = dd; w = Math.max(rv.w0, rv.w1); } } return best < 160 && w <= smallW; };
          for (let k = 0; k <= P.length; k++) { const w = k < P.length && onWater[k]; if (w && a < 0) a = k; if (!w && a >= 0) { const m = (a + k - 1) >> 1; if (narrow(P[m][0], P[m][1])) for (let q = a; q < k; q++) clrK[q] = clrS; a = -1; } } }
        const lb = P.map((p, k) => onWater[k] ? Math.max(wAt(p[0], p[1]), 0) + clrK[k] : -Infinity);
        for (let k = 0; k < y.length; k++) y[k] = Math.max(y[k], lb[k]);
        const grade = isTrail ? TRAIL_MAX : rd.grade;
        const ground = P.map(p => sampleG(H, p[0], p[1]));
        if (isTrail) for (let k = 0; k < y.length; k++) if (!onWater[k]) y[k] = clamp(y[k], ground[k] - 1.2, ground[k] + 0.6);   // a trail hugs the ground ...
        const gradeClamp = () => { for (let it = 0; it < 4; it++) { for (let k = 1; k < y.length; k++) { const dl = L[k] - L[k - 1]; y[k] = clamp(y[k], y[k - 1] - grade * dl, y[k - 1] + grade * dl); } for (let k = y.length - 2; k >= 0; k--) { const dl = L[k + 1] - L[k]; y[k] = clamp(y[k], y[k + 1] - grade * dl, y[k + 1] + grade * dl); } } };
        gradeClamp();
        // ... and where the ground is steeper than a trail may be, the grade clamp above BENCHES it into the slope; steps mark the steep bits
        // THE FILL CAP (G5): a DRY span longer than `maxDry` m (the sketch's giveaway viaducts) is regraded so the road stands at most
        // `fill` m over the ground there (± `capPad` m): it cuts into the slope instead. Over water (± `approach` m) and inside a named
        // viaduct the road keeps its line; a short span over a gully stays a bridge (R5: > 7 m over the ground).
        const appr = (RR.approach || {})[rd.type] != null ? RR.approach[rd.type] : 20, fill = isTrail ? (RR.trailFill || 2.4) : (RR.fill || 6.5);
        const maxDry = isTrail ? (RR.trailMaxDry || 0) : (RR.maxDry != null ? RR.maxDry : 60), capPad = RR.capPad || 40, bridgeH = isTrail ? 3 : 7;
        const free = new Uint8Array(P.length), via = P.map(p => inVia(rd, p[0], p[1])), cap = new Uint8Array(P.length);
        { let last = -1e9; for (let k = 0; k < P.length; k++) { if (onWater[k]) last = L[k]; if (L[k] - last <= appr) free[k] = 1; }
          last = 1e9; for (let k = P.length - 1; k >= 0; k--) { if (onWater[k]) last = L[k]; if (last - L[k] <= appr) free[k] = 1; }
          for (let k = 0; k < P.length; k++) if (via[k]) free[k] = 1; }
        if (RR.fill !== 0) for (let round = 0; round < 3; round++) {
            let open = -1, grew = false;
            for (let k = 0; k <= P.length; k++) { const dry = k < P.length && !free[k] && y[k] - ground[k] > bridgeH;
                if (dry && open < 0) open = k;
                if (!dry && open >= 0) { if (L[k - 1] - L[open] >= maxDry) for (let q = 0; q < P.length; q++) if (L[q] >= L[open] - capPad && L[q] <= L[k - 1] + capPad && !free[q] && !cap[q]) { cap[q] = 1; grew = true; } open = -1; } }
            if (!grew) break;
            const E = P.map((p, k) => cap[k] ? ground[k] + fill : Infinity);
            for (let lap = 0; lap < (rd.loop ? 2 : 1); lap++) {
                for (let k = 1; k < E.length; k++) E[k] = Math.min(E[k], E[k - 1] + grade * (L[k] - L[k - 1]));
                if (rd.loop) E[0] = Math.min(E[0], E[E.length - 1]);
                for (let k = E.length - 2; k >= 0; k--) E[k] = Math.min(E[k], E[k + 1] + grade * (L[k + 1] - L[k]));
                if (rd.loop) E[E.length - 1] = Math.min(E[E.length - 1], E[0]);
            }
            for (let k = 0; k < y.length; k++) y[k] = Math.max(Math.min(y[k], E[k]), lb[k]);
            gradeClamp();
        }
        // the water's lift is HARD: a road never passes under a river (the sketch ran Route 1 ten metres under River 2) — the
        // lower bound's cones raise the road's approaches to clear the water, whatever the smoothing and the cap did
        { const LB = lb.slice(); for (let lap = 0; lap < (rd.loop ? 2 : 1); lap++) {
            for (let k = 1; k < LB.length; k++) LB[k] = Math.max(LB[k], LB[k - 1] - grade * (L[k] - L[k - 1]));
            if (rd.loop) LB[0] = Math.max(LB[0], LB[LB.length - 1]);
            for (let k = LB.length - 2; k >= 0; k--) LB[k] = Math.max(LB[k], LB[k + 1] - grade * (L[k + 1] - L[k]));
            if (rd.loop) LB[LB.length - 1] = Math.max(LB[LB.length - 1], LB[0]); }
          for (let k = 0; k < y.length; k++) y[k] = Math.max(y[k], LB[k]); }
        return { P, L, y, onWater, ground, lb, free, via, clr, clrK, grade, isTrail, cap };
    }
    for (const rd of R.roads) { const G = gradeLine(rd, rd.pts);
        const { P, L, y, onWater, ground, lb, free, via, clr, clrK, grade, isTrail } = G;
        const bridges = []; let open = -1;
        for (let k = 0; k < P.length; k++) { const isB = onWater[k] || (y[k] - ground[k] > (isTrail ? 3 : 7)); if (isB && open < 0) open = k; if ((!isB || k === P.length - 1) && open >= 0) { if (L[k] - L[open] > 8) bridges.push([open, k]); open = -1; } }
        const inBridge = new Uint8Array(P.length); for (const [a, b] of bridges) for (let k = Math.max(0, a - 2); k <= Math.min(P.length - 1, b + 2); k++) inBridge[k] = 1;
        const hw = rd.w / 2, shoulder = isTrail ? 0.6 : 2.0, bankW = isTrail ? 12 : 110;
        const F = polyField(P, hw + shoulder + bankW, false);
        // under a span the ground keeps its own shape and its own material (G5: no road painted on a glen's floor under the viaduct)
        // (G5: the height between two samples is read off the line between them — the nearest sample's stepped the road 0.3 m every 4 m)
        const yS = sv => { let lo = 0, hi = L.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= sv) lo = m; else hi = m; } const t = clamp((sv - L[lo]) / Math.max(1e-6, L[hi] - L[lo]), 0, 1); return y[lo] + (y[hi] - y[lo]) * t; };
        for (let c = 0; c < NN; c++) { const d = F.d[c]; if (d > hw + shoulder + bankW) continue; const k = idxAt(L, F.s[c]); if (inBridge[k]) continue;
            const ry = yS(F.s[c]); const cur = H[c];
            if (d <= hw + shoulder) { H[c] = ry; if (d <= hw) ROAD[c] = Math.min(ROAD[c] || 9, surfK(rd)); }
            else { const e = d - hw - shoulder; const lim = e * (isTrail ? 1.4 : (cur > ry ? 2.0 : 0.7)); H[c] = clamp(cur, ry - lim, ry + lim); } }
        const steps = []; if (isTrail) { let s0 = -1; for (let k = 1; k < P.length; k++) { const g = Math.abs(y[k] - y[k - 1]) / Math.max(1e-6, L[k] - L[k - 1]); if (g > TRAIL_STEPS && s0 < 0) s0 = k - 1; if ((g <= TRAIL_STEPS || k === P.length - 1) && s0 >= 0) { steps.push([Math.round(L[s0]), Math.round(L[k])]); s0 = -1; } } }
        let cut = 0, cutAt = null; for (let k = 0; k < P.length; k++) if (!inBridge[k] && ground[k] - y[k] > cut) { cut = ground[k] - y[k]; cutAt = [Math.round(P[k][0]), Math.round(P[k][1]), Math.round(L[k])]; }
        const pts3 = P.map((p, k) => [+p[0].toFixed(1), +p[1].toFixed(1), +y[k].toFixed(2)]).filter((p, k) => k % 2 === 0 || k === P.length - 1);
        const orow = { id: rd.id, label: rd.label, type: rd.type, surface: ({ 1: 'asphalt', 2: 'asphalt', 3: 'paved', 4: 'dirt', 5: 'trail' })[surfK(rd)], w: rd.w, grade, loop: !!rd.loop, length: Math.round(L[L.length - 1]), pts: pts3,
            maxGrade: +(Math.max(...y.slice(1).map((v, k) => Math.abs(v - y[k]) / Math.max(1e-6, L[k + 1] - L[k])))).toFixed(3), steps, maxCut: +cut.toFixed(1), cutAt, rails: [] };
        overlay.roads.push(orow);
        for (const [a, b] of bridges) {
            const a2 = Math.max(0, a - 2), b2 = Math.min(P.length - 1, b + 2), mid = (a + b) >> 1, v = via.slice(a, b + 1).find(q => q) || null;
            const wet = onWater.slice(a, b + 1).some(q => q); let hMax = 0; for (let k = a; k <= b; k++) hMax = Math.max(hMax, y[k] - Math.max(ground[k], lb[k] > -Infinity ? lb[k] - clrK[k] : -Infinity));
            // over which river (the nearest centreline at the span's middle) — its bridge's name (HQ_LAND.bridgeNames)
            let river = null; if (wet) { let best = 1e9; for (const rv of overlay.rivers) for (const q of rv.pts) { const dd = Math.hypot(q[0] - P[mid][0], q[1] - P[mid][1]); if (dd < best) { best = dd; river = rv.id; } } if (best > 160) river = null; }
            const look = v ? v.look : isTrail ? 'foot' : (river && (RR.looks || {})[river]) || 'girder';
            // its name: a named viaduct's, else the road's own (HQ_LAND.roadRules.names), else the river's; a trail's is a footbridge
            const BN = R.bridgeNames || {}, own = (RR.names || {})[rd.id];
            const label = v ? v.label : isTrail ? (wet ? BN.foot || '' : '') : own && wet && !overlay.bridges.some(q => q.label === own) ? own : (river && BN[river]) || '';
            overlay.bridges.push({ id: rd.id + ':' + overlay.bridges.filter(q => q.road === rd.id).length, road: rd.id, type: rd.type, w: rd.w, len: Math.round(L[b] - L[a]), wet, river, viaduct: v ? v.id : null, look, label,
                span: [+L[a].toFixed(1), +L[b].toFixed(1)], deck: [+L[a2].toFixed(1), +L[b2].toFixed(1)], hMax: +hMax.toFixed(1),
                pts: P.slice(a2, b2 + 1).map((p, k) => [+p[0].toFixed(1), +p[1].toFixed(1), +y[a2 + k].toFixed(2)]) });
        }
        baked.push({ rd, P, L, y, inBridge, hw, shoulder, isTrail, row: orow });
    }
    // THE RAILS (G5, §5.6): a guard rail wherever the road's edge drops more than `railDrop` m (the rail is the blocker, not the edge —
    // R3), read off the finished ground (every road stamped). Never across another road, a trail or a pad (a gap where they meet), never
    // on a trail (the decks carry their own rails, both sides, all along).
    log('rails');
    { const railDrop = RR.railDrop || 2, railOff = RR.railOff || 1.0, probe = RR.railProbe || [1.5, 3.5], minRun = RR.railMinRun || 8;
      const others = baked.map(b => ({ id: b.rd.id, P: b.P, hw: b.hw, box: b.P.reduce((a, p) => [Math.min(a[0], p[0]), Math.min(a[1], p[1]), Math.max(a[2], p[0]), Math.max(a[3], p[1])], [1e9, 1e9, -1e9, -1e9]) }));
      const nearRoad = (self, x, z) => { for (const o of others) { if (o.id === self) continue; const r = o.hw + 2.5; if (x < o.box[0] - r || x > o.box[2] + r || z < o.box[1] - r || z > o.box[3] + r) continue; for (let k = 0; k < o.P.length - 1; k++) { const a = o.P[k], b = o.P[k + 1], ex = b[0] - a[0], ez = b[1] - a[1], l2 = ex * ex + ez * ez || 1e-9; let t = ((x - a[0]) * ex + (z - a[1]) * ez) / l2; t = clamp(t, 0, 1); if (Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t) < r) return true; } } return false; };
      const onPad = (x, z) => R.places.some(p => p.pad && Math.hypot(x - p.at[0], z - p.at[1]) < p.pad + 4) || SITES.some(S => rectD(S, x, z) < SRULE.margin + 4);
      for (const b of baked) { if (b.isTrail) continue; const { P, L, y, inBridge, hw, rd } = b, n = P.length;
        for (const side of [-1, 1]) { let s0 = -1, last = -1;
            const flush = () => { if (s0 >= 0 && L[last] - L[s0] >= minRun) b.row.rails.push([+L[s0].toFixed(1), +L[last].toFixed(1), side]); s0 = -1; };
            for (let k = 0; k < n; k++) {
                const kn = Math.min(k + 1, n - 1), kp = Math.max(k - 1, 0), tx = P[kn][0] - P[kp][0], tz = P[kn][1] - P[kp][1], tl = Math.hypot(tx, tz) || 1, nx = -tz / tl * side, nz = tx / tl * side;   // side +1 = the left of travel
                let want = false;
                if (!inBridge[k] && L[k] > 6 && L[n - 1] - L[k] > 6) {
                    const rx = P[k][0] + nx * (hw + railOff), rz = P[k][1] + nz * (hw + railOff);
                    const g = Math.min(sampleG(H, P[k][0] + nx * (hw + b.shoulder + probe[0]), P[k][1] + nz * (hw + b.shoulder + probe[0])), sampleG(H, P[k][0] + nx * (hw + b.shoulder + probe[1]), P[k][1] + nz * (hw + b.shoulder + probe[1])));
                    want = y[k] - g > railDrop && !nearRoad(rd.id, rx, rz) && !onPad(rx, rz);
                }
                if (want) { if (s0 < 0) s0 = k; last = k; } else flush();
            }
            flush(); } } }
    // THE JUNCTIONS (G5: the signs name the next place along each way): a road's end on another road, the places each way
    const UNDER = new Set((R.sight && R.sight.underground) || []);
    // (a road that runs through the city's ellipse serves Downtown, whose own pad is far off in the middle of the streets)
    { const serve = baked.map(b => { const out = []; for (const p of R.places) { if (UNDER.has(p.id) || p.kind === 'sea' || p.kind === 'door') continue; const r = (p.pad || 40) + 40 + b.hw, city = R.city && Math.hypot(p.at[0] - R.city.at[0], p.at[1] - R.city.at[1]) < 60; let best = -1, bd = 1e9; for (let k = 0; k < b.P.length; k++) { const x = b.P[k][0], z = b.P[k][1], d = Math.hypot(x - p.at[0], z - p.at[1]); if ((d < r || (city && ((x - R.city.at[0]) / R.city.rx) ** 2 + ((z - R.city.at[1]) / R.city.rz) ** 2 < 1)) && d < bd) { bd = d; best = k; } } if (best >= 0) out.push({ id: p.id, s: b.L[best] }); } return out.sort((a, c) => a.s - c.s); });
      overlay.junctions = [];
      // first where each road's ends meet another road; an end on another road's END is a road changing its name (no sign)
      const J = [];
      baked.forEach((b, bi) => { if (b.rd.loop) return;
        for (const end of [0, 1]) { const k0 = end ? b.P.length - 1 : 0, q = b.P[k0]; let hit = null;
            baked.forEach((m, mi) => { if (mi === bi) return; const r = b.hw + m.hw + 8; for (let k = 0; k < m.P.length; k++) { const d = Math.hypot(m.P[k][0] - q[0], m.P[k][1] - q[1]); if (d < r && (!hit || d < hit.d)) hit = { mi, k, d }; } });
            if (!hit) continue; const m = baked[hit.mi];
            if (!m.rd.loop && (m.L[hit.k] < 12 || m.L[m.L.length - 1] - m.L[hit.k] < 12)) continue;
            const inC = R.city && ((q[0] - R.city.at[0]) / R.city.rx) ** 2 + ((q[1] - R.city.at[1]) / R.city.rz) ** 2 < 1, here = p => !(inC && Math.hypot(R.places.find(pl => pl.id === p.id).at[0] - R.city.at[0], R.places.find(pl => pl.id === p.id).at[1] - R.city.at[1]) < 60);
            const sB = end ? b.L[b.L.length - 1] : 0, bl = serve[bi].filter(p => Math.abs(p.s - sB) > 25 && here(p)).sort((a, c) => Math.abs(a.s - sB) - Math.abs(c.s - sB));
            J.push({ bi, end, k0, mi: hit.mi, sM: m.L[hit.k], sB, to: bl.length ? bl[0].id : null, here }); } });
      // what each road leads to: the places on it, and at each junction the first place up the joining road
      const reach = serve.map(l => l.slice()); for (const j of J) if (j.to) reach[j.mi].push({ id: j.to, s: j.sM, via: j.bi });
      for (const j of J) { const b = baked[j.bi], m = baked[j.mi], Lm = m.L[m.L.length - 1];
        const along = (dir, not) => { let best = null, bd = 1e9; for (const p of reach[j.mi]) { if (p.id === j.to || p.id === not || p.via === j.bi || !j.here(p)) continue; let d = dir > 0 ? p.s - j.sM : j.sM - p.s; if (m.rd.loop) d = ((d % Lm) + Lm) % Lm; if (d > 25 && d < bd) { bd = d; best = p.id; } } return best; };
        const q = b.P[j.k0];
        overlay.junctions.push({ at: [+q[0].toFixed(1), +q[1].toFixed(1)], y: +b.y[j.k0].toFixed(2), branch: b.rd.id, end: j.end, sB: +j.sB.toFixed(1), main: m.rd.id, sM: +j.sM.toFixed(1),
            ahead: along(1), back: along(-1, along(1)), to: j.to, kind: b.rd.type, mainKind: m.rd.type }); } }

    // ───────── 7. MATERIALS, FOREST, CITY
    log('materials');
    const MAT = new Uint8Array(NN), FOREST = new Uint8Array(NN), URB = new Uint8Array(NN);
    const FBF = (R.forests || []).map(fb => fb.pts ? polyField(resample(fb.pts, 8, false), fb.r * 1.05, false) : null);
    const fbW = (k, c, x, z, h) => { const fb = R.forests[k]; const dd = FBF[k] ? FBF[k].d[c] : Math.hypot(x - fb.at[0], z - fb.at[1]);
        return fb.add * (1 - ss(fb.r * 0.7, fb.r, dd)) * (fb.minH ? ss(fb.minH - 12, fb.minH + 12, h) : 1); };
    const URBF = (R.urban || []).map(u => Object.assign(polyField(resample(u.pts, 4, false), u.w + 4, false), { w: u.w }));
    const slopeAt = c => { const i = c % N, j = (c / N) | 0; const i0 = Math.max(0, i - 1), i1 = Math.min(N - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(N - 1, j + 1);
        const gx = (H[j * N + i1] - H[j * N + i0]) / ((i1 - i0) * CELL), gz = (H[j1 * N + i] - H[j0 * N + i]) / ((j1 - j0) * CELL); return Math.hypot(gx, gz); };
    const SLOPE = new Float32Array(NN);
    for (let c = 0; c < NN; c++) { const x = X(c % N), z = Z((c / N) | 0); const h = H[c], d = D[c]; const sl = slopeAt(c); SLOPE[c] = sl;
        const cityD = Math.hypot((x - R.city.at[0]) / (R.city.rx / 250), (z - R.city.at[1]) / (R.city.rz / 250)) + 30 * nA(x / 90, z / 90);
        const stripIn = URBF.some(F => F.d[c] < F.w);
        if ((cityD < 250 || stripIn) && d > 4 && WATER[c] < -9000 && !BEACH[c]) URB[c] = 1;
        let m;
        if (ICE[c] === 1) m = M.ice; else if (ICE[c] === 2) m = M.pack;
        else if (WATER[c] > -9000 && WATER[c] > h + 0.05) m = RIVERD[c] < 40 ? M.river : M.lake;
        else if (h < 0.3 && d < 8) m = h < -14 ? M.deep : M.shallow;
        else if (ROAD[c]) m = ROAD[c] <= 2 ? M.road : ROAD[c] === 3 ? M.paved : ROAD[c] === 4 ? M.lane : M.trail;
        else if (URB[c]) m = M.urban;
        else {
            const snowLine = 250 + 20 * nB(x / 150, z / 150); const des = W.desert[c] + W.deepdesert[c], bad = W.badlands[c];
            let dryF = 0, wetF = 0; for (let k = 0; k < (R.forests || []).length; k++) { const w = fbW(k, c, x, z, h); if (R.forests[k].dry) dryF += w; else wetF += w; }
            dryF *= 0.85 + 0.3 * fbm(nD, x / 70, z / 70, 2, 2, 0.5); dryF -= 0.8 * PADS[c];
            const tundraZ = -1130 + 90 * nA(x / 240, 7.7) + 30 * nC(x / 60, z / 60); const isTundra = z < tundraZ && h < 60 + 25 * nB(x / 80, z / 80);
            if (h > snowLine || isTundra) m = isTundra ? M.tundra : M.snow;
            else if (dryF > 0.42 && sl < 1.4 && !BEACH[c]) { m = M.forest; FOREST[c] = Math.round(clamp(dryF, 0, 1) * 255); }   // the desert's pines (a sky island)
            else if (sl > 0.95) m = (des + bad > 0.4) ? M.redrock : M.rock;
            else if ((h < 2.8 && d < 60) || BEACH[c]) m = M.sand;
            else if (R.basins.some(pl => pl.playa && Math.hypot((x - pl.at[0]) / pl.rx, (z - pl.at[1]) / pl.rz) < 0.95)) m = M.playa;
            else if (des + 0.3 * fbm(nC, x / 170, z / 170, 4, 2, 0.55) > 0.45) m = sl > 0.5 ? M.redrock : M.desert;
            else if (bad + 0.32 * fbm(nA, x / 150, z / 150, 4, 2, 0.55) > 0.4) m = sl > 0.45 ? M.redrock : M.clay;
            else if (sl > 0.7) m = M.rock;
            else {
                let f = 0.12 + 0.45 * fbm(nD, x / 180, z / 180, 3, 2, 0.5);
                f += W.woods[c] * 0.75 + W.west[c] * 0.5 + W.central[c] * 0.05 - W.kingdom[c] * 0.2 - W.downs[c] * 0.5 - W.north[c] * 0.4 - W.city[c] * 0.6;
                f += 0.3 * (1 - ss(10, 45, RIVERD[c]));   // riparian
                f += wetF;
                f -= ss(170, 230, h);                       // the treeline
                f -= 0.8 * PADS[c]; f -= 0.8 * ss(0.5, 0.8, sl);
                if (Math.hypot(x - R.dunes.at[0], z - R.dunes.at[1]) < R.dunes.r) f = -1;
                const fd = clamp(f, 0, 1); FOREST[c] = Math.round(fd * 255);
                if (fd > 0.42) m = M.forest;
                else if (W.kingdom[c] > 0.5 && fbm(nC, x / 60, z / 60, 2, 2, 0.5) > -0.1 && sl < 0.25) m = M.farm;
                else if ((R.farms || []).some(f2 => Math.hypot(x - f2.at[0], z - f2.at[1]) < f2.r) && sl < 0.25) m = M.farm;
                else if (h > 60 && sl < 0.3 && fbm(nA, x / 90, z / 90, 2, 2, 0.5) > 0.1) m = M.meadow;
                else m = M.grass;
            }
            if (m !== M.forest) FOREST[c] = Math.min(FOREST[c], 60);
            if (SITE[c]) { FOREST[c] = 0; if (m === M.forest) m = M.grass; }   // G6: a site's own ground covers its box
        }
        // R3: a face steeper than CLIFF_SLOPE is drawn as a cliff, whatever grew or was built on it (the ice wall is its own face;
        // a trail's steps and the roads are drawn by their own meshes). The forest density stays: the sight test's canopy.
        if (sl > CLIFF_SLOPE && !WET.has(m) && m !== M.ice && m !== M.pack && m !== M.road && m !== M.trail && m !== M.lane && m !== M.paved) m = M.cliff;
        MAT[c] = m; }

    // ───────── 8. PLACES: heights, and THE SIGHT LINES (the viewshed the rule is checked on)
    log('sight');
    const SI = R.sight;
    const CANOPY = c => FOREST[c] > SI.forest ? SI.canopyForest : URB[c] ? SI.canopyCity : 0;
    for (const p of R.places) {
        if (p.topSearch) { let best = -1e9, bx = p.at[0], bz = p.at[1];   // a lookout stands on the true top
            for (let dz = -p.topSearch; dz <= p.topSearch; dz += 2) for (let dx = -p.topSearch; dx <= p.topSearch; dx += 2) { const h = sampleG(H, p.at[0] + dx, p.at[1] + dz); if (h > best) { best = h; bx = p.at[0] + dx; bz = p.at[1] + dz; } } p.at = [bx, bz]; }
        p.y = +sampleG(H, p.at[0], p.at[1]).toFixed(1); }
    function canSee(ax, az, ay, bx, bz, by) { const dist = Math.hypot(bx - ax, bz - az); const n = Math.ceil(dist / (CELL * 0.75));
        for (let k = 1; k < n; k++) { const t = k / n; const x = lerp(ax, bx, t), z = lerp(az, bz, t); const ly = lerp(ay, by, t); const fi = toI(x), fj = toI(z); if (fi < 0 || fj < 0 || fi >= N - 1 || fj >= N - 1) return false;
            const c = Math.round(fj) * N + Math.round(fi); const g = sampleG(H, x, z) + ((dist * t > SI.clear && dist * (1 - t) > SI.clear) ? CANOPY(c) : 0); if (g > ly) return false; } return true; }
    const sight = {};
    const onLand = R.places.filter(p => !SI.underground.includes(p.id));
    for (const a of onLand) { sight[a.id] = [];
        for (const b of onLand) { if (a === b) continue; const dd = Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]); if (dd > SI.maxD) continue;
            // a lookout (a poi) lets the player walk to its brink: any stand within reach toward the target, on ground within `lookoutDrop` of the top
            const stands = [[a.at[0], a.at[1], a.y]]; if (a.kind === 'poi') { const ux = (b.at[0] - a.at[0]) / dd, uz = (b.at[1] - a.at[1]) / dd;
                for (let s = 4; s <= SI.lookoutReach; s += 4) { const x = a.at[0] + ux * s, z = a.at[1] + uz * s, y = sampleG(H, x, z); if (y < a.y - SI.lookoutDrop) break; stands.push([x, z, y]); } }
            if (stands.some(([x, z, y]) => canSee(x, z, y + SI.eye, b.at[0], b.at[1], b.y + SI.target))) sight[a.id].push(b.id);
            else if (stands.some(([x, z, y]) => canSee(x, z, y + SI.eye, b.at[0], b.at[1], b.y + b.top))) sight[a.id].push('^' + b.id); } }
    // the share of the line a→b over water or ice (the sight rule's "across open sea")
    const seaShare = (a, b) => { const n = 60; let s = 0; for (let k = 1; k < n; k++) { const t = k / n; const m = MAT[cellAt(a.at[0] + (b.at[0] - a.at[0]) * t, a.at[1] + (b.at[1] - a.at[1]) * t)]; if (m === M.deep || m === M.shallow || m === M.ice || m === M.pack) s++; } return s / (n - 1); };
    const seas = {}; for (const [a, list] of Object.entries(sight)) for (const e of list) { if (e[0] === '^') continue; const A = R.places.find(p => p.id === a), B = R.places.find(p => p.id === e); seas[a + '>' + e] = +seaShare(A, B).toFixed(3); }
    // THE REVEALS: walk every road and trail every 8 m and log where each place first comes into view (its ground, else its top)
    log('reveals');
    const reveals = {};
    const targets = onLand.filter(p => !p.lookout && !p.peak || p.id === 'olympus' || p.id === 'shasta');
    for (const rd of overlay.roads) { const seen = {}; let s = 0; const P = rd.pts;
        for (let k = 0; k < P.length; k++) { if (k) s += Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]);
            const [x, z] = P[k]; const eye = Math.max(P[k][2], sampleG(H, x, z)) + SI.eye;
            for (const b of targets) { const dd = Math.hypot(b.at[0] - x, b.at[1] - z); if (dd > SI.maxD || dd < 1) continue; const cur = seen[b.id];
                if (cur && cur.ground !== undefined) continue;
                if (canSee(x, z, eye, b.at[0], b.at[1], b.y + SI.target)) seen[b.id] = Object.assign(cur || {}, { ground: Math.round(s), gAt: [Math.round(x), Math.round(z)], gDist: Math.round(dd) });
                else if (!cur && canSee(x, z, eye, b.at[0], b.at[1], b.y + b.top)) seen[b.id] = { top: Math.round(s), tAt: [Math.round(x), Math.round(z)], tDist: Math.round(dd) }; } }
        reveals[rd.id] = seen; }
    overlay.sight = sight; overlay.seas = seas; overlay.reveals = reveals;
    overlay.places = R.places.map(p => ({ id: p.id, label: p.label, kind: p.kind, region: p.region, at: [+p.at[0].toFixed(1), +p.at[1].toFixed(1)], y: p.y, top: p.top, pad: p.pad || 0, peak: !!p.peak, lookout: !!p.lookout }));
    overlay.sites = SITES.map(S => ({ place: S.place, rect: [S.x0, S.z0, S.x1, S.z1].map(v => +v.toFixed(1)), y: S.y, parts: S.parts }));   // G6: the map draws them
    overlay.regionNames = R.regionNames;
    let land = 0, forest = 0, hmin = 1e9, hmax = -1e9; for (let c = 0; c < NN; c++) { if (D[c] > 0) { land++; if (MAT[c] === M.forest) forest++; } if (H[c] < hmin) hmin = H[c]; if (H[c] > hmax) hmax = H[c]; }
    overlay.stats = { cell: CELL, n: N, hmin: +hmin.toFixed(1), hmax: +hmax.toFixed(1), landKm2: +(land * CELL * CELL / 1e6).toFixed(2), forestShare: +(forest / land).toFixed(3),
        routeKm: +(overlay.roads.reduce((s, r) => s + r.length, 0) / 1000).toFixed(1), bridgesM: overlay.bridges.reduce((s, b) => s + b.len, 0) };
    overlay.materials = MATS;
    log('baked', JSON.stringify(overlay.stats));
    return { R, sb, N, NN, EXT, CELL, X, Z, toI, sampleG, H, D, MAT, FOREST, WATER, URB, ICE, ROAD, SLOPE, overlay, M, MATS, wallR, cellAt };
}

// ════════ THE RULES (the CLI's exit code and land-bake.test.js both read this) ══════════════════════════════════════
function checkRules(B) {
    const { R, sb, overlay: ov, N, NN, MAT, SLOPE, WATER, M: Mt } = B;
    const out = [];
    const bad = (rule, msg) => out.push({ rule, msg });
    const P = Object.fromEntries(ov.places.map(p => [p.id, p]));
    // R2 THE SIGHT RULE from every pad, and mondo's named separations (not even the tops)
    const ok = (sb && typeof sb.hqLandSightOk === 'function') ? sb.hqLandSightOk : null;
    for (const [a, list] of Object.entries(ov.sight)) {
        for (const e of list) { if (e[0] === '^') continue;
            const allowed = ok ? ok(a, e, ov.seas[a + '>' + e]) : true;
            if (!allowed) bad('R2', `${a} (${P[a].region}) sees the ground of ${e} (${P[e].region}), ${Math.round(Math.hypot(P[a].at[0] - P[e].at[0], P[a].at[1] - P[e].at[1]))} m, sea ${Math.round((ov.seas[a + '>' + e] || 0) * 100)} %`); }
        const never = (sb && typeof sb.hqLandNever === 'function') ? sb.hqLandNever(a) : [];
        for (const y of never) if (list.includes(y) || list.includes('^' + y)) bad('R2', `${a} sees ${list.includes(y) ? 'the ground of' : 'the top of'} ${y} (a named separation)`);
    }
    // R7 rivers run downhill: every river's surface falls from source to mouth
    for (const rv of ov.rivers) for (let k = 1; k < rv.pts.length; k++) if (rv.pts[k][2] > rv.pts[k - 1][2] + 1e-6) { bad('R7', `${rv.id} rises ${(rv.pts[k][2] - rv.pts[k - 1][2]).toFixed(2)} m at (${rv.pts[k][0]}, ${rv.pts[k][1]})`); break; }
    // R7 THE MOUTH (G3): a river that reaches the coast meets the sea at its level (no water standing over the sea)
    const RM = R.riverMouth || { lift: 0.05 };
    for (const rv of ov.rivers) if (rv.mouth && rv.mouth[2] > R.sea + RM.lift + 0.01) bad('R7', `${rv.id} meets the sea ${(rv.mouth[2] - R.sea).toFixed(2)} m above it at (${rv.mouth[0]}, ${rv.mouth[1]})`);
    // R7 a lake has one level (every water cell inside it at that level) and an outlet (a river that leaves it lower)
    for (const lk of ov.lakes) {
        const cx = (lk.a[0] + lk.b[0]) / 2, cz = (lk.a[1] + lk.b[1]) / 2;
        const c = Math.round(B.toI(cz)) * N + Math.round(B.toI(cx));
        if (Math.abs(WATER[c] - lk.level) > 1e-3) bad('R7', `${lk.id}: the water at its centre is ${WATER[c].toFixed(2)}, not its level ${lk.level}`);
        let off = 0; const half = Math.hypot(lk.b[0] - lk.a[0], lk.b[1] - lk.a[1]) / 2;
        for (let t = -0.8; t <= 0.8; t += 0.1) { const x = cx + (lk.b[0] - lk.a[0]) / 2 * t, z = cz + (lk.b[1] - lk.a[1]) / 2 * t; const cc = Math.round(B.toI(z)) * N + Math.round(B.toI(x)); if (Math.abs(WATER[cc] - lk.level) > 1e-3) off++; }
        if (off) bad('R7', `${lk.id}: ${off} samples along its axis are off its level`);
        const outlet = ov.rivers.some(rv => { const s = rv.pts[0]; return Math.hypot(s[0] - lk.b[0], s[1] - lk.b[1]) < half * 0.4 && rv.pts[rv.pts.length - 1][2] < lk.level - 1; });
        if (!outlet) bad('R7', `${lk.id} has no outlet`);
    }
    // R5 road grades (a trail is benched to TRAIL_MAX), the ring a loop, every place on a route
    for (const rd of ov.roads) if (rd.maxGrade > rd.grade + 0.002) bad('R5', `${rd.id} climbs ${rd.maxGrade} (allowed ${rd.grade})`);
    const ring = ov.roads.find(r => r.loop);
    if (!ring) bad('R5', 'no road loops (Route 1)');
    else { const a = ring.pts[0], b = ring.pts[ring.pts.length - 1]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 1) bad('R5', `${ring.id} does not close (${Math.hypot(a[0] - b[0], a[1] - b[1]).toFixed(1)} m)`); }
    for (const r of reachability(B)) bad('R5', r);
    // R3 cliffs drawn: every cell steeper than 1.0 on open ground is cliff (or water, ice, a road or a trail, drawn by their own)
    let undrawn = 0, first = null;
    for (let c = 0; c < NN; c++) if (SLOPE[c] > 1.0) { const m = MAT[c]; if (m === Mt.cliff || m === Mt.ice || m === Mt.pack || m === Mt.road || m === Mt.trail || m === Mt.lane || m === Mt.paved || WET.has(m)) continue; undrawn++; if (!first) first = [B.X(c % N), B.Z((c / N) | 0)]; }
    if (undrawn) bad('R3', `${undrawn} cells steeper than 1.0 are not drawn as cliffs (first at ${first.map(v => v.toFixed(0)).join(', ')})`);
    // R4 THE EDGE OF THE WORLD (G8): the ice wall is the only border, and the skiff (then the feet, over the pack and the shelf) reaches it
    const E = edgeReach(B);
    if (E.gaps.length) bad('R4', `the ice wall has ${E.gaps.length} gaps (first at bearing ${E.gaps[0]}°)`);
    if (E.past) bad('R4', `the walker or the skiff gets past the wall (${E.past.map(v => v.toFixed(0)).join(', ')})`);
    if (E.unreached.length) bad('R4', `the wall is not reached at ${E.unreached.length} bearings (first ${E.unreached[0]}°)`);
    for (const id of E.lost) bad('R4', `${id} is not reached by the skiff and on foot`);
    return out;
}
// R4 (G8): a flood from the harbour's water. The skiff sails any sea cell deeper than its hull wants; it lands on any walkable cell
// that stands low at the water; the feet walk on (slope ≤ 1 between cells) and re-board at the water. Per half-degree bearing: the
// wall's inner face stands there (a gap is a bearing with no face at full height), something reached stands at its foot (the sea,
// the pack or the shelf), and nothing reached lies past it. The four edge sites must be reached.
function edgeReach(B) {
    const { R, N, NN, X, Z, H, D, SLOPE, WATER, ICE, CELL, overlay: ov, wallR, cellAt } = B;
    const boat = c => H[c] < -1.2 && WATER[c] < -9000, walk = c => SLOPE[c] <= 1.0 && H[c] > -1.3 && WATER[c] < -9000;   // the feet wade the last 1.3 m (the skiff and the walker overlap there)
    const P = Object.fromEntries(ov.places.map(p => [p.id, p]));
    const seen = new Uint8Array(NN), q = new Int32Array(NN); let qh = 0, qt = 0;   // 1 = sailed, 2 = walked
    { const [hx, hz] = (P.harbour || P.bermuda).at; let best = -1, bd = 1e9;
        for (let c = 0; c < NN; c++) if (boat(c)) { const d = Math.hypot(X(c % N) - hx, Z((c / N) | 0) - hz); if (d < bd) { bd = d; best = c; } }
        if (best >= 0) { seen[best] = 1; q[qt++] = best; } }
    while (qh < qt) { const c = q[qh++], i = c % N, j = (c / N) | 0, k = seen[c];
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue; const n = jj * N + ii; if (seen[n]) continue;
            let to = 0;
            if (k === 1) { if (boat(n)) to = 1; else if (walk(n) && H[n] <= 1.2) to = 2; }
            else { if (walk(n) && Math.abs(H[n] - H[c]) <= CELL * 1.0 + 0.62) to = 2; else if (boat(n) && H[c] <= 1.2) to = 1; }
            if (to) { seen[n] = to; q[qt++] = n; } } }
    const BINS = 720, reach = new Float32Array(BINS).fill(-1), face = new Float32Array(BINS).fill(-1), gaps = [], unreached = []; let past = null;
    for (let c = 0; c < NN; c++) { const x = X(c % N), z = Z((c / N) | 0), r = Math.hypot(x, z); const wr = wallR(x, z);
        const b = Math.floor(((Math.atan2(x, z) / (2 * Math.PI)) + 1) % 1 * BINS) % BINS;
        if (seen[c]) { if (r > reach[b]) reach[b] = r; if (r > wr + 8 && !past) past = [x, z]; }
        if (ICE[c] === 1 && r >= wr - 2 && r <= wr + 40 && H[c] >= R.wall.h - 15) face[b] = Math.max(face[b], H[c]); }
    for (let b = 0; b < BINS; b++) { const th = (b + 0.5) / BINS * 2 * Math.PI, wr = wallR(Math.sin(th) * 2500, Math.cos(th) * 2500);
        if (face[b] < 0) gaps.push((b / 2).toFixed(1));
        if (reach[b] < wr - 3 * CELL - 8) unreached.push((b / 2).toFixed(1)); }
    const lost = ['cay', 'dutchman', 'station', 'pole'].filter(id => { const p = P[id]; if (!p) return false; const r = 60;
        for (let dz = -r; dz <= r; dz += CELL) for (let dx = -r; dx <= r; dx += CELL) if (seen[cellAt(p.at[0] + dx, p.at[1] + dz)]) return false; return true; });
    let sailed = 0, walked = 0; for (let c = 0; c < NN; c++) { if (seen[c] === 1) sailed++; else if (seen[c] === 2) walked++; }
    return { gaps, past, unreached, lost, reach, face, seen, sailed, walked };
}
// every place on land is on a route: roads join where they touch; a place is served by a road that passes within its pad
// (+40 m); Disaster City's places are served by its streets (G7) once any road enters the city; sea, edge and underground
// places are reached by sea or through their mouths
function reachability(B) {
    const { R, overlay: ov } = B;
    const roads = ov.roads, near = (p, q, r) => Math.hypot(p[0] - q[0], p[1] - q[1]) < r;
    const cityIn = p => Math.hypot((p[0] - R.city.at[0]) / (R.city.rx / 250), (p[1] - R.city.at[1]) / (R.city.rz / 250)) < 250;
    const adj = roads.map(() => new Set());
    const inCity = roads.map(rd => rd.pts.some(q => cityIn(q)));   // the city's streets (G7) join every road that enters it
    for (let a = 0; a < roads.length; a++) for (let b = a + 1; b < roads.length; b++) {
        const ra = roads[a], rb = roads[b], r = ra.w / 2 + rb.w / 2 + 8;
        const touch = ra.pts.some(p => rb.pts.some(q => near(p, q, r)));
        if (touch || (inCity[a] && inCity[b])) { adj[a].add(b); adj[b].add(a); }
    }
    const skip = new Set(['sea', 'edge', 'arctic']);
    const served = p => { const r = (p.pad || 40) + 40; const out = []; roads.forEach((rd, k) => { if (rd.pts.some(q => near(p.at, q, r + rd.w / 2))) out.push(k); }); return out; };
    const hq = ov.places.find(p => p.kind === 'hub');
    const seen = new Set(), stack = served(hq);
    stack.forEach(k => seen.add(k));
    while (stack.length) { const k = stack.pop(); adj[k].forEach(n => { if (!seen.has(n)) { seen.add(n); stack.push(n); } }); }
    const cityReached = [...seen].some(k => roads[k].pts.some(q => cityIn(q)));
    const msgs = [];
    for (const p of ov.places) {
        if (skip.has(p.region) || R.sight.underground.includes(p.id) || p === hq) continue;
        const s = served(p);
        if (s.some(k => seen.has(k))) continue;
        if (cityIn(p.at) && cityReached) continue;
        msgs.push(`${p.id} (${p.label}) is on no route from HQ${s.length ? ' (its road ' + s.map(k => roads[k].id).join(', ') + ' joins nothing)' : ''}`);
    }
    return msgs;
}

// ════════ OUTPUT ═══════════════════════════════════════════════════════════════════════════════════════════════════════
function writeOutputs(B, outDir, opts) {
    opts = opts || {};
    const { R, N, EXT, CELL, H, MAT, FOREST, WATER, sampleG, toI, overlay, M: Mt } = B;
    fs.mkdirSync(outDir, { recursive: true });
    const base = R.baked.heightBase, TILE = R.baked.tile;
    const encH = y => clamp(Math.round((y - base) * 100), 0, 65534);
    const nearest = (G, x, z) => G[clamp(Math.round(toI(z)), 0, N - 1) * N + clamp(Math.round(toI(x)), 0, N - 1)];
    const files = {};
    // the land tiles
    const tiles = [];
    if (opts.tiles !== false) {
        const S = Math.round(TILE / CELL) + 1, per = Math.ceil(2 * EXT / TILE), step = TILE / (S - 1);
        fs.mkdirSync(path.join(outDir, 'tiles'), { recursive: true });
        for (let tj = 0; tj < per; tj++) for (let ti = 0; ti < per; ti++) {
            const x0 = -EXT + ti * TILE, z0 = -EXT + tj * TILE;
            let keep = false;
            for (let k = 0; k < S && !keep; k += 4) for (let q = 0; q < S && !keep; q += 4) { const x = x0 + q * step, z = z0 + k * step; const m = nearest(MAT, x, z); if (sampleG(H, x, z) > -2 || m === Mt.ice || WATER[clamp(Math.round(toI(z)), 0, N - 1) * N + clamp(Math.round(toI(x)), 0, N - 1)] > -9000) keep = true; }
            if (!keep) continue;
            const S2 = S * S, buf = Buffer.alloc(16 + S2 * 6);
            buf.write('EWLT', 0, 'ascii'); buf[4] = 1; buf[5] = 0; buf.writeUInt16LE(S, 6); buf.writeFloatLE(x0, 8); buf.writeFloatLE(z0, 12);
            for (let k = 0; k < S; k++) for (let q = 0; q < S; q++) {
                const x = x0 + q * step, z = z0 + k * step, o = k * S + q;
                buf.writeUInt16LE(encH(sampleG(H, x, z)), 16 + o * 2);
                buf[16 + S2 * 2 + o] = nearest(MAT, x, z);
                buf[16 + S2 * 3 + o] = nearest(FOREST, x, z);
                const w = nearest(WATER, x, z); buf.writeUInt16LE(w > -9000 ? encH(w) : 0xffff, 16 + S2 * 4 + o * 2);
            }
            const name = `tiles/t_${ti}_${tj}.bin`; fs.writeFileSync(path.join(outDir, name), buf); tiles.push([ti, tj]);
        }
        // the sea and the ice: the whole world at 8 m
        const n = Math.round(2 * EXT / 8), sea = Buffer.alloc(16 + n * n * 3);
        sea.write('EWLS', 0, 'ascii'); sea[4] = 1; sea[5] = 0; sea.writeUInt16LE(n, 6); sea.writeFloatLE(-EXT, 8); sea.writeFloatLE(8, 12);
        for (let k = 0; k < n; k++) for (let q = 0; q < n; q++) { const x = -EXT + (q + 0.5) * 8, z = -EXT + (k + 0.5) * 8, o = k * n + q; sea.writeUInt16LE(encH(sampleG(H, x, z)), 16 + o * 2); sea[16 + n * n * 2 + o] = nearest(MAT, x, z); }
        fs.writeFileSync(path.join(outDir, 'sea.bin'), sea);
    }
    // the map: shaded relief (materials × hillshade × height), contours every 25 m (100 m darker), 4 m a pixel
    let png = null;
    if (opts.map !== false) {
        const PX = 4, W = Math.round(2 * EXT / PX), rgb = Buffer.alloc(W * W * 3);
        const COL = { 0: [22, 58, 96], 1: [58, 118, 160], 2: [222, 204, 158], 3: [122, 158, 86], 4: [150, 180, 100], 5: [56, 98, 52], 6: [132, 124, 114], 7: [240, 243, 247], 8: [218, 182, 124],
            9: [180, 108, 72], 10: [230, 224, 208], 11: [176, 184, 104], 12: [150, 150, 154], 13: [70, 70, 74], 14: [150, 116, 78], 15: [70, 138, 186], 16: [52, 110, 160], 17: [226, 238, 246], 18: [212, 228, 238], 19: [150, 162, 138], 20: [186, 142, 102], 21: [112, 100, 92], 22: [128, 100, 70], 23: [168, 164, 156] };
        const sun = [-0.55, 0.62, -0.56]; const sl = Math.hypot(...sun); sun[0] /= sl; sun[1] /= sl; sun[2] /= sl;
        const hAt = new Float32Array(W * W); for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) hAt[j * W + i] = sampleG(H, -EXT + (i + 0.5) * PX, -EXT + (j + 0.5) * PX);
        for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
            const x = -EXT + (i + 0.5) * PX, z = -EXT + (j + 0.5) * PX, c = j * W + i; const m = nearest(MAT, x, z); let col = COL[m].slice(); const h = hAt[c];
            if (m === Mt.farm) { const q = (((Math.floor(x / 36) * 7 + Math.floor(z / 28) * 13) % 5) + 5) % 5; col = [[176, 184, 104], [196, 190, 110], [150, 168, 92], [206, 176, 108], [160, 176, 96]][q].slice(); }
            const water = m === Mt.deep || m === Mt.shallow || m === Mt.pack || m === Mt.river || m === Mt.lake;
            if (m === Mt.deep || m === Mt.shallow) { const t = clamp(-h / 160, 0, 1); col = [lerp(64, 12, t), lerp(130, 40, t), lerp(170, 86, t)]; }
            const i0 = Math.max(0, i - 1), i1 = Math.min(W - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(W - 1, j + 1);
            const hx = (hAt[j * W + i1] - hAt[j * W + i0]) / ((i1 - i0) * PX), hz = (hAt[j1 * W + i] - hAt[j0 * W + i]) / ((j1 - j0) * PX);
            let nx = -hx, ny = 1, nz = -hz; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
            const lit = clamp(nx * sun[0] + ny * sun[1] + nz * sun[2], 0, 1);
            let shade = water ? 0.92 + 0.08 * lit : 0.35 + 0.85 * lit;
            const ht = water ? 1 : 1 + clamp(h / 900, 0, 0.18);
            if (!water && h > 0.5 && i + 1 < W && j + 1 < W) {   // the contours
                const b0 = Math.floor(h / 25), br = Math.floor(hAt[c + 1] / 25), bd = Math.floor(hAt[c + W] / 25);
                if (b0 !== br || b0 !== bd) { const idx = Math.max(b0, br, bd) % 4 === 0; shade *= idx ? 0.72 : 0.86; }
            }
            const o = c * 3; rgb[o] = clamp(col[0] * shade * ht, 0, 255); rgb[o + 1] = clamp(col[1] * shade * ht, 0, 255); rgb[o + 2] = clamp(col[2] * shade * ht, 0, 255);
        }
        png = encodePng(W, W, rgb);
        fs.writeFileSync(path.join(outDir, 'land-map.png'), png);
        overlay.map = { file: 'land-map.png', px: PX, size: W, x0: -EXT, z0: -EXT };
    }
    overlay.tiles = tiles; overlay.tileFormat = { tile: TILE, samples: Math.round(TILE / CELL) + 1, heightBase: base, heightStep: 0.01, waterNone: 65535 };
    overlay.bake = { cell: CELL, ext: EXT };
    // the bake id: a hash of what the game fetches (the overlay and the map), so a re-bake is a new url
    const body = JSON.stringify(overlay);
    const id = crypto.createHash('sha256').update(body).update(png || Buffer.alloc(0)).digest('hex').slice(0, 10);
    overlay.bake.id = id;
    fs.writeFileSync(path.join(outDir, 'land.json'), JSON.stringify(overlay));
    files.json = fs.statSync(path.join(outDir, 'land.json')).size; files.png = png ? png.length : 0; files.tiles = tiles.length;
    return { id, files };
}
// stamps data.js HQ_LAND.baked.id with the bake's id (the game's urls carry it)
// (and, G2, `hubY` = HQ's baked pad height — left as it is when not given)
function stampData(id, dataFile, more) {
    const file = dataFile || path.join(REPO_ROOT, 'data.js');
    let src = fs.readFileSync(file, 'utf8');
    const re = /(R\.baked = \{ id: ')[0-9a-f]*(')/;
    if (!re.test(src)) throw new Error('data.js: HQ_LAND R.baked line not found');
    if (id) src = src.replace(re, `$1${id}$2`);
    if (more && isFinite(more.hubY)) src = src.replace(/(R\.baked = \{[^\n]*?hubY: )-?[0-9.]+/, `$1${(+more.hubY).toFixed(2).replace(/\.?0+$/, '')}`);
    fs.writeFileSync(file, src);
}

// ════════ CLI ══════════════════════════════════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
    const argv = process.argv.slice(2), flag = f => argv.includes(f), arg = (f, d) => { const k = argv.indexOf(f); return k >= 0 ? argv[k + 1] : d; };
    const cell = +arg('--cell', 0) || undefined, out = path.resolve(arg('--out', path.join(REPO_ROOT, 'Assets', 'Land')));
    const B = bake({ cell, quiet: flag('--quiet') });
    const breaches = checkRules(B);
    for (const [a, list] of Object.entries(B.overlay.sight)) if (!flag('--quiet')) console.log('  ' + a.padEnd(11), list.length ? list.join(' ') : '— nothing');
    breaches.forEach(b => console.log(`BREACH ${b.rule}: ${b.msg}`));
    const { id, files } = writeOutputs(B, out, { tiles: !flag('--no-tiles'), map: !flag('--no-map') });
    console.log(`wrote ${out}: land.json ${(files.json / 1024).toFixed(0)} KB, land-map.png ${(files.png / 1024).toFixed(0)} KB, ${files.tiles} tiles · bake id ${id}`);
    const hub = (B.overlay.places || []).find(p => p.id === 'hq'), hubY = hub && isFinite(+hub.y) ? +hub.y : undefined;
    if (!flag('--no-stamp') && !breaches.length) { stampData(id, null, { hubY }); console.log(`stamped data.js HQ_LAND.baked.id = '${id}', hubY ${hubY} (ship data.js with the ?v= bump; upload ${path.relative(REPO_ROOT, out) || out}/ to R2 Assets/Land/)`); }
    console.log(breaches.length ? `${breaches.length} breach(es): not stamped` : 'THE RULES HOLD: R2 from every pad, the named separations, rivers downhill and meeting the sea at its level, lakes level, road grades, the ring, every place on a route, cliffs drawn');
    process.exit(breaches.length ? 1 : 0);
}

module.exports = { bake, checkRules, edgeReach, writeOutputs, stampData, readRecipe, encodePng, MATS };
