'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=process.env.EW_TRICK_SOURCE_DIR||__dirname;
const battle=fs.readFileSync(path.join(dir,'battle.js'),'utf8'),src=fs.readFileSync(path.join(dir,'state.js'),'utf8');
const ai=fs.readFileSync(process.env.EW_AI_TEST_SOURCE||path.join(__dirname,'ai.js'),'utf8');
const online=fs.readFileSync(path.join(__dirname,'online.js'),'utf8');
const data=require('./load-data').loadGameData();
function between(s,a,b){const x=s.indexOf(a),y=s.indexOf(b,x+a.length);assert.ok(x>=0&&y>x,a);return s.slice(x,y);}
function setup({seat=1,simul=true,speed=10,enemySpeed=90}={}){
 const spell=data.SPELL_BY_ID.raceTrickRoom;
 const u={id:'self',player:seat,x:2,y:2,z:0,spd:speed,live:speed,hp:300,maxHp:300,ap:2,mp:200,spells:[spell],status:{}};
 const e={id:'enemy',player:3-seat,x:3,y:2,z:0,spd:enemySpeed,live:enemySpeed,hp:300,mp:100,status:{},spells:[]};
 const state={units:[u,e],round:1,_trickRoomRounds:0,_simulInitiative:1};const order=[],logs=[];
 const g={state,unitHasStatus:()=>false,getEffectiveRange:()=>1,getEffectiveMove:()=>2,getEffectiveSpellRange:(u,s)=>s.range,
 TargetQuery:{apCost:()=>1,canAfford:()=>true}};
 const v={allies:[],visibleEnemies:[e]};
 const ctx={window:{GAME:g,_isSimulMode:()=>simul},state,console:{log(){},warn(){}},getEffectiveSpd:u=>u.live,
  getActiveGameMode:()=>({blitzMode:!ctx.unsupported}),getActiveMultiplayerMode:()=>({id:simul?'simul':'tdm',roundLimit:12}),
  engineRandInt:()=>0,unitPassiveValue:()=>false,unitDisplayName:u=>u.id,addLog:s=>logs.push(s),
  _noteProgress(){},_updatePill(){},_execPlanEntry:(e,done)=>{if(e.unit)order.push(e.player);ctx.onEntry?.();done();},_finishSimulTurn(){}};
 vm.createContext(ctx);vm.runInContext('let _blitzTurnOrder=[],_blitzTurnIndex=0;'+between(src,'        function buildBlitzTurnOrder()','        function rebuildBlitzTurnOrderFromIds()'),ctx);
 vm.runInContext(between(battle,'            function _stepPriority(','            function _execPlanEntry('),ctx);
 const end=ai.lastIndexOf('})();');vm.runInContext(ai.slice(0,end)+'unitThreatOutput=()=>100;window.probe={scoreSpell,scoreSpells,findSpellTarget};'+ai.slice(end),ctx);
 function build(){ctx.buildBlitzTurnOrder();}
 function resolve(steps=[[{type:'attack'}],[{type:'attack'}]]){
  order.length=0;state._simulPlans=Object.fromEntries(state.units.map((u,i)=>[u.player,{unitId:u.id,steps:steps[i]}]));ctx._resolvePlans();return [...order];
 }
 return {spell,u,e,state,g,v,ctx,logs,build,resolve,score:()=>ctx.window.probe.scoreSpell(u,spell,u,v),
  candidates:()=>{const out=[];ctx.window.probe.scoreSpells(u,v,out);return out;}};
}
for(const seat of [1,2])test(`P${seat}: reversal owns exactly three future rounds including zero-counter last round`,()=>{
 const h=setup({seat});h.build();h.state._trickRoomRounds=3;assert.equal(h.resolve()[0],3-seat);
 for(let left=2;left>=0;left--){h.state.round++;h.build();assert.equal(h.state._trickRoomRounds,left);assert.equal(h.resolve()[0],seat);
  h.build();assert.equal(h.state._trickRoomRounds,left);assert.equal(h.resolve()[0],seat);}
 h.state.round++;h.build();assert.equal(h.resolve()[0],3-seat);assert.equal(h.state._trickRoomOrderReversed,false);
});
test('recast during an active round extends future duration without changing owned order',()=>{
 const h=setup();h.state._trickRoomRounds=1;h.build();assert.equal(h.state._trickRoomRounds,0);h.state._trickRoomRounds=3;
 assert.equal(h.resolve()[0],1);h.build();assert.equal(h.state._trickRoomRounds,3);
 h.state.round++;h.build();assert.equal(h.state._trickRoomRounds,2);assert.equal(h.resolve()[0],1);
});
test('stale snapshot never reverses a different round',()=>{
 const h=setup();h.state._trickRoomOrderRound=0;h.state._trickRoomOrderReversed=true;assert.equal(h.resolve()[0],2);
});
test('Trick Room preserves plan priority, effective speed ties and initiative',()=>{
 const h=setup();h.state._trickRoomRounds=3;h.build();assert.equal(h.resolve([[{type:'attack'}],[{type:'guard'}]])[0],2);
 h.u.live=h.e.live;for(const p of [1,2]){h.state._simulInitiative=p;assert.equal(h.resolve()[0],p);}
});
test('mid-resolution cast/speed mutations do not reorder locked entries',()=>{
 const h=setup();h.build();h.ctx.onEntry=()=>{h.state._trickRoomRounds=3;h.u.live=200;};assert.deepEqual(h.resolve(),[2,1]);
});
for(const name of ['randomizeParty','prepareBattleStateFromCurrentBuilds','resetGame','applyPartyBuild'])test(`${name} clears owned reversal even when next match reuses round number`,()=>{
 const h=setup();h.state._trickRoomRounds=3;h.build();const fn=between(battle,`        function ${name}(`,'\n        function ');
 vm.runInContext(between(fn,'            state.bombs = [];','            state._deployedObjects = [];'),h.ctx);
 assert.equal(h.state._trickRoomOrderReversed,false);assert.equal(h.state._trickRoomOrderRound,null);h.build();assert.equal(h.resolve()[0],2);
});
test('host snapshots carry round owner, active reversal and cleared state',()=>{
 const h=setup();h.ctx.window._gameState=h.state;h.state._trickRoomRounds=1;h.build();
 vm.runInContext(between(online,'            function _serializeState()','\n            function '),h.ctx);
 const out=h.ctx._serializeState();assert.equal(out._trickRoomOrderRound,1);assert.equal(out._trickRoomOrderReversed,true);assert.equal(out._trickRoomRounds,0);
 h.state.round++;h.build();assert.equal(h.ctx._serializeState()._trickRoomOrderReversed,false);
});
for(const seat of [1,2])for(const simul of [false,true])test(`P${seat} ${simul?'Simul':'Blitz'}: slow team gets concrete self target; fast team rejects harmful reversal`,()=>{
 const h=setup({seat,simul});h.build();assert.ok(h.score()>0);assert.equal(h.candidates()[0].target,h.u);
 h.u.live=100;assert.ok(h.score()<0);assert.equal(h.candidates().length,0);h.u.live=h.e.live;assert.equal(h.score(),0);
});
test('Trick Room counts marginal future duration, deadline, unlimited and sudden death correctly',()=>{
 const h=setup();h.build();const full=h.score();assert.ok(full>0);h.state._trickRoomRounds=3;assert.equal(h.score(),0);
 h.state._trickRoomRounds=2;assert.equal(h.score(),full/3);h.state._trickRoomRounds=0;h.state.round=12;assert.equal(h.score(),0);
 h.state.suddenDeathActive=true;assert.equal(h.score(),full);h.state.suddenDeathActive=false;h.state.matchClock={roundLimit:4};h.state.round=3;assert.equal(h.score(),full/3);
});
test('Simul values one selected pair rather than multiplying bench size; Blitz values every ally',()=>{
 const h=setup(),one=h.score();h.v.allies.push({...h.u,id:'other'});assert.equal(h.score(),one);
 const b=setup({simul:false}),base=b.score();b.v.allies.push({...b.u,id:'other'});assert.equal(b.score(),base*2);
});
test('unseen/far enemies and unsupported turn mode get no speculative order value',()=>{
 const h=setup({simul:false});h.v.visibleEnemies=[];assert.equal(h.score(),0);h.v.visibleEnemies=[h.e];h.e.x=30;assert.equal(h.score(),0);
 h.e.x=3;h.ctx.unsupported=true;assert.equal(h.score(),0);
});
test('MP and AP opportunity cost still gate Trick Room candidate admission',()=>{
 const h=setup();h.u.mp=0;assert.equal(h.candidates().length,0);h.u.mp=200;h.u.ap=0;assert.equal(h.candidates().length,0);
});
