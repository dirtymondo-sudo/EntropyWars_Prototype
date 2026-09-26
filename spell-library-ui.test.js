// spell-library-ui.test.js — THE SPELL LIBRARY Phase 1, THE SHELL (SPELL_LIBRARY_PLAN.md §5, §9 row 1).
//
// The screen's DOM-free core lives in ui.js between `SLB2 PURE BEGIN` and `SLB2 PURE END`: the row model
// (_slb2RowOf), the column model (_SLB2_COLUMNS), the filter / sort model, the undo stack, the id check,
// the redundancy query and the summary markdown. This test slices that block out of ui.js and runs it in
// load-data's sandbox (real data.js values), so the pins hold against the census, not a fixture.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data');

const D = loadGameData();
const ui = fs.readFileSync(path.join(__dirname, 'ui.js'), 'utf8');
const a = ui.indexOf('/* SLB2 PURE BEGIN'), b = ui.indexOf('/* SLB2 PURE END */');
assert.ok(a > 0 && b > a, 'the SLB2 PURE block markers exist in ui.js');
vm.runInContext(ui.slice(a, b), D, { filename: 'ui.js#slb2-pure' });
const G = (name) => vm.runInContext(name, D);
const J = (v) => JSON.parse(JSON.stringify(v));   // sandbox values cross a vm realm — compare by value   // top-level consts of a vm script are not on the sandbox global — read them by name

const rows = (() => {
    const jobsOf = {}, racesOf = {};
    Object.keys(D.CLASS_SPELL_LEARN_ORDER).forEach(j => D.CLASS_SPELL_LEARN_ORDER[j].forEach(id => { (jobsOf[id] = jobsOf[id] || []).push(j); }));
    Object.keys(D.RACE_ABILITIES).forEach(r => D.RACE_ABILITIES[r].forEach(ab => { (racesOf[ab.id] = racesOf[ab.id] || []).push(r); }));
    const ctx = D.spellLintContext();
    const out = [], seen = new Set();
    for (const id of Object.keys(D.SPELL_BY_ID)) {
        const def = D.SPELL_BY_ID[id];
        if (!def || def.kind === 'basicAttack' || seen.has(id)) continue;
        seen.add(id);
        out.push(D._slb2RowOf(id, def, { isRace: !!def._isRaceAbility, jobs: jobsOf[id] || [], races: racesOf[id] || [] }, ctx));
    }
    return out;
})();
const report = D.spellReport();

test('the row model covers every row with the computed cells the columns read', () => {
    assert.ok(rows.length >= 500, `rows ${rows.length}`);
    for (const r of rows) {
        assert.ok(Number.isInteger(r.tier) && r.tier >= 1 && r.tier <= 4, `${r.id} tier ${r.tier}`);
        assert.strictEqual(r.sp, D.SPELL_TIER_SP[r.tier], `${r.id} sp`);
        assert.ok(D.SPELL_ROLES.includes(r.role), `${r.id} role ${r.role}`);
        assert.strictEqual(r.role, D.spellRoleOf(r.def));
        assert.ok(Array.isArray(r.families) && Array.isArray(r.statuses) && Array.isArray(r.lint));
        assert.strictEqual(typeof r.searchText, 'string');
        assert.ok(['', 'mod', 'new', 'del'].includes(r.edit));
        if (r.foot) { assert.ok(r.foot.cells.size > 0 && r.foot.n === r.foot.cells.size); assert.ok(r.foot.r >= 1 && r.foot.r <= 3); }
    }
    // the roles the census counts are the roles the rows carry (the census counts a shared kit once; the table lists every id)
    const byRole = {}, seenDef = new Set();
    rows.forEach(r => { if (seenDef.has(r.def)) return; seenDef.add(r.def); byRole[r.role] = (byRole[r.role] || 0) + 1; });
    assert.deepStrictEqual(J(byRole), J(report.byRole));
    // the tier-rule offenders read as red lint on their rows
    const offenders = rows.filter(r => r.lint.some(h => h.rule === 'tierRule')).map(r => r.id).sort();
    assert.deepStrictEqual(J(offenders), J(report.lint.filter(x => x.hits.some(h => h.rule === 'tierRule')).map(x => x.id).sort()));
    assert.strictEqual(offenders.length, 7);
});

