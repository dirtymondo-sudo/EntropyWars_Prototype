const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = name => fs.readFileSync(require('node:path').join(__dirname, name), 'utf8');
const renderer = read('three-renderer.js');
function fn(src, name) {
    const start = src.indexOf('function ' + name + '(');
    assert.ok(start >= 0, name);
    let depth = 0, begin = src.indexOf('{', start);
    for (let i = begin; i < src.length; i++) {
        if (src[i] === '{') depth++;
        if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
    }
    throw new Error(name);
}

test('sprite-only match skips base models, hair and fabric downloads', async () => {
    const c = vm.createContext({ window: { EW_DISABLE_3D_UNITS: true },
        getRace3DModel() { throw Error('unexpected model load'); },
        getCharacterAppearanceAssets() { throw Error('unexpected appearance load'); } });
    vm.runInContext(fn(renderer, 'preloadUnitModels'), c);
    const progress = [];
    const result = await c.preloadUnitModels([{race: 'homosapien', appearance: {hair: 'long'}}], (...args) => progress.push(args));
    assert.equal(result.total, 0); assert.deepEqual(progress, [[0, 0]]);
});

test('low mode renders directly without allocating a composer or bloom targets', () => {
    let lights = 0;
    const c = vm.createContext({ window: { EW_PERF_LOW: true }, _filmic: true, FILMIC_EXPOSURE_COMP: 1.22,
        _shadowQuality: 'off', _initLighting() { lights++; },
        THREE: { ACESFilmicToneMapping: 1, PCFSoftShadowMap: 2,
            WebGLRenderTarget() { throw Error('must not allocate render targets'); } } });
    vm.runInContext(fn(read('three-post.js'), 'init'), c);
    const r = { setClearColor() {}, shadowMap: {} };
    c.init(r, {}, 390, 844);
    assert.equal(lights, 1); assert.equal(r.shadowMap.enabled, false);
    assert.equal(r.toneMappingExposure, 1.22);
});

test('model loads serialize on phones and failures release the queue exactly once', () => {
    const tasks = [], started = [], finishes = [];
    const c = vm.createContext({ window: { EW_PERF_LOW: true }, setTimeout: f => tasks.push(f) });
    vm.runInContext('var _mobileModelJobs = [], _mobileModelBusy = false;' + fn(renderer, '_scheduleModelLoad') + fn(renderer, '_pumpModelLoads'), c);
    for (let i = 0; i < 3; i++) c._scheduleModelLoad(done => { started.push(i); finishes.push(done); });
    assert.deepEqual(started, [0]);
    finishes[0](); finishes[0]();
    while (tasks.length) tasks.shift()();
    assert.deepEqual(started, [0, 1]);
    finishes[1](); while (tasks.length) tasks.shift()();
    assert.deepEqual(started, [0, 1, 2]);
    finishes[2](); while (tasks.length) tasks.shift()();
    assert.throws(() => c._scheduleModelLoad(() => { throw Error('loader failure'); }), /loader failure/);
    c._scheduleModelLoad(done => { started.push(3); done(); });
    assert.equal(started.at(-1), 3);
});

test('mobile model textures share a 512px replacement, preserve aspect and leave small maps intact', () => {
    const canvases = [];
    const c = vm.createContext({ window: { EW_PERF_LOW: true }, document: { createElement() {
        const canvas = { getContext: () => ({ drawImage() {} }) }; canvases.push(canvas); return canvas;
    } } });
    vm.runInContext(fn(renderer, '_compactMobileModelTextures'), c);
    const large = { width: 2048, height: 1024 }, small = {width: 128, height: 128};
    const mat = {map: {isTexture: true, image: large}, normalMap: {isTexture: true, image: large}, aoMap: {isTexture: true, image: small}};
    c._compactMobileModelTextures({traverse: cb => cb({material: mat})});
    assert.equal(canvases.length, 1); assert.equal(mat.map.image.width, 512); assert.equal(mat.map.image.height, 256);
    assert.equal(mat.map.image, mat.normalMap.image); assert.equal(mat.aoMap.image, small);
    assert.equal(mat.map.needsUpdate, true);
});

