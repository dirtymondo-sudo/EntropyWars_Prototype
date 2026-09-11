#!/usr/bin/env node
/* character-rig.js — CHARACTER CREATOR asset tooling (repo-only, 2026-09-11).
   Zero dependencies (Node 22). Reads / writes GLB directly.

   The 2026-09-11 base meshes in charactercreation/ (Meshy "low_poly_unwrapped",
   ~30k tris, UV-unwrapped, NO skeleton) replace the 2026-09-10 rigged Meshy
   exports (14.5k tris, 24-joint Hips…Head rig, no UVs worth painting on). The
   game animates units through that 24-joint rig (three-renderer.js retargets
   the shared animation libraries onto it), so an unrigged mesh cannot ship as
   is. This tool:

   1. `bodies`  — rigs each new base mesh by TRANSFERRING the old donor's skin
      weights onto it: both are the same Meshy human base body in the same
      A-pose (verified by overlay render), so every new vertex takes the bone
      weights of the nearest point on the donor's surface (barycentric blend,
      two smoothing passes, top-4 normalised). The output GLB carries the
      DONOR's node tree, skin and animation verbatim and the NEW geometry
      (POSITION / NORMAL / TEXCOORD_0 / JOINTS_0 / WEIGHTS_0) in the donor's
      metre-scale bind frame → the renderer treats it exactly like the old
      rigged export. Output: charactercreation/Meshy_AI_human_body_base_mesh_
      <gender>_rigged.glb (upload to R2 Assets/Models/charactercreation/).

   2. `hair`    — splits charactercreation/hair-pack-part-1/source/HairPackPT1.glb
      (15.9 MB, 14 styles, each on its own physics armature) into ONE static GLB
      per style with its own diffuse + normal textures embedded, rest-pose
      skinned, re-centred on the style's SCALP cap (the head it was modelled
      for; its bounds ride in `asset.extras.ewHair`). Output:
      charactercreation/hair/hairNNN.glb (upload to R2 …/charactercreation/hair/).
      A future hair-pack-part-2 goes through the same command.

   Usage:  node character-rig.js            # both
           node character-rig.js bodies
           node character-rig.js hair [pack.glb] [outDir]
   Any new UNRIGGED human base (a child body, a muscular variant…) rigs the same
   way: node character-rig.js body <donor.glb> <target.glb> <out.glb>            */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = __dirname;
const CC = path.join(REPO, 'charactercreation');
const DONOR = g => path.join(REPO, 'rigged_animations', 'Meshy_AI_human_body_base_mesh_' + g + '_biped_Character_output.glb');
const TARGET = g => path.join(CC, 'Meshy_AI_human_body_base_mesh_' + g + '.glb');
const RIGGED = g => path.join(CC, 'Meshy_AI_human_body_base_mesh_' + g + '_rigged.glb');
const HAIR_PACK = path.join(CC, 'hair-pack-part-1', 'source', 'HairPackPT1.glb');
const HAIR_OUT = path.join(CC, 'hair');

/* ───────────────────────── GLB read / write ───────────────────────── */
const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

function readGlb(file) {
    const buf = fs.readFileSync(file);
    if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB: ' + file);
    const jsonLen = buf.readUInt32LE(12);
    const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
    let off = 20 + jsonLen, bin = Buffer.alloc(0);
    if (off < buf.length) {
        const binLen = buf.readUInt32LE(off);
        bin = buf.slice(off + 8, off + 8 + binLen);
    }
    return { json, bin };
}

/* Typed-array view of an accessor's data, de-interleaved into a tight copy. */
function readAccessor(glb, idx) {
    const a = glb.json.accessors[idx];
    const T = CT[a.componentType], n = NC[a.type];
    const out = new T(a.count * n);
    if (a.bufferView == null) return out;                // all-zero sparse-less accessor
    const bv = glb.json.bufferViews[a.bufferView];
    const base = glb.bin.byteOffset + (bv.byteOffset || 0) + (a.byteOffset || 0);
    const elem = T.BYTES_PER_ELEMENT;
    const stride = bv.byteStride || n * elem;
    if (stride === n * elem) {
        out.set(new T(glb.bin.buffer, base, a.count * n));
    } else {
        for (let i = 0; i < a.count; i++) {
            const v = new T(glb.bin.buffer, base + i * stride, n);
            for (let j = 0; j < n; j++) out[i * n + j] = v[j];
        }
    }
    return out;
}

