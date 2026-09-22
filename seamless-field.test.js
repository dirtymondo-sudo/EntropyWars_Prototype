/* THE SEAMLESS FIELD, delivery 1 — THE TRUE GROUND (2026-09-22)
   A box room's field stands on the room's own floor: the raster carries every IN cell's real top, the
   renderer reads it first, builds no column, keeps the room's floor and props, holds the day cycle and
   the building's exposure. The engine's cells and levels are untouched. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadGameData } = require('./load-data');
const vm = require('node:vm');
const DATA = loadGameData();
const loadData = () => DATA;

const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
const UI = fs.readFileSync(path.join(__dirname, 'ui.js'), 'utf8');
const HALL = 'site_prebuilt_haunted_hall';

test('the tier rule: a real ledge is a level, relief is the floor', () => {
    const D = loadData();
    const f = D.hqFieldTierOf, G = D.HQ_FIELD_RULES.ground;
    assert.ok(G && G.on === true && G.tierMin > 0 && G.step > 0 && G.tierMax >= 2, 'the ground table');
    assert.equal(f(0, 0), 0);
    assert.equal(f(G.tierMin - 0.05, 0), 0, 'a mound under tierMin is the floor');
    assert.equal(f(G.tierMin, 0), 1, 'a ledge at tierMin is a level');
    assert.equal(f(2.9, 0), 1, 'the gallery slab is one level');
    assert.equal(f(G.tierMin + G.step, 0), 2, 'a storey up is two');
    assert.equal(f(100, 0), G.tierMax, 'capped');
    assert.equal(f(3.0, 3.0), 0, 'a surface at the reference is the floor');
    assert.equal(typeof D.hqFieldGroundOn, 'function');
    assert.equal(D.hqFieldGroundOn(), true);
});

test('a hall field carries every IN cell\'s real top, and the slab / treads are metres, not levels', () => {
    const D = loadData();
    assert.ok(D.hqFieldRoomOk(HALL), 'the hall rasterises');
    const bi = D.hqFieldBoxInfo(HALL);
    const W = D.hqFieldWindow(HALL, { x: 0, z: 0 }, { x: 1.75, z: 0 });
    assert.ok(W && W.board, 'a window at the hall\'s middle');
    const entry = D.hqFieldBuild(HALL, W.ox, W.oz, {});
    assert.ok(entry && entry.field && Array.isArray(entry.field.tops), 'tops on the field');
    assert.equal(entry.field.tops.length, entry.field.S);
    let inN = 0, slab = 0, rock = 0;
    for (let y = 0; y < entry.field.S; y++) for (let x = 0; x < entry.field.S; x++) {
        const t = entry.field.tops[y][x], ch = entry.field.cells[y].charAt(x);
        if (ch === '#') { rock++; assert.equal(t, null, 'a rock cell has no top'); continue; }
        assert.equal(typeof t, 'number', 'an IN cell has a top');
        inN++;
        if (t > 2) slab++;
        /* the engine's level for the cell against the drawn top: the box bands, never a tile quantisation */
        const lvl = +ch - 1;
        assert.equal(lvl, D.hqFieldBoxTile(t), 'the cell level is the band of its top');
    }
    assert.ok(inN >= 12, 'the hall has a field');
    assert.ok(rock + inN === entry.field.S * entry.field.S);
});

