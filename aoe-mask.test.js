// aoe-mask.test.js — THE SPELL LIBRARY Phase 2, THE GRID (SPELL_LIBRARY_PLAN.md §4.7, §6.1, §9 row 2).
//
// Pins: every AOE_PRESETS entry lights the tile set its name promises; aoeMaskTiles clips to the board and drops
// duplicates; the FOUR footprint readers (battle.js getSpellAoeArea / getCrossArea, ui.js getSpellAoeFootprint,
// ai.js getSpellAoeAreaAI / _crossFootprintAI, hud.js _hrlgSpellShape) agree on every shipped aoe / cross row AND
// on every preset stamped onto an aoe row, a cross row and a self-origin row; the library's own _slb2Footprint
// matches them; and the grid's mask helpers (the radius field = the reach) hold. The functions are sliced out of
// the live sources by name and run in load-data's sandbox (real data.js values) with a 24×24 board stubbed.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data');

const D = loadGameData();
const J = (v) => JSON.parse(JSON.stringify(v));
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');

/* Slice `function NAME(` … its balanced closing brace out of a source (the first definition). */
function sliceFn(src, name) {
    const i = src.indexOf('function ' + name + '(');
    assert.ok(i >= 0, name + ' exists');
    let j = src.indexOf('{', i), depth = 0, inStr = null, inLine = false, inBlock = false;
    for (let k = j; k < src.length; k++) {
        const c = src[k], n = src[k + 1];
        if (inLine) { if (c === '\n') inLine = false; continue; }
        if (inBlock) { if (c === '*' && n === '/') { inBlock = false; k++; } continue; }
        if (inStr) { if (c === '\\') { k++; continue; } if (c === inStr) inStr = null; continue; }
        if (c === '/' && n === '/') { inLine = true; k++; continue; }
        if (c === '/' && n === '*') { inBlock = true; k++; continue; }
        if (c === '\'' || c === '"' || c === '`') { inStr = c; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) return src.slice(i, k + 1); }
    }
    throw new Error('unbalanced ' + name);
}
const W = 24, H = 24;
D.isInside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
D.bw = () => W; D.bh = () => H;
D.isTerrainPassable = () => true;
D.state = {};
D.window = D;
const battle = read('battle.js'), ui = read('ui.js'), ai = read('ai.js'), hud = read('hud.js');
vm.runInContext(['getSquareArea', 'getDiamondArea', 'getRoundArea', 'getRingArea', '_spellMaskOf', '_spellMaskTiles', '_spellAoeReach', 'getSpellAoeArea', 'getCrossArea']
    .map(n => sliceFn(battle, n)).join('\n'), D, { filename: 'battle.js#aoe' });
vm.runInContext(sliceFn(ui, 'getSpellAoeFootprint'), D, { filename: 'ui.js#footprint' });
vm.runInContext(['getSpellAoeAreaAI', '_crossFootprintAI'].map(n => sliceFn(ai, n).replace(/^function (\w+)/, 'function $1_AI').replace(/function (\w+)_AI_AI/, 'function $1_AI')).join('\n')
    .replace('function getSpellAoeAreaAI_AI', 'function getSpellAoeAreaAI').replace('function _crossFootprintAI_AI', 'function _crossFootprintAI'), D, { filename: 'ai.js#aoe' });
vm.runInContext(['_hrlgSpellShape', '_hrlgCellShape'].map(n => sliceFn(hud, n)).join('\n'), D, { filename: 'hud.js#shape' });
{ const a = ui.indexOf('/* SLB2 PURE BEGIN'), b = ui.indexOf('/* SLB2 PURE END */'); assert.ok(a > 0 && b > a); vm.runInContext(ui.slice(a, b), D, { filename: 'ui.js#slb2-pure' }); }
const G = (name) => vm.runInContext(name, D);
const key = (tiles) => tiles.map(t => t.x + ',' + t.y).sort().join(';');
const offKey = (tiles, cx, cy) => tiles.map(t => (t.x - cx) + ',' + (t.y - cy)).sort().join(';');
const setKey = (set) => [...set].sort().join(';');

