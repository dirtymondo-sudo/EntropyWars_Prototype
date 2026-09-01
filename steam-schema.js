#!/usr/bin/env node
/* steam-schema.js — prints the curated Steam schema (ACHIEVEMENTS_PLAN.md §8.2)
   as the checklist the owner enters into the Steamworks admin panel
   (Edit Steamworks Settings → Stats & Achievements). Repo tooling; reads the
   REAL data.js registries through the load-data.js sandbox (never a copy).

   Usage:
     npm run steam:schema          # human-readable checklist (default)
     node steam-schema.js --csv    # achievements as CSV (spreadsheet import)

   Panel notes baked into the output:
   - Stats are all INT, default 0, "Set By: Client".
   - Stat-backed achievements: set "Progress Stat" to the stat and
     "Unlock: >= threshold" — Steam then unlocks them automatically when the
     uploaded stat crosses, and renders the green progress bar for free (§2.1).
   - Feat achievements have no backing stat: the client asserts them directly
     (SetAchievement at the moment they pop).
*/

'use strict';

const { loadGameData } = require('./load-data.js');

const data = loadGameData();
const stats = data.STEAM_STAT_DEFS || [];
const defs = data.STEAM_ACH_DEFS || [];

if (process.argv.includes('--csv')) {
  const esc = s => '"' + String(s).replace(/"/g, '""') + '"';
  console.log('API Name,Display Name,Description,Progress Stat,Min Value,Max Value');
  for (const d of defs) {
    console.log([
      esc(d.id), esc(d.name), esc(d.desc),
      d.kind === 'stat' ? esc(d.stat) : '""',
      d.kind === 'stat' ? 0 : '',
      d.kind === 'stat' ? d.threshold : '',
    ].join(','));
  }
  process.exit(0);
}

const statBacked = defs.filter(d => d.kind === 'stat');
const feats = defs.filter(d => d.kind === 'feat');

console.log('═'.repeat(72));
console.log('ENTROPY WARS — CURATED STEAM SCHEMA (generated from data.js)');
console.log('═'.repeat(72));
console.log(`\n${defs.length} achievements (Valve cap for new games: 100), ${stats.length} stats.\n`);

console.log('─'.repeat(72));
console.log(`STATS — define these first (all: Type INT, Default 0, Set By Client)`);
console.log('─'.repeat(72));
for (const s of stats) {
  const src = s.metric ? `mirrors profile counter '${s.metric}'` : `derived: ${s.derived}`;
  console.log(`  ${s.id.padEnd(20)} ${src}`);
}

console.log('\n' + '─'.repeat(72));
console.log('STAT-BACKED ACHIEVEMENTS — set Progress Stat + "Unlock when >= N"');
console.log('(Steam unlocks these automatically and shows native progress bars)');
console.log('─'.repeat(72));
for (const d of statBacked) {
  console.log(`  ${d.id}`);
  console.log(`    name: ${d.name}`);
  console.log(`    desc: ${d.desc}`);
  console.log(`    stat: ${d.stat} >= ${d.threshold}`);
}

console.log('\n' + '─'.repeat(72));
console.log('FEAT ACHIEVEMENTS — no backing stat (client asserts on unlock)');
console.log('─'.repeat(72));
for (const d of feats) {
  console.log(`  ${d.id}`);
  console.log(`    name: ${d.name}`);
  console.log(`    desc: ${d.desc}`);
}

console.log('\nDone. Tip: node steam-schema.js --csv > steam-schema.csv');
