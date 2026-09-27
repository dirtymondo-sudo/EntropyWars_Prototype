// spell-tree-ux.test.js — THE TIERS (2026-09-24; was THE FORK + THE CASCADE, 2026-09-13).
//
// The user's spell tree rework: no secondary job, no branches. The rung a
// spell sits on is its TIER (I–IV), costing 1–4 Spell Points; every unit has
// 7 slots and 16 SP; any spell of the unit's pool can be picked in any order.
// This checks data.js's rules over the REAL rows, runs the builder's pure
// rack helpers (pbTierCtx / pbSpellState / pbTierStep / pbTechInfo) in a vm
// sandbox, then source-scans the rack, the SP meter and the CSS.
// THE JOBS REMOVAL + THE FAMILY TABS (2026-09-27): no jobs (every unit is
// UNIT_CLASS), the pool is the race's families + TRAINING + GEAR (+ the
// borrow window while the kit holds ADAPTABLE), the rack is one tab per family.

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
const C = D.UNIT_CLASS;              // THE JOBS REMOVAL (2026-09-27): every unit carries the one neutral class
const AD = D.ADAPTABLE_ROW_ID;       // the Training row that opens the borrow window (the old Freelancer)
const raceTier = (race, t) => D.unitSpellPoolParts(race, C, []).race.filter(id => D.spellTierOf(id) === t);

test('the budget: 7 slots, 16 SP, Tier I–IV cost 1–4 — the rung is the tier', () => {
    assert.strictEqual(D.SPELL_SLOT_MAX, 7);
    assert.strictEqual(D.SPELL_SP_MAX, 16);
    assert.deepStrictEqual(JSON.stringify(D.SPELL_TIER_SP), JSON.stringify([0, 1, 2, 3, 4]));
    assert.ok(!/SPELL_SLOT_MAX : 6\b/.test(read('data.js')), 'data.js fallback still says 6');
    assert.ok(!/SPELL_SLOT_MAX : 6\b/.test(PB), 'party-builder.js fallback still says 6');
    // the knight's curated rungs sit on their tiers and cost their tier
    D.getRaceTreeSpells('knight', C).forEach((id, i) => {
        assert.strictEqual(D.spellTierOf(id), i + 1, 'knight rung ' + (i + 1) + ' (' + id + ')');
        assert.strictEqual(D.spellSpCost(id), i + 1, id + ' SP');
    });
    // a twin rung's two alternates share one tier
    const alts = D.getRaceTreeAlts('quarterback', C);
    assert.ok(Object.keys(alts).length > 0, 'the quarterback keeps a twin rung');
    for (const [key, pair] of Object.entries(alts)) {
        for (const id of pair) assert.strictEqual(D.spellTierOf(id), +key.slice(1), id + ' on ' + key);
    }
    // every Training row is a 1 SP passive
    for (const r of D.TRAINING_PASSIVES) {
        const id = r.id || r;
        assert.ok(D.spellIsPassive(id), id + ' is a passive row');
        assert.strictEqual(D.spellSpCost(id), 1, id + ' costs 1 SP');
    }
    assert.strictEqual(D.loadoutSpUsed(['doubleShot', 'deadEye']), 5);
});

test('any spell, any order: no path, no tier ladder, no twin exclusivity', () => {
    const race = 'knight';
    // a capstone alone is legal (nothing below it)
    assert.ok(D.isTreeLoadoutLegal(race, C, '', ['raceCrusade']));
    assert.ok(D.isTreeLoadoutLegal(race, C, '', ['raceCrusade', 'raceExcaliburStrike']));
    // both alternates of a twin rung — two picks now
    const pair = D.getRaceTreeAlts('quarterback', C).R2;
    assert.ok(D.isTreeLoadoutLegal('quarterback', C, '', pair), 'both twin alternates');
    // a duplicate, an off-pool id (another race's family) are illegal
    assert.ok(!D.isTreeLoadoutLegal(race, C, '', ['raceCrusade', 'raceCrusade']));
    assert.ok(!D.isTreeLoadoutLegal(race, C, '', ['rampage']), 'a homosapien family spell on a knight');
    // ... until the kit holds ADAPTABLE (the borrow window), and the verdict says so
    assert.strictEqual(D.spellAddVerdict(race, C, [], 'rampage').note, 'BORROWED · EQUIP ADAPTABLE FIRST');
    assert.ok(D.isTreeLoadoutLegal(race, C, '', [AD, 'rampage']), 'Adaptable borrows');
    // no graph left to walk
    assert.strictEqual(D.getTreeEdges().length, 0);
});

