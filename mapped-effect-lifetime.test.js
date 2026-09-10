'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE||__dirname,'three-vfx-effects.js'),'utf8');
function section(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return source.slice(i,j);}
function harness(laser=true){
 const timers=[],events=[];let id=0;
 const ctx=vm.createContext({Set,Math,Array,
 window:{shakeBoard(){},setTimeout(fn,ms){timers.push({id:++id,fn,ms,ran:false,canceled:false});return id;},clearTimeout(id){timers.find(t=>t.id===id).canceled=true;}},
 _catOff:()=>false,_canSpawn:()=>true,_suppressed:()=>false,_cfg:()=>({tileSize:128}),
 SPELL_MAP:{wall:{wall:'wall'},chain:{chain:'hop'},beam:{beam:'beam'}},
 EFFECTS:{wall:{id:'wall',_loop:3,_loopMs:300},hop:{id:'hop'},beam:{chargeMs:80,beamMs:280,impactTileEffect:'hit',impactCenterEffect:'center',leaveScorch:true,beamHeadSprite:'head',shake:'soft'},hit:{id:'hit'},center:{id:'center'}},
 _spawnEffect:(d,p)=>events.push(['effect',d.id,p.tx,p.ty]),_spawn:p=>events.push(['particle',p.sprite]),
 _geom3D:()=>null,_shake:s=>events.push(['shake',s]),_LT:()=>({chainBolt:(x,y,tx,ty)=>events.push(['bolt',x,y,tx,ty])}),
 tilePx:(x,y)=>({x:x*128,y:y*128}),tileZ:()=>0,unitSurfaceZ:()=>0,unitZBoost:()=>64,
 _beamColorFor:()=>({core:1,glow:2}),_spawnLaserBeam3D:(...p)=>{events.push(['laser',...p.slice(0,4)]);return laser;},
 state:{units:[{x:3,y:2}]}
 });
 vm.runInContext(section('    var _fxLifetime','    function rn')+section('    function _fireWall(','    /* ─── BOLT SYSTEM'),ctx);
 return {ctx,timers,events,run(t){t.ran=true;t.fn();},drain(){for(const t of timers)if(!t.ran&&!t.canceled)this.run(t);},fire(kind){if(kind==='wall')ctx._fireWall('wall',{tiles:[{x:2,y:2},{x:3,y:2}]});if(kind==='chain')ctx._fireChain('chain',{chain:[{x:1,y:2},{x:2,y:2},{x:3,y:2}]});if(kind==='beam')ctx._fireBeamMapped('beam',{sx:1,sy:2,tx:3,ty:2});}};
}
for(const kind of ['wall','chain','beam']){
 test(kind+' keeps current-lifetime timing and emissions',()=>{
  const h=harness();h.fire(kind);
  assert.deepEqual(h.timers.map(t=>t.ms),kind==='wall'?[0,300,600,80,380,680]:kind==='chain'?[0,140]:[80]);
  h.drain();assert.equal(h.ctx._fxDelays.size,0);
  assert.equal(h.events.filter(e=>e[0]==='effect').length,kind==='wall'?6:kind==='chain'?2:3);
  if(kind==='chain')assert.deepEqual(h.events.filter(e=>e[0]==='bolt'),[['bolt',1,2,2,2],['bolt',2,2,3,2]]);
  if(kind==='beam')assert.deepEqual(h.events.find(e=>e[0]==='laser'),['laser',1,2,3,2]);
 });
 for(const partial of (kind==='beam'?[false]:[false,true]))test(kind+' rejects stale callbacks '+(partial?'after first emission':'before emission'),()=>{
  const h=harness();h.fire(kind);
  if(partial&&kind!=='beam')h.run(h.timers[0]);
  const old=h.timers.filter(t=>!t.ran);h.ctx._fxCancelDelays();
  assert.ok(old.every(t=>t.canceled),'pending timers are canceled');
  h.fire(kind);const n=h.events.length;
  old.forEach(t=>h.run(t));assert.equal(h.events.length,n,'old callbacks stay inert even after a fresh cast');
  h.drain();assert.ok(h.events.length>n);assert.equal(h.ctx._fxDelays.size,0);
 });
}
test('beam sprite fallback preserves scorch, head and first occupied impact',()=>{
 const h=harness(false);h.fire('beam');h.drain();
 assert.deepEqual(h.events.filter(e=>e[0]==='particle').map(e=>e[1]),['flash','plasma','plasma','scorch','scorch','head']);
 assert.deepEqual(h.events.filter(e=>e[0]==='effect'),[['effect','hit',2,2],['effect','hit',3,2],['effect','center',3,2]]);
});
test('chain primary option includes first hit without a self bolt',()=>{
 const h=harness();h.ctx._fireChain('chain',{chain:[{x:1,y:2},{x:2,y:2}],includePrimary:true,staggerMs:25});h.drain();
 assert.deepEqual(h.timers.map(t=>t.ms),[0,25]);assert.equal(h.events.filter(e=>e[0]==='effect').length,2);
 assert.deepEqual(h.events.filter(e=>e[0]==='bolt'),[['bolt',1,2,2,2]]);
});
