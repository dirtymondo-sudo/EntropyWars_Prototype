'use strict';
/* THE CRAFT + THE ONE MODEL (SPELL_DIRECTOR_PLAN.md §5 Phases 2-3, 2026-09-24).
   The shared VFX kit (lights, tracers, explosions, scars, lit beams), its
   hooks at the choke points, the opt-in trip, and the spells drawing the
   world's Meshy models. Source pins + small vm checks — no browser. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const R = __dirname;
const FX = fs.readFileSync(path.join(R, 'three-vfx-effects.js'), 'utf8');
const VFX = fs.readFileSync(path.join(R, 'three-vfx.js'), 'utf8');
const TR = fs.readFileSync(path.join(R, 'three-renderer.js'), 'utf8');
const BT = fs.readFileSync(path.join(R, 'battle.js'), 'utf8');
const ON = fs.readFileSync(path.join(R, 'online.js'), 'utf8');
const PLAN = fs.readFileSync(path.join(R, 'SPELL_DIRECTOR_PLAN.md'), 'utf8');

function between(src, a, b) {
    const i = src.indexOf(a), j = src.indexOf(b, i + a.length);
    assert.ok(i >= 0 && j > i, a);
    return src.slice(i, j);
}
const KIT = between(FX, 'THE CRAFT KIT (SPELL_DIRECTOR_PLAN', 'END THE CRAFT KIT');

test('the VFX lights: a FIXED pool born with the particle pools, exported, reparented, zeroed on clear', () => {
    assert.match(VFX, /var FX_LIGHT_COUNT = \d+;/);
    assert.match(VFX, /function _buildFxLights\(\)/);
    assert.match(between(VFX, '    function init(scene) {', '    function _claim()'), /_buildFxLights\(\);/, 'built at init, never later (a new light recompiles the lit shaders)');
    assert.match(between(VFX, '    function _pooledObjects()', '    function _reparentAll('), /_fxLights\[i\]\.light/, 'the lights follow the pools onto the stage');
    assert.match(between(VFX, '    function clear()', '    function dispose()'), /_fxLightIdle/);
    assert.match(VFX, /flashLight: flashLight/);
    assert.match(VFX, /EW_DISABLE_FX_LIGHTS/);
    assert.match(between(VFX, '    function tick(dt) {', '        if (_aliveCount === 0) return;'), /_fxLightsTick\(dt\)/, 'lights decay even when no particle is alive');
});

test('the kit: every piece exists, owns its groups, and has a kill-switch', () => {
    for (const fn of ['_crGunShot', '_crExplosion', '_crSlashScar', '_crBeamExtras', '_crBeamPalette', '_crRide', '_crIsBlade', '_crTagBooms'])
        assert.match(KIT, new RegExp('function ' + fn + '\\('), fn);
    assert.match(KIT, /EW_DISABLE_CRAFT/);
    assert.ok(!/(^|[^.\w])_sigRun\(/.test(KIT), 'the kit registers through _sigRunOwned only');
    assert.ok(!/window\.setTimeout/.test(KIT), 'delayed beats go through _fxDelay');
    assert.match(KIT, /_crTagBooms\(\);/, 'the explosion tags are applied at load');
});

test('guns: the bullet bolt is a tracer on BOTH bolt paths (spells and ranged basic attacks)', () => {
    assert.match(FX, /_bolt_bullet:\s*\{[^}]*boltTracer: true/);
    const mapped = between(FX, '    function _fireBoltMapped(', '    function fireBoltDirect(');
    const direct = between(FX, '    function fireBoltDirect(', '    function _tickBolts(');
    for (const src of [mapped, direct]) {
        assert.match(src, /boltDef\.boltTracer && typeof _crGunShot === 'function'/);
        assert.match(src, /if \(tracer\) \{ headGlow = false; trailRate = 34; \}/);
    }
});

test('explosions: _spawnEffect detonates tagged recipes on the explosion layer\'s delay; the tags skip beams and descents', () => {
    const se = between(FX, '    function _spawnEffect(', '    function _emitLayer(');
    assert.match(se, /var boom = effectDef\._crBoom;/);
    assert.match(se, /_fxDelay\(function \(\) \{ if \(!_suppressed\(\)\) _crExplosion\(anchor\.tx, anchor\.ty, boom\); \}, boom\.delay\)/);
    assert.match(KIT, /\/_beam\$\|_descent\$\//);
    /* the tagger, run on the live recipe table */
    const data = JSON.parse(FX.match(/var _EFX_DATA = (\{.*?\});\n/s)[1]);
    const ctx = { EFFECTS: {}, Object };
    for (const [id, e] of Object.entries(data.E)) ctx.EFFECTS[id] = { layers: (e.L || []).map(l => ({ sprite: l.s, delayMs: l.d || 0 })) };
    vm.runInNewContext(between(KIT, '    var _CR_BOOM_SCALE', '    _crTagBooms();') + '_crTagBooms();', ctx);
    const tagged = Object.keys(ctx.EFFECTS).filter(k => ctx.EFFECTS[k]._crBoom);
    assert.ok(tagged.includes('placeBomb_impact_center') && tagged.includes('raceMortarSalvo_impact_tile'), 'the bombs are tagged');
    assert.ok(!tagged.includes('raceHeatRay_beam') && !tagged.includes('nuke_descent'), 'beams and descents are not');
    assert.equal(ctx.EFFECTS.raceMortarSalvo_impact_tile._crBoom.lite, true, 'an AoE tile goes lite');
    assert.equal(ctx.EFFECTS.placeBomb_impact_center._crBoom.lite, false, 'an AoE centre goes full');
});

