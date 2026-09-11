'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE||__dirname,'three-vfx-effects.js'),'utf8');
function section(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return source.slice(i,j);}
function harness(available=true){
 const timers=[],events=[],frames=[],objects=[];let suppressed=false,now=0;
 class Vector{set(x,y,z){Object.assign(this,{x,y,z});}}
 class Resource{constructor(){this.disposals=0;}dispose(){this.disposals++;}}
 class Group{constructor(){this.children=[];this.position=new Vector();this.scale=new Vector();this.rotation={};}add(o){this.children.push(o);}traverse(fn){fn(this);this.children.forEach(o=>o.traverse(fn));}}
 class Mesh extends Group{constructor(geometry,material){super();Object.assign(this,{geometry,material});}}
 const scene={add(o){objects.push(o);},remove(o){objects.splice(objects.indexOf(o),1);}};
 const ctx=vm.createContext({Set,Math,Array,console,performance:{now:()=>now},window:{setTimeout(fn,ms){timers.push({fn,ms,canceled:false});return timers.length;},clearTimeout(id){timers[id-1].canceled=true;}},THREE:{Group,Mesh,PlaneGeometry:Resource},_getVFXScene:()=>available?scene:null,_worldPos:(x,y)=>({x:x*128,y:0,z:y*128,ts:128}),_sigMat:()=>new Resource(),_sigCrescentTex:()=>({shared:true}),_sigClamp01:x=>Math.max(0,Math.min(1,x)),_sigActive:0,_SIG_MAX_ACTIVE:50,_sigEntries:[],_fxSchedule:fn=>frames.push(fn),_suppressed:()=>suppressed,_sigSparks:(...a)=>events.push(['sparks',...a]),_sigSpeedBurst3D:(...a)=>events.push(['burst',...a])});
 vm.runInContext(section('    var _fxLifetime','    function rn')+section('    function _sigRun(','    /* full-viewport')+section('    function _sigSwordWave3D(','    /* ── SPOTLIGHT'),ctx);
 return {ctx,timers,events,frames,objects,fire:(tiles=[{x:2,y:3},{x:3,y:3}])=>ctx._sigSwordWave3D(1,3,tiles),retire(){ctx._fxCancelDelays();[...ctx._sigEntries].forEach(e=>e.finish());},suppress(){suppressed=true;},tick(ms){now=ms;frames.forEach(f=>f());}};
}
test('sword wave preserves route timing, coordinates and terminal payload',()=>{
 const h=harness();h.fire();assert.deepEqual(h.timers.map(t=>t.ms),[80,160,240]);h.timers.forEach(t=>t.fn());
 assert.deepEqual(JSON.parse(JSON.stringify(h.events.map(e=>e.slice(0,4)))),[['sparks',2,3,'steel-spark'],['sparks',3,3,'steel-spark'],['burst',3,3,{color:0x99ccff,ms:240}]].map(e=>JSON.parse(JSON.stringify(e))));
 assert.equal(h.events[0][4],5);assert.equal(h.ctx._fxDelays.size,0);
});
test('retirement cancels pending route and terminal emissions',()=>{const h=harness();h.fire();h.retire();assert.ok(h.timers.every(t=>t.canceled));h.timers.forEach(t=>t.fn());assert.equal(h.events.length,0);});
test('retirement after first route spark prevents the remaining route and burst',()=>{const h=harness();h.fire();h.timers[0].fn();h.retire();h.timers.slice(1).forEach(t=>t.fn());assert.equal(h.events.length,1);assert.ok(h.timers.slice(1).every(t=>t.canceled));});
test('queued callbacks from old sword wave cannot emit during a fresh cast',()=>{const h=harness();h.fire();const old=[...h.timers];h.retire();h.fire();old.forEach(t=>t.fn());assert.equal(h.events.length,0);h.timers.slice(3).forEach(t=>t.fn());assert.equal(h.events.length,3);});
test('sword geometry retains production animation and exactly-once cleanup',()=>{const h=harness();h.fire();const meshes=h.objects[0].children,resources=meshes.flatMap(m=>[m.geometry,m.material]);h.tick(120);assert.equal(meshes[0].position.z,128);h.retire();h.retire();h.tick(500);assert.equal(h.objects.length,0);assert.ok(resources.every(r=>r.disposals===1));assert.equal(h.ctx._sigActive,0);});
test('suppression blocks emissions and absent scene or empty route schedules nothing',()=>{const h=harness();h.fire();h.suppress();h.timers.forEach(t=>t.fn());assert.equal(h.events.length,0);const missing=harness(false);missing.fire();assert.equal(missing.timers.length,0);const empty=harness();empty.fire([]);assert.equal(empty.timers.length,0);});
