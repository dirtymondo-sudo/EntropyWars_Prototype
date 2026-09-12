'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(process.env.EW_AI_TEST_SOURCE||path.join(__dirname,'ai.js'),'utf8');
const stateSource=fs.readFileSync(path.join(__dirname,'state.js'),'utf8');
const ma=stateSource.indexOf('        const MULTIPLAYER_MODES = {');
const mb=stateSource.indexOf('\n        };',ma)+11;
const modes=vm.runInNewContext(stateSource.slice(ma,mb)+'\nMULTIPLAYER_MODES');
function setup(modeId,round,clock,seat=1){
 const unit={id:'self',player:seat,hp:100},enemy={id:'enemy',player:3-seat,hp:100};
 const state={units:[unit,enemy],round,matchClock:clock};
 const g={state,_isFFA:()=>false,enemyOf:p=>3-p,aliveUnitsFor:p=>state.units.filter(u=>u.player===p&&!u.dead)};
 const ctx={window:{GAME:g},getActiveMultiplayerMode:()=>modes[modeId],console:{log(){},warn(){}}};vm.createContext(ctx);
 const end=source.lastIndexOf('})();');vm.runInContext(source.slice(0,end)+'window.assess=assessWinCondition;'+source.slice(end),ctx);
 return {state,assess:()=>ctx.window.assess(unit,null,null)};
}
for(const id of ['tdm','simul'])for(const seat of [1,2]){
 test(`${id} P${seat}: deadline urgency starts before the match ends`,()=>{
  const h=setup(id,1,undefined,seat);assert.equal(h.assess().roundUrgency,0);
  h.state.round=9;assert.equal(h.assess().roundUrgency,1);
  h.state.round=11;assert.equal(h.assess().roundUrgency,2);
  h.state.round=12;assert.equal(h.assess().roundUrgency,3);
  assert.equal(h.assess().roundsRemaining,1);assert.equal(h.assess().roundLimit,12);
 });
}
test('Arena uses its 100-round safety cap, not the old round-40 threshold',()=>{
 const h=setup('arena',40);assert.equal(h.assess().roundUrgency,0);
 h.state.round=75;assert.equal(h.assess().roundUrgency,1);
 h.state.round=90;assert.equal(h.assess().roundUrgency,2);
 h.state.round=100;assert.equal(h.assess().roundUrgency,3);
});
test('custom clock limit overrides mode default and recomputes on each decision',()=>{
 const h=setup('tdm',4,{roundLimit:4});assert.equal(h.assess().roundUrgency,3);
 h.state.matchClock.roundLimit=20;assert.equal(h.assess().roundUrgency,0);
 assert.equal(h.assess().roundsRemaining,17);
});
test('zero clock limit follows the engine mode fallback',()=>{
 const h=setup('tdm',12,{roundLimit:0});assert.equal(h.assess().roundLimit,12);
 assert.equal(h.assess().roundUrgency,3);
});
test('unlimited mode has no artificial late-round urgency',()=>{
 const h=setup('gauntlet',200,{roundLimit:0});assert.equal(h.assess().roundUrgency,0);
 assert.equal(h.assess().roundsRemaining,null);
});
test('sudden death remains urgent after the round limit and has no countdown',()=>{
 const h=setup('tdm',13,{roundLimit:12});h.state.suddenDeathActive=true;
 assert.equal(h.assess().roundUrgency,3);assert.equal(h.assess().roundsRemaining,null);
});
test('expired deadline clamps remaining rounds and single-round matches are urgent',()=>{
 const h=setup('tdm',1,{roundLimit:1});assert.equal(h.assess().roundUrgency,3);
 h.state.round=2;assert.equal(h.assess().roundsRemaining,0);
});
test('deadline pressure cannot fabricate a numerical advantage over a larger team',()=>{
 const h=setup('tdm',12);h.state.units.push({id:'e2',player:2,hp:100},{id:'e3',player:2,hp:100});
 assert.equal(h.assess().roundUrgency,3);assert.equal(h.assess().phase,'numbers_disadvantage');
});
test('equal living teams remain even at the deadline',()=>{
 const h=setup('tdm',12);assert.equal(h.assess().phase,'even');
});
