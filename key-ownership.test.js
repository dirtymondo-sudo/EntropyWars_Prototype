'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const root = process.env.KEY_BASELINE || __dirname;
const battle = fs.readFileSync(path.join(root, 'battle.js'), 'utf8');
const map = fs.readFileSync(path.join(root, 'map.js'), 'utf8');
function extract(src, name) {
 const start = src.indexOf('        function ' + name + '(');
 const end = src.indexOf('\n        }', start);
 assert.ok(start >= 0 && end > start, name);
 return src.slice(start, end + 10);
}
function setup(player, held = 2, buff = held) {
 const thief = {id:'thief', player, x:1,y:1,hourglasses:0,hourglassBuff:0,mp:10,items:{}};
 const victim = {id:'victim',player:3-player,x:4,y:4,hourglasses:held,hourglassBuff:buff,items:{potion:1}};
 const state = {units:[thief,victim],hourglasses:Array.from({length:held},(_,i)=>({id:'k'+i,carriedBy:victim.id,x:4,y:4,visibleTo:{1:true,2:true}})),hourglassBuffs:{1:0,2:0}};
 state.hourglassBuffs[victim.player]=buff;
 const c={state,addLog:()=>{},showFloatingTextForUnit:()=>{},unitDisplayName:u=>u.id,coordLabel:()=>'',randInt:()=>0,unitFromId:id=>state.units.find(u=>u.id===id)};
 vm.createContext(c);
 vm.runInContext(extract(battle,'moveHourglassesBetweenUnits')+'\n'+extract(battle,'_stealFromUnit')+'\n'+extract(map,'dropHourglassesFromUnit')+'\n'+extract(map,'carriedHourglassCount'),c);
 c.plunder=(id='plunder',damage=false)=>{
  const marker="} else if (spell.id === 'plunder' || spell.id === 'racePlunder') {";
  const start=battle.indexOf(marker);const end=battle.indexOf("} else if (spell.id === 'mimic')",start);
  assert.ok(start>=0 && end>start);
  Object.assign(c,{unit:thief,x:4,y:4,z:0,spell:{id,dmg:damage?3:0},effectiveSpellCost:2,spellPower:0,_activeCinematic:null,unitAt:()=>victim,isAllyUnit:(a,b)=>a.player===b.player,focusUnitPanel:()=>{},playSfx:()=>{},playErrorSfx:()=>{},_spellFocusCamera:()=>{},actionMs:n=>n,getSpellElement:()=>null,applyDamageToUnit:u=>{u.dead=true;c.dropHourglassesFromUnit(u);}});
  vm.runInContext('(function(){'+battle.slice(start+marker.length,end)+'})()',c);
 };
 return {c,state,thief,victim};
}
for(const player of [1,2]) {
 for(const held of [1,2]) test(`P${player}: theft transfers actual Key and each carrier drops only its own (${held})`,()=>{
  const {c,state,thief,victim}=setup(player,held);
  assert.equal(c._stealFromUnit(thief,victim,{keys:1,items:0}).keys,1);
  assert.equal(c.carriedHourglassCount(player),1);
  assert.equal(c.carriedHourglassCount(3-player),held-1);
  assert.equal(thief.hourglassBuff,1); assert.equal(victim.hourglassBuff,held-1);
  assert.equal(state.hourglassBuffs[player],1);assert.equal(state.hourglassBuffs[3-player],held-1);
  c.dropHourglassesFromUnit(thief);c.dropHourglassesFromUnit(victim);
  assert.equal(state.hourglasses.filter(h=>h.carriedBy===null).length,held);
  assert.equal(state.hourglasses.filter(h=>h.x===1).length,1);
  assert.equal(thief.hourglasses+victim.hourglasses,0);
  assert.equal(state.hourglassBuffs[1]+state.hourglassBuffs[2],0);
  c.dropHourglassesFromUnit(thief);assert.equal(state.hourglassBuffs[player],0);
 });
 for(const id of ['plunder','racePlunder']) test(`P${player}: ${id} production branch transfers a Key before item fallback`,()=>{
  const {c,state,thief,victim}=setup(player);c.plunder(id);
  assert.equal(c.carriedHourglassCount(player),1);assert.equal(thief.hourglasses,1);
  assert.equal(victim.items.potion,1);assert.equal(thief.mp,8);
  c.dropHourglassesFromUnit(thief);assert.equal(state.hourglasses[0].carriedBy,null);
 });
 test(`P${player}: empty registry corrects phantom counters and Plunder falls back to item`,()=>{
  const {c,thief,victim}=setup(player,0);victim.hourglasses=5;thief.hourglasses=7;c.plunder();
  assert.equal(thief.hourglasses,0);assert.equal(victim.hourglasses,0);assert.equal(thief.items.potion,1);
 });
 test(`P${player}: stale zero counter cannot suppress transfer or drop`,()=>{
  const {c,state,thief,victim}=setup(player);victim.hourglasses=0;
  assert.equal(c._stealFromUnit(thief,victim,{keys:1,items:0}).keys,1);
  victim.hourglasses=0;c.dropHourglassesFromUnit(victim);
  assert.equal(state.hourglasses.filter(h=>h.carriedBy===victim.id).length,0);
  assert.equal(state.hourglassBuffs[victim.player],0);
 });
 test(`P${player}: lethal Plunder damage drops keys before theft and preserves item fallback`,()=>{
  const {c,state,thief}=setup(player);c.plunder('plunder',true);
  assert.equal(state.hourglasses.filter(h=>h.carriedBy===null).length,2);
  assert.equal(thief.hourglasses,0);assert.equal(thief.items.potion,1);
 });
 test(`P${player}: partial charge transfer uses existing trade rule without creating charge`,()=>{
  const {c,state,thief,victim}=setup(player,3,1);
  assert.equal(c._stealFromUnit(thief,victim,{keys:9,items:1}).keys,3);
  assert.equal(thief.hourglassBuff,1);assert.equal(victim.hourglassBuff,0);
  assert.equal(state.hourglassBuffs[player],1);assert.equal(thief.items.potion,1);
 });
}
test('same-team trade preserves team charge and reconciles recipient counter',()=>{
 const {c,state,thief,victim}=setup(1);thief.player=victim.player;thief.hourglasses=8;
 assert.equal(c.moveHourglassesBetweenUnits(victim,thief,1),1);
 assert.equal(thief.hourglasses,1);assert.equal(state.hourglassBuffs[victim.player],2);
});
test('self transfer and invalid amounts never mutate or invent Keys',()=>{
 const {c,state,victim,thief}=setup(1);const before=JSON.stringify(state);
 for(const amount of [NaN,Infinity,-1,0]) assert.equal(c.moveHourglassesBetweenUnits(victim,thief,amount),0);
 assert.equal(c.moveHourglassesBetweenUnits(victim,victim,1),0);assert.equal(JSON.stringify(state),before);
 assert.equal(c.moveHourglassesBetweenUnits(victim,thief,1.5),1);
 assert.equal(thief.hourglasses,1);assert.equal(victim.hourglasses,1);
});
