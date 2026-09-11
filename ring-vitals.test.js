'use strict';
/* RING VITALS + NAMEPLATE STYLE (2026-09-11) — source scans.
   The HP / MP meters live ON the team reticle shader (three-renderer.js)
   and the nameplate grows two styles; both are Video settings shared by
   the pause menu (ui.js) and the main-menu Settings (map.js). This test
   pins the plumbing so a refactor can't silently orphan a half. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const renderer = read('three-renderer.js');
const ui = read('ui.js');
const map = read('map.js');

test('reticle shader carries the ring-vitals uniforms and the meters branch', () => {
    const a = renderer.indexOf('var _reticleFragmentShader = [');
    const b = renderer.indexOf("].join('\\n');", a);
    assert.ok(a > 0 && b > a, 'reticle fragment shader found');
    const glsl = renderer.slice(a, b);
    for (const u of ['uMeters', 'uHp', 'uMp', 'uShield', 'uPrev', 'uPrevHeal', 'uMeterRot', 'uHpCol', 'uMpCol']) {
        assert.ok(glsl.includes('uniform ' + (u.endsWith('Col') ? 'vec3 ' : 'float ') + u + ';'), 'uniform ' + u);
    }
    assert.ok(glsl.includes('if (uMeters > 0.5) {'), 'meters branch');
    assert.ok(glsl.includes('fract((uMeterRot - ang) / 6.2832)'), 'clockwise-from-screen-top fraction');
    /* every uniform the shader reads is declared on the material */
    const m = renderer.indexOf('function _makeTeamReticleMaterial(color, phase, hpColor)');
    assert.ok(m > 0, 'material factory takes the HP colour');
    const mat = renderer.slice(m, m + 1400);
    for (const u of ['uMeters', 'uHp', 'uMp', 'uShield', 'uPrev', 'uPrevHeal', 'uMeterRot', 'uHpCol', 'uMpCol']) {
        assert.ok(mat.includes(u + ':'), 'material uniform ' + u);
    }
});

test('the reticle is seeded, eased per frame, and carries the damage forecast', () => {
    assert.ok(renderer.includes('reticle._ew_reticle = true;'), 'reticle tagged');
    assert.ok(renderer.includes('_seedRingVitals(reticle, unit);'), 'seeded at build');
    assert.ok(/outlines: outlineMeshes, reticle: reticle \}/.test(renderer), 'entry exposes its reticle');
    assert.ok(renderer.includes('_updateRingVitals(_rv, unit, g, cam, curYaw, dtSec)'), 'per-frame update rides _updateUnitFacing');
    assert.ok(renderer.includes('u.uMeterRot.value = camAz + Math.PI - facingYaw;'), 'screen-up angle from camera azimuth minus facing yaw');
    assert.ok(renderer.includes('ret.material.uniforms.uPrev.value = Math.min(_rHp, _ringFrac(info.dmg || 0, _rMax));'), 'damage forecast slice');
    assert.ok(renderer.includes('ret.material.uniforms.uPrevHeal.value = Math.min(1 - _rHp, _ringFrac(info.heal, _rMax));'), 'heal forecast slice');
});

test('plate styles: class at build, live re-plate, side anchor + far-card fallback', () => {
    assert.equal((renderer.match(/\+ _plateStyleClass\(\)/g) || []).length, 2, 'real + decoy plates wear the style class');
    assert.equal((renderer.match(/<div class="tp-side-line"><\/div>/g) || []).length, 2, 'real + decoy plates carry the leader line');
    assert.ok(renderer.includes("return _plateLook.style === 'side' && !holder._farMode;"), 'far card overrides the side style');
    assert.ok(renderer.includes('_writePlateTransform(po, s, projW);') && renderer.includes('_writePlateTransform(_dse, _ds, _dprojW);'), 'both plate loops share the transform writer');
    assert.ok(renderer.includes("'.tp-wrap.tp-compact:not(.tp-far) .tp-bars { display: none; }'"), 'compact hides the bars');
    assert.ok(renderer.includes("'.tp-wrap.tp-side:not(.tp-far) .tp-side-line {'"), 'side shows the line');
});

test('public API + persistence', () => {
    for (const k of ['setRingVitals', 'isRingVitalsOn', 'setPlateStyle', 'getPlateStyle']) {
        assert.ok(new RegExp('^\\s+' + k + ': function', 'm').test(renderer), 'ThreeRenderer.' + k);
    }
    assert.ok(renderer.includes("localStorage.getItem('ew_ringVitals')") && renderer.includes("localStorage.setItem('ew_ringVitals'"), 'ring pref persisted');
    assert.ok(renderer.includes("localStorage.getItem('ew_plateStyle')") && renderer.includes("localStorage.setItem('ew_plateStyle'"), 'plate style persisted');
});

test('settings rows reach both menus', () => {
    assert.ok(map.includes('window._buildVitalsLookHTML = function (refreshJs)'), 'shared builder in map.js');
    assert.ok(map.includes("window._buildVitalsLookHTML('window._openMainMenuSettings();')"), 'main-menu Settings renders it');
    assert.ok(ui.includes("window._buildVitalsLookHTML('_renderPauseMenu();')"), 'pause menu renders it');
    assert.ok(map.includes("ThreeRenderer.setRingVitals(${v})") && map.includes("ThreeRenderer.setPlateStyle('${v}')"), 'buttons call the renderer API');
});
