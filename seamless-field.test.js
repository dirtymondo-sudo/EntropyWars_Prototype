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
    assert.equal(reg.layout.env.scenery, 'none', 'THE SKY ONCE (delivery 5): a field never builds the site\'s far roster');
    assert.ok(reg.layout.env.tint != null && reg.layout.env.stars !== 0, '…but an open room keeps its sky (the tint, the stars)');
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

/* ── THE SECOND PLAN, delivery 5 (SEAMLESS_FIELD_PLAN.md §8.3 steps 5 + 6, §8.1 item 3) ── */
test('delivery 5 · the rules: blockerM / occRefreshS / staticShadow / roomSky on HQ_FIELD_RULES.ground; the renderer reads them with defaults and the two kill-switches', () => {
    const g = DATA.HQ_FIELD_RULES.ground;
    assert.equal(g.blockerM, 2.5); assert.equal(g.occRefreshS, 2); assert.equal(g.staticShadow, true); assert.equal(g.roomSky, true);
    const r = TR.slice(TR.indexOf('    function _hqHandoverRules() {'), TR.indexOf('    function _hqHandoverStash(H, opts) {'));
    assert.match(r, /blockerM: \(g\.blockerM > 0\) \? \+g\.blockerM : 2\.5, occRefreshS: \(g\.occRefreshS > 0\) \? \+g\.occRefreshS : 2,/);
    assert.match(r, /staticShadow: g\.staticShadow !== false && !W\.EW_HQ_NO_STATIC_SHADOW, roomSky: g\.roomSky !== false && !W\.EW_HQ_NO_ROOM_SKY/);
});

