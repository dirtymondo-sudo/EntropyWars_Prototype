'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const source=fs.readFileSync(process.env.EW_AI_TEST_SOURCE || path.join(__dirname,'ai.js'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'ui.js'),'utf8');
const data=vm.runInContext('({NEXUS_CHANNEL_COST_AP,NEXUS_CAPTURE_THRESHOLD})',require('./load-data').loadGameData());
// Actual engine membership, channel and progress functions. Presentation and
// AP callbacks are controlled, so these are not full browser casts.
const membership=ui.slice(ui.indexOf('        function nexusZoneContains('),ui.indexOf('        function isInNexusZone('));
const tick=ui.slice(ui.indexOf('        function _nexusApplyTicks('),ui.indexOf('        /* Alive, grounded, visible enemies'));
const channel=ui.slice(ui.indexOf('        function channelNexus('),ui.indexOf('        /* STEP-ON TICK'));
function setup(seat=1){
 const unit={id:'u',player:seat,x:4,y:4,z:0,ap:3,hp:100};
 const state={units:[unit],round:12,nexusPoints:{}};
 const ctx={state,window:{},NEXUS_CHANNEL_COST_AP:data.NEXUS_CHANNEL_COST_AP,NEXUS_CAPTURE_THRESHOLD:data.NEXUS_CAPTURE_THRESHOLD,
  console:{log(){},warn(){}},isUnitAirborne:u=>!!u.airborne,unitHasStatus:()=>false,
  _nexusThreshold:()=>data.NEXUS_CAPTURE_THRESHOLD,_nexusZoneCenter:()=>({x:4,y:4}),
  _nexusLabel:k=>k,_nexusFx:()=>{},_nexusCaptureBookkeeping:(n,k,p)=>{n.owner=p;},
  _captureRoamingNexus:p=>{state.roamingNexus.owner=p;},grantXP:()=>{},
  nexusZonesOwnedBy:p=>Object.values(state.nexusPoints).filter(n=>n.owner===p),
  unitDisplayName:()=> 'u',spendAP:(u,n)=>{u.ap-=n;},unitFinished:()=>false};
 for(const k of ['addLog','playErrorSfx','pushUndoSnapshot','_fireNexusVfx3d','showFloatingTextForUnit','endUnitIfDone','renderAfterCombat'])ctx[k]=()=>{};
 vm.createContext(ctx);vm.runInContext(membership+tick+channel,ctx);
 const g={state,getNexusAtUnit:ctx.getNexusAtUnit,isUnitAirborne:ctx.isUnitAirborne,
  canUnitMove:()=>false,canChangeAltitude:()=>({ok:true}),FLYING_ALTITUDE_CONFIG:{apCost:1}};
 ctx.window.GAME=g;
 const end=source.lastIndexOf('})();');
 vm.runInContext(source.slice(0,end)+'window.testAI={scoreNexusChannel};'+source.slice(end),ctx);
 const v={winState:{phase:'even',roundUrgency:0,enemyDeadCount:0},closestEnemyDist:Infinity,visibleEnemies:[]};
 const candidates=()=>{const out=[];ctx.window.testAI.scoreNexusChannel(unit,v,out);return out;};
 const zone=(x=4,y=4,owner=0)=>({zoneX:x,zoneY:y,zoneSize:2,owner,progress:0});
 return {unit,state,ctx,g,candidates,zone,channel:()=>ctx.channelNexus(unit)};
}
for(const seat of [1,2]){
 test(`P${seat}: occupied zone beats an earlier nearby owned zone and actually receives the tick`,()=>{
  const h=setup(seat);h.state.nexusPoints={earth:h.zone(0,4,seat),water:h.zone()};
  assert.equal(h.candidates().filter(c=>c.type==='nexus_channel').length,1);
  h.channel();assert.equal(h.state.nexusPoints.water.progress,seat===1?1:-1);assert.equal(h.unit.ap,2);
  assert.equal(h.state.nexusPoints.earth.progress,0);
 });
 test(`P${seat}: roof above authored Nexus cannot channel`,()=>{
  const h=setup(seat);h.state.nexusPoints.earth={...h.zone(),z:0};h.unit.z=4;
  assert.equal(h.ctx.getNexusAtUnit(h.unit),null);assert.equal(h.candidates().length,0);
  h.channel();assert.equal(h.unit.ap,3);assert.equal(h.state.nexusPoints.earth.progress,0);
 });
 test(`P${seat}: explicit spawn footprint works without square metadata`,()=>{
  const h=setup(seat);h.state.nexusPoints['spawn'+seat]={owner:0,progress:seat===1?3:-3,tiles:[{x:4,y:4}],isSpawn:true};
  assert.equal(h.candidates().length,1);h.channel();assert.equal(h.state.nexusPoints['spawn'+seat].owner,seat);
 });
 test(`P${seat}: roaming-only zone works and captures through the actual roaming branch`,()=>{
  const h=setup(seat);h.state.nexusPoints=null;h.state.roamingNexus={...h.zone(),progress:seat===1?3:-3};
  assert.equal(h.candidates().length,1);h.channel();assert.equal(h.state.roamingNexus.owner,seat);
 });
 test(`P${seat}: friendly roaming zone masks enemy static zone just as channelNexus does`,()=>{
  const h=setup(seat);h.state.nexusPoints.earth=h.zone(4,4,3-seat);h.state.roamingNexus=h.zone(4,4,seat);
  assert.equal(h.candidates().length,0);h.channel();assert.equal(h.unit.ap,3);
 });
 test(`P${seat}: overlapping capturable zones generate one channel, not duplicate promises`,()=>{
  const h=setup(seat);h.state.nexusPoints.earth=h.zone();h.state.roamingNexus=h.zone();
  assert.equal(h.candidates().length,1);h.channel();assert.equal(h.state.nexusPoints.earth.progress,0);
  assert.equal(h.state.roamingNexus.progress,seat===1?1:-1);
 });
}
test('authored membership tolerance and omitted elevation match the engine',()=>{
 const h=setup();h.state.nexusPoints.earth={...h.zone(),z:3};
 for(const [z,allowed] of [[2,true],[3,true],[4,true],[0,false],[undefined,true]]){
  h.unit.z=z;assert.equal(h.candidates().length,allowed?1:0);
 }
});
test('tile-list holes are not zones even when inside the bounding rectangle',()=>{
 const h=setup();h.state.nexusPoints.earth={...h.zone(),tiles:[{x:5,y:5}]};assert.equal(h.candidates().length,0);
});
test('owned zones and insufficient AP do not generate a channel',()=>{
 const h=setup();h.state.nexusPoints.earth=h.zone(4,4,1);assert.equal(h.candidates().length,0);
 h.state.nexusPoints.earth.owner=0;h.unit.ap=0;assert.equal(h.candidates().length,0);
});
test('airborne units still propose landing, never an immediate channel',()=>{
 const h=setup();h.state.nexusPoints.earth=h.zone();h.unit.airborne=true;
 assert.ok(h.candidates().every(c=>c.type==='altitude'));
 h.unit.ap=1;assert.equal(h.candidates().length,0);
});
