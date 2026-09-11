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
        constructor() { this.children = []; this.position = new Vector(); this.rotation = {}; this.scale = new Vector(); }
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
        _sigClamp01: t => Math.max(0,Math.min(1,t)), _sigEaseInCubic: t => t*t*t, _sigEaseOutBack: t => t,
        _sigCss: () => '#88bbff', _sigStreakTex: () => texture, unitSurfaceZ: () => 20,
        _sigShake: () => {}, _sigSpeedBurst3D: () => {}, _sigCrescentSlash3D: () => {},
        _sigBuildSword: () => ({group: new Mesh(new Resource(),new Resource()),setFade: f => fades.push(f)}),
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
        section('    function _sigSleighRide3D(', '    /* ── WARHEAD PLUNGE') +
        section('    function _sigStandSword3D(', '    /* ── HERO: spectral giant fist'), ctx);
    return {ctx, timers, events, scene, resources, fades,
        fire(kind) { return kind === 'sleigh' ? ctx._sigSleighRide3D(1,3,4,3,{}) : ctx._sigStandSword3D(2,3,{moteSprite:'divine-sparkle'}); },
        retire() { ctx._fxCancelDelays(); [...ctx._sigEntries].forEach(e => e.finish()); },
        tick(ms) { now = ms; frames.forEach(fn => fn()); },
        suppress() { suppressed = true; },
        particles() { return events.filter(e => e[0] === 'particle').map(e => e[1]); }
    };
}

for (const kind of ['sleigh','sword']) {
    const emitted = h => h.events.filter(e => e[0] === (kind === 'sleigh' ? 'particle' : 'sparks'));
    test(`${kind}: normal timing and payload`, () => {
        const h = harness(); const duration = h.fire(kind);
        assert.deepEqual(h.timers.map(t => t.ms), kind === 'sleigh' ? Array.from({length:14},(_,i)=>i*34) : [1110]);
        h.timers.forEach(t => t.fn());
        assert.equal(emitted(h).length, kind === 'sleigh' ? 14 : 1);
        if (kind === 'sleigh') {
            assert.equal(duration,470);
            const p = emitted(h)[0][1]; assert.equal(p.sprite,'ice-shard');
            assert.equal(p.x,100); assert.equal(p.y,300); assert.equal(p.z,28);
            assert.equal(p.gravity,120); assert.equal(p.ml,400);
        } else {
            assert.deepEqual(Array.from(emitted(h)[0].slice(1,5)),[2,3,'divine-sparkle',10]);
            assert.equal(emitted(h)[0][5].gravity,-20);
        }
        assert.equal(h.ctx._fxDelays.size,0);
    });
    test(`${kind}: retirement cancels pending work including queued callbacks`, () => {
        const h=harness(); h.fire(kind); h.retire();
        assert.ok(h.timers.every(t=>t.canceled)); h.timers.forEach(t=>t.fn());
        assert.equal(emitted(h).length,0);
    });
    test(`${kind}: old callbacks cannot emit into a fresh lifetime`, () => {
        const h=harness(); h.fire(kind); const old=[...h.timers]; h.retire(); h.fire(kind);
        old.forEach(t=>t.fn()); assert.equal(emitted(h).length,0);
        h.timers.slice(old.length).forEach(t=>t.fn()); assert.equal(emitted(h).length,old.length);
    });
    test(`${kind}: suppression still blocks emissions`, () => {
        const h=harness(); h.fire(kind); h.suppress(); h.timers.forEach(t=>t.fn()); assert.equal(emitted(h).length,0);
    });
    test(`${kind}: animation retirement and refusal retain resource ownership`, () => {
        for (const cap of [0,20]) {
            const h=harness({cap}); h.fire(kind); h.tick(100);
            if(cap) assert.ok(h.fades.length>0);
            h.tick(2000); h.retire(); h.retire();
            assert.equal(h.scene.children.length,0); assert.equal(h.ctx._sigActive,0);
            assert.ok(h.resources.every(r=>r._ew_shared ? r.disposals===0 : r.disposals>=1));
            const counts=h.resources.map(r=>r.disposals); h.retire(); h.tick(2200);
            assert.deepEqual(h.resources.map(r=>r.disposals),counts);
        }
    });
}
test('sleigh: partial frost wake stops when the scene retires', () => {
    const h=harness(); h.fire('sleigh'); h.timers[0].fn(); h.retire();
    h.timers.slice(1).forEach(t=>t.fn()); assert.equal(h.particles().length,1);
});
test('sleigh: cold model and missing scene schedule nothing', () => {
    for(const opts of [{cold:true},{missing:true}]) {
        const h=harness(opts); assert.equal(h.fire('sleigh'),0); assert.equal(h.timers.length,0); assert.equal(h.resources.length,0);
    }
});
test('sword: missing scene schedules nothing', () => {
    const h=harness({missing:true}); h.fire('sword'); assert.equal(h.timers.length,0); assert.equal(h.resources.length,0);
});
