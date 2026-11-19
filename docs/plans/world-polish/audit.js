#!/usr/bin/env node
/* THE WORLD AUDIT (2026-11-19, docs/plans/world-polish/PLAN.md; repo-only tooling, changes nothing in the game).
   mondo: "an audit of the world, zone by zone and district by district, to determine which ones are too small or cramped ...
   or which ones need more work visually ... a verticality pass". This MEASURES every plot of every plot-built room that is
   not retired, from the real data (load-data.js + data.js hqTerrainFeet / hqTerrainSolidAt / hqTerrainFluidAt, the same
   reads bake-map.js makes), one sample a 3.5 m square, 144 squares a plot.

   node docs/plans/world-polish/audit.js            every room (about 4 minutes; the Sewers alone take 2)
   node docs/plans/world-polish/audit.js <room> …   only those rooms (the tables then hold only those: do not commit them)

   WRITES, beside this file: plots.csv (every plot), AUDIT_DATA.md (the zone, district and worst-plot tables), need-map.svg.
   Rerun after a zone's pass and commit the three files: the tables are the before / after of the polish work.

   PER PLOT (of its 144 squares):
     walk / solid / water / void   squares you can stand on / a wall, building or tree mass / liquid over your head or the sea / nothing
     tight   walkable squares that touch a square you cannot walk (a path 2 squares wide is 100 % tight, 4 wide 50 %)
     relief  metres between the low and the high walkable squares (3 % trimmed each end)
     levels  height bands of 1.75 m that hold 6+ walkable squares
     ledge   pairs of walkable neighbours 1.5 m+ apart (a drop, a wall top, a roof edge); slope = pairs 0.2 to 1.5 m apart
     arena   the most walkable squares any 8 x 8 window of the plot holds, of 64 (the PvP board; under 44 = no fair fight fits)
     props / kinds   pieces standing on the plot and how many different ones
     the terrain rows on it: ramp (ramp, climb, spiral), bridge (bridge, deck), fall, water (stream, pool), mound (plateau, hill, ridge, dip), rail
   THE THREE SCORES, 0 good to 3 bad: SPACE (arena under 52 / 44 / 36), HEIGHT (relief under 2.5 / 1.2 / 0.6 m, and for 3 also no
   ramp, bridge, fall or mound row and under 6 slope pairs), DRESSING (pieces under 24 / 14 / 6; pieces = props + the drawn rows arch, texbuilding and tree). NEED = their sum, 0 to 9.
   A plot more than half water or void scores SPACE and HEIGHT on the land it has. Scores are a first sort, not a verdict: a tunnel
   is narrow on purpose and a salt flat is flat on purpose; PLAN.md says which low scores are meant. */
