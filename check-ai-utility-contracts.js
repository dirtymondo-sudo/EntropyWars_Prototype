'use strict';
// Read-only source diagnostic. Emits observations, not gameplay/simulation results.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const data=require('./load-data').loadGameData();
const ai=fs.readFileSync(path.join(__dirname,'ai.js'),'utf8');
const battle=fs.readFileSync(path.join(__dirname,'battle.js'),'utf8');
function slice(a,b){const start=battle.indexOf(a),end=battle.indexOf(b,start+a.length);if(start<0||end<0)throw Error(a);return battle.slice(start,end);}
const unit={id:'caster',player:1,x:3,y:3,z:0,hp:300,maxHp:300,mp:500,ap:3,status:{}};
const ally={id:'ally',player:1,x:3,y:4,z:0,hp:20,maxHp:300,status:{}};
const enemy={id:'enemy',player:2,x:4,y:3,z:0,hp:300,maxHp:300,status:{}};
const g={state:{units:[unit,ally,enemy],mirrors:[]},getEffectiveSpellRange:(u,s)=>s.range,
 getEffectiveRange:()=>1,unitHasStatus:()=>false,isRangeBlockedByTerrain:()=>false,
 TargetQuery:{apCost:s=>s.apCost,canAfford:()=>true}};
const v={allies:[ally],visibleEnemies:[enemy],closestEnemy:enemy};
const ctx={window:{GAME:g},console:{log(){},warn(){}}};vm.createContext(ctx);
const end=ai.lastIndexOf('})();');vm.runInContext(ai.slice(0,end)+
 'window.probe={findSpellTarget,scoreSpell,scoreSpells};'+ai.slice(end),ctx);
const report={scope:'Controlled production function probes; no browser, damage mitigation or gameplay simulation',dispatch:[],tune:[],pulse:[],simul:[]};
for(const id of ['raceChivalry','raceTrickRoom']){
 const s=data.SPELL_BY_ID[id];unit.spells=[s];const out=[];ctx.window.probe.scoreSpells(unit,v,out);
 report.dispatch.push({id,target:ctx.window.probe.findSpellTarget(unit,s,v),candidateCount:out.length});
}
const tune=data.SPELL_BY_ID.raceTuneFrequency;
for(const count of [0,1,2])for(const frequency of [0,1,2]){
 g.state.mirrors=Array.from({length:count},(_,i)=>({owner:1,hp:2,x:i,y:0}));g.state._mirrorFreq={1:frequency};
 unit.spells=[tune];const out=[];ctx.window.probe.scoreSpells(unit,v,out);
 report.tune.push({count,frequency,score:ctx.window.probe.scoreSpell(unit,tune,unit,v),candidateCount:out.length});
}
const net={count:3,beamTiles:new Set(['4,3']),volumeTiles:new Set(),segments:[],isPrism:false,is3DVolume:false};
ctx.window.computeMirrorNetwork=()=>net;g.state.mirrors=[1,2,3].map(x=>({owner:1,hp:2,x,y:0}));
const eng={state:g.state,window:{},Math,Set,unitDisplayName:u=>u.id,addLog(){},playSfx(){},checkWin(){},scheduleBoardRender(){}};
vm.createContext(eng);vm.runInContext(slice('        const MIRROR_FREQS = [','        function _mirrorPowerOf(')+
 slice('        function doPulseLattice(','\n        if (typeof window'),eng);
for(const frequency of [0,1,2]){
 g.state._mirrorFreq={1:frequency};const hits=[];eng.applyDamageToUnit=(u,raw,text,opts)=>hits.push({raw,spellType:opts.spellType,statusEffects:opts.statusEffects});
 eng.applyStatStageBoost=(u,boost)=>hits.push({stageBoost:boost});eng.unit=unit;eng.net=net;
 vm.runInContext('doPulseLattice(unit,net,0)',eng);
 report.pulse.push({frequency,aiScore:ctx.window.probe.scoreSpell(unit,data.SPELL_BY_ID.racePulseLattice,unit,v),engineCalls:hits});
}
const priority=slice('            function _stepPriority(','            function _describeEntry(');
const sort=slice('                const order = entries.slice().sort(', '                if (order[0].unit');
for(const rounds of [0,3]){
 const c={state:{_trickRoomRounds:rounds,_simulInitiative:1},entries:[
 {player:1,unit:{spd:10},plan:{steps:[{type:'attack'}]}},
 {player:2,unit:{spd:90},plan:{steps:[{type:'attack'}]}}]};
 report.simul.push({rounds,firstPlayer:vm.runInNewContext(priority+sort+'order[0].player',c)});
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');