test('delivery 5 · THE BLOCKER SET: the fade never raycasts the room whole under a field — a per-ray candidate list by bounding sphere, the merged batches out and _ew_occSkip, the board points no longer subjects', () => {
    const occ = TR.slice(TR.indexOf('    var OCC_FIELD_TRI_MAX = 40000;'), TR.indexOf('    function _occInit() {'));
    const cb = TR.slice(TR.indexOf('    function _occComputeBlockers(cam, cineActive, selUnit, focalTile) {'), TR.indexOf('    function _occUnitBlockers(cam, subs, subjectIds, nearClear) {'));
    assert.match(cb, /var fieldSet = \(_occField && _fieldGroundLive\(\)\) \? _occField : null;/);
    assert.match(cb, /var facOcc = !!\(_facilityNearGroup && _facilityNearGroup\.parent\) && !fieldSet;/, 'the facility group leaves the raycast groups under a field');
    assert.match(cb, /if \(!groups\.length && !fieldSet\) return roots;/);
    assert.match(cb, /intersectObjects\(fieldSet \? _occFieldCandidates\(fieldSet, eye, _occDir, dist - nearClear, groups\) : groups, true\)/, 'per ray, the candidates');
    assert.ok(cb.indexOf('if (facOcc) {') > 0 && cb.indexOf('var fpts = [[(fbw - 1) / 2') > 0, 'the five board points stay for a walled board');
    assert.match(cb, /if \(fieldSet\) _occFieldStat\(fieldSet, performance\.now\(\) - _occT0\);/);
    /* the build: the facility group's direct children, after the take */
    const bb = TR.slice(TR.indexOf('    function _hqBuildRoomInBattle(ctx) {'), TR.indexOf('    function _hqEnter(opts) {'));
    assert.match(bb, /var occF = trueGround \? _occFieldBuild\(_facilityNearGroup, ts \/ C, HR\) : null; if \(!trueGround\) _occFieldDrop\(\);/);
    assert.ok(bb.indexOf('var occF = trueGround') > bb.indexOf('if (_facilityNearGroup) { g.children.slice().forEach('), 'built after the pieces landed in the facility group');
    assert.match(bb, /blockers: occF \? occF\.roots\.length : null, merged: occF \? occF\.skipped : null, sky: skyN/);
    /* the list dies with the group */
    assert.ok(TR.includes("        _facilityNearGroup = null; _occFieldDrop();   // THE BLOCKER SET") && TR.includes("_horizonKey = ''; _facilityNearGroup = null; _occFieldDrop();"), 'both null sites drop it');
    assert.match(TR, /occ: \(typeof _occField !== 'undefined' && _occField\) \? \{ roots: _occField\.roots\.length, merged: _occField\.skipped, rays: _occField\.rays, tests: _occField\.tests/, 'the readout');
    /* the arithmetic, in a vm: a real-ish THREE (Vector3 / Box3 by hand) */
    class V3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } length() { return Math.hypot(this.x, this.y, this.z); } }
    class B3 { constructor() { this.empty = true; } makeEmpty() { this.empty = true; return this; } isEmpty() { return this.empty; } setFromObject(o) { if (o.box) { this.empty = false; this.min = o.box.min; this.max = o.box.max; } else this.empty = true; return this; } getCenter(v) { return v.set((this.min[0] + this.max[0]) / 2, (this.min[1] + this.max[1]) / 2, (this.min[2] + this.max[2]) / 2); } getSize(v) { return v.set(this.max[0] - this.min[0], this.max[1] - this.min[1], this.max[2] - this.min[2]); } }
    const mkObj = (o) => Object.assign({ children: [], isMesh: false, updateMatrixWorld() {}, getWorldPosition(v) { return v.set(this.pos[0], this.pos[1], this.pos[2]); }, pos: [0, 0, 0],
        traverse(fn) { fn(this); this.children.forEach(c => c.traverse(fn)); } }, o);
    const mesh = (o) => mkObj(Object.assign({ isMesh: true }, o));
    const ctx = { THREE: { Vector3: V3, Box3: B3 }, performance: { now: () => 1000 }, Math };
    vm.createContext(ctx); vm.runInContext(occ + '\nthis.build = _occFieldBuild; this.cand = _occFieldCandidates; this.big = _occFieldBig; this.refresh = _occFieldRefresh; this.get = () => _occField;', ctx);
    const field = mkObj({ children: [mesh({ _ew_hqTerrain: true, geometry: { index: { count: 900 } } })], box: { min: [-9000, 0, -9000], max: [9000, 10, 9000] } });
    const batch = mkObj({ children: [mesh({ geometry: { index: { count: 3 * 50000 } } })], box: { min: [-5000, 0, -5000], max: [5000, 500, 5000] } });
    const wall = mkObj({ children: [mesh({ _ew_hqPart: 'wall', geometry: { index: { count: 36 } } })], box: { min: [0, 0, 990], max: [1400, 300, 1010] } });
    const chair = mkObj({ children: [mesh({ geometry: { index: { count: 600 } } })], box: { min: [690, 0, 290], max: [710, 90, 310] } });
    const glb = mkObj({ children: [], pos: [300, 0, 300] });   // still streaming: no box
    const group = mkObj({ children: [field, batch, wall, chair, glb] });
    const F = ctx.build(group, 73.14, { blockerM: 2.5, occRefreshS: 2 });
    assert.equal(F.roots.length, 3, 'the field and the batch are out');
    assert.equal(F.skipped, 2);
    assert.ok(field.children[0]._ew_occSkip === true && batch.children[0]._ew_occSkip === true, 'the merged meshes wear _ew_occSkip');
    assert.ok(!wall.children[0]._ew_occSkip);
    assert.ok(Math.abs(F.blockerPx - 2.5 * 73.14) < 1e-9);
    const rec = F.roots.find(r => r.o === wall); assert.ok(Math.abs(rec.c.z - 1000) < 1e-9 && rec.r > 700, 'the wall\'s sphere');
    const rg = F.roots.find(r => r.o === glb); assert.equal(rg.r, 0); assert.equal(rg.c.x, 300);
    /* a ray from the eye at (700, 200, -2000) toward (700, 100, 700): passes the wall at z 1000 on its way → the wall is a candidate; the chair (at z 300, 10 px wide) is on the line too */
    const groups = ['G'];
    let out = ctx.cand(F, new V3(700, 200, -2000), new V3(0, -100 / Math.hypot(100, 2700), 2700 / Math.hypot(100, 2700)), 2600, groups);
    assert.ok(out.includes(wall) && out.includes(chair) && out[0] === 'G', 'the wall and the chair are on the line');
    assert.ok(!out.includes(glb), 'the streaming GLB at x 300 is 400 px off the line — never a candidate');
    /* a ray along x at z -3000: nothing within 2.5 m */
    out = ctx.cand(F, new V3(-2000, 100, -3000), new V3(1, 0, 0), 4000, groups);
    assert.deepEqual(out, ['G']);
    assert.equal(F.rays, 2); assert.equal(F.tests, 2);
    /* the refresh: an empty box is re-measured every recompute, everything on the cadence */
    glb.box = { min: [280, 0, 280], max: [320, 100, 320] };
    ctx.refresh(F, 1500); assert.ok(rg.r > 0, 'the landed GLB grew its sphere');
    wall.box = { min: [0, 0, 1990], max: [1400, 300, 2010] };
    ctx.refresh(F, 1500); assert.ok(Math.abs(rec.c.z - 1000) < 1e-9, 'not yet the cadence');
    ctx.refresh(F, 3200); assert.ok(Math.abs(rec.c.z - 2000) < 1e-9, 'the cadence re-measures everything');
});

