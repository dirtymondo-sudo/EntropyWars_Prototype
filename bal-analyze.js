// node analyze.js <run dir> [more run dirs] [--json out.json]
// Merges every worker's balance stats match log and reads each race's raw + team-adjusted win rate.
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const dirs = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--json');
let log = [];
const raceDetail = {};
for (const d of dirs) for (const f of fs.readdirSync(d).filter(f => /^worker-\d+(c\d+)?\.json$/.test(f))) {
    const s = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')).stats;
    if (!s) continue;
    log.push(...s.matchLog.filter(m => m && m.teams && (m.winner === 1 || m.winner === 2)));
    for (const [r, v] of Object.entries(s.raceDetail || {})) {
        const t = raceDetail[r] || (raceDetail[r] = {});
        for (const [k, x] of Object.entries(v)) if (typeof x === 'number') t[k] = (t[k] || 0) + x;
    }
}
// raw
const raw = {};
const spells = {};
for (const m of log) for (const p of [1, 2]) for (const u of m.teams[p] || []) {
    if (!u || !u.race) continue;
    const r = raw[u.race] || (raw[u.race] = { g: 0, w: 0, k: 0, dead: 0, dmg: 0 });
    r.g++; if (m.winner === p) r.w++; r.k += u.k || 0; r.dead += u.dead || 0; r.dmg += u.dmg || 0;
    for (const sp of u.spells || []) { const t = spells[sp] || (spells[sp] = { g: 0, w: 0, races: {} }); t.g++; if (m.winner === p) t.w++; t.races[u.race] = 1; }
}
// team-adjusted ridge logistic (same as battle.js _balTeamAdjusted, LAMBDA 2) + side term
const names = Object.keys(raw), idx = Object.fromEntries(names.map((r, i) => [r, i]));
const X = log.map(m => { const x = {}; for (const p of [1, 2]) for (const u of m.teams[p] || []) if (u && u.race) x[idx[u.race]] = (x[idx[u.race]] || 0) + (p === 1 ? 1 : -1); return x; });
const y = log.map(m => m.winner === 1 ? 1 : 0);
const n = names.length, beta = new Float64Array(n), LAMBDA = 2;
let H = new Float64Array(n);
for (let it = 0; it < 80; it++) {
    const g = new Float64Array(n); H = new Float64Array(n);
    for (let i = 0; i < X.length; i++) {
        let z = 0; const x = X[i]; for (const j in x) z += beta[j] * x[j];
        const p = 1 / (1 + Math.exp(-z)), w = p * (1 - p), r = y[i] - p;
        for (const j in x) { g[j] += r * x[j]; H[j] += w * x[j] * x[j]; }
    }
    for (let j = 0; j < n; j++) beta[j] += 0.7 * (g[j] - LAMBDA * beta[j]) / (H[j] + LAMBDA);
}
const sig = v => 1 / (1 + Math.exp(-v));
const rows = names.map((r, j) => ({ race: r, g: raw[r].g, wr: raw[r].w / raw[r].g, adj: sig(beta[j]), se: 1 / Math.sqrt(H[j] + LAMBDA),
    kpg: raw[r].k / raw[r].g, dpg: raw[r].dead / raw[r].g, dmg: raw[r].dmg / raw[r].g }));
rows.forEach(r => r.score = (r.wr + r.adj) / 2);
rows.sort((a, b) => b.score - a.score);
const wc = {}; for (const m of log) wc[m.wc] = (wc[m.wc] || 0) + 1;
const gs = rows.map(r => r.g);
console.log(`matches ${log.length} · races ${rows.length} · games/race min ${Math.min(...gs)} median ${gs.sort((a, b) => a - b)[gs.length >> 1]} · ends ${JSON.stringify(wc)}`);
const sd = Math.sqrt(rows.reduce((a, r) => a + (r.wr - 0.5) ** 2, 0) / rows.length);
const noise = Math.sqrt(0.25 / (log.length * 8 / rows.length));
console.log(`raw WR sd ${(sd * 100).toFixed(1)} pts · sampling noise ~${(noise * 100).toFixed(1)} pts · true spread ~${(Math.sqrt(Math.max(0, sd * sd - noise * noise)) * 100).toFixed(1)} pts`);
const fmt = r => `${r.race.padEnd(22)} g${String(r.g).padStart(4)}  raw ${(r.wr * 100).toFixed(0).padStart(3)}%  adj ${(r.adj * 100).toFixed(0).padStart(3)}%  K/g ${r.kpg.toFixed(2)} D/g ${r.dpg.toFixed(2)} dmg ${Math.round(r.dmg)}`;
for (const r of rows) console.log(fmt(r));
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ matches: log.length, rows, spells, raceDetail }, null, 1));
