#!/usr/bin/env node
// tools/deploy.js — one-command R2 deploy with automatic cache-busting.
//
// Replaces the manual workflow (upload each file in the R2 dashboard, remember
// to hand-bump the ?v= token, remember to redeploy index.html) with:
//
//     npm run deploy                  # deploy every git-modified R2 file
//     npm run deploy -- battle.js     # deploy specific file(s)
//     npm run deploy -- --all         # deploy every R2-hosted file
//     npm run deploy -- --dry-run     # show the plan, change nothing
//
// What it does, in order:
//   1. Works out which R2-hosted files to ship (args, --all, or git status).
//      The R2 file set is parsed live from index.html's cdn.entropywars.net
//      URLs, filtered to files that exist in the repo (react bundles and
//      THREE.MeshLine.js live only in the bucket).
//   2. Syntax-checks every .js being shipped (node --check). Aborts on error.
//   3. Bumps the shared ?v= token in index.html (one global replace — the
//      assets are immutable-cached, so an upload does NOTHING without this).
//   4. Uploads each file with wrangler (`npx wrangler r2 object put`). Needs
//      EW_R2_BUCKET (or --bucket <name>) and a wrangler login. Without either
//      it still bumps the token and prints a manual-upload checklist instead.
//   5. Reminds you: index.html is served by RENDER — redeploy it there, and
//      sync the repo so future sessions start from what's live.
//
// Zero dependencies. Node 18+.

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const REPO_ROOT = __dirname;
const INDEX_HTML = path.join(REPO_ROOT, 'index.html');
const CDN_HOST = 'cdn.entropywars.net';

const CONTENT_TYPES = {
    '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
    '.glb': 'model/gltf-binary', '.json': 'application/json',
    '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
};

function fail(msg) { console.error('deploy: ' + msg); process.exit(1); }

// ── R2 file set: every root-level cdn.entropywars.net asset index.html loads ──
function r2FilesFromIndex(html) {
    const re = new RegExp('https://' + CDN_HOST.replace(/\./g, '\\.') + '/([A-Za-z0-9_.-]+)\\?v=', 'g');
    const found = new Set();
    let m;
    while ((m = re.exec(html))) found.add(m[1]);
    return [...found];
}

// ── Version token ────────────────────────────────────────────────────────────
// Tokens look like `20260728e-cors`: YYYYMMDD + rev letter + optional suffix
// that must survive the bump (the -cors suffix is load-bearing). One token is
// shared by every URL; bumping it invalidates everything at once — intended.
function currentToken(html) {
    const tokens = new Set();
    const re = /\?v=([A-Za-z0-9-]+)/g;
    let m;
    while ((m = re.exec(html))) tokens.add(m[1]);
    if (tokens.size === 0) fail('no ?v= tokens found in index.html');
    if (tokens.size > 1) fail('index.html has MULTIPLE ?v= tokens (' + [...tokens].join(', ') + ') — unify them manually first');
    return [...tokens][0];
}

function nextToken(old) {
    const m = /^(\d{8})([a-z]*)(-.*)?$/.exec(old);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = (m && m[3]) || '';
    if (m && m[1] === today) {
        // Same day: bump the rev letter (e → f, z → za).
        const rev = m[2] || '';
        const bumped = rev && rev[rev.length - 1] !== 'z'
            ? rev.slice(0, -1) + String.fromCharCode(rev.charCodeAt(rev.length - 1) + 1)
            : rev + 'a';
        return today + bumped + suffix;
    }
    return today + 'a' + suffix;
}

// ── Which files to ship ──────────────────────────────────────────────────────
function gitModified() {
    const r = spawnSync('git', ['status', '--porcelain'], { cwd: REPO_ROOT, encoding: 'utf8' });
    if (r.status !== 0) return null; // not a git repo / git unavailable
    return r.stdout.split('\n')
        .map(l => l.slice(3).trim())
        .filter(Boolean);
}

