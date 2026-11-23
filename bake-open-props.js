#!/usr/bin/env node
/* bake-open-props.js — THE OPEN DOORS (2026-11-23, building-interiors plan step 2 outside Disaster City; mondo: "I want every building to have
   an interior. If there is a door the player should be able to walk inside of it (very important for a game called DOOR HQ)").
   Repo-only dev tooling, never loaded by the game. A Meshy prop is one fused mesh: its door is painted on the wall. This cuts the door out:
   every triangle whose middle stands in a job's box (the GLB's own coordinates, y up, +z = the side the catalogue calls the front) and
   that faces sideways (|normal.y| < 0.7, so a floor or a lintel's underside stays) is dropped from the index list. Nothing else changes:
   the vertices, the UVs and the texture bytes are the file's own (mondo: never rebake or repaint his textures), so the box the game fits
   the model by stays the same and `<key>_open` stands exactly where `<key>` stood. data.js HQ_WALK_IN_PROPS lays the walker's walls, the
   doorway, the swinging leaf, an inside lining and the furniture.

       node bake-open-props.js --in <dir with the source GLBs> --out <dir> [--only key,key]

   Out: `<out>/<file>_open.glb` per job, for R2 next to the source (Assets/world/props/meshy/...). Notes: docs/notes/areas-complexes.md
   "THE OPEN DOORS". */
'use strict';
const fs = require('fs'), path = require('path');
const ARGS = process.argv.slice(2), opt = (n, d) => { const i = ARGS.indexOf(n); return i >= 0 ? ARGS[i + 1] : d; };
const IN = opt('--in', '.'), OUT = opt('--out', '.'), ONLY = new Set((opt('--only', '') || '').split(',').filter(Boolean));
/* key: the catalogue key, src: the GLB file, cuts: [x0, x1, y0, y1, z0, z1] boxes in the file's own units (its node translations applied) */
const JOBS = [
    { key: 'outhouse', src: 'outhouse.glb', cuts: [[-0.17, 0.17, 0.035, 0.70, 0.15, 0.5]] },                        // the plank door with the moon
    { key: 'woods_cabin', src: 'woods_cabin.glb', cuts: [[0.015, 0.195, 0.012, 0.305, 0.05, 0.5]] },                 // the boarded door right of the middle
    { key: 'babel_house_small', src: 'meshy_babel_house_small.glb', cuts: [[-0.092, 0.092, -0.245, 0.045, 0.1, 0.4]] },
    { key: 'babel_house_row', src: 'meshy_babel_house_row.glb', cuts: [[-0.237, -0.148, -0.135, 0.012, 0.05, 0.25], [0.148, 0.237, -0.135, 0.012, 0.05, 0.25]] },   // two houses, two doors, one long room
    { key: 'babel_house_stair', src: 'meshy_babel_house_stair.glb', cuts: [[0.3, 0.5, -0.445, -0.125, 0.015, 0.145]] },   // the ground door on the +x side (the stair's door up is the roof's, left painted)
    { key: 'babel_house_yard', src: 'meshy_babel_house_yard.glb', cuts: [[-0.077, 0.077, -0.205, 0.02, 0.3, 0.5], [-0.08, 0.08, -0.205, 0.03, -0.06, 0.06]] },   // the yard gate, then the house's door off the yard
];