'use strict';
const fs=require('fs'),path=require('path');const REPO=path.join(__dirname,'..','..','..');
const S=require(REPO+'/load-data.js').loadGameData();const H=S.DOOR_HQ,ROOMS=H.rooms;const SQ=3.5,PL=42,OUT=__dirname;
const KIND_RX=[[14,/gold|gilded/i],[11,/cloud|heaven|holy|halo/i],[5,/snow|ice|frost|glacier|polar|tundra|igloo/i],[10,/lava|magma|ember/i],[9,/scorch|ash|burnt|char|obsidian|basalt|soot|wasteland/i],[12,/mars|rust|red_?rock|clay|terracotta|flesh|storm/i],[13,/crystal|astral|void|nebula|cosmic|gem|glow/i],[15,/metal|steel|grate|plate|iron|chrome|hull|tech|scifi|sci_fi|panel|holo|alumin/i],[8,/wood|plank|deck|board|parquet|bamboo/i],[7,/^urban:|dungeon|concrete|asphalt|road|slab|tile|cobble|brick|flagstone|marble|pave|sidewalk|stone_floor|floor|carpet|terrazzo|granite|limestone|sandstone_block|street/i],[4,/sand|desert|dune|beach|shore/i],[2,/grass_dark|dark_fantasy|swamp|marsh|bog|moss|jungle|fern/i],[1,/grass|lawn|meadow|turf|leaf|leaves|forest|field|hay|corn|crop|garden/i],[3,/dirt|mud|soil|earth|path|trail|ground|loam|peat|farm/i],[6,/rock|stone|cliff|rubble|gravel|crater|regolith|moon|lunar|cave|cavern|pebble|boulder|slate/i]];
const kindOf=k=>{k=String(k||'');for(const [i,rx] of KIND_RX)if(rx.test(k))return i;return 6;};
const HARD=new Set([7,8,15,14]);
function plotsOf(id,room){
  if(id==='site_prebuilt_downtown_streets'){const CL=JSON.parse(fs.readFileSync(REPO+'/docs/disaster-city/city-layout.json','utf8')),MV=require(REPO+'/docs/disaster-city/move.js'),HL=JSON.parse(fs.readFileSync(REPO+'/docs/disaster-city/hills-layout.json','utf8'));
    const home={};CL.districts.forEach(d=>{home[d.id]=[d.gx,d.gy];});const out=[];
    CL.plots.forEach(p=>{const hm=home[p.d],to=MV.to[p.d];out.push({id:p.id,name:p.name,d:p.d,c:p.x-hm[0]*4+to[0]*4,r:p.y-hm[1]*4+to[1]*4+3});});
    HL.plots.forEach(p=>{const m=/^H(\d+)-(\d+)$/.exec(p.id);if(m)out.push({id:p.id,name:p.name,d:'N',c:+m[1],r:+m[2]});});
    return {ox:-252,oz:-378,plots:out};}
  const P=room.plots||{};const out=[];let names=(P.names||[]).map(n=>{const m=/^P(\d+)-(\d+)$/.exec(n[0]);return m?{id:n[0],name:n[1],d:String(n[2]),c:+m[1],r:+m[2]}:null;}).filter(Boolean);
  const cols=P.nx||P.n||Math.round(room.shell.w/PL);const x0=Math.min(...names.map(n=>n.c)),xm=Math.max(...names.map(n=>n.c));
  const sh=(P.x0!=null)?P.x0:((x0>0&&xm-x0<cols&&xm>=cols)?x0:0);const shy=P.y0||0;names.forEach(n=>{n.c-=sh;n.r-=shy;});
  return {ox:-room.shell.w/2,oz:-room.shell.d/2,plots:names};}
