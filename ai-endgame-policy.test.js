'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(process.env.EW_AI_TEST_SOURCE || path.join(__dirname,'ai.js'),'utf8');
const ss=fs.readFileSync(path.join(__dirname,'state.js'),'utf8');
const ma=ss.indexOf('        const MULTIPLAYER_MODES = {');
const modes=vm.runInNewContext(ss.slice(ma,ss.indexOf('\n        };',ma)+11)+'\nMULTIPLAYER_MODES');
// FFA is a legacy AI branch, absent from the current selectable mode table.
modes.ffa={id:'ffa',isFFA:true,scoringType:'kills',roundLimit:12};
const bs=fs.readFileSync(path.join(__dirname,'battle.js'),'utf8');
const scoreCode=bs.slice(bs.indexOf('        function _getModeScore('),bs.indexOf('        // Suspension belongs'));
function setup(id='tdm',seat=1){
 const unit={id:'u',player:seat,x:1,y:1,z:0,hp:100,maxHp:100,ap:1,mp:100,spells:[],status:{}};
 const enemy={id:'e',player:3-seat,x:4,y:1,z:0,hp:100,maxHp:100,spells:[],status:{}};
 const state={round:12,matchClock:{roundLimit:12},matchKills:{1:0,2:0},matchScores:{1:100,2:0},units:[unit,enemy]};
 const g={state,_isFFA:()=>!!modes[id].isFFA,enemyOf:p=>3-p,
  aliveUnitsFor:p=>state.units.filter(u=>u.player===p&&!u.dead),
  bw:()=>8,bh:()=>8,posKey:(x,y)=>`${x},${y}`,canUnitMove:()=>true,
  getEffectiveRange:()=>1,getEffectiveMove:()=>3,unitHasStatus:()=>false,
  getHeightAt:()=>0,unitCanTraverse:()=>true,canFly:()=>false,
  getUnitJumpClimb:()=>1,isInside:(x,y)=>x>=0&&y>=0&&x<8&&y<8,
  objectBlocksEdge:()=>false,AP_COST_ACTION:1,TargetQuery:{moveTiles:()=>[{x:0,y:1,z:0},{x:2,y:1,z:0}]}};
 const ctx={window:{GAME:g},state,getActiveMultiplayerMode:()=>modes[id],console:{log(){},warn(){}}};vm.createContext(ctx);
 const end=source.lastIndexOf('})();');
 vm.runInContext(source.slice(0,end)+`
   aiHazardPenaltyAt=()=>0; unitThreatOutput=()=>20; getTargetPriority=()=>1;
   estDamage=(g,u,e)=>e.testDamage || 0;
   window.testAI={assessWinCondition,pickMoveGoal,tileDangerCost,killValue,scoreMoves,rankCandidates,
     setVision:(v)=>{buildVision=()=>v;},
     setCandidates:(list)=>{gatherCandidates=()=>list.map(c=>({...c}));}};
 `+source.slice(end)+scoreCode,ctx);
 const ai=ctx.window.testAI;
 const vision=()=>({winState:ai.assessWinCondition(unit,null,null),visibleEnemies:[enemy],allies:[],
  closestEnemy:enemy,closestEnemyDist:3,visibleHourglasses:[],tactical:{shouldEngage:true},
  threatFn:(x)=>({totalDmg:x===0?0:60,count:x===0?0:1})});
 const lead=(n)=>{state.matchKills[seat]=Math.max(0,n);state.matchKills[3-seat]=Math.max(0,-n);};
 return {unit,enemy,state,g,ai,vision,lead,ctx,score:p=>ctx._getModeScore(p,modes[id])};
}
for(const id of ['tdm','simul'])for(const seat of [1,2]){
 test(`${id} P${seat}: score policy follows engine kills, independent of living count and matchScores`,()=>{
  const h=setup(id,seat);
  for(const [lead,policy] of [[2,'protect_lead'],[0,'break_tie'],[-2,'seek_score']]){
   h.lead(lead);const w=h.vision().winState;
   assert.equal(w.myScore,h.score(seat));assert.equal(w.enemyScore,h.score(3-seat));
   assert.equal(w.scoreLead,lead);assert.equal(w.scorePolicy,policy);assert.equal(w.phase,'even');
  }
 });
 test(`${id} P${seat}: same board changes pursuit, exposure and kill value with score`,()=>{
  const h=setup(id,seat);const values=[];
  for(const n of [2,0,-2]){h.lead(n);const v=h.vision();values.push({
   goal:h.ai.pickMoveGoal(h.unit,v).score,
   danger:h.ai.tileDangerCost(h.g,h.unit,v,1,1,0),
   kill:h.ai.killValue(h.g,h.unit,h.enemy,v)});}
  assert.ok(values[0].goal<values[1].goal && values[1].goal<values[2].goal);
  assert.ok(values[0].danger>values[1].danger);assert.equal(values[1].danger,values[2].danger);
  assert.ok(values[0].kill<values[1].kill && values[1].kill<values[2].kill);
 });
 test(`${id} P${seat}: final ranking protects a lead but still takes a valuable available kill`,()=>{
  const h=setup(id,seat);h.lead(0);const v=h.vision();
  const cost=h.ai.tileDangerCost(h.g,h.unit,v,1,1,0);
  h.ai.setCandidates([{type:'attack',target:h.enemy,score:100+cost}, {type:'move',x:0,y:1,z:0,score:100-cost*.3}]);
  assert.equal(h.ai.rankCandidates(h.unit,v).best.type,'attack');
  h.lead(1);assert.equal(h.ai.rankCandidates(h.unit,h.vision()).best.type,'move');
  h.enemy.testDamage=100;
  h.ai.setCandidates([{type:'attack',target:h.enemy,score:500}, {type:'move',x:0,y:1,z:0,score:100}]);
  assert.equal(h.ai.rankCandidates(h.unit,h.vision()).best.type,'attack');
 });
}
test('policy recomputes after a kill, clock edit, and sudden death; early rounds stay neutral',()=>{
 const h=setup();h.lead(2);h.state.round=1;assert.equal(h.vision().winState.scorePolicy,'normal');
 h.state.matchClock.roundLimit=1;assert.equal(h.vision().winState.scorePolicy,'protect_lead');
 h.lead(-1);assert.equal(h.vision().winState.scorePolicy,'seek_score');
 h.state.suddenDeathActive=true;assert.equal(h.vision().winState.scorePolicy,'sudden_death');
 assert.equal(h.vision().winState.roundsRemaining,null);
});
test('Arena and FFA do not acquire a team-kill lead policy',()=>{
 for(const mode of ['arena','ffa']){const h=setup(mode);h.lead(9);assert.equal(h.vision().winState.scorePolicy,'normal');assert.equal(h.vision().winState.myScore,null);}
});
test('Simul and TDM receive the same base kill premium',()=>{
 const a=setup('tdm'),b=setup('simul');a.state.round=1;b.state.round=1;
 assert.equal(a.ai.killValue(a.g,a.unit,a.enemy,a.vision()),b.ai.killValue(b.g,b.unit,b.enemy,b.vision()));
});
test('lead policy never invents an unseen target or a tower/key objective',()=>{
 const h=setup();h.lead(1);const v=h.vision();v.visibleEnemies=[];v.closestEnemy=null;v.closestEnemyDist=Infinity;
 const goal=h.ai.pickMoveGoal(h.unit,v);assert.ok(['tdm_advance','explore'].includes(goal.reason));
 assert.ok(goal.x>=0&&goal.x<8&&goal.y>=0&&goal.y<8);
});
test('score-aware safety move comes from the production reachable-tile candidate generator',()=>{
 const h=setup();h.lead(1);const v=h.vision();v.threatFn=x=>({totalDmg:x===0?0:150,count:x===0?0:1});
 const out=[];h.ai.scoreMoves(h.unit,v,out);assert.ok(out.some(c=>c._safety&&c.x===0));
 assert.ok(out.every(c=>h.g.TargetQuery.moveTiles().some(t=>t.x===c.x&&t.y===c.y)));
});

for(const seat of [1,2])test(`Simul P${seat}: the exported planner uses final danger ranking, not raw candidates`,()=>{
 const h=setup('simul',seat);h.lead(1);const v=h.vision();h.ai.setVision(v);
 const danger=h.ai.tileDangerCost(h.g,h.unit,v,1,1,0);
 h.ai.setCandidates([{type:'attack',target:h.enemy,score:100+danger*.5},{type:'move',x:0,y:1,z:0,score:100}]);
 const c=h.ctx.window._aiPlanCandidates(h.unit);assert.equal(c[0].type,'move');
 assert.ok(Math.abs(c.find(c=>c.type==='attack').score-(100-danger*.5))<1e-9);
 assert.deepEqual({x:h.unit.x,y:h.unit.y,z:h.unit.z},{x:1,y:1,z:0});
});
test('non-Simul planner consumers keep their existing raw-candidate contract',()=>{
 const h=setup('arena');h.ai.setVision(h.vision());
 h.ai.setCandidates([{type:'attack',target:h.enemy,score:101},{type:'move',x:0,y:1,z:0,score:100}]);
 assert.equal(h.ctx.window._aiPlanCandidates(h.unit)[0].score,101);
});
