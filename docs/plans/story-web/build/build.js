const fs = require('fs'), d = __dirname;
let t = fs.readFileSync(d + '/template.html', 'utf8');
/* THE GAME'S PLACES (2026-11-18): every zone, its districts and (Disaster City) its plots, from data.js HQ_ZONE_MAP + the hub
   labels, and the world map's ground, so the web can add them as ready place groups and show the map beside them. */
function places() {
  const repo = d + '/../../../..', src = fs.readFileSync(repo + '/data.js', 'utf8');
  const i = src.indexOf('const HQ_ZONE_MAP = ') + 20, j = src.indexOf(';\n/* ZONEMAP-END */', i), M = JSON.parse(src.slice(i, j));
  const vm = require('vm'), sb = require(repo + '/load-data.js').makeSandbox(); vm.runInContext(src + '\n;globalThis.__X = { DOOR_HQ };', sb, { filename: 'data.js' });
  const H = sb.__X.DOOR_HQ, hubs = {}, hcol = {}; Object.entries(H.hubs).forEach(([k, v]) => { hubs[k] = v.label; if (v.color) hcol[k] = v.color; });
  const title = t => t.split(' ').map(w => /\./.test(w) || w === '+' ? w : w[0] + w.slice(1).toLowerCase()).join(' ').replace(/'S\b/g, "'s").replace(/-(\w)/g, (m, c) => '-' + c.toUpperCase());
  const words = t => String(t).toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9+ ]+/g, ' ').split(/\s+/).filter(Boolean).join(' ');
  const same = (a, b) => words(a) === words(b) || (words(b).startsWith(words(a) + ' ') && words(b).split(' ').length - words(a).split(' ').length <= 1);
  const sub = { divine: null, space: null };
  /* THE PARTS OF A ZONE THAT ARE PLACES OF THEIR OWN (2026-11-19, mondo: "how am i supposed to know if thats in heaven or hell or the vatican?"):
     Heaven, Hell and the Vatican (the Catacombs are under the Vatican), and the four worlds of Outer Space, with the districts in each */
  { const L = JSON.parse(fs.readFileSync(repo + '/docs/areas/afterlife/layout.json', 'utf8')), lab = {}; L.rooms.forEach(r => { lab[r.key] = title(r.label); });
    const fold = { catacombs: 'vatican' }, S = {}, rid = {}; L.rooms.forEach(r => { rid[r.key] = r.room; }); Object.entries(L.districts).forEach(([k, v]) => { const rk = fold[v.room] || v.room; (S[rk] = S[rk] || { k: rk, n: lab[rk], d: [], room: rid[rk] }).d.push(k); });
    sub.divine = ['heaven', 'vatican', 'hell'].map(k => S[k]).filter(Boolean); }
  { const L = JSON.parse(fs.readFileSync(repo + '/docs/areas/space/layout.json', 'utf8'));
    sub.space = L.rooms.map(r => ({ k: r.id, n: r.name, d: Object.keys(r.districts || {}) })); }
  /* which zone a room belongs to */
  const zoneOfRoom = (r, R) => { if (R.world && R.world.hub) return R.world.hub; for (const [k, v] of Object.entries(H.hubs)) if ((v.rooms || []).includes(r)) return k;
    for (const [k, v] of Object.entries(H.hubs)) for (const s of v.sites || []) if (r.startsWith('site_' + s + '_')) return k; return null; };
  const zones = Object.entries(M.zones).map(([k, z]) => {
    const pts = z.rooms.filter(r => Number.isFinite(r.wx)).map(r => [r.wx + (r.cols || 0) / 2, r.wy + (r.rows || 0) / 2]);
    const plots = {}, pat = {}; z.rooms.forEach(r => (r.plots || []).forEach(p => { (plots[p[2]] = plots[p[2]] || []).push(p[1]); if (Number.isFinite(r.wx)) (pat[p[2]] = pat[p[2]] || []).push([r.wx + p[3] + .5, r.wy + p[4] + .5]); }));
    const avg = q => q && q.length ? [+(q.reduce((t, a) => t + a[0], 0) / q.length).toFixed(2), +(q.reduce((t, a) => t + a[1], 0) / q.length).toFixed(2)] : null;
    const ds = Object.entries(z.districts || {}).filter(([dk, v]) => v[0].length > 1 && !/^Wild link/.test(v[0])).map(([dk, v]) => ({ k: dk, n: v[0], c: v[1], p: plots[dk] || [], ...(avg(pat[dk]) ? { at: avg(pat[dk]) } : {}) }));
    const roomAt = id => { const r = z.rooms.find(q => q.room === id && Number.isFinite(q.wx)); return r ? [r.wx + (r.cols || 0) / 2, r.wy + (r.rows || 0) / 2] : null; };
    const S = (sub[k] || []).map(s => ({ k: s.k, n: s.n, d: s.d.filter(x => ds.some(q => q.k === x)), ...(s.room && roomAt(s.room) ? { at: roomAt(s.room) } : {}) })).filter(s => s.d.length);
    S.forEach(s => s.d.forEach(x => { const q = ds.find(q => q.k === x); q.s = s.k; if (!q.at && s.at) q.at = s.at; }));
    return { k, n: hubs[k] ? title(hubs[k]) : k, c: hcol[k] || (ds[0] && ds[0].c) || '#888888', at: avg(pts), d: ds, ...(S.length ? { s: S } : {}) };
  });
  /* the game's rooms that are not a district: Volcano Island, Pirates' Cove, the Spaceship, Hangar 18, the Haunted House's rooms...
     "A · B" = room B inside place A; a room that is a district (or holds districts) is not added again */
  const Z = Object.fromEntries(zones.map(z => [z.k, z])), skip = new Set(['site_prebuilt_gobekli_ow_line', 'site_prebuilt_atlantis_deep']), inK = { site_prebuilt_camelot_palace: 'K', site_prebuilt_camelot_sky: 'K', site_prebuilt_downtown_lobby: 'H' };
  Object.entries(H.rooms).forEach(([r, R]) => {
    if (!R || !R.label || skip.has(r) || (H.retired && H.retired[r]) || /^site_ow_/.test(r) || !/^site_/.test(r)) return;
    let zk = zoneOfRoom(r, R); const parts = R.label.split(' · ').map(title);
    for (const z of zones) if (z.k !== zk && z.d.some(q => same(parts[0], q.n))) { zk = z.k; break; }
    const z = Z[zk]; if (!z) return;
    const name = parts[parts.length - 1], isZ = n => same(n, z.n) || same(z.n, n), isD = n => z.d.some(q => !q.x && (same(n, q.n) || same(q.n, n) || q.n.startsWith(n + ' +'))) || (z.s || []).some(s => same(n, s.n));
    if (isZ(R.label.split(' · ').map(title).join(' ')) || isZ(name) || isD(name) || name.split(' + ').every(isD)) return;
    const at = R.world && Number.isFinite(R.world.wx) ? [R.world.wx + 1, R.world.wy + 1] : null;
    let host = inK[r] ? z.d.find(q => q.k === inK[r]) : parts.length > 1 && !isZ(parts[0]) ? z.d.find(q => same(parts[0], q.n) || same(q.n, parts[0]) || q.n.startsWith(parts[0] + ' ') || q.n.startsWith(parts[0] + ',')) : null;
    if (host) { if (!host.p.includes(name)) host.p.push(name); return; }
    if (parts.length > 1 && !isZ(parts[0])) { let g = z.d.find(q => q.x && same(q.n, parts[0])); if (!g) { g = { k: 'x_' + words(parts[0]).replace(/\W+/g, '_'), n: parts[0], c: z.c, p: [], x: 1 }; z.d.push(g); } if (!g.p.includes(name)) g.p.push(name); return; }
    if (z.d.some(q => q.n === name)) return;
    z.d.push({ k: 'x_' + r.replace(/^site_prebuilt_/, ''), n: name, c: z.c, p: [], x: 1, ...(at ? { at } : {}) });
  });
  /* a district with no plots on the world map stands where the room named after it stands */
  Object.entries(H.rooms).forEach(([r, R]) => { if (!R || !R.label || !R.world || !Number.isFinite(R.world.wx) || /^site_ow_/.test(r)) return; const z = Z[R.world.hub]; if (!z) return;
    const zr = M.zones[z.k].rooms.find(q => q.room === r), at = zr ? [zr.wx + (zr.cols || 0) / 2, zr.wy + (zr.rows || 0) / 2] : [R.world.wx + 1, R.world.wy + 1];
    const name = title(R.label.split(' · ').pop()); name.split(' + ').concat([name]).forEach(n => z.d.forEach(q => { if (!q.at && !q.x && (same(n, q.n) || same(q.n, n) || q.n.startsWith(n + ' +'))) q.at = at.map(v => +v.toFixed(2)); })); });
  const W = M.world; return { zones, world: { x0: W.x0, y0: W.y0, w: W.w, h: W.h, g: W.g, key: Object.fromEntries(Object.entries(W.key).map(([c, v]) => [c, v[2]])) } };
}
let rosterObj = JSON.parse(fs.readFileSync(d + '/roster.json', 'utf8')); rosterObj.places = places(); const freshAdded = require('./fresh.js')(rosterObj); if (freshAdded.length) console.log('new from the game:', freshAdded.join(', ')); rosterObj.spawns = require('./spawns.js')(rosterObj);
const roster = JSON.stringify(rosterObj).replace(/</g, '\\u003c');
const app = fs.readFileSync(d + '/app.js', 'utf8');
if (/<\/script/i.test(app)) throw new Error('script close in app');
t = t.replace('/*__ROSTER__*/null', () => roster).replace('/*__APP__*/', () => app);
fs.writeFileSync(d + '/../relationship-web.html', t);
// a wrapped copy for local testing, in the same skeleton the publisher adds
fs.writeFileSync(d + '/test.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + t + '</body></html>');
console.log('built', fs.statSync(d + '/../relationship-web.html').size);
