#!/usr/bin/env node
// bake-demiurge.js (2026-11-26, THE DEMIURGE): mondo's boss, two forms, made by Meshy in loose parts
// (/mnt/project-files/boss-concepts/models/). This turns the raw 10-14 MB files into the game's:
//
//     node bake-demiurge.js <raw models dir> <out dir>
//
// Needs (once, not saved in package.json, like optimize-assets.js):
//     npm i --no-save @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer sharp
//
// What each file gets: textures to WebP (1024 colour + normal, 512 metal/rough), the loose parts' triangles about halved,
// and the bending parts a skin of their own so three-renderer.js THE DEMIURGE can move them:
//   - dm_snake.glb  the shoulder serpent, base on the origin, head up and forward (+Z); 9 bones `dmChain_0..8` up its body
//   - dm_tail.glb   the bladed tail, base on the origin, reaching back (-Z); 9 bones `dmChain_0..8`
//   - dm_robe.glb   the cosmic form's robe, its collar's middle on the origin, hanging down; 8 columns of spring bones
//                   `ewsway_c<40+col>_<0..4>` (three-renderer.js THE SWAY swings them and keeps them off the body) under `dmRobeRoot`
// The rigid parts (wings, halo, eye, horn, staff, cube) only shrink. The two bodies keep Meshy's rig and their Running clip.
// Repo-only tooling: not a game file, never uploaded to R2.
'use strict';
const fs = require('fs'), path = require('path');
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { textureCompress, weld, simplify, prune, dedup } = require('@gltf-transform/functions');
const { MeshoptSimplifier } = require('meshoptimizer');
const sharp = require('sharp');

const [SRC, OUT] = process.argv.slice(2);
if (!SRC || !OUT) { console.error('usage: node bake-demiurge.js <raw models dir> <out dir>'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

async function shrinkTextures(doc, size) {
    await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 86, resize: [size, size], slots: /baseColor|normal|emissive/i }),
        textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 80, resize: [512, 512], slots: /metallicRoughness|occlusion/i }));
}
function dropTangents(doc) {
    for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const t = p.getAttribute('TANGENT'); if (t) p.setAttribute('TANGENT', null); }
}
function thePrim(doc) { return doc.getRoot().listMeshes()[0].listPrimitives()[0]; }
/* move the points (and the normals) of the one mesh: `fn([x, y, z]) -> [x, y, z]`, a rigid turn + shift */
function movePoints(doc, fn, turn) {
    const p = thePrim(doc), P = p.getAttribute('POSITION'), N = p.getAttribute('NORMAL'), v = [0, 0, 0];
    for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); P.setElement(i, fn(v)); if (N && turn) { N.getElement(i, v); N.setElement(i, turn(v)); } }
}
function bounds(doc) {
    const P = thePrim(doc).getAttribute('POSITION'), v = [0, 0, 0], lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); } }
    return { lo, hi };
}
/* a skin on the one mesh: `joints` = [{ name, pos: [x, y, z] (model space), parent: index | -1 }], `weigh(point) -> [[joint, w], ...]` */
function skinIt(doc, joints, weigh) {
    const root = doc.getRoot(), scene = root.listScenes()[0], meshNode = root.listNodes().find(n => n.getMesh());
    const buf = root.listBuffers()[0];
    const nodes = joints.map(j => doc.createNode(j.name));
    joints.forEach((j, i) => {
        const pp = j.parent >= 0 ? joints[j.parent].pos : [0, 0, 0];
        nodes[i].setTranslation([j.pos[0] - pp[0], j.pos[1] - pp[1], j.pos[2] - pp[2]]);
        if (j.parent >= 0) nodes[j.parent].addChild(nodes[i]); else scene.addChild(nodes[i]);
    });
    const ibm = new Float32Array(16 * joints.length);
    joints.forEach((j, i) => { ibm.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -j.pos[0], -j.pos[1], -j.pos[2], 1], i * 16); });
    const skin = doc.createSkin('dm').setInverseBindMatrices(doc.createAccessor().setType('MAT4').setArray(ibm).setBuffer(buf));
    nodes.forEach(n => skin.addJoint(n)); skin.setSkeleton(nodes[0]);
    meshNode.setSkin(skin);
    const p = thePrim(doc), P = p.getAttribute('POSITION'), n = P.getCount(), J = new Uint16Array(n * 4), W = new Float32Array(n * 4), v = [0, 0, 0];
    for (let i = 0; i < n; i++) {
        P.getElement(i, v);
        let ws = weigh(v).filter(x => x[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
        const s = ws.reduce((a, x) => a + x[1], 0) || 1;
        ws.forEach((x, k) => { J[i * 4 + k] = x[0]; W[i * 4 + k] = x[1] / s; });
        if (!ws.length) { J[i * 4] = 0; W[i * 4] = 1; }
    }
    p.setAttribute('JOINTS_0', doc.createAccessor().setType('VEC4').setArray(J).setBuffer(buf));
    p.setAttribute('WEIGHTS_0', doc.createAccessor().setType('VEC4').setArray(W).setBuffer(buf));
}
/* the middle of the mesh in `n` slices along `axis` (0 x, 1 y, 2 z) from `a` to `b`: the chain's joints */
function sliceMiddles(doc, axis, a, b, n) {
    const P = thePrim(doc).getAttribute('POSITION'), v = [0, 0, 0], out = [];
    const step = (b - a) / n;
    for (let s = 0; s <= n; s++) {
        const at = a + step * s, acc = [0, 0, 0]; let c = 0;
        for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); if (Math.abs(v[axis] - at) <= Math.abs(step) * 0.5) { acc[0] += v[0]; acc[1] += v[1]; acc[2] += v[2]; c++; } }
        const m = c ? [acc[0] / c, acc[1] / c, acc[2] / c] : (out[out.length - 1] || [0, 0, 0]).slice();
        m[axis] = at; out.push(m);
    }
    return out;
}
async function part(src, dst, opts) {
    opts = opts || {};
    const doc = await io.read(path.join(SRC, src));
    dropTangents(doc);
    if (opts.ratio) { await MeshoptSimplifier.ready; await doc.transform(weld({}), simplify({ simplifier: MeshoptSimplifier, ratio: opts.ratio, error: 0.004 })); }
    if (opts.shape) opts.shape(doc);
    await shrinkTextures(doc, opts.size || 1024);
    await doc.transform(dedup(), prune());
    const out = path.join(OUT, dst);
    await io.write(out, doc);
    const pr = thePrim(doc);
    console.log(dst.padEnd(48), (fs.statSync(out).size / 1e6).toFixed(2) + ' MB', pr.getIndices().getCount() / 3 + ' tris', opts.note ? opts.note(doc) : '');
}
const clamp01 = t => Math.max(0, Math.min(1, t));
/* a chain along the slices: joint 0 holds the base, each point rides the two joints it lies between */
function chainSkin(doc, axis, from, to, n) {
    const mids = sliceMiddles(doc, axis, from, to, n);
    const joints = mids.map((m, i) => ({ name: 'dmChain_' + i, pos: m, parent: i - 1 }));
    skinIt(doc, joints, v => {
        const t = clamp01((v[axis] - from) / (to - from)) * n, i = Math.min(n - 1, Math.floor(t)), f = t - i;
        return [[i, 1 - f], [i + 1, f]];
    });
}

