'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
const battle=read('battle.js'),ss=read('state.js'),ai=fs.readFileSync(process.env.EW_AI_TEST_SOURCE || path.join(__dirname,'ai.js'),'utf8');
function fn(s,n){const a=s.indexOf('        function '+n+'('),line=s.indexOf('\n',a);assert.ok(a>=0,n);return s.slice(a,s.slice(a,line).trimEnd().endsWith('}')?line:s.indexOf('\n        }',line)+10);}
const ma=ss.indexOf('        const MULTIPLAYER_MODES = {');const modes=vm.runInNewContext(ss.slice(ma,ss.indexOf('\n        };',ma)+11)+'\nMULTIPLAYER_MODES');
function setup(player=1){
 const unit={id:'u',player,x:2,y:2,z:0,hp:100,maxHp:100,ap:2,awr:14,inspect:2,hourglasses:0,status:{}};
 const ally={id:'a',player,x:0,y:0,hp:100,hourglasses:99};
 const enemy={id:'e',player:3-player,x:7,y:7,hp:100,maxHp:100,hourglasses:99};
 const state={units:[unit,ally,enemy],hourglasses:[],hourglassTarget:99,bombs:[],round:1,scannedByPlayer:{1:new Set(),2:new Set()},hourglassBuffs:{1:0,2:0}};
 let mode=modes.arena;const blocked=new Set(),timers=[];
 const c={state,window:{},CONFIG:{winHourglasses:5},AP_COST_ACTION:1,XP_INSPECT:1,XP_COLLECT_HOURGLASS:1,HOURGLASS_POWER_PER_LEVEL:1,ENTROPY_PTS:{hourglass:1},
  bw:()=>8,bh:()=>8,getActiveMultiplayerMode:()=>mode,getEffectiveAwr:u=>u.awr,
  isRangeBlockedByTerrain:(x,y,tx,ty)=>blocked.has(`${tx},${ty}`),
  getViewerPlayer:()=>player,unitDisplayName:()=>'',coordLabel:()=>'',getWideZoom:()=>1,
  _benchOn:()=>!!state.reserves,_isFFA:()=>false,scanKey:(x,y)=>`${x},${y}`,
  unitFinished:u=>u.ap<=0,spendAP:(u,n)=>{u.ap-=n;},
  setTimeout:(f,n)=>{timers.push({f,n});},console:{log(){},warn(){}}};
 c.window.setTimeout=c.setTimeout;
 for(const n of ['addLog','pushUndoSnapshot','playErrorSfx','showFloatingTextForUnit','grantXP','addEntropy','playKeySecuredFx','showCombatBanner','playSfx','shakeBoard','focusBoardCameraOnTiles','renderBattleUpdate','endUnitIfDone'])c[n]=()=>{};
 vm.createContext(c);
 vm.runInContext(['getEffectiveInspect','getInspectTileCount'].map(n=>fn(ss,n)).join('\n')+'\n'+
  ['canUnitAct','getInspectFootprint','getInspectTiles','getArenaKeyRules','getKeysToWin','doInspect','unitHomePlayer','_gauntletReserves','_gauntletReservesAlive','getTeamWipeoutCount','checkWin'].map(n=>fn(battle,n)).join('\n'),c);
 const g={state,bw:c.bw,bh:c.bh,AP_COST_ACTION:1,enemyOf:p=>3-p,_isFFA:()=>false,aliveUnitsFor:p=>state.units.filter(u=>u.player===p&&!u.dead),
  scanKey:c.scanKey,getInspectTiles:c.getInspectTiles,getInspectFootprint:c.getInspectFootprint,getKeysToWin:c.getKeysToWin,canUnitAct:c.canUnitAct};
 c.window.GAME=g;
 const end=ai.lastIndexOf('})();');
 vm.runInContext(ai.slice(0,end)+`
   tileDangerCost=()=>10000; estDamage=()=>200; countPriorUses=()=>0; countPriorTargeting=()=>0;
   window.testAI={scoreInspect,rankCandidates,assessWinCondition,
      choose:(u,v,other=[])=>{gatherCandidates=(u,v)=>{const out=other.map(c=>({...c}));scoreInspect(u,v,out);return out;};return rankCandidates(u,v);}};
 `+ai.slice(end),c);
 const vision=()=>({visibleEnemies:[enemy],winState:c.window.testAI.assessWinCondition(unit,null,null)});
 const key=(x,y,carrier=null,visible=true)=>{state.hourglasses.push({id:'k'+state.hourglasses.length,x,y,carriedBy:carrier,visibleTo:{1:visible,2:visible}});};
 const held=(who,n)=>{for(let i=0;i<n;i++)key(7,i,who.id);};
 const choices=()=>{const out=[];c.window.testAI.scoreInspect(unit,vision(),out);return out;};
 return {unit,ally,enemy,state,c,g,blocked,key,held,choices,vision,choose:(other)=>c.window.testAI.choose(unit,vision(),other),mode:m=>{mode=m;},timers};
}
for(const player of [1,2])test(`seat ${player}: winning scan beats attack and actually wins`,()=>{
 const h=setup(player);h.held(h.ally,2);h.key(1,1);h.key(7,6);h.key(7,5);
 const r=h.choose([{type:'attack',target:h.enemy,score:200000,_noDanger:true}]);
 assert.equal(r.best.type,'inspect');assert.equal(r.best._objectiveWin,true);assert.equal(r.best.x,1);assert.equal(r.best.y,1);
 const before=h.unit.ap;h.c.doInspect(h.unit,r.best.x,r.best.y);
 assert.equal(h.state.winner,player);assert.equal(h.state._winCondition,'hourglasses_collected');assert.equal(h.unit.ap,before-1);
});
test('already scanned tile with a dropped visible Key remains collectible',()=>{
 const h=setup();h.held(h.ally,2);h.key(0,2);h.key(7,6);h.key(7,5);h.state.scannedByPlayer[1].add('0,2');
 const r=h.choose();assert.equal(r.best._objectiveWin,true);assert.equal(r.best.x,0);assert.equal(r.best.y,2);
});
test('scan footprint covers neighbours only when AWR includes them',()=>{
 const h=setup();h.unit.awr=42;h.held(h.ally,1);h.key(1,1);h.key(1,0);h.key(7,5);h.key(7,6);
 const c=h.choices().find(c=>c.x===1&&c.y===1);assert.equal(c._keyPickup,2);assert.equal(c._objectiveWin,true);
 h.unit.awr=14;const narrow=h.choices().find(c=>c.x===1&&c.y===1);assert.equal(narrow._keyPickup,1);assert.equal(narrow._objectiveWin,false);
});
test('hidden keys do not enter projected pickup or win counts',()=>{
 const h=setup();h.held(h.ally,2);h.key(1,1,null,false);h.key(7,5);h.key(7,6);
 assert.equal(h.choices().some(c=>c._objectiveWin),false);assert.equal(h.choices().some(c=>c.x===1&&c.y===1&&c._keyPickup),false);
});
test('blocked scan cannot become an objective candidate',()=>{
 const h=setup();h.held(h.ally,2);h.key(1,1);h.key(7,5);h.key(7,6);h.blocked.add('1,1');
 assert.equal(h.choices().some(c=>c._objectiveWin),false);
});
test('AP gates scan candidates',()=>{const h=setup();h.held(h.ally,2);h.key(1,1);h.unit.ap=0;assert.equal(h.choices().length,0);});
test('enemy one-away gets pickup denial value, not an invented win',()=>{
 const h=setup();h.held(h.enemy,2);h.key(1,1);h.key(7,5);h.key(7,6);
 const c=h.choices().find(c=>c._keyPickup);assert.equal(c._objectiveWin,false);assert.equal(c.score,340);
});
test('sudden death: one revealed Key is enough',()=>{
 const h=setup();h.state.suddenDeathActive=true;h.key(1,1);h.key(7,5);h.key(7,6);
 const r=h.choose();assert.equal(r.best._objectiveWin,true);h.c.doInspect(h.unit,r.best.x,r.best.y);assert.equal(h.state.winner,1);assert.equal(h.state._winCondition,'sudden_death');
});
test('held-key and threshold reads match registry rather than unit counters or spawn metadata',()=>{
 const h=setup();h.held(h.ally,2);h.held(h.enemy,1);h.key(7,5);h.key(7,6);
 const w=h.vision().winState;assert.equal(w.myHG,2);assert.equal(w.enemyHG,1);assert.equal(w.hgTarget,h.c.getKeysToWin());assert.equal(w.hgTarget,3);
});
test('reduced pool uses live threshold',()=>{const h=setup();h.held(h.ally,1);h.key(1,1);assert.equal(h.vision().winState.hgTarget,2);assert.equal(h.choose().best._objectiveWin,true);});
test('empty key pool has no near-win phase',()=>{const h=setup();const w=h.vision().winState;assert.equal(w.hgTarget,0);assert.ok(!w.phase.startsWith('hg_'));});
test('non-Arena scans do not claim an Arena win',()=>{const h=setup();h.mode(modes.tdm);h.held(h.ally,2);h.key(1,1);assert.equal(h.choices().some(c=>c._objectiveWin),false);});
test('tutorial scans do not claim a match win',()=>{const h=setup();h.c.window._tutActive=true;h.held(h.ally,2);h.key(1,1);assert.equal(h.choices().some(c=>c._objectiveWin),false);});
test('living reserves do not prevent an actual Key victory',()=>{
 const h=setup();h.state.reserves=true;h.state.bench={2:[{id:'reserve',player:2,hp:100}]};h.held(h.ally,2);h.key(1,1);h.key(7,5);h.key(7,6);
 const r=h.choose();h.c.doInspect(h.unit,r.best.x,r.best.y);assert.equal(h.state.winner,1);assert.equal(h.state._winCondition,'hourglasses_collected');
});
test('projecting scans never collects keys, spends AP or schedules callbacks',()=>{
 const h=setup();h.held(h.ally,2);h.key(1,1);h.key(7,5);h.key(7,6);const before=JSON.stringify(h.state);
 const one=h.choices(),two=h.choices();assert.equal(JSON.stringify(one),JSON.stringify(two));assert.equal(JSON.stringify(h.state),before);assert.equal(h.timers.length,0);
});
test('dying actor cannot advertise a winning scan',()=>{const h=setup();h.held(h.ally,2);h.key(1,1);h.unit._dying=true;assert.equal(h.choices().length,0);});
test('already destroyed Cube does not create a competing Key-win claim',()=>{const h=setup();h.held(h.ally,2);h.key(1,1);h.state.towers={1:{hp:0},2:{hp:100}};assert.equal(h.choices().some(c=>c._objectiveWin),false);});
test('ordinary candidates retain danger and kill ranking without a winning scan',()=>{
 const h=setup();const r=h.choose([{type:'attack',target:h.enemy,score:20000},{type:'move',x:1,y:2,score:22000}]);
 assert.equal(r.best.type,'attack');assert.equal(r.best.score,10000);
});
test('Easy difficulty pool retains only projected winners when one exists',()=>{
 const start=ai.indexOf('        // Easy CPU: sample softmax-randomly');const end=ai.indexOf('        // ── fallbacks:',start);
 const code=ai.slice(start,end)+'\nselected=best;';
 const win={type:'inspect',score:180,_objectiveWin:true},attack={type:'attack',score:1000000};
 const ctx={best:win,candidates:[win,attack],g:{engineRng:()=>0.999},_aiDiff:()=>({pickTopN:3,softmaxT:1000000})};
 vm.runInNewContext(code,ctx);assert.equal(ctx.selected,win);
});
test('automatic reserve retreat yields to a projected Key win',()=>{
 const start=ai.indexOf('        // Gauntlet: a badly-hurt unit retreats');const end=ai.indexOf('\n\n        if (window.EW_AI_DEBUG)',start);
 const block=ai.slice(start,end);let switched=0;
 const ctx={best:{_objectiveWin:true},unit:{_aiLoopCount:1,ap:2,hp:10,maxHp:100,player:1},
  window:{_benchOn:()=>true,_isReservesMatch:()=>true,_switchesLeft:()=>1,_gauntletReserves:()=>[{id:'r',hp:100,maxHp:100}],doSwitch:()=>{switched++;return true;}},g:{finishComputerAction:()=>{}}};
 vm.runInNewContext('(function(){'+block+'})()',ctx);assert.equal(switched,0);
 ctx.best={type:'attack'};vm.runInNewContext('(function(){'+block+'})()',ctx);assert.equal(switched,1);
});

