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

/* ── THE SEAMLESS FIELD rev 3 — THE LIGHT HOLDS + THE CLICKS + THE HELD SWOOP (2026-09-22) ──
   The user: "I don't want the lighting to change, it makes the transition really abrupt; still a rough transition; I
   can't click on tiles when I am trying to move". The battle wears the room's rig / fog / look / AO / ceiling
   (ThreePost.setFieldLight), the dome is snapped to the room's colour on the first frame, the pick quads give
   screenToTile something to hit, the crossfade waits for the party's rigs with the swoop (and the walker's lens)
   held under it. */
const TP = fs.readFileSync(path.join(__dirname, 'three-post.js'), 'utf8');
const TC = fs.readFileSync(path.join(__dirname, 'three-camera.js'), 'utf8');

test('rev 3 · the field env wears the room\'s look and a closed room\'s dome is its fog colour', () => {
    const D = loadData();
    const L1 = D.hqFieldLayout('prebuilt_haunted', 'wood', { box: true, look: { name: 'THE HALL', vignette: true }, dome: 0x123456 });
    assert.ok(L1.env && L1.env.look && L1.env.look.name === 'THE HALL', 'the look rides env.look');
    assert.equal(L1.env.tint, 0x123456); assert.equal(L1.env.tintAmt, 1); assert.equal(L1.env.stars, 0); assert.equal(L1.env.nebula, 0); assert.equal(L1.env.scenery, 'none');
    const L2 = D.hqFieldLayout('prebuilt_haunted', 'wood', { terrain: true, open: true, look: null, dome: 0x123456 });
    assert.notEqual(L2.env.tint, 0x123456, 'an open room keeps the site\'s sky');
    assert.ok(!L2.env.look || L2.env.look.name !== 'THE HALL');
    const W = D.hqFieldWindow(HALL, { x: 0, z: 0 }, { x: 1.75, z: 0 });
    const reg = D.hqFieldRegister(W.room, W.ox, W.oz, {});
    const sh = D.DOOR_HQ.rooms[HALL].shell;
    assert.ok(reg && reg.meta && reg.meta.env, 'the hall registers');
    if (sh.look) assert.equal(reg.meta.env.look, sh.look, 'the hall\'s own look');
    assert.equal(reg.meta.env.tint, (sh.fog && sh.fog.color != null) ? sh.fog.color : 0x0d0e12, 'the hall\'s fog colour on the dome');
    assert.ok(DATASRC.includes('if (env && opts.look) env.look = opts.look;') && DATASRC.includes('out.fov = +e.fov;'), 'the data sources');
});

