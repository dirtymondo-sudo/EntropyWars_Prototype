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
//     npm run deploy -- --assets <dir> --prefix Assets/   # upload every .opt.glb under <dir> (optimize-assets.js)
//                                     # to <prefix><its path under dir> — beside its original on R2
//     npm run deploy -- --world <dir>  # THE WORLD FILE (EDITOR_PLAN E0): upload the editor's export (<dir> = the unzipped
//                                     # Assets/World folder) to Assets/World/ and write its id into index.html (_EW_WORLD_ID)
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

const CACHE_CONTROL = 'public, max-age=31536000, immutable';
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

// ── THE ASSETS (OPEN_WORLD_PLAN Phase 9, 2026-09-27): the optimized models beside their originals ──────────
function walkOpt(dir, rel, out) {
    for (const n of fs.readdirSync(dir).sort()) {
        if (n.startsWith('.') || n === 'node_modules') continue;
        const p = path.join(dir, n), r = rel ? rel + '/' + n : n;
        if (fs.statSync(p).isDirectory()) walkOpt(p, r, out);
        else if (/\.opt\.glb$/i.test(n)) out.push({ p, r });
    }
    return out;
}
function deployAssets(dir, prefix, bucket, dryRun) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) fail('--assets: not a folder: ' + dir);
    prefix = String(prefix || '').replace(/\\/g, '/').replace(/^\/+/, '');
    if (prefix && !prefix.endsWith('/')) prefix += '/';
    const list = walkOpt(dir, '', []);
    if (!list.length) fail('--assets: no .opt.glb files under ' + dir + ' (run `npm run optimize -- ' + dir + '` first)');
    console.log(`Assets: ${list.length} .opt.glb → ${bucket || '(no bucket)'}/${prefix}…`);
    if (dryRun || !bucket) {
        for (const f of list) console.log('  [ ] upload ' + f.p + '  as  ' + prefix + f.r);
        if (!bucket) console.log('\n(no bucket configured — set EW_R2_BUCKET or pass --bucket, or upload the list above by hand)');
    } else {
        let bad = 0;
        for (const f of list) {
            const r = spawnSync('npx', ['wrangler', 'r2', 'object', 'put', `${bucket}/${prefix}${f.r}`, '--file', f.p,
                '--content-type', 'model/gltf-binary', '--remote', '--cache-control', CACHE_CONTROL],
                { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
            if (r.status === 0) console.log('✓ ' + prefix + f.r);
            else { bad++; console.error('✗ ' + prefix + f.r + ':\n' + (r.stderr || r.stdout || '').trim().split('\n').slice(-3).join('\n')); }
        }
        if (bad) { console.error(bad + ' upload(s) failed'); process.exit(1); }
    }
    console.log('\nNEXT: `npm run manifest -- <bucket mirror>` (so the game knows the .opt.glb files exist), then `npm run deploy`.');
}

// ── THE WORLD FILE (EDITOR_PLAN.md E0, 2026-09-29): the editor's export → Assets/World/ + index.html's _EW_WORLD_ID ──
// The id is the first 10 hex of world.json's SHA-256 (the editor's EXPORT prints the same); the game fetches
// world.json?w=<id> and each room as rooms/<id>.json?h=<sha>, so a new export reaches players without a rename.
function worldId(buf) { return require('crypto').createHash('sha256').update(buf).digest('hex').slice(0, 10); }
function walkWorld(dir, rel, out) {
    for (const n of fs.readdirSync(dir).sort()) {
        if (n.startsWith('.')) continue;
        const p = path.join(dir, n), r = rel ? rel + '/' + n : n;
        if (fs.statSync(p).isDirectory()) walkWorld(p, r, out);
        else if (/\.(json|bin|png)$/i.test(n)) out.push({ p, r });   // E4: the land's tiles, sea.bin and map (Assets/World/land/)
    }
    return out;
}
function deployWorld(dir, bucket, dryRun) {
    if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) fail('--world: not a folder: ' + dir);
    if (fs.existsSync(path.join(dir, 'Assets', 'World', 'world.json'))) dir = path.join(dir, 'Assets', 'World');   // the unzipped export's root
    const wj = path.join(dir, 'world.json');
    if (!fs.existsSync(wj)) fail('--world: no world.json in ' + dir + ' (unzip the editor\'s export and pass its Assets/World folder)');
    const buf = fs.readFileSync(wj);
    let index; try { index = JSON.parse(buf.toString('utf8')); } catch (e) { fail('--world: world.json is not JSON: ' + e.message); }
    const id = worldId(buf), list = walkWorld(dir, '', []);
    const missing = Object.keys(index.rooms || {}).filter(r => !fs.existsSync(path.join(dir, 'rooms', r + '.json')));
    console.log(`World ${id}: ${list.length} file(s) → ${bucket || '(no bucket)'}/Assets/World/`);
    if (missing.length) console.log('  (rooms listed but not in this folder — they must already be on R2: ' + missing.join(', ') + ')');
    if (dryRun) { for (const f of list) console.log('  [ ] upload ' + f.p + '  as  Assets/World/' + f.r); console.log('\n--dry-run: no changes made.'); return; }
    if (bucket) {
        let bad = 0;
        for (const f of list) {
            const r = spawnSync('npx', ['wrangler', 'r2', 'object', 'put', `${bucket}/Assets/World/${f.r}`, '--file', f.p,
                '--content-type', /\.bin$/i.test(f.r) ? 'application/octet-stream' : /\.png$/i.test(f.r) ? 'image/png' : 'application/json', '--remote', '--cache-control', CACHE_CONTROL],
                { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
            if (r.status === 0) console.log('✓ Assets/World/' + f.r);
            else { bad++; console.error('✗ Assets/World/' + f.r + ':\n' + (r.stderr || r.stdout || '').trim().split('\n').slice(-3).join('\n')); }
        }
        if (bad) fail(bad + ' upload(s) failed — index.html NOT changed');
    } else {
        console.log('\nMANUAL UPLOAD CHECKLIST (no bucket configured — set EW_R2_BUCKET or pass --bucket):');
        for (const f of list) console.log('  [ ] upload ' + f.p + '  as  Assets/World/' + f.r);
    }
    const html = fs.readFileSync(INDEX_HTML, 'utf8'), re = /window\._EW_WORLD_ID = '[^']*';/;
    if (!re.test(html)) fail("index.html has no `window._EW_WORLD_ID = '…';` line");
    fs.writeFileSync(INDEX_HTML, html.replace(re, `window._EW_WORLD_ID = '${id}';`));
    console.log(`\n✓ index.html names world ${id} (window._EW_WORLD_ID) — redeploy index.html to Render.`);
}

function main() {
    const args = process.argv.slice(2);
    const wIdx = args.indexOf('--world');
    if (wIdx !== -1) {
        const bI = args.indexOf('--bucket');
        deployWorld(args[wIdx + 1], bI !== -1 ? args[bI + 1] : process.env.EW_R2_BUCKET, args.includes('--dry-run'));
        return;
    }
    const aIdx = args.indexOf('--assets');
    if (aIdx !== -1) {
        const pIdx = args.indexOf('--prefix'), bI = args.indexOf('--bucket');
        deployAssets(args[aIdx + 1], pIdx !== -1 ? args[pIdx + 1] : '', bI !== -1 ? args[bI + 1] : process.env.EW_R2_BUCKET, args.includes('--dry-run'));
        return;
    }
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
                // 2026-09-20: R2 caches per OBJECT — a file uploaded without this header is edge-DYNAMIC
                // (every player pulls it from origin) and the browser only guesses its freshness.
                '--cache-control', CACHE_CONTROL,
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
        console.log('  [ ] NOTE: asset URLs inside JS (sprites/audio/GLB) are not ?v=-tagged — a file replaced in place');
        console.log('      reaches players once ASSET_MANIFEST.json lists its new hash (npm run manifest), or under a new name');
    }
    process.exit(failedUploads.length ? 1 : 0);
}

main();
