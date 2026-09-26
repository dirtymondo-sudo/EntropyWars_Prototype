// spell-tree-ux.test.js — THE TIERS (2026-09-24; was THE FORK + THE CASCADE, 2026-09-13).
//
// The user's spell tree rework: no secondary job, no branches. The rung a
// spell sits on is its TIER (I–IV), costing 1–4 Spell Points; every unit has
// 7 slots and 16 SP; any spell of the unit's pool can be picked in any order.
// This checks data.js's rules over the REAL rows, runs the builder's pure
// rack helpers (pbTierCtx / pbSpellState / pbTierStep / pbTechInfo) in a vm
// sandbox, then source-scans the rack, the SP meter and the CSS.

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
    const ctx = { window: D, EW: { time: '#000' }, PB_FIN_KEY: 'FIN', classifySpellLocal: () => 'damage' };
    ctx.window.getSpellById = (id) => D.SPELL_BY_ID[id] || null;
    vm.createContext(ctx);
    vm.runInContext(between(PB, 'const PB_TIER_ORDER = [4, 3, 2, 1];', 'function pbNodeMeta('), ctx);
    vm.runInContext(between(PB, 'function pbTechInfo(', 'function TechniquePanel('), ctx);
    return ctx;
}
const FL_RACE = 'homosapien';
const jobRung = (n) => Object.values(D.CLASS_TREE).map(ids => ids[n - 1]);

test('the budget: 7 slots, 16 SP, Tier I–IV cost 1–4 — the rung is the tier', () => {
    assert.strictEqual(D.SPELL_SLOT_MAX, 7);
    assert.strictEqual(D.SPELL_SP_MAX, 16);
    assert.deepStrictEqual(JSON.stringify(D.SPELL_TIER_SP), JSON.stringify([0, 1, 2, 3, 4]));
    assert.ok(!/SPELL_SLOT_MAX : 6\b/.test(read('data.js')), 'data.js fallback still says 6');
    assert.ok(!/SPELL_SLOT_MAX : 6\b/.test(PB), 'party-builder.js fallback still says 6');
    for (const [job, ids] of Object.entries(D.CLASS_TREE)) {
        ids.forEach((id, i) => {
            assert.strictEqual(D.spellTierOf(id), i + 1, job + ' rung ' + (i + 1) + ' (' + id + ')');
            assert.strictEqual(D.spellSpCost(id), i + 1, id + ' SP');
        });
    }
    // a race row's rungs are tiers too (the face and the alternate of a twin share one)
    const alts = D.getRaceTreeAlts('quarterback', D.RACE_DEFAULT_JOBS.quarterback);
    for (const [key, pair] of Object.entries(alts)) {
        for (const id of pair) assert.strictEqual(D.spellTierOf(id), +key.slice(1), id + ' on ' + key);
    }
    assert.strictEqual(D.loadoutSpUsed(['doubleShot', 'deadEye']), 5);
});

test('any spell, any order: no path, no tier ladder, no twin exclusivity', () => {
    const race = 'knight', cls = 'Warrior';
    // a capstone alone is legal (nothing below it)
    assert.ok(D.isTreeLoadoutLegal(race, cls, '', ['judgment']));
    assert.ok(D.isTreeLoadoutLegal(race, cls, '', ['raceCrusade', 'groundSlam']));
    // both alternates of a twin rung — two picks now
    const qb = 'quarterback', qcls = D.RACE_DEFAULT_JOBS[qb];
    const pair = D.getRaceTreeAlts(qb, qcls).R2;
    assert.ok(D.isTreeLoadoutLegal(qb, qcls, '', pair), 'both twin alternates');
    // a duplicate, an off-pool id (another job's spell) are illegal
    assert.ok(!D.isTreeLoadoutLegal(race, cls, '', ['judgment', 'judgment']));
    assert.ok(!D.isTreeLoadoutLegal(race, cls, '', ['fortify']), 'a Tank spell on a Warrior');
    // no graph left to walk
    assert.strictEqual(D.getTreeEdges().length, 0);
});

