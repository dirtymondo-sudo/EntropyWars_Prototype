'use strict';
/* THE ASSET STORE + THE EXTRAS ARRIVE + THE FIELD NOTES EVERYWHERE (2026-09-20)
   - the store: a hit is read off Cache Storage (no fetch) and marks the ledger record `cached`; a miss is
     fetched once and PUT; the index evicts the least recently used past the cap
   - the ledger: a request filed while the population's extras spawn is a background record no gate
     counts; the scene asking for the same file promotes it
   - the loaders: every GLB / OBJ / sheet goes through the store; the VFX file's weapons and sheets too
   - the HQ load card rotates the battle card's field notes */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');

const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const vfx = fs.readFileSync(__dirname + '/three-vfx-effects.js', 'utf8');
const mapjs = fs.readFileSync(__dirname + '/map.js', 'utf8');
const battle = fs.readFileSync(__dirname + '/battle.js', 'utf8');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const css = fs.readFileSync(__dirname + '/styles-base.css', 'utf8');

function fn(src, name) {
    const i = src.indexOf('function ' + name + '(');
    assert.ok(i >= 0, name + ' exists');
    let depth = 0, j = src.indexOf('{', i);
    for (; j < src.length; j++) { if (src[j] === '{') depth++; else if (src[j] === '}') { depth--; if (depth === 0) break; } }
    return src.slice(i, j + 1) + '\n';
}

function sandbox() {
    const store = {};              // Cache Storage
    const ls = {};                 // localStorage
    const log = { fetched: [], put: [], deleted: [] };
    const mkRes = (url, body) => ({ ok: true, status: 200, type: 'cors', headers: { get: k => k === 'content-length' ? String(body.length) : null }, clone() { return mkRes(url, body); }, arrayBuffer: () => Promise.resolve(Buffer.from(body).buffer), text: () => Promise.resolve(body), blob: () => Promise.resolve({ size: body.length, body }) });
    const cache = {
        match: url => Promise.resolve(store[url] ? mkRes(url, store[url]) : undefined),
        put: (url, res) => { log.put.push(url); return res.text().then(t => { store[url] = t; }); },
        delete: url => { log.deleted.push(url); delete store[url]; return Promise.resolve(true); },
    };
    const ctx = {
        window: { isSecureContext: true }, navigator: {}, console,
        caches: { open: () => Promise.resolve(cache), delete: () => Promise.resolve(true) },
        fetch: (url) => { log.fetched.push(url); return Promise.resolve(mkRes(url, 'BODY-' + url)); },
        URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
        localStorage: { getItem: k => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = v; }, removeItem: k => { delete ls[k]; } },
        /* a short timer (the index-save debounce) runs on the microtask queue; the ledger's 60 s stall timer never fires */
        setTimeout: (f, ms) => { if (ms > 5000) return 0; Promise.resolve().then(f); return 1; }, clearTimeout() {},
        performance: { now: () => 0 }, Date: { now: () => ctx._clock },
        Object, JSON, Math, Promise, Error, String, Buffer,
    };
    ctx._clock = 1000;
    vm.createContext(ctx);
    vm.runInContext(
        'var _bgLoadDepth = 0;\n'
        + renderer.slice(renderer.indexOf('var AL_SETTLE_MS = 300'), renderer.indexOf('function _texLanded() {'))
        + '\n', ctx);
    ctx._log = log; ctx._store = store; ctx._ls = ls;
    return ctx;
}

test('a hit is read off the store and marks the record cached; a miss is fetched once and PUT', async () => {
    const c = sandbox();
    c._store['https://cdn/a.png'] = 'OLD-A';
    const rec1 = c._alTrack('texture', 'https://cdn/a.png');
    const r1 = await c._asFetch('https://cdn/a.png', { rec: rec1 });
    assert.equal(await r1.text(), 'OLD-A');
    assert.equal(rec1.cached, true, 'a hit marks the record');
    assert.deepEqual(c._log.fetched, [], 'a hit never touches the network');
    const rec2 = c._alTrack('model', 'https://cdn/b.glb');
    const r2 = await c._asFetch('https://cdn/b.glb', { rec: rec2 });
    assert.equal(await r2.text(), 'BODY-https://cdn/b.glb');
    assert.equal(rec2.cached, false);
    assert.deepEqual(c._log.fetched, ['https://cdn/b.glb']);
    assert.deepEqual(c._log.put, ['https://cdn/b.glb'], 'a miss is PUT');
    for (let i = 0; i < 4; i++) await new Promise(r => setImmediate(r));
    assert.equal(c._store['https://cdn/b.glb'], 'BODY-https://cdn/b.glb');
    const st = c._asStats();
    assert.equal(st.hits, 1); assert.equal(st.misses, 1);
    assert.ok(JSON.parse(c._ls.ew_asset_index)['https://cdn/b.glb'], 'the index records the file');
});

