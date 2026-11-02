#!/usr/bin/env node
// bake-classic-fit.js — THE CLASSIC FIT (2026-11-02, mondo picked "Fit the new clothes to them" for the classic MALE / FEMALE
// bodies, when the classic coded clothes were retired for the pack + Blender ones).
//
// The classic bases (charactercreation/Meshy_AI_human_body_base_mesh_<g>_rigged.glb) are not MakeHuman's hm08 mesh, so the pack
// clothes and the Blender clothes (fitted on the MPFB bodies) never went on them. The MPFB CLASSIC bodies (bake-mpfb-classic.py)
// ARE that same body shape below the neck (MPFB reshaped onto it, ~1 mm, in the same metres / same frame), and already wear every
// garment through _FIT_D (the reshape offset from the MPFB body they came from: ewFit.from). This tool writes the slim part of
// that the classic base needs: per MPFB-classic vertex its fit base (the MPFB body's position = classic - _FIT_D) and _FIT_D, and
// per vertex its hm08 _BASE_INDEX (the skin a garment hides). three-renderer.js puts a garment on a classic base the way it puts
// one on an MPFB classic body (buildWear: the 'from' body's fit + the nearest vertex's reshape offset); the classic base's own
// skin vertices take the base index of the nearest MPFB-classic vertex (the hide lists).
//
// Writes charactercreation/mpfb/mpfb_classic_fit_<male|female>.glb: one point primitive, POSITION = the fit base (float VEC3),
// _FIT_D (float VEC3), _BASE_INDEX (float SCALAR); node extras.ewFit = { from, base: { count, probe: [vertex, x, y, z] } } — the
// runtime uses it only on a classic base with that vertex count and that vertex at that place.
//
//   node bake-classic-fit.js            (reads + writes under charactercreation/)
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

for (const g of ['male', 'female']) {
    const base = readGlb(path.join(CC, 'Meshy_AI_human_body_base_mesh_' + g + '_rigged.glb'));
    const BP = base.acc(base.js.meshes[0].primitives[0].attributes.POSITION);
    const mc = readGlb(path.join(CC, 'mpfb', 'mpfb_classic_' + g + '.glb'));
    const pr = mc.js.meshes[0].primitives[0], from = mc.js.meshes[0].extras.ewFit.from;
    const P = mc.acc(pr.attributes.POSITION), FD = mc.acc(pr.attributes._FIT_D), BI = mc.acc(pr.attributes._BASE_INDEX);
    const NM = P.length / 3, NC = BP.length / 3;
    const F = new Float32Array(NM * 3);
    for (let i = 0; i < F.length; i++) F[i] = P[i] - FD[i];
    // (how far the classic base's skin is from the MPFB classic one below the neck: the fit only holds where they meet)
    let far = 0, n = 0;
    { const CELL = 0.03, grid = new Map(), key = (x, y, z) => x + ',' + y + ',' + z;
      for (let v = 0; v < NM; v++) { const k = key(Math.floor(P[v * 3] / CELL), Math.floor(P[v * 3 + 1] / CELL), Math.floor(P[v * 3 + 2] / CELL)); (grid.get(k) || grid.set(k, []).get(k)).push(v); }
      for (let i = 0; i < NC; i++) {
          if (BP[i * 3 + 1] > 1.45) continue;
          const cx = Math.floor(BP[i * 3] / CELL), cy = Math.floor(BP[i * 3 + 1] / CELL), cz = Math.floor(BP[i * 3 + 2] / CELL); let bd = 1e9;
          for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) for (const v of grid.get(key(cx + a, cy + b, cz + c)) || []) {
              const d = (P[v * 3] - BP[i * 3]) ** 2 + (P[v * 3 + 1] - BP[i * 3 + 1]) ** 2 + (P[v * 3 + 2] - BP[i * 3 + 2]) ** 2; if (d < bd) bd = d; }
          if (bd < 1e9) { far = Math.max(far, Math.sqrt(bd)); n++; }
      } }
    const probe = [0, BP[0], BP[1], BP[2]];
    const chunks = [], views = [];
    const add = (buf) => { const b = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength); views.push({ buffer: 0, byteOffset: chunks.reduce((s, c) => s + c.length, 0), byteLength: b.length }); chunks.push(Buffer.concat([b, Buffer.alloc((4 - b.length % 4) % 4)])); return views.length - 1; };
    const mn = [0, 1, 2].map((k) => { let m = Infinity; for (let v = 0; v < NM; v++) m = Math.min(m, F[v * 3 + k]); return m; });
    const mx = [0, 1, 2].map((k) => { let m = -Infinity; for (let v = 0; v < NM; v++) m = Math.max(m, F[v * 3 + k]); return m; });
    const gl = {
        asset: { version: '2.0', generator: 'bake-classic-fit.js' }, scene: 0, scenes: [{ nodes: [0] }],
        nodes: [{ name: 'mpfb_classic_fit_' + g, mesh: 0, extras: { ewFit: { from, base: { count: NC, probe } } } }],
        meshes: [{ name: 'mpfb_classic_fit_' + g, primitives: [{ attributes: { POSITION: 0, _FIT_D: 1, _BASE_INDEX: 2 }, mode: 0 }] }],
        accessors: [{ bufferView: add(F), componentType: 5126, count: NM, type: 'VEC3', min: mn, max: mx },
            { bufferView: add(FD), componentType: 5126, count: NM, type: 'VEC3' },
            { bufferView: add(BI), componentType: 5126, count: NM, type: 'SCALAR' }],
        bufferViews: views
    };
    const binb = Buffer.concat(chunks); gl.buffers = [{ byteLength: binb.length }];
    let js = Buffer.from(JSON.stringify(gl)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
    const head = Buffer.alloc(12); head.writeUInt32LE(0x46546C67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + binb.length, 8);
    const ch = (len, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.writeUInt32LE(type, 4); return b; };
    const OUT = path.join(CC, 'mpfb', 'mpfb_classic_fit_' + g + '.glb');
    fs.writeFileSync(OUT, Buffer.concat([head, ch(js.length, 0x4E4F534A), js, ch(binb.length, 0x004E4942), binb]));
    console.log('[bake-classic-fit] %s: %d MPFB-classic vertices (from %s), classic base %d vertices (below the neck the farthest is %s mm from the MPFB classic skin) -> %s (%d KB)',
        g, NM, from, NC, (far * 1000).toFixed(1), path.relative(__dirname, OUT), Math.round(fs.statSync(OUT).size / 1024));
}
