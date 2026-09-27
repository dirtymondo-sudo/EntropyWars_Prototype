'use strict';
/* THE SMOOTH ATTACH (OPEN_WORLD_PLAN.md §5.9 / Phase 11, 2026-09-27): THE SLICE (a part's builders under buildMs a frame, the
   terrain and the props as generators), THE WARM-UP (the part's programs compiled for the lights of the frame after its
   attach, its sheets uploaded, under compileMs a frame), THE STATIC BATCH (the shell's still pieces merged per look + square,
   the pieces kept and only hidden from the renderer, handed back the moment anything touches them) and THE BITMAPS (the walk's
   sheets decoded off the main thread). The renderer pieces run in a vm; the batch and the warm-up on real three r128 when it
   is installed (npm install --no-save three@0.128.0). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData();
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const HQ_STAGE_RULES = vm.runInContext('HQ_STAGE_RULES', D);
let THREE = null; try { THREE = require('three'); if (!THREE.Mesh || !THREE.Raycaster) THREE = null; } catch (e) { THREE = null; }

function fn(name) {
    const start = TR.indexOf('    function ' + name + '(');
    assert.ok(start >= 0, name);
    const end = TR.indexOf('\n    }\n', start);
    return TR.slice(start, end + 6);
}
function between(a, b) {
    const i = TR.indexOf(a), j = TR.indexOf(b, i);
    assert.ok(i >= 0 && j > i, a);
    return TR.slice(i, j);
}

test('THE SLICE: the steps run in order under buildMs a frame, a generator step resumes where it yielded, the part is built at the end', () => {
    let clock = 0;
    const log = [];
    const unit = (tag, ms) => () => { clock += ms; log.push(tag); };
    /* a step list like the stage's: two plain steps, a generator of 20 one-ms units that yields at every due check, a plain step */
    const gen = function* () { for (let i = 0; i < 20; i++) { clock += 1; log.push('g' + i); if (ctx._hqSliceDue()) yield; } };
    const ctx = vm.createContext({ HQ_STAGE_RULES, console, _alNow: () => clock, _hq3DOn: () => false, _hq3DOff: () => {},
        _hqStageCssShow: () => {}, _hqStageRun: (H, E, f) => { f({}); return true; } });
    vm.runInContext('var _hqSliceEnd = 0, _hqSliceAsk = false;\nfunction _hqSliceDue() { return _hqSliceEnd > 0 && _alNow() >= _hqSliceEnd; }\n' + fn('_hqStageBuildSlice'), ctx);
    ctx._HQ_STAGE_STEPS = [unit('a', 2), unit('b', 1), () => gen(), unit('c', 3)];
    const E = { step: 0, built: false, P: { partRoot: {} } };
    const frames = [];
    for (let f = 0; f < 20 && !E.built; f++) { const t0 = clock; ctx._hqStageBuildSlice({}, E, {}); frames.push(clock - t0); }
    assert.ok(E.built, 'built');
    assert.deepEqual(log, ['a', 'b'].concat(Array.from({ length: 20 }, (_, i) => 'g' + i), ['c']), 'every unit once, in order');
    const budget = HQ_STAGE_RULES.buildMs;
    assert.equal(budget, 6);
    for (const ms of frames) assert.ok(ms <= budget + 3, 'no frame past the budget by more than one unit (' + frames.join(', ') + ')');
    assert.ok(frames.length >= 4, 'the 26 ms of work took several frames');
    assert.equal(E.slice.frames, frames.length);
    assert.ok(E.slice.unitMax <= budget + 3, 'a resumed generator stops at its first check past the budget');
    assert.equal(ctx._hqSliceEnd, 0, 'no slice left open');
});

