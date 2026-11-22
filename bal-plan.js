// node balplan.js <state.json> <pass n> [--apply]
// state.json: { runs: [ {dir, pass} ], changes: { race: [ {pass, before:{..}, after:{..}, est, gap} ] } }
// Reads each race over the runs since its stats last changed (raw + team-adjusted, averaged), shrinks the gap to 50 by
// the signal share, and sizes a POWER change at K pts per 100 POWER (the 11-08 loop measured 17.3). Overshoots (changed
// last time and now on the other side of 50 by 3+ pts) go back to before + half the change (mondo 11-21).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const REPO = __dirname;
const { loadGameData } = require(REPO + '/load-data.js');
const [stateFile, passArg] = process.argv.slice(2);
const APPLY = process.argv.includes('--apply');
const PASS = +passArg;
const K = 17.3, MIN_GAP = +(process.env.MIN_GAP || 2.0), MIN_POWER = 15, CAP = 0.25, TAU = +(process.env.TAU || 0.035);
const st = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
const d = loadGameData();
const W = d.RACE_POWER_WEIGHTS;
const ANALYZE = path.join(__dirname, 'bal-analyze.js');

function readRuns(dirs) {
    const out = path.join(require('os').tmpdir(), 'bal-' + dirs.map(x => path.basename(x)).join('_') + '.json');
    execFileSync('node', [ANALYZE, ...dirs, '--json', out]);
    return JSON.parse(fs.readFileSync(out, 'utf8'));
}
const cache = {};
function readFrom(pass) {   // runs measured at or after `pass` (a run with pass p was played on the stats of pass p)
    const dirs = st.runs.filter(r => r.pass >= pass).map(r => r.dir);
    const key = dirs.join('|');
    if (!cache[key]) { const a = readRuns(dirs); cache[key] = Object.fromEntries(a.rows.map(r => [r.race, r])); }
    return cache[key];
}
function lastChangePass(race) { const c = st.changes[race]; return c && c.length ? c[c.length - 1].pass : 0; }

function damageSplit(race) {   // share of the pool's damage spells that are physical
    let ph = 0, mg = 0;
    for (const id of d.raceSpellPowerPool(race)) {
        const s = d.SPELL_BY_ID[id]; if (!s) continue;
        const dmg = +(s.dmg || 0) + (Array.isArray(s.hitDamages) ? s.hitDamages.reduce((a, v) => a + (+v || 0), 0) : 0);
        if (dmg <= 0 && !/damage|aoe|dash|line|projectile/.test(s.kind || '')) continue;
        if (s.damageType === 'magic' || s.damageType === 'magical') mg++; else ph++;
    }
    return ph + mg ? ph / (ph + mg) : 1;
}
function power(s) { return W.hp * s.hp + W.atk * s.atk + W.int * s.int + W.def * s.def + W.mdef * s.mdef; }

function sizeChange(race, cur, dP) {   // POWER dP spread: half HP, half the pool's damage stat(s), caps ±25 %, rest DEF/M.DEF
    const s = Object.assign({}, cur);
    const phys = damageSplit(race);
    const lim = (k, v) => Math.round(Math.max(cur[k] * (1 - CAP), Math.min(cur[k] * (1 + CAP) + (cur[k] < 20 ? 15 : 0), v)));
    const hpP = dP * 0.5, dmgP = dP * 0.5;
    s.hp = lim('hp', cur.hp + hpP / W.hp);
    if (phys >= 0.25) s.atk = lim('atk', cur.atk + dmgP * phys / W.atk);
    if (phys <= 0.75) s.int = lim('int', cur.int + dmgP * (1 - phys) / W.int);
    let left = dP - (power(s) - power(cur));
    if (Math.abs(left) > 5) {
        s.def = lim('def', cur.def + left * 0.5 / W.def);
        s.mdef = lim('mdef', cur.mdef + left * 0.5 / W.mdef);
    }
    for (const k of ['hp', 'atk', 'int', 'def', 'mdef']) s[k] = Math.max(0, Math.round(s[k] / (k === 'hp' ? 10 : 1)) * (k === 'hp' ? 10 : 1));
    return s;
}

