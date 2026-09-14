'use strict';
// Reproducible AI-05 residual observation, not a gameplay simulation.
// The actual engine walk and actual AI footprint run on separate controlled
// boards. Wall removal is stubbed; full voxel/door/tree/aftermath parity is open.
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const b=fs.readFileSync(path.join(__dirname,'battle.js'),'utf8');
const a=fs.readFileSync(path.join(__dirname,'ai.js'),'utf8');
const d=require('./load-data').loadGameData();
const config=vm.runInContext('BREACH_CONFIG',d);
function segment(start,end){const i=b.indexOf(start),j=b.indexOf(end,i);if(i<0||j<i)throw Error('Missing engine boundary');return b.slice(i,j);}
const engine=segment('        function spellBreachPower(', '        // ── 🧱 Material drops')
 +segment('        function _lineLosBlocked(', '        function _applyLineDamage(')
 +segment('        function getLineSpellLaneOffsets(', '        function getLineSpellRayTiles(')
 +segment('        function _applyLineDamage(', '            /* Phase 5 wave C')
 +'return {cells:_lineCells,hits:hitTargets.map(t=>t.id),bores:_bores};}';
function run(name,positions,hard=false,occupied=false){
 const walls=new Set(positions);const unit={id:'u',player:1,x:0,y:2,z:0};
 const target={id:'target',player:2,x:4,y:2,z:0,hp:100};
 const blocker={id:'blocker',player:2,x:1,y:2,z:0,hp:100};
 const spell=d.SPELL_BY_ID.racePlasmaCannon;
 const pass=(x,y)=>y!==2||!walls.has(x);
 const los=(x,y,tx,ty)=>{for(let i=x+1;i<=tx;i++)if(walls.has(i)&&ty===2)return true;return false;};
 const g={bw:()=>8,bh:()=>6,isTerrainPassable:pass,isRangeBlockedByTerrain:los};
 const c={window:{GAME:g},console:{log(){},warn(){}},state:{},BREACH_CONFIG:config,
  isInside:(x,y)=>x>=0&&x<8&&y>=0&&y<6,isTerrainPassable:pass,isRangeBlockedByTerrain:los,
  unitAt:(x,y)=>y===2?(x===4?target:occupied&&x===1?blocker:null):null,
  _breachWindowCheck:()=>hard?false:{flat:true},_breachWallAt:(x)=>{walls.delete(x);return [{}];},
  coordLabel:(x,y)=>`${x},${y}`,unit,spell};
 for(const k of ['damageTurretAt','damageDoorAt','addLog','showFloatingTextAtTile','shakeBoard'])c[k]=()=>{};
 vm.createContext(c);const end=a.lastIndexOf('})();');
 vm.runInContext(a.slice(0,end)+'window.footprint=_lineFootprintAI;'+a.slice(end),c);
 const predicted=c.window.footprint(g,unit,spell,1,0).map(t=>`${t.x},${t.y}`);
 const before=[...walls];vm.runInContext(engine,c);
 const actual=c._applyLineDamage(unit,spell,1,0,0,0);
 return {name,wallColumns:before,hard,occupied,aiSeesTarget:predicted.includes('4,2'),
  engineHitsTarget:actual.hits.includes('target'),engineBores:actual.bores,
  limitation:'Controlled successful/failed breach callbacks; not full terrain destruction or damage resolution.'};
}
console.log(JSON.stringify({baseline:'58483d42e0693e9c2aca6dd385792e7f9effb475',
 observations:[run('clear',[]),run('one breakable wall',[1]),run('two breakable walls',[1,2]),
 run('bore budget exhausted',[1,2,3]),run('hard wall',[1],true),run('occupied blocker',[1],false,true)]},null,2));
