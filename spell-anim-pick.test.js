// spell-anim-pick.test.js — THE SPELL LIBRARY Phase 2, THE LOOK (SPELL_LIBRARY_PLAN.md §4.6, §6.5, §9 row 2).
//
// Pins: a row's `animVerb` classifies to that kind and a bad verb falls back to the rules; `animSlot` and
// `animClip` ride the kind string as 'slot:<slot>/<auto>' and _castChainFor decodes them to a slot-first chain
// (the census in check-spell-presentation.js reads the same field); every SPELL_ANIM_KINDS entry has a chain whose
// first slot is a real UAL_SLOTS row; registerSpellAnimClips writes the synthetic 'clip:<name>' slot into the
// shared table and every per-race copy, idempotently; spellAnimLibName names the five libraries. The classifier
// and the chain are sliced exactly as the census slices them, so a pick that works here works there.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data');

const J = (v) => JSON.parse(JSON.stringify(v));   // vm values cross a realm — compare by value
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const SP = read('sprites.js'), RT = read('three-renderer.js');
const D = loadGameData();
const capSet = new Set(Object.keys(D.SPELL_BY_ID).filter(id => D.SPELL_BY_ID[id] && D.SPELL_BY_ID[id].capstone));
const routerSrc = SP.slice(SP.indexOf('// ── THE ANIM ROUTER'), SP.indexOf('// ── SHARED ANIMATION LIBRARIES'));
assert.ok(routerSrc.length > 1000, 'the ANIM ROUTER slice exists');
const R = vm.runInNewContext('(function(){ function _isCapstoneSpellForAnim(s){ return CAP.has(s.id); } ' + routerSrc + ' return { classify: classifySpellAnimKind, KINDS: SPELL_ANIM_KINDS, clipSlot: spellAnimClipSlot }; })()', { CAP: capSet });
const chainSrc = RT.slice(RT.indexOf('function _castChainFor(kind)'), RT.indexOf('/* THE STRIKE FRAME (2026-09-09)'));
assert.ok(chainSrc.length > 500, 'the _castChainFor slice exists');
const chain = vm.runInNewContext('(' + chainSrc.replace(/^function _castChainFor/, 'function') + ')');
const slotsSrc = SP.slice(SP.indexOf('const UAL_SLOTS = {'), SP.indexOf('const _FEM_SLOT_DEFAULTS'));
const slotNames = new Set([...slotsSrc.matchAll(/^\s{2}([A-Za-z0-9]+):\s*\{\s*clip:\s*'([^']+)'/gm)].map(m => m[1]));
assert.ok(slotNames.size >= 70, 'UAL_SLOTS has its 75 rows: ' + slotNames.size);

const fire = { id: 'fx', name: 'Fire Bolt', kind: 'damage', type: 'damage', damageType: 'magic', dmg: 40, range: 3 };

test('animVerb: a known kind wins over the verb table and the rules; an unknown one falls back to the rules', () => {
    assert.strictEqual(R.classify(fire), 'magic');
    assert.strictEqual(R.classify(Object.assign({}, fire, { animVerb: 'drain' })), 'drain');
    assert.strictEqual(R.classify(Object.assign({}, fire, { animVerb: 'nope' })), 'magic', 'a bad verb is ignored');
    assert.strictEqual(R.classify({ id: 'raceDinoTailWhip', name: 'Tail Whip', animVerb: 'slam' }), 'slam', 'the pick beats the verb table');
    assert.strictEqual(R.classify({ id: 'raceDinoTailWhip', name: 'Tail Whip', animVerb: 'slam' }, { noPick: true }), 'sweep', 'noPick = the verb table + the rules');
    assert.strictEqual(R.classify(Object.assign({}, fire, { animVerb: 'drain' }), { rulesOnly: true }), 'magic', 'rulesOnly skips the pick too');
    assert.ok(Array.isArray(R.KINDS) && R.KINDS.length >= 58 && R.KINDS.includes('drain') && R.KINDS.includes('flyKick'));
});

test('animSlot / animClip ride the kind string and decode to a slot-first chain; precedence verb > slot > clip', () => {
    const k1 = R.classify(Object.assign({}, fire, { animSlot: 'castThrust' }));
    assert.strictEqual(k1, 'slot:castThrust/magic');
    assert.deepStrictEqual(J(chain(k1)), ['castThrust', 'castMagic', 'cast']);
    const k2 = R.classify(Object.assign({}, fire, { animClip: { name: 'Kung_Fu_Punch', lib: 4 } }));
    assert.strictEqual(k2, 'slot:clip:Kung_Fu_Punch/magic');
    assert.deepStrictEqual(J(chain(k2)), ['clip:Kung_Fu_Punch', 'castMagic', 'cast']);
    assert.strictEqual(R.clipSlot({ animClip: { name: 'Kung_Fu_Punch', lib: 4 } }), 'clip:Kung_Fu_Punch');
    assert.strictEqual(R.clipSlot(fire), null);
    assert.strictEqual(R.classify(Object.assign({}, fire, { animVerb: 'drain', animSlot: 'castThrust', animClip: { name: 'X', lib: 0 } })), 'drain', 'the verb wins');
    assert.strictEqual(R.classify(Object.assign({}, fire, { animSlot: 'castThrust', animClip: { name: 'X', lib: 0 } })), 'slot:castThrust/magic', 'then the slot');
    assert.deepStrictEqual(J(chain('slot:/melee')), ['castMelee', 'cast'], 'an empty slot is just the auto chain');
    assert.deepStrictEqual(J(chain('bogus')), ['cast'], 'an unknown kind falls to the plain cast');
});

test('every SPELL_ANIM_KINDS entry has a chain whose first slot is a real UAL_SLOTS row (the dropdown shows it)', () => {
    const bad = [];
    for (const k of R.KINDS) {
        const c = chain(k);
        if (!Array.isArray(c) || !c.length || !slotNames.has(c[0])) bad.push(k + ' → ' + JSON.stringify(c));
        if (c[c.length - 1] !== 'cast') bad.push(k + ' does not end on cast');
    }
    assert.deepStrictEqual(bad, []);
    // and nothing in the kinds list is missing from the chain table (a kind the table does not know falls to ['cast'])
    const orphans = R.KINDS.filter(k => chain(k).length === 1 && k !== 'cast');
    assert.deepStrictEqual(J(orphans), []);
});

test('registerSpellAnimClips: the synthetic clip slot lands in the shared table and every per-race copy, once', () => {
    // a self-contained replica of the registration: the shared table, one per-race copy, the exported function
    const regSrc = SP.slice(SP.indexOf('function spellAnimLibName('), SP.indexOf('function registerSpellAnimClips('));
    const fnSrc = SP.slice(SP.indexOf('function registerSpellAnimClips('));
    const fnEnd = fnSrc.indexOf('\n}\n') + 3;
    const ctx = vm.createContext({
        EW_ANIM_LIB_URLS: ['a/UAL1_Standard.glb', 'a/UAL2_Standard.glb', 'a/MAL1_Sniper.glb', 'a/MAL2_Sniper.glb', 'a/MAL3_Sniper.glb'],
        _UAL_CLIPS: { cast: { clip: 'Spell_Simple_Shoot', lib: 0 } }, _UAL_TS: { cast: 0.5 },
        spellAnimClipSlot: R.clipSlot,
    });
    ctx.RACE_MODELS_3D = { knight: { male: { libClips: Object.assign({}, ctx._UAL_CLIPS, { idle: { clip: 'Sword_Idle', lib: 1 } }), libTimeScales: { cast: 0.5 } } }, grey: { male: { libClips: ctx._UAL_CLIPS, libTimeScales: ctx._UAL_TS } } };
    vm.runInContext(regSrc + fnSrc.slice(0, fnEnd), ctx);
    const reg = vm.runInContext('registerSpellAnimClips', ctx), libName = vm.runInContext('spellAnimLibName', ctx);
    const defs = [{ id: 'a', animClip: { name: 'Kung_Fu_Punch', lib: 4 } }, { id: 'b', animClip: { name: 'Archery_Shot_3', lib: 9 } }, { id: 'c', animVerb: 'drain' }, { id: 'd', animClip: { name: 'Kung_Fu_Punch', lib: 4 } }];
    assert.strictEqual(reg(defs), 2, 'two new slots');
    assert.deepStrictEqual(J(ctx._UAL_CLIPS['clip:Kung_Fu_Punch']), { clip: 'Kung_Fu_Punch', lib: 4, defer: true });
    assert.strictEqual(ctx._UAL_CLIPS['clip:Archery_Shot_3'].lib, 0, 'a bad lib index falls to library 0');
    assert.strictEqual(ctx._UAL_TS['clip:Kung_Fu_Punch'], 1);
    assert.ok(ctx.RACE_MODELS_3D.knight.male.libClips['clip:Kung_Fu_Punch'], 'the per-race copy has it');
    assert.strictEqual(ctx.RACE_MODELS_3D.knight.male.libTimeScales['clip:Kung_Fu_Punch'], 1);
    assert.strictEqual(reg(defs), 0, 'idempotent');
    assert.deepStrictEqual(J([0, 1, 2, 3, 4, 7].map(libName)), ['UAL1', 'UAL2', 'MAL1', 'MAL2', 'MAL3', 'lib 7']);
});

test('the boot stamp registers the shipped rows\' clips and the census reads the pick', () => {
    // data.js calls registerSpellAnimClips(defs) at the end of stampSpellSchema (sprites.js loads first)
    const dataSrc = read('data.js');
    const stamp = dataSrc.slice(dataSrc.indexOf('function stampSpellSchema()'), dataSrc.indexOf('function stampSpellSchema()') + 3000);
    assert.match(stamp, /registerSpellAnimClips\(/);
    // the census: a picked row reports the slot the chain leads with
    const census = require('./check-spell-presentation.js');
    assert.strictEqual(typeof census.census, 'function');
    const src = read('check-spell-presentation.js');
    assert.match(src, /\['cast'\]\)\[0\]/, 'the census takes the chain\'s first slot (a slot: kind leads with its slot)');
    // battle.js honours animStrikeMs at both strike readers
    const battle = read('battle.js');
    assert.ok((battle.match(/animStrikeMs/g) || []).length >= 2, 'battle.js reads animStrikeMs (the hold and the travelling clip)');
    assert.match(RT, /_cvStrikeMs[\s\S]{0,400}animStrikeMs/, 'the viewer honours animStrikeMs');
    assert.match(RT, /playClip:/, 'EWCharViewer.playClip exists');
    assert.match(RT, /devLibClips/, 'ThreeRenderer.devLibClips exists');
    assert.match(RT, /castChainFor:/, 'ThreeRenderer.castChainFor exists');
});
