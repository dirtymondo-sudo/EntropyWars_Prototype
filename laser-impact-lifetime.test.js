'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE||__dirname,'three-vfx-effects.js'),'utf8');
function section(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return source.slice(i,j);}
function harness(sceneAvailable=true){
 const timers=[],particles=[],orbs=[],meshes=[],frames=[];let suppressed=false;
 class Vector {constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}set(x,y,z){Object.assign(this,{x,y,z});return this;}copy(v){return this.set(v.x,v.y,v.z);}subVectors(a,b){return this.set(a.x-b.x,a.y-b.y,a.z-b.z);}length(){return Math.hypot(this.x,this.y,this.z);}normalize(){return this.multiplyScalar(1/(this.length()||1));}multiplyScalar(n){return this.set(this.x*n,this.y*n,this.z*n);}clone(){return new Vector(this.x,this.y,this.z);}add(v){return this.set(this.x+v.x,this.y+v.y,this.z+v.z);}addScaledVector(v,n){return this.add(v.clone().multiplyScalar(n));}}
 class Quaternion {setFromUnitVectors(){return this;}copy(){return this;}}
 class Resource {constructor(opts){Object.assign(this,opts);this.disposals=0;}dispose(){this.disposals++;}}
 class Mesh {constructor(geometry,material){Object.assign(this,{geometry,material,position:new Vector(),scale:new Vector(),quaternion:new Quaternion()});}}
 const scene={add(m){meshes.push(m);},remove(m){meshes.splice(meshes.indexOf(m),1);}};
 const ctx=vm.createContext({Set,Math,Array,performance:{now:()=>0},
 window:{setTimeout(fn,ms){timers.push({fn,ms,canceled:false});return timers.length;},clearTimeout(id){timers[id-1].canceled=true;}},
 THREE:{Vector3:Vector,Quaternion,Mesh,CylinderGeometry:Resource,PlaneGeometry:Resource,MeshBasicMaterial:Resource,Color:Resource},
 _getVFXScene:()=>sceneAvailable?scene:null,_worldTorso:(x,y)=>({x:x*128,y:64,z:y*128,ts:128}),
 _sigEnergyMat:()=>new Resource({uniforms:{uOpacity:{value:0}}}),_sigEnergyTick(){},_sigRingTex:()=>({shared:true}),_sigMat:()=>new Resource(),
 _active3DGeom:[],_fxSchedule:fn=>frames.push(fn),_suppressed:()=>suppressed,
 tilePx:(x,y)=>({x:x*128,y:y*128}),unitSurfaceZ:()=>10,unitZBoost:()=>64,tileZ:()=>10,rn:(a,b)=>(a+b)/2,
 _spawn:p=>particles.push(p),_sigOrbBurst3D:(...args)=>orbs.push(args)
 });
 vm.runInContext(section('    var _fxLifetime','    function rn')+section('    function _animate3D(','    function _addMesh(')+section('    function _spawnLaserBeam3D(','    /* ─── RADIANT BURST'),ctx);
 return {ctx,timers,particles,orbs,meshes,frames,fire:(opts={})=>ctx._spawnLaserBeam3D(1,2,4,5,opts),suppress(){suppressed=true;},retire(){ctx._fxCancelDelays();for(const e of [...ctx._active3DGeom])ctx._cleanup3D(e);}};
}
test('laser retains normal geometry, lance timing and terminus payload',()=>{
 const h=harness();assert.equal(h.fire({beamMs:300,glow:123,thickness:2}),true);
 assert.equal(h.meshes.length,6);assert.equal(h.particles.length,18);assert.equal(h.timers[0].ms,54);
 h.frames[0]();h.timers[0].fn();
 assert.equal(h.particles.length,50);assert.equal(h.orbs.length,1);
 assert.deepEqual(h.orbs[0].slice(0,2),[4,5]);assert.equal(h.orbs[0][2].color,123);
 const ring=h.particles.at(-1);assert.equal(ring.sprite,'target-ring');assert.equal(ring.x,512);assert.equal(ring.y,640);assert.equal(ring.z,11);
 assert.equal(h.ctx._fxDelays.size,0);
});
test('retired laser cancels its pending impact',()=>{
 const h=harness();h.fire();h.retire();assert.equal(h.timers[0].canceled,true);
 const n=h.particles.length;h.timers[0].fn();assert.equal(h.particles.length,n);assert.equal(h.orbs.length,0);
});
test('queued old impact cannot enter a new effect lifetime',()=>{
 const h=harness();h.fire();const old=h.timers[0];h.retire();h.fire({beamMs:600,rings:0});
 const n=h.particles.length;old.fn();assert.equal(h.particles.length,n);assert.equal(h.orbs.length,0);
 assert.equal(h.timers[1].ms,80);h.timers[1].fn();assert.equal(h.particles.length,n+32);assert.equal(h.orbs.length,1);
});
test('retirement disposes beam geometry once without relying on impact callback',()=>{
 const h=harness();h.fire();const resources=h.meshes.flatMap(m=>[m.geometry,m.material]);
 h.retire();h.retire();h.frames[0]();assert.equal(h.meshes.length,0);assert.ok(resources.every(r=>r.disposals===1));
});
test('suppressed impact emits nothing and releases timer ownership',()=>{
 const h=harness();h.fire();h.suppress();h.timers[0].fn();assert.equal(h.particles.length,18);assert.equal(h.orbs.length,0);assert.equal(h.ctx._fxDelays.size,0);
});
test('missing scene preserves sprite fallback with no geometry or timer',()=>{
 const h=harness(false);assert.equal(h.fire(),false);assert.equal(h.timers.length,0);assert.equal(h.meshes.length,0);assert.equal(h.particles.length,0);
});
