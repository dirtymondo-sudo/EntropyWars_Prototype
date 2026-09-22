'use strict';
/* THE NEW-RACE VFX PASS (2026-09-22) — police officer · jellyfish · cult
   leader · popstar. The batch shipped on family aliases and five of the
   twenty drew nothing in a battle (the alias carried the wrong INTENT for
   the row's kind). This test pins:
     · every row's runtime SPELL_MAP carries the intent its kind FIRES in
       battle.js, and every effect id is the race's own (shared with no
       other spell);
     · every referenced EFFECTS recipe exists (a bolt / aoe / aura /
       teleport def with the fields its handler reads);
     · every geometry key is registered and its signature defined;
     · the three battle.js fire sites that were missing (encore aura, a
       debuff's own impact, the charge's impact);
     · the popstar's own sheet + portrait;
     · THE SMOKE: the real three-vfx-effects.js loaded on a stub THREE,
       every intent fired for every row, a virtual clock pumped through
       every signature's whole life — no tick throws, particles spawned. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FX = fs.readFileSync(path.join(__dirname, 'three-vfx-effects.js'), 'utf8');
const BT = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const SPRITES = fs.readFileSync(path.join(__dirname, 'sprites.js'), 'utf8');

const ROWS = {
    /* id → the intent battle.js fires for the kind (resolveTravel / the kind branch) */
    racePoliceNightstick: 'impact', racePoliceTaser: 'impact', racePoliceSpray: 'aoe', racePoliceCuffs: 'impact', racePoliceLockdown: 'aoe',
    raceJellySting: 'impact', raceJellyBloom: 'aoe', raceJellyDrift: 'teleport', raceJellyNet: 'impact', raceJellyRebirth: 'aura',
    raceCultSermon: 'aura', raceCultKoolAid: 'impact', raceCultTithe: 'impact', raceCultIndoctrinate: 'impact', raceCultGathering: 'aura',
    racePopMicDrop: 'impact', racePopEncore: 'aura', racePopStageDive: 'impact', racePopSpotlight: 'impact', racePopStadiumShow: 'aoe',
};
const IDS = Object.keys(ROWS);
const NO_GEOM = { raceJellyDrift: 1 };   /* the teleport handler runs no registry — the fold / open recipes are the beat */