function audit(id){const room=ROOMS[id];const t0=Date.now();const info=S.hqTerrainInfo(id);const sh=room.shell,nx=Math.round(sh.w/SQ),nz=Math.round(sh.d/SQ);
  const paintAt=(x,z)=>{if(!info.paint)return info.floor;const i=Math.round((x-info.x0)/info.res),j=Math.round((z-info.z0)/info.res);if(i<0||j<0||i>=info.nx||j>=info.nz)return info.floor;const v=info.paint.P[j*info.nx+i];return v?info.paint.pal[v-1]:info.floor;};
  const Y=new Float32Array(nx*nz),F=new Uint8Array(nx*nz),G=new Uint8Array(nx*nz);// F:1 walk,2 solid,4 fluid,8 void
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i,x=-sh.w/2+SQ/2+i*SQ,z=-sh.d/2+SQ/2+j*SQ;let y=null,f=null,solid=false;
    try{y=S.hqTerrainFeet(info,x,z,null);}catch(e){}try{f=S.hqTerrainFluidAt(info,x,z);}catch(e){}try{solid=!!(S.hqTerrainSolidAt(info,x,z,0)||S.hqTerrainWallAt(info,x,z,0.3));}catch(e){}
    G[k]=kindOf(paintAt(x,z));
    if(y==null||!isFinite(y)){Y[k]=NaN;F[k]=solid?2:(f?4:8);continue;}
    Y[k]=y;if(solid)F[k]=2;else if(f&&(f.sea||(f.y!=null&&f.y>y+0.6)))F[k]=4;else F[k]=1|(f?16:0);}
  // clearance (chebyshev distance to nearest non-walk), capped 6
  const C=new Uint8Array(nx*nz);for(let k=0;k<nx*nz;k++)C[k]=(F[k]&1)?6:0;
  for(let pass=1;pass<6;pass++){for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i;if(C[k]<pass)continue;let ok=true;
    for(let dj=-1;dj<=1&&ok;dj++)for(let di=-1;di<=1;di++){const a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=nz||C[b*nx+a]<pass){ok=false;break;}}
    if(!ok)C[k]=pass;}}
  const P=plotsOf(id,room);const feats=(room.terrain&&room.terrain.features)||[];const props=room.props||[];
  const pc=(x,z)=>Math.floor((x-P.ox)/PL)+','+Math.floor((z-P.oz)/PL);
  const fBy={},pBy={};
  feats.forEach(f=>{if(f.k==='space'||f.k==='scatter')return;let x=f.x,z=f.z;if(x==null&&f.x0!=null){x=(f.x0+f.x1)/2;z=(f.z0+f.z1)/2;}if(x==null&&Array.isArray(f.pts)&&f.pts.length){const q=f.pts[Math.floor(f.pts.length/2)];x=q[0]!=null?q[0]:q.x;z=q[1]!=null?q[1]:q.z;}if(x==null||!isFinite(x)||!isFinite(z))return;const o=fBy[pc(x,z)]||(fBy[pc(x,z)]={});o[f.k]=(o[f.k]||0)+1;});
  props.forEach(p=>{const o=pBy[pc(p.x||0,p.z||0)]||(pBy[pc(p.x||0,p.z||0)]={n:0,keys:{},stair:0,skate:0});o.n++;o.keys[p.key]=1;if(/stair|ladder|steps/i.test(p.key||''))o.stair++;if(/rail|halfpipe|half_pipe|quarter|skate|funbox|kicker|grind/i.test(p.key||''))o.skate++;});
  const rows=[];
  for(const p of P.plots){const i0=Math.round((P.ox+p.c*PL+sh.w/2)/SQ),j0=Math.round((P.oz+p.r*PL+sh.d/2)/SQ);
    let walk=0,solid=0,fluid=0,voidn=0,wet=0,hard=0,tight=0,open=0,ledge=0,slope=0,flat=0;const hs=[];const kinds={};
    for(let j=j0;j<j0+12;j++)for(let i=i0;i<i0+12;i++){if(i<0||j<0||i>=nx||j>=nz){voidn++;continue;}const k=j*nx+i,f=F[k];
      if(f&1){walk++;hs.push(Y[k]);if(f&16)wet++;if(HARD.has(G[k]))hard++;kinds[G[k]]=(kinds[G[k]]||0)+1;if(C[k]<=1)tight++;if(C[k]>=3)open++;
        let fl=true;for(const [di,dj] of [[1,0],[0,1]]){const a=i+di,b=j+dj;if(a>=nx||b>=nz)continue;const k2=b*nx+a;if(!(F[k2]&1))continue;const dh=Math.abs(Y[k2]-Y[k]);if(dh>=1.5)ledge++;else if(dh>=0.2)slope++;if(dh>=0.2)fl=false;}
        if(fl)flat++;}
      else if(f&2)solid++;else if(f&4)fluid++;else voidn++;}
    hs.sort((a,b)=>a-b);const q=t=>hs.length?hs[Math.min(hs.length-1,Math.floor(t*hs.length))]:0;
    // levels: distinct height bands of 1.75 m holding >=6 squares
    const bands={};hs.forEach(h=>{const b=Math.round(h/1.75);bands[b]=(bands[b]||0)+1;});const levels=Object.values(bands).filter(n=>n>=6).length;
    // best 8x8 arena window
    let best=0,bestRel=0;for(let j=j0;j<=j0+4;j++)for(let i=i0;i<=i0+4;i++){let w=0,lo=1e9,hi=-1e9;for(let b=j;b<j+8;b++)for(let a=i;a<i+8;a++){if(a<0||b<0||a>=nx||b>=nz)continue;const k=b*nx+a;if(F[k]&1){w++;if(Y[k]<lo)lo=Y[k];if(Y[k]>hi)hi=Y[k];}}if(w>best||(w===best&&hi-lo>bestRel)){best=w;bestRel=w?hi-lo:0;}}
    const fk=fBy[p.c+','+p.r]||{},pk=pBy[p.c+','+p.r]||{n:0,keys:{},stair:0,skate:0};
    rows.push({c:p.c,r:p.r,room:id,label:room.label,zone:room._zlZone||(id==='site_prebuilt_downtown_streets'?'city':''),id:p.id,name:p.name,d:p.d,walk,solid,fluid,void:voidn,wet,hard,tight,open,ledge,slope,flat,relief:+(q(0.97)-q(0.03)).toFixed(1),lo:+q(0).toFixed(1),hi:+q(1).toFixed(1),levels,arena:best,arenaRel:+bestRel.toFixed(1),props:pk.n,propKinds:Object.keys(pk.keys).length,stairProps:pk.stair,skateProps:pk.skate,feats:fk});}
  // room-level
  let rw=0,rs=0,rf=0;const ah=[];for(let k=0;k<nx*nz;k++){if(F[k]&1){rw++;ah.push(Y[k]);}else if(F[k]&2)rs++;else if(F[k]&4)rf++;}ah.sort((a,b)=>a-b);
  const fc={};feats.forEach(f=>fc[f.k]=(fc[f.k]||0)+1);
  return {room:{id,label:room.label,zone:room._zlZone||'',w:sh.w,d:sh.d,open:!!sh.open,plots:P.plots.length,walk:rw,solid:rs,fluid:rf,lo:ah[0]||0,hi:ah[ah.length-1]||0,relief:ah.length?+(ah[Math.floor(ah.length*0.97)]-ah[Math.floor(ah.length*0.03)]).toFixed(1):0,props:props.length,feats:fc,stairs:(room.terrain.stairs||[]).length||0,doors:(room.doors||[]).length,npc:(room.npcSpots||[]).length,world:room.world||null,s:((Date.now()-t0)/1000).toFixed(0)},plots:rows};}