test('tornado boot builds URLs without eager image decodes; mobile keeps 25 frames', () => {
    const s = read('sprites.js');
    const c = vm.createContext({Image() { throw Error('eager image decode'); }});
    vm.runInContext(s.slice(s.indexOf('const TORNADO_FRAME_COUNT'), s.indexOf('function _terrainSvg')), c);
    assert.equal(vm.runInContext('TORNADO_FRAMES.length', c), 99);
    c.window = {EW_PERF_LOW: true}; c._tornadoFrameTextures = []; c._tornadoNativeAspect = 0;
    c.getTexture = url => ({url});
    vm.runInContext(fn(renderer, '_getTornadoFrameTex'), c);
    for (let i = 0; i < 99; i++) c._getTornadoFrameTex(i);
    assert.equal(c._tornadoFrameTextures.filter(Boolean).length, 25);
});

function audioHarness() {
    const listeners = {}, requests = [], voices = [];
    class Audio {
        constructor(src) { this.src = src; this.paused = true; this.volume = 1; }
        addEventListener() {} pause() {} play() { return Promise.resolve(); }
    }
    const ctx = {state: 'suspended', resume() { this.state = 'running'; return Promise.resolve(); },
        decodeAudioData(bytes, done) { done({length: 1024 * 1024, numberOfChannels: 1}); },
        createBufferSource() { const v = {connect() {return this;}, disconnect() {}, start() { voices.push(this); }}; return v; },
        createGain() {return {gain: {}, connect() {}, disconnect() {}};} };
    let now = 10000;
    const c = {console, Audio, AbortController, setTimeout, clearTimeout, setInterval: () => 0,
        performance: {now: () => now}, document: {hidden: false, addEventListener(type, cb) {listeners[type] = cb;}, getElementById() {return null;}, body: {dataset: {}}},
        localStorage: {getItem: () => null}, navigator: {}, state: {audioUnlocked: true, sfxVolume: 1},
        musicVolumeSlider: null, sfxVolumeSlider: null, ambienceVolumeSlider: null,
        musicVolumeValue: null, sfxVolumeValue: null, ambienceVolumeValue: null,
        AudioContext: function() {return ctx;},
        fetch(url) {return new Promise(resolve => requests.push({url, resolve}));} };
    c.window = c; vm.createContext(c); vm.runInContext(read('audio.js'), c);
    return {c, listeners, requests, voices, ctx, advance: ms => now += ms};
}
const tick = () => new Promise(resolve => setImmediate(resolve));
async function finishRequests(h) {
    while (h.requests.length) {
        h.requests.splice(0).forEach(r => r.resolve({ok: true, arrayBuffer: async () => new ArrayBuffer(1)}));
        await tick();
    }
}
test('audio boot streams music on demand; gestures unlock and warm at most two SFX at once', async () => {
    const h = audioHarness();
    assert.ok(Object.values(h.c.audioTracks).every(a => a.preload === 'none'));
    assert.equal(h.requests.length, 0);
    h.listeners.touchend();
    assert.equal(h.ctx.state, 'running'); assert.equal(h.requests.length, 2);
    await finishRequests(h);
    assert.ok(vm.runInContext('_sfxBytes <= _SFX_CACHE_BYTES', h.c));
    assert.equal(vm.runInContext('_sfxBuffers.size', h.c), 2); // each mocked clip is 4 MiB
    h.ctx.state = 'interrupted'; h.listeners.click(); assert.equal(h.ctx.state, 'running');
});
test('delayed network SFX use the unlocked context, respect voice cap and discard stale events', async () => {
    const h = audioHarness(); h.listeners.click(); await finishRequests(h);
    h.c._playBufferedSfx('new.mp3', 'damage', {});
    h.advance(1300); await finishRequests(h); assert.equal(h.voices.length, 0);
    for (let i = 0; i < 20; i++) h.c._playBufferedSfx('new.mp3', 'damage', {});
    await tick(); assert.equal(h.voices.length, 12);
    h.voices.forEach(v => v.onended()); assert.equal(vm.runInContext('_sfxVoices.size', h.c), 0);
});
test('failed SFX downloads are retryable and do not block subsequent sounds', async () => {
    const h = audioHarness(); h.ctx.state = 'running';
    h.c._getSfxBuffer('broken.mp3'); h.requests.shift().resolve({ok: false, status: 404}); await tick();
    assert.equal(vm.runInContext('_sfxPending.size', h.c), 0);
    const next = h.c._getSfxBuffer('broken.mp3'); await finishRequests(h); assert.ok(await next);
});
test('every replacement MP3 referenced by audio.js is included in the delivery', () => {
    const files = [...read('audio.js').matchAll(/\/SFX\/([^`]+_mobile\.mp3)`/g)].map(m => m[1]);
    assert.equal(new Set(files).size, 37);
    for (const file of files) assert.ok(fs.statSync(require('node:path').join(__dirname, 'mobile-audio', file)).size > 0, file);
});

/* THE MODEL QUEUE (2026-09-20, the 507 MB hall): on a desktop every model request goes through ONE
   priority queue, MODEL_MAX_INFLIGHT at a time — the rig lane (priority 0) first, the scene (1), a warm /
   the population (2) last; a queued bg url the scene asks for is promoted; a hung job frees its slot on
   the safety timer; EW_NO_MODEL_QUEUE = the old burst. Never again "everything at once". */
test('desktop model queue: the rig first, the scene four at a time, the warm last, promotion, the safety timer', () => {
    const timers = [], started = [];
    const c = vm.createContext({ window: {}, console: { warn() {} }, setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; }, clearTimeout() {} });
    vm.runInContext('var _mobileModelJobs = [], _mobileModelBusy = false; var _rigLaneUrls = {}, _rigLaneLive = {}; var _bgLoadDepth = 0; var MODEL_MAX_INFLIGHT = 4, MODEL_JOB_TIMEOUT_MS = 90000; var _mqJobs = [], _mqLive = 0, _mqSeq = 0;'
        + fn(renderer, '_rigLaneMark') + fn(renderer, '_mqPriority') + fn(renderer, '_mqStart') + fn(renderer, '_mqPump') + fn(renderer, '_scheduleModelLoad') + fn(renderer, '_pumpModelLoads')
        + fn(renderer, '_rigLaneCount') + fn(renderer, '_bgPromote'), c);
    const pump = () => { timers.filter(t => t.ms === 0).forEach(t => t.f()); const keep = timers.filter(t => t.ms !== 0); timers.length = 0; timers.push(...keep); };
    const dones = {};
    const q = (name, url, bg) => c._scheduleModelLoad(done => { started.push(name); dones[name] = done; }, url, bg);
    // the burst: 10 props, 3 warm files, then the rig — only four stream at once
    for (let i = 0; i < 10; i++) q('prop' + i, 'prop' + i + '.glb');
    for (let i = 0; i < 3; i++) q('warm' + i, 'warm' + i + '.glb', true);
    assert.deepEqual(started, ['prop0', 'prop1', 'prop2', 'prop3'], 'four in flight, the rest queued');
    c._rigLaneMark(['rig.glb', 'ual1.glb', null]);
    q('rig', 'rig.glb'); q('ual1', 'ual1.glb');
    assert.deepEqual(started.slice(-2), ['rig', 'ual1'], 'the rig lane never waits for a slot');
    assert.equal(vm.runInContext('_rigLaneCount()', c), 2);
    assert.equal(vm.runInContext('_mqLive', c), 6);
    dones.prop0(); pump();
    assert.equal(started.at(-1), 'ual1', 'over the cap: a freed slot starts nothing');
    dones.prop1(); pump();
    assert.equal(started.at(-1), 'ual1', 'still at the cap');
    dones.rig(); dones.rig(); pump();   // a double done frees one slot, once
    assert.equal(vm.runInContext('_rigLaneCount()', c), 1);
    assert.equal(started.at(-1), 'prop4');
    assert.equal(vm.runInContext('_mqLive', c), 4);
    // the warm waits behind every prop
    for (const n of ['ual1', 'prop2', 'prop3', 'prop4']) { dones[n](); pump(); }
    assert.ok(!started.includes('warm0'));
    // a real request for a queued warm file promotes it into the scene's tier
    assert.ok(c._bgPromote('warm2.glb')); assert.equal(c._bgPromote('nothing.glb'), false);
    dones.prop5(); pump(); assert.equal(started.at(-1), 'prop9', 'an earlier prop still goes first');
    dones.prop6(); pump(); assert.equal(started.at(-1), 'warm2', 'the promoted file runs with the props');
    assert.ok(!started.includes('warm0'));
    // a spawn under the depth flag is a background file
    vm.runInContext('_bgLoadDepth = 1', c); q('extra', 'extra.glb'); vm.runInContext('_bgLoadDepth = 0', c);
    for (const n of ['prop7', 'prop8', 'prop9', 'warm2']) { dones[n](); pump(); }
    assert.deepEqual(started.slice(-3), ['warm0', 'warm1', 'extra'], 'the warm and the extras run last, in order');
    // a hung job frees its slot on the safety timer
    const live = vm.runInContext('_mqLive', c);
    const safety = timers.filter(t => t.ms === 90000); assert.equal(safety.length, started.length, 'one safety timer per started job');
    safety.at(-1).f(); pump();
    assert.equal(vm.runInContext('_mqLive', c), live - 1);
    // the kill-switch: the old burst
    c.window.EW_NO_MODEL_QUEUE = true;
    for (let i = 0; i < 6; i++) q('burst' + i, 'burst' + i + '.glb');
    assert.equal(started.filter(n => n.startsWith('burst')).length, 6);
});

test('the rig lane is marked by the arrival warm and the player spawn in the source', () => {
    const warm = renderer.slice(renderer.indexOf('warmAvatar: function (av)'), renderer.indexOf('interact: _hqInteract'));
    assert.ok(/_rigLaneMark\(urls\);/.test(warm), 'warmAvatar marks its urls');
    const spawn = fn(renderer, '_hqSpawnCharacter');
    assert.ok(/spec\.kind === 'player' && def\.model[\s\S]*_rigLaneMark\(_lane\)/.test(spawn), 'the player spawn marks its rig');
    assert.ok(/_scheduleModelLoad\(function \(done\) \{[\s\S]*?\}, url, bg\);/.test(fn(renderer, '_loadMiscModel')), 'the misc loader hands its url and its lane to the scheduler');
    const warmRoom = renderer.slice(renderer.indexOf('warmRoom: function (roomId)'), renderer.indexOf('warmAvatar: function (av)'));
    assert.ok(/_loadMiscModel\(url, true, function \(\) \{\}, \{ bg: true \}\)/.test(warmRoom), 'warmRoom files its props in the background lane');
    assert.ok(/_bgLoadDepth\+\+;[\s\S]*?pop\.draw\.forEach/.test(fn(renderer, '_hqSpawnRounds')), 'the extras spawn under the background flag');
});

/* THE FAILURE MEMO (2026-09-20): one free retry, then a minute's back-off — a 404 cue is never a request per play */
test('a cue that fails twice in a row backs off for a minute, then retries', async () => {
    const h = audioHarness(); h.ctx.state = 'running';
    h.c._getSfxBuffer('gone.mp3'); h.requests.shift().resolve({ok: false, status: 404}); await tick();
    h.c._getSfxBuffer('gone.mp3'); assert.equal(h.requests.length, 1);   // the free retry fetches
    h.requests.shift().resolve({ok: false, status: 404}); await tick();
    for (let i = 0; i < 5; i++) h.c._getSfxBuffer('gone.mp3');
    assert.equal(h.requests.length, 0, 'backed off: no request per play');
    assert.equal(await h.c._getSfxBuffer('gone.mp3'), null);
    h.advance(61000);
    const p = h.c._getSfxBuffer('gone.mp3'); assert.equal(h.requests.length, 1);
    await finishRequests(h); assert.ok(await p);
    assert.equal(vm.runInContext('_sfxFailed.has("gone.mp3")', h.c), false);
});

/* THE SHEETS FIRST (2026-09-20, "the floors and walls are always black in a new place"): a material whose
   texture has not landed samples an unbound GPU texture — black — so every tile sheet wears a grey
   placeholder while it streams; a texture is fetched through our own <img> at fetchPriority 'high'; the
   sheets in flight hold the model queue's scene / warm jobs (never the rig lane) for TEX_HOLD_MS at most. */
test('the sheets first: the placeholder, the high-priority fetch, the in-flight count and the queue hold', () => {
    const images = [], timers = [];
    let now = 1000;
    class Texture { constructor() { this.image = undefined; this.needsUpdate = false; } }
    const c = vm.createContext({
        window: {}, console: { warn() {} }, performance: { now: () => now },
        setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; }, clearTimeout() {},
        THREE: { Texture, RGBFormat: 1, RGBAFormat: 2 },
        document: {
            createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {} }) }),
            createElementNS: () => { const img = {}; images.push(img); return img; },
        },
        textureLoader: {},
    });
    vm.runInContext('var _ewAssetFailures = []; function _ewRetryUrl() { return null; } function _ewAssetFailed() {}\n'
        + 'var _mobileModelJobs = [], _mobileModelBusy = false; var _rigLaneUrls = {}, _rigLaneLive = {}; var _bgLoadDepth = 0; var MODEL_MAX_INFLIGHT = 4, MODEL_JOB_TIMEOUT_MS = 90000; var _mqJobs = [], _mqLive = 0, _mqSeq = 0;\n'
        + 'var _texInflight = 0, _texHoldUntil = 0, TEX_HOLD_MS = 2500; var _texPlaceholderImg = null; var _mqTexTimer = null;\n'
        + fn(renderer, '_texPlaceholder') + fn(renderer, '_texShowPlaceholder') + fn(renderer, '_texLanded') + fn(renderer, '_texFetch')
        + fn(renderer, '_rigLaneMark') + fn(renderer, '_mqPriority') + fn(renderer, '_mqStart') + fn(renderer, '_mqTexHold') + fn(renderer, '_mqPump') + fn(renderer, '_scheduleModelLoad')
        + renderer.slice(renderer.indexOf('textureLoader.load = function (url, onLoad, onProgress, onError) {'), renderer.indexOf('var textureCache = new Map();')), c);
    const started = [];
    const q = (name, url) => c._scheduleModelLoad(done => { started.push(name); }, url);
    // two sheets requested, then the room's props: the props wait, the rig does not
    let landed = 0;
    const t1 = c.textureLoader.load('https://cdn.entropywars.net/Assets/door/textures/a.png', () => landed++);
    const t2 = c.textureLoader.load('https://cdn.entropywars.net/Assets/door/textures/b.jpg');
    assert.equal(images.length, 2);
    assert.equal(images[0].fetchPriority, 'high', 'a sheet is a high-priority fetch');
    assert.equal(images[0].crossOrigin, 'anonymous');
    assert.ok(/ewcors=1/.test(images[0].src) || /a\.png/.test(images[0].src));
    assert.equal(t2.format, 1, 'a jpeg is RGB');
    assert.equal(vm.runInContext('_texInflight', c), 2);
    c._texShowPlaceholder(t1);
    assert.ok(t1.image && t1._ew_placeholder && t1.needsUpdate, 'a placeholder image at once — grey, never black');
    q('prop0', 'prop0.glb'); q('prop1', 'prop1.glb');
    assert.deepEqual(started, [], 'the props wait while the sheets stream');
    assert.ok(timers.some(t => t.ms === 150), 'the pump re-checks');
    c._rigLaneMark(['rig.glb']); q('rig', 'rig.glb');
    assert.deepEqual(started, ['rig'], 'the rig lane never waits for a sheet');
    // the first sheet lands: its image replaces the placeholder, the hold stays for the second
    images[0].onload();
    assert.equal(landed, 1); assert.equal(t1._ew_placeholder, false); assert.equal(t1.image, images[0]);
    c._mqPump(); assert.deepEqual(started, ['rig']);
    // the second lands: the props start
    images[1].onerror(new Error('x'));
    assert.equal(vm.runInContext('_texInflight', c), 0);
    c._mqPump(); assert.deepEqual(started, ['rig', 'prop0', 'prop1']);
    // a sheet that never lands holds the queue for TEX_HOLD_MS at most
    c.textureLoader.load('https://cdn.entropywars.net/Assets/door/textures/hung.png');
    q('prop2', 'prop2.glb'); assert.ok(!started.includes('prop2'));
    now += 2600; c._mqPump(); assert.ok(started.includes('prop2'), 'the hold runs out');
});

test('the sheets first in the source: the HQ and horizon sheet loaders wear the placeholder, one fetch per HQ file', () => {
    const hq = fn(renderer, '_hqTex'), hz = fn(renderer, '_hzTex');
    assert.ok(hq.includes('_texShowPlaceholder(t)'), '_hqTex');
    assert.ok(hz.includes('_texShowPlaceholder(tex)'), '_hzTex');
    assert.ok(hq.includes('_hqTexByUrl[url]') && hq.includes('_ew_dependants'), 'a second repeat of one file shares its image');
    assert.ok(renderer.includes("var _hqTexByUrl = {};"));
    assert.ok(/tex\.image\.width && !tex\._ew_placeholder\) ar = /.test(renderer), 'an aspect reader skips the placeholder');
    assert.ok(!renderer.includes('_texLoadRaw'), 'the raw TextureLoader path is gone');
});
