const d=require(require('path').resolve(process.argv[2]));const S=d.data.samples;
const C=S.filter(s=>s.cine),N=S.filter(s=>!s.cine);
const shots=new Set(C.map(s=>s.shot));
function agg(L,label){let pts=0,on=0,bl=0,fd=0,bad=0;for(const s of L){for(const u of s.subs){pts+=u.pts;on+=u.on;bl+=u.blocked;fd+=u.faded}if(s.worst>=0.66)bad++}
console.log(label,'samples',L.length,'points',pts,'onscreen',on,'blocked',bl,(100*bl/Math.max(1,on)).toFixed(1)+'%','faded-through',fd,'| samples with a subject >=2/3 covered:',bad,(100*bad/Math.max(1,L.length)).toFixed(1)+'%')}
agg(C,'CINE');agg(N,'BOARD');
const badShots=new Set(C.filter(s=>s.worst>=0.66).map(s=>s.shot));console.log('shots',shots.size,'shots with a covered subject',badShots.size);
const by={};for(const s of C)for(const u of s.subs)for(const b of u.by){if(b.op<0.5)continue;const k=u.role+' <- '+b.cat+(b.who?':'+b.who:'')+' | '+b.top+' | '+b.chain.slice(0,70)+' | '+b.fl+' | at '+ (b.at<0.34?'near':b.at<0.67?'mid':'far');by[k]=(by[k]||0)+1}
console.log(Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,30).map(e=>e[1]+'  '+e[0]).join('\n'));
const tps={};for(const s of C){const k='tps'+s.tps+' about'+(s.ca&&s.ca.about)+' tilt'+Math.round(s.tilt/10)*10;tps[k]=tps[k]||[0,0];tps[k][0]++;if(s.worst>=0.66)tps[k][1]++}console.log(tps);
const off={};for(const s of C)for(const u of s.subs){off[u.role]=off[u.role]||[0,0];off[u.role][0]+=u.pts;off[u.role][1]+=u.pts-u.on}console.log('offscreen',off);

let fx=0,dom=0,on=0,anyBad=0;const fb={},db={};for(const s of C){if((s.any||0)>=0.66)anyBad++;for(const u of s.subs){on+=u.on;fx+=u.fx||0;dom+=u.dom||0;for(const b of (u.fxBy||[])){const k=(b.sprite?'sprite ':'mesh ')+(b.add?'add ':'')+b.chain.slice(0,60)+' '+(b.at<0.34?'near':b.at<0.67?'mid':'far');fb[k]=(fb[k]||0)+1}for(const k of (u.domBy||[]))db[k]=(db[k]||0)+1}}
console.log('CINE points under an effect',fx,(100*fx/Math.max(1,on)).toFixed(1)+'%','under HUD text',dom,(100*dom/Math.max(1,on)).toFixed(1)+'%','samples any-cover>=2/3:',anyBad,(100*anyBad/Math.max(1,C.length)).toFixed(1)+'%');
const top=(o,n)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n).map(e=>e[1]+'  '+e[0]).join('\n');
console.log('FX\n'+top(fb,18));console.log('DOM\n'+top(db,18));
let nb=0,nd=0,non=0;for(const s of N)for(const u of s.subs){non+=u.on;nd+=u.dom||0}console.log('BOARD under HUD text',nd,'of',non);

const picks={};for(const s of C){if(s.cs&&s.cs.shot===s.shot)picks[s.shot]=s.cs}
const P=Object.values(picks);console.log('picks',P.length,'turned',P.filter(p=>p.yaw).length,'raised',P.filter(p=>p.tilt).length,'boxes avg',(P.reduce((a,p)=>a+p.boxes,0)/Math.max(1,P.length)).toFixed(0),'own cost avg',(P.reduce((a,p)=>a+p.own,0)/Math.max(1,P.length)).toFixed(2),'picked cost avg',(P.reduce((a,p)=>a+p.cost,0)/Math.max(1,P.length)).toFixed(2));
console.log(P.filter(p=>p.yaw||p.tilt).map(p=>JSON.stringify(p)).join('\n'));