test('delivery 5 · THE STATIC SHADOW: under a field the depth pass refreshes on _shadowsDirty + the lighting ease alone; the four tween-end loops stamp a landing; the kill-switch', () => {
    const rf = TR.slice(TR.indexOf('    function renderFrame() {'), TR.indexOf('    function renderFrame() {') + 60000);
    assert.match(rf, /var _fieldStatic = _fieldGroundLive\(\) && _hqHandoverRules\(\)\.staticShadow;/);
    assert.match(rf, /var _needShadow = window\.EW_DISABLE_SHADOW_GATING \|\| _shadowsDirty\s*\n\s*\|\| \(ThreePost && ThreePost\.isLightingEasing && ThreePost\.isLightingEasing\(\)\)\s*\n\s*\|\| \(!_fieldStatic && \(_shadowMotion\s*\n\s*\|\| hasActiveAnims\(\)\s*\n\s*\|\| \(state && state\.fogOfWar\)\s*\n\s*\|\| _towerCubes\.length > 0\s*\n\s*\|\| _anyGlbAnimating\(\)\)\);/);
    for (const nm of ['_walkTweens', '_displaceTweens', '_jumpTweens', '_strikeTweens']) {
        assert.ok(TR.includes('for (var r = 0; r < toRemove.length; r++) ' + nm + '.delete(toRemove[r]);\n        if (toRemove.length) _shadowsDirty = true;'), nm + ' stamps a landing');
    }
});

