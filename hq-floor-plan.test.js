/* hq-floor-plan.test.js — THE GENERATED FLOOR PLAN + THE ROOM LOOKS + THE VIDEO
   SETTINGS EVERYWHERE (HQ plan 9.3 stage 5, 2026-09-17).
   The user: "use room and hallway generation algorithms like cellular automata or
   random room placing to make the maps as opposed to just making them big box
   rooms … I can see the square edge of the landscape, supposed to be fog … the
   entire area is outlined in wood planks … see what can be done with the graphics
   settings on a per map basis … I need the video settings in the pause menu".
   1. terrain.gen (data.js _hqTGenerate): the cave chambers wear a cellular-
      automata plan, the open woods a clearings-and-corridors plan; the mask is a
      signed distance, the solid is a rise the walker's own rule refuses, every
      authored thing is forced open, every door still reaches every other, no
      tree / scatter / thicket stands on the wrong side, the dump draws it.
   2. shell.look / env.look → ThreePost.setSceneLook: an overlay, never a saved
      preference; applied on room entry, dropped on leave, the menu bare, the
      battle keyed on its map row; Map Looks refuses it.
   3. The fog past a field: a per-metre density, the outer ground, no kerb.
   4. ui.js _buildVideoSettingsHTML: one sheet for the battle pause menu, the main
      menu and the HQ pause menu (map.js renders it into the same body). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data');

const D = loadGameData(), HQ = D.DOOR_HQ;
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const renderer = read('three-renderer.js'), post = read('three-post.js'), ui = read('ui.js'), map = read('map.js'), data = read('data.js');
const ROOMS = D.hqTerrainRooms();
const PLANNED = ROOMS.filter(id => HQ.rooms[id].terrain.gen);
const G = D.HQ_TERRAIN_GEN;

test('the sheet: seventeen of the eighteen terrain rooms carry a floor plan — the cave chambers cellular automata, the open woods clearings + corridors; the storm drain (a culvert) keeps its box', () => {
    assert.equal(PLANNED.length, 22, PLANNED.join(','));   // + CYBERPUNK CITY's grid (the second pass, 2026-09-17), + THE DIVINE STAIR's four, + THE VATICAN's archive and cortile (2026-09-17; the basilica and the observatory are their own floors), + DISASTER CITY's streets and mall (the `city` kind)
    for (const id of PLANNED) {
        const room = HQ.rooms[id], gen = room.terrain.gen, info = D.hqTerrainInfo(id);
        assert.ok(gen.kind === 'cave' || gen.kind === 'rooms' || gen.kind === 'city', id + ': kind ' + gen.kind);
        if (gen.kind === 'city') { assert.ok(Array.isArray(gen.streets) && gen.streets.length >= 2 && info.lots.length >= 10 && info.fronts.length >= 4, id + ': a city plan — streets, lots, fronts'); }   // DISASTER CITY (2026-09-17)
        else if (room.shell.open) assert.equal(gen.kind, 'rooms', id + ': an open room grows a thicket, not rock');
        else assert.equal(gen.kind, 'cave', id + ': a closed chamber is carved, not planted');
        assert.ok(info.mask && info.maskD && info.forced && info.mask.length === info.nx * info.nz, id + ': a mask on the field\'s own grid');
        assert.ok(info.gen && info.gen.kind === gen.kind && info.gen.wallH > 1.0, id + ': the plan record');
        assert.ok(info.gen.open >= G.minOpen && info.gen.open <= G.maxOpen, id + ': open share ' + info.gen.open.toFixed(2) + ' outside [' + G.minOpen + ', ' + G.maxOpen + ']');
    }
    assert.ok(!HQ.rooms.site_prebuilt_fairy_forest_deadmans.terrain.gen, 'the storm drain is a culvert, not a cave');
});

test('THE MASK IS THE HEIGHT: every solid cell deep in the plan stands at least half the wall above the floor round it, every forced cell is open, the rim of a plan is solid, and the field is a wall to the walker by the slope rule alone', () => {
    for (const id of PLANNED) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id), S = room.shell, res = info.res;
        let deep = 0, low = 0, forcedSolid = 0, rimOpen = 0;
        for (let j = 0; j < info.nz; j++) for (let i = 0; i < info.nx; i++) {
            const k = j * info.nx + i, x = info.x0 + i * res, z = info.z0 + j * res;
            if (info.forced[k] && !info.mask[k] && Math.abs(x) < S.w / 2 && Math.abs(z) < S.d / 2 && !(info.sealedCells && info.sealedCells.has(k))) forcedSolid++;   // inside the walls (a lane runs past them; past the wall is solid by rule); THE RETURN GUARANTEE (2026-09-17) may SEAL a trap's forced cells as a last resort (info.sealedCells) — nobody can use a trap
            if (Math.abs(x) < S.w / 2 - 0.4 && Math.abs(z) < S.d / 2 - 0.4 && (Math.abs(x) > S.w / 2 - 0.55 || Math.abs(z) > S.d / 2 - 0.55) && info.mask[k] && !info.forced[k]) rimOpen++;
            if (info.maskD[k] < -(info.gen.edge + 0.2) && Math.abs(x) < S.w / 2 - 1 && Math.abs(z) < S.d / 2 - 1) {
                deep++;
                /* the nearest open ground: walk the row until the mask opens */
                /* against the AUTHORED floor under the cell (info.hFn = the field before the plan's rise) — THE DIVINE STAIR (2026-09-17): a cloud bank on the floor beside a 12 m landing is judged against the floor it stands on, not the tier a row-walk finds first */
                const g = info.hFn(x, z);
                /* STREET LEVEL rev 2 (2026-09-17): a city block is a MASS at street level — the height is not the wall there; the walker's rule is */
                if (info.gen.solidMass) { if (D.hqTerrainFeet(info, x, z, null) !== null) low++; }
                else if (g != null && info.H[k] - g < info.gen.wallH * 0.5) low++;
            }
        }
        assert.equal(forcedSolid, 0, id + ': a forced cell went solid');
        assert.equal(rimOpen, 0, id + ': the rim is open in ' + rimOpen + ' cells (the plan\'s edge is solid)');
        assert.ok(deep >= 1, id + ': solid past the rise band: ' + deep + ' (a room that is nearly all authored keeps its plan to the rim and the tiers\' edges)');
        assert.ok(low / deep < 0.15, id + ': ' + low + ' of ' + deep + ' deep solid cells stand low');
        /* the walker's rule: from open ground THE WALKER REACHES beside the solid, walk straight at it carrying the feet — the rise is never climbed
           (the slope refuses it). DISASTER CITY (2026-09-17): a hard tape's roof is an open tier INSIDE the solid (its top is the door gun's) — a
           walk that starts up there is not the walker's, so the start cells are the reach from the first door. */
        const L0 = D.hqTerrainDoorLanding(room, room.doors[0]), R0 = D.hqTerrainReach(info, L0.x, L0.z);
        let climbed = 0, tried = 0;
        for (let j = 2; j + 2 < info.nz; j += 2) for (let i = 2; i + 2 < info.nx; i += 2) {
            const k = j * info.nx + i; if (!info.mask[k] || info.maskD[k] > 0.7 || info.maskD[k] < 0.2) continue;
            if (!R0.has(D.hqTerrainNodeKey(info, info.x0 + i * res, info.z0 + j * res))) continue;
            const x = info.x0 + i * res, z = info.z0 + j * res, y0 = D.hqTerrainFeet(info, x, z, null); if (y0 == null) continue;
            for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const kk = k + dx * 3 + dz * 3 * info.nx; if (kk < 0 || kk >= info.mask.length || info.maskD[kk] > -0.2) continue;
                tried++; let y = y0, hit = false;
                for (let st = 1; st <= 10; st++) {
                    const xx = x + dx * st * res, zz = z + dz * st * res, yy = D.hqTerrainFeet(info, xx, zz, y);
                    if (yy == null || yy - y > info.rules.climb) break;
                    y = yy; if (D.hqTerrainMaskAt(info, xx, zz) < -(info.gen.edge + 0.1)) { hit = true; break; }
                }
                if (hit) climbed++;
            }
        }
        assert.ok(tried >= 10 && climbed / tried < 0.1, id + ': the solid is climbed in ' + climbed + ' of ' + tried + ' walks');
    }
});

