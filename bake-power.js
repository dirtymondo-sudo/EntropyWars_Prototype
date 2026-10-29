#!/usr/bin/env node
// bake-power.js — bake Balance Lab exports into data.js SPELL_POWER_RULES (THE SPELL POWER, mondo 2026-10-29).
//
//   node bake-power.js <ew-balance-stats.json> [<older export.json> …] [--fit-stats] [--fit-on=2] [--dry-run]
//
// Rewrites the BAKED-SPELL-POWER block of data.js SPELL_POWER_RULES:
//   elementWr   — every element's win rate, pooled over ALL the exports given (games-weighted; the element ranking holds
//                 run to run, so more runs = less noise);
//   spellWeight — each damaging spell's [damage a cast ÷ its tier's median damage a cast, the row's damage then], from the
//                 NEWEST export only (spells change every pass), pulled toward 1 by spellShrink casts and held inside
//                 spellClamp; the game scales the weight by (row damage now ÷ row damage then), so a trim counts at once;
//   source      — what it was baked from.
// and the BAKED-TRAIT-POWER block of POWER_TRAIT_RULES (the passives part, pooled over ALL the exports): physShare (the
// physical part of all lab damage: basics + physical spells + otherPhysShare of the rest), elementShare (each element's part of
// all lab damage), elemPart (how much of an elemental hit is element: spellElemShare, damage-weighted), basicDmgPerGame and
// avgRounds.
// Then reloads data.js and prints how well POWER reads each export's race win rates (teamAdjusted adjWr), each race on the
// statline that export played (its own base snapshot).
// --fit-stats (mondo 2026-10-29: "Re-price from the data", then "make it more accurate and robust ... include passives") re-prices
// RACE_POWER_WEIGHTS and SPELL_POWER_RULES.perPoint on the newest --fit-on exports (default 2: older ones played spell rows that
// are gone) at once: race win rate = effective statline (racePowerStats:
// passives + affinities in) · w + spells · q, every row weighted by its games, ridge-pulled (LAMBDA, standardized) toward the
// 2026-09-07 formula, never below 0, on the fixed scale of 2500 points = 100 % win rate. It prints the held-out read before and
// after: fit on one export → read another, and each race left out of the fit (both its rows) → read it.
// Zero dependencies (Node built-ins). Repo-only tooling — never loaded by the game.

'use strict';

const fs = require('fs');
const path = require('path');
const { loadGameData, REPO_ROOT } = require('./load-data');

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));
const FIT_STATS = args.includes('--fit-stats') || args.includes('--fit'), DRY = args.includes('--dry-run');
const FIT_ON = Math.max(1, +((args.find(a => a.startsWith('--fit-on=')) || '').split('=')[1]) || 2);   // the stat fit reads the newest N exports
if (!files.length) { console.error('usage: node bake-power.js <ew-balance-stats.json> [more exports…] [--fit-stats] [--dry-run]'); process.exit(1); }

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

/* the passives part's lab shares, pooled */
const T = G.POWER_TRAIT_RULES;
let dPhys = 0, dMag = 0, dBasic = 0, dOther = 0, dDot = 0, dSpell = 0, ug = 0, eShare = 0, eW = 0, rounds = 0, nm = 0;
const elDmg = {}; let elTot = 0;
for (const { d } of exportsIn) {
    const st = d.stats || {};
    for (const [name, u] of Object.entries(st.spellUse || {})) {
        const sp = byName[name] && G.SPELL_BY_ID[byName[name]];
        if (!sp || !(u.dmg > 0)) continue;
        if (sp.damageType === 'physical') dPhys += u.dmg; else dMag += u.dmg;
        if (sp.element && sp.element !== '(none)') { eShare += u.dmg * G.spellElemShare(sp); eW += u.dmg; }
    }
    for (const v of Object.values(st.raceDetail || {})) { dBasic += v.dmgBasic || 0; dOther += v.dmgOther || 0; dDot += v.dmgDot || 0; dSpell += v.dmgSpell || 0; ug += v.games || 0; }
    for (const [e, v] of Object.entries(st.elementUse || {})) { if (e !== '(none)') elDmg[e] = (elDmg[e] || 0) + (v.dmg || 0); elTot += v.dmg || 0; }
    rounds += (d.analysis.avgRounds || 0) * (d._meta.totalMatches || 0); nm += d._meta.totalMatches || 0;
}
const dAll = dBasic + dOther + dDot + dSpell;
const elementShare = {};
Object.keys(elDmg).sort().forEach(e => { elementShare[e] = Number((elDmg[e] / elTot).toFixed(3)); });
const physShare = dAll ? (dBasic + dSpell * (dPhys / Math.max(1, dPhys + dMag)) + dOther * T.otherPhysShare) / dAll : T.physShare;
const traitBlock = `/* BAKED-TRAIT-POWER:BEGIN (bake-power.js rewrites this block) */
    physShare: ${Number(physShare.toFixed(3))}, elemPart: ${eW ? Number((eShare / eW).toFixed(3)) : T.elemPart}, basicDmgPerGame: ${ug ? Math.round(dBasic / ug) : T.basicDmgPerGame}, avgRounds: ${nm ? Number((rounds / nm).toFixed(1)) : T.avgRounds},
    elementShare: ${fmtObj(elementShare, 7)},
    /* BAKED-TRAIT-POWER:END */`;