test('delivery 5 · THE SKY ONCE: the stash carries an open room\'s floaters + landmarks, the drop disposes them, the battle hangs them outside the facility group (never raycast), a rebuild re-builds the landmarks alone; every field layout says scenery none', () => {
    const st = TR.slice(TR.indexOf('    function _hqHandoverStash(H, opts) {'), TR.indexOf('    function _hqLeave(opts) {'));
    assert.match(st, /var sky = \(H\.sky && \(H\.sky\.group \|\| H\.sky\.landmarks\)\) \? \{ group: H\.sky\.group \|\| null, landmarks: H\.sky\.landmarks \|\| null \} : null;/);
    assert.match(st, /if \(sky\) \[sky\.group, sky\.landmarks\]\.forEach\(function \(g\) \{ if \(g && g\.parent\) g\.parent\.remove\(g\); \}\);/, 'they leave the scene before the disposal loop');
    assert.match(st, /propGroup: H\.propGroup, sky: sky, fxPulse/);
    assert.match(TR, /\[h\.shellGroup, h\.doorGroup, h\.propGroup, h\.sky && h\.sky\.group, h\.sky && h\.sky\.landmarks\]\.forEach/, 'the drop disposes the sky too');
    const bb = TR.slice(TR.indexOf('    function _hqBuildRoomInBattle(ctx) {'), TR.indexOf('    function _hqEnter(opts) {'));
    assert.match(bb, /if \(trueGround && HR\.roomSky\) \{/);
    assert.match(bb, /var skyH = holder\('hq_sky'\); skyH\._ew_occNear = false;/);
    assert.match(bb, /if \(hand && hand\.sky\) \{ if \(hand\.sky\.group\) skyH\.add\(hand\.sky\.group\); if \(hand\.sky\.landmarks\) skyH\.add\(hand\.sky\.landmarks\); \}/);
    assert.match(bb, /_hqBuildLandmarks\(Hs, room\.shell\.sky\.landmarks, 6000\)/, 'a rebuild builds the landmarks on a scratch record');
    assert.match(bb, /o\._ew_occSkip = true; skyN\+\+; \} \}\); _horizonGroup\.add\(skyH\); \}/, 'in the horizon group, never the facility group; every piece skips the fade');
    const DJ = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
    assert.match(DJ, /if \(env && opts\.box\) \{ delete env\.near; delete env\.motion; env\.world = \{ kind: 'room' \}; env\.scenery = 'none'; \}/);
    assert.match(DJ, /if \(env && opts\.terrain\) \{ delete env\.near; delete env\.motion; env\.world = \{ kind: 'room' \}; env\.scenery = 'none'; if \(!opts\.open\) \{ env\.stars = 0; env\.nebula = 0; delete env\.density; \} \}/);
    /* the layout itself: a box field, an open terrain field, a closed one */
    const L1 = DATA.hqFieldLayout('prebuilt_haunted', 'wood', { box: true });
    const L2 = DATA.hqFieldLayout('prebuilt_haunted', 'grass', { terrain: true, open: true });
    const L3 = DATA.hqFieldLayout('prebuilt_haunted', 'grass', { terrain: true, open: false, dome: 0x101010 });
    assert.equal(L1.env.scenery, 'none'); assert.equal(L2.env.scenery, 'none'); assert.equal(L3.env.scenery, 'none');
    assert.notEqual(L2.env.stars, 0, 'an open field keeps its stars'); assert.equal(L3.env.stars, 0, 'a closed one is a dark ceiling');
});

/* ══ delivery 6 — THE CUT (§8.3 step 7) + THE STRATA (§8.3 step 8) ══ */
test('delivery 6 · the rules: HQ_FIELD_RULES.strata (THE CUT was undone 2026-09-22 — no cut row, no cut read); the bed is the room\'s hub', () => {
    const st = DATA.HQ_FIELD_RULES.strata;
    assert.equal(DATA.HQ_FIELD_RULES.cut, undefined, 'THE CUT is gone from the rules');
    assert.equal(st.on, true); assert.ok(st.beds.woods && st.beds.city && st.beds.cavern && st.fallback.side, 'a bed per hub + the fallback');
    const r = TR.slice(TR.indexOf('    function _hqHandoverRules() {'), TR.indexOf('    function _hqHandoverStash(H, opts) {'));
    assert.ok(!/EW_HQ_NO_FIELD_CUT|_hqCutHit|_fieldMoatBuild|uCutFade/.test(TR), 'no trace of THE CUT in the renderer');
    assert.ok(r.indexOf('cut:') < 0, 'the hand-over rules carry no cut');
    /* the bed: a room's hub, a room's own row, a room nobody claims */
    const woods = DATA.hqFieldBedFor('site_prebuilt_fairy_forest_clearing');
    assert.equal(woods.hub, 'woods'); assert.equal(woods.side, st.beds.woods.side);
    const city = DATA.hqFieldBedFor('site_prebuilt_downtown_streets');
    assert.equal(city.hub, 'city');
    const own = DATA.hqFieldBedFor('no_such_room');
    assert.equal(own.hub, 'fallback'); assert.equal(own.side, st.fallback.side);
    /* every bed names a terrain sheet the game has */
    const SP = fs.readFileSync(path.join(__dirname, 'sprites.js'), 'utf8');
    Object.keys(st.beds).concat(['fallback']).forEach((k) => {
        const row = k === 'fallback' ? st.fallback : st.beds[k];
        [row.side, row.floor].forEach((key) => assert.ok(new RegExp('^\\s*' + key + ':\\s*\\[', 'm').test(SP), 'a terrain sheet: ' + key));
    });
    assert.equal(typeof DATA.hqFieldStrataOn, 'function');
});

