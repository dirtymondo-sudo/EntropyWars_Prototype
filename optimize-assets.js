#!/usr/bin/env node
// optimize-assets.js — OPEN_WORLD_PLAN §6.1 / Phase 9 (2026-09-27): compress the game's GLBs offline.
//
//     npm run optimize -- <dir-or-file> [...]      # writes <name>.opt.glb beside each <name>.glb
//     npm run optimize -- <dir> --out <mirror>     # writes them into a mirror of <dir> instead
//     npm run optimize -- <dir> --size 2048        # the texture cap (default 1024)
//     npm run optimize -- <dir> --force            # redo files whose .opt.glb is already newer
//     npm run optimize -- <dir> --dry-run          # list what would be done
//     npm run optimize -- <dir> --check            # parse every result with the game's own three r128
//                                                  #   GLTFLoader + MeshoptDecoder and compare it to the original
//     npm run optimize -- <dir> --lod              # ALSO bake the LOD levels (OPEN_WORLD_PLAN Phase 10):
//                                                  #   <name>.lod1.glb + <name>.lod2.glb beside each prop GLB
//
// Repo-only tooling: not a game file, never uploaded to R2. Needs (once, not saved in package.json so CI and
// the server stay lean):
//     npm i --no-save @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer sharp
// and, for --check, three@0.128.0 as well.
//
// What a file gets: dedup + prune, the animation resampled (lossless), the textures to WebP at most <size> px
// (EXT_texture_webp), then meshopt (reorder + EXT_meshopt_compression on the FLOAT attributes). NOT done, on purpose:
// quantization (three r128 reads a normalized-int position / skin weight raw on the CPU: raycasts, bounds and the
// CPU-skinned rig bounds would all break),
// instancing (three r128's loader has no EXT_mesh_gpu_instancing), join / flatten (they would move the bones and nodes
// the rigs and the animation retarget look up by name), simplify on the file itself (the look stays the author's).
// A result that isn't at least 5 % smaller is not written (the original stays the one the game loads).
//
// THE LOD LEVELS (--lod, OPEN_WORLD_PLAN Phase 10, 2026-09-27): a PROP (no skin, no morph, no animation, at least
// LOD_MIN_TRIS triangles) also gets `<name>.lod1.glb` (~LOD_RATIOS[0] of its triangles) and `<name>.lod2.glb`
// (~LOD_RATIOS[1]): welded, simplified with meshoptimizer (the UV seams and the borders kept), meshopt-compressed like
// the .opt.glb (no quantize) and with NO TEXTURES: the game takes only the GEOMETRY of a level and draws it with the
// full file's own materials (three-renderer.js THE LOD LEVELS), so a level costs no second texture in memory. A
// level that doesn't drop at least LOD_MIN_DROP of the triangles above it is not written. The meshes keep their
// names and their order (the game pairs level meshes with the full file's by both, and refuses a file that differs).
//
// The game picks a `.opt.glb` up through ASSET_MANIFEST.json (manifest-assets.js): upload the .opt.glb files
// beside the originals on R2, regenerate the manifest, deploy. The originals stay on R2 (the fallback).

'use strict';

const fs = require('fs');
const path = require('path');

const OPT_SUFFIX = '.opt.glb';
const MIN_GAIN = 0.05;
/* THE LOD LEVELS (Phase 10): the share of the full file's triangles each level keeps, the simplifier's error budget
   (a fraction of the mesh's size), the smallest prop worth levels, the least drop a level must make over the one above */
const LOD_RATIOS = [0.25, 0.06], LOD_ERRORS = [0.004, 0.02], LOD_MIN_TRIS = 3000, LOD_MIN_DROP = 0.3;

function optName(file) { return file.replace(/\.glb$/i, OPT_SUFFIX); }
function lodName(file, level) { return file.replace(/\.glb$/i, '.lod' + level + '.glb'); }
function isDerived(file) { return /\.(opt|lod\d)\.glb$/i.test(file); }
function isSource(file) { return /\.glb$/i.test(file) && !isDerived(file); }

