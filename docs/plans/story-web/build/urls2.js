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
  const rule = X.RACE_SPRITE_GENDERS[r] || null;
  const P = X.RACE_PORTRAITS[r] || {};
  const v = {};
  for (const gg of ['male', 'female']) { let s = null; try { s = X.getR2RaceSpriteUrl(r, gg); } catch (e) {} v[gg] = { portrait: P[gg] ? key(P[gg]) : null, sprite: key(s) }; }
  const pg = P.male ? 'male' : (P.female ? 'female' : null); const sg = pg || g[0] || 'male';
  out[r] = { genders: g, rule, v, portrait: pg ? key(P[pg]) : null, pg, sprite: v[sg].sprite, sg };
}
fs.writeFileSync(__dirname + '/urls2.json', JSON.stringify(out, null, 1));
const multi = Object.entries(out).filter(([k, x]) => x.genders.length > 1);
console.log('game says 2 genders:', multi.length, ' rule both:', Object.values(out).filter(x => x.rule === 'both').length);
console.log('rule both but game 1:', Object.entries(out).filter(([k, x]) => x.rule === 'both' && x.genders.length < 2).map(([k, x]) => k + '(' + x.genders + ')').join(', '));
console.log('same sprite both genders:', multi.filter(([k, x]) => x.v.male.sprite === x.v.female.sprite).map(([k]) => k).join(', '));
