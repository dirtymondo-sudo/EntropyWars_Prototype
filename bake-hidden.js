#!/usr/bin/env node
// bake-hidden.js — THE HIDDEN PICKS (2026-11-03; docs/notes/character-creator.md "THE HIDDEN PICKS", character-models-plan.md row 12m).
//
//     node bake-hidden.js <Entropy_Wars_Creator_Picks_….json> [--dry-run]    # the creator's EXPORT HIDDEN + NAMES (v 2)
//     node bake-hidden.js <Entropy_Wars_Creator_Hidden_….json> [--dry-run]   # an older EXPORT HIDDEN LIST (v 1: hidden only)
//     node bake-hidden.js <Entropy_Wars_Setup_….json> [--dry-run]            # or a SAVE EVERYTHING file (ew_creator_hidden_v1 + ew_creator_names_v1)
//     node bake-hidden.js --list                                             # print what sprites.js ships now
//
// mondo turns on Settings > Developer > Creator Item Hider, presses ✕ on the creator picks he wants gone (hair styles, clothes,
// accessories, skins, eye colours, idle poses ...) and EXPORT HIDDEN LIST. The export is the WHOLE list as his browser shows it
// (the shipped list + his hides - his SHOWs), so this tool REPLACES the block between `// EW_CREATOR_HIDDEN:BEGIN` and
// `// EW_CREATOR_HIDDEN:END` in sprites.js with it. Every key is checked against the game's own catalogues (sprites.js loaded in a vm
// sandbox, like bake-looks.js): an unknown kind is refused, an id no catalogue has any more is dropped with a warning.
// Nothing is deleted: hidden picks only leave the creator's lists + RANDOM; every file and every look wearing them stays.
// THE RENAMED PICKS (2026-11-03): ✎ on a creator pick gives it a name of his (display only). The v 2 export carries those names
// too ({ names: { '<kind>:<id>': name } }, also the whole list), so this tool also REPLACES the block between
// `// EW_CREATOR_NAMES:BEGIN` and `// EW_CREATOR_NAMES:END`; a v 1 file (no `names`) leaves the shipped names as they are.
// Then node --check sprites.js, bump the ?v= token, deploy as usual (RULE #1 / #1b). Repo-only tooling, no dependencies.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SPRITES = path.join(__dirname, 'sprites.js');
const BEGIN = '// EW_CREATOR_HIDDEN:BEGIN', END = '// EW_CREATOR_HIDDEN:END';
const NBEGIN = '// EW_CREATOR_NAMES:BEGIN', NEND = '// EW_CREATOR_NAMES:END';

function loadSprites(src) {
  const store = {};
  const ctx = { console, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    navigator: { userAgent: 'node' }, location: { search: '', hostname: 'localhost' } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: 'sprites.js' });
  return ctx;
}
function writeBlock(src, hidden) {
  const a = src.indexOf(BEGIN), b = src.indexOf(END);
  if (a < 0 || b < a) throw new Error('sprites.js has no ' + BEGIN + ' … ' + END + ' block');
  const head = src.slice(a, src.indexOf('\n', a) + 1);
  const keys = Object.keys(hidden).sort();
  const body = 'const EW_CREATOR_HIDDEN = {' + (keys.length ? '\n' + keys.map(k => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(hidden[k]) + ',').join('\n') + '\n' : '') + '};\n';
  return src.slice(0, a) + head + body + src.slice(b);
}

// THE RENAMED PICKS: the names block, each line with the pick's own name beside it
function writeNames(src, names, ownOf) {
  const a = src.indexOf(NBEGIN), b = src.indexOf(NEND);
  if (a < 0 || b < a) throw new Error('sprites.js has no ' + NBEGIN + ' … ' + NEND + ' block');
  const head = src.slice(a, src.indexOf('\n', a) + 1);
  const keys = Object.keys(names).sort();
  const body = 'const EW_CREATOR_NAMES = {' + (keys.length ? '\n' + keys.map(k => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(names[k]) + ',   // own name: ' + String(ownOf(k) || '?').replace(/[\r\n]+/g, ' ')).join('\n') + '\n' : '') + '};\n';
  return src.slice(0, a) + head + body + src.slice(b);
}

