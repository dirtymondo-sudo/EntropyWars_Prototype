#!/usr/bin/env node
// sync-zip.js — writes the CUMULATIVE SYNC ZIP (CLAUDE.md RULE #1, step 3).
//
//   node sync-zip.js              # fetch origin/main, compare R2, write the zip
//   node sync-zip.js --dry-run    # compare only, write nothing
//   node sync-zip.js --out <dir>  # default /mnt/project-files/r2-sync
//   node sync-zip.js --upload     # upload every differing file STRAIGHT TO R2
//                                 # (no zip), then re-check each one live
//   node sync-zip.js --put <local file> <R2 key> [<local> <key> ...]
//                                 # upload R2-only assets (decor/props/misc GLBs
//                                 # that are not in the repo), re-check each live
//
// DIRECT UPLOAD (2026-11-03, mondo): the cloud environment has a Network
// secret that adds `Authorization: Bearer <Cloudflare API token>` to every
// request to api.cloudflare.com (an R2 "Admin Read & Write" Account API token;
// "Object Read & Write" tokens are refused by this REST route). The token is
// never in the container, a file or chat. Uploads go through curl (it honours
// HTTPS_PROXY; Node's fetch does not) to the Cloudflare REST object API of the
// bucket behind cdn.entropywars.net: `ewmusicsfx` (NOT `dirtymondo`, which has
// no custom domain). If the upload is refused, fall back to the zip.
//
// For every root-level cdn.entropywars.net file index.html on origin/main loads
// with a ?v= token, it fetches the LIVE R2 copy (curl --compressed + a random
// non-empty query, never the ?v= token: that would cache the old file at the
// edge) and compares its sha256 to origin/main. Every differing file is taken
// from origin/main (never the working tree) and zipped under ONE top-level
// folder named like the zip:
//   ENTROPY_WARS_SYNC_<UTC yyyymmdd-hhmm>.zip
//     └ ENTROPY_WARS_SYNC_<UTC yyyymmdd-hhmm>/<file>
// even when only one file differs (mondo, 2026-10-13 and again 2026-11-01: a
// loose single file unzips into Downloads renamed like three-renderer_3.js).
// Files not in the repo (react, react-dom, MeshLine) are R2-only: skipped.
//
// Zero dependencies (needs git, curl, zip on PATH). Repo-only dev tooling.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const REPO_ROOT = __dirname;
const CDN = 'https://cdn.entropywars.net/';
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const outIdx = args.indexOf('--out');
const OUT_DIR = outIdx >= 0 ? args[outIdx + 1] : '/mnt/project-files/r2-sync';
const UPLOAD = args.includes('--upload');
// Not secrets: the account id is in every dashboard URL; the token is injected by the proxy.
const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || 'b2608d464c04fdeec48ba91f04b8aeb7';
const R2_BUCKET = process.env.EW_R2_BUCKET || 'ewmusicsfx';
const R2_API = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/r2/buckets/${R2_BUCKET}/objects/`;
const CONTENT_TYPES = {
    '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html',
    '.txt': 'text/plain', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
    '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ktx2': 'image/ktx2', '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
    '.wav': 'audio/wav', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ttf': 'font/ttf', '.otf': 'font/otf',
    '.woff': 'font/woff', '.woff2': 'font/woff2',
};

function fail(msg) { console.error('sync-zip: ' + msg); process.exit(1); }
function git(a, opts) { return execFileSync('git', a, Object.assign({ cwd: REPO_ROOT, maxBuffer: 1 << 30 }, opts || {})); }
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function stamp() {
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
}

function liveCopy(file) {
    const q = 'sync' + crypto.randomBytes(6).toString('hex');
    for (let i = 0; i < 4; i++) {
        try {
            return execFileSync('curl', ['-sSf', '--compressed', '--max-time', '120', CDN + file + '?' + q], { maxBuffer: 1 << 30 });
        } catch (e) { if (i === 3) return null; }
    }
    return null;
}

// PUT one object to R2 (the proxy adds the auth header), then fetch it live
// with a random query and compare sha256. Returns true when live == buf.
function r2Put(key, buf) {
    const ext = path.extname(key).toLowerCase();
    const type = CONTENT_TYPES[ext] || 'application/octet-stream';
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-put-'));
    const f = path.join(tmp, 'body');
    fs.writeFileSync(f, buf);
    const url = R2_API + key.split('/').map(encodeURIComponent).join('/');
    let res = '';
    for (let i = 0; i < 4; i++) {
        try {
            res = execFileSync('curl', ['-sS', '--max-time', '600', '-X', 'PUT', '-H', 'Content-Type: ' + type,
                '--data-binary', '@' + f, url], { maxBuffer: 1 << 24 }).toString();
            if (/"success":\s*true/.test(res)) break;
        } catch (e) { res = String(e.message || e); }
    }
    fs.rmSync(tmp, { recursive: true, force: true });
    if (!/"success":\s*true/.test(res)) {
        console.error(`  UPLOAD REFUSED  ${key}: ${res.slice(0, 300)}`);
        return false;
    }
    const live = liveCopy(key.split('/').map(encodeURIComponent).join('/'));
    const ok = !!live && sha(live) === sha(buf);
    console.log(`  ${ok ? 'uploaded + live' : 'uploaded, LIVE MISMATCH'}  ${sha(buf).slice(0, 8)}  ${key}`);
    return ok;
}

/* THE ASSET PATH MAP (docs/notes/r2-layout-plan.md): after a wave's flip, a --put to a folder that moved goes to the new folder
   (sprites.js EW_ASSET_MOVES, longest prefix wins), so a thread still using the old path out of habit lands in the right place. */
function movedKey(key) {
    let rows = [];
    try {
        const src = fs.readFileSync(path.join(REPO_ROOT, 'sprites.js'), 'utf8');
        const a = src.indexOf('const EW_ASSET_MOVES = ['), b = a >= 0 ? src.indexOf('];', a) : -1;
        if (a >= 0 && b > a) rows = [...src.slice(a, b).matchAll(/\[\s*'([^']+)'\s*,\s*'([^']+)'\s*\]/g)].map(m => [m[1], m[2]]);
    } catch (e) {}
    rows.sort((x, y) => y[0].length - x[0].length);
    for (const [o, n] of rows) if (key.startsWith(o)) { console.log(`  (moved folder) ${key} -> ${n + key.slice(o.length)}`); return n + key.slice(o.length); }
    return key;
}

function putMode() {
    const i = args.indexOf('--put');
    const pairs = args.slice(i + 1);
    if (!pairs.length || pairs.length % 2) fail('--put needs <local file> <R2 key> pairs');
    let bad = 0;
    for (let j = 0; j < pairs.length; j += 2) {
        if (!fs.existsSync(pairs[j])) { console.error('  missing local file ' + pairs[j]); bad++; continue; }
        if (DRY) { console.log(`  would upload ${pairs[j]} -> ${pairs[j + 1]}`); continue; }
        if (!r2Put(movedKey(pairs[j + 1].replace(/^\/+/, '')), fs.readFileSync(pairs[j]))) bad++;
    }
    if (bad) fail(bad + ' file(s) not uploaded / not live');
    console.log('all files live on R2.');
}

function main() {
    if (args.includes('--put')) return putMode();
    for (let i = 0; ; i++) {
        try { git(['fetch', '-q', 'origin', 'main'], { stdio: 'inherit' }); break; }
        catch (e) { if (i === 3) fail('git fetch origin main failed'); }
    }
    const html = git(['show', 'origin/main:index.html']).toString();
    const re = /https:\/\/cdn\.entropywars\.net\/([A-Za-z0-9_.-]+)\?v=/g;
    const files = [];
    let m;
    while ((m = re.exec(html))) if (!files.includes(m[1])) files.push(m[1]);
    if (!files.length) fail('no cdn.entropywars.net ?v= files found in origin/main:index.html');

    const differ = [], skipped = [], unreachable = [];
    for (const f of files) {
        let mainBuf;
        try { mainBuf = git(['show', 'origin/main:' + f], { stdio: ['ignore', 'pipe', 'ignore'] }); }
        catch (e) { skipped.push(f); continue; }
        const live = liveCopy(f);
        if (!live) unreachable.push(f);
        if (!live || sha(live) !== sha(mainBuf)) differ.push({ f, buf: mainBuf, h: sha(mainBuf) });
    }

    console.log(`checked ${files.length} R2 files; R2-only (not in repo, skipped): ${skipped.join(', ') || 'none'}`);
    if (unreachable.length) console.log('could not fetch live (zipped anyway): ' + unreachable.join(', '));
    if (!differ.length) { console.log('R2 matches origin/main — no sync zip needed.'); return; }
    for (const d of differ) console.log(`  ${d.h.slice(0, 8)}  ${d.f}`);
    if (DRY) { console.log('--dry-run: nothing written.'); return; }

    if (UPLOAD) {
        console.log(`\nuploading ${differ.length} file(s) to R2 bucket ${R2_BUCKET}:`);
        const bad = differ.filter((d) => !r2Put(d.f, d.buf));
        if (bad.length) fail('NOT live: ' + bad.map((d) => d.f).join(', ') + ' (rerun, or drop --upload to write a zip)');
        console.log('\nall differing files are live on R2 (checked with a random query). No zip needed.');
        return;
    }

    const name = 'ENTROPY_WARS_SYNC_' + stamp();
    const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-sync-'));
    const folder = path.join(stage, name);
    fs.mkdirSync(folder);
    for (const d of differ) fs.writeFileSync(path.join(folder, d.f), d.buf);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const zipPath = path.join(OUT_DIR, name + '.zip');
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    // NOT `zip -j`: -j drops the folder and a single file unzips loose.
    execFileSync('zip', ['-q', '-r', '-X', zipPath, name], { cwd: stage });
    fs.rmSync(stage, { recursive: true, force: true });

    const entries = execFileSync('unzip', ['-Z1', zipPath]).toString().split('\n').filter(Boolean);
    const bad = entries.filter((e) => e !== name + '/' && !e.startsWith(name + '/'));
    if (bad.length) fail('zip has entries outside ' + name + '/: ' + bad.join(', '));
    console.log(`\nwrote ${zipPath}  (${differ.length} file(s), all inside ${name}/)`);
    console.log('Tell mondo: upload only the newest sync zip; older ones can be skipped.');
}

main();
