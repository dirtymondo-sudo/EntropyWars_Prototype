'use strict';
/* THE FAR, SMARTER (OPEN_WORLD_PLAN.md Phase 10, 2026-09-27): THE LOD LEVELS (a prop's levels paired with its full file,
   picked by screen size, a batch by its nearest copy, everything back on its full mesh on the reset), THE NEAR FIRST (the
   model queue starts the file nearest the walker first) and THE FAR SHELLS (data.js hqFarParts / hqFarShell, the
   renderer's mesh and its lighter haze). The renderer pieces run on real three r128 in a vm when it is installed. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData();
const R = n => vm.runInContext(n, D);
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const HQ_STAGE_RULES = R('HQ_STAGE_RULES'), HQ_WORLD_RULES = R('HQ_WORLD_RULES');
const FOOT = 'site_prebuilt_olympus_foothills', SWITCH = 'site_prebuilt_olympus_switchbacks', SUMMIT = 'site_prebuilt_olympus_summit';
let THREE = null; try { THREE = require('three'); if (!THREE.InstancedMesh) THREE = null; } catch (e) { THREE = null; }
/* the renderer's instance pass + LOD + far block (one slice: they share the batch records) */
function block() {
    const a = TR.indexOf('    /* ══ THE INSTANCE PASS (OPEN_WORLD_PLAN.md Phase 0'), b = TR.indexOf('    /* THE GATE (2026-09-20)');
    assert.ok(a > 0 && b > a, 'the block');
    return TR.slice(a, b);
}
function fn(name) {
    const start = TR.indexOf('    function ' + name + '(');
    const end = TR.indexOf('\n    }', start);
    assert.ok(start >= 0 && end > start, name);
    return TR.slice(start, end + 6);
}

test('the rules: the levels by screen size, the cull, the ticks; the far shells\' haze, reach and budget', () => {
    assert.deepEqual([...HQ_STAGE_RULES.lodScreen], [0.12, 0.04]);
    assert.ok(HQ_STAGE_RULES.lodScreen[0] > HQ_STAGE_RULES.lodScreen[1], 'level 2 is the smaller screen size');
    assert.ok(HQ_STAGE_RULES.lodHys > 0 && HQ_STAGE_RULES.lodHys < 0.5 && HQ_STAGE_RULES.lodCull > 0 && HQ_STAGE_RULES.lodTickMs > 0 && HQ_STAGE_RULES.mqDistMs > 0);
    assert.ok(HQ_WORLD_RULES.farHaze > 0 && HQ_WORLD_RULES.farHaze < 1, 'a far shell takes part of the room\'s fog');
    assert.ok(HQ_WORLD_RULES.farHazeMax > 0.5 && HQ_WORLD_RULES.farHazeMax < 1, 'never the whole of it');
    assert.equal(HQ_WORLD_RULES.farRes, 4);
    assert.ok(HQ_WORLD_RULES.farMax >= 4 && HQ_WORLD_RULES.farTris >= HQ_WORLD_RULES.farTrisPart && HQ_WORLD_RULES.farSink > 0 && HQ_WORLD_RULES.farMinM > 0);
});

