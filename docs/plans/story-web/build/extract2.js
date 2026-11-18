const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(require('path').join(__dirname, '../../../../data.js'), 'utf8');
function matchClose(s, i) { const st = []; for (; i < s.length; i++) { const c = s[i];
  if (c === '/' && s[i+1] === '/') { i = s.indexOf('\n', i); continue; } if (c === '/' && s[i+1] === '*') { i = s.indexOf('*/', i) + 1; continue; }
  if (c === '"' || c === "'" || c === '`') { for (i++; s[i] !== c; i++) if (s[i] === '\\') i++; continue; }
  if ('{[('.includes(c)) st.push(c); else if ('}])'.includes(c)) { st.pop(); if (!st.length) return i; } } return -1; }
function text(decl) { const at = src.indexOf(decl); let i = at + decl.length; while (!/[\{\[]/.test(src[i])) i++; return src.slice(i, matchClose(src, i) + 1); }
const any = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : any, apply: () => any });
const ctx = new Proxy({}, { has: () => true, get: (t, k) => k in globalThis ? globalThis[k] : any });
const ev = t => vm.runInNewContext('(' + t + ')', ctx);
const out = {};
out.cast = JSON.parse(JSON.stringify(ev(text('const DOOR_CAST ='))));
const cs = text('const STORY_CUTSCENES ='); out.says = [];
for (const m of cs.matchAll(/say:\s*\{\s*who:\s*'([^']+)',\s*text:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g)) out.says.push([m[1], vm.runInNewContext(m[2])]);
const tl = text('const TUTORIAL_LESSONS ='); const tut = {};
for (const m of tl.matchAll(/\{\s*race:\s*'([^']+)',\s*job:\s*'([^']*)',\s*gender:\s*'([^']+)',\s*name:\s*'([^']+)'/g)) { const k = m[4]; (tut[k] = tut[k] || { name: k, uses: {} }).uses[m[1] + '|' + m[3]] = (tut[k].uses[m[1] + '|' + m[3]] || 0) + 1; }
out.tut = tut;
out.bosses = JSON.parse(JSON.stringify(ev(text('const BOSS_DEFS ='))));
out.profiles = JSON.parse(JSON.stringify(ev(text('const RACE_PROFILES ='))));
try { out.genderSpells = JSON.parse(JSON.stringify(ev(text('const RACE_GENDER_SPELLS =')))); } catch (e) { out.gsErr = e.message; }
out.doorLines = JSON.parse(JSON.stringify(ev(text('const DOOR_ROSTER_LINES ='))));
// room labels inside DOOR_HQ
const rooms = new Set(); Object.values(out.cast).forEach(c => (c.spots || []).forEach(s => s.room && rooms.add(s.room)));
out.roomLabels = {};
for (const r of rooms) { const m = src.match(new RegExp("id:\\s*'" + r + "'[^\\n]{0,400}?label:\\s*'([^']+)'")) || src.match(new RegExp("\\n\\s*" + r + ":\\s*\\{[^\\n]{0,300}?label:\\s*'([^']+)'")); out.roomLabels[r] = m ? m[1] : null; }
fs.writeFileSync(__dirname + '/raw2.json', JSON.stringify(out));
console.log(Object.keys(out.cast).length, 'cast;', out.says.length, 'says by', [...new Set(out.says.map(s => s[0]))]);
console.log(JSON.stringify(out.tut)); console.log(Object.values(out.bosses).map(b => b.name + ' ' + JSON.stringify(b.types) + ' ' + (b.desc || b.lore || '')).join(' | ').slice(0, 700));
console.log(out.roomLabels, out.gsErr, JSON.stringify(out.genderSpells).slice(0, 300));
console.log(Object.entries(out.cast).map(([k, c]) => k + ':' + (c.spots || []).map(s => s.room + (s.stage || s.stages ? '*' : '')).join(',')).join(' | '));
console.log(Object.entries(out.doorLines).filter(([k]) => /[:_]/.test(k)).map(([k, v]) => k + '=' + v.length));
const P = out.profiles; console.log(Object.keys(P).filter(k => P[k].labelMale || P[k].labelFemale).map(k => k + ':' + P[k].labelMale + '/' + P[k].labelFemale).join(' | '));