function walk(p, out) {
    let st; try { st = fs.statSync(p); } catch (e) { return out; }
    if (st.isDirectory()) {
        for (const n of fs.readdirSync(p).sort()) { if (n === 'node_modules' || n.startsWith('.')) continue; walk(path.join(p, n), out); }
    } else if (isSource(p)) out.push(p);
    return out;
}

function mb(n) { return (n / 1048576).toFixed(n < 10485760 ? 2 : 1) + ' MB'; }

function parseArgs(argv) {
    const o = { inputs: [], out: null, size: 2048, force: false, dry: false, check: false, lod: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--out') o.out = argv[++i];
        else if (a === '--size') o.size = Math.max(64, parseInt(argv[++i], 10) || 2048);
        else if (a === '--force') o.force = true;
        else if (a === '--dry-run') o.dry = true;
        else if (a === '--check') o.check = true;
        else if (a === '--lod') o.lod = true;
        else o.inputs.push(a);
    }
    return o;
}

/* where a source's result goes: beside it, or at the same relative path under --out (namer: optName or a level's) */
function targetFor(src, root, out, namer) {
    namer = namer || optName;
    if (!out) return namer(src);
    const rel = path.relative(root, src);
    return path.join(out, namer(rel));
}

function loadDeps() {
    try {
        const core = require('@gltf-transform/core');
        const ext = require('@gltf-transform/extensions');
        const fn = require('@gltf-transform/functions');
        const mo = require('meshoptimizer');
        const sharp = require('sharp');
        return { core, ext, fn, mo, sharp };
    } catch (e) {
        console.error('optimize: missing tools (' + (e && e.message ? e.message.split('\n')[0] : e) + ').\nRun once:\n'
            + '    npm i --no-save @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer sharp');
        process.exit(1);
    }
}

async function optimizeOne(D, io, src, dst, size) {
    const { fn, mo, sharp } = D;
    const doc = await io.read(src);
    const steps = [fn.dedup(), fn.prune({ keepLeaves: true, keepAttributes: true }), fn.resample()];
    if (doc.getRoot().listTextures().length) steps.push(fn.textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [size, size] }));
    /* meshopt WITHOUT quantizing: three r128 reads a normalized-int attribute raw on the CPU (BufferAttribute.getX,
       Vector3.fromBufferAttribute), so a quantized POSITION / skinWeight breaks every raycast, computeBoundingBox and
       the CPU-skinned bounds the renderer scales rigs by. Float attributes are compressed losslessly (reorder + the
       meshopt byte codec); the textures are where the megabytes are. */
    steps.push(fn.reorder({ encoder: mo.MeshoptEncoder, target: 'size' }));
    await doc.transform(...steps);
    if (doc.getRoot().listAccessors().length) {
        doc.createExtension(D.ext.EXTMeshoptCompression).setRequired(true)
            .setEncoderOptions({ method: D.ext.EXTMeshoptCompression.EncoderMethod.QUANTIZE });   // no quantize() ran, so every filter is NONE: lossless
    }
    const bytes = await io.writeBinary(doc);
    return Buffer.from(bytes);
}

/* the triangles a document draws (indexed or not; TRIANGLES mode only) */
function docTris(doc) {
    let n = 0;
    for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
        if (prim.getMode() !== 4) continue;
        const idx = prim.getIndices(), pos = prim.getAttribute('POSITION');
        n += Math.floor((idx ? idx.getCount() : (pos ? pos.getCount() : 0)) / 3);
    }
    return n;
}
/* is this file a prop the LOD levels may simplify? (a rig, a morph or a clip keeps its full mesh everywhere) */
function lodEligible(doc) {
    const root = doc.getRoot();
    if (root.listSkins().length || root.listAnimations().length) return false;
    for (const mesh of root.listMeshes()) for (const prim of mesh.listPrimitives()) if (prim.listTargets().length) return false;
    return docTris(doc) >= LOD_MIN_TRIS;
}
/* one LOD level of src: the geometry only (every texture dropped), welded + simplified to `ratio`, meshopt, no quantize.
   → { buf, tris, full } or null (not a prop, or the level would not drop enough) */