test('the SP cap: four Tier IV fill 16 (three slots stay empty); seven Tier I fit; the 17th SP is refused', () => {
    const fourIV = raceTier('knight', 4).slice(0, 4);
    assert.strictEqual(fourIV.length, 4, 'the knight carries four Tier IV');
    assert.strictEqual(D.loadoutSpUsed(fourIV), 16);
    assert.ok(D.isTreeLoadoutLegal('knight', C, '', fourIV), '4 × Tier IV');
    const oneI = raceTier('knight', 1)[0];
    assert.ok(!D.isTreeLoadoutLegal('knight', C, '', fourIV.concat([oneI])), '16 + 1 SP');
    const v = D.spellAddVerdict('knight', C, fourIV, oneI);
    assert.strictEqual(v.ok, false); assert.strictEqual(v.reason, 'sp');
    // seven Tier I: the Adaptable row (1 SP) + six borrowed Tier I spells
    const race = 'homosapien';
    const t1 = D.unitSpellPoolParts(race, C, [AD]).borrowRace.filter(id => D.spellTierOf(id) === 1 && !D.spellIsPassive(id));
    const sevenI = [AD].concat(t1.slice(0, 6));
    assert.strictEqual(D.loadoutSpUsed(sevenI), 7);
    assert.ok(D.isTreeLoadoutLegal(race, C, '', sevenI), '7 × Tier I');
    const eighth = t1[6];
    assert.ok(!D.isTreeLoadoutLegal(race, C, '', sevenI.concat([eighth])), 'the eighth slot');
    assert.strictEqual(D.spellAddVerdict(race, C, sevenI, eighth).reason, 'slots');
    // the passive cap: two passive rows, the third is refused
    const v3 = D.spellAddVerdict('knight', C, ['passiveBulwark', 'passiveGrace'], 'passiveRiposte');
    assert.strictEqual(v3.reason, 'passives');
    assert.strictEqual(D.PASSIVE_SLOT_MAX, 2);
});

test('stale kits trim, never crash: borrowed spells go without Adaptable, the budget holds, earlier picks win', () => {
    const race = 'knight';
    // a borrowed spell stays only while the Adaptable row survives the walk (here it is the third passive → dropped)
    assert.deepStrictEqual(JSON.stringify(D.treeLegalSubset(race, C, '', ['rampage', 'raceCrusade', 'passiveBulwark', 'passiveGrace', AD])),
        JSON.stringify(['raceCrusade', 'passiveBulwark', 'passiveGrace']));
    assert.deepStrictEqual(JSON.stringify(D.treeLegalSubset(race, C, '', [AD, 'rampage', 'raceCrusade'])), JSON.stringify([AD, 'rampage', 'raceCrusade']));
    // IV + IV + III + III = 14, I fits (15), II would make 17 → skipped, III skipped, I fits (16), then nothing
    const fixed = D.treeLegalSubset(race, C, '', ['raceCrusade', 'raceExcaliburStrike', 'raceOathOfValor', 'raceKnightsOfRound', 'raceChivalry', 'raceShieldWall', 'bladeWaltz', 'guardSlash', 'crossSlash']);
    assert.ok(D.isTreeLoadoutLegal(race, C, '', fixed));
    assert.ok(D.loadoutSpUsed(fixed) <= 16 && fixed.length <= 7);
    assert.deepStrictEqual(JSON.stringify(fixed), JSON.stringify(['raceCrusade', 'raceExcaliburStrike', 'raceOathOfValor', 'raceKnightsOfRound', 'raceChivalry', 'guardSlash']));
    // garbage never throws
    assert.strictEqual(D.treeLegalSubset(race, C, '', [null, '', 'noSuchSpell']).length, 0);
});