test('the footprint: masks first, then cross / line / radius; the presets round-trip', () => {
    const f = (def) => D._slb2Footprint(def);
    assert.strictEqual(f({ kind: 'damage' }), null);
    const m = f({ aoeMask: D.AOE_PRESETS.diamond2 });
    assert.strictEqual(m.kind, 'mask'); assert.strictEqual(m.n, 13); assert.strictEqual(m.label, 'diamond2');
    const r1 = f({ aoeRadius: 1 });
    assert.strictEqual(r1.n, 9); assert.strictEqual(r1.label, '3×3');
    assert.strictEqual(f({ aoeRadius: 2, aoeShape: 'diamond' }).n, 13);
    assert.strictEqual(f({ aoeRadius: 1, aoeShape: 'ring' }).n, 8);
    assert.strictEqual(f({ crossRadius: 2 }).n, 9);
    assert.strictEqual(f({ crossRadius: 1, diamond: true }).n, 5);
    const line = f({ kind: 'line', range: 4, lineWidth: 3 });
    assert.strictEqual(line.kind, 'line'); assert.strictEqual(line.n, 12);
    // the mask wins over the radius, and an invalid mask falls through to the radius
    assert.strictEqual(f({ aoeMask: D.AOE_PRESETS.single, aoeRadius: 2 }).n, 1);
    assert.strictEqual(f({ aoeMask: [[9, 9]], aoeRadius: 1 }).n, 9);
    // clipped to the 7×7
    assert.strictEqual(f({ aoeRadius: 5 }).n, 49);
});

test('the column model: every §5.2 column, sortable, with a grid width', () => {
    const COLS = G('_SLB2_COLUMNS');
    const keys = COLS.map(c => c.key);
    for (const k of ['name', 'tier', 'mp', 'ap', 'cd', 'role', 'element', 'faction', 'kind', 'dmg', 'heal', 'range', 'aoe', 'status', 'bonus', 'push', 'deploy', 'families', 'owner', 'anim', 'lint', 'edit'])
        assert.ok(keys.includes(k), 'column ' + k);
    for (const c of COLS) {
        assert.strictEqual(typeof c.sort, 'function', c.key);
        assert.ok([0, 1, 2].includes(c.pri), c.key + ' pri');
        assert.ok(typeof c.w === 'string' && c.w.length, c.key + ' width');
        for (const r of rows.slice(0, 50)) { const v = c.sort(r); assert.ok(typeof v === 'number' || typeof v === 'string', `${c.key} sort value for ${r.id}`); }
    }
});

test('the filter model over the census: chips AND across groups, OR within; the counts match', () => {
    const F = () => D._slb2EmptyFilters();
    assert.ok(D._slb2FiltersEmpty(F()));
    const all = rows.filter(r => D._slb2MatchRow(r, F(), ''));
    assert.strictEqual(all.length, rows.length);
    const nRole = (...roles) => rows.filter(r => roles.includes(r.role)).length;
    const dmgOnly = F(); dmgOnly.roles.push('damage');
    assert.strictEqual(rows.filter(r => D._slb2MatchRow(r, dmgOnly, '')).length, nRole('damage'));
    assert.ok(nRole('damage') >= report.byRole.damage);
    const two = F(); two.roles.push('damage', 'heal');
    assert.strictEqual(rows.filter(r => D._slb2MatchRow(r, two, '')).length, nRole('damage', 'heal'));
    const fireT1 = F(); fireT1.families.push('fire'); fireT1.tiers.push(1);
    const got = rows.filter(r => D._slb2MatchRow(r, fireT1, ''));
    assert.ok(got.length > 0 && got.every(r => r.families.includes('fire') && r.tier === 1));
    const flags = F(); flags.flags.push('status', 'aoe');
    assert.ok(rows.filter(r => D._slb2MatchRow(r, flags, '')).every(r => r.statuses.length && r.foot));
    const lint = F(); lint.lint.push('tierRule');
    assert.strictEqual(rows.filter(r => D._slb2MatchRow(r, lint, '')).length, 7);
    const owner = F(); owner.owners.push('job:Black Mage');
    assert.deepStrictEqual(J(rows.filter(r => D._slb2MatchRow(r, owner, '')).map(r => r.id).sort()), J(D.CLASS_SPELL_LEARN_ORDER['Black Mage'].slice().sort()));
    // search matches id / name / desc / notes / families
    const fire = rows.filter(r => D._slb2MatchRow(r, F(), 'wall of fire'));
    assert.ok(fire.length >= 1 && fire.some(r => r.id === 'wallOfFire'));
    const counts = D._slb2FilterCounts(rows);
    assert.strictEqual(counts.roles.damage, nRole('damage'));
    assert.strictEqual(counts.tiers[1] + counts.tiers[2] + counts.tiers[3] + counts.tiers[4], rows.length);
    assert.strictEqual(counts.lint.tierRule, 7);
    assert.strictEqual(counts.source.lib + counts.source.race + counts.source.door, rows.length);
});