test('THE SLICE, the builders: the terrain and the props are generators a stage step asks for; a room\'s own build runs them to the end', () => {
    const terr = fn('_hqBuildTerrain'), props = between('    function _hqPlaceProps(room) {', '    /* A ring of wedge props'), outer = fn('_hqBuildOuterGround');
    for (const [src, n] of [[terr, 'terrain'], [props, 'props'], [outer, 'outer ground']]) {
        assert.match(src, /var sliced = _hqSliceAsk; _hqSliceAsk = false;/, n + ': the ask is taken once');
        assert.match(src, /var it = \(function\* \(\) \{/, n + ': a generator');
        assert.match(src, /if \(sliced\) return it;\n\s+while \(!it\.next\(\)\.done\) \{\}/, n + ': handed back, or run to the end');
    }
    assert.ok((terr.match(/_hqSliceDue\(\)\) yield;/g) || []).length >= 15, 'the terrain yields between its parts and every field row');
    assert.match(terr, /\} if \(_hqSliceDue\(\)\) yield; \}/, 'a check at the end of every row of the field');
    assert.match(terr, /_hqSliceEnd > 0\) \{ try \{ _hqSliceAsk = true; yield\* _hqBuildOuterGround\(/, 'the outer ground runs sliced inside the field\'s own slice');
    assert.ok((outer.match(/_hqSliceDue\(\)\) yield;/g) || []).length >= 4, 'the outer ground yields every 8 rows of its grid and its quads');
    assert.match(props, /for \(var ri = 0; ri < rows\.length; ri\+\+\) \{ placeOne\(rows\[ri\]\); if \(\(ri & 3\) === 3 && _hqSliceDue\(\)\) yield; \}/);
    assert.match(TR, /function \(room\) \{ if \(room\.terrain\) \{ _hqSliceAsk = true; return _hqBuildTerrain\(room\); \} \},/);
    assert.match(TR, /function \(room\) \{ _hqSliceAsk = true; return _hqPlaceProps\(room\); \},/);
    assert.match(fn('_hqStageRun'), /var T = keepT \? \(E\.iterT \? _hqStageTZone\(H, E, E\.iterT\) : \(E\.iterT = _hqStageT\(H, E\)\)\) : _hqStageT\(H, E\)/, 'a resumed builder keeps its record');
    assert.match(TR, /var _hqSliceEnd = 0, _hqSliceAsk = false;\n\s+function _hqSliceDue\(\)/);
});

test('THE WARM-UP: the part\'s programs are compiled for the lamps of the frame after the attach, once per material, under compileMs a frame; a changed lamp count warms the whole scene', { skip: !THREE && 'three r128 not installed' }, () => {
    let clock = 0;
    const compiled = [], uploaded = [];
    const renderer = {
        compile(sc, cam) { clock += 1; const L = []; sc.traverseVisible(o => L.push(o)); sc.traverse(o => compiled.push({ o, lights: L.length, points: L.filter(l => l.isPointLight).length, fog: sc.fog })); },
        initTexture(t) { clock += 1; uploaded.push(t); }, properties: { get: () => ({}) },
    };
    const ctx = vm.createContext({ THREE, console, HQ_STAGE_RULES, renderer, _alNow: () => clock, _hqStageV: null, _hqStageRootPlace: () => {} });
    vm.runInContext(['_hqLightSig', '_hqUnderRoot', '_hqWarmNew', '_hqWarmTexOf', '_hqWarmRun', '_hqStagePick'].map(fn).join('\n') + '\nvar HQ_WARM_MS = 8;', ctx);
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xffffff, 1, 100);
    const key = new THREE.DirectionalLight(); scene.add(key); scene.add(new THREE.HemisphereLight());
    const cur = new THREE.Group(); scene.add(cur);
    const lamp = x => { const l = new THREE.PointLight(); l.position.set(x, 0, 0); return l; };
    [1, 2, 3].forEach(x => cur.add(lamp(x)));   // three lamps on the stage: fewer than lampsLive
    const shared = new THREE.MeshPhongMaterial({ map: Object.assign(new THREE.Texture(), { image: {}, version: 1 }) });
    const part = new THREE.Group();
    for (let i = 0; i < 16; i++) part.add(new THREE.Mesh(new THREE.BoxGeometry(), i < 6 ? shared : new THREE.MeshPhongMaterial()));
    part.add(lamp(50), lamp(60));
    const cam = new THREE.PerspectiveCamera(); cam.position.set(0, 0, 0);
    const H = { scene, camera: cam, partRoot: cur, stage: { parts: {} } };
    const W = ctx._hqWarmNew(H, { P: { partRoot: part } });
    assert.equal(W.full, true, 'three lamps become five: every material of the scene is keyed on the new count');
    assert.equal(W.lights.filter(l => l.isPointLight).length, 5, 'the lamps the pick will light with the part drawn');
    let frames = 0;
    while (!ctx._hqWarmRun(H, W)) { frames++; assert.ok(frames < 50); }
    assert.ok(W.frames >= 2, 'more than one frame');
    const partOnes = compiled.filter(c => c.o.parent === part);
    assert.equal(partOnes.length, 11, 'each material of the part compiled once (six share one)');
    assert.equal(new Set(partOnes.map(c => c.o.material)).size, 11);
    assert.ok(compiled.every(c => c.points === 5 && c.lights === 7 && c.fog === scene.fog), 'the real fog; the key, the sky and the five lamps');
    assert.deepEqual(uploaded, [shared.map], 'its sheet uploaded');
    /* the same part on a stage with twelve lamps already: the count stays, only the part is warmed */
    for (let x = 4; x <= 12; x++) cur.add(lamp(x));
    compiled.length = 0;
    const W2 = ctx._hqWarmNew(H, { P: { partRoot: part } });
    assert.equal(W2.full, false, 'twelve stay twelve');
    while (!ctx._hqWarmRun(H, W2)) {}
    assert.ok(compiled.every(c => c.o.parent === part), 'only the part');
    /* the budget: one ms a compile, compileMs a frame */
    const W3 = ctx._hqWarmNew(H, { P: { partRoot: part } }); const t0 = clock; ctx._hqWarmRun(H, W3);
    assert.ok(clock - t0 <= (HQ_STAGE_RULES.compileMs || 8) + 1, 'a frame stops at the budget');
    assert.match(fn('_hqStageBuildTick'), /if \(!E\.warm\) E\.warm = _hqWarmNew\(H, E\);\n\s+if \(!_hqWarmRun\(H, E\.warm\)\) return;/, 'the attach waits for the warm-up');
    assert.match(fn('_hqStageBuildTick'), /_hqStageAttach\(H, E, true\);\n\s+_hqStageLamps\(H\);/, 'the lamp pick the warm-up compiled for, on the attach frame');
});

