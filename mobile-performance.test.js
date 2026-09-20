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

/* THE RIG LANE (2026-09-20, the desktop load pass): on a desktop a marked rig file starts at once, every
   other model request is HELD while one is in flight and released TOGETHER (a flush, never the phone's
   one-at-a-time queue) when the last rig file lands; the safety timer flushes a stalled lane. */
test('desktop rig lane: the avatar first, everything else held and flushed together', () => {
    const timers = [], started = [];
    const c = vm.createContext({ window: {}, console, setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; }, clearTimeout() {} });
    vm.runInContext('var _mobileModelJobs = [], _mobileModelBusy = false;' + fn(renderer, '_rigLaneMark') + fn(renderer, '_rigLaneCount') + fn(renderer, '_rigLaneFlush') + fn(renderer, '_scheduleModelLoad') + fn(renderer, '_pumpModelLoads')
        + fn(renderer, '_bgStart') + fn(renderer, '_pumpBgLoads') + fn(renderer, '_bgPromote')
        + ';var _rigLaneUrls = {}, _rigLaneLive = {}, _rigLaneHeld = [], _rigLaneTimer = null; var _bgModelJobs = [], _bgModelLive = 0, BG_MAX = 3, _bgLoadDepth = 0;', c);
    // nothing marked: every request starts at once (the old desktop behaviour)
    c._scheduleModelLoad(() => started.push('free'), 'chair.glb');
    assert.deepEqual(started, ['free']);
    c._rigLaneMark(['rig.glb', 'ual1.glb', null]);
    const dones = [];
    c._scheduleModelLoad(done => { started.push('rig'); dones.push(done); }, 'rig.glb');
    c._scheduleModelLoad(done => { started.push('ual1'); dones.push(done); }, 'ual1.glb');
    c._scheduleModelLoad(() => started.push('prop1'), 'prop1.glb');
    c._scheduleModelLoad(() => started.push('native'), 'zombie.glb');
    assert.deepEqual(started, ['free', 'rig', 'ual1']);
    dones[0](); dones[0]();   // a double done never releases the lane early
    assert.deepEqual(started, ['free', 'rig', 'ual1']);
    dones[1]();
    assert.deepEqual(started, ['free', 'rig', 'ual1', 'prop1', 'native']);
    assert.equal(vm.runInContext('_rigLaneCount()', c), 0);
    // after the flush the lane is open again
    c._scheduleModelLoad(() => started.push('later'), 'later.glb');
    assert.equal(started.at(-1), 'later');
    // a stalled rig file: the safety timer releases the held loads
    c._scheduleModelLoad(() => started.push('rig2'), 'rig.glb');
    c._scheduleModelLoad(() => started.push('held2'), 'prop2.glb');
    assert.equal(started.at(-1), 'rig2');
    const safety = timers.find(t => t.ms === 12000); assert.ok(safety); safety.f();
    assert.equal(started.at(-1), 'held2');
    // a settle after the safety flush never drives the lane negative: the next held load is still held
    c._scheduleModelLoad(done => { started.push('rig4'); dones.push(done); }, 'rig.glb');
    c._scheduleModelLoad(() => started.push('held4'), 'prop4.glb');
    assert.equal(started.at(-1), 'rig4');
    dones.at(-1)();
    assert.equal(started.at(-1), 'held4');
    /* THE BACKGROUND LANE (2026-09-20): a warm's files wait for the rig, then run three at a time; a real
       request for a queued url promotes it; a nested spawn under _bgLoadDepth files itself there too */
    c._scheduleModelLoad(done => { started.push('rig5'); dones.push(done); }, 'ual1.glb');
    const bgDones = [];
    for (let i = 0; i < 5; i++) c._scheduleModelLoad(done => { started.push('bg' + i); bgDones.push(done); }, 'warm' + i + '.glb', true);
    assert.equal(started.at(-1), 'rig5', 'a warm never starts while the rig streams');
    assert.ok(c._bgPromote('warm3.glb'));
    assert.equal(started.at(-1), 'bg3', 'a real request starts a queued warm file at once');
    dones.at(-1)();   // the rig lands → the promoted file holds a slot, two more start, two still queued
    assert.deepEqual(started.slice(-2), ['bg0', 'bg1']);
    assert.equal(vm.runInContext('_bgModelJobs.length', c), 2);
    assert.equal(c._bgPromote('nothing.glb'), false);
    bgDones[0]();   // bg3 lands
    assert.equal(started.at(-1), 'bg1');   // the pump runs on a macrotask
    timers.filter(t => t.ms === 0).forEach(t => t.f()); timers.length = 0;
    assert.equal(started.at(-1), 'bg2');
    bgDones[1](); timers.filter(t => t.ms === 0).forEach(t => t.f()); timers.length = 0;
    assert.equal(started.at(-1), 'bg4');
    vm.runInContext('_bgLoadDepth = 1', c);
    c._scheduleModelLoad(() => started.push('extra'), 'extra.glb');
    assert.notEqual(started.at(-1), 'extra', 'a spawn under the depth flag is a background file');
    vm.runInContext('_bgLoadDepth = 0', c);
    bgDones.forEach(d => d()); timers.filter(t => t.ms === 0).forEach(t => t.f()); timers.length = 0;
    assert.equal(started.at(-1), 'extra');
    // the kill-switch: nothing is ever held
    c.window.EW_NO_RIG_LANE = true;
    c._scheduleModelLoad(() => started.push('rig3'), 'rig.glb');
    c._scheduleModelLoad(() => started.push('free3'), 'prop3.glb');
    assert.deepEqual(started.slice(-2), ['rig3', 'free3']);
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
