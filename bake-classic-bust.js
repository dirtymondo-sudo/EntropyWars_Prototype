#!/usr/bin/env node
// bake-classic-bust.js — THE CLASSIC BUST (2026-11-01, mondo: "for the classic female, it makes her bust pointy and unrealistic,
// where as the mpfb classic female the bust slider works as intended and they look natural at 100").
//
// The classic FEMALE base (charactercreation/Meshy_AI_human_body_base_mesh_female_rigged.glb) is not MakeHuman's hm08 mesh, so
// the Bust slider had no MakeHuman target on it and three-renderer.js pushed two Gaussian lobes out of the chest (pointy). The
// MPFB CLASSIC FEMALE (bake-mpfb-classic.py) IS that same body shape (MPFB reshaped onto it, ~1 mm) and carries MakeHuman's own
// breast targets (mpfb_shapes.glb 'bust', by _BASE_INDEX). This tool carries those offsets across: every classic vertex takes
// the bust +/- offset of the nearest point on the MPFB classic female's skin (closest triangle, barycentric blend of its three
// corners), so the classic female at 100 is shaped exactly like the MPFB classic female at 100.
//
// Writes charactercreation/mpfb/mpfb_classic_bust.glb in mpfb_shapes.glb's layout: POSITION = the offsets (metres, float VEC3),
// _I = the classic base's vertex index (uint16), node extras.ewShapes = [['bust', '+' | '-', first, count], ...] and
// extras.ewBase = { count, probe: [vertex, x, y, z] } — the runtime applies the table only to a mesh with that vertex count and
// that vertex at that place (the classic female base; never the male one).
//
//   node bake-classic-bust.js            (reads + writes under charactercreation/)
'use strict';
const fs = require('fs');
const path = require('path');
const CC = path.join(__dirname, 'charactercreation');

function readGlb(file) {
    const b = fs.readFileSync(file);
    const jl = b.readUInt32LE(12), js = JSON.parse(b.slice(20, 20 + jl).toString());
    const bin = b.slice(20 + jl + 8);
    const N = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
    const C = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array };
    const acc = (i) => {
        const a = js.accessors[i], v = js.bufferViews[a.bufferView], n = N[a.type], T = C[a.componentType];
        const off = bin.byteOffset + (v.byteOffset || 0) + (a.byteOffset || 0), el = T.BYTES_PER_ELEMENT;
        if (v.byteStride && v.byteStride !== n * el) throw new Error('strided accessor not handled');
        return new T(bin.buffer.slice(off, off + a.count * n * el));
    };
    return { js, acc };
}
function bodyMesh(g) {   // the first mesh's first primitive: positions, indices, attributes
    const p = g.js.meshes[0].primitives[0];
    return { P: g.acc(p.attributes.POSITION), I: g.acc(p.indices), A: p.attributes, g };
}

const classic = bodyMesh(readGlb(path.join(CC, 'Meshy_AI_human_body_base_mesh_female_rigged.glb')));
const mc = bodyMesh(readGlb(path.join(CC, 'mpfb', 'mpfb_classic_female.glb')));
const shapes = readGlb(path.join(CC, 'mpfb', 'mpfb_shapes.glb'));
const SK = shapes.js.nodes[0].extras.ewShapes, SD = shapes.acc(0), SI = shapes.acc(1);
const BI = mc.g.acc(mc.A._BASE_INDEX);
const NC = classic.P.length / 3, NM = mc.P.length / 3;

// the bust offsets per MPFB-classic vertex (by its hm08 base index), + and -
const sides = ['+', '-'].map((sd) => {
    const K = SK.find((k) => k[0] === 'bust' && k[1] === sd), byBase = new Map();
    for (let i = K[2]; i < K[2] + K[3]; i++) byBase.set(SI[i], [SD[i * 3], SD[i * 3 + 1], SD[i * 3 + 2]]);
    const D = new Float32Array(NM * 3);
    for (let v = 0; v < NM; v++) { const d = byBase.get(Math.round(BI[v])); if (d) { D[v * 3] = d[0]; D[v * 3 + 1] = d[1]; D[v * 3 + 2] = d[2]; } }
    return D;
});

