'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=process.env.EW_EFFECT_SOURCE || __dirname;
const source=fs.readFileSync(path.join(root,'three-vfx-effects.js'),'utf8');
const renderer=fs.readFileSync(path.join(root,'three-renderer.js'),'utf8');
function between(s,a,b){ const i=s.indexOf(a),j=s.indexOf(b,i+a.length); assert.ok(i>=0&&j>i,a);return s.slice(i,j); }
function harness(){
 const timers=new Map(),frames=new Map(),emissions=[];let id=0,clears=0;
 const ctx=vm.createContext({console,Set,_VS:{on:false},
 window:{setTimeout(fn){timers.set(++id,{fn,canceled:false});return id;},clearTimeout(n){timers.get(n).canceled=true;}},
 requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame(n){frames.delete(n);},
 _canSpawn:()=>true,_suppressed:()=>false,_catOff:()=>false,
 tilePx:(x,y)=>({x,y}),unitSurfaceZ:()=>0,unitZBoost:()=>1,_flameVolumeInfo:()=>null,
 _emitLayer:(...args)=>emissions.push(args),_spawnPortalRing3D:()=>emissions.push('portal'),
 SPELL_MAP:{blink:{teleport:'tele'}},EFFECTS:{tele:{dispersalEffect:'depart',arrivalEffect:'arrive'},depart:{layers:[{}]},arrive:{layers:[{}]}},
 clearAll(){clears++;ctx._fxCancelDelays();ctx._fxKillAllTickers();}
 });
 const helpers=source.includes('    var _fxLifetime')?between(source,'    var _fxLifetime','    function rn'): 'function _fxCancelDelays() {}';
 vm.runInContext(helpers+between(source,'    var _fxTickers','    function _getVFXScene')+
 between(source,'    function _spawnEffect(','    function _emitLayer(')+
 between(source,'    function _cueBatches(','    /* Editor metadata')+
 between(source,'    function _fireTeleport(','    function getDescentTotalMs(')+
 between(source,'    var _vsApi =','    return {\n\n        projectile:').replace('hasMapping: hasMapping,','hasMapping: function () {},'),ctx);
 return {ctx,timers,frames,emissions,clears:()=>clears,runTimers(){for(const t of [...timers.values()])t.fn();}};
}
test('delayed recipe layers cannot emit after clear, even if an already queued callback runs',()=>{
 const h=harness();h.ctx._spawnEffect({layers:[{delayMs:100}]},{tx:1,ty:2});h.ctx.clearAll();h.runTimers();assert.equal(h.emissions.length,0);
});
test('current lifetime emits its delayed layer normally',()=>{
 const h=harness();h.ctx._spawnEffect({layers:[{delayMs:100}]},{tx:1,ty:2});h.runTimers();assert.equal(h.emissions.length,1);
});
test('old teleport arrival cannot appear in a new battle',()=>{
 const h=harness();h.ctx._fireTeleport('blink',{fromX:0,fromY:0,toX:3,toY:3});const n=h.emissions.length;
 h.ctx.clearAll();h.runTimers();assert.equal(h.emissions.length,n);
});
test('cue batches stop across clear even when the new scene permits effects',()=>{
 const h=harness();let n=0;h.ctx._cueBatches(500,100,()=>n++);h.ctx.clearAll();h.runTimers();assert.equal(n,1);
});
test('clearing during a ticker retires its detached list and does not resurrect the current effect',()=>{
 const h=harness();let later=0;h.ctx._fxSchedule(()=>{h.ctx.clearAll();return true;});h.ctx._fxSchedule(()=>{later++;return true;});
 h.ctx._fxPump();assert.equal(later,0);assert.equal(h.ctx._fxTickers.length,0);
});
test('a new ticker scheduled after clear within the old frame survives',()=>{
 const h=harness();let n=0;h.ctx._fxSchedule(()=>{h.ctx.clearAll();h.ctx._fxSchedule(()=>{n++;return false;});return true;});
 h.ctx._fxPump();assert.equal(h.ctx._fxTickers.length,1);h.ctx._fxPump();assert.equal(n,1);assert.equal(h.ctx._fxTickers.length,0);
});
test('battle cleanup retires battle work but preserves an active preview',()=>{
 const h=harness();assert.equal(typeof h.ctx.clearBattle,'function');h.ctx.clearBattle();assert.equal(h.clears(),1);
 h.ctx._vsApi.enter({});h.ctx._spawnEffect({layers:[{delayMs:10}]},{tx:0,ty:0});h.ctx.clearBattle();h.runTimers();assert.equal(h.clears(),1);assert.equal(h.emissions.length,1);
});
test('preview exit cancels its delayed work before a later preview opens',()=>{
 const h=harness();h.ctx._vsApi.enter({});h.ctx._spawnEffect({layers:[{delayMs:10}]},{tx:0,ty:0});h.ctx._vsApi.exit();h.ctx._vsApi.enter({});h.runTimers();assert.equal(h.emissions.length,0);
});
test('renderer deactivation invokes owner-aware retirement',()=>{
 const code=between(renderer,'    function deactivate() {','        hideSplitscreen();')+'}';let n=0;
 const fx={clearBattle(){n++;}};vm.runInNewContext(code+'deactivate();',{window:{ThreeVFXEffects:fx},ThreeVFXEffects:fx,active:true});assert.equal(n,1);
});
test('preview handoff clears the board before moving the shared pools',()=>{
 const code=between(renderer,'    function _cvStageEnter() {','    function _cvStageExit()');const calls=[];
 const fx={clearBattle(){calls.push('clear');}};
 const pool={attach(){calls.push('attach');return true;}};const stage={enter(){calls.push('stage');}};
 const v={vfxGroup:{},cam:{},h:1};
 vm.runInNewContext(code+'_cvStageEnter();',{_cv:v,window:{ThreeVFXEffects:fx,ThreeVFX:pool,VFX3D:{stage}},ThreeVFXEffects:fx,ThreeVFX:pool,VFX3D:{stage},_cvStageFx(){},_cvFitStage(){}});
 assert.deepEqual(calls,['clear','attach','stage']);
});
test('production bulk clear invalidates delayed work before disposing resources',()=>{
 const code=between(source,'    function clearAll() {','    /* ═');const calls=[];const noop=()=>{};
 const ctx={_clearingAll:false,_fxCancelDelays(){calls.push('cancel');},_origClear(){calls.push('dispose');},_getVFXScene:()=>null,
 _active3DGeom:[],_activeThreeMeshes:[],_activeBubbleDomes:[],_sigEntries:[],_fxKillAllTickers:noop,window:{}};
 vm.runInNewContext(code+'clearAll();',ctx);assert.deepEqual(calls,['cancel','dispose']);
});

test('a cue cleared by its own emission cannot adopt the next lifetime',()=>{
 const h=harness();let n=0;h.ctx._cueBatches(500,100,()=>{n++;h.ctx.clearAll();});h.runTimers();assert.equal(n,1);assert.equal(h.timers.size,0);
});
