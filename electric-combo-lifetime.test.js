'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE || __dirname,'three-vfx-effects.js'),'utf8');
function section(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i,a);return source.slice(i,j);}
function harness(){
 let id=0;const timers=[],events=[];
 const ctx=vm.createContext({Set,Math,
  window:{setTimeout(fn,ms){const t={id:++id,fn,ms,canceled:false};timers.push(t);return id;},clearTimeout(id){timers.find(t=>t.id===id).canceled=true;}},
  _suppressed:()=>false,_catOff:()=>false,_cfg:()=>({tileSize:128}),
  _cueHex:(v,f)=>v||f,_LT:()=>({bolt:(...args)=>events.push(['bolt',...args])}),
  tilePx:(x,y)=>({x:x*128,y:y*128}),unitSurfaceZ:()=>0,unitZBoost:()=>32,
  rn:(a,b)=>(a+b)/2,_spawn:p=>events.push(['particle',p]),
  _fireUtility:(...args)=>events.push(['utility',...args]),
  _spawnEffect:()=>{},_autoTintFor:()=>null,_geom3D:()=>null,
  hasMapping:()=>true,SPELL_MAP:{taser:{impact:'zap'}},EFFECTS:{zap:{}},state:{}
 });
 vm.runInContext(section('    var _fxLifetime','    function rn')+
  'var cues={'+section('        electric_arcs: function(q)','        ice_shards: function(q)')+'};'+
  section('    function fire(intent,','    function _fireUtility(')+
  section('    var _COMBO_STREAM_SPRITES','    function _buildTileOffsets('),ctx);
 return {ctx,timers,events,retire(){ctx._fxCancelDelays();}};
}
const cases=[
 ['electric cue',h=>h.ctx.cues.electric_arcs({c:{x:128,y:256},zt:32,ts:128,s:1}),3,[0,60,120]],
 ['electric impact',h=>h.ctx.fire('impact','taser',{tx:1,ty:2}),3,[0,40,80]],
 ['combo',h=>h.ctx.fireCombo(0,0,0,2,2,0,'divine','tech'),29,[0,60,790]]
];
for(const [name,fire,count,delays] of cases){
 test(name+' retains current-lifetime timing and emissions',()=>{
  const h=harness();fire(h);assert.deepEqual(h.timers.map(t=>t.ms),delays);
  // Iterate the growing list so nested combo trails also run.
  for(const t of h.timers)t.fn();assert.equal(h.events.length,count);
  assert.equal(h.ctx._fxDelays.size,0);
  if(name==='combo'){
   assert.equal(h.events.filter(e=>e[0]==='utility').length,1);
   assert.equal(h.events.filter(e=>e[0]==='particle'&&e[1].sprite==='divine-sparkle').length,14);
   assert.equal(h.events.filter(e=>e[0]==='particle'&&e[1].sprite==='spark-blue').length,14);
  }
 });
 test(name+' cancels timers and rejects already queued callbacks after scene retirement',()=>{
  const h=harness();fire(h);const old=h.timers.slice();h.retire();
  assert.ok(old.every(t=>t.canceled));for(const t of old)t.fn();
  assert.equal(h.events.length,0);assert.equal(h.timers.length,old.length,'no nested work escapes');
 });
 test(name+' cannot spill into a new effect lifetime',()=>{
  const h=harness();fire(h);const old=h.timers.slice();h.retire();fire(h);
  for(const t of old)t.fn();assert.equal(h.events.length,0);
  for(let i=old.length;i<h.timers.length;i++)h.timers[i].fn();
  assert.equal(h.events.length,count);assert.equal(h.ctx._fxDelays.size,0);
 });
}
test('combo retires nested trails and arrival after convergence has started',()=>{
 const h=harness();cases[2][1](h);h.timers[0].fn();h.timers[1].fn();
 assert.equal(h.events.length,2);const pending=h.timers.slice(2);h.retire();
 assert.ok(pending.every(t=>t.canceled));for(const t of pending)t.fn();
 assert.equal(h.events.length,2,'no old trail particles or arrival explosion');
 const firstFresh=h.timers.length;cases[2][1](h);for(let i=firstFresh;i<h.timers.length;i++)h.timers[i].fn();
 assert.equal(h.events.filter(e=>e[0]==='utility').length,1,'fresh arrival still fires');
});
