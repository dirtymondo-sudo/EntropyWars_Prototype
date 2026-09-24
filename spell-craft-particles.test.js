'use strict';
/* THE CRAFT — VELOCITY SPARKS + PARTICLES THAT SCALE (SPELL_DIRECTOR_PLAN.md
   §5 Phase 2, 2026-09-24). Two pool-level pieces in three-vfx.js: a spark
   points along its screen-projected velocity and stretches with speed; the
   small repeated bits thin with the perf tier / Impact FX slider, and a full
   pool recycles its OLDEST particle instead of dropping the new spawn.
   Source pins + small vm checks — no browser. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const R = __dirname;
const VFX = fs.readFileSync(path.join(R, 'three-vfx.js'), 'utf8');

function between(src, a, b) {
    const i = src.indexOf(a), j = src.indexOf(b, i + a.length);
    assert.ok(i >= 0 && j > i, a);
    return src.slice(i, j);
}
const CRAFT = between(VFX, '    var _VEL_SPARKS = {', '    var _spriteMap = {');
const SPAWN = between(VFX, '    function spawn(opts) {', '    function _setupMaterial(p) {');

test('the kit: tunables, the kill-switch and the density reader live in one block', () => {
    for (const k of ['VS_DEADZONE', 'VS_K', 'VS_MAX', 'VS_LEAD', 'PX_PERF_LOW_MUL', 'PX_FX_FLOOR'])
        assert.match(CRAFT, new RegExp('var ' + k + ' = '), k);
    assert.match(CRAFT, /function _craftOff\(\) \{\s*return typeof window !== 'undefined' && !!window\.EW_DISABLE_CRAFT;/);
    const fd = between(CRAFT, '    function _fxDensity()', '\n    }\n');
    assert.match(fd, /W\.EW_PERF_LOW/, 'the phone halves');
    assert.match(fd, /getImpactFx/, 'the pause menu slider');
    assert.match(fd, /EW_FX_DENSITY/, 'the console knob');
    assert.ok(!/'sparkle': 1/.test(CRAFT.match(/var _VEL_SPARKS = \{[^}]*\}/)[0]), 'glitter never streaks');
    assert.ok(!/'ember'/.test(CRAFT.match(/var _VEL_SPARKS = \{[^}]*\}/)[0]), 'embers stay soft');
});

test('_fxDensity: 1 by default, halves on the phone, the slider dims to its floor, EW_FX_DENSITY multiplies', () => {
    const run = (win) => {
        const ctx = { window: win, Math };
        vm.runInNewContext(CRAFT + '; this.d = _fxDensity();', ctx);
        return ctx.d;
    };
    assert.equal(run({}), 1);
    assert.equal(run({ EW_PERF_LOW: true }), 0.5);
    assert.equal(run({ ThreePost: { getImpactFx: () => 1.5 } }), 1, 'the slider above 1 never adds');
    assert.ok(Math.abs(run({ ThreePost: { getImpactFx: () => 0 } }) - 0.35) < 1e-9, 'the slider at 0 keeps the floor');
    assert.ok(Math.abs(run({ EW_PERF_LOW: true, EW_FX_DENSITY: 0.5 }) - 0.25) < 1e-9);
});

test('the density gate: craft-gated, sprite-pool small bits only, an accumulator (not a coin flip), before any slot is claimed', () => {
    const gate = between(SPAWN, 'var craft = !_craftOff();', 'if (isGlob) {');
    assert.match(gate, /craft && !isGlob && !isWorld && !isNonSquare && _THIN_SPRITES\[sprite\]/);
    for (const k of ['opts.keep', 'opts._zone', 'opts.onComplete', 'opts.trail', 'opts.descent', 'opts.seek', 'opts.orbit'])
        assert.ok(gate.includes('!' + k), k + ' is essential');
    assert.match(gate, /_thinAcc \+= dens;\s*if \(_thinAcc < 1\) return null;\s*_thinAcc -= 1;/);
    assert.ok(!/Math\.random/.test(gate), 'evenly spread, deterministic');
    for (const k of ["'flash'", "'scorch'", "'shockwave'", "'explosion-orange'"])
        assert.ok(!CRAFT.match(/var _THIN_SPRITES = \{[^}]*\}/)[0].includes(k), k + ' is a one-off, never thinned');
    /* the accumulator itself: at 0.5 exactly every other spawn passes */
    let acc = 0, kept = 0;
    for (let i = 0; i < 100; i++) { acc += 0.5; if (acc < 1) continue; acc -= 1; kept++; }
    assert.equal(kept, 50);
});