class GlbBuilder {
    constructor() { this.json = { asset: { version: '2.0', generator: 'entropy-wars character-rig.js' }, buffers: [{ byteLength: 0 }], bufferViews: [], accessors: [] }; this.chunks = []; this.len = 0; }
    pushBytes(bytes, target) {
        const b = Buffer.from(bytes.buffer ? bytes.buffer : bytes, bytes.byteOffset || 0, bytes.byteLength);
        const bv = { buffer: 0, byteOffset: this.len, byteLength: b.byteLength };
        if (target) bv.target = target;
        this.json.bufferViews.push(bv);
        this.chunks.push(b);
        this.len += b.byteLength;
        const pad = (4 - (this.len % 4)) % 4;
        if (pad) { this.chunks.push(Buffer.alloc(pad)); this.len += pad; }
        return this.json.bufferViews.length - 1;
    }
    accessor(arr, type, componentType, opts) {
        const n = NC[type];
        const bvIdx = this.pushBytes(arr, opts && opts.target);
        const acc = { bufferView: bvIdx, componentType, count: arr.length / n, type };
        if (opts && opts.minmax) {
            const mn = new Array(n).fill(Infinity), mx = new Array(n).fill(-Infinity);
            for (let i = 0; i < arr.length; i++) { const k = i % n; if (arr[i] < mn[k]) mn[k] = arr[i]; if (arr[i] > mx[k]) mx[k] = arr[i]; }
            acc.min = mn; acc.max = mx;
        }
        if (opts && opts.normalized) acc.normalized = true;
        this.json.accessors.push(acc);
        return this.json.accessors.length - 1;
    }
    /* Copy an accessor from another GLB byte-for-byte (tight), keeping min/max. */
    copyAccessor(src, idx) {
        const a = src.json.accessors[idx];
        const data = readAccessor(src, idx);
        const out = this.accessor(data, a.type, a.componentType, {});
        if (a.min) this.json.accessors[out].min = a.min;
        if (a.max) this.json.accessors[out].max = a.max;
        if (a.normalized) this.json.accessors[out].normalized = true;
        return out;
    }
    write(file) {
        this.json.buffers[0].byteLength = this.len;
        let jsonBuf = Buffer.from(JSON.stringify(this.json), 'utf8');
        const jpad = (4 - (jsonBuf.length % 4)) % 4;
        if (jpad) jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jpad, 0x20)]);
        const bin = Buffer.concat(this.chunks);
        const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
        header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + bin.length, 8);
        const jh = Buffer.alloc(8); jh.writeUInt32LE(jsonBuf.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
        const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, Buffer.concat([header, jh, jsonBuf, bh, bin]));
        return 12 + 8 + jsonBuf.length + 8 + bin.length;
    }
}

