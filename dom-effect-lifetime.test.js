'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(process.env.EW_EFFECT_SOURCE || __dirname,'three-vfx-effects.js'),'utf8');
function slice(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return src.slice(i,j);}
function harness(){
 let now=0,id=0;const frames=new Map(),timers=new Map(),children=[];
 const canvas={style:{filter:'brightness(0.9)'}};
 const body={appendChild(el){children.push(el);el.parentNode=body;},removeChild(el){children.splice(children.indexOf(el),1);el.parentNode=null;}};
 const ctx=vm.createContext({Set,Array,Math,state:{phase:'battle'},performance:{now:()=>now},
 document:{body,getElementById:()=>canvas,createElement:()=>({style:{}})},
 requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame(n){frames.delete(n);},
 window:{setTimeout(fn){timers.set(++id,fn);return id;},clearTimeout(n){timers.delete(n);}},
 _catOff:()=>false,_post:()=>null,_sigEaseOutCubic:t=>1-(1-t)**3,
 _fxSchedule(fn){frames.set(++id,fn);},_VS:{on:false}});
 vm.runInContext(slice('    var _fxLifetime','    function rn')+
 slice('    var _sigFlashbackActive','    /* ═')+
 slice('    var _sigTripActive','    /* ── SPECTRUM BURST'),ctx);
 return {ctx,canvas,children,frames,timers,time(n){now=n;},frame(){const q=[...frames.values()];frames.clear();q.forEach(f=>f());},timer(){const q=[...timers.values()];timers.clear();q.forEach(f=>f());},clear(){ctx._fxCancelDelays();}};
}
for(const effect of ['_sigFlashbackTint','_sigPsychedelicTint']){
 test(effect+' restores filter and removes overlay immediately on retirement',()=>{
  const h=harness();h.ctx[effect]({});h.time(100);h.frame();assert.notEqual(h.canvas.style.filter,'brightness(0.9)');
  h.clear();assert.equal(h.children.length,0);assert.equal(h.canvas.style.filter,'brightness(0.9)');assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
 });
 test(effect+' old queued frame cannot touch a new scene or block reentry',()=>{
  const h=harness();h.ctx[effect]({});const old=[...h.frames.values()];h.clear();h.ctx[effect]({});h.time(100);h.frame();const filter=h.canvas.style.filter;
  old.forEach(f=>f());assert.equal(h.children.length,1);assert.equal(h.canvas.style.filter,filter);h.clear();assert.equal(h.children.length,0);
 });
 test(effect+' natural completion restores original filter and releases ownership',()=>{
  const h=harness();h.ctx[effect]({inMs:10,holdMs:10,outMs:10});h.time(40);h.frame();assert.equal(h.children.length,0);assert.equal(h.canvas.style.filter,'brightness(0.9)');h.ctx[effect]({});assert.equal(h.children.length,1);
 });
}
test('end-card cleanup cancels both nested frames and timers; queued callbacks stay inert',()=>{
 const h=harness();h.ctx._sigToBeContinuedBanner(100);const oldFrames=[...h.frames.values()],oldTimers=[...h.timers.values()];h.clear();oldFrames.forEach(f=>f());oldTimers.forEach(f=>f());assert.equal(h.children.length,0);assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
});
test('end-card completes its normal entrance and exit',()=>{
 const h=harness();h.ctx._sigToBeContinuedBanner(100);h.frame();h.frame();assert.equal(h.children[0].style.transform,'translateX(0)');h.timer();assert.equal(h.children[0].style.opacity,'0');h.timer();assert.equal(h.children.length,0);
});
test('overlapping canvas tints hand off ownership without stale filter resets',()=>{
 const h=harness();h.ctx._sigFlashbackTint({});h.time(100);h.frame();const old=[...h.frames.values()];h.ctx._sigPsychedelicTint({});assert.equal(h.children.length,1);h.time(200);h.frame();const filter=h.canvas.style.filter;old.forEach(f=>f());assert.equal(h.canvas.style.filter,filter);h.clear();assert.equal(h.canvas.style.filter,'brightness(0.9)');
});