const PRESET_COUNTS = { single: 1, '3x3': 9, '5x5': 25, diamond1: 5, diamond2: 13, x1: 5, x2: 9, cross1: 5, cross2: 9, ring1: 8, ring2: 16, line3: 3, line5: 5, hollow3x3: 8 };
const PRESET_BOUND = { single: 0, '3x3': 1, '5x5': 2, diamond1: 1, diamond2: 2, x1: 1, x2: 2, cross1: 1, cross2: 2, ring1: 1, ring2: 2, line3: 1, line5: 2, hollow3x3: 1 };

test('every preset lights the tile set its name promises, is valid, and round-trips through aoeMaskPresetOf', () => {
    const P = J(D.AOE_PRESETS);
    assert.deepStrictEqual(Object.keys(P).sort(), Object.keys(PRESET_COUNTS).sort());
    for (const name of Object.keys(P)) {
        assert.ok(D.aoeMaskValid(P[name]), name + ' valid');
        assert.strictEqual(P[name].length, PRESET_COUNTS[name], name + ' tile count');
        assert.strictEqual(D.aoeMaskBound(P[name]), PRESET_BOUND[name], name + ' bound');
        const back = D.aoeMaskPresetOf(P[name].slice().reverse());   // cross1 and diamond1 are the same five tiles: the first name wins
        assert.ok(back === name || JSON.stringify(P[back].slice().sort()) === JSON.stringify(P[name].slice().sort()), name + ' round-trips in any order (got ' + back + ')');
    }
    // the shapes themselves
    const has = (m, x, y) => m.some(o => o[0] === x && o[1] === y);
    assert.ok(has(P.x1, 1, 1) && has(P.x1, -1, -1) && !has(P.x1, 1, 0), 'x1 is the diagonals');
    assert.ok(has(P.cross1, 1, 0) && !has(P.cross1, 1, 1), 'cross1 is the cardinals');
    assert.ok(!has(P.ring1, 0, 0) && has(P.ring1, 1, 1), 'ring1 spares its centre');
    assert.ok(!has(P.hollow3x3, 0, 0), 'hollow3x3 spares its centre');
    assert.ok(has(P.line5, 0, -2) && has(P.line5, 0, 2) && !has(P.line5, 1, 0), 'line5 runs through the centre');
    assert.ok(!D.aoeMaskValid([[4, 0]]) && !D.aoeMaskValid([]) && !D.aoeMaskValid('3x3') && !D.aoeMaskValid([[0.5, 0]]), 'invalid masks');
});

test('aoeMaskTiles clips to the board and drops duplicates; the engine helpers read the reach', () => {
    const P = J(D.AOE_PRESETS);
    assert.strictEqual(D.aoeMaskTiles(P['5x5'], 0, 0, W, H).length, 9, 'a 5×5 in the corner keeps 9 tiles');
    assert.strictEqual(D.aoeMaskTiles(P['5x5'], 0, 0).length, 25, 'unclipped without a board');
    assert.strictEqual(D.aoeMaskTiles([[0, 0], [0, 0], [1, 0]], 5, 5).length, 2, 'duplicates dropped');
    assert.strictEqual(G('_spellAoeReach')({ aoeMask: P.ring2 }, 1), 2, 'reach = the mask bound');
    assert.strictEqual(G('_spellAoeReach')({ aoeMask: P.single }, 1), 1, 'a single-tile mask still reaches 1 (rings / cameras)');
    assert.strictEqual(G('_spellAoeReach')({ aoeRadius: 3 }, 1), 3, 'no mask: the radius field');
    assert.strictEqual(G('_spellAoeReach')({}, 1), 1, 'no fields: the fallback');
    assert.strictEqual(G('_spellMaskOf')({ aoeMask: 'x1' }), null, 'a preset NAME is not a mask (the editor stamps the array)');
});

