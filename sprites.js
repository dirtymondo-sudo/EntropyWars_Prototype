const _S = 'https://cdn.entropywars.net/Assets/Sprites';

/* ── Safari CORS-cache guard (_ewCorsBust) ─────────────────────────────────
   The same R2 image URLs are fetched BOTH ways: as CSS background-image
   (no-CORS, no Origin header) and as WebGL/canvas textures
   (img.crossOrigin='anonymous' / THREE.TextureLoader). Safari's HTTP cache
   does not partition entries by request mode, so whichever fetch lands first
   poisons the other: a CSS-cached copy carries no Access-Control-Allow-Origin
   header, and a later crossOrigin load of the SAME URL is then blocked with
   "not allowed by Access-Control-Allow-Origin. Status code: 200" → black
   tiles/black textures. (The Cloudflare edge cache can serve the same
   headerless variant.) Fix: every crossOrigin load routes its URL through
   this helper, which appends ?ewcors=1 — the CORS variant gets its own cache
   entry that is ALWAYS fetched with an Origin header. Use it at every
   crossOrigin image/texture load of a cdn.entropywars.net URL; NEVER on CSS
   background URLs. */
function _ewCorsBust(u) {
    if (typeof u !== 'string' || u.indexOf('cdn.entropywars.net') === -1) return u;
    if (u.indexOf('ewcors=') !== -1) return u;
    return u + (u.indexOf('?') === -1 ? '?ewcors=1' : '&ewcors=1');
}
window._ewCorsBust = _ewCorsBust;

/* ── THE ASSET PATH MAP (docs/notes/r2-layout-plan.md, mondo 2026-11-04: "sounds like a good plan, go ahead") ──────────
   The R2 folders move in waves (Sprites/Races → characters/races, music → audio/music, ... under Assets/).
   EW_ASSET_MOVES is the ONE table of what moved: [old bucket prefix, new bucket prefix], longest prefix wins. Each wave's flip
   PR adds its rows here (the same rows as r2-layout.json, which the copy tool reads) and also rewrites the literal paths in
   the code + CSS, so the code reads the new folders. This file loads first, so everything after it can use:
     ewAsset(url)      a cdn.entropywars.net URL (or a bare 'Assets/...' key) → its moved URL / key; anything else unchanged.
     ewAssetKey(key)   a bucket key → its moved key (ASSET_MANIFEST lookups).
   THE SAFETY NET: every URL the page asks for goes through ewAsset at the browser's own doors — fetch, XHR, an <img>/<audio>/
   <video>/<source> src (property or setAttribute) — so a path a flip PR missed, one in a save file (editor rooms, UI Maker,
   creator looks) or one in another thread's in-flight PR still finds its file. Inline style backgrounds (style.backgroundImage /
   background / cssText / setProperty / a style attribute) are rewritten too, and so are HTML strings (innerHTML / outerHTML /
   insertAdjacentHTML), <style> textContent and new Audio(url) (2026-11-05). Only the static .css files can't be caught: flip
   PRs edit those literally. The old keys were archived to the private bucket once mondo had played on the new layout.
   window.EW_ASSET_MOVE_HITS counts the URLs the net rewrote, per old prefix (and EW_ASSET_MOVE_LOG keeps the first 200) —
   after a flip, anything listed there is a literal still to update. Kill-switch: ?ew_no_asset_moves=1 or
   window.EW_NO_ASSET_MOVES = true before load (then every URL is exactly as written; only useful while old keys exist). */
const EW_CDN = 'https://cdn.entropywars.net/';
const EW_ASSET_MOVES = [
  // ['Assets/<old>/', 'Assets/<new>/'],   (filled by each wave's flip PR)
  // W2 audio + ui, W3 fx (2026-11-04)
  ['Assets/music/', 'Assets/audio/music/'],
  ['Assets/SFX/', 'Assets/audio/sfx/'],
  ['Assets/vehicles/Sound effects/', 'Assets/audio/sfx/vehicles/'],
  ['Assets/fonts/', 'Assets/ui/fonts/'],
  ['Assets/Icons/', 'Assets/ui/icons/'],
  ['Assets/Sprites/Status/', 'Assets/ui/status/'],
  ['Assets/Sprites/ui/', 'Assets/ui/sprites/'],
  ['Assets/MapShots/', 'Assets/ui/mapshots/'],
  ['Assets/Entropy Wars_Static Logo.mp4', 'Assets/ui/brand/entropy_wars_static_logo.mp4'],
  ['Assets/door/DOOR_', 'Assets/ui/brand/DOOR_'],
  ['Assets/weapons/', 'Assets/fx/spell_props/'],
  ['Assets/Sprites/Effects/', 'Assets/fx/flipbooks/'],
  ['Assets/Sprites/vfx/', 'Assets/fx/sprites/'],
  ['Assets/Sprites/projectiles/', 'Assets/fx/projectiles/'],
  // W4 world (2026-11-04)
  ['Assets/door/models/', 'Assets/world/hq/models/'],
  ['Assets/door/textures/', 'Assets/world/hq/textures/'],
  ['Assets/decor/', 'Assets/world/props/meshy_decor/'],
  ['Assets/props/', 'Assets/world/props/misc/'],
  ['Assets/misc/ebd_', 'Assets/world/packs/elbolilloduro/ebd_'],
  ['Assets/misc/psxmp/', 'Assets/world/packs/pizzadoggy_psx_mega_pack/'],   // THE PSX MEGA PACK (2026-11-08): three-renderer _MISC_GLB rows 'psxmp/<category>/<file>' (catalogue rows use base 'psxmp')
  ['Assets/misc/Castles_and', 'Assets/world/packs/mcsteeg_castles/Castles_and'],
  ['Assets/misc/wings/', 'Assets/characters/gear/wings/'],
  ['Assets/misc/', 'Assets/world/props/meshy/'],
  ['Assets/christmas/', 'Assets/world/packs/elbolilloduro_christmas/'],
  ['Assets/halloween/', 'Assets/world/packs/elbolilloduro_halloween/'],
  ['Assets/Metro_PSX/', 'Assets/world/packs/elbolilloduro_metro_psx/'],
  ['Assets/oceanic/', 'Assets/world/packs/ocean/'],
  ['Assets/instruments/', 'Assets/world/packs/instruments/'],
  ['Assets/traps/', 'Assets/world/packs/traps/'],
  ['Assets/chess/', 'Assets/world/packs/chess/'],
  ['Assets/stairs/', 'Assets/world/packs/stairs/'],
  ['Assets/vehicles/', 'Assets/world/vehicles/'],
  ['Assets/animals/', 'Assets/world/animals/'],
  ['Assets/foilage/', 'Assets/world/nature/'],
  ['Assets/skies/', 'Assets/world/sky/'],
  ['Assets/Sprites/terrain/', 'Assets/world/terrain/'],
  ['Assets/Sprites/night cities files/', 'Assets/world/sky/night_cities/'],
  // W5 characters (2026-11-04): race folders lower-cased, anunaki -> annunaki, sherrif/sherriff -> sheriff
  ['Assets/Models/charactercreation/', 'Assets/characters/creator/'],
  ['Assets/Models/', 'Assets/characters/animations/'],
  ['Assets/Sprites/Races/animations/', 'Assets/characters/animations/legacy/'],
  ['Assets/Sprites/character_portraits/', 'Assets/characters/portraits/'],
  ['Assets/Sprites/character_sprites/', 'Assets/characters/sprites/'],
  ['Assets/Sprites/64x64/', 'Assets/characters/sprites/64x64/'],
  ['Assets/Sprites/Monsters/', 'Assets/characters/sprites/monsters/'],
  ['Assets/Sprites/Races/Demon/Female/', 'Assets/characters/races/demon/female/'],
  ['Assets/Sprites/Races/Demon/Male/', 'Assets/characters/races/demon/male/'],
  ['Assets/Sprites/Races/Demon/', 'Assets/characters/races/demon/'],
  ['Assets/Sprites/Races/Fairy/', 'Assets/characters/races/fairy/'],
  ['Assets/Sprites/Races/Giant/', 'Assets/characters/races/giant/'],
  ['Assets/Sprites/Races/Homosapien/Female/', 'Assets/characters/races/homosapien/female/'],
  ['Assets/Sprites/Races/Homosapien/Male/', 'Assets/characters/races/homosapien/male/'],
  ['Assets/Sprites/Races/Homosapien/', 'Assets/characters/races/homosapien/'],
  ['Assets/Sprites/Races/Nordic/Female/', 'Assets/characters/races/nordic/female/'],
  ['Assets/Sprites/Races/Nordic/Male/', 'Assets/characters/races/nordic/male/'],
  ['Assets/Sprites/Races/Nordic/', 'Assets/characters/races/nordic/'],
  ['Assets/Sprites/Races/Werewolf/', 'Assets/characters/races/werewolf/'],
  ['Assets/Sprites/Races/ai/', 'Assets/characters/races/ai/'],
  ['Assets/Sprites/Races/android/', 'Assets/characters/races/android/'],
  ['Assets/Sprites/Races/angel/', 'Assets/characters/races/angel/'],
  ['Assets/Sprites/Races/annunaki/', 'Assets/characters/races/annunaki/'],
  ['Assets/Sprites/Races/antihero/', 'Assets/characters/races/antihero/'],
  ['Assets/Sprites/Races/antperson/', 'Assets/characters/races/antperson/'],
  ['Assets/Sprites/Races/anubis/', 'Assets/characters/races/anubis/'],
  ['Assets/Sprites/Races/anunaki/', 'Assets/characters/races/annunaki/'],
  ['Assets/Sprites/Races/astronaut/', 'Assets/characters/races/astronaut/'],
  ['Assets/Sprites/Races/atlantean/', 'Assets/characters/races/atlantean/'],
  ['Assets/Sprites/Races/aztec/', 'Assets/characters/races/aztec/'],
  ['Assets/Sprites/Races/barbarella/', 'Assets/characters/races/barbarella/'],
  ['Assets/Sprites/Races/beequeen/', 'Assets/characters/races/beequeen/'],
  ['Assets/Sprites/Races/bigfoot/', 'Assets/characters/races/bigfoot/'],
  ['Assets/Sprites/Races/blackgoo/', 'Assets/characters/races/blackgoo/'],
  ['Assets/Sprites/Races/bligblog/', 'Assets/characters/races/bligblog/'],
  ['Assets/Sprites/Races/bunnygirl/', 'Assets/characters/races/bunnygirl/'],
  ['Assets/Sprites/Races/catgirl/', 'Assets/characters/races/catgirl/'],
  ['Assets/Sprites/Races/chef/', 'Assets/characters/races/chef/'],
  ['Assets/Sprites/Races/clown/', 'Assets/characters/races/clown/'],
  ['Assets/Sprites/Races/conspiracytheorist/', 'Assets/characters/races/conspiracytheorist/'],
  ['Assets/Sprites/Races/cosmicwraith/', 'Assets/characters/races/cosmicwraith/'],
  ['Assets/Sprites/Races/crystalguardian/', 'Assets/characters/races/crystalguardian/'],
  ['Assets/Sprites/Races/cultleader/', 'Assets/characters/races/cultleader/'],
  ['Assets/Sprites/Races/cultmember/', 'Assets/characters/races/cultmember/'],
  ['Assets/Sprites/Races/cyborg/', 'Assets/characters/races/cyborg/'],
  ['Assets/Sprites/Races/cyclops/', 'Assets/characters/races/cyclops/'],
  ['Assets/Sprites/Races/deepseafish/', 'Assets/characters/races/deepseafish/'],
  ['Assets/Sprites/Races/demonprince/', 'Assets/characters/races/demonprince/'],
  ['Assets/Sprites/Races/demonprincess/', 'Assets/characters/races/demonprincess/'],
  ['Assets/Sprites/Races/dinosaur/', 'Assets/characters/races/dinosaur/'],
  ['Assets/Sprites/Races/djinn/', 'Assets/characters/races/djinn/'],
  ['Assets/Sprites/Races/dragon/', 'Assets/characters/races/dragon/'],
  ['Assets/Sprites/Races/dreameater/', 'Assets/characters/races/dreameater/'],
  ['Assets/Sprites/Races/eagleman/', 'Assets/characters/races/eagleman/'],
  ['Assets/Sprites/Races/fallenangel/', 'Assets/characters/races/fallenangel/'],
  ['Assets/Sprites/Races/firefighter/', 'Assets/characters/races/firefighter/'],
  ['Assets/Sprites/Races/flesheater/', 'Assets/characters/races/flesheater/'],
  ['Assets/Sprites/Races/gangster/', 'Assets/characters/races/gangster/'],
  ['Assets/Sprites/Races/gargoyle/', 'Assets/characters/races/gargoyle/'],
  ['Assets/Sprites/Races/general/', 'Assets/characters/races/general/'],
  ['Assets/Sprites/Races/ghost/', 'Assets/characters/races/ghost/'],
  ['Assets/Sprites/Races/ghoul/', 'Assets/characters/races/ghoul/'],
  ['Assets/Sprites/Races/glitch/', 'Assets/characters/races/glitch/'],
  ['Assets/Sprites/Races/gnome/', 'Assets/characters/races/gnome/'],
  ['Assets/Sprites/Races/goatman/', 'Assets/characters/races/goatman/'],
  ['Assets/Sprites/Races/goblin/', 'Assets/characters/races/goblin/'],
  ['Assets/Sprites/Races/golem/', 'Assets/characters/races/golem/'],
  ['Assets/Sprites/Races/grey/', 'Assets/characters/races/grey/'],
  ['Assets/Sprites/Races/halfdemon/', 'Assets/characters/races/halfdemon/'],
  ['Assets/Sprites/Races/hippie/', 'Assets/characters/races/hippie/'],
  ['Assets/Sprites/Races/hondacivic/', 'Assets/characters/races/hondacivic/'],
  ['Assets/Sprites/Races/icequeen/', 'Assets/characters/races/icequeen/'],
  ['Assets/Sprites/Races/jackolantern/', 'Assets/characters/races/jackolantern/'],
  ['Assets/Sprites/Races/jellyfish/', 'Assets/characters/races/jellyfish/'],
  ['Assets/Sprites/Races/juggernaut/', 'Assets/characters/races/juggernaut/'],
  ['Assets/Sprites/Races/kaiju/', 'Assets/characters/races/kaiju/'],
  ['Assets/Sprites/Races/kifighter/', 'Assets/characters/races/kifighter/'],
  ['Assets/Sprites/Races/king/', 'Assets/characters/races/king/'],
  ['Assets/Sprites/Races/kingkong/', 'Assets/characters/races/kingkong/'],
  ['Assets/Sprites/Races/kraken/', 'Assets/characters/races/kraken/'],
  ['Assets/Sprites/Races/krampus/', 'Assets/characters/races/krampus/'],
  ['Assets/Sprites/Races/lochnessmonster/', 'Assets/characters/races/lochnessmonster/'],
  ['Assets/Sprites/Races/luchador/', 'Assets/characters/races/luchador/'],
  ['Assets/Sprites/Races/machineelves/', 'Assets/characters/races/machineelves/'],
  ['Assets/Sprites/Races/maincharacters/', 'Assets/characters/races/maincharacters/'],
  ['Assets/Sprites/Races/mantid/', 'Assets/characters/races/mantid/'],
  ['Assets/Sprites/Races/martian/', 'Assets/characters/races/martian/'],
  ['Assets/Sprites/Races/mech/', 'Assets/characters/races/mech/'],
  ['Assets/Sprites/Races/mermaid/', 'Assets/characters/races/mermaid/'],
  ['Assets/Sprites/Races/mime/', 'Assets/characters/races/mime/'],
  ['Assets/Sprites/Races/minotaur/', 'Assets/characters/races/minotaur/'],
  ['Assets/Sprites/Races/mothman/', 'Assets/characters/races/mothman/'],
  ['Assets/Sprites/Races/mummy/', 'Assets/characters/races/mummy/'],
  ['Assets/Sprites/Races/mushroomgirl/', 'Assets/characters/races/mushroomgirl/'],
  ['Assets/Sprites/Races/necromancer/', 'Assets/characters/races/necromancer/'],
  ['Assets/Sprites/Races/nephilim/', 'Assets/characters/races/nephilim/'],
  ['Assets/Sprites/Races/occulus/', 'Assets/characters/races/occulus/'],
  ['Assets/Sprites/Races/orboflight/', 'Assets/characters/races/orboflight/'],
  ['Assets/Sprites/Races/overlord/', 'Assets/characters/races/overlord/'],
  ['Assets/Sprites/Races/police/', 'Assets/characters/races/police/'],
  ['Assets/Sprites/Races/politician/', 'Assets/characters/races/politician/'],
  ['Assets/Sprites/Races/popstar/', 'Assets/characters/races/popstar/'],
  ['Assets/Sprites/Races/priest/', 'Assets/characters/races/priest/'],
  ['Assets/Sprites/Races/professor/', 'Assets/characters/races/professor/'],
  ['Assets/Sprites/Races/quarterback/', 'Assets/characters/races/quarterback/'],
  ['Assets/Sprites/Races/rabbit/', 'Assets/characters/races/rabbit/'],
  ['Assets/Sprites/Races/reptilian/', 'Assets/characters/races/reptilian/'],
  ['Assets/Sprites/Races/ringleader/', 'Assets/characters/races/ringleader/'],
  ['Assets/Sprites/Races/robinhood/', 'Assets/characters/races/robinhood/'],
  ['Assets/Sprites/Races/robot/', 'Assets/characters/races/robot/'],
  ['Assets/Sprites/Races/santaclause/', 'Assets/characters/races/santaclause/'],
  ['Assets/Sprites/Races/scarecrow/', 'Assets/characters/races/scarecrow/'],
  ['Assets/Sprites/Races/sentai/', 'Assets/characters/races/sentai/'],
  ['Assets/Sprites/Races/seraphim/', 'Assets/characters/races/seraphim/'],
  ['Assets/Sprites/Races/shadowentity/', 'Assets/characters/races/shadowentity/'],
  ['Assets/Sprites/Races/sharkman/', 'Assets/characters/races/sharkman/'],
  ['Assets/Sprites/Races/sherrif/', 'Assets/characters/races/sheriff/'],
  ['Assets/Sprites/Races/sherriff/', 'Assets/characters/races/sheriff/'],
  ['Assets/Sprites/Races/sidekick/', 'Assets/characters/races/sidekick/'],
  ['Assets/Sprites/Races/siren/', 'Assets/characters/races/siren/'],
  ['Assets/Sprites/Races/skeleton/', 'Assets/characters/races/skeleton/'],
  ['Assets/Sprites/Races/skinwalker/', 'Assets/characters/races/skinwalker/'],
  ['Assets/Sprites/Races/spy/', 'Assets/characters/races/spy/'],
  ['Assets/Sprites/Races/starfish/', 'Assets/characters/races/starfish/'],
  ['Assets/Sprites/Races/succubus/', 'Assets/characters/races/succubus/'],
  ['Assets/Sprites/Races/superhero/', 'Assets/characters/races/superhero/'],
  ['Assets/Sprites/Races/swampmonster/', 'Assets/characters/races/swampmonster/'],
  ['Assets/Sprites/Races/swordfighter/', 'Assets/characters/races/swordfighter/'],
  ['Assets/Sprites/Races/symbiote/', 'Assets/characters/races/symbiote/'],
  ['Assets/Sprites/Races/treeperson/', 'Assets/characters/races/treeperson/'],
  ['Assets/Sprites/Races/undead/', 'Assets/characters/races/undead/'],
  ['Assets/Sprites/Races/unicorn/', 'Assets/characters/races/unicorn/'],
  ['Assets/Sprites/Races/valkraye/', 'Assets/characters/races/valkraye/'],
  ['Assets/Sprites/Races/vampire/', 'Assets/characters/races/vampire/'],
  ['Assets/Sprites/Races/voidweaver/', 'Assets/characters/races/voidweaver/'],
  ['Assets/Sprites/Races/watcher/', 'Assets/characters/races/watcher/'],
  ['Assets/Sprites/Races/yeti/', 'Assets/characters/races/yeti/'],
  ['Assets/Sprites/Races/zombie/', 'Assets/characters/races/zombie/'],
  ['Assets/Sprites/Races/', 'Assets/characters/races/'],
  ['Assets/Sprites/', 'Assets/loose_sprites/'],   // the loose 2D sprites at the old Sprites/ root (race paper-dolls, icons, rings, rope ...): sort in W6
];
const _ewMoves = (function () {
  const rows = EW_ASSET_MOVES.slice().sort((a, b) => b[0].length - a[0].length);
  let off = false;
  try { off = !!window.EW_NO_ASSET_MOVES || /[?&]ew_no_asset_moves=1/.test(location.search); } catch (e) {}
  return off ? [] : rows;
})();
const _ewMoveMemo = new Map();
function ewAssetKey(key) {
  if (!_ewMoves.length || typeof key !== 'string') return key;
  for (let i = 0; i < _ewMoves.length; i++) if (key.startsWith(_ewMoves[i][0])) return _ewMoves[i][1] + key.slice(_ewMoves[i][0].length);
  return key;
}
function ewAsset(u) {
  if (!_ewMoves.length || typeof u !== 'string') return u;
  const bare = u.startsWith('Assets/');
  if (!bare && !u.startsWith(EW_CDN)) return u;
  const hit = _ewMoveMemo.get(u);
  if (hit !== undefined) return hit;
  const body = bare ? u : u.slice(EW_CDN.length);
  const q = body.search(/[?#]/), p = q >= 0 ? body.slice(0, q) : body, tail = q >= 0 ? body.slice(q) : '';
  let dp = p; try { dp = decodeURIComponent(p); } catch (e) {}
  const nk = ewAssetKey(dp);
  let out = u;
  if (nk !== dp) {
    const enc = nk.split('/').map(encodeURIComponent).join('/');
    out = (bare ? '' : EW_CDN) + enc + tail;
    try {
      const row = _ewMoves.find(r => dp.startsWith(r[0]))[0];
      const H = window.EW_ASSET_MOVE_HITS || (window.EW_ASSET_MOVE_HITS = {}); H[row] = (H[row] || 0) + 1;
      const L = window.EW_ASSET_MOVE_LOG || (window.EW_ASSET_MOVE_LOG = []); if (L.length < 200) L.push(u);
    } catch (e) {}
  }
  if (_ewMoveMemo.size > 20000) _ewMoveMemo.clear();
  _ewMoveMemo.set(u, out);
  return out;
}
window.ewAsset = ewAsset;
window.ewAssetKey = ewAssetKey;
(function _ewAssetNet() {
  if (!_ewMoves.length || typeof window === 'undefined') return;   // nothing moved: the browser's doors stay untouched
  try {
    if (typeof window.fetch === 'function') {
      const f0 = window.fetch;
      window.fetch = function (input, init) {
        if (typeof input === 'string') input = ewAsset(input);
        else if (input && typeof input.url === 'string' && typeof Request === 'function' && input instanceof Request) {
          const nu = ewAsset(input.url); if (nu !== input.url) input = new Request(nu, input);
        }
        return f0.call(this, input, init);
      };
    }
  } catch (e) {}
  try {
    const o0 = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (m, url) { const a = Array.prototype.slice.call(arguments); a[1] = ewAsset(String(url)); return o0.apply(this, a); };
  } catch (e) {}
  const wrapSrc = (C, prop) => {
    try {
      const d = C && Object.getOwnPropertyDescriptor(C.prototype, prop);
      if (!d || !d.set) return;
      Object.defineProperty(C.prototype, prop, Object.assign({}, d, { set: function (v) { return d.set.call(this, typeof v === 'string' ? ewAsset(v) : v); } }));
    } catch (e) {}
  };
  wrapSrc(window.HTMLImageElement, 'src');
  wrapSrc(window.HTMLMediaElement, 'src');
  wrapSrc(window.HTMLSourceElement, 'src');
  /* inline style backgrounds (portraits, sprites, terrain swatches set as background-image by React or by hand) */
  const cssUrls = (v) => (typeof v === 'string' && v.indexOf('cdn.entropywars.net') !== -1)
    ? v.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => 'url(' + q + ewAsset(u) + q + ')') : v;
  try {
    /* CSSStyleProperties = the new name of CSS2Properties (newer Firefox). Chrome has no accessors to wrap at all: the observer
       below covers it (2026-11-05). */
    const protos = [window.CSSStyleDeclaration && CSSStyleDeclaration.prototype, window.CSS2Properties && CSS2Properties.prototype,
                    window.CSSStyleProperties && CSSStyleProperties.prototype].filter(Boolean);
    for (const P of protos) for (const prop of ['backgroundImage', 'background', 'cssText', 'content', 'listStyleImage', 'borderImage', 'maskImage']) {
      const d = Object.getOwnPropertyDescriptor(P, prop);
      if (!d || !d.set || !d.configurable) continue;
      Object.defineProperty(P, prop, Object.assign({}, d, { set: function (v) { return d.set.call(this, cssUrls(v)); } }));
      if (prop === 'backgroundImage') window._ewStyleNetWrapped = true;
    }
    const sp0 = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function (n, v, pr) { return sp0.call(this, n, cssUrls(v), pr); };
  } catch (e) {}
  try {
    const s0 = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (n, v) {
      if (typeof v === 'string' && (n === 'src' || n === 'href' || n === 'xlink:href') && v.indexOf('cdn.entropywars.net') !== -1) v = ewAsset(v);
      else if (n === 'style') v = cssUrls(v);
      return s0.call(this, n, v);
    };
  } catch (e) {}
  /* HTML strings (2026-11-05, before the old keys were archived): an <img src>, a style="url(...)" or a <link href> written into
     innerHTML / outerHTML / insertAdjacentHTML is parsed straight to the network, past every door above (ui.js unit sprites,
     the editor's thumbnails, the UI Maker slices). Every cdn Assets/ URL in the string goes through ewAsset first. A URL ends at a
     quote, a bracket, < > & (so &quot; / &amp; stay as written), a backtick or a line break; spaces stay inside (old folder names
     like "vehicles/Sound effects/" have them). Only strings holding the cdn host pay for the regex. */
  const htmlUrls = (v) => (typeof v === 'string' && v.indexOf('cdn.entropywars.net/Assets/') !== -1)
    ? v.replace(/https:\/\/cdn\.entropywars\.net\/Assets\/[^"'()<>&`\\\n\r\t]+/g, (u) => ewAsset(u)) : v;
  try {
    for (const prop of ['innerHTML', 'outerHTML']) {
      const d = Object.getOwnPropertyDescriptor(Element.prototype, prop);
      if (!d || !d.set || !d.configurable) continue;
      Object.defineProperty(Element.prototype, prop, Object.assign({}, d, { set: function (v) { return d.set.call(this, htmlUrls(v)); } }));
    }
    const ia0 = Element.prototype.insertAdjacentHTML;
    if (ia0) Element.prototype.insertAdjacentHTML = function (pos, html) { return ia0.call(this, pos, htmlUrls(html)); };
  } catch (e) {}
  /* <style> text built at run time (the UI Maker sheet, the HUD skins): url()s in it */
  try {
    const d = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    if (d && d.set && d.configurable) Object.defineProperty(Node.prototype, 'textContent', Object.assign({}, d, {
      set: function (v) { return d.set.call(this, this.nodeName === 'STYLE' ? cssUrls(v) : v); }
    }));
  } catch (e) {}
  /* THE STYLE OBSERVER (2026-11-05): where style.backgroundImage = ... can't be wrapped (Chrome; see the protos above), an
     element whose inline style names an old cdn path gets it rewritten as soon as it enters the page, in the microtask before
     the browser resolves its styles, so the old URL is never fetched. Only nodes being added are looked at (a cheap substring
     check on the style attribute), never every style change, so nameplates moving each frame cost nothing. */
  try {
    if (!window._ewStyleNetWrapped && typeof MutationObserver === 'function') {
      const sa = Element.prototype.setAttribute;   // the wrapped one: it runs cssUrls on a style value
      const fix = (el) => {
        const s = el.getAttribute('style');
        if (s && s.indexOf('cdn.entropywars.net/Assets/') !== -1) { const n = cssUrls(s); if (n !== s) sa.call(el, 'style', n); }
      };
      const SEL = '[style*="cdn.entropywars.net/Assets/"]';
      const mo = new MutationObserver((recs) => {
        for (let i = 0; i < recs.length; i++) {
          const added = recs[i].addedNodes;
          for (let j = 0; j < added.length; j++) {
            const n = added[j];
            if (n.nodeType !== 1) continue;
            fix(n);
            if (n.firstElementChild) { const list = n.querySelectorAll(SEL); for (let k = 0; k < list.length; k++) fix(list[k]); }
          }
        }
      });
      const start = () => mo.observe(document.documentElement, { childList: true, subtree: true });
      if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start);
    }
  } catch (e) {}
  /* new Audio(url) hands the URL to the element inside the constructor, past the src setter */
  try {
    const A0 = window.Audio;
    if (typeof A0 === 'function') {
      const A = function Audio(src) { return arguments.length ? new A0(typeof src === 'string' ? ewAsset(src) : src) : new A0(); };
      A.prototype = A0.prototype;
      window.Audio = A;
    }
  } catch (e) {}
})();

const RACE_PATH_RULES = {
  'werewolf':   { folder: 'Werewolf',   capGender: false },
  'giant':      { folder: 'Giant',      capGender: false },
  'fairy':      { folder: 'Fairy',      capGender: false },
  'nordic':     { folder: 'Nordic',     capGender: true },
  'homosapien': { folder: 'Homosapien', capGender: true },
  'pirate':     { folder: 'Homosapien', capGender: true },
  'knight':     { folder: 'Homosapien', capGender: true },
  'shaman':     { folder: 'Homosapien', capGender: true },
  'mad scientist': { folder: 'Homosapien', capGender: true },
  'cowboy':     { folder: 'Homosapien', capGender: true },
  'men in black': { folder: 'Homosapien', capGender: true },
  'telepath':   { folder: 'Homosapien', capGender: true },
  'marksman':   { folder: 'Homosapien', capGender: true },
  'priest':     { folder: 'Homosapien', capGender: true },
  'gangster':   { folder: 'gangster',   capGender: false },  // 2026-09-10 — his OWN art landed (Races/gangster/: gangster_male.png + the rigged GLB)
  'door agent': { folder: 'Homosapien', capGender: true },   // DOOR_RACE_DESIGN (2026-09-14) — the agent sheet in 2D; the cast GLBs in 3D
  'police officer': { folder: 'Homosapien', capGender: true },   // 2026-09-21 — borrows the gunslinger sheet in 2D; his own GLBs in 3D (Races/police/)
  'time cop': { folder: 'Homosapien', capGender: true },   // 2026-10-24 — the Police Officer's 2D path
  'cult leader': { folder: 'Homosapien', capGender: true },      // 2026-09-21 — borrows the harbinger sheet in 2D; his own GLB in 3D (Races/cultleader/)
  'popstar':    { folder: 'popstar',    capGender: false },       // 2026-09-22 — HER OWN sheet (Races/popstar/popstar_female.png, the VFX pass) + her own GLB in 3D (Races/popstar/)
  'wizard':     { folder: 'Homosapien', capGender: true },
  'fortune teller': { folder: 'Homosapien', capGender: true },
  'demon':      { folder: 'Demon',      capGender: true },
  'demon prince':   { folder: 'demonprince',   capGender: false },
  'demon princess': { folder: 'demonprincess', capGender: false },
  'fallen angel':   { folder: 'fallenangel',   capGender: false },
  'cosmic wraith':  { folder: 'cosmicwraith',  capGender: false },
  'loch ness monster': { folder: 'lochnessmonster', capGender: false },

  'barbarella':     { folder: 'barbarella',    capGender: false },
  'black goo':      { folder: 'blackgoo',      capGender: false },
  'golem':          { folder: 'golem',         capGender: false },
  'honda civic':    { folder: 'hondacivic',    capGender: false },
  'ice queen':      { folder: 'icequeen',      capGender: false },
  'juggernaut':     { folder: 'juggernaut',    capGender: false },
  'ki fighter':     { folder: 'kifighter',     capGender: false },
  'king arthur':    { folder: 'king',          capGender: false },
  'king kong':      { folder: 'kingkong',      capGender: false },
  'minotaur':       { folder: 'minotaur',      capGender: false },
  'necromancer':    { folder: 'necromancer',    capGender: false },
  'occulus':        { folder: 'occulus',        capGender: false },
  'unicorn':        { folder: 'unicorn',        capGender: false },   // 2026-10-27 — Races/unicorn/unicorn.png
  'quarterback':    { folder: 'quarterback',   capGender: false },
  'robinhood':      { folder: 'robinhood',     capGender: false },
  'santa clause':   { folder: 'santaclause',   capGender: false },
  'super sentai':   { folder: 'sentai',        capGender: false },
  'symbiote':       { folder: 'symbiote',      capGender: false },
  'valkraye':       { folder: 'valkraye',      capGender: false },
  'watcher':        { folder: 'watcher',       capGender: false },
};

const RACE_SPRITE_GENDERS = {
  'homosapien': 'both',
  'pirate': 'both',
  'swordfighter': 'female',
  'knight': 'both',
  'shaman': 'both',
  'mad scientist': 'both',
  'cowboy': 'both',
  'men in black': 'male',   // 2026-10-27 — the cryptid agents; the Spy is her own race now
  'spy': 'female',   // 2026-10-27
  'telepath': 'both',
  'marksman': 'both',
  'priest': 'both',
  'gangster': 'male',
  'door agent': 'both',
  'police officer': 'male',   // 2026-09-21 — the regular cops are male rigs; the female is the CYBERPUNK skin (RACE_MODEL_SKINS), Cyberpunk City only
  'time cop': 'male',   // 2026-10-24 — the sheriff and the cop are male rigs only
  'jellyfish': 'male',        // 2026-09-21 — the jellyfish king
  'cult leader': 'male',      // 2026-09-21
  'popstar': 'female',        // 2026-09-22 — the headliner
  'starfish': 'male',   // 2026-09-30
  'ringmaster': 'male',   // 2026-09-30
  'bee queen': 'female',   // 2026-09-30
  'professor': 'male',   // 2026-09-30
  'deep sea fish': 'male',   // 2026-09-30
  'clown': 'male',   // 2026-09-30
  'bunny girl': 'female',   // 2026-09-30
  'sharkman': 'male',   // 2026-09-30
  'crystal guardian': 'male',   // 2026-09-30
  'jack o lantern': 'male',   // 2026-09-30
  'sidekick': 'male',   // 2026-09-30
  'mushroom girl': 'female',   // 2026-09-30
  'tree person': 'male',   // 2026-09-30
  'sheriff': 'male',   // 2026-09-30
  'astronaut': 'male',   // 2026-09-30
  'krampus': 'male',   // 2026-09-30
  'rabbit': 'male',   // 2026-09-30
  'luchador': 'male',   // 2026-09-30
  'firefighter': 'male',   // 2026-09-30
  'goblin': 'male',   // 2026-09-30
  'hippie': 'both',   // 2026-09-30
  'chef': 'male',   // 2026-10-25
  'eagleman': 'male',   // 2026-10-25
  'flesheater': 'male',   // 2026-10-25
  'mime': 'female',   // 2026-10-25 — the mime_female upload
  'mummy': 'female',   // 2026-10-25 — the undead batch
  'swamp monster': 'male',   // 2026-10-25
  'undead': 'male',   // 2026-10-25
  'unicorn': 'male',   // 2026-10-27 — one unicorn (one model, one roster tile)
  'bligblog': 'male',   // 2026-10-27
  'chess piece': 'male',   // 2026-10-29 — one set of pieces (one look per piece)
  'wizard': 'both',
  'fortune teller': 'both',
  'nordic': 'both',
  'martian': 'both',
  'orb of light': 'both',
  'demon': 'both',
  'djinn': 'both',
  'angel': 'both',
  'ghost': 'both',
  'robot': 'both',
  'catgirl': 'female',
  'succubus': 'female',
  'ai': 'female',
  'android': 'female',
  'fairy': 'female',
  'siren': 'female',
  'gargoyle': 'both',
  'glitch': 'both',
  'mech': 'both',
  'seraphim': 'both',
  'zombie': 'both',
  'shadow entity': 'both',
  'cyborg': 'female',
  'demon prince': 'male',
  'demon princess': 'female',
  'dreameater': 'both',
  'fallen angel': 'both',
  'goatman': 'male',
  'halfdemon': 'both',
  'mermaid': 'female',
  'nephilim': 'both',
  'vampire': 'both',
  'voidweaver': 'male',
  'cosmic wraith': 'male',
  'superhero': 'both',

  'general': 'male',
  'droid': 'female',
  'antihero': 'male',
  'conspiracy theorist': 'male',
  'overlord': 'male',
  'chosen one': 'female',
  'politician': 'male',
  'atlantean': 'both',
  'dinosaur': 'male',
  'dragon': 'male',
  'ghoul': 'male',
  'gnome': 'male',
  'kaiju': 'male',
  'kraken': 'male',
  'loch ness monster': 'male',
  'yeti': 'male',

  'barbarella': 'female',
  'black goo': 'male',
  'golem': 'male',
  'honda civic': 'male',
  'ice queen': 'female',
  'juggernaut': 'male',
  'ki fighter': 'both',
  'king arthur': 'male',
  'king kong': 'male',
  'minotaur': 'male',
  'necromancer': 'both',
  'occulus': 'male',
  'quarterback': 'male',
  'robinhood': 'male',
  'santa clause': 'male',
  'super sentai': 'male',
  'symbiote': 'female',
  'valkraye': 'female',
  'watcher': 'male',

};

// Genders of `race` that have a rigged 3D model wired in RACE_MODELS_3D
// below. (The werewolf day form borrows the homosapien male model at render
// time, but his OWN male entry is what makes him 3D-ready here.)
function race3DGenders(race) {
  if (typeof RACE_MODELS_3D === 'undefined') return [];
  const set = RACE_MODELS_3D[race];
  return set ? Object.keys(set) : [];
}

// True when the race can appear on the board as a 3D model at all. The
// roster gates (isUnitUnlocked in data.js, the CPU pools in state.js, the
// shop in ui.js) all route through this so matches stay 3D vs 3D.
function isRace3DReady(race) {
  return race3DGenders(race).length > 0;
}

function getAvailableGendersForRace(race) {
  const rule = RACE_SPRITE_GENDERS[race];
  let list;
  if (rule === 'both') list = ['male', 'female'];
  else if (rule === 'female') list = ['female'];
  else list = ['male'];
  // 3D-ONLY ROSTER RULE (2026-07-06): if this race has any rigged 3D model,
  // only the genders that actually have one are playable — e.g. 'wizard'
  // offers only the witch until a male model ships. Races with no models at
  // all keep their sprite genders here; they are locked wholesale by
  // isUnitUnlocked() / the CPU pools instead (and campaign still renders
  // their sprites via this unfiltered list).
  const g3d = race3DGenders(race);
  if (g3d.length) {
    const only3d = list.filter(g => g3d.includes(g));
    if (only3d.length) list = only3d;
  }
  return list;
}

const JOB_FOLDER_MAP = {
  'Warrior': 'knight',
  // The Tank split off the old Warrior job (2026-07-18) — same armored art.
  'Tank': 'knight',
  'Agent': 'agent',
  'Black Mage': 'blackmage',
  'White Mage': 'whitemage',
  'Gunslinger': 'gunslinger',
  'Harbinger': 'harbinger',
  'Sniper': 'sniper',
  'Psychic': 'psychic',
  'Raider': 'raider',
  'Harvester': 'harvester',
  'Engineer': 'engineer',
  'Freelancer': 'freelancer',
  // No homosapien swordmaster sprite set on R2 yet — the knight art is the
  // closest sword-and-armor stand-in for homosapiens who take the job.
  'Swordmaster': 'knight',
};

const _HERO_RACE_SPRITES = {
  'general': `${_S}/Races/maincharacters/generalvoss.png`,
  'droid': `${_S}/Races/maincharacters/aria.png`,
  'antihero': `${_S}/Races/maincharacters/epoch.png`,
  'conspiracy theorist': `${_S}/Races/maincharacters/harlanvox.png`,
  'overlord': `${_S}/Races/maincharacters/kael.png`,
  'chosen one': `${_S}/Races/maincharacters/morrigan.png`,
  'politician': `${_S}/Races/maincharacters/president.png`,
};

// 2026-10-04 — mondo's own 2D sprites (single-frame, 128px tall) in Assets/characters/sprites/.
// One file per race; hippie has one per gender. These win over every older/borrowed sheet.
/* ♟ THE CHESS PIECE (2026-10-29): there is no 2D art of mondo's chess set, so the piece's flat look (the roster tile, the portrait,
   the 2D board) is the piece's own chess glyph — ♟ ♞ ♝ ♜ ♛ ♚, the black set, in the set's near-black with a pale rim and a red glow —
   drawn once on a canvas. Each is also the KEY of that piece's 3D look (CHESS_PIECE_3D → overrideForms), the way the UFO form keys its
   craft: a piece spell sets unit._spriteOverride to its piece's look (battle.js UNIT_ANIM_OVERRIDES['chess piece']). */
const CHESS_PIECE_NAMES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
const _CHESS_GLYPHS = { pawn: '\u265F', knight: '\u265E', bishop: '\u265D', rook: '\u265C', queen: '\u265B', king: '\u265A' };
function _chessGlyphUri(piece) {
  try {
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '108px "Segoe UI Symbol", "Apple Symbols", "DejaVu Sans", "Noto Sans Symbols 2", serif';
    const ch = _CHESS_GLYPHS[piece] + '\uFE0E';   // text, never the emoji pawn
    g.shadowColor = 'rgba(255,40,40,0.75)'; g.shadowBlur = 14;
    g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = 'rgba(214,210,202,0.95)';
    g.strokeText(ch, S / 2, S * 0.54);
    g.shadowBlur = 0; g.fillStyle = '#2b2733';
    g.fillText(ch, S / 2, S * 0.54);
    const uri = c.toDataURL('image/png');
    if (uri && uri.indexOf('data:image/png') === 0) return uri;
  } catch (e) {}
  return `${_S}/homosapien.png#chess-${piece}`;   // no canvas (a headless tool): still one key per piece
}
const CHESS_PIECE_LOOKS = {};
CHESS_PIECE_NAMES.forEach(p => { CHESS_PIECE_LOOKS[p] = _chessGlyphUri(p); });
function chessPieceLook(piece) { return CHESS_PIECE_LOOKS[piece] || CHESS_PIECE_LOOKS.pawn; }

const _CS = `${_S}/character_sprites`;
const _CHARACTER_SPRITES = {
  'chess piece': CHESS_PIECE_LOOKS.pawn,   // 2026-10-29 — the pawn's glyph (THE CHESS PIECE above)
  'astronaut': `${_CS}/astronaut.png`,
  'bee queen': `${_CS}/beequeen.png`,
  'clown': `${_CS}/clown.png`,
  'crystal guardian': `${_CS}/crystalguardian.png`,
  'cult leader': `${_CS}/cultleader.png`,
  'deep sea fish': `${_CS}/deepseacreature.png`,
  'firefighter': `${_CS}/firefighter.png`,
  'goblin': `${_CS}/gremlin.png`,
  'ice queen': `${_CS}/icequeen.png`,
  'jack o lantern': `${_CS}/jackolantern.png`,
  'jellyfish': `${_CS}/jellyfish.png`,
  'kaiju': `${_CS}/kaiju.png`,
  'krampus': `${_CS}/krampus.png`,
  'mushroom girl': `${_CS}/mushroomgirl.png`,
  'police officer': `${_CS}/policeofficer.png`,
  'time cop': `${_CS}/policeofficer.png`,   // 2026-10-24 — the cop look
  'professor': `${_CS}/professor.png`,
  'rabbit': `${_CS}/rabbit.png`,
  'ringmaster': `${_CS}/ringmaster.png`,
  'sharkman': `${_CS}/sharkman.png`,
  'sheriff': `${_CS}/sheriff.png`,
  'sidekick': `${_CS}/sidekick.png`,
  'starfish': `${_CS}/starfish.png`,
  'tree person': `${_S}/Races/treeperson/treeperson.png`,   // 2026-10-25 — his new treeperson sprite (Races/treeperson/)
  'luchador': `${_CS}/wrestler.png`,
  // 2026-10-25 — mondo's sprites in each race's own R2 folder (Races/<race>/<race>.png; the chef's in male/)
  'chef': `${_S}/Races/chef/male/chef.png`,
  'eagleman': `${_S}/Races/eagleman/eagleman.png`,
  'flesheater': `${_S}/Races/flesheater/flesheater.png`,
  'mime': `${_S}/Races/mime/mime_female.png`,
  // 2026-10-25 — the undead batch: his sprites sit in the race folders beside the GLBs
  'mummy': `${_S}/Races/mummy/mummy_female.png`,
  'swamp monster': `${_S}/Races/swampmonster/swampmonster.png`,
  'undead': `${_S}/Races/undead/undead.png`,
  'bligblog': `${_S}/Races/bligblog/bligblog.png`,   // 2026-10-27
  'unicorn': `${_S}/Races/unicorn/unicorn.png`,   // 2026-10-27
};
const _CHARACTER_SPRITES_GENDERED = {
  'hippie': { male: `${_CS}/hippie_male.png`, female: `${_CS}/hippie_female.png` },
  // 2026-10-25 — the female sniper and the Spy wear his new sprites; the males keep their job sheets.
  'marksman': { male: `${_S}/Races/Homosapien/Male/sniper/homosapien_male_sniper.png`, female: `${_S}/Races/Homosapien/Female/sniper/sniper_female.png` },
  'men in black': { male: `${_S}/Races/Homosapien/Male/agent/homosapien_male_agent.png` },
  'spy': { female: `${_S}/Races/spy/spy_female.png` },   // 2026-10-27 — her own race now (was the men in black's female)
  // 2026-10-25 — his new shadowperson sprite on the male (the 3D one); the female keeps her own sheet.
  'shadow entity': { male: `${_S}/Races/shadowentity/male/shadowperson.png`, female: `${_S}/Races/shadowentity/female/shadowentity_female.png` },
  'bunny girl': { female: `${_S}/Races/bunnygirl/bunnygirl.png` },   // 2026-10-27 — her own sprite (mondo uploaded Races/bunnygirl/bunnygirl.png); was catgirl's borrowed sheet
  // 2026-10-27 — PRIEST + NUN MERGED: the Priest wears his sprite from his own folder (mondo uploaded Races/priest/priest.png);
  // the Nun, his female, keeps the whitemage female sheet she has always worn.
  'priest': { male: `${_S}/Races/priest/priest.png`, female: `${_S}/Races/Homosapien/Female/whitemage/homosapien_female_whitemage.png` },
};

const _SINGLE_FILE_RACES = {
  'barbarella': 'barbarella.png',
  'gangster': 'gangster_male.png',   // 2026-09-10 — Races/gangster/, male-only race
  'popstar': 'popstar_female.png',   // 2026-09-22 — Races/popstar/, female-only race (the user's sheet; the portrait too, for now)
  'black goo': 'blackgoo.png',
  'golem': 'golem.png',
  'honda civic': 'hondacivic.png',
  'ice queen': 'icequeen.png',
  'juggernaut': 'juggernaut.png',
  'king arthur': 'kingarthur.png',
  'king kong': 'kingkong.png',
  'minotaur': 'minotaur.png',
  'occulus': 'occulus.png',
  'unicorn': 'unicorn.png',   // 2026-10-27 — his own sprite
  'quarterback': 'quarterback.png',
  'robinhood': 'robinhood.png',
  'santa clause': 'santaclause.png',
  'super sentai': 'sentaired.png',
  'symbiote': 'symbiote.png',
  'valkraye': 'valkraye.png',
  'watcher': 'watcher.png',
};

const HONDA_CIVIC_SPRITES = {
  idle: `${_S}/Races/hondacivic/hondacivic.png`,
  moving: `${_S}/Races/hondacivic/hondacivic_2.png`,
  combat: `${_S}/Races/hondacivic/transformer.png`,
};

/* THE TIME COP's three looks (mondo 2026-10-24). Each value is the _spriteOverride a cast sets (battle.js
   UNIT_ANIM_OVERRIDES['time cop']) and the key RACE_MODELS_3D['time cop'].male.overrideForms maps to that
   look's model; it is also the 2D sprite if a model fails. The future cop has no 2D sprite of its own, so it
   borrows the cop's under its own #fragment (same image, a distinct key). */
const TIME_COP_LOOKS = {
  cop:     `${_S}/character_sprites/policeofficer.png`,
  sheriff: `${_S}/character_sprites/sheriff.png`,
  future:  `${_S}/character_sprites/policeofficer.png#future`,
};

const SENTAI_SPRITES = {
  red:    `${_S}/Races/sentai/sentaired.png`,
  blue:   `${_S}/Races/sentai/sentaiblue.png`,
  black:  `${_S}/Races/sentai/sentaiblack.png`,
  green:  `${_S}/Races/sentai/sentaigreen.png`,
  yellow: `${_S}/Races/sentai/sentaiyellow.png`,
  pink:   `${_S}/Races/sentai/sentaipink.png`,
  megazord: `${_S}/Races/sentai/megazord.png`,
};

const WEREWOLF_DAY_SPRITE_MALE   = `${_S}/Races/Werewolf/male/werewolf_day.png`;
const WEREWOLF_DAY_SPRITE_FEMALE = `${_S}/Races/Werewolf/female/werewolf_day.png`;

const FOOTBALL_SPRITE = `${_S}/football.png`;

function getR2RaceSpriteUrl(race, gender, cls) {
  if (!race) return null;
  if (_HERO_RACE_SPRITES[race]) return _HERO_RACE_SPRITES[race];
  if (_CHARACTER_SPRITES_GENDERED[race]) {
    const set = _CHARACTER_SPRITES_GENDERED[race];
    return set[gender] || set.male || set.female;
  }
  if (_CHARACTER_SPRITES[race]) return _CHARACTER_SPRITES[race];

  if (_SINGLE_FILE_RACES[race]) {
    const rules = RACE_PATH_RULES[race];
    const raceFolder = rules ? rules.folder : race.replace(/ /g, '');
    return `${_S}/Races/${raceFolder}/${_SINGLE_FILE_RACES[race]}`;
  }

  if (race === 'ki fighter') {
    const available = getAvailableGendersForRace(race);
    const g = available.includes(gender) ? gender : available[0];
    return `${_S}/Races/kifighter/${g}/kifighter_${g}.png`;
  }
  if (race === 'necromancer') {
    const available = getAvailableGendersForRace(race);
    const g = available.includes(gender) ? gender : available[0];
    return `${_S}/Races/necromancer/${g}/necromancer_${g}.png`;
  }

  const available = getAvailableGendersForRace(race);
  const g = available.includes(gender) ? gender : available[0];
  const rules = RACE_PATH_RULES[race];

  const raceFolder = rules ? rules.folder : race.replace(/ /g, '');

  const genderFolder = (rules && rules.capGender)
    ? (g === 'male' ? 'Male' : 'Female')
    : g;

  const raceFile = race.replace(/ /g, '');

  const _HOMOSAPIEN_RACE_JOB_MAP = {
    'knight': 'knight',
    // Pirate is the human Raider — its 2D sprites live in the raider job
    // folder (the pirate/ copies are only the 3D GLBs). Pin it here so it
    // doesn't fall through to JOB_FOLDER_MAP['Swordmaster'] → knight art.
    'pirate': 'raider',
    'shaman': 'harvester',
    'mad scientist': 'engineer',
    'cowboy': 'gunslinger',
    'men in black': 'agent',
    'telepath': 'psychic',
    'marksman': 'sniper',
    'priest': 'whitemage',
    'door agent': 'agent',      // DOOR_RACE_DESIGN (2026-09-14) — the Agent job sheet
    'police officer': 'gunslinger',   // 2026-09-21 — the 2D fallback only
    'time cop': 'gunslinger',         // 2026-10-24 — the 2D fallback only
    'cult leader': 'harbinger',       // 2026-09-21 — the 2D fallback only
    'wizard': 'blackmage',
    'fortune teller': 'harbinger',
  };
  const _subRaceJob = _HOMOSAPIEN_RACE_JOB_MAP[race];
  if (race === 'homosapien' || race === 'pirate' || _subRaceJob) {
    const jobKey = _subRaceJob || JOB_FOLDER_MAP[cls] || 'freelancer';
    return `${_S}/Races/${raceFolder}/${genderFolder}/${jobKey}/homosapien_${g}_${jobKey}.png`;
  }

  return `${_S}/Races/${raceFolder}/${genderFolder}/${raceFile}_${g}.png`;
}

function getBattleMapSpriteUrl(unit) {
    if (!unit) return '';

    if (unit._spriteOverride) return unit._spriteOverride;

    if (unit.race === 'werewolf' && typeof getCurrentCyclePhase === 'function' && getCurrentCyclePhase() === 'day') {
        return unit.gender === 'female' ? WEREWOLF_DAY_SPRITE_FEMALE : WEREWOLF_DAY_SPRITE_MALE;
    }
    if (unit._heroSpriteUrl) return unit._heroSpriteUrl;
    if (unit.race) {
        const url = getR2RaceSpriteUrl(unit.race, unit.gender || 'male', unit.cls || 'Freelancer');
        if (url) return url;
    }
    return '';
}

// ───────────────────────────────────────────────────────────────────────────
// Animated unit sprite sheets.
// Grid sheets (frames read left→right, top→bottom) played on a unit's battle
// billboard during actions. `attack` = damaging actions (basic attack +
// damaging spells); `spell` = non-damaging spells (e.g. Catgirl "Meow").
//   cols / rows = grid dimensions; frames = how many cells are actually used
//   (trailing cells may be empty — e.g. a 3×3 sheet with 8 frames).
// Frame stepping / texture handling lives in three-renderer.js; this is just
// the lookup table. Add a race here (and upload the sheets to R2) to give it
// animations — no other wiring needed.
// ───────────────────────────────────────────────────────────────────────────
// cols/rows/frames describe the `attack` sheet. When the `spell` sheet uses a
// different grid, add spellCols/spellRows/spellFrames to override it.
const RACE_SPRITE_ANIMATIONS = {
  'catgirl': {
    female: {
      // 1152×1152 sheets, 3×3 grid (384px cells); 8 frames used, last cell blank.
      attack: `${_S}/Races/catgirl/female/attack_animation_1.png`,
      spell:  `${_S}/Races/catgirl/female/attack_animation_2.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  'bigfoot': {
    male: {
      // 3×3 grid; 8 frames used, last cell blank.
      attack: `${_S}/Races/bigfoot/male/attack_animation_1.png`,
      spell:  `${_S}/Races/bigfoot/male/attack_animation_2.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  'grey': {
    male: {
      // 3×3 grid; 8 frames used, last cell blank.
      attack: `${_S}/Races/grey/male/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  'quarterback': {
    male: {
      // attack: 4×2 grid (8 cells, all used).
      attack: `${_S}/Races/quarterback/attack_animation_1.png`,
      // spell: 3×3 grid; 8 frames used, last cell blank.
      spell:  `${_S}/Races/quarterback/attack_animation_2.png`,
      cols: 4, rows: 2, frames: 8,
      spellCols: 3, spellRows: 3, spellFrames: 8,
    },
  },
  // Female Black Mage (Witch): 4×2 grid (8 cells). Male Wizard: 3×3 grid.
  'wizard': {
    female: {
      attack: `${_S}/Races/Homosapien/Female/blackmage/attack_animation_1.png`,
      cols: 4, rows: 2, frames: 8,
    },
    male: {
      attack: `${_S}/Races/Homosapien/Male/blackmage/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  // Female Psychic (Telepath): 3×3 grid; 8 frames used, last cell blank.
  'telepath': {
    female: {
      attack: `${_S}/Races/Homosapien/Female/psychic/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  // Female Knight: 3×3 grid; 8 frames used, last cell blank.
  'knight': {
    female: {
      attack: `${_S}/Races/Homosapien/Female/knight/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  // Engineer (Mad Scientist), both genders: 3×3 grids; 8 frames, last cell blank.
  'mad scientist': {
    female: {
      attack: `${_S}/Races/Homosapien/Female/engineer/attack_animation_1.png`,
      spell:  `${_S}/Races/Homosapien/Female/engineer/attack_animation_2.png`,
      cols: 3, rows: 3, frames: 8,
    },
    male: {
      attack: `${_S}/Races/Homosapien/Male/engineer/attack_animation_1.png`,
      spell:  `${_S}/Races/Homosapien/Male/engineer/attack_animation_2.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  // Male Agent (Men in Black): 3×3 grid; 8 frames used, last cell blank.
  'men in black': {
    male: {
      attack: `${_S}/Races/Homosapien/Male/agent/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  // Male Harbinger (Fortune Teller): 3×3 grid; 8 frames used, last cell blank.
  'fortune teller': {
    male: {
      attack: `${_S}/Races/Homosapien/Male/harbinger/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  // Fairy (female): 3×3 grid; 8 frames used, last cell blank.
  'fairy': {
    female: {
      attack: `${_S}/Races/Fairy/female/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
};

function getRaceSpriteAnimations(race, gender) {
  const set = RACE_SPRITE_ANIMATIONS[race];
  if (!set) return null;
  // A race may define sheets for only some genders (e.g. only Female Knight).
  // Match the unit's gender exactly; never substitute another gender's sheet.
  if (gender) return set[gender] || null;
  return set[Object.keys(set)[0]] || null;
}

// ───────────────────────────────────────────────────────────────────────────
// Rigged 3D unit models (GLB).
// Races registered here render on the battle board as a real skinned 3D model
// instead of the flat sprite slab. Each entry names a base GLB (the rigged,
// textured character) plus one GLB per animation clip. Clips must be exported
// from the SAME character as the model — see the rig-mismatch warning at
// ANIM_CLIPS_3D below.
//   model        base GLB (mesh + skin + texture). We use the Idle export so
//                the idle clip ships with the mesh in one download.
//   clips        idle / walk / cast / death → GLB whose first animation is
//                that clip. `cast` also plays for basic attacks.
//   heightRatio  model height in tiles (1.0 = same height as the 128px
//                sprite slabs, i.e. identical to the non-3D characters).
//   yawOffset    radians added if the model doesn't face +Z at rest.
//   moveTimeScale / castTimeScale / deathTimeScale
//                clip speed multipliers (board moves are fast — the walk
//                cycle needs ~2x to keep up with the tween).
// The 2D sprite stays as the loading placeholder, the ghost-preview art and
// the fallback when GLTFLoader is unavailable. Set window.EW_DISABLE_3D_UNITS
// = true (console) to force sprites for A/B comparison.
// ───────────────────────────────────────────────────────────────────────────
// ⚠ HARD RULE (verified 2026-07): Meshy auto-rigs EVERY character with its
// own unique skeleton rest pose (same bone NAMES, different bone positions/
// orientations), and each clip bakes absolute bone transforms for the ONE
// character it was exported with. A clip only animates correctly on the
// character it was exported FROM — DIRECT cross-character playback warps the
// mesh. Two ways around it:
//   1. (preferred, 2026-07-10) the shared UAL animation library below —
//      three-renderer.js mathematically RETARGETS its clips onto each
//      character's own skeleton at load time, so unique rest poses are fine.
//   2. (legacy fallback) per-character Meshy exports: in Meshy, open the
//      character → apply each library animation → export "with skin" →
//      upload into that race's folder alongside its Character_output.
//
// Also: a `model` GLB must be the RIGGED export ("Character output" or any
// "withSkin" — it has bones + skin weights). The generate/texture stage
// GLBs are boneless static meshes that nothing can animate.
//
// ── ANIMATION ROLE GUIDE (Meshy library clip → game slot) ──────────────────
// Standard slot set every character should aim for. Meshy file names are
// `Meshy_AI_<character>_biped_Animation_<Clip>_withSkin.glb`; durations are
// library-wide constants (same for every character):
//   idle        Idle_N (any numbered idle; ~5–8s loops)
//   walk        Running (0.67s — preferred; board tweens are fast) or
//               Walking (1.07s) at a higher moveTimeScale
//   run         (animation-library only) multi-tile dash sprint + hub
//               free-roam run; Meshy sets fall back to a boosted walk
//   dodge       (animation-library only) evade roll during dodge tweens;
//               falls back to idle
//   jump        Regular_Jump (1.93s) — plays during jump arcs
//   hit         Hit_Reaction / Hit_Reaction_1 (1.67s) — damage flinch
//   death       Dead (3.0s, stays down — preferred) or Knock_Down (2.53s)
//   cast        REQUIRED generic fallback for every action animation
//   castMagic   Charged_Spell_Cast (2.7s) — damaging magic (damageType:'magic')
//   castSupport mage_soell_cast (2.3s) — heals/buffs/debuffs (staff wave)
//   castRanged  Cowboy_Quick_Draw_Shooting (7.33s, trimmed to the draw →
//               shot → holster window) — guns/rifles/ray-guns and any
//               physical ranged hit; also basic attacks beyond melee reach
//   castMelee   sword slash / punch clips (none uploaded yet) — adjacent
//               physical strikes; falls back to `cast` + the engine lunge
//   castThrow   throw/pitch clips (none uploaded yet) — lobbed projectiles
//               (Quarterback footballs, grenades); falls back → castRanged
// Which slot plays for a given spell is decided by classifySpellAnimKind()
// below (called from battle.js triggerCastAnim). Missing slots fall back
// per-chain, ultimately to `cast`, then to the plain lunge/glow tween.
//
// BASIC ATTACKS (2026-07-11d): rigged models play their attack clip INSTEAD
// of the legacy lunge tween (the lunge only survives as the sprite/fallback
// path — see _syncCombatAnims). The clip family defaults to castMelee
// (adjacent) / castRanged (reach > 1), but a def can claim a character-
// appropriate flavor with `basicAttackKind: 'magic' | 'arrow' | 'punch' |
// 'claw' | 'throw' | 'ranged' | 'melee'` — casters zap, archers loose,
// brawlers punch, beasts rake, Santa lobs a present. battle.js
// triggerAttackAnim reads it off the unit's 3D def ('chop' overrides win).
// ─────────────────────────────────────────────────────────────────────────

// Spell/ability → animation category. Returns 'magic' | 'support' |
// 'ranged' | 'melee' | 'throw' | 'plant'. Keep this the single source of truth so
// secondary jobs stay consistent: a Warrior who learns Fireball still plays
// castMagic; a Black Mage swinging a wrench plays castMelee.
// A capstone for the animation rule: the pillar's r4★ node (data.js
// isCapstoneSpellId, derived from RACE_TREE / CLASS_TREE) — `tier: 'III'`
// stands in when data.js is not on the page (the forge preview stage).
function _isCapstoneSpellForAnim(spell) {
  if (!spell) return false;
  try {
    if (typeof isCapstoneSpellId === 'function') return !!isCapstoneSpellId(spell.id);
  } catch (e) { /* fall through to the tier */ }
  return spell.tier === 'III';
}

// ── THE ANIM ROUTER (2026-09-24, SPELL_DIRECTOR_PLAN Phase 4 THE BODY) ──
// Four clips played 84 % of the game (castSupport 25 %, the charged cast
// 27 %), and every beast's bite, whip and stomp swung a sword. SPELL_ANIM_VERBS
// names the verb a spell PERFORMS; the verb is an anim kind with its own
// chain (three-renderer.js _castChainFor → the `defer` slots in UAL_SLOTS).
// A spell listed here skips the text rules below entirely — this table beats
// every regex, and it is the ONE place to change a spell's body language
// (it lives here, not in battle.js SPELL_DIRECTOR_ROWS, because the forge
// preview and the party builder classify without battle.js on the page).
// A spell not listed keeps the rules below. The census
// (check-spell-presentation.js) reports the spread; target ≤ 15 % a clip.
const SPELL_ANIM_VERBS = {
  channel: ['raceEntropicBeam', 'raceFreezeBreath', 'raceDragonBreath',
    'raceKiWave', 'racePsychicBeam', 'sentaiBlueWave', 'raceJudgmentBeam', 'raceBalefulGaze', 'raceAuroraRay',
    'raceAbductionBeam', 'raceStasisBeam', 'sharedShrinkRay', 'raceSonicBreaker', 'racePlasmaCannon',
    'raceHellmouth', 'raceLaserBeam', 'raceDragonfire', 'raceAtomicBreath',
    'raceFractalNeedle', 'raceDeathGaze', 'raceFractalStitch',
    'goAntimagicGaze'],   // 2026-10-27: the Occulus's own stare (its unique family; was the plain bolt)
  call: ['raceWhistle', 'raceSummonCreation', 'raceCultSermon', 'raceCultGathering', 'raceSwarmSignal',
    'raceSirenSong', 'raceCallOfTheDeep', 'raceWalkThePlank'],
  reap: ['raceHarvestHook', 'raceHitALick', 'raceCultTithe', 'raceStealFromRich', 'raceWeighTheHeart',
    'raceSpellsteal', 'raceEarthenGrasp'],
  pour: ['raceCultKoolAid', 'raceFluorideWater', 'raceSplash', 'raceCorrosiveSplash', 'racePoliceSpray',
    'raceOozeTrail', 'raceFlood', 'sharedPoisonSwamp', 'raceTidalBlessing', 'raceOvercharge', 'raceFairyDust'],
  heavySlash: ['raceBlessedBlade'],
  hook: ['racePlasmaWhip', 'raceTendrilStrike', 'raceElbowGrease', 'raceTentacleLash'],
  leap: ['raceStoneDrop', 'racePredatorDrop', 'raceDescendingWrath'],
  guard: ['fortify', 'protect1', 'raceStoneform', 'raceChivalry', 'raceIronBulwark', 'raceStoneSkin',
    'raceThickHide', 'raceChitinArmor', 'sentaiBlackGuard', 'racePsychicBarrier', 'raceSiegeMode',
    'raceSymbioteArmor', 'shieldBash', 'raceShieldWall', 'raceHolyBulwark', 'raceShieldMaiden',
    'raceLuminousShield', 'racePleiadianShield', 'raceAstralBarrier', 'racePupilShield'],
  open: ['raceBlizzardPresent', 'raceWishGranted', 'racePlunder'],
  touch: ['raceTuneFrequency', 'racePrismMirror', 'raceNeuralHack', 'raceBlueScreen',
    'raceSystemAnalysis', 'raceVoodoo', 'raceSoulBind', 'raceFederationBeacon', 'fiveGTower',
    'raceClockworkTurret', 'raceCloneDecoy', 'raceGravityBoots', 'raceOvertinker', 'raceFirewallProtocol',
    'raceTarotDraw', 'raceZigguratProtocol', 'freeEnergy', 'racePoliceCuffs'],
  push: ['raceBodyCheck', 'raceShockwaveClap', 'raceTsunami', 'sharedTidalSurge'],
  lantern: ['goEyeStalks',   // 2026-10-27: the Occulus sweeps its stare across the field as the rays fire (was the plain bolt)
    'raceOmniVision', 'raceCosmicSight', 'raceRangefinder', 'racePredictiveModel', 'racePopSpotlight',
    'raceRedEyes', 'raceCrystalBall'],
  phone: ['raceExecutiveOrder', 'raceBlackBudget', 'raceFireForEffect', 'raceArtilleryStrike', 'sharedNuke',
    'raceRallyCommand', 'raceClassifiedWeapon', 'racePoliceLockdown', 'raceWarOfTheWorlds'],
  reload: ['raceIncendiaryRounds', 'raceExtendedClips'],
  // spell look audit FX-5 (2026-10-26): Bipod is "legs down, belly down" — the marksman kneels to set the rifle
  // (castTrap's Fixing_Kneeling) instead of standing through it
  deploy: ['goBipod'],
  dance: ['encore', 'raceEndZoneDance', 'raceSpaceDisco', 'racePopStadiumShow'],
  smug: ['racePlotArmor', 'raceInvulnerable', 'raceTinFoilHat', 'raceGrimResolve', 'raceSadBackstory',
    'raceUnderdogSpirit', 'raceIndomitableWill'],
  cheer: ['jackOfAll', 'raceAudible', 'raceHallelujah', 'raceMeow'],
  stealth: ['camouflage', 'raceAgentVanish', 'raceCryptidVanish', 'raceCorpseCrawl', 'raceTreelineRetreat',
    'raceForestAmbush', 'raceNimbleDodge', 'raceShedSkin', 'raceDeepDive'],
  // the verbs that already had a slot, now claimed by name
  heal: ['healAll', 'raceAbsolution', 'raceNordicAccord', 'raceSanctuary', 'raceTemporalTide', 'racePurify'],
  consume: ['raceMonsterSerum', 'raceAdrenalineRush'],
  claw: ['raceJurassicJaw', 'raceMandibleStrike', 'raceAmbushLunge', 'raceTerrorPounce', 'racePounce',
    'raceBloodFrenzy', 'raceFrenzy', 'raceZombieRush'],
  punch: ['raceFlurryOfBlows'],
  // the charges ran the old melee swing on arrival (chargeToTarget beat
  // their `dash` / `tackle` kind): the shoulder-check is what a charge lands
  tackle: ['raceGoreCharge', 'raceApexCharge', 'raceRamCharge', 'raceUnstoppableCharge', 'raceBullRush',
    'raceBlitz'],
  dash: ['raceDarkFeather', 'raceShadowInfiltration'],   // the low lunging stab (a spear thrust)
  throw: ['sharedSmokeScreen',
    'raceLumpOfCoal'],   // mondo 2026-10-18: "its just supposed to be santa clause throwing a lump of coal" (overhand throw)
  // ── THE NEW CLIPS (2026-09-25, SPELL_DIRECTOR_PLAN Phase 8): mondo's third
  // Meshy batch, consolidated into MAL3_Sniper.glb (lib 4). Each verb was
  // assigned from the clip SEEN (anim-sheets.js --follow, the in-game viewer),
  // not its file name. The slots and their strike frames are in UAL_SLOTS.
  roar: ['warCry', 'raceApexRoar', 'raceDemonicRoar', 'raceLabyrinthRoar', 'raceDragonfear', 'raceFear',
    'raceDreadAura', 'raceDeafeningWail', 'racePrimalRoar', 'raceHowl', 'raceChestPound', 'raceBoo'],
  // THE NEW CLIPS, mondo's mapping (2026-09-25): drains pull IN (cast_4),
  // gravity / kinetic spells lift and THROW (cast_2), walls rise out of the
  // ground (Earth_Raise = the Charged_Spell_Cast push).
  drain: ['lifeDrain', 'raceVoidContract', 'raceSoulSuck', 'raceKissOfDecay', 'raceDreamSiphon', 'raceLifetap',
    'raceAbsorb', 'raceSoulDrain', 'raceSymbioticDrain', 'raceDrainingEmbrace', 'leechSeed'],
  kinetic: ['kineticHurl', 'raceSingularity', 'raceGravityWell', 'sharedBlackHole', 'sharedLowGravity', 'sharedGravityCrush'],
  earth: ['rampart', 'raceGothicRampart', 'sharedFissure', 'racePermafrost', 'wallOfFire', 'raceSacredGeometry'],
  skyward: ['thunderstorm', 'sharedSummonBlizzard', 'sharedSummonBloodRain', 'sharedSummonSandstorm', 'meteor',
    'raceStarDecree', 'raceCataclysmDecree', 'raceProphecyOfDisaster', 'raceCrowStorm', 'raceWhiteChristmas',
    'raceKnightsOfRound'],
  hurl: ['fire1', 'sentaiMegazordBlast', 'raceHeatDeath', 'raceDivineSmite', 'raceAncientMagic', 'raceHocusPocus',
    'exorcism', 'raceMerkaba', 'raceRealityPulse', 'sharedNebula', 'raceDarkDominion', 'raceBaphometsRite'],
  nova: ['raceToxicNova', 'racePhotonScatter', 'raceNightmarePulse', 'raceResonancePulse', 'raceSupernova',
    'empBurst', 'requiem', 'racePoseidonsWrath', 'raceWingGust'],
  rise: ['raceKiCharge', 'raceAwakening', 'raceHellfireCrown', 'raceInnerDemon', 'raceTransform', 'raceAbyssalWings',
    'raceNitroBoost', 'raceApeFury', 'raceBloodRitual', 'raceDeathPact', 'raceOvercalculate', 'raceProphecyFulfilled',
    'raceMimicry', 'raceMitosisSplit', 'raceRaiseDead', 'raceShamblingHorde'],
  curse: ['discordance', 'provoke', 'raceAnchor', 'raceCalcify', 'raceCharm', 'raceContract',
    'raceCurseOfMisfortune', 'raceHaunt', 'raceInfernalConscription', 'raceNaughtyList', 'racePolymorph',
    'sharedHexOfToil', 'raceStarCrossed', 'raceCultIndoctrinate', 'racePossession', 'raceShadowRealm'],
  psychic: ['mindShatter', 'raceMindCrush', 'raceBrainwash', 'psychosis', 'raceHypnoticPulse', 'raceDeneuralizer',
    'raceEnthrall', 'raceTelepathicLink', 'raceSleepParalysis', 'sharedEgoDeath', 'raceBadTrip', 'raceMemoryLeak'],
  smash: ['raceSasquatchSmash', 'raceColossalCrush', 'racePrimalSmash', 'skullCrack', 'raceAvalancheStrike',
    'raceNoMercy', 'racePoliceNightstick', 'raceHydraulicCrush', 'raceGiantSmash'],
  sweep: ['raceDinoTailWhip'],
  jab: ['raceRoboPunch', 'raceFrozenPunch', 'raceHydraulicPunch', 'reallyGoodPunch', 'raceRocketFist', 'haymaker'],
  rally: ['raceOathOfValor', 'raceRoyalDecree'],
  slash: ['sentaiRedSlash', 'raceSyntheticBlade', 'sneakSlash'],
  doubleSlash: ['crossSlash', 'bladeWaltz'],
  roundhouse: ['raceBigKick'],
  // the clips that CARRY THE BODY (UAL_SLOTS `travel`): the clip's own
  // run / jump / lunge moves the unit, so the board's strike leap, dive arc
  // or sprint is skipped for these (battle.js _clipOwnsTravel)
  thrust: ['raceValkyrieSpear'],
  upSlash: ['dragonSlash'],
  leapSlash: ['judgment', 'raceExcaliburStrike'],
  leapPunch: ['raceSeismicLeap', 'raceTitanDrop', 'raceCliffCharge', 'raceHeroicLeap', 'raceDragonFist',
    'raceDarkJustice'],
  flyKick: ['racePredatorLeap', 'raceFeralDive', 'raceDivineSwoop', 'raceSkyTackle', 'racePopStageDive'],
};
const _SPELL_VERB_BY_ID = {};
for (const _v in SPELL_ANIM_VERBS) for (const _id of SPELL_ANIM_VERBS[_v]) _SPELL_VERB_BY_ID[_id] = _v;

// THE LOOK (2026-09-26, SPELL_LIBRARY_PLAN.md §4.6, Phase 2): a row may pick
// its caster's animation itself — `animVerb` (a kind below, = a _castChainFor
// chain), `animSlot` (a raw UAL_SLOTS slot) or `animClip: { name, lib }` (an
// unwired library clip, baked on demand into the synthetic slot 'clip:<name>'
// — registerSpellAnimClips). Only a KIND STRING travels to the renderer, so a
// slot pick is encoded as 'slot:<slot>/<autoKind>' and _castChainFor decodes
// it to [slot, ...chain(autoKind)] — an unknown slot falls down the chain.
const SPELL_ANIM_KINDS = ['support', 'ranged', 'throw', 'plant', 'melee', 'heal', 'aoe', 'ultimate', 'slam',
  'arrow', 'kick', 'punch', 'claw', 'consume', 'deploy', 'dash', 'tackle', 'magic', 'channel', 'call', 'reap',
  'pour', 'heavySlash', 'hook', 'leap', 'guard', 'open', 'touch', 'push', 'lantern', 'phone', 'reload', 'dance',
  'smug', 'cheer', 'stealth', 'roar', 'skyward', 'hurl', 'nova', 'drain', 'kinetic', 'earth', 'rise', 'curse',
  'psychic', 'smash', 'sweep', 'jab', 'rally', 'slash', 'doubleSlash', 'roundhouse', 'thrust', 'upSlash',
  'leapSlash', 'leapPunch', 'flyKick'];
// the synthetic slot a row's animClip bakes into ('clip:<name>'), or null
function spellAnimClipSlot(def) { return (def && def.animClip && typeof def.animClip === 'object' && def.animClip.name) ? 'clip:' + def.animClip.name : null; }

function classifySpellAnimKind(spell, opts) {
  if (!spell) return 'melee';
  // THE LOOK (SPELL_LIBRARY_PLAN.md §4.6, Phase 2): a row's own pick beats the
  // verb table and the rules (opts.rulesOnly and opts.noPick skip it — the
  // tests pin the rules, the editor's AUTO row wants the unpicked kind).
  if (!(opts && (opts.rulesOnly || opts.noPick))) {
    if (typeof spell.animVerb === 'string' && SPELL_ANIM_KINDS.indexOf(spell.animVerb) >= 0) return spell.animVerb;
    const _auto = () => classifySpellAnimKind(spell, { noPick: true });
    if (typeof spell.animSlot === 'string' && spell.animSlot) return 'slot:' + spell.animSlot + '/' + _auto();
    if (spell.animClip && typeof spell.animClip === 'object' && typeof spell.animClip.name === 'string' && spell.animClip.name) return 'slot:clip:' + spell.animClip.name + '/' + _auto();
  }
  // THE ANIM ROUTER first: a named verb beats every rule below
  // (opts.rulesOnly skips it — the tests pin the rules themselves).
  if (spell.id && !(opts && opts.rulesOnly) && Object.prototype.hasOwnProperty.call(_SPELL_VERB_BY_ID, spell.id)) return _SPELL_VERB_BY_ID[spell.id];
  const text = ((spell.id || '') + ' ' + (spell.name || '') + ' '
              + (spell.projectileOverride || '')).toLowerCase();
  // Charge-to-target gap closers (Brave Charge, Zombie Rush…) sprint in and
  // strike on arrival — always a melee swing, whatever the listed range.
  if (spell.chargeToTarget) return 'melee';
  // THE DOOR AGENT rev 3 (2026-09-20): every row that wears `doorGun: true`
  // is the agent SHOOTING A DOOR out of the door gun — the quick-draw clip,
  // whatever the kind (the swing, the way in, the trapdoor, the drop).
  if (spell.doorGun) return 'ranged';
  // 2026-09-09: the MOVE kinds by `kind`, never by text — a `tackle` runs
  // its charge then shoulder-checks on arrival (UAL2 Shield_Dash via
  // castTackle), a `dash` slides its line with a low lunging stab (UAL2
  // Sword_Dash via castDash; Drive-By's afterShot still reads as the lunge).
  if (spell.kind === 'tackle') return 'tackle';
  if (spell.kind === 'dash') return 'dash';
  // Kill Mode (robot, was Chassis Slam — id raceChassisSlan would otherwise
  // hit the slam bucket below): a 360° weapons-free barrage reads as gunfire.
  if (/kill.?mode/.test(text)) return 'ranged';
  // The zombie stampede: the caster calls the horde down — charged AOE cast.
  if (/horde|stampede/.test(text)) return _isCapstoneSpellForAnim(spell) ? 'ultimate' : 'aoe';
  // Potions / consumables (battle.js item use fires a synthetic spell) —
  // UAL2 Consume swig via castConsume.
  if (/potion|elixir|panacea|stim\b|consume|drink/.test(text)) return 'consume';
  // Deployable traps / mines / turrets kneel and rig the device (UAL1
  // Fixing_Kneeling via castTrap). Runes (warpRune…) intentionally DON'T
  // match — they stay magic-cast flavored.
  if (/trap|snare|\bmine\b|contraption|deploy|sentry/.test(text)) return 'deploy';
  // Ramparts, every "…Slam" and stomps (Tremor/Cataclysm Stomp, the giant's
  // Fee Fi Fo Fum) — two-hand charged ground slam.
  if (/rampart|slam\b|slan\b|stomp|quake|tremor|fee.?fi.?fo/.test(text)) return 'slam';   // raceChassisSlan typo is real
  // Seed/planting spells (Healing Seed, Poison Seed, Leech Seed…) kneel and
  // plant — the animation library's Farm_PlantSeed via the castPlant slot.
  if (/seed|sapling|sprout|plant(?!ation)/.test(text)) return 'plant';
  // Bow shots draw and loose (MAL Archery_Shot_1) whatever the damage type.
  // (the skeleton's MARROWstorm is not an arrow — 2026-09-13.) Judged BEFORE
  // the throw rule: Bomb Arrow is an arrow with a charge lashed to it, not a
  // lob — 2026-09-14.
  if (/(^|[^m])arrow|\bbow\b|archer/.test(text)) return 'arrow';
  // Lobbed-object actions (footballs, grenades, bombs) read as a throw no
  // matter the damage type — the QB "just throws".
  // (dynamite: Dynamite's lob flies mondo's stick, 'proj-dynamite', since 2026-10-28 — it used to ride 'proj-bomb')
  if (/football|grenade|bomb(?!ard)|dynamite|throw|toss|hurl|lob|spike/.test(text)) return 'throw';
  // Kicks (Spartan_Kick) — check before the melee bucket.
  if (/\bkick\b/.test(text)) return 'kick';
  // Punches (UAL1 Punch_Cross) — jabs/hooks/uppercuts/fists read as a strike
  // whatever the damage type ("Rocket Fist", "Hydraulic Punch", "Robo Punch",
  // "Dragon Fist"…). 'hook' deliberately excluded (Harvest Hook is a pull).
  if (/punch|\bjab\b|uppercut|fist|knuckle|pummel|haymaker|hydraulic/.test(text)) return 'punch';
  // Claws / bites / scratches (UAL2 Zombie_Scratch rake) — bestial strikes
  // ("Demonic Claw", "Venom Fang", "Ninefold Scratch", "Pounce", bites…).
  if (/claw|scratch|\bbite\b|fang|talon|maul|pounce/.test(text)) return 'claw';
  const damaging = !!(spell.type === 'damage' || spell.dmg ||
      (Array.isArray(spell.hitDamages) && spell.hitDamages.length));
  // ── THE CHARGED CAST (2026-09-13) ──────────────────────────────────────
  // MAL Charged_Spell_Cast (the two-beat charge: a forward push, then both
  // arms flung to the sky) only ever played for hordes and terrain-raising —
  // every other big magical EVENT played the one-arm bolt push. Two rules:
  //   'ultimate' — a CAPSTONE (the r4★ node of a pillar; data.js
  //     isCapstoneSpellId, `tier: 'III'` as the fallback) charges the slow,
  //     heavy cut (UAL_SLOTS castUltimate) unless it is a weapon / melee
  //     strike, a single-target heal, or a move kind (those returned above).
  //   'aoe' — any big magical event charges the normal cut: a radius-2+
  //     blast, a call-down (delayed / barrage / descent), a summon, a
  //     storm, a wide wave, a zone. Physical single-target and gun spells
  //     keep their weapon clips.
  const _cap = _isCapstoneSpellForAnim(spell);
  const _bigKind = /^(barrage|aoePull|delayed|summonUnit|raiseDead|summonWeather|zoneDebuff|zoneHeal|terrainCreate|aoeShield|warCry|healAll|manaRestoreAll|cleanseArea|splitBeam|shadowRealm)$/.test(spell.kind || '');
  const _wide = (spell.kind === 'linePush' || spell.kind === 'line') && (spell.lineWidth || 1) >= 2;
  const _bigRadius = (spell.aoeRadius || 0) >= 2 && spell.kind !== 'damage';
  const _gunText = /shot|shoot|gun|bullet|snipe|rifle|pistol|revolver|barrage|quick.?draw|dead.?eye|cannon|rocket|missile|artillery|mortar/.test(text);
  const _physicalWeapon = spell.damageType === 'physical' && (_gunText || (spell.range || 1) <= 1 || spell.chargeToTarget
      || /^(damage|multiHit|dash|tackle|leapStrike|skyDrop|skyThrow|skySlam|lifeDrain|ricochet)$/.test(spell.kind || ''));
  const _singleHeal = !damaging && /^(heal|selfHeal|zoneHeal|revive|seedHeal)$/.test(spell.kind || '');
  if (_cap && !_physicalWeapon && !_singleHeal) return 'ultimate';
  if (!_physicalWeapon && (_bigKind || _wide || _bigRadius)) return 'aoe';
  if (!damaging) {
    // Heals/revives get the staff wave (castHeal) — before the raise check
    // so "Raise Dead"-style revives never read as terrain shaping.
    if (spell.type === 'heal'
        || /heal|cure|mend|regen|restor|revive|resurrect/.test(text)) return 'heal';
    // Terrain shaping — watchtowers, walls, raised ground → charged AOE cast.
    if (/watchtower|lookout|terraform|raise|wall of|bone wall|shield wall|fortress/.test(text)) return 'aoe';
    return 'support';                        // buffs, debuffs, marks
  }
  if (spell.damageType === 'magic') return 'magic';
  if (spell.damageType === 'physical') {
    if (/shot|shoot|gun|bullet|snipe|rifle|pistol|revolver|barrage|quick.?draw|dead.?eye/.test(text)
        || (spell.range || 1) >= 3) return 'ranged';
    return 'melee';
  }
  return 'magic';                            // damaging, untyped → magic burst
}

// ── SHARED ANIMATION LIBRARIES (Quaternius UAL + Meshy sniper MAL) ─────────
// THREE library GLBs animate every Meshy biped — three-renderer.js RETARGETS
// their clips onto each character's own rig at load time (world-rotation
// transfer + rest-pose direction calibration — see _libBakeClips there):
//   lib 0/1 — Quaternius Universal Animation Library (CC0, UE5-style rig,
//     NON-root-motion exports). Board tweens move the unit group; root motion
//     would double the travel.
//   lib 2 — MAL1_Sniper.glb: the 20 Meshy animations exported ONCE from the
//     male sniper (Assets/characters/animations/Meshy_AI_sniper_biped_Animation_*_withSkin
//     .glb, 2026-07-11), consolidated offline into one 1.4MB animation-only
//     GLB (skeleton + clips, meshes/textures stripped; clip names = the R2
//     file stems). The retargeter treats a Meshy-named source rig exactly
//     like a UAL one (see _libEnsureSrc), so ONE Meshy character's exports
//     now animate EVERY character — download animations for one model,
//     never per character. In-place loops verified (no root drift).
//   • Adding a new 3D character = upload its Meshy `..._Character_output.glb`
//     and add a one-line `_mkUAL(folder, prefix, {heightRatio: …})` entry
//     below. NO per-character animation exports needed anymore.
//   • Existing characters keep their old Meshy clip URLs as an automatic
//     FALLBACK: if the library GLB fails to load or the bake throws, the
//     renderer silently loads the per-character clips exactly as before.
//   • Kill-switches: window.EW_DISABLE_ANIM_LIB = true (console) forces the
//     Meshy-clip fallback globally; per character pass { noAnimLib: true }.
// The library files live OUTSIDE the sprites folder at Assets/characters/animations/.
// A slot's `lib` index picks the file.
const EW_ANIM_LIB_URLS = [
  'https://cdn.entropywars.net/Assets/characters/animations/UAL1_Standard.glb',
  'https://cdn.entropywars.net/Assets/characters/animations/UAL2_Standard.glb',
  'https://cdn.entropywars.net/Assets/characters/animations/MAL1_Sniper.glb',
  // lib 3 — MAL2_Sniper.glb (2026-08-12): second consolidated Meshy batch
  // (Back_Jump / Basic_Jump / Punch_Combo×3), built the same way as MAL1
  // from the 8MB withSkin exports. Until this file is uploaded to R2 the
  // bake skips lib-3 slots and every fallback chain covers them — wiring is
  // safe to ship ahead of the asset.
  'https://cdn.entropywars.net/Assets/characters/animations/MAL2_Sniper.glb',
  // lib 4 — MAL3_Sniper.glb (2026-09-25, SPELL_DIRECTOR_PLAN Phase 8 THE NEW
  // CLIPS): mondo's third Meshy batch (31 exports named
  // Meshy_AI_sniper_<Clip>.glb — no `_biped_Animation_` / `_withSkin`),
  // consolidated with build_mal2.js. Clip names are the file stems, typos
  // kept (mage_soell_cast_*, Right_Hand_Sword_Slas). Until the file is on R2
  // the lib-4 slots skip and every chain falls back as before.
  'https://cdn.entropywars.net/Assets/characters/animations/MAL3_Sniper.glb',
  // lib 5 — MOC1_CMU.glb (2026-11-05, THE MOCAP LIBRARY, rev 2): real motion capture from the CMU Graphics Lab Motion
  // Capture Database (mocap.cs.cmu.edu, credited in data.js EW_CREDITS), cut into in-place seamless loops by bake-mocap.py
  // on a UAL-named skeleton, so the retarget treats it like UAL1/2. Clip names MOC_<what>_<Idle|Walk>. CREATOR PICKS ONLY
  // (mondo 11-05: "dont give them default idles and walks, just add them to the character creator"): EW_IDLE_POSES +
  // EW_WALK_STYLES; no race's own default plays them.
  'https://cdn.entropywars.net/Assets/characters/animations/MOC1_CMU.glb',
  // lib 6 — MOC2_100STYLE.glb (2026-11-05): plain idles + walks from the 100STYLE dataset (Ian Mason, CC BY 4.0, credited in
  // data.js EW_CREDITS; Xsens capture, 60 fps), renamed to the CMU joint names (tools: mocap-100style.py) and cut into in-place
  // seamless loops by bake-mocap.py (clip list mocap-clips-100style.json). Clip names S100_<style>_<Idle|Walk>. CREATOR PICKS ONLY.
  'https://cdn.entropywars.net/Assets/characters/animations/MOC2_100STYLE.glb',
  // lib 7 — MAL4_Sniper.glb (2026-11-11, THE MESHY ANIMATION PULL, mondo: "are you able to go on there and download more
  // animations ... give different units more personality with their walks and idles and spells and attacks"): 53 idles, walks
  // and runs pulled through Meshy's animation API on the male sniper's rig (one rigging task, action_ids in batches of 10)
  // and packed by build-mal.py (the travelling loops made in-place). Clip names are Meshy's library keys. CREATOR PICKS ONLY
  // (EW_IDLE_POSES + EW_WALK_STYLES): no race's own default plays them.
  'https://cdn.entropywars.net/Assets/characters/animations/MAL4_Sniper.glb',
  // lib 8 — MAL5_Sniper.glb (2026-11-11): the same pull's 74 combat clips (casts, weapon + unarmed attacks, hit reactions,
  // deaths, blocks / dodges, taunts and cheers). Nothing plays them by default: they are in the spell editor's clip picker
  // and free for a per-character `lib: {slot: {clip, lib: 8, ts}}`.
  'https://cdn.entropywars.net/Assets/characters/animations/MAL5_Sniper.glb',
];

// Game slot → library clip (+ which library file) + timeScale. Durations are
// library constants, so the scales live here once instead of per character
// (played ≈ dur / ts). 2026-07-11 remap: the Meshy sniper clips (lib 2) are
// the new defaults for body language (idle/walk/run/jump/dodge/hit/death +
// the mage-cast trio); weapon actions (gun/sword/throw/plant) stay UAL.
//   idle Idle_5 1.9s (male; females get Idle_11 via _FEM_SLOT_DEFAULTS)
//   walk Walking 1.07s (→~0.52s ≈ 150ms/tile pace) · run Running 0.67s
//   jump Regular_Jump 1.93s (→0.6s hop) · dodge Roll (UAL1) 1.47s (→0.61s
//   tumble; was Block3, a static guard)
//   hit Hit_Reaction_1 1.27s (→0.6s flinch) · death Dead 3.0s (→1.58s,
//   stays down) · cast Spell_Simple_Shoot 0.5s (→1.0s generic fallback)
//   castMagic mage_soell_cast_3 3.37s (→1.5s damage cast, capped 1.4) · castSupport
//   mage_soell_cast_7 2.73s (→1.19s buff/debuff) · castHeal mage_soell_cast
//   2.3s (→1.15s staff wave) · castRanged Cowboy_Quick_Draw_Shooting
//   trimmed 2.5s (→1.3s draw-shoot-holster; was UAL1 Pistol_Shoot) ·
//   castMelee Sword_Attack 1.53s (→1.28s swing) · castThrow OverhandThrow
//   (UAL2) 1.33s (→1.1s) · castPlant Farm_PlantSeed (UAL2) 2.77s kneel
//   (→1.2s) · castArrow Archery_Shot_1 1.07s (→0.89s) · castKick
//   Spartan_Kick 1.47s (→0.73s) · castAOE Charged_Spell_Cast 2.7s (→1.23s
//   raise-terrain / big AOE) · castSlam Charged_Ground_Slam 3.03s (→1.26s
//   rampart / ground slams) · castConsume Consume (UAL2) 1.33s (→1.1s
//   potion swig, trimmed to the drink). Spare lib-2 clips (wired per
//   character or future slots): Idle_10 (male brawler idle), Idle_11 /
//   Walking_Woman (female defaults), Block3 (a two-hand guard — free for a
//   per-character `block`).
const UAL_SLOTS = {
  // 2026-09-09 — THE STRIKE FRAME. Every action slot now carries `strikeAt`:
  // the second of the SOURCE clip (before `trim`, before `ts`) on which the
  // hit / release / bloom actually happens, read off frame contact sheets of
  // every library clip (rigged_animations/, PLAYTEST_NOTES "THE STRIKE
  // FRAME"). The board starts the clip strikeAt/ts EARLY so that frame lands
  // ON the projectile launch / melee impact / aura bloom (battle.js
  // _releaseCastSprite + doAttack via ThreeAnim.castStrikeMs /
  // attackStrikeMs); the forge preview fires its burst on the same frame.
  // `trim: [from, to]` bakes only that window of the source clip (dead idle
  // before a draw, a guard pose before a flinch) — strikeAt stays in SOURCE
  // seconds. Omit strikeAt on a slot with no strike (loops, reactions).
  idle:        { clip: 'Idle_5',                 lib: 2, ts: 1.0  },
  walk:        { clip: 'Walking',                lib: 2, ts: 2.05 },
  run:         { clip: 'Running',                lib: 2, ts: 1.3  },
  jump:        { clip: 'Regular_Jump',           lib: 2, ts: 3.2  },
  // dodge: UAL1 Roll 1.47s (→0.61s) — a real dive-and-tumble evade; Block3
  // (the old slot) is a static two-hand GUARD, it never moved. pinXZ keeps
  // the roll over the tile (the dodge tween owns the sidestep).
  // dodge (2026-09-25): MAL3 Stand_Dodge — the Matrix lean-back, the body
  // bent away 0.4–0.8 s and upright by 1.1 s, in place (pinXZ; the dodge
  // tween owns the sidestep). The old UAL1 Roll stays as dodgeRoll, the
  // fallback while MAL3 is missing (three-renderer.js _playUnitModelAnim).
  dodge:       { clip: 'Stand_Dodge',            lib: 4, ts: 2.2, pinXZ: true },
  dodgeRoll:   { clip: 'Roll',                   lib: 0, ts: 2.4, pinXZ: true },
  // runCharge (2026-09-25): MAL3 RunFast — the head-down sprint, in place
  // (0 net hips travel). The chargeToTarget sprint plays it instead of the
  // jog (three-renderer.js startDisplaceTween `charge`); falls back to run.
  runCharge:   { clip: 'RunFast',                lib: 4, ts: 1.0 },
  // THE BATTLE CLIMB (2026-10-20): the exploration ladder clips (HQ_CLIMB_CLIPS) on every battle rig. climbWall
  // plays up the face, then freezes as the hang until the unit's next turn (three-renderer.js
  // _updateBattleClimbers); climbMantle pulls it over the top. Baked after load (defer).
  climbWall:   { clip: 'Fast_Ladder_Climb',      lib: 4, ts: 1.0, pinHips: true, defer: true },
  climbMantle: { clip: 'ClimbUp_1m',             lib: 1, ts: 1.3, defer: true },
  hit:       { clip: 'Hit_Reaction_1',         lib: 2, ts: 2.1  },
  death:       { clip: 'Dead',                   lib: 2, ts: 1.9  },
  cast:        { clip: 'Spell_Simple_Shoot',     lib: 0, ts: 0.5, strikeAt: 0.05 },
  // castMagic: arm thrusts forward at 0.7s then HOLDS the push to 2.5s (a
  // bolt/beam channel) — ts 2.6→2.2 so the wind-up isn't a blur.
  castMagic:   { clip: 'mage_soell_cast_3',      lib: 2, ts: 2.2, strikeAt: 0.70 },
  castSupport: { clip: 'mage_soell_cast_7',      lib: 2, ts: 2.3, strikeAt: 1.00 },   // arms spread wide 1.0–1.5s
  castHeal:    { clip: 'mage_soell_cast',        lib: 2, ts: 2.0, strikeAt: 0.90 },   // hand raised to the sky 0.85–1.05s
  // castRanged: MAL Cowboy_Quick_Draw_Shooting, TRIMMED. The 7.33s export is
  // 1.9s of standing, the draw, the shot at ~2.5s, a 1.5s aim hold, the
  // holster, 3s more standing; [1.85, 4.35] keeps draw → shot → hold →
  // holster (→1.3s at 1.9×). UAL1 Pistol_Shoot (the old slot) POPPED out of
  // idle straight into an aimed pose with the recoil on frame 0.
  castRanged:  { clip: 'Cowboy_Quick_Draw_Shooting', lib: 2, ts: 1.9, trim: [1.85, 4.35], strikeAt: 2.55 },
  castMelee:   { clip: 'Sword_Attack',           lib: 0, ts: 1.2, strikeAt: 0.70 },   // spinning slash lands 0.56–0.84s
  castThrow:   { clip: 'OverhandThrow',          lib: 1, ts: 1.2, strikeAt: 0.46 },   // release ~0.45s, follow-through after
  castPlant:   { clip: 'Farm_PlantSeed',         lib: 1, ts: 2.3, strikeAt: 1.30 },   // hand to the soil 1.0–1.75s
  castArrow:   { clip: 'Archery_Shot_1',         lib: 2, ts: 1.2, strikeAt: 0.60 },   // draw 0.3–0.5s, loose ~0.6s
  castKick:    { clip: 'Spartan_Kick',           lib: 2, ts: 2.0, strikeAt: 0.68 },   // leg fully extended 0.55–0.8s
  // castAOE: Charged_Spell_Cast is TWO beats — a forward push at 0.65s, then
  // both arms flung to the sky at 1.7–2.2s. The sky-raise is the strike
  // (terrain rises, hordes are called, the storm comes down).
  castAOE:     { clip: 'Charged_Spell_Cast',     lib: 2, ts: 2.2, strikeAt: 1.90 },
  // castUltimate (2026-09-13): the SAME two-beat charge, cut slow (2.7s →
  // 1.69s) — the capstone's body language. classifySpellAnimKind returns
  // 'ultimate' for a pillar's r4★ spell; the chain falls back to castAOE,
  // then castMagic (three-renderer.js _castChainFor).
  castUltimate:{ clip: 'Charged_Spell_Cast',     lib: 2, ts: 1.6, strikeAt: 1.90 },
  castSlam:    { clip: 'Charged_Ground_Slam',    lib: 2, ts: 2.4, strikeAt: 1.62 },   // 0.8s overhead charge, the slam at 1.6s
  // castConsume: the swig is 0.35–0.5s, the rest is standing — trimmed to
  // the drink (→0.9s at 1.0×).
  castConsume: { clip: 'Consume',                lib: 1, ts: 1.0, trim: [0.05, 0.95], strikeAt: 0.42 },
  castChop:    { clip: 'TreeChopping_Loop',      lib: 1, ts: 1.2, strikeAt: 0.47  },
  castTrap:    { clip: 'Fixing_Kneeling',        lib: 0, ts: 4.0, strikeAt: 1.60  },   // kneels by 0.95s, works the device from 1.4s
  block:       { clip: 'Shield_OneShot',         lib: 1, ts: 1.6, strikeAt: 0.10  },
  // hitHeavy: Face_Punch_Reaction opens with 0.35s of a raised GUARD before
  // the head snaps — trimmed off so the reel starts on the hit (→0.81s).
  hitHeavy:    { clip: 'Face_Punch_Reaction',    lib: 2, ts: 2.6, trim: [0.35, 2.45] },
  fall:        { clip: 'Fall3',                  lib: 2, ts: 1.2, pinHips: true },
  castPunch:   { clip: 'Punch_Cross',            lib: 0, ts: 1.2, strikeAt: 0.25 },   // full extension 0.27s
  castClaw:    { clip: 'Zombie_Scratch',         lib: 1, ts: 1.5, strikeAt: 0.72 },   // the rake 0.65–0.85s
  // 2026-08-12 — strike-approach set (MAL2_Sniper.glb lib 3 + one UAL2
  // freebie). MAL2 clip inventory (dur s): Basic_Jump 5.93 / Back_Jump 0.97 /
  // Punch_Combo 2.50 / Punch_Combo_1 2.27 / Punch_Combo_5 3.87 (the last two
  // are unwired spares for per-character `lib:` flavor).
  //   jumpStrike Basic_Jump @4.5 (→~1.32s) — the leap/lunge ATTACK. Plays
  //   across the jump+strike phases of a melee approach that has to leap
  //   up/down to its target (three-renderer.js _updateStrikeApproach); the
  //   plain Regular_Jump + kind-chain swing remain the fallback. pinHips:
  //   the export root-travels +1.4×hips forward with a 1.9×hips rise — the
  //   board tween owns the arc, so only the body language is kept. NOTE the
  //   source clip is long (5.93s); if 4.5× reads rushed in-game, try 3.5–4.
  //   (Contact sheet 2026-09-09: the first 1.6s of Basic_Jump is STANDING —
  //   the jump itself is 1.6–4.2s. When the approach is wired, trim it.)
  //   jumpBack Back_Jump @2.6 (→~0.37s) — the back-hop home after the swing
  //   (falls back to the forward jump clip when unwired). pinHips: the
  //   export root-travels −2.6×hips backward; the tween owns the hop.
  //   castPunchCombo Punch_Combo @1.8 (→~1.39s, in-place export) — multi-hit
  //   PUNCH strikes play one real combo instead of restarting Punch_Cross
  //   per hit (jab 0.45s, cross 0.9s, overhead 1.36s). castMeleeCombo
  //   Sword_Regular_Combo (UAL2) @2.2 — same for multi-hit sword strikes
  //   (slash 0.55s, low sweep 0.9s, leaping strike 1.36s, down-cut 1.7s);
  //   claw/kick flurries keep the restart look.
  jumpStrike:     { clip: 'Basic_Jump',          lib: 3, ts: 4.5, pinHips: true },
  jumpBack:       { clip: 'Back_Jump',           lib: 3, ts: 2.6, pinHips: true },
  castPunchCombo: { clip: 'Punch_Combo',         lib: 3, ts: 1.8, strikeAt: 0.45 },
  castMeleeCombo: { clip: 'Sword_Regular_Combo', lib: 1, ts: 2.2, strikeAt: 0.55 },
  // 2026-09-09 — the MOVE kinds get their own body language (spell kind,
  // never the text — classifySpellAnimKind checks `kind` first):
  //   castDash UAL2 Sword_Dash 1.57s (→1.05s): crouch 0.15–0.3s, a low
  //   lunging stab 0.45–0.85s, up by 1.3s — every `dash` (Sky Tackle's
  //   slide, Drive-By, QB Sneak…). castTackle UAL2 Shield_Dash 1.1s (→1.0s):
  //   OPENS on the shoulder-charge impact frame and straightens up — the
  //   `tackle` kind runs the charge first, so the clip starts on arrival.
  castDash:       { clip: 'Sword_Dash',          lib: 1, ts: 1.5, strikeAt: 0.50 },
  castTackle:     { clip: 'Shield_Dash',         lib: 1, ts: 1.1, strikeAt: 0.06 },
  // 2026-09-24 — THE BODY (SPELL_DIRECTOR_PLAN Phase 4): the SPELL VERBS,
  // library clips no spell played before (contact sheets 2026-09-24, the
  // strike read off the frames). `defer: true` — they bake one per idle
  // tick AFTER the character's load bake (three-renderer.js
  // _libBakeDeferred), so the load pays nothing; each kind's chain falls
  // back to its old slot until its verb lands. Played windows stay under the
  // board's 1.4 s cast cap. SPELL_ANIM_VERBS (above classifySpellAnimKind)
  // says which spell plays which.
  //   castChannel Spell_Simple_Idle_Loop — the arm held out, palm open (the
  //     crossfade is the raise), held through a beam / drain / breath.
  //   castReap Farm_Harvest — stoop to the ground 0.7–1.1 s, YANK up 1.4 s.
  //   castHeavySlash Sword_Heavy_Combo, the FINISHER cut only: the leap up
  //     with the blade overhead 2.36 s, the cleave down 2.76–3.15 s.
  //   castLeap NinjaJump_Land — the tuck, the landing crouch 0.12–0.35 s
  //     (pinHips: the export starts a third of a body up; the board tween
  //     owns the arc, the clip keeps the tuck).
  //   castGuard Sword_Block — the braced crouch 0.11–0.7 s.
  //   castOpen Chest_Open — stoop 0.5 s, the lid thrown up 0.75–0.87 s.
  //   castTouch Interact — reach out and press 0.55–1.1 s.
  //   castPush Push_Loop — both palms out, leaning in.
  //   castLantern Idle_Lantern_Loop — the lamp held out at arm's length.
  //   castPhone Idle_TalkingPhone_Loop — the hand at the ear.
  //   castDance Dance_Loop — the one-second groove, slowed.
  //   castSmug Idle_FoldArms_Loop — arms folded from frame 0.
  //   castCheer Yes — the thumbs up 0.45–1.6 s.
  //   castStealth Crouch_Idle_Loop — the sneak crouch.
  // THE PLAYTEST (2026-09-24, the real viewer on a retargeted Meshy rig,
  // shots/…/castprobe): four verbs CUT and folded onto slots that read —
  //   call   Idle_Rail_Call leaned on a rail that isn't there, forearms over
  //          the face, no wave → castSlam (the charged stomp: call it forth);
  //   hook   Melee_Hook folds into a kneeling dive, ends crouched → castChop
  //          (TreeChopping_Loop, the overhead two-hand chop: the club, the whip);
  //   pour   Farm_Watering barely moves → castThrow (the splash is thrown);
  //   reload Pistol_Reload hides the face behind both hands → castRanged.
  // Kept and tuned: castHeavySlash starts on the rise (trim 2.2), castLeap
  // pinHips, castReap pinXZ (it drifted 0.12).
  // The victim side (THE BODY, delivery 2): hitStagger Idle_Shield_Break —
  //   the body flung back 0.1–0.4 s and recovered by 0.7 s — plays when an
  //   ENEMY shoves the body (battle.js `stagger` on the knockback / shove /
  //   collision displacements → three-renderer.js startDisplaceTween) and
  //   when a blow empties a shield and still lands (flash kind guardBreak).
  //   Hit_Knockback was the plan's pick but it ENDS ON THE FLOOR (needs
  //   LayToIdle after it); the stagger reads as the same blow and stands.
  //   Not wired: a revive rise (LayToIdle) — a revived unit's rig is built
  //   fresh, the hook is the entry rebuild.
  castChannel:    { clip: 'Spell_Simple_Idle_Loop', lib: 0, ts: 1.0, trim: [0, 1.3],   strikeAt: 0.20, defer: true },
  castReap:       { clip: 'Farm_Harvest',        lib: 1, ts: 1.5, trim: [0.2, 2.1], strikeAt: 1.45, pinXZ: true, defer: true },
  castHeavySlash: { clip: 'Sword_Heavy_Combo',   lib: 1, ts: 1.3, trim: [2.2, 3.6], strikeAt: 2.80, pinXZ: true, defer: true },
  castLeap:       { clip: 'NinjaJump_Land',      lib: 1, ts: 1.1,                  strikeAt: 0.14, pinHips: true, defer: true },
  castGuard:      { clip: 'Sword_Block',         lib: 1, ts: 1.0,                  strikeAt: 0.20, defer: true },
  castOpen:       { clip: 'Chest_Open',          lib: 1, ts: 1.0,                  strikeAt: 0.80, defer: true },
  castTouch:      { clip: 'Interact',            lib: 0, ts: 1.1, trim: [0.1, 1.6], strikeAt: 0.75, defer: true },
  castPush:       { clip: 'Push_Loop',           lib: 0, ts: 1.0, trim: [0, 1.3],   strikeAt: 0.30, pinXZ: true, defer: true },
  castLantern:    { clip: 'Idle_Lantern_Loop',   lib: 1, ts: 1.0, trim: [0, 1.3],   strikeAt: 0.30, defer: true },
  castPhone:      { clip: 'Idle_TalkingPhone_Loop', lib: 1, ts: 1.0, trim: [0, 1.3], strikeAt: 0.40, defer: true },
  castDance:      { clip: 'Dance_Loop',          lib: 0, ts: 0.75,                 strikeAt: 0.69, defer: true },
  castSmug:       { clip: 'Idle_FoldArms_Loop',  lib: 1, ts: 1.0, trim: [0, 1.3],   strikeAt: 0.35, defer: true },
  castCheer:      { clip: 'Yes',                 lib: 1, ts: 1.0, trim: [0, 1.4],   strikeAt: 0.50, defer: true },
  castStealth:    { clip: 'Crouch_Idle_Loop',    lib: 0, ts: 1.0, trim: [0, 1.3],   strikeAt: 0.30, pinXZ: true, defer: true },
  hitStagger:     { clip: 'Idle_Shield_Break',   lib: 1, ts: 1.0, pinXZ: true, defer: true },
  // THE KNOCK (2026-10-27, mondo: "is there like a falling backwards type
  // animation we can use instead of them just sliding"): a body pushed 2+
  // tiles (or slammed, or flung) goes over backwards and gets back up —
  // three-renderer.js _knockBegin. Watched first (anim-sheets, side view):
  //   hitKnockdown  UAL2 Hit_Knockback — knocked off the feet 0.08, flat on
  //                 the back 0.4, lying by 0.83 (the renderer re-times it so
  //                 the body is down as the slide ends)
  //   hitGetUp      UAL2 LayToIdle — from lying on the back: sits up 0.4,
  //                 a knee under 0.85, standing 1.4 (it starts exactly where
  //                 Hit_Knockback ends)
  // No library has a forward stumble (UAL1/2, MAL1-3 checked), so the pull's
  // is built in the renderer (the run clip + a hard forward pitch).
  hitKnockdown:   { clip: 'Hit_Knockback',       lib: 1, ts: 1.0,                                    defer: true },
  hitGetUp:       { clip: 'LayToIdle',           lib: 1, ts: 1.3,                                    defer: true },
  // ── THE NEW CLIPS (2026-09-25, SPELL_DIRECTOR_PLAN Phase 8) — MAL3 (lib 4),
  // deferred like THE BODY's verbs. Every clip was WATCHED first (anim-sheets.js
  // --follow: the camera tracks the hips, so a clip that travels stays in
  // frame) and its strike read off an FK table of the hands / feet / hips, not
  // the file name (Skill_01 is a roar, Headache_Relief the psychic strain,
  // mage_soell_cast_6 the sky-call, Sword_Shout the blade raised to the sky).
  // Source seconds as everywhere above; each played window ≤ 1.4 s.
  //   castRoar      Skill_01 — rise with the arms up 0.1–0.4, DROP into a wide
  //                 stance, head thrown back, arms out 0.5 (war cries, roars, fears)
  // mondo's own mapping (2026-09-25, sent after the upload) re-cast four of
  // them: cast_6 is the SKY CALL (and the telekinetic lift), cast_2 the
  // TELEKINETIC THROW, cast_4 the DRAIN PULL, Skill_01 the power-up flex as
  // well as the roar; the beam stance is MAL1 mage_soell_cast_3 (castMagic).
  //   castSkyward   mage_soell_cast_6 — crouch 0.4–0.7, rise with one arm to the
  //                 sky 1.1 (storms, meteors, call-downs)
  //   castKinetic   mage_soell_cast_2 — a half spin, both arms up lifting 1.0,
  //                 then the throw DRIVEN down 1.35 (kinetic hurls, gravity wells)
  //   castDrain     mage_soell_cast_4 — arms out, the pull IN 0.6–0.8 (drains,
  //                 siphons, soul sucks)
  //   castHurl      mage_soell_cast_1 — step in, both arms gathered OVERHEAD
  //                 0.9–2.2, the two-hand throw forward 2.5 (the big thrown ball)
  //   castRise      Skill_01 — the power-up flex (mondo: Power_Up_Flex = Skill 1),
  //                 the roar's clip (power-ups, transforms, raise the dead)
  //   (nova: no clip of its own — the Charged_Spell_Cast push, castAOE)
  //   castCurse     Skill_03 — a leaping spin, then the lunge with the arm
  //                 THRUST at the victim 1.2 (hexes, charms, marks)
  //   castPsychic   Headache_Relief — both hands at the temples straining
  //                 0.3–2.6, then flung away 2.85 (mind spells)
  //   castSmash     Heavy_Hammer_Swing — crouch, both arms overhead 1.0–1.2, the
  //                 two-hand SMASH down 1.5 (clubs, crushes, gorilla smashes)
  //   castSweep     Sweeping_Kick — drop low, the 360° leg sweep along the
  //                 ground 1.1–1.5 (tail whips)
  //   castJab       Right_Jab_from_Guard — the jab from a boxer's guard 0.58,
  //                 a small step in and back (kept: it is the punch's weight)
  //   castShove     Shield_Push_Left — crouch 0.7–1.0, the shoulder SHOVE 1.15
  //                 (the push verb's lead; Push_Loop stays as its fallback)
  //   castRally     Sword_Shout — step in, the blade raised to the sky 1.2–2.2
  //                 (oaths, decrees)
  //   castSlash     Right_Hand_Sword_Slas — one forehand cut 0.6
  //   castDoubleSlash Charged_Slash — forehand 0.5, backhand 1.2 (cross cuts)
  //   castRoundhouse Roundhouse_Kick — the spinning jump kick 1.42 (pinXZ: the
  //                 export drifts 1.9 hips SIDEWAYS)
  // `travel: true` — the clips that CARRY THE BODY. The bake pins the hips over
  // the tile (pinXZ: the vertical hop / crouch stays in the clip) and keeps
  // the export's forward travel as a 0→1 PROGRESS CURVE on the baked clip
  // (three-renderer.js _libTravelCurve). ThreeAnim.clipTravel then moves the
  // unit group from the caster's tile to the stop point ON THAT CURVE, read
  // off the playing action's own time — the body goes exactly as far as the
  // board needs, on the clip's own feet, and nothing else leaps. A curve that
  // comes back (the lunges) brings the body home; a one-way curve lands it.
  //   castThrust    Thrust_Slash — the lunge 0.3–0.9, the THRUST 0.85, a slash,
  //                 back home by 2.7 (spears)
  //   castUpSlash   Charged_Upward_Slash — step in 0.8–1.5, the rising slash
  //                 1.08, back by 2.4 (dragon slash)
  //   castLeapSlash Sword_Judgment — crouch, the jump 0.7–1.0, the blade DRIVEN
  //                 down kneeling 1.22 (Judgment, Excalibur)
  //   castLeapPunch Jumping_Punch — a hop, the big jump 0.6–1.6, the fist into
  //                 the ground 1.72, one way (seismic leaps, heroic leaps)
  //   castFlyKick   Rising_Flying_Kick — straight up into the flying kick
  //                 0.4–0.6, landed by 0.9, one way (predator leaps, sky tackles)
  castRoar:       { clip: 'Skill_01',            lib: 4, ts: 0.82,                  strikeAt: 0.50, pinXZ: true, defer: true },
  castSkyward:    { clip: 'mage_soell_cast_6',   lib: 4, ts: 1.3,  trim: [0.1, 1.9],  strikeAt: 1.10, pinXZ: true, defer: true },
  castKinetic:    { clip: 'mage_soell_cast_2',   lib: 4, ts: 1.4,  trim: [0.2, 2.1],  strikeAt: 1.35, defer: true },
  castHurl:       { clip: 'mage_soell_cast_1',   lib: 4, ts: 1.85, trim: [0.4, 2.95], strikeAt: 2.50, pinXZ: true, defer: true },
  castDrain:      { clip: 'mage_soell_cast_4',   lib: 4, ts: 1.2,  trim: [0.15, 1.75], strikeAt: 0.68, defer: true },
  castRise:       { clip: 'Skill_01',            lib: 4, ts: 0.82,                  strikeAt: 0.50, pinXZ: true, defer: true },
  castCurse:      { clip: 'Skill_03',            lib: 4, ts: 1.2,                   strikeAt: 1.20, pinXZ: true, defer: true },
  castPsychic:    { clip: 'Headache_Relief',     lib: 4, ts: 2.2,  trim: [0.3, 3.3],  strikeAt: 2.85, defer: true },
  castSmash:      { clip: 'Heavy_Hammer_Swing',  lib: 4, ts: 1.35,                  strikeAt: 1.50, pinXZ: true, defer: true },
  castSweep:      { clip: 'Sweeping_Kick',       lib: 4, ts: 1.3,  trim: [0.3, 2.1],  strikeAt: 1.30, pinXZ: true, defer: true },
  castJab:        { clip: 'Right_Jab_from_Guard', lib: 4, ts: 1.0, trim: [0.1, 1.4],  strikeAt: 0.58, defer: true },
  castShove:      { clip: 'Shield_Push_Left',    lib: 4, ts: 1.3,  trim: [0.4, 2.2],  strikeAt: 1.15, pinXZ: true, defer: true },
  castRally:      { clip: 'Sword_Shout',         lib: 4, ts: 1.45, trim: [0.4, 2.4],  strikeAt: 1.20, pinXZ: true, defer: true },
  castSlash:      { clip: 'Right_Hand_Sword_Slas', lib: 4, ts: 1.1,                 strikeAt: 0.60, pinXZ: true, defer: true },
  castDoubleSlash:{ clip: 'Charged_Slash',       lib: 4, ts: 1.3,  trim: [0.2, 1.95], strikeAt: 0.50, pinXZ: true, defer: true },
  castRoundhouse: { clip: 'Roundhouse_Kick',     lib: 4, ts: 1.25, trim: [0.5, 2.2],  strikeAt: 1.42, pinXZ: true, defer: true },
  castThrust:     { clip: 'Thrust_Slash',        lib: 4, ts: 1.85, trim: [0.2, 2.75], strikeAt: 0.85, travel: true, defer: true },
  castUpSlash:    { clip: 'Charged_Upward_Slash', lib: 4, ts: 1.45, trim: [0.5, 2.5], strikeAt: 1.08, travel: true, defer: true },
  castLeapSlash:  { clip: 'Sword_Judgment',      lib: 4, ts: 1.6,  trim: [0.2, 2.4],  strikeAt: 1.22, travel: true, defer: true },
  castLeapPunch:  { clip: 'Jumping_Punch',       lib: 4, ts: 1.4,  trim: [0.45, 2.4], strikeAt: 1.72, travel: true, defer: true },
  castFlyKick:    { clip: 'Rising_Flying_Kick',  lib: 4, ts: 1.08, trim: [0, 1.5],    strikeAt: 0.50, travel: true, defer: true },
  // The victim side (THE NEW CLIPS): the flash kind picks them (battle.js
  // applyDamageToUnit → the renderer's hit-flash chains).
  //   hitShot    Gunshot_Reaction — the body jolted, an arm flung back (a gun
  //              hit; trimmed to the first jolt)
  //   hitSlap    Slap_Reaction — the head knocked aside 1.0–1.4 (a fist, a
  //              claw, a kick that doesn't reel)
  //   hitLaunch  BeHit_FlyUp — blown two body-heights UP, tumbling, down on the
  //              back by 0.7 and lying there: a DEATH clip only (a heavy
  //              killing blow; three-renderer.js startDeathTween), never a
  //              flinch — nothing gets up from it. Root travel kept (the
  //              launch IS the clip).
  hitShot:        { clip: 'Gunshot_Reaction',    lib: 4, ts: 1.8,  trim: [0.15, 1.5], pinXZ: true, defer: true },
  hitSlap:        { clip: 'Slap_Reaction',       lib: 4, ts: 2.2,  trim: [0.85, 2.6], pinXZ: true, defer: true },
  hitLaunch:      { clip: 'BeHit_FlyUp',         lib: 4, ts: 1.0,                                    defer: true },
  // THE GORE (2026-10-20, mondo: "is there more than one death animation"):
  // the two other library clips that END ON THE FLOOR, picked per death by
  // battle.js (state._deathStyleById → three-renderer.js _deathSlotFor).
  //   deathKnock    UAL2 Hit_Knockback 0.83s — flung flat on the back, down
  //                 by 0.38 (→1.1s at 0.75; the shot / blast that throws them)
  //   deathCollapse UAL1 Death01 2.4s — the knees go and the body folds to
  //                 the floor, down by 1.2 (→1.85s at 1.3)
  // With Dead (the default slot) and hitLaunch that is four ways to die.
  deathKnock:     { clip: 'Hit_Knockback',       lib: 1, ts: 0.75,                                   defer: true },
  deathCollapse:  { clip: 'Death01',             lib: 0, ts: 1.3,                                    defer: true },
};
// Female body-language defaults — applied to every `female:` def after
// RACE_MODELS_3D is built (see _applyFemaleSlotDefaults) unless the
// character's own opts.lib already claims the slot.
const _FEM_SLOT_DEFAULTS = {
  idle: { clip: 'Idle_11',       lib: 2, ts: 1.0 },
  walk: { clip: 'Walking_Woman', lib: 2, ts: 1.9 },
};
// Shared per-def field objects (read-only in the renderer).
const _UAL_CLIPS = {}, _UAL_TS = {};
// _ualClipRef(o): the renderer-facing slot record — clip + lib + the bake
// flags (pinHips / pinXZ / trim) + strikeAt. One builder for the defaults,
// the per-character `lib:` overrides and the female defaults, so a flag
// added here reaches every path.
function _ualClipRef(o) {
  const r = { clip: o.clip, lib: o.lib || 0 };
  if (o.pinHips) r.pinHips = true;
  if (o.pinXZ) r.pinXZ = true;
  if (Array.isArray(o.trim) && o.trim.length === 2) r.trim = [o.trim[0], o.trim[1]];
  if (typeof o.strikeAt === 'number') r.strikeAt = o.strikeAt;
  if (o.defer) r.defer = true;   // THE BODY: baked after load (three-renderer.js _libBakeDeferred)
  if (o.travel) r.travel = true; // THE NEW CLIPS: the clip carries the body (three-renderer.js _libTravelCurve)
  return r;
}
for (const _slot in UAL_SLOTS) {
  _UAL_CLIPS[_slot] = _ualClipRef(UAL_SLOTS[_slot]);
  _UAL_TS[_slot] = UAL_SLOTS[_slot].ts;
}

// Registry entry builder. `anims` maps slot → Meshy library clip name; URLs
// become `<folder>/Meshy_AI_<prefix>_biped_Animation_<Clip>_withSkin.glb`.
// Defaults tuned to the library durations above (board action windows:
// move ~150ms/tile, cast ~1.2s, death 1.6s). Override per character via opts.
// Every entry also carries the shared-animation-library fields (animLib /
// libClips / libTimeScales) unless opts.noAnimLib — the renderer prefers the
// retargeted library clips and keeps `anims` as the fallback set.
function _mk3d(folder, prefix, anims, opts) {
  const F = `${_S}/Races/${folder}`;
  const clips = {};
  for (const slot in anims) {
    clips[slot] = `${F}/Meshy_AI_${prefix}_biped_Animation_${anims[slot]}_withSkin.glb`;
  }
  const def = Object.assign({
    model: `${F}/Meshy_AI_${prefix}_biped_Character_output.glb`,
    clips,
    animLib: EW_ANIM_LIB_URLS,
    libClips: _UAL_CLIPS,
    libTimeScales: _UAL_TS,
    // Relative on-board size. The renderer NORMALIZES every model to the same
    // rendered height (ts * UNIT_SPRITE_SIZE_RATIO * heightRatio), so a raw
    // Meshy bigfoot and fairy come out identical unless heightRatio differs.
    // Scale is RELATIVE, anchored to the male fortune teller = 1.0 (a normal
    // adult human male). Set per character via opts.heightRatio: humans ~1.0
    // (females a touch shorter ~0.94), small creatures < 1 (fairy 0.6, grey
    // 0.78), big ones > 1 (bigfoot 1.4, werewolf 1.3). Nameplate top + the
    // click pillar both derive from heightRatio, so plates float and clicks
    // land at the right height automatically.
    heightRatio: 1.0,
    yawOffset: 0,
    moveTimeScale: 1.3,   // Running 0.67s → ~0.52s/cycle
    castTimeScale: 2.0,   // Charged 2.7s → 1.35s; soell 2.3s → 1.15s
    deathTimeScale: 1.9,  // Dead 3.0s → ~1.58s (death window is 1.6s)
    hitTimeScale: 2.8,    // Hit_Reaction 1.67s → ~0.6s flinch
    jumpTimeScale: 3.2,   // Regular_Jump 1.93s → ~0.6s
  }, opts || {});
  if (def.noAnimLib) { delete def.animLib; delete def.libClips; delete def.libTimeScales; }
  // Per-character library flavor: opts.lib = { slot: {clip, lib, ts} }
  // overrides individual UAL_SLOTS entries (e.g. a knight idling with
  // Sword_Idle, the werewolf walking with Zombie_Walk_Fwd_Loop) while every
  // unlisted slot keeps the shared defaults.
  if (def.lib && def.libClips) {
    const lc = Object.assign({}, def.libClips), lt = Object.assign({}, def.libTimeScales);
    for (const slot in def.lib) {
      const o = def.lib[slot];
      lc[slot] = _ualClipRef(o);            // pinHips / pinXZ (HQ poses) / trim / strikeAt ride along
      if (o.ts) lt[slot] = o.ts;
    }
    def.libClips = lc; def.libTimeScales = lt;
  }
  // Remember which slots the character claimed itself so the gendered
  // defaults pass (_applyFemaleSlotDefaults) never stomps flavor overrides.
  def._libOverridden = def.lib ? Object.keys(def.lib) : [];
  delete def.lib;
  return def;
}

// Minimal builder for library-animated characters: the character only needs
// its rigged `..._Character_output.glb` on R2 — every animation comes from
// the shared library. Adding a new 3D character is ONE line:
//   'newrace': { male: _mkUAL('newrace/male', 'meshy_file_prefix', { heightRatio: 1.1 }) },
function _mkUAL(folder, prefix, opts) {
  return _mk3d(folder, prefix, {}, opts);
}

// Full uploaded-clip inventory per character lives in PLAYTEST_NOTES.md
// ("Rigged 3D unit models"). Slots not listed for a character below simply
// don't exist in its R2 folder yet — fallback chains cover them.
const _PSY_3D = `${_S}/Races/Homosapien/Female/psychic`;
const _VOID_3D = `${_S}/Races/voidweaver/male`;
const RACE_MODELS_3D = {
  // ── Homosapien sub-races (Races/Homosapien/<Gender>/<job folder>/) ──
  'fortune teller': {
    // "male_fortune_teller" — new 2026-07 model (replaced Fortune_teller_with_r).
    // ★ HEIGHT ANCHOR: heightRatio 1.0 = this character. All others scale from here.
    male: _mk3d('Homosapien/Male/harbinger', 'male_fortune_teller', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
    }, { heightRatio: 1.0, basicAttackKind: 'magic' }),
    female: _mk3d('Homosapien/Female/harbinger', 'hot_attractive_fortun', {
      idle: 'Idle_3', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
    }, { heightRatio: 0.95, basicAttackKind: 'magic' }),
  },
  // The Spy (mondo 2026-10-25: a James Bond spy, not an "intel spy") — "spy_female" Running export in
  // Races/spy/. The shared library animates her; its castRanged is the trimmed quick-draw she shot with before.
  // 2026-10-27 — her own race (mondo: "2 totally different characters"), no longer the men in black's female.
  'spy': {
    female: _mkUAL('spy', 'spy_female', {
      model: `${_S}/Races/spy/Meshy_AI_spy_female_Running.glb`,
      heightRatio: 0.95,
    }),
  },
  'men in black': {
    // New male model (the old Men_in_Black_CIA_age files were deleted).
    male: _mk3d('Homosapien/Male/agent', 'men_in_black_male_ag', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 1.02 }),   // tall agent
  },
  // Female Psychic (Telepath) — pilot wiring + the 2026-07-05 Running/Hit
  // uploads (generic Meshy_AI_Animation_* names, no character prefix — her
  // folder predates the prefixed convention). Thoughtful_Walk stays on R2 as
  // a spare if the run doesn't suit her.
  'telepath': {
    female: {
      model: `${_PSY_3D}/Meshy_AI_psychic_female_with_d_biped_Character_output.glb`,
      clips: {
        idle:  `${_PSY_3D}/Meshy_AI_Animation_Idle_4_withSkin.glb`,
        walk:  `${_PSY_3D}/Meshy_AI_Animation_Running_withSkin.glb`,
        hit:   `${_PSY_3D}/Meshy_AI_Animation_Hit_Reaction_withSkin.glb`,
        cast:  `${_PSY_3D}/Meshy_AI_Animation_Charged_Spell_Cast_withSkin.glb`,
        death: `${_PSY_3D}/Meshy_AI_Animation_Knock_Down_withSkin.glb`,
      },
      animLib: EW_ANIM_LIB_URLS,
      libClips: _UAL_CLIPS,
      libTimeScales: _UAL_TS,
      heightRatio: 0.95,    // female human, a touch shorter than the anchor
      basicAttackKind: 'magic',   // psychic — basic attacks zap, never sword-slash
      yawOffset: 0,
      moveTimeScale: 1.3,   // Running 0.67s
      castTimeScale: 2.2,
      hitTimeScale: 2.8,
      deathTimeScale: 1.6,  // Knock_Down 2.53s
    },
    // Male Psychic (Telepath) — "male_psychic_trench" (2026-07-05 upload). Note
    // the doubled underscore in the file stem (…_trench__biped_…) → the _mk3d
    // prefix keeps a trailing underscore. Full standard clip set; no Face_Punch
    // hit export on R2 yet, so `hit` is omitted (falls back to the flinch tween).
    male: _mk3d('Homosapien/Male/psychic', 'male_psychic_trench_', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
    }, { heightRatio: 1.0, basicAttackKind: 'magic' }),   // adult human male, at the anchor height
  },
  // Female Black Mage (Witch).
  'wizard': {
    female: _mk3d('Homosapien/Female/blackmage', 'young_female_witch', {
      idle: 'Idle_9', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
      castSupport: 'mage_soell_cast',
    }, { heightRatio: 0.94, basicAttackKind: 'magic' }),
    // Male Black Mage (Wizard) — "wizard_realistic" (2026-07-19 batch),
    // library-animated. Arcane zaps, never sword swings.
    male: _mkUAL('Homosapien/Male/blackmage', 'wizard_realistic', {
      heightRatio: 1.0,
      basicAttackKind: 'magic',
    }),
  },
  // Female Shaman (Harvester) — "beautiful_attractive_" (note the doubled
  // underscore in her file stem …_attractive__biped_… → the _mk3d prefix keeps a
  // trailing underscore). A support/magic caster: Charged_Spell_Cast is her one
  // cast clip, serving generic + magic + (via fallback) support. No Regular_Jump
  // export on R2 yet, so `jump` is omitted (falls back to the arc tween).
  'shaman': {
    female: _mk3d('Homosapien/Female/harvester', 'beautiful_attractive_', {
      idle: 'Idle_7', walk: 'Running', hit: 'Hit_Reaction',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
    }, { heightRatio: 0.94, basicAttackKind: 'magic' }),   // human female, a touch shorter than the anchor
  },
  // Engineers (Mad Scientist) — their "gun" cast is the ray-gun quick-draw.
  'mad scientist': {
    female: _mk3d('Homosapien/Female/engineer', 'female_hot_asian_scie', {
      idle: 'Idle_3', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 0.93 }),
    male: _mk3d('Homosapien/Male/engineer', 'mad_scientist', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 1.0 }),
  },
  // Gunslingers — the high-noon quick-draw (MAL lib 2) is their gun action,
  // per the 2026-07-11 slot spec ("Cowboy/Cowgirl/High Noon Shoot Gun").
  'cowboy': {
    female: _mk3d('Homosapien/Female/gunslinger', 'hot_attractive_cowgir', {
      idle: 'Idle_6', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 0.95,
         lib: { castRanged: { clip: 'Cowboy_Quick_Draw_Shooting', lib: 2, ts: 5.0 } }, }),
    male: _mk3d('Homosapien/Male/gunslinger', 'gunslinger_cowboy', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 1.0,
         lib: { castRanged: { clip: 'Cowboy_Quick_Draw_Shooting', lib: 2, ts: 5.0 } }, }),
  },
  // Female Knight — Thrust_Slash is the basic strike, Triple_Combo_Attack
  // the bigger generic cast flourish (spare alt idle on R2: Idle_8).
  'knight': {
    female: _mk3d('Homosapien/Female/knight', 'hot_attractive_female', {
      idle: 'Idle_6', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Triple_Combo_Attack', castMelee: 'Thrust_Slash',
    }, { castTimeScale: 2.2, heightRatio: 0.96,      // armored, sturdy
         lib: { idle: { clip: 'Sword_Idle' },        // fencer ready stance
                castMelee: { clip: 'Sword_Regular_Combo', lib: 1, ts: 2.4 } } })
  },
  // Female Pirate — flintlock = quick-draw; standard idle (no gun stance).
  // (Same files are duplicated in
  // …/Female/raider; the pirate/ copies are wired.)
  'pirate': {
    female: _mk3d('Homosapien/Female/pirate', 'hot_female_pirate', {
      idle: 'Idle_6', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 0.95 }),
    // "Dashingly handsome swashbuckler" — same file set mirrored in
    // …/Male/raider.
    male: _mk3d('Homosapien/Male/pirate', 'dashingly_handsome_sw', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 1.02 }),
  },
  // Homosapien (Freelancer) — also the werewolf's DAY form: getRace3DModel()
  // returns this male entry for any werewolf while getCurrentCyclePhase() is
  // 'day', and the beast model below at night. No cast/hit exports yet —
  // engine lunge/glow tweens cover actions.
  'homosapien': {
    male: _mk3d('Homosapien/Male/freelancer', 'normal_man', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', death: 'Dead',
    }, { heightRatio: 1.0 }),
  },

  // ── Non-homosapien races (Races/<race folder>/<gender>/) ──
  // Martian (Gunslinger, ranged) — "Green_martian". Ray-gun quick-draw is the
  // ranged cast; Charged_Spell_Cast covers any psychic/magic hit. Little green
  // man, so a touch taller than the classic grey (0.78) but well below humans.
  'martian': {
    male: _mk3d('martian/male', 'Green_martian', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting',
      castRanged: 'Cowboy_Quick_Draw_Shooting', castMagic: 'Charged_Spell_Cast',
    }, { castTimeScale: 5.0, heightRatio: 0.82 }),   // little green man
  },
  // Machine Elf (Engineer, specialist caster) — "DMT_clockwork_elf". A tiny
  // psychedelic clockwork entity: Charged_Spell_Cast is the generic/magic
  // burst, the ray-gun quick-draw covers ranged/tech hits.
  'machine elves': {
    male: _mk3d('machineelves/male', 'DMT_clockwork_elf', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
      castRanged: 'Cowboy_Quick_Draw_Shooting',
      // spare on R2: Walking, Knock_Down
    }, { castTimeScales: { castRanged: 5.0 }, heightRatio: 0.72,
         basicAttackKind: 'magic' }),   // small clockwork elf — psychedelic zaps, not sword swings
  },
  // Nordic (Warrior, support) — "nordic_alien_male". His only action export
  // is the quick-draw, wired to castRanged ONLY so melee swings keep the
  // engine lunge tween instead of a gun draw.
  'nordic': {
    male: _mk3d('Nordic/Male', 'nordic_alien_male', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', castRanged: 'Cowboy_Quick_Draw_Shooting',
      // spare on R2: Walking, Knock_Down
    }, { castTimeScales: { castRanged: 5.0 }, heightRatio: 1.08 }),   // tall blond alien
  },
  // Annunaki (Sniper, ranged) — "annunaki". Quick-draw is his basic/ranged
  // shot, Charged_Spell_Cast the magic burst, mage_soell_cast_3 (note the _3)
  // the support wave. No hit export → flinch tween.
  'annunaki': {
    male: _mk3d('annunaki/male', 'annunaki', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting',
      castRanged: 'Cowboy_Quick_Draw_Shooting', castMagic: 'Charged_Spell_Cast',
      castSupport: 'mage_soell_cast_3',
      // spare on R2: Walking, Knock_Down
    }, { castTimeScale: 5.0, castTimeScales: { castMagic: 2.0, castSupport: 2.0 },
         heightRatio: 1.35 }),   // towering Sumerian god (mage-sniper: plain idle, no gun stance)
  },
  // Demon (Black Mage, bruiser) — "red_demon". Charged_Spell_Cast covers the
  // generic + magic cast. MALE ONLY so far — the female demon has no model
  // and is filtered out by the 3D-only gender rule above.
  'demon': {
    male: _mk3d('Demon/Male', 'red_demon', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
      // spare on R2: Walking, Knock_Down
    }, { heightRatio: 1.18,      // hulking horned demon
         basicAttackKind: 'claw',   // basic attacks rake with talons (castClaw)
         lib: { castMelee: { clip: 'Sword_Heavy_Combo', lib: 1, ts: 3.5 } } }),
    // Female (2026-09-22 batch) — "demon_female" Character_output (Races/Demon/Female/): the she-demon,
    // library-animated, the same talons. Both genders are 3D-ready now.
    female: _mkUAL('Demon/Female', 'demon_female', {
      heightRatio: 1.1,
      basicAttackKind: 'claw',
    }),
  },
  // Half-Demon (Assassin, melee) — REMODELED 2026-07-19: the new
  // "hot_fancy_rich_girl_w" Character_output replaces the old
  // hot_attractive_rich_f set. The old per-character clips CANNOT ride along
  // (they bake the OLD rig's bone transforms — the sprites.js HARD RULE), so
  // she is library-animated now; the Melee_Hook override keeps her brawler
  // strikes. Statuesque demonic woman → a hair taller than a plain human female.
  'halfdemon': {
    female: _mkUAL('halfdemon/female', 'hot_fancy_rich_girl_w', {
      heightRatio: 0.98,
      lib: { castMelee: { clip: 'Melee_Hook', lib: 1, ts: 0.45 } },
    }),
    // Male (2026-07-25 batch) — "rich_business_man_wit": the devil in a
    // bespoke suit. Same brawler hook as his counterpart; Demonic Claw rakes
    // via the claw basics. 1.9m (data.js physique) → a hair over human male.
    male: _mkUAL('halfdemon/male', 'rich_business_man_wit', {
      heightRatio: 1.05,
      basicAttackKind: 'claw',
      lib: { castMelee: { clip: 'Melee_Hook', lib: 1, ts: 0.45 } },
    }),
  },
  'fairy': {
    female: _mk3d('Fairy/female', 'young_fairy', {
      idle: 'Idle_6', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
      castSupport: 'mage_soell_cast',
      // spare emotes on R2: Mirror_Viewing, Wave_for_Help_1 (future victory/emote slots)
    }, { heightRatio: 0.6, basicAttackKind: 'magic' }),   // tiny winged sprite
  },
  'bigfoot': {
    male: _mk3d('bigfoot/male', 'bigfoot', {
      idle: 'Idle_10', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
    }, { heightRatio: 1.4,      // towering cryptid
         lib: { idle: { clip: 'Idle_10', lib: 2 },                    // brawler sway
                castMelee: { clip: 'Melee_Hook', lib: 1, ts: 0.45 } } }),
  },
  // Giant (Warrior, melee tank) — "ancient_giant". A brawler with charged
  // smash clips: Charged_Upward_Slash is the generic cast, Charged_Ground_Slam
  // the melee strike; Face_Punch_Reaction is the hit flinch. The tallest unit
  // on the board — well above bigfoot (1.4) and the werewolf (1.3).
  'giant': {
    male: _mk3d('Giant/male', 'ancient_giant', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', cast: 'Charged_Upward_Slash', castMelee: 'Charged_Ground_Slam',
    }, { castTimeScale: 2.2, heightRatio: 1.7,      // colossal ancient giant
         lib: { idle: { clip: 'Idle_10', lib: 2 },                    // brawler sway
                castMelee: { clip: 'Punch_Cross', ts: 0.9 } } }),
  },
  'grey': {
    male: _mk3d('grey/male', 'grey_alien', {
      idle: 'Idle_10', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
      // spare on R2: Idle_15 (alt idle)
    }, { heightRatio: 0.78, basicAttackKind: 'magic' }),   // short classic grey alien
  },
  // Quarterback — Right_Hand_Sword_Slash doubles as his throwing motion
  // (footballs classify as 'throw'); Face_Punch_Reaction is the hit flinch.
  // Still no death export → death falls back to the sprite-style fade.
  'quarterback': {
    male: _mk3d('quarterback', 'football_quarterback', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      cast: 'Right_Hand_Sword_Slash', castThrow: 'Right_Hand_Sword_Slash',
    }, { castTimeScale: 2.2, heightRatio: 1.1,      // big athlete + pads
         basicAttackKind: 'throw',  // he just throws — footballs ARE his basic attack
         lib: { idle: { clip: 'Idle_10', lib: 2 } } }),                // brawler sway
  },
  // Female Atlantean — standard idle (the swim loop read as floating on land).
  'atlantean': {
    female: _mk3d('atlantean/female', 'hot_attractive_atlant', {
      walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
    }, { heightRatio: 0.98,      // statuesque sea-dweller
         basicAttackKind: 'magic' }),  // tide-caller — basic attacks surge, no blades
  },
  // Werewolf NIGHT form (the beast). The DAY form is the Homosapien Freelancer
  // male model — see getRace3DModel(), which swaps this out for the human model
  // while getCurrentCyclePhase() === 'day'.
  'werewolf': {
    male: _mk3d('Werewolf/male', 'werewolf', {
      idle: 'Idle_10', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', cast: 'Right_Hand_Sword_Slash', castMelee: 'Right_Hand_Sword_Slash',
      // spare on R2: Idle_11, Knock_Down
    }, { castTimeScale: 2.2, heightRatio: 1.3,      // large hulking beast
         lib: { idle: { clip: 'Idle_10', lib: 2 },        // feral sway
                walk: { clip: 'Zombie_Walk_Fwd_Loop', lib: 1, ts: 2.5 },
                castMelee: { clip: 'Zombie_Scratch', lib: 1, ts: 1.5 } } }),
  },
  // Catgirl — gun for ranged (native Gunslinger), left hook for melee,
  // backflip jump. Spare on R2: Right_Hand_Sword_Slash, Hit_Reaction, Regular_Jump.
  // 2026-09-21: her NEW rig is the user's Meshy_AI_catgirl_Running.glb (a withSkin export = the rigged
  // base). The old young_female_catgirl clips were exported from the OLD character — cross-character
  // playback warps the mesh — so they are gone; the shared library animates her alone.
  'catgirl': {
    female: _mkUAL('catgirl/female', 'catgirl', {
      model: `${_S}/Races/catgirl/female/Meshy_AI_catgirl_Running.glb`,
      heightRatio: 0.88,   // petite
      lib: { jump: { clip: 'NinjaJump_Start', lib: 1, ts: 1.6 },   // nimble leap
             castMelee: { clip: 'Melee_Hook', lib: 1, ts: 0.45 } },
    }),
  },
  // Female Ki Fighter — punch combo as the generic cast, kung-fu punch for
  // melee, mage_soell_cast_3 (note the _3) for ki blasts / support, backflip
  // jump. Spare on R2: Punch_Forward_… (exact name unconfirmed).
  'ki fighter': {
    female: _mk3d('kifighter/female', 'attractive_beautiful_', {
      idle: 'Idle_6', walk: 'Running', jump: 'Backflip_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Punch_Combo_5', castMelee: 'Kung_Fu_Punch',
      castMagic: 'mage_soell_cast_3', castSupport: 'mage_soell_cast_3',
    }, { castTimeScale: 2.2, heightRatio: 0.93,
         lib: { jump: { clip: 'NinjaJump_Start', lib: 1, ts: 1.6 },   // nimble leap
                castMelee: { clip: 'Melee_Hook', lib: 1, ts: 0.45 } } }),
  },
  // Female Vampire (humanoid form only — bat-swarm form keeps its particle
  // build, the renderer skips models for it).
  'vampire': {
    female: _mk3d('vampire/female', 'beautiful_attractive_', {
      idle: 'Idle_6', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
      castSupport: 'mage_soell_cast_1',
    }, { heightRatio: 0.97,      // tall, elegant
         basicAttackKind: 'claw',   // fangs and nails, never a sword
         lib: { idle: { clip: 'Idle_FoldArms_Loop', lib: 1 },
                castMelee: { clip: 'Zombie_Scratch', lib: 1, ts: 1.5 } } }),
  },
  // ── Sniper (marksman) — 2026-07-11. The male sniper IS the MAL library's
  // source character (MAL1_Sniper.glb was consolidated from his 20 clip
  // exports in Assets/Models/), so his model is his Idle_5 _withSkin export
  // there — no separate Character_output upload needed, and the library
  // clips retarget onto him 1:1. Wiring this entry is also what UNLOCKS the
  // race: 'marksman' has sat in ACCT_STARTER_UNITS behind the 3D-only gate.
  'marksman': {
    male: _mkUAL('marksman/male', 'sniper', {
      model: 'https://cdn.entropywars.net/Assets/characters/animations/Meshy_AI_sniper_biped_Animation_Idle_5_withSkin.glb',
      heightRatio: 1.02,     // long-coat rifleman, a hair over the anchor
    }),
    // Female sniper (2026-07-11d batch) — lives in the race's SPRITE folder
    // (Homosapien/Female/sniper), unlike the male whose model sits in
    // marksman/male. Standard idle; rifle shots via the default castRanged.
    // 2026-10-25 — his new "sniper_female" Running export, same folder.
    female: _mkUAL('Homosapien/Female/sniper', 'sniper_female', {
      model: `${_S}/Races/Homosapien/Female/sniper/Meshy_AI_sniper_female_Running.glb`,
      heightRatio: 0.96,
    }),
  },

  // ── 2026-07-11d wave (user batch upload — HEAD-verified on R2) ────────────
  // Scarecrow (Harvester, support) — creepy field guardian: zombie sway idle,
  // raking claws for basic attacks (castClaw).
  'scarecrow': {
    male: _mkUAL('scarecrow/male', 'scarecrow', {
      heightRatio: 1.12,          // lanky, on a frame
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Idle_10', lib: 2 },
             castMelee: { clip: 'Zombie_Scratch', lib: 1, ts: 1.5 } },
    }),
  },
  // Santa Clause (White Mage, support) — jolly gift-lobber: the basic attack
  // is an overhand present toss (castThrow); staff waves cover the support kit.
  'santa clause': {
    male: _mkUAL('santaclause', 'Santa_Clause', {
      heightRatio: 1.08,          // big-bellied but human-scale
      basicAttackKind: 'throw',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // broad jolly sway
    }),
  },
  // Mermaid (White Mage, healer) — aquatic: swim-idle like the atlantean;
  // magic surges for basic attacks (no weapon on a tail).
  'mermaid': {
    female: _mkUAL('mermaid/female', 'hot_mermaid_girl', {
      heightRatio: 0.95,
      basicAttackKind: 'magic',
      lib: { idle: { clip: 'Swim_Idle_Loop', lib: 0 } },   // (2026-11-12: the clip is in UAL1 = lib 0; lib 1 has no swim clips, so she stood on the default idle)
    }),
  },
  // Anubis (Black Mage, caster) — "Anubis_Egyptian_dog_" (trailing _ is real:
  // the prompt ended with a space → doubled underscore in …dog__biped_…).
  // Towering jackal god; basic attacks zap (castMagic).
  'anubis': {
    male: _mkUAL('anubis/male', 'Anubis_Egyptian_dog_', {
      heightRatio: 1.15,
      basicAttackKind: 'magic',
    }),
  },
  // ── 2026-07-11e: the rest of the batch (file names user-provided from the
  // R2 dashboard, all HEAD-verified). Models live in each race's SPRITE
  // folder; prefixes are the Meshy prompt text. Trailing underscores are
  // real (prompt truncation → doubled underscore before _biped_).
  // Robin Hood (Sniper) — bow, not gun: basic attacks + ranged spells loose
  // arrows (MAL Archery_Shot_1).
  'robinhood': {
    male: _mkUAL('robinhood', 'archer_robin_hood_r', {
      heightRatio: 1.0,
      basicAttackKind: 'arrow',
      lib: { castRanged: { clip: 'Archery_Shot_1', lib: 2, ts: 1.2 } },
    }),
  },
  // Antperson (Harvester, bruiser) — mandible/claw strikes.
  'antperson': {
    male: _mkUAL('antperson/male', 'giant_ant_realistic', {
      heightRatio: 1.0,
      basicAttackKind: 'claw',
    }),
  },
  // Necromancer (Black Mage, caster) — death magic zaps.
  'necromancer': {
    female: _mkUAL('necromancer/female', 'hot_girl_necromancer', {
      heightRatio: 0.95,
      basicAttackKind: 'magic',
    }),
  },
  // Succubus (Psychic, support) — charm/psychic zaps.
  'succubus': {
    female: _mkUAL('succubus/female', 'hot_seductive_pink_su', {
      heightRatio: 0.98,
      basicAttackKind: 'magic',
    }),
  },
  // Barbarella (Agent, assassin) — retro ray-gun: shoots even point-blank.
  'barbarella': {
    female: _mkUAL('barbarella', 'hot_space_agent_girl_', {
      heightRatio: 0.95,
      basicAttackKind: 'ranged',
    }),
  },
  // King Arthur (Warrior, tank) — fencer stance + sword combos, like the
  // knight. Sprite folder is 'king'.
  'king arthur': {
    male: _mkUAL('king', 'king_arthur_king_of_', {
      heightRatio: 1.05,
      lib: { idle: { clip: 'Sword_Idle' },
             castMelee: { clip: 'Sword_Regular_Combo', lib: 1, ts: 2.4 } },
    }),
  },
  // Mantid (Psychic, assassin) — raking forelimb strikes.
  'mantid': {
    male: _mkUAL('mantid/male', 'mantid_realistic', {
      heightRatio: 1.05,
      basicAttackKind: 'claw',
    }),
  },
  // Mech (Gunslinger, tank) — 3.5m walking weapons platform: shoots at any
  // range, towers over humans (giant is 1.7).
  'mech': {
    male: _mkUAL('mech/male', 'mecha_mech_battle_m', {
      heightRatio: 1.5,
      basicAttackKind: 'ranged',
    }),
  },
  // Minotaur (Raider, bruiser) — brawler sway + heavy fists.
  'minotaur': {
    male: _mkUAL('minotaur', 'minotaur_realistic', {
      heightRatio: 1.25,
      basicAttackKind: 'punch',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },
    }),
  },
  // Mothman (Harbinger, support) — eerie psychic zaps.
  'mothman': {
    male: _mkUAL('mothman/male', 'mothman_cryptid_gian', {
      heightRatio: 1.15,
      basicAttackKind: 'magic',
    }),
  },
  // Reptilian (Agent, assassin) — in a business suit, strikes with claws.
  'reptilian': {
    male: _mkUAL('reptilian/male', 'reptilian_in_a_busine', {
      heightRatio: 1.1,
      basicAttackKind: 'claw',
    }),
  },
  // The PRIEST and the NUN — one race since 2026-10-27 (mondo: "the priest and the nun are supposed to be male and female
  // versions of the same race ... like the cowboy and cowgirl"). Holy zaps; heals get the castHeal staff wave from the
  // shared slots. The male is mondo's "priest" Running export in Races/priest/ (rigged, 67 joints) — the shared library
  // animates him, like the Spy; the Nun keeps the rigged whitemage female GLB she has always worn.
  'priest': {
    male: _mkUAL('priest', 'priest', {
      model: `${_S}/Races/priest/Meshy_AI_priest_Running.glb`,
      heightRatio: 1.0,
      basicAttackKind: 'magic',
    }),
    female: _mkUAL('Homosapien/Female/whitemage', 'sexy_nun_girl_realis', {
      heightRatio: 0.94,
      basicAttackKind: 'magic',
    }),
  },
  // The GANGSTER (Gunslinger, Shank) — his rigged model landed 2026-09-10 in
  // his OWN folder (Races/gangster/), so the 3D-only roster rule stops
  // shelving him (plan §9.6 is closed; he is a starter on both sides now).
  // No basicAttackKind: like the cowboy he quick-draws at range 2 (castRanged)
  // and works up close by hand — and up close he SHANKS, so castMelee is the
  // short cross (UAL1 Punch_Cross), never the sword arc the default plays.
  // Stomp Out reads as a ground slam, Drive-By/Choppa as the gun kit — all
  // of it from the shared library, so this is still one line + one flavour.
  'gangster': {
    male: _mkUAL('gangster', 'thug_gangster_reali', {
      heightRatio: 1.02,
      lib: { castMelee: { clip: 'Punch_Cross', lib: 0, ts: 1.2, strikeAt: 0.25 } },
    }),
  },
  /* ── THE 2026-09-21 BATCH — three races on the user's Meshy "Running" exports. Meshy stopped shipping a
     Character_output.glb in its zips; an Animation_<Clip> export WITH SKIN is the same rigged mesh + one clip
     (28 joints, JOINTS_0 / WEIGHTS_0, the textures embedded — measured), so it IS the base, exactly like the
     male sniper's Idle_5 export. The library retargets onto it; the baked Running clip is ignored. */
  // Police Officer (Gunslinger, ranged) — Disaster City's law. The regular cops: the black officer is THE
  // model, the fat white officer his ALT (RACE_MODEL_SKINS.alts — the HQ population draws either); the two
  // CYBERPUNK officers are the Cyberpunk City SKIN (RACE_MODEL_SKINS.sites — that site only, the user's rule).
  // THE IDLE RULE (2026-09-21, the user: "no pointing gun animation for the idle, even the cop"): a
  // ranged race idles on the library's plain Idle_5 like everyone else — never Pistol_Idle_Loop; the
  // gun comes up for the shot (castRanged) and goes back down.
  'police officer': {
    male: _mkUAL('police', 'a_black_police_officer', {
      model: `${_S}/Races/police/Meshy_AI_a_black_police_officer_Running.glb`,
      heightRatio: 1.02, basicAttackKind: 'ranged',
    }),
  },
  // Jellyfish (Black Mage, caster) — the Bermuda Triangle's drifting king. A biped rig under a bell: it WALKS
  // on the library's ordinary loops (the user's rule, 2026-09-21: "a walking animation, not swimming" — the
  // swim pair was tried and retired), flies (map.js SKY_RACES), and stings with a typed orb.
  'jellyfish': {
    male: _mkUAL('jellyfish', 'a_jellyfish_king', {
      model: `${_S}/Races/jellyfish/Meshy_AI_a_jellyfish_king_Running.glb`,
      heightRatio: 0.92, basicAttackKind: 'magic',
    }),
  },
  // Cult Leader (Harbinger, support) — Bohemian Grove's voice. Idles mid-sermon; the family (DOOR_CAST_MODELS
  // cult1–5) stands round him in the grove.
  'cult leader': {
    male: _mkUAL('cultleader', 'cult_leader', {
      model: `${_S}/Races/cultleader/Meshy_AI_cult_leader_Running.glb`,
      heightRatio: 1.0, basicAttackKind: 'magic',
      lib: { idle: { clip: 'Idle_Talking_Loop', lib: 0 } },
    }),
  },
  // ── THE 2026-09-22 BATCH ── the user's Meshy uploads: a NEW race (the popstar) and six races that were
  // sprite-only until today (ai · ice queen · juggernaut · symbiote · antihero · shadow entity) — each a
  // "Running" / Character_output export wired as the base (the rig rule, MODEL_INDEX §7b). A race that gains
  // a rig here becomes 3D-READY (isUnitUnlocked reads race3DGenders): playable on the forge wall from now on.
  // Popstar (Harbinger, support) — the headliner; sonic buffs, the encore, the stadium show. Her 2D fallback is
  // the harbinger sheet (RACE_PATH_RULES / _HOMOSAPIEN_RACE_JOB_MAP). Idles on the dance loop: she is never off.
  'popstar': {
    female: _mkUAL('popstar', 'a_blonde_popstar', {
      model: `${_S}/Races/popstar/Meshy_AI_a_blonde_popstar_Running.glb`,
      heightRatio: 0.96, basicAttackKind: 'magic',
      lib: { idle: { clip: 'Dance_Loop', lib: 0, ts: 1.0 } },
    }),
  },
  // ── THE 2026-09-30 BATCH ── the user's Meshy uploads (Races/<race>/Meshy_AI_<name>_Running.glb, rigged, 28 joints).
  'astronaut': {
    male: _mkUAL('astronaut', 'astronaut', {
      model: `${_S}/Races/astronaut/Meshy_AI_astronaut_Running.glb`,
      heightRatio: 1.03, basicAttackKind: 'punch',
    }),
  },
  'krampus': {
    male: _mkUAL('krampus', 'krampus', {
      model: `${_S}/Races/krampus/Meshy_AI_krampus_Running.glb`,
      heightRatio: 1.2, basicAttackKind: 'claw',
    }),
  },
  'rabbit': {
    male: _mkUAL('rabbit', 'rabbit', {
      model: `${_S}/Races/rabbit/Meshy_AI_rabbit_Running.glb`,
      heightRatio: 0.97, basicAttackKind: 'punch',
    }),
  },
  'luchador': {
    male: _mkUAL('luchador', 'luchador', {
      model: `${_S}/Races/luchador/Meshy_AI_luchador_Running.glb`,
      heightRatio: 1.03, basicAttackKind: 'punch',
    }),
  },
  'firefighter': {
    male: _mkUAL('firefighter', 'firefighter', {
      model: `${_S}/Races/firefighter/Meshy_AI_firefighter_Running.glb`,
      heightRatio: 1.05, basicAttackKind: 'punch',
    }),
  },
  'goblin': {
    male: _mkUAL('goblin', 'goblin', {
      model: `${_S}/Races/goblin/Meshy_AI_goblin_Running.glb`,
      heightRatio: 0.65, basicAttackKind: 'claw',
    }),
  },
  'hippie': {
    male: _mkUAL('hippie', 'hippie_male', {
      model: `${_S}/Races/hippie/Meshy_AI_hippie_male_Running.glb`,
      heightRatio: 1.0, basicAttackKind: 'magic',
    }),
    female: _mkUAL('hippie', 'hippie_female', {
      model: `${_S}/Races/hippie/Meshy_AI_hippie_female_Running.glb`,
      heightRatio: 0.95, basicAttackKind: 'magic',
    }),
  },
  // ── THE 2026-10-25 BATCH ── mondo's Meshy uploads (rigged, 28 joints, 1.7 m in the file): chef, eagleman, flesheater, mime.
  'chef': {
    male: _mkUAL('chef/male', 'chef_male', {
      model: `${_S}/Races/chef/male/Meshy_AI_chef_male_Running.glb`,
      heightRatio: 1.0, basicAttackKind: 'punch',
      // THE CHEF'S POSE (spell look fix FX-1, 2026-10-26): the shared sniper idle (Idle_5) holds both arms ~45° out
      // and mage_soell_cast_1 (castHurl, Fireball) spreads them level for ~0.6 s — on his stiff white coat both read
      // as a T-pose through every windup. He idles arms-down (UAL1 Idle_Loop) and hurls overhand (castThrow's clip).
      lib: { idle: { clip: 'Idle_Loop', lib: 0, ts: 1.0 },
             castHurl: { clip: 'OverhandThrow', lib: 1, ts: 1.2, strikeAt: 0.46, defer: true } },
    }),
  },
  'eagleman': {
    male: _mkUAL('eagleman', 'eagleman_', {
      model: `${_S}/Races/eagleman/Meshy_AI_eagleman__Running.glb`,
      heightRatio: 1.04, basicAttackKind: 'claw',
    }),
  },
  'flesheater': {
    male: _mkUAL('flesheater', 'flesheater', {
      model: `${_S}/Races/flesheater/Meshy_AI_flesheater_Running.glb`,
      heightRatio: 1.22, basicAttackKind: 'claw',
    }),
  },
  'mime': {
    female: _mkUAL('mime', 'mime_female', {
      model: `${_S}/Races/mime/Meshy_AI_mime_female_Running.glb`,
      heightRatio: 0.93, basicAttackKind: 'punch',
    }),
  },
  // ── THE UNDEAD BATCH (2026-10-25, mondo) ── Races/<folder>/Meshy_AI_<name>_Running.glb, rigged (the swamp monster's
  // rig carries finger bones: 66 joints)
  'mummy': {
    female: _mkUAL('mummy', 'mummy_female', {
      model: `${_S}/Races/mummy/Meshy_AI_mummy_female_Running.glb`,
      heightRatio: 0.95, basicAttackKind: 'punch',
    }),
  },
  'swamp monster': {
    male: _mkUAL('swampmonster', 'swampmonster', {
      model: `${_S}/Races/swampmonster/Meshy_AI_swampmonster_Running.glb`,
      heightRatio: 1.2, basicAttackKind: 'claw',
    }),
  },
  'undead': {
    male: _mkUAL('undead', 'undead', {
      model: `${_S}/Races/undead/Meshy_AI_undead_Running.glb`,
      heightRatio: 1.05, basicAttackKind: 'claw',
    }),
  },
  // 2026-10-27 — mondo's Bligblog: Races/bligblog/Meshy_AI_bligblog_Running.glb, rigged (58 joints: fingers + extra bones)
  'bligblog': {
    male: _mkUAL('bligblog', 'bligblog', {
      model: `${_S}/Races/bligblog/Meshy_AI_bligblog_Running.glb`,
      heightRatio: 1.0, basicAttackKind: 'punch',
    }),
  },
  // ── THE 2026-09-30 BATCH ── the user's Meshy uploads (Races/<race>/Meshy_AI_<name>_Running.glb, rigged, 28 joints).
  'clown': {
    male: _mkUAL('clown', 'evil_clown', {
      model: `${_S}/Races/clown/Meshy_AI_evil_clown_Running.glb`,
      heightRatio: 1.03, basicAttackKind: 'punch',
    }),
  },
  'bunny girl': {
    female: _mkUAL('bunnygirl', 'bunny_girl', {
      model: `${_S}/Races/bunnygirl/Meshy_AI_bunny_girl_Running.glb`,
      heightRatio: 0.97, basicAttackKind: 'punch',
    }),
  },
  'sharkman': {
    male: _mkUAL('sharkman', 'shark_man', {
      model: `${_S}/Races/sharkman/Meshy_AI_shark_man_Running.glb`,
      heightRatio: 1.15, basicAttackKind: 'claw',
    }),
  },
  'crystal guardian': {
    male: _mkUAL('crystalguardian', 'crystal_guardian', {
      model: `${_S}/Races/crystalguardian/Meshy_AI_crystal_guardian_Running.glb`,
      heightRatio: 1.15, basicAttackKind: 'punch',
    }),
  },
  'jack o lantern': {
    male: _mkUAL('jackolantern', 'jack_o_lantern', {
      model: `${_S}/Races/jackolantern/Meshy_AI_jack_o_lantern_Running.glb`,
      heightRatio: 1.08, basicAttackKind: 'magic',
    }),
  },
  'sidekick': {
    male: _mkUAL('sidekick', 'superhero_sidekick', {
      model: `${_S}/Races/sidekick/Meshy_AI_superhero_sidekick_Running.glb`,
      heightRatio: 1.0, basicAttackKind: 'punch',
    }),
  },
  'mushroom girl': {
    female: _mkUAL('mushroomgirl', 'mushroom_girl', {
      model: `${_S}/Races/mushroomgirl/Meshy_AI_mushroom_girl_Running.glb`,
      heightRatio: 0.92, basicAttackKind: 'magic',
    }),
  },
  'tree person': {
    male: _mkUAL('treeperson', 'treeperson', {
      model: `${_S}/Races/treeperson/Meshy_AI_treeperson_Running.glb`,   // 2026-10-25 — his new treeperson model
      heightRatio: 1.5, basicAttackKind: 'claw',
    }),
  },
  'sheriff': {
    male: _mkUAL('sherrif', 'western_sherrif', {
      model: `${_S}/Races/sherrif/Meshy_AI_western_sherrif_Running.glb`,
      heightRatio: 1.04, basicAttackKind: 'ranged',
    }),
  },
  // Time Cop (mondo 2026-10-24) — a sheriff, a cop or a future cop depending on the ability it casts. Three
  // existing rigs: the Police Officer's (the look it starts in), the Sheriff's, and the Cyberpunk City cop
  // (RACE_MODEL_SKINS). The swap is the honda civic's: a cast sets unit._spriteOverride to a TIME_COP_LOOKS
  // url (battle.js UNIT_ANIM_OVERRIDES['time cop'], picked by the spell's family) and the renderer resolves
  // overrideForms[url]. No revertAfter, so the look stays until an ability from another look is cast.
  // 2026-10-27 (mondo: "make the time cop show as the future cop by default to separate it from the police
  // officer"): the future cop is the def it starts in (the board, the party builder, the viewer); the cop and
  // the sheriff are still the looks its Police Training / Cowboy Skills / Marksmanship casts put on.
  'time cop': {
    male: (function () {
      const cop = _mkUAL('police', 'a_black_police_officer', {
        model: `${_S}/Races/police/Meshy_AI_a_black_police_officer_Running.glb`,
        heightRatio: 1.02, basicAttackKind: 'ranged',
      });
      const sheriff = _mkUAL('sherrif', 'western_sherrif', {
        model: `${_S}/Races/sherrif/Meshy_AI_western_sherrif_Running.glb`,
        heightRatio: 1.04, basicAttackKind: 'ranged',
      });
      const future = _mkUAL('police', 'a_cyberpunk_police_officer', {
        model: `${_S}/Races/police/Meshy_AI_a_cyberpunk_police_officer_Running.glb`,
        heightRatio: 1.02, basicAttackKind: 'ranged',
      });
      future.overrideForms = {};
      future.overrideForms[TIME_COP_LOOKS.cop] = cop;
      future.overrideForms[TIME_COP_LOOKS.sheriff] = sheriff;
      future.overrideForms[TIME_COP_LOOKS.future] = future;
      return future;
    })(),
  },
  // ── THE 2026-09-30 BATCH ── the user's Meshy uploads (Races/<race>/Meshy_AI_<name>_Running.glb, rigged, 28 joints).
  'starfish': {
    male: _mkUAL('starfish', 'sentient_starfish', {
      model: `${_S}/Races/starfish/Meshy_AI_sentient_starfish_Running.glb`,
      heightRatio: 1.0, basicAttackKind: 'magic',
    }),
  },
  'ringmaster': {
    male: _mkUAL('ringleader', 'circus_ringmaster', {
      model: `${_S}/Races/ringleader/Meshy_AI_circus_ringmaster_Running.glb`,
      heightRatio: 1.03, basicAttackKind: 'magic',
    }),
  },
  'bee queen': {
    female: _mkUAL('beequeen', 'the_hive_queen', {
      model: `${_S}/Races/beequeen/Meshy_AI_the_hive_queen_Running.glb`,
      heightRatio: 1.08, basicAttackKind: 'magic',
    }),
  },
  'professor': {
    male: _mkUAL('professor', 'male_college_professor', {
      model: `${_S}/Races/professor/Meshy_AI_male_college_professor_Running.glb`,
      heightRatio: 1.0, basicAttackKind: 'magic',
    }),
  },
  'deep sea fish': {
    male: _mkUAL('deepseafish', 'alien_fish', {
      model: `${_S}/Races/deepseafish/Meshy_AI_alien_fish_Running.glb`,
      heightRatio: 1.03, basicAttackKind: 'claw',
    }),
  },
  // AI (Gunslinger, ranged; flies — map.js SKY_RACES) — "AI_girl" Character_output (Races/ai/female/).
  'ai': {
    female: _mkUAL('ai/female', 'AI_girl', {
      heightRatio: 0.95, basicAttackKind: 'ranged',
    }),
  },
  // Ice Queen (caster) — "an_ice_queen" Running export (Races/icequeen/). Frost from the hand: magic basics.
  'ice queen': {
    female: _mkUAL('icequeen', 'an_ice_queen', {
      model: `${_S}/Races/icequeen/Meshy_AI_an_ice_queen_Running.glb`,
      heightRatio: 1.02, basicAttackKind: 'magic',
    }),
  },
  // Juggernaut (bruiser) — "a_giant_juggernaut" Running export (Races/juggernaut/). Head and shoulders over a
  // human; the monster sway idle like the kaiju's.
  'juggernaut': {
    male: _mkUAL('juggernaut', 'a_giant_juggernaut', {
      model: `${_S}/Races/juggernaut/Meshy_AI_a_giant_juggernaut_Running.glb`,
      heightRatio: 1.42, basicAttackKind: 'punch',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },
    }),
  },
  // Symbiote (caster) — "a_female_symbiote" Running export (Races/symbiote/). The suit lashes: magic basics
  // (battle.js BASIC_ATTACK_RACE_KINDS agrees).
  'symbiote': {
    female: _mkUAL('symbiote', 'a_female_symbiote', {
      model: `${_S}/Races/symbiote/Meshy_AI_a_female_symbiote_Running.glb`,
      heightRatio: 0.98, basicAttackKind: 'magic',
    }),
  },
  // Antihero (bruiser) — "antihero" Character_output (Races/antihero/, no _biped_ in the stem: an explicit model).
  'antihero': {
    male: _mkUAL('antihero', 'antihero', {
      model: `${_S}/Races/antihero/Meshy_AI_antihero_Character_output.glb`,
      heightRatio: 1.0, basicAttackKind: 'punch',
    }),
  },
  // Shadow Entity (caster; flies — SKY_RACES) — "shadowperson" Walking export (Races/shadowentity/male/), 2026-10-25.
  'shadow entity': {
    male: _mkUAL('shadowentity/male', 'shadowperson', {
      model: `${_S}/Races/shadowentity/male/Meshy_AI_shadowperson_Walking.glb`,
      heightRatio: 1.12, basicAttackKind: 'magic',
    }),
  },
  // Robot (Warrior, tank) — hydraulic haymakers.
  'robot': {
    male: _mkUAL('robot/male', 'futuristic_robot_rea', {
      heightRatio: 1.05,
      basicAttackKind: 'punch',
    }),
    // Female (2026-09-22 batch) — "robot_female" Character_output (Races/robot/female/). The gendered
    // idle / walk defaults (Walking_Woman) are overridden: a chassis walks like a chassis.
    female: _mkUAL('robot/female', 'robot_female', {
      heightRatio: 1.0,
      basicAttackKind: 'punch',
      lib: { idle: { clip: 'Idle_5', lib: 0 }, walk: { clip: 'Running', lib: 0 } },
    }),
  },
  // Cyborg (Raider, bruiser) — augmented strikes.
  'cyborg': {
    female: _mkUAL('cyborg/female', 'hot_girl_futuristic_', {
      heightRatio: 0.97,
      basicAttackKind: 'punch',
    }),
  },
  // ── 2026-07-13 batch ──
  // Zombie (Raider/Bruiser, tank archetype) — shambles with the undead gait,
  // rakes with rotten nails.
  'zombie': {
    female: _mkUAL('zombie/female', 'female_zombie_pretty', {
      heightRatio: 0.96,
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Idle_10', lib: 2 },
             walk: { clip: 'Zombie_Walk_Fwd_Loop', lib: 1, ts: 2.5 },
             castMelee: { clip: 'Zombie_Scratch', lib: 1, ts: 1.5 } },
    }),
  },
  // Swordfighter (Swordmaster, new race 2026-07-13) — pop-idol duelist:
  // fencer ready stance, real sword combos for melee strikes.
  'swordfighter': {
    female: _mkUAL('swordfighter/female', 'hot_girl_pop_idol_s', {
      heightRatio: 0.94,
      lib: { idle: { clip: 'Sword_Idle' },
             castMelee: { clip: 'Sword_Regular_Combo', lib: 1, ts: 2.4 } },
    }),
  },
  // Fallen Angel (Harbinger, caster) — corrupted grace, magic zaps.
  'fallen angel': {
    female: _mkUAL('fallenangel/female', 'fallen_angel_r', {
      heightRatio: 1.0,
      basicAttackKind: 'magic',
    }),
  },

  // ── 2026-07-19 batch (user upload — HEAD-verified on R2, rigs parsed) ─────
  // Yeti (bruiser) — towering frost cryptid, bigfoot's cousin: brawler sway,
  // raking ice claws. Avalanche Strike rides the leapStrike dive arc + its
  // landing VFX; Frozen Punch classifies to the claw/strike basics.
  'yeti': {
    male: _mkUAL('yeti/male', 'yeti', {
      heightRatio: 1.38,
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // brawler sway
    }),
  },
  // Skeleton (undead) — shambles with the zombie gait, rakes with bone claws.
  'skeleton': {
    male: _mkUAL('skeleton/male', 'skeleton', {
      heightRatio: 1.0,
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Idle_10', lib: 2 },
             walk: { clip: 'Zombie_Walk_Fwd_Loop', lib: 1, ts: 2.5 },
             castMelee: { clip: 'Zombie_Scratch', lib: 1, ts: 1.5 } },
    }),
  },
  // Kaiju — REMODELED 2026-07-25: the new "kaiju_realistic" Character_output
  // replaces the old retro_1990_s_japan_cy tokusatsu suit (which was also a
  // 71MB preload hog). Library-animated, so the swap is prefix-only. Nearly
  // giant-sized (giant is 1.7); stomps classify to castSlam, Skyscraper Toss
  // to castThrow, Atomic Breath fires its mapped beam.
  // REMODELED again 2026-09-30: the user's new "kaiju" Running export (Races/kaiju/male/Meshy_AI_kaiju_Running.glb).
  'kaiju': {
    male: _mkUAL('kaiju/male', 'kaiju', {
      model: `${_S}/Races/kaiju/male/Meshy_AI_kaiju_Running.glb`,
      heightRatio: 1.6,
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // monster sway
    }),
  },
  // Superhero (flying bruiser) — leads with superhuman haymakers.
  'superhero': {
    // Prefix ends with '_' — the Meshy prompt truncation doubled the
    // underscore in …superhero__biped_… (same pattern as the psychics).
    female: _mkUAL('superhero/female', 'hot_girl_superhero_', {
      heightRatio: 0.97,
      basicAttackKind: 'punch',
    }),
    // Male (2026-09-22 batch) — "a_superhero" Running export (Races/superhero/male/), the base per the rig rule.
    // THE SWAY (2026-11-01, the first spring-bone test): the same export with 5 chains of cape bones baked in
    // (bake-sway.py) — the cape swings and streams behind him instead of riding his legs (three-renderer.js THE SWAY).
    // Optional per-character tuning: sway: { stiffness, gravity, drag, maxRoot, maxBend }.
    male: _mkUAL('superhero/male', 'a_superhero', {
      model: `${_S}/Races/superhero/male/Meshy_AI_a_superhero_Running_sway.glb`,
      heightRatio: 1.05,
      basicAttackKind: 'punch',
    }),
  },
  // Demon Princess (flying hex-caster) — royal cruelty, magic zaps.
  'demon princess': {
    female: _mkUAL('demonprincess/female', 'hot_girl_hell_princ', {
      heightRatio: 1.0,
      basicAttackKind: 'magic',
    }),
  },
  // Voidweaver — giant spider on a QUADRUPED Meshy rig (tail/backleg/head
  // bones): the biped animation libraries cannot retarget onto it, so no
  // animLib fields. Its one per-character export is the custom Walking clip —
  // note the `_quadruped_model_Animation_` stem (not the biped
  // `_biped_Animation_` convention), hence explicit URLs instead of _mk3d.
  // Idle = static rest pose; casts/hits fall back to the engine lunge/glow
  // tweens, and its projectiles already fly as spiders (UNIT_ANIM_OVERRIDES).
  'voidweaver': {
    male: {
      model: `${_VOID_3D}/Meshy_AI_giant_spider_realisti_quadruped_Character_output.glb`,
      clips: {
        walk: `${_VOID_3D}/Meshy_AI_giant_spider_realisti_quadruped_model_Animation_Walking_withSkin.glb`,
      },
      heightRatio: 0.85,     // low-slung — the legspan spreads well past a tile
      yawOffset: 0,          // head sits +Z of the tail at rest, like the bipeds
      moveTimeScale: 2.0,    // Walking 1.0s → ~0.5s/cycle at board pace
      castTimeScale: 2.0,
      deathTimeScale: 1.9,
      hitTimeScale: 2.8,
      jumpTimeScale: 3.2,
    },
  },
  // Honda Civic — the transformer. TWO models: the boneless sedan
  // (texture-stage GLB — a static mesh is exactly right for a parked car)
  // idles, drives AND fights (2026-10-24, mondo: the car attacks as the car),
  // and the rigged robot ("1990s_sedan_transform", a standard Meshy biped →
  // library-animated) takes over only while the unit wears the Transform
  // carrier (STATUS_DEFS mechaForm): battle.js UNIT_ANIM_OVERRIDES['honda
  // civic'].formSprites pins unit._spriteOverride to the combat sprite URL,
  // and the renderer resolves def.overrideForms[_spriteOverride] to pick the
  // 3D form. Transform again folds it back into the car. transformFx pops a
  // ground ring at each morph. If the sedan drives tail-first, flip yawOffset sign.
  'honda civic': {
    male: (function () {
      const car = {
        model: `${_S}/Races/hondacivic/Meshy_AI_1990s_sedan_0719015525_texture.glb`,
        clips: {},
        heightRatio: 0.55,        // roofline ~chest-high → ~1.7 tiles bumper-to-bumper
        yawOffset: Math.PI / 2,   // export's long axis is X — swing the nose to +Z (sign flipped 2026-07-19: it drove tail-first)
        transformFx: true,
        drives: true,             // three-renderer.js _unitDrivesNow: its melee strike rolls in and rams, no hop (2026-10-24)
        moveTimeScale: 1, castTimeScale: 1,
        deathTimeScale: 1.9, hitTimeScale: 2.8, jumpTimeScale: 3.2,
      };
      const robot = _mkUAL('hondacivic', '1990s_sedan_transform', {
        heightRatio: 1.45,        // 3.2m bipedal combat platform (mech is 1.5)
        basicAttackKind: 'punch', // "it stood up and punched a building"
        transformFx: true,
        lib: { idle: { clip: 'Idle_10', lib: 2 } },
      });
      car.overrideForms = {};
      if (typeof HONDA_CIVIC_SPRITES !== 'undefined') {
        car.overrideForms[HONDA_CIVIC_SPRITES.combat] = robot;
        car.overrideForms[HONDA_CIVIC_SPRITES.moving] = car;   // stays the car while driving
      }
      return car;
    })(),
  },

  // ── 2026-07-22 batch (user upload — divine host wave; paths taken
  // verbatim from the drop, CDN egress blocked in-session so not
  // HEAD-verified) ──────────────────────────────────────────────────────
  // Valkraye (Swordmaster, bruiser) — Odin's chooser: fencer ready stance,
  // real sword combos for her spear/blade strikes. Note the doubled
  // underscore in the file stem (…valkraye__biped_…) → prefix keeps a
  // trailing '_' (same pattern as the psychics/superhero).
  'valkraye': {
    female: _mkUAL('valkraye', 'hot_girl_valkraye_', {
      heightRatio: 0.98,
      lib: { idle: { clip: 'Sword_Idle' },
             castMelee: { clip: 'Sword_Regular_Combo', lib: 1, ts: 2.4 } },
    }),
  },
  // Angel (White Mage, healer) — grace incarnate, holy zaps; heals get the
  // castHeal staff wave from the shared slots. Doubled underscore in
  // …angel_girl__biped_… → trailing '_' prefix.
  'angel': {
    female: _mkUAL('angel/female', 'beautiful_angel_girl_', {
      heightRatio: 1.0,
      basicAttackKind: 'magic',
    }),
  },
  // Seraphim (2026-10-26, mondo's ring-of-eyes upload) — a boneless Meshy
  // texture-stage GLB, so no library clips: procRig 'seraphRings'
  // (three-renderer.js THE PROCEDURAL RIGS) nests a second copy inside it, a
  // wheel within a wheel, and drives both with its own keyframe clips (always
  // turning; on attacks and spells the inner wheel flies out and the game's
  // eyeball opens at the core). 2.4 m (data.js physique) → 1.25 like the djinn.
  'seraphim': (function () {
    const ring = {
      model: `${_S}/Races/seraphim/Meshy_AI_a_circular_ring_of_ey_1026083741_texture.glb`,
      clips: {},
      procRig: 'seraphRings',
      heightRatio: 1.25,
      yawOffset: 0,
      basicAttackKind: 'magic',
      moveTimeScale: 1, castTimeScale: 1, deathTimeScale: 1, hitTimeScale: 1, jumpTimeScale: 1,
    };
    // both genders: the 3D-only roster rule (getAvailableGendersForRace) drops a gender with no model
    return { male: ring, female: ring };
  })(),
  // Occulus (2026-10-27, mondo's wings upload: "combine them with the eyeball
  // to make the 3d occulus with custom animations") — static wings (now his
  // single bat wing, mirrored), so no library clips: procRig 'occulusWings'
  // (three-renderer.js THE PROCEDURAL RIGS) hinges each wing on its own root,
  // hangs the game's eyeball between them and drives both wings separately
  // with its own keyframe clips (_OCC_POSES: a flap per wing, a motion per
  // spell kind). Male only, like its sprite (RACE_SPRITE_GENDERS).
  'occulus': {
    male: {
      // 2026-10-27 (mondo: "For the occulus, use these bat wings instead of angel wings"): his single bat wing,
      // doubled and mirrored by the procRig (three-renderer.js THE SINGLE WINGS)
      model: 'https://cdn.entropywars.net/Assets/characters/gear/wings/Meshy_AI_one_bat_wing_1027074652_texture.glb',
      clips: {},
      procRig: 'occulusWings',
      heightRatio: 0.67,   // the bat pair stands ~3.85 tall at rest (the first wings ~4.9 at 0.85): the same eye size and wingspan as before
      yawOffset: 0,
      basicAttackKind: 'magic',
      moveTimeScale: 1, castTimeScale: 1, deathTimeScale: 1, hitTimeScale: 1, jumpTimeScale: 1,
    },
  },
  // Unicorn (2026-10-27, mondo: "use a white horse, the unicorn horn, and the
  // angel wings to make a new unicorn character with custom animations for it
  // spells") — THE HORSES' file with the tack off, his single angel wing on
  // each side (Assets/characters/gear/wings/, mirrored for the left) and the horn on the
  // head: procRig 'unicornWings' (three-renderer.js THE PROCEDURAL RIGS) keeps
  // the horse's own Idle / Trot / Gallop under the wings and gives every cast
  // kind a pose of its own (_UNI_POSES). The '#unicorn' on the url keeps the
  // rig cache's assembly apart from the plain horses (mounts, rooms).
  'unicorn': (function () {
    const uni = {
      model: 'https://cdn.entropywars.net/Assets/world/animals/horses/Horse_glb.glb#unicorn',
      clips: {},
      procRig: 'unicornWings',
      heightRatio: 1.3,    // the box is the wing tips (above the ears): the horse stands ~1.15 tiles to the ears, a long body over its tile
      yawOffset: 0,
      basicAttackKind: 'melee',   // the horn (castMelee = the gore)
      moveTimeScale: 1, castTimeScale: 1, deathTimeScale: 1, hitTimeScale: 1, jumpTimeScale: 1,
    };
    return { male: uni };
  })(),
  // Ghost (White Mage, healer) — the drifting dead, spectral zaps.
  'ghost': {
    female: _mkUAL('ghost/female', 'ghost_realistic_hot', {
      heightRatio: 0.97,
      basicAttackKind: 'magic',
    }),
    // 2026-10-29 — the Halloween pack's sheet ghost (R2 Assets/world/packs/elbolilloduro_halloween/characters/Character_Ghost.fbx + textures/Ghost.png).
    // Rigged (20 bones, its own L_/R_ names, no hips bone, facing -Z), so it was baked offline into this GLB: the bones renamed
    // to the Meshy names the shared library retargets onto, a Hips root added under the spine, turned to face +Z, metres, the
    // sheet embedded. The library animates it like every other rig; ASSET_MANIFEST lists its KTX2/meshopt copy.
    male: _mkUAL('ghost/male', 'Character_Ghost', {
      model: 'https://cdn.entropywars.net/Assets/world/packs/elbolilloduro_halloween/characters/Character_Ghost.glb',
      heightRatio: 1.0,
      basicAttackKind: 'magic',
    }),
  },
  // Nephilim (Warrior, tank) — 2.8m half-angel colossus (data.js sizes;
  // mech is 1.5, giant 1.7): brawler sway, giant-blooded haymakers.
  'nephilim': {
    male: _mkUAL('nephilim/male', 'nephilim_realistic', {
      heightRatio: 1.5,
      basicAttackKind: 'punch',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },
    }),
  },
  // ── 2026-07-24 batch ──
  // Djinn (Black Mage) — 2.3m bound elemental (data.js physique), smoke below
  // the waist: folded-arms genie idle, arcane bolts instead of sword swings.
  'djinn': {
    // REPLACED 2026-09-22 — the user's "a_djinn" Running export is the base now (the 2026-09-21 rig rule);
    // the old djinn_genie_realist Character_output stays in the bucket unreferenced.
    male: _mkUAL('djinn/male', 'a_djinn', {
      model: `${_S}/Races/djinn/male/Meshy_AI_a_djinn_Running.glb`,
      heightRatio: 1.25,
      basicAttackKind: 'magic',
      lib: { idle: { clip: 'Idle_FoldArms_Loop', lib: 1 } },
    }),
  },
  // Orb of Light (Harbinger) — sentient light in a petite humanoid shell.
  // Her physique entry is 0.6m, but that's the luminous core, not the render
  // height; she stands a touch under a human female so she stays clickable.
  'orb of light': {
    female: _mkUAL('orboflight/female', 'hot_girl_sentient_li', {
      heightRatio: 0.9,
      basicAttackKind: 'magic',
    }),
  },

  // ── 2026-07-25 batch (user upload — monsters & main-character wave; also
  // remodels kaiju + adds the halfdemon male above) ─────────────────────────
  // Gnome (Engineer, specialist) — garden gnome tinkerer, 0.9m (data.js
  // physique): knee-high deployable spammer; turret/mine plants ride the
  // shared castTrap kneel.
  'gnome': {
    male: _mkUAL('gnome/male', 'garden_gnome_realist', {
      heightRatio: 0.65,
    }),
  },
  // King Kong (Harvester, bruiser) — "evil_gorilla_monster_": the 15m
  // colossal ape rendered just under the giant (1.7)/kaiju (1.6) tier.
  // Brawler sway, haymaker basics; Primal Smash/Ground Slam classify to the
  // punch/slam slots. Doubled underscore in …monster__biped_… → the prefix
  // keeps a trailing '_' (same pattern as the psychics/superhero).
  'king kong': {
    male: _mkUAL('kingkong', 'evil_gorilla_monster_', {
      heightRatio: 1.65,
      basicAttackKind: 'punch',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // monster sway
    }),
  },
  // Goatman (Raider, bruiser) — 2.0m cryptid: brawler sway, raking hooves.
  // Gore/Cliff Charge ride the dash/leapStrike arcs + their impact VFX.
  'goatman': {
    male: _mkUAL('goatman/male', 'goatman_realistic', {
      heightRatio: 1.15,
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // brawler sway
    }),
  },
  // Kraken (Harbinger, support) — 12m deep-sea horror surfaced on legs;
  // rendered in the colossal tier under kong/kaiju. Tentacle strikes rake
  // via the claw basics; Tidal Surge/Maelstrom fire their mapped water VFX.
  'kraken': {
    male: _mkUAL('kraken/male', 'kraken_realistic', {
      heightRatio: 1.55,
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // monster sway
    }),
  },
  // Politician (Freelancer, support) — the President himself. Plain human
  // stature; his kit is all orders/budgets/filibusters → magic zaps for
  // basics so he never throws a fist on camera.
  'politician': {
    // REPLACED 2026-09-22 — the user's re-export (…_biped_Animation_Running_withSkin.glb, the rigged mesh + one
    // baked clip = the base, the 2026-09-21 rig rule); the old Character_output is retired.
    male: _mkUAL('politician', 'politician_realisti', {
      model: `${_S}/Races/politician/Meshy_AI_politician_realisti_biped_Animation_Running_withSkin.glb`,
      heightRatio: 1.0,
      basicAttackKind: 'magic',
    }),
  },
  // Conspiracy Theorist (Harbinger, support) — Harlan Vox, late-night radio
  // host: broadcasts, dead air and tinfoil → magic zap basics.
  'conspiracy theorist': {
    male: _mkUAL('conspiracytheorist', 'radio_host_realisti', {
      heightRatio: 1.0,
      basicAttackKind: 'magic',
    }),
  },
  // Overlord (Warrior, bruiser) — Kael, 2.4m underworld sovereign (djinn
  // 2.3m → 1.25): decrees and hellfire → magic basics despite the Warrior
  // chassis. Doubled underscore in …overlord__biped_… → trailing '_' prefix.
  'overlord': {
    male: _mkUAL('overlord', 'underworld_overlord_', {
      heightRatio: 1.3,
      basicAttackKind: 'magic',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // brawler sway
    }),
  },
  // ── 2026-08-06 batch (sprites.js RACE_MODELS_3D — prehistoric predators) ──
  // Dinosaur (Raider, bruiser) — 4.5m theropod (data.js physique), rendered a
  // notch under the kraken (12m → 1.55): monster sway, raking talon basics.
  'dinosaur': {
    male: _mkUAL('dinosaur/male', 'dinosaur_realistic', {
      heightRatio: 1.5,
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // monster sway
    }),
  },
  // Dragon (flyer, SKY_RACES) — 6m wyrm in the colossal tier alongside king
  // kong (1.65): monster sway, claw basics; breath attacks fire their mapped
  // beam VFX.
  'dragon': {
    male: _mkUAL('dragon/male', 'dragon_realistic', {
      heightRatio: 1.6,
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // monster sway
    }),
  },
  // ── 2026-08-13 batch (user upload — horrors, cryptids & the general) ──────
  // Black Goo (Psychic, specialist) — 1.5m amorphous one-eyed mass. Model sits
  // directly in Races/blackgoo/ (no gender subfolder). Corrosive splash /
  // toxic nova kit → magic basics, never a sword swing.
  'black goo': {
    male: _mkUAL('blackgoo', 'black_goo_with_one_ey', {
      heightRatio: 0.9,
      basicAttackKind: 'magic',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // monster sway
    }),
  },
  // Cosmic Wraith (Sniper, ranged) — 2.2m spectral horror (djinn 2.3m → 1.25):
  // entropic beams / heat death → magic basics.
  'cosmic wraith': {
    male: _mkUAL('cosmicwraith/male', 'cosmic_wraith_realis', {
      heightRatio: 1.2,
      basicAttackKind: 'magic',
    }),
  },
  // Dreameater (Psychic, support, SKY_RACES) — 2.0m alien entity that feeds
  // on sleep: dream siphons / nightmare pulses → magic basics.
  'dreameater': {
    male: _mkUAL('dreameater/male', 'dream_eater_alien_ent', {
      heightRatio: 1.15,
      basicAttackKind: 'magic',
    }),
  },
  // Gargoyle (Sniper chassis, tank block, SKY_RACES) — 1.9m living stone,
  // female model: raking claw basics + monster sway instead of the default
  // feminine idle.
  'gargoyle': {
    female: _mkUAL('gargoyle/female', 'female_gargoyle_real', {
      heightRatio: 1.05,
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // stone-beast sway
    }),
  },
  // Ghoul (Agent, assassin) — 1.8m graveyard feeder: bite/claw basics.
  'ghoul': {
    male: _mkUAL('ghoul/male', 'ghoul_realistic', {
      heightRatio: 1.0,
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // hunched sway
    }),
  },
  // Glitch (Engineer, specialist, SKY_RACES) — 1.7m holographic entity:
  // crash loops / blue screens → magic zap basics.
  'glitch': {
    male: _mkUAL('glitch/male', 'glitch_entity_hologr', {
      heightRatio: 0.98,
      basicAttackKind: 'magic',
    }),
  },
  // Golem (Tank, bruiser) — 2.6m animated stone (overlord 2.4m → 1.3). Model
  // sits directly in Races/golem/ (no gender subfolder). Boulder fists →
  // punch basics.
  'golem': {
    male: _mkUAL('golem', 'golem_realistic', {
      heightRatio: 1.35,
      basicAttackKind: 'punch',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // monster sway
    }),
  },
  // Loch Ness Monster (Tank) — 10m lake cryptid surfaced on land, rendered in
  // the colossal tier just under the kraken (12m → 1.55): monster sway,
  // raking flipper/maw basics.
  'loch ness monster': {
    male: _mkUAL('lochnessmonster/male', 'loch_ness_monster_re', {
      heightRatio: 1.5,
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // monster sway
    }),
  },
  // General (Warrior, tank block) — General Voss, 1.8m human officer. Model
  // sits directly in Races/general/ (no gender subfolder). Plain melee
  // basics; Rally Command / Artillery Strike fire their mapped VFX.
  'general': {
    male: _mkUAL('general', 'military_general_rea', {
      heightRatio: 1.0,
    }),
  },
};

// ── Gendered library defaults (2026-07-11) ─────────────────────────────────
// Every `female:` def idles/walks with the female Meshy clips (Idle_11 /
// Walking_Woman) unless the character claimed the slot itself via opts.lib
// (vampire folded arms, mermaid swim…). The Pistol_Idle_Loop gun-pose idles
// were retired 2026-08-09 (owner call: nobody mimes holding a gun at rest).
(function _applyFemaleSlotDefaults() {
  for (const race in RACE_MODELS_3D) {
    const def = RACE_MODELS_3D[race] && RACE_MODELS_3D[race].female;
    if (!def || !def.libClips) continue;
    const own = def._libOverridden || [];
    const lc = Object.assign({}, def.libClips), lt = Object.assign({}, def.libTimeScales);
    for (const slot in _FEM_SLOT_DEFAULTS) {
      if (own.indexOf(slot) >= 0) continue;
      const o = _FEM_SLOT_DEFAULTS[slot];
      lc[slot] = _ualClipRef(o);
      lt[slot] = o.ts;
    }
    def.libClips = lc; def.libTimeScales = lt;
  }
})();

// ── THE LOOK: raw library clips picked on a spell row (2026-09-26) ─────────
// registerSpellAnimClips(defs): every def with `animClip: { name, lib }` gets
// the synthetic slot 'clip:<name>' → { clip, lib, defer: true } (ts 1) in the
// shared _UAL_CLIPS / _UAL_TS AND in every per-character copy of the table
// (the `lib:` overrides and the female defaults copy it at module load).
// Idempotent; data.js stampSpellSchema() calls it at boot and after every
// editor apply. Returns the number of slots newly registered. The renderer
// bakes a `clip:` slot on demand (three-renderer.js _libBakeSlotNow) — it is
// excluded from the bake key, so registering one never forces a re-bake.
function spellAnimLibName(i) {
  const u = EW_ANIM_LIB_URLS[i | 0];
  if (!u) return 'lib ' + (i | 0);
  return u.slice(u.lastIndexOf('/') + 1).replace(/\.glb$/i, '').replace(/_(Standard|Sniper)$/i, '');
}
function registerSpellAnimClips(defs) {
  let added = 0;
  const list = Array.isArray(defs) ? defs : (defs && typeof defs === 'object' ? Object.values(defs) : []);
  const tables = [];
  const seenT = new Set([_UAL_CLIPS]);
  tables.push({ lc: _UAL_CLIPS, lt: _UAL_TS });
  if (typeof RACE_MODELS_3D !== 'undefined') {
    for (const race in RACE_MODELS_3D) {
      const byG = RACE_MODELS_3D[race];
      if (!byG) continue;
      for (const g in byG) {
        const def = byG[g];
        if (!def || !def.libClips || typeof def.libClips !== 'object' || seenT.has(def.libClips)) continue;
        seenT.add(def.libClips);
        if (!def.libTimeScales) def.libTimeScales = {};
        tables.push({ lc: def.libClips, lt: def.libTimeScales });
      }
    }
  }
  for (const d of list) {
    const slot = spellAnimClipSlot(d);
    if (!slot || typeof d.animClip.name !== 'string') continue;
    const lib = Number.isInteger(d.animClip.lib) && d.animClip.lib >= 0 && d.animClip.lib < EW_ANIM_LIB_URLS.length ? d.animClip.lib : 0;
    let isNew = false;
    for (const t of tables) {
      if (t.lc[slot]) continue;
      t.lc[slot] = { clip: d.animClip.name, lib, defer: true };
      if (!t.lt[slot]) t.lt[slot] = 1;
      isNew = true;
    }
    if (isNew) added++;
  }
  return added;
}
// THE LOOK (2026-09-26): the spell editor's animation pickers + the engine read these
// (own block — the creator's export block below is sliced by character-creator.test.js).
if (typeof window !== 'undefined') {
  window.UAL_SLOTS = UAL_SLOTS;
  window.SPELL_ANIM_KINDS = SPELL_ANIM_KINDS;
  window.EW_ANIM_LIB_URLS = EW_ANIM_LIB_URLS;
  window.registerSpellAnimClips = registerSpellAnimClips;
  window.classifySpellAnimKind = classifySpellAnimKind;
  window.spellAnimClipSlot = spellAnimClipSlot;
  window.spellAnimLibName = spellAnimLibName;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHARACTER CREATOR — cosmetic data only (v2, 2026-09-11)
// Versioned, bounded and allowlisted before use (presets, saves, remote party
// data all pass through normalizeCharacterAppearance). No user asset URLs —
// every asset is picked by ID from the catalogues below and resolved to a
// fixed R2 path (Assets/characters/creator/, the user's 2026-09-11
// upload) with a same-origin fallback served by server.js.
//
// ASSETS (what the renderer builds from):
//  • BASES: Meshy_AI_human_body_base_mesh_<gender>_rigged.glb — the 30k-tri
//    UV-unwrapped bases, rigged by `node character-rig.js bodies` (repo
//    tooling: the old donor exports' 24-joint skin weights transferred onto
//    the new meshes). NEVER wire the unrigged …_<gender>.glb: no skeleton.
//  • HAIR: hair/hairNNN.glb — one static GLB per style, split from
//    HairPackPT1.glb by `node character-rig.js hair` (diffuse + normal
//    embedded, centred on the style's scalp cap). The renderer fits each
//    to the skull and skins it rigidly to the Head bone.
//  • FABRICS: clothingtextures/<key>_basecolor.png — 1024² tileables laid
//    over the garment shells through the base mesh's own UVs (`repeat` =
//    tiles per UV unit; ~1.7 m of body per UV unit).
//  • FACE: painted at runtime into a per-instance skin texture (eyes,
//    brows, lips, facial hair) — there is no authored face art yet.
// ═══════════════════════════════════════════════════════════════════════════
const EW_CHARACTER_ASSET_BASE = 'https://cdn.entropywars.net/Assets/characters/creator';   // R2 layout W5 (was Assets/characters/animations/charactercreation; the repo folder is still charactercreation/)
// Builder order. Labels are provisional (named from the mesh silhouettes) —
// rename freely; the id is what saves carry.
const EW_HAIR_STYLES = [
  { id: 'hair000', label: 'Spiked',          short: true },
  { id: 'hair003', label: 'Slicked back',    short: true },
  { id: 'hair006', label: 'Pixie',           short: true },
  { id: 'hair002', label: 'Swept fringe',    short: true },
  { id: 'hair009', label: 'Mohawk',          short: true },
  { id: 'hair008', label: 'Bun' },
  { id: 'hair012', label: 'Top knot' },
  { id: 'hair010', label: 'Ponytail' },
  { id: 'hair013', label: 'Tied back' },
  { id: 'hair007', label: 'Shag' },
  { id: 'hair004', label: 'Shoulder length' },
  { id: 'hair005', label: 'Layered bangs' },
  { id: 'hair001', label: 'Long straight' },
  { id: 'hair014', label: 'Wild mane' },
];
/* THE PACK HAIR (2026-11-01, mondo: "the clothes and hair in the asset packs ... I want those in the character creator
   too"): every MakeHuman community hair (makehuman_system_assets + hair01 / hair02 / hair03), baked by bake-mpfb.py
   --hair-styles onto the MPFB male (charactercreation/hair/mh/<id>.glb -> R2 Assets/characters/creator/hair/mh/).
   Worn and tinted like the pack above; each carries its own skull box (extras.ewHairRef). Labels = the asset names.
   Authors + licences: charactercreation/hair/mh/hair_styles.json (the credits list; 35 are CC-BY).
   `accent: true` (2026-11-01, THE SECOND HAIR COLOUR): the style has a separate piece painted in its own colour (a band, a
   tie, a scrunchie, beads, a flower, a ribbon) that keeps its colours or takes appearance.hairColor2 (three-renderer.js
   THE PACK HAIR COLOUR finds the piece). */
const EW_MH_HAIR_STYLES = [
  { id: "mh_afro01", label: "Afro 01", mh: true },
  { id: "mh_bob01", label: "Bob 01", mh: true },
  { id: "mh_bob02", label: "Bob 02", mh: true },
  { id: "mh_braid01", label: "Braid 01", mh: true },
  { id: "mh_long01", label: "Long 01", mh: true },
  { id: "mh_ponytail01", label: "Ponytail 01", mh: true },
  { id: "mh_short01", label: "Short 01", mh: true },
  { id: "mh_short02", label: "Short 02", mh: true },
  { id: "mh_short03", label: "Short 03", mh: true },
  { id: "mh_short04", label: "Short 04", mh: true },
  { id: "mh_cortu_shaggy_green_hair", label: "Shaggy green hair", mh: true },
  { id: "mh_cortu_short_messy_hair", label: "Short messy hair", mh: true },
  { id: "mh_cortu_straight_bangs", label: "Straight bangs", mh: true },
  { id: "mh_cortu_strawberry_cloud_hair", label: "Strawberry cloud hair", mh: true },
  { id: "mh_culturalibre_hair_01", label: "Hair 01", mh: true },
  { id: "mh_culturalibre_hair_02", label: "Hair 02", mh: true },
  { id: "mh_culturalibre_hair_05", label: "Hair 05", mh: true, strands: 1 },
  { id: "mh_culturalibre_hair_06", label: "Hair 06", mh: true, strands: 1 },
  { id: "mh_elvs_double_mh_braid", label: "Double mh braid", mh: true },
  { id: "mh_elvs_french_braid_variation", label: "French braid variation", mh: true },
  { id: "mh_elvs_reverse_french_braid_bun", label: "Reverse french braid bun", mh: true, accent: true },
  { id: "mh_elvs_unkempt_french_braid", label: "Unkempt french braid", mh: true },
  { id: "mh_faydaen_hair_1", label: "Hair 1", mh: true },
  { id: "mh_learning_anime_hair", label: "Anime hair", mh: true, strands: 0.7 },
  { id: "mh_littleright_bobcut_hair", label: "Bobcut hair", mh: true, strands: 1 },
  { id: "mh_o4saken_long01", label: "Long 01 (punkduck)", mh: true },
  { id: "mh_rehmanpolanski_hair_bun_brown", label: "Hair bun brown", mh: true, accent: true },
  { id: "mh_sonntag78_blond_with_headband", label: "Blond with headband", mh: true, accent: true },
  { id: "mh_sonntag78_junglebook_hair", label: "Junglebook hair", mh: true },
  { id: "mh_toigo_blunt_bob", label: "Blunt bob", mh: true },
  { id: "mh_toigo_blunt_bob_with_bangs", label: "Blunt bob with bangs", mh: true },
  { id: "mh_toigo_curled_under_bob", label: "Curled under bob", mh: true },
  { id: "mh_toigo_curled_under_bob_with_bangs", label: "Curled under bob with bangs", mh: true },
  { id: "mh_toigo_inverted_bob", label: "Inverted bob", mh: true },
  { id: "mh_toigo_inverted_bob_with_bangs", label: "Inverted bob with bangs", mh: true },
  { id: "mh_elvs_50s_updo", label: "50s updo", mh: true, accent: true },
  { id: "mh_elvs_adrienne_hair", label: "Adrienne hair", mh: true },
  { id: "mh_elvs_ashley_may_hair", label: "Ashley may hair", mh: true },
  { id: "mh_elvs_braid_bun", label: "Braid bun", mh: true },
  { id: "mh_elvs_braided_rows", label: "Braided rows", mh: true, accent: true },
  { id: "mh_elvs_daisy_hair", label: "Daisy hair", mh: true },
  { id: "mh_elvs_grump_hair", label: "Grump hair", mh: true },
  { id: "mh_elvs_hazel_hair", label: "Hazel hair", mh: true },
  { id: "mh_elvs_inverted_curly_bob", label: "Inverted curly bob", mh: true },
  { id: "mh_elvs_island_princess_hair", label: "Island princess hair", mh: true, accent: true },
  { id: "mh_elvs_katherine_hair", label: "Katherine hair", mh: true },
  { id: "mh_elvs_keylth_hair", label: "Keylth hair", mh: true, accent: true },
  { id: "mh_elvs_lady_hippy_hair", label: "Lady hippy hair", mh: true, accent: true },
  { id: "mh_elvs_lara_hair", label: "Lara hair", mh: true, accent: true },
  { id: "mh_elvs_maxwell_hair", label: "Maxwell hair", mh: true },
  { id: "mh_elvs_micky_afro", label: "Micky afro", mh: true },
  { id: "mh_elvs_short_daisy_hair", label: "Short daisy hair", mh: true },
  { id: "mh_elvs_short_side_do", label: "Short side do", mh: true },
  { id: "mh_elvs_that_80s_babe_hair", label: "That 80s babe hair", mh: true },
  { id: "mh_elvs_wavy_bob", label: "Wavy bob", mh: true, strands: 0.6 },
  { id: "mh_elvs_witchy_lil_bob", label: "Witchy lil bob", mh: true },
  { id: "mh_culturalibre_hair_11", label: "Hair 11", mh: true, accent: true, strands: 1 },
  { id: "mh_culturalibre_hair_12", label: "Hair 12", mh: true, strands: 1 },
  { id: "mh_culturalibre_hair_13", label: "Hair 13", mh: true, accent: true, strands: 1 },
  { id: "mh_culturalibre_hair_14", label: "Hair 14", mh: true, strands: 1 },
  { id: "mh_culturalibre_hair_17", label: "Hair 17", mh: true, accent: true },
  { id: "mh_culturalibre_hair_18", label: "Hair 18", mh: true },
  { id: "mh_grinsegold_wig_bow_tie", label: "Wig bow tie", mh: true },
  { id: "mh_grinsegold_wig_bun_blonde_braids", label: "Wig bun blonde braids", mh: true },
  { id: "mh_o4saken_chinesebob01", label: "Chinesebob 01", mh: true },
  { id: "mh_o4saken_curly01", label: "Curly 01", mh: true },
  { id: "mh_punkduck_alpha7_curly", label: "Alpha 7 curly", mh: true },
  { id: "mh_punkduck_alpha7_curly2", label: "Alpha 7 curly 2", mh: true },
  { id: "mh_punkduck_alpha7_long", label: "Alpha 7 long", mh: true },
  { id: "mh_punkduck_alpha7_long2", label: "Alpha 7 long 2", mh: true },
];
EW_HAIR_STYLES.push(...EW_MH_HAIR_STYLES);
/* THE PACK CLOTHES (2026-11-01, creator step 3; docs/notes/character-models-plan.md row 11): every MakeHuman community
   garment (the system assets + the 38 clothing packs), fitted and weighted by MPFB onto all five MPFB bodies (bake-mpfb.py
   --wear: one GLB per garment, the four other bodies' fits as morph targets, the skin under it listed as base-mesh vertices).
   An MPFB body only (appearance.wear = a list of ids); one pick per category except underwear / equipment / body parts.
   Credits: CREDITS.json "creator_wear". [id, label, category, z (MakeHuman's layer order)] */
const EW_MH_WEAR_CATS = [['tops', 'Tops'], ['bottoms', 'Bottoms'], ['skirts', 'Skirts'], ['dresses', 'Dresses'], ['suits', 'Suits'], ['shoes', 'Shoes'],
  ['hats', 'Hats'], ['glasses', 'Glasses'], ['masks', 'Masks'], ['gloves', 'Gloves'], ['underwear', 'Underwear'], ['equipment', 'Equipment'], ['bodyparts', 'Body parts'],
  ['heads', 'Creature heads']];   // (THE MESHY PIECES: one head at a time)
const EW_MH_WEAR_MULTI = ['underwear', 'equipment', 'bodyparts'];
// EW_MH_WEAR:BEGIN (generated from charactercreation/wear/wear.json)
const EW_MH_WEAR = [
  ["mhw_drednicolson_asymmetric_tunic_and_sash", "Asymmetric tunic and sash", "tops", 52],
  ["mhw_toigo_basic_tucked_t-shirt", "Basic tucked t-shirt", "tops", 50],
  ["mhw_toigo_bodice-style_top", "Bodice-style top", "tops", 50],
  ["mhw_toigo_camisole_top", "Camisole top", "tops", 50],
  ["mhw_mindfront_cardigan_long_open_front", "Cardigan long open front", "tops", 50],
  ["mhw_joepal_crude_t-shirt_female", "Crude t-shirt female", "tops", 50],
  ["mhw_elvs_crude_t-shirt_male", "Crude t-shirt male", "tops", 50],
  ["mhw_punkduck_deathnote_t-shirt", "Deathnote t-shirt", "tops", 61],
  ["mhw_elvs_disco_top_1_butterfly", "Disco top 1 butterfly", "tops", 70],
  ["mhw_elvs_disco_top2", "Disco top2", "tops", 55],
  ["mhw_toigo_fisherman_sweater", "Fisherman sweater", "tops", 50],
  ["mhw_punkduck_high_neck_crop_top", "High neck crop top", "tops", 50],
  ["mhw_elvs_hooded_sweat_jacket1", "Hooded sweat jacket1", "tops", 61],
  ["mhw_toigo_keyhole_tank_top", "Keyhole tank top", "tops", 50],
  ["mhw_mindfront_knitted_sweater_01", "Knitted sweater 01", "tops", 50],
  ["mhw_mindfront_knitted_sweater_02", "Knitted sweater 02", "tops", 50],
  ["mhw_punkduck_lace_up_blouse", "Lace up blouse", "tops", 60],
  ["mhw_elvs_ladies_tank1", "Ladies tank1", "tops", 50],
  ["mhw_elvs_lara_tank1", "Lara tank1", "tops", 50],
  ["mhw_mindfront_lusekofta", "Lusekofta", "tops", 50],
  ["mhw_elvs_male_athletic_tank1", "Male athletic tank1", "tops", 60],
  ["mhw_elvs_male_boho_top1", "Male boho top1", "tops", 50],
  ["mhw_elvs_male_logo_tshirt1", "Male logo tshirt1", "tops", 53],
  ["mhw_elvs_male_muscle_shirt1", "Male muscle shirt1", "tops", 47],
  ["mhw_namuhekam_male_polo_shirt", "Male polo shirt", "tops", 50],
  ["mhw_elvs_male_shirt_tie_tucked1", "Male shirt tie tucked1", "tops", 47],
  ["mhw_elvs_male_shirt_untucked_bd1", "Male shirt untucked bd1", "tops", 47],
  ["mhw_elvs_male_tankshirt1", "Male tankshirt1", "tops", 47],
  ["mhw_punkduck_off-shoulder_long-sleeve_top", "Off-shoulder long-sleeve top", "tops", 50],
  ["mhw_janexx_old_female_sweater", "Old female sweater", "tops", 53],
  ["mhw_punkduck_retro_top", "Retro top", "tops", 50],
  ["mhw_elvs_ruffle_sleeve_peasant_blouse_1", "Ruffle sleeve peasant blouse 1", "tops", 47],
  ["mhw_drednicolson_short-tail_camo_tee", "Short-tail camo tee", "tops", 47],
  ["mhw_punkduck_sleeveless_crop_top", "Sleeveless crop top", "tops", 50],
  ["mhw_punkduck_sleeveless_shirt", "Sleeveless shirt", "tops", 50],
  ["mhw_punkduck_spaghetti_strap_tank_top", "Spaghetti strap tank top", "tops", 50],
  ["mhw_ews_striped_shirt", "Striped shirt", "tops", 50],
  ["mhw_mindfront_tank_top_01", "Tank top 01", "tops", 47],
  ["mhw_punkduck_tube_top", "Tube top", "tops", 50],
  ["mhw_skalldyrssuppe_tube_top_funky_colors", "Tube top funky colors", "tops", 50],
  ["mhw_toigo_turtleneck_halter_top", "Turtleneck halter top", "tops", 50],
  ["mhw_punkduck_v_neck_top", "V neck top", "tops", 50],
  ["mhw_cortu_cargo_pants", "Cargo pants", "bottoms", 50],
  ["mhw_elvs_disco_pants_double_ruffles", "Disco pants double ruffles", "bottoms", 50],
  ["mhw_elvs_disco_pants_single_ruffles", "Disco pants single ruffles", "bottoms", 50],
  ["mhw_elvs_disco_pants_skinny", "Disco pants skinny", "bottoms", 50],
  ["mhw_punkduck_female_short_jeans", "Female short jeans", "bottoms", 50],
  ["mhw_punkduck_female_tight_jeans", "Female tight jeans", "bottoms", 51],
  ["mhw_mindfront_female_trousers_1", "Female trousers 1", "bottoms", 47],
  ["mhw_elvs_gored_elephant_pants", "Gored elephant pants", "bottoms", 50],
  ["mhw_toigo_harem_pants", "Harem pants", "bottoms", 50],
  ["mhw_elvs_jeans_bootcut", "Jeans bootcut", "bottoms", 50],
  ["mhw_cortu_jeans_shorts", "Jeans shorts", "bottoms", 50],
  ["mhw_elvs_jeans_straight_leg", "Jeans straight leg", "bottoms", 47],
  ["mhw_punkduck_male_classic_jeans", "Male classic jeans", "bottoms", 52],
  ["mhw_elvs_male_swim_shorts1", "Male swim shorts1", "bottoms", 50],
  ["mhw_mindfront_male_swimming_trunks_01", "Male swimming trunks 01", "bottoms", 47],
  ["mhw_mindfront_male_swimming_trunks_02", "Male swimming trunks 02", "bottoms", 47],
  ["mhw_mindfront_male_swimming_trunks_03", "Male swimming trunks 03", "bottoms", 39],
  ["mhw_elvs_male_trouser", "Male trouser", "bottoms", 47],
  ["mhw_elvs_male_trouser_short_1", "Male trouser short 1", "bottoms", 47],
  ["mhw_elvs_male_trouser_short_2", "Male trouser short 2", "bottoms", 47],
  ["mhw_elvs_male_trouser_with_chain", "Male trouser with chain", "bottoms", 47],
  ["mhw_mindfront_male_trousers_1", "Male trousers 1", "bottoms", 47],
  ["mhw_mindfront_male_trousers_2", "Male trousers 2", "bottoms", 47],
  ["mhw_elvs_retro_girly_shorts1", "Retro girly shorts1", "bottoms", 53],
  ["mhw_toigo_wool_pants", "Wool pants", "bottoms", 50],
  ["mhw_elvs_asymmetrical_skirt", "Asymmetrical skirt", "skirts", 47],
  ["mhw_punkduck_black_mini_skirt", "Black mini skirt", "skirts", 50],
  ["mhw_elvs_disco_mini_skirt", "Disco mini skirt", "skirts", 50],
  ["mhw_elvs_gored_midi_skirt", "Gored midi skirt", "skirts", 55],
  ["mhw_callharvey3d_harvey_pskirt01", "Harvey pskirt01", "skirts", 50],
  ["mhw_punkduck_jeans_skirt", "Jeans skirt", "skirts", 50],
  ["mhw_toigo_long_full_skirt", "Long full skirt", "skirts", 50],
  ["mhw_mtknife_low_mini_skirt", "Low mini skirt", "skirts", 50],
  ["mhw_sonicteam998_maria_skirt", "Maria skirt", "skirts", 50],
  ["mhw_scsouza_mini_denin_skirt", "Mini denin skirt", "skirts", 50],
  ["mhw_frankyaye_mini_skirt_01", "Mini skirt 01", "skirts", 50],
  ["mhw_frankyaye_mini_skirt_02", "Mini skirt 02", "skirts", 50],
  ["mhw_elvs_pencil_skirt", "Pencil skirt", "skirts", 50],
  ["mhw_mtknife_pleated_mini_skirt", "Pleated mini skirt", "skirts", 50],
  ["mhw_elvs_pleated_plaid_mini_skirt", "Pleated plaid mini skirt", "skirts", 47],
  ["mhw_punkduck_retro_polka_dot_skirt", "Retro polka dot skirt", "skirts", 50],
  ["mhw_punkduck_skirt_native_american_fashion", "Skirt native american fashion", "skirts", 50],
  ["mhw_toigo_skirt_with_lace_ruffle", "Skirt with lace ruffle", "skirts", 50],
  ["mhw_toigo_tiered_mini_skirt", "Tiered mini skirt", "skirts", 50],
  ["mhw_toigo_tiered_skirt", "Tiered skirt", "skirts", 50],
  ["mhw_mindfront_ballet_dress_the_swan", "Ballet dress the swan", "dresses", 47],
  ["mhw_punkduck_black_cocktail_dress", "Black cocktail dress", "dresses", 50],
  ["mhw_toigo_bodice_dress_with_lace_ruffle_skirt", "Bodice dress with lace ruffle skirt", "dresses", 50],
  ["mhw_toigo_camisole_dress_with_full_skirt", "Camisole dress with full skirt", "dresses", 50],
  ["mhw_elvs_crochet_baby_doll", "Crochet baby doll", "dresses", 53],
  ["mhw_toigo_cut_out_dress", "Cut out dress", "dresses", 50],
  ["mhw_elvs_double_handkerchief_halter_dress", "Double handkerchief halter dress", "dresses", 47],
  ["mhw_toigo_dress_with_tiered_skirt", "Dress with tiered skirt", "dresses", 50],
  ["mhw_punkduck_evening_gown", "Evening gown", "dresses", 50],
  ["mhw_mindfront_f_dress_01", "F dress 01", "dresses", 47],
  ["mhw_mindfront_f_dress_02", "F dress 02", "dresses", 47],
  ["mhw_mindfront_f_dress_03", "F dress 03", "dresses", 50],
  ["mhw_mindfront_f_dress_04", "F dress 04", "dresses", 47],
  ["mhw_mindfront_f_dress_05", "F dress 05", "dresses", 50],
  ["mhw_mindfront_f_dress_06", "F dress 06", "dresses", 47],
  ["mhw_mindfront_f_dress_07", "F dress 07", "dresses", 50],
  ["mhw_mindfront_f_dress_08", "F dress 08", "dresses", 47],
  ["mhw_mindfront_f_dress_09", "F dress 09", "dresses", 47],
  ["mhw_mindfront_f_dress_10", "F dress 10", "dresses", 47],
  ["mhw_mindfront_f_dress_11", "F dress 11", "dresses", 47],
  ["mhw_elvs_fashion_stylized_qipoa", "Fashion stylized qipoa", "dresses", 53],
  ["mhw_punkduck_figure_skating_dress", "Figure skating dress", "dresses", 50],
  ["mhw_aethelraed_flapper_dress", "Flapper dress", "dresses", 50],
  ["mhw_elvs_frilled_party_dress", "Frilled party dress", "dresses", 50],
  ["mhw_elvs_fringe_hippy_dress", "Fringe hippy dress", "dresses", 35],
  ["mhw_elvs_fringe_leather_dress", "Fringe leather dress", "dresses", 52],
  ["mhw_elvs_fringe_off_shoulder_dress", "Fringe off shoulder dress", "dresses", 50],
  ["mhw_elvs_goddess_dress1", "Goddess dress1", "dresses", 50],
  ["mhw_elvs_goddess_dress2", "Goddess dress2", "dresses", 55],
  ["mhw_elvs_goddess_dress3", "Goddess dress3", "dresses", 55],
  ["mhw_elvs_goddess_dress4", "Goddess dress4", "dresses", 50],
  ["mhw_elvs_goddess_dress5", "Goddess dress5", "dresses", 55],
  ["mhw_elvs_goddess_dress6", "Goddess dress6", "dresses", 55],
  ["mhw_elvs_goddess_dress7", "Goddess dress7", "dresses", 55],
  ["mhw_elvs_goddess_dress8", "Goddess dress8", "dresses", 55],
  ["mhw_toigo_halter_dress_knee_length", "Halter dress knee length", "dresses", 50],
  ["mhw_elvs_halter_dress_knee_length", "Halter dress knee length", "dresses", 47],
  ["mhw_elvs_halter_dress_long", "Halter dress long", "dresses", 47],
  ["mhw_toigo_halter_dress_midi", "Halter dress midi", "dresses", 50],
  ["mhw_elvs_halter_dress_mini", "Halter dress mini", "dresses", 47],
  ["mhw_elvs_halter_dress_tiered", "Halter dress tiered", "dresses", 47],
  ["mhw_toigo_halter_dress_with_fluted_skirt", "Halter dress with fluted skirt", "dresses", 50],
  ["mhw_toigo_keyhole_neck_dress", "Keyhole neck dress", "dresses", 50],
  ["mhw_mindfront_kimono", "Kimono", "dresses", 61],
  ["mhw_elvs_ladies_apron", "Ladies apron", "dresses", 61],
  ["mhw_punkduck_medieval_dress", "Medieval dress", "dresses", 50],
  ["mhw_punkduck_middle_length_qipao", "Middle length qipao", "dresses", 50],
  ["mhw_wdg_mycenaean_tunic", "Mycenaean tunic", "dresses", 50],
  ["mhw_elvs_sarong_cover_up", "Sarong cover up", "dresses", 47],
  ["mhw_toigo_shift_dress", "Shift dress", "dresses", 50],
  ["mhw_elvs_simple_60s_dress", "Simple 60s dress", "dresses", 53],
  ["mhw_elvs_simple_fashion_dress_1", "Simple fashion dress 1", "dresses", 53],
  ["mhw_elvs_simple_fashion_dress_2", "Simple fashion dress 2", "dresses", 50],
  ["mhw_toigo_strapless_ruffle_top_dress", "Strapless ruffle top dress", "dresses", 50],
  ["mhw_punkduck_tube_dress", "Tube dress", "dresses", 50],
  ["mhw_punkduck_winter_coat", "Winter coat", "dresses", 50],
  ["mhw_joachip_cyborg_suit", "Cyborg suit", "suits", 102],
  ["mhw_punkduck_diver_suit", "Diver suit", "suits", 38],
  ["mhw_elvs_emt_uniform_jacket_female", "Emt uniform jacket female", "suits", 54],
  ["mhw_elvs_emt_uniform_jacket_male", "Emt uniform jacket male", "suits", 54],
  ["mhw_elvs_emt_uniform_pants_female", "Emt uniform pants female", "suits", 50],
  ["mhw_elvs_emt_uniform_pants_male", "Emt uniform pants male", "suits", 50],
  ["mhw_mindfront_f_ninja", "F ninja", "suits", 50],
  ["mhw_female_casualsuit01", "Female casualsuit01", "suits", 50],
  ["mhw_female_casualsuit02", "Female casualsuit02", "suits", 50],
  ["mhw_toigo_female_double-breasted_suit", "Female double-breasted suit", "suits", 50],
  ["mhw_female_elegantsuit01", "Female elegantsuit01", "suits", 50],
  ["mhw_female_sportsuit01", "Female sportsuit01", "suits", 50],
  ["mhw_toigo_female_suit", "Female suit", "suits", 50],
  ["mhw_toigo_female_suit_2", "Female suit 2", "suits", 50],
  ["mhw_thegreatengineer_galactic_warrior_uniform", "Galactic warrior uniform", "suits", 50],
  ["mhw_elvs_halter_style_pantsuit1", "Halter style pantsuit1", "suits", 50],
  ["mhw_culturalibre_hero_suit_1", "Hero suit 1", "suits", 30],
  ["mhw_culturalibre_hero_suit_2", "Hero suit 2", "suits", 30],
  ["mhw_culturalibre_hero_suit_3", "Hero suit 3", "suits", 30],
  ["mhw_culturalibre_heroine_suit_2", "Heroine suit 2", "suits", 30],
  ["mhw_mindfront_m_suit_01", "M suit 01", "suits", 47],
  ["mhw_male_casualsuit01", "Male casualsuit01", "suits", 50],
  ["mhw_male_casualsuit02", "Male casualsuit02", "suits", 50],
  ["mhw_male_casualsuit03", "Male casualsuit03", "suits", 50],
  ["mhw_male_casualsuit04", "Male casualsuit04", "suits", 50],
  ["mhw_male_casualsuit05", "Male casualsuit05", "suits", 50],
  ["mhw_male_casualsuit06", "Male casualsuit06", "suits", 50],
  ["mhw_elvs_male_coveralls_1", "Male coveralls 1", "suits", 55],
  ["mhw_toigo_male_double-breasted_suit", "Male double-breasted suit", "suits", 50],
  ["mhw_male_elegantsuit01", "Male elegantsuit01", "suits", 50],
  ["mhw_toigo_male_suit_3", "Male suit 3", "suits", 50],
  ["mhw_toigo_male_suit_tie_and_jacket", "Male suit tie and jacket", "suits", 50],
  ["mhw_male_worksuit01", "Male worksuit01", "suits", 50],
  ["mhw_grinsegold_mars_suit", "Mars suit", "suits", 50],
  ["mhw_matcreator_mc-bodysuit-2021", "Mc-bodysuit-2021", "suits", 50],
  ["mhw_matcreator_mc-scifi-armor_guardian", "Mc-scifi-armor guardian", "suits", 50],
  ["mhw_matcreator_mc-scifi-armor_helios", "Mc-scifi-armor helios", "suits", 50],
  ["mhw_matcreator_mc-scifi-armor_jupiter7", "Mc-scifi-armor jupiter7", "suits", 50],
  ["mhw_matcreator_mc-skinsuit_2022", "Mc-skinsuit 2022", "suits", 5],
  ["mhw_donitz_monk_robe", "Monk robe", "suits", 60],
  ["mhw_donitz_monk_robe_hood", "Monk robe hood", "suits", 63],
  ["mhw_donitz_monk_robe_hood_down", "Monk robe hood down", "suits", 63],
  ["mhw_donitz_monk_robe_hood_off", "Monk robe hood off", "suits", 63],
  ["mhw_elvs_racing_fire_suit_female1", "Racing fire suit female1", "suits", 50],
  ["mhw_elvs_racing_fire_suit_male1", "Racing fire suit male1", "suits", 50],
  ["mhw_punkduck_short_bodysuit_female", "Short bodysuit female", "suits", 60],
  ["mhw_tiomegamanx_skintight_body_suit_female", "Skintight body suit female", "suits", 50],
  ["mhw_slayer227_spider-gwen", "Spider-gwen", "suits", 50],
  ["mhw_elvs_sporty_tracksuit_hoodie_dress1", "Sporty tracksuit hoodie dress1", "suits", 50],
  ["mhw_toigo_suit_with_dinner_jacket", "Suit with dinner jacket", "suits", 50],
  ["mhw_toigo_suit_with_jacket_and_bowtie", "Suit with jacket and bowtie", "suits", 50],
  ["mhw_punkduck_tennis_dress", "Tennis dress", "suits", 50],
  ["mhw_green_tomato_rei_ayanami", "Tomato rei ayanami", "suits", 48],
  ["mhw_green_tomato_yoko_tsuno", "Tomato yoko tsuno", "suits", 45],
  ["mhw_punkduck_triathlon_suit_female", "Triathlon suit female", "suits", 50],
  ["mhw_rehmanpolanski_viking_boots", "Viking boots", "suits", 50],
  ["mhw_rehmanpolanski_viking_pants", "Viking pants", "suits", 50],
  ["mhw_rehmanpolanski_viking_tunic", "Viking tunic", "suits", 50],
  ["mhw_punkduck_wetsuit", "Wetsuit", "suits", 60],
  ["mhw_maciekg_wizard_robe", "Wizard robe", "suits", 50],
  ["mhw_toigo_ankle_boots_female", "Ankle boots female", "shoes", 50],
  ["mhw_toigo_ankle_boots_male", "Ankle boots male", "shoes", 50],
  ["mhw_toigo_ballet_flats", "Ballet flats", "shoes", 50],
  ["mhw_toigo_ballet_flats_with_bows", "Ballet flats with bows", "shoes", 50],
  ["mhw_toigo_ballet_flats_with_flowers", "Ballet flats with flowers", "shoes", 50],
  ["mhw_dressupdoc_balletflat1", "Balletflat1", "shoes", 50],
  ["mhw_elvs_basic_felt_elf_shoes", "Basic felt elf shoes", "shoes", 50],
  ["mhw_elvs_caesar_sandals1", "Caesar sandals1", "shoes", 57],
  ["mhw_punkduck_comfortable_sneakers", "Comfortable sneakers", "shoes", 50],
  ["mhw_punkduck_cycling_shoes", "Cycling shoes", "shoes", 50],
  ["mhw_dressupdoc_domsjeans1", "Domsjeans1", "shoes", 50],
  ["mhw_punkduck_female_half-boots", "Female half-boots", "shoes", 52],
  ["mhw_punkduck_female_knee_boots", "Female knee boots", "shoes", 53],
  ["mhw_grinsegold_female_pirate_boots", "Female pirate boots", "shoes", 50],
  ["mhw_toigo_flats", "Flats", "shoes", 50],
  ["mhw_elvs_flatshoe_bow1", "Flatshoe bow1", "shoes", 57],
  ["mhw_elvs_flatshoe_buckle_1", "Flatshoe buckle 1", "shoes", 57],
  ["mhw_elvs_flatshoe_gemmed1", "Flatshoe gemmed1", "shoes", 57],
  ["mhw_elvs_flatshoe_plain1", "Flatshoe plain1", "shoes", 57],
  ["mhw_elvs_flatshoe_pointy1", "Flatshoe pointy1", "shoes", 57],
  ["mhw_cortu_floppy_overknee_shoes", "Floppy overknee shoes", "shoes", 50],
  ["mhw_scailman_gogo_platform_boots", "Gogo platform boots", "shoes", 50],
  ["mhw_callharvey3d_harvey_saddleshoes1", "Harvey saddleshoes1", "shoes", 50],
  ["mhw_culturalibre_hero_boots_1", "Hero boots 1", "shoes", 50],
  ["mhw_culturalibre_hero_boots_2", "Hero boots 2", "shoes", 50],
  ["mhw_culturalibre_hero_boots_3", "Hero boots 3", "shoes", 50],
  ["mhw_culturalibre_hero_boots_4", "Hero boots 4", "shoes", 50],
  ["mhw_culturalibre_hero_boots_5", "Hero boots 5", "shoes", 70],
  ["mhw_culturalibre_heroine_boots_1", "Heroine boots 1", "shoes", 50],
  ["mhw_culturalibre_heroine_boots_2", "Heroine boots 2", "shoes", 50],
  ["mhw_culturalibre_heroine_boots_3", "Heroine boots 3", "shoes", 50],
  ["mhw_culturalibre_heroine_boots_4", "Heroine boots 4", "shoes", 50],
  ["mhw_punkduck_kill_bill_shoes", "Kill bill shoes", "shoes", 50],
  ["mhw_elvs_knee_high_heel_boots1", "Knee high heel boots1", "shoes", 50],
  ["mhw_maciekg_leather_boots", "Leather boots", "shoes", 50],
  ["mhw_scailman_low-heeled_boots", "Low-heeled boots", "shoes", 50],
  ["mhw_culturalibre_male_boots", "Male boots", "shoes", 70],
  ["mhw_elvs_male_flip_flop_sandals1", "Male flip flop sandals1", "shoes", 57],
  ["mhw_dressupdoc_maryjane1", "Maryjane1", "shoes", 50],
  ["mhw_punkduck_medieval_boots", "Medieval boots", "shoes", 49],
  ["mhw_toigo_mj_cloth_shoes", "Mj cloth shoes", "shoes", 50],
  ["mhw_punkduck_riding_boots", "Riding boots", "shoes", 45],
  ["mhw_punkduck_running_shoes_01", "Running shoes 01", "shoes", 50],
  ["mhw_dressupdoc_sandals1", "Sandals1", "shoes", 50],
  ["mhw_scailman_semitransparent_water_boots", "Semitransparent water boots", "shoes", 50],
  ["mhw_mindfront_shoes_biker_boots_female", "Shoes biker boots female", "shoes", 57],
  ["mhw_mindfront_shoes_biker_boots_male", "Shoes biker boots male", "shoes", 57],
  ["mhw_mindfront_shoes_monk_strap_female", "Shoes monk strap female", "shoes", 43],
  ["mhw_mindfront_shoes_monk_strap_male", "Shoes monk strap male", "shoes", 43],
  ["mhw_mindfront_shoes_oxford_female", "Shoes oxford female", "shoes", 43],
  ["mhw_mindfront_shoes_oxford_male", "Shoes oxford male", "shoes", 43],
  ["mhw_shoes01", "Shoes01", "shoes", 5],
  ["mhw_shoes02", "Shoes02", "shoes", 5],
  ["mhw_shoes03", "Shoes03", "shoes", 5],
  ["mhw_shoes04", "Shoes04", "shoes", 5],
  ["mhw_shoes05", "Shoes05", "shoes", 5],
  ["mhw_shoes06", "Shoes06", "shoes", 5],
  ["mhw_culturalibre_sneakers", "Sneakers", "shoes", 30],
  ["mhw_toigo_stiletto_booties", "Stiletto booties", "shoes", 50],
  ["mhw_cortu_t-bar", "T-bar", "shoes", 50],
  ["mhw_punkduck_tennis_shoes", "Tennis shoes", "shoes", 45],
  ["mhw_madmanny_tight_leather_boots", "Tight leather boots", "shoes", 43],
  ["mhw_elvs_wedge_tall_boots1", "Wedge tall boots1", "shoes", 57],
  ["mhw_punkduck_winter_boots", "Winter boots", "shoes", 50],
  ["mhw_elvs_zombie_killer_sneakers", "Zombie killer sneakers", "shoes", 50],
  ["mhw_jujube_bag_on_head", "Bag on head", "hats", 50],
  ["mhw_elvs_basic_brave_feathers1", "Basic brave feathers1", "hats", 50],
  ["mhw_punkduck_bicycle_helmet_time_trial_aero_helmet", "Bicycle helmet time trial aero helmet", "hats", 50],
  ["mhw_javherre_casco_caballero_templario_templar_knight_helmet", "Casco caballero templario templar knight helmet", "hats", 50],
  ["mhw_elvs_charity_veil1", "Charity veil1", "hats", 55],
  ["mhw_culturalibre_cl_bowler_hat", "Cl bowler hat", "hats", 50],
  ["mhw_culturalibre_cl_don_quixote_hat", "Cl don quixote hat", "hats", 70],
  ["mhw_grinsegold_corinthian_helmet", "Corinthian helmet", "hats", 50],
  ["mhw_elvs_dirty_lil_maid_bonnet", "Dirty lil maid bonnet", "hats", 69],
  ["mhw_fedora_cocked", "Fedora cocked", "hats", 50],
  ["mhw_fedora01", "Fedora01", "hats", 50],
  ["mhw_mindfront_fishing_hat_01", "Fishing hat 01", "hats", 57],
  ["mhw_mindfront_helmet_kz45", "Helmet kz45", "hats", 69],
  ["mhw_maciekg_horned_helmet", "Horned helmet", "hats", 50],
  ["mhw_mindfront_knitted_hat_01", "Knitted hat 01", "hats", 61],
  ["mhw_maciekg_leather_helmet", "Leather helmet", "hats", 50],
  ["mhw_mrgreaterthan_m1_helmet", "M1 helmet", "hats", 50],
  ["mhw_jaldmic_m1951_72", "M1951 72", "hats", 50],
  ["mhw_toigo_maga_hat", "Maga hat", "hats", 50],
  ["mhw_elvs_male_flat_cap1", "Male flat cap1", "hats", 61],
  ["mhw_elvs_male_trilby_hat", "Male trilby hat", "hats", 50],
  ["mhw_culturalibre_motorcycle_helmet", "Motorcycle helmet", "hats", 50],
  ["mhw_jujube_newsboy_cap", "Newsboy cap", "hats", 50],
  ["mhw_mindfront_patrol_cap", "Patrol cap", "hats", 61],
  ["mhw_drednicolson_pith_helmet", "Pith helmet", "hats", 64],
  ["mhw_punkduck_riding_helmet", "Riding helmet", "hats", 50],
  ["mhw_elvs_santa_hat", "Santa hat", "hats", 50],
  ["mhw_mindfront_sherpa_hat", "Sherpa hat", "hats", 61],
  ["mhw_culturalibre_skull_helmet", "Skull helmet", "hats", 50],
  ["mhw_elvs_slouchy_beanie1", "Slouchy beanie1", "hats", 69],
  ["mhw_punkduck_sun_visor_sports_visor", "Sun visor sports visor", "hats", 60],
  ["mhw_punkduck_swim_cap", "Swim cap", "hats", 50],
  ["mhw_elvs_tophat1", "Tophat1", "hats", 50],
  ["mhw_grinsegold_uncle_joshis_hat", "Uncle joshis hat", "hats", 50],
  ["mhw_elvs_unisex_chef_hat_1", "Unisex chef hat 1", "hats", 50],
  ["mhw_aethelraed_unraed_cloche_hat", "Unraed cloche hat", "hats", 50],
  ["mhw_culturalibre_warrior_helmet", "Warrior helmet", "hats", 50],
  ["mhw_culturalibre_warrior_helmet_02", "Warrior helmet 02", "hats", 50],
  ["mhw_elvs_witchy_hallows_hat1", "Witchy hallows hat1", "hats", 50],
  ["mhw_maciekg_wizard_hat", "Wizard hat", "hats", 50],
  ["mhw_joepal_xmas_cap", "Xmas cap", "hats", 50],
  ["mhw_ews_3d_glasses", "3d glasses", "glasses", 50],
  ["mhw_kwnet_at_optical_glasses", "At optical glasses", "glasses", 50],
  ["mhw_elvs_covid_goggles1", "Covid goggles1", "glasses", 60],
  ["mhw_culturalibre_doc_ock_glasses", "Doc ock glasses", "glasses", 50],
  ["mhw_frankyaye_glasses_library_male", "Glasses library male", "glasses", 50],
  ["mhw_punkduck_glasses_modern_form", "Glasses modern form", "glasses", 50],
  ["mhw_punkduck_goggles", "Goggles", "glasses", 60],
  ["mhw_elvs_ladies_sunglass1", "Ladies sunglass1", "glasses", 50],
  ["mhw_toigo_round_glasses_leopard", "Round glasses leopard", "glasses", 69],
  ["mhw_spamrakuen_sagerfrogs_glasses_01", "Sagerfrogs glasses 01", "glasses", 50],
  ["mhw_spamrakuen_sagerfrogs_glasses_02", "Sagerfrogs glasses 02", "glasses", 50],
  ["mhw_spamrakuen_sagerfrogs_glasses_03", "Sagerfrogs glasses 03", "glasses", 50],
  ["mhw_spamrakuen_sagerfrogs_glasses_04", "Sagerfrogs glasses 04", "glasses", 50],
  ["mhw_punkduck_sport-sunglasses", "Sport-sunglasses", "glasses", 50],
  ["mhw_spamrakuen_tbm_glasses_frames_01", "Tbm glasses frames 01", "glasses", 50],
  ["mhw_culturalibre_bandana_mask", "Bandana mask", "masks", 50],
  ["mhw_elvs_covid_mask", "Covid mask", "masks", 50],
  ["mhw_gredal_gas_mask", "Gas mask", "masks", 50],
  ["mhw_culturalibre_hero_mask_1", "Hero mask 1", "masks", 50],
  ["mhw_culturalibre_hero_mask_2", "Hero mask 2", "masks", 50],
  ["mhw_culturalibre_hero_mask_3", "Hero mask 3", "masks", 50],
  ["mhw_culturalibre_hero_mask_4", "Hero mask 4", "masks", 50],
  ["mhw_culturalibre_hero_mask_5", "Hero mask 5", "masks", 50],
  ["mhw_culturalibre_hero-heroine_hood_1", "Hero-heroine hood 1", "masks", 50],
  ["mhw_culturalibre_hero-heroine_hood_2", "Hero-heroine hood 2", "masks", 20],
  ["mhw_culturalibre_heroine_mask_1", "Heroine mask 1", "masks", 30],
  ["mhw_joepal_medical_mouth_protection", "Medical mouth protection", "masks", 50],
  ["mhw_elvs_plague_doctor_mask", "Plague doctor mask", "masks", 50],
  ["mhw_toigo_gloves_long", "Gloves long", "gloves", 50],
  ["mhw_toigo_gloves_medium", "Gloves medium", "gloves", 50],
  ["mhw_toigo_gloves_short", "Gloves short", "gloves", 50],
  ["mhw_culturalibre_hero-heroine_gloves_1", "Hero-heroine gloves 1", "gloves", 50],
  ["mhw_culturalibre_hero-heroine_gloves_2", "Hero-heroine gloves 2", "gloves", 50],
  ["mhw_culturalibre_hero-heroine_gloves_3", "Hero-heroine gloves 3", "gloves", 50],
  ["mhw_culturalibre_hero-heroine_gloves_4", "Hero-heroine gloves 4", "gloves", 50],
  ["mhw_culturalibre_hero-heroine_gloves_5", "Hero-heroine gloves 5", "gloves", 50],
  ["mhw_learning_mma_fighting_gloves", "Mma fighting gloves", "gloves", 50],
  ["mhw_marco_105_armsleeve02", "105 armsleeve02", "underwear", 40],
  ["mhw_marco_105_stocking01", "105 stocking01", "underwear", 39],
  ["mhw_marco_105_stocking02", "105 stocking02", "underwear", 40],
  ["mhw_elvs_all_tied_up_bikini", "All tied up bikini", "underwear", 31],
  ["mhw_v0rt3x_armsleeves_black_fishnet_large", "Armsleeves black fishnet large", "underwear", 39],
  ["mhw_v0rt3x_armsleeves_black_fishnet_medium", "Armsleeves black fishnet medium", "underwear", 39],
  ["mhw_v0rt3x_armsleeves_black_fishnet_small", "Armsleeves black fishnet small", "underwear", 39],
  ["mhw_v0rt3x_armsleeves_white_fishnet_large", "Armsleeves white fishnet large", "underwear", 39],
  ["mhw_v0rt3x_armsleeves_white_fishnet_medium", "Armsleeves white fishnet medium", "underwear", 39],
  ["mhw_v0rt3x_armsleeves_white_fishnet_small", "Armsleeves white fishnet small", "underwear", 39],
  ["mhw_kwnet_at_pantyhose01", "At pantyhose01", "underwear", 50],
  ["mhw_punkduck_babydoll", "Babydoll", "underwear", 50],
  ["mhw_punkduck_bandeau_bikini_bra", "Bandeau bikini bra", "underwear", 50],
  ["mhw_punkduck_bandeau_bikini_slip", "Bandeau bikini slip", "underwear", 50],
  ["mhw_punkduck_bandeau_bra", "Bandeau bra", "underwear", 50],
  ["mhw_elvs_bandeau_swimwear_top_1", "Bandeau swimwear top 1", "underwear", 47],
  ["mhw_mindfront_bikini_01", "Bikini 01", "underwear", 39],
  ["mhw_punkduck_bikini02_bra", "Bikini02 bra", "underwear", 50],
  ["mhw_punkduck_bikini02_slip", "Bikini02 slip", "underwear", 50],
  ["mhw_elvs_bow_bottom_panty", "Bow bottom panty", "underwear", 47],
  ["mhw_elvs_bow_front_bra", "Bow front bra", "underwear", 47],
  ["mhw_punkduck_brazilian_bikini_bra", "Brazilian bikini bra", "underwear", 50],
  ["mhw_punkduck_brazilian_bikini_slip", "Brazilian bikini slip", "underwear", 50],
  ["mhw_elvs_camisole1", "Camisole1", "underwear", 43],
  ["mhw_elvs_crude_bootyshorts", "Crude bootyshorts", "underwear", 47],
  ["mhw_joepal_crude_high_socks", "Crude high socks", "underwear", 50],
  ["mhw_joepal_crude_low_socks", "Crude low socks", "underwear", 50],
  ["mhw_mindfront_f_one-piece_swimsuit_01", "F one-piece swimsuit 01", "underwear", 39],
  ["mhw_wolgade_female_panties_01", "Female panties 01", "underwear", 39],
  ["mhw_punkduck_female_strapless_bodysuit", "Female strapless bodysuit", "underwear", 50],
  ["mhw_wolgade_female_top_01", "Female top 01", "underwear", 39],
  ["mhw_punkduck_french_lingerie_bra", "French lingerie bra", "underwear", 50],
  ["mhw_punkduck_french_lingerie_mini_briefs", "French lingerie mini briefs", "underwear", 50],
  ["mhw_punkduck_french_lingerie_stockings", "French lingerie stockings", "underwear", 10],
  ["mhw_punkduck_french_lingerie_suspender_belt", "French lingerie suspender belt", "underwear", 50],
  ["mhw_punkduck_french_lingerie_thong", "French lingerie thong", "underwear", 50],
  ["mhw_punkduck_frill_bikini_bottom", "Frill bikini bottom", "underwear", 50],
  ["mhw_punkduck_frill_bikini_top", "Frill bikini top", "underwear", 50],
  ["mhw_punkduck_halterneck_romper", "Halterneck romper", "underwear", 50],
  ["mhw_toigo_lace_frill_socks", "Lace frill socks", "underwear", 57],
  ["mhw_elvs_lace_panty", "Lace panty", "underwear", 39],
  ["mhw_toigo_leg_warmer_socks", "Leg warmer socks", "underwear", 43],
  ["mhw_punkduck_one_piece_bikini01", "One piece bikini01", "underwear", 33],
  ["mhw_joepal_plain_bra", "Plain bra", "underwear", 50],
  ["mhw_punkduck_shapewear", "Shapewear", "underwear", 50],
  ["mhw_punkduck_sport_bra", "Sport bra", "underwear", 50],
  ["mhw_punkduck_sport_briefs", "Sport briefs", "underwear", 50],
  ["mhw_jaldmic_stockings", "Stockings", "underwear", 50],
  ["mhw_v0rt3x_stockings_black_fishnet_large", "Stockings black fishnet large", "underwear", 43],
  ["mhw_v0rt3x_stockings_black_fishnet_medium", "Stockings black fishnet medium", "underwear", 43],
  ["mhw_v0rt3x_stockings_black_fishnet_small", "Stockings black fishnet small", "underwear", 43],
  ["mhw_v0rt3x_stockings_white_fishnet_large", "Stockings white fishnet large", "underwear", 43],
  ["mhw_v0rt3x_stockings_white_fishnet_medium", "Stockings white fishnet medium", "underwear", 43],
  ["mhw_v0rt3x_stockings_white_fishnet_small", "Stockings white fishnet small", "underwear", 43],
  ["mhw_punkduck_strappy_lace_thong", "Strappy lace thong", "underwear", 34],
  ["mhw_punkduck_string_2", "String 2", "underwear", 50],
  ["mhw_punkduck_string_4", "String 4", "underwear", 50],
  ["mhw_punkduck_string_5", "String 5", "underwear", 50],
  ["mhw_elvs_swimwear_micro_shorts", "Swimwear micro shorts", "underwear", 47],
  ["mhw_punkduck_teddy_erotic_lingerie", "Teddy erotic lingerie", "underwear", 50],
  ["mhw_punkduck_transparent_bra", "Transparent bra", "underwear", 50],
  ["mhw_elvs_vintage_swimwear1_50s_strapless", "Vintage swimwear1 50s strapless", "underwear", 31],
  ["mhw_jaldmic_akm_base", "Akm base", "equipment", 69],
  ["mhw_culturalibre_cl_gun", "Cl gun", "equipment", 50],
  ["mhw_culturalibre_cl_gun_left_hand", "Cl gun left hand", "equipment", 50],
  ["mhw_joepal_crude_sword", "Crude sword", "equipment", 50],
  ["mhw_o4saken_dagger", "Dagger", "equipment", 57],
  ["mhw_punkduck_diver_scuba_rig", "Diver scuba rig", "equipment", 38],
  ["mhw_punkduck_electric_guitar", "Electric guitar", "equipment", 100],
  ["mhw_maciekg_hammer", "Hammer", "equipment", 50],
  ["mhw_culturalibre_hand_claws", "Hand claws", "equipment", 50],
  ["mhw_punkduck_handbag01", "Handbag01", "equipment", 69],
  ["mhw_punkduck_head_mirror", "Head mirror", "equipment", 50],
  ["mhw_culturalibre_hero_kalistick", "Hero kalistick", "equipment", 50],
  ["mhw_culturalibre_hero_kalistick_lefthanded", "Hero kalistick lefthanded", "equipment", 50],
  ["mhw_jaldmic_l1a1", "L1a1", "equipment", 69],
  ["mhw_jaldmic_m1911a1", "M1911a1", "equipment", 50],
  ["mhw_culturalibre_magic_sceptre", "Magic sceptre", "equipment", 70],
  ["mhw_punkduck_microphone", "Microphone", "equipment", 50],
  ["mhw_punkduck_p-ivy_weapon", "P-ivy weapon", "equipment", 50],
  ["mhw_punkduck_shopping_bag01", "Shopping bag01", "equipment", 69],
  ["mhw_maciekg_short_bow", "Short bow", "equipment", 50],
  ["mhw_elvs_sling_purse1", "Sling purse1", "equipment", 57],
  ["mhw_punkduck_stethoscope", "Stethoscope", "equipment", 50],
  ["mhw_culturalibre_suitcase", "Suitcase", "equipment", 50],
  ["mhw_mindfront_tactical_vest_female", "Tactical vest female", "equipment", 61],
  ["mhw_mindfront_tactical_vest_male", "Tactical vest male", "equipment", 61],
  ["mhw_punkduck_tennis_racket", "Tennis racket", "equipment", 69],
  ["mhw_culturalibre_war_hammer", "War hammer", "equipment", 50],
  ["mhw_punkduck_wireless_headset", "Wireless headset", "equipment", 50],
  ["mhw_culturalibre_wooden_bow", "Wooden bow", "equipment", 70],
  ["mhw_grinsegold_beard_sigmund_wip", "Beard sigmund wip", "bodyparts", 50],
  ["mhw_rehmanpolanski_beard_viking", "Beard viking", "bodyparts", 50],
  ["mhw_elvs_cat_tail_as_clothes_1", "Cat tail as clothes 1", "bodyparts", 50],
  ["mhw_elvs_childrens_costume_wings1", "Childrens costume wings1", "bodyparts", 69],
  ["mhw_culturalibre_cl_devil_tail", "Cl devil tail", "bodyparts", 70],
  ["mhw_culturalibre_dal_moustache", "Dal moustache", "bodyparts", 50],
  ["mhw_elvs_deer_antlers_1", "Deer antlers 1", "bodyparts", 50],
  ["mhw_jaldmic_demon_horns", "Demon horns", "bodyparts", 69],
  ["mhw_elvs_dual_fanned_wings_collaberation", "Dual fanned wings collaberation", "bodyparts", 50],
  ["mhw_culturalibre_faun_beard", "Faun beard", "bodyparts", 50],
  ["mhw_culturalibre_faun_horns", "Faun horns", "bodyparts", 50],
  ["mhw_wolgade_female_fingernails", "Female fingernails", "bodyparts", 50],
  ["mhw_grinsegold_fingernails_female_natural", "Fingernails female natural", "bodyparts", 50],
  ["mhw_elvs_fluffy_tail_as_clothes_1", "Fluffy tail as clothes 1", "bodyparts", 50],
  ["mhw_grinsegold_full_beard", "Full beard", "bodyparts", 50],
  ["mhw_elvs_gazelle_horns_1", "Gazelle horns 1", "bodyparts", 50],
  ["mhw_elvs_gazelle_horns_2", "Gazelle horns 2", "bodyparts", 50],
  ["mhw_jaldmic_houndoom_horns", "Houndoom horns", "bodyparts", 50],
  ["mhw_toigo_long_fingernails_blue_butterfly", "Long fingernails blue butterfly", "bodyparts", 50],
  ["mhw_elvs_longhorn_steer_horns_1", "Longhorn steer horns 1", "bodyparts", 50],
  ["mhw_freezychan_lucoa_quetzalcoatl_horns", "Lucoa quetzalcoatl horns", "bodyparts", 50],
  ["mhw_culturalibre_minotaur_horns", "Minotaur horns", "bodyparts", 50],
  ["mhw_elvs_moose_antlers_1", "Moose antlers 1", "bodyparts", 50],
  ["mhw_grinsegold_moustache", "Moustache", "bodyparts", 50],
  ["mhw_rehmanpolanski_moustache_viking", "Moustache viking", "bodyparts", 50],
  ["mhw_mindfront_nails_01_short", "Nails 01 short", "bodyparts", 31],
  ["mhw_mindfront_nails_02_medium", "Nails 02 medium", "bodyparts", 31],
  ["mhw_mindfront_nails_03_long", "Nails 03 long", "bodyparts", 31],
  ["mhw_mindfront_nails_toes_01", "Nails toes 01", "bodyparts", 31],
  ["mhw_wdg_scruffy_beard", "Scruffy beard", "bodyparts", 50],
  ["mhw_elvs_scruffy_beard1", "Scruffy beard1", "bodyparts", 55],
  ["mhw_elvs_static_wings1_dragonfly", "Static wings1 dragonfly", "bodyparts", 69],
  ["mhw_elvs_static_wings2_dragon1", "Static wings2 dragon1", "bodyparts", 69],
  ["mhw_elvs_static_wings3_butterfly1", "Static wings3 butterfly1", "bodyparts", 69],
  ["mhw_elvs_static_wings4_bone_wings1", "Static wings4 bone wings1", "bodyparts", 69],
  ["mhw_elvs_static_wings5_fairy_moth1", "Static wings5 fairy moth1", "bodyparts", 69],
  ["mhw_culturalibre_tigra_tail", "Tigra tail", "bodyparts", 70],
  ["mhw_jaldmic_toriel_horns", "Toriel horns", "bodyparts", 50],
  ["mhw_elvs_unicorn_horn_1", "Unicorn horn 1", "bodyparts", 50]
];
// EW_MH_WEAR:END
/* THE BLENDER TIGHT CLOTHES (2026-11-01, bake-clothes.py TIGHT, docs/notes/character-models-plan.md row 12 batch 4b): built
   in cloud Blender from the MPFB bodies themselves (each row = the body's own cross-section + a few millimetres), worn like
   the pack clothes above. The pants take the Bottoms colour / fabric, the singlet the Top's (ewWear.layer); the mask keeps
   its own red + gold. */
EW_MH_WEAR.push(['ewb_footballpants', 'Football pants', 'bottoms', 47], ['ewb_singlet', 'Wrestling singlet', 'suits', 50], ['ewb_luchador', 'Luchador mask', 'masks', 50]);
/* THE BLENDER SKIRTS (row 12 batch 5b, bake-clothes.py COATS skirt=True): the coat sheet from the hem up to a waistband, the
   hem on THE SWAY's chains; they take the Bottoms colour / fabric. Ragged skirt (demon F), Valkyrie skirt, Linen kilt (Anubis),
   Loincloth (demon M, minotaur, goatman: the front / back flaps only). */
EW_MH_WEAR.push(['ewb_raggedskirt', 'Ragged skirt', 'bottoms', 48], ['ewb_valkyrie', 'Valkyrie skirt', 'bottoms', 48], ['ewb_kilt', 'Linen kilt', 'bottoms', 48], ['ewb_loincloth', 'Loincloth', 'bottoms', 48]);
/* THE BLENDER COSTUME PIECES (row 12 batch 5c): Mummy wraps (bandage turns round the body, arms + legs), Ghost sheet (over
   the head + the whole body, its hem on THE SWAY's chains), Scale leggings (Atlantean; Bottoms colour), Do-rag, Suspenders,
   Belly-dancer top + Coin belt, Off-shoulder top (Top colour). */
EW_MH_WEAR.push(['ewb_mummy', 'Mummy wraps', 'suits', 50], ['ewb_ghost', 'Ghost sheet', 'suits', 70], ['ewb_scaleleggings', 'Scale leggings', 'bottoms', 47],
  ['ewb_dorag', 'Do-rag', 'hats', 52], ['ewb_suspenders', 'Suspenders', 'equipment', 60], ['ewb_bellytop', 'Belly-dancer top', 'tops', 52],
  ['ewb_coinbelt', 'Coin belt', 'equipment', 49], ['ewb_offshoulder', 'Off-shoulder top', 'tops', 52]);
/* THE SOLID PIECES (2026-11-01, mondo's own cowboy hat, R2 wear/cowboyhat/): his mesh, UVs and textures as he made them,
   fitted rigidly to each body's head and riding the Head bone (bake-clothes.py SOLIDS). Keeps its own colours. */
EW_MH_WEAR.push(['ewb_cowboyhat', 'Cowboy hat', 'hats', 56]);
/* THE WORN HATS (2026-11-03, mondo: "make it look more realistic/weathered/worn/textured"): his same hat + fit wearing a Meshy
   Retexture painted on his own UVs (bake-clothes.py SOLIDS cowboyhat_worn / cowboyhat_worntan); his original stays above. */
EW_MH_WEAR.push(['ewb_cowboyhat_worn', 'Cowboy hat (worn dark)', 'hats', 56], ['ewb_cowboyhat_worntan', 'Cowboy hat (worn tan)', 'hats', 56]);
/* THE BAND TINT (2026-11-03, mondo: "change the color of the band and the hat separately"): these hats carry the band as its own
   primitive (bake-clothes.py band_tint); its colour is appearance.wearTint['<id>:band'] (none = its own colours) */
const EW_WEAR_BANDS = ['ewb_cowboyhat', 'ewb_cowboyhat_worn', 'ewb_cowboyhat_worntan'];
/* THE MESHY PIECES (2026-11-03, docs/notes/character-models-plan.md row 16; the pieces of sections 4a + 6b/6c, made on Meshy):
   each fitted on the five MPFB bodies by bake-meshy.py (cloud Blender) and worn like the cowboy hat - solid, on its own colours
   (the wear tint over them), riding one bone: hats + helmets + crowns on the Head; the creature heads (grey alien ... moth) on the
   Head with the head under them hidden (skin, hair, eyes: three-renderer.js headOff); badges, pendants, the collar on the chest;
   belts + hip pieces on the hips; armour + bands on the limb bones (pairs mirrored); back gear on the spine; tails on THE SWAY's
   chains; hooves / beast feet over hidden feet; the mermaid tail over hidden legs; the props in the right hand, the hand closed round
   them (wearGrip). Meshy models stay the units' defaults: these are creator picks only. */
EW_MH_WEAR.push(['ewm_tricorn', 'Pirate tricorn', 'hats', 56], ['ewm_officercap', 'Officer cap', 'hats', 56],
  ['ewm_firehelmet', 'Firefighter helmet', 'hats', 56], ['ewm_footballhelmet', 'Football helmet', 'hats', 56],
  ['ewm_astrohelmet', 'Astronaut helmet', 'hats', 56], ['ewm_royalcrown', 'Royal crown', 'hats', 56],
  ['ewm_icecrown', 'Ice crown', 'hats', 56], ['ewm_anunnakihat', 'Anunnaki headdress', 'hats', 56],
  ['ewm_overlordhelm', 'Overlord helmet', 'hats', 56], ['ewm_mushroomcap', 'Mushroom cap', 'hats', 56], ['ewm_beret', 'Beret', 'hats', 56],
  ['ewm_strawhat', 'Floppy straw hat', 'hats', 56], ['ewm_brokenhalo', 'Broken halo', 'equipment', 60],
  ['ewm_greyalien', 'Grey alien head', 'heads', 58], ['ewm_jackalhead', 'Jackal head', 'heads', 58],
  ['ewm_goathead', 'Goat head', 'heads', 58], ['ewm_eaglehead', 'Eagle head', 'heads', 58], ['ewm_sharkhead', 'Shark head', 'heads', 58],
  ['ewm_lizardhead', 'Lizard head', 'heads', 58], ['ewm_mothhead', 'Moth head', 'heads', 58],
  ['ewm_sheriffstar', 'Sheriff star', 'equipment', 61], ['ewm_policebadge', 'Police badge', 'equipment', 61],
  ['ewm_crosspendant', 'Cross pendant', 'equipment', 61], ['ewm_talisman', 'Talisman pendant', 'equipment', 61],
  ['ewm_hagstone', 'Hagstone', 'equipment', 61], ['ewm_binoculars', 'Binoculars', 'equipment', 61],
  ['ewm_walkietalkie', 'Walkie-talkie', 'equipment', 61], ['ewm_egyptcollar', 'Egyptian collar', 'equipment', 61],
  ['ewm_airtank', 'Firefighter air tank', 'equipment', 62], ['ewm_astropack', 'Astronaut backpack', 'equipment', 62],
  ['ewm_backpack', 'Small backpack', 'equipment', 62], ['ewm_jetpack', 'Jetpack', 'equipment', 62],
  ['ewm_quiver', 'Quiver', 'equipment', 62], ['ewm_katana', 'Katana in a back sheath', 'equipment', 62],
  ['ewm_dowsingrod', 'Dowsing rod', 'equipment', 62], ['ewm_dorsalfin', 'Shark dorsal fin', 'bodyparts', 62],
  ['ewm_mothwings', 'Moth wings', 'bodyparts', 63], ['ewm_gunbelt', 'Gun belt', 'equipment', 59],
  ['ewm_toolbelt', 'Tool belt', 'equipment', 59], ['ewm_thighholster', 'Thigh holster', 'equipment', 59],
  ['ewm_flaregun', 'Flare gun (hip)', 'equipment', 60], ['ewm_spyglass', 'Spyglass (hip)', 'equipment', 60],
  ['ewm_wardtotem', 'Ward totem (belt)', 'equipment', 60], ['ewm_censer', 'Censer (hip)', 'equipment', 60],
  ['ewm_breastplate', 'Armour breastplate', 'equipment', 64], ['ewm_shoulderpads', 'Football shoulder pads', 'equipment', 65],
  ['ewm_pauldrons', 'Armour pauldrons', 'equipment', 65], ['ewm_gauntlets', 'Armour gauntlets', 'equipment', 63],
  ['ewm_greaves', 'Armour greaves', 'equipment', 63], ['ewm_armband', 'Arm band', 'equipment', 63],
  ['ewm_grapplegauntlet', 'Grapple gauntlet', 'equipment', 63], ['ewm_elfears', 'Elf ears', 'bodyparts', 57],
  ['ewm_neckbolts', 'Neck bolts', 'bodyparts', 57], ['ewm_hooves', 'Hooves', 'bodyparts', 47],
  ['ewm_beastfeet', 'Clawed beast feet', 'bodyparts', 47], ['ewm_lizardtail', 'Lizard tail', 'bodyparts', 62],
  ['ewm_sharktail', 'Shark tail', 'bodyparts', 62], ['ewm_wolftail', 'Wolf tail', 'bodyparts', 62],
  ['ewm_mermaidtail', 'Mermaid tail', 'bodyparts', 48], ['ewm_trident', 'Trident', 'equipment', 60],
  ['ewm_potionflask', 'Potion flask', 'equipment', 60], ['ewm_scalpel', 'Scalpel', 'equipment', 60],
  ['ewm_wrench', 'Wrench', 'equipment', 60], ['ewm_blowpipe', 'Blowpipe', 'equipment', 60],
  ['ewm_smartphone', 'Smartphone', 'equipment', 60], ['ewm_handmirror', 'Hand mirror', 'equipment', 60],
  ['ewm_camera', 'Old camera with flash', 'equipment', 60], ['ewm_milkcookies', 'Milk and cookies', 'equipment', 60],
  ['ewm_cup', 'Drinking cup', 'equipment', 60], ['ewm_magicwand', 'Magic wand', 'equipment', 60],
  ['ewm_wizardstaff', 'Wizard staff', 'equipment', 60]);
/* THE MESHY OUTFITS (2026-11-12, plan row 21d, bake-outfit.py; mondo: "i like route 2 better" + "Go"): a unit's own clothes, remade by
   Meshy T2 as separate shells and dressed onto the MPFB body (so the head is the MPFB head: the 67 face shapes). One solid outfit
   piece per unit (it hides the skin under it) + its hat. Worn by RACE_REMADE_LOOKS below; any creator look may pick them (Armour / Hats). */
EW_MH_WEAR.push(['ewm_t2cowboy_hat', 'Cowboy hat (Meshy remake)', 'hats', 56], ['ewm_t2cowboy_outfit', 'Cowboy outfit (Meshy remake)', 'equipment', 40],
  ['ewm_t2knight_outfit', 'Knight armour + cape (Meshy remake)', 'equipment', 40],
  ['ewm_t2wizard_hat', 'Wizard hat (Meshy remake)', 'hats', 56], ['ewm_t2wizard_outfit', 'Wizard robe + cloak (Meshy remake)', 'equipment', 40],
  /* batch one of the demo starters (2026-11-12, meshy-remake-plan.md) */
  ['ewm_t2zombie_outfit', 'Zombie rags (Meshy remake)', 'equipment', 40],
  ['ewm_t2mummy_outfit', 'Mummy wraps (Meshy remake)', 'equipment', 40],
  ['ewm_t2locke_outfit', 'Agent Locke suit (Meshy remake)', 'equipment', 40],
  ['ewm_t2angel_outfit', 'Angel dress (Meshy remake)', 'equipment', 40],
  ['ewm_t2catgirl_hat', 'Catgirl ears (Meshy remake)', 'hats', 56], ['ewm_t2catgirl_outfit', 'Catgirl outfit (Meshy remake)', 'equipment', 40],
  ['ewm_t2robinhood_outfit', 'Robinhood hood + tunic (Meshy remake)', 'equipment', 40],
  ['ewm_t2quarterback_hat', 'Quarterback helmet (Meshy remake)', 'hats', 56], ['ewm_t2quarterback_outfit', 'Quarterback kit (Meshy remake)', 'equipment', 40]);
/* THE BLENDER BASICS (2026-11-02, mondo: "get rid of any classic clothes and shoes ... make sure we have a replacement"): the
   classic coded pieces no pack has, built in cloud Blender like the rest of row 12 (bake-clothes.py COATS / TIGHT / NECKWEAR):
   Long-sleeve top + Henley (Top colour / fabric / print), Sweatpants (Bottoms'), Belt (Belt's), Tie + Bow tie (their own colour,
   tinted like a pack piece). Retired classic -> replacement: EW_RETIRED_CLOTHES below. */
EW_MH_WEAR.push(['ewb_longsleeve', 'Long-sleeve top', 'tops', 52], ['ewb_henley', 'Henley', 'tops', 52], ['ewb_sweatpants', 'Sweatpants', 'bottoms', 47],
  ['ewb_belt', 'Belt', 'equipment', 56], ['ewb_tie', 'Tie', 'equipment', 57], ['ewb_bowtie', 'Bow tie', 'equipment', 57]);
/* THE BLENDER SHIRTS (2026-11-02, character-models-plan.md row 12e; mondo: "a lot of collars are missing when some of these shirt
   types should definitely have them ... i deally i want there to be a longsleeve collared shirt that is tucked in but with no tie"):
   shirts built in cloud Blender (bake-clothes.py SHIRTS -> ewb_top_<name>.glb) with a real turned-down collar (the polo: a knit
   one), a button placket, cuffs; painted by the Top layer like the Henley. A tucked one (z 46) sits under the trousers + belt
   (THE LAYERS fold its hem in under them); an untucked one (z 52) hangs over the trousers. */
EW_MH_WEAR.push(['ewb_top_shirt', 'Collared shirt (tucked)', 'tops', 46], ['ewb_top_shirtopen', 'Open-collar shirt (tucked)', 'tops', 46],
  ['ewb_top_workshirt', 'Work shirt (tucked)', 'tops', 46], ['ewb_top_shirtloose', 'Collared shirt (untucked)', 'tops', 52],
  ['ewb_top_shortshirt', 'Short-sleeve shirt', 'tops', 52], ['ewb_top_polo', 'Polo shirt', 'tops', 52]);
/* THE JOINED BEARDS (2026-11-02, character-models-plan.md row 12h; mondo: "i cant find a full beard that has a mustache too. the one
   that says full beard doesnt have a mustache connected. Use blender to edit some of the existing ones into new ones?"): a pack
   beard + a pack moustache edited in cloud Blender into ONE piece (bake-beards.py -> ewb_beard_<key>.glb): one mesh, the two
   textures on one sheet, the moustache's ends turned down along the mouth corners into the beard. Facial hair picks like the
   rest (EW_MH_FACIAL_HAIR below reads the 'beard' in the id); the Facial hair colour row tints the whole piece. */
EW_MH_WEAR.push(['ewb_beard_full', 'Full beard with moustache', 'bodyparts', 50], ['ewb_beard_fullbushy', 'Full beard with bushy moustache', 'bodyparts', 50],
  ['ewb_beard_viking', 'Viking beard with moustache', 'bodyparts', 50], ['ewb_beard_scruffy', 'Scruffy beard with moustache', 'bodyparts', 50]);
/* THE FUR (2026-11-03, plan row 18, the werewolf pilot; mondo: "go ahead and get it [the MakeHuman hair editor] and try on the
   werewolf"): the hair editor's full-body fur groom, grown + baked in cloud Blender (bake-fur.py) into one piece that fits every MPFB
   body: the editor's body shell (the strands baked onto a copy of the skin just over it, alpha-cut). Category 'underwear', so every
   garment worn over it folds it under it; it hides no skin; the wear tint recolours it. Shown on its own FUR tab (Torso). */
EW_MH_WEAR.push(['ewf_fur', 'Fur (whole body)', 'underwear', 1]);
/* THE WEREWOLF FUR (2026-11-03, mondo: "retexture all three in meshy so they all have a consistent fur texture"): the wolf tail and the
   clawed feet again, wearing a Meshy Retexture made with the same fur as the "Werewolf fur" skins (bake-meshy.py tex=) */
EW_MH_WEAR.push(['ewf_fur_werewolf', 'Fur (whole body), werewolf colours', 'underwear', 1]);   // (bake-fur.py --from-skin: the shell in the Werewolf fur skin's colours)
EW_MH_WEAR.push(['ewm_wolftail_fura', 'Wolf tail, werewolf fur', 'bodyparts', 62], ['ewm_wolftail_furb', 'Wolf tail, werewolf fur, dark', 'bodyparts', 62],
  ['ewm_beastfeet_fura', 'Clawed beast feet, werewolf fur', 'bodyparts', 47], ['ewm_beastfeet_furb', 'Clawed beast feet, werewolf fur, dark', 'bodyparts', 47]);
/* THE FACIAL HAIR (2026-11-01, mondo: "im not seeing the option to change the facial hair or its color for the cowboy"): an MPFB
   body hides the classic painted beard (it paints the classic face only), so its facial hair is the pack's beards + moustaches
   (Body parts). The creator lists them under FACE as one pick; three-renderer.js paintFacial tints them like the pack hair:
   beardTint 'hair' = the hair colour, 'pick' = beardColor, 'own' = the piece's own texture. */
const EW_MH_FACIAL_HAIR = EW_MH_WEAR.filter(r => r[2] === 'bodyparts' && /beard|moustache|mustache|goatee|stubble/i.test(r[0])).map(r => r[0]);
/* THE WEAR TINT (2026-11-01, mondo: "add a way to change the tint/color of the cowboy hat, and other clothes/accessories that were
   from the asset packs since they have their own textures"): appearance.wearTint = { <worn wear id>: '#rrggbb' }. A piece with a
   tint wears its own texture's grey levels x the colour (three-renderer.js paintWear, the pack hair's grey mask), so its folds,
   seams and stitching stay; a piece left out keeps its original colours. The facial hair has its own colour row (beardTint), and
   the Blender pieces below take their layer's colour + fabric (the Top / Bottoms rows), so neither is listed here. */
const EW_WEAR_LAYER_PIECES = ['ewb_footballpants', 'ewb_singlet', 'ewb_raggedskirt', 'ewb_valkyrie', 'ewb_kilt', 'ewb_loincloth', 'ewb_scaleleggings', 'ewb_bellytop', 'ewb_offshoulder',
  'ewb_longsleeve', 'ewb_henley', 'ewb_sweatpants', 'ewb_belt',
  'ewb_top_shirt', 'ewb_top_shirtopen', 'ewb_top_workshirt', 'ewb_top_shirtloose', 'ewb_top_shortshirt', 'ewb_top_polo'];   // THE BLENDER SHIRTS
/* the creator layer each of those pieces is painted by (its fabric / colour / print rows show while one is worn) */
const EW_WEAR_LAYER_OF = { ewb_footballpants: 'bottom', ewb_singlet: 'top', ewb_raggedskirt: 'bottom', ewb_valkyrie: 'bottom', ewb_kilt: 'bottom', ewb_loincloth: 'bottom',
  ewb_scaleleggings: 'bottom', ewb_bellytop: 'top', ewb_offshoulder: 'top', ewb_longsleeve: 'top', ewb_henley: 'top', ewb_sweatpants: 'bottom', ewb_belt: 'belt',
  ewb_top_shirt: 'top', ewb_top_shirtopen: 'top', ewb_top_workshirt: 'top', ewb_top_shirtloose: 'top', ewb_top_shortshirt: 'top', ewb_top_polo: 'top' };
function wearTintable(id) { return !!EW_MH_WEAR_BY_ID[id] && !EW_MH_FACIAL_HAIR.includes(id) && !EW_WEAR_LAYER_PIECES.includes(id); }
/* a valid tint map: worn, tintable ids only, #rrggbb lower case */
function normalizeWearTint(map, wear) {
  const out = {};
  if (!map || typeof map !== 'object' || Array.isArray(map)) return out;
  for (const id of wear || []) {
    const c = map[id];
    if (wearTintable(id) && typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)) out[id] = c.toLowerCase();
    const cb = map[id + ':band'];   // THE BAND TINT
    if (EW_WEAR_BANDS.includes(id) && typeof cb === 'string' && /^#[0-9a-f]{6}$/i.test(cb)) out[id + ':band'] = cb.toLowerCase();
  }
  return out;
}
/* THE PACK FABRICS (2026-11-03, mondo: "can we add the option to change the pants textures like cotton and leather and all that? Im not
   seeing that option anywhere in the pants section"): appearance.wearFabric = { <worn wear id>: <EW_FABRICS key> }. A pack pair of
   trousers (OUTFIT > LEGS > BOTTOMS) can wear any creator fabric (the tiles the Top / Bottoms / Outer layers use) under its own
   texture's shading (three-renderer.js paintWear, THE PACK FABRICS), in its picked colour (wearTint) or its own average colour;
   no entry = its own texture. 'plain' is left out (Original texture is the no-weave pick). The Blender bottoms take the Bottoms
   fabric row as before (EW_WEAR_LAYER_OF), so they are not listed here. */
function wearFabricable(id) { return wearTintable(id) && wearKindOf(id) === 'bottoms'; }
function normalizeWearFabric(map, wear) {
  const out = {};
  if (!map || typeof map !== 'object' || Array.isArray(map)) return out;
  for (const id of wear || []) {
    const f = map[id];
    if (wearFabricable(id) && typeof f === 'string' && f !== 'plain' && EW_FABRICS[f] && EW_FABRICS[f].file) out[id] = f;
  }
  return out;
}
// EW_MH_LOOKS:BEGIN (generated from charactercreation/mpfb/looks/looks.json - bake-mpfb.py --looks)
// THE LOOKS (2026-11-01, creator step 4): skin / eye / brow / lash picks for an MPFB body. kits = each body's own look,
// fixed = its teeth / tongue / underwear layer box; eyes / brows / lashes rows = [id, label, x, y, w, h] (the layer's box
// in the 1024 px hm08 sheet); skins rows = [id, label].
const EW_MH_LOOKS = {
  px: 1024,
  kits: {"male":{"skin":"young_caucasian_male","brows":"eyebrow001","lashes":"eyelashes01","eyes":"brown"},"female":{"skin":"young_caucasian_female","brows":"eyebrow006","lashes":"eyelashes02","eyes":"bluegreen"},"heavy":{"skin":"young_african_male","brows":"eyebrow009","lashes":"eyelashes01","eyes":"brown"},"thin":{"skin":"young_asian_male","brows":"eyebrow004","lashes":"eyelashes01","eyes":"grey"},"short":{"skin":"middleage_caucasian_male","brows":"eyebrow008","lashes":"eyelashes01","eyes":"brownlight"}},
  fixed: {"male":[110,15,647,638],"female":[113,15,644,607],"heavy":[110,15,647,632],"thin":[110,15,647,631],"short":[110,15,647,647]},
  skins: [
    ["middleage_african_female", "Middle-aged african female"],
    ["middleage_african_male", "Middle-aged african male"],
    ["middleage_asian_female", "Middle-aged asian female"],
    ["middleage_asian_male", "Middle-aged asian male"],
    ["middleage_caucasian_female", "Middle-aged caucasian female"],
    ["middleage_caucasian_male", "Middle-aged caucasian male"],
    ["old_african_female", "Old african female"],
    ["old_african_male", "Old african male"],
    ["old_asian_female", "Old asian female"],
    ["old_asian_male", "Old asian male"],
    ["old_caucasian_female", "Old caucasian female"],
    ["old_caucasian_male", "Old caucasian male"],
    ["young_african_female", "Young african female"],
    ["young_african_male", "Young african male"],
    ["young_asian_female", "Young asian female"],
    ["young_asian_male", "Young asian male"],
    ["young_caucasian_female", "Young caucasian female"],
    ["young_caucasian_female2", "Young caucasian female2"],
    ["young_caucasian_female_special_suit", "Young caucasian female special suit"],
    ["young_caucasian_male", "Young caucasian male"],
    ["young_caucasian_male2", "Young caucasian male2"],
    ["young_caucasian_male_special_suit", "Young caucasian male special suit"],
    ["blindsaypatten_uniform_skin_texture", "Uniform skin texture"],
    ["bobby_03_young_female_hairless", "Young female hairless"],
    ["callharvey3d_midtoned_female", "Midtoned female"],
    ["cutoff3d_indian_female_enhanced", "Indian female enhanced"],
    ["cutoff3d_indian_female_skin", "Indian female skin"],
    ["darthfurby_caucasian_female", "Caucasian female"],
    ["flower-angel_red_head_skin", "Red head skin"],
    ["nyloseth_zoeyskin", "Zoeyskin"],
    ["onlytheghosts_middle_aged_eurasian_female", "Middle aged eurasian female"],
    ["onlytheghosts_old_eurasian_female", "Old eurasian female"],
    ["onlytheghosts_young_eurasian_female", "Young eurasian female"],
    ["saltycowdawg_genuine_caucasian_female_with_genitals", "Genuine caucasian female"],
    ["skalldyrssuppe_creamy_female", "Creamy female"],
    ["spreadcore_alana_caucasian_female_with_genitals_skin", "Alana caucasian female skin"],
    ["toigo_light_skin_female_bronze", "Light skin female bronze"],
    ["toigo_light_skin_female_bronze_with_makeup", "Light skin female bronze with makeup"],
    ["toigo_light_skin_female_freckles", "Light skin female freckles"],
    ["toigo_light_skin_female_ginger", "Light skin female ginger"],
    ["toigo_light_skin_female_ginger_2", "Light skin female ginger 2"],
    ["toigo_light_skin_female_ginger_with_makeup", "Light skin female ginger with makeup"],
    ["toigo_light_skin_female_with_violet_makeup", "Light skin female with violet makeup"],
    ["toigo_light_skin_with_makeup", "Light skin with makeup"],
    ["toigo_light_skin_with_natural_makeup", "Light skin with natural makeup"],
    ["jartur69_middleage_slavic_male_with_genitals_and_beard", "Middle-aged slavic male with beard"],
    ["jartur69_old_slavic_male_with_genitals_and_beard", "Old slavic male with beard"],
    ["ken1138_caucasian_male_tattooed_skin", "Caucasian male tattooed skin"],
    ["mindfront_aksel_skin", "Aksel skin"],
    ["mindfront_skin_male_african_middleage", "Skin male african middleage"],
    ["onlytheghosts_old_eurasian_male", "Old eurasian male"],
    ["rehmanpolanski_skin_viking_tattoos", "Skin viking tattoos"],
    ["toigo_light_skin_male_bronze", "Light skin male bronze"],
    ["toigo_light_skin_male_freckles", "Light skin male freckles"],
    ["toigo_light_skin_male_ginger", "Light skin male ginger"],
    ["toigo_light_skin_male_with_emo_eyes", "Light skin male with emo eyes"],
    ["toigo_light_skin_male_with_eyeliner", "Light skin male with eyeliner"],
    ["toigo_light_skin_male_with_goth_makeup", "Light skin male with goth makeup"],
    ["bobby_03_grey_skinned_person", "Grey skinned person"],
    ["bogdan666_elfskinsohlen", "Elfskinsohlen"],
    ["callharvey3d_baboon_people", "Baboon people"],
    ["culturalibre_dr_manhattan", "Dr manhattan"],
    ["culturalibre_tigra_skin", "Tigra skin"],
    ["culturalibre_tigra_white_skin", "Tigra white skin"],
    ["joepal_annotated_skin", "Annotated skin"],
    ["naim_abbassi_zombie_skin", "Zombie skin"],
    ["reizibarrientos_blue_leopard_skin", "Blue leopard skin"],
    ["reizibarrientos_white_walker_skin", "White walker skin"],
    ["sohh_female_zombie_skin", "Female zombie skin"],
    ["sonntag78_orkifyheadtarget_custom_skin", "Orkifyheadtarget custom skin"],
    ["spreadcore_gray_alien_bio_armor_skin_1", "Gray alien bio armor skin 1"],
    ["spreadcore_green_alien_skin_1", "Green alien skin 1"],
    ["spreadcore_green_alien_skin_2", "Green alien skin 2"],
    ["titleknown_trans_flag", "Trans flag"],
    ["trashhunter_black_kameri_fur", "Black kameri fur"],
    ["xhado84_middleage_afro_female_special_suit_green", "Middle-aged afro female special suit green"],
    ["xhado84_young_asian_female_body_suit_gold", "Young asian female body suit gold"],
    ["xhado84_young_asian_female_special_suit_red", "Young asian female special suit red"],
  ],
  eyes: [
    ["blue", "Blue", 9, 31, 171, 77],
    ["bluegreen", "Blue-green", 9, 31, 171, 77],
    ["brown", "Brown", 9, 31, 171, 77],
    ["brownlight", "Light brown", 9, 31, 171, 77],
    ["deepblue", "Deep blue", 9, 31, 171, 77],
    ["green", "Green", 9, 31, 171, 77],
    ["grey", "Grey", 9, 31, 171, 77],
    ["ice", "Ice", 9, 31, 171, 77],
    ["lightblue", "Light blue", 9, 31, 171, 77],
  ],
  brows: [
    ["eyebrow001", "Brows 1", 840, 460, 15, 140],
    ["eyebrow002", "Brows 2", 838, 460, 18, 139],
    ["eyebrow003", "Brows 3", 838, 459, 17, 141],
    ["eyebrow004", "Brows 4", 840, 463, 17, 132],
    ["eyebrow005", "Brows 5", 838, 464, 16, 130],
    ["eyebrow006", "Brows 6", 838, 463, 16, 133],
    ["eyebrow007", "Brows 7", 839, 478, 14, 102],
    ["eyebrow008", "Brows 8", 838, 463, 17, 133],
    ["eyebrow009", "Brows 9", 837, 461, 20, 138],
    ["eyebrow010", "Brows 10", 839, 469, 15, 124],
    ["eyebrow011", "Brows 11", 840, 470, 14, 120],
    ["eyebrow012", "Brows 12", 838, 464, 18, 131],
    ["mindfront_eyebrows_01", "Mesh brows 1", 838, 472, 14, 113],
    ["mindfront_eyebrows_02", "Mesh brows 2", 838, 474, 14, 112],
    ["mindfront_eyebrows_03", "Mesh brows 3", 839, 468, 12, 123],
    ["mindfront_eyebrows_04", "Mesh brows 4", 839, 468, 12, 122],
    ["mindfront_eyebrows_05", "Mesh brows 5", 837, 457, 17, 145],
    ["mindfront_eyebrows_06", "Mesh brows 6", 836, 468, 15, 123],
    ["mindfront_eyebrows_07", "Mesh brows 7", 835, 465, 17, 129],
    ["mindfront_eyebrows_08", "Mesh brows 8", 836, 461, 15, 138],
    ["mindfront_eyebrows_09", "Mesh brows 9", 837, 468, 16, 123],
    ["mindfront_eyebrows_10", "Mesh brows 10", 836, 470, 16, 119],
    ["mindfront_eyebrows_11", "Mesh brows 11", 836, 467, 18, 125],
    ["mindfront_eyebrows_12", "Mesh brows 12", 836, 469, 16, 119],
    ["mindfront_eyebrows_13", "Mesh brows 13", 836, 469, 17, 120],
    ["mindfront_eyebrows_14", "Mesh brows 14", 836, 470, 16, 118],
  ],
  lashes: [
    // THE LID LASHES (2026-11-03, bake-lashes.py): the stock four drawn on the eyelids (bake-mpfb.py drew them on the cut helper)
    ["eyelashes01", "Lashes 1", 849, 482, 20, 95],
    ["eyelashes02", "Lashes 2", 845, 475, 24, 108],
    ["eyelashes03", "Lashes 3", 843, 476, 26, 107],
    ["eyelashes04", "Lashes 4", 843, 476, 26, 106],
    ["mindfront_eyelashes_01", "Mesh lashes 1", 850, 482, 17, 93],
    ["mindfront_eyelashes_02", "Mesh lashes 2", 850, 482, 17, 94],
    ["mindfront_eyelashes_03", "Mesh lashes 3", 849, 481, 19, 97],
    ["mindfront_eyelashes_04", "Mesh lashes 4", 848, 480, 22, 98],
    ["mindfront_eyelashes_05", "Mesh lashes 5", 845, 481, 24, 97],
  ],
};
// EW_MH_LOOKS:END
/* THE WEREWOLF FUR SKINS (2026-11-03, mondo: "texture the heavy body with werewolf head on meshy to look more like a werewolf"): Meshy
   Retexture on the MPFB heavy body with the Wolf head (its own hm08 UVs, so any MPFB body wears it): A = the text prompt, B = matched to
   the Meshy werewolf's own look. mpfb/looks/skin_<id>.jpg like the pack skins; sources in project files meshy/retexture/werewolf/. */
EW_MH_LOOKS.skins.push(['ew_werewolf_fur', 'Werewolf fur (Meshy)'], ['ew_werewolf_fur_dark', 'Werewolf fur, dark (Meshy)']);
/* THE MORGAN SKIN (2026-11-11, THE CUSTOM SHAPES): Morgan's face re-projected onto the hm08 sheet over skin_young_caucasian_female,
   mpfb/looks/skin_morgan.jpg like the pack skins; it pairs with the morganHead shaped head (EW_MPFB_FACE_SLIDERS "Face likeness"). */
EW_MH_LOOKS.skins.push(['morgan', 'Morgan']);
/* THE UNIT FACES (2026-11-12): the unit's own Meshy face on the hm08 sheet, pairs with the <race>Face shaped head (bake-face.py). */
EW_MH_LOOKS.skins.push(['ew_face_cowboy', 'Cowboy face (Meshy)'], ['ew_face_knight', 'Knight face (Meshy)'], ['ew_face_wizard', 'Wizard face (Meshy)'], ['ew_face_zombie', 'Zombie face (Meshy)'], ['ew_face_robinhood', 'Robinhood face (Meshy)'], ['ew_face_catgirl', 'Catgirl face (Meshy)'], ['ew_face_mummy', 'Mummy face (Meshy)'], ['ew_face_locke', 'Agent Locke face (Meshy)'], ['ew_face_angel', 'Angel face (Meshy)']);
/* THE EYE PACK (2026-11-03, mondo uploaded the MakeHuman Eye Texture Pack to R2 looks/eyes/eyetextures/: "please add them to the
   character creator"): [id, label, colour PNG, normal-map PNG]. On an MPFB body these are NOT drawn into the skin sheet (an iris
   there is ~6 texels, a cat eye's slit is lost): three-renderer.js THE EYE PACK fits MakeHuman's high-poly eye mesh over the
   eyeballs (eye_proxy.json, bake-eyes.py) and it wears the pack PNG itself + its normal map. The Iris colour picker recolours the
   two irises (EW_MH_EYE_PACK_IRIS: the pupils' centres + the iris radius in the 1024 px texture, measured by bake-eyes.py). */
const EW_MH_EYE_PACK_DIR = 'mpfb/looks/eyes/eyetextures/';
const EW_MH_EYE_PACK = [
  ['mhp_black', 'Black', 'BlackEyes', 'EyesNormals'],
  ['mhp_black_bs', 'Black bloodshot', 'BlackBloodShotEyes', 'EyesBloodShotNormals'],
  ['mhp_blackest', 'All black', 'BlackestEyes', 'BlackestEyesNormals'],
  ['mhp_blue', 'Blue', 'BlueEyes', 'EyesNormals'],
  ['mhp_blue_bs', 'Blue bloodshot', 'BlueBloodShotEyes', 'EyesBloodShotNormals'],
  ['mhp_brown', 'Brown', 'BrownEyes', 'EyesNormals'],
  ['mhp_brown2', 'Brown 2', 'BrownEyes1', 'EyesNormals'],
  ['mhp_brown_bs', 'Brown bloodshot', 'BrownBloodShotEyes', 'EyesBloodShotNormals'],
  ['mhp_brown2_bs', 'Brown 2 bloodshot', 'BrownBloodShotEyes1', 'EyesBloodShotNormals'],
  ['mhp_deepblue', 'Deep blue', 'DeepBlueEyes', 'EyesNormals'],
  ['mhp_deepblue_bs', 'Deep blue bloodshot', 'DeepBlueBloodShotEyes', 'EyesBloodShotNormals'],
  ['mhp_green', 'Green', 'GreenEyes', 'EyesNormals'],
  ['mhp_green_bs', 'Green bloodshot', 'GreenBloodShotEyes', 'EyesBloodShotNormals'],
  ['mhp_olive', 'Olive', 'OliveEyes', 'EyesNormals'],
  ['mhp_olive_bs', 'Olive bloodshot', 'OliveBloodShotEyes', 'EyesBloodShotNormals'],
  ['mhp_purple', 'Purple', 'PurpleEyes', 'EyesNormals'],
  ['mhp_purple_bs', 'Purple bloodshot', 'PurpleBloodShotEyes', 'EyesBloodShotNormals'],
  ['mhp_red', 'Red', 'RedEyes', 'EyesNormals'],
  ['mhp_red_bs', 'Red bloodshot', 'RedBloodShotEyes', 'EyesBloodShotNormals'],
  ['mhp_cat_blue', 'Cat eyes blue', 'CatEyesBlue', 'CatEyesNormalMap'],
  ['mhp_cat_blue_bs', 'Cat eyes blue bloodshot', 'CatEyesBlueBloodShot', 'CatEyesBloodShotNormals'],
  ['mhp_cat_darkblue', 'Cat eyes dark blue', 'CatEyesDarkBlue', 'CatEyesNormalMap'],
  ['mhp_cat_darkblue_bs', 'Cat eyes dark blue bloodshot', 'CatEyesDarkBlueBloodShot', 'CatEyesBloodShotNormals'],
  ['mhp_cat_green', 'Cat eyes green', 'CatEyesGreen', 'CatEyesNormalMap'],
  ['mhp_cat_green_bs', 'Cat eyes green bloodshot', 'CatEyesGreenBloodShot', 'CatEyesBloodShotNormals'],
  ['mhp_cat_olive', 'Cat eyes olive', 'CatEyesOlive', 'CatEyesNormalMap'],
  ['mhp_cat_olive_bs', 'Cat eyes olive bloodshot', 'CatEyesOliveBloodShot', 'CatEyesBloodShotNormals'],
  ['mhp_cat_purple', 'Cat eyes purple', 'CatEyesPurple', 'CatEyesNormalMap'],
  ['mhp_cat_purple_bs', 'Cat eyes purple bloodshot', 'CatEyesPurpleBloodShot', 'CatEyesBloodShotNormals'],
  ['mhp_cat_red', 'Cat eyes red', 'CatEyesRed', 'CatEyesNormalMap'],
  ['mhp_cat_red_bs', 'Cat eyes red bloodshot', 'CatEyesRedBloodShot', 'CatEyesBloodShotNormals'],
];
/* THE EYE MATERIALS (2026-11-03, mondo: "can we download the system_eyes_materials 1 through 3 ... and implement them in the character creator?"):
   MakeHuman's system eye material packs 01 (human, CC0), 02 (non-human, CC0) and 03 (various, CC-BY: credited on the CREDITS page via
   mpfb/CREDITS.json). Same 1024 eye sheet as THE EYE PACK, so the same eye mesh wears them; [id, label, PNG, normal (none), folder, group] */
const EW_MH_EYE_MATS_DIR = 'mpfb/looks/eyes/materials/';
const EW_MH_EYE_MATS = [
  ["mhm_bobby_03_diffuse_amber_eyes", "Amber", "bobby_03_diffuse_amber_eyes", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_bobby_03_diffuse_blue_eyes", "Blue", "bobby_03_diffuse_blue_eyes", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_bobby_03_diffuse_grey_eyes", "Grey", "bobby_03_diffuse_grey_eyes", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_bobby_03_diffuse_hazel_eyes", "Hazel", "bobby_03_diffuse_hazel_eyes", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_bobby_03_diffuse_sea_breeze_eyes", "Sea breeze", "bobby_03_diffuse_sea_breeze_eyes", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_mindfront_brown_eye_02", "Brown 02", "mindfront_brown_eye_02", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_nyloseth_sapphire_blue_eyes", "Sapphire blue", "nyloseth_sapphire_blue_eyes", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_spamrakuen_sr_anime_eyes_navy", "Anime navy", "spamrakuen_sr_anime_eyes_navy", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_spamrakuen_sr_anime_maid-san_blue_eyes", "Anime maid-san blue", "spamrakuen_sr_anime_maid-san_blue_eyes", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_spamrakuen_sr_anime_maid-san_red_eyes", "Anime maid-san red", "spamrakuen_sr_anime_maid-san_red_eyes", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_wojackowl_blue_eyes_toon", "Blue toon", "wojackowl_blue_eyes_toon", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_wojackowl_brown_eyes_toon", "Brown toon", "wojackowl_brown_eyes_toon", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_wojackowl_green_eyes_toon", "Green toon", "wojackowl_green_eyes_toon", null, EW_MH_EYE_MATS_DIR, "human"],
  ["mhm_bobby_03_daz_dragon_eyes", "Dragon", "bobby_03_daz_dragon_eyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_culturalibre_6_eyes", "6 eyes", "culturalibre_6_eyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_culturalibre_hero_white_eyes", "Hero white", "culturalibre_hero_white_eyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_culturalibre_hero_yellow_eyes", "Hero yellow", "culturalibre_hero_yellow_eyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_culturalibre_zombie_eyes", "Zombie", "culturalibre_zombie_eyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_gpedroso_blank_eye", "Blank", "gpedroso_blank_eye", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_hatshj_alien_eye_2", "Alien 2", "hatshj_alien_eye_2", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_hatshj_alien_eyes", "Alien", "hatshj_alien_eyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_hatshj_cross_eye", "Cross", "hatshj_cross_eye", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_hatshj_facette_eye", "Facette", "hatshj_facette_eye", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_hatshj_facette_eye_2", "Facette 2", "hatshj_facette_eye_2", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_hatshj_reptile_eyes", "Reptile", "hatshj_reptile_eyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_nyloseth_bluecateyes", "Blue cat", "nyloseth_bluecateyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_nyloseth_brown_cat_eyes", "Brown cat", "nyloseth_brown_cat_eyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_nyloseth_green_cat_eyes", "Green cat", "nyloseth_green_cat_eyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_nyloseth_sapphire_cat_eyes", "Sapphire cat", "nyloseth_sapphire_cat_eyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_nyloseth_yellow_cat_eyes", "Yellow cat", "nyloseth_yellow_cat_eyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_sonntag78_orcifyhead_eye", "Orc", "sonntag78_orcifyhead_eye", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_titleknown_trans_eyes", "Trans", "titleknown_trans_eyes", null, EW_MH_EYE_MATS_DIR, "creature"],
  ["mhm_callharvey3d_harvey_eye1", "Harvey 1", "callharvey3d_harvey_eye1", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_callharvey3d_harvey_eye2", "Harvey 2", "callharvey3d_harvey_eye2", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_culturalibre_snake_eyes", "Snake", "culturalibre_snake_eyes", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_culturalibre_target_eyes", "Target", "culturalibre_target_eyes", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_anime_eye_1", "Anime 1", "elvs_anime_eye_1", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_bads_hippy-cat_eye", "Hippy cat", "elvs_bads_hippy-cat_eye", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_bionic_eye_red", "Bionic red", "elvs_bionic_eye_red", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_blurple_eye", "Blurple", "elvs_blurple_eye", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_catyellow_rainbow_eye", "Cat yellow rainbow", "elvs_catyellow_rainbow_eye", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_devilian_eye1", "Devilian", "elvs_devilian_eye1", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_earth_moon_eyes", "Earth moon", "elvs_earth_moon_eyes", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_fruitcake_eyes", "Fruitcake", "elvs_fruitcake_eyes", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_fushia_rainbow_eye", "Fushia rainbow", "elvs_fushia_rainbow_eye", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_midnight_rainbow_eyes", "Midnight rainbow", "elvs_midnight_rainbow_eyes", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_rainbow_hueshift_eyes", "Rainbow hue shift", "elvs_rainbow_hueshift_eyes", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_santa_helpers_eyes", "Santa's helper", "elvs_santa_helpers_eyes", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_saphire_rainbow_eyes", "Sapphire rainbow", "elvs_saphire_rainbow_eyes", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_sunspot_eyes", "Sunspot", "elvs_sunspot_eyes", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_elvs_zfashion_eye1", "Z fashion", "elvs_zfashion_eye1", null, EW_MH_EYE_MATS_DIR, "more"],
  ["mhm_mtknife_violet_eyes", "Violet", "mtknife_violet_eyes", null, EW_MH_EYE_MATS_DIR, "more"],
];
for (const r of EW_MH_EYE_MATS) EW_MH_EYE_PACK.push(r);   // (one list: the saved key, the hider, the iris colour all work as for the pack)
/* THE HAIR MATERIALS (2026-11-03, mondo: "can we download ... system_hair_materials 1 and 2 ... and implement them in the character
   creator?"): MakeHuman's recolours of its own system hair (Bob 01 / 02, Braid 01, Long 01, Ponytail 01, Short 01 / 02 / 04), CC0.
   appearance.hairMat = one of these: worn only on its own style (the style's UVs), in the texture's OWN colours (three-renderer.js
   THE HAIR MATERIALS); 'own' = the style's own texture, coloured by the Hair colour. [id, label, style id, PNG (hair/mh/materials/)] */
const EW_MH_HAIR_MATS = [
  ["mhh_elvaerwyn_bob_01_blood_copper", "Blood copper", "mh_bob01", "elvaerwyn_bob_01_blood_copper"],
  ["mhh_elvaerwyn_bob_01_dark_lime_gold", "Dark lime gold", "mh_bob01", "elvaerwyn_bob_01_dark_lime_gold"],
  ["mhh_elvaerwyn_bob_01_flat_black", "Flat black", "mh_bob01", "elvaerwyn_bob_01_flat_black"],
  ["mhh_elvaerwyn_bob_01_gothic_brown", "Gothic brown", "mh_bob01", "elvaerwyn_bob_01_gothic_brown"],
  ["mhh_elvaerwyn_bob_01_new_gold", "New gold", "mh_bob01", "elvaerwyn_bob_01_new_gold"],
  ["mhh_elvaerwyn_bob_01_old_gold", "Old gold", "mh_bob01", "elvaerwyn_bob_01_old_gold"],
  ["mhh_elvaerwyn_bob_01_old_world_mermaid", "Old world mermaid", "mh_bob01", "elvaerwyn_bob_01_old_world_mermaid"],
  ["mhh_elvaerwyn_bob_01_veronika", "Veronika", "mh_bob01", "elvaerwyn_bob_01_veronika"],
  ["mhh_elvaerwyn_bob_02_50s_cherrybomb", "50s cherrybomb", "mh_bob02", "elvaerwyn_bob_02_50s_cherrybomb"],
  ["mhh_elvaerwyn_bob_02_candy_fushia", "Candy fuchsia", "mh_bob02", "elvaerwyn_bob_02_candy_fushia"],
  ["mhh_jartur69_bob02_dark_blond", "Dark blond", "mh_bob02", "jartur69_bob02_dark_blond"],
  ["mhh_jartur69_bob02_dark_ginger", "Dark ginger", "mh_bob02", "jartur69_bob02_dark_ginger"],
  ["mhh_jartur69_bob02_ginger", "Ginger", "mh_bob02", "jartur69_bob02_ginger"],
  ["mhh_elvaerwyn_bob_02_honey_blonde", "Honey blonde", "mh_bob02", "elvaerwyn_bob_02_honey_blonde"],
  ["mhh_jartur69_bob02_light_ginger", "Light ginger", "mh_bob02", "jartur69_bob02_light_ginger"],
  ["mhh_elvaerwyn_bob_02_platinum", "Platinum", "mh_bob02", "elvaerwyn_bob_02_platinum"],
  ["mhh_elvaerwyn_bob_02_pumpkin", "Pumpkin", "mh_bob02", "elvaerwyn_bob_02_pumpkin"],
  ["mhh_elvaerwyn_bob_02_retro_black", "Retro black", "mh_bob02", "elvaerwyn_bob_02_retro_black"],
  ["mhh_elvaerwyn_bob_02_retro_grey", "Retro grey", "mh_bob02", "elvaerwyn_bob_02_retro_grey"],
  ["mhh_elvaerwyn_bob_02_retro_oilslickster", "Retro oil slick", "mh_bob02", "elvaerwyn_bob_02_retro_oilslickster"],
  ["mhh_elvaerwyn_bob_02_tangerine", "Tangerine", "mh_bob02", "elvaerwyn_bob_02_tangerine"],
  ["mhh_toigo_braid01_ash", "Ash", "mh_braid01", "toigo_braid01_ash"],
  ["mhh_toigo_braid01_black", "Black", "mh_braid01", "toigo_braid01_black"],
  ["mhh_toigo_braid01_fuchsia", "Fuchsia", "mh_braid01", "toigo_braid01_fuchsia"],
  ["mhh_toigo_braid01_ginger", "Ginger", "mh_braid01", "toigo_braid01_ginger"],
  ["mhh_toigo_braid01_golden", "Golden", "mh_braid01", "toigo_braid01_golden"],
  ["mhh_toigo_braid01_gray", "Gray", "mh_braid01", "toigo_braid01_gray"],
  ["mhh_toigo_braid01_red", "Red", "mh_braid01", "toigo_braid01_red"],
  ["mhh_toigo_braid01_strawberry", "Strawberry", "mh_braid01", "toigo_braid01_strawberry"],
  ["mhh_toigo_braid01_teal", "Teal", "mh_braid01", "toigo_braid01_teal"],
  ["mhh_toigo_braid01_violet", "Violet", "mh_braid01", "toigo_braid01_violet"],
  ["mhh_toigo_long_01_ash", "Ash", "mh_long01", "toigo_long_01_ash"],
  ["mhh_toigo_long_01_black", "Black", "mh_long01", "toigo_long_01_black"],
  ["mhh_joepal_long_01_blond", "Blond", "mh_long01", "joepal_long_01_blond"],
  ["mhh_punkduck_blond_for_long01", "Blond 2", "mh_long01", "punkduck_blond_for_long01"],
  ["mhh_toigo_long_01_fuchsia", "Fuchsia", "mh_long01", "toigo_long_01_fuchsia"],
  ["mhh_toigo_long_01_ginger", "Ginger", "mh_long01", "toigo_long_01_ginger"],
  ["mhh_toigo_long_01_gray", "Gray", "mh_long01", "toigo_long_01_gray"],
  ["mhh_toigo_long_01_red", "Red", "mh_long01", "toigo_long_01_red"],
  ["mhh_toigo_long_01_teal", "Teal", "mh_long01", "toigo_long_01_teal"],
  ["mhh_toigo_long_01_violet", "Violet", "mh_long01", "toigo_long_01_violet"],
  ["mhh_dariush086_ponytail01_black", "Black", "mh_ponytail01", "dariush086_ponytail01_black"],
  ["mhh_dariush086_ponytail01_brown", "Brown", "mh_ponytail01", "dariush086_ponytail01_brown"],
  ["mhh_mtknife_ponytail01_deep_red", "Deep red", "mh_ponytail01", "mtknife_ponytail01_deep_red"],
  ["mhh_dariush086_ponytail01_gold", "Gold", "mh_ponytail01", "dariush086_ponytail01_gold"],
  ["mhh_dariush086_ponytail01_green", "Green", "mh_ponytail01", "dariush086_ponytail01_green"],
  ["mhh_dariush086_ponytail01_pink", "Pink", "mh_ponytail01", "dariush086_ponytail01_pink"],
  ["mhh_dariush086_ponytail01_platinum", "Platinum", "mh_ponytail01", "dariush086_ponytail01_platinum"],
  ["mhh_dariush086_ponytail01_red", "Red", "mh_ponytail01", "dariush086_ponytail01_red"],
  ["mhh_dariush086_ponytail01_violet", "Violet", "mh_ponytail01", "dariush086_ponytail01_violet"],
  ["mhh_jartur69_short01_brown", "Brown", "mh_short01", "jartur69_short01_brown"],
  ["mhh_jartur69_short01_dark_ginger", "Dark ginger", "mh_short01", "jartur69_short01_dark_ginger"],
  ["mhh_jartur69_short01_rustbrown", "Rustbrown", "mh_short01", "jartur69_short01_rustbrown"],
  ["mhh_jartur69_short02_blond", "Blond", "mh_short02", "jartur69_short02_blond"],
  ["mhh_jartur69_short02_blond_for_female", "Blond for female", "mh_short02", "jartur69_short02_blond_for_female"],
  ["mhh_bogdan666_short_02_brown", "Brown", "mh_short02", "bogdan666_short_02_brown"],
  ["mhh_bogdan666_short_02_gray", "Gray", "mh_short02", "bogdan666_short_02_gray"],
  ["mhh_culturalibre_short_02_green", "Green", "mh_short02", "culturalibre_short_02_green"],
  ["mhh_bogdan666_short_02_red", "Red", "mh_short02", "bogdan666_short_02_red"],
  ["mhh_toigo_short_04_auburn", "Auburn", "mh_short04", "toigo_short_04_auburn"],
  ["mhh_toigo_short_04_blonde", "Blonde", "mh_short04", "toigo_short_04_blonde"],
  ["mhh_toigo_short_04_blue", "Blue", "mh_short04", "toigo_short_04_blue"],
  ["mhh_toigo_short_04_brown", "Brown", "mh_short04", "toigo_short_04_brown"],
  ["mhh_toigo_short_04_ginger", "Ginger", "mh_short04", "toigo_short_04_ginger"],
  ["mhh_toigo_short_04_gray", "Gray", "mh_short04", "toigo_short_04_gray"],
  ["mhh_toigo_short_04_green", "Green", "mh_short04", "toigo_short_04_green"],
  ["mhh_toigo_short_04_violet", "Violet", "mh_short04", "toigo_short_04_violet"],
];
const EW_MH_HAIR_MATS_BY_ID = {};
for (const r of EW_MH_HAIR_MATS) EW_MH_HAIR_MATS_BY_ID[r[0]] = r;
// the hair material a look wears now (its style must be the one worn), or null
function getHairMaterial(a) {
  const r = a && EW_MH_HAIR_MATS_BY_ID[a.hairMat];
  return r && r[2] === a.hair ? { id: r[0], url: EW_CHARACTER_ASSET_BASE + '/hair/mh/materials/' + r[3] + '.png' } : null;
}
const EW_MH_EYE_PACK_IRIS = { centres: [[296.9, 733.0], [722.9, 311.0]], r: 124 };
const EW_MH_EYE_PACK_BY_ID = {};
for (const r of EW_MH_EYE_PACK) EW_MH_EYE_PACK_BY_ID[r[0]] = r;
const EW_MH_WEAR_BY_ID = {};
for (const w of EW_MH_WEAR) EW_MH_WEAR_BY_ID[w[0]] = w;
function getWearUrl(id) { return EW_MH_WEAR_BY_ID[id] ? EW_CHARACTER_ASSET_BASE + '/wear/' + id + '.glb' : null; }
/* THE PACK'S MIS-FILED PIECES (2026-11-03, mondo: "putting on the viking boots removed my viking pants, and vice versa"): the
   MakeHuman packs filed a few separates under Suits / Dresses (the viking boots, pants + tunic and the EMT uniform pants + jackets
   are all "suits", the winter coat a "dress"), so the one-per-category rule below took one off when the other went on.
   EW_WEAR_KIND = what such a piece really is: its one-pick kind here AND the category the renderer layers it by (three-renderer.js
   buildWear: boots under the trouser legs like any shoes). A piece moved to the Coats shelf (EW_WEAR_SHELF_MOVE 'outer') picks as
   a coat. Every other piece keeps its pack category. */
const EW_WEAR_KIND = {
  mhw_rehmanpolanski_viking_boots: 'shoes', mhw_rehmanpolanski_viking_pants: 'bottoms', mhw_rehmanpolanski_viking_tunic: 'tops',
  mhw_elvs_emt_uniform_pants_female: 'bottoms', mhw_elvs_emt_uniform_pants_male: 'bottoms',
};
function wearKindOf(id) { const w = EW_MH_WEAR_BY_ID[id]; return w ? (EW_WEAR_KIND[id] || w[2]) : null; }
/* THE PANTS IN THE BOOTS (2026-11-03, mondo: "Can we make pants fit inside boots or have the option for them to be inside or outside?"):
   appearance.pantsTuck = 'out' (the trouser legs over the boots, the default) | 'in' (tucked into the boot shafts); three-renderer.js
   wearBootFit. EW_BOOT_TOPS = every boot with a shaft: its top (the 90th percentile of its vertex heights on the male fit, metres; the
   Blender Feet picks by their Feet id), EW_PANT_HEMS = every long pair of trousers: its hem (the 1st percentile). The choice shows (and
   the renderer acts) only while a pair of trousers whose hem is under a worn boot's top is worn. Skirts, shorts and the skin-tight
   Blender leggings / football pants are not listed. A new boot / trouser = one line here (measure its GLB the same way). */
const EW_BOOT_TOPS = {
  mhw_cortu_floppy_overknee_shoes: 0.61, mhw_culturalibre_hero_boots_1: 0.49, mhw_culturalibre_hero_boots_2: 0.34, mhw_culturalibre_hero_boots_3: 0.34,
  mhw_culturalibre_hero_boots_4: 0.29, mhw_culturalibre_hero_boots_5: 0.49, mhw_culturalibre_heroine_boots_1: 0.74, mhw_culturalibre_heroine_boots_2: 0.28,
  mhw_culturalibre_heroine_boots_3: 0.34, mhw_culturalibre_heroine_boots_4: 0.35, mhw_culturalibre_male_boots: 0.4, mhw_elvs_basic_felt_elf_shoes: 0.22,
  mhw_elvs_knee_high_heel_boots1: 0.57, mhw_elvs_wedge_tall_boots1: 0.44, mhw_grinsegold_female_pirate_boots: 0.57, mhw_maciekg_leather_boots: 0.22,
  mhw_madmanny_tight_leather_boots: 0.24, mhw_mindfront_shoes_biker_boots_female: 0.28, mhw_mindfront_shoes_biker_boots_male: 0.31,
  'mhw_punkduck_female_half-boots': 0.19, mhw_punkduck_female_knee_boots: 0.48, mhw_punkduck_medieval_boots: 0.13,
  mhw_punkduck_riding_boots: 0.53, mhw_punkduck_winter_boots: 0.39, mhw_rehmanpolanski_viking_boots: 0.32, mhw_scailman_gogo_platform_boots: 0.54,
  'mhw_scailman_low-heeled_boots': 0.48, mhw_scailman_semitransparent_water_boots: 0.49, mhw_toigo_ankle_boots_male: 0.13,
  bboots: 0.16, bhighboots: 0.44, bcowboy: 0.29,   // (the Blender Feet picks)
};
const EW_PANT_HEMS = {
  mhw_cortu_cargo_pants: 0.05, mhw_elvs_disco_pants_double_ruffles: 0.06, mhw_elvs_disco_pants_single_ruffles: 0.06, mhw_elvs_disco_pants_skinny: 0.04,
  mhw_elvs_emt_uniform_pants_female: 0.06, mhw_elvs_emt_uniform_pants_male: 0.05, mhw_elvs_gored_elephant_pants: 0.07, mhw_elvs_jeans_bootcut: 0.05,
  mhw_elvs_jeans_straight_leg: 0.07, mhw_elvs_male_trouser: 0.04, mhw_elvs_male_trouser_with_chain: 0.09, mhw_mindfront_female_trousers_1: 0.08,
  mhw_mindfront_male_trousers_1: 0.08, mhw_mindfront_male_trousers_2: 0.04, mhw_punkduck_female_tight_jeans: 0.08, mhw_punkduck_male_classic_jeans: 0.07,
  mhw_rehmanpolanski_viking_pants: 0.15, mhw_toigo_harem_pants: 0.12, mhw_toigo_wool_pants: 0.07, ewb_sweatpants: 0.17,
};
/* the worn boot (a pack id in a.wear, else the Blender Feet pick) whose top is over a worn pair of trousers' hem, or null */
function pantsBootsWorn(a) {
  if (!a || typeof a !== 'object') return null;
  const W = Array.isArray(a.wear) ? a.wear : [];
  const hem = W.reduce((m, id) => (EW_PANT_HEMS[id] != null && EW_PANT_HEMS[id] < m ? EW_PANT_HEMS[id] : m), Infinity);
  if (hem === Infinity) return null;
  const boot = W.find(id => EW_BOOT_TOPS[id] != null) || (a.feet && EW_MESH_FEET[a.feet] && EW_BOOT_TOPS[a.feet] != null ? a.feet : null);
  return boot && EW_BOOT_TOPS[boot] > hem + 0.02 ? boot : null;
}
const EW_WEAR_PICK_AS_COAT = ['mhw_elvs_emt_uniform_jacket_female', 'mhw_elvs_emt_uniform_jacket_male', 'mhw_punkduck_winter_coat'];
function wearPickKindOf(id) { return EW_WEAR_PICK_AS_COAT.includes(id) ? 'outer' : wearKindOf(id); }
/* a valid wear list: known ids, no repeats, one per single-pick kind (the later pick wins), at most 24 */
function normalizeWearList(list) {
  if (!Array.isArray(list)) return [];
  const out = [], cat = {};
  for (const id of list) {
    const w = EW_MH_WEAR_BY_ID[id];
    if (!w || out.includes(id)) continue;
    const k = wearPickKindOf(id);
    if (!EW_MH_WEAR_MULTI.includes(k) && cat[k] != null) out.splice(out.indexOf(cat[k]), 1);
    cat[k] = id; out.push(id);
  }
  return out.slice(-24);
}
/* THE LAYERS 1 2 3 (2026-11-04): appearance.wear2 = a Tops piece (pack or Blender) worn as LAYER 2, over the Layer 1 top in
   appearance.wear (three-renderer.js setWear lays it over every Layer 1 top and under every coat; a Blender one takes the top2
   fabric / colour / print keys). Not the Layer 1 pick itself; 'none' = not worn. */
function normalizeWear2(id, wear) {
  return typeof id === 'string' && EW_MH_WEAR_BY_ID[id] && wearPickKindOf(id) === 'tops' && !(wear || []).includes(id) ? id : 'none';
}
/* THE SHELVES (2026-11-02, mondo: "Can we organize the character creator better? Like there are wings at the bottom but then there
   are wings in equipment or another tab ... There are male and female clothes scattered all throughout, it should be separated by
   male and female"). How the creator SHOWS the pieces; nothing here changes what a piece is (its category in EW_MH_WEAR stays the
   one the renderer layers by + normalizeWearList's one-per-category rule), so every saved look and race look loads as before.
   EW_WEAR_SHELVES = the creator's tabs in order: [id, label, section ('clothes' | 'accessories'), many (several worn at once)].
   wearShelfOf(id) = the tab a pack / Blender piece shows on (null = shown elsewhere: the facial hair is under FACE).
   wearMadeFor(id) / outerMadeFor(id) = 'male' | 'female' | 'both': the body a piece was made for, read from its pack name
   (female / male / ladies / heroine ...) and its kind (dresses, skirts, lingerie are women's). Both lists show 'both'; a worn piece
   always shows; any piece can be picked on any body (the MEN / WOMEN switch only chooses what the tab lists). */
const EW_WEAR_SHELVES = [
  ['tops', 'Tops', 'clothes'], ['bottoms', 'Bottoms', 'clothes'], ['skirts', 'Skirts', 'clothes'], ['dresses', 'Dresses', 'clothes'],
  ['suits', 'Suits', 'clothes'], ['outer', 'Coats + capes', 'clothes'], ['shoes', 'Shoes', 'clothes'], ['underwear', 'Underwear', 'clothes', true],
  ['gloves', 'Gloves', 'clothes'], ['belts', 'Belts + ties', 'clothes', true], ['hats', 'Hats', 'clothes'], ['glasses', 'Glasses', 'clothes'],
  ['masks', 'Masks', 'clothes'], ['armour', 'Armour', 'clothes', true],
  ['heads', 'Creature heads', 'accessories'],
  ['wings', 'Wings', 'accessories', true], ['horns', 'Horns + antlers', 'accessories', true], ['tails', 'Tails', 'accessories', true],
  ['nails', 'Nails', 'accessories', true], ['gear', 'Held items + gear', 'accessories', true],
  ['held', 'In the hand', 'accessories'], ['jewellery', 'Badges + jewellery', 'accessories', true], ['back', 'Back gear', 'accessories', true],
  ['creature', 'Ears, feet + fins', 'accessories', true],
  ['fur', 'Fur', 'accessories', true],   // THE FUR (bake-fur.py)   // (THE MESHY PIECES; In the hand = one prop at a time, the right hand closed round it)
];
// pieces whose pack category is not where a player looks for them (shown on another tab; their category is unchanged)
const EW_WEAR_SHELF_MOVE = {
  ewb_raggedskirt: 'skirts', ewb_valkyrie: 'skirts', ewb_kilt: 'skirts', ewb_loincloth: 'skirts',   // Blender skirts (Bottoms colour)
  mhw_punkduck_winter_coat: 'outer',                                                               // a coat filed under Dresses
  mhw_rehmanpolanski_viking_boots: 'shoes', mhw_rehmanpolanski_viking_pants: 'bottoms', mhw_rehmanpolanski_viking_tunic: 'tops',   // filed under Suits
  mhw_elvs_emt_uniform_pants_female: 'bottoms', mhw_elvs_emt_uniform_pants_male: 'bottoms',
  mhw_elvs_emt_uniform_jacket_female: 'outer', mhw_elvs_emt_uniform_jacket_male: 'outer',
  ewb_belt: 'belts', ewb_tie: 'belts', ewb_bowtie: 'belts', ewb_suspenders: 'belts', ewb_coinbelt: 'belts',   // worn, not held
  // THE MESHY PIECES (the halo with the hats; the hip pieces with the belts; the tails + moth wings find their tabs by name)
  ewm_brokenhalo: 'hats', ewm_sheriffstar: 'jewellery', ewm_policebadge: 'jewellery', ewm_crosspendant: 'jewellery',
  ewm_talisman: 'jewellery', ewm_hagstone: 'jewellery', ewm_egyptcollar: 'jewellery', ewm_airtank: 'back', ewm_astropack: 'back',
  ewm_backpack: 'back', ewm_jetpack: 'back', ewm_quiver: 'back', ewm_katana: 'back', ewm_dowsingrod: 'back', ewm_dorsalfin: 'creature',
  ewm_mothwings: 'wings', ewm_gunbelt: 'belts', ewm_toolbelt: 'belts', ewm_thighholster: 'belts', ewm_flaregun: 'belts',
  ewm_spyglass: 'belts', ewm_wardtotem: 'belts', ewm_censer: 'belts', ewm_breastplate: 'armour', ewm_shoulderpads: 'armour', ewm_t2cowboy_outfit: 'armour', ewm_t2knight_outfit: 'armour', ewm_t2locke_outfit: 'armour', ewm_t2wizard_outfit: 'armour', ewm_t2zombie_outfit: 'armour', ewm_t2catgirl_outfit: 'armour', ewm_t2robinhood_outfit: 'armour', ewm_t2quarterback_outfit: 'armour', ewm_t2mummy_outfit: 'armour', ewm_t2angel_outfit: 'armour',
  ewm_pauldrons: 'armour', ewm_gauntlets: 'armour', ewm_greaves: 'armour', ewm_armband: 'jewellery', ewm_elfears: 'creature',
  ewm_neckbolts: 'creature', ewm_hooves: 'creature', ewm_beastfeet: 'creature', ewm_beastfeet_fura: 'creature', ewm_beastfeet_furb: 'creature', ewm_trident: 'held', ewm_potionflask: 'held',
  ewm_scalpel: 'held', ewm_wrench: 'held', ewm_blowpipe: 'held', ewm_smartphone: 'held', ewm_handmirror: 'held', ewm_camera: 'held',
  ewm_milkcookies: 'held', ewm_cup: 'held', ewm_magicwand: 'held', ewm_wizardstaff: 'held',
  ewf_fur: 'fur', ewf_fur_werewolf: 'fur',   // THE FUR (category 'underwear' for the layering, its own tab)
};
function wearShelfOf(id) {
  const w = EW_MH_WEAR_BY_ID[id];
  if (!w) return null;
  if (EW_MH_FACIAL_HAIR.includes(id)) return null;
  if (EW_WEAR_SHELF_MOVE[id]) return EW_WEAR_SHELF_MOVE[id];
  if (w[2] === 'equipment') return 'gear';
  if (w[2] === 'bodyparts') {
    const s = (id + ' ' + w[1]).toLowerCase();
    return /wing/.test(s) ? 'wings' : /horn|antler/.test(s) ? 'horns' : /tail/.test(s) ? 'tails' : /nail/.test(s) ? 'nails' : 'gear';
  }
  return w[2];
}
/* THE BODY SLOTS (2026-11-03, mondo: "can we have tabs instead of one long list where i have to scroll through everything. And I want
   the clothes+accessories organized by body part like a typical rpg; head, torso, left arm, right arm, legs, footwear, etc."). How the
   creator's OUTFIT tab SHOWS the pieces: one tab per body part (EW_WEAR_SLOTS), and inside it one kind at a time (EW_WEAR_GROUPS).
   DISPLAY ONLY, like THE SHELVES under it: a piece keeps its shelf (wearShelfOf) for the one-pick-per-shelf rule, its EW_MH_WEAR
   category for the renderer, and every saved / baked look loads as before. No piece was removed or renamed.
   EW_WEAR_SLOTS = [id, label, camera ('face' | 'body')]. 'arms' is not a tab: a pair (gloves, nails, sleeves, arm armour) covers both
   arms, so it shows on LEFT ARM and on RIGHT ARM (one piece, the same tile). Left / right = the side of the body the piece sits on in the
   MPFB bind pose (+x = the character's left: the pack's "left hand" gun + kalistick, the wooden bow, the shopping bag, the arm band; the
   In the hand props, the pack's other weapons, the grapple gauntlet sit on the right).
   EW_WEAR_GROUPS = [slot, id, label, sided (lists by the MEN / WOMEN switch), layer (the coded / Blender layer rows shown with it)]. */
const EW_WEAR_SLOTS = [
  ['head', 'Head', 'face'], ['face', 'Face', 'face'], ['neck', 'Neck', 'body'], ['torso', 'Torso', 'body'], ['back', 'Back', 'body'],
  ['larm', 'Left arm', 'body'], ['rarm', 'Right arm', 'body'], ['waist', 'Waist', 'body'], ['legs', 'Legs', 'body'], ['feet', 'Footwear', 'body'],
];
const EW_WEAR_GROUPS = [
  ['head', 'hats', 'Hats + helmets', true], ['head', 'heads', 'Creature heads'], ['head', 'horns', 'Horns + antlers'], ['head', 'ears', 'Ears'],
  ['head', 'headgear', 'Headsets'],
  ['face', 'glasses', 'Glasses + goggles', true], ['face', 'masks', 'Masks + hoods', true],
  ['neck', 'neckwear', 'Ties + neckwear'], ['neck', 'pendants', 'Pendants'],
  /* THE LAYERS 1 2 3 (2026-11-04, mondo: "there really needs to be some sort of layer system in the character creator. Like layer 1,
     2, and 3. I dont like how i can only add an outer layer of coats"): the Tops and the Coats + jackets kinds are one kind now, the
     three torso layers from the skin out (party-builder.js ccTorsoLayers): LAYER 1 = a shirt / top (the 'tops' group's pieces, the
     Tops shelf pick), LAYER 2 = a second shirt / top over it (appearance.wear2), a vest / jacket / coat (the Outer layer) or a pack
     coat (the 'coats' group), LAYER 3 = a coat over all of it (the second outer layer, appearance.outer2). The 'tops' + 'coats'
     groups keep their pieces (wearGroupOf); only their own chips are gone. */
  ['torso', 'layers', 'Layers 1 \u00b7 2 \u00b7 3', true, 'layers'], ['torso', 'dresses', 'Dresses', true], ['torso', 'suits', 'Suits + bodysuits', true],
  ['torso', 'underwear', 'Underwear + swimwear', true],
  ['torso', 'chestarmour', 'Armour + vests'], ['torso', 'badges', 'Badges + straps'], ['torso', 'fur', 'Fur'],
  ['back', 'capes', 'Capes', false, 'cape'], ['back', 'wings', 'Wings', false, 'wings'], ['back', 'backgear', 'Back gear'], ['back', 'tails', 'Tails + fins'],
  ['rarm', 'held', 'In the hand'], ['rarm', 'rgear', 'Weapons + tools'], ['rarm', 'rbags', 'Bags'], ['rarm', 'rarmgear', 'On the arm'],
  ['larm', 'lgear', 'Weapons + tools'], ['larm', 'lbags', 'Bags'], ['larm', 'larmgear', 'On the arm'],
  ['arms', 'gloves', 'Gloves + claws', true], ['arms', 'nails', 'Nails'], ['arms', 'sleeves', 'Arm sleeves', true], ['arms', 'armarmour', 'Shoulder + arm armour'],
  ['waist', 'belts', 'Belts'], ['waist', 'hip', 'On the hip'],
  ['legs', 'bottoms', 'Bottoms', true], ['legs', 'skirts', 'Skirts', true], ['legs', 'socks', 'Socks + stockings', true], ['legs', 'leggear', 'Holsters + greaves'],
  ['feet', 'shoes', 'Shoes + boots', true, 'feet'], ['feet', 'hooves', 'Hooves + claws'], ['feet', 'toenails', 'Toenails'],
];
// a shelf's pieces go to one group, but where a shelf holds pieces for several body parts (gear, armour, badges, belts ...) each is named
const EW_WEAR_GROUP_OF_SHELF = { tops: 'tops', dresses: 'dresses', suits: 'suits', outer: 'coats', underwear: 'underwear', bottoms: 'bottoms',
  skirts: 'skirts', shoes: 'shoes', hats: 'hats', heads: 'heads', horns: 'horns', glasses: 'glasses', masks: 'masks', gloves: 'gloves',
  nails: 'nails', wings: 'wings', tails: 'tails', back: 'backgear', held: 'held', gear: 'rgear', armour: 'chestarmour', jewellery: 'pendants',
  belts: 'belts', creature: 'hooves', fur: 'fur' };
const EW_WEAR_GROUP_MOVE = {
  // gear (the pack's equipment): left hand, both hands, the head, the neck, the chest, the back, the hip
  mhw_culturalibre_cl_gun_left_hand: 'lgear', mhw_culturalibre_hero_kalistick_lefthanded: 'lgear', mhw_culturalibre_wooden_bow: 'lgear',
  mhw_punkduck_shopping_bag01: 'lbags', mhw_punkduck_handbag01: 'rbags', mhw_elvs_sling_purse1: 'rbags', mhw_culturalibre_suitcase: 'rbags',
  ewm_grapplegauntlet: 'rarmgear', mhw_culturalibre_hand_claws: 'gloves',
  mhw_punkduck_head_mirror: 'headgear', mhw_punkduck_wireless_headset: 'headgear',
  mhw_punkduck_stethoscope: 'neckwear', ewm_binoculars: 'neckwear',
  mhw_mindfront_tactical_vest_female: 'chestarmour', mhw_mindfront_tactical_vest_male: 'chestarmour', ewm_walkietalkie: 'badges',
  mhw_punkduck_diver_scuba_rig: 'backgear', mhw_punkduck_electric_guitar: 'backgear', mhw_o4saken_dagger: 'hip',
  // armour by the part it covers
  ewm_shoulderpads: 'armarmour', ewm_pauldrons: 'armarmour', ewm_gauntlets: 'armarmour', ewm_greaves: 'leggear',
  // badges + jewellery
  ewm_sheriffstar: 'badges', ewm_policebadge: 'badges', ewm_egyptcollar: 'neckwear', ewm_armband: 'larmgear',
  // belts + ties
  ewb_tie: 'neckwear', ewb_bowtie: 'neckwear', ewb_suspenders: 'badges', ewm_thighholster: 'leggear',
  ewm_flaregun: 'hip', ewm_spyglass: 'hip', ewm_wardtotem: 'hip', ewm_censer: 'hip',
  // creature parts
  ewm_elfears: 'ears', ewm_neckbolts: 'neckwear', ewm_dorsalfin: 'tails',
  // toenails go on the feet
  mhw_mindfront_nails_toes_01: 'toenails',
};
const _ewWearGroup = {};
function wearGroupOf(id) {
  if (id in _ewWearGroup) return _ewWearGroup[id];
  const shelf = wearShelfOf(id);
  let g = null;
  if (shelf) {
    g = EW_WEAR_GROUP_MOVE[id] || null;
    if (!g && shelf === 'underwear') {
      const s = (id + ' ' + ((EW_MH_WEAR_BY_ID[id] || [])[1] || '')).toLowerCase();
      g = /arm ?sleeve/.test(s) ? 'sleeves' : /stocking|sock|pantyhose|leg warmer/.test(s) && !/suspender/.test(s) ? 'socks' : 'underwear';
    }
    if (!g && shelf === 'nails' && /toe/i.test(id)) g = 'toenails';
    if (!g) g = EW_WEAR_GROUP_OF_SHELF[shelf] || 'rgear';
  }
  return (_ewWearGroup[id] = g);
}
// the body part (EW_WEAR_SLOTS id, or 'arms' for a pair) a group / a piece is on
function wearSlotOfGroup(g) { const r = EW_WEAR_GROUPS.find(x => x[1] === g); return r ? r[0] : null; }
function wearSlotOf(id) { return wearSlotOfGroup(wearGroupOf(id)); }
// read from the pack names: women's / men's by name, then by kind; the rest fit anyone
const EW_WEAR_FOR_FEMALE = ['mhw_toigo_bodice-style_top', 'mhw_toigo_camisole_top', 'mhw_elvs_disco_top_1_butterfly', 'mhw_elvs_disco_top2',
  'mhw_toigo_keyhole_tank_top', 'mhw_elvs_lara_tank1', 'mhw_punkduck_off-shoulder_long-sleeve_top', 'mhw_punkduck_retro_top',
  'mhw_punkduck_spaghetti_strap_tank_top', 'ewb_bellytop', 'ewb_offshoulder',
  'mhw_elvs_disco_pants_double_ruffles', 'mhw_elvs_disco_pants_single_ruffles', 'mhw_elvs_disco_pants_skinny', 'ewb_raggedskirt', 'ewb_valkyrie',
  'mhw_punkduck_string_2', 'mhw_punkduck_string_4', 'mhw_punkduck_string_5', 'mhw_toigo_lace_frill_socks',
  'mhw_toigo_ballet_flats', 'mhw_toigo_ballet_flats_with_bows', 'mhw_toigo_ballet_flats_with_flowers', 'mhw_dressupdoc_balletflat1', 'mhw_toigo_flats',
  'mhw_elvs_flatshoe_bow1', 'mhw_elvs_flatshoe_buckle_1', 'mhw_elvs_flatshoe_gemmed1', 'mhw_elvs_flatshoe_plain1', 'mhw_elvs_flatshoe_pointy1',
  'mhw_cortu_floppy_overknee_shoes', 'mhw_scailman_gogo_platform_boots', 'mhw_punkduck_kill_bill_shoes', 'mhw_elvs_knee_high_heel_boots1',
  'mhw_dressupdoc_maryjane1', 'mhw_toigo_stiletto_booties', 'mhw_cortu_t-bar', 'mhw_elvs_wedge_tall_boots1', 'mhw_scailman_low-heeled_boots',
  'mhw_elvs_charity_veil1', 'mhw_elvs_dirty_lil_maid_bonnet', 'mhw_aethelraed_unraed_cloche_hat',
  'mhw_slayer227_spider-gwen', 'mhw_green_tomato_rei_ayanami', 'mhw_green_tomato_yoko_tsuno', 'mhw_elvs_halter_style_pantsuit1'];
const EW_WEAR_FOR_MALE = ['mhw_culturalibre_hero_suit_1', 'mhw_culturalibre_hero_suit_2', 'mhw_culturalibre_hero_suit_3',
  'mhw_culturalibre_hero_boots_1', 'mhw_culturalibre_hero_boots_2', 'mhw_culturalibre_hero_boots_3', 'mhw_culturalibre_hero_boots_4', 'mhw_culturalibre_hero_boots_5',
  'mhw_culturalibre_hero_mask_1', 'mhw_culturalibre_hero_mask_2', 'mhw_culturalibre_hero_mask_3', 'mhw_culturalibre_hero_mask_4', 'mhw_culturalibre_hero_mask_5',
  'mhw_rehmanpolanski_viking_boots', 'mhw_rehmanpolanski_viking_pants', 'mhw_rehmanpolanski_viking_tunic',
  'mhw_toigo_suit_with_dinner_jacket', 'mhw_toigo_suit_with_jacket_and_bowtie'];
const EW_WEAR_BOTH = ['ewf_fur', 'ewf_fur_werewolf', 'ewb_kilt', 'ewb_loincloth', 'mhw_punkduck_winter_coat',
  'mhw_v0rt3x_armsleeves_black_fishnet_large', 'mhw_v0rt3x_armsleeves_black_fishnet_medium', 'mhw_v0rt3x_armsleeves_black_fishnet_small',
  'mhw_v0rt3x_armsleeves_white_fishnet_large', 'mhw_v0rt3x_armsleeves_white_fishnet_medium', 'mhw_v0rt3x_armsleeves_white_fishnet_small',
  'mhw_marco_105_armsleeve02', 'mhw_joepal_crude_high_socks', 'mhw_joepal_crude_low_socks', 'mhw_toigo_leg_warmer_socks', 'mhw_punkduck_sport_briefs'];
const _ewWearFor = {};
function wearMadeFor(id) {
  if (_ewWearFor[id]) return _ewWearFor[id];
  const w = EW_MH_WEAR_BY_ID[id];
  let g = 'both';
  if (w) {
    const s = ' ' + (id + ' ' + w[1]).toLowerCase().replace(/[_-]+/g, ' ').replace(/([a-z])(\d)/g, '$1 $2') + ' ';
    if (EW_WEAR_BOTH.includes(id) || / hero heroine /.test(s)) g = 'both';
    else if (EW_WEAR_FOR_FEMALE.includes(id)) g = 'female';
    else if (EW_WEAR_FOR_MALE.includes(id)) g = 'male';
    else if (/ (female|ladies|lady|heroine|girly|woman|women|f) /.test(s)) g = 'female';
    else if (/ (male|men|m) /.test(s)) g = 'male';
    else if (w[2] === 'dresses' || w[2] === 'skirts' || w[2] === 'underwear') g = 'female';
    else if (/ (blouse|crop|tube|halter|camisole|bodice|bra|bikini|lingerie|gown|dress|skirt|qipao|swimsuit) /.test(s)) g = 'female';
  }
  return (_ewWearFor[id] = g);
}
// the Outer layer picks made on a woman (the rest of the coats, robes and uniforms fit anyone)
const EW_OUTER_FOR_FEMALE = ['bhabit', 'bsuccubus', 'bleafdress'];
// the Outer layer picks in kinds (a pick in none of them shows under "Other")
const EW_OUTER_GROUPS = [
  // (THE LAYERS 1 2 3, 2026-11-04: the short pieces apart from the long coats, so a layer lists vests + jackets / coats as their own rows)
  ['Vests + jackets', ['bvest', 'bjacket', 'bblazer', 'bcardigan', 'bfringe']],
  ['Coats', ['btrench', 'bduster', 'bpirate', 'bleather', 'blongcoat', 'bgreatcoat', 'bovercoat', 'bfrock', 'btailcoat', 'blabcoat']],
  ['Robes', ['bcassock', 'bhabit', 'bcultrobe', 'banunnaki', 'bsuccubus', 'braggedrobe']],
  ['Uniforms', ['bpolice', 'bgeneral', 'bturnout', 'briot', 'bchef', 'bgi', 'bjersey']],
  ['Costumes', ['bsanta', 'brobinhood', 'btabard', 'bkrampus', 'bscarecrow', 'bzombie', 'bclown', 'bleafdress']],
];
function outerMadeFor(id) { return EW_OUTER_FOR_FEMALE.includes(id) ? 'female' : 'both'; }
const EW_HAIR_STYLE_IDS = EW_HAIR_STYLES.map(s => s.id);
// key → { label, file, repeat (tiles per UV unit), rough (0..1), metal (0..1) }
const EW_FABRICS = {
  plain:         { label: 'Plain',       file: null,                          repeat: 0,  rough: 0.92, metal: 0 },
  cotton:        { label: 'Cotton',      file: 'cotton_basecolor.png',        repeat: 16, rough: 0.95, metal: 0 },
  cloth:         { label: 'Cloth',       file: 'cloth_basecolor.png',         repeat: 14, rough: 0.95, metal: 0 },
  denim:         { label: 'Denim',       file: 'denim_basecolor.png',         repeat: 12, rough: 0.9,  metal: 0 },
  wool:          { label: 'Wool',        file: 'wool_basecolor.png',          repeat: 12, rough: 1,    metal: 0 },
  'ribbed-knit': { label: 'Ribbed knit', file: 'ribbed-knit_basecolor.png',   repeat: 10, rough: 1,    metal: 0 },
  canvas:        { label: 'Canvas',      file: 'canvas_basecolor.png',        repeat: 12, rough: 0.95, metal: 0 },
  nylon:         { label: 'Nylon',       file: 'nylon_basecolor.png',         repeat: 14, rough: 0.6,  metal: 0 },
  mesh:          { label: 'Mesh',        file: 'mesh_basecolor.png',          repeat: 16, rough: 0.8,  metal: 0 },
  silk:          { label: 'Silk',        file: 'silk_basecolor.png',          repeat: 14, rough: 0.35, metal: 0 },
  velvet:        { label: 'Velvet',      file: 'velvet_basecolor.png',        repeat: 12, rough: 0.98, metal: 0 },
  leather:       { label: 'Leather',     file: 'leather_basecolor.png',       repeat: 8,  rough: 0.55, metal: 0 },
  suede:         { label: 'Suede',       file: 'suede_basecolor.png',         repeat: 10, rough: 0.98, metal: 0 },
  rubber:        { label: 'Rubber',      file: 'rubber_basecolor.png',        repeat: 10, rough: 0.45, metal: 0 },
  chainmail:     { label: 'Chainmail',   file: 'chainmail_basecolor.png',     repeat: 14, rough: 0.45, metal: 0.8 },
  metal:         { label: 'Plate',       file: 'metal_basecolor.png',         repeat: 6,  rough: 0.35, metal: 0.9 },
  brass:         { label: 'Brass',       file: 'brass_basecolor.png',         repeat: 6,  rough: 0.4,  metal: 0.9 },
};
const EW_FABRIC_IDS = Object.keys(EW_FABRICS);
// THE PATTERNS (rev 8, 2026-09-13): a PRINT over any fabric in two colours —
// the layer's tint is the ground (colour 1), `<layer>Color2` the print. Drawn
// per texel by three-renderer.js _ccPatternMask (pure maths: the browser's
// canvas, the builder's swatches and creator-render.js all share it) and
// multiplied onto the fabric tile. `solid` = no print (the v2 look).
const EW_PATTERNS = [
  { id: 'solid',     label: 'Solid' },
  { id: 'stripes',   label: 'Stripes' },
  { id: 'hoops',     label: 'Hoops' },
  { id: 'pinstripe', label: 'Pinstripe' },
  { id: 'polka',     label: 'Polka dots' },
  { id: 'checks',    label: 'Checks' },
  { id: 'gingham',   label: 'Gingham' },
  { id: 'plaid',     label: 'Plaid' },
  { id: 'chevron',   label: 'Chevron' },
  { id: 'argyle',    label: 'Argyle' },
  { id: 'camo',      label: 'Camo' },
  { id: 'stars',     label: 'Stars' },
  // rev 10 (2026-09-13): eight more prints — the horizontal pinstripe, hearts, fine dots, diamonds, houndstooth, zebra, leopard, crosshatch
  { id: 'hpinstripe',  label: 'H. pinstripe' },
  { id: 'hearts',      label: 'Hearts' },
  { id: 'minidots',    label: 'Fine dots' },
  { id: 'diamonds',    label: 'Diamonds' },
  { id: 'houndstooth', label: 'Houndstooth' },
  { id: 'zebra',       label: 'Zebra' },
  { id: 'leopard',     label: 'Leopard' },
  { id: 'crosshatch',  label: 'Crosshatch' },
];
const EW_PATTERN_IDS = EW_PATTERNS.map(p => p.id);
// THE WARDROBE (rev 7, 2026-09-12): the id is what saves carry (`suit` = the v1
// long sleeve; the v1 `jacket` TOP maps to the OUTER layer), the cut lives in
// three-renderer.js CC_TOPS / CC_OUTER / CC_BOTTOMS / CC_FEET / CC_GLOVES.
// Builder order. Every layer takes a fabric + a tint of its own.
const EW_OUTFIT_STYLES = [
  { id: 'tee',    label: 'T-shirt' },
  { id: 'vneck',  label: 'V-neck' },
  { id: 'suit',   label: 'Long sleeve' },
  { id: 'crop',   label: 'Crop top' },
  { id: 'tank',   label: 'Tank top' },
  { id: 'atank',  label: 'Athletic tank' },
  { id: 'racer',  label: 'Racerback' },
  { id: 'tube',   label: 'Tube top' },
  { id: 'bikini', label: 'Bikini top' },
  { id: 'dress',  label: 'Dress' },
  { id: 'gown',   label: 'Gown' },
  // rev 9 (2026-09-13): a polo (band collar, three buttons) and a henley (the placket alone)
  { id: 'polo',   label: 'Polo' },
  { id: 'henley', label: 'Henley' },
  // rev 10 (2026-09-13): TOPLESS — no top shell at all (the skin shows; an outer layer / neckwear sit on the body)
  { id: 'none',   label: 'Topless' },
];
// rev 10: THE EXTRA LAYERS — a second top worn OVER the top (`outfit2`) and a second pair of bottoms worn OVER the
// bottoms (`bottoms2`: briefs over trousers = the superhero) at a larger stand-off; 'none' = not worn. The builder's
// ＋ ADD LAYER button sets them; each carries its own fabric / tint / print keys (EW_APPEARANCE_LAYERS top2 / bottom2).
const EW_OUTFIT2_IDS = ['none'].concat(EW_OUTFIT_STYLES.map(o => o.id).filter(id => id !== 'none'));
const EW_BOTTOM_STYLES = [
  { id: 'trousers',    label: 'Trousers' },
  { id: 'shorts',      label: 'Shorts' },
  { id: 'shortshorts', label: 'Short shorts' },
  { id: 'briefs',      label: 'Briefs' },
  { id: 'bikini',      label: 'Bikini bottom' },
  { id: 'miniskirt',   label: 'Mini skirt' },
  { id: 'skirt',       label: 'Skirt' },
  { id: 'longskirt',   label: 'Long skirt' },
  // rev 9: the loose cuts
  { id: 'baggy',       label: 'Baggy pants' },
  { id: 'cargo',       label: 'Cargo pants' },
  { id: 'sweatpants',  label: 'Sweatpants' },
];
const EW_BOTTOMS2_IDS = ['none'].concat(EW_BOTTOM_STYLES.map(o => o.id));
const EW_OUTER_STYLES = [
  { id: 'none',   label: 'None' },
  { id: 'jacket', label: 'Jacket' },
  { id: 'blazer', label: 'Blazer' },
  { id: 'vest',   label: 'Vest' },
  { id: 'coat',   label: 'Coat' },
  // rev 9: four more second layers
  { id: 'cardigan', label: 'Cardigan' },
  { id: 'hoodie',   label: 'Hoodie' },
  { id: 'trench',   label: 'Trench coat' },
  { id: 'parka',    label: 'Parka' },
  // 2026-11-01 THE BLENDER COAT (character-models-plan.md row 12): built as a real mesh in cloud Blender (bake-garment.py), worn
  // on the MPFB bodies with the outer layer's fabric / colour / print; a classic base wears the coded trench instead
  { id: 'btrench',  label: 'Trench coat (Blender)' },
];
// the Blender-built outer layers: style id -> its GLB in charactercreation/wear/ (an MPFB body only; three-renderer.js CC_MESH_OUTER)
const EW_MESH_OUTERS = { btrench: 'ewb_trench' };
/* THE BLENDER CAPES (2026-11-01, docs/notes/character-models-plan.md row 12, list 4d): capes and cloaks built as real meshes
   in cloud Blender (bake-clothes.py -> charactercreation/wear/ewb_cape_<name>.glb) on the five MPFB bodies (the two classic
   MPFB bodies wear them through the reshape), worn on their OWN layer (appearance.cape) OVER everything else, so a cape goes
   with any coat. The cape layer takes a fabric, a tint and a print like every layer; `look` = the tint + fabric a pick
   starts with (the race it was made for). A cape hangs on spring chains (three-renderer.js THE BLENDER CAPES). MPFB
   bodies only (the classic Meshy bases are not the MakeHuman frame). `own` = the cloak keeps its own tile (fur, leaves). */
const EW_CAPE_STYLES = [
  { id: 'none',            label: 'None' },
  { id: 'bcape_king',      label: 'Royal cape',     file: 'ewb_cape_king',     look: { color: '#7a1f1f', fabric: 'velvet' } },   // King Arthur
  { id: 'bcape_overlord',  label: 'Overlord cape',  file: 'ewb_cape_overlord', look: { color: '#141518', fabric: 'silk' } },     // overlord
  { id: 'bcape_hero',      label: 'Hero cape',      file: 'ewb_cape_hero',     look: { color: '#c0392b', fabric: 'nylon' } },    // superhero / antihero
  { id: 'bcape_sea',       label: 'Sea cape',       file: 'ewb_cape_sea',      look: { color: '#1f5f8b', fabric: 'silk' } },     // atlantean
  { id: 'bcape_knight',    label: 'Knight cloak',   file: 'ewb_cape_knight',   look: { color: '#344a50', fabric: 'wool' } },     // knight
  { id: 'bcape_hooded',    label: 'Hooded cape',    file: 'ewb_cape_hooded',   look: { color: '#5b3a8a', fabric: 'cotton' } },   // Kit (cast)
  { id: 'bcape_leaf',      label: 'Leaf cloak',     file: 'ewb_cape_leaf',     look: { color: '#9fbf6a', fabric: 'canvas' }, own: true },   // shaman
  { id: 'bcape_fur',       label: 'Fur cloak',      file: 'ewb_cape_fur',      look: { color: '#b08060', fabric: 'suede' }, own: true },    // giant
];
const EW_CAPE_BY_ID = {};
for (const c of EW_CAPE_STYLES) EW_CAPE_BY_ID[c.id] = c;
function getCapeMeshUrl(id) { const c = EW_CAPE_BY_ID[id]; return c && c.file ? EW_CHARACTER_ASSET_BASE + '/wear/' + c.file + '.glb' : null; }
/* THE BLENDER COATS (2026-11-01, character-models-plan.md row 12, list 4d "Long coats"): built in cloud Blender like the trench
   (bake-clothes.py -> charactercreation/wear/ewb_<id>.glb), Outer layer picks on the MPFB bodies (a classic Meshy base wears the
   coded twin, three-renderer.js CC_MESH_OUTER). `look` = the tint + fabric a pick starts at (the race it was made for). */
const EW_BLENDER_COATS = [
  { id: 'bduster',    label: 'Duster',       look: { color: '#8a6a45', fabric: 'canvas' } },    // cowboy
  { id: 'bpirate',    label: 'Pirate coat',  look: { color: '#6e1c1c', fabric: 'wool' } },      // pirate
  { id: 'bleather',   label: 'Leather coat', look: { color: '#151517', fabric: 'leather' } },   // telepath
  { id: 'blongcoat',  label: 'Long coat',    look: { color: '#3d4148', fabric: 'wool' } },      // homosapien
  { id: 'bgreatcoat', label: 'Greatcoat',    look: { color: '#4c5236', fabric: 'wool' } },      // marksman
  { id: 'bovercoat',  label: 'Overcoat',     look: { color: '#5a5048', fabric: 'wool' } },     // conspiracy
  { id: 'bfrock',     label: 'Frock coat',   look: { color: '#1d1a24', fabric: 'velvet' } },    // Dorian
  { id: 'btailcoat',  label: 'Tailcoat',     look: { color: '#a3161c', fabric: 'wool' } },      // ringmaster
  { id: 'blabcoat',   label: 'Lab coat',     look: { color: '#eef0ee', fabric: 'cotton' } },    // scientist
  // 4d batch 3: the robes (to the ankle)
  { id: 'bcassock',   label: 'Cassock',        look: { color: '#121214', fabric: 'wool' } },     // priest
  { id: 'bhabit',     label: "Nun's habit",    look: { color: '#141416', fabric: 'wool' } },     // nun
  { id: 'bcultrobe',  label: 'White robe',     look: { color: '#f2f0ea', fabric: 'cotton' } },   // cult leader
  { id: 'banunnaki',  label: 'Annunaki robe',  look: { color: '#d9c7a0', fabric: 'silk' } },     // Annunaki
  { id: 'bsuccubus',  label: 'Silk robe',      look: { color: '#5a0f1e', fabric: 'silk' } },     // succubus
  { id: 'braggedrobe', label: 'Ragged robe',   look: { color: '#6b5a44', fabric: 'canvas' } },   // giant
  // 4d batch 4: uniforms + fighters
  { id: 'bpolice',    label: 'Police uniform',  look: { color: '#1c2740', fabric: 'cotton' } },   // police
  { id: 'bgeneral',   label: 'General uniform', look: { color: '#3f4a30', fabric: 'wool' } },     // general
  { id: 'bturnout',   label: 'Turnout coat',    look: { color: '#b59a62', fabric: 'canvas' } },   // firefighter
  { id: 'briot',      label: 'Riot suit',       look: { color: '#17181b', fabric: 'nylon' } },    // time cop
  { id: 'bchef',      label: 'Chef jacket',     look: { color: '#f4f4f0', fabric: 'cotton' } },   // chef
  { id: 'bgi',        label: 'Gi',              look: { color: '#f1efe8', fabric: 'canvas' } },   // ki fighter
  { id: 'bjersey',    label: 'Football jersey', look: { color: '#7a1b1b', fabric: 'mesh' } },     // football player
  // 4d batch 5a: the costumes (fur trims, the harness, fringe, patches = accents in the GLB)
  { id: 'bsanta',     label: 'Santa coat',       look: { color: '#b3141c', fabric: 'velvet' } },  // Santa Clause
  { id: 'brobinhood', label: 'Robin Hood tunic', look: { color: '#3f6b2a', fabric: 'wool' } },    // Robin Hood
  { id: 'btabard',    label: 'Knight tabard',    look: { color: '#eae6da', fabric: 'cotton' } },  // knight
  { id: 'bkrampus',   label: 'Krampus fur coat', look: { color: '#5a4636', fabric: 'suede' } },   // Krampus (its own fur tile)
  { id: 'bfringe',    label: 'Fringe jacket',    look: { color: '#a0703f', fabric: 'suede' } },   // hippie
  { id: 'bscarecrow', label: 'Scarecrow tunic',  look: { color: '#9c7f4e', fabric: 'canvas' } },  // scarecrow
  { id: 'bzombie',    label: 'Tattered shirt',   look: { color: '#7d7a68', fabric: 'cotton' } },  // zombie
  { id: 'bclown',     label: 'Clown suit',       look: { color: '#e0c43a', fabric: 'cotton' } },  // clown
  // 4d batch 5b: the leaf dress (its own leaf tile, the hem sways)
  { id: 'bleafdress', label: 'Leaf dress',       look: { color: '#7fa85a', fabric: 'canvas' } },  // fairy
  // 2026-11-02 THE BLENDER BASICS: the classic Outer picks no pack has (EW_RETIRED_CLOTHES); no `look`: they keep the colour picked
  { id: 'bjacket',    label: 'Jacket' },
  { id: 'bblazer',    label: 'Blazer' },
  { id: 'bvest',      label: 'Waistcoat' },
  { id: 'bcardigan',  label: 'Cardigan' },
];
for (const c of EW_BLENDER_COATS) { EW_OUTER_STYLES.push(c); EW_MESH_OUTERS[c.id] = 'ewb_' + c.id.slice(1); }
/* THE OPEN + CLOSED FRONTS (2026-11-02, mondo: "any coat or jacket etc option needs to have an open and closed option. there are
   some great long coats that i want to use for the cowboy but they are closed when his original model his coat is open"):
   every Outer pick with a front opening wears either front (appearance.outerFront / outer2Front: 'auto' = as the pick was made,
   'open', 'closed'). EW_OUTER_FRONT = the front a pick was made with; a Blender pick listed in EW_OUTER_FRONT_ALT has its other
   front baked as ewb_<name>_<front>.glb (bake-clothes.py FRONTS). Pullovers (the habit, the jersey, the tunics, the tabard, the
   clown suit, the leaf dress) have no front to open. */
const EW_OUTER_FRONT = { bjacket: 'closed', bblazer: 'closed', bvest: 'closed', bcardigan: 'closed',
  bduster: 'closed', bpirate: 'open', bleather: 'closed', blongcoat: 'closed', bgreatcoat: 'closed', bovercoat: 'closed', bfrock: 'closed', btailcoat: 'closed', blabcoat: 'closed',
  bcassock: 'closed', bcultrobe: 'closed', banunnaki: 'closed', bsuccubus: 'closed', braggedrobe: 'closed',
  bpolice: 'closed', bgeneral: 'closed', bturnout: 'closed', briot: 'closed', bchef: 'closed', bgi: 'closed',
  bsanta: 'closed', bkrampus: 'closed', bfringe: 'open', bscarecrow: 'closed', bzombie: 'open' };
const EW_OUTER_FRONT_ALT = ['bjacket', 'bblazer', 'bvest', 'bcardigan', 'bduster', 'bpirate', 'bleather', 'blongcoat', 'bgreatcoat', 'bovercoat', 'bfrock', 'btailcoat', 'blabcoat', 'bcassock', 'bcultrobe', 'banunnaki',
  'bsuccubus', 'braggedrobe', 'bpolice', 'bgeneral', 'bturnout', 'briot', 'bchef', 'bgi', 'bsanta', 'bkrampus', 'bfringe', 'bscarecrow', 'bzombie'];
function outerHasFronts(id) { return !!EW_OUTER_FRONT[id] && !!EW_MESH_OUTERS[id] && EW_OUTER_FRONT_ALT.includes(id); }
// the front worn: the pick's own unless the layer's front key asks for the other one (and the pick has it)
function outerFrontWorn(id, front) { const own = EW_OUTER_FRONT[id] || null; return own && outerHasFronts(id) && (front === 'open' || front === 'closed') ? front : own; }
function getOuterMeshUrl(id, front) {
  if (!EW_MESH_OUTERS[id]) return null;
  const f = outerFrontWorn(id, front), alt = f && f !== EW_OUTER_FRONT[id] ? '_' + f : '';
  return EW_CHARACTER_ASSET_BASE + '/wear/' + EW_MESH_OUTERS[id] + alt + '.glb';
}
const EW_FEET_STYLES = [
  { id: 'none',      label: 'Barefoot' },
  { id: 'sneakers',  label: 'Sneakers' },
  { id: 'boots',     label: 'Boots' },
  { id: 'highboots', label: 'High boots' },
  { id: 'sandals',   label: 'Sandals' },   // rev 9
];
/* THE BLENDER SHOES (2026-11-01, docs/notes/character-models-plan.md row 12c; mondo: "can you redo the shoes in blender like you
   did the capes"): the four coded Feet picks rebuilt as real shoes in cloud Blender (bake-clothes.py SHOES -> charactercreation/
   wear/ewb_shoe_<name>.glb) on the five MPFB bodies: a sole with its own rubber, an upper over the foot's eased hull, laces /
   straps / pull tabs as pieces; + cowboy boots (no pack has them). The Feet layer's fabric / colour / print paints the upper; a
   classic Meshy base wears the coded twin (three-renderer.js CC_MESH_FEET). The coded picks stay. `look` = where a pick starts. */
const EW_BLENDER_FEET = [
  { id: 'bsneakers',  label: 'Sneakers (Blender)',   file: 'ewb_shoe_sneakers' },
  { id: 'bboots',     label: 'Boots (Blender)',      file: 'ewb_shoe_boots' },
  { id: 'bhighboots', label: 'High boots (Blender)', file: 'ewb_shoe_highboots' },
  { id: 'bsandals',   label: 'Sandals (Blender)',    file: 'ewb_shoe_sandals' },
  { id: 'bcowboy',    label: 'Cowboy boots',         file: 'ewb_shoe_cowboy', look: { color: '#7a4a26', fabric: 'leather' } },
];
const EW_MESH_FEET = {};
for (const c of EW_BLENDER_FEET) { EW_FEET_STYLES.push(c); EW_MESH_FEET[c.id] = c.file; }
function getFeetMeshUrl(id) { return EW_MESH_FEET[id] ? EW_CHARACTER_ASSET_BASE + '/wear/' + EW_MESH_FEET[id] + '.glb' : null; }
const EW_GLOVE_STYLES = [
  { id: 'none',       label: 'None' },
  { id: 'gloves',     label: 'Gloves' },
  { id: 'longgloves', label: 'Long gloves' },
];
const EW_BELT_STYLES = [
  { id: 'none', label: 'None' },
  { id: 'belt', label: 'Belt' },
];
// rev 9 (2026-09-13): THE ACCESSORIES — neckwear on the top (under any outer layer) and glasses on the measured eyes;
// each wears one colour (`tieColor` / `glassesColor`), no fabric. Cut in three-renderer.js buildDetails.
const EW_NECKWEAR_STYLES = [
  { id: 'none',   label: 'None' },
  { id: 'tie',    label: 'Tie' },
  { id: 'bowtie', label: 'Bow tie' },
];
const EW_GLASSES_STYLES = [
  { id: 'none',   label: 'None' },
  { id: 'round',  label: 'Round' },
  { id: 'square', label: 'Square' },
  { id: 'shades', label: 'Shades' },
];
// 2026-10-27 (mondo: "add the wings to the character creator too"): his wings worn on the upper back, riding the chest bone, each wing beating on its own; one colour
// (`wingsColor`). Hung in three-renderer.js _createAppearanceRig (setWings).
// 2026-10-27 (mondo: "I added angel wings with a much smaller poly count, can you use these wings instead for the
// character creator"): his single angel wing, doubled and mirrored (three-renderer.js THE SINGLE WINGS).
const EW_WINGS_URL = 'https://cdn.entropywars.net/Assets/characters/gear/wings/Meshy_AI_one_angel_wing_1027074635_texture.glb';
const EW_WINGS_STYLES = [
  { id: 'none',      label: 'None' },
  { id: 'feathered', label: 'Feathered', url: EW_WINGS_URL },
  /* 2026-11-02 (mondo: "there are indeed bat wing and dragon wing models that should be included in the same section as the feathered
     wings"): his single bat wing (the Occulus's) and dragon wing (Hoard, the dragon's finisher), doubled and mirrored the same way */
  { id: 'bat',       label: 'Bat',       url: 'https://cdn.entropywars.net/Assets/characters/gear/wings/Meshy_AI_one_bat_wing_1027074652_texture.glb' },
  { id: 'dragon',    label: 'Dragon',    url: 'https://cdn.entropywars.net/Assets/characters/gear/wings/Meshy_AI_one_dragon_wing_1027074659_texture.glb' },
];
/* THE RETIRED CLASSIC CLOTHES (2026-11-02, mondo: "Can we go ahead and get rid of any "classic" clothes and shoes, since you have
   replaced everything by making it new in blender ... I just want to get rid of the old stuff and make sure we have a replacement,
   except for the classic male and female bodies, make sure those stay"). The coded shells pushed out from the skin (three-renderer.js
   CC_TOPS / CC_BOTTOMS / CC_OUTER / CC_FEET / CC_GLOVES / CC_BELT, the tie + glasses of buildDetails) are no longer offered: every
   look that wore one wears its replacement instead, a MakeHuman pack piece (`wear`, tinted with the layer's old colour) or a piece
   built in cloud Blender (`wear` ewb_*, painted by the layer's own fabric / colour / print, or an Outer / Feet pick b*).
   normalizeCharacterAppearance swaps them on every read (saved characters, the locker, the baked race looks, online snapshots), so
   nothing is ever left blank. slot -> retired id -> { wear | outer | feet (the replacement), alt: { <fabric>: wear } (a denim
   pair = jeans) }. The classic bodies (MALE / FEMALE, body 'classic') stay. */
const EW_RETIRED_CLOTHES = {
  outfit: {
    tee: { wear: 'mhw_toigo_basic_tucked_t-shirt' }, vneck: { wear: 'mhw_punkduck_v_neck_top' }, suit: { wear: 'ewb_longsleeve' },
    crop: { wear: 'mhw_punkduck_high_neck_crop_top' }, tank: { wear: 'mhw_mindfront_tank_top_01' }, atank: { wear: 'mhw_elvs_male_athletic_tank1' },
    racer: { wear: 'mhw_elvs_ladies_tank1' }, tube: { wear: 'mhw_punkduck_tube_top' }, bikini: { wear: 'mhw_punkduck_bikini02_bra' },
    dress: { wear: 'mhw_toigo_shift_dress' }, gown: { wear: 'mhw_punkduck_evening_gown' }, polo: { wear: 'mhw_namuhekam_male_polo_shirt' },
    henley: { wear: 'ewb_henley' },
  },
  bottoms: {
    trousers: { wear: 'mhw_mindfront_male_trousers_1', alt: { denim: 'mhw_elvs_jeans_straight_leg' } },
    shorts: { wear: 'mhw_elvs_male_trouser_short_1', alt: { denim: 'mhw_cortu_jeans_shorts' } },
    shortshorts: { wear: 'mhw_punkduck_female_short_jeans' }, briefs: { wear: 'mhw_punkduck_sport_briefs' }, bikini: { wear: 'mhw_punkduck_bikini02_slip' },
    miniskirt: { wear: 'mhw_frankyaye_mini_skirt_01' }, skirt: { wear: 'mhw_elvs_gored_midi_skirt' }, longskirt: { wear: 'mhw_toigo_long_full_skirt' },
    baggy: { wear: 'mhw_toigo_harem_pants' }, cargo: { wear: 'mhw_cortu_cargo_pants' }, sweatpants: { wear: 'ewb_sweatpants' },
  },
  outer: {
    jacket: { outer: 'bjacket' }, blazer: { outer: 'bblazer' }, vest: { outer: 'bvest' }, coat: { outer: 'blongcoat' }, cardigan: { outer: 'bcardigan' },
    hoodie: { wear: 'mhw_elvs_hooded_sweat_jacket1' }, trench: { outer: 'btrench' }, parka: { wear: 'mhw_punkduck_winter_coat' },
  },
  feet: { sneakers: { feet: 'bsneakers' }, boots: { feet: 'bboots' }, highboots: { feet: 'bhighboots' }, sandals: { feet: 'bsandals' } },
  gloves: { gloves: { wear: 'mhw_toigo_gloves_short' }, longgloves: { wear: 'mhw_toigo_gloves_long' } },
  belt: { belt: { wear: 'ewb_belt' } },
  neckwear: { tie: { wear: 'ewb_tie' }, bowtie: { wear: 'ewb_bowtie' } },
  glasses: { round: { wear: 'mhw_toigo_round_glasses_leopard' }, square: { wear: 'mhw_frankyaye_glasses_library_male' }, shades: { wear: 'mhw_elvs_ladies_sunglass1' } },
};
// the slot each retired layer is read through: [slot, the layer's colour key (a tinted pack piece takes it), the fabric key, the old default]
const _EW_RETIRE_SLOTS = [['outfit', 'topColor', 'topFabric', 'tee'], ['outfit2', 'top2Color', 'top2Fabric', 'none'], ['bottoms', 'bottomColor', 'bottomFabric', 'trousers'],
  ['bottoms2', 'bottom2Color', 'bottom2Fabric', 'none'], ['outer', 'outerColor', 'outerFabric', 'none'], ['outer2', 'outer2Color', 'outer2Fabric', 'none'],
  ['feet', 'feetColor', 'feetFabric', 'sneakers'], ['gloves', 'glovesColor', 'glovesFabric', 'none'], ['belt', 'beltColor', 'beltFabric', 'none'],
  ['neckwear', 'tieColor', null, 'none'], ['glasses', 'glassesColor', null, 'none']];
const _EW_RETIRE_TABLE = { outfit2: 'outfit', bottoms2: 'bottoms', outer2: 'outer' };
/* a look with its classic clothes swapped for their replacements (the same object when it wore none). A slot left out of an
   old look meant the old default (a tee, trousers, sneakers), so a bare look ({ body }) comes out dressed. The swapped pieces go
   in front of the look's own pack picks, so a pack piece already worn in that category stays; a suit / dress already worn keeps
   the swapped top and bottoms off it. The second top / bottoms layers swap into the same categories (the later pick wins). */
function retireClassicClothes(value) {
  if (!value || typeof value !== 'object') return value;
  const add = [], tint = {}, out = Object.assign({}, value);
  const own = Array.isArray(value.wear) ? value.wear.filter(id => typeof id === 'string') : [];
  const covered = own.some(id => EW_MH_WEAR_BY_ID[id] && /^(suits|dresses)$/.test(EW_MH_WEAR_BY_ID[id][2]));
  let changed = false;
  for (const [slot, colorKey, fabricKey, def] of _EW_RETIRE_SLOTS) {
    const v = value[slot] === undefined ? def : value[slot];
    const sw = EW_RETIRED_CLOTHES[_EW_RETIRE_TABLE[slot] || slot][v];
    if (!sw) { if (value[slot] === undefined && def !== 'none') { out[slot] = 'none'; changed = true; } continue; }
    changed = true;
    out[slot] = 'none';
    if (sw.outer) { out[slot] = sw.outer; continue; }
    if (sw.feet) { out[slot] = sw.feet; continue; }
    if (covered && /^(outfit|bottoms)/.test(slot)) continue;
    const id = (sw.alt && fabricKey && sw.alt[value[fabricKey]]) || sw.wear;
    if (!EW_MH_WEAR_BY_ID[id]) continue;
    add.push(id);
    const c = value[colorKey];
    if (wearTintable(id) && typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)) tint[id] = c;   // (a look with no colour of its own: the piece's own colours)
    else if (EW_WEAR_LAYER_OF[id] === 'top' && /2$/.test(slot) && typeof c === 'string') out.topColor = c;   // (a second top worn alone now: it keeps its colour)
  }
  if (!changed) return value;
  out.wear = add.concat(own.filter(id => !add.includes(id)));
  out.wearTint = Object.assign(tint, value.wearTint && typeof value.wearTint === 'object' && !Array.isArray(value.wearTint) ? value.wearTint : {});
  return out;
}
// numeric fields: [min, max, default]
/* THE MPFB BODIES (2026-11-01, mondo: MakeHuman bodies via MPFB2, not Quaternius). Built by bake-mpfb.py
   (charactercreation/mpfb/mpfb_<id>.glb on R2 Assets/characters/creator/mpfb/): stock MakeHuman skin, face,
   brows, eyes and hair baked in, Meshy bone names so the shared animation library plays on them, ARKit + viseme
   face shapes. A creator look with body:'mpfb_<id>' is dressed by the same creator rig as the classic bases
   (clothes, layers, hair, accessories, body sliders; creatorBase) but keeps its stock skin + face (no skin tint,
   no painted face: three-renderer.js _createAppearanceRig `part.stock`); its HEIGHT slider scales it like the
   classic bases (heightRatio = the body's own ratio x the slider). `ratio` = the body's height next to the male. */
const EW_MPFB_BODIES = [
  { id: 'mpfb_male',   label: 'MPFB male',   gender: 'male',   ratio: 1.0 },
  { id: 'mpfb_female', label: 'MPFB female', gender: 'female', ratio: 0.94 },
  { id: 'mpfb_heavy',  label: 'MPFB heavy',  gender: 'male',   ratio: 1.08 },
  { id: 'mpfb_thin',   label: 'MPFB thin',   gender: 'male',   ratio: 1.04 },
  { id: 'mpfb_short',  label: 'MPFB short',  gender: 'male',   ratio: 0.82 },
  /* THE FEMALE PRESETS (2026-11-02, mondo: "what about the female short body or female thick body or female tall and thin
     body?"): bake-mpfb.py BODIES female_heavy / female_thin / female_short, each wearing the MPFB female's pack-clothes fit
     (_FIT_D, like the classic bodies) and her look kit. Ratio = the board height next to the female's 0.94. */
  { id: 'mpfb_female_heavy', label: 'MPFB female heavy', gender: 'female', ratio: 0.97, kit: 'female' },
  { id: 'mpfb_female_thin',  label: 'MPFB female tall thin', gender: 'female', ratio: 1.02, kit: 'female' },
  { id: 'mpfb_female_short', label: 'MPFB female short', gender: 'female', ratio: 0.80, kit: 'female' },
  /* THE CLASSIC MPFB BODIES (2026-11-01, mondo: "i like the old bodies, but i like the skin texture of the new bodies ... i
     also want the head of the new bodies on the old bodies"): bake-mpfb-classic.py reshapes the MPFB male / female below
     the neck onto the classic creator bases (the MPFB head, hands and feet stay). `kit` = the MPFB body whose looks
     (EW_MH_LOOKS kits + fixed layer) and pack-clothes fit it starts from. Ratio 1.0 = the classic bases' own height. */
  { id: 'mpfb_classic_male',   label: 'MPFB classic male',   gender: 'male',   ratio: 1.0, kit: 'male' },
  { id: 'mpfb_classic_female', label: 'MPFB classic female', gender: 'female', ratio: 1.0, kit: 'female' },
];
/* THE CHEST (2026-11-01, mondo: "remove the band from the female's chest model and preferably have a nipple option and no
   nipple option"): appearance.mhChest on a female MPFB body. 'nipples' = the body as baked (the stock skins carry nipples);
   'smooth' covers each nipple with the skin just above it (three-renderer.js setLook). Spots are in the 1024 px hm08 sheet.
   NO UNDERWEAR (2026-11-02, mondo: "remove the black underwear from the mpfb body and mpfb classic body, it is messing up
   some of the other clothes"): the painted briefs / shorts / chest band are gone from every MPFB body's skin sheet and fixed
   layer, so the old 'band' choice is gone too (a saved 'band' reads as 'nipples'). `band` only marks the bodies with the
   chest choice now; its rect is no longer cut out of anything. */
const EW_MH_CHEST = { band: { female: [118, 226, 546, 164] }, spots: [[332, 308], [447, 308]], r: 24 };
/* THE LIP COLOUR (2026-11-03, mondo: "what if i just want to change the lips specifically?"): the lips' outline on MakeHuman's
   hm08 sheet (1024 px, the same on every MPFB body and skin), read off the pack's lipstick skins (toigo ... with makeup / goth
   makeup). three-renderer.js tintLips paints appearance.lipColor inside it, keeping the skin's own shading; lipTint 'own' = the
   skin's lips as painted. */
/* THE LOOK COLOURS (2026-11-03): where the irises sit in every MakeHuman eye picture (its own px, = the sheet's px; found where the
   9 eye pictures differ), and the torso patch of the hm08 sheet whose average a picked skin colour replaces */
const EW_MH_IRIS = { centres: [[20.6, 20.7], [149.4, 20.7]], r: 3.8 };
const EW_MH_SKIN_SAMPLE = [200, 150, 360, 300];
/* the mouth's inside (the two cheek pieces + the tongue) keeps its own red under a picked skin: each piece's outline on the hm08
   sheet (1024 px, 2 px out into its padding), traced off the MPFB bodies' own UVs (2026-11-05, mondo: "what is this random white spot
   down this person's back??"). These were two boxes before, and the first box also held the torso's back edge (x 145-170, y 360-480:
   the spine seam, half the back meets there) and the second the right hand's fingertips, so that strip stayed the stock skin colour
   under every picked colour. No other piece of any MPFB body falls inside these outlines. */
const EW_MH_SKIN_KEEP = [[40,373,34,376,27,379,23,382,21,385,18,388,16,391,15,394,13,397,13,400,12,403,12,406,12,409,11,412,11,415,10,418,10,421,10,424,10,427,10,430,10,433,10,436,10,439,10,442,11,445,12,448,14,451,17,454,20,457,25,460,34,463,52,463,61,460,63,457,65,454,67,451,69,448,70,445,71,442,71,439,72,436,72,433,74,430,76,427,77,424,78,421,79,418,80,415,81,412,81,409,81,406,80,403,80,400,80,397,79,394,79,391,76,388,73,385,71,382,68,379,65,376,45,373],[121,373,102,376,99,379,96,382,94,385,91,388,88,391,88,394,87,397,87,400,87,403,86,406,86,409,86,412,87,415,88,418,89,421,90,424,91,427,93,430,94,433,95,436,96,439,96,442,97,445,98,448,100,451,102,454,104,457,106,460,115,463,133,463,142,460,147,457,150,454,153,451,155,448,156,445,157,442,157,439,157,436,157,433,157,430,157,427,157,424,157,421,156,418,156,415,156,412,155,409,155,406,155,403,154,400,153,397,151,394,150,391,148,388,146,385,144,382,140,379,133,376,126,373],[844,882,838,885,799,888,797,891,795,894,792,897,790,900,788,903,786,906,785,909,783,912,781,915,779,918,778,921,777,924,777,927,776,930,775,933,774,936,774,939,774,942,774,945,773,948,773,951,773,954,773,957,773,960,773,963,774,966,775,969,775,972,776,975,777,978,777,981,779,984,780,987,781,990,782,993,783,996,785,999,786,1002,788,1005,791,1008,793,1011,929,1011,931,1008,933,1005,935,1002,937,999,939,996,940,993,941,990,942,987,943,984,945,981,945,978,946,975,946,972,947,969,947,966,948,963,948,960,948,957,948,954,948,951,948,948,948,945,948,942,948,939,948,936,947,933,946,930,945,927,944,924,943,921,942,918,940,915,939,912,937,909,935,906,934,903,932,900,929,897,927,894,924,891,922,888,884,885,877,882]];
const EW_MH_LIPS = { poly: [931,503,928,504.5,924,507.5,921,510.5,917,513.5,916,516.5,915,519.5,914,522.5,914,525.5,915,528.5,915,531.5,914,534.5,915,537.5,916,540.5,917,543.5,919,546.5,922,549.5,925,552.5,929,554.5,931,555,933,554.5,936,552.5,941,549.5,942,546.5,945,543.5,946,540.5,947,537.5,948,534.5,948,531.5,948,528.5,948,525.5,948,522.5,948,519.5,946,516.5,944,513.5,941,510.5,939,507.5,934,504.5], box: [906, 495, 52, 68], feather: 1.6 };
/* THE MAKE-UP (2026-11-12): where eye liner (red), eye shadow (green) and blush (blue) sit on the hm08 sheet: one small mask picture
   (mpfb/looks/makeup_mask.png, measured on the MPFB head by bake-makeup.py) and its box on the 1024 sheet; `a` = how strongly each
   picked colour covers the skin at the mask's full value */
const EW_MH_MAKEUP = { file: 'makeup_mask.png', box: [841, 419, 92, 220], a: { liner: 0.9, shadow: 0.6, blush: 0.4 } };
const EW_APPEARANCE_LIMITS = {
  height: [0.85, 1.15, 1], width: [0.85, 1.15, 1],
  chest: [-1, 1, 0], waist: [-1, 1, 0], hips: [-1, 1, 0], bust: [-1, 1, 0],   // bust: 2026-11-01 (mondo)
  head: [-1, 1, 0], jaw: [-1, 1, 0], nose: [-1, 1, 0], cheeks: [-1, 1, 0],
  eyeSize: [-1, 1, 0], brows: [0, 1, 0.5],
  jiggleChest: [0, 1, 0.5], jiggleButt: [0, 1, 0.5],   // THE JIGGLE (2026-11-02, mondo): the MPFB bodies' chest + glute spring strength (three-renderer.js jigTick; 0 = still)
  beltHeight: [-1, 1, 0]   // THE BELT HEIGHT (2026-11-02, mondo): a worn Blender belt raised / lowered to sit on any trousers' waistband (three-renderer.js wearBeltLift, ±8 cm)
};
/* THE FACE SLIDERS (2026-11-02, mondo: "a standard AAA video game character creator where you can control the size of the
   eyes and the lips and everything"): an MPFB body (and an MPFB classic body's MPFB head) takes MakeHuman's OWN face
   modifiers, baked by bake-mpfb.py --shapes into mpfb/mpfb_shapes.glb and added by three-renderer.js shapeBody like the body
   sliders. Groups = the creator's FACE tabs; each key is a -1..1 slider (head / jaw / nose / cheeks / eyeSize were already
   appearance keys; on a classic base they keep their old meaning). */
const EW_MPFB_FACE_SLIDERS = [
  { id: 'eyes', label: 'Eyes', rows: [['eyeSize', 'Size'], ['eyeHeight', 'Height'], ['eyeSpacing', 'Spacing'], ['eyeTilt', 'Tilt'], ['eyeOpen', 'Opening'], ['eyeDepth', 'Depth'], ['eyelid', 'Upper lid'], ['eyeBags', 'Bags'], ['epicanthus', 'Inner fold']] },
  { id: 'brows', label: 'Brows', rows: [['browHeight', 'Height'], ['browAngle', 'Angle'], ['browRidge', 'Brow ridge']] },
  { id: 'nose', label: 'Nose', rows: [['nose', 'Size'], ['noseWidth', 'Width'], ['noseLength', 'Length'], ['noseDepth', 'Projection'], ['noseHeight', 'Height'], ['noseBridge', 'Bridge hump'], ['noseTip', 'Tip up / down'], ['nostrils', 'Nostril flare'], ['noseCurve', 'Curve']] },
  { id: 'mouth', label: 'Mouth', rows: [['mouthWidth', 'Width'], ['mouthHeight', 'Height'], ['upperLip', 'Upper lip'], ['lowerLip', 'Lower lip'], ['mouthCorners', 'Corners'], ['cupidsBow', "Cupid's bow"], ['mouthDepth', 'Depth']] },
  { id: 'jaw', label: 'Jaw + chin', rows: [['jaw', 'Jaw width'], ['jawAngle', 'Jaw angle'], ['chinLength', 'Chin length'], ['chinJut', 'Chin forward'], ['underbite', 'Underbite'], ['chinCleft', 'Chin cleft']] },
  { id: 'cheeks', label: 'Cheeks', rows: [['cheeks', 'Fullness'], ['cheekbones', 'Cheekbones'], ['cheekHeight', 'Height'], ['faceFat', 'Face fat']] },
  { id: 'head', label: 'Head', rows: [['head', 'Width'], ['headHeight', 'Height'], ['headDepth', 'Depth'], ['foreheadHeight', 'Forehead height'], ['foreheadSlope', 'Forehead slope'], ['faceAge', 'Age']] },
  { id: 'ears', label: 'Ears + neck', rows: [['earSize', 'Ear size'], ['earOut', 'Ears out'], ['earPoint', 'Pointed ears'], ['earLobe', 'Lobes'], ['neckThick', 'Neck']] },
  /* THE ANIMAL HEADS (2026-11-03, plan rows 18 + 28, the werewolf pilot): MakeHuman community animal-pack targets in the same
     mpfb_shapes.glb (bake-mpfb.py ANIMAL_SHAPES; CC-BY, in the credits), 0..100: the head + face reshape into the animal's */
  /* (2026-11-03, mondo: "add the werewolf head to the creature heads"): shown on OUTFIT > Head > Creature heads as a pick
     (+ its strength slider), not on the FACE tabs (inHeads) */
  { id: 'animal', label: 'Animal head', inHeads: true, rows: [['wolfHead', 'Wolf head']] },
  /* THE SHAPED EARS (2026-11-03, mondo: "Where are the cat ears in the editor? DO we not have any?"): two MakeHuman community cat-ear
     targets in the same mpfb_shapes.glb (bake-mpfb.py ANIMAL_SHAPES): titleknown's catgirl ears (CC0, tall + pointed) and JALdMIC's
     feline ears (CC-BY, rounder, credited). The body's own ears grow up the sides of the head, so they take the skin, the skin colour
     and every slider. Shown on OUTFIT > Head > Ears as picks beside the Elf ears (+ a strength slider), not on the FACE tabs (inEars) */
  { id: 'animalEars', label: 'Animal ears', inEars: true, rows: [['catEars', 'Cat ears'], ['felineEars', 'Cat ears, round']] },
  /* THE CUSTOM SHAPES (2026-11-11, mondo: Morgan's face on the MPFB head): a shape that is NOT a MakeHuman target, added to the same
     mpfb_shapes.glb by bake-custom-shape.js (charactercreation/mpfb/custom_shapes/<key>.json; re-run it after bake-mpfb.py --shapes).
     morganHead = a face likeness measured on mpfb_female, 0..1; it pairs with the "morgan" skin (EW_MH_LOOKS.skins). A shaped head
     (inHeads), so it is an OUTFIT > Head pick with a strength slider and a face reset leaves it on. */
  { id: 'likeness', label: 'Face likeness', inHeads: true, rows: [['morganHead', 'Morgan']] },
  /* THE UNIT FACES (2026-11-12, mondo: "get the faces a little more accurate ... custom face/body textures"; docs/notes/meshy-remake-plan.md
     section 6): a race's own Meshy head measured onto the MPFB head by face landmarks (bake-face.py): <race>Face = the head shape (a custom
     shape like morganHead), and the skin "ew_face_<race>" = the unit's face painted onto the stock skin sheet, the rest toned to match.
     The mesh is still the MPFB head, so the 67 face shapes (blink, talk) keep working. Pilot: the cowboy. */
  { id: 'unitFace', label: 'Unit faces', inHeads: true, rows: [['cowboyFace', 'Cowboy'], ['knightFace', 'Knight'], ['wizardFace', 'Wizard'], ['zombieFace', 'Zombie'], ['robinhoodFace', 'Robinhood'], ['catgirlFace', 'Catgirl'], ['mummyFace', 'Mummy'], ['angelFace', 'Angel'], ['lockeFace', 'Agent Locke']] },
];
EW_APPEARANCE_LIMITS.wolfHead = [0, 1, 0];   // (one-sided: the target has no minus end)
EW_APPEARANCE_LIMITS.morganHead = [0, 1, 0];   // (one-sided, THE CUSTOM SHAPES)
EW_APPEARANCE_LIMITS.cowboyFace = [0, 1, 0];   // (one-sided, THE UNIT FACES)
EW_APPEARANCE_LIMITS.knightFace = [0, 1, 0]; EW_APPEARANCE_LIMITS.wizardFace = [0, 1, 0]; EW_APPEARANCE_LIMITS.zombieFace = [0, 1, 0]; EW_APPEARANCE_LIMITS.robinhoodFace = [0, 1, 0]; EW_APPEARANCE_LIMITS.catgirlFace = [0, 1, 0]; EW_APPEARANCE_LIMITS.mummyFace = [0, 1, 0]; EW_APPEARANCE_LIMITS.angelFace = [0, 1, 0]; EW_APPEARANCE_LIMITS.lockeFace = [0, 1, 0];
/* THE LIKENESS SWITCH (2026-11-11, mondo: "hide behind a switch anyway, im really just testing something"): the face-likeness picks
   (the morganHead shaped head + the "morgan" skin) are NOT shown in the creator unless this browser turned them on: open the game
   once with ?likeness=1 in the address (remembered; ?likeness=0 turns it off again). The data stays valid either way, so a look
   saved with the likeness still draws; a pick that is worn stays listed so it can be taken off. party-builder.js asks ewPickSwitchedOff. */
const EW_LIKENESS_PICKS = { morganHead: 1, morgan: 1 };
const EW_LIKENESS_ON = (function () {
  try {
    if (typeof location !== 'undefined') { const q = /[?&]likeness=([01])\b/.exec(location.search || ''); if (q) { try { localStorage.setItem('ew_likeness', q[1]); } catch (e) {} return q[1] === '1'; } }
    return typeof localStorage !== 'undefined' && localStorage.getItem('ew_likeness') === '1';
  } catch (e) { return false; }
})();
function ewPickSwitchedOff(id) { return !EW_LIKENESS_ON && EW_LIKENESS_PICKS[id] === 1; }
EW_APPEARANCE_LIMITS.catEars = [0, 1, 0]; EW_APPEARANCE_LIMITS.felineEars = [0, 1, 0];
/* THE SHAPED HEADS: the Creature heads that are a reshape of the body's own head (a MakeHuman target, 0..1), not a model worn over it.
   One head at a time with the model heads: a shaped head picked takes the model head off, and the other way round. [key, label] */
const EW_SHAPE_HEADS = EW_MPFB_FACE_SLIDERS.filter(g => g.inHeads).reduce((a, g) => a.concat(g.rows), []);
const EW_SHAPE_EARS = EW_MPFB_FACE_SLIDERS.filter(g => g.inEars).reduce((a, g) => a.concat(g.rows), []);   // THE SHAPED EARS [key, label]
/* THE BODY DETAILS (2026-11-02, plan row 26: mondo's female thick / thin / athletic bodies as sliders): MakeHuman's Weight
   and Muscle macros (gender-matched deltas) + body modifiers, on the MPFB bodies only (skin only, the bones stay). Bust
   spacing / height show on female bodies only, like Bust. */
const EW_MPFB_BODY_SLIDERS = [['weight', 'Weight'], ['muscle', 'Muscle'], ['shoulders', 'Shoulders'], ['vshape', 'V-shape'], ['pecs', 'Chest muscle'],
  ['belly', 'Belly'], ['glutes', 'Glutes'], ['thighs', 'Thighs'], ['calves', 'Calves'], ['upperArms', 'Upper arms'],
  ['bustSpacing', 'Bust spacing', 'female'], ['bustHeight', 'Bust height', 'female']];
EW_MPFB_BODY_SLIDERS.forEach(r => { EW_APPEARANCE_LIMITS[r[0]] = [-1, 1, 0]; });
const EW_MPFB_FACE_KEYS = EW_MPFB_FACE_SLIDERS.reduce((a, g) => a.concat(g.rows.map(r => r[0])), []);
EW_MPFB_FACE_KEYS.forEach(k => { if (!EW_APPEARANCE_LIMITS[k]) EW_APPEARANCE_LIMITS[k] = [-1, 1, 0]; });
/* the face keys a face reset sets (DEFAULT / NEUTRAL FACE, a face preset, a body swap, RANDOM): every face slider but the shaped
   heads + ears, which are OUTFIT picks and stay on (2026-11-03, THE SHAPED EARS) */
const EW_SHAPE_PICK_KEYS = EW_SHAPE_HEADS.concat(EW_SHAPE_EARS).map(r => r[0]);
const EW_FACE_RESET_KEYS = EW_MPFB_FACE_KEYS.filter(k => EW_SHAPE_PICK_KEYS.indexOf(k) < 0);
/* THE DEFAULT FACES (2026-11-03, mondo: "Can you make male and female faces on the mpfb bodies that are good looking that we can
   use as a default?"): the face sliders above, set once per gender and tuned on screen (front / three-quarter / profile). The
   usual attractiveness cues, nothing invented: the male = wider jaw with a sharper angle, chin longer + forward, high cheekbones,
   less face fat, a firmer brow ridge, a narrower nose, almond eyes; the female = narrower jaw + face, a shorter lower face, chin
   forward under the lips, high cheekbones, a smaller upturned nose, almond eyes (outer corners up, a little lid), a defined cupid's
   bow, the lips set back so the profile does not pout, a slimmer neck. Keys left out stay 0. A NEW look on an MPFB body starts on
   its gender's face (CREATE APPEARANCE, the mirror, a body switch while the face is untouched); FACE > DEFAULT FACE / NEUTRAL FACE
   swap it any time. Never applied by normalize, so every saved look and every baked race look (RACE_CREATOR_LOOKS) keeps its face. */
const EW_MPFB_DEFAULT_FACES = {
  male: {
    eyeSize: 0.1, eyeTilt: 0.25, eyeOpen: -0.05, eyelid: 0.15, eyeDepth: -0.1, eyeBags: -0.3,
    browHeight: -0.1, browAngle: 0.15, browRidge: 0.3,
    nose: -0.15, noseWidth: -0.25, noseBridge: 0.1, noseTip: 0.05, nostrils: -0.2,
    mouthWidth: -0.05, lowerLip: 0.15, cupidsBow: 0.2, mouthCorners: 0.1, mouthDepth: -0.3,
    jaw: 0.35, jawAngle: 0.3, chinLength: 0.1, chinJut: 0.35, chinCleft: 0.15,
    cheeks: -0.15, cheekbones: 0.45, cheekHeight: 0.2, faceFat: -0.35,
    faceAge: -0.2, neckThick: 0.3
  },
  female: {
    eyeSize: 0.15, eyeTilt: 0.35, eyeOpen: -0.3, eyelid: 0.3, eyeBags: -0.3,
    browHeight: -0.3, browAngle: 0.15, browRidge: -0.15,
    nose: -0.25, noseWidth: -0.3, noseLength: -0.15, noseBridge: -0.2, noseTip: 0.1, nostrils: -0.3,
    mouthHeight: 0.1, upperLip: 0.1, lowerLip: 0.15, cupidsBow: 0.3, mouthCorners: 0.15, mouthDepth: -0.6,
    jaw: -0.4, jawAngle: -0.1, chinLength: -0.15, chinJut: 0.4,
    cheekbones: 0.35, cheekHeight: 0.25, faceFat: -0.05,
    head: -0.25, headHeight: -0.15, faceAge: -0.5, neckThick: -0.2
  }
};
/* THE FACE PRESETS (2026-11-03, mondo: "can you point me to some resources or websites or asset packs where i can get makehuman
   face presets?"): MakeHuman characters (.mhm from the community asset repository, or MPFB human presets) turned into FACE slider
   values by `node bake-faces.js <file>` (repo root; it writes the block below). Each row = { id, label, gender, author, license,
   source, face }; the creator lists them under FACE beside DEFAULT FACE / NEUTRAL FACE, the credits page lists the CC-BY authors.
   Only the face carries: a .mhm's body macros (gender / age / ethnic mix) stay with our fixed MPFB bodies. */
// EW_MPFB_FACE_PRESETS:BEGIN (written by bake-faces.js)
const EW_MPFB_FACE_PRESETS = [
  {"id":"mh_warrior","label":"Warrior","gender":"female","author":"DREAM_SEARCH_REPEAT","license":"CC0","source":"https://opengameart.org/content/warrior-female-3d-model","face":{"jaw":0.05,"cheeks":0.01,"eyeOpen":0.03,"eyeDepth":0.09,"eyeBags":0.06,"browHeight":-0.2,"noseWidth":-0.4,"noseLength":0.2,"mouthWidth":0.1,"faceAge":0.1,"neckThick":-0.21}},
  {"id":"mh_gnome","label":"Gnome","gender":"male","author":"Cheb Gonaz","license":"CC0","source":"https://opengameart.org/content/gnome-0","face":{"faceFat":-0.83,"faceAge":0.33}},
  {"id":"mh_face_f01","label":"Face F01","gender":"female","author":"","license":"","source":"","face":{"head":-0.11,"jaw":-0.16,"nose":0.17,"cheeks":-0.35,"eyeSize":0.12,"eyeSpacing":-0.13,"eyeOpen":0.1,"eyelid":0.28,"eyeBags":0.13,"epicanthus":0.16,"browRidge":-0.25,"noseLength":-0.15,"noseDepth":0.29,"noseBridge":0.14,"mouthWidth":0.27,"lowerLip":-0.19,"cupidsBow":0.09,"chinJut":0.25,"cheekbones":0.18,"faceFat":-0.36,"faceAge":-0.13,"foreheadHeight":-0.12,"neckThick":0.26}},
  {"id":"mh_face_f02","label":"Face F02","gender":"female","author":"","license":"","source":"","face":{"head":0.04,"jaw":0.08,"nose":0.02,"cheeks":-0.1,"eyeSize":0.08,"eyeSpacing":0.07,"eyeTilt":-0.09,"eyeDepth":-0.05,"eyelid":0.31,"eyeBags":0.05,"epicanthus":0.01,"browRidge":-0.29,"noseWidth":-0.19,"noseLength":0.74,"noseDepth":-0.39,"noseHeight":-0.23,"noseBridge":0.04,"noseTip":-0.02,"nostrils":-0.26,"noseCurve":-0.39,"mouthHeight":-0.23,"upperLip":-0.32,"lowerLip":-0.43,"mouthCorners":0.08,"cupidsBow":0.09,"mouthDepth":0.14,"chinLength":-0.02,"chinJut":0.3,"underbite":0.01,"chinCleft":-0.11,"jawAngle":-0.21,"headHeight":0.23,"faceFat":-0.21,"faceAge":-0.09,"foreheadHeight":-0.34,"foreheadSlope":-0.13,"earSize":-0.19,"earPoint":0.07,"earLobe":0.16}},
  {"id":"mh_face_f03","label":"Face F03","gender":"female","author":"","license":"","source":"","face":{"head":-0.09,"jaw":-0.19,"nose":0.06,"cheeks":0.11,"eyeSize":-0.09,"eyeSpacing":-0.13,"eyeTilt":0.16,"eyeDepth":-0.39,"browHeight":0.63,"browAngle":0.03,"noseWidth":-0.31,"noseLength":0.11,"mouthWidth":-0.1,"mouthHeight":-0.12,"mouthCorners":0.09,"mouthDepth":0.19,"chinLength":-0.03,"chinJut":0.12,"underbite":0.16,"jawAngle":-0.06,"cheekbones":-0.47,"cheekHeight":0.46,"headHeight":-0.07,"faceFat":-0.22,"faceAge":-0.03,"foreheadHeight":-0.26}},
  {"id":"mh_face_f04","label":"Face F04","gender":"female","author":"","license":"","source":"","face":{"cheeks":-0.05,"eyeTilt":0.06,"eyeOpen":-0.04,"eyeDepth":-0.24,"eyelid":0.41,"eyeBags":-0.5,"epicanthus":0.13,"browHeight":0.67,"browAngle":0.12,"nostrils":-0.05,"mouthHeight":-0.08,"upperLip":-0.26,"lowerLip":-0.36,"mouthCorners":-0.05,"cupidsBow":0.04,"mouthDepth":-0.24,"chinJut":0.16,"jawAngle":0.12,"cheekbones":0.19,"cheekHeight":0.59}},
  {"id":"mh_face_f05","label":"Face F05","gender":"female","author":"","license":"","source":"","face":{"head":-0.1,"jaw":-0.24,"cheeks":0.06,"eyeSize":-0.06,"eyeHeight":0.06,"eyeSpacing":-0.15,"eyeTilt":0.03,"eyeDepth":-0.43,"eyelid":0.38,"eyeBags":-0.03,"epicanthus":0.07,"browHeight":0.47,"noseDepth":-0.05,"noseHeight":-0.57,"noseTip":0.01,"nostrils":-0.11,"noseCurve":-0.21,"mouthWidth":-0.01,"mouthHeight":-0.12,"upperLip":-0.09,"lowerLip":-0.18,"mouthCorners":0.07,"cupidsBow":0.06,"mouthDepth":-0.17,"chinLength":0.18,"underbite":-0.01,"jawAngle":-0.15,"cheekbones":0.3,"cheekHeight":0.22,"headHeight":-0.07,"faceFat":-0.47}},
  {"id":"mh_face_f06","label":"Face F06","gender":"female","author":"","license":"","source":"","face":{"nose":-0.14,"cheeks":-0.49,"eyeTilt":-0.14,"eyeOpen":0.28,"eyeDepth":-0.25,"eyelid":0.25,"eyeBags":-0.5,"epicanthus":0.02,"browHeight":0.12,"browAngle":0.05,"noseWidth":-0.14,"noseDepth":-0.05,"noseHeight":-0.57,"nostrils":-0.09,"mouthWidth":-0.09,"lowerLip":0.04,"cupidsBow":0.09,"mouthDepth":0.17,"chinLength":0.02,"chinJut":0.19,"underbite":-0.04,"chinCleft":-0.62,"jawAngle":-0.83,"cheekbones":-0.07,"cheekHeight":0.21,"faceFat":-0.02}},
  {"id":"mh_face_f07","label":"Face F07","gender":"female","author":"","license":"","source":"","face":{"nose":0.08,"cheeks":-0.1,"eyeHeight":0.01,"eyeSpacing":0.08,"eyeOpen":0.07,"eyeDepth":0.1,"eyelid":0.25,"eyeBags":0.12,"epicanthus":0.02,"browHeight":0.15,"browAngle":-0.06,"noseDepth":-0.09,"noseHeight":-0.13,"noseTip":-0.1,"noseCurve":-0.14,"mouthHeight":0.16,"upperLip":0.07,"lowerLip":0.08,"chinLength":-0.11,"chinJut":0.13,"underbite":0.3,"jawAngle":-0.34,"cheekbones":0.18,"cheekHeight":-0.16,"earSize":-0.15,"earOut":-0.07,"earLobe":0.21}},
  {"id":"mh_face_f08","label":"Face F08","gender":"female","author":"","license":"","source":"","face":{"jaw":-0.17,"cheeks":-0.54,"eyeSize":-0.07,"eyeHeight":0.17,"eyeSpacing":-0.14,"eyeTilt":0.33,"eyeOpen":-0.04,"eyeDepth":-0.48,"eyelid":0.14,"eyeBags":-0.5,"browHeight":0.18,"browAngle":0.35,"noseWidth":-0.14,"noseDepth":-0.2,"noseHeight":-0.23,"noseTip":-0.16,"nostrils":0.03,"mouthWidth":-0.14,"upperLip":-0.17,"lowerLip":-0.17,"mouthCorners":0.06,"chinLength":-0.17,"chinJut":0.32,"underbite":-0.01,"jawAngle":-0.83,"cheekbones":-0.52,"cheekHeight":0.21,"headHeight":0.19,"faceFat":-0.45,"faceAge":-0.02,"foreheadHeight":-0.4,"foreheadSlope":0.45}},
  {"id":"mh_face_f09","label":"Face F09","gender":"female","author":"","license":"","source":"","face":{"head":-0.1,"jaw":-0.5,"nose":-0.03,"cheeks":-0.16,"eyeSize":-0.15,"eyeHeight":0.18,"eyeSpacing":-0.1,"eyeTilt":-0.04,"eyeOpen":0.25,"eyeDepth":-0.18,"eyelid":0.37,"eyeBags":0.14,"epicanthus":0.02,"browHeight":-0.04,"browAngle":0.25,"browRidge":-1,"noseWidth":-0.08,"noseDepth":-0.38,"noseHeight":-0.29,"noseBridge":-0.12,"noseTip":-0.17,"nostrils":-0.37,"noseCurve":-0.4,"mouthWidth":0.16,"mouthHeight":-0.24,"upperLip":0.18,"lowerLip":0.09,"mouthCorners":0.13,"cupidsBow":0.13,"mouthDepth":-0.09,"chinLength":-0.09,"chinJut":0.2,"underbite":0.12,"chinCleft":-0.03,"jawAngle":-0.06,"cheekbones":-0.05,"cheekHeight":-0.21,"headDepth":-0.25,"faceFat":-0.15,"faceAge":-0.07,"foreheadSlope":0.52}},
  {"id":"mh_face_f10","label":"Face F10","gender":"female","author":"","license":"","source":"","face":{"jaw":-0.18,"cheeks":-0.16,"eyeSize":-0.42,"eyeSpacing":-0.13,"eyeTilt":0.12,"eyeOpen":0.06,"eyeDepth":-0.33,"eyelid":0.67,"eyeBags":0.13,"epicanthus":0.01,"browHeight":0.67,"browAngle":0.17,"browRidge":0.01,"noseDepth":-0.23,"noseHeight":-0.21,"noseBridge":0.18,"noseTip":-0.16,"nostrils":-0.06,"mouthWidth":-0.23,"mouthHeight":-0.14,"upperLip":-0.1,"mouthCorners":0.16,"cupidsBow":0.03,"chinLength":0.06,"chinJut":0.01,"underbite":-0.15,"chinCleft":0.16,"jawAngle":-0.23,"cheekbones":0.09,"cheekHeight":0.24,"headHeight":0.09,"faceFat":-0.45}},
  {"id":"mh_face_f11","label":"Face F11","gender":"female","author":"","license":"","source":"","face":{"jaw":-0.53,"nose":-0.1,"cheeks":-0.04,"eyeHeight":0.23,"eyeTilt":0.21,"eyeOpen":0.05,"epicanthus":-0.16,"browHeight":0.67,"browAngle":-0.06,"noseWidth":-0.06,"noseLength":-0.03,"noseDepth":-0.34,"noseHeight":-0.31,"noseBridge":-0.02,"noseTip":-0.11,"nostrils":-0.11,"noseCurve":0.2,"mouthWidth":-0.13,"mouthHeight":0.03,"upperLip":-0.25,"lowerLip":0.11,"mouthCorners":-0.02,"mouthDepth":0.28,"chinLength":-0.06,"chinJut":0.09,"jawAngle":-0.83,"cheekbones":-0.35,"cheekHeight":0.09,"faceFat":-0.21}},
  {"id":"mh_face_f12","label":"Face F12","gender":"female","author":"","license":"","source":"","face":{"jaw":-0.1,"nose":-0.04,"cheeks":-0.19,"eyeSize":-0.24,"eyeOpen":0.2,"eyelid":0.17,"browHeight":0.09,"browAngle":0.26,"browRidge":0.15,"noseWidth":-0.11,"noseLength":0.16,"noseDepth":-0.43,"noseHeight":-0.71,"noseBridge":0.08,"noseTip":-0.13,"nostrils":-0.18,"noseCurve":0.02,"mouthWidth":0.19,"lowerLip":0.09,"cupidsBow":0.14,"chinJut":-0.12,"chinCleft":-0.05,"jawAngle":-0.5,"cheekbones":0.09,"cheekHeight":-0.11,"faceFat":-0.06,"foreheadHeight":-0.14,"earSize":-0.11,"earOut":-0.27}},
  {"id":"mh_face_m01","label":"Face M01","gender":"male","author":"","license":"","source":"","face":{"nose":0.2,"cheeks":0.15,"eyelid":-0.04,"eyeBags":0.1,"browAngle":-0.21,"browRidge":0.22,"noseWidth":-0.19,"noseLength":0.51,"noseDepth":0.12,"nostrils":-0.1,"noseCurve":-0.14,"mouthWidth":0.18,"cupidsBow":0.15,"chinJut":-0.11,"chinCleft":0.48,"cheekbones":0.24,"cheekHeight":-0.2,"faceFat":-0.08,"faceAge":-0.09,"foreheadSlope":-0.01,"earSize":-0.28,"earOut":-0.31,"neckThick":0.26}},
  {"id":"mh_face_m02","label":"Face M02","gender":"male","author":"","license":"","source":"","face":{"head":0.04,"jaw":0.31,"nose":0.14,"cheeks":-0.06,"eyeSize":0.07,"eyeHeight":-0.56,"eyeSpacing":0.04,"eyeTilt":0.14,"eyeOpen":0.22,"eyeDepth":-0.21,"eyelid":0.64,"eyeBags":-0.36,"epicanthus":0.15,"browHeight":-0.17,"browAngle":-0.12,"noseWidth":-0.17,"noseLength":0.25,"noseDepth":-0.2,"noseHeight":-0.48,"noseBridge":0.07,"noseTip":-0.01,"nostrils":-0.13,"noseCurve":-0.18,"mouthHeight":-0.13,"upperLip":0.11,"lowerLip":0.11,"mouthCorners":0.05,"cupidsBow":0.2,"mouthDepth":0.23,"chinJut":0.15,"underbite":-0.25,"jawAngle":0.1,"cheekbones":-0.26,"cheekHeight":0.26,"headHeight":0.25,"headDepth":0.08,"faceFat":-0.07,"faceAge":-0.03,"foreheadHeight":-0.31,"foreheadSlope":-0.14,"neckThick":0.1}},
  {"id":"mh_face_m03","label":"Face M03","gender":"male","author":"","license":"","source":"","face":{"nose":0.03,"cheeks":-0.11,"eyeOpen":0.15,"eyeDepth":-0.08,"epicanthus":0.2,"browRidge":0.14,"noseLength":0.1,"noseDepth":0.18,"noseBridge":0.09,"mouthWidth":0.11,"cupidsBow":0.52,"chinJut":0.15,"cheekHeight":-0.22,"faceFat":-0.25,"faceAge":-0.04,"foreheadHeight":-0.11,"foreheadSlope":0.12,"earSize":0.12,"neckThick":0.11}},
  {"id":"mh_face_m04","label":"Face M04","gender":"male","author":"","license":"","source":"","face":{"jaw":-0.19,"cheeks":-0.23,"eyeSize":-0.08,"eyeOpen":0.2,"eyeDepth":0.03,"epicanthus":0.1,"browHeight":-0.05,"browRidge":0.11,"noseWidth":0.32,"noseDepth":0.12,"noseBridge":0.06,"noseTip":0.12,"mouthWidth":0.07,"lowerLip":-0.1,"mouthCorners":0.07,"cupidsBow":0.33,"cheekbones":0.12,"cheekHeight":0.11,"faceAge":-0.13,"foreheadSlope":-0.23,"earSize":-0.11,"neckThick":-0.08}},
  {"id":"mh_face_m05","label":"Face M05","gender":"male","author":"","license":"","source":"","face":{"jaw":0.15,"nose":-0.08,"cheeks":-0.62,"eyeSpacing":-0.04,"eyeOpen":0.19,"eyeDepth":-0.11,"eyelid":0.43,"epicanthus":0.04,"browRidge":0.04,"noseLength":0.09,"noseDepth":0.21,"noseCurve":0.17,"mouthWidth":-0.1,"upperLip":0.03,"cupidsBow":0.08,"chinJut":0.12,"chinCleft":-0.02,"jawAngle":0.06,"cheekbones":-0.22,"cheekHeight":-0.18,"headHeight":0.27,"faceAge":0.1,"foreheadHeight":-0.15,"foreheadSlope":0.17,"earOut":-0.54,"neckThick":0.25}},
  {"id":"mh_face_m06","label":"Face M06","gender":"male","author":"","license":"","source":"","face":{"jaw":0.25,"cheeks":-0.08,"eyeSize":0.08,"eyeSpacing":0.01,"eyeTilt":0.12,"eyeOpen":0.22,"eyeDepth":0.03,"eyelid":0.3,"eyeBags":0.05,"epicanthus":0.36,"browHeight":-0.49,"browAngle":0.31,"browRidge":0.2,"noseWidth":-0.24,"noseLength":-0.05,"noseDepth":0.24,"noseHeight":-0.31,"noseBridge":0.22,"noseTip":-0.07,"mouthWidth":0.15,"mouthHeight":-0.28,"upperLip":0.46,"lowerLip":-0.17,"mouthCorners":-0.37,"cupidsBow":0.63,"mouthDepth":-0.03,"chinLength":0.03,"chinJut":0.02,"underbite":0.47,"chinCleft":0.27,"jawAngle":-0.07,"cheekbones":-0.42,"cheekHeight":0.27,"headHeight":-0.07,"headDepth":0.15,"faceFat":0.27,"earSize":0.15,"earOut":-0.16,"earPoint":-0.2,"earLobe":0.06}},
  {"id":"mh_face_m07","label":"Face M07","gender":"male","author":"","license":"","source":"","face":{"nose":0.04,"cheeks":-0.25,"eyeSize":0.12,"eyeHeight":-0.67,"eyeTilt":-0.03,"eyeOpen":0.16,"eyelid":0.41,"eyeBags":-0.5,"epicanthus":0.5,"browHeight":-0.27,"browAngle":0.11,"browRidge":0.06,"noseWidth":-0.39,"noseLength":0.61,"noseDepth":0.05,"noseHeight":-0.2,"noseBridge":0.36,"noseTip":0.3,"nostrils":-0.25,"noseCurve":-0.24,"mouthWidth":0.3,"mouthHeight":-0.56,"upperLip":-0.04,"mouthCorners":0.05,"cupidsBow":0.35,"mouthDepth":0.37,"chinLength":0.2,"chinJut":0.19,"underbite":0.18,"jawAngle":0.44,"cheekbones":0.37,"cheekHeight":-0.05,"headHeight":0.2,"headDepth":-0.26,"faceFat":-0.33,"faceAge":-0.1,"foreheadHeight":-0.64,"earOut":-0.36,"earLobe":0.11,"neckThick":0.18}},
  {"id":"mh_face_m08","label":"Face M08","gender":"male","author":"","license":"","source":"","face":{"jaw":0.29,"cheeks":0.23,"eyeSize":-0.33,"eyeHeight":-0.24,"eyeTilt":0.06,"eyeOpen":0.2,"eyeDepth":0.24,"eyelid":0.42,"epicanthus":-0.16,"browHeight":-0.13,"browAngle":0.17,"browRidge":-0.2,"noseWidth":-0.36,"noseLength":0.34,"noseDepth":0.11,"noseHeight":-0.71,"noseBridge":-0.15,"noseTip":0.01,"nostrils":-0.07,"noseCurve":-0.12,"mouthWidth":0.15,"mouthHeight":0.01,"upperLip":0.05,"lowerLip":-0.31,"mouthCorners":-0.18,"cupidsBow":0.4,"mouthDepth":-0.03,"chinLength":-0.04,"chinJut":0.32,"underbite":0.22,"chinCleft":0.18,"jawAngle":-0.17,"cheekbones":0.06,"cheekHeight":-0.15,"faceFat":-0.06,"faceAge":-0.05,"foreheadSlope":0.56,"earSize":0.33,"earOut":-0.59,"earLobe":-0.16,"neckThick":0.02}},
  {"id":"mh_face_m09","label":"Face M09","gender":"male","author":"","license":"","source":"","face":{"jaw":0.56,"nose":0.1,"cheeks":-0.08,"eyeSize":0.07,"eyeTilt":0.34,"eyeOpen":0.04,"eyeDepth":-0.26,"eyelid":0.04,"eyeBags":0.21,"epicanthus":-0.08,"browHeight":-0.09,"browAngle":0.06,"browRidge":0.21,"noseWidth":-0.14,"noseLength":-0.08,"noseDepth":0.36,"noseHeight":-0.3,"noseBridge":0.01,"nostrils":0.41,"noseCurve":-0.23,"mouthWidth":0.47,"mouthHeight":-0.28,"upperLip":0.12,"lowerLip":0.15,"cupidsBow":0.45,"mouthDepth":0.27,"chinLength":0.31,"chinJut":0.03,"underbite":0.25,"chinCleft":0.63,"jawAngle":0.01,"cheekbones":-0.42,"cheekHeight":0.27,"faceAge":-0.05,"foreheadHeight":0.14,"foreheadSlope":-0.21,"earSize":0.04,"earOut":-0.48,"earLobe":-0.04,"neckThick":0.4}},
  {"id":"mh_face_m10","label":"Face M10","gender":"male","author":"","license":"","source":"","face":{"head":0.02,"jaw":0.2,"cheeks":0.25,"eyeSize":-0.28,"eyeHeight":-0.15,"eyeSpacing":0.03,"eyeTilt":0.21,"eyeOpen":0.23,"eyeDepth":-0.01,"eyelid":0.07,"eyeBags":0.25,"epicanthus":-0.06,"browHeight":0.41,"browAngle":0.02,"browRidge":0.02,"noseWidth":-0.19,"noseLength":-0.03,"noseDepth":0.4,"noseHeight":0.23,"noseBridge":-0.09,"noseTip":0.2,"nostrils":0.06,"noseCurve":-0.25,"mouthWidth":0.34,"mouthHeight":-0.1,"upperLip":0.34,"lowerLip":0.28,"mouthCorners":-0.16,"cupidsBow":0.47,"mouthDepth":0.15,"chinLength":0.18,"chinJut":-0.34,"underbite":-0.05,"chinCleft":-0.62,"jawAngle":-0.03,"cheekbones":-0.35,"cheekHeight":0.29,"headHeight":0.18,"headDepth":-0.03,"foreheadHeight":-0.26,"foreheadSlope":-0.05,"earSize":0.16,"earOut":-0.57,"earLobe":-0.55}},
  {"id":"mh_face_m11","label":"Face M11","gender":"male","author":"","license":"","source":"","face":{"head":-0.16,"jaw":0.19,"nose":0.13,"cheeks":-0.31,"eyeSize":-0.03,"eyeHeight":-0.38,"eyeTilt":0.16,"eyeOpen":0.07,"eyeDepth":-0.16,"eyelid":0.47,"eyeBags":0.11,"epicanthus":-0.15,"browHeight":-0.38,"browAngle":0.04,"browRidge":-1,"noseWidth":0.02,"noseDepth":-0.19,"noseHeight":-0.29,"noseTip":0.14,"nostrils":-0.19,"noseCurve":-0.27,"mouthHeight":0.13,"upperLip":-0.38,"lowerLip":0.2,"mouthCorners":0.05,"cupidsBow":0.25,"mouthDepth":0.29,"chinLength":-0.25,"chinJut":-0.06,"underbite":0.26,"cheekbones":-0.58,"cheekHeight":-0.56,"headHeight":0.07,"headDepth":-0.28,"faceFat":-0.26,"faceAge":-0.08,"foreheadHeight":-0.41,"foreheadSlope":0.77}},
  {"id":"mh_face_m12","label":"Face M12","gender":"male","author":"","license":"","source":"","face":{"jaw":0.19,"nose":-0.04,"cheeks":0.24,"eyeSize":-0.11,"eyeHeight":-0.33,"eyeSpacing":0.17,"eyeTilt":0.2,"eyeOpen":0.44,"eyeDepth":-0.41,"eyelid":0.36,"eyeBags":0.08,"epicanthus":-0.06,"browHeight":0.06,"browAngle":0.2,"browRidge":0.2,"noseWidth":-0.33,"noseLength":0.47,"noseDepth":-0.18,"noseHeight":-0.5,"noseBridge":-0.07,"noseTip":-0.02,"nostrils":0.05,"noseCurve":-0.18,"mouthWidth":0.34,"mouthHeight":-0.29,"upperLip":-0.14,"lowerLip":0.08,"mouthCorners":0.07,"cupidsBow":0.43,"chinLength":0.1,"chinJut":0.21,"chinCleft":0.63,"jawAngle":-0.83,"cheekHeight":0.04,"faceFat":-0.4,"foreheadHeight":-0.2,"foreheadSlope":0.36,"earPoint":-0.03,"neckThick":0.07}},
  {"id":"mh_face_avg_f","label":"Face Avg F","gender":"female","author":"","license":"","source":"","face":{"head":-0.03,"jaw":-0.17,"cheeks":-0.17,"eyeSize":-0.06,"eyeHeight":0.05,"eyeSpacing":-0.05,"eyeTilt":0.04,"eyeOpen":0.08,"eyeDepth":-0.19,"eyelid":0.27,"eyeBags":-0.08,"epicanthus":0.03,"browHeight":0.3,"browAngle":0.09,"browRidge":-0.12,"noseWidth":-0.09,"noseLength":0.07,"noseDepth":-0.16,"noseHeight":-0.27,"noseBridge":0.02,"noseTip":-0.07,"nostrils":-0.1,"noseCurve":-0.08,"mouthWidth":-0.01,"mouthHeight":-0.06,"upperLip":-0.08,"lowerLip":-0.08,"mouthCorners":0.04,"cupidsBow":0.06,"mouthDepth":0.02,"chinLength":-0.02,"chinJut":0.14,"underbite":0.03,"chinCleft":-0.06,"jawAngle":-0.33,"cheekbones":-0.03,"cheekHeight":0.13,"headHeight":0.03,"headDepth":-0.02,"faceFat":-0.22,"faceAge":-0.03,"foreheadHeight":-0.11,"foreheadSlope":0.07,"earSize":-0.04,"earOut":-0.03,"earPoint":0.01,"earLobe":0.03,"neckThick":0.02}},
  {"id":"mh_face_avg_m","label":"Face Avg M","gender":"male","author":"","license":"","source":"","face":{"head":-0.01,"jaw":0.16,"nose":0.04,"cheeks":-0.03,"eyeSize":-0.03,"eyeHeight":-0.19,"eyeSpacing":0.02,"eyeTilt":0.1,"eyeOpen":0.18,"eyeDepth":-0.07,"eyelid":0.26,"eyeBags":-0.01,"epicanthus":0.09,"browHeight":-0.09,"browAngle":0.05,"noseWidth":-0.12,"noseLength":0.18,"noseDepth":0.11,"noseHeight":-0.2,"noseBridge":0.04,"noseTip":0.06,"nostrils":-0.02,"noseCurve":-0.12,"mouthWidth":0.17,"mouthHeight":-0.12,"upperLip":0.09,"lowerLip":0.03,"mouthCorners":-0.04,"cupidsBow":0.37,"mouthDepth":0.1,"chinLength":0.04,"chinJut":0.07,"underbite":0.05,"chinCleft":0.13,"jawAngle":-0.04,"cheekbones":-0.12,"cheekHeight":-0.03,"headHeight":0.07,"headDepth":-0.03,"faceFat":-0.1,"faceAge":-0.04,"foreheadHeight":-0.16,"foreheadSlope":0.11,"earSize":0.03,"earOut":-0.25,"earLobe":-0.05,"neckThick":0.09}},
  {"id":"mh_face_avg","label":"Face Avg","gender":"male","author":"","license":"","source":"","face":{"head":-0.02,"nose":0.02,"cheeks":-0.1,"eyeSize":-0.05,"eyeHeight":-0.07,"eyeSpacing":-0.02,"eyeTilt":0.07,"eyeOpen":0.13,"eyeDepth":-0.13,"eyelid":0.26,"eyeBags":-0.05,"epicanthus":0.06,"browHeight":0.1,"browAngle":0.07,"browRidge":-0.06,"noseWidth":-0.1,"noseLength":0.12,"noseDepth":-0.02,"noseHeight":-0.24,"noseBridge":0.03,"noseTip":0.01,"nostrils":-0.06,"noseCurve":-0.1,"mouthWidth":0.08,"mouthHeight":-0.09,"lowerLip":-0.02,"cupidsBow":0.21,"mouthDepth":0.06,"chinLength":0.01,"chinJut":0.1,"underbite":0.04,"chinCleft":0.04,"jawAngle":-0.18,"cheekbones":-0.08,"cheekHeight":0.05,"headHeight":0.05,"headDepth":-0.02,"faceFat":-0.16,"faceAge":-0.03,"foreheadHeight":-0.13,"foreheadSlope":0.09,"earOut":-0.14,"earLobe":-0.01,"neckThick":0.05}}
];
// EW_MPFB_FACE_PRESETS:END
/* the face keys a look should take when it moves onto `body`: the body gender's default face when the look's face is untouched
   (all 0) or still another default face; all 0 when it goes back to a classic base wearing a default face (head / jaw / nose /
   cheeks / eye size shape the classic head too); {} when the player has made the face their own. `force` = FACE > DEFAULT FACE. */
function mpfbFacePatch(a, body, force) {
  const cur = a || {}, row = EW_MPFB_BODIES.find(b => b.id === body);
  const same = (d) => EW_FACE_RESET_KEYS.every(k => Math.abs((+cur[k] || 0) - ((d && d[k]) || 0)) < 0.004);
  const isDefault = same(EW_MPFB_DEFAULT_FACES.male) || same(EW_MPFB_DEFAULT_FACES.female);
  const full = (d) => { const o = {}; EW_FACE_RESET_KEYS.forEach(k => { o[k] = (d && d[k]) || 0; }); return o; };
  if (!row) return isDefault ? full(null) : {};
  return (force || same(null) || isDefault) ? full(EW_MPFB_DEFAULT_FACES[row.gender]) : {};
}
// enum fields: allowed values (first = default)
/* THE IDLE POSE (2026-11-01, mondo: "can we also add an option to change their idle pose in the character creator?"): the
   standing idles already in the shared animation library (EW_ANIM_LIB_URLS: lib 0 UAL1, 1 UAL2, 2 MAL1), nothing new made.
   appearance.idle = a row id ('default' = the body's / race's own idle, unchanged). getCharacterAppearanceModel hands the pick
   to the renderer as def.idlePick; three-renderer.js _animLibBakeForModel bakes it on demand as the synthetic slot
   'clip:<clip>' and plays it as the rig's idle (the shared per-model bake is never changed, so two looks on one body can
   idle differently). The prop idles (torch, lantern, phone) and the sit / lean / swim / mid-air loops are left out: no prop,
   no seat, no rail. */
const EW_IDLE_POSES = [
  { id: 'default',                label: 'Default' },
  { id: 'Idle_5',                 label: 'Wide stance',     clip: 'Idle_5',                 lib: 2, ts: 1.0 },
  { id: 'Idle_11',                label: 'Upright',         clip: 'Idle_11',                lib: 2, ts: 1.0 },
  { id: 'Idle_Loop',              label: 'Relaxed',         clip: 'Idle_Loop',              lib: 0, ts: 1.0 },
  { id: 'Idle_10',                label: 'Brawler sway',    clip: 'Idle_10',                lib: 2, ts: 1.0 },
  { id: 'Idle_FoldArms_Loop',     label: 'Arms folded',     clip: 'Idle_FoldArms_Loop',     lib: 1, ts: 1.0 },
  { id: 'Idle_Talking_Loop',      label: 'Talking',         clip: 'Idle_Talking_Loop',      lib: 0, ts: 1.0 },
  { id: 'Idle_No_Loop',           label: 'Shaking head',    clip: 'Idle_No_Loop',           lib: 1, ts: 1.0 },
  { id: 'Sword_Idle',             label: 'Sword ready',     clip: 'Sword_Idle',             lib: 0, ts: 1.0 },
  { id: 'Pistol_Idle_Loop',       label: 'Pistol ready',    clip: 'Pistol_Idle_Loop',       lib: 0, ts: 1.0 },
  { id: 'Idle_Shield_Loop',       label: 'Shield guard',    clip: 'Idle_Shield_Loop',       lib: 1, ts: 1.0 },
  { id: 'Spell_Simple_Idle_Loop', label: 'Spell ready',     clip: 'Spell_Simple_Idle_Loop', lib: 0, ts: 1.0 },
  { id: 'Crouch_Idle_Loop',       label: 'Crouch',          clip: 'Crouch_Idle_Loop',       lib: 0, ts: 1.0 },
  { id: 'Zombie_Idle_Loop',       label: 'Zombie',          clip: 'Zombie_Idle_Loop',       lib: 1, ts: 1.0 },
  /* THE MOCAP LIBRARY (2026-11-05, rev 2): the motion-capture idles (lib 5, MOC1_CMU.glb, bake-mocap.py + mocap-clips.json) */
  { id: 'MOC_ShiftWeight_Idle',   label: 'Weight shift',    clip: 'MOC_ShiftWeight_Idle',   lib: 5, ts: 1.0 },
  // THE PLAIN MOCAP (2026-11-05, mondo: "Are there not any simple or subtle ones?"): lib 6 MOC2_100STYLE.glb, the 100STYLE dataset
  // (Ian Mason, CC BY 4.0) idles, each watched over full loops front + side on the default and a heavy body
  { id: 'S100_Neutral_Idle',      label: 'Neutral',         clip: 'S100_Neutral_Idle',        lib: 6, ts: 1.0 },
  { id: 'S100_ArmsBehindBack_Idle', label: 'Hands behind back', clip: 'S100_ArmsBehindBack_Idle', lib: 6, ts: 1.0 },
  { id: 'S100_ArmsFolded_Idle',   label: 'Arms crossed',    clip: 'S100_ArmsFolded_Idle',     lib: 6, ts: 1.0 },
  { id: 'S100_Proud_Idle',        label: 'Proud',           clip: 'S100_Proud_Idle',          lib: 6, ts: 1.0 },  /* THE MESHY ANIMATION PULL (2026-11-11): the standing idles from lib 7 (MAL4_Sniper.glb), each looked at on a frame sheet of
     the whole clip; the ones that turn round, bend back, jump or cast stay in the file but are not offered here */
  { id: 'MAL_Idle_3',                      label: 'Meshy calm',          clip: 'Idle_3',                          lib: 7, ts: 1.0 },
  { id: 'MAL_Idle_4',                      label: 'Meshy still',         clip: 'Idle_4',                          lib: 7, ts: 1.0 },
  { id: 'MAL_Idle_6',                      label: 'Meshy arms out',      clip: 'Idle_6',                          lib: 7, ts: 1.0 },
  { id: 'MAL_Idle_7',                      label: 'Meshy idle 7',        clip: 'Idle_7',                          lib: 7, ts: 1.0 },
  { id: 'MAL_Idle_9',                      label: 'Meshy idle 9',        clip: 'Idle_9',                          lib: 7, ts: 1.0 },
  { id: 'MAL_Idle_12',                     label: 'Meshy idle 12',       clip: 'Idle_12',                         lib: 7, ts: 1.0 },
  { id: 'MAL_Long_Breathe_and_Look_Around', label: 'Breathe, long',       clip: 'Long_Breathe_and_Look_Around',    lib: 7, ts: 1.0 },
  { id: 'MAL_Short_Breathe_and_Look_Around', label: 'Breathe, short',      clip: 'Short_Breathe_and_Look_Around',   lib: 7, ts: 1.0 },
  { id: 'MAL_Axe_Breathe_and_Look_Around', label: 'Hunched breathing',   clip: 'Axe_Breathe_and_Look_Around',     lib: 7, ts: 1.0 },
  { id: 'MAL_Idle_8',                      label: 'Look around',         clip: 'Idle_8',                          lib: 7, ts: 1.0 },
  { id: 'MAL_Alert',                       label: 'Alert',               clip: 'Alert',                           lib: 7, ts: 1.0 },
  { id: 'MAL_Idle_02',                     label: 'Fight ready',         clip: 'Idle_02',                         lib: 7, ts: 1.0 },
  { id: 'MAL_Combat_Stance',               label: 'Combat stance',       clip: 'Combat_Stance',                   lib: 7, ts: 1.0 },
  { id: 'MAL_Confused_Scratch',            label: 'Head scratch',        clip: 'Confused_Scratch',                lib: 7, ts: 1.0 },
  { id: 'MAL_Hand_on_Hip_Gesture',         label: 'Hand on hip',         clip: 'Hand_on_Hip_Gesture',             lib: 7, ts: 1.0 },
  { id: 'MAL_Scheming_Hand_Rub',           label: 'Hand rub',            clip: 'Scheming_Hand_Rub',               lib: 7, ts: 1.0 },
];
/* THE WALK STYLE (2026-11-05, mondo: "add the walk animations to the character creator just like the idle animations so i can see
   those too"): appearance.walk = a row id ('default' = the body's / race's own walk). Works like THE IDLE POSE: getCharacterAppearanceModel
   hands the pick to the renderer as def.walkPick, three-renderer.js bakes it on demand as 'clip:<clip>' and plays it as THIS rig's
   walk. `ts` = the board speed: the clip's one stride cycle played in 0.52 s like the library Walking (sprites.js UAL_SLOTS walk), so
   the legs keep up with how fast a unit crosses a square; the creator's walk preview plays every walk at its recorded speed. */
const EW_WALK_STYLES = [
  { id: 'default',             label: 'Default' },
  { id: 'MOC_Normal_Walk',     label: 'Normal',      clip: 'MOC_Normal_Walk',     lib: 5, ts: 2.37 },
  { id: 'MOC_Confident_Walk',  label: 'Confident',   clip: 'MOC_Confident_Walk',  lib: 5, ts: 2.63 },
  { id: 'MOC_Strong_Walk',     label: 'Strongman',   clip: 'MOC_Strong_Walk',     lib: 5, ts: 3.52 },
  { id: 'MOC_Heavy_Walk',      label: 'Heavyset',    clip: 'MOC_Heavy_Walk',      lib: 5, ts: 3.21 },
  { id: 'MOC_Cool_Walk',       label: 'Cool',        clip: 'MOC_Cool_Walk',       lib: 5, ts: 2.63 },
  { id: 'MOC_Slow_Walk',       label: 'Slow',        clip: 'MOC_Slow_Walk',       lib: 5, ts: 3.65 },
  // THE PLAIN MOCAP: the 100STYLE walks (lib 6), same looks as the idles above
  { id: 'S100_Neutral_Walk',        label: 'Neutral',           clip: 'S100_Neutral_Walk',        lib: 6, ts: 2.69 },
  { id: 'S100_ArmsBehindBack_Walk', label: 'Hands behind back', clip: 'S100_ArmsBehindBack_Walk', lib: 6, ts: 2.75 },
  { id: 'S100_ArmsFolded_Walk',     label: 'Arms crossed',      clip: 'S100_ArmsFolded_Walk',     lib: 6, ts: 2.69 },
  { id: 'S100_Proud_Walk',          label: 'Proud',             clip: 'S100_Proud_Walk',          lib: 6, ts: 2.37 },
  // the walks the game already had (mondo 11-05: "Are there not other walk animations from the ual 1 or 2?"): UAL1 Walk_Loop +
  // Walk_Formal_Loop (Quaternius), MAL1 Walking_Woman (the Meshy batch; MAL1 Walking is Default)
  { id: 'UAL_Walk_Loop',       label: 'UAL walk',    clip: 'Walk_Loop',           lib: 0, ts: 2.56 },
  { id: 'UAL_Walk_Formal',     label: 'UAL formal',  clip: 'Walk_Formal_Loop',    lib: 0, ts: 2.56 },
  { id: 'MAL_Walking_Woman',   label: 'Meshy woman', clip: 'Walking_Woman',       lib: 2, ts: 1.92 },  /* THE MESHY ANIMATION PULL (2026-11-11): the walks from lib 7 (MAL4_Sniper.glb). ts = the stride cycle build-mal.py measured
     (the feet trading the lead) / 0.52 s, capped at 3.6 so a slow walk (Sneaky, Slow orc, Elderly) is not played frantic */
  { id: 'MAL_Casual_Walk',                   label: 'Casual',            clip: 'Casual_Walk',                   lib: 7, ts: 2.69 },
  { id: 'MAL_walking_2',                     label: 'Meshy walk 2',      clip: 'walking_2',                     lib: 7, ts: 2.24 },
  { id: 'MAL_Quick_Walk',                    label: 'Quick',             clip: 'Quick_Walk',                    lib: 7, ts: 1.92 },
  { id: 'MAL_Proud_Strut',                   label: 'Proud strut',       clip: 'Proud_Strut',                   lib: 7, ts: 2.85 },
  { id: 'MAL_Confident_Strut',               label: 'Confident strut',   clip: 'Confident_Strut',               lib: 7, ts: 2.69 },
  { id: 'MAL_Stylish_Walk',                  label: 'Stylish',           clip: 'Stylish_Walk',                  lib: 7, ts: 2.24 },
  { id: 'MAL_Flirty_Strut',                  label: 'Flirty strut',      clip: 'Flirty_Strut',                  lib: 7, ts: 2.88 },
  { id: 'MAL_Thoughtful_Walk',               label: 'Thoughtful',        clip: 'Thoughtful_Walk',               lib: 7, ts: 3.01 },
  { id: 'MAL_Spear_Walk',                    label: 'Marching',          clip: 'Spear_Walk',                    lib: 7, ts: 2.12 },
  { id: 'MAL_Walk_Fight_Forward',            label: 'Fighting advance',  clip: 'Walk_Fight_Forward',            lib: 7, ts: 3.27 },
  { id: 'MAL_Cautious_Crouch_Walk_Forward',  label: 'Crouched',          clip: 'Cautious_Crouch_Walk_Forward',  lib: 7, ts: 2.18 },
  { id: 'MAL_Sneaky_Walk',                   label: 'Sneaky',            clip: 'Sneaky_Walk',                   lib: 7, ts: 3.60 },
  { id: 'MAL_Monster_Walk',                  label: 'Monster',           clip: 'Monster_Walk',                  lib: 7, ts: 2.60 },
  { id: 'MAL_Slow_Orc_Walk',                 label: 'Slow orc',          clip: 'Slow_Orc_Walk',                 lib: 7, ts: 3.60 },
  { id: 'MAL_Mummy_Stagger',                 label: 'Mummy',             clip: 'Mummy_Stagger',                 lib: 7, ts: 3.08 },
  { id: 'MAL_Unsteady_Walk',                 label: 'Unsteady',          clip: 'Unsteady_Walk',                 lib: 7, ts: 1.86 },
  { id: 'MAL_Injured_Walk',                  label: 'Injured',           clip: 'Injured_Walk',                  lib: 7, ts: 2.81 },
  { id: 'MAL_Limping_Walk',                  label: 'Limping',           clip: 'Limping_Walk',                  lib: 7, ts: 3.37 },
  { id: 'MAL_Elderly_Shaky_Walk',            label: 'Elderly',           clip: 'Elderly_Shaky_Walk',            lib: 7, ts: 3.60 },
];
const EW_APPEARANCE_ENUMS = {
  idle: EW_IDLE_POSES.map(o => o.id),   // THE IDLE POSE ('default' first = the body's own idle)
  walk: EW_WALK_STYLES.map(o => o.id),  // THE WALK STYLE ('default' first = the body's own walk)
  body: ['classic'].concat(EW_MPFB_BODIES.map(b => b.id)),
  // THE LOOKS (2026-11-01): an MPFB body's skin / eyes / brows / lashes ('own' = the body's own, EW_MH_LOOKS.kits)
  mhSkin: ['own'].concat(EW_MH_LOOKS.skins.map(r => r[0])),
  mhEyes: ['own'].concat(EW_MH_LOOKS.eyes.map(r => r[0]), EW_MH_EYE_PACK.map(r => r[0])),   // (+ THE EYE PACK)
  mhBrows: ['own'].concat(EW_MH_LOOKS.brows.map(r => r[0])),
  mhLashes: ['own'].concat(EW_MH_LOOKS.lashes.map(r => r[0])),
  lipTint: ['own', 'pick'],   // THE LIP COLOUR (2026-11-03): an MPFB body's lips as the skin paints them / lipColor
  /* THE LOOK COLOURS (2026-11-03, mondo: "why can i not just pick a skin color under the skin tab? ... there is no color picker ...
     Everything that can possibly have one needs a tint/color picker"): an MPFB body's skin / iris / brows / lashes keep the pick's
     own colour ('own') or take a picked one (three-renderer.js setLook) */
  skinTint: ['own', 'pick'],   // 'pick' = the skin sheet shifted to appearance.skin (the classic skin tone's key)
  eyeTint: ['own', 'pick'],    // 'pick' = the irises in appearance.eyeColor (the classic eye colour's key)
  browTint: ['own', 'hair', 'pick'],   // the brows in their own colour / the hair colour / browColor
  lashTint: ['own', 'pick'],   // 'pick' = lashColor
  /* THE MAKE-UP (2026-11-12, mondo: "make a way in the creator to add makeup too"): eye liner / eye shadow / blush on an MPFB body,
     each off ('own' = the skin as it is) or painted in its picked colour (linerColor / shadowColor / blushColor) through
     EW_MH_MAKEUP's mask (three-renderer.js paintMakeup) */
  linerTint: ['own', 'pick'], shadowTint: ['own', 'pick'], blushTint: ['own', 'pick'],
  hairMat: ['own'].concat(EW_MH_HAIR_MATS.map(r => r[0])),   // THE HAIR MATERIALS (2026-11-03): a MakeHuman recolour of the worn system style
  hairAccent: ['own', 'tint'],   // THE SECOND HAIR COLOUR (2026-11-01): an `accent` hair's piece in its own colours / hairColor2
  mhChest: ['nipples', 'smooth'],   // THE CHEST (2026-11-01; 'band' gone with the underwear 2026-11-02)   // 2026-11-01: the base body (classic Meshy bases or an MPFB body)
  hair: ['bald'].concat(EW_HAIR_STYLE_IDS),
  beard: ['none', 'stubble', 'beard', 'goatee', 'moustache', 'fullbeard'],   // rev 10: + moustache · full beard
  beardTint: ['hair', 'pick', 'own'],   // THE FACIAL HAIR (pack beards on an MPFB body): the hair colour, beardColor, its own
  outfit2: EW_OUTFIT2_IDS,    // rev 10: the extra layers
  bottoms2: EW_BOTTOMS2_IDS,
  outfit: EW_OUTFIT_STYLES.map(o => o.id),
  bottoms: ['none'].concat(EW_BOTTOM_STYLES.map(o => o.id)),   // 2026-11-02: 'none' = no coded bottoms (THE RETIRED CLASSIC CLOTHES)
  outer: EW_OUTER_STYLES.map(o => o.id),
  outer2: EW_OUTER_STYLES.map(o => o.id),   // 2026-11-01 THE SECOND OUTER LAYER: the same catalogue ('none' first = not worn)
  outerFront: ['auto', 'open', 'closed'],    // 2026-11-02 THE OPEN + CLOSED FRONTS ('auto' = as the pick was made)
  outer2Front: ['auto', 'open', 'closed'],
  pantsTuck: ['out', 'in'],   // 2026-11-03 THE PANTS IN THE BOOTS: the trouser legs over the boots ('out', the default) or tucked in
  feet: EW_FEET_STYLES.map(o => o.id),
  gloves: EW_GLOVE_STYLES.map(o => o.id),
  belt: EW_BELT_STYLES.map(o => o.id),
  neckwear: EW_NECKWEAR_STYLES.map(o => o.id),   // rev 9
  glasses: EW_GLASSES_STYLES.map(o => o.id),     // rev 9
  wings: EW_WINGS_STYLES.map(o => o.id),         // 2026-10-27
  cape: EW_CAPE_STYLES.map(o => o.id),           // 2026-11-01 THE BLENDER CAPES
  capeFabric: EW_FABRIC_IDS,
  capePattern: EW_PATTERN_IDS,
  topFabric: EW_FABRIC_IDS,
  bottomFabric: EW_FABRIC_IDS,
  outerFabric: EW_FABRIC_IDS,
  feetFabric: EW_FABRIC_IDS,
  glovesFabric: EW_FABRIC_IDS,
  beltFabric: EW_FABRIC_IDS,
  top2Fabric: EW_FABRIC_IDS,      // rev 10
  bottom2Fabric: EW_FABRIC_IDS,
  outer2Fabric: EW_FABRIC_IDS,    // THE SECOND OUTER LAYER
  // rev 8: the print on each layer
  topPattern: EW_PATTERN_IDS,
  bottomPattern: EW_PATTERN_IDS,
  outerPattern: EW_PATTERN_IDS,
  feetPattern: EW_PATTERN_IDS,
  glovesPattern: EW_PATTERN_IDS,
  beltPattern: EW_PATTERN_IDS,
  top2Pattern: EW_PATTERN_IDS,    // rev 10
  bottom2Pattern: EW_PATTERN_IDS,
  outer2Pattern: EW_PATTERN_IDS,  // THE SECOND OUTER LAYER
  /* THE RACE LOOKS (2026-11-01): 'original' = this slot wears its race's own model (the Meshy one) instead of the creator look
     (the forge's USE ORIGINAL MODEL on a race that has a baked creator look, RACE_CREATOR_LOOKS) */
  model: ['creator', 'original'],
};
const EW_APPEARANCE_COLORS = { skin: '#b98362', hairColor: '#27201c', eyeColor: '#4a6b8a', lipColor: '#9c5a5c', topColor: '#8fa3a8', bottomColor: '#5e6f80', outerColor: '#2a2f38', feetColor: '#2b241f', glovesColor: '#3a2a22', beltColor: '#4a3220',
  // rev 8: the print's colour (colour 2) per layer
  topColor2: '#f0ece2', bottomColor2: '#f0ece2', outerColor2: '#c9a227', feetColor2: '#f0ece2', glovesColor2: '#f0ece2', beltColor2: '#f0cf7e',
  // rev 9: the accessories' colours
  tieColor: '#7a1f1f', glassesColor: '#1b1b1f', wingsColor: '#f2f2f2',
  // rev 10: the extra layers' colours
  top2Color: '#5e6f80', top2Color2: '#f0ece2',   // (THE LAYERS 1 2 3, 2026-11-04: the Layer 2 shirt's colour, slate; was red for the retired coded second top)
  bottom2Color: '#c0392b', bottom2Color2: '#f0cf7e',
  outer2Color: '#5a4636', outer2Color2: '#c9a227',   // THE SECOND OUTER LAYER
  capeColor: '#7a1f1f', capeColor2: '#c9a227',   // THE BLENDER CAPES
  beardColor: '#27201c',   // THE FACIAL HAIR (beardTint 'pick')
  browColor: '#2a1d14', lashColor: '#141010',
  linerColor: '#17110f', shadowColor: '#6b4a55', blushColor: '#c9727c',   // THE MAKE-UP (linerTint / shadowTint / blushTint 'pick')
    // THE LOOK COLOURS (browTint / lashTint 'pick')
  // 2026-11-01 THE SECOND HAIR COLOUR: a pack style's band / tie / beads (worn when hairAccent = 'tint')
  hairColor2: '#c0392b' };
const EW_APPEARANCE_DEFAULTS = { hair: 'hair003', outfit: 'none', bottoms: 'none', outer: 'none', feet: 'bsneakers',   // (2026-11-02 THE RETIRED CLASSIC CLOTHES: a bare look is dressed by retireClassicClothes)
  gloves: 'none', belt: 'none', beard: 'none', neckwear: 'none', glasses: 'none', wings: 'none', topFabric: 'cotton', bottomFabric: 'denim', outerFabric: 'canvas', feetFabric: 'leather', glovesFabric: 'leather', beltFabric: 'leather',
  topPattern: 'solid', bottomPattern: 'solid', outerPattern: 'solid', feetPattern: 'solid', glovesPattern: 'solid', beltPattern: 'solid',
  outfit2: 'none', bottoms2: 'none', top2Fabric: 'cotton', bottom2Fabric: 'cotton', top2Pattern: 'solid', bottom2Pattern: 'solid',
  cape: 'none', capeFabric: 'velvet', capePattern: 'solid',   // THE BLENDER CAPES
  outer2: 'none', outer2Fabric: 'wool', outer2Pattern: 'solid' };   // THE SECOND OUTER LAYER
// the fabric + tint (+ rev 8: pattern + colour 2) keys of every layer (the builder's rows, the renderer's paint, the asset warm-up)
// rev 10: `slot` = the style key the layer is worn through, `extra` = an ADD LAYER layer (the builder's ＋)
const EW_APPEARANCE_LAYERS = [
  { id: 'top',     slot: 'outfit',   fabric: 'topFabric',     color: 'topColor',     pattern: 'topPattern',     color2: 'topColor2' },
  { id: 'bottom',  slot: 'bottoms',  fabric: 'bottomFabric',  color: 'bottomColor',  pattern: 'bottomPattern',  color2: 'bottomColor2' },
  { id: 'outer',   slot: 'outer',    fabric: 'outerFabric',   color: 'outerColor',   pattern: 'outerPattern',   color2: 'outerColor2' },
  { id: 'feet',    slot: 'feet',     fabric: 'feetFabric',    color: 'feetColor',    pattern: 'feetPattern',    color2: 'feetColor2' },
  { id: 'gloves',  slot: 'gloves',   fabric: 'glovesFabric',  color: 'glovesColor',  pattern: 'glovesPattern',  color2: 'glovesColor2' },
  { id: 'belt',    slot: 'belt',     fabric: 'beltFabric',    color: 'beltColor',    pattern: 'beltPattern',    color2: 'beltColor2' },
  { id: 'top2',    slot: 'outfit2',  fabric: 'top2Fabric',    color: 'top2Color',    pattern: 'top2Pattern',    color2: 'top2Color2',    extra: true, label: 'Second top' },
  { id: 'bottom2', slot: 'bottoms2', fabric: 'bottom2Fabric', color: 'bottom2Color', pattern: 'bottom2Pattern', color2: 'bottom2Color2', extra: true, label: 'Second bottoms' },
  // 2026-11-01 THE SECOND OUTER LAYER (mondo: "another outer layer ... with the coats and stuff"): an Outer pick worn OVER the outer
  { id: 'outer2',  slot: 'outer2',   fabric: 'outer2Fabric',  color: 'outer2Color',  pattern: 'outer2Pattern',  color2: 'outer2Color2',  extra: true, label: 'Second outer layer' },
  { id: 'cape',    slot: 'cape',     fabric: 'capeFabric',    color: 'capeColor',    pattern: 'capePattern',    color2: 'capeColor2',    mesh: true },   // THE BLENDER CAPES (MPFB bodies)
];
// v1 (2026-09-10 procedural shells) → v2 ids
const _EW_APPEARANCE_LEGACY_HAIR = { crop: 'hair003', crest: 'hair000', bald: 'bald' };
function normalizeCharacterAppearance(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  /* THE CAST ON THE BOARD (2026-11-12): `{ cast: '<DOOR_CAST_MODELS id>' }` is not a creator look — it names a story character's
     own model (getRace3DModel reads it); every creator reader takes it as "no look" */
  if (typeof value.cast === 'string' && value.cast) return null;
  if (value.version != null && value.version !== 1 && value.version !== 2) return null;
  // the rev 6 `jacket` TOP (a long sleeve with a collar) is the OUTER layer over a tee since rev 7
  if (value.outfit === 'jacket') value = Object.assign({}, value, { outfit: 'tee', outer: value.outer == null ? 'jacket' : value.outer });
  value = retireClassicClothes(value);   // 2026-11-02 THE RETIRED CLASSIC CLOTHES: the coded pieces -> their pack / Blender replacements
  const out = { version: 2 };
  for (const key of Object.keys(EW_APPEARANCE_LIMITS)) {
    const [lo, hi, def] = EW_APPEARANCE_LIMITS[key];
    const n = value[key];
    out[key] = typeof n === 'number' && Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def;
  }
  for (const key of Object.keys(EW_APPEARANCE_COLORS)) {
    out[key] = typeof value[key] === 'string' && /^#[0-9a-f]{6}$/i.test(value[key]) ? value[key].toLowerCase() : EW_APPEARANCE_COLORS[key];
  }
  for (const key of Object.keys(EW_APPEARANCE_ENUMS)) {
    let v = value[key];
    if (key === 'hair' && typeof v === 'string' && _EW_APPEARANCE_LEGACY_HAIR[v]) v = _EW_APPEARANCE_LEGACY_HAIR[v];
    out[key] = EW_APPEARANCE_ENUMS[key].includes(v) ? v : (EW_APPEARANCE_DEFAULTS[key] || EW_APPEARANCE_ENUMS[key][0]);
  }
  out.wear = normalizeWearList(value.wear);   // THE PACK CLOTHES (an MPFB body wears them)
  out.wear2 = normalizeWear2(value.wear2, out.wear);   // THE LAYERS 1 2 3: a second top over the first ('none' = not worn)
  const wornAll = out.wear2 !== 'none' ? out.wear.concat([out.wear2]) : out.wear;
  out.wearTint = normalizeWearTint(value.wearTint, wornAll);   // THE WEAR TINT (a worn pack piece's colour; left out = its own)
  out.wearFabric = normalizeWearFabric(value.wearFabric, wornAll);   // THE PACK FABRICS (a worn pack pair of trousers' fabric; left out = its own)
  return out;
}
/* THE HIDDEN PICKS (2026-11-03, mondo: "a devtool that let's me remove models like certain clothes and hairstyles from the character
   creator ... some hairstyles that are not as high quality as the others, and it would be easier for me to manually exclude them").
   Creator picks kept OFF the creator's lists (party-builder.js CreatorControls) and off RANDOMIZE. NOTHING IS DELETED: the piece, its
   file and every look wearing it stay, normalizeCharacterAppearance never reads this list (a saved / baked / locker look with a hidden
   piece loads as it did), and a hidden piece that is worn keeps its tile so it shows + can be taken off.
   Keys are '<kind>:<id>' (kind = the appearance key the pick sets): hair, wear (the pack + Blender pieces, facial hair, accessories),
   outer (both outer layers), feet, cape, wings, idle, mhSkin, mhEyes, mhBrows, mhLashes, hairMat.
   EW_CREATOR_HIDDEN = the shipped list ({ key: label }), written ONLY by bake-hidden.js. This browser's own edits ride on top in
   localStorage ew_creator_hidden_v1 = { hide: { key: label }, show: { key: label } } (show = a shipped one shown again here).
   The tool itself shows only while Settings > Developer > Creator Item Hider is ON (ew_creator_hider = '1'). */
// EW_CREATOR_HIDDEN:BEGIN
const EW_CREATOR_HIDDEN = {};
// EW_CREATOR_HIDDEN:END
const EW_CREATOR_HIDDEN_KEY = 'ew_creator_hidden_v1', EW_CREATOR_HIDER_KEY = 'ew_creator_hider';
let _ewHidLocalCache = null;
function _ewHidLocal() {
  if (_ewHidLocalCache) return _ewHidLocalCache;
  let d = null;
  try { d = JSON.parse(localStorage.getItem(EW_CREATOR_HIDDEN_KEY) || 'null'); } catch (e) {}
  const obj = o => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
  return (_ewHidLocalCache = { hide: obj(d && d.hide), show: obj(d && d.show) });
}
function _ewHidSave() {
  try { localStorage.setItem(EW_CREATOR_HIDDEN_KEY, JSON.stringify(_ewHidLocal())); } catch (e) {}
  try { if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('ew-creator-hidden')); } catch (e) {}
}
// a pick that is never hidden: the "nothing" / "own" / "default" choices every list starts with
const _ewHidNever = id => id == null || id === '' || id === 'none' || id === 'own' || id === 'bald' || id === 'default';
function creatorHidden(kind, id) {
  if (_ewHidNever(id)) return false;
  const k = kind + ':' + id, L = _ewHidLocal();
  return Object.prototype.hasOwnProperty.call(L.hide, k) || (Object.prototype.hasOwnProperty.call(EW_CREATOR_HIDDEN, k) && !Object.prototype.hasOwnProperty.call(L.show, k));
}
function setCreatorHidden(kind, id, hide, label) {
  if (_ewHidNever(id)) return false;
  const k = kind + ':' + id, L = _ewHidLocal(), shipped = Object.prototype.hasOwnProperty.call(EW_CREATOR_HIDDEN, k);
  const lb = String(label || L.hide[k] || L.show[k] || EW_CREATOR_HIDDEN[k] || id);
  if (hide) { delete L.show[k]; if (!shipped) L.hide[k] = lb; }
  else { delete L.hide[k]; if (shipped) L.show[k] = lb; }
  _ewHidSave();
  return true;
}
// every hidden pick now: [{ key, kind, id, label, shipped }] (shipped = in the baked list), by kind then name
function creatorHiddenList() {
  const L = _ewHidLocal(), out = [];
  for (const k of Object.keys(EW_CREATOR_HIDDEN)) if (!Object.prototype.hasOwnProperty.call(L.show, k) && !Object.prototype.hasOwnProperty.call(L.hide, k)) out.push([k, EW_CREATOR_HIDDEN[k], true]);
  for (const k of Object.keys(L.hide)) out.push([k, L.hide[k], Object.prototype.hasOwnProperty.call(EW_CREATOR_HIDDEN, k)]);
  return out.map(([key, label, shipped]) => { const i = key.indexOf(':'); return { key, kind: key.slice(0, i), id: key.slice(i + 1), label: String(label || key.slice(i + 1)), shipped }; })
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label));
}
// SHOW ALL: every pick back on the lists in this browser (the shipped ones too, until a bake changes the list)
function creatorHiddenShowAll() {
  const L = _ewHidLocal();
  L.hide = {}; L.show = {};
  for (const k of Object.keys(EW_CREATOR_HIDDEN)) L.show[k] = EW_CREATOR_HIDDEN[k];
  _ewHidSave();
}
function creatorHiderOn() { try { return localStorage.getItem(EW_CREATOR_HIDER_KEY) === '1'; } catch (e) { return false; } }
function setCreatorHiderOn(on) {
  try { if (on) localStorage.setItem(EW_CREATOR_HIDER_KEY, '1'); else localStorage.removeItem(EW_CREATOR_HIDER_KEY); } catch (e) {}
  try { if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('ew-creator-hidden')); } catch (e) {}
}
// the export for bake-hidden.js: the WHOLE list as this browser shows it (the bake replaces the shipped list with it)
// (v 2, THE RENAMED PICKS 2026-11-03: the same file carries the creator's names too, { '<kind>:<id>': name }, also whole)
function creatorHiddenExport() {
  const hidden = {}, names = {};
  for (const r of creatorHiddenList()) hidden[r.key] = r.label;
  for (const r of creatorNamesList()) names[r.key] = r.name;
  return { kind: 'entropy-wars-creator-hidden', v: 2, made: new Date().toISOString(), hidden, names };
}
/* THE RENAMED PICKS (2026-11-03, mondo: "can i change the names of the models of the character creator? Or maybe in the same place
   where i can hide models in the creator?"): a creator pick shown under a name of his. DISPLAY ONLY: the creator's tiles show it; the
   pick's id, its catalogue row (whose pack name some rules read: a skin's "female", a beard's "beard") and every look stay as they are.
   Same kinds + keys as THE HIDDEN PICKS ('<kind>:<id>'); the "nothing" picks keep their names.
   EW_CREATOR_NAMES = the shipped names ({ key: name }), written ONLY by bake-hidden.js. This browser's own renames ride on top in
   localStorage ew_creator_names_v1 = { key: name } ('' = the pick's own name again, over a shipped one). */
// EW_CREATOR_NAMES:BEGIN
const EW_CREATOR_NAMES = {};
// EW_CREATOR_NAMES:END
const EW_CREATOR_NAMES_KEY = 'ew_creator_names_v1', EW_CREATOR_NAME_MAX = 40;
let _ewNameLocalCache = null;
function _ewNameLocal() {
  if (_ewNameLocalCache) return _ewNameLocalCache;
  let d = null;
  try { d = JSON.parse(localStorage.getItem(EW_CREATOR_NAMES_KEY) || 'null'); } catch (e) {}
  return (_ewNameLocalCache = d && typeof d === 'object' && !Array.isArray(d) ? d : {});
}
// the pick's own (pack / catalogue) name, from the catalogue its kind lists
function creatorPickLabel(kind, id) {
  const row = (list) => { const r = (list || []).find(o => (Array.isArray(o) ? o[0] : o && o.id) === id); return r ? String(Array.isArray(r) ? r[1] : r.label) : null; };
  const L = typeof EW_MH_LOOKS !== 'undefined' ? EW_MH_LOOKS : {};
  const lists = { hair: () => EW_HAIR_STYLES, wear: () => EW_MH_WEAR, outer: () => EW_OUTER_STYLES, feet: () => EW_FEET_STYLES, cape: () => EW_CAPE_STYLES,
    wings: () => EW_WINGS_STYLES, idle: () => EW_IDLE_POSES, walk: () => EW_WALK_STYLES, mhSkin: () => L.skins, mhEyes: () => (L.eyes || []).concat(typeof EW_MH_EYE_PACK !== 'undefined' ? EW_MH_EYE_PACK : []),
    hairMat: () => (typeof EW_MH_HAIR_MATS !== 'undefined' ? EW_MH_HAIR_MATS : []),   // THE HAIR MATERIALS
    mhBrows: () => L.brows, mhLashes: () => L.lashes };
  try { return lists[kind] ? row(lists[kind]()) : null; } catch (e) { return null; }
}
// his name for the pick, or null (the pick shows its own name)
function creatorRenamed(kind, id) {
  if (!kind || _ewHidNever(id)) return null;
  const k = kind + ':' + id, L = _ewNameLocal();
  const v = Object.prototype.hasOwnProperty.call(L, k) ? L[k] : EW_CREATOR_NAMES[k];
  return typeof v === 'string' && v.trim() ? v : null;
}
// the name a creator tile shows: his, or the one it came with
function creatorName(kind, id, label) { const n = creatorRenamed(kind, id); return n != null ? n : label; }
// rename a pick ('' / null / its own name = back to its own name)
function setCreatorName(kind, id, name) {
  if (!kind || _ewHidNever(id)) return false;
  const k = kind + ':' + id, L = _ewNameLocal(), shipped = Object.prototype.hasOwnProperty.call(EW_CREATOR_NAMES, k);
  let v = String(name == null ? '' : name).replace(/\s+/g, ' ').trim().slice(0, EW_CREATOR_NAME_MAX);
  if (v && v === creatorPickLabel(kind, id)) v = '';
  if (shipped ? v === EW_CREATOR_NAMES[k] : !v) delete L[k]; else L[k] = v;
  try { localStorage.setItem(EW_CREATOR_NAMES_KEY, JSON.stringify(L)); } catch (e) {}
  try { if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('ew-creator-hidden')); } catch (e) {}
  return true;
}
// every renamed pick now: [{ key, kind, id, name, label (its own name), shipped }], by kind then its own name
function creatorNamesList() {
  const keys = new Set(Object.keys(EW_CREATOR_NAMES).concat(Object.keys(_ewNameLocal()))), out = [];
  for (const key of keys) {
    const i = key.indexOf(':'), kind = key.slice(0, i), id = key.slice(i + 1), name = creatorRenamed(kind, id);
    if (name == null) continue;
    out.push({ key, kind, id, name, label: creatorPickLabel(kind, id) || id, shipped: EW_CREATOR_NAMES[key] === name });
  }
  return out.sort((a, b) => a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label));
}
// ALL ORIGINAL NAMES: every pick back to its own name in this browser (the shipped names too, until a bake changes them)
function creatorNamesReset() {
  const L = _ewNameLocal();
  for (const k of Object.keys(L)) delete L[k];
  for (const k of Object.keys(EW_CREATOR_NAMES)) L[k] = '';
  try { localStorage.setItem(EW_CREATOR_NAMES_KEY, JSON.stringify(L)); } catch (e) {}
  try { if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('ew-creator-hidden')); } catch (e) {}
}
// RANDOMIZE never rolls a hidden pick (the outer2 layer shares the outer list)
function _ewHidPickable(key, list) {
  const kind = key === 'outer2' ? 'outer' : key, ok = list.filter(v => !creatorHidden(kind, v));
  return ok.length ? ok : list;
}
// A fresh random look (the builder's RANDOMIZE). Plain Math.random — cosmetic only.
function randomCharacterAppearance(rng) {
  const r = typeof rng === 'function' ? rng : Math.random;
  const pick = a => a[Math.floor(r() * a.length)];
  const hex = (h, s, l) => { // hsl → #rrggbb
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
    return '#' + [f(0), f(8), f(4)].map(c => c.toString(16).padStart(2, '0')).join('');
  };
  const skinTones = ['#f4d7bf', '#e8c4a2', '#dfb18c', '#c9946b', '#b98362', '#a06a48', '#916044', '#7a4e36', '#66422e', '#4d3226', '#3c291f'];
  const hairTones = ['#0f0d0c', '#27201c', '#3b2a1f', '#5a3b25', '#7a4a2a', '#a0662e', '#c98a4a', '#e2c184', '#f1e2b3', '#8b1e1e', '#b5b5b5', '#f2f2f2'];
  const eyeTones = ['#2d2a26', '#4a3222', '#6b4b2a', '#3d5a3a', '#4a6b8a', '#6a8fb5', '#7a8c6a', '#9a9a9a'];
  const out = { version: 2 };
  for (const key of Object.keys(EW_APPEARANCE_LIMITS)) { const [lo, hi] = EW_APPEARANCE_LIMITS[key]; out[key] = Math.round((lo + (hi - lo) * (0.2 + 0.6 * r())) * 100) / 100; }
  for (const key of EW_MPFB_FACE_KEYS) out[key] = Math.round((r() * 2 - 1) * 35) / 100;   // THE FACE SLIDERS: a random face stays a face
  for (const key of EW_SHAPE_PICK_KEYS) out[key] = 0;   // (no random wolf head / cat ears: those are OUTFIT picks)
  for (const row of EW_MPFB_BODY_SLIDERS) out[row[0]] = Math.round((r() * 2 - 1) * 30) / 100;   // THE BODY DETAILS
  out.beltHeight = 0;   // THE BELT HEIGHT: a random look keeps the belt where it was baked
  out.skin = pick(skinTones); out.hairColor = pick(hairTones); out.eyeColor = pick(eyeTones);
  out.lipColor = hex(350 + r() * 20, 0.25 + r() * 0.3, 0.32 + r() * 0.2);
  out.topColor = hex(r() * 360, 0.15 + r() * 0.5, 0.35 + r() * 0.35);
  out.bottomColor = hex(r() * 360, 0.1 + r() * 0.4, 0.25 + r() * 0.35);
  out.outerColor = hex(r() * 360, 0.1 + r() * 0.4, 0.2 + r() * 0.35);
  out.feetColor = hex(r() * 360, 0.05 + r() * 0.4, 0.12 + r() * 0.4);
  out.glovesColor = hex(r() * 360, 0.1 + r() * 0.4, 0.15 + r() * 0.4);
  out.beltColor = hex(20 + r() * 30, 0.3 + r() * 0.4, 0.15 + r() * 0.25);
  for (const key of Object.keys(EW_APPEARANCE_ENUMS)) out[key] = pick(_ewHidPickable(key, EW_APPEARANCE_ENUMS[key]));   // THE HIDDEN PICKS
  // rev 8: a print on a layer now and then, in a second colour that reads against the first
  for (const L of EW_APPEARANCE_LAYERS) {
    out[L.pattern] = r() < 0.3 ? pick(EW_PATTERN_IDS.filter(p => p !== 'solid')) : 'solid';
    out[L.color2] = hex(r() * 360, 0.1 + r() * 0.5, r() < 0.5 ? 0.82 + r() * 0.12 : 0.12 + r() * 0.2);
  }
  out.body = 'classic';   // RANDOMIZE dresses the classic base (an MPFB body wears its own look)
  out.mhSkin = out.mhEyes = out.mhBrows = out.mhLashes = 'own';
  out.lipTint = out.skinTint = out.eyeTint = out.browTint = out.lashTint = out.linerTint = out.shadowTint = out.blushTint = 'own';   // THE LIP COLOUR + THE LOOK COLOURS (an MPFB body's; the classic face paints its own)
  if (r() < 0.6) out.beard = 'none';
  if (r() < 0.7) out.neckwear = 'none';
  if (r() < 0.65) out.glasses = 'none';
  if (r() < 0.85) out.wings = 'none';
  out.cape = 'none';   // THE BLENDER CAPES (MPFB bodies; RANDOMIZE dresses the classic base)
  out.model = 'creator';   // THE RACE LOOKS: a random look is a creator look
  out.idle = 'default';   // THE IDLE POSE: RANDOMIZE dresses the look, the idle stays the body's own
  out.tieColor = hex(r() * 360, 0.35 + r() * 0.4, 0.2 + r() * 0.3);
  out.glassesColor = r() < 0.6 ? '#1b1b1f' : hex(r() * 360, 0.3 + r() * 0.4, 0.2 + r() * 0.4);
  out.wingsColor = r() < 0.6 ? '#f2f2f2' : hex(r() * 360, 0.2 + r() * 0.5, 0.15 + r() * 0.6);
  if (r() < 0.5) out.outer = 'none';
  if (out.outfit === 'none' && r() < 0.85) out.outfit = 'tee';   // rev 10: topless is a choice, not a roll
  if (r() < 0.88) out.outfit2 = 'none';
  if (r() < 0.85) out.bottoms2 = 'none';
  if (out.outer === 'none' || r() < 0.9) out.outer2 = 'none';   // THE SECOND OUTER LAYER: rare, and only over an outer
  if (out.bottoms2 !== 'none' && r() < 0.6) out.bottoms2 = 'briefs';
  if (r() < 0.7) out.gloves = 'none';
  if (r() < 0.5) out.belt = 'none';
  if (out.feet === 'none' && r() < 0.7) out.feet = 'sneakers';
  return normalizeCharacterAppearance(out);
}
const EW_CHARACTER_BASES = {};
for (const gender of ['male', 'female']) {
  EW_CHARACTER_BASES[gender] = _mkUAL('', '', {
    model: EW_CHARACTER_ASSET_BASE + '/Meshy_AI_human_body_base_mesh_' + gender + '_rigged.glb?ewcors=1',
    creatorBase: true, heightRatio: 1, basicAttackKind: 'punch',
    wristLimit: 30,   // rev 9: cap each hand's rotation off its rest (degrees) — the sniper idle's holster wrist read as a broken hand on a bare human
    palmTwist: true   // 2026-11-02 THE CLASSIC HANDS (three-renderer.js _libPalmTwist): the palms rolled onto the library's
  });
}
const EW_MPFB_BASES = {};
for (const b of EW_MPFB_BODIES) {
  EW_MPFB_BASES[b.id] = _mkUAL('', '', {
    model: EW_CHARACTER_ASSET_BASE + '/mpfb/' + b.id + '.glb',
    mpfbBody: b.id, creatorBase: true, heightRatio: b.ratio, basicAttackKind: 'punch', wristLimit: 30
  });
}
// THE BODY SLIDERS (2026-11-01): an MPFB body's slider offsets, MakeHuman's own targets (bake-mpfb.py --shapes)
/* THE LOOKS: the layers an MPFB body's sheet is put together from, in order (skin, eyes, brows, lashes, the body's
   fixed layer) as [url, box | null]; null when every pick is the body's own (the stock sheet stays) */
const _EW_LOOK_ROWS = { eyes: ['eyes', 'eyes_'], brows: ['brows', 'eyebrow_'], lashes: ['lashes', 'eyelash_'] };
function mpfbKitOf(body) {   // the EW_MH_LOOKS kit of an MPFB body id ('mpfb_classic_female' -> 'female')
  const row = EW_MPFB_BODIES.find(b => b.id === body);
  return row ? (row.kit || row.id.slice(5)) : null;
}
function getMhLookLayers(a) {
  const body = a && typeof a.body === 'string' && /^mpfb_/.test(a.body) ? mpfbKitOf(a.body) : null;
  const kit = body && EW_MH_LOOKS.kits[body];
  if (!kit) return null;
  const pack = !!EW_MH_EYE_PACK_BY_ID[a.mhEyes];   // THE EYE PACK: worn by the eye mesh (getMhEyePack); the sheet keeps the body's own eyes
  const pick = { skin: a.mhSkin, eyes: pack ? 'own' : a.mhEyes, brows: a.mhBrows, lashes: a.mhLashes };
  const chest = EW_MH_CHEST.band[body] && a.mhChest === 'smooth' ? 'smooth' : null;   // THE CHEST ('nipples' = the sheet as baked)
  const lips = a.lipTint === 'pick' && typeof a.lipColor === 'string' ? a.lipColor : null;   // THE LIP COLOUR
  const hex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : null;   // THE LOOK COLOURS
  const tint = { skin: a.skinTint === 'pick' ? hex(a.skin) : null, eyes: a.eyeTint === 'pick' && !pack ? hex(a.eyeColor) : null,
    brows: a.browTint === 'hair' ? hex(a.hairColor) : a.browTint === 'pick' ? hex(a.browColor) : null, lashes: a.lashTint === 'pick' ? hex(a.lashColor) : null };
  const mk = { liner: a.linerTint === 'pick' ? hex(a.linerColor) : null, shadow: a.shadowTint === 'pick' ? hex(a.shadowColor) : null, blush: a.blushTint === 'pick' ? hex(a.blushColor) : null };   // THE MAKE-UP
  const madeUp = !!(mk.liner || mk.shadow || mk.blush);
  const tinted = Object.keys(tint).some(k => tint[k]);
  if (!chest && !lips && !tinted && !madeUp && Object.keys(pick).every(k => !pick[k] || pick[k] === 'own')) return null;
  const id = k => (pick[k] && pick[k] !== 'own' ? pick[k] : kit[k]);
  const base = EW_CHARACTER_ASSET_BASE + '/mpfb/looks/';
  const out = [[base + 'skin_' + id('skin') + '.jpg', null]];
  for (const k of ['eyes', 'brows', 'lashes']) {
    const row = EW_MH_LOOKS[_EW_LOOK_ROWS[k][0]].find(r => r[0] === id(k));
    if (row) { const l = [base + _EW_LOOK_ROWS[k][1] + row[0] + '.png', row.slice(2, 6)]; l.kind = k; out.push(l); }   // (kind: THE LOOK COLOURS)
  }
  if (EW_MH_LOOKS.fixed[body]) out.push([base + 'look_fixed_' + body + '.png', EW_MH_LOOKS.fixed[body], null]);   // [url, box, the rect left out (none since the underwear went)]
  if (madeUp) { const l = [base + EW_MH_MAKEUP.file, EW_MH_MAKEUP.box]; l.kind = 'makeup'; out.push(l); out.makeup = Object.assign({ box: EW_MH_MAKEUP.box, a: EW_MH_MAKEUP.a }, mk); }   // THE MAKE-UP (three-renderer.js paintMakeup; the mask rides the layer list so it loads with them)
  if (chest === 'smooth') out.smooth = EW_MH_CHEST;
  if (lips) out.lips = Object.assign({ color: lips }, EW_MH_LIPS);   // THE LIP COLOUR (painted over the skin, three-renderer.js tintLips)
  if (tinted) { out.tint = tint; out.iris = EW_MH_IRIS; out.skinSample = EW_MH_SKIN_SAMPLE; out.skinKeep = EW_MH_SKIN_KEEP; }   // THE LOOK COLOURS (three-renderer.js tintSheet / tintLayer)
  return out;
}
/* THE LID LASHES (2026-11-03, mondo: "i click them but i dont see any lashes"): an MPFB body's OWN lashes (its kit's stock
   lash, EW_MH_LOOKS.kits) as [url, box] | null. The stock sheet baked in each body GLB drew them on the cut eyelash helper,
   so with every pick 'own' three-renderer.js setLook lays this layer over the stock sheet (one shared texture per body). */
function getMhOwnLashLayer(body) {
  const k = typeof body === 'string' && /^mpfb_/.test(body) ? mpfbKitOf(body) : null;
  const kit = k && EW_MH_LOOKS.kits[k];
  const row = kit && EW_MH_LOOKS.lashes.find(r => r[0] === kit.lashes);
  return row ? [EW_CHARACTER_ASSET_BASE + '/mpfb/looks/eyelash_' + row[0] + '.png', row.slice(2, 6)] : null;
}
/* THE EYE PACK: an MPFB body's pack eye pick -> { id, map, normal (the R2 PNGs), tint (the Iris colour, or null), iris, proxy }; null
   for the sheet's own eye colours or a body that is not MPFB */
function getMhEyePack(a) {
  const row = a && EW_MH_EYE_PACK_BY_ID[a.mhEyes];
  const body = row && typeof a.body === 'string' && /^mpfb_/.test(a.body) ? mpfbKitOf(a.body) : null;
  if (!body || !EW_MH_LOOKS.kits[body]) return null;
  const dir = EW_CHARACTER_ASSET_BASE + '/' + (row[4] || EW_MH_EYE_PACK_DIR);   // (THE EYE MATERIALS: their own folder)
  const tint = a.eyeTint === 'pick' && typeof a.eyeColor === 'string' && /^#[0-9a-f]{6}$/i.test(a.eyeColor) ? a.eyeColor : null;
  return { id: row[0], map: dir + row[2] + '.png', normal: row[3] ? dir + row[3] + '.png' : null, tint: tint, iris: EW_MH_EYE_PACK_IRIS,
    proxy: EW_CHARACTER_ASSET_BASE + '/mpfb/looks/eyes/eye_proxy.json' };
}
function getMhCreditsUrl() { return EW_CHARACTER_ASSET_BASE + '/mpfb/CREDITS.json'; }   // THE CREDITS (bake-mpfb.py writes it)
function getMpfbShapesUrl() { return EW_CHARACTER_ASSET_BASE + '/mpfb/mpfb_shapes.glb'; }
function getClassicFitUrl(gender) { return EW_CHARACTER_ASSET_BASE + '/mpfb/mpfb_classic_fit_' + (gender === 'female' ? 'female' : 'male') + '.glb'; }   // THE CLASSIC FIT (bake-classic-fit.js; the classic bases wear the new clothes)
function getClassicBustUrl() { return EW_CHARACTER_ASSET_BASE + '/mpfb/mpfb_classic_bust.glb'; }   // THE CLASSIC BUST (bake-classic-bust.js; the classic female base only)
function getHairStyleUrl(id) {
  if (!EW_HAIR_STYLE_IDS.includes(id)) return null;
  return EW_CHARACTER_ASSET_BASE + '/hair/' + (/^mh_/.test(id) ? 'mh/' + id + '.glb' : id + '.glb?ewcors=1');   // (the pack hair: no server fallback, no CORS tag)
}
function getFabricTextureUrl(key) {
  const f = EW_FABRICS[key];
  return f && f.file ? EW_CHARACTER_ASSET_BASE + '/clothingtextures/' + f.file + '?ewcors=1' : null;
}
// Same-origin retry for the CDN (CORS / edge hiccups): ONLY the allowlisted
// creator assets map to server.js /api/character-model/*; anything else → null.
function getCharacterModelFallback(url) {
  for (const gender of ['male', 'female']) {
    if (EW_CHARACTER_BASES[gender].model === url) return '/api/character-model/' + gender;
  }
  for (const id of EW_HAIR_STYLE_IDS) if (!/^mh_/.test(id) && getHairStyleUrl(id) === url) return '/api/character-model/hair/' + id;
  for (const key of EW_FABRIC_IDS) if (EW_FABRICS[key].file && getFabricTextureUrl(key) === url) return '/api/character-model/fabric/' + key;
  return null;
}
/* THE INTAKE (2026-09-21): the races a CREATOR LOOK may dress — the human base (the mirror's look) and the
   D.O.O.R. Agent (the officer: a Freelancer DOOR agent in the intake's clothes). A non-human look keeps its
   race's own held prop + basic-attack kind (the door gun in the agent's hand) on the creator rig. */
/* THE RACE LOOKS (2026-11-01, mondo: "eventually I want every character to have a new version made from the character
   creator, and for me to be able to edit it and export to bake the default looks into the game"; the test = the Cowboy and
   Cowgirl on the MPFB classic bodies). A race listed here wears its creator look instead of its own Meshy model wherever it
   stands (battle, the forge's stage, exploration), unless a slot picks USE ORIGINAL MODEL (appearance.model 'original') or
   window.EW_DISABLE_RACE_LOOKS is set (the Meshy models stay on R2 and in RACE_MODELS_3D, untouched).
   EDIT: the forge, a slot of that race > GEAR > CHARACTER CREATOR (the slot's own copy; RESET TO DEFAULT LOOK = this row).
   EXPORT: the creator's EXPORT DEFAULT LOOK button saves Entropy_Wars_Race_Look_<race>_<gender>_<time>.json.
   BAKE: `node bake-looks.js <export.json> [more…]` rewrites the block below (repo tooling; docs/notes/character-creator.md
   "THE RACE LOOKS"). One row per race, one look per gender; a gender without a look keeps the race's own model.
   RACE_CREATOR_LOOK_DEFS = what the race's own model brought that a creator body lacks (the gun in the hand, the shot).
   THE MESHY DEFAULT (2026-11-03, mondo: "Let the character creator be available to all units so i can make custom models for
   them. Don't get rid of the old models, the old models should stay the default until i say so ... even the cowboy, its
   default model should still be the meshy model" + "make sure that custom cowboy is still saved and there as an option"):
   the rows below are SAVED LOOKS now, not defaults. Every race wears its own Meshy model unless a slot picks a creator look
   in the forge (the creator opens on every race; a race with a saved look offers it as USE THE SAVED <RACE> LOOK).
   EW_RACE_LOOKS_ARE_DEFAULT = true puts the old rule back (a saved look dresses every slot / CPU of its race). */
const EW_RACE_LOOKS_ARE_DEFAULT = false;
// RACE_CREATOR_LOOKS:BEGIN (written by bake-looks.js)
const RACE_CREATOR_LOOKS = {
  "catgirl": {
    female: {"version":2,"height":0.97,"width":0.92,"chest":0,"waist":0.11,"hips":0.35,"bust":0.3,"head":-0.25,"jaw":-0.4,"nose":0.08,"cheeks":0,"eyeSize":-0.06,"brows":0.5,"jiggleChest":0.13,"jiggleButt":0.11,"beltHeight":0,"wolfHead":0,"catEars":0.77,"felineEars":0,"weight":-0.06,"muscle":0.36,"shoulders":-0.34,"vshape":0,"pecs":0,"belly":0,"glutes":0.13,"thighs":-0.21,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0.34,"eyeHeight":-0.11,"eyeSpacing":0.25,"eyeTilt":-0.94,"eyeOpen":0.44,"eyeDepth":0,"eyelid":0.39,"eyeBags":-1,"epicanthus":0.06,"browHeight":-0.3,"browAngle":0.15,"browRidge":-0.15,"noseWidth":-0.56,"noseLength":-0.15,"noseDepth":0,"noseHeight":0,"noseBridge":-0.2,"noseTip":0.24,"nostrils":-0.4,"noseCurve":-0.07,"mouthWidth":0,"mouthHeight":0.1,"upperLip":0.1,"lowerLip":0.15,"mouthCorners":0.27,"cupidsBow":0.3,"mouthDepth":-0.6,"jawAngle":-0.1,"chinLength":-0.15,"chinJut":0.4,"underbite":0,"chinCleft":0,"cheekbones":0.35,"cheekHeight":0.25,"faceFat":-0.05,"headHeight":-0.15,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":-0.5,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":-0.2,"skin":"#b98362","hairColor":"#27201c","eyeColor":"#4a6b8a","lipColor":"#b66a6f","topColor":"#8fa3a8","bottomColor":"#5e6f80","outerColor":"#a0703f","feetColor":"#141518","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#141518","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","browColor":"#2a1d14","lashColor":"#141010","hairColor2":"#c0392b","idle":"Idle_11","walk":"MAL_Walking_Woman","body":"mpfb_female","mhSkin":"young_caucasian_female","mhEyes":"mhm_nyloseth_yellow_cat_eyes","mhBrows":"own","mhLashes":"mindfront_eyelashes_05","lipTint":"pick","skinTint":"own","eyeTint":"own","browTint":"own","lashTint":"own","hairMat":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_elvs_daisy_hair","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"none","outer2":"blongcoat","outerFront":"open","outer2Front":"open","pantsTuck":"out","feet":"bboots","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"suede","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"cotton","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["mhw_punkduck_bandeau_bra","mhw_v0rt3x_stockings_black_fishnet_small","mhw_scsouza_mini_denin_skirt","mhw_punkduck_string_2","mhw_culturalibre_hand_claws","mhw_learning_mma_fighting_gloves","ewm_crosspendant"],"wear2":"mhw_skalldyrssuppe_tube_top_funky_colors","wearTint":{"mhw_scsouza_mini_denin_skirt":"#141518","mhw_learning_mma_fighting_gloves":"#141518","ewm_crosspendant":"#a0662e","mhw_skalldyrssuppe_tube_top_funky_colors":"#141518"},"wearFabric":{}},
  },
  "chef": {
    male: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#2a1d14","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#8fa3a8","bottomColor":"#5e6f80","outerColor":"#f4f4f0","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"default","body":"mpfb_classic_male","mhSkin":"young_caucasian_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"bald","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"bchef","outer2":"none","outerFront":"auto","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"cotton","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["mhw_mindfront_male_trousers_1","mhw_mindfront_shoes_oxford_male","mhw_elvs_unisex_chef_hat_1"],"wearTint":{"mhw_mindfront_male_trousers_1":"#121214","mhw_mindfront_shoes_oxford_male":"#0f0f10","mhw_elvs_unisex_chef_hat_1":"#f4f4f0"}},
  },
  "conspiracy theorist": {
    male: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#8a6a48","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#f2f2f0","bottomColor":"#5e6f80","outerColor":"#121214","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"Idle_11","body":"mpfb_classic_male","mhSkin":"young_caucasian_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_elvs_maxwell_hair","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"bovercoat","outer2":"none","outerFront":"open","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"wool","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_top_shirt","ewb_tie","mhw_punkduck_male_classic_jeans","mhw_mindfront_shoes_oxford_male","mhw_punkduck_wireless_headset"],"wearTint":{"ewb_tie":"#b0121a","mhw_punkduck_male_classic_jeans":"#3b5a85","mhw_mindfront_shoes_oxford_male":"#7a4a24","mhw_punkduck_wireless_headset":"#151515"}},
  },
  "cowboy": {
    male: {"version":2,"height":1,"width":1,"chest":0.55,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":-0.09,"brows":0.5,"jiggleChest":0,"jiggleButt":0,"beltHeight":0.7,"wolfHead":0,"catEars":0,"felineEars":0,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0.35,"belly":0,"glutes":0,"thighs":0.21,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0.33,"eyeSpacing":-0.31,"eyeTilt":-0.19,"eyeOpen":0.52,"eyeDepth":-0.2,"eyelid":0.15,"eyeBags":1,"epicanthus":0.34,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#7a4a2a","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#7a1f1f","bottomColor":"#290f0a","outerColor":"#100f13","feetColor":"#7a4a26","glovesColor":"#141518","beltColor":"#2a1d14","topColor2":"#141518","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#c9a227","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#b08060","capeColor2":"#c9a227","beardColor":"#27201c","browColor":"#2a1d14","lashColor":"#141010","hairColor2":"#c0392b","idle":"Idle_11","walk":"default","body":"mpfb_male","mhSkin":"middleage_caucasian_male","mhEyes":"brown","mhBrows":"eyebrow008","mhLashes":"own","lipTint":"own","skinTint":"own","eyeTint":"own","browTint":"own","lashTint":"own","hairMat":"own","hairAccent":"own","mhChest":"nipples","hair":"hair003","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"bgreatcoat","outer2":"none","outerFront":"open","outer2Front":"auto","pantsTuck":"out","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"suede","capePattern":"solid","topFabric":"denim","bottomFabric":"denim","outerFabric":"ribbed-knit","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_beard_full","mhw_toigo_ankle_boots_male","ewb_cowboyhat","ewb_top_shirt","mhw_punkduck_male_classic_jeans","ewb_belt"],"wear2":"none","wearTint":{"mhw_toigo_ankle_boots_male":"#7a4a2a","ewb_cowboyhat":"#261b14","mhw_punkduck_male_classic_jeans":"#293c41"},"wearFabric":{}},
    female: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"skin":"#b98362","hairColor":"#9a1f1f","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#ece6da","bottomColor":"#3d5a80","outerColor":"#2a2f38","feetColor":"#6b4226","glovesColor":"#6b4226","beltColor":"#5a3a22","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#c9a227","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","body":"mpfb_classic_female","mhSkin":"own","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_punkduck_alpha7_long","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"none","feet":"bhighboots","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"canvas","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","model":"creator","wear":["ewb_longsleeve","mhw_elvs_jeans_straight_leg","mhw_toigo_gloves_short","ewb_belt","ewb_cowboyhat"],"wearTint":{"mhw_elvs_jeans_straight_leg":"#3d5a80","mhw_toigo_gloves_short":"#6b4226"}},
  },
  "cult leader": {
    male: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#8a7050","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#8fa3a8","bottomColor":"#5e6f80","outerColor":"#f2f0ea","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"Idle_11","body":"mpfb_classic_male","mhSkin":"middleage_caucasian_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_long01","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"bcultrobe","outer2":"none","outerFront":"open","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"cotton","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_beard_full","mhw_elvs_male_boho_top1","mhw_mindfront_male_trousers_2","mhw_dressupdoc_sandals1"],"wearTint":{"mhw_elvs_male_boho_top1":"#e8e2d4","mhw_mindfront_male_trousers_2":"#eeeae0"}},
  },
  "demon": {
    female: {"version":2,"height":1,"width":1,"chest":0,"waist":-0.25,"hips":0,"bust":0.37,"head":-0.25,"jaw":-0.08,"nose":-0.25,"cheeks":0,"eyeSize":0.18,"brows":0.5,"jiggleChest":0.2,"jiggleButt":0.2,"beltHeight":0.5,"wolfHead":0,"catEars":0,"felineEars":0,"weight":0,"muscle":0.52,"shoulders":-0.05,"vshape":0,"pecs":0,"belly":0,"glutes":-0.04,"thighs":0.36,"calves":0.01,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0.1,"eyeTilt":0,"eyeOpen":-0.14,"eyeDepth":0,"eyelid":-0.17,"eyeBags":-0.9,"epicanthus":0.53,"browHeight":-0.3,"browAngle":0.15,"browRidge":-0.15,"noseWidth":-0.28,"noseLength":0.05,"noseDepth":0,"noseHeight":0,"noseBridge":-0.33,"noseTip":-0.12,"nostrils":-0.1,"noseCurve":0.45,"mouthWidth":0,"mouthHeight":0.1,"upperLip":0.1,"lowerLip":0.15,"mouthCorners":0.15,"cupidsBow":0.3,"mouthDepth":-0.6,"jawAngle":-0.28,"chinLength":0.15,"chinJut":0.08,"underbite":0,"chinCleft":0.18,"cheekbones":0.35,"cheekHeight":0.44,"faceFat":-0.26,"headHeight":-0.15,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":-0.5,"earSize":0,"earOut":0,"earPoint":-0.02,"earLobe":0,"neckThick":-0.2,"skin":"#a41427","hairColor":"#27201c","eyeColor":"#4a6b8a","lipColor":"#2f070b","topColor":"#8fa3a8","bottomColor":"#141518","outerColor":"#2a2f38","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#344a50","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#5e6f80","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","browColor":"#2a1d14","lashColor":"#141010","hairColor2":"#c0392b","idle":"Idle_11","walk":"MOC_Cool_Walk","body":"mpfb_female","mhSkin":"own","mhEyes":"mhm_sonntag78_orcifyhead_eye","mhBrows":"own","mhLashes":"eyelashes04","lipTint":"pick","skinTint":"pick","eyeTint":"own","browTint":"own","lashTint":"own","hairMat":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_elvs_hazel_hair","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"none","outer2":"none","outerFront":"auto","outer2Front":"auto","pantsTuck":"out","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"suede","outerFabric":"canvas","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["mhw_punkduck_string_2","mhw_culturalibre_faun_horns","ewm_elfears","mhw_punkduck_frill_bikini_top","ewb_loincloth","ewb_belt","mhw_v0rt3x_armsleeves_white_fishnet_large","mhw_v0rt3x_armsleeves_white_fishnet_small","mhw_v0rt3x_armsleeves_black_fishnet_small","mhw_v0rt3x_armsleeves_white_fishnet_medium"],"wear2":"none","wearTint":{"ewm_elfears":"#7a1f1f","mhw_punkduck_frill_bikini_top":"#141518","mhw_v0rt3x_armsleeves_white_fishnet_large":"#0f0d0c","mhw_v0rt3x_armsleeves_white_fishnet_small":"#0f0d0c","mhw_v0rt3x_armsleeves_black_fishnet_small":"#0f0d0c","mhw_v0rt3x_armsleeves_white_fishnet_medium":"#0f0d0c"},"wearFabric":{}},
  },
  "gangster": {
    male: {"version":2,"height":0.95,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0.5,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0.7,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#111111","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#8fa3a8","bottomColor":"#5e6f80","outerColor":"#2a2f38","feetColor":"#b01818","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"default","body":"mpfb_heavy","mhSkin":"young_african_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"hair000","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"none","outer2":"none","outerFront":"auto","outer2Front":"auto","feet":"bsneakers","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"canvas","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_dorag","ewb_beard_full","mhw_cortu_cargo_pants"],"wearTint":{"ewb_dorag":"#b01818","mhw_cortu_cargo_pants":"#141416"}},
  },
  "halfdemon": {
    male: {"version":2,"height":1.05,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#121012","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#f2f2f0","bottomColor":"#5e6f80","outerColor":"#121214","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#141416","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"Idle_11","body":"mpfb_classic_male","mhSkin":"young_caucasian_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"hair003","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"bovercoat","outer2":"none","outerFront":"open","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"wool","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_top_shirt","ewb_tie","mhw_punkduck_male_classic_jeans","ewb_belt","mhw_mindfront_shoes_oxford_male","ewb_beard_scruffy","mhw_culturalibre_minotaur_horns"],"wearTint":{"ewb_tie":"#121214","mhw_punkduck_male_classic_jeans":"#121214","mhw_mindfront_shoes_oxford_male":"#0f0f10","mhw_culturalibre_minotaur_horns":"#6a6a6e"}},
    female: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#3a1a4a","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#8fa3a8","bottomColor":"#5e6f80","outerColor":"#2a2f38","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"default","body":"mpfb_classic_female","mhSkin":"young_caucasian_female","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_punkduck_alpha7_long","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"none","outer2":"none","outerFront":"auto","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"canvas","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["mhw_punkduck_evening_gown","mhw_culturalibre_minotaur_horns","mhw_punkduck_kill_bill_shoes"],"wearTint":{"mhw_punkduck_evening_gown":"#121214","mhw_culturalibre_minotaur_horns":"#7a3a9a","mhw_punkduck_kill_bill_shoes":"#121214"}},
  },
  "mad scientist": {
    male: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#ecebe6","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#141416","bottomColor":"#5e6f80","outerColor":"#eef0ee","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a2e1c","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"Idle_11","body":"mpfb_classic_male","mhSkin":"old_caucasian_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_culturalibre_hair_14","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"blabcoat","outer2":"none","outerFront":"open","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"cotton","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_beard_full","ewb_top_shirt","mhw_punkduck_male_classic_jeans","mhw_toigo_ankle_boots_male","ewb_belt"],"wearTint":{"mhw_punkduck_male_classic_jeans":"#161618","mhw_toigo_ankle_boots_male":"#5a3a24"}},
    female: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#121012","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#141416","bottomColor":"#5e6f80","outerColor":"#eef0ee","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a2e1c","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"Idle_11","body":"mpfb_classic_female","mhSkin":"young_caucasian_female","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_littleright_bobcut_hair","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"blabcoat","outer2":"none","outerFront":"open","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"cotton","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_longsleeve","mhw_punkduck_female_tight_jeans","mhw_mindfront_shoes_biker_boots_female","ewb_belt","mhw_learning_mma_fighting_gloves","mhw_punkduck_goggles"],"wearTint":{"mhw_punkduck_female_tight_jeans":"#1e2a44","mhw_mindfront_shoes_biker_boots_female":"#151515","mhw_learning_mma_fighting_gloves":"#151515"}},
  },
  "men in black": {
    male: {"version":2,"height":1.02,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#16110d","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#f2f2f0","bottomColor":"#5e6f80","outerColor":"#121214","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"default","body":"mpfb_classic_male","mhSkin":"young_caucasian_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"hair003","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"bblazer","outer2":"none","outerFront":"closed","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"wool","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_top_shirt","ewb_tie","mhw_mindfront_male_trousers_1","mhw_mindfront_shoes_oxford_male","mhw_elvs_ladies_sunglass1"],"wearTint":{"ewb_tie":"#111112","mhw_mindfront_male_trousers_1":"#141416","mhw_mindfront_shoes_oxford_male":"#121212","mhw_elvs_ladies_sunglass1":"#0c0c0c"}},
  },
  "politician": {
    male: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#dcdcd6","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#f2f2f0","bottomColor":"#5e6f80","outerColor":"#1a2136","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"default","body":"mpfb_classic_male","mhSkin":"old_caucasian_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_short04","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"bblazer","outer2":"none","outerFront":"open","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"wool","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_top_shirt","ewb_tie","mhw_mindfront_male_trousers_1","mhw_mindfront_shoes_oxford_male","mhw_frankyaye_glasses_library_male"],"wearTint":{"ewb_tie":"#a0121a","mhw_mindfront_male_trousers_1":"#1a2136","mhw_mindfront_shoes_oxford_male":"#5a3420"}},
  },
  "priest": {
    male: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#2a1d14","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#8fa3a8","bottomColor":"#5e6f80","outerColor":"#121214","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"Idle_11","body":"mpfb_classic_male","mhSkin":"young_caucasian_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_short01","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"bcassock","outer2":"none","outerFront":"auto","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"wool","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["mhw_mindfront_male_trousers_1","mhw_mindfront_shoes_oxford_male"],"wearTint":{"mhw_mindfront_male_trousers_1":"#121214","mhw_mindfront_shoes_oxford_male":"#0f0f10"}},
  },
  "professor": {
    male: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#6e6e6a","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#eeeeec","bottomColor":"#5e6f80","outerColor":"#1c2744","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#141416","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"default","body":"mpfb_classic_male","mhSkin":"middleage_african_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_elvs_maxwell_hair","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"bblazer","outer2":"none","outerFront":"open","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"wool","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_top_shirt","ewb_tie","mhw_punkduck_male_classic_jeans","ewb_belt","mhw_mindfront_shoes_oxford_male","mhw_kwnet_at_optical_glasses"],"wearTint":{"ewb_tie":"#4a4a50","mhw_punkduck_male_classic_jeans":"#19191b","mhw_mindfront_shoes_oxford_male":"#6a3a20"}},
  },
  "ringmaster": {
    male: {"version":2,"height":1.03,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#1a1410","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#f2f2f0","bottomColor":"#5e6f80","outerColor":"#141416","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#6e1418","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"default","body":"mpfb_classic_male","mhSkin":"young_caucasian_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"hair000","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"bvest","outer2":"btailcoat","outerFront":"auto","outer2Front":"open","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"silk","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_top_shirt","ewb_bowtie","mhw_mindfront_male_trousers_1","mhw_mindfront_shoes_oxford_male","ewb_beard_scruffy"],"wearTint":{"ewb_bowtie":"#141416","mhw_mindfront_male_trousers_1":"#121214","mhw_mindfront_shoes_oxford_male":"#0f0f10"}},
  },
  "santa clause": {
    male: {"version":2,"height":1,"width":1.13,"chest":0.28,"waist":0.51,"hips":0,"bust":0,"head":0.16,"jaw":0,"nose":0.18,"cheeks":0,"eyeSize":0.2,"brows":0.5,"jiggleChest":0,"jiggleButt":0,"beltHeight":0,"wolfHead":0,"catEars":0,"felineEars":0,"weight":0.6,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0.8,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":-0.02,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0.28,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0.36,"noseTip":0.38,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0.66,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":1,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#eeeeea","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#8fa3a8","bottomColor":"#5e6f80","outerColor":"#b3141c","feetColor":"#141416","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","browColor":"#2a1d14","lashColor":"#141010","hairColor2":"#c0392b","idle":"Idle_11","walk":"MOC_Heavy_Walk","body":"mpfb_heavy","mhSkin":"old_caucasian_male","mhEyes":"mhp_blue","mhBrows":"mindfront_eyebrows_05","mhLashes":"own","lipTint":"own","skinTint":"own","eyeTint":"own","browTint":"hair","lashTint":"own","hairMat":"own","hairAccent":"own","mhChest":"nipples","hair":"hair003","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"bsanta","outer2":"none","outerFront":"auto","outer2Front":"auto","pantsTuck":"in","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"velvet","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_beard_full","mhw_mindfront_male_trousers_1","mhw_elvs_santa_hat","mhw_punkduck_medieval_boots","mhw_toigo_gloves_long"],"wear2":"none","wearTint":{"mhw_mindfront_male_trousers_1":"#9a141a","mhw_punkduck_medieval_boots":"#141518","mhw_toigo_gloves_long":"#0f0d0c"},"wearFabric":{}},
  },
  "superhero": {
    male: {"version":2,"height":1.05,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#121012","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#8fa3a8","bottomColor":"#5e6f80","outerColor":"#2a2f38","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#8a1020","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"default","body":"mpfb_classic_male","mhSkin":"young_caucasian_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"hair008","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"none","outer2":"none","outerFront":"auto","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"bcape_hero","capeFabric":"nylon","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"canvas","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["mhw_culturalibre_hero_suit_1","mhw_culturalibre_hero_boots_1","mhw_culturalibre_hero-heroine_gloves_1"],"wearTint":{"mhw_culturalibre_hero_suit_1":"#2a4a9a","mhw_culturalibre_hero_boots_1":"#8a1020","mhw_culturalibre_hero-heroine_gloves_1":"#8a1020"}},
    female: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#7a3a20","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#8fa3a8","bottomColor":"#5e6f80","outerColor":"#2a2f38","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a0f1c","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"default","body":"mpfb_classic_female","mhSkin":"young_caucasian_female","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_punkduck_alpha7_long","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"none","outer2":"none","outerFront":"auto","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"bcape_hero","capeFabric":"nylon","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"canvas","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["mhw_mindfront_f_one-piece_swimsuit_01","mhw_toigo_gloves_long","mhw_cortu_floppy_overknee_shoes"],"wearTint":{"mhw_mindfront_f_one-piece_swimsuit_01":"#1c2340","mhw_toigo_gloves_long":"#1c2340","mhw_cortu_floppy_overknee_shoes":"#1c2340"}},
  },
  "telepath": {
    male: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#f0f0ec","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#141416","bottomColor":"#5e6f80","outerColor":"#151517","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#141416","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"Idle_11","body":"mpfb_classic_male","mhSkin":"old_caucasian_male","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"hair000","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"bleather","outer2":"none","outerFront":"open","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"leather","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewb_top_shirt","mhw_punkduck_male_classic_jeans","mhw_mindfront_shoes_biker_boots_male","ewb_belt"],"wearTint":{"mhw_punkduck_male_classic_jeans":"#141416","mhw_mindfront_shoes_biker_boots_male":"#121212"}},
    female: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#7a0f14","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#8fa3a8","bottomColor":"#5e6f80","outerColor":"#2a2f38","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"default","body":"mpfb_classic_female","mhSkin":"young_caucasian_female","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_punkduck_alpha7_long","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"none","outer2":"none","outerFront":"auto","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"canvas","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["mhw_punkduck_evening_gown"],"wearTint":{"mhw_punkduck_evening_gown":"#141416"}},
  },
  "vampire": {
    female: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#0e0c0e","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#8fa3a8","bottomColor":"#5e6f80","outerColor":"#2a2f38","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","hairColor2":"#c0392b","idle":"default","body":"mpfb_classic_female","mhSkin":"toigo_light_skin_female_with_violet_makeup","mhEyes":"own","mhBrows":"own","mhLashes":"own","hairAccent":"own","mhChest":"nipples","hair":"mh_punkduck_alpha7_curly","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"none","outer2":"none","outerFront":"auto","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"canvas","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["mhw_punkduck_evening_gown"],"wearTint":{"mhw_punkduck_evening_gown":"#121214"}},
  },
  "werewolf": {
    male: {"version":2,"height":1,"width":1,"chest":0,"waist":0,"hips":0,"bust":0,"head":0,"jaw":0,"nose":0,"cheeks":0,"eyeSize":0,"brows":0.5,"jiggleChest":0.5,"jiggleButt":0.5,"beltHeight":0,"wolfHead":1,"weight":0,"muscle":0,"shoulders":0,"vshape":0,"pecs":0,"belly":0,"glutes":0,"thighs":0,"calves":0,"upperArms":0,"bustSpacing":0,"bustHeight":0,"eyeHeight":0,"eyeSpacing":0,"eyeTilt":0,"eyeOpen":0,"eyeDepth":0,"eyelid":0,"eyeBags":0,"epicanthus":0,"browHeight":0,"browAngle":0,"browRidge":0,"noseWidth":0,"noseLength":0,"noseDepth":0,"noseHeight":0,"noseBridge":0,"noseTip":0,"nostrils":0,"noseCurve":0,"mouthWidth":0,"mouthHeight":0,"upperLip":0,"lowerLip":0,"mouthCorners":0,"cupidsBow":0,"mouthDepth":0,"jawAngle":0,"chinLength":0,"chinJut":0,"underbite":0,"chinCleft":0,"cheekbones":0,"cheekHeight":0,"faceFat":0,"headHeight":0,"headDepth":0,"foreheadHeight":0,"foreheadSlope":0,"faceAge":0,"earSize":0,"earOut":0,"earPoint":0.6,"earLobe":0,"neckThick":0,"skin":"#b98362","hairColor":"#27201c","eyeColor":"#4a6b8a","lipColor":"#9c5a5c","topColor":"#8fa3a8","bottomColor":"#5e6f80","outerColor":"#2a2f38","feetColor":"#2b241f","glovesColor":"#3a2a22","beltColor":"#4a3220","topColor2":"#f0ece2","bottomColor2":"#f0ece2","outerColor2":"#c9a227","feetColor2":"#f0ece2","glovesColor2":"#f0ece2","beltColor2":"#f0cf7e","tieColor":"#7a1f1f","glassesColor":"#1b1b1f","wingsColor":"#f2f2f2","top2Color":"#c0392b","top2Color2":"#f0ece2","bottom2Color":"#c0392b","bottom2Color2":"#f0cf7e","outer2Color":"#5a4636","outer2Color2":"#c9a227","capeColor":"#7a1f1f","capeColor2":"#c9a227","beardColor":"#27201c","browColor":"#2a1d14","lashColor":"#141010","hairColor2":"#c0392b","idle":"default","body":"mpfb_heavy","mhSkin":"ew_werewolf_fur","mhEyes":"own","mhBrows":"own","mhLashes":"own","lipTint":"own","skinTint":"own","eyeTint":"own","browTint":"own","lashTint":"own","hairMat":"own","hairAccent":"own","mhChest":"nipples","hair":"bald","beard":"none","beardTint":"hair","outfit2":"none","bottoms2":"none","outfit":"none","bottoms":"none","outer":"none","outer2":"none","outerFront":"auto","outer2Front":"auto","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","capeFabric":"velvet","capePattern":"solid","topFabric":"cotton","bottomFabric":"denim","outerFabric":"canvas","feetFabric":"leather","glovesFabric":"leather","beltFabric":"leather","top2Fabric":"cotton","bottom2Fabric":"cotton","outer2Fabric":"wool","topPattern":"solid","bottomPattern":"solid","outerPattern":"solid","feetPattern":"solid","glovesPattern":"solid","beltPattern":"solid","top2Pattern":"solid","bottom2Pattern":"solid","outer2Pattern":"solid","model":"creator","wear":["ewm_wolftail_fura","ewm_beastfeet_fura","mhw_culturalibre_hand_claws"],"wearTint":{}},
  },
};
// RACE_CREATOR_LOOKS:END
const RACE_CREATOR_LOOK_DEFS = {
  'cowboy': { basicAttackKind: 'ranged', hold: { key: 'revolver', bone: 'RightHand', pos: [0, 0, 0], rot: [0, 0, 0], h: 0.21,
    grip: { c: [0.657, -0.215, 0], down: [0.404, -0.915, 0], barrel: [-1, 0, 0], depth: 0.25, back: 0.22 } } },   // THE GRIP, THE SEAT: the revolver GLB's handle (three-renderer.js _gripFrame)
};
const _ewRaceLookCache = {};
function getRaceCreatorLook(race, gender) {
  if (typeof window !== 'undefined' && window.EW_DISABLE_RACE_LOOKS) return null;
  const set = RACE_CREATOR_LOOKS[race], g = gender === 'female' ? 'female' : 'male';
  if (!set || !set[g]) return null;
  const k = race + '|' + g, c = _ewRaceLookCache[k] || (_ewRaceLookCache[k] = normalizeCharacterAppearance(set[g]));
  return c ? Object.assign({}, c, { wear: c.wear.slice() }) : null;
}
function hasRaceCreatorLook(race) { return !!RACE_CREATOR_LOOKS[race]; }
/* THE REMADE LOOKS (2026-11-12, plan row 21d, mondo: "i like route 2 better" + "Go"): a unit's OWN Meshy clothes on the MPFB body
   (THE MESHY OUTFITS above), with pack hair and the MPFB face, as a second saved look beside the race's Meshy model (still the
   default) and beside its RACE_CREATOR_LOOKS look (the saved cowboy stays). The forge: USE THE REMADE <RACE> LOOK. The cowboy's
   is his saved look's body + face with the remade clothes in place of the creator ones. */
function _ewFaceSlidersZeroed() {   // every FACE-tab slider at 0 (eyes .. head; not the ears + neck, not the shaped heads / ears)
  const o = {};
  for (const g of EW_MPFB_FACE_SLIDERS) if (!g.inHeads && !g.inEars && g.id !== 'ears') for (const r of g.rows) o[r[0]] = 0;
  return o;
}
const RACE_REMADE_LOOKS = {
  'cowboy': { male: Object.assign({}, RACE_CREATOR_LOOKS['cowboy'].male, { "outer": "none", "wear": ["ewm_t2cowboy_hat", "ewm_t2cowboy_outfit"], "wearTint": {}, "wearFabric": {} },
    /* THE UNIT FACES pilot: his own Meshy face (shape + skin); the saved look's eye sliders are zeroed, they were shaping a stock face */
    { "cowboyFace": 1, "mhSkin": "ew_face_cowboy", "hairColor": "#4a3423",   /* (his beard is in the skin now: the beard piece is off, the hair takes the beard's brown) */
      "eyeSize": 0, "eyeHeight": 0, "eyeSpacing": 0, "eyeTilt": 0, "eyeOpen": 0, "eyeDepth": 0, "eyelid": 0, "eyeBags": 0, "epicanthus": 0 }) },
  'knight': { female: { "outfit":"none","bottoms":"none","outer":"none","outer2":"none","outfit2":"none","bottoms2":"none","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","beard":"none","model":"creator","version":2,"body":"mpfb_female","height":0.96,"knightFace":1,"jaw":-0.4,"head":-0.2,"nose":-0.3,"noseWidth":-0.4,"eyeSize":0.15,"browRidge":-0.6,"mouthCorners":0.25,"mhSkin":"ew_face_knight","mhEyes":"mhm_spamrakuen_sr_anime_maid-san_red_eyes","eyeTint":"pick","eyeColor":"#3a2418","mhBrows":"eyebrow010","mhLashes":"mindfront_eyelashes_04","lipTint":"pick","lipColor":"#b87882","linerTint":"pick","linerColor":"#17110f","shadowTint":"pick","shadowColor":"#6b4a55","blushTint":"pick","blushColor":"#c9727c","hair":"mh_long01","hairColor":"#5c0f1e","browColor":"#3a1418","browTint":"pick","idle":"Idle_11","wear":["ewm_t2knight_outfit"] } },
  'wizard': { male: { "outfit":"none","bottoms":"none","outer":"none","outer2":"none","outfit2":"none","bottoms2":"none","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","beard":"none","model":"creator","version":2,"body":"mpfb_male","height":0.95,"wizardFace":1,"mhSkin":"ew_face_wizard","mhEyes":"blue","mhBrows":"eyebrow001","hair":"hair004","hairColor":"#9a6a40","browColor":"#7a5230","browTint":"pick","idle":"Idle_11","wear":["ewm_t2wizard_hat","ewm_t2wizard_outfit"] } },
  /* batch one of the demo starters (2026-11-12): zombie, catgirl (his saved look's body + face + hair, the remade clothes), robinhood, quarterback */
  'zombie': { female: { "outfit":"none","bottoms":"none","outer":"none","outer2":"none","outfit2":"none","bottoms2":"none","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","beard":"none","model":"creator","version":2,"body":"mpfb_female","height":0.96,"zombieFace":1,"mhSkin":"ew_face_zombie","mhEyes":"brown","mhBrows":"own","mhLashes":"eyelashes02","hair":"hair001","hairColor":"#17181a","browColor":"#17181a","browTint":"pick","idle":"Idle_11","wear":["ewm_t2zombie_outfit"] } },
  'mummy': { female: { "outfit":"none","bottoms":"none","outer":"none","outer2":"none","outfit2":"none","bottoms2":"none","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","beard":"none","model":"creator","version":2,"body":"mpfb_female","height":0.96,"mummyFace":1,"mhSkin":"ew_face_mummy","mhEyes":"brown","mhBrows":"own","mhLashes":"eyelashes02","hair":"mh_long01","hairColor":"#17181a","browColor":"#17181a","browTint":"pick","idle":"Idle_11","wear":["ewm_t2mummy_outfit"] } },
  'angel': { female: { "outfit":"none","bottoms":"none","outer":"none","outer2":"none","outfit2":"none","bottoms2":"none","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"feathered","cape":"none","beard":"none","model":"creator","version":2,"body":"mpfb_female","height":0.96,"angelFace":1,"mhSkin":"ew_face_angel","mhEyes":"brown","mhLashes":"mindfront_eyelashes_04","lipTint":"pick","lipColor":"#c08a8a","mhBrows":"eyebrow010","jaw":-0.4,"head":-0.2,"nose":-0.3,"noseWidth":-0.4,"eyeSize":0.15,"browRidge":-0.6,"mouthCorners":0.25,"hair":"mh_long01","hairColor":"#b08a55","browColor":"#7a5a35","browTint":"pick","idle":"Idle_11","wear":["ewm_t2angel_outfit"] } },
  'catgirl': { female: Object.assign({}, RACE_CREATOR_LOOKS['catgirl'].female, { "outer2": "none", "feet": "none", "wear": ["ewm_t2catgirl_outfit", "ewm_crosspendant"], "wear2": "none", "wearTint": { "ewm_crosspendant": "#a0662e" }, "wearFabric": {} },   /* (the cross pendant + its tint = his saved look's own) */
    /* her own Meshy face (mondo 11-12: "i want it anyway and for you to clean it up"): the saved look's face sliders are zeroed, they were
       shaping a stock face (his cat ears, neck, eyes, lashes, lips and hair stay); her fringe hides the brows in the old model, so the look picks a pair */
    _ewFaceSlidersZeroed(), { "catgirlFace": 1, "mhSkin": "ew_face_catgirl", "skinTint": "own", "mhBrows": "eyebrow006", "browTint": "pick", "browColor": "#17140f" }) },
  'robinhood': { male: { "outfit":"none","bottoms":"none","outer":"none","outer2":"none","outfit2":"none","bottoms2":"none","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","beard":"none","model":"creator","version":2,"body":"mpfb_male","height":1,"robinhoodFace":1,"mhSkin":"ew_face_robinhood","mhEyes":"brown","mhBrows":"own","hair":"bald","hairColor":"#5a3a22","browColor":"#4a3020","browTint":"pick","idle":"Idle_11","wear":["ewm_t2robinhood_outfit"] } },
  'quarterback': { male: { "outfit":"none","bottoms":"none","outer":"none","outer2":"none","outfit2":"none","bottoms2":"none","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","beard":"none","model":"creator","version":2,"body":"mpfb_male","height":1,"mhSkin":"young_caucasian_male","mhEyes":"brown","mhBrows":"eyebrow001","hair":"bald","hairColor":"#2a1d14","browColor":"#2a1d14","browTint":"pick","idle":"Idle_11","wear":["ewm_t2quarterback_hat","ewm_t2quarterback_outfit"] } },
};
const _ewRemadeLookCache = {};
function getRaceRemadeLook(race, gender) {
  if (typeof window !== 'undefined' && window.EW_DISABLE_RACE_LOOKS) return null;
  const set = RACE_REMADE_LOOKS[race], g = gender === 'female' ? 'female' : 'male';
  if (!set || !set[g]) return null;
  const k = race + '|' + g, c = _ewRemadeLookCache[k] || (_ewRemadeLookCache[k] = normalizeCharacterAppearance(set[g]));
  return c ? Object.assign({}, c, { wear: c.wear.slice() }) : null;
}
function raceLooksAreDefault() { return EW_RACE_LOOKS_ARE_DEFAULT || (typeof window !== 'undefined' && window.EW_RACE_LOOKS_ARE_DEFAULT === true); }
/* the races whose creator look is their DEFAULT (the human base + the DOOR Agent; + the saved race looks only while
   EW_RACE_LOOKS_ARE_DEFAULT is on). THE MESHY DEFAULT: every race may WEAR a creator look (ewCreatorLookRace); only these
   wear one without the slot picking it. */
const EW_CREATOR_LOOK_RACES = ['homosapien', 'door agent'].concat(EW_RACE_LOOKS_ARE_DEFAULT ? Object.keys(RACE_CREATOR_LOOKS) : []);
function ewCreatorLookRace(race) { return typeof race === 'string' && !!race; }   // THE MESHY DEFAULT: the creator dresses every unit
function getCharacterAppearanceModel(race, gender, appearance) {
  const own0 = ewCreatorLookRace(race) && normalizeCharacterAppearance(appearance);
  if (own0 && own0.model === 'original') return null;   // THE RACE LOOKS: this slot wears the race's own model
  /* THE MESHY DEFAULT: no look on the slot = the race's own (Meshy) model, unless the race's look is its default */
  const a = own0 || ((EW_CREATOR_LOOK_RACES.includes(race) || raceLooksAreDefault()) && getRaceCreatorLook(race, gender));
  if (!a) return null;
  const mp = a.body && EW_MPFB_BASES[a.body];
  const def = mp ? Object.assign({}, mp, { heightRatio: mp.heightRatio * a.height })
    : Object.assign({}, EW_CHARACTER_BASES[gender === 'female' ? 'female' : 'male'], { heightRatio: a.height });
  if (race !== 'homosapien') {
    const set = RACE_MODELS_3D[race], own = set && (set[gender === 'female' ? 'female' : 'male'] || set.male || set.female);
    if (own && own.hold) def.hold = own.hold;
    if (own && own.basicAttackKind) def.basicAttackKind = own.basicAttackKind;
    /* THE RACE LOOKS: the race's own library flavour (the cowboy's quick-draw cast) + what its own model held */
    if (own && own._libOverridden && own._libOverridden.length && def.libClips) {
      def.libClips = Object.assign({}, def.libClips); def.libTimeScales = Object.assign({}, def.libTimeScales);
      for (const slot of own._libOverridden) { if (own.libClips[slot]) def.libClips[slot] = own.libClips[slot]; if (own.libTimeScales && own.libTimeScales[slot] != null) def.libTimeScales[slot] = own.libTimeScales[slot]; }
      def._libOverridden = own._libOverridden.slice();
    }
    const extra = RACE_CREATOR_LOOK_DEFS[race];
    if (extra) Object.assign(def, extra);
  }
  /* THE IDLE POSE: the look's picked idle (EW_IDLE_POSES); the def's own idle stays in libClips (the shared per-model bake),
     the renderer swaps the pick in per rig. A pick equal to the def's own idle is no pick. */
  const ip = a.idle && a.idle !== 'default' && EW_IDLE_POSES.find(o => o.id === a.idle);
  const own0Idle = def.libClips && def.libClips.idle;
  if (ip && ip.clip && def.libClips && !(own0Idle && own0Idle.clip === ip.clip && (own0Idle.lib || 0) === ip.lib)) {
    def.idlePick = { clip: ip.clip, lib: ip.lib };
    def.libTimeScales = Object.assign({}, def.libTimeScales, { idle: ip.ts || 1, ['clip:' + ip.clip]: ip.ts || 1 });
  }
  /* THE WALK STYLE: the same for the look's picked walk (EW_WALK_STYLES -> def.walkPick, played as the rig's walk) */
  const wp = a.walk && a.walk !== 'default' && EW_WALK_STYLES.find(o => o.id === a.walk);
  const own0Walk = def.libClips && def.libClips.walk;
  if (wp && wp.clip && def.libClips && !(own0Walk && own0Walk.clip === wp.clip && (own0Walk.lib || 0) === wp.lib)) {
    def.walkPick = { clip: wp.clip, lib: wp.lib };
    def.libTimeScales = Object.assign({}, def.libTimeScales, { walk: wp.ts || 1, ['clip:' + wp.clip]: wp.ts || 1 });
  }
  def.raceLook = a;   // the look this def dresses (the slot's own, else the race's baked one): every creator rig reads it
  return def;
}
// Every remote asset a look needs besides its base (the match-start preload
// gate warms these so the first board build is not a bald unit in plain cloth).
function getCharacterAppearanceAssets(appearance) {
  const a = normalizeCharacterAppearance(appearance);
  if (!a) return { hair: null, fabrics: [], wings: null, wear: [] };
  const fabrics = [];
  for (const layer of EW_APPEARANCE_LAYERS) { if (layer.extra && a[layer.slot] === 'none') continue; const u = getFabricTextureUrl(a[layer.fabric]); if (u && !fabrics.includes(u)) fabrics.push(u); }   // (rev 10: an extra layer warms only while worn)
  const wear = a.wear.concat(a.wear2 !== 'none' ? [a.wear2] : []).map(getWearUrl).concat([getOuterMeshUrl(a.outer, a.outerFront), getOuterMeshUrl(a.outer2, a.outer2Front), getCapeMeshUrl(a.cape), getFeetMeshUrl(a.feet)]).filter(Boolean);   // THE PACK CLOTHES (+ THE BLENDER COAT, its worn front)
  if (wear.length && (!a.body || a.body === 'classic')) wear.push(getClassicFitUrl('male'), getClassicFitUrl('female'));   // THE CLASSIC FIT (2026-11-02: the look has no gender; both are small)
  const shapes = a.body && a.body !== 'classic' ? getMpfbShapesUrl() : null;   // THE BODY SLIDERS
  const bust = (!a.body || a.body === 'classic') && a.bust ? getClassicBustUrl() : null;   // THE CLASSIC BUST (the renderer applies it to the female base only)
  const looks = (getMhLookLayers(a) || []).map(l => l[0]);   // THE LOOKS
  if (!looks.length) { const own = getMhOwnLashLayer(a.body); if (own) looks.push(own[0]); }   // THE LID LASHES (the body's own)
  const eyePack = getMhEyePack(a); if (eyePack) { looks.push(eyePack.map); if (eyePack.normal) looks.push(eyePack.normal); }   // THE EYE PACK (its PNGs)
  const hairMat = getHairMaterial(a); if (hairMat) looks.push(hairMat.url);   // THE HAIR MATERIALS (its PNG)
  return { hair: getHairStyleUrl(a.hair), fabrics, wings: getWingsStyleUrl(a.wings), wear, shapes, bust, looks };
}
function getWingsStyleUrl(id) { const o = id && id !== 'none' && EW_WINGS_STYLES.find(x => x.id === id); return o ? o.url || EW_WINGS_URL : null; }
if (typeof window !== 'undefined') {
  window.normalizeCharacterAppearance = normalizeCharacterAppearance;
  window.randomCharacterAppearance = randomCharacterAppearance;
  window.EW_CREATOR_HIDDEN = EW_CREATOR_HIDDEN; window.creatorHidden = creatorHidden; window.setCreatorHidden = setCreatorHidden; window.creatorHiddenList = creatorHiddenList;   // THE HIDDEN PICKS
  window.creatorHiddenShowAll = creatorHiddenShowAll; window.creatorHiddenExport = creatorHiddenExport; window.creatorHiderOn = creatorHiderOn; window.setCreatorHiderOn = setCreatorHiderOn;
  window.EW_CREATOR_NAMES = EW_CREATOR_NAMES; window.creatorName = creatorName; window.creatorRenamed = creatorRenamed; window.setCreatorName = setCreatorName;   // THE RENAMED PICKS
  window.creatorNamesList = creatorNamesList; window.creatorNamesReset = creatorNamesReset; window.creatorPickLabel = creatorPickLabel;
  window.EW_APPEARANCE_LIMITS = EW_APPEARANCE_LIMITS;
  window.ewPickSwitchedOff = ewPickSwitchedOff; window.EW_MPFB_FACE_SLIDERS = EW_MPFB_FACE_SLIDERS; window.EW_SHAPE_HEADS = EW_SHAPE_HEADS; window.EW_SHAPE_EARS = EW_SHAPE_EARS; window.EW_FACE_RESET_KEYS = EW_FACE_RESET_KEYS; window.EW_MPFB_BODY_SLIDERS = EW_MPFB_BODY_SLIDERS; window.EW_MPFB_FACE_KEYS = EW_MPFB_FACE_KEYS;   // THE FACE SLIDERS
  window.EW_MPFB_DEFAULT_FACES = EW_MPFB_DEFAULT_FACES; window.mpfbFacePatch = mpfbFacePatch;   // THE DEFAULT FACES
  window.EW_MPFB_FACE_PRESETS = EW_MPFB_FACE_PRESETS;   // THE FACE PRESETS (bake-faces.js)
  window.EW_APPEARANCE_ENUMS = EW_APPEARANCE_ENUMS;
  window.EW_IDLE_POSES = EW_IDLE_POSES;   // THE IDLE POSE
  window.EW_WALK_STYLES = EW_WALK_STYLES;   // THE WALK STYLE
  window.EW_APPEARANCE_COLORS = EW_APPEARANCE_COLORS;
  window.EW_HAIR_STYLES = EW_HAIR_STYLES;
  window.EW_FABRICS = EW_FABRICS;
  window.EW_OUTFIT_STYLES = EW_OUTFIT_STYLES;
  window.EW_BOTTOM_STYLES = EW_BOTTOM_STYLES;
  window.EW_OUTER_STYLES = EW_OUTER_STYLES;
  window.EW_FEET_STYLES = EW_FEET_STYLES;
  window.EW_GLOVE_STYLES = EW_GLOVE_STYLES;
  window.EW_BELT_STYLES = EW_BELT_STYLES;
  window.EW_NECKWEAR_STYLES = EW_NECKWEAR_STYLES;
  window.EW_GLASSES_STYLES = EW_GLASSES_STYLES;
  window.EW_WINGS_STYLES = EW_WINGS_STYLES;
  window.EW_RETIRED_CLOTHES = EW_RETIRED_CLOTHES; window.EW_WEAR_LAYER_OF = EW_WEAR_LAYER_OF; window.retireClassicClothes = retireClassicClothes;   // THE RETIRED CLASSIC CLOTHES
  window.EW_APPEARANCE_LAYERS = EW_APPEARANCE_LAYERS;
  window.EW_PATTERNS = EW_PATTERNS;
  window.getHairStyleUrl = getHairStyleUrl;
  window.getWingsStyleUrl = getWingsStyleUrl;
  window.getFabricTextureUrl = getFabricTextureUrl;
  window.getCharacterAppearanceModel = getCharacterAppearanceModel;
  window.EW_MPFB_BODIES = EW_MPFB_BODIES;
  window.mpfbKitOf = mpfbKitOf;
  window.EW_MH_EYE_PACK = EW_MH_EYE_PACK; window.getMhEyePack = getMhEyePack;   // THE EYE PACK
  window.EW_MH_HAIR_MATS = EW_MH_HAIR_MATS; window.getHairMaterial = getHairMaterial;   // THE HAIR MATERIALS
  window.EW_MH_LOOKS = EW_MH_LOOKS; window.getMhLookLayers = getMhLookLayers; window.getMhOwnLashLayer = getMhOwnLashLayer; window.getMhCreditsUrl = getMhCreditsUrl;   // THE LOOKS + THE CREDITS
  window.EW_MH_CHEST = EW_MH_CHEST; window.EW_MH_LIPS = EW_MH_LIPS; window.EW_MH_MAKEUP = EW_MH_MAKEUP;   // THE CHEST + THE LIP COLOUR
  window.EW_MH_WEAR = EW_MH_WEAR; window.EW_MH_FACIAL_HAIR = EW_MH_FACIAL_HAIR; window.wearTintable = wearTintable; window.wearKindOf = wearKindOf; window.wearFabricable = wearFabricable; window.EW_WEAR_BANDS = EW_WEAR_BANDS; window.EW_MH_WEAR_CATS = EW_MH_WEAR_CATS; window.EW_MH_WEAR_MULTI = EW_MH_WEAR_MULTI; window.getWearUrl = getWearUrl; window.EW_CAPE_STYLES = EW_CAPE_STYLES; window.getCapeMeshUrl = getCapeMeshUrl; window.getFeetMeshUrl = getFeetMeshUrl; window.outerHasFronts = outerHasFronts; window.outerFrontWorn = outerFrontWorn; window.EW_OUTER_FRONT = EW_OUTER_FRONT; window.EW_BOOT_TOPS = EW_BOOT_TOPS; window.EW_PANT_HEMS = EW_PANT_HEMS; window.pantsBootsWorn = pantsBootsWorn;   // THE PANTS IN THE BOOTS   // THE PACK CLOTHES
  window.EW_WEAR_SHELVES = EW_WEAR_SHELVES; window.wearShelfOf = wearShelfOf; window.wearMadeFor = wearMadeFor; window.outerMadeFor = outerMadeFor; window.EW_OUTER_GROUPS = EW_OUTER_GROUPS;   // THE SHELVES
  window.EW_WEAR_SLOTS = EW_WEAR_SLOTS; window.EW_WEAR_GROUPS = EW_WEAR_GROUPS; window.wearGroupOf = wearGroupOf; window.wearSlotOf = wearSlotOf; window.wearSlotOfGroup = wearSlotOfGroup;   // THE BODY SLOTS
  window.EW_CREATOR_LOOK_RACES = EW_CREATOR_LOOK_RACES; window.ewCreatorLookRace = ewCreatorLookRace; window.raceLooksAreDefault = raceLooksAreDefault;   // THE MESHY DEFAULT
  window.RACE_CREATOR_LOOKS = RACE_CREATOR_LOOKS; window.getRaceCreatorLook = getRaceCreatorLook; window.RACE_REMADE_LOOKS = RACE_REMADE_LOOKS; window.getRaceRemadeLook = getRaceRemadeLook; window.hasRaceCreatorLook = hasRaceCreatorLook;   // THE RACE LOOKS
  window.getCharacterAppearanceAssets = getCharacterAppearanceAssets;
}

/* THE CAST LOOKS (2026-11-12, mondo: "Ship, and remake Locke to blink"): a story character remade on a creator body (her Meshy
   T2 suit as a creator piece, her face from her old model: bake-outfit.py + bake-face.py, the route the remade units took). A
   cast id listed here wears this look wherever its model is asked for (getCastModel: DOOR HQ, the portrait studio; getRace3DModel:
   the board), so the rig has eyelids, a jaw and the creator's face moves. Console: window.EW_DISABLE_CAST_LOOKS = true = her old rig. */
const CAST_CREATOR_LOOKS = {
  locke: { gender: 'female', look: {"outfit":"none","bottoms":"none","outer":"none","outer2":"none","outfit2":"none","bottoms2":"none","feet":"none","gloves":"none","belt":"none","neckwear":"none","glasses":"none","wings":"none","cape":"none","beard":"none","model":"creator","version":2,"body":"mpfb_female","height":1.02,"jaw":-0.4,"head":-0.2,"nose":0,"noseWidth":0,"eyeSize":-0.2,"browRidge":-0.3,"mouthCorners":0,"mhSkin":"ew_face_locke","mhEyes":"mhm_spamrakuen_sr_anime_maid-san_red_eyes","eyeTint":"pick","eyeColor":"#5a6a72","mhBrows":"eyebrow010","mhLashes":"mindfront_eyelashes_04","lipTint":"pick","lipColor":"#9a6468","linerTint":"pick","linerColor":"#3a302e","shadowTint":"pick","shadowColor":"#5a4a50","blushTint":"pick","blushColor":"#c08080","hair":"mh_elvs_short_side_do","hairColor":"#e6e6ea","browColor":"#8a8a8e","browTint":"pick","idle":"Idle_11","wear":["ewm_t2locke_outfit"],"lockeFace":1,"mouthWidth":-0.2,"mouthHeight":-0.25} },
};
const _castLookDefs = {};
function getCastLookModel(id, race, gender) {
  const row = CAST_CREATOR_LOOKS[id];
  if (!row || (typeof window !== 'undefined' && window.EW_DISABLE_CAST_LOOKS)) return null;
  const r = race || 'homosapien', g = gender || row.gender, k = id + '|' + r + '|' + g;
  if (!(k in _castLookDefs)) { let d = null; try { d = getCharacterAppearanceModel(r, g, row.look); } catch (e) { d = null; } _castLookDefs[k] = d || null; }
  return _castLookDefs[k];
}
if (typeof window !== 'undefined') { window.CAST_CREATOR_LOOKS = CAST_CREATOR_LOOKS; window.getCastLookModel = getCastLookModel; }

const _castUnitDefs = {};
function getRace3DModel(race, gender, appearance) {
  if (typeof window !== 'undefined' && window.EW_DISABLE_3D_UNITS) return null;
  /* THE CAST ON THE BOARD (mondo 2026-11-12: Agent Locke fights the first quest as HERSELF, "She already has her own model.
     She walks around in the DOOR HQ"): a unit whose appearance is `{ cast: id }` wears that story character's own rig, with
     what its race's model holds (the Door Agent's gun) and its basic attack */
  if (appearance && typeof appearance.cast === 'string' && typeof DOOR_CAST_MODELS !== 'undefined' && DOOR_CAST_MODELS[appearance.cast] && !window.EW_DISABLE_CAST) {
    const cl = getCastLookModel(appearance.cast, race, gender);   // THE CAST LOOKS: remade on a creator body (with the race's hold + basic attack)
    if (cl) return cl;
    const ck = race + '|' + appearance.cast;
    if (!_castUnitDefs[ck]) {
      const rs = RACE_MODELS_3D[race], own = rs && (rs[gender === 'female' ? 'female' : 'male'] || rs.male || rs.female);
      _castUnitDefs[ck] = Object.assign({}, DOOR_CAST_MODELS[appearance.cast], (own && own.hold) ? { hold: own.hold } : {}, (own && own.basicAttackKind) ? { basicAttackKind: own.basicAttackKind } : {});
    }
    return _castUnitDefs[ck];
  }
  const custom = getCharacterAppearanceModel(race, gender, appearance);
  if (custom) return custom;
  // Werewolf transformation: a human (Homosapien Freelancer male) by day,
  // the beast by night. The _computeUnitStructuralSerial() serial tags the
  // werewolf's tod, so the entry rebuilds — and re-resolves this model — on
  // every phase flip. Always the male freelancer, regardless of the unit's
  // gender, per the day-form design.
  if (race === 'werewolf' && typeof getCurrentCyclePhase === 'function'
      && getCurrentCyclePhase() === 'day') {
    const dayForm = RACE_MODELS_3D['homosapien'];
    if (dayForm && dayForm.male) return dayForm.male;
  }
  const set = RACE_MODELS_3D[race];
  if (!set) return null;
  // Exact gender match only — never put the male model on a female unit.
  if (gender) return set[gender] || null;
  return set[Object.keys(set)[0]] || null;
}

/* THE UFO FORM (mondo 2026-10-27: "can we make the grey or any other race with ufo spell family turn into the UFO
   similar to how the time cop transforms with his spells ... treat the UFO like the seraphim or occulus where you
   give it custom animations like spinning and stuff for the spells"). Looks only. The craft is the Triangle UFO
   already on R2 (Assets/misc — the horizon's patrol and the VFX saucer), a boneless file, so procRig 'ufoCraft'
   (three-renderer.js THE PROCEDURAL RIGS) puts it on a hover and spin hinge and hangs a tractor beam under it.
   The swap is the Time Cop's: a cast from the UFO family sets unit._spriteOverride to ufoFormLook (battle.js
   UNIT_ANIM_OVERRIDES, wired for every race whose RACE_FAMILIES lists 'ufo'), a cast from any other family sets
   the race's own sprite url back, and the renderer resolves overrideForms[url]. The keys are the race's own 2D
   sprite (the UFO under a #ufo fragment), so a failed model falls back to the alien's own sheet. */
const UFO_FORM_3D = {
  model: 'https://cdn.entropywars.net/Assets/world/props/meshy/Meshy_AI_Triangle_UFO_0727195842_texture.glb',
  clips: {},
  procRig: 'ufoCraft',
  heightRatio: 0.6,   // the floor under the hover counts: the hull is about a tile across, flying ~1/4 tile up
  yawOffset: 0,
  basicAttackKind: 'magic',
  transformFx: true,
  moveTimeScale: 1, castTimeScale: 1, deathTimeScale: 1, hitTimeScale: 1, jumpTimeScale: 1,
};
/* A CRAFT FOR EACH ALIEN (mondo 2026-10-27: "can we use different ufos for different aliens? like a saucer for the
   grey, the martian can keep the triangle, maybe the bligblog can use a spaceship if there is one in the game
   already"). The bligblog flies the game's spaceship (Assets/misc, the space decor's; '#ufoship' keeps its rigged
   copy apart from the decor's), on procRig 'shipCraft' — the triangle's hinges and moves with the nose turned. The
   grey flies the saucer mondo made for it (the one already on R2 has its landing gear in the same mesh). A race not
   listed flies the triangle. */
const UFO_SHIP_3D = Object.assign({}, UFO_FORM_3D, {
  model: 'https://cdn.entropywars.net/Assets/world/props/meshy/Meshy_AI_spaceship_0727195825_texture.glb#ufoship',
  procRig: 'shipCraft',
  heightRatio: 0.49,  // the hull is 0.4 tall to the triangle's 0.61: the same scale, so the same tile across
});
/* the grey's saucer: mondo's own (Assets/world/props/meshy/UFO_Low_Poly.fbx, 2026-10-27), on procRig 'saucerCraft' — round, so no nose
   turned, the hull spinning flat like the triangle's */
const UFO_SAUCER_3D = Object.assign({}, UFO_FORM_3D, {
  model: 'https://cdn.entropywars.net/Assets/world/props/meshy/UFO_Low_Poly.fbx',
  procRig: 'saucerCraft',
  heightRatio: 0.72,  // dome and all it is 0.84 tall to the triangle's 0.61 at the same width: the same scale
});
const UFO_CRAFT_BY_RACE = { bligblog: UFO_SHIP_3D, grey: UFO_SAUCER_3D };
function ufoFormBaseLook(race, gender) {
  return (typeof getR2RaceSpriteUrl === 'function' && getR2RaceSpriteUrl(race, gender || 'male', 'Freelancer')) || null;
}
function ufoFormLook(race, gender) {
  const base = ufoFormBaseLook(race, gender);
  return base ? base + '#ufo' : null;
}
/* every model def of the race learns both looks (the craft, and itself to come back to) */
function wireUfoForm(race) {
  const set = RACE_MODELS_3D[race];
  if (!set) return false;
  let any = false;
  for (const g in set) {
    const d = set[g], base = ufoFormBaseLook(race, g), look = ufoFormLook(race, g);
    if (!d || !base) continue;
    d.overrideForms = d.overrideForms || {};
    if (!d.overrideForms[base]) d.overrideForms[base] = d;
    d.overrideForms[look] = UFO_CRAFT_BY_RACE[race] || UFO_FORM_3D;
    d.transformFx = true;   // the shock ring on the swap back too
    any = true;
  }
  return any;
}

/* ♟ THE CHESS PIECE (2026-10-29, mondo: "a character that plays as the chess pieces, with it switching to different pieces depending
   on the spell"): each look is one BLACK piece of his chess set (Assets/world/packs/chess/Low Poly Chess Set.fbx — the set's one loader cuts the
   node out, three-renderer.js _asChessRig) on procRig 'chess<Piece>' (THE CHESS PIECE rig: a hinge at the base, a carved piece's
   moves). The pawn is the race's own def; the other five are its overrideForms, keyed by their glyph looks (CHESS_PIECE_LOOKS), so the
   piece a spell names is the piece on the board. Taller pieces stand taller, as on a real board. */
const _CHESS_SET_URL = 'https://cdn.entropywars.net/Assets/world/packs/chess/' + encodeURIComponent('Low Poly Chess Set.fbx') + '#';
const _CHESS_HEIGHT = { pawn: 1.0, knight: 1.15, bishop: 1.25, rook: 1.1, queen: 1.35, king: 1.45 };
const CHESS_PIECE_3D = {};
CHESS_PIECE_NAMES.forEach(p => {
  const P = p.charAt(0).toUpperCase() + p.slice(1);
  CHESS_PIECE_3D[p] = {
    model: _CHESS_SET_URL + 'Low_Poly_Black_' + P,
    clips: {},
    procRig: 'chess' + P,
    heightRatio: _CHESS_HEIGHT[p],
    yawOffset: 0,
    basicAttackKind: 'melee',
    transformFx: true,   // the shock ring on every change of piece
    moveTimeScale: 1, castTimeScale: 1, deathTimeScale: 1, hitTimeScale: 1, jumpTimeScale: 1,
  };
});
CHESS_PIECE_3D.pawn.overrideForms = {};
CHESS_PIECE_NAMES.forEach(p => { CHESS_PIECE_3D.pawn.overrideForms[CHESS_PIECE_LOOKS[p]] = CHESS_PIECE_3D[p]; });
RACE_MODELS_3D['chess piece'] = { male: CHESS_PIECE_3D.pawn };

// ───────────────────────────────────────────────────────────────────────────
// D.O.O.R. CAST — the story's named people (2026-09-06)
//
// The cast are NOT races: they never appear on the roster, in the Shop or on
// the board, so they live in their own registry instead of RACE_MODELS_3D.
// Every model is a rigged Meshy `..._Character_output.glb` in
// R2 Assets/characters/races/maincharacters/ (all 15 HEAD-verified and
// rig-checked 2026-09-06: 1 skin, 24 joints, Hips root, 1.70 m normalised —
// so heightRatio below is the ONLY size signal, exactly like the roster).
// Animation comes from the shared library like everything else; the extra
// `hq*` slots are the BUILDING POSES three-renderer.js plays for a placed
// cast member (data.js DOOR_CAST spots name one as `pose`; a member with no
// pose idles). Who they are and where they stand is data.js DOOR_CAST; the
// story is DOOR_STORY.md §2 (hand-authored by the user).
//   hqSit      Sitting_Idle_Loop     (UAL1) behind a desk / on a chair
//   hqSitTalk  Sitting_Talking_Loop  (UAL1) seated, mid-conversation
//   hqTalk     Idle_Talking_Loop     (UAL1) standing, briefing someone
//   hqPhone    Idle_TalkingPhone_Loop (UAL2) on the phone
//   hqArms     Idle_FoldArms_Loop    (UAL2) arms folded, unimpressed
//   hqFix      Fixing_Kneeling       (UAL1) kneeling at a door with tools
//   hqPush     Push_Loop             (UAL1) leaning into a mop handle
//   hqReach    PickUp_Table          (UAL1) rummaging a shelf
//   hqCrouch   Crouch_Idle_Loop      (UAL1) low, cat-like, by a counter
//   hqNo       Idle_No_Loop          (UAL2) shaking the head
//   hqStaff    Sword_Idle            (UAL1) a pole held at the side
//   hqLean     Idle_Rail_Loop        (UAL2) forearms on a rail — leaning on the mop
// Poses that move the pelvis off the root in the ground plane (the UAL sit
// slides it ~0.5 m back) bake with pinXZ: the hips drop but stay over the
// spot, so a seated member is ON the chair the spot names, feet in front.
// Kill-switch (console): window.EW_DISABLE_CAST = true → getCastModel()
// returns null, the building falls back to agents + roster vessels and the
// avatar to the most-played vessel (EW_HQ_AVATAR = 'vessel' does only the
// latter).
// ───────────────────────────────────────────────────────────────────────────
const _CAST_POSES = {
  hqSit:     { clip: 'Sitting_Idle_Loop',      lib: 0, ts: 1.0, pinXZ: true },
  hqSitTalk: { clip: 'Sitting_Talking_Loop',   lib: 0, ts: 1.0, pinXZ: true },
  hqTalk:    { clip: 'Idle_Talking_Loop',      lib: 0, ts: 1.0 },
  hqPhone:   { clip: 'Idle_TalkingPhone_Loop', lib: 1, ts: 1.0 },
  hqArms:    { clip: 'Idle_FoldArms_Loop',     lib: 1, ts: 1.0 },
  hqFix:     { clip: 'Fixing_Kneeling',        lib: 0, ts: 1.0, pinXZ: true },
  hqPush:    { clip: 'Push_Loop',              lib: 0, ts: 0.8, pinXZ: true },
  hqReach:   { clip: 'PickUp_Table',           lib: 0, ts: 0.7, pinXZ: true },
  hqCrouch:  { clip: 'Crouch_Idle_Loop',       lib: 0, ts: 1.0, pinXZ: true },
  hqNo:      { clip: 'Idle_No_Loop',           lib: 1, ts: 1.0 },
  hqStaff:   { clip: 'Sword_Idle',             lib: 0, ts: 1.0 },
  hqLean:    { clip: 'Idle_Rail_Loop',         lib: 1, ts: 1.0 },
};
// SKATEBOARDING rev 2 (2026-09-15): THE RIDE clip — the library's Idle_10 (the
// brawler's loose, feet-apart stance) is what the HQ walker plays on the deck,
// turned sideways so the stance lies along the board (three-renderer.js
// _hqRidePose, stanceYaw). Baked onto the walker's rig at spawn as slot
// `hqRide` (_hqSpawnCharacter); never a per-race export.
const HQ_RIDE_CLIP = { clip: 'Idle_10', lib: 2, ts: 1.0 };
if (typeof window !== 'undefined') window.HQ_RIDE_CLIP = HQ_RIDE_CLIP;
/* SKATEBOARDING rev 3 (2026-09-17): the rider's other three clips, baked onto the WALKER's
   rig beside the ride stance (three-renderer.js _hqSpawnCharacter) — the push STRIDE (UAL1
   Jog_Fwd_Loop: a light stride, the old push was the Running sprint), the bail's FALL (UAL2
   Slide_Start 0.83 s: a run that goes down into a slide on the floor — read off the contact
   sheet) and the GET-UP (UAL2 Slide_Exit 0.5 s: up off the floor onto the feet). The renderer
   sizes fall / get-up to their share of HQ_SKATE_RULES.bailMs and plays each once. */
/* SKATEBOARDING rev 6 (2026-09-20, the user: "my character does a pushing animation with his arms
   instead of a kick animation"): the push is THE KICK — MAL1's Spartan_Kick (lib 2; the leg comes
   up and drives out 0.55–0.8 s, the foot is down at 0.93 — PLAYTEST_NOTES' strike table), TRIMMED to
   its stroke and timed so one stroke fills HQ_SKATE_RULES.pushMs. The bake slot is `hqSkatePush` —
   NEVER `hqPush`: that is the CAST pose (Push_Loop, leaning into a mop handle with both arms) which
   the Player cast rig already carries, and rev 3's `!def.libClips.hqPush` guard let it shadow the
   stride — the arm push the user saw. Neither library has a skate scoot; the kick is the nearest. */
const HQ_SKATE_CLIPS = { fall: { clip: 'Slide_Start', lib: 1, ts: 1.0 }, getup: { clip: 'Slide_Exit', lib: 1, ts: 1.0 } };   // rev 7 (2026-09-20): NO push clip — the rider stays in the ride stance through a push (the user)
if (typeof window !== 'undefined') window.HQ_SKATE_CLIPS = HQ_SKATE_CLIPS;
// THE DOOR GUN rev 4 (2026-09-16): the walker's GUN clips, baked beside the
// ride clip on the HQ avatar's rig only (three-renderer.js _hqSpawnCharacter
// → slots `hqAim` / `hqShoot`). UAL1 (lib 0) has the pistol set — the aim is
// the two-hand neutral hold (loops: the officer stands with the gun UP while
// it is drawn), the shot is Pistol_Shoot cut to the recoil. The Pistol_Idle
// idles were retired for the ROSTER in 2026-08-09; the walker holding a real
// gun is the one case that wants them.
const HQ_GUN_CLIPS = { aim: { clip: 'Pistol_Aim_Neutral', lib: 0, ts: 1.0 }, shoot: { clip: 'Pistol_Shoot', lib: 0, ts: 1.6 } };
if (typeof window !== 'undefined') window.HQ_GUN_CLIPS = HQ_GUN_CLIPS;
// THE DEEP (2026-09-18): the walker's SWIM clips, baked beside the ride clip on the HQ
// avatar's rig only (three-renderer.js _hqSpawnCharacter → slots `hqSwim` / `hqSwimIdle`).
// UAL1 (lib 0) has the swim pair — Swim_Fwd_Loop (the stroke, prone) and Swim_Idle_Loop
// (the float; the atlantean and the mermaid already idle on it, "the swim loop read as
// floating on land"). The renderer plays the stroke while the swimmer moves and pitches
// the body with the dive. THE HELM clips: Sitting_Idle_Loop in the skiff, Driving_Loop in
// the bathyscaphe (UAL1 has both).
const HQ_SWIM_CLIPS = { swim: { clip: 'Swim_Fwd_Loop', lib: 0, ts: 1.0 }, idle: { clip: 'Swim_Idle_Loop', lib: 0, ts: 1.0 } };
if (typeof window !== 'undefined') window.HQ_SWIM_CLIPS = HQ_SWIM_CLIPS;
/* THE CLIMB (AREA_CONTENT_PLAN §4, 2026-09-19; the real clips 2026-10-12): the walker's LADDER clips. MAL3 (lib 4) carries
   two Meshy climbs from mondo's third batch: Fast_Ladder_Climb (0.8 s, ~0.5 m of hips travel a cycle) for ladders, fire
   escapes, pipes and walls, and Climb_Up_Rope (2.6 s, ~0.6 m) for ropes, vines and chains. Both bake pinHips (the walker's
   own climb moves the body; the clip's rise would double it). `rate` = metres the clip climbs a second at ts 1, so
   three-renderer.js _hqTickChars matches the hands to the walker's real speed; going down plays the clip backwards and the
   hang is the climb frozen on its current frame. ClimbUp_1m (UAL2) stays the mantle over the head onto the tier. If lib 4
   is missing the old swim-stroke-stood-up chain still covers the slot. */
const HQ_CLIMB_CLIPS = { climb: { clip: 'Fast_Ladder_Climb', lib: 4, ts: 1.0, rate: 0.62, pinHips: true }, rope: { clip: 'Climb_Up_Rope', lib: 4, ts: 1.0, rate: 0.23, pinHips: true }, mantle: { clip: 'ClimbUp_1m', lib: 1, ts: 1.3 }, ropeLooks: ['rope', 'vine', 'chain'] };
if (typeof window !== 'undefined') window.HQ_CLIMB_CLIPS = HQ_CLIMB_CLIPS;
const HQ_VEHICLE_CLIPS = { boat: { clip: 'Sitting_Idle_Loop', lib: 0, ts: 1.0 }, sub: { clip: 'Driving_Loop', lib: 0, ts: 1.0 } };
if (typeof window !== 'undefined') window.HQ_VEHICLE_CLIPS = HQ_VEHICLE_CLIPS;
/* THE DEBRIEF — THE PARTY'S POSES (2026-09-21): the clips the result screen's 3D stage plays
   on the VIEWER'S party (battle.js _stageVictoryPodium → ThreeRenderer.podium). Baked LAZILY onto
   a unit's rig the first time a result screen stages it (three-renderer.js _podiumBakePoses —
   never a UAL_SLOTS row: that table bakes onto every rig at load), so the board pays nothing
   for them. Read off the library inventory (rigged_animations/): neither library carries a
   named "victory" clip — the JRPG lineup is built from the celebration / rest loops it does.
     VICTORY  vicCheer  UAL2 Yes              2.5 s one-shot — both fists pumped: the MVP's opener
              vicDance  UAL1 Dance_Loop       1.0 s loop — the victory dance (the FF fanfare shuffle)
              vicArms   UAL2 Idle_FoldArms    loop — arms folded, unimpressed: the cool one
              vicStance MAL1 Idle_10          loop — the brawler's loose, feet-apart stance
              vicJump   MAL1 Regular_Jump     one-shot — a hop for joy (the tween owns no arc here;
                                              the clip's own hips travel reads as the hop)
     DEFEAT   defKneel  UAL1 Crouch_Idle_Loop loop, pinXZ — down on one knee, head low
              defNo     UAL2 Idle_No_Loop     loop — shaking the head
              defSit    UAL1 Sitting_Idle     loop, pinXZ — slumped on the ground
     (the fallen play the rig's own `death` slot and stay down — it is already baked.)
   A pose that reads wrong on a rig = retune here (ts / the clip), never per site. */
const PODIUM_POSES = {
  vicCheer:  { clip: 'Yes',                lib: 1, ts: 1.0 },
  vicDance:  { clip: 'Dance_Loop',         lib: 0, ts: 1.0 },
  vicArms:   { clip: 'Idle_FoldArms_Loop', lib: 1, ts: 1.0 },
  vicStance: { clip: 'Idle_10',            lib: 2, ts: 1.0 },
  vicJump:   { clip: 'Regular_Jump',       lib: 2, ts: 1.6 },
  defKneel:  { clip: 'Crouch_Idle_Loop',   lib: 0, ts: 0.9, pinXZ: true },
  defNo:     { clip: 'Idle_No_Loop',       lib: 1, ts: 0.9 },
  defSit:    { clip: 'Sitting_Idle_Loop',  lib: 0, ts: 0.9, pinXZ: true },
};
/* the one-shots among them (LoopOnce + clamp); every other pose loops */
const PODIUM_POSE_ONESHOT = { vicCheer: true, vicJump: true };
if (typeof window !== 'undefined') { window.PODIUM_POSES = PODIUM_POSES; window.PODIUM_POSE_ONESHOT = PODIUM_POSE_ONESHOT; }
// A cast member: the shared library + every building pose + a per-character
// flavour. `female` picks the female idle/walk (the roster's gendered
// defaults only sweep RACE_MODELS_3D). `file` overrides the model filename
// for the two exports Meshy named without `_biped`.
function _mkCast(prefix, opts) {
  opts = opts || {};
  const lib = Object.assign({}, _CAST_POSES, opts.female ? _FEM_SLOT_DEFAULTS : {}, opts.lib || {});
  const o = Object.assign({ heightRatio: 1.0 }, opts, { lib });
  delete o.female; delete o.file;
  if (opts.file) o.model = `${_S}/Races/maincharacters/${opts.file}`;
  return _mk3d('maincharacters', prefix, {}, o);
}
const DOOR_CAST_MODELS = {
  // the recruit — the default HQ avatar since 2026-09-06 (map.js _hqAvatar)
  player:   _mkCast('Player',       { heightRatio: 1.0 }),
  // your superior; by-the-book, the book keeps changing
  locke:    _mkCast('Agent_Locke',  { heightRatio: 0.96, female: true }),
  // colleague / love interest; Ringer's daughter
  belle:    _mkCast('Agent_Belle',  { heightRatio: 0.94, female: true }),
  // cocky; Meshy named this export without _biped
  glass:    _mkCast('Agent_Glass',  { heightRatio: 1.02, file: 'Meshy_AI_Agent_Glass_Character_output.glb' }),
  // your friend; started a few months before you; always knocks first
  knox:     _mkCast('Agent_Knox',   { heightRatio: 0.98 }),
  // Belle's father, the respected veteran
  ringer:   _mkCast('Agent_Ringer', { heightRatio: 1.04 }),
  // reception / intake — the big heart behind the counter
  rhonda:   _mkCast('Rhonda',       { heightRatio: 0.94, female: true }),
  // the mogul who funds DOOR; visits unannounced
  elle:     _mkCast('Elle_Vator',   { heightRatio: 0.96, female: true }),
  // formerly Agent Gates — the radical Opener; never in the building
  dorian:   _mkCast('Dorian_Gates', { heightRatio: 1.02 }),
  // facilities — renovations, new doors, the trap door in your closet
  otto:     _mkCast('Otto',         { heightRatio: 1.0 }),
  // the director; not seen. The Janitor is the same height on purpose.
  doorman:  _mkCast('Doorman',      { heightRatio: 1.0 }),
  // $15/hour, no benefits, a key to every room; Meshy export without _biped
  janitor:  _mkCast('Janitor',      { heightRatio: 1.0, file: 'Meshy_AI_Janitor_Character_output.glb' }),
  // the parents — flashbacks only
  mother:   _mkCast('Mother',       { heightRatio: 0.95, female: true }),
  father:   _mkCast('Father',       { heightRatio: 1.02 }),
  // the refugee catgirl (petite, like the roster catgirl); lowercase on R2
  kit:      _mkCast('kit',          { heightRatio: 0.88, female: true }),
  // THE CULT MEMBERS (2026-09-21) — the user's five robed rigs in R2 Races/cultmember/ (Meshy "Running" exports
  // with skin = rigged bases). The Grove's family (data.js DOOR_CAST cult1–5); the cult leader's capstone
  // summons one (three-renderer.js _buildSummon3D 'cultist' clones the first). `model` overrides _mkCast's folder.
  cult1:    _mkCast('cult_member_1', { heightRatio: 1.0, model: `${_S}/Races/cultmember/Meshy_AI_cult_member_1_Running.glb` }),
  cult2:    _mkCast('cult_member_2', { heightRatio: 1.0, model: `${_S}/Races/cultmember/Meshy_AI_cult_member_2_Running.glb` }),
  cult3:    _mkCast('cult_member_3', { heightRatio: 1.0, model: `${_S}/Races/cultmember/Meshy_AI_cult_member_3_Running.glb` }),
  cult4:    _mkCast('cult_member_4', { heightRatio: 1.0, model: `${_S}/Races/cultmember/Meshy_AI_cult_member_4_Running.glb` }),
  cult5:    _mkCast('cult_member_5', { heightRatio: 1.0, model: `${_S}/Races/cultmember/Meshy_AI_cult_member_5_Running.glb` }),
  // FRANKENSTEIN (2026-10-28, mondo's upload: "here's a frankenstein rigged model to use for mad scientist's creation spell") —
  // a Meshy "Running" export beside the Mad Scientist's own files (the typo is the bucket's name). The Mad Scientist's Summon
  // Creation wears it (three-renderer.js _SUMMON_ANIMALS.creation): its own Running is the run, the library fills the rest with
  // the zombie sway + shuffle. A head taller than a man. Being a cast row it is also in the editor's PEOPLE tab ("The cast").
  frankenstein: _mkCast('fankenstein', { heightRatio: 1.15, model: `${_S}/Races/Homosapien/Male/engineer/Meshy_AI_fankenstein_Running.glb`,
                                         lib: { idle: { clip: 'Zombie_Idle_Loop', lib: 1 }, walk: { clip: 'Zombie_Walk_Fwd_Loop', lib: 1, ts: 2.5 } } }),
};
function getCastModel(id) {
  if (typeof window !== 'undefined' && (window.EW_DISABLE_3D_UNITS || window.EW_DISABLE_CAST)) return null;
  return getCastLookModel(id) || DOOR_CAST_MODELS[id] || null;   // THE CAST LOOKS: a remade cast member wears her creator look
}
if (typeof window !== 'undefined') {
  window.DOOR_CAST_MODELS = DOOR_CAST_MODELS;
  window.getCastModel = getCastModel;
}
// THE DOOR AGENT race (DOOR_RACE_DESIGN.md, 2026-09-14) walks the board as the
// cast: the recruit (male) and Agent Belle (female). Registered HERE — after
// the cast library — because RACE_MODELS_3D is built before _CAST_POSES exists.
// 2026-09-16: every Door Agent CARRIES THE DOOR GUN by default — the D.O.O.R. catalogue's
// `door_gun` GLB (data.js, the user's retro ray gun) in the right hand, at real scale, the
// same grip tuning the building's walker uses (data.js HQ_PORTAL_RULES.gun — the ONE place
// to move it). three-renderer.js `_unitAttachHeld` parents it to the rig's hand bone.
// (sprites.js loads BEFORE data.js: this row is the fallback — `_unitAttachHeld` merges the live
// HQ_PORTAL_RULES.gun over it at attach time, so the grip is tuned there, once.)
const _DOOR_AGENT_HOLD = { key: 'door_gun', bone: 'RightHand', pos: [0, -0.06, 0.04], rot: [0, 90, 0] };
RACE_MODELS_3D['door agent'] = {
  male:   Object.assign({}, DOOR_CAST_MODELS.player, { basicAttackKind: 'punch', hold: _DOOR_AGENT_HOLD }),
  female: Object.assign({}, DOOR_CAST_MODELS.belle,  { basicAttackKind: 'punch', hold: _DOOR_AGENT_HOLD }),
};

// ───────────────────────────────────────────────────────────────────────────
// RACE MODEL SKINS (2026-09-21) — a race's OTHER rigs, for the building's
// population only (the board keeps RACE_MODELS_3D's one model per gender).
//   sites[<mapId>][gender] — the rig a native of this race wears in the rooms
//     of THAT site (the user: "the cyberpunk cops should only be in cyberpunk
//     city"); a site with no row wears the plain model / an alt.
//   alts[gender] — a list of stand-ins for the plain model; the population
//     draws one per walker (seeded), so a street has more than one face.
// Read ONLY through getRaceModelSkin(race, gender, { site, seed }) — the
// renderer's _hqSpawnCharacter calls it for every NPC that is not the walker,
// the cast or a creator look. Never list a skin under RACE_MODELS_3D: its
// keys ARE the playable genders (race3DGenders).
const RACE_MODEL_SKINS = {
  'police officer': {
    sites: {
      prebuilt_cyberpunk: {
        male:   _mkUAL('police', 'a_cyberpunk_police_officer', {
          model: `${_S}/Races/police/Meshy_AI_a_cyberpunk_police_officer_Running.glb`,
          heightRatio: 1.02, basicAttackKind: 'ranged' }),
        female: _mkUAL('police', 'a_cyberpunk_police_officer_female', {
          model: `${_S}/Races/police/Meshy_AI_a_cyberpunk_police_officer_female_Running.glb`,
          heightRatio: 0.96, basicAttackKind: 'ranged', lib: Object.assign({}, _FEM_SLOT_DEFAULTS) }),
      },
    },
    alts: {
      male: [
        _mkUAL('police', 'a_fat_white_police_officer', {
          model: `${_S}/Races/police/Meshy_AI_a_fat_white_police_officer_Running.glb`,
          heightRatio: 1.0, basicAttackKind: 'ranged' }),
      ],
    },
  },
};
/* the ONE read: a site skin for the room's site (either gender — a female
   walker of a male-only race exists only where a skin gives her a rig), else
   a seeded alt, else null (= wear RACE_MODELS_3D's own). */
function getRaceModelSkin(race, gender, opts) {
  if (typeof window !== 'undefined' && window.EW_DISABLE_3D_UNITS) return null;
  const R = RACE_MODEL_SKINS[race];
  if (!R) return null;
  opts = opts || {};
  const g = gender || 'male';
  if (opts.site && R.sites && R.sites[opts.site]) {
    const site = R.sites[opts.site];
    return site[g] || site.male || site.female || null;
  }
  if (R.alts && R.alts[g] && R.alts[g].length) {
    const base = RACE_MODELS_3D[race] && RACE_MODELS_3D[race][g];
    const pool = base ? [base].concat(R.alts[g]) : R.alts[g];
    let h = 0; const key = String(opts.seed != null ? opts.seed : '');
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return pool[h % pool.length] || null;
  }
  return null;
}
/* does a site skin exist for this race + site + gender (the population's gender draw asks before it seats a female cop) */
function raceModelSkinGenders(race, site) {
  const R = RACE_MODEL_SKINS[race];
  const s = R && R.sites && site && R.sites[site];
  return s ? Object.keys(s) : [];
}
if (typeof window !== 'undefined') { window.RACE_MODEL_SKINS = RACE_MODEL_SKINS; window.getRaceModelSkin = getRaceModelSkin; window.raceModelSkinGenders = raceModelSkinGenders; }

// ───────────────────────────────────────────────────────────────────────────
// HUD portraits — close-up 128×128 face art shown in the HUD panels, the
// turn-clock flanks, the horologe clock face + target menus, the far-zoom
// nameplates and the party-builder rail. Same exact-gender rule as the
// model/sheet registries; units without an entry fall back to their map
// sprite wherever portraits render.
//
// Art lives in the shared folder Assets/characters/portraits/
// <male|female>/<name>.png. Some file names are slang/gendered variants of
// the race ("glowie" = female men in black, "cowgirl", "witch", …) — every
// URL below was HEAD-verified live on R2 2026-07-07. To add one: upload a
// 128×128 png into that folder and list it here.
// ───────────────────────────────────────────────────────────────────────────
const _PORT = `${_S}/character_portraits`;
const _pm = (f) => `${_PORT}/male/${f}.png`;
const _pf = (f) => `${_PORT}/female/${f}.png`;
const RACE_PORTRAITS = {
  // ── homosapien sub-races ──
  'homosapien':     { female: _pf('freelancer') },          // no male file yet
  'pirate':         { male: _pm('pirate'),       female: _pf('pirate') },
  'knight':         { female: _pf('knight') },
  'shaman':         { male: _pm('harvester'),    female: _pf('harvester') },
  'mad scientist':  { male: _pm('madscientist'), female: _pf('madscientist') },
  'cowboy':         { male: _pm('cowboy'),       female: _pf('cowgirl') },
  'men in black':   { male: _pm('meninblack') },   // 2026-10-25 — the Spy (her own race since 2026-10-27) wears the zoomed-in face of her new sprite (hud.js EWFaces), mondo's call; glowie.png stays on R2
  'popstar':        { female: `${_S}/Races/popstar/popstar_female.png` },   // 2026-09-22 — the sheet stands in for the portrait for now (the user's call)
  'telepath':       { female: _pf('psychic') },
  'marksman':       { male: _pm('sniper') },   // 2026-10-25 — the female sniper wears the zoomed-in face of her new sprite (hud.js EWFaces), mondo's call
  'priest':         { male: _pm('priest') },                // the Nun (his female, 2026-10-27) wears the face of her sprite
  'wizard':         { female: _pf('witch') },               // no male wizard file yet
  'fortune teller': {
    // ⚠ character_portraits has no male fortuneteller yet — he keeps his
    // original harbinger-folder portrait until one is uploaded.
    male: `${_S}/Races/Homosapien/Male/harbinger/portrait.png`,
    female: _pf('fortuneteller'),
  },

  // ── everyone else with art in the folder ──
  'nordic':      { male: _pm('nordic') },
  'djinn':       { male: _pm('djinn') },
  'demon':       { male: _pm('devil') },
  'quarterback': { male: _pm('quarterback') },
  'bigfoot':     { male: _pm('bigfoot') },
  'grey':        { male: _pm('grey') },
  'giant':       { male: _pm('giant') },
  'werewolf':    { male: _pm('werewolf') },
  'reptilian':   { male: _pm('reptilian') },
  'anubis':      { male: _pm('anubis') },
  'mantid':      { male: _pm('mantid') },
  'antperson':   { male: _pm('antperson') },
  'zombie':      { female: _pf('zombie') },
  'catgirl':     { female: _pf('catgirl') },
  'succubus':    { female: _pf('succubus') },
  'fairy':       { female: _pf('fairy') },
  'halfdemon':   { female: _pf('halfdemon') },
  'ki fighter':  { female: _pf('kifighter') },
  'valkraye':    { female: _pf('valkraye') },
};

function getUnitPortraitArtUrl(unit) {
  if (!unit || !unit.race) return null;
  /* THE MODEL PORTRAITS (2026-11-12): a unit that wears a model of its own (a creator look, or a story character's rig,
     `appearance.cast`: Agent Locke) shows that model's face, photographed off its Head bone (three-renderer.js THE PORTRAIT
     STUDIO). null until the photo is in: the race's art / the sprite's face stands in, then the HUD repaints. */
  if (unit.appearance && typeof window !== 'undefined' && window.EWPortraits) {
    try { const own = window.EWPortraits.url(unit); if (own) return own; } catch (e) {}
  }
  if (unit.race === 'chess piece') return chessPieceLook(unit._chessPiece);   // ♟ the glyph of the piece it is now
  const set = RACE_PORTRAITS[unit.race];
  if (!set) return null;
  return set[unit.gender || 'male'] || null;
}

/* The UI Maker's Portraits (hud.js EWFaces) can stand a face cut from the unit's own sprite in for the art (a unit
   without art gets one by default), or show the whole sprite: undefined = keep the art. */
function getUnitPortraitUrl(unit) {
  const art = getUnitPortraitArtUrl(unit);
  if (unit && unit.race && typeof window !== 'undefined' && window.EWFaces) {
    try { const f = window.EWFaces.url(unit, art); if (f !== undefined) return f; } catch (e) {}
  }
  return art;
}

const RACE_SPRITES = {
  'ai': `${_S}/ai.png`,
  'android': `${_S}/android.png`,
  'angel': `${_S}/angel.png`,
  'annunaki': `${_S}/annunaki.png`,
  'bigfoot': `${_S}/bigfoot.png`,
  'demon': `${_S}/demon.png`,
  'fairy': `${_S}/fairy.png`,
  'ghost': `${_S}/ghost.png`,
  'giant': `${_S}/giant.png`,
  'grey': `${_S}/grey.png`,
  'homosapien': `${_S}/homosapien.png`,
  'pirate': `${_S}/homosapien.png`,
  'knight': `${_S}/homosapien.png`,
  'shaman': `${_S}/homosapien.png`,
  'mad scientist': `${_S}/homosapien.png`,
  'cowboy': `${_S}/homosapien.png`,
  'men in black': `${_S}/homosapien.png`,
  'spy': `${_S}/Races/spy/spy_female.png`,   // 2026-10-27 — her own sprite
  'telepath': `${_S}/homosapien.png`,
  'marksman': `${_S}/homosapien.png`,
  'priest': `${_S}/homosapien.png`,
  'gangster': `${_S}/Races/gangster/gangster_male.png`,
  'door agent': `${_S}/homosapien.png`,
  'police officer': `${_S}/character_sprites/policeofficer.png`,   // 2026-10-04 — his own sprite
  'time cop': `${_S}/character_sprites/policeofficer.png`,   // 2026-10-24 — the cop look
  'jellyfish': `${_S}/character_sprites/jellyfish.png`,   // 2026-10-04 — his own sprite
  'cult leader': `${_S}/character_sprites/cultleader.png`,   // 2026-10-04 — his own sprite
  'popstar': `${_S}/Races/popstar/popstar_female.png`,   // 2026-09-22 — her own sheet (the VFX pass)
  'starfish': `${_S}/character_sprites/starfish.png`,   // 2026-10-04 — his own sprite
  'ringmaster': `${_S}/character_sprites/ringmaster.png`,   // 2026-10-04 — his own sprite
  'bee queen': `${_S}/character_sprites/beequeen.png`,   // 2026-10-04 — his own sprite
  'professor': `${_S}/character_sprites/professor.png`,   // 2026-10-04 — his own sprite
  'deep sea fish': `${_S}/character_sprites/deepseacreature.png`,   // 2026-10-04 — his own sprite
  'clown': `${_S}/character_sprites/clown.png`,   // 2026-10-04 — his own sprite
  'bunny girl': `${_S}/Races/bunnygirl/bunnygirl.png`,   // 2026-10-27 — her own sprite
  'sharkman': `${_S}/character_sprites/sharkman.png`,   // 2026-10-04 — his own sprite
  'crystal guardian': `${_S}/character_sprites/crystalguardian.png`,   // 2026-10-04 — his own sprite
  'jack o lantern': `${_S}/character_sprites/jackolantern.png`,   // 2026-10-04 — his own sprite
  'sidekick': `${_S}/character_sprites/sidekick.png`,   // 2026-10-04 — his own sprite
  'mushroom girl': `${_S}/character_sprites/mushroomgirl.png`,   // 2026-10-04 — his own sprite
  'tree person': `${_S}/Races/treeperson/treeperson.png`,   // 2026-10-25 — his new treeperson sprite
  'sheriff': `${_S}/character_sprites/sheriff.png`,   // 2026-10-04 — his own sprite
  'astronaut': `${_S}/character_sprites/astronaut.png`,   // 2026-10-04 — his own sprite
  'krampus': `${_S}/character_sprites/krampus.png`,   // 2026-10-04 — his own sprite
  'rabbit': `${_S}/character_sprites/rabbit.png`,   // 2026-10-04 — his own sprite
  'luchador': `${_S}/character_sprites/wrestler.png`,   // 2026-10-04 — his own sprite
  'firefighter': `${_S}/character_sprites/firefighter.png`,   // 2026-10-04 — his own sprite
  'goblin': `${_S}/character_sprites/gremlin.png`,   // 2026-10-04 — his own sprite
  'hippie': `${_S}/character_sprites/hippie_male.png`,   // 2026-10-04 — his own sprite
  'chef': `${_S}/Races/chef/male/chef.png`,   // 2026-10-25 — his own sprite
  'eagleman': `${_S}/Races/eagleman/eagleman.png`,   // 2026-10-25 — his own sprite
  'flesheater': `${_S}/Races/flesheater/flesheater.png`,   // 2026-10-25 — its own sprite
  'mime': `${_S}/Races/mime/mime_female.png`,   // 2026-10-25 — her own sprite
  'mummy': `${_S}/Races/mummy/mummy_female.png`,   // 2026-10-25 — his own sprite
  'swamp monster': `${_S}/Races/swampmonster/swampmonster.png`,   // 2026-10-25 — his own sprite
  'undead': `${_S}/Races/undead/undead.png`,   // 2026-10-25 — his own sprite
  'bligblog': `${_S}/Races/bligblog/bligblog.png`,   // 2026-10-27 — his own sprite
  'unicorn': `${_S}/Races/unicorn/unicorn.png`,   // 2026-10-27 — his own sprite
  'chess piece': CHESS_PIECE_LOOKS.pawn,   // 2026-10-29 — the pawn's glyph (no 2D art of the set)
  'wizard': `${_S}/homosapien.png`,
  'fortune teller': `${_S}/homosapien.png`,
  'martian': `${_S}/martian.png`,
  'mech': `${_S}/mech.png`,
  'nordic': `${_S}/nordic.png`,
  'orb of light': `${_S}/orb_of_light.png`,
  'reptilian': `${_S}/reptilian.png`,
  'robot': `${_S}/robot.png`,
  'seraphim': `${_S}/seraphim.png`,
  'shadow entity': `${_S}/Races/shadowentity/male/shadowperson.png`,   // 2026-10-25 — his new shadowperson sprite
  'skeleton': `${_S}/skeleton.png`,
  'skinwalker': `${_S}/skinwalker.png`,
  'succubus': `${_S}/succubus.png`,
  'zombie': `${_S}/zombie.png`,
  'werewolf': `${_S}/werewolf.png`,
  'gargoyle': `${_S}/gargoyle.png`,
  'djinn': `${_S}/djinn.png`,
  'anubis': `${_S}/Races/anubis/male/anubis_male.png`,
  'catgirl': `${_S}/Races/catgirl/female/catgirl_female.png`,
  'mantid': `${_S}/Races/mantid/male/mantid_male.png`,
  'antperson': `${_S}/Races/antperson/male/antperson_male.png`,

  'mothman': `${_S}/Races/mothman/male/mothman_male.png`,
  'siren': `${_S}/Races/siren/female/siren_female.png`,
  'scarecrow': `${_S}/Races/scarecrow/male/scarecrow_male.png`,
  'glitch': `${_S}/Races/glitch/male/glitch_male.png`,
  'machine elves': `${_S}/Races/machineelves/male/machineelves_male.png`,
  'cyclops': `${_S}/Races/cyclops/male/cyclops_male.png`,
  'cyborg': `${_S}/Races/cyborg/female/cyborg_female.png`,
  'demon prince': `${_S}/Races/demonprince/male/demonprince_male.png`,
  'demon princess': `${_S}/Races/demonprincess/female/demonprincess_female.png`,
  'dreameater': `${_S}/Races/dreameater/male/dreameater_male.png`,
  'fallen angel': `${_S}/Races/fallenangel/female/fallenangel_female.png`,
  'goatman': `${_S}/Races/goatman/male/goatman_male.png`,
  'halfdemon': `${_S}/Races/halfdemon/male/halfdemon_male.png`,
  'mermaid': `${_S}/Races/mermaid/female/mermaid_female.png`,
  'nephilim': `${_S}/Races/nephilim/male/nephilim_male.png`,
  'vampire': `${_S}/Races/vampire/female/vampire_female.png`,
  'voidweaver': `${_S}/Races/voidweaver/male/voidweaver_male.png`,
  'cosmic wraith': `${_S}/Races/cosmicwraith/male/cosmicwraith_male.png`,
  'superhero': `${_S}/Races/superhero/male/superhero_male.png`,

  'atlantean': `${_S}/Races/atlantean/female/atlantean_female.png`,
  'dinosaur': `${_S}/Races/dinosaur/male/dinosaur_male.png`,
  'dragon': `${_S}/Races/dragon/male/dragon_male.png`,
  'ghoul': `${_S}/Races/ghoul/male/ghoul_male.png`,
  'gnome': `${_S}/Races/gnome/male/gnome_male.png`,
  'kaiju': `${_S}/character_sprites/kaiju.png`,   // 2026-10-04 — his own sprite
  'kraken': `${_S}/Races/kraken/male/kraken_male.png`,
  'loch ness monster': `${_S}/Races/lochnessmonster/male/lochnessmonster_male.png`,
  'yeti': `${_S}/Races/yeti/male/yeti_male.png`,

  'barbarella': `${_S}/Races/barbarella/barbarella.png`,
  'black goo': `${_S}/Races/blackgoo/blackgoo.png`,
  'golem': `${_S}/Races/golem/golem.png`,
  'honda civic': `${_S}/Races/hondacivic/hondacivic.png`,
  'ice queen': `${_S}/character_sprites/icequeen.png`,   // 2026-10-04 — his own sprite
  'juggernaut': `${_S}/Races/juggernaut/juggernaut.png`,
  'ki fighter': `${_S}/Races/kifighter/female/kifighter_female.png`,
  'king arthur': `${_S}/Races/king/kingarthur.png`,
  'king kong': `${_S}/Races/kingkong/kingkong.png`,
  'minotaur': `${_S}/Races/minotaur/minotaur.png`,
  'necromancer': `${_S}/Races/necromancer/female/necromancer_female.png`,
  'occulus': `${_S}/Races/occulus/occulus.png`,
  'quarterback': `${_S}/Races/quarterback/quarterback.png`,
  'robinhood': `${_S}/Races/robinhood/robinhood.png`,
  'santa clause': `${_S}/Races/santaclause/santaclause.png`,
  'super sentai': `${_S}/Races/sentai/sentaired.png`,
  'symbiote': `${_S}/Races/symbiote/symbiote.png`,
  'valkraye': `${_S}/Races/valkraye/valkraye.png`,
  'watcher': `${_S}/Races/watcher/watcher.png`,

  'general': `${_S}/Races/maincharacters/generalvoss.png`,
  'droid': `${_S}/Races/maincharacters/aria.png`,
  'antihero': `${_S}/Races/maincharacters/epoch.png`,
  'conspiracy theorist': `${_S}/Races/maincharacters/harlanvox.png`,
  'overlord': `${_S}/Races/maincharacters/kael.png`,
  'chosen one': `${_S}/Races/maincharacters/morrigan.png`,
  'politician': `${_S}/Races/maincharacters/president.png`,
};

const EQUIP_SPRITES = {};

const RACE_HAND_GROUP = {
  'ai': null,
  'android': {
    left: `${_S}/android_hand_left.png`,
    right: `${_S}/android_hand_right.png`
  },
  'angel': {
    left: `${_S}/angel_hand_left.png`,
    right: `${_S}/angel_hand_right.png`
  },
  'annunaki': {
    left: `${_S}/annunaki_hand_left.png`,
    right: `${_S}/annunaki_hand_right.png`
  },
  'bigfoot': {
    left: `${_S}/bigfoot_hand_left.png`,
    right: `${_S}/bigfoot_hand_right.png`
  },
  'demon': {
    left: `${_S}/demon_hand_left.png`,
    right: `${_S}/demon_hand_right.png`
  },
  'fairy': {
    left: `${_S}/fairy_hand_left.png`,
    right: `${_S}/fairy_hand_right.png`
  },
  'ghost': null,
  'giant': null,
  'grey': {
    left: `${_S}/grey_hand_left.png`,
    right: `${_S}/grey_hand_right.png`
  },
  'homosapien': {
    left: `${_S}/homosapien_hand_left.png`,
    right: `${_S}/homosapien_hand_right.png`
  },
  'pirate': {
    left: `${_S}/homosapien_hand_left.png`,
    right: `${_S}/homosapien_hand_right.png`
  },
  'martian': {
    left: `${_S}/martian_hand_left.png`,
    right: `${_S}/martian_hand_right.png`
  },
  'mech': {
    left: `${_S}/mech_hand_left.png`,
    right: `${_S}/mech_hand_right.png`
  },
  'nordic': {
    left: `${_S}/nordic_hand_left.png`,
    right: `${_S}/nordic_hand_right.png`
  },
  'orb of light': null,
  'reptilian': {
    left: `${_S}/reptilian_hand_left.png`,
    right: `${_S}/reptilian_hand_right.png`
  },
  'robot': {
    left: `${_S}/robot_hand_left.png`,
    right: `${_S}/robot_hand_right.png`
  },
  'seraphim': {
    left: `${_S}/seraphim_hand_left.png`,
    right: `${_S}/seraphim_hand_right.png`
  },
  'shadow entity': null,
  'skeleton': {
    left: `${_S}/skeleton_hand_left.png`,
    right: `${_S}/skeleton_hand_right.png`
  },
  'skinwalker': {
    left: `${_S}/skinwalker_hand_left.png`,
    right: `${_S}/skinwalker_hand_right.png`
  },
  'succubus': {
    left: `${_S}/succubus_hand_left.png`,
    right: `${_S}/succubus_hand_right.png`
  },
  'zombie': {
    left: `${_S}/zombie_hand_left.png`,
    right: `${_S}/zombie_hand_right.png`
  },
  'werewolf': {
    left: `${_S}/werewolf_hand_left.png`,
    right: `${_S}/werewolf_hand_right.png`
  },
  'gargoyle': {
    left: `${_S}/gargoyle_hand_left.png`,
    right: `${_S}/gargoyle_hand_right.png`
  },
  'djinn': {
    left: `${_S}/djinn_hand_left.png`,
    right: `${_S}/djinn_hand_right.png`
  },

  'barbarella': null,
  'black goo': null,
  'golem': null,
  'honda civic': null,
  'ice queen': null,
  'juggernaut': null,
  'ki fighter': null,
  'king arthur': null,
  'king kong': null,
  'minotaur': null,
  'necromancer': null,
  'occulus': null,
  'quarterback': null,
  'robinhood': null,
  'santa clause': null,
  'super sentai': null,
  'symbiote': null,
  'valkraye': null,
  'watcher': null,
};

const RACE_WEAPON_ANCHORS = {
  'homosapien':      [10, 38, 50, 38],
  'pirate':          [10, 38, 50, 38],
  'nordic':          [10, 38, 50, 38],
  'annunaki':        [10, 38, 50, 38],
  'skinwalker':      [10, 38, 50, 38],
  'giant':           [8, 40, 52, 40],
  'bigfoot':         [8, 38, 52, 38],
  'angel':           [10, 38, 50, 38],
  'seraphim':        [10, 38, 50, 38],
  'demon':           [10, 36, 50, 36],
  'succubus':        [10, 38, 50, 38],
  'zombie':          [10, 38, 50, 38],
  'skeleton':        [10, 38, 50, 38],
  'reptilian':       [10, 38, 50, 38],
  'android':         [10, 38, 50, 38],
  'robot':           [10, 38, 50, 38],
  'mech':            [8, 38, 52, 38],
  'grey':            [14, 38, 46, 38],
  'martian':         [14, 38, 46, 38],
  'fairy':           [18, 38, 42, 38],
  'ai':              [14, 36, 46, 36],
  'ghost':           [12, 38, 48, 38],
  'shadow entity':   [12, 38, 48, 38],
  'orb of light':    [16, 36, 44, 36],
  'werewolf':        [10, 38, 50, 38],
  'gargoyle':        [8, 38, 52, 38],
  'djinn':           [12, 38, 48, 38],
};

const ICON_ATT_UP = `${_S}/icon_ATT_UP.png`;
const ICON_ATT_DOWN = `${_S}/icon_ATT_DOWN.png`;
const ICON_DEF_UP = `${_S}/icon_DEF_UP.png`;
const ICON_DEF_DOWN = `${_S}/icon_DEF_DOWN.png`;
const ICON_BLOOD_RAIN = `${_S}/icon_blood rain.png`;
const ICON_GOLD = `${_S}/icon_gold.png`;

const OBJ_INN = `${_S}/inn.png`;
const OBJ_SHOP = `${_S}/itemshop.png`;

const _T = 'https://cdn.entropywars.net/Assets/world/terrain';
const _O = `${_T}/objects`;

/* Inline SVG thumbnail for the lamp-post object (editor palette only — the real
   in-game render is the authored 3D street-lamp model). Kept inline so the
   editor needs no extra uploaded asset. */
const _LAMP_POST_ICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' +
    '<circle cx="32" cy="14" r="11" fill="rgba(255,214,130,0.30)"/>' +
    '<rect x="29" y="20" width="6" height="38" rx="2" fill="#2c303a"/>' +
    '<rect x="21" y="56" width="22" height="6" rx="2.5" fill="#1b1e24"/>' +
    '<path d="M25 20 H39 L36 12 H28 Z" fill="#3a404b"/>' +
    '<rect x="26.5" y="6" width="11" height="11" rx="2.5" fill="#ffe6a8" stroke="#b8893a" stroke-width="1.5"/>' +
    '<line x1="29" y1="8.5" x2="29" y2="14.5" stroke="#b8893a" stroke-width="0.8"/>' +
    '<line x1="35" y1="8.5" x2="35" y2="14.5" stroke="#b8893a" stroke-width="0.8"/>' +
    '</svg>'
);

/* Inline SVG thumbnail for the traffic-light object (editor palette only — the
   in-game render is the procedural 3D signal built by _buildTrafficLight3D in
   three-renderer.js: yellow pole + mast arm, lamps cycle between rounds). */
const _TRAFFIC_LIGHT_ICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' +
    '<rect x="14" y="56" width="24" height="6" rx="2.5" fill="#3a3e46"/>' +
    '<rect x="23" y="18" width="6" height="40" rx="2" fill="#8b9098"/>' +
    '<rect x="26" y="12" width="20" height="5" rx="2.5" fill="#8b9098"/>' +
    '<rect x="38" y="14" width="16" height="34" rx="4" fill="#e0af2e" stroke="#8a6a1c" stroke-width="1.5"/>' +
    '<circle cx="46" cy="22" r="4.2" fill="#ff3b30"/>' +
    '<circle cx="46" cy="31" r="4.2" fill="#ffcc00"/>' +
    '<circle cx="46" cy="40" r="4.2" fill="#34c759"/>' +
    '</svg>'
);

/* Emoji-on-SVG palette thumbnails for 3D-only spell props (editor palette
   only — the in-game render is the procedural 3D builder in three-renderer.js).
   Inline data URIs, so no extra asset upload is needed. */
const _emojiPropIcon = (emoji) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' +
    '<rect width="64" height="64" rx="10" fill="#2a2438"/>' +
    '<text x="32" y="45" font-size="34" text-anchor="middle">' + emoji + '</text></svg>'
);

const OBJECT_SPRITES = {
    church:       { url: `${_O}/church_1.png` },   // church_2.png retired 2026-11-03 (mondo: its shape doesn't work with the prism bands)
    shop:         { url: `${_O}/itemshop.png` },
    tree:         { url: `${_O}/tree.png` },
    ruins:        { url: `${_O}/ruins.png` },
    nexus:        { url: `${_O}/nexus.png` },
    nexus_cave:   { url: `${_O}/nexus.png` },
    nexus_sky:    { url: `${_O}/nexus.png` },
    mountain_top: { url: `${_O}/mountain_top.png` },
    beanstalk:    { url: `${_O}/object_beanstalk.png` },
    well:         { url: `${_O}/object_well.png` },
    cave_entrance:{ url: `${_O}/object_caveentrance .png` },
    barrier_1:    { url: `${_O}/barrier_1.png`, width: 128, height: 32 },
    barrier_2:    { url: `${_O}/barrier_2.png`, width: 128, height: 32 },
    barrier_3:    { url: `${_O}/barrier_3.png`, width: 128, height: 32 },
    barrier_4:    { url: `${_O}/barrier_4.png`, width: 128, height: 32 },
    barrier_5:    { url: `${_O}/barrier_5.png`, width: 128, height: 32 },
    column_1:     { url: `${_O}/column_1.png` },
    column_2:     { url: `${_O}/column_2.png` },
    column_3:     { url: `${_O}/column_3.png` },
    column_4:     { url: `${_O}/column_4.png` },
    building_1:   { url: `${_O}/building_1.png` },
    building_2:   { url: `${_O}/building_2.png` },
    building_3:   { url: `${_O}/building_3.png` },
    building_4:   { url: `${_O}/building_4.png` },
    building_5:   { url: `${_O}/building_5.png` },
    building_6:   { url: `${_O}/building_6.png` },
    building_7:   { url: `${_O}/building_7.png` },
    building_8:   { url: `${_O}/building_8.png` },
    building_9:   { url: `${_O}/building_9.png` },
    building_10:  { url: `${_O}/building_10.png` },
    building_11:  { url: `${_O}/building_1.png` },   // RETIRED 2026-11-03 (mondo: "dont use the church_2 or building 11 anywhere in the game"): a placed one draws as building_1
    ancient_building: { url: `${_O}/ancient_building.png` },
    abandoned_building_1: { url: `${_O}/abandoned_building_1.png` },
    abandoned_building_2: { url: `${_O}/abandoned_building_2.png` },
    stairs:       { url: `${_O}/stairs.png` },
    stairs_2:     { url: `${_T}/barrier_passage.png` },
    /* Lamp posts render in-game as the authored 3D street-lamp model
       (Assets/world/props/meshy/streetlamp/Street Lamp.obj) — see _buildLampPostObj in
       three-renderer.js. These url icons are only the editor palette thumbnails
       (inline SVG, so no extra asset upload is needed). */
    lamp_post:    { url: _LAMP_POST_ICON, model3d: true },
    lamp_post_2:  { url: _LAMP_POST_ICON, model3d: true },
    /* Cosmetic traffic light — rendered in-game as a procedural 3D signal by
       _buildTrafficLight3D (three-renderer.js); its red/yellow/green lamps
       cycle between rounds. The url is only the editor palette thumbnail. */
    traffic_light:{ url: _TRAFFIC_LIGHT_ICON, model3d: true },
    pathway_1:    { url: `${_O}/pathway_1.png` },
    pathway_2:    { url: `${_O}/pathway_2.png` },
    church_1:     { url: `${_O}/church_1.png` },
    church_2:     { url: `${_O}/church_1.png` },   // RETIRED 2026-11-03 (as building_11): a placed one draws as church_1
    poison_seed:  { url: `${_S}/poison_seed.png` },
    tree_2:       { url: `${_O}/tree_2.png` },
    tree_3:       { url: `${_O}/tree_3.png` },
    tree_4:       { url: `${_O}/tree_4.png` },
    tree_5:       { url: `${_O}/tree_5.png` },
    tree_6:       { url: `${_O}/tree_6.png` },
    /* THE RETRO TREE PACK (2026-10-04): the pack's own card art (its Low Res folder) is the palette / 2D picture */
    tree_pine:    { url: 'https://cdn.entropywars.net/Assets/world/nature/retrotreepack/Low%20Res/tree_rt_1.png' },
    tree_sapling: { url: 'https://cdn.entropywars.net/Assets/world/nature/retrotreepack/Low%20Res/small_tree_rt_1.png' },
    tower_cube: { url: 'https://cdn.entropywars.net/Assets/loose_sprites/dragon-green.png' },
    /* Cosmetic grass tuft — rendered in-game as 3D billboard blades by
       _buildGrassTuft3D (three-renderer.js). The url is only the editor palette
       thumbnail; we reuse the grass_2 terrain sprite the blades are textured with. */
    grass_tuft:   { url: `${_T}/grass_2.png`, model3d: true },
    /* Cosmetic rock/boulder — rendered in-game as a 3D textured boulder by
       _buildRock3D (three-renderer.js). Per-placement texture variant
       (rocks_1..rocks_5) authored in the editor, like leaves for trees. The url
       is only the editor palette thumbnail (defaults to the rocks_1 sprite). */
    rock:         { url: `${_T}/rocks_1.png`, model3d: true },
    /* Cosmetic torch — rendered in-game as a real 3D wood-and-rope torch with a
       live flame + flickering point light by _buildTorch3D (three-renderer.js).
       The url is only the editor palette thumbnail (the legacy flat torch
       sprite). The mount variant lives in the object entry's generic texture
       slot (entry.leaf): 'floor' stands on the tile top, 'wall' hangs off the
       side of the neighbouring tile the entry's rot points at, Minecraft-style. */
    torch:        { url: `${_S}/torch.png`, model3d: true },
    /* 2026-07-08 — spell-prop 3D models exposed as placeable editor objects.
       In-game renders are the SAME procedural builders the spells use
       (three-renderer.js: _buildGravestone3D, _buildBonePile3D, _buildBoneWall3D,
       _buildAtlantisPillar3D, _buildTotemPole3D, _buildFederationBeacon3D).
       The urls are editor palette thumbnails only. */
    gravestone:        { url: _emojiPropIcon('🪦'), model3d: true },
    bone_pile:         { url: _emojiPropIcon('💀'), model3d: true },
    bone_wall:         { url: _emojiPropIcon('🦴'), model3d: true },
    atlantis_pillar:   { url: _emojiPropIcon('🏛️'), model3d: true },
    totem_pole:        { url: _emojiPropIcon('🪶'), model3d: true },
    federation_beacon: { url: _emojiPropIcon('🗼'), model3d: true },
};

/* 2026-09-04 — D.O.O.R. facility floors (Holo Sim, DOOR_HQ_BUILD_PLAN 6.1b):
   128×128 pixel-art tiles embedded as data URIs so there is nothing to
   upload to R2 and nothing to cache-bust. A BLACK plate with a bright cyan
   rim (three-renderer _EMISSIVE_TERRAIN lights the rim; the plate stays
   dark) and a red twin with a warning triangle for the holo_red cells.
   rev 2 (same day): the plate was a dark navy (8,16,34) that the emissive
   pass + bloom lifted into a solid blue floor, which drowned the move /
   attack / danger highlights — the fill is near-black now (2,2,3, inner
   lines 7,8,11) so only the rim glows and every overlay reads.
   Regenerate with a 128² RGBA PNG of the same design if the look changes. */
/* ── The Training Room floor (2026-09-04, DOOR_HQ_BUILD_PLAN 6.1b rev 3) ──
   `training_floor`: one warm plaster-concrete SLAB per tile, drawn at load
   into a 256² canvas (seeded, so every client draws the same pixels) — the
   reference render's big flat cracked-plaster squares with a dark grout rim,
   not the cobbled concrete_floor.png. Mottled low-frequency stains, fine
   grain, a grout rim with an inner bevel highlight and a faint vignette so
   each tile reads as a separate slab even before the lit seams land on the
   grid. Cracks are NOT baked in (a crack repeated on 64 tiles is a pattern):
   the room's scorch stars and crack decals are three-renderer scenery. Node /
   no-DOM falls back to the concrete sprite (only the browser renders it). */
function _mkTrainingSlabURI() {
    if (typeof document === 'undefined') return null;
    try {
        var S = 256, c = document.createElement('canvas'); c.width = c.height = S;
        var g = c.getContext('2d');
        var seed = 0x7A11;
        function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
        g.fillStyle = '#bca98a'; g.fillRect(0, 0, S, S);
        /* low-frequency mottling: soft light + dark stains */
        for (var i = 0; i < 110; i++) {
            var x = rnd() * S, y = rnd() * S, r = 14 + rnd() * 64, dark = rnd() < 0.55;
            var gr = g.createRadialGradient(x, y, 0, x, y, r), a = (0.04 + rnd() * 0.09).toFixed(3);
            gr.addColorStop(0, dark ? 'rgba(84,64,46,' + a + ')' : 'rgba(238,226,200,' + a + ')');
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        }
        /* a few broad damp patches, elongated */
        for (var j = 0; j < 6; j++) {
            g.save(); g.translate(rnd() * S, rnd() * S); g.rotate(rnd() * Math.PI); g.scale(1, 0.35 + rnd() * 0.5);
            var rr = 30 + rnd() * 50, gp = g.createRadialGradient(0, 0, 0, 0, 0, rr);
            gp.addColorStop(0, 'rgba(60,50,40,0.12)'); gp.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = gp; g.beginPath(); g.arc(0, 0, rr, 0, Math.PI * 2); g.fill(); g.restore();
        }
        /* fine grain */
        var id = g.getImageData(0, 0, S, S), d = id.data;
        for (var p = 0; p < d.length; p += 4) { var n = (rnd() - 0.5) * 20; d[p] += n; d[p + 1] += n; d[p + 2] += n * 0.85; }
        g.putImageData(id, 0, 0);
        /* pale scuffs */
        g.lineCap = 'round';
        for (var k = 0; k < 8; k++) {
            var sx = rnd() * S, sy = rnd() * S, an = rnd() * Math.PI * 2, ln = 6 + rnd() * 26;
            g.strokeStyle = 'rgba(236,226,204,' + (0.10 + rnd() * 0.14).toFixed(2) + ')'; g.lineWidth = 0.8 + rnd() * 1.2;
            g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(an) * ln, sy + Math.sin(an) * ln); g.stroke();
        }
        /* the slab edge: grout rim, a bevel highlight top-left, a shadow bottom-right */
        var vg = g.createRadialGradient(S / 2, S / 2, S * 0.22, S / 2, S / 2, S * 0.74);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(34,27,20,0.20)');
        g.fillStyle = vg; g.fillRect(0, 0, S, S);
        g.fillStyle = 'rgba(38,32,27,0.80)';
        g.fillRect(0, 0, S, 3); g.fillRect(0, S - 3, S, 3); g.fillRect(0, 0, 3, S); g.fillRect(S - 3, 0, 3, S);
        g.fillStyle = 'rgba(92,82,68,0.55)';
        g.fillRect(3, 3, S - 6, 1); g.fillRect(3, S - 4, S - 6, 1); g.fillRect(3, 3, 1, S - 6); g.fillRect(S - 4, 3, 1, S - 6);
        g.fillStyle = 'rgba(240,230,206,0.30)'; g.fillRect(4, 4, S - 8, 1); g.fillRect(4, 4, 1, S - 8);
        g.fillStyle = 'rgba(30,25,20,0.26)'; g.fillRect(4, S - 5, S - 8, 1); g.fillRect(S - 5, 4, 1, S - 8);
        return c.toDataURL('image/png');
    } catch (e) { return null; }
}
const TRAINING_SLAB_URI = _mkTrainingSlabURI();

const HOLO_TILE_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABjUlEQVR42u3auw2EMBRFQcsEIFEBDVETldAkRZiAFPGJkLgTvGxP4jcLEnKZt9ZM7hSHAICDAOCYaVlNwAAAwDWAfhjNDwcAAN4BqLW7nae/03/XAwAAAAAAAAAAAAAAAAAAAAAAAAD4EuhLoCeAJwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOEAAHCAADhAACwDAAtwHMO4D+Ad6BVgAABYAgAUAYAEAWAAAFgCABQBgAQBYAAAWAIAFAGABAFgAABbgPoBxH0DvFaAHQA+AHgA9AHoA9ADoAdADoAdAD4AeAD0AegD07gMY9wH0XgF6APQA6AHQA6AHQA+AHgA9AHoA9ADoAdADoAdA7z6AcR9A7xWgB0APgB4APQB6APQA6AHQA6AHQA+AHgA9AAAAAID7AO4DeAJ4AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGPcB/IO8AhwgAA4QAAsAwAIAsAAALAAAC/AhyIR8CDKhAMy/BwAAzgGYvAEAAIeQPDuIkxzLSqDdLAAAAABJRU5ErkJggg==';
const HOLO_RED_TILE_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAC40lEQVR42u3cMW7cMBAFUJcpjFSpfQADuUOq1D5Y7rxB4MZAtFquRGpmyFdMp++CfJS8Eocvt18fN7VuvRgEAAwEAJ/15+2nWqAAAGAfwPvrDzVhAQDAcwDevn1/WK3XycflAQAAAAAAAAAAAAAAAAAAAAAAAAC8CfQm0B3AHQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADCAABhAAAwiACQDABNgPoOwHsAI9AiYZwNvvj/8KAAAAWAHA1uQfRQAAAABUArA3+UcQAFAcwL88AIsA2FrtWwCeQQBAYQBf8wBMDuDeKr8HoBUBAEUBbOUBmBTA3ureA9CCAICCAPbyAEwG4NGqfgTgEQIAigFoyQMwyffve7/7R+XsB0i2AlpW8r18613AIyDpALQ+y0flAUgG4Oo7CACBA9CyentdA0ABAGdu8QAUA3B0Yo9eB0ByAD32BAJQBMCZST16LQCJAfTcFQxAcgBnJ/To9QAkBTCiLwCApAB6TObRDAAJAYzsDAIgGYBeEzk6B8BFAK7oDVwGwKzf+yOz9gN0zJ9ZiWdv5b3uAh4BQe3d0XkAOgOIOB8AgETt3VX/BgAdAESeEAJAgv7+TAAytpdPDSDDGUEABPf3ZwOQrb18WgCZTgkDILi/PxuATO3lUwKoviMJgAH9/ZX2JAIwqL+/yq5kAAb191fpSwBgYH9/hc4k+wGCv7tX/dtL7QcY2Z07+nNupvMFSgIY3Z9/NYDI9vIpAGTbUFLpfIFyAJ6ZnEoAov6JLQ8g45aySr9iSgG46nd0FICI9xilAWTdVFrpTWYZAFe+S48EcPW3jLIAZjmrOPprZgkAM5/XH32+QFkAsxcADf8DzDz5AAAAgEcAAPL2Ayj7AeQ9AuQBkAdAHgB5AOQBkAdAHgB5AOQBkAdAHgB5AOQBkLcfQNkPIO8RIA+APADyAMgDIA+APADyXgSpfi+C1KIA1NwFAADbANR6BQAABmHl+gu4GMAWRTQqBAAAAABJRU5ErkJggg==';

const TERRAIN_SPRITES = {
    grass:          [`${_T}/grass.png`],
    water:          [`${_T}/water.png`],
    deep_water:     [`${_T}/deep_water.png`],
    bridge:         [`${_T}/bridge.png`],
    mountain:       [`${_T}/mountain.png`],
    /* THE TWO SANDS (2026-11-03, mondo picked "A" off the sand options sheet, then: "you need to differentiate between beach
       sand and desert sand in the game through color/tint"): `desert` = terrain/sand.png = ambientCG Ground097 (CC0, dune
       ripples) baked at 128 px in the desert's warm gold. The beach wears the SAME ripples in pale cream (SAND_BEACH below):
       one terrain key, one set of rules, two colours by place. desert.png stays in the bucket, unreferenced. */
    desert:         [`${_T}/sand.png`],
    tree:           [`${_T}/forest.png`],
    dirt:           [`${_T}/dirt.png`],
    lava:           [`${_T}/lava.png`],
    scorched:       [`${_T}/scorched.png`],
    /* 🧪 THE LIQUIDS (2026-10-26, mondo: "use these to differentiate between the different liquids ... keep water and lava as
       is"): every liquid that isn't water or lava wears its own sheet from R2 Assets/world/terrain/liquids/ (his 48-sheet
       upload, LIQUID_SHEETS below) in place of the tinted water / purple grass it borrowed. The 3D fluid tops read the same
       sheet (three-renderer.js _LIQUID_STYLES). poison = the toxic green, poison_bog = the olive bog, purple_bog = the
       purple, swamp (Black Ooze) = the dark slate goo, oil = the brown swirls (both darkened in 3D), blood = the deep red. */
    poison:         [`${_T}/liquids/Liquid_Green_02-128x128.png`],
    cave_floor:     [`${_T}/cave_floor.png`],
    cave_wall:      [`${_T}/cave_wall.png`],
    cloud:          [`${_T}/cloud.png`],
    /* THE THICK CLOUD (2026-11-03, mondo: "yes i want the cloud thick gone too"): its own sheet was a grey storm cloud with
       white lightning forks painted in. It wears the painted puffy cloud sheet now (cloud_2's), so the cloud seas, the
       Heaven mounds and Saturn's deck read as cloud, never as bolts; each map's own `tints.cloud_thick` still colours it. */
    cloud_thick:    [`${_T}/cloud_2.png`],
    cloud_gap:      [`${_T}/cloud_gap.png`],
    /* THE STORM ZONE (2026-11-03, mondo: "replace this weird looking cloud with a lightning bolt"): 'storm' never had a
       sheet of its own, so it fell back to the legacy SVG doodle (a dark smudge + one yellow bolt) — on an opaque wall
       or tile that read as a black blob stamped with bolts (Saturn's storm walls). It wears the grey pixel-painted
       cloud sheet (fog.png, no bolts), cooled to a thunderhead slate by TERRAIN_BASE_TINT.storm (a map's own
       `tints.storm` still modulates it). */
    storm:          [`${_T}/fog.png`],
    sky_ruin:       [`${_T}/sky_ruin.png`],
    barrier_passage:[`${_T}/barrier_passage.png`],
    /* 2026-10-07 (mondo): "rampart has the cliff texture. I want that texture removed from everywhere in the game." The
       `cliff` key wears the land rule's cliff sheet (rocks_5) now; cliff.png stays in the bucket, unreferenced. */
    cliff:          [`${_T}/rocks_5.png`],
    chasm:          [`${_T}/chasm.png`],
    void:           [`${_T}/void.png`],
    road:           [`${_T}/road.png`],
    ruins:          [`${_T}/ruins.png`],
    /* 2026-11-02 (mondo): "replace all crystal.png terrain in the game with liquid_blue_1 or liquid_blue_5, but not as
       liquids with a noise layer, just as solid textures". The Crystal Formation wears Liquid_Blue_05 (the periwinkle
       glassy sheet) as a plain solid tile: crystal is not in _LIQUID_STYLES, so no flow / waves / caustics. Every prop
       that reads the `crystal` key (_hzTex / K.mat: the shard clusters, the toadstool, the armillary core, the editor
       swatches) follows this row. crystal.png stays in the bucket, unreferenced. Rules untouched.
       THE CRISP CRYSTAL SHEET (2026-11-05, mondo: "why the blue liquid texture ... is so blurry. All pixel sprite 128x128
       terrain tiles are supposed to have the same pixel density"): the liquid sheet is 128 px like the rest but a smooth
       painting (6,314 colours; the pixel tiles have 24), so it read as a smear beside them. crystal_blue.png is the SAME
       sheet baked by bake-pixel-sheet.py (wrap-safe sharpen + 24-colour palette, no dither): same picture, crisp texels.
       The liquid sheet itself is untouched (the liquids still wear it). */
    crystal:        [`${_T}/crystal_blue.png`],
    obsidian:       [`${_T}/obsidian.png`],
    stone:          [`${_T}/rocks_5.png`],   // 🪨 water + lava (map.js lavaWaterMixOf): the cliffs' rock sheet
    healing_spring: [`${_T}/healing_spring.png`],
    fog_wall:       [`${_T}/fog.png`],
    nexus:          [`${_T}/nexus.png`],
    nexus_cave:     [`${_T}/nexus.png`],
    nexus_sky:      [`${_T}/nexus.png`],
    rock:           [`${_T}/rock.png`],
    mushroom:       [`${_T}/rock.png`],
    sanctuary:        [`${_T}/sanctuary.png`],
    sanctuary_church: [`${_T}/sanctuary.png`],
    sanctuary_shop:   [`${_T}/sanctuary.png`],
    purple_grass:     [`${_T}/purple_grass.png`],
    grass_2:          [`${_T}/grass_2.png`],
    wasteland:        [`${_T}/wasteland.png`],
    mountain_top:     [`${_T}/mountain.png`],
    forest_2:         [`${_T}/forest_2.png`],
    mountain_2:       [`${_T}/mountain_2.png`],

    forest:           [`${_T}/forest.png`],
    ice:              [`${_T}/ice.png`],
    bricks_1:         [`${_T}/bricks_1.png`],
    bricks_2:         [`${_T}/bricks_2.png`],
    bricks_3:         [`${_T}/bricks_3.png`],
    // Castle Fortress (knight spell) — impassable-height wall wearing the
    // brick texture instead of raw mountain rock.
    castle_wall:      [`${_T}/bricks_2.png`],
    snow_wall:        [`${_T}/ice.png`],   // THE SPELL AUDIT Batch D: Snow Fort reuses the ice texture
    wood_planks:      [`${_T}/wood_planks.png`],
    wood:             [`${_T}/wood.png`],
    rubble_1:         [`${_T}/rubble_1.png`],
    rubble_2:         [`${_T}/rubble_2.png`],
    rubble_3:         [`${_T}/rubble_3.png`],
    rubble_4:         [`${_T}/rubble_4.png`],
    poison_bog:       [`${_T}/liquids/Liquid_Green_08-128x128.png`],
    rocks_1:          [`${_T}/rocks_1.png`],
    rocks_2:          [`${_T}/rocks_2.png`],
    rocks_3:          [`${_T}/rocks_3.png`],
    rocks_4:          [`${_T}/rocks_4.png`],
    rocks_5:          [`${_T}/rocks_5.png`],
    rock_wall_1:      [`${_T}/rock_wall_1.png`],
    /* 2026-09-21 (the user): rock_wall_2.png has grass along its top edge, so it read wrong on every cliff
       it dressed (the cavern, Hell); every rock_wall_2 key wears the cave's own rock now. The file stays in the
       bucket, unreferenced. */
    rock_wall_2:      [`${_T}/cave_wall.png`],
    dark_woods:       [`${_T}/dark_woods.png`],
    urban_wall:       [`${_T}/urban_wall.png`],
    grass_rocky:      [`${_T}/grass_rocky.png`],
    purple_bog:       [`${_T}/liquids/Liquid_Purple_07-128x128.png`],
    /* Black liquid family (2026-07-14): 'swamp' = Ooze Trail's toxic slick, 'oil' = oil slick. Since 2026-10-26 (THE
       LIQUIDS, above) each wears its own liquid sheet; the 3D fluid top darkens both (three-renderer.js _LIQUID_STYLES). */
    /* spell look fix FX-3 (2026-10-26): Black Ooze wears the glossy purple swirl sheet darkened to black-violet (the dark
       slate Blue_06 read as stone slabs where Goo Shot / Splash's goo spreads) */
    swamp:            [`${_T}/liquids/Liquid_Purple_01-128x128.png`],
    oil:              [`${_T}/liquids/Liquid_Brown_02-128x128.png`],
    blood:            [`${_T}/liquids/Liquid_Red_05-128x128.png`],   // 🩸 the Blood Pool (2026-10-21; its own red sheet since 2026-10-26)
    /* THE STREET (2026-09-16): the old urban_street.png carried lane markings
       running one way, so every street laid across it (and every tile beside
       another) read as chaos. Streets wear the concrete sheet now, darkened
       to asphalt by TERRAIN_BASE_TINT (below) — direction-free, one look for
       every road in the game. The old file stays in the bucket, unreferenced. */
    urban_street:     [`${_T}/concrete_floor.png?v=20260915`],

    // New terrain sprites (Moon / Backrooms / Heaven map set)
    moon:             [`${_T}/moon.png`],
    carpet:           [`${_T}/carpet.png`],
    /* THE GOLD (2026-09-21 — the user: "I don't like any of the three gold textures in the bucket; make your own or
       tint one of the other textures"): every gold key is the brushed aluminium sheet tinted gold by
       TERRAIN_BASE_TINT (below) — one brushed gilt for boards, monuments, trims and spell props alike. The three
       gold_*.png files stay in the bucket, unreferenced.
       THE GILT (2026-11-03, mondo picked "Option D, metal007"): every gold key is now terrain/gilt.png = ambientCG Metal007
       (CC0) regraded to gold at 128 px; TERRAIN_BASE_TINT keeps the three keys' warmths, lighter. */
    gold:             [`${_T}/gilt.png`],
    metal:            [`${_T}/metal.png`],
    leaves:           [`${_T}/leaves.png`],
    wallpaper:        [`${_T}/wallpaper.png`],
    cloud_2:          [`${_T}/cloud_2.png`],

    // New terrain sprites (2026-06 R2 batch — variants + masonry)
    moon_2:           [`${_T}/moon_2.png`],
    moon_3:           [`${_T}/moon_3.png`],
    carpet_2:         [`${_T}/carpet_2.png`],
    carpet_3:         [`${_T}/carpet_3.png`],
    carpet_4:         [`${_T}/carpet_4.png`],
    gold_2:           [`${_T}/gilt.png`],
    gold_3:           [`${_T}/gilt.png`],
    /* THE METALS (2026-09-21 — the user: "don't use metal_3, metal_2 or gunmetal_2 anywhere, including the delta
       maps"): the three keys stay (boards, rooms and the editor's palette name them) but wear the plain sheets —
       metal_2 / gunmetal_2 the gunmetal plate, metal_3 the brushed aluminium darkened to steel by TERRAIN_BASE_TINT. */
    metal_2:          [`${_T}/gunmetal.png`],
    grass_3:          [`${_T}/grass_3.png`],
    grass_4:          [`${_T}/grass_4.png`],
    dirt_2:           [`${_T}/dirt_2.png`],
    dirt_3:           [`${_T}/dirt_3.png`],
    dirt_4:           [`${_T}/dirt_4.png`],
    /* 2026-09-01 map redesign: marble.png / marble_2.png looked muddy on the
       board, so EVERY marble key now wears the pale polished marble_light.png
       (saved custom/community maps and spell props included). The old files
       stay in the bucket but nothing references them. */
    marble:           [`${_T}/marble_light.png`],
    marble_2:         [`${_T}/marble_light.png`],
    marble_light:     [`${_T}/marble_light.png`],
    cobblestone:      [`${_T}/cobblestone.png`],
    cobblestone_2:    [`${_T}/cobblestone_2.png`],
    leaves_2:         [`${_T}/leaves_2.png`],
    leaves_3:         [`${_T}/leaves_3.png`],
    leaves_4:         [`${_T}/leaves_4.png`],
    leaves_5:         [`${_T}/leaves_5.png`],

    // New terrain sprites (aluminium + checkerboard floor)
    aluminium:        [`${_T}/aluminium.png`],
    checkerboard:     [`${_T}/checkerboard.png`],

    // New terrain sprites (2026-06 R2 batch — dungeon / flesh / drywall + metal_3)
    dungeon:          [`${_T}/dungeon.png`],
    dungeon_2:        [`${_T}/dungeon_2.png`],
    dungeon_3:        [`${_T}/dungeon_3.png`],
    dungeon_4:        [`${_T}/dungeon_4.png`],
    flesh:            [`${_T}/flesh.png`],
    flesh_2:          [`${_T}/flesh_2.png`],
    flesh_3:          [`${_T}/flesh_3.png`],
    plague_flesh:     [`${_T}/flesh_2.png`],   // necromancer Plaguefield — spell-made pestilent meat
    drywall:          [`${_T}/drywall.png`],
    drywall_2:        [`${_T}/drywall_2.png`],
    drywall_3:        [`${_T}/drywall_3.png`],
    drywall_4:        [`${_T}/drywall_4.png`],
    metal_3:          [`${_T}/aluminium.png`],

    // 2026-07-08 full R2 terrain-folder registration — texture-only keys (not
    // placeable terrains) so _hzTex()/prop builders can wear any of them.
    // Textures are lazy-loaded on first use, so unused keys cost nothing.
    leather:          [`${_T}/leather.png`],
    leather_2:        [`${_T}/leather_2.png`],
    enamel_2:         [`${_T}/enamel_2.png`],
    mars:             [`${_T}/mars.png`],
    mars_2:           [`${_T}/mars_2.png`],
    fur:              [`${_T}/fur.png`],
    fur_2:            [`${_T}/fur_2.png`],
    fur_3:            [`${_T}/fur_3.png`],
    skin:             [`${_T}/skin.png`],
    rubber:           [`${_T}/rubber.png`],
    rubber_2:         [`${_T}/rubber_2.png`],
    damask:           [`${_T}/damask.png`],
    damask_2:         [`${_T}/damask_2.png`],
    damask_3:         [`${_T}/damask_3.png`],
    damask_4:         [`${_T}/damask_4.png`],
    floral:           [`${_T}/floral.png`],
    floral_2:         [`${_T}/floral_2.png`],
    diamond:          [`${_T}/diamond.png`],
    brokenglass:      [`${_T}/brokenglass.png`],
    gunmetal:         [`${_T}/gunmetal.png`],
    gunmetal_2:       [`${_T}/gunmetal.png`],
    copper:           [`${_T}/copper.png`],
    concrete_floor:   [`${_T}/concrete_floor.png?v=20260915`],   // repainted 2026-09-15 — the ?v busts the immutable edge cache (bump it again on the next repaint)
    checkerboard_2:   [`${_T}/checkerboard_2.png`],
    checkerboard_3:   [`${_T}/checkerboard_3.png`],
    drywall_5:        [`${_T}/drywall_5.png`],
    dirt_slope:       [`${_T}/dirt_slope.png`],
    grass_dark_fantasy: [`${_T}/grass_dark_fantasy.png`],
    rocks_dark_fantasy: [`${_T}/rocks_dark_fantasy.png`],
    ice_1:            [`${_T}/ice_1.png`],
    igloo:            [`${_T}/igloo.png`],
    latticegarden:    [`${_T}/latticegarden.png`],
    noise:            [`${_T}/noise.png`],
    tigerfur:         [`${_T}/tigerfur.png`],
    tigerfur_2:       [`${_T}/tigerfur_2.png`],
    tilefloor:        [`${_T}/tilefloor.png`],
    tilefloor_2:      [`${_T}/tilefloor_2.png`],
    // D.O.O.R. facility floors (2026-09-04) — embedded, see HOLO_TILE_URI above
    holo:             [HOLO_TILE_URI],
    holo_red:         [HOLO_RED_TILE_URI],
    training_floor:   [TRAINING_SLAB_URI || `${_T}/concrete_floor.png?v=20260915`],   // canvas-drawn plaster slab (TRAINING_SLAB_URI above)
};

/* THE BASE TINT (2026-09-16): keys whose sheet is borrowed from another key
   and darkened — multiplied onto every material that wears the key (board
   tiles, the near kit's K.mat, the HQ's _hqMat) BEFORE any map tint, so a Δ's
   own `tints` row still modulates it. urban_street = the concrete sheet as
   asphalt. Add a key here + point its TERRAIN_SPRITES row at the sheet. */
/* THE BEACH SAND (2026-11-03): where the `desert` key is a BEACH, the renderer (three-renderer.js _ewSandBeach) draws it with
   `sheet` (the desert's own Ground097 ripples in pale cream) in place of the desert-gold terrain/sand.png. A beach is:
   a battle board whose id starts with one of `maps`, or a room built on a sea / sea-floor shell (data.js hqSeaShell /
   hqAbyssShell carry `sand: 'beach'`). Look only: the tile is still `desert` for every rule. Add a board here to make it a beach. */
const SAND_BEACH = {
    sheet: `${_T}/sand_beach.png`,
    maps: ['prebuilt_bermuda', 'site_prebuilt_bermuda', 'site_prebuilt_atlantis_abyss', 'site_prebuilt_downtown_harbour'],
};
const TERRAIN_BASE_TINT = {
    urban_street: '#4e4e56',
    /* THE GOLD (2026-09-21; the gilt sheet since 2026-11-03): three warmths for the three keys (gold = the sheet as drawn) */
    gold_2: '#ecd8b0',
    gold_3: '#dcc090',
    /* THE METALS (2026-09-21): metal_3 = the aluminium sheet as blued steel */
    metal_3: '#8a949e',
    /* 🧪 THE LIQUIDS (2026-10-26): Black Ooze = the dark slate liquid sheet, the oil slick = the brown swirl sheet, both
       darkened toward black (their 3D fluid tops, room floors and drapes alike) */
    swamp: '#3c3c3c',
    oil: '#7a7a7a',
    /* ⛈ THE STORM ZONE (2026-11-03): the grey cloud sheet as a thunderhead — slate, a touch of blue */
    storm: '#a4b0cc',
};
if (typeof window !== 'undefined') window.TERRAIN_BASE_TINT = TERRAIN_BASE_TINT;
if (typeof window !== 'undefined') window.SAND_BEACH = SAND_BEACH;
/* THE WHITE SHEETS (2026-11-03, mondo on the Heaven Arena: "something about these clouds is just really hard on the eyes, i cant
   see what im looking at ... any map or area that has a lot of white still looks super bright", bloom off). The cause: a lit
   surface is texture × light, and daylight puts about 1.35× (a room's open sky) to 1.5× (a battle's day) on a floor, drawn into
   a frame that stops at 100%. A sheet that is already ~90% white goes past 100% everywhere, so its whole pattern (the marble's
   veins, the cloud's shading, the marks on top of it) is stored as the same flat white BEFORE Filmic Tone or Brightness ever
   see it. The fix he picked: the near-white sheets (mean brightness 0.8 and up, measured off the R2 files) are darkened ONCE as
   they load, each to a mean of ~0.66, so daylight lands them just under 100% and the pattern survives. Keyed by the FILE, so
   every key, map, room, wall and prop that wears the sheet gets it (three-renderer.js textureLoader.load, _ewWhiteGuard).
   The value multiplies the sheet's pixels (1 = untouched). The light is not changed. */
const TERRAIN_WHITE_SHEETS = {
    'cloud.png': 0.68, 'cloud_2.png': 0.71,
    'ice.png': 0.73, 'ice_1.png': 0.73,
    'tilefloor.png': 0.73, 'tilefloor_2.png': 0.73,
    'marble_light.png': 0.75,
    'enamel_2.png': 0.79, 'wallpaper.png': 0.80, 'floral_2.png': 0.81,
};
if (typeof window !== 'undefined') window.TERRAIN_WHITE_SHEETS = TERRAIN_WHITE_SHEETS;

/* ═══════════════════════════════════════════════════════════════════════
   THE URBAN PACK (2026-09-17) — 320 tileables the user painted at the game's
   pixel density (128 px = one battle tile, 1.75 m), on R2 at
   Assets/world/terrain/urban/<Name>.png (the repo keeps them in textures/
   + the root). Concrete, plaster and stucco walls (a base band on the `2x`
   plasters, a cornice on the stuccos), painted corrugated metal (a concrete
   plinth in every tile — one tile = one storey's foot), glass curtain walls
   (Square / Tall / Factory / Residential, a BROKEN set for a disaster and a
   -Glow emissive map for a lit night), window DECALS (transparent — laid over
   a wall), half-width doors (painted / storefront / wooden), floor tiles
   (generic, marble, the subway's banded tile), ceiling tiles, subway grills,
   trusses (transparent — a girder), non-slip rubber, the manhole, and the
   SIGNS (caution / danger / hazard / prohibited / protective / speed).
   A material anywhere in the game names one as the terrain key
   `urban:<Name>` — three-renderer.js _hzTex / _hqTex fall through to
   URBAN_TEXTURES for that prefix, so a room shell, a near builder's K.mat,
   a terrain field's floor / cliff / path and the city's buildings all read
   the pack the same way. Never add these to TERRAIN_SPRITES (a terrain key
   is a board tile; these are sheets). URBAN_TEX_FAMILIES groups them for a
   seeded pick (urbanTexPick); urbanTexGlow names the lit twin of a window.
   ═══════════════════════════════════════════════════════════════════════ */
const _TU = `${_T}/urban`;
const URBAN_TEX_FAMILIES = {
    ConcreteStriped: ['ConcreteStriped1a', 'ConcreteStriped1b', 'ConcreteStriped1c', 'ConcreteStriped1d', 'ConcreteStriped1e', 'ConcreteStriped2a', 'ConcreteStriped2b', 'ConcreteStriped2c', 'ConcreteStriped2d', 'ConcreteStriped2e'],
    ConcreteUnderTiles: ['ConcreteUnderTiles1', 'ConcreteUnderTiles2'],
    DecalManholeCover: ['DecalManholeCover'],
    DecalWindowsFactory: ['DecalWindowsFactory1a', 'DecalWindowsFactory1a-Glow', 'DecalWindowsFactory1b', 'DecalWindowsFactory1c', 'DecalWindowsFactory2a', 'DecalWindowsFactory2a-Glow', 'DecalWindowsFactory2b', 'DecalWindowsFactory2c'],
    DecalWindowsResidential: ['DecalWindowsResidential-Glow1', 'DecalWindowsResidential-Glow2', 'DecalWindowsResidential1a', 'DecalWindowsResidential1b', 'DecalWindowsResidential1c', 'DecalWindowsResidential2a', 'DecalWindowsResidential2b', 'DecalWindowsResidential2c'],
    DoorPaintedHalf: ['DoorPaintedHalf1a', 'DoorPaintedHalf1b', 'DoorPaintedHalf1c', 'DoorPaintedHalf2a', 'DoorPaintedHalf2b', 'DoorPaintedHalf2c', 'DoorPaintedHalf3a', 'DoorPaintedHalf3b', 'DoorPaintedHalf3c', 'DoorPaintedHalf4a', 'DoorPaintedHalf4b', 'DoorPaintedHalf4c'],
    DoorStorefrontHalf: ['DoorStorefrontHalf1a', 'DoorStorefrontHalf1b', 'DoorStorefrontHalf1c', 'DoorStorefrontHalf1d', 'DoorStorefrontHalf2a', 'DoorStorefrontHalf2b', 'DoorStorefrontHalf2c', 'DoorStorefrontHalf2d'],
    DoorWoodenHalf: ['DoorWoodenHalf1a', 'DoorWoodenHalf1b', 'DoorWoodenHalf1c', 'DoorWoodenHalf2a', 'DoorWoodenHalf2b', 'DoorWoodenHalf2c'],
    FibreCeilingTile: ['FibreCeilingTile1a', 'FibreCeilingTile1b', 'FibreCeilingTile2a', 'FibreCeilingTile2b'],
    GlassWindowFactory: ['GlassWindowFactory1a', 'GlassWindowFactory1a-Glow', 'GlassWindowFactory1b', 'GlassWindowFactory2a', 'GlassWindowFactory2a-Glow', 'GlassWindowFactory2b', 'GlassWindowFactory3a', 'GlassWindowFactory3a-Glow', 'GlassWindowFactory3b', 'GlassWindowFactory4a', 'GlassWindowFactory4a-Glow', 'GlassWindowFactory4b'],
    GlassWindowFactoryBroken: ['GlassWindowFactoryBroken1a', 'GlassWindowFactoryBroken1b', 'GlassWindowFactoryBroken1c', 'GlassWindowFactoryBroken2a', 'GlassWindowFactoryBroken2b', 'GlassWindowFactoryBroken2c', 'GlassWindowFactoryBroken3a', 'GlassWindowFactoryBroken3b', 'GlassWindowFactoryBroken3c', 'GlassWindowFactoryBroken4a', 'GlassWindowFactoryBroken4b', 'GlassWindowFactoryBroken4c'],
    GlassWindowResidential: ['GlassWindowResidential1-Glow1', 'GlassWindowResidential1-Glow2', 'GlassWindowResidential1a', 'GlassWindowResidential1b', 'GlassWindowResidential2a', 'GlassWindowResidential2b'],
    GlassWindowResidentialBroken: ['GlassWindowResidentialBroken1a', 'GlassWindowResidentialBroken1b', 'GlassWindowResidentialBroken1c', 'GlassWindowResidentialBroken2a', 'GlassWindowResidentialBroken2b', 'GlassWindowResidentialBroken2c'],
    GlassWindowResidentialShutter: ['GlassWindowResidentialShutter1', 'GlassWindowResidentialShutter2'],
    GlassWindowSquare: ['GlassWindowSquare1a', 'GlassWindowSquare1a-Glow', 'GlassWindowSquare1b', 'GlassWindowSquare2a', 'GlassWindowSquare2a-Glow', 'GlassWindowSquare2b', 'GlassWindowSquare3a', 'GlassWindowSquare3a-Glow', 'GlassWindowSquare3b', 'GlassWindowSquare4a', 'GlassWindowSquare4a-Glow', 'GlassWindowSquare4b'],
    GlassWindowSquareBroken: ['GlassWindowSquareBroken1a', 'GlassWindowSquareBroken1b', 'GlassWindowSquareBroken1c', 'GlassWindowSquareBroken2a', 'GlassWindowSquareBroken2b', 'GlassWindowSquareBroken2c', 'GlassWindowSquareBroken3a', 'GlassWindowSquareBroken3b', 'GlassWindowSquareBroken3c', 'GlassWindowSquareBroken4a', 'GlassWindowSquareBroken4b', 'GlassWindowSquareBroken4c'],
    GlassWindowTall: ['GlassWindowTall1a', 'GlassWindowTall1a-Glow', 'GlassWindowTall1b', 'GlassWindowTall2a', 'GlassWindowTall2a-Glow', 'GlassWindowTall3a', 'GlassWindowTall3a-Glow', 'GlassWindowTall3b', 'GlassWindowTall4a', 'GlassWindowTall4a-Glow', 'GlassWindowTall4b'],
    GlassWindowTallBroken: ['GlassWindowTallBroken1a', 'GlassWindowTallBroken1b', 'GlassWindowTallBroken1c', 'GlassWindowTallBroken2a', 'GlassWindowTallBroken2b', 'GlassWindowTallBroken2c', 'GlassWindowTallBroken3a', 'GlassWindowTallBroken3b', 'GlassWindowTallBroken3c', 'GlassWindowTallBroken4a', 'GlassWindowTallBroken4b', 'GlassWindowTallBroken4c'],
    MetalCorrugatedPainted: ['MetalCorrugatedPainted1a', 'MetalCorrugatedPainted1b', 'MetalCorrugatedPainted1c', 'MetalCorrugatedPainted1d', 'MetalCorrugatedPainted2a', 'MetalCorrugatedPainted2b', 'MetalCorrugatedPainted2c', 'MetalCorrugatedPainted2d', 'MetalCorrugatedPainted3a', 'MetalCorrugatedPainted3b', 'MetalCorrugatedPainted3c', 'MetalCorrugatedPainted3d', 'MetalCorrugatedPainted4a', 'MetalCorrugatedPainted4b', 'MetalCorrugatedPainted4c', 'MetalCorrugatedPainted4d', 'MetalCorrugatedPainted5a', 'MetalCorrugatedPainted5b', 'MetalCorrugatedPainted5c', 'MetalCorrugatedPainted5d'],
    MetalSubwayGrill: ['MetalSubwayGrill1a', 'MetalSubwayGrill1b', 'MetalSubwayGrill2a', 'MetalSubwayGrill2b'],
    MetalTruss: ['MetalTruss1a', 'MetalTruss1b', 'MetalTruss1c', 'MetalTruss2a', 'MetalTruss2b', 'MetalTruss2c', 'MetalTruss3a', 'MetalTruss3b', 'MetalTruss3c', 'MetalTruss4a', 'MetalTruss4b', 'MetalTruss4c', 'MetalTruss5a', 'MetalTruss5b', 'MetalTruss5c', 'MetalTruss6a', 'MetalTruss6b', 'MetalTruss6c', 'MetalTruss7a', 'MetalTruss7b', 'MetalTruss7c', 'MetalTruss8a', 'MetalTruss8b', 'MetalTruss9c'],
    PlasterWallPainted: ['PlasterWallPainted1a', 'PlasterWallPainted1b', 'PlasterWallPainted1c', 'PlasterWallPainted1d', 'PlasterWallPainted1e', 'PlasterWallPainted1f', 'PlasterWallPainted2a', 'PlasterWallPainted2b', 'PlasterWallPainted2c', 'PlasterWallPainted2d', 'PlasterWallPainted2e'],
    PlasterWallStucco: ['PlasterWallStucco1a', 'PlasterWallStucco1b', 'PlasterWallStucco2a', 'PlasterWallStucco2b', 'PlasterWallStucco2c', 'PlasterWallStucco2d', 'PlasterWallStucco2e'],
    RubberNonSlip: ['RubberNonSlip1a', 'RubberNonSlip1b', 'RubberNonSlip2a', 'RubberNonSlip2b', 'RubberNonSlip3a', 'RubberNonSlip3b', 'RubberNonSlip4a', 'RubberNonSlip4b', 'RubberNonSlip5a', 'RubberNonSlip5b'],
    SignCaution: ['SignCaution1a', 'SignCaution1b', 'SignCaution1c', 'SignCaution1d', 'SignCaution1e', 'SignCaution1f'],
    SignDanger: ['SignDanger1a', 'SignDanger1b', 'SignDanger1c', 'SignDanger1d', 'SignDanger1e', 'SignDanger1f'],
    SignHazard: ['SignHazard1a', 'SignHazard1b', 'SignHazard1c', 'SignHazard2a', 'SignHazard2b'],
    SignProhibited: ['SignProhibited1a', 'SignProhibited1b', 'SignProhibited1c'],
    SignProtective: ['SignProtective1a', 'SignProtective1b', 'SignProtective1c', 'SignProtective1d'],
    SignSpeed: ['SignSpeedAus010-small', 'SignSpeedAus015-small', 'SignSpeedAus020-small', 'SignSpeedAus025-small', 'SignSpeedAus030-small', 'SignSpeedAus040-small', 'SignSpeedAus050-small', 'SignSpeedAus060-small', 'SignSpeedAus070-small', 'SignSpeedAus080-small', 'SignSpeedAus090-small', 'SignSpeedAus100-small', 'SignSpeedAus110-small', 'SignSpeedAus120-small', 'SignSpeedUsa010-small', 'SignSpeedUsa015-small', 'SignSpeedUsa020-small', 'SignSpeedUsa025-small', 'SignSpeedUsa030-small', 'SignSpeedUsa040-small', 'SignSpeedUsa050-small', 'SignSpeedUsa060-small', 'SignSpeedUsa070-small', 'SignSpeedUsa080-small', 'SignSpeedUsa090-small', 'SignSpeedUsa100-small', 'SignSpeedUsa110-small', 'SignSpeedUsa120-small'],
    TileGeneric: ['TileGeneric1a', 'TileGeneric1b', 'TileGeneric1c', 'TileGeneric2a', 'TileGeneric2b', 'TileGeneric2c', 'TileGeneric3a', 'TileGeneric3b', 'TileGeneric3c', 'TileGeneric4a', 'TileGeneric4b', 'TileGeneric4c', 'TileGeneric5a', 'TileGeneric5b', 'TileGeneric5c', 'TileGeneric6a', 'TileGeneric6b', 'TileGeneric6c'],
    TileMarble: ['TileMarble1a', 'TileMarble1b', 'TileMarble1c', 'TileMarble1d', 'TileMarble2a', 'TileMarble2b', 'TileMarble2c', 'TileMarble2d', 'TileMarble3a', 'TileMarble3b', 'TileMarble3c', 'TileMarble3d'],
    TileSubway: ['TileSubway1a', 'TileSubway1b', 'TileSubway1c', 'TileSubway1d', 'TileSubway2a', 'TileSubway2b', 'TileSubway2c', 'TileSubway2d', 'TileSubway3a', 'TileSubway3b', 'TileSubway3c', 'TileSubway3d', 'TileSubway4a', 'TileSubway4b', 'TileSubway4c', 'TileSubway4d'],
    TileSubwayGen: ['TileSubwayGen1', 'TileSubwayGen2'],
};
const URBAN_TEXTURES = {};
Object.keys(URBAN_TEX_FAMILIES).forEach(fam => URBAN_TEX_FAMILIES[fam].forEach(n => { URBAN_TEXTURES[n] = `${_TU}/${n}.png`; }));
/* THE METRO PACK (2026-10-04, mondo's upload): the PSX metro sheets on R2 Assets/world/packs/elbolilloduro_metro_psx/Textures/, worn as `urban:Metro<Name>`
   by a shell / a prop like any urban sheet (their own family, MetroPSX, which no random city pick names) */
const _TMETRO = 'https://cdn.entropywars.net/Assets/world/packs/elbolilloduro_metro_psx/Textures';
Object.assign(URBAN_TEXTURES, {
    MetroTiles: `${_TMETRO}/Tiles.png`,             // dark grey square tiles (the platform's floor in the pack)
    MetroFloor: `${_TMETRO}/Floor.png`,             // dark flecked terrazzo
    MetroTactile: `${_TMETRO}/TactilePaving.png`,   // the yellow tactile strip
    MetroWallTile: `${_TMETRO}/tile_tile.jpg`,      // small white wall tiles
    MetroWhiteTile: `${_TMETRO}/P10.jpg`,           // big white square tiles
    MetroConcrete: `${_TMETRO}/ConcreteBare.png`,   // bare concrete (the vault overhead)
    MetroRails: `${_TMETRO}/road_rails.jpg`,        // ballast, sleepers and rails (the track bed)
    MetroMetal: `${_TMETRO}/metal.jpg`,
});
URBAN_TEX_FAMILIES.MetroPSX = Object.keys(URBAN_TEXTURES).filter(n => /^Metro/.test(n));   // the editor's texture list shows them as one family
/* THE LIQUIDS (2026-10-26, mondo's upload): all 48 sheets on R2 Assets/world/terrain/liquids/ (Blue / Brown / Green / Purple /
   Red _01-_08, Yellow _1-_8 with no zero pad), worn as `urban:Liquid_<Colour>_<NN>` by a room's floor / pool / shell like any
   urban sheet, and listed as one family (Liquids, which no random city pick names) in the editor's texture picker. The
   liquid terrains themselves (poison, poison_bog, purple_bog, swamp, oil, blood) name theirs in TERRAIN_SPRITES. */
const LIQUID_SHEETS = {};
['Blue', 'Brown', 'Green', 'Purple', 'Red', 'Yellow'].forEach(c => { for (let i = 1; i <= 8; i++) LIQUID_SHEETS[`Liquid_${c}_${c === 'Yellow' ? i : '0' + i}`] = `${_T}/liquids/Liquid_${c}_${c === 'Yellow' ? i : '0' + i}-128x128.png`; });
Object.assign(URBAN_TEXTURES, LIQUID_SHEETS);
URBAN_TEX_FAMILIES.Liquids = Object.keys(LIQUID_SHEETS);
function urbanTexUrl(name) { return URBAN_TEXTURES[name] || null; }
function urbanTexKey(name) { return 'urban:' + name; }
/* a seeded pick from a family: `rng` a 0..1 function (or a number in 0..1), `filter` a predicate / a RegExp on the name */
function urbanTexPick(family, rng, filter) {
    let list = URBAN_TEX_FAMILIES[family] || [];
    if (filter) list = list.filter(n => (typeof filter === 'function') ? filter(n) : (filter && typeof filter.test === 'function') ? filter.test(n) : true);
    if (!list.length) return null;
    const r = (typeof rng === 'function') ? rng() : ((typeof rng === 'number') ? rng : Math.random());
    return list[Math.min(list.length - 1, Math.floor(Math.max(0, Math.min(0.999999, r)) * list.length))];
}
/* the emissive twin of a window sheet (the lit night), or null: GlassWindow*<n>a → <n>a-Glow, DecalWindowsFactory<n>a → -Glow,
   DecalWindowsResidential<n><x> → DecalWindowsResidential-Glow<n> */
function urbanTexGlow(name) {
    if (!name || /-Glow/.test(name)) return null;
    if (URBAN_TEXTURES[name + '-Glow']) return name + '-Glow';
    const m = /^DecalWindowsResidential(\d)/.exec(name);
    if (m && URBAN_TEXTURES['DecalWindowsResidential-Glow' + m[1]]) return 'DecalWindowsResidential-Glow' + m[1];
    /* a b / c variant lights like its family's a */
    const m2 = /^(GlassWindow(?:Square|Tall|Factory)|DecalWindowsFactory)(\d)[b-z]$/.exec(name);
    if (m2 && URBAN_TEXTURES[m2[1] + m2[2] + 'a-Glow']) return m2[1] + m2[2] + 'a-Glow';
    return null;
}
if (typeof window !== 'undefined') { window.URBAN_TEXTURES = URBAN_TEXTURES; window.URBAN_TEX_FAMILIES = URBAN_TEX_FAMILIES; window.urbanTexUrl = urbanTexUrl; window.urbanTexKey = urbanTexKey; window.urbanTexPick = urbanTexPick; window.urbanTexGlow = urbanTexGlow; window.LIQUID_SHEETS = LIQUID_SHEETS; }

const TERRAIN_SIDE_SPRITES = {

    grass: 'dirt', grass_2: 'dirt', grass_rocky: 'dirt',
    purple_grass: 'dirt',

    void: null, chasm: null,

};

const BG_NEBULA = `${_S}/bg_nebula.png`;

const BAT_SPRITES = [
  `${_S}/Races/vampire/bat1.png`,
  `${_S}/Races/vampire/bat2.png`,
  `${_S}/Races/vampire/bat3.png`,
  `${_S}/Races/vampire/bat4.png`,
];

const SPIDER_SPRITE = `${_S}/spider_1.png`;
const SPIDERWEB_SPRITE = `${_S}/spiderweb_1.png`;

const MISSILE_SPRITE = `${_S}/missle.png`;
const NUCLEAR_MISSILE_SPRITE = `${_S}/nuclearmissle.png`;
const F22_SPRITE = `${_S}/f22.png`;

const BOSS_SPRITES = {
  'monster_hellspawn':   `${_S}/Monsters/monster_hellspawn.png`,
  'monster_angel':       `${_S}/Monsters/monster_angel.png`,
  'monster_abomination': `${_S}/Monsters/monster_abomination.png`
};

const TURRET_SPRITE_URL        = `${_S}/turret.png`;
const SIEGE_TURRET_SPRITE_URL  = `${_S}/siege_turret.png`;
const TURRET_2_SPRITE_URL      = `${_S}/turret_2.png`;
const TURRET_CANNON_SPRITE_URL = `${_S}/turret_arm.png`;
const FIVEG_TOWER_SPRITE_URL   = `${_S}/5g_radio_tower.png`;

const HEALING_SEED_SPRITE_URL  = `${_S}/healing_seed.png`;
const POISON_SEED_SPRITE_URL   = `${_S}/poison_seed.png`;
const LEECH_SEED_SPRITE_URL    = `${_S}/leech_seed.png`;
const POWDER_KEG_SPRITE_URL    = `${_S}/powder_keg.png`;
const BOMB_SPRITE_URL          = `${_S}/bomb.png`;
const WARD_SPRITE_URL          = `${_S}/torch.png`;
/* Twisted-rope strip (128×32) — wrapped around the 3D torch's lashing rings
   by _buildTorch3D (three-renderer.js). */
const ROPE_SPRITE_URL          = `${_S}/rope.png`;
const BONE_WALL_SPRITE_URL     = `${_S}/bone_wall.png`;

const DRAGON_SPRITES = {
    green: `${_S}/dragon-green.png`,
    red:   `${_S}/dragon-red.png`
};

const UI_CURSOR_UNIT = `${EW_CDN}Assets/ui/sprites/unit_cursor.png`;
const UI_CURSOR_MENU = `${EW_CDN}Assets/ui/sprites/menu_cursor.png`;

const FOG_CLOUD_SPRITES = [
    `${_S}/64x64/terrain/fog.png`
];

const WEATHER_SPRITES = {
    thunderstorm: 'https://cdn.entropywars.net/Assets/loose_sprites/object_thundercloud.png',
    bloodRain: typeof ICON_BLOOD_RAIN !== 'undefined' ? ICON_BLOOD_RAIN : 'https://cdn.entropywars.net/Assets/loose_sprites/weather_bloodrain.png'
};

function _terrainSvg(inner) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' + inner + '</svg>'
    );
}

const SEED_TILE_SPRITES = {
    heal: [ HEALING_SEED_SPRITE_URL ],
    scorched: [ 'https://cdn.entropywars.net/Assets/world/terrain/scorched.png' ],
    poison: [ POISON_SEED_SPRITE_URL ],
    leech: [ LEECH_SEED_SPRITE_URL ],
    warp: [
        _terrainSvg(
            '<defs><radialGradient id="wg1" cx="32" cy="32" r="20" gradientUnits="userSpaceOnUse">' +
            '<stop offset="0%" stop-color="rgba(160,100,255,0.3)"/><stop offset="100%" stop-color="rgba(100,60,200,0)"/>' +
            '</radialGradient></defs>' +
            '<circle cx="32" cy="32" r="20" fill="url(#wg1)"/>' +
            '<circle cx="32" cy="32" r="16" fill="none" stroke="rgba(160,110,255,0.5)" stroke-width="1.5" stroke-dasharray="4 3"/>' +
            '<circle cx="32" cy="32" r="10" fill="none" stroke="rgba(180,130,255,0.4)" stroke-width="1"/>' +
            '<path d="M32 16 L36 26 L32 22 L28 26 Z" fill="rgba(180,140,255,0.5)"/>' +
            '<path d="M48 32 L38 36 L42 32 L38 28 Z" fill="rgba(175,135,250,0.45)"/>' +
            '<path d="M32 48 L28 38 L32 42 L36 38 Z" fill="rgba(170,130,245,0.4)"/>' +
            '<path d="M16 32 L26 28 L22 32 L26 36 Z" fill="rgba(165,125,240,0.4)"/>' +
            '<circle cx="32" cy="32" r="4" fill="rgba(200,160,255,0.45)"/>' +
            '<circle cx="32" cy="32" r="2" fill="rgba(230,200,255,0.5)"/>'
        ),
        _terrainSvg(
            '<defs><radialGradient id="wg2" cx="32" cy="32" r="22" gradientUnits="userSpaceOnUse">' +
            '<stop offset="0%" stop-color="rgba(140,80,240,0.28)"/><stop offset="100%" stop-color="rgba(80,40,180,0)"/>' +
            '</radialGradient></defs>' +
            '<circle cx="32" cy="32" r="22" fill="url(#wg2)"/>' +
            '<polygon points="32,14 35,26 48,26 37,33 41,46 32,38 23,46 27,33 16,26 29,26" fill="none" stroke="rgba(160,110,255,0.45)" stroke-width="1.2"/>' +
            '<circle cx="32" cy="32" r="12" fill="none" stroke="rgba(150,100,240,0.35)" stroke-width="1" stroke-dasharray="3 2"/>' +
            '<circle cx="32" cy="32" r="5" fill="rgba(180,140,255,0.4)"/>' +
            '<circle cx="32" cy="32" r="2.5" fill="rgba(220,190,255,0.5)"/>' +
            '<circle cx="24" cy="22" r="1" fill="rgba(200,170,255,0.4)"/>' +
            '<circle cx="40" cy="22" r="1" fill="rgba(200,170,255,0.35)"/>' +
            '<circle cx="24" cy="42" r="1" fill="rgba(200,170,255,0.3)"/>' +
            '<circle cx="40" cy="42" r="1" fill="rgba(200,170,255,0.3)"/>'
        ),
        _terrainSvg(
            '<defs><radialGradient id="wg3" cx="32" cy="32" r="20" gradientUnits="userSpaceOnUse">' +
            '<stop offset="0%" stop-color="rgba(150,90,250,0.3)"/><stop offset="100%" stop-color="rgba(90,50,190,0)"/>' +
            '</radialGradient></defs>' +
            '<circle cx="32" cy="32" r="20" fill="url(#wg3)"/>' +
            '<path d="M32 14 Q46 18 48 32 Q46 46 32 48 Q18 46 16 32 Q18 18 32 14" fill="none" stroke="rgba(160,110,255,0.4)" stroke-width="1.5"/>' +
            '<path d="M32 20 Q42 22 44 32 Q42 42 32 44 Q22 42 20 32 Q22 22 32 20" fill="none" stroke="rgba(170,125,255,0.35)" stroke-width="1.2"/>' +
            '<circle cx="32" cy="32" r="7" fill="rgba(60,20,120,0.4)"/>' +
            '<circle cx="32" cy="32" r="4" fill="rgba(40,10,100,0.5)"/>' +
            '<circle cx="32" cy="32" r="2" fill="rgba(180,150,255,0.4)"/>' +
            '<circle cx="26" cy="18" r="1" fill="rgba(200,170,255,0.35)"/>' +
            '<circle cx="44" cy="28" r="1" fill="rgba(200,170,255,0.3)"/>' +
            '<circle cx="38" cy="46" r="1" fill="rgba(200,170,255,0.3)"/>' +
            '<circle cx="18" cy="36" r="1" fill="rgba(200,170,255,0.3)"/>'
        )
    ]
};

/* Trap sigils (2026-07-07 placeTrap arsenal) — inline SVG ground decals,
   rendered only for the trap's owner (same rule as warp runes). Keyed by
   trapType: spike / frost / tremor / magnet. */
const TRAP_TILE_SPRITES = {
    /* THE DOOR AGENT's trapdoor (rev 3, 2026-09-20): one sigil per tile of the
       hidden 2×2 — a door laid flat, the hinge line, the teal of the kit.
       Drawn for the OWNER only (the renderer's trap rule). */
    trapdoor: [
        _terrainSvg(
            '<rect x="14" y="10" width="36" height="44" rx="2" fill="rgba(47,107,102,0.28)" stroke="rgba(92,224,208,0.55)" stroke-width="1.6"/>' +
            '<rect x="18" y="14" width="28" height="36" rx="1" fill="none" stroke="rgba(92,224,208,0.35)" stroke-width="1"/>' +
            '<line x1="14" y1="10" x2="14" y2="54" stroke="rgba(255,240,204,0.6)" stroke-width="2"/>' +
            '<circle cx="43" cy="33" r="2" fill="rgba(255,240,204,0.7)"/>'
        )
    ],
    spike: [
        _terrainSvg(
            '<circle cx="32" cy="32" r="18" fill="none" stroke="rgba(180,180,170,0.4)" stroke-width="1.5" stroke-dasharray="5 4"/>' +
            '<path d="M32 20 L36 32 L28 32 Z" fill="rgba(200,200,190,0.55)"/>' +
            '<path d="M20 36 L30 38 L24 44 Z" fill="rgba(185,185,175,0.5)"/>' +
            '<path d="M44 36 L38 44 L34 37 Z" fill="rgba(185,185,175,0.5)"/>' +
            '<path d="M26 26 L38 26 L32 33 Z" fill="none" stroke="rgba(160,160,150,0.45)" stroke-width="1.2"/>' +
            '<circle cx="32" cy="32" r="2.5" fill="rgba(220,220,210,0.5)"/>'
        )
    ],
    frost: [
        _terrainSvg(
            '<g stroke="rgba(160,220,255,0.55)" stroke-width="1.6" fill="none">' +
            '<path d="M32 14 L32 50 M14 32 L50 32 M19 19 L45 45 M45 19 L19 45"/>' +
            '<path d="M32 18 L28 23 M32 18 L36 23 M32 46 L28 41 M32 46 L36 41"/>' +
            '<path d="M18 32 L23 28 M18 32 L23 36 M46 32 L41 28 M46 32 L41 36"/>' +
            '</g>' +
            '<circle cx="32" cy="32" r="4" fill="rgba(190,235,255,0.45)"/>'
        )
    ],
    tremor: [
        _terrainSvg(
            '<g stroke="rgba(235,150,60,0.55)" stroke-width="1.8" fill="none">' +
            '<path d="M32 32 L20 18 M32 32 L47 22 M32 32 L44 46 M32 32 L18 42"/>' +
            '<path d="M26 25 L23 26 M39 27 L40 30 M38 39 L35 41 M25 37 L26 40"/>' +
            '</g>' +
            '<circle cx="32" cy="32" r="5" fill="none" stroke="rgba(250,180,90,0.5)" stroke-width="1.6"/>' +
            '<circle cx="32" cy="32" r="2" fill="rgba(255,200,120,0.55)"/>'
        )
    ],
    magnet: [
        _terrainSvg(
            '<path d="M22 40 L22 26 A10 10 0 0 1 42 26 L42 40" fill="none" stroke="rgba(230,80,80,0.6)" stroke-width="5"/>' +
            '<rect x="19" y="38" width="6" height="6" fill="rgba(220,225,235,0.6)"/>' +
            '<rect x="39" y="38" width="6" height="6" fill="rgba(220,225,235,0.6)"/>' +
            '<path d="M18 20 L22 16 M46 20 L42 16 M32 12 L32 17" stroke="rgba(140,200,255,0.5)" stroke-width="1.5" fill="none"/>'
        )
    ]
};

if (typeof TERRAIN_SPRITES !== 'undefined') {
    const _legacySprites = {
        ice: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(180,220,240,0.25)"/><path d="M0 20 Q16 16 32 22 Q48 28 64 18" fill="none" stroke="rgba(220,240,255,0.4)" stroke-width="1.5"/><path d="M0 40 Q16 36 32 42 Q48 48 64 38" fill="none" stroke="rgba(200,230,250,0.35)" stroke-width="1"/><circle cx="20" cy="30" r="4" fill="rgba(240,250,255,0.2)"/>'),
            _terrainSvg('<rect width="64" height="64" fill="rgba(175,215,238,0.22)"/><path d="M0 30 Q20 24 40 32 Q56 38 64 28" fill="none" stroke="rgba(215,238,252,0.38)" stroke-width="1.5"/><circle cx="34" cy="18" r="5" fill="rgba(235,248,255,0.15)"/>'),
        ],
        well: [
            'https://cdn.entropywars.net/Assets/loose_sprites/object_well.png'
        ],
        beanstalk: [
            'https://cdn.entropywars.net/Assets/loose_sprites/object_beanstalk.png'
        ],
        cave_entrance: [
            'https://cdn.entropywars.net/Assets/loose_sprites/object_caveentrance .png'
        ],
        tower_base: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(90,85,100,0.12)"/><rect x="4" y="4" width="56" height="56" rx="2" fill="rgba(100,95,110,0.08)" stroke="rgba(120,115,130,0.12)" stroke-width="0.5"/>')
        ],
        ladder_up: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(70,60,50,0.15)"/><rect x="20" y="8" width="4" height="48" fill="rgba(120,90,50,0.6)"/><rect x="40" y="8" width="4" height="48" fill="rgba(120,90,50,0.6)"/><rect x="20" y="16" width="24" height="3" fill="rgba(130,100,55,0.5)"/><rect x="20" y="28" width="24" height="3" fill="rgba(130,100,55,0.5)"/><rect x="20" y="40" width="24" height="3" fill="rgba(130,100,55,0.5)"/>')
        ],
        rope_up: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(70,60,50,0.15)"/><path d="M32 4 Q28 16 34 28 Q30 40 32 56" fill="none" stroke="rgba(160,130,80,0.6)" stroke-width="3"/><circle cx="32" cy="4" r="3" fill="rgba(140,110,60,0.5)"/>')
        ],
        mountain_top: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(160,165,175,0.15)"/><polygon points="20,52 32,12 44,52" fill="rgba(180,185,195,0.35)"/><polygon points="32,12 36,20 28,20" fill="rgba(240,245,255,0.4)"/><circle cx="14" cy="48" r="4" fill="rgba(170,175,185,0.25)"/>'),
        ],
        tree_top: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(50,120,40,0.15)"/><circle cx="32" cy="32" r="22" fill="rgba(55,140,45,0.35)"/><circle cx="22" cy="26" r="12" fill="rgba(60,150,50,0.3)"/><circle cx="42" cy="28" r="14" fill="rgba(52,135,42,0.32)"/>')
        ],
        sky_open: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(135,185,235,0.08)"/><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.2)"/><circle cx="48" cy="44" r="1.5" fill="rgba(255,255,255,0.15)"/>')
        ],
        storm: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(80,80,110,0.2)"/><ellipse cx="32" cy="24" rx="20" ry="10" fill="rgba(100,100,140,0.25)"/><path d="M30 34 L26 44 L34 40 L28 56" fill="none" stroke="rgba(255,255,100,0.5)" stroke-width="2"/>')
        ],
        descent_point: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(200,220,240,0.1)"/><ellipse cx="32" cy="32" rx="12" ry="12" fill="rgba(100,140,200,0.3)"/><ellipse cx="32" cy="32" rx="8" ry="8" fill="rgba(60,100,170,0.25)"/><path d="M28 28 L32 40 L36 28" fill="rgba(255,255,255,0.3)"/>')
        ]
    };
    for (const [k, v] of Object.entries(_legacySprites)) {
        if (!TERRAIN_SPRITES[k] || TERRAIN_SPRITES[k].length === 0) TERRAIN_SPRITES[k] = v;
    }
}

/* ── THE MOVED 2D ART, AT THE SOURCE (2026-11-05, mondo's Firefox console: "A resource is blocked by OpaqueResponseBlocking" for
   every portrait / race sprite in the party builder, the team select and the HUD) ─────────────────────────────────────────────
   The tables above still build the OLD Sprites/ paths from _S (permanent aliases, see EW_ASSET_MOVES), and the safety net was
   meant to rewrite them when a page shows them. But an inline background set as a style PROPERTY (React's
   style={{ backgroundImage }}, el.style.backgroundImage = ...) has no setter to wrap in Chrome (CSS properties are not
   accessors on its CSSStyleDeclaration prototype) nor in a Firefox that renamed CSS2Properties to CSSStyleProperties, so those
   URLs went out as written: a 404 text/html from R2 since the old keys were archived, which the browser blocks as ORB.
   So every 2D image table here is moved to the new keys once, at load, and the getters that build a path return the moved one:
   the first request is already the right file. (The net still catches anything built elsewhere: see the observer below.) */
(function _ewMoveArtTables() {
  if (typeof ewAsset !== 'function') return;
  const seen = new Set();
  const walk = (o, depth) => {
    if (!o || typeof o !== 'object' || depth > 6 || seen.has(o)) return;
    seen.add(o);
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string') { if (v.startsWith(EW_CDN)) { const n = ewAsset(v); if (n !== v) { try { o[k] = n; } catch (e) {} } } }
      else if (v && typeof v === 'object') walk(v, depth + 1);
    }
  };
  [_HERO_RACE_SPRITES, _CHARACTER_SPRITES, _CHARACTER_SPRITES_GENDERED, HONDA_CIVIC_SPRITES, TIME_COP_LOOKS, SENTAI_SPRITES,
   RACE_SPRITE_ANIMATIONS, RACE_PORTRAITS, RACE_SPRITES, EQUIP_SPRITES, OBJECT_SPRITES, BOSS_SPRITES, DRAGON_SPRITES,
   WEATHER_SPRITES, SEED_TILE_SPRITES, TRAP_TILE_SPRITES].forEach(t => { try { walk(t, 0); } catch (e) {} });
})();
{
  const _r2Sprite0 = getR2RaceSpriteUrl, _mapSprite0 = getBattleMapSpriteUrl, _portrait0 = getUnitPortraitUrl, _portraitArt0 = getUnitPortraitArtUrl;
  getR2RaceSpriteUrl = function (race, gender, cls) { return ewAsset(_r2Sprite0(race, gender, cls)); };
  getBattleMapSpriteUrl = function (unit) { return ewAsset(_mapSprite0(unit)); };
  getUnitPortraitArtUrl = function (unit) { return ewAsset(_portraitArt0(unit)); };
  getUnitPortraitUrl = function (unit) { return ewAsset(_portrait0(unit)); };
  try {
    for (const [n, f] of [['getR2RaceSpriteUrl', getR2RaceSpriteUrl], ['getBattleMapSpriteUrl', getBattleMapSpriteUrl],
                          ['getUnitPortraitArtUrl', getUnitPortraitArtUrl], ['getUnitPortraitUrl', getUnitPortraitUrl]]) {
      if (window[n] !== f) window[n] = f;
    }
  } catch (e) {}
}
