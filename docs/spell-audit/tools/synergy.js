const { loadGameData } = require('/home/user/EntropyWars_Prototype/load-data.js');
const vm = require('vm');
const g0 = loadGameData();
const g = new Proxy(g0, { get(t, k) { if (k in t && t[k] !== undefined) return t[k]; try { return vm.runInContext(String(k), t); } catch (e) { return undefined; } } });
const S = g.SPELL_BY_ID, F = g.SPELL_FAMILIES;
const fam = id => g.spellFamiliesOf(S[id])[0] || '';
console.log('== ALIAS CHECK: same object under two ids? ==');
const seen = new Map();
for (const id in S) { const o = S[id]; if (seen.has(o)) console.log('alias', id, '==', seen.get(o)); else seen.set(o, id); }
console.log('familyMemberIds(athleticism):', g.familyMemberIds('athleticism'));
console.log('familyMemberIds(earth):', g.familyMemberIds('earth'));
console.log('familyMemberIds(robot):', g.familyMemberIds('robot'));
console.log('familyMemberIds(militarysupport):', g.familyMemberIds('militarysupport'));
console.log('familyMemberIds(alientechnology):', g.familyMemberIds('alientechnology'));
console.log('\n== DEAD FIELDS on rows ==');
for (const f of g.SPELL_DEAD_FIELDS) { const rows = Object.keys(S).filter(id => S[id][f] != null && f !== 'equipCost'); if (rows.length) console.log(f + ':', rows.map(id => id + '(' + S[id].name + ')').join(', ')); }
console.log('\n== STATUS SETUP -> which spells apply it (family) ==');
const applies = {};
for (const id in S) { const sp = S[id]; const se = Array.isArray(sp.statusEffects) ? sp.statusEffects : []; for (const e of se) if (e && e.id) (applies[e.id] = applies[e.id] || []).push(sp.name + '[' + fam(id) + ']'); for (const k of ['teamStatusEffects', 'allyStatusEffects']) if (Array.isArray(sp[k])) for (const e of sp[k]) if (e && e.id) (applies[e.id] = applies[e.id] || []).push(sp.name + '[' + fam(id) + '/ally]'); }
const payoffs = {};
for (const id in S) { const b = S[id].bonusVsStatus; if (b && b.status) for (const st of String(b.status).split(',')) (payoffs[st] = payoffs[st] || []).push(S[id].name + '[' + fam(id) + ' T' + g.spellTierOf(id) + ']'); }
const allSt = new Set([...Object.keys(applies), ...Object.keys(payoffs)]);
for (const st of [...allSt].sort()) console.log(`${st}: SETUP(${(applies[st] || []).length}) ${(applies[st] || []).join(', ') || 'NONE'}\n    PAYOFF(${(payoffs[st] || []).length}) ${(payoffs[st] || []).join(', ') || 'NONE'}`);
console.log('\n== PER RACE: finishers whose setup status is NOT in the race pool (needs a teammate) ==');
for (const r of g.AVAILABLE_RACES) {
  const pool = g.raceFamilyPoolIds(r);
  const setups = new Set(); for (const id of pool) { const sp = S[id]; for (const e of (Array.isArray(sp.statusEffects) ? sp.statusEffects : [])) if (e && e.id) setups.add(e.id); }
  const orphan = [], selfc = [];
  for (const id of pool) { const b = S[id].bonusVsStatus; if (!b || !b.status) continue; const sts = String(b.status).split(','); if (sts.some(s => setups.has(s))) selfc.push(S[id].name + '(' + b.status + ')'); else orphan.push(S[id].name + '(' + b.status + ')'); }
  console.log(`${r}: self-contained ${selfc.length} [${selfc.join(', ')}] · needs teammate ${orphan.length} [${orphan.join(', ')}] · statuses it can apply: ${[...setups].join(',')}`);
}
console.log('\n== 2AP rows by tier ==');
for (const t of [1, 2, 3, 4]) console.log('T' + t + ':', Object.keys(S).filter(id => g.spellTierOf(id) === t && S[id].apCost >= 2).map(id => S[id].name).join(', '));
console.log('\n== T1 rows with dmg>=120 or aoe dmg>=100 ==');
for (const id in S) { const sp = S[id]; if (g.spellTierOf(id) === 1 && ((sp.dmg >= 120) || (sp.dmg >= 100 && (sp.aoeRadius || sp.lineWidth || sp.crossRadius)))) console.log(sp.name, fam(id), sp.kind, sp.dmg, sp.cost + 'MP', sp.apCost || 1, 'AP', sp.aoeRadius != null ? 'aoe' + sp.aoeRadius : '', sp.lineWidth ? 'line' : '', sp.statusEffects ? JSON.stringify(sp.statusEffects) : ''); }
console.log('\n== T3/T4 single-target damage-only rows with dmg<=125 and no rider ==');
for (const id in S) { const sp = S[id]; const t = g.spellTierOf(id); if (t >= 3 && g.spellRoleOf(sp) === 'damage' && sp.kind === 'damage' && sp.dmg <= 135 && !sp.bonusVsStatus && !sp.ignoreArmor && !sp.pushDistance && !sp.drainPct) console.log('T' + t, sp.name, fam(id), sp.dmg, sp.cost + 'MP', sp.range, sp.desc.slice(0, 90)); }
