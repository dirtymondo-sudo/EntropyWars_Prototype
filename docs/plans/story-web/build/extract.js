// Extract race roster data from data.js without evaluating the whole file.
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(process.argv[2] || require('path').join(__dirname, '../../../../data.js'), 'utf8');
function matchClose(s, i) { // i at opening { or [
  const stack = []; let n = s.length;
  for (; i < n; i++) {
    const c = s[i];
    if (c === '/' && s[i+1] === '/') { i = s.indexOf('\n', i); if (i < 0) return -1; continue; }
    if (c === '/' && s[i+1] === '*') { i = s.indexOf('*/', i) + 1; continue; }
    if (c === '"' || c === "'" || c === '`') { for (i++; i < n && s[i] !== c; i++) if (s[i] === '\\') i++; continue; }
    if (c === '{' || c === '[' || c === '(') stack.push(c);
    else if (c === '}' || c === ']' || c === ')') { stack.pop(); if (!stack.length) return i; }
  }
  return -1;
}
function grab(decl, ctx) {
  const at = src.indexOf(decl); if (at < 0) throw new Error('missing ' + decl);
  let i = at + decl.length; while (!/[\{\[]/.test(src[i])) i++;
  const j = matchClose(src, i);
  const text = src.slice(i, j + 1);
  try { return vm.runInNewContext('(' + text + ')', ctx || {}); } catch (e) { e.message = decl + ': ' + e.message; throw e; }
}
const out = {};
out.races = grab('const AVAILABLE_RACES =');
out.profiles = grab('const RACE_PROFILES =');
out.raceClass = grab('const RACE_CLASS =');
out.families = grab('const RACE_FAMILIES =');
out.biomes = grab('const EW_RACE_BIOMES =');
out.tempers = grab('const HQ_NPC_TEMPERS =');
out.areaEnc = grab('const HQ_AREA_ENCOUNTERS =');
const doorAt = src.indexOf('const DOOR_TEXT =');
function sub(name) { const at = src.indexOf('\n    ' + name + ':', doorAt); let i = at; while (!/[\{\[]/.test(src[i])) i++; const j = matchClose(src, i); return vm.runInNewContext('(' + src.slice(i, j + 1) + ')'); }
for (const k of ['CUSTOMS_BY_TYPE', 'CUSTOMS_OVERRIDES', 'POINT_OF_ENTRY', 'ALSO_NATIVE', 'DOSSIER_NOTES']) out[k] = sub(k);
// finishers: find the object containing 'fin_bigfoot'
{ const at = src.indexOf("id: 'fin_giant'"); let k = src.lastIndexOf('\nconst ', at); out.finName = src.slice(k + 1, src.indexOf('=', k)).trim();
  try { out.finishers = grab(out.finName + ' ='); } catch (e) { out.finErr = e.message; } }
try { out.doorLines = grab('const DOOR_ROSTER_LINES ='); } catch (e) { out.doorErr = e.message; }
fs.writeFileSync(__dirname + '/raw.json', JSON.stringify(out));
const R = out.races; const cov = (o) => R.filter(r => o && o[r] != null).length;
console.log('races', R.length, 'profiles', cov(out.profiles), 'class', cov(out.raceClass), 'fam', cov(out.families), 'biomes', cov(out.biomes),
  'entry', cov(out.POINT_OF_ENTRY), 'also', cov(out.ALSO_NATIVE), 'dossier', cov(out.DOSSIER_NOTES), 'customsOv', cov(out.CUSTOMS_OVERRIDES), 'fin', out.finName, cov(out.finishers), out.finErr, 'door', cov(out.doorLines), out.doorErr, 'temper', cov(out.tempers.races));
console.log(JSON.stringify(out.CUSTOMS_BY_TYPE).slice(0, 900));
console.log(JSON.stringify(out.CUSTOMS_OVERRIDES).slice(0, 600));
console.log(JSON.stringify(out.ALSO_NATIVE).slice(0, 500));
console.log(JSON.stringify(out.profiles.vampire), JSON.stringify(out.profiles['santa clause']));
const types = {}; R.forEach(r => (out.profiles[r]?.types || ['?']).forEach(t => types[t] = (types[t] || 0) + 1)); console.log(types);
const cls = {}; R.forEach(r => cls[out.raceClass[r]] = (cls[out.raceClass[r]] || 0) + 1); console.log(cls);
const bi = {}; R.forEach(r => (out.biomes[r] || []).forEach(t => bi[t] = (bi[t] || 0) + 1)); console.log(bi);
console.log('no biome', R.filter(r => !out.biomes[r]).join(','));
console.log(Object.keys(out.areaEnc).length, JSON.stringify(out.areaEnc[Object.keys(out.areaEnc)[0]]).slice(0, 300));
console.log(JSON.stringify(out.tempers.lines).slice(0, 800));