/* ───────────────────────── small linear algebra ───────────────────────── */
function quatRot(q, v) {
    const [x, y, z, w] = q, [vx, vy, vz] = v;
    const ix = w * vx + y * vz - z * vy, iy = w * vy + z * vx - x * vz, iz = w * vz + x * vy - y * vx, iw = -x * vx - y * vy - z * vz;
    return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x];
}
function m4mul(a, b) { const o = new Array(16).fill(0); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; }
function nodeLocal(n) {
    if (n.matrix) return n.matrix.slice();
    const t = n.translation || [0, 0, 0], r = n.rotation || [0, 0, 0, 1], s = n.scale || [1, 1, 1];
    const [x, y, z, w] = r, xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
    return [(1 - 2 * (yy + zz)) * s[0], 2 * (xy + wz) * s[0], 2 * (xz - wy) * s[0], 0,
            2 * (xy - wz) * s[1], (1 - 2 * (xx + zz)) * s[1], 2 * (yz + wx) * s[1], 0,
            2 * (xz + wy) * s[2], 2 * (yz - wx) * s[2], (1 - 2 * (xx + yy)) * s[2], 0,
            t[0], t[1], t[2], 1];
}
function worldMatrices(json) {
    const parent = {};
    (json.nodes || []).forEach((n, i) => (n.children || []).forEach(c => { parent[c] = i; }));
    const cache = {};
    function world(i) {
        if (cache[i]) return cache[i];
        const l = nodeLocal(json.nodes[i]);
        return (cache[i] = parent[i] != null ? m4mul(world(parent[i]), l) : l);
    }
    (json.nodes || []).forEach((_, i) => world(i));
    return { world, parent };
}
function xformP(m, p) { return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]]; }
function xformN(m, n) { const v = [m[0] * n[0] + m[4] * n[1] + m[8] * n[2], m[1] * n[0] + m[5] * n[1] + m[9] * n[2], m[2] * n[0] + m[6] * n[1] + m[10] * n[2]]; const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

/* Closest point on triangle abc to p (Ericson, Real-Time Collision Detection 5.1.5) → {p, bary}. */
function closestOnTriangle(p, a, b, c) {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
    const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const d1 = dot(ab, ap), d2 = dot(ac, ap);
    if (d1 <= 0 && d2 <= 0) return { p: a, bary: [1, 0, 0] };
    const bp = [p[0] - b[0], p[1] - b[1], p[2] - b[2]], d3 = dot(ab, bp), d4 = dot(ac, bp);
    if (d3 >= 0 && d4 <= d3) return { p: b, bary: [0, 1, 0] };
    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return { p: [a[0] + ab[0] * v, a[1] + ab[1] * v, a[2] + ab[2] * v], bary: [1 - v, v, 0] }; }
    const cp = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], d5 = dot(ab, cp), d6 = dot(ac, cp);
    if (d6 >= 0 && d5 <= d6) return { p: c, bary: [0, 0, 1] };
    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return { p: [a[0] + ac[0] * w, a[1] + ac[1] * w, a[2] + ac[2] * w], bary: [1 - w, 0, w] }; }
    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return { p: [b[0] + (c[0] - b[0]) * w, b[1] + (c[1] - b[1]) * w, b[2] + (c[2] - b[2]) * w], bary: [0, 1 - w, w] }; }
    const denom = 1 / (va + vb + vc), v = vb * denom, w = vc * denom;
    return { p: [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w], bary: [1 - v - w, v, w] };
}

/* ───────────────────────── 1. BODIES: weight transfer ───────────────────────── */
function firstMeshNode(json) {
    const i = (json.nodes || []).findIndex(n => n.mesh != null);
    if (i < 0) throw new Error('GLB has no mesh node');
    return i;
}

