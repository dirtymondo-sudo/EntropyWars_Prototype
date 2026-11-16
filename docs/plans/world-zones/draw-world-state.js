const fs=require('fs');
const S=30, X0=-17.5, Y0=-12.5, W1=45.5, H1=44;         // surface panel in plots
const LEG=430, PADT=110;
const px=x=>(x-X0)*S+20, py=y=>(y-Y0)*S+PADT;
const U0=PADT+H1*S+90;                                   // underground panel top
const UX0=-17.5, UY0=-5, UH=31; const ux=x=>(x-UX0)*S+20, uy=y=>(y-UY0)*S+U0;
const Wd=W1*S+40+LEG, Ht=U0+UH*S+40;
const C={built:'#2f7d4f',old:'#a8741a',hq:'#8a6a1f',sea:'#1f4f8a',ink:'#f2f2f2',dim:'#9aa3ad',bg:'#14161a',pick:'#ffd23f',miss:'#ff5a5a',way:'#6ee58a',hid:'#ff8ad8'};
let o=[];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
function txt(x,y,s,sz=13,fill=C.ink,w=400,anchor='start'){o.push(`<text x="${x}" y="${y}" font-size="${sz}" fill="${fill}" font-weight="${w}" text-anchor="${anchor}">${esc(s)}</text>`)}
function zone(fx,fy,x,y,w,h,name,state,sub,opt={}){
  const X=fx(x),Y=fy(y),Wp=w*S,Hp=h*S; const col=state==='built'?C.built:state==='hq'?C.hq:C.old;
  o.push(`<rect x="${X}" y="${Y}" width="${Wp}" height="${Hp}" fill="${col}" fill-opacity="${opt.faint?0.0:0.55}" stroke="${opt.pick?C.pick:opt.faint?'#666':col}" stroke-width="${opt.pick?5:2}" ${state==='old'&&!opt.faint?'stroke-dasharray="8 5"':''} ${opt.faint?'stroke-dasharray="3 5"':''}/>`);
  if(!opt.faint&&!opt.nogrid){for(let i=1;i<w;i++)o.push(`<line x1="${X+i*S}" y1="${Y}" x2="${X+i*S}" y2="${Y+Hp}" stroke="#000" stroke-opacity=".18"/>`);for(let j=1;j<h;j++)o.push(`<line x1="${X}" y1="${Y+j*S}" x2="${X+Wp}" y2="${Y+j*S}" stroke="#000" stroke-opacity=".18"/>`)}
  if(opt.faint){txt(X+6,Y+15,name,11,'#777');return}
  const lines=[].concat(sub||[]); const ty=Y+(opt.top?20:Hp/2-(lines.length*14)/2+2);
  txt(X+Wp/2,ty,(opt.pick?opt.pick+'  ':'')+name,opt.small?12:15,opt.pick?C.pick:C.ink,700,'middle');
  lines.forEach((l,i)=>txt(X+Wp/2,ty+17+i*14,l,10.5,'#e6e6e6',400,'middle'));
}
function way(fx,fy,x1,y1,x2,y2,kind,label,lx=6,ly=-5){const col=kind==='miss'?C.miss:kind==='hid'?C.hid:C.way;
  o.push(`<line x1="${fx(x1)}" y1="${fy(y1)}" x2="${fx(x2)}" y2="${fy(y2)}" stroke="${col}" stroke-width="4" ${kind!=='way'?'stroke-dasharray="7 5"':''} stroke-linecap="round"/>`);
  [[x1,y1],[x2,y2]].forEach(p=>o.push(`<circle cx="${fx(p[0])}" cy="${fy(p[1])}" r="5" fill="${col}" stroke="#000"/>`));
  if(label){const X=fx((x1+x2)/2)+lx,Y=fy((y1+y2)/2)+ly;o.push(`<rect x="${X-3}" y="${Y-11}" width="${label.length*6.1+6}" height="15" fill="#000" fill-opacity=".72"/>`);txt(X,Y,label,10.5,col,600)}}
