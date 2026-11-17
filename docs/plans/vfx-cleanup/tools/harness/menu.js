const out=[];const seen=new Set();
const cand=new Set(document.querySelectorAll('button,[role=button],.hrlg-blade,.hrlg-confirm-inline,[class*=btn],[class*=confirm],[onclick]'));
for(const el of document.querySelectorAll('div,span,a')){ if(el.childElementCount<=4 && /CONFIRM/.test(el.textContent||'') && (el.textContent||'').length<60) cand.add(el); }
for(const el of cand){
 const r=el.getBoundingClientRect(); if(r.width<4||r.height<4||r.bottom<0||r.top>innerHeight) continue;
 const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity<0.05) continue;
 const x=Math.round(r.left+r.width/2),y=Math.round(r.top+r.height/2); const top=document.elementFromPoint(x,y); if(!top||!(el===top||el.contains(top)||top.contains(el))) continue;
 const t=(el.innerText||'').replace(/\s+/g,' ').trim().slice(0,50); const k=x+','+y; if(seen.has(k))continue; seen.add(k);
 out.push([x,y,t,(el.className||'').toString().slice(0,40)]);}
return out;
