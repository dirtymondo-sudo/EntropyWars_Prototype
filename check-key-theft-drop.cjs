'use strict';
// Diagnostic of known defective behavior, not a passing safety regression.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = fs.existsSync(path.join(__dirname, 'battle.js')) ? __dirname : path.join(__dirname, '..');
function extract(file, name) {
 const src = fs.readFileSync(path.join(root, file), 'utf8');
 const start = src.indexOf('        function ' + name + '(');
 const end = src.indexOf('\n        }', start);
 assert.ok(start >= 0 && end > start);
 return src.slice(start, end + 10);
}
let cases = 0;
for (const player of [1, 2]) for (const held of [1, 2]) for (const steal of [false, true]) {
 const thief = {id:'thief',player,x:1,y:1,hourglasses:0,hourglassBuff:0};
 const victim = {id:'victim',player:3-player,x:4,y:4,hourglasses:held,hourglassBuff:0};
 const state = {units:[thief,victim],hourglasses:Array.from({length:held},(_,i)=>({id:'k'+i,carriedBy:victim.id,x:4,y:4,visibleTo:{1:true,2:true}})),hourglassBuffs:{1:0,2:0}};
 const c={state,addLog:()=>{},showFloatingTextForUnit:()=>{},unitDisplayName:u=>u.id,coordLabel:(x,y)=>`${x},${y}`};
 vm.createContext(c);
 vm.runInContext(extract('battle.js','_stealFromUnit')+'\n'+extract('map.js','dropHourglassesFromUnit'),c);
 if (!steal) {
  victim.dead=true; c.dropHourglassesFromUnit(victim);
  assert.equal(state.hourglasses.filter(h=>h.carriedBy===null).length,held);
  assert.equal(victim.hourglasses,0);
  console.log(JSON.stringify({player,initialVictimKeys:held,control:'no theft',loose:held})); cases++; continue;
 }
 const result=c._stealFromUnit(thief,victim,{keys:1,items:0});
 assert.equal(result.keys,1);
 assert.equal(thief.hourglasses,1);
 assert.equal(state.hourglasses.filter(h=>h.carriedBy===thief.id).length,0);
 c.dropHourglassesFromUnit(thief);
 assert.equal(thief.hourglasses,0);
 assert.equal(state.hourglasses.filter(h=>h.carriedBy===victim.id).length,held);
 victim.dead=true;
 c.dropHourglassesFromUnit(victim);
 const stranded=state.hourglasses.filter(h=>h.carriedBy===victim.id).length;
 assert.equal(stranded,held===1?1:0);
 assert.equal(state.hourglasses.filter(h=>h.carriedBy===null).length,held===1?0:2);
 console.log(JSON.stringify({player,initialVictimKeys:held,stolen:result.keys,strandedAfterBothDrop:stranded,loose:state.hourglasses.filter(h=>h.carriedBy===null).length}));
 cases++;
}
console.log(`${cases} cases confirmed using unchanged production theft and drop functions. Full theft strands a Key; partial theft drops both Keys at the victim. No full death pipeline, winner, browser or online acceptance claim.`);