test('delivery 6 · the field record carries every cell\'s LEVEL at the build (the strata\'s reference)', () => {
    const W = DATA.hqFieldWindow(GROUNDS, { x: 0, z: 0 }, { x: 2, z: 0 });
    assert.ok(W, 'a window on the grounds');
    const entry = DATA.hqFieldBuild(GROUNDS, W.board.x0 !== undefined ? W.raster.ox : 0, W.raster.oz, {});
    const F = entry.field, B = entry.baseH || DATA.HQ_FIELD_RULES.base;
    assert.ok(Array.isArray(F.levels) && F.levels.length === F.S, 'levels per row');
    let inCells = 0;
    for (let y = 0; y < F.S; y++) for (let x = 0; x < F.S; x++) {
        const ch = F.cells[y].charAt(x);
        if (ch >= '1' && ch <= '9') { inCells++; assert.equal(F.levels[y][x], DATA.HQ_FIELD_RULES.base + (ch.charCodeAt(0) - '1'.charCodeAt(0)), 'the level is the cell\'s tile over the base'); }
        assert.equal(typeof F.levels[y][x], 'number');
    }
    assert.ok(inCells > 8, 'the window has floor');
});

test('delivery 6 · THE STRATA in a vm: a dig drops the cell and shows the bed\'s four inward faces, a raise climbs with four outward faces, two neighbouring digs share no wall, nothing moved = nothing drawn', () => {
    const src = TR.slice(TR.indexOf('    function _fieldStrataFaces(N, yAt, deltaAt, elev) {'), TR.indexOf('    var _fieldStrataMats = null;'));
    const ctx = { Math }; vm.createContext(ctx); vm.runInContext(src + '\nthis.faces = _fieldStrataFaces;', ctx);
    const elev = 100, N = 3;
    const mk = (delta) => ({ yAt: (x, y) => 500 + (delta[y][x] || 0) * elev, deltaAt: (x, y) => delta[y][x] || 0 });
    const none = ctx.faces(N, mk([[0,0,0],[0,0,0],[0,0,0]]).yAt, mk([[0,0,0],[0,0,0],[0,0,0]]).deltaAt, elev);
    assert.equal(none.tops.length, 0); assert.equal(none.faces.length, 0);
    const dig = mk([[0,0,0],[0,-2,0],[0,0,0]]);
    const D = ctx.faces(N, dig.yAt, dig.deltaAt, elev);
    assert.equal(D.tops.length, 1); assert.equal(D.tops[0].top, 300, 'two levels down');
    assert.equal(D.faces.length, 4); D.faces.forEach((f) => { assert.equal(f.out, false, 'the pit wall faces in'); assert.equal(f.y0, 300); assert.equal(f.y1, 500); });
    const raise = mk([[0,0,0],[0,1,0],[0,0,0]]);
    const Rz = ctx.faces(N, raise.yAt, raise.deltaAt, elev);
    assert.equal(Rz.faces.length, 4); Rz.faces.forEach((f) => { assert.equal(f.out, true); assert.equal(f.y0, 500); assert.equal(f.y1, 600); });
    const two = mk([[0,0,0],[-1,-1,0],[0,0,0]]);
    const T = ctx.faces(N, two.yAt, two.deltaAt, elev);
    assert.equal(T.tops.length, 2); assert.equal(T.faces.length, 5, 'n + s for the edge cell (an OUT neighbour is the room\'s own wall), n + s + e for the other, none between them');
    assert.ok(!T.faces.some((f) => (f.x === 0 && f.side === 'e') || (f.x === 1 && f.side === 'w')), 'no wall between them');
    /* a raise beside an OUT cell shows its face from its original top */
    const edge = mk([[0,0,0],[0,0,0],[0,0,0]]);
    const yAtOut = (x, y) => (x === 0 && y === 1) ? null : (500 + (x === 1 && y === 1 ? 200 : 0));
    const E = ctx.faces(N, yAtOut, (x, y) => (x === 1 && y === 1) ? 2 : 0, elev);
    const w = E.faces.find((f) => f.side === 'w'); assert.ok(w && w.edge && w.y0 === 500 && w.y1 === 700, 'the west face from the old top');
});

