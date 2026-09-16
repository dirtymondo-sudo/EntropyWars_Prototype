'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {loadGameData} = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const plain = v => JSON.parse(JSON.stringify(v));
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
function extract(name) {
 const start = renderer.indexOf('    function ' + name + '(');
 const end = renderer.indexOf('\n    }', start);
 assert.ok(start >= 0 && end > start);
 return renderer.slice(start, end + 6);
}
function landing(room, door) {
 const c = {_hq:{room, player:{}, cam:{}, doors:[], counters:[]},
  _hqUnits:()=>HQ.units, _hqRad:n=>n*Math.PI/180,
  _hqHeadingOf:(x,z)=>Math.atan2(x,-z)*180/Math.PI,
  _hqHeadingYaw:n=>(180-n)*Math.PI/180,
  HQ_WALLS:{n:{nx:0,nz:1,yaw:0},s:{nx:0,nz:-1,yaw:Math.PI},e:{nx:-1,nz:0,yaw:-Math.PI/2},w:{nx:1,nz:0,yaw:Math.PI/2}},
  THREE:{Vector3:class {constructor(x,y,z){Object.assign(this,{x,y,z});}}}};
 vm.createContext(c); vm.runInContext(extract('_hqBoxWall')+'\n'+extract('_hqGoTo'),c);
 c._hq.doors.push({door,box:c._hqBoxWall(room,door.wall,door),y0:0});
 assert.equal(c._hqGoTo(door.id,true),true);
 return c._hq;
}
const TR=vm.runInContext('TERRAIN_RULES',D);
const LUNAR=HQ.links.filter(l=>l.route==='lunar'), SEAMS=HQ.links.filter(l=>l.way);
const WELLS=SEAMS.filter(l=>l.way==='well');
/* a prop's footprint on the floor (the hq-complex.test.js rule): the catalogue rect (room axes) or the foot disc */
function propBlocks(room, p, x, z, margin) {
 const S=room.shell, cat=HQ.catalogue[p.key]||{};
 if(p.ceil||cat.ceil||(p.y||0)>0.5)return false;
 const px=p.wall==='w'?-S.w/2:p.wall==='e'?S.w/2:(p.x||0), pz=p.wall==='n'?-S.d/2:p.wall==='s'?S.d/2:(p.z||0);
 const rect=(p.rect===false)?null:(p.rect||cat.rect);
 if(rect&&!p.wall)return Math.abs(x-px)<=rect.hw+margin&&Math.abs(z-pz)<=rect.hd+margin;
 const foot=(p.foot!=null)?p.foot:(cat.foot||0);
 if(!(foot>0)&&!cat.block)return false;
 return Math.hypot(x-px,z-pz)<=Math.max(foot,0.3)+margin;
}
const audio=fs.readFileSync(__dirname+'/audio.js','utf8'), map=fs.readFileSync(__dirname+'/map.js','utf8');
test('the Lunar pilot connects Moon, Derelict and Saturn both ways with distinct arrival doors',()=>{
 assert.equal(LUNAR.length,4,'the pilot\'s two, Mars and the drop (rev 7)');
 for(const link of LUNAR) for(const end of [link.a,link.b]) {
  const rid=D.hqLinkRoom(end), room=HQ.rooms[rid];
  const door=room.doors.find(d=>d.id==='link_'+link.id);
  assert.ok(door);
  const dest=HQ.rooms[door.action.room], back=dest.doors.find(d=>d.id===door.action.at);
  assert.ok(back);assert.equal(back.action.room,rid);assert.equal(back.action.at,door.id);
  assert.equal(back.leaf,door.leaf);assert.equal(D.doorSiteState(door,{}),'open');
  assert.equal(D.hqDoorNo(door),D.hqRoomNo(door.action.room));
  /* a link end may be a complex's PART (9.2 stage 2: the Spaceship's collars are the airlock's) — the board room of its site keeps the egress and the marker */
  const boardRoom=room.fx==='site'?room:HQ.rooms[D.hqSiteRoomId(D.hqRoomSite(rid))];
  assert.ok(boardRoom.doors.some(d=>d.id==='egress'));assert.ok(boardRoom.counters.some(c=>c.id==='battle'));
 }
});
test('production renderer lands each link inside the dry walkway facing away from its doorway',()=>{
 for(const room of Object.values(HQ.rooms)) for(const door of room.doors||[]) if(door.link && room.fx==='site') {
  const h=landing(room,door), p=h.player, half=room.shell.w/2;
  assert.ok(Math.abs(p.x)<half-0.4 && Math.abs(p.z)<half-0.4);
  assert.ok(Math.abs(p.z)>room.shell.grid.cells*room.shell.grid.cell/2+0.4,'off the battle board');
  if(door.wall==='free'){
   /* rev 22: a FREE seam on a site room (the Looking-Glass's mirror — its room is too small for a north lane) stands on the walkway strip and lands the walker facing the way its opening faces, away from it */
   const fr=door.face*Math.PI/180;
   assert.ok(Math.abs(door.z)>room.shell.grid.cells*room.shell.grid.cell/2+0.4,'the object itself stands off the board');
   assert.ok(Math.sin(h.cam.yaw)*Math.sin(fr)+Math.cos(h.cam.yaw)*(-Math.cos(fr))>0.99,'lands facing away from the object');
  } else {
   assert.ok(Math.cos(h.cam.yaw)<-0.99,'north doorway faces south into the room');
   if(door.way) assert.ok(door.wall==='n' && door.x<=-0.2,'a seam on a site room stands on the north wall, in a lane west of the console (rev 10: the four well heads took the free lanes)');
  }
  assert.equal(p.air,false);assert.equal(p.y,0);
  for(const q of [...room.props,...room.agents,...room.npcSpots]) {
   const cat=HQ.catalogue[q.key]||{};
   if(q.ceil || cat.ceil || (q.y||0)>0.5)continue;
   const x=q.wall==='w'?-half:q.wall==='e'?half:(q.x||0);
   const z=q.wall==='n'?-half:q.wall==='s'?half:(q.z||0);
   assert.ok(Math.hypot(p.x-x,p.z-z)>(cat.foot||0.5)+0.4,(q.key||'person')+' blocks landing');
  }
  for(const other of room.doors) if(other.id!==door.id && other.wall===door.wall && door.wall!=='free')
   assert.ok(Math.abs(other.x-door.x)>4.4,'door lanes overlap');
  // _hqBuildSiteBoard also places a 4.8 m signboard at x=5 on
  // outdoor north edges; it is not listed in room.props.
  if(door.wall!=='free') assert.ok(door.x + 2.2 < 5 - 2.4, 'door approach overlaps the built-in signboard');
  for(const mast of room.shell.lights||[])
   assert.ok(Math.hypot(p.x-mast.x,p.z-mast.z)>0.5,'lamp mast blocks landing');
 }
});
test('legacy H-Wing exit and array back doors both survive repeated room generation without aliasing actions',()=>{
 const id='prebuilt_backrooms', old=HQ.siteRooms.backDoors[id];
 try {
  const first=D.hqSiteRoom(id).doors.find(d=>d.id==='hwing');assert.ok(first);
  first.action.room='changed';assert.equal(old.action.room,'hwing_w');
  HQ.siteRooms.backDoors[id]=[old,{id:'second',wall:'n',x:0,leaf:'leaf_exit',action:{room:'hwing_w',at:'exit'}}];
  for(let i=0;i<2;i++)assert.equal(D.hqSiteRoom(id).doors.filter(d=>['hwing','second'].includes(d.id)).length,2);
 } finally {HQ.siteRooms.backDoors[id]=old;}
});
test('invalid or unbuilt link endpoints generate neither half of a broken connection',()=>{
 const saved=HQ.links;
 try {for(const patch of [{site:'missing',wall:'n',x:0},{site:'prebuilt_moon',part:'airlock',wall:'n',x:0},{site:'prebuilt_moon',wall:'e',x:0},{site:'prebuilt_moon',wall:'n',x:NaN}]) {
  HQ.links=[{...saved[0],a:patch}];
  assert.equal(D.hqLinkDoors(D.hqSiteRoomId('prebuilt_derelict')).length,0);
 }} finally{HQ.links=saved;}
});
test('links are fresh copies and their own clearance/Key requirements use existing gate rules',()=>{
 const saved=HQ.links;
 try {
  HQ.links=[{...saved[0],gate:{minClearance:6,requiresKeys:24}}];
  const door=D.hqLinkDoors(D.hqLinkRoom(saved[0].a))[0];
  assert.equal(D.doorSiteState(door,{}),'clearance');
  assert.equal(door.requiresKeys,24);assert.equal(door.minClearance,6);
  door.action.at='changed';assert.equal(D.hqLinkDoors(D.hqLinkRoom(saved[0].a))[0].action.at,'link_moon_derelict');
 } finally{HQ.links=saved;}
});
test('an entryway kind the catalogue does not list is held back at BOTH ends; a listed one builds; a per-end leaf makes a plain door back',()=>{
 const saved=HQ.links;
 try {
  HQ.links=[{...saved[0],way:'phonebox'}];   // rev 22: the mirror is catalogued now — the phone box is the kind that waits on A14
  assert.equal(D.hqLinkDoors(D.hqLinkRoom(saved[0].a)).length,0);assert.equal(D.hqLinkDoors(D.hqLinkRoom(saved[0].b)).length,0);
  HQ.links=[{...saved[0],a:{...saved[0].a,way:'phonebox'}}];
  assert.equal(D.hqLinkDoors(D.hqLinkRoom(saved[0].b)).length,0,'one unknown end holds the whole link back — never half a seam');
  HQ.links=[{...saved[0],way:'wardrobe'}];
  const a=D.hqLinkDoors(D.hqLinkRoom(saved[0].a))[0], b=D.hqLinkDoors(D.hqLinkRoom(saved[0].b))[0];
  assert.ok(a && b && a.way==='wardrobe' && b.way==='wardrobe' && a.leaf===null && b.leaf===null);
  assert.equal(a.sub,HQ.ways.wardrobe.sub);
  HQ.links=[{...saved[0],way:'wardrobe',b:{...saved[0].b,leaf:'leaf_bulkhead',sub:undefined}}];   // the collar end's own plate line stripped: this probes the kind's default
  const a2=D.hqLinkDoors(D.hqLinkRoom(saved[0].a))[0], b2=D.hqLinkDoors(D.hqLinkRoom(saved[0].b))[0];
  assert.equal(a2.way,'wardrobe');assert.equal(b2.way,undefined);assert.equal(b2.leaf,'leaf_bulkhead');assert.equal(b2.sub,'WALK THROUGH');
  HQ.links=[{...saved[0],a:{site:'prebuilt_moon',wall:'free',x:0,z:0}}];
  assert.equal(D.hqLinkDoors(D.hqLinkRoom(saved[0].b)).length,0,'a free end without a face is malformed');
 } finally{HQ.links=saved;}
});
test('THE SEAMS THAT ARE NOT DOORS: the wardrobe into Camelot and the well into Hollow Earth are catalogued, paired, plated, voiced and built',()=>{
 assert.deepEqual(SEAMS.map(l=>l.id).sort().join(','),'bureau_vatican,haunted_camelot,lodge_olympus,mirror_lookingglass,natatorium_dutchman,northpole_haunted,nuketown_haunted,observatorium_singularity,subway_downtown,tunnel_cyberpunk,weir_bermuda,well_camelot,well_cellar,well_garden,well_gobekli,well_nuketown,well_skinwalker','the wardrobe, the six wells (rev 10: every well drops into the cave), the train (the tunnel\u2019s platform to Cyberpunk\u2019s subway; 9.2 stage 4: Downtown\u2019s platform one stop back) and the second batch (rev 22: the mirror, the plunge pool, two paintings, the hearth, the screen, the closet)');
 for(const k of Object.keys(HQ.ways)) {
  const w=HQ.ways[k];
  assert.ok(w.verb && w.sub && w.sfx && w.w>0 && w.h>0, k+': verb · sub · sfx · w · h');
  assert.ok(new RegExp('^\\s+'+w.sfx+'\\(ctx, t, out, vol\\) \\{','m').test(audio),k+': audio.js has the '+w.sfx+' recipe');
  assert.ok(new RegExp('\\b'+w.sfx+': 0\\.[0-9]+').test(audio),k+': '+w.sfx+' has a gain');
  assert.ok(!new RegExp("_DOOR_SFX_SYNTH_MUTED = new Set\\([^)]*'"+w.sfx+"'").test(audio),k+': '+w.sfx+' is not muted');
  assert.ok(new RegExp('^        '+k+': function \\(U, ctx\\) \\{','m').test(renderer),k+': three-renderer.js _hqWayBuilders has a builder');
 }
 const builders=[...renderer.slice(renderer.indexOf('var _hqWayBuilders = {'),renderer.indexOf('function _hqBuildWay(')).matchAll(/^        (\w+): function \(U, ctx\)/mg)].map(m=>m[1]);
 assert.deepEqual(builders.sort().join(','),Object.keys(HQ.ways).sort().join(','),'every builder is catalogued and every catalogued kind has a builder');
 for(const link of SEAMS) {
  assert.ok(link.way in HQ.ways);assert.ok(link.why && link.note && link.draft===true,link.id+': a why, a note, a draft flag (A15)');
  for(const end of [link.a,link.b]) {
   const rid=D.hqLinkRoom(end), room=HQ.rooms[rid], door=room.doors.find(d=>d.id==='link_'+link.id);
   /* an end that names its own `leaf` takes a plain door back instead of the object (hqLinkEndWear; 9.2 stage 4: the stair mouth on Cyberpunk's street at the far end of Downtown's train) */
   if(end.leaf){assert.ok(door && door.way===undefined && door.leaf===end.leaf,rid+' wears a plain door back ('+end.leaf+')');assert.equal(door.sub,end.sub||'WALK THROUGH');}
   else {assert.ok(door && door.way===link.way && door.leaf===null,rid+' wears the '+link.way);
   assert.equal(door.sub,end.sub||HQ.ways[link.way].sub,'the kind\u2019s plate line, unless the end names its own (the well room\u2019s heads)');}
   if(end.verb) assert.equal(door.verb,end.verb,'an end may name its own verb (CLIMB UP)');
   assert.equal(door.why,link.why);
   const dest=HQ.rooms[door.action.room], back=dest.doors.find(d=>d.id===door.action.at);
   const otherEnd=end===link.a?link.b:link.a;
   assert.ok(back && back.action.room===rid && back.action.at===door.id && (otherEnd.leaf ? back.way===undefined : back.way===link.way),'the same object at the far end, or the plain door back the end names');
   assert.equal(D.hqDoorNo(door),D.hqRoomNo(door.action.room),'the plate reads the far site\'s number');
   assert.equal(D.doorSiteState(door,{}),link.gate?'clearance':'open','rev 22: the Bureau\u2019s painting carries the Bureau\u2019s own gate — the Vatican is no way round the Gatekeeper\u2019s door');
   assert.equal(room.doors.filter(d=>d.id===door.id).length,1);
  }
 }
 /* the house's ends: the wardrobe on the east wall upstairs where the locker stood, the well free in the cellar's floor where the fountain stood */
 const up=HQ.rooms.site_prebuilt_haunted_upstairs, cel=HQ.rooms.site_prebuilt_haunted_cellar;
 const ward=up.doors.find(d=>d.link==='haunted_camelot'), well=cel.doors.find(d=>d.link==='well_cellar');
 assert.ok(ward.wall==='e' && ward.z===0.4);assert.ok(!up.props.some(p=>p.key==='office_locker'),'the locker gave its place to the wardrobe');
 assert.ok(well.wall==='free' && well.x===-2.6 && well.z===1.6 && well.face===90);assert.ok(!cel.props.some(p=>p.key==='fountain'),'the fountain gave its place to the well');
 assert.ok(cel.props.filter(p=>p.key==='railing_1m').length>=3,'the guard rail round the well stays (the park rule)');
 /* the far ends: Camelot's curtain wall is a walled room; the cellar's well comes out in the cave's well room (rev 10), not against Hollow Earth's wall */
 assert.equal(HQ.rooms.site_prebuilt_camelot.shell.edge,'open','Camelot stands in the open (2026-09-16: no outdoor battle room wears facility walls) — the wardrobe stands alone on the north line like a lone door panel');
 assert.equal(well.action.room,'site_prebuilt_hollow_earth_shaft','the well in the cellar drops into THE WELL ROOM');
 /* the production landing on the free-standing well: 2.4 m east of the ring, facing east (away from it), inside the cellar, on nothing */
 const h=landing(cel,well), p=h.player;
 assert.ok(Math.abs(p.x-(-0.2))<1e-9 && Math.abs(p.z-1.6)<1e-9,'the landing is 2.4 m in front of the opening');
 assert.ok(Math.sin(h.cam.yaw)>0.99,'facing east, away from the well');
 assert.ok(Math.abs(p.x)<cel.shell.w/2-0.4 && Math.abs(p.z)<cel.shell.d/2-0.4);
 for(const q of [...cel.props,...cel.npcSpots]) assert.ok(!propBlocks(cel,q,p.x,p.z,0.4),(q.key||q.race)+' blocks the well\'s landing');
 const h2=landing(up,ward), p2=h2.player;
 assert.ok(Math.abs(p2.x-(up.shell.w/2-2.4))<1e-9 && p2.z===0.4 && Math.sin(h2.cam.yaw)<-0.99,'the wardrobe on the east wall lands you 2.4 m into the room facing west — you climb OUT of it, your back to the coats');
 for(const q of [...up.props,...up.npcSpots]) assert.ok(!propBlocks(up,q,p2.x,p2.z,0.35),(q.key||q.race)+' blocks the wardrobe\'s landing');
 /* the renderer + map.js sites */
 assert.ok(/if \(wall === 'free'\)/.test(renderer) && /free: true/.test(renderer),'_hqBoxWall reads a free-standing seam');
 assert.ok(/if \(door\.way\) \{ try \{ _hqBuildWay\(room, door, level, y0, Rw, inward\);/.test(renderer),'_hqBuildDoors hands a way to _hqBuildWay');
 assert.ok(/mo\.mode === 'way' && mo\.tick/.test(renderer),'_hqTickDoors drives the way rig');
 assert.ok(/if \(l\.lens\) l\.lens\.material/.test(renderer),'a seam has no lamp');
 assert.ok(/t\.door\.way\) \? \(\(t\.door\.verb\) \|\| _hqWayCat\(t\.door\.way\)\.verb\)/.test(map),'the prompt reads the end\'s verb, else the way\'s');
 assert.ok(/from\.door\.way\) \? _hqWayCat\(from\.door\.way\)\.sfx/.test(map),'the room change voices the way');
 assert.ok(/\.hq-plate-way/.test(fs.readFileSync(__dirname+'/styles-base.css','utf8')));
});
test('THE SECOND BATCH (rev 22): the mirror, the plunge pool, the two paintings, the hearth, the screen and the closet stand where the sheet says, the props they displaced moved, and the production renderer lands every new end clear of the room',()=>{
 const ENDS=[
  ['mirror_lookingglass','a','barbershop','e',0.6,'hook_rail_long'],
  ['natatorium_dutchman','a','natatorium','free',null,'floor_drain'],
  ['natatorium_dutchman','b','site_prebuilt_revenge_hold','free',null,null],
  ['bureau_vatican','a','continuity','n',-1.7,'nameplate'],
  ['northpole_haunted','b','site_prebuilt_haunted_hall','e',0.1,null],
  ['observatorium_singularity','a','observatorium','w',3.4,'hook_rail'],
  ['nuketown_haunted','b','site_prebuilt_haunted_upstairs','w',0.4,'picture_round_a'],
 ];
 for(const [id,side,rid,wall,along,moved] of ENDS){
  const link=HQ.links.find(l=>l.id===id), end=link[side];
  assert.equal(D.hqLinkRoom(end),rid,id+'/'+side+' resolves to '+rid);
  const room=HQ.rooms[rid], door=room.doors.find(d=>d.link===id);
  assert.ok(door && door.way===link.way,rid+' wears the '+link.way);
  assert.equal(door.wall,wall);
  if(wall!=='free') assert.equal(door[(wall==='n'||wall==='s')?'x':'z'],along);
  /* the landing: 2.4 m in, inside the walls, on nothing, and — for a wall end — facing along the wall's inward normal */
  const h=landing(room,door), p=h.player, S=room.shell;
  assert.ok(Math.abs(p.x)<S.w/2-0.4 && Math.abs(p.z)<S.d/2-0.4,rid+'/'+door.id+': inside the walls');
  const inward=wall==='free'?[Math.sin(door.face*Math.PI/180),-Math.cos(door.face*Math.PI/180)]:{n:[0,1],s:[0,-1],e:[-1,0],w:[1,0]}[wall];
  assert.ok(Math.sin(h.cam.yaw)*inward[0]+(-Math.cos(h.cam.yaw))*inward[1]>0.99,rid+'/'+door.id+': lands facing away from the object');
  assert.equal(p.air,false);
  for(const q of [...(room.props||[]),...(room.npcSpots||[]),...(room.agents||[])]) assert.ok(!propBlocks(room,q,p.x,p.z,0.35),rid+'/'+door.id+': '+(q.key||q.race||'person')+' blocks the landing');
  for(const c of room.counters||[]) if(c.x!=null) assert.ok(Math.hypot(p.x-c.x,p.z-c.z)>0.9,rid+'/'+door.id+': the counter '+c.id+' stands on the landing');
  /* the displaced prop is still in the room, off that wall spot */
  if(moved){
   const still=(room.props||[]).filter(q=>q.key===moved);
   assert.ok(still.length>0,rid+': '+moved+' moved, never deleted');
   for(const q of still) assert.ok(!(q.wall===wall && Math.abs((q[(wall==='n'||wall==='s')?'x':'z']||0)-(along||0))<1.0),rid+': '+moved+' still hangs where the '+link.way+' is');
  }
  /* a wall end's object fits the wall it hangs on, clear of the room's own doors */
  if(wall!=='free'){
   const half=(wall==='n'||wall==='s')?S.w/2:S.d/2;
   assert.ok(half-Math.abs(along)>=HQ.ways[link.way].w/2+0.3,rid+'/'+door.id+': the '+link.way+' fits the wall');
   for(const o of room.doors) if(o.id!==door.id && o.wall===wall) assert.ok(Math.abs((o[(wall==='n'||wall==='s')?'x':'z']||0)-along)>2.2,rid+': '+door.id+' crowds '+o.id);
  }
 }
 /* the pool's two ends stand FREE and off every rect blocker (the lap pool's, the bilge's stains carry none) */
 const nat=HQ.rooms.natatorium, plunge=nat.doors.find(d=>d.link==='natatorium_dutchman');
 assert.ok(!propBlocks(nat,nat.props.find(q=>q.key==='lap_pool'),plunge.x,plunge.z,0.9),'the plunge pool is sunk beside the lap pool, not in it');
 /* the Looking-Glass's mirror stands on the walkway strip, off the board, and the site is a station now */
 const lg=HQ.rooms[D.hqSiteRoomId('prebuilt_lookingglass')], mir=lg.doors.find(d=>d.link==='mirror_lookingglass');
 assert.ok(mir && mir.wall==='free' && Math.abs(mir.z)>lg.shell.grid.cells*lg.shell.grid.cell/2+0.4 && Math.abs(mir.z)<lg.shell.d/2-0.6,'the mirror stands on the north strip of the Looking-Glass');
 assert.ok(D.hqWorldRoutes('foyer').some(r=>r.stations.some(s=>s.site==='prebuilt_lookingglass')),'E4 is a station');
 /* the Bureau's gate rides the painting at BOTH ends */
 for(const rid of ['continuity',D.hqSiteRoomId('prebuilt_vatican')]){const d=HQ.rooms[rid].doors.find(x=>x.link==='bureau_vatican');assert.equal(d.minClearance,5);assert.equal(d.requiresKeys,24);assert.equal(D.doorSiteState(d,{}),'clearance');}
 assert.equal(D.hqDoorNo(HQ.rooms[D.hqSiteRoomId('prebuilt_vatican')].doors.find(x=>x.link==='bureau_vatican')),'№ — CONTESTED','the painting’s plate reads the Bureau’s number (hqDoorNo reads a room numbered on its own door)');
 /* the phone box is the kind that waits (A14) — not catalogued, not built */
 assert.ok(!HQ.ways.phonebox && !/^        phonebox: function/m.test(renderer),'phonebox waits on the story');
});
test('world graph reflects real directed doors and repeated reads do not change the rooms',()=>{
 const before=JSON.stringify(HQ.rooms), graph=D.hqWorldGraph();
 assert.equal(graph.nodes.length,Object.keys(HQ.rooms).length);
 const edges=graph.edges.filter(e=>e.link);assert.equal(edges.length,HQ.links.length*2,'every link is live and makes two directed edges');
 for(const e of edges) {assert.ok(HQ.rooms[e.to].doors.some(d=>d.id===e.at));assert.ok(graph.edges.some(r=>r.from===e.to && r.to===e.from && r.door===e.at));}
 const moon=D.hqSiteRoomId('prebuilt_moon'), saturn=D.hqSiteRoomId('prebuilt_saturn');
 const seen=new Set([moon]), todo=[moon];while(todo.length){const at=todo.pop();for(const e of edges.filter(e=>e.from===at))if(!seen.has(e.to)){seen.add(e.to);todo.push(e.to);}}
 assert.ok(seen.has(saturn));assert.ok(seen.size>=5,'the Moon reaches Saturn and on down the line (rev 7: the lunar route joins the world)');
 const house='site_prebuilt_haunted_upstairs', seen2=new Set([house]), todo2=[house];while(todo2.length){const at=todo2.pop();for(const e of edges.filter(e=>e.from===at))if(!seen2.has(e.to)){seen2.add(e.to);todo2.push(e.to);}}
 assert.ok(seen2.has(D.hqSiteRoomId('prebuilt_camelot')),'the wardrobe is an edge of the world graph');
 assert.ok(graph.edges.some(e=>e.from==='site_prebuilt_hollow_earth_shaft' && e.to==='site_prebuilt_haunted_cellar' && e.link==='well_cellar'),'and so is the well, both ways (rev 10: into the cave\u2019s well room)');
 assert.deepEqual(plain(D.hqWorldGraph()),plain(graph));assert.equal(JSON.stringify(HQ.rooms),before);
});
test('the way builders run on a stub scene: each returns a group, a way rig whose tick moves it, and an opening the catalogue agrees with',()=>{
 const src=renderer.slice(renderer.indexOf('    var _hqWayBuilders = {'),renderer.indexOf('    function _hqBuildWay('));
 class Obj{constructor(){this.position={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;},copy(p){this.x=p.x;this.y=p.y;this.z=p.z;}};this.rotation={x:0,y:0,z:0};this.scale={x:1,y:1,z:1,set(x,y,z){this.x=x;this.y=y;this.z=z;},setScalar(s){this.x=this.y=this.z=s;}};this.children=[];this.renderOrder=0;}add(...o){for(const c of o){assert.ok(c instanceof Obj,'added a non-object');this.children.push(c);}}}
 class Mesh extends Obj{constructor(geo,mat){super();this.geometry=geo;this.material=mat;this.isMesh=true;}}
 const geo=class{constructor(){}};
 const c={THREE:{Group:Obj,Mesh,BoxGeometry:geo,CylinderGeometry:geo,RingGeometry:geo,CircleGeometry:geo,PlaneGeometry:geo,TorusGeometry:geo,SphereGeometry:geo,BackSide:1,DoubleSide:2},
  _hq:{tickers:[]},_hqUnits:()=>HQ.units,
  _hqMat:(name)=>{if(name)assert.ok(HQ.textures[name]||TR[name],'unknown texture '+name+' (the kit or the terrain sheet)');return {side:0,opacity:1};},
  _hqBasic:()=>({opacity:1}),
  _hzGlowSprite:()=>{const s=new Obj();s.material={opacity:1};return s;},
  _hqBox:(w,h,d,mat)=>new Mesh(new geo(),mat),
  console};
 vm.createContext(c);vm.runInContext(src,c);
 const B=c._hqWayBuilders;
 for(const k of Object.keys(HQ.ways)) {
  for(const free of [false,true]) {
   const r=B[k](HQ.units,{free,cat:HQ.ways[k],door:{},room:{}});
   assert.ok(r.g instanceof Obj && r.g.children.length>4,k+': a built group');
   assert.equal(r.motion.mode,'way');assert.equal(typeof r.motion.tick,'function');
   assert.ok(Math.abs(r.ow-HQ.ways[k].w)<0.25 && Math.abs(r.oh-HQ.ways[k].h)<0.3,k+': the opening matches the catalogue ('+r.ow+' × '+r.oh+')');
   assert.ok(r.plateY>r.oh,k+': the plate hangs above the opening');
   const before=JSON.stringify(r.g,(kk,v)=>kk==='material'||kk==='geometry'?undefined:v);
   r.motion.tick(1);
   assert.notEqual(JSON.stringify(r.g,(kk,v)=>kk==='material'||kk==='geometry'?undefined:v),before,k+': the tick moves the rig');
   r.motion.tick(0);
  }
 }
 assert.ok(c._hq.tickers.length>=4,'each builder registers its ticker');
 for(const t of c._hq.tickers) t(0.016,1000);
});