let src = fs.readFileSync(DATA, 'utf8');
const re = /\/\* BAKED-SPELL-POWER:BEGIN[\s\S]*?BAKED-SPELL-POWER:END \*\//;
if (!re.test(src)) throw new Error('data.js: no BAKED-SPELL-POWER block');
src = src.replace(re, block);
const reT = /\/\* BAKED-TRAIT-POWER:BEGIN[\s\S]*?BAKED-TRAIT-POWER:END \*\//;
if (!reT.test(src)) throw new Error('data.js: no BAKED-TRAIT-POWER block');
src = src.replace(reT, traitBlock);

/* the read: each export's race win rates vs POWER, every race on the statline that export played */
const LAMBDA = 0.1, SCALE = 2500;   // ridge strength on standardized columns; POWER points per 1.0 of win rate
const STAT_KEYS = ['hp', 'mp', 'atk', 'int', 'def', 'mdef', 'spd', 'vision', 'crt', 'range'];
const PRIOR = [1 / 12.5, 1 / 6.7, 1, 1, 1 / 1.5, 1 / 2, 0.8, 2, 1 / 4, 8, 50];   // the 2026-09-07 formula + the STATS24 perPoint (50)
function corr(xs, ys, ws) {
    ws = ws || xs.map(() => 1);
    const W = ws.reduce((a, v) => a + v, 0), mx = xs.reduce((a, v, i) => a + v * ws[i], 0) / W, my = ys.reduce((a, v, i) => a + v * ws[i], 0) / W;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < xs.length; i++) { sxy += ws[i] * (xs[i] - mx) * (ys[i] - my); sxx += ws[i] * (xs[i] - mx) ** 2; syy += ws[i] * (ys[i] - my) ** 2; }
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}
// one row per (export, race): the statline that export played, its team-adjusted win rate and games
function labRows(Gx) {
    const out = [];
    exportsIn.slice(0, FIT_ON).forEach(({ d }, ei) => {
        const ta = d.analysis.teamAdjusted && d.analysis.teamAdjusted.races || {};
        for (const r of Object.keys(ta)) {
            if (!Gx.RACE_BASE_STATS[r] || typeof Gx.RACE_BASE_STATS[r].hp !== 'number') continue;
            const snap = d.analysis.races && d.analysis.races[r] && d.analysis.races[r].base;
            const kit = Gx.raceKit(r);
            const stats = snap && typeof snap.hp === 'number' ? snap : Gx.RACE_BASE_STATS[r];
            const range = snap && snap.range != null ? snap.range : (kit && kit.range != null ? kit.range : 1);
            out.push({ ex: ei, race: r, y: ta[r].adjWr, n: ta[r].n || 1, stats, range });
        }
    });
    return out;
}
function features(Gx, x) {
    const e = Gx.racePowerStats(x.race, x.stats, x.range);
    return STAT_KEYS.map(k => k === 'range' ? Math.max(0, e.range - 1) : e.stats[k]).concat([Gx.raceSpellPower(x.race).pts / Gx.SPELL_POWER_RULES.perPoint]);   // spells per 1 perPoint
}
// weighted ridge toward the prior (standardized columns), coefficients ≥ 0 → points per unit on SCALE
function fitRows(X, rows) {
    const y = rows.map(x => x.y), w = rows.map(x => x.n), W = w.reduce((a, v) => a + v, 0), n = X.length, m = X[0].length;
    const mean = c => c.reduce((a, v, i) => a + v * w[i], 0) / W;
    const mu = [], sd = [];
    for (let j = 0; j < m; j++) { const c = X.map(r => r[j]); mu[j] = mean(c); sd[j] = Math.sqrt(mean(c.map(v => (v - mu[j]) ** 2))) || 1; }
    const Z = X.map(r => r.map((v, j) => (v - mu[j]) / sd[j])), my = mean(y);
    const P0 = X.map(r => r.reduce((a, v, j) => a + v * PRIOR[j], 0)), mP = mean(P0);
    const s = P0.reduce((a, v, i) => a + w[i] * (v - mP) * (y[i] - my), 0) / P0.reduce((a, v, i) => a + w[i] * (v - mP) ** 2, 0);
    const b0 = PRIOR.map((p, j) => s * p * sd[j]);
    const H = [], g = [];
    for (let a = 0; a < m; a++) {
        H[a] = [];
        for (let c = 0; c < m; c++) { let t = 0; for (let i = 0; i < n; i++) t += w[i] * Z[i][a] * Z[i][c]; H[a][c] = t / W + (a === c ? LAMBDA : 0); }
        let t = 0; for (let i = 0; i < n; i++) t += w[i] * Z[i][a] * (y[i] - my); g[a] = t / W + LAMBDA * b0[a];
    }
    let L = 0; for (let a = 0; a < m; a++) L = Math.max(L, H[a].reduce((x, v) => x + Math.abs(v), 0));   // ≥ the top eigenvalue
    let b = b0.slice();
    for (let it = 0; it < 8000; it++) b = b.map((v, a) => Math.max(0, v - (H[a].reduce((x, h, c) => x + h * b[c], 0) - g[a]) / L));
    return b.map((v, j) => v / sd[j] * SCALE);
}
const dot = (r, w) => r.reduce((a, v, j) => a + v * w[j], 0);
function heldOut(Gx, rows, X) {   // [per export: fit on the others → read it], [per export: each race left out → read it]
    const used = exportsIn.slice(0, FIT_ON);
    const cross = used.length > 1 ? used.map((_, ei) => {
        const tr = rows.map((x, i) => i).filter(i => rows[i].ex !== ei), te = rows.map((x, i) => i).filter(i => rows[i].ex === ei);
        const w = fitRows(tr.map(i => X[i]), tr.map(i => rows[i]));
        return corr(te.map(i => dot(X[i], w)), te.map(i => rows[i].y), te.map(i => rows[i].n));
    }) : [];
    const pred = new Array(rows.length);
    for (const r of new Set(rows.map(x => x.race))) {
        const tr = rows.map((x, i) => i).filter(i => rows[i].race !== r);
        const w = fitRows(tr.map(i => X[i]), tr.map(i => rows[i]));
        rows.forEach((x, i) => { if (x.race === r) pred[i] = dot(X[i], w); });
    }
    const loro = used.map((_, ei) => { const te = rows.map((x, i) => i).filter(i => rows[i].ex === ei); return corr(te.map(i => pred[i]), te.map(i => rows[i].y), te.map(i => rows[i].n)); });
    return { cross, loro };
}
function read(Gx) {   // the POWER as it stands vs each export
    const rows = labRows(Gx);
    return exportsIn.slice(0, FIT_ON).map((_, ei) => { const rs = rows.filter(x => x.ex === ei); return corr(rs.map(x => Gx.raceTotalPower(x.race, x.range, x.stats).total), rs.map(x => x.y), rs.map(x => x.n)); });
}
const fmtR = a => a.map((v, i) => `${exportsIn[i].d._meta.build || 'export ' + (i + 1)} ${v.toFixed(3)}`).join(' · ');

