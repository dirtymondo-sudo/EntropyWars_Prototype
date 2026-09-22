'use strict';
/* THE HDR BLOOM (2026-09-22): the bloom is a property of light sources and VFX, never of albedo. Source guards on the
   pipeline + the threshold arithmetic. Fast — no browser, no three. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const R = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const TP = R('three-post.js'), TR = R('three-renderer.js'), UI = R('ui.js'), IDX = R('index.html');

test('the composer renders LINEAR into a half-float target and a tone map pass follows the bloom (before DoF / AA / cinematic / retro)', () => {
    assert.ok(TP.includes('type: _hdr ? THREE.HalfFloatType : THREE.UnsignedByteType'), 'the HDR target');
    assert.ok(TP.includes('renderer.toneMapping = THREE.NoToneMapping;') && TP.includes('_recompileSceneMaterials();   // r128 keys'), 'the materials stop tone-mapping themselves and rebuild');
    const iBloom = TP.indexOf('_composer.addPass(_bloomPass);'), iTm = TP.indexOf('_composer.addPass(_toneMapPass);'), iDof = TP.indexOf('_composer.addPass(_dofPassH);');
    assert.ok(iBloom > 0 && iTm > iBloom && iDof > iTm, 'bloom → tone map → DoF');
    assert.ok(TP.includes('if (_hdr) _hdrBloomTargets(_bloomPass);'), "the bloom's own mip chain is half-float too");
    assert.ok(/uExposure \/ 0\.6; c = inM \* c; c = rrt\(c\); c = outM \* c;/.test(TP), 'ACES as three r128 writes it');
    assert.ok(TP.includes('gl_FragColor = vec4(enc(m), t.a); }'), 'alpha passes through');
    assert.ok((TP.match(/_tmSync\(\);\n\s+_composer\.render\(\);/g) || []).length === 2, 'the exposure + mode are synced before BOTH composer renders (battle + building)');
    assert.ok(TP.includes("if (!_hdr) _renderer.toneMapping = _filmic ?"), 'the filmic toggle leaves the renderer linear under HDR');
});

test('every bloom threshold site goes through _bloomThrFor; the fallback keeps the LDR constants', () => {
    assert.equal((TP.match(/_bloomPass\.threshold = _bloomThrFor\(/g) || []).length, 3, 'three sites: _applyCurrent, setBloomStrength, renderScene');
    assert.ok(/var HQ_BLOOM_THRESHOLD = 0\.86, HQ_BLOOM_RADIUS = 0\.5;/.test(TP), 'the LDR constants stand');
    assert.ok(!/_bloomPass\.threshold = Math\.min\(_cur\.bloomThr, BLOOM_USER_THRESHOLD\);/.test(TP), 'no bare LDR threshold write survives');
    // the arithmetic: a lit white (the light budget ≈ 1.8 linear) stays under the bar, an emissive past 2.0 crosses
    const enc = (lin) => lin <= 0.0031308 ? lin * 12.92 : 1.055 * Math.pow(lin, 1 / 2.4) - 0.055;
    const m = TP.match(/var BLOOM_HDR_LINEAR = ([\d.]+);/); assert.ok(m, 'the constant');
    const L = parseFloat(m[1]);
    assert.ok(L >= 1.9, 'above the sun + hemi + ambient budget on a white albedo (≈ 1.83)');
    assert.ok(enc(L) > enc(1.83) && enc(L) < enc(3.0), 'the bar sits between a sunlit white and a stacked VFX');
    const fn = new Function('_hdr', 'BLOOM_HDR_LINEAR', '_hdrEnc', TP.match(/function _bloomThrFor\([^]*?\n/)[0] + ' return _bloomThrFor;')(true, L, enc);
    assert.ok(Math.abs(fn(0.86, 0.86) - enc(L)) < 1e-9, 'the default maps to the constant');
    assert.ok(fn(0.7, 0.86) < fn(0.86, 0.86), "a look's lower bar lowers it");
    assert.equal(fn(1.0, 0.86), enc(L), 'never above the constant');
    const fn2 = new Function('_hdr', 'BLOOM_HDR_LINEAR', '_hdrEnc', TP.match(/function _bloomThrFor\([^]*?\n/)[0] + ' return _bloomThrFor;')(false, L, enc);
    assert.equal(fn2(0.72, 0.72), 0.72, 'the LDR fallback is the old number');
});

test('the splitscreen panes draw through renderDirect; the slider steps by 0.01; the default lives under a fresh key', () => {
    assert.ok(TP.includes('renderDirect: renderDirect,') && TP.includes('isHdrBloom: isHdrBloom,'), 'exported');
    assert.ok(TR.includes("ThreePost.renderDirect(scene, p.cam, { x: r.x, y: glY, w: r.w, h: r.h })"), 'the panes');
    assert.ok(/step="1" value="\$\{bloomPct\}"/.test(UI), 'the slider');
    assert.ok(TP.includes("'ew_bloomStrength_v3'") && !TP.includes("'ew_bloomStrength_v2'"), 'v3');
    assert.ok(/var BLOOM_USER_STRENGTH\s+= 0\.3;/.test(TP), 'a real default');
    assert.ok(/\?v=\d{8}[a-z0-9-]*-cors/.test(IDX) && !IDX.includes('20260922-meshy-batch-01-cors'), 'the token moved');
});
