// ai-weights.test.js — AI trainer table ↔ brain parity guards (2026-09-06).
//
// The A/B trainer (battle.js AI_WEIGHT_DEFAULTS) tunes constants the v4 brain
// (ai.js) reads through tuneW()/wght(). Three things have silently broken in
// past training runs and are pinned here:
//   1. DEFAULTS DRIFT — a `_v4` default that differs from ai.js AI_TUNE means an
//      untrained install plays a different game than the constants say.
//   2. DEAD WEIGHTS — a table key with no live read in ai.js is 60 matches of
//      coin-flipping per pass (the gen-100 audit found 8 of 45 keys dead).
//   3. BYPASSED KNOBS — a trainable AI_TUNE key still read as `AI_TUNE.key`
//      somewhere means experiments/champion/strength-baseline don't apply
//      on that code path.
// battle.js/ai.js are browser scripts, so — like damage.test.js — the object
// literals are extracted from source by balanced braces and evaluated alone.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const battleSrc = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const aiSrc = fs.readFileSync(path.join(__dirname, 'ai.js'), 'utf8');
// Comment-free view for the "no direct read" check (comments legitimately
// mention AI_TUNE.<key> when explaining a knob).
const aiCode = aiSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

function extractObjectLiteral(src, declPrefix) {
    const start = src.indexOf(declPrefix);
    assert.notStrictEqual(start, -1, `declaration not found: ${declPrefix}`);
    let i = src.indexOf('{', start), depth = 0;
    const open = i;
    for (; i < src.length; i++) {
        const c = src[i];
        if (c === '{') depth++;
        else if (c === '}' && --depth === 0) break;
    }
    const literal = src.slice(open, i + 1);
    // eslint-disable-next-line no-new-func
    return new Function('return (' + literal + ');')();
}

const DEFAULTS = extractObjectLiteral(battleSrc, 'const AI_WEIGHT_DEFAULTS = {');
const TUNE = extractObjectLiteral(aiSrc, 'const AI_TUNE = {');
const TRAINED = extractObjectLiteral(aiSrc, 'const _TUNE_TRAINED_KEYS = {');
const KNOWN_PROBES = new Set(['hourglass', 'nexus', 'tower', 'height']);

test('every trainable AI_TUNE knob has a table entry whose default equals AI_TUNE', () => {
    for (const [tuneKey, tableKey] of Object.entries(TRAINED)) {
        assert.ok(tuneKey in TUNE, `_TUNE_TRAINED_KEYS.${tuneKey} is not an AI_TUNE key`);
        assert.ok(tableKey in DEFAULTS, `${tuneKey} → ${tableKey} missing from AI_WEIGHT_DEFAULTS`);
        assert.ok(Math.abs(DEFAULTS[tableKey].value - TUNE[tuneKey]) < 1e-9,
            `${tableKey}.value (${DEFAULTS[tableKey].value}) must equal AI_TUNE.${tuneKey} (${TUNE[tuneKey]})`);
    }
});

test('every _v4 table key is routed from an AI_TUNE knob (no orphan v4 entries)', () => {
    const routed = new Set(Object.values(TRAINED));
    for (const key of Object.keys(DEFAULTS)) {
        if (/_v4$/.test(key)) assert.ok(routed.has(key), `${key} is not mapped in ai.js _TUNE_TRAINED_KEYS`);
    }
});

test('trainable AI_TUNE knobs are never read directly as AI_TUNE.<key> in ai.js', () => {
    for (const tuneKey of Object.keys(TRAINED)) {
        const re = new RegExp('AI_TUNE\\.' + tuneKey + '\\b', 'g');
        // The declaration line itself is `key: value` (no `AI_TUNE.` prefix), so
        // any match is a bypassing read.
        const hits = (aiCode.match(re) || []).length;
        assert.strictEqual(hits, 0, `AI_TUNE.${tuneKey} is read directly ${hits}× — route it through tuneW(g, '${tuneKey}')`);
    }
});

test('every table key has a live read in ai.js (no dead weights)', () => {
    const routed = new Set(Object.values(TRAINED));
    for (const key of Object.keys(DEFAULTS)) {
        if (routed.has(key)) continue;   // read via tuneW(<tuneKey>) → mapped above
        const hits = aiSrc.split(`'${key}'`).length - 1;
        assert.ok(hits >= 1, `${key} has no wght()/getAIWeight read in ai.js — training it is coin-flipping`);
    }
});

test('table entries are well-formed: value and prev inside [min,max], label + desc, known probes', () => {
    for (const [key, def] of Object.entries(DEFAULTS)) {
        assert.ok(typeof def.value === 'number' && !isNaN(def.value), `${key}.value`);
        assert.ok(typeof def.min === 'number' && typeof def.max === 'number' && def.min < def.max, `${key} range`);
        assert.ok(def.value >= def.min && def.value <= def.max, `${key}.value ${def.value} outside [${def.min}, ${def.max}]`);
        if (def.prev != null) assert.ok(def.prev >= def.min && def.prev <= def.max, `${key}.prev ${def.prev} outside [${def.min}, ${def.max}]`);
        assert.ok(def.label && def.desc, `${key} needs label + desc (dashboard rows)`);
        if (def.probe) assert.ok(KNOWN_PROBES.has(def.probe), `${key}.probe '${def.probe}' unknown`);
    }
});

test('_weightRelevantNow handles every probe the table uses', () => {
    const used = new Set(Object.values(DEFAULTS).map(d => d.probe).filter(Boolean));
    for (const probe of used) {
        assert.ok(battleSrc.includes(`def.probe === '${probe}'`), `battle.js _weightRelevantNow has no branch for probe '${probe}'`);
    }
});

test('wght() fallback literals track the shipped defaults (within rounding)', () => {
    // wght(g, 'key', dflt) only uses dflt when getAIWeight throws, but a
    // stale literal is a trap for the next reader — keep them within 1.
    const re = /wght\(g, '([A-Za-z0-9_]+)', (-?\d+(?:\.\d+)?)\)/g;
    let m, checked = 0;
    while ((m = re.exec(aiSrc))) {
        const key = m[1], lit = Number(m[2]);
        if (!DEFAULTS[key]) continue;
        assert.ok(Math.abs(lit - DEFAULTS[key].value) <= 1.0,
            `wght fallback for ${key} is ${lit} but the default is ${DEFAULTS[key].value}`);
        checked++;
    }
    assert.ok(checked >= 8, `expected to check the wght() fallbacks, found ${checked}`);
});