test('THE GUARANTEE holds with the plan: every door reaches every other under the walker\'s rule, no tree / scatter stands on the solid, the thicket stands ONLY on the solid of an open room, the natives and props keep their open ground', () => {
    for (const id of PLANNED) {
        const room = HQ.rooms[id], info = D.hqTerrainInfo(id);
        const L = room.doors.map(d => D.hqTerrainDoorLanding(room, d));
        for (const a of L) { const reach = D.hqTerrainReach(info, a.x, a.z); for (const b of L) assert.ok(reach.has(D.hqTerrainNodeKey(info, b.x, b.z)), id + ': a door unreached with the plan'); }
        for (const t of info.trees) assert.ok(D.hqTerrainMaskAt(info, t.x, t.z) > 0, id + ': a tree at ' + t.x + ',' + t.z + ' on the solid');
        for (const q of info.scatter) assert.ok(D.hqTerrainMaskAt(info, q.x, q.z) > 0, id + ': ' + q.key + ' on the solid');
        for (const t of info.thicket || []) assert.ok(D.hqTerrainMaskAt(info, t.x, t.z) < -0.5, id + ': a thicket tree on the open floor');
        if (room.terrain.gen.kind === 'city') assert.equal(info.thicket.length, 0, id + ': a city grows buildings, not a thicket');   // DISASTER CITY (2026-09-17)
        else if (room.shell.open && room.terrain.gen.thicket !== false) assert.ok(info.thicket.length >= 3 && info.thicket.length <= G.rooms.maxTrees, id + ': thicket ' + info.thicket.length);
        else if (room.shell.open) assert.equal(info.thicket.length, 0, id + ': no thicket in heaven (gen.thicket: false)');
        else assert.equal(info.thicket.length, 0, id + ': a cave grows no thicket');
        for (const q of (room.npcSpots || []).concat([room.spawn])) if (q && q.x != null) assert.ok(D.hqTerrainMaskAt(info, q.x, q.z) > 0.3, id + ': a body at ' + q.x + ',' + q.z + ' in the solid');
        for (const p of room.props || []) { if (p.wall || p.ceil) continue; assert.ok(D.hqTerrainMaskAt(info, p.x || 0, p.z || 0) > 0, id + ': ' + p.key + ' in the solid'); }
        assert.ok(D.hqTerrainDump(info, { step: 1 }).some(l => l.includes('#')), id + ': the dump draws the solid');
    }
    assert.ok(D.hqTerrainMaskAt(D.hqTerrainInfo('site_prebuilt_fairy_forest_deadmans'), 0, 0) === Infinity, 'no plan = no mask (Infinity inside)');
});