const args = process.argv.slice(2), dry = args.includes('--dry-run');
let src = fs.readFileSync(SPRITES, 'utf8');
const ctx = loadSprites(src);
const get = name => vm.runInContext('typeof ' + name + ' === "undefined" ? null : ' + name, ctx);
const shipped = JSON.parse(JSON.stringify(get('EW_CREATOR_HIDDEN') || {}));
const shippedNames = JSON.parse(JSON.stringify(get('EW_CREATOR_NAMES') || {}));
const ownOf = k => { const i = k.indexOf(':'); return vm.runInContext('creatorPickLabel(' + JSON.stringify(k.slice(0, i)) + ', ' + JSON.stringify(k.slice(i + 1)) + ')', ctx); };
if (args.includes('--list') || !args.length) {
  const keys = Object.keys(shipped).sort(), nkeys = Object.keys(shippedNames).sort();
  console.log(keys.length ? keys.map(k => k + '  (' + shipped[k] + ')').join('\n') : '(nothing hidden in the shipped creator)');
  console.log(nkeys.length ? nkeys.map(k => k + '  "' + (ownOf(k) || '?') + '" -> "' + shippedNames[k] + '"').join('\n') : '(nothing renamed in the shipped creator)');
  if (!args.length) console.log('\nusage: node bake-hidden.js <Entropy_Wars_Creator_Picks_….json | Entropy_Wars_Creator_Hidden_….json | Entropy_Wars_Setup_….json> [--dry-run] | --list');
  process.exit(0);
}
// the game's catalogues, by kind (the appearance key a pick sets)
const ids = list => new Set((list || []).map(o => Array.isArray(o) ? o[0] : o.id));
const looks = get('EW_MH_LOOKS') || {};
const CATS = {
  hair: ids(get('EW_HAIR_STYLES')), wear: ids(get('EW_MH_WEAR')), outer: ids(get('EW_OUTER_STYLES')), feet: ids(get('EW_FEET_STYLES')),
  cape: ids(get('EW_CAPE_STYLES')), wings: ids(get('EW_WINGS_STYLES')), idle: ids(get('EW_IDLE_POSES')), walk: ids(get('EW_WALK_STYLES')),
  mhSkin: ids(looks.skins), mhEyes: new Set([...ids(looks.eyes), ...ids(get('EW_MH_EYE_PACK'))]), mhBrows: ids(looks.brows), mhLashes: ids(looks.lashes),
  hairMat: ids(get('EW_MH_HAIR_MATS')),   // THE HAIR MATERIALS
};
const files = args.filter(x => !x.startsWith('--'));
if (files.length !== 1) { console.error('give ONE export (the newest): it holds the whole list'); process.exit(1); }
let doc;
try { doc = JSON.parse(fs.readFileSync(files[0], 'utf8')); } catch (e) { console.error('cannot read ' + files[0] + ': ' + e.message); process.exit(1); }
let wanted, wantedNames = null;   // wantedNames null = the file says nothing about names: the shipped ones stay
if (doc && doc.kind === 'entropy-wars-creator-hidden' && doc.hidden && typeof doc.hidden === 'object') {
  wanted = doc.hidden;
  if (doc.names && typeof doc.names === 'object' && !Array.isArray(doc.names)) wantedNames = doc.names;
} else if (doc && doc.format === 'entropy-wars-setup' && doc.keys) {
  // a SAVE EVERYTHING file: his browser's own edits on top of the lists the game shipped when he saved it
  let L = null, N = null;
  try { L = JSON.parse(doc.keys.ew_creator_hidden_v1 || 'null'); } catch (e) {}
  try { N = JSON.parse(doc.keys.ew_creator_names_v1 || 'null'); } catch (e) {}
  if (!L && !N) { console.error(files[0] + ' carries no creator hidden list or names (ew_creator_hidden_v1 / ew_creator_names_v1): nothing to bake'); process.exit(1); }
  wanted = {};
  for (const k of Object.keys(shipped)) if (!(L && L.show && L.show[k])) wanted[k] = shipped[k];
  for (const k of Object.keys((L && L.hide) || {})) wanted[k] = L.hide[k];
  if (N && typeof N === 'object') {
    wantedNames = Object.assign({}, shippedNames);
    for (const k of Object.keys(N)) { if (typeof N[k] === 'string' && N[k].trim()) wantedNames[k] = N[k]; else delete wantedNames[k]; }
  }
} else { console.error(files[0] + ' is not a creator export (EXPORT HIDDEN + NAMES in the creator) or a SAVE EVERYTHING file'); process.exit(1); }

