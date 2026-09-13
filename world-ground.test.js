// world-ground.test.js — THE WORLD (2026-09-13): grounded ↔ floating. Every
// launch map's `env.world` row (data.js, loaded headlessly) names a kind the
// renderer knows, every rim kind it asks for has a builder, and the renderer /
// state / settings sites the feature hangs on are source-scanned (the same
// guard style as motion-maps.test.js) so a rename fails `npm test` instead of
// leaving a map with a square landscape hanging in the sky again.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const REPO = __dirname;
const { makeSandbox } = require(path.join(REPO, 'load-data.js'));
const sb = makeSandbox({ quiet: true });
vm.runInContext(fs.readFileSync(path.join(REPO, 'data.js'), 'utf8'), sb, { filename: 'data.js' });
const D = vm.runInContext('({ EW_MAP_META })', sb);
/* the terrain sheets are read from sprites.js SOURCE (it does not load headlessly on its own — doorhq.test.js does the same) */
D.TERRAIN_SPRITES = (() => {
    const S = fs.readFileSync(path.join(REPO, 'sprites.js'), 'utf8'), i = S.indexOf('const TERRAIN_SPRITES = {'), j = S.indexOf('\n};', i);
    const out = {}; for (const m of S.slice(i, j).matchAll(/^\s+'?([a-z0-9_]+)'?\s*:\s*\[/gm)) out[m[1]] = true; return out;
})();
const src = f => fs.readFileSync(path.join(REPO, f), 'utf8');
const TR = src('three-renderer.js'), ST = src('state.js'), MP = src('map.js'), UI = src('ui.js'), IX = src('index.html');

const KINDS = ['plain', 'cavern', 'void', 'room'];
const RIM_KINDS = (() => {
    const i = TR.indexOf('var _WD_RIM = {');
    assert.ok(i > 0, 'three-renderer.js has the _WD_RIM builder table');
    const body = TR.slice(i, TR.indexOf('    /* THE WALL', i));
    return [...body.matchAll(/^        (\w+): function \(K, s, c\)/gm)].map(m => m[1]);
})();

test('every launch map carries an env.world row of a known kind', () => {
    const rows = D.EW_MAP_META.filter(m => !m.isDelta && !m.facility && m.env);
    assert.ok(rows.length >= 30, 'the meta table is loaded');
    for (const m of rows) {
        assert.ok(m.env.world && typeof m.env.world === 'object', m.id + ' has env.world');
        assert.ok(KINDS.includes(m.env.world.kind || 'plain'), m.id + ' world.kind is known: ' + m.env.world.kind);
    }
});

test('the rows only ask for rim kinds and terrain sheets the renderer has', () => {
    assert.ok(RIM_KINDS.length >= 10, 'rim builders found: ' + RIM_KINDS.join(' '));
    for (const m of D.EW_MAP_META.filter(m => m.env && m.env.world)) {
        const w = m.env.world;
        const rims = w.rim ? (Array.isArray(w.rim) ? w.rim : [w.rim]) : [];
        for (const r of rims) {
            assert.ok(RIM_KINDS.includes(r.kind), m.id + ' rim kind ' + r.kind + ' has a builder');
            for (const k of ['tex', 'snow', 'roofTex']) if (r[k]) assert.ok(D.TERRAIN_SPRITES[r[k]], m.id + ' rim ' + k + ' ' + r[k] + ' is a terrain sheet');
            if (r.kinds) for (const t of r.kinds) assert.match(t, /^tree(_\d)?$/, m.id + ' tree kind ' + t);
        }
        for (const k of ['ground', 'bank', 'rootTex']) if (w[k]) assert.ok(D.TERRAIN_SPRITES[w[k]], m.id + ' world.' + k + ' ' + w[k] + ' is a terrain sheet');
        if (w.wall) { assert.ok(w.wall.tex && D.TERRAIN_SPRITES[w.wall.tex], m.id + ' wall sheet'); assert.equal(w.kind, 'cavern', m.id + ': only a cavern wears a wall'); }
        if (w.kind === 'cavern') assert.ok(w.wall, m.id + ': a cavern has a wall');
        if (w.sea) assert.ok(m.near || m.env.near, m.id + ': a sea map has a setting (the moat sheet the sea continues)');
    }
});

test('the ships and the cloud islands never ground; the facilities are inert', () => {
    const by = id => D.EW_MAP_META.find(m => m.id === id).env.world;
    for (const id of ['prebuilt_revenge', 'prebuilt_derelict', 'prebuilt_lookingglass', 'prebuilt_heaven']) assert.equal(by(id).root, false, id + ' has no root (a hull / a cloud)');
    for (const id of ['prebuilt_derelict', 'prebuilt_lookingglass', 'prebuilt_heaven']) assert.equal(by(id).kind, 'void', id + ' is void');
    for (const id of ['prebuilt_dumb', 'prebuilt_cern', 'prebuilt_backrooms']) assert.equal(by(id).kind, 'room', id + ' is a room');
    assert.equal(by('prebuilt_hollow_earth').kind, 'cavern', 'Hollow Earth is a cavern');
    assert.equal(by('prebuilt_revenge').sea, true, 'the Dutchman sails an endless sea');
    assert.equal(by('prebuilt_area51').rim.some(r => r.kind === 'town'), true, 'Area 51 has houses in the far distance');
});

test('the renderer builds the world after the setting, ticks it every frame and exposes it', () => {
    assert.ok(TR.includes('function _worldBuild(ctx)') && TR.includes('function _worldTick(now)'), 'build + tick');
    const sites = TR.split('_worldBuild(nearCtx)').length - 1;
    assert.equal(sites, 3, 'every scene.add(_horizonGroup) path builds the world (near-only, none, roster)');
    assert.ok(/if \(nearBuild\) _hzRunNearBuilder\(nearBuild, nearCtx\);\n\s+_worldBuild\(nearCtx\);/.test(TR), 'the roster path builds it AFTER the near builder (it reads _nrLastKit)');
    assert.ok(/_buildHorizonScenery\(\);\n\s+_worldTick\(performance\.now\(\)\);/.test(TR), 'the tick runs right after the horizon build in _updateEnvironment');
    assert.ok(TR.indexOf('_applyDomeFog();', TR.indexOf('function _updateEnvironment()')) < TR.indexOf('_worldTick(performance.now())'), 'the tick blends the fog AFTER _applyDomeFog set the map values');
    for (const k of ['world: function () { return _worldInfo(); }', 'getWorldMode: function () { return _wdMode(); }', 'setWorldMode: function (m) { return _wdSetMode(m); }']) assert.ok(TR.includes(k), 'API ' + k);
});

test('the kit records what the world continues (the apron sheet, the moat pad)', () => {
    assert.ok(/_nrLastKit\.tex = o\.tex \|\| null; _nrLastKit\.color = o\.color; _nrLastKit\.skirt = o\.skirt \|\| null/.test(TR), '_nrApron records tex / skirt');
    assert.ok(/_nrLastKit\.moatPad = o\.pad == null \? 0 : o\.pad/.test(TR), '_nrMoat records the pad');
    assert.ok(TR.includes("K._wdMinD = sea ? 0 : shore / ts + 2;"), 'a rim never stands in the lake');
    assert.ok(TR.includes('Math.max(rTiles, K._wdMinD || 0)'), '_wdRing honours the minimum');
});

test('the injected material is exempt from the altitude fog and shares the dome fog colour', () => {
    const i = TR.indexOf('function _wdInject(mat, o)');
    const body = TR.slice(i, TR.indexOf('function _wdRow()', i));
    assert.ok(body.includes('mat._ew_hzNear = true;'), 'tagged _ew_hzNear (the horizon group altitude fog would dissolve the ground)');
    assert.ok(body.includes('shader.uniforms.uWdFog = _envUni ? _envUni.uFogColor'), 'the haze is the dome fog colour');
    assert.ok(body.includes('if (wdOver > 0.0) discard;'), 'the dissolve discards beyond the keep radius');
    assert.ok(body.includes("'#include <dithering_fragment>'"), 'injected at the end of the Lambert fragment like the horizon fog');
    /* the altitude fog skips it */
    assert.ok(TR.includes('if (m._ew_hzNear) continue;'), '_applyHorizonFog skips _ew_hzNear materials');
});

test('the stability target reads the synced entropy gauge (nothing relayed) and the mode pref', () => {
    const i = TR.indexOf('function _wdTarget()');
    const body = TR.slice(i, TR.indexOf('function _wdRing', i));
    assert.ok(body.includes('state.entropyGauge'), 'reads state.entropyGauge (host + guest both carry it)');
    assert.ok(body.includes("row.kind === 'void' || row.kind === 'room') return 0"), 'void / room never ground');
    assert.ok(body.includes("mode === 'grounded') return 1") && body.includes("mode === 'floating') return 0"), 'the two fixed modes');
    assert.ok(body.includes('window.EW_WORLD_STAB'), 'the dev override');
    assert.ok(TR.includes("localStorage.getItem('ew_world_mode')") && TR.includes("localStorage.setItem('ew_world_mode', m)"), 'the pref persists');
    assert.ok(!TR.includes("_emit('relay', { type: 'world"), 'nothing relayed (RULE #2 — the gauge syncs)');
});

test('the settings row is in both menus and the zoom floor is 0.3', () => {
    assert.ok(MP.includes('window._buildWorldModeHTML = function (refreshJs)'), 'map.js builds the row');
    assert.ok(MP.includes("window._buildWorldModeHTML('window._openMainMenuSettings();')"), 'main-menu Settings');
    assert.ok(UI.includes("window._buildWorldModeHTML('_renderPauseMenu();')"), 'the pause menu');
    assert.ok(MP.includes("ThreeRenderer.setWorldMode('${m[0]}')"), 'the buttons call the renderer');
    assert.equal(ST.split('Math.max(0.3, Math.min(10.0,').length - 1, 3, 'wheel / pinch / gamepad zoom floors');
    assert.equal(ST.split('Math.max(0.25, Math.min(10.0,').length - 1, 0, 'no 0.25 floor left');
});

test('index.html was cache-busted with the delivery', () => {
    // the world shipped on the 20260913-world token; every later delivery bumps it (RULE #1b), so the date is what is pinned
    const m = /three-renderer\.js\?v=(\d{8})[A-Za-z0-9-]*-cors/.exec(IX);
    assert.ok(m && +m[1] >= 20260913, 'the token is the world delivery’s or a later one');
});