test('the index evicts the least recently used past the cap', async () => {
    const c = sandbox();
    vm.runInContext('AS_CAP_BYTES = 100;', c);
    const cache = await c._asOpen();
    c._asTouch('u1', 60); c._clock += 10; c._asTouch('u2', 30); c._clock += 10; c._asTouch('u3', 30);
    // touch u1 again: it is the most recent now
    c._clock += 10; c._asTouch('u1', 60);
    c._asEvict(cache);
    await new Promise(r => setImmediate(r));
    assert.ok(c._log.deleted.indexOf('u2') >= 0, 'the oldest goes first');
    assert.ok(c._log.deleted.indexOf('u1') < 0, 'the most recently used stays');
    assert.ok(c._asStats().bytes <= 100);
});

test('the store is refused where it cannot live, and the loaders take their direct paths', () => {
    const c = sandbox();
    c.window.EW_NO_ASSET_STORE = true;
    assert.equal(c._asAvailable(), false);
    delete c.window.EW_NO_ASSET_STORE;
    c.window.isSecureContext = false;
    assert.equal(c._asAvailable(), false);
    c.window.isSecureContext = true;
    assert.equal(c._asAvailable(), true);
    assert.ok(/if \(!_asAvailable\(\)\) \{ new THREE\.GLTFLoader\(\)\.load\(_asNetUrl\(u\), done, undefined, fail\); return; \}/.test(fn(renderer, '_asGltf')));
    assert.ok(/if \(!_asAvailable\(\)\) \{ new THREE\.OBJLoader\(\)\.load\(url, onLoad, undefined, onError\); return; \}/.test(fn(renderer, '_asObj')));
    assert.ok(/GLTFLoader\(\)\.parse\(buf, _asBasePath\(url\), done, fail\)/.test(fn(renderer, '_asGltf')), 'a GLB is parsed from the store\'s bytes');
});

test('a background record (the extras) is skipped by every gate until the scene asks for the file', () => {
    const c = sandbox();
    const G = c._alGateOpen('room');
    vm.runInContext('_bgLoadDepth = 1;', c);
    const bg = c._alTrack('model', 'https://cdn/extra.glb');
    vm.runInContext('_bgLoadDepth = 0;', c);
    assert.equal(bg.bg, true);
    assert.equal(G.total, 0, 'the gate never counted the extra');
    const scene = c._alTrack('model', 'https://cdn/prop.glb');
    assert.equal(scene.bg, false);
    assert.equal(G.total, 1);
    c._alJoin(bg);   // the scene on screen asks for the same rig
    assert.equal(bg.bg, false); assert.equal(G.total, 2, 'promoted: the gate waits for it now');
    const G2 = c._alGateOpen('battle', { adoptLive: true });
    assert.equal(G2.total, 2);
    scene.settle(true); bg.settle(true);
    assert.equal(G.progress().cached, 0);
});