test('rev 3 · the pick quads: one invisible double-sided quad per IN cell at its real top; the crossfade waits for the rigs, else the cap', () => {
    const a = TR.indexOf('    var _fieldGroundCache = { key: null, G: null };'), b = TR.indexOf('    function _hqBuildRoomInBattle(ctx) {');
    const src = TR.slice(a, b);
    const ts = 127.75, C = 1.7534, base = 5;
    const R = { site: false, cave: false, base, T: { N: 8, C, x0: 0, z0: 0 }, field: { tops: [[0, 0.76, null], [2.9, 0.25, 0]] } };
    class Obj { constructor() { this.children = []; this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; } add(c) { this.children.push(c); } }
    class Geo { rotateX() {} }
    const THREE = { Group: Obj, Mesh: class extends Obj { constructor(g, m) { super(); this.geometry = g; this.material = m; } }, PlaneGeometry: Geo, MeshBasicMaterial: class { constructor(o) { Object.assign(this, o); } }, DoubleSide: 2 };
    const terrainGroup = new Obj();
    let now = 1000;
    const ctx = { window: {}, CONFIG: { tileSize: ts }, BASE_TILE: 96, ELEV_STEP_RATIO: 1, THREE, console, terrainGroup,
                  _hqBattleRoom: () => R, _hqBattleRoomKey: () => 'k', _hqUnits: () => 73, _facilityNearGroup: null, _hqLightRules: () => ({}), _polishOff: () => true, _ewHeightFogSet: () => {},
                  hqFieldGroundOn: () => true, performance: { now: () => now }, _hqDissolveRec: null, _alGateOpen: () => ({ pending: () => 0, close() {} }) };
    vm.createContext(ctx);
    vm.runInContext(src + '\n_fieldGroundArmed = true; _fieldPickBuild(CONFIG.tileSize); this.__ready = _fieldDissolveReady; this.__setGate = function (g, at) { _fieldGate = g; _fieldGateAt = at; };', ctx);
    assert.equal(terrainGroup.children.length, 1, 'one pick group in terrainGroup');
    const quads = terrainGroup.children[0].children;
    assert.equal(quads.length, 5, 'one quad per IN cell (the null cell has none)');
    const s = ts / C, floor = base * ts;
    const q10 = quads.find(q => q.position.x === 1 * ts + ts / 2 && q.position.z === 0 * ts + ts / 2);
    assert.ok(q10 && Math.abs(q10.position.y - (floor + 0.76 * s + 0.5)) < 1e-9, 'the table cell\'s quad sits on the table');
    assert.ok(quads.every(q => q.material.colorWrite === false && q.material.side === 2 && q._ew_occSkip === true), 'drawn to nothing, double-sided, never an occluder');
    /* the dissolve gate */
    assert.equal(ctx.__ready(), true, 'no gate: the first frame fades');
    ctx._hqDissolveRec = { hold: 1500, fadingAt: 0 };
    ctx.__setGate({ pending: () => 2, close() {} }, 1000);
    assert.equal(ctx.__ready(), false, 'two rigs still streaming: the snapshot holds');
    now = 1000 + 1600;
    assert.equal(ctx.__ready(), true, 'the hold\'s cap');
    now = 1000 + 200; ctx._hqDissolveRec.fadingAt = 1;
    assert.equal(ctx.__ready(), true, 'the timer already faded it');
    ctx._hqDissolveRec.fadingAt = 0; ctx.__setGate({ pending: () => 0, close() {} }, 1000);
    assert.equal(ctx.__ready(), true, 'every rig landed');
});

test('rev 3 · the sources: the room\'s rig / fog / AO / ceiling / dome / lens hand over, the post file yields to the field light, the camera holds the swoop', () => {
    assert.ok(TR.includes('_fieldPickBuild(ts);') && TR.includes('if (typeof ThreePost !== \'undefined\' && ThreePost.setFieldLight) ThreePost.setFieldLight(field);'), 'the rig hands over');
    assert.ok(TR.includes('scene.fog = new THREE.FogExp2(fogC, fogD);') && TR.includes('_HQ_AO2.z = -R.T.x0 * ts / R.T.C; _HQ_AO2.w = -R.T.z0 * ts / R.T.C;'), 'the fog and the AO centre');
    assert.ok(TR.includes('uniform vec4 uHqAo2;') && TR.includes('abs( vHqWp.x - uHqAo2.z )') && TR.includes('_HQ_AO2.z = 0; _HQ_AO2.w = 0;'), 'the AO box carries a centre; the building stands at the origin');
    assert.ok(TR.includes('if (trueGround) drop.ceil = false;') && TR.includes('_fieldCeilRegister(c, R, ts)') && TR.includes('        _fieldGroundTick();'), 'the ceiling stays and fades');
    assert.ok(TR.includes('if (trueGround) { try { _hqShadowFlags(copy); } catch (e) {} }') && TR.includes('if (o.isMesh && !trueGround) { o.castShadow = false; o.receiveShadow = false; }'), 'the room casts and receives');
    assert.ok(TR.includes("try { if (typeof _fieldGroundArm === 'function') _fieldGroundArm(); } catch (e) {}") && TR.includes("try { if (typeof _fieldGroundRelease === 'function') _fieldGroundRelease(); } catch (e) {}"), 'activate arms, deactivate releases');
    assert.ok(TR.includes('if (_envSnapPending) {') && TR.includes("if (typeof _fieldDissolveReady === 'function' && !_fieldDissolveReady()) return;") && TR.includes('if (_hqDissolveRec) _hqDissolveFrame();'), 'the dome snap and the gated fade');
    assert.ok(TR.includes('fov: H.camera.fov') && TR.includes('if (trueGroundEarly) H.propLights = 0;'), 'the lens rides the eye; the whole light budget');
    assert.ok(TP.includes('function setFieldLight(o) {') && TP.includes('if (_fieldLight) _ng = 0;') && TP.includes("if (_fieldLight) ctx = 'hq';") && TP.includes('setFieldLight: setFieldLight, getFieldLight: getFieldLight'), 'the post file');
    assert.ok(TP.includes('(F ? 1 : _cur.exposure) * _expLk()') && TP.includes("_bloomPass.threshold = _bloomThrFor(_thrIn, F ? HQ_BLOOM_THRESHOLD : BLOOM_USER_THRESHOLD);"), 'no day preset, the building\'s bloom');
    assert.ok(TC.includes('function seedHold(on) { _seedHoldOn = !!on; }') && TC.includes('if (_seedHoldOn) { _seedT0 = now; _seedUntil = now + _seedEase; }') && TC.includes('fov: (isFinite(seed.fov) && seed.fov > 0) ? +seed.fov : null'), 'the camera');
    assert.ok(TC.includes('threeCamera.fov = S.fov; threeCamera.updateProjectionMatrix();') && TC.includes('        seedHold,'), 'the lens tween + the API');
});

