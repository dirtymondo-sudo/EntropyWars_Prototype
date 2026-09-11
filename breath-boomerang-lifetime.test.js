'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE||__dirname,'three-vfx-effects.js'),'utf8');
function section(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return source.slice(i,j);}
function harness({cap=50,sceneAvailable=true}={}){
 const timers=[],events=[],frames=[],objects=[],resources=[],warnings=[];let now=0,suppressed=false;
 class Vector{
  constructor(x=0,y=0,z=0){this.set(x,y,z);}set(x,y,z){Object.assign(this,{x,y,z});return this;}
  copy(v){return this.set(v.x,v.y,v.z);}clone(){return new Vector(this.x,this.y,this.z);}
  subVectors(a,b){return this.set(a.x-b.x,a.y-b.y,a.z-b.z);}length(){return Math.hypot(this.x,this.y,this.z);}
  normalize(){const n=this.length()||1;return this.set(this.x/n,this.y/n,this.z/n);}
  addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
 }
 class Quaternion{setFromUnitVectors(){return this;}copy(){return this;}}
 class Resource{constructor(){this.disposals=0;this.uniforms={uOpacity:{value:1}};resources.push(this);}dispose(){this.disposals++;}}
 class Group{constructor(){this.children=[];this.position=new Vector();this.scale=new Vector();this.rotation={};this.quaternion=new Quaternion();}add(o){this.children.push(o);}traverse(fn){fn(this);this.children.forEach(o=>o.traverse(fn));}}
 class Mesh extends Group{constructor(geometry,material){super();Object.assign(this,{geometry,material});}}
 const scene={add(o){objects.push(o);},remove(o){const i=objects.indexOf(o);if(i>=0)objects.splice(i,1);}};
 const record=name=>(...args)=>events.push({name,at:now,args:JSON.parse(JSON.stringify(args))});
 const ctx=vm.createContext({Set,Math,Array,console:{warn:(...a)=>warnings.push(a)},performance:{now:()=>now},window:{setTimeout(fn,ms){timers.push({fn,ms,at:now+ms,canceled:false,ran:false});return timers.length;},clearTimeout(id){timers[id-1].canceled=true;}},THREE:{Group,Mesh,Vector3:Vector,Quaternion,CylinderGeometry:Resource,PlaneGeometry:Resource},_getVFXScene:()=>sceneAvailable?scene:null,_worldPos:(x,y)=>({x:x*128,y:0,z:y*128,ts:128}),_worldTorso:(x,y)=>({x:x*128,y:64,z:y*128}),_cfg:()=>({tileSize:128}),tilePx:(x,y)=>({x:x*128,y:y*128}),unitSurfaceZ:()=>0,unitZBoost:()=>64,rn:(a,b)=>(a+b)/2,_sigMat:()=>new Resource(),_sigEnergyMat:()=>new Resource(),_sigEnergyTick:()=>{},_sigCrescentTex:()=>({shared:true}),_sigRingTex:()=>({shared:true}),_sigSonicRingTex:()=>({shared:true}),_sigCss:()=> '#ffffff',_sigClamp01:x=>Math.max(0,Math.min(1,x)),_sigEaseOutCubic:x=>1-(1-x)**3,_sigActive:0,_SIG_MAX_ACTIVE:cap,_sigEntries:[],_fxSchedule:fn=>frames.push(fn),_suppressed:()=>suppressed,_canSpawn:()=>!suppressed,EFFECTS:{impact:{id:'impact'}},_spawn:record('particle'),_spawnEffect:record('impact'),spawnFlameBurst3D:record('flame'),_sigShockRing3D:record('ring'),_sigSparks:record('sparks'),_sigShake:record('shake'),_sigScreenFlash:record('flash'),_sigSpeedBurst3D:record('speed')});
 vm.runInContext(section('    var _fxLifetime','    function rn')+section('    function _sigRun(','    /* full-viewport')+section('    function _sigDashWave3D(','    /* ── blizzard field:')+section('    function _sigSonicBoom3D(','    /* ── full-viewport anime RUSH')+section('    var _BREATH_THEMES','    /* ── BLACK HOLE'),ctx);
 const tiles=[{x:2,y:3},{x:3,y:3}];
 return {ctx,timers,events,frames,objects,resources,warnings,
  breath:(theme='fire')=>ctx._sigBreathBlast3D(1,3,tiles,{breathTheme:theme,chargeMs:160,beamMs:780,impactTileEffect:'impact'}),
  boomerang:()=>ctx._sigSonicBoomerang3D(1,3,tiles),
  advance(ms){for(;;){const t=timers.filter(t=>!t.ran&&!t.canceled&&t.at<=ms).sort((a,b)=>a.at-b.at)[0];if(!t)break;now=t.at;t.ran=true;t.fn();}now=ms;},
  tick(ms){now=ms;frames.forEach(f=>f());assert.deepEqual(warnings,[]);},
  retire(){ctx._fxCancelDelays();[...ctx._sigEntries].forEach(e=>e.finish());},suppress(){suppressed=true;}
 };
}
function staleAfterRetire(h,start){
 const pending=h.timers.filter(t=>!t.ran&&!t.canceled);assert.ok(pending.length);
 h.retire();assert.ok(pending.every(t=>t.canceled));start();
 const counts=[h.events.length,h.resources.length,h.timers.length];pending.forEach(t=>t.fn());
 assert.deepEqual([h.events.length,h.resources.length,h.timers.length],counts);
}
test('breath normal fire timing and payloads survive nested scheduling',()=>{
 const h=harness();h.breath();assert.equal(h.events.length,1);h.advance(159);assert.equal(h.events.length,1);h.advance(160);
 assert.equal(h.objects.length,1);assert.equal(h.objects[0].children.length,3);
 h.advance(1000);assert.deepEqual(h.events.filter(e=>e.name==='impact').map(e=>[e.at,e.args[1]]),[[265,{tx:2,ty:3}],[330,{tx:3,ty:3}]]);
 assert.equal(h.events.filter(e=>e.name==='flame').length,2);
 assert.equal(h.events.filter(e=>e.name==='particle'&&e.args[0].sprite==='flame').length,15);
 assert.equal(h.events.filter(e=>e.name==='particle'&&e.args[0].sprite==='smoke').length,4);
 assert.equal(h.events.find(e=>e.name==='ring').at,350);assert.equal(h.ctx._fxDelays.size,0);
 h.tick(500);assert.ok(h.objects[0].children[0].scale.y>0);h.tick(1100);
 assert.equal(h.objects.length,0);assert.ok(h.resources.every(r=>r.disposals===1));
});
for(const at of [0,160,280,400])test(`breath retirement at ${at} ms rejects nested work after fresh cast`,()=>{const h=harness();h.breath();h.advance(at);staleAfterRetire(h,()=>h.breath());h.advance(2000);assert.ok(h.events.filter(e=>e.name==='impact').length>=2);});
test('water breath preserves water rings and sparks without fire or smoke',()=>{const h=harness();h.breath('water');h.advance(2000);assert.equal(h.events.filter(e=>e.name==='ring').length,3);assert.equal(h.events.filter(e=>e.name==='sparks').length,3);assert.equal(h.events.filter(e=>e.name==='flame').length,0);assert.equal(h.events.filter(e=>e.name==='particle'&&e.args[0].sprite==='smoke').length,0);});
test('boomerang preserves outward, reversed return and catch schedule with real nested geometry',()=>{
 const h=harness();h.boomerang();h.advance(2000);
 assert.deepEqual(h.events.filter(e=>e.name==='ring').map(e=>[e.at,...e.args.slice(0,2),e.args[2].color]),[[140,2,3,0x9fe8ff],[280,3,3,0x9fe8ff],[590,3,3,0xffffff],[730,2,3,0xffffff]]);
 assert.equal(h.events.find(e=>e.name==='sparks'&&e.args[2]==='spark-blue').at,790);
 assert.equal(h.objects.length,9);assert.equal(h.ctx._fxDelays.size,0);
 h.tick(2100);assert.equal(h.objects.length,0);assert.ok(h.resources.every(r=>r.disposals===1));
});
for(const at of [0,80,320,450,600])test(`boomerang retirement at ${at} ms rejects outer and transitive callbacks`,()=>{const h=harness();h.boomerang();h.advance(at);staleAfterRetire(h,()=>h.boomerang());h.advance(2000);h.retire();h.tick(3000);assert.ok(h.resources.every(r=>r.disposals===1));assert.equal(h.objects.length,0);});
for(const effect of ['breath','boomerang'])test(`${effect} refuses geometry at cap without leaking allocations`,()=>{const h=harness({cap:0});h[effect]();h.advance(2000);assert.ok(h.resources.length>0);assert.equal(h.objects.length,0);assert.equal(h.ctx._sigEntries.length,0);assert.ok(h.resources.every(r=>r.disposals===1));h.retire();assert.ok(h.resources.every(r=>r.disposals===1));});
test('dash dust from other callers retires along with staggered crescents',()=>{const h=harness();h.ctx._sigDashWave3D(1,3,3,3,{dust:4});h.advance(0);staleAfterRetire(h,()=>{});assert.ok(h.resources.every(r=>r.disposals===1));});
test('suppression prevents release; no scene keeps breath particle fallback and no empty-route work',()=>{
 const h=harness();h.breath();h.suppress();h.advance(2000);assert.equal(h.events.length,1);assert.equal(h.resources.length,0);
 const missing=harness({sceneAvailable:false});missing.breath();missing.advance(2000);assert.equal(missing.resources.length,0);assert.equal(missing.events.filter(e=>e.name==='impact').length,2);
 const empty=harness();empty.ctx._sigBreathBlast3D(1,3,[]);empty.ctx._sigSonicBoomerang3D(1,3,[]);assert.equal(empty.timers.length,0);assert.equal(empty.events.length,0);
});
