// spell-tree-ux.test.js — THE FORK + THE CASCADE + 7 SLOTS (2026-09-13).
//
// The party builder's circuit renders every twin node as a FORK (both
// alternates visible on the tier), unequips with a CASCADE (the node and
// everything that hung off it), and the slot cap is 7. This runs the
// builder's own pure helpers (computeTreeEquipPath / treeNodeState /
// treeAltState / treeDropIds / pbTechInfo) in a vm sandbox over the REAL
// data.js trees, then source-scans the click flow and the CSS.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData, REPO_ROOT } = require('./load-data');

const read = (f) => fs.readFileSync(path.join(REPO_ROOT, f), 'utf8');
const PB = read('party-builder.js');
const CSS = read('styles-base.css');
const D = loadGameData();

function between(src, a, b) {
    const i = src.indexOf(a); assert.ok(i >= 0, a + ' missing');
    const j = src.indexOf(b, i); assert.ok(j > i, b + ' missing');
    return src.slice(i, j);
}
function helpers() {
    const ctx = { window: D, EW: { time: '#000' }, classifySpellLocal: () => 'damage', spellSlotCost: () => 1 };
    ctx.window.getSpellById = (id) => D.SPELL_BY_ID[id] || null;
    vm.createContext(ctx);
    vm.runInContext(between(PB, 'const TREE_NODE_POS = {', '/* Node color ='), ctx);
    vm.runInContext(between(PB, 'function computeTreeEquipPath(', '/* ══ THE CIRCUIT — THREE LANES'), ctx);
    vm.runInContext(between(PB, 'function pbTechInfo(', 'function TechniquePanel('), ctx);
    return ctx;
}

test('SPELL_SLOT_MAX is 7 and every fallback literal agrees', () => {
    assert.strictEqual(D.SPELL_SLOT_MAX, 7);
    assert.ok(!/SPELL_SLOT_MAX : 6\b/.test(read('data.js')), 'data.js fallback still says 6');
    assert.ok(!/SPELL_SLOT_MAX : 6\b/.test(PB), 'party-builder.js fallback still says 6');
    // a 7-slot walk over a twin race stays legal
    const race = 'quarterback', cls = D.RACE_DEFAULT_JOBS[race];
    for (let i = 0; i < 20; i++) {
        const walk = D.buildTreeLegalLoadout(race, cls, '', 7);
        assert.ok(walk.length <= 7 && D.isTreeLoadoutLegal(race, cls, '', walk), 'walk ' + walk.join(','));
    }
});

test('the fork: each alternate carries its own state, a swap trades in place', () => {
    const H = helpers();
    const race = 'quarterback', cls = D.RACE_DEFAULT_JOBS[race];
    const alts = D.getRaceTreeAlts(race, cls);
    assert.deepStrictEqual(JSON.stringify(Object.keys(alts)), JSON.stringify(['R2', 'R3']));
    const [faceA, altB] = alts.R2;
    const r1 = D.getRaceTreeSpells(race, cls)[0];
    const sealed = new Set();
    // nothing equipped: R2 is far (needs R1), both options read the same
    let tree = D.buildUnitSpellTree(race, cls, '', []);
    H.tree = tree; H.sealed = sealed; H.eq = [];
    assert.strictEqual(vm.runInContext("treeAltState(tree, sealed, eq, 'R2', '" + faceA + "')", H), 'far');
    assert.strictEqual(vm.runInContext("treeAltState(tree, sealed, eq, 'R2', '" + altB + "')", H), 'far');
    // the path resolved for option B puts B (not the face) on the node
    let info = vm.runInContext("pbTechInfo(tree, sealed, eq, 'R2', 7, '" + altB + "')", H);
    assert.deepStrictEqual(JSON.stringify(info.newIds), JSON.stringify([r1, altB]));
    assert.strictEqual(info.alt, altB);
    // wearing A: A is equipped, B reads SWAP and its verb path is empty
    H.eq = [r1, faceA]; tree = D.buildUnitSpellTree(race, cls, '', H.eq); H.tree = tree;
    assert.strictEqual(vm.runInContext("treeAltState(tree, sealed, eq, 'R2', '" + faceA + "')", H), 'equipped');
    assert.strictEqual(vm.runInContext("treeAltState(tree, sealed, eq, 'R2', '" + altB + "')", H), 'swap');
    info = vm.runInContext("pbTechInfo(tree, sealed, eq, 'R2', 7, '" + altB + "')", H);
    assert.strictEqual(info.st8, 'swap'); assert.strictEqual(info.otherAlt, faceA);
    // the swap candidate keeps everything else and is legal
    const swapped = H.eq.map(id => id === faceA ? altB : id);
    assert.ok(D.isTreeLoadoutLegal(race, cls, '', swapped));
    // with the node worn, the fork's default option (no altId) is the worn one
    info = vm.runInContext("pbTechInfo(tree, sealed, eq, 'R2', 7, null)", H);
    assert.strictEqual(info.id, faceA); assert.strictEqual(info.st8, 'equipped');
});