test('the renderer: tileTopY reads the true ground first, the mesher builds no column, the room keeps its floor and props', () => {
    assert.ok(TR.includes(`    function tileTopY(x, y) {
        var ts = CONFIG.tileSize || BASE_TILE;
        /* THE SEAMLESS FIELD (2026-09-22): a box room's field stands on the ROOM'S ground — the raster's real tops */
        var _fgY = _fieldGroundTop(x, y);
        if (_fgY !== null) return _fgY;`), 'tileTopY reads the true ground before the columns');
    assert.ok(TR.includes(`        if (_fieldGround()) {
            _clearGroup(terrainGroup); tileMeshes.clear();`), 'rebuildTerrain builds nothing under a true-ground field');
    assert.ok(TR.includes(`        if (trueGround) H.floorHole = null;`), 'the room keeps its whole floor');
    assert.ok(TR.includes(`if (!out && !trueGround && isProp && !c._ew_hqWall && _hqBattleRoomCoverAt(`), 'every prop stands');
    assert.ok(TR.includes(`        if (trueGround) _fieldGroundDress(R, room, M, ts);`), 'the room\'s lights + fog stand in the battle');
    assert.ok(TR.includes(`if (!R || R.site || R.cave || !R.field || !R.field.tops)`), 'a site\'s board and a cave keep their columns');
    assert.ok(TR.includes(`        _fieldGroundArmed = !!_fieldGround();`), 'activate arms the gate before the board builds');
    assert.ok(TR.includes(`if (typeof _fieldGroundArmed !== 'undefined') { _fieldGroundArmed = false; _fieldGroundCache.key = null; _fieldGroundCache.G = null; }`), 'deactivate clears it');
    assert.ok(TR.includes(`fieldGroundLive: function () { return _fieldGroundLive(); }`), 'the API');
    assert.ok(TR.includes(`ThreePost.setExposureContext('hq'); } catch (e) {}
`) && TR.includes(`if (_fieldGroundArmed && typeof ThreePost !== 'undefined' && ThreePost.setExposureContext) ThreePost.setExposureContext('hq')`), 'the building\'s exposure holds');
    assert.ok(UI.includes(`ThreeRenderer.fieldGroundLive && ThreeRenderer.fieldGroundLive()) ? 'day' : cycle;`), 'the day cycle holds on the DOM');
});

test('the true ground in a vm: the tops become battle heights, an OUT cell falls to the columns\' rule', () => {
    const a = TR.indexOf('    var _fieldGroundCache = { key: null, G: null };'), b = TR.indexOf('    function _hqBuildRoomInBattle(ctx) {');
    assert.ok(a > 0 && b > a);
    const src = TR.slice(a, b);
    const ts = 127.75, C = 1.7534, base = 5;
    const R = { site: false, cave: false, base, T: { N: 8, C, x0: 0, z0: 0 }, field: { tops: [[0, 0.76, null], [2.9, 0.25, 0]] } };
    const ctx = { window: {}, CONFIG: { tileSize: ts }, BASE_TILE: 96, ELEV_STEP_RATIO: 1, THREE: {}, console,
                  _hqBattleRoom: () => R, _hqBattleRoomKey: () => 'k', _hqUnits: () => 73, _facilityNearGroup: null, _hqLightRules: () => ({}), _polishOff: () => true, _ewHeightFogSet: () => {},
                  hqFieldGroundOn: () => true };
    vm.createContext(ctx);
    vm.runInContext(src + '\n_fieldGroundArmed = true; this.__t = _fieldGroundTop; this.__live = _fieldGroundLive;', ctx);
    const s = ts / C, floor = base * ts;
    assert.equal(ctx.__t(0, 0), floor, 'the floor');
    assert.ok(Math.abs(ctx.__t(1, 0) - (floor + 0.76 * s)) < 1e-9, 'a table top');
    assert.ok(Math.abs(ctx.__t(0, 1) - (floor + 2.9 * s)) < 1e-9, 'the slab at 2.9 m, not 2 levels');
    assert.equal(ctx.__t(2, 0), null, 'an OUT cell is the columns\'');
    assert.equal(ctx.__t(9, 9), null);
    assert.equal(ctx.__live(), true);
    ctx.hqFieldGroundOn = () => false; ctx.__cacheReset = true;
    vm.runInContext('_fieldGroundCache.key = null;', ctx);
    assert.equal(ctx.__t(0, 0), null, 'the kill-switch');
});
