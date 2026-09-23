// elements-press.test.js — THE ELEMENT BOX + THE ELEMENT PRESS (2026-09-23).
//
//   1. data.js: the knowledge rule (? until hit; a seen / owned / party race
//      reads), the ledger's mark + fold, the reaction symbols, the box HTML.
//   2. battle.js _pressOutcomeForHit: the TYPE tier and the ELEMENT tier add
//      (a super effective element presses a neutral spell; an ineffective
//      type under a super effective element is neutral, and vice versa; an
//      immune / absorbed element is never a press).
//   3. THE SPELL'S TYPE, NEVER THE CASTER'S: an anomaly caster's divine
//      spell on an unholy target is super effective and presses.
//   4. Source guards on every site (the collector, the bomb's typed blast,
//      the discovery mark, the synced field, the five surfaces, the CSS).

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadGameData } = require('./load-data.js');

const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const battleSrc = read('battle.js');
const stateSrc = read('state.js');

function extractFnSource(src, name) {
    const start = src.indexOf('function ' + name + '(');
    assert.notStrictEqual(start, -1, `must define function ${name}`);
    let i = src.indexOf('(', start), parens = 0;
    for (; i < src.length; i++) { if (src[i] === '(') parens++; else if (src[i] === ')' && --parens === 0) break; }
    let depth = 0; i = src.indexOf('{', i);
    for (; i < src.length; i++) { if (src[i] === '{') depth++; else if (src[i] === '}' && --depth === 0) break; }
    return src.slice(start, i + 1);
}

