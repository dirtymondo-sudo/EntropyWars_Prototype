#!/usr/bin/env node
// bake-power.js — bake Balance Lab exports into data.js SPELL_POWER_RULES (THE SPELL POWER, mondo 2026-10-29).
//
//   node bake-power.js <ew-balance-stats.json> [<older export.json> …] [--fit] [--dry-run]
//
// Rewrites the BAKED-SPELL-POWER block of data.js SPELL_POWER_RULES:
//   elementWr   — every element's win rate, pooled over ALL the exports given (games-weighted; the element ranking holds
//                 run to run, so more runs = less noise);
//   spellWeight — each damaging spell's damage a cast ÷ its tier's median damage a cast, from the NEWEST export only
//                 (spells change every pass), pulled toward 1 by spellShrink casts and held inside spellClamp;
//   source      — what it was baked from.
// Then reloads data.js and prints how well the POWER score reads the newest export's race win rates (teamAdjusted adjWr):
// r for the statline budget alone vs stats + spells, and the perPoint the fit asks for. --fit writes that perPoint too.
// Zero dependencies (Node built-ins). Repo-only tooling — never loaded by the game.

'use strict';

const fs = require('fs');
const path = require('path');
const { loadGameData, REPO_ROOT } = require('./load-data');

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));
const FIT = args.includes('--fit'), DRY = args.includes('--dry-run');
if (!files.length) { console.error('usage: node bake-power.js <ew-balance-stats.json> [more exports…] [--fit] [--dry-run]'); process.exit(1); }

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
    if (Math.abs(w - 1) >= 0.01) spellWeight[id] = Number(w.toFixed(2));
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
    spellWeight: ${fmtObj(spellWeight, 6)},
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
    console.log(source);
    console.log(`elements: ${Object.entries(elementWr).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · ')}`);
    console.log(`spell weights: ${Object.keys(spellWeight).length} spells off 1 (${unknown} export names not found in data.js)`);
    console.log(`race win rate (teamAdjusted, ${rd.n} races) vs statline alone r = ${rd.rStats.toFixed(3)}, vs POWER (stats + spells) r = ${rd.rTotal.toFixed(3)}; the fit asks perPoint ≈ ${rd.fitPerPoint ? rd.fitPerPoint.toFixed(0) : '—'} (now ${G.SPELL_POWER_RULES.perPoint}${FIT ? '' : ', --fit writes it'})`);
    console.log('wrote data.js — node --check it, then ship it per RULE #1');
}
