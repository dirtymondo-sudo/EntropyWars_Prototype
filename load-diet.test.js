/* THE LOADING PASS (2026-09-20) — the title screen used to pull 330 MB of GLBs nobody asked for
   (the weapon library's boot warm, the renderer's projectile + bone warms, the finisher rocks, and the
   pre-match builder's hidden stage streaming a rig + both animation libraries). These guards keep every
   model warm OUT of boot: a weapon is warmed by the battle's loading screen or on its first cast, the
   menu warms the walker's rig only, and a hidden character stage never mounts. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const vfx = read('three-vfx-effects.js');
const renderer = read('three-renderer.js');
const battle = read('battle.js');
const map = read('map.js');

test('no boot-time weapon warm: the library streams under a match, never behind the title', () => {
    assert.ok(!/setTimeout\(function \(\) \{\s*if \(_wpnGlbOff\(\)\) return;\s*var first = \[/.test(vfx), 'the 3.5 s weapon boot burst is gone');
    assert.ok(!/4500 \+ idx \* 700/.test(vfx), 'the 700 ms weapon drip at boot is gone');
    assert.ok(!/setTimeout\(function \(\) \{ _wpnLoad\('asteroid'/.test(vfx), 'the asteroid boot warm is gone');
    assert.ok(/function _wpnWarm\(keys, opts\)/.test(vfx) && /function _wpnDrip\(ms, alive\)/.test(vfx), 'the match warm + the drip exist');
    assert.ok(/warmWeapons: _wpnWarm,\s*warmWeaponsDrip: _wpnDrip,\s*stopWeaponDrip: _wpnDripStop,/.test(vfx), 'exported on ThreeVFXEffects');
    assert.ok(/if \(!ok\) \{ _wpnDripQueue = \[\]; return; \}/.test(vfx), 'the drip stops when the match ends');
    assert.ok(/_wpnLoad\(key, \{ bg: true \}\)/.test(vfx), 'the drip rides the background lane');
});

test('no boot-time projectile / bone warm in the renderer', () => {
    assert.ok(!/setTimeout\(function \(\) \{\s*if \(window\.EW_DISABLE_WEAPON_GLB\) return;\s*for \(var k in _PROJ_MODELS\)/.test(renderer), 'the projectile boot warm is gone');
    assert.ok(!/setTimeout\(function \(\) \{\s*if \(window\.EW_DISABLE_WEAPON_GLB\) return;\s*for \(var bk in _BONE_GLB_URLS\)/.test(renderer), 'the bone boot warm is gone');
    assert.ok(/function _warmProjectileModels\(keys\)/.test(renderer) && /warmProjectileModels: _warmProjectileModels/.test(renderer), 'the projectile warm is a call, exported');
    assert.ok(/_loadMiscModel\(d\.url, true, function \(\) \{\}, \{ bg: true \}\)/.test(renderer), 'it rides the background lane');
});

test('the loading screen warms only what the basic attacks deliver, then drips the rest', () => {
    const ls = battle.slice(battle.indexOf('THE MATCH WARM (2026-09-20, the loading pass)'), battle.indexOf('// DOOR 6.3: pre-warm'));
    assert.ok(/basicAttackDelivery\(u\)/.test(ls) && /wk\.add\('bullet'\)/.test(ls) && /wk\.add\('arrow'\)/.test(ls) && /pk\.add\(dv\.proj\)/.test(ls), 'keys derived from the units');
    assert.ok(/ThreeVFXEffects\.warmWeapons\(Array\.from\(wk\)\)/.test(ls) && /ThreeRenderer\.warmProjectileModels\(Array\.from\(pk\)\)/.test(ls));
    assert.ok(/warmWeaponsDrip\(4000, \(\) => typeof gameState !== 'undefined' && typeof GS !== 'undefined' && gameState === GS\.BATTLE\)/.test(battle), 'finish() starts the drip, alive = in battle');
});

test('the menu warms the rig only; Play warms the room', () => {
    assert.ok(/window\._hqWarmArrival\(\{ avatarOnly: true \}\)/.test(map), '_hqWarmArrivalSoon asks for the avatar only');
    const warm = map.slice(map.indexOf('window._hqWarmArrival = function (opts)'), map.indexOf('THE HQ HUD PASS (2026-09-16): a strip pill'));
    assert.ok(/if \(opts\.avatarOnly\) return true;/.test(warm), 'the room + the survey wait for Play');
    assert.ok(warm.indexOf('warmAvatar(') < warm.indexOf('if (opts.avatarOnly) return true;'), 'the avatar goes first');
    assert.ok(warm.indexOf('warmRoom(') > warm.indexOf('if (opts.avatarOnly) return true;'), 'the room after the gate');
});

test('a hidden character stage never mounts (the builder renders at boot behind the title)', () => {
    assert.ok(/if \(_cvHostHidden\(host\)\) \{ _cvDeferMount\(host, race, gender, opts\); return true; \}/.test(renderer));
    assert.ok(/function _cvHostHidden\(host\)/.test(renderer) && /rects\.length === 0\) return true;/.test(renderer) && /host\.closest\('\[id\$="Page"\], \.app'\)/.test(renderer), 'no box, or covered by another page');
    assert.ok(/unmount: function \(\) \{\s*_cvDeferMount\(null\);/.test(renderer), 'unmount drops a parked mount');
});

test('the deferred mount waits for a visible host, in a vm sandbox', () => {
    const vm = require('vm');
    const fn = n => { const i = renderer.indexOf('function ' + n + '('); const j = renderer.indexOf('\n    }\n', i); return renderer.slice(i, j + 7); };
    const c = vm.createContext({ window: {}, setTimeout: (f, ms) => { c._timers.push(f); return c._timers.length; }, clearTimeout: () => {}, _timers: [] });
    vm.runInContext('var _cvDeferred = null, _cvDeferTimer = null;' + fn('_cvHostHidden') + fn('_cvDeferMount'), c);
    let mounted = 0; c.window.EWCharViewer = { mount: () => { mounted++; } };
    let boxes = 0;
    const host = { getClientRects: () => ({ length: boxes }), isConnected: true };
    assert.equal(vm.runInContext('_cvHostHidden', c)(host), true);
    vm.runInContext('_cvDeferMount', c)(host, 'knight', 'female', {});
    c._timers.shift()(); assert.equal(mounted, 0, 'still hidden — no mount');
    boxes = 1; c._timers.shift()(); assert.equal(mounted, 1, 'shown — mounted once');
    assert.equal(c._timers.length, 0, 'no further poll');
});