test('the cascade: unequipping a node drops what hung off it, nothing else', () => {
    const H = helpers();
    const race = 'quarterback', cls = D.RACE_DEFAULT_JOBS[race];
    const R = D.getRaceTreeSpells(race, cls);
    const P = D.getClassTreeSpells(cls);
    const eq = [R[0], R[1], R[2], P[0], P[1]];
    assert.ok(D.isTreeLoadoutLegal(race, cls, '', eq));
    const tree = D.buildUnitSpellTree(race, cls, '', eq);
    H.tree = tree; H.sealed = new Set(); H.eq = eq;
    // R1 goes → R2, R3 go with it; the job pillar stays
    let drop = vm.runInContext("[...treeDropIds(tree, eq, '" + R[0] + "')]", H);
    assert.deepStrictEqual(JSON.stringify(drop.sort()), JSON.stringify([R[0], R[1], R[2]].sort()));
    // R3 (the top) goes alone
    drop = vm.runInContext("[...treeDropIds(tree, eq, '" + R[2] + "')]", H);
    assert.deepStrictEqual(JSON.stringify(drop), JSON.stringify([R[2]]));
    // the panel reports the count and the survivors are legal
    const info = vm.runInContext("pbTechInfo(tree, sealed, eq, 'R1', 7, null)", H);
    assert.strictEqual(info.st8, 'equipped'); assert.strictEqual(info.dropCount, 2);
    const rest = eq.filter(id => !info.drop.has(id));
    assert.deepStrictEqual(JSON.stringify(rest), JSON.stringify([P[0], P[1]]));
    assert.ok(D.isTreeLoadoutLegal(race, cls, '', rest));
});

test('the click flow: no picker window, the fork is on the circuit, the cascade lands, notes explain', () => {
    assert.ok(!/setTwinPick\(/.test(PB) && !/twinPick &&/.test(PB), 'the twin picker window is gone');
    for (const sym of ["className: 'pb-tn-fork-row'", "'pb-tn-opt is-'", 'function treeAltState(', 'function treeDropIds(',
                       'function treeAltClick(', 'function twinPickSpell(twinKey, spellId)', 'onAltClick: treeAltClick',
                       'const drop = treeDropIds(unitTree, arr, id);', 'flashTreeNote(', "className: 'pb-tree-note'",
                       "k === 'Tab' && unitTree.alts", "verb = '⇄ SWAP IN'", 'dropIds: treeDrop', 'pipPend', 'pipDrop']) {
        assert.ok(PB.includes(sym), sym + ' missing');
    }
    // an unequip never bounces on "the rest must stay connected" any more
    assert.ok(!PB.includes('unequip only if the rest stays root-connected'), 'the old refusing unequip is gone');
    for (const sel of ['.pb-tn.pb-tn-fork', '.pb-tn-opt', '.pb-tn-opt.is-swap .pb-tn-disc', '.pb-tn-opt.will-drop .pb-tn-disc', '.pb-link.cut',
                       '.pb-pips i.pend', '.pb-pips i.on.drop', '.pb-tree-note', '.pb-technique-keys']) {
        assert.ok(CSS.includes(sel + ' {') || CSS.includes(sel + ','), sel + ' rule missing');
    }
    assert.ok(/@keyframes pbTipIn/.test(CSS), 'pbTipIn keyframe');
});
