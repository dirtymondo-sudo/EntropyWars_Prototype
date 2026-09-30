const fs = require('fs');
const fam = fs.readFileSync('families.md', 'utf8');
const blocks = {}; let cur = null;
for (const line of fam.split('\n')) { const m = line.match(/^## .*`([a-z0-9]+)`/); if (m) { cur = m[1]; blocks[cur] = []; } if (cur) blocks[cur].push(line); }
const GROUPS = {
  'g1-elements': ['fire','ice','lightning','water','earth','wind','nature','poison','light','shadow','sonic','arcane','blood','winter','christmasspirit','agriculture','scarecrow'],
  'g2-holy-occult': ['angelic','biblestudy','healingmagic','holydefense','knight','royalty','meditation','cult','persuasion','fortunetelling','astrology','ancientknowledge','astralprojection','psychadelic'],
  'g3-unholy': ['fallenangel','demonicabilities','infernalcourt','blackmagic','witchcraft','necromancy','bonedensity','haunted','zombie','ghoulish','vampiricabilties','astral'],
  'g4-tech-cosmic': ['artificialintelligence','computerhacking','internetaddiction','robot','cyberpunkweapons','machinery','engineering','trapmaking','advancedtechnology','unethicalscience','chemistry','alientechnology','ufo','galacticfederation','astronautcamp','cosmic','temporal','fractal','prismlattice','mecha','drivingskills'],
  'g5-beasts-giants': ['beastabilities','apexpredator','horns','werewolf','feline','sasquatch','cryptid','mothman','kaiju','apeintelligence','titan','livingstone','stoneage','desertacclimation','dragonabilities','eyesight'],
  'g6-bugs-sea': ['insectoid','arachnid','symbiosis','ooze','jellyfish','tentacleappendages','deepsea'],
  'g7-fighters': ['humangrit','teamwork','athleticism','martialarts','ki','swordsmanship','dirtyfighting','piracy','horsebackriding','ropework','door','doors','football'],
  'g8-guns-agents': ['weaponstraining','marksmanship','archery','huntingskills','cowboyskills','policetraining','streetsmarts','thievery','militarysupport','politics','deepstate','conspiracyknowledge','spygear'],
  'g9-mind-show': ['psychic','seduction','stagepresence','musictheory','actingchops','trickery','fae','maincharacter','superheropowers','sentai','gambling','animalhandling','archaeology','culinaryarts','mirrormagic','gear','training'],
};
const all = new Set(Object.keys(blocks)); const used = new Set();
for (const [g, ids] of Object.entries(GROUPS)) { let out = '# GROUP ' + g + '\n\n'; for (const id of ids) { if (!blocks[id]) { console.error('missing', id); continue; } used.add(id); out += blocks[id].join('\n') + '\n'; } fs.writeFileSync('groups/' + g + '.md', out); }
console.log('unassigned:', [...all].filter(x => !used.has(x)));
// family index (compact)
let idx = '# FAMILY INDEX (id | name | kind | unique | n | T1/T2/T3/T4 | races | spells)\n';
for (const id of Object.keys(blocks).sort()) { const b = blocks[id]; const head = b[0]; const races = (b.find(l => l.startsWith('races (')) || '').replace(/^races \(\d+\): /, ''); const spells = b.filter(l => l.startsWith('- T')).map(l => { const m = l.match(/^- (T\d) \*\*(.+?)\*\*/); return m ? m[2] + ' ' + m[1] : ''; }).filter(Boolean).join(', '); const hm = head.match(/^## (.*?) `([a-z0-9]+)` · kind (\w+)(?: · UNIQUE to ([a-z ]+))?(?: · UNIVERSAL)? · (\d+) spells \(T1 (\d+) \/ T2 (\d+) \/ T3 (\d+) \/ T4 (\d+)\)/); idx += `${id} | ${hm ? hm[1] : head} | ${hm ? hm[3] : ''} | ${hm && hm[4] ? 'UNIQUE:' + hm[4] : (head.includes('UNIVERSAL') ? 'UNIVERSAL' : '')} | ${hm ? hm[5] : ''} | ${hm ? [hm[6], hm[7], hm[8], hm[9]].join('/') : ''} | ${races} | ${spells}\n`; }
fs.writeFileSync('family-index.md', idx);
// races split into 4
const races = fs.readFileSync('races.md', 'utf8').split('\n'); const rb = []; let rc = null;
for (const line of races) { if (line.startsWith('## ')) { rc = []; rb.push(rc); } if (rc) rc.push(line); }
const per = Math.ceil(rb.length / 4);
for (let i = 0; i < 4; i++) fs.writeFileSync(`groups/races-${i + 1}.md`, '# RACES part ' + (i + 1) + '\n\n' + rb.slice(i * per, (i + 1) * per).map(b => b.join('\n')).join('\n'));
console.log('races', rb.length, 'per', per, 'index bytes', idx.length);
