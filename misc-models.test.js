'use strict';
/* THE MOVING-MAPS MODEL BATCH (2026-09-12) — source guards for the 28 Meshy
   GLBs the user uploaded to R2 Assets/misc/ and the sites that wear them:
   the _MISC_GLB table, the _hzMiscKit helper (run under a THREE double: the
   yaw pivot, the hang, the sink, the foot disc, the fallback), the six
   settings, the three streaming rosters, the Cannonball spell's gun, the HQ
   catalogue's misc-bucket entries and MODEL_INDEX.md naming every key. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
const VFX = fs.readFileSync(path.join(__dirname, 'three-vfx-effects.js'), 'utf8');
const DATA = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(__dirname, 'MODEL_INDEX.md'), 'utf8');

const BATCH = {
    vault: 'Meshy_AI_a_bank_vault_0912231605_texture.glb',
    flamingo: 'Meshy_AI_a_flamingo_0912231434_texture.glb',
    wreck: 'Meshy_AI_a_ghost_ship_wreck_0912231131_texture.glb',
    lantern: 'Meshy_AI_a_hanging_lantern_0912231043_texture.glb',
    tentacle: 'Meshy_AI_a_kraken_tentacle_0912231121_texture.glb',
    tentacle2: 'Meshy_AI_a_kraken_tentacle_2_0912231110_texture.glb',
    watch: 'Meshy_AI_a_pocket_watch_0912231541_texture.glb',
    watch_hang: 'Meshy_AI_a_pocket_watch_hanging_0912231556_texture.glb',
    rowboat: 'Meshy_AI_a_rowboat_0912231059_texture.glb',
    dish: 'Meshy_AI_a_satellite_dish_0912231301_texture.glb',
    crane: 'Meshy_AI_a_scaffold_crane_0912231516_texture.glb',
    wheel: 'Meshy_AI_a_ship_s_wheel_0912230950_texture.glb',
    dockring: 'Meshy_AI_a_spaceship_docking_ring_0912231400_texture.glb',
    standingstone: 'Meshy_AI_a_standing_stone_0912231506_texture.glb',
    palmisle: 'Meshy_AI_a_tiny_island_with_palm_tree_0912231720_texture.glb',
    hullplate: 'Meshy_AI_a_torn_hull_plate_with_wiring_0912231409_texture.glb',
    nacelle: 'Meshy_AI_an_engine_nacelle_0912231313_texture.glb',
    escapepod: 'Meshy_AI_an_escape_pod_0912231249_texture.glb',
    caterpillar: 'Meshy_AI_caterpillar_0912231445_texture.glb',
    astronaut: 'Meshy_AI_dead_astronaut_0912231349_texture.glb',
    saucer_lg: 'Meshy_AI_flying_saucer_with_landing_gear_0912231529_texture.glb',
    cannon: 'Meshy_AI_iron_canon_0912231022_texture.glb',
    chest: 'Meshy_AI_pirate_treasure_chest_0912231220_texture.glb',
    shark: 'Meshy_AI_shark_0912231236_texture.glb',
    anchor: 'Meshy_AI_ship_anchor_0912231033_texture.glb',
    teacups: 'Meshy_AI_stacked_teacups_0912231425_texture.glb',
    teapot: 'Meshy_AI_teapot_0912231417_texture.glb',
    trilithon: 'Meshy_AI_trilithon_0912231457_texture.glb',
};

function section(src, a, b) {
    const i = src.indexOf(a); assert.ok(i >= 0, a);
    const j = src.indexOf(b, i + a.length); assert.ok(j > i, b);
    return src.slice(i, j);
}

test('every file of the batch is in _MISC_GLB under its key, once', () => {
    const table = section(TR, 'var _MISC_GLB = {', '};');
    for (const [k, f] of Object.entries(BATCH)) {
        assert.match(table, new RegExp('\\n\\s*' + k + ':\\s*\'' + f.replace(/\./g, '\\.') + '\''), k);
        assert.equal(TR.split(f).length - 1, 1, f + ' named once in the renderer');
    }
    assert.equal(Object.keys(BATCH).length, 28);
});

test('every key of the batch is used by a builder, a setting or a roster', () => {
    const body = TR.replace(section(TR, 'var _MISC_GLB = {', '};'), '');
    for (const k of Object.keys(BATCH)) {
        assert.match(body, new RegExp("_hzMiscKit\\([^;]*?'" + k + "'|'" + k + "', [0-9.]+, '(span|height)'"), k + ' placed through _hzMiscKit (or a tea-party row)');
    }
});

test('the kit helper: yaw pivot, hang, sink, foot disc, fallback (THREE double)', () => {
    class V3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } }
    class Obj { constructor() { this.children = []; this.position = new V3(); this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.scale = { setScalar() {} }; this.isMesh = false; }
        add(o) { if (o.parent) o.parent.remove(o); o.parent = this; this.children.push(o); return this; }
        remove(o) { this.children = this.children.filter(c => c !== o); o.parent = null; }
        traverse(fn) { fn(this); this.children.forEach(c => c.traverse(fn)); }
        clone() { const c = new Obj(); c.isMesh = this.isMesh; c.material = this.material; this.children.forEach(k => c.add(k.clone())); return c; } }
    class Mesh extends Obj { constructor() { super(); this.isMesh = true; this.material = { map: 'bake' }; } }
    const root = new Obj(); root.add(new Mesh());
    root._ew_bbox = { min: new V3(-0.5, -0.5, -0.1), max: new V3(0.5, 0.5, 0.1) };
    const ctx = {
        THREE: { Group: Obj, Mesh, GLTFLoader: function () {}, MeshLambertMaterial: function (o) { Object.assign(this, o); }, MeshBasicMaterial: function (o) { Object.assign(this, o); }, Color: function (r, g, b) { this.r = r; this.g = g; this.b = b; }, FrontSide: 0 },
        CONFIG: { tileSize: 100 }, BASE_TILE: 100, window: {},
        _R2_MISC: 'misc/', _MISC_GLB: { thing: 'thing.glb' },
        _loadMiscModel(url, isGLB, cb) { cb(root); },
        _objectsDirty: false,
    };
    vm.createContext(ctx);
    vm.runInContext(section(TR, '    function _miscModelInstance(', '    // ── Esoteric background landmarks') +
                    section(TR, '    // keep the GLB\'s own baked texture, just unlit', '    // ── The D.O.O.R. kit on the board') +
                    section(TR, '    var _hzLiftPicks = {};', '    // ── Grid-snapped board props'), ctx);
    const plain = ctx._hzMiscKit('thing', { tiles: 2, foot: 0.7 });
    assert.equal(plain._ew_kit, 'thing'); assert.equal(plain._ew_footM, 0.7);
    assert.equal(plain.children.length, 1, 'the model clone straight in the group');
    assert.equal(plain.children[0].position.y, 100, 'base at y = 0 (bbox min −0.5 × scale 200 = 2 tiles / 1 unit)');
    const turned = ctx._hzMiscKit('thing', { tiles: 2, yaw: Math.PI / 2, tilt: 0.3, hang: true, sink: 0.25 });
    assert.equal(turned.children.length, 1, 'one pivot');
    const pv = turned.children[0];
    assert.equal(pv.rotation.y, Math.PI / 2); assert.equal(pv.rotation.x, 0.3);
    assert.equal(pv.children.length, 1, 'the model moved into the pivot');
    assert.equal(pv.children[0].position.y, 100 - 200 - 25, 'hung by its top (−height), then sunk a quarter tile');
    let lambert = 0, emissiveMap = 0;
    turned.traverse(o => { if (o.isMesh) { lambert++; } });
    assert.equal(lambert, 1);
    const lifted = ctx._hzMiscKit('thing', { tiles: 1, lift: 0.4 });
    lifted.traverse(o => { if (o.isMesh && o.material.emissiveMap) emissiveMap++; });
    assert.equal(emissiveMap, 1, 'lift = the bake as emissiveMap');
    let fell = 0;
    const missing = ctx._hzMiscKit('nothing', { fallback: () => { fell++; return new Obj(); } });
    assert.equal(fell, 1); assert.ok(missing instanceof Obj);
    ctx.window.EW_PERF_LOW = true;
    const low = ctx._hzMiscKit('thing', { low: 'skip', fallback: () => { fell++; return new Obj(); } });
    assert.equal(fell, 2, 'low-perf skips a scenery download and takes the fallback');
    assert.equal(ctx._hzMiscKit('thing', { tiles: 1 })._ew_kit, 'thing', 'cover without low:skip still loads in low-perf');
});

test('the six settings and the monument builders wear the batch', () => {
    const rev = section(TR, '_NR_BUILDERS.revenge = function', '_NR_BUILDERS.derelict = function');
    for (const k of ['cannon', 'chest', 'wheel', 'anchor', 'rowboat', 'tentacle', 'lantern']) assert.match(rev, new RegExp("_hzMiscKit\\('" + k + "'|'" + k + "', K\\.X0"), 'Dutchman: ' + k);
    assert.match(rev, /yaw: Math\.PI \/ 2/, 'the cannon muzzle (−X) turned onto +Z');
    const der = section(TR, '_NR_BUILDERS.derelict = function', '_NR_BUILDERS.lookingglass = function');
    for (const k of ['nacelle', 'dish', 'hullplate', 'astronaut', 'dockring', 'escapepod']) assert.match(der, new RegExp("_hzMiscKit\\('" + k + "'"), 'Derelict: ' + k);
    assert.match(der, /'nacelle', \{ tiles: 6\.4, fit: 'span', yaw: Math\.PI/, 'the nacelle bell (+X) turned astern');
    const lg = section(TR, '_NR_BUILDERS.lookingglass = function', 'var _HZ_NEAR_BUILDERS');
    for (const k of ['teapot', 'teacups', 'caterpillar', 'flamingo', 'watch']) assert.match(lg, new RegExp("'" + k + "', [0-9.]+, '(span|height)'"), 'Looking-Glass: ' + k);
    const sh = section(TR, '_NR_BUILDERS.stonehenge = function', '_NR_BUILDERS.giza = function');
    assert.match(sh, /_hzMiscKit\('standingstone'/, 'the bluestones');
    assert.match(sh, /_nrProp\(K, _hzTrilithon/, 'the trilithons stay _hzTrilithon (GLB-first now)');
    assert.match(section(TR, '_NR_BUILDERS.area51 = function', '_NR_BUILDERS.antarctica = function'), /_nrProp\(K, _hzSaucerLanded/, 'Area 51: the saucer on its gear');
    assert.match(section(TR, '_NR_BUILDERS.babel = function', '_NR_BUILDERS.olympus = function'), /_nrProp\(K, _hzBabelCrane/, 'Babel keeps _hzBabelCrane (GLB-first now)');
    assert.match(section(TR, '_NR_BUILDERS.dumb = function', '_NR_BUILDERS.cern = function'), /_nrProp\(K, _hzBlastDoor/, 'D.U.M.B. keeps _hzBlastDoor (the vault GLB now)');
    for (const fn of ['_hzTrilithon', '_hzBabelCrane', '_hzBlastDoor', '_hzGhostShip']) {
        assert.match(TR, new RegExp('function ' + fn + '\\(rng\\) \\{[^}]*_hzMiscKit\\('), fn + ' is GLB-first');
        assert.match(TR, new RegExp('function ' + fn + 'Proc\\('), fn + 'Proc keeps the procedural fallback');
        assert.match(TR, new RegExp('fallback: ' + fn + 'Proc'), fn + ' names its fallback');
    }
    const mons = section(TR, 'function _monBuilders()', 'function _monRng');
    assert.match(mons, /trilithon: _hzTrilithon/); assert.match(mons, /babelcrane: _hzBabelCrane/); assert.match(mons, /blastdoor: _hzBlastDoor/);
});

test('the streaming rosters carry the batch', () => {
    const rosters = section(TR, 'function _hzThemeRoster(name)', 'function _hzCosmicRoster');
    const sea = section(rosters, 'sea: [', 'wreckage: ['), wreck = section(rosters, 'wreckage: [', 'wonder: ['), wonder = section(rosters, 'wonder: [', 'holosim: [');
    for (const fn of ['_hzPalmIsleFar', '_hzGhostShip', '_hzKrakenFar', '_hzSharkFar']) assert.match(sea, new RegExp(fn + ", false, 0, 0, 'sea'"), 'sea: ' + fn + ' on the water');
    for (const fn of ['_hzHullChunk', '_hzEscapePodFar', '_hzAstronautFar', '_hzDockRingFar']) assert.match(wreck, new RegExp(fn + ', true'), 'wreckage: ' + fn + ' tumbles');
    for (const fn of ['_hzTeacupsFar', '_hzTeapotFar', '_hzPocketWatchFar', '_hzFlamingoFar', '_hzCaterpillarFar']) assert.match(wonder, new RegExp(fn + ', false'), 'wonder: ' + fn + ' upright');
    for (const name of ['sea', 'wreckage', 'wonder']) {
        const rows = section(rosters, name + ': [', ']],').match(/\[(0\.\d+|1\.00), _hz/g).map(m => parseFloat(m.slice(1)));
        for (let i = 1; i < rows.length; i++) assert.ok(rows[i] > rows[i - 1], name + ' row thresholds ascend');
        assert.equal(rows[rows.length - 1], 1);
    }
    for (const fn of ['_hzKrakenFar', '_hzSharkFar', '_hzPalmIsleFar', '_hzEscapePodFar', '_hzAstronautFar', '_hzDockRingFar', '_hzPocketWatchFar', '_hzTeapotFar', '_hzTeacupsFar', '_hzFlamingoFar', '_hzCaterpillarFar'])
        assert.match(TR, new RegExp('function ' + fn + '\\(rng\\)'), fn);
});

test('the Cannonball spell fires the iron cannon GLB, procedural carriage as the cold-cache fallback', () => {
    const models = section(VFX, 'var _WPN_MODELS = {', '\n    };');
    assert.match(models, /cannon:\s*\{ url: 'https:\/\/cdn\.entropywars\.net\/Assets\/misc\/Meshy_AI_iron_canon_0912231022_texture\.glb',\s*\n\s*axis: 'z', tweak: \{ ry: Math\.PI \} \}/);
    const shot = section(VFX, 'function _sigCannonShot3D(', '/* ── SPECTRAL FIREARMS');
    assert.match(shot, /_wpnReady\('cannon'\) \? _wpnInstance\('cannon', ts \* 1\.05\) : null/);
    assert.match(shot, /if \(inst\) inst\.setFade\(vis\);/, 'the GLB fades with the carriage timeline');
    assert.match(shot, /var ironMat = null, woodMat = null, brassMat = null;/, 'no orphan carriage materials on the GLB path');
    assert.match(shot, /if \(ironMat\) \{ ironMat\.opacity = vis;/);
});

test('the HQ catalogue reads misc-bucket entries and the clock room hangs the pocket watch', () => {
    assert.match(TR, /if \(entry\.base === 'misc'\) return _R2_MISC \+ encodeURIComponent\(entry\.file\);/);
    const cat = section(DATA, '    catalogue: {', '\n    },');
    assert.match(cat, /pocket_watch_hung: \{ file: 'Meshy_AI_a_pocket_watch_hanging_0912231556_texture\.glb',\s*base: 'misc', h: 0\.62, foot: 0, wall: true, mount: 2\.1 \}/);
    assert.match(cat, /pocket_watch:\s*\{ file: 'Meshy_AI_a_pocket_watch_0912231541_texture\.glb',\s*base: 'misc', span: 0\.16, foot: 0 \}/);
    const room = section(DATA, '        clockroom: {', '\n        },');
    assert.match(room, /\{ key: 'pocket_watch_hung', wall: 'n'/); assert.match(room, /\{ key: 'pocket_watch',\s*x: -1\.95/);
});

test('MODEL_INDEX.md names every key of the batch and every model family', () => {
    for (const [k, f] of Object.entries(BATCH)) {
        assert.ok(INDEX.includes('`' + k + '`'), 'index names key ' + k);
        assert.ok(INDEX.includes(f), 'index names file ' + f);
    }
    for (const fam of ['_MISC_GLB', '_WPN_MODELS', 'DOOR_HQ.catalogue', 'RACE_MODELS_3D', 'DOOR_CAST_MODELS', '_monBuilders', '_NR_BUILDERS', '_hzThemeRoster', '_hzDoorKitGLB', '_hzMiscKit'])
        assert.ok(INDEX.includes(fam), 'index covers ' + fam);
});