/* the runtime SPELL_MAP: the hydrated table + every later assignment, in file order (capstone-vfx.test.js's reader) */
function runtimeSpellMap() {
    const m = FX.match(/var _EFX_DATA = (\{.*?\});\n/s);
    const D = JSON.parse(m[1]);
    const S = Object.assign({}, D.S);
    const ctx = { SPELL_MAP: S, Object };
    const re = /SPELL_MAP\['([^']+)'\]\s*=\s*([\s\S]*?);\s*(?:\/\*[^\n]*)?\n/g;
    let x;
    while ((x = re.exec(FX))) { try { S[x[1]] = vm.runInNewContext('(' + x[2] + ')', ctx); } catch (e) { /* multi-line */ } }
    const re2 = /SPELL_MAP\['([^']+)'\]\.([a-zA-Z]+)\s*=\s*'([^']+)';/g;
    while ((x = re2.exec(FX))) { (S[x[1]] = S[x[1]] || {})[x[2]] = x[3]; }
    return { S, E: D.E };
}

test('every row carries the intent its kind fires, on a recipe of its own', () => {
    const { S } = runtimeSpellMap();
    for (const id of IDS) {
        const row = S[id];
        assert.ok(row && row[ROWS[id]], id + ' has ' + ROWS[id] + ' — the intent battle.js fires for its kind');
        assert.ok(!row.beam, id + ': an aoe / a debuff never wears a beam (resolveTravel would route it to the beam handler)');
        for (const k of Object.keys(row)) {
            assert.ok(/^(race(Police|Jelly|Cult|Pop)|_bolt_(taser|sting|mic))/.test(row[k]), id + '.' + k + ' = ' + row[k] + ' is the batch\'s own recipe');
            for (const other of Object.keys(S)) {
                if (other === id || !S[other]) continue;
                for (const ok of Object.keys(S[other])) assert.notStrictEqual(S[other][ok], row[k], id + '.' + k + ' shares ' + row[k] + ' with ' + other);
            }
        }
    }
    /* the old aliases are gone */
    assert.ok(!/SPELL_MAP\['racePoliceTaser'\]\s*=\s*Object\.assign/.test(FX), 'no family alias survives');
});

test('every referenced recipe exists with the fields its handler reads', () => {
    const { S } = runtimeSpellMap();
    const defined = (id) => FX.includes("EFFECTS['" + id + "'] = {");
    for (const id of IDS) for (const [intent, eid] of Object.entries(S[id])) {
        assert.ok(defined(eid), eid + ' (' + id + '.' + intent + ') is authored');
        const body = FX.slice(FX.indexOf("EFFECTS['" + eid + "'] = {"), FX.indexOf("EFFECTS['" + eid + "'] = {") + 4000);
        if (intent === 'aoe') { assert.ok(/impactTileEffect: '/.test(body) && /impactCenterEffect: '/.test(body) && /aoeRadius: \d/.test(body), eid + ': an aoe def'); }
        if (intent === 'teleport') assert.ok(/dispersalEffect: '/.test(body) && /arrivalEffect: '/.test(body), eid + ': a teleport def');
        if (intent === 'bolt') assert.ok(/boltCore: '/.test(body) && /boltTrail: '/.test(body), eid + ': a bolt def');
        if (intent === 'impact') assert.ok(/layers: \[/.test(body), eid + ': layers');
        if (intent === 'aura') assert.ok(/impactCenterEffect: '/.test(body) || /impactTileEffect: '/.test(body), eid + ': an aura def carries its look in a centre / per-tile effect (bare layers never spawn)');
    }
});

test('every geometry key is registered and its signature defined', () => {
    const reg = FX.slice(FX.indexOf('THE NEW-RACE VFX PASS (2026-09-22): the geometry key IS the spell id'));
    for (const id of IDS) {
        if (NO_GEOM[id]) { assert.ok(!new RegExp("'" + id + "':").test(reg), id + ' has no geometry (a teleport)'); continue; }
        const m = reg.match(new RegExp("'" + id + "':\\s+function \\([^)]*\\)\\s*\\{[^\\n]*?(_sig[A-Za-z0-9]+3D)\\("));
        assert.ok(m, id + ' is registered');
        assert.ok(new RegExp('function ' + m[1] + '\\(').test(FX), m[1] + ' is defined');
    }
});

test('the three battle.js fire sites the kinds were missing', () => {
    /* the encore branch fires its aura */
    const enc = BT.slice(BT.indexOf("spell.kind === 'encore'"), BT.indexOf("spell.kind === 'encore'") + 4000);
    assert.ok(enc.includes("hasMapping(spell.id, 'aura')") && enc.includes("fire('aura', spell.id, { tx: target.x, ty: target.y"), 'encore → aura');
    /* the debuff branch honours the row's own impact, the generic aura is the fallback */
    assert.ok(BT.includes("const _dbMapped = !!(_dbVFX && _dbVFX.hasMapping && _dbVFX.hasMapping(spell.id, 'impact'));"), 'debuff → impact when mapped');
    assert.ok(/if \(_dbMapped && state\.phase === 'battle' && !_skipVisuals\(\)\) _dbVFX\.fire\('impact', spell\.id[^\n]*\n\s*else _vfxDebuff\(target\.x, target\.y\);/.test(BT), 'else the generic aura');
    /* the charge's strike on arrival fires the row's impact */
    const ch = BT.slice(BT.indexOf('function _runChargeToTargetSpell('), BT.indexOf('function _runChargeToTargetSpell(') + 9000);
    assert.ok(/_chVFX\.hasMapping\(spell\.id, 'impact'\)[\s\S]{0,200}_chVFX\.fire\('impact', spell\.id[\s\S]{0,400}_applyDamageSpellHit\(unit, spell, target, spellPower, 'none'\)/.test(ch), 'tackle → impact on arrival, before the hit');
});

test('the popstar wears her own sheet and portrait', () => {
    assert.ok(/^  'popstar':\s+\{ folder: 'popstar',\s+capGender: false \}/m.test(SPRITES), 'RACE_PATH_RULES → Races/popstar/');
    assert.ok(/^  'popstar': 'popstar_female\.png',/m.test(SPRITES), '_SINGLE_FILE_RACES');
    assert.ok(/^  'popstar': `\$\{_S\}\/Races\/popstar\/popstar_female\.png`,/m.test(SPRITES), 'RACE_SPRITES');
    assert.ok(/^  'popstar':\s+\{ female: `\$\{_S\}\/Races\/popstar\/popstar_female\.png` \}/m.test(SPRITES), 'RACE_PORTRAITS');
    assert.ok(!/^    'popstar': 'harbinger'/m.test(SPRITES), 'no longer a homosapien job sheet');
});

/* ─── THE SMOKE ─── a stub THREE, fake timers, a virtual clock ─── */
function makeStub() {
    const warns = [];
    class Vec { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
        set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } setScalar(s) { this.x = this.y = this.z = s; return this; }
        copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; } clone() { return new Vec(this.x, this.y, this.z); }
        add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; } sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
        multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; } normalize() { const l = Math.hypot(this.x, this.y, this.z) || 1; return this.multiplyScalar(1 / l); }
        length() { return Math.hypot(this.x, this.y, this.z); } lerp(v, k) { this.x += (v.x - this.x) * k; this.y += (v.y - this.y) * k; this.z += (v.z - this.z) * k; return this; }
        applyQuaternion() { return this; } applyAxisAngle() { return this; } crossVectors() { return this; } addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; } }
    class Euler extends Vec { constructor() { super(); this.order = 'XYZ'; } }
    class Color { constructor(c) { this.set(c); } set(c) { if (typeof c === 'number') { this.r = ((c >> 16) & 255) / 255; this.g = ((c >> 8) & 255) / 255; this.b = (c & 255) / 255; } else { this.r = this.g = this.b = 1; } return this; }
        setHSL() { return this; } setRGB(r, g, b) { this.r = r; this.g = g; this.b = b; return this; } clone() { return new Color(0); } copy(c) { this.r = c.r; this.g = c.g; this.b = c.b; return this; } lerp() { return this; } multiplyScalar() { return this; } getHex() { return 0; } }
    class Obj { constructor() { this.position = new Vec(); this.rotation = new Euler(); this.scale = new Vec(1, 1, 1); this.quaternion = { copy() { return this; }, setFromAxisAngle() { return this; }, multiply() { return this; }, setFromEuler() { return this; } }; this.children = []; this.visible = true; this.userData = {}; this.renderOrder = 0; this.parent = null; this.up = new Vec(0, 1, 0); }
        add(...c) { for (const o of c) { this.children.push(o); o.parent = this; } return this; } remove(o) { const i = this.children.indexOf(o); if (i >= 0) this.children.splice(i, 1); return this; }
        traverse(fn) { fn(this); for (const c of this.children) c.traverse(fn); } clone() { const o = new this.constructor(); o.material = this.material; o.geometry = this.geometry; o.position.copy(this.position); return o; }
        lookAt() { return this; } updateMatrixWorld() {} getWorldPosition(v) { return v ? v.copy(this.position) : this.position.clone(); } localToWorld(v) { return v; } worldToLocal(v) { return v; } }
    class Group extends Obj {}
    class Mesh extends Obj { constructor(g, m) { super(); this.geometry = g || new BufferGeometry(); this.material = m || new Material(); } }
    class Sprite extends Obj { constructor(m) { super(); this.material = m || new Material(); this.geometry = { dispose() {} }; } }
    class Line extends Mesh {} class Points extends Mesh { constructor(g, m) { super(g, m); } }
    class Material { constructor(o) { Object.assign(this, { color: new Color(0), opacity: 1, transparent: false, map: null, side: 0, blending: 0, depthWrite: true, depthTest: true, uniforms: {}, userData: {} }, o || {}); if (typeof this.color === 'number') this.color = new Color(this.color); } dispose() {} clone() { return new Material(this); } }
    class BufferGeometry { constructor() { this.attributes = {}; } setAttribute(k, a) { this.attributes[k] = a; return this; } dispose() {} setIndex() { return this; } computeVertexNormals() {} setFromPoints() { return this; } }
    class BufferAttribute { constructor(a, n) { this.array = a; this.itemSize = n; this.needsUpdate = false; this.count = a.length / n; } }
    class Geo extends BufferGeometry { constructor() { super(); this.parameters = {}; } }
    const geos = ['PlaneGeometry', 'BoxGeometry', 'SphereGeometry', 'CylinderGeometry', 'ConeGeometry', 'TorusGeometry', 'RingGeometry', 'CircleGeometry', 'IcosahedronGeometry', 'OctahedronGeometry', 'DodecahedronGeometry', 'TetrahedronGeometry', 'TorusKnotGeometry', 'LatheGeometry', 'TubeGeometry', 'ShapeGeometry', 'ExtrudeGeometry', 'CapsuleGeometry', 'EdgesGeometry', 'WireframeGeometry'];
    const mats = ['MeshBasicMaterial', 'SpriteMaterial', 'LineBasicMaterial', 'PointsMaterial', 'ShaderMaterial', 'MeshLambertMaterial', 'MeshPhongMaterial', 'MeshStandardMaterial', 'LineDashedMaterial'];
    const THREE = { Vector3: Vec, Vector2: Vec, Euler, Color, Group, Object3D: Obj, Mesh, Sprite, Line, LineSegments: Line, Points, InstancedMesh: Mesh, BufferGeometry, BufferAttribute, Float32BufferAttribute: BufferAttribute,
        CanvasTexture: class { constructor() { this.needsUpdate = false; this.wrapS = this.wrapT = 0; this.repeat = new Vec(1, 1); this.offset = new Vec(); } dispose() {} },
        Texture: class { constructor() { this.needsUpdate = false; } dispose() {} }, TextureLoader: class { load() { return { needsUpdate: false }; } },
        Matrix4: class { identity() { return this; } makeRotationY() { return this; } lookAt() { return this; } compose() { return this; } multiply() { return this; } makeTranslation() { return this; } },
        Quaternion: class { setFromAxisAngle() { return this; } setFromEuler() { return this; } multiply() { return this; } copy() { return this; } slerp() { return this; } }, Shape: class { moveTo() {} lineTo() {} absarc() {} }, Path: class {},
        CatmullRomCurve3: class { constructor(p) { this.p = p; } getPoint() { return new Vec(); } getPoints(n) { return Array.from({ length: n + 1 }, () => new Vec()); } }, QuadraticBezierCurve3: class { getPoint() { return new Vec(); } },
        AdditiveBlending: 2, NormalBlending: 1, MultiplyBlending: 4, DoubleSide: 2, FrontSide: 0, BackSide: 1, LinearFilter: 1006, RepeatWrapping: 1000, ClampToEdgeWrapping: 1001, NearestFilter: 1003, DynamicDrawUsage: 35048, MathUtils: { lerp: (a, b, t) => a + (b - a) * t, clamp: (v, a, b) => Math.max(a, Math.min(b, v)), degToRad: (d) => d * Math.PI / 180 } };
    for (const g of geos) THREE[g] = Geo; for (const m of mats) THREE[m] = Material;
    const ctx2d = new Proxy({}, { get: (t, k) => { if (k === 'canvas') return { width: 128, height: 128 }; if (k === 'measureText') return () => ({ width: 10 }); if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} }); if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) }); if (typeof k === 'symbol') return undefined; return () => {}; }, set: () => true });
    const document = { createElement: () => ({ width: 0, height: 0, style: {}, getContext: () => ctx2d, remove() {}, appendChild() {}, classList: { add() {}, remove() {} }, setAttribute() {}, animate() { return { cancel() {} }; } }), body: { appendChild() {}, removeChild() {} }, getElementById: () => null, querySelector: () => null, documentElement: { style: {} } };
    /* fake timers + a virtual clock */
    let now = 0; const timers = []; let tid = 1; let rafs = [];
    const window = { document, innerWidth: 1600, innerHeight: 900, devicePixelRatio: 1,
        setTimeout: (fn, ms) => { timers.push({ id: tid, fn, at: now + (ms || 0) }); return tid++; }, clearTimeout: (id) => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
        requestAnimationFrame: (fn) => { rafs.push(fn); return rafs.length; }, cancelAnimationFrame() {}, addEventListener() {}, removeEventListener() {},
        performance: { now: () => now }, THREE, localStorage: { getItem: () => null, setItem() {} }, matchMedia: () => ({ matches: false }), getComputedStyle: () => ({}) };
    window.window = window;
    const scene = new Group(); let spawned = 0;
    window.ThreeVFX = { isActive: () => true, spawn: () => { spawned++; return {}; }, _getScene: () => scene, attach() {}, detach() {} };
    window.ThreeLightning = { bolt() {}, strikeFromSky() {}, chainBolt() {} };
    window.ThreeRenderer = { getMiscModelClone: () => null };
    const state = { phase: 'battle', units: [], round: 1, boardHeights: null };
    const CONFIG = { tileSize: 128, tileGap: 0, boardPadding: 2, boardWidth: 8, boardHeight: 8 };
    const sandbox = { window, document, THREE, state, CONFIG, performance: window.performance, setTimeout: window.setTimeout, clearTimeout: window.clearTimeout, requestAnimationFrame: window.requestAnimationFrame, cancelAnimationFrame() {},
        console: { log() {}, warn: (...a) => warns.push(a.map(String).join(' ')), error: (...a) => warns.push(a.map(String).join(' ')), info() {}, debug() {} }, Math, Float32Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int32Array, Array, Object, Number, String, Boolean, JSON, Date, Set, Map, Symbol, Error, Promise, isFinite, isNaN, parseInt, parseFloat, navigator: { userAgent: 'node', hardwareConcurrency: 4 } };
    sandbox.self = sandbox.globalThis = window; window.state = state; window.CONFIG = CONFIG;
    /* the file reads a few globals bare (ThreeVFX, ThreeRenderer, ThreeLightning) — in a browser they are window's */
    sandbox.ThreeVFX = window.ThreeVFX; sandbox.ThreeRenderer = window.ThreeRenderer; sandbox.ThreeLightning = window.ThreeLightning; sandbox.ThreeVFXEffects = undefined;
    vm.createContext(sandbox);
    vm.runInContext(FX, sandbox, { filename: 'three-vfx-effects.js' });
    function pump(ms) {
        const end = now + ms;
        while (now < end) {
            now += 16;
            timers.sort((a, b) => a.at - b.at);
            while (timers.length && timers[0].at <= now) { const t = timers.shift(); try { t.fn(); } catch (e) { warns.push('timer threw: ' + e.message); } }
            const list = rafs; rafs = []; for (const fn of list) { try { fn(now); } catch (e) { warns.push('raf threw: ' + e.message); } }
            /* the renderer's per-frame hook (the projectiles, the bolts, the volumetric flame bursts) */
            try { window.ThreeVFXEffects.tick(0.016); } catch (e) { warns.push('tick threw: ' + e.message); }
        }
    }
    return { V: window.ThreeVFXEffects, pump, warns, scene, spawned: () => spawned, geom: () => sandbox.window.VFX3D_SPELL_MAP };
}

