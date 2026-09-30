const { loadGameData } = require('/home/user/EntropyWars_Prototype/load-data.js');
const fs = require('fs');
const vm = require('vm');
const g0 = loadGameData();
const g = new Proxy(g0, { get(t, k) { if (k in t && t[k] !== undefined) return t[k]; try { return vm.runInContext(String(k), t); } catch (e) { return undefined; } } });
const F = g.SPELL_FAMILIES, RF = g.RACE_FAMILIES, S = g.SPELL_BY_ID;
const roleOf = g.spellRoleOf, tierOf = g.spellTierOf;
const famRaces = {};
for (const r of g.AVAILABLE_RACES) for (const f of (RF[r] || [])) (famRaces[f] = famRaces[f] || []).push(r);
const famMembers = {};
for (const id in S) { const sp = S[id]; for (const f of g.spellFamiliesOf(sp)) (famMembers[f] = famMembers[f] || []).push(id); }
function aoeStr(sp) {
  const p = [];
  if (sp.aoeMask) p.push('mask' + sp.aoeMask.length);
  else if (sp.aoeRadius != null) p.push((sp.aoeOriginSelf ? 'self-' : '') + 'aoe r' + sp.aoeRadius + (sp.aoeShape ? '/' + sp.aoeShape : '') + (sp.diamond ? '/diamond' : '') + (sp.diagonal ? '/diag' : ''));
  if (sp.crossRadius != null) p.push('cross r' + sp.crossRadius);
  if (sp.blastRadius != null) p.push('blast r' + sp.blastRadius);
  if (sp.lineWidth != null) p.push('line w' + sp.lineWidth);
  if (sp.auraRadius != null) p.push('aura r' + sp.auraRadius);
  if (sp.splash) p.push('splash');
  if (sp.randomTargets) p.push('rand×' + sp.randomTargets.count);
  if (sp.tileCount) p.push('tiles' + sp.tileCount);
  return p.join(' ') || 'single';
}
function fx(sp) {
  const p = [];
  const se = Array.isArray(sp.statusEffects) ? sp.statusEffects : (sp.statusEffects ? [sp.statusEffects] : []);
  if (se.length) p.push('status:' + se.map(e => e.id + (e.duration ? e.duration : '') + (e.chance && e.chance < 1 ? '@' + e.chance : '')).join(','));
  if (Array.isArray(sp.teamStatusEffects)) p.push('team:' + sp.teamStatusEffects.map(e => e.id + (e.duration || '')).join(','));
  if (Array.isArray(sp.allyStatusEffects)) p.push('ally:' + sp.allyStatusEffects.map(e => e.id + (e.duration || '')).join(','));
  if (sp.statStageBoost) p.push('stage:' + Object.entries(sp.statStageBoost).map(([k, v]) => k + (v > 0 ? '+' : '') + v).join(','));
  if (sp.bonusVsStatus) p.push('finisher:' + sp.bonusVsStatus.status + '×' + sp.bonusVsStatus.mult);
  for (const k of ['heal', 'healAmt', 'healPct', 'healPerTurn', 'selfHealPct', 'drainPct', 'shield', 'shieldHp', 'pushDistance', 'pullDistance', 'teleportDistance', 'zoneDuration', 'maxActivePerCaster', 'terrainType', 'weatherType', 'delayTurns', 'cleanse', 'revivePct', 'summonDef', 'dashDamage', 'hitDamages', 'chainProfile', 'turretDmg', 'turretHp', 'turretRange', 'objectHp', 'selfDamagePct', 'recoilPct', 'ignoreArmor', 'groundsFlyers', 'pullToCenter', 'leaveTerrain', 'monument', 'requiresFlight', 'stealSpell', 'spawnDecoy', 'purgeBuffs', 'ignoresLineOfSight', 'dmgPerLevel', 'carryHeight', 'collisionBonus', 'terrainDeform']) {
    if (sp[k] != null && sp[k] !== false) { const v = sp[k]; p.push(k + (v === true ? '' : ':' + (typeof v === 'object' ? JSON.stringify(v) : v))); }
  }
  return p.join(' ');
}
function line(id) {
  const sp = S[id]; const t = tierOf(id);
  const cd = sp.cooldownRounds ? ' CD' + sp.cooldownRounds : '';
  return `- T${t} **${sp.name}** \`${id}\` · ${roleOf(sp)}/${sp.kind} · ${sp.element || '-'}${sp.damageType ? '/' + sp.damageType : ''} · ${sp.cost}MP ${sp.apCost || 1}AP${cd} · dmg ${sp.dmg != null ? sp.dmg : '-'} · rng ${sp.range} · ${aoeStr(sp)} · ${fx(sp)}\n  ${String(sp.desc || '').replace(/\s+/g, ' ')}`;
}
const byTier = (a, b) => (tierOf(a) - tierOf(b)) || S[a].name.localeCompare(S[b].name);
// ---------- families.md
let out = '# FAMILIES (' + Object.keys(F).length + ')\n\n';
const famIds = Object.keys(F).sort((a, b) => F[a].name.localeCompare(F[b].name));
for (const f of famIds) {
  const fam = F[f]; const mem = (famMembers[f] || []).slice().sort(byTier);
  const tiers = [1, 2, 3, 4].map(t => mem.filter(id => tierOf(id) === t).length);
  out += `## ${fam.glyph || ''} ${fam.name} \`${f}\` · kind ${fam.kind}${fam.unique ? ' · UNIQUE to ' + fam.unique : ''}${fam.universal ? ' · UNIVERSAL' : ''} · ${mem.length} spells (T1 ${tiers[0]} / T2 ${tiers[1]} / T3 ${tiers[2]} / T4 ${tiers[3]})\n`;
  out += `desc: ${fam.desc || ''}\nraces (${(famRaces[f] || []).length}): ${(famRaces[f] || []).join(', ') || 'NONE'}\n\n`;
  for (const id of mem) out += line(id) + '\n';
  out += '\n';
}
fs.writeFileSync('families.md', out);
// ---------- races.md
out = '# RACES (' + g.AVAILABLE_RACES.length + ')\n\n';
const PD = g.PASSIVE_DEFS || {};
let LORE = {}; try { const { extractConst } = require('/home/user/EntropyWars_Prototype/load-data.js'); LORE = extractConst(fs.readFileSync('/home/user/EntropyWars_Prototype/party-builder.js','utf8'), 'CODEX_LORE'); } catch (e) { console.error('lore fail', e.message); }
for (const r of g.AVAILABLE_RACES) {
  const p = g.RACE_PROFILES[r] || {}; const st = g.RACE_BASE_STATS[r] || {};
  const pool = g.raceFamilyPoolIds(r);
  const tiers = [1, 2, 3, 4].map(t => pool.filter(id => tierOf(id) === t).length);
  const roles = {}; for (const id of pool) { const ro = roleOf(S[id]); roles[ro] = (roles[ro] || 0) + 1; }
  const pas = (g.RACE_PASSIVES[r] || []).map(k => (PD[k] && PD[k].name) || k);
  const flies = (g.SKY_RACES && g.SKY_RACES.includes(r)) ? ' FLIES' : '';
  out += `## ${p.label || r} \`${r}\` · faction ${p.faction} · types ${(p.types || []).join('/')} · class ${g.RACE_CLASS[r]}${flies}\n`;
  out += `stats: ${Object.entries(st).map(([k, v]) => k + ' ' + v).join(' · ')}\n`;
  out += `affinity: ${JSON.stringify(g.RACE_ELEMENT_AFFINITY[r] || {})} · passives: ${pas.join(', ') || '-'}\n`;
  out += `lore: ${String((LORE[r] || (g.RACE_PROFILES[r]||{}).lore || '')).replace(/\s+/g,' ').slice(0, 600)}\n`;
  out += `tree rungs: ${JSON.stringify(g.RACE_TREE[r] || [])}\n`;
  out += `families: ${(RF[r] || []).map(f => (F[f] ? F[f].name : '?' + f) + ' (' + (famMembers[f] || []).length + ')').join(' · ')}\n`;
  out += `pool ${pool.length} · tiers T1 ${tiers[0]} / T2 ${tiers[1]} / T3 ${tiers[2]} / T4 ${tiers[3]} · roles ${Object.entries(roles).map(([k, v]) => k + ' ' + v).join(', ')}\n\n`;
}
fs.writeFileSync('races.md', out);
// ---------- summary
out = '# SUMMARY\n\n## Families by size\n';
for (const f of famIds.slice().sort((a, b) => (famMembers[a] || []).length - (famMembers[b] || []).length)) {
  const mem = famMembers[f] || []; const tiers = [1, 2, 3, 4].map(t => mem.filter(id => tierOf(id) === t).length);
  out += `${String(mem.length).padStart(2)} | ${F[f].name} (${f}) | tiers ${tiers.join('/')} | races ${(famRaces[f] || []).length}: ${(famRaces[f] || []).join(', ')}\n`;
}
out += '\n## Families with a missing tier\n';
for (const f of famIds) { const mem = famMembers[f] || []; const miss = [1, 2, 3, 4].filter(t => !mem.some(id => tierOf(id) === t)); if (miss.length && !F[f].universal) out += `${F[f].name} (${f}): missing T${miss.join(', T')} · has ${mem.length}\n`; }
out += '\n## Families on no race\n';
for (const f of famIds) if (!(famRaces[f] || []).length) out += `${F[f].name} (${f}) · ${(famMembers[f] || []).length} spells\n`;
out += '\n## RACE_FAMILIES entries naming unknown families\n';
for (const r in RF) for (const f of RF[r]) if (!F[f]) out += `${r}: ${f}\n`;
out += '\n## Spells in no family / multiple families\n';
for (const id in S) { const fs2 = g.spellFamiliesOf(S[id]); if (fs2.length !== 1) out += `${id} (${S[id].name}): ${JSON.stringify(fs2)} kind ${S[id].kind}\n`; }
// duplicates by signature
out += '\n## Redundancy groups (same role+kind+element+aoe class+status set, dmg within same 40-bucket)\n';
const sig = {};
for (const id in S) { const sp = S[id]; if (sp.kind === 'passive' || sp.kind === 'basicAttack') continue; const st = (Array.isArray(sp.statusEffects) ? sp.statusEffects : []).map(e => e && e.id).sort().join(',') + '|' + (sp.statStageBoost ? Object.entries(sp.statStageBoost).map(([k, v]) => k + v).join(',') : ''); const k = [roleOf(sp), sp.kind, sp.element || '-', aoeStr(sp).replace(/r\d+/, 'r'), st, sp.dmg != null ? Math.round(sp.dmg / 40) : '-'].join(' | '); (sig[k] = sig[k] || []).push(id); }
for (const k of Object.keys(sig).sort()) if (sig[k].length > 1) out += `- ${k}: ${sig[k].map(id => S[id].name + ' [' + (g.spellFamiliesOf(S[id])[0] || '') + ' T' + tierOf(id) + ' ' + S[id].cost + 'MP dmg' + (S[id].dmg != null ? S[id].dmg : '-') + ']').join(' · ')}\n`;
// tier vs dmg table
out += '\n## Damage by tier (single-target damage-only rows, then all)\n';
for (const t of [1, 2, 3, 4]) { const rows = Object.keys(S).filter(id => tierOf(id) === t && typeof S[id].dmg === 'number' && S[id].dmg > 0); const d = rows.map(id => S[id].dmg).sort((a, b) => a - b); const mp = rows.map(id => S[id].cost).sort((a, b) => a - b); out += `T${t}: n=${rows.length} dmg min ${d[0]} med ${d[Math.floor(d.length / 2)]} max ${d[d.length - 1]} · MP min ${mp[0]} med ${mp[Math.floor(mp.length / 2)]} max ${mp[mp.length - 1]}\n`; }
out += '\n## Outliers: dmg vs tier\n';
for (const id in S) { const sp = S[id]; const t = tierOf(id); if (typeof sp.dmg !== 'number') continue; const ro = roleOf(sp); if ((t === 1 && sp.dmg >= 150) || (t === 2 && sp.dmg >= 190) || (t === 4 && sp.dmg <= 110 && ro === 'damage') || (t === 3 && sp.dmg <= 80 && ro === 'damage')) out += `T${t} ${sp.name} (${id}) ${ro}/${sp.kind} dmg ${sp.dmg} ${sp.cost}MP ${aoeStr(sp)} fam ${g.spellFamiliesOf(sp)[0]}\n`; }
out += '\n## Tier rule offenders (damageEffect dmg>=120 below T3)\n';
for (const id in S) { const sp = S[id]; if (roleOf(sp) === 'damageEffect' && sp.dmg >= 120 && tierOf(id) < 3) out += `T${tierOf(id)} ${sp.name} (${id}) dmg ${sp.dmg} ${g.spellFamiliesOf(sp)[0]}\n`; }
out += '\n## MP cost vs tier (rows whose cost is off the 25/50/75/100 ladder)\n';
const lad = [25, 50, 75, 100];
const offl = {}; for (const id in S) { const sp = S[id]; if (sp.kind === 'passive') continue; const t = tierOf(id); if (sp.cost !== lad[t - 1]) (offl[t] = offl[t] || []).push(sp.name + ':' + sp.cost); }
for (const t in offl) out += `T${t} (${offl[t].length}): ${offl[t].join(', ')}\n`;
out += '\n## Kind counts\n'; const kc = {}; for (const id in S) kc[S[id].kind] = (kc[S[id].kind] || 0) + 1; out += Object.entries(kc).sort((a, b) => b[1] - a[1]).map(e => e.join(' ')).join(', ') + '\n';
out += '\n## Role x tier matrix\n'; const rt = {}; for (const id in S) { const ro = roleOf(S[id]); (rt[ro] = rt[ro] || [0, 0, 0, 0])[tierOf(id) - 1]++; } for (const ro in rt) out += `${ro}: ${rt[ro].join(' / ')}\n`;
out += '\n## Race pool sizes (sorted)\n';
const ps = g.AVAILABLE_RACES.map(r => [r, g.raceFamilyPoolIds(r).length]).sort((a, b) => a[1] - b[1]); out += ps.map(e => e[0] + ' ' + e[1]).join(', ') + '\n';
out += '\n## Race pools missing a role (no heal / no movement / no AOE / no T4)\n';
for (const r of g.AVAILABLE_RACES) { const pool = g.raceFamilyPoolIds(r); const has = (fn) => pool.some(id => fn(S[id], id)); const miss = []; if (!has(sp => ['heal', 'healAll', 'selfHeal', 'zoneHeal', 'seedHeal', 'lifeDrain'].includes(sp.kind) || sp.heal || sp.healAmt || sp.drainPct || sp.selfHealPct)) miss.push('sustain'); if (!has(sp => roleOf(sp) === 'movement')) miss.push('movement'); if (!has(sp => sp.aoeRadius != null || sp.crossRadius != null || sp.lineWidth != null || sp.blastRadius != null || sp.aoeMask)) miss.push('AOE'); if (!has((sp, id) => tierOf(id) === 4)) miss.push('T4'); if (!has(sp => roleOf(sp) === 'effect' && sp.type === 'buff')) miss.push('buff'); if (!has(sp => roleOf(sp) === 'effect' && sp.type === 'debuff')) miss.push('debuff'); if (miss.length) out += `${r}: ${miss.join(', ')}\n`; }
fs.writeFileSync('summary.md', out);
console.log('done', fs.statSync('families.md').size, fs.statSync('races.md').size, fs.statSync('summary.md').size);