function readGlb(buf) {
    const jl = buf.readUInt32LE(12), json = JSON.parse(buf.slice(20, 20 + jl).toString('utf8'));
    const bo = 20 + jl, bl = buf.readUInt32LE(bo), bin = buf.slice(bo + 8, bo + 8 + bl);
    return { json, bin };
}
function writeGlb(json, bin) {
    const pad = (b, c) => { const n = (4 - (b.length % 4)) % 4; return n ? Buffer.concat([b, Buffer.alloc(n, c)]) : b; };
    const jb = pad(Buffer.from(JSON.stringify(json), 'utf8'), 0x20), bb = pad(bin, 0);
    const h = Buffer.alloc(12); h.writeUInt32LE(0x46546C67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(12 + 8 + jb.length + 8 + bb.length, 8);
    const jh = Buffer.alloc(8); jh.writeUInt32LE(jb.length, 0); jh.writeUInt32LE(0x4E4F534A, 4);
    const bh = Buffer.alloc(8); bh.writeUInt32LE(bb.length, 0); bh.writeUInt32LE(0x004E4942, 4);
    return Buffer.concat([h, jh, jb, bh, bb]);
}
function accessor(json, bin, i) {
    const a = json.accessors[i], v = json.bufferViews[a.bufferView], n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
    const off = (v.byteOffset || 0) + (a.byteOffset || 0), stride = v.byteStride || 0;
    const T = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType];
    const es = T.BYTES_PER_ELEMENT, out = new (a.componentType === 5126 ? Float32Array : Uint32Array)(a.count * n);
    for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) {
        const p = off + (stride ? k * stride : k * n * es) + c * es;
        out[k * n + c] = a.componentType === 5126 ? bin.readFloatLE(p) : a.componentType === 5125 ? bin.readUInt32LE(p) : a.componentType === 5123 ? bin.readUInt16LE(p) : bin.readUInt8(p);
    }
    return out;
}
/* the translation from the scene's roots down to the mesh node (these Meshy files carry translations only; a full matrix's translation is read too) */
function meshOffsets(json) {
    const out = {}, walk = (ni, t) => { const n = json.nodes[ni], m = n.matrix, tr = n.translation || (m ? [m[12], m[13], m[14]] : [0, 0, 0]);
        if (n.rotation && Math.abs(n.rotation[3]) < 0.9999) throw new Error('node ' + ni + ' is rotated: not handled');
        const t2 = [t[0] + tr[0], t[1] + tr[1], t[2] + tr[2]]; if (n.mesh != null) out[n.mesh] = t2; (n.children || []).forEach(c => walk(c, t2)); };
    const roots = (json.scenes && json.scenes[json.scene || 0] && json.scenes[json.scene || 0].nodes) || json.nodes.map((_, i) => i).filter(i => !json.nodes.some(n => (n.children || []).includes(i)));
    roots.forEach(r => walk(r, [0, 0, 0]));
    return out;
}
function run(job) {
    const src = path.join(IN, job.src), { json, bin } = readGlb(fs.readFileSync(src)), offs = meshOffsets(json);
    let extra = [], binLen = bin.length, dropped = 0, kept = 0;
    json.meshes.forEach((m, mi) => m.primitives.forEach(pr => {
        const t = offs[mi] || [0, 0, 0], P = accessor(json, bin, pr.attributes.POSITION), N = pr.attributes.NORMAL != null ? accessor(json, bin, pr.attributes.NORMAL) : null, I = accessor(json, bin, pr.indices);
        const keep = [];
        for (let f = 0; f < I.length; f += 3) {
            const a = I[f], b = I[f + 1], c = I[f + 2];
            const cx = (P[a * 3] + P[b * 3] + P[c * 3]) / 3 + t[0], cy = (P[a * 3 + 1] + P[b * 3 + 1] + P[c * 3 + 1]) / 3 + t[1], cz = (P[a * 3 + 2] + P[b * 3 + 2] + P[c * 3 + 2]) / 3 + t[2];
            let ny;
            if (N) ny = Math.abs((N[a * 3 + 1] + N[b * 3 + 1] + N[c * 3 + 1]) / 3);
            else { const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2], vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
                const nx = uy * vz - uz * vy, nyy = uz * vx - ux * vz, nz = ux * vy - uy * vx; ny = Math.abs(nyy) / (Math.hypot(nx, nyy, nz) || 1); }
            const cut = ny < 0.7 && job.cuts.some(B => cx >= B[0] && cx <= B[1] && cy >= B[2] && cy <= B[3] && cz >= B[4] && cz <= B[5]);
            if (cut) dropped++; else { keep.push(a, b, c); kept++; }
        }
        const ib = Buffer.alloc(keep.length * 4); keep.forEach((v, k) => ib.writeUInt32LE(v, k * 4));
        const off = binLen + extra.reduce((s, e) => s + e.length, 0), padN = (4 - (off % 4)) % 4; if (padN) extra.push(Buffer.alloc(padN));
        const at = binLen + extra.reduce((s, e) => s + e.length, 0); extra.push(ib);
        json.bufferViews.push({ buffer: 0, byteOffset: at, byteLength: ib.length, target: 34963 });
        json.accessors.push({ bufferView: json.bufferViews.length - 1, componentType: 5125, count: keep.length, type: 'SCALAR' });
        pr.indices = json.accessors.length - 1;
    }));
    const nbin = Buffer.concat([bin].concat(extra)); json.buffers[0].byteLength = nbin.length;
    const out = path.join(OUT, job.src.replace(/\.glb$/, '_open.glb'));
    fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(out, writeGlb(json, nbin));
    console.log('OPEN', job.key, '->', out, 'dropped', dropped, 'kept', kept);
}
JOBS.filter(j => !ONLY.size || ONLY.has(j.key)).forEach(run);
