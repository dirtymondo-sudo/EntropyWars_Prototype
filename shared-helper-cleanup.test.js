'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE||__dirname,'three-vfx-effects.js'),'utf8');
function section(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return source.slice(i,j);}
function harness({cap=50,missing=false,vanish=false}={}){
 const resources=[],textures=[],frames=[];let now=0,reads=0;
 class Resource{constructor(){this.disposals=0;resources.push(this);}dispose(){this.disposals++;}}
 class Vector{set(x,y,z){Object.assign(this,{x,y,z});return this;}}
 class Group{constructor(){this.children=[];this.position=new Vector();this.scale=new Vector();this.rotation={};}add(o){this.children.push(o);o.parent=this;}remove(o){this.children=this.children.filter(x=>x!==o);o.parent=null;}traverse(fn){fn(this);this.children.forEach(o=>o.traverse(fn));}}
 class Mesh extends Group{constructor(geometry,material){super();Object.assign(this,{geometry,material});}}
 const a=new Group(),b=new Group();let scene=a;
 const texture=()=>{const t={disposals:0,dispose(){this.disposals++;}};textures.push(t);return t;};
 const ctx=vm.createContext({Math,Array,console,performance:{now:()=>now},THREE:{Group,Mesh,PlaneGeometry:Resource,TorusGeometry:Resource},_getVFXScene:()=>missing||(vanish&&++reads>1)?null:scene,_worldPos:(x,y)=>({x:x*128,y:0,z:y*128,ts:128}),_sigMat:(color,opts)=>Object.assign(new Resource(),{color,map:opts&&opts.map}),_sigRingTex:texture,_sigBurstTex:texture,_sigClamp01:x=>Math.max(0,Math.min(1,x)),_sigEaseOutCubic:x=>1-(1-x)**3,_sigActive:0,_SIG_MAX_ACTIVE:cap,_sigEntries:[],_fxSchedule:fn=>frames.push(fn),_canSpawn:()=>true,_catOff:()=>false,state:{},tilePx:(x,y)=>({x:x*128,y:y*128}),tileZ:()=>0,_cfg:()=>({boardPadding:2}),_buildFlameVolume:()=>{const group=new Group(),mat=new Resource();mat.uniforms={uTime:{value:0},uVig:{value:0}};return {group,mats:[mat]};}});
 ctx.window=ctx;ctx.ThreeVFX={_getScene:()=>scene};
 vm.runInContext(section('    function _sigRun(','    /* full-viewport')+section('    function _sigShockRing3D(','    /* ── floating, expanding')+section('    function _sigSpeedBurst3D(','    /* ── vertical column')+section('    var _flameBursts =','    /* ── Volumetric flames for burning tiles'),ctx);
 return {ctx,resources,textures,a,b,frames,switchScene(){scene=b;},tick(ms){now=ms;frames.forEach(f=>f());},retire(){[...ctx._sigEntries].forEach(e=>e.finish());ctx._disposeAllFlameBursts();}};
}
for(const [name,opts,count] of [['_sigShockRing3D',{},4],['_sigShockRing3D',{torus:false},2],['_sigSpeedBurst3D',{flat:true},2]]){
 for(const mode of ['cap','vanish'])test(`${name} ${JSON.stringify(opts)} disposes allocations on ${mode} refusal`,()=>{const h=harness(mode==='cap'?{cap:0}:{vanish:true});assert.equal(h.ctx[name](2,3,opts),null);assert.equal(h.resources.length,count);assert.ok(h.resources.every(r=>r.disposals===1));assert.equal(h.a.children.length,0);assert.equal(h.ctx._sigActive,0);h.retire();assert.ok(h.resources.every(r=>r.disposals===1));assert.ok(h.textures.every(t=>t.disposals===0));});
 test(`${name} ${JSON.stringify(opts)} animates then cleans exactly once`,()=>{const h=harness();const e=h.ctx[name](2,3,{...opts,ms:400});assert.ok(e);assert.equal(h.resources.length,count);h.tick(200);assert.ok(e.group.children[0].scale.x>0);assert.ok(e.group.children[0].material.opacity>0);h.tick(400);e.finish();h.retire();assert.equal(h.a.children.length,0);assert.equal(h.ctx._sigActive,0);assert.ok(h.resources.every(r=>r.disposals===1));assert.ok(h.textures.every(t=>t.disposals===0));});
}
test('missing scene allocates nothing; early retirement ignores stale animation frames',()=>{const h=harness({missing:true});assert.equal(h.ctx._sigShockRing3D(1,2),null);assert.equal(h.ctx._sigSpeedBurst3D(1,2),null);assert.equal(h.resources.length,0);const live=harness();live.ctx._sigShockRing3D(1,2);live.ctx._sigSpeedBurst3D(1,2);live.retire();live.tick(100);live.retire();assert.ok(live.resources.every(r=>r.disposals===1));assert.equal(live.a.children.length,0);});
for(const route of ['spawn','tick'])test(`flame scene switch through ${route} detaches old meshes before disposing`,()=>{const h=harness();h.ctx.spawnFlameBurst3D(1,2);const old=h.a.children[0];h.switchScene();if(route==='spawn')h.ctx.spawnFlameBurst3D(3,4);else h.ctx._tickFlameBursts(.1);assert.equal(h.a.children.length,0);assert.equal(old.parent,null);assert.equal(h.resources[0].disposals,1);h.retire();assert.equal(h.b.children.length,0);assert.ok(h.resources.every(r=>r.disposals===1));});
test('flame re-ignition extends life without allocating and expiration detaches once',()=>{const h=harness();h.ctx.spawnFlameBurst3D(1,2,{lifeMs:500});h.ctx._tickFlameBursts(.3);h.ctx.spawnFlameBurst3D(1,2,{lifeMs:500});assert.equal(h.resources.length,1);h.ctx._tickFlameBursts(.3);assert.equal(h.a.children.length,1);h.ctx._tickFlameBursts(.3);assert.equal(h.a.children.length,0);h.retire();assert.equal(h.resources[0].disposals,1);});