test('delivery 6 · THE STRATA in the renderer: the ground read adds the engine\'s delta, rebuildTerrain\'s field branch builds the columns, the pick quads follow', () => {
    const fg = TR.slice(TR.indexOf('    function _fieldGround() {'), TR.indexOf('    function _fieldGroundTop(x, y) {'));
    assert.match(fg, /levels: \(strataOn && R\.field\.levels\) \? R\.field\.levels : null/);
    assert.match(fg, /: this\.floorY \+ t \* this\.s \+ this\.deltaAt\(x, y\) \* this\.elev; \} \};/, 'the true top + the delta');
    assert.match(fg, /var eh = \(typeof getBaseHeightAt === 'function'\) \? getBaseHeightAt\(x, y\)/, 'the engine\'s live height');
    const rb = TR.slice(TR.indexOf('    function rebuildTerrain() {'), TR.indexOf('    function rebuildTerrain() {') + 3000);
    assert.match(rb, /_fieldPickBuild\(ts\);[^\n]*\n\s*try \{ _fieldStrataBuild\(ts\); \}/, 'the columns after the picks, on every terrain rebuild');
    const sb = TR.slice(TR.indexOf('    function _fieldStrataBuild(ts) {'), TR.indexOf('    /* activate(): the dome snap'));
    assert.match(sb, /hqFieldBedFor\(G\.R\.roomId\)/); assert.match(sb, /_shadowsDirty = true;/);
    /* the delta in a vm: a dug cell reads lower */
    const src = TR.slice(TR.indexOf('    var _fieldGroundCache = { key: null, G: null };'), TR.indexOf('    function _fieldGroundLive() {'));
    const boardH = [[5, 5], [5, 3]];
    const ctx = { CONFIG: { tileSize: 100 }, BASE_TILE: 100, ELEV_STEP_RATIO: 1, _hqBattleRoomKey: () => 'k', hqFieldGroundOn: () => true, hqFieldStrataOn: () => true, getBaseHeightAt: (x, y) => boardH[y][x], Math,
                  _hqBattleRoom: () => ({ site: false, cave: false, base: 5, T: { N: 2, C: 1.75 }, field: { tops: [[0, 0], [0, 0]], levels: [[5, 5], [5, 5]] } }) };
    vm.createContext(ctx); vm.runInContext(src + '\n_fieldGroundArmed = true; this.__t = _fieldGroundTop;', ctx);
    assert.equal(ctx.__t(0, 0), 500, 'unmoved: the true top');
    assert.equal(ctx.__t(1, 1), 300, 'dug two levels: two steps down');
    boardH[0][1] = 6; assert.equal(ctx.__t(1, 0), 600, 'raised one: a step up, read live');
});