/* ── THE RUN ── */
const args=process.argv.slice(2).filter(a=>!a.startsWith('--'));const retired=H.retired||{};
const ids=(args.length?args:Object.keys(ROOMS).filter(i=>!retired[i]&&(ROOMS[i].plots||i==='site_prebuilt_downtown_streets'))).sort();
const ALL=[],RS=[];let openSpace=0;for(const id of ids){const r=audit(id);RS.push(r.room);
  /* Outer Space is ONE room you fly through: a plot of it with nothing on it and no height is the gap between two worlds, not a place */
  const keep=r.plots.filter(p=>!(p.zone==='space'&&p.props===0&&!Object.keys(p.feats).length&&p.relief<0.6));openSpace+=r.plots.length-keep.length;ALL.push(...keep);process.stderr.write(id+' '+r.room.s+'s\n');}
/* the scores */
const land=p=>p.walk+p.solid;
for(const p of ALL){const f=p.feats,made=(f.ramp||0)+(f.climb||0)+(f.spiral||0)+(f.bridge||0)+(f.deck||0)+(f.fall||0)+(f.plateau||0)+(f.hill||0)+(f.ridge||0)+(f.dip||0);
  p.S=p.arena<36?3:p.arena<44?2:p.arena<52?1:0;p.V=p.relief<0.6?((made===0&&p.slope<6)?3:2):p.relief<1.2?2:p.relief<2.5?1:0;p.dress=p.props+(f.arch||0)+(f.texbuilding||0)+(f.tree||0);p.A=p.dress<6?3:p.dress<14?2:p.dress<24?1:0;
  if(p.walk<8){p.S=3;p.V=0;}p.need=p.S+p.V+p.A;p.short=p.room.replace('site_prebuilt_','').replace('site_','');}
/* district names: each zone's layout.json; the city's are bake-map.js CITY_DN */
const CITY_DN={C:'Civic Center',F:'Financial',E:'Entertainment',U:'University',H:'Hero Plaza',B:'Bayside',R:'Southside',S:'Sports + Culture',I:'Industrial',N:'The Hollywood Hills'};
const FOLDER={city:null,olympus:'mountains',hell:'afterlife',catacombs:'afterlife',vatican:'afterlife',heaven:'afterlife'};const DN={};
const dname=p=>{const z=p.zone;if(z==='city')return CITY_DN[p.d]||p.d;if(p.d.length>2)return p.d;if(z==='routes')return 'the road';
  if(!(z in DN)){DN[z]={};try{const L=JSON.parse(fs.readFileSync(path.join(REPO,'docs/areas',FOLDER[z]||z,'layout.json'),'utf8'));const add=d=>{if(!d)return;Object.keys(d).forEach(k=>{const v=d[k];DN[z][k]=String(typeof v==='string'?v:(v&&v.name)||k).replace(/\s*\(NEW\)/,'');});};add(L.districts);(Array.isArray(L.rooms)?L.rooms:[]).forEach(r=>add(r&&r.districts));}catch(e){}}
  return DN[z][p.d]||(p.d==='R'?'the road':p.d==='T'&&z==='cavern'?'the tunnel':p.d);};