/* ══ THE SEAMLESS FIELD, delivery 4 — THE READOUT · THE BATTLE RADIUS · THE HAND-OVER (2026-09-22, SEAMLESS_FIELD_PLAN.md) ══ */
test('delivery 4 · the rules: keepM / keepFarM / handover on HQ_FIELD_RULES.ground; the renderer reads them with defaults and the two kill-switches', () => {
    const DJ = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
    assert.match(DJ, /keepM: 28,/); assert.match(DJ, /keepFarM: 48,/); assert.match(DJ, /handover: true,\s+\/\/ the walk's room groups are handed to the battle/);
    const r = TR.slice(TR.indexOf('    function _hqHandoverRules() {'), TR.indexOf('    function _hqHandoverStash(H, opts) {'));
    assert.match(r, /keepM: \(g\.keepM > 0\) \? \+g\.keepM : 28, keepFarM: \(g\.keepFarM > 0\) \? \+g\.keepFarM : 48/);
    assert.match(r, /handover: g\.handover !== false && !W\.EW_HQ_NO_ROOM_HANDOVER, radius: !W\.EW_HQ_NO_BATTLE_RADIUS/);
});

test('delivery 4 · the hand-over: the leave stashes the three groups before the disposal, a fresh walk / deactivate drops a stash nobody took, the builder takes it for the same room under true ground and runs no builder', () => {
    const lv = TR.slice(TR.indexOf('    function _hqLeave(opts) {'), TR.indexOf('    function _hqRefreshLamps(profile) {'));
    assert.ok(lv.indexOf('var handed = _hqHandoverStash(H, opts);') > lv.indexOf('if (opts && opts.dissolve)'), 'the snapshot first, then the stash');
    assert.ok(lv.indexOf('var handed = _hqHandoverStash(H, opts);') < lv.indexOf('for (var i = H.scene.children.length - 1; i >= 0; i--)'), 'the stash leaves the scene before the disposal loop');
    const st = TR.slice(TR.indexOf('    function _hqHandoverStash(H, opts) {'), TR.indexOf('    function _hqLeave(opts) {'));
    assert.match(st, /\[H\.shellGroup, H\.doorGroup, H\.propGroup\]\.forEach\(function \(g\) \{ if \(g && g\.parent\) g\.parent\.remove\(g\); \}\);/);
    assert.match(st, /t\.material = t\._ew_reflectOld; t\._ew_reflectOld = null;/, 'a reflector\'s mirrored material is put back');
    assert.ok(TR.includes("        _hqHandoverDrop();   // THE HAND-OVER: a stash the battle never took"), '_hqEnter drops a stale stash');
    assert.ok(TR.includes("        try { _hqHandoverDrop(); } catch (e) {}   // THE HAND-OVER: a stash nobody took"), 'deactivate drops one');
    const bb = TR.slice(TR.indexOf('    function _hqBuildRoomInBattle(ctx) {'), TR.indexOf('    function _hqEnter(opts) {'));
    assert.match(bb, /var hand = \(trueGround && HR\.handover && _hqRoomHandover && _hqRoomHandover\.roomId === R\.roomId\) \? _hqRoomHandover : null;/);
    assert.match(bb, /if \(hand\) \{ _hqRoomHandover = null; H\.shellGroup = hand\.shellGroup; H\.doorGroup = hand\.doorGroup; H\.propGroup = hand\.propGroup; H\.fxPulse = hand\.fxPulse\.slice\(\); \}\s*\n\s*else _hqHandoverDrop\(\);/);
    assert.match(bb, /if \(hand\) \{ \/\* the room stands as it was walked \*\/ \}\s*\n\s*else \{\s*\n\s*if \(R\.cave\)/, 'no builder runs on a handed-over room');
    assert.ok(bb.indexOf('if (trueGround) { try { _hqShadowFlags(copy); }') > bb.indexOf('if (R.terrain && typeof _hqBuildClimbs'), 'the shadow flags run on the handed-over groups too');
    assert.match(bb, /c\._ew_hqMarker\)/, 'the battle marker never stands in a battle');
    assert.ok(TR.includes("grp._ew_hqMarker = true;   // THE HAND-OVER"), 'the counter builder tags it');
    assert.match(bb, /drop\.fx = true;/, 'the atmosphere never stands in a battle');
    const MP = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
    assert.equal((MP.match(/handover: true \}\);/g) || []).length, 1, 'only the encounter hands the room over');
});