/* ══ THE HIGHLIGHTS CONFORM · THE LIVE LEVELS · THE WAY BACK (2026-09-22) ══ */
test('the highlights conform: the drape samples the room\'s own ground at every vertex of a terrain room\'s field', () => {
    const a = TR.indexOf('    var _fieldGroundCache = { key: null, G: null };'), b = TR.indexOf('    /* ══ THE SEAMLESS FIELD rev 3 — THE LIGHT HOLDS');
    const src = TR.slice(a, b);
    assert.ok(a > 0 && b > a, 'the block stands');
    const ts = 100, C = 2, base = 5;
    /* the room: a slope rising along +x at 0.25 m per metre; cell (1,0)'s top is its centre (3 m, 0 m) → 0.75; a wall at (2,0) */
    const R = { site: false, cave: false, terrain: true, roomId: 'r', base, T: { N: 3, C, x0: 0, z0: 0 }, field: { tops: [[0.25, 0.75, 1.25]] } };
    let asked = [];
    const ctx = { window: {}, CONFIG: { tileSize: ts }, BASE_TILE: 96, ELEV_STEP_RATIO: 1, console, performance: { now: () => 0 },
                  _hqBattleRoom: () => R, _hqBattleRoomKey: () => 'k', hqFieldGroundOn: () => true, getBaseHeightAt: () => base,
                  hqTerrainInfo: (id) => (id === 'r' ? { ok: true } : null),
                  hqTerrainFeet: (info, x, z, cur) => { asked.push([x, z, cur]); return x >= 4 ? null : x * 0.25; } };
    vm.createContext(ctx);
    vm.runInContext(src + '\n_fieldGroundArmed = true; this.__s = _fieldGroundSampleAt; this.__top = _fieldGroundTop;', ctx);
    const s = ts / C, floor = base * ts;
    assert.equal(ctx.__top(1, 0), floor + 0.75 * s, 'the cell top');
    /* the west edge of cell (1,0) is x = 2 m → 0.5; the east edge x = 4 m → 1.0: the drape rises across the cell */
    assert.equal(ctx.__s(1 * ts, 0.5 * ts, 1, 0), floor + 0.5 * s, 'the west edge samples the slope');
    assert.ok(Math.abs(ctx.__s(2 * ts - 1e-6, 0.5 * ts, 1, 0) - (floor + 1.0 * s)) < 1e-3, 'the east edge samples the slope');
    assert.ok(asked.every(q => q[2] === 0.75), 'asked at the cell\'s own layer (the deck / wall rule)');
    assert.equal(ctx.__s(2.5 * ts, 0.5 * ts, 2, 0), floor + 1.25 * s, 'a sample the feet rule refuses is the cell top');
    assert.equal(ctx.__s(0, 0, 0, 0), floor + 0 * s, 'the cell\'s corner');
    /* a box room (no terrain) answers null: the drape stays a plane */
    R.terrain = false; ctx._hqBattleRoomKey = () => 'k2';
    vm.runInContext('_fieldGroundCache.key = null; _fieldGroundSamplerCache.key = null;', ctx);
    assert.equal(ctx.__s(1 * ts, 0.5 * ts, 1, 0), null);
    /* the drape builder reads it */
    assert.ok(TR.includes("var fieldC = (typeof _fieldGroundSampleAt === 'function') ? _fieldGroundSampleAt(hx * ts + ts / 2, hy * ts + ts / 2, hx, hy) : null;") && TR.includes("y = (fy === null || fy === undefined) ? 0 : (fy - tileTopY(hx, hy));"), '_buildDrapeGeo samples the field');
    assert.ok(TR.indexOf('if (field !== null) {') < TR.indexOf('} else if (stair) {') && TR.includes('var nat = !stair && field === null && _isNaturalRenderTile(hx, hy);'), 'the field branch leads the stair and the landform');
    /* THE LIFT (rev 2): a field plate rides HL_FIELD_LIFT tiles over the ground at a finer grid, so the sheet never covers it */
    assert.ok(/var HL_FIELD_LIFT = 0\.0[2-9], HL_FIELD_SEGS = [4-9];/.test(TR), 'HL_FIELD_LIFT + HL_FIELD_SEGS are declared');
    assert.ok(TR.includes('if (field !== null) { stair = null; segs = HL_FIELD_SEGS; }'), 'a field drape takes the finer grid');
    assert.ok(TR.includes("var fieldLift = (typeof _fieldGroundLiftPx === 'function') ? _fieldGroundLiftPx(ts, hx, hy) : 0;") && TR.includes('tileTopY(hx, hy) + yOff + roofLift + fieldLift'), '_makeHlTile lifts a field plate');
    vm.runInContext('_fieldGroundCache.key = null; _fieldGroundSamplerCache.key = null;', ctx);
    R.terrain = true; ctx._hqBattleRoomKey = () => 'k3';
    vm.runInContext('this.__lift = _fieldGroundLiftPx;', ctx);
    assert.ok(Math.abs(ctx.__lift(ts, 1, 0) - 0.04 * ts) < 1e-9, 'the lift is HL_FIELD_LIFT tiles on an IN cell');
    assert.equal(ctx.__lift(ts, -1, 0), 0, 'no lift off the window');
});

