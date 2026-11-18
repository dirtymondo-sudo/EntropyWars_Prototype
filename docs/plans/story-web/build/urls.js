const fs = require('fs'), vm = require('vm');
const raw = require('./raw.json');
const code = fs.readFileSync(require('path').join(__dirname, '../../../../sprites.js'), 'utf8');
const noop = () => {};
const el = () => new Proxy(function(){}, { get: (t, k) => k === 'style' ? {} : (k === 'getContext' ? () => null : (k === 'toDataURL' ? () => '' : el())), apply: () => el(), set: () => true });
const win = { location: { search: '', href: '', hostname: 'x', protocol: 'https:' }, addEventListener: noop, localStorage: { getItem: () => null, setItem: noop }, navigator: { userAgent: '' } };
const ctx = { window: win, document: { createElement: el, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], head: el(), body: el(), documentElement: el() }, location: win.location, navigator: win.navigator, localStorage: win.localStorage, console, setTimeout, clearTimeout, URL, Image: function(){}, fetch: () => Promise.reject(), performance: { now: () => 0 } };
ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
try { vm.runInContext(code + '\n;globalThis.__x = { getR2RaceSpriteUrl, RACE_PORTRAITS, RACE_SPRITES: typeof RACE_SPRITES!=="undefined"?RACE_SPRITES:null, ewAsset, getAvailableGendersForRace, RACE_SPRITE_GENDERS, EW_CDN, CHESS: typeof chessPieceLook!=="undefined" };', ctx, { filename: 'sprites.js' }); }
catch (e) { console.log('ERR', e.message, (e.stack || '').split('\n').slice(0, 4).join('\n')); }
const X = ctx.__x; if (!X) process.exit(1);
const key = u => { if (!u || !/^https?:/.test(u)) return null; let m = X.ewAsset(u); m = m.replace(/[?#].*$/, ''); if (!m.startsWith(X.EW_CDN)) return { raw: m }; return decodeURIComponent(m.slice(X.EW_CDN.length)); };
const out = {};
for (const r of raw.races) {
  let g = []; try { g = Array.from(X.getAvailableGendersForRace(r)); } catch (e) {}
  const P = X.RACE_PORTRAITS[r] || {};
  const pg = P.male ? 'male' : (P.female ? 'female' : null);
  const sg = pg || g[0] || 'male';
  let s = null; try { s = X.getR2RaceSpriteUrl(r, sg); } catch (e) { s = 'ERR ' + e.message; }
  out[r] = { genders: g, portrait: pg ? key(P[pg]) : null, pg, sprite: key(s), sg, legacy: X.RACE_SPRITES && X.RACE_SPRITES[r] ? key(X.RACE_SPRITES[r]) : null };
}
fs.writeFileSync(__dirname + '/urls.json', JSON.stringify(out, null, 1));
const v = Object.values(out);
console.log('portrait', v.filter(x => x.portrait).length, 'sprite', v.filter(x => x.sprite).length);
console.log(Object.entries(out).slice(0, 14).map(([k, x]) => k + ' | ' + x.portrait + ' | ' + JSON.stringify(x.sprite) + ' | ' + x.genders).join('\n'));
console.log(Object.entries(out).slice(100, 110).map(([k, x]) => k + ' | ' + JSON.stringify(x.sprite) + ' | ' + x.genders).join('\n'));
