// tools/check-grades.js — roster letter-grade sheet (STAT_REWORK.md phase 1).
//
// Prints every race's statline as letters (race × stat grades) over the REAL
// data.js values via load-data.js — the instant view of who has too many A/S
// columns, and the map for the later per-unit tuning pass. Also flags:
//   • any stat outside its ruler domain (core stats must sit in 0–100ish),
//   • HP/MP band crowding (>35% of the roster in one band means the bespoke
//     bands need re-anchoring against a fresh §2 distribution),
//   • the grade histogram per stat (the top-heavy lumps the tuning pass
//     should spread across 81–100 so S actually discriminates).
//
// Repo-only tooling (RULE #1 allows it) — run with `npm run grades`.

'use strict';

const { loadGameData } = require('./load-data');

const D = loadGameData();
const { RACE_BASE_STATS, STAT_GRADE_BANDS, STAT_GRADE_LETTERS, moveFromSpd } = D;

if (!RACE_BASE_STATS || !STAT_GRADE_BANDS || typeof D.statGrade !== 'function') {
    console.error('data.js is missing RACE_BASE_STATS / STAT_GRADE_BANDS / statGrade');
    process.exit(1);
}
const statGrade = D.statGrade;

const CORE = ['atk', 'int', 'def', 'mdef', 'spd', 'awr'];
const COLS = ['hp', 'mp', ...CORE];
const races = Object.keys(RACE_BASE_STATS);

let failures = 0;
const fail = msg => { failures++; console.error('  ✗ ' + msg); };

// ── grade sheet ────────────────────────────────────────────────────────────
const head = 'race'.padEnd(22) + COLS.map(c => c.toUpperCase().padStart(6)).join('') + '  MOV';
console.log(head);
console.log('─'.repeat(head.length));
for (const race of races) {
    const st = RACE_BASE_STATS[race];
    const row = COLS.map(c => {
        const v = st[c] ?? 0;
        return `${String(v).padStart(3)} ${statGrade(c, v) || '·'}`.padStart(6);
    }).join('');
    const mov = typeof moveFromSpd === 'function' ? moveFromSpd(st.spd) : Math.ceil(st.spd / 20);
    console.log(race.padEnd(22) + row + String(mov).padStart(5));
}

// ── histograms ─────────────────────────────────────────────────────────────
console.log('\ngrade histogram (races per band):');
console.log('stat'.padEnd(6) + ['S', 'A', 'B', 'C', 'F'].map(l => l.padStart(5)).join(''));
const hists = {};
for (const c of COLS) {
    const h = { S: 0, A: 0, B: 0, C: 0, F: 0 };
    for (const race of races) h[statGrade(c, RACE_BASE_STATS[race][c] ?? 0)]++;
    hists[c] = h;
    console.log(c.padEnd(6) + ['S', 'A', 'B', 'C', 'F'].map(l => String(h[l]).padStart(5)).join(''));
}

// ── invariants ─────────────────────────────────────────────────────────────
console.log('\nchecks:');
for (const race of races) {
    const st = RACE_BASE_STATS[race];
    for (const c of CORE) {
        const v = st[c] ?? 0;
        // atk/int keep their historic 0–104 headroom, and def/mdef may land a
        // point or two past 100 from the armor-parity rounding of the ×1.2/×1.6
        // migration (the stage clamp widens for bases past 100, so this is
        // safe); spd/awr must fit the ruler exactly.
        const hi = (c === 'spd' || c === 'awr') ? 100 : 104;
        if (v < 0 || v > hi) fail(`${race} ${c}=${v} outside 0–${hi}`);
    }
    if (st.spd < 1) fail(`${race} spd=${st.spd} below the SPD floor of 1`);
    if (st.move !== undefined) fail(`${race} still carries a stored 'move' — MOV derives from SPD now`);
}
for (const pool of ['hp', 'mp']) {
    const h = hists[pool];
    for (const l of Object.keys(h)) {
        if (h[l] / races.length > 0.35) {
            fail(`${pool.toUpperCase()} band ${l} holds ${h[l]}/${races.length} races (>35%) — re-anchor STAT_GRADE_BANDS.${pool} against a fresh distribution`);
        }
    }
}
if (!failures) console.log('  ✓ all ' + races.length + ' races inside the ruler; move derives cleanly; HP/MP bands balanced');
process.exit(failures ? 1 : 0);