async function lodOne(D, io, src, ratio, error, prevTris) {
    const { fn, mo, ext } = D;
    const doc = await io.read(src);
    if (!lodEligible(doc)) return null;
    const full = docTris(doc);
    doc.getRoot().listTextures().forEach(t => t.dispose());   // the game draws a level with the full file's materials
    await doc.transform(
        fn.dedup(),
        fn.weld(),
        fn.simplify({ simplifier: mo.MeshoptSimplifier, ratio, error, lockBorder: false }),
        fn.prune({ keepLeaves: true, keepAttributes: true }),
        fn.reorder({ encoder: mo.MeshoptEncoder, target: 'size' })
    );
    const tris = docTris(doc);
    if (tris > (prevTris || full) * (1 - LOD_MIN_DROP)) return null;
    if (doc.getRoot().listAccessors().length) doc.createExtension(ext.EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: ext.EXTMeshoptCompression.EncoderMethod.QUANTIZE });
    return { buf: Buffer.from(await io.writeBinary(doc)), tris, full };
}
/* the mesh names in the order three r128's GLTFLoader walks them — what the game pairs a level's meshes by */
function meshOrder(THREE, scene) { const out = []; scene.traverse(n => { if (n.isMesh) out.push(n.name || ''); }); return out; }

/* --check: parse with the game's loader (three r128 + the decoder index.html loads) and compare to the original */
function makeChecker() {
    let THREE;
    try { THREE = require('three'); } catch (e) { return null; }
    if (!/^0\.128\./.test(require('three/package.json').version)) { console.warn('optimize: --check wants three@0.128.0 (the game\'s release); found ' + require('three/package.json').version); }
    const vm = require('vm');
    const c = { THREE, console, TextDecoder, URL, Blob, setTimeout, clearTimeout, performance, WebAssembly, self: null, window: null };
    c.self = c; c.window = c;
    vm.createContext(c);
    vm.runInContext(fs.readFileSync(require.resolve('three/examples/js/loaders/GLTFLoader.js'), 'utf8'), c);
    vm.runInContext(fs.readFileSync(require.resolve('three/examples/js/libs/meshopt_decoder.js'), 'utf8') + '\nthis.MeshoptDecoder = MeshoptDecoder;', c);
    /* Node has no <img>: a texture becomes an empty Texture (the geometry, the bones and the clips are what's compared) */
    THREE.TextureLoader.prototype.load = function (url, onLoad) { const t = new THREE.Texture(); if (onLoad) setTimeout(() => onLoad(t), 0); return t; };
    THREE.ImageBitmapLoader && (THREE.ImageBitmapLoader.prototype.load = THREE.TextureLoader.prototype.load);
    /* the loader's WebP probe (EXT_texture_webp) loads a 1-px image: every browser the game runs on decodes WebP */
    c.Image = function () { const im = this; im.height = 1; Object.defineProperty(im, 'src', { set() { setTimeout(() => im.onload && im.onload(), 0); } }); };
    const parse = buf => new Promise((ok, fail) => {
        const l = new THREE.GLTFLoader(); l.setMeshoptDecoder(c.MeshoptDecoder);
        l.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', ok, fail);
    });
    /* the bounds the renderer measures: world positions, CPU-skinned for a rig (r128's own boneTransform) */
    function bounds(scene, s) {
        const box = new THREE.Box3(), v = new THREE.Vector3();
        scene.updateMatrixWorld(true);
        scene.traverse(n => {
            if (!n.isMesh || !n.geometry.attributes.position) return;
            const A = n.geometry.attributes;
            ['position', 'normal', 'skinWeight'].forEach(k => { if (A[k] && A[k].normalized) s.cpuRaw.push(k); });
            if (n.isSkinnedMesh) n.skeleton.update();
            const P = A.position, step = Math.max(1, Math.floor(P.count / 20000));
            for (let i = 0; i < P.count; i += step) {
                if (n.isSkinnedMesh) n.boneTransform(i, v); else v.fromBufferAttribute(P, i);
                box.expandByPoint(v.applyMatrix4(n.matrixWorld));
            }
        });
        return box;
    }
    function sum(g) {
        const s = { meshes: 0, skinned: 0, bones: 0, verts: 0, clips: (g.animations || []).length, tracks: 0, cpuRaw: [] };
        const box = bounds(g.scene, s);
        g.scene.traverse(n => { if (n.isMesh) { s.meshes++; s.verts += n.geometry.attributes.position ? n.geometry.attributes.position.count : 0; } if (n.isSkinnedMesh) s.skinned++; if (n.isBone) s.bones++; });
        (g.animations || []).forEach(a => { s.tracks += a.tracks.length; });
        s.size = box.isEmpty() ? [0, 0, 0] : box.getSize(new THREE.Vector3()).toArray();
        return s;
    }
    const chk = async (srcBuf, optBuf) => {
        const a = sum(await parse(srcBuf)), b = sum(await parse(optBuf));
        const bad = b.cpuRaw.length ? ['normalized-int ' + [...new Set(b.cpuRaw)].join('/') + ' (three r128 reads it raw on the CPU)'] : [];
        ['meshes', 'skinned', 'bones', 'clips', 'tracks'].forEach(k => { if (a[k] !== b[k]) bad.push(k + ' ' + a[k] + ' → ' + b[k]); });
        const big = Math.max(1e-6, ...a.size);
        a.size.forEach((v, i) => { if (Math.abs(v - b.size[i]) > big * 0.01) bad.push('size ' + a.size.map(x => x.toFixed(3)) + ' → ' + b.size.map(x => x.toFixed(3))); });
        return { ok: !bad.length, bad, a, b };
    };
    /* a LOD level: the same meshes, named and in the same order as the full file's, each with the attributes it has */
    chk.lod = async (srcBuf, lodBuf) => {
        const A = await parse(srcBuf), B = await parse(lodBuf), bad = [];
        const na = meshOrder(THREE, A.scene), nb = meshOrder(THREE, B.scene);
        if (na.join('|') !== nb.join('|')) bad.push('meshes ' + na.length + ' → ' + nb.length + ' (names / order differ)');
        const ma = [], mb = []; A.scene.traverse(n => { if (n.isMesh) ma.push(n); }); B.scene.traverse(n => { if (n.isMesh) mb.push(n); });
        ma.forEach((m, i) => { const l = mb[i]; if (!l) return; Object.keys(m.geometry.attributes).forEach(k => { if (!l.geometry.attributes[k]) bad.push(m.name + ': no ' + k); }); });
        return { ok: !bad.length, bad };
    };
    return chk;
}