test('hqFarParts: the open-sky parts of this ground, the nearest first, never an interior, never this room, none from inside', () => {
    const fp = D.hqFarParts(FOOT), ids = fp.map(p => p.id);
    assert.ok(ids.includes(SWITCH) && ids.includes(SUMMIT), 'the mountain above the foothills');
    assert.ok(!ids.includes(FOOT), 'not itself');
    for (const id of ids) {
        assert.ok(D.hqStagePart(id), id + ' is a staged part');
        const S = D.DOOR_HQ.rooms[id].shell; assert.ok(S.open && S.sky, id + ' is open');
        assert.equal(D.hqWorldFrame(id).ground, D.hqWorldFrame(FOOT).ground);
    }
    assert.ok(!ids.includes('site_prebuilt_camelot_hall') && !ids.includes('site_prebuilt_camelot_keep'), 'the closed rooms never stand as shells');
    for (let i = 1; i < fp.length; i++) assert.ok(fp[i].gap >= fp[i - 1].gap, 'the nearest first');
    assert.ok(fp.length <= HQ_WORLD_RULES.farMax);
    assert.ok(fp.every(p => p.gap <= HQ_WORLD_RULES.far));
    /* the frame and the box: the summit's box, seen from the foothills, is where its frame puts it */
    const s = fp.find(p => p.id === SUMMIT), c = D.hqStageToRoom(s.rel, 0, 0);
    assert.ok(c.x >= s.rect.x0 && c.x <= s.rect.x1 && c.z >= s.rect.z0 && c.z <= s.rect.z1, 'its centre is in its box');
    assert.equal(s.rel.y, 60, 'sixty metres up');
    assert.equal(D.hqFarGap(s, c.x, c.z), 0, 'inside the box: no gap');
    assert.ok(D.hqFarGap(s, 0, 0) > 0);
    assert.equal(D.hqFarParts('site_prebuilt_camelot_hall').length, 0, 'from inside a closed room: nothing');
    assert.equal(D.hqFarParts('central_egress').length, 0, 'the building has no far');
});

test('hqFarShell: the compiled ground on the far grid, its colours, sunk under the real one; nothing before the survey compiled it', () => {
    const room = D.DOOR_HQ.rooms[SWITCH];
    const saved = room._terrainInfo;
    try {
        if (saved) Object.defineProperty(room, '_terrainInfo', { value: null, writable: true, configurable: true });
        assert.equal(D.hqFarShell(SWITCH), null, 'never compiled here: the survey does it');
        const info = D.hqTerrainCompile(room, SWITCH);
        const f = D.hqFarShell(SWITCH, info), S = room.shell, res = HQ_WORLD_RULES.farRes;
        const nx = Math.ceil(S.w / res) + 1, nz = Math.ceil(S.d / res) + 1;
        assert.equal(f.nx, nx); assert.equal(f.nz, nz);
        assert.equal(f.idx.length % 3, 0); assert.equal(f.tris, f.idx.length / 3);
        assert.ok(f.tris >= 2 * (nx - 1) * (nz - 1) && f.tris <= HQ_WORLD_RULES.farTrisPart);
        assert.equal(f.pos.length, f.col.length);
        for (let i = 0; i < f.idx.length; i++) assert.ok(f.idx[i] < f.pos.length / 3);
        for (let i = 0; i < f.col.length; i++) assert.ok(f.col[i] >= 0 && f.col[i] <= 1);
        /* the grid's corners are the box's, and every ground vertex lies farSink under the compiled field */
        assert.ok(Math.abs(f.pos[0] + S.w / 2) < 1e-6 && Math.abs(f.pos[2] + S.d / 2) < 1e-6, 'the NW corner');
        for (let k = 0; k < nx * nz; k += 37) {
            const x = f.pos[k * 3], y = f.pos[k * 3 + 1], z = f.pos[k * 3 + 2];
            assert.ok(Math.abs(y - (D.hqTerrainHeight(info, x, z) - HQ_WORLD_RULES.farSink)) < 1e-4, 'on the field, sunk');
        }
        /* the skirt: a part 25 m up the mountain reaches down to the ground's floor and past it */
        let lo = Infinity; for (let k = 1; k < f.pos.length; k += 3) lo = Math.min(lo, f.pos[k]);
        assert.ok(lo <= -25 - HQ_WORLD_RULES.farSkirt, 'a mountainside, never a floating plate');
        /* grass and a cliff: two colours on a mountain part */
        const cols = new Set(); for (let k = 0; k < nx * nz; k++) cols.add(f.col.slice(k * 3, k * 3 + 3).map(v => v.toFixed(2)).join(','));
        assert.ok(cols.size > 1, 'the slope picks the cliff\'s colour');
    } finally {
        Object.defineProperty(room, '_terrainInfo', { value: saved || null, writable: true, configurable: true, enumerable: false });
    }
    assert.equal(D.hqFarColor('grass_2'), 0x4d6a36);
    assert.equal(D.hqFarColor('urban:ConcreteStriped2a'), 0x8e8e88);
    assert.equal(typeof D.hqFarColor('nothing-like-it'), 'number');
});

