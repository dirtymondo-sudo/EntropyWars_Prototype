// tools/check-grades.js — roster letter-grade sheet (STAT_REWORK.md phase 1)
// + the CHAMP REWORK power-budget and role-constraint checks (2026-09-07,
//   CHAMP_REWORK_PLAN.md §2–§3). Fails when a race drifts out of the budget
//   band or a champ stops meeting the words it was designed from.
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

/* ══════════ POWER BUDGET (CHAMP_REWORK_PLAN.md §2.3) ══════════════════════
   One number per race, in ATK-equivalents. Every race must sit inside
   BUDGET_TARGET ± BUDGET_TOL — "none too overpowered or underpowered when it
   comes to stats", quantified. SPD is priced at 0.8/pt (16 per tile) because
   since the 2026-08-29 rework it is movement AND initiative. Basic-attack
   range comes from the race's default job kit and is priced too; identity
   passives carry a flat allowance (live PASSIVE_DEFS ids in PASSIVE_VALUE,
   not-yet-shipped ones per race in PLANNED_PASSIVE_ALLOWANCE — delete a
   planned row the day its passive lands in RACE_PASSIVES so it isn't counted
   twice). Werewolf: the stored line is the DAY form; the night stages below
   are averaged in so the beast's cost is honest. */
const BUDGET_W = { hp: 1 / 12.5, mp: 1 / 6.7, atk: 1, int: 1, def: 1 / 1.5, mdef: 1 / 2, spd: 0.8, awr: 1 / 14 };
const BUDGET_TARGET = 262, BUDGET_TOL = 0.05;
const RANGE_VALUE = 8;                     // per point of job-kit basic-attack range above 1
const PASSIVE_VALUE = {                    // live PASSIVE_DEFS ids
    flying: 10, spectralPassage: 6, hemophage: 6, thermalRegen: 4,
    manAtArms: 2, unquietMind: 2, fractalMind: 2, sereneMind: 2,
};
const PLANNED_PASSIVE_ALLOWANCE = {        // CHAMP_REWORK_PLAN §5.2 — remove rows as they ship
    ghost: 12,             // incorporeal (18) replaces spectralPassage (6)
    werewolf: 8,           // bloodcraze (lycanthropy itself is priced via the night stages)
    skeleton: 6,           // boneDeep
    dinosaur: 8,           // reach
    zombie: 10,            // returnOfTheDead
    bigfoot: 10,           // cryptid
    gangster: 8,           // shank
    ghoul: 12,             // pureNegativity
    robinhood: 12,         // serrated
    marksman: 48,          // longshot (40) + pointBlank (8)
    'black goo': 8,        // oozing
    cyborg: -6,            // powerCore (spells cost double, MP back from hits)
    'mad scientist': 14,   // madGenius (6) + rayGun (8)
    fairy: 4,              // fairyDustTrail (already coded, never budgeted)
    dragon: 8,             // dragonReach
    nun: 8,                // devout
    cowboy: 4,             // quickdraw (speed-tie priority)
};
const WEREWOLF_NIGHT_STAGES = { atk: 2, spd: 3, def: 2, mdef: 1 };
const SKY_RACES = ['fairy', 'shadow entity', 'ai', 'angel', 'seraphim', 'orb of light', 'demon', 'mech', 'ghost',
    'annunaki', 'gargoyle', 'djinn', 'mothman', 'glitch', 'demon prince', 'demon princess', 'fallen angel', 'cyborg',
    'nephilim', 'vampire', 'superhero', 'antihero', 'chosen one', 'dragon', 'occulus', 'valkraye', 'watcher', 'telepath'];
const JOB_KITS = D.JOB_KITS || { Gunslinger: { range: 2 }, Agent: { range: 2 }, Psychic: { range: 2 }, Sniper: { range: 3 } };