test('random kits are legal for every race (and the AI never exceeds the budget, never rolls Adaptable)', () => {
    let n = 0;
    for (const race of D.AVAILABLE_RACES) {
        const kit = D.buildTreeLegalLoadout(race, C, '');
        assert.ok(D.isTreeLoadoutLegal(race, C, '', kit), race + ': ' + kit.join(','));
        assert.ok(kit.length >= 1, race + ' rolled nothing');
        assert.ok(!kit.includes(AD), race + ' rolled Adaptable');
        const def = D.raceDefaultKit(race);
        assert.ok(D.isTreeLoadoutLegal(race, C, '', def), race + ' default kit: ' + def.join(','));
        n++;
    }
    assert.ok(n > 40);
    for (let i = 0; i < 10; i++) {
        const kit = D.buildTreeLegalLoadout('homosapien', C, '');
        assert.ok(D.isTreeLoadoutLegal('homosapien', C, '', kit), 'homosapien ' + kit.join(','));
    }
    // the officer's kit leads with Adaptable and stays legal
    const off = D.raceDefaultKit('homosapien', [AD]);
    assert.strictEqual(off[0], AD);
    assert.ok(D.isTreeLoadoutLegal('homosapien', C, '', off));
});

test('the rack helpers: THE FAMILY TABS, states, the keyboard grid, the panel', () => {
    const H = helpers();
    H.C = C;
    H.eq = ['raceCrusade', 'raceExcaliburStrike', 'raceOathOfValor', 'raceKnightsOfRound'];   // 14 SP
    const ctx = vm.runInContext("pbTierCtx('knight', C, eq, null, null)", H);
    H.ctx = ctx;
    assert.strictEqual(ctx.spUsed, 14);
    assert.strictEqual(ctx.cap, 7); assert.strictEqual(ctx.spMax, 16); assert.strictEqual(ctx.pasMax, 2);
    // the tabs: the race's families (RACE_FAMILIES order, the empty ones skipped), then TRAINING, GEAR, BORROW
    const famTabs = D.spellFamilyGroups(D.unitSpellPoolParts('knight', C, []).race, 'knight').filter(g => g.ids.length).map(g => 'f:' + g.fam);
    assert.deepStrictEqual(JSON.stringify(ctx.tabs.map(t => t.key)), JSON.stringify(famTabs.concat(['training', 'gear', 'borrow'])));
    assert.ok(famTabs.includes('f:knight') && famTabs.includes('f:swordsmanship'));
    for (const t of ctx.tabs) for (const k of ['key', 'kind', 'name', 'glyph', 'color', 'desc', 'ids', 'on']) assert.ok(k in t, t.key + ' lacks ' + k);
    assert.strictEqual(ctx.tab, ctx.tabs[0], 'no wish opens the first tab');
    // a tab's cards run tier I → IV; `on` counts the equipped ones; every race id sits in exactly one family tab
    for (const t of ctx.tabs.filter(t => t.kind === 'family')) {
        const tiers = t.ids.map(id => D.spellTierOf(id));
        assert.deepStrictEqual(JSON.stringify(tiers), JSON.stringify(tiers.slice().sort((a, b) => a - b)), t.key + ' is tier-ordered');
        assert.strictEqual(t.on, t.ids.filter(id => H.eq.includes(id)).length);
    }
    const famIds = ctx.tabs.filter(t => t.kind === 'family').reduce((a, t) => a.concat(t.ids), []);
    assert.deepStrictEqual(JSON.stringify(famIds.slice().sort()), JSON.stringify(ctx.parts.race.slice().sort()));
    const training = ctx.tabs.find(t => t.key === 'training');
    assert.strictEqual(training.ids.length, D.TRAINING_PASSIVES.length);
    assert.ok(training.ids.includes(AD));
    assert.ok(ctx.tabs.find(t => t.key === 'gear').ids.every(id => !training.ids.includes(id)), 'TRAINING and GEAR never share a row');
    const borrow = ctx.tabs.find(t => t.key === 'borrow');
    assert.ok(borrow.locked && !ctx.borrows && borrow.ids.length === 0, 'no Adaptable → the BORROW tab is locked and empty');
    // a wish opens its tab; a stale wish opens the first
    assert.strictEqual(vm.runInContext("pbTierCtx('knight', C, eq, null, 'training')", H).tab.key, 'training');
    assert.strictEqual(vm.runInContext("pbTierCtx('knight', C, eq, null, 'tier')", H).tab.key, ctx.tabs[0].key);
    // the verdicts
    assert.strictEqual(vm.runInContext("pbSpellState(ctx, 'raceCrusade')", H), 'equipped');
    assert.strictEqual(vm.runInContext("pbSpellState(ctx, 'raceShieldWall')", H), 'ok');          // 14 + 2 = 16
    assert.strictEqual(vm.runInContext("pbSpellState(ctx, 'rampage')", H), 'pool');               // borrowed, no Adaptable
    H.eq2 = H.eq.concat(['raceShieldWall']);
    H.ctx2 = vm.runInContext("pbTierCtx('knight', C, eq2, null, null)", H);
    assert.strictEqual(vm.runInContext("pbSpellState(ctx2, 'guardSlash')", H), 'sp');            // 16 + 1
    // the panel reads tier + cost + verdict + the family + the source
    const info = vm.runInContext("pbTechInfo(ctx, 'raceShieldWall', null)", H);
    assert.strictEqual(info.tier, 2); assert.strictEqual(info.cost, 2); assert.strictEqual(info.st8, 'ok'); assert.strictEqual(info.source, 'race');
    assert.ok(info.fam && info.fam.id && info.fam.name && info.fam.glyph, 'the panel names the family');
    const pinfo = vm.runInContext("pbTechInfo(ctx, 'passiveBulwark', null)", H);
    assert.strictEqual(pinfo.source, 'training'); assert.strictEqual(pinfo.cost, 1); assert.strictEqual(pinfo.fam.id, 'training');
    assert.strictEqual(vm.runInContext("PB_SOURCE_LABEL[pinfo.source]", Object.assign(H, { pinfo })), 'EVERY UNIT');
    assert.strictEqual(vm.runInContext("pbTechInfo(ctx, 'root', null)", H).st8, 'root');
    assert.strictEqual(vm.runInContext("pbTechInfo(ctx, 'FIN', { id: 'x' })", H).st8, 'finisher');
    // the keyboard grid: the open tab's cards two to a row, then the ALWAYS READY foot [finisher, root]
    for (const t of ctx.tabs.filter(t => t.kind !== 'borrow')) {
        H.ct = vm.runInContext("pbTierCtx('knight', C, eq, null, " + JSON.stringify(t.key) + ")", H);
        const grid = vm.runInContext("pbTierGrid(ct, { id: 'fin' })", H);
        assert.deepStrictEqual(JSON.stringify(grid[grid.length - 1]), JSON.stringify(['FIN', 'root']), t.key + ': the foot closes the grid');
        assert.ok(grid.slice(0, -1).every(r => r.length >= 1 && r.length <= 2), t.key + ': two to a row');
        assert.deepStrictEqual(JSON.stringify(grid.slice(0, -1).flat()), JSON.stringify(t.ids), t.key + ': every card reachable, in order');
        // walk every card with the arrows from the first one: each is reachable, and ↓ from the last row lands on the foot
        H.grid = grid;
        const seen = new Set();
        for (const row of grid) for (const k of row) {
            for (const dir of ['up', 'down', 'left', 'right']) {
                H.k = k; H.dir = dir;
                seen.add(vm.runInContext("pbTierStep(ct, k, dir, { id: 'fin' })", H));
            }
        }
        for (const id of t.ids) assert.ok(seen.has(id) || t.ids.length === 1, t.key + ': ' + id + ' unreachable by the arrows');
        if (grid.length > 1) {
            H.last = grid[grid.length - 2][0];
            assert.strictEqual(vm.runInContext("pbTierStep(ct, last, 'down', { id: 'fin' })", H), 'FIN');
        }
    }
    assert.deepStrictEqual(JSON.stringify(vm.runInContext("pbTierGrid(ctx, null)", H).slice(-1)[0]), JSON.stringify(['root']), 'no finisher → the root alone');
    // ADAPTABLE: the BORROW tab opens, the borrowed pick lands on it (never a family tab), the grid's ＋ BROWSE key is 'B0'
    H.fe = [AD, 'rampage'];
    const fl = vm.runInContext("pbTierCtx('knight', C, fe, null, 'borrow')", H);
    H.fl = fl;
    assert.ok(fl.borrows && fl.isFreelancer === fl.borrows, 'isFreelancer is the old alias of borrows');
    assert.strictEqual(fl.tab.key, 'borrow'); assert.ok(!fl.tab.locked);
    assert.deepStrictEqual(JSON.stringify(fl.tab.ids), JSON.stringify(['rampage']));
    assert.strictEqual(fl.tab.on, 1);
    assert.strictEqual(fl.sourceOf.rampage, 'borrowRace');
    assert.ok(fl.borrowCount > 100, 'every other race\'s families');
    assert.ok(!fl.tabs.filter(t => t.kind === 'family').some(t => t.ids.includes('rampage')), 'a borrowed spell never joins a family tab of the race');
    const bg = vm.runInContext("pbTierGrid(fl, null)", H);
    assert.deepStrictEqual(JSON.stringify(bg.slice(-2)), JSON.stringify([['B0'], ['root']]));
    const b0 = vm.runInContext("pbTechInfo(fl, 'B0', null)", H);
    assert.strictEqual(b0.st8, 'borrow'); assert.strictEqual(b0.count, fl.borrowCount);
    // the locked BORROW tab has no ＋ BROWSE key
    H.lk = vm.runInContext("pbTierCtx('knight', C, eq, null, 'borrow')", H);
    assert.deepStrictEqual(JSON.stringify(vm.runInContext("pbTierGrid(lk, null)", H)), JSON.stringify([['root']]));
});