test('hqFarShell on a synthetic floor plan: the city\'s blocks stand as columns to their roofs, the tall walls as boxes, the sea as a sheet', () => {
    const id = 'site_prebuilt_strip_streets', room = D.DOOR_HQ.rooms[id], S = room.shell;
    const nx = 11, nz = 11, res = S.w / 10, H = new Float32Array(nx * nz), tops = new Float32Array(nx * nz);
    tops[5 * nx + 5] = 12;   // one lot, 12 m up, in the middle
    const info = { x0: -S.w / 2, z0: -S.w / 2, res, nx, nz, H, floor: 'urban:x', cliff: 'rock', gen: { solidMass: true }, solidTop: tops,
                   walls: [{ x0: 0, z0: 0, x1: 10, z1: 0, t: 0.4, base: 0, top: 6 }, { x0: 0, z0: 5, x1: 3, z1: 5, t: 0.3, base: 0, top: 1, key: 'bricks' }, { x0: 0, z0: 9, x1: 4, z1: 9, t: 0.3, base: 0, top: 9, ghost: true }],
                   sea: { y: -0.4, key: 'water' } };
    const f = D.hqFarShell(id, info);
    assert.ok(f.cols >= 1, 'the lot stands');
    assert.equal(f.walls, 1, 'the 6 m wall; the 1 m one is too low, the ghost is the walker\'s only');
    assert.equal(f.sea, true);
    let top = -Infinity; for (let k = 1; k < f.pos.length; k += 3) top = Math.max(top, f.pos[k]);
    assert.ok(Math.abs(top - (12 - HQ_WORLD_RULES.farSink)) < 1e-6, 'the roof is the lot\'s own');
});

