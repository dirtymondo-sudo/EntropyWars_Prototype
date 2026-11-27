#!/usr/bin/env node
/* find-bumps.js — THE ROAD SCANNER (2026-11-27, repo-only tooling; mondo: "a street that is all messed up bc it has this a big bump and its not
   connected to the next part of the street smoothly"). Walks every `terrain.gen.streets` row of a room on the walker's own feet (data.js
   hqTerrainFeet), down its middle and both outer lanes, and lists: STEP (the road jumps 0.3 m or more in half a metre), BUMP / DIP (it climbs
   and falls again, or the other way, by 0.6 m or more within 60 m). `sq` = the 3.5 m square from the room's north-west corner, `xz` = the F3 line's
   metres.   node find-bumps.js [room id]     (about 90 s for Disaster City)   Notes: docs/notes/areas-complexes.md "THE SPREAD, THE POLISH PASS". */
const vm=require('vm');const D=require('./load-data.js').loadGameData();
const room=process.argv[2]||'site_prebuilt_downtown_streets';
const res=vm.runInContext(`(()=>{const id=${JSON.stringify(room)};const info=hqTerrainInfo(id);const T=DOOR_HQ.rooms[id].terrain;const out=[];
const sq=(x,z)=>[Math.floor((x+info.halfW)/3.5),Math.floor((z+info.halfD)/3.5)];
(T.gen.streets||[]).forEach((st,si)=>{const w=st.w||14;for(let q=0;q+1<st.pts.length;q++){const a=st.pts[q],b=st.pts[q+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<1)continue;const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;
 for(const off of [0,-(w/2-1.75),(w/2-1.75)]){const prof=[];let py=null;for(let s=0;s<=L;s+=0.5){const x=a[0]+ux*s-uz*off,z=a[1]+uz*s+ux*off;let y=hqTerrainFeet(info,x,z,py);if(y==null){py=null;prof.push(null);continue;}prof.push([s,y,x,z]);py=y;}
  for(let n=1;n<prof.length;n++){const p=prof[n-1],c=prof[n];if(!p||!c)continue;if(Math.abs(c[1]-p[1])>0.3)out.push({t:'STEP',si,off,d:+(c[1]-p[1]).toFixed(2),x:+c[2].toFixed(1),z:+c[3].toFixed(1),sq:sq(c[2],c[3])});}
  // zigzag extrema
  const P=prof.filter(Boolean);if(P.length<3)continue;let dir=0,ext=P[0],lo=P[0],hi=P[0];const pts=[];
  for(const c of P){ if(dir===0){ if(c[1]>hi[1])hi=c; if(c[1]<lo[1])lo=c; if(c[1]<hi[1]-0.5){pts.push(P[0]===hi?P[0]:P[0]);if(hi!==P[0]){}; pts.length=0; pts.push(hi===P[0]?P[0]:P[0]); if(hi!==P[0])pts.push(hi); dir=-1;ext=c;} else if(c[1]>lo[1]+0.5){pts.length=0;pts.push(P[0]); if(lo!==P[0])pts.push(lo); dir=1;ext=c;} continue; }
   if(dir>0&&c[1]>ext[1])ext=c; if(dir<0&&c[1]<ext[1])ext=c;
   if(dir>0&&c[1]<ext[1]-0.5){pts.push(ext);dir=-1;ext=c;} else if(dir<0&&c[1]>ext[1]+0.5){pts.push(ext);dir=1;ext=c;}}
  if(!pts.length)continue;
  pts.push(ext);
  for(let n=1;n+1<pts.length;n++){const A=pts[n-1],B=pts[n],Cc=pts[n+1];const r1=B[1]-A[1],r2=Cc[1]-B[1];if(Math.sign(r1)!==Math.sign(r2)&&Math.min(Math.abs(r1),Math.abs(r2))>=0.6&&Cc[0]-A[0]<60)out.push({t:r1>0?'BUMP':'DIP',si,off,h:+Math.min(Math.abs(r1),Math.abs(r2)).toFixed(2),x:+B[2].toFixed(1),z:+B[3].toFixed(1),sq:sq(B[2],B[3]),span:+(Cc[0]-A[0]).toFixed(1)});}
 }}});
return JSON.stringify(out);})()`,D);
const out=JSON.parse(res);
// group by square proximity
const seen=[];out.forEach(o=>{const g=seen.find(s=>s.t===o.t&&Math.abs(s.sq[0]-o.sq[0])<=2&&Math.abs(s.sq[1]-o.sq[1])<=2);if(g){g.n++;if((o.h||Math.abs(o.d))>(g.h||Math.abs(g.d)))Object.assign(g,o,{n:g.n});}else seen.push(Object.assign({n:1},o));});
seen.sort((a,b)=>a.sq[1]-b.sq[1]||a.sq[0]-b.sq[0]);
console.log(seen.length+' groups');seen.forEach(s=>console.log(s.t.padEnd(5),'sq',s.sq.join(','),'xz',s.x,s.z,'h',s.h??s.d,'street',s.si,'n',s.n));