test('slashes: blade crescents leave a scar; the stage slash scars blade-named spells only', () => {
    const cs = between(FX, '    function _sigCrescentSlash3D(', '    /* ════════════════════════════════════════════════════════════════════\n       CHARGE');
    assert.match(cs, /if \(entry && opts\.scar && typeof _crSlashScar === 'function'\)/);
    assert.ok((FX.match(/scar: true/g) || []).length >= 6, 'the sword callers flag their scar');
    assert.ok((FX.match(/scar: typeof _crIsBlade === 'function' && _crIsBlade\(spellId\)/g) || []).length >= 2, 'both stage slashes ask _crIsBlade');
    const re = new Function('return ' + KIT.match(/var _CR_BLADE_RE = (\/.*\/i);/)[1])();
    for (const yes of ['dragonSlash Dragon Slash', 'raceZantetsuken Zantetsuken', 'raceExcalibur Excalibur', 'bladeWaltz Blade Waltz']) assert.ok(re.test(yes), yes);
    for (const no of ['raceKiWave Ki Wave', 'raceGorillaPunch Gorilla Punch', 'raceCharge Charge']) assert.ok(!re.test(no), no);
});

test('beams: every laser gets the extras; a mapped beam wears its spell\'s colour', () => {
    assert.match(between(FX, '    function _spawnLaserBeam3D(', '    /* ─── RADIANT BURST'), /typeof _crBeamExtras === 'function'/);
    assert.match(between(FX, '    function _fireBeamMapped(', '    function _fireBoltMapped('), /typeof _crBeamPalette === 'function'\) \? _crBeamPalette\(spellId, beamDef\)/);
});

test('the trip only where it fits: alien / unholy wear colour only; anomaly / mind trip on heavy+ or by opt-in', () => {
    const grades = between(FX, '    var _STAGE_GRADES = {', '    };');
    for (const k of ['alien', 'unholy']) assert.ok(!new RegExp(k + ':[^\\n]*trip').test(grades), k + ' has no default trip');
    for (const k of ['anomaly', 'mind']) assert.match(grades, new RegExp(k + ':[^\\n]*trip'), k + ' keeps its trip for heavy casts');
    const ok = between(FX, '    function _gradeTripOK(', '    function _gradeProfile(');
    const ctx = { SPELL_STAGE_MAP: { optIn: { grade: { trip: 0.5 } } } };
    vm.runInNewContext(ok, ctx);
    assert.equal(ctx._gradeTripOK('x', 1), false);
    assert.equal(ctx._gradeTripOK('x', 2), true);
    assert.equal(ctx._gradeTripOK('optIn', 0), true);
    assert.match(between(FX, '    function _stageGrade(', '    /* ── How LOUD'), /!_gradeTripOK\(spellId, rank\)/);
});