function rigBody(donorFile, targetFile, outFile, label) {
    const donor = readGlb(donorFile), target = readGlb(targetFile);
    const dj = donor.json, tj = target.json;
    if (!dj.skins || !dj.skins.length) throw new Error('donor has no skin: ' + donorFile);
    const dNode = firstMeshNode(dj), dMesh = dj.meshes[dj.nodes[dNode].mesh], dPrim = dMesh.primitives[0];
    if (dj.nodes[dNode].skin == null) throw new Error('donor mesh node is not skinned');
    const dPos = readAccessor(donor, dPrim.attributes.POSITION);
    const dJoints = readAccessor(donor, dPrim.attributes.JOINTS_0);
    const dWeights = readAccessor(donor, dPrim.attributes.WEIGHTS_0);
    const dIdx = dPrim.indices != null ? readAccessor(donor, dPrim.indices) : Uint32Array.from({ length: dPos.length / 3 }, (_, i) => i);
    const dN = dPos.length / 3;
    let dMin = [Infinity, Infinity, Infinity], dMax = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < dN; i++) for (let k = 0; k < 3; k++) { dMin[k] = Math.min(dMin[k], dPos[i * 3 + k]); dMax[k] = Math.max(dMax[k], dPos[i * 3 + k]); }
    const dH = dMax[1] - dMin[1];

    // target: apply the mesh node's own rotation/scale (Blender Z-up export = X+90°) → Y-up metres
    const tNode = firstMeshNode(tj), tMesh = tj.meshes[tj.nodes[tNode].mesh];
    if (tMesh.primitives.length !== 1) throw new Error('target mesh must have exactly one primitive (has ' + tMesh.primitives.length + ')');
    const tPrim = tMesh.primitives[0];
    if (!tPrim.attributes.TEXCOORD_0) throw new Error('target mesh has no UVs');
    const { world } = worldMatrices(tj);
    const tW = world(tNode);
    const rawPos = readAccessor(target, tPrim.attributes.POSITION), rawNrm = readAccessor(target, tPrim.attributes.NORMAL);
    const tUV = readAccessor(target, tPrim.attributes.TEXCOORD_0);
    const tIdx = tPrim.indices != null ? readAccessor(target, tPrim.indices) : Uint32Array.from({ length: rawPos.length / 3 }, (_, i) => i);
    const tN = rawPos.length / 3;
    const pos = new Float32Array(tN * 3), nrm = new Float32Array(tN * 3);
    let tMin = [Infinity, Infinity, Infinity], tMax = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < tN; i++) {
        const p = xformP(tW, [rawPos[i * 3], rawPos[i * 3 + 1], rawPos[i * 3 + 2]]);
        const n = xformN(tW, [rawNrm[i * 3], rawNrm[i * 3 + 1], rawNrm[i * 3 + 2]]);
        for (let k = 0; k < 3; k++) { pos[i * 3 + k] = p[k]; nrm[i * 3 + k] = n[k]; tMin[k] = Math.min(tMin[k], p[k]); tMax[k] = Math.max(tMax[k], p[k]); }
    }
    // align: same height, feet on the donor's floor, x/z centres matched
    const k = dH / (tMax[1] - tMin[1]);
    const dc = [(dMin[0] + dMax[0]) / 2, dMin[1], (dMin[2] + dMax[2]) / 2];
    const tc = [(tMin[0] + tMax[0]) / 2, tMin[1], (tMin[2] + tMax[2]) / 2];
    for (let i = 0; i < tN; i++) for (let c = 0; c < 3; c++) pos[i * 3 + c] = (pos[i * 3 + c] - tc[c]) * k + dc[c];

    // spatial hash of donor triangles
    const cell = dH / 60;
    const grid = new Map();
    const key = (x, y, z) => x + ',' + y + ',' + z;
    const cellOf = v => Math.floor(v / cell);
    const triCount = dIdx.length / 3;
    for (let t = 0; t < triCount; t++) {
        const ia = dIdx[t * 3], ib = dIdx[t * 3 + 1], ic = dIdx[t * 3 + 2];
        let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
        for (const i of [ia, ib, ic]) for (let c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], dPos[i * 3 + c]); mx[c] = Math.max(mx[c], dPos[i * 3 + c]); }
        for (let x = cellOf(mn[0]); x <= cellOf(mx[0]); x++) for (let y = cellOf(mn[1]); y <= cellOf(mx[1]); y++) for (let z = cellOf(mn[2]); z <= cellOf(mx[2]); z++) {
            const kk = key(x, y, z); let arr = grid.get(kk); if (!arr) grid.set(kk, arr = []); arr.push(t);
        }
    }
    const dv = i => [dPos[i * 3], dPos[i * 3 + 1], dPos[i * 3 + 2]];
    function nearest(p) {
        let best = null;
        const cx = cellOf(p[0]), cy = cellOf(p[1]), cz = cellOf(p[2]);
        for (let r = 0; r <= 4; r++) {
            for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) for (let z = cz - r; z <= cz + r; z++) {
                if (Math.max(Math.abs(x - cx), Math.abs(y - cy), Math.abs(z - cz)) !== r) continue;
                const arr = grid.get(key(x, y, z)); if (!arr) continue;
                for (const t of arr) {
                    const ia = dIdx[t * 3], ib = dIdx[t * 3 + 1], ic = dIdx[t * 3 + 2];
                    const q = closestOnTriangle(p, dv(ia), dv(ib), dv(ic));
                    const d = Math.hypot(q.p[0] - p[0], q.p[1] - p[1], q.p[2] - p[2]);
                    if (!best || d < best.d) best = { d, tri: [ia, ib, ic], bary: q.bary };
                }
            }
            // a hit in ring r is exact once ring r+1 can't beat it: every unsearched cell is ≥ r*cell away
            if (best && best.d <= r * cell) break;
        }
        return best;
    }
    // per-vertex sparse weight maps
    let maps = new Array(tN), maxDist = 0, misses = 0;
    for (let i = 0; i < tN; i++) {
        const p = [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
        const hit = nearest(p);
        const w = {};
        if (hit) {
            maxDist = Math.max(maxDist, hit.d);
            for (let c = 0; c < 3; c++) {
                const vi = hit.tri[c], b = hit.bary[c]; if (b <= 0) continue;
                for (let j = 0; j < 4; j++) { const jw = dWeights[vi * 4 + j]; if (jw > 0) { const jid = dJoints[vi * 4 + j]; w[jid] = (w[jid] || 0) + jw * b; } }
            }
        } else {
            misses++;
            let bi = 0, bd = Infinity;
            for (let v = 0; v < dN; v++) { const d = Math.hypot(dPos[v * 3] - p[0], dPos[v * 3 + 1] - p[1], dPos[v * 3 + 2] - p[2]); if (d < bd) { bd = d; bi = v; } }
            for (let j = 0; j < 4; j++) { const jw = dWeights[bi * 4 + j]; if (jw > 0) w[dJoints[bi * 4 + j]] = (w[dJoints[bi * 4 + j]] || 0) + jw; }
        }
        maps[i] = w;
    }
    // two Laplacian smoothing passes over the TARGET topology (kills seam noise)
    const adj = Array.from({ length: tN }, () => new Set());
    for (let t = 0; t < tIdx.length; t += 3) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (a !== b) adj[tIdx[t + a]].add(tIdx[t + b]);
    for (let pass = 0; pass < 2; pass++) {
        const next = new Array(tN);
        for (let i = 0; i < tN; i++) {
            const out = {}; const nb = adj[i]; const own = maps[i];
            for (const j in own) out[j] = own[j] * 0.6;
            if (nb.size) { const f = 0.4 / nb.size; nb.forEach(n => { const m = maps[n]; for (const j in m) out[j] = (out[j] || 0) + m[j] * f; }); }
            next[i] = out;
        }
        maps = next;
    }
    const joints = new Uint8Array(tN * 4), weights = new Float32Array(tN * 4);
    const jointHist = {};
    for (let i = 0; i < tN; i++) {
        const top = Object.keys(maps[i]).map(j => [Number(j), maps[i][j]]).sort((a, b) => b[1] - a[1]).slice(0, 4);
        const sum = top.reduce((s, e) => s + e[1], 0) || 1;
        for (let j = 0; j < 4; j++) { joints[i * 4 + j] = top[j] ? top[j][0] : 0; weights[i * 4 + j] = top[j] ? top[j][1] / sum : 0; }
        if (top[0]) jointHist[top[0][0]] = (jointHist[top[0][0]] || 0) + 1;
    }

    // ── output: the donor's tree + the new geometry ──
    const B = new GlbBuilder();
    const out = B.json;
    out.asset.extras = { ewCharacterRig: { donor: path.basename(donorFile), source: path.basename(targetFile), method: 'nearest-surface weight transfer, 2 smoothing passes', builtAt: new Date().toISOString().slice(0, 10) } };
    out.scene = dj.scene || 0;
    out.scenes = JSON.parse(JSON.stringify(dj.scenes));
    out.nodes = JSON.parse(JSON.stringify(dj.nodes));
    out.skins = dj.skins.map(s => Object.assign({}, s, s.inverseBindMatrices != null ? { inverseBindMatrices: B.copyAccessor(donor, s.inverseBindMatrices) } : {}));
    if (dj.animations) out.animations = dj.animations.map(an => ({
        name: an.name, channels: JSON.parse(JSON.stringify(an.channels)),
        samplers: an.samplers.map(sm => Object.assign({}, sm, { input: B.copyAccessor(donor, sm.input), output: B.copyAccessor(donor, sm.output) }))
    }));
    const ARRAY = 34962, ELEMENT = 34963;
    const prim = {
        mode: 4,
        attributes: {
            POSITION: B.accessor(pos, 'VEC3', 5126, { target: ARRAY, minmax: true }),
            NORMAL: B.accessor(nrm, 'VEC3', 5126, { target: ARRAY }),
            TEXCOORD_0: B.accessor(Float32Array.from(tUV), 'VEC2', 5126, { target: ARRAY }),
            JOINTS_0: B.accessor(joints, 'VEC4', 5121, { target: ARRAY }),
            WEIGHTS_0: B.accessor(weights, 'VEC4', 5126, { target: ARRAY })
        },
        indices: B.accessor(tN <= 65535 ? Uint16Array.from(tIdx) : Uint32Array.from(tIdx), 'SCALAR', tN <= 65535 ? 5123 : 5125, { target: ELEMENT })
    };
    out.meshes = [{ name: dMesh.name || 'char1', primitives: [prim] }];
    out.nodes[dNode].mesh = 0;
    const bytes = B.write(outFile);
    const jointNames = dj.skins[0].joints.map(j => dj.nodes[j].name);
    const hist = Object.keys(jointHist).map(j => jointNames[j] + ':' + jointHist[j]).join(' ');
    console.log(`[bodies] ${label}: ${tN} verts / ${tIdx.length / 3} tris ← donor ${dN} verts; height ${dH.toFixed(3)} m; max surface distance ${(maxDist * 100).toFixed(2)} cm; brute-force fallbacks ${misses}; wrote ${path.relative(REPO, outFile)} (${(bytes / 1024).toFixed(0)} KB)`);
    console.log('         dominant joints: ' + hist);
    return { verts: tN, maxDist, misses };
}