/* ── THE ROUTES (9.3 expansion, 2026-09-15 rev 7) ─────────────────────── */
const RANK_LEAVES=new Set(D.DOOR_TEXT.CLEARANCE.map(r=>r.door));
const BOARD=id=>D.hqSiteRoomId(id);
test('every link on the sheet is LIVE (both ends built, both wear catalogued), no link wears a rank leaf, every route names a DOOR_HQ.routes line',()=>{
 assert.ok(HQ.links.length>=32);
 const ids=new Set();
 for(const l of HQ.links){
  assert.ok(!ids.has(l.id),'duplicate link '+l.id);ids.add(l.id);
  assert.ok(D.hqLinkLive(l),'held back: '+l.id);
  assert.ok(HQ.routes[l.route],l.id+' names no route');
  for(const leaf of [l.leaf,l.a.leaf,l.b.leaf]) if(leaf) assert.ok(!RANK_LEAVES.has(leaf),l.id+' wears the rank leaf '+leaf);
  assert.ok(l.why && l.why.length>20,l.id+' explains itself');
 }
 for(const [id,r] of Object.entries(HQ.routes)) assert.ok(r.label && r.sub && /^#[0-9a-f]{6}$/i.test(r.color),'route '+id);
});
test('every built site but the Looking-Glass is a station on at least one line; a site room carries at most three link doors, each on the north wall clear of the corner masts',()=>{
 const on=new Set();HQ.links.forEach(l=>[l.a,l.b].forEach(e=>on.add(e.site)));
 const off=HQ.siteRooms.built.filter(id=>!on.has(id));
 assert.equal(off.join(','),'','every built site is a station (rev 22: the Looking-Glass joined through the barbershop\u2019s mirror, a FREE end on its walkway strip — its 18 m room has no north lane)');
 for(const id of HQ.siteRooms.built){
  const room=HQ.rooms[BOARD(id)], links=room.doors.filter(d=>d.link), half=room.shell.w/2;
  assert.ok(links.length<=4,id+' carries '+links.length+' link doors');
  for(const d of links){if(d.wall==='free'){assert.ok(d.way,id+'/'+d.id+': only a `way` may stand free on a site room');continue;}
   assert.equal(d.wall,'n');assert.ok(d.x>-(half-(room.shell.open?2.6:1.4))&&d.x<0.4,id+'/'+d.id+' at x '+d.x+' (half '+half+')');
   for(const o of links) if(o!==d) assert.ok(Math.abs(o.x-d.x)>=4.4,id+': '+d.id+' and '+o.id+' share a lane');
   const cat=HQ.catalogue[d.leaf]; if(cat) assert.equal(!!d.wide,!!cat.wide,d.id+' wide flag');}
 }
});
test('hqWorldRoutes chains every live link into a line: a leg per link, a station per SITE (a part is its house), an end first, interchanges marked, the viewer\'s room filled',()=>{
 const R=D.hqWorldRoutes('site_prebuilt_haunted_cellar');
 assert.equal(R.length,Object.keys(HQ.routes).length,'every route has a live link');
 assert.equal(R.reduce((n,r)=>n+r.legs.length,0),HQ.links.length);
 const seams=R.find(r=>r.id==='seams'), woods=R.find(r=>r.id==='woods'), deep=R.find(r=>r.id==='deep'), hw=R.find(r=>r.id==='highway');
 assert.ok(seams.dashed);
 const seamNos=new Set(seams.stations.map(s=>s.no));
 for(const no of ['13','i','1287','E4','50M','1717','33','12','\u2116 \u2014 CONTESTED','888','360','0','1225','1945']) assert.ok(seamNos.has(no),'THE SEAMS line calls at '+no+' (rev 22: the second batch; the wardrobe upstairs is the HOUSE\'s leg, the wells moved to THE UNDERCROFT in rev 10)');
 assert.equal(seams.stations.length,14);
 assert.ok(seams.stations.every(s=>s.site?s.room===BOARD(s.site):HQ.rooms[s.room]&&!HQ.rooms[s.room].site),'a station is a board room, or (rev 22) a facility room the seam leaves from');
 assert.ok(seams.legs.every(l=>l.way));
 const house=woods.stations.find(s=>s.no==='13');
 assert.ok(house.here && house.lines.length===3 && house.lines.includes('seams') && house.lines.includes('undercroft'),'the cellar counts as the house; the house is an interchange (the woods, the wardrobe, the well)');
 assert.equal(D.hqWorldRoutes('foyer').find(r=>r.id==='woods').stations.filter(s=>s.here).length,0);
 assert.equal(D.hqWorldRoutes(null).flatMap(r=>r.stations).filter(s=>s.here).length,0);
 const sta=deep.stations.map(s=>s.no);
 assert.equal(sta[0],'1717','the Dutchman is the end the deep line is walked from');
 assert.ok(deep.stations.find(s=>s.no==='666').lines.includes('divine'),'Hell is on the deep and the divine lines');
 assert.equal(hw.stations.length,5);assert.ok(hw.stations.every(s=>s.label && !/PREBUILT/.test(s.label)));
 for(const r of R){const seen=new Set();for(const s of r.stations){assert.ok(!seen.has(s.room));seen.add(s.room);}
  for(const l of r.legs){assert.ok(seen.has(l.from)&&seen.has(l.to),r.id+' leg '+l.link+' off its line');}}
});
test('the whole world is one piece: from the foyer every board room and every complex part is reached along doors (gates ignored), and every line is reached from the foyer',()=>{
 const g=D.hqWorldGraph(), adj={};g.edges.forEach(e=>{(adj[e.from]=adj[e.from]||[]).push(e.to);});
 const seen=new Set(['foyer']),todo=['foyer'];while(todo.length){const at=todo.pop();for(const to of adj[at]||[])if(!seen.has(to)){seen.add(to);todo.push(to);}}
 for(const id of HQ.siteRooms.built) assert.ok(seen.has(BOARD(id)),id);
 for(const pid of D.hqComplexRooms()) assert.ok(seen.has(pid),pid);
 /* along the LINKS alone (no bays): the lunar line reaches the deep line only through the hall — the lines are not one line */
 const linkAdj={};g.edges.filter(e=>e.link).forEach(e=>{(linkAdj[e.from]=linkAdj[e.from]||[]).push(e.to);});
 const reach=(from)=>{const s=new Set([from]),t=[from];while(t.length){const a=t.pop();for(const b of linkAdj[a]||[])if(!s.has(b)){s.add(b);t.push(b);}}return s;};
 assert.ok(reach(BOARD('prebuilt_haunted')).has(BOARD('prebuilt_fairy_forest')),'the woods');
 assert.ok(reach('site_prebuilt_revenge_hold').has(BOARD('prebuilt_northpole')),'the deep, end to end (rev 19: the line ends at the hatch in the Dutchman\'s HOLD — the deck reaches it by an ordinary door, not a link)');
 assert.ok(!reach(BOARD('prebuilt_revenge')).has(BOARD('prebuilt_atlantis')),'no link leaves the main deck any more');
 assert.ok(reach(BOARD('prebuilt_mars')).has(BOARD('prebuilt_singularity')),'the lunar route, end to end');
});
test('the directory draws THE WORLD: _hqWorldHtml renders every line as a subway map with a leg per link, a stop per station, the viewer filled, GO to every other station; the CSS carries the classes',()=>{
 const start=map.indexOf('        function _hqWorldHtml()'), end=map.indexOf('\n        }\n',start);
 assert.ok(start>0&&end>start);
 const src=map.slice(start,end+11);
 assert.ok(map.includes("html += _hqWorldHtml();"),'the directory calls it');
 /* THE MAP REMEMBERS (Phase 9 Delivery 4, D6): the directory reads the profile — an officer who has walked every link sees the whole map */
 const prof={door:{}}; for(const l of HQ.links) if(D.hqLinkLive(l)) D.hqLinkSee(prof,l.id);
 const ctx={window:{hqWorldRoutes:D.hqWorldRoutes,hqWorldCharted:D.hqWorldCharted},DOOR_HQ:HQ,_hqCurRoom:'site_prebuilt_moon',_hqProfile:()=>prof,
  _hqEsc:v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  _hqNoTag:(no)=>no?'<em class="hq-no">ROOM '+no+'</em>':'',_hqRoomExists:id=>!!HQ.rooms[id]};
 vm.createContext(ctx);vm.runInContext(src+'\nthis.out=_hqWorldHtml();',ctx);
 const html=ctx.out;
 assert.equal((html.match(/<svg /g)||[]).length,Object.keys(HQ.routes).length);
 assert.equal((html.match(/class="hq-world-leg/g)||[]).length,HQ.links.length);
 assert.equal((html.match(/class="hq-world-stop here/g)||[]).length,1,'the Moon is filled once');
 assert.ok(html.includes('YOU ARE HERE'));
 assert.ok(html.includes('data-room="site_prebuilt_saturn" data-at="egress"'));
 assert.ok(html.includes('hq-world-dashed'),'the seams are dashed');
 assert.ok(html.includes('INTERCHANGE'));
 assert.ok(!/undefined|NaN|\[object/.test(html));
 assert.ok(!html.includes('hq-world-unseen')&&!html.includes('UNCHARTED'),'a fully charted map draws nothing dotted');
 /* a STRANGER: every leg dotted, the unknown stops unlabelled, GO still on every stop */
 ctx._hqProfile=()=>null; vm.runInContext('this.out=_hqWorldHtml();',ctx);
 const cold=ctx.out;
 assert.equal((cold.match(/hq-world-unseen/g)||[]).length,HQ.links.length,'every leg unwalked');
 assert.ok(cold.includes('UNCHARTED')&&cold.includes('0 OF '+HQ.links.length+' LEGS CHARTED'));
 assert.equal((cold.match(/data-room="/g)||[]).length,(html.match(/data-room="/g)||[]).length,'GO on every stop either way');
 const css=fs.readFileSync(__dirname+'/styles-base.css','utf8');
 for(const c of ['.hq-world-line','.hq-world-leg','.hq-world-dashed','.hq-world-stop.here .hq-world-dot','.hq-world-ring','.hq-world-leg.hq-world-unseen','.hq-world-stop.unk']) assert.ok(css.includes(c),c);
});