const plan = [];
const races = Object.keys(d.RACE_BASE_STATS).filter(r => d.AVAILABLE_RACES.includes(r));
const SKIP = (process.env.SKIP || '').split(',');
for (const race of races) {
    if (SKIP.includes(race)) continue;
    const lp = lastChangePass(race);
    const read = readFrom(lp)[race];
    if (!read) continue;
    const obs = (read.wr + read.adj) / 2;
    const noise2 = 0.25 / Math.max(1, read.g);
    const shrink = TAU * TAU / (TAU * TAU + noise2);
    const gap = (obs - 0.5) * shrink * 100;    // pts, shrunk
    const cur = d.RACE_BASE_STATS[race];
    const hist = st.changes[race] || [];
    const last = hist[hist.length - 1];
    // overshoot: changed last pass, the change pushed it across 50 by 3+ pts the other way
    if (last && last.pass === PASS - 1 && Math.sign(last.gap) !== Math.sign(obs - 0.5) && Math.abs(obs - 0.5) * 100 >= 5) {
        const after = {};
        for (const k of Object.keys(last.after)) after[k] = Math.round(last.before[k] + (last.after[k] - last.before[k]) / 2);
        if (after.hp) after.hp = Math.round(after.hp / 10) * 10;
        plan.push({ race, kind: 'halve', g: read.g, obs, gap, before: pick(cur, after), after, why: `pass ${last.pass} ${last.est.toFixed(1)}% → ${(obs * 100).toFixed(1)}%: back to before + half` });
        continue;
    }
    if (Math.abs(gap) < MIN_GAP) continue;
    let dP = -gap / K * 100;
    if (Math.abs(dP) < MIN_POWER) dP = Math.sign(dP) * MIN_POWER;
    const s = sizeChange(race, cur, dP);
    const after = {}; for (const k of ['hp', 'atk', 'int', 'def', 'mdef']) if (s[k] !== cur[k]) after[k] = s[k];
    plan.push({ race, kind: dP > 0 ? 'up' : 'down', g: read.g, obs, gap, dP: Math.round(dP), realP: Math.round(power(s) - power(cur)), before: pick(cur, after), after,
        why: `${(read.wr * 100).toFixed(1)}% raw / ${(read.adj * 100).toFixed(1)}% adj over ${read.g} games, shrunk gap ${gap.toFixed(1)} pts` });
}
function pick(o, keys) { const r = {}; for (const k of Object.keys(keys)) r[k] = o[k]; return r; }
plan.sort((a, b) => a.gap - b.gap);
const NAMES = { hp: 'HP', atk: 'ATK', int: 'M.ATK', def: 'DEF', mdef: 'M.DEF' };
for (const p of plan) console.log(`${p.kind.padEnd(5)} ${p.race.padEnd(20)} ${Object.keys(p.after).map(k => `${NAMES[k]} ${p.before[k]}→${p.after[k]}`).join(', ')}  (${p.why}${p.dP != null ? `; POWER ${p.realP}` : ''})`);
console.log(`${plan.length} races: ${plan.filter(p => p.kind === 'up').length} up, ${plan.filter(p => p.kind === 'down').length} down, ${plan.filter(p => p.kind === 'halve').length} halved`);

if (APPLY) {
    const file = REPO + '/data.js';
    let lines = fs.readFileSync(file, 'utf8').split('\n');
    const start = lines.findIndex(l => l.startsWith('const RACE_BASE_STATS = {'));
    for (const p of plan) {
        const i = lines.findIndex((l, j) => j > start && j < start + 200 && l.startsWith(`    '${p.race}':`));
        if (i < 0) { console.log('!! row not found', p.race); continue; }
        let l = lines[i];
        const cut = l.indexOf('}');
        let head = l.slice(0, cut + 1), tail = l.slice(cut + 1);
        for (const [k, v] of Object.entries(p.after)) {
            const re = new RegExp(`(\\b${k}:\\s*)-?\\d+(\\.\\d+)?`);
            if (!re.test(head)) { console.log('!! no key', k, p.race); continue; }
            head = head.replace(re, `$1${v}`);
        }
        const note = `${process.env.LABEL || "LAB LOOP 11-21"} PASS ${PASS}: ${Object.keys(p.after).map(k => `${NAMES[k]} ${p.before[k]}→${p.after[k]}`).join(', ')} (${p.kind === 'halve' ? p.why : (p.obs * 100).toFixed(1) + '% over ' + p.g + ' games'})`;
        tail = tail.includes('//') ? tail.replace(/\s*$/, '') + '; ' + note : tail.replace(/,?\s*$/, '') + ',   // ' + note;
        if (!/^,/.test(tail)) tail = tail; // keep the row's own comma
        lines[i] = head + tail;
        (st.changes[p.race] = st.changes[p.race] || []).push({ pass: PASS, before: p.before, after: p.after, est: p.obs * 100, gap: p.kind === 'halve' ? (p.obs - 0.5) : (p.obs - 0.5), kind: p.kind });
    }
    fs.writeFileSync(file, lines.join('\n'));
    fs.writeFileSync(stateFile, JSON.stringify(st, null, 1));
    console.log('applied to data.js + state');
}