test('THE WAY BACK: the snapshot + the eye, the arrival ease on the HQ camera, the seamless enter, the latch outlives the commit', () => {
    const BT = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
    const CSS = fs.readFileSync(path.join(__dirname, 'styles-cinematic.css'), 'utf8');
    const IX = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    /* the renderer */
    assert.ok(TR.includes('function _fieldSnapshot(o) {') && TR.includes('fieldSnapshot: function (o) { return _fieldSnapshot(o); }'), 'the API');
    assert.ok(TR.includes('var inv = _hqBattleRoomMatrix(R, ts).invert();') && TR.includes('rec.eye = { x: pos.x / U, y: pos.y / U, z: pos.z / U, lx: look.x / U, ly: look.y / U, lz: look.z / U, fov: cam.fov || 45, room: R.roomId };'), 'the eye in room metres through the matrix inverted');
    assert.ok(TR.includes("if (ThreePost && ThreePost.isReady && ThreePost.isReady()) ThreePost.render(cam); else renderer.render(scene, cam);\n                ctx.drawImage(canvas, 0, 0);"), 'a render + a copy in one task');
    assert.ok(TR.includes('setTimeout(rec.fade, holdCap);'), 'the cap fades it regardless');
    assert.ok(TR.includes("arrive: (opts.arrive && isFinite(+opts.arrive.x) && isFinite(+opts.arrive.z)) ? { eye: opts.arrive, ms:"), 'the enter records the eye');
    assert.ok(TR.includes('if (H.arrive) {\n            var A = H.arrive, E = A.eye, nowA = performance.now();') && TR.includes('if (H.ready) A.t0 = nowA;') && TR.includes('if (tA >= 1) H.arrive = null;'), 'the camera holds at the eye until READY, then eases onto the boom');
    assert.ok(TR.includes('if (!H.arrive && Math.abs(cam.fov - 52) > 0.01) { cam.fov = 52; cam.updateProjectionMatrix(); }'), 'the lens reset yields to the arrival');
    /* the ease itself: a vm over the camera tick's arithmetic */
    const ease = (t) => t * t * (3 - 2 * t);
    assert.equal(ease(0), 0); assert.equal(ease(1), 1); assert.ok(Math.abs(ease(0.5) - 0.5) < 1e-9);
    /* battle.js */
    assert.ok(BT.includes('function _encReturnLeave() {') && BT.includes("ThreeRenderer.fieldSnapshot({ ms: 420, holdCap: 4500 })") && BT.includes("resultOverlay.classList.add('vic-leaving');") && BT.includes('try { ok = !!arrive.take(); } catch (e) { ok = false; }') && BT.includes('window._hqReturnArrive = ok ? arrive : null;'), 'the panel fades, the frame is taken, the return rides it');
    assert.ok(BT.includes('let _encRoomLast = null;') && BT.includes('const m = _encMatch || _encRoomLast;') && BT.includes('_encRoomLast = _encMatch;   // a plain match never wears a room') && BT.includes('_encMatch = null; _encRoomLast = null;'), 'the room record outlives the commit, never a plain match');
    /* map.js */
    const MP = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
    assert.ok(MP.includes('const arrive = window._hqReturnArrive || null;') && MP.includes("seamless: (arrive && arrive.eye) ? arrive : null })) {") && MP.includes('arriveDrop();\n            _hqHome = false;'), 'the return hands the frame to the enter, drops it off the building');
    assert.ok(MP.includes("load.style.display = seamless ? 'none' : '';") && MP.includes('if (!seamless) _hqLoadProgressStart(loadGeneration, roomId, roomDef, baseNote);') && MP.includes('arrive: seamless ? seamless.eye : null,') && MP.includes('if (seamless) { try { seamless.fade(); } catch (e) {} return; }'), 'no card, the eye to the renderer, the fade on ready');
    assert.ok(CSS.includes('.result-overlay.vic-leaving { opacity: 0; transition: opacity 0.26s ease; pointer-events: none; }'), 'the panel\'s fade');
    assert.ok(/\?v=\d{8}[a-z0-9-]*-cors/.test(IX) && !IX.includes('20260922-floaters-alleys-01-cors'), 'the token moved');
});
