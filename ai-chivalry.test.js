'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const data=require('./load-data').loadGameData();
const aiSource=fs.readFileSync(process.env.EW_AI_TEST_SOURCE||path.join(__dirname,'ai.js'),'utf8');
const battle=fs.readFileSync(process.env.EW_CHIVALRY_SOURCE||path.join(__dirname,'battle.js'),'utf8');
const map=fs.readFileSync(path.join(__dirname,'map.js'),'utf8');
function between(s,a,b){const x=s.indexOf(a),y=s.indexOf(b,x+a.length);assert.ok(x>=0&&y>x,a);return s.slice(x,y);}
function setup(seat=1){
 const spell=data.SPELL_BY_ID.raceChivalry;
 const unit={id:'knight',player:seat,x:2,y:3,z:0,hp:500,maxHp:500,mp:100,ap:2,atk:40,def:400,mdef:400,status:{},spells:[spell]};
 const ward={id:'ward',player:seat,x:3,y:3,z:0,hp:30,maxHp:200,mp:100,ap:2,atk:40,status:{},spells:[]};
 const enemy={id:'enemy',player:3-seat,x:4,y:3,z:0,hp:300,maxHp:300,mp:200,ap:2,atk:160,status:{},spells:[]};
 const state={units:[unit,ward,enemy],turrets:[],_deployedObjects:[],mirrors:[]};
 const blocks=new Set(),heights=new Map(),logs=[],timers=[],queued=[];
 const ctx={state,window:{},console:{log(){},warn(){}},Math,Set,Object,STATUS_DEFS:data.STATUS_DEFS,
  unitHasStatus:(u,k)=>!!u.status?.[k],getEffectiveSpellRange:(u,s)=>s.range,getEffectiveRange:u=>u.range||1,
  isLongRangeSpell:s=>s.range>1&&s.kind==='damage',spellRequiresAboveTarget:()=>false,
  spellTargetsCorpses:()=>false,spellTargetUsableOn:()=>true,
  _kindMeta:s=>s.kind==='guard'?{minRange:0,allyOnly:true,fogExempt:true}:{minRange:1,offensive:true},
  getHeightAt:()=>0,getUnitStandingHeight:u=>u.z||0,getTauntTargeter:u=>u.taunter,
  isRangeBlockedByTerrain:(x,y,tx,ty,z)=>blocks.has(tx+','+ty),isInVision:()=>false,unitCryptidHiddenFrom:()=>false,
  isUnitRealmShieldedFrom:(u,a)=>!!u._realmPartnerId&&u._realmPartnerId!==a.id,
  isAllyUnit:(a,b)=>a.player===b.player,isEnemyUnit:(a,b)=>a.player!==b.player,_orderTargetsByNeed(){},
  isInside:(x,y)=>x>=0&&y>=0&&x<10&&y<10,getWalkableSurfaces:(x,y)=>heights.get(x+','+y)||[0],
  getBlockAt:(x,y)=>({terrain:blocks.has(x+','+y)?'wall':'grass'}),getTerrainRule:t=>({passable:t!=='wall'}),
  objectBlocksLanding:()=>false,isTowerTile:()=>false,getBaseHeightAt:()=>0,
  unitAt:(x,y,z)=>state.units.find(u=>!u.dead&&!u._dying&&u.x===x&&u.y===y&&(z==null||z===u.z)),
  getEffectiveArmor:(u,t)=>t==='magic'?(u.mdef||0):(u.def||0),
  unitPassiveValue:(u,k)=>u[k],
  getSpellElement:s=>s.element,unitElementAffinity:(u,el)=>u.affinities?.[el],getSpellCooldownRemaining:u=>u.cooldown||0,
  getTypeDamageMultiplier:()=>1,getStatusDamageTakenMultiplier:()=>1,
  unitDisplayName:u=>u.id,addLog:(...s)=>logs.push(s),playErrorSfx(){},playSfx(){},
  _spellFocusCamera(){},focusUnitPanel(){},_vfxBuff(){},showFloatingTextForUnit(){},actionMs:n=>n,
  scheduleBoardRender(){},panelFocusTarget:null};
 ctx.window.isUnitRealmShieldedFrom=ctx.isUnitRealmShieldedFrom;vm.createContext(ctx);
 vm.runInContext(between(map,'        function combatDist(','        function randInt(')+
  between(map,'        function nearestWalkableZ(','        /* Units riding a building')+
  between(map,'        function unitAt3D(','        function unitsAtColumn(')+
  between(battle,'        function _getSpellValidTargets(','        /* MOVE→CAST companions'),ctx);
 // Baseline fallback permits unchanged AI to reach its missing scorer.
 if(battle.includes('        function getChivalryLanding('))vm.runInContext(between(battle,'        function getChivalryLanding(','        function applyDamageToUnit('),ctx);
 else ctx.getChivalryLanding=(u,w)=>({x:w.x,y:w.y+1,z:w.z});
 const g={state,STATUS_DEFS:data.STATUS_DEFS,unitHasStatus:ctx.unitHasStatus,getEffectiveRange:ctx.getEffectiveRange,
  getEffectiveSpellRange:ctx.getEffectiveSpellRange,getTauntTargeter:ctx.getTauntTargeter,isRangeBlockedByTerrain:ctx.isRangeBlockedByTerrain,
  combatReach:ctx.combatReach,combatDist:ctx.combatDist,getUnitStandingHeight:ctx.getUnitStandingHeight,
  getAttackArc:(a,b)=>b.arc||'front',getFacingDamageMult:a=>a==='back'?1.25:1,getEvasionChance:u=>u.evasion||0,
  getEffectiveAttackBonus:()=>0,getHourglassPower:()=>0,
  TargetQuery:{apCost:s=>s.apCost,canAfford:()=>true,spellTargets:ctx._getSpellValidTargets,chivalryLanding:ctx.getChivalryLanding},
  getTerrainAt:(x,y)=>ctx.lava===x+','+y?'lava':'grass',queueComputerAction:fn=>queued.push(fn),
  finishComputerAction:()=>logs.push('finish'),maybeTriggerComputerTurn:()=>logs.push('retry')};
 ctx.window.GAME=g;ctx.window.setTimeout=(fn,ms)=>timers.push({fn,ms});
 const v={visibleEnemies:[enemy],allies:[ward],closestEnemy:enemy};ctx.vision=v;
 const end=aiSource.lastIndexOf('})();');vm.runInContext(aiSource.slice(0,end)+'\nbuildVision=()=>vision; window.ai={findSpellTarget,scoreSpell,scoreSpells,executeAction,estDamage};\n'+aiSource.slice(end),ctx);
 const body=between(battle,"            else if (spell.kind === 'guard') {","            else if (spell.kind === 'encore') {");
 vm.runInContext('function pledge(unit,x,y,z,spell){const effectiveSpellCost=spell.cost;let completionDelay=0;'+body.replace('else if','if')+'return completionDelay;}',ctx);
 g.doSpell=(u,x,y,z)=>{logs.push({cast:[x,y,z]});return ctx.pledge(u,x,y,z,spell);};
 return {spell,unit,ward,enemy,state,blocks,heights,logs,timers,queued,ctx,g,v,ai:ctx.window.ai,
  targets:()=>ctx._getSpellValidTargets(unit,spell),score:(w=ward)=>ctx.window.ai.scoreSpell(unit,spell,w,v),
  candidates:()=>{const out=[];ctx.window.ai.scoreSpells(unit,v,out);return out;}};
}
for(const seat of [1,2]){
 test(`P${seat}: picker/scorer admit a durable knight saving a threatened ally`,()=>{const h=setup(seat);assert.ok(h.score()>100);assert.equal(h.candidates()[0].target,h.ward);});
 test(`P${seat}: ordinary cast follows moved ward, spends MP and finishes once`,()=>{
  const h=setup(seat),a=h.candidates()[0];assert.ok(a);h.ai.executeAction(h.unit,a,h.v);h.ward.y=4;h.ward.z=1;h.queued[0]();
  assert.deepEqual(h.logs[0],{cast:[3,4,1]});assert.equal(h.ward._guardedBy,h.unit.id);assert.equal(h.unit._guardingAlly,h.ward.id);assert.equal(h.unit.mp,100-h.spell.cost);
  assert.equal(h.timers.length,1);h.timers[0].fn();assert.equal(h.logs.at(-1),'finish');
 });
 test(`P${seat}: ordinary stale pledge retries without cost or timer`,()=>{
  const h=setup(seat),a=h.candidates()[0];assert.ok(a);h.ai.executeAction(h.unit,a,h.v);h.ward.dead=true;h.queued[0]();
  assert.equal(h.unit.mp,100);assert.deepEqual(h.logs,['retry']);assert.equal(h.timers.length,0);
 });
}
test('shared drum excludes self, enemy, dead and dying allies',()=>{
 const h=setup();assert.deepEqual(Array.from(h.targets(),t=>t.unit.id),['ward']);h.ward._dying=true;assert.equal(h.targets().length,0);
 h.ward._dying=false;h.ward.dead=true;assert.equal(h.targets().length,0);
});
test('target legality uses real elevation, LOS, same-column reach and fog exemption',()=>{
 const h=setup();h.state.fogOfWar=true;assert.ok(h.candidates()[0]);h.blocks.add('3,3');assert.equal(h.candidates().length,0);h.blocks.clear();
 h.ward.z=5;assert.equal(h.candidates().length,0);h.ward.x=2;h.ward.y=3;h.ward.z=1;assert.deepEqual(Array.from(h.targets(),t=>t.unit.id),['ward']);
});
test('doomed knight does not treat his death as free shield value',()=>{
 const h=setup();h.unit.hp=10;h.unit.def=0;h.unit.mdef=0;h.ward.hp=200;assert.ok(h.score()<=0);assert.equal(h.candidates().length,0);
});
test('existing identical pledge and equivalent other guardian have no extra value',()=>{
 const h=setup();h.ward._guardedBy=h.unit.id;h.unit._guardingAlly=h.ward.id;assert.equal(h.score(),0);
 const other={...h.unit,id:'other',x:2,y:2};h.state.units.push(other);h.ward._guardedBy=other.id;h.unit._guardingAlly=null;assert.ok(h.score()<=0);assert.equal(h.candidates().length,0);
});
test('switching wards subtracts old live pledge value; stale links do not',()=>{
 const h=setup();const before=h.score();const old={...h.ward,id:'old',x:4,y:4,_guardedBy:h.unit.id};h.state.units.push(old);h.unit._guardingAlly=old.id;
 assert.ok(h.score()<before);old._guardedBy='someoneElse';assert.equal(h.score(),before);
});
test('replacing a harmful guardian can help an already protected ward',()=>{
 const h=setup();h.ward.status.protect=1;assert.ok(h.score()<=0);const old={...h.unit,id:'oldKnight',hp:10,def:0,mdef:0,x:1,y:1};
 h.state.units.push(old);h.ward._guardedBy=old.id;assert.ok(h.score()>0);
});
test('guardian protection, physical/element immunity and realm defenses use actual recipient and attacker',()=>{
 const h=setup();h.unit.def=0;h.unit.mdef=0;h.unit.hp=30;h.ward.hp=200;assert.ok(h.score()<0);
 h.unit.status.protect=1;assert.ok(h.score()>0);h.unit.status={};h.unit.immuneDamageType='physical';assert.ok(h.score()>0);delete h.unit.immuneDamageType;
 h.unit._realmPartnerId='other';assert.ok(h.score()>0);h.unit._realmPartnerId=h.enemy.id;assert.ok(h.score()<0);delete h.unit._realmPartnerId;
 h.enemy.range=0.1;h.enemy.spells=[{id:'fire',name:'Fire',kind:'damage',element:'fire',damageType:'magic',dmg:160,range:3,cost:10}];
 h.unit.affinities={fire:'immune'};assert.ok(h.score()>0);h.ward.affinities={fire:'immune'};assert.equal(h.score(),0);
});
test('landing query is pure, obeys obstacles/heights and charges hazards',()=>{
 const h=setup();const original=JSON.stringify(h.state),safe=h.score();assert.ok(safe>0);assert.equal(JSON.stringify(h.state),original);
 h.ctx.lava='3,4';assert.ok(h.score()<safe);h.ctx.lava=null;h.blocks.add('3,4');h.heights.set('3,2',[2]);
 const d=h.g.TargetQuery.chivalryLanding(h.unit,h.ward);assert.deepEqual([d.x,d.y,d.z],[3,2,2]);
 for(const cell of ['3,2','4,3','2,3'])h.blocks.add(cell);assert.deepEqual(Object.values(h.g.TargetQuery.chivalryLanding(h.unit,h.ward)),[2,3,0]);
});
test('unseen, distant and blocked enemies give no speculative protection value',()=>{
 const h=setup();h.v.visibleEnemies=[];assert.equal(h.candidates().length,0);h.v.visibleEnemies=[h.enemy];h.enemy.x=9;assert.equal(h.candidates().length,0);
 h.enemy.x=4;h.blocks.add('3,3');assert.equal(h.candidates().length,0);
});
test('one pledge does not sum intercepted hits; ward evasion discounts transfer',()=>{
 const h=setup();h.unit.status.protect=1;const one=h.score();assert.ok(one>0);h.v.visibleEnemies.push(h.enemy);assert.equal(h.score(),one);
 h.v.visibleEnemies.pop();h.ward.evasion=0.5;assert.equal(h.score(),one/2);
});
test('AP, MP, silence and canonical affordability gate admission',()=>{
 const h=setup();for(const key of ['ap','mp']){const old=h.unit[key];h.unit[key]=0;assert.equal(h.candidates().length,0);h.unit[key]=old;}
 h.unit.status.silence=1;assert.equal(h.candidates().length,0);h.unit.status={};h.g.TargetQuery.canAfford=()=>false;assert.equal(h.candidates().length,0);
});
test('basic transfer forecast preserves original ward facing arc',()=>{
 const h=setup();h.unit.def=0;h.unit.arc='front';h.ward.arc='back';
 assert.ok(h.ai.estDamage(h.g,h.enemy,h.unit,null,{interceptionForecast:true,basicArcTarget:h.ward})>h.ai.estDamage(h.g,h.enemy,h.unit,null,{interceptionForecast:true}));
});
for(const seat of [1,2])test(`P${seat}: Simul retargets tracked pledge and whiffs lost target once`,()=>{
 const h=setup(seat),exec=vm.runInContext(between(battle,'            function _execSpell(','            function _execItem(')+'_execSpell',h.ctx);
 h.ctx.canAffordSpell=()=>true;h.ctx.getSpellMpCostFor=()=>h.spell.cost;h.ctx.isSpellSelfCast=()=>false;h.ctx.doSpell=h.g.doSpell;
 let whiffs=0;h.ctx._spellWhiff=(u,s)=>{whiffs++;u.mp-=s.cost;u.ap--;};h.ward.y=4;
 assert.equal(exec(h.unit,{tool:h.spell.name,targetId:h.ward.id,x:3,y:3,z:0,_aiChivalry:true}),400);assert.equal(h.ward._guardedBy,h.unit.id);
 h.ward.dead=true;assert.equal(exec(h.unit,{tool:h.spell.name,targetId:h.ward.id,x:3,y:3,z:0,_aiChivalry:true}),600);
 assert.equal(whiffs,1);assert.equal(h.unit.mp,100-2*h.spell.cost);assert.equal(h.logs.filter(e=>e.cast).length,1);
});
test('Simul marks only CPU Chivalry candidates; human identity orders retain their chosen ward',()=>{
 const h=setup(),toStep=vm.runInContext(between(battle,'            function _candToStep(','            function _buildAiPlanFor(')+'_candToStep',h.ctx);
 h.ctx.spellDealsDamage=()=>false;const step=toStep({type:'spell',spell:h.spell,target:h.ward});assert.equal(step._aiChivalry,true);
 const exec=vm.runInContext(between(battle,'            function _execSpell(','            function _execItem(')+'_execSpell',h.ctx);
 h.ctx.canAffordSpell=()=>true;h.ctx.getSpellMpCostFor=()=>h.spell.cost;h.ctx.isSpellSelfCast=()=>false;h.ctx.doSpell=h.g.doSpell;
 h.ctx.window._aiReaimChivalry=()=>{throw Error('human choice must not be rescored');};delete step._aiChivalry;
 h.unit.hp=1;h.unit.def=0;assert.equal(exec(h.unit,step),400);assert.equal(h.ward._guardedBy,h.unit.id);
});
test('Ray Gun hits use guardian magic defense and magic immunity, not physical armor',()=>{
 const h=setup();h.enemy.basicAttackMagic=true;h.enemy.intStat=160;h.unit.mdef=0;h.unit.def=400;h.unit.hp=30;h.ward.hp=200;
 const bad=h.score();assert.ok(bad<0);h.unit.mdef=400;assert.ok(h.score()>bad);
 h.unit.mdef=0;h.unit.immuneDamageType='physical';assert.equal(h.score(),bad);h.unit.immuneDamageType='magic';assert.ok(h.score()>0);
});
test('blind discounts a potential interception and an unreachable realm ward has no direct threat',()=>{
 const h=setup();h.unit.status.protect=1;const base=h.score();h.enemy.status.blind=1;assert.equal(h.score(),base/2);
 h.enemy.status={};h.ward._realmPartnerId='elsewhere';assert.equal(h.score(),0);
});
test('spell threat forecast respects MP, cooldown, silence, and does not transfer multi-hit totals',()=>{
 const h=setup();h.enemy.range=0.1;h.enemy.spells=[{id:'hit',kind:'damage',dmg:160,damageType:'magic',range:3,cost:10}];
 assert.ok(h.score()>0);h.enemy.mp=0;assert.equal(h.score(),0);h.enemy.mp=100;h.enemy.cooldown=1;assert.equal(h.score(),0);
 h.enemy.cooldown=0;h.enemy.status.silence=1;assert.equal(h.score(),0);h.enemy.status={};h.enemy.spells[0].hitDamages=[80,80];assert.equal(h.score(),0);
});
test('read-only Chivalry scorer timing on a controlled 6v6 board',t=>{
 const h=setup();for(let i=0;i<5;i++){const a={...h.ward,id:'ally'+i,x:1+i%3,y:2+Math.floor(i/3),status:{}};h.v.allies.push(a);h.state.units.push(a);
 const e={...h.enemy,id:'enemy'+i,x:4+i%3,y:2+Math.floor(i/3),status:{}};h.v.visibleEnemies.push(e);h.state.units.push(e);}
 const before=JSON.stringify(h.state),times=[];for(let i=0;i<40;i++){const start=performance.now();h.candidates();times.push(performance.now()-start);}
 assert.equal(JSON.stringify(h.state),before);times.sort((a,b)=>a-b);
 t.diagnostic(JSON.stringify({scope:'scorer only, controlled board; not full AI decision or browser performance',runs:times.length,medianMs:times[20],p95Ms:times[38]}));
});
