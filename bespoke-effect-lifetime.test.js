'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE || __dirname,'three-vfx-effects.js'),'utf8');
function section(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i,a);return source.slice(i,j);}
function harness(){
 let id=0,now=0;const timers=new Map(),intervals=new Map(),events=[],resources=[],ticks=[];
 class Resource {constructor(){this.disposed=0;resources.push(this);}dispose(){this.disposed++;}}
 class Object3D {
  constructor(geometry,material){this.geometry=geometry;this.material=material;this.children=[];this.parent=null;this.position={set(){}};this.scale={set(){}};this.rotation={};}
  add(o){if(o.parent)o.parent.remove(o);this.children.push(o);o.parent=this;}
  remove(o){const i=this.children.indexOf(o);if(i>=0){this.children.splice(i,1);o.parent=null;}}
  traverse(fn){fn(this);for(const c of this.children)c.traverse(fn);}
 }
 const scene=new Object3D();
 const ctx=vm.createContext({Set,Math,performance:{now:()=>now},
  window:{setTimeout(fn){timers.set(++id,{fn,canceled:false});return id;},clearTimeout(i){timers.get(i).canceled=true;},setInterval(fn){intervals.set(++id,fn);return id;},clearInterval(i){intervals.delete(i);}},
  THREE:{Group:Object3D,Mesh:Object3D,CylinderGeometry:Resource,TorusGeometry:Resource,MeshBasicMaterial:Resource,Color:class{}},
  _VS:{on:false},_suppressed:()=>false,_canSpawn:()=>true,_cfg:()=>({tileSize:128}),
  _fireUtility:(...a)=>events.push(a),_sigDashWave3D:()=>events.push(['dash']),_sigShockRing3D:()=>events.push(['ring']),
  _sigPresent3D:()=>events.push(['present']),_spawnBlizzardShards3D:()=>events.push(['shards']),
  _getVFXScene:()=>scene,_worldPos:()=>({x:0,y:0,z:0,ts:128}),_active3DGeom:[],_fxSchedule:fn=>ticks.push(fn)
 });
 vm.runInContext(section('    var _fxLifetime','    function rn')+section('    function fireDash(','    function fireZone(')+
  'var spellHooks={'+section('        raceBlizzardPresent:','        sharedSummonBlizzard:')+'};'+
  section('    function _animate3D(','    function _addMesh(')+section('    function _spawnDustDevil3D(','    function _spawnPortalRing3D('),ctx);
 return {ctx,timers,intervals,events,resources,scene,
  retire(){ctx._fxCancelDelays();for(const entry of [...ctx._active3DGeom])ctx._cleanup3D(entry);},
  flush(){for(const t of [...timers.values()])t.fn();},
  finish(){now=1500;for(const tick of ticks)tick();}
 };
}
const cases=[['dash',h=>h.ctx.fireDash(0,0,3,2),'ring'],['legacy teleport',h=>h.ctx.fireTeleportLegacy(0,0,3,2),'_teleport_arrive'],['blizzard',h=>h.ctx.spellHooks.raceBlizzardPresent(3,2,1),'shards']];
for(const [name,fire,last] of cases){
 test(name+' emits the delayed effect in its current lifetime',()=>{const h=harness();fire(h);h.flush();assert.equal(h.events.at(-1)[0],last);});
 test(name+' rejects a queued callback after retirement and allows a fresh cast',()=>{
  const h=harness();fire(h);const old=[...h.timers.values()];const before=h.events.length;
  h.retire();for(const t of old)t.fn();assert.equal(h.events.length,before);
  assert.ok(old.every(t=>t.canceled),'underlying timers canceled');
  h.ctx._VS.on=true;fire(h);const fresh=h.events.length;
  for(const t of old)t.fn();assert.equal(h.events.length,fresh,'old callback cannot enter the preview');
  for(const t of [...h.timers.values()].filter(t=>!old.includes(t)))t.fn();assert.equal(h.events.at(-1)[0],last);
 });
}
for(const mode of ['retirement','normal completion'])test('dust devil detaches and disposes exactly once on '+mode,()=>{
 const h=harness();h.ctx._spawnDustDevil3D(1,2,1);assert.equal(h.scene.children.length,1);assert.equal(h.resources.length,8);
 if(mode==='retirement')h.retire();else h.finish();
 assert.equal(h.scene.children.length,0,'attached group removed immediately');
 assert.equal(h.ctx._active3DGeom.length,0);assert.ok(h.resources.every(r=>r.disposed===1));
 h.retire();h.finish();for(const fn of h.intervals.values())fn();
 assert.ok(h.resources.every(r=>r.disposed===1),'repeat cleanup is harmless');assert.equal(h.intervals.size,0);
});
test('dust devil cleanup does not remove a subsequent scene owner',()=>{
 const h=harness();h.ctx._spawnDustDevil3D(1,2,1);h.retire();h.ctx._spawnDustDevil3D(3,4,1);
 assert.equal(h.scene.children.length,1);assert.ok(h.resources.slice(8).every(r=>r.disposed===0));
 h.retire();assert.equal(h.scene.children.length,0);assert.ok(h.resources.every(r=>r.disposed===1));
});
