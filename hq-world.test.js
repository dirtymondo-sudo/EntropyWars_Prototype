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
test('the Lunar pilot connects Moon, Derelict and Saturn both ways with distinct arrival doors',()=>{
 assert.equal(HQ.links.length,2);
 for(const link of HQ.links) for(const end of [link.a,link.b]) {
  const rid=D.hqLinkRoom(end), room=HQ.rooms[rid];
  const door=room.doors.find(d=>d.id==='link_'+link.id);
  assert.ok(door);
  const dest=HQ.rooms[door.action.room], back=dest.doors.find(d=>d.id===door.action.at);
  assert.ok(back);assert.equal(back.action.room,rid);assert.equal(back.action.at,door.id);
  assert.equal(back.leaf,door.leaf);assert.equal(D.doorSiteState(door,{}),'open');
  assert.equal(D.hqDoorNo(door),D.hqRoomNo(door.action.room));
  assert.ok(room.doors.some(d=>d.id==='egress'));assert.ok(room.counters.some(c=>c.id==='battle'));
 }
});
test('production renderer lands each link inside the dry walkway facing away from its doorway',()=>{
 for(const room of Object.values(HQ.rooms)) for(const door of room.doors||[]) if(door.link) {
  const h=landing(room,door), p=h.player, half=room.shell.w/2;
  assert.ok(Math.abs(p.x)<half-0.4 && Math.abs(p.z)<half-0.4);
  assert.ok(Math.abs(p.z)>room.shell.grid.cells*room.shell.grid.cell/2+0.4,'off the battle board');
  assert.ok(Math.cos(h.cam.yaw)<-0.99,'north doorway faces south into the room');
  assert.equal(p.air,false);assert.equal(p.y,0);
  for(const q of [...room.props,...room.agents,...room.npcSpots]) {
   const cat=HQ.catalogue[q.key]||{};
   if(q.ceil || cat.ceil || (q.y||0)>0.5)continue;
   const x=q.wall==='w'?-half:q.wall==='e'?half:(q.x||0);
   const z=q.wall==='n'?-half:q.wall==='s'?half:(q.z||0);
   assert.ok(Math.hypot(p.x-x,p.z-z)>(cat.foot||0.5)+0.4,(q.key||'person')+' blocks landing');
  }
  for(const other of room.doors) if(other.id!==door.id && other.wall===door.wall)
   assert.ok(Math.abs(other.x-door.x)>4.4,'door lanes overlap');
  // _hqBuildSiteBoard also places a 4.8 m signboard at x=5 on
  // outdoor north edges; it is not listed in room.props.
  assert.ok(door.x + 2.2 < 5 - 2.4, 'door approach overlaps the built-in signboard');
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
test('unsupported entryway kinds are held back until a renderer exists',()=>{
 const saved=HQ.links;try {HQ.links=[{...saved[0],way:'wardrobe'}];assert.equal(D.hqLinkDoors(D.hqLinkRoom(saved[0].a)).length,0);}finally{HQ.links=saved;}
});
test('world graph reflects real directed doors and repeated reads do not change the rooms',()=>{
 const before=JSON.stringify(HQ.rooms), graph=D.hqWorldGraph();
 assert.equal(graph.nodes.length,Object.keys(HQ.rooms).length);
 const edges=graph.edges.filter(e=>e.link);assert.equal(edges.length,4);
 for(const e of edges) {assert.ok(HQ.rooms[e.to].doors.some(d=>d.id===e.at));assert.ok(graph.edges.some(r=>r.from===e.to && r.to===e.from && r.door===e.at));}
 const moon=D.hqSiteRoomId('prebuilt_moon'), saturn=D.hqSiteRoomId('prebuilt_saturn');
 const seen=new Set([moon]), todo=[moon];while(todo.length){const at=todo.pop();for(const e of edges.filter(e=>e.from===at))if(!seen.has(e.to)){seen.add(e.to);todo.push(e.to);}}
 assert.ok(seen.has(saturn));assert.equal(seen.size,3);
 assert.deepEqual(plain(D.hqWorldGraph()),plain(graph));assert.equal(JSON.stringify(HQ.rooms),before);
});
