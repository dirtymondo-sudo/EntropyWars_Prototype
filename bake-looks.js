#!/usr/bin/env node
// bake-looks.js — THE RACE LOOKS (2026-11-01; docs/notes/character-creator.md "THE RACE LOOKS", character-models-plan.md row 17).
//
//     node bake-looks.js <Entropy_Wars_Race_Look_….json> [more exports…] [--dry-run]
//     node bake-looks.js --list                       # print what sprites.js bakes now
//     node bake-looks.js --remove <race>[:<gender>]   # drop a race's (or one gender's) saved look
//
// THE MESHY DEFAULT (2026-11-03, mondo): a baked look is a SAVED LOOK, offered in the creator (USE THE SAVED <RACE> LOOK); every race
// still wears its own Meshy model by default until sprites.js EW_RACE_LOOKS_ARE_DEFAULT is set true (his call, not a thread's).
//
// mondo edits a race's look in the forge (a slot of that race > GEAR > CHARACTER CREATOR) and presses EXPORT RACE LOOK; the
// file holds { kind: 'entropy-wars-race-looks', v: 1, looks: { <race>: { <gender>: appearance } } }. This tool runs every look
// through the game's own normalizeCharacterAppearance (sprites.js loaded in a vm sandbox, like load-data.js does data.js), so a
// stale id or a bad colour is fixed the way the game would read it, and rewrites the block between
// `// RACE_CREATOR_LOOKS:BEGIN` and `// RACE_CREATOR_LOOKS:END` in sprites.js: one line per race + gender, later files win.
// The race must be a real race (RACE_MODELS_3D or RACE_SPRITES; not the DOOR Agent / human base) and the look a creator look (not USE ORIGINAL MODEL). Then node --check,
// bump the ?v= token, deploy as usual (RULE #1 / #1b). Repo-only tooling, no dependencies.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SPRITES = path.join(__dirname, 'sprites.js');
const BEGIN = '// RACE_CREATOR_LOOKS:BEGIN', END = '// RACE_CREATOR_LOOKS:END';

function loadSprites(src) {
  const store = {};
  const ctx = { console, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = String(v); } }, navigator: { userAgent: 'node' }, location: { search: '', hostname: 'localhost' } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: 'sprites.js' });
  return ctx;
}
function readBlock(src) {
  const a = src.indexOf(BEGIN), b = src.indexOf(END);
  if (a < 0 || b < a) throw new Error('sprites.js has no ' + BEGIN + ' … ' + END + ' block');
  return { a, b };
}
function writeBlock(src, looks) {
  const { a, b } = readBlock(src);
  const head = src.slice(a, src.indexOf('\n', a) + 1);
  const races = Object.keys(looks).sort();
  const rows = races.map(r => '  ' + JSON.stringify(r) + ': {\n' + ['male', 'female'].filter(g => looks[r][g]).map(g => '    ' + g + ': ' + JSON.stringify(looks[r][g]) + ',').join('\n') + '\n  },');
  const body = 'const RACE_CREATOR_LOOKS = {' + (rows.length ? '\n' + rows.join('\n') + '\n' : '') + '};\n';
  return src.slice(0, a) + head + body + src.slice(b);
}

const args = process.argv.slice(2), dry = args.includes('--dry-run');
let src = fs.readFileSync(SPRITES, 'utf8');
const ctx = loadSprites(src);
const current = JSON.parse(JSON.stringify(vm.runInContext('RACE_CREATOR_LOOKS', ctx)));
if (args.includes('--list') || !args.length) {
  const races = Object.keys(current);
  console.log(races.length ? races.map(r => r + ': ' + Object.keys(current[r]).join(' + ')).join('\n') : '(no race looks baked)');
  if (!args.length) console.log('\nusage: node bake-looks.js <Entropy_Wars_Race_Look_….json> [more…] [--dry-run] | --list | --remove <race>[:<gender>]');
  process.exit(0);
}
const norm = ctx.normalizeCharacterAppearance, models = vm.runInContext('RACE_MODELS_3D', ctx), sprites = vm.runInContext('RACE_SPRITES', ctx);   // (THE MESHY DEFAULT 2026-11-03: a 2D-only race may have a saved look too)
const looks = current, changed = [];
const ri = args.indexOf('--remove');
if (ri >= 0) {
  const [race, g] = String(args[ri + 1] || '').split(':');
  if (!looks[race]) { console.error('no baked look for ' + race); process.exit(1); }
  if (g) delete looks[race][g]; else delete looks[race];
  if (looks[race] && !Object.keys(looks[race]).length) delete looks[race];
  changed.push('removed ' + race + (g ? ' ' + g : ''));
}
for (const f of args.filter((x, i) => !x.startsWith('--') && !(ri >= 0 && i === ri + 1))) {
  let doc;
  try { doc = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.error('cannot read ' + f + ': ' + e.message); process.exit(1); }
  if (!doc || doc.kind !== 'entropy-wars-race-looks' || !doc.looks) { console.error(f + ' is not a race-look export (EXPORT RACE LOOK or EXPORT ALL ASSIGNED in the creator)'); process.exit(1); }
  for (const race of Object.keys(doc.looks)) {
    if (!models[race] && !sprites[race]) { console.error(f + ': "' + race + '" is not a race'); process.exit(1); }
    if (race === 'door agent' || race === 'homosapien') { console.error(f + ': the ' + race + ' look comes from the officer card, not a saved race look'); process.exit(1); }
    for (const g of Object.keys(doc.looks[race])) {
      if (g !== 'male' && g !== 'female') { console.error(f + ': gender "' + g + '"'); process.exit(1); }
      const a = norm(doc.looks[race][g]);
      if (!a) { console.error(f + ': ' + race + ' ' + g + ' is not an appearance'); process.exit(1); }
      if (a.model === 'original') { console.error(f + ': ' + race + ' ' + g + ' is USE ORIGINAL MODEL (use --remove to drop a baked look)'); process.exit(1); }
      (looks[race] = looks[race] || {})[g] = JSON.parse(JSON.stringify(a));
      changed.push(race + ' ' + g + ' <- ' + path.basename(f) + ' (body ' + a.body + ', outer ' + a.outer + (a.outer2 && a.outer2 !== 'none' ? ' + second outer ' + a.outer2 : '') + (a.idle && a.idle !== 'default' ? ', idle ' + a.idle : '') + ', ' + a.wear.length + ' pack pieces, ' + Object.keys(a.wearTint || {}).length + ' tinted)');
    }
  }
}
src = writeBlock(src, looks);
loadSprites(src);   // still loads
console.log(changed.join('\n') || 'nothing changed');
if (dry) { console.log('(dry run: sprites.js not written)'); process.exit(0); }
fs.writeFileSync(SPRITES, src);
console.log('sprites.js written. Next: node --check sprites.js, bump the ?v= token in index.html, PR + sync zip (RULE #1).');
