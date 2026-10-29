#!/usr/bin/env node
// bake-power.js — bake Balance Lab exports into data.js SPELL_POWER_RULES (THE SPELL POWER, mondo 2026-10-29).
//
//   node bake-power.js <ew-balance-stats.json> [<older export.json> …] [--fit] [--fit-stats] [--dry-run]
//
// Rewrites the BAKED-SPELL-POWER block of data.js SPELL_POWER_RULES:
//   elementWr   — every element's win rate, pooled over ALL the exports given (games-weighted; the element ranking holds
//                 run to run, so more runs = less noise);
//   spellWeight — each damaging spell's [damage a cast ÷ its tier's median damage a cast, the row's damage then], from the
//                 NEWEST export only (spells change every pass), pulled toward 1 by spellShrink casts and held inside
//                 spellClamp; the game scales the weight by (row damage now ÷ row damage then), so a trim counts at once;
//   source      — what it was baked from.
// Then reloads data.js and prints how well the POWER score reads the newest export's race win rates (teamAdjusted adjWr):
// r for the statline budget alone vs stats + spells, and the perPoint the fit asks for. --fit writes that perPoint too.
// --fit-stats re-prices the statline (RACE_POWER_WEIGHTS, mondo 2026-10-29 "Re-price from the data"): race win rate =
// stats·w + spells, w ≥ 0, ridge-pulled (λ 20, on standardized stats) toward the 2026-09-07 formula so a stat the lab can't
// read keeps a sane price; prints the left-out-race r.
// Zero dependencies (Node built-ins). Repo-only tooling — never loaded by the game.

'use strict';

const fs = require('fs');
const path = require('path');
const { loadGameData, REPO_ROOT } = require('./load-data');

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));
const FIT = args.includes('--fit'), FIT_STATS = args.includes('--fit-stats'), DRY = args.includes('--dry-run');
if (!files.length) { console.error('usage: node bake-power.js <ew-balance-stats.json> [more exports…] [--fit] [--fit-stats] [--dry-run]'); process.exit(1); }

const exportsIn = files.map(f => {
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (!d || !d.analysis || !d._meta) throw new Error(f + ': not a Balance Lab export (no analysis / _meta)');
    return { file: f, d };
}).sort((a, b) => String(b.d._meta.exportedAt || '').localeCompare(String(a.d._meta.exportedAt || '')));
const newest = exportsIn[0].d;
const DATA = path.join(REPO_ROOT, 'data.js');
let G = loadGameData();
const R = G.SPELL_POWER_RULES;

/* the elements, pooled */
const el = {};
for (const { d } of exportsIn) for (const [k, v] of Object.entries(d.analysis.elements || {})) {
    if (!v || typeof v.wr !== 'number' || !v.games) continue;
    const a = el[k] = el[k] || [0, 0]; a[0] += v.wr * v.games; a[1] += v.games;
}
const elementWr = {};
Object.keys(el).sort().forEach(k => { elementWr[k] = Number((el[k][0] / el[k][1]).toFixed(3)); });

/* the spells, newest export only */
const byName = {};
for (const id of Object.keys(G.SPELL_BY_ID)) { const sp = G.SPELL_BY_ID[id]; if (sp && sp.id === id && sp.name && !byName[sp.name]) byName[sp.name] = id; }
const med = newest.analysis.flags && newest.analysis.flags.tierMedianDmgPerCast || {};
const spellWeight = {};
let unknown = 0;
for (const [name, e] of Object.entries(newest.analysis.spellEfficiency || {})) {
    if (!e || !e.casts || !(e.dmgPerCast > 0) || !e.tier || !med[e.tier]) continue;
    const id = byName[name];
    if (!id) { unknown++; continue; }
    const ratio = e.dmgPerCast / med[e.tier];
    const w = Math.max(R.spellClamp[0], Math.min(R.spellClamp[1], (e.casts * ratio + R.spellShrink) / (e.casts + R.spellShrink)));
    // [weight, the row's damage when the lab saw it]: a later damage edit scales the weight until the next bake
    const row = e.row || {}, then = +row.dmg || +row.hitTotal || +row.dashDamage || 0;   // the export's own row snapshot
    const pw = then > 0 ? then : G.spellElemPower(G.SPELL_BY_ID[id]);
    if (pw > 0) spellWeight[id] = `[${Number(w.toFixed(2))}, ${pw}]`;
}