/* The four readers on one spell at one centre. `self` rows centre on the caster (10,10); target rows on (14,9). */
function readers(spell) {
    const caster = { x: 10, y: 10, id: 'c' };
    const cx = spell.aoeOriginSelf ? caster.x : 14, cy = spell.aoeOriginSelf ? caster.y : 9;
    const isCross = spell.kind === 'cross';
    const b = isCross ? G('getCrossArea')(spell, cx, cy) : G('getSpellAoeArea')(spell, cx, cy);
    const u = G('getSpellAoeFootprint')(spell, 14, 9, caster);
    const a = (isCross ? G('_crossFootprintAI')(spell, cx, cy) : G('getSpellAoeAreaAI')(spell, cx, cy)).filter(t => D.isInside(t.x, t.y));
    return { battle: key(b), ui: key(u), ai: key(a), off: offKey(b, cx, cy), n: b.length };
}
function shippedAreaRows() {
    const seen = new Set(), out = [];
    for (const id of Object.keys(D.SPELL_BY_ID)) {
        const sp = D.SPELL_BY_ID[id];
        if (!sp || seen.has(sp)) continue;
        seen.add(sp);
        if (sp.kind === 'aoe' || sp.kind === 'cross') out.push(sp);
    }
    return out;
}

test('parity: battle / ui / ai footprints agree on every shipped aoe + cross row (the radius / shape fields)', () => {
    const rows = shippedAreaRows();
    assert.ok(rows.length >= 60, 'the census has aoe / cross rows: ' + rows.length);
    const bad = [];
    for (const sp of rows) {
        if (sp.hitsWetOnly) continue;
        const r = readers(sp);
        if (r.battle !== r.ui || r.battle !== r.ai) bad.push(sp.id + ': battle ' + r.n + ' vs ui ' + r.ui.split(';').length + ' vs ai ' + r.ai.split(';').length);
    }
    assert.deepStrictEqual(bad, []);
});

test('parity: every preset stamped on an aoe row, a cross row and a self-origin row reads the same in all four readers, and the mask WINS over the radius fields', () => {
    const P = J(D.AOE_PRESETS);
    const bases = [
        { id: 'fx-aoe', kind: 'aoe', aoeRadius: 2, aoeShape: 'round', range: 4 },
        { id: 'fx-cross', kind: 'cross', crossRadius: 2, diagonal: true, range: 3 },
        { id: 'fx-self', kind: 'aoe', aoeOriginSelf: true, aoeRadius: 1 },
        { id: 'fx-zone', kind: 'zoneDebuff', aoeRadius: 1, range: 4 },
    ];
    const bad = [];
    for (const base of bases) for (const name of Object.keys(P)) {
        const sp = Object.assign({}, base, { aoeMask: P[name] });
        const cx = sp.aoeOriginSelf ? 10 : 14, cy = sp.aoeOriginSelf ? 10 : 9;
        const want = key(D.aoeMaskTiles(P[name], cx, cy, W, H));
        const u = key(G('getSpellAoeFootprint')(sp, 14, 9, { x: 10, y: 10 }));
        if (u !== want) bad.push(base.id + '/' + name + ' ui');
        if (sp.kind === 'aoe' || sp.kind === 'cross') {
            const r = readers(sp);
            if (r.battle !== want) bad.push(base.id + '/' + name + ' battle');
            if (r.ai !== want) bad.push(base.id + '/' + name + ' ai');
        } else {
            const a = key(G('getSpellAoeAreaAI')(sp, cx, cy));
            if (a !== want) bad.push(base.id + '/' + name + ' ai(zone)');
        }
        // hud's card shape (capped at r ≤ 3 here) and the library's own footprint carry the same offsets
        const h = G('_hrlgSpellShape')(sp);
        if (!h || h.kind !== 'mask' || setKey(h.cells) !== setKey(new Set(P[name].map(o => o[0] + ',' + o[1])))) bad.push(base.id + '/' + name + ' hud');
        const f = G('_slb2Footprint')(sp);
        if (!f || f.kind !== 'mask' || setKey(f.cells) !== setKey(h.cells)) bad.push(base.id + '/' + name + ' slb2');
    }
    assert.deepStrictEqual(bad, []);
});

