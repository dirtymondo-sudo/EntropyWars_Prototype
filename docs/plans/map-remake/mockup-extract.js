// Reads the REAL game data (data.js through load-data.js) + the zone layout files and writes the map model the mock-up draws.
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = path.resolve(__dirname, '../../..');
const ld = require(REPO + '/load-data.js'); const D = ld.loadGameData();
const g = n => { try { return D[n] !== undefined ? D[n] : vm.runInContext(n, D); } catch (e) { return undefined; } };
const H = g('DOOR_HQ'), hubOf = g('hqHubOf'), RET = H.retired || {};
const J = f => JSON.parse(fs.readFileSync(path.join(REPO, f), 'utf8'));
const PAL = {
  city: { C: '#8c8fa3', F: '#5f7fb0', E: '#b0508a', U: '#8a6a52', H: '#c09040', B: '#4f9bb5', R: '#9a5a48', S: '#5f9a6a', I: '#7a7a72', N: '#a89060' },
  woods: { T: '#3f7a4a', G: '#6a4a7a', C: '#5a9a5a', M: '#3a6a7a' },
  kingdom: { K: '#8a8ac0', T: '#b07a4a', N: '#b8ccd8', F: '#4a9a5a', L: '#8a4a9a', W: '#2f6a3f' },
  desert: { R: '#8a8478', C: '#c0485a', W: '#b06a40', A: '#7a8a98', G: '#d8b860' },
  ranch: { C: '#a89a30', R: '#a8683f', H: '#5a4a7a', L: '#3f6fae' },
  mountains: { N: '#c8dcec', P: '#9ab0c8', K: '#e0d0dc', S: '#6a8a7a', O: '#d8c070' },
  beach: { S: '#d8c080', H: '#5a80b8', O: '#2f6aa0', T: '#3fa09a' },
  underworld: { W: '#4f8a78', T: '#5a5a9a', H: '#8a7a5a', O: '#7a5a4a', R: '#9ac040' },
};
const clean = s => String(s).replace(/\s*\(NEW\)/, '');
// zone = a hub with plot-built rooms. sheet = one plot room, placed on the world (wx, wy in plots, north up).
const ZONES = [
  { hub: 'city', layer: 'surface', sheets: [{ room: 'site_prebuilt_downtown_streets', wx: 0, wy: -3, city: true }] },
  { hub: 'woods', layer: 'surface', layout: 'docs/areas/woods/layout.json', sheets: [{ room: 'site_prebuilt_fairy_forest_plots', wx: -6, wy: 1 }] },
  { hub: 'kingdom', layer: 'surface', layout: 'docs/areas/camelot/layout.json', sheets: [{ room: 'site_prebuilt_camelot_kingdom', wx: -14, wy: 0 }] },
  { hub: 'mountains', layer: 'surface', layout: 'docs/areas/mountains/layout.json', sheets: [{ room: 'site_prebuilt_shasta_mountains', wx: -12, wy: -11 }, { room: 'site_prebuilt_northpole_plots', wx: -16, wy: -11 }] },
  { hub: 'ranch', layer: 'surface', layout: 'docs/areas/estate/layout.json', sheets: [{ room: 'site_prebuilt_skinwalker_estate', wx: -6, wy: 7 }] },
  { hub: 'desert', layer: 'surface', layout: 'docs/areas/desert/layout.json', sheets: [{ room: 'site_prebuilt_area51_desert', wx: 0, wy: 12 }] },
  { hub: 'beach', layer: 'surface', layout: 'docs/areas/beach/layout.json', sheets: [{ room: 'site_prebuilt_bermuda_beach', wx: 12, wy: 1 }] },
  { hub: 'underworld', layer: 'under', layout: 'docs/areas/sewers/layout.json', sheets: [{ room: 'site_prebuilt_downtown_underworld', wx: 3, wy: 6 }] },
];
const roomZone = {}; ZONES.forEach(z => z.sheets.forEach(s => { roomZone[s.room] = z.hub; }));
const OLD = [   // zones still on their old rooms: a block at its place on mondo's layout 3
  { hub: 'divine', label: 'THE VATICAN', layer: 'surface', x: -4, y: -3, w: 4, h: 4 }, { hub: 'ley', label: 'LEYLINES', layer: 'surface', x: 12, y: 17, w: 9, h: 5 },
  { id: 'site:prebuilt_antarctica', label: 'ANTARCTICA', layer: 'surface', x: 4, y: 26, w: 4, h: 3 },
  { hub: 'divine', label: 'HELL', layer: 'under', x: -4, y: -3, w: 4, h: 4 }, { hub: 'cavern', label: 'THE CAVERN', layer: 'under', x: -6, y: 2, w: 6, h: 6 },
  { hub: 'dumb', label: 'THE D.U.M.B.', layer: 'under', x: 0, y: 18, w: 6, h: 6 }, { hub: 'deep', label: 'THE DEEP', layer: 'under', x: 15, y: 4.5, w: 9, h: 3 },
];
const out = { zones: [], old: [], hubs: {} };
Object.keys(H.hubs).forEach(id => { out.hubs[id] = { label: H.hubs[id].label, color: H.hubs[id].color }; });
const roomsOfHub = {}; Object.keys(H.rooms).forEach(rid => { if (RET[rid]) return; const h = hubOf(rid); if (h) (roomsOfHub[h.id] = roomsOfHub[h.id] || []).push(rid); });
for (const Z of ZONES) {
  const hubRow = H.hubs[Z.hub], pal = PAL[Z.hub] || {};
  const zone = { id: Z.hub, label: hubRow.label, color: hubRow.color, layer: Z.layer, districts: {}, sheets: [], insides: [] };
  let dn = {};
  if (Z.layout) { const L = J(Z.layout); Object.keys(L.districts).forEach(k => { dn[k] = clean(L.districts[k]); }); }
  else dn = { C: 'Civic Center', F: 'Financial', E: 'Entertainment', U: 'University', H: 'Hero Plaza', B: 'Bayside', R: 'Southside', S: 'Sports + Culture', I: 'Industrial', N: 'The Hollywood Hills' };
  Object.keys(dn).forEach(k => { zone.districts[k] = { name: dn[k], color: pal[k] || '#888' }; });
  const letterOf = d => dn[d] ? d : (Object.keys(dn).find(k => dn[k] === clean(d)) || d);
  for (const S of Z.sheets) {
    const r = H.rooms[S.room]; const sh = { room: S.room, label: r.label, wx: S.wx, wy: S.wy, plots: [], doors: [] };
    let x0, z0;
    if (S.city) {
      const L = J('docs/disaster-city/city-layout.json'), MV = require(REPO + '/docs/disaster-city/move.js'), HL = J('docs/disaster-city/hills-layout.json');
      const home = {}; L.districts.forEach(d => { home[d.id] = [d.gx, d.gy]; });
      sh.cols = 13; sh.rows = 15; x0 = -252; z0 = -252 - 126;
      L.plots.forEach(p => { const hm = home[p.d], to = MV.to[p.d]; sh.plots.push({ id: p.id, c: p.x - hm[0] * 4 + to[0] * 4, r: p.y - hm[1] * 4 + to[1] * 4 + 3, name: p.name, d: p.d }); });
      HL.plots.forEach(p => { const m = /^H(\d+)-(\d+)$/.exec(p.id); sh.plots.push({ id: p.id, c: +m[1], r: +m[2], name: p.name, d: 'N', level: p.level }); });
    } else {
      const P = r.plots; sh.cols = P.nx || P.n; sh.rows = P.nz || P.n;
      const rc = P.names.map(n => /^P(\d+)-(\d+)$/.exec(n[0])).map(m => [+m[1], +m[2]]);
      const oc = Math.max(0, Math.max(...rc.map(a => a[0])) - sh.cols + 1), or = Math.max(0, Math.max(...rc.map(a => a[1])) - sh.rows + 1);
      P.names.forEach((n, i) => sh.plots.push({ id: n[0], c: rc[i][0] - oc, r: rc[i][1] - or, name: n[1], d: letterOf(n[2]), level: n[3] }));
      x0 = -sh.cols * 21; z0 = -sh.rows * 21;
    }
    const W = r.shell.w / 2, Dp = r.shell.d / 2;
    (r.doors || []).forEach(d => {
      if (!d.action || !d.action.room) return;
      let x = d.x, z = d.z;
      if (d.wall === 'n') z = S.city ? z0 : -Dp; else if (d.wall === 's') z = Dp; else if (d.wall === 'e') x = W; else if (d.wall === 'w') x = -W;
      if (x == null || z == null) return;
      const t0 = d.action.room, t = RET[t0] || t0, th = hubOf(t), tr = H.rooms[t] || {};
      let kind = 'zone', to = null, toLabel = '';
      if (roomZone[t] && roomZone[t] !== Z.hub) { to = roomZone[t]; toLabel = H.hubs[to].label; }
      else if (roomZone[t]) { kind = t === S.room ? 'self' : 'zone'; to = Z.hub; toLabel = t === S.room ? String(d.sub || d.label).split(' · ')[0] : tr.label; }
      else if (!tr.site || (th && th.id === 'hq')) { kind = 'hq'; toLabel = (tr.kind === 'bay' ? 'DOOR HQ · THE BAY' : 'DOOR HQ · ' + String(tr.label || t).toUpperCase()); }
      else if (th && th.id === Z.hub) { kind = 'inside'; toLabel = String(tr.label || t).replace(/^.*·\s*/, ''); }
      else if (th && ZONES.some(z => z.hub === th.id)) { kind = 'zone'; to = th.id; toLabel = th.label; }   // the inside of another plot-built zone
      else { kind = 'old'; to = th ? 'hub:' + th.id : 'site:' + String(tr.site).replace(/^site_/, ''); toLabel = th ? th.label : String(tr.label || t).replace(/\s*·.*$/, ''); }
      const LK = d.link ? (H.links || []).find(l => l.id === d.link) : null; const secret = !!(d.secret || (LK && LK.secret));
      if (secret && kind !== 'inside' && kind !== 'self') kind = 'secret';
      sh.doors.push({ id: d.id, c: (x - x0) / 42, r: (z - z0) / 42, kind, to, toRoom: t, toAt: d.action.at || '', toLabel: String(toLabel).toUpperCase(), sub: d.sub || '', way: d.way || '', secret });
    });
    zone.sheets.push(sh);
  }
  const mine = {}; Z.sheets.forEach(s => { mine[s.room] = 1; });
  zone.insides = (roomsOfHub[Z.hub] || []).filter(rid => !mine[rid]).map(rid => ({ room: rid, label: String(H.rooms[rid].label || rid) }));
  out.zones.push(zone);
}
OLD.forEach(o => { const id = o.id || 'hub:' + o.hub; const rooms = o.hub ? (roomsOfHub[o.hub] || []) : Object.keys(H.rooms).filter(r => !RET[r] && H.rooms[r].site && ('site:' + H.rooms[r].site.replace(/^site_/, '')) === id);
  out.old.push(Object.assign({}, o, { id, color: o.hub ? H.hubs[o.hub].color : '#cfe1ee', rooms: rooms.map(r => String(H.rooms[r].label || r)) })); });
fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(out));
out.zones.forEach(z => console.log(z.id.padEnd(11), z.label.padEnd(22), z.sheets.map(s => s.cols + 'x' + s.rows + ' plots ' + s.plots.length + ' doors ' + s.doors.length).join(' + '), '| insides', z.insides.length, '| districts', Object.keys(z.districts).join('')));
out.zones.forEach(z => z.sheets.forEach(s => s.doors.forEach(d => console.log('   ', z.id, d.id.padEnd(22), d.kind.padEnd(7), d.c.toFixed(1), d.r.toFixed(1), d.toLabel.slice(0, 50)))));
out.old.forEach(o => console.log('old', o.id, o.label, o.rooms.length));
const bad = []; out.zones.forEach(z => z.sheets.forEach(s => s.plots.forEach(p => { if (!z.districts[p.d] || p.c < 0 || p.r < 0 || p.c >= s.cols || p.r >= s.rows) bad.push(z.id + ':' + p.id + ':' + p.d); }))); console.log('BAD', bad.length, bad.slice(0, 10));
