'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const data=require('./load-data').loadGameData();
const ai=fs.readFileSync(process.env.EW_AI_TEST_SOURCE||path.join(__dirname,'ai.js'),'utf8');
const battle=fs.readFileSync(path.join(__dirname,'battle.js'),'utf8');
function between(s,a,b){const x=s.indexOf(a),y=s.indexOf(b,x+a.length);assert.ok(x>=0&&y>x,a);return s.slice(x,y);}
function setup(seat=1){
 const pulse=data.SPELL_BY_ID.racePulseLattice,tune=data.SPELL_BY_ID.raceTuneFrequency;
 const unit={id:'self',player:seat,x:0,y:0,z:0,hp:500,mp:300,ap:2,status:{},spells:[pulse,tune]};
 const enemy={id:'enemy',player:3-seat,x:4,y:3,z:0,hp:1000,maxHp:1000,mp:100,def:80,status:{},spells:[]};
 const state={round:1,units:[unit,enemy],_mirrorFreq:{1:0,2:0},mirrors:[{owner:seat,ownerUnitId:unit.id,hp:2,power:0},{owner:seat,hp:2},{owner:seat,hp:2}]};
 const net={count:3,isPrism:false,is3DVolume:false,beamTiles:new Set(['4,3']),volumeTiles:new Set(),segments:[]};
 const hits=[];
 const ctx={state,window:{},console:{log(){},warn(){}},STATUS_DEFS:data.STATUS_DEFS,
 getHourglassPower:()=>0,getSpellStatBonus:()=>0,getPlantedTreeBonus:()=>0,getTreeThrowBonus:()=>0,getJobPassiveSpellBonus:()=>0,
 unitFromId:id=>state.units.find(u=>u.id===id),getEffectiveArmor:()=>0,getTypeDamageMultiplier:(u,t,type)=>t.typeMult?.[type]??1,
 getStatusDamageTakenMultiplier:()=>1,unitPassiveValue:(u,k)=>u[k],unitPassiveBlocksStatus:(u,k)=>u.immuneStatuses?.includes(k),
 statusAffinityElement:k=>k==='burn'?'fire':null,unitElementAffinity:(u,el)=>u.affinities?.[el],getSpellElement:()=> 'fire',
 getStatusApplyChance:()=>ctx.chance??1,_unitIsSoaked:u=>u.soaked,_unitInRain:u=>u.rain,
 getSpellCooldownRemaining:u=>u.cooldown||0,unitDisplayName:u=>u.id,addLog(){},playSfx(){},checkWin(){},scheduleBoardRender(){},
 applyDamageToUnit:(u,raw,text,opts)=>hits.push({raw,opts}),applyStatStageBoost:(u,boost)=>hits.push({boost})};
 const g={state,unitHasStatus:(u,k)=>!!u.status?.[k],getEffectiveSpellRange:(u,s)=>s.range,
 getEffectiveRange:()=>1,getEffectiveMove:()=>1,getEffectiveAttackBonus:()=>0,getHourglassPower:()=>0,getUnitStandingHeight:u=>u.z||0,
 getStatStageCount:u=>u.stage||0,TargetQuery:{apCost:()=>1,canAfford:()=>true}};
 ctx.window.GAME=g;ctx.window.computeMirrorNetwork=()=>net;ctx.window.isUnitRealmShieldedFrom=()=>false;
 vm.createContext(ctx);
 vm.runInContext(between(battle,'        const MIRROR_FREQS = [','        // Distinct players')+
 between(battle,'        function laserOwnerUnitId(','        // Beam tiles a moving unit')+
 between(battle,'        function doPulseLattice(','\n        if (typeof window'),ctx);
 g.TargetQuery.mirrorHitProfile=vm.runInContext('({'+between(battle,'            mirrorHitProfile(unit,','            // Living enemies')+'}).mirrorHitProfile',ctx);
 const end=ai.lastIndexOf('})();');vm.runInContext(ai.slice(0,end)+'unitThreatOutput=()=>100;window.probe={scoreSpell,scoreSpells};'+ai.slice(end),ctx);
 const v={visibleEnemies:[enemy],allies:[]};
 return {unit,enemy,state,net,pulse,tune,g,ctx,hits,v,
 score:(spell=pulse)=>ctx.window.probe.scoreSpell(unit,spell,unit,v),
 candidates:()=>{const out=[];ctx.window.probe.scoreSpells(unit,v,out);return out;}};
}
for(const seat of [1,2])for(const shape of ['beam','volume','prism'])test(`P${seat} ${shape}: shared pulse raw profile equals production damage/effect calls at every frequency`,()=>{
 const h=setup(seat);h.net.is3DVolume=shape==='volume';h.net.isPrism=shape==='prism';
 for(const power of [0,37])for(let f=0;f<3;f++){
  h.state._mirrorFreq[seat]=f;h.hits.length=0;h.ctx.doPulseLattice(h.unit,h.net,power);
  const profile=h.ctx.getMirrorHitProfile(seat,'pulse',power,h.net);
  const base=[1.15,1,0.9][f],mult=shape==='prism'?3:shape==='volume'?1.8:1;
  assert.equal(profile.damage,Math.floor(Math.max(60,Math.floor((95+power)*base))*mult));
  assert.equal(h.hits[0].raw,profile.damage);assert.equal(h.hits[0].opts.spellType,profile.frequency.spellType);
  assert.equal(h.hits[0].opts.noRangeMult,true);assert.equal(h.hits[0].opts.allowMarkBonus,false);
  assert.equal(h.hits[0].opts.spellElement,undefined);assert.equal(h.hits[0].opts.statusEffects?.[0]?.id,profile.frequency.status?.id);
 }
});
test('pulse damage follows current frequency and never adds a fake elemental tag, range falloff, or extra spell power',()=>{
 const h=setup();h.enemy.immuneKind='debuff';h.enemy.immuneStatDown=true;h.enemy.affinities={fire:'immune'};h.unit.spellPower=40;
 for(let f=0;f<3;f++){h.state._mirrorFreq[1]=f;assert.equal(h.score(),Math.floor(135*[1.15,1,0.9][f]));}
 h.unit.x=-100;assert.equal(h.score(),Math.floor(135*0.9));
});
test('burn susceptibility includes wet/rain, immunity, existing status, and actual application chance',()=>{
 const h=setup();const good=h.score();assert.ok(good>109);h.enemy.soaked=true;assert.equal(h.score(),109);h.enemy.soaked=false;
 h.enemy.rain=true;assert.equal(h.score(),109);h.enemy.rain=false;h.enemy.immuneStatuses=['burn'];assert.equal(h.score(),109);h.enemy.immuneStatuses=[];
 h.enemy.affinities={fire:'immune'};assert.equal(h.score(),109);h.enemy.affinities={};h.enemy.status.burn=1;assert.equal(h.score(),109);h.enemy.status={};
 h.ctx.chance=0;assert.equal(h.score(),109);h.ctx.chance=0.5;assert.equal(h.score(),109+(good-109)/2);
});
test('UV shred respects stat immunity, lock and lower-bound headroom, including a protected enemy',()=>{
 const h=setup();h.state._mirrorFreq[1]=1;const good=h.score();assert.ok(good>95);
 h.enemy.immuneStatDown=true;assert.equal(h.score(),95);h.enemy.immuneStatDown=false;h.enemy.status.statLock=1;assert.equal(h.score(),95);
 h.enemy.status={};h.enemy.def=0;assert.equal(h.score(),95);h.enemy.def=80;h.enemy.status.protect=1;assert.equal(h.score(),good-95);
});
test('Pulse avoids invisible/dead targets, redundant status value and shape bonuses without actual hits',()=>{
 const h=setup();h.v.visibleEnemies=[];assert.equal(h.score(),0);h.v.visibleEnemies=[h.enemy];h.enemy.dead=true;assert.equal(h.score(),0);h.enemy.dead=false;
 h.net.beamTiles.clear();h.net.isPrism=true;assert.equal(h.score(),0);h.net.volumeTiles.add('4,3');assert.ok(h.score()>0);
});
for(const seat of [1,2])test(`P${seat}: Tune compares only the next frequency and preserves state`,()=>{
 const h=setup(seat);h.enemy.immuneKind='debuff';h.enemy.immuneStatDown=true;h.enemy.typeMult={tech:0.5,alien:3,anomaly:0.5};
 const before=JSON.stringify(h.state);assert.ok(h.score(h.tune)>0);assert.equal(JSON.stringify(h.state),before);
 assert.ok(h.candidates().some(c=>c.spell.id===h.tune.id));h.state._mirrorFreq[seat]=1;assert.ok(h.score(h.tune)<0);
 assert.ok(!h.candidates().some(c=>c.spell.id===h.tune.id));
});
test('Tune cannot promise a pulse whose mana it consumes, but a teammate can provide that pulse',()=>{
 const h=setup();h.enemy.immuneKind='debuff';h.enemy.immuneStatDown=true;h.enemy.typeMult={tech:0.5,alien:3,anomaly:0.5};
 const rich=h.score(h.tune);h.unit.mp=h.pulse.cost+h.tune.cost-1;const poor=h.score(h.tune);assert.ok(poor<rich);
 const mate={...h.unit,id:'mate',mp:h.pulse.cost,spells:[h.pulse]};h.state.units.push(mate);h.v.allies.push(mate);assert.equal(h.score(h.tune),rich);
});
test('one prism has no immediate value; two can improve a live beam without inventing a pulse',()=>{
 const h=setup();h.unit.spells=[h.tune];h.enemy.immuneKind='debuff';h.enemy.immuneStatDown=true;h.enemy.typeMult={tech:0.5,alien:3,anomaly:0.5};
 h.net.count=2;h.state.mirrors.pop();assert.ok(h.score(h.tune)>0);assert.equal(h.score(h.pulse),0);
 h.net.count=1;h.state.mirrors.pop();h.net.beamTiles.clear();assert.equal(h.score(h.tune),0);
});
test('Tune values burn tiles but does not invent crossing paths or a burn inside volume-only space',()=>{
 const h=setup();h.unit.spells=[h.tune];h.net.volumeTiles.add('4,3');h.net.beamTiles.clear();assert.equal(h.score(h.tune),0);
});
test('pulse profile includes each engine spell-power term once and beam power uses the owner network',()=>{
 const h=setup();h.unit.spellPower=1;h.ctx.getHourglassPower=()=>2;h.ctx.getSpellStatBonus=()=>3;h.ctx.getPlantedTreeBonus=()=>4;h.ctx.getTreeThrowBonus=()=>5;h.ctx.getJobPassiveSpellBonus=()=>6;
 assert.equal(h.g.TargetQuery.mirrorHitProfile(h.unit,h.pulse,h.net).damage,Math.floor((95+21)*1.15));
 h.state.mirrors[0].power=20;assert.equal(h.g.TargetQuery.mirrorHitProfile(h.unit,h.tune,h.net,'burn').damage,Math.floor((34+9)*1.15));
});
