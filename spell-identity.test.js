// spell-identity.test.js — THE IDENTITY GENERATOR (SPELL LIBRARY, the IDENTITY tab; SPELL_LIBRARY_PLAN.md §11).
//
// The generator's DOM-free core lives in ui.js between `SLB IDENTITY BEGIN` and `SLB IDENTITY END`: the family kits,
// the written archetypes and slbIdentityBuild. This test slices that block out of ui.js and runs it in load-data's
// sandbox against the real SPELL_FAMILIES / RACE_FAMILIES, so a family added without a kit, or an archetype naming a
// family that was renamed or deleted, fails here.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data');

const D = loadGameData();
const ui = fs.readFileSync(path.join(__dirname, 'ui.js'), 'utf8');
const a = ui.indexOf('/* SLB IDENTITY BEGIN'), b = ui.indexOf('/* SLB IDENTITY END */');
assert.ok(a > 0 && b > a, 'the SLB IDENTITY block markers exist in ui.js');
vm.runInContext(ui.slice(a, b), D, { filename: 'ui.js#slb-identity' });
const G = (name) => vm.runInContext(name, D);
const J = (v) => JSON.parse(JSON.stringify(v));

const KITS = G('SLB_IDENTITY_KITS'), ARCH = G('SLB_IDENTITY_ARCHETYPES');
const build = G('slbIdentityBuild'), kitOf = G('slbIdentityKit'), text = G('slbIdentityText');
const membersOf = (() => {
    const by = {};
    for (const id of Object.keys(D.SPELL_BY_ID)) {
        const d = D.SPELL_BY_ID[id];
        if (!d || d.kind === 'basicAttack') continue;
        (D.spellFamiliesOf(d) || []).forEach(f => { (by[f] = by[f] || []).push({ id, name: d.name, tier: D.spellTierOf(id), role: D.spellRoleOf(d) }); });
    }
    return f => by[f] || [];
})();
const ctx = { families: D.SPELL_FAMILIES, raceFamilies: D.RACE_FAMILIES, membersOf };

test('every family has a written kit with all four parts', () => {
    for (const f of Object.keys(D.SPELL_FAMILIES)) {
        assert.ok(KITS[f], `family ${f} has a kit in SLB_IDENTITY_KITS`);
        const k = J(kitOf(f, D.SPELL_FAMILIES[f], []));
        for (const part of ['who', 'adj', 'look', 'vibe']) assert.ok(k[part].length > 0 && k[part].every(s => s.length > 1), `${f}.${part} is filled`);
    }
    for (const f of Object.keys(KITS)) assert.ok(D.SPELL_FAMILIES[f], `kit ${f} names a live family`);
});

test('every archetype names 3 or 4 live families and has a unique name', () => {
    const seen = new Set();
    assert.ok(ARCH.length >= 200, 'the written archetype list is there');
    for (const [name, list, line] of ARCH) {
        const fams = list.split(/\s+/);
        assert.ok(fams.length >= 3 && fams.length <= 4, `${name} has 3-4 families`);
        fams.forEach(f => assert.ok(D.SPELL_FAMILIES[f], `${name}: family ${f} exists`));
        assert.strictEqual(new Set(fams).size, fams.length, `${name}: no repeated family`);
        assert.ok(line && line.length > 10, `${name} has a line`);
        assert.ok(!seen.has(name), `${name} is listed once`);
        seen.add(name);
    }
});

test("the user's seven examples come back as written matches for their families", () => {
    const cases = {
        Krampus: ['christmasspirit', 'horns', 'blood'],
        Televangelist: ['biblestudy', 'cult', 'stagepresence'],
        'Plague Doctor': ['unethicalscience', 'poison', 'chemistry'],
        Ninja: ['martialarts', 'spygear', 'shadow'],
        'Ghost Pirate': ['piracy', 'haunted', 'deepsea'],
        Chupacabra: ['cryptid', 'beastabilities', 'blood'],
        Hitman: ['politics', 'deepstate', 'streetsmarts'],
    };
    for (const [name, fams] of Object.entries(cases)) {
        const idn = J(build(fams, 0, ctx));
        assert.ok(idn.archetypes.exact.some(x => x.name === name), `${name} is written for ${fams.join(' + ')}`);
    }
});

test('the composed identity is seeded, reads as a sentence and carries the pool', () => {
    const fams = ['football', 'necromancy', 'fae'];
    const one = J(build(fams, 0, ctx)), again = J(build(fams, 0, ctx));
    assert.deepStrictEqual(one, again, 'same picks + same roll = same identity');
    const names = new Set([0, 1, 2, 3, 4, 5].map(s => build(fams, s, ctx).name));
    assert.ok(names.size >= 3, 'REROLL walks different names');
    assert.match(one.concept, /^An? .+ who .+\.$/);
    assert.match(one.look, /^[A-Z].+\.$/);
    assert.strictEqual(one.signature.length, 3, 'one signature spell per family');
    assert.match(one.plays, /^Plays as /);
    assert.strictEqual(one.archetypes.exact.length, 0, 'nobody wrote a football necromancer fairy');
    assert.ok(text(build(fams, 0, ctx), f => D.SPELL_FAMILIES[f].name).startsWith(one.name + '\n'));
});

test('races on the combo and the pairs row come from the data', () => {
    const idn = J(build(['politics', 'deepstate', 'streetsmarts'], 0, ctx));
    assert.ok(idn.races.some(r => r.id === 'politician' && r.shared === 2), 'the politician carries politics + deep state');
    assert.ok(idn.pairs.length > 0 && idn.pairs.every(f => !['politics', 'deepstate', 'streetsmarts'].includes(f)));
    assert.strictEqual(build([], 0, ctx), null);
});

test("a family row's own identity overrides its kit; a family with no kit falls back to its name", () => {
    const row = Object.assign({}, D.SPELL_FAMILIES.fire, { identity: { who: ['Chef'] } });
    const k = J(kitOf('fire', row, []));
    assert.deepStrictEqual(k.who, ['Chef']);
    assert.ok(k.adj.includes('Burning'), 'the other parts keep the written kit');
    const fb = J(kitOf('glassblowing', { name: 'Glassblowing Skills', desc: 'Molten glass and shards.' }, [{ name: 'Shard Storm', tier: 3 }]));
    assert.strictEqual(fb.written, false);
    assert.ok(fb.who[0].startsWith('Glassblowing'), 'the suffix is trimmed off the name');
    assert.ok(/molten glass and shards/.test(fb.vibe[0]));
});

test('the IDENTITY tab is wired into the library', () => {
    assert.ok(ui.includes("['identity', 'IDENTITY']"), 'the tab is listed');
    assert.ok(ui.includes("else if (_slbTab === 'identity') _slb2RenderIdentity(main);"), 'the tab renders');
    assert.ok(ui.includes('${_slb2FamilyKitHtml(id, f)}'), 'the FAMILIES inspector carries the IDENTITY KIT');
    assert.ok(ui.includes("case 'famIdentity':"), 'kit edits are written');
});