/* ───────────────────────── 2. HAIR: split the pack ───────────────────────── */
function partKind(name) {
    if (/HairTie/i.test(name)) return 'tie';
    if (/HairUnder/i.test(name)) return 'under';
    if (/Scalp/i.test(name)) return 'scalp';
    return 'hair';
}

function splitHair(packFile, outDir) {
    const pack = readGlb(packFile), pj = pack.json;
    const { world, parent } = worldMatrices(pj);
    const roots = (pj.scenes[pj.scene || 0].nodes || []).filter(i => /^Hair(\d+)_ARM$/i.test(pj.nodes[i].name || ''));
    if (!roots.length) throw new Error('no Hair###_ARM roots in ' + packFile);
    fs.mkdirSync(outDir, { recursive: true });
    const catalogue = [];
    for (const rootIdx of roots) {
        const id = 'hair' + /^Hair(\d+)_ARM$/i.exec(pj.nodes[rootIdx].name)[1];
        // every mesh node under this armature
        const meshNodes = [];
        (function walk(i) { const n = pj.nodes[i]; if (n.mesh != null) meshNodes.push(i); (n.children || []).forEach(walk); })(rootIdx);
        const B = new GlbBuilder();
        const out = B.json;
        out.scene = 0; out.scenes = [{ nodes: [] }]; out.nodes = []; out.meshes = []; out.materials = []; out.textures = []; out.images = []; out.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }];
        const texMap = new Map(), matMap = new Map();
        function copyTexture(ti) {
            if (texMap.has(ti)) return texMap.get(ti);
            const t = pj.textures[ti], im = pj.images[t.source];
            let imgIdx;
            if (im.bufferView != null) {
                const bv = pj.bufferViews[im.bufferView];
                const bytes = pack.bin.slice(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
                imgIdx = out.images.push({ name: im.name, mimeType: im.mimeType, bufferView: B.pushBytes(bytes) }) - 1;
            } else {
                imgIdx = out.images.push({ name: im.name, uri: im.uri }) - 1;
            }
            const idx = out.textures.push({ sampler: 0, source: imgIdx, name: im.name }) - 1;
            texMap.set(ti, idx); return idx;
        }
        function copyMaterial(mi) {
            if (matMap.has(mi)) return matMap.get(mi);
            const m = pj.materials[mi] || {};
            const pbr = m.pbrMetallicRoughness || {};
            const o = { name: m.name || 'hair', doubleSided: true, alphaMode: m.alphaMode || 'OPAQUE',
                pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: pbr.roughnessFactor != null ? pbr.roughnessFactor : 0.6 } };
            if (pbr.baseColorFactor) o.pbrMetallicRoughness.baseColorFactor = pbr.baseColorFactor;
            if (pbr.baseColorTexture) o.pbrMetallicRoughness.baseColorTexture = { index: copyTexture(pbr.baseColorTexture.index) };
            if (m.normalTexture) o.normalTexture = { index: copyTexture(m.normalTexture.index) };
            if (m.alphaCutoff != null) o.alphaCutoff = m.alphaCutoff;
            const idx = out.materials.push(o) - 1; matMap.set(mi, idx); return idx;
        }
        // first pass: rest-pose skinned positions per primitive
        const prims = [];
        for (const ni of meshNodes) {
            const node = pj.nodes[ni], mesh = pj.meshes[node.mesh];
            const kind = partKind(mesh.name || node.name || '');
            let skinMats = null;
            if (node.skin != null) {
                const skin = pj.skins[node.skin];
                const ibm = readAccessor(pack, skin.inverseBindMatrices);
                skinMats = skin.joints.map((j, k) => m4mul(world(j), Array.from(ibm.subarray(k * 16, k * 16 + 16))));
            }
            const nodeW = world(ni);
            for (const p of mesh.primitives) {
                const rp = readAccessor(pack, p.attributes.POSITION), rn = readAccessor(pack, p.attributes.NORMAL);
                const uv = p.attributes.TEXCOORD_0 != null ? readAccessor(pack, p.attributes.TEXCOORD_0) : null;
                const idx = p.indices != null ? readAccessor(pack, p.indices) : Uint32Array.from({ length: rp.length / 3 }, (_, i) => i);
                const n = rp.length / 3;
                const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3);
                const J = skinMats && p.attributes.JOINTS_0 != null ? readAccessor(pack, p.attributes.JOINTS_0) : null;
                const W = skinMats && p.attributes.WEIGHTS_0 != null ? readAccessor(pack, p.attributes.WEIGHTS_0) : null;
                for (let i = 0; i < n; i++) {
                    let M;
                    if (J && W) {
                        M = new Array(16).fill(0); let ws = 0;
                        for (let j = 0; j < 4; j++) { const w = W[i * 4 + j]; if (w <= 0) continue; ws += w; const m = skinMats[J[i * 4 + j]]; for (let e = 0; e < 16; e++) M[e] += m[e] * w; }
                        if (ws <= 0) M = nodeW; else if (Math.abs(ws - 1) > 1e-4) for (let e = 0; e < 16; e++) M[e] /= ws;
                    } else M = nodeW;
                    const pp = xformP(M, [rp[i * 3], rp[i * 3 + 1], rp[i * 3 + 2]]), nn = xformN(M, [rn[i * 3], rn[i * 3 + 1], rn[i * 3 + 2]]);
                    for (let c = 0; c < 3; c++) { pos[i * 3 + c] = pp[c]; nrm[i * 3 + c] = nn[c]; }
                }
                prims.push({ kind, name: mesh.name, pos, nrm, uv, idx, material: p.material });
            }
        }
        // the SCALP cap = the head this hair was made for → its centre is the origin
        const bounds = list => { const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; list.forEach(pr => { for (let i = 0; i < pr.pos.length; i += 3) for (let c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], pr.pos[i + c]); mx[c] = Math.max(mx[c], pr.pos[i + c]); } }); return { min: mn, max: mx }; };
        const scalpPrims = prims.filter(p => p.kind === 'scalp');
        const ref = bounds(scalpPrims.length ? scalpPrims : prims);
        const centre = [(ref.min[0] + ref.max[0]) / 2, (ref.min[1] + ref.max[1]) / 2, (ref.min[2] + ref.max[2]) / 2];
        prims.forEach(pr => { for (let i = 0; i < pr.pos.length; i += 3) for (let c = 0; c < 3; c++) pr.pos[i + c] -= centre[c]; });
        const scalp = bounds(scalpPrims.length ? scalpPrims : prims), all = bounds(prims);
        const round = a => a.map(v => Math.round(v * 1e4) / 1e4);
        const counts = {};
        const ARRAY = 34962, ELEMENT = 34963;
        prims.forEach(pr => {
            counts[pr.kind] = (counts[pr.kind] || 0) + 1;
            const name = pr.kind + (counts[pr.kind] > 1 ? counts[pr.kind] : '');
            const attrs = { POSITION: B.accessor(pr.pos, 'VEC3', 5126, { target: ARRAY, minmax: true }), NORMAL: B.accessor(pr.nrm, 'VEC3', 5126, { target: ARRAY }) };
            if (pr.uv) attrs.TEXCOORD_0 = B.accessor(Float32Array.from(pr.uv), 'VEC2', 5126, { target: ARRAY });
            const n = pr.pos.length / 3;
            const prim = { mode: 4, attributes: attrs, indices: B.accessor(n <= 65535 ? Uint16Array.from(pr.idx) : Uint32Array.from(pr.idx), 'SCALAR', n <= 65535 ? 5123 : 5125, { target: ELEMENT }) };
            if (pr.material != null) prim.material = copyMaterial(pr.material);
            const mi = out.meshes.push({ name, primitives: [prim] }) - 1;
            const nodeIdx = out.nodes.push({ name, mesh: mi, extras: { ewPart: pr.kind } }) - 1;
            out.scenes[0].nodes.push(nodeIdx);
        });
        out.asset.extras = { ewHair: { id, source: path.basename(packFile), parts: prims.map(p => p.kind), scalp: { min: round(scalp.min), max: round(scalp.max) }, bounds: { min: round(all.min), max: round(all.max) } } };
        const file = path.join(outDir, id + '.glb');
        const bytes = B.write(file);
        const tris = prims.reduce((s, p) => s + p.idx.length / 3, 0);
        const size = all.max.map((v, i) => v - all.min[i]);
        catalogue.push({ id, tris, parts: prims.map(p => p.kind), size: round(size), kb: Math.round(bytes / 1024) });
        console.log(`[hair] ${id}: ${prims.length} parts (${prims.map(p => p.kind).join(', ')}), ${tris} tris, ${out.images.length} textures, extent ${round(size).join(' × ')} m → ${path.relative(REPO, file)} (${Math.round(bytes / 1024)} KB)`);
    }
    return catalogue;
}