test('sorting: two keys, direction, stable name tiebreak', () => {
    const byDmg = D._slb2SortRows(rows, [{ key: 'dmg', dir: -1 }]);
    for (let i = 1; i < byDmg.length; i++) assert.ok(byDmg[i - 1].dmg >= byDmg[i].dmg);
    const two = D._slb2SortRows(rows, [{ key: 'tier', dir: 1 }, { key: 'dmg', dir: -1 }]);
    for (let i = 1; i < two.length; i++) {
        assert.ok(two[i - 1].tier <= two[i].tier);
        if (two[i - 1].tier === two[i].tier) assert.ok(two[i - 1].dmg >= two[i].dmg, `${two[i - 1].id} ${two[i].id}`);
    }
    const names = D._slb2SortRows(rows, [{ key: 'name', dir: 1 }]).map(r => String(r.def.name || r.id).toLowerCase());
    for (let i = 1; i < names.length; i++) assert.ok(names[i - 1].localeCompare(names[i]) <= 0);
    assert.strictEqual(D._slb2SortRows(rows, []).length, rows.length);
});

test('the undo stack: 50 deep, redo cleared by a push, snapshots are copies', () => {
    const u = new D._Slb2UndoStack(3);
    assert.ok(!u.canUndo() && !u.canRedo());
    const doc = { modified: { fireball: { dmg: 90 } } };
    u.push('a', {}, doc);
    doc.modified.fireball.dmg = 999;
    assert.strictEqual(u.past[0].after.modified.fireball.dmg, 90, 'a snapshot is a deep copy');
    u.push('b', doc, {}); u.push('c', {}, {}); u.push('d', {}, {});
    assert.strictEqual(u.past.length, 3, 'depth honoured');
    assert.strictEqual(u.past[0].label, 'b');
    const e = u.undo(); assert.strictEqual(e.label, 'd'); assert.ok(u.canRedo());
    assert.strictEqual(u.redo().label, 'd');
    u.undo(); u.push('e', {}, {});
    assert.ok(!u.canRedo(), 'a push clears the redo stack');
    assert.strictEqual(G('_SLB2_UNDO_DEPTH'), 50);
});

test('the id check and the census helpers', () => {
    const taken = id => !!D.SPELL_BY_ID[id];
    assert.strictEqual(D._slb2ValidId('newStrike', taken), null);
    assert.ok(/taken/.test(D._slb2ValidId('fire1', taken)));
    assert.ok(D._slb2ValidId('New Strike', taken));
    assert.ok(D._slb2ValidId('9lives', taken));
    assert.ok(D._slb2ValidId('', taken));
    assert.strictEqual(D._slb2Median([3, 1, 2]), 2);
    assert.strictEqual(D._slb2Median([1, 2, 3, 4]), 3);
    assert.strictEqual(D._slb2Median([]), null);
    const groups = D._slb2RedundancyGroups(rows);
    assert.ok(groups.length > 0);
    for (const g of groups) {
        assert.ok(g.rows.length > 1);
        const kinds = new Set(g.rows.map(r => r.kind)); assert.strictEqual(kinds.size, 1);
        const dmgs = g.rows.map(r => r.dmg); assert.ok(Math.max(...dmgs) - Math.min(...dmgs) <= 20 * (g.rows.length - 1));
    }
});