/* the batch block in a vm on real three */
function batchCtx() {
    const renderer = { drawn: [], render(sc) { const seen = []; sc.traverseVisible(o => { if (o.isMesh) seen.push(o); }); this.drawn = seen; } };
    const ctx = vm.createContext({ THREE, console, HQ_STAGE_RULES, renderer, WeakMap, Math, Object, Array, window: {}, _alNow: () => 0, _hqUnits: () => 1, _hqAoHook: function _hqAoHook() {} });
    vm.runInContext('var _hqSliceEnd = 0;\nfunction _hqSliceDue() { return _hqSliceEnd > 0 && _alNow() >= _hqSliceEnd; }\n'
        + between('    /* ══ THE STATIC BATCH (OPEN_WORLD_PLAN.md', '    /* THE CROSSING (§5.3) */'), ctx);
    return ctx;
}
function room() {
    const scene = new THREE.Scene(), partRoot = new THREE.Group(), shell = new THREE.Group();
    scene.add(partRoot); partRoot.add(shell); partRoot.position.set(100, 0, 40);
    const look = () => new THREE.MeshPhongMaterial({ color: 0x808080 });   // a fresh material of one look each time
    const box = (x, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), m || look()); b.position.set(x, 1, z); shell.add(b); return b; };
    const A = [0, 2, 4, 6, 8].map(x => box(x, 0));                 // five pieces of one look in square (0, 0)
    const lot = new THREE.Group(); lot.name = 'lot'; shell.add(lot);
    const inLot = [box(10, 2), box(12, 2)]; inLot.forEach(b => lot.add(b));   // two more under a group
    const B = [box(40, 40), box(42, 40)];                            // two in another square
    const mover = box(1, 5);
    const red = box(3, 5, new THREE.MeshPhongMaterial({ color: 0xff0000 }));   // alone in its look
    const glass = box(5, 5, new THREE.MeshPhongMaterial({ color: 0x808080, transparent: true, opacity: 0.5 }));
    const parent = box(7, 5); parent.add(new THREE.Mesh(new THREE.BoxGeometry(), look()));   // has a child
    scene.updateMatrixWorld(true);
    return { scene, partRoot, shell, A, lot, inLot, B, mover, red, glass, parent };
}

