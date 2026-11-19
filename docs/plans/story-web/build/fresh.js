/* THE ROSTER STAYS FRESH (2026-11-19, mondo: "i dont see the new units we added in the relationship web"). The web's roster was baked
   once (11-18), with portraits cut from the sprites by hand. This adds every race in data.js AVAILABLE_RACES the baked roster does not
   have yet (and a gender a race gained), read live from data.js + sprites.js: name, types, role, families, biomes, temper, lines,
   and its portrait (or its sprite, shown from the head down: `ip`) straight from cdn.entropywars.net.
   build.js runs it, and server.js runs it on the page it serves, so a unit added to the game shows up after the next deploy
   with no rebuild. Nothing on a board changes: a race's id stays r:<race> (r:<race>:<gender> for two genders). */
const fs = require('fs'), vm = require('vm'), path = require('path');
const REPO = path.join(__dirname, '..', '..', '..', '..');
function gameRaces() {
  const { makeSandbox } = require(path.join(REPO, 'load-data.js'));
  const sb = makeSandbox(); vm.runInContext(fs.readFileSync(path.join(REPO, 'data.js'), 'utf8') + '\n;globalThis.__X = { AVAILABLE_RACES, RACE_PROFILES, RACE_CLASS, RACE_FAMILIES, EW_RACE_BIOMES, HQ_NPC_TEMPERS, HQ_AREA_ENCOUNTERS, DOOR_TEXT: typeof DOOR_TEXT !== "undefined" ? DOOR_TEXT : {}, DOOR_ROSTER_LINES: typeof DOOR_ROSTER_LINES !== "undefined" ? DOOR_ROSTER_LINES : {} };', sb, { filename: 'data.js' });
  const noop = () => {}, el = () => new Proxy(function () {}, { get: (t, k) => k === 'style' ? {} : (k === 'getContext' ? () => null : (k === 'toDataURL' ? () => '' : el())), apply: () => el(), set: () => true });
  const win = { location: { search: '', href: '', hostname: 'x', protocol: 'https:' }, addEventListener: noop, localStorage: { getItem: () => null, setItem: noop }, navigator: { userAgent: '' } };
  const ctx = { window: win, document: { createElement: el, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], head: el(), body: el(), documentElement: el() }, location: win.location, navigator: win.navigator, localStorage: win.localStorage, console: { log: noop, warn: noop, error: noop, info: noop }, setTimeout, clearTimeout, URL, Image: function () {}, fetch: () => Promise.reject(), performance: { now: () => 0 } };
  ctx.globalThis = ctx; ctx.self = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(REPO, 'sprites.js'), 'utf8') + '\n;globalThis.__x = { getR2RaceSpriteUrl, RACE_PORTRAITS, ewAsset, getAvailableGendersForRace };', ctx, { filename: 'sprites.js' });
  return { X: sb.__X, S: ctx.__x };
}
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
module.exports = function fresh(D) {
  const have = Object.fromEntries(D.races.map(r => [r.k, r])), added = [];
  const { X, S } = gameRaces(), P = X.RACE_PROFILES || {}, T = X.HQ_NPC_TEMPERS || {}, DT = X.DOOR_TEXT || {};
  const groupOf = {}; Object.entries(T.groups || {}).forEach(([g, a]) => a.forEach(r => { groupOf[r] = g; }));
  const url = u => { if (!u || !/^https?:/.test(u)) return ''; try { return S.ewAsset(u); } catch (e) { return u; } };
  const look = (k, g) => { const p = S.RACE_PORTRAITS && S.RACE_PORTRAITS[k]; if (p && p[g]) return { img: url(p[g]) }; let s = ''; try { s = url(S.getR2RaceSpriteUrl(k, g)); } catch (e) {} return s ? { img: s, ip: 1 } : { img: '' }; };
  const genders = k => { let g = []; try { g = Array.from(S.getAvailableGendersForRace(k)); } catch (e) {} return g.length ? g : ['male']; };
  const label = (k, g) => { const p = P[k] || {}; return (g === 'female' && p.labelFemale) || (g === 'male' && p.labelMale) || p.label || k.replace(/\b\w/g, c => c.toUpperCase()); };
  const variant = (k, g, gs) => { const distinct = gs.length > 1 && label(k, 'male') !== label(k, 'female'); const v = Object.assign({ g, n: gs.length > 1 && !distinct ? label(k, g) + (g === 'male' ? ' (M)' : ' (F)') : label(k, g) }, look(k, g));
    const ln = (X.DOOR_ROSTER_LINES || {})[k + ':' + g]; if (ln && ln.length) v.q = ln.slice(0, 2).map(clean); return v; };
  const sites = {}; Object.entries(X.HQ_AREA_ENCOUNTERS || {}).forEach(([id, t]) => { const s = D.rooms && D.rooms[id] && D.rooms[id].site; if (s) (t.list || []).forEach(e => { (sites[e.race] = sites[e.race] || new Set()).add(s); }); });
  (X.AVAILABLE_RACES || []).forEach(k => {
    const gs = genders(k), r = have[k];
    if (r) { gs.forEach(g => { if (!r.v.some(v => v.g === g)) { r.v.push(variant(k, g, gs)); added.push(k + ' (' + g + ')'); } }); return; }
    const p = P[k] || {}, lines = (X.DOOR_ROSTER_LINES || {})[k] || [], co = (DT.CUSTOMS_OVERRIDES || {})[k];
    const nr = { k, n: label(k), t: p.types || [], role: (X.RACE_CLASS || {})[k] || '', fam: (X.RACE_FAMILIES || {})[k] || [], bio: (X.EW_RACE_BIOMES || {})[k] || p.biomes || [],
      home: (DT.POINT_OF_ENTRY || {})[k] || '', also: (DT.ALSO_NATIVE || {})[k] || [], cs: (co && co.status) || ((DT.CUSTOMS_BY_TYPE || {})[(p.types || [])[0]]) || '', cn: clean(co && co.note), dos: clean((DT.DOSSIER_NOTES || {})[k]),
      q: (Array.isArray(lines) ? lines : []).slice(0, 2).map(clean), fin: null, tmp: (T.races || {})[k] || '', grp: groupOf[k] || '', walks: [...(sites[k] || [])],
      v: gs.map(g => variant(k, g, gs)), dg: gs[0], fresh: 1 };
    if (gs.length === 1) nr.n = nr.v[0].n;
    D.races.push(nr); have[k] = nr; added.push(k);
  });
  return added;
};
if (require.main === module) { const D = { races: [], rooms: {} }; const a = module.exports(D); console.log(a.length, JSON.stringify(D.races.slice(0, 2), null, 1)); }
