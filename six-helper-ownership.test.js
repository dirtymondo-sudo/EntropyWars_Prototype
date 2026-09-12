'use strict';
// Production builders, wireframe construction, animation and ownership with a
// controlled clock. Optional EW_THREE_MODULE runs the same checks on real r128
// objects without WebGL. Default doubles keep the repository suite dependency-free.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE||__dirname,'three-vfx-effects.js'),'utf8');
function section(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i,a);return source.slice(i,j);}
const code=section('    function _sigEaseOutCubic(','    /* full-viewport')+
 section('    var _SIG_SPECTRUM =','    /* ── KALEIDOSCOPE TEXTURE')+
 section('    function _sigNeonGrid3D(','    /* ── PSYCHEDELIC TINT')+
 section('    function _sigSpectrumBurst3D(','    /* ── BAD TRIP')+
 section('    function _sigStatRings3D(','    /* ── the full support aura');
function harness({cap=20,missing=false,vanish=false,off=false,particles=true,edges='normal'}={}){
 const resources=[],frames=[],events=[],warnings=[];let now=0,reads=0;
 class Vector{
  constructor(x=0,y=0,z=0){this.set(x,y,z);} set(x,y,z){Object.assign(this,{x,y,z});return this;}
  copy(v){return this.set(v.x,v.y,v.z);} clone(){return new Vector().copy(this);}
  add(v){return this.set(this.x+v.x,this.y+v.y,this.z+v.z);} addScaledVector(v,s){return this.add(v.clone().multiplyScalar(s));}
  multiplyScalar(s){return this.set(this.x*s,this.y*s,this.z*s);} subVectors(a,b){return this.copy(a).addScaledVector(b,-1);}
  lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z;} length(){return Math.sqrt(this.lengthSq());}
  normalize(){return this.multiplyScalar(1/(this.length()||1));}
  crossVectors(a,b){return this.set(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);}
  fromBufferAttribute(a,i){return this.set(a.array[i*3],a.array[i*3+1],a.array[i*3+2]);}
 }
 class Quaternion{setFromUnitVectors(){return this;}setFromRotationMatrix(){return this;}setFromAxisAngle(){return this;}copy(){return this;}multiply(){return this;}}
 class Color{constructor(v=0xffffff){this.value=v;}copy(c){Object.assign(this,c);return this;}setHSL(h,s,l){this.h=h;this.s=s;this.l=l;return this;}getHex(){return this.value;}}
 class Resource{
  constructor(opts={}){Object.assign(this,opts);this.disposals=0;resources.push(this);}
  dispose(){this.disposals++;}clone(){return new Resource();}
  setAttribute(k,v){(this.attributes ||= {})[k]=v;return this;}setDrawRange(start,count){this.drawRange={start,count};}
 }
 class Attribute{constructor(array,itemSize){this.array=Float32Array.from(array);this.itemSize=itemSize;this.count=array.length/itemSize;}}
 class Group{
  constructor(){this.children=[];this.userData={};this.position=new Vector();this.rotation=new Vector();this.scale=new Vector(1,1,1);this.quaternion=new Quaternion();}
  add(o){this.children.push(o);o.parent=this;}remove(o){this.children=this.children.filter(c=>c!==o);o.parent=null;}
  traverse(f){f(this);this.children.forEach(c=>c.traverse(f));}
 }
 class Mesh extends Group{constructor(geometry,material){super();Object.assign(this,{geometry,material});}}
 class Edges extends Resource{constructor(){super();this.attributes={position:new Attribute([0,0,0,1,0,0,1,0,0,0,1,0],3)};}}
 class Tube extends Resource{constructor(){super();this.index={count:1320};this.drawRange={start:0,count:Infinity};}}
 let THREE={Group,Mesh,Line:Mesh,LineSegments:Mesh,Color,Vector3:Vector,Quaternion,Matrix4:class{makeBasis(){return this;}},
  BufferGeometry:Resource,Float32BufferAttribute:Attribute,LineBasicMaterial:Resource,MeshBasicMaterial:Resource,
  OctahedronGeometry:Resource,PlaneGeometry:Resource,CylinderGeometry:Resource,SphereGeometry:Resource,TorusGeometry:Resource,
  EdgesGeometry:Edges,TubeGeometry:Tube,CatmullRomCurve3:class{constructor(points){this.points=points;}}};
 if(process.env.EW_THREE_MODULE){
  const real=require(process.env.EW_THREE_MODULE);THREE={...real};
  // Instrument each allocated geometry/material (including clone results),
  // without changing the engine's geometry, vector, or quaternion algorithms.
  const tracked=new Set();
  function track(o){if(tracked.has(o))return o;tracked.add(o);resources.push(o);o.disposals=0;
   const dispose=o.dispose;o.dispose=function(){this.disposals++;return dispose.call(this);};
   const clone=o.clone;if(clone)o.clone=function(){return track(clone.call(this));};return o;}
  for(const name of ['BufferGeometry','LineBasicMaterial','MeshBasicMaterial','OctahedronGeometry','PlaneGeometry','CylinderGeometry','SphereGeometry','TorusGeometry','EdgesGeometry','TubeGeometry']){
   const C=real[name];THREE[name]=class extends C{constructor(...a){super(...a);track(this);}};
  }
 }
 const EdgeBase=THREE.EdgesGeometry;
 THREE.EdgesGeometry=class extends EdgeBase{constructor(...a){if(edges==='throw')throw Error('injected edges failure');super(...a);if(edges==='missing')this.attributes={};if(edges==='empty')this.attributes.position=new THREE.Float32BufferAttribute([],3);}};
 const scene=new THREE.Group(),texture={disposals:0,dispose(){this.disposals++;}};
 const ctx=vm.createContext({THREE,Math,console:{warn:(...a)=>warnings.push(a)},performance:{now:()=>now},
  _getVFXScene:()=>missing||(vanish&&++reads>1)?null:scene,
  _worldPos:(x,y)=>({x:x*100,y:20,z:y*100,ts:100}),_worldTorso:(x,y)=>({x:x*100,y:70,z:y*100,ts:100}),
  _cfg:()=>({tileSize:100,boardPadding:2}),tilePx:(x,y)=>({x:x*100,y:y*100}),unitSurfaceZ:()=>20,unitZBoost:()=>50,
  _sigRingTex:()=>texture,_sigGlowTex:()=>texture,_sigKaleidoTex:()=>texture,_sigYawToward:()=>.3,
  _fxSchedule:f=>frames.push(f),_catOff:()=>off,_canSpawn:()=>particles,rn:(a,b)=>(a+b)/2,
  _spawn:p=>events.push({type:'particle',p}),_sigSparks:(...a)=>events.push({type:'sparks',a}),
  _sigScreenFlash:(...a)=>events.push({type:'flash',a}),_sigShake:(...a)=>events.push({type:'shake',a}),
  ThreePost:{bloomPulse:(...a)=>events.push({type:'bloom',a})},
  SPELL_MAP:{test:{impact:'impact'}},EFFECTS:{impact:{name:'impact'}},_spawnEffect:(...a)=>events.push({type:'impact',a})});
 vm.runInContext(code,ctx);ctx._SIG_MAX_ACTIVE=cap;
 return {ctx,THREE,resources,events,warnings,scene,texture,
  fire(kind,opts={}){return kind==='PrismRefraction'?ctx._sigPrismRefraction3D(1,2,4,5,opts):ctx['_sig'+kind+'3D'](2,3,opts);},
  tick(t){now=t;[...frames].forEach(f=>f());},retire(){[...ctx._sigEntries].forEach(e=>e.finish());},
  clean(){assert.ok(resources.length>0);for(const r of resources)assert.equal(r.disposals,r._ew_shared?0:1,'each owned resource disposed exactly once');assert.equal(texture.disposals,0);assert.equal(scene.children.length,0);assert.equal(ctx._sigActive,0);assert.equal(ctx._sigEntries.length,0);}
 };
}
const kinds=['NeonGrid','FractalTunnel','Kaleidoscope','SpectrumBurst','PrismRefraction','StatRings'];
for(const kind of kinds){
 for(const mode of ['cap','vanish'])test(`${kind}: ${mode} refusal cleans the complete builder`,()=>{
  const h=harness(mode==='cap'?{cap:0}:{vanish:true});assert.equal(h.fire(kind),null);h.clean();h.tick(2000);h.clean();
  assert.equal(h.events.filter(e=>e.type==='impact').length,0);
 });
 test(`${kind}: no initial scene allocates nothing`,()=>{const h=harness({missing:true});assert.equal(h.fire(kind),null);assert.equal(h.resources.length,0);assert.equal(h.events.length,0);});
 test(`${kind}: normal completion disposes once`,()=>{const h=harness(),e=h.fire(kind);assert.ok(e);h.tick(100);assert.equal(h.warnings.length,0);h.tick(2000);e.finish();h.clean();});
 test(`${kind}: retirement leaves no old animation or delayed arrival`,()=>{
  const h=harness(),e=h.fire(kind,{spellId:'test'});h.tick(100);h.retire();h.clean();const prior=h.resources.slice();
  const old=e.group.children[0],scale=old.scale.x;h.fire(kind);h.tick(180);e.finish();assert.equal(old.scale.x,scale);
  assert.ok(prior.every(r=>r.disposals===1));h.retire();h.tick(2000);h.clean();assert.equal(h.events.filter(e=>e.type==='impact').length,0);assert.equal(h.warnings.length,0);
 });
 test(`${kind}: tick error retires the whole group`,()=>{const h=harness(),e=h.fire(kind);e.group.children[0].scale.set=()=>{throw Error('injected');};h.tick(100);assert.equal(h.warnings.length,1);assert.equal(e.done,true);h.clean();});
}
for(const kind of ['NeonGrid','PrismRefraction'])for(const edges of ['throw','missing','empty'])test(`${kind}: ${edges} wireframe still owns its material`,()=>{
 const h=harness({edges});h.fire(kind);h.tick(100);assert.equal(h.warnings.length,0);h.retire();h.clean();
});
test('disposer releases material aliases and arrays once, including empty wireframe ownership',()=>{
 const h=harness(),g=new h.THREE.Group(),mat=new h.THREE.MeshBasicMaterial(),geo=new h.THREE.PlaneGeometry();
 geo._ew_shared=true;g.userData.wireMat=mat;g.add(new h.THREE.Mesh(geo,[mat,mat]));g.add(new h.THREE.Mesh(geo,mat));
 h.ctx._sigDisposeGroup(g);h.clean();
});
function near(a,b){assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);}
test('Neon Grid: divisions, breathing, cage spin, hue changes and ring phase',()=>{
 const h=harness(),e=h.fire('NeonGrid',{ms:1000,radiusPx:80,divisions:4,rings:2,hue:.2,hueRate:.001});
 const [grid,cage,a,b]=e.group.children;assert.equal(grid.geometry.attributes.position.count,20);assert.equal(e.group.position.y,23);
 h.tick(200);near(grid.scale.x,1+.06*Math.sin(1.8));near(cage.rotation.y,.32);assert.ok(grid.material.opacity>0);assert.ok(cage.userData.wireMat.opacity>0);
 near(a.scale.x,80*(.15+.95*.44));near(b.scale.x,80*(.15+.95*.94));
 const color=JSON.stringify(grid.material.color);h.tick(400);assert.notEqual(JSON.stringify(grid.material.color),color);
 h.tick(950);assert.ok(a.material.opacity<.1);h.retire();h.clean();assert.equal(h.warnings.length,0);
});
test('Fractal Tunnel: polygon closure, count, vertical scroll, size and fade',()=>{
 const h=harness(),e=h.fire('FractalTunnel',{ms:1000,rings:4,sides:6,radiusPx:80,height:300,baseY:10,speed:1});
 assert.equal(e.group.children.length,4);assert.equal(e.group.position.y,30);const a=e.group.children[0],p=a.geometry.attributes.position.array;
 assert.equal(p.length,21);near(p[0],p[18]);near(p[2],p[20]);h.tick(250);near(a.position.y,75);near(a.scale.x,80*(.22+.25*1.55));
 assert.ok(a.material.opacity>0);h.tick(950);assert.ok(a.material.opacity<.2);h.retire();h.clean();assert.equal(h.warnings.length,0);
});
test('Kaleidoscope: opposite spins, ceiling height, cached texture and fade',()=>{
 const h=harness(),e=h.fire('Kaleidoscope',{ms:1000,radiusPx:80,ceilingH:3});const [a,b,c]=e.group.children;
 assert.equal(c.position.y,300);assert.equal(a.material.map,h.texture);assert.equal(c.material.map,h.texture);
 h.tick(200);near(a.rotation.z,.36);near(b.rotation.z,-.58);near(c.rotation.z,.44);near(a.scale.x,80*(1+.09*Math.sin(1.6)));
 assert.equal(a.material.opacity,.75);h.tick(850);near(a.material.opacity,.375);h.retire();h.clean();assert.equal(h.warnings.length,0);
});
test('Spectrum Burst: all colors, lance extension and optional particle/flash/shake effects',()=>{
 const h=harness(),e=h.fire('SpectrumBurst',{ms:1000,radiusPx:80,flashColor:'#123456',flashMs:200,flashPeak:.4,shake:false});
 assert.equal(e.group.children.length,15);for(let i=0;i<7;i++)assert.equal(e.group.children[i+1].material.color.getHex(),h.ctx._SIG_SPECTRUM[i]);
 assert.equal(h.events.filter(e=>e.type==='sparks').length,7);assert.equal(h.events.filter(e=>e.type==='shake').length,0);
 assert.deepEqual(h.events.find(e=>e.type==='flash').a,['#123456',200,.4]);
 h.tick(200);assert.ok(e.group.children[8].scale.y>1);near(e.group.children[8].position.length(),e.group.children[8].scale.y*.5);
 h.tick(900);assert.equal(e.group.children[0].material.opacity,0);h.retire();h.clean();assert.equal(h.warnings.length,0);
 const off=harness({particles:false});off.fire('SpectrumBurst');assert.equal(off.events.filter(e=>e.type==='sparks').length,0);off.retire();off.clean();
});
for(const dir of [1,-1])test(`Stat Rings: ${dir} direction, stagger, visibility and shrink`,()=>{
 const h=harness(),e=h.fire('StatRings',{ms:600,rings:2,staggerMs:200,travel:120,radius:30,dir,color:0x123456,opacity:.8});
 const [a,tor,b]=e.group.children;assert.equal(a.visible,false);assert.equal(a.material.color.getHex(),0x123456);
 h.tick(100);assert.equal(a.visible,true);assert.equal(b.visible,false);near(a.position.y,(dir>0?5:125)+dir*120*(1-Math.pow(1-1/6,3)));near(tor.scale.x,a.scale.x*.94);
 const firstY=a.position.y,firstSize=a.scale.x;h.tick(300);assert.equal(b.visible,true);assert.ok(dir*(a.position.y-firstY)>0);assert.ok(a.scale.x<firstSize);
 h.tick(700);assert.equal(a.visible,false);assert.equal(b.visible,true);h.tick(800);h.clean();assert.equal(h.warnings.length,0);
});
test('Prism Refraction: unfolds, grows indexed bands, impacts once and retires nested spectrum burst',()=>{
 const h=harness(),e=h.fire('PrismRefraction',{flyMs:500,linger:700,spellId:'test',prismAt:.4,prismLift:.5,wireColor:0x123456});
 const [prism,entry,glow,...bands]=e.group.children;assert.equal(bands.length,7);assert.equal(prism.children[1].userData.wireMat.color.getHex(),0x123456);
 assert.ok(bands.every(b=>b.geometry.drawRange.count===0));h.tick(100);assert.ok(prism.scale.x>0);assert.ok(entry.scale.y>0);assert.equal(h.events.filter(e=>e.type==='impact').length,0);
 h.tick(300);assert.ok(bands.every(b=>b.geometry.drawRange.count>0&&b.geometry.drawRange.count<b.geometry.index.count));
 assert.ok(bands.every(b=>b.geometry.drawRange.count%3===0));assert.equal(glow.scale.y,entry.scale.y);
 h.tick(500);assert.equal(h.events.filter(e=>e.type==='impact').length,1);assert.ok(bands.every(b=>b.geometry.drawRange.count===b.geometry.index.count));assert.equal(h.ctx._sigEntries.length,2);
 h.tick(600);assert.equal(h.events.filter(e=>e.type==='impact').length,1);h.tick(900);assert.ok(prism.children[0].material.opacity<.15);
 h.retire();h.tick(2000);h.clean();assert.equal(h.warnings.length,0);
});
test('Spectrum Burst and Prism Refraction respect disabled spell category before allocating',()=>{
 for(const kind of ['SpectrumBurst','PrismRefraction']){const h=harness({off:true});assert.equal(h.fire(kind),null);assert.equal(h.resources.length,0);assert.equal(h.events.length,0);}
});
