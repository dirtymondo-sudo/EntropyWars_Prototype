// node bal-families.js <run dirs...>  (ZMIN=1.8 FAM=<family>): each spell family's holders' win rate over balance-lab runs (train_headless.js --lab balance --out <dir>)
const fs=require('fs'),path=require('path');const {loadGameData}=require('./load-data.js');const d=loadGameData();
const byName={};for(const id in d.SPELL_BY_ID){const s=d.SPELL_BY_ID[id];if(s.name)byName[s.name]=s;}
let log=[];for(const dir of process.argv.slice(2))for(const f of fs.readdirSync(dir).filter(f=>/^worker-\d+(c\d+)?\.json$/.test(f))){const s=JSON.parse(fs.readFileSync(path.join(dir,f))).stats;if(s)log.push(...s.matchLog.filter(m=>m&&m.teams&&(m.winner===1||m.winner===2)));}
const fam={};
for(const m of log)for(const p of [1,2])for(const u of m.teams[p]||[]){const fs_=new Set();for(const n of u.spells||[]){const s=byName[n];for(const f of (s&&s.families)||[])fs_.add(f);}
 for(const f of fs_){const n=(u.spells||[]).filter(x=>((byName[x]||{}).families||[]).includes(f)).length;const t=fam[f]||(fam[f]={g:0,w:0,sp:0,spw:0,races:new Set()});t.g++;if(m.winner===p)t.w++;t.sp+=n;if(m.winner===p)t.spw+=n;t.races.add(u.race);}}
const rows=Object.entries(fam).filter(([k,v])=>v.g>=60).map(([k,v])=>({k,g:v.g,wr:v.w/v.g,z:(v.w-v.g/2)/Math.sqrt(v.g/4),nr:v.races.size}));rows.sort((a,b)=>b.z-a.z);
console.log('families',rows.length);for(const r of rows)if(Math.abs(r.z)>(+process.env.ZMIN||1.8)||process.env.FAM===r.k)console.log(r.k.padEnd(18),'g',r.g,(r.wr*100).toFixed(1)+'%','z',r.z.toFixed(2),'races',r.nr);
