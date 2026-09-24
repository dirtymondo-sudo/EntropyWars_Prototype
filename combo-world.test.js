/* combo-world.test.js — THE DUAL TECHS' world event (SPELL_DIRECTOR_PLAN
   Phase 5, 2026-09-24). battle.js _COMBO_WORLD gives every COMBO_REGISTRY
   combo a world-event layer, fired from _comboPlayPresentation on the launch
   (so the guest's 'combo-cine' replay draws it too) and landing its last
   layer on the hit. This pins: a row per combo, every ThreeVFXEffects call a
   row makes is exported, the hook sits in the presentation (ccOK only), and
   the rows never reach for a camera, a grade or a finisher signature.
   Zero dependencies. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const BT = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const FX = fs.readFileSync(path.join(__dirname, 'three-vfx-effects.js'), 'utf8');
const block = (() => {
    const a = BT.indexOf('const _COMBO_WORLD = {');
    const b = BT.indexOf('function _comboWorldFx(', a);
    assert.ok(a > 0 && b > a, '_COMBO_WORLD not found');
    return BT.slice(a, b);
})();

test('every combo in the registry has a world event', () => {
    const D = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
    const a = D.indexOf('const COMBO_REGISTRY = {');
    const reg = D.slice(a, D.indexOf('\n};', a));
    const names = [...reg.matchAll(/name:\s*(['"])(.+?)\1/g)].map(m => m[2]);
    assert.strictEqual(names.length, 21);
    for (const n of names) {
        const key = n.includes("'") ? '"' + n + '"' : "'" + n + "'";
        assert.ok(block.includes(key + ': ('), n + ' has no _COMBO_WORLD row');
    }
});

test('every effect a row calls is exported; no camera, grade or finisher body', () => {
    const exported = new Set();
    const ex = FX.slice(FX.lastIndexOf('fireCombo: fireCombo,'));
    let m; const re = /^\s{8}([A-Za-z0-9_]+):/gm;
    while ((m = re.exec(ex))) exported.add(m[1]);
    const used = new Set();
    const re2 = /V\.([A-Za-z0-9_]+)/g;
    while ((m = re2.exec(block))) used.add(m[1]);
    for (const u of used) assert.ok(exported.has(u), 'V.' + u + ' is not exported by ThreeVFXEffects');
    assert.ok(!/camera\.|cineGrade|VoidStage|slowMo|ThreePost/.test(block), 'the world event never moves the camera or grades the frame');
    for (const fin of ['sigRapture3D', 'sigOrdnance3D', 'sigEruption3D', 'sigSegfault3D', 'sigEventHorizon3D', 'sigAirSupport3D', 'sigJoust3D']) {
        assert.ok(!block.includes(fin), fin + ' is an execution\'s own signature');
    }
    assert.ok(/craftExplosion: function \(tx, ty, o\) \{ try \{ return _crExplosion\(tx, ty, o \|\| \{\}\); \}/.test(FX));
    assert.ok(/craftShards: function \(tx, ty, kind, o\) \{ try \{ return _crShards\(tx, ty, kind, o \|\| \{\}\); \}/.test(FX));
});

test('the presentation fires it on the launch, cut-in combos only, fog-gated', () => {
    assert.ok(/if \(T\.ccOK && _see\(target\)\) window\.setTimeout\(\(\) => \{\s*_comboWorldFx\(combo, initiator, partner, target, \(T\.hitAt \|\| 0\) - \(T\.launchAt \|\| 0\)\);\s*\}, Math\.max\(0, T\.launchAt \|\| 0\)\);/.test(BT));
    assert.ok(/window\.EW_DISABLE_COMBO_WORLD/.test(BT), 'the kill-switch');
});
