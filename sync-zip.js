#!/usr/bin/env node
// sync-zip.js — writes the CUMULATIVE SYNC ZIP (CLAUDE.md RULE #1, step 3).
//
//   node sync-zip.js              # fetch origin/main, compare R2, write the zip
//   node sync-zip.js --dry-run    # compare only, write nothing
//   node sync-zip.js --out <dir>  # default /mnt/project-files/r2-sync
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

function main() {
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
