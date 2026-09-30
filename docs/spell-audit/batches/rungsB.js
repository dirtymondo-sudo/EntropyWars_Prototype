const { loadGameData } = require('/home/user/EntropyWars_Prototype/load-data.js');
const g=loadGameData(); const old=loadGameData({file: process.argv[2]});
const s7=require(process.argv[3]);
const NEW={ 'Roll Credits':'raceRollCredits','Disintegrator':'raceDisintegrator','Entangling Roots':'raceEntanglingRoots','Bone Lance':'raceBoneLance','Scrap Mine':'raceScrapMine','Car Toss':'raceCarToss','Rot':'raceRot','Long Bomb':'raceLongBomb','Web Swing':'raceWebSwing','Empty the Clip':'raceEmptyTheClip','Soothe':'raceSoothe','Brood':'raceBrood',"Dead Man's Hand":'raceDeadMansHand','Double Down':'raceDoubleDown','Petrify':'racePetrify','Sprint':'raceSprint','Vault':'raceVault' };
const byName=(G)=>{const m={}; const seen=new Set(); for (const [k,s] of Object.entries(G.SPELL_BY_ID)) { if(!s||seen.has(s.id)) continue; seen.add(s.id); (m[s.name]=m[s.name]||[]).push(s.id);} return m;};
const oldN=byName(old), curN=byName(g);
function res(name, race, slot){ if (race==='watcher'&&slot===3&&name==='Time Rewind') return 'raceTimeRewindHeal';
  if (NEW[name]) return NEW[name]; const o=oldN[name]||curN[name]; if(!o) return '??'+name; if(o.length>1) return '?AMBIG '+name+' '+o.join(','); return o[0]; }
const T=g.RACE_TREE; const newTree={}; const probs=[];
for (const [race,v] of Object.entries(s7)) { if (v.rungs==='—') continue;
  const tree=JSON.parse(JSON.stringify(T[race])); 
  for (const part of v.rungs.split('; ')) { const m=/^(\d): (.+) → (.+)$/.exec(part); if(!m){probs.push(race+' parse '+part);continue;}
    const n=+m[1]; const from=m[2].split('/').map(x=>res(x,race,n)); const to=m[3].split('/').map(x=>res(x,race,n));
    const cur=[].concat(tree[n-1]); const curIds=cur.map(id=>(old.SPELL_BY_ID[id]||g.SPELL_BY_ID[id]||{id}).id);
    if (from.join()!==curIds.join()) probs.push(`${race}#${n} from ${from.join('/')} but tree has ${curIds.join('/')}`);
    for (const t of to) if (t.startsWith('?')) probs.push(`${race}#${n} unresolved ${t}`);
    tree[n-1]= to.length===1?to[0]:to; }
  newTree[race]=tree; }
require('fs').writeFileSync(process.argv[4], JSON.stringify(newTree,null,0));
console.log(Object.keys(newTree).length); console.log(probs.join('\n'));
