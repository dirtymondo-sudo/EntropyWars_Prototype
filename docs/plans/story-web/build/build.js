const fs = require('fs'), d = __dirname;
let t = fs.readFileSync(d + '/template.html', 'utf8');
/* THE GAME'S PLACES (2026-11-18): every zone, its districts and (Disaster City) its plots, from data.js HQ_ZONE_MAP + the hub
   labels, and the world map's ground, so the web can add them as ready place groups and show the map beside them. */
function places() {
  const src = fs.readFileSync(d + '/../../../../data.js', 'utf8');
  const i = src.indexOf('const HQ_ZONE_MAP = ') + 20, j = src.indexOf(';\n/* ZONEMAP-END */', i), M = JSON.parse(src.slice(i, j));
  const hubs = {}; const h0 = src.indexOf('    hubs: {'); const hcol = {}; src.slice(h0, h0 + 20000).replace(/\n\s+(\w+):\s*\{ label: '([^']+)'([^\n]*)/g, (m, k, l, rest) => { hubs[k] = hubs[k] || l; const c = rest.match(/color: '(#[0-9a-fA-F]{6})'/); if (c && !hcol[k]) hcol[k] = c[1]; });
  const title = t => t.split(' ').map(w => /\./.test(w) || w === '+' ? w : w[0] + w.slice(1).toLowerCase()).join(' ');
  const zones = Object.entries(M.zones).map(([k, z]) => {
    const pts = z.rooms.filter(r => Number.isFinite(r.wx)).map(r => [r.wx + (r.cols || 0) / 2, r.wy + (r.rows || 0) / 2]);
    const plots = {}; z.rooms.forEach(r => (r.plots || []).forEach(p => (plots[p[2]] = plots[p[2]] || []).push(p[1])));
    const ds = Object.entries(z.districts || {}).filter(([dk, v]) => v[0].length > 1 && !/^Wild link/.test(v[0])).map(([dk, v]) => ({ k: dk, n: v[0], c: v[1], p: plots[dk] || [] }));
    return { k, n: hubs[k] ? title(hubs[k]) : k, c: hcol[k] || (ds[0] && ds[0].c) || '#888888', at: pts.length ? [pts.reduce((t, q) => t + q[0], 0) / pts.length, pts.reduce((t, q) => t + q[1], 0) / pts.length] : null, d: ds };
  });
  const W = M.world; return { zones, world: { x0: W.x0, y0: W.y0, w: W.w, h: W.h, g: W.g, key: Object.fromEntries(Object.entries(W.key).map(([c, v]) => [c, v[2]])) } };
}
let rosterObj = JSON.parse(fs.readFileSync(d + '/roster.json', 'utf8')); rosterObj.places = places(); rosterObj.spawns = require('./spawns.js')(rosterObj);
const roster = JSON.stringify(rosterObj).replace(/</g, '\\u003c');
const app = fs.readFileSync(d + '/app.js', 'utf8');
if (/<\/script/i.test(app)) throw new Error('script close in app');
t = t.replace('/*__ROSTER__*/null', () => roster).replace('/*__APP__*/', () => app);
fs.writeFileSync(d + '/../relationship-web.html', t);
// a wrapped copy for local testing, in the same skeleton the publisher adds
fs.writeFileSync(d + '/test.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + t + '</body></html>');
console.log('built', fs.statSync(d + '/../relationship-web.html').size);