for (const player of [1, 2]) test(`seat ${player}: stolen Key can be dropped, rescanned and counted toward victory`, () => {
 const h = setup(player);
 h.held(h.ally, 2); h.held(h.enemy, 1); h.key(7,5); h.key(7,6);
 h.enemy.hourglasses = 1; h.enemy.hourglassBuff = 1;
 h.state.hourglassBuffs[h.enemy.player] = 1;
 vm.runInContext(fn(battle, 'moveHourglassesBetweenUnits') + '\n' + fn(battle, '_stealFromUnit') + '\n' + fn(read('map.js'), 'dropHourglassesFromUnit'), h.c);
 assert.equal(h.c._stealFromUnit(h.unit, h.enemy, {keys:1, items:0}).keys, 1);
 assert.equal(h.state.hourglasses.filter(k => k.carriedBy === h.unit.id).length, 1);
 h.c.dropHourglassesFromUnit(h.unit);
 assert.equal(h.state.hourglassBuffs[player], 0);
 assert.equal(h.unit.hourglasses, 0);
 h.c.doInspect(h.unit, h.unit.x, h.unit.y);
 assert.equal(h.unit.hourglasses, 1);
 assert.equal(h.unit.hourglassBuff, 1);
 assert.equal(h.state.hourglassBuffs[player], 1);
 assert.equal(h.state.winner, player);
 assert.equal(h.state._winCondition, 'hourglasses_collected');
});
