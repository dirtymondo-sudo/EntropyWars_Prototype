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
// instancing (three r128's loader has no EXT_mesh_gpu_instancing), simplify (the LOD levels are Phase 10's),
// join / flatten (they would move the bones and nodes the rigs and the animation retarget look up by name).
// A result that isn't at least 5 % smaller is not written (the original stays the one the game loads).
//
// The game picks a `.opt.glb` up through ASSET_MANIFEST.json (manifest-assets.js): upload the .opt.glb files
// beside the originals on R2, regenerate the manifest, deploy. The originals stay on R2 (the fallback).

'use strict';

const fs = require('fs');
const path = require('path');

const OPT_SUFFIX = '.opt.glb';
const MIN_GAIN = 0.05;

function optName(file) { return file.replace(/\.glb$/i, OPT_SUFFIX); }
function isSource(file) { return /\.glb$/i.test(file) && !file.toLowerCase().endsWith(OPT_SUFFIX); }

function walk(p, out) {
    let st; try { st = fs.statSync(p); } catch (e) { return out; }
    if (st.isDirectory()) {
        for (const n of fs.readdirSync(p).sort()) { if (n === 'node_modules' || n.startsWith('.')) continue; walk(path.join(p, n), out); }
    } else if (isSource(p)) out.push(p);
    return out;
}

function mb(n) { return (n / 1048576).toFixed(n < 10485760 ? 2 : 1) + ' MB'; }

function parseArgs(argv) {
    const o = { inputs: [], out: null, size: 2048, force: false, dry: false, check: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--out') o.out = argv[++i];
        else if (a === '--size') o.size = Math.max(64, parseInt(argv[++i], 10) || 2048);
        else if (a === '--force') o.force = true;
        else if (a === '--dry-run') o.dry = true;
        else if (a === '--check') o.check = true;
        else o.inputs.push(a);
    }
    return o;
}

/* where a source's result goes: beside it, or at the same relative path under --out */
function targetFor(src, root, out) {
    if (!out) return optName(src);
    const rel = path.relative(root, src);
    return path.join(out, optName(rel));
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
    return async (srcBuf, optBuf) => {
        const a = sum(await parse(srcBuf)), b = sum(await parse(optBuf));
        const bad = b.cpuRaw.length ? ['normalized-int ' + [...new Set(b.cpuRaw)].join('/') + ' (three r128 reads it raw on the CPU)'] : [];
        ['meshes', 'skinned', 'bones', 'clips', 'tracks'].forEach(k => { if (a[k] !== b[k]) bad.push(k + ' ' + a[k] + ' → ' + b[k]); });
        const big = Math.max(1e-6, ...a.size);
        a.size.forEach((v, i) => { if (Math.abs(v - b.size[i]) > big * 0.01) bad.push('size ' + a.size.map(x => x.toFixed(3)) + ' → ' + b.size.map(x => x.toFixed(3))); });
        return { ok: !bad.length, bad, a, b };
    };
}

async function main() {
    const o = parseArgs(process.argv.slice(2));
    if (!o.inputs.length) { console.error('usage: npm run optimize -- <dir-or-file> [...] [--out <mirror>] [--size 2048] [--force] [--dry-run] [--check]'); process.exit(1); }
    const jobs = [];
    for (const inp of o.inputs) {
        const root = fs.statSync(inp).isDirectory() ? inp : path.dirname(inp);
        for (const src of walk(inp, [])) jobs.push({ src, dst: targetFor(src, root, o.out) });
    }
    if (!jobs.length) { console.log('optimize: no .glb files under ' + o.inputs.join(', ')); return; }
    const todo = jobs.filter(j => o.force || !fs.existsSync(j.dst) || fs.statSync(j.dst).mtimeMs < fs.statSync(j.src).mtimeMs);
    console.log(`optimize: ${jobs.length} GLB, ${todo.length} to do (${jobs.length - todo.length} already have a newer .opt.glb)`);
    if (o.dry) { todo.forEach(j => console.log('  ' + j.src + '  →  ' + j.dst)); return; }
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
    if (wrote) console.log('next: upload the .opt.glb files beside their originals on R2, then `npm run manifest -- <bucket mirror>` and `npm run deploy`');
    if (failed) process.exitCode = 1;
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { optName, isSource, targetFor, parseArgs, walk, OPT_SUFFIX };
