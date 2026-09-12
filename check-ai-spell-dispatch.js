'use strict';
// Source dispatch inventory, not a tactical simulation or proof of executor correctness.
const fs = require('node:fs');
const path = require('node:path');
const { loadGameData } = require('./load-data');
const d = loadGameData();
const source = fs.readFileSync(process.env.EW_AI_TEST_SOURCE || path.join(__dirname, 'ai.js'), 'utf8');
const battle = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const spells = Object.values(d.SPELL_BY_ID);
function routes(fn, next) {
    const part = source.slice(source.indexOf('    function ' + fn + '('), source.indexOf('    function ' + next + '('));
    const result = new Set();
    // Only direct dispatch conditions, not nested utility blocks or body comparisons.
    for (const m of part.matchAll(/^        if \((.*)\) (?:\{|return)/gm)) {
        const condition = m[1];
        for (const k of condition.matchAll(/kind === '([^']+)'/g)) result.add(k[1]);
        const list = /\[([^\]]+)\]\.includes\(kind\)/.exec(condition);
        if (list) for (const k of list[1].matchAll(/'([^']+)'/g)) result.add(k[1]);
    }
    return result;
}
const scoring = routes('scoreSpell', 'scoreTeleport');
const targeting = routes('findSpellTarget', 'executeAction');
const kinds = [...new Set(spells.map(s => s.kind))].sort();
const rows = kinds.map(kind => ({ kind, spellIds: spells.filter(s => s.kind === kind).map(s => s.id),
    directScorer: scoring.has(kind), directTargetPicker: targeting.has(kind),
    engineKindMention: battle.includes("spell.kind === '" + kind + "'") }));
console.log(JSON.stringify({ registry: 'loadGameData().SPELL_BY_ID', spellCount: spells.length, kindCount: kinds.length,
    limitation: 'Direct dispatch source inventory only. Conditions, spell-ID utility subcases, caller gates, legality, balance and engine effects require separate validation. engineKindMention is textual evidence only.',
    missingDirectScorer: rows.filter(r => !r.directScorer).map(r => r.kind),
    missingDirectTargetPicker: rows.filter(r => !r.directTargetPicker).map(r => r.kind),
    wideBeams: spells.filter(s => ['line', 'linePush'].includes(s.kind) && s.lineWidth > 1).map(s => ({id:s.id,kind:s.kind,lineWidth:s.lineWidth,range:s.range})), rows }, null, 2));