if (DRY) {
    console.log(block);
    console.log(traitBlock);
} else {
    const before = read(G);
    fs.writeFileSync(DATA, src);
    G = loadGameData();
    if (FIT_STATS) {
        const rows = labRows(G), X = rows.map(x => features(G, x));
        const ho0 = heldOut(G, rows, X.map(r => r.slice()));
        const w = fitRows(X, rows);
        const line = STAT_KEYS.map((k, j) => `${k}: ${Number(w[j].toFixed(k === 'range' ? 0 : 2))}`).join(', ');
        const pp = Math.max(10, Math.min(200, Math.round(w[STAT_KEYS.length])));
        src = fs.readFileSync(DATA, 'utf8').replace(/(BAKED-STAT-POWER:BEGIN[^\n]*\n)[^\n]*\n/, `$1    ${line},\n`)
            .replace(/(const SPELL_POWER_RULES = \{\s*perPoint: )\d+/, '$1' + pp);
        fs.writeFileSync(DATA, src);
        console.log(`stat weights → ${line}; spells perPoint → ${pp}`);
        console.log(`held out (fit on the other exports → this one): ${fmtR(ho0.cross)}`);
        console.log(`held out (each race left out of the fit):        ${fmtR(ho0.loro)}`);
        G = loadGameData();
    }
    console.log(source);
    console.log(`elements: ${Object.entries(elementWr).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · ')}`);
    console.log(`spell weights: ${Object.keys(spellWeight).length} damaging spells measured (${unknown} export names not found in data.js)`);
    console.log(`passives part: ${traitBlock.split('\n')[1].trim()}`);
    console.log(`POWER vs race win rate (teamAdjusted, each race on the statline that export played), in sample: before ${fmtR(before)}; now ${fmtR(read(G))}`);
    console.log('wrote data.js — node --check it, then ship it per RULE #1');
}