ALL.forEach(p=>{p.dn=dname(p);});
/* room to grow: free One World plots beside each placed room */
const PJ=JSON.parse(fs.readFileSync(path.join(REPO,'docs/plans/one-world/plots.json'),'utf8')),GR=PJ.ground;const at={surface:{},under:{}},place={};
for(const r of RS){let w=r.world;if(r.id==='site_prebuilt_downtown_streets')w={layer:'surface',wx:0,wy:-3};if(!w||w.wx==null||!at[w.layer])continue;place[r.id]=w;ALL.filter(p=>p.room===r.id).forEach(p=>{p.wx=w.wx+p.c;p.wy=w.wy+p.r;p.layer=w.layer;at[w.layer][p.wx+','+p.wy]=r.id;});}
const gk=(x,y)=>{const row=GR.rows[y-GR.y0],ch=row?row[x-GR.x0]:null;return ch&&GR.key[ch]?GR.key[ch].kind:'off';};
const grow={};for(const id of Object.keys(place)){const L=place[id].layer,seen={};let free=0,sea=0;ALL.filter(p=>p.room===id).forEach(p=>{for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(p.wx+dx)+','+(p.wy+dy);if(seen[k])continue;seen[k]=1;if(at[L][k])continue;const g=gk(p.wx+dx,p.wy+dy);if(g==='off')continue;if(g==='sea'||g==='ice'||g==='wall')sea++;else free++;}});grow[id]={free,sea};}
/* roll-ups */
const sum=(a,f)=>a.reduce((t,x)=>t+f(x),0),med=a=>{a=a.slice().sort((x,y)=>x-y);return a.length?a[Math.floor(a.length/2)]:0;},avg=(a,f)=>a.length?sum(a,f)/a.length:0;
const roll=a=>{const n=a.length,w=sum(a,p=>p.walk)||1,ft=(...t)=>sum(a,p=>t.reduce((s,k)=>s+(p.feats[k]||0),0));return {n,walk:Math.round(100*w/(n*144)),tight:Math.round(100*sum(a,p=>p.tight)/w),wide:+(2*w/Math.max(1,sum(a,p=>p.tight))).toFixed(1),
  arena:Math.round(avg(a,p=>p.arena)),noArena:a.filter(p=>p.arena<44).length,relief:med(a.map(p=>p.relief)),span:Math.round(Math.max(...a.map(p=>p.hi))-Math.min(...a.filter(p=>p.walk).map(p=>p.lo).concat([1e9]))),flat:a.filter(p=>p.relief<0.6).length,
  ledge:Math.round(avg(a,p=>p.ledge)),slope:Math.round(avg(a,p=>p.slope)),props:Math.round(avg(a,p=>p.dress)),bare:a.filter(p=>p.dress<6).length,hard:Math.round(100*sum(a,p=>p.hard)/w),
  ramp:ft('ramp','climb','spiral'),bridge:ft('bridge','deck'),fall:ft('fall'),water:ft('stream','pool'),mound:ft('plateau','hill','ridge','dip'),rail:ft('rail')+sum(a,p=>p.skateProps),
  S:+avg(a,p=>p.S).toFixed(1),V:+avg(a,p=>p.V).toFixed(1),A:+avg(a,p=>p.A).toFixed(1),need:+avg(a,p=>p.need).toFixed(1)};};