test('the SP cap: four Tier IV fill 16 (three slots stay empty); seven Tier I fit; the 17th SP is refused', () => {
    const cls = 'Freelancer';
    const fourIV = jobRung(4).slice(0, 4);
    assert.strictEqual(D.loadoutSpUsed(fourIV), 16);
    assert.ok(D.isTreeLoadoutLegal(FL_RACE, cls, '', fourIV), '4 × Tier IV');
    const oneI = jobRung(1)[0];
    assert.ok(!D.isTreeLoadoutLegal(FL_RACE, cls, '', fourIV.concat([oneI])), '16 + 1 SP');
    const v = D.spellAddVerdict(FL_RACE, cls, fourIV, oneI);
    assert.strictEqual(v.ok, false); assert.strictEqual(v.reason, 'sp');
    const sevenI = jobRung(1).slice(0, 7);
    assert.ok(D.isTreeLoadoutLegal(FL_RACE, cls, '', sevenI), '7 × Tier I');
    const eighth = jobRung(1)[7];
    assert.ok(!D.isTreeLoadoutLegal(FL_RACE, cls, '', sevenI.concat([eighth])), 'the eighth slot');
    assert.strictEqual(D.spellAddVerdict(FL_RACE, cls, sevenI, eighth).reason, 'slots');
});

test('stale saves trim, never crash: a retired secondary job\'s spells go, the budget holds, earlier picks win', () => {
    const race = 'knight', cls = 'Warrior';
    // an old Warrior + Tank save: the Tank row goes, the rest fits
    const old = ['fortify', 'provoke', 'judgment', 'raceCrusade', 'groundSlam', 'raceOathOfValor', 'guardSlash', 'warCry'];
    const fixed = D.treeLegalSubset(race, cls, 'Tank', old);
    assert.ok(!fixed.includes('fortify') && !fixed.includes('provoke'));
    assert.ok(D.isTreeLoadoutLegal(race, cls, '', fixed));
    assert.ok(D.loadoutSpUsed(fixed) <= 16 && fixed.length <= 7);
    // IV + IV + III + III = 14, then guardSlash (1) fits, warCry (2) would make 17 → skipped, not truncated
    assert.deepStrictEqual(JSON.stringify(fixed), JSON.stringify(['judgment', 'raceCrusade', 'groundSlam', 'raceOathOfValor', 'guardSlash']));
    // garbage never throws
    assert.strictEqual(D.treeLegalSubset(race, cls, '', [null, '', 'noSuchSpell']).length, 0);
});

test('random kits are legal for every race and job (and the AI never exceeds the budget)', () => {
    let n = 0;
    for (const race of D.AVAILABLE_RACES) {
        const cls = D.RACE_DEFAULT_JOBS[race] || 'Freelancer';
        const kit = D.buildTreeLegalLoadout(race, cls, '');
        assert.ok(D.isTreeLoadoutLegal(race, cls, '', kit), race + '/' + cls + ': ' + kit.join(','));
        assert.ok(kit.length >= 1, race + ' rolled nothing');
        n++;
    }
    assert.ok(n > 40);
    for (let i = 0; i < 10; i++) {
        const kit = D.buildTreeLegalLoadout(FL_RACE, 'Freelancer', '');
        assert.ok(D.isTreeLoadoutLegal(FL_RACE, 'Freelancer', '', kit), 'freelancer ' + kit.join(','));
    }
});