function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const all = args.includes('--all');
    const noUpload = args.includes('--no-upload');
    const bIdx = args.indexOf('--bucket');
    const bucket = bIdx !== -1 ? args[bIdx + 1] : process.env.EW_R2_BUCKET;
    const fileArgs = args.filter((a, i) => !a.startsWith('--') && (bIdx === -1 || i !== bIdx + 1));

    const html = fs.readFileSync(INDEX_HTML, 'utf8');
    const r2Set = r2FilesFromIndex(html);
    const inRepo = f => fs.existsSync(path.join(REPO_ROOT, f));

    let ship;
    if (fileArgs.length) {
        ship = fileArgs.map(f => path.basename(f));
        for (const f of ship) {
            if (!inRepo(f)) fail(`'${f}' does not exist in the repo`);
            if (!r2Set.includes(f)) fail(`'${f}' is not an R2-hosted file (not referenced from index.html with a ?v= token)`);
        }
    } else if (all) {
        ship = r2Set.filter(inRepo);
    } else {
        const mod = gitModified();
        if (mod === null) fail('not a git repo — pass explicit files or --all');
        ship = mod.filter(f => r2Set.includes(f) && inRepo(f));
        if (!ship.length) {
            const nonR2 = mod.filter(f => !r2Set.includes(f));
            console.log('No modified R2-hosted files found.');
            if (nonR2.length) console.log('(modified but not R2-hosted: ' + nonR2.join(', ') + ')');
            process.exit(0);
        }
    }

    // Syntax-check JS before anything ships.
    for (const f of ship.filter(f => f.endsWith('.js'))) {
        try {
            execFileSync(process.execPath, ['--check', path.join(REPO_ROOT, f)], { stdio: ['ignore', 'ignore', 'pipe'] });
        } catch (e) {
            fail(`${f} FAILED node --check — fix before deploying:\n` + (e.stderr || '').toString());
        }
    }

    const oldTok = currentToken(html);
    const newTok = nextToken(oldTok);

    console.log('Plan:');
    console.log('  files:     ' + ship.join(', '));
    console.log('  token:     ?v=' + oldTok + '  →  ?v=' + newTok);
    console.log('  bucket:    ' + (bucket || '(none — manual upload checklist mode)'));
    if (dryRun) { console.log('\n--dry-run: no changes made.'); return; }

    // Bump the token FIRST so even a partial upload run leaves index.html
    // ready to ship — an un-bumped token is the silent failure mode.
    const bumped = html.split('?v=' + oldTok).join('?v=' + newTok);
    fs.writeFileSync(INDEX_HTML, bumped);
    console.log('\n✓ index.html token bumped to ?v=' + newTok);

    let uploaded = 0, failedUploads = [];
    if (bucket && !noUpload) {
        for (const f of ship) {
            const ct = CONTENT_TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
            const r = spawnSync('npx', [
                'wrangler', 'r2', 'object', 'put', `${bucket}/${f}`,
                '--file', path.join(REPO_ROOT, f), '--content-type', ct, '--remote',
            ], { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
            if (r.status === 0) { uploaded++; console.log(`✓ uploaded ${f}`); }
            else {
                failedUploads.push(f);
                console.error(`✗ upload FAILED for ${f}:\n` + (r.stderr || r.stdout || '(no output)').trim().split('\n').slice(-5).join('\n'));
            }
        }
    } else {
        console.log('\nMANUAL UPLOAD CHECKLIST (no bucket configured — set EW_R2_BUCKET or pass --bucket):');
        for (const f of ship) console.log('  [ ] upload ' + f + ' to the R2 bucket root');
    }

    console.log('\nNEXT STEPS:');
    if (failedUploads.length) console.log('  [ ] RETRY failed uploads: ' + failedUploads.join(', '));
    console.log('  [ ] redeploy index.html to Render (it is NOT served from R2)');
    console.log('  [ ] commit + push the repo so future sessions match what is live');
    if (ship.some(f => !f.endsWith('.js') && !f.endsWith('.css'))) {
        console.log('  [ ] NOTE: asset URLs inside JS (sprites/audio/GLB) are not ?v=-tagged —');
        console.log('      renamed-in-place assets need a new filename to cache-bust');
    }
    process.exit(failedUploads.length ? 1 : 0);
}

main();
