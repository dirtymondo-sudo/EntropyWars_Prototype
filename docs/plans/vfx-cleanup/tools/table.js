const fs=require('fs');const r=require('./audit.json');
const {makeSandbox}=require('/home/user/EntropyWars_Prototype/load-data.js');
const R='/home/user/EntropyWars_Prototype/';const vm=require('vm');const sb=makeSandbox();
vm.runInContext(fs.readFileSync(R+'data.js','utf8')+'\n;this.__SB=SPELL_BY_ID;this.__RB=RACE_ABILITY_BY_ID;this.__RA=typeof RACE_ABILITIES!=="undefined"?RACE_ABILITIES:{};',sb);
const owner={};for(const [race,l] of Object.entries(sb.__RA))for(const a of l)if(a&&a.id&&!owner[a.id])owner[a.id]=race;
const NW_PAL=new Set(['ice','water','lightning','divine','tech','anomaly','heal','mana','hex','human','kinetic','rig','mind','ki','aura','psychic','psychicAid','psychicHex','wind','metal','sonic','bloodAura']);
const WASH=new Set(['wind','metal','sonic','ice']);
const BLADE=new Set(['crossSlash','zantetsuken','lungingStrike','raceBlessedBlade','raceToBeContinued','sneakSlash','sentaiRedSlash','raceSyntheticBlade','guardSlash','dragonSlash','bladeWaltz','swordBeam','parryStance']);
const PORTALK=new Set(['teleport','summonUnit','escape','shadowRealm','raiseDead','swap','doorDeploy','doorBreach','possess']);
const out=[];
for(const x of r){const def=sb.__SB[x.id]||sb.__RB[x.id];if(!def||def.kind==='passive')continue;
 const fam=(def.families||[]);
 const src=[];
 if(!x.support)src.push('stage burst ('+x.stage.filter(s=>s!=='sparks').join('+')+')');
 if(NW_PAL.has(x.arch))src.push('pale palette ('+x.arch+')');
 if(WASH.has(x.el)&&def.type==='damage')src.push('pale noise wash');
 if(x.partFlash)src.push(x.partFlash+' flash layer'+(x.partFlash>1?'s':''));
 if(x.partRing)src.push(x.partRing+' white ring'+(x.partRing>1?'s':''));
 const sw=[];if(x.sig.screenFlash)sw.push('screen flash');if(x.sig.speedBurst)sw.push('speed burst');if(x.sig.whiteHex)sw.push(x.sig.whiteHex+' white colours');
 if(sw.length)src.push('own look: '+sw.join(', '));
 if(x.laser)src.push('generic laser + white charge flash');
 let rule;
 if(x.laser)rule='BEAM';
 else if(x.support&&!x.partFlash&&!x.partRing&&!sw.length)rule='LEAVE';
 else if(x.hasSig)rule='STRIP';
 else rule='REPLACE';
 let b;
 const name=(x.name+' '+x.id);
 if(BLADE.has(x.id)||fam.includes('swordsmanship'))b='B2';
 else if(x.laser||def.kind==='line'||def.kind==='splitBeam')b='B3';
 else if(PORTALK.has(def.kind)||/portal|rift|void|dimension|black hole|singularity|wormhole|summon|door/i.test(name))b='B5';
 else if(x.arch==='ki'||/\bki\b|kamehame|missile|blaster|plasma|laser|\bray\b|zap|wand|spirit bomb|hadou/i.test(name)||fam.includes('highwizardry'))b='B4';
 else if(['divine','aura','heal','mana','lightning'].includes(x.arch))b='B6';
 else if(['ice','water','wind','metal','sonic'].includes(x.arch))b='B7';
 else if(['fire','earth','nature','poison','blood','bloodAura'].includes(x.arch))b='B8';
 else if(['arcane','psychic','psychicAid','psychicHex','mind','hex','unholy','anomaly'].includes(x.arch))b='B9';
 else b='B10';
 out.push({b,id:x.id,name:x.name,race:owner[x.id]||def.school||'',el:x.el||'-',arch:x.arch,w:x.weight,rule,src:src.join('; ')||'none'});
}
out.sort((a,b)=>a.b.localeCompare(b.b,undefined,{numeric:true})||a.arch.localeCompare(b.arch)||a.name.localeCompare(b.name));
{const g={};out.forEach(o=>(g[o.b]=g[o.b]||[]).push(o));for(const[k,l]of Object.entries(g)){if(l.length>120){const h=Math.ceil(l.length/2);l.forEach((o,i)=>o.b=k+(i<h?'a':'b'));}}}
const cnt={},rc={};out.forEach(o=>{cnt[o.b]=(cnt[o.b]||0)+1;rc[o.rule]=(rc[o.rule]||0)+1});
console.log(JSON.stringify(cnt),JSON.stringify(rc),out.length);
let md='# VFX cleanup: every castable spell, its white layers and its rule\n\n'+
'Written by the plan thread on 2026-11-17 from a static read of three-vfx-effects.js + data.js at main `da261dc` (script: the plan\'s section 9). '+
'**Rules:** STRIP = it has its own look, take the generic white off and add nothing · REPLACE = no own look, swap the white for the spell\'s own colour/accent · BEAM = goes onto the new beam kit · LEAVE = support grammar with no white, check the sheet only. '+
'The rule is the starting call; the batch thread confirms it on the before sheet and may move a spell one step (say so in the batch report).\n\n'+
'Counts: '+Object.entries(rc).map(([k,v])=>k+' '+v).join(' · ')+' · total '+out.length+' castable spells (passives have no cast).\n';
let cur='';
const BT0={B2:'Blades (his examples first)',B3:'Beams and lines (new beam kit)',B4:'Blasts, bolts and duels (beam kit part 2)',B5:'Portal look (doors, teleports, summons, escapes)',B6:'Light: divine, aura, heal, mana, lightning',B7:'Air and cold: ice, water, wind, metal, sonic',B8:'Fire, earth, nature, poison, blood',B9:'Mind and dark: arcane, psychic, hex, unholy, anomaly',B10:'Bodies and tech: human, kinetic, grapple, skyfall, rig, tech, alien'};
const BT=new Proxy(BT0,{get:(t,k)=>t[k]||t[String(k).replace(/[ab]$/,'')]+(/[ab]$/.test(k)?' (part '+(k.endsWith('a')?'1':'2')+')':'')});
for(const o of out){if(o.b!==cur){cur=o.b;md+='\n## '+cur+' · '+BT[cur]+' ('+cnt[cur]+')\n\n| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |\n|---|---|---|---|---|---|---|---|\n';}
 md+='| '+o.name+' | `'+o.id+'` | '+o.race+' | '+o.el+' | '+o.arch+' | '+o.w+' | **'+o.rule+'** | '+o.src+' |\n';}
fs.writeFileSync('/home/user/EntropyWars_Prototype/docs/plans/vfx-cleanup/SPELL_TABLE.md',md);
for(const k of Object.keys(cnt)){fs.writeFileSync('/home/user/EntropyWars_Prototype/docs/plans/vfx-cleanup/batches/'+k+'.txt',out.filter(o=>o.b===k).map(o=>o.id).join('\n')+'\n')}