test('the rack helpers: rows by tier, states, the keyboard grid, the panel', () => {
    const H = helpers();
    const race = 'knight', cls = 'Warrior';
    H.eq = ['judgment', 'raceCrusade', 'groundSlam', 'raceOathOfValor'];   // 14 SP
    const ctx = vm.runInContext("pbTierCtx('knight', 'Warrior', eq, null, 'tier')", H);   // the TIER fold (Phase 7's family fold below)
    H.ctx = ctx;
    assert.strictEqual(ctx.spUsed, 14);
    // Phase 6: the knight's families (Knighthood, Camelot Powers, Swordsmanship) add their members to the tier rows
    assert.deepStrictEqual(JSON.stringify(ctx.rows[4].slice().sort()), JSON.stringify(['judgment', 'raceCrusade', 'dragonSlash', 'raceBlessedBlade', 'raceExcaliburStrike'].sort()));
    assert.deepStrictEqual(JSON.stringify(ctx.rows[1].slice().sort()), JSON.stringify(['guardSlash', 'raceChivalry', 'crossSlash', 'raceRoyalDecree'].sort()));
    assert.strictEqual(vm.runInContext("pbSpellState(ctx, 'judgment')", H), 'equipped');
    assert.strictEqual(vm.runInContext("pbSpellState(ctx, 'warCry')", H), 'ok');         // 14 + 2 = 16
    H.eq2 = H.eq.concat(['warCry']);
    H.ctx2 = vm.runInContext("pbTierCtx('knight', 'Warrior', eq2, null, 'tier')", H);
    assert.strictEqual(vm.runInContext("pbSpellState(ctx2, 'guardSlash')", H), 'sp');    // 16 + 1
    // the panel reads tier + cost + verdict
    const info = vm.runInContext("pbTechInfo(ctx, 'warCry', null)", H);
    assert.strictEqual(info.tier, 2); assert.strictEqual(info.cost, 2); assert.strictEqual(info.st8, 'ok'); assert.strictEqual(info.source, 'job');
    assert.strictEqual(vm.runInContext("pbTechInfo(ctx, 'root', null)", H).st8, 'root');
    // the keyboard grid: IV row first, the root last; ↓ from the last tier lands on the root
    const grid = vm.runInContext("pbTierGrid(ctx, null)", H);
    assert.ok(grid[0].includes('judgment') && grid[grid.length - 1][0] === 'root');
    assert.strictEqual(vm.runInContext("pbTierStep(ctx, grid[grid.length - 2][0], 'down', null)", Object.assign(H, { grid })), 'root');
    // a Freelancer's rows end in BORROW keys and its borrowed picks join their tier
    H.fe = [jobRung(4)[0]];
    const fl = vm.runInContext("pbTierCtx('homosapien', 'Freelancer', fe, null, 'tier')", H);
    assert.ok(fl.isFreelancer && fl.rows[4].includes(jobRung(4)[0]), 'borrowed IV on the IV row');
    H.fl = fl;
    assert.ok(vm.runInContext("pbTierGrid(fl, null)", H).some(r => r.includes('B4')), 'the B4 key');
    const b = vm.runInContext("pbTechInfo(fl, 'B2', null)", H);
    assert.strictEqual(b.st8, 'borrow'); assert.ok(b.count > 0);
    // THE FAMILY FOLD (Phase 7, the default): a grid row per family, the Freelancer's one 'B0' borrow row, the root last
    H.ff = vm.runInContext("pbTierCtx('homosapien', 'Freelancer', fe)", H);
    assert.strictEqual(H.ff.group, 'family');
    const fg = vm.runInContext("pbTierGrid(ff, null)", H);
    assert.strictEqual(fg.length, H.ff.famRows.filter(g => g.ids.length).length + (H.ff.passives.length ? 1 : 0) + 2);
    assert.deepStrictEqual(JSON.stringify(fg[fg.length - 2 - (H.ff.passives.length ? 1 : 0)]), JSON.stringify(['B0']));
    const b0 = vm.runInContext("pbTechInfo(ff, 'B0', null)", H);
    assert.strictEqual(b0.st8, 'borrow'); assert.strictEqual(b0.count, H.ff.borrowCount);
});

test('the builder: the rack replaced the circuit, no subclass anywhere, the SP meter + verdicts explain', () => {
    for (const sym of ['function SpellTierPanel(', 'h(SpellTierPanel, {', 'function tierSpellClick(id)', "className: 'pb-loadout'",
                       "className: 'pb-tier'", "className: 'pb-sp'", 'flashTreeNote(', "className: 'pb-tree-note'",
                       'pbSpellVerdict(unitTiers', "'＋ BORROW · TIER '", 'pipPend', 'spPend']) {
        assert.ok(PB.includes(sym), sym + ' missing');
    }
    for (const gone of ['function SpellTreePanel(', 'function computeTreeEquipPath(', 'function treeDropIds(', 'function treeAltState(',
                        'function twinPickSpell(', 'function handleSecJobChange(', "equipPicker === 'subjob'", "'＋ SUBCLASS'", 'TREE_NODE_POS']) {
        assert.ok(!PB.includes(gone), gone + ' should be gone');
    }
    for (const sel of ['.pb-rack', '.pb-loadout', '.pb-ls', '.pb-tier', '.pb-tier-head b', '.pb-tier-cells', '.pb-tc-cost', '.pb-tc-why',
                       '.pb-tn.is-sp .pb-tn-disc', '.pb-sp-cells i.on', '.pb-sp-cells i.pend', '.pb-tree-note', '.pb-technique-keys']) {
        assert.ok(CSS.includes(sel + ' {') || CSS.includes(sel + ','), sel + ' rule missing');
    }
    assert.ok(/@keyframes pbTipIn/.test(CSS), 'pbTipIn keyframe');
});

