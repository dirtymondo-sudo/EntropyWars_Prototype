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
        add(o) { if(o.parent) o.parent.remove(o); this.children.push(o); o.parent = this; }
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
        THREE: {Group, Mesh, PlaneGeometry: Resource, TorusGeometry: Resource, ConeGeometry: Resource, CircleGeometry: Resource, MeshBasicMaterial: Resource, Color: class {}},
        _canSpawn: () => !missing && !suppressed, _suppressed: () => suppressed,
        _cfg: () => ({tileSize: 100}), _worldPos: (x,y) => ({x:x*100, y:20, z:y*100, ts:100}),
        tilePx: (x,y) => ({x:x*100, y:y*100}), tileZ: () => 20,
        rn: (a,b) => (a+b)/2, _getVFXScene: () => missing ? null : scene,
        _sigActive: 0, _SIG_MAX_ACTIVE: cap, _sigEntries: [], _fxSchedule: fn => frames.push(fn),
        _sigClamp01: t => Math.max(0,Math.min(1,t)), _sigEaseInCubic: t => t*t*t, _sigEaseOutBack: t => t,
        _sigTerrainTex: () => texture, _sigYawToward: () => 0, _sigSpeedLinesFx: () => {}, _sigCss: () => '#88bbff', _sigStreakTex: () => texture, unitSurfaceZ: () => 20,
        _sigShake: () => {}, _sigSpeedBurst3D: () => {}, _sigCrescentSlash3D: () => {},
        _sigBuildSword: () => { const bladeGeo=new Resource(); return {group: new Mesh(bladeGeo,new Resource()),bladeGeo,hiltY:10,setFade: f => fades.push(f)}; },
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
        section('    function _sigSlashCombo3D(', '    /* ── crest texture') +
        section('    function _sigJawsBite3D(', '    /* ── claw-gouge texture'), ctx);
    return {ctx, timers, events, scene, resources, fades,
        fire(kind, opts={}) { return kind === 'slash' ? ctx._sigSlashCombo3D(2,3,opts) : ctx._sigJawsBite3D(2,3,opts); },
        retire() { ctx._fxCancelDelays(); [...ctx._sigEntries].forEach(e => e.finish()); },
        tick(ms) { now = ms; frames.forEach(fn => fn()); },
        suppress() { suppressed = true; },
        particles() { return events.filter(e => e[0] === 'particle').map(e => e[1]); }
    };
}

for (const kind of ['slash','jaws']) {
    const emitted = h => h.events.filter(e=>e[0]==='sparks');
    test(`${kind}: normal terminal timing and payload`, () => {
        const h=harness(); h.fire(kind); assert.deepEqual(h.timers.map(t=>t.ms),[kind==='slash'?1064:455]);
        h.timers[0].fn(); const e=emitted(h); assert.equal(e.length,1);
        assert.deepEqual(Array.from(e[0].slice(1,5)),[2,3,kind==='slash'?'psi-pulse':'void-mist',kind==='slash'?10:6]);
        assert.equal(e[0][5].gravity,kind==='slash'?-20:-30); assert.equal(h.ctx._fxDelays.size,0);
    });
    test(`${kind}: retirement cancels pending timer`, () => {
        const h=harness(); h.fire(kind); h.retire(); assert.ok(h.timers.every(t=>t.canceled));
    });
    test(`${kind}: queued callback cannot emit after a fresh lifetime`, () => {
        const h=harness(); h.fire(kind); const old=h.timers[0]; h.retire(); h.fire(kind);
        old.fn(); assert.equal(emitted(h).length,0); h.timers[1].fn(); assert.equal(emitted(h).length,1);
    });
    test(`${kind}: retirement during animation blocks terminal emission`, () => {
        const h=harness(); h.fire(kind); h.tick(330); const count=emitted(h).length;
        assert.ok(count>0); h.retire(); h.timers[0].fn(); h.tick(1800); assert.equal(emitted(h).length,count);
    });
    test(`${kind}: suppression blocks terminal emission`, () => {
        const h=harness(); h.fire(kind); h.suppress(); h.timers[0].fn(); assert.equal(emitted(h).length,0);
    });
    test(`${kind}: missing scene allocates and schedules nothing`, () => {
        const h=harness({missing:true}); h.fire(kind); assert.equal(h.timers.length,0); assert.equal(h.resources.length,0);
    });
    test(`${kind}: animation completion and refused registration preserve cleanup`, () => {
        for(const cap of [0,20]) {
            const h=harness({cap}); h.fire(kind); h.tick(100); h.tick(330); h.tick(1400);
            assert.equal(h.ctx._sigActive,0); assert.equal(h.scene.children.length,0);
            assert.ok(h.resources.every(r=>r.disposals>=1)); const counts=h.resources.map(r=>r.disposals);
            h.retire(); h.retire(); h.tick(1800); assert.deepEqual(h.resources.map(r=>r.disposals),counts);
        }
    });
}
test('custom timing and slash mote sprite remain intact',()=>{
    const s=harness(); s.fire('slash',{slashes:[{dir:1}],summonMs:100,windMs:20,swingMs:30,recoverMs:40,moteSprite:'divine-sparkle'});
    assert.equal(s.timers[0].ms,190); s.timers[0].fn(); assert.equal(s.events.find(e=>e[0]==='sparks')[3],'divine-sparkle');
    const j=harness(); j.fire('jaws',{clenchMs:0}); assert.equal(j.timers[0].ms,195);
});
