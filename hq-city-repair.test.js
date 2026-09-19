'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { loadGameData } = require('./load-data');
const src = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
function extract(name) { const a = src.indexOf('    function ' + name + '('); assert.ok(a >= 0); return src.slice(a, src.indexOf('\n    }', a) + 6); }
function vector() { return { x: 0, y: 0, z: 0, set(x,y,z) { Object.assign(this,{x,y,z}); } }; }
class Group { constructor() { this.position=vector(); this.rotation=vector(); this.scale=vector(); this.scale.set(1,1,1); this.children=[]; this.visible=true; } add(n) { this.children.push(n); } }
class Mesh extends Group { constructor(geometry,material) { super();this.geometry=geometry;this.material=material; } }
class Color { multiplyScalar() { return this; } }
class Material { constructor(o) { Object.assign(this,o); } }
function sandbox() {
 const kits=[], buildings=[];
 const c={ Math, console, window:{}, THREE:{Group,Mesh,Color,GLTFLoader:function(){},BoxGeometry:class {},PlaneGeometry:class {},MeshPhongMaterial:Material,MeshBasicMaterial:Material},
 _hzKitTs:0,_hqUnits:()=>1,_hzTex:()=>null,_hzTextTex:()=>null,_hzBoxUV:()=>{},_hzGlowSprite:()=>new Group(),
 _HQ_STORE_NAMES:['SHOP'],_HQ_STORE_INKS:[0xffffff],_HQ_NEON_NAMES:[],_HQ_NEON_INKS:[],
 _hzMiscKit:(key,o)=>{const g=new Group();kits.push({key,o,g});return g;},
 _nrSpriteBuilding:(...args)=>{const g=new Group();buildings.push({args,g});return g;},
 hqTerrainDoorY:()=>0,hqTerrainHeight:()=>0,_hqTPolyDist:()=>({d:100}),_hqRideEmit:()=>{},_hqSkateRules:()=>({maxV:20}),
 _hq:{terrain:{},player:null,ride:null}, HQ_WALLS:{n:{nx:0,nz:1,yaw:0},s:{nx:0,nz:-1,yaw:Math.PI},e:{nx:-1,nz:0,yaw:-Math.PI/2},w:{nx:1,nz:0,yaw:Math.PI/2}}
 };
 vm.createContext(c);
 for(const name of ['_hqBoxWall','_hqCityFrontGroup','_hqBuildCityLots','_hqBuildRoadTiles','_hqBuildCityEntrances','_hqBuildEscalators','_hqRoutePose','_hqTickTraffic']) vm.runInContext(extract(name),c);
 return {c,kits,buildings};
}
test('road asset thickness stays below a kerb at every street width, including the baked straight-road slope',()=>{
 for(const width of [8,9,10,14]) {
  const {c,kits}=sandbox();c._hqBuildRoadTiles({}, {genPlan:{streets:[{pts:[[0,0],[0,50]],w:width}]}},new Group(),1.75);
  assert.ok(kits.length);
  for(const {o,g} of kits) { const height=.478515; o.onDone(g,width,{min:{y:0},max:{y:height}});assert.ok(Math.abs(g.scale.y*height*width-.035)<1e-9);assert.equal(g.position.y,.31); }
 }
});
test('mall shop fronts face +Z and their entire depth sits behind the concourse facade',()=>{
 const {c,kits}=sandbox();c._hqBuildCityLots({}, {tile:1.75,gen:{fronts:'store',prisms:false},lots:[{i:0,top:5,base:0}],fronts:[{lot:0,len:7,x0:-3.5,x1:3.5,z0:0,z1:0,nx:0,nz:1,top:5,base:0}]},new Group(),1.75,()=>.5,null);
 const {o,g}=kits.find(k=>k.key==='storefront_unit');assert.equal(o.yaw,0);
 const scale=6.7/1.000449,depth=.660156;o.onDone(g,scale,{min:{y:-.255859,z:-.328125},max:{y:.253906,z:.332031}});
 assert.ok(Math.abs(g.position.z+depth*scale/2-.06)<1e-8,'front flush with facade');assert.ok(g.position.z-depth*scale/2<0,'back inside store');assert.ok(Math.abs(g.scale.y*.509765*scale-2.95)<1e-8);
});
test('every normal outdoor city door is on a building front in the same frame; special ways keep their identity',()=>{
 const D=loadGameData();for(const id of ['site_prebuilt_downtown_streets','site_prebuilt_cyberpunk_streets']) {
  const room=D.DOOR_HQ.rooms[id], {c,buildings}=sandbox();c._hqBuildCityEntrances(room,{gen:{kind:'city'},tile:1.75},new Group(),{});
  const doors=room.doors.filter(d=>!d.way&&d.leaf);assert.equal(buildings.length,doors.length);
  buildings.forEach(({args,g},i)=>{const d=doors[i],f=c._hqBoxWall(room,d.wall,d),o=args[4];assert.equal(g._ew_hqEntrance,d.id);assert.equal(o.ry,f.yaw);assert.ok(Math.abs(args[2]+f.nx*(o.d*1.75/2+.16)-f.wx)<1e-8);assert.ok(Math.abs(args[3]+f.nz*(o.d*1.75/2+.16)-f.wz)<1e-8);});
 }
});
test('escalator is built at the lower floor with a fitted width, uphill direction and fallback steps',()=>{
 const D=loadGameData(),room=D.DOOR_HQ.rooms.site_prebuilt_downtown_mall,{c,kits}=sandbox(),scene=new Group();
 const f=room.terrain.features.find(f=>f.escalator);assert.ok(f&&!f.stairs);c._hqBuildEscalators(room,{},scene,1.75);
 const group=scene.children[0],fallback=group.children[0];assert.equal(group.position.y,.3);assert.ok(fallback.children.length>30);assert.equal(Math.abs(group.rotation.y),0);/* THE THIRD PASS (2026-09-17): the escalators climb north / south from the west concourse */assert.equal(scene.children.length,2);
 const {g,o}=kits[0];o.onDone(g,1,{min:{x:-.263672,z:-.5},max:{x:.267578,z:.5}});assert.ok(Math.abs(g.scale.x*.53125-f.w)<1e-8);assert.ok(Math.abs(g.scale.y*.56-f.h1)<1e-8);assert.equal(fallback.visible,false);
});
function car(s=0,pts=[[0,0],[20,0]],loop=false,len=5) {return {s,pts,cum:pts.length===2?[0,20]:[0,10,20],L:20,lane:0,v:4,len,route:0,loop,g:new Group(),hitT:0};}
test('traffic yields on straights, around bends and before respawning beside the player; resumes when clear',()=>{
 for(const [vehicle,player] of [[car(2),{x:7,z:0,y:0}],[car(8,[[0,0],[10,0],[10,10]]),{x:10,z:2,y:0}],[car(19.8),{x:1,z:0,y:0}]]) {
  const {c}=sandbox();c._hq.traffic=[vehicle];c._hq.player=player;const s=vehicle.s;c._hqTickTraffic(.1);assert.equal(vehicle.s,s);
  c._hq.player={x:30,z:30,y:0};c._hqTickTraffic(.1);assert.notEqual(vehicle.s,s);
 }
});
test('following distance uses the actual bus ahead, not the first vehicle in the list',()=>{
 const {c}=sandbox(),first=car(0),follower=car(5),bus=car(15,undefined,false,10);c._hq.traffic=[first,follower,bus];c._hqTickTraffic(.1);assert.equal(follower.s,5);
});
test('Disaster City has fewer, slower cars per square metre than its first cut (eight on 9 856 m²) and the mall explicitly has zero terrain noise',()=>{
 const D=loadGameData(),room=D.DOOR_HQ.rooms.site_prebuilt_downtown_streets;const cars=room.terrain.traffic.reduce((n,t)=>n+t.n,0),area=room.shell.w*room.shell.d;assert.ok(cars/area<=8/9856+1e-9,'cars per m²: '+cars+' on '+area);assert.ok(cars>=8);assert.ok(room.terrain.traffic.every(t=>t.speed<=4.5));   // AREA CONTENT D2 (2026-09-19): the city is 224 × 176 with twelve cars
 const info=D.hqTerrainCompile({shell:{w:10,d:10},doors:[],terrain:{noise:{amp:0},features:[]}},'zero');assert.ok(Array.from(info.H).every(h=>h===0));
});