test('the builder: the rack is the family tabs, no jobs anywhere, the SP meter + verdicts explain', () => {
    for (const sym of ['function SpellTierPanel(', 'h(SpellTierPanel, {', 'function tierSpellClick(id)', "className: 'pb-loadout'",
                       "className: 'pb-famtabs'", "className: 'pb-fambody'", "className: 'pb-famhead'", "className: 'pb-famrule'", "className: 'pb-tier-cells'",
                       "className: 'pb-sp'", 'flashTreeNote(', "className: 'pb-tree-note'",
                       'pbSpellVerdict(unitTiers', "'＋ BORROW · TIER '", 'pipPend', 'spPend', 'function pbRoleLabel(race)']) {
        assert.ok(PB.includes(sym), sym + ' missing');
    }
    for (const gone of ['function SpellTreePanel(', 'function computeTreeEquipPath(', 'function treeDropIds(', 'function treeAltState(',
                        'function twinPickSpell(', 'function handleSecJobChange(', "equipPicker === 'subjob'", "'＋ SUBCLASS'", 'TREE_NODE_POS',
                        // THE FAMILY TABS (2026-09-27): the tier rows and the BY FAMILY / BY TIER toggle are gone
                        "className: 'pb-tiers'", "className: 'pb-tier'", "className: 'pb-tier-head'", 'ew_rack_group', 'PB_RACK_GROUP', "'BY TIER'",
                        'function finStrip(', 'finChip(', "className: 'pb-rack-foot'",
                        // THE JOBS REMOVAL: no job picker, no job pill, no secondary job, no Freelancer
                        'JOB_ARCHETYPES', 'RACE_DEFAULT_JOBS', 'getJobDisplayName', 'JOB_DISPLAY_NAMES', 'flWildcardPool', 'flOwnedJobs', 'CLASS_TREE',
                        "'Freelancer'", "pbMenu === 'job'", 'cccJobSelect', 'getJobPassive']) {
        assert.ok(!PB.includes(gone), gone + ' should be gone');
    }
    for (const sel of ['.pb-rack', '.pb-loadout', '.pb-ls', '.pb-tier-cells', '.pb-tc-cost', '.pb-tc-why',
                       '.pb-tn.is-sp .pb-tn-disc', '.pb-sp-cells i.on', '.pb-sp-cells i.pend', '.pb-tree-note', '.pb-technique-keys',
                       '.pb-famtabs', '.pb-famtab', '.pb-fambody', '.pb-famhead', '.pb-famrule', '.pb-famlock', '.pb-ls-ready', '.pb-ls-mini', '.pb-rack-head', '.pb-rack-body']) {
        assert.ok(CSS.includes(sel + ' {') || CSS.includes(sel + ','), sel + ' rule missing');
    }
    assert.ok(/@keyframes pbTipIn/.test(CSS), 'pbTipIn keyframe');
    // the , and . keys walk the tabs; a new unit re-opens the first tab
    assert.ok(/k === ',' \|\| k === '<' \|\| k === '\.' \|\| k === '>'/.test(PB), 'the , . tab keys');
    assert.ok(/React\.useEffect\(\(\) => \{ setFlSocketPick\(null\); setRackTab\(null\); \}, \[player, slot, clsName, unitRace\]\)/.test(PB), 'the open tab resets per unit');
    assert.ok(/onTab: \(k\) => \{ setRackTab\(k\);/.test(PB), 'a tab click opens it');
});

test('the jobs are gone: no secondary job, no job globals, no level-15 pick', () => {
    const B = read('battle.js'), S = read('state.js'), M = read('map.js');
    assert.ok(!/function applySecondaryJob\(|function aiPickSecondaryJob\(/.test(B), 'applySecondaryJob / aiPickSecondaryJob are deleted');
    assert.ok(!B.includes("'Choose a Secondary Job!'"), 'the level-15 milestone is gone');
    assert.ok(!/meta\.secondaryJob = secJob/.test(S), 'the randomizer never rolls a second job');
    assert.ok(!/applySecondaryJob\(/.test(M), 'story / campaign builds never apply one');
    for (const g of ['RACE_DEFAULT_JOBS', 'JOB_ARCHETYPES', 'JOB_KITS', 'JOB_PASSIVES', 'CLASS_TREE', 'flWildcardPool', 'flOwnedJobs', 'getJobDisplayName'])
        assert.strictEqual(D[g], undefined, g + ' is deleted');
    assert.deepStrictEqual(Object.keys(D.CLASS_TEMPLATES), [C], 'one neutral class');
    // the pool keeps the old keys as empty arrays for old callers
    const p = D.unitSpellPoolParts('knight', C, [AD]);
    assert.strictEqual(p.job.length, 0); assert.strictEqual(p.borrowJob.length, 0);
});

/* ── THE LOOK PASS (2026-09-24, mondo: lit when equipped · real type badges · the battle menu's element + AOE grid ·
   the finisher on top · bigger text) — the builder rack and the HQ pause rack both ── */
test('the look pass: battle badges + AOE grid on every chip, the finisher leads, equipped chips stay lit', () => {
    for (const sym of ['function pbSpellBadges(sp, max)', 'function pbAoeTiles(sp, big)', "typeof _hrlgSpellBadges === 'function'", "typeof _hrlgSpellShape === 'function'",
                       "h('span', { className: 'pb-tc-badges' }, ...pbSpellBadges(sp, 4),", "h('span', { className: 'pb-tc-top' },", "h('span', { className: 'pb-tc-bottom' },", "className: 'pb-technique-badges'"]) {
        assert.ok(PB.includes(sym), 'party-builder.js: ' + sym);
    }
    assert.ok(!PB.includes("className: 'pb-tn-type'"), 'the little TYPE circles are gone — the regular type badge replaces them');
    // THE FAMILY TABS (2026-09-27): the head = the loadout (7 slot cards + the ALWAYS READY cell: the finisher over the
    // basic attack) then the tab bar; the open family scrolls in the body under it. No foot strip.
    const panel = between(PB, 'function SpellTierPanel(', 'function pbTechInfo(');
    const ret = panel.slice(panel.lastIndexOf("return h('div', { className: 'pb-circuit pb-rack pb-rack-tabs' },"));
    assert.ok(ret.length > 0 && /h\('div', \{ className: 'pb-rack-head' \}, loadout, tabBar\),\s*h\('div', \{ className: 'pb-rack-body' \}, body\)\)/.test(ret), 'head (loadout + tabs) over the scrolling body');
    const iReady = panel.indexOf("className: 'pb-ls-ready'"), iFin = panel.indexOf("'pb-ls-mini pb-ls-fin is-finisher'"), iRoot = panel.indexOf("'pb-ls-mini pb-ls-root'");
    assert.ok(iReady > 0 && iReady < iFin && iFin < iRoot && iRoot < panel.indexOf('const tabBar'), 'the finisher leads the ALWAYS READY cell, the basic attack under it, both in the loadout');
    assert.ok(/'data-finisher': finisher\.id/.test(panel) && /onSelect\(PB_FIN_KEY\)/.test(panel) && /onSelect\('root'\)/.test(panel), 'each half selects into the technique panel');
    assert.ok(!panel.includes("'pb-rack-foot'"), 'no foot strip');
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