// the MPFB classic female's triangles that move with the bust (any corner with an offset), binned in a 2 cm grid
const CELL = 0.02, grid = new Map(), key = (x, y, z) => x + ',' + y + ',' + z;
const moving = (v) => sides.some((D) => D[v * 3] || D[v * 3 + 1] || D[v * 3 + 2]);
const tris = [];
for (let t = 0; t < mc.I.length; t += 3) {
    const a = mc.I[t], b = mc.I[t + 1], c = mc.I[t + 2];
    if (!moving(a) && !moving(b) && !moving(c)) continue;
    const id = tris.length / 3; tris.push(a, b, c);
    let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const v of [a, b, c]) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], mc.P[v * 3 + k]); hi[k] = Math.max(hi[k], mc.P[v * 3 + k]); }
    for (let x = Math.floor(lo[0] / CELL); x <= Math.floor(hi[0] / CELL); x++)
        for (let y = Math.floor(lo[1] / CELL); y <= Math.floor(hi[1] / CELL); y++)
            for (let z = Math.floor(lo[2] / CELL); z <= Math.floor(hi[2] / CELL); z++) {
                const kk = key(x, y, z); let l = grid.get(kk); if (!l) grid.set(kk, l = []); l.push(id);
            }
}
// closest point on a triangle -> barycentric (Ericson, Real-Time Collision Detection 5.1.5)
function closest(p, a, b, c) {
    const sub = (u, v) => [u[0] - v[0], u[1] - v[1], u[2] - v[2]], dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a);
    const d1 = dot(ab, ap), d2 = dot(ac, ap); if (d1 <= 0 && d2 <= 0) return [1, 0, 0];
    const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp); if (d3 >= 0 && d4 <= d3) return [0, 1, 0];
    const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return [1 - v, v, 0]; }
    const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp); if (d6 >= 0 && d5 <= d6) return [0, 0, 1];
    const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return [1 - w, 0, w]; }
    const va = d3 * d6 - d5 * d4; if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return [0, 1 - w, w]; }
    const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; return [1 - v - w, v, w];
}
const MAXD = 0.012;   // a classic vertex farther than 12 mm from the MPFB skin's moving part takes nothing (the arms, the back)
const out = { '+': [], '-': [] };
let hits = 0, worst = 0;
for (let i = 0; i < NC; i++) {
    const p = [classic.P[i * 3], classic.P[i * 3 + 1], classic.P[i * 3 + 2]];
    const cx = Math.floor(p[0] / CELL), cy = Math.floor(p[1] / CELL), cz = Math.floor(p[2] / CELL);
    let best = null, bd = MAXD * MAXD;
    const seen = new Set();
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) for (let z = cz - 1; z <= cz + 1; z++) {
        const l = grid.get(key(x, y, z)); if (!l) continue;
        for (const id of l) {
            if (seen.has(id)) continue; seen.add(id);
            const vs = [tris[id * 3], tris[id * 3 + 1], tris[id * 3 + 2]], V = vs.map((v) => [mc.P[v * 3], mc.P[v * 3 + 1], mc.P[v * 3 + 2]]);
            const w = closest(p, V[0], V[1], V[2]);
            const q = [0, 1, 2].map((k) => w[0] * V[0][k] + w[1] * V[1][k] + w[2] * V[2][k]);
            const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 + (q[2] - p[2]) ** 2;
            if (d < bd) { bd = d; best = { vs, w }; }
        }
    }
    if (!best) continue;
    hits++;
    { const dd = Math.sqrt(bd), D0 = sides[0], o0 = Math.hypot(...[0, 1, 2].map((k) => best.w[0] * D0[best.vs[0] * 3 + k] + best.w[1] * D0[best.vs[1] * 3 + k] + best.w[2] * D0[best.vs[2] * 3 + k])); if (o0 > 0.002) worst = Math.max(worst, dd); }
    sides.forEach((D, s) => {
        const o = [0, 1, 2].map((k) => best.w[0] * D[best.vs[0] * 3 + k] + best.w[1] * D[best.vs[1] * 3 + k] + best.w[2] * D[best.vs[2] * 3 + k]);
        if (Math.hypot(o[0], o[1], o[2]) > 1e-5) out['+-'[s]].push([i, o]);
    });
}

// write the GLB (the mpfb_shapes.glb layout)
const keys = [], D = [], I = [];
for (const sd of ['+', '-']) { keys.push(['bust', sd, I.length, out[sd].length]); out[sd].forEach(([i, o]) => { I.push(i); D.push(o); }); }
if (NC > 65535) throw new Error('the classic base has more vertices than a uint16 index holds');
const Df = new Float32Array(D.flat()), If = new Uint16Array(I);
const probeV = 0, probe = [probeV, classic.P[0], classic.P[1], classic.P[2]];
const chunks = [], views = [];
const add = (buf) => { const b = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength); views.push({ buffer: 0, byteOffset: chunks.reduce((s, c) => s + c.length, 0), byteLength: b.length }); chunks.push(Buffer.concat([b, Buffer.alloc((4 - b.length % 4) % 4)])); return views.length - 1; };
const mn = [0, 1, 2].map((k) => Math.min(...D.map((d) => d[k]))), mx = [0, 1, 2].map((k) => Math.max(...D.map((d) => d[k])));
const gl = {
    asset: { version: '2.0', generator: 'bake-classic-bust.js' }, scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ name: 'mpfb_classic_bust', mesh: 0, extras: { ewShapes: keys, ewBase: { count: NC, probe } } }],
    meshes: [{ name: 'mpfb_classic_bust', primitives: [{ attributes: { POSITION: 0, _I: 1 }, mode: 0 }] }],
    accessors: [{ bufferView: add(Df), componentType: 5126, count: D.length, type: 'VEC3', min: mn, max: mx },
        { bufferView: add(If), componentType: 5123, count: I.length, type: 'SCALAR' }],
    bufferViews: views
};
const binb = Buffer.concat(chunks); gl.buffers = [{ byteLength: binb.length }];
let js = Buffer.from(JSON.stringify(gl)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
const head = Buffer.alloc(12); head.writeUInt32LE(0x46546C67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + binb.length, 8);
const ch = (len, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.writeUInt32LE(type, 4); return b; };
const OUT = path.join(CC, 'mpfb', 'mpfb_classic_bust.glb');
fs.writeFileSync(OUT, Buffer.concat([head, ch(js.length, 0x4E4F534A), js, ch(binb.length, 0x004E4942), binb]));
console.log('[bake-classic-bust] %d classic vertices on the MPFB skin (the farthest one moving > 2 mm: %s mm off), + %d / - %d offsets -> %s (%d KB)',
    hits, (worst * 1000).toFixed(1), out['+'].length, out['-'].length, path.relative(__dirname, OUT), Math.round(fs.statSync(OUT).size / 1024));