const matches = exportsIn.map(x => x.d._meta.totalMatches || 0);
const source = `Balance Lab: ${matches.join(' + ')} Arena matches (elements: all ${exportsIn.length}; spells: the newest, ${newest._meta.build || '?'} exported ${String(newest._meta.exportedAt || '').slice(0, 10)})`;
const fmtObj = (o, perLine) => {
    const ks = Object.keys(o).sort();
    if (!ks.length) return '{}';
    const parts = ks.map(k => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${o[k]}`);
    const lines = [];
    for (let i = 0; i < parts.length; i += perLine) lines.push('        ' + parts.slice(i, i + perLine).join(', ') + ',');
    return '{\n' + lines.join('\n') + '\n    }';
};
const block = `/* BAKED-SPELL-POWER:BEGIN (bake-power.js rewrites this block) */
    source: ${JSON.stringify(source)},
    elementWr: ${fmtObj(elementWr, 7)},
    spellWeight: ${fmtObj(spellWeight, 5)},
    /* BAKED-SPELL-POWER:END */`;

let src = fs.readFileSync(DATA, 'utf8');
const re = /\/\* BAKED-SPELL-POWER:BEGIN[\s\S]*?BAKED-SPELL-POWER:END \*\//;
if (!re.test(src)) throw new Error('data.js: no BAKED-SPELL-POWER block');
src = src.replace(re, block);

/* the read: race win rate vs the statline alone, and vs stats + spells */
function corr(xs, ys) {
    const n = xs.length, mx = xs.reduce((a, v) => a + v, 0) / n, my = ys.reduce((a, v) => a + v, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}
function ols2(a, b, y) {   // y = c + p·a + q·b → [p, q]
    const n = y.length, m = v => v.reduce((s, x) => s + x, 0) / n;
    const ma = m(a), mb = m(b), my = m(y);
    let saa = 0, sbb = 0, sab = 0, say = 0, sby = 0;
    for (let i = 0; i < n; i++) { const A = a[i] - ma, B = b[i] - mb, Y = y[i] - my; saa += A * A; sbb += B * B; sab += A * B; say += A * Y; sby += B * Y; }
    const det = saa * sbb - sab * sab;
    return det ? [(say * sbb - sby * sab) / det, (sby * saa - say * sab) / det] : [0, 0];
}
function read(Gx) {
    const ta = newest.analysis.teamAdjusted && newest.analysis.teamAdjusted.races || {};
    const rs = Object.keys(ta).filter(r => Gx.RACE_BASE_STATS[r] && typeof Gx.RACE_BASE_STATS[r].hp === 'number');
    const rg = r => { const k = Gx.raceKit(r); return k && k.range != null ? k.range : 1; };
    const P = rs.map(r => Gx.raceTotalPower(r, rg(r)));
    const y = rs.map(r => ta[r].adjWr);
    const unit = Gx.SPELL_POWER_RULES.perPoint || 1;
    const [p, q] = ols2(P.map(x => x.stats), P.map(x => x.spells / unit), y);
    return { n: rs.length, rStats: corr(P.map(x => x.stats), y), rTotal: corr(P.map(x => x.total), y), fitPerPoint: p > 0 ? q / p : null, rs, P, y };
}


/* THE STAT RE-PRICE: the 2026-09-07 formula is the prior (points per unit) */
const STAT_KEYS = ['hp', 'mp', 'atk', 'int', 'def', 'mdef', 'spd', 'vision', 'crt', 'range'];
const STAT_PRIOR = [1 / 12.5, 1 / 6.7, 1, 1, 1 / 1.5, 1 / 2, 0.8, 2, 1 / 4, 8];
function statRows(Gx, rs) {
    const rg = r => { const k = Gx.raceKit(r); return k && k.range != null ? k.range : 1; };
    return rs.map(r => { const b = Gx.RACE_BASE_STATS[r]; return STAT_KEYS.map(k => k === 'range' ? Math.max(0, rg(r) - 1) : (b[k] || 0)); });
}
function fitStats(X, S, y, lam) {
    const n = y.length, m = X[0].length, mean = v => v.reduce((a, x) => a + x, 0) / v.length;
    const mu = [], sd = [];
    for (let j = 0; j < m; j++) { const c = X.map(r => r[j]); mu[j] = mean(c); sd[j] = Math.sqrt(mean(c.map(v => (v - mu[j]) ** 2))) || 1; }
    const Z = X.map(r => r.map((v, j) => (v - mu[j]) / sd[j]));
    const P0 = X.map((r, i) => r.reduce((a, v, j) => a + v * STAT_PRIOR[j], 0) + S[i]);
    const mP = mean(P0), my = mean(y), mS = mean(S);
    const s = P0.reduce((a, v, i) => a + (v - mP) * (y[i] - my), 0) / P0.reduce((a, v) => a + (v - mP) ** 2, 0);
    const res = y.map((v, i) => v - my - s * (S[i] - mS));
    const b0 = STAT_PRIOR.map((w, j) => s * w * sd[j]);
    const H = [], g = [];
    for (let a = 0; a < m; a++) { H[a] = []; for (let c = 0; c < m; c++) { let t = 0; for (let i = 0; i < n; i++) t += Z[i][a] * Z[i][c]; H[a][c] = t + (a === c ? lam : 0); }
        let t = 0; for (let i = 0; i < n; i++) t += Z[i][a] * res[i]; g[a] = t + lam * b0[a]; }
    let L = 0; for (let a = 0; a < m; a++) L = Math.max(L, H[a].reduce((x, v) => x + Math.abs(v), 0));   // ≥ the top eigenvalue
    let b = b0.slice();
    for (let it = 0; it < 20000; it++) { const nb = b.map((v, a) => Math.max(0, v - (H[a].reduce((x, h, c) => x + h * b[c], 0) - g[a]) / L)); b = nb; }
    return b.map((v, j) => v / sd[j] / s);
}
function corrOf(a, b) { return corr(a, b); }

if (DRY) {
    console.log(block);
} else {
    fs.writeFileSync(DATA, src);
    G = loadGameData();
    let rd = read(G);
    if (FIT && rd.fitPerPoint) {
        const pp = Math.max(10, Math.min(100, Math.round(rd.fitPerPoint / 5) * 5));
        src = fs.readFileSync(DATA, 'utf8').replace(/(const SPELL_POWER_RULES = \{\s*perPoint: )\d+/, '$1' + pp);
        fs.writeFileSync(DATA, src);
        G = loadGameData();
        rd = read(G);
        console.log('perPoint →', pp);
    }
    if (FIT_STATS) {
        const ta = newest.analysis.teamAdjusted && newest.analysis.teamAdjusted.races || {};
        const rs = Object.keys(ta).filter(r => G.RACE_BASE_STATS[r] && typeof G.RACE_BASE_STATS[r].hp === 'number');
        const X = statRows(G, rs), S = rs.map(r => G.raceSpellPower(r).pts), y = rs.map(r => ta[r].adjWr);
        const w = fitStats(X, S, y, 20);
        const P = rs.map((r, i) => X[i].reduce((a, v, j) => a + v * w[j], 0) + S[i]);
        const line = STAT_KEYS.map((k, j) => `${k}: ${Number(w[j].toFixed(k === 'range' ? 0 : 2))}`).join(', ');
        src = fs.readFileSync(DATA, 'utf8').replace(/(BAKED-STAT-POWER:BEGIN[^\n]*\n)[^\n]*\n/, `$1    ${line},\n`);
        fs.writeFileSync(DATA, src);
        G = loadGameData();
        rd = read(G);
        console.log(`stat weights → ${line} (stats + spells in-sample r ${corrOf(P, y).toFixed(3)})`);
    }
    console.log(source);
    console.log(`elements: ${Object.entries(elementWr).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · ')}`);
    console.log(`spell weights: ${Object.keys(spellWeight).length} damaging spells measured (${unknown} export names not found in data.js)`);
    console.log(`race win rate (teamAdjusted, ${rd.n} races) vs statline alone r = ${rd.rStats.toFixed(3)}, vs POWER (stats + spells) r = ${rd.rTotal.toFixed(3)}; the fit asks perPoint ≈ ${rd.fitPerPoint ? rd.fitPerPoint.toFixed(0) : '—'} (now ${G.SPELL_POWER_RULES.perPoint}${FIT ? '' : ', --fit writes it'})`);
    console.log('wrote data.js — node --check it, then ship it per RULE #1');
}