test('delivery 4 · the battle radius: a prop / door / counter past keepM of the window\'s rect is not taken, scenery (a lot, a backdrop prism, a tree) past keepFarM; a shell part, the field, the outer ground and a merged batch always stand', () => {
    const bb = TR.slice(TR.indexOf('    function _hqBuildRoomInBattle(ctx) {'), TR.indexOf('    function _hqEnter(opts) {'));
    assert.match(bb, /if \(!HR\.radius \|\| c\._ew_hqPart \|\| c\._ew_hqTerrain \|\| c\._ew_hqOuter\) return 0;/, 'the always-kept classes');
    assert.match(bb, /scenery = !!\(c\._ew_hqLot != null \|\| c\._ew_hqBackdrop \|\| c\._ew_hqTree\)/);
    assert.match(bb, /return d > \(scenery \? HR\.keepFarM : HR\.keepM\) \? \(scenery \? 2 : 1\) : 0;/);
    assert.match(bb, /if \(_rbox\.isEmpty\(\)\) \{ bx0 = bx1 = c\.position\.x; bz0 = bz1 = c\.position\.z; \}/, 'a GLB still streaming is judged by its position');
    assert.match(bb, /if \(!out\) \{ var far = farOf\(c\); if \(far\) \{ out = true; if \(far === 2\) culledScenery\+\+; else culledProps\+\+; \} \}/);
    /* the arithmetic: a box against the window rect, in a vm */
    const fn = bb.slice(bb.indexOf('        var _rbox = new THREE.Box3();'), bb.indexOf('        var take = function (src, isProp) {'));
    const ctx = { HR: { radius: true, keepM: 28, keepFarM: 48 }, U: 100, wx0: 0, wx1: 1400, wz0: 0, wz1: 1400, THREE: { Box3: function () { this.min = { x: 0, z: 0 }; this.max = { x: 0, z: 0 }; this.empty = true; this.isEmpty = function () { return this.empty; }; this.setFromObject = function (o) { if (o.box) { this.empty = false; this.min = o.box.min; this.max = o.box.max; } else this.empty = true; }; } }, Math: Math };
    vm.createContext(ctx); vm.runInContext(fn + '\nthis.farOf = farOf;', ctx);
    const mk = (o) => Object.assign({ position: { x: 0, z: 0 }, updateMatrixWorld: function () {} }, o);
    assert.equal(ctx.farOf(mk({ _ew_hqPart: 'wall', position: { x: 99999, z: 0 } })), 0, 'a shell part always stands');
    assert.equal(ctx.farOf(mk({ box: { min: { x: -9000, z: -9000 }, max: { x: 9000, z: 9000 } } })), 0, 'a merged batch spanning the room stands');
    assert.equal(ctx.farOf(mk({ position: { x: 1400 + 27 * 100, z: 700 } })), 0, 'a prop 27 m off the window stands');
    assert.equal(ctx.farOf(mk({ position: { x: 1400 + 29 * 100, z: 700 } })), 1, 'a prop 29 m off is culled as a prop');
    assert.equal(ctx.farOf(mk({ _ew_hqTree: true, position: { x: 1400 + 40 * 100, z: 700 } })), 0, 'a tree 40 m off stands (scenery radius)');
    assert.equal(ctx.farOf(mk({ _ew_hqLot: 3, box: { min: { x: 1400 + 50 * 100, z: 0 }, max: { x: 1400 + 60 * 100, z: 300 } } })), 2, 'a lot 50 m off is culled as scenery');
    assert.equal(ctx.farOf(mk({ box: { min: { x: 1300, z: -3000 }, max: { x: 1500, z: -2900 } } })), 1, 'the distance is to the rect, not the centre');
    ctx.HR.radius = false;
    assert.equal(ctx.farOf(mk({ position: { x: 99999, z: 99999 } })), 0, 'EW_HQ_NO_BATTLE_RADIUS keeps everything');
});