test('THE STATIC BATCH: the still pieces merge per look and square; the pieces stay (raycast, flags) and only the renderer skips them', { skip: !THREE && 'three r128 not installed' }, () => {
    const ctx = batchCtx(), r = room();
    const H = { shellGroup: r.shell, ready: true, opts: { room: 'x' } };
    ctx._hqBatchTick(H, 0);
    assert.equal(H.batch.phase, 'wait');
    ctx._hqBatchTick(H, 1600); assert.equal(H.batch.phase, 'watch', 'scanned after waitMs');
    const scanned = H.batch.stats.scanned;
    assert.equal(scanned, 12, 'every leaf mesh but the see-through one and the one with a child (its child is a leaf: taken)');
    r.mover.position.x += 0.5; r.scene.updateMatrixWorld(true);   // a ticker moved it while we watched
    ctx._hqBatchTick(H, 3200);
    assert.equal(H.batch.phase, 'live');
    const st = ctx._hqBatchStats(H).x;
    assert.equal(st.batches, 2, 'square (0,0): the five + the lot\'s two + the child; square (1,1): the two');
    assert.equal(st.pieces, 10);
    const batches = r.shell.children.filter(c => c._ew_hqBatch);
    assert.equal(batches.length, 2);
    /* the renderer: the batches drawn, the merged pieces skipped; everywhere else the pieces read visible */
    r.scene.updateMatrixWorld(true);
    ctx.renderer.render(r.scene);
    const drawn = ctx.renderer.drawn;
    assert.ok(batches.every(b => drawn.includes(b)));
    assert.ok(r.A.every(o => !drawn.includes(o)) && r.B.every(o => !drawn.includes(o)), 'the merged pieces are not drawn');
    assert.ok(drawn.includes(r.mover) && drawn.includes(r.red) && drawn.includes(r.glass) && drawn.includes(r.parent), 'the rest draw as before');
    assert.ok(r.A.every(o => o.visible === true), 'the game still reads its own value');
    /* the merged geometry stands where the pieces stood (in the shell's space) */
    const big = batches.find(b => b.geometry.attributes.position.count === 8 * 24);
    assert.ok(big, 'eight boxes');
    const bb = new THREE.Box3().setFromBufferAttribute(big.geometry.attributes.position);
    assert.ok(Math.abs(bb.min.x - -0.5) < 1e-6 && Math.abs(bb.max.x - 12.5) < 1e-6 && Math.abs(bb.min.y) < 1e-6 && Math.abs(bb.max.y - 2) < 1e-6, 'the shell\'s own frame');
    /* the rays still hit the pieces, never the batch */
    const rc = new THREE.Raycaster(new THREE.Vector3(104, 5, 40), new THREE.Vector3(0, -1, 0));
    const hits = rc.intersectObject(r.shell, true);
    assert.ok(hits.length && hits[0].object === r.A[2], 'the piece answers');
    assert.ok(!hits.some(h => h.object._ew_hqBatch), 'the batch never');
});