test('data.js: the knowledge rule — ? until hit, a mark reads, the synced ledger folds', () => {
    const D = loadGameData();
    assert.deepStrictEqual(D.COMBAT_ELEMENTS.join(','), 'fire,ice,lightning,water,poison,earth');
    const hidden = D.elemAffinityBox('yeti');
    assert.strictEqual(hidden.length, 6);
    assert.ok(hidden.every(c => !c.known && c.sym === '?' && c.tier === null), 'an unhired, unhit race reads ? on every element');
    const all = D.elemAffinityBox('yeti', { all: true });
    assert.strictEqual(all.map(c => c.sym).join(''), '!▼––––', 'the yeti: weak to fire, resists ice, neutral elsewhere');
    assert.strictEqual(D.elemAffinityBox('kaiju', { own: true })[0].sym, '♥', 'absorb wears the heart');
    assert.strictEqual(D.elemAffinityBox('ice queen', { own: true })[1].sym, '∅', 'immune wears the null sign');
    // the synced match ledger reads without a local mark
    const seen = D.elemAffinityBox('yeti', { seen: { 'yeti|ice': 1 } });
    assert.strictEqual(seen[1].sym, '▼'); assert.strictEqual(seen[0].sym, '?');
    // the local mark
    assert.strictEqual(D.elemSeenMark('yeti', 'fire'), true);
    assert.strictEqual(D.elemSeenMark('yeti', 'fire'), false, 'a second sighting is not news');
    assert.strictEqual(D.elemSeenMark('yeti', 'wind'), false, 'a flavour element is never filed');
    assert.strictEqual(D.elemAffinityBox('yeti')[0].sym, '!');
    assert.strictEqual(D.elemSeenFold({ 'yeti|water': 1, 'bad': 1 }), 1);
    assert.strictEqual(D.elemAffinityBox('yeti')[3].sym, '–');
    const html = D.elemAffinityBoxHtml('yeti', { all: true, size: 'md', label: 'ELEMENTS' });
    assert.ok(html.startsWith('<div class="ew-elem-box md" data-label="ELEMENTS">'));
    assert.strictEqual((html.match(/ew-elem-el"/g) || []).length, 6);
    assert.strictEqual((html.match(/ew-elem-rx /g) || []).length, 6);
    assert.ok(html.includes('ew-elem-rx weak') && html.includes('ew-elem-rx resist'));
    // the press tiers
    assert.deepStrictEqual([null, 'weak', 'resist', 'immune', 'absorb'].map(D.elemPressTier), [0, 1, -1, -2, -2]);
    for (const k of ['neutral', 'weak', 'resist', 'immune', 'absorb', 'unknown']) assert.ok(D.ELEM_REACTION_UI[k].sym, k);
});

function pressFn() {
    const src = extractFnSource(battleSrc, '_pressOutcomeForHit');
    const D = loadGameData();
    // eslint-disable-next-line no-new-func
    return new Function('PRESS_OUTCOME', 'elemPressTier', src + '; return _pressOutcomeForHit;')(
        { NORMAL: 'normal', MISS: 'miss', RESIST: 'resist', WEAK: 'weak', CRIT: 'crit', WEAK_CRIT: 'weakCrit' }, D.elemPressTier);
}

test('battle.js _pressOutcomeForHit: the type tier and the element tier add', () => {
    const f = pressFn();
    const W = { hasStrong: true, hasWeak: false }, R = { hasStrong: false, hasWeak: true }, N = {};
    assert.strictEqual(f({ effSummary: N }), 'normal');
    assert.strictEqual(f({ effSummary: N, elemAff: 'weak' }), 'weak', 'a super effective element presses a neutral spell');
    assert.strictEqual(f({ effSummary: R, elemAff: 'weak' }), 'normal', 'ineffective type + super effective element = neutral');
    assert.strictEqual(f({ effSummary: W, elemAff: 'resist' }), 'normal', 'super effective type + ineffective element = neutral');
    assert.strictEqual(f({ effSummary: W, elemAff: 'weak' }), 'weak', 'both = a press (never more than one)');
    assert.strictEqual(f({ effSummary: R, elemAff: 'resist' }), 'resist');
    assert.strictEqual(f({ effSummary: N, elemAff: 'resist' }), 'resist', 'a resisted element alone drains the AP');
    assert.strictEqual(f({ effSummary: W, elemAff: 'immune' }), 'resist', 'an immune element is never a press, whatever the type');
    assert.strictEqual(f({ effSummary: W, elemAff: 'absorb' }), 'resist');
    assert.strictEqual(f({ effSummary: W, elemAff: 'weak', isCrit: true }), 'weakCrit');
    assert.strictEqual(f({ effSummary: N, elemAff: null, isCrit: true }), 'crit');
    assert.strictEqual(f({ evaded: true, effSummary: W, elemAff: 'weak' }), 'miss');
    // a hit with no element field at all is the old rule
    assert.strictEqual(f({ effSummary: W }), 'weak');
    assert.strictEqual(f({ effSummary: R }), 'resist');
});

test("the spell's type, never the caster's: an anomaly caster's divine spell on an unholy is super effective and presses", () => {
    const D = loadGameData();
    const summarySrc = extractFnSource(stateSrc, 'getTypeEffectSummary');
    const multSrc = extractFnSource(stateSrc, 'getTypeDamageMultiplier');
    // eslint-disable-next-line no-new-func
    const api = new Function('TYPE_CHART', 'STAB_MULTIPLIER', summarySrc + ';' + multSrc + '; return { getTypeEffectSummary, getTypeDamageMultiplier };')(D.TYPE_CHART, D.STAB_MULTIPLIER);
    const caster = { types: ['anomaly'] }, target = { types: ['unholy'] };
    assert.strictEqual(api.getTypeDamageMultiplier(caster, target, 'divine'), 1.3, 'the spell is judged divine vs unholy — the caster adds no resist');
    assert.strictEqual(api.getTypeDamageMultiplier(caster, target, null) < 1, true, 'only a TYPELESS hit (a basic attack) reads the caster: anomaly vs unholy is resisted');
    const f = pressFn();
    assert.strictEqual(f({ effSummary: api.getTypeEffectSummary(['divine'], target.types) }), 'weak', 'the press reads the same summary → +AP');
    // the collector builds that summary off opts.spellType
    const col = extractFnSource(battleSrc, '_collectPressHit');
    assert.ok(/const atkTypes = \(opts && opts\.spellType\) \? \[opts\.spellType\] : \(sourceUnit\.types \|\| \[\]\);/.test(col));
    assert.ok(/elemAff/.test(col) && /opts\.spellElement/.test(col), 'the collector records the element affinity');
    // every damage-dealing spell row carries a spellType (nothing falls to the caster's)
    let all = [...D.SPELL_LIBRARY]; for (const r in D.RACE_ABILITIES) all = all.concat(D.RACE_ABILITIES[r] || []);
    const typeless = all.filter(s => !s.spellType);
    assert.deepStrictEqual(typeless.map(s => s.id), [], 'every spell row carries its own type');
});

test('source guards: the bomb is a typed blast, the hit marks the ledger, the field syncs, the five surfaces wear the box', () => {
    const det = extractFnSource(battleSrc, 'detonateBomb');
    assert.ok(/spellType: bomb\.spellType \|\| 'tech'/.test(det), 'the blast is the row\'s type (tech)');
    assert.ok(/spellElement: bomb\.spellElement/.test(det) && /noAtkBonus: true/.test(det) && /sourceUnit: _bombCaster/.test(det));
    assert.ok(/spellType: spell\.spellType \|\| 'tech',\s*\/\/ THE TYPED BLAST/.test(battleSrc), 'the bomb record files the row\'s type');
    assert.ok(/if \(!opts\.noAtkBonus\) finalDamage \+= getEffectiveAttackBonus/.test(battleSrc));
    assert.ok(/state\._elemSeen\[target\.race \+ '\|' \+ _affEl\] = 1;/.test(battleSrc), 'applyDamageToUnit files the sighting on the synced ledger');
    assert.ok(/elemSeenMark\(target\.race, _affEl\)/.test(battleSrc));
    assert.ok(/state\._elemSeen = \{\};/.test(battleSrc), 'a match starts with a fresh ledger');
    assert.ok(/elemSeenFold\(state\._elemSeen\)/.test(battleSrc), 'finalizeMatch folds it into the local one');
    assert.ok(/_elemSeen: \{\}/.test(stateSrc), 'the state literal carries it (synced by default)');
    assert.ok(!/_elemSeen/.test(read('online.js')), 'nothing skips it on the wire');
    assert.ok(/elemAff: \(\(\) => \{ const _cEl = getSpellElement\(combo\)/.test(battleSrc), 'a combo\'s element presses too');
    assert.ok(/function _hrlgElemBox\(u\)/.test(read('hud.js')) && /_hrlgElemBox\(u\)\);/.test(read('hud.js')), 'the Horologe readout');
    assert.ok(/elemAffinityBoxHtml\(unit\.race, \{ own: _insOwn, seen: state\._elemSeen/.test(read('ui.js')), 'the INFO card');
    assert.ok(/cdx-elem-boxrow/.test(read('ui.js')), 'the codex');
    assert.ok(/window\.elemAffinityBox\(race\)/.test(read('party-builder.js')), 'the forge');
    assert.ok(/elemAffinityBoxHtml\(u\.race, \{ own: true/.test(read('map.js')), 'the pause menu');
    assert.ok(/\.ew-elem-box \{/.test(read('styles-base.css')) && /\.ew-elem-rx\.unknown/.test(read('styles-base.css')));
    const DATA = read('data.js');
    assert.ok(/ELEM_KNOWLEDGE_KEY = 'ew_elem_seen_v1'/.test(DATA));
    assert.ok(/elemAffinityKnown, elemAffinityBox, elemAffinityBoxHtml, elemPressTier,/.test(DATA), 'on window');
});
