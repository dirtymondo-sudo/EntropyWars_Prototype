const fs = require('fs');
const SEC = __dirname + '/sections';
const ORDER = [
  ['00-front.md', null],
  ['cross-redundancy.md', '## F. Cross-family audit — redundancy, tiers, costs, dead fields'],
  ['synergy.md', '## S. Synergy and team building'],
  ['g1-elements.md', '## F.g1 Families — elements, winter, Christmas, agriculture, scarecrow'],
  ['g2-holy-occult.md', '## F.g2 Families — holy, knightly, occult, cult, astral'],
  ['g3-unholy.md', '## F.g3 Families — demonic, infernal, necromantic, undead, vampiric, dream predation'],
  ['g4-tech-cosmic.md', '## F.g4 Families — AI, robots, engineering, science, aliens, UFO, cosmic, temporal, prism, mech, driving'],
  ['g5-beasts-giants.md', '## F.g5 Families — beasts, apex, horns, cryptids, kaiju, giants, living stone, dragon, eyesight'],
  ['g6-bugs-sea.md', '## F.g6 Families — insectoid, arachnid, symbiosis, ooze, jellyfish, tentacles, deep sea'],
  ['g7-fighters.md', '## F.g7 Families — grit, teamwork, athleticism, martial arts, ki, swords, dirty fighting, piracy, D.O.O.R., football'],
  ['g8-guns-agents.md', '## F.g8 Families — guns, marksmanship, archery, hunting, cowboy, police, street, thievery, military, politics, deep state, conspiracy, spy'],
  ['g9-mind-show.md', '## F.g9 Families — psychic, seduction, stage, trickery, fae, main character, superhero, sentai, the empty registries, gear, training'],
  ['races-1.md', '## R.1 Race fit — homosapien … mothman'],
  ['races-2.md', '## R.2 Race fit — siren … king arthur'],
  ['races-3.md', '## R.3 Race fit — king kong … hippie (part 3)'],
  ['races-4.md', '## R.4 Race fit — part 4'],
];
let out = '';
const toc = [];
for (const [f, head] of ORDER) {
  const p = SEC + '/' + f;
  if (!fs.existsSync(p)) { console.error('MISSING', f); continue; }
  let body = fs.readFileSync(p, 'utf8').trim();
  if (head) {
    // demote the section's own H1/H2 so the document has one H1
    body = body.replace(/^# .*\n/, '').replace(/^## /gm, '### ').replace(/^### (\S+ .*`[a-z0-9 ]+`)/gm, '### $1');
    // race sections: their per-race headers are ### already; family blocks are ### — keep
    out += '\n\n---\n\n' + head + '\n\n' + body + '\n';
    toc.push(head.replace(/^## /, ''));
  } else {
    out += body + '\n';
  }
}
// derive race-part titles from actual first/last race headers
out = out.replace(/## R\.(\d) Race fit — [^\n]*/g, (m, n) => {
  const body = fs.readFileSync(SEC + '/races-' + n + '.md', 'utf8');
  const heads = [...body.matchAll(/^### (.+?) `([a-z0-9 ]+)`/gm)].map(x => x[1]);
  return `## R.${n} Race fit — ${heads[0]} … ${heads[heads.length - 1]} (${heads.length} races)`;
});
const tocTxt = '\n## Contents\n' + [...out.matchAll(/^## (.+)$/gm)].map(x => x[1]).filter(t => t !== 'Contents').map(t => '- ' + t).join('\n') + '\n';
out = out.replace(/\n## 1\. How to read/, tocTxt + '\n## 1. How to read');
fs.writeFileSync('/home/user/EntropyWars_Prototype/SPELL_FAMILY_AUDIT_PLAN.md', out);
console.log('bytes', out.length, 'H2s', [...out.matchAll(/^## /gm)].length, 'H3s', [...out.matchAll(/^### /gm)].length);
