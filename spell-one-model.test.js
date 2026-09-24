'use strict';
/* THE ONE MODEL — the DOOR HQ side (SPELL_DIRECTOR_PLAN.md §5 Phase 3 /
   §12 "DOOR HQ procs that should draw the spells' model", 2026-09-24).
   Every HQ proc that IS a thing the spells draw from a Meshy file hangs that
   file over its own geometry (the proc stays the stand-in while it streams),
   the weapon and misc caches share one entry per URL (the loader gap), and
   the spells reach the eye and the sedan through ThreeRenderer. Source pins
   + small vm checks — no browser. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const R = __dirname;
const TR = fs.readFileSync(path.join(R, 'three-renderer.js'), 'utf8');
const MI = fs.readFileSync(path.join(R, 'MODEL_INDEX.md'), 'utf8');

function between(src, a, b) {
    const i = src.indexOf(a), j = src.indexOf(b, i + a.length);
    assert.ok(i >= 0 && j > i, a);
    return src.slice(i, j);
}
/* a proc builder's body: from `key: function (U` to the next builder at the same indent */
function proc(key) {
    const i = TR.indexOf('        ' + key + ': function (U');
    assert.ok(i >= 0, key);
    const rest = TR.slice(i + 10);
    const m = rest.search(/\n        [a-z_0-9]+: function \(U/);
    return rest.slice(0, m > 0 ? m : 6000);
}
function fn(name) {
    const i = TR.indexOf('    function ' + name + '(');
    assert.ok(i >= 0, name);
    const rest = TR.slice(i + 4);
    const m = rest.search(/\n    (function |var |\/\*|\/\/)/);
    return rest.slice(0, m > 0 ? m : 8000);
}

test('the helper: one table of the weapon files, the tunables, the kill-switch, the stand-in hidden on landing', () => {
    const files = between(TR, 'var _HQ_SPELL_FILES = {', '};');
    for (const f of ['Meshy_AI_master_sword_0713025949_texture.glb', 'Meshy_AI_single_lit_candle_realistic_0725065958_texture.glb',
                     'Meshy_AI_crystal_ball_0713025648_texture.glb', 'Meshy_AI_pistol_0713030139_texture.glb'])
        assert.ok(files.includes(f), f);
    const tun = between(TR, 'var _HQ_ONE_MODEL = {', '};');
    for (const k of ['sword_stone', 'saucer_rig', 'find_deck', 'candle_ring', 'crystal_ball', 'lone_gun', 'saucer_far']) assert.ok(tun.includes(k + ':'), k);
    assert.match(TR, /window\._ewOneModel = _HQ_ONE_MODEL;/, 'the tunables are reachable from the console');
    const h = fn('_hqOneModel');
    assert.match(h, /window\.EW_PROC_ONE_MODEL \|\| \(o\.low === 'skip' && window\.EW_PERF_LOW\)/);
    assert.match(h, /_miscModelInstance\(url, true,/, 'through the shared misc cache');
    assert.match(h, /\(o\.hide \|\| \[\]\)\.forEach\(function \(m\) \{ if \(m\) m\.visible = false; \}\);/, 'the proc hides only when the file lands');
    assert.match(fn('_hqSpellUrl'), /_R2_WEAPONS \+ f/);
});

test('sword_stone: the master sword (weapons bucket) over the procedural blade', () => {
    const p = proc('sword_stone');
    assert.match(p, /_hqOneModel\(_hqSpellUrl\('sword'\), U, \{ size: SW\.len, hide: \[blade, guard, grip, pommel\] \}\)/);
    assert.match(p, /var blade = _hqBox\(/, 'the procedural blade stays as the stand-in');
    assert.match(p, /var stone = new THREE\.Mesh\(new THREE\.DodecahedronGeometry/, 'the stone stays procedural');
});

test('saucer_rig + _hzSaucer: saucer_lg over the lathe / the lens, the stand-in kept', () => {
    const p = proc('saucer_rig');
    assert.match(p, /_hqOneModel\(_hqMiscUrl\('saucer_lg'\), U, \{ size: SR\.span, fit: 'span', hide: SR\.keepRig \? hullBits : hullBits\.concat\(rigBits\)/);
    assert.match(p, /hullBits\.push\(lower, upper, rim, dome\);/);
    assert.match(p, /var lower = new THREE\.Mesh\(new THREE\.ConeGeometry/, 'the procedural lens stays as the stand-in');
    const s = fn('_hzSaucer');
    assert.match(s, /_miscModelInstance\(_R2_MISC \+ _MISC_GLB\.saucer_lg, true, R \* 2 \* \(SF\.k \|\| 1\)/);
    assert.match(s, /procHull\.forEach\(function \(m\) \{ m\.visible = false; \}\);/);
    assert.match(s, /new THREE\.LatheGeometry\(pts, 40\)/, 'the lathe hull stays as the stand-in');
    assert.match(s, /window\.EW_PERF_LOW \|\| window\.EW_PROC_ONE_MODEL/, 'low perf keeps the lathe');
});

test('find_deck: the skateboard misc model, leaned like the stand-in', () => {
    const p = proc('find_deck');
    assert.match(p, /_hqOneModel\(_hqMiscUrl\('skateboard'\), U, \{ size: FD\.span, fit: 'span', hide: \[top\]\.concat\(wheels\)/);
    assert.match(p, /along\.rotation\.y = Math\.PI \/ 2;/, 'the GLB length (X) turned onto the proc\'s +Z');
    assert.match(p, /var top = _hqBox\(0\.2, 0\.025, 0\.8, wood\);/, 'the plank stays as the stand-in');
});

test('candle_ring: the spells\' candle per stick, the sticks the stand-in, low perf skips', () => {
    const p = proc('candle_ring');
    assert.match(p, /candleUrl = _hqSpellUrl\('candle'\)/);
    assert.match(p, /_hqOneModel\(candleUrl, U, \{ size: \(h \+ 0\.06\) \* CR\.k, low: 'skip', hide: \[c, f\] \}\)/);
    assert.match(p, /new THREE\.CylinderGeometry\(0\.03 \* U, 0\.03 \* U, h \* U, 8\), wax\)/, 'the wax stick stays');
});

test('the fortune tent\'s ball is the crystal ball; floating_orb stays procedural (a sci-fi orb, not a crystal ball)', () => {
    const p = proc('fortune_tent');
    assert.match(p, /_hqOneModel\(_hqSpellUrl\('crystalBall'\), U, \{ size: CB\.h, hide: \[ball\] \}\)/);
    assert.match(p, /var ball = new THREE\.Mesh\(new THREE\.SphereGeometry/, 'the glowing sphere stays as the stand-in');
    assert.ok(!/_hqOneModel\(/.test(proc('floating_orb')));
});

test('lone_gun: the spells\' pistol laid on its side', () => {
    const p = proc('lone_gun');
    assert.match(p, /_hqOneModel\(_hqSpellUrl\('pistol'\), U, \{ size: LG\.span, fit: 'span', lay: true, hide: \[g\] \}\)/);
    assert.match(p, /var slide = _hqBox\(/, 'the silhouette stays as the stand-in');
    assert.match(fn('_hqOneModelLay'), /pv\.rotation\.z = Math\.PI \/ 2;/);
});

test('the loader gap: the weapon GLB call shares the misc cache entry for its URL', () => {
    assert.ok(TR.includes('assetGltf: function (url, onLoad, onError, o) { return _oneFileGltf(url, onLoad, onError, o); }'));
    const f = fn('_oneFileGltf');
    assert.match(f, /var me = _miscModelCache\[url\];/);
    assert.match(f, /if \(me && me\.root\) \{ onLoad\(\{ scene: me\.root/, 'cached → the same root');
    assert.match(f, /me\.cbs\.push\(function \(root\) \{ onLoad\(\{ scene: root/, 'streaming → joins');
    assert.match(f, /var e = _miscModelCache\[url\] = \{ root: null, loading: true/, 'neither → an in-flight entry first');
    assert.match(f, /root\._ew_bbox = new THREE\.Box3\(\)\.setFromObject\(root\);/, 'published the way _loadMiscModel publishes');
    assert.match(f, /_asGltf\(url, function \(gltf\) \{/, 'still through the asset store');
    const lm = fn('_loadMiscModel');
    assert.match(lm, /_oneFileNotify\(e, false\); \}/, 'a misc failure reports to its weapon joiners');
    assert.match(lm, /_oneFileNotify\(e, true\); \}/, 'a dropped misc entry re-runs its weapon joiners');
    /* the catalogue's weapons bucket builds the SAME URL string the weapon table does */
    assert.match(TR, /var _R2_WEAPONS = 'https:\/\/cdn\.entropywars\.net\/Assets\/weapons\/';/);
    assert.match(fn('_hqModelUrl'), /if \(entry\.base === 'weapons'\) return _R2_WEAPONS \+ encodeURIComponent\(entry\.file\);/);
});

test('the loader gap in a vm: one fetch, one root, both sides', () => {
    const f = fn('_oneFileGltf'), nt = fn('_oneFileNotify');
    let fetches = 0, pending = null;
    const ctx = {
        THREE: { Box3: function () { this.setFromObject = () => this; } },
        _miscModelCache: {}, _objectsDirty: false,
        _compactMobileModelTextures() {}, _alJoin() {},
        _asGltf(url, ok) { fetches++; pending = ok; },
    };
    vm.createContext(ctx);
    vm.runInContext(nt + '\n' + f + '\nthis.go = _oneFileGltf; this.cache = _miscModelCache;', ctx);
    const got = [];
    ctx.go('u/jet.glb', (g) => got.push(g.scene));        // the weapon side asks first
    ctx.go('u/jet.glb', (g) => got.push(g.scene));        // a second ask joins
    const misc = [];
    ctx.cache['u/jet.glb'].cbs.push((r) => misc.push(r)); // the misc loader joins the in-flight entry
    const root = { traverse() {}, name: 'root' };
    pending({ scene: root });
    assert.equal(fetches, 1);
    assert.deepEqual(got, [root, root]);
    assert.deepEqual(misc, [root]);
    assert.equal(ctx.cache['u/jet.glb'].root, root);
    ctx.go('u/jet.glb', (g) => got.push(g.scene));        // cached → at once, no fetch
    assert.equal(fetches, 1);
    assert.equal(got.length, 3);
});

test('the exports: getMiscModelClone, vehicle, astralEye, sedan', () => {
    const api = TR.slice(TR.lastIndexOf('    return {'));
    assert.match(api, /getMiscModelClone: _getMiscModelClone,/);
    assert.match(api, /vehicle: function \(kind, o\) \{ return _hzVehicle\(kind, o\); \},/);
    assert.match(api, /astralEye: function \(o\) \{ return _spellAstralEye\(o\); \},/);
    assert.match(api, /sedan: function \(o\) \{ return _spellSedan\(o\); \},/);
    const eye = fn('_spellAstralEye');
    assert.match(eye, /_hqAstralEye\(R,/, 'the astral realm\'s own eye (the OBJ, the measured gaze)');
    assert.match(eye, /eye\.g\.userData\.eye = eye;/);
    assert.match(fn('_hqAstralEye'), /lids: \[top, bot\]/);
    const sed = fn('_spellSedan');
    assert.match(fn('_spellSedanUrl'), /getRace3DModel\('honda civic', 'male'\)/, 'the race\'s own static car');
    assert.match(sed, /if \(!e \|\| !e\.root \|\| !e\.root\._ew_bbox\) \{ try \{ _loadMiscModel\(src\.url, true, function \(\) \{\}\); \} catch \(x\) \{\} return null; \}/, 'null while it streams, the call warms it');
    assert.match(sed, /car\.rotation\.y = src\.yaw;/, 'nose +Z');
});

test('MODEL_INDEX §9 carries every swap', () => {
    const s9 = MI.slice(MI.indexOf('## 9. The same-thing rule'));
    for (const k of ['sword_stone', 'saucer_rig', '_hzSaucer', 'find_deck', 'candle_ring', 'fortune_tent', 'lone_gun', 'ThreeRenderer.astralEye', 'ThreeRenderer.sedan'])
        assert.ok(s9.includes(k), k);
    assert.match(MI, /One loader per FILE/);
});
