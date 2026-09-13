#!/usr/bin/env node
/* check-tutorial-drift.js — THE TUTORIAL's drift register (repo tooling,
   2026-09-13; runs inside `npm test` through tutorial.test.js).

   data.js TUTORIAL_MECHANICS names, per mechanic a lesson teaches:
     pins  — the numbers the lesson's copy states (`{ name, file, value }`),
             read here straight out of the SOURCE (load-data.js extractConst),
     watch — the rule functions the lesson describes (`{ file, fn, hash }`),
             fingerprinted here: the function body, whitespace-collapsed,
             sha1, the first 10 hex.
   A pin whose source value moved, or a watched function whose body changed,
   is a DRIFT: the lesson that teaches it must be re-read (copy, steps, the
   board) and then re-stamped. That is how "a change to a mechanic flags the
   tutorial for update" is enforced — nobody has to remember.

     node check-tutorial-drift.js            → the report (exit 1 on drift)
     node check-tutorial-drift.js --print    → every watched function's
                                               CURRENT hash, to paste into
                                               data.js after the review
     node check-tutorial-drift.js --stamp    → writes the current hashes into
                                               data.js TUTORIAL_MECHANICS
                                               (after you re-read the lesson!)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { loadGameData, extractConst, REPO_ROOT } = require('./load-data');

const _srcCache = {};
function readSrc(file) {
    if (!_srcCache[file]) _srcCache[file] = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    return _srcCache[file];
}

/* the body of `function NAME(` — braces balanced, strings / comments /
   template literals skipped; null when the declaration is not found */
function extractFunction(src, name) {
    const re = new RegExp('(^|\\n)[ \\t]*(?:async\\s+)?function\\s+' + name.replace(/[$]/g, '\\$') + '\\s*\\(');
    const m = re.exec(src);
    if (!m) return null;
    let i = src.indexOf('{', m.index + m[0].length);
    if (i < 0) return null;
    const start = i;
    let depth = 0;
    while (i < src.length) {
        const c = src[i];
        if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) return null; continue; }
        if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2); if (i < 0) return null; i += 2; continue; }
        if (c === '"' || c === "'" || c === '`') {
            const q = c; i++;
            while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; if (q === '`' && src[i] === '$' && src[i + 1] === '{') { let d = 1; i += 2; while (i < src.length && d > 0) { if (src[i] === '{') d++; else if (src[i] === '}') d--; i++; } continue; } i++; }
            i++; continue;
        }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
        i++;
    }
    return null;
}
function fingerprint(file, fn) {
    const body = extractFunction(readSrc(file), fn);
    if (body == null) return null;
    const norm = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').trim();
    return crypto.createHash('sha1').update(norm).digest('hex').slice(0, 10);
}
function pinValue(file, name) {
    let lit;
    try { lit = extractConst(readSrc(file), name); } catch (e) { return undefined; }
    if (lit == null) return undefined;
    const v = Number(String(lit).trim().replace(/;$/, ''));
    return Number.isFinite(v) ? v : String(lit).trim();
}
/* the arena row's key numbers, out of state.js MULTIPLAYER_MODES (source text) */
function arenaModePins() {
    const src = readSrc('state.js');
    const i = src.indexOf("id: 'arena'");
    if (i < 0) return {};
    const block = src.slice(i, src.indexOf('\n            },', i));
    const out = {};
    for (const k of ['keySpawnCount', 'keysToWin', 'roundLimit']) {
        const m = new RegExp(k + '\\s*:\\s*(\\d+)').exec(block);
        if (m) out[k] = Number(m[1]);
    }
    return out;
}

function checkDrift(D) {
    D = D || loadGameData();
    const M = D.TUTORIAL_MECHANICS;
    const problems = [];
    const current = {};
    for (const [mid, m] of Object.entries(M)) {
        const who = `mechanic "${mid}" (${m.label}) → lesson(s) ${(m.lessons || []).join(', ')}`;
        for (const p of (m.pins || [])) {
            const v = pinValue(p.file, p.name);
            if (v === undefined) problems.push(`${who}: pin ${p.name} not found in ${p.file} (renamed? the lesson copy reads it)`);
            else if (v !== p.value) problems.push(`${who}: ${p.file} ${p.name} = ${v} but the lesson was written against ${p.value} — RE-READ THE LESSON (copy / steps), then set the pin's value to ${v}`);
        }
        for (const w of (m.watch || [])) {
            const h = fingerprint(w.file, w.fn);
            current[w.file + ':' + w.fn] = h;
            if (h == null) problems.push(`${who}: watched function ${w.fn} not found in ${w.file} (renamed? re-point the watch)`);
            else if (!w.hash) problems.push(`${who}: ${w.file} ${w.fn} has no hash yet — run \`node check-tutorial-drift.js --stamp\``);
            else if (w.hash !== h) problems.push(`${who}: ${w.file} ${w.fn}() CHANGED (was ${w.hash}, now ${h}) — RE-READ THE LESSON, then \`node check-tutorial-drift.js --stamp\``);
        }
        if (m.modePins) {
            const a = arenaModePins();
            for (const [k, v] of Object.entries(m.modePins)) {
                if (a[k] === undefined) problems.push(`${who}: MULTIPLAYER_MODES.arena.${k} not found in state.js`);
                else if (a[k] !== v) problems.push(`${who}: MULTIPLAYER_MODES.arena.${k} = ${a[k]} but the lesson says ${v} — RE-READ THE LESSON, then update modePins`);
            }
        }
        if (m.chart && D.TYPE_CHART) {
            for (const [t, beats] of Object.entries(m.chart)) {
                const row = D.TYPE_CHART[t];
                const strong = row && row.strongVs ? Array.from(row.strongVs).join(',') : '';
                if (strong !== beats) problems.push(`${who}: TYPE_CHART.${t}.strongVs = [${strong}] but the lesson's wheel says ${beats} — RE-READ THE LESSON`);
            }
        }
    }
    return { problems, current };
}

function stamp(current) {
    const p = path.join(REPO_ROOT, 'data.js');
    let src = fs.readFileSync(p, 'utf8');
    let n = 0;
    src = src.replace(/\{ file: '([^']+)', fn: '([^']+)'(?:, hash: '[0-9a-f]*')? \}/g, (m0, file, fn) => {
        const h = current[file + ':' + fn];
        if (!h) return m0;
        n++;
        return `{ file: '${file}', fn: '${fn}', hash: '${h}' }`;
    });
    fs.writeFileSync(p, src);
    return n;
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const { problems, current } = checkDrift();
    if (args.includes('--print')) {
        console.log(JSON.stringify(current, null, 2));
        process.exit(0);
    }
    if (args.includes('--stamp')) {
        const n = stamp(current);
        console.log(`stamped ${n} watched function(s) in data.js — make sure every named lesson was re-read first`);
        process.exit(0);
    }
    if (problems.length) {
        console.log('TUTORIAL DRIFT — ' + problems.length + ' problem(s):');
        problems.forEach(x => console.log('  ✗ ' + x));
        process.exit(1);
    }
    console.log('tutorial drift: clean (' + Object.keys(current).length + ' watched functions, every pin matches its source)');
}
module.exports = { checkDrift, fingerprint, extractFunction, pinValue, arenaModePins, stamp };