async function main() {
    const o = parseArgs(process.argv.slice(2));
    if (!o.inputs.length) { console.error('usage: npm run optimize -- <dir-or-file> [...] [--out <mirror>] [--size 2048] [--force] [--dry-run] [--check] [--lod]'); process.exit(1); }
    const jobs = [];
    for (const inp of o.inputs) {
        const root = fs.statSync(inp).isDirectory() ? inp : path.dirname(inp);
        for (const src of walk(inp, [])) jobs.push({ src, root, dst: targetFor(src, root, o.out) });
    }
    if (!jobs.length) { console.log('optimize: no .glb files under ' + o.inputs.join(', ')); return; }
    const todo = jobs.filter(j => o.force || !fs.existsSync(j.dst) || fs.statSync(j.dst).mtimeMs < fs.statSync(j.src).mtimeMs);
    console.log(`optimize: ${jobs.length} GLB, ${todo.length} to do (${jobs.length - todo.length} already have a newer .opt.glb)`);
    if (o.dry) { todo.forEach(j => console.log('  ' + j.src + '  →  ' + j.dst)); if (o.lod) console.log('  (and the LOD levels of every prop: <name>.lod1.glb, <name>.lod2.glb)'); return; }
    const D = loadDeps();
    await D.mo.MeshoptEncoder.ready; await D.mo.MeshoptDecoder.ready;
    const io = new D.core.NodeIO().registerExtensions(D.ext.ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': D.mo.MeshoptEncoder, 'meshopt.decoder': D.mo.MeshoptDecoder });
    const check = o.check ? makeChecker() : null;
    if (o.check && !check) console.warn('optimize: --check needs three@0.128.0 installed (npm i --no-save three@0.128.0); skipping the check');
    let inB = 0, outB = 0, wrote = 0, kept = 0, failed = 0;
    for (const j of todo) {
        const before = fs.statSync(j.src).size;
        let buf;
        try { buf = await optimizeOne(D, io, j.src, j.dst, o.size); }
        catch (e) { failed++; console.log(`  FAIL  ${j.src}: ${e && e.message ? e.message.split('\n')[0] : e}`); continue; }
        if (buf.length > before * (1 - MIN_GAIN)) {
            kept++; console.log(`  keep  ${mb(before).padStart(9)}  ${j.src}  (the result was ${mb(buf.length)}: not worth a second file)`);
            try { if (fs.existsSync(j.dst)) fs.unlinkSync(j.dst); } catch (e) {}
            continue;
        }
        if (check) {
            let r; try { r = await check(fs.readFileSync(j.src), buf); } catch (e) { r = { ok: false, bad: ['parse: ' + (e && e.message ? e.message : e)] }; }
            if (!r.ok) { failed++; console.log(`  BAD   ${j.src}: ${r.bad.join('; ')} (not written)`); continue; }
        }
        fs.mkdirSync(path.dirname(j.dst), { recursive: true });
        fs.writeFileSync(j.dst, buf);
        wrote++; inB += before; outB += buf.length;
        console.log(`  ${mb(before).padStart(9)} → ${mb(buf.length).padStart(9)}  ×${(before / buf.length).toFixed(1).padEnd(5)} ${j.dst}`);
    }
    console.log(`optimize: wrote ${wrote}, kept ${kept} originals, ${failed} failed` + (wrote ? ` · ${mb(inB)} → ${mb(outB)} (×${(inB / outB).toFixed(1)})` : ''));
    if (o.lod) {
        /* THE LOD LEVELS: every source (not only the ones whose .opt.glb was redone) whose levels are missing or older */
        let lw = 0, lskip = 0, lbad = 0;
        for (const j of jobs) {
            const srcBuf = fs.readFileSync(j.src), full0 = j.src;
            let prev = 0;
            for (let L = 1; L <= LOD_RATIOS.length; L++) {
                const dst = targetFor(j.src, j.root, o.out, f => lodName(f, L));
                if (!o.force && fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(j.src).mtimeMs) { prev = 0; continue; }
                let r = null;
                try { r = await lodOne(D, io, full0, LOD_RATIOS[L - 1], LOD_ERRORS[L - 1], prev); }
                catch (e) { lbad++; console.log(`  FAIL  lod${L} ${j.src}: ${e && e.message ? e.message.split('\n')[0] : e}`); break; }
                if (!r) { lskip++; try { if (fs.existsSync(dst)) fs.unlinkSync(dst); } catch (e) {} break; }
                if (check && check.lod) {
                    let c; try { c = await check.lod(srcBuf, r.buf); } catch (e) { c = { ok: false, bad: ['parse: ' + (e && e.message ? e.message : e)] }; }
                    if (!c.ok) { lbad++; console.log(`  BAD   lod${L} ${j.src}: ${c.bad.slice(0, 4).join('; ')} (not written)`); break; }
                }
                fs.mkdirSync(path.dirname(dst), { recursive: true });
                fs.writeFileSync(dst, r.buf);
                lw++; prev = r.tris;
                console.log(`  lod${L}  ${String(r.full).padStart(8)} → ${String(r.tris).padStart(7)} tris  ${mb(r.buf.length).padStart(9)}  ${dst}`);
            }
        }
        console.log(`optimize: ${lw} LOD level(s) written, ${lskip} file(s) not a prop or too small for a level, ${lbad} failed`);
        if (lbad) failed += lbad;
    }
    if (wrote || o.lod) console.log('next: upload the .opt.glb / .lodN.glb files beside their originals on R2, then `npm run manifest -- <bucket mirror>` and `npm run deploy`');
    if (failed) process.exitCode = 1;
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { optName, lodName, isSource, isDerived, targetFor, parseArgs, walk, OPT_SUFFIX, LOD_RATIOS, LOD_MIN_TRIS, lodEligible, docTris };
