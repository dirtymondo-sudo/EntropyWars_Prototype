'use strict';
// LIFE-06 / VFX-03. Execute the production helpers and lifetime/geometry
// owners with deterministic timers and rendering doubles, without WebGL.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE || __dirname, 'three-vfx-effects.js'), 'utf8');
function section(a, b) {
    const i = source.indexOf(a), j = source.indexOf(b, i + a.length);
    assert.ok(i >= 0 && j > i, a);
    return source.slice(i, j);
}
function harness({cold = false, missing = false, cap = 20} = {}) {
    const timers = [], events = [], frames = [], resources = [], fades = [];
    let now = 0, suppressed = false;
    class Vector { set(x, y, z) { Object.assign(this, {x, y, z}); } }
    class Resource {
        constructor() { this.disposals = 0; resources.push(this); }
        dispose() { this.disposals++; }
    }
    class Group {
        constructor() { this.children = []; this.position = new Vector(); this.rotation = {}; }
        add(o) { this.children.push(o); o.parent = this; }
        remove(o) { this.children = this.children.filter(c => c !== o); o.parent = null; }
        traverse(fn) { fn(this); this.children.forEach(c => c.traverse(fn)); }
    }
    class Mesh extends Group { constructor(geometry, material) { super(); Object.assign(this, {geometry, material}); } }
    const scene = new Group(), texture = {dispose() { throw Error('shared texture disposed'); }};
    const math = Object.create(Math); math.random = () => 0.5;
    const ctx = vm.createContext({Set, Array, Math: math,
        console: {warn(...args) { throw Error(args.join(' ')); }},
        performance: {now: () => now},
        window: {setTimeout(fn, ms) { timers.push({fn, ms, canceled: false}); return timers.length; },
            clearTimeout(id) { timers[id - 1].canceled = true; }},
        THREE: {Group, Mesh, PlaneGeometry: Resource},
        _canSpawn: () => !missing && !suppressed, _suppressed: () => suppressed,
        _cfg: () => ({tileSize: 100}), _worldPos: (x,y) => ({x:x*100, y:20, z:y*100, ts:100}),
        tilePx: (x,y) => ({x:x*100, y:y*100}), tileZ: () => 20,
        rn: (a,b) => (a+b)/2, _getVFXScene: () => missing ? null : scene,
        _sigActive: 0, _SIG_MAX_ACTIVE: cap, _sigEntries: [], _fxSchedule: fn => frames.push(fn),
        _sigEaseOutCubic: t => 1-Math.pow(1-t,3), _sigGlowTex: () => texture,
        _sigMat: (color, opts) => Object.assign(new Resource(), {color}, opts),
        _wpnReady: () => !cold,
        _wpnInstance: (key, len) => {
            const geometry = new Resource(); geometry._ew_shared = true;
            return {group: new Mesh(geometry, new Resource()), len, setFade: f => fades.push(f)};
        },
        _spawn: p => events.push(['particle', p]),
        _sigMagicCircle3D: (...a) => events.push(['circle', ...a]),
        _sigLightPillar3D: (...a) => events.push(['pillar', ...a]),
        _sigShockRing3D: (...a) => events.push(['shock', ...a]),
        _sigSparks: (...a) => events.push(['sparks', ...a]),
        _sigScreenFlash: (...a) => events.push(['flash', ...a])
    });
    vm.runInContext(section('    var _fxLifetime', '    function rn') +
        section('    function _sigRun(', '    /* full-viewport') +
        section('    function _sigCandleProp3D(', '    /* one normalized bone') +
        section('    function _sigCrossDescent3D(', '    /* ── A REALLY GOOD PUNCH'), ctx);
    return {ctx, timers, events, scene, resources, fades,
        fire(kind) { return kind === 'candle' ? ctx._sigCandleProp3D(2,3,{heightPx:80,riseMs:200,holdMs:400,fadeMs:200}) :
            ctx._sigCrossDescent3D(2,3,{burning:true,ms:180,holdMs:360,scale:1}); },
        retire() { ctx._fxCancelDelays(); [...ctx._sigEntries].forEach(e => e.finish()); },
        tick(ms) { now = ms; frames.forEach(fn => fn()); },
        suppress() { suppressed = true; },
        particles() { return events.filter(e => e[0] === 'particle').map(e => e[1]); }
    };
}
for (const kind of ['candle', 'cross']) {
    test(`${kind}: normal emission timing and payload remain intact`, () => {
        const h = harness(); assert.equal(h.fire(kind), true);
        assert.deepEqual(h.timers.map(t => t.ms), kind === 'candle' ? [180,400,620] : [210,300,390,480,570,660]);
        h.timers.forEach(t => t.fn());
        const p = h.particles(); assert.equal(p.length, kind === 'candle' ? 3 : 6);
        assert.equal(p[0].sprite, kind === 'candle' ? 'ember' : 'flame');
        assert.equal(p[0].mode, 'billboard'); assert.equal(p[0].opacity0, 0.95);
        assert.ok(Math.abs(p[0].x - (kind === 'candle' ? 141.76 : 200)) < 0.00001);
        assert.ok(Math.abs(p[0].z - (kind === 'candle' ? 68 : 88.4)) < 0.00001);
        assert.equal(h.ctx._fxDelays.size, 0);
    });
    test(`${kind}: retirement cancels every pending emission`, () => {
        const h = harness(); h.fire(kind); h.retire();
        assert.ok(h.timers.every(t => t.canceled));
        h.timers.forEach(t => t.fn()); assert.equal(h.particles().length, 0);
    });
    test(`${kind}: retirement after one emission prevents the rest`, () => {
        const h = harness(); h.fire(kind); h.timers[0].fn(); h.retire();
        h.timers.slice(1).forEach(t => t.fn()); assert.equal(h.particles().length, 1);
        assert.ok(h.timers.slice(1).every(t => t.canceled));
    });
    test(`${kind}: queued callbacks stay inert during a fresh cast`, () => {
        const h = harness(); h.fire(kind); const old = [...h.timers]; h.retire(); h.fire(kind);
        old.forEach(t => t.fn()); assert.equal(h.particles().length, 0);
        h.timers.slice(old.length).forEach(t => t.fn()); assert.equal(h.particles().length, old.length);
    });
    test(`${kind}: animation and exactly-once disposal preserve shared geometry`, () => {
        const h = harness(); h.fire(kind); h.tick(100); assert.ok(h.fades.length > 0);
        h.tick(300); assert.equal(h.fades.at(-1), 1);
        if (kind === 'cross') assert.equal(h.events.filter(e => e[0] === 'shock').length, 1);
        h.tick(700); assert.ok(h.fades.at(-1) < 1);
        h.tick(1000); h.retire(); h.retire(); h.tick(1100);
        assert.equal(h.scene.children.length, 0); assert.equal(h.ctx._sigActive, 0);
        assert.ok(h.resources.every(r => r.disposals === (r._ew_shared ? 0 : 1)));
    });
    test(`${kind}: cap refusal still disposes geometry and timers retire`, () => {
        const h = harness({cap:0}); h.fire(kind); assert.equal(h.scene.children.length, 0);
        assert.ok(h.resources.every(r => r.disposals === (r._ew_shared ? 0 : 1)));
        h.retire(); h.timers.forEach(t => t.fn()); assert.equal(h.particles().length, 0);
    });
    test(`${kind}: suppression blocks emissions and missing scene allocates nothing`, () => {
        const h = harness(); h.fire(kind); h.suppress(); h.timers.forEach(t => t.fn());
        assert.equal(h.particles().length, 0);
        const m = harness({missing:true}); assert.equal(m.fire(kind), false);
        assert.equal(m.timers.length, 0); assert.equal(m.resources.length, 0);
    });
}
test('cold candle cache keeps fallback embers, which retire before another preview', () => {
    const h = harness({cold:true}); assert.equal(h.fire('candle'), false);
    assert.equal(h.events[0][0], 'circle'); assert.equal(h.resources.length, 0);
    h.timers[0].fn(); assert.equal(h.particles().length, 1);
    const old = h.timers.slice(1); h.retire(); h.fire('candle');
    old.forEach(t => t.fn()); assert.equal(h.particles().length, 1);
});
test('cold cross uses pillar fallback; a non-burning cross schedules no flame timers', () => {
    const h = harness({cold:true}); assert.equal(h.fire('cross'), false);
    assert.equal(h.events[0][0], 'pillar'); assert.equal(h.timers.length, 0);
    const normal = harness(); normal.ctx._sigCrossDescent3D(2,3,{});
    assert.equal(normal.timers.length, 0); normal.tick(800);
    assert.equal(normal.events.find(e => e[0] === 'sparks')[3], 'divine-sparkle');
});
