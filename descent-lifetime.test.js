'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE||__dirname,'three-vfx-effects.js'),'utf8');
function section(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return source.slice(i,j);}
function harness(warm=false){
 const timers=[],events=[];let id=0;
 class Group {constructor(){this.position={set(){}};this.rotation={};}add(){}}
 const def={telegraphMs:800,descentMs:90,aoeRadius:1,flyover:{durationMs:600,delayMs:120,trailCount:2},layers:[{sprite:'missile'},{sprite:'glow'}],impactTileEffect:'tile',impactCenterEffect:'center'};
 const ctx=vm.createContext({Set,Math,Object,THREE:{Group,Mesh:Group,PlaneGeometry:Group},
 window:{setTimeout(fn,ms){timers.push({id:++id,fn,ms,canceled:false,ran:false});return id;},clearTimeout(id){timers.find(t=>t.id===id).canceled=true;}},
 _catOff:()=>false,_canSpawn:()=>true,_suppressed:()=>false,_cfg:()=>({tileSize:128}),
 SPELL_MAP:{thunder:{descent:'drop'}},EFFECTS:{drop:def,tile:{id:'tile'},center:{id:'center'}},
 _buildTileOffsets:()=>[{dx:0,dy:0},{dx:1,dy:0}],tilePx:(x,y)=>({x:x*128,y:y*128}),tileZ:()=>0,
 _framedRise:()=>400,_camRightBoardDir:()=>({x:1,y:0}),_camWorldSpanAt:()=>null,
 _spawn:p=>events.push(['particle',p.sprite]),playSfx:s=>events.push(['sound',s]),rn:(a,b)=>(a+b)/2,
 _wpnReady:key=>warm&&key==='missile',_wpnInstance:()=>({group:new Group(),len:100,setFade(){}}),
 _worldPos:()=>({x:0,y:0,z:0,ts:128}),_sigMat:()=>({}),_sigGlowTex:()=>null,
 _sigRun:()=>events.push(['model']),_sigClamp01:v=>Math.min(1,Math.max(0,v)),
 _spawnEffect:d=>events.push(['effect',d.id||d.layers.map(l=>l.sprite).join(',')]),
 _geom3D:()=>null,_LT:()=>({strikeFromSky:()=>events.push(['lightning'])}),state:{}
 });
 vm.runInContext(section('    var _fxLifetime','    function rn')+section('    function _fireDescent(','    function _fireWall(')+section('    function _sigMissileDrop3D(','    /* ── 3D greatsword builder'),ctx);
 return {ctx,timers,events,fire(){ctx._fireDescent('thunder',{tx:2,ty:3});},run(t){t.ran=true;t.fn();},drain(start=0){for(let i=start;i<timers.length;i++)if(!timers[i].ran)this.run(timers[i]);},retire(){ctx._fxCancelDelays();}};
}
for(const warm of [false,true]){
 const label=warm?'cached missile':'sprite fallback';
 test(label+' preserves descent, lightning, trail and impact emissions',()=>{
  const h=harness(warm);h.fire();assert.deepEqual(h.timers.map(t=>t.ms),[120,800]);h.drain();
  assert.equal(h.events.filter(e=>e[0]==='lightning').length,2);
  assert.equal(h.events.filter(e=>e[0]==='particle'&&e[1]==='smoke').length,warm?5:2);
  assert.equal(h.events.filter(e=>e[0]==='effect').length,4);
  assert.ok(h.events.some(e=>e[1]===(warm?'glow':'missile,glow')));
  assert.equal(h.events.filter(e=>e[0]==='model').length,warm?1:0);
  assert.equal(h.ctx._fxDelays.size,0);
 });
 for(const stage of ['before flyover','after descent','after impact'])test(label+' retires '+stage+' and allows a fresh cast',()=>{
  const h=harness(warm);h.fire();
  if(stage!=='before flyover'){h.run(h.timers[0]);h.run(h.timers[1]);}
  if(stage==='after impact')h.run(h.timers.find((t,i)=>i>1&&t.ms===90));
  const pending=h.timers.filter(t=>!t.ran),count=h.events.length,total=h.timers.length;
  h.retire();assert.ok(pending.every(t=>t.canceled),'all pending emissions canceled');
  h.fire();const freshCount=h.events.length;
  for(const t of pending)h.run(t);
  assert.equal(h.events.length,freshCount,'queued stale callbacks cannot emit');
  assert.equal(h.timers.length,total+2,'queued stale callbacks cannot schedule descendants');
  h.drain(total);assert.ok(h.events.length>count+2);assert.equal(h.ctx._fxDelays.size,0);
 });
}