test('a full pool recycles its OLDEST particle; kept / zone / choreographed ones are spared; the kill-switch drops like before', () => {
    for (const t of ['_globPool, \'glob\'', '_worldMeshPool, \'world\'', '_quadMeshPool, \'quad\'', '_spritePool, \'sprite\''])
        assert.ok(SPAWN.includes('_claimSlot(' + t + ')'), t);
    const claim = between(VFX, '    function _claim() {', '    function _release(p) {');
    assert.match(claim, /var pick = _craftOff\(\) \? null : _oldestLive\(null\);/);
    const helpers = between(VFX, '    function _oldestLive(type) {', '    function _hideSprite(entry) {');
    assert.match(helpers, /if \(idx >= 0 \|\| _craftOff\(\)\) return idx;/);
    assert.match(VFX, /p\._velSpark = false; p\._keep = false;/, '_release resets the new fields');
    /* run it: a full sprite pool of 3, the middle one furthest through its life */
    const mk = (o) => Object.assign({ alive: true, poolType: 'sprite', life: 0, ml: 100, _keep: false, _zone: false, onComplete: null, descent: false }, o);
    const ctx = {
        _particles: [mk({ slotIdx: 0, life: 10 }), mk({ slotIdx: 1, life: 90 }), mk({ slotIdx: 2, life: 95, _keep: true })],
        pool: [{ inUse: true }, { inUse: true }, { inUse: true }],
        off: false,
    };
    vm.runInNewContext(helpers + `
        function _claimFromPool(pl) { for (var i = 0; i < pl.length; i++) if (!pl[i].inUse) return i; return -1; }
        function _craftOff() { return off; }
        function _release(p) { pool[p.slotIdx].inUse = false; p.alive = false; }
        this.claim = function () { return _claimSlot(pool, 'sprite'); };`, ctx);
    assert.equal(ctx.claim(), 1, 'the oldest non-kept one gives up its slot');
    assert.equal(ctx._particles[1].alive, false);
    ctx.pool[1].inUse = true; ctx._particles[1].alive = true;
    ctx.off = true;
    assert.equal(ctx.claim(), -1, 'EW_DISABLE_CRAFT: the old drop');
});

test('velocity sparks: flagged at spawn only for uncustomised sprite-pool sparks, posed through the camera, gated live', () => {
    const flag = SPAWN.match(/p\._velSpark = [^;]*;/)[0];
    assert.match(flag, /craft && poolType === 'sprite' && !!_VEL_SPARKS\[sprite\]/);
    assert.match(flag, /!opts\.stretchVel/, 'a caller\'s stretchVel keeps its value');
    assert.match(flag, /opts\.spriteRot == null && opts\.spriteSpin == null/);
    const ws = between(VFX, '    function _writeSprite(p) {', '    function _poseVelSpark(');
    assert.match(ws, /if \(!\(p\._velSpark && !_craftOff\(\) && _poseVelSpark\(p, entry, sz\)\)\) \{/);
    assert.match(ws, /entry\.sprite\.center\.x = 0\.5;/, 'a recycled sprite gets its centre back');
    const pose = between(VFX, '    function _poseVelSpark(', '    function _writeWorldMesh(p) {');
    assert.match(pose, /_vfxCam\(\)/, 'the stage camera too');
    assert.ok(!/new THREE|\{\s*x:/.test(pose), 'no allocation per spark per frame');
    /* run it with an identity camera (right = +x, up = +y world) */
    const ctx = { Math, _vfxCam: () => ({ matrixWorld: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] } }) };
    vm.runInNewContext(CRAFT + pose + '; this.pose = _poseVelSpark;', ctx);
    const entry = () => ({ sprite: { scale: { set(x, y) { this.x = x; this.y = y; } }, center: { x: 0.5 } }, material: { rotation: 0 } });
    const slow = entry();
    assert.equal(ctx.pose({ vx: 10, vy: 0, vz: 0 }, slow, 10), false, 'a slow spark stays a dot');
    const fast = entry();
    assert.equal(ctx.pose({ vx: 2000, vy: 0, vz: 0 }, fast, 10), true);
    assert.ok(Math.abs(fast.material.rotation) < 1e-9, 'along +x on screen');
    const ratio = fast.sprite.scale.x / fast.sprite.scale.y;
    assert.ok(ratio > 6.9 && ratio <= 7.0001, 'clamped at VS_MAX widths, got ' + ratio);
    assert.ok(fast.sprite.center.x > 0.5, 'the tail trails behind');
    const up = entry();
    ctx.pose({ vx: 0, vy: 0, vz: 300 }, up, 10);    // vfx z is world up
    assert.ok(Math.abs(up.material.rotation - Math.PI / 2) < 1e-9, 'a rising spark points up the screen');
    const toward = entry();
    assert.equal(ctx.pose({ vx: 0, vy: 900, vz: 0 }, toward, 10), false, 'flying straight at the camera: no screen speed, a dot');
});
