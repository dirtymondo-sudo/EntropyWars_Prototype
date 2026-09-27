#!/usr/bin/env node
// manifest-assets.js — OPEN_WORLD_PLAN §6.2 / Phase 9 (2026-09-27): ASSET_MANIFEST.json, the file list the game reads.
//
//     npm run manifest -- <bucket-mirror>                  # a local folder laid out like the R2 bucket (holds Assets/…)
//     npm run manifest -- <folder> --prefix Assets/misc/   # a folder that is ONE bucket folder
//     npm run manifest -- <folder> --prefix Assets/ --merge   # add to / refresh the existing manifest instead of replacing it
//
// Writes ASSET_MANIFEST.json at the repo root: { v, made, base, files: { "<bucket path>": [bytes, sha] } }.
// The bucket path is the object key as the R2 dashboard shows it (spaces and all, no %20); sha is the first
// 12 hex of the file's SHA-1. `npm run deploy` ships it to R2 (index.html preloads it with the ?v= token).
//
// What the game does with it (three-renderer.js THE ASSET STORE):
//   - a `<name>.glb` whose `<name>.opt.glb` is listed loads the .opt.glb (optimize-assets.js) — no URL in any
//     script changes; the original stays on R2 as the fallback;
//   - every file fetched through the store is asked for as `<url>?h=<sha>`, so a file replaced IN PLACE on R2
//     reaches players on the next deploy (the edge caches by the full URL; R2 ignores the query), and a stored
//     copy whose sha no longer matches is fetched again;
//   - the store's size accounting reads `bytes` when the CDN sends no content-length;
//   - DOWNLOAD THIS PLACE (the pause menu's settings) says how big a place is before it fetches it;
//   - a prop whose `<name>.lod1.glb` (and `.lod2.glb`) is listed draws those levels far off (Phase 10, THE LOD LEVELS).
//
// Repo-only tooling, zero dependencies.

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = __dirname;
const OUT_DEFAULT = path.join(REPO_ROOT, 'ASSET_MANIFEST.json');
const BASE = 'https://cdn.entropywars.net/';
/* the kinds the game's loaders fetch through the store (models, sheets, sounds, the few JSON / binary side files) */
const KINDS = /\.(glb|gltf|bin|obj|mtl|png|jpe?g|webp|ktx2|gif|mp3|ogg|wav|m4a|json)$/i;

function walk(dir, rel, out) {
    for (const n of fs.readdirSync(dir).sort()) {
        if (n.startsWith('.') || n === 'node_modules') continue;
        const p = path.join(dir, n), r = rel ? rel + '/' + n : n;
        const st = fs.statSync(p);
        if (st.isDirectory()) walk(p, r, out);
        else if (KINDS.test(n)) out.push({ p, r, bytes: st.size });
    }
    return out;
}

function sha12(file) { return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 12); }

function normPrefix(p) {
    p = String(p || '').replace(/\\/g, '/').replace(/^\/+/, '');
    return p && !p.endsWith('/') ? p + '/' : p;
}

/* build the files table for one folder: { "<prefix><rel>": [bytes, sha] } */
function scan(dir, prefix) {
    const files = {};
    for (const f of walk(dir, '', [])) files[normPrefix(prefix) + f.r] = [f.bytes, sha12(f.p)];
    return files;
}

function build(files, prev, prefix, merge) {
    const out = {};
    if (merge && prev && prev.files) {
        const pf = normPrefix(prefix);
        for (const k of Object.keys(prev.files)) if (!pf || !k.startsWith(pf)) out[k] = prev.files[k];
    }
    Object.assign(out, files);
    const sorted = {};
    for (const k of Object.keys(out).sort()) sorted[k] = out[k];
    return { v: 1, made: new Date().toISOString(), base: BASE, files: sorted };
}

/* the numbers the tool prints (and the test reads): how many files, how many GLBs have an optimized sibling */
function summary(man) {
    const keys = Object.keys(man.files || {});
    let bytes = 0, glb = 0, opt = 0, saved = 0, lod = 0;
    for (const k of keys) {
        bytes += man.files[k][0];
        if (/\.lod\d\.glb$/i.test(k)) { lod++; continue; }   // THE LOD LEVELS (Phase 10): optimize-assets.js --lod
        if (/\.glb$/i.test(k) && !/\.opt\.glb$/i.test(k)) {
            glb++;
            const o = man.files[k.replace(/\.glb$/i, '.opt.glb')];
            if (o) { opt++; saved += man.files[k][0] - o[0]; }
        }
    }
    return { files: keys.length, bytes, glb, opt, saved, lod };
}

function main() {
    const args = process.argv.slice(2);
    const get = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
    const prefix = get('--prefix') || '', outFile = get('--out') || OUT_DEFAULT, merge = args.includes('--merge');
    const dirs = args.filter((a, i) => !a.startsWith('--') && !['--prefix', '--out'].includes(args[i - 1]));
    if (dirs.length !== 1) { console.error('usage: npm run manifest -- <bucket-mirror-folder> [--prefix Assets/] [--merge] [--out ASSET_MANIFEST.json]'); process.exit(1); }
    if (!fs.existsSync(dirs[0]) || !fs.statSync(dirs[0]).isDirectory()) { console.error('manifest: not a folder: ' + dirs[0]); process.exit(1); }
    let prev = null;
    if (merge && fs.existsSync(outFile)) { try { prev = JSON.parse(fs.readFileSync(outFile, 'utf8')); } catch (e) { console.error('manifest: the old manifest does not parse; not merging'); process.exit(1); } }
    const files = scan(dirs[0], prefix);
    if (!Object.keys(files).length) { console.error('manifest: no asset files under ' + dirs[0]); process.exit(1); }
    const man = build(files, prev, prefix, merge);
    fs.writeFileSync(outFile, JSON.stringify(man) + '\n');
    const s = summary(man);
    console.log(`manifest: ${outFile} · ${s.files} files, ${(s.bytes / 1073741824).toFixed(2)} GB · ${s.opt} of ${s.glb} GLB have a .opt.glb (saves ${(s.saved / 1048576).toFixed(0)} MB) · ${s.lod} LOD level file(s)`);
    console.log('next: `npm run deploy` (ASSET_MANIFEST.json rides the ?v= token like the scripts) and redeploy index.html on Render');
}

if (require.main === module) main();
module.exports = { scan, build, summary, normPrefix, BASE };
