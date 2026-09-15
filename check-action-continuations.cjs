'use strict';
// Diagnostic: asserts current defective behavior, not a safety regression.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=fs.existsSync(path.join(__dirname,'battle.js'))?__dirname:path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'battle.js'),'utf8');
function extract(name){const start=src.indexOf('        function '+name+'(');assert.ok(start>=0);const end=src.indexOf('\n        }',start);assert.ok(end>start);return src.slice(start,end+10);}
function setup(player){
 const actor={id:'old',player,ap:2,x:0,y:0,z:0};
 const state={phase:'battle',units:[actor],_actionExecuting:false};const timers=[],calls=[];
 const c={state,window:{},console,Map,setTimeout:(fn,ms)=>{const t={fn,ms};timers.push(t);return t;},clearTimeout:t=>{if(t)t.cancelled=true;},doMove:(u,x,y,z)=>{calls.push(['move',u.id]);Object.assign(u,{x,y,z});return 450;},doAttack:()=>0};
 for(const n of ['_clearSpellApproachPreview','_clearMoveHoverPreview','clearAoePreview','clearHoveredTarget','clearSpellRangePreview','clearAttackRangePreview','scheduleBoardRender','markDirty','renderIfDirty'])c[n]=()=>{};
 vm.createContext(c);vm.runInContext(['_moveThenAttack','_moveTowards'].map(extract).join('\n'),c);
 const replace=()=>{state.units=[{id:'new',player}];state.actionMode='spell';state.selectedTool='new-spell';state._actionExecuting=true;};
 return {c,state,actor,timers,calls,replace};
}
let count=0;
for(const player of [1,2]){
 for(const stale of [false,true]){
  const h=setup(player);h.c._moveThenAttack(h.actor,{x:1,y:0,z:0},2,0,0);
  if(stale)h.replace();
  h.timers.shift().fn();
  assert.equal(h.state.actionMode,'attack');assert.equal(h.state.selectedTool,null);assert.equal(h.state._actionExecuting,false);
  console.log(JSON.stringify({player,case:'refused strike',stale,mode:h.state.actionMode,executing:h.state._actionExecuting}));count++;
 }
 {
  const h=setup(player);h.c.doAttack=()=>100;h.c._moveThenAttack(h.actor,{x:1,y:0,z:0},2,0,0);h.timers.shift().fn();
  const watchdog=h.timers.shift();assert.equal(watchdog.ms,8000);
  // First action completes; another action takes the shared latch before its old watchdog expires.
  h.state._actionExecuting=false;h.replace();watchdog.fn();assert.equal(h.state._actionExecuting,false);
  console.log(JSON.stringify({player,case:'old attack watchdog unlocks new action',executing:h.state._actionExecuting}));count++;
 }
 for(const via of [false,true]){
  const h=setup(player);h.c._moveTowards(h.actor,{x:2,y:0,z:0,...(via?{via:{x:1,y:0,z:0}}:{})});h.replace();h.timers.shift().fn();
  if(via){assert.equal(h.calls.length,2);assert.equal(h.calls[1][1],'old');h.timers.shift().fn();}
  assert.equal(h.state._actionExecuting,false);
  console.log(JSON.stringify({player,case:'stale move finish',via,moves:h.calls.length,executing:h.state._actionExecuting}));count++;
 }
}
console.log(count+' diagnostic cases confirmed. Movement, attack result and timers are controlled; production continuation bodies run unchanged. No damage or browser/network acceptance claim.');