test('THE ONE MODEL: Air Support flies the F-22 + drops the missile; every summoned sword is the master sword', () => {
    const air = between(FX, '    function _sigAirSupport3D(', '            /* the bomb: released');
    assert.match(air, /_finJetMeshy\(ts, 0x4a5560\), wing = _finJetMeshy\(ts, 0x56606a\)/);
    assert.match(air, /_wpnInstance\('missile'/);
    assert.match(FX, /function _finJetMeshy\(ts, color\) \{\n\s+var inst = _wpnReady\('jet'\)/);
    const build = between(FX, '    function _sigBuildSword(opts) {', '        /* blade profile');
    assert.match(build, /_sigSwordMeshy\(opts\)/);
    assert.match(between(FX, '    function _sigSwordMeshy(', '    function _sigBuildSword('), /_wpnInstance\('sword', L\)/);
    assert.match(FX, /sw\.ghost \? sw\.ghost\(ghostMatA\)/, 'the combo\'s afterimages are the same model');
});

test('THE ONE MODEL: the Drive-By rolls the HQ\'s Cadillac, relayed to the guest', () => {
    assert.match(FX, /SPELL_MAP\['raceDriveBy'\]\s*=\s*\{[^}]*ride: 'cadillac'/);
    assert.match(between(FX, '    function fire(intent, spellId, params) {', '        if (!hasMapping(spellId, intent)) return;'), /intent === 'ride'/);
    assert.match(TR, /vehicle: function \(kind, o\) \{ return _hzVehicle\(kind, o\); \}/, 'spells reach the HQ traffic\'s builder');
    assert.match(BT, /_rideVFX\.fire\('ride', spell\.id, \{ fromX: casterStartX, fromY: casterStartY, toX: x, toY: y,/);
    const wl = between(ON, "VFX3D.fire = function(phase, spellId, params) {", "_emit('relay', {");
    for (const k of ['fromX', 'fromY', 'toX', 'toY', 'durMs', 'holdMs']) assert.ok(wl.includes("'" + k + "'"), 'relay whitelist carries ' + k);
    assert.match(FX, /var _WPN_DRIP_MISC = \[[^\]]*'cadillac'/, 'the match drip warms the car');
});

test('THE ONE MODEL: the astral eyes wear the sky\'s eyeball OBJ, aimed by the measured cornea', () => {
    const eye = between(TR, '    function _hqAstralEye(', '    Object.assign(_hqProcBuilders, {');
    assert.match(eye, /eyeball\/eyeball\.obj/);
    assert.match(eye, /matPick: _hzEyeballPick\(\)/);
    assert.match(eye, /_ewCornea/);
    assert.match(eye, /pivot\.quaternion\.setFromUnitVectors\(gaze\.normalize\(\), new THREE\.Vector3\(0, 0, 1\)\)/);
    assert.match(between(TR, '    function _hzModelEyeball(', '    // ── Cosmic misc models'), /matPick: _hzEyeballPick\(\)/, 'the sky uses the same rule');
});

test('the plan records the revision: the fever is opt-in, THE CRAFT and THE ONE MODEL are phases, §12 is the crossover table', () => {
    assert.match(PLAN, /THE REVISION \(2026-09-24\)/);
    assert.match(PLAN, /### Phase 2 — THE CRAFT/);
    assert.match(PLAN, /### Phase 3 — THE ONE MODEL/);
    assert.match(PLAN, /### THE FEVER, cut down/);
    assert.match(PLAN, /## 12\. THE CROSSOVER TABLE/);
});