test('the plan is deterministic and seeded: the same room compiles to the same mask twice; another seed is another plan; the automaton\'s rounds and the corridor carving are real code paths', () => {
    const room = HQ.rooms.site_prebuilt_hollow_earth_gallery;
    const a = D.hqTerrainCompile(room, 'site_prebuilt_hollow_earth_gallery'), b = D.hqTerrainCompile(room, 'site_prebuilt_hollow_earth_gallery');
    assert.equal(Buffer.from(a.mask).toString('hex'), Buffer.from(b.mask).toString('hex'), 'the same plan twice');
    const copy = JSON.parse(JSON.stringify(Object.assign({}, room, { _terrainInfo: undefined })));
    copy.terrain.gen = Object.assign({}, copy.terrain.gen, { seed: 99 });
    const c = D.hqTerrainCompile(copy, 'site_prebuilt_hollow_earth_gallery');
    assert.notEqual(Buffer.from(a.mask).toString('hex'), Buffer.from(c.mask).toString('hex'), 'another seed, another cave');
    const L = room.doors.map(d => D.hqTerrainDoorLanding(copy, d));
    for (const p of L) { const reach = D.hqTerrainReach(c, p.x, p.z); for (const q of L) assert.ok(reach.has(D.hqTerrainNodeKey(c, q.x, q.z)), 'the reseeded cavern still joins every door'); }
    /* a hostile plan: a room whose plan is all rock but for the doors — the carving joins them */
    const tiny = { label: 'x', kind: 'box', shell: { w: 20, d: 14, h: 5, open: false }, terrain: { gen: { kind: 'cave', fill: 0.97, iters: 0, seed: 3, rounds: 0 }, features: [] },
                   doors: [{ id: 'a', wall: 'w', z: 0 }, { id: 'b', wall: 'e', z: 3 }, { id: 'c', wall: 'n', x: -6 }], props: [] };
    const t = D.hqTerrainCompile(tiny, 'tiny');
    assert.ok(t.gen.carved >= 1, 'corridors carved: ' + t.gen.carved);
    const TL = tiny.doors.map(d => D.hqTerrainDoorLanding(tiny, d));
    for (const p of TL) { const reach = D.hqTerrainReach(t, p.x, p.z); for (const q of TL) assert.ok(reach.has(D.hqTerrainNodeKey(t, q.x, q.z)), 'the carved corridors join every door'); }
    assert.ok(t.gen.open < 0.5, 'the rest stays rock (' + t.gen.open.toFixed(2) + ')');
});