(async () => {
    /* the bodies: Meshy's rig + its Running clip (the shared library animates the rest) */
    for (const [src, dst] of [['a_body_running.glb', 'armoured/Meshy_AI_demiurge_armoured_Running.glb'], ['c_body_2_running.glb', 'cosmic/Meshy_AI_demiurge_cosmic_Running.glb']]) {
        fs.mkdirSync(path.join(OUT, path.dirname(dst)), { recursive: true });
        const doc = await io.read(path.join(SRC, src));
        dropTangents(doc);
        await shrinkTextures(doc, 1024);
        await doc.transform(dedup(), prune());
        await io.write(path.join(OUT, dst), doc);
        console.log(dst.padEnd(48), (fs.statSync(path.join(OUT, dst)).size / 1e6).toFixed(2) + ' MB');
    }
    fs.mkdirSync(path.join(OUT, 'parts'), { recursive: true });
    /* the rigid parts */
    await part('a_wing.glb', 'parts/dm_wing_armoured.glb', { ratio: 0.5 });
    await part('c_wing.glb', 'parts/dm_wing_cosmic.glb', { ratio: 0.5 });
    await part('c_halo.glb', 'parts/dm_halo.glb', { ratio: 0.7, size: 512 });
    await part('c_eye.glb', 'parts/dm_eye.glb', { ratio: 0.7, size: 512 });
    await part('a_horn.glb', 'parts/dm_horn.glb', { ratio: 0.6, size: 512 });
    await part('w_cube.glb', 'parts/dm_cube.glb', { size: 512 });
    await part('w_staff.glb', 'parts/dm_staff.glb', { ratio: 0.7, note: doc => {
        /* the cage: the ring at the top; its middle, for the cube */
        const P = thePrim(doc).getAttribute('POSITION'), v = [0, 0, 0], b = bounds(doc); let lo = 1e9, hi = -1e9, xl = 1e9, xh = -1e9;
        for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); if (Math.abs(v[0]) > 0.12) { lo = Math.min(lo, v[1]); hi = Math.max(hi, v[1]); } if (v[1] > 0.45) { xl = Math.min(xl, v[0]); xh = Math.max(xh, v[0]); } }
        return 'cage y ' + lo.toFixed(3) + ' .. ' + hi.toFixed(3) + ' x ' + xl.toFixed(3) + ' .. ' + xh.toFixed(3) + ' of y ' + b.lo[1].toFixed(3) + ' .. ' + b.hi[1].toFixed(3);
    } });
    /* the serpent: base on the origin */
    await part('a_snake.glb', 'parts/dm_snake.glb', { ratio: 0.5, shape: doc => {
        const b = bounds(doc), P = thePrim(doc).getAttribute('POSITION'), v = [0, 0, 0], acc = [0, 0, 0]; let c = 0;
        for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); if (v[1] < b.lo[1] + 0.12 * (b.hi[1] - b.lo[1])) { acc[0] += v[0]; acc[1] += v[1]; acc[2] += v[2]; c++; } }
        const o = [acc[0] / c, b.lo[1], acc[2] / c];
        movePoints(doc, q => [q[0] - o[0], q[1] - o[1], q[2] - o[2]]);
        const nb = bounds(doc);
        chainSkin(doc, 1, 0.14 * nb.hi[1], nb.hi[1] * 0.97, 8);
    } });
    /* the tail: its file runs base (-X) to blade (+X); turned to reach back (-Z), base on the origin */
    await part('a_tail.glb', 'parts/dm_tail.glb', { ratio: 0.6, shape: doc => {
        const b = bounds(doc), P = thePrim(doc).getAttribute('POSITION'), v = [0, 0, 0], acc = [0, 0, 0]; let c = 0;
        for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); if (v[0] < b.lo[0] + 0.05 * (b.hi[0] - b.lo[0])) { acc[1] += v[1]; acc[2] += v[2]; c++; } }
        const o = [b.lo[0], acc[1] / c, acc[2] / c];
        movePoints(doc, q => [q[2] - o[2], q[1] - o[1], -(q[0] - o[0])], q => [q[2], q[1], -q[0]]);
        const nb = bounds(doc);
        chainSkin(doc, 2, 0.04 * nb.lo[2], nb.lo[2] * 0.97, 8);
    } });
    /* the robe: collar on the origin, 8 columns of 4 spring bones round it */
    await part('c_robe.glb', 'parts/dm_robe.glb', { ratio: 0.6, shape: doc => {
        const b = bounds(doc), P = thePrim(doc).getAttribute('POSITION'), v = [0, 0, 0], acc = [0, 0, 0]; let c = 0;
        for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); if (v[1] > b.hi[1] - 0.06 * (b.hi[1] - b.lo[1])) { acc[0] += v[0]; acc[2] += v[2]; c++; } }
        const o = [acc[0] / c, b.hi[1], acc[2] / c];
        movePoints(doc, q => [q[0] - o[0], q[1] - o[1], q[2] - o[2]]);
        const nb = bounds(doc), Hh = -nb.lo[1], COLS = 8, ROWS = 4, TOP = 0.16;   // the top 16 % is the waistband: it holds
        const ys = []; for (let r = 0; r <= ROWS; r++) ys.push(-Hh * (TOP + (1 - TOP) * r / ROWS));
        /* the robe's mean reach at each column's angle and row's height */
        const rad = [], cnt = [];
        for (let k = 0; k < COLS; k++) { rad.push(new Array(ROWS + 1).fill(0)); cnt.push(new Array(ROWS + 1).fill(0)); }
        const colOf = q => { let a = Math.atan2(q[0], q[2]); if (a < 0) a += Math.PI * 2; return a / (Math.PI * 2) * COLS; };
        const rowOf = q => clamp01((-q[1] / Hh - TOP) / (1 - TOP)) * ROWS;
        for (let i = 0; i < P.getCount(); i++) {
            P.getElement(i, v);
            const k = Math.round(colOf(v)) % COLS, r = Math.round(rowOf(v));
            rad[k][r] += Math.hypot(v[0], v[2]); cnt[k][r]++;
        }
        const joints = [{ name: 'dmRobeRoot', pos: [0, 0, 0], parent: -1 }];
        const idx = (k, r) => 1 + k * (ROWS + 1) + r;
        for (let k = 0; k < COLS; k++) for (let r = 0; r <= ROWS; r++) {
            const a = k / COLS * Math.PI * 2, R = (cnt[k][r] ? rad[k][r] / cnt[k][r] : 0.3) * 0.8;
            joints.push({ name: 'ewsway_c' + (40 + k) + '_' + r, pos: [Math.sin(a) * R, ys[r], Math.cos(a) * R], parent: r ? idx(k, r - 1) : 0 });
        }
        skinIt(doc, joints, q => {
            const band = clamp01((-q[1] / Hh) / TOP);   // 0 at the collar … 1 where the cloth starts to swing
            const cf = colOf(q), k0 = Math.floor(cf) % COLS, k1 = (k0 + 1) % COLS, kf = cf - Math.floor(cf);
            const rf = rowOf(q), r0 = Math.min(ROWS - 1, Math.floor(rf)), rr = rf - r0;
            /* a point between rows r0 and r0+1 rides the bone that STARTS at r0 (it turns about joint r0) and a little the next */
            const ws = [[0, 1 - band]];
            const add = (k, w) => { ws.push([idx(k, r0), w * (1 - rr * 0.5) * band]); if (r0 + 1 < ROWS) ws.push([idx(k, r0 + 1), w * rr * 0.5 * band]); else ws.push([idx(k, r0), w * rr * 0.5 * band]); };
            add(k0, 1 - kf); add(k1, kf);
            const m = {}; ws.forEach(x => { m[x[0]] = (m[x[0]] || 0) + x[1]; });
            return Object.keys(m).map(j => [+j, m[j]]);
        });
    } });
})().catch(e => { console.error(e); process.exit(1); });
