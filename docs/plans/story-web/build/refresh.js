/* THE PORTRAIT REFRESH (2026-11-19, mondo: "make sure it's updated with the latest character portraits").
   Step 1 of 2: pulls the baked roster back out of ../relationship-web.html into roster.json and writes cur-urls.json, the portrait
   and sprite every race + gender uses in the game today (sprites.js RACE_PORTRAITS / getR2RaceSpriteUrl).
   Step 2: `python3 -I refresh-faces.py` fetches them from cdn.entropywars.net, cuts the faces the way faces.py does and puts them
   in roster.json. Then `node build.js`. Story cast pictures (3D renders) are kept. */
const fs = require('fs'), vm = require('vm'), path = require('path'), d = __dirname, REPO = path.join(d, '..', '..', '..', '..');
const t = fs.readFileSync(path.join(d, '..', 'relationship-web.html'), 'utf8'), i = t.indexOf('const EW_DATA = ') + 16;
let dep = 0, j = i, s = false, e = false;
for (; j < t.length; j++) { const c = t[j]; if (s) { if (e) e = false; else if (c === '\\') e = true; else if (c === '"') s = false; continue; }
  if (c === '"') s = true; else if (c === '{') dep++; else if (c === '}' && !--dep) { j++; break; } }
const D = JSON.parse(t.slice(i, j)); delete D.places; delete D.spawns; D.races.forEach(r => { delete r.img; });
fs.writeFileSync(path.join(d, 'roster.json'), JSON.stringify(D));
const noop = () => {}, el = () => new Proxy(function () {}, { get: (t, k) => k === 'style' ? {} : (k === 'getContext' ? () => null : (k === 'toDataURL' ? () => '' : el())), apply: () => el(), set: () => true });
const win = { location: { search: '', href: '', hostname: 'x', protocol: 'https:' }, addEventListener: noop, localStorage: { getItem: () => null, setItem: noop }, navigator: { userAgent: '' } };
const ctx = { window: win, document: { createElement: el, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], head: el(), body: el(), documentElement: el() }, location: win.location, navigator: win.navigator, localStorage: win.localStorage, console: { log: noop, warn: noop, error: noop, info: noop }, setTimeout, clearTimeout, URL, Image: function () {}, fetch: () => Promise.reject(), performance: { now: () => 0 } };
ctx.globalThis = ctx; ctx.self = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(REPO, 'sprites.js'), 'utf8') + '\n;globalThis.__x = { getR2RaceSpriteUrl, RACE_PORTRAITS, ewAsset };', ctx, { filename: 'sprites.js' });
const S = ctx.__x, url = u => { if (!u || !/^https?:/.test(u)) return ''; try { return S.ewAsset(u); } catch (e) { return u; } }, out = {};
D.races.forEach(r => r.v.forEach(v => { const P = S.RACE_PORTRAITS[r.k] || {}; let sp = ''; try { sp = url(S.getR2RaceSpriteUrl(r.k, v.g)); } catch (e) {}
  out[r.k + '|' + v.g] = { p: P[v.g] ? url(P[v.g]) : '', s: sp }; }));
fs.writeFileSync(path.join(d, 'cur-urls.json'), JSON.stringify(out, null, 1));
console.log('roster.json:', D.races.length, 'races,', D.cast.length, 'cast; cur-urls.json:', Object.keys(out).length);