test('the renderer: the far shell is one flat-shaded vertex-coloured mesh on a lighter haze, never raycast, placed by its frame', () => {
    const src = fn('_hqFarMat');
    assert.match(src, /#include <fog_fragment>/, 'the fog chunk is replaced');
    assert.match(src, /fogDensity \* uFarK/, 'the room\'s density times farHaze');
    assert.match(src, /min\( uFarMax,/, 'never past farHazeMax');
    assert.match(fn('_hqFarTick'), /H\.opts\.farWarm\(fp\.id\)/, 'a part not compiled yet is asked of the survey');
    assert.match(fn('_hqFarTick'), /_hqFarDrawn\(H, fp\.id\)/, 'a drawn part stands down');
    assert.match(MP, /farWarm: \(id\) => \{ try \{ const p = _hqSurvey\(id, false\);/, 'map.js: the survey, behind everything');
    assert.match(TR, /'far', 'lod', '_lodAt', '_lodWarned', '_farWarned'\]\.forEach/, 'the far shells and the LOD list are the visit\'s, not a part\'s');
    assert.match(TR, /far: function \(\) \{ return _hq \? _hqFarStats\(_hq\) : null; \}/);
    if (!THREE) { console.log('  (three r128 not installed — the mesh check is skipped)'); return; }
    const ctx = { THREE, console, performance, window: {}, _hq: null, _hqUnits: () => 73, _hqAoHook() {}, _flagMeshShadows() {}, HQ_STAGE_RULES, HQ_WORLD_RULES,
                  hqFarShell: D.hqFarShell, hqFarParts: D.hqFarParts, hqFarGap: D.hqFarGap, _hqData: () => D.DOOR_HQ };
    vm.createContext(ctx);
    vm.runInContext(block() + '\nthis.mesh = _hqFarMesh; this.place = _hqFarPlace; this.mat = _hqFarMat; this.tick = _hqFarTick; this.stats = _hqFarStats;', ctx);
    const info = D.hqTerrainCompile(D.DOOR_HQ.rooms[SWITCH], SWITCH), d = D.hqFarShell(SWITCH, info), F = {};
    const m = ctx.mesh(F, d);
    assert.equal(m.material, ctx.mat(F), 'one material for every shell');
    assert.equal(m.material.vertexColors, true); assert.equal(m.material.flatShading, true);
    assert.equal(m.castShadow, false);
    const hits = []; m.raycast(new THREE.Raycaster(), hits); assert.equal(hits.length, 0, 'scenery only');
    assert.equal(m.geometry.attributes.position.count, d.pos.length / 3);
    assert.ok(Math.abs(m.geometry.attributes.position.array[0] - d.pos[0] * 73) < 1e-3, 'in scene units');
    const sh = { uniforms: {}, fragmentShader: 'void main() {\n#include <fog_fragment>\n}', vertexShader: '' };
    m.material.onBeforeCompile(sh);
    assert.ok(!/#include <fog_fragment>/.test(sh.fragmentShader) && /uFarK/.test(sh.fragmentShader) && sh.uniforms.uFarK.value === HQ_WORLD_RULES.farHaze);
    const rel = { x: 10, z: -20, y: 25, rot: 1 };
    ctx.place(m, rel); m.updateMatrixWorld(true);
    const p = new THREE.Vector3(3, 0, 4).applyMatrix4(m.matrixWorld), q = D.hqStageToRoom(rel, 3 / 73, 4 / 73);
    assert.ok(Math.abs(p.x / 73 - q.x) < 1e-6 && Math.abs(p.z / 73 - q.z) < 1e-6 && Math.abs(p.y - 25 * 73) < 1e-6, 'the frame is the stage\'s own');
    /* the tick in a walk: the shells stand for the compiled parts, a drawn one stands down, the far plane reaches them */
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(52, 1, 4, 20000);
    const room = D.DOOR_HQ.rooms[FOOT];
    const H = { opts: { room: FOOT, farWarm(id) { H.asked.push(id); } }, asked: [], room, player: { x: 0, z: 55 }, scene, camera: cam, stage: { parts: {} } };   // the foothills' south edge
    const sw = D.DOOR_HQ.rooms[SWITCH], swSaved = sw._terrainInfo;
    Object.defineProperty(sw, '_terrainInfo', { value: info, writable: true, configurable: true, enumerable: false });
    try {
        ctx.tick(H, 1000);
        const st = ctx.stats(H);
        assert.ok(st.built >= 1 && H.far.shells[SWITCH], 'the switchbacks stand (compiled)');
        assert.ok(H.asked.length >= 1 && !H.asked.includes(SWITCH), 'the rest are asked of the survey');
        const gap = D.hqFarGap(D.hqFarParts(FOOT).find(p => p.id === SWITCH), 0, 55);
        assert.ok(gap >= HQ_WORLD_RULES.farMinM);
        assert.equal(H.far.shells[SWITCH].mesh.visible, true, 'not drawn, far enough: the shell stands');
        assert.ok(cam.far > 20000 && cam.far <= HQ_WORLD_RULES.far * 73, 'the far plane reaches the shell (its far corner is 240 m off)');
        H.player.z = -50; ctx.tick(H, 1600);
        assert.equal(H.far.shells[SWITCH].mesh.visible, false, 'within farMinM of its box: the outer ground is the ground there');
        H.player.z = 55; ctx.tick(H, 2200);
        assert.equal(H.far.shells[SWITCH].mesh.visible, true, 'back out: it stands again');
        H.stage.parts[SWITCH] = { attached: true };
        ctx.tick(H, 2800);
        assert.equal(H.far.shells[SWITCH].mesh.visible, false, 'drawn for real: the shell stands down');
        ctx.window.EW_HQ_NO_FAR = true; ctx.tick(H, 3400);
        assert.ok(Object.values(H.far.shells).every(s => !s.mesh.visible) && cam.far === 20000, 'the switch');
    } finally { Object.defineProperty(sw, '_terrainInfo', { value: swSaved || null, writable: true, configurable: true, enumerable: false }); }
});

test('THE LOD LEVELS: the pick by screen size with a band either side, never coarser than landed, the pairing refuses a file that differs', () => {
    const ctx = { THREE: THREE || {}, console, performance, window: {}, _hqUnits: () => 1, HQ_STAGE_RULES };
    vm.createContext(ctx);
    vm.runInContext(fn('_lodPick') + fn('_lodGeo') + '\nthis.pick = _lodPick; this.geo = _lodGeo;', ctx);
    const T = [0.12, 0.04], h = 0.12;
    assert.equal(ctx.pick(0.5, 0, T, h), 0);
    assert.equal(ctx.pick(0.11, 0, T, h), 0, 'just under the line: the band holds the full mesh');
    assert.equal(ctx.pick(0.10, 0, T, h), 1);
    assert.equal(ctx.pick(0.03, 0, T, h), 2, 'far off at once: level 2');
    assert.equal(ctx.pick(0.13, 1, T, h), 1, 'just over the line: the band holds level 1');
    assert.equal(ctx.pick(0.14, 1, T, h), 0);
    assert.equal(ctx.pick(0.037, 1, T, h), 1);
    assert.equal(ctx.pick(0.034, 1, T, h), 2);
    assert.equal(ctx.pick(0.043, 2, T, h), 2);
    assert.equal(ctx.pick(0.046, 2, T, h), 1);
    const base = { _ew_lods: [null, 'L2'] };
    assert.equal(ctx.geo(base, 1), base, 'level 1 not landed: the full mesh, never level 2');
    assert.equal(ctx.geo(base, 2), 'L2');
    base._ew_lods[0] = 'L1';
    assert.equal(ctx.geo(base, 1), 'L1');
    assert.equal(ctx.geo({}, 2).constructor, Object, 'no levels: the full mesh');
    if (!THREE) { console.log('  (three r128 not installed — the pairing check is skipped)'); return; }
    vm.runInContext(fn('_lodPair') + '\nthis.pair = _lodPair;', ctx);
    const full = new THREE.Group(), lvl = new THREE.Group();
    const mk = (n, detail, uv2) => { const g = new THREE.SphereGeometry(1, detail, detail); if (uv2) g.setAttribute('uv2', g.attributes.uv.clone()); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial()); m.name = n; return m; };
    full.add(mk('body', 32, true), mk('lid', 16, true)); lvl.add(mk('body', 8, true), mk('lid', 6, true));
    const meshes = []; full.traverse(n => { if (n.isMesh) meshes.push(n); });
    const geos = ctx.pair(meshes, lvl);
    assert.equal(geos.length, 2);
    geos.forEach((g, i) => {
        assert.ok(g._ew_shared && g._ew_lodBase === meshes[i].geometry, 'hung on the full geometry, never disposed');
        assert.ok(g.boundingSphere.equals(meshes[i].geometry.boundingSphere), 'the full sphere: culling and the batch frame stay right');
    });
    const renamed = lvl.clone(); renamed.children[1].name = 'other';
    assert.equal(ctx.pair(meshes, renamed), null, 'a mesh named otherwise: refused');
    const short = new THREE.Group(); short.add(mk('body', 8, true));
    assert.equal(ctx.pair(meshes, short), null, 'a mesh missing: refused');
    const noUv2 = new THREE.Group(); noUv2.add(mk('body', 8, false), mk('lid', 6, true));
    const g2 = ctx.pair(meshes, noUv2);
    assert.equal(g2[0], null, 'a level without an attribute the full mesh draws with keeps the full mesh');
    assert.ok(g2[1]);
});

test('THE LOD LEVELS in a walk (real three r128): a far copy on level 2, a batch by its nearest copy, a tiny prop culled by its layer, all back on reset', () => {
    if (!THREE) { console.log('  (three r128 not installed — skipped)'); return; }
    function _hqAoHook() {}
    const ctx = { THREE, console, performance, _hqAoHook, _hqUnits: () => 1, _flagMeshShadows() {}, HQ_STAGE_RULES: Object.assign({}, HQ_STAGE_RULES, { instanceMin: 3, instanceCell: 32 }), window: {}, _hq: null };
    vm.createContext(ctx);
    vm.runInContext(block() + '\nthis.tick = _hqLodTick; this.reset = _hqLodReset; this.stats = _hqLodStats; this.build = _hqInstBuild; this.instTick = _hqInstTick; this.key = _hqInstKey;', ctx);
    const scene = new THREE.Scene(), partRoot = new THREE.Group(), propGroup = new THREE.Group(), shellGroup = new THREE.Group(), doorGroup = new THREE.Group();
    partRoot.add(propGroup, shellGroup, doorGroup); scene.add(partRoot);
    const base = new THREE.SphereGeometry(1, 24, 16); base._ew_shared = true;
    const l1 = new THREE.SphereGeometry(1, 10, 8), l2 = new THREE.SphereGeometry(1, 5, 4);
    [l1, l2].forEach((g, i) => { g._ew_shared = true; g._ew_lodBase = base; g._ew_lodLevel = i + 1; g.boundingSphere = base.boundingSphere ? base.boundingSphere.clone() : (base.computeBoundingSphere(), base.boundingSphere.clone()); });
    base._ew_lods = [l1, l2];
    const mat = new THREE.MeshLambertMaterial(); mat._ew_shared = true;
    const near = new THREE.Mesh(base, mat); near.position.set(0, 0, -5);
    const far = new THREE.Mesh(base, mat); far.position.set(0, 0, -200);
    const tinyGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2); tinyGeo._ew_shared = true; tinyGeo._ew_lods = [];
    const tiny = new THREE.Mesh(tinyGeo, new THREE.MeshLambertMaterial()); tiny.position.set(3, 0, -400);
    propGroup.add(near, far, tiny);
    const cam = new THREE.PerspectiveCamera(52, 1, 0.05, 2000); cam.position.set(0, 0, 0); cam.lookAt(0, 0, -1);
    const H = { scene, partRoot, propGroup, shellGroup, doorGroup, camera: cam, ready: true, stage: null };
    ctx._hq = H;
    scene.updateMatrixWorld(true);
    ctx.tick(H, 1e6);
    assert.equal(near.geometry, base, 'near: the full mesh');
    assert.equal(far.geometry, l2, '200 m off: level 2');
    assert.equal(tiny.layers.test(cam.layers), false, 'a tiny prop 400 m off stops drawing');
    assert.equal(tiny.visible, true, 'its owner\'s visibility untouched');
    const st = ctx.stats(H); assert.equal(st.meshes, 3); assert.equal(st.culled, 1);
    /* the walker walks up to it: back to the full mesh (the band passed) */
    cam.position.set(0, 0, -190); cam.updateMatrixWorld(true);
    ctx.tick(H, 2e6);
    assert.equal(far.geometry, base);
    /* the instance pass batches copies on their FULL geometry, whatever level they were on, and the batch takes the nearest copy's level */
    cam.position.set(0, 0, 0); cam.updateMatrixWorld(true);
    const copies = [];
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(i === 2 ? l2 : base, mat); m.position.set(i * 3, 0, -150 - i); propGroup.add(m); copies.push(m); }
    assert.equal(ctx.key(copies[2]), ctx.key(copies[0]), 'a copy on a level batches with its kind');
    scene.updateMatrixWorld(true);
    const I = ctx.build(H);
    assert.ok(I.batches >= 1);
    const rec = I.recs.find(r => r.copies.includes(copies[0]));
    assert.equal(rec.im.geometry, base, 'the batch is built on the full geometry');
    assert.ok(copies.every(m => m.geometry === base), 'a hidden original keeps its full mesh');
    ctx.tick(H, 3e6);
    assert.equal(rec.im.geometry, l2, '150 m off: the batch on level 2');
    /* the reset (the hand-over, the swap, the leave): every mesh and batch on its full geometry, every layer back */
    ctx.reset(H);
    assert.equal(far.geometry, base); assert.equal(rec.im.geometry, base);
    assert.equal(tiny.layers.test(cam.layers), true);
    assert.equal(H.lod, null);
    /* the switch */
    ctx.window.EW_NO_LOD = true; cam.position.set(0, 0, 0); cam.updateMatrixWorld(true); ctx.tick(H, 4e6);
    assert.equal(far.geometry, base, 'off: the full mesh everywhere');
});

test('THE LOD LEVELS are wired: the full file queues its levels, the manifest names them, the leave / the swap / the hand-over reset first', () => {
    assert.match(fn('_loadMiscModel'), /if \(isGLB\) \{ try \{ _lodAttach\(url, obj\); \} catch \(_e\) \{\} \}/);
    assert.match(fn('_lodAttach'), /_scheduleModelLoad\(function \(done\) \{[\s\S]*\}, u, true, null\);/, 'the background lane, never a gate');
    const leave = fn('_hqLeave'), r = leave.indexOf('_hqLodReset(H)'), d = leave.indexOf('_hqInstDrop(H)'), st = leave.indexOf('_hqHandoverStash(H, opts)');
    assert.ok(r > 0 && r < d && d < st, 'the reset, then the instance drop, then the hand-over');
    assert.match(fn('_hqStageSwap'), /_hqLodReset\(H\)/);
    assert.match(TR, /if \(H\.ready\) \{ try \{ _hqLodTick\(H, now\); \}/);
    assert.match(TR, /window\.EW_NO_LOD/);
    const ctx = { _asMan: { base: 'https://cdn.entropywars.net/', files: { 'Assets/misc/A B.glb': [1, 'a'], 'Assets/misc/A B.lod1.glb': [1, 'b'], 'Assets/misc/A B.lod2.glb': [1, 'c'], 'Assets/misc/C.glb': [1, 'd'], 'Assets/misc/C.lod2.glb': [1, 'e'] } },
                  AS_BASE: 'https://cdn.entropywars.net/', window: {}, _asMeshoptOk: () => true, decodeURIComponent };
    vm.createContext(ctx);
    vm.runInContext(fn('_lodOff') + fn('_asKey') + fn('_lodUrls') + '\nthis.urls = _lodUrls;', ctx);
    assert.deepEqual([...ctx.urls('https://cdn.entropywars.net/Assets/misc/A%20B.glb')], ['https://cdn.entropywars.net/Assets/misc/A%20B.lod1.glb', 'https://cdn.entropywars.net/Assets/misc/A%20B.lod2.glb']);
    assert.deepEqual([...ctx.urls('https://cdn.entropywars.net/Assets/misc/C.glb')], [], 'level 2 without level 1: none (the levels run from 1)');
    assert.deepEqual([...ctx.urls('https://cdn.entropywars.net/Assets/misc/A%20B.opt.glb')], [], 'never from a sibling');
    ctx._asMeshoptOk = () => false; assert.deepEqual([...ctx.urls('https://cdn.entropywars.net/Assets/misc/A%20B.glb')], [], 'no decoder: none');
});

test('THE NEAR FIRST: inside a lane the file nearest the walker starts first; a file with no spot keeps the head; a neighbour building is read through its frame', () => {
    if (!THREE) { console.log('  (three r128 not installed — skipped)'); return; }
    const src = ['_mqSpotAdd', '_mqNearOff', '_mqSpotDist', '_mqJobDist', '_mqDistances', '_mqCmp'].map(fn).join('\n');
    const ctx = { THREE, console, performance, window: {}, _hq: null, _hqUnits: () => 2, HQ_STAGE_RULES, hqStageToRoom: D.hqStageToRoom, Math };
    vm.createContext(ctx);
    vm.runInContext('var _mqSpots = {}, _mqDistAt = 0, _mqDV = null, _mqDM = null;\n' + src + '\nthis.add = _mqSpotAdd; this.dist = _mqDistances; this.cmp = _mqCmp; this.spots = function () { return _mqSpots; };', ctx);
    const scene = new THREE.Scene(), part = new THREE.Group(); part.name = 'hq_part:NB';
    scene.add(new THREE.Group());
    const at = (x, z, parent) => { const g = new THREE.Group(); g.position.set(x * 2, 0, z * 2); (parent || scene).add(g); return g; };
    ctx._hq = { player: { x: 0, z: 0 }, stage: { parts: { NB: { rel: { x: 100, z: 0, y: 0, rot: 0 } } } } };
    ctx.add('far.glb', at(80, 0)); ctx.add('near.glb', at(5, 5)); ctx.add('both.glb', at(90, 0)); ctx.add('both.glb', at(-3, 0));
    const inPart = new THREE.Group(); inPart.position.set(-98 * 2, 0, 0); part.add(inPart); ctx.add('nb.glb', inPart);   // the neighbour's own metres: x −98 → 2 m from the walker
    const loose = new THREE.Group(); ctx.add('loose.glb', loose);   // not placed yet
    const jobs = ['far.glb', 'rig.glb', 'near.glb', 'both.glb', 'nb.glb', 'loose.glb'].map((url, seq) => ({ url, pri: 1, seq, started: false }));
    jobs.push({ url: 'warm.glb', pri: 2, seq: 99, started: false });
    ctx.dist(jobs, true);
    jobs.sort(ctx.cmp);
    assert.deepEqual(jobs.map(j => j.url), ['rig.glb', 'nb.glb', 'both.glb', 'near.glb', 'far.glb', 'loose.glb', 'warm.glb'],
        'no spot first, then by the nearest spot, the unplaced last, the background lane after the scene');
    assert.equal(jobs.find(j => j.url === 'loose.glb').d, Infinity);
    scene.add(part);   // the part attaches: read through the scene now (its root still the identity here)
    part.position.set(100 * 2, 0, 0); part.updateMatrixWorld(true);
    ctx.dist(jobs, true);
    assert.ok(Math.abs(jobs.find(j => j.url === 'nb.glb').d - 2) < 1e-6);
    /* outside the walk (a battle): the old order */
    ctx._hq = null; ctx.dist(jobs, true);
    assert.ok(jobs.every(j => j.d === -1));
    assert.ok(/if \(job\.url\) delete _mqSpots\[job\.url\];/.test(fn('_mqStart')), 'a started file forgets its spots');
    assert.ok(/_mqSpots = \{\};/.test(fn('_hqLeave')), 'the leave forgets them all');
    assert.ok(/_mqSpotAdd\(url, g\)/.test(fn('_miscModelInstance')), 'every instance names its spot');
});

test('the tool: --lod names its levels beside the file, never simplifies a level from a sibling, and the manifest counts them', () => {
    const O = require('./optimize-assets.js'), M = require('./manifest-assets.js'), path = require('path');
    assert.equal(O.lodName('a/B C.glb', 1), 'a/B C.lod1.glb');
    assert.equal(O.isSource('x.lod1.glb'), false); assert.equal(O.isSource('x.opt.glb'), false); assert.equal(O.isSource('x.glb'), true);
    assert.equal(O.targetFor('/in/misc/a.glb', '/in', '/out', f => O.lodName(f, 2)), path.join('/out', 'misc', 'a.lod2.glb'));
    assert.equal(O.parseArgs(['d', '--lod']).lod, true); assert.equal(O.parseArgs(['d']).lod, false);
    assert.deepEqual([...O.LOD_RATIOS], [0.25, 0.06]);
    const src = fs.readFileSync(__dirname + '/optimize-assets.js', 'utf8');
    assert.match(src, /listTextures\(\)\.forEach\(t => t\.dispose\(\)\)/, 'a level carries no textures (the game draws it with the full file\'s)');
    assert.ok(!/fn\.quantize\(|fn\.meshopt\(/.test(src), 'still no quantize');
    const man = { files: { 'Assets/a.glb': [1000, 'x'], 'Assets/a.opt.glb': [200, 'y'], 'Assets/a.lod1.glb': [50, 'z'], 'Assets/a.lod2.glb': [20, 'w'] } };
    assert.deepEqual(M.summary(man), { files: 4, bytes: 1270, glb: 1, opt: 1, saved: 800, lod: 2 });
});