function kitRange(race) {
    const job = (D.RACE_DEFAULT_JOBS || {})[race];
    return (JOB_KITS[job] && JOB_KITS[job].range) || 1;
}
function passiveAllowance(race) {
    let v = SKY_RACES.includes(race) ? PASSIVE_VALUE.flying : 0;
    if (PLANNED_PASSIVE_ALLOWANCE[race] != null) {
        v += PLANNED_PASSIVE_ALLOWANCE[race];
        // a planned row REPLACES the live passive list for that race (ghost's
        // spectralPassage is folded into incorporeal, etc.)
        return v;
    }
    for (const id of ((D.RACE_PASSIVES || {})[race] || [])) v += PASSIVE_VALUE[id] || 0;
    return v;
}
function staged(st, stages) {
    const o = Object.assign({}, st);
    for (const k of Object.keys(stages)) o[k] = Math.max(k === 'spd' ? 1 : 0, Math.min(100, (o[k] || 0) + 20 * stages[k]));
    return o;
}
function statBudget(race, st) {
    let b = 0;
    for (const k of Object.keys(BUDGET_W)) b += (st[k] || 0) * BUDGET_W[k];
    return b + (kitRange(race) - 1) * RANGE_VALUE + passiveAllowance(race);
}
function raceBudget(race) {
    const st = RACE_BASE_STATS[race];
    const day = statBudget(race, st);
    if (race === 'werewolf') return (day + statBudget(race, staged(st, WEREWOLF_NIGHT_STAGES))) / 2;
    return day;
}

console.log('\npower budget (target ' + BUDGET_TARGET + ' ±' + Math.round(BUDGET_TOL * 100) + '%):');
const lo = BUDGET_TARGET * (1 - BUDGET_TOL), hi = BUDGET_TARGET * (1 + BUDGET_TOL);
const budgets = races.map(r => ({ r, b: raceBudget(r) })).sort((a, b) => b.b - a.b);
const bMean = budgets.reduce((a, x) => a + x.b, 0) / budgets.length;
const bSd = Math.sqrt(budgets.reduce((a, x) => a + (x.b - bMean) ** 2, 0) / budgets.length);
console.log('  mean ' + bMean.toFixed(1) + ' · sd ' + bSd.toFixed(1) + ' · top: '
    + budgets.slice(0, 5).map(x => `${x.r} ${x.b.toFixed(0)}`).join(', ')
    + ' · bottom: ' + budgets.slice(-5).map(x => `${x.r} ${x.b.toFixed(0)}`).join(', '));
for (const { r, b } of budgets) {
    const rb = Math.round(b);
    if (rb < Math.round(lo) || rb > Math.round(hi)) fail(`${r} power budget ${rb} outside ${Math.round(lo)}–${Math.round(hi)} (re-tune, or price its passive/kit honestly)`);
}

/* ══════════ ROLE CONSTRAINTS (CHAMP_REWORK_PLAN.md §2.4) ═══════════════════
   The owner's comparative notes, made checkable. Letter bands: F ≤20 · C
   21–40 · B 41–60 · A 61–80 · S 81+. Each row is [race, description, test]. */