test('delivery 4 · the readout: one frame-time average for both loops, ThreeRenderer.perf() and hq.perf(), the build logs one line and files the counts', () => {
    assert.ok(TR.includes('        _perfTick(_frameNow);\n') && TR.includes('        _perfTick(performance.now());\n        try { _hqFrame(); }'), 'both loops tick it');
    assert.ok(TR.includes("        perf: function () { return _perfRead(); },   // THE READOUT (SEAMLESS_FIELD_PLAN §6)") && TR.includes("        perf: function () { return _perfRead(); },   // THE READOUT: the same numbers on the walk"), 'the two API reads');
    const bb = TR.slice(TR.indexOf('    function _hqBuildRoomInBattle(ctx) {'), TR.indexOf('    function _hqEnter(opts) {'));
    assert.match(bb, /_fieldRoomStats = \{ room: R\.roomId, kept: kept, culled: dropped, props: culledProps, scenery: culledScenery, keepM: HR\.keepM, keepFarM: HR\.keepFarM, handover: !!hand/);
    assert.match(bb, /console\.log\('\[HQ→battle\] ' \+ R\.roomId \+ ': kept ' \+ kept \+ ' · culled ' \+ dropped/, 'the line prints without EW_HQ_DEBUG');
    const pr = TR.slice(TR.indexOf('    var _perfFrameMs = 0, _perfLastT = 0, _fieldRoomStats = null;'), TR.indexOf('    function renderFrame() {'));
    const ctx = { renderer: { info: { render: { calls: 12, triangles: 3400, points: 0, lines: 0 }, memory: { geometries: 5, textures: 7 }, programs: [1, 2] } }, _fieldGroundLive: () => true, _hq: null };
    vm.createContext(ctx); vm.runInContext(pr + '\nthis._perfTick = _perfTick; this._perfRead = _perfRead;', ctx);
    for (let i = 0; i < 200; i++) ctx._perfTick(i * 16.7);
    const p = ctx._perfRead();
    assert.ok(Math.abs(p.fps - 60) < 1.5 && p.calls === 12 && p.triangles === 3400 && p.programs === 2 && p.field === true && p.hq === false, JSON.stringify(p));
});