test('the secondary job is retired: no level-15 pick, no bonus, no random second job', () => {
    const B = read('battle.js'), S = read('state.js'), M = read('map.js');
    const apply = between(B, 'function applySecondaryJob(unit, jobName) {', 'function aiPickSecondaryJob(unit) {');
    assert.ok(!/computeSecJobBonuses|learnSpellForUnit/.test(apply), 'applySecondaryJob is a no-op');
    assert.ok(!B.includes("'Choose a Secondary Job!'"), 'the level-15 milestone is gone');
    assert.ok(!/meta\.secondaryJob = secJob/.test(S), 'the randomizer no longer rolls a second job');
    assert.ok(!/applySecondaryJob\(newUnit/.test(M), 'story / campaign builds no longer apply one');
});

/* ── THE LOOK PASS (2026-09-24, mondo: lit when equipped · real type badges · the battle menu's element + AOE grid ·
   the finisher on top · bigger text) — the builder rack and the HQ pause rack both ── */
test('the look pass: battle badges + AOE grid on every chip, the finisher leads, equipped chips stay lit', () => {
    for (const sym of ['function pbSpellBadges(sp, max)', 'function pbAoeTiles(sp, big)', "typeof _hrlgSpellBadges === 'function'", "typeof _hrlgSpellShape === 'function'",
                       "h('span', { className: 'pb-tc-badges' }, ...pbSpellBadges(sp, 4),", "h('span', { className: 'pb-tc-top' },", "h('span', { className: 'pb-tc-bottom' },", "className: 'pb-technique-badges'"]) {
        assert.ok(PB.includes(sym), 'party-builder.js: ' + sym);
    }
    assert.ok(!PB.includes("className: 'pb-tn-type'"), 'the little TYPE circles are gone — the regular type badge replaces them');
    const panel = PB.slice(PB.indexOf('function SpellTierPanel('), PB.indexOf('function finStrip('));
    const ret = panel.slice(panel.lastIndexOf("return h('div', { className: 'pb-circuit pb-rack' },"));
    assert.ok(ret.indexOf('finStrip()') > 0 && ret.indexOf('finStrip()') < ret.indexOf("className: 'pb-tiers'"), 'the finisher sits above Tier IV');
    assert.ok(ret.indexOf("className: 'pb-tiers'") < ret.indexOf("className: 'pb-rack-foot'"), 'the basic attack closes the rack');
    assert.ok(/\.pb-tn\.pb-tc\.is-equipped, \.pb-tn\.pb-tc\.is-equipped\.hov, \.pb-tn\.pb-tc\.is-equipped\.can:hover \{\s*background: linear-gradient/.test(CSS), 'an equipped chip keeps its fill, hovered or not');
    for (const sel of ['.pb-aoe {', '.pb-aoe i.ctr {', '.pb-tc-badges {', '#hqPage .hq-circ-aoe {', '#hqPage .hq-circ-fin {', '#hqPage .hq-circ-node span.hq-circ-badges {']) assert.ok(CSS.includes(sel), 'styles-base.css: ' + sel);
    assert.ok(/\.pb-tier-cells \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/.test(CSS), 'two spells side by side (mondo)');
    assert.ok(!PB.includes("h('span', { className: 'pb-tc-side' }"), 'no right-hand column on a card');
    const M = read('map.js');
    for (const sym of ['function _hqSpellBadgesHtml(sp, max)', 'function _hqAoeTilesHtml(sp)', 'function _hqPauseFinisherHtml(m)', 'html += _hqPauseFinisherHtml(m);']) assert.ok(M.includes(sym), 'map.js: ' + sym);
    const H = read('hud.js');
    assert.ok(/function _hrlgSpellBadges\(sp, cat, quick\)/.test(H) && /function _hrlgSpellShape\(sp\)/.test(H), 'the battle menu readers the racks borrow');
    // the grid geometry: a cross r1 lights 5 of 9, the centre marked
    const blk = PB.slice(PB.indexOf('function pbAoeShape(sp)'), PB.indexOf('function SpellTierPanel('));
    const ctx = { h: (t, p, ...k) => ({ t, p, k }), _hrlgSpellShape: (sp) => ({ kind: 'cross', r: 1, label: 'Cross r1' }) };
    vm.createContext(ctx);
    vm.runInContext(blk + '\nthis.pbAoeTiles = pbAoeTiles;', ctx);
    const g = ctx.pbAoeTiles({ id: 'x' });
    const cls = g.k.map(c => c.p.className);
    assert.strictEqual(cls.length, 9);
    assert.strictEqual(cls.filter(c => c !== 'off').length, 5);
    assert.strictEqual(cls[4], 'ctr');
});
