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

/* ── THE SEAMLESS FIELD, delivery 2 — THE TERRAIN ROOMS + THE FIELD WINS (2026-09-22) ──
   The user: "encounters in the haunted house still go to a voxel grid map". Two causes, both fixed here: hqEncounterLaunch
   handed every part with an area Δ its launchId and map.js skipped the window on it; and a TERRAIN room (every generated
   AREA — the grounds you land in) refused the rasteriser. Now a field room hands the launch no Δ, and a terrain room
   rasterises its own window on the walker's feet rule with THE TIER RULE for its levels. */
const GROUNDS = 'site_prebuilt_haunted_grounds';
const MAP = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
const DATASRC = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');

test('THE FIELD WINS: a room the rasteriser takes hands the launch no area Δ; the marker keeps it; a sea room keeps the site\'s', () => {
    const D = loadData();
    assert.equal(D.hqFieldRoomOk(HALL), true); assert.equal(D.hqFieldRoomOk(GROUNDS), true, 'a terrain area is a field room');
    assert.equal(D.hqFieldRoomOk('site_prebuilt_bermuda_sea'), false, 'a swim has no tile');
    const ch = { kind: 'npc', race: 'ghost', id: 'hq-native-0', x: 1, z: 1, label: 'A GHOST' };
    for (const id of [HALL, GROUNDS]) {
        const L = D.hqEncounterLaunch(id, ch, null, { partyLevel: 5 });
        assert.ok(L, id + ' launches');
        assert.equal(L.seamless, true); assert.equal(L.launchId, null, id + ': no Δ on a seamless launch'); assert.equal(L.area, null);
    }
    assert.ok(D.hqAreaDeltaId(HALL), 'the hall still has its Δ…');
    assert.equal(D.hqMarkerLaunch(HALL, null, { gm: 'tdm' }).launchId, D.hqAreaDeltaId(HALL), '…for the marker (the option to battle on the delta map)');
    const Ls = D.hqEncounterLaunch('site_prebuilt_bermuda_sea', ch, null, { partyLevel: 5 });
    assert.ok(Ls && Ls.seamless === false, 'the sea is not seamless');
    assert.ok(DATASRC.includes('const seamless = hqFieldRoomOk(roomId);') && DATASRC.includes("const launchId = (!seamless && typeof hqAreaDeltaId === 'function') ? hqAreaDeltaId(roomId) : null;"), 'the launch rule');
});

test('THE TERRAIN LATTICE on the grounds: the walker\'s feet rule per cell, the solid and the trees OUT, the tiers real metres, the pond a wade', () => {
    const D = loadData();
    const ti = D.hqFieldTerrainInfo(GROUNDS);
    assert.ok(ti && ti.cells.length === ti.h && ti.cells[0].length === ti.w, 'the lattice');
    assert.equal(ti.C, D.HQ_FIELD_RULES.terrain.cell);
    assert.ok(Math.abs(ti.x0 + ti.w * ti.C / 2) < 1e-9 && Math.abs(ti.z0 + ti.h * ti.C / 2) < 1e-9, 'centred on the room');
    const info = D.hqTerrainInfo(GROUNDS);
    let inN = 0, wade = 0, roof = 0, hazard = 0;
    for (const row of ti.cells) for (const c of row) {
        if (c.hazard) { hazard++; assert.ok(c.fluid && c.key, 'a hazard wears its liquid'); assert.equal(c.in, false); continue; }
        if (!c.in) continue;
        inN++;
        assert.equal(typeof c.top, 'number');
        assert.ok(!(info.maskD && D.hqTerrainMaskAt(info, c.x, c.z) < 0), 'never on the plan\'s solid');
        assert.ok(D.hqTerrainFeet(info, c.x, c.z, null) != null || c.top != null, 'the feet stand');
        if (c.fluid === 'water') { wade++; assert.equal(c.key, 'water'); assert.equal(c.seat, false); }
        if (Math.abs(c.x + 22) < 4.5 && Math.abs(c.z + 22) < 3.5) { roof++; assert.ok(Math.abs(c.top - 3.6) < 0.2, 'the coach house roof is 3.6 m: ' + c.top); }
    }
    assert.ok(inN >= 300, 'the grounds stand: ' + inN);
    assert.ok(wade >= 4, 'the pond is waded: ' + wade);
    assert.ok(roof >= 6, 'the coach house roof: ' + roof);
    assert.equal(hazard, 0, 'no lava on the grounds');
    assert.equal(D.hqFieldTerrainInfo(GROUNDS), ti, 'cached against the compiled record');
});