test('THE ROOM LOOKS: every woods room, every cave chamber and the storm drain wear a look; five battle maps (and their Δs) carry one in env.look; a look is the overlay\'s shape', () => {
    const shape = (l, where) => {
        assert.ok(l && typeof l.name === 'string' && l.retro && typeof l.retro.enabled === 'boolean' && typeof l.retro.preset === 'string', where + ': a look with a retro row');
        assert.ok(l.cin && typeof l.cin.vignette === 'boolean', where + ': a vignette row');
        for (const k of ['nightMood', 'bloom', 'exposure', 'dof']) if (l[k] != null) assert.ok(typeof l[k] === 'number', where + ': ' + k);
        assert.ok(/'(teal|green|amber|dream|faded)'/.test("'" + l.retro.preset + "'") && post.includes(l.retro.preset + ':  {') || post.includes(l.retro.preset + ': {'), where + ': the preset ' + l.retro.preset + ' is one of three-post\'s');
    };
    for (const id of ROOMS) shape(HQ.rooms[id].shell.look, id);
    const woods = ROOMS.filter(id => id.includes('fairy_forest') && !id.includes('deadmans'));
    for (const id of woods) assert.equal(HQ.rooms[id].shell.look, D.HQ_ROOM_LOOKS.woods, id + ': the woods\' look');
    for (const id of ROOMS.filter(id => id.includes('hollow_earth'))) { assert.equal(HQ.rooms[id].shell.look, D.HQ_ROOM_LOOKS.cave, id); assert.ok(HQ.rooms[id].shell.fog && HQ.rooms[id].shell.fog.density > 0, id + ': the cave\'s own haze'); }
    assert.equal(HQ.rooms.site_prebuilt_fairy_forest_deadmans.shell.look, D.HQ_ROOM_LOOKS.drain);
    const withLook = D.EW_MAP_META.filter(m => m.env && m.env.look);
    for (const m of withLook) shape(m.env.look, m.id);
    for (const id of ['prebuilt_fairy_forest', 'prebuilt_hollow_earth', 'prebuilt_haunted', 'prebuilt_backrooms', 'prebuilt_hell']) {
        assert.ok(withLook.find(m => m.id === id), id + ' wears a look');
        assert.ok(withLook.find(m => m.id === id + '_delta'), id + '\'s Δ inherits it');
    }
    assert.ok(data.indexOf('const HQ_ROOM_LOOKS = {') < data.indexOf('const EW_MAP_META = ['), 'the looks are declared above the map table (a const in its dead zone would throw at load)');
});