/* ───────────────────────── CLI ───────────────────────── */
if (require.main === module) {
    const [cmd, ...rest] = process.argv.slice(2);
    const doBodies = () => ['male', 'female'].forEach(g => {
        if (!fs.existsSync(TARGET(g))) { console.log('[bodies] missing ' + path.relative(REPO, TARGET(g)) + ' — skipped'); return; }
        rigBody(DONOR(g), TARGET(g), RIGGED(g), g);
    });
    const doHair = (pack, outDir) => {
        if (!fs.existsSync(pack)) { console.log('[hair] missing ' + path.relative(REPO, pack) + ' — skipped'); return; }
        splitHair(pack, outDir);
    };
    if (!cmd) { doBodies(); doHair(HAIR_PACK, HAIR_OUT); }
    else if (cmd === 'bodies') doBodies();
    else if (cmd === 'body') { if (rest.length < 3) { console.error('usage: node character-rig.js body <donor.glb> <target.glb> <out.glb>'); process.exit(2); } rigBody(rest[0], rest[1], rest[2], path.basename(rest[2])); }
    else if (cmd === 'hair') doHair(rest[0] || HAIR_PACK, rest[1] || HAIR_OUT);
    else { console.error('unknown command ' + cmd); process.exit(2); }
}

module.exports = { readGlb, readAccessor, GlbBuilder, rigBody, splitHair, closestOnTriangle, partKind, DONOR, TARGET, RIGGED, HAIR_PACK, HAIR_OUT };