test('the summary markdown: changed rows with their baseline, new rows as fenced JSON, notes quoted', () => {
    const doc = {
        modified: { fire1: { dmg: 92, notes: 'hotter' } },
        added: { newStrike: { name: 'New Strike', kind: 'damage', tier: 2, dmg: 80, notes: 'a test row', _home: { lib: true } } },
        deleted: ['raceFrenzy'], learnsets: { 'Black Mage': ['fire1'] }, raceAbilities: {}, families: { plasma: { id: 'plasma', name: 'Plasma' } }, upgrades: {}, raceFamilies: {}, views: {}, notes: 'the pass',
    };
    const md = D._slb2SummaryMarkdown(doc, ['MODIFY fire1: dmg 80 → 92'], { fire1: 'hotter', newStrike: 'a test row' }, D.spellReport(), D.SPELL_BY_ID, { fire1: { dmg: 80 } });
    assert.ok(/^# Spell Library export/.test(md));
    assert.ok(md.includes('1 changed · 1 new · 1 deleted'));
    assert.ok(md.includes('## Library notes') && md.includes('the pass'));
    assert.ok(md.includes('- dmg: 80 → 92'));
    assert.ok(md.includes('> hotter'));
    assert.ok(md.includes('### New Strike (newStrike)') && md.includes('```json') && md.includes('"dmg": 80'));
    assert.ok(!md.includes('"notes": "a test row"'), 'a new row\'s notes are quoted, not in the fenced def');
    assert.ok(md.includes('- raceFrenzy'));
    assert.ok(md.includes('## Families') && md.includes('- plasma:'));
    assert.ok(md.includes('## Job learnsets') && md.includes('Black Mage: [fire1]'));
    assert.ok(md.includes('## Census') && md.includes(`${report.rows} rows`));
});

test('the screen keeps the Lab\'s contract: the names it calls still exist in ui.js', () => {
    for (const name of ['_slbEsc', '_slbMods', '_slbJobs', '_slbRaces', '_slbAllRows', '_slbToast', '_slbArchetypes', '_slbStatusIds', 'window._slbSetField', 'window._slbLabRefreshSpell', 'window._slbEnterLab', 'window._renderSpellLibrary'])
        assert.ok(new RegExp('(?:function |)' + name.replace(/[.$]/g, '\\$&') + '\\s*(?:=|\\()').test(ui), name + ' defined');
    for (const c of ['_SLB_ELEMENTS', '_SLB_PROJECTILES', '_SLB_WEIGHTS', '_SLB_TRAVELS', '_SLB_FIELD_HELP'])
        assert.ok(ui.includes('const ' + c), c);
    // the v1 screen is gone: no inline onclick handlers remain in the library block
    const block = ui.slice(ui.indexOf('SPELL LIBRARY v2 — THE SHELL'), ui.indexOf('SPELL LAB — real-engine animation sandbox'));
    assert.strictEqual((block.match(/onclick="/g) || []).length, 0, 'no inline onclick strings in the screen');
    assert.ok(block.includes('_slb2PatchRow(') && block.includes('_slb2PatchField('), 'edits patch, never re-render the pane');
    // the styles and the token
    const css = fs.readFileSync(path.join(__dirname, 'styles-hud.css'), 'utf8');
    assert.ok(css.includes('.slb2-shell') && css.includes('.slb2-tr') && css.includes('.slb2-inspector') && css.includes('.slb-lab {'), 'the v2 styles + the Lab\'s kept');
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    assert.ok(/\?v=\d{8}[a-z0-9-]*-cors/.test(html));
    assert.ok(html.includes('id="spellLibraryPage"') && html.includes('id="spellLibraryBody"'));
    // hud.js draws a drawn mask on the card tiles (5×5) and the library's 7×7
    const hud = fs.readFileSync(path.join(__dirname, 'hud.js'), 'utf8');
    assert.ok(hud.includes("kind: 'mask'") && hud.includes('function _hrlgShapeTiles(shape, opts)'));
});