test('THE OVERLAY in three-post.js: setSceneLook / getSceneLook exported, every consumer reads the look first (retro uniforms + the pass gate, the cinematic uniforms + gates, night mood, exposure, bloom, DoF), and the overlay never writes a preference', () => {
    assert.ok(post.includes('setSceneLook: setSceneLook,') && post.includes('getSceneLook: getSceneLook,'), 'exported');
    const fn = post.slice(post.indexOf('    function setSceneLook(look) {'), post.indexOf('    function getSceneLook() {'));
    assert.ok(fn.length > 100 && !/localStorage|_saveRetro|_saveCinematic/.test(fn), 'no preference is written by the overlay');
    ['var R = _lkRetro();', 'u.uPixelSize.value      = R.pixelSize;', '_retroPass.enabled = !!_lkRetro().enabled;', "var u = _cinematicPass.material.uniforms, C = _lkCin();", "u['uVignetteAmount'].value = C.vignette ? C.vigAmount : 0.0;",
     "var _ng = _nightF * _lkNum('nightMood', _nightMood) * 0.85;", "_lkNum('exposure', _exposureUser)", "var _bu = _lkNum('bloom', BLOOM_USER_STRENGTH), _bloomOn = _bu > 0;", "var _ds = _lkNum('dof', _dofStrength);",
     "_lkRetro().pixelSize > 1.0 && cam"].forEach(f => assert.ok(post.includes(f), 'consumer: ' + f));
    assert.ok(!/_cur\.exposure \* _exposureUser \*/.test(post), 'no bare exposure read survives');
    assert.ok(!/Math\.max\(_cur\.bloomStr, BLOOM_USER_STRENGTH\)/.test(post), 'no bare bloom read survives');
    /* the getters the panels read still answer the preference */
    assert.ok(post.includes('function getRetroState() {\n        var out = {};\n        for (var k in _retro) out[k] = _retro[k];'), 'getRetroState answers _retro, not the overlay');
});

test('THE RENDERER wears it: a room\'s look on entry, dropped on leave, the menu bare, the battle keyed on its map row, the Map Looks refusal read in one place, the settings toggle re-lays it', () => {
    ["ThreePost.setSceneLook(_sceneLookOf(S.look, room.label));", "ThreePost.setSceneLook(null); } catch (e) {}   // the room's look leaves with the room",
     "ThreePost.setSceneLook(null); } catch (e) {}   // the menu wears the player's own settings", "_applyEnvLook((typeof state !== 'undefined' && state && state.mapEnv) || null);",
     "function _sceneLooksOn() {", "localStorage.getItem('ew_scene_looks') === 'off'", "_envLookKey = '';   // THE SCENE LOOK: the battle re-applies its map's on the first environment update",
     "refreshSceneLook: function () {"].forEach(f => assert.ok(renderer.includes(f), f));
    assert.ok(ui.includes("window._setSceneLooks = function (on) {") && ui.includes("localStorage.setItem('ew_scene_looks', on ? 'on' : 'off');") && ui.includes('ThreeRenderer.refreshSceneLook()'), 'the toggle');
});

