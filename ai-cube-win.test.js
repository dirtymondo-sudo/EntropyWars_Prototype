'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');const battle=read('battle.js'),ui=read('ui.js'),ss=read('state.js');
const ai=fs.readFileSync(process.env.EW_AI_TEST_SOURCE || path.join(__dirname,'ai.js'),'utf8');
const win=fs.readFileSync(process.env.EW_CUBE_WIN_SOURCE || path.join(__dirname,'battle.js'),'utf8');
const attack=fs.readFileSync(process.env.EW_CUBE_ATTACK_SOURCE || path.join(__dirname,'battle.js'),'utf8');
function fn(s,n){const a=s.indexOf('        function '+n+'('),line=s.indexOf('\n',a);assert.ok(a>=0,n);return s.slice(a,s.slice(a,line).trimEnd().endsWith('}')?line:s.indexOf('\n        }',line)+10);}
const ma=ss.indexOf('        const MULTIPLAYER_MODES = {');const modes=vm.runInNewContext(ss.slice(ma,ss.indexOf('\n        };',ma)+11)+'\nMULTIPLAYER_MODES');
function setup(player=1){
 const unit={id:'u',player,x:1,y:1,z:0,ap:2,hp:100,maxHp:100,atk:100,status:{}};
 const enemy={id:'e',player:3-player,x:7,y:7,hp:100,maxHp:100,status:{}};
 const tw={owner:3-player,x:2,y:1,hp:100,maxHp:1000,def:5};
 const state={units:[unit,enemy],towers:{[player]:{owner:player,x:0,y:0,hp:1000,maxHp:1000},[3-player]:tw},cameraDisabled:true,round:1,hourglasses:[],nexusPoints:{}};
 let mode=modes.arena,blocked=false,visible=true,range=1,z=0,roll=0,scale=2;
 const c={state,window:{},console:{log(){},warn(){}},AP_COST_ACTION:1,SPELL_DMG_VARIANCE:16,
 STATUS_DEFS:{stun:{blockAction:true}},CONFIG:{winHourglasses:5},XP_TOWER_DAMAGE_FLAT:1,ENTROPY_PTS:{destructTerrain:1},
 pwrAtk:u=>u.atk,getEffectiveAttackBonus:()=>0,getHourglassPower:()=>0,getUnitLevel:u=>{u._lvlCache=100;return 100;},offenseScale:()=>scale,
 getActiveMultiplayerMode:()=>mode,_isFFA:()=>!!mode.isFFA,_benchOn:()=>!!state.reserves,
 getHeightAt:()=>z,getEffectiveRange:()=>range,combatDist:(x,y,z,tx,ty,tz)=>Math.abs(x-tx)+Math.abs(y-ty)+Math.abs(z-tz),
 isRangeBlockedByTerrain:()=>blocked,isInVision:()=>visible,
 resolveUnitInColumn:()=>null,_structureAt:()=>tw,_tileIsSmashable:()=>false,unitHasTelescope:()=>false,getTauntTargeter:()=>null,
 towerAt:()=>tw,_unitAttacksWithClip:()=>false,randInt:()=>roll+16,spendAllAP:u=>{u.ap=0;},
 unitDisplayName:()=>'',setTimeout:()=>{},endUnitIfDone:()=>{},renderAfterCombat:()=>{}};
 for(const n of ['_imitObserve','clearAllTargetingVisuals','_focusPlatesForImpact','pushUndoSnapshot','setUnitFacing','animateStrikeLeap','addLog','grantXP','addEntropy','playSfx','showFloatingTextAtTile','playErrorSfx'])c[n]=()=>{};
 vm.createContext(c);vm.runInContext(['_nexusZoneList','getCubeDamageMult'].map(n=>fn(ui,n)).join('\n')+'\n'+
 ['canUnitAct','ensureUnitStatus','getStatusValue','getActiveStatusKeys','getCubeAttackDamage','getCubeAttackForecast','unitHomePlayer','_gauntletReserves','_gauntletReservesAlive','getTeamWipeoutCount','getArenaKeyRules','getKeysToWin','checkWin','checkWinConditionOnly'].map(n=>fn(['checkWin','checkWinConditionOnly'].includes(n)?win:battle,n)).join('\n')+'\n'+fn(attack,'doAttack'),c);
 const g={state,AP_COST_ACTION:1,getCubeAttackForecast:c.getCubeAttackForecast,enemyOf:p=>3-p,getEffectiveAttackBonus:()=>0,getHourglassPower:()=>0,isRangeBlockedByTerrain:()=>blocked};c.window.GAME=g;
 const end=ai.lastIndexOf('})();');vm.runInContext(ai.slice(0,end)+`
 tileDangerCost=()=>100000;estDamage=()=>200;
 window.testAI={scoreTowerAttack,rankCandidates,choose:(u,v)=>{gatherCandidates=(u,v)=>{const out=[{type:'attack',target:v.visibleEnemies[0],score:1000000,_noDanger:true}];scoreTowerAttack(u,v,out);return out;};return rankCandidates(u,v);}};
 `+ai.slice(end),c);
 const v={enemyTower:tw,visibleEnemies:[enemy],effRange:1,winState:{enemyDeadCount:0,enemyMinRespawn:0,enemyImminentRespawns:0,phase:'even',roundUrgency:0}};
 return {unit,enemy,tw,state,c,g,v,forecast:()=>c.getCubeAttackForecast(unit,tw),choose:()=>c.window.testAI.choose(unit,v),mode:m=>mode=m,
 set:o=>{if(o.blocked!=null)blocked=o.blocked;if(o.visible!=null)visible=o.visible;if(o.range!=null){range=o.range;v.effRange=range;}if(o.z!=null)z=o.z;if(o.roll!=null)roll=o.roll;if(o.scale!=null)scale=o.scale;}};
}
for(const player of [1,2])test(`P${player} minimum Cube roll is a winning action and beats ordinary kill`,()=>{
 const h=setup(player);h.tw.hp=88;const f=h.forecast();assert.equal(f.min,93);assert.equal(f.typical,125);assert.equal(f.max,157);assert.equal(f.wins,true);
 const r=h.choose();assert.equal(r.best.type,'attack_tower');assert.equal(r.best._objectiveWin,true);
 h.set({roll:-16});assert.equal(h.c.doAttack(h.unit,h.tw.x,h.tw.y),93);assert.equal(h.state.winner,player);assert.equal(h.state._winCondition,'tower_destroyed');
});
for(const roll of [-16,0,16])test(`exact Cube arithmetic matches actual attack at roll ${roll}`,()=>{
 const h=setup();h.tw.hp=1000;h.set({roll});const f=h.forecast();const damage=h.c.doAttack(h.unit,2,1);assert.equal(damage,roll<0?f.min:roll>0?f.max:f.typical);assert.equal(h.tw.hp,1000-damage);
});
test('neutral-roll lethal is not a guaranteed finishing hit',()=>{const h=setup();h.tw.hp=100;const f=h.forecast();assert.ok(f.typical>=h.tw.hp);assert.equal(f.lethal,false);assert.equal(h.choose().best.type,'attack');});
test('Nexus siege uses real zone ownership, excluding home spawn and respecting cap',()=>{
 const h=setup();h.tw.hp=140;h.state.nexusPoints={spawn1:{owner:1,zoneSize:2}};assert.equal(h.forecast().min,93);
 h.state.nexusPoints.middle={owner:1,zoneSize:2};assert.equal(h.forecast().min,140);assert.equal(h.forecast().wins,true);
 h.state.nexusPoints.spawn2={owner:1,zoneSize:2};h.state.nexusPoints.extra={owner:1,zoneSize:2};assert.equal(h.forecast().min,186);
});
test('high Cube defence and base floor remain in engine order',()=>{const h=setup();h.unit.atk=1;h.tw.def=100;assert.equal(h.forecast().min,1);assert.equal(h.forecast().max,1);h.tw.hp=2;assert.equal(h.forecast().wins,false);});
for(const state of ['noAP','dying','stun','blocked','range','occupied','friendly'])test(`${state} Cube action cannot claim a win`,()=>{
 const h=setup();h.tw.hp=1;
 if(state==='noAP')h.unit.ap=0;if(state==='dying')h.unit._dying=true;if(state==='stun')h.unit.status.stun=1;
 if(state==='blocked')h.set({blocked:true});if(state==='range')h.tw.x=4;if(state==='occupied'){h.enemy.x=2;h.enemy.y=1;}if(state==='friendly')h.tw.owner=1;
 assert.equal(h.forecast(),null);assert.ok(!h.choose().candidates.some(c=>c.type==='attack_tower'));
});
test('surface elevation participates in direct Cube reach',()=>{const h=setup();h.set({z:3});assert.equal(h.forecast(),null);h.unit.z=3;assert.ok(h.forecast());assert.ok(h.choose().candidates.some(c=>c.type==='attack_tower'));});
test('fog rejection matches manual actor; automatic actor retains engine gate',()=>{const h=setup();h.state.fogOfWar=true;h.set({visible:false});assert.equal(h.forecast(),null);h.state.autoPlayers={1:true};assert.ok(h.forecast());});
test('non-Arena arithmetic remains available without a terminal claim',()=>{const h=setup();h.mode(modes.tdm);h.tw.hp=1;assert.equal(h.forecast().lethal,true);assert.equal(h.forecast().wins,false);});
test('forecast is read-only even when level getter caches',()=>{const h=setup();Object.freeze(h.unit.status);Object.freeze(h.unit);const before=JSON.stringify(h.state);h.forecast();h.forecast();assert.equal(JSON.stringify(h.state),before);});
test('reserves prevent a false enemy wipeout and permit a real Cube finish',()=>{const h=setup();h.enemy.dead=true;h.state.reserves=true;h.state.bench={2:[{id:'r',player:2,hp:100,_seatFor:'e'}]};h.tw.hp=1;assert.equal(h.c.getTeamWipeoutCount(2),1);assert.equal(h.forecast().wins,true);h.c.doAttack(h.unit,2,1);assert.equal(h.state._winCondition,'tower_destroyed');});
test('already lost home-team wipeout cannot be called a Cube win',()=>{const h=setup();h.unit._origPlayer=2;h.tw.hp=1;assert.equal(h.forecast().wins,false);});
test('possession does not trip early wipeout before checkWin',()=>{const h=setup();h.enemy.player=1;h.enemy._origPlayer=2;assert.equal(h.c.checkWinConditionOnly(),false);h.c.checkWin();assert.equal(h.state.winner,undefined);});
test('both teams empty preserves checkWin nonterminal contract',()=>{const h=setup();h.unit.dead=true;h.enemy.dead=true;assert.equal(h.c.checkWinConditionOnly(),false);h.c.checkWin();assert.equal(h.state.winner,undefined);});
test('one dying side is terminal in both readers',()=>{const h=setup();h.enemy._dying=true;assert.equal(h.c.checkWinConditionOnly(),true);h.c.checkWin();assert.equal(h.state.winner,1);});
test('FFA early winner follows surviving units rather than two-seat counts',()=>{const h=setup();h.mode({id:'ffa',isFFA:true,winConditions:['wipeout']});h.unit.player=3;h.enemy.player=4;assert.equal(h.c.checkWinConditionOnly(),false);h.enemy.dead=true;assert.equal(h.c.checkWinConditionOnly(),true);h.c.checkWin();assert.equal(h.state.winner,3);});
test('FFA without wipeout still checks an expired clock',()=>{const h=setup();h.mode({id:'ffa',isFFA:true,winConditions:['wipeout'],roundLimit:5});h.state.round=6;h.state.matchClock={roundLimit:5};assert.equal(h.c.checkWinConditionOnly(),true);});