test('the shaped radius fields (X cross, ring, diamond, round) draw the engine footprint on the card and in the library', () => {
    const rows = [
        { kind: 'cross', crossRadius: 2, diagonal: true },
        { kind: 'cross', crossRadius: 1 },
        { kind: 'cross', crossRadius: 2, diamond: true },
        { kind: 'aoe', aoeRadius: 2, aoeShape: 'ring' },
        { kind: 'aoe', aoeRadius: 2, aoeShape: 'diamond' },
        { kind: 'aoe', aoeRadius: 2, aoeShape: 'round' },
        { kind: 'aoe', aoeRadius: 1 },
    ];
    const bad = [];
    for (const sp of rows) {
        const engine = offKey(readers(sp).battle.split(';').map(k => { const [x, y] = k.split(',').map(Number); return { x, y }; }), 14, 9);
        const h = G('_hrlgSpellShape')(sp);
        const hud = h.kind === 'mask' ? setKey(h.cells) : (() => { const c = new Set(); for (let dy = -h.r; dy <= h.r; dy++) for (let dx = -h.r; dx <= h.r; dx++) { const on = h.kind === 'cross' ? (dx === 0 || dy === 0) : h.kind === 'diamond' ? (Math.abs(dx) + Math.abs(dy) <= h.r) : true; if (on) c.add(dx + ',' + dy); } return setKey(c); })();
        const f = G('_slb2Footprint')(sp);
        if (hud !== engine) bad.push(JSON.stringify(sp) + ' hud ' + hud + ' vs ' + engine);
        if (setKey(f.cells) !== engine) bad.push(JSON.stringify(sp) + ' slb2');
    }
    assert.deepStrictEqual(bad, []);
});

test('the lint: maskVsRadius fires only when the radius disagrees with the reach; the mana formula prices the mask by its tiles', () => {
    const P = J(D.AOE_PRESETS);
    const ctx = D.spellLintContext();
    const rules = (d) => J(D.spellLint(Object.assign({ id: 'lintfx', name: 'Lint', kind: 'aoe', type: 'damage', dmg: 40, range: 3, tier: 1, cost: 10 }, d), ctx)).map(h => h.rule);
    assert.ok(!rules({ aoeMask: P.x1, aoeRadius: 1 }).includes('maskVsRadius'), 'radius = reach: quiet');
    assert.ok(rules({ aoeMask: P.x1, aoeRadius: 2 }).includes('maskVsRadius'), 'radius ≠ reach: amber');
    assert.ok(rules({ aoeMask: 'x1' }).includes('maskInvalid'), 'a preset name is invalid');
    assert.ok(rules({ animVerb: 'drain', animSlot: 'castThrust' }).includes('animPick'), 'two picks: amber');
    assert.ok(rules({ animClip: { name: 'x', lib: 9 } }).includes('animClipInvalid'), 'a bad clip lib: red');
    const cost = (d) => D.computeSpellManaCost(Object.assign({ kind: 'aoe', type: 'damage', dmg: 40, range: 3 }, d));
    assert.strictEqual(cost({ aoeMask: P['3x3'], aoeRadius: 1 }), cost({ aoeRadius: 1 }), 'a 3×3 mask prices like radius 1');
    assert.ok(cost({ aoeMask: P.x1, aoeRadius: 1 }) < cost({ aoeRadius: 1 }), 'an X prices under the full box');
    assert.ok(cost({ aoeMask: P['5x5'], aoeRadius: 2 }) > cost({ aoeMask: P.diamond2, aoeRadius: 2 }), 'more tiles, more MP');
});

test('describeSpell names the drawn shape; the schema stamp carries _aoeBound', () => {
    const P = J(D.AOE_PRESETS);
    const desc = (d) => D.describeSpell(Object.assign({ id: 'dfx', name: 'D', kind: 'aoe', type: 'damage', dmg: 80, range: 3, damageType: 'magic' }, d));
    assert.match(desc({ aoeMask: P.ring2, aoeRadius: 2 }), /ring area/);
    assert.match(desc({ aoeMask: P.x1, aoeRadius: 1 }), /X-shaped area/);
    assert.match(desc({ aoeMask: [[0, 0], [1, 2]], aoeRadius: 2 }), /drawn area/);
    assert.match(desc({ aoeRadius: 1 }), /in an AOE/);
    const rows = Object.keys(D.SPELL_BY_ID).map(id => D.SPELL_BY_ID[id]);
    for (const sp of rows) {
        if (!sp || sp.kind === 'basicAttack') continue;
        if (D.aoeMaskValid(sp.aoeMask)) assert.strictEqual(sp._aoeBound, D.aoeMaskBound(sp.aoeMask), sp.id + ' _aoeBound');
        else assert.ok(!('_aoeBound' in sp), sp.id + ' has no stale _aoeBound');
    }
});