test('THE STATIC BATCH hands back: a write to a piece\'s or an ancestor\'s visible breaks its batch at once; the watchdog catches a move or a material change; the drop restores every piece', { skip: !THREE && 'three r128 not installed' }, () => {
    const ctx = batchCtx(), r = room();
    const H = { shellGroup: r.shell, ready: true, opts: { room: 'x' } };
    ctx._hqBatchTick(H, 0); ctx._hqBatchTick(H, 1600); ctx._hqBatchTick(H, 3200);
    assert.equal(ctx._hqBatchStats(H).x.batches, 2);
    /* a kit's stand-in hidden when the kit lands: the group's visible */
    r.lot.visible = false;
    assert.equal(ctx._hqBatchStats(H).x.batches, 1, 'the batch holding the lot\'s pieces is gone');
    assert.equal(r.lot.visible, false);
    ctx.renderer.render(r.scene);
    assert.ok(!ctx.renderer.drawn.includes(r.inLot[0]), 'hidden with its group');
    assert.ok(r.A.every(o => ctx.renderer.drawn.includes(o)), 'its pieces draw themselves again');
    assert.equal(Object.getOwnPropertyDescriptor(r.A[0], 'visible').value, true, 'a plain field again');
    assert.equal(Object.getOwnPropertyDescriptor(r.lot, 'visible').value, false);
    /* the other batch: a piece moved → the watchdog */
    r.B[0].position.z += 1; r.scene.updateMatrixWorld(true);
    ctx._hqBatchTick(H, 3800);
    assert.equal(ctx._hqBatchStats(H).x.batches, 0);
    assert.equal(ctx._hqBatchStats(H).x.broken, 2);
    /* a fresh room: a material's colour changed → the watchdog; then the drop */
    const r2 = room(), H2 = { shellGroup: r2.shell, ready: true, opts: { room: 'y' } };
    ctx._hqBatchTick(H2, 0); ctx._hqBatchTick(H2, 1600); ctx._hqBatchTick(H2, 3200);
    r2.B[1].material.color.setHex(0x00ff00);
    ctx._hqBatchTick(H2, 3800);
    assert.equal(ctx._hqBatchStats(H2).y.batches, 1);
    r2.A[0].visible = false;   // a piece hidden by its owner
    assert.equal(ctx._hqBatchStats(H2).y.batches, 0);
    ctx.renderer.render(r2.scene);
    assert.ok(!ctx.renderer.drawn.includes(r2.A[0]) && ctx.renderer.drawn.includes(r2.A[1]));
    const r3 = room(), H3 = { shellGroup: r3.shell, ready: true, opts: { room: 'z' } };
    ctx._hqBatchTick(H3, 0); ctx._hqBatchTick(H3, 1600); ctx._hqBatchTick(H3, 3200);
    ctx._hqBatchDropAll(H3);
    assert.equal(r3.shell.children.filter(c => c._ew_hqBatch).length, 0);
    assert.equal(H3.batch.phase, 'off');
    assert.ok([...r3.A, ...r3.inLot, r3.lot].every(o => Object.getOwnPropertyDescriptor(o, 'visible').value === true), 'every field plain again');
});

test('THE STATIC BATCH wiring: the frame ticks it, the hand-over / the leave / the disposal hand every piece back, the part carries its record, the switch', () => {
    assert.match(TR, /if \(H\.ready\) \{ try \{ _hqBatchTick\(H, now\); \}/);
    assert.match(fn('_hqHandoverStash'), /_hqHandoverDrop\(\);\n\s+try \{ _hqBatchDropAll\(H\); \} catch \(e\) \{\}/);
    assert.match(TR, /function _hqLeave\(opts\) \{\n\s+var H = _hq; if \(!H\) return;\n\s+try \{ _hqBatchDropAll\(H\); \} catch \(e\) \{\}/);
    assert.match(fn('_hqStageDispose'), /_hqBatchDrop\(E\.P\)/);
    assert.match(fn('_hqPartFields'), /batch: null,/, 'the batch record is the part\'s: it travels with the crossing');
    assert.match(TR, /function _hqBatchOff\(\) \{ return typeof window !== 'undefined' && !!window\.EW_HQ_NO_BATCH; \}/);
    assert.match(TR, /renderer\.render = function \(\) \{ _hqBatchDraw\+\+; try \{ return r0\.apply\(this, arguments\); \} finally \{ _hqBatchDraw--; \} \};/, 'hidden to every render, the shadow pass included');
    assert.match(TR, /batch: function \(\) \{ return _hqBatchStats\(_hq\); \}/, 'ThreeRenderer.hq.batch()');
});

test('THE BITMAPS: the walk\'s sheets decode off the main thread, flipped at the decode by the texture\'s own flipY, Chromium only, the <img> path on any failure', () => {
    const b = fn('_texBmpFrom');
    assert.match(b, /imageOrientation: flip \? 'flipY' : 'from-image'/);
    assert.match(b, /bmp\.complete = true; bmp\.naturalWidth = bmp\.width; bmp\.naturalHeight = bmp\.height;/, 'the <img> fields the game reads');
    assert.match(fn('_texBmpOk'), /typeof createImageBitmap === 'function' && typeof navigator !== 'undefined' && !!navigator\.userAgentData/);
    assert.match(TR, /if \(o && o\.bitmap && _texBmpOk\(\)\) \{\n\s+return _texBmpFrom\(blob, o\.bitmap, src\)\.then\(function \(bmp\) \{[^\n]*\}, function \(\) \{ return decodeImg\(blob\); \}\);/);
    assert.match(TR, /var bmp = _hq \? tex : null;   \/\/ THE BITMAPS/, 'only the building\'s sheets');
});
