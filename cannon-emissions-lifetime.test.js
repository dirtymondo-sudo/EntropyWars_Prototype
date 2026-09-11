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
    class Vector { constructor(x=0,y=0,z=0) { this.set(x,y,z); } set(x,y,z) { Object.assign(this,{x,y,z}); return this; } setScalar(v) { return this.set(v,v,v); } clone() { return new Vector(this.x,this.y,this.z); } applyMatrix4() { return this; } }
    class Resource {
        constructor(opts) { Object.assign(this,opts); this.disposals = 0; resources.push(this); }
        dispose() { this.disposals++; }
    }
    class Group {
        constructor() { this.children = []; this.position = new Vector(); this.rotation = new Vector(); this.scale = new Vector(1,1,1); }
        updateMatrixWorld() {}
        getWorldPosition(v) { return v.set(200,50,300); }
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
        THREE: {Group, Mesh, Object3D: Group, Vector3: Vector, SphereGeometry: Resource, CylinderGeometry: Resource, BoxGeometry: Resource, PlaneGeometry: Resource, TorusGeometry: Resource, ConeGeometry: Resource, CircleGeometry: Resource, MeshBasicMaterial: Resource, Color: class {}},
        _canSpawn: () => !missing && !suppressed, _suppressed: () => suppressed,
        _cfg: () => ({tileSize: 100}), _worldPos: (x,y) => ({x:x*100, y:20, z:y*100, ts:100}),
        tilePx: (x,y) => ({x:x*100, y:y*100}), tileZ: () => 20,
        rn: (a,b) => (a+b)/2, _getVFXScene: () => missing ? null : scene,
        EFFECTS: {testDescent: {descentMs: 900}}, _sigStandSword3D: (...a) => events.push(["sword",...a]), _sigNoteTex: () => texture, _sigBurstTex: () => texture, _sigWorldToSpawn: v => ({x:v.x,y:v.z,z:v.y}), _LT: () => ({bolt: (...a) => events.push(["bolt",...a])}), _spawnExplosionRing3D: (...a) => events.push(["explosion",...a]),
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
        section('    function _sigCannonShot3D(', '    /* ── SPECTRAL FIREARMS') +
        section('    function _sigTeslaCoil3D(', '    /* ── 3D flying saucer') +
        section('    function _sigStormStrike3D(', '    /* ── SACRED RINGS') +
        section('    function _sigMusicNotes3D(', '    /* ──'), ctx);
    return {ctx, timers, events, scene, resources, fades,
        fire(kind, opts={}) { const f={cannon:()=>ctx._sigCannonShot3D(2,3,4,5,opts),tesla:()=>ctx._sigTeslaCoil3D(2,3),storm:()=>ctx._sigStormStrike3D(2,3,opts),judgment:()=>ctx._sigJudgmentSword3D(2,3,'testDescent',opts),music:()=>ctx._sigMusicNotes3D(2,3,opts)}; return f[kind](); },
        retire() { ctx._fxCancelDelays(); [...ctx._sigEntries].forEach(e => e.finish()); },
        tick(ms) { now = ms; frames.forEach(fn => fn()); },
        suppress() { suppressed = true; },
        particles() { return events.filter(e => e[0] === 'particle').map(e => e[1]); }
    };
}

function ball(h) { let result; h.scene.traverse(o=>{if(o.renderOrder===161 && o.children.length===1) result=o;}); return result; }
for (const ms of [0,300,600]) test(`cannon retirement at ${ms} disposes ball immediately`,()=>{
 const h=harness(); h.fire('cannon'); const b=ball(h); if(ms) h.tick(ms); h.retire();
 assert.equal(h.scene.children.length,0); assert.equal(b.geometry.disposals,1); assert.equal(b.material.disposals,1); assert.equal(b.children[0].geometry.disposals,1);
 h.retire(); h.tick(2000); h.timers.forEach(t=>t.fn()); assert.equal(b.geometry.disposals,1);
});
test('cannon refusal leaves no detached ball',()=>{const h=harness({cap:0}); h.fire('cannon'); assert.equal(h.scene.children.length,0); assert.ok(h.resources.every(r=>r.disposals>0));});
test('cannon completes impact once and disposes at animation end',()=>{const h=harness();h.fire('cannon',{aoeRadius:3}); const b=ball(h);h.tick(200);h.tick(480);h.tick(600);assert.equal(h.events.filter(e=>e[0]==='explosion').length,1);assert.equal(h.events.find(e=>e[0]==='explosion')[3],3);assert.equal(b.visible,false);h.tick(1300);assert.equal(b.geometry.disposals,1);assert.equal(h.scene.children.length,0);});
test('cannon missing scene allocates nothing',()=>{const h=harness({missing:true});h.fire('cannon');assert.equal(h.resources.length,0);});
for(const kind of ['tesla','storm','judgment','music']) {
 test(`${kind} cancels pending emissions`,()=>{const h=harness();h.fire(kind);assert.ok(h.timers.length);h.retire();assert.ok(h.timers.every(t=>t.canceled));});
 test(`${kind} rejects queued callbacks in a fresh lifetime`,()=>{const h=harness();h.fire(kind);const old=[...h.timers];h.retire();h.fire(kind);const n=h.events.length,r=h.resources.length;old.forEach(t=>t.fn());assert.equal(h.events.length,n);assert.equal(h.resources.length,r);});
 test(`${kind} retirement after partial emission prevents remaining work`,()=>{const h=harness();h.fire(kind);h.timers[0].fn();h.retire();const n=h.events.length,r=h.resources.length;h.timers.slice(1).forEach(t=>t.fn());h.tick(5000);assert.equal(h.events.length,n);assert.equal(h.resources.length,r);assert.equal(h.scene.children.length,0);});
 test(`${kind} preserves delays and normal work`,()=>{const h=harness();h.fire(kind);assert.deepEqual(h.timers.map(t=>t.ms),{tesla:[140,270,400,530,660],storm:[600],judgment:[900],music:[0,110,220]}[kind]);h.timers.forEach(t=>t.fn());if(kind==='music'){assert.equal(h.ctx._sigActive,3);h.tick(1100);assert.ok(h.resources.every(r=>r.disposals>0));}else assert.ok(h.events.some(e=>e[0]==={tesla:'bolt',storm:'shock',judgment:'pillar'}[kind]));});
 test(`${kind} suppression blocks callbacks`,()=>{const h=harness();h.fire(kind);const n=h.events.length,r=h.resources.length;h.suppress();h.timers.forEach(t=>t.fn());assert.equal(h.events.length,n);assert.equal(h.resources.length,r);});
}
test('music gentle spacing, broken sparks and refusal cleanup',()=>{const g=harness();g.fire('music',{gentle:true,count:2});assert.deepEqual(g.timers.map(t=>t.ms),[0,200]);const h=harness();h.fire('music',{broken:true,count:1,sparkSprite:'custom'});h.timers[0].fn();h.tick(900);assert.equal(h.events.find(e=>e[0]==='sparks')[3],'custom');const c=harness({cap:0});c.fire('music');c.timers.forEach(t=>t.fn());assert.ok(c.resources.every(r=>r.disposals>0));});
