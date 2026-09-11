'use strict';
// LIFE-06 / VFX-03: a refused _sigRun registration (active cap, no scene)
// must not leak the group a signature helper just built. _sigRunOwned applies
// the same disposal rule as a finished run; every helper that does not read
// the entry back must call it. Rendering objects are controlled doubles —
// this is not WebGL or host/guest acceptance.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE||__dirname,'three-vfx-effects.js'),'utf8');
function section(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i,a);return source.slice(i,j);}
function harness({cap=50,missing=false,vanish=false}={}){
 const resources=[],textures=[],frames=[];let now=0,reads=0;
 class Resource{constructor(){this.disposals=0;resources.push(this);}dispose(){this.disposals++;}translate(){return this;}}
 class Vector{set(x,y,z){Object.assign(this,{x,y,z});return this;}}
 class Group{constructor(){this.children=[];this.position=new Vector();this.scale=new Vector();this.rotation={};}add(o){this.children.push(o);o.parent=this;}remove(o){this.children=this.children.filter(x=>x!==o);o.parent=null;}traverse(fn){fn(this);this.children.forEach(o=>o.traverse(fn));}}
 class Mesh extends Group{constructor(geometry,material){super();Object.assign(this,{geometry,material});}}
 class Material extends Resource{constructor(o){super();Object.assign(this,o||{});}}
 const a=new Group();const scene=a;
 const texture=()=>{const t={disposals:0,dispose(){this.disposals++;}};textures.push(t);return t;};
 const ctx=vm.createContext({Math,Array,console,performance:{now:()=>now},
  THREE:{Group,Mesh,BoxGeometry:Resource,MeshBasicMaterial:Material,Color:class{constructor(c){this.c=c;}}},
  _getVFXScene:()=>missing||(vanish&&++reads>1)?null:scene,
  _worldPos:(x,y)=>({x:x*128,y:0,z:y*128,ts:128}),_camRightBoardDir:()=>({x:1,y:0}),
  _sigTerrainTex:texture,_sigEaseOutBack:t=>t,_sigActive:0,_SIG_MAX_ACTIVE:cap,_sigEntries:[],_fxSchedule:fn=>frames.push(fn)});
 ctx.window=ctx;
 vm.runInContext(section('    function _sigRun(','    /* full-viewport')+section('    function _sigPlank3D(','    /* ── HERO: saucer flight'),ctx);
 return {ctx,resources,textures,a,Group,Mesh,Resource,Material,tick(ms){now=ms;frames.forEach(f=>f());},retire(){[...ctx._sigEntries].forEach(e=>e.finish());}};
}
test('source: no _sigRun caller ignores a refused registration',()=>{
 const lines=source.split('\n');const ignored=[];let owned=0;
 lines.forEach((l,i)=>{const t=l.trim();if(t.includes('_sigRunOwned('))owned++;if(!t.includes('_sigRun('))return;if(/^(var |return |[a-z]\w* = |function _sigRun\()/.test(t))return;if(t.startsWith('var entry = _sigRun('))return;ignored.push(`${i+1}: ${t}`);});
 assert.deepEqual(ignored,[]);assert.ok(owned>=40,`only ${owned} owned callers`);
 const run=section('    function _sigRun(','    function _sigDisposeGroup(');
 assert.ok(run.includes('_sigDisposeGroup(group)'));assert.ok(!run.includes('geometry.dispose()'),'finish keeps one disposal rule');
 assert.ok(section('    function _sigPlank3D(','    /* ── HERO: saucer flight').includes('_sigRunOwned(pivot'));
});
test('_sigRunOwned disposes a refused group once, skipping shared geometry and keeping textures',()=>{
 const h=harness({cap:0});const g=new h.Group();const shared=new h.Resource();shared._ew_shared=true;const tex=h.textures.length;
 const m1=new h.Material({map:{disposals:0,dispose(){this.disposals++;}}}),m2=new h.Material(),m3=new h.Material();
 g.add(new h.Mesh(shared,m1));const inner=new h.Group();inner.add(new h.Mesh(new h.Resource(),[m2,m3]));g.add(inner);
 assert.equal(h.ctx._sigRunOwned(g,300,()=>{}),null);
 assert.equal(shared.disposals,0);assert.equal(m1.map.disposals,0);
 assert.ok([m1,m2,m3].every(m=>m.disposals===1));assert.equal(h.resources.filter(r=>r!==shared).every(r=>r.disposals===1),true);
 assert.equal(h.a.children.length,0);assert.equal(h.ctx._sigActive,0);assert.equal(h.ctx._sigEntries.length,0);
});
test('_sigRunOwned registers normally and finish disposes exactly once',()=>{
 const h=harness();const g=new h.Group();const m=new h.Material();g.add(new h.Mesh(new h.Resource(),m));let ticks=0;
 const e=h.ctx._sigRunOwned(g,300,()=>{ticks++;});assert.ok(e);assert.equal(h.a.children.length,1);assert.equal(h.ctx._sigActive,1);
 h.tick(100);assert.equal(ticks,1);assert.ok(h.resources.every(r=>r.disposals===0));
 h.tick(400);assert.equal(h.a.children.length,0);assert.equal(h.ctx._sigActive,0);h.retire();e.finish();
 assert.ok(h.resources.every(r=>r.disposals===1));
});
for(const mode of ['cap','vanish'])test(`_sigPlank3D disposes board, strap and both materials on ${mode} refusal`,()=>{
 const h=harness(mode==='cap'?{cap:0}:{vanish:true});h.ctx._sigPlank3D(2,3,{});
 assert.equal(h.resources.length,4);assert.ok(h.resources.every(r=>r.disposals===1));
 assert.equal(h.a.children.length,0);assert.equal(h.ctx._sigActive,0);assert.ok(h.textures.every(t=>t.disposals===0));
 h.retire();assert.ok(h.resources.every(r=>r.disposals===1));
});
test('_sigPlank3D extends, holds, retracts and cleans exactly once',()=>{
 const h=harness();h.ctx._sigPlank3D(2,3,{extendMs:200,holdMs:400,retractMs:200});
 assert.equal(h.resources.length,4);assert.equal(h.a.children.length,1);const pivot=h.a.children[0],board=pivot.children[0];
 h.tick(100);assert.ok(board.scale.z>0&&board.scale.z<=1);assert.ok(board.material.opacity>0);
 h.tick(400);assert.equal(board.scale.z,1);assert.equal(board.material.opacity,1);
 h.tick(700);assert.ok(board.scale.z<1);
 h.tick(900);assert.equal(h.a.children.length,0);assert.equal(h.ctx._sigActive,0);
 h.retire();assert.ok(h.resources.every(r=>r.disposals===1));assert.ok(h.textures.every(t=>t.disposals===0));
});
test('missing scene: plank allocates nothing',()=>{const h=harness({missing:true});h.ctx._sigPlank3D(1,1,{});assert.equal(h.resources.length,0);});
