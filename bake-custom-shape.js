#!/usr/bin/env node
// bake-custom-shape.js - THE CUSTOM SHAPES (2026-11-11): head / body shapes that are NOT MakeHuman targets, added to
// charactercreation/mpfb/mpfb_shapes.glb beside the ones bake-mpfb.py --shapes writes (docs/notes/character-creator.md "THE CUSTOM SHAPES").
//
//     node bake-custom-shape.js            # add / replace every charactercreation/mpfb/custom_shapes/*.json in mpfb_shapes.glb
//     node bake-custom-shape.js --list     # print the shapes the GLB holds now
//
// A custom shape file is { key, sign: '+' | '-', idx: [hm08 base index ...], off: [x, y, z, ...] } : sparse offsets in metres,
// glTF axes, one per base index (the same data mpfb_shapes.glb holds: POSITION = the offsets, _I = the base index, node extras
// ewShapes = [key, sign, start, count]). The first one is morganHead (a face likeness measured on mpfb_female).
// RE-RUN THIS AFTER `bake-mpfb.py --shapes`: that rebuilds the GLB from MakeHuman's targets and drops the custom ones.
// Repo-only tooling, no dependencies. Then bump the ?v= token and deploy as usual (RULE #1 / #1b).
'use strict';
const fs = require('fs'), path = require('path');
const GLB = path.join(__dirname, 'charactercreation', 'mpfb', 'mpfb_shapes.glb');
const DIR = path.join(__dirname, 'charactercreation', 'mpfb', 'custom_shapes');

function readGlb(file) {
  const raw = fs.readFileSync(file);
  if (raw.toString('ascii', 0, 4) !== 'glTF' || raw.readUInt32LE(4) !== 2) throw new Error('not a glTF 2 binary: ' + file);
  const jlen = raw.readUInt32LE(12);
  const json = JSON.parse(raw.toString('utf8', 20, 20 + jlen));
  const blen = raw.readUInt32LE(20 + jlen);
  return { json, bin: raw.subarray(20 + jlen + 8, 20 + jlen + 8 + blen) };
}

function main() {
  const { json, bin } = readGlb(GLB);
  const node = json.nodes.find(n => n.extras && n.extras.ewShapes);
  const prim = json.meshes[node.mesh].primitives[0];
  const aPos = json.accessors[prim.attributes.POSITION], aIdx = json.accessors[prim.attributes._I];
  const vPos = json.bufferViews[aPos.bufferView], vIdx = json.bufferViews[aIdx.bufferView];
  if (aPos.componentType !== 5126 || aIdx.componentType !== 5123 || vPos.byteStride || vIdx.byteStride) throw new Error('unexpected mpfb_shapes.glb layout');
  const total = aPos.count;
  const pos = new Float32Array(total * 3), idx = new Uint16Array(total);
  const p0 = (vPos.byteOffset || 0) + (aPos.byteOffset || 0), i0 = (vIdx.byteOffset || 0) + (aIdx.byteOffset || 0);
  for (let i = 0; i < total * 3; i++) pos[i] = bin.readFloatLE(p0 + i * 4);
  for (let i = 0; i < total; i++) idx[i] = bin.readUInt16LE(i0 + i * 2);
  let shapes = node.extras.ewShapes;
  if (process.argv.includes('--list')) {
    for (const s of shapes) console.log(s[0] + ' ' + s[1] + '  ' + s[3] + ' offsets');
    return;
  }
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort() : [];
  if (!files.length) { console.log('no custom shapes in ' + DIR); return; }
  const custom = files.map(f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
  for (const c of custom) {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(c.key) || (c.sign !== '+' && c.sign !== '-') || c.off.length !== c.idx.length * 3) throw new Error('bad custom shape: ' + c.key);
    if (c.idx.some(i => i < 0 || i > 65535 || i !== (i | 0))) throw new Error('base index out of range in ' + c.key);
  }
  const drop = new Set(custom.reduce((a, c) => a.concat([c.key + '+', c.key + '-']), []));
  const kept = shapes.filter(s => !drop.has(s[0] + s[1]));
  const n = kept.reduce((a, s) => a + s[3], 0) + custom.reduce((a, c) => a + c.idx.length, 0);
  const outPos = new Float32Array(n * 3), outIdx = new Uint16Array(n), outShapes = [];
  let at = 0;
  for (const s of kept) {
    outPos.set(pos.subarray(s[2] * 3, (s[2] + s[3]) * 3), at * 3); outIdx.set(idx.subarray(s[2], s[2] + s[3]), at);
    outShapes.push([s[0], s[1], at, s[3]]); at += s[3];
  }
  for (const c of custom) {
    outPos.set(Float32Array.from(c.off), at * 3); outIdx.set(Uint16Array.from(c.idx), at);
    outShapes.push([c.key, c.sign, at, c.idx.length]); at += c.idx.length;
    // every shape has both ends in ewShapes (a one-sided one carries an empty other end, like wolfHead)
    const other = c.sign === '+' ? '-' : '+';
    if (!custom.some(o => o.key === c.key && o.sign === other)) outShapes.push([c.key, other, at, 0]);
  }
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { const v = outPos[i * 3 + k]; if (v < min[k]) min[k] = v; if (v > max[k]) max[k] = v; }
  const pad4 = x => (x + 3) & ~3;
  const posBytes = n * 12, idxBytes = n * 2;
  const outBin = Buffer.alloc(pad4(posBytes) + pad4(idxBytes));
  Buffer.from(outPos.buffer).copy(outBin, 0);
  Buffer.from(outIdx.buffer).copy(outBin, pad4(posBytes));
  aPos.count = n; aPos.min = min; aPos.max = max; delete aPos.byteOffset;
  aIdx.count = n; delete aIdx.byteOffset;
  vPos.byteOffset = 0; vPos.byteLength = posBytes;
  vIdx.byteOffset = pad4(posBytes); vIdx.byteLength = idxBytes;
  json.buffers[0].byteLength = outBin.length;
  node.extras.ewShapes = outShapes;
  let jb = Buffer.from(JSON.stringify(json), 'utf8');
  if (jb.length % 4) jb = Buffer.concat([jb, Buffer.alloc(4 - (jb.length % 4), 0x20)]);
  const head = Buffer.alloc(12); head.write('glTF', 0, 'ascii'); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + jb.length + 8 + outBin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(jb.length, 0); jh.writeUInt32LE(0x4E4F534A, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(outBin.length, 0); bh.writeUInt32LE(0x004E4942, 4);
  fs.writeFileSync(GLB, Buffer.concat([head, jh, jb, bh, outBin]));
  console.log('mpfb_shapes.glb: ' + outShapes.length + ' shapes, ' + n + ' offsets (' + custom.map(c => c.key + c.sign + ' ' + c.idx.length).join(', ') + ' custom)');
}

main();
