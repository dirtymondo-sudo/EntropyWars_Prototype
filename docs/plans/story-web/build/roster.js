const fs = require('fs'); const raw = require('./raw.json'); const P = require('./portraits.json');
const T = raw.tempers, D = raw.CUSTOMS_BY_TYPE;
const groupOf = {}; Object.entries(T.groups).forEach(([g, a]) => a.forEach(r => groupOf[r] = g));
const SITE_NAMES = { bermuda_ow: 'The Bermuda Triangle', bermuda: 'The Bermuda Triangle', giza: 'Pyramids of Giza', atlantis: 'Atlantis', hollow_earth: 'Hollow Earth', cyberpunk: 'Cyberpunk City', agartha: 'Agartha', downtown: 'Downtown', camelot: 'Camelot' };
const rooms = {}; const sites = {};
for (const [id, t] of Object.entries(raw.areaEnc)) {
  const m = id.replace(/^site_prebuilt_/, ''); let sk = Object.keys(SITE_NAMES).find(k => m.startsWith(k + '_')) ;
  let site, room; if (sk) { site = SITE_NAMES[sk]; room = m.slice(sk.length + 1); } else { const p = m.split('_'); room = p.pop(); site = p.map(w => w[0].toUpperCase() + w.slice(1)).join(' '); }
  const list = (t.list || []).filter(e => raw.races.includes(e.race));
  rooms[id] = { site, room, list: list.map(e => [e.race, e.w]) };
  (sites[site] = sites[site] || {}); list.forEach(e => sites[site][e.race] = Math.max(sites[site][e.race] || 0, e.w));
}
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const R = raw.races.map(k => {
  const p = raw.profiles[k] || {}, f = raw.finishers[k] || {}, co = raw.CUSTOMS_OVERRIDES[k];
  const types = p.types || [];
  const lines = raw.doorLines[k] || [];
  return { k, n: p.label || k, t: types, role: raw.raceClass[k] || '', fam: raw.families[k] || [], bio: raw.biomes[k] || [],
    home: raw.POINT_OF_ENTRY[k] || '', also: raw.ALSO_NATIVE[k] || [],
    cs: (co && co.status) || D[types[0]] || '', cn: clean(co && co.note), dos: clean(raw.DOSSIER_NOTES[k]),
    q: lines.slice(0, 2).map(clean), fin: f.name ? [f.name, clean(f.desc)] : null,
    tmp: T.races[k] || '', grp: groupOf[k] || '',
    walks: Object.keys(sites).filter(s => sites[s][k]),
    img: P[k] ? P[k].u : '', ik: P[k] ? P[k].k : '' };
});
const out = { races: R, tempers: T.tempers, groups: T.groups, guardDefends: T.guardDefends, rooms, made: new Date().toISOString().slice(0, 10) };
fs.writeFileSync(__dirname + '/roster.json', JSON.stringify(out));
console.log(fs.statSync(__dirname + '/roster.json').size, Object.keys(sites), Object.keys(rooms).length);
const s = R.find(r => r.k === 'santa clause'); s.img = s.img.length; console.log(JSON.stringify(s, null, 0));
const b = R.find(r => r.k === 'bigfoot'); b.img = 0; console.log(JSON.stringify(b));
console.log('no quote/dos/cn', R.filter(r => !r.q.length && !r.dos && !r.cn).length, 'homes', [...new Set(R.map(r => r.home))].length, 'fam', [...new Set(R.flatMap(r => r.fam))].length);
console.log(Object.keys(raw.areaEnc).join(' '));