function hq(fx,fy,x,y,label){const X=fx(x),Y=fy(y);o.push(`<rect x="${X-5}" y="${Y-8}" width="10" height="16" fill="${C.pick}" stroke="#000"/>`);o.push(`<rect x="${X+8}" y="${Y-8}" width="${label.length*6+6}" height="15" fill="#000" fill-opacity=".72"/>`);txt(X+11,Y+3,label,10.5,C.pick,600)}
o.push(`<rect width="${Wd}" height="${Ht}" fill="${C.bg}"/>`);
txt(20,36,'ENTROPY WARS · THE WORLD AS IT STANDS · 2026-11-16',24,C.ink,700);
txt(20,60,'Built zones are drawn at their real size from the game data (one small square = one plot, 42 m). Zones not yet built are placed as on your approved layout 3. North is up.',13,C.dim);
txt(20,92,'1.  THE SURFACE',17,C.ink,700);
// sea + land backdrop
o.push(`<rect x="20" y="${PADT}" width="${W1*S}" height="${H1*S}" fill="#1b2a1f"/>`);
o.push(`<rect x="${px(12)}" y="${PADT}" width="${(X0+W1-12)*S}" height="${(27-Y0)*S}" fill="${C.sea}" fill-opacity=".55"/>`);
o.push(`<rect x="20" y="${py(26)}" width="${W1*S}" height="${(Y0+H1-26)*S}" fill="#cfe1ee" fill-opacity=".25"/>`);
txt(px(21),py(-6),'THE OCEAN',16,'#bcd4f2',700,'middle'); txt(px(-14),py(21),'deep forest + scrub (edge, not a zone)',11,C.dim);
const f=[px,py];
zone(...f,-16,-10,4,4,'NORTH POLE','built',['village · 16'],{small:1});
zone(...f,-12,-11,12,8,'THE MOUNTAINS','built',['Snowy Pass · Ski Lodge + slopes','Mount Shasta · Mount Olympus','96 plots']);
zone(...f,0,-3,13,3,'THE HOLLYWOOD HILLS','built',['Disaster City’s north district · 39 plots','ONE room with the city: you walk or drive up, no door']);   // (2026-11-16: part of the city's room, was a room of the Mountains)
zone(...f,-4,-3,4,4,'THE VATICAN','old',['old rooms · plan 16','Heaven over it','Hell under it'],{small:1,pick:'②'});
zone(...f,-14,0,8,8,'CAMELOT KINGDOM','built',['The Castle · The Village','The Snowy Pines · The Fairy Forest','Looking-Glass Garden · The Forest','64 plots  (sky castle: old room)']);
zone(...f,-6,1,6,6,'THE WOODS','built',['Redwood Trail · Ritual Ground','The Clearing · Dead Man’s Cave','36 plots']);
zone(...f,-6,7,6,6,'THE ESTATE','built',['Corn Fields · The Ranch','Haunted House + Graveyard','The Lake · 36 plots']);
// city with districts
zone(...f,0,0,12,12,'','built',[],{nogrid:1});
const D=[['Civic Center','Financial','Entertainment'],['University','Hero Plaza','Bayside'],['Sports + Culture','Southside','Industrial']];
D.forEach((r,j)=>r.forEach((n,i)=>{o.push(`<rect x="${px(i*4)}" y="${py(j*4)}" width="${4*S}" height="${4*S}" fill="none" stroke="#000" stroke-opacity=".45"/>`);txt(px(i*4+2),py(j*4+2.2),n,11,'#e6e6e6',400,'middle')}));
txt(px(6),py(3.5),'DISASTER CITY · 144 + 39 plots',15,C.ink,700,'middle');
o.push(`<rect x="${px(0)}" y="${py(-3)}" width="${13*S}" height="${3*S}" fill="none" stroke="${C.ink}" stroke-width="3"/>`);o.push(`<path d="M${px(0)} ${py(0)} V${py(12)} H${px(12)} V${py(0)}" fill="none" stroke="${C.ink}" stroke-width="3"/>`);   // one outline round the city + its Hills: one room
zone(...f,0,12,12,12,'THE DESERT','built',['The Highway · The Circus','Western Town · Area 51 · Giza','144 plots']);
zone(...f,12,1,14,10,'THE BEACH','built',['The Shore · The Harbour','The Ocean · The Bermuda Triangle','140 plots (a sea room)']);
zone(...f,12,17,9,5,'LEYLINES','old',['Göbekli Tepe · Stonehenge · Babel','Technoticlan · Bug Colony (new)','old rooms · plan 45']);
zone(...f,4,27,4,3,'ANTARCTICA','old',['old room · plan 12'],{small:1});
// ways
txt(px(8.75),py(-0.15),'▲ mountain road',10.5,C.way,600,'middle'); txt(px(12.5),py(-0.15),'▲ cove',10.5,C.way,600,'middle');   // (2026-11-16: ground you walk, not doors)
way(...f,-0.01,-2.2,0,-2.2,'way','');
way(...f,-12,-8,-12.01,-8,'way','the Pass Gate',8,-8);
way(...f,-5,-3,-5,1,'way','snowline trail',-92,4);
way(...f,-13,-6,-12,0,'way','sleigh road',8,0);
way(...f,-6,6.6,-6.01,6.6,'way','trail + dead tree',-125,4);
way(...f,-3,7,-3,7.01,'way','the fence gate',8,-8);
way(...f,0,5.6,0.01,5.6,'hid','storm drain (hidden)',8,-8);
way(...f,3,12,3,12.01,'way','highway · Exit 1',8,14);
way(...f,12,9,12.01,9,'way','the quay',8,-8);
way(...f,-1,-3,-1,-3.01,'way','Pilgrim Stair',-80,-10);
way(...f,12,20,12.01,20,'hid','robbers’ tunnel',-92,-8);
way(...f,0,0.6,-0.01,0.6,'miss','Civic gate: nothing behind it',8,14);
way(...f,-0.5,12.6,0.5,12.6,'miss','Ranch · Desert: no way',-150,16);
way(...f,22,8.5,22,8.51,'way','whirlpool ↓ The Deep',8,4);
hq(...f,-3.2,6.2,'HQ stair'); hq(...f,5.2,7.3,'HQ taxi'); hq(...f,1.2,15,'HQ tunnel (Circus)'); hq(...f,8,21.5,'HQ mirrors (Giza)'); hq(...f,23,3,'HQ pool'); hq(...f,-3.5,0.3,'HQ painting');
// underground
txt(20,U0-18,'2.  UNDER THE GROUND AND THE SEA   (grey outlines = what is above)',17,C.ink,700);
o.push(`<rect x="20" y="${U0}" width="${W1*S}" height="${UH*S}" fill="#201c1a"/>`);
o.push(`<rect x="${ux(12)}" y="${U0}" width="${(UX0+W1-12)*S}" height="${UH*S}" fill="#0e2040"/>`);
const g=[ux,uy];
[[-6,1,6,6,'The Woods'],[-14,0,8,8,'Camelot'],[-6,7,6,6,'The Estate'],[0,0,12,12,'Disaster City'],[0,12,12,12,'The Desert'],[12,1,14,10,'The Beach'],[12,17,9,5,'Leylines'],[-12,-5,12,2,'The Mountains (south edge)']].forEach(z=>zone(...g,z[0],z[1],z[2],z[3],z[4],'old',[],{faint:1}));
zone(...g,2,9,8,2,'THE SEWERS','old',['old rooms · plan 16'],{pick:'① NEXT',small:1});
zone(...g,-4,-3,4,4,'HELL','old',['under the Vatican','plan 16'],{small:1,pick:'②'});
zone(...g,-6,2,6,6,'THE CAVERN','built',['The Cavern · Hollow Earth','Agartha','36 plots · one room (11-16)']);
zone(...g,0,18,6,6,'THE D.U.M.B.','old',['Research · Sub-Level 7','Command · Level P3 · CERN','old rooms · plan 36'],{pick:'③'});
zone(...g,15,4.5,9,3,'THE DEEP','old',['Atlantis · The Trench · plan 27']);
way(...g,-2,1,-2,2,'way','the fissure',8,2);
way(...g,0,7,2,9.5,'way','old workings',10,-14);
way(...g,-2,8,1.5,18,'way','Level −6',8,0);
way(...g,-4,8,-4,8.01,'hid','↑ Estate wells',-100,14);
way(...g,4,9,4,8.99,'way','↑ pump court',-34,-10); way(...g,9.5,10,9.51,10,'way','↑ dock',8,-8); way(...g,7,9,7,8.99,'way','↑ platform',8,-10);
way(...g,2,10.5,-0.5,6.5,'way','↑ Woods drain',-100,24);
way(...g,5,18,5,17.99,'way','↑ Hangar 18',8,-8);
way(...g,19,4.5,19,4.49,'way','↑ whirlpool',8,-8);
way(...g,6,21,15,7.5,'miss','The Deep · Area 51: on your list, no door',-40,10);
hq(...g,3,11.6,'HQ ×3'); hq(...g,-5.3,2.6,'HQ dungeon'); hq(...g,1,22.8,'HQ garage');
// legend
const LX=W1*S+50; let y=PADT+10;
const box=(t,sub,col)=>{o.push(`<rect x="${LX}" y="${y}" width="${LEG-40}" height="${22+sub.length*15+10}" fill="${col}" fill-opacity=".5" stroke="${col}"/>`);txt(LX+10,y+19,t,13.5,C.ink,700);sub.forEach((s,i)=>txt(LX+10,y+36+i*15,s,11,'#e6e6e6'));y+=22+sub.length*15+20};
txt(LX,y,'3.  NOT ON THE MAP',15,C.ink,700);y+=12;
box('DOOR HQ  (the hub, handmade)',['Its doors are the gold marks on the map.','Open at the start: the stair to the Woods,','the taxi to Disaster City.'],C.hq);
box('② HEAVEN  (old rooms, plan 16)',['Over the Vatican. Up the Grand Stair from','Mount Olympus, or from Camelot’s sky castle.'],C.old);
box('OUTER SPACE  (on plots 11-16)',['Moon 5x4, Mars 5x4, Saturn 4x4, the','Singularity 4x4: a room each. The Spaceship','handmade. Ways in: the ship, HQ observatorium.'],C.built);
box('THE ASTRAL REALM  (old rooms, plan 36)',['Ways in: HQ dream lab, Camelot’s mirror,','the D.U.M.B. dream lab, the Haunted attic.'],C.old);
y+=6;txt(LX,y,'WHAT THE COLOURS MEAN',15,C.ink,700);y+=14;
const key=(col,dash,t)=>{o.push(`<rect x="${LX}" y="${y}" width="26" height="16" fill="${col}" fill-opacity=".55" stroke="${col}" stroke-width="2" ${dash?'stroke-dasharray="6 4"':''}/>`);txt(LX+36,y+13,t,12);y+=24};
key(C.built,0,'built on plots (real size)');key(C.old,1,'still old rooms; plot plan drawn, not built');
const lk=(col,dash,t)=>{o.push(`<line x1="${LX}" y1="${y+8}" x2="${LX+26}" y2="${y+8}" stroke="${col}" stroke-width="4" ${dash?'stroke-dasharray="7 5"':''}/>`);txt(LX+36,y+13,t,12);y+=24};
lk(C.way,0,'a way that works today');lk(C.hid,1,'a hidden way that works today');lk(C.miss,1,'missing / undecided');
o.push(`<rect x="${LX+8}" y="${y}" width="10" height="16" fill="${C.pick}" stroke="#000"/>`);txt(LX+36,y+13,'a DOOR HQ door comes out here',12);y+=24;
o.push(`<rect x="${LX}" y="${y}" width="26" height="16" fill="none" stroke="${C.pick}" stroke-width="4"/>`);txt(LX+36,y+13,'① ② ③ = proposed build order',12);y+=40;
txt(LX,y,'THE ORDER I PROPOSE',15,C.ink,700);y+=20;
['① The Sewers: 16 plots, seven doors into','    built places, the gate to everything below.','② Heaven + Hell + Vatican: the Mountains’','    stairs and the Civic gate all end at it.','③ The D.U.M.B.: under Area 51, behind the','    HQ garage.','Then: the Cavern, The Deep, Leylines,','the Astral Realm, Antarctica, Outer Space.'].forEach(s=>{txt(LX,y,s,12,'#e6e6e6');y+=17});
y+=20;txt(LX,y,'LOOSE ENDS FOUND',15,C.ink,700);y+=20;
['· Looking-Glass Garden stands twice (old','   room + Camelot district); Camelot’s mirror','   to the Astral Realm has no way back.','· Four doors still name retired rooms: you','   land at the default spot.','· Woods trails to Agartha + the Lodge are','   one-way.','· The Strip, the Lodge, Bohemian Grove are','   still loose old rooms.','· Sewers + Cavern plan pictures predate the','   city’s district move.'].forEach(s=>{txt(LX,y,s,12,'#e6e6e6');y+=17});
fs.writeFileSync('map.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}" viewBox="0 0 ${Wd} ${Ht}" font-family="DejaVu Sans, Arial, sans-serif">${o.join('')}</svg>`);
console.log(Wd,Ht);