const group=(key)=>{const g={};ALL.forEach(p=>{const k=key(p);(g[k]||(g[k]=[])).push(p);});return g;};
const label=id=>(ROOMS[id].label||id).replace(/\s*·\s*/g,' · ');
/* plots.csv */
const C=['zone','room','id','name','district','walk','solid','water','void','tight','relief','lo','hi','levels','ledge','slope','flat','arena','arenaRelief','hard','props','pieces','kinds','ramp','bridge','fall','waterRows','mound','rail','S','V','A','need'];
const q=s=>/[",]/.test(String(s))?'"'+String(s).replace(/"/g,'""')+'"':String(s);
fs.writeFileSync(path.join(OUT,'plots.csv'),C.join(',')+'\n'+ALL.map(p=>{const f=p.feats;return [p.zone,p.short,p.id,p.name,p.dn,p.walk,p.solid,p.fluid,p.void,p.tight,p.relief,p.lo,p.hi,p.levels,p.ledge,p.slope,p.flat,p.arena,p.arenaRel,p.hard,p.props,p.dress,p.propKinds,(f.ramp||0)+(f.climb||0)+(f.spiral||0),(f.bridge||0)+(f.deck||0),f.fall||0,(f.stream||0)+(f.pool||0),(f.plateau||0)+(f.hill||0)+(f.ridge||0)+(f.dip||0),(f.rail||0)+p.skateProps,p.S,p.V,p.A,p.need].map(q).join(',');}).join('\n')+'\n');
/* AUDIT_DATA.md */
const M=[];M.push('# THE WORLD AUDIT, the numbers ('+new Date().toISOString().slice(0,10)+')','','Written by `node docs/plans/world-polish/audit.js`; do not edit by hand. What each column means is in that file\'s header; what to do about it is in `PLAN.md`. Every plot: `plots.csv`. The picture: `need-map.svg`.','',
 '**Scores:** 0 good to 3 bad. S = space (does an 8 x 8 board fit), V = height (is there any), A = dressing (does anything stand there). NEED = S + V + A, 0 to 9.','');
M.push('## 1. Every place','','| Place | Zone | Plots | Size (m) | Walkable | Path width (squares) | Board fits (of 64) | Plots no board | Relief a plot (m) | Whole span (m) | Dead-flat plots | Pieces a plot | Bare plots | Free plots beside it | NEED |','|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
const byRoom=group(p=>p.room);const rr=Object.keys(byRoom).map(id=>({id,r:roll(byRoom[id])})).sort((a,b)=>b.r.need-a.r.need);
rr.forEach(({id,r})=>{const s=ROOMS[id].shell,g=grow[id];M.push('| '+label(id)+' `'+id.replace('site_prebuilt_','')+'` | '+(byRoom[id][0].zone)+' | '+r.n+' | '+s.w+' x '+s.d+' | '+r.walk+' % | '+r.wide+' | '+r.arena+' | '+r.noArena+' | '+r.relief+' | '+r.span+' | '+r.flat+' | '+r.props+' | '+r.bare+' | '+(g?g.free+(g.sea?' (+'+g.sea+' sea)':''):'off the map')+' | **'+r.need+'** |');});
M.push('','## 2. Every district','','| Place | District | Plots | Walkable | Path width | Board fits | No board | Relief a plot | Span | Dead flat | Ledges a plot | Slopes a plot | Ramps + stairs | Bridges | Falls | Water rows | Mounds | Rails | Hard ground | Pieces a plot | Bare | S | V | A | NEED |','|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
const byD=group(p=>p.room+'|'+p.dn);Object.keys(byD).map(k=>({k,a:byD[k],r:roll(byD[k])})).sort((a,b)=>(a.a[0].zone+a.k).localeCompare(b.a[0].zone+b.k)).forEach(({a,r})=>{M.push('| '+label(a[0].room)+' | '+a[0].dn+' | '+r.n+' | '+r.walk+' % | '+r.wide+' | '+r.arena+' | '+r.noArena+' | '+r.relief+' | '+r.span+' | '+r.flat+' | '+r.ledge+' | '+r.slope+' | '+r.ramp+' | '+r.bridge+' | '+r.fall+' | '+r.water+' | '+r.mound+' | '+r.rail+' | '+r.hard+' % | '+r.props+' | '+r.bare+' | '+r.S+' | '+r.V+' | '+r.A+' | **'+r.need+'** |');});
M.push('','## 3. The plots that score worst, place by place (NEED 6 and up; at most 12 a place)','');
rr.forEach(({id})=>{const w=byRoom[id].filter(p=>p.need>=6).sort((a,b)=>b.need-a.need||a.arena-b.arena);if(!w.length)return;M.push('**'+label(id)+'** ('+w.length+' of '+byRoom[id].length+'): '+w.slice(0,12).map(p=>p.id+' '+p.name+' ('+p.S+'/'+p.V+'/'+p.A+')').join('; ')+(w.length>12?'; …':''),'');});
fs.writeFileSync(path.join(OUT,'AUDIT_DATA.md'),M.join('\n')+'\n');
/* need-map.svg: the surface and the underground at their One World places, the rest in rows */
{const U=9,pad=30;const col=n=>['#2f7d4f','#3f8f4f','#6aa84f','#9bbb45','#c9c13f','#e3ad3a','#e58a35','#e06632','#d43f30','#b81f2c'][n];
 const sheets=[['THE SURFACE','surface'],['UNDERGROUND + UNDER THE SEA','under']];let y0=pad+20;const parts=[];let W=0;
 for(const [title,L] of sheets){const ps=ALL.filter(p=>p.layer===L);const x0=Math.min(...ps.map(p=>p.wx)),x1=Math.max(...ps.map(p=>p.wx)),ya=Math.min(...ps.map(p=>p.wy)),yb=Math.max(...ps.map(p=>p.wy));
  parts.push('<text x="'+pad+'" y="'+(y0-8)+'" class="t">'+title+'</text>');
  ps.forEach(p=>{parts.push('<rect x="'+(pad+(p.wx-x0)*U)+'" y="'+(y0+(p.wy-ya)*U)+'" width="'+(U-1)+'" height="'+(U-1)+'" fill="'+col(p.need)+'"><title>'+(label(p.room)+' · '+p.id+' '+p.name+' · S'+p.S+' V'+p.V+' A'+p.A).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</title></rect>');});
  Object.keys(place).filter(id=>place[id].layer===L).forEach(id=>{const a=ALL.filter(p=>p.room===id);const cx=avg(a,p=>p.wx),cy=Math.min(...a.map(p=>p.wy));parts.push('<text x="'+(pad+(cx-x0+0.5)*U)+'" y="'+(y0+(cy-ya)*U-2)+'" class="l">'+label(id).replace(/&/g,'&amp;').slice(0,26)+'</text>');});
  W=Math.max(W,pad*2+(x1-x0+1)*U);y0+=(yb-ya+1)*U+pad+26;}
 parts.push('<text x="'+pad+'" y="'+(y0-8)+'" class="t">OFF THE MAP (each place on its own grid)</text>');let x=pad,rowH=0;
 Object.keys(byRoom).filter(id=>!place[id]).forEach(id=>{const a=byRoom[id],c0=Math.min(...a.map(p=>p.c)),c1=Math.max(...a.map(p=>p.c)),r0=Math.min(...a.map(p=>p.r)),r1=Math.max(...a.map(p=>p.r));const u=(c1-c0)>30?4:U;const w=(c1-c0+1)*u,h=(r1-r0+1)*u;if(x+w>Math.max(W,900)-pad){x=pad;y0+=rowH+30;rowH=0;}
  parts.push('<text x="'+x+'" y="'+(y0+8)+'" class="l" style="text-anchor:start">'+label(id).replace(/&/g,'&amp;')+'</text>');a.forEach(p=>{parts.push('<rect x="'+(x+(p.c-c0)*u)+'" y="'+(y0+12+(p.r-r0)*u)+'" width="'+(u-1)+'" height="'+(u-1)+'" fill="'+col(p.need)+'"><title>'+(p.id+' '+p.name+' · S'+p.S+' V'+p.V+' A'+p.A).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</title></rect>');});x+=w+40;rowH=Math.max(rowH,h+12);W=Math.max(W,x);});
 y0+=rowH+40;parts.push('<text x="'+pad+'" y="'+y0+'" class="l" style="text-anchor:start">NEED a plot: </text>');for(let n=0;n<=9;n++)parts.push('<rect x="'+(pad+90+n*22)+'" y="'+(y0-11)+'" width="20" height="14" fill="'+col(n)+'"/><text x="'+(pad+100+n*22)+'" y="'+y0+'" class="k">'+n+'</text>');
 parts.push('<text x="'+(pad+325)+'" y="'+y0+'" class="l" style="text-anchor:start">0 = roomy, has height, dressed · 9 = cramped, dead flat, bare</text>');
 fs.writeFileSync(path.join(OUT,'need-map.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+(y0+pad)+'" viewBox="0 0 '+W+' '+(y0+pad)+'"><style>.t{font:700 13px sans-serif;fill:#eee}.l{font:9px sans-serif;fill:#ddd;text-anchor:middle}.k{font:700 9px sans-serif;fill:#111;text-anchor:middle}</style><rect width="100%" height="100%" fill="#14171c"/>'+parts.join('')+'</svg>\n');}
console.log((openSpace?openSpace+' empty plots of Outer Space left out; ':'')+ALL.length+' plots in '+RS.length+' rooms -> plots.csv, AUDIT_DATA.md, need-map.svg');