const out = {}, dropped = [];
for (const k of Object.keys(wanted)) {
  const i = k.indexOf(':'), kind = i > 0 ? k.slice(0, i) : '', id = k.slice(i + 1);
  if (!CATS[kind]) { console.error('unknown kind in "' + k + '" (known: ' + Object.keys(CATS).join(', ') + ')'); process.exit(1); }
  if (!CATS[kind].has(id)) { dropped.push(k); continue; }
  out[k] = String(wanted[k] || id).slice(0, 80);
}
const added = Object.keys(out).filter(k => !shipped[k]), removed = Object.keys(shipped).filter(k => !out[k]);
console.log(Object.keys(out).length + ' hidden (' + added.length + ' newly hidden, ' + removed.length + ' shown again)');
added.forEach(k => console.log('  + ' + k + '  (' + out[k] + ')'));
removed.forEach(k => console.log('  - ' + k + '  (' + shipped[k] + ')'));
dropped.forEach(k => console.warn('  ! dropped ' + k + ': no such pick in the game any more'));
// THE RENAMED PICKS: the same checks for the names (a name = 1-40 characters on one line; a name equal to the pick's own is left out)
let outNames = null;
if (wantedNames) {
  outNames = {};
  const nDropped = [];
  for (const k of Object.keys(wantedNames)) {
    const i = k.indexOf(':'), kind = i > 0 ? k.slice(0, i) : '', id = k.slice(i + 1);
    if (!CATS[kind]) { console.error('unknown kind in name "' + k + '" (known: ' + Object.keys(CATS).join(', ') + ')'); process.exit(1); }
    if (!CATS[kind].has(id)) { nDropped.push(k); continue; }
    const v = String(wantedNames[k] == null ? '' : wantedNames[k]).replace(/\s+/g, ' ').trim().slice(0, 40);
    if (v && v !== ownOf(k)) outNames[k] = v;
  }
  const nAdded = Object.keys(outNames).filter(k => shippedNames[k] !== outNames[k]), nBack = Object.keys(shippedNames).filter(k => !outNames[k]);
  console.log(Object.keys(outNames).length + ' renamed (' + nAdded.length + ' new or changed, ' + nBack.length + ' back to their own name)');
  nAdded.forEach(k => console.log('  ✎ ' + k + '  "' + (ownOf(k) || '?') + '" -> "' + outNames[k] + '"'));
  nBack.forEach(k => console.log('  - ' + k + '  "' + shippedNames[k] + '" -> its own name "' + (ownOf(k) || '?') + '"'));
  nDropped.forEach(k => console.warn('  ! dropped name ' + k + ': no such pick in the game any more'));
} else console.log('(no names in this file: the shipped names stay as they are)');
if (dry) { console.log('(dry run: sprites.js untouched)'); process.exit(0); }
src = writeBlock(src, out);
if (outNames) src = writeNames(src, outNames, ownOf);
fs.writeFileSync(SPRITES, src);
const check = loadSprites(src), now = vm.runInContext('Object.keys(EW_CREATOR_HIDDEN).length', check), nowN = vm.runInContext('Object.keys(EW_CREATOR_NAMES).length', check);
console.log('sprites.js written; it reloads with ' + now + ' hidden and ' + nowN + ' renamed. Next: node --check sprites.js, bump ?v=, PR + sync zip.');
