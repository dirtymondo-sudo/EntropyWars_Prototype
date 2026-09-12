'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(process.env.EW_BATTLE_TEST_SOURCE||path.join(__dirname,'battle.js'),'utf8');
const a=src.indexOf('            function _stepPriority('),b=src.indexOf('            function _execPlanEntry(',a);
function run({speeds=[10,90],live=[100,5],steps=[[{type:'attack'}],[{type:'attack'}]],initiative=1,mutate=false}={}){
 const units=speeds.map((spd,i)=>({id:'u'+i,player:i+1,spd,live:live[i]}));
 const state={units,_simulInitiative:initiative,_simulPlans:Object.fromEntries(units.map((u,i)=>[u.player,{unitId:u.id,steps:steps[i]}]))};
 const logs=[],order=[];let finish=0,calls=0;
 const ctx={state,_noteProgress(){},_updatePill(){},getEffectiveSpd:u=>{calls++;return u.live;},unitDisplayName:u=>u.id,
  addLog:s=>logs.push(s),_execPlanEntry:(e,done)=>{order.push(e.player);if(mutate)units[1].live=999;done();},_finishSimulTurn:()=>finish++};
 vm.runInNewContext(src.slice(a,b)+'_resolvePlans()',ctx);return {order,logs,finish,calls,units};
}
test('effective speed reverses base-speed result for both player seats',()=>{
 assert.deepEqual(run().order,[1,2]);assert.deepEqual(run({live:[5,100],speeds:[90,10]}).order,[2,1]);
});
test('effective-speed tie uses initiative despite unequal base speed',()=>{
 for(const initiative of [1,2]){const h=run({live:[50,50],initiative});assert.equal(h.order[0],initiative);assert.match(h.logs[1],/initiative/);}
});
test('equal base speed uses changed effective speed and truthful explanation',()=>{
 const h=run({speeds:[20,20],live:[60,10],initiative:2});assert.equal(h.order[0],1);assert.match(h.logs[1],/speed/);
 assert.match(h.logs[0],/SPD 60/);assert.match(h.logs[0],/SPD 10/);
});
test('stationary defensive priority still outranks speed',()=>{
 const h=run({steps:[[{type:'attack'}],[{type:'guard'}]]});assert.deepEqual(h.order,[2,1]);assert.match(h.logs[1],/priority/);
});
test('mixing movement into a guard order forfeits defensive priority',()=>{
 assert.deepEqual(run({steps:[[{type:'attack'}],[{type:'guard'},{type:'move'}]]}).order,[1,2]);
});
test('speed is snapshotted once per entry and later effects do not reorder committed plans',()=>{
 const h=run({mutate:true});assert.deepEqual(h.order,[1,2]);assert.equal(h.calls,2);assert.equal(h.finish,1);
 assert.deepEqual(h.units.map(u=>u.spd),[10,90]);
});