test('THE FOG PAST A FIELD: the woods\' sky carries a per-metre density the renderer converts, a closed chamber its own haze, the outer ground replaces the flat apron + skirt, and no paving kerb outlines a field', () => {
    const sky = HQ.rooms.site_prebuilt_fairy_forest_clearing.shell.sky;
    assert.ok(sky.fog.density >= 0.02 && sky.fog.amount >= 0.8, 'a real fog (' + sky.fog.density + ' / m, amount ' + sky.fog.amount + ')');
    ["var fogD = (S.sky.fog && S.sky.fog.density > 0) ? S.sky.fog.density / U : 0.00005;", "if (S.fog && S.fog.color != null) sc.fog = new THREE.FogExp2(S.fog.color, (S.fog.density > 0 ? S.fog.density : 0.012) / U);",
     "function _hqBuildOuterGround(room, info, G, mat, TM, rng) {", "var HQ_OUTER_M = 54;", "if (S.open && room.terrain.outer !== false) { try { _hqBuildOuterGround(room, info, G, field.material, TM, rng); }",
     "} else if (room.terrain && room.terrain.outer !== false) {", "if (!room.terrain) runs.forEach(function (rn) { G.add(slab(0, HQ_EDGE_KERB_H, 0.16, 0.34, edgeTrim, rn)); });",
     "if (_hq.outer && (Math.abs(x) > _hq.outer.hx || Math.abs(z) > _hq.outer.hz)) return _hq.outer.yAt(x, z);",
     "_hq.blockers.push({ obj: tb, y: t.y, top: null, rad: t.r || 0.42, thicket: true });", "info.gen.solidSheet === 'cliff'"].forEach(f => assert.ok(renderer.includes(f), f));
    /* the outer ground on a stub: the ring's heights match the field at its edge and fall away far out */
    const a = renderer.indexOf('    function _hqTerrainGround(x, z) {'), b = renderer.indexOf('    function _hqBuildTerrain(room) {');
    class Obj { constructor() { this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.children = []; } add(o) { this.children.push(o); } }
    class Geo { constructor() { this.attributes = {}; } setAttribute(k, v) { this.attributes[k] = v; } setIndex(i) { this.index = i; } computeVertexNormals() {} }
    const ctx = vm.createContext({ console, THREE: { BufferGeometry: Geo, BufferAttribute: class { constructor(a, n) { this.array = a; this.itemSize = n; } }, Mesh: class extends Obj { constructor(g, m) { super(); this.geometry = g; this.material = m; } } },
        hqTerrainHeight: D.hqTerrainHeight, _hqTNoise: D._hqTNoise, _hqUnits: () => HQ.units, _hq: { terrain: null } });
    vm.runInContext(renderer.slice(a, b) + '\nthis.build = _hqBuildOuterGround; this.ground = _hqTerrainGround;', ctx);
    const room = HQ.rooms.site_prebuilt_fairy_forest_clearing, info = D.hqTerrainInfo('site_prebuilt_fairy_forest_clearing');
    ctx._hq.terrain = info; const G = new Obj();
    ctx.build(room, info, G, { m: 1 }, HQ.units * 1.75, () => 0.5);
    assert.ok(ctx._hq.outer && G.children.length === 1 && G.children[0]._ew_hqOuter, 'the ring mesh');
    const hx = info.halfW - 0.5;
    assert.ok(Math.abs(ctx._hq.outer.yAt(hx + 0.01, 0) - D.hqTerrainHeight(info, hx, 0)) < 0.05, 'matched to the field at its edge');
    assert.ok(ctx._hq.outer.yAt(hx + 52, 0) < -3, 'falls away under the fog far out (' + ctx._hq.outer.yAt(hx + 52, 0).toFixed(2) + ')');
    assert.ok(Math.abs(ctx.ground(hx + 10, 0) - ctx._hq.outer.yAt(hx + 10, 0)) < 1e-9, 'the treeline reads the outer ground');
});

