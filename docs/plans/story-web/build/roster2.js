const fs = require('fs'); const base = require('./roster.json'), raw2 = require('./raw2.json'), U = require('./urls2.json'), P = require('./portraits2.json');
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const title = s => String(s).toLowerCase().replace(/(^|[\s.\-·])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/D\.o\.o\.r\./g, 'D.O.O.R.');
const stats = { multi: 0, entries: 0, kinds: {} };
const cnt = k => { stats.kinds[k] = (stats.kinds[k] || 0) + 1; };
base.races.forEach(r => {
  const x = U[r.k], prof = raw2.profiles[r.k] || {}, gs = x.genders.length ? x.genders : ['male'];
  const lab = g => (g === 'female' && prof.labelFemale) || (g === 'male' && prof.labelMale) || prof.label || r.n;
  const distinct = gs.length > 1 && lab('male') !== lab('female');
  r.v = gs.map(g => { const p = P[r.k + '|' + g]; const o = { g, n: gs.length > 1 ? (distinct ? lab(g) : lab(g) + (g === 'male' ? ' (M)' : ' (F)')) : lab(g), img: p ? p.u : '', ik: p ? p.k : '' };
    const gl = raw2.doorLines[r.k + ':' + g]; if (gl && gl.length) o.q = gl.slice(0, 2).map(clean);
    const sp = raw2.genderSpells && raw2.genderSpells[r.k] && raw2.genderSpells[r.k][g]; if (sp) o.sp = sp;
    cnt(o.ik || 'initials'); stats.entries++; return o; });
  if (gs.length > 1) stats.multi++;
  r.dg = gs.includes(x.sg) ? x.sg : gs[0];           // the variant an old plain race key resolves to (the face it wore before)
  r.n = prof.label || r.n;
  if (gs.length === 1) r.n = r.v[0].n;
  delete r.img; delete r.ik;
});
const ROOMS = { central_egress: 'D.O.O.R. Headquarters, the Main Hall', training: 'Training Room (Room 64)', office: 'Your office', site_prebuilt_bohemian_grove_grove: 'Bohemian Grove', bay_terrestrial: 'D.O.O.R. Headquarters, the Ring' };
const WHO = { 'AGENT LOCKE': 'locke', 'RHONDA': 'rhonda', 'KIT': 'kit' };
const src = fs.readFileSync(require('path').join(__dirname, '../../../../data.js'), 'utf8'); const a = src.indexOf('const STORY_CUTSCENES ='), b = src.indexOf('THE CUTSCENE EDITOR', a);
const says = {}; const vm = require('vm');
for (const m of src.slice(a, b).matchAll(/say:\s*\{\s*who:\s*'([^']+)',\s*text:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g)) { const id = WHO[m[1]]; if (id) (says[id] = says[id] || []).push(vm.runInNewContext(m[2])); else console.log('unmapped speaker', m[1]); }
const cast = [];
const QF = { locke: 'door agent' };   // QUEST_FIGHTS.orientation_portal.allies: Agent Locke fights as a door agent
for (const [id, c] of Object.entries(raw2.cast)) {
  const race = c.race || c.base || QF[id] || '', R = base.races.find(r => r.k === race), p = P['cast|' + id];
  let img = '', ik = '';
  if (p) { img = p.u; ik = 'model'; } else if (R) { const v = R.v.find(v => v.g === c.gender) || R.v[0]; img = v.img; ik = 'race'; }
  const rooms = [...new Set((c.spots || []).map(s => ROOMS[s.room]).filter(Boolean))];
  const o = { id, grp: 'cast', n: title(c.name), raw: c.name, title: c.title || '', dept: c.dept && c.dept !== '—' ? c.dept : '', race, g: c.gender || '', t: R ? R.t : ['human'], rooms, doing: [...new Set((c.spots || []).map(s => clean(s.doing)).filter(Boolean))], lines: (c.lines || []).map(clean), says: says[id] || [], img, ik };
  if (!race) o.tmpl = 'men in black';            // DOOR_CAST's documented default unit template
  if (c.hidden) o.hidden = true;
  cast.push(o); cnt('cast-' + (ik || 'initials'));
}
for (const t of Object.values(raw2.tut)) { if (/^DUMMY/.test(t.name)) continue; const [race, g] = Object.keys(t.uses)[0].split('|'); const R = base.races.find(r => r.k === race), v = R.v.find(v => v.g === g) || R.v[0];
  cast.push({ id: 'tutorial_' + t.name.toLowerCase(), grp: 'tape', n: title(t.name), raw: t.name, title: 'Orientation tape squad', dept: '', race, g, t: R.t, rooms: ['Training Room (Room 64)'], doing: [], lines: [], says: [], img: v.img, ik: 'race' }); cnt('cast-race'); }
for (const bdef of Object.values(raw2.bosses)) { cast.push({ id: bdef.id, grp: 'boss', n: bdef.name, raw: bdef.name, title: 'Boss', dept: '', race: '', g: '', t: bdef.types || [], rooms: [], doing: [], lines: [], says: [], desc: clean(bdef.desc || ''), img: '', ik: '' }); cnt('cast-initials'); }
const seenN = {}; cast.forEach(c => { seenN[c.n] = (seenN[c.n] || 0) + 1; }); cast.forEach(c => { if (seenN[c.n] > 1) c.n += ' (' + title(c.title.split('·').pop().trim()) + ')'; });
base.cast = cast;
fs.writeFileSync(__dirname + '/roster.json', JSON.stringify(base));
console.log(stats, cast.length, fs.statSync(__dirname + '/roster.json').size);
console.log(cast.map(c => c.n + '[' + c.ik + ',' + c.race + ',' + c.says.length + ']').join(' · '));
console.log(base.races.filter(r => r.v.length > 1).map(r => r.v.map(v => v.n).join('/')).join(', '));
console.log(JSON.stringify(Object.assign({}, cast[1], { img: 0 })), Object.keys(raw2.bosses));
