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
    assert.ok(/if \(!_asAvailable\(\)\) \{ new THREE\.GLTFLoader\(\)\.load\(url, onLoad, undefined, onError\); return; \}/.test(fn(renderer, '_asGltf')));
    assert.ok(/if \(!_asAvailable\(\)\) \{ new THREE\.OBJLoader\(\)\.load\(url, onLoad, undefined, onError\); return; \}/.test(fn(renderer, '_asObj')));
    assert.ok(/GLTFLoader\(\)\.parse\(buf, _asBasePath\(url\), onLoad, onError\)/.test(fn(renderer, '_asGltf')), 'a GLB is parsed from the store\'s bytes');
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
    assert.ok(renderer.includes("assetGltf: function (url, onLoad, onError, o) { return _asGltf(url, onLoad, onError, o); }"), 'the API');
    assert.ok(/if \(_viaStore\) TR\.assetGltf\(reqUrl, _onGltf, _onFail, \{ rec: rec \}\);/.test(fn(vfx, '_wpnLoad')), 'the weapon GLBs');
    assert.ok(/TRl\.assetTexture\(url, null, null\)/.test(fn(vfx, '_loadCachedTex')), 'the VFX sheets');
    assert.ok(renderer.includes("window._ewAssetStore = { stats: _asStats, clear: _asClear };"), 'the dev read');
});

test('the extras arrive by a door once their rig lands, never holding the card', () => {
    const src = fn(renderer, '_hqSpawnRounds');
    assert.ok(/_bgLoadDepth\+\+;[\s\S]*?pop\.draw\.forEach/.test(src), 'still under the background flag');
    assert.ok(/var hot = !murl \|\| !!\(_unitGlbCache\[murl\] && _unitGlbCache\[murl\]\.root\)/.test(src), 'a hot rig stands at once');
    assert.ok(/_loadUnitGLB\(murl, function \(\) \{\s*if \(_hq !== H\) return;/.test(src), 'a cold rig spawns on landing, guarded by the room');
    assert.ok(/spawnAt\(d\.id, rk, g, by, \{ line: line, sub: sub, arriving: true \}\);\s*if \(ch && by\.rec\) _hqRoundsSwing\(by\.rec, 1600\);/.test(src), 'it comes in by a door that swings');
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
