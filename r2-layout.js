#!/usr/bin/env node
/* r2-layout.js — THE R2 LAYOUT tool (docs/notes/r2-layout-plan.md, mondo 2026-11-04: "sounds like a good plan, go ahead").
   Repo-only dev tooling like sync-zip.js: never loaded by the game. Talks to the Cloudflare R2 REST object API through curl
   (curl honours HTTPS_PROXY; the cloud proxy adds the R2 Admin token — the token is never in a file or in chat).

   node r2-layout.js --list [bucket]              list a bucket into r2-layout-<bucket>.json in the scratch dir (prints a summary)
   node r2-layout.js --archive <keys.json> [--dry-run]
        each key: copy ewmusicsfx/<key> → dirtymondo/archive/2026-11/<key>, read it back + compare sha256,
        THEN delete it from ewmusicsfx. Only for the orphan lists mondo OK'd (plan §5).
   node r2-layout.js --copy <wave> [--dry-run]    copy every ewmusicsfx key under the wave's old prefixes to its new key
        (r2-layout.json waves), verified live through cdn.entropywars.net with a random query. Idempotent: a new key that
        already holds the same bytes (etag = md5) is skipped. OLD KEYS ARE NEVER TOUCHED by --copy.
   node r2-layout.js --verify <wave>              every old key under the wave has a new key with the same md5
   node r2-layout.js --manifest [--dry-run]       rewrite ASSET_MANIFEST.json's `files` keys and `alt` map through sprites.js
        EW_ASSET_MOVES (the bytes don't change, so no re-hash) and check every rewritten key is on R2. Run it in each flip PR:
        a manifest still keyed by the old paths silently stops every .opt.glb swap and ?h= bust.

   Options: --jobs N (parallel transfers, default 8), --tmp <dir>.
   r2-layout.json (repo root) holds the waves: { "<wave>": [["old/prefix/", "new/prefix/"], ...] }. The game's own copy of the
   flipped prefixes is sprites.js EW_ASSET_MOVES; a wave's flip PR adds its rows there. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const ACCT = process.env.CLOUDFLARE_ACCOUNT_ID || 'b2608d464c04fdeec48ba91f04b8aeb7';
const GAME = 'ewmusicsfx', PRIVATE = 'dirtymondo', ARCHIVE = 'archive/2026-11/';
const CDN = 'https://cdn.entropywars.net/';
const api = (bucket) => `https://api.cloudflare.com/client/v4/accounts/${ACCT}/r2/buckets/${bucket}/objects`;
const enc = (key) => key.split('/').map(encodeURIComponent).join('/');
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const JOBS = +opt('--jobs', 8) || 8;
const TMP = opt('--tmp', fs.mkdtempSync(path.join(os.tmpdir(), 'r2-layout-')));

function curl(a, o) {
    return new Promise((ok) => execFile('curl', a, Object.assign({ maxBuffer: 1 << 28, encoding: 'buffer' }, o || {}),
        (err, out, errOut) => ok({ err, out: out || Buffer.alloc(0), errOut: String(errOut || '') })));
}
async function retry(fn, n = 4) { let r; for (let i = 0; i < n; i++) { r = await fn(); if (r.ok) return r; await new Promise(s => setTimeout(s, 1000 * 2 ** i)); } return r; }
const hashFile = (f, alg) => crypto.createHash(alg).update(fs.readFileSync(f)).digest('hex');

async function list(bucket, prefix) {
    const out = []; let cur = null;
    for (;;) {
        const u = api(bucket) + '?per_page=1000' + (prefix ? '&prefix=' + encodeURIComponent(prefix) : '') + (cur ? '&cursor=' + encodeURIComponent(cur) : '');
        const r = await retry(async () => { const x = await curl(['-sS', '--max-time', '120', u]); try { const j = JSON.parse(x.out.toString()); return { ok: j.success, j }; } catch (e) { return { ok: false }; } });
        if (!r.ok) throw new Error('listing refused: ' + bucket + ' ' + JSON.stringify((r.j || {}).errors || ''));
        for (const o of r.j.result) out.push({ key: o.key, size: o.size, etag: o.etag, type: (o.http_metadata || {}).contentType || 'application/octet-stream' });
        const ri = r.j.result_info || {}; cur = ri.cursor;
        if (!ri.is_truncated || !cur) break;
    }
    return out;
}
async function head(bucket, key) {   // the listing row of one key (null when absent)
    const rows = await list(bucket, key);
    return rows.find(r => r.key === key) || null;
}
async function get(bucket, key, file) {
    return retry(async () => {
        const x = await curl(['-sS', '-f', '--max-time', '900', '-o', file, api(bucket) + '/' + enc(key)]);
        return { ok: !x.err && fs.existsSync(file), msg: x.errOut };
    });
}
async function put(bucket, key, file, type) {
    return retry(async () => {
        const x = await curl(['-sS', '--max-time', '900', '-X', 'PUT', '-H', 'Content-Type: ' + type, '--data-binary', '@' + file, api(bucket) + '/' + enc(key)]);
        const s = x.out.toString(); return { ok: /"success":\s*true/.test(s), msg: s.slice(0, 300) + x.errOut };
    });
}
async function del(bucket, key) {
    return retry(async () => {
        const x = await curl(['-sS', '--max-time', '120', '-X', 'DELETE', api(bucket) + '/' + enc(key)]);
        const s = x.out.toString(); return { ok: /"success":\s*true/.test(s), msg: s.slice(0, 300) };
    });
}
async function live(key, file) {   // the CDN copy, random query (never the ?v= token)
    return retry(async () => {
        const x = await curl(['-sS', '-f', '--compressed', '--max-time', '900', '-o', file, CDN + enc(key) + '?r2l' + crypto.randomBytes(5).toString('hex')]);
        return { ok: !x.err && fs.existsSync(file) };
    });
}
async function pool(items, fn) {
    let i = 0, bad = 0; const n = items.length;
    await Promise.all(Array.from({ length: Math.min(JOBS, n) }, async () => {
        while (i < n) { const it = items[i++]; try { if (!(await fn(it))) bad++; } catch (e) { bad++; console.error('  ERROR ' + (it.key || it) + ': ' + e.message); } }
    }));
    return bad;
}
let seq = 0; const tmpf = () => path.join(TMP, 'f' + (seq++));

async function archiveMode() {
    const keys = JSON.parse(fs.readFileSync(opt('--archive'), 'utf8'));
    const rows = new Map((await list(GAME)).map(r => [r.key, r]));
    const todo = keys.map(k => rows.get(k) || { key: k, missing: true });
    console.log(`archive: ${todo.length} keys, ${(todo.reduce((s, r) => s + (r.size || 0), 0) / 1e6).toFixed(1)} MB → ${PRIVATE}/${ARCHIVE}`);
    if (DRY) { todo.slice(0, 20).forEach(r => console.log('  would archive ' + r.key)); return; }
    const log = [];
    const bad = await pool(todo, async (r) => {
        if (r.missing) { console.log('  gone already  ' + r.key); return true; }
        if (r.key.endsWith('/') && !r.size) { const d = await del(GAME, r.key); if (d.ok) log.push([r.key, 0, 'folder-marker']); return d.ok; }   // a 0-byte folder marker: nothing to keep
        const a = tmpf(), b = tmpf();
        try {
            if (!(await get(GAME, r.key, a)).ok) { console.error('  GET failed ' + r.key); return false; }
            const sh = hashFile(a, 'sha256');
            if (!(await put(PRIVATE, ARCHIVE + r.key, a, r.type)).ok) { console.error('  PUT failed ' + r.key); return false; }
            if (!(await get(PRIVATE, ARCHIVE + r.key, b)).ok || hashFile(b, 'sha256') !== sh) { console.error('  ARCHIVE MISMATCH ' + r.key + ' (left in place)'); return false; }
            if (!(await del(GAME, r.key)).ok) { console.error('  DELETE failed ' + r.key + ' (archived, still in place)'); return false; }
            log.push([r.key, r.size, sh]);
            return true;
        } finally { fs.rmSync(a, { force: true }); fs.rmSync(b, { force: true }); }
    });
    const out = path.join(TMP, 'archived.json'); fs.writeFileSync(out, JSON.stringify(log));
    console.log(`archived ${log.length}, failed ${bad}. Log: ${out}`);
    if (bad) process.exit(1);
}

function waveMap(w) {
    const all = JSON.parse(fs.readFileSync(path.join(__dirname, 'r2-layout.json'), 'utf8'));
    if (!all[w]) throw new Error('no wave ' + w + ' in r2-layout.json (have: ' + Object.keys(all).filter(k => !k.startsWith('_')).join(', ') + ')');
    return all[w];
}
function newKey(map, key) {
    let best = null;
    for (const [a, b] of map) if (key.startsWith(a) && (!best || a.length > best[0].length)) best = [a, b];
    return best ? best[1] + key.slice(best[0].length) : null;
}
async function waveRows(w) {
    const map = waveMap(w), rows = await list(GAME);
    const have = new Map(rows.map(r => [r.key, r]));
    const out = [];
    for (const r of rows) {
        if (r.key.endsWith('/')) continue;                  // 0-byte folder markers don't move
        const nk = newKey(map, r.key); if (!nk || nk === r.key) continue;
        out.push(Object.assign({}, r, { to: nk, dest: have.get(nk) || null }));
    }
    return out;
}
// same bytes: md5 etag match; a multipart original's etag ("<md5>-<parts>") can't match a single PUT, so size only (the copy was sha256-checked live)
const same = (src, dst) => !!dst && dst.size === src.size && (dst.etag === src.etag || /-\d+$/.test(String(src.etag)));
async function copyMode() {
    const w = opt('--copy'), rows = await waveRows(w);
    const todo = rows.filter(r => !same(r, r.dest));
    console.log(`wave ${w}: ${rows.length} keys, ${rows.length - todo.length} already copied, ${todo.length} to copy (${(todo.reduce((s, r) => s + r.size, 0) / 1e6).toFixed(1)} MB)`);
    if (DRY) { todo.slice(0, 30).forEach(r => console.log(`  ${r.key}  →  ${r.to}`)); return; }
    const bad = await pool(todo, async (r) => {
        const a = tmpf(), b = tmpf();
        try {
            if (!(await get(GAME, r.key, a)).ok) { console.error('  GET failed ' + r.key); return false; }
            if (!(await put(GAME, r.to, a, r.type)).ok) { console.error('  PUT failed ' + r.to); return false; }
            if (!(await live(r.to, b)).ok || hashFile(b, 'sha256') !== hashFile(a, 'sha256')) { console.error('  LIVE MISMATCH ' + r.to); return false; }
            return true;
        } finally { fs.rmSync(a, { force: true }); fs.rmSync(b, { force: true }); }
    });
    console.log(`copied ${todo.length - bad}, failed ${bad}.`);
    if (bad) process.exit(1);
}
async function verifyMode() {
    const w = opt('--verify'), rows = await waveRows(w);
    const bad = rows.filter(r => !same(r, r.dest));
    bad.slice(0, 40).forEach(r => console.log('  NOT COPIED  ' + r.key + '  →  ' + r.to));
    console.log(`wave ${w}: ${rows.length - bad.length}/${rows.length} new keys hold the same bytes as the old ones.`);
    if (bad.length) process.exit(1);
}
function gameMoves() {
    const src = fs.readFileSync(path.join(__dirname, 'sprites.js'), 'utf8');
    const a = src.indexOf('const EW_ASSET_MOVES = ['), b = a >= 0 ? src.indexOf('];', a) : -1;
    if (a < 0 || b < a) throw new Error('sprites.js has no EW_ASSET_MOVES table');
    return [...src.slice(a, b).matchAll(/\[\s*'(Assets\/[^'<]+)'\s*,\s*'(Assets\/[^']+)'\s*\]/g)].map(m => [m[1], m[2]]);
}
async function manifestMode() {
    const map = gameMoves(), f = path.join(__dirname, 'ASSET_MANIFEST.json'), man = JSON.parse(fs.readFileSync(f, 'utf8'));
    const mv = (k) => newKey(map, k) || k;
    let n = 0;
    const files = {}; for (const k of Object.keys(man.files)) { const nk = mv(k); if (nk !== k) n++; files[nk] = man.files[k]; }
    const alt = {}; for (const k of Object.keys(man.alt || {})) { const nk = mv(k), nv = mv(man.alt[k]); if (nk !== k || nv !== man.alt[k]) n++; alt[nk] = nv; }
    const have = new Set((await list(GAME)).map(r => r.key));
    const miss = Object.keys(files).filter(k => !have.has(k));
    miss.slice(0, 30).forEach(k => console.log('  NOT ON R2  ' + k));
    console.log(`manifest: ${map.length} move rows, ${n} entries rewritten, ${miss.length} rewritten keys missing on R2`);
    if (miss.length) process.exit(1);
    if (DRY) return;
    man.files = files; if (man.alt) man.alt = alt;
    fs.writeFileSync(f, JSON.stringify(man));
    console.log('wrote ' + f);
}
async function listMode() {
    const b = opt('--list') || GAME, rows = await list(b);
    const f = path.join(TMP, 'r2-layout-' + b + '.json'); fs.writeFileSync(f, JSON.stringify(rows));
    console.log(`${b}: ${rows.length} keys, ${(rows.reduce((s, r) => s + r.size, 0) / 1e9).toFixed(2)} GB → ${f}`);
}

(async () => {
    if (args.includes('--archive')) return archiveMode();
    if (args.includes('--copy')) return copyMode();
    if (args.includes('--verify')) return verifyMode();
    if (args.includes('--list')) return listMode();
    if (args.includes('--manifest')) return manifestMode();
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]);
})().catch(e => { console.error('r2-layout: ' + e.message); process.exit(1); });