test('THE WINDOW on the grounds: every IN cell at THE TIER of its top over the window\'s floor, THE GUARANTEE on every window, the entry carries the tops, the layout keeps the sky', () => {
    const D = loadData();
    const R = D.HQ_FIELD_RULES, S = R.size, climb = R.box.climbM;
    const ti = D.hqFieldTerrainInfo(GROUNDS);
    let windows = 0, steps = 0;
    for (let oz = 0; oz + S <= ti.h; oz += 2) for (let ox = 0; ox + S <= ti.w; ox += 2) {
        const W = D.hqFieldRaster(GROUNDS, ox, oz); windows++;
        assert.ok(W.terrain && W.open);
        let ref = Infinity;
        for (const row of W.cells) for (const c of row) if (c.in) ref = Math.min(ref, c.top);
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
            const c = W.cells[y][x];
            if (c.rock) { assert.equal(c.tile, W.rockTile); continue; }
            if (!c.in) continue;
            assert.equal(c.tile, D.hqFieldTierOf(c.top, ref), 'the tier rule');
            for (const [dx, dy] of [[1, 0], [0, 1]]) {
                const n = (W.cells[y + dy] || [])[x + dx]; if (!n || !n.in) continue;
                if (Math.abs(n.top - c.top) <= climb) { steps++; assert.ok(Math.abs(n.tile - c.tile) <= 1, 'a walker\'s step never splits two levels: ' + c.top + ' → ' + n.top); }
            }
        }
    }
    assert.ok(windows > 100 && steps > 1000, windows + ' windows, ' + steps + ' steps');
    const W = D.hqFieldWindow(GROUNDS, { x: 0, z: 8 }, { x: 1.75, z: 9 });
    assert.ok(W && W.board && W.board.terrain === true && W.kind === 'terrain', 'the plaza\'s window');
    const reg = D.hqFieldRegister(GROUNDS, W.ox, W.oz, { cells: W.cells });
    assert.ok(reg && reg.entry.field.terrain && reg.entry.field.open, 'the entry is a terrain field');
    assert.ok(reg.entry.field.tops.some(r => r.some(t => typeof t === 'number')), 'the tops for the true ground');
    assert.equal(reg.entry.spawns[1].length, R.teamSize);
    assert.ok(reg.layout.env && !reg.layout.env.near && !reg.layout.env.motion && reg.layout.env.world.kind === 'room', 'no near setting, THE WORLD inert');
    assert.notEqual(reg.layout.env.scenery, 'none', 'an open room keeps its sky');
    const T = D.hqFieldTransform(W.board);
    const c = T.cellOf({ x: 0, z: 8 }); assert.ok(c.x >= 0 && c.x < S && c.y >= 0 && c.y < S, 'the walker inside the window');
});

test('the sources: map.js says THE GROUND IS THE BOARD and gates the Δ on the rasteriser, the renderer builds the terrain round the field', () => {
    assert.ok(MAP.includes("if (board && board.terrain) return 'THE GROUND IS THE BOARD';") && MAP.includes("if (!board && !fieldRoom && typeof window.hqAreaDeltaId === 'function'"), 'the copy');
    assert.ok(TR.includes('terrain: !!room.terrain, base: base, field:') && TR.includes('if (R.terrain) { try { _hqBuildTerrain(copy); }') && TR.includes("opts: { room: R.roomId }"), 'the room round the field builds the terrain');
    assert.ok(TR.includes("if (R.terrain && typeof _hqBuildClimbs === 'function')"), 'and its climbs');
});