const S = RACE_BASE_STATS;
const has = r => !!S[r];
const F = v => v <= 20, C = v => v >= 21 && v <= 40, B = v => v >= 41 && v <= 60, A = v => v >= 61 && v <= 80, Sg = v => v >= 81;
const Bp = v => v >= 41, Ap = v => v >= 61, Cm = v => v <= 40;
const night = has('werewolf') ? staged(S.werewolf, WEREWOLF_NIGHT_STAGES) : null;
const CONSTRAINTS = [
    ['quarterback', 'kinda fast (A) · high ATK (≥78) · low M.ATK (F) · low DEF+M.DEF (C) · long range (Sniper kit 3)',
        r => A(S[r].spd) && S[r].atk >= 78 && F(S[r].int) && Cm(S[r].def) && Cm(S[r].mdef) && kitRange(r) === 3],
    ['honda civic', 'car form: one of the fastest (S) · high ATK (A+) · high DEF (A+) · low M.DEF (C) · melee',
        r => Sg(S[r].spd) && Ap(S[r].atk) && Ap(S[r].def) && Cm(S[r].mdef) && kitRange(r) === 1],
    ['santa clause', 'decent HP (≥540) · M.DEF > DEF, both decent (B+) · high M.ATK (A+) · kinda low ATK (C) · not fast (C)',
        r => S[r].hp >= 540 && S[r].mdef > S[r].def && Bp(S[r].def) && Bp(S[r].mdef) && Ap(S[r].int) && C(S[r].atk) && C(S[r].spd)],
    ['yeti', 'like Santa but MORE ATK and SPD, less M.ATK; M.DEF > DEF',
        r => has('santa clause') && S[r].atk > S['santa clause'].atk && S[r].spd > S['santa clause'].spd && S[r].int < S['santa clause'].int && S[r].mdef > S[r].def],
    ['werewolf', 'DAY: low ATK (≤60) and C speed · NIGHT: S ATK, S SPD (5 tiles), A+ DEF',
        r => S[r].atk <= 60 && C(S[r].spd) && Sg(night.atk) && Sg(night.spd) && Ap(night.def)],
    ['ghost', '0 ATK · low M.DEF (C) · decent SPD (B)',
        r => S[r].atk === 0 && Cm(S[r].mdef) && B(S[r].spd)],
    ['dragon', 'decent ATK/M.ATK/SPD/M.DEF (all B+) · decent HP (≥540) · lower DEF (C, below M.DEF)',
        r => Bp(S[r].atk) && Bp(S[r].int) && Bp(S[r].spd) && Bp(S[r].mdef) && S[r].hp >= 540 && C(S[r].def) && S[r].def < S[r].mdef],
    ['demon', 'mid ATK (B) · high M.ATK (A+) · low SPD (C) · melee kit',
        r => B(S[r].atk) && Ap(S[r].int) && C(S[r].spd) && kitRange(r) === 1],
    ['shaman', 'squishy (HP ≤480) · low SPD (C) · high M.ATK (S) · low ATK (F)',
        r => S[r].hp <= 480 && C(S[r].spd) && Sg(S[r].int) && F(S[r].atk)],
    ['ki fighter', 'strong ATK (S) · decent M.ATK (B) · kinda slow (C) · ok DEF/M.DEF/HP (B / 540–620) · melee',
        r => Sg(S[r].atk) && B(S[r].int) && C(S[r].spd) && B(S[r].def) && B(S[r].mdef) && S[r].hp >= 540 && S[r].hp <= 620 && kitRange(r) === 1],
    ['marksman', 'TERRIBLE HP (<460), DEF, M.DEF (F) · no M.ATK (F) · terrible movement (F) · decent-high ATK (A) · longest kit range',
        r => S[r].hp < 460 && F(S[r].def) && F(S[r].mdef) && F(S[r].int) && F(S[r].spd) && A(S[r].atk) && kitRange(r) === 3],
    ['atlantean', 'decent HP (≥540) · low DEF+M.DEF (C) · slow (C) but faster than marksman · good ATK and M.ATK (A) · melee',
        r => S[r].hp >= 540 && C(S[r].def) && C(S[r].mdef) && C(S[r].spd) && S[r].spd > S.marksman.spd && A(S[r].atk) && A(S[r].int) && kitRange(r) === 1],
    ['skeleton', 'decent HP (≥540) · good M.DEF (A) · meh DEF (C) · sword ATK (A) and spell M.ATK (B)',
        r => S[r].hp >= 540 && A(S[r].mdef) && C(S[r].def) && A(S[r].atk) && B(S[r].int)],
    ['dinosaur', 'high HP (≥700) · high DEF (A+) · decent SPD (B) · meh M.DEF (C) · no M.ATK (F)',
        r => S[r].hp >= 700 && Ap(S[r].def) && B(S[r].spd) && C(S[r].mdef) && F(S[r].int)],
    ['cowboy', 'decent HP (≥540) · low DEF+M.DEF (C) · good movement (A) · low ATK (C) · little M.ATK (≤30)',
        r => S[r].hp >= 540 && C(S[r].def) && C(S[r].mdef) && A(S[r].spd) && C(S[r].atk) && S[r].int <= 30],
    ['bigfoot', 'high HP (≥700) · decent SPD (B) · decent/good DEF+M.DEF (B+) · high ATK (≥72) · no M.ATK (F)',
        r => S[r].hp >= 700 && B(S[r].spd) && Bp(S[r].def) && Bp(S[r].mdef) && S[r].atk >= 72 && F(S[r].int)],
    ['gargoyle', 'decent SPD/DEF/M.DEF (B) · decent HP (≥540) · meh ATK (B) · little M.ATK (F)',
        r => B(S[r].spd) && B(S[r].def) && B(S[r].mdef) && S[r].hp >= 540 && B(S[r].atk) && F(S[r].int)],
    ['zombie', 'decent HP (≥540) · high DEF (≥72) · low M.DEF (C-) · ok SPD (B) · melee',
        r => S[r].hp >= 540 && S[r].def >= 72 && Cm(S[r].mdef) && B(S[r].spd) && kitRange(r) === 1],
    ['gangster', 'mid HP (540–620) · mid DEF+M.DEF (B) · high ATK (A+) · little M.ATK (F) · good SPD (A)',
        r => S[r].hp >= 540 && S[r].hp <= 620 && B(S[r].def) && B(S[r].mdef) && Ap(S[r].atk) && F(S[r].int) && A(S[r].spd)],
    ['nun', 'low HP (<540) · low DEF (C) · decent M.DEF (B+) · terrible ATK (F) · high M.ATK (A+) · low SPD (C)',
        r => S[r].hp < 540 && C(S[r].def) && Bp(S[r].mdef) && F(S[r].atk) && Ap(S[r].int) && C(S[r].spd)],
    ['fairy', 'low-mid HP (430–540) · good SPD (A) · low DEF (C) · good M.DEF (A) · low ATK (F) · good M.ATK (A)',
        r => S[r].hp >= 430 && S[r].hp <= 540 && A(S[r].spd) && C(S[r].def) && A(S[r].mdef) && F(S[r].atk) && A(S[r].int)],
    ['black goo', 'low SPD (C) · low damage (ATK C, M.ATK ≤50) · decent HP (≥540) · decent DEF+M.DEF (B) · melee',
        r => C(S[r].spd) && C(S[r].atk) && S[r].int <= 50 && S[r].hp >= 540 && B(S[r].def) && B(S[r].mdef) && kitRange(r) === 1],
    ['ghoul', 'good ATK (A) · decent HP (≥540) · decent DEF+M.DEF (B) · ok SPD (B)',
        r => A(S[r].atk) && S[r].hp >= 540 && B(S[r].def) && B(S[r].mdef) && B(S[r].spd)],
    ['robinhood', 'vs marksman: stronger ATK, better SPD, ≤ kit range, more HP and M.DEF; low DEF (≤30)',
        r => S[r].atk > S.marksman.atk && S[r].spd > S.marksman.spd && kitRange(r) <= kitRange('marksman') && S[r].hp > S.marksman.hp && S[r].mdef > S.marksman.mdef && S[r].def <= 30],
    ['superhero', 'mid HP (540–620) · high DEF (A+) · great SPD (A+) · high ATK (A+) · decent M.ATK (B) · terrible M.DEF (F)',
        r => S[r].hp >= 540 && S[r].hp <= 620 && Ap(S[r].def) && Ap(S[r].spd) && Ap(S[r].atk) && B(S[r].int) && F(S[r].mdef)],
    ['mad scientist', 'low ATK (F) · low HP (≤480) · low DEF+M.DEF (C) · ok SPD (B) · high M.ATK (S)',
        r => F(S[r].atk) && S[r].hp <= 480 && C(S[r].def) && C(S[r].mdef) && B(S[r].spd) && Sg(S[r].int)],
    ['cyborg', 'decent HP (≥540) · mid DEF (B) · ok M.DEF (B) · mid SPD (B) · ok ATK (B) · high M.ATK (A+)',
        r => S[r].hp >= 540 && B(S[r].def) && B(S[r].mdef) && B(S[r].spd) && B(S[r].atk) && Ap(S[r].int)],
];
console.log('\nrole constraints (' + CONSTRAINTS.filter(c => has(c[0])).length + ' champs checked):');
for (const [race, desc, test] of CONSTRAINTS) {
    if (!has(race)) { console.log('  · ' + race + ' — not in the roster yet (skipped)'); continue; }
    let ok = false;
    try { ok = !!test(race); } catch (e) { ok = false; }
    if (!ok) fail(`${race} no longer matches its design: ${desc}`);
}

// Speed ladder — the units that act first and walk furthest (A/S SPD).
const fast = races.filter(r => RACE_BASE_STATS[r].spd >= 61).sort((a, b) => RACE_BASE_STATS[b].spd - RACE_BASE_STATS[a].spd);
console.log('\nspeed ladder (A/S SPD, 4–5 tiles): ' + (fast.map(r => `${r} ${RACE_BASE_STATS[r].spd}`).join(' · ') || 'none')
    + (night ? ` · werewolf@night ${night.spd}` : ''));

if (!failures) console.log('\n  ✓ every race inside the power band; every reworked champ matches its design notes');
process.exit(failures ? 1 : 0);
