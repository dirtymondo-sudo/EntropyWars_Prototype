'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=fs.existsSync(path.join(__dirname,'battle.js'))?__dirname:path.join(__dirname,'..');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const battle=read('battle.js'),ss=read('state.js'),ai=fs.readFileSync(process.env.EW_AI_TEST_SOURCE || path.join(root,'ai.js'),'utf8');
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

for (const player of [1,2]) for (const changed of [false,true]) {
 const h=setup(player); const {c,state,unit}=h; state.phase='battle';
 for(const n of ['_clearSpellApproachPreview','clearAoePreview','clearHoveredTarget','clearSpellRangePreview','clearAttackRangePreview','scheduleBoardRender','markDirty','renderIfDirty'])c[n]=()=>{};
 c.clearTimeout=()=>{};c.doMove=(u,x,y,z)=>{u.x=x;u.y=y;u.z=z;u.ap--;return 450;};
 vm.runInContext(fn(battle,'_moveThenInspect'),c);
 c._moveThenInspect(unit,{x:3,y:2,z:0},4,2);
 if(changed){state.phase='menu';state.units=[{id:'new',player,x:0,y:0,ap:2}];state.actionMode='new-menu';}
 h.key(4,2);const key=state.hourglasses[0];
 h.timers.shift().f();
 assert.equal(key.carriedBy,unit.id);assert.equal(unit.ap,0);
 if(changed)assert.equal(state.units.some(u=>u.id===key.carriedBy),false);
 console.log(JSON.stringify({player,changed,phase:state.phase,carrier:key.carriedBy,carrierExists:state.units.some(u=>u.id===key.carriedBy),oldActorAP:unit.ap,actionMode:state.actionMode}));
}