test('THE VIDEO SETTINGS EVERYWHERE: one builder in ui.js, the battle pause menu\'s VIDEO tab and the main-menu / HQ pause menu Settings both render it, battle-only rows gated, Map Looks on the sheet; it renders headlessly for both hosts', () => {
    assert.ok(ui.includes('window._buildVideoSettingsHTML = function (refreshJs, opts) {'), 'the builder');
    assert.ok(ui.includes("return window._buildVideoSettingsHTML('_renderPauseMenu();', { battle: true,"), 'the pause menu\'s VIDEO tab');
    assert.ok(map.includes("window._buildVideoSettingsHTML('window._openMainMenuSettings();', { bare: true, noFullscreen: true,"), 'the main-menu Settings (and so the HQ pause menu\'s SETTINGS body)');
    const a = ui.indexOf('        window._buildVideoSettingsHTML = function (refreshJs, opts) {'), b = ui.indexOf('        /* ── Controls settings (shared', a);
    const src = ui.slice(a, b);
    assert.ok(!src.slice(0, src.indexOf('function _buildPauseVideo')).replace("const RJ = refreshJs || '_renderPauseMenu();'", '').includes("'_renderPauseMenu();'"), 'the shared body carries no host\'s refresh literal (beyond the default)');
    const TP = { isFXAAEnabled: () => true, isCinematicFilterEnabled: () => false, isVignetteEnabled: () => true, getCinematicState: () => ({ scanline: 0.07, chroma: 0.8, curvature: 0, vigAmount: 0.45, vigSize: 0.42, vigSoft: 0.55 }), getBloomStrength: () => 0.1, getBloomMaxStrength: () => 1.6, getShadowQuality: () => 'high', isFilmicTone: () => true, getDofStrength: () => 0.3, getExposureScale: () => 1, getExposureRange: () => ({ min: 0.55, max: 1.25 }), getNightMood: () => 0.4, getImpactFx: () => 0.7, getImpactFxMax: () => 1.5, isRetroFilterEnabled: () => true, getRetroState: () => ({ pixelSize: 1, ditherStrength: 0.6, ditherScale: 1, grain: 0.04, levels: 24, tintAmount: 0.55, pixelScope: 'models' }), getRetroPreset: () => 'teal', getRetroPresets: () => [{ key: 'teal', label: 'Eerie Teal' }], isRetroFogEnabled: () => true, getRetroFogDensity: () => 0.0004, getRetroFogHorizon: () => 0.05, getSceneLook: () => ({ name: 'THE WOODS' }) };
    const ctx = vm.createContext({ window: { _getUIScalePref: () => 1 }, localStorage: { getItem: () => null, setItem() {} }, document: { getElementById: () => null, fullscreenElement: null },
        state: { particleSettings: { aoe: true }, nametagMode: 'name' }, ThreePost: TP, ThreeRenderer: { getFpsCap: () => 0, isFpsCounterOn: () => false, isTerrainBatching: () => true, isFogGridOn: () => true, getLightRayStrength: () => 1 }, ThreeVFX: { getAmbientDensity: () => 0.5 } });
    vm.runInContext(src, ctx);
    const battle = ctx.window._buildVideoSettingsHTML('_renderPauseMenu();', { battle: true, perf: '<perf/>', extra: '<extra/>' });
    const hq = ctx.window._buildVideoSettingsHTML('window._openMainMenuSettings();', { bare: true, noFullscreen: true, perf: '<perf/>', extra: '<extra/>' });
    for (const t of ['Action Cam', 'Nametags', 'Fog Grid', 'Map Looks', 'wearing THE WOODS', '_renderPauseMenu();', 'Retro Filter', 'Particles', 'Fullscreen', 'pm-settings-section', '<perf/>', '<extra/>']) assert.ok(battle.includes(t), 'battle sheet: ' + t);
    for (const t of ['window._openMainMenuSettings', '${']) assert.ok(!battle.includes(t), 'battle sheet has ' + t);
    for (const t of ['Map Looks', 'window._openMainMenuSettings();', 'Retro Filter', 'Particles', 'Shadows', 'Bloom', 'CRT Filter', 'Brightness', 'Pixel Ratio']) assert.ok(hq.includes(t), 'HQ sheet: ' + t);
    for (const t of ['Action Cam', 'Nametags', 'Fog Grid', 'Fullscreen', 'pm-settings-section', '_renderPauseMenu', '${']) assert.ok(!hq.includes(t), 'HQ sheet has ' + t);
    /* the hosts' literal rows stay where the older tests read them */
    assert.ok(ui.includes("window._buildVitalsLookHTML('_renderPauseMenu();')") && map.includes("window._buildVitalsLookHTML('window._openMainMenuSettings();')"), 'the shared rows');
});