test('THE SMOKE: every intent of every row fires on the stub board, every signature runs its whole life without a tick error', () => {
    const H = makeStub();
    const V = H.V;
    assert.ok(V && typeof V.fire === 'function', 'the file loaded');
    for (const id of IDS) {
        const before = H.spawned(), w0 = H.warns.length;
        const intent = ROWS[id];
        const p = { tx: 4, ty: 4, fromX: 2, fromY: 4, cx: 2, cy: 4, sx: 2, sy: 4, aoeRadius: /Lockdown|Spray|Bloom/.test(id) ? 1 : (/Stadium/.test(id) ? 2 : (/Sermon/.test(id) ? 2 : 0)) };
        if (intent === 'teleport') { p.sx = 2; p.sy = 4; }
        V.fire(intent, id, p);
        if (V.hasMapping(id, 'bolt')) V.fire('bolt', id, { fromX: 2, fromY: 4, toX: 4, toY: 4, flyMs: 300 });
        H.pump(4200);
        const bad = H.warns.slice(w0).filter(x => /tick error|ticker error|threw|failed/i.test(x));
        assert.deepStrictEqual(bad, [], id + ': ' + bad.join(' | '));
        assert.ok(H.spawned() > before, id + ' spawned particles (' + (H.spawned() - before) + ')');
    }
    assert.strictEqual(H.scene.children.length, 0, 'every signature group left the scene when its life ended');
});
