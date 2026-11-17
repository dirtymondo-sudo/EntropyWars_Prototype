const vm=require('vm'),fs=require('fs');
const R='/home/user/EntropyWars_Prototype/';
const {makeSandbox}=require(R+'load-data.js');
const sb=makeSandbox();
vm.runInContext(fs.readFileSync(R+'data.js','utf8')+'\n;this.__SB=SPELL_BY_ID;this.__RB=RACE_ABILITY_BY_ID;',sb,{filename:'data.js'});
function deep(){const f=function(){return deep()};return new Proxy(f,{get:(t,k)=>k===Symbol.toPrimitive?()=>0:(k==='prototype'?{}:deep()),construct:()=>deep(),apply:()=>deep()});}
sb.window=sb;sb.THREE=deep();sb.performance={now:()=>0};sb.setTimeout=()=>0;sb.requestAnimationFrame=()=>0;
let src=fs.readFileSync(R+'three-vfx-effects.js','utf8');
src=src.replace('    return {\n        _rvCtxNow','    window.__X={G:_spell3DGeometry,GO:_GO_SIG,GOB:_GO_BEAM,PZ:_PZ_SIGS,FX2:_FX2_BURST,TIERS:_STAGE_TIERS,WD:_WD_BURST,ARCH:_STAGE_ARCHETYPES};\n    return {\n        _rvCtxNow');
src=src.replace(/^const ThreeVFXEffects/m,'var ThreeVFXEffects');
vm.runInContext(src,sb,{filename:'fx.js'});
const X=sb.__X, FX=sb.ThreeVFXEffects, E=sb.VFX3D_EFFECTS, M=sb.VFX3D_SPELL_MAP;
// ---- function bodies for transitive analysis
const bodies={};
const re=/function (\w+)\s*\(/g;let m;
while((m=re.exec(src))){const name=m[1];let i=src.indexOf('{',m.index);let d=0,j=i;for(;j<src.length;j++){const c=src[j];if(c==='{')d++;else if(c==='}'){d--;if(!d)break;}}
 if(!bodies[name]) bodies[name]=src.slice(i,j+1);}
const WHITE_HELP={_sigScreenFlash:'screenFlash',_sigSpeedBurst3D:'speedBurst',_sigSpeedLinesFx:'rushLines',_sigShockRing3D:'shockRing',_sigCrescentSlash3D:'crescent',_sigLightPillar3D:'pillar',_sigOrbBurst3D:'orbBurst',_sigSparks:'sparks',_spawnLaserBeam3D:'laserCyl'};
function nearWhite(h){const v=parseInt(h,16);const r=v>>16&255,g=v>>8&255,b=v&255;return Math.min(r,g,b)>=0xd8;}
function scan(text){const o={};for(const [f,k] of Object.entries(WHITE_HELP)){const c=(text.match(new RegExp(f.replace('$','\\$')+'\\(','g'))||[]).length;if(c)o[k]=c;}
 const wl=(text.match(/0x([0-9a-fA-F]{6})\b/g)||[]).filter(h=>nearWhite(h.slice(2))).length; if(wl)o.whiteHex=wl;
 const fl=(text.match(/sprite:\s*'flash'/g)||[]).length; if(fl)o.flashSpr=fl; return o;}
const memo={};
function trans(text,seen){const calls=new Set();const r2=/\b(_\w+)\s*\(/g;let mm;while((mm=r2.exec(text))){if(bodies[mm[1]]&&!seen.has(mm[1]))calls.add(mm[1]);}
 const tot=scan(text);for(const c of calls){seen.add(c);const sub=trans(bodies[c],seen);for(const[k,v]of Object.entries(sub))tot[k]=(tot[k]||0)+v;}return tot;}
function sigScan(fn){if(!fn)return null;try{return trans(fn.toString(),new Set(Object.keys(WHITE_HELP)))}catch(e){return {err:1}}}
// ---- particle effect white layers
const FLASHY={flash:1,'muzzle-flash':1,'holy-light':1};
function tintWhite(t){if(t==null)return true;return nearWhite(t.toString(16).padStart(6,'0'));}
function effWhite(id,seen=new Set()){const d=E[id];if(!d||seen.has(id))return {flash:0,ring:0,sparkle:0};seen.add(id);const o={flash:0,ring:0,sparkle:0};
 for(const L of d.layers||[]){const s=L.sprite;if(FLASHY[s]&&tintWhite(L.tint))o.flash++;if((s==='shockwave'||s==='halo-ring')&&tintWhite(L.tint))o.ring++;if((s==='sparkle'||s==='divine-sparkle'||s==='steel-spark')&&L.tint==null)o.sparkle+=(L.count||1);}
 for(const k of ['impactTileEffect','impactCenterEffect']){if(d[k]){const s=effWhite(d[k],seen);o.flash+=s.flash;o.ring+=s.ring;o.sparkle+=s.sparkle;}}return o;}
const OWNBEAM=['sigLineOwns','beamBreath','beamTsunami','beamBoomerang','beamZigzag','beamGatling'];
const ids=[...new Set([...Object.keys(sb.__SB),...Object.keys(sb.__RB)])];
const rows=[];
for(const id of ids){const def=sb.__SB[id]||sb.__RB[id];let info;try{info=FX.stageInfo(id)}catch(e){continue}
 const P=info.palette,T=info.tier,rank={light:0,standard:1,heavy:2,ultimate:3}[info.weight];
 const phys=!!(P.slash||P.groundRush||P.heavyLand||def.damageType==='physical');
 const st=[];
 if(!P.support){st.push('flash'); if(T.lines>0)st.push('lines'); st.push('ring'); if(P.slash)st.push('crescent'); st.push('sparks');
  if(!phys&&rank>=2&&!P.noOrb)st.push('orb'); if(phys&&rank>=1)st.push('speedBurst'); if(P.slash&&rank>=2)st.push('crescent2'); if(rank>=2)st.push('aftershock'); if(P.pillar&&rank>=2)st.push('pillar');}
 const map=M[id]||{};let pw={flash:0,ring:0,sparkle:0};let laser=false;
 for(const [intent,eid] of Object.entries(map)){if(typeof eid!=='string')continue;const w=effWhite(eid);pw.flash+=w.flash;pw.ring+=w.ring;pw.sparkle+=w.sparkle;
  if(intent==='beam'){const bd=E[eid]||{};if(!OWNBEAM.some(k=>bd[k]) && !X.GOB[id]) laser=true;}}
 const sigFn=X.G[id]||X.GO[id]||X.GOB[id]||(X.FX2&&X.FX2[id]);
 let pz=null;for(const eid of Object.values(map)){const d=E[eid];if(d&&d.pzSig&&X.PZ[d.pzSig])pz=X.PZ[d.pzSig];}
 const sg=sigScan(sigFn)||{};const pg=sigScan(pz)||{};
 const sig={};for(const o of [sg,pg])for(const[k,v]of Object.entries(o))sig[k]=(sig[k]||0)+v;
 rows.push({id,name:def.name,el:def.element||'',type:def.spellType||'',kind:def.kind||'',dmgType:def.damageType||'',arch:info.archetype,weight:info.weight,support:!!P.support,
  stage:st,stageRing:P.ring.toString(16),stageFlash:P.flash,partFlash:pw.flash,partRing:pw.ring,partSparkle:pw.sparkle,laser,hasSig:!!(sigFn||pz),sig});
}
fs.writeFileSync('audit.json',JSON.stringify(rows));
console.log('spells',rows.length);