test('every loader goes through the store — the renderer\'s three, the foliage, the VFX file\'s weapons and sheets', () => {
    assert.ok(/_asGltf\(requestUrl, function \(gltf\) \{/.test(fn(renderer, '_loadUnitGLB')), 'the unit GLB loader');
    assert.ok(/_asGltf\(reqUrl, loaded, err, \{ rec: rec \}\);/.test(fn(renderer, '_loadMiscModel')) && /_asObj\(reqUrl, loaded, err, \{ rec: rec \}\);/.test(fn(renderer, '_loadMiscModel')), 'the misc loader, GLB and OBJ');
    assert.ok(/_asObj\(\s*\/\/ THE ASSET STORE/.test(fn(renderer, '_loadFoliageModel')), 'the foliage OBJs');
    assert.ok(/if \(_asAvailable\(\) && !\/\^\(data\|blob\):\/i\.test\(String\(src\)\)\) \{/.test(fn(renderer, '_texFetch')), 'a sheet is fetched through the store and decoded from a blob URL');
    assert.ok(renderer.includes("assetGltf: function (url, onLoad, onError, o) { return _oneFileGltf(url, onLoad, onError, o); }"), 'the API (THE ONE LOADER PER FILE, 2026-09-24: through the misc cache\'s entry for the URL)');
    assert.ok(/_asGltf\(url, function \(gltf\) \{/.test(fn(renderer, '_oneFileGltf')), 'the shared entry still loads through the store');
    assert.ok(/if \(_viaStore\) TR\.assetGltf\(reqUrl, _onGltf, _onFail, \{ rec: rec \}\);/.test(fn(vfx, '_wpnLoad')), 'the weapon GLBs');
    assert.ok(/TRl\.assetTexture\(url, null, null\)/.test(fn(vfx, '_loadCachedTex')), 'the VFX sheets');
    assert.ok(renderer.includes("window._ewAssetStore = { stats: _asStats, clear: _asClear, quota: function () { return _asQuotaRead(); }, manifest: function () { return _asManLoad(); } };"), 'the dev read');
});

test('the extras arrive by a door once their rig lands, never holding the card', () => {
    const src = fn(renderer, '_hqSpawnRounds');
    assert.ok(/_bgLoadDepth\+\+;[\s\S]*?pop\.draw\.forEach/.test(src), 'still under the background flag');
    assert.ok(/var hot = !murl \|\| !!\(_unitGlbCache\[murl\] && _unitGlbCache\[murl\]\.root\)/.test(src), 'a hot rig stands at once');
    assert.ok(/_loadUnitGLB\(murl, function \(\) \{\s*if \(_hq !== H\) return;/.test(src), 'a cold rig spawns on landing, guarded by the room');
    assert.ok(/spawnAt\(d\.id, rk, g, by, \{ line: line, sub: sub, arriving: true, group: d\.group || null \}\);\s*if \(ch && by\.rec\) _hqRoundsSwing\(by\.rec, 1600\);/.test(src), 'it comes in by a door that swings (+ its group, 2026-09-21)');
    assert.ok(/bg: \(typeof _bgLoadDepth === 'number' && _bgLoadDepth > 0\)/.test(fn(renderer, '_alTrack')), 'the record is background');
});

test('the HQ load card carries the field notes and says what came from the store', () => {
    assert.ok(html.includes('<div id="hqLoadHint" class="ls-hint hq-load-hint">'), 'the hint box in #hqLoad');
    assert.ok(/\?v=\d{8}[a-z0-9-]*-cors/.test(html) && !html.includes('?v=20260920-ci-green-01-cors'), 'the token moved');
    assert.ok(css.includes('.hq-load.walk .hq-load-hint { display: none; }'), 'the walk-blink shows no notes');
    assert.ok(/function _lsHintPool\(\)/.test(battle) && battle.includes('window._lsHintPool = _lsHintPool;') && battle.includes('const hintPool = _lsHintPool();'), 'the battle card exposes and uses the pool');
    const m = fn(mapjs, '_hqLoadNotesPool');
    assert.ok(/window\.doorSiteFile\(site\)/.test(m) && /window\._lsHintPool\(\)/.test(m) && /roomDef\.desc/.test(m), 'the room\'s notes lead the pool');
    const p = fn(mapjs, '_hqLoadProgressStart');
    assert.ok(/from the store/.test(p) && /_hqLoadSetHint\(hintBox, notes\[noteIdx % notes\.length\]\)/.test(p), 'the card rotates the notes and counts the store');
});

/* ── THE ASSETS (OPEN_WORLD_PLAN Phase 9, 2026-09-27): the manifest, the optimized siblings, the cap by quota,
      DOWNLOAD THIS PLACE, and the two tools ── */
const CDN = 'https://cdn.entropywars.net/';
function withManifest(files) {
    const c = sandbox();
    c._asManAdopt({ v: 1, base: CDN, files });
    vm.runInContext('_asManDone = true;', c);
    return c;
}

test('the manifest: a GLB with a listed .opt.glb loads the sibling; the kill-switch, a missing decoder and an off-bucket url keep the original', () => {
    const c = withManifest({ 'Assets/misc/Big Chair.glb': [16000000, 'aaaaaaaaaaaa'], 'Assets/misc/Big Chair.opt.glb': [2000000, 'bbbbbbbbbbbb'], 'Assets/misc/lamp.glb': [90000, 'cccccccccccc'] });
    const chair = CDN + 'Assets/misc/Big%20Chair.glb';
    assert.equal(c._asResolve(chair), chair, 'no MeshoptDecoder on the page: the original');
    c.MeshoptDecoder = { ready: Promise.resolve() }; c.WebAssembly = {};
    assert.equal(c._asResolve(chair), CDN + 'Assets/misc/Big%20Chair.opt.glb', 'the key is the decoded bucket path; the url keeps its encoding');
    assert.equal(c._asResolve(CDN + 'Assets/misc/lamp.glb'), CDN + 'Assets/misc/lamp.glb', 'no sibling listed');
    assert.equal(c._asResolve('https://elsewhere/x.glb'), 'https://elsewhere/x.glb');
    assert.equal(c._asResolve(CDN + 'Assets/misc/Big%20Chair.opt.glb'), CDN + 'Assets/misc/Big%20Chair.opt.glb', 'a sibling never resolves twice');
    c.window.EW_NO_OPT_ASSETS = true;
    assert.equal(c._asResolve(chair), chair, 'the kill-switch');
    delete c.window.EW_NO_OPT_ASSETS;
    assert.equal(c._asBytesOf(chair), 2000000, 'a place is sized by what it will actually fetch');
    assert.equal(c._asNetUrl(CDN + 'Assets/misc/lamp.glb'), CDN + 'Assets/misc/lamp.glb?h=cccccccccccc', 'the sha rides as ?h=');
    assert.equal(c._asNetUrl('https://elsewhere/x.png'), 'https://elsewhere/x.png');
});

test('the manifest: a file is fetched as ?h=<sha>, stored under its plain url with the sha, re-fetched when the sha changes, sized by the manifest', async () => {
    const lamp = CDN + 'Assets/misc/lamp.glb';
    const c = withManifest({ 'Assets/misc/lamp.glb': [90000, 'cccccccccccc'] });
    const r = await c._asFetch(lamp, {});
    for (let i = 0; i < 4; i++) await new Promise(r => setImmediate(r));
    assert.deepEqual(c._log.fetched, [lamp + '?h=cccccccccccc']);
    assert.deepEqual(c._log.put, [lamp], 'the store key has no query');
    let row = JSON.parse(c._ls.ew_asset_index)[lamp];
    assert.equal(row[2], 'cccccccccccc', 'the row remembers the sha it was stored under');
    await c._asFetch(lamp, {});
    assert.equal(c._log.fetched.length, 1, 'same sha: a hit');
    c._asManAdopt({ base: CDN, files: { 'Assets/misc/lamp.glb': [95000, 'dddddddddddd'] } });
    await c._asFetch(lamp, {});
    for (let i = 0; i < 4; i++) await new Promise(r => setImmediate(r));
    assert.deepEqual(c._log.fetched, [lamp + '?h=cccccccccccc', lamp + '?h=dddddddddddd'], 'replaced in place on R2: fetched again');
    row = JSON.parse(c._ls.ew_asset_index)[lamp];
    assert.equal(row[2], 'dddddddddddd');
    /* no content-length from the CDN: the manifest's bytes stand in */
    const c2 = withManifest({ 'Assets/misc/big.glb': [123456, 'eeeeeeeeeeee'] });
    c2.fetch = (url) => { c2._log.fetched.push(url); const res = { ok: true, status: 200, type: 'cors', headers: { get: () => null }, clone() { return res; }, text: () => Promise.resolve('X'), arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) }; return Promise.resolve(res); };
    await c2._asFetch(CDN + 'Assets/misc/big.glb', {});
    for (let i = 0; i < 4; i++) await new Promise(r => setImmediate(r));
    assert.equal(c2._asStats().bytes, 123456);
    assert.deepEqual(c2._asStats().manifest, { files: 1, opt: 0, made: null });
});

test('an optimized sibling that fails to parse falls back to the original once; three failures stop asking for siblings', async () => {
    const c = withManifest({ 'Assets/a.glb': [10, 'a1'], 'Assets/a.opt.glb': [2, 'a2'], 'Assets/b.glb': [10, 'b1'], 'Assets/b.opt.glb': [2, 'b2'] });
    c.MeshoptDecoder = {}; c.WebAssembly = {};
    /* a fresh ArrayBuffer per body (a small Buffer's .buffer is Node's shared pool) */
    const mk = body => ({ ok: true, status: 200, type: 'cors', headers: { get: () => String(body.length) }, clone() { return mk(body); }, text: () => Promise.resolve(body), arrayBuffer: () => Promise.resolve(new TextEncoder().encode(body).buffer) });
    c.fetch = url => { c._log.fetched.push(url); return Promise.resolve(mk('BODY-' + url)); };
    const disk = {};
    c.caches = { open: () => Promise.resolve({ match: u => Promise.resolve(disk[u] ? mk(disk[u]) : undefined), put: (u, r) => r.text().then(t => { disk[u] = t; }), delete: () => Promise.resolve(true) }) };
    const parsed = [];
    c.THREE = { GLTFLoader: function () { this.parse = (buf, base, ok, fail) => { const t = Buffer.from(buf).toString(); parsed.push(t); if (/\.opt\.glb/.test(t)) fail(new Error('decoder')); else ok({ scene: t }); }; } };
    c.console = { warn() {}, log() {} };
    const got = await new Promise((ok, bad) => c._asGltf(CDN + 'Assets/a.glb', ok, bad, {}));
    assert.equal(got.scene, 'BODY-' + CDN + 'Assets/a.glb?h=a1', 'the original, after the sibling failed');
    assert.deepEqual(parsed, ['BODY-' + CDN + 'Assets/a.opt.glb?h=a2', 'BODY-' + CDN + 'Assets/a.glb?h=a1']);
    for (let i = 0; i < 2; i++) { await new Promise((ok, bad) => c._asGltf(CDN + 'Assets/b.glb', ok, bad, {})); for (let j = 0; j < 4; j++) await new Promise(r => setImmediate(r)); }
    assert.deepEqual(parsed.slice(2), ['BODY-' + CDN + 'Assets/b.opt.glb?h=b2', 'BODY-' + CDN + 'Assets/b.glb?h=b1', 'BODY-' + CDN + 'Assets/b.opt.glb?h=b2', 'BODY-' + CDN + 'Assets/b.glb?h=b1'], 'the second time off the disk');
    assert.equal(c.window.EW_NO_OPT_ASSETS, true, 'a page whose siblings keep failing stops asking for them');
    assert.equal(c._asStats().optFalls, 3);
});

test('every GLTFLoader gets the MeshoptDecoder (the wrap keeps the class and its prototype)', () => {
    const c = sandbox();
    class GLTFLoader { constructor(m) { this.manager = m; this.meshoptDecoder = null; } setMeshoptDecoder(d) { this.meshoptDecoder = d; return this; } parse() {} }
    c.THREE = { GLTFLoader }; c.MeshoptDecoder = { id: 'dec' };
    assert.equal(c._asWireMeshopt(), true);
    const l = new c.THREE.GLTFLoader('mgr');
    assert.equal(l.meshoptDecoder, c.MeshoptDecoder); assert.equal(l.manager, 'mgr');
    assert.ok(l instanceof GLTFLoader && l instanceof c.THREE.GLTFLoader, 'instanceof holds both ways');
    assert.equal(c._asWireMeshopt(), false, 'wired once');
    assert.ok(/_asWireMeshopt\(\);\n/.test(renderer), 'wired when the renderer loads');
    const iG = html.indexOf('examples/js/loaders/GLTFLoader.js'), iM = html.indexOf('examples/js/libs/meshopt_decoder.js'), iR = html.indexOf('three-renderer.js?v=');
    assert.ok(iG > 0 && iM > iG && iR > iM, 'index.html: GLTFLoader, then the decoder, then the renderer');
    assert.ok(/<link rel="preload" id="ew-asset-manifest" as="fetch" crossorigin="anonymous" href="https:\/\/cdn\.entropywars\.net\/ASSET_MANIFEST\.json\?v=\d{8}[a-z0-9-]*-cors">/.test(html), 'the manifest is preloaded with the token (deploy.js ships it like a script)');
    const man = JSON.parse(fs.readFileSync(__dirname + '/ASSET_MANIFEST.json', 'utf8'));
    assert.equal(man.v, 1); assert.equal(typeof man.files, 'object');
});

test('the cap by quota: persistent → min(4 GB, 60 % of the quota); best-effort → 1.5 GB', async () => {
    const c = sandbox();
    const GB = 1073741824;
    assert.equal(c._asCapFor({ persisted: true, quota: 100 * GB }), 4096 * 1048576);
    assert.equal(c._asCapFor({ persisted: true, quota: 5 * GB }), Math.floor(5 * GB * 0.6));
    assert.equal(c._asCapFor({ persisted: false, quota: 100 * GB }), 1536 * 1048576);
    assert.equal(c._asCapFor(null), 1536 * 1048576);
    c.navigator.storage = { persisted: () => Promise.resolve(true), estimate: () => Promise.resolve({ quota: 20 * GB, usage: GB }) };
    await c._asQuotaRead();
    const st = c._asStats();
    assert.equal(st.capBytes, 4096 * 1048576); assert.equal(st.persisted, true); assert.equal(st.quota, 20 * GB);
    assert.ok(/navigator\.storage\.persist\(\)\.then\(function \(g\) \{ return _asQuotaRead\(g\); \}/.test(fn(renderer, '_asOpen')), 'asked when the store opens');
});

test('DOWNLOAD THIS PLACE: a zone\'s parts and the rooms they absorb, onto the disk; what is there already is counted, not fetched', async () => {
    const pre = renderer.slice(renderer.indexOf('    var _asPreQ = [], _asPreN = 0, _asPreSeen = {};'), renderer.indexOf('    /* how much of a zone is on the disk right now'));
    const fetched = [];
    const ctx = {
        window: {}, console, Object, JSON, Math, Promise, String, Date,
        DOOR_HQ: { world: { zones: { city: { label: 'THE CITY', parts: { downtown: { absorbs: { alley: {} } }, strip: {} } } } } },
        _hqData: () => ({
            catalogue: { chair: { file: 'chair.glb' }, leaf: { file: 'door.glb' }, door_gun: { file: 'gun.glb' } },
            textures: { stone: 'stone.jpg' }, assets: { textures: CDN + 'tex/' },
            rooms: { downtown: { props: [{ key: 'chair' }], doors: [{ leaf: 'leaf' }], shell: { wall: 'stone' } }, alley: { props: [{ key: 'chair' }] }, strip: { props: [] } },
        }),
        _hqModelUrl: e => CDN + 'm/' + e.file,
        _hqBookRead: id => id === 'strip' ? [{ lane: 'r', url: CDN + 'rig.glb' }] : [],
        _asAvailable: () => true, _asHas: u => u === CDN + 'm/gun.glb', _asBytesOf: u => 100,
        _asManReady: () => Promise.resolve(), _asResolve: u => u,
        _asFetch: u => { fetched.push(u); return Promise.resolve({ blob: () => Promise.resolve() }); },
        _miscModelCache: {}, _loadMiscModel() {}, _hqTex() {},
    };
    vm.createContext(ctx);
    vm.runInContext(pre + fn(renderer, '_hqZoneState'), ctx);
    assert.deepEqual(ctx._hqZoneRooms('city'), ['downtown', 'alley', 'strip']);
    const idle = ctx._hqZoneState('city');
    assert.equal(idle.idle, true); assert.equal(idle.total, 5, 'the chair (twice: once), the leaf, the gun, the wall sheet (the 4 defaults have no file), the rig');
    assert.equal(idle.onDisk, 1);
    const job = ctx._hqWarmZone('city');
    assert.equal(job.label, 'THE CITY'); assert.equal(job.total, 5); assert.equal(job.onDisk, 1); assert.equal(job.bytes, 500);
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    assert.equal(job.done, 4); assert.equal(job.doneBytes, 400);
    assert.equal(fetched.length, 4, 'two at a time, every missing file once');
    assert.ok(fetched.indexOf(CDN + 'm/gun.glb') < 0, 'already on the disk: not fetched');
    ctx.window.EW_PERF_LOW = true;
    assert.equal(ctx._asPrefetch(CDN + 'x.glb'), false, 'a phone warms nothing on its own');
    assert.equal(ctx._asPrefetch(CDN + 'x.glb', { force: true }), true, 'but the button is the player asking');
    assert.equal(ctx._hqZoneState('nowhere'), null);
    assert.ok(renderer.includes('warmZone: function (zoneId) { return _hqWarmZone('), 'the API');
    const m = mapjs.slice(mapjs.indexOf('window._buildWorldDiskHTML = function'), mapjs.indexOf('function _renderMainMenuSettings()'));
    assert.ok(/ThreeRenderer\.hq\.warmZone\(\)/.test(m) && /Download this place: /.test(m) && /WORLD ON DISK: /.test(m) && /window\._ewAssetStore\.clear\(\)/.test(m), 'the settings row: the size line, CLEAR and the button');
    assert.ok(/window\._buildWorldDiskHTML\('window\._openMainMenuSettings\(\);'\)/.test(fn(mapjs, '_renderMainMenuSettings')), 'in the settings sheet (the pause menu renders the same body)');
});

test('the tools: manifest-assets builds, merges and counts the siblings; optimize-assets names its results', () => {
    const os = require('os'), path = require('path');
    const M = require('./manifest-assets.js'), O = require('./optimize-assets.js');
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-man-'));
    fs.mkdirSync(path.join(d, 'misc'), { recursive: true });
    fs.writeFileSync(path.join(d, 'misc', 'Big Chair.glb'), Buffer.alloc(1000));
    fs.writeFileSync(path.join(d, 'misc', 'Big Chair.opt.glb'), Buffer.alloc(200));
    fs.writeFileSync(path.join(d, 'misc', 'notes.txt'), 'x');
    const files = M.scan(d, 'Assets');
    assert.deepEqual(Object.keys(files).sort(), ['Assets/misc/Big Chair.glb', 'Assets/misc/Big Chair.opt.glb'], 'bucket paths, spaces kept, only asset kinds');
    assert.equal(files['Assets/misc/Big Chair.glb'][0], 1000); assert.match(files['Assets/misc/Big Chair.glb'][1], /^[0-9a-f]{12}$/);
    const prev = { files: { 'Assets/misc/old.glb': [5, 'x'], 'Sounds/a.mp3': [7, 'y'] } };
    const merged = M.build(files, prev, 'Assets/', true);
    assert.deepEqual(Object.keys(merged.files), ['Assets/misc/Big Chair.glb', 'Assets/misc/Big Chair.opt.glb', 'Sounds/a.mp3'], 'a merge replaces the scanned prefix and keeps the rest');
    assert.equal(merged.base, CDN);
    assert.deepEqual(M.summary(merged), { files: 3, bytes: 1207, glb: 1, opt: 1, saved: 800, lod: 0 });
    fs.rmSync(d, { recursive: true, force: true });
    assert.equal(O.optName('a/B C.glb'), 'a/B C.opt.glb');
    assert.equal(O.isSource('x.opt.glb'), false); assert.equal(O.isSource('x.GLB'), true);
    assert.equal(O.targetFor('/in/misc/a.glb', '/in', '/out'), path.join('/out', 'misc', 'a.opt.glb'));
    assert.equal(O.parseArgs(['d']).size, 2048, 'every Meshy sheet keeps its size unless asked');
    const src = fs.readFileSync(__dirname + '/optimize-assets.js', 'utf8');
    assert.ok(!/fn\.quantize\(|fn\.meshopt\(|fn\.instance\(|fn\.join\(|fn\.flatten\(/.test(src), 'no quantize (three r128 reads it raw on the CPU), no instancing, no join/flatten');
    assert.equal((src.match(/fn\.simplify\(/g) || []).length, 1, 'simplify only in the LOD levels (Phase 10, hq-lod.test.js), never on the file the game draws up close');
    assert.ok(src.indexOf('fn.simplify(') > src.indexOf('async function lodOne('), 'inside lodOne');
    const pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8'));
    assert.equal(pkg.scripts.optimize, 'node optimize-assets.js'); assert.equal(pkg.scripts.manifest, 'node manifest-assets.js');
    assert.ok(!pkg.dependencies['@gltf-transform/core'] && !pkg.dependencies.sharp, 'the tools\' deps stay out of the server\'s install');
});
